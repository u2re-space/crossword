import { Buffer } from "node:buffer";
import { createDecipheriv, createHash, createVerify, randomUUID } from "node:crypto";
import { networkInterfaces, hostname as getHostName } from "node:os";
import { WebSocket } from "ws";
import { normalizeTunnelRoutingFrame } from "./messages.ts";
import { pickEnvBoolLegacy, pickEnvListLegacy, pickEnvNumberLegacy, pickEnvStringLegacy } from "../../lib/env.ts";
import { parsePortableInteger, resolvePortableTextValue, safeJsonParse } from "../../lib/parsing.ts";
import {
    supportsConnectorRole,
    parseWsArchetype,
    describeArchetype
} from "./archetypes.ts";

type BridgeConnectorConfig = {
    enabled?: boolean;
    mode?: "active" | "passive";
    archetype?: string;
    origin?: {
        originId?: string;
        originHosts?: string[];
        originDomains?: string[];
        originMasks?: string[];
        surface?: string;
    };
    clientId?: string;
    endpointUrl?: string;
    endpoints?: string[];
    userId?: string;
    userKey?: string;
    bridgeMasterKey?: string;
    bridgeSigningPrivateKeyPem?: string;
    bridgePeerPublicKeyPem?: string;
    deviceId?: string;
    namespace?: string;
    reconnectMs?: number;
};

type EndpointConfig = {
    roles?: string[];
    bridge?: BridgeConnectorConfig;
};

type RunningClient = {
    stop: () => void;
    isRunning: () => boolean;
    send: (payload: unknown) => boolean;
    getStatus: () => {
        running: boolean;
        connected: boolean;
        bridgeEnabled: boolean;
        bridgeMode?: "active" | "passive";
        bridgePeerId?: string;
        bridgeClientId?: string;
        bridgeRole: "active-connector" | "passive-connector";
        origin?: {
            originId?: string;
            originHosts?: string[];
            originDomains?: string[];
            originMasks?: string[];
            surface?: string;
        };
        endpointUrl?: string;
        bridgeEndpoints?: string[];
        activeEndpoint?: string;
        userId?: string;
        deviceId?: string;
        namespace?: string;
    };
};

type BridgeMessageHandler = (message: any, rawText: string, cfg: BridgeConnectorConfig) => void;

type BridgeClientOptions = {
    onMessage?: BridgeMessageHandler;
};

type EnvelopePayload = {
    from?: string;
    type?: string;
    action?: string;
    payload?: any;
    data?: any;
    body?: any;
    targetId?: string;
    target?: string;
    deviceId?: string;
    namespace?: string;
    ns?: string;
    to?: string;
    broadcast?: boolean;
    [key: string]: any;
};

const isTunnelDebug = pickEnvBoolLegacy("CWS_TUNNEL_DEBUG") === true;
const shouldRejectUnauthorized = pickEnvBoolLegacy("CWS_BRIDGE_REJECT_UNAUTHORIZED", true) !== false;
const invalidCredentialsRetryMs = Math.max(1000, pickEnvNumberLegacy("CWS_BRIDGE_INVALID_CREDENTIALS_RETRY_MS", 30000) ?? 30000);
const TLS_VERIFY_ERRORS = ["unable to verify the first certificate", "self signed certificate", "certificate has expired", "certificate is not yet valid", "self signed certificate in certificate chain", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE"];

const isControlLikeRole = (roles: string[] | undefined): boolean => {
    if (!Array.isArray(roles)) return false;
    const normalized = roles.map((role) => String(role || "").trim().toLowerCase());
    const forwardHints = new Set([
        "client-forward",
        "forward-client",
        "client-bridge",
        "server-bridge",
        "forward-server",
        "server-forward",
        "control",
        "control-panel",
        "ops",
        "admin"
    ]);
    return normalized.some((role) => forwardHints.has(role));
};

const canonicalConnectorArchetype = (value: string | undefined, roles: string[] | undefined): "client-reverse" | "client-forward" => {
    const parsed = parseWsArchetype(value);
    if (parsed === "server-forward") return "client-forward";
    if (parsed === "server-reverse") return "client-reverse";
    if (parsed) return parsed;

    const raw = (value || "").trim();
    const normalizedRaw = raw.toLowerCase();
    const rawLooksLikeControl = ["forward", "push", "control", "manage", "admin", "ops"].some((token) => normalizedRaw.includes(token));
    const fallback = isControlLikeRole(roles) || rawLooksLikeControl ? "client-forward" : "client-reverse";
    const intent = fallback === "client-forward" ? "control/management path" : "connect/join path";
    console.warn(
        "[bridge.connector] archetype is missing or unsupported, fallback to canonical",
        `rawArchetype=${raw || "-"}`,
        `fallback=${fallback}`,
        `intent=${intent}`
    );
    return fallback;
};

const isTlsVerifyError = (message: string) => {
    const lower = (message || "").toLowerCase();
    return TLS_VERIFY_ERRORS.some((fragment) => lower.includes(fragment.toLowerCase()));
};

const formatEndpointList = (items: string[] | undefined): string => {
    if (!Array.isArray(items) || !items.length) return "-";
    return items.join(" | ");
};

const maskValue = (value: string): string => {
    if (!value) return "-";
    if (value.length <= 6) return `***(${value.length})`;
    return `${value.slice(0, 2)}...${value.slice(-2)}(${value.length})`;
};

const normalizeHost = (value: string): string => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

const normalizeInterfaceAddress = (value: string): string => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const withoutZone = raw.split("%")[0];
    const trimmed = withoutZone.replace(/^\[(.*)\]$/, "$1");
    return normalizeHost(trimmed);
};

const getLocalBridgeHosts = (): Set<string> => {
    const hosts = new Set<string>(["localhost", "127.0.0.1", "::1", normalizeHost(getHostName())]);
    const interfaces = networkInterfaces();
    for (const entryList of Object.values(interfaces || {})) {
        if (!entryList) continue;
        for (const entry of entryList) {
            if (!entry?.address) continue;
            hosts.add(normalizeInterfaceAddress(entry.address));
        }
    }
    return hosts;
};

const isSelfLoopCandidate = (endpoint: string, localHosts: Set<string>): boolean => {
    const rawEndpoint = String(endpoint || "").trim();
    if (!rawEndpoint) return true;
    try {
        const candidate = rawEndpoint.includes("://") ? rawEndpoint : `https://${rawEndpoint}`;
        const parsed = new URL(candidate);
        const host = normalizeHost(parsed.hostname);
        return host ? localHosts.has(host) : false;
    } catch {
        return false;
    }
};

const normalizeEndpointSignature = (value: string): string => {
    const rawEndpoint = String(value || "").trim();
    if (!rawEndpoint) return "";
    try {
        const candidate = rawEndpoint.includes("://") ? rawEndpoint : `https://${rawEndpoint}`;
        const parsed = new URL(candidate);
        const host = normalizeHost(parsed.hostname);
        if (!host) return "";
        const port = parsed.port || (parsed.protocol === "https:" || parsed.protocol === "wss:" ? "443" : parsed.protocol === "http:" || parsed.protocol === "ws:" ? "80" : "");
        return `${host}:${port}`;
    } catch {
        return "";
    }
};

const formatCloseReason = (reason: Buffer | string | undefined): string => {
    if (!reason) return "";
    if (typeof reason === "string") return reason;
    try {
        return reason.toString();
    } catch {
        return "";
    }
};

const normalizeOriginList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(/[;,]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const normalizeBridgeTextValue = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return resolvePortableTextValue(value).trim();
};

const pickBridgePolicyToken = (policies: unknown, userId: string): string => {
    if (!policies || typeof policies !== "object" || !userId) return "";
    const source = policies as Record<string, unknown>;
    const candidates = [userId, userId.toLowerCase()];
    const policy = candidates.map((candidate) => source[candidate]).find((item) => item && typeof item === "object") as Record<string, unknown> | undefined;
    if (!policy) return "";
    const rawTokens = policy.tokens;
    if (Array.isArray(rawTokens)) {
        for (const token of rawTokens) {
            const resolved = normalizeBridgeTextValue(String(token || ""));
            if (resolved && resolved !== "*") return resolved;
        }
    } else if (typeof rawTokens === "string") {
        const resolved = normalizeBridgeTextValue(rawTokens);
        if (resolved && resolved !== "*") return resolved;
    }
    return "";
};
const parseBridgeMode = (value: unknown): "active" | "passive" | undefined => {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === "active" || normalized === "keepalive") return "active";
    if (normalized === "passive") return "passive";
    return undefined;
};

let invalidCredentialBlockUntil = 0;

const formatHintForInvalidCredentials = (userId?: string, deviceId?: string, endpoint?: string) => {
    return `Invalid bridge credentials for userId="${userId || "-"}" deviceId="${deviceId || "-"}" endpoint="${endpoint || "-"}". ` + 'Create or align this user on the target endpoint via `/core/auth/register` (POST {"userId":"...","userKey":"...","encrypt":false}) ' + "then set the same bridge.userId/bridge.userKey in both endpoints.";
};

/**
 * Endpoint role model is split into:
 * - bridge connector (this process): starts reverse WS/WebSocket client and pushes frames to bridge gateway
 * - bridge gateway/origin (remote endpoint): accepts reverse socket and proxies/reroutes messages for peers and connected clients
 */
const isConnectorRoleEnabled = (config: EndpointConfig): boolean => {
    return supportsConnectorRole(config.roles);
};

const buildAesKey = (secret: string) => {
    return createHash("sha256").update(secret).digest();
};

const isValidEnvelope = (value: unknown): value is { from: string; cipher: string; sig: string } => {
    if (!value || typeof value !== "object") return false;
    const envelope = value as Record<string, unknown>;
    return typeof envelope.from === "string" && typeof envelope.cipher === "string" && typeof envelope.sig === "string";
};

const verifySignedBlock = (peerPublicKeyPem: string | undefined, block: Buffer, sig: Buffer): boolean => {
    if (!sig.length) return true;
    if (!peerPublicKeyPem?.trim()) return true;
    try {
        const verifier = createVerify("RSA-SHA256");
        verifier.update(block);
        verifier.end();
        return verifier.verify(peerPublicKeyPem, sig);
    } catch {
        return false;
    }
};

const parseJson = (rawText: string): any | null => {
    return safeJsonParse<Record<string, any>>(rawText, null);
};

const parseBase64Envelope = (rawText: string): any | null => {
    try {
        const decoded = Buffer.from(rawText, "base64").toString("utf8");
        return parseJson(decoded);
    } catch {
        return null;
    }
};

const decodeServerPayload = (rawText: string, cfg: Required<BridgeConnectorConfig>): EnvelopePayload | null => {
    if (!cfg.bridgeMasterKey?.trim()) {
        return parseJson(rawText);
    }

    const parsedCandidates = [parseJson(rawText), parseBase64Envelope(rawText)];
    const key = buildAesKey(cfg.bridgeMasterKey);

    for (const parsed of parsedCandidates) {
        if (!isValidEnvelope(parsed)) continue;

        const encryptedBlock = Buffer.from(parsed.cipher, "base64");
        if (encryptedBlock.length <= 28) continue;

        const signature = Buffer.from(parsed.sig, "base64");
        if (!verifySignedBlock(cfg.bridgePeerPublicKeyPem, encryptedBlock, signature)) continue;

        const iv = encryptedBlock.subarray(0, 12);
        const encryptedWithTag = encryptedBlock.subarray(12);
        const encrypted = encryptedWithTag.subarray(0, Math.max(0, encryptedWithTag.length - 16));
        const authTag = encryptedWithTag.subarray(Math.max(0, encryptedWithTag.length - 16));

        try {
            const decipher = createDecipheriv("aes-256-gcm", key, iv);
            decipher.setAuthTag(authTag);
            const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            const inner = parseJson(plain.toString("utf8"));
            if (inner && typeof inner === "object") return inner as EnvelopePayload;
        } catch {
            continue;
        }
    }

    return parseJson(rawText);
};

const normalizeBridgeConfig = (config: EndpointConfig): Required<BridgeConnectorConfig> | null => {
    const bridge = config?.bridge || {};
    const envBridgeEnabled = pickEnvBoolLegacy("CWS_BRIDGE_ENABLED") ?? pickEnvBoolLegacy("CWS_UPSTREAM_ENABLED");
    const envBridgeMode = parseBridgeMode(pickEnvStringLegacy("CWS_BRIDGE_MODE") || pickEnvStringLegacy("CWS_UPSTREAM_MODE") || "");
    const envBridgeClientId = pickEnvStringLegacy("CWS_ASSOCIATED_ID") || pickEnvStringLegacy("CWS_BRIDGE_CLIENT_ID") || pickEnvStringLegacy("CWS_UPSTREAM_CLIENT_ID") || "";
    const envEndpointUrl = pickEnvStringLegacy("CWS_BRIDGE_ENDPOINT_URL") || pickEnvStringLegacy("CWS_UPSTREAM_ENDPOINT_URL") || "";
    const envEndpoints = pickEnvListLegacy("CWS_BRIDGE_ENDPOINTS") || pickEnvListLegacy("CWS_UPSTREAM_ENDPOINTS") || [];
    const envUserId = pickEnvStringLegacy("CWS_ASSOCIATED_ID") || pickEnvStringLegacy("CWS_BRIDGE_USER_ID") || pickEnvStringLegacy("CWS_UPSTREAM_USER_ID") || pickEnvStringLegacy("CWS_BRIDGE_CLIENT_ID") || pickEnvStringLegacy("CWS_UPSTREAM_CLIENT_ID") || "";
    const envUserKey = pickEnvStringLegacy("CWS_ASSOCIATED_TOKEN") || pickEnvStringLegacy("CWS_BRIDGE_USER_KEY") || pickEnvStringLegacy("CWS_UPSTREAM_USER_KEY") || "";
    const envDeviceId = pickEnvStringLegacy("CWS_ASSOCIATED_ID") || pickEnvStringLegacy("CWS_BRIDGE_DEVICE_ID") || pickEnvStringLegacy("CWS_UPSTREAM_DEVICE_ID") || "";
    const envNamespace = pickEnvStringLegacy("CWS_BRIDGE_NAMESPACE") || pickEnvStringLegacy("CWS_UPSTREAM_NAMESPACE") || "";
    const envArchetype = pickEnvStringLegacy("CWS_BRIDGE_ARCHETYPE") || pickEnvStringLegacy("CWS_UPSTREAM_ARCHETYPE") || "";
    const envReconnectMs = pickEnvNumberLegacy("CWS_BRIDGE_RECONNECT_MS") ?? pickEnvNumberLegacy("CWS_UPSTREAM_RECONNECT_MS") ?? 0;

    const enabled = envBridgeEnabled === undefined ? bridge.enabled === true : envBridgeEnabled;
    const mode = envBridgeMode || parseBridgeMode(bridge.mode) || "active";
    const originConfig = (bridge as Record<string, any>).origin || {};
    const normalizeOriginToken = (value: unknown) => {
        return String(value || "").trim();
    };
    const origin = {
        originId: normalizeOriginToken((bridge as Record<string, any>).originId || originConfig.originId),
        originHosts: normalizeOriginList(originConfig.hosts || originConfig.host || (bridge as Record<string, any>).originHosts),
        originDomains: normalizeOriginList(originConfig.domains || (bridge as Record<string, any>).originDomains),
        originMasks: normalizeOriginList(originConfig.masks || (bridge as Record<string, any>).originMasks),
        surface: normalizeOriginToken(originConfig.surface || (bridge as Record<string, any>).originSurface).toLowerCase() || "external"
    };
    const resolvedEndpointUrl = normalizeBridgeTextValue(bridge.endpointUrl);
    const resolvedClientId = normalizeBridgeTextValue(bridge.clientId);
    const resolvedUserId = normalizeBridgeTextValue(bridge.userId);
    const resolvedUserKey = normalizeBridgeTextValue(bridge.userKey);
    const resolvedDeviceId = normalizeBridgeTextValue(bridge.deviceId);
    const resolvedNamespace = normalizeBridgeTextValue(bridge.namespace);
    const endpointEntries = envEndpoints.length ? envEndpoints : resolvedEndpointUrl ? [resolvedEndpointUrl] : Array.isArray(bridge.endpoints) ? bridge.endpoints : [];
    const normalizedEndpoints = endpointEntries.map((item) => String(item ?? "").trim()).filter((item) => !!item);
    const uniqueEndpoints = Array.from(new Set(normalizedEndpoints));

    const endpointUrl = normalizeBridgeTextValue(envEndpointUrl) || resolvedEndpointUrl || uniqueEndpoints[0] || "";
    const userId = envUserId || resolvedUserId || resolvedClientId || resolvedDeviceId;
    const userKey = envUserKey || resolvedUserKey || pickBridgePolicyToken((config as Record<string, any>).endpointIDs, userId);
    const clientId = envBridgeClientId || resolvedClientId || resolvedUserId || resolvedDeviceId;
    if (!enabled) {
        if (isTunnelDebug) {
            console.info(`[bridge.connector] disabled: enabled=false`, `roles=${formatEndpointList(Array.isArray(config.roles) ? config.roles : [])}`, `endpointUrl=${endpointUrl || "-"}`, `userId=${maskValue(userId)}`, `userKey=${maskValue(userKey)}`);
        }
        return null;
    }
    if (mode === "active" && (!endpointUrl || !userId || !userKey)) {
        const missing: string[] = [];
        if (!endpointUrl) missing.push("endpointUrl");
        if (!userId) missing.push("userId");
        if (!userKey) missing.push("userKey");
        console.warn(`[bridge.connector] disabled: active mode requires credentials and endpoint`, `missing=${missing.join(",") || "none"}`, `endpointUrl=${endpointUrl || "-"}`, `userId=${userId ? "***" : "-"}`, `userKey=${userKey ? "***" : "-"}`);
        return null;
    }

    const reconnectMs = parsePortableInteger(bridge.reconnectMs);
    return {
        enabled: true,
        mode,
        archetype: describeArchetype(canonicalConnectorArchetype(envArchetype || bridge.archetype, config.roles as string[] | undefined)),
        bridgeMasterKey: bridge.bridgeMasterKey,
        bridgeSigningPrivateKeyPem: bridge.bridgeSigningPrivateKeyPem,
        bridgePeerPublicKeyPem: bridge.bridgePeerPublicKeyPem,
        origin: {
            originId: origin.originId || normalizeOriginToken(origin.originId || resolvedDeviceId || resolvedUserId),
            originHosts: origin.originHosts,
            originDomains: origin.originDomains,
            originMasks: origin.originMasks,
            surface: origin.surface || "external"
        },
        endpoints: uniqueEndpoints,
        endpointUrl,
        userId,
        userKey,
        clientId,
        deviceId: envDeviceId || resolvedDeviceId || `endpoint-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        namespace: envNamespace || resolvedNamespace || "default",
        reconnectMs: envReconnectMs > 0 ? envReconnectMs : reconnectMs > 0 ? reconnectMs : 5000
    };
};

const buildWsUrl = (endpointUrl: string, cfg: Required<BridgeConnectorConfig>): string | null => {
    try {
        const rawEndpoint = endpointUrl.trim().replace(/\/+$/, "");
        if (!rawEndpoint) return null;

        const candidate = rawEndpoint.includes("://") ? rawEndpoint : `https://${rawEndpoint}`;
        const url = new URL(candidate);
        if (url.protocol === "https:") {
            url.protocol = "wss:";
        } else if (url.protocol === "http:") {
            url.protocol = "ws:";
        } else if (url.protocol !== "ws:" && url.protocol !== "wss:") {
            return null;
        }
        const hasWsPath = /\/ws(?:[/?#]|$)/.test(url.pathname);
        if (!hasWsPath) {
            const normalizedPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
            url.pathname = `${normalizedPath}ws`;
        }
        
        const archetype = cfg.archetype || "client-reverse";
        const mode = archetype === "client-forward" ? "push" : "reverse";
        
        url.searchParams.set("mode", mode);
        url.searchParams.set("archetype", archetype);
        url.searchParams.set("userId", cfg.userId);
        url.searchParams.set("userKey", cfg.userKey);
        url.searchParams.set("namespace", cfg.namespace);
        url.searchParams.set("deviceId", cfg.deviceId);
        if (cfg.clientId?.trim()) {
            url.searchParams.set("label", cfg.clientId.trim());
            url.searchParams.set("clientId", cfg.clientId.trim());
        }
        return url.toString();
    } catch {
        return null;
    }
};

export const startBridgePeerClient = (rawConfig: EndpointConfig, options: BridgeClientOptions = {}): RunningClient | null => {
    if (!isConnectorRoleEnabled(rawConfig)) {
        if (isTunnelDebug) {
            console.info("[bridge.connector] disabled: connector role is not enabled", `roles=${formatEndpointList(Array.isArray(rawConfig.roles) ? rawConfig.roles : [])}`);
        }
        return null;
    }

    const cfg = normalizeBridgeConfig(rawConfig);
    if (!cfg) return null;
    if (cfg.mode === "passive") {
        if (isTunnelDebug) {
            console.info("[bridge.connector] passive mode: skip reverse connector startup", `mode=${cfg.mode}`, `roles=${formatEndpointList(Array.isArray(rawConfig.roles) ? rawConfig.roles : [])}`, `gatewayCandidates=${formatEndpointList(cfg.endpoints)}`);
        }
        let stopped = false;
        return {
            stop: () => {
                if (isTunnelDebug) {
                    console.info("[bridge.connector] passive stop");
                }
                stopped = true;
            },
            send: () => false,
            isRunning: () => !stopped,
            getStatus: () => ({
                running: !stopped,
                connected: false,
                bridgeEnabled: cfg.enabled,
                bridgeRole: "passive-connector",
                bridgeMode: cfg.mode,
                bridgePeerId: cfg.clientId || cfg.deviceId,
                bridgeClientId: cfg.clientId,
                endpointUrl: "",
                bridgeEndpoints: cfg.endpoints,
                activeEndpoint: "",
                userId: cfg.userId,
                deviceId: cfg.deviceId,
                namespace: cfg.namespace,
                origin: cfg.origin
            })
        };
    }
    if (isTunnelDebug) {
            console.info("[bridge.connector] config accepted", `enabled=${cfg.enabled}`, `mode=${cfg.mode}`, `archetype=${cfg.archetype}`, `userId=${maskValue(cfg.userId)}`, `endpoint=${cfg.endpointUrl}`, `endpoints=${formatEndpointList(cfg.endpoints)}`, `namespace=${cfg.namespace}`, `deviceId=${cfg.deviceId}`, `clientId=${cfg.clientId || cfg.deviceId}`);
    }

    const localHosts = getLocalBridgeHosts();
    const seenSignatures = new Set<string>();
    const addCandidate = (rawCandidate: string, list: string[]) => {
        const item = String(rawCandidate || "").trim();
        if (!item) return;
        if (isSelfLoopCandidate(item, localHosts)) {
            if (isTunnelDebug) {
                console.info("[bridge.connector] skip self endpoint candidate", `candidate=${item}`);
            }
            return;
        }
        const signature = normalizeEndpointSignature(item);
        if (signature && seenSignatures.has(signature)) {
            if (isTunnelDebug) {
                console.info("[bridge.connector] skip duplicate endpoint candidate", `candidate=${item}`, `signature=${signature}`);
            }
            return;
        }
        list.push(item);
        if (signature) seenSignatures.add(signature);
    };

    const bridgeCandidates: string[] = [];
    addCandidate(cfg.endpointUrl || "", bridgeCandidates);
    if (Array.isArray(cfg.endpoints) && cfg.endpoints.length > 0) {
        for (const item of cfg.endpoints) addCandidate(item, bridgeCandidates);
    } else if (!cfg.endpointUrl) {
        if (isTunnelDebug) {
            console.warn("[bridge.connector] disabled: no explicit endpoint candidates", `endpoints=${formatEndpointList(cfg.endpoints)}`, `endpointUrl=${cfg.endpointUrl || "-"}`);
        }
    }

    if (!bridgeCandidates.length) {
        if (isTunnelDebug) {
            console.warn("[bridge.connector] disabled: all candidates are local/self endpoints", `host=${Array.from(localHosts).join("|")}`);
        }
        return null;
    }
    let candidateIndex = Math.max(0, bridgeCandidates.indexOf(cfg.endpointUrl));
    if (candidateIndex < 0) candidateIndex = 0;

    let wsUrl: string | null = null;
    let activeEndpoint = cfg.endpointUrl;

    let socket: WebSocket | null = null;
    let stopped = false;
    let reconnectHandle: ReturnType<typeof setTimeout> | null = null;
    let heartbeatHandle: ReturnType<typeof setInterval> | null = null;
    let connectTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let lastSendWarnAt = 0;

    const clearHeartbeat = () => {
        if (heartbeatHandle) {
            clearInterval(heartbeatHandle);
            heartbeatHandle = null;
        }
    };

    const clearReconnect = () => {
        if (reconnectHandle) {
            clearTimeout(reconnectHandle);
            reconnectHandle = null;
        }
    };

    const scheduleReconnect = (delayMs?: number) => {
        if (stopped) return;
        clearReconnect();
        const normalizedDelay = parsePortableInteger(delayMs);
        reconnectHandle = setTimeout(
            () => {
                reconnectHandle = null;
                connect();
            },
            normalizedDelay && normalizedDelay > 0 ? normalizedDelay : cfg.reconnectMs
        );
    };

    const setNextEndpoint = () => {
        if (bridgeCandidates.length <= 1) return;
        candidateIndex = (candidateIndex + 1) % bridgeCandidates.length;
    };

    const clearConnectTimeout = () => {
        if (connectTimeoutHandle) {
            clearTimeout(connectTimeoutHandle);
            connectTimeoutHandle = null;
        }
    };

    const connect = () => {
        if (stopped) return;
        if (invalidCredentialBlockUntil > Date.now()) {
            const waitMs = Math.max(0, invalidCredentialBlockUntil - Date.now());
            if (isTunnelDebug) {
                console.warn("[bridge.connector] skip reconnect: credentials rejected, waiting", `endpoint=${cfg.endpointUrl}`, `waitMs=${waitMs}`);
            }
            scheduleReconnect(waitMs);
            return;
        }
        try {
            const endpoint = bridgeCandidates[candidateIndex] || cfg.endpointUrl;
            wsUrl = buildWsUrl(endpoint, cfg);
            if (!wsUrl) {
                if (isTunnelDebug) {
                    console.warn("[bridge.connector] cannot build ws url", `candidate=${endpoint}`);
                }
                setNextEndpoint();
                scheduleReconnect();
                return;
            }
            activeEndpoint = endpoint;
            if (isTunnelDebug) {
                console.info("[bridge.connector] connecting", `endpoint=${endpoint}`, `url=${wsUrl}`);
            }
            socket = new WebSocket(wsUrl, {
                rejectUnauthorized: shouldRejectUnauthorized
            });
        } catch {
            if (isTunnelDebug) {
                console.error("[bridge.connector] connection setup failed", `candidate=${bridgeCandidates[candidateIndex]}`);
            }
            setNextEndpoint();
            scheduleReconnect();
            return;
        }

        clearConnectTimeout();
        connectTimeoutHandle = setTimeout(() => {
            if (socket && socket.readyState !== WebSocket.OPEN) {
                socket?.close(4000, "connect-timeout");
                socket = null;
            }
        }, 12_000);

        socket.on("open", () => {
            invalidCredentialBlockUntil = 0;
            if (isTunnelDebug) {
                console.info("[bridge.connector] connected", `endpoint=${activeEndpoint}`);
            }
            clearConnectTimeout();
            clearReconnect();
            clearHeartbeat();
            socket?.send(`{"type":"hello","deviceId":"${cfg.deviceId}"}`);
            heartbeatHandle = setInterval(() => {
                socket?.send(`{"type":"ping","ts":${Date.now()}}`);
            }, 10_000); // 10s ping interval to keep NAT/LTE connections alive
        });

        socket.on("message", (raw) => {
            try {
                const text = typeof raw === "string" ? raw : raw.toString();
                if (!text) return;
                const parsed = decodeServerPayload(text, cfg);
                if (!parsed) return;

                const msgType = String(parsed.type || parsed.action || "").toLowerCase();
                if (msgType === "ping") {
                    socket?.send(`{"type":"pong","ts":${Date.now()}}`);
                    return;
                }
                if (msgType === "pong") return;

                options.onMessage?.(normalizeTunnelRoutingFrame(parsed, cfg.deviceId || cfg.userId || rawConfig?.bridge?.userId || "", { via: cfg.endpointUrl }), text, cfg);
            } catch {
                // ignore malformed payloads
            }
        });

        socket.on("close", (code: number, reason: Buffer | string) => {
            if (isTunnelDebug) {
                const active = bridgeCandidates[candidateIndex] || cfg.endpointUrl;
                const reasonText = formatCloseReason(reason);
                const normalizedReason = reasonText.toLowerCase();
                console.warn("[bridge.connector] closed", `endpoint=${active}`, `code=${code}`, reasonText ? `reason=${reasonText}` : "");
                if (code === 4001 && normalizedReason.includes("invalid credentials")) {
                    invalidCredentialBlockUntil = Date.now() + invalidCredentialsRetryMs;
                    console.error("[bridge.connector] rejected by gateway", formatHintForInvalidCredentials(cfg.userId, cfg.deviceId, active));
                }
            }
            clearConnectTimeout();
            clearHeartbeat();
            socket = null;
            setNextEndpoint();
            const delay = invalidCredentialBlockUntil > Date.now() ? invalidCredentialsRetryMs : cfg.reconnectMs;
            scheduleReconnect(delay);
        });

        socket.on("error", (error) => {
            const message = error instanceof Error ? error.message : String(error);
            if (isTunnelDebug) {
                console.error("[bridge.connector] socket error", message);
                if (isTlsVerifyError(message)) {
                    console.warn("[bridge.connector] tls verify error", `endpoint=${bridgeCandidates[candidateIndex] || cfg.endpointUrl}`, "set CWS_BRIDGE_REJECT_UNAUTHORIZED=false if certificate is self-signed");
                }
            }
            socket?.close(4001, "bridge-error");
        });
    };

    connect();

    return {
        stop: () => {
            if (isTunnelDebug) {
                console.info("[bridge.connector] stopping");
            }
            stopped = true;
            clearReconnect();
            clearHeartbeat();
            clearConnectTimeout();
            if (socket && socket.readyState !== WebSocket.CLOSED) {
                socket.close(1000, "client stop");
            }
            socket = null;
        },
        send: (payload: unknown) => {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                if (isTunnelDebug) {
                    const now = Date.now();
                    if (now - lastSendWarnAt > 5000) {
                        lastSendWarnAt = now;
                        console.warn("[bridge.connector] send blocked", `state=${socket ? String(socket.readyState) : "null"}`, `endpoint=${activeEndpoint}`);
                    }
                }
                return false;
            }
            try {
                const text = typeof payload === "string" ? payload : JSON.stringify(payload);
                socket.send(text);
                return true;
            } catch {
                return false;
            }
        },
        isRunning: () => !stopped,
        getStatus: () => ({
            running: !stopped,
            connected: !!(socket && socket.readyState === WebSocket.OPEN),
            bridgeEnabled: cfg.enabled,
            bridgeRole: "active-connector",
            bridgePeerId: cfg.clientId || cfg.deviceId,
            bridgeMode: cfg.mode,
            origin: cfg.origin,
            bridgeClientId: cfg.clientId,
            endpointUrl: wsUrl,
            bridgeEndpoints: bridgeCandidates,
            activeEndpoint,
            userId: cfg.userId,
            deviceId: cfg.deviceId,
            namespace: cfg.namespace
        })
    };
};
