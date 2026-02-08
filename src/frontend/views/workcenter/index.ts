/**
 * Work Center View
 *
 * Shell-agnostic AI work center component.
 * Provides file attachment, AI processing, and result management.
 */

import { H } from "fest/lure";
import { ref, observe, affected } from "fest/object";
import { loadAsAdopted, removeAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";
import { createViewState, createLoadingElement } from "../types";

// @ts-ignore - SCSS import
import workcenterStyles from "./scss/_index.scss?inline";

// ============================================================================
// WORKCENTER STATE
// ============================================================================

interface WorkCenterState {
    files: File[];
    prompt: string;
    results: Array<{ id: string; content: string; timestamp: number; ok: boolean }>;
    processing: boolean;
}

const STORAGE_KEY = "rs-workcenter-state";

// ============================================================================
// WORKCENTER OPTIONS
// ============================================================================

export interface WorkCenterOptions extends BaseViewOptions {
    /** Initial files to attach */
    initialFiles?: File[];
    /** Initial prompt */
    initialPrompt?: string;
    /** Callback when processing completes */
    onProcessComplete?: (result: string) => void;
    /** Callback when files change */
    onFilesChange?: (files: File[]) => void;
}

// ============================================================================
// WORKCENTER VIEW IMPLEMENTATION
// ============================================================================

export class WorkCenterView implements View {
    id = "workcenter" as const;
    name = "Work Center";
    icon = "lightning";

    private options: WorkCenterOptions;
    private shellContext?: ShellContext;
    private element: HTMLElement | null = null;

    private files = observe<File[]>([]);
    private prompt = ref("");
    private results = observe<Array<{ id: string; content: string; timestamp: number; ok: boolean }>>([]);
    private processing = ref(false);

    private stateManager = createViewState<Partial<WorkCenterState>>(STORAGE_KEY);
    private _sheet: CSSStyleSheet | null = null;

    lifecycle: ViewLifecycle = {
        onMount: () => this.onMount(),
        onUnmount: () => this.onUnmount(),
        onShow: () => this.onShow(),
        onHide: () => this.onHide()
    };

    constructor(options: WorkCenterOptions = {}) {
        this.options = options;
        this.shellContext = options.shellContext;

        // Load initial state
        if (options.initialFiles) {
            this.files.push(...options.initialFiles);
        }
        if (options.initialPrompt) {
            this.prompt.value = options.initialPrompt;
        }
    }

    render(options?: ViewOptions): HTMLElement {
        if (options) {
            this.options = { ...this.options, ...options };
            this.shellContext = options.shellContext || this.shellContext;
        }

        this._sheet = loadAsAdopted(workcenterStyles) as CSSStyleSheet;

        this.element = H`
            <div class="view-workcenter">
                <div class="view-workcenter__main">
                    <div class="view-workcenter__input-area">
                        <div class="view-workcenter__files" data-files-zone>
                            <div class="view-workcenter__files-header">
                                <h3>Attachments</h3>
                                <span class="view-workcenter__file-count" data-file-count>0 files</span>
                            </div>
                            <div class="view-workcenter__files-list" data-files-list>
                                <div class="view-workcenter__files-empty">
                                    <ui-icon icon="paperclip" icon-style="duotone" size="32"></ui-icon>
                                    <p>Drop files here or click to attach</p>
                                </div>
                            </div>
                            <div class="view-workcenter__files-actions">
                                <button class="view-workcenter__btn" data-action="add-files" type="button">
                                    <ui-icon icon="plus" icon-style="bold"></ui-icon>
                                    <span>Add Files</span>
                                </button>
                                <button class="view-workcenter__btn" data-action="clear-files" type="button">
                                    <ui-icon icon="trash" icon-style="duotone"></ui-icon>
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>
                        <div class="view-workcenter__prompt">
                            <textarea
                                class="view-workcenter__prompt-input"
                                placeholder="Enter your prompt or instructions..."
                                data-prompt-input
                            ></textarea>
                            <button
                                class="view-workcenter__process-btn"
                                data-action="process"
                                type="button"
                            >
                                <ui-icon icon="brain" icon-style="duotone"></ui-icon>
                                <span>Process</span>
                            </button>
                        </div>
                    </div>
                    <div class="view-workcenter__results" data-results>
                        <div class="view-workcenter__results-header">
                            <h3>Results</h3>
                        </div>
                        <div class="view-workcenter__results-list" data-results-list>
                            <div class="view-workcenter__results-empty">
                                <p>Results will appear here</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ` as HTMLElement;

        this.setupEventHandlers();
        this.setupDragDrop();
        this.updateFilesList();
        this.updateResultsList();

        // Reactive updates
        affected(this.files as any, () => {
            this.updateFilesList();
            this.options.onFilesChange?.(this.files);
        });

        affected(this.results as any, () => {
            this.updateResultsList();
        });

        return this.element;
    }

    getToolbar(): HTMLElement | null {
        return null; // Uses embedded toolbar
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Add files to the work center
     */
    addFiles(files: File[]): void {
        this.files.push(...files);
    }

    /**
     * Set the prompt
     */
    setPrompt(prompt: string): void {
        this.prompt.value = prompt;
        const input = this.element?.querySelector("[data-prompt-input]") as HTMLTextAreaElement;
        if (input) input.value = prompt;
    }

    /**
     * Get current files
     */
    getFiles(): File[] {
        return [...this.files];
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private setupEventHandlers(): void {
        if (!this.element) return;

        this.element.addEventListener("click", async (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-action]") as HTMLButtonElement | null;
            if (!button) return;

            const action = button.dataset.action;
            switch (action) {
                case "add-files":
                    this.handleAddFiles();
                    break;
                case "clear-files":
                    this.handleClearFiles();
                    break;
                case "process":
                    await this.handleProcess();
                    break;
            }
        });

        const promptInput = this.element.querySelector("[data-prompt-input]") as HTMLTextAreaElement;
        if (promptInput) {
            promptInput.addEventListener("input", () => {
                this.prompt.value = promptInput.value;
            });
        }
    }

    private setupDragDrop(): void {
        const filesZone = this.element?.querySelector("[data-files-zone]");
        if (!filesZone) return;

        filesZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            filesZone.classList.add("dragover");
        });

        filesZone.addEventListener("dragleave", () => {
            filesZone.classList.remove("dragover");
        });

        filesZone.addEventListener("drop", (e) => {
            e.preventDefault();
            filesZone.classList.remove("dragover");

            const files = Array.from((e as DragEvent).dataTransfer?.files || []);
            if (files.length > 0) {
                this.addFiles(files);
                this.showMessage(`Added ${files.length} file(s)`);
            }
        });
    }

    private handleAddFiles(): void {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = () => {
            const files = Array.from(input.files || []);
            if (files.length > 0) {
                this.addFiles(files);
                this.showMessage(`Added ${files.length} file(s)`);
            }
        };
        input.click();
    }

    private handleClearFiles(): void {
        this.files.length = 0;
        this.showMessage("Files cleared");
    }

    private async handleProcess(): Promise<void> {
        if (this.processing.value) return;
        if (this.files.length === 0 && !this.prompt.value.trim()) {
            this.showMessage("Add files or enter a prompt");
            return;
        }

        this.processing.value = true;
        this.showMessage("Processing...");

        try {
            // Dynamic import of AI processing
            const { recognizeByInstructions } = await import("@rs-com/service/AI-ops/RecognizeData2");

            // Build input from files and prompt
            const input = [
                {
                    role: "user",
                    content: this.prompt.value || "Process the attached files"
                }
            ];

            const result = await recognizeByInstructions(input, "Process the content and provide a structured response.");

            const resultEntry = {
                id: crypto.randomUUID(),
                content: result?.data ? String(result.data) : "No result",
                timestamp: Date.now(),
                ok: Boolean(result?.ok)
            };

            this.results.push(resultEntry);
            this.options.onProcessComplete?.(resultEntry.content);
            this.showMessage("Processing complete");

        } catch (error) {
            console.error("[WorkCenter] Processing failed:", error);
            this.results.push({
                id: crypto.randomUUID(),
                content: `Error: ${String(error)}`,
                timestamp: Date.now(),
                ok: false
            });
            this.showMessage("Processing failed");
        } finally {
            this.processing.value = false;
        }
    }

    private updateFilesList(): void {
        const list = this.element?.querySelector("[data-files-list]");
        const count = this.element?.querySelector("[data-file-count]");
        if (!list) return;

        if (count) {
            count.textContent = `${this.files.length} file(s)`;
        }

        if (this.files.length === 0) {
            list.innerHTML = `
                <div class="view-workcenter__files-empty">
                    <ui-icon icon="paperclip" icon-style="duotone" size="32"></ui-icon>
                    <p>Drop files here or click to attach</p>
                </div>
            `;
            return;
        }

        list.innerHTML = "";
        for (const file of this.files) {
            const item = H`
                <div class="view-workcenter__file-item">
                    <ui-icon icon="file" icon-style="duotone"></ui-icon>
                    <span class="view-workcenter__file-name">${file.name}</span>
                    <span class="view-workcenter__file-size">${this.formatSize(file.size)}</span>
                    <button class="view-workcenter__file-remove" data-remove="${file.name}" type="button">
                        <ui-icon icon="x" icon-style="bold" size="12"></ui-icon>
                    </button>
                </div>
            ` as HTMLElement;

            item.querySelector("[data-remove]")?.addEventListener("click", () => {
                const index = this.files.findIndex(f => f.name === file.name);
                if (index >= 0) {
                    this.files.splice(index, 1);
                }
            });

            list.appendChild(item);
        }
    }

    private updateResultsList(): void {
        const list = this.element?.querySelector("[data-results-list]");
        if (!list) return;

        if (this.results.length === 0) {
            list.innerHTML = `
                <div class="view-workcenter__results-empty">
                    <p>Results will appear here</p>
                </div>
            `;
            return;
        }

        list.innerHTML = "";
        for (const result of [...this.results].reverse()) {
            const item = H`
                <div class="view-workcenter__result-item ${result.ok ? '' : 'error'}">
                    <div class="view-workcenter__result-header">
                        <span class="view-workcenter__result-time">${new Date(result.timestamp).toLocaleTimeString()}</span>
                        <button class="view-workcenter__result-copy" data-copy="${result.id}" type="button">
                            <ui-icon icon="copy" icon-style="duotone" size="14"></ui-icon>
                        </button>
                    </div>
                    <div class="view-workcenter__result-content">${result.content}</div>
                </div>
            ` as HTMLElement;

            item.querySelector("[data-copy]")?.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(result.content);
                    this.showMessage("Copied to clipboard");
                } catch {
                    this.showMessage("Failed to copy");
                }
            });

            list.appendChild(item);
        }
    }

    private formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    private showMessage(message: string): void {
        this.shellContext?.showMessage(message);
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    private onMount(): void {
        console.log("[WorkCenter] Mounted");
        this._sheet ??= loadAsAdopted(workcenterStyles) as CSSStyleSheet;
    }

    private onUnmount(): void {
        console.log("[WorkCenter] Unmounting");
        removeAdopted(this._sheet!);
    }

    private onShow(): void {
        this._sheet ??= loadAsAdopted(workcenterStyles) as CSSStyleSheet;
        console.log("[WorkCenter] Shown");
    }

    private onHide(): void {
        //removeAdopted(this._sheet);
        console.log("[WorkCenter] Hidden");
    }

    // ========================================================================
    // MESSAGE HANDLING
    // ========================================================================

    canHandleMessage(messageType: string): boolean {
        return ["content-attach", "content-process", "file-attach"].includes(messageType);
    }

    async handleMessage(message: unknown): Promise<void> {
        const msg = message as { type?: string; data?: { file?: File; files?: File[]; text?: string } };

        if (msg.data?.file) {
            this.addFiles([msg.data.file]);
        }
        if (msg.data?.files) {
            this.addFiles(msg.data.files);
        }
        if (msg.data?.text) {
            this.setPrompt(msg.data.text);
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createView(options?: WorkCenterOptions): WorkCenterView {
    return new WorkCenterView(options);
}

/** Alias for createView */
export const createWorkCenterView = createView;

export default createView;
