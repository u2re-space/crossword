import { Buffer } from "node:buffer";
import { createDecipheriv, createHash, createVerify, randomUUID } from "node:crypto";
import { WebSocket } from "ws";

type UpstreamPeerConfig = {
    enabled?: boolean;
    endpointUrl?: string;
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
    const enabled = upstream.enabled === true;
    const endpointUrl = typeof upstream.endpointUrl === "string" ? upstream.endpointUrl.trim() : "";
    const userId = typeof upstream.userId === "string" ? upstream.userId.trim() : "";
    const userKey = typeof upstream.userKey === "string" ? upstream.userKey.trim() : "";
    if (!enabled || !endpointUrl || !userId || !userKey) {
        return null;
    }

    const reconnectMs = Number(upstream.reconnectMs);
    return {
        enabled: true,
        endpointUrl,
        userId,
        userKey,
        deviceId: typeof upstream.deviceId === "string" && upstream.deviceId.trim()
            ? upstream.deviceId.trim()
            : `endpoint-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        namespace: typeof upstream.namespace === "string" && upstream.namespace.trim()
            ? upstream.namespace.trim()
            : "default",
        reconnectMs: Number.isFinite(reconnectMs) && reconnectMs > 0 ? reconnectMs : 5000
    };
};

const buildWsUrl = (cfg: Required<UpstreamPeerConfig>): string | null => {
    try {
        let endpointUrl = cfg.endpointUrl.trim().replace(/\/+$/, "");
        if (!endpointUrl) return null;

        if (!/^wss?:\/\//i.test(endpointUrl)) {
            endpointUrl = `ws://${endpointUrl}`;
        } else if (/^https:\/\//i.test(endpointUrl)) {
            endpointUrl = endpointUrl.replace(/^https:\/\//i, "wss://");
        } else if (/^http:\/\//i.test(endpointUrl)) {
            endpointUrl = endpointUrl.replace(/^http:\/\//i, "ws://");
        }

        const url = new URL(endpointUrl);
        const hasWsPath = /\/ws(?:[/?#]|$)/.test(url.pathname);
        if (!hasWsPath) {
            const normalizedPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
            url.pathname = `${normalizedPath}ws`;
        }
        const search = new URLSearchParams({
            mode: "reverse",
            userId: cfg.userId,
            userKey: cfg.userKey,
            namespace: cfg.namespace,
            deviceId: cfg.deviceId
        });
        url.search = search.toString();
        return url.toString();
    } catch {
        return null;
    }
};

export const startUpstreamPeerClient = (rawConfig: EndpointConfig, options: UpstreamClientOptions = {}): RunningClient | null => {
    if (!isClientRoleEnabled(rawConfig)) return null;

    const cfg = normalizeUpstreamConfig(rawConfig);
    if (!cfg) return null;
    const wsUrl = buildWsUrl(cfg);
    if (!wsUrl) return null;

    let socket: WebSocket | null = null;
    let stopped = false;
    let reconnectHandle: ReturnType<typeof setTimeout> | null = null;
    let heartbeatHandle: ReturnType<typeof setInterval> | null = null;

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

    const scheduleReconnect = () => {
        if (stopped) return;
        clearReconnect();
        reconnectHandle = setTimeout(() => {
            reconnectHandle = null;
            connect();
        }, cfg.reconnectMs);
    };

    const connect = () => {
        if (stopped) return;
        try {
            socket = new WebSocket(wsUrl);
        } catch {
            scheduleReconnect();
            return;
        }

        socket.on("open", () => {
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

                options.onMessage?.(parsed, text, cfg);
            } catch {
                // ignore malformed payloads
            }
        });

        socket.on("close", () => {
            clearHeartbeat();
            socket = null;
            scheduleReconnect();
        });

        socket.on("error", () => {
            socket?.close();
        });
    };

    connect();

    return {
        stop: () => {
            stopped = true;
            clearReconnect();
            clearHeartbeat();
            if (socket && socket.readyState !== WebSocket.CLOSED) {
                socket.close(1000, "client stop");
            }
            socket = null;
        },
        send: (payload: unknown) => {
            if (!socket || socket.readyState !== WebSocket.OPEN) return false;
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
            userId: cfg.userId,
            deviceId: cfg.deviceId,
            namespace: cfg.namespace
        })
    };
};
