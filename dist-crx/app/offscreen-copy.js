import { initClipboardHandler } from '../modules/clipboard-handler.js';
import '../modules/Clipboard.js';

"use strict";
console.log("[Offscreen] Initializing clipboard handler for offscreen context");
initClipboardHandler({
  targetFilter: "offscreen",
  showFeedback: false
});
console.log("[Offscreen] Clipboard document ready - listening for messages with target: 'offscreen'");
setInterval(() => {
  console.log("[Offscreen] Heartbeat - clipboard document active");
}, 3e4);
//# sourceMappingURL=offscreen-copy.js.map
