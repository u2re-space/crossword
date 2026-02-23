/**
 * Base Shell
 *
 * Base shell with no frames, navigation UI, or chrome.
 * Just a content container with theme support.
 *
 * Use cases:
 * - Fullscreen views
 * - Print layouts
 * - Embedded views
 * - Single-component rendering
 */

import { H } from "fest/lure";
import type { ShellId, ShellLayoutConfig } from "../types";

// @ts-ignore - SCSS import
import style from "./base.scss?inline";
import { ShellBase } from "../shell";

// ============================================================================
// BASE SHELL IMPLEMENTATION
// ============================================================================

export class BaseShell extends ShellBase {
    id: ShellId = "base";
    name = "Base";

    layout: ShellLayoutConfig = {
        hasSidebar: false,
        hasToolbar: false,
        hasTabs: false,
        supportsMultiView: false,
        supportsWindowing: false
    };

    protected createLayout(): HTMLElement {
        const root = H`
            <div class="app-shell" data-shell="base">
                <div class="app-shell__status" data-shell-status hidden aria-live="polite"></div>
                <div class="app-shell__content" data-shell-content></div>
            </div>
        ` as HTMLElement;

        return root;
    }

    protected getStylesheet(): string | null {
        return style;
    }

    async mount(container: HTMLElement): Promise<void> {
        await super.mount(container);

        // Base shell uses simplified navigation
        this.setupHashNavigation();
        this.setupPopstateNavigation();
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a base shell instance
 */
export function createShell(_container: HTMLElement): BaseShell {
    return new BaseShell();
}

export default createShell;
