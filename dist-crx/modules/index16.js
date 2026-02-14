import { observe, H, loadSettings, loadAsAdopted, saveSettings, ref, removeAdopted } from './Settings.js';
import './Env.js';
import { applyTheme } from './crx-entry.js';
import { addInstruction, addInstructions, setActiveInstruction, deleteInstruction, updateInstruction } from './CustomInstructions.js';
import { DEFAULT_INSTRUCTION_TEMPLATES } from './templates.js';
import './UnifiedMessaging.js';

const settingsStyles = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer tokens, base, layout, components, utilities, overrides;@layer tokens{:root:has([data-view=settings]),html:has([data-view=settings]){--view-layout:\"flex\";--view-sidebar-visible:true;--view-padding:var(--space-6);--view-content-max-width:640px;--view-section-gap:var(--space-8);--view-field-gap:var(--space-4);--view-label-color:var(--color-text-secondary)}}@layer components{.view-settings{background-color:var(--view-bg,var(--color-surface,#fff));block-size:100%;color:var(--view-fg,var(--color-on-surface,#1a1a1a));display:flex;flex-direction:column;gap:var(--space-xl);inline-size:100%;margin-inline:auto;max-block-size:100%;overflow:auto;padding:var(--space-lg);scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin;text-align:start}@supports (justify-content:safe center){.view-settings{align-content:safe center;align-items:safe center;justify-content:safe center;justify-items:safe center}}@supports not (justify-content:safe center){.view-settings{align-items:stretch;justify-content:flex-start}}.view-settings :where(select,input,textarea,option){pointer-events:auto}.view-settings h2{color:var(--color-on-surface);font-size:var(--text-xl,20px);font-weight:var(--font-weight-bold,700);letter-spacing:-.02em;margin:0}.view-settings .card{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg,12px);display:flex;flex-direction:column;gap:var(--spacing-md,12px);inline-size:stretch;padding:var(--spacing-md,16px)}@container (max-inline-size: 480px){.view-settings .card{gap:var(--spacing-sm,10px);padding:var(--spacing-sm,10px)}}.view-settings .card h3{color:var(--color-on-surface);font-size:var(--text-base,15px);font-weight:var(--font-weight-bold,700);letter-spacing:-.01em;margin:0}.view-settings .field{display:grid;font-size:var(--text-xs,12px);gap:var(--spacing-xs,6px);inline-size:stretch}.view-settings .field>span{color:var(--color-on-surface-variant);font-size:var(--text-xs,12px);opacity:.85}.view-settings .field.checkbox{align-items:center;gap:var(--spacing-sm,10px);grid-auto-columns:max-content 1fr;grid-auto-flow:column}.view-settings .actions{align-items:center;display:flex;gap:var(--spacing-sm,10px);padding-block-start:var(--spacing-sm,8px)}.view-settings .btn{background:#0000;border:1px solid var(--color-outline-variant);border-radius:var(--radius-md,10px);color:var(--color-on-surface);cursor:pointer;font-family:inherit;font-size:var(--text-sm,13px);font-weight:var(--font-weight-medium,500);padding:var(--spacing-xs,8px) var(--spacing-lg,20px);transition:all var(--motion-fast)}.view-settings .btn:hover{background:color-mix(in oklab,var(--color-on-surface) 5%,#0000)}.view-settings .btn.primary{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary,#fff)}.view-settings .btn.primary:hover{filter:brightness(1.1)}.view-settings .ext-note,.view-settings .note{color:var(--color-on-surface-variant);font-size:var(--text-xs,12px);opacity:.9}.view-settings .ext-note{opacity:.8}.view-settings .ext-note code{background:var(--color-surface-container-highest);border-radius:var(--radius-xs,4px);font-size:var(--text-xs,11px);padding:2px 4px}@container (max-inline-size: 1024px){.view-settings{gap:var(--space-lg);padding:var(--space-md)}}@container (max-inline-size: 768px){.view-settings{gap:var(--space-md);padding:var(--space-sm)}}@container (max-inline-size: 480px){.view-settings{gap:var(--space-sm);padding:var(--space-xs)}}.view-settings::-webkit-scrollbar{inline-size:6px}.view-settings::-webkit-scrollbar-thumb{background:var(--color-outline-variant);border-radius:3px}.view-settings::-webkit-scrollbar-thumb:hover{background:var(--color-outline)}.view-settings__content{inline-size:100%;max-inline-size:clamp(640px,90%,800px)}.view-settings__title{font-size:1.75rem;font-weight:var(--font-weight-bold,700);margin:0 0 2rem}.view-settings__section{border-block-end:1px solid var(--view-border,#0000001a);display:flex;flex-direction:column;margin-block-end:2rem;padding-block-end:2rem}.view-settings__section:last-of-type{border-block-end:none}.view-settings__section h2{color:var(--view-fg);font-size:1.125rem;font-weight:var(--font-weight-semibold,600);margin:0 0 1rem}.view-settings__group{display:flex;flex-direction:column;gap:1rem}.view-settings__label{display:flex;flex-direction:column;gap:.375rem}.view-settings__label>span{font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500)}.view-settings__actions{display:flex;gap:.75rem;margin-block-start:2rem}.view-settings__btn{background:#0000;border:1px solid var(--view-border,#00000026);border-radius:var(--radius-sm,6px);color:var(--view-fg);cursor:pointer;font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500);padding:.625rem 1.25rem;transition:background-color var(--motion-fast)}.view-settings__btn:hover{background-color:#0000000d}.view-settings__btn--primary{background-color:var(--color-primary,#007acc);border-color:var(--color-primary,#007acc);color:#fff}.view-settings__btn--primary:hover{filter:brightness(1.1)}.settings-group{display:grid;gap:var(--space-lg);grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.settings-section{background:var(--color-surface-container-high);border-radius:var(--radius-xl);box-shadow:var(--elev-2);overflow:hidden;padding:var(--space-xl);position:relative;transition:all var(--motion-normal)}@container (max-inline-size: 1024px){.settings-section{border-radius:var(--radius-lg);padding:var(--space-lg)}}@container (max-inline-size: 768px){.settings-section{padding:var(--space-md)}}@container (max-inline-size: 480px){.settings-section{border-radius:var(--radius-md);padding:var(--space-sm)}}.settings-section:hover{box-shadow:var(--elev-3);transform:translateY(-2px)}@media (prefers-reduced-motion:reduce){.settings-section:hover{transform:none}}.settings-section:before{background:linear-gradient(135deg,color-mix(in oklab,var(--color-tertiary) 2%,#0000) 0,#0000 100%);border-radius:inherit;content:\"\";inset:0;pointer-events:none;position:absolute}.settings-section>*{position:relative;z-index:1}.settings-section .settings-header{margin-block-end:var(--space-lg);padding-block-end:var(--space-md)}.settings-section .settings-header h3{align-items:center;color:var(--color-on-surface);display:flex;font-size:var(--text-lg);font-weight:var(--font-weight-semibold);gap:var(--space-sm);margin:0}@container (max-inline-size: 768px){.settings-section .settings-header h3{font-size:var(--text-base)}}.settings-section .settings-header h3 ui-icon{margin-inline-end:var(--space-sm);opacity:.7}.settings-section .form-group{margin-block-end:var(--space-lg)}.settings-section .form-group:last-child{margin-block-end:0}.settings-section .form-group label{color:var(--color-on-surface);display:block;font-size:var(--text-sm);font-weight:var(--font-weight-medium);margin-block-end:var(--space-sm)}.settings-section .form-group textarea{font-family:var(--font-family-mono);min-block-size:100px;resize:vertical}.settings-section .settings-actions{display:flex;gap:var(--space-md);justify-content:flex-end;margin-block-start:var(--space-xl);padding-block-start:var(--space-lg)}@container (max-inline-size: 768px){.settings-section .settings-actions{flex-direction:column;gap:var(--space-sm)}}.settings-section .settings-actions .action-btn{background:var(--color-surface-container-high);border:none;border-radius:var(--radius-lg);color:var(--color-on-surface);cursor:pointer;font-size:var(--text-sm);font-weight:var(--font-weight-semibold);min-block-size:44px;padding-block:var(--space-xl);padding-inline:var(--space-sm);transition:all var(--motion-fast)}.settings-section .settings-actions .action-btn:hover{background:var(--color-surface-container-highest);box-shadow:var(--elev-1);transform:translateY(-1px)}.settings-section .settings-actions .action-btn:active{box-shadow:none;transform:translateY(0)}.settings-section .settings-actions .action-btn.primary{background:var(--color-tertiary);color:var(--color-on-tertiary)}.settings-section .settings-actions .action-btn.primary:hover{background:color-mix(in oklab,var(--color-tertiary) 85%,#000)}}";

const createCustomInstructionsEditor = (opts = {}) => {
  const state = observe({
    instructions: [],
    activeId: "",
    editingId: null,
    newLabel: "",
    newInstruction: "",
    isAdding: false
  });
  const root = H`<div class="custom-instructions-editor">
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
    </div>`;
  const listEl = root.querySelector("[data-list]");
  const selectEl = root.querySelector("[data-action='select-active']");
  const addFormEl = root.querySelector("[data-add-form]");
  const labelInput = root.querySelector("[data-field='label']");
  const instructionInput = root.querySelector("[data-field='instruction']");
  const renderList = () => {
    listEl.replaceChildren();
    if (!state.instructions.length) {
      listEl.append(H`<div class="ci-empty">No custom instructions. Add one or use templates.</div>`);
      return;
    }
    for (const instr of state.instructions) {
      const isEditing = state.editingId === instr.id;
      const isActive = state.activeId === instr.id;
      const item = H`<div class="ci-item ${isActive ? "active" : ""}" data-id="${instr.id}">
                <div class="ci-item-header">
                    <span class="ci-item-label">${instr.label}</span>
                    <div class="ci-item-actions">
                        ${isActive ? H`<span class="ci-badge active">Active</span>` : H`<button class="btn tiny" type="button" data-action="activate">Use</button>`}
                        <button class="btn tiny" type="button" data-action="edit">Edit</button>
                        <button class="btn tiny danger" type="button" data-action="delete">×</button>
                    </div>
                </div>
                ${isEditing ? H`<div class="ci-edit-form">
                        <input type="text" class="ci-input" data-edit-field="label" value="${instr.label}" />
                        <textarea class="ci-textarea" data-edit-field="instruction" rows="4">${instr.instruction}</textarea>
                        <div class="ci-edit-actions">
                            <button class="btn small primary" type="button" data-action="save-edit">Save</button>
                            <button class="btn small" type="button" data-action="cancel-edit">Cancel</button>
                        </div>
                    </div>` : H`<div class="ci-item-preview">${truncate(instr.instruction, 120)}</div>`}
            </div>`;
      item.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.closest("[data-action]")?.getAttribute("data-action");
        if (action === "activate") {
          void setActiveInstruction(instr.id).then(() => {
            state.activeId = instr.id;
            renderList();
            updateSelect();
            opts.onUpdate?.();
          });
        }
        if (action === "edit") {
          state.editingId = instr.id;
          renderList();
        }
        if (action === "delete") {
          if (confirm(`Delete "${instr.label}"?`)) {
            void deleteInstruction(instr.id).then(() => {
              state.instructions = state.instructions.filter((i) => i.id !== instr.id);
              if (state.activeId === instr.id) state.activeId = "";
              renderList();
              updateSelect();
              opts.onUpdate?.();
            });
          }
        }
        if (action === "save-edit") {
          const labelEl = item.querySelector("[data-edit-field='label']");
          const instrEl = item.querySelector("[data-edit-field='instruction']");
          void updateInstruction(instr.id, {
            label: labelEl.value.trim() || instr.label,
            instruction: instrEl.value.trim()
          }).then(() => {
            instr.label = labelEl.value.trim() || instr.label;
            instr.instruction = instrEl.value.trim();
            state.editingId = null;
            renderList();
            updateSelect();
            opts.onUpdate?.();
          });
        }
        if (action === "cancel-edit") {
          state.editingId = null;
          renderList();
        }
      });
      listEl.append(item);
    }
  };
  const updateSelect = () => {
    selectEl.replaceChildren();
    selectEl.append(H`<option value="">None (use default)</option>`);
    for (const instr of state.instructions) {
      const opt = H`<option value="${instr.id}">${instr.label}</option>`;
      if (instr.id === state.activeId) opt.selected = true;
      selectEl.append(opt);
    }
  };
  const truncate = (text, maxLen) => {
    if (!text || text.length <= maxLen) return text || "";
    return text.slice(0, maxLen).trim() + "…";
  };
  const loadData = async () => {
    const settings = await loadSettings();
    state.instructions = settings?.ai?.customInstructions || [];
    state.activeId = settings?.ai?.activeInstructionId || "";
    renderList();
    updateSelect();
  };
  root.addEventListener("click", (e) => {
    const target = e.target;
    const action = target.closest("[data-action]")?.getAttribute("data-action");
    if (action === "add") {
      state.isAdding = true;
      addFormEl.hidden = false;
      labelInput.value = "";
      instructionInput.value = "";
      labelInput.focus();
    }
    if (action === "cancel-add") {
      state.isAdding = false;
      addFormEl.hidden = true;
    }
    if (action === "save-new") {
      const label = labelInput.value.trim();
      const instruction = instructionInput.value.trim();
      if (!instruction) {
        instructionInput.focus();
        return;
      }
      void addInstruction(label || "Custom", instruction).then((newInstr) => {
        state.instructions.push(newInstr);
        state.isAdding = false;
        addFormEl.hidden = true;
        renderList();
        updateSelect();
        opts.onUpdate?.();
      });
    }
    if (action === "add-templates") {
      const existingLabels = new Set(state.instructions.map((i) => i.label));
      const templatesToAdd = DEFAULT_INSTRUCTION_TEMPLATES.filter((t) => !existingLabels.has(t.label));
      if (!templatesToAdd.length) {
        alert("All templates are already added.");
        return;
      }
      addInstructions(templatesToAdd.map((t) => ({
        label: t.label,
        instruction: t.instruction,
        enabled: t.enabled
      }))).then((newInstrs) => {
        state.instructions.push(...newInstrs);
        renderList();
        updateSelect();
        opts.onUpdate?.();
      });
    }
  });
  selectEl.addEventListener("change", () => {
    const newActiveId = selectEl.value || "";
    void setActiveInstruction(newActiveId || null).then(() => {
      state.activeId = newActiveId;
      renderList();
      opts.onUpdate?.();
    });
  });
  void loadData();
  return root;
};

const createSettingsView = (opts) => {
  loadAsAdopted(settingsStyles);
  const root = H`<div class="view-settings">
    <h2>Settings</h2>

    <section class="card">
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

    <section class="card">
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

    <section class="card" data-section="instructions">
      <h3>Recognition Instructions</h3>
      <div data-custom-instructions="editor">
        ${createCustomInstructionsEditor({ onUpdate: () => setNote("Instructions updated.") })}
      </div>
    </section>

    <section class="card" data-section="extension" hidden>
      <h3>Extension</h3>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="core.ntpEnabled" />
        <span>Enable New Tab Page (offline Basic)</span>
      </label>
    </section>

    <section class="actions">
      <button class="btn primary" type="button" data-action="save">Save</button>
      <span class="note" data-note></span>
    </section>
  </div>`;
  const field = (sel) => root.querySelector(sel);
  const note = root.querySelector("[data-note]");
  const apiUrl = field('[data-field="ai.baseUrl"]');
  const apiKey = field('[data-field="ai.apiKey"]');
  const showKey = field('[data-field="ui.showKey"]');
  const mode = field('[data-field="ai.shareTargetMode"]');
  const autoProcessShared = field('[data-field="ai.autoProcessShared"]');
  const responseLanguage = field('[data-field="ai.responseLanguage"]');
  const translateResults = field('[data-field="ai.translateResults"]');
  const generateSvgGraphics = field('[data-field="ai.generateSvgGraphics"]');
  const theme = field('[data-field="appearance.theme"]');
  const fontSize = field('[data-field="appearance.fontSize"]');
  const ntpEnabled = field('[data-field="core.ntpEnabled"]');
  root.querySelector('[data-section="extension"]');
  const setNote = (t) => {
    if (!note) return;
    note.textContent = t;
    if (t) setTimeout(() => note.textContent = "", 1500);
  };
  void loadSettings().then((s) => {
    if (apiUrl) apiUrl.value = (s?.ai?.baseUrl || "").trim();
    if (apiKey) apiKey.value = (s?.ai?.apiKey || "").trim();
    if (mode) mode.value = s?.ai?.shareTargetMode || "recognize";
    if (autoProcessShared) autoProcessShared.checked = (s?.ai?.autoProcessShared ?? true) !== false;
    if (responseLanguage) responseLanguage.value = s?.ai?.responseLanguage || "auto";
    if (translateResults) translateResults.checked = Boolean(s?.ai?.translateResults);
    if (generateSvgGraphics) generateSvgGraphics.checked = Boolean(s?.ai?.generateSvgGraphics);
    if (theme) theme.value = s?.appearance?.theme || "auto";
    if (fontSize) fontSize.value = s?.appearance?.fontSize || "medium";
    if (ntpEnabled) ntpEnabled.checked = Boolean(s?.core?.ntpEnabled);
    opts.onTheme?.(theme?.value || "auto");
  }).catch(() => void 0);
  showKey?.addEventListener("change", () => {
    if (!apiKey || !showKey) return;
    apiKey.type = showKey.checked ? "text" : "password";
  });
  theme?.addEventListener("change", () => {
    opts.onTheme?.(theme.value || "auto");
  });
  root.addEventListener("click", (e) => {
    const t = e.target;
    const btn = t?.closest?.('button[data-action="save"]');
    if (!btn) return;
    void (async () => {
      const next = {
        ai: {
          baseUrl: apiUrl?.value?.trim?.() || "",
          apiKey: apiKey?.value?.trim?.() || "",
          shareTargetMode: mode?.value || "recognize",
          autoProcessShared: (autoProcessShared?.checked ?? true) !== false,
          responseLanguage: responseLanguage?.value || "auto",
          translateResults: Boolean(translateResults?.checked),
          generateSvgGraphics: Boolean(generateSvgGraphics?.checked)
        },
        core: {
          ntpEnabled: Boolean(ntpEnabled?.checked)
        },
        appearance: {
          theme: theme?.value || "auto",
          fontSize: fontSize?.value || "medium"
        }
      };
      const saved = await saveSettings(next);
      applyTheme(saved);
      opts.onTheme?.(saved.appearance?.theme || "auto");
      setNote("Saved.");
    })().catch((err) => setNote(String(err)));
  });
  return root;
};

const defaultSettings = {
  appearance: { theme: "auto", fontSize: "medium" },
  ai: { autoProcess: true },
  general: { autosave: true, notifications: true }
};
class SettingsView {
  id = "settings";
  name = "Settings";
  icon = "gear";
  options;
  shellContext;
  element = null;
  settings = ref(defaultSettings);
  _sheet = null;
  lifecycle = {
    onMount: () => {
      this._sheet ??= loadAsAdopted(settingsStyles);
    },
    onUnmount: () => {
      removeAdopted(this._sheet);
    },
    onShow: () => {
      this._sheet ??= loadAsAdopted(settingsStyles);
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
    this._sheet = loadAsAdopted(settingsStyles);
    this.loadSettings();
    this.element = createSettingsView({
      isExtension: false,
      onTheme: (theme) => {
        const nextTheme = theme;
        this.applyShellTheme(nextTheme);
        this.options.onThemeChange?.(nextTheme);
      }
    });
    return this.element;
  }
  getToolbar() {
    return null;
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  setupEventHandlers() {
  }
  loadSettings() {
    this.settings.value = { ...defaultSettings };
  }
  saveSettings() {
    this.options.onSettingsChange?.(this.settings.value);
  }
  resetSettings() {
    this.settings.value = { ...defaultSettings };
    this.updateUI();
  }
  updateUI() {
    if (!this.element) return;
    const inputs = this.element.querySelectorAll("[data-setting]");
    for (const input of inputs) {
      const path = input.dataset.setting;
      const [section, key] = path.split(".");
      const value = this.settings.value[section][key];
      if (input.type === "checkbox") {
        input.checked = Boolean(value);
      } else {
        input.value = value || "";
      }
    }
  }
  showMessage(message) {
    this.shellContext?.showMessage(message);
  }
  applyShellTheme(theme) {
    const root = this.element?.closest("[data-shell]");
    if (!root) return;
    const resolved = theme === "auto" ? window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light" : theme;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  }
  canHandleMessage(messageType) {
    return messageType === "settings-update";
  }
  async handleMessage(message) {
    const msg = message;
    if (msg.data) {
      this.settings.value = { ...this.settings.value, ...msg.data };
      this.updateUI();
    }
  }
}
function createView(options) {
  return new SettingsView(options);
}

export { SettingsView, createView, createView as default };
//# sourceMappingURL=index16.js.map
