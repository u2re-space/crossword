import{observe as e,loadAsAdopted as t,removeAdopted as i,H as o}from"./Settings.js";import"./Env.js";const r='@layer view.history{:is(html,body):has([data-view=history]){--view-layout:"flex";--view-content-max-width:1000px}.view-history{background-color:var(--view-bg,var(--color-surface,#fff));block-size:100%;color:var(--view-fg,var(--color-on-surface,#1a1a1a));display:flex;flex-direction:column;padding:1.5rem}.view-history__header{align-items:center;display:flex;justify-content:space-between;margin-block-end:1.5rem}.view-history__header h1{font-size:1.5rem;font-weight:700;margin:0}.view-history__clear-btn{align-items:center;background:#0000;border:none;border-radius:6px;color:#d32f2f;cursor:pointer;display:flex;font-size:.8125rem;font-weight:500;gap:.5rem;padding:.5rem .75rem}.view-history__clear-btn:hover{background-color:#d32f2f1a}.view-history__list{flex:1;overflow-y:auto}.view-history__empty{align-items:center;block-size:100%;color:var(--view-fg);display:flex;flex-direction:column;gap:1rem;justify-content:center;opacity:.4}.view-history__empty p{font-size:1rem;margin:0}.view-history__item{background-color:var(--view-item-bg,#00000005);border-inline-start:3px solid var(--color-primary,#007acc);border-radius:8px;margin-block-end:.75rem;padding:1rem}.view-history__item.error{border-inline-start-color:#d32f2f}.view-history__item-header{align-items:center;display:flex;justify-content:space-between;margin-block-end:.5rem}.view-history__item-action{font-size:.875rem;font-weight:600}.view-history__item-time{color:var(--view-fg);font-size:.75rem;opacity:.6}.view-history__item-desc{color:var(--view-fg);font-size:.875rem;margin:0;opacity:.8}.view-history__item-error{color:#d32f2f;font-size:.8125rem;margin:.5rem 0 0}.view-history__item-actions{display:flex;gap:.5rem;margin-block-start:.75rem}.view-history__action-btn{align-items:center;background-color:#0000000d;border:none;border-radius:4px;color:var(--view-fg);cursor:pointer;display:flex;font-size:.75rem;gap:.375rem;padding:.375rem .625rem}.view-history__action-btn:hover{background-color:#0000001a}}',s="rs-history";class n{id="history";name="History";icon="clock-counter-clockwise";options;shellContext;element=null;entries=e([]);_sheet=null;lifecycle={onMount:()=>{this.loadHistory(),this._sheet??=t(r)},onUnmount:()=>{i(this._sheet)},onShow:()=>{this._sheet??=t(r),this.loadHistory()}};constructor(e={}){this.options=e,this.shellContext=e.shellContext}render(e){return e&&(this.options={...this.options,...e},this.shellContext=e.shellContext||this.shellContext),this._sheet=t(r),this.loadHistory(),this.element=o`
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
        `,this.setupEventHandlers(),this.element}getToolbar(){return null}renderEntries(){if(0===this.entries.length)return o`
                <div class="view-history__empty">
                    <ui-icon icon="clock-counter-clockwise" icon-style="duotone" size="48"></ui-icon>
                    <p>No history yet</p>
                </div>
            `;const e=document.createDocumentFragment();for(const t of[...this.entries].reverse()){const i=o`
                <div class="view-history__item ${t.ok?"":"error"}" data-entry="${t.id}">
                    <div class="view-history__item-header">
                        <span class="view-history__item-action">${t.action}</span>
                        <span class="view-history__item-time">${this.formatTime(t.timestamp)}</span>
                    </div>
                    <p class="view-history__item-desc">${t.description}</p>
                    ${t.error?o`<p class="view-history__item-error">${t.error}</p>`:""}
                    ${t.content?o`
                        <div class="view-history__item-actions">
                            <button class="view-history__action-btn" data-action="copy" data-id="${t.id}" type="button">
                                <ui-icon icon="copy" icon-style="duotone" size="14"></ui-icon>
                                Copy
                            </button>
                            <button class="view-history__action-btn" data-action="view" data-id="${t.id}" type="button">
                                <ui-icon icon="eye" icon-style="duotone" size="14"></ui-icon>
                                View
                            </button>
                        </div>
                    `:""}
                </div>
            `;e.appendChild(i)}return e}setupEventHandlers(){this.element&&this.element.addEventListener("click",async e=>{const t=e.target.closest("[data-action]");if(!t)return;const i=t.dataset.action,o=t.dataset.id;if("clear"===i)this.clearHistory();else if("copy"===i&&o){const e=this.entries.find(e=>e.id===o);if(e?.content)try{await navigator.clipboard.writeText(e.content),this.showMessage("Copied to clipboard")}catch{this.showMessage("Failed to copy")}}else if("view"===i&&o){const e=this.entries.find(e=>e.id===o);e?.content&&this.shellContext?.navigate("viewer",{content:e.content})}})}loadHistory(){const e=function(e,t){try{const i=localStorage.getItem(e);return null===i?t:JSON.parse(i)}catch{return t}}(s,[]);this.entries.length=0,this.entries.push(...e),this.updateList()}clearHistory(){this.entries.length=0,function(e,t){try{return localStorage.setItem(e,JSON.stringify(t)),!0}catch{return!1}}(s,[]),this.updateList(),this.showMessage("History cleared")}updateList(){const e=this.element?.querySelector("[data-history-list]");if(!e)return;e.replaceChildren();const t=this.renderEntries();"string"!=typeof t&&e.appendChild(t)}formatTime(e){const t=new Date(e),i=new Date;return t.toDateString()===i.toDateString()?t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):t.toLocaleDateString([],{month:"short",day:"numeric"})+" "+t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}showMessage(e){this.shellContext?.showMessage(e)}canHandleMessage(){return!1}async handleMessage(){}}function a(e){return new n(e)}const c=a;export{n as HistoryView,c as createHistoryView,a as createView,a as default};
