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
type DataKind = "math" | "url" | "text" | "image";
type DataInput = {
    dataSource: string|Blob|File|any,
    dataKind: DataKind
}

//
const getUsableData = async (data: DataInput) => {
    if (data.dataSource instanceof Blob || data.dataSource instanceof File) {
        const reader = new FileReader();
        if (data.dataKind === "image") {
            return new Promise((resolve, reject) => {
                reader.readAsDataURL(data.dataSource);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        } else {
            return new Promise((resolve, reject) => {
                reader.readAsText(data.dataSource);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        }
    }
    return data.dataSource;
}

//
const typesForKind: Record<DataKind, "text" | "image_url" | "text_search_result" | "json_schema" | "json_schema_search_result"> = {
    "math": "text",
    "url": "text",
    "text": "text",
    "image": "image_url",
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

    // phase 1 - recognize entity type by data source, and return entity type for further processing
    async recognizeEntityType(dataInput: DataInput) {
        const response = await fetch(`${BASE_URL}/${ENDPOINT}`, {
            body: JSON.stringify({
                model: MODEL,
                reasoning: PROMPT_COMPUTE_EFFORT(dataInput),
                temperature: COMPUTE_TEMPERATURE(dataInput),
                input: [
                    { role: "system", content: SYSTEM_PROMPT },

                    // requested for phase 1
                    { role: "user", content: await getUsableData(dataInput) },
                ],
                instructions: INSTRUCTIONS[dataInput.dataKind],
                response_format: { type: "text" }
            }),
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    },

    // phase 2 - make some extraction of entity kind (make simpler sampling and filtering from entity database)
    // also, send JSON scheme of entity type for better understanding of entity kind
    async recognizeKindOfEntity(dataInput: DataInput, entityType: string) {
        const response = await fetch(`${BASE_URL}/${ENDPOINT}`, {
            body: JSON.stringify({
                model: MODEL,
                reasoning: PROMPT_COMPUTE_EFFORT(dataInput),
                temperature: COMPUTE_TEMPERATURE(dataInput),
                input: [
                    { role: "system", content: SYSTEM_PROMPT },

                    // requested for phase 1
                    { role: "user", content: await getUsableData(dataInput) },

                    // response from phase 1
                    { role: "assistant", content: `Entity type of data source is ${entityType}` },

                    // json scheme of entity type
                    { role: "user", content: INSTRUCTIONS[dataInput.dataKind] },
                ],
                instructions: INSTRUCTIONS[dataInput.dataKind],
                response_format: { type: "text" }
            }),
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    },

    // phase 3 - make capable entity data for entity type and entity kind
    // also, send additional simplified version of list of possibly related entities for further processing
    async makeCapableEntityData(dataInput: DataInput, desc: {
        // response from phase 1
        entityType: string,

        // from phase 2
        entityKind: string,
        entityUsage?: any|null,

        // additions for phase 3 (for make searchable related entities)
        contextDataset?: any[]|null

        // optionals for phase 3
        instructions?: string|null
    }) {
        const response = await fetch(`${BASE_URL}/${ENDPOINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json", // @ts-ignore
                "Authorization": `Bearer ${import.meta?.env?.VITE_OPENAI_API_KEY || ''}`
            },
            body: JSON.stringify({
                model: MODEL,
                reasoning: PROMPT_COMPUTE_EFFORT(dataInput),
                temperature: COMPUTE_TEMPERATURE(dataInput),
                input: [
                    { role: "system", content: SYSTEM_PROMPT },

                    // requested for phase 1
                    { role: "user", content: await getUsableData(dataInput) },

                    // response from phase 1
                    { role: "assistant", content: `Entity type of data source is ${desc.entityType}` },

                    // requested for phase 2
                    { role: "user", content: desc?.instructions || INSTRUCTIONS[desc.entityKind] },

                    // response from phase 2
                    { role: "assistant", content: `Entity usage: ${JSON.stringify(desc.entityUsage)}` },

                    // for phase 3 - request with context dataset
                    { role: "user", content: `Context dataset: ${desc.contextDataset?.map(item => JSON.stringify(item)).join(", ")}` },
                    { role: "user", content: desc?.contextDataset ? `Entity data: ${JSON.stringify(desc.entityUsage)}` : `Make capable entity data for entity type ${desc.entityType} and entity kind ${desc.entityKind}` },
                ],
                instructions: desc?.instructions || INSTRUCTIONS[desc.entityKind] || INSTRUCTIONS[desc.entityType] || INSTRUCTIONS[dataInput.dataKind],
                response_format: { type: typesForKind[desc.entityKind] || typesForKind[desc.entityType] || typesForKind[dataInput.dataKind] || "text" }
            }),
        });

        //
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    },

    // three phase logic for recognize data source
    async recognizeDataSource(dataInput: DataInput, asEntity: "auto" | "bonus" | "person" | "location" | "market" | "service" | "task" | "item" | "vehicle" | "entertainment" = "auto") {
        if (asEntity === "auto") {
            const resp1 = this.recognizeEntityType(dataInput);
            asEntity = resp1.entityType;
        }

        //
        const resp2 = this.recognizeKindOfEntity(dataInput, asEntity);
        const entityKind = {
            entityType: asEntity,
            entityKind: resp2.entityKind
        };

        //
        const capableEntityData = this.makeCapableEntityData(dataInput, entityKind);
        return {
            entityType: asEntity,
            entityKind: resp2.entityKind,
            entityUsage: capableEntityData
        };
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
