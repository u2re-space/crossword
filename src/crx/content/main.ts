/**
 * CrossWord — Content Script Entry
 *
 * Injected into every page at document_start.
 * Handles:
 *  - Overlay + toast initialization
 *  - Copy-as-* operations (LaTeX, MathML, Markdown, HTML)
 *  - Snip & recognize (rect selection → capture → AI)
 *  - Rect-selector global registration
 *  - CRX result pipeline delivery (notifications)
 *  - Coordinate / element tracking for context-menu operations
 */

import { showToast, initOverlay } from "@rs-frontend/main/overlay";
import { initToastReceiver } from "@rs-frontend/items/Toast";
import { initClipboardReceiver } from "@rs-core/modules/Clipboard";
import { copyAsHTML, copyAsMathML, copyAsMarkdown, copyAsTeX } from "@rs-core/document/Conversion";

// Content-script modules
import "./copy";           // COPY_HACK handler
import "./rect-selector";  // global crxSnipSelectRect
import "./snip";           // START_SNIP / SOLVE_AND_ANSWER / WRITE_CODE / EXTRACT_CSS / CUSTOM_INSTRUCTION

// ---------------------------------------------------------------------------
// Init overlay & broadcast receivers
// ---------------------------------------------------------------------------

initOverlay();
const cleanupToast = initToastReceiver();
const cleanupClipboard = initClipboardReceiver();

if (typeof window !== "undefined") {
    globalThis?.addEventListener?.("pagehide", () => { cleanupToast?.(); cleanupClipboard?.(); }, { once: true });
}

// ---------------------------------------------------------------------------
// Coordinate / element tracking (for context-menu hit-testing)
// ---------------------------------------------------------------------------

const coordinate: [number, number] = [0, 0];
let lastElement: HTMLElement | null = null;
let selectionNotifyTimer: ReturnType<typeof setTimeout> | null = null;
let lastSelectionKey = "0";

const notifySelectionState = () => {
    const selectedText = (typeof window != "undefined" ? window : globalThis)?.getSelection?.()?.toString?.() || "";
    const trimmed = selectedText.trim();
    const hasSelection = Boolean(trimmed);
    const length = trimmed.length;
    const nextKey = `${hasSelection ? "1" : "0"}-${length}`;
    if (nextKey === lastSelectionKey) return;
    lastSelectionKey = nextKey;
    try {
        chrome.runtime.sendMessage({ type: "crx-selection-change", hasSelection, length });
    } catch {
        // ignore
    }
};

document.addEventListener("selectionchange", () => {
    if (selectionNotifyTimer) clearTimeout(selectionNotifyTimer);
    selectionNotifyTimer = setTimeout(() => notifySelectionState(), 120);
});
setTimeout(() => notifySelectionState(), 120);

const savePosition = (e: PointerEvent | MouseEvent) => {
    coordinate[0] = e.clientX;
    coordinate[1] = e.clientY;
    lastElement = e.target as HTMLElement | null;
};

document.addEventListener("pointerdown", savePosition, { passive: true, capture: true });
document.addEventListener("pointerup", savePosition, { passive: true, capture: true });
document.addEventListener("click", savePosition as EventListener, { passive: true, capture: true });
document.addEventListener("contextmenu", (e) => {
    savePosition(e);
    lastElement = (e.target as HTMLElement) || lastElement;
}, { passive: true, capture: true });

// ---------------------------------------------------------------------------
// Copy-as-* operations (context menu → content script)
// ---------------------------------------------------------------------------

const copyOps = new Map<string, (el: HTMLElement) => unknown>([
    ["copy-as-latex", copyAsTeX],
    ["copy-as-mathml", copyAsMathML],
    ["copy-as-markdown", copyAsMarkdown],
    ["copy-as-html", copyAsHTML],
]);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // Selection query
    if (msg?.type === "highlight-selection") {
        sendResponse({ selection: (typeof window != "undefined" ? window : globalThis)?.getSelection()?.toString?.() ?? "" });
        return true;
    }

    // Copy-as-* operations
    if (typeof msg?.type === "string" && copyOps.has(msg.type)) {
        (async () => {
            const op = copyOps.get(msg.type)!;
            const target =
                lastElement ||
                (document.elementFromPoint(coordinate[0], coordinate[1]) as HTMLElement | null) ||
                document.body;

            try {
                const mayTranslate = msg.type === "copy-as-markdown" || msg.type === "copy-as-html";
                if (mayTranslate) showToast("Processing...");
                await op(target);
                showToast("Copied");
                sendResponse({ ok: true });
            } catch (e) {
                console.warn("[Content] Copy operation failed:", e);
                showToast("Failed to copy");
                sendResponse({ ok: false });
            }
        })();
        return true;
    }

    return false;
});

// ---------------------------------------------------------------------------
// Rect-selector for CRX-Snip (triggered by popup)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "crx-snip-select-rect") return false;

    (async () => {
        try {
            if (!(typeof window != "undefined" ? window : globalThis).crxSnipSelectRect) await new Promise((r) => setTimeout(r, 100));
            if (!(typeof window != "undefined" ? window : globalThis).crxSnipSelectRect) throw new Error("Rect selector not available");
            sendResponse({ rect: await (typeof window != "undefined" ? window : globalThis)?.crxSnipSelectRect?.() });
        } catch (e) {
            sendResponse({ rect: null, error: e instanceof Error ? e.message : String(e) });
        }
    })();
    return true;
});

// ---------------------------------------------------------------------------
// CRX result pipeline delivery (page notifications)
// ---------------------------------------------------------------------------

const showPageNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    try {
        document.querySelectorAll(".crossword-crx-notification").forEach((el) => el.remove());

        const colors = { success: "#10b981", error: "#ef4444", info: "#3b82f6" };
        const icons = { success: "✅", error: "❌", info: "ℹ️" };

        const el = document.createElement("div");
        el.className = "crossword-crx-notification";
        Object.assign(el.style, {
            position: "fixed", top: "20px", right: "20px",
            backgroundColor: colors[type], color: "white",
            padding: "16px 20px", borderRadius: "8px",
            fontSize: "14px", fontFamily: "system-ui, sans-serif", fontWeight: "500",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: "2147483647",
            maxWidth: "450px", wordWrap: "break-word",
            opacity: "0", transform: "translateY(-20px) scale(0.95)",
            transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
            cursor: "pointer",
        });
        el.innerHTML = `<div style="display:flex;align-items:center;gap:12px"><span style="font-size:18px">${icons[type]}</span><div style="flex:1;line-height:1.4">${message}</div></div>`;
        el.addEventListener("click", () => { el.style.opacity = "0"; el.style.transform = "translateY(-20px) scale(0.95)"; setTimeout(() => el.remove(), 400); });

        (document.body || document.documentElement).appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0) scale(1)"; });
        setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(-20px) scale(0.95)"; setTimeout(() => el.remove(), 400); }, 5000);
    } catch {
        if ("Notification" in (typeof window != "undefined" ? window : globalThis) && Notification.permission === "granted") {
            new Notification("CrossWord", { body: message, icon: chrome.runtime.getURL("icons/icon.png") });
        }
    }
};

// BroadcastChannel listener
const resultBC = new BroadcastChannel("rs-content-script");
resultBC.onmessage = ({ data }) => {
    if (data?.type === "crx-result-delivered" && data.result?.type === "processed" && typeof data.result.content === "string") {
        const preview = data.result.content.length > 60 ? data.result.content.slice(0, 60) + "..." : data.result.content;
        showPageNotification(`📋 Copied to clipboard!\n${preview}`, "success");
    }
};

// chrome.runtime listener (SW → content script)
chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "crx-result-delivered" && msg.result?.type === "processed" && typeof msg.result.content === "string") {
        const preview = msg.result.content.length > 60 ? msg.result.content.slice(0, 60) + "..." : msg.result.content;
        showPageNotification(`📋 Copied to clipboard!\n${preview}`, "success");
    }
});
