import { H } from "fest/lure";
import { idbGet, idbPut } from "@rs-core/store/IDBStorage";
import { updateWebDavSettings } from "@rs-core/workers/WebDavSync";
import { getDirectoryHandle } from "fest/lure";
import { toastError, toastSuccess } from "@rs-frontend/utils/Toast";

import type { AppSettings, FieldConfig, SectionConfig, SectionKey } from "./Settings.types";
import { DEFAULT_SETTINGS } from "./Settings.types";
import { AISettingsView } from "./AISettingsView";
import { MCPSettingsView } from "./MCPSettingsView";
import { WebDavSettingsView } from "./WebDavSettingsView";
import { renderTabName } from "@rs-frontend/utils/Formatted";

const TIMELINE_SECTION: SectionConfig = {
    key: "timeline",
    title: "Timeline Planner",
    icon: "calendar-plus",
    description: "Choose which preference note should seed generated plans.",
    groups: [
        {
            key: "timeline-source",
            label: "Preference note",
            fields: [
                {
                    path: "timeline.source",
                    label: "Source file",
                    type: "select",
                    helper: "Files inside /docs/preferences appear in this list.",
                    options: [{ value: "", label: "(auto)" }]
                }
            ]
        }
    ]
};

const SETTINGS_SECTIONS: SectionConfig[] = [
    AISettingsView,
    MCPSettingsView,
    WebDavSettingsView,
    TIMELINE_SECTION
];

const SECTION_KEYS = SETTINGS_SECTIONS.map(section => section.key) as SectionKey[];

const SETTINGS_KEY = "rs-settings";

const splitPath = (path: string) => path.split(".");
const getByPath = (source: any, path: string) => splitPath(path).reduce<any>((acc, key) => (acc == null ? acc : acc[key]), source);
const slugify = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

const loadSettings = async (): Promise<AppSettings> => {
    try {
        const raw = await idbGet(SETTINGS_KEY);
        const stored = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (stored && typeof stored === "object") {
            return {
                ai: { ...DEFAULT_SETTINGS.ai, ...(stored as any)?.ai, mcp: { ...DEFAULT_SETTINGS.ai.mcp, ...(stored as any)?.ai?.mcp } },
                webdav: { ...DEFAULT_SETTINGS.webdav, ...(stored as any)?.webdav },
                timeline: { ...DEFAULT_SETTINGS.timeline, ...(stored as any)?.timeline }
            };
        }
    } catch (e) {
        console.warn(e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
};

const saveSettings = async (settings: AppSettings) => {
    const current = await loadSettings();
    const merged: AppSettings = {
        ai: { ...current.ai, ...settings.ai, mcp: { ...current.ai.mcp, ...settings.ai.mcp } },
        webdav: { ...current.webdav, ...settings.webdav },
        timeline: { ...current.timeline, ...settings.timeline }
    };
    await idbPut(SETTINGS_KEY, merged);
    updateWebDavSettings(merged)?.catch(console.warn.bind(console));
    return merged;
};

const loadTimelineSources = async () => {
    try {
        const root = await getDirectoryHandle(null, "/docs/preferences")?.catch(() => null);
        if (!root) return [] as string[];
        const entries = await Array.fromAsync(root.entries?.() ?? []);
        return entries
            .map((entry: any) => entry?.[0])
            .filter((name: string) => typeof name === "string" && name.trim().length)
            .map((name: string) => name.replace(/\.md$/i, ""));
    } catch (e) {
        console.warn(e);
        return [];
    }
};

export const Settings = async () => {
    const container = H`<section id="settings" class="settings-view" style="padding: 0px; inline-size: stretch; block-size: stretch; background-color: transparent;"></section>` as HTMLElement;
    const tabsState: { value: SectionKey } = { value: SETTINGS_SECTIONS[0].key };

    const fieldRefs = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
    const fieldMeta = new Map<string, FieldConfig>();
    const groupRefs = new Map<string, HTMLElement>();
    const navButtons = new Map<SectionKey, HTMLButtonElement>();
    const panelRefs = new Map<SectionKey, HTMLElement>();

    const status = H`<span class="save-status" aria-live="polite"></span>` as HTMLElement;
    const saveBtn = H`<button type="submit" class="btn save"><ui-icon icon="check"></ui-icon><span>Save changes</span></button>` as HTMLButtonElement;
    const actions = H`<div class="settings-actions">${[status, saveBtn]}</div>` as HTMLElement;

    const form = H`<form style="inline-size: stretch; block-size: stretch; background-color: transparent;" class="settings-form" on:submit=${(ev: SubmitEvent) => ev.preventDefault()}></form>` as HTMLFormElement;
    container.append(form);

    const createField = (config: FieldConfig) => {
        const id = `settings-${slugify(config.path)}-${fieldRefs.size}`;
        let control: HTMLInputElement | HTMLSelectElement;
        if (config.type === "select") {
            const select = H`<select class="field-control" id=${id} name=${config.path}></select>` as HTMLSelectElement;
            (config.options ?? []).forEach((opt) => select.appendChild(new Option(opt.label, opt.value)));
            control = select;
        } else {
            const input = H`<input class="field-control" id=${id} name=${config.path} type=${config.type === "password" ? "password" : "text"} placeholder=${config.placeholder ?? ""} />` as HTMLInputElement;
            input.autocomplete = "off";
            control = input;
        }
        control.dataset.path = config.path;
        const field = H`<label class="field">
            <span class="field-label">${config.label}</span>
            ${control}
            ${config.helper ? H`<span class="field-hint">${config.helper}</span>` : null}
        </label>` as HTMLElement;
        fieldRefs.set(config.path, control);
        fieldMeta.set(config.path, config);
        return field;
    };

    const createGroup = (sectionKey: SectionKey, config: SectionConfig["groups"][number]) => {
        if (config.collapsible) {
            const details = H`<details class="settings-group is-collapsible" ${config.startOpen ? "open" : ""}></details>` as HTMLDetailsElement;
            const summary = H`<summary>
                <span class="group-title">${config.label}</span>
                ${config.description ? H`<span class="group-note">${config.description}</span>` : null}
            </summary>` as HTMLElement;
            const body = H`<div class="group-body"></div>` as HTMLElement;
            details.append(summary, body);
            if (config.key) groupRefs.set(`${sectionKey}:${config.key}`, details);
            return { root: details, body };
        }
        const section = H`<section class="settings-group"></section>` as HTMLElement;
        const header = H`<header class="group-header">
            <h3>${config.label}</h3>
            ${config.description ? H`<p>${config.description}</p>` : null}
        </header>` as HTMLElement;
        const body = H`<div class="group-body"></div>` as HTMLElement;
        section.append(header, body);
        if (config.key) groupRefs.set(`${sectionKey}:${config.key}`, section);
        return { root: section, body };
    };

    const tabbed = new Map<SectionKey, HTMLElement>();
    SETTINGS_SECTIONS.forEach((section) => {
        const button = H`<button type="button" class="settings-tab" role="tab" id=${`tab-${section.key}`} aria-controls=${`panel-${section.key}`} aria-selected="false">
            <ui-icon icon=${section.icon}></ui-icon>
            <span>${section.title}</span>
        </button>` as HTMLButtonElement;
        button.tabIndex = -1;
        button.addEventListener("click", () => activateSection(section.key));
        navButtons.set(section.key, button);

        const panel = H`<section class="settings-panel" role="tabpanel" id=${`panel-${section.key}`} aria-labelledby=${`tab-${section.key}`} hidden></section>` as HTMLElement;
        panel.setAttribute("tabindex", "-1");
        panelRefs.set(section.key, panel);

        const panelHeader = H`<header class="panel-header">
            <h2>${section.title}</h2>
            <p>${section.description}</p>
        </header>` as HTMLElement;
        panel.append(panelHeader);

        section.groups.forEach((group) => {
            const { root, body } = createGroup(section.key, group);
            group.fields.forEach((field) => body.append(createField(field)));
            panel.append(root);
        });

        tabbed.set(section.key, panel);
        //panelsWrapper.append(panel);
    });

    //
    const panelsWrapper = H`<ui-tabbed-box
        prop:tabs=${tabbed}
        prop:renderTabName=${renderTabName}
        currentTab=${SETTINGS_SECTIONS[0].key}
        style="background-color: transparent; inline-size: stretch; block-size: stretch;"
        class="all"
    ></ui-tabbed-box>` as HTMLElement;
    form.append(panelsWrapper, actions);

    const modelSelectEl = fieldRefs.get("ai.model") as HTMLSelectElement | undefined;
    const customModelInput = fieldRefs.get("ai.customModel") as HTMLInputElement | undefined;
    const customModelGroup = groupRefs.get("ai:custom-model");
    const timelineSelectEl = fieldRefs.get("timeline.source") as HTMLSelectElement | undefined;

    const syncCustomVisibility = () => {
        if (!modelSelectEl || !customModelGroup || !customModelInput) return;
        const isCustom = modelSelectEl.value === "custom";
        customModelGroup.hidden = !isCustom;
        if (isCustom) {
            customModelInput.removeAttribute("disabled");
        } else {
            customModelInput.setAttribute("disabled", "true");
        }
    };

    modelSelectEl?.addEventListener("change", syncCustomVisibility);
    customModelInput?.addEventListener("focus", () => {
        if (modelSelectEl && modelSelectEl.value !== "custom") {
            modelSelectEl.value = "custom";
            syncCustomVisibility();
        }
    });
    customModelInput?.addEventListener("input", () => {
        if (modelSelectEl && modelSelectEl.value !== "custom") {
            modelSelectEl.value = "custom";
            syncCustomVisibility();
        }
    });

    const setControlValue = (control: HTMLInputElement | HTMLSelectElement | HTMLTextareaElement, value: unknown) => {
        const stringValue = value == null ? "" : String(value);
        if (control instanceof HTMLSelectElement) {
            const option = Array.from(control.options).find((opt) => opt.value === stringValue);
            if (option) {
                control.value = stringValue;
            } else if (stringValue) {
                control.appendChild(new Option(stringValue, stringValue, true, true));
            } else {
                control.selectedIndex = 0;
            }
        } else {
            control.value = stringValue;
        }
    };

    const applySettingsToForm = (settings: AppSettings) => {
        fieldRefs.forEach((control, path) => {
            if (path === "ai.model" || path === "ai.customModel" || path === "timeline.source") return;
            const value = getByPath(settings, path);
            setControlValue(control, value ?? "");
        });
    };

    const applyModelSelection = (settings: AppSettings) => {
        if (!modelSelectEl) return;
        const storedModel = settings.ai?.model ?? DEFAULT_SETTINGS.ai.model;
        const storedCustom = settings.ai?.customModel ?? "";
        if (["gpt-5", "gpt-5-mini"].includes(storedModel)) {
            modelSelectEl.value = storedModel;
            if (customModelInput) customModelInput.value = storedCustom ?? "";
        } else if (storedModel === "custom") {
            modelSelectEl.value = "custom";
            if (customModelInput) customModelInput.value = storedCustom ?? "";
        } else {
            modelSelectEl.value = "custom";
            if (customModelInput) customModelInput.value = storedCustom || storedModel;
        }
        syncCustomVisibility();
    };

    const readValue = (path: string) => {
        const control = fieldRefs.get(path);
        if (!control) return "";
        const rawValue = (control as HTMLInputElement | HTMLSelectElement).value;
        const meta = fieldMeta.get(path);
        return typeof rawValue === "string" ? (meta?.type === "password" ? rawValue : rawValue.trim()) : "";
    };

    const updateTimelineSelect = async (settings: AppSettings) => {
        if (!timelineSelectEl) return;
        const saved = settings.timeline?.source?.trim?.() ?? "";
        timelineSelectEl.replaceChildren(new Option("(auto)", ""));
        const options = await loadTimelineSources();
        options.forEach((name) => timelineSelectEl.appendChild(new Option(name, name)));
        if (saved && !options.includes(saved)) {
            timelineSelectEl.appendChild(new Option(saved, saved));
        }
        timelineSelectEl.value = saved;
    };

    function activateSection(key: SectionKey) {
        tabsState.value = key;
        navButtons.forEach((button, sectionKey) => {
            const selected = sectionKey === key;
            button.setAttribute("aria-selected", selected ? "true" : "false");
            button.classList.toggle("is-active", selected);
            button.tabIndex = selected ? 0 : -1;
        });
        panelRefs.forEach((panel, sectionKey) => {
            const selected = sectionKey === key;
            panel.hidden = !selected;
            panel.setAttribute("aria-hidden", selected ? "false" : "true");
            panel.tabIndex = selected ? 0 : -1;
        });
    }

    activateSection(tabsState.value);

    let settings = await loadSettings();
    await updateTimelineSelect(settings);
    applySettingsToForm(settings);
    applyModelSelection(settings);
    syncCustomVisibility();

    form.addEventListener("input", () => { status.textContent = ""; });

    form.addEventListener("submit", async () => {
        const modelSelection = modelSelectEl?.value ?? DEFAULT_SETTINGS.ai.model;
        const customIdentifier = customModelInput?.value.trim() ?? "";
        const isCustomSelected = modelSelection === "custom";

        if (isCustomSelected && !customIdentifier) {
            toastError("Enter a custom model identifier before saving.");
            customModelInput?.focus();
            return;
        }

        const next: AppSettings = {
            ai: {
                apiKey: readValue("ai.apiKey"),
                baseUrl: readValue("ai.baseUrl"),
                model: isCustomSelected ? "custom" : modelSelection,
                customModel: isCustomSelected ? customIdentifier : "",
                mcp: {
                    serverLabel: readValue("ai.mcp.serverLabel"),
                    origin: readValue("ai.mcp.origin"),
                    clientKey: readValue("ai.mcp.clientKey"),
                    secretKey: readValue("ai.mcp.secretKey")
                }
            },
            webdav: {
                url: readValue("webdav.url") || DEFAULT_SETTINGS.webdav.url,
                username: readValue("webdav.username"),
                password: readValue("webdav.password"),
                token: readValue("webdav.token")
            },
            timeline: {
                source: readValue("timeline.source")
            }
        };

        try {
            settings = await saveSettings(next);
            await updateTimelineSelect(settings);
            applyModelSelection(settings);
            status.textContent = "Saved";
            toastSuccess("Settings updated");
            syncCustomVisibility();
            setTimeout(() => { status.textContent = ""; }, 1600);
        } catch (e) {
            console.warn(e);
            toastError("Failed to save settings");
            status.textContent = "Error";
            setTimeout(() => { status.textContent = ""; }, 1800);
        }
    });

    return container;
};
