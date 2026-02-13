/**
 * Shell and View Registry
 *
 * Central registry for shell and view components.
 * Supports lazy loading and caching.
 */

import type {
    ShellId,
    ViewId,
    ShellRegistration,
    ViewRegistration,
    BootConfig,
    Shell,
    View,
    ViewFactory,
    ShellTheme
} from "./shells/types";

// ============================================================================
// SHELL REGISTRY
// ============================================================================

/**
 * Registry for shell components
 */
class ShellRegistryClass {
    private shells = new Map<ShellId, ShellRegistration>();
    private loadedShells = new Map<ShellId, Shell>();

    /**
     * Register a shell
     */
    register(registration: ShellRegistration): void {
        this.shells.set(registration.id, registration);
    }

    /**
     * Get a shell registration
     */
    get(id: ShellId): ShellRegistration | undefined {
        return this.shells.get(id);
    }

    /**
     * Get all registered shells
     */
    getAll(): ShellRegistration[] {
        return Array.from(this.shells.values());
    }

    /**
     * Load and instantiate a shell
     */
    async load(id: ShellId, container: HTMLElement): Promise<Shell> {
        // Return cached instance if available
        const cached = this.loadedShells.get(id);
        if (cached) {
            return cached;
        }

        const registration = this.shells.get(id);
        if (!registration) {
            throw new Error(`Shell not found: ${id}`);
        }

        const module = await registration.loader();
        const factory = (module as any).default || (module as any).createShell;

        if (typeof factory !== "function") {
            throw new Error(`Invalid shell module: ${id}`);
        }

        const shell = factory(container);
        this.loadedShells.set(id, shell);
        return shell;
    }

    /**
     * Unload a shell
     */
    unload(id: ShellId): void {
        const shell = this.loadedShells.get(id);
        if (shell) {
            shell.unmount();
            this.loadedShells.delete(id);
        }
    }

    /**
     * Check if a shell is loaded
     */
    isLoaded(id: ShellId): boolean {
        return this.loadedShells.has(id);
    }

    /**
     * Get a loaded shell instance
     */
    getLoaded(id: ShellId): Shell | undefined {
        return this.loadedShells.get(id);
    }
}

export const ShellRegistry = new ShellRegistryClass();

// ============================================================================
// VIEW REGISTRY
// ============================================================================

/**
 * Registry for view components
 */
class ViewRegistryClass {
    private views = new Map<ViewId, ViewRegistration>();
    private loadedViews = new Map<ViewId, View>();

    /**
     * Register a view
     */
    register(registration: ViewRegistration): void {
        this.views.set(registration.id, registration);
    }

    /**
     * Get a view registration
     */
    get(id: ViewId): ViewRegistration | undefined {
        return this.views.get(id);
    }

    /**
     * Get all registered views
     */
    getAll(): ViewRegistration[] {
        return Array.from(this.views.values());
    }

    /**
     * Load and instantiate a view
     */
    async load(id: ViewId, options?: Parameters<ViewFactory>[0]): Promise<View> {
        // Return cached instance if available and no new options
        const cached = this.loadedViews.get(id);
        if (cached && !options) {
            return cached;
        }

        const registration = this.views.get(id);
        if (!registration) {
            throw new Error(`View not found: ${id}`);
        }

        const module = await registration.loader();
        const factory: ViewFactory = (module as any).default || (module as any).createView;

        if (typeof factory !== "function") {
            throw new Error(`Invalid view module: ${id}`);
        }

        const view = await factory(options);
        this.loadedViews.set(id, view);
        return view;
    }

    /**
     * Unload a view (clear cache)
     */
    unload(id: ViewId): void {
        const view = this.loadedViews.get(id);
        if (view?.lifecycle?.onUnmount) {
            view.lifecycle.onUnmount();
        }
        this.loadedViews.delete(id);
    }

    /**
     * Check if a view is loaded
     */
    isLoaded(id: ViewId): boolean {
        return this.loadedViews.has(id);
    }

    /**
     * Get a loaded view instance
     */
    getLoaded(id: ViewId): View | undefined {
        return this.loadedViews.get(id);
    }
}

export const ViewRegistry = new ViewRegistryClass();

// ============================================================================
// DEFAULT REGISTRATIONS
// ============================================================================

/**
 * Register default shells
 */
export function registerDefaultShells(): void {
    // Raw shell (minimal, no frames)
    ShellRegistry.register({
        id: "raw",
        name: "Raw",
        description: "Minimal shell with no frames or navigation",
        loader: () => import("./shells/raw/index")
    });

    // Minimalshell (simple toolbar-based navigation)
    ShellRegistry.register({
        id: "minimal",
        name: "Minimal",
        description: "Minimal toolbar-based navigation",
        loader: () => import("./shells/minimal/index")
    });

    // Faint shell (tabbed sidebar navigation)
    ShellRegistry.register({
        id: "faint",
        name: "Faint",
        description: "Experimental tabbed interface with sidebar",
        loader: () => import("./shells/faint/index")
    });
}

/**
 * Register default views
 */
export function registerDefaultViews(): void {
    ViewRegistry.register({
        id: "viewer",
        name: "Viewer",
        icon: "eye",
        loader: () => import("./views/viewer")
    });

    ViewRegistry.register({
        id: "workcenter",
        name: "Work Center",
        icon: "lightning",
        loader: () => import("./views/workcenter")
    });

    ViewRegistry.register({
        id: "settings",
        name: "Settings",
        icon: "gear",
        loader: () => import("./views/settings")
    });

    ViewRegistry.register({
        id: "history",
        name: "History",
        icon: "clock-counter-clockwise",
        loader: () => import("./views/history")
    });

    ViewRegistry.register({
        id: "explorer",
        name: "Explorer",
        icon: "folder",
        loader: () => import("./views/explorer")
    });

    ViewRegistry.register({
        id: "airpad",
        name: "Airpad",
        icon: "hand-pointing",
        loader: () => import("./views/airpad")
    });

    ViewRegistry.register({
        id: "editor",
        name: "Editor",
        icon: "pencil",
        loader: () => import("./views/editor")
    });

    ViewRegistry.register({
        id: "home",
        name: "Home",
        icon: "house",
        loader: () => import("./views/home")
    });

    ViewRegistry.register({
        id: "print",
        name: "Print",
        icon: "printer",
        loader: () => import("./views/print")
    });
}

// ============================================================================
// DEFAULT THEME
// ============================================================================

export const defaultTheme: ShellTheme = {
    id: "auto",
    name: "Auto",
    colorScheme: "auto"
};

export const lightTheme: ShellTheme = {
    id: "light",
    name: "Light",
    colorScheme: "light"
};

export const darkTheme: ShellTheme = {
    id: "dark",
    name: "Dark",
    colorScheme: "dark"
};

// ============================================================================
// BOOT CONFIGURATION
// ============================================================================

/**
 * Get default boot configuration
 */
export function getDefaultBootConfig(): BootConfig {
    return {
        defaultShell: "minimal",
        defaultView: "viewer",
        theme: defaultTheme,
        rememberShellChoice: true,
        availableShells: ShellRegistry.getAll(),
        availableViews: ViewRegistry.getAll()
    };
}

/**
 * Initialize registries with default shells and views
 */
export function initializeRegistries(): void {
    registerDefaultShells();
    registerDefaultViews();
}
