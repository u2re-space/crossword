/**
 * Unified CRX Clipboard Handler
 * Works in both content script and offscreen document contexts
 * Auto-detects context and handles messages appropriately
 */

import { writeText, toText } from "@rs-frontend/shared/Clipboard";

export type CopyResponse = {
    ok: boolean;
    data?: string;
    method?: string;
    error?: string;
};

export type CRXClipboardContext = "content" | "offscreen" | "unknown";

/**
 * Detect current CRX context
 */
export const detectContext = (): CRXClipboardContext => {
    try {
        // Offscreen documents have limited APIs and specific URL pattern
        if (typeof location !== "undefined" && location.href.includes("offscreen")) {
            return "offscreen";
        }
        // Content scripts have access to the page DOM
        if (typeof document !== "undefined" && document.body) {
            return "content";
        }
    } catch {
        // Ignore errors in context detection
    }
    return "unknown";
};

/**
 * Show toast feedback (only works in content script context)
 */
const showFeedback = async (message: string): Promise<void> => {
    try {
        // Dynamic import to avoid bundling overlay in offscreen
        const { showToast } = await import("@rs-frontend/shared/overlay");
        showToast(message);
    } catch {
        console.log("[Clipboard]", message);
    }
};

/**
 * Handle clipboard copy request
 */
export const handleCopyRequest = async (
    data: unknown,
    options: { showFeedback?: boolean; errorMessage?: string } = {}
): Promise<CopyResponse> => {
    const text = toText(data).trim();

    if (!text) {
        return { ok: false, error: "Empty content" };
    }

    const result = await writeText(text);

    // Show feedback if requested and in appropriate context
    if (options.showFeedback && detectContext() === "content") {
        if (result.ok) {
            await showFeedback("Copied to clipboard");
        } else {
            await showFeedback(options.errorMessage || result.error || "Failed to copy");
        }
    }

    return {
        ok: result.ok,
        data: text,
        method: result.method || detectContext(),
        error: result.error
    };
};

let _handlerRegistered = false;

/**
 * Initialize COPY_HACK message handler
 * Auto-configures based on detected context
 */
export const initClipboardHandler = (
    options: {
        /** Only respond to messages with target matching this value */
        targetFilter?: string;
        /** Show toast feedback on copy */
        showFeedback?: boolean;
    } = {}
): void => {
    if (_handlerRegistered) return;
    _handlerRegistered = true;

    const context = detectContext();
    const { targetFilter, showFeedback: feedback = context === "content" } = options;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        // Filter by target if specified
        if (targetFilter && message?.target !== targetFilter) {
            return false;
        }

        // Handle COPY_HACK messages
        if (message?.type === "COPY_HACK") {
            handleCopyRequest(message?.data, {
                showFeedback: feedback,
                errorMessage: message?.error
            }).then(sendResponse);
            return true; // async response
        }

        return false;
    });

    console.log(`[Clipboard] Handler initialized (${context})`);
};

// Re-export for convenience
export { writeText, toText } from "@rs-frontend/shared/Clipboard";

