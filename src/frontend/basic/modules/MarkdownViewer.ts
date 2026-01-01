import { H } from "fest/lure";
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import DOMPurify from "isomorphic-dompurify";

// Configure marked with KaTeX extension
marked?.use?.(markedKatex({ throwOnError: false, nonStandard: true, output: "mathml", strict: false }) as unknown as MarkedExtension);

export interface MarkdownViewerOptions {
  content?: string;
  title?: string;
  showTitle?: boolean;
  showActions?: boolean;
  onCopy?: (content: string) => void;
  onDownload?: (content: string) => void;
}

export class MarkdownViewer {
  private options: MarkdownViewerOptions;
  private view: any = null;
  private content: string = "";

  constructor(options: MarkdownViewerOptions = {}) {
    this.options = {
      content: "",
      title: "Markdown Viewer",
      showTitle: true,
      showActions: true,
      ...options
    };
    this.content = this.options.content || "";
  }

  /**
   * Render the markdown viewer
   */
  render(): HTMLElement {
    const container = H`<div class="markdown-viewer-container">
      ${this.options.showTitle ? H`<div class="viewer-header">
        <h3>${this.options.title}</h3>
        ${this.options.showActions ? H`<div class="viewer-actions">
          <button class="btn" data-action="copy" title="Copy content">📋 Copy</button>
          <button class="btn" data-action="download" title="Download as markdown">📥 Download</button>
        </div>` : ''}
      </div>` : ''}

      <div class="viewer-content"></div>
    </div>` as HTMLElement;

    // Initialize viewer
    this.initializeViewer(container);

    return container;
  }

  /**
   * Set content to display
   */
  setContent(content: string): void {
    this.content = content;
    if (this.view) {
      this.view.setMarkdown(content);
    }
  }

  /**
   * Get current content
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Copy content to clipboard
   */
  async copyContent(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.content);
      this.options.onCopy?.(this.content);
    } catch (error) {
      console.warn('Failed to copy content:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.content;
      document.body.append(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      this.options.onCopy?.(this.content);
    }
  }

  /**
   * Download content as markdown file
   */
  downloadContent(): void {
    const blob = new Blob([this.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `markdown-content-${new Date().toISOString().split('T')[0]}.md`;
    document.body.append(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    this.options.onDownload?.(this.content);
  }

  private initializeViewer(container: HTMLElement): void {
    const contentContainer = container.querySelector('.viewer-content') as HTMLElement;

    if (!contentContainer) {
      console.error('[MarkdownViewer] Content container not found');
      return;
    }

    // Create a properly themed markdown viewer with CSS classes
    const viewElement = document.createElement('div');
    viewElement.className = 'markdown-body markdown-viewer-content';

    // Apply basic inline styles for layout, let CSS handle theming
    viewElement.style.cssText = `
      padding: 2rem;
      min-height: 300px;
      border-radius: var(--basic-radius-lg, 12px);
      overflow-wrap: break-word;
      word-wrap: break-word;
      color-scheme: inherit;
    `;

    contentContainer.innerHTML = '';
    contentContainer.append(viewElement);

    // Create a simple markdown renderer function
    this.view = {
      setMarkdown: (text: string = "") => {
        try {
          const html = marked.parse((text || "").trim());
          const sanitized = DOMPurify?.sanitize?.((html || "").trim()) || "";
          viewElement.innerHTML = sanitized;

          console.log('[MarkdownViewer] Markdown rendered successfully:', {
            inputLength: text.length,
            outputLength: sanitized.length,
            hasContent: !!sanitized
          });
        } catch (error) {
          console.error('[MarkdownViewer] Error rendering markdown:', error);
          viewElement.innerHTML = `<div style="color: red; padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;">Error parsing markdown: ${error.message}</div>`;
        }
      }
    } as any;

    console.log('[MarkdownViewer] Created simple div-based viewer');

    // Set initial content immediately
    if (this.content) {
      console.log('[MarkdownViewer] Setting initial content:', this.content.substring(0, 100) + '...');
      this.view.setMarkdown(this.content);
    }

    // Set up event listeners
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action === 'copy') {
        this.copyContent();
      } else if (action === 'download') {
        this.downloadContent();
      }
    });
  }
}

/**
 * Create a markdown viewer instance
 */
export function createMarkdownViewer(options?: MarkdownViewerOptions): MarkdownViewer {
  return new MarkdownViewer(options);
}