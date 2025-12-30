import "./index.scss";

// Settings storage key - must match @rs-core/config/Settings
const SETTINGS_KEY = "rs-settings";

// Settings shape (partial, for popup use)
type ResponseLanguage = "en" | "ru" | "auto";
type PopupSettings = {
    ai?: {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        responseLanguage?: ResponseLanguage;
        translateResults?: boolean;
        generateSvgGraphics?: boolean;
    };
    [key: string]: unknown;
};

// Load settings from chrome.storage.local with proper nested structure
const loadPopupSettings = async (): Promise<PopupSettings> => {
    try {
        const result = await chrome.storage.local.get([SETTINGS_KEY]);
        return (result[SETTINGS_KEY] as PopupSettings) || {};
    } catch (e) {
        console.warn("Failed to load settings:", e);
        return {};
    }
};

// Save settings to chrome.storage.local with proper nested structure
const savePopupSettings = async (updates: { ai?: Partial<PopupSettings["ai"]> }) => {
    try {
        const current = await loadPopupSettings();
        const merged: PopupSettings = {
            ...current,
            ai: {
                ...(current?.ai || {}),
                ...(updates?.ai || {})
            }
        };
        await chrome.storage.local.set({ [SETTINGS_KEY]: merged });
        return true;
    } catch (e) {
        console.warn("Failed to save settings:", e);
        return false;
    }
};

//
const implementSettings = () => {
    const apiKey = document.getElementById('api-key') as HTMLInputElement;
    const apiUrl = document.getElementById('api-url') as HTMLInputElement;
    const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;
    const showApiKey = document.getElementById('show-api-key') as HTMLInputElement;
    const responseLanguage = document.getElementById('response-language') as HTMLSelectElement;
    const translateResults = document.getElementById('translate-results') as HTMLInputElement;
    const generateSvg = document.getElementById('generate-svg') as HTMLInputElement;

    // Load settings on popup open
    loadPopupSettings().then((settings) => {
        if (apiUrl) apiUrl.value = (settings?.ai?.baseUrl || "").trim();
        if (apiKey) apiKey.value = (settings?.ai?.apiKey || "").trim();
        if (responseLanguage) responseLanguage.value = settings?.ai?.responseLanguage || "auto";
        if (translateResults) translateResults.checked = settings?.ai?.translateResults || false;
        if (generateSvg) generateSvg.checked = settings?.ai?.generateSvgGraphics || false;
    }).catch(console.warn);

    // Save settings on button click
    saveSettingsBtn?.addEventListener('click', async () => {
        const success = await savePopupSettings({
            ai: {
                apiKey: apiKey?.value?.trim() || "",
                baseUrl: apiUrl?.value?.trim() || "",
                responseLanguage: (responseLanguage?.value as ResponseLanguage) || "auto",
                translateResults: translateResults?.checked || false,
                generateSvgGraphics: generateSvg?.checked || false
            }
        });

        // Visual feedback
        if (success) {
            const originalText = saveSettingsBtn.textContent;
            saveSettingsBtn.textContent = "Saved!";
            saveSettingsBtn.disabled = true;
            setTimeout(() => {
                saveSettingsBtn.textContent = originalText;
                saveSettingsBtn.disabled = false;
            }, 1000);
        }
    });

    // Trim values on change for better UX
    apiUrl?.addEventListener('change', () => {
        apiUrl.value = apiUrl.value?.trim() || "";
    });
    apiKey?.addEventListener('change', () => {
        apiKey.value = apiKey.value?.trim() || "";
    });

    // Toggle API key visibility
    showApiKey?.addEventListener('click', () => {
        if (apiKey) {
            apiKey.type = showApiKey.checked ? "text" : "password";
        }
    });
};

// Helper to send snip message and close popup
const sendSnipMessage = (messageType: string) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId != null) {
            chrome.tabs.sendMessage(tabId, { type: messageType })?.catch?.(console.warn);
        }
        // Close popup after triggering snip
        window?.close?.();
    });
};

//
const implementActions = () => {
    const snipRecognize = document.getElementById('snip-recognize') as HTMLButtonElement;
    const snipSolve = document.getElementById('snip-solve') as HTMLButtonElement;
    const snipCode = document.getElementById('snip-code') as HTMLButtonElement;
    const snipCss = document.getElementById('snip-css') as HTMLButtonElement;

    snipRecognize?.addEventListener('click', () => sendSnipMessage("START_SNIP"));
    snipSolve?.addEventListener('click', () => sendSnipMessage("SOLVE_AND_ANSWER"));
    snipCode?.addEventListener('click', () => sendSnipMessage("WRITE_CODE"));
    snipCss?.addEventListener('click', () => sendSnipMessage("EXTRACT_CSS"));
};

//
implementSettings();
implementActions();
