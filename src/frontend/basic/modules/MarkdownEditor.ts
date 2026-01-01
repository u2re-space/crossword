import { H } from "fest/lure";
import { BasicMarkdownView } from "../MarkdownView";

export interface MarkdownEditorOptions {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export class MarkdownEditor {
  private options: MarkdownEditorOptions;
  private editor: HTMLTextAreaElement | null = null;
  private preview: BasicMarkdownView | null = null;
  private autoSaveTimeout: number | null = null;

  constructor(options: MarkdownEditorOptions = {}) {
    this.options = {
      initialContent: "",
      placeholder: "Start writing your markdown here...",
      autoSave: true,
      autoSaveDelay: 1000,
      ...options
    };
  }

  /**
   * Render the markdown editor with live preview
   */
  render(): HTMLElement {
    const container = H`<div class="markdown-editor-container">
      <div class="editor-header">
        <h3>Markdown Editor</h3>
        <div class="editor-actions">
          <button class="btn" data-action="clear">Clear</button>
          <button class="btn primary" data-action="save">Save</button>
        </div>
      </div>

      <div class="editor-layout">
        <div class="editor-panel">
          <div class="editor-toolbar">
            <div class="toolbar-group">
              <button class="btn small" data-action="bold" title="Bold">**bold**</button>
              <button class="btn small" data-action="italic" title="Italic">*italic*</button>
              <button class="btn small" data-action="code" title="Code">\`code\`</button>
            </div>
            <div class="toolbar-group">
              <button class="btn small" data-action="link" title="Link">[link](url)</button>
              <button class="btn small" data-action="image" title="Image">![alt](url)</button>
              <button class="btn small" data-action="list" title="List">- item</button>
            </div>
            <div class="toolbar-group">
              <button class="btn small" data-action="heading" title="Heading"># Heading</button>
              <button class="btn small" data-action="quote" title="Quote">> quote</button>
              <button class="btn small" data-action="codeblock" title="Code Block">\`\`\`</button>
            </div>
          </div>

          <textarea
            class="markdown-textarea"
            placeholder="${this.options.placeholder}"
            spellcheck="false"
          >${this.options.initialContent}</textarea>

          <div class="editor-footer">
            <div class="editor-stats">
              <span class="char-count">0 characters</span>
              <span class="word-count">0 words</span>
              <span class="line-count">0 lines</span>
            </div>
            <div class="editor-mode">
              <button class="btn small active" data-mode="edit">Edit</button>
              <button class="btn small" data-mode="preview">Preview</button>
              <button class="btn small" data-mode="split">Split</button>
            </div>
          </div>
        </div>

        <div class="preview-panel">
          <div class="preview-header">
            <h4>Live Preview</h4>
          </div>
          <div class="preview-content"></div>
        </div>
      </div>
    </div>` as HTMLElement;

    // Initialize components
    this.initializeEditor(container);

    return container;
  }

  /**
   * Get current content
   */
  getContent(): string {
    return this.editor?.value || "";
  }

  /**
   * Set content
   */
  setContent(content: string): void {
    if (this.editor) {
      this.editor.value = content;
      this.updatePreview();
      this.updateStats();
    }
  }

  /**
   * Focus the editor
   */
  focus(): void {
    this.editor?.focus();
  }

  /**
   * Clear the editor
   */
  clear(): void {
    this.setContent("");
    this.options.onContentChange?.("");
  }

  /**
   * Save the content
   */
  save(): void {
    const content = this.getContent();
    this.options.onSave?.(content);
  }

  private initializeEditor(container: HTMLElement): void {
    // Get elements
    this.editor = container.querySelector('.markdown-textarea') as HTMLTextAreaElement;
    const previewContainer = container.querySelector('.preview-content') as HTMLElement;

    // Create preview component
    this.preview = document.createElement("basic-md-view") as unknown as BasicMarkdownView;
    previewContainer.append(this.preview as unknown as Node);

    // Set up event listeners
    this.setupEventListeners(container);

    // Initial state
    this.updatePreview();
    this.updateStats();
  }

  private setupEventListeners(container: HTMLElement): void {
    if (!this.editor) return;

    // Content change events
    this.editor.addEventListener('input', () => {
      this.handleContentChange();
    });

    this.editor.addEventListener('change', () => {
      this.handleContentChange();
    });

    // Keyboard shortcuts
    this.editor.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Toolbar actions
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action) {
        e.preventDefault();
        this.handleToolbarAction(action);
      }
    });

    // Mode switching
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const mode = target.getAttribute('data-mode');

      if (mode) {
        this.switchMode(mode);
      }
    });
  }

  private handleContentChange(): void {
    const content = this.getContent();
    this.updatePreview();
    this.updateStats();
    this.options.onContentChange?.(content);

    // Auto-save
    if (this.options.autoSave) {
      this.scheduleAutoSave();
    }
  }

  private handleKeyboardShortcuts(e: KeyboardEvent): void {
    // Ctrl+S for save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.save();
      return;
    }

    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      this.insertText('\t');
      return;
    }

    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      this.handleToolbarAction('bold');
      return;
    }

    // Ctrl+I for italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      this.handleToolbarAction('italic');
      return;
    }
  }

  private handleToolbarAction(action: string): void {
    const textarea = this.editor;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';

    switch (action) {
      case 'bold':
        replacement = selectedText ? `**${selectedText}**` : '**bold text**';
        break;
      case 'italic':
        replacement = selectedText ? `*${selectedText}*` : '*italic text*';
        break;
      case 'code':
        replacement = selectedText ? `\`${selectedText}\`` : '`code`';
        break;
      case 'link':
        replacement = selectedText ? `[${selectedText}](url)` : '[link text](url)';
        break;
      case 'image':
        replacement = selectedText ? `![${selectedText}](image-url)` : '![alt text](image-url)';
        break;
      case 'list':
        replacement = selectedText ? `- ${selectedText}` : '- list item';
        break;
      case 'heading':
        replacement = selectedText ? `# ${selectedText}` : '# Heading';
        break;
      case 'quote':
        replacement = selectedText ? `> ${selectedText}` : '> quote';
        break;
      case 'codeblock':
        replacement = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : '```\ncode block\n```';
        break;
      case 'clear':
        this.clear();
        return;
      case 'save':
        this.save();
        return;
    }

    if (replacement) {
      this.insertText(replacement, start, end);
    }
  }

  private insertText(text: string, start?: number, end?: number): void {
    const textarea = this.editor;
    if (!textarea) return;

    const currentStart = start ?? textarea.selectionStart;
    const currentEnd = end ?? textarea.selectionEnd;

    textarea.setRangeText(text, currentStart, currentEnd, 'end');
    textarea.focus();

    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private switchMode(mode: string): void {
    const container = this.editor?.closest('.markdown-editor-container');
    if (!container) return;

    const editorPanel = container.querySelector('.editor-panel') as HTMLElement;
    const previewPanel = container.querySelector('.preview-panel') as HTMLElement;
    const modeButtons = container.querySelectorAll('[data-mode]');

    // Reset active states
    modeButtons.forEach(btn => btn.classList.remove('active'));

    // Set active button
    const activeButton = container.querySelector(`[data-mode="${mode}"]`) as HTMLElement;
    activeButton?.classList.add('active');

    // Update layout
    switch (mode) {
      case 'edit':
        editorPanel.style.display = 'block';
        previewPanel.style.display = 'none';
        this.editor?.focus();
        break;
      case 'preview':
        editorPanel.style.display = 'none';
        previewPanel.style.display = 'block';
        break;
      case 'split':
        editorPanel.style.display = 'block';
        previewPanel.style.display = 'block';
        this.editor?.focus();
        break;
    }
  }

  private updatePreview(): void {
    if (this.preview && this.editor) {
      this.preview.setMarkdown(this.editor.value);
    }
  }

  private updateStats(): void {
    const container = this.editor?.closest('.markdown-editor-container');
    if (!container || !this.editor) return;

    const content = this.editor.value;
    const charCount = content.length;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lineCount = content.split('\n').length;

    const charCountEl = container.querySelector('.char-count') as HTMLElement;
    const wordCountEl = container.querySelector('.word-count') as HTMLElement;
    const lineCountEl = container.querySelector('.line-count') as HTMLElement;

    if (charCountEl) charCountEl.textContent = `${charCount} characters`;
    if (wordCountEl) wordCountEl.textContent = `${wordCount} words`;
    if (lineCountEl) lineCountEl.textContent = `${lineCount} lines`;
  }

  private scheduleAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = window.setTimeout(() => {
      this.save();
    }, this.options.autoSaveDelay);
  }
}

/**
 * Create a markdown editor instance
 */
export function createMarkdownEditor(options?: MarkdownEditorOptions): MarkdownEditor {
  return new MarkdownEditor(options);
}