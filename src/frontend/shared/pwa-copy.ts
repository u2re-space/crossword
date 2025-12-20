/**
 * PWA Clipboard Handler
 * Connects PWA frontend with service worker clipboard operations
 * Listens for clipboard requests from service worker via BroadcastChannel
 */

import { initClipboardReceiver, listenForClipboardRequests, requestCopy } from "./Clipboard";
import { initToastReceiver, showToast } from "./Toast";

// Track initialization
let _pwaClipboardInitialized = false;
let _cleanupFns: (() => void)[] = [];

/**
 * Initialize PWA clipboard listeners
 * Call this early in the PWA lifecycle to receive clipboard requests from service worker
 */
export const initPWAClipboard = (): (() => void) => {
    if (_pwaClipboardInitialized) {
        return () => cleanupPWAClipboard();
    }
    _pwaClipboardInitialized = true;

    console.log('[PWA-Copy] Initializing clipboard and toast receivers...');

    // Listen for clipboard requests from service worker
    _cleanupFns.push(initClipboardReceiver());

    // Listen for toast messages from service worker
    _cleanupFns.push(initToastReceiver());

    // Listen for share target clipboard operations
    if (typeof BroadcastChannel !== "undefined") {
        const shareChannel = new BroadcastChannel("rs-share-target");

        const shareHandler = async (event: MessageEvent) => {
            const { type, data } = event.data || {};
            console.log('[PWA-Copy] Share channel message:', type, data);

            // Handle share-target copy request
            if (type === "copy-shared" && data) {
                requestCopy(data, { showFeedback: true });
            }

            // Handle share-received notification
            if (type === "share-received" && data) {
                console.log('[PWA-Copy] Share received from SW:', data);
            }
        };

        shareChannel.addEventListener("message", shareHandler);
        _cleanupFns.push(() => {
            shareChannel.removeEventListener("message", shareHandler);
            shareChannel.close();
        });
    }

    console.log('[PWA-Copy] Receivers initialized');
    return () => cleanupPWAClipboard();
};

/**
 * Cleanup all PWA clipboard listeners
 */
export const cleanupPWAClipboard = (): void => {
    _cleanupFns.forEach(fn => fn?.());
    _cleanupFns = [];
    _pwaClipboardInitialized = false;
};

/**
 * Request copy operation via service worker
 * Useful when clipboard access is restricted in current context
 */
export const requestCopyViaServiceWorker = (data: unknown): void => {
    requestCopy(data, { showFeedback: true });
};

// Re-export for convenience
export { requestCopy, listenForClipboardRequests, initClipboardReceiver };

// Default export
export default {
    init: initPWAClipboard,
    cleanup: cleanupPWAClipboard,
    requestCopy: requestCopyViaServiceWorker
};
