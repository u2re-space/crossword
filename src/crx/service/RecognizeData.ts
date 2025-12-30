/*
 * Chrome Extension Service for AI-powered data recognition.
 * Enhanced version with support for GPT-5.2 Responses API features.
 * Supports user-defined custom instructions.
 */

import { loadSettings } from "@rs-core/config/Settings";
import { getUsableData } from "@rs-core/service/model/GPT-Responses";
import type { DataContext } from "@rs-core/service/model/GPT-Config";
import { getActiveInstructionText, buildInstructionPrompt } from "@rs-core/service/CustomInstructions";

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

//
export const SOLVE_AND_ANSWER_INSTRUCTION = `
Solve the problem or answer the question presented in the content.

Auto-detect the type of content:
- Mathematical equation/expression → Solve step-by-step
- Quiz/test question → Provide correct answer
- Homework problem → Solve and explain
- General question → Answer with explanation

Format output as:

**Problem/Question:**
<recognized content - use $KaTeX$ for math>

**Solution/Answer:**
<step-by-step solution or direct answer>

**Explanation:**
<clear explanation of the reasoning>

---

For MATH problems:
- Use single $ for inline math: $x = 5$
- Use double $$ for display equations: $$\\int_0^1 f(x) dx$$
- Show all intermediate steps
- Simplify the final answer
- For systems: solve all variables
- For inequalities: use interval notation

For MULTIPLE CHOICE:
- Identify correct option (A, B, C, D)
- Explain why it's correct
- Note why others are wrong

For TRUE/FALSE:
- State True or False clearly
- Provide justification

For SHORT ANSWER/ESSAY:
- Provide concise, complete answer
- Include key facts and reasoning

For CODING problems:
- Write the solution code
- Explain the logic

If multiple problems/questions present, solve each separately.
If unsolvable or unclear, explain why.
`;

// Keep legacy aliases for backward compatibility
export const EQUATION_SOLVE_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;
export const ANSWER_QUESTION_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;

//
export const WRITE_CODE_INSTRUCTION = `
Generate code based on the request/description presented in the content.

Instructions:
1. First, recognize and understand the coding request
2. Identify the programming language (if specified, otherwise choose most appropriate)
3. Write clean, functional code that solves the problem

Format output as:
**Request:**
<recognized description of what code should do>

**Language:**
<programming language used>

**Code:**
\`\`\`<language>
<generated code here>
\`\`\`

**Explanation:**
<brief explanation of how the code works>

Code quality guidelines:
- Write clean, readable, well-structured code
- Use meaningful variable and function names
- Add brief inline comments for complex logic
- Follow language conventions and best practices
- Handle edge cases where appropriate
- Keep code concise but complete

If the request is unclear, make reasonable assumptions and note them.
If additional context would help, mention what information would be useful.
`;

//
export const EXTRACT_CSS_INSTRUCTION = `
Analyze the visual content (image, screenshot, UI element) and generate matching CSS styles.

Instructions:
1. Analyze the visual design elements in the content
2. Identify key styling properties (colors, spacing, typography, layout, effects)
3. Generate CSS that would recreate or closely match the visual appearance

Format output as:
**Visual Analysis:**
<brief description of what you see>

**CSS:**
\`\`\`css
/* Generated styles */
<CSS code here>
\`\`\`

**Usage Notes:**
<how to apply these styles, any HTML structure needed>

Extract and generate:
- **Colors:** Background, text, border, accent colors (use modern formats: oklch, hex, rgb)
- **Typography:** Font family suggestions, sizes, weights, line-height, letter-spacing
- **Spacing:** Padding, margin, gaps (use rem/em units)
- **Layout:** Flexbox, Grid, positioning as appropriate
- **Effects:** Box-shadow, border-radius, gradients, blur, opacity
- **Borders:** Width, style, color, radius
- **Sizing:** Width, height, aspect-ratio

Modern CSS preferences:
- Use CSS custom properties (--variable-name) for reusable values
- Prefer logical properties (inline-size, block-size, margin-inline, etc.)
- Use modern color functions (oklch, color-mix)
- Include responsive considerations where relevant
- Use container queries syntax if layout-dependent

If the content contains multiple elements, provide CSS for each distinct component.
Include a suggested HTML structure if it helps understand the CSS context.
`;

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
export const recognizeByInstructions = async (
    input: any,
    instructions: string,
    sendResponse?: (result: RecognizeResult) => void,
    options: ExtendedRecognizeOptions = {}
): Promise<RecognizeResult> => {
    let settings;
    try {
        settings = (await loadSettings())?.ai;
    } catch (e) {
        console.error("Failed to load settings:", e);
        const result = { ok: false, error: "Failed to load settings" };
        sendResponse?.(result);
        return result;
    }

    const token = settings?.apiKey;
    if (!token) {
        console.warn("No API key found. Settings:", { hasApiKey: !!settings?.apiKey, hasBaseUrl: !!settings?.baseUrl });
        const result = { ok: false, error: "No API key configured. Please set your API key in extension settings." };
        sendResponse?.(result);
        return result;
    }
    if (!input) {
        const result = { ok: false, error: "No input provided" };
        sendResponse?.(result);
        return result;
    }

    // Build context-aware instructions
    let finalInstructions = instructions;
    if (options.context?.entityType) {
        finalInstructions += `\n\nContext: Expected entity type is "${options.context.entityType}"`;
    }
    if (options.context?.searchTerms?.length) {
        finalInstructions += `\n\nFocus on: ${options.context.searchTerms.join(", ")}`;
    }

    // Apply custom instructions (explicit or active from settings)
    let customInstructionText = options.customInstruction || "";
    if (!customInstructionText && options.useActiveInstruction !== false) {
        try {
            customInstructionText = await getActiveInstructionText();
        } catch (e) {
            console.warn("[AI] Failed to load active custom instruction:", e);
        }
    }
    if (customInstructionText) {
        finalInstructions = buildInstructionPrompt(finalInstructions, customInstructionText);
        console.log("[AI] Applied custom instruction");
    }

    const requestBody: any = {
        model: settings?.model || DEFAULT_MODEL,
        input,
        reasoning: { effort: options.effort || "low" },
        text: { verbosity: options.verbosity || "low" },
        max_output_tokens: 400000,
        instructions: finalInstructions
    };

    // Add JSON response format hint if requested
    if (options.returnJson) {
        requestBody.response_format = { type: "json_object" };
    }

    const apiUrl = `${settings?.baseUrl || DEFAULT_API_URL}${ENDPOINT}`;
    console.log("[AI] Request to:", apiUrl, "Model:", settings?.model || DEFAULT_MODEL);

    let r: Response | null = null;
    let fetchError: string | null = null;

    try {
        r = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });
    } catch (e) {
        fetchError = e instanceof Error ? e.message : String(e);
        console.error("[AI] Fetch failed:", fetchError);
    }

    if (fetchError || !r) {
        const result: RecognizeResult = { ok: false, error: `Network error: ${fetchError || "No response"}` };
        sendResponse?.(result);
        return result;
    }

    // Parse response body
    let res: any = null;
    try {
        res = await r.json();
    } catch (e) {
        console.error("[AI] Failed to parse JSON response:", e);
        const result: RecognizeResult = { ok: false, error: "Failed to parse API response" };
        sendResponse?.(result);
        return result;
    }

    console.log("[AI] Response status:", r.status, "ok:", r.ok);
    console.log("[AI] Response body:", JSON.stringify(res).slice(0, 1000));

    // Check for API error
    if (!r.ok) {
        const apiError = res?.error?.message || res?.error || res?.message || `HTTP ${r.status}`;
        console.error("[AI] API error:", apiError);
        const result: RecognizeResult = { ok: false, error: `API error: ${apiError}`, raw: res };
        sendResponse?.(result);
        return result;
    }

    // Extract text from various response structures
    const extractTextFromResponse = (response: any): string | undefined => {
        if (!response) return undefined;

        // Try output_text array first (some models return this)
        if (Array.isArray(response.output_text) && response.output_text.length) {
            return response.output_text.filter((t: any) => typeof t === "string").join("\n\n");
        }

        // Try output array
        const outputs = response.output || [];
        const texts: string[] = [];

        for (const msg of outputs) {
            const content = msg?.content || [];
            if (!Array.isArray(content)) continue;

            for (const part of content) {
                // Handle direct text string
                if (typeof part?.text === "string") {
                    texts.push(part.text);
                }
                // Handle nested text.value (some response formats)
                else if (typeof part?.text?.value === "string") {
                    texts.push(part.text.value);
                }
                // Handle output_text type
                else if (part?.type === "output_text" && typeof part?.text === "string") {
                    texts.push(part.text);
                }
            }
        }

        return texts.length ? texts.join("\n\n").trim() : undefined;
    };

    const extractedText = extractTextFromResponse(res);

    if (!extractedText) {
        console.warn("[AI] No text extracted. Response structure:", Object.keys(res || {}));
        if (res?.output) {
            console.warn("[AI] Output structure:", JSON.stringify(res.output).slice(0, 500));
        }
    } else {
        console.log("[AI] Extracted text length:", extractedText.length);
    }

    const output: RecognizeResult = {
        ok: !!extractedText,
        data: extractedText,
        error: !extractedText ? "No text found in AI response" : undefined,
        raw: res
    };

    sendResponse?.(output);
    return output;
};

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

// Unified solve & answer: handles equations, questions, quizzes, homework
export const solveAndAnswer = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void,
    options?: ExtendedRecognizeOptions
): Promise<RecognizeResult> => {
    return recognizeByInstructions(input, SOLVE_AND_ANSWER_INSTRUCTION, sendResponse, {
        effort: "high",
        verbosity: "medium",
        useActiveInstruction: false, // Don't apply custom instructions for solving
        ...options
    });
};

// Unified function for solving/answering from various sources
export const solveAndAnswerUnified = async (
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

    return solveAndAnswer(input, sendResponse, options);
};

// Legacy aliases for backward compatibility
export const solveEquation = solveAndAnswer;
export const solveEquationUnified = solveAndAnswerUnified;
export const answerQuestion = solveAndAnswer;
export const answerQuestionUnified = solveAndAnswerUnified;

// For writing code based on recognized request
export const writeCode = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void,
    options?: ExtendedRecognizeOptions
): Promise<RecognizeResult> => {
    return recognizeByInstructions(input, WRITE_CODE_INSTRUCTION, sendResponse, {
        effort: "high",
        verbosity: "medium",
        useActiveInstruction: false,
        ...options
    });
};

// Unified function for writing code from various sources
export const writeCodeUnified = async (
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
    return writeCode(input, sendResponse, options);
};

// For extracting CSS styles from visual content
export const extractCSS = async (
    input: any,
    sendResponse?: (result: RecognizeResult) => void,
    options?: ExtendedRecognizeOptions
): Promise<RecognizeResult> => {
    return recognizeByInstructions(input, EXTRACT_CSS_INSTRUCTION, sendResponse, {
        effort: "high",
        verbosity: "medium",
        useActiveInstruction: false,
        ...options
    });
};

// Unified function for extracting CSS from various sources
export const extractCSSUnified = async (
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
    return extractCSS(input, sendResponse, options);
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

