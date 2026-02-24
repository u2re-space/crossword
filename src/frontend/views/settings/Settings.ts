//@ts-ignore
import style from "./Settings.scss?inline";

import { H } from "fest/lure";
import { loadSettings, saveSettings } from "@rs-com/config/Settings";
import type { AppSettings, MCPConfig } from "@rs-com/config/SettingsTypes";
import { applyTheme } from "@rs-core/utils/Theme";
import { createCustomInstructionsEditor } from "../../items/CustomInstructionsEditor";
import { loadAsAdopted } from "fest/dom";

export type SettingsViewOptions = {
    isExtension: boolean;
    onTheme?: (theme: AppSettings["appearance"] extends { theme?: infer T } ? (T extends string ? T : "auto") : "auto") => void;
};

const SUPPORTED_SPEECH_LANGUAGES = ["en", "ru", "en-GB", "en-US"] as const;
type SupportedSpeechLanguage = (typeof SUPPORTED_SPEECH_LANGUAGES)[number];

const speechLanguageLabel = (lang: SupportedSpeechLanguage): string => {
    if (lang === "en") return "English (generic)";
    if (lang === "ru") return "Russian";
    if (lang === "en-GB") return "English (UK)";
    return "English (US)";
};

const normalizeSpeechLanguage = (lang: string | undefined): SupportedSpeechLanguage | null => {
    const value = (lang || "").trim();
    if (!value) return null;
    if (value === "ru" || value.startsWith("ru-")) return "ru";
    if (value === "en-GB") return "en-GB";
    if (value === "en-US") return "en-US";
    if (value === "en" || value.startsWith("en-")) return "en";
    return null;
};

const buildSpeechLanguageOptions = (): SupportedSpeechLanguage[] => {
    const ordered = new Set<SupportedSpeechLanguage>();
    const navLanguages = typeof navigator !== "undefined"
        ? [...(navigator.languages || []), navigator.language]
        : [];

    for (const navLanguage of navLanguages) {
        const normalized = normalizeSpeechLanguage(navLanguage);
        if (normalized) ordered.add(normalized);
    }
    for (const fallback of SUPPORTED_SPEECH_LANGUAGES) {
        ordered.add(fallback);
    }
    return Array.from(ordered);
};

const buildResponseLanguageOptions = (): string[] => {
    const baseline = ["ru", "en"];
    const ordered = new Set<string>(baseline);
    const navLanguages = typeof navigator !== "undefined"
        ? [...(navigator.languages || []), navigator.language]
        : [];

    for (const navLanguage of navLanguages) {
        const value = (navLanguage || "").trim();
        if (!value || value === "en" || value === "ru") continue;
        ordered.add(value);
    }

    return Array.from(ordered);
};

export const createSettingsView = (opts: SettingsViewOptions) => {
    loadAsAdopted(style)
    const root = H`<div class="view-settings">

    <section class="actions">
      <div class="settings-tab-actions" data-settings-tabs data-active-tab="ai">
        <button class="settings-tab-btn" type="button" data-action="switch-settings-tab" data-tab="appearance" aria-selected="false">Appearance</button>
        <button class="settings-tab-btn is-active" type="button" data-action="switch-settings-tab" data-tab="ai" aria-selected="true">AI</button>
        <button class="settings-tab-btn" type="button" data-action="switch-settings-tab" data-tab="mcp" aria-selected="false">MCP</button>
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
        <input placeholder="https://api.proxyapi.ru/openai/v1" class="form-input" type="url" inputmode="url" autocomplete="off" data-field="ai.baseUrl" />
      </label>
      <label class="field">
        <span>API Key</span>
        <input placeholder="sk-..." class="form-input" type="password" autocomplete="off" data-field="ai.apiKey"/>
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
        <select class="form-select" data-field="ai.responseLanguage"></select>
      </label>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="ai.translateResults" />
        <span>Translate results</span>
      </label>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="ai.generateSvgGraphics" />
        <span>Generate SVG graphics</span>
      </label>
      <label class="field">
        <span>Speech Recognition language</span>
        <select class="form-select" data-field="speech.language"></select>
      </label>
    </section>

    <section class="card settings-tab-panel" data-tab-panel="mcp">
      <h3>MCP</h3>
      <div class="mcp-section" data-mcp-section></div>
      <div class="mcp-actions">
        <button class="btn" type="button" data-action="add-mcp-server">Add MCP server</button>
      </div>
    </section>

    <section class="card settings-tab-panel" data-tab-panel="instructions" data-section="instructions">
      <h3>Recognition Instructions</h3>
      <div data-custom-instructions="editor">
        ${createCustomInstructionsEditor({ onUpdate: () => setNote("Instructions updated.") })}
      </div>
    </section>

    <section class="card settings-tab-panel" data-tab-panel="extension" data-section="extension" hidden>
      <h3>Extension</h3>
      <label class="field checkbox form-checkbox">
        <input type="checkbox" data-field="core.ntpEnabled" />
        <span>Enable New Tab Page (offline Basic)</span>
      </label>
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
    const speechLanguage = field('[data-field="speech.language"]') as HTMLSelectElement | null;
    const theme = field('[data-field="appearance.theme"]') as HTMLSelectElement | null;
    const fontSize = field('[data-field="appearance.fontSize"]') as HTMLSelectElement | null;
    const ntpEnabled = field('[data-field="core.ntpEnabled"]') as HTMLInputElement | null;
    const mcpSection = root.querySelector("[data-mcp-section]") as HTMLElement | null;
    const extSection = root.querySelector('[data-section="extension"]') as HTMLElement | null;
    const extTab = root.querySelector('[data-extension-tab]') as HTMLButtonElement | null;

    if (responseLanguage) {
        responseLanguage.replaceChildren();
        const autoOption = document.createElement("option");
        autoOption.value = "auto";
        autoOption.textContent = "Auto-detect";
        responseLanguage.append(autoOption);

        const followOption = document.createElement("option");
        followOption.value = "follow";
        followOption.textContent = "Follow source/context";
        responseLanguage.append(followOption);

        for (const lang of buildResponseLanguageOptions()) {
            const option = document.createElement("option");
            option.value = lang;
            option.textContent = lang === "ru"
                ? "Russian"
                : lang === "en"
                    ? "English"
                    : lang;
            responseLanguage.append(option);
        }
    }

    if (speechLanguage) {
        speechLanguage.replaceChildren();
        for (const lang of buildSpeechLanguageOptions()) {
            const option = document.createElement("option");
            option.value = lang;
            option.textContent = speechLanguageLabel(lang);
            speechLanguage.append(option);
        }
    }

    const switchSettingsTab = (tab: string) => {
        const nextTab = tab || "ai";
        const tabRoot = root.querySelector('[data-settings-tabs]') as HTMLElement | null;
        tabRoot?.setAttribute("data-active-tab", nextTab);

        const tabButtons = root.querySelectorAll('[data-action="switch-settings-tab"][data-tab]');
        for (const tabButton of Array.from(tabButtons)) {
            const btn = tabButton as HTMLButtonElement;
            const isActive = btn.getAttribute("data-tab") === nextTab;
            btn.classList.toggle("is-active", isActive);
            btn.setAttribute("aria-selected", String(isActive));
        }

        const panels = root.querySelectorAll('[data-tab-panel]');
        for (const panel of Array.from(panels)) {
            const el = panel as HTMLElement;
            const isActive = el.getAttribute("data-tab-panel") === nextTab;
            if (el.hidden && isActive) continue;
            el.classList.toggle("is-active", isActive);
        }
    };

    const setNote = (t: string) => {
        if (!note) return;
        note.textContent = t;
        if (t) setTimeout(() => (note.textContent = ""), 1500);
    };

    const createMcpRow = (cfg: MCPConfig) => {
        const safeCfg = {
            id: (cfg?.id || `mcp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`).trim(),
            serverLabel: (cfg?.serverLabel || "").trim(),
            origin: (cfg?.origin || "").trim(),
            clientKey: (cfg?.clientKey || "").trim(),
            secretKey: (cfg?.secretKey || "").trim(),
        };

        return H`<div class="field mcp-row" data-mcp-id=${safeCfg.id}>
            <label class="field">
              <span>Server Label</span>
              <input class="form-input" type="text" data-mcp-field="serverLabel" autocomplete="off" value="${safeCfg.serverLabel}" />
            </label>
            <label class="field">
              <span>Origin</span>
              <input class="form-input" type="url" data-mcp-field="origin" autocomplete="off" placeholder="https://server.example" value="${safeCfg.origin}" />
            </label>
            <label class="field">
              <span>Client Key</span>
              <input class="form-input" type="text" data-mcp-field="clientKey" autocomplete="off" value="${safeCfg.clientKey}" />
            </label>
            <label class="field">
              <span>Secret Key</span>
              <input class="form-input" type="password" data-mcp-field="secretKey" autocomplete="off" placeholder="sk-..." value="${safeCfg.secretKey}" />
            </label>
            <button class="btn btn-danger" type="button" data-action="remove-mcp-server">Remove</button>
          </div>` as HTMLElement;
    };

    const collectMcpConfigurations = () => {
        if (!mcpSection) return [];
        const rows = Array.from(mcpSection.querySelectorAll<HTMLElement>("[data-mcp-id]"));
        const items: MCPConfig[] = [];

        for (const row of rows) {
            const id = row.getAttribute("data-mcp-id") || `mcp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
            const serverLabel = row.querySelector<HTMLInputElement>('[data-mcp-field="serverLabel"]')?.value?.trim() || "";
            const origin = row.querySelector<HTMLInputElement>('[data-mcp-field="origin"]')?.value?.trim() || "";
            const clientKey = row.querySelector<HTMLInputElement>('[data-mcp-field="clientKey"]')?.value?.trim() || "";
            const secretKey = row.querySelector<HTMLInputElement>('[data-mcp-field="secretKey"]')?.value?.trim() || "";
            if (!serverLabel) continue;
            items.push({ id, serverLabel, origin, clientKey, secretKey });
        }
        return items;
    };

    const renderMcpConfigurations = (configs: MCPConfig[]) => {
        if (!mcpSection) return;
        mcpSection.replaceChildren();
        const list = Array.isArray(configs) ? configs : [];
        if (!list.length) {
            mcpSection.appendChild(H`<p class="mcp-empty-note">No MCP servers configured.</p>` as HTMLElement);
            return;
        }
        list.forEach((cfg) => mcpSection.appendChild(createMcpRow(cfg)));
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
            if (speechLanguage) speechLanguage.value = (s?.speech?.language || "en-US") as any;
            if (theme) theme.value = (s?.appearance?.theme || "auto") as any;
            if (fontSize) fontSize.value = (s?.appearance?.fontSize || "medium") as any;
            if (ntpEnabled) ntpEnabled.checked = Boolean(s?.core?.ntpEnabled);
            renderMcpConfigurations(Array.isArray(s?.ai?.mcp) ? s.ai.mcp : []);
            opts.onTheme?.((theme?.value as any) || "auto");
        })
        .catch(() => {
            renderMcpConfigurations([]);
        });

    showKey?.addEventListener("change", () => {
        if (!apiKey || !showKey) return;
        apiKey.type = showKey.checked ? "text" : "password";
    });

    theme?.addEventListener("change", () => {
        opts.onTheme?.((theme.value as any) || "auto");
    });

    root.addEventListener("click", (e) => {
        const t = e.target as HTMLElement | null;
        const tabBtn = t?.closest?.('button[data-action="switch-settings-tab"]') as HTMLButtonElement | null;
        if (tabBtn) {
            switchSettingsTab(tabBtn.getAttribute("data-tab") || "ai");
            return;
        }

        const addMcpBtn = t?.closest?.('button[data-action="add-mcp-server"]') as HTMLButtonElement | null;
        if (addMcpBtn && mcpSection) {
            mcpSection.querySelector(".mcp-empty-note")?.remove();
            mcpSection.appendChild(createMcpRow({
                id: `mcp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                serverLabel: "",
                origin: "",
                clientKey: "",
                secretKey: "",
            }));
            return;
        }

        const removeMcpBtn = t?.closest?.('button[data-action="remove-mcp-server"]') as HTMLButtonElement | null;
        if (removeMcpBtn) {
            removeMcpBtn.closest(".mcp-row")?.remove();
            if (mcpSection && !mcpSection.querySelector("[data-mcp-id]")) {
                renderMcpConfigurations([]);
            }
            return;
        }

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
                    mcp: collectMcpConfigurations(),
                },
                speech: {
                    language: (speechLanguage?.value as any) || "en-US",
                },
                core: {
                    ntpEnabled: Boolean(ntpEnabled?.checked),
                },
                appearance: {
                    theme: (theme?.value as any) || "auto",
                    fontSize: (fontSize?.value as any) || "medium",
                },
            };
            const saved = await saveSettings(next);
            applyTheme(saved);
            opts.onTheme?.((saved.appearance?.theme as any) || "auto");
            setNote("Saved.");
        })().catch((err) => setNote(String(err)));
    });

    if (opts.isExtension) {
        if (extSection) extSection.hidden = false;
        if (extTab) extTab.hidden = false;
        const extNote = H`<div class="ext-note">Extension mode: settings are stored in <code>chrome.storage.local</code>.</div>` as HTMLElement;
        root.append(extNote);
    }

    return root;
};


//onThemeChange: (theme) => this.options.onThemeChange?.(theme)