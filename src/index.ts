import frontend from "./frontend/index";

const ensureAppCss = () => {
    // App is built as a JS module; make sure extracted CSS is loaded in production.
    // Skip extension pages: they have their own HTML entrypoints and CSS injection.
    const viteEnv = (import.meta as any)?.env;
    if (viteEnv?.DEV) return;
    if (typeof window === "undefined") return;
    if (window.location.protocol === "chrome-extension:") return;

    const id = "rs-crossword-css";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";

    // Resolve CSS relative to module location (handles /apps/cw/ mounting)
    // Module is at .../modules/index.js, CSS is at .../assets/crossword.css
    try {
        // Go up from modules/ to app root, then into assets/
        const cssUrl = new URL("../assets/crossword.css", import.meta.url);
        link.href = cssUrl.toString();
    } catch {
        // Fallback: try document-relative path
        link.href = "assets/crossword.css";
    }

    // Handle load errors by trying alternative paths
    let altIndex = 0;
    link.onerror = () => {
        const altPaths = [
            // Relative to app root (if main entry, not in modules/)
            new URL("./assets/crossword.css", import.meta.url).toString(),
            // Absolute from document root
            "/assets/crossword.css",
            // Common app mounting paths
            "/apps/cw/assets/crossword.css",
        ];

        if (altIndex < altPaths.length) {
            const nextPath = altPaths[altIndex++];
            if (link.href !== nextPath) {
                console.warn(`[CSS] Trying path: ${nextPath}`);
                link.href = nextPath;
                return;
            }
        }
        link.onerror = null;
    };

    document.head.append(link);
};

//
export default async function bootstrap(mountElement) {
    ensureAppCss();
    frontend?.(mountElement);
}
