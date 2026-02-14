import { ShellBase } from './shell.js';
import { ref, observe, H, affected } from './Settings.js';
import { ViewRegistry } from './crx-entry.js';
import './index16.js';
import './Toast.js';
import './Runtime2.js';
import './index.js';
import './UnifiedMessaging.js';
import './BuiltInAI.js';
import './Clipboard.js';
import './Markdown.js';
import './browser.js';
import './_commonjsHelpers.js';
import './auto-render.js';
import './index17.js';

const style = "@layer layer.shell.faint{:is(html,body):has([data-shell=faint]){--shell-nav-height:0;--shell-sidebar-width:240px;--shell-sidebar-collapsed:48px;--shell-tab-height:36px;--shell-toolbar-height:40px;--shell-status-height:24px;--faint-nav-bg:light-dark(var(--color-surface-container-high),var(--color-surface-container-high));--faint-nav-border:light-dark(var(--color-outline-variant),var(--color-outline-variant));--faint-sidebar-bg:light-dark(var(--color-surface-container-high),var(--color-surface-container-high));--shell-sidebar-bg:light-dark(var(--color-surface),var(--color-surface));--shell-sidebar-fg:light-dark(var(--color-on-surface),var(--color-on-surface));--shell-sidebar-border:light-dark(var(--color-border),var(--color-border));--shell-tabs-bg:light-dark(var(--color-surface-elevated),var(--color-surface-elevated));--shell-tab-active-bg:light-dark(var(--color-surface),var(--color-surface));--shell-tab-hover-bg:light-dark(var(--color-surface-hover),var(--color-surface-hover))}:root:has(.app-shell,.app-shell[data-style=faint]),:where(.app-shell,.app-shell[data-style=faint]){--shell-sidebar-width:240px;--shell-sidebar-width-collapsed:56px;--shell-tabs-height:40px;--shell-toolbar-height:48px;--shell-bg:light-dark(var(--color-surface),var(--color-surface));--shell-fg:light-dark(var(--color-on-surface),var(--color-on-surface));--shell-sidebar-bg:light-dark(var(--color-surface-container-high),var(--color-surface-container-high));--shell-sidebar-border:light-dark(var(--color-outline-variant),var(--color-outline-variant));--shell-tabs-bg:light-dark(var(--color-surface-container-high),var(--color-surface-container-high));--shell-tab-hover:light-dark(var(--color-surface-container-highest),var(--color-surface-container-highest));--shell-tab-active-bg:light-dark(var(--color-surface-container-highest),var(--color-surface-container-highest));--shell-tab-active-border:light-dark(var(--color-primary),var(--color-primary));--shell-accent:light-dark(var(--color-primary),var(--color-primary));--shell-accent-fg:light-dark(var(--color-on-primary),var(--color-on-primary));--shell-status-bg:light-dark(color-mix(in oklab,var(--color-surface) 85%,var(--color-on-surface)),color-mix(in oklab,var(--color-surface) 85%,var(--color-on-surface)));--shell-status-fg:light-dark(var(--color-on-primary),var(--color-on-primary))}.app-shell{background-color:var(--shell-bg);color:var(--shell-fg);display:flex;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;inset:0;overflow:hidden;position:absolute}.app-shell__sidebar{background-color:var(--shell-sidebar-bg);border-inline-end:1px solid var(--shell-sidebar-border);display:flex;flex-direction:column;flex-shrink:0;inline-size:var(--shell-sidebar-width);transition:inline-size .2s ease}.app-shell__sidebar[data-collapsed=true]{inline-size:var(--shell-sidebar-width-collapsed)}.app-shell__sidebar[data-collapsed=true] .app-shell__sidebar-label{display:none}.app-shell__sidebar[data-collapsed=true] .app-shell__sidebar-item{justify-content:center;padding-inline:.75rem}.app-shell__sidebar-header{align-items:center;block-size:var(--shell-tabs-height);display:flex;justify-content:flex-end;padding:.5rem}.app-shell__sidebar-toggle{align-items:center;background:#0000;block-size:32px;border:none;border-radius:6px;color:var(--shell-fg);cursor:pointer;display:flex;inline-size:32px;justify-content:center;opacity:.6;transition:opacity .15s ease,background-color .15s ease}.app-shell__sidebar-toggle:hover{background-color:var(--shell-tab-hover);opacity:1}.app-shell__sidebar-nav{display:flex;flex-direction:column;gap:.25rem;overflow-y:auto;padding:.5rem}.app-shell__sidebar-item{align-items:center;background:#0000;border:none;border-radius:8px;color:var(--shell-fg);cursor:pointer;display:flex;font-size:.875rem;font-weight:500;gap:.75rem;padding:.625rem .75rem;text-align:start;transition:background-color .15s ease,color .15s ease}.app-shell__sidebar-item ui-icon{flex-shrink:0;font-size:1.125rem;opacity:.7}.app-shell__sidebar-item:hover{background-color:var(--shell-tab-hover)}.app-shell__sidebar-item.active{background-color:var(--shell-tab-active-bg);color:var(--shell-accent)}.app-shell__sidebar-item.active ui-icon{opacity:1}.app-shell__sidebar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.app-shell__main{display:flex;flex:1;flex-direction:column;min-inline-size:0;overflow:hidden}.app-shell__tabs{align-items:center;background-color:var(--shell-tabs-bg);block-size:var(--shell-tabs-height);border-block-end:1px solid var(--shell-sidebar-border);display:flex;flex-shrink:0}.app-shell__tabs-list{display:flex;flex:1;overflow-x:auto;scrollbar-width:none}.app-shell__tabs-list::-webkit-scrollbar{display:none}.app-shell__tab{align-items:center;background:#0000;border:none;border-block-end:2px solid #0000;color:var(--shell-fg);cursor:pointer;display:flex;font-size:.8125rem;gap:.5rem;padding:.5rem .75rem;padding-inline-end:.5rem;transition:background-color .15s ease,border-color .15s ease;white-space:nowrap}.app-shell__tab ui-icon{font-size:.875rem;opacity:.7}.app-shell__tab:hover{background-color:var(--shell-tab-hover)}.app-shell__tab.active{background-color:var(--shell-tab-active-bg);border-block-end-color:var(--shell-tab-active-border)}.app-shell__tab.active ui-icon{opacity:1}.app-shell__tab-label{max-inline-size:120px;overflow:hidden;text-overflow:ellipsis}.app-shell__tab-close{align-items:center;background:#0000;block-size:18px;border:none;border-radius:4px;color:var(--shell-fg);cursor:pointer;display:flex;inline-size:18px;justify-content:center;opacity:.5;transition:opacity .15s ease,background-color .15s ease}.app-shell__tab-close:hover{background-color:#ff000026;color:#d32f2f;opacity:1}.app-shell__tabs-actions{display:flex;padding-inline:.5rem}.app-shell__tabs-add{align-items:center;background:#0000;block-size:28px;border:none;border-radius:6px;color:var(--shell-fg);cursor:pointer;display:flex;inline-size:28px;justify-content:center;opacity:.6;transition:opacity .15s ease,background-color .15s ease}.app-shell__tabs-add:hover{background-color:var(--shell-tab-hover);opacity:1}.app-shell__toolbar{align-items:center;background-color:var(--shell-tabs-bg);block-size:var(--shell-toolbar-height);border-block-end:1px solid var(--shell-sidebar-border);display:flex;gap:.5rem;padding-inline:1rem}.app-shell__toolbar:empty{display:none}.app-shell__content{container-type:size;display:flex;flex:1;flex-direction:column;overflow:hidden;position:relative}.app-shell__content>*{flex:1;overflow:auto}.app-shell__home{align-items:center;background:linear-gradient(135deg,var(--shell-bg) 0,var(--shell-sidebar-bg) 100%);display:flex;justify-content:center;padding:2rem}.app-shell__home-content{max-inline-size:600px;text-align:center}.app-shell__home-title{color:var(--shell-fg);font-size:2.5rem;font-weight:700;margin:0 0 .5rem}.app-shell__home-subtitle{color:var(--shell-fg);font-size:1.125rem;margin:0 0 2rem;opacity:.7}.app-shell__home-quick-actions{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center}.app-shell__home-action{align-items:center;background-color:var(--shell-sidebar-bg);border:1px solid var(--shell-sidebar-border);border-radius:12px;color:var(--shell-fg);cursor:pointer;display:flex;flex-direction:column;font-size:.875rem;font-weight:500;gap:.75rem;padding:1.5rem 2rem;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.app-shell__home-action ui-icon{opacity:.8}.app-shell__home-action:hover{border-color:var(--shell-accent);box-shadow:0 4px 12px #0000001a;transform:translateY(-2px)}.app-shell__home-action:hover ui-icon{color:var(--shell-accent);opacity:1}.app-shell__status{animation:app-shell-status-enter .2s ease-out;background-color:var(--shell-status-bg);border-radius:8px;box-shadow:0 4px 12px #00000026;color:var(--shell-status-fg);font-size:.875rem;font-weight:500;inset-block-end:1.5rem;inset-inline-start:50%;padding:.75rem 1.5rem;position:fixed;transform:translateX(-50%);z-index:2}.app-shell__status:empty,.app-shell__status[hidden]{display:none}@media (max-width:768px){.app-shell__sidebar{box-shadow:2px 0 8px #0000001a;inset-block:0;inset-inline-start:0;position:fixed;z-index:1}.app-shell__sidebar[data-collapsed=true]{inset-inline-start:calc(-1 * var(--shell-sidebar-width-collapsed))}.app-shell__home-quick-actions{align-items:center;flex-direction:column}.app-shell__home-action{inline-size:100%;max-inline-size:280px}}@media print{.app-shell__sidebar,.app-shell__status,.app-shell__tabs,.app-shell__toolbar{display:none!important}.app-shell__content{overflow:visible}}}";

"use strict";
class FaintShell extends ShellBase {
  id = "faint";
  name = "Faint";
  layout = {
    hasSidebar: true,
    hasToolbar: true,
    hasTabs: true,
    supportsMultiView: true,
    supportsWindowing: false
  };
  // UI State
  sidebarCollapsed = ref(false);
  openTabs = observe(/* @__PURE__ */ new Map());
  activeTab = ref("home");
  // UI Elements (used for future extensions)
  // @ts-expect-error - kept for future use
  sidebarElement = null;
  // @ts-expect-error - kept for future use
  tabBarElement = null;
  createLayout() {
    const root = H`
            <div class="app-shell" data-shell="faint">
                ${this.createSidebar()}
                <div class="app-shell__main">
                    ${this.createTabBar()}
                    <div class="app-shell__toolbar" data-shell-toolbar>
                        <!-- View-specific toolbar -->
                    </div>
                    <main class="app-shell__content" data-shell-content role="main">
                        ${this.createHomeView()}
                    </main>
                </div>
                <div class="app-shell__status" data-shell-status hidden aria-live="polite"></div>
            </div>
        `;
    return root;
  }
  createSidebar() {
    const mainViews = [
      { id: "home", name: "Home", icon: "house" },
      { id: "viewer", name: "Viewer", icon: "eye" },
      { id: "editor", name: "Editor", icon: "pencil" },
      { id: "workcenter", name: "Work Center", icon: "lightning" },
      { id: "explorer", name: "Explorer", icon: "folder" },
      { id: "airpad", name: "Airpad", icon: "hand-pointing" },
      { id: "settings", name: "Settings", icon: "gear" },
      { id: "history", name: "History", icon: "clock-counter-clockwise" }
    ];
    const sidebar = H`
            <aside class="app-shell__sidebar" data-collapsed="${this.sidebarCollapsed.value}">
                <div class="app-shell__sidebar-header">
                    <button
                        class="app-shell__sidebar-toggle"
                        type="button"
                        title="Toggle sidebar"
                        aria-label="Toggle sidebar"
                    >
                        <ui-icon icon="sidebar" icon-style="duotone"></ui-icon>
                    </button>
                </div>
                <nav class="app-shell__sidebar-nav" role="navigation">
                    ${mainViews.map((item) => H`
                        <button
                            class="app-shell__sidebar-item"
                            data-view="${item.id}"
                            type="button"
                            title="${item.name}"
                        >
                            <ui-icon icon="${item.icon}" icon-style="duotone"></ui-icon>
                            <span class="app-shell__sidebar-label">${item.name}</span>
                        </button>
                    `)}
                </nav>
            </aside>
        `;
    const toggleBtn = sidebar.querySelector(".app-shell__sidebar-toggle");
    toggleBtn?.addEventListener("click", () => {
      this.sidebarCollapsed.value = !this.sidebarCollapsed.value;
      sidebar.dataset.collapsed = String(this.sidebarCollapsed.value);
    });
    sidebar.addEventListener("click", (e) => {
      const target = e.target;
      const button = target.closest("[data-view]");
      if (!button) return;
      const viewId = button.dataset.view;
      if (viewId) {
        this.navigate(viewId);
      }
    });
    affected(this.activeTab, (viewId) => {
      const buttons = sidebar.querySelectorAll("[data-view]");
      buttons.forEach((btn) => {
        const isActive = btn.dataset.view === viewId;
        btn.classList.toggle("active", isActive);
      });
    });
    this.sidebarElement = sidebar;
    return sidebar;
  }
  createTabBar() {
    const tabBar = H`
            <div class="app-shell__tabs" role="tablist">
                <div class="app-shell__tabs-list" data-tabs-list>
                    <!-- Tabs render here -->
                </div>
                <div class="app-shell__tabs-actions">
                    <button class="app-shell__tabs-add" type="button" title="New tab" aria-label="New tab">
                        <ui-icon icon="plus" icon-style="bold"></ui-icon>
                    </button>
                </div>
            </div>
        `;
    affected(this.openTabs, () => {
      this.renderTabs(tabBar);
    });
    affected(this.activeTab, () => {
      this.renderTabs(tabBar);
    });
    this.tabBarElement = tabBar;
    return tabBar;
  }
  renderTabs(tabBar) {
    const tabsList = tabBar.querySelector("[data-tabs-list]");
    if (!tabsList) return;
    tabsList.replaceChildren();
    const homeTab = this.createTabElement("home", "Home", "house");
    tabsList.appendChild(homeTab);
    for (const [viewId, info] of this.openTabs) {
      if (viewId === "home") continue;
      const tab = this.createTabElement(viewId, info.name, info.icon);
      tabsList.appendChild(tab);
    }
  }
  createTabElement(viewId, name, icon) {
    const isActive = this.activeTab.value === viewId;
    const isCloseable = viewId !== "home";
    const tab = H`
            <div
                class="app-shell__tab ${isActive ? "active" : ""}"
                data-tab="${viewId}"
                role="tab"
                aria-selected="${isActive}"
            >
                <ui-icon icon="${icon}" icon-style="duotone"></ui-icon>
                <span class="app-shell__tab-label">${name}</span>
                ${isCloseable ? H`
                    <button
                        class="app-shell__tab-close"
                        type="button"
                        title="Close tab"
                        data-close="${viewId}"
                    >
                        <ui-icon icon="x" icon-style="bold" size="12"></ui-icon>
                    </button>
                ` : ""}
            </div>
        `;
    tab.addEventListener("click", (e) => {
      const target = e.target;
      const closeBtn = target.closest("[data-close]");
      if (closeBtn) {
        const closeId = closeBtn.dataset.close;
        this.closeTab(closeId);
      } else {
        this.navigate(viewId);
      }
    });
    return tab;
  }
  closeTab(viewId) {
    if (viewId === "home") return;
    this.openTabs.delete(viewId);
    if (this.activeTab.value === viewId) {
      const remaining = Array.from(this.openTabs.keys());
      const nextTab = remaining[remaining.length - 1] || "home";
      this.navigate(nextTab);
    }
    ViewRegistry.unload(viewId);
  }
  createHomeView() {
    const home = H`
            <div class="app-shell__home" data-view-id="home">
                <div class="app-shell__home-content">
                    <h1 class="app-shell__home-title">CrossWord</h1>
                    <p class="app-shell__home-subtitle">Select a view from the sidebar to get started</p>
                    <div class="app-shell__home-quick-actions">
                        <button class="app-shell__home-action" data-view="viewer" type="button">
                            <ui-icon icon="eye" icon-style="duotone" size="32"></ui-icon>
                            <span>Viewer</span>
                        </button>
                        <button class="app-shell__home-action" data-view="workcenter" type="button">
                            <ui-icon icon="lightning" icon-style="duotone" size="32"></ui-icon>
                            <span>Work Center</span>
                        </button>
                        <button class="app-shell__home-action" data-view="explorer" type="button">
                            <ui-icon icon="folder" icon-style="duotone" size="32"></ui-icon>
                            <span>Explorer</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    home.addEventListener("click", (e) => {
      const target = e.target;
      const button = target.closest("[data-view]");
      if (!button) return;
      const viewId = button.dataset.view;
      if (viewId) {
        this.navigate(viewId);
      }
    });
    return home;
  }
  getStylesheet() {
    return style;
  }
  async navigate(viewId, params) {
    console.log(`[Faint] Navigating to: ${viewId}`);
    this.activeTab.value = viewId;
    if (viewId !== "home" && !this.openTabs.has(viewId)) {
      const registration = ViewRegistry.get(viewId);
      this.openTabs.set(viewId, {
        name: registration?.name || viewId,
        icon: registration?.icon || "circle"
      });
    }
    await super.navigate(viewId, params);
  }
  async mount(container) {
    await super.mount(container);
    this.setupPopstateNavigation();
    const pathname = globalThis?.location?.pathname?.replace(/^\//, "").toLowerCase();
    if (pathname && pathname !== "home") {
      await this.navigate(pathname);
    } else {
      this.activeTab.value = "home";
    }
  }
}
function createShell(_container) {
  return new FaintShell();
}

export { FaintShell, createShell, createShell as default };
//# sourceMappingURL=index4.js.map
