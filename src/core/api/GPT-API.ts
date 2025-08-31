const BASE_URL = "https://api.openai.com/v1";
const ENDPOINT = "responses";
const MODEL = "gpt-5";

//
const SYSTEM_PROMPT = `
You are a helpful assistant that can answer questions and help with tasks.
You are also a helpful assistant that can help with tasks.
Output only JSON code, nothing else.
`;

//
const INSTRUCTIONS = {
    "math": "Needs to solve math problems and return the answer.",
    "url": "Needs to search in url and convert into JSON scheme, entity type of url, and return it in JSON format. Return only JSON. Use JSON_SCHEMES from Scheme.ts.",
    "text": "Needs to convert text into JSON scheme, entity type of text, and return it in JSON format. Return only JSON. Use JSON_SCHEMES from Scheme.ts.",
    "image": "Needs to recognize image contents and convert into JSON scheme, entity type of image, and return it in JSON format. Return only JSON. Use JSON_SCHEMES from Scheme.ts.",
}

//
const getUsableData = async (dataSource: string|Blob|File|any, kind: "math" | "url" | "text" | "image" = "text") => {
    if (dataSource instanceof Blob || dataSource instanceof File) {
        const reader = new FileReader();
        if (kind === "image") {
            return new Promise((resolve, reject) => {
                reader.readAsDataURL(dataSource);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        } else {
            return new Promise((resolve, reject) => {
                reader.readAsText(dataSource);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        }
    }
    return dataSource;
}

//
const typesForKind: Record<"math" | "url" | "text" | "image", "text" | "image_url" | "text_search_result" | "json_schema" | "json_schema_search_result"> = {
    "math": "text",
    "url": "text",
    "text": "text",
    "image": "image_url",
}

//
const PROMPT_COMPUTE_EFFORT = (dataSource?: string|Blob|File|any, kind?: "math" | "url" | "text" | "image") => {
    if (dataSource instanceof Blob || dataSource instanceof File) {
        if (kind === "image") return "medium";
        return "low";
    }
    if (typeof dataSource === "string") {
        if (dataSource.includes("math")) return "high";
        if (dataSource.includes("url")) return "medium";
        if (dataSource.includes("text")) return "medium";
        return "low";
    }
    return "low";
}

//
const COMPUTE_TEMPERATURE = (dataSource?: string|Blob|File|any, kind?: "math" | "url" | "text" | "image") => {
    // math needs more reasoning than creativity
    if (kind === "math") return 0.2;

    // don't know...
    if (kind === "url") return 0.4;

    // needs to some working for better understanding of image
    if (kind === "image") return 0.5;

    // texts needs to be bit creative
    if (kind === "text") return 0.6;

    // default level
    return 0.5;
}

// according to the kind of data, we need to use different types of messages
// POST https://api.openai.com/v1/responses
// https://platform.openai.com/docs/api-reference/chat/
// https://platform.openai.com/docs/api-reference/responses/
// text, image_url, text_search_result, json_schema, json_schema_search_result
export const GPT_API = {
    // for economy tokens, I propose three phase:
    // - request entity type by prompt data source, such as text, image, url, etc.
    // - after response, request what kind of entity, ('kind' property of entity, such as kind of bonus, kind of item, kind of service, etc.)
    // - also, for bonus, may be asked about requirements, for what is it usable, such as minimum order amount, minimum number of items, etc.
    // - after second response, and give to request short list (of related entities ids), to format ids as compatible for entities by IDs.

    // simple logic for recognize data source
    async recognizeDataSource(dataSource: string|Blob|File|any, kind: "math" | "url" | "text" | "image" = "text", asEntity: "auto" | "bonus" | "person" | "location" | "market" | "service" | "task" | "item" | "vehicle" | "entertainment" = "auto") {
        const response = await fetch(`${BASE_URL}/${ENDPOINT}`, {
            body: JSON.stringify({
                reasoning: { effort: PROMPT_COMPUTE_EFFORT(dataSource,kind) },
                model: MODEL,
                temperature: COMPUTE_TEMPERATURE(dataSource, kind),
                input: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: await getUsableData(dataSource, kind), type: typesForKind[kind] || "text" },
                    { role: "user", content: asEntity === "auto" ? "Auto-detect entity type of data source" : `Entity type of data source is ${asEntity}` },
                    { role: "assistant", content: INSTRUCTIONS[kind] }
                ],
                instructions: INSTRUCTIONS[kind],
                response_format: { type: typesForKind[kind] || "text" }
            }),
            method: "POST",
            headers: {
                "Content-Type": "application/json", // @ts-ignore
                "Authorization": `Bearer ${import.meta?.env?.VITE_OPENAI_API_KEY || ''}`
            },
        });

        //
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    },

    // assistance bit more complex logic for make plan, compute efforts always high
    async makePlan(preference: string, forDays: { start: Date, end: Date }, allowedDataSets?: any[]|null) {
        // step 1. get keywords and kind of data from preference and check allowed data sets, select best data sets
        // do first step by AI API

        // step 2. filter data sets by allowed data sets (optimize context and token usage)
        // do some JS operations to filter data sets

        // step 3. make plan
        // do next step by AI API

        // step 4. optimize plan
        // compare with current plan, and some changes if needed

        // step 4.5.
        // if has conflicts or difficulties try new AI request for make compatible plan

        // step 5. save plan in application storage
        // store plan in application storage as JSON

        // step 6. return plan
    },

    // for generate solutions, such as math, coding, etc.
    // more direct and less complex, may be passed some datasets for context
    async makeSolution(reQuest: any, contextDataSets?: any[]|null) {

    }
}
