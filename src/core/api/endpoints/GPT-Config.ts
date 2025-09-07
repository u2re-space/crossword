export type DataKind = "math" | "url" | "output_text" | "text" | "image" | "image_url";
export type DataInput = {
    dataSource: string|Blob|File|any,
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
        if (data.dataSource.includes("text")) return "medium";
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
    if (data.dataKind === "image") return 0.5;

    // texts needs to be bit creative
    if (data.dataKind === "text") return 0.6;

    // default level
    return 0.5;
}

//
export const typesForKind: Record<DataKind, "text" | "image_url" | "text_search_result" | "json_schema" | "json_schema_search_result"> = {
    "math": "text",
    "url": "text",
    "text": "text",
    "output_text": "text",
    "image_url": "image_url",
    "image": "image_url",
}

//
export const getDataKindByMIMEType = (mime: string): DataKind => {
    if (mime.includes("image")) return "image_url";
    if (mime.includes("url")) return "url";
    return "text";
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
    switch(typesForKind[data?.dataKind]) {
        case "image_url":
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

If nothing found, return "No data recognized". Write into "additional_details" (JSON string) field.

Also, collect special data tags and keywords (if any)...

Get results in JSON format:

\`\`\`json
{
    "keywords_and_tags": [string],
    "additional_details": [string],
    "requested_data": [string] // where to write output data of following requests
}
\`\`\`
`;

        case "text":
            return `Collect special data tags and keywords (if any)...

In additional details, can be written phone numbers, emails, URLs, dates, times, codes, etc.

Get result in JSON format:

\`\`\`json
{
    "keywords_and_tags": [string],
    "additional_details": [string],
    "requested_data": [string] // where to write output data of following requests
}
\`\`\`
`;
    }
    return "";
}
