import type { FastifyInstance, FastifyRequest } from "fastify";

import { loadUserSettings, verifyUser } from "../lib/users.ts";
import { createOrchestrator } from "../lib/Orchestrator.ts";
import type { AiSettings,
    CustomInstruction,
    Settings } from "../lib/settings.ts";

const getActiveCustomInstruction = (settings: AiSettings): string => {
    const instructions: CustomInstruction[] = settings.customInstructions || [];
    const activeId = settings.activeInstructionId;
    if (!activeId) return "";
    const active = instructions.find(i => i.id === activeId);
    return active?.instruction || "";
};

const resolveAiProvider = (body: any, settings: Settings) => {
    const ai: AiSettings = settings.ai || { apiKey: undefined, baseUrl: undefined, model: undefined, customModel: undefined, mcp: undefined };
    const provider = body?.provider || {};
    const passthrough = body?.passthrough || body?.throughput || {};
	const providerMcp = provider?.mcp || body?.mcp || passthrough?.mcp || ai?.mcp;
    return {
        apiKey: body?.apiKey || provider?.apiKey || passthrough?.apiKey || ai.apiKey,
        baseUrl: body?.baseUrl || provider?.baseUrl || passthrough?.baseUrl || ai.baseUrl,
		model: body?.model || provider?.model || passthrough?.model || ai.customModel || ai.model,
		mcp: Array.isArray(providerMcp) ? providerMcp : undefined
    };
};

export const registerAiRoutes = async (app: FastifyInstance) => {
    app.post("/core/ai/recognize", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; title?: string; text?: string; url?: string; customInstruction?: string } }>) => {
        const { userId, userKey, title, text, url, customInstruction, ...rest } = (request.body as any) || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const input = (text || url || "").toString();
        if (!input.trim()) return { ok: false, error: "Missing text/url" };

        const settings = await loadUserSettings(userId, userKey).catch(() => null);
        const ai = settings?.ai || {};
        if (!ai?.apiKey) return { ok: false, error: "Missing AI apiKey in settings" };

        const orchestrator = createOrchestrator({
            apiKey: ai.apiKey,
            baseUrl: ai.baseUrl,
            model: ai.customModel || ai.model,
            mcp: ai?.mcp
        });

        // Keep request shape flexible: allow hints/context passthrough from clients.
        const hints = rest?.hints || rest?.hint || undefined;

        // Support custom instructions: use provided or fall back to active from settings
        const effectiveInstruction = customInstruction || getActiveCustomInstruction(settings);
        const recognizeOptions = effectiveInstruction ? { customInstruction: effectiveInstruction } : undefined;

        const result = await orchestrator.smartRecognize(input, hints, recognizeOptions);

        // Preserve legacy "results" array shape, but mark as done and include the real AI output.
        const subId = Date.now();
        const directory = "/docs/preferences/";
        const name = `recognized-${subId}.json`;
        const payload = {
            status: result.ok ? "done" : "failed",
            data: result,
            path: `${directory}${name}`,
            name,
            subId,
            directory,
            dataType: "json",
            title: title || undefined,
            detection: { hints: ["backend-ai"], aiProcessed: true, customInstruction: Boolean(effectiveInstruction) }
        };
        return { ok: Boolean(result.ok), results: [payload] };
    });

    app.post("/core/ai/analyze", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; text?: string; url?: string; customInstruction?: string } }>) => {
        const { userId, userKey, text, url, customInstruction, ...rest } = (request.body as any) || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const input = (text || url || "").toString();
        if (!input.trim()) return { ok: false, error: "Missing text/url" };

        const settings = await loadUserSettings(userId, userKey).catch(() => null);
        const ai = settings?.ai || {};
        if (!ai?.apiKey) return { ok: false, error: "Missing AI apiKey in settings" };

        const orchestrator = createOrchestrator({
            apiKey: ai.apiKey,
            baseUrl: ai.baseUrl,
            model: ai.customModel || ai.model,
            mcp: ai?.mcp
        });

        // Support custom instructions
        const effectiveInstruction = customInstruction || getActiveCustomInstruction(settings);
        const recognizeOptions = effectiveInstruction ? { customInstruction: effectiveInstruction } : undefined;

        const mode = rest?.mode || "extract";
        const result =
            mode === "recognize"
                ? await orchestrator.recognize(input, { context: rest?.context || {}, ...recognizeOptions })
                : await orchestrator.extractEntitiesFromData(input, recognizeOptions);

        const payload = {
            status: (result as any)?.ok ? "done" : "failed",
            data: result,
            name: `analysis-${Date.now()}.json`,
            dataType: "json",
            customInstruction: Boolean(effectiveInstruction)
        };
        return { ok: Boolean((result as any)?.ok), results: [payload] };
    });

    app.post("/core/ai/timeline", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; source?: string } }>) => {
        const { userId, userKey, source } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        return {
            ok: false,
            error: "Timeline generation is not backend-enabled yet (depends on browser/OPFS workers in current core implementation).",
            source: source || null
        };
    });

    app.post("/api/processing", async (request: FastifyRequest<{ Body: any }>) => {
        const body = (request.body || {}) as any;
        const { userId, userKey } = body;
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const settings = await loadUserSettings(userId, userKey).catch(() => null);
        const input = (body.input || body.text || body.url || "").toString();
        if (!input.trim()) return { ok: false, error: "Missing input (text/url/input)" };

        const provider = resolveAiProvider(body, settings);
        if (!provider.apiKey) {
            return {
                ok: false,
                error: "Missing AI apiKey (send apiKey/provider.apiKey or set settings.ai.apiKey)"
            };
        }

        const orchestrator = createOrchestrator({
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            model: provider.model,
            mcp: provider?.mcp
        });

        const effectiveInstruction = body.customInstruction || getActiveCustomInstruction(settings);
        const recognizeOptions = effectiveInstruction ? { customInstruction: effectiveInstruction } : undefined;
        const mode = (body.mode || body.action || "smartRecognize").toString().trim();

        if (mode === "timeline") {
            return {
                ok: false,
                error: "Timeline generation is not backend-enabled yet (depends on browser/OPFS workers in current core implementation)."
            };
        }

        const result =
            mode === "recognize"
                ? await orchestrator.recognize(input, { context: body.context || {}, ...recognizeOptions })
                : mode === "analyze" || mode === "extract"
                    ? await orchestrator.extractEntitiesFromData(input, recognizeOptions)
                    : await orchestrator.smartRecognize(input, body.hints || body.hint, recognizeOptions);

        return {
            ok: Boolean((result as any)?.ok ?? true),
            mode,
            customInstruction: Boolean(effectiveInstruction),
            provider: {
                baseUrl: provider.baseUrl || null,
                model: provider.model || null,
                apiKeySource: body.apiKey || body.provider?.apiKey || body.passthrough?.apiKey
                    ? "request"
                    : "settings"
            },
            result
        };
    });
};
