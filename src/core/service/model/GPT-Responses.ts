import { DataInput, DataKind, GLOBAL_PROMPT_INSTRUCTIONS, actionWithDataType, getDataKindByMIMEType, typesForKind } from "./GPT-Config";

//
export const getUsableData = async (data: DataInput) => {
    if (data?.dataSource instanceof Blob || data?.dataSource instanceof File) {
        if (typesForKind?.[data?.dataKind] === "image_url" || (data?.dataSource?.type?.startsWith?.("image/"))) {
            const BASE64URL = `data:${data?.dataSource?.type};base64,`;
            return {
                "type": "image_url",
                "image_url": { // @ts-ignore
                    "url": BASE64URL + (new Uint8Array(await data?.dataSource?.arrayBuffer())?.toBase64?.({ alphabet: "base6" })),
                    "detail": "high"
                }
            }
        }
    } else
        if (typeof data?.dataSource == "string") {
            // be aware, this may be base64 encoded image
            if (data?.dataSource?.startsWith?.("data:image/") && data?.dataSource?.includes?.(";base64,")) {
                return {
                    "type": "image_url",
                    "image_url": { // @ts-ignore
                        "url": data?.dataSource,
                        "detail": "high"
                    }
                }
            }

            // anyways returns Promise<string>
            return {
                "type": "text",
                "text": data?.dataSource
            }
    }

    // is not Blob or File, so it's (may be) string (if not string, try to parse it as JSON)
    let result = data?.dataSource;
    try { result = (typeof data?.dataSource != "object") ? data?.dataSource : JSON.stringify(data?.dataSource); } catch (e) { console.warn(e); }

    //
    return {
        "type": typesForKind?.[data?.dataKind] || "text",
        "text": result
    }
}

//
export class GPTResponses {
    private apiKey: string;
    private apiSecret: string;

    //
    private apiUrl: string = "https://api.openai.com/v1";
    private model: string = "gpt-5";
    private responseId?: string | null = null;

    //
    protected pending: any[] = [];
    protected messages: any[] = [];
    protected tools: any[] = [];

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
        this.tools.push({
            "type": "mcp",
            "server_label": serverLabel,
            "server_url": origin,
            "headers": {
                "authorization": `Bearer ${clientKey}:${secretKey}`
            },
            "require_approval": "never"
        })
        return this.tools[this.tools.length - 1];
    }



    //
    async convertPlainToInput(dataSource: (string | Blob | File | any), dataKind: DataKind | null = null, additionalAction: string | null = null): Promise<any> {
        dataKind ??= getDataKindByMIMEType(dataSource?.type) || "text";
        return {
            type: "message",
            role: "system",
            content: [
                { type: "text", text: "What to do: " + actionWithDataType({ dataSource, dataKind }) },
                additionalAction ? { type: "text", text: "Additional request data: " + additionalAction } : null,
                { type: "text", text: "\n === BEGIN:ATTACHED_DATA === \n" },
                { /*type: typesForKind?.[dataKind],*/ ...await getUsableData({ dataSource, dataKind }) },
                { type: "text", text: "\n === END:ATTACHED_DATA === \n" },
            ]?.filter?.((item) => item !== null)
        };
    }

    //
    async attachToRequest(dataSource: (string | Blob | File | any), dataKind: DataKind | null = null, firstAction: string | null = null) {
        this.pending.push(await this.convertPlainToInput(dataSource, dataKind ??= getDataKindByMIMEType(dataSource?.type)));
        if (firstAction) { this.pending.push(await this.askToDoAction(firstAction)); }
        return this.pending[this.pending.length - 1];
    }



    // for responses (not first requests)
    async askToDoAction(action: string) {
        this.pending.push({
            type: "message",
            role: "user",
            content: [{ type: "text", text: action }]
        });
        return this.pending[this.pending.length - 1];
    }

    //
    async sendRequest() {
        const response = await fetch(`${this.apiUrl}/responses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
            },
            body: JSON.stringify({
                model: this.model,
                tools: this.tools?.filter?.((tool) => !!tool),
                input: [...this.pending]?.filter?.((item) => !!item),
                reasoning: { "effort": "medium" },
                previous_response_id: this.responseId,
                instructions: GLOBAL_PROMPT_INSTRUCTIONS
            }),
        });

        //
        const resp = await response.json();
        this.responseId = resp?.id || this.responseId;
        this.messages.push(...(this.pending || [])); this.pending?.splice(0, this.pending.length);
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
                    for (const part of content) {
                        // OpenAI responses: {type: 'text', text: '...'} or {type:'output_text', text: {...}}
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
        try { return JSON.stringify(resp?.output ?? resp); } catch { /* noop */ }
        return "";
    }

    //
    getMessages() { return this.messages; }
    getPending() { return this.pending; }
}
