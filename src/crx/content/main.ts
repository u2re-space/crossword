import { showToast, initOverlay } from "@rs-frontend/shared/overlay";
import { initToastReceiver } from "@rs-frontend/shared/Toast";
import { initClipboardReceiver } from "@rs-frontend/shared/Clipboard";
import { copyAsHTML, copyAsMathML, copyAsMarkdown, copyAsTeX } from "@rs-frontend/utils/Conversion";
import "./rect-selector";

// Initialize overlay and broadcast receivers for service worker communication
initOverlay();
const cleanupToast = initToastReceiver();
const cleanupClipboard = initClipboardReceiver();

// Cleanup on pagehide (unload is deprecated and blocked by permissions policy)
if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
        cleanupToast?.();
        cleanupClipboard?.();
    }, { once: true });
}

// Import message handlers (auto-initialize on load)
import "./copy"; // handles COPY_HACK messages

// Handle CRX-Snip rectangle selection and result delivery
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'crx-snip-select-rect') {
        // Start rectangle selection
        (async () => {
            try {
                const rect = await (window as any).crxSnipSelectRect?.();
                sendResponse({ rect });
            } catch (error) {
                console.error('[CRX-SNIP] Rectangle selection failed:', error);
                sendResponse({ rect: null, error: error instanceof Error ? error.message : String(error) });
            }
        })();
        return true; // Keep message channel open for async response
    }
});

// Listen for result delivery from pipeline
const resultBroadcastChannel = new BroadcastChannel('rs-content-script');
resultBroadcastChannel.onmessage = (event) => {
    const message = event.data;

    if (message?.type === 'crx-result-delivered') {
        const { result, destination, timestamp } = message;

        console.log('[ContentScript] Received result delivery:', {
            resultId: result.id,
            type: result.type,
            source: result.source,
            destination,
            timestamp
        });

        // Handle result based on type and content
        if (result.type === 'processed' && typeof result.content === 'string') {
            // Could inject results into page, show overlay, etc.
            // For now, just log the delivery
            console.log('[ContentScript] Processed result content:', result.content.substring(0, 200) + '...');

            // Optionally show a page-level notification
            showPageNotification(`CrossWord: ${result.content.substring(0, 50)}...`, 'success');
        }
    }
};

// Simple page notification function
function showPageNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const notification = document.createElement('div');
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '6px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        zIndex: '10000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
import "./snip"; // handles START_SNIP messages

// coordinate and element tracking (similar to CrossHelp state.ts)
const coordinate: [number, number] = [0, 0];
const lastElementRef: [HTMLElement | null] = [null];

const saveCoordinate = (e: PointerEvent | MouseEvent) => {
    coordinate[0] = e?.clientX ?? coordinate[0];
    coordinate[1] = e?.clientY ?? coordinate[1];
};

const opMap = new Map<string, (target: HTMLElement) => unknown>([
    ["copy-as-latex", copyAsTeX],
    ["copy-as-mathml", copyAsMathML],
    ["copy-as-markdown", copyAsMarkdown],
    ["copy-as-html", copyAsHTML],
]);

// legacy aliases for compatibility
let lastX = 0;
let lastY = 0;
let lastElement: HTMLElement | null = null;

// event listeners for coordinate tracking
const updateLastPosition = (e: PointerEvent | MouseEvent) => {
    lastX = e.clientX;
    lastY = e.clientY;
    lastElement = e.target as HTMLElement | null;
    saveCoordinate(e);
    lastElementRef[0] = lastElement;
};

document.addEventListener("pointerdown", updateLastPosition, { passive: true, capture: true });
document.addEventListener("pointerup", updateLastPosition, { passive: true, capture: true });
document.addEventListener("click", saveCoordinate as EventListener, { passive: true, capture: true });
document.addEventListener(
    "contextmenu",
    (e) => {
        updateLastPosition(e);
        lastElementRef[0] = (e?.target as HTMLElement) || lastElementRef[0];
    },
    { passive: true, capture: true }
);

// message handler for selection queries
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "highlight-selection") {
        const selection = window.getSelection?.()?.toString?.() ?? "";
        sendResponse({ selection });
        return true;
    }
    return false;
});

// message handler for copy-as-* operations (context menu)
chrome.runtime.onMessage.addListener((res, _sender, sendResponse) => {
    // only handle copy-as-* operations here (COPY_HACK is handled in copy.ts)
    if (typeof res?.type === "string" && opMap.has(res.type)) {
        (async () => {
            const op = opMap.get(res.type);
            const target =
                lastElementRef[0] ||
                lastElement ||
                (document.elementFromPoint(coordinate[0], coordinate[1]) as HTMLElement | null) ||
                (document.elementFromPoint(lastX, lastY) as HTMLElement | null) ||
                document.body;

            try {
                if (op && target) {
                    // Show processing toast for operations that may translate
                    const mayTranslate = res.type === "copy-as-markdown" || res.type === "copy-as-html";
                    if (mayTranslate) {
                        showToast("Processing...");
                    }
                    await op(target);
                    showToast("Copied");
                    sendResponse({ ok: true });
                    return;
                }
            } catch (e) {
                console.warn("Copy operation failed:", e);
            }
            showToast("Failed to copy");
            sendResponse({ ok: false });
        })();
        return true;
    }
    return false;
});
