import { H } from "fest/lure";
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";
import { actionHistory } from "@rs-core/service/ActionHistory";
import type { ActionContext, ActionEntry, ActionInput } from "@rs-core/service/ActionHistory";
import { executionCore } from "@rs-core/service/ExecutionCore";
import { extractJSONFromAIResponse } from "@rs-core/utils/AIResponseParser";
import DOMPurify from "isomorphic-dompurify";

// Configure marked with KaTeX extension for HTML output with proper delimiters
marked?.use?.(markedKatex({
    throwOnError: false,
    nonStandard: true,
    output: "mathml",
    strict: false,
}) as unknown as MarkedExtension,
{
    hooks: {
        preprocess: (markdown: string): string => {
            if (/\\(.*\\)|\\[.*\\]/.test(markdown)) {
                const katexNode = document.createElement('div')
                katexNode.innerHTML = markdown
                renderMathInElement(katexNode, {
                    throwOnError: false,
                    nonStandard: true,
                    output: "mathml",
                    strict: false,
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "\\[", right: "\\]", display: true },
                        { left: "$", right: "$", display: false },
                        { left: "\\(", right: "\\)", display: false }
                    ]
                })

                return katexNode.innerHTML
            }
            return markdown
        },
    },
});

export interface WorkCenterState {
    files: File[];
    selectedFiles: File[];
    currentPrompt: string;
    autoAction: boolean;
    selectedInstruction: string;
    outputFormat: "auto" | "markdown" | "json" | "text" | "html";
    selectedLanguage: "auto" | "en" | "ru"; // Language selection for AI responses
    selectedTemplate: string; // Store the selected template prompt
    recognitionFormat: "auto" | "markdown" | "html" | "text" | "json" | "most-suitable" | "most-optimized" | "most-legibility"; // Preferred recognition format
    processingFormat: "markdown" | "html" | "json" | "text" | "typescript" | "javascript" | "python" | "java" | "cpp" | "csharp" | "php" | "ruby" | "go" | "rust" | "xml" | "yaml" | "css" | "scss"; // Processing output format
    voiceRecording: boolean;
    promptTemplates: { name: string, prompt: string }[];
    lastRawResult: any; // Store raw result for copying unparsed content

    // Data processing pipeline
    recognizedData: {
        content: string;
        timestamp: number;
        source: 'files' | 'text' | 'url' | 'markdown' | 'image' | 'mixed';
        recognizedAs: 'markdown' | 'html' | 'text' | 'json' | 'xml' | 'other'; // Format recognized as
        metadata?: Record<string, any>;
        responseId?: string; // GPT/AI response ID from HTTP level
    } | null; // Raw recognized content from files/images

    processedData: {
        content: string;
        timestamp: number;
        action: string; // Template/action applied
        sourceData: any; // Reference to what was processed
        metadata?: any;
    }[] | null; // Chain of processed results

    currentProcessingStep: number; // Current step in processing chain
}

export interface WorkCenterDependencies {
    state: any; // App state
    history: any[]; // History array
    getSpeechPrompt: () => Promise<string | null>;
    showMessage: (message: string) => void;
    render: () => void;
}

export class WorkCenterManager {
    private state: WorkCenterState;
    private deps: WorkCenterDependencies;
    private previewUrlCache = new WeakMap<File, string>();

    constructor(dependencies: WorkCenterDependencies) {
        this.deps = dependencies;
        this.state = {
            files: [],
            selectedFiles: [],
            currentPrompt: "",
            autoAction: false,
            selectedInstruction: "",
            outputFormat: "auto",
            selectedLanguage: "auto",
            selectedTemplate: "",
            recognitionFormat: "auto",
            processingFormat: "markdown",
            voiceRecording: false,
            promptTemplates: this.loadPromptTemplates(),
            lastRawResult: null,
            recognizedData: null,
            processedData: null,
            currentProcessingStep: 0,
            ...this.loadWorkCenterState() // Load persisted state
        };
    }

    private isMarkdownFile(file: File): boolean {
        const name = (file?.name || "").toLowerCase();
        const type = (file?.type || "").toLowerCase();
        return type === "text/markdown" || name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".mdown") || name.endsWith(".mkd") || name.endsWith(".mkdn");
    }

    private isImageFile(file: File): boolean {
        const type = (file?.type || "").toLowerCase();
        return type.startsWith("image/");
    }

    private getOrCreatePreviewUrl(file: File): string | null {
        if (!file) return null;
        if (!this.isImageFile(file)) return null;
        const cached = this.previewUrlCache.get(file);
        if (cached) return cached;
        try {
            const url = URL.createObjectURL(file);
            this.previewUrlCache.set(file, url);
            return url;
        } catch {
            return null;
        }
    }

    private revokePreviewUrl(file: File): void {
        const url = this.previewUrlCache.get(file);
        if (url) {
            try { URL.revokeObjectURL(url); } catch { /* ignore */ }
        }
        this.previewUrlCache.delete(file);
    }

    private async openMarkdownInViewerFromWorkCenter(file: File): Promise<void> {
        try {
            const md = await file.text();
            // Basic edition stores markdown in localStorage + state.markdown.
            try { localStorage.setItem("rs-basic-markdown", md); } catch { /* ignore */ }
            try {
                if (this.deps?.state) {
                    this.deps.state.markdown = md;
                    this.deps.state.view = "markdown-viewer";
                }
            } catch { /* ignore */ }
            this.deps.showMessage?.(`Opened ${file.name}`);
            this.deps.render?.();
        } catch (e) {
            this.deps.showMessage?.(`Failed to open ${file.name}`);
            console.warn("[WorkCenter] Failed to open markdown file:", e);
        }
    }

    getState(): WorkCenterState {
        return this.state;
    }

    renderWorkCenterView(): HTMLElement {
        const container = H`<div class="workcenter-view">
      <div class="workcenter-header">
        <h2>AI Work Center</h2>
        <div class="control-selectors">
          <div class="format-selector">
            <label>Output Format:</label>
            <select class="format-select">
              <option value="auto" ${this.state.outputFormat === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="markdown" ${this.state.outputFormat === 'markdown' ? 'selected' : ''}>Markdown</option>
              <option value="json" ${this.state.outputFormat === 'json' ? 'selected' : ''}>JSON</option>
              <option value="text" ${this.state.outputFormat === 'text' ? 'selected' : ''}>Plain Text</option>
              <option value="html" ${this.state.outputFormat === 'html' ? 'selected' : ''}>HTML</option>
            </select>
          </div>
          <div class="language-selector">
            <label>Language:</label>
            <select class="language-select">
              <option value="auto" ${this.state.selectedLanguage === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="en" ${this.state.selectedLanguage === 'en' ? 'selected' : ''}>English</option>
              <option value="ru" ${this.state.selectedLanguage === 'ru' ? 'selected' : ''}>Русский</option>
            </select>
          </div>
          <div class="recognition-selector">
            <label>Recognize as:</label>
            <select class="recognition-select">
              <option value="auto" ${this.state.recognitionFormat === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="most-suitable" ${this.state.recognitionFormat === 'most-suitable' ? 'selected' : ''}>Most Suitable</option>
              <option value="most-optimized" ${this.state.recognitionFormat === 'most-optimized' ? 'selected' : ''}>Most Optimized</option>
              <option value="most-legibility" ${this.state.recognitionFormat === 'most-legibility' ? 'selected' : ''}>Most Legible</option>
              <option value="markdown" ${this.state.recognitionFormat === 'markdown' ? 'selected' : ''}>Markdown</option>
              <option value="html" ${this.state.recognitionFormat === 'html' ? 'selected' : ''}>HTML</option>
              <option value="text" ${this.state.recognitionFormat === 'text' ? 'selected' : ''}>Plain Text</option>
              <option value="json" ${this.state.recognitionFormat === 'json' ? 'selected' : ''}>JSON</option>
            </select>
          </div>
          <div class="processing-selector">
            <label>Process as:</label>
            <select class="processing-select">
              <option value="markdown" ${this.state.processingFormat === 'markdown' ? 'selected' : ''}>Markdown</option>
              <option value="html" ${this.state.processingFormat === 'html' ? 'selected' : ''}>HTML</option>
              <option value="json" ${this.state.processingFormat === 'json' ? 'selected' : ''}>JSON</option>
              <option value="text" ${this.state.processingFormat === 'text' ? 'selected' : ''}>Plain Text</option>
              <option value="typescript" ${this.state.processingFormat === 'typescript' ? 'selected' : ''}>TypeScript</option>
              <option value="javascript" ${this.state.processingFormat === 'javascript' ? 'selected' : ''}>JavaScript</option>
              <option value="python" ${this.state.processingFormat === 'python' ? 'selected' : ''}>Python</option>
              <option value="java" ${this.state.processingFormat === 'java' ? 'selected' : ''}>Java</option>
              <option value="cpp" ${this.state.processingFormat === 'cpp' ? 'selected' : ''}>C++</option>
              <option value="csharp" ${this.state.processingFormat === 'csharp' ? 'selected' : ''}>C#</option>
              <option value="php" ${this.state.processingFormat === 'php' ? 'selected' : ''}>PHP</option>
              <option value="ruby" ${this.state.processingFormat === 'ruby' ? 'selected' : ''}>Ruby</option>
              <option value="go" ${this.state.processingFormat === 'go' ? 'selected' : ''}>Go</option>
              <option value="rust" ${this.state.processingFormat === 'rust' ? 'selected' : ''}>Rust</option>
              <option value="xml" ${this.state.processingFormat === 'xml' ? 'selected' : ''}>XML</option>
              <option value="yaml" ${this.state.processingFormat === 'yaml' ? 'selected' : ''}>YAML</option>
              <option value="css" ${this.state.processingFormat === 'css' ? 'selected' : ''}>CSS</option>
              <option value="scss" ${this.state.processingFormat === 'scss' ? 'selected' : ''}>SCSS</option>
            </select>
          </div>
      </div>
          </div>

      <div class="workcenter-content">
        <div class="main-panel">
          <div class="output-section">
            <div class="output-header">
              <h3>Results</h3>
              <div class="file-counters">
                <span class="file-counter" data-file-count>
                  <ui-icon icon="file" size="14" icon-style="duotone"></ui-icon>
                  <span class="count">${this.state.files.length}</span>
                </span>
                ${this.state.recognizedData ? H`<span class="data-counter recognized" title="Recognized data available">
                  <ui-icon icon="eye" size="14" icon-style="duotone"></ui-icon>
                </span>` : ''}
                ${this.state.processedData && this.state.processedData.length > 0 ? H`<span class="data-counter processed" title="${this.state.processedData.length} processing steps">
                  <ui-icon icon="cogs" size="14" icon-style="duotone"></ui-icon>
                  <span class="count">${this.state.processedData.length}</span>
                </span>` : ''}
              </div>
              <div class="output-actions">
                <button class="btn btn-icon" data-action="copy-results" title="Copy results">
                  <ui-icon icon="copy" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Copy</span>
                </button>
                <button class="btn btn-icon" data-action="clear-results" title="Clear results">
                  <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Clear</span>
                </button>
              </div>
            </div>
            <div class="output-content" data-output data-dropzone></div>
          </div>

          ${this.state.recognizedData || (this.state.processedData && this.state.processedData.length > 0) ? H`<div class="data-pipeline-section">
            <div class="pipeline-header">
              <h3>Data Processing Pipeline</h3>
              <div class="pipeline-actions">
                <button class="btn btn-icon" data-action="clear-pipeline" title="Clear all data">
                  <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                </button>
              </div>
            </div>
            <div class="pipeline-steps">
              ${this.state.recognizedData ? H`<div class="pipeline-step recognized-step">
                <div class="step-header">
                  <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                  <span class="step-title">Recognized Data</span>
                  <span class="step-time">${new Date(this.state.recognizedData.timestamp).toLocaleTimeString()}</span>
                  <span class="step-source">${this.state.recognizedData.source}</span>
                </div>
                <div class="step-content">
                  <div class="step-preview">${this.state.recognizedData.content.substring(0, 100)}${this.state.recognizedData.content.length > 100 ? '...' : ''}</div>
                </div>
              </div>` : ''}

              ${this.state.processedData ? this.state.processedData.map((step, index) => H`<div class="pipeline-step processed-step">
                <div class="step-header">
                  <ui-icon icon="cogs" size="16" icon-style="duotone"></ui-icon>
                  <span class="step-title">Step ${index + 1}: ${step.action}</span>
                  <span class="step-time">${new Date(step.timestamp).toLocaleTimeString()}</span>
                  <button class="btn small" data-restore-step="${index}">Use Result</button>
                </div>
                <div class="step-content">
                  <div class="step-preview">${step.content.substring(0, 100)}${step.content.length > 100 ? '...' : ''}</div>
                </div>
              </div>`) : ''}
            </div>
          </div>` : ''}

          <div class="prompt-section">
            <div class="file-input-area">
                <div class="file-drop-zone">
                    <div class="drop-zone-content">
                    <ui-icon icon="folder" size="4rem" icon-style="duotone" class="drop-icon"></ui-icon>
                    <div class="drop-text">Drop files here or click to browse</div>
                    <div class="drop-hint">Supports: Images, Documents, Text files, PDFs</div>
                    </div>
                </div>
                <div class="file-list" data-file-list></div>
              ${this.state.recognizedData ? H`<div class="recognized-status">
                <ui-icon icon="check-circle" size="16" icon-style="duotone" class="status-icon"></ui-icon>
                <span>Content recognized - ready for actions</span>
                <button class="btn small clear-recognized" data-action="clear-recognized">Clear</button>
              </div>` : ''}
        </div>

            <div class="prompt-input-group" data-dropzone>
              <div class="prompt-controls">
                <select class="template-select">
                  <option value="">Select Template...</option>
                  ${this.state.promptTemplates.map(t => H`<option value="${t.prompt}" ${this.state.selectedTemplate === t.prompt ? 'selected' : ''}>${t.name}</option>`)}
                </select>
                <button class="btn btn-icon" data-action="edit-templates" title="Edit Templates">
                  <ui-icon icon="gear" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Templates</span>
                </button>
                <button class="btn btn-icon" data-action="select-files" title="Choose Files">
                  <ui-icon icon="folder-open" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Files</span>
                </button>
              </div>
              <textarea
                class="prompt-input"
                placeholder="Describe what you want to do with the content... (or use voice input)"
                rows="3"
              >${this.state.currentPrompt}</textarea>
              <div class="prompt-actions">
                <button class="btn voice-btn ${this.state.voiceRecording ? 'recording' : ''}" data-action="voice-input">
                  🎤 ${this.state.voiceRecording ? 'Recording...' : 'Hold for Voice'}
                </button>
                <button class="btn clear-btn" data-action="clear-prompt">Clear</button>
              </div>
            </div>
          </div>

          <div class="action-section">
            <div class="action-controls">
              <div class="action-buttons">
                <button class="btn primary action-btn" data-action="execute">
                  <ui-icon icon="brain" size="20" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Recognize & Take Action</span>
                </button>
              </div>
              <label class="auto-action-label" title="Auto-action (use last successful)">
                <input type="checkbox" class="auto-action-checkbox" ${this.state.autoAction ? 'checked' : ''}>
                <ui-icon icon="lightning-a" size="20" icon-style="duotone"></ui-icon>
              </label>
            </div>
          </div>

          <div class="history-section">
            <div class="history-header">
              <h3>Recent Activity</h3>
              <div class="history-actions">
                <button class="btn btn-icon" data-action="view-action-history" title="View Action History">
                  <ui-icon icon="history" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">History</span>
                </button>
                <button class="btn" data-action="view-full-history">View All History</button>
              </div>
            </div>
            <div class="recent-history" data-recent-history></div>
            <div class="action-stats" data-action-stats style="display: none;"></div>
          </div>
        </div>
      </div>
    </div>` as HTMLElement;

        // Set up event listeners
        this.setupWorkCenterEvents(container);

        // Update file list, file counter, and recent history
        this.updateFileList(container);
        this.updateFileCounter(container);
        this.updateRecentHistory(container);

        return container;
    }

    private setupWorkCenterEvents(container: HTMLElement): void {
        // File selection
        const fileSelectBtn = container.querySelector('[data-action="select-files"]') as HTMLButtonElement;
        const fileInput = H`<input type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.html,.css,.js,.ts" style="display:none">` as HTMLInputElement;
        container.append(fileInput);

        fileSelectBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            this.state.files.push(...files);
            this.clearRecognizedData(); // Clear cached content when files change
            this.updateFileList(container);
            this.updateFileCounter(container);

            // Auto-process text/markdown files if template is selected
            const textFiles = files.filter(f => f.type.startsWith('text/') || f.type === 'application/markdown' || f.name.endsWith('.md') || f.name.endsWith('.txt'));
            if (textFiles.length > 0 && this.state.selectedTemplate && this.state.selectedTemplate.trim()) {
                console.log('[WorkCenter] Auto-processing text/markdown files with template:', this.state.selectedTemplate);
                // Small delay to allow UI to update
                setTimeout(async () => {
                    await this.executeUnifiedAction(container);
                }, 100);
            }
        });

        // Drag and drop - on both prompt-input-group and output-content
        const promptDropZone = container.querySelector('.prompt-input-group[data-dropzone]') as HTMLElement;
        const outputDropZone = container.querySelector('.output-content[data-dropzone]') as HTMLElement;
        const overlay = container.querySelector('.file-input-area') as HTMLElement;

        // Helper function to handle drag events
        const handleDragOver = (e: DragEvent, zone: HTMLElement) => {
            e.preventDefault();
            overlay.classList.add('drag-over');
            zone.classList.add('drag-over');
        };

        const handleDragLeave = (e: DragEvent, zone: HTMLElement) => {
            // Only hide overlay if leaving the drop zone entirely
            const rect = zone.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;

            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                overlay.classList.remove('drag-over');
                zone.classList.remove('drag-over');
            }
        };

        const handleDrop = (e: DragEvent, zone: HTMLElement) => {
            e.preventDefault();
            overlay.classList.remove('drag-over');
            zone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer?.files || []);
            this.state.files.push(...files);
            this.clearRecognizedData(); // Clear cached content when files change
            this.updateFileList(container);
            this.updateFileCounter(container);
        };

        // Prompt area drop events
        promptDropZone.addEventListener('dragover', (e) => handleDragOver(e, promptDropZone));
        promptDropZone.addEventListener('dragleave', (e) => handleDragLeave(e, promptDropZone));
        promptDropZone.addEventListener('drop', (e) => handleDrop(e, promptDropZone));

        // Output area drop events
        outputDropZone.addEventListener('dragover', (e) => handleDragOver(e, outputDropZone));
        outputDropZone.addEventListener('dragleave', (e) => handleDragLeave(e, outputDropZone));
        outputDropZone.addEventListener('drop', (e) => handleDrop(e, outputDropZone));

        // Output area click to select files (when empty)
        outputDropZone.addEventListener('click', (e) => {
            // Only trigger file selection if the output area is empty
            if (!outputDropZone.textContent?.trim() && outputDropZone.children.length === 0) {
                e.preventDefault();
                fileInput.click();
            }
        });

        // Paste support
        container.addEventListener('paste', (e) => {
            const files = Array.from(e.clipboardData?.files || []);
            if (files.length > 0) {
                e.preventDefault();
                this.state.files.push(...files);
                this.clearRecognizedData(); // Clear cached content when files change
                this.updateFileList(container);
                this.updateFileCounter(container);
            }
        });

        // Template selection
        const templateSelect = container.querySelector('.template-select') as HTMLSelectElement;
        templateSelect.addEventListener('change', async () => {
            const selectedPrompt = templateSelect.value;
            this.state.selectedTemplate = selectedPrompt;

            // Always apply the selected template - templates are meant to provide structured prompts
            // Users can modify them after selection if needed
            if (selectedPrompt) {
                this.state.currentPrompt = selectedPrompt;
                this.updatePromptInput(container);

                // Auto-process if we have recognized data or files
                if (this.state.recognizedData || this.state.files.length > 0) {
                    console.log('[WorkCenter] Auto-processing with selected template:', selectedPrompt);
                    await this.executeUnifiedAction(container);
            }
            }
            this.saveWorkCenterState();
        });

        // Prompt input
        const promptInput = container.querySelector('.prompt-input') as HTMLTextAreaElement;
        promptInput.addEventListener('input', () => {
            this.state.currentPrompt = promptInput.value;
            this.saveWorkCenterState();

            // Auto-process if we have recognized data and user entered text
            if (this.state.recognizedData && promptInput.value.trim()) {
                console.log('[WorkCenter] Auto-processing recognized data with manual prompt');
                // Debounce auto-processing
                clearTimeout((container as any)._autoProcessTimeout);
                (container as any)._autoProcessTimeout = setTimeout(async () => {
                    await this.executeUnifiedAction(container);
                }, 1000); // 1 second delay
            }
        });

        // Voice input
        let voiceTimeout: number | null = null;
        const voiceBtn = container.querySelector('[data-action="voice-input"]') as HTMLButtonElement;
        voiceBtn.addEventListener('mousedown', () => this.startVoiceRecording(container));
        voiceBtn.addEventListener('mouseup', () => this.stopVoiceRecording(container));
        voiceBtn.addEventListener('mouseleave', () => this.stopVoiceRecording(container));

        // Format selector
        const formatSelect = container.querySelector('.format-select') as HTMLSelectElement;
        formatSelect.addEventListener('change', () => {
            const newFormat = formatSelect.value as "auto" | "markdown" | "json" | "text" | "html";
            this.state.outputFormat = newFormat;
            this.saveWorkCenterState();

            // Re-render existing results if available
            if (this.state.lastRawResult) {
                const outputContent = container.querySelector('[data-output]') as HTMLElement;
                const formattedResult = this.formatResult(this.state.lastRawResult, newFormat);
                outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
            }
        });

        // Language selector
        const languageSelect = container.querySelector('.language-select') as HTMLSelectElement;
        languageSelect.addEventListener('change', () => {
            this.state.selectedLanguage = languageSelect.value as "auto" | "en" | "ru";
            this.saveWorkCenterState();
            // Language change doesn't need re-rendering since it affects future AI calls
        });

        // Recognition format selector
        const recognitionSelect = container.querySelector('.recognition-select') as HTMLSelectElement;
        recognitionSelect.addEventListener('change', () => {
            this.state.recognitionFormat = recognitionSelect.value as "auto" | "markdown" | "html" | "text" | "json" | "most-suitable" | "most-optimized" | "most-legibility";
            this.saveWorkCenterState();
            // Recognition format change doesn't need re-rendering since it affects future AI calls
        });

        // Processing format selector
        const processingSelect = container.querySelector('.processing-select') as HTMLSelectElement;
        processingSelect.addEventListener('change', () => {
            this.state.processingFormat = processingSelect.value as "markdown" | "html" | "json" | "text" | "typescript" | "javascript" | "python" | "java" | "cpp" | "csharp" | "php" | "ruby" | "go" | "rust" | "xml" | "yaml" | "css" | "scss";
            this.saveWorkCenterState();
            // Processing format change doesn't need re-rendering since it affects future AI calls
        });

        // Auto action checkbox
        const autoCheckbox = container.querySelector('.auto-action-checkbox') as HTMLInputElement;
        autoCheckbox.addEventListener('change', () => {
            this.state.autoAction = autoCheckbox.checked;
            this.saveWorkCenterState();
        });

            // Action buttons
            container.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const action = target.closest('[data-action]')?.getAttribute('data-action');

                if (!action) return;

                switch (action) {
                    case 'edit-templates':
                        this.showTemplateEditor(container);
                        break;
                    case 'clear-prompt':
                        this.state.currentPrompt = '';
                        this.updatePromptInput(container);
                        break;
                    case 'copy-results':
                        await this.copyResults(container);
                        break;
                    case 'clear-results':
                        this.clearResults(container);
                        break;
                    case 'view-full-history':
                        this.deps.state.view = 'history';
                        this.deps.render();
                        break;
                    case 'view-action-history':
                        this.showActionHistory(container);
                        break;
                    case 'execute':
                        await this.executeUnifiedAction(container);
                        break;
                    case 'clear-recognized':
                        this.clearRecognizedData();
                        // Update the UI to remove the recognized status and pipeline
                        const statusElement = container.querySelector('.recognized-status');
                        if (statusElement) {
                            statusElement.remove();
                        }
                        this.updateDataPipeline(container);
                        break;
                    case 'clear-pipeline':
                        this.clearRecognizedData();
                        // Also clear attachments & preview URLs (pipeline reset means "start over")
                        this.revokeAllPreviewUrls();
                        this.state.files = [];
                        this.updateFileList(container);
                        this.updateFileCounter(container);
                        // Update UI
                        const statusEl = container.querySelector('.recognized-status');
                        if (statusEl) {
                            statusEl.remove();
                        }
                        this.updateDataPipeline(container);
                        break;
                }
            });

        // Handle pipeline step restoration
        container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const stepIndex = target.getAttribute('data-restore-step');

            if (stepIndex !== null) {
                const index = parseInt(stepIndex);
                if (this.state.processedData && this.state.processedData[index]) {
                    const step = this.state.processedData[index];
                    // Restore this processing step result to the output
                    const outputContent = container.querySelector('[data-output]') as HTMLElement;
                    const formattedResult = this.formatResult({ content: step.content, rawData: { data: step.content } }, this.state.outputFormat);
                    outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
                    this.state.lastRawResult = { data: step.content };
                }
            }
        });
    }

    private updateFileCounter(container: HTMLElement): void {
        const counter = container.querySelector('[data-file-count] .count') as HTMLElement;
        if (counter) {
            counter.textContent = this.state.files.length.toString();
        }
    }

    private updateFileList(container: HTMLElement): void {
        const fileList = container.querySelector('[data-file-list]') as HTMLElement;
        fileList.innerHTML = '';

        if (this.state.files.length === 0) {
            fileList.innerHTML = '<div class="no-files">No files selected</div>';
            return;
        }

        this.state.files.forEach((file, index) => {
            const isImage = this.isImageFile(file);
            const isMarkdown = this.isMarkdownFile(file);
            const previewUrl = isImage ? this.getOrCreatePreviewUrl(file) : null;

            const fileItem = H`<div class="file-item">
        <div class="file-info">
          <span class="file-icon">${this.createFileIconElement(file.type)}</span>
          ${previewUrl ? H`<img class="file-preview" alt=${file.name || "image"} src=${previewUrl} loading="lazy" decoding="async" />` : ''}
          <span class="file-name">${file.name}</span>
          <span class="file-size">(${this.formatFileSize(file.size)})</span>
          ${isMarkdown ? H`<button class="btn small" data-open-md="${index}" title="Open in Markdown Viewer">Open</button>` : ''}
        </div>
        <button class="btn small remove-btn" data-remove="${index}">✕</button>
      </div>` as HTMLElement;

            const openBtn = fileItem.querySelector(`[data-open-md="${index}"]`) as HTMLButtonElement | null;
            openBtn?.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = this.state.files[index];
                if (f) await this.openMarkdownInViewerFromWorkCenter(f);
            });

            fileItem.querySelector('.remove-btn')?.addEventListener('click', () => {
                const removed = this.state.files[index];
                this.state.files.splice(index, 1);
                if (removed) this.revokePreviewUrl(removed);
                this.clearRecognizedData(); // Clear cached content when files change
                this.updateFileList(container);
                this.updateFileCounter(container);
            });

            fileList.append(fileItem);
        });
    }

    private updatePromptInput(container: HTMLElement): void {
        const promptInput = container.querySelector('.prompt-input') as HTMLTextAreaElement;
        promptInput.value = this.state.currentPrompt;
    }

    private updateRecentHistory(container: HTMLElement): void {
        const historyContainer = container.querySelector('[data-recent-history]') as HTMLElement;
        historyContainer.innerHTML = '';

        // Get recent entries from action history (workcenter only)
        const recentItems = actionHistory.getRecentEntries(10).filter(
            entry => entry.context.source === 'workcenter' && entry.status === 'completed'
        );

        if (recentItems.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No recent activity</div>';
            return;
        }

        recentItems.slice(0, 3).forEach(item => {
            const historyItem = H`<div class="history-item-compact">
        <div class="history-meta">
          <span class="history-status ${item.result?.type !== 'error' ? 'success' : 'error'}">${item.result?.type !== 'error' ? '✓' : '✗'}</span>
          <span class="history-prompt">${item.input.text?.substring(0, 50) || item.action}${item.input.text && item.input.text.length > 50 ? '...' : ''}</span>
          ${item.result?.processingTime ? H`<span class="history-time">${Math.round(item.result.processingTime / 1000)}s</span>` : ''}
        </div>
        <button class="btn small" data-restore="${item.id}">Use</button>
      </div>` as HTMLElement;

            historyItem.querySelector('button')?.addEventListener('click', () => {
                if (item.input.text) {
                    this.state.currentPrompt = item.input.text;
                this.updatePromptInput(container);
                }
            });

            historyContainer.append(historyItem);
        });
    }

    private updateActionHistory(container: HTMLElement): void {
        // Update action history stats if there's a stats display
        const statsContainer = container.querySelector('[data-action-stats]');
        if (statsContainer) {
            const stats = actionHistory.getStats();
            statsContainer.innerHTML = `
                <div class="stats-item">Total: ${stats.total}</div>
                <div class="stats-item">Success: ${stats.completed}</div>
                <div class="stats-item">Failed: ${stats.failed}</div>
            `;
        }
    }

    private async startVoiceRecording(container: HTMLElement): Promise<void> {
        if (this.state.voiceRecording) return;

        this.state.voiceRecording = true;
        this.updateVoiceButton(container);

        try {
            const prompt = await this.deps.getSpeechPrompt();
            if (prompt) {
                this.state.currentPrompt = prompt;
                this.updatePromptInput(container);
            }
        } catch (e) {
            console.warn('Voice recording failed:', e);
        } finally {
            this.state.voiceRecording = false;
            this.updateVoiceButton(container);
        }
    }

    private updateRecognizedStatus(container: HTMLElement): void {
        const statusElement = container.querySelector('.recognized-status') as HTMLElement;
        if (statusElement) {
            statusElement.innerHTML = `<div class="recognized-status">
                <ui-icon icon="check-circle" size="16" icon-style="duotone" class="status-icon"></ui-icon>
                <span>Content recognized - ready for actions</span>
              </div>`;
        }
    }


    private stopVoiceRecording(container: HTMLElement): void {
        this.state.voiceRecording = false;
        this.updateVoiceButton(container);
    }

    private updateVoiceButton(container: HTMLElement): void {
        const voiceBtn = container.querySelector('[data-action="voice-input"]') as HTMLButtonElement;
        voiceBtn.textContent = this.state.voiceRecording ? '🎤 Recording...' : '🎤 Hold for Voice';
        voiceBtn.classList.toggle('recording', this.state.voiceRecording);
    }

    private async executeUnifiedAction(container: HTMLElement): Promise<void> {
        if (this.state.files.length === 0 && !this.state.currentPrompt.trim() && !this.state.recognizedData) {
            this.deps.showMessage('Please select files or enter a prompt first');
            return;
        }

        const outputContent = container.querySelector('[data-output]') as HTMLElement;
        let processingMessage = 'Processing...';

        // Show what's being processed
        if (this.state.recognizedData) {
            processingMessage = `Processing ${this.state.recognizedData.source} content...`;
        } else if (this.state.files.length > 0) {
            processingMessage = `Processing ${this.state.files.length} file${this.state.files.length > 1 ? 's' : ''}...`;
        }

        outputContent.innerHTML = `<div class="processing">${processingMessage}</div>`;

        try {
            // Prepare input for execution core
            const actionInput: ActionInput = {
                type: this.state.recognizedData ? 'text' : (this.state.files.length > 0 ? 'files' : 'text'),
                files: this.state.files.length > 0 ? [...this.state.files] : undefined,
                text: this.state.currentPrompt.trim() ||
                    (this.state.autoAction ? this.getLastSuccessfulPrompt() : "Analyze and process the provided content intelligently"),
                recognizedData: this.state.recognizedData || undefined,
                // Keep legacy field for backward compatibility
                recognizedContent: this.state.recognizedData?.content || undefined
            };

            // Add language instruction if specific language selected
            if (this.state.selectedLanguage !== 'auto') {
                const languageInstruction = this.state.selectedLanguage === 'ru'
                    ? "Please respond in Russian language."
                    : "Please respond in English language.";
                actionInput.text = `${languageInstruction} ${actionInput.text}`;
            }

            // Execute through execution core
            const context: ActionContext = {
                source: 'workcenter',
                sessionId: this.generateSessionId()
            };

            // Determine action based on content type and state
            let forceAction: string | undefined;

            // If user has provided a specific prompt/template instruction, use it directly
            // Don't force a generic action that would override the user's instruction
            const hasUserInstruction = this.state.currentPrompt.trim() && this.state.currentPrompt.trim() !== "Analyze and process the provided content intelligently";

            if (hasUserInstruction) {
                // User has provided their own instruction - let the system determine the best action type
                // based on available data, but use the user's instruction
                forceAction = undefined; // Let the system auto-determine based on input type
            } else if (this.state.recognizedData) {
                // We have recognized data but no specific user instruction - do additional processing
                forceAction = 'analyze';
            } else if (this.state.files.length > 0) {
                // We have files but no recognized data - do initial recognition
                const hasTextFiles = this.state.files.some(f =>
                    f.type.startsWith('text/') ||
                    f.type === 'application/markdown' ||
                    f.name?.endsWith('.md') ||
                    f.name?.endsWith('.txt')
                );

                if (hasTextFiles) {
                    // Text files can be processed as source data
                    forceAction = 'source';
                } else {
                    // Binary files need recognition
                    forceAction = 'recognize';
                }
            } else {
                // No files, no recognized data, no user instruction - general analysis
                forceAction = 'analyze';
            }

            const result = await executionCore.execute(actionInput, context, {
                forceAction,
                recognitionFormat: this.state.recognitionFormat,
                processingFormat: this.state.processingFormat
            });

            //
            this.saveWorkCenterState();

            // Store raw result for copying
            this.state.lastRawResult = result.rawData;

            // Format and display result
            const formattedResult = this.formatResult(result.rawData || result, this.state.outputFormat);
            outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;

            // Update recognized data if files were processed (initial recognition or source data)
            if (this.state.files.length > 0 && result.rawData?.ok && !this.state.recognizedData) {
                const isTextFile = this.state.files.some(f =>
                    f.type.startsWith('text/') ||
                    f.type === 'application/markdown' ||
                    f.name?.endsWith('.md') ||
                    f.name?.endsWith('.txt')
                );

                this.state.recognizedData = {
                    content: result.content,
                    timestamp: Date.now(),
                    source: isTextFile ? 'text' : 'files',
                    recognizedAs: this.determineRecognizedFormat(result.content, isTextFile),
                    metadata: {
                        fileCount: this.state.files.length
                    },
                    responseId: result.responseId || "unknown"
                };
                this.updateRecognizedStatus(container);

                // Auto-process with selected template if available
                if (this.state.selectedTemplate && this.state.selectedTemplate.trim()) {
                    console.log('[WorkCenter] Auto-processing with template:', this.state.selectedTemplate);
                    // Small delay to allow UI to update
                    setTimeout(async () => {
                        await this.executeUnifiedAction(container);
                    }, 100);
                }
            }
            // Add to processing chain if we have recognized data (additional processing)
            else if (this.state.recognizedData && result.rawData?.ok) {
                const processedEntry = {
                    content: result.content,
                    timestamp: Date.now(),
                    action: this.state.currentPrompt.trim() || 'additional processing',
                    sourceData: this.state.recognizedData,
                    metadata: { step: this.state.currentProcessingStep + 1 }
                };

                if (!this.state.processedData) {
                    this.state.processedData = [];
                }
                this.state.processedData.push(processedEntry);
                this.state.currentProcessingStep++;
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputContent.innerHTML = `<div class="error">Error: ${errorMsg}</div>`;
        }

        this.updateRecentHistory(container);
        this.updateActionHistory(container);
        this.updateDataPipeline(container);
    }


    private getLastSuccessfulPrompt(): string {
        const lastSuccessful = this.deps.history.find(h => h.ok);
        return lastSuccessful?.prompt || "Process the provided content";
    }

    private formatResult(result: any, format: string): string {
        // Handle auto format - detect the best rendering format based on content
        if (format === 'auto') {
            const rawData = result?.rawData || result;
            let data = extractJSONFromAIResponse<any>(rawData)?.data || rawData;

            // If data is a string that looks like JSON, parse it
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && typeof parsed === 'object') {
                        data = parsed;
                    }
                } catch {
                    // Keep as string if not valid JSON
                }
            }

            // Check if we have structured AI recognition data
            if (data && typeof data === 'object' && (
                data.recognized_data ||
                data.verbose_data ||
                data.keywords_and_tags ||
                data.suggested_type
            )) {
                // For structured AI data, extract and render content directly as markdown
                const content: string[] = [];

                // Add recognized data (highest priority)
                if (data.recognized_data) {
                    const recognized = Array.isArray(data.recognized_data)
                        ? data.recognized_data
                        : [data.recognized_data];
                    content.push(...recognized.map((item: any) => String(item)));
                }

                // Add verbose data
                if (data.verbose_data) {
                    content.push(String(data.verbose_data));
                }

                // Add keywords/tags if available
                if (data.keywords_and_tags && Array.isArray(data.keywords_and_tags) && data.keywords_and_tags.length > 0) {
                    content.push(`\n**Keywords:** ${data.keywords_and_tags.join(', ')}`);
                }

                // Add confidence and type info
                if (data.confidence || data.suggested_type) {
                    const info: string[] = [];
                    if (data.confidence) info.push(`Confidence: ${Math.round(data.confidence * 100)}%`);
                    if (data.suggested_type) info.push(`Type: ${data.suggested_type}`);
                    if (info.length > 0) {
                        content.push(`\n*${info.join(' • ')}*`);
                    }
                }

                // Render directly as HTML to preserve KaTeX markup
                if (content.length > 0) {
                    const htmlContent = content.join('\n\n');
                    return `<div class="markdown-result structured-content">${htmlContent}</div>`;
                }
            }

            // For other structured data, use JSON format
            if (data && typeof data === 'object') {
                return this.formatResult(result, 'json');
            }

            // For plain text or simple content, use markdown
            return this.formatResult(result, 'markdown');
        }

        // For JSON format, render the raw data directly to preserve structure
        if (format === 'json') {
            // Extract the raw data from the result
            const rawData = result?.rawData || result;
            let data = extractJSONFromAIResponse<any>(rawData)?.data || rawData;

            // If data is a string that looks like JSON, parse it
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && typeof parsed === 'object') {
                        data = parsed;
                    }
                } catch {
                    // Keep as string if not valid JSON
                }
            }

            return this.renderAsJSON(data);
        }

        // Check if we have structured JSON data that should be rendered as markdown
        if (format === 'markdown') {
            const rawData = result?.rawData || result;
            let data = extractJSONFromAIResponse<any>(rawData)?.data || rawData;

            // If data is a string that looks like JSON, parse it
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && typeof parsed === 'object') {
                        data = parsed;
                    }
                } catch {
                    // Keep as string if not valid JSON
                }
            }

            // If we have structured recognition data, extract content for markdown rendering
            if (data && typeof data === 'object' && (
                data.recognized_data ||
                data.verbose_data ||
                data.keywords_and_tags ||
                data.suggested_type
            )) {
                // Create markdown content from structured data
                const content: string[] = [];

                // Add recognized data (highest priority)
                if (data.recognized_data) {
                    const recognized = Array.isArray(data.recognized_data)
                        ? data.recognized_data
                        : [data.recognized_data];
                    content.push(...recognized.map((item: any) => String(item)));
                }

                // Add verbose data
                if (data.verbose_data) {
                    content.push(String(data.verbose_data));
                }

                // Add keywords/tags if available
                if (data.keywords_and_tags && Array.isArray(data.keywords_and_tags) && data.keywords_and_tags.length > 0) {
                    content.push(`\n**Keywords:** ${data.keywords_and_tags.join(', ')}`);
                }

                // Add confidence and type info
                if (data.confidence || data.suggested_type) {
                    const info: string[] = [];
                    if (data.confidence) info.push(`Confidence: ${Math.round(data.confidence * 100)}%`);
                    if (data.suggested_type) info.push(`Type: ${data.suggested_type}`);
                    if (info.length > 0) {
                        content.push(`\n*${info.join(' • ')}*`);
                    }
                }

                // If we extracted content, render it directly as HTML to preserve KaTeX markup
                if (content.length > 0) {
                    const htmlContent = content.join('\n\n');
                    // For structured data with HTML content, render directly without processing
                    return `<div class="markdown-result structured-content">${htmlContent}</div>`;
                }
            }
        }

        // For other formats or fallback, normalize and extract data first
        const normalizedData = this.normalizeResultData(result);
        if (!normalizedData) return '<div class="no-result">No result</div>';

        // Render based on format
        switch (format) {
            case 'html':
                return this.renderAsHTML(normalizedData);
            case 'text':
                return this.renderAsText(normalizedData);
            case 'markdown':
            default:
                return this.renderAsMarkdown(normalizedData);
        }
    }

    private normalizeResultData(result: any): any {
        if (!result) return null;

        // Extract data from AI response wrapper
        let data = extractJSONFromAIResponse<any>(result)?.data || result;

        // Handle nested data structures
        if (data && typeof data === 'object') {
            // If data has a 'data' property, use that
            if (data.data !== undefined) {
                data = data.data;
            }

            // If data is still an object, check for string content that needs parsing
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && typeof parsed === 'object') {
                        data = parsed;
                    }
                } catch {
                    // Keep as string if not valid JSON
                }
            }
        }

        // Handle primitive values by wrapping them
        if (typeof data !== 'object' || data === null) {
            data = { recognized_data: [String(data)] };
        }

        return data;
    }

    private renderAsJSON(data: any): string {
        try {
            // Create a formatted JSON string, but handle HTML content specially
            const createFormattedJSON = (obj: any, indent: number = 0): string => {
                const spaces = '  '.repeat(indent);

                if (obj === null) return 'null';
                if (typeof obj === 'boolean') return obj ? 'true' : 'false';
                if (typeof obj === 'number') return String(obj);
                if (typeof obj === 'string') {
                    // Check if string contains HTML/MathML content that should be rendered
                    if (obj.includes('<math') || obj.includes('class="katex"') || obj.includes('<span>')) {
                        // This is HTML/MathML content - create a placeholder that will be replaced with actual HTML
                        const placeholder = `__HTML_CONTENT_${Math.random().toString(36).substr(2, 9)}__`;
                        htmlPlaceholders[placeholder] = obj;
                        return `"${placeholder}"`;
                    }
                    // Regular string - escape it
                    return JSON.stringify(obj);
                }

                if (Array.isArray(obj)) {
                    if (obj.length === 0) return '[]';
                    const items = obj.map(item => createFormattedJSON(item, indent + 1));
                    return `[\n${'  '.repeat(indent + 1)}${items.join(`,\n${'  '.repeat(indent + 1)}`)}\n${spaces}]`;
                }

                if (typeof obj === 'object') {
                    const keys = Object.keys(obj);
                    if (keys.length === 0) return '{}';
                    const items = keys.map(key => {
                        const formattedValue = createFormattedJSON(obj[key], indent + 1);
                        return `${JSON.stringify(key)}: ${formattedValue}`;
                    });
                    return `{\n${'  '.repeat(indent + 1)}${items.join(`,\n${'  '.repeat(indent + 1)}`)}\n${spaces}}`;
                }

                return String(obj);
            };

            // Store HTML content placeholders
            const htmlPlaceholders: Record<string, string> = {};
            const jsonString = createFormattedJSON(data);

            // Replace placeholders with actual HTML content
            let finalHTML = `<div class="json-result"><pre>${jsonString}</pre></div>`;

            // Replace placeholders with rendered HTML
            for (const [placeholder, htmlContent] of Object.entries(htmlPlaceholders)) {
                // Create a temporary div to hold the HTML content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                const renderedHTML = tempDiv.innerHTML;

                // Replace the placeholder in the JSON string
                finalHTML = finalHTML.replace(`"${placeholder}"`, `<span class="json-html-content">${renderedHTML}</span>`);
            }

            return finalHTML;
        } catch (error) {
            return `<div class="error">Failed to format JSON: ${error}</div>`;
        }
    }

    private renderAsHTML(data: any): string {
        const content = this.extractContentItems(data);
        const renderedContent = content.map(item => this.renderContentItem(item, 'html')).join('');

        if (!renderedContent) {
            return `<div class="html-result">${this.renderMathAsHTML(this.extractTextContent(data))}</div>`;
        }

        return `<div class="html-result">${renderedContent}</div>`;
    }

    private renderAsText(data: any): string {
        const content = this.extractContentItems(data);
        const renderedContent = content.map(item => this.renderContentItem(item, 'text')).join('\n\n');

        if (!renderedContent.trim()) {
            return `<pre class="text-result">${this.escapeHtml(this.extractTextContent(data))}</pre>`;
        }

        return `<pre class="text-result">${this.escapeHtml(renderedContent)}</pre>`;
    }

    private renderAsMarkdown(data: any): string {
        const content = this.extractContentItems(data);
        const renderedContent = content.map(item => this.renderContentItem(item, 'markdown')).join('\n\n');

        if (!renderedContent.trim()) {
            try {
                const textContent = this.extractTextContent(data);
                const html = marked.parse(textContent) as string;
                return DOMPurify.sanitize(html);
            } catch (error) {
                console.warn('Markdown parsing failed, falling back to simple rendering:', error);
                return this.renderMathAsHTML(renderedContent as string);
            }
        }

        try {
            const html = marked.parse(renderedContent) as string;
            return DOMPurify.sanitize(html);
        } catch (error) {
            console.warn('Markdown parsing failed, falling back to simple rendering:', error);
            return this.renderMathAsHTML(renderedContent as string);
        }
    }

    private extractContentItems(data: any): string[] {
        const items: string[] = [];

        // Extract recognized data (highest priority)
        if (data.recognized_data) {
            const recognized = Array.isArray(data.recognized_data)
                ? data.recognized_data
                : [data.recognized_data];
            items.push(...recognized.map((item: any) => String(item)));
        }

        // Extract verbose data
        if (data.verbose_data) {
            items.push(String(data.verbose_data));
        }

        // Extract other text fields if no recognized/verbose data
        if (items.length === 0) {
            const textFields = ['content', 'text', 'message', 'result', 'response', 'description'];
            for (const field of textFields) {
                if (data[field]) {
                    const content = Array.isArray(data[field]) ? data[field] : [data[field]];
                    items.push(...content.map((item: any) => String(item)));
                    break; // Use first available field
                }
            }
        }

        // Fallback to raw text extraction
        if (items.length === 0) {
            const textContent = this.extractTextContent(data);
            if (textContent) {
                items.push(textContent);
            }
        }

        return items;
    }

    private renderContentItem(item: string, format: 'html' | 'text' | 'markdown'): string {
        switch (format) {
            case 'html':
                return `<div class="recognized-item">${this.renderMathAsHTML(item)}</div>`;
            case 'text':
                return this.stripMarkdown(item);
            case 'markdown':
                return item; // Keep markdown as-is for processing
            default:
                return item;
        }
    }

    private renderMathAsHTML(content: string): string {
        // Unified math rendering for HTML output
        let result = content;

        // Handle display math $$...$$
        result = result.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
            try {
                const mathHtml = marked.parse(`$$${math}$$`) as string;
                return mathHtml.replace(/<p>|<\/p>/g, '').trim();
            } catch {
                return `<span class="math-display">${this.escapeHtml(`$$${math}$$`)}</span>`;
            }
        });

        // Handle inline math $...$
        result = result.replace(/\$([^$]+)\$/g, (match, math) => {
            try {
                const mathHtml = marked.parse(`$${math}$`) as string;
                return mathHtml.replace(/<p>|<\/p>/g, '').trim();
            } catch {
                return `<span class="math-inline">${this.escapeHtml(`$${math}$`)}</span>`;
            }
        });

        // Handle line breaks
        result = result.replace(/\n/g, '<br>');

        return result;
    }

    private stripMarkdown(content: string): string {
        // Simple markdown stripping for text output
        return content
            .replace(/#{1,6}\s*/g, '') // Headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*(.*?)\*/g, '$1') // Italic
            .replace(/`(.*?)`/g, '$1') // Code
            .replace(/^\s*[-*+]\s+/gm, '') // Lists
            .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
            .replace(/!\[([^\]]+)\]\([^\)]+\)/g, '$1') // Images
            .trim();
    }


    private extractTextContent(data: any): string {
        // Handle null/undefined
        if (data == null) return '';

        // Handle strings directly
        if (typeof data === 'string') return data;

        // Handle numbers and booleans
        if (typeof data === 'number' || typeof data === 'boolean') return String(data);

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.extractTextContent(item)).join('\n');
        }

        // Handle objects - try to find meaningful text fields
        if (typeof data === 'object') {
            // Use the same field priority as extractContentItems
            const textFields = ['verbose_data', 'recognized_data', 'content', 'text', 'message', 'result', 'response', 'data'];

            for (const field of textFields) {
                if (data[field] != null) {
                    const content = this.extractTextContent(data[field]);
                    if (content) return content;
                }
            }

            // If no meaningful text fields found, stringify as JSON
            try {
                return JSON.stringify(data, null, 2);
            } catch {
                return '[Complex Object]';
            }
        }

        // Fallback
        return String(data);
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Legacy method for backward compatibility
    private addToHistory(prompt: string, result: string, ok: boolean): void {
        // This method is kept for backward compatibility but the actual history
        // is now managed by the execution core and action history store
        console.log('Legacy addToHistory called - history now managed by ActionHistory store');
    }

    private generateSessionId(): string {
        return `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private showActionHistory(container: HTMLElement): void {
        const actionEntries = actionHistory.getRecentEntries(50).filter(
            entry => entry.context.source === 'workcenter'
        );

        const modal = H`<div class="action-history-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Action History</h3>
          <div class="modal-actions">
            <button class="btn btn-icon" data-action="export-history" title="Export History">
              <ui-icon icon="download" size="18" icon-style="duotone"></ui-icon>
            </button>
            <button class="btn btn-icon" data-action="clear-history" title="Clear History">
              <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
            </button>
            <button class="btn" data-action="close-modal">Close</button>
          </div>
        </div>

        <div class="history-stats">
          ${(() => {
            const stats = actionHistory.getStats();
            return H`
              <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Actions</div>
              </div>
              <div class="stat-card">
                <div class="stat-value success">${stats.completed}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value error">${stats.failed}</div>
                <div class="stat-label">Failed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.byAction['recognize'] || 0}</div>
                <div class="stat-label">Recognitions</div>
              </div>
            `;
          })()}
        </div>

        <div class="history-filters">
          <select class="filter-select" data-filter="status">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
          <select class="filter-select" data-filter="action">
            <option value="">All Actions</option>
            <option value="recognize">Recognize</option>
            <option value="analyze">Analyze</option>
            <option value="process">Process</option>
          </select>
        </div>

        <div class="action-history-list">
          ${actionEntries.length === 0 ? H`<div class="no-history">No actions found</div>` :
            actionEntries.map(entry => H`<div class="action-history-item ${entry.status}">
              <div class="action-header">
                <div class="action-meta">
                  <span class="action-status ${entry.status}">${this.getStatusIcon(entry.status)}</span>
                  <span class="action-type">${entry.action}</span>
                  <span class="action-time">${this.formatTimeAgo(entry.timestamp)}</span>
                  ${entry.result?.processingTime ? H`<span class="action-duration">${Math.round(entry.result.processingTime / 1000)}s</span>` : ''}
                </div>
                <div class="action-actions">
                  ${entry.result ? H`<button class="btn small" data-restore-action="${entry.id}">Use Result</button>` : ''}
                  <button class="btn small" data-view-details="${entry.id}">Details</button>
                </div>
              </div>

              <div class="action-content">
                <div class="input-preview">
                  <strong>Input:</strong>
                  ${entry.input.files?.length ?
                    `${entry.input.files.length} file(s): ${entry.input.files.map(f => f.name).join(', ')}` :
                    entry.input.text?.substring(0, 100) || 'No input'
                  }
                  ${entry.input.text && entry.input.text.length > 100 ? '...' : ''}
                </div>

                ${entry.result ? H`<div class="result-preview">
                  <strong>Result:</strong>
                  <div class="result-content">${entry.result.content.substring(0, 200)}${entry.result.content.length > 200 ? '...' : ''}</div>
                </div>` : ''}

                ${entry.error ? H`<div class="error-preview">
                  <strong>Error:</strong> ${entry.error}
                </div>` : ''}
              </div>
            </div>`)}
        </div>
      </div>
    </div>` as HTMLElement;

        // Add event listeners
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const action = target.getAttribute('data-action') || target.closest('[data-action]')?.getAttribute('data-action');
            const entryId = target.getAttribute('data-restore-action') || target.getAttribute('data-view-details');

            if (action === 'close-modal') {
                modal.remove();
            } else if (action === 'export-history') {
                this.exportActionHistory();
            } else if (action === 'clear-history') {
                if (confirm('Are you sure you want to clear all action history?')) {
                    actionHistory.clearEntries();
                    modal.remove();
                    this.updateRecentHistory(container);
                }
            } else if (entryId) {
                const entry = actionHistory.getEntry(entryId);
                if (entry) {
                    if (target.hasAttribute('data-restore-action') && entry.result) {
                        // Restore result to output
                        const outputContent = container.querySelector('[data-output]') as HTMLElement;
                        const formattedResult = this.formatResult(entry.result, this.state.outputFormat);
                        outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
                        this.state.lastRawResult = entry.result.rawData;
                        modal.remove();
                    } else if (target.hasAttribute('data-view-details')) {
                        this.showActionDetails(entry);
                    }
                }
            }
        });

        // Add filter listeners
        modal.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', () => this.applyHistoryFilters(modal));
        });

        container.append(modal);
    }

    private getStatusIcon(status: ActionEntry['status']): string {
        switch (status) {
            case 'completed': return '✓';
            case 'failed': return '✗';
            case 'processing': return '⟳';
            case 'pending': return '⏳';
            case 'cancelled': return '⊗';
            default: return '?';
        }
    }

    private formatTimeAgo(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    private applyHistoryFilters(modal: HTMLElement): void {
        const statusFilter = (modal.querySelector('[data-filter="status"]') as HTMLSelectElement).value;
        const actionFilter = (modal.querySelector('[data-filter="action"]') as HTMLSelectElement).value;

        const items = modal.querySelectorAll('.action-history-item');
        items.forEach(item => {
            const status = item.classList[1]; // Second class is status
            const action = item.querySelector('.action-type')?.textContent || '';

            const statusMatch = !statusFilter || status === statusFilter;
            const actionMatch = !actionFilter || action === actionFilter;

            (item as HTMLElement).style.display = statusMatch && actionMatch ? 'block' : 'none';
        });
    }

    private exportActionHistory(): void {
        const data = actionHistory.exportEntries('json');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `action-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.append(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    private showActionDetails(entry: ActionEntry): void {
        const modal = H`<div class="action-details-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Action Details</h3>
          <button class="btn" data-action="close-modal">Close</button>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <label>ID:</label>
            <span>${entry.id}</span>
          </div>
          <div class="detail-item">
            <label>Timestamp:</label>
            <span>${new Date(entry.timestamp).toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Source:</label>
            <span>${entry.context.source}</span>
          </div>
          <div class="detail-item">
            <label>Action:</label>
            <span>${entry.action}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-${entry.status}">${entry.status}</span>
          </div>
          ${entry.result?.processingTime ? H`<div class="detail-item">
            <label>Processing Time:</label>
            <span>${Math.round(entry.result.processingTime / 1000)}s</span>
          </div>` : ''}
        </div>

        <div class="details-section">
          <h4>Input</h4>
          <div class="input-details">
            <div>Type: ${entry.input.type}</div>
            ${entry.input.files ? H`<div>Files: ${entry.input.files.map(f => f.name).join(', ')}</div>` : ''}
            ${entry.input.text ? H`<div>Text: <pre>${entry.input.text}</pre></div>` : ''}
          </div>
        </div>

        ${entry.result ? H`<div class="details-section">
          <h4>Result</h4>
          <div class="result-details">
            <div>Type: ${entry.result.type}</div>
            <div>Auto Copied: ${entry.result.autoCopied ? 'Yes' : 'No'}</div>
            <div>Content: <pre>${entry.result.content}</pre></div>
          </div>
        </div>` : ''}

        ${entry.error ? H`<div class="details-section">
          <h4>Error</h4>
          <div class="error-details">${entry.error}</div>
        </div>` : ''}
      </div>
    </div>` as HTMLElement;

        modal.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).getAttribute('data-action') === 'close-modal') {
                modal.remove();
            }
        });

        document.body.append(modal);
    }

    private async copyResults(container: HTMLElement): Promise<void> {
        let textToCopy = '';

        // For Auto format, determine what content to copy based on detected type
        if (this.state.outputFormat === 'auto' && this.state.lastRawResult) {
            const rawData = this.state.lastRawResult?.rawData || this.state.lastRawResult;
            let data = extractJSONFromAIResponse<any>(rawData)?.data || rawData;

            // If data is a string that looks like JSON, parse it
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && typeof parsed === 'object') {
                        data = parsed;
                    }
                } catch {
                    // Keep as string if not valid JSON
                }
            }

            // For structured AI data, copy the extracted content
            if (data && typeof data === 'object' && (
                data.recognized_data || data.verbose_data
            )) {
                const contentItems: string[] = [];

                if (data.recognized_data) {
                    const recognized = Array.isArray(data.recognized_data)
                        ? data.recognized_data
                        : [data.recognized_data];
                    contentItems.push(...recognized.map((item: any) => String(item)));
                }

                if (data.verbose_data) {
                    contentItems.push(String(data.verbose_data));
                }

                textToCopy = contentItems.join('\n\n');
            } else {
                // For other data, use normalized content
                const normalizedData = this.normalizeResultData(this.state.lastRawResult);
                const contentItems = this.extractContentItems(normalizedData);
                textToCopy = contentItems.join('\n\n');
            }
        }
        // For Markdown and HTML formats, copy raw unparsed content
        else if ((this.state.outputFormat === 'markdown' || this.state.outputFormat === 'html') && this.state.lastRawResult) {
            const normalizedData = this.normalizeResultData(this.state.lastRawResult);
            const contentItems = this.extractContentItems(normalizedData);
            textToCopy = contentItems.join('\n\n');
        }
        // For JSON format, copy unwrapped content (not the JSON structure)
        else if (this.state.outputFormat === 'json' && this.state.lastRawResult) {
            const normalizedData = this.normalizeResultData(this.state.lastRawResult);
            const contentItems = this.extractContentItems(normalizedData);
            textToCopy = contentItems.join('\n\n');
        }
        // For text format or fallback, use rendered content
        else {
            const outputContent = container.querySelector('[data-output]') as HTMLElement;
            textToCopy = outputContent.textContent || '';
        }

        if (textToCopy.trim()) {
            const { writeText } = await import("@rs-frontend/shared/Clipboard");
            await writeText(textToCopy.trim());
            this.deps.showMessage('Results copied to clipboard');
        }
    }

    private clearResults(container: HTMLElement): void {
        const outputContent = container.querySelector('[data-output]') as HTMLElement;
        outputContent.innerHTML = '<div class="empty-results">Results cleared</div>';
        this.state.lastRawResult = null;
        // Don't clear recognized content here as it might be useful for subsequent actions
    }

    private clearRecognizedData(): void {
        this.state.recognizedData = null;
        this.state.processedData = null;
        this.state.currentProcessingStep = 0;
    }

    private revokeAllPreviewUrls(): void {
        try {
            for (const f of this.state.files) {
                this.revokePreviewUrl(f);
            }
        } catch {
            // ignore
        }
    }

    private determineRecognizedFormat(content: string, isTextFile: boolean): 'markdown' | 'html' | 'text' | 'json' | 'xml' | 'other' {
        if (isTextFile) {
            // For text files, try to detect format from content
            const trimmed = content.trim();

            // Check for JSON
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                    JSON.parse(trimmed);
                    return 'json';
                } catch {
                    // Not valid JSON
                }
            }

            // Check for HTML
            if (trimmed.includes('<') && trimmed.includes('>') && /<\/?[a-z][\s\S]*>/i.test(trimmed)) {
                return 'html';
            }

            // Check for XML
            if (trimmed.includes('<?xml') || trimmed.includes('<') && /<\/[a-z]/i.test(trimmed)) {
                return 'xml';
            }

            // Default to markdown for text files (can contain markdown)
            return 'markdown';
        } else {
            // For images and other files, default to markdown
            return 'markdown';
        }
    }

    private updateDataPipeline(container: HTMLElement): void {
        const pipelineSection = container.querySelector('.data-pipeline-section');
        if (pipelineSection) {
            pipelineSection.remove();
        }

        if (this.state.recognizedData || (this.state.processedData && this.state.processedData.length > 0)) {
            // Re-render the pipeline section
            const mainPanel = container.querySelector('.main-panel');
            if (mainPanel) {
                const pipelineHTML = H`<div class="data-pipeline-section">
                    <div class="pipeline-header">
                      <h3>Data Processing Pipeline</h3>
                      <div class="pipeline-actions">
                        <button class="btn btn-icon" data-action="clear-pipeline" title="Clear all data">
                          <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                        </button>
                      </div>
                    </div>
                    <div class="pipeline-steps">
                      ${this.state.recognizedData ? H`<div class="pipeline-step recognized-step">
                        <div class="step-header">
                          <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                          <span class="step-title">Recognized Data</span>
                          <span class="step-time">${new Date(this.state.recognizedData.timestamp).toLocaleTimeString()}</span>
                          <span class="step-source">${this.state.recognizedData.source}</span>
                          <span class="step-format">${this.state.recognizedData.recognizedAs}</span>
                          <span class="step-format">${this.state.recognizedData.recognizedAs}</span>
                          <span class="step-format">${this.state.recognizedData.recognizedAs}</span>
                        </div>
                        <div class="step-content">
                          <div class="step-preview">${this.state.recognizedData.content.substring(0, 100)}${this.state.recognizedData.content.length > 100 ? '...' : ''}</div>
                        </div>
                      </div>` : ''}

                      ${this.state.processedData ? this.state.processedData.map((step, index) => H`<div class="pipeline-step processed-step">
                        <div class="step-header">
                          <ui-icon icon="cogs" size="16" icon-style="duotone"></ui-icon>
                          <span class="step-title">Step ${index + 1}: ${step.action}</span>
                          <span class="step-time">${new Date(step.timestamp).toLocaleTimeString()}</span>
                          <button class="btn small" data-restore-step="${index}">Use Result</button>
                        </div>
                        <div class="step-content">
                          <div class="step-preview">${step.content.substring(0, 100)}${step.content.length > 100 ? '...' : ''}</div>
                        </div>
                      </div>`) : ''}
                    </div>
                  </div>`;
                mainPanel.appendChild(pipelineHTML);
            }
        }
    }

    private showTemplateEditor(container: HTMLElement): void {
        const modal = H`<div class="template-editor-modal">
      <div class="modal-content">
        <h3>Prompt Templates</h3>
        <div class="template-list">
          ${this.state.promptTemplates.map((template, index) =>
            H`<div class="template-item">
              <input type="text" class="template-name" value="${template.name}" data-index="${index}">
              <textarea class="template-prompt" data-index="${index}">${template.prompt}</textarea>
              <button class="btn small remove-template" data-index="${index}">Remove</button>
            </div>`
        )}
        </div>
        <div class="modal-actions">
          <button class="btn" data-action="add-template">Add Template</button>
          <button class="btn primary" data-action="save-templates">Save</button>
          <button class="btn" data-action="close-editor">Close</button>
        </div>
      </div>
    </div>` as HTMLElement;

        // Template editor events
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const action = target.getAttribute('data-action');
            const index = target.getAttribute('data-index');

            if (action === 'add-template') {
                this.state.promptTemplates.push({ name: 'New Template', prompt: 'Enter your prompt here...' });
                modal.remove();
                this.showTemplateEditor(container);
            } else if (action === 'save-templates') {
                // Update templates from inputs
                const nameInputs = modal.querySelectorAll('.template-name');
                const promptInputs = modal.querySelectorAll('.template-prompt');

                this.state.promptTemplates = Array.from(nameInputs).map((input, i) => ({
                    name: (input as HTMLInputElement).value,
                    prompt: (promptInputs[i] as HTMLTextAreaElement).value
                }));

                this.savePromptTemplates();
                modal.remove();
                // Refresh template select
                this.updateTemplateSelect(container);
            } else if (action === 'close-editor') {
                modal.remove();
            } else if (target.classList.contains('remove-template') && index) {
                this.state.promptTemplates.splice(parseInt(index), 1);
                modal.remove();
                this.showTemplateEditor(container);
            }
        });

        container.append(modal);
    }

    private updateTemplateSelect(container: HTMLElement): void {
        const templateSelect = container.querySelector('.template-select') as HTMLSelectElement;
        const currentValue = templateSelect.value;

        templateSelect.innerHTML = '<option value="">Select Template...</option>' +
            this.state.promptTemplates.map(t =>
                `<option value="${t.prompt.replace(/"/g, '&quot;')}" ${this.state.selectedTemplate === t.prompt ? 'selected' : ''}>${t.name}</option>`
            ).join('');

        // Restore the selected value if it still exists, otherwise keep current
        if (this.state.selectedTemplate && this.state.promptTemplates.some(t => t.prompt === this.state.selectedTemplate)) {
            templateSelect.value = this.state.selectedTemplate;
        } else {
        templateSelect.value = currentValue;
        }
    }

    private getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType === 'application/pdf') return '📄';
        if (mimeType.includes('json')) return '📋';
        if (mimeType.includes('text') || mimeType.includes('markdown')) return '📝';
        return '📄';
    }

    private createFileIconElement(mimeType: string): HTMLElement {
        const iconName = this.getFileIconName(mimeType);
        return H`<ui-icon icon="${iconName}" size="20" icon-style="duotone" class="file-type-icon"></ui-icon>` as HTMLElement;
    }

    private getFileIconName(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType === 'application/pdf') return 'file-pdf';
        if (mimeType.includes('json')) return 'file-text';
        if (mimeType.includes('text') || mimeType.includes('markdown')) return 'file-text';
        return 'file';
    }

    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private loadPromptTemplates(): { name: string, prompt: string }[] {
        const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
            if (!raw) return fallback;
            try {
                const v = JSON.parse(raw) as T;
                return v ?? fallback;
            } catch {
                return fallback;
            }
        };

        return safeJsonParse(localStorage.getItem("rs-workcenter-templates"), [
            { name: "Analyze & Extract", prompt: "Analyze the provided content and extract key information, formulas, data, and insights. Identify the main topics, recognize any mathematical expressions or equations, and provide a structured summary." },
            { name: "Solve Equations", prompt: "Find and solve any mathematical equations, problems, or calculations in the content. Show your work step-by-step and provide the final answers." },
            { name: "Generate Code", prompt: "Based on the description or requirements in the content, generate appropriate code. Include comments and explain the implementation." },
            { name: "Extract Styles", prompt: "Analyze the visual content or design description and extract/generate CSS styles, color schemes, and layout information." },
            { name: "Document Analysis", prompt: "Perform a comprehensive analysis of the document, including structure, key points, relationships, and actionable insights." },
            { name: "Data Processing", prompt: "Process and transform the provided data. Extract structured information, identify patterns, and present results in a clear format." }
        ]);
    }

    private savePromptTemplates(): void {
        try {
            localStorage.setItem("rs-workcenter-templates", JSON.stringify(this.state.promptTemplates));
        } catch (e) {
            console.warn("Failed to save prompt templates:", e);
        }
    }

    private saveWorkCenterState(): void {
        try {
            const stateToSave = {
                currentPrompt: this.state.currentPrompt,
                autoAction: this.state.autoAction,
                selectedInstruction: this.state.selectedInstruction,
                outputFormat: this.state.outputFormat,
                selectedLanguage: this.state.selectedLanguage,
                selectedTemplate: this.state.selectedTemplate,
                recognitionFormat: this.state.recognitionFormat,
                processingFormat: this.state.processingFormat,
                currentProcessingStep: this.state.currentProcessingStep,
                // Save metadata about recognized/processed data, not the full content
                recognizedData: this.state.recognizedData ? {
                    timestamp: this.state.recognizedData.timestamp,
                    source: this.state.recognizedData.source,
                    contentLength: this.state.recognizedData.content.length,
                    metadata: this.state.recognizedData.metadata
                } : null,
                processedData: this.state.processedData ? this.state.processedData.map(p => ({
                    timestamp: p.timestamp,
                    action: p.action,
                    contentLength: p.content.length,
                    metadata: p.metadata
                })) : null,
                // Don't save files, voiceRecording, or full content
            };
            localStorage.setItem("rs-workcenter-state", JSON.stringify(stateToSave));
        } catch (e) {
            console.warn("Failed to save workcenter state:", e);
        }
    }

    private loadWorkCenterState(): Partial<WorkCenterState> {
        try {
            const saved = localStorage.getItem("rs-workcenter-state");
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    currentPrompt: parsed.currentPrompt || "",
                    autoAction: parsed.autoAction || false,
                    selectedInstruction: parsed.selectedInstruction || "",
                    outputFormat: parsed.outputFormat || "auto",
                    selectedLanguage: parsed.selectedLanguage || "auto",
                    selectedTemplate: parsed.selectedTemplate || "",
                    recognitionFormat: parsed.recognitionFormat || "auto",
                    processingFormat: parsed.processingFormat || "markdown",
                    currentProcessingStep: parsed.currentProcessingStep || 0,
                    // Don't restore full content, just metadata
                };
            }
        } catch (e) {
            console.warn("Failed to load workcenter state:", e);
        }
        return {};
    }
}