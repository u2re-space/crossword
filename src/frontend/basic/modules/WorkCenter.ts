import { H } from "fest/lure";
import { recognizeByInstructions } from "@rs-core/service/AI-ops/RecognizeData";
import { UIPhosphorIcon } from "fest/icon";
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import DOMPurify from "isomorphic-dompurify";
import { extractJSONFromAIResponse } from "@rs-core/utils/AIResponseParser";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";

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
    outputFormat: "markdown" | "json" | "text" | "html";
    selectedLanguage: "auto" | "en" | "ru"; // Language selection for AI responses
    voiceRecording: boolean;
    promptTemplates: { name: string, prompt: string }[];
    lastRawResult: any; // Store raw result for copying unparsed content
    recognizedContent: string | null; // Store recognized text content from files
    contentSource: 'files' | 'recognized' | null; // Track what's being processed
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

    constructor(dependencies: WorkCenterDependencies) {
        this.deps = dependencies;
        this.state = {
            files: [],
            selectedFiles: [],
            currentPrompt: "",
            autoAction: false,
            selectedInstruction: "",
            outputFormat: "markdown",
            selectedLanguage: "auto",
            voiceRecording: false,
            promptTemplates: this.loadPromptTemplates(),
            lastRawResult: null,
            recognizedContent: null,
            contentSource: null
        };
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
              ${this.state.recognizedContent ? H`<div class="recognized-status">
                <ui-icon icon="check-circle" size="16" icon-style="duotone" class="status-icon"></ui-icon>
                <span>Content recognized - ready for actions</span>
                <button class="btn small clear-recognized" data-action="clear-recognized">Clear</button>
              </div>` : ''}
            </div>

            <div class="prompt-input-group" data-dropzone>
              <div class="prompt-controls">
                <select class="template-select">
                  <option value="">Select Template...</option>
                  ${this.state.promptTemplates.map(t => H`<option value="${t.prompt}">${t.name}</option>`)}
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
                <ui-icon icon="zap" size="20" icon-style="duotone"></ui-icon>
              </label>
            </div>
          </div>

          <div class="history-section">
            <div class="history-header">
              <h3>Recent Activity</h3>
              <button class="btn" data-action="view-full-history">View All History</button>
            </div>
            <div class="recent-history" data-recent-history></div>
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
        fileInput.addEventListener('change', (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            this.state.files.push(...files);
            this.clearRecognizedContent(); // Clear cached content when files change
            this.updateFileList(container);
            this.updateFileCounter(container);
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
            this.clearRecognizedContent(); // Clear cached content when files change
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
                this.clearRecognizedContent(); // Clear cached content when files change
                this.updateFileList(container);
                this.updateFileCounter(container);
            }
        });

        // Template selection
        const templateSelect = container.querySelector('.template-select') as HTMLSelectElement;
        templateSelect.addEventListener('change', () => {
            const selectedPrompt = templateSelect.value;
            if (selectedPrompt) {
                this.state.currentPrompt = selectedPrompt;
                this.updatePromptInput(container);
            }
        });

        // Prompt input
        const promptInput = container.querySelector('.prompt-input') as HTMLTextAreaElement;
        promptInput.addEventListener('input', () => {
            this.state.currentPrompt = promptInput.value;
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
            const newFormat = formatSelect.value as "markdown" | "json" | "text" | "html";
            this.state.outputFormat = newFormat;

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
            // Language change doesn't need re-rendering since it affects future AI calls
        });

        // Auto action checkbox
        const autoCheckbox = container.querySelector('.auto-action-checkbox') as HTMLInputElement;
        autoCheckbox.addEventListener('change', () => {
            this.state.autoAction = autoCheckbox.checked;
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
                    case 'execute':
                        await this.executeUnifiedAction(container);
                        break;
                    case 'clear-recognized':
                        this.clearRecognizedContent();
                        // Update the UI to remove the recognized status
                        const statusElement = container.querySelector('.recognized-status');
                        if (statusElement) {
                            statusElement.remove();
                        }
                        break;
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
            const fileItem = H`<div class="file-item">
        <div class="file-info">
          <span class="file-icon">${this.createFileIconElement(file.type)}</span>
          <span class="file-name">${file.name}</span>
          <span class="file-size">(${this.formatFileSize(file.size)})</span>
        </div>
        <button class="btn small remove-btn" data-remove="${index}">✕</button>
      </div>` as HTMLElement;

            fileItem.querySelector('.remove-btn')?.addEventListener('click', () => {
                this.state.files.splice(index, 1);
                this.clearRecognizedContent(); // Clear cached content when files change
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

        const recentItems = this.deps.history.slice(-3).reverse();
        if (recentItems.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No recent activity</div>';
            return;
        }

        recentItems.forEach(item => {
            const historyItem = H`<div class="history-item-compact">
        <div class="history-meta">
          <span class="history-status ${item.ok ? 'success' : 'error'}">${item.ok ? '✓' : '✗'}</span>
          <span class="history-prompt">${item.prompt.substring(0, 50)}${item.prompt.length > 50 ? '...' : ''}</span>
        </div>
        <button class="btn small" data-restore="${this.deps.history.indexOf(item)}">Use</button>
      </div>` as HTMLElement;

            historyItem.querySelector('button')?.addEventListener('click', () => {
                this.state.currentPrompt = item.prompt;
                this.updatePromptInput(container);
            });

            historyContainer.append(historyItem);
        });
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
        if (this.state.files.length === 0 && !this.state.currentPrompt.trim() && !this.state.recognizedContent) {
            this.deps.showMessage('Please select files or enter a prompt first');
            return;
        }

        const outputContent = container.querySelector('[data-output]') as HTMLElement;
        let processingMessage = 'Processing...';

        // Show what's being processed
        if (this.state.recognizedContent && this.state.contentSource === 'recognized') {
            processingMessage = 'Processing recognized content...';
        } else if (this.state.files.length > 0) {
            processingMessage = `Processing ${this.state.files.length} file${this.state.files.length > 1 ? 's' : ''}...`;
        }

        outputContent.innerHTML = `<div class="processing">${processingMessage}</div>`;

        try {
            let result;
            let prompt = this.state.currentPrompt.trim() ||
                (this.state.autoAction ? this.getLastSuccessfulPrompt() : "Analyze and process the provided content intelligently");

            // Add language instruction if specific language selected
            if (this.state.selectedLanguage !== 'auto') {
                const languageInstruction = this.state.selectedLanguage === 'ru'
                    ? "Please respond in Russian language."
                    : "Please respond in English language.";
                prompt = `${languageInstruction} ${prompt}`;
            }

            // Use recognized content if available, otherwise process files
            if (this.state.recognizedContent && this.state.contentSource === 'recognized') {
                // Use cached recognized content for faster processing
                result = await recognizeByInstructions(this.state.recognizedContent, prompt, undefined, undefined, {
                    customInstruction: prompt,
                    useActiveInstruction: !this.state.currentPrompt.trim()
                });
                this.state.contentSource = 'recognized'; // Keep using recognized content
            } else if (this.state.files.length > 0) {
                // Process files and extract content
                const fileContents = await Promise.all(
                    this.state.files.map(async (file) => {
                        if (file.type.startsWith('image/')) {
                            return file; // Images are handled specially
                        }
                        return await file.text();
                    })
                );

                // Combine file contents or process individually
                let contentToProcess: any;
                if (fileContents.length === 1) {
                    contentToProcess = fileContents[0];
                } else {
                    // For multiple files, create a combined prompt
                    contentToProcess = fileContents.map((content, i) =>
                        `File ${i + 1} (${this.state.files[i].name}):\n${content}`
                    ).join('\n\n---\n\n');
                }

                result = await recognizeByInstructions(contentToProcess, prompt, undefined, undefined, {
                    customInstruction: prompt,
                    useActiveInstruction: !this.state.currentPrompt.trim()
                });

                // Store recognized content for future use
                if (result?.ok && typeof contentToProcess === 'string') {
                    this.state.recognizedContent = contentToProcess;
                    this.state.contentSource = 'files';
                }
            } else {
                // Process text prompt only
                result = await recognizeByInstructions(prompt, "Analyze and respond to the following request", undefined, undefined, {
                    customInstruction: prompt,
                    useActiveInstruction: false
                });
            }

            // Store raw result for copying
            this.state.lastRawResult = result;

            // Format and display result
            const formattedResult = this.formatResult(result, this.state.outputFormat);
            outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;

            // Add to history
            this.addToHistory(prompt, formattedResult, true);

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputContent.innerHTML = `<div class="error">Error: ${errorMsg}</div>`;
            this.addToHistory(this.state.currentPrompt, errorMsg, false);
        }

        this.updateRecentHistory(container);
    }


    private getLastSuccessfulPrompt(): string {
        const lastSuccessful = this.deps.history.find(h => h.ok);
        return lastSuccessful?.prompt || "Process the provided content";
    }

    private formatResult(result: any, format: string): string {
        // Normalize and extract data first
        const normalizedData = this.normalizeResultData(result);
        if (!normalizedData) return '<div class="no-result">No result</div>';

        // Render based on format
        switch (format) {
            case 'json':
                return this.renderAsJSON(normalizedData);
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
            return `<pre class="json-result">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
        } catch (error) {
            return `<div class="error">Failed to format JSON: ${error}</div>`;
        }
    }

    private renderAsHTML(data: any): string {
        const content = this.extractContentItems(data);
        const renderedContent = content.map(item => this.renderContentItem(item, 'html')).join('');

        if (!renderedContent) {
            return `<div class="html-result">${this.convertMathToHTML(this.extractTextContent(data))}</div>`;
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
                return this.renderMathContent(textContent);
            }
        }

        try {
            const html = marked.parse(renderedContent) as string;
            return DOMPurify.sanitize(html);
        } catch (error) {
            console.warn('Markdown parsing failed, falling back to simple rendering:', error);
            return this.renderMathContent(renderedContent);
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

    private addToHistory(prompt: string, result: string, ok: boolean): void {
        const historyEntry = {
            ts: Date.now(),
            prompt,
            before: this.state.files.map(f => f.name).join(', ') || 'text input',
            after: result,
            ok
        };

        this.deps.history.push(historyEntry);

        // Save history
        try {
            localStorage.setItem("rs-basic-history", JSON.stringify(this.deps.history));
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    }

    private async copyResults(container: HTMLElement): Promise<void> {
        let textToCopy = '';

        // For Markdown and HTML formats, copy raw unparsed content
        if ((this.state.outputFormat === 'markdown' || this.state.outputFormat === 'html') && this.state.lastRawResult) {
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

    private clearRecognizedContent(): void {
        this.state.recognizedContent = null;
        this.state.contentSource = null;
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
                `<option value="${t.prompt.replace(/"/g, '&quot;')}">${t.name}</option>`
            ).join('');

        templateSelect.value = currentValue;
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
}