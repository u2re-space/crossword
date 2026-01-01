// Standalone markdown renderer for Basic mode.
// Ported from `modules/projects/fl.ui/src/services/markdown-view/Markdown.ts`,
// but without `provide()` caching and without auto-loading by `src`.

// @ts-ignore
import styles from "./Markdown.scss?inline&compress";
import DOMPurify from "isomorphic-dompurify";
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import { E } from "fest/lure";
import { preloadStyle } from "fest/dom";

marked?.use?.(markedKatex({ throwOnError: false, nonStandard: true, output: "mathml", strict: false }) as unknown as MarkedExtension);

const styled = preloadStyle(styles);

export class BasicMarkdownView extends HTMLElement {
  #view: HTMLElement | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.style.setProperty("pointer-events", "auto");
    this.style.setProperty("touch-action", "manipulation");
    this.style.setProperty("user-select", "text");

    // Create content when element is connected to DOM
    if (!this.#view) {
      this.createContent();
    }
  }

  setMarkdown(text = "") {
    const view = this.#view;
    if (!view) {
      console.warn('[BasicMarkdownView] View element not initialized');
      return;
    }

    try {
      const html = marked.parse((text || "").trim());
      const sanitized = DOMPurify?.sanitize?.((html || "").trim()) || "";
      view.innerHTML = sanitized;

      // Debug logging
      console.log('[BasicMarkdownView] Markdown parsed and set:', {
        inputLength: text.length,
        outputLength: sanitized.length,
        hasContent: !!sanitized,
        htmlPreview: sanitized.substring(0, 200) + '...'
      });
    } catch (error) {
      console.error('[BasicMarkdownView] Error parsing markdown:', error);
      view.innerHTML = `<div class="error" style="color: red; padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;">Error parsing markdown: ${error.message}</div>`;
    }
  }

  private createContent() {
    // Use regular DOM instead of shadow root for now to avoid styling issues
    this.innerHTML = '';

    // Create the view element
    const viewElement = document.createElement('div');
    viewElement.className = 'markdown-body';
    viewElement.setAttribute('data-print', '');
    viewElement.style.cssText = `
      color: #333;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 2rem;
      min-height: 300px;
      background: var(--basic-background, #fff);
      border-radius: var(--basic-radius-lg, 12px);
      border: 1px solid var(--basic-outline, #e0e0e0);
    `;

    this.#view = viewElement;
    this.append(this.#view);

    console.log('[BasicMarkdownView] Content created successfully');
  }
}

export const defineBasicMarkdownView = () => {
  if (!customElements.get("basic-md-view")) {
    customElements.define("basic-md-view", BasicMarkdownView);
  }
};


