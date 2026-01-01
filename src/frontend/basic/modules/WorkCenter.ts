import { H } from "fest/lure";
import { recognizeByInstructions, solveAndAnswer, writeCode, extractCSS } from "@rs-core/service/AI-ops/RecognizeData";

export interface WorkCenterState {
  files: File[];
  selectedFiles: File[];
  currentPrompt: string;
  autoAction: boolean;
  selectedInstruction: string;
  outputFormat: "markdown" | "json" | "text" | "html";
  voiceRecording: boolean;
  promptTemplates: {name: string, prompt: string}[];
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
      voiceRecording: false,
      promptTemplates: this.loadPromptTemplates()
    };
  }

  getState(): WorkCenterState {
    return this.state;
  }

  renderWorkCenterView(): HTMLElement {
    const container = H`<div class="workcenter-view">
      <div class="workcenter-header">
        <h2>AI Work Center</h2>
        <div class="format-selector">
          <label>Output Format:</label>
          <select class="format-select">
            <option value="markdown" selected>Markdown</option>
            <option value="json">JSON</option>
            <option value="text">Plain Text</option>
            <option value="html">HTML</option>
          </select>
        </div>
      </div>

      <div class="workcenter-content">
        <div class="left-panel">
          <div class="input-section">
            <div class="file-input-area" data-dropzone>
              <div class="file-drop-zone">
                <div class="drop-zone-content">
                  <div class="drop-icon">📁</div>
                  <div class="drop-text">Drop files here or click to browse</div>
                  <div class="drop-hint">Supports: Images, Documents, Text files, PDFs</div>
                  <button class="btn file-select-btn" data-action="select-files">Choose Files</button>
                </div>
              </div>
              <div class="file-list" data-file-list></div>
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

        <div class="right-panel">
          <div class="output-section">
            <div class="output-header">
              <h3>Results</h3>
              <div class="output-actions">
                <button class="btn" data-action="copy-results">📋 Copy</button>
                <button class="btn" data-action="clear-results">🗑️ Clear</button>
              </div>
            </div>
            <div class="output-content" data-output></div>
          </div>

          <div class="prompt-section">
            <div class="prompt-input-group">
              <div class="prompt-controls">
                <select class="template-select">
                  <option value="">Select Template...</option>
                  ${this.state.promptTemplates.map(t => H`<option value="${t.prompt}">${t.name}</option>`)}
                </select>
                <button class="btn icon-btn" data-action="edit-templates" title="Edit Templates">⚙️</button>
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
              <label class="auto-action-label">
                <input type="checkbox" class="auto-action-checkbox" ${this.state.autoAction ? 'checked' : ''}>
                Auto-action (use last successful)
              </label>
              <div class="action-buttons">
                <button class="btn primary action-btn" data-action="recognize">🔍 Recognize</button>
                <button class="btn primary action-btn" data-action="analyze">📊 Analyze</button>
                <button class="btn primary action-btn" data-action="solve">🧮 Solve</button>
                <button class="btn primary action-btn" data-action="code">💻 Code</button>
                <button class="btn primary action-btn" data-action="css">🎨 CSS</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>` as HTMLElement;

    // Set up event listeners
    this.setupWorkCenterEvents(container);

    // Update file list and recent history
    this.updateFileList(container);
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
      this.updateFileList(container);
    });

    // Drag and drop
    const dropZone = container.querySelector('[data-dropzone]') as HTMLElement;
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer?.files || []);
      this.state.files.push(...files);
      this.updateFileList(container);
    });

    // Paste support
    container.addEventListener('paste', (e) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length > 0) {
        e.preventDefault();
        this.state.files.push(...files);
        this.updateFileList(container);
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
        case 'recognize':
        case 'analyze':
        case 'solve':
        case 'code':
        case 'css':
          await this.executeAction(container, action);
          break;
      }
    });
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
          <span class="file-icon">${this.getFileIcon(file.type)}</span>
          <span class="file-name">${file.name}</span>
          <span class="file-size">(${this.formatFileSize(file.size)})</span>
        </div>
        <button class="btn small remove-btn" data-remove="${index}">✕</button>
      </div>` as HTMLElement;

      fileItem.querySelector('.remove-btn')?.addEventListener('click', () => {
        this.state.files.splice(index, 1);
        this.updateFileList(container);
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

  private async executeAction(container: HTMLElement, action: string): Promise<void> {
    if (this.state.files.length === 0 && !this.state.currentPrompt.trim()) {
      this.deps.showMessage('Please select files or enter a prompt first');
      return;
    }

    const outputContent = container.querySelector('[data-output]') as HTMLElement;
    outputContent.innerHTML = '<div class="processing">Processing...</div>';

    try {
      let result;

      // Determine which AI function to call based on action
      const aiFunction = this.getAIFunction(action);
      const prompt = this.state.currentPrompt.trim() ||
        (this.state.autoAction ? this.getLastSuccessfulPrompt() : "Process the provided content");

      if (this.state.files.length > 0) {
        // Process files
        const fileContents = await Promise.all(
          this.state.files.map(async (file) => {
            if (file.type.startsWith('image/')) {
              return file; // Images are handled specially
            }
            return await file.text();
          })
        );

        // Combine file contents or process individually
        if (fileContents.length === 1) {
          result = await aiFunction(fileContents[0], {
            customInstruction: prompt,
            useActiveInstruction: !this.state.currentPrompt.trim()
          });
        } else {
          // For multiple files, create a combined prompt
          const combinedContent = fileContents.map((content, i) =>
            `File ${i + 1} (${this.state.files[i].name}):\n${content}`
          ).join('\n\n---\n\n');

          result = await aiFunction(combinedContent, {
            customInstruction: prompt,
            useActiveInstruction: !this.state.currentPrompt.trim()
          });
        }
      } else {
        // Process text prompt only
        result = await aiFunction(prompt, {
          customInstruction: this.state.currentPrompt,
          useActiveInstruction: false
        });
      }

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

  private getAIFunction(action: string): any {
    switch (action) {
      case 'recognize': return recognizeByInstructions;
      case 'analyze': return recognizeByInstructions; // Could use different function
      case 'solve': return solveAndAnswer;
      case 'code': return writeCode;
      case 'css': return extractCSS;
      default: return recognizeByInstructions;
    }
  }

  private getLastSuccessfulPrompt(): string {
    const lastSuccessful = this.deps.history.find(h => h.ok);
    return lastSuccessful?.prompt || "Process the provided content";
  }

  private formatResult(result: any, format: string): string {
    if (!result?.data) return 'No result';

    switch (format) {
      case 'json':
        try {
          return `<pre><code>${JSON.stringify(result.data, null, 2)}</code></pre>`;
        } catch {
          return String(result.data);
        }
      case 'html':
        return String(result.data).replace(/\n/g, '<br>');
      case 'text':
        return `<pre>${String(result.data)}</pre>`;
      case 'markdown':
      default:
        return String(result.data);
    }
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
    const outputContent = container.querySelector('[data-output]') as HTMLElement;
    const text = outputContent.textContent || '';
    if (text) {
      const { writeText } = await import("@rs-frontend/shared/Clipboard");
      await writeText(text);
      this.deps.showMessage('Results copied to clipboard');
    }
  }

  private clearResults(container: HTMLElement): void {
    const outputContent = container.querySelector('[data-output]') as HTMLElement;
    outputContent.innerHTML = '<div class="empty-results">Results cleared</div>';
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

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private loadPromptTemplates(): {name: string, prompt: string}[] {
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
      { name: "Recognize Content", prompt: "Recognize and extract information from the provided content" },
      { name: "Analyze Document", prompt: "Analyze this document and provide a summary with key insights" },
      { name: "Solve Problems", prompt: "Solve any equations, problems, or questions in the content" },
      { name: "Generate Code", prompt: "Generate code based on the requirements or description provided" },
      { name: "Extract CSS", prompt: "Extract or generate CSS from the content or images" }
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