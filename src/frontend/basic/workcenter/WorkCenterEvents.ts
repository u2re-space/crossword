import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";
import type { WorkCenterUI } from "./WorkCenterUI";
import type { WorkCenterFileOps } from "./WorkCenterFileOps";
import type { WorkCenterActions } from "./WorkCenterActions";
import type { WorkCenterTemplates } from "./WorkCenterTemplates";
import type { WorkCenterVoice } from "./WorkCenterVoice";
import type { WorkCenterShareTarget } from "./WorkCenterShareTarget";
import type { WorkCenterHistory } from "./WorkCenterHistory";
import type { WorkCenterAttachments } from "./WorkCenterAttachments";
import type { WorkCenterPrompts } from "./WorkCenterPrompts";

export class WorkCenterEvents {
    private deps: WorkCenterDependencies;
    private ui: WorkCenterUI;
    private fileOps: WorkCenterFileOps;
    private actions: WorkCenterActions;
    private templates: WorkCenterTemplates;
    private voice: WorkCenterVoice;
    private shareTarget: WorkCenterShareTarget;
    private history: WorkCenterHistory;
    private attachments: WorkCenterAttachments;
    private prompts: WorkCenterPrompts;
    private state: WorkCenterState;
    private container: HTMLElement | null = null;

    constructor(
        dependencies: WorkCenterDependencies,
        ui: WorkCenterUI,
        fileOps: WorkCenterFileOps,
        actions: WorkCenterActions,
        templates: WorkCenterTemplates,
        voice: WorkCenterVoice,
        shareTarget: WorkCenterShareTarget,
        history: WorkCenterHistory,
        attachments: WorkCenterAttachments,
        prompts: WorkCenterPrompts,
        state: WorkCenterState
    ) {
        this.deps = dependencies;
        this.ui = ui;
        this.fileOps = fileOps;
        this.actions = actions;
        this.templates = templates;
        this.voice = voice;
        this.shareTarget = shareTarget;
        this.history = history;
        this.attachments = attachments;
        this.prompts = prompts;
        this.state = state;
    }

    setContainer(container: HTMLElement): void {
        this.container = container;
    }

    setupWorkCenterEvents(): void {
        if (!this.container) return;

        // File selection
        this.setupFileSelection();

        // Paste support
        this.setupPasteSupport();

        // Template selection
        this.setupTemplateSelection();

        // Prompt input
        this.setupPromptInput();

        // Voice input
        this.setupVoiceInput();

        // Format selectors
        this.setupFormatSelectors();

        // Auto action checkbox
        this.setupAutoActionCheckbox();

        // Action buttons and other click handlers
        this.setupActionButtons();

        // Pipeline step restoration
        this.setupPipelineRestoration();
    }

    private setupFileSelection(): void {
        if (!this.container) return;

        const fileSelectBtn = this.container.querySelector('[data-action="select-files"]') as HTMLButtonElement;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'image/*,.pdf,.txt,.md,.json,.html,.css,.js,.ts';
        fileInput.style.display = 'none';
        this.container.append(fileInput);

        fileSelectBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            this.fileOps.addFilesFromInput(this.state, files as any);
            this.ui.updateFileList(this.state);
            this.ui.updateFileCounter(this.state);
            this.deps.onFilesChanged?.();

            // Auto-process text/markdown files if template is selected
            const textFiles = files.filter(f => f.type.startsWith('text/') || f.type === 'application/markdown' || f.name.endsWith('.md') || f.name.endsWith('.txt'));
            if (textFiles.length > 0 && this.state.selectedTemplate && this.state.selectedTemplate.trim()) {
                console.log('[WorkCenter] Auto-processing text/markdown files with template:', this.state.selectedTemplate);
                // Small delay to allow UI to update
                setTimeout(async () => {
                    await this.actions.executeUnifiedAction(this.state);
                }, 100);
            }
        });
    }


    private setupPasteSupport(): void {
        if (!this.container) return;

        this.container.addEventListener('paste', async (e) => {
            if (!e.clipboardData) return;

            const files = Array.from(e.clipboardData.files || []);
            let contentAdded = false;

            // Handle files (existing functionality)
            if (files.length > 0) {
                e.preventDefault();
                this.fileOps.addFilesFromInput(this.state, files as any);
                this.ui.updateFileList(this.state);
                this.ui.updateFileCounter(this.state);
                this.deps.onFilesChanged?.();
                contentAdded = true;
            }

            // Handle text content
            const textContent = e.clipboardData.getData('text/plain')?.trim();
            if (textContent && !contentAdded) {
                e.preventDefault();
                await this.fileOps.handlePastedContent(this.state, textContent, 'text');
                contentAdded = true;
            }

            // Handle HTML content (extract text if no plain text)
            if (!contentAdded) {
                const htmlContent = e.clipboardData.getData('text/html');
                if (htmlContent) {
                    e.preventDefault();
                    // Extract text from HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    const extractedText = tempDiv.textContent || tempDiv.innerText || '';
                    if (extractedText.trim()) {
                        await this.fileOps.handlePastedContent(this.state, extractedText.trim(), 'html');
                        contentAdded = true;
                    }
                }
            }

            // Handle images from clipboard (base64 encoded)
            for (const item of Array.from(e.clipboardData.items || [])) {
                if (item.type.startsWith('image/') && item.getAsFile) {
                    const imageFile = item.getAsFile();
                    if (imageFile) {
                        e.preventDefault();
                        this.state.files.push(imageFile);
                        this.ui.updateFileList(this.state);
                        this.ui.updateFileCounter(this.state);
                        contentAdded = true;
                        break; // Only handle one image
                    }
                }
            }
        });
    }

    private setupTemplateSelection(): void {
        if (!this.container) return;

        const templateSelect = this.container.querySelector('.template-select') as HTMLSelectElement;
        templateSelect.addEventListener('change', async () => {
            const selectedPrompt = templateSelect.value;
            this.templates.selectTemplate(this.state, selectedPrompt);

            // Always apply the selected template - templates are meant to provide structured prompts
            // Users can modify them after selection if needed
            if (selectedPrompt) {
                this.prompts.updatePromptInput(this.state);

                // Auto-process if we have recognized data or files
                if (this.state.recognizedData || this.fileOps.hasFiles(this.state)) {
                    console.log('[WorkCenter] Auto-processing with selected template:', selectedPrompt);
                    await this.actions.executeUnifiedAction(this.state);
                }
            }
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);
        });
    }

    private setupPromptInput(): void {
        if (!this.container) return;

        const promptInput = this.container.querySelector('.prompt-input') as HTMLTextAreaElement;
        promptInput.addEventListener('input', () => {
            this.state.currentPrompt = promptInput.value;
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);

            // Auto-process if we have recognized data and user entered text
            if (this.state.recognizedData && promptInput.value.trim()) {
                console.log('[WorkCenter] Auto-processing recognized data with manual prompt');
                // Debounce auto-processing
                clearTimeout((this.container as any)._autoProcessTimeout);
                (this.container as any)._autoProcessTimeout = setTimeout(async () => {
                    await this.actions.executeUnifiedAction(this.state);
                }, 1000); // 1 second delay
            }
        });
    }

    private setupVoiceInput(): void {
        if (!this.container) return;

        const voiceBtn = this.container.querySelector('[data-action="voice-input"]') as HTMLButtonElement;
        voiceBtn.addEventListener('mousedown', () => this.voice.startVoiceRecording(this.state));
        voiceBtn.addEventListener('mouseup', () => {
            this.voice.stopVoiceRecording(this.state);
            this.ui.updateVoiceButton(this.state);
        });
        voiceBtn.addEventListener('mouseleave', () => {
            this.voice.stopVoiceRecording(this.state);
            this.ui.updateVoiceButton(this.state);
        });
    }

    private setupFormatSelectors(): void {
        if (!this.container) return;

        // Format selector
        const formatSelect = this.container.querySelector('.format-select') as HTMLSelectElement;
        formatSelect.addEventListener('change', () => {
            const newFormat = formatSelect.value as "auto" | "markdown" | "json" | "text" | "html";
            this.state.outputFormat = newFormat;
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);

            // Re-render existing results if available
            if (this.state.lastRawResult) {
                const outputContent = this.container?.querySelector('[data-output]') as HTMLElement;
                const { formatResult } = require('./WorkCenterDataProcessing');
                const formattedResult = new formatResult(this.state.lastRawResult, newFormat);
                outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
            }
        });

        // Language selector
        const languageSelect = this.container.querySelector('.language-select') as HTMLSelectElement;
        languageSelect.addEventListener('change', () => {
            this.state.selectedLanguage = languageSelect.value as "auto" | "en" | "ru";
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);
            // Language change doesn't need re-rendering since it affects future AI calls
        });

        // Recognition format selector
        const recognitionSelect = this.container.querySelector('.recognition-select') as HTMLSelectElement;
        recognitionSelect.addEventListener('change', () => {
            this.state.recognitionFormat = recognitionSelect.value as "auto" | "markdown" | "html" | "text" | "json" | "most-suitable" | "most-optimized" | "most-legibility";
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);
            // Recognition format change doesn't need re-rendering since it affects future AI calls
        });

        // Processing format selector
        const processingSelect = this.container.querySelector('.processing-select') as HTMLSelectElement;
        processingSelect.addEventListener('change', () => {
            this.state.processingFormat = processingSelect.value as "markdown" | "html" | "json" | "text" | "typescript" | "javascript" | "python" | "java" | "cpp" | "csharp" | "php" | "ruby" | "go" | "rust" | "xml" | "yaml" | "css" | "scss";
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);
            // Processing format change doesn't need re-rendering since it affects future AI calls
        });
    }

    private setupAutoActionCheckbox(): void {
        if (!this.container) return;

        const autoCheckbox = this.container.querySelector('.auto-action-checkbox') as HTMLInputElement;
        autoCheckbox.addEventListener('change', () => {
            this.state.autoAction = autoCheckbox.checked;
            const { saveState } = require('./WorkCenterState');
            saveState(this.state);
        });
    }

    private setupActionButtons(): void {
        if (!this.container) return;

        this.container.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const action = target.closest('[data-action]')?.getAttribute('data-action');

            if (!action) return;

            switch (action) {
                case 'edit-templates':
                    this.templates.showTemplateEditor(this.state, this.container as HTMLElement);
                    break;
                case 'clear-prompt':
                    this.prompts.clearPrompt(this.state);
                    break;
                case 'copy-results':
                    await this.actions.copyResults(this.state);
                    break;
                case 'clear-results':
                    this.actions.clearResults(this.state);
                    break;
                case 'view-full-history':
                    this.deps.state.view = 'history';
                    this.deps.render();
                    break;
                case 'view-action-history':
                    this.showActionHistory();
                    break;
                case 'execute':
                    await this.actions.executeUnifiedAction(this.state);
                    break;
                case 'clear-recognized':
                    const { clearRecognizedData } = require('./WorkCenterState');
                    clearRecognizedData(this.state);
                    // Update the UI to remove the recognized status and pipeline
                    const statusElement = this.container?.querySelector('.recognized-status');
                    if (statusElement) {
                        statusElement.remove();
                    }
                    this.ui.updateDataPipeline(this.state);
                    break;
                case 'clear-pipeline':
                    clearRecognizedData(this.state);
                    // Also clear attachments & preview URLs (pipeline reset means "start over")
                    this.ui.revokeAllPreviewUrls(this.state);
                    this.state.files = [];
                    this.ui.updateFileList(this.state);
                    this.ui.updateFileCounter(this.state);
                    this.deps.onFilesChanged?.();
                    // Update UI
                    const statusEl = this.container?.querySelector('.recognized-status');
                    if (statusEl) {
                        statusEl.remove();
                    }
                    this.ui.updateDataPipeline(this.state);
                    break;
            }
        });
    }

    private setupPipelineRestoration(): void {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const stepIndex = target.getAttribute('data-restore-step');

            if (stepIndex !== null) {
                const index = parseInt(stepIndex);
                if (this.state.processedData && this.state.processedData[index]) {
                    const step = this.state.processedData[index];
                    // Restore this processing step result to the output
                    const outputContent = this.container?.querySelector('[data-output]') as HTMLElement;
                    const { formatResult } = require('./WorkCenterDataProcessing');
                    const formattedResult = new formatResult({ content: step.content }, this.state.outputFormat);
                    outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
                    this.state.lastRawResult = { data: step.content };
                }
            }
        });
    }

    private showActionHistory(): void {
        this.history.showActionHistory();
    }

    private isValidUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }
}