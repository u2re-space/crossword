import { H } from "fest/lure";

//
import { toastError, toastSuccess } from "@rs-frontend/lure-veela/items/Toast";

//
import type { AppSettings, FieldConfig, SectionConfig, SectionKey, MCPConfig } from "@rs-core/config/SettingsTypes";
import { DEFAULT_SETTINGS } from "@rs-core/config/SettingsTypes";

//
import { getByPath, loadSettings, saveSettings, slugify } from "@rs-core/config/Settings";
import { loadTimelineSources } from "@rs-core/workers/FileSystem";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

//
import { AISection } from "@rs-core/config/sections/AISection";
import { MCPSection } from "@rs-core/config/sections/MCPSection";
import { WebDavSection } from "@rs-core/config/sections/WebDavSection";
import { TimelineSection } from "@rs-core/config/sections/TimelineSection";
import { AdditionalSection } from "@rs-core/config/sections/AdditionalSection";
import { renderTabName } from "@rs-frontend/utils/Utils";
import { propRef, stringRef } from "fest/object";
import { actionRegistry, whenPasteInto } from "@rs-frontend/utils/Actions";
import { wallpaperState, persistWallpaper } from "@rs-frontend/utils/StateStorage";
import { applyTheme } from "@rs-frontend/utils/Theme";

//
export const SETTINGS_SECTIONS: SectionConfig[] = [
    AISection,
    MCPSection,
    WebDavSection,
    TimelineSection,
    AdditionalSection
];

//
const pickWallpaper = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
            const dir = "/images/wallpaper/";
            await writeFileSmart(null, dir, file);
            const path = `${dir}${file.name}`;
            wallpaperState.src = path;
            persistWallpaper();
            toastSuccess("Wallpaper updated");
        } catch (e) {
            console.warn(e);
            toastError("Failed to set wallpaper");
        }
    };
    input.click();
};

//
export const SECTION_KEYS = SETTINGS_SECTIONS.map(section => section.key) as SectionKey[];

//
export const Settings = async () => {
    const container = H`<section id="settings" class="settings-view"></section>`;

    //
    const fieldRefs = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
    const fieldMeta = new Map<string, FieldConfig>();
    const groupRefs = new Map<string, HTMLElement>();
    const navButtons = new Map<SectionKey, HTMLButtonElement>();
    const panelRefs = new Map<SectionKey, HTMLElement>();
    const forms = new Map<SectionKey, HTMLFormElement>();
    const tabbed = new Map<SectionKey, HTMLElement>();
    const statusText = stringRef("");

    // MCP management
    const mcpConfigs: MCPConfig[] = [];
    const mcpContainerRefs = new Map<string, HTMLElement>();

    //
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

    //
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

    // MCP management functions
    const createMCPField = (mcpId: string, fieldName: string, label: string, type: "text" | "password" = "text", placeholder: string = "") => {
        const fieldId = `mcp-${mcpId}-${fieldName}`;
        const control = H`<input class="field-control" id=${fieldId} name=${`mcp.${mcpId}.${fieldName}`} type=${type} placeholder=${placeholder} />` as HTMLInputElement;
        control.dataset.mcpId = mcpId;
        control.dataset.fieldName = fieldName;
        const field = H`<label class="field">
            <span class="field-label">${label}</span>
            ${control}
            </label>` as HTMLElement;
        fieldRefs.set(`mcp.${mcpId}.${fieldName}`, control);
        return field;
    };

    const createMCPContainer = (mcpConfig: MCPConfig, isNew: boolean = false) => {
        const container = H`<div class="mcp-config ${isNew ? 'mcp-config-new' : ''}" data-mcp-id=${mcpConfig.id}>
            <div class="mcp-header">
                <h4>MCP Server: ${mcpConfig.serverLabel || 'New Server'}</h4>
                <button type="button" class="btn btn-danger btn-sm remove-mcp" data-mcp-id=${mcpConfig.id} on:click=${() => removeMCPConfig(mcpConfig.id)}>
                    <ui-icon icon="trash"></ui-icon>
                    <span>Remove</span>
                </button>
            </div>
            <div class="mcp-fields">
                ${createMCPField(mcpConfig.id, 'serverLabel', 'Server Label', 'text', 'my-bridge')}
                ${createMCPField(mcpConfig.id, 'origin', 'Origin', 'text', 'https://server.example')}
                ${createMCPField(mcpConfig.id, 'clientKey', 'Client Key', 'text')}
                ${createMCPField(mcpConfig.id, 'secretKey', 'Secret Key', 'password')}
            </div>
        </div>` as HTMLElement;

        mcpContainerRefs.set(mcpConfig.id, container);
        return container;
    };

    const addMCPConfig = () => {
        const newId = `mcp-${Date.now()}`;
        const newConfig: MCPConfig = {
            id: newId,
            serverLabel: '',
            origin: '',
            clientKey: '',
            secretKey: ''
        };
        mcpConfigs.push(newConfig);

        const mcpGroup = groupRefs.get('mcp:mcp-management');
        if (mcpGroup) {
            const body = mcpGroup.querySelector('.group-body') as HTMLElement;
            if (body) {
                // Insert before the add button (which should be the last element)
                const addButton = body.querySelector('.mcp-actions');
                const container = createMCPContainer(newConfig, true);
                if (addButton) {
                    addButton.before(container);
                } else {
                    body.append(container);
                }
            }
        }
    };

    const removeMCPConfig = (mcpId: string) => {
        const index = mcpConfigs.findIndex(config => config.id === mcpId);
        if (index !== -1) {
            mcpConfigs.splice(index, 1);
        }

        const container = mcpContainerRefs.get(mcpId);
        if (container) {
            container.remove();
            mcpContainerRefs.delete(mcpId);
        }

        // Remove field references
        fieldRefs.forEach((_control, path) => {
            if (path.startsWith(`mcp.${mcpId}.`)) {
                fieldRefs.delete(path);
            }
        });
    };

    const renderMCPs = (settings: AppSettings) => {
        // Clear internal array
        mcpConfigs.length = 0;
        if (settings.ai?.mcp && Array.isArray(settings.ai.mcp)) {
            mcpConfigs.push(...settings.ai.mcp);
        }

        const mcpGroup = groupRefs.get('mcp:mcp-management');
        if (mcpGroup) {
            const body = mcpGroup.querySelector('.group-body') as HTMLElement;
            if (body) {
                // Clear existing MCP containers
                const existingContainers = body.querySelectorAll('.mcp-config');
                existingContainers.forEach(container => container.remove());

                // Add loaded MCP configurations
                const addButton = body.querySelector('.mcp-actions');
                mcpConfigs.forEach(config => {
                     if (addButton) {
                         addButton.before(createMCPContainer(config));
                     } else {
                         body.append(createMCPContainer(config));
                     }
                });
            }
        }
    };

    //
    SETTINGS_SECTIONS.forEach((section) => {
        const button = H`<button type="button" class="settings-tab" role="tab" id=${`tab-${section.key}`} aria-controls=${`panel-${section.key}`} aria-selected="false" on:click=${() => activateSection(section.key)}>
            <ui-icon icon=${section.icon}></ui-icon>
            <span>${section.title}</span>
        </button>` as HTMLButtonElement;
        button.tabIndex = -1;
        navButtons.set(section.key, button);

        const panel = H`<section class="settings-panel" role="tabpanel" id=${`panel-${section.key}`} aria-labelledby=${`tab-${section.key}`}></section>` as HTMLElement;
        panel.setAttribute("tabindex", "-1");
        panelRefs.set(section.key, panel);

        const panelForm = H`<form class="settings-form" data-section=${section.key}></form>` as HTMLFormElement;
        panelForm.noValidate = true;
        panel.append(panelForm);
        forms.set(section.key, panelForm);

        const panelHeader = H`<header class="panel-header">
            <h2>${section.title}</h2>
            <p>${section.description}</p>
        </header>` as HTMLElement;
        panelForm.append(panelHeader);

        section.groups.forEach((group) => {
            const { root, body } = createGroup(section.key, group);

            // Special handling for MCP section
            if (section.key === 'mcp' && group.key === 'mcp-management') {
                // Add MCP management buttons
                const addButton = H`<button type="button" class="btn btn-primary add-mcp" on:click=${addMCPConfig}>
                    <ui-icon icon="plus"></ui-icon>
                    <span>Add MCP Server</span>
                </button>` as HTMLButtonElement;


                //
                mcpConfigs.forEach(config => {
                    body.append(createMCPContainer(config));
                });

                //
                body.append(H`<div class="mcp-actions">${addButton}</div>` as HTMLElement);
            } else if (section.key === 'additional') {
                if (group.key === 'actions') {
                    // Add Paste button
                    const pasteBtn = H`<button type="button" class="btn btn-secondary" on:click=${whenPasteInto}>
                        <ui-icon icon="clipboard"></ui-icon>
                        <span>Paste from Bluetooth</span>
                    </button>`;
                    const actionsContainer = H`<div class="settings-actions-group" style="display: flex; gap: 8px; flex-wrap: wrap;">${pasteBtn}</div>`;
                    body.append(actionsContainer);
                } else
                if (group.key === 'synchronization') {
                    // Add Synchronization button
                    /*const synchronizationBtn = H`<button type="button" class="btn btn-secondary" on:click=${synchronizeWorkspace}>
                        <ui-icon icon="sync"></ui-icon>
                        <span>Synchronize Workspace</span>
                    </button>`;
                    body.append(synchronizationBtn);*/

                    // Add Import/Export buttons
                    const importBtn = H`<button type="button" class="btn btn-secondary" on:click=${() => actionRegistry.get("import-settings")?.(null as any, null as any, container)}>
                        <ui-icon icon="upload-simple"></ui-icon>
                        <span>Import Settings</span>
                    </button>`;
                    const exportBtn = H`<button type="button" class="btn btn-secondary" on:click=${() => actionRegistry.get("export-settings")?.(null as any, null as any, container)}>
                        <ui-icon icon="download-simple"></ui-icon>
                        <span>Export Settings</span>
                    </button>`;
                    const actionsContainer = H`<div class="settings-actions-group" style="display: flex; gap: 8px; flex-wrap: wrap;">${importBtn}${exportBtn}</div>`;
                    body.append(actionsContainer);
                } else
                if (group.key === 'wallpaper') {
                    const wallpaperBtn = H`<button type="button" class="btn btn-primary" on:click=${pickWallpaper}>
                        <ui-icon icon="image"></ui-icon>
                        <span>Change Wallpaper</span>
                    </button>`;
                    body.append(wallpaperBtn);
                }

                // Still allow regular fields in addition to custom buttons if any
                group.fields.forEach((field) => body.append(createField(field)));
            } else {
                // Regular field handling
                group.fields.forEach((field) => body.append(createField(field)));
            }

            panelForm.append(root);
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
    const tabsState: { value: SectionKey } = propRef(panelsWrapper, "currentTab", SETTINGS_SECTIONS[0].key);

    // styles broken for that... TODO: fix
    /*const statusBar = H`<div class="settings-actions" role="status" prop:hidden=${computed(statusText, (text) => !text?.trim())}>
        <span class="save-status" aria-live="polite">${statusText}</span>
    </div>` as HTMLElement;
    container.append(panelsWrapper, statusBar);*/
    container.append(panelsWrapper);

    //
    const modelSelectEl = fieldRefs.get("ai.model") as HTMLSelectElement | undefined;
    const customModelInput = fieldRefs.get("ai.customModel") as HTMLInputElement | undefined;
    const customModelGroup = groupRefs.get("ai:custom-model");
    const timelineInputEl = fieldRefs.get("timeline.source") as HTMLInputElement | undefined;

    //
    const timelineRecentSelect = H`<select class="field-control" style="margin-block-start: 0.5rem; inline-size: 100%;">
        <option value="">Select recent file...</option>
    </select>` as HTMLSelectElement;

    if (timelineInputEl) {
        timelineInputEl.parentElement?.append(timelineRecentSelect);
        timelineRecentSelect.addEventListener("change", () => {
            if (timelineRecentSelect.value) {
                timelineInputEl.value = timelineRecentSelect.value;
                timelineInputEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
            timelineRecentSelect.value = "";
        });
    }

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

    const setControlValue = (control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: unknown) => {
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
            if (path === "ai.model" || path === "ai.customModel" || path === "timeline.source" || path.startsWith("mcp.")) return;
            const value = getByPath(settings, path);
            setControlValue(control, value ?? "");
        });

        // Apply MCP configurations
        if (settings.ai?.mcp && Array.isArray(settings.ai.mcp)) {
            settings.ai.mcp.forEach(mcpConfig => {
                const serverLabelControl = fieldRefs.get(`mcp.${mcpConfig.id}.serverLabel`);
                const originControl = fieldRefs.get(`mcp.${mcpConfig.id}.origin`);
                const clientKeyControl = fieldRefs.get(`mcp.${mcpConfig.id}.clientKey`);
                const secretKeyControl = fieldRefs.get(`mcp.${mcpConfig.id}.secretKey`);

                if (serverLabelControl) setControlValue(serverLabelControl, mcpConfig.serverLabel);
                if (originControl) setControlValue(originControl, mcpConfig.origin);
                if (clientKeyControl) setControlValue(clientKeyControl, mcpConfig.clientKey);
                if (secretKeyControl) setControlValue(secretKeyControl, mcpConfig.secretKey);
            });
        }
    };

    const applyModelSelection = (settings: AppSettings) => {
        if (!modelSelectEl) return;
        const storedModel = settings.ai?.model ?? DEFAULT_SETTINGS.ai?.model ?? "gpt-5.1";
        const storedCustom = settings.ai?.customModel ?? DEFAULT_SETTINGS.ai?.customModel ?? "";
        if (["gpt-5.1"].includes(storedModel)) {
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
        if (timelineInputEl) {
            const saved = settings.timeline?.source?.trim?.() ?? "";
            timelineInputEl.value = saved;
        }
        if (timelineRecentSelect) {
            timelineRecentSelect.replaceChildren(new Option("Select recent file...", ""));
            const options = await loadTimelineSources();
            options.forEach((name) => timelineRecentSelect.appendChild(new Option(name, name)));
        }
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
            //panel.hidden = !selected;
            //panel.setAttribute("aria-hidden", selected ? "false" : "true");
            panel.tabIndex = selected ? 0 : -1;
        });
        tabsState.value = key;
    }

    //
    activateSection(tabsState.value);

    //
    let settings = await loadSettings();

    // Load existing MCP configurations BEFORE applying settings
    renderMCPs(settings);

    //
    await updateTimelineSelect(settings);
    applySettingsToForm(settings);
    applyModelSelection(settings);
    syncCustomVisibility();

    //
    const handleFormInput = (event: Event) => {
        if (!(event.target instanceof HTMLElement)) return;
        if (!event.target.closest('.settings-form')) return;
        statusText.value = "";
    };

    //
    const handleSubmit = async (event: SubmitEvent) => {
        const submittedForm = event.target;
        if (!(submittedForm instanceof HTMLFormElement) || !submittedForm.classList.contains('settings-form')) return;
        event.preventDefault();

        const modelSelection = modelSelectEl?.value ?? DEFAULT_SETTINGS.ai?.model;
        const customIdentifier = customModelInput?.value.trim() ?? "";
        const isCustomSelected = modelSelection === "custom";

        if (isCustomSelected && !customIdentifier) {
            toastError("Enter a custom model identifier before saving.");
            customModelInput?.focus();
            return;
        }

        // Collect MCP configurations
        const mcpConfigurations: MCPConfig[] = [];
        mcpConfigs.forEach(config => {
            const serverLabel = readValue(`mcp.${config.id}.serverLabel`);
            const origin = readValue(`mcp.${config.id}.origin`);
            const clientKey = readValue(`mcp.${config.id}.clientKey`);
            const secretKey = readValue(`mcp.${config.id}.secretKey`);

            // Only include MCP configs that have at least a server label
            if (serverLabel.trim()) {
                mcpConfigurations.push({
                    id: config.id,
                    serverLabel: serverLabel,
                    origin: origin,
                    clientKey: clientKey,
                    secretKey: secretKey
                });
            }
        });

        //
        const next: AppSettings = {
            ai: {
                apiKey: readValue("ai.apiKey"),
                baseUrl: readValue("ai.baseUrl"),
                model: isCustomSelected ? "custom" : modelSelection,
                customModel: isCustomSelected ? customIdentifier : "",
                mcp: mcpConfigurations
            },
            webdav: {
                url: readValue("webdav.url") || DEFAULT_SETTINGS.webdav?.url,
                username: readValue("webdav.username"),
                password: readValue("webdav.password"),
                token: readValue("webdav.token")
            },
            timeline: {
                source: readValue("timeline.source")
            },
            appearance: {
                theme: readValue("appearance.theme") as any || "auto"
            }
        };

        //
        try {
            settings = await saveSettings(next);
            await updateTimelineSelect(settings);
            applyModelSelection(settings);
            applyTheme(settings.appearance?.theme);
            statusText.value = "Saved";
            toastSuccess("Settings updated");
            syncCustomVisibility();
            setTimeout(() => { statusText.value = ""; }, 1600);
        } catch (e) {
            console.warn(e);
            toastError("Failed to save settings");
            statusText.value = "Error";
            setTimeout(() => { statusText.value = ""; }, 1800);
        }
    };

    //
    container.addEventListener("input", handleFormInput);
    container.addEventListener("submit", handleSubmit);
    container.tabsState = tabsState;
    container.forms = forms;
    (container as any).reloadSettings = async (newSettings?: AppSettings) => {
        settings = newSettings || await loadSettings();
        renderMCPs(settings);
        await updateTimelineSelect(settings);
        applySettingsToForm(settings);
        applyModelSelection(settings);
        syncCustomVisibility();
        applyTheme(settings.appearance?.theme);
        toastSuccess("Settings reloaded");
    };
    return container as HTMLElement;
};
