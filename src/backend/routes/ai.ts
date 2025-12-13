import type { FastifyInstance, FastifyRequest } from "fastify";

import { loadUserSettings, verifyUser } from "../lib/users.ts";
import { createOrchestrator } from "../../core/service/AI-ops/Orchestrator.ts";

export const registerAiRoutes = async (app: FastifyInstance) => {
    app.post("/core/ai/recognize", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; title?: string; text?: string; url?: string } }>) => {
        const { userId, userKey, title, text, url, ...rest } = (request.body as any) || {};
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
            model: ai.customModel || ai.model
        });

        // Keep request shape flexible: allow hints/context passthrough from clients.
        const hints = rest?.hints || rest?.hint || undefined;
        const result = await orchestrator.smartRecognize(input, hints);

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
            detection: { hints: ["backend-ai"], aiProcessed: true }
        };
        return { ok: Boolean(result.ok), results: [payload] };
    });

    app.post("/core/ai/analyze", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; text?: string; url?: string } }>) => {
        const { userId, userKey, text, url, ...rest } = (request.body as any) || {};
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
            model: ai.customModel || ai.model
        });

        const mode = rest?.mode || "extract";
        const result =
            mode === "recognize"
                ? await orchestrator.recognize(input, { context: rest?.context || {} })
                : await orchestrator.extractEntitiesFromData(input);

        const payload = {
            status: (result as any)?.ok ? "done" : "failed",
            data: result,
            name: `analysis-${Date.now()}.json`,
            dataType: "json"
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
};
