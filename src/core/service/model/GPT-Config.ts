export type DataKind = "math" | "url" | "output_text" | "input_text" | "image" | "image_url" | "text" | "input_image" | "input_url";
export type DataInput = {
    dataSource: string | Blob | File | any,
    dataKind: DataKind
}

//
export const PROMPT_COMPUTE_EFFORT = (data: DataInput) => {
    if (data.dataSource instanceof Blob || data.dataSource instanceof File) {
        if (data.dataKind === "image") return "medium";
        return "low";
    }
    if (typeof data.dataSource === "string") {
        if (data.dataSource.includes("math")) return "high";
        if (data.dataSource.includes("url")) return "medium";
        if (data.dataSource.includes("input_text")) return "medium";
        return "low";
    }
    return "low";
}

//
export const COMPUTE_TEMPERATURE = (data: DataInput) => {
    // math needs more reasoning than creativity
    if (data.dataKind === "math") return 0.2;

    // don't know...
    if (data.dataKind === "url") return 0.4;

    // needs to some working for better understanding of image
    if (data.dataKind === "input_image") return 0.5;

    // texts needs to be bit creative
    if (data.dataKind === "input_text") return 0.6;

    // default level
    return 0.5;
}

//
export const typesForKind: Record<DataKind, "input_text" | "image_url" | "input_image" | "input_url" | "text_search_result" | "json_schema" | "json_schema_search_result"> = {
    "math": "input_text",
    "url": "input_text",
    "text": "input_text",
    "input_text": "input_text",
    "output_text": "input_text",
    "image_url": "input_image",
    "image": "input_image",
    "input_image": "input_image",
    "input_url": "input_url",
}

//
export const getDataKindByMIMEType = (mime: string): DataKind => {
    if (mime.includes("image")) return "input_image";
    if (mime.includes("url")) return "input_url";
    return "input_text";
}

//
export const GLOBAL_PROMPT_INSTRUCTIONS = `
You are a helpful assistant that can recognize data and organize it in needed formats.

JSON Data schemes partially complains with: <https://json-schema.org/draft/2020-12/schema>

You are given a data source, and needs to follow by requests...

Give in results (outputs) only code or JSON string, without any additional comments.

Don't write anything else, just the JSON format, do not write comments, do not write anything else.
`;

//
export const actionWithDataType = (data: DataInput): string => {
    switch (typesForKind?.[data?.dataKind]) {
        case "input_image":
            return `Recognize data from image, also preferred to orient by fonts in image.

In recognition result, do not include image itself.

In recognized from image data (what you seen in image), do:

- If textual content, format as Markdown string (multiline).
- If math (expression, equation, formula), format as $KaTeX$
- If table (or looks alike table), format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as JSON string.
- If phone number, format as as correct phone number (in normalized format).
- If email, format as as correct email (in normalized format).
- If URL, format as as correct URL (in normalized format).
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

If nothing found, return "No data recognized". Write into "recognized_data" (JSON string) field.

Also, collect special data tags and keywords (if any)...

Get results in JSON wrapped format:

\`\`\`json
[...{
    "keywords_and_tags": string[],
    "additional_details": any[],
    "recognized_data": any[],
    "requested_data": any[] // where to write output data of following requests
}]
\`\`\`
`;

        case "input_text":
            return `Collect special data tags and keywords (if any)...

In additional details, can be written phone numbers, emails, URLs, dates, times, codes, etc.

Get result in JSON wrapped format:

\`\`\`json
[...{
    "keywords_and_tags": string[],
    "additional_details": any[],
    "recognized_data": any[],
    "requested_data": any[] // where to write output data of following requests
}]
\`\`\`
`;
    }
    return "";
}
