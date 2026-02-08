/**
 * Base Shell Implementation
 *
 * Provides common functionality for all shells.
 * Concrete shells extend this class and customize the layout.
 */

import { ref } from "fest/object";
import { loadInlineStyle, preloadStyle } from "fest/dom";
import { ViewRegistry } from "../../../registry";
import type {
    Shell,
    ShellId,
    ViewId,
    ShellTheme,
    ShellContext,
    ShellLayoutConfig,
    ShellNavigationState,
    View
} from "../../types";

//
import "fest/fl-ui";

// ============================================================================
// BASE SHELL IMPLEMENTATION
// ============================================================================

/**
 * Abstract base shell with common functionality
 */
export abstract class BaseShell implements Shell {
    // Shell properties
    abstract id: ShellId;
    abstract name: string;
    abstract layout: ShellLayoutConfig;

    // State (using any to work around fest/object type inference issue)
    theme = ref<ShellTheme>({ id: "auto", name: "Auto", colorScheme: "auto" }) as { value: ShellTheme };
    currentView = ref<ViewId>("home") as { value: ViewId };
    protected navigationState: ShellNavigationState = {
        currentView: "home",
        viewHistory: []
    };

    // DOM elements
    protected container: HTMLElement | null = null;
    protected rootElement: HTMLElement | null = null;
    protected contentContainer: HTMLElement | null = null;
    protected toolbarContainer: HTMLElement | null = null;
    protected statusContainer: HTMLElement | null = null;

    // View cache
    protected loadedViews = new Map<ViewId, { view: View; element: HTMLElement }>();
    protected currentViewElement: HTMLElement | null = null;

    // Mounted state
    protected mounted = false;

    // ========================================================================
    // ABSTRACT METHODS (to be implemented by concrete shells)
    // ========================================================================

    /**
     * Create the shell's root layout element
     */
    protected abstract createLayout(): HTMLElement;

    /**
     * Get shell-specific stylesheet (optional)
     */
    protected abstract getStylesheet(): string | null;

    // ========================================================================
    // SHELL INTERFACE IMPLEMENTATION
    // ========================================================================

    async mount(container: HTMLElement): Promise<void> {
        if (this.mounted) {
            console.warn(`[${this.id}] Shell already mounted`);
            return;
        }

        this.container = container;

        // Load stylesheet if provided
        const stylesheet = this.getStylesheet();
        if (stylesheet) {
            const styled = await preloadStyle(stylesheet);
            if (styled) {
                await loadInlineStyle(stylesheet);
            }
        }

        // Create layout
        this.rootElement = this.createLayout();

        // CRITICAL: Set data-shell attribute for context-based CSS selectors
        // This enables :has([data-shell="...""]) selectors to cascade automatically
        this.rootElement.setAttribute('data-shell', this.id);

        // Find containers
        this.contentContainer = this.rootElement.querySelector("[data-shell-content]") || this.rootElement;
        this.toolbarContainer = this.rootElement.querySelector("[data-shell-toolbar]");
        this.statusContainer = this.rootElement.querySelector("[data-shell-status]");

        // Apply initial theme
        this.applyTheme(this.theme.value);

        // Mount to container
        container.replaceChildren(this.rootElement);
        this.mounted = true;

        console.log(`[${this.id}] Shell mounted with data-shell="${this.id}"`);
    }

    unmount(): void {
        if (!this.mounted) return;

        // Cleanup views
        for (const [viewId, { view }] of this.loadedViews) {
            if (view.lifecycle?.onUnmount) {
                try {
                    view.lifecycle.onUnmount();
                } catch (e) {
                    console.warn(`[${this.id}] View ${viewId} unmount error:`, e);
                }
            }
        }
        this.loadedViews.clear();

        // Clear DOM
        this.rootElement?.remove();
        this.rootElement = null;
        this.contentContainer = null;
        this.toolbarContainer = null;
        this.statusContainer = null;
        this.container = null;
        this.mounted = false;

        console.log(`[${this.id}] Shell unmounted`);
    }

    async navigate(viewId: ViewId, params?: Record<string, string>): Promise<void> {
        console.log(`[${this.id}] Navigating to: ${viewId}`, params);

        // Update navigation state
        const previousView = this.navigationState.currentView;
        this.navigationState.previousView = previousView;
        this.navigationState.currentView = viewId;
        this.navigationState.params = params;

        // Add to history (avoid duplicates)
        if (this.navigationState.viewHistory[this.navigationState.viewHistory.length - 1] !== viewId) {
            this.navigationState.viewHistory.push(viewId);
            // Limit history size
            if (this.navigationState.viewHistory.length > 50) {
                this.navigationState.viewHistory.shift();
            }
        }

        // Update reactive state
        this.currentView.value = viewId;

        // Update URL pathname (path-based routing, no hash)
        if (typeof window !== "undefined") {
            const pathname = `/${viewId}`;
            const search = params ? "?" + new URLSearchParams(params).toString() : "";
            const newUrl = pathname + search;

            if (window.location.pathname !== pathname) {
                window.history.pushState({ viewId, params }, "", newUrl);
            }
        }

        // Load and render view
        try {
            const element = await this.loadView(viewId, params);
            this.renderView(element);
        } catch (error) {
            console.error(`[${this.id}] Failed to load view ${viewId}:`, error);
            this.showMessage(`Failed to load ${viewId}`);
        }
    }

    async loadView(viewId: ViewId, params?: Record<string, string>): Promise<HTMLElement> {
        // Check cache first
        const cached = this.loadedViews.get(viewId);
        if (cached) {
            // Call onShow lifecycle
            if (cached.view.lifecycle?.onShow) {
                cached.view.lifecycle.onShow();
            }
            // Update toolbar if view has one
            if (cached.view.getToolbar && this.toolbarContainer) {
                const toolbar = cached.view.getToolbar();
                this.setViewToolbar(toolbar);
            }
            return cached.element;
        }

        // Load view from registry
        const view = await ViewRegistry.load(viewId, {
            shellContext: this.getContext(),
            params
        });

        // Render view
        const element = view.render({
            shellContext: this.getContext(),
            params
        });

        // Cache view
        this.loadedViews.set(viewId, { view, element });

        // Set toolbar if view has one
        if (view.getToolbar && this.toolbarContainer) {
            const toolbar = view.getToolbar();
            this.setViewToolbar(toolbar);
        }

        // Call lifecycle
        if (view.lifecycle?.onMount) {
            await view.lifecycle.onMount();
        }
        if (view.lifecycle?.onShow) {
            view.lifecycle.onShow();
        }

        return element;
    }

    setTheme(theme: ShellTheme): void {
        this.theme.value = theme;
        this.applyTheme(theme);
    }

    getContext(): ShellContext {
        return {
            shellId: this.id,
            navigate: (viewId, params) => this.navigate(viewId, params),
            goBack: () => this.goBack(),
            showMessage: (msg, duration) => this.showMessage(msg, duration),
            navigationState: this.navigationState,
            theme: this.theme.value,
            layout: this.layout,
            getContentContainer: () => this.contentContainer!,
            getToolbarContainer: () => this.toolbarContainer,
            setViewToolbar: (toolbar) => this.setViewToolbar(toolbar)
        };
    }

    getElement(): HTMLElement {
        if (!this.rootElement) {
            throw new Error(`[${this.id}] Shell not mounted`);
        }
        return this.rootElement;
    }

    // ========================================================================
    // PROTECTED METHODS
    // ========================================================================

    /**
     * Render a view into the content container
     */
    protected renderView(element: HTMLElement): void {
        if (!this.contentContainer) {
            console.warn(`[${this.id}] No content container available`);
            return;
        }

        // Hide previous view AND remove data-view to stop :has() matching
        const previousId = this.navigationState.previousView;
        if (previousId && this.loadedViews.has(previousId)) {
            const prev = this.loadedViews.get(previousId)!;
            if (prev.view.lifecycle?.onHide) {
                prev.view.lifecycle.onHide();
            }
            prev.element.removeAttribute("data-view");
            prev.element.hidden = true;
        }

        // Show new view AND set data-view for :has() context selectors
        element.setAttribute("data-view", this.currentView.value);
        element.hidden = false;

        // Add to content if not already there
        if (!this.contentContainer.contains(element)) {
            this.contentContainer.appendChild(element);
        }

        this.currentViewElement = element;
    }

    /**
     * Apply theme to the shell
     */
    protected applyTheme(theme: ShellTheme): void {
        if (!this.rootElement) return;

        // Set color scheme
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
        const resolved = theme.colorScheme === "dark" ? "dark"
            : theme.colorScheme === "light" ? "light"
            : prefersDark ? "dark" : "light";

        this.rootElement.dataset.theme = resolved;
        this.rootElement.style.colorScheme = resolved;

        // Apply CSS variables if provided
        if (theme.cssVariables) {
            for (const [key, value] of Object.entries(theme.cssVariables)) {
                this.rootElement.style.setProperty(key, value);
            }
        }
    }

    /**
     * Go back in navigation history
     */
    protected goBack(): void {
        const history = this.navigationState.viewHistory;
        if (history.length > 1) {
            // Remove current
            history.pop();
            // Navigate to previous
            const previous = history[history.length - 1];
            if (previous) {
                this.navigate(previous);
            }
        }
    }

    /**
     * Show a status message
     */
    protected showMessage(message: string, duration = 3000): void {
        if (!this.statusContainer) {
            console.log(`[${this.id}] Status: ${message}`);
            return;
        }

        this.statusContainer.textContent = message;
        this.statusContainer.hidden = false;

        setTimeout(() => {
            if (this.statusContainer?.textContent === message) {
                this.statusContainer.textContent = "";
                this.statusContainer.hidden = true;
            }
        }, duration);
    }

    /**
     * Set the current view's toolbar
     */
    protected setViewToolbar(toolbar: HTMLElement | null): void {
        if (!this.toolbarContainer) return;

        // Clear existing toolbar content
        this.toolbarContainer.replaceChildren();

        if (toolbar) {
            this.toolbarContainer.appendChild(toolbar);
        }
    }

    // ========================================================================
    // PATH-BASED NAVIGATION
    // ========================================================================

    /**
     * Setup path-based navigation (listen to route-change events)
     * @deprecated Use setupPopstateNavigation instead
     */
    protected setupHashNavigation(): void {
        // No-op for backwards compatibility
        // Path-based routing doesn't use hash changes
    }

    /**
     * Setup popstate navigation (back/forward buttons)
     */
    protected setupPopstateNavigation(): void {
        if (typeof window === "undefined") return;

        window.addEventListener("popstate", (event) => {
            // Get view from pathname
            const pathname = window.location.pathname.replace(/^\//, "").toLowerCase();
            const viewId = (event.state?.viewId || pathname || "viewer") as ViewId;

            if (viewId !== this.currentView.value) {
                // Navigate without pushing new history
                this.navigationState.currentView = viewId;
                this.currentView.value = viewId;
                this.loadView(viewId, event.state?.params).then(element => {
                    this.renderView(element);
                }).catch(console.error);
            }
        });
    }

    /**
     * Get view ID from current pathname
     */
    protected getViewFromPathname(): ViewId | null {
        if (typeof window === "undefined") return null;

        const pathname = window.location.pathname.replace(/^\//, "").toLowerCase();
        if (!pathname || pathname === "/") {
            return null; // Root route
        }
        return pathname as ViewId;
    }
}
