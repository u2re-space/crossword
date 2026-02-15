import{observe as e,H as t,loadAsAdopted as a,loadSettings as i,saveSettings as n,ref as s,removeAdopted as o}from"./Settings.js";import"./Env.js";import{applyTheme as r}from"./crx-entry.js";import{addInstruction as l,addInstructions as c,setActiveInstruction as d,getInstructionRegistry as p,deleteInstruction as u,updateInstruction as g}from"./CustomInstructions.js";import{DEFAULT_INSTRUCTION_TEMPLATES as v}from"./templates.js";import"./UnifiedMessaging.js";const b='@property --client-x{initial-value:0;syntax:"<number>";inherits:true}@property --client-y{initial-value:0;syntax:"<number>";inherits:true}@property --page-x{initial-value:0;syntax:"<number>";inherits:true}@property --page-y{initial-value:0;syntax:"<number>";inherits:true}@property --sp-x{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --sp-y{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --ds-x{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --ds-y{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --rx{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --ry{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --rs-x{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --rs-y{initial-value:0px;syntax:"<length-percentage>";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --bound-block-size{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --inline-size{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --block-size{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --initial-block-size{initial-value:100%;syntax:"<length-percentage>";inherits:true}@property --scroll-coef{syntax:"<number>";initial-value:1;inherits:true}@property --scroll-size{syntax:"<number>";initial-value:0;inherits:true}@property --content-size{syntax:"<number>";initial-value:0;inherits:true}@property --max-size{syntax:"<length-percentage>";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc((l*.01 - (l*.01*(1 - (s/200))))/clamp(.0001,min(calc(l*.01*(1 - (s/200))),calc(1 - (l*.01*(1 - (s/200))))),1)*100) calc(l*1*(1 - (s/200))) /alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer tokens,base,layout,utilities,shells,shell,views,view,viewer,components,ux-layer,markdown,essentials,print,print-breaks,overrides;@layer tokens{:root:has([data-view=settings]),html:has([data-view=settings]){--view-layout:"flex";--view-sidebar-visible:true;--view-padding:var(--space-6);--view-content-max-width:640px;--view-section-gap:var(--space-8);--view-field-gap:var(--space-4);--view-label-color:var(--color-text-secondary)}}@layer components{.view-settings{background-color:var(--view-bg,var(--color-surface,#fff));block-size:100%;color:var(--view-fg,var(--color-on-surface,#1a1a1a));display:flex;flex-direction:column;gap:var(--space-xl);inline-size:100%;margin-inline:auto;max-block-size:100%;overflow:auto;padding:var(--space-lg);scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin;text-align:start}@supports (justify-content:safe center){.view-settings{align-content:safe center;align-items:safe center;justify-content:safe center;justify-items:safe center}}@supports not (justify-content:safe center){.view-settings{align-items:stretch;justify-content:flex-start}}.view-settings{justify-content:start}.view-settings :where(select,input,textarea,option){pointer-events:auto}.view-settings h2{color:var(--color-on-surface);font-size:var(--text-xl,20px);font-weight:var(--font-weight-bold,700);letter-spacing:-.02em;margin:0}.view-settings h3{text-align:start}.view-settings .card{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg,12px);display:flex;flex-direction:column;gap:var(--spacing-md,12px);inline-size:stretch;padding:var(--spacing-md,16px)}@container (max-inline-size: 480px){.view-settings .card{gap:var(--spacing-sm,10px);padding:var(--spacing-sm,10px)}}.view-settings .card h3{color:var(--color-on-surface);font-size:var(--text-base,15px);font-weight:var(--font-weight-bold,700);letter-spacing:-.01em;margin:0}.view-settings .card .form-select{inline-size:stretch}.view-settings .field{display:grid;flex-direction:column;font-size:var(--text-xs,12px);gap:var(--spacing-xs,6px);grid-auto-flow:row;inline-size:stretch}.view-settings .field>span{color:var(--color-on-surface-variant);font-size:var(--text-xs,12px);opacity:.85}.view-settings .field.checkbox{align-items:center;gap:var(--spacing-sm,10px);grid-auto-columns:max-content 1fr;grid-auto-flow:column}.view-settings .actions{align-items:center;display:flex;flex-direction:row;flex-wrap:wrap;gap:var(--space-sm);inline-size:stretch;padding-block-start:var(--spacing-sm,8px);place-content:center;justify-content:space-between;place-items:center}.view-settings .actions h2{flex-basis:fit-content;flex-grow:1;flex-shrink:1;margin-inline-end:var(--spacing-sm,10px);padding-inline:var(--spacing-md,16px);text-align:end}.view-settings .settings-tab-actions{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-xs)}.view-settings .settings-tab-btn{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm,8px);color:var(--color-on-surface-variant);cursor:pointer;font-size:var(--text-xs,12px);font-weight:var(--font-weight-medium,500);padding:var(--spacing-xs,8px) var(--spacing-sm,12px);transition:all var(--motion-fast)}.view-settings .settings-tab-btn:hover{background:var(--color-surface-container);color:var(--color-on-surface)}.view-settings .settings-tab-btn.is-active{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary)}.view-settings .settings-tab-panel{display:none}.view-settings .settings-tab-panel.is-active{display:flex}.view-settings .btn{background:#0000;border:1px solid var(--color-outline-variant);border-radius:var(--radius-md,10px);color:var(--color-on-surface);cursor:pointer;font-family:inherit;font-size:var(--text-sm,13px);font-weight:var(--font-weight-medium,500);padding:var(--spacing-xs,8px) var(--spacing-lg,20px);transition:all var(--motion-fast)}.view-settings .btn:hover{background:color-mix(in oklab,var(--color-on-surface) 5%,#0000)}.view-settings .btn.primary{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary,#fff)}.view-settings .btn.primary:hover{filter:brightness(1.1)}.view-settings .ext-note,.view-settings .note{color:var(--color-on-surface-variant);font-size:var(--text-xs,12px);opacity:.9}.view-settings .ext-note{opacity:.8}.view-settings .ext-note code{background:var(--color-surface-container-highest);border-radius:var(--radius-xs,4px);font-size:var(--text-xs,11px);padding:2px 4px}@container (max-inline-size: 1024px){.view-settings{gap:var(--space-lg);padding:var(--space-md)}}@container (max-inline-size: 768px){.view-settings{gap:var(--space-md);padding:var(--space-sm)}.view-settings .actions h2{display:none}.view-settings .actions .btn.primary{margin-inline-start:auto}}@container (max-inline-size: 480px){.view-settings{gap:var(--space-sm);padding:var(--space-xs)}}.view-settings::-webkit-scrollbar{inline-size:6px}.view-settings::-webkit-scrollbar-thumb{background:var(--color-outline-variant);border-radius:3px}.view-settings::-webkit-scrollbar-thumb:hover{background:var(--color-outline)}.view-settings__content{inline-size:100%;max-inline-size:clamp(640px,90%,800px)}.view-settings__title{font-size:1.75rem;font-weight:var(--font-weight-bold,700);margin:0 0 2rem}.view-settings__section{border-block-end:1px solid var(--view-border,#0000001a);display:flex;flex-direction:column;margin-block-end:2rem;padding-block-end:2rem}.view-settings__section:last-of-type{border-block-end:none}.view-settings__section h2{color:var(--view-fg);font-size:1.125rem;font-weight:var(--font-weight-semibold,600);margin:0 0 1rem}.view-settings__group{display:flex;flex-direction:column;gap:1rem}.view-settings__label{display:flex;flex-direction:column;gap:.375rem}.view-settings__label>span{font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500)}.view-settings__actions{display:flex;gap:.75rem;margin-block-start:2rem}.view-settings__btn{background:#0000;border:1px solid var(--view-border,#00000026);border-radius:var(--radius-sm,6px);color:var(--view-fg);cursor:pointer;font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500);padding:.625rem 1.25rem;transition:background-color var(--motion-fast)}.view-settings__btn:hover{background-color:#0000000d}.view-settings__btn--primary{background-color:var(--color-primary,#007acc);border-color:var(--color-primary,#007acc);color:#fff}.view-settings__btn--primary:hover{filter:brightness(1.1)}.settings-group{display:grid;gap:var(--space-lg);grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.settings-section{background:var(--color-surface-container-high);border-radius:var(--radius-xl);box-shadow:var(--elev-2);overflow:hidden;padding:var(--space-xl);position:relative;transition:all var(--motion-normal)}@container (max-inline-size: 1024px){.settings-section{border-radius:var(--radius-lg);padding:var(--space-lg)}}@container (max-inline-size: 768px){.settings-section{padding:var(--space-md)}}@container (max-inline-size: 480px){.settings-section{border-radius:var(--radius-md);padding:var(--space-sm)}}.settings-section:hover{box-shadow:var(--elev-3);transform:translateY(-2px)}@media(prefers-reduced-motion:reduce){.settings-section:hover{transform:none}}.settings-section:before{background:linear-gradient(135deg,color-mix(in oklab,var(--color-tertiary) 2%,#0000) 0,#0000);border-radius:inherit;content:"";inset:0;pointer-events:none;position:absolute}.settings-section>*{position:relative;z-index:1}.settings-section .settings-header{margin-block-end:var(--space-lg);padding-block-end:var(--space-md)}.settings-section .settings-header h3{align-items:start;color:var(--color-on-surface);display:flex;font-size:var(--text-lg);font-weight:var(--font-weight-semibold);gap:var(--space-sm);margin:0}@container (max-inline-size: 768px){.settings-section .settings-header h3{font-size:var(--text-base)}}.settings-section .settings-header h3 ui-icon{margin-inline-end:var(--space-sm);opacity:.7}.settings-section .form-group{margin-block-end:var(--space-lg)}.settings-section .form-group:last-child{margin-block-end:0}.settings-section .form-group label{color:var(--color-on-surface);display:block;font-size:var(--text-sm);font-weight:var(--font-weight-medium);margin-block-end:var(--space-sm)}.settings-section .form-group textarea{font-family:var(--font-family-mono);min-block-size:100px;resize:vertical}.settings-section .settings-actions{display:flex;gap:var(--space-md);justify-content:flex-end;margin-block-start:var(--space-xl);padding-block-start:var(--space-lg)}@container (max-inline-size: 768px){.settings-section .settings-actions{flex-direction:column;gap:var(--space-sm)}}.settings-section .settings-actions .action-btn{background:var(--color-surface-container-high);border:none;border-radius:var(--radius-lg);color:var(--color-on-surface);cursor:pointer;font-size:var(--text-sm);font-weight:var(--font-weight-semibold);min-block-size:44px;padding-block:var(--space-xl);padding-inline:var(--space-sm);transition:all var(--motion-fast)}.settings-section .settings-actions .action-btn:hover{background:var(--color-surface-container-highest);box-shadow:var(--elev-1);transform:translateY(-1px)}.settings-section .settings-actions .action-btn:active{box-shadow:none;transform:translateY(0)}.settings-section .settings-actions .action-btn.primary{background:var(--color-tertiary);color:var(--color-on-tertiary)}.settings-section .settings-actions .action-btn.primary:hover{background:color-mix(in oklab,var(--color-tertiary) 85%,#000)}}',h=(a={})=>{const i=e({instructions:[],activeId:"",editingId:null,newLabel:"",newInstruction:"",isAdding:!1}),n=t`<div class="custom-instructions-editor">
        <div class="ci-row">
            <div class="ci-header">
                <h4>Custom Instructions</h4>
                <p class="ci-desc">Define custom instructions for AI operations. These can be activated for "Recognize & Copy" and selected in the Work Center.</p>
            </div>

            <div class="ci-active-select">
                <label>
                    <span>Active instruction:</span>
                    <select class="ci-select" data-action="select-active">
                        <option value="">None (use default)</option>
                    </select>
                </label>
            </div>
        </div>

        <div class="ci-list" data-list></div>

        <div class="ci-add-form" data-add-form hidden>
            <input type="text" class="ci-input" data-field="label" placeholder="Instruction label..." />
            <textarea class="ci-textarea" data-field="instruction" placeholder="Enter your custom instruction..." rows="4"></textarea>
            <div class="ci-add-actions">
                <button class="btn small primary" type="button" data-action="save-new">Add</button>
                <button class="btn small" type="button" data-action="cancel-add">Cancel</button>
            </div>
        </div>

        <div class="ci-actions">
            <button class="btn small" type="button" data-action="add">+ Add Instruction</button>
            <button class="btn small" type="button" data-action="add-templates">Add Templates</button>
        </div>
    </div>`,s=n.querySelector("[data-list]"),o=n.querySelector("[data-action='select-active']"),r=n.querySelector("[data-add-form]"),b=n.querySelector("[data-field='label']"),h=n.querySelector("[data-field='instruction']"),m=()=>{if(s.replaceChildren(),i.instructions.length)for(const e of i.instructions){const n=i.editingId===e.id,o=i.activeId===e.id,r=t`<div class="ci-item ${o?"active":""}" data-id="${e.id}">
                <div class="ci-item-header">
                    <span class="ci-item-label">${e.label}</span>
                    <div class="ci-item-actions">
                        ${o?t`<span class="ci-badge active">Active</span>`:t`<button class="btn tiny" type="button" data-action="activate">Use</button>`}
                        <button class="btn tiny" type="button" data-action="edit">Edit</button>
                        <button class="btn tiny danger" type="button" data-action="delete">×</button>
                    </div>
                </div>
                ${n?t`<div class="ci-edit-form">
                        <input type="text" class="ci-input" data-edit-field="label" value="${e.label}" />
                        <textarea class="ci-textarea" data-edit-field="instruction" rows="4">${e.instruction}</textarea>
                        <div class="ci-edit-actions">
                            <button class="btn small primary" type="button" data-action="save-edit">Save</button>
                            <button class="btn small" type="button" data-action="cancel-edit">Cancel</button>
                        </div>
                    </div>`:t`<div class="ci-item-preview">${f(e.instruction,120)}</div>`}
            </div>`;r.addEventListener("click",t=>{const n=t.target,s=n.closest("[data-action]")?.getAttribute("data-action");if("activate"===s&&d(e.id).then(x).then(()=>a.onUpdate?.()),"edit"===s&&(i.editingId=e.id,m()),"delete"===s&&confirm(`Delete "${e.label}"?`)&&u(e.id).then(x).then(()=>a.onUpdate?.()),"save-edit"===s){const t=r.querySelector("[data-edit-field='label']"),n=r.querySelector("[data-edit-field='instruction']");g(e.id,{label:t.value.trim()||e.label,instruction:n.value.trim()}).then(()=>(i.editingId=null,x())).then(()=>a.onUpdate?.())}"cancel-edit"===s&&(i.editingId=null,m())}),s.append(r)}else s.append(t`<div class="ci-empty">No custom instructions. Add one or use templates.</div>`)},f=(e,t)=>!e||e.length<=t?e||"":e.slice(0,t).trim()+"…",x=async()=>{const e=await p();i.instructions=e.instructions,i.activeId=e.activeId,m(),(()=>{o.replaceChildren(),o.append(t`<option value="">None (use default)</option>`);for(const e of i.instructions){const a=t`<option value="${e.id}">${e.label}</option>`;e.id===i.activeId&&(a.selected=!0),o.append(a)}})()};return n.addEventListener("click",e=>{const t=e.target,n=t.closest("[data-action]")?.getAttribute("data-action");if("add"===n&&(i.isAdding=!0,r.hidden=!1,b.value="",h.value="",b.focus()),"cancel-add"===n&&(i.isAdding=!1,r.hidden=!0),"save-new"===n){const e=b.value.trim(),t=h.value.trim();if(!t)return void h.focus();l(e||"Custom",t).then(e=>{if(e)return i.isAdding=!1,r.hidden=!0,x()}).then(()=>a.onUpdate?.())}if("add-templates"===n){const e=new Set(i.instructions.map(e=>e.label.trim().toLowerCase())),t=v.filter(t=>!e.has(t.label.trim().toLowerCase()));if(!t.length)return void alert("All templates are already added.");c(t.map(e=>({label:e.label,instruction:e.instruction,enabled:e.enabled}))).then(x).then(()=>a.onUpdate?.())}}),o.addEventListener("change",()=>{const e=o.value||"";d(e||null).then(x).then(()=>a.onUpdate?.())}),x(),n},m=e=>{a(b);const s=t`<div class="view-settings">

    <section class="actions">
      <div class="settings-tab-actions" data-settings-tabs data-active-tab="ai">
        <button class="settings-tab-btn" type="button" data-action="switch-settings-tab" data-tab="appearance" aria-selected="false">Appearance</button>
        <button class="settings-tab-btn is-active" type="button" data-action="switch-settings-tab" data-tab="ai" aria-selected="true">AI</button>
        <button class="settings-tab-btn" type="button" data-action="switch-settings-tab" data-tab="instructions" aria-selected="false">Instructions</button>
        <button class="settings-tab-btn" type="button" data-action="switch-settings-tab" data-tab="extension" aria-selected="false" data-extension-tab hidden>Extension</button>
      </div>
      <span class="note" data-note></span>
      <h2>Settings</h2>
      <button class="btn primary" type="button" data-action="save">Save</button>
    </section>

    <section class="card settings-tab-panel" data-tab-panel="appearance">
      <h3>Appearance</h3>
      <label class="field">
        <span>Theme</span>
        <select class="form-select" data-field="appearance.theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
        <span>Font Size</span>
        <select class="form-select" data-field="appearance.fontSize">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>
    </section>

    <section class="card settings-tab-panel is-active" data-tab-panel="ai">
      <h3>AI</h3>
      <label class="field">
        <span>Base URL</span>
        <input class="form-input" type="url" inputmode="url" autocomplete="off" data-field="ai.baseUrl" placeholder="https://api.proxyapi.ru/openai/v1" />
      </label>
      <label class="field">
        <span>API Key</span>
        <input class="form-input" type="password" autocomplete="off" data-field="ai.apiKey" placeholder="sk-..." />
      </label>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="ui.showKey" />
        <span>Show API key</span>
      </label>
      <label class="field">
        <span>Share target mode</span>
        <select class="form-select" data-field="ai.shareTargetMode">
          <option value="recognize">Recognize and copy</option>
          <option value="analyze">Analyze and store</option>
        </select>
      </label>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="ai.autoProcessShared" />
        <span>Auto AI on Share Target / File Open (and copy to clipboard)</span>
      </label>
      <label class="field">
        <span>Response language</span>
        <select class="form-select" data-field="ai.responseLanguage">
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
          <option value="ru">Russian</option>
        </select>
      </label>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="ai.translateResults" />
        <span>Translate results</span>
      </label>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="ai.generateSvgGraphics" />
        <span>Generate SVG graphics</span>
      </label>
    </section>

    <section class="card settings-tab-panel" data-tab-panel="instructions" data-section="instructions">
      <h3>Recognition Instructions</h3>
      <div data-custom-instructions="editor">
        ${h({onUpdate:()=>k("Instructions updated.")})}
      </div>
    </section>

    <section class="card settings-tab-panel" data-tab-panel="extension" data-section="extension" hidden>
      <h3>Extension</h3>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="core.ntpEnabled" />
        <span>Enable New Tab Page (offline Basic)</span>
      </label>
    </section>
  </div>`,o=e=>s.querySelector(e),l=s.querySelector("[data-note]"),c=o('[data-field="ai.baseUrl"]'),d=o('[data-field="ai.apiKey"]'),p=o('[data-field="ui.showKey"]'),u=o('[data-field="ai.shareTargetMode"]'),g=o('[data-field="ai.autoProcessShared"]'),v=o('[data-field="ai.responseLanguage"]'),m=o('[data-field="ai.translateResults"]'),f=o('[data-field="ai.generateSvgGraphics"]'),x=o('[data-field="appearance.theme"]'),y=o('[data-field="appearance.fontSize"]'),w=o('[data-field="core.ntpEnabled"]');s.querySelector('[data-section="extension"]'),s.querySelector("[data-extension-tab]");const k=e=>{l&&(l.textContent=e,e&&setTimeout(()=>l.textContent="",1500))};return i().then(t=>{c&&(c.value=(t?.ai?.baseUrl||"").trim()),d&&(d.value=(t?.ai?.apiKey||"").trim()),u&&(u.value=t?.ai?.shareTargetMode||"recognize"),g&&(g.checked=!1!==(t?.ai?.autoProcessShared??!0)),v&&(v.value=t?.ai?.responseLanguage||"auto"),m&&(m.checked=Boolean(t?.ai?.translateResults)),f&&(f.checked=Boolean(t?.ai?.generateSvgGraphics)),x&&(x.value=t?.appearance?.theme||"auto"),y&&(y.value=t?.appearance?.fontSize||"medium"),w&&(w.checked=Boolean(t?.core?.ntpEnabled)),e.onTheme?.(x?.value||"auto")}).catch(()=>{}),p?.addEventListener("change",()=>{d&&p&&(d.type=p.checked?"text":"password")}),x?.addEventListener("change",()=>{e.onTheme?.(x.value||"auto")}),s.addEventListener("click",t=>{const a=t.target,i=a?.closest?.('button[data-action="switch-settings-tab"]');if(i)return void(e=>{const t=e,a=s.querySelector("[data-settings-tabs]");a?.setAttribute("data-active-tab",t);const i=s.querySelectorAll('[data-action="switch-settings-tab"][data-tab]');for(const s of Array.from(i)){const e=s,a=e.getAttribute("data-tab")===t;e.classList.toggle("is-active",a),e.setAttribute("aria-selected",String(a))}const n=s.querySelectorAll("[data-tab-panel]");for(const s of Array.from(n)){const e=s,a=e.getAttribute("data-tab-panel")===t;e.hidden&&a||e.classList.toggle("is-active",a)}})(i.getAttribute("data-tab")||"ai");const o=a?.closest?.('button[data-action="save"]');o&&(async()=>{const t={ai:{baseUrl:c?.value?.trim?.()||"",apiKey:d?.value?.trim?.()||"",shareTargetMode:u?.value||"recognize",autoProcessShared:!1!==(g?.checked??!0),responseLanguage:v?.value||"auto",translateResults:Boolean(m?.checked),generateSvgGraphics:Boolean(f?.checked)},core:{ntpEnabled:Boolean(w?.checked)},appearance:{theme:x?.value||"auto",fontSize:y?.value||"medium"}},a=await n(t);r(a),e.onTheme?.(a.appearance?.theme||"auto"),k("Saved.")})().catch(e=>k(String(e)))}),s},f={appearance:{theme:"auto",fontSize:"medium"},ai:{autoProcess:!0},general:{autosave:!0,notifications:!0}};class x{id="settings";name="Settings";icon="gear";options;shellContext;element=null;settings=s(f);_sheet=null;lifecycle={onMount:()=>{this._sheet??=a(b)},onUnmount:()=>{o(this._sheet)},onShow:()=>{this._sheet??=a(b)}};constructor(e={}){this.options=e,this.shellContext=e.shellContext}render(e){return e&&(this.options={...this.options,...e},this.shellContext=e.shellContext||this.shellContext),this._sheet=a(b),this.loadSettings(),this.element=m({isExtension:!1,onTheme:e=>{const t=e;this.applyShellTheme(t),this.options.onThemeChange?.(t)}}),this.element}getToolbar(){return null}setupEventHandlers(){}loadSettings(){this.settings.value={...f}}saveSettings(){this.options.onSettingsChange?.(this.settings.value)}resetSettings(){this.settings.value={...f},this.updateUI()}updateUI(){if(!this.element)return;const e=this.element.querySelectorAll("[data-setting]");for(const t of e){const e=t.dataset.setting,[a,i]=e.split("."),n=this.settings.value[a][i];"checkbox"===t.type?t.checked=Boolean(n):t.value=n||""}}showMessage(e){this.shellContext?.showMessage(e)}applyShellTheme(e){const t=this.element?.closest("[data-shell]");if(!t)return;const a="auto"===e?globalThis?.matchMedia?.("(prefers-color-scheme: dark)")?.matches?"dark":"light":e;t.dataset.theme=a,t.style.colorScheme=a}canHandleMessage(e){return"settings-update"===e}async handleMessage(e){const t=e;t.data&&(this.settings.value={...this.settings.value,...t.data},this.updateUI())}}function y(e){return new x(e)}export{x as SettingsView,y as createView,y as default};
