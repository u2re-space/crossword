/**
 * Basic Shell
 * 
 * Classic toolbar-based navigation shell.
 * Features:
 * - Top navigation toolbar with view buttons
 * - Status bar for messages
 * - Content area for views
 * - Simple, clean layout
 */

import { BaseShell } from "../base-shell";
import { H, M } from "fest/lure";
import { ref, observe, subscribe } from "fest/object";
import { ViewRegistry } from "../registry";
import type { ShellId, ShellLayoutConfig, ViewId } from "../types";

// @ts-ignore - SCSS import
import style from "./basic.scss?inline";

// Side effect: register icon component
import "fest/icon";

// ============================================================================
// BASIC SHELL IMPLEMENTATION
// ============================================================================

export class BasicShell extends BaseShell {
    id: ShellId = "basic";
    name = "Basic";
    
    layout: ShellLayoutConfig = {
        hasSidebar: false,
        hasToolbar: true,
        hasTabs: false,
        supportsMultiView: false,
        supportsWindowing: false
    };

    // Navigation items
    private navItems = ref<Array<{ id: ViewId; name: string; icon: string }>>([]);

    protected createLayout(): HTMLElement {
        // Build navigation items from registry
        const views = ViewRegistry.getAll();
        this.navItems.value = views
            .filter(v => v.id !== "home") // Home is default, not in nav
            .map(v => ({
                id: v.id,
                name: v.name,
                icon: v.icon || "circle"
            }));

        const root = H`
            <div class="shell-basic" data-shell="basic">
                <nav class="shell-basic__nav" role="navigation" aria-label="Main navigation">
                    <div class="shell-basic__nav-left" data-nav-left>
                        ${this.renderNavItems()}
                    </div>
                    <div class="shell-basic__nav-right" data-shell-toolbar>
                        <!-- View-specific toolbar actions go here -->
                    </div>
                </nav>
                <main class="shell-basic__content" data-shell-content role="main">
                    <!-- Views render here -->
                </main>
                <div class="shell-basic__status" data-shell-status hidden aria-live="polite"></div>
            </div>
        ` as HTMLElement;

        // Setup navigation click handlers
        this.setupNavClickHandlers(root);

        return root;
    }

    private renderNavItems(): HTMLElement {
        const fragment = document.createDocumentFragment() as unknown as HTMLElement;
        
        const mainViews: Array<{ id: ViewId; name: string; icon: string }> = [
            { id: "viewer", name: "Viewer", icon: "eye" },
            { id: "explorer", name: "Explorer", icon: "folder" },
            { id: "workcenter", name: "Work Center", icon: "lightning" },
            { id: "settings", name: "Settings", icon: "gear" },
            { id: "history", name: "History", icon: "clock-counter-clockwise" }
        ];

        for (const item of mainViews) {
            const button = H`
                <button 
                    class="shell-basic__nav-btn" 
                    data-view="${item.id}"
                    type="button"
                    title="${item.name}"
                >
                    <ui-icon icon="${item.icon}" icon-style="duotone"></ui-icon>
                    <span class="shell-basic__nav-label">${item.name}</span>
                </button>
            ` as HTMLButtonElement;
            
            fragment.appendChild(button);
        }

        return fragment;
    }

    private setupNavClickHandlers(root: HTMLElement): void {
        const navLeft = root.querySelector("[data-nav-left]");
        if (!navLeft) return;

        navLeft.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-view]") as HTMLButtonElement | null;
            if (!button) return;

            const viewId = button.dataset.view as ViewId;
            if (viewId) {
                this.navigate(viewId);
            }
        });

        // Update active state on navigation
        subscribe(this.currentView, (viewId) => {
            const buttons = navLeft.querySelectorAll("[data-view]");
            for (const btn of buttons) {
                const isActive = (btn as HTMLElement).dataset.view === viewId;
                btn.classList.toggle("active", isActive);
            }
        });
    }

    protected getStylesheet(): string | null {
        return style;
    }

    async mount(container: HTMLElement): Promise<void> {
        await super.mount(container);
        
        // Setup navigation
        this.setupHashNavigation();
        this.setupPopstateNavigation();

        // Navigate to default view if none set
        if (!window.location.hash || window.location.hash === "#") {
            await this.navigate("viewer");
        } else {
            const hash = window.location.hash.replace(/^#/, "");
            await this.navigate(hash as ViewId);
        }
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a basic shell instance
 */
export function createShell(_container: HTMLElement): BasicShell {
    return new BasicShell();
}

export default createShell;
