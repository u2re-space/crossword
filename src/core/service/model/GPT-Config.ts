export type DataKind = "math" | "url" | "output_text" | "input_text" | "image" | "image_url" | "text" | "input_image" | "input_url";
export type DataInput = {
    dataSource: string | Blob | File | any,
    dataKind?: DataKind | null
}

//
export const PROMPT_COMPUTE_EFFORT = (data: DataInput) => {
    if (data?.dataSource instanceof Blob || data?.dataSource instanceof File) {
        if (data?.dataKind === "image") return "medium";
        return "medium";
    }
    if (typeof data?.dataSource === "string") {
        if (data?.dataSource?.includes?.("math")) return "high";
        if (data?.dataSource?.includes?.("url")) return "medium";
        if (data?.dataSource?.includes?.("input_text")) return "medium";
        return "medium";
    }
    return "medium";
}

//
export const COMPUTE_TEMPERATURE = (data: DataInput) => {
    // math needs more reasoning than creativity
    if (data?.dataKind === "math") return 0.2;

    // don't know...
    if (data?.dataKind === "url") return 0.4;

    // needs to some working for better understanding of image
    if (data?.dataKind === "input_image") return 0.5;

    // texts needs to be bit creative
    if (data?.dataKind === "input_text") return 0.6;

    // default level
    return 0.5;
}

//
export const typesForKind: Record<DataKind, "input_text" | "image_url" | "input_image" | "input_url" | "text_search_result" | "json_schema" | "json_schema_search_result"> = {
    "math": "input_text",
    "url": "input_image",
    "text": "input_text",
    "input_text": "input_text",
    "output_text": "input_text",
    "image_url": "input_image",
    "image": "input_image",
    "input_image": "input_image",
    "input_url": "input_image",
}

//
export const getDataKindByMIMEType = (mime: string): DataKind => {
    if (mime?.includes?.("image")) return "input_image";
    if (mime?.includes?.("url")) return "input_url";
    return "input_text";
}

//
export const actionWithDataType = (data: DataInput): string => {
    switch (typesForKind?.[data?.dataKind || "input_text"]) {
        case "input_image":
            return `Recognize data from image, also preferred to orient by fonts in image.

After recognition, do not include or remember image itself.

---

In (\`recognized_data\` key), can be written phone numbers, emails, URLs, dates, times, codes, etc. Additional formatting rules:

In recognized from image data (what you seen in image), do:
- If textual content, format as Markdown string (multiline).
- If phone number, format as as correct phone number (in normalized format).
  - Also, if phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Remove brackets, parentheses, spaces or other symbols from phone number.
  - Trim spaces from phone number.
- If email, format as as correct email (in normalized format), and trim spaces from email.
- If URL, format as as correct URL (in normalized format), and unicode codes to human readable, and trim spaces from URL.
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If math (expression, equation, formula), format as $KaTeX$
- If table (or looks alike table), format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as correct JSON string, and trim spaces from JSON string.
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

---

Some additional actions:
- Collect some special data tags and keywords (if has any).
- Also, can you provide in markdown pre-formatted free-form analyzed or recognized verbose data (in \`verbose_data\` key).

---

Get results in JSON wrapped format:

\`\`\`json
[...{
    "keywords_and_tags": string[],
    "recognized_data": any[],
    "verbose_data": string,
    "using_ready": boolean
}]
\`\`\`
`;

        case "input_text":
            return `Analyze text and extract specific or special data from it, also normalize data by those rules...

---

In (\`recognized_data\` key), can be written phone numbers, emails, URLs, dates, times, codes, etc. Additional formatting rules:

Normalize phone numbers, emails, URLs, dates, times, codes, etc for best efforts and by those rules.
- If phone number, format as as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as as correct email (in normalized format), and trim spaces from email.
- If URL, format as as correct URL (in normalized format), and unicode codes to human readable, and trim spaces from URL.
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If math, format as $KaTeX$
- If table, format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as correct JSON string, and trim spaces from JSON string.
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

---

Some additional actions:
- Collect some special data tags and keywords (if has any).
- Also, can you provide in markdown pre-formatted free-form analyzed or recognized verbose data (in \`verbose_data\` key).

---

Get results in JSON wrapped format:

\`\`\`json
[...{
    "keywords_and_tags": string[],
    "recognized_data": any[],
    "verbose_data": string,
    "using_ready": boolean
}]
\`\`\`
`;
    }
    return "";
}
