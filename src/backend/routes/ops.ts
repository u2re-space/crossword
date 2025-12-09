import type { FastifyInstance, FastifyRequest } from "fastify";

import { loadUserSettings, verifyUser } from "../lib/users.ts";
import type { WsHub } from "../websocket.ts";
import type { AppSettings } from "../../core/config/SettingsTypes.ts";

export const registerOpsRoutes = async (app: FastifyInstance, wsHub: WsHub) => {
    app.post("/core/ops/http", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; targetId?: string; url?: string; method?: string; headers?: Record<string, string>; body?: string } }>) => {
        const { userId, userKey, targetId, url: overrideUrl, method, headers, body } = request.body || {};
        let settings: AppSettings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            return { ok: false, error: (e as Error)?.message || "Invalid credentials" };
        }

        const ops = settings?.core?.ops || {};
        const httpTargets = ops.httpTargets || [];
        const target = httpTargets.find((t) => t.id === targetId);
        const resolvedUrl = overrideUrl || target?.url;
        if (!resolvedUrl) return { ok: false, error: "No URL" };

        const isHttps = resolvedUrl.startsWith("https://");
        if (!isHttps && !(ops.allowUnencrypted || target?.unencrypted)) {
            return { ok: false, error: "Unencrypted HTTP is not allowed" };
        }

        const finalHeaders = { ...(target?.headers || {}), ...(headers || {}) };
        const finalMethod = (method || target?.method || "POST").toUpperCase();

        try {
            const res = await fetch(resolvedUrl, {
                method: finalMethod,
                headers: finalHeaders,
                body: body ?? null
            });
            const text = await res.text();
            return { ok: true, status: res.status, data: text };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    });

    app.post("/core/ops/notify", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; type: string; data?: any } }>) => {
        const { userId, userKey, type, data } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        wsHub.notify(userId, type, data);
        return { ok: true };
    });
};
