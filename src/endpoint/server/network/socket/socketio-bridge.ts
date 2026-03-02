import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { randomUUID } from "node:crypto";

import { applySocketIoPrivateNetworkHeaders, buildSocketIoOptions, describeHandshake, isPrivateNetworkCorsEnabled } from "./socketio-security.ts";
import { applyMessageHooks, isBroadcast, normalizeSocketFrame, type SocketMessageHook } from "../stack/messages.ts";
import {
    createAirpadRouter,
    registerAirpadSocketHandlers,
    AirpadClipHistoryEntry,
    describeAirPadConnectionMeta,
    isAirPadAuthorized,
    requiresAirpadMessageAuth,
    createAirpadObjectMessageHandler
} from "../../airpad/index.ts";
import { pickEnvBoolLegacy, pickEnvNumberLegacy } from "../../lib/env.ts";
import { parsePortableInteger } from "../../lib/parsing.ts";
import config from "../../config/config.ts";
import { areArchetypesCompatible, inferExpectedRemoteArchetype, parseWsArchetype, supportsServerUpstreamArchetype } from "../stack/archetypes.ts";
type ClipHistoryEntry = AirpadClipHistoryEntry;

export type SocketIoBridge = {
    addMessageHook: (hook: SocketMessageHook) => void;
    getConnectedDevices: () => string[];
    getClipboardHistory: (limit?: number) => ClipHistoryEntry[];
    sendToDevice: (userId: string, deviceId: string, payload: any) => boolean;
    requestToDevice?: (userId: string, deviceId: string, payload: any, waitMs?: number) => Promise<any>;
    io: SocketIOServer;
};

type SocketIoBridgeNetworkContext = {
    sendToUpstream?: (payload: any) => boolean;
    upstreamUserId?: string;
};

export type SocketIoBridgeOptions = {
    maxHistory?: number;
    networkContext?: SocketIoBridgeNetworkContext;
};

const MAX_HISTORY_DEFAULT = 100;

const logMsg = (prefix: string, msg: any): void => {
    const payloadLen = msg?.payload ? (typeof msg.payload === "string" ? msg.payload.length : JSON.stringify(msg.payload).length) : 0;
    // Keep this format stable for grep-ability and client debugging
    console.log(`[${new Date().toISOString()}] ${prefix} type=${msg?.type} from=${msg?.from} to=${msg?.to} mode=${msg?.mode || "blind"} action=${msg?.action || "N/A"} payloadLen=${payloadLen}`);
};
const isTunnelDebug = pickEnvBoolLegacy("CWS_TUNNEL_DEBUG") === true;
const NETWORK_FETCH_TIMEOUT_MS = Math.max(
    500,
    (() => {
        const configured = pickEnvNumberLegacy("CWS_NETWORK_FETCH_TIMEOUT_MS", 15000);
        return parsePortableInteger(configured) ?? 15000;
    })()
);

const mapHookPayload = (hooks: SocketMessageHook[], msg: any, socket: Socket) => applyMessageHooks(hooks, msg, socket);

export const createSocketIoBridge = (app: FastifyInstance, opts: SocketIoBridgeOptions = {}): SocketIoBridge => {
    const maxHistory = opts?.maxHistory ?? MAX_HISTORY_DEFAULT;
    const networkContext = opts.networkContext;
    const io = new SocketIOServer(app.server, buildSocketIoOptions(app.log as any));
    const allowPrivateNetwork = isPrivateNetworkCorsEnabled();
    const applyPrivateNetworkHeaders = (headers: Record<string, any>, req: any): void => {
        if (allowPrivateNetwork) applySocketIoPrivateNetworkHeaders(headers as any, req);
    };
    io.engine.on("initial_headers", (headers, req) => {
        applyPrivateNetworkHeaders(headers as any, req);
    });
    io.engine.on("headers", (headers, req) => {
        applyPrivateNetworkHeaders(headers as any, req);
    });
    io.engine.on("connection_error", (err: any) => {
        app.log?.warn?.(
            {
                code: err?.code,
                message: err?.message,
                context: err?.context
            },
            "[socket.io] Engine connection error"
        );
    });

    // AirPad routing state and helpers
    const airpadRouter = createAirpadRouter({
        logger: app.log,
        networkContext,
        isTunnelDebug
    });
    const pendingFetchReplies = new Map<
        string,
        {
            resolve: (value: any) => void;
            reject: (error: any) => void;
            timer?: ReturnType<typeof setTimeout>;
        }
    >();
    const requestToDeviceKey = (userId: string, deviceId: string, requestId: string) => `${userId}:${deviceId}:${requestId}`;
    const normalizeHint = (value: unknown): string => airpadRouter.normalizeHint(value);

    const removeSocketRequestPendings = (userId: string, deviceId: string): void => {
        const normalizedUser = normalizeHint(userId);
        const normalizedDevice = normalizeHint(deviceId);
        for (const key of Array.from(pendingFetchReplies.keys())) {
            if (!normalizedDevice) continue;
            const prefixWithUser = `${normalizedUser}:${normalizedDevice}:`;
            if (normalizedUser && key.startsWith(prefixWithUser)) {
                const pending = pendingFetchReplies.get(key);
                if (pending) {
                    if (pending.timer) clearTimeout(pending.timer);
                    pending.reject(new Error("socket disconnected"));
                }
                pendingFetchReplies.delete(key);
            } else if (!normalizedUser && key.includes(`:${normalizedDevice}:`)) {
                const pending = pendingFetchReplies.get(key);
                if (pending) {
                    if (pending.timer) clearTimeout(pending.timer);
                    pending.reject(new Error("socket disconnected"));
                }
                pendingFetchReplies.delete(key);
            }
        }
    };

    const getHandshakeClientId = (socket: Socket): string | undefined => {
        const handshake: Record<string, unknown> = (socket as any).handshake || {};
        const auth = handshake.auth && typeof handshake.auth === "object" ? (handshake.auth as Record<string, unknown>) : {};
        const query = handshake.query && typeof handshake.query === "object" ? (handshake.query as Record<string, unknown>) : {};
        const raw = typeof auth.clientId === "string" ? auth.clientId : typeof query.clientId === "string" ? query.clientId : typeof query.__airpad_src === "string" ? query.__airpad_src : typeof query.__airpad_source === "string" ? query.__airpad_source : typeof query.src === "string" ? query.src : typeof query.source === "string" ? query.source : typeof query.sourceId === "string" ? query.sourceId : typeof query.peerId === "string" ? query.peerId : "";
        const normalized = normalizeHint(raw);
        return normalized || undefined;
    };

    const getSocketIoRemoteArchetype = (socket: Socket): { raw: string | undefined; parsed?: ReturnType<typeof parseWsArchetype> } => {
        const meta = describeAirPadConnectionMeta(socket);
        const raw = (meta as any)?.archetype;
        const normalized = typeof raw === "string" ? raw.trim() : "";
        if (!normalized) return { raw: undefined };
        return { raw: normalized, parsed: parseWsArchetype(normalized) };
    };

    const buildSocketArchetypeLogPayload = (socket: Socket, remoteArchetype: { raw?: string; parsed?: ReturnType<typeof parseWsArchetype> }) => {
        return {
            socketId: socket.id,
            requestedArchetype: remoteArchetype.raw ?? "none",
            transport: socket?.conn?.transport?.name,
            sourceHint: normalizeHint((socket as any)?.airpadSourceId),
            transportAcceptedArchetype: "server-upstream"
        };
    };

    const requestToDevice = async (userId: string, deviceId: string, payload: any, waitMs = NETWORK_FETCH_TIMEOUT_MS) => {
        const normalizedDevice = normalizeHint(deviceId);
        if (!normalizedDevice) return undefined;
        const targetSocket = airpadRouter.getSocket(normalizedDevice);
        if (!targetSocket?.connected) return undefined;
        const requestId = String(payload?.requestId || randomUUID()).trim() || randomUUID();
        const envelope = { ...payload, requestId };
        return new Promise<any>((resolve, reject) => {
            const key = requestToDeviceKey(normalizeHint(userId), normalizedDevice, requestId);
            const timeout = parsePortableInteger(waitMs) ?? NETWORK_FETCH_TIMEOUT_MS;
            const timer = setTimeout(
                () => {
                    pendingFetchReplies.delete(key);
                    reject(new Error(`network.fetch timeout: ${requestId}`));
                },
                Math.max(500, timeout)
            );
            pendingFetchReplies.set(key, { resolve, reject, timer });
            try {
                targetSocket.emit("network.fetch", envelope, (response: any) => {
                    const pending = pendingFetchReplies.get(key);
                    if (!pending) return;
                    pendingFetchReplies.delete(key);
                    if (pending.timer) clearTimeout(pending.timer);
                    pending.resolve(response);
                });
            } catch (error) {
                pendingFetchReplies.delete(key);
                if (timer) clearTimeout(timer);
                reject(error);
            }
        });
    };

    // Message history for inspection mode
    const clipHistory: ClipHistoryEntry[] = [];

    // Message hooks for translation/routing
    const messageHooks: SocketMessageHook[] = [];

    const routeMessage = (sourceSocket: Socket, msg: any): void => {
        const hasExplicitTarget = msg && typeof msg === "object" && ("to" in msg || "target" in msg || "targetId" in msg || "target_id" in msg || "deviceId" in msg);
        const routeHint = airpadRouter.getRouteHint(sourceSocket);
        const isEndpoint = airpadRouter.isEndpoint(sourceSocket);
        const normalized = normalizeSocketFrame(msg, sourceSocket.id, {
            nodeId: (sourceSocket as any).userId,
            peerId: sourceSocket.id,
            via: "socketio",
            surface: "external"
        });
        const resolvedTo = airpadRouter.resolveAirpadTarget(sourceSocket, normalized.to, hasExplicitTarget);
        if (resolvedTo) {
            normalized.to = resolvedTo;
            normalized.target = resolvedTo;
        }
        const processed = mapHookPayload(messageHooks, normalized, sourceSocket) as any;
        if (processed === null) {
            console.log(`[Router] Message skipped by hook`);
            return;
        }

        const tunnelTargets = airpadRouter.resolveTunnelTargets(sourceSocket, processed);
        if (tunnelTargets.length > 0) {
            if (isTunnelDebug) {
                console.log(`[Router] Tunnel route attempt`, `socket=${sourceSocket.id}`, `from=${processed.from}`, `to=${processed.to}`, `targets=${tunnelTargets.join(",")}`, `via=${airpadRouter.getRouteHint(sourceSocket) || "?"}`);
            }
            if (airpadRouter.forwardToAirpadTargets(sourceSocket, processed, processed)) {
                logMsg("OUT(tunnel)", processed);
                if (isTunnelDebug) {
                    console.log(`[Router] OUT(tunnel) forwarded`, sourceSocket.id, `target=${processed.to}`);
                }
                return;
            }
            if (airpadRouter.forwardToUpstream(sourceSocket, processed)) {
                logMsg("OUT(tunnel-upstream)", processed);
                return;
            }
            const knownTunnelTargets = airpadRouter.getTunnelTargets();
            if (routeHint === "tunnel" || routeHint === "remote") {
                if (isTunnelDebug) {
                    console.warn(
                        `[Router] Tunnel target not found; upstream/bridge fallback not enabled for routed socket`,
                        `socket=${sourceSocket.id}`,
                        `requested=${tunnelTargets.join(",")}`,
                        `known=${knownTunnelTargets.join(",")}`
                    );
                }
                return;
            }
            if (isTunnelDebug) {
                console.warn(`[Router] Tunnel target not found for ${sourceSocket.id}`, `requested=${tunnelTargets.join(",")}`, `known=${knownTunnelTargets.join(",")}`);
            } else {
                console.warn(`[Router] Tunnel target not found for ${sourceSocket.id}`);
            }
        }
        if (!isEndpoint) {
            if (isTunnelDebug) {
                console.warn(
                    `[Router] Local handling skipped for non-endpoint socket`,
                    `socket=${sourceSocket.id}`,
                    `from=${processed.from}`,
                    `to=${processed.to}`,
                    `via=${routeHint || "?"}`
                );
            }
            return;
        }

        if (isBroadcast(processed)) {
            sourceSocket.broadcast.emit("message", processed);
            logMsg("OUT(broadcast)", processed);
            return;
        }

        const targetSocket = airpadRouter.getSocket(processed.to);
        if (targetSocket) {
            targetSocket.emit("message", processed);
            logMsg(`OUT(to=${processed.to})`, processed);
            return;
        }
        console.warn(`[Router] No target client for deviceId: ${processed.to}`);
    };

    const multicastMessage = (sourceSocket: Socket, msg: any, deviceIds?: string[]): void => {
        const normalized = normalizeSocketFrame(msg, sourceSocket.id, {
            nodeId: (sourceSocket as any).userId,
            peerId: sourceSocket.id,
            via: "socketio",
            surface: "external"
        });
        const processed = mapHookPayload(messageHooks, normalized, sourceSocket) as any;
        if (processed === null) return;

        if (!deviceIds || deviceIds.length === 0) {
            sourceSocket.broadcast.emit("message", processed);
            logMsg("OUT(multicast-all)", processed);
            return;
        }

        let sentCount = 0;
        for (const deviceId of deviceIds) {
            const targetSocket = airpadRouter.getSocket(deviceId);
            if (targetSocket && targetSocket !== sourceSocket) {
                targetSocket.emit("message", processed);
                sentCount++;
            }
        }
        logMsg(`OUT(multicast-${sentCount})`, processed);
    };

    io.on("connection", (socket: Socket) => {
        let deviceId: string | null = null;

        if (!isAirPadAuthorized(socket)) {
            console.warn(`[Server] AirPad socket rejected due to missing/invalid token`);
            socket.emit("error", { message: "Unauthorized AirPad token" });
            socket.disconnect(true);
            return;
        }
        const connectionMeta = describeAirPadConnectionMeta(socket);
        const remoteArchetype = getSocketIoRemoteArchetype(socket);
        const localArchetype = "server-upstream" as const;
        const expectedRemoteArchetype = inferExpectedRemoteArchetype(false);
        const supportsLocalServerUpstream = supportsServerUpstreamArchetype((config as any)?.roles);
        if (!supportsLocalServerUpstream) {
            console.warn(`[Server] AirPad socket rejected: server-upstream role is disabled`, buildSocketArchetypeLogPayload(socket, remoteArchetype));
            socket.emit("error", { message: "Server role mismatch for Socket.IO clients" });
            socket.disconnect(true);
            return;
        }
        if (remoteArchetype.raw && remoteArchetype.parsed == null) {
            console.warn(`[Server] AirPad socket rejected: invalid connection archetype`, buildSocketArchetypeLogPayload(socket, remoteArchetype));
            socket.emit("error", { message: `Invalid AirPad connection archetype: ${remoteArchetype.raw}` });
            socket.disconnect(true);
            return;
        }
        if (!areArchetypesCompatible(localArchetype, remoteArchetype.parsed || expectedRemoteArchetype)) {
            console.warn(`[Server] AirPad socket rejected: incompatible connection archetype`, buildSocketArchetypeLogPayload(socket, remoteArchetype));
            socket.emit("error", {
                message: `Incompatible connection archetypes: local=${localArchetype}, remote=${remoteArchetype.parsed || expectedRemoteArchetype}`
            });
            socket.disconnect(true);
            return;
        }
        const sourceAlias = normalizeHint(connectionMeta.sourceId);
        if (sourceAlias) {
            (socket as any).airpadSourceId = sourceAlias;
        }
        if (!sourceAlias) {
            (socket as any).airpadSourceId = normalizeHint(connectionMeta.clientId);
        }
        airpadRouter.registerConnection(socket, connectionMeta);
        const isEndpoint = airpadRouter.isEndpoint(socket);

        app.log?.info?.(
            {
                socketId: socket.id,
                transport: socket?.conn?.transport?.name,
                handshake: {
                    ...describeHandshake(socket.request),
                    ...describeAirPadConnectionMeta(socket)
                }
            },
            "[socket.io] New connection"
        );

        socket.on("hello", (data: any) => {
            const handshakeClientId = getHandshakeClientId(socket);
            deviceId = normalizeHint(data?.id as string) || handshakeClientId || sourceAlias || socket.id;
            airpadRouter.registerAlias(socket, deviceId);
            if (deviceId) {
                airpadRouter.registerTunnelAlias(socket, deviceId);
            }
            console.log(`[Server] HELLO from ${deviceId}, socket.id=${socket.id}`);
            socket.emit("hello-ack", { id: deviceId, status: "connected" });
            socket.broadcast.emit("device-connected", { id: deviceId });
        });

        const onObjectMessage = createAirpadObjectMessageHandler(socket, {
            routeMessage,
            requiresAirpadMessageAuth,
            getSourceId: (targetSocket) => deviceId || normalizeHint((targetSocket as any).airpadSourceId) || targetSocket.id,
            clipHistory,
            maxHistory,
            logMsg,
            emitError: (targetSocket, message) => {
                targetSocket.emit("error", { message });
            }
        });

        registerAirpadSocketHandlers(socket, {
            logger: app.log,
            allowLocalInput: isEndpoint,
            onObjectMessage,
            onBinaryMessage: async (raw: any, sourceSocket) => {
                const isEndpoint = airpadRouter.isEndpoint(sourceSocket);
                if (!(raw instanceof Uint8Array) && !Buffer.isBuffer(raw) && !(raw instanceof ArrayBuffer)) {
                    if (isTunnelDebug) {
                        console.log(`[Router] Binary tunnel skipped: unsupported payload type`, `type=${typeof raw}`);
                    }
                    return false;
                }
                const tunnelTargets = airpadRouter.resolveTunnelTargets(sourceSocket, { to: "broadcast" });
                if (!tunnelTargets.length) {
                    if (!isEndpoint) {
                        if (isTunnelDebug) {
                            console.log(
                                `[Router] Binary local handling skipped for non-endpoint socket`,
                                `socket=${sourceSocket.id}`,
                                `via=${airpadRouter.getRouteHint(sourceSocket) || "?"}`
                            );
                        }
                        return false;
                    }
                    if (isTunnelDebug) {
                        console.log(`[Router] Binary tunnel target unavailable`, `socket=${sourceSocket.id}`, `via=${airpadRouter.getRouteHint(sourceSocket) || "?"}`);
                    }
                    return false;
                }
                for (const target of tunnelTargets) {
                    const targetDelivered = airpadRouter.forwardToAirpadTargets(sourceSocket, raw, { to: target, type: "binary" });
                    if (targetDelivered) {
                        if (isTunnelDebug) {
                            console.log(`[Router] OUT(tunnel-binary)`, `socket=${sourceSocket.id}`, `target=${target}`);
                        }
                        return true;
                    }
                    if (airpadRouter.forwardBinaryToUpstream(sourceSocket, raw, target)) {
                        return true;
                    }
                }
                if (isTunnelDebug) {
                    const knownTunnelTargets = airpadRouter.getTunnelTargets().filter((key) => key);
                    console.log(`[Router] Binary tunnel attempt`, `socket=${sourceSocket.id}`, `forwarded=false`, `target=${tunnelTargets.join("|")}`, `known=${knownTunnelTargets.join(",")}`);
                }
                if (isTunnelDebug) {
                    const upstreamEnabled = networkContext?.sendToUpstream instanceof Function;
                    console.warn(`[Router] Binary tunnel target not found for ${sourceSocket.id}`, `target=${tunnelTargets.join("|")}`, `upstreamEnabled=${upstreamEnabled}`);
                    if (!upstreamEnabled) {
                        console.warn(`[Router] Binary tunnel dropped`, `reason=no upstream connector available`, `socket=${sourceSocket.id}`, `via=${airpadRouter.getRouteHint(sourceSocket) || "?"}`);
                    }
                }
                if (!isTunnelDebug) {
                    console.warn(`[Router] Binary tunnel target not found for ${sourceSocket.id}`);
                }
                return false;
            },
            onDisconnect: (reason) => {
                console.log(`[Server] Disconnected: ${deviceId || socket.id}, reason: ${reason}`);
                airpadRouter.unregisterConnection(socket);
                const currentDeviceId = normalizeHint(deviceId);
                removeSocketRequestPendings("", currentDeviceId);
                if (deviceId && airpadRouter.getSocket(deviceId) === socket) {
                    socket.broadcast.emit("device-disconnected", { id: deviceId });
                }
            }
        });

        socket.on("network.fetch", (request: any, ack?: (value: any) => void) => {
            const userId = normalizeHint(request?.userId || "");
            const deviceId = normalizeHint(request?.to || request?.deviceId || request?.target || "");
            const requestId = normalizeHint(String(request?.requestId || ""));
            if (!request || typeof request !== "object" || !requestId || !deviceId) return;

            let pending = pendingFetchReplies.get(requestToDeviceKey(userId, deviceId, requestId));
            if (!pending) {
                const fallbackKeySuffix = `:${deviceId}:${requestId}`;
                for (const [pendingKey, pendingValue] of pendingFetchReplies.entries()) {
                    if (pendingKey.endsWith(fallbackKeySuffix)) {
                        pending = pendingValue;
                        pendingFetchReplies.delete(pendingKey);
                        break;
                    }
                }
            } else {
                pendingFetchReplies.delete(requestToDeviceKey(userId, deviceId, requestId));
            }
            if (!pending) return;
            if (pending.timer) clearTimeout(pending.timer);
            pending.resolve(request);
            if (typeof ack === "function") {
                ack({ ok: true, requestId: String(request?.requestId || ""), status: 200 });
            }
        });

        socket.on("multicast", (data: { message: any; deviceIds?: string[] }) => {
            if (!data?.message) {
                socket.emit("error", { message: "Invalid multicast request" });
                return;
            }
            multicastMessage(socket, data.message, data.deviceIds);
        });

        socket.on("error", (error: Error) => {
            app.log?.error?.(
                {
                    socketId: deviceId || socket.id,
                    message: error?.message,
                    stack: (error as any)?.stack
                },
                "[socket.io] Socket error"
            );
        });
    });

    // Minimal debug endpoints (optional but handy)
    app.get("/core/bridge/devices", async () => {
        const tunnelTargets = airpadRouter.getTunnelTargets().filter(Boolean);
        const devices = airpadRouter.getDebugDevices();
        return {
            ok: true,
            upstreamConnected: networkContext?.sendToUpstream != null,
            upstreamUserId: networkContext?.upstreamUserId,
            connectedCount: devices.length,
            devices,
            tunnelTargets
        };
    });
    app.get("/core/bridge/history", async (req: any) => {
        const limit = Math.max(1, Math.min(500, parsePortableInteger(req?.query?.limit) ?? maxHistory));
        return { ok: true, limit, entries: clipHistory.slice(-limit) };
    });

    return {
        io,
        addMessageHook: (hook) => messageHooks.push(hook),
        getConnectedDevices: () => airpadRouter.getConnectedDevices(),
        getClipboardHistory: (limit = maxHistory) => clipHistory.slice(-limit),
        sendToDevice: airpadRouter.sendToDevice,
        requestToDevice
    };
};
