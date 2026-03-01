import { Buffer } from "node:buffer";
import { createDecipheriv, createHash, createVerify, randomUUID } from "node:crypto";
import { networkInterfaces, hostname as getHostName } from "node:os";
import { WebSocket } from "ws";
import { normalizeTunnelRoutingFrame } from "./messages.ts";
import { pickEnvBoolLegacy, pickEnvListLegacy, pickEnvNumberLegacy, pickEnvStringLegacy } from "../../lib/env.ts";
import { parsePortableInteger, safeJsonParse } from "../../lib/parsing.ts";

type UpstreamConnectorConfig = {
    enabled?: boolean;
    mode?: "active" | "passive";
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
    upstreamMasterKey?: string;
    upstreamSigningPrivateKeyPem?: string;
    upstreamPeerPublicKeyPem?: string;
    deviceId?: string;
    namespace?: string;
    reconnectMs?: number;
};

type EndpointConfig = {
    roles?: string[];
    upstream?: UpstreamConnectorConfig;
};

type RunningClient = {
    stop: () => void;
    isRunning: () => boolean;
    send: (payload: unknown) => boolean;
    getStatus: () => {
        running: boolean;
        connected: boolean;
        upstreamEnabled: boolean;
        upstreamMode?: "active" | "passive";
        upstreamPeerId?: string;
        upstreamClientId?: string;
        upstreamRole: "active-connector" | "passive-connector";
        origin?: {
            originId?: string;
            originHosts?: string[];
            originDomains?: string[];
            originMasks?: string[];
            surface?: string;
        };
        endpointUrl?: string;
        upstreamEndpoints?: string[];
        activeEndpoint?: string;
        userId?: string;
        deviceId?: string;
        namespace?: string;
    };
};

type UpstreamMessageHandler = (message: any, rawText: string, cfg: UpstreamConnectorConfig) => void;

type UpstreamClientOptions = {
    onMessage?: UpstreamMessageHandler;
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
const shouldRejectUnauthorized = pickEnvBoolLegacy("CWS_UPSTREAM_REJECT_UNAUTHORIZED", true) !== false;
const invalidCredentialsRetryMs = Math.max(
    1000,
    pickEnvNumberLegacy("CWS_UPSTREAM_INVALID_CREDENTIALS_RETRY_MS", 30000) ?? 30000
);
const TLS_VERIFY_ERRORS = [
    "unable to verify the first certificate",
    "self signed certificate",
    "certificate has expired",
    "certificate is not yet valid",
    "self signed certificate in certificate chain",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
];

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
    return String(value || "").trim().toLowerCase();
};

const normalizeInterfaceAddress = (value: string): string => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const withoutZone = raw.split("%")[0];
    const trimmed = withoutZone.replace(/^\[(.*)\]$/, "$1");
    return normalizeHost(trimmed);
};

const getLocalUpstreamHosts = (): Set<string> => {
    const hosts = new Set<string>([
        "localhost",
        "127.0.0.1",
        "::1",
        normalizeHost(getHostName())
    ]);
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
        return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
};
const parseUpstreamMode = (value: unknown): "active" | "passive" | undefined => {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === "active" || normalized === "keepalive") return "active";
    if (normalized === "passive") return "passive";
    return undefined;
};

let invalidCredentialBlockUntil = 0;

const formatHintForInvalidCredentials = (userId?: string, deviceId?: string, endpoint?: string) => {
    return `Invalid upstream credentials for userId="${userId || "-"}" deviceId="${deviceId || "-"}" endpoint="${endpoint || "-"}". ` +
        "Create or align this user on the target endpoint via `/core/auth/register` (POST {\"userId\":\"...\",\"userKey\":\"...\",\"encrypt\":false}) " +
        "then set the same upstream.userId/upstream.userKey in both endpoints.";
};

const normalizeRoleSet = (roles: unknown): Set<string> => {
    if (!Array.isArray(roles)) return new Set<string>();
    return new Set(
        roles
            .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
            .filter((value) => value.length > 0)
    );
};

/**
 * Endpoint role model is split into:
 * - upstream connector (this process): starts reverse WS/WebSocket client and pushes frames to upstream gateway
 * - upstream gateway/origin (remote endpoint): accepts reverse socket and proxies/reroutes messages for peers and connected clients
 */
const isConnectorRoleEnabled = (config: EndpointConfig): boolean => {
    const roles = normalizeRoleSet(config.roles);
    if (roles.size === 0) return true;
    return roles.has("client") || roles.has("peer") || roles.has("node") || roles.has("hub");
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

const decodeServerPayload = (rawText: string, cfg: Required<UpstreamConnectorConfig>): EnvelopePayload | null => {
    if (!cfg.upstreamMasterKey?.trim()) {
        return parseJson(rawText);
    }

    const parsedCandidates = [parseJson(rawText), parseBase64Envelope(rawText)];
    const key = buildAesKey(cfg.upstreamMasterKey);

    for (const parsed of parsedCandidates) {
        if (!isValidEnvelope(parsed)) continue;

        const encryptedBlock = Buffer.from(parsed.cipher, "base64");
        if (encryptedBlock.length <= 28) continue;

        const signature = Buffer.from(parsed.sig, "base64");
        if (!verifySignedBlock(cfg.upstreamPeerPublicKeyPem, encryptedBlock, signature)) continue;

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

const normalizeUpstreamConfig = (config: EndpointConfig): Required<UpstreamConnectorConfig> | null => {
    const upstream = config?.upstream || {};
    const envUpstreamEnabled = pickEnvBoolLegacy("CWS_UPSTREAM_ENABLED");
    const envUpstreamMode = parseUpstreamMode(pickEnvStringLegacy("CWS_UPSTREAM_MODE") || "");
    const envUpstreamClientId = pickEnvStringLegacy("CWS_ASSOCIATED_ID") || pickEnvStringLegacy("CWS_UPSTREAM_CLIENT_ID") || "";
    const envEndpointUrl = pickEnvStringLegacy("CWS_UPSTREAM_ENDPOINT_URL") || "";
    const envEndpoints = pickEnvListLegacy("CWS_UPSTREAM_ENDPOINTS") || [];
    const envUserId = pickEnvStringLegacy("CWS_ASSOCIATED_ID") || pickEnvStringLegacy("CWS_UPSTREAM_USER_ID") || pickEnvStringLegacy("CWS_UPSTREAM_CLIENT_ID") || "";
    const envUserKey = pickEnvStringLegacy("CWS_ASSOCIATED_TOKEN") || pickEnvStringLegacy("CWS_UPSTREAM_USER_KEY") || "";
    const envDeviceId = pickEnvStringLegacy("CWS_ASSOCIATED_ID") || pickEnvStringLegacy("CWS_UPSTREAM_DEVICE_ID") || "";
    const envNamespace = pickEnvStringLegacy("CWS_UPSTREAM_NAMESPACE") || "";
    const envReconnectMs = pickEnvNumberLegacy("CWS_UPSTREAM_RECONNECT_MS", 0);

    const enabled = envUpstreamEnabled === undefined ? upstream.enabled === true : envUpstreamEnabled;
    const mode = envUpstreamMode || parseUpstreamMode(upstream.mode) || "active";
    const originConfig = (upstream as Record<string, any>).origin || {};
    const normalizeOriginToken = (value: unknown) => {
        return String(value || "").trim();
    };
    const origin = {
        originId: normalizeOriginToken((upstream as Record<string, any>).originId || originConfig.originId),
        originHosts: normalizeOriginList(
            originConfig.hosts || originConfig.host || (upstream as Record<string, any>).originHosts
        ),
        originDomains: normalizeOriginList(
            originConfig.domains || (upstream as Record<string, any>).originDomains
        ),
        originMasks: normalizeOriginList(
            originConfig.masks || (upstream as Record<string, any>).originMasks
        ),
        surface: normalizeOriginToken(originConfig.surface || (upstream as Record<string, any>).originSurface).toLowerCase() || "external"
    };
    const endpointEntries = envEndpoints.length
        ? envEndpoints
        : Array.isArray(upstream.endpoints)
            ? upstream.endpoints
            : typeof upstream.endpointUrl === "string"
                ? [upstream.endpointUrl]
            : [];
    const normalizedEndpoints = endpointEntries
        .map((item) => String(item ?? "").trim())
        .filter((item) => !!item);
    const uniqueEndpoints = Array.from(new Set(normalizedEndpoints));

    const endpointUrl = envEndpointUrl || (typeof upstream.endpointUrl === "string"
        ? upstream.endpointUrl.trim()
        : uniqueEndpoints[0] || "");
    const userId = envUserId || (typeof upstream.userId === "string" ? upstream.userId.trim() : "");
    const userKey = envUserKey || (typeof upstream.userKey === "string" ? upstream.userKey.trim() : "");
    const clientId = envUpstreamClientId || (typeof upstream.clientId === "string" ? upstream.clientId.trim() : "");
    if (!enabled) {
        if (isTunnelDebug) {
            console.info(
                `[upstream.connector] disabled: enabled=false`,
                `roles=${formatEndpointList(Array.isArray(config.roles) ? config.roles : [])}`,
                `endpointUrl=${endpointUrl || "-"}`,
                `userId=${maskValue(userId)}`,
                `userKey=${maskValue(userKey)}`
            );
        }
        return null;
    }
    if (mode === "active" && (!endpointUrl || !userId || !userKey)) {
        const missing: string[] = [];
        if (!endpointUrl) missing.push("endpointUrl");
        if (!userId) missing.push("userId");
        if (!userKey) missing.push("userKey");
        console.warn(
            `[upstream.connector] disabled: active mode requires credentials and endpoint`,
            `missing=${missing.join(",") || "none"}`,
            `endpointUrl=${endpointUrl || "-"}`,
            `userId=${userId ? "***" : "-"}`,
            `userKey=${userKey ? "***" : "-"}`
        );
        return null;
    }

    const reconnectMs = parsePortableInteger(upstream.reconnectMs);
    return {
        enabled: true,
        mode,
        upstreamMasterKey: upstream.upstreamMasterKey,
        upstreamSigningPrivateKeyPem: upstream.upstreamSigningPrivateKeyPem,
        upstreamPeerPublicKeyPem: upstream.upstreamPeerPublicKeyPem,
        origin: {
            originId: origin.originId || normalizeOriginToken(upstream.deviceId || upstream.userId),
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
        deviceId: envDeviceId || (typeof upstream.deviceId === "string" && upstream.deviceId.trim()
            ? upstream.deviceId.trim()
            : `endpoint-${randomUUID().replace(/-/g, "").slice(0, 12)}`),
        namespace: envNamespace || (typeof upstream.namespace === "string" && upstream.namespace.trim()
            ? upstream.namespace.trim()
            : "default"),
        reconnectMs: envReconnectMs > 0 ? envReconnectMs : (reconnectMs > 0 ? reconnectMs : 5000)
    };
};

const buildWsUrl = (endpointUrl: string, cfg: Required<UpstreamConnectorConfig>): string | null => {
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
        url.searchParams.set("mode", "reverse");
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

export const startUpstreamPeerClient = (rawConfig: EndpointConfig, options: UpstreamClientOptions = {}): RunningClient | null => {
    if (!isConnectorRoleEnabled(rawConfig)) {
        if (isTunnelDebug) {
            console.info(
            "[upstream.connector] disabled: client/peer/hub role is not enabled",
                `roles=${formatEndpointList(Array.isArray(rawConfig.roles) ? rawConfig.roles : [])}`
            );
        }
        return null;
    }

    const cfg = normalizeUpstreamConfig(rawConfig);
    if (!cfg) return null;
    if (cfg.mode === "passive") {
        if (isTunnelDebug) {
            console.info(
                "[upstream.connector] passive mode: skip reverse connector startup",
                `mode=${cfg.mode}`,
                `roles=${formatEndpointList(Array.isArray(rawConfig.roles) ? rawConfig.roles : [])}`,
                `gatewayCandidates=${formatEndpointList(cfg.endpoints)}`
            );
        }
        let stopped = false;
        return {
            stop: () => {
                if (isTunnelDebug) {
                    console.info("[upstream.connector] passive stop");
                }
                stopped = true;
            },
            send: () => false,
            isRunning: () => !stopped,
            getStatus: () => ({
                running: !stopped,
                connected: false,
                upstreamEnabled: cfg.enabled,
                upstreamRole: "passive-connector",
                upstreamMode: cfg.mode,
                upstreamPeerId: cfg.clientId || cfg.deviceId,
                upstreamClientId: cfg.clientId,
                endpointUrl: "",
                upstreamEndpoints: cfg.endpoints,
                activeEndpoint: "",
                userId: cfg.userId,
                deviceId: cfg.deviceId,
                namespace: cfg.namespace,
                origin: cfg.origin
            })
        };
    }
    if (isTunnelDebug) {
        console.info(
            "[upstream.connector] config accepted",
            `enabled=${cfg.enabled}`,
            `mode=${cfg.mode}`,
            `userId=${maskValue(cfg.userId)}`,
            `endpoint=${cfg.endpointUrl}`,
            `endpoints=${formatEndpointList(cfg.endpoints)}`,
            `namespace=${cfg.namespace}`,
            `deviceId=${cfg.deviceId}`,
            `clientId=${cfg.clientId || cfg.deviceId}`
        );
    }

    const localHosts = getLocalUpstreamHosts();
    const seenSignatures = new Set<string>();
    const addCandidate = (rawCandidate: string, list: string[]) => {
        const item = String(rawCandidate || "").trim();
        if (!item) return;
        if (isSelfLoopCandidate(item, localHosts)) {
            if (isTunnelDebug) {
                console.info("[upstream.connector] skip self endpoint candidate", `candidate=${item}`);
            }
            return;
        }
        const signature = normalizeEndpointSignature(item);
        if (signature && seenSignatures.has(signature)) {
            if (isTunnelDebug) {
                console.info("[upstream.connector] skip duplicate endpoint candidate", `candidate=${item}`, `signature=${signature}`);
            }
            return;
        }
        list.push(item);
        if (signature) seenSignatures.add(signature);
    };

    const upstreamCandidates: string[] = [];
    addCandidate(cfg.endpointUrl || "", upstreamCandidates);
    if (Array.isArray(cfg.endpoints) && cfg.endpoints.length > 0) {
        for (const item of cfg.endpoints) addCandidate(item, upstreamCandidates);
    } else if (!cfg.endpointUrl) {
        if (isTunnelDebug) {
            console.warn("[upstream.connector] disabled: no explicit endpoint candidates", `endpoints=${formatEndpointList(cfg.endpoints)}`, `endpointUrl=${cfg.endpointUrl || "-"}`);
        }
    }


    if (!upstreamCandidates.length) {
        if (isTunnelDebug) {
            console.warn("[upstream.connector] disabled: all candidates are local/self endpoints", `host=${Array.from(localHosts).join("|")}`);
        }
        return null;
    }
    let candidateIndex = Math.max(0, upstreamCandidates.indexOf(cfg.endpointUrl));
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
        reconnectHandle = setTimeout(() => {
            reconnectHandle = null;
            connect();
        }, normalizedDelay && normalizedDelay > 0 ? normalizedDelay : cfg.reconnectMs);
    };

    const setNextEndpoint = () => {
        if (upstreamCandidates.length <= 1) return;
        candidateIndex = (candidateIndex + 1) % upstreamCandidates.length;
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
                console.warn("[upstream.connector] skip reconnect: credentials rejected, waiting", `endpoint=${cfg.endpointUrl}`, `waitMs=${waitMs}`);
            }
            scheduleReconnect(waitMs);
            return;
        }
        try {
            const endpoint = upstreamCandidates[candidateIndex] || cfg.endpointUrl;
            wsUrl = buildWsUrl(endpoint, cfg);
            if (!wsUrl) {
                if (isTunnelDebug) {
                    console.warn("[upstream.connector] cannot build ws url", `candidate=${endpoint}`);
                }
                setNextEndpoint();
                scheduleReconnect();
                return;
            }
            activeEndpoint = endpoint;
            if (isTunnelDebug) {
                console.info("[upstream.connector] connecting", `endpoint=${endpoint}`, `url=${wsUrl}`);
            }
            socket = new WebSocket(wsUrl, {
                rejectUnauthorized: shouldRejectUnauthorized
            });
        } catch {
            if (isTunnelDebug) {
                console.error("[upstream.connector] connection setup failed", `candidate=${upstreamCandidates[candidateIndex]}`);
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
                console.info("[upstream.connector] connected", `endpoint=${activeEndpoint}`);
            }
            clearConnectTimeout();
            clearReconnect();
            clearHeartbeat();
            socket?.send(`{"type":"hello","deviceId":"${cfg.deviceId}"}`);
            heartbeatHandle = setInterval(() => {
                socket?.send(`{"type":"ping","ts":${Date.now()}}`);
            }, 20_000);
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

                options.onMessage?.(
                    normalizeTunnelRoutingFrame(parsed, cfg.deviceId || cfg.userId || rawConfig?.upstream?.userId || "", { via: cfg.endpointUrl }),
                    text,
                    cfg
                );
            } catch {
                // ignore malformed payloads
            }
        });

        socket.on("close", (code: number, reason: Buffer | string) => {
            if (isTunnelDebug) {
                const active = upstreamCandidates[candidateIndex] || cfg.endpointUrl;
                const reasonText = formatCloseReason(reason);
                const normalizedReason = reasonText.toLowerCase();
                console.warn("[upstream.connector] closed", `endpoint=${active}`, `code=${code}`, reasonText ? `reason=${reasonText}` : "");
                if (code === 4001 && normalizedReason.includes("invalid credentials")) {
                    invalidCredentialBlockUntil = Date.now() + invalidCredentialsRetryMs;
                    console.error("[upstream.connector] rejected by gateway", formatHintForInvalidCredentials(cfg.userId, cfg.deviceId, active));
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
                console.error("[upstream.connector] socket error", message);
                if (isTlsVerifyError(message)) {
                    console.warn("[upstream.connector] tls verify error", `endpoint=${upstreamCandidates[candidateIndex] || cfg.endpointUrl}`, "set CWS_UPSTREAM_REJECT_UNAUTHORIZED=false if certificate is self-signed");
                }
            }
            socket?.close(4001, "upstream-error");
        });
    };

    connect();

    return {
        stop: () => {
            if (isTunnelDebug) {
                console.info("[upstream.connector] stopping");
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
                        console.warn(
                            "[upstream.connector] send blocked",
                            `state=${socket ? String(socket.readyState) : "null"}`,
                            `endpoint=${activeEndpoint}`
                        );
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
            upstreamEnabled: cfg.enabled,
            upstreamRole: "active-connector",
            upstreamPeerId: cfg.clientId || cfg.deviceId,
            upstreamMode: cfg.mode,
            origin: cfg.origin,
            upstreamClientId: cfg.clientId,
            endpointUrl: wsUrl,
            upstreamEndpoints: upstreamCandidates,
            activeEndpoint,
            userId: cfg.userId,
            deviceId: cfg.deviceId,
            namespace: cfg.namespace
        })
    };
};
