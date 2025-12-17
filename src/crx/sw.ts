import { createTimelineGenerator, requestNewTimeline } from "@rs-core/service/AI-ops/MakeTimeline";
import { enableCapture } from "./service/api";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { recognizeImageData } from "./service/RecognizeData";

//
enableCapture(chrome);

const VIEWER_PAGE = "markdown/viewer.html";
const VIEWER_ORIGIN = chrome.runtime.getURL("");
const VIEWER_URL = chrome.runtime.getURL(VIEWER_PAGE);
const MARKDOWN_EXTENSION_PATTERN = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;
const MD_VIEW_MENU_ID = "crossword:markdown-view";

const isMarkdownUrl = (candidate?: string | null): candidate is string => {
    if (!candidate || typeof candidate !== "string") return false;
    try {
        const url = new URL(candidate);
        if (url.protocol === "chrome-extension:") return false;
        if (!["http:", "https:", "file:", "ftp:"].includes(url.protocol)) return false;
        return MARKDOWN_EXTENSION_PATTERN.test(url.pathname);
    } catch {
        return false;
    }
};

const toViewerUrl = (source?: string | null) => {
    if (!source) return VIEWER_URL;
    return `${VIEWER_URL}?src=${encodeURIComponent(source)}`;
};

const openViewer = (source?: string | null, destinationTabId?: number) => {
    const url = toViewerUrl(source ?? undefined);
    if (typeof destinationTabId === "number") {
        chrome.tabs.update(destinationTabId, { url })?.catch?.(console.warn.bind(console));
    } else {
        chrome.tabs.create({ url })?.catch?.(console.warn.bind(console));
    }
};

const CTX_CONTEXTS: chrome.contextMenus.ContextType[] = [
    "all",
    "page",
    "frame",
    "selection",
    "link",
    "editable",
    "image",
    "video",
    "audio",
    "action",
];

const CTX_ITEMS: Array<{ id: string; title: string }> = [
    { id: "copy-as-latex", title: "Copy as LaTeX" },
    { id: "copy-as-mathml", title: "Copy as MathML" },
    { id: "copy-as-markdown", title: "Copy as Markdown" },
    { id: "copy-as-html", title: "Copy as HTML" },
    { id: "START_SNIP", title: "Snip and Recognize (AI, Markdown)" },
];

// Handle messages from Extension UI or Content Scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MAKE_TIMELINE') {
        const source = message.source || null;
        const speechPrompt = message.speechPrompt || null;
        createTimelineGenerator(source, speechPrompt).then(async (gptResponses) => {
            sendResponse(await (requestNewTimeline(gptResponses as GPTResponses) as unknown as any[] || []));
        }).catch((error) => {
            console.error("Timeline generation failed:", error);
            sendResponse({ error: error.message });
        });
        return true; // Indicates that the response is asynchronous
    }

    if (message?.type === "gpt:recognize") {
        recognizeImageData(message?.input, (result) => {
            // keep CrossHelp-compatible shape: res.data.output[...]
            sendResponse({ ok: result?.ok, data: result?.raw, error: result?.error });
        })?.catch?.((e) => sendResponse({ ok: false, error: String(e) }));
        return true;
    }
});

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
    for (const item of CTX_ITEMS) {
        try {
            chrome.contextMenus.create({
                id: item.id,
                title: item.title,
                visible: true,
                contexts: CTX_CONTEXTS,
            });
        } catch (e) {
            console.warn(e);
        }
    }

    try {
        chrome.contextMenus.create({
            id: MD_VIEW_MENU_ID,
            title: "Open in Markdown Viewer",
            contexts: ["link", "page"],
            targetUrlPatterns: [
                "*://*/*.md",
                "*://*/*.markdown",
                "file://*/*.md",
                "file://*/*.markdown",
            ],
        });
    } catch (e) {
        console.warn(e);
    }

    // Add settings shortcut if needed, though it's usually in the popup
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    const tabId = tab?.id;
    if (tabId == null) return;

    if (info.menuItemId === MD_VIEW_MENU_ID) {
        const candidate = (info as any).linkUrl || (info as any).pageUrl;
        openViewer(typeof candidate === "string" ? candidate : null, tabId);
        return;
    }

    chrome.tabs
        .sendMessage(tabId, { type: String(info.menuItemId) })
        ?.catch?.((err) => console.warn("Could not send message to tab", tabId, err));
});

chrome.webNavigation?.onCommitted?.addListener?.((details) => {
    if (details.frameId !== 0) return;
    const { tabId, url } = details;
    if (!isMarkdownUrl(url)) return;
    if (url.startsWith(VIEWER_ORIGIN)) return;
    openViewer(url, tabId);
});
