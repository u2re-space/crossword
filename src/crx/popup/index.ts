import "./index.scss";

// Settings storage key - must match @rs-core/config/Settings
const SETTINGS_KEY = "rs-settings";

// Settings shape (partial, for popup use)
type PopupSettings = {
    ai?: { apiKey?: string; baseUrl?: string; model?: string };
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
const savePopupSettings = async (updates: { ai?: { apiKey?: string; baseUrl?: string } }) => {
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

    // Load settings on popup open
    loadPopupSettings().then((settings) => {
        if (apiUrl) apiUrl.value = (settings?.ai?.baseUrl || "").trim();
        if (apiKey) apiKey.value = (settings?.ai?.apiKey || "").trim();
    }).catch(console.warn);

    // Save settings on button click
    saveSettingsBtn?.addEventListener('click', async () => {
        const success = await savePopupSettings({
            ai: {
                apiKey: apiKey?.value?.trim() || "",
                baseUrl: apiUrl?.value?.trim() || ""
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

//
const implementActions = () => {
    const snipAndRecognize = document.getElementById('snip-and-recognize') as HTMLButtonElement;

    snipAndRecognize?.addEventListener('click', () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId != null) {
                chrome.tabs.sendMessage(tabId, { type: "START_SNIP" })?.catch?.(console.warn);
            }

            // Close popup after triggering snip
            window?.close?.();
        });
    });
};

//
implementSettings();
implementActions();
