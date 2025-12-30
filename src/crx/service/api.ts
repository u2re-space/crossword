import { ableToShowImage, encodeWithJSquash, removeAnyPrefix } from "@rs-core/utils/ImageProcess";
import { recognizeImageData, solveAndAnswer, writeCode, extractCSS, recognizeByInstructions } from "./RecognizeData";
import type { RecognizeResult } from "./RecognizeData";
import { requestCopyViaCRX, toText } from "@rs-frontend/shared/Clipboard";
import { getCustomInstructions } from "@rs-core/service/CustomInstructions";

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

/**
 * Send to content script to trigger clipboard copy
 * Uses unified Clipboard module with fallback to offscreen document
 */
export const COPY_HACK = async (
    ext: typeof chrome,
    data: { ok?: boolean; data?: string; error?: string },
    tabId?: number
) => {
    const text = toText(data?.data).trim();
    if (!text) return { ok: false, error: "Empty content" };

    // Use unified clipboard API with CRX support and offscreen fallback
    return requestCopyViaCRX(text, {
        tabId,
        offscreenFallback: async (content) => {
            try {
                // Create offscreen document if needed
                const offscreenUrl = "offscreen/copy.html";
                const existingContexts = await ext.runtime.getContexts?.({
                    contextTypes: [ext.runtime.ContextType.OFFSCREEN_DOCUMENT as any],
                    documentUrls: [ext.runtime.getURL(offscreenUrl)]
                })?.catch?.(() => []);

                if (!existingContexts?.length) {
                    await ext.offscreen.createDocument({
                        url: offscreenUrl,
                        reasons: [ext.offscreen.Reason.CLIPBOARD],
                        justification: "Clipboard API access for copying recognized text"
                    });
                }

                // Send message to offscreen document
                const response = await ext.runtime.sendMessage({
                    target: "offscreen",
                    type: "COPY_HACK",
                    data: content
                });
                return response?.ok ?? false;
            } catch (err) {
                console.warn("[COPY_HACK] Offscreen fallback failed:", err);
                return false;
            }
        }
    });
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

        // Handle unified solve/answer from captured image (equations, questions, quizzes)
        if (msg?.type === "CAPTURE_SOLVE" || msg?.type === "CAPTURE_ANSWER") {
            (async () => {
                try {
                    const rect = msg.rect;

                    // capture visible tab with optional crop rect
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

                    // prepare input for solve/answer
                    const input = [{
                        type: "message",
                        role: "user",
                        content: [{
                            type: "input_image",
                            image_url: finalUrl
                        }]
                    }];

                    // call unified AI solver/answerer
                    const result = await solveAndAnswer(input);
                    const solutionText = extractRecognizedText(result);

                    const res = {
                        ok: result?.ok ?? !!solutionText,
                        data: solutionText,
                        error: result?.error || (!solutionText ? "Could not solve/answer" : undefined)
                    };

                    // copy solution to clipboard if successful
                    if (res.ok && res.data) {
                        await COPY_HACK(ext, res, sender?.tab?.id)?.catch?.(console.warn.bind(console));
                    }

                    sendResponse(res);
                } catch (e) {
                    console.error("Solve/answer failed:", e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
            return true; // async response
        }

        // Handle code writing from captured image
        if (msg?.type === "CAPTURE_CODE") {
            (async () => {
                try {
                    const rect = msg.rect;
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

                    let finalUrl = await compressIfNeeded(dataUrl);
                    if (!finalUrl || !(await ableToShowImage(finalUrl))) {
                        finalUrl = dataUrl;
                    }

                    const input = [{
                        type: "message",
                        role: "user",
                        content: [{ type: "input_image", image_url: finalUrl }]
                    }];

                    const result = await writeCode(input);
                    const codeText = extractRecognizedText(result);

                    const res = {
                        ok: result?.ok ?? !!codeText,
                        data: codeText,
                        error: result?.error || (!codeText ? "Could not generate code" : undefined)
                    };

                    if (res.ok && res.data) {
                        await COPY_HACK(ext, res, sender?.tab?.id)?.catch?.(console.warn.bind(console));
                    }

                    sendResponse(res);
                } catch (e) {
                    console.error("Code generation failed:", e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
            return true;
        }

        // Handle CSS extraction from captured image
        if (msg?.type === "CAPTURE_CSS") {
            (async () => {
                try {
                    const rect = msg.rect;
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

                    let finalUrl = await compressIfNeeded(dataUrl);
                    if (!finalUrl || !(await ableToShowImage(finalUrl))) {
                        finalUrl = dataUrl;
                    }

                    const input = [{
                        type: "message",
                        role: "user",
                        content: [{ type: "input_image", image_url: finalUrl }]
                    }];

                    const result = await extractCSS(input);
                    const cssText = extractRecognizedText(result);

                    const res = {
                        ok: result?.ok ?? !!cssText,
                        data: cssText,
                        error: result?.error || (!cssText ? "Could not extract CSS" : undefined)
                    };

                    if (res.ok && res.data) {
                        await COPY_HACK(ext, res, sender?.tab?.id)?.catch?.(console.warn.bind(console));
                    }

                    sendResponse(res);
                } catch (e) {
                    console.error("CSS extraction failed:", e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
            return true;
        }

        // Handle custom instruction capture
        if (msg?.type === "CAPTURE_CUSTOM") {
            (async () => {
                try {
                    const rect = msg.rect;
                    const instructionId = msg.instructionId;

                    // Load custom instruction
                    const instructions = await getCustomInstructions().catch(() => []);
                    const instruction = instructions.find(i => i.id === instructionId);

                    if (!instruction) {
                        sendResponse({ ok: false, error: "Custom instruction not found" });
                        return;
                    }

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

                    let finalUrl = await compressIfNeeded(dataUrl);
                    if (!finalUrl || !(await ableToShowImage(finalUrl))) {
                        finalUrl = dataUrl;
                    }

                    const input = [{
                        type: "message",
                        role: "user",
                        content: [{ type: "input_image", image_url: finalUrl }]
                    }];

                    const result = await recognizeByInstructions(input, instruction.instruction);
                    const resultText = extractRecognizedText(result);

                    const res = {
                        ok: result?.ok ?? !!resultText,
                        data: resultText,
                        error: result?.error || (!resultText ? `${instruction.label} failed` : undefined)
                    };

                    if (res.ok && res.data) {
                        await COPY_HACK(ext, res, sender?.tab?.id)?.catch?.(console.warn.bind(console));
                    }

                    sendResponse(res);
                } catch (e) {
                    console.error("Custom instruction failed:", e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
            return true;
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
