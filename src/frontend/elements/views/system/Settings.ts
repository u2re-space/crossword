import { H } from "fest/lure";
import { idbGet, idbPut } from "@rs-core/store/IDBStorage";
import { updateWebDavSettings } from "@rs-core/workers/WebDavSync";

type AppSettings = {
    ai: {
        apiKey: string;
        baseUrl: string;
        model: string; // 'gpt-5' | 'gpt-5-mini' | custom id
        customModel?: string;
        mcp?: {
            serverLabel: string;
            origin: string;
            clientKey: string;
            secretKey: string;
        };
    };
    webdav: {
        url: string;
        username: string;
        password: string;
        token: string;
    };
};

const SETTINGS_KEY = "rs-settings";
const DEFAULTS: AppSettings = {
    ai: {
        apiKey: "",
        baseUrl: "",
        model: "gpt-5",
        customModel: "",
        mcp: {
            serverLabel: "",
            origin: "",
            clientKey: "",
            secretKey: ""
        }
    },
    webdav: {
        url: "http://localhost:6065",
        username: "",
        password: "",
        token: ""
    }
};

const loadSettings = async (): Promise<AppSettings> => {
    try {
        const stored = await idbGet(SETTINGS_KEY);
        if (stored && typeof stored === "object") {
            const merged: AppSettings = {
                ai: { ...DEFAULTS.ai, ...(stored as any)?.ai },
                webdav: { ...DEFAULTS.webdav, ...(stored as any)?.webdav }
            };
            merged.ai.mcp = { ...DEFAULTS.ai.mcp, ...(stored as any)?.ai?.mcp };
            if (!["gpt-5", "gpt-5-mini"].includes(merged.ai.model)) {
                merged.ai.customModel = merged.ai.model;
                merged.ai.model = "custom";
            }
            return merged;
        }
    } catch (e) { console.warn(e); }
    return JSON.parse(JSON.stringify(DEFAULTS));
};

const saveSettings = async (settings: AppSettings) => {
    const out = await idbPut(SETTINGS_KEY, settings);
    updateWebDavSettings(settings);
    return out;
};

//
export const Settings = async () => {
    const container = H`<section id="settings" class="settings-view" style="line-height: normal;">
        <form class="settings-form" on:submit=${(ev: SubmitEvent) => ev.preventDefault()}></form>
    </section>` as HTMLElement;

    const form = container.querySelector('.settings-form') as HTMLFormElement;

    // Inputs
    const aiApiKey = H`<input name="ai_api_key" type="password" placeholder="sk-..." autocomplete="off" />` as HTMLInputElement;
    const aiBaseUrl = H`<input name="ai_base_url" type="text" placeholder="https://api.openai.com/v1" />` as HTMLInputElement;
    const modelSelect = H`<select name="ai_model">
        <option value="gpt-5">gpt-5</option>
        <option value="gpt-5-mini">gpt-5-mini</option>
        <option value="custom">custom...</option>
    </select>` as HTMLSelectElement;
    const customModel = H`<input name="ai_custom_model" type="text" placeholder="model id (e.g. provider/model)" />` as HTMLInputElement;
    const mcpServerLabel = H`<input name="ai_mcp_label" type="text" placeholder="label" />` as HTMLInputElement;
    const mcpOrigin = H`<input name="ai_mcp_origin" type="text" placeholder="https://mcp.example" />` as HTMLInputElement;
    const mcpClientKey = H`<input name="ai_mcp_client" type="text" placeholder="client key" />` as HTMLInputElement;
    const mcpSecretKey = H`<input name="ai_mcp_secret" type="password" placeholder="secret" />` as HTMLInputElement;

    const wdUrl = H`<input name="webdav_url" type="text" placeholder="http://localhost:8080" />` as HTMLInputElement;
    const wdUser = H`<input name="webdav_username" type="text" placeholder="login" />` as HTMLInputElement;
    const wdPass = H`<input name="webdav_password" type="password" placeholder="password" />` as HTMLInputElement;
    const wdToken = H`<input name="webdav_token" type="password" placeholder="token (optional)" />` as HTMLInputElement;

    const status = H`<span class="save-status" aria-live="polite"></span>` as HTMLElement;
    const saveBtn = H`<button type="submit" class="btn save"><ui-icon icon="check"></ui-icon><span>Save</span></button>` as HTMLButtonElement;

    const field = (label: string, input: HTMLElement) => H`<label class="field">
        <span class="label">${label}</span>
        ${input}
    </label>` as HTMLElement;

    // Build groups
    const customField = field("Custom model", customModel) as HTMLElement;
    (customField as HTMLElement).style.display = "none";
    const mcpGroup = H`<fieldset class="group"><legend>MCP (Optional)</legend>${[
        field("Label", mcpServerLabel),
        field("Origin", mcpOrigin),
        field("Client Key", mcpClientKey),
        field("Secret Key", mcpSecretKey)
    ]}</fieldset>` as HTMLElement;
    mcpGroup.toggleAttribute('hidden', true);

    const toggleMCP = () => {
        const anyFilled = [mcpServerLabel, mcpOrigin, mcpClientKey, mcpSecretKey].some((input) => input.value.trim().length);
        mcpGroup.toggleAttribute('hidden', !anyFilled && !mcpGroup.hasAttribute('data-open'));
    };

    const mcpToggleButton = H`<button type="button" class="btn" data-role="toggle-mcp"><ui-icon icon="gear"></ui-icon><span>MCP Settings</span></button>` as HTMLButtonElement;
    mcpToggleButton.addEventListener('click', () => {
        const isOpen = mcpGroup.toggleAttribute('data-open');
        mcpGroup.toggleAttribute('hidden', !isOpen && [mcpServerLabel, mcpOrigin, mcpClientKey, mcpSecretKey].every((input) => !input.value.trim().length));
    });

    const aiGroup = H`<fieldset class="group"><legend>AI</legend>${[
        field("API key", aiApiKey),
        field("Base URL", aiBaseUrl),
        field("Model", modelSelect),
        customField,
        mcpToggleButton,
        mcpGroup
    ]}</fieldset>` as HTMLElement;

    const wdHint = H`<div class="hint">Use either login/password or a token.</div>` as HTMLElement;
    const wdGroup = H`<fieldset class="group"><legend>WebDAV</legend>${[
        field("Server URL", wdUrl),
        field("Login", wdUser),
        field("Password", wdPass),
        field("Token", wdToken),
        wdHint
    ]}</fieldset>` as HTMLElement;

    const actions = H`<div class="actions">${[saveBtn, status]}</div>` as HTMLElement;

    form.append(aiGroup, wdGroup, actions);

    // Toggle custom model visibility
    const toggleCustom = () => {
        (customField as HTMLElement).style.display = (modelSelect.value === "custom") ? "grid" : "none";
    };
    modelSelect.addEventListener('change', toggleCustom);

    // Prefill from storage
    const settings = await loadSettings();
    aiApiKey.value = settings.ai.apiKey || "";
    aiBaseUrl.value = settings.ai.baseUrl || "";
    if (["gpt-5", "gpt-5-mini"].includes(settings.ai.model)) {
        modelSelect.value = settings.ai.model;
        customModel.value = "";
    } else {
        modelSelect.value = "custom";
        customModel.value = settings.ai.customModel || settings.ai.model || "";
    }
    toggleCustom();

    mcpServerLabel.value = settings.ai.mcp?.serverLabel || "";
    mcpOrigin.value = settings.ai.mcp?.origin || "";
    mcpClientKey.value = settings.ai.mcp?.clientKey || "";
    mcpSecretKey.value = settings.ai.mcp?.secretKey || "";

    if ([mcpServerLabel, mcpOrigin, mcpClientKey, mcpSecretKey].some((input) => input.value.trim().length)) {
        mcpGroup.setAttribute('data-open', 'true');
        mcpGroup.removeAttribute('hidden');
    }

    wdUrl.value = settings.webdav.url || DEFAULTS.webdav.url;
    wdUser.value = settings.webdav.username || "";
    wdPass.value = settings.webdav.password || "";
    wdToken.value = settings.webdav.token || "";

    // Save handler
    form.addEventListener('submit', async (ev: SubmitEvent) => {
        ev.preventDefault();
        const chosenModel = modelSelect.value === 'custom' ? (customModel.value?.trim() || 'gpt-5') : modelSelect.value;
        const next: AppSettings = {
            ai: {
                apiKey: aiApiKey.value.trim(),
                baseUrl: aiBaseUrl.value.trim(),
                model: chosenModel,
                customModel: modelSelect.value === 'custom' ? customModel.value.trim() : "",
                mcp: {
                    serverLabel: mcpServerLabel.value.trim(),
                    origin: mcpOrigin.value.trim(),
                    clientKey: mcpClientKey.value.trim(),
                    secretKey: mcpSecretKey.value.trim()
                }
            },
            webdav: {
                url: wdUrl.value.trim() || DEFAULTS.webdav.url,
                username: wdUser.value.trim(),
                password: wdPass.value,
                token: wdToken.value
            }
        };
        try {
            await saveSettings(next);
            status.textContent = "Saved";
            setTimeout(() => { status.textContent = ""; }, 1500);
        } catch (e) {
            console.warn(e);
            status.textContent = "Failed to save";
            setTimeout(() => { status.textContent = ""; }, 2000);
        }
    });

    [mcpServerLabel, mcpOrigin, mcpClientKey, mcpSecretKey].forEach((input) => input.addEventListener('input', toggleMCP));
    toggleMCP();

    return container;
}
