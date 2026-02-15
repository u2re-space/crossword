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
import { extractJSONFromAIResponse } from "../../shared/utils/AIResponseParser";
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
            const { writeText } = await import("../../../frontend/basic/modules/Clipboard");
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
            import("../../../frontend/routing/Toast").then(({ showToast }) => {
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
            const { requestCopyViaCRX } = await import("../../../frontend/basic/modules/Clipboard");
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
            // Check if we're in a service worker (no Canvas API)
            const isServiceWorker = typeof window === 'undefined' || !window.document;

            if (isServiceWorker) {
                console.warn("[RecognizeData] Image processing not available in service worker context");
                return dataUrl;
            }

            // CRX has advanced image processing
            const { encodeWithJSquash, removeAnyPrefix } = await import("../../../core/utils/ImageProcess");

            // Compress if needed - use standardized size limit
            const { MAX_BASE64_SIZE } = await import("../model/GPT-Responses");
            const SIZE_THRESHOLD = 2 * 1024 * 1024; // 2MB for data URL compression
            if (dataUrl.length <= SIZE_THRESHOLD) return dataUrl;

            // Convert to compressed JPEG
            try {
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
            } catch (processingError) {
                console.warn("[RecognizeData] Image compression failed:", processingError);
            }

            return dataUrl;
        } catch (e) {
            console.warn("[RecognizeData] Image processing failed:", e);
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
// Import built-in AI instructions from unified location
import { SOLVE_AND_ANSWER_INSTRUCTION, WRITE_CODE_INSTRUCTION, EXTRACT_CSS_INSTRUCTION } from '../../core/BuiltInAI';

export const EQUATION_SOLVE_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;
export const ANSWER_QUESTION_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;

// WRITE_CODE_INSTRUCTION imported from BuiltInAI

// EXTRACT_CSS_INSTRUCTION imported from BuiltInAI

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
    recognitionEffort?: 'low' | 'medium' | 'high';
    recognitionVerbosity?: 'low' | 'medium' | 'high';
};

//
export const recognizeImageData = async (
    input: any,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: RecognizeByInstructionsOptions
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    const result = await recognizeByInstructions(input, IMAGE_INSTRUCTION, sendResponse, config, options);
    console.log('[recognizeImageData] recognizeByInstructions result:', {
        ok: result.ok,
        dataLength: result.data?.length || 0,
        dataPreview: result.data?.substring(0, 100) || 'empty',
        error: result.error
    });
    return result;
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
    context?: DataContext,
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
        gpt.setContext(context || null);

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
        const contextAddition = context?.entityType
            ? `\n\nExpected entity type context: ${context?.entityType}`
            : "";
        const searchAddition = context?.searchTerms?.length
            ? `\n\nFocus on finding: ${context?.searchTerms?.join?.(", ")}`
            : "";

        await gpt.askToDoAction(instruction + contextAddition + searchAddition);

        const raw = await gpt.sendRequest(
            context?.priority === "high" ? "high" : "medium",
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
// ============================================================================
// NEW UNIFIED AI PROCESSING INTERFACE
// ============================================================================

export type OutputFormat = 'auto' | 'markdown' | 'html' | 'json' | 'text' |
                          'typescript' | 'javascript' | 'python' | 'java' | 'cpp' | 'csharp' |
                          'php' | 'ruby' | 'go' | 'rust' | 'xml' | 'yaml' | 'css' | 'scss' |
                          'most-suitable' | 'most-optimized' | 'most-legibility';

export type OutputLanguage = 'auto' | 'en' | 'ru';

export type ProcessDataWithInstructionOptions = {
    // Core instruction
    instruction?: string; // What to do with the data

    // Output configuration
    outputFormat?: OutputFormat;
    outputLanguage?: OutputLanguage;
    enableSVGImageGeneration?: boolean | 'auto'; // Generate SVG graphics when appropriate

    // Intermediate recognition (for images)
    intermediateRecognition?: {
        enabled?: boolean; // Whether to use intermediate recognition
        dataPriorityInstruction?: string; // Custom instruction for recognition (defaults to generic)
        outputFormat?: OutputFormat; // Format for recognized data
        cacheResults?: boolean; // Whether to cache recognition results
        forceRefresh?: boolean; // Force re-recognition even if cached
    };

    // Processing parameters
    processingEffort?: 'low' | 'medium' | 'high';
    processingVerbosity?: 'low' | 'medium' | 'high';

    // Custom instructions
    customInstruction?: string;
    useActiveInstruction?: boolean;

    // Legacy compatibility (will be deprecated)
    includeImageRecognition?: boolean;
    maxProcessingStages?: number;
    dataType?: 'auto' | 'text' | 'markdown' | 'image' | 'svg' | 'json' | 'xml' | 'code';
    recognitionEffort?: 'low' | 'medium' | 'high';
    recognitionVerbosity?: 'low' | 'medium' | 'high';
};

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

// Helper function to determine optimal processing parameters based on task complexity
function determineProcessingParameters(instructions: string, options?: ProcessDataWithInstructionOptions): {
    processingEffort: 'low' | 'medium' | 'high';
    processingVerbosity: 'low' | 'medium' | 'high';
} {
    // Check if custom parameters are already specified
    if (options?.processingEffort && options?.processingVerbosity) {
        return {
            processingEffort: options?.processingEffort || 'low',
            processingVerbosity: options?.processingVerbosity || 'low'
        };
    }

    const instructionLower = instructions.toLowerCase();

    // Default parameters optimized for efficiency
    let processingEffort: 'low' | 'medium' | 'high' = 'low';
    let processingVerbosity: 'low' | 'medium' | 'high' = 'low';

    // Increase effort for complex analytical tasks
    const complexTasks = [
        'analyze', 'compare', 'evaluate', 'assess', 'critique', 'review',
        'summarize', 'extract', 'interpret', 'understand', 'explain',
        'solve', 'calculate', 'compute', 'reason', 'logic',
        'research', 'investigate', 'study', 'examine'
    ];

    const hasComplexTask = complexTasks.some(task => instructionLower.includes(task));
    if (hasComplexTask) {
        processingEffort = 'medium';
    }

    // Increase verbosity for tasks that need detailed output
    const detailedTasks = [
        'explain', 'describe', 'detail', 'comprehensive', 'thorough',
        'step-by-step', 'detailed', 'complete', 'full', 'extensive',
        'elaborate', 'in-depth', 'thoroughly'
    ];

    const needsDetail = detailedTasks.some(task => instructionLower.includes(task));
    if (needsDetail) {
        processingVerbosity = 'medium';
    }

    // Increase both for very complex tasks
    const veryComplexTasks = [
        'design', 'architecture', 'system', 'complex', 'advanced',
        'sophisticated', 'intricate', 'complicated', 'challenging'
    ];

    const isVeryComplex = veryComplexTasks.some(task => instructionLower.includes(task));
    if (isVeryComplex) {
        processingEffort = 'high';
        processingVerbosity = 'medium';
    }

    // Special case: code generation tasks often need more precision
    if (instructionLower.includes('code') || instructionLower.includes('program') ||
        instructionLower.includes('function') || instructionLower.includes('class') ||
        instructionLower.includes('typescript') || instructionLower.includes('javascript')) {
        processingEffort = 'medium';
        processingVerbosity = 'low'; // Code should be concise
    }

    return { processingEffort, processingVerbosity };
}

// Helper function to unwrap unwanted code block formatting
function unwrapUnwantedCodeBlocks(content: string): string {
    if (!content) return content;

    // Remove wrapping code blocks that are not intended for code
    // Pattern: ```language\ncontent\n```
    const codeBlockRegex = /^```(?:katex|md|markdown|html|xml|json|text)?\n([\s\S]*?)\n```$/;

    const match = content.trim().match(codeBlockRegex);
    if (match) {
        const unwrapped = match[1].trim();

        // Additional check: if the unwrapped content looks like it should be wrapped
        // (e.g., actual code, or multiple lines that are clearly formatted content),
        // keep the original. Otherwise, unwrap it.
        const lines = unwrapped.split('\n');

        // If it's a single line or looks like markup/math, unwrap
        if (lines.length === 1 ||
            unwrapped.includes('<math') ||
            unwrapped.includes('<span class="katex') ||
            unwrapped.includes('<content') ||
            unwrapped.startsWith('<') && unwrapped.endsWith('>') ||
            /^\s*<[^>]+>/.test(unwrapped)) {
            console.log('[AI Response] Unwrapped unwanted code block formatting');
            return unwrapped;
        }

        // If it looks like actual code (multiple lines, indentation, etc.), keep wrapped
        if (lines.length > 3 ||
            lines.some(line => line.match(/^\s{4,}/) || line.includes('function') || line.includes('const ') || line.includes('let '))) {
            return content; // Keep the code block
        }

        // Default to unwrapping for single/multiple simple lines
        console.log('[AI Response] Unwrapped unwanted code block formatting');
        return unwrapped;
    }

    return content;
}

// ============================================================================
// RECOGNITION CACHE/DATABASE
// ============================================================================

interface RecognitionCacheEntry {
    dataHash: string; // Hash of the image data for identification
    recognizedData: string;
    recognizedAs: OutputFormat;
    timestamp: number;
    responseId: string;
    metadata?: Record<string, any>;
}

class RecognitionCache {
    private cache = new Map<string, RecognitionCacheEntry>();
    private maxEntries = 100; // Limit cache size
    private ttl = 24 * 60 * 60 * 1000; // 24 hours TTL

    private generateDataHash(data: any): string {
        // Simple hash for image data - in production, use proper crypto hash
        if (data instanceof File) {
            return `${data.name}-${data.size}-${data.lastModified}`;
        }
        if (typeof data === 'string') {
            return btoa(data).substring(0, 32); // Simple hash for data URLs
        }
        return JSON.stringify(data).substring(0, 32);
    }

    get(data: any, format?: OutputFormat): RecognitionCacheEntry | null {
        const hash = this.generateDataHash(data);
        const entry = this.cache.get(hash);

        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(hash);
            return null;
        }

        // Check format match if specified
        if (format && entry.recognizedAs !== format) {
            return null;
        }

        return entry;
    }

    set(data: any, recognizedData: string, recognizedAs: OutputFormat, responseId: string, metadata?: Record<string, any>): void {
        const hash = this.generateDataHash(data);

        // Clean up old entries if cache is full
        if (this.cache.size >= this.maxEntries) {
            const oldestKey = Array.from(this.cache.entries())
                .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(hash, {
            dataHash: hash,
            recognizedData,
            recognizedAs,
            timestamp: Date.now(),
            responseId,
            metadata
        });
    }

    clear(): void {
        this.cache.clear();
    }

    getStats() {
        return {
            entries: this.cache.size,
            maxEntries: this.maxEntries,
            ttl: this.ttl
        };
    }
}

const recognitionCache = new RecognitionCache();

// ============================================================================
// NEW UNIFIED PROCESSING FUNCTION
// ============================================================================

export type ProcessDataWithInstructionResult = {
    ok: boolean;
    data?: string;
    error?: string;
    responseId?: string;
    processingStages?: number;
    recognizedImages?: boolean;
    intermediateRecognizedData?: Array<{
        originalData: any;
        recognizedData: string;
        recognizedAs: OutputFormat;
        responseId: string;
    }>;
};

// Main unified processing function that replaces all the specialized functions
export const processDataWithInstruction = async (
    input: any,
    options: ProcessDataWithInstructionOptions = {},
    sendResponse?: (result: ProcessDataWithInstructionResult) => void
): Promise<ProcessDataWithInstructionResult> => {
    const settings = (await loadSettings())?.ai;

    // Extract options with defaults
    const {
        instruction = "",
        outputFormat = 'auto',
        outputLanguage = 'auto',
        enableSVGImageGeneration = 'auto',
        intermediateRecognition,
        processingEffort = 'low',
        processingVerbosity = 'low',
        customInstruction,
        useActiveInstruction = false,

        // Legacy compatibility options
        includeImageRecognition,
        maxProcessingStages,
        dataType,
        recognitionEffort,
        recognitionVerbosity
    } = options;

    const token = settings?.apiKey;
    if (!token) {
        const result: ProcessDataWithInstructionResult = { ok: false, error: "No API key available" };
        sendResponse?.(result);
        return result;
    }

    if (!input) {
        const result: ProcessDataWithInstructionResult = { ok: false, error: "No input provided" };
        sendResponse?.(result);
        return result;
    }

    // Build final instruction
    let finalInstruction = instruction;

    // Apply custom instruction if provided
    if (customInstruction) {
        finalInstruction = buildInstructionPrompt(finalInstruction, customInstruction);
    } else if (useActiveInstruction) {
        const activeInstruction = await getActiveCustomInstruction();
        if (activeInstruction) {
            finalInstruction = buildInstructionPrompt(finalInstruction, activeInstruction);
        }
    }

    // Add language instruction
    const languageInstruction = await getLanguageInstruction();
    if (languageInstruction) {
        finalInstruction += languageInstruction;
    }

    // Add SVG graphics instruction
    const shouldEnableSVG = enableSVGImageGeneration === true ||
                           (enableSVGImageGeneration === 'auto' && outputFormat === 'html');
    if (shouldEnableSVG) {
        const svgAddon = await getSvgGraphicsAddon();
        if (svgAddon) {
            finalInstruction += svgAddon;
        }
    }

    // Add output format instruction
    if (outputFormat !== 'auto') {
        const formatInstruction = getOutputFormatInstruction(outputFormat);
        if (formatInstruction) {
            finalInstruction += formatInstruction;
        }
    }

    console.log("[ProcessDataWithInstruction] Final instruction:", finalInstruction.substring(0, 200) + "...");

    // Create GPT instance
    const gpt = createGPTInstance(token, settings?.baseUrl || DEFAULT_API_URL, settings?.model || DEFAULT_MODEL);

    // Clear any previous pending items
    gpt.clearPending();

    console.log("[ProcessDataWithInstruction] GPT instance created:", {
        hasToken: !!token,
        baseUrl: settings?.baseUrl || DEFAULT_API_URL,
        model: settings?.model || DEFAULT_MODEL
    });

    let processingStages = 1;
    let recognizedImages = false;
    const intermediateRecognizedData: ProcessDataWithInstructionResult['intermediateRecognizedData'] = [];

    // Handle different data types
    if (Array.isArray(input) && (input?.[0]?.type === "message" || input?.[0]?.['role'])) {
        // Input is already formatted, add it directly to pending
        await gpt.getPending()?.push(...input);
    } else {
        // Process input based on type
        const inputData = Array.isArray(input) ? input : [input];

        for (const item of inputData) {
            let processedItem = item;

            // Special handling for SVG - treat as text/XML
            if (typeof item === 'string' && dataType === 'svg' || (typeof item === 'string' && item.trim().startsWith('<svg'))) {
                console.log("[ProcessDataWithInstruction] Detected SVG content, treating as text/XML");
                processedItem = item;
            }
            // Handle images with intermediate recognition
            else if (isImageData(item)) {
                recognizedImages = true;

                // Check if intermediate recognition is enabled
                const useIntermediateRecognition = intermediateRecognition?.enabled !== false &&
                                                  (intermediateRecognition?.enabled || includeImageRecognition);

                if (useIntermediateRecognition) {
                    processingStages = 2;

                    // Check cache first (unless force refresh)
                    const cachedResult = !intermediateRecognition?.forceRefresh
                        ? recognitionCache.get(item, intermediateRecognition?.outputFormat)
                        : null;

                    let recognizedContent: string;
                    let recognitionResponseId: string;

                    if (cachedResult) {
                        console.log("[ProcessDataWithInstruction] Using cached recognition result");
                        recognizedContent = cachedResult.recognizedData;
                        recognitionResponseId = cachedResult.responseId;
                    } else {
                        // Perform intermediate recognition
                        const recognitionInstruction = intermediateRecognition?.dataPriorityInstruction ||
                            getIntermediateRecognitionInstruction(intermediateRecognition?.outputFormat || 'markdown');

                        console.log("[ProcessDataWithInstruction] Performing intermediate recognition");
                        console.log("[ProcessDataWithInstruction] Image item details:", {
                            type: item?.type,
                            size: item?.size,
                            name: item?.name,
                            isFile: item instanceof File,
                            isBlob: item instanceof Blob,
                            isString: typeof item === 'string'
                        });

                        const recognitionResult = await recognizeByInstructions(
                            item,
                            recognitionInstruction,
                            undefined,
                            { apiKey: token, baseUrl: settings?.baseUrl, model: settings?.model },
                            {
                                customInstruction: undefined,
                                useActiveInstruction: false
                            }
                        );

                        console.log("[ProcessDataWithInstruction] Intermediate recognition result:", {
                            ok: recognitionResult.ok,
                            hasData: !!recognitionResult.data,
                            dataLength: recognitionResult.data?.length || 0,
                            dataPreview: recognitionResult.data?.substring(0, 100) || 'empty',
                            error: recognitionResult.error
                        });

                        if (!recognitionResult.ok || !recognitionResult.data) {
                            console.warn("[ProcessDataWithInstruction] Intermediate recognition failed, using original image");
                            recognizedContent = ""; // Will use original image
                            recognitionResponseId = "";
                        } else {
                            recognizedContent = recognitionResult.data;
                            recognitionResponseId = recognitionResult.responseId || "";

                            console.log("[ProcessDataWithInstruction] Successfully recognized content:", recognizedContent.substring(0, 200) + "...");

                            // Cache the result
                            if (intermediateRecognition?.cacheResults !== false) {
                                const recognizedAs = intermediateRecognition?.outputFormat || 'markdown';
                                recognitionCache.set(item, recognizedContent, recognizedAs, recognitionResponseId);
                            }
                        }
                    }

                    // Store intermediate recognition data
                    intermediateRecognizedData.push({
                        originalData: item,
                        recognizedData: recognizedContent,
                        recognizedAs: intermediateRecognition?.outputFormat || 'markdown',
                        responseId: recognitionResponseId
                    });

                    // Use recognized content instead of original image (unless empty)
                    if (recognizedContent) {
                        processedItem = recognizedContent;
                        console.log("[ProcessDataWithInstruction] Using recognized content for processing");
                    }
                }
            }

            // Attach processed item
            if (processedItem !== null && processedItem !== undefined) {
                await gpt?.attachToRequest?.(processedItem);
            }
        }
    }

    // Set the final instruction
    await gpt.askToDoAction(finalInstruction);

    // Send the request
    let response;
    let error;
    try {
        console.log("[ProcessDataWithInstruction] Sending request with effort:", processingEffort, "verbosity:", processingVerbosity);
        console.log("[ProcessDataWithInstruction] Pending items count:", gpt.getPending()?.length || 0);

        response = await gpt?.sendRequest?.(processingEffort, processingVerbosity, null, {
            responseFormat: getResponseFormat(outputFormat),
            temperature: 0.3
        });

        console.log("[ProcessDataWithInstruction] Raw GPT response received:", {
            hasResponse: !!response,
            responseType: typeof response,
            responseLength: typeof response === 'string' ? response.length : 'N/A',
            responsePreview: typeof response === 'string' ? response.substring(0, 200) : String(response)
        });
    } catch (e) {
        console.error("[ProcessDataWithInstruction] GPT API Error:", e);
        error = String(e);
    }

    // Parse the response if it's a JSON string (from GPT processing)
    let parsedResponse = response;
    if (typeof response === 'string') {
        try {
            parsedResponse = JSON.parse(response);
        } catch (e) {
            console.error("[ProcessDataWithInstruction] Failed to parse response JSON:", e);
            parsedResponse = null;
        }
    }

    const responseContent = parsedResponse?.choices?.[0]?.message?.content;
    let cleanedResponse = responseContent ? unwrapUnwantedCodeBlocks(responseContent.trim()) : null;

    // For image recognition, handle both JSON and direct responses
    let finalData = cleanedResponse;
    if (cleanedResponse && instruction?.includes('Recognize data from image')) {
        // First try to parse as JSON (if GPT followed the instruction)
        try {
            const parsedJson = JSON.parse(cleanedResponse);
            if (parsedJson?.recognized_data) {
                // Extract the actual recognized text from the JSON response
                if (Array.isArray(parsedJson.recognized_data)) {
                    finalData = parsedJson.recognized_data.join('\n');
                } else if (typeof parsedJson.recognized_data === 'string') {
                    finalData = parsedJson.recognized_data;
                } else {
                    finalData = JSON.stringify(parsedJson.recognized_data);
                }
            } else if (parsedJson?.ok === false) {
                // Handle the "nothing found" case
                finalData = null;
            } else {
                // If it's valid JSON but doesn't have recognized_data, it might be the direct response
                finalData = cleanedResponse;
            }
        } catch (jsonError) {
            // Not JSON - GPT returned direct response, use as-is
            console.log("[ProcessDataWithInstruction] GPT returned direct response (not JSON):", cleanedResponse.substring(0, 100));
            finalData = cleanedResponse;
        }
    }

    console.log("[ProcessDataWithInstruction] Final processing result:", {
        hasResponse: !!response,
        hasParsedResponse: !!parsedResponse,
        hasResponseContent: !!responseContent,
        responseContentLength: responseContent?.length || 0,
        cleanedResponseLength: cleanedResponse?.length || 0,
        finalDataLength: finalData?.length || 0,
        finalDataPreview: finalData?.substring(0, 200) || 'empty',
        hasError: !!error,
        processingStages,
        recognizedImages
    });

    const result: ProcessDataWithInstructionResult = {
        ok: !!finalData && !error,
        data: finalData || undefined,
        error: error || (!finalData ? "No data recognized" : undefined),
        responseId: parsedResponse?.id || gpt?.getResponseId?.(),
        processingStages,
        recognizedImages,
        intermediateRecognizedData: intermediateRecognizedData.length > 0 ? intermediateRecognizedData : undefined
    };

    sendResponse?.(result);
    return result;
};

// Helper functions for the new unified function
function isImageData(data: any): boolean {
    return (data instanceof File && data.type.startsWith('image/')) ||
           (data instanceof Blob && data.type?.startsWith('image/')) ||
           (typeof data === 'string' && (data.startsWith('data:image/') || data.startsWith('http') || data.startsWith('https://')));
}

function getOutputFormatInstruction(format: OutputFormat): string {
    if (format === 'auto' || format === undefined) return "";

    const instructions: Record<OutputFormat, string> = {
        'auto': "",
        'markdown': `\n\nOutput the result in GitHub-compatible Markdown.

Markdown structure:
- Use headings for structure:
  - Main sections: start from ### (H3) minimum
  - Subsections: #### / ##### when needed
- Avoid long paragraphs: prefer lists and sub-lists.

KaTeX / math:
- Prefer inline formulas: $...$
- Avoid $$...$$ blocks; only use block math if strictly necessary.
  - Prefer block math as \\[ ... \\] instead of $$...$$.
- Inside KaTeX, write a vertical bar as \\| (example: $A \\| B$).

Tables:
- Use strict GitHub Markdown table syntax.
- Inside table cells:
  - Use <br> for line breaks (no real newlines inside cells).
  - If source data uses ';' as a separator, replace ';' with <br>.

Colon formatting:
- For "key: value" style lines, make the part before ':' bold:
  - **Key**: value`,
        'html': "\n\nOutput the result in HTML format.",
        'json': "\n\nOutput the result as valid JSON.",
        'text': "\n\nOutput the result as plain text.",
        'typescript': "\n\nOutput the result as TypeScript code.",
        'javascript': "\n\nOutput the result as JavaScript code.",
        'python': "\n\nOutput the result as Python code.",
        'java': "\n\nOutput the result as Java code.",
        'cpp': "\n\nOutput the result as C++ code.",
        'csharp': "\n\nOutput the result as C# code.",
        'php': "\n\nOutput the result as PHP code.",
        'ruby': "\n\nOutput the result as Ruby code.",
        'go': "\n\nOutput the result as Go code.",
        'rust': "\n\nOutput the result as Rust code.",
        'xml': "\n\nOutput the result as XML.",
        'yaml': "\n\nOutput the result as YAML.",
        'css': "\n\nOutput the result as CSS.",
        'scss': "\n\nOutput the result as SCSS.",
        'most-suitable': "\n\nChoose the most suitable output format for the content and task.",
        'most-optimized': "\n\nChoose the most optimized output format for clarity and usability.",
        'most-legibility': "\n\nChoose the most legible output format for human readability."
    };

    return instructions[format] || "";
}

function getIntermediateRecognitionInstruction(format: OutputFormat): string {
    const baseInstruction = "Extract all readable text, equations, and data from this image. Focus on accuracy and completeness.";

    if (format === 'markdown') {
        return baseInstruction + " Format the extracted content as clean Markdown.";
    } else if (format === 'html') {
        return baseInstruction + " Format the extracted content as semantic HTML.";
    } else if (format === 'text') {
        return baseInstruction + " Extract as plain text only.";
    } else if (format === 'most-suitable') {
        return "Analyze this image and extract all readable content in the most appropriate format for further processing.";
    } else if (format === 'most-optimized') {
        return "Extract content from this image in the most efficient format for token usage and processing.";
    } else if (format === 'most-legibility') {
        return "Extract content from this image with maximum legibility and human readability.";
    }

    return baseInstruction + " Format appropriately for the content type.";
}

function getResponseFormat(format: OutputFormat): 'json' | 'text' {
    // Use JSON for structured formats, text for everything else
    const jsonFormats: OutputFormat[] = ['json', 'xml', 'yaml'];
    return jsonFormats.includes(format) ? 'json' : 'text';
}

// ============================================================================
// UNIFIED AI SERVICE INTERFACE
// ============================================================================
// This interface provides consistent access to all AI functions across platforms
// (PWA, CRX, Core, ShareTarget). All platforms should use these exports.

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES (will be deprecated)
// ============================================================================

// Legacy function aliases - redirect to new unified function
export const recognizeByInstructions = async (
    input: any,
    instructions: string,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: RecognizeByInstructionsOptions
): Promise<{ ok: boolean; data?: string; error?: string; responseId?: string }> => {
    const result = await processDataWithInstruction(input, {
        instruction: instructions,
        customInstruction: options?.customInstruction,
        useActiveInstruction: options?.useActiveInstruction,
        processingEffort: options?.recognitionEffort || 'low',
        processingVerbosity: options?.recognitionVerbosity || 'low',
        outputFormat: 'auto',
        outputLanguage: 'auto',
        enableSVGImageGeneration: 'auto'
    });

    console.log('[recognizeByInstructions] processDataWithInstruction result:', {
        ok: result.ok,
        dataLength: result.data?.length || 0,
        dataPreview: result.data?.substring(0, 100) || 'empty',
        error: result.error
    });

    const legacyResult = {
        ok: result.ok,
        data: result.data,
        error: result.error,
        responseId: result.responseId
    };

    console.log('[recognizeByInstructions] legacyResult:', {
        ok: legacyResult.ok,
        dataLength: legacyResult.data?.length || 0,
        dataPreview: legacyResult.data?.substring(0, 100) || 'empty',
        error: legacyResult.error
    });

    sendResponse?.(legacyResult);
    return legacyResult;
};

export const processDataByInstruction = async (
    input: any,
    instructions: string,
    sendResponse?: (result: any) => void,
    config?: AIConfig,
    options?: ProcessDataWithInstructionOptions
): Promise<{ ok: boolean; data?: string; error?: string; responseId?: string; processingStages?: number; recognizedImages?: boolean }> => {
    const result = await processDataWithInstruction(input, {
        instruction: instructions,
        ...options,
        outputFormat: options?.outputFormat || 'auto',
        outputLanguage: options?.outputLanguage || 'auto',
        enableSVGImageGeneration: options?.enableSVGImageGeneration || 'auto'
    });

    const legacyResult = {
        ok: result.ok,
        data: result.data,
        error: result.error,
        responseId: result.responseId,
        processingStages: result.processingStages,
        recognizedImages: result.recognizedImages
    };

    sendResponse?.(legacyResult);
    return legacyResult;
};

// Other legacy aliases can be added here as needed

export const UnifiedAIService = {
    // Platform detection and adaptation
    detectPlatform,
    getPlatformAdapter,

    // Settings and configuration
    loadAISettings,
    getLanguageInstruction,
    getSvgGraphicsAddon,
    getActiveCustomInstruction,

    // New unified processing function (recommended)
    processDataWithInstruction,

    // Recognition cache management
    clearRecognitionCache: () => recognitionCache.clear(),
    getRecognitionCacheStats: () => recognitionCache.getStats(),

    // Legacy functions (deprecated - use processDataWithInstruction instead)
    recognizeByInstructions, // Deprecated
    processDataByInstruction, // Deprecated

    // Specialized functions (keep for specific use cases)
    solveAndAnswer,
    writeCode,
    extractCSS,

    // Utility functions
    extractEntities,
    smartRecognize
};

// Default export for convenience
export default UnifiedAIService;
