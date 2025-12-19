// offscreen document for clipboard operations
// used as fallback when content script clipboard access fails

const COPY_HACK = async (data: unknown): Promise<void | null> => {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    try {
        const result = await navigator.permissions.query({ name: "clipboard-write" } as PermissionDescriptor);
        if (result.state === "granted" || result.state === "prompt") {
            await navigator.clipboard.writeText(text || " ");
            return;
        }
    } catch (err) {
        console.warn("Failed to copy text:", err);
    }
    return null;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.target !== "offscreen") return false;
    if (message?.type === "COPY_HACK") {
        COPY_HACK(message?.data)
            ?.then(() => sendResponse({ ok: true, data: message?.data }))
            ?.catch((err) => {
                console.warn("Failed to copy text:", err);
                sendResponse({ ok: false, data: message?.data, error: String(err) });
            });
        return true;
    }
    return false;
});

