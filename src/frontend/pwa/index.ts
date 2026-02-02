/**
 * PWA Module
 *
 * Progressive Web App features for CrossWord:
 * - Service worker registration
 * - Install prompts
 * - Update handling
 * - Offline support
 *
 * Primary implementations are in pwa-handling.ts and sw-handling.ts.
 * This module re-exports those and adds supplementary utilities.
 */

// Re-export primary PWA utilities (initPWA, checkForUpdates, forceRefreshAssets)
export {
    initPWA,
    checkForUpdates,
    forceRefreshAssets
} from "./pwa-handling";

// Re-export SW handling utilities
export {
    ensureAppCss,
    initServiceWorker,
    getServiceWorkerRegistration,
    waitForServiceWorker,
    initReceivers,
    handleShareTarget,
    setupLaunchQueueConsumer,
    checkPendingShareData,
    processShareTargetData,
    storeShareTargetPayloadToCache,
    consumeCachedShareTargetPayload,
    CHANNELS,
    type CachedShareTargetPayload
} from "./sw-handling";

// Re-export SW URL utilities
export { ensureServiceWorkerRegistered } from "./sw-url";

// Re-export PWA clipboard utilities
export {
    initPWAClipboard,
    cleanupPWAClipboard,
    requestCopyViaServiceWorker,
    requestCopy,
    listenForClipboardRequests,
    initClipboardReceiver
} from "./pwa-copy";

// ============================================================================
// INSTALL PROMPT HANDLING
// ============================================================================

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Setup install prompt handling - call this early in app initialization
 */
export function setupInstallPrompt(): void {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        console.log("[PWA] Install prompt available");
        window.dispatchEvent(new CustomEvent("pwa-install-available"));
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        console.log("[PWA] App installed");
        window.dispatchEvent(new CustomEvent("pwa-installed"));
    });
}

/**
 * Show install prompt to user
 */
export async function showInstallPrompt(): Promise<boolean> {
    if (!deferredPrompt) {
        console.log("[PWA] No install prompt available");
        return false;
    }

    try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA] Install prompt outcome:", outcome);
        deferredPrompt = null;
        return outcome === "accepted";
    } catch (error) {
        console.error("[PWA] Install prompt failed:", error);
        return false;
    }
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
    return deferredPrompt !== null;
}

// ============================================================================
// UPDATE HANDLING
// ============================================================================

/**
 * Apply pending update by reloading the page
 */
export function applyUpdate(): void {
    window.location.reload();
}

// ============================================================================
// CONNECTIVITY DETECTION
// ============================================================================

/**
 * Check if currently online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 * @returns Cleanup function to unsubscribe
 */
export function onConnectivityChange(
    callback: (online: boolean) => void
): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
    };
}

// ============================================================================
// DISPLAY MODE DETECTION
// ============================================================================

/**
 * Check if running as standalone PWA
 */
export function isStandalone(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://")
    );
}

/**
 * Subscribe to display mode changes
 * @returns Cleanup function to unsubscribe
 */
export function onDisplayModeChange(
    callback: (standalone: boolean) => void
): () => void {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
}

// ============================================================================
// SERVICE WORKER REGISTRATION (simplified wrapper)
// ============================================================================

/**
 * Register the service worker (simple wrapper)
 * For more advanced usage, use ensureServiceWorkerRegistered from sw-url
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) {
        return null;
    }

    try {
        const { ensureServiceWorkerRegistered } = await import("./sw-url");
        return ensureServiceWorkerRegistered();
    } catch (error) {
        console.error("[PWA] Service worker registration failed:", error);
        return null;
    }
}
