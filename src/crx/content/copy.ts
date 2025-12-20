/**
 * CRX Content Script - Clipboard Handler
 * Uses unified clipboard handler module
 */

import { initClipboardHandler } from "@rs-crx/shared/clipboard-handler";

// Initialize handler for content script context
// - No target filter (responds to all COPY_HACK messages)
// - Shows toast feedback
initClipboardHandler({ showFeedback: true });
