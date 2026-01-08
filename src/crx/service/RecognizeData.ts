/*
 * Chrome Extension Service for AI-powered data recognition.
 * Now uses unified core AI service with CRX-specific platform adaptations.
 * Supports screenshot capture, advanced image processing, and clipboard operations.
 */

import { UnifiedAIService } from "@rs-com/service/AI-ops/RecognizeData";
import type { RecognitionResult } from "@rs-com/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-com/config/Settings";
import { getUsableData } from "@rs-com/service/model/GPT-Responses";

// Import built-in AI instructions
import { CRX_SOLVE_AND_ANSWER_INSTRUCTION, CRX_WRITE_CODE_INSTRUCTION, CRX_EXTRACT_CSS_INSTRUCTION } from '@rs-com/core/BuiltInAI';
import type { DataContext } from "@rs-com/service/model/GPT-Config";

// Import unified service functions for internal use
const {
    recognizeByInstructions: coreRecognizeByInstructions,
    solveAndAnswer: coreSolveAndAnswer,
    writeCode: coreWriteCode,
    extractCSS: coreExtractCSS
} = UnifiedAIService;

const pickFirstError = (raw: any): string | undefined => {
    if (!raw) return undefined;
    if (typeof raw.error === "string" && raw.error.trim()) return raw.error;
    if (Array.isArray(raw.errors) && typeof raw.errors[0] === "string" && raw.errors[0].trim()) return raw.errors[0];
    return undefined;
};

const extractText = (raw: any): string | undefined => {
    if (!raw) return undefined;

    // Newer unified result shape
    if (typeof raw.data === "string") {
        const t = raw.data.trim();
        if (t) return t;
    }

    // Older recognition result shape
    if (typeof raw.verbose_data === "string") {
        const t = raw.verbose_data.trim();
        if (t) return t;
    }

    const rd = raw.recognized_data;
    if (typeof rd === "string") {
        const t = rd.trim();
        if (t) return t;
    }

    if (Array.isArray(rd)) {
        const parts: string[] = [];
        for (const item of rd) {
            if (typeof item === "string") {
                if (item.trim()) parts.push(item.trim());
                continue;
            }
            const maybe = (item?.output ?? item?.text ?? item?.content ?? item?.value) as unknown;
            if (typeof maybe === "string" && maybe.trim()) parts.push(maybe.trim());
        }
        const joined = parts.join("\n").trim();
        if (joined) return joined;
    }

    return undefined;
};

const toCrxResult = (raw: any): RecognizeResult => {
    const ok = !!raw?.ok;
    const data = extractText(raw);
    const error = pickFirstError(raw) ?? (ok && !data ? "No data recognized" : undefined);

    return {
        ok: ok && !!data,
        data,
        error,
        raw
    };
};

// CRX-enhanced versions with additional features

// Enhanced recognizeByInstructions with CRX-specific features
export const recognizeByInstructions = async (
    input: any,
    instructions: string,
    sendResponse?: (result: RecognizeResult) => void,
    options: ExtendedRecognizeOptions = {}
): Promise<RecognizeResult> => {
    try {
        // Use unified service with CRX-specific options
        const result = await coreRecognizeByInstructions(input, instructions, undefined, undefined, {
            customInstruction: options.customInstruction,
            useActiveInstruction: options.useActiveInstruction
        });

        const crxResult = toCrxResult(result as RecognitionResult);

        sendResponse?.(crxResult);
        return crxResult;
    } catch (e) {
        const errorResult: RecognizeResult = {
            ok: false,
            error: String(e)
        };
        sendResponse?.(errorResult);
        return errorResult;
    }
};

// CRX-enhanced solveAndAnswer using unified service
export const solveAndAnswer = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    try {
        const result = await coreSolveAndAnswer(input, { useActiveInstruction: true });
        const crxResult = toCrxResult(result as any);

        sendResponse?.(crxResult);
        return crxResult;
    } catch (e) {
        const errorResult: RecognizeResult = {
            ok: false,
            error: String(e)
        };
        sendResponse?.(errorResult);
        return errorResult;
    }
};

// CRX-enhanced writeCode using unified service
export const writeCode = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    try {
        const result = await coreWriteCode(input, { useActiveInstruction: true });
        const crxResult = toCrxResult(result as any);

        sendResponse?.(crxResult);
        return crxResult;
    } catch (e) {
        const errorResult: RecognizeResult = {
            ok: false,
            error: String(e)
        };
        sendResponse?.(errorResult);
        return errorResult;
    }
};

// CRX-enhanced extractCSS using unified service
export const extractCSS = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    try {
        const result = await coreExtractCSS(input, { useActiveInstruction: true });
        const crxResult = toCrxResult(result as any);

        sendResponse?.(crxResult);
        return crxResult;
    } catch (e) {
        const errorResult: RecognizeResult = {
            ok: false,
            error: String(e)
        };
        sendResponse?.(errorResult);
        return errorResult;
    }
};

//
export const IMAGE_INSTRUCTION = `
Recognize data from image, also preferred to orient by fonts in image.

In recognition result, do not include image itself.

In recognized from image data (what you seen in image), do:
- If textual content, format as Markdown string (multiline).
- If math (expression, equation, formula), format as $KaTeX$
- If table (or looks alike table), format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as JSON string.
- If phone number, format as as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as as correct email (in normalized format).
- If URL, format as as correct URL (in normalized format).
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

If nothing found, return "No data recognized".

By default, return data in Markdown string format.
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
- If JSON, format as JSON string.
- If phone number, format as as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as as correct email (in normalized format).
- If URL, format as as correct URL (in normalized format).
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

Return handled data as Markdown string, without any additional comments.
`;

//
export const ENTITY_EXTRACTION_INSTRUCTION = `
Extract structured entities from the provided content.

For each entity found, extract:
- type: entity type (task, event, person, place, service, item, factor, bonus)
- id: suggested unique identifier
- name: machine-readable name
- title: human-readable title
- kind: specific subtype
- properties: relevant attributes
- description: markdown description

Return in JSON format:
\`\`\`json
{
    "entities": [...],
    "keywords": [...],
    "short_description": "markdown summary"
}
\`\`\`
`;

//
export const DATA_MODIFICATION_INSTRUCTION = `
Modify the provided entity based on user instructions.

Rules:
1. Preserve original structure unless explicitly asked to change
2. Preserve ID field unless explicitly asked to change
3. Apply modifications carefully, one by one
4. Return the complete modified entity

Return in JSON format:
\`\`\`json
{
    "modified_entity": {...},
    "changes_made": ["list of changes"],
    "warnings": []
}
\`\`\`
`;

// Use the unified CRX-optimized instructions
// Use the unified CRX-optimized instructions
export const SOLVE_AND_ANSWER_INSTRUCTION = CRX_SOLVE_AND_ANSWER_INSTRUCTION;

// Keep legacy aliases for backward compatibility
export const EQUATION_SOLVE_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;
export const ANSWER_QUESTION_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;

//
export const WRITE_CODE_INSTRUCTION = CRX_WRITE_CODE_INSTRUCTION;

//
export const EXTRACT_CSS_INSTRUCTION = CRX_EXTRACT_CSS_INSTRUCTION;

export type RecognizeResult = {
    ok: boolean;
    data?: string;
    error?: string;
    raw?: any;
}

export type ExtendedRecognizeOptions = {
    effort?: "low" | "medium" | "high";
    verbosity?: "low" | "medium" | "high";
    context?: DataContext;
    extractEntities?: boolean;
    returnJson?: boolean;
    /** Explicit custom instruction text to prepend */
    customInstruction?: string;
    /** If true, automatically fetch and use the active custom instruction from settings */
    useActiveInstruction?: boolean;
}

//

// For image recognition: use low effort (minimal reasoning) and low verbosity (concise output)
export const recognizeImageData = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void,
    options?: ExtendedRecognizeOptions
): Promise<RecognizeResult> => {
    return recognizeByInstructions(input, IMAGE_INSTRUCTION, sendResponse, {
        effort: "low",
        verbosity: "low",
        ...options
    });
};

// For text conversion: use low effort and low verbosity for concise output
export const convertTextualData = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void,
    options?: ExtendedRecognizeOptions
): Promise<RecognizeResult> => {
    return recognizeByInstructions(input, DATA_CONVERSION_INSTRUCTION, sendResponse, {
        effort: "low",
        verbosity: "low",
        ...options
    });
};


//
export const extractEntities = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    return recognizeByInstructions(input, ENTITY_EXTRACTION_INSTRUCTION, sendResponse, {
        effort: "high",
        verbosity: "medium",
        returnJson: true
    });
};

//
export const modifyEntityData = async (
    existingEntity: any,
    modificationPrompt: string,
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    const settings = (await loadSettings())?.ai;
    const token = settings?.apiKey;

    if (!token) {
        const result = { ok: false, error: "No API key" };
        sendResponse?.(result);
        return result;
    }

    const instructions = `
${DATA_MODIFICATION_INSTRUCTION}

Existing entity to modify:
\`\`\`json
${JSON.stringify(existingEntity, null, 2)}
\`\`\`

User modification request: ${modificationPrompt}
`;

    const input = [{
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: instructions }]
    }];

    return recognizeByInstructions(input, "", sendResponse, {
        effort: "high",
        verbosity: "low",
        returnJson: true
    });
};

//
export const analyzeRecognizeUnified = async (
    rawData: File | Blob | string,
    sendResponse?: (result: RecognizeResult) => void,
    options?: ExtendedRecognizeOptions
): Promise<RecognizeResult> => {
    const content = await getUsableData({ dataSource: rawData });
    const input = [{
        type: "message",
        role: "user",
        content: [content]
    }];

    const isImage = content?.type == "input_image";

    // Extract entities if requested
    if (options?.extractEntities) {
        const result = isImage
            ? await recognizeImageData(input, undefined, options)
            : await convertTextualData(input, undefined, options);

        if (result.ok && result.data) {
            // Follow up with entity extraction
            const entityInput = [{
                type: "message",
                role: "user",
                content: [{ type: "input_text", text: result.data }]
            }];
            const entityResult = await extractEntities(entityInput);

            if (entityResult.ok) {
                result.data = entityResult.data;
            }
        }

        sendResponse?.(result);
        return result;
    }

    return isImage
        ? recognizeImageData(input, sendResponse, options)
        : convertTextualData(input, sendResponse, options);
};

//
export const batchRecognize = async (
    items: (File | Blob | string)[],
    sendProgress?: (progress: { current: number; total: number; result?: RecognizeResult }) => void
): Promise<{ ok: boolean; results: RecognizeResult[]; successful: number; failed: number }> => {
    const results: RecognizeResult[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
        const result = await analyzeRecognizeUnified(items[i]);

        results.push(result);

        if (result.ok) {
            successful++;
        } else {
            failed++;
        }

        sendProgress?.({ current: i + 1, total: items.length, result });
    }

    return {
        ok: failed === 0,
        results,
        successful,
        failed
    };
};

//
export const smartRecognizeWithHints = async (
    rawData: File | Blob | string,
    hints: {
        expectedType?: string;
        language?: string;
        extractEntities?: boolean;
        normalizeOutput?: boolean;
    } = {},
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    const context: DataContext = {
        entityType: hints.expectedType,
        operation: hints.extractEntities ? "extract" : "analyze"
    };

    let instructions = "";

    if (hints.expectedType) {
        instructions += `Expected content type: ${hints.expectedType}\n`;
    }

    if (hints.language) {
        instructions += `Content language: ${hints.language}\n`;
    }

    if (hints.normalizeOutput) {
        instructions += `
Normalize all extracted data:
- Phone numbers: E.164 format
- Emails: lowercase, trimmed
- URLs: with protocol
- Dates: ISO 8601 format
- Times: 24-hour format
`;
    }

    const content = await getUsableData({ dataSource: rawData, context });
    const input = [{
        type: "message",
        role: "user",
        content: [
            instructions ? { type: "input_text", text: instructions } : null,
            content
        ].filter(Boolean)
    }];

    const isImage = content?.type == "input_image";
    const baseInstruction = isImage ? IMAGE_INSTRUCTION : DATA_CONVERSION_INSTRUCTION;

    const result = await recognizeByInstructions(input, baseInstruction, undefined, {
        context,
        effort: hints.extractEntities ? "high" : "medium",
        returnJson: hints.extractEntities
    });

    sendResponse?.(result);
    return result;
};

//
export const recognizeAndModify = async (
    rawData: File | Blob | string,
    modificationPrompt: string,
    sendResponse?: (result: RecognizeResult) => void
): Promise<RecognizeResult> => {
    // First recognize the data
    const recognizeResult = await analyzeRecognizeUnified(rawData, undefined, {
        extractEntities: true,
        returnJson: true
    });

    if (!recognizeResult.ok || !recognizeResult.data) {
        sendResponse?.(recognizeResult);
        return recognizeResult;
    }

    // Parse the recognized data
    let recognized: any;
    try {
        recognized = typeof recognizeResult.data === "string"
            ? JSON.parse(recognizeResult.data)
            : recognizeResult.data;
    } catch {
        recognized = { raw: recognizeResult.data };
    }

    // Apply modification
    const modifyResult = await modifyEntityData(recognized, modificationPrompt);
    sendResponse?.(modifyResult);
    return modifyResult;
};

