/**
 * CRX Offscreen Document - Clipboard Handler
 * Uses unified clipboard handler module
 */

import { initClipboardHandler } from "@rs-crx/shared/clipboard-handler";

// Initialize handler for offscreen context
// - Only responds to messages with target: "offscreen"
// - No toast feedback (offscreen can't show UI)
initClipboardHandler({
    targetFilter: "offscreen",
    showFeedback: false
});

console.log("[Offscreen] Clipboard document ready");
