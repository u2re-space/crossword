import { showToast } from "./overlay";

// Convert data to string safely
const toText = (data: unknown): string => {
    if (data == null) return "";
    if (typeof data === "string") return data;
    try {
        return JSON.stringify(data);
    } catch {
        return String(data);
    }
};

// clipboard copy with permissions check
export const COPY_HACK = async (data: unknown): Promise<boolean> => {
    const text = toText(data).trim();
    if (!text) return false;

    try {
        // try direct clipboard API first
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.warn("Direct clipboard write failed:", err);
    }

    // fallback: try with permissions query
    try {
        const result = await navigator.permissions.query({ name: "clipboard-write" } as PermissionDescriptor);
        if (result.state === "granted" || result.state === "prompt") {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (err) {
        console.warn("Clipboard permission query failed:", err);
    }

    return false;
};

// message handler for COPY_HACK operations from service worker
chrome.runtime.onMessage.addListener((res, _sender, sendResponse) => {
    if (res?.type === "COPY_HACK") {
        (async () => {
            const rawData = res?.data;
            const text = toText(rawData).trim();
            const copySuccess = await COPY_HACK(text);

            // show appropriate toast
            if (copySuccess && text) {
                showToast("Copied to clipboard");
            } else if (res?.error) {
                showToast(res.error);
            } else if (!text) {
                showToast("Nothing to copy");
            } else {
                showToast("Failed to copy");
            }

            sendResponse({ ok: copySuccess, data: text });
        })();
        return true;
    }
    return false;
});
