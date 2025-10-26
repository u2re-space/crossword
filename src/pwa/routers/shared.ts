
import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { resolveEntity } from "@rs-core/service/AI-ops/EntityItemResolve";

//
import { analyzeRecognizeUnified } from "@rs-core/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-core/config/Settings";
import { getOrDefaultComputedOfDataSourceCache } from "../lib/DataSourceCache";

//
export const controlChannel = new BroadcastChannel('rs-sw');

//
export const DOC_DIR = "/docs/preferences/";
export const PLAIN_DIR = "/docs/plain/";

//
export const initiateAnalyzeAndRecognizeData = async (dataSource: string | Blob | File | any) => {
    return analyzeRecognizeUnified(dataSource, (response) => {
        console.log(response);
    });
}

//
export const initiateConversionProcedure = async (dataSource: string | Blob | File | any) => {
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return { entities: [] };

    //
    const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5-mini");

    // phase 1 - prepare data
    // upload dataset to GPT for recognize, and get response for analyze... and load into context
    gptResponses.beginFromResponseId(await getOrDefaultComputedOfDataSourceCache(dataSource, async (dataSource: string | Blob | File | any) => {
        await gptResponses?.attachToRequest?.(dataSource)?.catch?.(console.warn.bind(console));
        await gptResponses?.sendRequest("high", "high")?.catch?.(console.warn.bind(console));
        return gptResponses.getResponseId() || "";
    }));

    //
    // Support multiple MCP configurations
    if (settings?.ai?.mcp && Array.isArray(settings.ai.mcp)) {
        for (const mcpConfig of settings.ai.mcp) {
            if (mcpConfig.serverLabel && mcpConfig.origin && mcpConfig.clientKey && mcpConfig.secretKey) {
                await gptResponses.useMCP(mcpConfig.serverLabel, mcpConfig.origin, mcpConfig.clientKey, mcpConfig.secretKey)?.catch?.(console.warn.bind(console));
            }
        }
    }

    // phase 2 - convert data to target format, make final description
    const resultsRaw = (await resolveEntity(gptResponses)?.catch?.(console.warn.bind(console))) || [];
    const results = Array.isArray(resultsRaw) ? resultsRaw : [resultsRaw];
    return { entities: results?.flatMap?.((result) => (result?.entities || [])) };
}

//
export const isMarkdown = (text: string, source: string | File | Blob) => {
    if (source instanceof File && source?.name?.endsWith?.(".md")) return true;
    if (source instanceof File || source instanceof Blob) if (source?.type?.includes?.("markdown")) return true;
    if (text?.startsWith?.("---") && text?.endsWith?.("---")) return true;
    return false;
}

//
export const _LOG = (a) => {
    console.log(a);
    return a;
}
