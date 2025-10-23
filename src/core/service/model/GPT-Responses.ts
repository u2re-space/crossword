import { DataInput, DataKind, actionWithDataType, getDataKindByMIMEType, typesForKind } from "./GPT-Config";

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
    } else
        if (typeof data?.dataSource == "string") {
            // be aware, this may be base64 encoded image
            if (data?.dataSource?.startsWith?.("data:image/") && data?.dataSource?.includes?.(";base64,")) {
                return {
                    "type": "input_image",
                    "image_url": data?.dataSource,// @ts-ignore
                    "detail": "auto"
                }
            }

            // anyways returns Promise<string>
            return {
                "type": "input_text",
                "text": data?.dataSource
            }
    }

    // is not Blob or File, so it's (may be) string (if not string, try to parse it as JSON)
    let result = data?.dataSource;
    try { result = (typeof data?.dataSource != "object") ? data?.dataSource : JSON.stringify(data?.dataSource); } catch (e) { console.warn(e); }

    //
    return {
        "type": typesForKind?.[data?.dataKind || "input_text"] || "text",
        "text": result
    }
}

//
export class GPTResponses {
    private apiKey: string;
    private apiSecret: string;

    //
    private apiUrl: string = "https://api.proxyapi.ru/openai/v1";
    private model: string = "gpt-5-mini";
    private responseId?: string | null = null;

    //
    protected pending: any[] = [];
    protected messages: any[] = [];
    protected tools: Map<string, any> = new Map();

    //
    constructor(apiKey: string, apiUrl: string, apiSecret: string, model: string) {
        this.apiKey = apiKey || "";
        // Prefer explicit env URL, otherwise keep default
        this.apiUrl = apiUrl || this.apiUrl;
        this.apiSecret = apiSecret || "";
        // Allow overriding model via env
        // @ts-ignore
        this.model = model || this.model;
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
    async convertPlainToInput(dataSource: (string | Blob | File | any), dataKind: DataKind | null = null, additionalAction: string | null = null): Promise<any> {
        dataKind ??= getDataKindByMIMEType(dataSource?.type) || "input_text";
        return {
            type: "message",
            role: "user",
            content: [
                { type: "input_text", text: "What to do: " + actionWithDataType({ dataSource, dataKind }) },
                additionalAction ? { type: "text", text: "Additional request data: " + additionalAction } : null,
                { type: "input_text", text: "\n === BEGIN:ATTACHED_DATA === \n" },
                { /*type: typesForKind?.[dataKind],*/ ...(await getUsableData({ dataSource, dataKind })) },
                { type: "input_text", text: "\n === END:ATTACHED_DATA === \n" },
            ]?.filter?.((item) => item !== null)
        };
    }

    //
    async attachToRequest(dataSource: (string | Blob | File | any), dataKind: DataKind | null = null, firstAction: string | null = null) {
        this.pending.push(await this.convertPlainToInput(dataSource, dataKind ??= getDataKindByMIMEType(dataSource?.type) || "input_text"));
        if (firstAction) { this.pending.push(await this.askToDoAction(firstAction)); }
        return this.pending[this.pending.length - 1];
    }

    //
    async giveForRequest(whatIsIt: string) {
        this.pending.push({
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Additional data for request: " }, { type: "input_text", text: whatIsIt }]
        });
        return this.pending[this.pending.length - 1];
    }

    // for responses (not first requests)
    async askToDoAction(action: string) {
        this.pending.push({
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: action }]
        });
        return this.pending[this.pending.length - 1];
    }

    //
    beginFromResponseId(responseId: string | null = null) {
        this.responseId = (this.responseId = (responseId || this.responseId));
        return this;
    }

    //
    async sendRequest(effort: "low" | "medium" | "high" = "low", verbosity: "low" | "medium" | "high" = "low", prevResponseId: string | null = null) {
        effort ??= "low";
        verbosity ??= "low";
        const response = await fetch(`${this.apiUrl}/responses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
            },
            body: JSON.stringify({
                model: this.model,
                tools: Array.from(this.tools.values())?.filter?.((tool: any) => !!tool),
                input: [...this.pending]?.filter?.((item: any) => !!item),
                reasoning: { "effort": effort },
                text: { verbosity: verbosity },
                max_output_tokens: 400000,
                previous_response_id: (this.responseId = (prevResponseId || this.responseId)),
                instructions: "Give results only in valid JSON formatted (\`https://json-schema.org/draft/2020-12/\`), no any additional text or comments. You may give in any other format only if explicitly stated in instructions."
            }),
        })?.catch?.((e) => { console.warn(e); return null; });
        if (!response) return null;

        //
        if (response.status !== 200) {
            const error = await response?.json?.()?.catch?.((e) => { console.warn(e); return null; });
            console.warn(error);
            return null;
        }

        //
        const resp = response.status === 200 ? await response?.json?.()?.catch?.((e) => { console.warn(e); return null; }) : null;
        if (!resp) return null;

        //
        this.responseId = resp?.id || this.responseId;
        this.messages.push(...(this.pending || [])); this.pending?.splice?.(0, this.pending.length);
        this.messages.push(...(resp?.output || []));

        // Try best-effort extraction of textual content to feed callers that JSON.parse the result
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
                        // OpenAI responses: {type: 'input_text', text: '...'} or {type:'output_text', text: {...}}
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
        try { return JSON.parse(resp?.output ?? resp); } catch { /* noop */ }
        return "";
    }

    //
    getResponseId() { return this.responseId; }
    getMessages() { return this.messages; }
    getPending() { return this.pending; }
}
