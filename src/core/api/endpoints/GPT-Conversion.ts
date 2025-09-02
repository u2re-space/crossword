import { DataInput, DataKind, getDataKindByMIMEType, typesForKind } from "./GPT-Config";

//
export const getUsableData = async (data: DataInput) => {
    if (data?.dataSource instanceof Blob || data?.dataSource instanceof File) {
        if (data?.dataKind === "image") {
            const BASE64URL = `data:${data?.dataSource?.type};base64,`; // @ts-ignore
            return BASE64URL+(new Uint8Array(await data?.dataSource?.arrayBuffer())?.toBase64?.({ alphabet: "base64url" }));
        } else {
            // anyways returns Promise<string>
            return data?.dataSource?.text();
        }
    }

    // is not Blob or File, so it's (may be) string (if not string, try to parse it as JSON)
    let result = data?.dataSource;
    try { result = (typeof data?.dataSource != "object") ? data?.dataSource : JSON.stringify(data?.dataSource); } catch (e) { console.warn(e); }
    return result;
}

//
export class GPTConversion {
    private apiKey: string;
    private apiSecret: string;

    //
    private apiUrl: string = "https://openai.api.proxyapi.ru/v1";//"https://api.openai.com/v1";
    private model: string = "gpt-5";

    //
    protected pending: any[] = [];
    protected messages: any[] = [];
    protected tools: any[] = [];

    //
    constructor() {
        this.apiKey = process.env.GPT_API_KEY || "";
        this.apiSecret = process.env.GPT_API_SECRET || "";
        this.apiUrl = process.env.GPT_API_URL || "";
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
    }

    //
    async convertPlainToInput(request: (string|Blob|File|any), dataKind: DataKind|null = null): Promise<any> {
        dataKind ??= getDataKindByMIMEType(request?.type) || "text";
        return { role: "user", type: typesForKind[dataKind], content: await getUsableData({ dataSource: request, dataKind }) };
    }

    //
    async addToRequest(request: (string|Blob|File|any), dataKind: DataKind|null = null) {
        this.pending.push(await this.convertPlainToInput(request, dataKind ??= getDataKindByMIMEType(request?.type) || "text"));
    }

    //
    async addInstruction(instruction: string) {
        this.messages.push({ role: "system", content: instruction });
    }

    //
    async sendRequest() {
        const response = await fetch(`${this.apiUrl}/responses`, {
            method: "POST",
            body: JSON.stringify({
                model: this.model,
                tools: this.tools,
                input: [...this.messages, ...this.pending],
                reasoning: "medium",
                temperature: 0.5,
                response_format: { type: "text" }
            }),
        });

        //
        this.messages.push(...this.pending); this.pending?.splice(0, this.pending.length);
        this.messages.push(...((await response.json())?.output || []));
        return this.messages[this.messages.length - 1];
    }

    //
    getMessages() {
        return this.messages;
    }

    //
    getPending() {
        return this.pending;
    }
}
