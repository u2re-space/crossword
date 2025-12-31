import { ableToShowImage, encodeWithJSquash, removeAnyPrefix } from "@rs-core/utils/ImageProcess";
import { recognizeImageData, solveAndAnswer, writeCode, extractCSS, recognizeByInstructions } from "./RecognizeData";
import type { RecognizeResult } from "./RecognizeData";
import { requestCopyViaCRX, toText } from "@rs-frontend/shared/Clipboard";
import { getCustomInstructions } from "@rs-core/service/CustomInstructions";
import { getGPTInstance } from "@rs-core/service/AI-ops/RecognizeData";

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
 * Enhanced COPY_HACK with RAF timing and improved error handling
 * Uses unified Clipboard module with fallback to offscreen document
 */
export const COPY_HACK = async (
    ext: typeof chrome,
    data: { ok?: boolean; data?: string; error?: string },
    tabId?: number
) => {
    const text = toText(data?.data).trim();
    if (!text) return { ok: false, error: "Empty content" };

    console.log(`[COPY_HACK] Starting clipboard operation for ${text.length} characters`);

    // Use RAF for better timing before attempting clipboard operations
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        requestAnimationFrame(async () => {
            let result = { ok: false, error: "No method succeeded" };

            // Method 1: Try content script first (most reliable)
            if (tabId && tabId > 0) {
                try {
                    console.log(`[COPY_HACK] Attempting content script copy on tab ${tabId}`);
                    const response = await ext.tabs.sendMessage(tabId, {
                        type: "COPY_HACK",
                        data: text
                    });

                    if (response?.ok) {
                        console.log(`[COPY_HACK] Content script copy succeeded`);
                        return resolve({ ok: true });
                    }
                } catch (err) {
                    console.warn(`[COPY_HACK] Content script failed:`, err);
                }
            }

            // Method 2: Try offscreen document fallback
            try {
                console.log(`[COPY_HACK] Attempting offscreen document copy`);
                const offscreenUrl = "offscreen/copy.html";
                const existingContexts = await ext.runtime.getContexts?.({
                    contextTypes: [ext.runtime.ContextType.OFFSCREEN_DOCUMENT as any],
                    documentUrls: [ext.runtime.getURL(offscreenUrl)]
                })?.catch?.(() => []);

                if (!existingContexts?.length) {
                    console.log(`[COPY_HACK] Creating offscreen document`);
                    await ext.offscreen.createDocument({
                        url: offscreenUrl,
                        reasons: [ext.offscreen.Reason.CLIPBOARD],
                        justification: "Clipboard API access for copying recognized text"
                    });

                    // Wait a bit for the document to initialize
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const response = await ext.runtime.sendMessage({
                    target: "offscreen",
                    type: "COPY_HACK",
                    data: text
                });

                if (response?.ok) {
                    console.log(`[COPY_HACK] Offscreen copy succeeded`);
                    return resolve({ ok: true });
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

            console.warn(`[COPY_HACK] All clipboard methods failed for ${text.length} characters`);
            resolve(result);
        });
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

                    // Use GPT instance directly for image recognition
                    const gpt = await getGPTInstance();
                    if (!gpt) {
                        throw new Error("AI service not available");
                    }

                    const IMAGE_INSTRUCTION = `
Recognize data from image, also preferred to orient by fonts in image.

In recognition result, do not include image itself.

In recognized from image data (what you seen in image), do:
- If textual content, format as Markdown string (multiline).
- If math (expression, equation, formula):
  - For inline math, use SINGLE dollar signs: $x^2 + y^2 = z^2$
  - For block/display math, use DOUBLE dollar signs: $$\\int_0^1 f(x) dx$$
  - Do NOT add extra dollar signs - use exactly one $ for inline, exactly two $$ for block
- If table (or looks alike table), format as | table |
- If image reference, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as JSON string.
- If phone number, format as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as correct email (in normalized format).
- If URL, format as correct URL (in normalized format), decode unicode to readable.
- If date, format as correct date (ISO format preferred).
- If time, format as correct time (24h format preferred).
- If barcode/QR code, extract the encoded data.
- If other structured data, format as appropriate markup.
- If mixed content, separate sections with headers.

IMPORTANT: Extract ALL visible text, numbers, symbols, equations, and data from the image.
If the image contains multiple items, list them all clearly.
If uncertain about any part, indicate it in the output but still extract what you can see.

Output ONLY the recognized content - no explanations, comments, or meta-information about the recognition process.
`;

                    console.log("[CRX] Setting up GPT for image recognition");
                    // Create a simple message structure for image recognition
                    gpt.pending.push({
                        type: "message",
                        role: "user",
                        content: [
                            { type: "input_text", text: IMAGE_INSTRUCTION },
                            { type: "input_image", image_url: finalUrl, detail: "auto" }
                        ]
                    });
                    console.log("[CRX] Calling GPT sendRequest for recognition");
                    const rawResponse = await gpt.sendRequest("low", "low");
                    console.log("[CRX] GPT recognition response:", rawResponse);

                    const recognizedText = rawResponse || "";

                    const res = {
                        ok: !!recognizedText,
                        data: recognizedText,
                        error: !recognizedText ? "No data recognized" : undefined
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

                    // Use GPT instance directly for better response handling
                    const gpt = await getGPTInstance();
                    if (!gpt) {
                        throw new Error("AI service not available");
                    }

                    const SOLVE_AND_ANSWER_INSTRUCTION = `You are an expert mathematician and problem solver. Analyze the provided content (which may be text, images, equations, or diagrams) and provide a clear, step-by-step solution or answer.

If the content contains:
- Mathematical equations: Solve them showing all work
- Word problems: Break down the problem and solve step by step
- Multiple choice questions: Show reasoning and select the best answer
- Diagrams or visual problems: Describe what you see and solve accordingly
- Programming problems: Provide the solution with explanation

Always show your work clearly and provide the final answer prominently. If multiple approaches are possible, show the most efficient one.`;

                    console.log("[CRX] Setting up GPT for solve/answer");
                    // Create a simple message structure for solve/answer
                    gpt.pending.push({
                        type: "message",
                        role: "user",
                        content: [
                            { type: "input_text", text: SOLVE_AND_ANSWER_INSTRUCTION },
                            { type: "input_image", image_url: finalUrl, detail: "auto" }
                        ]
                    });
                    console.log("[CRX] Calling GPT sendRequest for solve/answer");
                    const rawResponse = await gpt.sendRequest("high", "medium");
                    console.log("[CRX] GPT sendRequest result:", rawResponse);
                    const solutionText = rawResponse || "";
                    console.log("[CRX] Final solution text:", solutionText);

                    const res = {
                        ok: !!solutionText,
                        data: solutionText,
                        error: !solutionText ? "Could not solve/answer" : undefined
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

                    // Use GPT instance directly for code generation
                    const gpt = await getGPTInstance();
                    if (!gpt) {
                        throw new Error("AI service not available");
                    }

                    const WRITE_CODE_INSTRUCTION = `You are an expert software developer. Analyze the provided content (which may be text descriptions, images, diagrams, or partial code) and generate high-quality, working code.

Based on the content:
- If it's a description: Write complete, functional code that implements the described functionality
- If it's partial code: Complete the code or fix any issues
- If it's a diagram/flowchart: Implement the logic shown in the diagram
- If it's a UI mockup: Generate the corresponding HTML/CSS/JavaScript

Provide clean, well-commented, production-ready code. Include all necessary imports, error handling, and follow best practices for the detected programming language. If multiple languages are possible, choose the most appropriate one.`;

                    console.log("[CRX] Setting up GPT for code generation");
                    // Create a simple message structure for code generation
                    gpt.pending.push({
                        type: "message",
                        role: "user",
                        content: [
                            { type: "input_text", text: WRITE_CODE_INSTRUCTION },
                            { type: "input_image", image_url: finalUrl, detail: "auto" }
                        ]
                    });
                    console.log("[CRX] Calling GPT sendRequest for code generation");
                    const rawResponse = await gpt.sendRequest("high", "medium");
                    console.log("[CRX] GPT sendRequest result:", rawResponse);
                    const codeText = rawResponse || "";
                    console.log("[CRX] Final code text:", codeText);

                    const res = {
                        ok: !!codeText,
                        data: codeText,
                        error: !codeText ? "Could not generate code" : undefined
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

                    // Use GPT instance directly for CSS extraction
                    const gpt = await getGPTInstance();
                    if (!gpt) {
                        throw new Error("AI service not available");
                    }

                    const EXTRACT_CSS_INSTRUCTION = `You are an expert CSS developer. Analyze the provided content (which may be images, screenshots, mockups, or descriptions of UI elements) and extract/generate the corresponding CSS styles.

Based on the content:
- If it's a screenshot/mockup: Extract the visual styles, layout, colors, typography, and spacing
- If it's a description: Generate CSS that implements the described styling
- If it's existing code: Extract and improve the CSS styles
- If it's a design system: Generate comprehensive CSS variables and classes

Provide clean, modern CSS using:
- CSS custom properties for colors, spacing, typography
- Flexbox/Grid for layouts
- Modern CSS features (clamp(), CSS nesting if appropriate)
- Responsive design principles
- Semantic class names
- Well-organized, maintainable code structure

Include all relevant CSS properties including layout, colors, typography, spacing, borders, shadows, and animations.`;

                    console.log("[CRX] Setting up GPT for CSS extraction");
                    // Create a simple message structure for CSS extraction
                    gpt.pending.push({
                        type: "message",
                        role: "user",
                        content: [
                            { type: "input_text", text: EXTRACT_CSS_INSTRUCTION },
                            { type: "input_image", image_url: finalUrl, detail: "auto" }
                        ]
                    });
                    console.log("[CRX] Calling GPT sendRequest for CSS extraction");
                    const rawResponse = await gpt.sendRequest("high", "medium");
                    console.log("[CRX] GPT sendRequest result:", rawResponse);
                    const cssText = rawResponse || "";
                    console.log("[CRX] Final CSS text:", cssText);

                    const res = {
                        ok: !!cssText,
                        data: cssText,
                        error: !cssText ? "Could not extract CSS" : undefined
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
