/**
 * Markdown Viewer View
 * 
 * Shell-agnostic markdown viewer component.
 * Can be used in any shell to display markdown content.
 * Uses the <md-view> web component for encapsulated rendering.
 */

import { H } from "fest/lure";
import { ref, subscribe } from "fest/object";
import { loadAsAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions, MarkdownContent } from "../types";
import { createViewState, createLoadingElement, createErrorElement } from "../types";

// Import the md-view web component
import "../../components/md-view";
import type { MdViewElement } from "../../components/md-view";

// @ts-ignore - SCSS import
import style from "./viewer.scss?inline";

// ============================================================================
// VIEWER STATE
// ============================================================================

interface ViewerState {
    content: string;
    filename?: string;
    scrollPosition?: number;
}

const STORAGE_KEY = "rs-viewer-state";
const DEFAULT_CONTENT = "# CrossWord Viewer\n\nOpen a markdown file or paste content here.";

// ============================================================================
// VIEWER OPTIONS
// ============================================================================

export interface ViewerOptions extends BaseViewOptions {
    /** Initial markdown content */
    initialContent?: string;
    /** Filename for display */
    filename?: string;
    /** Enable editing mode */
    editable?: boolean;
    /** Callback when content changes */
    onContentChange?: (content: string) => void;
    /** Callback when copy action is triggered */
    onCopy?: (content: string) => void;
    /** Callback when download action is triggered */
    onDownload?: (content: string, filename?: string) => void;
    /** Callback to attach content to work center */
    onAttachToWorkCenter?: (content: string) => void;
    /** Callback to print content */
    onPrint?: (content: string) => void;
}

// ============================================================================
// VIEWER VIEW IMPLEMENTATION
// ============================================================================

export class ViewerView implements View {
    id = "viewer" as const;
    name = "Viewer";
    icon = "eye";

    private options: ViewerOptions;
    private shellContext?: ShellContext;
    private element: HTMLElement | null = null;
    private mdView: MdViewElement | null = null;
    private contentRef = ref("");
    private renderedContentRef = ref<HTMLElement | null>(null);
    private stateManager = createViewState<ViewerState>(STORAGE_KEY);
    
    lifecycle: ViewLifecycle = {
        onMount: () => this.onMount(),
        onUnmount: () => this.onUnmount(),
        onShow: () => this.onShow(),
        onHide: () => this.onHide(),
        onRefresh: () => this.onRefresh()
    };

    constructor(options: ViewerOptions = {}) {
        this.options = options;
        this.shellContext = options.shellContext;
        
        // Load initial content
        const savedState = this.stateManager.load();
        this.contentRef.value = options.initialContent || savedState?.content || DEFAULT_CONTENT;
    }

    render(options?: ViewOptions): HTMLElement {
        // Merge options
        if (options) {
            this.options = { ...this.options, ...options };
            this.shellContext = options.shellContext || this.shellContext;
        }

        // Load styles
        loadAsAdopted(style);

        // Create main element with md-view web component
        this.element = H`
            <div class="view-viewer">
                <div class="view-viewer__toolbar" data-viewer-toolbar>
                    <div class="view-viewer__toolbar-left">
                        <button class="view-viewer__btn" data-action="open" type="button" title="Open file">
                            <ui-icon icon="folder-open" icon-style="duotone"></ui-icon>
                            <span>Open</span>
                        </button>
                    </div>
                    <div class="view-viewer__toolbar-right">
                        <button class="view-viewer__btn" data-action="copy" type="button" title="Copy to clipboard">
                            <ui-icon icon="copy" icon-style="duotone"></ui-icon>
                            <span>Copy</span>
                        </button>
                        <button class="view-viewer__btn" data-action="download" type="button" title="Download as file">
                            <ui-icon icon="download" icon-style="duotone"></ui-icon>
                            <span>Download</span>
                        </button>
                        <button class="view-viewer__btn" data-action="attach" type="button" title="Attach to Work Center">
                            <ui-icon icon="lightning" icon-style="duotone"></ui-icon>
                            <span>Attach</span>
                        </button>
                        <button class="view-viewer__btn" data-action="print" type="button" title="Print">
                            <ui-icon icon="printer" icon-style="duotone"></ui-icon>
                            <span>Print</span>
                        </button>
                    </div>
                </div>
                <div class="view-viewer__content" data-viewer-content>
                    <md-view theme="auto"></md-view>
                </div>
            </div>
        ` as HTMLElement;

        // Get reference to md-view component
        this.mdView = this.element.querySelector("md-view") as MdViewElement;

        // Setup event handlers
        this.setupEventHandlers();

        // Set initial content on md-view component
        if (this.mdView) {
            this.mdView.setContent(this.contentRef.value);
            
            // Listen for md-view events
            this.mdView.addEventListener("md-link-click", (e) => {
                // Allow default link behavior, or handle custom navigation
            });
        }

        // Setup reactive updates
        subscribe(this.contentRef, () => {
            if (this.mdView) {
                this.mdView.setContent(this.contentRef.value);
            }
            this.saveState();
        });

        return this.element;
    }

    getToolbar(): HTMLElement | null {
        // The viewer has its own embedded toolbar
        // Return null to not use shell's toolbar slot
        return null;
    }

    /**
     * Update the displayed content
     */
    setContent(content: string, filename?: string): void {
        this.contentRef.value = content;
        if (filename) {
            this.options.filename = filename;
        }
    }

    /**
     * Get current content
     */
    getContent(): string {
        return this.contentRef.value;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private setupEventHandlers(): void {
        if (!this.element) return;

        const toolbar = this.element.querySelector("[data-viewer-toolbar]");
        toolbar?.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-action]") as HTMLButtonElement | null;
            if (!button) return;

            const action = button.dataset.action;
            switch (action) {
                case "open":
                    this.handleOpen();
                    break;
                case "copy":
                    this.handleCopy();
                    break;
                case "download":
                    this.handleDownload();
                    break;
                case "attach":
                    this.handleAttach();
                    break;
                case "print":
                    this.handlePrint();
                    break;
            }
        });

        // Setup drag and drop
        const content = this.element.querySelector("[data-viewer-content]");
        if (content) {
            content.addEventListener("dragover", (e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.add("dragover");
            });
            
            content.addEventListener("dragleave", () => {
                (content as HTMLElement).classList.remove("dragover");
            });
            
            content.addEventListener("drop", (e) => {
                e.preventDefault();
                (content as HTMLElement).classList.remove("dragover");
                this.handleFileDrop(e as DragEvent);
            });
        }

        // Setup paste handling
        this.element.addEventListener("paste", (e) => {
            this.handlePaste(e as ClipboardEvent);
        });
    }

    private async renderMarkdown(): Promise<void> {
        // Markdown rendering is now handled by the md-view web component
        if (this.mdView) {
            await this.mdView.refresh();
        }
    }

    private handleOpen(): void {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                try {
                    const content = await file.text();
                    this.setContent(content, file.name);
                    this.showMessage(`Opened ${file.name}`);
                } catch (error) {
                    console.error("[Viewer] Failed to read file:", error);
                    this.showMessage("Failed to read file");
                }
            }
        };
        input.click();
    }

    private async handleCopy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.contentRef.value);
            this.showMessage("Copied to clipboard");
            this.options.onCopy?.(this.contentRef.value);
        } catch (error) {
            console.error("[Viewer] Failed to copy:", error);
            this.showMessage("Failed to copy to clipboard");
        }
    }

    private handleDownload(): void {
        const content = this.contentRef.value;
        const filename = this.options.filename || `document-${Date.now()}.md`;
        
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 250);
        
        this.showMessage(`Downloaded ${filename}`);
        this.options.onDownload?.(content, filename);
    }

    private handleAttach(): void {
        this.options.onAttachToWorkCenter?.(this.contentRef.value);
        this.shellContext?.navigate("workcenter");
        this.showMessage("Content attached to Work Center");
    }

    private handlePrint(): void {
        this.options.onPrint?.(this.contentRef.value);
        if (this.mdView) {
            this.mdView.print();
        } else {
            window.print();
        }
    }

    private handleFileDrop(e: DragEvent): void {
        const file = e.dataTransfer?.files?.[0];
        if (file && (file.type.includes("text") || file.name.endsWith(".md"))) {
            file.text().then(content => {
                this.setContent(content, file.name);
                this.showMessage(`Loaded ${file.name}`);
            }).catch(() => {
                this.showMessage("Failed to read dropped file");
            });
        }
    }

    private handlePaste(e: ClipboardEvent): void {
        const text = e.clipboardData?.getData("text/plain");
        if (text && text.trim()) {
            // Only handle paste if not in an input element
            const target = e.target as HTMLElement;
            if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                this.setContent(text);
                this.showMessage("Content pasted");
            }
        }
    }

    private saveState(): void {
        this.stateManager.save({
            content: this.contentRef.value,
            filename: this.options.filename
        });
    }

    private showMessage(message: string): void {
        if (this.shellContext) {
            this.shellContext.showMessage(message);
        } else {
            console.log(`[Viewer] ${message}`);
        }
    }

    // ========================================================================
    // LIFECYCLE METHODS
    // ========================================================================

    private onMount(): void {
        console.log("[Viewer] Mounted");
    }

    private onUnmount(): void {
        console.log("[Viewer] Unmounting");
        this.saveState();
        this.element = null;
    }

    private onShow(): void {
        console.log("[Viewer] Shown");
    }

    private onHide(): void {
        console.log("[Viewer] Hidden");
        this.saveState();
    }

    private onRefresh(): void {
        this.renderMarkdown();
    }

    // ========================================================================
    // MESSAGE HANDLING
    // ========================================================================

    canHandleMessage(messageType: string): boolean {
        return ["content-view", "content-load", "markdown-content"].includes(messageType);
    }

    async handleMessage(message: unknown): Promise<void> {
        const msg = message as { type?: string; data?: { text?: string; content?: string; filename?: string } };
        
        if (msg.data?.text || msg.data?.content) {
            const content = msg.data.text || msg.data.content || "";
            this.setContent(content, msg.data.filename);
        }
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a viewer view instance
 */
export function createView(options?: ViewerOptions): ViewerView {
    return new ViewerView(options);
}

export default createView;
