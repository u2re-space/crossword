import { __vitePreload } from './index.js';
import { removeAdopted, loadAsAdopted, H } from './Settings.js';

const style = "@layer view.airpad{.view-airpad{background-color:var(--view-bg,var(--color-surface,#0a0a0a));block-size:100%;color:var(--view-fg,var(--color-on-surface,#fff));display:flex;flex-direction:column}.view-airpad__content{flex:1;overflow:hidden}.view-airpad__content>.container{block-size:100%}.view-airpad__loading{align-items:center;block-size:100%;color:var(--view-fg);display:flex;flex-direction:column;gap:1rem;justify-content:center;opacity:.6}.view-airpad__spinner{animation:airpad-spin .8s linear infinite;block-size:32px;border:3px solid #fff3;border-radius:50%;border-top:3px solid var(--color-primary,#3794ff);inline-size:32px}.view-airpad__error{align-items:center;block-size:100%;display:flex;flex-direction:column;gap:1rem;justify-content:center;padding:2rem;text-align:center}.view-airpad__error p{margin:0}.view-airpad__error p:first-child{color:#f55;font-size:1.125rem;font-weight:600}.view-airpad__error button{background-color:var(--color-primary,#3794ff);border:none;border-radius:6px;color:#fff;cursor:pointer;padding:.5rem 1rem}.view-airpad__error button:hover{filter:brightness(1.1)}.view-airpad__error-detail{font-size:.875rem;max-inline-size:400px;opacity:.6}}";

"use strict";
class AirpadView {
  id = "airpad";
  name = "Airpad";
  icon = "hand-pointing";
  options;
  shellContext;
  element = null;
  initialized = false;
  _sheet = null;
  lifecycle = {
    onMount: () => this.initAirpad(),
    onUnmount: () => this.cleanup(),
    onShow: () => {
      this._sheet = loadAsAdopted(style);
    },
    onHide: () => {
      removeAdopted(this._sheet);
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
            <div class="view-airpad">
                <div class="view-airpad__content" data-airpad-content>
                    <div class="view-airpad__loading">
                        <div class="view-airpad__spinner"></div>
                        <span>Loading Airpad...</span>
                    </div>
                </div>
            </div>
        `;
    this.initAirpad();
    return this.element;
  }
  getToolbar() {
    return null;
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  async initAirpad() {
    if (this.initialized) return;
    const content = this.element?.querySelector("[data-airpad-content]");
    if (!content) return;
    try {
      const { default: mountAirpad } = await __vitePreload(async () => { const { default: mountAirpad } = await import('./main.js');return { default: mountAirpad }},true              ?[]:void 0,import.meta.url);
      content.innerHTML = "";
      await mountAirpad(content);
      this.initialized = true;
    } catch (error) {
      console.error("[Airpad] Failed to initialize:", error);
      content.innerHTML = `
                <div class="view-airpad__error">
                    <p>Failed to load Airpad</p>
                    <p class="view-airpad__error-detail">${String(error)}</p>
                    <button type="button" data-action="retry">Try Again</button>
                </div>
            `;
      content.querySelector("[data-action=retry]")?.addEventListener("click", () => {
        this.initialized = false;
        this.initAirpad();
      });
    }
  }
  cleanup() {
    this.initialized = false;
  }
  canHandleMessage() {
    return false;
  }
  async handleMessage() {
  }
}
function createView(options) {
  return new AirpadView(options);
}
const createAirpadView = createView;

export { AirpadView, createAirpadView, createView, createView as default };
//# sourceMappingURL=index10.js.map
