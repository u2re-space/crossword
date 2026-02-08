/**
 * Raw Shell
 *
 * Minimal shell with no frames, navigation UI, or chrome.
 * Just a content container with theme support.
 *
 * Use cases:
 * - Fullscreen views
 * - Print layouts
 * - Embedded views
 * - Single-component rendering
 */

import { BaseShell } from "../basic/ts/base-shell";
import { H } from "fest/lure";
import type { ShellId, ShellLayoutConfig } from "../types";

// @ts-ignore - SCSS import
import style from "./raw.scss?inline";

// ============================================================================
// RAW SHELL IMPLEMENTATION
// ============================================================================

export class RawShell extends BaseShell {
    id: ShellId = "raw";
    name = "Raw";

    layout: ShellLayoutConfig = {
        hasSidebar: false,
        hasToolbar: false,
        hasTabs: false,
        supportsMultiView: false,
        supportsWindowing: false
    };

    protected createLayout(): HTMLElement {
        const root = H`
            <div class="app-shell" data-shell="raw">
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

        // Raw shell uses simplified navigation
        this.setupHashNavigation();
        this.setupPopstateNavigation();
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a raw shell instance
 */
export function createShell(_container: HTMLElement): RawShell {
    return new RawShell();
}

export default createShell;
