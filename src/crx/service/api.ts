import { ableToShowImage, encodeWithJSquash, removeAnyPrefix } from "@rs-core/workers/ImageProcess";
import { recognizeImageData, solveAndAnswer, writeCode, extractCSS, recognizeByInstructions } from "../../com/service/service/RecognizeData";
import type { RecognizeResult } from "../../com/service/service/RecognizeData";
import { toText } from "@rs-core/modules/Clipboard";
import { getCustomInstructions } from "@rs-com/service/misc/CustomInstructions";

// 2MB threshold for compression
const SIZE_THRESHOLD = 1024 * 1024 * 2;

//
const isProbablyUrl = (value: string)=>{
    try {
        return Boolean(new URL(value));
    } catch {
        return false;
    }
};

// Handler functions for runtime channel messages
const handleCapture = async (ext: typeof chrome, data: any, sender: any) => {
    console.log('[Service API] Starting capture with data:', data);
    const rect = data.rect;
    const mode = data.mode || 'recognize';
    console.log('[Service API] Capture mode:', mode, 'rect:', rect);

    // Capture screenshot
    const captureOptions: { format: "png" | "jpeg"; scale?: number; rect?: typeof rect } = {
        format: "png",
        scale: 1
    };
    if (rect?.width > 0 && rect?.height > 0) {
        captureOptions.rect = rect;
    }
    console.log('[Service API] Capture options:', captureOptions);

    const dataUrl = await new Promise<string>((resolve, reject) => {
        chrome.tabs.captureVisibleTab(captureOptions, (url) => {
            if (chrome.runtime.lastError) {
                console.error('[Service API] Capture error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                console.log('[Service API] Screenshot captured, length:', url.length);
                resolve(url);
            }
        });
    });

    // Compress and validate
    console.log('[Service API] Compressing image...');
    let finalUrl = await compressIfNeeded(dataUrl);
    if (!finalUrl || !(await ableToShowImage(finalUrl))) {
        console.warn('[Service API] Compression failed or invalid image, using original');
        finalUrl = dataUrl;
    }
    console.log('[Service API] Final image length:', finalUrl.length);

    // Process based on mode
    console.log('[Service API] Converting to file...');
    const file = await dataUrlToFile(finalUrl, "snip.png");
    console.log('[Service API] File created:', file?.name, 'size:', file?.size, 'type:', file?.type);

    let result;
    console.log('[Service API] Starting AI processing with mode:', mode);

    try {
        switch (mode) {
            case 'recognize':
                console.log('[Service API] Calling recognizeImageData...');
                result = await recognizeImageData(file);
                console.log('[Service API] recognizeImageData result:', result);
                console.log('[Service API] Result data type:', typeof result?.data, 'length:', result?.data?.length, 'value:', JSON.stringify(result?.data));
                break;
            case 'solve':
                console.log('[Service API] Calling solveAndAnswer...');
                result = await solveAndAnswer(file);
                console.log('[Service API] solveAndAnswer result:', result);
                break;
            case 'code':
                console.log('[Service API] Calling writeCode...');
                result = await writeCode(file);
                console.log('[Service API] writeCode result:', result);
                break;
            case 'css':
                console.log('[Service API] Calling extractCSS...');
                result = await extractCSS(file);
                console.log('[Service API] extractCSS result:', result);
                break;
            default:
                console.log('[Service API] Defaulting to recognizeImageData...');
                result = await recognizeImageData(file);
                console.log('[Service API] recognizeImageData result:', result);
        }
    } catch (aiError) {
        console.error('[Service API] AI processing error:', aiError);
        result = { ok: false, error: String(aiError) };
    }

    // Copy to clipboard if successful
    if (result.ok && result.data) {
        await COPY_HACK(ext, result, sender?.tab?.id)?.catch?.(console.warn.bind(console));
    }

    return result;
};

const handleCaptureScreenshot = async (ext: typeof chrome, data: any) => {
    const rect = data.rect;

    const captureOptions: { format: "png" | "jpeg"; scale?: number; rect?: typeof rect } = {
        format: "png",
        scale: 1
    };
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

    // Compress and validate
    let finalUrl = await compressIfNeeded(dataUrl);
    if (!finalUrl || !(await ableToShowImage(finalUrl))) {
        finalUrl = dataUrl;
    }

    // Return just the image data, no AI processing
    return {
        ok: true,
        data: finalUrl,
        imageData: finalUrl
    };
};

const handleProcessImage = async (ext: typeof chrome, data: any, sender: any) => {
    const imageData = data.imageData;
    const mode = data.mode || 'recognize';

    // Convert to file if needed
    let file: File | Blob;
    if (typeof imageData === 'string') {
        file = await dataUrlToFile(imageData, "snip.png");
    } else {
        file = imageData;
    }

    // Process based on mode
    let result;
    switch (mode) {
        case 'recognize':
            result = await recognizeImageData(file);
            break;
        case 'solve':
            result = await solveAndAnswer(file);
            break;
        case 'code':
            result = await writeCode(file);
            break;
        case 'css':
            result = await extractCSS(file);
            break;
        default:
            result = await recognizeImageData(file);
    }

    // Copy to clipboard if successful
    if (result.ok && result.data) {
        await COPY_HACK(ext, result, sender?.tab?.id)?.catch?.(console.warn.bind(console));
    }

    return result;
};

const handleProcessText = async (ext: typeof chrome, data: any) => {
    // Process text through AI pipeline
    const result = await recognizeImageData(new Blob([data.content], { type: 'text/plain' }));
    return result;
};

const handleDoCopy = async (ext: typeof chrome, data: any) => {
    const result = await COPY_HACK(ext, data.data, data.tabId);
    return { success: result?.ok || false };
};

const handleLoadMarkdown = async (data: any) => {
    const src = data;

    const looksLikeHtmlDocument = (text: string): boolean => {
        const t = (text || "").trimStart().toLowerCase();
        if (t.startsWith("<!doctype html")) return true;
        if (t.startsWith("<html")) return true;
        if (t.startsWith("<head")) return true;
        if (t.startsWith("<body")) return true;
        if (t.startsWith("<?xml") && t.includes("<html")) return true;
        return false;
    };

    const MARKDOWN_EXTENSION_PATTERN = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;

    const looksLikeMarkdown = (text: string): boolean => {
        const trimmed = (text || "").trim();
        if (!trimmed) return false;
        // quick HTML guard
        if (looksLikeHtmlDocument(trimmed)) return false;
        // cheap markdown heuristics
        let hits = 0;
        if (/^#{1,6}\s+.+$/m.test(trimmed)) hits++;
        if (/^\s*[-*+]\s+\S+/m.test(trimmed)) hits++;
        if (/^\s*\d+\.\s+\S+/m.test(trimmed)) hits++;
        if (/```[\s\S]*?```/.test(trimmed)) hits++;
        if (/\[([^\]]+)\]\(([^)]+)\)/.test(trimmed)) hits++;
        return hits >= 2;
    };

    const guessLanguageFromUrl = (url: URL): string => {
        const name = (url.pathname.split("/").pop() || "").toLowerCase();
        const ext = name.includes(".") ? name.split(".").pop() : "";
        switch (ext) {
            case "ts": return "ts";
            case "tsx": return "tsx";
            case "js": return "js";
            case "jsx": return "jsx";
            case "json": return "json";
            case "css": return "css";
            case "scss": return "scss";
            case "html":
            case "htm": return "html";
            case "xml": return "xml";
            case "yml":
            case "yaml": return "yaml";
            case "py": return "py";
            case "sh": return "sh";
            case "go": return "go";
            case "rs": return "rs";
            case "java": return "java";
            default: return "";
        }
    };

    const wrapAsCodeFence = (text: string, lang: string) => {
        const safe = (text || "").replace(/\r\n/g, "\n");
        const fence = "```";
        const tag = lang ? `${lang}` : "";
        return `${fence}${tag}\n${safe}\n${fence}\n`;
    };

    const normalizeSourceUrl = (candidate: string) => {
        try {
            const u = new URL(candidate);

            // GitHub: /{owner}/{repo}/blob/{ref}/{path} -> raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}
            if (u.hostname === "github.com") {
                const parts = u.pathname.split("/").filter(Boolean);
                const blobIdx = parts.indexOf("blob");
                if (parts.length >= 5 && blobIdx === 2) {
                    const owner = parts[0];
                    const repo = parts[1];
                    const ref = parts[3];
                    const rest = parts.slice(4).join("/");
                    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest}`;
                }

                // GitHub: /{owner}/{repo}/raw/{ref}/{path} -> raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}
                const rawIdx = parts.indexOf("raw");
                if (parts.length >= 5 && rawIdx === 2) {
                    const owner = parts[0];
                    const repo = parts[1];
                    const ref = parts[3];
                    const rest = parts.slice(4).join("/");
                    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest}`;
                }
            }

            // GitLab: /{group}/{repo}/-/blob/{ref}/{path} -> /{group}/{repo}/-/raw/{ref}/{path}
            if (u.hostname.endsWith("gitlab.com")) {
                const parts = u.pathname.split("/").filter(Boolean);
                const dashIdx = parts.indexOf("-");
                if (dashIdx >= 0 && parts[dashIdx + 1] === "blob") {
                    const base = parts.slice(0, dashIdx).join("/");
                    const ref = parts[dashIdx + 2] || "";
                    const rest = parts.slice(dashIdx + 3).join("/");
                    return `https://${u.hostname}/${base}/-/raw/${ref}/${rest}`;
                }
            }

            // Bitbucket: `?raw=1` works for many src URLs
            if (u.hostname === "bitbucket.org") {
                if (!u.searchParams.has("raw")) u.searchParams.set("raw", "1");
                return u.toString();
            }

            return u.toString();
        } catch {
            return candidate;
        }
    };

    // Load text from source
    let text = "";
    let normalizedSrc: string | undefined;
    try {
        normalizedSrc = normalizeSourceUrl(src);
        const u = new URL(normalizedSrc);
        const res = await fetch(u.href, {
            credentials: "include",
            cache: "no-store",
            headers: { accept: "text/markdown,text/plain,*/*" }
        });
        if (!res.ok) {
            return { error: `Failed to load: ${res.status}` };
        }
        text = await res.text();

        // If we still got HTML (e.g. GitHub HTML page, error page), keep as-is but mark it.
        // The viewer will default to raw mode for HTML documents.
        if (looksLikeHtmlDocument(text)) {
            console.warn("[Service API] loadMarkdown fetched HTML document, not markdown:", u.href);
        } else {
            const ct = (res.headers.get("content-type") || "").toLowerCase();
            const isMdByUrl = MARKDOWN_EXTENSION_PATTERN.test(u.pathname);
            const isMdByCt = ct.includes("text/markdown");
            if (!isMdByUrl && !isMdByCt && !looksLikeMarkdown(text)) {
                text = wrapAsCodeFence(text, guessLanguageFromUrl(u));
            }
        }
    } catch {
        // Not a URL - treat as raw markdown
        text = src;
    }

    // Store in session storage for retrieval
    const key = `md_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await chrome.storage.session.set({ [key]: text });

    return { key, src: isProbablyUrl(normalizedSrc || src) ? (normalizedSrc || src) : undefined };
};

const handleCaptureWithRect = async (data: any) => {
    // This would be triggered from content script with rectangle selection
    // For now, return a placeholder - actual implementation would wait for rectangle
    return { status: 'rect_selection_required', mode: data.mode };
};

const dataUrlToFile = async (dataUrl: string, fallbackName = "snip.png"): Promise<File | Blob> => {
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        // Prefer File for better downstream detection/caching.
        try {
            return new File([blob], fallbackName, {
                type: blob.type || "image/png",
                lastModified: Date.now()
            });
        } catch {
            return blob;
        }
    } catch {
        // Fallback: pass through as string if conversion fails
        return new Blob([dataUrl], { type: "text/plain" });
    }
};

/**
 * Get the best available timing function for scheduling callbacks
 * Prefers requestAnimationFrame when available, falls back to setTimeout
 */
const getTimingFunction = (): ((callback: () => void) => void) => {
    if (typeof requestAnimationFrame !== 'undefined') {
        return requestAnimationFrame;
    }
    if (typeof setTimeout !== 'undefined') {
        return (cb) => setTimeout(cb, 0);
    }
    // Last resort: execute immediately
    return (cb) => cb();
};

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
 * Enhanced COPY_HACK with RAF timing and improved error handling
 * Uses unified Clipboard module with fallback to offscreen document
 */
export const COPY_HACK = async (
    ext: typeof chrome,
    data: { ok?: boolean; data?: string; error?: string },
    tabId?: number
): Promise<{ ok: boolean; error?: string }> => {
    try {
        const text = toText(data?.data).trim();
        if (!text) return { ok: false, error: "Empty content" };

        console.log(`[COPY_HACK] Starting clipboard operation for ${text.length} characters`);

        // Use RAF for better timing, fallback to setTimeout for service workers
        return new Promise<{ ok: boolean; error?: string }>((resolve) => {
            const timerFn = getTimingFunction();
            timerFn(async () => {
            let result = { ok: false, error: "No method succeeded" };

            // Method 1: Try content script first (most reliable)
            if (tabId && tabId > 0) {
                try {
                    console.log(`[COPY_HACK] Attempting content script copy on tab ${tabId}`);

                    // First check if the tab exists and is ready
                    const tab = await ext.tabs.get(tabId).catch(() => null);
                    if (!tab) {
                        console.warn(`[COPY_HACK] Tab ${tabId} not found or not accessible`);
                    } else {
                        console.log(`[COPY_HACK] Tab ${tabId} found: ${tab.url}`);

                        // Inject content script if not already present (for dynamic injection)
                        try {
                            await ext.scripting.executeScript({
                                target: { tabId },
                                files: ["content/main.ts"]
                            });
                            console.log(`[COPY_HACK] Content script injected into tab ${tabId}`);
                        } catch (injectErr) {
                            console.log(`[COPY_HACK] Content script already present or injection failed:`, injectErr);
                        }

                        const response = await ext.tabs.sendMessage(tabId, {
                            type: "COPY_HACK",
                            data: text
                        });

                        console.log(`[COPY_HACK] Content script response:`, response);

                        if (response?.ok) {
                            console.log(`[COPY_HACK] Content script copy succeeded`);
                            return resolve({ ok: true });
                        } else {
                            console.warn(`[COPY_HACK] Content script returned not ok:`, response);
                        }
                    }
                } catch (err) {
                    console.warn(`[COPY_HACK] Content script failed:`, err);
                }
            } else {
                console.log(`[COPY_HACK] No valid tabId provided:`, tabId);
            }

            // Method 2: Try offscreen document fallback
            try {
                console.log(`[COPY_HACK] Attempting offscreen document copy`);
                const offscreenUrl = "offscreen/copy.html";
                const existingContexts = await ext.runtime.getContexts?.({
                    contextTypes: [ext.runtime.ContextType.OFFSCREEN_DOCUMENT as any],
                    documentUrls: [ext.runtime.getURL(offscreenUrl)]
                })?.catch?.(() => []);

                console.log(`[COPY_HACK] Found ${existingContexts?.length || 0} existing offscreen contexts`);

                if (!existingContexts?.length) {
                    console.log(`[COPY_HACK] Creating offscreen document`);
                    try {
                        await ext.offscreen.createDocument({
                            url: offscreenUrl,
                            reasons: [ext.offscreen.Reason.CLIPBOARD],
                            justification: "Clipboard API access for copying recognized text"
                        });

                        // Wait longer for the document to fully initialize
                        console.log(`[COPY_HACK] Waiting for offscreen document to initialize...`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (createErr) {
                        console.warn(`[COPY_HACK] Failed to create offscreen document:`, createErr);
                        throw createErr;
                    }
                }

                console.log(`[COPY_HACK] Sending message to offscreen document`);
                const response = await ext.runtime.sendMessage({
                    target: "offscreen",
                    type: "COPY_HACK",
                    data: text
                });

                console.log(`[COPY_HACK] Offscreen response:`, response);

                if (response?.ok) {
                    console.log(`[COPY_HACK] Offscreen copy succeeded`);
                    return resolve({ ok: true });
                } else {
                    console.warn(`[COPY_HACK] Offscreen returned not ok:`, response);
                }
            } catch (err) {
                console.warn(`[COPY_HACK] Offscreen fallback failed:`, err);
            }

            // Method 3: Try all tabs as last resort
            try {
                console.log(`[COPY_HACK] Attempting copy on any available tab`);
                const tabs = await ext.tabs.query({}).catch(() => []);

                for (const tab of tabs || []) {
                    if (tab?.id && tab.id !== tabId) {
                        try {
                            // Inject content script if needed
                            await ext.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: ["content/main.ts"]
                            }).catch(() => {});

                            const response = await ext.tabs.sendMessage(tab.id, {
                                type: "COPY_HACK",
                                data: text
                            });

                            if (response?.ok) {
                                console.log(`[COPY_HACK] Copy succeeded on fallback tab ${tab.id}`);
                                return resolve({ ok: true });
                            }
                        } catch {
                            // Continue to next tab
                        }
                    }
                }
            } catch (err) {
                console.warn(`[COPY_HACK] Tab fallback failed:`, err);
            }

            // Method 4: Background script direct clipboard access (last resort)
            try {
                console.log(`[COPY_HACK] Attempting background script direct clipboard access`);
                // In service worker context, we can try navigator.clipboard directly
                if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                    console.log(`[COPY_HACK] Background script clipboard copy succeeded`);
                    return resolve({ ok: true });
                }
            } catch (err) {
                console.warn(`[COPY_HACK] Background script clipboard failed:`, err);
            }

            console.warn(`[COPY_HACK] All clipboard methods failed for ${text.length} characters`);
            resolve(result);
        });
    });
    } catch (error) {
        console.error(`[COPY_HACK] Unexpected error:`, error);
        return { ok: false, error: String(error) };
    }
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

// Service worker doesn't need a channel to itself - handlers are registered directly in message listener

// service worker makes screenshot of visible area (with optional crop rect)
export const enableCapture = (ext: typeof chrome) => {
    // Service worker handles messages directly - no need for unified channel

    ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        // Handle runtime channel messages (new format)
        if (msg?.id?.startsWith('crx_') && msg?.type && msg?.data) {
            console.log('[Service API] Received runtime channel message:', msg.type, 'id:', msg.id);
            (async () => {
                try {
                    let result;

                    console.log('[Service API] Processing method:', msg.type);
                    // Route based on message type (method name)
                    switch (msg.type) {
                        case 'capture':
                            result = await handleCapture(ext, msg.data, sender);
                            break;
                        case 'captureScreenshot':
                            result = await handleCaptureScreenshot(ext, msg.data);
                            break;
                        case 'processImage':
                            result = await handleProcessImage(ext, msg.data, sender);
                            break;
                        case 'processText':
                            result = await handleProcessText(ext, msg.data);
                            break;
                        case 'doCopy':
                            result = await handleDoCopy(ext, msg.data);
                            break;
                        case 'loadMarkdown':
                            result = await handleLoadMarkdown(msg.data);
                            break;
                        case 'captureWithRect':
                            result = await handleCaptureWithRect(msg.data);
                            break;
                        default:
                            result = { ok: false, error: `Unknown method: ${msg.type}` };
                    }

                    console.log('[Service API] Sending response for', msg.type, ':', result);
                    sendResponse(result);
                } catch (error) {
                    console.error('[Service API] Runtime channel error:', error);
                    sendResponse({ ok: false, error: String(error) });
                }
            })();
            return true; // async response
        }
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

                    // Use unified recognition pipeline (applies response language / translate / SVG settings)
                    const file = await dataUrlToFile(finalUrl, "snip.png");
                    const res = await recognizeImageData(file);

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

                    // Use unified pipeline (applies response language / translate / SVG settings)
                    const file = await dataUrlToFile(finalUrl, "snip.png");
                    const res = await solveAndAnswer(file);

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

                    // Use unified pipeline (applies response language / translate / SVG settings)
                    const file = await dataUrlToFile(finalUrl, "snip.png");
                    const res = await writeCode(file);

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

                    // Use unified pipeline (applies response language / translate / SVG settings)
                    const file = await dataUrlToFile(finalUrl, "snip.png");
                    const res = await extractCSS(file);

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
