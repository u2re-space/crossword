/**
 * Basic Shell
 *
 * Simple toolbar-based single-view shell.
 * Features:
 * - Top navigation toolbar with view buttons
 * - Status bar for messages
 * - Single content area for one active view
 * - NO split view, NO sidebar, NO tabs
 */

import { BaseShell } from "./base-shell";
import { H } from "fest/lure";
import { affected } from "fest/object";
import type { ShellId, ShellLayoutConfig, ViewId } from "../types";

// @ts-ignore - SCSS import
import style from "./basic.scss?inline";

// Side effect: register icon component
import "fest/icon";

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const MAIN_NAV_ITEMS: Array<{ id: ViewId; name: string; icon: string }> = [
    { id: "viewer", name: "Viewer", icon: "eye" },
    { id: "explorer", name: "Explorer", icon: "folder" },
    { id: "workcenter", name: "Work Center", icon: "lightning" },
    { id: "settings", name: "Settings", icon: "gear" },
    { id: "history", name: "History", icon: "clock-counter-clockwise" }
];

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

    protected createLayout(): HTMLElement {
        const root = H`
            <div class="shell-basic" data-shell="basic">
                <nav class="shell-basic__nav" role="navigation" aria-label="Main navigation">
                    <div class="shell-basic__nav-left" data-nav-left>
                        ${this.renderNavButtons()}
                    </div>
                    <div class="shell-basic__nav-right" data-shell-toolbar>
                        <!-- View-specific toolbar actions go here -->
                    </div>
                </nav>
                <main class="shell-basic__content" data-shell-content role="main">
                    <div class="shell-basic__loading">
                        <div class="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                </main>
                <div class="shell-basic__status" data-shell-status hidden aria-live="polite"></div>
            </div>
        ` as HTMLElement;

        this.setupNavClickHandlers(root);
        return root;
    }

    private renderNavButtons(): DocumentFragment {
        const fragment = document.createDocumentFragment();

        for (const item of MAIN_NAV_ITEMS) {
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

        // Handle nav button clicks
        navLeft.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-view]") as HTMLButtonElement | null;
            if (!button) return;

            const viewId = button.dataset.view as ViewId;
            if (viewId) {
                this.navigate(viewId);
            }
        });

        // Update active state reactively
        affected(this.currentView, (viewId) => {
            this.updateActiveNavButton(navLeft, viewId);
        });
    }

    private updateActiveNavButton(navContainer: Element, activeViewId: ViewId): void {
        const buttons = navContainer.querySelectorAll("[data-view]");
        buttons.forEach(btn => {
            const isActive = (btn as HTMLElement).dataset.view === activeViewId;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-current", isActive ? "page" : "false");
        });
    }

    protected getStylesheet(): string | null {
        return style;
    }

    async mount(container: HTMLElement): Promise<void> {
        await super.mount(container);

        // Setup path-based navigation
        this.setupPopstateNavigation();

        // Determine initial view from pathname or default to "viewer"
        const initialView = this.getInitialView();
        await this.navigate(initialView);
    }

    private getInitialView(): ViewId {
        if (typeof window === "undefined") return "viewer";

        // Get view from pathname (e.g., /viewer, /settings, /workcenter)
        const pathname = window.location.pathname.replace(/^\//, "").toLowerCase();

        if (pathname && MAIN_NAV_ITEMS.some(item => item.id === pathname)) {
            return pathname as ViewId;
        }

        // Default to viewer
        return "viewer";
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createShell(_container: HTMLElement): BasicShell {
    return new BasicShell();
}

export default createShell;
