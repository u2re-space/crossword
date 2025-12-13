/*
 * Enhanced data recognition module for AI-ops.
 * Supports multiple input formats, batch recognition, and intelligent data extraction.
 */

import { getRuntimeSettings } from "../../config/RuntimeSettings.ts";
import {
    getUsableData,
    GPTResponses,
    createGPTInstance,
    type AIResponse
} from "../model/GPT-Responses.ts";
import {
    detectDataKindFromContent,
    type DataKind,
    type DataContext
} from "../model/GPT-Config.ts";
import { extractJSONFromAIResponse } from "../../utils/AIResponseParser.ts";

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
- If math (expression, equation, formula), format as $KaTeX$
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
- If math (expression, equation, formula), format as $KaTeX$
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
export type AIConfig = { apiKey?: string; baseUrl?: string; model?: string };

const getGPTInstance = async (config?: AIConfig): Promise<GPTResponses | null> => {
    const settings = await getRuntimeSettings();
    const apiKey = config?.apiKey || settings?.ai?.apiKey;
    if (!apiKey) return null;
    return createGPTInstance(
        apiKey,
        config?.baseUrl || settings?.ai?.baseUrl,
        config?.model || settings?.ai?.model
    );
}

//
export const recognizeByInstructions = async (
    input: any,
    instructions: string,
    sendResponse?: (result: any) => void,
    config?: AIConfig
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    const settings = (await getRuntimeSettings())?.ai;

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

    const r: any = await fetch(`${config?.baseUrl || settings?.baseUrl || DEFAULT_API_URL}${ENDPOINT}`, {
        method: 'POST',
        priority: 'auto',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            model: config?.model || settings?.model || DEFAULT_MODEL,
            input,
            reasoning: { "effort": "medium" },
            text: { verbosity: "medium" },
            max_output_tokens: 400000,
            instructions
        })
    })?.catch?.(e => {
        console.warn(e);
        return { ok: false, error: String(e) };
    });

    const res = await r?.json?.()?.catch?.((e: any) => {
        console.warn(e);
        return { ok: false, error: String(e) };
    }) || {};

    const output = { ok: r?.ok, data: res?.output?.at?.(-1)?.content?.[0]?.text?.trim?.() };
    sendResponse?.(output);
    return output;
};

//
export const recognizeImageData = async (
    input: any,
    sendResponse?: (result: any) => void,
    config?: AIConfig
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    return recognizeByInstructions(input, IMAGE_INSTRUCTION, sendResponse, config);
};

//
export const convertTextualData = async (
    input: any,
    sendResponse?: (result: any) => void,
    config?: AIConfig
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    return recognizeByInstructions(input, DATA_CONVERSION_INSTRUCTION, sendResponse, config);
};

//
export const analyzeRecognizeUnified = async (
    rawData: File | Blob | string,
    sendResponse?: (result: any) => void,
    config?: AIConfig
): Promise<{ ok: boolean; data?: string; error?: string }> => {
    const content = await getUsableData({ dataSource: rawData });
    const input = [{
        type: "message",
        role: "user",
        content: [content]
    }];
    return content?.type == "input_image"
        ? recognizeImageData(input, sendResponse, config)
        : convertTextualData(input, sendResponse, config);
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
        await gpt.attachToRequest(data, dataKind);

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

        await gpt.attachToRequest(data, dataKind);
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
        if (!parseResult.ok) {
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
