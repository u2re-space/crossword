import { ref, removeAdopted, loadAsAdopted, H } from './Settings.js';
import './Env.js';
import { createViewState } from './types.js';

const style = "@layer view.editor{:is(html,body):has([data-view=editor]){--view-layout:\"flex\";--view-content-max-width:none}.view-editor{background-color:var(--view-bg,var(--color-surface,#fff));block-size:100%;color:var(--view-fg,var(--color-on-surface,#1a1a1a));display:flex;flex-direction:column}.view-editor__toolbar{align-items:center;background-color:var(--view-toolbar-bg,#00000005);border-block-end:1px solid var(--view-border,#00000014);display:flex;flex-shrink:0;gap:.5rem;justify-content:space-between;padding:.5rem 1rem}.view-editor__toolbar-left,.view-editor__toolbar-right{align-items:center;display:flex;gap:.25rem}.view-editor__btn{align-items:center;background:#0000;border:none;border-radius:6px;color:var(--view-fg);cursor:pointer;display:flex;font-size:.8125rem;font-weight:500;gap:.5rem;padding:.5rem .75rem;transition:background-color .15s ease}.view-editor__btn ui-icon{font-size:1rem;opacity:.7}@media (max-width:640px){.view-editor__btn span{display:none}}.view-editor__btn:hover{background-color:#0000000f}.view-editor__content{display:flex;flex:1;overflow:hidden}.view-editor__textarea{background-color:var(--view-editor-bg,#fafafa);border:none;color:var(--view-fg);flex:1;font-family:SF Mono,Fira Code,JetBrains Mono,Consolas,monospace;font-size:.9375rem;line-height:1.6;padding:1.5rem 2rem;resize:none}.view-editor__textarea:focus{outline:none}.view-editor__textarea::placeholder{color:var(--view-fg);opacity:.4}@media print{.view-editor__toolbar{display:none}.view-editor__textarea{padding:0}}}";

const STORAGE_KEY = "rs-editor-state";
const DEFAULT_CONTENT = "# New Document\n\nStart writing here...";
class EditorView {
  id = "editor";
  name = "Editor";
  icon = "pencil";
  options;
  shellContext;
  element = null;
  contentRef = ref("");
  stateManager = createViewState(STORAGE_KEY);
  textarea = null;
  _sheet = null;
  lifecycle = {
    onMount: () => this.onMount(),
    onUnmount: () => this.saveState(),
    onShow: () => {
      this._sheet = loadAsAdopted(style);
    },
    onHide: () => {
      removeAdopted(this._sheet);
      this.saveState();
    }
  };
  constructor(options = {}) {
    this.options = options;
    this.shellContext = options.shellContext;
    const saved = this.stateManager.load();
    this.contentRef.value = options.initialContent || saved?.content || DEFAULT_CONTENT;
  }
  render(options) {
    if (options) {
      this.options = { ...this.options, ...options };
      this.shellContext = options.shellContext || this.shellContext;
    }
    this._sheet = loadAsAdopted(style);
    this.element = H`
            <div class="view-editor">
                <div class="view-editor__toolbar">
                    <div class="view-editor__toolbar-left">
                        <button class="view-editor__btn" data-action="open" type="button" title="Open file">
                            <ui-icon icon="folder-open" icon-style="duotone"></ui-icon>
                            <span>Open</span>
                        </button>
                        <button class="view-editor__btn" data-action="save" type="button" title="Save file">
                            <ui-icon icon="floppy-disk" icon-style="duotone"></ui-icon>
                            <span>Save</span>
                        </button>
                    </div>
                    <div class="view-editor__toolbar-right">
                        <button class="view-editor__btn" data-action="preview" type="button" title="Preview">
                            <ui-icon icon="eye" icon-style="duotone"></ui-icon>
                            <span>Preview</span>
                        </button>
                        <button class="view-editor__btn" data-action="copy" type="button" title="Copy all">
                            <ui-icon icon="copy" icon-style="duotone"></ui-icon>
                            <span>Copy</span>
                        </button>
                    </div>
                </div>
                <div class="view-editor__content">
                    <textarea
                        class="view-editor__textarea"
                        placeholder="Start writing markdown..."
                        data-editor-input
                    >${this.contentRef.value}</textarea>
                </div>
            </div>
        `;
    this.textarea = this.element.querySelector("[data-editor-input]");
    this.setupEventHandlers();
    return this.element;
  }
  getToolbar() {
    return null;
  }
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  setContent(content) {
    this.contentRef.value = content;
    if (this.textarea) {
      this.textarea.value = content;
    }
  }
  getContent() {
    return this.contentRef.value;
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  setupEventHandlers() {
    if (!this.element) return;
    this.textarea?.addEventListener("input", () => {
      this.contentRef.value = this.textarea?.value || "";
      this.options.onContentChange?.(this.contentRef.value);
    });
    this.element.addEventListener("click", async (e) => {
      const target = e.target;
      const button = target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      switch (action) {
        case "open":
          this.handleOpen();
          break;
        case "save":
          this.handleSave();
          break;
        case "preview":
          this.handlePreview();
          break;
        case "copy":
          await this.handleCopy();
          break;
      }
    });
    this.textarea?.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          this.handleSave();
        }
      }
    });
  }
  handleOpen() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const content = await file.text();
          this.setContent(content);
          this.options.filename = file.name;
          this.showMessage(`Opened ${file.name}`);
        } catch {
          this.showMessage("Failed to open file");
        }
      }
    };
    input.click();
  }
  handleSave() {
    const content = this.contentRef.value;
    const filename = this.options.filename || "document.md";
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 250);
    this.options.onSave?.(content);
    this.showMessage(`Saved ${filename}`);
  }
  handlePreview() {
    this.shellContext?.navigate("viewer");
  }
  async handleCopy() {
    try {
      await navigator.clipboard.writeText(this.contentRef.value);
      this.showMessage("Copied to clipboard");
    } catch {
      this.showMessage("Failed to copy");
    }
  }
  saveState() {
    this.stateManager.save({
      content: this.contentRef.value,
      filename: this.options.filename
    });
  }
  onMount() {
    console.log("[Editor] Mounted");
  }
  showMessage(message) {
    this.shellContext?.showMessage(message);
  }
  canHandleMessage(messageType) {
    return ["content-edit", "content-load"].includes(messageType);
  }
  async handleMessage(message) {
    const msg = message;
    if (msg.data?.text || msg.data?.content) {
      this.setContent(msg.data.text || msg.data.content || "");
    }
  }
}
function createView(options) {
  return new EditorView(options);
}
const createEditorView = createView;

export { EditorView, createEditorView, createView, createView as default };
//# sourceMappingURL=index13.js.map
