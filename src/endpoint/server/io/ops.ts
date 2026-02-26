import type { FastifyInstance, FastifyRequest } from "fastify";

import { loadUserSettings, verifyUser } from "../lib/users.ts";
import type { WsHub } from "./websocket.ts";
import {
    executeActions,
    executeCopyHotkey,
    executeCutHotkey,
    executePasteHotkey
} from "./actions.ts";
import { readClipboard, writeClipboard } from "./clipboard.ts";
import { Settings } from "@rs-server/lib/settings.ts";
import config from "../config/config.ts";

type HttpDispatchRequest = {
    url?: string;
    ip?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    unencrypted?: boolean;
    deviceId?: string;
    targetId?: string;
    type?: string;
    data?: any;
    broadcastForceHttps?: boolean;
};
type HttpDispatchBody = {
    userId: string;
    userKey: string;
    targetDeviceId?: string;
    requests?: HttpDispatchRequest[];
    addresses?: Array<string | HttpDispatchRequest>;
    urls?: string[];
    ips?: string[];
};
type HttpRequestBody = {
    userId: string;
    userKey: string;
    targetId?: string;
    targetDeviceId?: string;
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
    broadcastForceHttps?: boolean;
};
type DeviceFeatureRequestBody = HttpRequestBody & {
    text?: string;
    limit?: number;
};
type WsSendBody = { userId: string; userKey: string; namespace?: string; type?: string; data?: any };
type ReverseSendBody = {
    userId: string;
    userKey: string;
    deviceId: string;
    type?: string;
    data?: any;
    action?: string;
};
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

type UpstreamTopologyStatus = {
    running: boolean;
    connected: boolean;
    upstreamEnabled: boolean;
    endpointUrl?: string;
    userId?: string;
    deviceId?: string;
    namespace?: string;
};

type NetworkContextProvider = {
    getUpstreamStatus?: () => UpstreamTopologyStatus | null;
    sendToUpstream?: (payload: any) => boolean;
    getNodeId?: () => string | null;
};

type NetworkDispatchBody = {
    userId: string;
    userKey: string;
    route?: "local" | "upstream" | "both";
    target?: string;
    targetId?: string;
    deviceId?: string;
    peerId?: string;
    namespace?: string;
    ns?: string;
    type?: string;
    action?: string;
    data?: any;
    payload?: any;
    broadcast?: boolean;
};

const BROADCAST_HTTPS_PORTS = new Set(["443", "8443"]);
const BROADCAST_PROTO_RE = /^https?:\/\//i;

const hasProtocol = (value: string): boolean => BROADCAST_PROTO_RE.test(value);

const looksLikeAliasedHostTarget = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (/^\[[^\]]+\](?::\d{1,5})?$/.test(trimmed)) return true;
    if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?$/.test(trimmed)) return true;
    if (/^[a-zA-Z0-9._-]+(?::\d{1,5})?$/.test(trimmed)) return true;
    return false;
};

const stripAliasPrefix = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9_-]*):(.*)$/);
    if (!match) return trimmed;

    const aliasTarget = match[2].trim();
    return looksLikeAliasedHostTarget(aliasTarget) ? aliasTarget : trimmed;
};

const normalizeBroadcastTarget = (target: string): { normalized: string; hasExplicitProtocol: boolean } | undefined => {
    const trimmed = target.trim();
    if (!trimmed) return undefined;

    const protocolMatch = trimmed.match(BROADCAST_PROTO_RE);
    if (!protocolMatch) {
        const normalized = stripAliasPrefix(trimmed);
        return { normalized: `http://${normalized}`, hasExplicitProtocol: false };
    }

    const protocol = protocolMatch[0].toLowerCase();
    if (protocol !== "http://" && protocol !== "https://") {
        return { normalized: trimmed, hasExplicitProtocol: false };
    }

    const rawTarget = trimmed.slice(protocol.length);
    const splitIndex = rawTarget.search(/[/?#]/);
    const hostWithPort = splitIndex === -1 ? rawTarget : rawTarget.slice(0, splitIndex);
    const suffix = splitIndex === -1 ? "" : rawTarget.slice(splitIndex);
    const normalizedHostWithPort = stripAliasPrefix(hostWithPort);
    return {
        normalized: `${protocol}${normalizedHostWithPort}${suffix}`,
        hasExplicitProtocol: true
    };
};

const parseBroadcastTarget = (target: string): { url: URL; hasExplicitProtocol: boolean; normalized: string } | undefined => {
    const normalized = normalizeBroadcastTarget(target);
    if (!normalized) return undefined;
    try {
        return {
            url: new URL(normalized.normalized),
            hasExplicitProtocol: normalized.hasExplicitProtocol,
            normalized: normalized.normalized
        };
    } catch {
        return undefined;
    }
};

const resolveBroadcastProtocol = (source: string, opts: {
    allowUnencrypted?: boolean;
    forceHttps?: boolean;
}): { protocol: "http" | "https"; sourceWithoutProtocol: string } | undefined => {
    const trimmed = source.trim();
    if (!trimmed) return undefined;

    const parsed = parseBroadcastTarget(trimmed);
    if (!parsed) return undefined;
    const { url: parsedUrl, hasExplicitProtocol, normalized } = parsed;
    const isLikelySecurePort = BROADCAST_HTTPS_PORTS.has(parsedUrl.port);
    const hasForceHttps = opts.forceHttps && isLikelySecurePort;
    const denyUnencrypted = opts.allowUnencrypted === false && isLikelySecurePort;
    const forcedProtocol = hasForceHttps || denyUnencrypted ? "https" : undefined;
    const sourceWithoutProtocol = hasExplicitProtocol
        ? normalized.replace(BROADCAST_PROTO_RE, "")
        : `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    if (hasExplicitProtocol) {
        return {
            protocol: forcedProtocol || (trimmed.toLowerCase().startsWith("https://") ? "https" : "http"),
            sourceWithoutProtocol
        };
    }

    return {
        protocol: (hasForceHttps || denyUnencrypted) ? "https" : "http",
        sourceWithoutProtocol
    };
};

const resolveBroadcastUrl = (
    entry: HttpDispatchRequest,
    allowUnencrypted: boolean,
    broadcastForceHttps: boolean
): string | undefined => {
    const source = entry.url?.trim() || entry.ip?.trim();
    if (!source) return undefined;

    const explicitForceHttps = typeof entry.broadcastForceHttps === "boolean"
        ? entry.broadcastForceHttps
        : broadcastForceHttps;
    const resolved = resolveBroadcastProtocol(
        source,
        {
            allowUnencrypted,
            forceHttps: explicitForceHttps
        }
    );
    if (!resolved) return undefined;
    return `${resolved.protocol}://${resolved.sourceWithoutProtocol}`;
};

const normalizeDispatchRequests = (body: HttpDispatchBody): HttpDispatchRequest[] => {
    const out: HttpDispatchRequest[] = [];
    const pushEntry = (entry: string | HttpDispatchRequest | undefined | null) => {
        if (!entry) return;
        if (typeof entry === "string") {
            const trimmed = entry.trim();
            if (!trimmed) return;
            const hasProtocolInValue = BROADCAST_PROTO_RE.test(trimmed);
            out.push(hasProtocolInValue ? { url: trimmed } : { ip: trimmed });
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

const readFeatureLimit = (body: DeviceFeatureRequestBody): number => {
    const rawLimit = Number((body as any).limit);
    const limit = Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : 50;
    return Math.max(1, Math.min(200, limit));
};

const readTextPayload = (body: DeviceFeatureRequestBody): string => {
    const textFromBody = (body as any).text;
    if (textFromBody == null) return "";
    if (typeof textFromBody === "string") return textFromBody.trim();
    return String(textFromBody).trim();
};

const resolveFeatureTarget = (body: DeviceFeatureRequestBody) => (
    body.targetDeviceId?.trim() || body.targetId?.trim() || body.deviceId?.trim()
);

const withFeatureUrl = (baseUrl: string, featurePath: string, query: Record<string, string | number | undefined>) => {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
    const cleanPath = featurePath.startsWith("/") ? featurePath : `/${featurePath}`;
    const queryItems = Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    const urlWithPath = `${normalizedBase}${cleanPath}`;
    if (queryItems.length === 0) return urlWithPath;
    const joiner = urlWithPath.includes("?") ? "&" : "?";
    return `${urlWithPath}${joiner}${queryItems.join("&")}`;
};

const reverseDispatchPayload = (feature: string, payload: any) => ({
    type: "feature",
    data: {
        feature,
        payload
    }
});

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

export const registerOpsRoutes = async (app: FastifyInstance, wsHub: WsHub, networkContext?: NetworkContextProvider) => {
    const requestHandler = async (request: FastifyRequest<{ Body: HttpRequestBody }>) => {
        const payload = (request.body || {}) as HttpRequestBody;
        const { userId, userKey, targetId, targetDeviceId, method, headers, body } = payload;
        const forceHttpsRoute = (request.url || "").startsWith("/core/ops/https") || payload.https === true || payload.secure === true;
        let settings: Settings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            return { ok: false, error: (e as Error)?.message || "Invalid credentials" };
        }

        const ops = settings?.core?.ops || {};
        const httpTargets = ops.httpTargets || [];
        const target = httpTargets.find((t) => t.id === targetId);
        const resolvedUrl = toTargetUrl(payload, target?.url, forceHttpsRoute);

        const reverseTarget = targetDeviceId || (payload as any).deviceId || targetId;
        if (!resolvedUrl && reverseTarget && typeof reverseTarget === "string" && reverseTarget.trim()) {
            const delivered = wsHub.sendToDevice(userId, reverseTarget, {
                type: (payload as any).type || "dispatch",
                data: (payload as any).data ?? payload,
            });
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                mode: "request-fallback-reverse",
                targetDeviceId: reverseTarget
            };
        }

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
        const { userId, userKey, targetDeviceId } = body;
        const defaultDeviceId = targetDeviceId && targetDeviceId.trim() ? targetDeviceId.trim() : undefined;
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

        let settings: Settings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            /*return { ok: false, error: (e as Error)?.message || "Invalid credentials" };*/
        }

        const ops = settings?.core?.ops || {};
        const allowUnencrypted = ops.allowUnencrypted !== false;
        const configBroadcastForceHttps = Boolean(
            (config as any)?.broadcastForceHttps
            || (config as any)?.ops?.broadcastForceHttps
            || (config as any)?.core?.ops?.broadcastForceHttps
        );
        const requestBroadcastForceHttps = typeof body.broadcastForceHttps === "boolean" ? body.broadcastForceHttps : undefined;
        const forceBroadcastHttps = requestBroadcastForceHttps ?? (Boolean(ops.broadcastForceHttps) || configBroadcastForceHttps);
        const execOne = async (entry: HttpDispatchRequest) => {
            const reverseDeviceId = (entry as any).deviceId || (entry as any).targetId || defaultDeviceId;
            if (typeof reverseDeviceId === "string" && reverseDeviceId.trim()) {
                const delivered = wsHub.sendToDevice(userId, reverseDeviceId.trim(), {
                    type: (entry as any).type || "dispatch",
                    data: (entry as any).data ?? (entry as any).body
                });
                return {
                    target: reverseDeviceId,
                    ok: !!delivered,
                    delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                    mode: "reverse"
                };
            }

            const resolvedUrl = resolveBroadcastUrl(entry, allowUnencrypted, forceBroadcastHttps);
            if (!resolvedUrl) return { target: entry.ip || entry.url, ok: false, error: "No URL" };

            const isHttps = resolvedUrl.startsWith("https://");
            if (!isHttps && !(allowUnencrypted || entry.unencrypted)) return { target: resolvedUrl, ok: false, error: "Unencrypted HTTP is not allowed" };

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

    const reverseSendHandler = async (request: FastifyRequest<{ Body: ReverseSendBody }>) => {
        const { userId, userKey, deviceId, type, data, action } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        if (!deviceId?.trim()) return { ok: false, error: "Missing deviceId" };

        const delivered = wsHub.sendToDevice(userId, deviceId, {
            type: type || action || "dispatch",
            data,
        });
        return { ok: !!delivered, delivered: delivered ? "ws-reverse" : "ws-reverse-missing", deviceId };
    };

    const notifyHandler = async (request: FastifyRequest<{ Body: { userId: string; userKey: string; type: string; data?: any } }>) => {
        const { userId, userKey, type, data } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        wsHub.notify(userId, type, data);
        return { ok: true };
    };

    const featureDevicesHandler = async (request: FastifyRequest<{ Body: { userId: string; userKey: string } }>) => {
        const { userId, userKey } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        let settings: Settings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            settings = {} as Settings;
        }
        const ops = settings?.core?.ops || {};
        const configuredTargets = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets
                .map((target: any) => String(target?.id || target?.name || "").trim())
                .filter(Boolean)
            : [];

        const reverseDevices = wsHub.getConnectedDevices(userId);
        const reverseDeviceProfiles = wsHub.getConnectedPeerProfiles(userId).map((peer) => ({ id: peer.id, label: peer.label }));
        return {
            ok: true,
            reverseDevices,
            reverseDeviceProfiles,
            configuredTargets,
            features: ["/sms", "/notifications", "/notifications/speak"]
        };
    };

    const smsFeatureHandler = async (request: FastifyRequest<{ Body: DeviceFeatureRequestBody }>) => {
        const body = (request.body || {}) as DeviceFeatureRequestBody;
        const { userId, userKey, headers, targetId } = body;
        const limit = readFeatureLimit(body);

        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const settings = await loadUserSettings(userId, userKey);
        const ops = settings?.core?.ops || {};
        const target = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets.find((entry: any) => entry?.id === targetId)
            : undefined;
        const resolvedBase = toTargetUrl(body, target?.url, false);
        const reverseDeviceId = resolveFeatureTarget(body);

        if (!resolvedBase && reverseDeviceId) {
            const delivered = wsHub.sendToDevice(userId, reverseDeviceId, reverseDispatchPayload("sms", { method: "GET", limit }));
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                targetDeviceId: reverseDeviceId,
                mode: "reverse",
                feature: "sms",
                limit
            };
        }

        if (!resolvedBase) return { ok: false, error: "No URL" };
        const finalHeaders = { ...(target?.headers || {}), ...(headers || {}) };
        try {
            const targetUrl = withFeatureUrl(resolvedBase, "/sms", {
                limit
            });
            const res = await fetch(targetUrl, {
                method: "GET",
                headers: finalHeaders
            });
            const text = await res.text();
            return { ok: true, status: res.status, data: text };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    };

    const notificationsFeatureHandler = async (request: FastifyRequest<{ Body: DeviceFeatureRequestBody }>) => {
        const body = (request.body || {}) as DeviceFeatureRequestBody;
        const { userId, userKey, headers, targetId } = body;
        const limit = readFeatureLimit(body);

        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const settings = await loadUserSettings(userId, userKey);
        const ops = settings?.core?.ops || {};
        const target = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets.find((entry: any) => entry?.id === targetId)
            : undefined;
        const resolvedBase = toTargetUrl(body, target?.url, false);
        const reverseDeviceId = resolveFeatureTarget(body);

        if (!resolvedBase && reverseDeviceId) {
            const delivered = wsHub.sendToDevice(userId, reverseDeviceId, reverseDispatchPayload("notifications", { method: "GET", limit }));
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                targetDeviceId: reverseDeviceId,
                mode: "reverse",
                feature: "notifications",
                limit
            };
        }

        if (!resolvedBase) return { ok: false, error: "No URL" };
        const finalHeaders = { ...(target?.headers || {}), ...(headers || {}) };
        try {
            const targetUrl = withFeatureUrl(resolvedBase, "/notifications", {
                limit
            });
            const res = await fetch(targetUrl, {
                method: "GET",
                headers: finalHeaders
            });
            const text = await res.text();
            return { ok: true, status: res.status, data: text };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    };

    const notificationsSpeakHandler = async (request: FastifyRequest<{ Body: DeviceFeatureRequestBody }>) => {
        const body = (request.body || {}) as DeviceFeatureRequestBody;
        const { userId, userKey, headers, targetId, text } = body;
        const message = readTextPayload(body);

        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        if (!message) return { ok: false, error: "Missing text" };

        const settings = await loadUserSettings(userId, userKey);
        const ops = settings?.core?.ops || {};
        const target = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets.find((entry: any) => entry?.id === targetId)
            : undefined;
        const resolvedBase = toTargetUrl(body, target?.url, false);
        const reverseDeviceId = resolveFeatureTarget(body);

        if (!resolvedBase && reverseDeviceId) {
            const delivered = wsHub.sendToDevice(userId, reverseDeviceId, reverseDispatchPayload("notifications.speak", { text: message }));
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                targetDeviceId: reverseDeviceId,
                mode: "reverse",
                feature: "notifications.speak"
            };
        }

        if (!resolvedBase) return { ok: false, error: "No URL" };
        const finalHeaders = { ...(target?.headers || {}), ...(headers || {}), "Content-Type": "text/plain; charset=utf-8" };
        try {
            const targetUrl = withFeatureUrl(resolvedBase, "/notifications/speak", {});
            const res = await fetch(targetUrl, {
                method: "POST",
                headers: finalHeaders,
                body: text?.toString() || message
            });
            const responseText = await res.text();
            return { ok: true, status: res.status, data: responseText };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    };

    const reverseDevicesHandler = async (request: FastifyRequest<{ Body: { userId: string; userKey: string } }>) => {
        const { userId, userKey } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const profiles = wsHub.getConnectedPeerProfiles(userId);
        return {
            ok: true,
            devices: profiles.map((peer) => peer.id),
            deviceProfiles: profiles.map((peer) => ({ id: peer.id, label: peer.label }))
        };
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

    const rootCompatHandler = async (request: FastifyRequest<{ Body: any }>) => {
        const payload = (request.body || {}) as Record<string, unknown>;
        const isBroadcastLike =
            Array.isArray(payload.requests) ||
            Array.isArray(payload.addresses) ||
            Array.isArray(payload.urls) ||
            Array.isArray(payload.ips);

        if (isBroadcastLike) {
            return broadcastHandler(request as FastifyRequest<{ Body: HttpDispatchBody }>);
        }
        return requestHandler(request as FastifyRequest<{ Body: HttpRequestBody }>);
    };

    const topologyHandler = async (request: FastifyRequest<{ Body: { userId: string; userKey: string } }>) => {
        const { userId, userKey } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const peers = wsHub.getConnectedDevices(userId);
        const peerProfiles = wsHub.getConnectedPeerProfiles(userId);
        const upstreamStatus = networkContext?.getUpstreamStatus?.() || null;
        const nodes = [
            {
                id: userId,
                kind: "node",
                role: "endpoint",
                peers: peers.length
            },
            ...peerProfiles.map((peer) => ({
                id: `${userId}:${peer.id}`,
                kind: "peer",
                parent: userId,
                deviceId: peer.id,
                label: peer.label
            }))
        ];

        if (upstreamStatus) {
            nodes.push({
                id: `upstream:${upstreamStatus.userId || "default"}`,
                kind: "node",
                role: upstreamStatus.connected ? "upstream-client" : "upstream-client-offline",
                connected: upstreamStatus.connected
            });
        }

        const links = [
            ...peerProfiles.map((peer) => ({
                id: `link:${userId}:${peer.id}`,
                source: userId,
                target: `${userId}:${peer.id}`,
                type: "ws-peer"
            }))
        ];

        if (upstreamStatus && (upstreamStatus.connected || upstreamStatus.running || upstreamStatus.upstreamEnabled)) {
            links.push({
                id: `link:${userId}:upstream`,
                source: userId,
                target: `upstream:${upstreamStatus.userId || "default"}`,
                type: "upstream-client"
            });
        }

        return {
            ok: true,
            nodes,
            links,
            peers,
            units: [
                {
                    id: userId,
                    kind: "unit",
                    nodes: peers.map((peer) => `${userId}:${peer}`).concat(userId)
                },
                {
                    id: "upstream",
                    kind: "unit",
                    active: !!upstreamStatus
                }
            ],
            upstream: upstreamStatus || null
        };
    };

    const networkDispatchHandler = async (request: FastifyRequest<{ Body: NetworkDispatchBody }>) => {
        const {
            userId,
            userKey,
            route = "local",
            target,
            targetId,
            deviceId,
            peerId,
            namespace,
            ns,
            type,
            action,
            data,
            payload,
            broadcast
        } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const messagePayload = payload ?? data ?? {};
        const destination = targetId || deviceId || peerId || target || "";
        const normalizedNamespace = typeof namespace === "string" && namespace.trim()
            ? namespace.trim()
            : typeof ns === "string" && ns.trim()
                ? ns.trim()
                : undefined;
        const payloadEnvelope = {
            type: String(type || action || "dispatch"),
            from: userId,
            namespace: normalizedNamespace,
            data: messagePayload
        };

        const targetValue = destination.trim ? destination.trim() : destination;
        let upstreamDispatched = false;
        if (route === "upstream" || route === "both") {
            const upstreamPayload = targetValue
                ? { ...payloadEnvelope, targetId: targetValue, target: targetValue, to: targetValue }
                : payloadEnvelope;
            upstreamDispatched = networkContext?.sendToUpstream?.(upstreamPayload) || false;
        }

        let localDelivered = false;
        if (route === "local" || route === "both") {
            if (broadcast === true || !targetValue) {
                wsHub.multicast(userId, payloadEnvelope, normalizedNamespace);
                localDelivered = true;
            } else {
                localDelivered = wsHub.sendToDevice(userId, targetValue, payloadEnvelope);
            }
        }

        return {
            ok: true,
            route,
            delivered: {
                local: localDelivered,
                upstream: upstreamDispatched,
                target: targetValue || null
            }
        };
    };

    // Legacy and new aliases:
    // - /api/request: targeted request delivery (legacy /core/ops/http)
    //   plus legacy secure variant (/core/ops/https) and partial notify fallback
    // - /api/broadcast: multi-peer dispatch (legacy /core/ops/http/dispatch and /core/ops/http/disp)
    //   plus partial notify multicast fallback
    // - /api/ws: ws send operation (legacy /core/ops/ws/send)
    // - /api/action: host/device action endpoint (legacy /clipboard, /sms, partial notify)
    // - /api/devices, /api/sms, /api/notifications and /api/notifications/speak:
    //   feature mirrors for device capability requests
    app.post("/core/ops/http", requestHandler);
    app.post("/core/ops/https", requestHandler);
    app.post("/api/request", requestHandler);
    app.post("/", rootCompatHandler);

    app.post("/core/ops/devices", featureDevicesHandler);
    app.post("/api/devices", featureDevicesHandler);
    app.post("/core/ops/sms", smsFeatureHandler);
    app.post("/api/sms", smsFeatureHandler);
    app.post("/core/ops/notifications", notificationsFeatureHandler);
    app.post("/api/notifications", notificationsFeatureHandler);
    app.post("/core/ops/notifications/speak", notificationsSpeakHandler);
    app.post("/api/notifications/speak", notificationsSpeakHandler);

    app.post("/core/ops/http/dispatch", broadcastHandler);
    app.post("/core/ops/http/disp", broadcastHandler);
    app.post("/api/broadcast", broadcastHandler);

    app.post("/core/ops/ws/send", wsSendHandler);
    app.post("/api/ws", wsSendHandler);
    app.post("/core/reverse/send", reverseSendHandler);
    app.post("/api/reverse/send", reverseSendHandler);
    app.post("/core/reverse/devices", reverseDevicesHandler);
    app.post("/api/reverse/devices", reverseDevicesHandler);
    app.post("/core/network/topology", topologyHandler);
    app.post("/api/network/topology", topologyHandler);
    app.post("/core/network/dispatch", networkDispatchHandler);
    app.post("/api/network/dispatch", networkDispatchHandler);

    app.post("/core/ops/notify", notifyHandler);
    app.post("/api/action", actionHandler);
};
