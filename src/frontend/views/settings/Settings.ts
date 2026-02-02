//@ts-ignore
import style from "./Settings.scss?inline";

import { H } from "fest/lure";
import { loadSettings, saveSettings } from "@rs-com/config/Settings";
import type { AppSettings } from "@rs-com/config/SettingsTypes";
import { createCustomInstructionsEditor } from "../../items/CustomInstructionsEditor";
import { loadAsAdopted } from "fest/dom";

export type SettingsViewOptions = {
    isExtension: boolean;
    onTheme?: (theme: AppSettings["appearance"] extends { theme?: infer T } ? (T extends string ? T : "auto") : "auto") => void;
};

export const createSettingsView = (opts: SettingsViewOptions) => {
    loadAsAdopted(style)
    const root = H`<div class="basic-settings">
    <h2>Settings</h2>

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
      <div data-custom-instructions></div>
    </section>

    <section class="card">
      <h3>Appearance</h3>
      <label class="field">
        <span>Theme</span>
        <select class="form-select" data-field="appearance.theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </label>
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
  </div>` as HTMLElement;

    const field = (sel: string) => root.querySelector(sel) as HTMLInputElement | HTMLSelectElement | null;
    const note = root.querySelector("[data-note]") as HTMLElement | null;

    const apiUrl = field('[data-field="ai.baseUrl"]') as HTMLInputElement | null;
    const apiKey = field('[data-field="ai.apiKey"]') as HTMLInputElement | null;
    const showKey = field('[data-field="ui.showKey"]') as HTMLInputElement | null;
    const mode = field('[data-field="ai.shareTargetMode"]') as HTMLSelectElement | null;
    const autoProcessShared = field('[data-field="ai.autoProcessShared"]') as HTMLInputElement | null;
    const responseLanguage = field('[data-field="ai.responseLanguage"]') as HTMLSelectElement | null;
    const translateResults = field('[data-field="ai.translateResults"]') as HTMLInputElement | null;
    const generateSvgGraphics = field('[data-field="ai.generateSvgGraphics"]') as HTMLInputElement | null;
    const theme = field('[data-field="appearance.theme"]') as HTMLSelectElement | null;
    const ntpEnabled = field('[data-field="core.ntpEnabled"]') as HTMLInputElement | null;
    const extSection = root.querySelector('[data-section="extension"]') as HTMLElement | null;

    const setNote = (t: string) => {
        if (!note) return;
        note.textContent = t;
        if (t) setTimeout(() => (note.textContent = ""), 1500);
    };

    void loadSettings()
        .then((s) => {
            if (apiUrl) apiUrl.value = (s?.ai?.baseUrl || "").trim();
            if (apiKey) apiKey.value = (s?.ai?.apiKey || "").trim();
            if (mode) mode.value = (s?.ai?.shareTargetMode || "recognize") as any;
            if (autoProcessShared) autoProcessShared.checked = (s?.ai?.autoProcessShared ?? true) !== false;
            if (responseLanguage) responseLanguage.value = (s?.ai?.responseLanguage || "auto") as any;
            if (translateResults) translateResults.checked = Boolean(s?.ai?.translateResults);
            if (generateSvgGraphics) generateSvgGraphics.checked = Boolean(s?.ai?.generateSvgGraphics);
            if (theme) theme.value = (s?.appearance?.theme || "auto") as any;
            if (ntpEnabled) ntpEnabled.checked = Boolean(s?.core?.ntpEnabled);
            opts.onTheme?.((theme?.value as any) || "auto");
        })
        .catch(() => void 0);

    showKey?.addEventListener("change", () => {
        if (!apiKey || !showKey) return;
        apiKey.type = showKey.checked ? "text" : "password";
    });

    theme?.addEventListener("change", () => {
        opts.onTheme?.((theme.value as any) || "auto");
    });

    root.addEventListener("click", (e) => {
        const t = e.target as HTMLElement | null;
        const btn = t?.closest?.('button[data-action="save"]') as HTMLButtonElement | null;
        if (!btn) return;

        void (async () => {
            const next: AppSettings = {
                ai: {
                    baseUrl: apiUrl?.value?.trim?.() || "",
                    apiKey: apiKey?.value?.trim?.() || "",
                    shareTargetMode: (mode?.value as any) || "recognize",
                    autoProcessShared: (autoProcessShared?.checked ?? true) !== false,
                    responseLanguage: (responseLanguage?.value as any) || "auto",
                    translateResults: Boolean(translateResults?.checked),
                    generateSvgGraphics: Boolean(generateSvgGraphics?.checked),
                },
                core: {
                    ntpEnabled: Boolean(ntpEnabled?.checked),
                },
                appearance: {
                    theme: (theme?.value as any) || "auto",
                },
            };
            await saveSettings(next);
            setNote("Saved.");
        })().catch((err) => setNote(String(err)));
    });

    if (opts.isExtension) {
        if (extSection) extSection.hidden = false;
        const extNote = H`<div class="ext-note">Extension mode: settings are stored in <code>chrome.storage.local</code>.</div>` as HTMLElement;
        root.append(extNote);
    }

    const instructionsContainer = root.querySelector("[data-custom-instructions]") as HTMLElement | null;
    if (instructionsContainer) {
        const instructionsEditor = createCustomInstructionsEditor({
            onUpdate: () => setNote("Instructions updated.")
        });
        instructionsContainer.append(instructionsEditor);
    }

    return root;
};


