/**
 * Markdown Viewer View
 *
 * Shell-agnostic markdown viewer component.
 * Can be used in any shell to display markdown content.
 * Uses the <md-view> web component for encapsulated rendering.
 */

import { H, normalizeDataAsset, parseDataUrl, isBase64Like } from "fest/lure";
import { ref, affected } from "fest/object";
import { loadAsAdopted, removeAdopted } from "fest/dom";
import DOMPurify from "isomorphic-dompurify";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";
import { createViewState } from "../types";

// Import the md-view web component from fl.ui
import "fest/fl-ui/services/markdown-view/Markdown";

// @ts-ignore - SCSS import
import style from "./index.scss?inline";

let markedParserPromise: Promise<(markdown: string) => Promise<string>> | null = null;

const getMarkedParser = async (): Promise<(markdown: string) => Promise<string>> => {
    if (markedParserPromise) return markedParserPromise;
    markedParserPromise = (async () => {
        const [{ marked }, { default: markedKatex }] = await Promise.all([
            import("marked"),
            import("marked-katex-extension"),
        ]);
        marked?.use?.(
            markedKatex({
                throwOnError: false,
                nonStandard: true,
                output: "mathml",
                strict: false,
            }) as any,
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
        return async (markdown: string) => {
            return await marked.parse(markdown ?? "");
        };
    })();
    return markedParserPromise;
};

// ============================================================================
// VIEWER STATE
// ============================================================================

interface ViewerState {
    content: string;
    filename?: string;
    scrollPosition?: number;
}

const STORAGE_KEY = "rs-viewer-state";
const DEFAULT_CONTENT = "# CrossWord Viewer\n\nOpen a markdown file or paste content here.";

// ============================================================================
// VIEWER OPTIONS
// ============================================================================

export interface ViewerOptions extends BaseViewOptions {
    /** Initial markdown content */
    initialContent?: string;
    /** Filename for display */
    filename?: string;
    /** Enable editing mode */
    editable?: boolean;
    /** Enable print view */
    content?: string;
    /** Title for display */
    title?: string;
    /** Callback when content changes */
    onContentChange?: (content: string) => void;
    /** Callback when copy action is triggered */
    onCopy?: (content: string) => void;
    /** Callback when download action is triggered */
    onDownload?: (content: string, filename?: string) => void;
    /** Callback to attach content to work center */
    onAttachToWorkCenter?: (content: string) => void;
    /** Callback to print content */
    onPrint?: (content: string) => void;
    /** Callback to open file */
    onOpen?: () => void;
}

// ============================================================================
// VIEWER VIEW IMPLEMENTATION
// ============================================================================

export class ViewerView implements View {
    id = "viewer" as const;
    name = "Viewer";
    icon = "eye";

    private options: ViewerOptions;
    private shellContext?: ShellContext;
    private element: HTMLElement | null = null;
    private contentRef = ref("");
    private stateManager = createViewState<ViewerState>(STORAGE_KEY);
    private _sheet: CSSStyleSheet | null = null;
    private pasteController: AbortController | null = null;
    private isViewVisible = false;
    private isPointerInView = false;

    lifecycle: ViewLifecycle = {
        onMount: () => this.onMount(),
        onUnmount: () => this.onUnmount(),
        onShow: () => this.onShow(),
        onHide: () => this.onHide(),
        onRefresh: () => this.onRefresh()
    };

    constructor(options: ViewerOptions = {}) {
        this.options = options;
        this.shellContext = options.shellContext;

        // Load initial content
        const savedState = this.stateManager.load();
        this.contentRef.value = options.initialContent || savedState?.content || DEFAULT_CONTENT;
    }

    render(options?: ViewOptions): HTMLElement {
        // Merge options
        if (options) {
            this.options = { ...this.options, ...options };
            this.shellContext = options.shellContext || this.shellContext;
        }

        // Load styles (idempotent — returns cached sheet)
        this._sheet = loadAsAdopted(style) as CSSStyleSheet;

        // Create main element with md-view web component
        this.element = H`
            <div class="view-viewer">
                <div class="view-viewer__toolbar" data-viewer-toolbar>
                    <div class="view-viewer__toolbar-left">
                        <button class="view-viewer__btn" data-action="open" type="button" title="Open file">
                            <ui-icon icon="folder-open" icon-style="duotone"></ui-icon>
                            <span>Open</span>
                        </button>
                    </div>
                    <div class="view-viewer__toolbar-right">
                        <button class="view-viewer__btn" data-action="copy" type="button" title="Copy raw content">
                            <ui-icon icon="copy" icon-style="duotone"></ui-icon>
                            <span>Copy</span>
                        </button>
                        <button class="view-viewer__btn" data-action="toggle-raw" type="button" title="Toggle raw/rendered view">
                            <ui-icon icon="code" icon-style="duotone"></ui-icon>
                            <span>Raw</span>
                        </button>
                        <button class="view-viewer__btn" data-action="copy-rendered" type="button" title="Copy rendered text">
                            <ui-icon icon="text-t" icon-style="duotone"></ui-icon>
                            <span>Copy text</span>
                        </button>
                        <button class="view-viewer__btn" data-action="download" type="button" title="Download as markdown">
                            <ui-icon icon="download" icon-style="duotone"></ui-icon>
                            <span>Download</span>
                        </button>
                        <button class="view-viewer__btn" data-action="export-docx" type="button" title="Export as DOCX">
                            <ui-icon icon="file-doc" icon-style="duotone"></ui-icon>
                            <span>DOCX</span>
                        </button>
                        <button class="view-viewer__btn" data-action="print" type="button" title="Print content">
                            <ui-icon icon="printer" icon-style="duotone"></ui-icon>
                            <span>Print</span>
                        </button>
                        <button class="view-viewer__btn" data-action="attach" type="button" title="Attach to Work Center">
                            <ui-icon icon="lightning" icon-style="duotone"></ui-icon>
                            <span>Attach</span>
                        </button>
                    </div>
                </div>
                <div class="view-viewer__content" data-viewer-content>
                    <div class="markdown-body markdown-viewer-content result-content" data-render-target></div>
                    <pre class="markdown-viewer-raw" data-raw-target aria-label="Raw content" hidden></pre>
                </div>
            </div>
        ` as HTMLElement;

        // Get references to render and raw targets
        const renderTarget = this.element.querySelector("[data-render-target]") as HTMLElement | null;
        const rawTarget = this.element.querySelector("[data-raw-target]") as HTMLPreElement | null;

        // Setup event handlers
        this.setupEventHandlers(rawTarget || undefined);

        // Set initial content
        if (renderTarget && rawTarget) {
            this.renderMarkdown(this.contentRef.value, renderTarget, rawTarget);
        }

        // Setup reactive updates
        affected(this.contentRef, () => {
            if (renderTarget && rawTarget) {
                this.renderMarkdown(this.contentRef.value, renderTarget, rawTarget);
            }
            this.saveState();
        });

        return this.element;
    }

    getToolbar(): HTMLElement | null {
        // The viewer has its own embedded toolbar
        // Return null to not use shell's toolbar slot
        return null;
    }

    /**
     * Update the displayed content
     */
    setContent(content: string, filename?: string): void {
        this.contentRef.value = content;
        if (filename) {
            this.options.filename = filename;
        }
    }

    /**
     * Get current content
     */
    getContent(): string {
        return this.contentRef.value;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private renderMarkdown(content: string, renderTarget: HTMLElement, rawTarget: HTMLPreElement): void {
        if (!renderTarget) return;

        const looksLikeHtmlDocument = (text: string): boolean => {
            const t = (text || "").trimStart().toLowerCase();
            if (t.startsWith("<!doctype html")) return true;
            if (t.startsWith("<html")) return true;
            if (t.startsWith("<head")) return true;
            if (t.startsWith("<body")) return true;
            if (t.startsWith("<?xml") && t.includes("<html")) return true;
            return false;
        };

        // Update raw view
        if (rawTarget) {
            rawTarget.textContent = content || "";
        }

        // Auto-switch to raw if it looks like HTML
        const container = this.element?.querySelector(".view-viewer__content");
        if (container && looksLikeHtmlDocument(content || "")) {
            container.toggleAttribute("data-raw", true);
            if (rawTarget) rawTarget.hidden = false;
            renderTarget.hidden = true;
            return;
        }

        // Render markdown via lazy parser.
        try {
            const handleParsed = (html: string) => {
                const sanitized = DOMPurify?.sanitize?.((html || "")?.trim?.() || "") || "";
                renderTarget.innerHTML = sanitized;
                console.log('[ViewerView] Markdown rendered successfully');
            };

            const handleError = (error: unknown) => {
                console.error('[ViewerView] Error rendering markdown:', error);
                renderTarget.innerHTML = `<div style="color: red; padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;">Error parsing markdown: ${(error as any)?.message}</div>`;
            };

            getMarkedParser()
                .then((parse) => parse((content || "")?.trim?.() || ""))
                .then(handleParsed)
                .catch(handleError);
        } catch (error) {
            console.error('[ViewerView] Error rendering markdown:', error);
            renderTarget.innerHTML = `<div style="color: red; padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;">Error parsing markdown: ${(error as any)?.message}</div>`;
        }
    }

    private setupEventHandlers(rawElement?: HTMLPreElement): void {
        if (!this.element) return;

        const toolbar = this.element.querySelector("[data-viewer-toolbar]");
        const content = this.element.querySelector("[data-viewer-content]");
        const renderTarget = this.element.querySelector("[data-render-target]") as HTMLElement | null;

        let showRaw = false;

        toolbar?.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-action]") as HTMLButtonElement | null;
            if (!button) return;

            const action = button.dataset.action;
            switch (action) {
                case "open":
                    this.handleOpen();
                    break;
                case "copy":
                    this.handleCopy();
                    break;
                case "toggle-raw":
                    showRaw = !showRaw;
                    if (renderTarget) renderTarget.hidden = showRaw;
                    if (rawElement) rawElement.hidden = !showRaw;
                    content?.toggleAttribute("data-raw", showRaw);
                    break;
                case "copy-rendered":
                    if (renderTarget) {
                        this.handleCopyRendered(renderTarget);
                    }
                    break;
                case "download":
                    this.handleDownload();
                    break;
                case "export-docx":
                    void this.handleExportDocx();
                    break;
                case "print":
                    if (renderTarget) {
                        this.handlePrint(renderTarget);
                    }
                    break;
                case "attach":
                    this.handleAttachToWorkCenter();
                    break;
            }
        });

        // Setup drag and drop
        if (content) {
            content.addEventListener("mouseenter", () => {
                this.isPointerInView = true;
            });

            content.addEventListener("mouseleave", () => {
                this.isPointerInView = false;
            });

            content.addEventListener("dragover", (e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.add("dragover");
            });

            content.addEventListener("dragleave", () => {
                (content as HTMLElement).classList.remove("dragover");
            });

            content.addEventListener("drop", (e) => {
                e.preventDefault();
                (content as HTMLElement).classList.remove("dragover");
                this.handleFileDrop(e as DragEvent);
            });
        }

        // Setup paste handling
        this.pasteController?.abort();
        this.pasteController = new AbortController();
        document.addEventListener("paste", (e) => {
            void this.handlePaste(e as ClipboardEvent);
        }, { signal: this.pasteController.signal });
    }

    private handleOpen(): void {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                try {
                    const content = await file.text();
                    this.setContent(content);
                    this.showMessage(`Opened ${file.name}`);
                } catch (error) {
                    console.error("[ViewerView] Failed to read file:", error);
                    this.showMessage("Failed to read file");
                }
            }
        };
        input.click();
    }

    private async handleCopy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.contentRef.value);
            this.showMessage("Copied raw content to clipboard");
            this.options.onCopy?.(this.contentRef.value);
        } catch (error) {
            console.error("[ViewerView] Failed to copy:", error);
            this.showMessage("Failed to copy to clipboard");
        }
    }

    private handleCopyRendered(renderTarget: HTMLElement): void {
        const text = (renderTarget?.innerText || "").trim();
        if (!text) {
            this.showMessage("No content to copy");
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage("Copied rendered text to clipboard");
        }).catch(() => {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.append(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
            this.showMessage("Copied rendered text to clipboard");
        });
    }

    private handleDownload(): void {
        const content = this.contentRef.value;
        const filename = this.options.filename || `document-${Date.now()}.md`;

        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 250);

        this.showMessage(`Downloaded ${filename}`);
        this.options.onDownload?.(content, filename);
    }

    private async handleExportDocx(): Promise<void> {
        const content = this.contentRef.value;
        if (!content.trim()) {
            this.showMessage("No content to export");
            return;
        }
        try {
            const { downloadMarkdownAsDocx } = await import("../../../core/document/DocxExport");
            await downloadMarkdownAsDocx(content, {
                title: this.options.filename || "Markdown Content",
                filename: `document-${Date.now()}.docx`,
            });
            this.showMessage("Exported as DOCX successfully");
        } catch (error) {
            console.error("[ViewerView] Failed to export DOCX:", error);
            this.showMessage("Failed to export as DOCX");
        }
    }

    private handlePrint(renderTarget: HTMLElement): void {
        try {
            if (renderTarget) {
                renderTarget.setAttribute('data-print', 'true');
                window.print();
                setTimeout(() => {
                    renderTarget.removeAttribute('data-print');
                }, 1000);
            } else {
                window.print();
            }
            this.options.onPrint?.(this.contentRef.value);
        } catch (error) {
            console.error("[ViewerView] Error printing content:", error);
            this.showMessage("Failed to print");
        }
    }

    private handleAttachToWorkCenter(): void {
        this.options.onAttachToWorkCenter?.(this.contentRef.value);
        this.shellContext?.navigate("workcenter");
        this.showMessage("Content attached to Work Center");
    }

    private handleFileDrop(e: DragEvent): void {
        const file = e.dataTransfer?.files?.[0];
        if (file && (file.type.includes("text") || file.name.endsWith(".md"))) {
            file.text().then(content => {
                this.setContent(content);
                this.showMessage(`Loaded ${file.name}`);
            }).catch(() => {
                this.showMessage("Failed to read dropped file");
            });
        }
    }

    private async handlePaste(e: ClipboardEvent): Promise<void> {
        if (!this.shouldHandlePaste(e)) return;
        if (!e.clipboardData) return;

        const itemFiles = Array.from(e.clipboardData.items || [])
            .map((item) => item.kind === "file" && item.getAsFile ? item.getAsFile() : null)
            .filter((file): file is File => !!file);
        const files = itemFiles.length > 0 ? itemFiles : Array.from(e.clipboardData.files || []);

        if (files.length > 0) {
            const textFile = files.find((file) => this.isTextLikeFile(file)) || files[0];
            e.preventDefault();
            e.stopPropagation();
            try {
                if (!this.isTextLikeFile(textFile)) {
                    this.showMessage(`Unsupported file type for viewer: ${textFile.name || textFile.type || "binary file"}`);
                    return;
                }
                const content = await textFile.text();
                this.setContent(content, textFile.name);
                this.showMessage(`Opened ${textFile.name || "pasted document"}`);
                return;
            } catch (error) {
                console.error("[ViewerView] Failed to read pasted file:", error);
                this.showMessage("Failed to read pasted file");
                return;
            }
        }

        const text = e.clipboardData.getData("text/plain");
        if (!text || !text.trim()) return;

        e.preventDefault();
        e.stopPropagation();

        try {
            const raw = text.trim();
            if (parseDataUrl(raw) || isBase64Like(raw)) {
                const asset = await normalizeDataAsset(raw, {
                    namePrefix: "pasted-doc",
                    uriComponent: true
                });
                if (!this.isTextLikeFile(asset.file)) {
                    this.showMessage("Pasted data is not a text/markdown document");
                    return;
                }
                const content = await asset.file.text();
                this.setContent(content, asset.file.name);
                this.showMessage("Opened pasted encoded document");
                return;
            }

            this.setContent(raw);
            this.showMessage("Content pasted");
        } catch (error) {
            console.error("[ViewerView] Failed to process pasted data:", error);
            this.showMessage("Failed to process pasted content");
        }
    }

    private isTextLikeFile(file: File): boolean {
        const name = (file.name || "").toLowerCase();
        const type = (file.type || "").toLowerCase();

        if (!type || type.startsWith("text/")) return true;
        if (type.includes("markdown") || type.includes("json") || type.includes("xml")) return true;

        return [
            ".md",
            ".markdown",
            ".txt",
            ".json",
            ".xml",
            ".html",
            ".htm",
            ".css",
            ".js",
            ".ts",
            ".tsx",
            ".yml",
            ".yaml"
        ].some((ext) => name.endsWith(ext));
    }

    private shouldHandlePaste(e: ClipboardEvent): boolean {
        if (!this.element || !this.isViewVisible) return false;
        if (document.visibilityState !== "visible") return false;
        if (this.shellContext?.navigationState?.currentView && this.shellContext.navigationState.currentView !== this.id) return false;

        const target = e.target as HTMLElement | null;
        if (!target) return false;

        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return false;
        }

        const hasFocusWithinView = this.element.contains(document.activeElement);
        const targetInView = this.element.contains(target);
        const hoverWithinView = this.isPointerInView || this.element.matches(":hover");

        return targetInView || hasFocusWithinView || hoverWithinView;
    }

    private saveState(): void {
        this.stateManager.save({
            content: this.contentRef.value,
            filename: this.options.filename
        });
    }

    private showMessage(message: string): void {
        if (this.shellContext) {
            this.shellContext.showMessage(message);
        } else {
            console.log(`[Viewer] ${message}`);
        }
    }

    // ========================================================================
    // LIFECYCLE METHODS
    // ========================================================================

    private onMount(): void {
        console.log("[Viewer] Mounted");
        this._sheet ??= loadAsAdopted(style) as CSSStyleSheet;
        this.isViewVisible = true;
    }

    private onUnmount(): void {
        console.log("[Viewer] Unmounting");
        this.saveState();
        this.isViewVisible = false;
        this.isPointerInView = false;
        this.pasteController?.abort();
        this.pasteController = null;
        removeAdopted(this._sheet!);
        this.element = null;
    }

    private onShow(): void {
        this._sheet ??= loadAsAdopted(style) as CSSStyleSheet;
        this.isViewVisible = true;
        console.log("[Viewer] Shown");
    }

    private onHide(): void {
        //removeAdopted(this._sheet);
        this.saveState();
        this.isViewVisible = false;
        this.isPointerInView = false;
        console.log("[Viewer] Hidden");
    }

    private onRefresh(): void {
        const renderTarget = this.element?.querySelector("[data-render-target]") as HTMLElement | null;
        const rawTarget = this.element?.querySelector("[data-raw-target]") as HTMLPreElement | null;
        if (renderTarget && rawTarget) {
            this.renderMarkdown(this.contentRef.value, renderTarget, rawTarget);
        }
    }

    // ========================================================================
    // MESSAGE HANDLING
    // ========================================================================

    canHandleMessage(messageType: string): boolean {
        return ["content-view", "content-load", "markdown-content", "content-share", "share-target-input"].includes(messageType);
    }

    async handleMessage(message: unknown): Promise<void> {
        const msg = message as { type?: string; data?: { text?: string; content?: string; filename?: string; url?: string } };

        if (msg.data?.text || msg.data?.content || msg.data?.url) {
            const content = msg.data.text || msg.data.content || msg.data.url || "";
            this.setContent(content, msg.data.filename);
        }
    }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Document type for viewer (content + metadata)
 */
export interface ViewerDocument {
    content: string;
    filename?: string;
    mimeType?: string;
    lastModified?: number;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a viewer view instance
 */
export function createView(options?: ViewerOptions): ViewerView {
    return new ViewerView(options);
}

/** Alias for createView */
export const createMarkdownView = createView;

export default createView;
