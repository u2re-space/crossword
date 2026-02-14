import { loadAsAdopted, removeAdopted, H } from './Settings.js';
import { getString, setString } from './index18.js';
export { FileManager, FileManagerContent } from './index16.js';
import './index.js';
import './crx-entry.js';
import './UnifiedMessaging.js';
import './BuiltInAI.js';
import './Clipboard.js';
import './Markdown.js';
import './browser.js';
import './_commonjsHelpers.js';
import './auto-render.js';
import './index17.js';

const style = "@layer view-explorer{@layer tokens{:root:has([data-view=explorer]),html:has([data-view=explorer]){--view-layout:\"flex\";--view-content-max-width:none}:host:has(.view-explorer){--view-font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;--view-font-size:0.875rem;--view-line-height:1.5}}@layer base{:host:has(.view-explorer){background:var(--view-bg);block-size:100%;color:var(--view-fg);contain:layout style;display:flex;flex-direction:column;font-family:var(--view-font-family);font-size:var(--view-font-size);line-height:var(--view-line-height);min-block-size:300px}.view-explorer{background-color:var(--view-bg,var(--color-surface,#fff));block-size:100%;color:var(--view-fg,var(--color-on-surface,#1a1a1a));display:flex;flex-direction:column}.view-explorer__content{background:#0000;block-size:stretch;border:none;border-radius:0;box-sizing:border-box;color:inherit;flex:1;inline-size:stretch;margin:0;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;outline:none;overflow:hidden;padding:0}.view-explorer__content>ui-file-manager{block-size:100%;inline-size:100%}.view-explorer__error,.view-explorer__loading{align-items:center;block-size:100%;display:flex;flex-direction:column;gap:1rem;justify-content:center}.view-explorer__loading{color:var(--view-fg);opacity:.6}.view-explorer__spinner{animation:d .8s linear infinite;block-size:32px;border:3px solid var(--view-border,#80808033);border-block-start-color:var(--color-primary,var(--color-primary,#007acc));border-radius:50%;inline-size:32px}.view-explorer__error p{color:var(--color-error,#d32f2f);margin:0}.view-explorer__error button{background-color:var(--color-primary,var(--color-primary,#007acc));border:none;border-radius:6px;color:#fff;cursor:pointer;padding:.5rem 1rem}.view-explorer__error button:hover{filter:brightness(1.1)}}@layer components{.view-explorer{background:var(--view-bg);border:1px solid var(--view-border);border-radius:.5rem;overflow:hidden}.view-explorer__status,.view-explorer__toolbar{align-items:center;background:var(--view-bg-secondary);display:flex;flex-shrink:0;gap:.5rem}.view-explorer__toolbar{border-block-end:1px solid var(--view-border);padding:.5rem}.view-explorer__status{border-block-start:1px solid var(--view-border);color:var(--view-fg-muted);font-size:.75rem;gap:1rem;padding:.375rem .75rem}.view-explorer__actions,.view-explorer__nav{display:flex;gap:.125rem}.view-explorer__breadcrumb{flex:1;min-inline-size:0;padding:0 .5rem}.view-explorer__path{color:var(--view-fg-muted);display:block;font-size:.8125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.view-explorer__btn{align-items:center;background:#0000;border:none;border-radius:.25rem;color:var(--view-fg-muted);cursor:pointer;display:inline-flex;font-family:inherit;font-size:inherit;gap:.375rem;justify-content:center;padding:.375rem;transition:background-color .15s ease,color .15s ease}.view-explorer__btn:hover:not(:disabled){background:var(--view-hover-bg);color:var(--view-fg)}.view-explorer__btn:disabled{cursor:not-allowed;opacity:.5}.view-explorer__btn ui-icon{font-size:1.125rem}.view-explorer__btn--primary{background:var(--view-accent);color:#fff;padding:.5rem 1rem}.view-explorer__btn--primary:hover:not(:disabled){background:var(--view-accent-hover);color:#fff}.view-explorer__list{block-size:100%;outline:none;overflow-y:auto;overscroll-behavior:contain;scroll-behavior:smooth}.view-explorer__list:focus-visible{outline:2px solid var(--view-accent);outline-offset:-2px}.view-explorer__empty,.view-explorer__loading{align-items:center;color:var(--view-fg-muted);display:flex;flex-direction:column;gap:.75rem;justify-content:center;text-align:center}.view-explorer__loading{padding:2rem}.view-explorer__empty{gap:1rem;padding:3rem 2rem}.view-explorer__empty ui-icon{font-size:3rem;opacity:.5}.view-explorer__empty p{margin:0}.view-explorer__spinner{animation:d .8s linear infinite;block-size:1.5rem;border:2px solid var(--view-border,#80808033);border-block-start-color:var(--view-accent);border-radius:50%;inline-size:1.5rem}.view-explorer__item{align-items:center;cursor:pointer;display:flex;gap:.75rem;padding:.5rem .75rem;position:relative;transition:background-color .1s ease;user-select:none}.view-explorer__item:hover{background:var(--view-hover-bg)}.view-explorer__item[aria-selected=true]{background:var(--view-selected-bg)}.view-explorer__item[aria-selected=true]:before{background:var(--view-selected-border);content:\"\";inline-size:3px;inset-block:0;inset-inline-start:0;position:absolute}.view-explorer__item:focus-visible{outline:2px solid var(--view-accent);outline-offset:-2px}.view-explorer__item-icon{align-items:center;display:flex;flex-shrink:0;justify-content:center}.view-explorer__item-icon ui-icon{font-size:1.5rem}[data-kind=directory] .view-explorer__item-icon{color:var(--view-icon-folder)}[data-kind=file] .view-explorer__item-icon{color:var(--view-icon-file)}.view-explorer__item-info{display:flex;flex:1;flex-direction:column;gap:.125rem;min-inline-size:0}.view-explorer__item-name{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.view-explorer__item-meta{color:var(--view-fg-muted);font-size:.75rem}.view-explorer__selected-count:not(:empty):before{content:\"•\";margin-inline-end:1rem}}@layer states{:host([loading]) .view-explorer__list>:not(.view-explorer__loading){display:none}:host(:not([loading])) .view-explorer__loading{display:none}:host(.dragover) .view-explorer__content{background:var(--view-selected-bg);border:2px dashed var(--view-selected-border)}.view-explorer[data-view-mode=grid] .view-explorer__list{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));padding:.75rem}.view-explorer[data-view-mode=grid] .view-explorer__item{border:1px solid #0000;border-radius:.375rem;flex-direction:column;padding:.75rem;text-align:center}.view-explorer[data-view-mode=grid] .view-explorer__item[aria-selected=true]{border-color:var(--view-selected-border)}.view-explorer[data-view-mode=grid] .view-explorer__item[aria-selected=true]:before{display:none}.view-explorer[data-view-mode=grid] .view-explorer__item-icon ui-icon{font-size:2.5rem}.view-explorer[data-view-mode=grid] .view-explorer__item-info{align-items:center}.view-explorer[data-view-mode=grid] .view-explorer__item-name{font-size:.8125rem;max-inline-size:100%}.view-explorer[data-view-mode=grid] .view-explorer__item-meta{font-size:.6875rem}.view-explorer[data-view-mode=grid] .view-explorer__empty,.view-explorer[data-view-mode=grid] .view-explorer__loading{grid-column:1/-1}}@layer media{@media (max-width:480px){.view-explorer__toolbar{flex-wrap:wrap}.view-explorer__breadcrumb{inline-size:100%;order:3;padding:.25rem 0 0}.view-explorer[data-view-mode=grid] .view-explorer__list{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}}}@layer animations{@keyframes d{to{transform:rotate(1turn)}}}}";

"use strict";
class ExplorerView {
  id = "explorer";
  name = "Explorer";
  icon = "folder";
  options;
  shellContext;
  element = null;
  explorer = null;
  _sheet = null;
  lifecycle = {
    onMount: () => {
      this.loadLastPath();
      this._sheet ??= loadAsAdopted(style);
    },
    onUnmount: () => {
      removeAdopted(this._sheet);
      this.saveCurrentPath();
    },
    onShow: () => {
      this._sheet ??= loadAsAdopted(style);
    },
    onHide: () => {
      this.saveCurrentPath();
    }
  };
  constructor(options = {}) {
    this.options = options;
    this.shellContext = options.shellContext;
  }
  render(options) {
    if (options) {
      this.options = { ...this.options, ...options };
      this.shellContext = options.shellContext || this.shellContext;
    }
    this._sheet = loadAsAdopted(style);
    this.element = H`
            <div class="view-explorer">
                <div class="view-explorer__content" data-explorer-content>
                    <ui-file-manager view-mode="list"></ui-file-manager>
                </div>
            </div>
        `;
    this.explorer = this.element.querySelector("ui-file-manager");
    this.setupExplorerEvents();
    return this.element;
  }
  getToolbar() {
    return null;
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  setupExplorerEvents() {
    if (!this.explorer) return;
    const explorer = this.explorer;
    explorer.addEventListener("rs-open", async (e) => {
      const detail = e.detail;
      const item = detail?.item;
      if (item?.kind === "file" && item?.file) {
        const file = item.file;
        const isMarkdown = file.name.toLowerCase().endsWith(".md") || file.type === "text/markdown";
        if (isMarkdown) {
          try {
            const content = await file.text();
            this.shellContext?.navigate("viewer", { content });
          } catch (error) {
            console.error("[Explorer] Failed to read file:", error);
            this.showMessage("Failed to open file");
          }
        } else {
          this.shellContext?.navigate("workcenter");
        }
      }
    });
    explorer.addEventListener("rs-navigate", () => {
      this.saveCurrentPath();
    });
  }
  loadLastPath() {
    if (this.explorer) {
      const lastPath = getString("view-explorer-path", "/");
      this.explorer.path = lastPath;
    }
  }
  saveCurrentPath() {
    if (this.explorer) {
      const currentPath = this.explorer.path || "/";
      setString("view-explorer-path", currentPath);
    }
  }
  showMessage(message) {
    this.shellContext?.showMessage(message);
  }
  canHandleMessage(messageType) {
    return ["file-save", "navigate-path", "content-explorer"].includes(messageType);
  }
  async handleMessage(message) {
    const msg = message;
    const targetPath = msg.data?.path || msg.data?.into;
    if (targetPath && this.explorer) {
      this.explorer.navigate(targetPath);
    }
  }
}
function createView(options) {
  return new ExplorerView(options);
}
const createExplorerView = createView;

export { ExplorerView, createExplorerView, createView, createView as default };
//# sourceMappingURL=index9.js.map
