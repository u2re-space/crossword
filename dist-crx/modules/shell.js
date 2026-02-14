import './Env.js';
import { ref, preloadStyle, loadInlineStyle } from './Settings.js';
import { ViewRegistry } from './crx-entry.js';
import { showToast } from './Toast.js';

class ShellBase {
  // State (using any to work around fest/object type inference issue)
  theme = ref({ id: "auto", name: "Auto", colorScheme: "auto" });
  currentView = ref("home");
  navigationState = {
    currentView: "home",
    viewHistory: []
  };
  // DOM elements
  container = null;
  rootElement = null;
  contentContainer = null;
  toolbarContainer = null;
  statusContainer = null;
  // View cache
  loadedViews = /* @__PURE__ */ new Map();
  currentViewElement = null;
  // Mounted state
  mounted = false;
  // ========================================================================
  // SHELL INTERFACE IMPLEMENTATION
  // ========================================================================
  async mount(container) {
    if (this.mounted) {
      console.warn(`[${this.id}] Shell already mounted`);
      return;
    }
    this.container = container;
    const stylesheet = this.getStylesheet();
    if (stylesheet) {
      const styled = await preloadStyle(stylesheet);
      if (styled) {
        await loadInlineStyle(stylesheet);
      }
    }
    this.rootElement = this.createLayout();
    this.rootElement.setAttribute("data-shell", this.id);
    this.contentContainer = this.rootElement.querySelector("[data-shell-content]") || this.rootElement;
    this.toolbarContainer = this.rootElement.querySelector("[data-shell-toolbar]");
    this.statusContainer = this.rootElement.querySelector("[data-shell-status]");
    this.applyTheme(this.theme.value);
    container.replaceChildren(this.rootElement);
    this.mounted = true;
    console.log(`[${this.id}] Shell mounted with data-shell="${this.id}"`);
  }
  unmount() {
    if (!this.mounted) return;
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
    this.rootElement?.remove();
    this.rootElement = null;
    this.contentContainer = null;
    this.toolbarContainer = null;
    this.statusContainer = null;
    this.container = null;
    this.mounted = false;
    console.log(`[${this.id}] Shell unmounted`);
  }
  async navigate(viewId, params) {
    console.log(`[${this.id}] Navigating to: ${viewId}`, params);
    const previousView = this.navigationState.currentView;
    this.navigationState.previousView = previousView;
    this.navigationState.currentView = viewId;
    this.navigationState.params = params;
    if (this.navigationState.viewHistory[this.navigationState.viewHistory.length - 1] !== viewId) {
      this.navigationState.viewHistory.push(viewId);
      if (this.navigationState.viewHistory.length > 50) {
        this.navigationState.viewHistory.shift();
      }
    }
    this.currentView.value = viewId;
    if (typeof window !== "undefined") {
      const pathname = `/${viewId}`;
      const search = params ? "?" + new URLSearchParams(params).toString() : "";
      const newUrl = pathname + search;
      if (window.location.pathname !== pathname) {
        window.history.pushState({ viewId, params }, "", newUrl);
      }
    }
    try {
      const element = await this.loadView(viewId, params);
      this.renderView(element);
    } catch (error) {
      console.error(`[${this.id}] Failed to load view ${viewId}:`, error);
      this.showMessage(`Failed to load ${viewId}`);
    }
  }
  async loadView(viewId, params) {
    const cached = this.loadedViews.get(viewId);
    if (cached) {
      if (cached.view.lifecycle?.onShow) {
        cached.view.lifecycle.onShow();
      }
      if (cached.view.getToolbar && this.toolbarContainer) {
        const toolbar = cached.view.getToolbar();
        this.setViewToolbar(toolbar);
      }
      return cached.element;
    }
    const view = await ViewRegistry.load(viewId, {
      shellContext: this.getContext(),
      params
    });
    const element = view.render({
      shellContext: this.getContext(),
      params
    });
    this.loadedViews.set(viewId, { view, element });
    if (view.getToolbar && this.toolbarContainer) {
      const toolbar = view.getToolbar();
      this.setViewToolbar(toolbar);
    }
    if (view.lifecycle?.onMount) {
      await view.lifecycle.onMount();
    }
    if (view.lifecycle?.onShow) {
      view.lifecycle.onShow();
    }
    return element;
  }
  setTheme(theme) {
    this.theme.value = theme;
    this.applyTheme(theme);
  }
  getContext() {
    return {
      shellId: this.id,
      navigate: (viewId, params) => this.navigate(viewId, params),
      goBack: () => this.goBack(),
      showMessage: (msg, duration) => this.showMessage(msg, duration),
      navigationState: this.navigationState,
      theme: this.theme.value,
      layout: this.layout,
      getContentContainer: () => this.contentContainer,
      getToolbarContainer: () => this.toolbarContainer,
      setViewToolbar: (toolbar) => this.setViewToolbar(toolbar)
    };
  }
  getElement() {
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
  renderView(element) {
    if (!this.contentContainer) {
      console.warn(`[${this.id}] No content container available`);
      return;
    }
    const previousId = this.navigationState.previousView;
    if (previousId && previousId !== this.currentView.value && this.loadedViews.has(previousId)) {
      const prev = this.loadedViews.get(previousId);
      if (prev.view.lifecycle?.onHide) {
        prev.view.lifecycle.onHide();
      }
      prev.element.removeAttribute("data-view");
      prev.element.hidden = true;
      if (this.contentContainer.contains(prev.element)) {
        prev.element.remove();
      }
    }
    element.setAttribute("data-view", this.currentView.value);
    element.hidden = false;
    if (!this.contentContainer.contains(element)) {
      this.contentContainer.appendChild(element);
    }
    this.currentViewElement = element;
  }
  /**
   * Apply theme to the shell
   */
  applyTheme(theme) {
    if (!this.rootElement) return;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const resolved = theme.colorScheme === "dark" ? "dark" : theme.colorScheme === "light" ? "light" : prefersDark ? "dark" : "light";
    this.rootElement.dataset.theme = resolved;
    this.rootElement.style.colorScheme = resolved;
    if (theme.cssVariables) {
      for (const [key, value] of Object.entries(theme.cssVariables)) {
        this.rootElement.style.setProperty(key, value);
      }
    }
  }
  /**
   * Go back in navigation history
   */
  goBack() {
    const history = this.navigationState.viewHistory;
    if (history.length > 1) {
      history.pop();
      const previous = history[history.length - 1];
      if (previous) {
        this.navigate(previous);
      }
    }
  }
  /**
   * Show a status message
   */
  showMessage(message, duration = 3e3) {
    showToast({ message, duration, kind: "info" });
  }
  /**
   * Set the current view's toolbar
   */
  setViewToolbar(toolbar) {
    if (!this.toolbarContainer) return;
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
  setupHashNavigation() {
  }
  /**
   * Setup popstate navigation (back/forward buttons)
   */
  setupPopstateNavigation() {
    if (typeof window === "undefined") return;
    window.addEventListener("popstate", (event) => {
      const pathname = window.location.pathname.replace(/^\//, "").toLowerCase();
      const viewId = event.state?.viewId || pathname || "viewer";
      if (viewId !== this.currentView.value) {
        this.navigationState.currentView = viewId;
        this.currentView.value = viewId;
        this.loadView(viewId, event.state?.params).then((element) => {
          this.renderView(element);
        }).catch(console.error);
      }
    });
  }
  /**
   * Get view ID from current pathname
   */
  getViewFromPathname() {
    if (typeof window === "undefined") return null;
    const pathname = window.location.pathname.replace(/^\//, "").toLowerCase();
    if (!pathname || pathname === "/") {
      return null;
    }
    return pathname;
  }
}

export { ShellBase };
//# sourceMappingURL=shell.js.map
