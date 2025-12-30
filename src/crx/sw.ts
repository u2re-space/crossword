import { createTimelineGenerator, requestNewTimeline } from "@rs-core/service/AI-ops/MakeTimeline";
import { enableCapture } from "./service/api";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { recognizeImageData, solveAndAnswer, writeCode, extractCSS, recognizeByInstructions } from "./service/RecognizeData";
import { getGPTInstance } from "@rs-core/service/AI-ops/RecognizeData";
import { getCustomInstructions, type CustomInstruction } from "@rs-core/service/CustomInstructions";

// Safe wrapper for loading custom instructions
const loadCustomInstructions = async (): Promise<CustomInstruction[]> => {
    try {
        return await getCustomInstructions();
    } catch (e) {
        console.warn("Failed to load custom instructions:", e);
        return [];
    }
};

// BroadcastChannel for cross-context communication (share target-like behavior)
const TOAST_CHANNEL = "rs-toast";
const CLIPBOARD_CHANNEL = "rs-clipboard";
const AI_RECOGNITION_CHANNEL = "rs-ai-recognition";

// Broadcast helper for extension contexts
const broadcast = (channel: string, message: unknown): void => {
    try {
        const bc = new BroadcastChannel(channel);
        bc.postMessage(message);
        bc.close();
    } catch (e) {
        console.warn(`[CRX-SW] Broadcast to ${channel} failed:`, e);
    }
};

// Show toast across all contexts
const showExtensionToast = (message: string, kind: "info" | "success" | "warning" | "error" = "info"): void => {
    broadcast(TOAST_CHANNEL, {
        type: "show-toast",
        options: { message, kind, duration: 3000 }
    });
};

// Request clipboard copy across contexts
const requestClipboardCopy = (data: unknown, showFeedback = true): void => {
    broadcast(CLIPBOARD_CHANNEL, {
        type: "copy",
        data,
        options: { showFeedback }
    });
};

// Note: Offscreen document management is handled in crx/service/api.ts
// via the COPY_HACK function with offscreenFallback option

//
enableCapture(chrome);

const VIEWER_PAGE = "markdown/viewer.html";
const VIEWER_ORIGIN = chrome.runtime.getURL("");
const VIEWER_URL = chrome.runtime.getURL(VIEWER_PAGE);
const MARKDOWN_EXTENSION_PATTERN = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;
const MD_VIEW_MENU_ID = "crossword:markdown-view";

const isMarkdownUrl = (candidate?: string | null): candidate is string => {
    if (!candidate || typeof candidate !== "string") return false;
    try {
        const url = new URL(candidate);
        if (url.protocol === "chrome-extension:") return false;
        if (!["http:", "https:", "file:", "ftp:"].includes(url.protocol)) return false;
        // extension-based detection (fast path)
        if (MARKDOWN_EXTENSION_PATTERN.test(url.pathname)) return true;
        // known raw markdown hosts often have stable paths but sometimes omit extension
        if (url.hostname === "raw.githubusercontent.com" || url.hostname === "gist.githubusercontent.com") return true;
        return false;
    } catch {
        return false;
    }
};

const toViewerUrl = (source?: string | null, markdownKey?: string | null) => {
    if (!source) return VIEWER_URL;
    const params = new URLSearchParams();
    params.set("src", source);
    if (markdownKey) params.set("mdk", markdownKey);
    return `${VIEWER_URL}?${params.toString()}`;
};

const openViewer = (source?: string | null, destinationTabId?: number, markdownKey?: string | null) => {
    const url = toViewerUrl(source ?? undefined, markdownKey);
    if (typeof destinationTabId === "number") {
        chrome.tabs.update(destinationTabId, { url })?.catch?.(console.warn.bind(console));
    } else {
        chrome.tabs.create({ url })?.catch?.(console.warn.bind(console));
    }
};

const normalizeMarkdownSourceUrl = (candidate: string) => {
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
                const raw = new URL(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest}`);
                raw.hash = "";
                raw.search = "";
                return raw.toString();
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
                const raw = new URL(`https://${u.hostname}/${base}/-/raw/${ref}/${rest}`);
                raw.hash = "";
                raw.search = "";
                return raw.toString();
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

const fetchMarkdownText = async (candidate: string) => {
    const src = normalizeMarkdownSourceUrl(candidate);
    const res = await fetch(src, { credentials: "include", cache: "no-store" });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, src, text };
};

const openMarkdownInViewer = async (originalUrl: string, tabId: number) => {
    // file:// handled via tab text (see onCompleted)
    if (originalUrl.startsWith("file:")) {
        openViewer(originalUrl, tabId, null);
        return;
    }

    const fetched = await fetchMarkdownText(originalUrl).catch((e) => {
        console.warn("markdown fetch failed", e);
        return null;
    });

    if (!fetched) {
        openViewer(normalizeMarkdownSourceUrl(originalUrl), tabId, null);
        return;
    }

    const key = fetched.ok && fetched.text ? await putMarkdownToSession(fetched.text) : null;
    // pass the resolved src so reload works even for github blob urls
    openViewer(fetched.src, tabId, key);
};

const createSessionKey = () => {
    try {
        return `md:${crypto.randomUUID()}`;
    } catch {
        return `md:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    }
};

const putMarkdownToSession = async (text: string) => {
    const key = createSessionKey();
    try {
        await chrome.storage?.session?.set?.({ [key]: text });
        return key;
    } catch (e) {
        console.warn("Failed to store markdown in session", e);
        return null;
    }
};

const tryReadMarkdownFromTab = async (tabId: number) => {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const txt = document?.body?.innerText || document?.documentElement?.innerText || "";
                return typeof txt === "string" ? txt : "";
            },
        });
        const value = results?.[0]?.result;
        return typeof value === "string" ? value : "";
    } catch (e) {
        // Most common for file:// when user didn't enable "Allow access to file URLs".
        console.warn("Failed to read markdown from tab", tabId, e);
        return "";
    }
};

const CTX_CONTEXTS = [
    "all",
    "page",
    "frame",
    "selection",
    "link",
    "editable",
    "image",
    "video",
    "audio",
    "action",
] as const satisfies [`${chrome.contextMenus.ContextType}`, ...`${chrome.contextMenus.ContextType}`[]];

// Built-in context menu items
const CTX_ITEMS: Array<{ id: string; title: string }> = [
    { id: "copy-as-latex", title: "Copy as LaTeX" },
    { id: "copy-as-mathml", title: "Copy as MathML" },
    { id: "copy-as-markdown", title: "Copy as Markdown" },
    { id: "copy-as-html", title: "Copy as HTML" },
    { id: "START_SNIP", title: "Snip and Recognize (AI)" },
    { id: "SOLVE_AND_ANSWER", title: "Solve / Answer (AI)" },
    { id: "WRITE_CODE", title: "Write Code (AI)" },
    { id: "EXTRACT_CSS", title: "Extract CSS Styles (AI)" },
];

// Custom instruction prefix for context menu IDs
const CUSTOM_INSTRUCTION_PREFIX = "CUSTOM_INSTRUCTION:";

// Track custom instruction context menus
let customInstructionMenuIds: string[] = [];

// Update context menus with custom instructions
const updateCustomInstructionMenus = async () => {
    // Remove existing custom instruction menus
    for (const menuId of customInstructionMenuIds) {
        try {
            await chrome.contextMenus.remove(menuId);
        } catch { /* ignore */ }
    }
    customInstructionMenuIds = [];

    // Load custom instructions
    const instructions = await loadCustomInstructions().catch(() => []);
    const enabled = instructions.filter(i => i.enabled);

    if (enabled.length === 0) return;

    // Create separator before custom instructions
    const separatorId = "CUSTOM_SEP";
    try {
        chrome.contextMenus.create({
            id: separatorId,
            type: "separator",
            contexts: CTX_CONTEXTS,
        });
        customInstructionMenuIds.push(separatorId);
    } catch { /* ignore */ }

    // Create menu items for each custom instruction
    for (const instruction of enabled) {
        const menuId = `${CUSTOM_INSTRUCTION_PREFIX}${instruction.id}`;
        try {
            chrome.contextMenus.create({
                id: menuId,
                title: `🎯 ${instruction.label}`,
                contexts: CTX_CONTEXTS,
            });
            customInstructionMenuIds.push(menuId);
        } catch (e) {
            console.warn("[CRX-SW] Failed to create custom instruction menu:", e);
        }
    }
};

// Listen for settings changes to update menus
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes["rs-settings"]) {
        updateCustomInstructionMenus().catch(console.warn);
    }
});

// Handle messages from Extension UI or Content Scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'MAKE_TIMELINE') {
        const source = message.source || null;
        const speechPrompt = message.speechPrompt || null;
        createTimelineGenerator(source, speechPrompt).then(async (gptResponses) => {
            sendResponse(await (requestNewTimeline(gptResponses as GPTResponses) as unknown as any[] || []));
        }).catch((error) => {
            console.error("Timeline generation failed:", error);
            sendResponse({ error: error.message });
        });
        return true; // Indicates that the response is asynchronous
    }

    if (message?.type === "gpt:recognize") {
        const requestId = message?.requestId || `rec_${Date.now()}`;

        // Broadcast recognition start
        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "recognize",
            requestId,
            status: "processing"
        });

        recognizeImageData(message?.input, (result) => {
            // keep CrossHelp-compatible shape: res.data.output[...]
            const response = { ok: result?.ok, data: result?.raw, error: result?.error };

            // Broadcast result for cross-context handling
            broadcast(AI_RECOGNITION_CHANNEL, {
                type: "result",
                requestId,
                ...response
            });

            // Auto-copy to clipboard if successful and requested
            if (result?.ok && result?.raw && message?.autoCopy !== false) {
                const textResult = typeof result.raw === "string"
                    ? result.raw
                    : result.raw?.latex || result.raw?.text || JSON.stringify(result.raw);
                requestClipboardCopy(textResult, true);
            }

            sendResponse(response);
        })?.catch?.((e) => {
            const errorResponse = { ok: false, error: String(e) };
            broadcast(AI_RECOGNITION_CHANNEL, {
                type: "result",
                requestId,
                ...errorResponse
            });
            showExtensionToast(`Recognition failed: ${e}`, "error");
            sendResponse(errorResponse);
        });
        return true;
    }

    // Handle equation solving requests
    // Handle unified solve/answer requests (equations, questions, quizzes, homework)
    if (message?.type === "gpt:solve" || message?.type === "gpt:answer" || message?.type === "gpt:solve-answer") {
        const requestId = message?.requestId || `solve_${Date.now()}`;

        // Broadcast processing start
        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "solve-answer",
            requestId,
            status: "processing"
        });

        // Use GPT instance directly like CRX api.ts does
        (async () => {
            try {
                console.log("[CRX-SW] Processing solve/answer request");
                const gpt = await getGPTInstance();
                if (!gpt) {
                    const errorResponse = { ok: false, error: "AI service not available" };
                    broadcast(AI_RECOGNITION_CHANNEL, {
                        type: "result",
                        requestId,
                        mode: "solve-answer",
                        ...errorResponse
                    });
                    sendResponse(errorResponse);
                    return;
                }

                const SOLVE_AND_ANSWER_INSTRUCTION = `You are an expert mathematician and problem solver. Analyze the provided content and provide a clear, step-by-step solution or answer.

If the content contains:
- Mathematical equations: Solve them showing all work
- Word problems: Break down the problem and solve step by step
- Multiple choice questions: Show reasoning and select the best answer

Always show your work clearly and provide the final answer prominently.`;

                console.log("[CRX-SW] Setting up GPT for solve/answer");
                // Create a simple message structure for solve/answer
                gpt.pending.push({
                    type: "message",
                    role: "user",
                    content: [
                        { type: "input_text", text: SOLVE_AND_ANSWER_INSTRUCTION },
                        { type: "input_text", text: message?.input || "" }
                    ]
                });
                console.log("[CRX-SW] Calling GPT sendRequest");
                const rawResponse = await gpt.sendRequest("high", "medium");
                console.log("[CRX-SW] GPT response:", rawResponse);

                const response = {
                    ok: !!rawResponse,
                    data: rawResponse || "",
                    error: rawResponse ? undefined : "Failed to get response"
                };

                // Broadcast result
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "solve-answer",
                    ...response
                });

                // Auto-copy solution to clipboard if successful
                if (response.ok && response.data && message?.autoCopy !== false) {
                    requestClipboardCopy(response.data, true);
                }

                sendResponse(response);
            } catch (e) {
                console.error("[CRX-SW] Solve/answer error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "solve-answer",
                    ...errorResponse
                });
                showExtensionToast(`Solve/Answer failed: ${e}`, "error");
                sendResponse(errorResponse);
            }
        })();
    }

    // Handle code writing requests
    if (message?.type === "gpt:code") {
        const requestId = message?.requestId || `code_${Date.now()}`;

        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "code",
            requestId,
            status: "processing"
        });

        // Use GPT instance directly for code generation
        (async () => {
            try {
                console.log("[CRX-SW] Processing code generation request");
                const gpt = await getGPTInstance();
                if (!gpt) {
                    const errorResponse = { ok: false, error: "AI service not available" };
                    broadcast(AI_RECOGNITION_CHANNEL, {
                        type: "result",
                        requestId,
                        mode: "code",
                        ...errorResponse
                    });
                    sendResponse(errorResponse);
                    return;
                }

                const WRITE_CODE_INSTRUCTION = `You are an expert software developer. Analyze the provided content and generate high-quality, working code.

Provide clean, well-commented, production-ready code. Include all necessary imports, error handling, and follow best practices for the detected programming language. If multiple languages are possible, choose the most appropriate one.`;

                console.log("[CRX-SW] Setting up GPT for code generation");
                // Create a simple message structure for code generation
                gpt.pending.push({
                    type: "message",
                    role: "user",
                    content: [
                        { type: "input_text", text: WRITE_CODE_INSTRUCTION },
                        { type: "input_text", text: message?.input || "" }
                    ]
                });
                console.log("[CRX-SW] Calling GPT sendRequest for code");
                const rawResponse = await gpt.sendRequest("high", "medium");
                console.log("[CRX-SW] GPT code response:", rawResponse);

                const response = {
                    ok: !!rawResponse,
                    data: rawResponse || "",
                    error: rawResponse ? undefined : "Failed to generate code"
                };

                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "code",
                    ...response
                });

                if (response.ok && response.data && message?.autoCopy !== false) {
                    requestClipboardCopy(response.data, true);
                }

                sendResponse(response);
            } catch (e) {
                console.error("[CRX-SW] Code generation error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "code",
                    ...errorResponse
                });
                showExtensionToast(`Code generation failed: ${e}`, "error");
                sendResponse(errorResponse);
            }
        })();
        return true;
    }

    // Handle CSS extraction requests
    if (message?.type === "gpt:css") {
        const requestId = message?.requestId || `css_${Date.now()}`;

        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "css",
            requestId,
            status: "processing"
        });

        // Use GPT instance directly for CSS extraction
        (async () => {
            try {
                console.log("[CRX-SW] Processing CSS extraction request");
                const gpt = await getGPTInstance();
                if (!gpt) {
                    const errorResponse = { ok: false, error: "AI service not available" };
                    broadcast(AI_RECOGNITION_CHANNEL, {
                        type: "result",
                        requestId,
                        mode: "css",
                        ...errorResponse
                    });
                    sendResponse(errorResponse);
                    return;
                }

                const EXTRACT_CSS_INSTRUCTION = `You are an expert CSS developer. Analyze the provided content and extract/generate the corresponding CSS styles.

Provide clean, modern CSS using:
- CSS custom properties for colors, spacing, typography
- Flexbox/Grid for layouts
- Modern CSS features (clamp(), CSS nesting if appropriate)
- Responsive design principles
- Semantic class names
- Well-organized, maintainable code structure

Include all relevant CSS properties including layout, colors, typography, spacing, borders, shadows, and animations.`;

                console.log("[CRX-SW] Setting up GPT for CSS extraction");
                // Create a simple message structure for CSS extraction
                gpt.pending.push({
                    type: "message",
                    role: "user",
                    content: [
                        { type: "input_text", text: EXTRACT_CSS_INSTRUCTION },
                        { type: "input_text", text: message?.input || "" }
                    ]
                });
                console.log("[CRX-SW] Calling GPT sendRequest for CSS");
                const rawResponse = await gpt.sendRequest("high", "medium");
                console.log("[CRX-SW] GPT CSS response:", rawResponse);

                const response = {
                    ok: !!rawResponse,
                    data: rawResponse || "",
                    error: rawResponse ? undefined : "Failed to extract CSS"
                };

                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "css",
                    ...response
                });

                if (response.ok && response.data && message?.autoCopy !== false) {
                    requestClipboardCopy(response.data, true);
                }

                sendResponse(response);
            } catch (e) {
                console.error("[CRX-SW] CSS extraction error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "css",
                    ...errorResponse
                });
                showExtensionToast(`CSS extraction failed: ${e}`, "error");
                sendResponse(errorResponse);
            }
        })();
        return true;
    }

    // Handle custom instruction requests (user-defined)
    if (message?.type === "gpt:custom") {
        const instructionId = message?.instructionId;
        const customInstruction = message?.instruction;
        const requestId = message?.requestId || `custom_${Date.now()}`;

        // Get instruction text from ID or use provided text
        (async () => {
            let instructionText = customInstruction;
            let instructionLabel = "Custom";

            if (!instructionText && instructionId) {
                const instructions = await loadCustomInstructions().catch(() => []);
                const found = instructions.find(i => i.id === instructionId);
                if (found) {
                    instructionText = found.instruction;
                    instructionLabel = found.label;
                }
            }

            if (!instructionText) {
                const errorResponse = { ok: false, error: "No instruction found" };
                sendResponse(errorResponse);
                return;
            }

            broadcast(AI_RECOGNITION_CHANNEL, {
                type: "custom",
                requestId,
                label: instructionLabel,
                status: "processing"
            });

            recognizeByInstructions(message?.input, instructionText, (result) => {
                const response = { ok: result?.ok, data: result?.data, error: result?.error };

                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "custom",
                    label: instructionLabel,
                    ...response
                });

                if (result?.ok && result?.data && message?.autoCopy !== false) {
                    requestClipboardCopy(result.data, true);
                }

                sendResponse(response);
            })?.catch?.((e: any) => {
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "custom",
                    ...errorResponse
                });
                showExtensionToast(`${instructionLabel} failed: ${e}`, "error");
                sendResponse(errorResponse);
            });
        })();
        return true;
    }

    // Handle translation requests
    if (message?.type === "gpt:translate") {
        const inputText = message?.input;
        const targetLanguage = message?.targetLanguage || "English";
        const requestId = message?.requestId || `translate_${Date.now()}`;

        if (!inputText?.trim()) {
            sendResponse({ ok: false, error: "No text to translate" });
            return true;
        }

        const translationInstruction = `Translate the following text to ${targetLanguage}.
Preserve formatting (Markdown, KaTeX math expressions, code blocks, etc.).
Only translate the natural language text, keep technical notation unchanged.
Return ONLY the translated text without explanations.`;

        (async () => {
            try {
                const settings = (await import("@rs-core/config/Settings")).loadSettings();
                const aiSettings = (await settings)?.ai;
                const token = aiSettings?.apiKey;

                if (!token) {
                    sendResponse({ ok: false, error: "No API key configured" });
                    return;
                }

                const baseUrl = aiSettings?.baseUrl || "https://api.proxyapi.ru/openai/v1";
                const model = aiSettings?.model || "gpt-5.2";

                const response = await fetch(`${baseUrl}/responses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        model,
                        input: inputText,
                        instructions: translationInstruction,
                        reasoning: { effort: "low" },
                        text: { verbosity: "low" }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Translation API error: ${response.status}`);
                }

                const data = await response.json();
                const translatedText = data?.output?.at?.(-1)?.content?.[0]?.text || inputText;

                sendResponse({ ok: true, data: translatedText });
            } catch (e) {
                console.error("Translation failed:", e);
                sendResponse({ ok: false, error: String(e), data: inputText });
            }
        })();
        return true;
    }

    // Handle share-target-like data from external sources (e.g., context menu shares)
    if (message?.type === "share-target") {
        const { title, text, url, files } = message.data || {};

        // Store for client retrieval
        chrome.storage?.local?.set?.({
            "rs-share-target-data": {
                title,
                text,
                url,
                files: files?.map?.((f: File) => f.name) || [],
                timestamp: Date.now()
            }
        }).catch(console.warn.bind(console));

        // Broadcast to clients
        broadcast("rs-share-target", {
            type: "share-received",
            data: { title, text, url, timestamp: Date.now() }
        });

        showExtensionToast("Content received", "info");
        sendResponse({ ok: true });
        return true;
    }
});

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
    for (const item of CTX_ITEMS) {
        try {
            chrome.contextMenus.create({
                id: item.id,
                title: item.title,
                visible: true,
                contexts: CTX_CONTEXTS,
            });
        } catch (e) {
            console.warn(e);
        }
    }

    try {
        chrome.contextMenus.create({
            id: MD_VIEW_MENU_ID,
            title: "Open in Markdown Viewer",
            contexts: ["link", "page"],
            targetUrlPatterns: [
                "*://*/*.md",
                "*://*/*.markdown",
                "file://*/*.md",
                "file://*/*.markdown",
            ],
        });
    } catch (e) {
        console.warn(e);
    }

    // Load and create custom instruction menus
    updateCustomInstructionMenus().catch(console.warn);
});

// helper to send message to tab with fallback to active tab
const sendToTabOrActive = async (tabId: number | undefined, message: unknown) => {
    if (tabId != null && tabId >= 0) {
        return chrome.tabs.sendMessage(tabId, message)?.catch?.(console.warn.bind(console));
    }
    // fallback: query active tab
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true })?.catch?.(() => []);
    for (const tab of tabs || []) {
        if (tab?.id != null && tab.id >= 0) {
            return chrome.tabs.sendMessage(tab.id, message)?.catch?.(console.warn.bind(console));
        }
    }
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
    const tabId = tab?.id;
    const menuId = String(info.menuItemId);

    if (menuId === "START_SNIP") {
        sendToTabOrActive(tabId, { type: "START_SNIP" });
        return;
    }

    if (menuId === "SOLVE_AND_ANSWER") {
        sendToTabOrActive(tabId, { type: "SOLVE_AND_ANSWER" });
        return;
    }

    if (menuId === "WRITE_CODE") {
        sendToTabOrActive(tabId, { type: "WRITE_CODE" });
        return;
    }

    if (menuId === "EXTRACT_CSS") {
        sendToTabOrActive(tabId, { type: "EXTRACT_CSS" });
        return;
    }

    // Handle custom instruction menu items
    if (menuId.startsWith(CUSTOM_INSTRUCTION_PREFIX)) {
        const instructionId = menuId.slice(CUSTOM_INSTRUCTION_PREFIX.length);
        sendToTabOrActive(tabId, { type: "CUSTOM_INSTRUCTION", instructionId });
        return;
    }

    if (menuId === MD_VIEW_MENU_ID) {
        const candidate = (info as any).linkUrl || (info as any).pageUrl;
        const url = typeof candidate === "string" ? candidate : null;
        if (url && isMarkdownUrl(url)) {
            void openMarkdownInViewer(url, tabId ?? 0);
            return;
        }
        openViewer(url, tabId);
        return;
    }

    sendToTabOrActive(tabId, { type: menuId });
});

chrome.webNavigation?.onCommitted?.addListener?.((details) => {
    // Auto-open markdown URLs. The service worker fetches & normalizes to get actual markdown bytes (not HTML).
    if (details.frameId !== 0) return;
    const { tabId, url } = details;
    if (!isMarkdownUrl(url)) return;
    if (url.startsWith(VIEWER_ORIGIN)) return;
    if (url.startsWith("file:")) return; // handled onCompleted (needs tab access)
    void openMarkdownInViewer(url, tabId);
});

chrome.webNavigation?.onCompleted?.addListener?.((details) => {
    // For file:// markdown files, fetching from an extension page is often blocked.
    // Read the tab text and pass it via storage.session.
    (async () => {
        if (details.frameId !== 0) return;
        const { tabId, url } = details;
        if (!isMarkdownUrl(url)) return;
        if (url.startsWith(VIEWER_ORIGIN)) return;
        if (!url.startsWith("file:")) return;

        const text = await tryReadMarkdownFromTab(tabId);
        const key = text ? await putMarkdownToSession(text) : null;
        openViewer(url, tabId, key);
    })().catch(console.warn.bind(console));
});

// Viewer asks the service worker to fetch markdown with host permissions + URL normalization.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
        if (message?.type !== "md:load") return;
        const src = typeof message?.src === "string" ? message.src : "";
        if (!src) {
            sendResponse({ ok: false, error: "missing src" });
            return;
        }
        const fetched = await fetchMarkdownText(src);
        const key = fetched.ok && fetched.text ? await putMarkdownToSession(fetched.text) : null;
        sendResponse({ ok: fetched.ok, status: fetched.status, src: fetched.src, key });
    })().catch((e) => {
        console.warn(e);
        sendResponse({ ok: false, error: String(e) });
    });
    return true;
});
