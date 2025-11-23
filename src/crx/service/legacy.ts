export const enableLegacyTestCode = (chrome) => {
    //
    chrome.runtime.onInstalled.addListener(() => {
        chrome.contextMenus.create({
            id: "crossword-recognize-selection",
            title: "Recognize selection with CrossWord",
            contexts: ["selection", "image"],
        });
    });

    // context menu to recognize selection or image
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId !== "crossword-recognize-selection") return;
        try {
            const response = await chrome.tabs.sendMessage(tab?.id ?? 0, { type: "highlight-selection" });
            const text = response?.selection ?? info.selectionText ?? "";
            if (!text && info?.srcUrl) {
                await chrome.runtime.sendMessage({ type: "snip-image", src: info.srcUrl });
                return;
            }
            if (text) await chrome.runtime.sendMessage({ type: "recognize-text", text });
        } catch (error) {
            console.warn("context menu", error);
        }
    });

    // sending to service worker URL, but in chrome extension useless idea, because itself is chrome service worker
    chrome.runtime.onMessage.addListener(async (message) => {
        if (message?.type === "snip-image" && message.src) {
            // TODO! implement snip-image
            return true;
        }
        if (message?.type === "recognize-text" && message.text) {
            // TODO! implement recognize-text
            return true;
        }
    });
}
