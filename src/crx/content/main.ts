import { showToast } from "./overlay";

//
const COPY_HACK = async (data) => {
    if (data) {
        try {
            await navigator?.clipboard?.writeText?.(data)?.catch?.(err => {
                console.warn('Failed to copy text: ', err);
            });
            console.log('Text copied to clipboard');
        } catch (err) {
            console.warn('Failed to copy text: ', err);
        }
    }
}

//
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "highlight-selection") {
        const selection = window.getSelection?.()?.toString?.() ?? "";
        sendResponse({ selection });
        return true;
    }
});

//
chrome.runtime.onMessage.addListener((res, sender, sendResponse) => {
    (async () => {
        if (res?.type == "COPY_HACK") {
            await COPY_HACK(res?.data);
            sendResponse({ ok: res?.ok ?? true, data: res?.data });
            showToast(res?.ok ? "Copying is done" : (res?.error || "Failed to copy"));
        }
    })();
    return true;
});
