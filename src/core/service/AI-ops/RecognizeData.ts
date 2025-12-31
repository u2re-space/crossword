/*
 * Unified AI Service for CrossWord
 * Consolidated AI/GPT/service API/Config/Architecture/Code for PWA, CRX, ShareTarget, and Core
 * Supports multiple input formats, batch recognition, and intelligent data extraction.
 */

import { getRuntimeSettings } from "../../config/RuntimeSettings";
import { loadSettings } from "../../config/Settings";
import {
    getUsableData,
    GPTResponses,
    createGPTInstance,
    type AIResponse
} from "../model/GPT-Responses";
import {
    detectDataKindFromContent,
    type DataKind,
    type DataContext
} from "../model/GPT-Config";
import { extractJSONFromAIResponse } from "../../utils/AIResponseParser";
import { buildInstructionPrompt, SVG_GRAPHICS_ADDON } from "../InstructionUtils";
import type { ResponseLanguage } from "../../config/SettingsTypes";

// ============================================================================
// PLATFORM ADAPTERS
// ============================================================================
// Unified platform-specific functionality

export interface ClipboardResult {
    ok: boolean;
    data?: string;
    error?: string;
    method?: string;
}

export interface ImageProcessingOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'png' | 'jpeg';
}

export interface PlatformAdapter {
    copyToClipboard(data: string): Promise<ClipboardResult>;
    readFromClipboard(): Promise<ClipboardResult>;
    processImage?(dataUrl: string, options?: ImageProcessingOptions): Promise<string>;
    captureScreenshot?(rect?: { x: number; y: number; width: number; height: number }): Promise<string>;
    showNotification?(message: string, options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }): void;
}

// Platform-specific implementations
const createPwaAdapter = (): PlatformAdapter => ({
    async copyToClipboard(data: string): Promise<ClipboardResult> {
        try {
            // Import PWA clipboard functionality
            const { writeText } = await import("../../../frontend/shared/Clipboard");
            return await writeText(data) as ClipboardResult;
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    async readFromClipboard(): Promise<ClipboardResult> {
        try {
            // PWA clipboard reading
            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                return { ok: true, data: text };
            }
            return { ok: false, error: "Clipboard access not available" };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    async processImage(dataUrl: string, options?: ImageProcessingOptions): Promise<string> {
        // Basic image processing for PWA (can be enhanced)
        return dataUrl;
    },

    showNotification(message: string, options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }): void {
        // Use PWA toast system
        try {
            import("../../../frontend/shared/Toast").then(({ showToast }) => {
                showToast({
                    message,
                    kind: options?.type || 'info',
                    duration: options?.duration || 3000
                });
            });
        } catch (e) {
            console.log(message); // Fallback
        }
    }
});

const createCrxAdapter = (): PlatformAdapter => ({
    async copyToClipboard(data: string): Promise<ClipboardResult> {
        try {
            // Import CRX clipboard functionality
            const { requestCopyViaCRX } = await import("../../../frontend/shared/Clipboard");
            const result = await requestCopyViaCRX(data);
            return { ok: result.ok, data: result.data as string | undefined };
        } catch (e) {
            return { ok: false, error: String(e) as string | undefined };
        }
    },

    async readFromClipboard(): Promise<ClipboardResult> {
        try {
            // CRX clipboard reading (may be limited)
            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                return { ok: true, data: text };
            }
            return { ok: false, error: "Clipboard access not available" };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    async processImage(dataUrl: string, options?: ImageProcessingOptions): Promise<string> {
        try {
            // CRX has advanced image processing
            const { encodeWithJSquash, removeAnyPrefix } = await import("../../utils/ImageProcess");

            // Compress if needed
            const SIZE_THRESHOLD = 1024 * 1024 * 2; // 2MB
            if (dataUrl.length <= SIZE_THRESHOLD) return dataUrl;

            // Convert to compressed JPEG
            // @ts-ignore
            const binary = Uint8Array.fromBase64(removeAnyPrefix(dataUrl), { alphabet: "base64" });
            const blob = new Blob([binary], { type: "image/png" });
            const bitmap = await createImageBitmap(blob);
            const arrayBuffer = await encodeWithJSquash(bitmap);
            bitmap?.close?.();

            if (arrayBuffer) { // @ts-ignore
                const base64 = new Uint8Array(arrayBuffer).toBase64({ alphabet: "base64" });
                return `data:image/jpeg;base64,${base64}`;
            }

            return dataUrl;
        } catch (e) {
            console.warn("Image processing failed:", e);
            return dataUrl;
        }
    },

    async captureScreenshot(rect?: { x: number; y: number; width: number; height: number }): Promise<string> {
        try {
            // CRX screenshot capture
            if (typeof chrome !== 'undefined' && chrome.tabs?.captureVisibleTab) {
                const captureOptions: any = { format: "png", scale: 1 };
                if (rect) {
                    captureOptions.rect = rect;
                }

                return new Promise((resolve, reject) => {
                    chrome.tabs.captureVisibleTab(captureOptions, (dataUrl) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(dataUrl);
                        }
                    });
                });
            }
            throw new Error("Screenshot capture not available");
        } catch (e) {
            throw new Error(`Screenshot capture failed: ${e}`);
        }
    },

    showNotification(message: string, options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }): void {
        // Use CRX notification system or fallback to console
        console.log(`[${options?.type || 'info'}] ${message}`);
    }
});

const createCoreAdapter = (): PlatformAdapter => ({
    async copyToClipboard(data: string): Promise<ClipboardResult> {
        try {
            // Core has limited clipboard access, try modern API
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(data);
                return { ok: true, data, method: "clipboard-api" };
            }

            // Fallback to legacy method
            const textArea = document.createElement("textarea");
            textArea.value = data;
            textArea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
            document.body.appendChild(textArea);
            textArea.select();

            const success = document.execCommand("copy");
            textArea.remove();

            return success
                ? { ok: true, data, method: "legacy" }
                : { ok: false, error: "Copy failed" };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    async readFromClipboard(): Promise<ClipboardResult> {
        try {
            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                return { ok: true, data: text };
            }
            return { ok: false, error: "Clipboard access not available" };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    showNotification(message: string, options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }): void {
        // Core uses console logging
        console.log(`[${options?.type || 'info'}] ${message}`);
    }
});

// Get the appropriate platform adapter
export const getPlatformAdapter = (): PlatformAdapter => {
    const platform = detectPlatform();

    switch (platform) {
        case 'crx':
            return createCrxAdapter();
        case 'pwa':
            return createPwaAdapter();
        case 'core':
        default:
            return createCoreAdapter();
    }
};

// Platform detection for unified behavior
export const detectPlatform = (): 'pwa' | 'crx' | 'core' | 'unknown' => {
    try {
        // Check for Chrome extension context
        if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
            return 'crx';
        }

        // Check for service worker context
        if (typeof self !== 'undefined' && 'ServiceWorkerGlobalScope' in self) {
            return 'pwa';
        }

        // Check for PWA context (standalone mode)
        if (typeof navigator !== 'undefined' && 'standalone' in navigator) {
            return 'pwa';
        }

        return 'core';
    } catch {
        return 'unknown';
    }
};

// Unified settings loader that works across platforms
export const loadAISettings = async () => {
    const platform = detectPlatform();
    console.log("[AI] Detected platform:", platform);

    try {
        if (platform === 'crx') {
            console.log("[AI] Loading CRX settings...");
            // CRX uses direct settings loading
            const settings = await loadSettings();
            console.log("[AI] CRX settings loaded:", !!settings, settings?.ai ? "AI config present" : "No AI config");
            return settings;
        } else {
            console.log("[AI] Loading PWA/Core runtime settings...");
            // PWA/Core use runtime settings
            const settings = await getRuntimeSettings();
            console.log("[AI] Runtime settings loaded:", !!settings, settings?.ai ? "AI config present" : "No AI config");
            return settings;
        }
    } catch (e) {
        console.error(`[AI-Service] Failed to load settings for platform ${platform}:`, e);
        return null;
    }
};

// Unified custom instruction loading that works across platforms
export const getActiveCustomInstruction = async (): Promise<string> => {
    try {
        // Try direct import first (works in most contexts)
        const { getActiveInstructionText } = await import("../CustomInstructions");
        return await getActiveInstructionText();
    } catch {
        // Fallback for contexts where direct import fails
        try {
            const { getActiveInstructionText } = await import("../CustomInstructions");
            return await getActiveInstructionText();
        } catch {
            return "";
        }
    }
};

// Language instruction builders
const LANGUAGE_INSTRUCTIONS: Record<ResponseLanguage, string> = {
    auto: "", // No explicit language instruction
    en: "\n\nIMPORTANT: Respond in English. All explanations, answers, and comments must be in English.",
    ru: "\n\nВАЖНО: Отвечай на русском языке. Все объяснения, ответы и комментарии должны быть на русском языке."
};

const TRANSLATE_INSTRUCTION = "\n\nAdditionally, translate the recognized content to the response language if it differs from the source.";

// Get language instruction based on settings (unified across platforms)
export const getLanguageInstruction = async (): Promise<string> => {
    try {
        const settings = await loadAISettings();
        const lang = settings?.ai?.responseLanguage || "auto";
        const translate = settings?.ai?.translateResults || false;

        let instruction = LANGUAGE_INSTRUCTIONS[lang] || "";
        if (translate && lang !== "auto") {
            instruction += TRANSLATE_INSTRUCTION;
        }
        return instruction;
    } catch {
        return "";
    }
};

// Get SVG graphics addon based on settings (unified across platforms)
export const getSvgGraphicsAddon = async (): Promise<string> => {
    try {
        const settings = await loadAISettings();
        return settings?.ai?.generateSvgGraphics ? SVG_GRAPHICS_ADDON : "";
    } catch {
        return "";
    }
};

//
export type RecognitionMode = "auto" | "image" | "text" | "structured" | "mixed";

export type RecognitionResult = {
    ok: boolean;
    recognized_data: any[];
    keywords_and_tags: string[];
    verbose_data: string;
    suggested_type: string | null;
    confidence: number;
    source_kind: DataKind;
    processing_time_ms: number;
    errors: string[];
    warnings: string[];
}

export type BatchRecognitionResult = {
    ok: boolean;
    results: RecognitionResult[];
    total_processed: number;
    total_successful: number;
    total_failed: number;
    combined_keywords: string[];
    processing_time_ms: number;
}

export type ExtractionRule = {
    name: string;
    pattern?: string;
    type: "phone" | "email" | "url" | "date" | "time" | "number" | "code" | "custom";
    format?: string;
    required?: boolean;
}

export type ExtractionResult = {
    field: string;
    value: any;
    confidence: number;
    raw: string;
    normalized: string;
}

//
const DEFAULT_MODEL = 'gpt-5.2';
const DEFAULT_API_URL = 'https://api.proxyapi.ru/openai/v1';
const ENDPOINT = '/responses';

//
export const IMAGE_INSTRUCTION = `
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
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

Additional analysis:
- Detect document type (receipt, business card, screenshot, etc.)
- Extract structured data when possible (names, addresses, prices)
- Identify any logos or branding
- Note image quality issues that may affect recognition

If nothing found, return: {"ok": false, "error": "No data recognized"}

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "recognized_data": [...],
    "keywords_and_tags": [...],
    "verbose_data": "markdown description",
    "document_type": "...",
    "structured_extraction": {...},
    "confidence": 0.0-1.0,
    "quality_notes": [...]
}
`;

//
export const DATA_CONVERSION_INSTRUCTION = `
Here may be HTML, Regular Text, LaTeX, etc input formats.

Needs to convert or reformat presented data to target format (Markdown string).

- If textual content, format as Markdown string (multiline).
- If math (expression, equation, formula):
  - For inline math, use SINGLE dollar signs: $x^2 + y^2 = z^2$
  - For block/display math, use DOUBLE dollar signs: $$\\int_0^1 f(x) dx$$
  - Do NOT add extra dollar signs - use exactly one $ for inline, exactly two $$ for block
- If table (or looks alike table), format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as correct JSON string, and trim spaces from JSON string.
- If phone number, format as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as correct email (in normalized format).
- If URL, format as correct URL (in normalized format).
- If date, format as correct date (ISO format preferred).
- If time, format as correct time (24h format).
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

Additional processing:
- Detect the source format (HTML, LaTeX, plain text, etc.)
- Preserve semantic structure during conversion
- Extract metadata if present
- Normalize encoding issues

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "recognized_data": [...],
    "keywords_and_tags": [...],
    "verbose_data": "markdown content",
    "source_format": "...",
    "confidence": 0.0-1.0
}
`;

//
export const ENTITY_EXTRACTION_INSTRUCTION = `
Extract structured entity data from the provided content.

Entity types to detect:
- task: jobs, actions, to-do items
- event: meetings, appointments, occurrences
- person: contacts, people mentions
- place: locations, addresses, venues
- service: products, offerings
- item: goods, objects, inventory
- factor: conditions, circumstances
- bonus: promotions, discounts, codes

For each entity found, extract:
- type: entity type from list above
- id: suggested unique identifier
- name: machine-readable name
- title: human-readable title
- kind: specific subtype
- properties: relevant attributes
- description: markdown description

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "entities": [...],
    "keywords": [...],
    "short_description": "markdown summary",
    "extraction_confidence": 0.0-1.0
}
`;

//
export const SOLVE_AND_ANSWER_INSTRUCTION = `
Solve equations, answer questions, and explain mathematical or logical problems from the provided content.

For equations and math problems:
- Show step-by-step solutions
- Provide final answers clearly marked
- Explain reasoning for each step

For general questions:
- Provide accurate, well-reasoned answers
- Include relevant context and explanations
- If multiple interpretations possible, address them

For quizzes and tests:
- Show the correct answer with explanation
- Explain why other options are incorrect

Always respond in the specified language and format results clearly.
`;

export const EQUATION_SOLVE_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;
export const ANSWER_QUESTION_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;

export const WRITE_CODE_INSTRUCTION = `
Write clean, efficient, and well-documented code based on the provided description, requirements, or image.

Code requirements:
- Use appropriate programming language for the task
- Follow language-specific best practices and conventions
- Include proper error handling
- Add meaningful comments and documentation
- Make code readable and maintainable
- Use appropriate data structures and algorithms

If generating from an image or visual description:
- Analyze the visual elements and requirements
- Implement the described functionality
- Ensure code compiles and runs correctly

Always respond in the specified language and provide complete, working code.
`;

export const EXTRACT_CSS_INSTRUCTION = `
Extract and generate clean, modern CSS from the provided content, image, or description.

CSS requirements:
- Use modern CSS features and best practices
- Generate semantic, maintainable stylesheets
- Include responsive design considerations
- Use appropriate selectors and specificity
- Follow CSS naming conventions (BEM, etc.)
- Include comments for complex styles

If extracting from an image:
- Analyze visual design elements
- Generate corresponding CSS rules
- Preserve layout, colors, typography, and spacing
- Use modern CSS features (Flexbox, Grid, etc.)

Always respond in the specified language and provide complete, valid CSS.
`;

//
export type AIConfig = { apiKey?: string; baseUrl?: string; model?: string };

// Unified GPT instance creation that works across platforms
export const getGPTInstance = async (config?: AIConfig): Promise<GPTResponses | null> => {
    console.log("[AI] getGPTInstance called with config:", !!config);
    const settings = await loadSettings();
    console.log("[AI] Settings loaded:", !!settings, settings?.ai ? "AI settings present" : "No AI settings");

    const apiKey = config?.apiKey || settings?.ai?.apiKey;
    console.log("[AI] API key available:", !!apiKey);

    if (!apiKey) {
        console.error("[AI] No API key found - returning null");
        return null;
    }

    const baseUrl = config?.baseUrl || settings?.ai?.baseUrl || DEFAULT_API_URL;
    const model = config?.model || settings?.ai?.model || DEFAULT_MODEL;
    console.log("[AI] Creating GPT instance with URL:", baseUrl, "model:", model);

    return createGPTInstance(
        apiKey,
        baseUrl,
        model
    );
}

//
export type RecognizeByInstructionsOptions = {
    customInstruction?: string;
    useActiveInstruction?: boolean;
};

//
export const recognizeByInstructions = async (
    input: any,
    instructions: string,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: RecognizeByInstructionsOptions
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    const settings = (await loadSettings())?.ai;

    const token = config?.apiKey || settings?.apiKey;
    if (!token) {
        const result = { ok: false, error: "No API key or input" };
        sendResponse?.(result);
        return result;
    }
    if (!input) {
        const result = { ok: false, error: "No input provided" };
        sendResponse?.(result);
        return result;
    }

    // Apply custom instructions if provided or if useActiveInstruction is set
    let finalInstructions = instructions;
    console.log("[RecognizeData] Custom instruction from options:", !!options?.customInstruction);
    console.log("[RecognizeData] useActiveInstruction:", options?.useActiveInstruction);

    if (options?.customInstruction) {
        console.log("[RecognizeData] Using provided custom instruction");
        finalInstructions = buildInstructionPrompt(instructions, options.customInstruction);
    } else if (options?.useActiveInstruction !== false) {
        console.log("[RecognizeData] Fetching active instruction from settings...");
        const activeInstruction = await getActiveCustomInstruction();
        console.log("[RecognizeData] Active instruction:", activeInstruction ? `"${activeInstruction.substring(0, 50)}..."` : "(none)");
        if (activeInstruction) {
            finalInstructions = buildInstructionPrompt(instructions, activeInstruction);
            console.log("[RecognizeData] Applied active custom instruction");
        }
    } else {
        console.log("[RecognizeData] Custom instructions disabled via options");
    }

    // Use GPTResponses class instead of direct API call for consistency
    const gpt = createGPTInstance(token, config?.baseUrl || settings?.baseUrl || DEFAULT_API_URL, config?.model || settings?.model || DEFAULT_MODEL);

    // Clear any previous pending items and set up the instruction
    gpt.clearPending();
    await gpt.askToDoAction(finalInstructions);

    // Check if input is already formatted as a message array (from analyzeRecognizeUnified)
    if (Array.isArray(input) && (input?.[0]?.type === "message" || input?.[0]?.['role'])) {
        // Input is already formatted, add it directly to pending
        await gpt?.getPending?.()?.push?.(...input);
    } else {
        // Input is raw data source, attach it properly
        await gpt?.attachToRequest?.(input);
    }

    // Send the request
    let response;
    let error;
    try {
        response = await gpt?.sendRequest?.("low", "low");
    } catch (e) {
        error = String(e);
    }

    const output = {
        ok: !!response && !error,
        data: response?.trim?.() || undefined,
        error: error || (response ? undefined : "No response from AI")
    };

    sendResponse?.(output);
    return output;
};

//
export const recognizeImageData = async (
    input: any,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: RecognizeByInstructionsOptions
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    return recognizeByInstructions(input, IMAGE_INSTRUCTION, sendResponse, config, options);
};

//
export const convertTextualData = async (
    input: any,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: RecognizeByInstructionsOptions
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    return recognizeByInstructions(input, DATA_CONVERSION_INSTRUCTION, sendResponse, config, options);
};

//
export const analyzeRecognizeUnified = async (
    rawData: File | Blob | string,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: RecognizeByInstructionsOptions
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    const content = await getUsableData({ dataSource: rawData });
    const input = [{
        type: "message",
        role: "user",
        content: [content]
    }];
    return (content?.[0]?.type === "input_image" || content?.type === "input_image")
        ? recognizeImageData(input, sendResponse, config, options)
        : convertTextualData(input, sendResponse, config, options);
};

// === NEW ENHANCED FUNCTIONS ===

//
export const recognizeWithContext = async (
    data: File | Blob | string,
    context: DataContext,
    mode: RecognitionMode = "auto",
    config?: AIConfig
): Promise<RecognitionResult> => {
    const startTime = performance.now();

    const result: RecognitionResult = {
        ok: false,
        recognized_data: [],
        keywords_and_tags: [],
        verbose_data: "",
        suggested_type: null,
        confidence: 0,
        source_kind: "input_text",
        processing_time_ms: 0,
        errors: [],
        warnings: []
    };

    try {
        const gpt = await getGPTInstance(config);
        if (!gpt) {
            result.errors.push("No GPT instance available");
            return result;
        }

        // Set context
        gpt.setContext(context);

        // Determine data kind
        let dataKind: DataKind = "input_text";
        if (data instanceof File || data instanceof Blob) {
            if (data.type.startsWith("image/")) {
                dataKind = "input_image";
            } else if (data.type.includes("json")) {
                dataKind = "json";
            }
        } else if (typeof data === "string") {
            dataKind = detectDataKindFromContent(data);
        }
        result.source_kind = dataKind;

        // Override mode if specified
        if (mode === "image") dataKind = "input_image";
        else if (mode === "text") dataKind = "input_text";
        else if (mode === "structured") dataKind = "json";

        // Attach data
        if (Array.isArray(data) && (data?.[0]?.type === "message" || data?.[0]?.['role'])) {
            await gpt?.getPending?.()?.push?.(...data);
        } else {
            await gpt?.attachToRequest?.(data, dataKind);
        }

        // Choose instruction based on kind
        const instruction = dataKind === "input_image"
            ? IMAGE_INSTRUCTION
            : DATA_CONVERSION_INSTRUCTION;

        // Add context to instruction
        const contextAddition = context.entityType
            ? `\n\nExpected entity type context: ${context.entityType}`
            : "";
        const searchAddition = context.searchTerms?.length
            ? `\n\nFocus on finding: ${context.searchTerms.join(", ")}`
            : "";

        await gpt.askToDoAction(instruction + contextAddition + searchAddition);

        const raw = await gpt.sendRequest(
            context.priority === "high" ? "high" : "medium",
            "medium",
            null,
            { responseFormat: "json", temperature: 0.3 }
        );

        if (!raw) {
            result.errors.push("No response from AI");
            return result;
        }

        // Use robust JSON extraction to handle markdown-wrapped responses
        const parseResult = extractJSONFromAIResponse<any>(raw);
        if (!parseResult.ok) {
            console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
            result.errors.push(parseResult.error || "Failed to parse AI response");
            // Attempt to use raw text as fallback
            result.verbose_data = raw;
            return result;
        }

        const parsed = parseResult.data;
        result.ok = true;
        result.recognized_data = parsed?.recognized_data || [parsed?.verbose_data || raw];
        result.keywords_and_tags = parsed?.keywords_and_tags || parsed?.keywords || [];
        result.verbose_data = parsed?.verbose_data || "";
        result.suggested_type = parsed?.document_type || parsed?.source_format || null;
        result.confidence = parsed?.confidence || 0.7;

    } catch (e) {
        console.error("Error in recognizeWithContext:", e);
        result.errors.push(String(e));
    }

    result.processing_time_ms = performance.now() - startTime;
    return result;
}

//
export const batchRecognize = async (
    items: (File | Blob | string)[],
    context?: DataContext,
    concurrency: number = 3,
    config?: AIConfig
): Promise<BatchRecognitionResult> => {
    const startTime = performance.now();

    const result: BatchRecognitionResult = {
        ok: true,
        results: [],
        total_processed: items.length,
        total_successful: 0,
        total_failed: 0,
        combined_keywords: [],
        processing_time_ms: 0
    };

    const keywordSet = new Set<string>();

    // Process in batches with concurrency limit
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);

        const promises = batch.map(item =>
            recognizeWithContext(item, context || {}, "auto", config)
        );

        const batchResults = await Promise.all(promises);

        for (const r of batchResults) {
            result.results.push(r);

            if (r.ok) {
                result.total_successful++;
                r.keywords_and_tags.forEach(k => keywordSet.add(k));
            } else {
                result.total_failed++;
            }
        }
    }

    result.ok = result.total_failed === 0;
    result.combined_keywords = Array.from(keywordSet);
    result.processing_time_ms = performance.now() - startTime;

    return result;
}

//
export const extractEntities = async (
    data: File | Blob | string,
    config?: AIConfig
): Promise<AIResponse<any[]>> => {
    try {
        const gpt = await getGPTInstance(config);
        if (!gpt) {
            return { ok: false, error: "No GPT instance" };
        }

        const dataKind = typeof data === "string"
            ? detectDataKindFromContent(data)
            : (data instanceof File || data instanceof Blob) && data.type.startsWith("image/")
                ? "input_image"
                : "input_text";

        //
        if (Array.isArray(data) && (data?.[0]?.type === "message" || data?.[0]?.['role'])) {
            await gpt?.getPending?.()?.push?.(...data);
        } else {
            await gpt?.attachToRequest?.(data, dataKind);
        }

        //
        await gpt.askToDoAction(ENTITY_EXTRACTION_INSTRUCTION);

        const raw = await gpt.sendRequest("high", "medium", null, {
            responseFormat: "json",
            temperature: 0.2
        });

        if (!raw) {
            return { ok: false, error: "No response" };
        }

        // Use robust JSON extraction to handle markdown-wrapped responses
        const parseResult = extractJSONFromAIResponse<any>(raw);
        if (!parseResult.ok) {
            console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
            return { ok: false, error: parseResult.error || "Failed to parse AI response" };
        }

        return {
            ok: true,
            data: parseResult.data?.entities || [],
            responseId: gpt.getResponseId()
        };

    } catch (e) {
        console.error("Error in extractEntities:", e);
        return { ok: false, error: String(e) };
    }
}

//
export const extractByRules = async (
    data: string,
    rules: ExtractionRule[]
): Promise<ExtractionResult[]> => {
    const results: ExtractionResult[] = [];

    try {
        const gpt = await getGPTInstance();
        if (!gpt) {
            return results;
        }

        const rulesDescription = rules.map(r =>
            `- ${r.name} (${r.type}): ${r.pattern ? `pattern: ${r.pattern}` : "auto-detect"}${r.format ? `, format as: ${r.format}` : ""}${r.required ? " [REQUIRED]" : ""}`
        ).join("\n");

        await gpt.giveForRequest(`
Input data:
\`\`\`
${data}
\`\`\`

Extraction rules:
${rulesDescription}
        `);

        // Note: Using cleaner prompt without markdown code blocks
        await gpt.askToDoAction(`
Extract data according to the rules.
For each rule, find matching content and normalize it.

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations.
Your response must start with { and end with }.

Expected output structure:
{
    "extractions": [
        {
            "field": "rule name",
            "value": "normalized value",
            "confidence": 0.0-1.0,
            "raw": "original text",
            "normalized": "formatted value"
        }
    ],
    "missing_required": ["list of required fields not found"]
}
        `);

        const raw = await gpt.sendRequest("medium", "low", null, {
            responseFormat: "json",
            temperature: 0.1
        });

        if (!raw) return results;

        // Use robust JSON extraction to handle markdown-wrapped responses
        const parseResult = extractJSONFromAIResponse<any>(raw);
        if (!parseResult.ok || !parseResult.data) {
            console.warn("JSON extraction failed in extractByRules:", parseResult.error);
            return results;
        }

        return parseResult.data?.extractions || [];
    } catch (e) {
        console.error("Error in extractByRules:", e);
        return results;
    }
}

//
export const smartRecognize = async (
    data: File | Blob | string,
    hints?: {
        expectedType?: string;
        language?: string;
        domain?: string;
        extractEntities?: boolean;
    },
    config?: AIConfig
): Promise<RecognitionResult & { entities?: any[] }> => {
    const baseResult = await recognizeWithContext(data, {
        entityType: hints?.expectedType,
        searchTerms: hints?.domain ? [hints.domain] : undefined
    }, "auto", config);

    if (!baseResult.ok) {
        return baseResult;
    }

    // Optionally extract entities
    if (hints?.extractEntities) {
        const entityResult = await extractEntities(data, config);
        return {
            ...baseResult,
            entities: entityResult.ok ? entityResult.data : undefined
        };
    }

    return baseResult;
}

//
export const recognizeAndNormalize = async (
    data: File | Blob | string,
    normalizations: {
        phones?: boolean;
        emails?: boolean;
        urls?: boolean;
        dates?: boolean;
        addresses?: boolean;
    } = {}
): Promise<RecognitionResult & { normalized: Record<string, any[]> }> => {
    const baseResult = await recognizeWithContext(data, {});

    const normalized: Record<string, any[]> = {
        phones: [],
        emails: [],
        urls: [],
        dates: [],
        addresses: []
    };

    if (!baseResult.ok) {
        return { ...baseResult, normalized };
    }

    try {
        const gpt = await getGPTInstance();
        if (!gpt) {
            return { ...baseResult, normalized };
        }

        const enabledNormalizations = Object.entries(normalizations)
            .filter(([_, v]) => v)
            .map(([k]) => k);

        if (enabledNormalizations.length === 0) {
            return { ...baseResult, normalized };
        }

        await gpt.giveForRequest(`
Recognized data:
\`\`\`
${baseResult.verbose_data || baseResult.recognized_data.join("\n")}
\`\`\`
        `);

        // Note: Using cleaner prompt without markdown code blocks
        await gpt.askToDoAction(`
Extract and normalize the following types: ${enabledNormalizations.join(", ")}

Normalization rules:
- phones: E.164 format or local format with country code
- emails: lowercase, trimmed
- urls: full URL with protocol
- dates: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- addresses: structured with street, city, country if detectable

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations.
Your response must start with { and end with }.

Expected output structure:
{
    "phones": ["..."],
    "emails": ["..."],
    "urls": ["..."],
    "dates": ["..."],
    "addresses": [{ "raw": "...", "structured": {...} }]
}
        `);

        const raw = await gpt.sendRequest("medium", "low", null, {
            responseFormat: "json",
            temperature: 0.1
        });

        if (raw) {
            // Use robust JSON extraction to handle markdown-wrapped responses
            const parseResult = extractJSONFromAIResponse<any>(raw);
            if (parseResult.ok && parseResult.data) {
                Object.assign(normalized, parseResult.data);
            } else {
                console.warn("JSON extraction failed in normalization:", parseResult.error);
                baseResult.warnings.push("Normalization JSON parsing partially failed");
            }
        }

    } catch (e) {
        console.error("Error in normalization phase:", e);
        baseResult.warnings.push("Normalization partially failed");
    }

    return { ...baseResult, normalized };
}

//
export const recognizeFromClipboard = async (): Promise<RecognitionResult | null> => {
    try {
        // Try to read clipboard
        const clipboardItems = await navigator.clipboard.read().catch(() => null);

        if (clipboardItems) {
            for (const item of clipboardItems) {
                // Check for image
                for (const type of item.types) {
                    if (type.startsWith("image/")) {
                        const blob = await item.getType(type);
                        return recognizeWithContext(blob, {});
                    }
                }
            }
        }

        // Fallback to text
        const text = await navigator.clipboard.readText().catch(() => null);
        if (text) {
            return recognizeWithContext(text, {});
        }

        return null;

    } catch (e) {
        console.error("Error reading clipboard:", e);
        return null;
    }
}

//
export const solveAndAnswer = async (
    input: any,
    options?: RecognizeByInstructionsOptions
): Promise<RecognitionResult> => {
    console.log("[AI] solveAndAnswer called with input:", input?.substring?.(0, 100) || input);

    const gpt = await getGPTInstance();
    console.log("[AI] GPT instance created:", !!gpt);

    if (!gpt) {
        console.error("[AI] Failed to create GPT instance - check API key and settings");
        return { ok: false, recognized_data: [], keywords_and_tags: [], verbose_data: "", suggested_type: null, confidence: 0, source_kind: "unknown", processing_time_ms: 0, errors: ["AI service not available"], warnings: [] };
    }

    const startTime = Date.now();

    try {
        // Build instruction with language and SVG support
        const languageInstruction = await getLanguageInstruction();
        const svgAddon = await getSvgGraphicsAddon();
        const instruction = SOLVE_AND_ANSWER_INSTRUCTION + languageInstruction + svgAddon;

        // Apply custom instruction if provided
        let customInstruction = "";
        if (options?.customInstruction) {
            customInstruction = options.customInstruction;
        } else if (options?.useActiveInstruction) {
            customInstruction = await getActiveCustomInstruction();
        }

        if (customInstruction) {
            await gpt.askToDoAction(customInstruction);
        }

        // Set up the solve/answer instruction
        await gpt.askToDoAction(instruction);

        // Give input data
        await gpt.giveForRequest(input);

        // Send request and get response
        console.log("[AI] Sending request with effort='high', verbosity='medium'");
        const rawResponse = await gpt.sendRequest("high", "medium");
        const processingTime = Date.now() - startTime;

        console.log("[AI] Raw response received:", !!rawResponse, rawResponse?.substring?.(0, 200) || "null/empty");

        if (rawResponse) {
            console.log("[AI] solveAndAnswer success");
            return {
                ok: true,
                recognized_data: [rawResponse],
                keywords_and_tags: ["solution", "answer"],
                verbose_data: rawResponse,
                suggested_type: "solution",
                confidence: 0.9,
                source_kind: "text" as unknown as DataKind,
                processing_time_ms: processingTime,
                errors: [],
                warnings: []
            };
        } else {
            console.error("[AI] solveAndAnswer failed - no response from sendRequest");
            return {
                ok: false,
                recognized_data: [],
                keywords_and_tags: [],
                verbose_data: "",
                suggested_type: null,
                confidence: 0,
                source_kind: "unknown",
                processing_time_ms: processingTime,
                errors: ["Failed to get response"],
                warnings: []
            };
        }
    } catch (e) {
        return {
            ok: false,
            recognized_data: [],
            keywords_and_tags: [],
            verbose_data: "",
            suggested_type: null,
            confidence: 0,
            source_kind: "unknown",
            processing_time_ms: Date.now() - startTime,
            errors: [String(e)],
            warnings: []
        };
    }
};

//
export const writeCode = async (
    input: any,
    options?: RecognizeByInstructionsOptions
): Promise<RecognitionResult> => {
    const gpt = await getGPTInstance();
    if (!gpt) return { ok: false, recognized_data: [], keywords_and_tags: [], verbose_data: "", suggested_type: null, confidence: 0, source_kind: "unknown", processing_time_ms: 0, errors: ["AI service not available"], warnings: [] };

    const startTime = Date.now();

    try {
        // Build instruction with language and SVG support
        const languageInstruction = await getLanguageInstruction();
        const svgAddon = await getSvgGraphicsAddon();
        const instruction = WRITE_CODE_INSTRUCTION + languageInstruction + svgAddon;

        // Apply custom instruction if provided
        let customInstruction = "";
        if (options?.customInstruction) {
            customInstruction = options.customInstruction;
        } else if (options?.useActiveInstruction) {
            customInstruction = await getActiveCustomInstruction();
        }

        if (customInstruction) {
            await gpt.askToDoAction(customInstruction);
        }

        // Set up the code writing instruction
        await gpt.askToDoAction(instruction);

        // Give input data
        await gpt.giveForRequest(input);

        // Send request and get response
        const rawResponse = await gpt.sendRequest("high", "medium");
        const processingTime = Date.now() - startTime;

        if (rawResponse) {
            return {
                ok: true,
                recognized_data: [rawResponse],
                keywords_and_tags: ["code", "programming"],
                verbose_data: rawResponse,
                suggested_type: "code",
                confidence: 0.9,
                source_kind: "text" as unknown as DataKind,
                processing_time_ms: processingTime,
                errors: [],
                warnings: []
            };
        } else {
            return {
                ok: false,
                recognized_data: [],
                keywords_and_tags: [],
                verbose_data: "",
                suggested_type: null,
                confidence: 0,
                source_kind: "unknown",
                processing_time_ms: processingTime,
                errors: ["Failed to generate code"],
                warnings: []
            };
        }
    } catch (e) {
        return {
            ok: false,
            recognized_data: [],
            keywords_and_tags: [],
            verbose_data: "",
            suggested_type: null,
            confidence: 0,
            source_kind: "unknown",
            processing_time_ms: Date.now() - startTime,
            errors: [String(e)],
            warnings: []
        };
    }
};

//
export const extractCSS = async (
    input: any,
    options?: RecognizeByInstructionsOptions
): Promise<RecognitionResult> => {
    const gpt = await getGPTInstance();
    if (!gpt) return { ok: false, recognized_data: [], keywords_and_tags: [], verbose_data: "", suggested_type: null, confidence: 0, source_kind: "unknown", processing_time_ms: 0, errors: ["AI service not available"], warnings: [] };

    const startTime = Date.now();

    try {
        // Build instruction with language and SVG support
        const languageInstruction = await getLanguageInstruction();
        const svgAddon = await getSvgGraphicsAddon();
        const instruction = EXTRACT_CSS_INSTRUCTION + languageInstruction + svgAddon;

        // Apply custom instruction if provided
        let customInstruction = "";
        if (options?.customInstruction) {
            customInstruction = options.customInstruction;
        } else if (options?.useActiveInstruction) {
            customInstruction = await getActiveCustomInstruction();
        }

        if (customInstruction) {
            await gpt.askToDoAction(customInstruction);
        }

        // Set up the CSS extraction instruction
        await gpt.askToDoAction(instruction);

        // Give input data
        await gpt.giveForRequest(input);

        // Send request and get response
        const rawResponse = await gpt.sendRequest("high", "medium");
        const processingTime = Date.now() - startTime;

        if (rawResponse) {
            return {
                ok: true,
                recognized_data: [rawResponse],
                keywords_and_tags: ["css", "styles", "stylesheet"],
                verbose_data: rawResponse,
                suggested_type: "css",
                confidence: 0.9,
                source_kind: "text" as unknown as DataKind,
                processing_time_ms: processingTime,
                errors: [],
                warnings: []
            };
        } else {
            return {
                ok: false,
                recognized_data: [],
                keywords_and_tags: [],
                verbose_data: "",
                suggested_type: null,
                confidence: 0,
                source_kind: "unknown",
                processing_time_ms: processingTime,
                errors: ["Failed to extract CSS"],
                warnings: []
            };
        }
    } catch (e) {
        return {
            ok: false,
            recognized_data: [],
            keywords_and_tags: [],
            verbose_data: "",
            suggested_type: null,
            confidence: 0,
            source_kind: "unknown",
            processing_time_ms: Date.now() - startTime,
            errors: [String(e)],
            warnings: []
        };
    }
};

// Convenience aliases
export const solveEquation = solveAndAnswer;
export const answerQuestion = solveAndAnswer;

// ============================================================================
// UNIFIED AI SERVICE INTERFACE
// ============================================================================
// This interface provides consistent access to all AI functions across platforms
// (PWA, CRX, Core, ShareTarget). All platforms should use these exports.

export const UnifiedAIService = {
    // Platform detection and adaptation
    detectPlatform,
    getPlatformAdapter,

    // Settings and configuration
    loadAISettings,
    getLanguageInstruction,
    getSvgGraphicsAddon,
    getActiveCustomInstruction,

    // Core AI functions
    recognizeByInstructions,
    recognizeImageData,
    convertTextualData,
    analyzeRecognizeUnified,

    // Specialized AI functions (unified across platforms)
    solveAndAnswer,
    solveEquation,
    answerQuestion,
    writeCode,
    extractCSS,

    // Utility functions
    batchRecognize,
    extractEntities,
    smartRecognize

    // Types are available as module exports: RecognitionResult, BatchRecognitionResult, etc.
};

// Default export for convenience
export default UnifiedAIService;
