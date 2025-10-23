import { loadSettings } from "@rs-core/config/Settings";
import { getUsableData } from "@rs-core/service/model/GPT-Responses";

//
const DEFAULT_MODEL = 'gpt-5-mini';
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

// used directly fetch to API
export const recognizeByInstructions = async (input, instructions: string, sendResponse?) => {
    const settings = (await loadSettings())?.ai;

    //
    const token = settings?.apiKey;
    if (!token) return sendResponse?.({ ok: false, error: "No API key or input" });
    if (!input) return sendResponse?.({ ok: false, error: "No input provided" });

    //
    const r: any = await fetch(`${settings?.baseUrl || DEFAULT_API_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            model: settings?.model || DEFAULT_MODEL, // ваш
            input,
            reasoning: { "effort": "low" },
            text: { verbosity: "low" },
            max_output_tokens: 400000,
            instructions
        })
    })?.catch?.(e => {
        console.warn(e);
        return { ok: false, error: String(e) };
    });

    //
    const res = await r?.json?.()?.catch?.((e) => {
        console.warn(e);
        return { ok: false, error: String(e) };
    }) || {};

    //
    const output = { ok: r?.ok, data: res?.output?.at?.(-1)?.content?.[0]?.text?.trim?.() };
    sendResponse?.(output);
    return output;
}; // async response

//
export const recognizeImageData = async (input, sendResponse?) => {
    return recognizeByInstructions(input, IMAGE_INSTRUCTION, sendResponse);
};

//
export const convertTextualData = async (input, sendResponse?) => {
    return recognizeByInstructions(input, DATA_CONVERSION_INSTRUCTION, sendResponse);
};

//
export const analyzeRecognizeUnified = async (rawData: File | Blob | string, sendResponse?) => {
    const content = await getUsableData({ dataSource: rawData });
    const input = [{
        type: "message",
        role: "user",
        content: [content]
    }];
    return content?.type == "input_image" ? recognizeImageData(input, sendResponse) : convertTextualData(input, sendResponse);
};
