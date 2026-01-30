/**
 * Airpad View
 * 
 * Shell-agnostic air trackpad + AI assistant component.
 * Wraps the existing airpad functionality as a view.
 */

import { H } from "fest/lure";
import { loadAsAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";

// @ts-ignore
import style from "./airpad.scss?inline";

// ============================================================================
// AIRPAD VIEW
// ============================================================================

export class AirpadView implements View {
    id = "airpad" as const;
    name = "Airpad";
    icon = "hand-pointing";

    private options: BaseViewOptions;
    private shellContext?: ShellContext;
    private element: HTMLElement | null = null;
    private initialized = false;
    
    lifecycle: ViewLifecycle = {
        onMount: () => this.initAirpad(),
        onUnmount: () => this.cleanup()
    };

    constructor(options: BaseViewOptions = {}) {
        this.options = options;
        this.shellContext = options.shellContext;
    }

    render(options?: ViewOptions): HTMLElement {
        if (options) {
            this.options = { ...this.options, ...options };
            this.shellContext = options.shellContext || this.shellContext;
        }

        loadAsAdopted(style);

        this.element = H`
            <div class="view-airpad">
                <div class="view-airpad__content" data-airpad-content>
                    <div class="view-airpad__loading">
                        <div class="view-airpad__spinner"></div>
                        <span>Loading Airpad...</span>
                    </div>
                </div>
            </div>
        ` as HTMLElement;

        // Initialize airpad asynchronously
        this.initAirpad();

        return this.element;
    }

    getToolbar(): HTMLElement | null {
        return null;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async initAirpad(): Promise<void> {
        if (this.initialized) return;

        const content = this.element?.querySelector("[data-airpad-content]");
        if (!content) return;

        try {
            // Dynamic import of airpad main
            const { default: mountAirpad } = await import("../../airpad/main");
            
            // Clear loading state
            content.innerHTML = "";
            
            // Mount airpad
            await mountAirpad(content as HTMLElement);
            
            this.initialized = true;
        } catch (error) {
            console.error("[Airpad] Failed to initialize:", error);
            content.innerHTML = `
                <div class="view-airpad__error">
                    <p>Failed to load Airpad</p>
                    <p class="view-airpad__error-detail">${String(error)}</p>
                    <button type="button" data-action="retry">Try Again</button>
                </div>
            `;
            content.querySelector("[data-action=retry]")?.addEventListener("click", () => {
                this.initialized = false;
                this.initAirpad();
            });
        }
    }

    private cleanup(): void {
        // Cleanup any airpad resources if needed
        this.initialized = false;
    }

    canHandleMessage(): boolean {
        return false;
    }

    async handleMessage(): Promise<void> {}
}

// ============================================================================
// FACTORY
// ============================================================================

export function createView(options?: BaseViewOptions): AirpadView {
    return new AirpadView(options);
}

export default createView;
