chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "highlight-selection") {
        const selection = window.getSelection?.()?.toString?.() ?? "";
        sendResponse({ selection });
        return true;
    }
});

export { };

