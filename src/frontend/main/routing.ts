/**
 * Routing System
 *
 * Unified URL-based routing for shells and views.
 * Supports:
 * - Shell routes: /basic, /faint, /raw
 * - View routes: #viewer, #workcenter, etc.
 * - Deep linking: /basic#viewer
 * - Query params: ?content=...
 * - Legacy and modern boot modes
 */

import type { ShellId, ViewId, Shell } from "../shells/types";
import type { FrontendChoice } from "./boot-menu";
import { bootLoader, bootBasic, bootFaint, bootRaw, type BootConfig } from "./BootLoader";

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

export type AppLoaderResult = {
    mount: (el: HTMLElement) => Promise<void>;
    shell?: Shell;
};

export type RoutingMode = "legacy" | "shell-boot";
export type NavigateOptions = { replace?: boolean; state?: unknown };
export type RouteHandler = (route: Route) => void | Promise<void>;

// ============================================================================
// ROUTE CONFIG
// ============================================================================

const DEFAULT_CONFIG: RouteConfig = {
    shells: ["basic", "faint", "raw"],
    views: ["viewer", "editor", "workcenter", "explorer", "airpad", "settings", "history", "home", "print"],
    defaultShell: "basic",
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
    const hash = location.hash.replace(/^#/, "");
    const params = Object.fromEntries(new URLSearchParams(location.search));

    let shell: ShellId | undefined;
    let remaining = pathname;

    for (const s of config.shells) {
        if (pathname === s || pathname.startsWith(`${s}/`)) {
            shell = s;
            remaining = pathname.slice(s.length).replace(/^\//, "");
            break;
        }
    }

    let view: ViewId | undefined;
    if (hash && config.views.includes(hash as ViewId)) {
        view = hash as ViewId;
    } else if (remaining && config.views.includes(remaining as ViewId)) {
        view = remaining as ViewId;
    }

    return { shell, view, params, hash };
}

/**
 * Build URL from route
 */
export function buildUrl(route: Route, config = DEFAULT_CONFIG): string {
    const parts: string[] = [];

    if (route.shell && route.shell !== config.defaultShell) {
        parts.push(route.shell);
    }

    let url = "/" + parts.join("/");

    if (route.view) {
        url += `#${route.view}`;
    }

    if (route.params && Object.keys(route.params).length > 0) {
        const search = new URLSearchParams(route.params).toString();
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

export const goBack = () => history.back();
export const goForward = () => history.forward();

// ============================================================================
// ROUTE MATCHING
// ============================================================================

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

export function getViewFromHash(): ViewId | null {
    const hash = location.hash.replace(/^#/, "");
    return (hash as ViewId) || null;
}

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
    return () => listeners.delete(listener);
}

/**
 * Initialize route listening
 */
export function initRouteListening(): void {
    window.addEventListener("popstate", () => {
        const route = parseCurrentRoute();
        listeners.forEach(l => l(route));
    });

    window.addEventListener("route-change", (e) => {
        const route = (e as CustomEvent).detail as Route;
        listeners.forEach(l => l(route));
    });

    window.addEventListener("hashchange", () => {
        const route = parseCurrentRoute();
        listeners.forEach(l => l(route));
    });
}

// ============================================================================
// SHELL-BASED APP LOADING
// ============================================================================

/**
 * Load sub-app using the new shell boot system
 */
export const loadSubAppWithShell = async (
    choice?: FrontendChoice,
    initialView?: string
): Promise<AppLoaderResult> => {
    console.log('[App] Loading sub-app with shell:', choice);
    const defaultView = (initialView || "viewer") as ViewId;

    try {
        switch (choice) {
            case "faint":
                return {
                    mount: async (el: HTMLElement) => {
                        await bootFaint(el, defaultView);
                    }
                };

            case "basic":
                return {
                    mount: async (el: HTMLElement) => {
                        await bootBasic(el, defaultView);
                    }
                };

            case "print":
            case "airpad":
                return {
                    mount: async (el: HTMLElement) => {
                        await bootRaw(el, choice as ViewId);
                    }
                };

            case "":
            case "/":
            default:
                const module = await import("./boot-menu");
                return {
                    mount: async (el: HTMLElement) => {
                        await module.default(el);
                    }
                };
        }
    } catch (error) {
        console.error('[App] Failed to load sub-app:', choice, error);
        throw error;
    }
};

// ============================================================================
// ROUTE RESOLUTION
// ============================================================================

/**
 * Map pathname to frontend choice
 */
export function resolvePathToChoice(pathname: string): FrontendChoice {
    const normalized = pathname.replace(/^\//, "").toLowerCase().trim();
    const choices: Record<string, FrontendChoice> = {
        basic: "basic", faint: "faint", print: "print", airpad: "airpad"
    };
    return choices[normalized] || (normalized === "" || normalized === "/" ? "" : "basic");
}

/**
 * Map pathname to view ID
 */
export function resolvePathToView(pathname: string): string {
    const normalized = pathname.replace(/^\//, "").toLowerCase().trim();
    const viewRoutes: Record<string, string> = {
        viewer: "viewer", workcenter: "workcenter", settings: "settings",
        explorer: "explorer", history: "history", editor: "editor",
        airpad: "airpad", print: "print", home: "home"
    };
    return viewRoutes[normalized] || "viewer";
}

/**
 * Get the appropriate loader based on routing mode
 */
export function getLoader(mode: RoutingMode = "shell-boot") {
    return loadSubAppWithShell;
}

// ============================================================================
// URL PARAMETER HANDLING
// ============================================================================

/**
 * Parse URL parameters for routing
 */
export function parseRoutingParams(): {
    choice: FrontendChoice;
    view: string;
    params: Record<string, string>;
} {
    const pathname = location.pathname || "/";
    const hash = location.hash.replace(/^#/, "");
    const searchParams = new URLSearchParams(location.search);

    const params: Record<string, string> = {};
    for (const [key, value] of searchParams) {
        params[key] = value;
    }

    const choice = resolvePathToChoice(pathname);

    let view = "viewer";
    if (hash) {
        view = hash;
    } else if (pathname.includes("/")) {
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length > 1) {
            view = parts[1];
        }
    }

    return { choice, view, params };
}

/**
 * Create boot config from URL/params
 */
export function createBootConfigFromUrl(): BootConfig {
    const { choice, view, params } = parseRoutingParams();

    let styleSystem: "veela" | "basic" | "raw" = "basic";
    let shell: ShellId = "basic";

    switch (choice) {
        case "faint":
            styleSystem = "veela";
            shell = "faint";
            break;
        case "airpad":
        case "print":
            styleSystem = "raw";
            shell = "raw";
            break;
        default:
            styleSystem = "basic";
            shell = "basic";
    }

    return {
        styleSystem,
        shell,
        defaultView: view as ViewId,
        channels: [view as any],
        rememberChoice: !params.shared
    };
}
