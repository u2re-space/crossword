/**
 * Markdown Renderer
 * 
 * Shared markdown rendering utility.
 * Uses marked for parsing and optionally highlight.js for code highlighting.
 */

import { H } from "fest/lure";

// ============================================================================
// TYPES
// ============================================================================

export interface RenderOptions {
    /** Enable syntax highlighting for code blocks */
    syntaxHighlight?: boolean;
    /** Enable GitHub Flavored Markdown */
    gfm?: boolean;
    /** Sanitize HTML output */
    sanitize?: boolean;
    /** Base URL for relative links */
    baseUrl?: string;
}

// ============================================================================
// SIMPLE MARKDOWN PARSER
// ============================================================================

/**
 * Simple markdown to HTML converter
 * Handles common markdown syntax without external dependencies
 */
function parseMarkdown(markdown: string): string {
    let html = markdown;
    
    // Escape HTML entities first
    const escapeHtml = (text: string) => text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Process code blocks first (before other transformations)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const escapedCode = escapeHtml(code.trim());
        return `<pre><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers (must be at start of line)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Horizontal rules
    html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '<hr>');
    
    // Unordered lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    
    // Paragraphs - wrap remaining text blocks
    const lines = html.split('\n');
    const result: string[] = [];
    let inParagraph = false;
    let paragraphContent = '';
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Check if this is a block element
        const isBlock = /^<(h[1-6]|ul|ol|li|blockquote|pre|hr|div|table)/.test(trimmed) ||
                       /<\/(h[1-6]|ul|ol|li|blockquote|pre|div|table)>$/.test(trimmed);
        
        if (isBlock || trimmed === '') {
            // Close current paragraph if open
            if (inParagraph && paragraphContent.trim()) {
                result.push(`<p>${paragraphContent.trim()}</p>`);
                paragraphContent = '';
                inParagraph = false;
            }
            if (trimmed) {
                result.push(trimmed);
            }
        } else {
            // Add to paragraph
            if (inParagraph) {
                paragraphContent += ' ' + trimmed;
            } else {
                paragraphContent = trimmed;
                inParagraph = true;
            }
        }
    }
    
    // Close final paragraph
    if (inParagraph && paragraphContent.trim()) {
        result.push(`<p>${paragraphContent.trim()}</p>`);
    }
    
    return result.join('\n');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Render markdown content to HTML element
 */
export async function renderMarkdown(
    content: string, 
    options: RenderOptions = {}
): Promise<HTMLElement> {
    try {
        // Parse markdown to HTML
        const html = parseMarkdown(content);
        
        // Create container element
        const container = document.createElement("div");
        container.className = "markdown-rendered";
        container.innerHTML = html;
        
        // Process links to open in new tab
        const links = container.querySelectorAll("a");
        for (const link of links) {
            if (!link.getAttribute("target")) {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        }
        
        // Add base URL to relative links if provided
        if (options.baseUrl) {
            const relativeLinks = container.querySelectorAll('a[href^="/"], img[src^="/"]');
            for (const el of relativeLinks) {
                const attr = el.tagName === "A" ? "href" : "src";
                const value = el.getAttribute(attr);
                if (value?.startsWith("/")) {
                    el.setAttribute(attr, options.baseUrl + value);
                }
            }
        }
        
        return container;
    } catch (error) {
        console.error("[MarkdownRenderer] Failed to render:", error);
        
        // Return error element
        const errorEl = document.createElement("div");
        errorEl.className = "markdown-error";
        errorEl.innerHTML = `
            <p><strong>Failed to render markdown</strong></p>
            <pre>${String(error)}</pre>
        `;
        return errorEl;
    }
}

/**
 * Render markdown to HTML string
 */
export function renderMarkdownToString(
    content: string,
    options: RenderOptions = {}
): string {
    return parseMarkdown(content);
}

/**
 * Extract plain text from markdown
 */
export function extractPlainText(markdown: string): string {
    return markdown
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`[^`]+`/g, '')
        // Remove headers markers
        .replace(/^#+\s*/gm, '')
        // Remove bold/italic markers
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        // Remove links, keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove images
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        // Remove blockquote markers
        .replace(/^>\s*/gm, '')
        // Remove list markers
        .replace(/^[\*\-\d.]+\s*/gm, '')
        // Normalize whitespace
        .replace(/\n+/g, ' ')
        .trim();
}

/**
 * Get first heading from markdown
 */
export function getFirstHeading(markdown: string): string | null {
    const match = markdown.match(/^#+\s+(.+)$/m);
    return match ? match[1].trim() : null;
}

/**
 * Count words in markdown (excluding code)
 */
export function countWords(markdown: string): number {
    const text = extractPlainText(markdown);
    return text.split(/\s+/).filter(w => w.length > 0).length;
}
