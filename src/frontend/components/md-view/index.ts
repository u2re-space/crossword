/**
 * <md-view> Web Component
 * 
 * A self-contained markdown viewer/renderer with encapsulated styles.
 * Uses Shadow DOM for style isolation.
 * 
 * Usage:
 *   <md-view content="# Hello World"></md-view>
 *   <md-view src="/path/to/file.md"></md-view>
 * 
 * Attributes:
 *   - content: Markdown string to render
 *   - src: URL to fetch markdown from
 *   - theme: "light" | "dark" | "auto" (default: "auto")
 *   - line-numbers: Show line numbers in code blocks
 * 
 * Events:
 *   - md-rendered: Fired when markdown is rendered
 *   - md-error: Fired when rendering fails
 *   - md-link-click: Fired when a link is clicked (cancelable)
 */

import { GLitElement, defineElement, property } from "fest/lure";
import { H } from "fest/lure";
import { ref, subscribe } from "fest/object";

// @ts-ignore - SCSS import
import styles from "./md-view.scss?inline";

// ============================================================================
// MD-VIEW WEB COMPONENT
// ============================================================================

@defineElement("md-view")
export class MdViewElement extends GLitElement() {
    
    // ========================================================================
    // PROPERTIES (reactive, reflected to attributes)
    // ========================================================================
    
    @property({ attribute: "content", source: "attr" })
    content: string = "";
    
    @property({ attribute: "src", source: "attr" })
    src: string = "";
    
    @property({ attribute: "theme", source: "attr" })
    theme: "light" | "dark" | "auto" = "auto";
    
    @property({ attribute: "line-numbers", source: "attr" })
    lineNumbers: boolean = false;
    
    @property({ attribute: "loading", source: "attr" })
    loading: boolean = false;
    
    @property({ attribute: "error", source: "attr" })
    error: string = "";

    // ========================================================================
    // INTERNAL STATE
    // ========================================================================
    
    private renderedContent = ref<string>("");
    private isRendering = ref<boolean>(false);
    private contentContainer: HTMLElement | null = null;
    private markedInstance: typeof import("marked") | null = null;

    // ========================================================================
    // STYLES
    // ========================================================================
    
    get styles() {
        return styles;
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================
    
    protected onInitialize(weak?: WeakRef<any>): this {
        // Setup attribute change observer
        this.setupObservers();
        return this;
    }

    protected onRender(weak?: WeakRef<any>): this {
        // Initial render
        this.renderMarkdownContent();
        return this;
    }

    // ========================================================================
    // RENDER
    // ========================================================================
    
    render(weak?: WeakRef<any>): HTMLElement {
        const container = H`
            <div class="md-view" part="container" data-theme="${this.theme}">
                <div class="md-view__content markdown-body" part="content">
                    <slot name="loading">
                        <div class="md-view__loading" part="loading">
                            <div class="md-view__spinner"></div>
                            <span>Loading...</span>
                        </div>
                    </slot>
                </div>
                <div class="md-view__error" part="error" hidden>
                    <slot name="error">
                        <span class="md-view__error-text"></span>
                    </slot>
                </div>
            </div>
        ` as HTMLElement;

        this.contentContainer = container.querySelector(".md-view__content");
        
        return container;
    }

    // ========================================================================
    // OBSERVERS
    // ========================================================================
    
    private setupObservers(): void {
        // Watch for content changes
        subscribe(this.renderedContent, () => {
            this.updateContent();
        });

        subscribe(this.isRendering, () => {
            this.toggleAttribute("loading", this.isRendering.value);
        });
    }

    static get observedAttributes() {
        return ["content", "src", "theme", "line-numbers"];
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue === newValue) return;

        switch (name) {
            case "content":
                if (newValue !== null) {
                    this.renderMarkdownContent();
                }
                break;
            case "src":
                if (newValue) {
                    this.loadFromUrl(newValue);
                }
                break;
            case "theme":
                this.updateTheme();
                break;
        }
    }

    // ========================================================================
    // MARKDOWN RENDERING
    // ========================================================================
    
    private async renderMarkdownContent(): Promise<void> {
        const content = this.content || this.getAttribute("content") || "";
        
        if (!content.trim()) {
            this.renderedContent.value = '<p class="md-view__empty">No content</p>';
            return;
        }

        this.isRendering.value = true;
        this.error = "";

        try {
            const html = await this.parseMarkdown(content);
            this.renderedContent.value = html;
            
            this.dispatchEvent(new CustomEvent("md-rendered", {
                bubbles: true,
                composed: true,
                detail: { content, html }
            }));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.error = errorMsg;
            this.renderedContent.value = `<p class="md-view__error-inline">Error: ${errorMsg}</p>`;
            
            this.dispatchEvent(new CustomEvent("md-error", {
                bubbles: true,
                composed: true,
                detail: { error: err, content }
            }));
        } finally {
            this.isRendering.value = false;
        }
    }

    private async parseMarkdown(content: string): Promise<string> {
        // Lazy load marked
        if (!this.markedInstance) {
            this.markedInstance = await import("marked");
            
            // Configure marked
            try {
                const markedKatex = await import("marked-katex-extension");
                this.markedInstance.marked?.use?.(markedKatex.default({
                    throwOnError: false,
                    nonStandard: true,
                    output: "mathml",
                    strict: false,
                }) as any);
            } catch {
                // KaTeX extension not available
            }
        }

        const html = await this.markedInstance.marked.parse(content, {
            breaks: true,
            gfm: true
        });

        return html;
    }

    private async loadFromUrl(url: string): Promise<void> {
        this.isRendering.value = true;
        this.error = "";

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
            }
            
            const content = await response.text();
            this.content = content;
            await this.renderMarkdownContent();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.error = errorMsg;
            
            this.dispatchEvent(new CustomEvent("md-error", {
                bubbles: true,
                composed: true,
                detail: { error: err, url }
            }));
        } finally {
            this.isRendering.value = false;
        }
    }

    // ========================================================================
    // DOM UPDATES
    // ========================================================================
    
    private updateContent(): void {
        if (!this.contentContainer) return;
        
        this.contentContainer.innerHTML = this.renderedContent.value;
        
        // Setup link handlers
        this.contentContainer.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", (e) => {
                const event = new CustomEvent("md-link-click", {
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                    detail: { href: link.href, target: link }
                });
                
                if (!this.dispatchEvent(event)) {
                    e.preventDefault();
                }
            });
        });

        // Add code block enhancements
        this.contentContainer.querySelectorAll("pre code").forEach(block => {
            // Add copy button
            const wrapper = document.createElement("div");
            wrapper.className = "md-view__code-wrapper";
            block.parentElement?.replaceWith(wrapper);
            wrapper.appendChild(block.parentElement!);
            
            const copyBtn = document.createElement("button");
            copyBtn.className = "md-view__copy-btn";
            copyBtn.textContent = "Copy";
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(block.textContent || "");
                    copyBtn.textContent = "Copied!";
                    setTimeout(() => copyBtn.textContent = "Copy", 2000);
                } catch {
                    copyBtn.textContent = "Failed";
                }
            });
            wrapper.appendChild(copyBtn);
        });
    }

    private updateTheme(): void {
        const container = this.shadowRoot?.querySelector(".md-view");
        if (container) {
            container.setAttribute("data-theme", this.theme);
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Set markdown content programmatically
     */
    setContent(content: string): void {
        this.content = content;
        this.renderMarkdownContent();
    }

    /**
     * Get current rendered HTML
     */
    getRenderedHtml(): string {
        return this.renderedContent.value;
    }

    /**
     * Get current markdown source
     */
    getMarkdownSource(): string {
        return this.content;
    }

    /**
     * Refresh rendering
     */
    async refresh(): Promise<void> {
        await this.renderMarkdownContent();
    }

    /**
     * Print the content
     */
    print(): void {
        const content = this.contentContainer?.innerHTML || "";
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print</title>
                    <style>
                        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
                        pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
                        code { font-family: monospace; }
                        img { max-width: 100%; }
                    </style>
                </head>
                <body class="markdown-body">${content}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }
}

// ============================================================================
// TYPE DECLARATION
// ============================================================================

declare global {
    interface HTMLElementTagNameMap {
        "md-view": MdViewElement;
    }
}

export default MdViewElement;
