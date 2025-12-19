import { ableToShowImage, encodeWithJSquash, removeAnyPrefix } from "@rs-core/utils/ImageProcess";
import { recognizeImageData } from "./RecognizeData";
import type { RecognizeResult } from "./RecognizeData";

// 2MB threshold for compression
const SIZE_THRESHOLD = 1024 * 1024 * 2;

// compress image to JPEG if too large
const compressIfNeeded = async (dataUrl: string): Promise<string> => {
    if (dataUrl.length <= SIZE_THRESHOLD) return dataUrl;

    try {
        // @ts-ignore - Uint8Array.fromBase64 is available in modern browsers
        const binary = Uint8Array.fromBase64(removeAnyPrefix(dataUrl), { alphabet: "base64" });
        const blob = new Blob([binary], { type: "image/png" });
        const bitmap = await createImageBitmap(blob);
        const arrayBuffer = await encodeWithJSquash(bitmap);
        bitmap?.close?.();
        if (arrayBuffer) {
            // @ts-ignore - Uint8Array.toBase64 is available in modern browsers
            return `data:image/jpeg;base64,${new Uint8Array(arrayBuffer).toBase64({ alphabet: "base64" })}`;
        }
    } catch (e) {
        console.warn("Image compression failed:", e);
    }
    return dataUrl;
};

// send to any available content script to trigger copy text
export const COPY_HACK = (ext: typeof chrome, data: { ok?: boolean; data?: string; error?: string }, tabId?: number) => {
    const message = { type: "COPY_HACK", ...data };

    // try specific tab first
    if (tabId != null && tabId >= 0) {
        return chrome.tabs.sendMessage(tabId, message)?.catch?.(console.warn.bind(console));
    }

    // fallback: find an active tab
    return ext.tabs.query({
        currentWindow: true,
        lastFocusedWindow: true,
        active: true,
    })?.then?.((tabs) => {
        for (const tab of tabs) {
            if (tab?.id != null && tab?.id >= 0) {
                return chrome.tabs.sendMessage(tab.id, message)?.catch?.(console.warn.bind(console));
            }
        }
    })?.catch?.(console.warn.bind(console));
};

// extract text from recognition result
const extractRecognizedText = (result: RecognizeResult): string => {
    if (typeof result == "string") return result;

    if (!result?.ok) return "";

    let text = result.data;

    // Handle case where data is not a string
    if (text && typeof text !== "string") {
        console.warn("Recognition result data is not a string:", typeof text);
        try {
            text = JSON.stringify(text);
        } catch {
            text = String(text);
        }
    }

    if (!text) return "";

    // try to extract from JSON if it looks like JSON
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (parsed?.recognized_data) {
                const rd = parsed.recognized_data;
                text = typeof rd === "string" ? rd : JSON.stringify(rd);
            } else if (parsed?.data) {
                const d = parsed.data;
                text = typeof d === "string" ? d : JSON.stringify(d);
            } else if (parsed?.text) {
                text = typeof parsed.text === "string" ? parsed.text : JSON.stringify(parsed.text);
            }
        } catch {
            // not valid JSON, use as-is
        }
    }

    return (typeof text === "string" ? text : String(text)).trim();
};

// service worker makes screenshot of visible area (with optional crop rect)
export const enableCapture = (ext: typeof chrome) => {
    ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg?.type === "CAPTURE") {
            (async () => {
                try {
                    const rect = msg.rect;

                    // capture visible tab with optional crop rect (scale:1 for pixel-perfect coords)
                    const captureOptions: { format: "png" | "jpeg"; scale?: number; rect?: typeof rect } = { format: "png", scale: 1 };
                    if (rect?.width > 0 && rect?.height > 0) {
                        captureOptions.rect = rect;
                    }

                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        chrome.tabs.captureVisibleTab(captureOptions, (url) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else {
                                resolve(url);
                            }
                        });
                    });

                    // compress only if > 2MB
                    let finalUrl = await compressIfNeeded(dataUrl);

                    // validate image, fallback to original if invalid
                    if (!finalUrl || !(await ableToShowImage(finalUrl))) {
                        finalUrl = dataUrl;
                    }

                    // prepare input for AI recognition
                    const input = [{
                        type: "message",
                        role: "user",
                        content: [{
                            type: "input_image",
                            image_url: finalUrl
                        }]
                    }];

                    // call AI recognition
                    const result = await recognizeImageData(input);
                    const recognizedText = extractRecognizedText(result);

                    const res = {
                        ok: result?.ok ?? !!recognizedText,
                        data: recognizedText,
                        error: result?.error || (!recognizedText ? "No data recognized" : undefined)
                    };

                    // copy to clipboard if successful
                    if (res.ok && res.data) {
                        await COPY_HACK(ext, res, sender?.tab?.id)?.catch?.(console.warn.bind(console));
                    }

                    sendResponse(res);
                } catch (e) {
                    console.error("Capture failed:", e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
            return true; // async response
        }

        if (msg?.type === "DOWNLOAD" && msg.dataUrl) {
            chrome.downloads.download(
                { url: msg.dataUrl, filename: "snip.png", saveAs: true },
                (id) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ ok: false, error: chrome.runtime.lastError.message, dataUrl: msg.dataUrl });
                    } else {
                        sendResponse({ ok: true, id });
                    }
                }
            );
            return true; // async response
        }

        return false;
    });
};
