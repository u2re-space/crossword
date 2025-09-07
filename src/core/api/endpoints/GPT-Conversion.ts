import { DataInput, DataKind, GLOBAL_PROMPT_INSTRUCTIONS, actionWithDataType, getDataKindByMIMEType, typesForKind } from "./GPT-Config";

//
export const getUsableData = async (data: DataInput) => {
    if (data?.dataSource instanceof Blob || data?.dataSource instanceof File) {
        if (typesForKind[data?.dataKind] === "image_url" || (data?.dataSource?.type?.startsWith?.("image/"))) {
            const BASE64URL = `data:${data?.dataSource?.type};base64,`;
            return {
                "type": "image_url",
                "image_url": { // @ts-ignore
                    "url": BASE64URL+(new Uint8Array(await data?.dataSource?.arrayBuffer())?.toBase64?.({ alphabet: "base64url" })),
                    "detail": "high"
                }
            }
        } else
        if (typeof data?.dataSource === "string") {
            // anyways returns Promise<string>
            return {
                "type": "text",
                "text": data?.dataSource
            }
        }
    }

    // is not Blob or File, so it's (may be) string (if not string, try to parse it as JSON)
    let result = data?.dataSource;
    try { result = (typeof data?.dataSource != "object") ? data?.dataSource : JSON.stringify(data?.dataSource); } catch (e) { console.warn(e); }

    //
    return {
        "type": typesForKind[data?.dataKind],
        "text": result
    }
}

//
export class GPTConversion {
    private apiKey: string;
    private apiSecret: string;

    //
    private apiUrl: string = "https://openai.api.proxyapi.ru/v1";//"https://api.openai.com/v1";
    private model: string = "gpt-5";
    private responseId?: string|null = null;

    //
    protected pending: any[] = [];
    protected messages: any[] = [];
    protected tools: any[] = [];

    //
    constructor() {
        this.apiKey = process.env.GPT_API_KEY || "";
        this.apiUrl = process.env.GPT_API_URL || "";
        this.apiSecret = process.env.GPT_API_SECRET || "";
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
    async convertPlainToInput(request: (string|Blob|File|any), dataKind: DataKind|null = null, firstAction: string|null = null): Promise<any> {
        dataKind ??= getDataKindByMIMEType(request?.type) || "text";
        return {
            type: "message",
            role: "user",
            content: [
                { type: "text", text: "What to do: " + actionWithDataType({ dataSource: request, dataKind }) },
                firstAction ? { type: "text", text: "Additional request data: " + firstAction } : null,
                { type: "text", text: "Attached data: \n --- \n" },
                { /*type: typesForKind?.[dataKind],*/ ...await getUsableData({ dataSource: request, dataKind }) },
                { type: "text", text: "\n --- \n;" },
            ]?.filter?.((item)=> item !== null)
        };
    }

    // for responses (not first requests)
    async askToDoAction(action: string) {
        this.pending.push({
            type: "message",
            role: "user",
            content: [{ type: "text", text: action}]
        });
        return this.pending[this.pending.length - 1];
    }

    //
    async addToRequest(request: (string|Blob|File|any), dataKind: DataKind|null = null, firstAction: string|null = null) {
        this.pending.push(await this.convertPlainToInput(request, dataKind ??= getDataKindByMIMEType(request?.type), firstAction));
        return this.pending[this.pending.length - 1];
    }

    //
    async addSystemInput(request: (string|Blob|File|any), dataKind: DataKind|null = null) {
        dataKind ??= getDataKindByMIMEType(request?.type) || "text";
        this.pending.push({
            type: "message",
            role: "system",
            content: [{...await getUsableData({ dataSource: request, dataKind }) }]
        });
        return this.pending[this.pending.length - 1];
    }

    //
    async sendRequest() {
        const response = await fetch(`${this.apiUrl}/responses`, {
            method: "POST",
            body: JSON.stringify({
                model: this.model,
                tools: this.tools?.filter?.((tool)=> !!tool),
                input: [...this.pending]?.filter?.((item)=> !!item),
                reasoning: {"effort": "medium"},
                previous_response_id: this.responseId,
                instructions: GLOBAL_PROMPT_INSTRUCTIONS
            }),
        });

        //
        const resp = await response.json();
        this.responseId = resp?.id || this.responseId;
        this.messages.push(...(this.pending || [])); this.pending?.splice(0, this.pending.length);
        this.messages.push(...(resp?.output || []));
        return this.messages[this.messages.length - 1];
    }

    //
    getMessages() { return this.messages; }
    getPending() { return this.pending; }
}
