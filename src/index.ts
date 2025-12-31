import frontend, { waitForServiceWorker } from "./frontend/index";

// ============================================================================
// CSS INJECTION
// ============================================================================

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

// ============================================================================
// PENDING SHARE DATA HANDLING
// ============================================================================

/**
 * Check for pending share data from server-side share target handler
 * This handles cases where the service worker wasn't active during share
 */
const checkPendingShareData = async () => {
    try {
        const pendingData = sessionStorage.getItem("rs-pending-share");
        if (!pendingData) return null;

        // Clear immediately to prevent duplicate processing
        sessionStorage.removeItem("rs-pending-share");

        const shareData = JSON.parse(pendingData);
        console.log("[ShareTarget] Found pending share data:", shareData);

        // Store in cache for the normal share target flow to pick up
        if ('caches' in window) {
            const cache = await caches.open('share-target-data');
            await cache.put('/share-target-data', new Response(JSON.stringify({
                ...shareData,
                files: [],
                timestamp: shareData.timestamp || Date.now()
            }), {
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        return shareData;
    } catch (error) {
        console.warn("[ShareTarget] Failed to process pending share data:", error);
        return null;
    }
};

// ============================================================================
// BOOTSTRAP
// ============================================================================

export default async function bootstrap(mountElement: HTMLElement) {
    // Ensure CSS is loaded
    ensureAppCss();

    // Check for pending share data from server-side handler
    // This handles shares that arrived before SW was controlling
    checkPendingShareData();

    // Start frontend (service worker init happens inside frontend)
    await frontend?.(mountElement);
}

// Re-export service worker utilities for external access
export { waitForServiceWorker };
