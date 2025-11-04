import { H } from "fest/lure";
import type { DocEntry, DocParser } from "./Types";

const toStringSafe = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const stripMarkdown = (value: unknown): string => {
    const input = toStringSafe(value);
    if (!input) return "";
    return input
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^\)]+\)/g, " ")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/(^|\n)\s{0,3}>\s?/g, "$1")
        .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, "$1")
        .replace(/(^|\n)\s{0,3}[-*+]\s+/g, "$1")
        .replace(/(^|\n)\s{0,3}\d+\.\s+/g, "$1")
        .replace(/(^|\n)---[\s\S]*?---(?=\n|$)/g, "$1")
        .replace(/[\\*_~]/g, "")
        .replace(/`/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/<\/?[^>]+>/g, " ");
};


const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const sanitizeDocSnippet = (value: unknown): string => collapseWhitespace(stripMarkdown(value));

export const truncateDocSnippet = (value: string, limit = 260): string => {
    const trimmed = value.trim();
    if (!limit || trimmed.length <= limit) return trimmed;
    return `${trimmed.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
};

//
export const parseMarkdownEntry: DocParser = async ({ collection, file, filePath }) => {
    const text = await file.text();
    const rawTitleLine = text.trim().split(/\r?\n/).find((line) => line.trim().length) || "";
    const sanitizedTitle = sanitizeDocSnippet(rawTitleLine);
    const fallbackTitle = sanitizeDocSnippet(file.name.replace(/\.[^.]+$/, "")) || file.name;
    const title = sanitizedTitle || fallbackTitle;
    const summarySource = text.trim().split(/\r?\n/).slice(0, 6).join(" ");
    const summary = truncateDocSnippet(sanitizeDocSnippet(summarySource));
    const sanitizedBody = sanitizeDocSnippet(text);

    //
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const $setter = (el) => {
        el?.renderMarkdown?.(text);
    }

    const entry: DocEntry = {
        id: `${collection.id}:${filePath}`,
        title,
        subtitle: formatDateTime(file.lastModified),
        summary: summary || undefined,
        path: filePath,
        fileName: file.name,
        collectionId: collection.id,
        modifiedAt: file.lastModified,
        wordCount,
        searchText: [title, summary, truncateDocSnippet(sanitizedBody, 20000)].filter(Boolean).join(" \n").toLowerCase(),
        renderPreview: (container) => {
            container.replaceChildren(
                H`<div class="doc-preview-frame">
                    <header class="doc-preview-header">
                        <div>
                            <h2>${title || file.name}</h2>
                            <p class="doc-subtitle">Updated ${formatDateTime(file.lastModified)}</p>
                        </div>
                        ${wordCount ? H`<span class="doc-meta-tag">${wordCount} words</span>` : null}
                    </header>
                    <md-view ref=${$setter} src=${url}></md-view>
                </div>`
            );
        },
        //dispose: () => URL.revokeObjectURL(url),
        raw: text
    };

    return entry;
};
