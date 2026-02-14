import { crxFrontend } from '../modules/crx-entry.js';
import '../modules/Settings.js';
import '../modules/index.js';
import '../modules/UnifiedMessaging.js';
import '../modules/BuiltInAI.js';
import '../modules/Clipboard.js';

"use strict";
const mount = document.getElementById("app");
crxFrontend(mount ?? document.body, { initialView: "settings" });
//# sourceMappingURL=settings.js.map
