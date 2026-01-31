/**
 * Main Boot Module
 *
 * Provides the shell/style initialization system for CrossWord.
 *
 * Exports:
 * - BootLoader: Main boot system for styles → shell → view → channels
 * - Routing: URL-based navigation for shells and views
 * - Boot Menu: Choice screen for shell selection
 * - Overlay & Toast: UI utilities
 * - App initialization helpers
 *
 * Usage:
 *   import { bootLoader, quickBoot, initializeApp } from "@rs-frontend/main";
 *   import { navigate, parseCurrentRoute, onRouteChange } from "@rs-frontend/main";
 */

// ============================================================================
// BOOT LOADER
// ============================================================================

export {
    BootLoader,
    bootLoader,
    bootLoader as default,
    quickBoot,
    bootFaint,
    bootBasic,
    bootRaw,
    getRecommendedStyle,
    type StyleSystem,
    type BootConfig,
    type BootState,
    type BootPhaseHandler
} from "./BootLoader";

// ============================================================================
// ROUTING
// ============================================================================

export {
    // Route parsing
    parseCurrentRoute,
    buildUrl,

    // Navigation
    navigate,
    navigateToView,
    navigateToShell,
    goBack,
    goForward,

    // Route matching
    matchRoute,

    // Hash helpers
    getViewFromHash,
    setViewHash,

    // Route listeners
    onRouteChange,
    initRouteListening,

    // Shell loading
    loadSubAppWithShell,
    resolvePathToChoice,
    resolvePathToView,
    getLoader,
    parseRoutingParams,
    createBootConfigFromUrl,

    // Types
    type Route,
    type RouteConfig,
    type NavigateOptions,
    type RouteHandler,
    type AppLoaderResult,
    type RoutingMode
} from "./routing";

// ============================================================================
// BOOT MENU
// ============================================================================

export {
    ChoiceScreen,
    type FrontendChoice,
    type ChoiceScreenOptions,
    type ChoiceScreenResult
} from "./boot-menu";

// ============================================================================
// TOAST SYSTEM
// ============================================================================

export {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearToasts,
    listenForToasts,
    initToastReceiver,
    type ToastKind,
    type ToastPosition,
    type ToastOptions,
    type ToastLayerConfig
} from "../components/items/Toast";

// ============================================================================
// OVERLAY SYSTEM
// ============================================================================

export {
    getOverlayElements,
    getOverlay,
    getBox,
    getHint,
    getSizeBadge,
    getToast,
    showSelection,
    hideSelection,
    updateBox,
    setHint,
    initOverlay,
    overlay,
    box,
    hint,
    sizeBadge,
    type OverlayConfig,
    type OverlayElements
} from "./overlay";

// ============================================================================
// FRONTEND ENTRY POINT
// ============================================================================

export { default as frontend, frontend as mountFrontend } from "./frontend-entry";
export type { BasicAppOptions } from "./frontend-entry";

// ============================================================================
// APP INITIALIZATION
// ============================================================================

import { bootLoader, type BootConfig } from "./BootLoader";
import { parseCurrentRoute, createBootConfigFromUrl, loadSubAppWithShell } from "./routing";
import type { Shell } from "../shells/types";

/**
 * Execution context types
 */
export type ExecutionContext = "web" | "pwa" | "extension";

/**
 * Detect current execution context
 */
export function getExecutionContext(): ExecutionContext {
    // Check for Chrome extension
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        return "extension";
    }

    // Check for PWA (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true) {
        return "pwa";
    }

    return "web";
}

/**
 * Check if running as PWA
 */
export function isPWA(): boolean {
    return getExecutionContext() === "pwa";
}

/**
 * Check if running as extension
 */
export function isExtension(): boolean {
    return getExecutionContext() === "extension";
}

/**
 * Initialize the application with automatic configuration
 */
export async function initializeApp(
    container: HTMLElement,
    config?: Partial<BootConfig>
): Promise<Shell> {
    // Try to load saved preferences
    const savedConfig = bootLoader.loadPreferences();
    const urlConfig = createBootConfigFromUrl();

    // Merge configs with priority: explicit > URL > saved > defaults
    const finalConfig: BootConfig = {
        styleSystem: config?.styleSystem ?? urlConfig.styleSystem ?? savedConfig?.styleSystem ?? "basic",
        shell: config?.shell ?? urlConfig.shell ?? savedConfig?.shell ?? "basic",
        defaultView: config?.defaultView ?? urlConfig.defaultView ?? savedConfig?.defaultView ?? "viewer",
        channels: config?.channels ?? ["workcenter", "settings", "viewer"],
        rememberChoice: config?.rememberChoice ?? true,
        theme: config?.theme
    };

    return bootLoader.boot(container, finalConfig);
}

/**
 * Initialize app with legacy loader (for backward compatibility)
 * @deprecated Use initializeApp instead
 */
export async function initializeLegacy(
    container: HTMLElement,
    choice?: string
): Promise<void> {
    const loader = await loadSubAppWithShell(choice as any);
    await loader.mount(container);
}

/**
 * Quick initialization with minimal config
 */
export async function quickInit(
    container: HTMLElement,
    shell: "basic" | "faint" | "raw" = "basic",
    view: string = "viewer"
): Promise<Shell> {
    return initializeApp(container, {
        shell,
        defaultView: view as any
    });
}
