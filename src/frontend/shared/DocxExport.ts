import {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    HeadingLevel,
    LevelFormat,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";

export type DocxExportOptions = {
    title?: string;
    filename?: string;
    creator?: string;
};

let markedConfigured = false;

const ORDERED_LIST_REF = "cw-ordered-list";

function ensureMarkedConfigured(): void {
    if (markedConfigured) return;
    markedConfigured = true;

    marked?.use?.(
        markedKatex({
            throwOnError: false,
            nonStandard: true,
            output: "mathml",
            strict: false,
        }) as unknown as MarkedExtension,
        {
            hooks: {
                preprocess: (markdown: string): string => {
                    if (/\\(.*\\)|\\[.*\\]/.test(markdown)) {
                        const katexNode = document.createElement("div");
                        katexNode.innerHTML = markdown;
                        renderMathInElement(katexNode, {
                            throwOnError: false,
                            nonStandard: true,
                            output: "mathml",
                            strict: false,
                            delimiters: [
                                { left: "$$", right: "$$", display: true },
                                { left: "\\[", right: "\\]", display: true },
                                { left: "$", right: "$", display: false },
                                { left: "\\(", right: "\\)", display: false },
                            ],
                        });
                        return katexNode.innerHTML;
                    }
                    return markdown;
                },
            },
        }
    );
}

function safeFilename(name: string): string {
    const trimmed = (name || "").trim() || "document";
    return trimmed.replace(/[\\/:*?"<>|\u0000-\u001F]+/g, "-").slice(0, 180);
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 250);
}

async function markdownToHtml(markdown: string): Promise<string> {
    ensureMarkedConfigured();
    return await marked.parse(markdown ?? "", { gfm: true, breaks: true });
}

function htmlToBody(html: string): HTMLElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html ?? "", "text/html");
    return doc.body;
}

type InlineStyle = {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
};

type InlineChild = TextRun | ExternalHyperlink;
type BlockChild = Paragraph | Table;

function textRun(text: string, style: InlineStyle): TextRun {
    const preserve = /^\s|\s$/.test(text);
    return new TextRun({
        text,
        bold: !!style.bold,
        italics: !!style.italic,
        font: style.code ? "Consolas" : undefined,
        preserve,
    });
}

function collectInline(node: Node, style: InlineStyle, out: InlineChild[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue ?? "";
        if (!text) return;
        out.push(textRun(text, style));
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "br") {
        out.push(new TextRun({ break: 1 }));
        return;
    }

    if (tag === "strong" || tag === "b") {
        for (const child of Array.from(el.childNodes)) collectInline(child, { ...style, bold: true }, out);
        return;
    }

    if (tag === "em" || tag === "i") {
        for (const child of Array.from(el.childNodes)) collectInline(child, { ...style, italic: true }, out);
        return;
    }

    // Inline code (block code handled by <pre>)
    if (tag === "code" && el.parentElement?.tagName.toLowerCase() !== "pre") {
        const text = el.textContent ?? "";
        if (text) out.push(textRun(text, { ...style, code: true }));
        return;
    }

    if (tag === "a") {
        const href = (el.getAttribute("href") || "").trim();
        const children: TextRun[] = [];
        const tmp: InlineChild[] = [];
        for (const child of Array.from(el.childNodes)) collectInline(child, style, tmp);
        for (const c of tmp) {
            if (c instanceof TextRun) children.push(c);
            else children.push(new TextRun({ text: (el.textContent || href || "").trim() || href, style: "Hyperlink" }));
        }

        out.push(
            new ExternalHyperlink({
                link: href || (el.textContent || "").trim() || "",
                children: children.length ? children : [new TextRun({ text: href || "link", style: "Hyperlink" })],
            })
        );
        return;
    }

    // Keep MathML / SVG etc as plain text fallback
    if (tag === "math" || tag === "svg") {
        const text = (el.textContent || "").trim();
        if (text) out.push(textRun(text, style));
        return;
    }

    for (const child of Array.from(el.childNodes)) collectInline(child, style, out);
}

function paragraphFromInlineNodes(nodes: ArrayLike<Node>, options?: Partial<ConstructorParameters<typeof Paragraph>[0]>): Paragraph {
    const children: InlineChild[] = [];
    for (const n of Array.from(nodes)) collectInline(n, {}, children);

    return new Paragraph({
        ...(options || {}),
        children: children.length ? children : [new TextRun({ text: "" })],
    });
}

function headingLevelFromTag(tag: string): HeadingLevel | undefined {
    if (tag === "h1") return HeadingLevel.HEADING_1;
    if (tag === "h2") return HeadingLevel.HEADING_2;
    if (tag === "h3") return HeadingLevel.HEADING_3;
    if (tag === "h4") return HeadingLevel.HEADING_4;
    if (tag === "h5") return HeadingLevel.HEADING_5;
    if (tag === "h6") return HeadingLevel.HEADING_6;
    return undefined;
}

function convertList(listEl: HTMLElement, ordered: boolean, level: number): BlockChild[] {
    const out: BlockChild[] = [];
    const items = Array.from(listEl.children).filter((c) => c.tagName.toLowerCase() === "li") as HTMLElement[];

    for (const li of items) {
        const nestedLists = Array.from(li.children).filter((c) => {
            const t = c.tagName.toLowerCase();
            return t === "ul" || t === "ol";
        }) as HTMLElement[];

        const inlineNodes: Node[] = [];
        for (const child of Array.from(li.childNodes)) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const t = (child as HTMLElement).tagName.toLowerCase();
                if (t === "ul" || t === "ol") continue;
            }
            inlineNodes.push(child);
        }

        const left = 720 * Math.max(1, level + 1);
        const hanging = 360;
        out.push(
            paragraphFromInlineNodes(inlineNodes, {
                bullet: ordered ? undefined : { level },
                numbering: ordered ? { reference: ORDERED_LIST_REF, level } : undefined,
                indent: { left, hanging },
            })
        );

        for (const nested of nestedLists) {
            const t = nested.tagName.toLowerCase();
            out.push(...convertList(nested, t === "ol", level + 1));
        }
    }

    return out;
}

function convertTable(tableEl: HTMLElement): Table {
    const rows = Array.from(tableEl.querySelectorAll("tr")).map((tr) => {
        const cells = Array.from(tr.children).filter((c) => {
            const t = c.tagName.toLowerCase();
            return t === "td" || t === "th";
        }) as HTMLElement[];

        return new TableRow({
            children: cells.map((cellEl) => {
                const children: BlockChild[] = [];
                // Prefer block-level children inside a cell; fallback to a single paragraph.
                const hasBlock = Array.from(cellEl.children).some((c) => {
                    const t = c.tagName.toLowerCase();
                    return t === "p" || t === "ul" || t === "ol" || t === "pre" || t === "blockquote" || t === "div";
                });

                if (hasBlock) {
                    for (const c of Array.from(cellEl.childNodes)) {
                        children.push(...convertBlockNode(c, 0));
                    }
                } else {
                    children.push(paragraphFromInlineNodes(cellEl.childNodes));
                }

                return new TableCell({
                    width: { size: 1, type: WidthType.AUTO },
                    children,
                });
            }),
        });
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
    });
}

function convertPre(preEl: HTMLElement): Paragraph[] {
    const codeEl = preEl.querySelector("code");
    const text = (codeEl?.textContent ?? preEl.textContent ?? "").replace(/\r\n/g, "\n");
    const lines = text.split("\n");
    const paras: Paragraph[] = [];

    for (const line of lines) {
        paras.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        font: "Consolas",
                        preserve: true,
                    }),
                ],
                spacing: { before: 0, after: 0 },
                border: {
                    left: { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" },
                },
                shading: { fill: "F3F4F6", color: "auto" } as any,
            })
        );
    }
    return paras;
}

function convertBlockNode(node: Node, listLevel: number): BlockChild[] {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.nodeValue ?? "").trim();
        if (!text) return [];
        return [new Paragraph({ children: [textRun(text, {})] })];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "p") return [paragraphFromInlineNodes(el.childNodes)];

    const heading = headingLevelFromTag(tag);
    if (heading) {
        return [
            paragraphFromInlineNodes(el.childNodes, {
                heading,
                spacing: { before: 200, after: 120 },
            }),
        ];
    }

    if (tag === "hr") {
        return [
            new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" } },
                spacing: { before: 200, after: 200 },
            }),
        ];
    }

    if (tag === "blockquote") {
        const out: BlockChild[] = [];
        const quoteDecor = {
            indent: { left: 720 },
            border: { left: { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB" } },
        } as const;

        for (const child of Array.from(el.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                const t = (child.nodeValue ?? "").trim();
                if (t) out.push(new Paragraph({ ...quoteDecor, children: [textRun(t, {})] }));
                continue;
            }

            if (child.nodeType !== Node.ELEMENT_NODE) continue;
            const ce = child as HTMLElement;
            const ct = ce.tagName.toLowerCase();

            if (ct === "p") {
                out.push(paragraphFromInlineNodes(ce.childNodes, quoteDecor));
                continue;
            }

            const heading = headingLevelFromTag(ct);
            if (heading) {
                out.push(
                    paragraphFromInlineNodes(ce.childNodes, {
                        ...quoteDecor,
                        heading,
                        spacing: { before: 200, after: 120 },
                    })
                );
                continue;
            }

            if (ct === "ul" || ct === "ol") {
                out.push(...convertList(ce, ct === "ol", listLevel));
                continue;
            }

            if (ct === "pre") {
                const codeEl = ce.querySelector("code");
                const text = (codeEl?.textContent ?? ce.textContent ?? "").replace(/\r\n/g, "\n");
                const lines = text.split("\n");
                for (const line of lines) {
                    out.push(
                        new Paragraph({
                            ...quoteDecor,
                            children: [new TextRun({ text: line, font: "Consolas", preserve: true })],
                            spacing: { before: 0, after: 0 },
                            shading: { fill: "F3F4F6", color: "auto" } as any,
                        })
                    );
                }
                continue;
            }

            const t = (ce.textContent ?? "").trim();
            if (t) out.push(new Paragraph({ ...quoteDecor, children: [textRun(t, {})] }));
        }

        return out.length ? out : [new Paragraph({ ...quoteDecor, children: [textRun((el.textContent || "").trim(), {})] })];
    }

    if (tag === "pre") return convertPre(el);

    if (tag === "ul") return convertList(el, false, listLevel);
    if (tag === "ol") return convertList(el, true, listLevel);

    if (tag === "table") return [convertTable(el)];

    if (tag === "img") {
        const alt = (el.getAttribute("alt") || "").trim();
        const src = (el.getAttribute("src") || "").trim();
        return [
            new Paragraph({
                children: [textRun(`[image${alt ? `: ${alt}` : ""}] ${src ? `(${src})` : ""}`.trim(), {})],
            }),
        ];
    }

    // Common wrappers like div/section/article: recurse, but keep structure
    if (tag === "div" || tag === "section" || tag === "article" || tag === "main") {
        const out: BlockChild[] = [];
        for (const child of Array.from(el.childNodes)) {
            out.push(...convertBlockNode(child, listLevel));
        }
        return out;
    }

    return [paragraphFromInlineNodes(el.childNodes)];
}

export async function createDocxBlobFromHtml(html: string, options: DocxExportOptions = {}): Promise<Blob> {
    const title = options.title || "Document";
    const body = htmlToBody(html);
    const children: BlockChild[] = [];

    for (const node of Array.from(body.childNodes)) {
        children.push(...convertBlockNode(node, 0));
    }

    const doc = new Document({
        creator: options.creator || "CrossWord",
        title,
        numbering: {
            config: [
                {
                    reference: ORDERED_LIST_REF,
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            alignment: AlignmentType.LEFT,
                        },
                        {
                            level: 1,
                            format: LevelFormat.LOWER_LETTER,
                            text: "%2.",
                            alignment: AlignmentType.LEFT,
                        },
                        {
                            level: 2,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%3.",
                            alignment: AlignmentType.LEFT,
                        },
                    ],
                },
            ],
        },
        sections: [{ children }],
    });

    return await Packer.toBlob(doc);
}

export async function createDocxBlobFromMarkdown(markdown: string, options: DocxExportOptions = {}): Promise<Blob> {
    const html = await markdownToHtml(markdown ?? "");
    return await createDocxBlobFromHtml(html, options);
}

export async function downloadMarkdownAsDocx(markdown: string, options: DocxExportOptions = {}): Promise<void> {
    const title = options.title || "Document";
    const filename = options.filename || `${safeFilename(title)}.docx`;
    const blob = await createDocxBlobFromMarkdown(markdown ?? "", options);
    downloadBlob(blob, filename);
}

export async function downloadHtmlAsDocx(html: string, options: DocxExportOptions = {}): Promise<void> {
    const title = options.title || "Document";
    const filename = options.filename || `${safeFilename(title)}.docx`;
    const blob = await createDocxBlobFromHtml(html ?? "", options);
    downloadBlob(blob, filename);
}

