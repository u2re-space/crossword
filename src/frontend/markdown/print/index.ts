import { H } from "fest/lure";

// ============================================================================
// PRINT VIEW - Clean markdown viewer for printing
// ============================================================================

/**
 * Clean print view for markdown content without any toolbars or UI elements
 */
export default class PrintView {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const content = urlParams.get('content') || '';
    const title = urlParams.get('title') || 'Markdown Content';

    // Create clean print layout
    const printElement = H`
      <div class="print-view">
        <div class="print-header">
          <h1 class="print-title">${title}</h1>
        </div>
        <div class="print-content markdown-body">
          ${this.renderMarkdown(content)}
        </div>
      </div>
    ` as HTMLElement;

    this.container.appendChild(printElement);

    // Auto-print after a short delay to ensure content is rendered
    setTimeout(() => {
      window.print();
    }, 500);
  }

  private renderMarkdown(content: string): string {
    // Simple markdown renderer for print
    // This is a basic implementation - in production you might want to use marked
    if (!content) return '<p>No content to display</p>';

    try {
      // Basic markdown parsing for print
      let html = content
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')

        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

        // Lists
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')

        // Wrap in paragraphs
        .replace(/^(.+?)(?=<\/p>|$)/g, '<p>$1</p>');

      return html;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return `<pre>${content}</pre>`;
    }
  }
}

// Initialize print view
const container = document.querySelector('#app') as HTMLElement;
if (container) {
  new PrintView(container);
}