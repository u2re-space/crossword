/**
 * Explorer View
 *
 * Shell-agnostic file explorer component.
 * Uses the <view-explorer> web component for encapsulated rendering.
 */

import { H } from "fest/lure";
import { loadAsAdopted, removeAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";
import { getString, setString } from "../../../core/storage";

// Import the view-explorer web component from fl.ui
import { FileManager, type FileItem } from "fest/fl-ui";

// Re-export FileManager for backwards compatibility
export { FileManager, FileManagerContent } from "fest/fl-ui";

// @ts-ignore
import style from "./index.scss?inline";

// ============================================================================
// EXPLORER VIEW
// ============================================================================

export class ExplorerView implements View {
    id = "explorer" as const;
    name = "Explorer";
    icon = "folder";

    private options: BaseViewOptions;
    private shellContext?: ShellContext;
    private element: HTMLElement | null = null;
    private explorer: FileManager | null = null;

    private _sheet: CSSStyleSheet | null = null;

    lifecycle: ViewLifecycle = {
        onMount: () => { this.loadLastPath(); this._sheet ??= loadAsAdopted(style) as CSSStyleSheet; },
        onUnmount: () => { removeAdopted(this._sheet); this.saveCurrentPath(); },
        onShow: () => { this._sheet ??= loadAsAdopted(style) as CSSStyleSheet; },
        onHide: () => { this.saveCurrentPath(); },
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

        this._sheet = loadAsAdopted(style) as CSSStyleSheet;

        // Create element with view-explorer web component
        this.element = H`
            <div class="view-explorer">
                <div class="view-explorer__content" data-explorer-content>
                    <ui-file-manager view-mode="list"></ui-file-manager>
                </div>
            </div>
        ` as HTMLElement;

        // Get reference to view-explorer component
        this.explorer = this.element.querySelector("ui-file-manager") as unknown as FileManager;

        // Setup event listeners
        this.setupExplorerEvents();

        return this.element;
    }

    getToolbar(): HTMLElement | null {
        return null;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private setupExplorerEvents(): void {
        if (!this.explorer) return;
        const explorer = this.explorer as unknown as FileManager & HTMLElement;

        // Handle file open
        explorer.addEventListener("rs-open", async (e: Event) => {
            const detail = (e as CustomEvent<{ item: FileItem }>).detail;
            const item = detail?.item;

            if (item?.kind === "file" && item?.file) {
                const file = item.file as File;
                const isMarkdown = file.name.toLowerCase().endsWith(".md") ||
                                   file.type === "text/markdown";

                if (isMarkdown) {
                    try {
                        const content = await file.text();
                        this.shellContext?.navigate("viewer", { content });
                    } catch (error) {
                        console.error("[Explorer] Failed to read file:", error);
                        this.showMessage("Failed to open file");
                    }
                } else {
                    // Send to work center
                    this.shellContext?.navigate("workcenter");
                }
            }
        });

        // Handle path changes
        explorer.addEventListener("rs-navigate", () => {
            this.saveCurrentPath();
        });
    }

    private loadLastPath(): void {
        if (this.explorer) {
            const lastPath = getString("view-explorer-path", "/");
            this.explorer.path = lastPath;
        }
    }

    private saveCurrentPath(): void {
        if (this.explorer) {
            const currentPath = this.explorer.path || "/";
            setString("view-explorer-path", currentPath);
        }
    }

    private showMessage(message: string): void {
        this.shellContext?.showMessage(message);
    }

    canHandleMessage(messageType: string): boolean {
        return ["file-save", "navigate-path", "content-explorer"].includes(messageType);
    }

    async handleMessage(message: unknown): Promise<void> {
        const msg = message as { data?: { path?: string; into?: string } };
        const targetPath = msg.data?.path || msg.data?.into;
        if (targetPath && this.explorer) {
            this.explorer.navigate(targetPath);
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createView(options?: ExplorerOptions): ExplorerView {
    return new ExplorerView(options);
}

/** Alias for createView */
export const createExplorerView = createView;

export default createView;
