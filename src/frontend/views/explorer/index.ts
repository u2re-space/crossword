/**
 * Explorer View
 * 
 * Shell-agnostic file explorer component.
 * Uses the ui-file-manager web component.
 */

import { H } from "fest/lure";
import { loadAsAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";
import { getString, setString } from "../../shared/storage";

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
    private fileManager: HTMLElement | null = null;
    
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

        // Dynamically import the file manager component
        this.loadFileManager();

        this.element = H`
            <div class="view-explorer">
                <div class="view-explorer__content" data-explorer-content>
                    <div class="view-explorer__loading">
                        <div class="view-explorer__spinner"></div>
                        <span>Loading Explorer...</span>
                    </div>
                </div>
            </div>
        ` as HTMLElement;

        return this.element;
    }

    getToolbar(): HTMLElement | null {
        return null;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async loadFileManager(): Promise<void> {
        try {
            // Dynamic import of file explorer component
            await import("../../basic/explorer");
            
            // Create file manager element
            this.fileManager = document.createElement("ui-file-manager") as HTMLElement;
            
            // Set initial path
            const lastPath = getString("rs-explorer-path", "/");
            (this.fileManager as any).path = lastPath;
            
            // Setup event listeners
            this.setupFileManagerEvents();
            
            // Replace loading with file manager
            const content = this.element?.querySelector("[data-explorer-content]");
            if (content) {
                content.replaceChildren(this.fileManager);
            }
        } catch (error) {
            console.error("[Explorer] Failed to load file manager:", error);
            const content = this.element?.querySelector("[data-explorer-content]");
            if (content) {
                content.innerHTML = `
                    <div class="view-explorer__error">
                        <p>Failed to load File Explorer</p>
                        <button type="button" data-action="retry">Try Again</button>
                    </div>
                `;
                content.querySelector("[data-action=retry]")?.addEventListener("click", () => {
                    this.loadFileManager();
                });
            }
        }
    }

    private setupFileManagerEvents(): void {
        if (!this.fileManager) return;

        // Handle file open
        this.fileManager.addEventListener("open", async (e: Event) => {
            const detail = (e as CustomEvent).detail;
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
        this.fileManager.addEventListener("navigate", () => {
            this.saveCurrentPath();
        });
    }

    private loadLastPath(): void {
        if (this.fileManager) {
            const lastPath = getString("rs-explorer-path", "/");
            (this.fileManager as any).path = lastPath;
        }
    }

    private saveCurrentPath(): void {
        if (this.fileManager) {
            const currentPath = (this.fileManager as any).path || "/";
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
        if (msg.data?.path && this.fileManager) {
            (this.fileManager as any).path = msg.data.path;
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
