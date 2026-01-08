import "./index.scss";

// Import CRX runtime channel module for inline coding style
import { createRuntimeChannelModule } from '../shared/runtime';

// Check if we're in CRX environment
const isInCrxEnvironment = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Create runtime module for inline usage
let popupModule: any = null;
const getPopupModule = async () => {
    if (!popupModule && isInCrxEnvironment) {
        popupModule = await createRuntimeChannelModule('crx-popup');
    }
    return popupModule;
};

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

        // Send to service worker for processing via runtime module
        if (!isInCrxEnvironment) {
            console.warn('[Popup] Chrome extension environment not available');
            return;
        }

        try {
            const module = await getPopupModule();
            if (!module) {
                throw new Error('Popup runtime module not available');
            }

            // Inline coding style: await module.processText(text)
            const result = await module.processText(selectedText);

            if (result && result.ok !== false) {
                // Handle success
                console.log('[Popup] Text processed successfully');
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: 'Text processed and copied to clipboard!'
                });
            } else {
                console.error('[Popup] Text processing failed:', result?.error);
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: `Text processing failed: ${result?.error || 'Unknown error'}`
                });
            }
        } catch (error) {
            console.error('[Popup] Runtime module error:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: `Processing failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }

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
                chrome.tabs.sendMessage(activeTab.id!, {
                    type: 'crx-snip-select-rect'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[CRX-SNIP] Rectangle selection message failed:', chrome.runtime.lastError);
                        return;
                    }

                    // Response will contain the selected rectangle
                    if (response?.rect) {
                        console.log('[CRX-SNIP] Rectangle selected:', response.rect);

                        // Send message to service worker via runtime module
                        Promise.try(async () => {


                            const module = await getPopupModule();
                            if (!module) {
                                throw new Error('Popup runtime module not available');
                            }

                            // Inline coding style: await module.captureWithRect(mode)
                            const result = await module.captureWithRect('default');

                            if (!result?.ok) {
                                chrome.notifications.create({
                                    type: 'basic',
                                    iconUrl: 'icons/icon.png',
                                    title: 'CrossWord CRX-Snip',
                                    message: `Screen capture failed: ${result?.error || 'Unknown error'}`
                                });
                            }
                        })?.catch?.((error) => {
                            console.error('[CRX-SNIP] Runtime module screen capture failed:', error);
                            chrome.notifications.create({
                                type: 'basic',
                                iconUrl: 'icons/icon.png',
                                title: 'CrossWord CRX-Snip',
                                message: 'Screen capture failed'
                            });
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

// ============================================================================
// UNIFIED MESSAGING SETUP
// ============================================================================

// Set up unified messaging handlers if in CRX environment
if (isInCrxEnvironment) {
    const popupChannel = getPopupModule();
    if (!popupChannel) {
        console.error('[Popup] Popup runtime module not available');
    }

    // Register handlers for async processing updates via unified messaging
    popupChannel?.request?.('registerHandler', ['processingStarted', async (data: any) => {
        console.log('[Popup] Processing started:', data);
        // Could update popup UI to show processing status
    }]);

    popupChannel?.request?.('registerHandler', ['processingComplete', async (data: any) => {
        console.log('[Popup] Processing completed:', data);
        // Could update popup with results or show completion notification
    }]);

    popupChannel?.request?.('registerHandler', ['processingError', async (data: any) => {
        console.error('[Popup] Processing error:', data);
        // Could show error notification in popup
    }]);

    popupChannel?.request?.('registerHandler', ['processingProgress', async (data: any) => {
        console.log('[Popup] Processing progress:', data);
        // Could update progress indicator in popup
    }]);
}

//
implementSettings();
implementActions();
