import { H } from "fest/lure";
import "./markdown-print.scss";

//
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";
import { downloadHtmlAsDocx, downloadMarkdownAsDocx } from "../shared/DocxExport";

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

// ============================================================================
// PRINT SUB-APP - Clean markdown viewer specialized for printing
// ============================================================================

export interface PrintAppOptions {
    /** Initial markdown content to display */
    initialMarkdown?: string;
    /** Title for the document */
    title?: string;
    /** Whether to auto-print when loaded */
    autoPrint?: boolean;
    /** Custom CSS class for styling */
    className?: string;
}

/**
 * Simple print-optimized sub-app for viewing markdown content
 * Much simpler UI than basic app, specialized for printing
 */
export default async function printApp(mountElement: HTMLElement, options: PrintAppOptions = {}): Promise<void> {
    console.log('[Print] Initializing print sub-app');

    // Get content from options or URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const content = options.initialMarkdown ||
        urlParams.get('content') ||
        urlParams.get('markdown-content') ||
        urlParams.get('text') || '';
    const title = options.title || urlParams.get('title') || 'Document';
    const wantsDocx = urlParams.get('export') === 'docx' || urlParams.get('format') === 'docx';
    const autoPrint = (options.autoPrint ?? (urlParams.get('auto-print') !== 'false')) && !wantsDocx;
    const className = options.className || 'print-view';

    // Check if printing is supported
    const canPrint = typeof window !== 'undefined' && 'print' in window;

    if (wantsDocx && content.trim()) {
        const filename = `${(title || 'document').replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '-').slice(0, 180)}.docx`;
        const looksLikeHtml = content.trim().startsWith('<');
        if (looksLikeHtml) {
            await downloadHtmlAsDocx(content, { title, filename });
        } else {
            await downloadMarkdownAsDocx(content, { title, filename });
        }
        if (urlParams.get('close') === 'true') {
            try {
                window.close?.();
            } catch {
                // ignore
            }
        }
    }

    // Create pure markdown content layout with no UI elements
    const printElement = H`
    <div class="${className}">
      <div class="print-content markdown-body">
        ${await renderMarkdown(content)}
      </div>
    </div>
  ` as HTMLElement;

    mountElement.appendChild(printElement);

    // Auto-print if enabled and content exists (no manual controls)
    if (autoPrint && content.trim() && canPrint) {
        // Wait for fonts and images to load, then auto-print
        const autoPrintDelay = urlParams.get('print-delay') ?
            parseInt(urlParams.get('print-delay')!) : 1500;

        setTimeout(() => {
            console.log('[Print] Auto-printing document');
            window.print();
        }, autoPrintDelay);
    }

    console.log('[Print] Print sub-app initialized', {
        title,
        contentLength: content.length,
        autoPrint,
        canPrint
    });
}

/**
 * Enhanced markdown renderer for print (uses marked library if available)
 */
async function renderMarkdown(content: string): Promise<string> {
    if (!content.trim()) {
        return '<div class="no-content"><p>No content to display</p></div>';
    }

    try {
        // Try to use the marked library for better markdown rendering
        const html = await marked.parse(content, {
            breaks: true,
            gfm: true
        });
        return html;
    } catch (error) {
        console.warn('[Print] Marked library not available, using basic renderer');

        // Fallback to basic markdown parsing
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
    }
}
