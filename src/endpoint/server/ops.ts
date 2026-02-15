import type { FastifyInstance, FastifyRequest } from "fastify";

import { loadUserSettings, verifyUser } from "../../lib/users.ts";
import type { WsHub } from "./websocket.ts";
import type { AppSettings } from "@rs-com/config/SettingsTypes.js";

type HttpDispatchRequest = { url?: string; ip?: string; method?: string; headers?: Record<string, string>; body?: string; unencrypted?: boolean };
type HttpDispatchBody = {
    userId: string;
    userKey: string;
    requests?: HttpDispatchRequest[];
    addresses?: Array<string | HttpDispatchRequest>;
    urls?: string[];
    ips?: string[];
};

const normalizeDispatchRequests = (body: HttpDispatchBody): HttpDispatchRequest[] => {
    const out: HttpDispatchRequest[] = [];
    const pushEntry = (entry: string | HttpDispatchRequest | undefined | null) => {
        if (!entry) return;
        if (typeof entry === "string") {
            const trimmed = entry.trim();
            if (!trimmed) return;
            const hasProtocol = /^https?:\/\//i.test(trimmed);
            out.push(hasProtocol ? { url: trimmed } : { ip: trimmed });
            return;
        }
        const normalized: HttpDispatchRequest = {
            ...entry,
            url: entry.url?.trim() || undefined,
            ip: entry.ip?.trim() || undefined
        };
        if (normalized.url || normalized.ip) out.push(normalized);
    };

    (body.requests || []).forEach((r) => pushEntry(r));
    (body.addresses || []).forEach((a) => pushEntry(a));
    (body.urls || []).forEach((u) => pushEntry({ url: u }));
    (body.ips || []).forEach((ip) => pushEntry({ ip }));
    return out;
};

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

    app.post("/core/ops/http/dispatch", async (request: FastifyRequest<{ Body: HttpDispatchBody }>) => {
        const { userId, userKey } = request.body || {};
        const requests = normalizeDispatchRequests(request.body || {});
        console.log(requests);
        if (requests.length === 0) return { ok: false, error: "No requests" };

        let settings: AppSettings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            /*return { ok: false, error: (e as Error)?.message || "Invalid credentials" };*/
        }

        const ops = settings?.core?.ops || { allowUnencrypted: true };
        const execOne = async (entry: HttpDispatchRequest) => {
            const resolvedUrl = entry.url || (entry.ip ? `http://${entry.ip}` : undefined);
            if (!resolvedUrl) return { target: entry.ip || entry.url, ok: false, error: "No URL" };

            const isHttps = resolvedUrl.startsWith("https://");
            if (!isHttps && !(ops.allowUnencrypted || entry.unencrypted)) return { target: resolvedUrl, ok: false, error: "Unencrypted HTTP is not allowed" };

            const finalMethod = (entry.method || "POST").toUpperCase();
            console.log(resolvedUrl, finalMethod, entry.headers || {}, entry.body ?? null);
            try {
                const res = await fetch(resolvedUrl, {
                    method: finalMethod,
                    headers: entry.headers || {},
                    body: entry.body ?? null
                });
                const text = await res.text();
                return { target: resolvedUrl, ok: true, status: res.status, data: text };
            } catch (e) {
                return { target: resolvedUrl, ok: false, error: String(e) };
            }
        };

        const results = await Promise.all(requests.map(execOne));
        const failed = results.find((r) => !r.ok);
        return { ok: !failed, results };
    });

    app.post("/core/ops/ws/send", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; namespace?: string; type?: string; data?: any } }>) => {
        const { userId, userKey, namespace, type, data } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        wsHub.multicast(userId, { type: type || "dispatch", data }, namespace);
        return { ok: true };
    });

    app.post("/core/ops/notify", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; type: string; data?: any } }>) => {
        const { userId, userKey, type, data } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        wsHub.notify(userId, type, data);
        return { ok: true };
    });
};
