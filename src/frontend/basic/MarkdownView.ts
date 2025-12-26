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

marked?.use?.(markedKatex({ throwOnError: false, nonStandard: true, output: "mathml" }) as unknown as MarkedExtension);

const styled = preloadStyle(styles);

export class BasicMarkdownView extends HTMLElement {
  #view: HTMLElement | null = null;

  constructor() {
    super();
    this.createShadowRoot();
  }

  connectedCallback() {
    this.style.setProperty("pointer-events", "auto");
    this.style.setProperty("touch-action", "manipulation");
    this.style.setProperty("user-select", "text");
  }

  async setMarkdown(text = "") {
    const view = this.#view;
    if (!view) return;
    const html = await marked.parse((text || "").trim());
    view.innerHTML = DOMPurify?.sanitize?.((html || "").trim()) || "";
  }

  private createShadowRoot() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.append((this.#view = E("div.markdown-body", { dataset: { print: "" } })?.element));
    shadowRoot.adoptedStyleSheets.push(styled);
  }
}

export const defineBasicMarkdownView = () => {
  if (!customElements.get("basic-md-view")) {
    customElements.define("basic-md-view", BasicMarkdownView);
  }
};


