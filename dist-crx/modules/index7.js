import{removeAdopted as e,loadAsAdopted as i,H as t}from"./Settings.js";import"./Env.js";import{isEnabledView as o}from"./crx-entry.js";import"./UnifiedMessaging.js";import"./templates.js";const a='@layer view.home{:root:has([data-view=home]),html:has([data-view=home]){--view-home-bg:linear-gradient(135deg,light-dark(#f8f9fa,#1b1f24),light-dark(#e9ecef,#0f1216));--view-fg:light-dark(#1a1a1a,#e9ecef);--view-border:light-dark(#00000014,#ffffff1f);--view-card-bg:light-dark(#fff,#1a1f26);--view-primary:light-dark(#007acc,#66b7ff);--view-layout:"flex";--view-padding:var(--space-8);--view-content-max-width:1200px;--view-hero-padding:var(--space-16);--view-card-gap:var(--space-6)}.view-home{align-items:center;background:var(--view-home-bg);block-size:100%;color:var(--view-fg);display:flex;justify-content:center;overflow-y:auto;padding:2rem}.view-home__content{max-inline-size:800px;text-align:center}.view-home__header{margin-block-end:3rem}.view-home__title{background:linear-gradient(135deg,var(--view-primary) 0,light-dark(#0059a6,#3a8ad6) 100%);-webkit-background-clip:text;font-size:3rem;font-weight:800;margin:0;-webkit-text-fill-color:#0000;background-clip:text}.view-home__subtitle{color:var(--view-fg);font-size:1.125rem;margin:.5rem 0 0;opacity:.7}.view-home__actions{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}.view-home__action{align-items:center;background-color:var(--view-card-bg);border:1px solid var(--view-border);border-radius:16px;color:var(--view-fg);cursor:pointer;display:flex;flex-direction:column;gap:.75rem;padding:1.5rem;text-align:center;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.view-home__action ui-icon{color:var(--view-primary);opacity:.8}.view-home__action:hover{border-color:var(--view-primary);box-shadow:0 8px 24px light-dark(#0000001a,#0006);transform:translateY(-4px)}.view-home__action:hover ui-icon{opacity:1}.view-home__action:focus-visible{outline:2px solid var(--view-primary);outline-offset:2px}.view-home__action-title{font-size:1rem;font-weight:600}.view-home__action-desc{font-size:.8125rem;opacity:.6}@media(max-width:768px){:root:has([data-view=home]),html:has([data-view=home]){--view-hero-padding:var(--space-8);--view-card-gap:var(--space-4)}}@media(max-width:480px){.view-home__actions{grid-template-columns:1fr}}}';class n{id="home";name="Home";icon="house";options;shellContext;element=null;_sheet=null;lifecycle={onShow:()=>{this._sheet=i(a)},onHide:()=>{e(this._sheet)}};constructor(e={}){this.options=e,this.shellContext=e.shellContext}render(e){return e&&(this.options={...this.options,...e},this.shellContext=e.shellContext||this.shellContext),this._sheet=i(a),this.element=t`
            <div class="view-home">
                <div class="view-home__content">
                    <div class="view-home__header">
                        <h1 class="view-home__title">CrossWord</h1>
                        <p class="view-home__subtitle">Markdown viewer, editor, and AI assistant</p>
                    </div>
                    
                    <div class="view-home__actions">
                        <button class="view-home__action" data-view="viewer" type="button">
                            <ui-icon icon="eye" icon-style="duotone" size="32"></ui-icon>
                            <span class="view-home__action-title">Viewer</span>
                            <span class="view-home__action-desc">View markdown documents</span>
                        </button>
                        
                        <button class="view-home__action" data-view="editor" type="button">
                            <ui-icon icon="pencil" icon-style="duotone" size="32"></ui-icon>
                            <span class="view-home__action-title">Editor</span>
                            <span class="view-home__action-desc">Write and edit markdown</span>
                        </button>
                        
                        <button class="view-home__action" data-view="workcenter" type="button">
                            <ui-icon icon="lightning" icon-style="duotone" size="32"></ui-icon>
                            <span class="view-home__action-title">Work Center</span>
                            <span class="view-home__action-desc">AI-powered processing</span>
                        </button>
                        
                        <button class="view-home__action" data-view="explorer" type="button">
                            <ui-icon icon="folder" icon-style="duotone" size="32"></ui-icon>
                            <span class="view-home__action-title">Explorer</span>
                            <span class="view-home__action-desc">Browse local files</span>
                        </button>
                        
                        <button class="view-home__action" data-view="airpad" type="button">
                            <ui-icon icon="hand-pointing" icon-style="duotone" size="32"></ui-icon>
                            <span class="view-home__action-title">Airpad</span>
                            <span class="view-home__action-desc">Remote trackpad control</span>
                        </button>
                        
                        <button class="view-home__action" data-view="settings" type="button">
                            <ui-icon icon="gear" icon-style="duotone" size="32"></ui-icon>
                            <span class="view-home__action-title">Settings</span>
                            <span class="view-home__action-desc">Configure the app</span>
                        </button>
                    </div>
                </div>
            </div>
        `,this.setupEventHandlers(),this.element}getToolbar(){return null}setupEventHandlers(){if(!this.element)return;this.element.querySelectorAll("[data-view]").forEach(e=>{const i=e.dataset.view||"";o(i)||e.remove()}),this.element.addEventListener("click",e=>{const i=e.target.closest("[data-view]");if(!i)return;const t=i.dataset.view;t&&o(t)&&this.shellContext?.navigate(t)})}canHandleMessage(){return!1}async handleMessage(){}}function s(e){return new n(e)}const r=s;export{n as HomeView,r as createHomeView,s as createView,s as default};
