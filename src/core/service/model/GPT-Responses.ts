import { encode } from "@toon-format/toon";
import {
    actionWithDataType,
    getDataKindByMIMEType,
    typesForKind,
    detectDataKindFromContent,
    PROMPT_COMPUTE_EFFORT,
    COMPUTE_TEMPERATURE,
    buildModificationPrompt,
    DATA_MODIFICATION_PROMPT,
    DATA_SELECTION_PROMPT,
    ENTITY_MERGE_PROMPT,
    type DataInput,
    type DataKind,
    type DataContext,
    type DataFilter,
    type ModificationInstruction
} from "./GPT-Config";
import { JSOX } from "jsox";
import {
    extractJSONFromAIResponse,
    STRICT_JSON_INSTRUCTIONS
} from "@rs-core/utils/AIResponseParser";

//
export type RequestOptions = {
    effort?: "low" | "medium" | "high";
    verbosity?: "low" | "medium" | "high";
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    responseFormat?: "json" | "text" | "markdown";
}

export type AIResponse<T = unknown> = {
    ok: boolean;
    data?: T;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    responseId?: string | null;
}

//
export const getUsableData = async (data: DataInput) => {
    if (data?.dataSource instanceof Blob || data?.dataSource instanceof File) {
        if (typesForKind?.[data?.dataKind || "input_text"] === "input_image" || (data?.dataSource?.type?.startsWith?.("image/"))) {
            const BASE64URL = `data:${data?.dataSource?.type};base64,`; // @ts-ignore
            const URL = BASE64URL + await (new Uint8Array(await data?.dataSource?.arrayBuffer())?.toBase64?.({ alphabet: "base64" }));
            return {
                "type": "input_image",
                "detail": "auto",
                "image_url": URL
            }
        }

        // Handle other file types as text
        const text = await data?.dataSource?.text?.()?.catch?.(() => null);
        if (text) {
            const detectedKind = detectDataKindFromContent(text);
            return {
                "type": "input_text",
                "text": text,
                "_detectedKind": detectedKind
            }
        }
    } else if (typeof data?.dataSource == "string") {
        // Auto-detect data kind if not specified
        const effectiveKind = data?.dataKind || detectDataKindFromContent(data.dataSource);

        // be aware, this may be base64 encoded image
        if (
            (data?.dataSource?.startsWith?.("data:image/") && data?.dataSource?.includes?.(";base64,")) ||
            URL.canParse(data?.dataSource?.trim?.() || "", typeof (typeof window != "undefined" ? window : globalThis)?.location == "undefined" ? undefined : ((typeof window != "undefined" ? window : globalThis)?.location?.origin || "")) ||
            (typesForKind?.[effectiveKind] == "input_image")
        ) {
            return {
                "type": "input_image",
                "image_url": data?.dataSource,
                "detail": "auto"
            }
        }

        // anyways returns Promise<string>
        return {
            "type": "input_text",
            "text": data?.dataSource,
            "_detectedKind": effectiveKind
        }
    }

    // is not Blob or File, so it's (may be) string (if not string, try to parse it as JSON)
    let result = data?.dataSource;
    try {
        result = (typeof data?.dataSource != "object") ? data?.dataSource : encode(data?.dataSource);
    } catch (e) {
        console.warn(e);
    }

    //
    return {
        "type": typesForKind?.[data?.dataKind || "input_text"] || "text",
        "text": result,
        "_detectedKind": data?.dataKind || "structured"
    }
}

//
export class GPTResponses {
    private apiKey: string;
    private apiSecret: string;
    private apiUrl: string = "https://api.proxyapi.ru/openai/v1";
    private model: string = "gpt-5.1";
    private responseId?: string | null = null;

    protected pending: any[] = [];
    protected messages: any[] = [];
    protected tools: Map<string, any> = new Map();
    protected context: DataContext | null = null;

    //
    constructor(apiKey: string, apiUrl: string, apiSecret: string, model: string) {
        this.apiKey = apiKey || "";
        this.apiUrl = apiUrl || this.apiUrl;
        this.apiSecret = apiSecret || "";
        this.model = model || this.model;
    }

    //
    setContext(context: DataContext | null) {
        this.context = context;
        return this;
    }

    //
    async useMCP(serverLabel: string, origin: string, clientKey: string, secretKey: string) {
        this.tools.set(origin?.trim?.(), {
            "type": "mcp",
            "server_label": serverLabel,
            "server_url": origin,
            "headers": {
                "authorization": `Bearer ${clientKey}:${secretKey}`
            },
            "require_approval": "never"
        })
        return this.tools.get(origin?.trim?.());
    }

    //
    async convertPlainToInput(
        dataSource: (string | Blob | File | any),
        dataKind: DataKind | null = null,
        additionalAction: string | null = null
    ): Promise<any> {
        dataKind ??= getDataKindByMIMEType(dataSource?.type) || "input_text";

        const dataInput: DataInput = { dataSource, dataKind, context: this.context };
        const usableData = await getUsableData(dataInput);

        return {
            type: "message",
            role: "user",
            content: [
                { type: "input_text", text: "What to do: " + actionWithDataType(dataInput) },
                additionalAction ? { type: "text", text: "Additional request data: " + additionalAction } : null,
                { type: "input_text", text: "\n === BEGIN:ATTACHED_DATA === \n" },
                { ...usableData },
                { type: "input_text", text: "\n === END:ATTACHED_DATA === \n" },
            ]?.filter?.((item) => item !== null)
        };
    }

    //
    async attachToRequest(
        dataSource: (string | Blob | File | any),
        dataKind: DataKind | null = null,
        firstAction: string | null = null
    ) {
        this.pending.push(await this.convertPlainToInput(
            dataSource,
            dataKind ??= getDataKindByMIMEType(dataSource?.type) || "input_text"
        ));
        if (firstAction) {
            this.pending.push(await this.askToDoAction(firstAction));
        }
        return this.pending[this.pending.length - 1];
    }

    //
    async attachExistingData(existingData: any, entityType?: string) {
        this.context = {
            ...this.context,
            existingData,
            entityType: entityType || this.context?.entityType
        };

        await this.giveForRequest(`existing_data: \`${encode(existingData)}\`\n`);
        return this;
    }

    //
    async giveForRequest(whatIsIt: string) {
        this?.pending?.push?.({
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Additional data for request: " }, { type: "input_text", text: whatIsIt }]
        });
        return this?.pending?.[this?.pending?.length - 1];
    }

    //
    async askToDoAction(action: string) {
        this?.pending?.push?.({
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: action }]
        });
        return this?.pending?.[this?.pending?.length - 1];
    }

    //
    beginFromResponseId(responseId: string | null = null) {
        this.responseId = (this.responseId = (responseId || this.responseId));
        return this;
    }

    //
    async sendRequest(
        effort: "low" | "medium" | "high" = "low",
        verbosity: "low" | "medium" | "high" = "low",
        prevResponseId: string | null = null,
        options: RequestOptions = {}
    ): Promise<string | null> {
        effort ??= "low";
        verbosity ??= "low";

        // De-duplicate pending items
        const uniquePending = new Map();
        for (const item of this.pending) {
            if (!item) continue;
            try {
                const key = typeof item === 'object' ? JSOX.stringify(item) : String(item);
                if (!uniquePending.has(key)) {
                    uniquePending.set(key, item);
                }
            } catch (e) {
                uniquePending.set(Math.random().toString(), item);
            }
        }
        const filteredInput = Array.from(uniquePending.values());

        // Build strict JSON instructions for json response format
        // Following OpenAI Responses API best practices
        const jsonInstructions = options?.responseFormat === "json"
            ? STRICT_JSON_INSTRUCTIONS
            : undefined;

        const requestBody: any = {
            model: this.model,
            tools: Array.from(this?.tools?.values?.() || [])?.filter?.((tool: any) => !!tool),
            input: filteredInput,
            reasoning: { "effort": effort },
            text: { verbosity: verbosity },
            max_output_tokens: options?.maxTokens || 400000,
            previous_response_id: (this.responseId = (prevResponseId || this?.responseId)),
            instructions: jsonInstructions
        };

        // Add temperature if specified
        if (options?.temperature !== undefined) {
            requestBody.temperature = options.temperature;
        }

        const response = await fetch(`${this?.apiUrl}/responses`, {
            method: "POST",
            priority: 'auto',
            keepalive: true,
            headers: {
                "Content-Type": "application/json",
                ...(this?.apiKey ? { "Authorization": `Bearer ${this?.apiKey}` } : {})
            },
            body: JSON.stringify(requestBody),
        })?.catch?.((e) => {
            console.warn(e);
            return null;
        });
        if (!response) return null;

        //
        if (response.status !== 200) {
            const error = await response?.json?.()?.catch?.((e) => {
                console.warn(e);
                return null;
            });
            console.warn(error);
            return null;
        }

        //
        const resp = response.status === 200
            ? await response?.json?.()?.catch?.((e) => { console.warn(e); return null; })
            : null;
        if (!resp) return null;

        //
        this.responseId = resp?.id || this?.responseId;
        this?.messages?.push?.(...(this?.pending || []));
        this?.pending?.splice?.(0, this?.pending?.length);
        this.messages.push(...(resp?.output || []));

        // Try best-effort extraction of textual content
        const extractText = (r: any): string | null => {
            try {
                if (!r) return null;
                if (typeof r === "string") return r;
                if (r.output_text && Array.isArray(r.output_text) && r.output_text.length) {
                    return r.output_text.join("\n\n");
                }
                const outputs = r.output || [];
                const texts: string[] = [];
                for (const msg of outputs) {
                    const content = msg?.content || [];
                    if (!content) continue;
                    for (const part of content) {
                        if (typeof part?.text === "string") texts.push(part.text);
                        else if (part?.text?.value) texts.push(part.text.value);
                    }
                }
                if (texts.length) return texts.join("\n\n");
            } catch (e) {
                console.warn(e);
            }
            return null;
        };

        const text = extractText(resp);
        if (text != null) return text;

        // Fallback: return last message content as JSON string
        try {
            return JSOX.parse(resp?.output ?? resp) as any;
        } catch { /* noop */ }
        return "";
    }

    // === NEW METHODS FOR DATA MODIFICATION ===

    //
    async modifyExistingData(
        existingData: any,
        modificationPrompt: string,
        instructions: ModificationInstruction[] = []
    ): Promise<AIResponse<any>> {
        try {
            this.setContext({
                operation: "modify",
                existingData
            });

            await this.giveForRequest(DATA_MODIFICATION_PROMPT);
            await this.giveForRequest(`existing_entity: \`${encode(existingData)}\`\n`);

            if (instructions.length) {
                await this.giveForRequest(buildModificationPrompt(instructions));
            }

            await this.askToDoAction(modificationPrompt);

            const raw = await this.sendRequest("high", "medium", null, {
                responseFormat: "json",
                temperature: 0.2
            });

            if (!raw) {
                return { ok: false, error: "No response from AI" };
            }

            // Use robust JSON extraction to handle markdown-wrapped responses
            const parseResult = extractJSONFromAIResponse<any>(raw);
            if (!parseResult.ok) {
                console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
                return { ok: false, error: parseResult.error || "Failed to parse AI response" };
            }

            return {
                ok: true,
                data: parseResult.data?.modified_entity || parseResult.data,
                responseId: this.responseId
            };
        } catch (e) {
            console.error("Error in modifyExistingData:", e);
            return { ok: false, error: String(e) };
        }
    }

    //
    async selectAndFilterData(
        dataSet: any[],
        filters: DataFilter[],
        searchTerms: string[] = []
    ): Promise<AIResponse<any[]>> {
        try {
            this.setContext({
                operation: "extract",
                filters,
                searchTerms
            });

            await this.giveForRequest(DATA_SELECTION_PROMPT);
            await this.giveForRequest(`data_set: \`${encode(dataSet)}\`\n`);

            const filterDesc = filters.map(f =>
                `Filter: ${f.field} ${f.operator} ${JSON.stringify(f.value)}`
            ).join("\n");

            await this.askToDoAction(`
Select items from the provided data set matching these criteria:
${filterDesc}
${searchTerms.length ? `\nSearch terms: ${searchTerms.join(", ")}` : ""}

Return matching items with relevance scores.
            `);

            const raw = await this.sendRequest("medium", "low", null, {
                responseFormat: "json",
                temperature: 0.1
            });

            if (!raw) {
                return { ok: false, error: "No response from AI" };
            }

            // Use robust JSON extraction to handle markdown-wrapped responses
            const parseResult = extractJSONFromAIResponse<any>(raw);
            if (!parseResult.ok) {
                console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
                return { ok: false, error: parseResult.error || "Failed to parse AI response" };
            }

            return {
                ok: true,
                data: parseResult.data?.selected_items || parseResult.data,
                responseId: this.responseId
            };
        } catch (e) {
            console.error("Error in selectAndFilterData:", e);
            return { ok: false, error: String(e) };
        }
    }

    //
    async mergeEntities(
        primary: any,
        secondary: any | any[],
        mergeStrategy: "prefer_primary" | "prefer_secondary" | "prefer_newer" | "merge_all" = "prefer_primary"
    ): Promise<AIResponse<any>> {
        try {
            this.setContext({
                operation: "merge",
                existingData: primary
            });

            await this.giveForRequest(ENTITY_MERGE_PROMPT);
            await this.giveForRequest(`primary_entity: \`${encode(primary)}\`\n`);
            await this.giveForRequest(`secondary_data: \`${encode(secondary)}\`\n`);

            await this.askToDoAction(`
Merge the secondary data into the primary entity using "${mergeStrategy}" strategy:
- prefer_primary: Keep primary values when conflicts occur
- prefer_secondary: Use secondary values when conflicts occur
- prefer_newer: Compare timestamps and use newer values
- merge_all: Combine all unique values (arrays concatenated, objects deeply merged)

Return the merged entity with conflict resolution details.
            `);

            const raw = await this.sendRequest("high", "medium", null, {
                responseFormat: "json",
                temperature: 0.2
            });

            if (!raw) {
                return { ok: false, error: "No response from AI" };
            }

            // Use robust JSON extraction to handle markdown-wrapped responses
            const parseResult = extractJSONFromAIResponse<any>(raw);
            if (!parseResult.ok) {
                console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
                return { ok: false, error: parseResult.error || "Failed to parse AI response" };
            }

            return {
                ok: true,
                data: parseResult.data?.merged_entity || parseResult.data,
                responseId: this.responseId
            };
        } catch (e) {
            console.error("Error in mergeEntities:", e);
            return { ok: false, error: String(e) };
        }
    }

    //
    async searchSimilar(
        referenceEntity: any,
        candidateSet: any[],
        similarityThreshold: number = 0.7
    ): Promise<AIResponse<{ item: any; similarity: number }[]>> {
        try {
            this.setContext({
                operation: "analyze"
            });

            await this.giveForRequest(`reference_entity: \`${encode(referenceEntity)}\`\n`);
            await this.giveForRequest(`candidate_set: \`${encode(candidateSet)}\`\n`);

            // Note: We still show expected format in prompt but ask for raw JSON output
            await this.askToDoAction(`
Find items in the candidate set that are similar to the reference entity.
Consider semantic similarity, not just exact matches.
Compare:
- Names/titles (fuzzy match)
- Types/kinds
- Properties overlap
- Relationships

Return items with similarity score >= ${similarityThreshold}

Expected output structure:
{
    "similar_items": [
        { "item": {...}, "similarity": 0.85, "match_reasons": [...] }
    ],
    "potential_duplicates": [...],
    "related_but_different": [...]
}
            `);

            const raw = await this.sendRequest("medium", "medium", null, {
                responseFormat: "json",
                temperature: 0.3
            });

            if (!raw) {
                return { ok: false, error: "No response from AI" };
            }

            // Use robust JSON extraction to handle markdown-wrapped responses
            const parseResult = extractJSONFromAIResponse<any>(raw);
            if (!parseResult.ok) {
                console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
                return { ok: false, error: parseResult.error || "Failed to parse AI response" };
            }

            return {
                ok: true,
                data: parseResult.data?.similar_items || [],
                responseId: this.responseId
            };
        } catch (e) {
            console.error("Error in searchSimilar:", e);
            return { ok: false, error: String(e) };
        }
    }

    //
    async batchProcess(
        items: any[],
        operation: string,
        batchSize: number = 10
    ): Promise<AIResponse<any[]>> {
        const results: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            await this.giveForRequest(`batch_items: \`${encode(batch)}\`\n`);
            // Note: We show expected format but ask for raw JSON
            await this.askToDoAction(`
Process this batch of ${batch.length} items:
${operation}

Return processed items in same order.
Expected output: { "processed": [...], "failed": [...] }
            `);

            const raw = await this.sendRequest("medium", "low", null, {
                responseFormat: "json"
            });

            if (raw) {
                // Use robust JSON extraction to handle markdown-wrapped responses
                const parseResult = extractJSONFromAIResponse<any>(raw);
                if (parseResult.ok && parseResult.data) {
                    results.push(...(parseResult.data?.processed || []));
                    if (parseResult.data?.failed?.length) {
                        errors.push(...parseResult.data.failed.map((f: any) => f?.error || "Unknown error"));
                    }
                } else {
                    console.warn("Batch parsing failed:", parseResult.error);
                }
            }
        }

        return {
            ok: errors.length === 0,
            data: results,
            error: errors.length ? errors.join("; ") : undefined,
            responseId: this.responseId
        };
    }

    //
    clearPending() {
        this.pending.splice(0, this.pending.length);
        return this;
    }

    //
    getResponseId() { return this?.responseId; }
    getMessages() { return this?.messages; }
    getPending() { return this?.pending; }
    getContext() { return this?.context; }
}

// === HELPER FUNCTIONS ===

//
export const createGPTInstance = (
    apiKey: string,
    apiUrl?: string,
    model?: string
): GPTResponses => {
    return new GPTResponses(
        apiKey,
        apiUrl || "https://api.proxyapi.ru/openai/v1",
        "",
        model || "gpt-5.1"
    );
}

//
export const quickRecognize = async (
    apiKey: string,
    data: string | Blob | File,
    apiUrl?: string
): Promise<AIResponse<any>> => {
    const gpt = createGPTInstance(apiKey, apiUrl);
    await gpt.attachToRequest(data);
    const raw = await gpt.sendRequest("medium", "medium");

    if (!raw) {
        return { ok: false, error: "No response" };
    }

    // Use robust JSON extraction to handle markdown-wrapped responses
    const parseResult = extractJSONFromAIResponse<any>(raw);
    if (parseResult.ok) {
        return { ok: true, data: parseResult.data };
    }

    // Fallback to raw text if JSON extraction fails
    return { ok: true, data: raw };
}

//
export const quickModify = async (
    apiKey: string,
    existingData: any,
    modificationPrompt: string,
    apiUrl?: string
): Promise<AIResponse<any>> => {
    const gpt = createGPTInstance(apiKey, apiUrl);
    return gpt.modifyExistingData(existingData, modificationPrompt);
}
