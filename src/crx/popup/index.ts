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
    const snipActionSelect = document.getElementById('snip-action-select') as HTMLSelectElement;
    const snipDoButton = document.getElementById('snip-do') as HTMLButtonElement;

    // Unified Snip & Do button handler
    snipDoButton?.addEventListener('click', async () => {
        const selectedAction = snipActionSelect?.value;

        if (!selectedAction) {
            console.warn('[CRX-SNIP] No action selected');
            return;
        }

        try {
            // Handle CRX-Snip actions that need special processing
            if (selectedAction === 'CRX_SNIP_TEXT') {
                await handleCrxSnipText();
            } else if (selectedAction === 'CRX_SNIP_SCREEN') {
                await handleCrxSnipScreen();
            } else {
                // Regular snip actions - send to content script
                sendSnipMessage(selectedAction);
            }
        } catch (error) {
            console.error('[CRX-SNIP] Failed to execute snip action:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: `Failed to execute ${selectedAction}`
            });
        }
    });

    // CRX-Snip Text handler
    const handleCrxSnipText = async () => {
        // Get the active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (!activeTab?.id) {
            console.warn('[CRX-SNIP] No active tab found');
            return;
        }

        // Get selected text from the active tab
        const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => window.getSelection()?.toString() || ''
        });

        const selectedText = results[0]?.result || '';

        if (!selectedText.trim()) {
            // No selection - show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: 'Please select some text first!'
            });
            return;
        }

        // Send to service worker for processing
        chrome.runtime.sendMessage({
            type: "crx-snip",
            content: selectedText,
            contentType: "text"
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('[CRX-SNIP] Message failed:', chrome.runtime.lastError);
                return;
            }

            if (response?.success) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: 'Text processed and copied to clipboard!'
                });
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: `Text processing failed: ${response?.error || 'Unknown error'}`
                });
            }
        });

        // Close popup
        window?.close?.();
    };

    // CRX-Snip Screen handler
    const handleCrxSnipScreen = async () => {
        // Get the active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (!activeTab?.id) {
            console.warn('[CRX-SNIP] No active tab found');
            return;
        }

        // Close popup first
        window?.close?.();

        // Small delay to allow popup to close
        setTimeout(async () => {
            try {
                // Send message to content script to start rectangle selection
                chrome.tabs.sendMessage(activeTab.id, {
                    type: 'crx-snip-select-rect'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[CRX-SNIP] Rectangle selection message failed:', chrome.runtime.lastError);
                        return;
                    }

                    // Response will contain the selected rectangle
                    if (response?.rect) {
                        console.log('[CRX-SNIP] Rectangle selected:', response.rect);

                        // Send message to service worker with rect coordinates
                        chrome.runtime.sendMessage({
                            type: "crx-snip-screen-capture",
                            rect: response.rect,
                            scale: 1 // Use scale: 1 to avoid scaling issues
                        });
                    } else {
                        console.log('[CRX-SNIP] Rectangle selection cancelled');
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon.png',
                            title: 'CrossWord CRX-Snip',
                            message: 'Rectangle selection cancelled'
                        });
                    }
                });

            } catch (error) {
                console.error('[CRX-SNIP] Failed to select rectangle:', error);
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: 'Failed to select rectangle area'
                });
            }
        }, 100);
    };
};

//
implementSettings();
implementActions();
