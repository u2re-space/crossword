/**
 * Routing System
 * 
 * URL-based routing for shells and views.
 * Supports:
 * - Shell routes: /basic, /faint, /raw
 * - View routes: #viewer, #workcenter, etc.
 * - Deep linking: /basic#viewer
 * - Query params: ?content=... 
 */

import type { ShellId, ViewId } from "../shells/types";

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface Route {
    shell?: ShellId;
    view?: ViewId;
    params?: Record<string, string>;
    hash?: string;
}

export interface RouteConfig {
    shells: ShellId[];
    views: ViewId[];
    defaultShell: ShellId;
    defaultView: ViewId;
}

// ============================================================================
// ROUTE PARSING
// ============================================================================

const DEFAULT_CONFIG: RouteConfig = {
    shells: ["basic", "faint", "raw"],
    views: ["viewer", "editor", "workcenter", "explorer", "airpad", "settings", "history", "home"],
    defaultShell: "basic",
    defaultView: "viewer"
};

/**
 * Parse current URL into route
 */
export function parseCurrentRoute(config = DEFAULT_CONFIG): Route {
    const pathname = normalizePathname(location.pathname);
    const hash = location.hash.replace(/^#/, "");
    const params = Object.fromEntries(new URLSearchParams(location.search));

    // Check for shell in pathname
    let shell: ShellId | undefined;
    let remaining = pathname;
    
    for (const s of config.shells) {
        if (pathname === s || pathname.startsWith(`${s}/`)) {
            shell = s;
            remaining = pathname.slice(s.length).replace(/^\//, "");
            break;
        }
    }

    // View from hash or remaining pathname
    let view: ViewId | undefined;
    if (hash && config.views.includes(hash as ViewId)) {
        view = hash as ViewId;
    } else if (remaining && config.views.includes(remaining as ViewId)) {
        view = remaining as ViewId;
    }

    return { shell, view, params, hash };
}

/**
 * Normalize pathname (remove base, leading/trailing slashes)
 */
function normalizePathname(pathname: string): string {
    // Get base href
    const base = document.querySelector("base")?.getAttribute("href") || "/";
    
    // Remove base from pathname
    let normalized = pathname;
    if (base !== "/" && pathname.startsWith(base.replace(/\/$/, ""))) {
        normalized = pathname.slice(base.replace(/\/$/, "").length);
    }
    
    // Remove leading/trailing slashes and normalize
    return normalized.replace(/^\/+|\/+$/g, "").toLowerCase();
}

/**
 * Build URL from route
 */
export function buildUrl(route: Route, config = DEFAULT_CONFIG): string {
    const parts: string[] = [];
    
    // Add shell if specified and not default
    if (route.shell && route.shell !== config.defaultShell) {
        parts.push(route.shell);
    }
    
    // Build pathname
    let url = "/" + parts.join("/");
    
    // Add hash for view
    if (route.view) {
        url += `#${route.view}`;
    }
    
    // Add query params
    if (route.params && Object.keys(route.params).length > 0) {
        const search = new URLSearchParams(route.params).toString();
        // Insert before hash
        const hashIndex = url.indexOf("#");
        if (hashIndex >= 0) {
            url = url.slice(0, hashIndex) + "?" + search + url.slice(hashIndex);
        } else {
            url += "?" + search;
        }
    }
    
    return url;
}

// ============================================================================
// NAVIGATION
// ============================================================================

export type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};

/**
 * Navigate to a route
 */
export function navigate(route: Route, options: NavigateOptions = {}): void {
    const url = buildUrl(route);
    
    if (options.replace) {
        history.replaceState(options.state ?? route, "", url);
    } else {
        history.pushState(options.state ?? route, "", url);
    }
    
    // Dispatch event for shell to handle
    window.dispatchEvent(new CustomEvent("route-change", { detail: route }));
}

/**
 * Navigate to a view (within current shell)
 */
export function navigateToView(view: ViewId, params?: Record<string, string>): void {
    const current = parseCurrentRoute();
    navigate({ ...current, view, params });
}

/**
 * Navigate to a shell (optionally with a view)
 */
export function navigateToShell(shell: ShellId, view?: ViewId): void {
    navigate({ shell, view });
}

/**
 * Go back in history
 */
export function goBack(): void {
    history.back();
}

/**
 * Go forward in history
 */
export function goForward(): void {
    history.forward();
}

// ============================================================================
// ROUTE MATCHING
// ============================================================================

export type RouteHandler = (route: Route) => void | Promise<void>;

/**
 * Simple route matcher
 */
export function matchRoute(
    route: Route,
    pattern: { shell?: ShellId; view?: ViewId }
): boolean {
    if (pattern.shell && route.shell !== pattern.shell) return false;
    if (pattern.view && route.view !== pattern.view) return false;
    return true;
}

// ============================================================================
// HASH NAVIGATION HELPERS
// ============================================================================

/**
 * Get view from hash
 */
export function getViewFromHash(): ViewId | null {
    const hash = location.hash.replace(/^#/, "");
    return hash as ViewId || null;
}

/**
 * Set view hash
 */
export function setViewHash(view: ViewId, replace = false): void {
    const url = `#${view}`;
    if (replace) {
        history.replaceState(null, "", url);
    } else {
        history.pushState(null, "", url);
    }
}

// ============================================================================
// ROUTE LISTENERS
// ============================================================================

type RouteListener = (route: Route) => void;
const listeners: Set<RouteListener> = new Set();

/**
 * Subscribe to route changes
 */
export function onRouteChange(listener: RouteListener): () => void {
    listeners.add(listener);
    
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Initialize route listening
 */
export function initRouteListening(): void {
    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", () => {
        const route = parseCurrentRoute();
        listeners.forEach(l => l(route));
    });
    
    // Listen for custom route-change events
    window.addEventListener("route-change", (e) => {
        const route = (e as CustomEvent).detail as Route;
        listeners.forEach(l => l(route));
    });
    
    // Listen for hash changes
    window.addEventListener("hashchange", () => {
        const route = parseCurrentRoute();
        listeners.forEach(l => l(route));
    });
}
