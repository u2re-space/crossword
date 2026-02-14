import { crxFrontend } from '../modules/crx-entry.js';
import '../modules/Settings.js';
import '../modules/Env.js';
import '../modules/UnifiedMessaging.js';
import '../modules/templates.js';

const mount = document.getElementById("app");
crxFrontend(mount ?? document.body, { initialView: "settings" });
//# sourceMappingURL=settings.js.map
