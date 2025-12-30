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

// Helper function to extract recognized content from AI responses
const tryParseJSON = (data: unknown): unknown => {
    if (typeof data !== 'string') return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

const extractRecognizedContent = (data: unknown): unknown => {
    // If it's already a string that's not JSON, return as-is
    if (typeof data === 'string') {
        const parsed = tryParseJSON(data);
        if (parsed && typeof parsed === 'object') {
            // Extract content from recognized_data field
            const obj = parsed as Record<string, unknown>;

            // Priority: recognized_data > verbose_data > data itself
            if (obj.recognized_data != null) {
                const rd = obj.recognized_data;
                // If it's an array, join the elements
                if (Array.isArray(rd)) {
                    return rd.map(item =>
                        typeof item === 'string' ? item : JSON.stringify(item)
                    ).join('\n');
                }
                return typeof rd === 'string' ? rd : JSON.stringify(rd);
            }

            if (typeof obj.verbose_data === 'string' && obj.verbose_data.trim()) {
                return obj.verbose_data;
            }

            // No recognized_data, return original data
            return data;
        }
        // Not JSON, return as-is
        return data;
    }

    // If it's an object, try to extract recognized_data
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (obj.recognized_data != null) {
            const rd = obj.recognized_data;
            if (Array.isArray(rd)) {
                return rd.map(item =>
                    typeof item === 'string' ? item : JSON.stringify(item)
                ).join('\n');
            }
            return typeof rd === 'string' ? rd : JSON.stringify(rd);
        }
        if (typeof obj.verbose_data === 'string' && obj.verbose_data.trim()) {
            return obj.verbose_data;
        }
    }

    return data;
};

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

        // Listen for commit-to-clipboard messages from service worker
        const swChannel = new BroadcastChannel("rs-sw");

        const swHandler = async (event: MessageEvent) => {
            const { type, results } = event.data || {};
            console.log('[PWA-Copy] SW channel message:', type, results);

            // Handle commit-to-clipboard messages
            if (type === "commit-to-clipboard" && results && Array.isArray(results)) {
                for (const result of results) {
                    if (result?.status === 'queued' && result?.data) {
                        console.log('[PWA-Copy] Copying result data:', result.data);
                        // Use the extractRecognizedContent function to get the right data
                        const extractedContent = extractRecognizedContent(result.data);
                        requestCopy(extractedContent, { showFeedback: true });
                        break; // Only copy the first successful result
                    }
                }
            }
        };

        swChannel.addEventListener("message", swHandler);
        _cleanupFns.push(() => {
            swChannel.removeEventListener("message", swHandler);
            swChannel.close();
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
