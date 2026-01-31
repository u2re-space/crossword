/**
 * Explorer View
 * 
 * Shell-agnostic file explorer component.
 * Uses the <rs-explorer> web component for encapsulated rendering.
 */

import { H } from "fest/lure";
import { loadAsAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";
import { getString, setString } from "../../../core/storage";

// Import the rs-explorer web component
import "../../components/rs-explorer";
import type { RsExplorerElement, FileItem } from "../../components/rs-explorer";

// @ts-ignore
import style from "./explorer.scss?inline";

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
    private explorer: RsExplorerElement | null = null;
    
    lifecycle: ViewLifecycle = {
        onMount: () => this.loadLastPath(),
        onUnmount: () => this.saveCurrentPath()
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

        // Create element with rs-explorer web component
        this.element = H`
            <div class="view-explorer">
                <div class="view-explorer__content" data-explorer-content>
                    <rs-explorer view-mode="list"></rs-explorer>
                </div>
            </div>
        ` as HTMLElement;

        // Get reference to rs-explorer component
        this.explorer = this.element.querySelector("rs-explorer") as RsExplorerElement;
        
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

        // Handle file open
        this.explorer.addEventListener("rs-open", async (e: Event) => {
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
        this.explorer.addEventListener("rs-navigate", () => {
            this.saveCurrentPath();
        });
    }

    private loadLastPath(): void {
        if (this.explorer) {
            const lastPath = getString("rs-explorer-path", "/");
            this.explorer.path = lastPath;
        }
    }

    private saveCurrentPath(): void {
        if (this.explorer) {
            const currentPath = this.explorer.path || "/";
            setString("rs-explorer-path", currentPath);
        }
    }

    private showMessage(message: string): void {
        this.shellContext?.showMessage(message);
    }

    canHandleMessage(messageType: string): boolean {
        return ["file-save", "navigate-path"].includes(messageType);
    }

    async handleMessage(message: unknown): Promise<void> {
        const msg = message as { data?: { path?: string } };
        if (msg.data?.path && this.explorer) {
            this.explorer.navigate(msg.data.path);
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createView(options?: BaseViewOptions): ExplorerView {
    return new ExplorerView(options);
}

export default createView;
