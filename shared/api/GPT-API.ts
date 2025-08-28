const BASE_URL = "https://api.openai.com/v1";
const MODEL = "gpt-5";
const ENDPOINT = "responses";

//
const SYSTEM_PROMPT = `
You are a helpful assistant that can answer questions and help with tasks.
You are also a helpful assistant that can help with tasks.
Output only JSON code, nothing else.
`

//
const INSTRUCTIONS = {
    "math": "Needs to solve math problems and return the answer.",
    "url": "Needs to search in url and convert into JSON scheme, auto-detected kind of url, and return it in JSON format. Return only JSON. Use JSON_SCHEMES from Scheme.ts.",
    "text": "Needs to convert text into JSON scheme, auto-detected kind of text, and return it in JSON format. Return only JSON. Use JSON_SCHEMES from Scheme.ts.",
    "image": "Needs to recognize image contents and convert into JSON scheme, auto-detected kind of image, and return it in JSON format. Return only JSON. Use JSON_SCHEMES from Scheme.ts.",
}

//
const getUsableData = async (prompt: string|Blob|File|any, kind: "math" | "url" | "text" | "image" = "text") => {
    if (prompt instanceof Blob || prompt instanceof File) {
        const reader = new FileReader();
        if (kind === "image") {
            return new Promise((resolve, reject) => {
                reader.readAsDataURL(prompt);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        } else {
            return new Promise((resolve, reject) => {
                reader.readAsText(prompt);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        }
    }
    return prompt;
}

//
const typesForKind: Record<"math" | "url" | "text" | "image", "text" | "image_url" | "text_search_result" | "json_schema" | "json_schema_search_result"> = {
    "math": "text",
    "url": "text",
    "text": "text",
    "image": "image_url",
}

//
const PROMPT_COMPUTE_EFFORT = (kind: "math" | "url" | "text" | "image", prompt?: string|Blob|File|any) => {
    if (prompt instanceof Blob || prompt instanceof File) {
        if (kind === "image") return "medium";
        return "low";
    }
    if (typeof prompt === "string") {
        if (prompt.includes("math")) return "high";
        if (prompt.includes("url")) return "medium";
        if (prompt.includes("text")) return "medium";
        return "low";
    }
    return "low";
}

//
const COMPUTE_TEMPERATURE = (kind: "math" | "url" | "text" | "image", prompt?: string|Blob|File|any) => {
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
    getResponse: async (prompt: string|Blob|File, kind: "math" | "url" | "text" | "image" = "text") => {
        const response = await fetch(`${BASE_URL}/${ENDPOINT}`, {
            body: JSON.stringify({
                reasoning: { effort: PROMPT_COMPUTE_EFFORT(kind, prompt) },
                model: MODEL,
                temperature: COMPUTE_TEMPERATURE(kind, prompt),
                input: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: await getUsableData(prompt, kind), type: typesForKind[kind] || "text" },
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
    }
}
