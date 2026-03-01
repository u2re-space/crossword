import { WebSocketServer, type WebSocket } from "ws";
import type { FastifyInstance } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import { connect as createTcpConnection, type Socket as NetSocket } from "node:net";

import { loadUserSettings } from "../../lib/users.ts";
import { isBroadcast, normalizeSocketFrame } from "../stack/messages.ts";
import { inferNetworkSurface } from "../stack/topology.ts";
import { pickEnvBoolLegacy, pickEnvStringLegacy } from "../../lib/env.ts";
import { parsePortableInteger, safeJsonParse } from "../../lib/parsing.ts";

type TcpPassthroughFrame = {
    type: string;
    sessionId?: string;
    host?: string;
    target?: string;
    port?: number | string;
    data?: string;
    targetPort?: number | string;
    timeoutMs?: number;
    payload?: any;
    protocol?: "tcp" | "tcp4" | "tcp6";
};

type TcpSession = {
    id: string;
    host: string;
    port: number;
    socket: NetSocket;
};

const parsePrivateNetworkHosts = (): Set<string> => {
    const raw = pickEnvStringLegacy("CWS_WS_TCP_ALLOW_HOSTS", { allowEmpty: true }) ??
        pickEnvStringLegacy("WS_TCP_ALLOW_HOSTS", { allowEmpty: true }) ||
        "";
    if (!raw.trim()) return new Set<string>();
    return new Set(
        raw.split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)
    );
};

const isLocalHost = (value: string): boolean => {
    const lower = value.toLowerCase();
    return lower === "localhost" || lower === "127.0.0.1" || lower === "::1";
};

const isPrivateIpv4 = (value: string): boolean => {
    if (value.startsWith("10.")) return true;
    if (value.startsWith("192.168.")) return true;
    if (value.startsWith("172.")) {
        const second = parsePortableInteger(value.split(".")[1] || 0);
        return second !== undefined && second >= 16 && second <= 31;
    }
    return false;
};

const isPrivateIpv6 = (value: string): boolean => {
    return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80");
};

const isIpAddress = (value: string): boolean => {
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || /^[0-9a-fA-F:]+$/.test(value);
};

const parsePort = (raw?: unknown): number | undefined => {
    if (typeof raw === "number" || typeof raw === "string") {
        const parsed = parsePortableInteger(raw);
        return parsed !== undefined && parsed > 0 && parsed <= 65535 ? parsed : undefined;
    }
    return undefined;
};

const parseTcpEndpoint = (frame: TcpPassthroughFrame): { host: string; port?: number } | undefined => {
    const hostInput = typeof frame.target === "string" && frame.target.trim()
        ? frame.target.trim()
        : typeof frame.host === "string" && frame.host.trim()
            ? frame.host.trim()
            : undefined;
    if (!hostInput) return undefined;

    try {
        const maybeUrl = hostInput.includes("://") ? new URL(hostInput) : new URL(`tcp://${hostInput}`);
        const host = maybeUrl.hostname?.toLowerCase();
        if (!host) return undefined;
        const port = parsePort(maybeUrl.port || frame.port || frame.targetPort);
        return { host, port };
    } catch {
        const directPortMatch = hostInput.match(/^(.*):(\d{1,5})$/);
        if (directPortMatch) {
            const host = directPortMatch[1].trim().toLowerCase();
            return { host, port: parsePort(directPortMatch[2]) };
        }
        return { host: hostInput.toLowerCase(), port: parsePort(frame.port || frame.targetPort) };
    }
};

const isTcpTargetAllowed = (host: string, explicitPort: number | undefined): boolean => {
    const explicitAllowed = parsePrivateNetworkHosts();
    if (explicitAllowed.has(host)) return true;
    if (explicitAllowed.has(host.replace(/^www\./, ""))) return true;

    if (pickEnvBoolLegacy("CWS_WS_TCP_ALLOW_ALL", false) === true || pickEnvBoolLegacy("WS_TCP_ALLOW_ALL", false) === true) return true;

    if (isLocalHost(host) || isPrivateIpv4(host) || isPrivateIpv6(host)) return true;
    if (isIpAddress(host)) return false;

    if (explicitAllowed.size > 0) return false;

    return !!explicitPortHostOverride(host, explicitPort);
};

const explicitPortHostOverride = (host: string, explicitPort?: number): boolean => {
    if (!explicitPort) return false;
    const raw = pickEnvStringLegacy("CWS_WS_TCP_ALLOWED_HOSTS_WITH_PORT", { allowEmpty: true }) ??
        pickEnvStringLegacy("WS_TCP_ALLOWED_HOSTS_WITH_PORT", { allowEmpty: true }) ||
        "";
    const entries = raw
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    if (!entries.length) return false;
    const key = `${host}:${explicitPort}`;
    return entries.includes(key);
};

const encodeTcpData = (chunk: Buffer | Uint8Array): string => Buffer.from(chunk).toString("base64");
const decodeTcpData = (payload: unknown): Buffer | null => {
    if (typeof payload !== "string") return null;
    try {
        return Buffer.from(payload, "base64");
    } catch {
        return null;
    }
};

type ClientInfo = {
    userId: string;
    userKey: string;
    ws: WebSocket;
    id: string;
    namespace: string;
    reverse: boolean;
    deviceId?: string;
    peerLabel?: string;
    peerId?: string;
};

export type WsHub = {
    broadcast: (userId: string, payload: any) => void;
    multicast: (userId: string, payload: any, namespace?: string, excludeId?: string) => void;
    notify: (userId: string, type: string, data?: any) => void;
    sendTo: (clientId: string, payload: any) => void;
    sendToDevice: (userId: string, deviceId: string, payload: any) => boolean;
    requestToDevice?: (userId: string, deviceId: string, payload: any, waitMs?: number) => Promise<any>;
    getConnectedDevices: (userId?: string) => string[];
    getConnectedPeerProfiles: (userId?: string) => Array<{ id: string; label: string }>;
    close: () => Promise<void>;
};

const isIpLike = (value: string): boolean => {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[0-9a-fA-F:]+$/.test(value);
};

const hashSuffix = (value: string): string => createHash("sha1").update(value).digest("hex").slice(0, 8);

const normalizePeerLabel = (userId: string, rawDeviceId: string, rawLabel: string | null): string => {
    const userPart = (userId || "user").trim().slice(0, 16);
    const labelSource = (rawLabel || rawDeviceId || "peer").trim();
    if (!labelSource) return `${userPart}-peer`;
    if (isIpLike(labelSource)) return `${userPart}-peer-${hashSuffix(`${userId}|${labelSource}`)}`;
    const sanitized = labelSource
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
    return sanitized || `${userPart}-peer-${hashSuffix(labelSource)}`;
};

export const createWsServer = (app: FastifyInstance): WsHub => {
    const server = app.server;
    const wss = new WebSocketServer({ noServer: true });
    const clients = new Map<WebSocket, ClientInfo>();
    const namespaces = new Map<string, Map<string, ClientInfo>>();
    const reverseClients = new Map<string, ClientInfo>();
    const reversePeerProfiles = new Map<string, Map<string, { label: string; peerId: string }>>();
    const pendingFetchReplies = new Map<string, {
        resolve: (value: any) => void;
        reject: (error: any) => void;
        timer?: ReturnType<typeof setTimeout>;
    }>();
    const tcpSessions = new Map<WebSocket, Map<string, TcpSession>>();
    const reverseClientKey = (userId: string, deviceId: string) => `${userId}:${deviceId}`;
    const requestKey = (userId: string, deviceId: string, requestId: string) =>
        `${userId}:${deviceId}:${requestId}`;
    const resolveReverseClientByTarget = (userId: string, target: string): ClientInfo | undefined => {
        const normalizedUser = userId.toLowerCase();
        const normalizedTarget = target.toLowerCase();
        const direct = reverseClients.get(reverseClientKey(normalizedUser, normalizedTarget));
        if (direct) return direct;
        for (const entry of reverseClients.values()) {
            if (!entry.userId) continue;
            if (entry.userId.toLowerCase() !== normalizedUser) continue;
            if ((entry.deviceId || "").toLowerCase() === normalizedTarget) return entry;
            if ((entry.peerId || "").toLowerCase() === normalizedTarget) return entry;
        }
        return undefined;
    };

    const upgradeHandler = (req: any, socket: any, head: Buffer) => {
        let pathname = "";
        try {
            pathname = new URL(req.url || "", "http://localhost").pathname;
        } catch {
            pathname = "";
        }
        if (pathname !== "/ws") return;

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
        });
    };
    server.on("upgrade", upgradeHandler);

    const verify = async (userId?: string, userKey?: string) => {
        if (!userId || !userKey) return null;
        try {
            const settings = await loadUserSettings(userId, userKey);
            return settings;
        } catch {
            return null;
        }
    };

    const closeAllTcpSessions = (socket: WebSocket) => {
        const sessions = tcpSessions.get(socket);
        if (!sessions) return;
        sessions.forEach((session) => {
            try {
                session.socket.destroy();
            } catch {
                // no-op
            }
        });
        tcpSessions.delete(socket);
    };

    const sendTcpFrame = (socket: WebSocket, payload: Record<string, any>) => {
        try {
            socket.send(JSON.stringify(payload));
        } catch {
            // no-op
        }
    };

    const closeTcpSession = (socket: WebSocket, sessionId: string): boolean => {
        const sessions = tcpSessions.get(socket);
        const session = sessions?.get(sessionId);
        if (!sessions || !session) return false;
        sessions.delete(sessionId);
        try {
            session.socket.destroy();
        } catch {
            // no-op
        }
        if (sessions.size === 0) tcpSessions.delete(socket);
        return true;
    };

    const handleTcpPassthroughFrame = (socket: WebSocket, frame: TcpPassthroughFrame, userId: string, source: ClientInfo) => {
        const payloadType = String(frame.type || "").trim();
        if (!payloadType || !payloadType.startsWith("tcp.")) return false;
        const sessionId = typeof frame.sessionId === "string" && frame.sessionId.trim()
            ? frame.sessionId.trim()
            : randomUUID();

        if (payloadType === "tcp.connect") {
            const parsedEndpoint = parseTcpEndpoint(frame);
            if (!parsedEndpoint?.host) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "invalid-target",
                    error: "Missing host"
                });
                return true;
            }

            if (!isTcpTargetAllowed(parsedEndpoint.host, parsedEndpoint.port)) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "forbidden-target",
                    error: `Target ${parsedEndpoint.host}:${parsedEndpoint.port ?? "auto"} is blocked`
                });
                return true;
            }

            const port = parsedEndpoint.port || 80;
            if (!parsePort(port)) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "invalid-target",
                    error: "Invalid port"
                });
                return true;
            }

            if ((tcpSessions.get(socket)?.size || 0) >= 16) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "limit-exceeded",
                    error: "Too many active passthrough sessions"
                });
                return true;
            }

            const targetSessions = tcpSessions.get(socket) || new Map<string, TcpSession>();
            if (targetSessions.has(sessionId)) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "session-exists",
                    error: "Session id already exists"
                });
                return true;
            }

            const remoteSocket = createTcpConnection({
                host: parsedEndpoint.host,
                port
            }) as NetSocket;
            const session: TcpSession = { id: sessionId, host: parsedEndpoint.host, port, socket: remoteSocket };
            targetSessions.set(sessionId, session);
            tcpSessions.set(socket, targetSessions);
            remoteSocket.setKeepAlive(true, 30_000);

            remoteSocket.once("connect", () => {
                sendTcpFrame(socket, {
                    type: "tcp.connected",
                    sessionId,
                    userId,
                    host: parsedEndpoint.host,
                    port,
                    via: "ws",
                    surface: source.reverse ? "external" : "private"
                });
            });
            remoteSocket.on("data", (chunk) => {
                sendTcpFrame(socket, {
                    type: "tcp.data",
                    sessionId,
                    data: encodeTcpData(chunk as Buffer | Uint8Array),
                    encoding: "base64"
                });
            });
            remoteSocket.once("error", (error) => {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "socket-error",
                    error: String((error as Error)?.message || error)
                });
                closeTcpSession(socket, sessionId);
            });
            remoteSocket.once("close", () => {
                sendTcpFrame(socket, {
                    type: "tcp.closed",
                    sessionId
                });
                closeTcpSession(socket, sessionId);
            });
            remoteSocket.setTimeout(Math.max(120_000, parsePortableInteger(frame.timeoutMs) ?? 120_000));
            return true;
        }

        if (payloadType === "tcp.send") {
            const targetSessions = tcpSessions.get(socket);
            if (!targetSessions?.has(sessionId)) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "unknown-session",
                    error: "Session not found"
                });
                return true;
            }

            const session = targetSessions.get(sessionId)!;
            const rawPayload = frame.data ?? frame.payload;
            const binary = decodeTcpData(rawPayload);
            if (!binary) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "invalid-payload",
                    error: "Payload must be base64"
                });
                return true;
            }

            if (!session.socket.writable) {
                sendTcpFrame(socket, {
                    type: "tcp.error",
                    sessionId,
                    reason: "not-ready",
                    error: "Target socket is not writable"
                });
                return true;
            }

            session.socket.write(binary);
            return true;
        }

        if (payloadType === "tcp.close") {
            const ok = closeTcpSession(socket, sessionId);
            sendTcpFrame(socket, {
                type: ok ? "tcp.closed" : "tcp.error",
                sessionId,
                reason: ok ? "closed" : "unknown-session",
                ...(ok ? {} : { error: "Session not found" })
            });
            return true;
        }

        return false;
    };

    wss.on("connection", async (ws, req) => {
        const params = new URL(req.url || "", "http://localhost").searchParams;
        const userId = params.get("userId") || undefined;
        const userKey = params.get("userKey") || undefined;
        const namespace = params.get("ns") || params.get("namespace") || userId;
        const mode = params.get("mode") || "push";
        const deviceId = params.get("deviceId") || "";
        const isReverse = mode === "reverse";
        const settings = await verify(userId, userKey);
        const requestedLabel = (params.get("label") || params.get("name") || params.get("clientId") || "").trim();
        const requestedPeerId = (params.get("clientId") || params.get("peerId") || requestedLabel || deviceId).trim();
        if (!settings || !userId || !userKey) {
            ws.close(4001, "Invalid credentials");
            return;
        }
        if (isReverse && !deviceId) {
            ws.close(4002, "Missing deviceId");
            return;
        }
        const peerLabel = isReverse ? normalizePeerLabel(userId || "", deviceId, requestedPeerId) : undefined;
        const info: ClientInfo = {
            userId,
            userKey,
            ws,
            id: randomUUID(),
            namespace: namespace || userId,
            reverse: isReverse,
            deviceId: isReverse ? deviceId : undefined,
            peerLabel,
            peerId: isReverse ? requestedPeerId : undefined
        };
        clients.set(ws, info);
        if (!namespaces.has(info.userId)) namespaces.set(info.userId, new Map());
        namespaces.get(info.userId)!.set(info.id, info);
        if (isReverse && deviceId) {
            reverseClients.set(reverseClientKey(info.userId, deviceId), info);
            if (requestedPeerId && requestedPeerId !== deviceId) {
                reverseClients.set(reverseClientKey(info.userId, requestedPeerId), info);
            }
            const labels = reversePeerProfiles.get(info.userId) ?? new Map<string, { label: string; peerId: string }>();
            labels.set(deviceId, {
                label: peerLabel || deviceId,
                peerId: requestedPeerId
            });
            reversePeerProfiles.set(info.userId, labels);
            ws.send(JSON.stringify({ type: "welcome", id: info.id, userId, deviceId, peerLabel, peerId: requestedPeerId }));
        } else {
            ws.send(JSON.stringify({ type: "welcome", id: info.id, userId }));
        }

        ws.on("message", async (data) => {
            let parsed: any;
            parsed = safeJsonParse<Record<string, any>>(data.toString());
            if (!parsed) return;
            if (handleTcpPassthroughFrame(ws, parsed as TcpPassthroughFrame, userId, info)) {
                return;
            }
            if (info.reverse) {
                const requestId = String(parsed?.payload?.requestId || parsed?.requestId || "").trim();
                if (requestId) {
                    const pendingKeyUser = String(info.userId || "").toLowerCase();
                    const pendingDevice = String(info.deviceId || "").toLowerCase();
                    const keyByDevice = requestKey(pendingKeyUser, pendingDevice, requestId);
                    const keyByAnyTarget = Array.from(pendingFetchReplies.keys()).find((key) => {
                        const parts = key.split(":");
                        return parts[0] === pendingKeyUser && parts[2] === requestId;
                    });
                    const key = pendingFetchReplies.has(keyByDevice) ? keyByDevice : keyByAnyTarget;
                    if (key) {
                        const pending = pendingFetchReplies.get(key);
                        if (pending) {
                            pendingFetchReplies.delete(key);
                            if (pending.timer) clearTimeout(pending.timer);
                            pending.resolve(parsed);
                            return;
                        }
                    }
                    if (keyByAnyTarget) {
                        const pending = pendingFetchReplies.get(keyByAnyTarget);
                        if (pending) {
                            pendingFetchReplies.delete(keyByAnyTarget);
                            if (pending.timer) clearTimeout(pending.timer);
                            pending.resolve(parsed);
                            return;
                        }
                    }
                }
            }
            const frameType = String(parsed?.type || "").trim().toLowerCase();
            if (frameType === "pong" || frameType === "hello") {
                return;
            }
            const frame = normalizeSocketFrame(parsed, info.id, {
                nodeId: info.userId,
                peerId: info.deviceId,
                via: "ws",
                gatewayId: info.reverse ? "reverse-gateway" : undefined,
                surface: info.reverse ? "external" : inferNetworkSurface(req.socket?.remoteAddress)
            });
            const type = frame.type;
            const payload = frame.payload;
            const shouldBroadcast = isBroadcast(frame);
            // Simple forwarding: if targetId matches a client, relay
            if (!shouldBroadcast) {
                const target = [...clients.values()].find((c) =>
                    c.id === frame.to ||
                    c.deviceId === frame.to ||
                    c.peerId === frame.to ||
                    c.userId === frame.to
                );
                target?.ws?.send?.(JSON.stringify({ type, payload, from: info.id }));
            } else {
                // broadcast to same userId
                multicast(info.userId, { type, payload, from: frame.from }, frame.namespace || info.namespace, info.id);
            }
        });

        ws.on("close", () => {
            closeAllTcpSessions(ws);
            clients.delete(ws);
            namespaces.get(info.userId)?.delete(info.id);
            if (namespaces.get(info.userId)?.size === 0) namespaces.delete(info.userId);
            for (const pendingKey of Array.from(pendingFetchReplies.keys())) {
                if (pendingKey.startsWith(`${info.userId}:${info.deviceId || ""}:`)) {
                    const pending = pendingFetchReplies.get(pendingKey);
                    if (pending) {
                        if (pending.timer) clearTimeout(pending.timer);
                        pending.reject(new Error("device disconnected"));
                    }
                    pendingFetchReplies.delete(pendingKey);
                }
            }
            if (info.reverse && info.deviceId) {
                reverseClients.delete(reverseClientKey(info.userId, info.deviceId));
                const peerAwareKey = reverseClientKey(info.userId, info.peerId || "");
                reverseClients.delete(peerAwareKey);
                const labels = reversePeerProfiles.get(info.userId);
                if (labels) {
                    labels.delete(info.deviceId);
                    if (labels.size === 0) reversePeerProfiles.delete(info.userId);
                }
            }
        });
    });

    const multicast = (userId: string, payload: any, namespace?: string, excludeId?: string) => {
        const targetNamespace = namespace || userId;
        const byUser = namespaces.get(userId);
        if (!byUser) return;
        byUser.forEach((client) => {
            if (client.namespace === targetNamespace && client.id !== excludeId) {
                client.ws.send(JSON.stringify(payload));
            }
        });
    };

    const broadcast = (userId: string, payload: any) => {
        multicast(userId, payload, undefined);
    };

    const notify = (userId: string, type: string, data?: any) => {
        broadcast(userId, { type, data });
    };

    const sendTo = (clientId: string, payload: any) => {
        const target = [...clients.values()].find((c) => c.id === clientId);
        target?.ws?.send?.(JSON.stringify(payload));
    };

    const sendToDevice = (userId: string, deviceId: string, payload: any): boolean => {
        const normalizedUser = userId.toLowerCase();
        const normalizedTarget = deviceId.toLowerCase();
        const target = resolveReverseClientByTarget(normalizedUser, normalizedTarget);
        if (!target?.ws) return false;
        try {
            target.ws.send(JSON.stringify(payload));
            return true;
        } catch {
            return false;
        }
    };

    const requestToDevice = async (userId: string, deviceId: string, payload: any, waitMs = 15000) => {
        const requestId = String(payload?.requestId || randomUUID()).trim() || randomUUID();
        const envelope = { ...payload, requestId };
        const normalizedUser = userId.toLowerCase();
        const normalizedTarget = deviceId.toLowerCase();
        const target = resolveReverseClientByTarget(normalizedUser, normalizedTarget);
        if (!target?.ws) return undefined;
        const pendingTarget = (target.deviceId || normalizedTarget).toLowerCase();
        return new Promise<any>((resolve, reject) => {
            const key = requestKey(normalizedUser, pendingTarget, requestId);
            const timeout = parsePortableInteger(waitMs) ?? 15000;
            const timer = setTimeout(() => {
                pendingFetchReplies.delete(key);
                reject(new Error(`network.fetch timeout: ${requestId}`));
            }, Math.max(500, timeout));
            pendingFetchReplies.set(key, { resolve, reject, timer });
            try {
                target.ws.send(JSON.stringify(envelope));
            } catch (error) {
                pendingFetchReplies.delete(key);
                if (timer) clearTimeout(timer);
                reject(error);
            }
        });
    };

    const getConnectedDevices = (userId?: string): string[] => {
        const keys = Array.from(reverseClients.keys());
        const asDevice = (key: string) => key.split(":")[1];
        if (!userId) return Array.from(new Set(keys.map(asDevice)));
        const prefix = `${userId}:`;
        return Array.from(new Set(
            keys
                .filter((key) => key.startsWith(prefix))
                .map((key) => key.slice(prefix.length))
        ));
    };

    const getConnectedPeerProfiles = (userId?: string): Array<{ id: string; label: string; peerId?: string }> => {
        if (!userId) {
            return Array.from(reversePeerProfiles.values())
                .flatMap((labelsByDevice) =>
                    Array.from(labelsByDevice.entries()).map(([id, profile]) => ({ id, label: profile.label, peerId: profile.peerId }))
                );
        }
        const profile = reversePeerProfiles.get(userId);
        if (!profile) return [];
        return Array.from(profile.entries()).map(([id, profileEntry]) => ({ id, label: profileEntry.label, peerId: profileEntry.peerId }));
    };

    const close = async () => {
        clients.forEach((c) => c.ws.close());
        server.off("upgrade", upgradeHandler);
        await new Promise<void>((resolve) => { wss.close(() => resolve()); });
    };

    return {
        broadcast,
        multicast,
        notify,
        sendTo,
        sendToDevice,
        requestToDevice,
        getConnectedDevices,
        getConnectedPeerProfiles,
        close
    };
};
