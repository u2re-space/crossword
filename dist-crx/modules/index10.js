import { observe, loadAsAdopted, removeAdopted, H } from './Settings.js';
import './Env.js';
import { getItem, setItem } from './index.js';

const style = "@layer view.history{:is(html,body):has([data-view=history]){--view-layout:\"flex\";--view-content-max-width:1000px}.view-history{background-color:var(--view-bg,var(--color-surface,#fff));block-size:100%;color:var(--view-fg,var(--color-on-surface,#1a1a1a));display:flex;flex-direction:column;padding:1.5rem}.view-history__header{align-items:center;display:flex;justify-content:space-between;margin-block-end:1.5rem}.view-history__header h1{font-size:1.5rem;font-weight:700;margin:0}.view-history__clear-btn{align-items:center;background:#0000;border:none;border-radius:6px;color:#d32f2f;cursor:pointer;display:flex;font-size:.8125rem;font-weight:500;gap:.5rem;padding:.5rem .75rem}.view-history__clear-btn:hover{background-color:#d32f2f1a}.view-history__list{flex:1;overflow-y:auto}.view-history__empty{align-items:center;block-size:100%;color:var(--view-fg);display:flex;flex-direction:column;gap:1rem;justify-content:center;opacity:.4}.view-history__empty p{font-size:1rem;margin:0}.view-history__item{background-color:var(--view-item-bg,#00000005);border-inline-start:3px solid var(--color-primary,#007acc);border-radius:8px;margin-block-end:.75rem;padding:1rem}.view-history__item.error{border-inline-start-color:#d32f2f}.view-history__item-header{align-items:center;display:flex;justify-content:space-between;margin-block-end:.5rem}.view-history__item-action{font-size:.875rem;font-weight:600}.view-history__item-time{color:var(--view-fg);font-size:.75rem;opacity:.6}.view-history__item-desc{color:var(--view-fg);font-size:.875rem;margin:0;opacity:.8}.view-history__item-error{color:#d32f2f;font-size:.8125rem;margin:.5rem 0 0}.view-history__item-actions{display:flex;gap:.5rem;margin-block-start:.75rem}.view-history__action-btn{align-items:center;background-color:#0000000d;border:none;border-radius:4px;color:var(--view-fg);cursor:pointer;display:flex;font-size:.75rem;gap:.375rem;padding:.375rem .625rem}.view-history__action-btn:hover{background-color:#0000001a}}";

const STORAGE_KEY = "rs-history";
class HistoryView {
  id = "history";
  name = "History";
  icon = "clock-counter-clockwise";
  options;
  shellContext;
  element = null;
  entries = observe([]);
  _sheet = null;
  lifecycle = {
    onMount: () => {
      this.loadHistory();
      this._sheet ??= loadAsAdopted(style);
    },
    onUnmount: () => {
      removeAdopted(this._sheet);
    },
    onShow: () => {
      this._sheet ??= loadAsAdopted(style);
      this.loadHistory();
    }
    //onHide: () => { removeAdopted(this._sheet!); },
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
    this.loadHistory();
    this.element = H`
            <div class="view-history">
                <div class="view-history__header">
                    <h1>History</h1>
                    <button class="view-history__clear-btn" data-action="clear" type="button">
                        <ui-icon icon="trash" icon-style="duotone"></ui-icon>
                        <span>Clear History</span>
                    </button>
                </div>
                <div class="view-history__list" data-history-list>
                    ${this.renderEntries()}
                </div>
            </div>
        `;
    this.setupEventHandlers();
    return this.element;
  }
  getToolbar() {
    return null;
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  renderEntries() {
    if (this.entries.length === 0) {
      return H`
                <div class="view-history__empty">
                    <ui-icon icon="clock-counter-clockwise" icon-style="duotone" size="48"></ui-icon>
                    <p>No history yet</p>
                </div>
            `;
    }
    const fragment = document.createDocumentFragment();
    for (const entry of [...this.entries].reverse()) {
      const item = H`
                <div class="view-history__item ${entry.ok ? "" : "error"}" data-entry="${entry.id}">
                    <div class="view-history__item-header">
                        <span class="view-history__item-action">${entry.action}</span>
                        <span class="view-history__item-time">${this.formatTime(entry.timestamp)}</span>
                    </div>
                    <p class="view-history__item-desc">${entry.description}</p>
                    ${entry.error ? H`<p class="view-history__item-error">${entry.error}</p>` : ""}
                    ${entry.content ? H`
                        <div class="view-history__item-actions">
                            <button class="view-history__action-btn" data-action="copy" data-id="${entry.id}" type="button">
                                <ui-icon icon="copy" icon-style="duotone" size="14"></ui-icon>
                                Copy
                            </button>
                            <button class="view-history__action-btn" data-action="view" data-id="${entry.id}" type="button">
                                <ui-icon icon="eye" icon-style="duotone" size="14"></ui-icon>
                                View
                            </button>
                        </div>
                    ` : ""}
                </div>
            `;
      fragment.appendChild(item);
    }
    return fragment;
  }
  setupEventHandlers() {
    if (!this.element) return;
    this.element.addEventListener("click", async (e) => {
      const target = e.target;
      const button = target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      const entryId = button.dataset.id;
      if (action === "clear") {
        this.clearHistory();
      } else if (action === "copy" && entryId) {
        const entry = this.entries.find((e2) => e2.id === entryId);
        if (entry?.content) {
          try {
            await navigator.clipboard.writeText(entry.content);
            this.showMessage("Copied to clipboard");
          } catch {
            this.showMessage("Failed to copy");
          }
        }
      } else if (action === "view" && entryId) {
        const entry = this.entries.find((e2) => e2.id === entryId);
        if (entry?.content) {
          this.shellContext?.navigate("viewer", { content: entry.content });
        }
      }
    });
  }
  loadHistory() {
    const saved = getItem(STORAGE_KEY, []);
    this.entries.length = 0;
    this.entries.push(...saved);
    this.updateList();
  }
  clearHistory() {
    this.entries.length = 0;
    setItem(STORAGE_KEY, []);
    this.updateList();
    this.showMessage("History cleared");
  }
  updateList() {
    const list = this.element?.querySelector("[data-history-list]");
    if (!list) return;
    list.replaceChildren();
    const rendered = this.renderEntries();
    if (typeof rendered !== "string") {
      list.appendChild(rendered);
    }
  }
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = /* @__PURE__ */ new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  showMessage(message) {
    this.shellContext?.showMessage(message);
  }
  canHandleMessage() {
    return false;
  }
  async handleMessage() {
  }
}
function createView(options) {
  return new HistoryView(options);
}
const createHistoryView = createView;

export { HistoryView, createHistoryView, createView, createView as default };
//# sourceMappingURL=index10.js.map
