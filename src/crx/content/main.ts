import { showToast, initOverlay } from "@rs-frontend/main/overlay";
import { initToastReceiver } from "@rs-frontend/components/items/Toast";
import { initClipboardReceiver } from "@rs-core/clipboard";
import { copyAsHTML, copyAsMathML, copyAsMarkdown, copyAsTeX } from "@rs-core/document/Conversion";
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

// Ensure rect selector is available
import "./rect-selector";

// Handle CRX-Snip rectangle selection and result delivery
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'crx-snip-select-rect') {
        // Start rectangle selection
        (async () => {
            try {
                // Ensure rect selector is available
                if (!window.crxSnipSelectRect) {
                    console.warn('[CRX-SNIP] Rect selector not available, retrying...');
                    // Wait a bit for module to load
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (!window.crxSnipSelectRect) {
                    throw new Error('Rectangle selector not available');
                }

                const rect = await window.crxSnipSelectRect();
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
            // Show success notification for CRX-Snip completion
            console.log('[ContentScript] CRX-Snip result delivered:', result.content.substring(0, 200) + '...');

            // Show page-level toast notification
            const previewText = result.content.length > 60
                ? result.content.substring(0, 60) + '...'
                : result.content;

            showPageNotification(`📋 Copied to clipboard!\n${previewText}`, 'success');
        }
    }
};

// Also listen via chrome.runtime messaging (service worker -> content script)
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === "crx-result-delivered") {
        const { result, destination, timestamp } = message;

        console.log("[ContentScript] Received result delivery (runtime):", {
            resultId: result?.id,
            type: result?.type,
            source: result?.source,
            destination,
            timestamp
        });

        if (result?.type === "processed" && typeof result?.content === "string") {
            const previewText = result.content.length > 60 ? result.content.substring(0, 60) + "..." : result.content;
            showPageNotification(`📋 Copied to clipboard!\n${previewText}`, "success");
        }
    }
});

// Enhanced page notification function with better visibility
function showPageNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    try {
        // Remove any existing notifications first
        const existingNotifications = document.querySelectorAll('.crossword-crx-notification');
        existingNotifications.forEach(el => el.remove());

        const notification = document.createElement('div');
        notification.className = 'crossword-crx-notification';

        // Determine colors and icon based on type
        let bgColor = '#3b82f6'; // info blue
        let icon = 'ℹ️';

        if (type === 'success') {
            bgColor = '#10b981'; // green
            icon = '✅';
        } else if (type === 'error') {
            bgColor = '#ef4444'; // red
            icon = '❌';
        }

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: bgColor,
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)',
            zIndex: '2147483647', // Maximum z-index
            maxWidth: '450px',
            wordWrap: 'break-word',
            opacity: '0',
            transform: 'translateY(-20px) scale(0.95)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer'
        });

        // Create content with icon
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px; line-height: 1;">${icon}</span>
                <div style="flex: 1; line-height: 1.4;">${message}</div>
                <button style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0;
                    margin-left: 8px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                " onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Make clickable to dismiss
        notification.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px) scale(0.95)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        });

        // Ensure body exists and append
        if (document.body) {
            document.body.appendChild(notification);
        } else {
            // If body doesn't exist yet, wait for DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(notification);
                    animateIn();
                });
            } else {
                document.documentElement.appendChild(notification);
            }
            return;
        }

        // Animate in
        function animateIn() {
            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0) scale(1)';
            });
        }
        animateIn();

        // Auto-remove after 5 seconds
        const timeoutId = setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px) scale(0.95)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 400);
            }
        }, 5000);

        // Store timeout ID for potential cleanup
        (notification as any)._timeoutId = timeoutId;

        console.log('[CRX-Content] Page notification shown:', message);

    } catch (error) {
        console.error('[CRX-Content] Failed to show page notification:', error);
        // Fallback: try to use browser notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CrossWord CRX-Snip', {
                body: message,
                icon: chrome.runtime.getURL('icons/icon.png')
            });
        }
    }
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
