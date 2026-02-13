/**
 * Routing System
 *
 * Path-based routing for views (no hash navigation).
 * 
 * Routes:
 * - `/` → Boot menu or default view (shell selection)
 * - `/viewer` → Viewer
 * - `/workcenter` → Work Center
 * - `/settings` → Settings
 * - `/explorer` → Explorer
 * - `/history` → History
 * - `/editor` → Editor
 * - `/airpad` → Airpad
 * - `/print` → Print view
 * 
 * Shell is configured separately (via preferences), not in URL.
 */

import type { ShellId, ViewId, Shell } from "../shells/types";
import type { FrontendChoice } from "./boot-menu";
import { bootMinimal, bootFaint, bootRaw, type BootConfig } from "./BootLoader";

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface Route {
    view: ViewId;
    params?: Record<string, string>;
}

export interface RouteConfig {
    views: ViewId[];
    defaultView: ViewId;
}

export type AppLoaderResult = {
    mount: (el: HTMLElement) => Promise<void>;
    shell?: Shell;
};

export type RoutingMode = "path-based";
export type NavigateOptions = { replace?: boolean; state?: unknown };
export type RouteHandler = (route: Route) => void | Promise<void>;

// ============================================================================
// ROUTE CONFIG
// ============================================================================

/** All registered view routes */
export const VALID_VIEWS: ViewId[] = [
    "viewer",
    "editor",
    "workcenter",
    "explorer",
    "airpad",
    "settings",
    "history",
    "home",
    "print"
];

const DEFAULT_CONFIG: RouteConfig = {
    views: VALID_VIEWS,
    defaultView: "viewer"
};

// ============================================================================
// ROUTE PARSING
// ============================================================================

/**
 * Normalize pathname (remove base, leading/trailing slashes)
 */
function normalizePathname(pathname: string): string {
    const base = document.querySelector("base")?.getAttribute("href") || "/";
    let normalized = pathname;
    if (base !== "/" && pathname.startsWith(base.replace(/\/$/, ""))) {
        normalized = pathname.slice(base.replace(/\/$/, "").length);
    }
    return normalized.replace(/^\/+|\/+$/g, "").toLowerCase();
}

/**
 * Parse current URL into route
 */
export function parseCurrentRoute(config = DEFAULT_CONFIG): Route {
    const pathname = normalizePathname(location.pathname);
    const params = Object.fromEntries(new URLSearchParams(location.search));

    // Map pathname to view
    let view: ViewId = config.defaultView;
    
    if (pathname && config.views.includes(pathname as ViewId)) {
        view = pathname as ViewId;
    }

    return { view, params };
}

/**
 * Check if current URL is the root/home
 */
export function isRootRoute(): boolean {
    const pathname = normalizePathname(location.pathname);
    return pathname === "" || pathname === "/";
}

/**
 * Build URL from route
 */
export function buildUrl(route: Route): string {
    let url = `/${route.view}`;

    if (route.params && Object.keys(route.params).length > 0) {
        const search = new URLSearchParams(route.params).toString();
        url += "?" + search;
    }

    return url;
}

/**
 * Build URL for root
 */
export function buildRootUrl(): string {
    return "/";
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Navigate to a route (view)
 */
export function navigate(route: Route, options: NavigateOptions = {}): void {
    const url = buildUrl(route);

    if (options.replace) {
        history.replaceState(options.state ?? route, "", url);
    } else {
        history.pushState(options.state ?? route, "", url);
    }

    window.dispatchEvent(new CustomEvent("route-change", { detail: route }));
}

/**
 * Navigate to a view
 */
export function navigateToView(view: ViewId, params?: Record<string, string>): void {
    navigate({ view, params });
}

/**
 * Navigate to root (boot menu / shell selection)
 */
export function navigateToRoot(): void {
    const url = buildRootUrl();
    history.pushState({ view: null }, "", url);
    window.dispatchEvent(new CustomEvent("route-change", { detail: { view: null } }));
}

export const goBack = () => history.back();
export const goForward = () => history.forward();

// ============================================================================
// ROUTE MATCHING
// ============================================================================

/**
 * Check if a view is valid
 */
export function isValidView(view: string): view is ViewId {
    return VALID_VIEWS.includes(view as ViewId);
}

/**
 * Get view from pathname
 */
export function getViewFromPath(): ViewId | null {
    const pathname = normalizePathname(location.pathname);
    
    if (!pathname || pathname === "/" || pathname === "") {
        return null; // Root route - show boot menu
    }
    
    if (isValidView(pathname)) {
        return pathname;
    }
    
    return null;
}

// ============================================================================
// ROUTE LISTENERS
// ============================================================================

type RouteListener = (route: Route | null) => void;
const listeners: Set<RouteListener> = new Set();

/**
 * Subscribe to route changes
 */
export function onRouteChange(listener: RouteListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Initialize route listening
 */
export function initRouteListening(): void {
    window.addEventListener("popstate", () => {
        const view = getViewFromPath();
        const params = Object.fromEntries(new URLSearchParams(location.search));
        listeners.forEach(l => l(view ? { view, params } : null));
    });

    window.addEventListener("route-change", (e) => {
        const route = (e as CustomEvent).detail as Route | null;
        listeners.forEach(l => l(route));
    });
}

// ============================================================================
// SHELL-BASED APP LOADING
// ============================================================================

/**
 * Get saved shell preference
 */
export function getSavedShellPreference(): ShellId | null {
    try {
        const saved = localStorage.getItem("rs-boot-shell");
        if (saved === "minimal" || saved === "faint" || saved === "raw") {
            return saved as ShellId;
        }
    } catch {
        // Ignore
    }
    return null;
}

/**
 * Load sub-app using the new shell boot system
 */
export const loadSubAppWithShell = async (
    shellId?: ShellId,
    initialView?: ViewId
): Promise<AppLoaderResult> => {
    const shell = shellId || getSavedShellPreference() || "minimal";
    const view = initialView || getViewFromPath() || "viewer";
    
    console.log('[App] Loading sub-app with shell:', shell, 'view:', view);

    try {
        switch (shell) {
            case "faint":
                return {
                    mount: async (el: HTMLElement) => {
                        await bootFaint(el, view);
                    }
                };

            case "raw":
                return {
                    mount: async (el: HTMLElement) => {
                        await bootRaw(el, view);
                    }
                };

            case "minimal":
            default:
                return {
                    mount: async (el: HTMLElement) => {
                        await bootMinimal(el, view);
                    }
                };
        }
    } catch (error) {
        console.error('[App] Failed to load sub-app:', shell, error);
        throw error;
    }
};

/**
 * Load boot menu for shell selection
 */
export const loadBootMenu = async (): Promise<AppLoaderResult> => {
    const module = await import("./boot-menu");
    return {
        mount: async (el: HTMLElement) => {
            await module.default(el);
        }
    };
};

// ============================================================================
// ROUTE RESOLUTION
// ============================================================================

/**
 * Resolve pathname to view ID (returns null for root)
 */
export function resolvePathToView(pathname: string): ViewId | null {
    const normalized = pathname.replace(/^\//, "").toLowerCase().trim();
    
    if (!normalized || normalized === "/" || normalized === "") {
        return null; // Root - boot menu
    }
    
    if (isValidView(normalized)) {
        return normalized;
    }
    
    return "viewer"; // Default fallback
}

/**
 * Create boot config from URL
 */
export function createBootConfigFromUrl(): BootConfig {
    const view = getViewFromPath() || "viewer";
    const shell = getSavedShellPreference() || "minimal";
    const params = Object.fromEntries(new URLSearchParams(location.search));

    let styleSystem: "vl-core" | "vl-basic" | "raw" = "vl-core";

    switch (shell) {
        case "faint":
            styleSystem = "vl-basic";
            break;
        case "raw":
            styleSystem = "vl-core";
            break;
        default:
            styleSystem = "vl-basic";
    }

    return {
        styleSystem,
        shell,
        defaultView: view,
        channels: [view as any],
        rememberChoice: !params.shared
    };
}

// ============================================================================
// URL PARAMETER HANDLING  
// ============================================================================

/**
 * Parse URL parameters for routing
 */
export function parseRoutingParams(): {
    view: ViewId | null;
    params: Record<string, string>;
    isRoot: boolean;
} {
    const view = getViewFromPath();
    const params: Record<string, string> = {};
    
    const searchParams = new URLSearchParams(location.search);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }

    return { 
        view, 
        params, 
        isRoot: view === null 
    };
}

// ============================================================================
// DEPRECATED - For backwards compatibility during transition
// These functions are kept for legacy code support but should not be used
// in new code. Use the modern path-based routing functions instead.
// ============================================================================

/**
 * @deprecated Use `resolvePathToView` instead
 */
export const resolvePathToChoice = (pathname: string): FrontendChoice => {
    const view = resolvePathToView(pathname);
    return view ? "minimal" : "";
};

/**
 * @deprecated Use `navigateToView` instead
 */
export const setViewHash = (view: ViewId, _replace = false): void => {
    navigateToView(view);
};

/**
 * @deprecated Use `getViewFromPath` instead
 */
export const getViewFromHash = (): ViewId | null => getViewFromPath();

/**
 * @deprecated Shells are no longer encoded in URL - use localStorage preference
 */
export const navigateToShell = (shell: ShellId, view?: ViewId): void => {
    try {
        localStorage.setItem("rs-boot-shell", shell);
    } catch {
        // Storage unavailable
    }
    if (view) navigateToView(view);
};
