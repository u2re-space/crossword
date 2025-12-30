/*
 * Chrome Extension Service for AI-powered data recognition.
 * Now uses unified core AI service with CRX-specific platform adaptations.
 * Supports screenshot capture, advanced image processing, and clipboard operations.
 */

import { UnifiedAIService } from "@rs-core/service/AI-ops/RecognizeData";
import type { RecognitionResult } from "@rs-core/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-core/config/Settings";
import { getUsableData } from "@rs-core/service/model/GPT-Responses";
import type { DataContext } from "@rs-core/service/model/GPT-Config";

// Import unified service functions for internal use
const {
    recognizeByInstructions: coreRecognizeByInstructions,
    solveAndAnswer: coreSolveAndAnswer,
    writeCode: coreWriteCode,
    extractCSS: coreExtractCSS
} = UnifiedAIService;

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
        }) as RecognitionResult;

        // Convert unified result format to CRX format
        const crxResult: RecognizeResult = {
            ok: result.ok,
            data: result.verbose_data || result.recognized_data?.[0] || "",
            error: result.errors?.[0] || undefined
        };

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

        const crxResult: RecognizeResult = {
            ok: result.ok,
            data: result.verbose_data || result.recognized_data?.[0] || "",
            error: result.errors?.[0] || undefined
        };

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

        const crxResult: RecognizeResult = {
            ok: result.ok,
            data: result.verbose_data || result.recognized_data?.[0] || "",
            error: result.errors?.[0] || undefined
        };

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

        const crxResult: RecognizeResult = {
            ok: result.ok,
            data: result.verbose_data || result.recognized_data?.[0] || "",
            error: result.errors?.[0] || undefined
        };

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

