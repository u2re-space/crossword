/**
 * PWA Module
 * 
 * Progressive Web App features for CrossWord:
 * - Service worker registration
 * - Install prompts
 * - Update handling
 * - Offline support
 */

// Re-export PWA utilities
export * from "./pwa-handling";
export * from "./sw-handling";
export * from "./sw-url";
export * from "./pwa-copy";

// ============================================================================
// PWA INITIALIZATION
// ============================================================================

/**
 * Initialize PWA features
 */
export async function initPWA(): Promise<void> {
    console.log("[PWA] Initializing PWA features...");
    
    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
        console.warn("[PWA] Service workers not supported");
        return;
    }

    try {
        // Register service worker
        await registerServiceWorker();
        
        // Setup install prompt handling
        setupInstallPrompt();
        
        // Setup update handling
        setupUpdateHandling();
        
        console.log("[PWA] PWA features initialized");
    } catch (error) {
        console.error("[PWA] Failed to initialize:", error);
    }
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/"
        });
        
        console.log("[PWA] Service worker registered:", registration.scope);
        return registration;
    } catch (error) {
        console.error("[PWA] Service worker registration failed:", error);
        return null;
    }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            return true;
        }
        return false;
    } catch (error) {
        console.error("[PWA] Update check failed:", error);
        return false;
    }
}

// ============================================================================
// INSTALL PROMPT
// ============================================================================

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Setup install prompt handling
 */
function setupInstallPrompt(): void {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        console.log("[PWA] Install prompt available");
        
        // Dispatch custom event for UI to handle
        window.dispatchEvent(new CustomEvent("pwa-install-available"));
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        console.log("[PWA] App installed");
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent("pwa-installed"));
    });
}

/**
 * Show install prompt
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
 * Setup update handling
 */
function setupUpdateHandling(): void {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[PWA] Service worker controller changed");
        
        // Dispatch custom event for UI to handle
        window.dispatchEvent(new CustomEvent("pwa-update-ready"));
    });
}

/**
 * Apply pending update (reload page)
 */
export function applyUpdate(): void {
    window.location.reload();
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

/**
 * Check if currently online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Subscribe to online/offline events
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
// DISPLAY MODE
// ============================================================================

/**
 * Check if running as standalone PWA
 */
export function isStandalone(): boolean {
    return window.matchMedia("(display-mode: standalone)").matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes("android-app://");
}

/**
 * Subscribe to display mode changes
 */
export function onDisplayModeChange(
    callback: (standalone: boolean) => void
): () => void {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    mediaQuery.addEventListener("change", handler);
    
    return () => mediaQuery.removeEventListener("change", handler);
}
