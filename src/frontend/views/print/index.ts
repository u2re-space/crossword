/**
 * Print View
 * 
 * Shell-agnostic print view for rendering and printing markdown content.
 * This view is optimized for print output with clean typography.
 */

import { H } from "fest/lure";
import type { View, ViewOptions, ShellContext } from "../../shells/types";

// Markdown rendering
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";
import { downloadHtmlAsDocx, downloadMarkdownAsDocx } from "../../../core/docx-export";

// Configure marked with KaTeX extension
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
// PRINT VIEW OPTIONS
// ============================================================================

export interface PrintViewOptions extends ViewOptions {
    /** Initial markdown content to display */
    initialMarkdown?: string;
    /** Title for the document */
    title?: string;
    /** Whether to auto-print when loaded */
    autoPrint?: boolean;
    /** Custom CSS class for styling */
    className?: string;
    /** Print delay in ms */
    printDelay?: number;
    /** Export format */
    exportFormat?: "print" | "docx";
}

// ============================================================================
// PRINT VIEW CLASS
// ============================================================================

export class PrintView implements View {
    readonly id = "print";
    readonly title = "Print";
    
    private element: HTMLElement | null = null;
    private options: PrintViewOptions;
    private context: ShellContext | null = null;

    constructor(options: PrintViewOptions = {}) {
        this.options = options;
    }

    async render(context: ShellContext): Promise<HTMLElement> {
        this.context = context;

        // Load styles
        await this.loadStyles();

        // Get content from options or URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const content = this.options.initialMarkdown ||
            urlParams.get('content') ||
            urlParams.get('markdown-content') ||
            urlParams.get('text') || '';
        const title = this.options.title || urlParams.get('title') || 'Document';
        const wantsDocx = this.options.exportFormat === 'docx' || 
            urlParams.get('export') === 'docx' || 
            urlParams.get('format') === 'docx';
        const autoPrint = (this.options.autoPrint ?? (urlParams.get('auto-print') !== 'false')) && !wantsDocx;
        const className = this.options.className || 'print-view';

        // Handle DOCX export
        if (wantsDocx && content.trim()) {
            await this.handleDocxExport(content, title);
        }

        // Create print layout
        const renderedContent = await this.renderMarkdown(content);
        
        this.element = H`
            <div class="${className}">
                <div class="print-content markdown-body">
                    ${renderedContent}
                </div>
            </div>
        ` as HTMLElement;

        // Auto-print if enabled
        if (autoPrint && content.trim() && typeof window !== 'undefined' && 'print' in window) {
            const printDelay = this.options.printDelay || 
                (urlParams.get('print-delay') ? parseInt(urlParams.get('print-delay')!) : 1500);

            setTimeout(() => {
                console.log('[PrintView] Auto-printing document');
                window.print();
            }, printDelay);
        }

        console.log('[PrintView] Rendered', {
            title,
            contentLength: content.length,
            autoPrint,
        });

        return this.element;
    }

    private async loadStyles(): Promise<void> {
        try {
            // Dynamic import of print styles
            const printStyles = await import("./print.scss?inline");
            if (printStyles.default) {
                const { loadAsAdopted } = await import("fest/dom");
                await loadAsAdopted(printStyles.default);
            }
        } catch (e) {
            console.warn("[PrintView] Failed to load print styles:", e);
        }
    }

    private async handleDocxExport(content: string, title: string): Promise<void> {
        const filename = `${(title || 'document').replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '-').slice(0, 180)}.docx`;
        const looksLikeHtml = content.trim().startsWith('<');
        
        if (looksLikeHtml) {
            await downloadHtmlAsDocx(content, { title, filename });
        } else {
            await downloadMarkdownAsDocx(content, { title, filename });
        }

        // Close window if requested
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('close') === 'true') {
            try {
                window.close?.();
            } catch {
                // ignore
            }
        }
    }

    private async renderMarkdown(content: string): Promise<string> {
        if (!content.trim()) {
            return '<div class="no-content"><p>No content to display</p></div>';
        }

        try {
            const html = await marked.parse(content, {
                breaks: true,
                gfm: true
            });
            return html;
        } catch (error) {
            console.warn('[PrintView] Marked library error, using basic renderer');
            return this.basicMarkdownRender(content);
        }
    }

    private basicMarkdownRender(content: string): string {
        return content
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
    }

    getElement(): HTMLElement {
        return this.element || document.createElement('div');
    }

    getToolbar?(): HTMLElement | null {
        return null; // Print view has no toolbar
    }

    onMount?(): void {
        console.log('[PrintView] Mounted');
    }

    onUnmount?(): void {
        console.log('[PrintView] Unmounted');
        this.element = null;
        this.context = null;
    }

    onShow?(): void {
        console.log('[PrintView] Shown');
    }

    onHide?(): void {
        console.log('[PrintView] Hidden');
    }
}

// ============================================================================
// VIEW FACTORY
// ============================================================================

export function createPrintView(options?: PrintViewOptions): PrintView {
    return new PrintView(options);
}

// ============================================================================
// LEGACY EXPORT (for backward compatibility)
// ============================================================================

export default async function printApp(mountElement: HTMLElement, options: PrintViewOptions = {}): Promise<void> {
    const view = new PrintView(options);
    const mockContext: ShellContext = {
        shellId: 'basic',
        theme: { mode: 'light', fontSize: 'medium' },
        navigate: async () => {},
        showMessage: () => {},
        setTitle: () => {}
    };
    
    const element = await view.render(mockContext);
    mountElement.appendChild(element);
}
