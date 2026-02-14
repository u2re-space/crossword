import { createRuntimeChannelModule } from '../modules/runtime.js';
import '../modules/Env.js';

const isInCrx = typeof chrome !== "undefined" && chrome.runtime?.id;
let popupModule = null;
const getModule = async () => {
  if (!popupModule && isInCrx) popupModule = await createRuntimeChannelModule("crx-popup");
  return popupModule;
};
const SETTINGS_KEY = "rs-settings";
const loadSettings = async () => {
  try {
    return (await chrome.storage.local.get([SETTINGS_KEY]))[SETTINGS_KEY] || {};
  } catch {
    return {};
  }
};
const saveSettings = async (updates) => {
  try {
    const current = await loadSettings();
    await chrome.storage.local.set({ [SETTINGS_KEY]: { ...current, ai: { ...current.ai || {}, ...updates.ai || {} } } });
    return true;
  } catch {
    return false;
  }
};
const sendToTab = (type, extra) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId != null) chrome.tabs.sendMessage(tabId, { type, ...extra })?.catch?.(console.warn);
    window?.close?.();
  });
};
const initSnipActions = () => {
  const select = document.getElementById("snip-action-select");
  const btn = document.getElementById("snip-do");
  btn?.addEventListener("click", async () => {
    const action = select?.value;
    if (!action) return;
    if (action === "CRX_SNIP_TEXT") {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) return;
      const results = await chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: () => window.getSelection()?.toString() || "" });
      const text = results[0]?.result || "";
      if (!text.trim()) {
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord", message: "Select text first!" });
        return;
      }
      try {
        const module = await getModule();
        if (!module) throw new Error("Module unavailable");
        const result = await module.processText(text);
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord", message: result?.ok !== false ? "Text processed!" : `Failed: ${result?.error || "Unknown"}` });
      } catch (e) {
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord", message: `Failed: ${e instanceof Error ? e.message : String(e)}` });
      }
      window?.close?.();
      return;
    }
    if (action === "CRX_SNIP_SCREEN") {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) return;
      window?.close?.();
      setTimeout(() => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "crx-snip-select-rect" }, (response) => {
          if (chrome.runtime.lastError || !response?.rect) return;
          chrome.runtime.sendMessage({ type: "crx-snip-screen-capture", rect: response.rect, scale: 1 }).catch(console.warn);
        });
      }, 100);
      return;
    }
    sendToTab(action);
  });
};
const initCopyButtons = () => {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => sendToTab(btn.dataset.copy));
  });
};
const initMarkdownViewer = () => {
  const input = document.getElementById("md-url");
  const btn = document.getElementById("md-open");
  const openUrl = () => {
    const url = input?.value?.trim();
    if (!url) return;
    const viewerUrl = chrome.runtime.getURL("markdown/viewer.html");
    chrome.tabs.create({ url: `${viewerUrl}?src=${encodeURIComponent(url)}` });
    window?.close?.();
  };
  btn?.addEventListener("click", openUrl);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") openUrl();
  });
};
const initSettingsUI = () => {
  const apiKey = document.getElementById("api-key");
  const apiUrl = document.getElementById("api-url");
  const saveBtn = document.getElementById("save-settings");
  const showKey = document.getElementById("show-api-key");
  const langSel = document.getElementById("response-language");
  const translateCb = document.getElementById("translate-results");
  const svgCb = document.getElementById("generate-svg");
  loadSettings().then((s) => {
    if (apiUrl) apiUrl.value = (s.ai?.baseUrl || "").trim();
    if (apiKey) apiKey.value = (s.ai?.apiKey || "").trim();
    if (langSel) langSel.value = s.ai?.responseLanguage || "auto";
    if (translateCb) translateCb.checked = s.ai?.translateResults || false;
    if (svgCb) svgCb.checked = s.ai?.generateSvgGraphics || false;
  }).catch(console.warn);
  saveBtn?.addEventListener("click", async () => {
    const ok = await saveSettings({
      ai: {
        apiKey: apiKey?.value?.trim() || "",
        baseUrl: apiUrl?.value?.trim() || "",
        responseLanguage: langSel?.value || "auto",
        translateResults: translateCb?.checked || false,
        generateSvgGraphics: svgCb?.checked || false
      }
    });
    if (ok) {
      const orig = saveBtn.textContent;
      saveBtn.textContent = "Saved!";
      saveBtn.disabled = true;
      setTimeout(() => {
        saveBtn.textContent = orig;
        saveBtn.disabled = false;
      }, 1e3);
    }
  });
  apiUrl?.addEventListener("change", () => {
    apiUrl.value = apiUrl.value.trim();
  });
  apiKey?.addEventListener("change", () => {
    apiKey.value = apiKey.value.trim();
  });
  showKey?.addEventListener("click", () => {
    if (apiKey) apiKey.type = showKey.checked ? "text" : "password";
  });
};
initSnipActions();
initCopyButtons();
initMarkdownViewer();
initSettingsUI();
//# sourceMappingURL=popup.js.map
