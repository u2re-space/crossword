import { H } from "fest/lure";

//
import { toastError, toastSuccess } from "@rs-frontend/elements/overlays/Toast";

//
import type { AppSettings, FieldConfig, SectionConfig, SectionKey, MCPConfig } from "@rs-core/config/SettingsTypes";
import { DEFAULT_SETTINGS } from "@rs-core/config/SettingsTypes";

//
import { getByPath, loadSettings, saveSettings, slugify } from "@rs-core/config/Settings";
import { loadTimelineSources } from "@rs-core/workers/FileSystem";

//
import { AISection } from "@rs-core/config/sections/AISection";
import { MCPSection } from "@rs-core/config/sections/MCPSection";
import { WebDavSection } from "@rs-core/config/sections/WebDavSection";
import { TimelineSection } from "@rs-core/config/sections/TimelineSection";
import { renderTabName } from "@rs-frontend/elements/Views";

//
export const SETTINGS_SECTIONS: SectionConfig[] = [
    AISection,
    MCPSection,
    WebDavSection,
    TimelineSection
];

//
export const SECTION_KEYS = SETTINGS_SECTIONS.map(section => section.key) as SectionKey[];

//
export const Settings = async () => {
    const container = H`<section id="settings" class="settings-view" style="padding: 0px; inline-size: stretch; block-size: stretch; background-color: transparent;"></section>` as HTMLElement;
    const tabsState: { value: SectionKey } = { value: SETTINGS_SECTIONS[0].key };

    //
    const fieldRefs = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
    const fieldMeta = new Map<string, FieldConfig>();
    const groupRefs = new Map<string, HTMLElement>();
    const navButtons = new Map<SectionKey, HTMLButtonElement>();
    const panelRefs = new Map<SectionKey, HTMLElement>();
    const tabbed = new Map<SectionKey, HTMLElement>();

    // MCP management
    const mcpConfigs: MCPConfig[] = [];
    const mcpContainerRefs = new Map<string, HTMLElement>();

    //
    const status = H`<span class="save-status" aria-live="polite"></span>` as HTMLElement;
    const saveBtn = H`<button type="submit" class="btn save"><ui-icon icon="check"></ui-icon><span>Save changes</span></button>` as HTMLButtonElement;
    const actions = H`<div class="settings-actions">${[status, saveBtn]}</div>` as HTMLElement;

    //
    const form = H`<form style="inline-size: stretch; block-size: stretch; background-color: transparent;" class="settings-form" on:submit=${(ev: SubmitEvent) => ev.preventDefault()}></form>` as HTMLFormElement;
    container.append(form);

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
                <button type="button" class="btn btn-danger btn-sm remove-mcp" data-mcp-id=${mcpConfig.id}>
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
                if (addButton) {
                    body.insertBefore(createMCPContainer(newConfig, true), addButton);
                } else {
                    body.appendChild(createMCPContainer(newConfig, true));
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
        fieldRefs.forEach((control, path) => {
            if (path.startsWith(`mcp.${mcpId}.`)) {
                fieldRefs.delete(path);
            }
        });
    };

    //
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

            // Special handling for MCP section
            if (section.key === 'mcp' && group.key === 'mcp-management') {
                // Add MCP management buttons
                const addButton = H`<button type="button" class="btn btn-primary add-mcp">
                    <ui-icon icon="plus"></ui-icon>
                    <span>Add MCP Server</span>
                </button>` as HTMLButtonElement;
                addButton.addEventListener('click', addMCPConfig);

                const buttonContainer = H`<div class="mcp-actions">${addButton}</div>` as HTMLElement;
                body.appendChild(buttonContainer);

                // Add existing MCP configs
                mcpConfigs.forEach(config => {
                    body.appendChild(createMCPContainer(config));
                });
            } else {
                // Regular field handling
                group.fields.forEach((field) => body.append(createField(field)));
            }

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
        const storedModel = settings.ai?.model ?? DEFAULT_SETTINGS.ai?.model ?? "gpt-5-mini";
        const storedCustom = settings.ai?.customModel ?? DEFAULT_SETTINGS.ai?.customModel ?? "";
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
            //panel.setAttribute("aria-hidden", selected ? "false" : "true");
            panel.tabIndex = selected ? 0 : -1;
        });
    }

    activateSection(tabsState.value);

    // Add event delegation for remove MCP buttons
    form.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.remove-mcp')) {
            const button = target.closest('.remove-mcp') as HTMLButtonElement;
            const mcpId = button.dataset.mcpId;
            if (mcpId) {
                removeMCPConfig(mcpId);
            }
        }
    });

    let settings = await loadSettings();

    // Load existing MCP configurations BEFORE applying settings
    if (settings.ai?.mcp && Array.isArray(settings.ai.mcp)) {
        mcpConfigs.push(...settings.ai.mcp);

        // Recreate MCP containers for loaded configurations
        const mcpGroup = groupRefs.get('mcp:mcp-management');
        if (mcpGroup) {
            const body = mcpGroup.querySelector('.group-body') as HTMLElement;
            if (body) {
                // Clear existing MCP containers (except the add button)
                const existingContainers = body.querySelectorAll('.mcp-config');
                existingContainers.forEach(container => container.remove());

                // Add loaded MCP configurations
                mcpConfigs.forEach(config => {
                    body.appendChild(createMCPContainer(config));
                });
            }
        }
    }

    await updateTimelineSelect(settings);
    applySettingsToForm(settings);
    applyModelSelection(settings);
    syncCustomVisibility();

    //
    form.addEventListener("input", () => { status.textContent = ""; });
    form.addEventListener("submit", async () => {
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
