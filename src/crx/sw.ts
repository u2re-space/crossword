chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "crossword-recognize-selection",
        title: "Recognize selection with CrossWord",
        contexts: ["selection", "image"],
    });
});

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

chrome.runtime.onMessage.addListener(async (message) => {
    if (message?.type === "snip-image" && message.src) {
        const { postShareTarget } = await import("@rs-core/service/Cache");
        await postShareTarget({ text: message.src }, "bonus");
        return true;
    }
    if (message?.type === "recognize-text" && message.text) {
        const { postShareTarget } = await import("@rs-core/service/Cache");
        await postShareTarget({ text: message.text }, "bonus");
        return true;
    }
});
