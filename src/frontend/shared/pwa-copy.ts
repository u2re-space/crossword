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
 * Check for pending clipboard operations from service worker
 */
const checkPendingClipboardOperations = async (): Promise<void> => {
    try {
        console.log('[PWA-Copy] Checking for pending clipboard operations...');
        const response = await fetch('/clipboard/pending');
        const data = await response.json();

        if (data.operations && Array.isArray(data.operations) && data.operations.length > 0) {
            console.log('[PWA-Copy] Found', data.operations.length, 'pending clipboard operations');

            for (const operation of data.operations) {
                if (operation.type === 'ai-result' && operation.data) {
                    console.log('[PWA-Copy] Processing pending AI result:', operation.id);
                    const text = typeof operation.data === 'string' ? operation.data : JSON.stringify(operation.data);
                    const { copy } = await import("./Clipboard");
                    await copy(text, { showFeedback: true });

                    // Remove the processed operation from the queue
                    try {
                        await fetch(`/clipboard/remove/${operation.id}`, { method: 'DELETE' });
                    } catch (error) {
                        console.warn('[PWA-Copy] Failed to remove processed operation:', error);
                    }
                }
            }
        }
    } catch (error) {
        console.warn('[PWA-Copy] Failed to check pending operations:', error);
    }
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

    // Check for any pending clipboard operations that completed while page was closed
    checkPendingClipboardOperations().catch(console.warn);

    // Listen for clipboard requests from service worker
    _cleanupFns.push(initClipboardReceiver());

    // Listen for toast messages from service worker
    _cleanupFns.push(initToastReceiver());

    // Listen for various clipboard and share target operations
    if (typeof BroadcastChannel !== "undefined") {
        // Listen for direct clipboard requests from service worker
        const clipboardChannel = new BroadcastChannel("rs-clipboard");

        const clipboardHandler = async (event: MessageEvent) => {
            const { type, data, options, operations } = event.data || {};
            console.log('[PWA-Copy] Clipboard channel message:', type, data);

            // Handle direct clipboard copy requests
            if (type === "copy" && data !== undefined) {
                const { copy } = await import("./Clipboard");
                await copy(data, { showFeedback: true, ...options });
            }

            // Handle pending operations sent directly from service worker
            if (type === "pending-operations" && operations && Array.isArray(operations)) {
                console.log('[PWA-Copy] Received', operations.length, 'pending operations via broadcast');
                for (const operation of operations) {
                    if (operation.type === 'ai-result' && operation.data) {
                        console.log('[PWA-Copy] Processing broadcasted AI result:', operation.id);
                        const text = typeof operation.data === 'string' ? operation.data : JSON.stringify(operation.data);
                        const { copy } = await import("./Clipboard");
                        await copy(text, { showFeedback: true });

                        // Remove the processed operation from the queue
                        try {
                            await fetch(`/clipboard/remove/${operation.id}`, { method: 'DELETE' });
                        } catch (error) {
                            console.warn('[PWA-Copy] Failed to remove processed operation:', error);
                        }
                    }
                }
            }
        };

        clipboardChannel.addEventListener("message", clipboardHandler);
        _cleanupFns.push(() => {
            clipboardChannel.removeEventListener("message", clipboardHandler);
            clipboardChannel.close();
        });

        // Listen for share target clipboard operations
        const shareChannel = new BroadcastChannel("rs-share-target");

        const shareHandler = async (event: MessageEvent) => {
            const { type, data } = event.data || {};
            console.log('[PWA-Copy] Share channel message:', type, data);

            // Handle share-target copy request
            if (type === "copy-shared" && data) {
                const { copy } = await import("./Clipboard");
                await copy(data, { showFeedback: true });
            }

            // Handle share-received notification
            if (type === "share-received" && data) {
                console.log('[PWA-Copy] Share received from SW:', data);
            }

            // Handle AI result from service worker
            if (type === "ai-result" && data) {
                console.log('[PWA-Copy] AI result from SW:', data);
                if (data.success && data.data) {
                    const text = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
                    const { copy } = await import("./Clipboard");
                    await copy(text, { showFeedback: true });
                } else {
                    const { showToast } = await import("./Toast");
                    showToast({ message: data.error || "Processing failed", kind: "error" });
                }
            }
        };

        shareChannel.addEventListener("message", shareHandler);
        _cleanupFns.push(() => {
            shareChannel.removeEventListener("message", shareHandler);
            shareChannel.close();
        });

        // Listen for legacy commit-to-clipboard messages from service worker
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
                        const { copy } = await import("./Clipboard");
                        await copy(extractedContent, { showFeedback: true });
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
