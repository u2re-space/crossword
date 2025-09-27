import "./index.scss";
import { loadSettings, saveSettings } from "@rs-core/config/Settings";

// TODO! replace by indexedDB settings!
const implementSettings = () => {
    const apiKey = document.getElementById('api-key') as HTMLInputElement;
    const apiUrl = document.getElementById('api-url') as HTMLInputElement;
    const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;

    loadSettings().then((settings) => {
        if (apiUrl) apiUrl.value = settings.ai?.baseUrl || apiUrl.value;
        if (apiKey) apiKey.value = settings.ai?.apiKey || apiKey.value;
    })?.catch?.(console.warn.bind(console));

    //
    saveSettingsBtn?.addEventListener('click', async () => {
        saveSettings({
            ai: {
                baseUrl: apiUrl?.value as string || "",
                apiKey: apiKey?.value as string || ""
            }
        })?.catch?.(console.warn.bind(console));

        //
        if (apiKey) apiKey.value = apiKey.value?.trim?.() || "";
        if (apiUrl) apiUrl.value = apiUrl.value?.trim?.() || "";
    })//?.catch?.(console.warn.bind(console));

    // trim values for better user experience
    apiUrl?.addEventListener('change', () => { apiUrl.value = apiUrl.value?.trim?.() || ""; });
    apiKey?.addEventListener('change', () => { apiKey.value = apiKey.value?.trim?.() || ""; });

    //
    const showApiKey = document.getElementById('show-api-key') as HTMLInputElement;
    showApiKey?.addEventListener('click', () => {
        apiKey.type = showApiKey!.checked ? "text" : "password";
    })//?.catch?.(console.warn.bind(console));
}

//
const implementActions = () => {
    const snipAndRecognize = document.getElementById('snip-and-recognize') as HTMLButtonElement;
    snipAndRecognize?.addEventListener('click', () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0]?.id!, { type: "START_SNIP" })?.catch?.(console.warn.bind(console));
            document?.documentElement?.blur?.();
            document?.body?.blur?.();
            (document?.activeElement as any)?.blur?.();
            window?.close?.();
            //chrome.action.setPopup({ popup: "" });
        })//?.catch?.(console.warn.bind(console));
    })//?.catch?.(console.warn.bind(console));
}

//
implementSettings();
implementActions();
