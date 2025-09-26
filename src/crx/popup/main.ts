import { postShareTarget } from "@rs-core/service/Cache";

const openSettings = () => chrome.runtime.openOptionsPage?.();

const pasteAndRecognize = async () => {
    try {
        if ((navigator.clipboard as any)?.read) {
            const items = await (navigator.clipboard as any).read();
            for (const item of items) {
                const blob = await item.getType(item.types?.[0] ?? "text/plain");
                await postShareTarget({ file: blob }, "bonus");
            }
            return;
        }
        const text = await navigator.clipboard.readText();
        if (text) await postShareTarget({ text }, "bonus");
    } catch (error) {
        console.warn("pasteRecognize", error);
    }
};

const snipAndRecognize = async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;
        const imageUri = await chrome.tabs.captureVisibleTab?.();
        if (imageUri) await postShareTarget({ text: imageUri }, "bonus");
    } catch (error) {
        console.warn("snipRecognize", error);
    }
};

const openTimeline = async () => {
    await chrome.tabs.create({ url: chrome.runtime.getURL("settings/index.html#timeline") });
};

document.getElementById("open-settings")?.addEventListener("click", openSettings);
document.getElementById("paste-recognize")?.addEventListener("click", pasteAndRecognize);
document.getElementById("snip-recognize")?.addEventListener("click", snipAndRecognize);
document.getElementById("open-timeline")?.addEventListener("click", openTimeline);

