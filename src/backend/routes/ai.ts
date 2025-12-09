import type { FastifyInstance, FastifyRequest } from "fastify";

import { verifyUser } from "../lib/users.ts";

export const registerAiRoutes = async (app: FastifyInstance) => {
    app.post("/core/ai/recognize", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; title?: string; text?: string; url?: string } }>) => {
        const { userId, userKey, title, text, url } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const subId = Date.now();
        const directory = "/docs/preferences/";
        const name = `pasted-${subId}.md`;
        const data = `# ${title || "Captured"}\n\n${text || url || ""}`;
        const payload = {
            status: "queued",
            data,
            path: `${directory}${name}`,
            name,
            subId,
            directory,
            dataType: "markdown",
            detection: { hints: ["backend-endpoint"], aiProcessed: false }
        };
        return { ok: true, results: [payload] };
    });

    app.post("/core/ai/analyze", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; text?: string; url?: string } }>) => {
        const { userId, userKey, text, url } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const content = text || url || "";
        const payload = {
            status: "queued",
            data: { summary: content.slice(0, 240), source: url || null },
            name: `analysis-${Date.now()}.json`,
            dataType: "json"
        };
        return { ok: true, results: [payload] };
    });

    app.post("/core/ai/timeline", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; source?: string } }>) => {
        const { userId, userKey, source } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const payload = {
            status: "queued",
            data: { timeline: source ? [source] : [] },
            name: `timeline-${Date.now()}.json`,
            dataType: "json"
        };
        return { ok: true, results: [payload] };
    });
};
