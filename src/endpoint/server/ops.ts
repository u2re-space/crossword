import type { FastifyInstance, FastifyRequest } from "fastify";

import { loadUserSettings, verifyUser } from "../lib/users.ts";
import type { WsHub } from "./websocket.ts";
import type { AppSettings } from "@rs-com/config/SettingsTypes.js";
import {
    executeActions,
    executeCopyHotkey,
    executeCutHotkey,
    executePasteHotkey
} from "./actions.ts";
import { readClipboard, writeClipboard } from "./clipboard.ts";

type HttpDispatchRequest = { url?: string; ip?: string; method?: string; headers?: Record<string, string>; body?: string; unencrypted?: boolean };
type HttpDispatchBody = {
    userId: string;
    userKey: string;
    requests?: HttpDispatchRequest[];
    addresses?: Array<string | HttpDispatchRequest>;
    urls?: string[];
    ips?: string[];
};
type HttpRequestBody = {
    userId: string;
    userKey: string;
    targetId?: string;
    url?: string;
    ip?: string;
    address?: string;
    host?: string;
    protocol?: "http" | "https";
    secure?: boolean;
    https?: boolean;
    port?: number;
    path?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    unencrypted?: boolean;
    type?: string;
    data?: any;
    namespace?: string;
};
type WsSendBody = { userId: string; userKey: string; namespace?: string; type?: string; data?: any };
type ActionBody = {
    userId: string;
    userKey: string;
    type?: string;
    action?: string;
    data?: any;
    text?: string;
    actions?: any[];
    namespace?: string;
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

const toTargetUrl = (
    body: HttpRequestBody,
    targetUrlFromSettings?: string,
    forceHttps = false
): string | undefined => {
    const explicitUrl = body.url?.trim();
    if (explicitUrl) {
        if (forceHttps && explicitUrl.startsWith("http://")) {
            return `https://${explicitUrl.slice("http://".length)}`;
        }
        return explicitUrl;
    }

    if (targetUrlFromSettings) {
        if (forceHttps && targetUrlFromSettings.startsWith("http://")) {
            return `https://${targetUrlFromSettings.slice("http://".length)}`;
        }
        return targetUrlFromSettings;
    }

    const host = body.ip?.trim() || body.address?.trim() || body.host?.trim();
    if (!host) return undefined;
    if (/^https?:\/\//i.test(host)) {
        return forceHttps && host.startsWith("http://")
            ? `https://${host.slice("http://".length)}`
            : host;
    }

    const protocol = forceHttps || body.https || body.secure
        ? "https"
        : (body.protocol || (body.unencrypted ? "http" : "http"));
    const port = Number.isFinite(body.port as number) ? `:${body.port}` : "";
    const nextPath = (body.path || "").trim();
    const normalizedPath = nextPath ? (nextPath.startsWith("/") ? nextPath : `/${nextPath}`) : "";
    return `${protocol}://${host}${port}${normalizedPath}`;
};

export const registerOpsRoutes = async (app: FastifyInstance, wsHub: WsHub) => {
    const requestHandler = async (request: FastifyRequest<{ Body: HttpRequestBody }>) => {
        const payload = (request.body || {}) as HttpRequestBody;
        const { userId, userKey, targetId, method, headers, body } = payload;
        const forceHttpsRoute = (request.url || "").startsWith("/core/ops/https") || payload.https === true || payload.secure === true;
        let settings: AppSettings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            return { ok: false, error: (e as Error)?.message || "Invalid credentials" };
        }

        const ops = settings?.core?.ops || {};
        const httpTargets = ops.httpTargets || [];
        const target = httpTargets.find((t) => t.id === targetId);
        const resolvedUrl = toTargetUrl(payload, target?.url, forceHttpsRoute);

        // Partial legacy notify compatibility: accept notify-like payloads via /api/request.
        if (!resolvedUrl && payload.type) {
            wsHub.notify(userId, String(payload.type), payload.data ?? payload);
            return { ok: true, delivered: "ws-notify", mode: "request-notify-fallback" };
        }
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
    };

    const broadcastHandler = async (request: FastifyRequest<{ Body: HttpDispatchBody }>) => {
        const body = (request.body || {}) as HttpDispatchBody;
        const { userId, userKey } = body;
        const requests = normalizeDispatchRequests(body);
        // console.log(requests); // Disabled to prevent logging JSON/payload content
        if (requests.length === 0) {
            const notifyType = (request.body as any)?.type;
            if (notifyType) {
                wsHub.multicast(userId, { type: String(notifyType), data: (request.body as any)?.data ?? request.body }, (request.body as any)?.namespace);
                return { ok: true, delivered: "ws-multicast", mode: "broadcast-notify-fallback" };
            }
            return { ok: false, error: "No requests" };
        }

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
            console.log(resolvedUrl, finalMethod, entry.headers || {}, '<body hidden>');
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
    };

    const wsSendHandler = async (request: FastifyRequest<{ Body: WsSendBody }>) => {
        const { userId, userKey, namespace, type, data } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        wsHub.multicast(userId, { type: type || "dispatch", data }, namespace);
        return { ok: true };
    };

    const notifyHandler = async (request: FastifyRequest<{ Body: { userId: string; userKey: string; type: string; data?: any } }>) => {
        const { userId, userKey, type, data } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        wsHub.notify(userId, type, data);
        return { ok: true };
    };

    const actionHandler = async (request: FastifyRequest<{ Body: ActionBody }>) => {
        const { userId, userKey, action, type, data, text } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const requestedAction = (action || type || "").toString().trim().toLowerCase();
        const actionsBatch = Array.isArray(request.body?.actions)
            ? request.body!.actions
            : (Array.isArray(data?.actions) ? data.actions : null);

        if (actionsBatch && actionsBatch.length > 0) {
            await executeActions(actionsBatch, app);
            return { ok: true, action: "actions", count: actionsBatch.length };
        }

        if (requestedAction === "clipboard" || requestedAction === "clipboard.write" || requestedAction === "clipboard:set" || requestedAction === "clipboard/paste") {
            const nextText = typeof text === "string" ? text : (typeof data?.text === "string" ? data.text : "");
            if (!nextText) return { ok: false, error: "Missing clipboard text" };
            await writeClipboard(nextText);
            return { ok: true, action: "clipboard.write" };
        }

        if (requestedAction === "clipboard.read" || requestedAction === "clipboard:get") {
            const current = await readClipboard();
            return { ok: true, action: "clipboard.read", text: current };
        }

        if (requestedAction === "copy" || requestedAction === "clipboard.copy") {
            executeCopyHotkey();
            return { ok: true, action: "copy" };
        }

        if (requestedAction === "cut" || requestedAction === "clipboard.cut") {
            executeCutHotkey();
            return { ok: true, action: "cut" };
        }

        if (requestedAction === "paste" || requestedAction === "clipboard.paste") {
            const nextText = typeof text === "string" ? text : (typeof data?.text === "string" ? data.text : "");
            if (nextText) await writeClipboard(nextText);
            executePasteHotkey();
            return { ok: true, action: "paste" };
        }

        // Fallback action transport: use websocket notifications for legacy notify-like behavior.
        const notifyType = (type || action || "action").toString();
        wsHub.notify(userId, notifyType, data ?? request.body);
        return { ok: true, action: notifyType, delivered: "ws-notify" };
    };

    // Legacy and new aliases:
    // - /api/request: targeted request delivery (legacy /core/ops/http)
    //   plus legacy secure variant (/core/ops/https) and partial notify fallback
    // - /api/broadcast: multi-peer dispatch (legacy /core/ops/http/dispatch and /core/ops/http/disp)
    //   plus partial notify multicast fallback
    // - /api/ws: ws send operation (legacy /core/ops/ws/send)
    // - /api/action: host/device action endpoint (legacy /clipboard, /sms, partial notify)
    app.post("/core/ops/http", requestHandler);
    app.post("/core/ops/https", requestHandler);
    app.post("/api/request", requestHandler);

    app.post("/core/ops/http/dispatch", broadcastHandler);
    app.post("/core/ops/http/disp", broadcastHandler);
    app.post("/api/broadcast", broadcastHandler);

    app.post("/core/ops/ws/send", wsSendHandler);
    app.post("/api/ws", wsSendHandler);

    app.post("/core/ops/notify", notifyHandler);
    app.post("/api/action", actionHandler);
};
