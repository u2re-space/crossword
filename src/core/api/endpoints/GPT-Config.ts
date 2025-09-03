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
export const ASK_WRITE_JSON_FORMAT = `
Don't write anything else, just the JSON format, do not write comments, do not write anything else.
`?.trim?.();
