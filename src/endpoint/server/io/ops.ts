import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SocketIoBridge } from "../network/socket/socketio-bridge.ts";

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
import {
    inferNetworkSurface,
    normalizeNetworkAliasMap,
    makeTargetTokenSet,
    resolveNetworkAlias,
    resolveDispatchAudience,
    resolveDispatchPlan,
    resolvePeerIdentity,
    type PeerIdentityInput,
    type DispatchRouteDecision
} from "../network/index.ts";
import {
    resolveEndpointForwardTarget,
    resolveEndpointPolicyRoute,
    resolveEndpointIdPolicyStrict,
    type EndpointIdPolicyMap,
    normalizeEndpointPolicies
} from "../network/stack/endpoint-policy.ts";

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
    upstreamRole?: "active-connector" | "passive-connector" | "gateway-origin";
    endpointUrl?: string;
    userId?: string;
    deviceId?: string;
    namespace?: string;
    upstreamMode?: "active" | "passive";
    upstreamClientId?: string;
    upstreamPeerId?: string;
    surface?: string;
    origin?: {
        originId?: string;
        originHosts?: string[];
        originDomains?: string[];
        originMasks?: string[];
        surface?: string;
    };
};

type NetworkContextProvider = {
    getUpstreamStatus?: () => UpstreamTopologyStatus | null;
    sendToUpstream?: (payload: any) => boolean;
    getNodeId?: () => string | null;
};

type NetworkDispatchBody = {
    userId: string;
    userKey: string;
    route?: "auto" | "local" | "upstream" | "both";
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
    targets?: string[];
};
type NetworkFetchBody = {
    userId: string;
    userKey: string;
    route?: "auto" | "local" | "upstream" | "both";
    target?: string;
    targetId?: string;
    deviceId?: string;
    peerId?: string;
    namespace?: string;
    ns?: string;
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    data?: any;
    payload?: any;
    body?: string;
    timeoutMs?: number;
};

const BROADCAST_HTTPS_PORTS = new Set(["443", "8443"]);
const BROADCAST_PROTO_RE = /^https?:\/\//i;
const isTunnelDebug = String(process.env.CWS_TUNNEL_DEBUG || process.env.AIRPAD_TUNNEL_DEBUG || "").toLowerCase() === "true";

const hasProtocol = (value: string): boolean => BROADCAST_PROTO_RE.test(value);

const looksLikeAliasedHostTarget = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (/^\[[^\]]+\](?::\d{1,5})?$/.test(trimmed)) return true;
    if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?$/.test(trimmed)) return true;
    if (/^[a-zA-Z0-9._-]+(?::\d{1,5})?$/.test(trimmed)) return true;
    return false;
};
const NETWORK_ALIAS_MAP = normalizeNetworkAliasMap((config as any)?.networkAliases || {});
const endpointPolicyMap: EndpointIdPolicyMap = normalizeEndpointPolicies((config as any)?.endpointIDs || (config as any)?.core?.endpointIDs || {});
const DEFAULT_NETWORK_FETCH_TIMEOUT_MS = 15000;

const resolveDispatchTarget = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    const withPrefixStripped = stripAliasPrefix(trimmed);
    return resolveNetworkAlias(NETWORK_ALIAS_MAP, withPrefixStripped) || withPrefixStripped;
};

const resolveEndpointRouteTarget = (rawTarget: string, sourceId: string): string => {
    return resolveEndpointForwardTarget(rawTarget, sourceId, endpointPolicyMap);
};

const checkEndpointRoutePermission = (sourceId: string, targetId: string) => {
    if (!targetId) return { allowed: true, reason: "no-target" };
    if (!sourceId) return { allowed: true, reason: "no-source" };
    return resolveEndpointPolicyRoute(sourceId, targetId, endpointPolicyMap);
};

type RouteSourceResolution = {
    sourceId: string;
    sourceHint?: string;
    isKnown: boolean;
};

const resolveRouteSourceId = (sourceHint: string | undefined, fallbackUserId: string): RouteSourceResolution => {
    const fallback = fallbackUserId.trim().toLowerCase();
    if (!sourceHint || !sourceHint.trim()) return { sourceId: fallback, isKnown: true };

    const trimmedHint = sourceHint.trim();
    const lowerHint = trimmedHint.toLowerCase();
    const policyResolved = resolveEndpointRouteTarget(trimmedHint, trimmedHint);
    const peerIdentityResolved = resolveNetworkTargetWithPeerIdentity(trimmedHint, fallbackUserId);
    const sourceId = (policyResolved || peerIdentityResolved || trimmedHint).trim().toLowerCase();
    const strictPolicy = resolveEndpointIdPolicyStrict(endpointPolicyMap, lowerHint) || (sourceId ? resolveEndpointIdPolicyStrict(endpointPolicyMap, sourceId) : undefined);
    const isKnown = Boolean(strictPolicy) || sourceId === fallback;
    return {
        sourceId,
        sourceHint: trimmedHint,
        isKnown
    };
};

const extractRoutingSourceId = (body: Record<string, any> | undefined, fallbackUserId: string): RouteSourceResolution => {
    if (!body) return { sourceId: fallbackUserId.trim().toLowerCase(), isKnown: true };
    const sourceHint = body.from || body.source || body.sourceId || body.src || body.suggestedSource || body.routeSource || body._routeSource;
    return resolveRouteSourceId(typeof sourceHint === "string" ? sourceHint : undefined, fallbackUserId);
};

const ensureKnownRoutingSource = (routeSource: RouteSourceResolution): { allowed: boolean; reason: string } => {
    if (routeSource.sourceHint && !routeSource.isKnown) {
        return { allowed: false, reason: "unknown source identity" };
    }
    return { allowed: true, reason: "" };
};

const normalizePeerProfilesForResolution = (profiles: Array<{ id: string; label: string; peerId?: string }>): Array<PeerIdentityInput> => {
    return profiles.map((peer) => ({
        id: peer.id,
        label: peer.label,
        peerId: peer.peerId
    }));
};

const buildPeerIdentityContext = (userId: string) => {
    const staticTopology = (config as any)?.topology;
    const topologyEntries = Array.isArray(staticTopology?.nodes)
        ? (staticTopology.nodes as Array<Record<string, any>>).filter((node) => node && typeof node === "object" && !Array.isArray(node))
        : [];
    const peers = wsHub.getConnectedPeerProfiles(userId);
    return {
        peers: normalizePeerProfilesForResolution(peers),
        aliases: NETWORK_ALIAS_MAP,
            topology: topologyEntries
    };
};

const resolveNetworkTargetWithPeerIdentity = (input: string, userId: string): string => {
    const resolution = resolvePeerIdentity(input, buildPeerIdentityContext(userId));
    if (!resolution || !resolution.peerId) return resolveDispatchTarget(input);
    return resolution.peerId;
};

const stripAliasPrefix = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9_-]*):(.*)$/);
    if (!match) return trimmed;

    const prefix = match[1].toLowerCase();
    const prefixMapped = resolveNetworkAlias(NETWORK_ALIAS_MAP, prefix);
    if (prefixMapped) return prefixMapped;

    const aliasTarget = match[2].trim();
    if (looksLikeAliasedHostTarget(aliasTarget)) return aliasTarget;
    return resolveNetworkAlias(NETWORK_ALIAS_MAP, trimmed) || trimmed;
};

const normalizeNetworkFetchResponse = (
    requestId: string,
    response: any
): { ok: boolean; status: number; statusText?: string; body?: string; headers?: Record<string, string>; requestId?: string; error?: string; raw: any } => {
    if (response == null) {
        return {
            ok: false,
            status: 504,
            statusText: "No response",
            requestId,
            body: "No response",
            raw: response
        };
    }

    if (typeof response !== "object") {
        return {
            ok: true,
            status: 200,
            statusText: "OK",
            requestId,
            body: typeof response === "string" ? response : JSON.stringify(response),
            raw: response
        };
    }

    const responseRequestId = typeof response?.requestId === "string" && response.requestId
        ? String(response.requestId)
        : requestId;
    const normalizedHeaders = (() => {
        const source = response?.headers;
        if (!source || typeof source !== "object") return undefined;
        if (Array.isArray(source)) return undefined;
        return Object.entries(source as Record<string, unknown>).reduce(
            (acc, [headerName, headerValue]) => {
                if (typeof headerValue === "string" || typeof headerValue === "number") {
                    acc[headerName] = String(headerValue);
                } else if (Array.isArray(headerValue) && headerValue.every((item) => typeof item === "string")) {
                    acc[headerName] = headerValue.join(", ");
                }
                return acc;
            },
            {} as Record<string, string>
        );
    })();

    const status = typeof response.status === "number" ? response.status : undefined;
    const bodySource = response.body ?? response.data ?? response.text ?? response.payload ?? response.response;
    return {
        ok: response.ok !== undefined ? Boolean(response.ok) : status === undefined || (status >= 200 && status < 400),
        status: typeof status === "number" ? status : 200,
        statusText: typeof response.statusText === "string" ? response.statusText : response.error ? "Error" : "OK",
        headers: normalizedHeaders,
        body: typeof bodySource === "string" ? bodySource : (bodySource == null ? undefined : JSON.stringify(bodySource)),
        requestId: responseRequestId,
        error: typeof response.error === "string" ? response.error : undefined,
        raw: response
    };
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

const resolveFeatureTarget = (body: DeviceFeatureRequestBody, userId: string) => (
    resolveNetworkTargetWithPeerIdentity(body.targetDeviceId?.trim() || body.targetId?.trim() || (body as any).deviceId?.trim(), userId)
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

type AuthContext = {
    record: Awaited<ReturnType<typeof verifyUser>> | null;
    settings?: Settings;
};

const resolveAuthContext = async (userId: string, userKey: string): Promise<AuthContext> => {
    const [record, settings] = await Promise.all([
        verifyUser(userId, userKey).catch(() => null),
        loadUserSettings(userId, userKey).catch(() => undefined as Settings | undefined)
    ]);
    return { record, settings };
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

    const host = resolveDispatchTarget(
        body.ip?.trim() || body.address?.trim() || body.host?.trim() || ""
    );
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

export const registerOpsRoutes = async (
    app: FastifyInstance,
    wsHub: WsHub,
    networkContext?: NetworkContextProvider,
    socketIoBridge?: Pick<SocketIoBridge, "requestToDevice" | "sendToDevice">
) => {
    const requestHandler = async (request: FastifyRequest<{ Body: HttpRequestBody }>) => {
        const payload = (request.body || {}) as HttpRequestBody;
        const { userId, userKey, targetId, targetDeviceId, method, headers, body } = payload;
        const forceHttpsRoute = (request.url || "").startsWith("/core/ops/https") || payload.https === true || payload.secure === true;
        const hasCredentials = Boolean(userId && userKey);
        const settings = hasCredentials
            ? (await resolveAuthContext(userId, userKey)).settings
            : undefined;
        if (hasCredentials) {
            const { record } = await resolveAuthContext(userId, userKey);
            if (!record) {
                return { ok: false, error: "Invalid credentials" };
            }
        }

        const ops = settings?.core?.ops || {};
        const httpTargets = ops.httpTargets || [];
        const resolvedTargetId = targetId?.trim() ? resolveNetworkTargetWithPeerIdentity(targetId, userId) : targetId;
        const target = targetId?.trim() ? httpTargets.find((t) => t.id === targetId || t.id === resolvedTargetId) : undefined;
        const resolvedUrl = toTargetUrl(payload, target?.url, forceHttpsRoute);

        const routeTargetHint = targetDeviceId || (payload as any).deviceId || targetId || "";
        const reverseTarget = resolveEndpointRouteTarget(routeTargetHint, userId);
        const reverseTargetPeer = resolveNetworkTargetWithPeerIdentity(routeTargetHint, userId);
        const routeSource = extractRoutingSourceId(payload as any, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return {
                ok: false,
                error: "Unknown source. I don't know you",
                route: "source-unknown",
                reason: routeSourceCheck.reason
            };
        }
        const routeDecision = checkEndpointRoutePermission(routeSource.sourceId, reverseTarget);
        if (!routeDecision.allowed) {
            return {
                ok: false,
                error: "Route denied by endpoint policy",
                delivered: "policy-blocked",
                reason: routeDecision.reason
            };
        }
        const reverseTargetForSend = reverseTargetPeer || reverseTarget;
        if (!resolvedUrl && reverseTargetForSend && typeof reverseTargetForSend === "string" && reverseTargetForSend.trim()) {
            const delivered = wsHub.sendToDevice(userId, reverseTargetForSend, {
                type: (payload as any).type || "dispatch",
                data: (payload as any).data ?? payload,
            });
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                mode: "request-fallback-reverse",
                targetDeviceId: reverseTargetForSend
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
        const routeSource = extractRoutingSourceId(body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return {
                ok: false,
                error: "Unknown source. I don't know you",
                route: "source-unknown",
                reason: routeSourceCheck.reason
            };
        }
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

        const hasCredentials = Boolean(userId && userKey);
        const authContext = hasCredentials ? await resolveAuthContext(userId, userKey) : { record: null, settings: undefined };
        if (hasCredentials && !authContext.record) {
            return { ok: false, error: "Invalid credentials" };
        }
        const settings = authContext.settings;

        const ops = settings?.core?.ops || {};
        const allowUnencrypted = ops.allowUnencrypted !== false;
        const configBroadcastForceHttps = Boolean(
            (config as any)?.broadcastForceHttps
            || (config as any)?.ops?.broadcastForceHttps
            || (config as any)?.core?.ops?.broadcastForceHttps
        );
        const requestBroadcastForceHttps = typeof (body as any).broadcastForceHttps === "boolean" ? (body as any).broadcastForceHttps : undefined;
        const forceBroadcastHttps = requestBroadcastForceHttps ?? (Boolean(ops.broadcastForceHttps) || configBroadcastForceHttps);
        const execOne = async (entry: HttpDispatchRequest) => {
            const reverseDeviceId = (entry as any).deviceId || (entry as any).targetId || defaultDeviceId;
            if (typeof reverseDeviceId === "string" && reverseDeviceId.trim()) {
                const resolvedReverseDeviceId = resolveEndpointRouteTarget(reverseDeviceId, userId);
                const routeDecision = checkEndpointRoutePermission(routeSource.sourceId, resolvedReverseDeviceId);
                if (!routeDecision.allowed) {
                    return {
                        target: reverseDeviceId,
                        ok: false,
                        delivered: "policy-blocked",
                        mode: "reverse",
                        reason: routeDecision.reason
                    };
                }
                const delivered = wsHub.sendToDevice(userId, resolvedReverseDeviceId.trim(), {
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

    const networkFetchHandler = async (request: FastifyRequest<{ Body: NetworkFetchBody }>) => {
        const {
            userId,
            userKey,
            route = "auto",
            target,
            targetId,
            deviceId,
            peerId,
            namespace,
            ns,
            method,
            url,
            headers,
            data,
            payload,
            body,
            timeoutMs
        } = request.body || {};
        const routeSource = extractRoutingSourceId(request.body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return {
                ok: false,
                error: "Unknown source. I don't know you",
                route: "source-unknown",
                reason: routeSourceCheck.reason
            };
        }
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const rawDestination = resolveNetworkTargetWithPeerIdentity(targetId || deviceId || peerId || target || "", userId);
        const destination = resolveEndpointRouteTarget(rawDestination, userId);
        const requestTarget = typeof destination === "string" ? destination.trim() : "";
        if (!requestTarget) return { ok: false, error: "Missing target" };
        const routingPolicy = checkEndpointRoutePermission(routeSource.sourceId, requestTarget);
        if (!routingPolicy.allowed) {
            return {
                ok: false,
                error: "Route denied by endpoint policy",
                route: "policy-block",
                target: requestTarget,
                reason: routingPolicy.reason
            };
        }
        const effectiveTimeoutMs = Number.isFinite(Number(timeoutMs))
            ? Math.max(250, Number(timeoutMs))
            : undefined;
        const normalizedNamespace = typeof namespace === "string" && namespace.trim()
            ? namespace.trim()
            : typeof ns === "string" && ns.trim()
                ? ns.trim()
                : undefined;

        const peerProfiles = wsHub.getConnectedPeerProfiles(userId);
        const localPeers = makeTargetTokenSet(wsHub.getConnectedDevices(userId));
        const localLabels = makeTargetTokenSet(peerProfiles.map((peer) => peer.label));
        const localIds = makeTargetTokenSet(peerProfiles.map((peer) => peer.id));
        const localPeerIds = makeTargetTokenSet(peerProfiles.map((peer) => String((peer as any).peerId || peer.id)));
        const allLocalTargets = new Set([...localPeers, ...localLabels, ...localIds, ...localPeerIds]);
        const isLocalTarget = (value: string) => allLocalTargets.has(value.trim().toLowerCase());
        const surface = inferNetworkSurface(request.socket?.remoteAddress || (request.headers?.["x-forwarded-for"] as string | undefined));
        const plan = resolveDispatchPlan({
            route,
            target: requestTarget,
            hasUpstreamTransport: Boolean(networkContext?.sendToUpstream),
            isLocalTarget,
            surface
        });
        if (!plan.local && !plan.upstream) {
            return { ok: false, error: "Target unknown and no available route", route: "none", target: requestTarget };
        }

        const requestId = randomUUID();
        const requestPayload = {
            type: "network.fetch",
            requestId,
            from: routeSource.sourceId,
            to: requestTarget,
            namespace: normalizedNamespace,
            method: (method || "GET").toUpperCase(),
            url: typeof url === "string" ? url.trim() : undefined,
            headers: headers || {},
            body: payload ?? data ?? body
        };

        const requestPayloadWithTimeout = requestPayload;
        const unifiedResult = async () => {
            if (plan.local) {
                if (wsHub.requestToDevice) {
                    try {
                        const response = await wsHub.requestToDevice(
                            userId,
                            requestTarget,
                            requestPayloadWithTimeout,
                            effectiveTimeoutMs
                        );
                        if (response !== undefined) {
                            return {
                                ok: true,
                                route: plan.route,
                                requestId,
                                target: requestTarget,
                                result: normalizeNetworkFetchResponse(requestId, response)
                            };
                        }
                    } catch (error) {
                        if (isTunnelDebug) {
                            console.log(
                                `[ops] wsHub network.fetch error`,
                                `user=${userId}`,
                                `target=${requestTarget}`,
                                `error=${String((error as any)?.message || error || "")}`
                            );
                        }
                    }
                }

                if (socketIoBridge?.requestToDevice) {
                    try {
                        const response = await socketIoBridge.requestToDevice(
                            userId,
                            requestTarget,
                            requestPayloadWithTimeout,
                            effectiveTimeoutMs ?? DEFAULT_NETWORK_FETCH_TIMEOUT_MS
                        );
                        if (response !== undefined) {
                            return {
                                ok: true,
                                route: plan.route,
                                requestId,
                                target: requestTarget,
                                result: normalizeNetworkFetchResponse(requestId, response)
                            };
                        }
                    } catch (error) {
                        if (isTunnelDebug) {
                            console.log(
                                `[ops] socketio network.fetch error`,
                                `user=${userId}`,
                                `target=${requestTarget}`,
                                `error=${String((error as any)?.message || error || "")}`
                            );
                        }
                    }
                }

                const delivered = wsHub.sendToDevice(userId, requestTarget, requestPayloadWithTimeout)
                    || socketIoBridge?.sendToDevice?.(userId, requestTarget, requestPayloadWithTimeout);
                return {
                    ok: !!delivered,
                    requestId,
                    route: plan.route,
                    target: requestTarget,
                    mode: delivered ? "fallback-one-way" : "local-delivery-missing",
                    delivered: delivered ? "ws-reverse" : "ws-reverse-missing"
                };
            }

            return undefined;
        };

        const localResult = await unifiedResult();
        if (localResult) return localResult;

        if (plan.upstream && networkContext?.sendToUpstream) {
            const upstreamPayload = {
                ...requestPayload,
                to: requestTarget,
                target: requestTarget,
                targetId: requestTarget,
                route,
                namespace: normalizedNamespace
            };
            const sent = networkContext.sendToUpstream({
                ...upstreamPayload,
                from: routeSource.sourceId
            });
            return {
                ok: Boolean(sent),
                route: plan.route,
                requestId,
                target: requestTarget,
                mode: sent ? "upstream-fire-and-forget" : "upstream-not-available"
            };
        }

        const delivered = wsHub.sendToDevice(userId, requestTarget, requestPayload);
        return {
            ok: !!delivered,
            route: plan.route,
            requestId,
            target: requestTarget,
            mode: delivered ? "legacy-forward" : "missing-target",
            delivered: delivered ? "ws-reverse" : "ws-reverse-missing"
        };
    };

    const legacyNetworkFetchAlias = async (request: FastifyRequest<{ Body: NetworkFetchBody }>) => networkFetchHandler(request);

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
        const routeSource = extractRoutingSourceId(request.body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return { ok: false, error: "Unknown source. I don't know you", route: "source-unknown", reason: routeSourceCheck.reason };
        }
        const resolvedDeviceId = resolveEndpointRouteTarget(deviceId, userId);
        const permission = checkEndpointRoutePermission(routeSource.sourceId, resolvedDeviceId);
        if (!permission.allowed) {
            return { ok: false, error: "Route denied by endpoint policy", delivered: "policy-blocked", reason: permission.reason };
        }

        const delivered = wsHub.sendToDevice(userId, resolvedDeviceId, {
            type: type || action || "dispatch",
            data,
        });
        return { ok: !!delivered, delivered: delivered ? "ws-reverse" : "ws-reverse-missing", deviceId: resolvedDeviceId };
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
        const { record, settings } = await resolveAuthContext(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

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
        const routeSource = extractRoutingSourceId(body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return { ok: false, error: "Unknown source. I don't know you", route: "source-unknown", reason: routeSourceCheck.reason };
        }

        const { record, settings } = await resolveAuthContext(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const ops = settings?.core?.ops || {};
        const target = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets.find((entry: any) => entry?.id === targetId)
            : undefined;
        const resolvedBase = toTargetUrl(body, target?.url, false);
        const reverseDeviceId = resolveFeatureTarget(body, userId);
        const resolvedReverseDeviceId = reverseDeviceId ? resolveEndpointRouteTarget(reverseDeviceId, userId) : reverseDeviceId;
        const permission = resolvedReverseDeviceId
            ? checkEndpointRoutePermission(routeSource.sourceId, resolvedReverseDeviceId)
            : { allowed: true, reason: "" };

        if (!resolvedBase && resolvedReverseDeviceId && permission.allowed) {
            const delivered = wsHub.sendToDevice(userId, resolvedReverseDeviceId, reverseDispatchPayload("sms", { method: "GET", limit }));
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                targetDeviceId: resolvedReverseDeviceId,
                mode: "reverse",
                feature: "sms",
                limit
            };
        }
        if (!resolvedBase && resolvedReverseDeviceId && !permission.allowed) {
            return { ok: false, error: "Route denied by endpoint policy", delivered: "policy-blocked", reason: permission.reason };
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
        const routeSource = extractRoutingSourceId(body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return { ok: false, error: "Unknown source. I don't know you", route: "source-unknown", reason: routeSourceCheck.reason };
        }

        const { record, settings } = await resolveAuthContext(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const ops = settings?.core?.ops || {};
        const target = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets.find((entry: any) => entry?.id === targetId)
            : undefined;
        const resolvedBase = toTargetUrl(body, target?.url, false);
        const reverseDeviceId = resolveFeatureTarget(body, userId);
        const resolvedReverseDeviceId = reverseDeviceId ? resolveEndpointRouteTarget(reverseDeviceId, userId) : reverseDeviceId;
        const permission = resolvedReverseDeviceId
            ? checkEndpointRoutePermission(routeSource.sourceId, resolvedReverseDeviceId)
            : { allowed: true, reason: "" };

        if (!resolvedBase && resolvedReverseDeviceId && permission.allowed) {
            const delivered = wsHub.sendToDevice(userId, resolvedReverseDeviceId, reverseDispatchPayload("notifications", { method: "GET", limit }));
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                targetDeviceId: resolvedReverseDeviceId,
                mode: "reverse",
                feature: "notifications",
                limit
            };
        }
        if (!resolvedBase && resolvedReverseDeviceId && !permission.allowed) {
            return { ok: false, error: "Route denied by endpoint policy", delivered: "policy-blocked", reason: permission.reason };
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
        const routeSource = extractRoutingSourceId(body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return { ok: false, error: "Unknown source. I don't know you", route: "source-unknown", reason: routeSourceCheck.reason };
        }

        const { record, settings } = await resolveAuthContext(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        if (!message) return { ok: false, error: "Missing text" };
        const ops = settings?.core?.ops || {};
        const target = Array.isArray((ops as any).httpTargets)
            ? (ops as any).httpTargets.find((entry: any) => entry?.id === targetId)
            : undefined;
        const resolvedBase = toTargetUrl(body, target?.url, false);
        const reverseDeviceId = resolveFeatureTarget(body, userId);
        const resolvedReverseDeviceId = reverseDeviceId ? resolveEndpointRouteTarget(reverseDeviceId, userId) : reverseDeviceId;
        const permission = resolvedReverseDeviceId
            ? checkEndpointRoutePermission(routeSource.sourceId, resolvedReverseDeviceId)
            : { allowed: true, reason: "" };

        if (!resolvedBase && resolvedReverseDeviceId && permission.allowed) {
            const delivered = wsHub.sendToDevice(userId, resolvedReverseDeviceId, reverseDispatchPayload("notifications.speak", { text: message }));
            return {
                ok: !!delivered,
                delivered: delivered ? "ws-reverse" : "ws-reverse-missing",
                targetDeviceId: resolvedReverseDeviceId,
                mode: "reverse",
                feature: "notifications.speak"
            };
        }
        if (!resolvedBase && resolvedReverseDeviceId && !permission.allowed) {
            return { ok: false, error: "Route denied by endpoint policy", delivered: "policy-blocked", reason: permission.reason };
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
        const isGateway = Boolean(upstreamStatus?.running || upstreamStatus?.connected);
        const configuredTopology = (config as any)?.topology;
        const configuredEndpointIds = (config as any)?.endpointIDs;
        const staticTopologyEnabled = Boolean(
            configuredTopology && typeof configuredTopology === "object"
                ? (configuredTopology as Record<string, any>).enabled !== false
                : true
        );
        const staticTopologyNodes = staticTopologyEnabled
            ? Array.isArray((configuredTopology as Record<string, any>)?.nodes)
                ? ((configuredTopology as Record<string, any>).nodes as Array<Record<string, any>>)
                    .filter((node) => node && typeof node === "object" && !Array.isArray(node) && typeof (node as Record<string, any>).id === "string" && (node as Record<string, any>).id.trim())
                    .map((node) => ({
                        ...node
                    }))
                : []
            : [];
        const normalizedStaticTopologyNodes = staticTopologyNodes.map((node) => {
            const normalizedNode = node as Record<string, any>;
            return {
                ...normalizedNode,
                peerId: String(normalizedNode.peerId || normalizedNode.id || "").trim().toLowerCase() || undefined,
                id: String(normalizedNode.id).trim(),
                kind: normalizedNode.kind || "node",
                surface: normalizedNode.surface || "external"
            };
        });
        const staticTopologyLinks = staticTopologyEnabled
            ? Array.isArray((configuredTopology as Record<string, any>)?.links)
                ? ((configuredTopology as Record<string, any>).links as Array<Record<string, any>>).filter((link) => {
                    if (!link || typeof link !== "object" || Array.isArray(link)) return false;
                    const source = String((link as Record<string, any>).source || "").trim();
                    const target = String((link as Record<string, any>).target || "").trim();
                    if (!source || !target) return false;
                    return true;
                })
                    .map((link) => ({
                        id: String((link as Record<string, any>).id || `${(link as Record<string, any>).source || "unknown"}->${(link as Record<string, any>).target || "unknown"}`),
                        type: String((link as Record<string, any>).type || "topology-link"),
                        ...link
                    }))
                : []
            : [];
        const endpointIdNodes = typeof configuredEndpointIds === "object" && configuredEndpointIds !== null
            ? Object.entries(configuredEndpointIds).map(([id, entry]) => {
                const peerPolicy = (entry && typeof entry === "object") ? (entry as Record<string, any>) : {};
                return {
                    id: String(id || "").trim(),
                    kind: "peer",
                    peerId: String(id || "").trim().toLowerCase(),
                    role: peerPolicy?.flags?.gateway === true ? "gateway" : "endpoint-peer",
                    surface: "external",
                    origin: {
                        hosts: Array.isArray(peerPolicy.origins) ? peerPolicy.origins : [],
                        forward: typeof peerPolicy.forward === "string" ? peerPolicy.forward : "self",
                        flags: peerPolicy.flags || {}
                    },
                    forward: typeof peerPolicy.forward === "string" ? peerPolicy.forward : "self",
                    tokens: peerPolicy.tokens || [],
                    allowedIncoming: peerPolicy.allowedIncoming || ["*"],
                    allowedOutcoming: peerPolicy.allowedOutcoming || ["*"]
                };
            })
            : [];

        const localNodes = [
            {
                id: `${userId}`,
                kind: "node",
                role: isGateway ? "gateway+endpoint" : "endpoint",
                peers: peers.length,
                peerId: userId,
                surface: "local",
                origin: undefined
            },
            ...peerProfiles.map((peer) => ({
                id: `${userId}:${peer.id}`,
                peerId: (peer as any).peerId || peer.id,
                kind: "peer",
                parent: `${userId}`,
                deviceId: peer.id,
                label: peer.label,
                surface: "local",
                origin: undefined
            }))
        ];

        const staticNodeKeys = new Set(normalizedStaticTopologyNodes.map((node) => String(node.peerId || node.id || "").trim().toLowerCase()));
        for (const endpointNode of endpointIdNodes) {
            const key = String(endpointNode.peerId || endpointNode.id || "").trim().toLowerCase();
            if (!key) continue;
            if (!staticNodeKeys.has(key)) {
                staticNodeKeys.add(key);
                normalizedStaticTopologyNodes.push(endpointNode);
            }
        }
        const mergedTopologyNodes: Array<Record<string, any>> = [...normalizedStaticTopologyNodes];
        for (const node of localNodes) {
            const key = String(node.peerId || node.id || "").trim().toLowerCase();
            if (!key) continue;
            if (!staticNodeKeys.has(key)) {
                mergedTopologyNodes.push(node);
                staticNodeKeys.add(key);
            }
        }

        if (upstreamStatus) {
            const upstreamKey = upstreamStatus.upstreamClientId || upstreamStatus.upstreamPeerId || upstreamStatus.userId || `upstream:${userId}`;
            mergedTopologyNodes.push({
                id: `upstream:${upstreamKey}`,
                kind: "node",
                role: upstreamStatus.connected ? "gateway" : upstreamStatus.running ? "gateway-passive" : "gateway-offline",
                parent: isGateway ? `${userId}` : undefined,
                connected: upstreamStatus.connected,
                peerId: upstreamStatus.upstreamPeerId || upstreamStatus.userId || upstreamKey,
                upstreamMode: upstreamStatus.upstreamMode || undefined,
                upstreamRole: upstreamStatus.upstreamRole,
                origin: upstreamStatus.origin || {
                    originId: upstreamStatus.upstreamClientId || upstreamStatus.userId
                },
                surface: upstreamStatus.upstreamMode === "passive" ? "local" : "external"
            });
        }

        const links = [
            ...peerProfiles.map((peer) => ({
                id: `link:${userId}:${peer.id}`,
                source: `${userId}`,
                target: `${userId}:${peer.id}`,
                type: "ws-peer"
            }))
        ];

        if (upstreamStatus && (upstreamStatus.connected || upstreamStatus.running || upstreamStatus.upstreamEnabled)) {
            links.push({
                id: `link:${userId}:upstream`,
                source: `${userId}`,
                target: `upstream:${upstreamStatus.upstreamClientId || upstreamStatus.upstreamPeerId || upstreamStatus.userId || "default"}`,
                type: "upstream-client"
            });
        }

        const staticLinkIds = new Set(staticTopologyLinks.map((link) => String(link.id).toLowerCase()));
        for (const link of links) {
            if (!staticLinkIds.has(String(link.id).toLowerCase())) {
                staticTopologyLinks.push(link);
            }
        }

        return {
            ok: true,
            nodes: mergedTopologyNodes,
            links: staticTopologyLinks,
            topology: {
                enabled: staticTopologyEnabled,
                nodes: Array.isArray(mergedTopologyNodes) ? mergedTopologyNodes.length : 0,
                links: Array.isArray(staticTopologyLinks) ? staticTopologyLinks.length : 0,
                source: "config+runtime"
            },
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
            route = "auto",
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
            broadcast,
            targets
        } = request.body || {};
        const routeSource = extractRoutingSourceId(request.body as Record<string, any>, userId);
        const routeSourceCheck = ensureKnownRoutingSource(routeSource);
        if (!routeSourceCheck.allowed) {
            return { ok: false, error: "Unknown source. I don't know you", route: "source-unknown", reason: routeSourceCheck.reason };
        }
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };

        const messagePayload = payload ?? data ?? {};
        const destination = resolveEndpointRouteTarget(targetId || deviceId || peerId || target || "", userId);
        const normalizedTargets = Array.isArray(targets)
            ? targets
                .map((item) => resolveEndpointRouteTarget(String(item || "").trim(), userId))
                .filter(Boolean)
            : [];
        const normalizedNamespace = typeof namespace === "string" && namespace.trim()
            ? namespace.trim()
            : typeof ns === "string" && ns.trim()
                ? ns.trim()
                : undefined;

        const peerProfiles = wsHub.getConnectedPeerProfiles(userId);
        const localPeers = makeTargetTokenSet(wsHub.getConnectedDevices(userId));
        const localLabels = makeTargetTokenSet(peerProfiles.map((peer) => peer.label));
        const localIds = makeTargetTokenSet(peerProfiles.map((peer) => peer.id));
        const localPeerIds = makeTargetTokenSet(peerProfiles.map((peer) => String((peer as any).peerId || peer.id)));
        const allLocalTargets = new Set([...localPeers, ...localLabels, ...localIds, ...localPeerIds]);
        const isLocalTarget = (value: string) => allLocalTargets.has(value.trim().toLowerCase());
        const surface = inferNetworkSurface(request.socket?.remoteAddress || (request.headers?.["x-forwarded-for"] as string | undefined));
        const configuredBroadcastTargets = Array.isArray((config as any)?.broadcastTargets)
            ? (config as any).broadcastTargets.map((entry: any) => resolveDispatchTarget(String(entry || "")))
            : [];
        const audience = resolveDispatchAudience({
            target: destination,
            targets: normalizedTargets,
            broadcast,
            implicitTargets: configuredBroadcastTargets.map((target) => resolveNetworkTargetWithPeerIdentity(target, userId))
        });

        const requestedTargets = audience.targets.length > 0
            ? audience.targets
            : [destination];
        const policyCheckedTargets = requestedTargets
            .map((targetValue) => {
                if (!targetValue) return "";
                const resolved = resolveNetworkTargetWithPeerIdentity(targetValue, userId) || targetValue;
                const resolvedForward = resolveEndpointRouteTarget(resolved, userId);
                const permission = checkEndpointRoutePermission(routeSource.sourceId, resolvedForward);
                if (!permission.allowed) {
                    console.warn(
                        "[network/dispatch] route denied by endpoint policy",
                        `source=${routeSource.sourceId}`,
                        `target=${resolvedForward}`,
                        permission.reason
                    );
                    return "";
                }
                return resolvedForward;
            })
            .filter(Boolean);
        if (requestedTargets.length > 0 && policyCheckedTargets.length === 0) {
            return {
                ok: false,
                error: "Route denied by endpoint policy",
                route: "policy-block",
                target: (typeof destination === "string" ? destination : ""),
                targets: requestedTargets,
                reason: "all requested targets denied by endpoint policy"
            };
        }

        const audienceDecisions = policyCheckedTargets.map((resolvedTarget) => {
            const targetValue = typeof resolvedTarget === "string" ? resolvedTarget.trim() : "";
            return {
                target: targetValue,
                plan: resolveDispatchPlan({
                    route,
                    target: targetValue || undefined,
                    hasUpstreamTransport: Boolean(networkContext?.sendToUpstream),
                    isLocalTarget,
                    surface
                })
            };
        });

        const localDecisionTargets = Array.from(new Set(
            audienceDecisions
                .filter((entry) => entry.plan.local && entry.target)
                .map((entry) => entry.target)
        ));
        const upstreamDecisionTargets = audienceDecisions
            .filter((entry) => entry.plan.upstream && entry.plan.route !== "none")
            .map((entry) => entry.target);

        const shouldBroadcastLocally = audience.source === "implicit-local-broadcast"
            || !audience.targets.length && (typeof destination !== "string" || !destination.trim());
        const audienceRouteHints = audienceDecisions.map((entry) => entry.plan.route);
        const localPlan = audienceRouteHints.some((entry) => entry === "local" || entry === "both");
        const upstreamPlan = audienceRouteHints.some((entry) => entry === "upstream" || entry === "both");
        const aggregateRoute: DispatchRouteDecision["route"] = localPlan && upstreamPlan
            ? "both"
            : localPlan
                ? "local"
                : upstreamPlan
                    ? "upstream"
                    : "none";
        const reasonSet = new Set(audienceDecisions.map((entry) => entry.plan.reason));
        const aggregateReason = reasonSet.size === 1
            ? Array.from(reasonSet)[0]
            : Array.from(reasonSet).join("; ");

        const payloadEnvelope = {
            type: String(type || action || "dispatch"),
            from: routeSource.sourceId,
            namespace: normalizedNamespace,
            data: messagePayload
        };

        const targetValue = destination.trim ? destination.trim() : destination;
        const localDeliveryPromise = (async () => {
            if (!localPlan) return false;

            if (shouldBroadcastLocally || localDecisionTargets.length === 0) {
                wsHub.multicast(userId, payloadEnvelope, normalizedNamespace);
                return true;
            }

            const results = await Promise.all(
                localDecisionTargets.map((resolvedTarget) => wsHub.sendToDevice(userId, resolvedTarget, payloadEnvelope))
            );
            return results.some(Boolean);
        })();

        const upstreamDispatchPromise = (async () => {
            if (!upstreamPlan || !networkContext?.sendToUpstream) return false;
            const upstreamTargets = Array.from(new Set(upstreamDecisionTargets.filter(Boolean)));
            const upstreamPayloads = upstreamTargets.length > 0
                ? upstreamTargets.map((item) => ({ ...payloadEnvelope, targetId: item, target: item, to: item }))
                : [payloadEnvelope];

            const results = await Promise.all(
                upstreamPayloads.map((upstreamPayload) => networkContext?.sendToUpstream?.(upstreamPayload) || false)
            );
            return results.some(Boolean);
        })();

        const [localDelivered, upstreamDispatched] = await Promise.all([localDeliveryPromise, upstreamDispatchPromise]);

        if (!localPlan && !upstreamPlan) {
            return {
                ok: false,
                error: aggregateReason,
                route: aggregateRoute,
                delivered: {
                    local: localDelivered,
                    upstream: upstreamDispatched,
                    target: targetValue || null
                },
                routePlan: {
                    decided: aggregateRoute,
                    reason: aggregateReason,
                    local: localPlan,
                    upstream: upstreamPlan,
                    audience
                }
            };
        }

        return {
            ok: true,
            route: aggregateRoute,
            delivered: {
                local: localDelivered,
                upstream: upstreamDispatched,
                target: targetValue || null,
                    targets: policyCheckedTargets
            },
            routePlan: {
                decided: aggregateRoute,
                reason: aggregateReason,
                local: localPlan,
                upstream: upstreamPlan,
                audience,
                decisions: audienceDecisions.map((entry) => ({
                    target: entry.target,
                    route: entry.plan.route,
                    local: entry.plan.local,
                    upstream: entry.plan.upstream,
                    reason: entry.plan.reason
                }))
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
    app.post("/core/network/fetch", networkFetchHandler);
    app.post("/api/network/fetch", networkFetchHandler);
    app.post("/core/request/fetch", legacyNetworkFetchAlias);
    app.post("/api/request/fetch", legacyNetworkFetchAlias);

    app.post("/core/ops/notify", notifyHandler);
    app.post("/api/action", actionHandler);
};
