import { H, __vitePreload } from './Settings.js';
import './Env.js';
import { MarkdownView } from './Markdown.js';
import './_commonjsHelpers.js';
import './katex.js';
import './index3.js';

class PrintView {
  id = "print";
  name = "Print";
  element = null;
  options;
  mdView = null;
  constructor(options = {}) {
    this.options = {
      ...options,
      initialData: options.initialData || options.initialMarkdown
    };
  }
  render(options) {
    const mergedOptions = { ...this.options, ...options };
    this.loadStyles().catch((e) => console.warn("[PrintView] Failed to load print styles:", e));
    const urlParams = new URLSearchParams(window.location.search);
    const content = mergedOptions.initialMarkdown || urlParams.get("content") || urlParams.get("markdown-content") || urlParams.get("text") || mergedOptions.initialData || "";
    const title = mergedOptions.title || urlParams.get("title") || "Document";
    const wantsDocx = mergedOptions.exportFormat === "docx" || urlParams.get("export") === "docx" || urlParams.get("format") === "docx";
    const autoPrint = (mergedOptions.autoPrint ?? urlParams.get("auto-print") !== "false") && !wantsDocx;
    const className = mergedOptions.className || "print-view";
    if (wantsDocx && content.trim()) {
      this.handleDocxExport(content, title).catch((e) => console.error("[PrintView] DOCX export error:", e));
    }
    this.mdView = new MarkdownView();
    this.element = H`
            <div class="${className}">
                <div class="print-content">
                    ${this.mdView}
                </div>
            </div>
        `;
    if (content.trim()) {
      this.mdView.setContent?.(content).catch((e) => {
        console.warn("[PrintView] Failed to set markdown content:", e);
      });
    }
    if (autoPrint && content.trim() && typeof window !== "undefined" && "print" in window) {
      const printDelay = mergedOptions.printDelay || (urlParams.get("print-delay") ? parseInt(urlParams.get("print-delay")) : 1500);
      setTimeout(() => {
        console.log("[PrintView] Auto-printing document");
        window.print();
      }, printDelay);
    }
    console.log("[PrintView] Rendered", {
      title,
      contentLength: content.length,
      autoPrint
    });
    return this.element;
  }
  async loadStyles() {
    try {
      console.log("[PrintView] Using MarkdownView component styles");
    } catch (e) {
      console.warn("[PrintView] Error during style setup:", e);
    }
  }
  async handleDocxExport(content, title) {
    const { downloadHtmlAsDocx, downloadMarkdownAsDocx } = await __vitePreload(async () => { const { downloadHtmlAsDocx, downloadMarkdownAsDocx } = await import('./DocxExport.js');return { downloadHtmlAsDocx, downloadMarkdownAsDocx }},true              ?[]:void 0,import.meta.url);
    const filename = `${(title || "document").replace(/[\\/:*?"<>|\u0000-\u001F]+/g, "-").slice(0, 180)}.docx`;
    const looksLikeHtml = content.trim().startsWith("<");
    if (looksLikeHtml) {
      await downloadHtmlAsDocx(content, { title, filename });
    } else {
      await downloadMarkdownAsDocx(content, { title, filename });
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("close") === "true") {
      try {
        window.close?.();
      } catch {
      }
    }
  }
  getElement() {
    return this.element || document.createElement("div");
  }
  getToolbar() {
    return null;
  }
  lifecycle = {
    onMount: () => {
      console.log("[PrintView] Mounted");
    },
    onUnmount: () => {
      console.log("[PrintView] Unmounted");
      this.element = null;
      this.mdView = null;
    },
    onShow: () => {
      console.log("[PrintView] Shown");
    },
    onHide: () => {
      console.log("[PrintView] Hidden");
    }
  };
}
function createView(options) {
  return new PrintView(options);
}
const createPrintView = createView;

export { PrintView, createPrintView, createView, createView as default };
//# sourceMappingURL=index2.js.map
