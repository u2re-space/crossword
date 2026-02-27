import { Buffer } from "node:buffer";
import { createDecipheriv, createHash, createVerify, randomUUID } from "node:crypto";
import { networkInterfaces, hostname as getHostName } from "node:os";
import { WebSocket } from "ws";
import { normalizeTunnelRoutingFrame } from "../routing/index.ts";

type UpstreamPeerConfig = {
    enabled?: boolean;
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
    upstream?: UpstreamPeerConfig;
};

type RunningClient = {
    stop: () => void;
    isRunning: () => boolean;
    send: (payload: unknown) => boolean;
    getStatus: () => {
        running: boolean;
        connected: boolean;
        upstreamEnabled: boolean;
        endpointUrl?: string;
        upstreamEndpoints?: string[];
        activeEndpoint?: string;
        userId?: string;
        deviceId?: string;
        namespace?: string;
    };
};

type UpstreamMessageHandler = (message: any, rawText: string, cfg: UpstreamPeerConfig) => void;

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

const isTunnelDebug = String(process.env.AIRPAD_TUNNEL_DEBUG || "").toLowerCase() === "true";
const shouldRejectUnauthorized = String(process.env.AIRPAD_UPSTREAM_REJECT_UNAUTHORIZED ?? "true").toLowerCase() !== "false";
const invalidCredentialsRetryMs = Math.max(
    1000,
    Number(process.env.AIRPAD_UPSTREAM_INVALID_CREDENTIALS_RETRY_MS ?? "30000") || 30000
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

const parseEnvBoolean = (value: string | undefined): boolean | undefined => {
    if (value === undefined) return undefined;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return undefined;
};

const parseEnvNumber = (value: string | undefined, fallback: number): number => {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseEnvEndpointList = (value: string | undefined): string[] => {
    return String(value || "")
        .split(/[;,]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
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

const isClientRoleEnabled = (config: EndpointConfig): boolean => {
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
    try {
        return JSON.parse(rawText);
    } catch {
        return null;
    }
};

const parseBase64Envelope = (rawText: string): any | null => {
    try {
        const decoded = Buffer.from(rawText, "base64").toString("utf8");
        return parseJson(decoded);
    } catch {
        return null;
    }
};

const decodeServerPayload = (rawText: string, cfg: Required<UpstreamPeerConfig>): EnvelopePayload | null => {
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

const normalizeUpstreamConfig = (config: EndpointConfig): Required<UpstreamPeerConfig> | null => {
    const upstream = config?.upstream || {};
    const envUpstreamEnabled = parseEnvBoolean(process.env.AIRPAD_UPSTREAM_ENABLED);
    const envEndpointUrl = String(process.env.AIRPAD_UPSTREAM_ENDPOINT_URL ?? "").trim();
    const envEndpoints = parseEnvEndpointList(process.env.AIRPAD_UPSTREAM_ENDPOINTS);
    const envUserId = String(process.env.AIRPAD_UPSTREAM_USER_ID ?? "").trim();
    const envUserKey = String(process.env.AIRPAD_UPSTREAM_USER_KEY ?? "").trim();
    const envDeviceId = String(process.env.AIRPAD_UPSTREAM_DEVICE_ID ?? "").trim();
    const envNamespace = String(process.env.AIRPAD_UPSTREAM_NAMESPACE ?? "").trim();
    const envReconnectMs = parseEnvNumber(process.env.AIRPAD_UPSTREAM_RECONNECT_MS, 0);

    const enabled = envUpstreamEnabled === undefined ? upstream.enabled === true : envUpstreamEnabled;
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
    if (!enabled) {
        if (isTunnelDebug) {
            console.info(
                `[upstream] disabled: enabled=false`,
                `roles=${formatEndpointList(Array.isArray(config.roles) ? config.roles : [])}`,
                `endpointUrl=${endpointUrl || "-"}`,
                `userId=${maskValue(userId)}`,
                `userKey=${maskValue(userKey)}`
            );
        }
        return null;
    }
    if (!endpointUrl || !userId || !userKey) {
        const missing: string[] = [];
        if (!endpointUrl) missing.push("endpointUrl");
        if (!userId) missing.push("userId");
        if (!userKey) missing.push("userKey");
        console.warn(
            `[upstream] disabled: missing required fields`,
            `missing=${missing.join(",") || "none"}`,
            `endpointUrl=${endpointUrl || "-"}`,
            `userId=${userId ? "***" : "-"}`,
            `userKey=${userKey ? "***" : "-"}`
        );
        return null;
    }

    const reconnectMs = Number(upstream.reconnectMs);
    return {
        enabled: true,
        upstreamMasterKey: upstream.upstreamMasterKey,
        upstreamSigningPrivateKeyPem: upstream.upstreamSigningPrivateKeyPem,
        upstreamPeerPublicKeyPem: upstream.upstreamPeerPublicKeyPem,
        endpoints: uniqueEndpoints,
        endpointUrl,
        userId,
        userKey,
        deviceId: envDeviceId || (typeof upstream.deviceId === "string" && upstream.deviceId.trim()
            ? upstream.deviceId.trim()
            : `endpoint-${randomUUID().replace(/-/g, "").slice(0, 12)}`),
        namespace: envNamespace || (typeof upstream.namespace === "string" && upstream.namespace.trim()
            ? upstream.namespace.trim()
            : "default"),
        reconnectMs: Number.isFinite(envReconnectMs) && envReconnectMs > 0 ? envReconnectMs : (Number.isFinite(reconnectMs) && reconnectMs > 0 ? reconnectMs : 5000)
    };
};

const buildWsUrl = (endpointUrl: string, cfg: Required<UpstreamPeerConfig>): string | null => {
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
        return url.toString();
    } catch {
        return null;
    }
};

export const startUpstreamPeerClient = (rawConfig: EndpointConfig, options: UpstreamClientOptions = {}): RunningClient | null => {
    if (!isClientRoleEnabled(rawConfig)) {
        if (isTunnelDebug) {
            console.info(
                "[upstream] disabled: client/peer/hub role is not enabled",
                `roles=${formatEndpointList(Array.isArray(rawConfig.roles) ? rawConfig.roles : [])}`
            );
        }
        return null;
    }

    const cfg = normalizeUpstreamConfig(rawConfig);
    if (!cfg) return null;
    if (isTunnelDebug) {
        console.info(
            "[upstream] config accepted",
            `enabled=${cfg.enabled}`,
            `userId=${maskValue(cfg.userId)}`,
            `endpoint=${cfg.endpointUrl}`,
            `endpoints=${formatEndpointList(cfg.endpoints)}`,
            `namespace=${cfg.namespace}`,
            `deviceId=${cfg.deviceId}`
        );
    }

    const localHosts = getLocalUpstreamHosts();
    const seenSignatures = new Set<string>();
    const addCandidate = (rawCandidate: string, list: string[]) => {
        const item = String(rawCandidate || "").trim();
        if (!item) return;
        if (isSelfLoopCandidate(item, localHosts)) {
            if (isTunnelDebug) {
                console.info("[upstream] skip self endpoint candidate", `candidate=${item}`);
            }
            return;
        }
        const signature = normalizeEndpointSignature(item);
        if (signature && seenSignatures.has(signature)) {
            if (isTunnelDebug) {
                console.info("[upstream] skip duplicate endpoint candidate", `candidate=${item}`, `signature=${signature}`);
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
            console.warn("[upstream] disabled: no explicit endpoint candidates", `endpoints=${formatEndpointList(cfg.endpoints)}`, `endpointUrl=${cfg.endpointUrl || "-"}`);
        }
    }


    if (!upstreamCandidates.length) {
        if (isTunnelDebug) {
            console.warn("[upstream] disabled: all candidates are local/self endpoints", `host=${Array.from(localHosts).join("|")}`);
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
        reconnectHandle = setTimeout(() => {
            reconnectHandle = null;
            connect();
        }, Number.isFinite(delayMs) && delayMs && delayMs > 0 ? delayMs : cfg.reconnectMs);
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
                console.warn("[upstream] skip reconnect: credentials rejected, waiting", `endpoint=${cfg.endpointUrl}`, `waitMs=${waitMs}`);
            }
            scheduleReconnect(waitMs);
            return;
        }
        try {
            const endpoint = upstreamCandidates[candidateIndex] || cfg.endpointUrl;
            wsUrl = buildWsUrl(endpoint, cfg);
            if (!wsUrl) {
                if (isTunnelDebug) {
                    console.warn("[upstream] cannot build ws url", `candidate=${endpoint}`);
                }
                setNextEndpoint();
                scheduleReconnect();
                return;
            }
            activeEndpoint = endpoint;
            if (isTunnelDebug) {
                console.info("[upstream] connecting", `endpoint=${endpoint}`, `url=${wsUrl}`);
            }
            socket = new WebSocket(wsUrl, {
                rejectUnauthorized: shouldRejectUnauthorized
            });
        } catch {
            if (isTunnelDebug) {
                console.error("[upstream] connection setup failed", `candidate=${upstreamCandidates[candidateIndex]}`);
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
                console.info("[upstream] connected", `endpoint=${activeEndpoint}`);
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
                console.warn("[upstream] closed", `endpoint=${active}`, `code=${code}`, reasonText ? `reason=${reasonText}` : "");
                if (code === 4001 && normalizedReason.includes("invalid credentials")) {
                    invalidCredentialBlockUntil = Date.now() + invalidCredentialsRetryMs;
                    console.error("[upstream] rejected by target", formatHintForInvalidCredentials(cfg.userId, cfg.deviceId, active));
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
                console.error("[upstream] socket error", message);
                if (isTlsVerifyError(message)) {
                    console.warn("[upstream] tls verify error", `endpoint=${upstreamCandidates[candidateIndex] || cfg.endpointUrl}`, `use AIRPAD_UPSTREAM_REJECT_UNAUTHORIZED=false if certificate is self-signed`);
                }
            }
            socket?.close(4001, "upstream-error");
        });
    };

    connect();

    return {
        stop: () => {
            if (isTunnelDebug) {
                console.info("[upstream] stopping");
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
                            "[upstream] send blocked",
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
            endpointUrl: wsUrl,
            upstreamEndpoints: upstreamCandidates,
            activeEndpoint,
            userId: cfg.userId,
            deviceId: cfg.deviceId,
            namespace: cfg.namespace
        })
    };
};
