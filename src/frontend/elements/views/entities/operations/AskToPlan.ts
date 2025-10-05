import { loadSettings } from "@rs-core/config/Settings";
import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { startTracking } from "@rs-core/workers/GeoLocation";
import { toastError, toastSuccess } from "@rs-frontend/elements/overlays/Toast";

//
const loadPlanSource = async (): Promise<string | null> => {
    try {
        const stored = await loadSettings();
        return stored?.timeline?.source || null;
    } catch (e) {
        console.warn(e);
        return null;
    }
};

//
export const onMagicPlan = async () => {
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return;

    const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5-mini");
    if (settings?.ai?.mcp?.serverLabel && settings.ai.mcp.origin && settings.ai.mcp.clientKey && settings.ai.mcp.secretKey) {
        await gptResponses.useMCP(settings.ai.mcp.serverLabel, settings.ai.mcp.origin, settings.ai.mcp.clientKey, settings.ai.mcp.secretKey)?.catch?.(console.warn.bind(console));
    }

    await startTracking?.()?.catch?.(console.warn.bind(console));

    try {
        const source = await loadPlanSource();
        toastSuccess(source ? `Using ${source} for magic plan...` : [
            "Using default preferences for plan...",
        ]?.join?.("\n"));

        //
        const timelineForm = new FormData();
        if (source) { timelineForm.append("source", source); };

        //
        const response = await fetch("/make-timeline", {
            method: "POST",
            body: timelineForm,
        })?.catch?.(console.warn.bind(console));
    } catch (e) {
        console.warn(e);
        toastError("Failed to create plan");
    }
};
