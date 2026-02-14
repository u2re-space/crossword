/**
 * CrossWord — Popup Script
 *
 * Manages:
 *  - Snip & Process actions (Feature #2)
 *  - Copy-as-* buttons (Feature #3)
 *  - Markdown Viewer URL opener (Feature #1)
 *  - Settings (API key, language, translate, SVG)
 */

import "./index.scss";
import { createRuntimeChannelModule } from "../shared/runtime";

// ---------------------------------------------------------------------------
// CRX environment
// ---------------------------------------------------------------------------

const isInCrx = typeof chrome !== "undefined" && chrome.runtime?.id;

let popupModule: any = null;
const getModule = async () => {
    if (!popupModule && isInCrx) popupModule = await createRuntimeChannelModule("crx-popup");
    return popupModule;
};

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------

const SETTINGS_KEY = "rs-settings";
type ResponseLanguage = "en" | "ru" | "auto";
type PopupSettings = { ai?: { apiKey?: string; baseUrl?: string; model?: string; responseLanguage?: ResponseLanguage; translateResults?: boolean; generateSvgGraphics?: boolean }; [k: string]: unknown };

const loadSettings = async (): Promise<PopupSettings> => {
    try { return ((await chrome.storage.local.get([SETTINGS_KEY]))[SETTINGS_KEY] as PopupSettings) || {}; }
    catch { return {}; }
};

const saveSettings = async (updates: { ai?: Partial<NonNullable<PopupSettings["ai"]>> }) => {
    try {
        const current = await loadSettings();
        await chrome.storage.local.set({ [SETTINGS_KEY]: { ...current, ai: { ...(current.ai || {}), ...(updates.ai || {}) } } });
        return true;
    } catch { return false; }
};

// ---------------------------------------------------------------------------
// Helper: send message to active tab content script, then close popup
// ---------------------------------------------------------------------------

const sendToTab = (type: string, extra?: Record<string, any>) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId != null) chrome.tabs.sendMessage(tabId, { type, ...extra })?.catch?.(console.warn);
        globalThis?.close?.();
    });
};

// ---------------------------------------------------------------------------
// Feature 2: Snip & Process
// ---------------------------------------------------------------------------

const initSnipActions = () => {
    const select = document.getElementById("snip-action-select") as HTMLSelectElement;
    const btn = document.getElementById("snip-do") as HTMLButtonElement;

    btn?.addEventListener("click", async () => {
        const action = select?.value;
        if (!action) return;

        if (action === "CRX_SNIP_TEXT") {
            // Get selected text and process via SW
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) return;
            const results = await chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: () => (typeof window != "undefined" ? window : globalThis)?.getSelection()?.toString() || "" });
            const text = results[0]?.result || "";
            if (!text.trim()) { chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord", message: "Select text first!" }); return; }

            try {
                const module = await getModule();
                if (!module) throw new Error("Module unavailable");
                const result = await module.processText(text);
                chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord", message: result?.ok !== false ? "Text processed!" : `Failed: ${result?.error || "Unknown"}` });
            } catch (e) {
                chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord", message: `Failed: ${e instanceof Error ? e.message : String(e)}` });
            }
            globalThis?.close?.();
            return;
        }

        if (action === "CRX_SNIP_SCREEN") {
            // Close popup first, then trigger rect selection in content script
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) return;
            globalThis?.close?.();

            setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id!, { type: "crx-snip-select-rect" }, (response) => {
                    if (chrome.runtime.lastError || !response?.rect) return;
                    chrome.runtime.sendMessage({ type: "crx-snip-screen-capture", rect: response.rect, scale: 1 }).catch(console.warn);
                });
            }, 100);
            return;
        }

        // Regular snip modes → content script
        sendToTab(action);
    });
};

// ---------------------------------------------------------------------------
// Feature 3: Copy-as-* buttons
// ---------------------------------------------------------------------------

const initCopyButtons = () => {
    document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
        btn.addEventListener("click", () => sendToTab(btn.dataset.copy!));
    });
};

// ---------------------------------------------------------------------------
// Feature 1: Markdown Viewer
// ---------------------------------------------------------------------------

const initMarkdownViewer = () => {
    const input = document.getElementById("md-url") as HTMLInputElement;
    const btn = document.getElementById("md-open") as HTMLButtonElement;

    const openUrl = () => {
        const url = input?.value?.trim();
        if (!url) return;
        const viewerUrl = chrome.runtime.getURL("markdown/viewer.html");
        chrome.tabs.create({ url: `${viewerUrl}?src=${encodeURIComponent(url)}` });
        globalThis?.close?.();
    };

    btn?.addEventListener("click", openUrl);
    input?.addEventListener("keydown", (e) => { if (e.key === "Enter") openUrl(); });
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const initSettingsUI = () => {
    const apiKey = document.getElementById("api-key") as HTMLInputElement;
    const apiUrl = document.getElementById("api-url") as HTMLInputElement;
    const saveBtn = document.getElementById("save-settings") as HTMLButtonElement;
    const showKey = document.getElementById("show-api-key") as HTMLInputElement;
    const langSel = document.getElementById("response-language") as HTMLSelectElement;
    const translateCb = document.getElementById("translate-results") as HTMLInputElement;
    const svgCb = document.getElementById("generate-svg") as HTMLInputElement;

    // Load
    loadSettings().then((s) => {
        if (apiUrl) apiUrl.value = (s.ai?.baseUrl || "").trim();
        if (apiKey) apiKey.value = (s.ai?.apiKey || "").trim();
        if (langSel) langSel.value = s.ai?.responseLanguage || "auto";
        if (translateCb) translateCb.checked = s.ai?.translateResults || false;
        if (svgCb) svgCb.checked = s.ai?.generateSvgGraphics || false;
    }).catch(console.warn);

    // Save
    saveBtn?.addEventListener("click", async () => {
        const ok = await saveSettings({
            ai: {
                apiKey: apiKey?.value?.trim() || "",
                baseUrl: apiUrl?.value?.trim() || "",
                responseLanguage: (langSel?.value as ResponseLanguage) || "auto",
                translateResults: translateCb?.checked || false,
                generateSvgGraphics: svgCb?.checked || false,
            },
        });
        if (ok) {
            const orig = saveBtn.textContent;
            saveBtn.textContent = "Saved!";
            saveBtn.disabled = true;
            setTimeout(() => { saveBtn.textContent = orig; saveBtn.disabled = false; }, 1000);
        }
    });

    // Trim on change
    apiUrl?.addEventListener("change", () => { apiUrl.value = apiUrl.value.trim(); });
    apiKey?.addEventListener("change", () => { apiKey.value = apiKey.value.trim(); });

    // Toggle key visibility
    showKey?.addEventListener("click", () => { if (apiKey) apiKey.type = showKey.checked ? "text" : "password"; });
};

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

initSnipActions();
initCopyButtons();
initMarkdownViewer();
initSettingsUI();
