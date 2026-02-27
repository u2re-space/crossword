import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer, type Socket } from "socket.io";

import { buildSocketIoOptions, describeHandshake } from "./socketio-security.ts";
import {
    applyMessageHooks,
    createAirpadObjectMessageHandler,
    describeAirPadConnectionMeta,
    isAirPadAuthorized,
    isBroadcast,
    normalizeSocketFrame,
    type AirpadClipHistoryEntry,
    type AirpadConnectionMeta,
    type SocketMessageHook
} from "../routing/index.ts";
import { registerAirpadSocketHandlers } from "../../routing/socket-airpad.ts";
import { requiresAirpadMessageAuth } from "../routing/airpad.ts";

type ClipHistoryEntry = AirpadClipHistoryEntry;

export type SocketIoBridge = {
    addMessageHook: (hook: SocketMessageHook) => void;
    getConnectedDevices: () => string[];
    getClipboardHistory: (limit?: number) => ClipHistoryEntry[];
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
    const payloadLen = msg?.payload
        ? (typeof msg.payload === "string" ? msg.payload.length : JSON.stringify(msg.payload).length)
        : 0;
    // Keep this format stable for grep-ability and client debugging
    console.log(
        `[${new Date().toISOString()}] ${prefix} type=${msg?.type} from=${msg?.from} to=${msg?.to} mode=${msg?.mode || "blind"} action=${msg?.action || "N/A"} payloadLen=${payloadLen}`
    );
};
const isTunnelDebug = String(process.env.AIRPAD_TUNNEL_DEBUG || "").toLowerCase() === "true";

const mapHookPayload = (hooks: SocketMessageHook[], msg: any, socket: Socket) =>
    applyMessageHooks(hooks, msg, socket);

export const createSocketIoBridge = (app: FastifyInstance, opts: SocketIoBridgeOptions = {}): SocketIoBridge => {
    const maxHistory = opts?.maxHistory ?? MAX_HISTORY_DEFAULT;
    const networkContext = opts.networkContext;
    const io = new SocketIOServer(app.server, buildSocketIoOptions(app.log as any));
    const allowPrivateNetwork = process.env.CORS_ALLOW_PRIVATE_NETWORK !== "false";
    const applyPrivateNetworkHeaders = (headers: Record<string, any>, req: any): void => {
        if (!allowPrivateNetwork) return;
        const pnaHeader = String(req?.headers?.["access-control-request-private-network"] || "").toLowerCase();
        if (pnaHeader !== "true") return;

        headers["Access-Control-Allow-Private-Network"] = "true";
        const existingVary = String(headers["Vary"] || headers["vary"] || "");
        const varyParts = existingVary
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        if (!varyParts.includes("Access-Control-Request-Private-Network")) {
            varyParts.push("Access-Control-Request-Private-Network");
        }
        if (varyParts.length > 0) {
            headers["Vary"] = varyParts.join(", ");
        }
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

    // Device management: deviceId -> socket
    const clients = new Map<string, Socket>();
    const airpadConnectionMeta = new Map<Socket, AirpadConnectionMeta>();
    const airpadTargets = new Map<string, Set<Socket>>();

    const normalizeHint = (value: unknown): string => {
        if (typeof value !== "string") return "";
        const normalized = value.trim().toLowerCase();
        return normalized;
    };

    const isBroadcastTarget = (value: string): boolean => value === "broadcast" || value === "all" || value === "*";

    const getHandshakeClientId = (socket: Socket): string | undefined => {
        const handshake: Record<string, unknown> = (socket as any).handshake || {};
        const auth = (handshake.auth && typeof handshake.auth === "object") ? handshake.auth as Record<string, unknown> : {};
        const query = (handshake.query && typeof handshake.query === "object") ? handshake.query as Record<string, unknown> : {};
        const raw = typeof auth.clientId === "string"
            ? auth.clientId
            : typeof query.clientId === "string"
                ? query.clientId
                : "";
        const normalized = normalizeHint(raw);
        return normalized || undefined;
    };

    const encodeBinaryForTunnel = (raw: Buffer | Uint8Array): string => {
        try {
            return Buffer.from(raw).toString("base64");
        } catch {
            return "";
        }
    };

    const forwardBinaryToUpstream = (sourceSocket: Socket, raw: Buffer | Uint8Array, target: string): boolean => {
        if (!networkContext?.sendToUpstream) {
            if (isTunnelDebug) {
                console.log(
                    `[Router] Binary tunnel upstream unavailable`,
                    `socket=${sourceSocket.id}`,
                    `target=${target}`,
                    `via=${airpadConnectionMeta.get(sourceSocket)?.routeHint || "?"}`
                );
            }
            return false;
        }
        const meta = airpadConnectionMeta.get(sourceSocket);
        const upstreamTarget = normalizeHint(target);
        if (!upstreamTarget || isBroadcastTarget(upstreamTarget)) return false;

        const upstreamPayload = {
            type: "dispatch",
            from: normalizeHint((sourceSocket as any).userId) || sourceSocket.id,
            to: upstreamTarget,
            target: upstreamTarget,
            targetId: upstreamTarget,
            namespace: "default",
            mode: "blind",
            payload: {
                __airpadBinary: true,
                encoding: "base64",
                data: encodeBinaryForTunnel(raw)
            },
            userId: normalizeHint(networkContext.upstreamUserId) || normalizeHint(meta?.targetHost) || normalizeHint(meta?.hostHint),
            via: normalizeHint(meta?.routeHint),
            surface: "socketio"
        };
        const accepted = networkContext.sendToUpstream(upstreamPayload);
        if (accepted && isTunnelDebug) {
            console.log(`[Router] OUT(tunnel-upstream-binary)`, `socket=${sourceSocket.id}`, `target=${upstreamTarget}`);
        } else if (isTunnelDebug) {
            console.log(
                `[Router] Binary tunnel upstream rejected`,
                `socket=${sourceSocket.id}`,
                `target=${upstreamTarget}`,
                `via=${airpadConnectionMeta.get(sourceSocket)?.routeHint || "?"}`
            );
        }
        return accepted;
    };

    const registerAirpadSocketHints = (socket: Socket, meta: AirpadConnectionMeta): void => {
        airpadConnectionMeta.set(socket, meta);
        if (meta.targetHost) {
            const targetHost = normalizeHint(meta.targetHost);
            if (targetHost) {
                const existing = airpadTargets.get(targetHost) || new Set<Socket>();
                existing.add(socket);
                airpadTargets.set(targetHost, existing);
                if (isTunnelDebug && normalizeHint(meta.routeHint) === "tunnel") {
                    console.log(
                        `[Router] Tunnel host register:`,
                        `socket=${socket.id}`,
                        `targetHost=${targetHost}`
                    );
                }
            }
        }
        if (meta.hostHint) {
            const hostHint = normalizeHint(meta.hostHint);
            if (hostHint) {
                const existing = airpadTargets.get(hostHint) || new Set<Socket>();
                existing.add(socket);
                airpadTargets.set(hostHint, existing);
                if (isTunnelDebug && normalizeHint(meta.routeHint) === "tunnel") {
                    console.log(
                        `[Router] Tunnel host register:`,
                        `socket=${socket.id}`,
                        `hostHint=${hostHint}`
                    );
                }
            }
        }
        if (meta.clientId) {
            const clientId = normalizeHint(meta.clientId);
            if (clientId) {
                const existing = airpadTargets.get(clientId) || new Set<Socket>();
                existing.add(socket);
                airpadTargets.set(clientId, existing);
                if (isTunnelDebug && normalizeHint(meta.routeHint) === "tunnel") {
                    console.log(
                        `[Router] Tunnel host register:`,
                        `socket=${socket.id}`,
                        `clientId=${clientId}`
                    );
                }
            }
        }
    };

    const unregisterAirpadSocketHints = (socket: Socket): void => {
        const meta = airpadConnectionMeta.get(socket);
        if (!meta) return;
        const remove = (target: unknown): void => {
            const normalized = normalizeHint(target);
            if (!normalized) return;
            const existing = airpadTargets.get(normalized);
            if (!existing) return;
            existing.delete(socket);
            if (existing.size === 0) {
                airpadTargets.delete(normalized);
            }
        };
        remove(meta.targetHost);
        remove(meta.hostHint);
        remove(meta.clientId);
        airpadConnectionMeta.delete(socket);
    };

    const resolveTunnelTargets = (sourceSocket: Socket, frame: any): string[] => {
        const next = new Set<string>();
        const meta = airpadConnectionMeta.get(sourceSocket);
        const routeHint = normalizeHint(meta?.routeHint);
        if (routeHint !== "tunnel") return [];

        const frameTarget = normalizeHint(frame?.to);
        if (frameTarget && !isBroadcastTarget(frameTarget)) {
            next.add(frameTarget);
        }
        if (meta?.targetHost) {
            next.add(normalizeHint(meta.targetHost));
        }
        if (meta?.hostHint) {
            next.add(normalizeHint(meta.hostHint));
        }
        return Array.from(next).filter(Boolean);
    };

    const forwardToAirpadTargets = (sourceSocket: Socket, payload: any, frame: any): boolean => {
        const targets = resolveTunnelTargets(sourceSocket, frame);
        if (!targets.length) return false;
        let delivered = false;
        for (const rawTarget of targets) {
            const targetSockets = airpadTargets.get(rawTarget);
            if (!targetSockets) continue;
            for (const targetSocket of targetSockets) {
                if (targetSocket === sourceSocket) continue;
                targetSocket.emit("message", payload);
                delivered = true;
            }
        }
        return delivered;
    };

    const forwardToUpstream = (sourceSocket: Socket, frame: any): boolean => {
        if (!networkContext?.sendToUpstream) {
            if (isTunnelDebug) {
                console.log(
                    `[Router] Tunnel upstream unavailable`,
                    `socket=${sourceSocket.id}`,
                    `to=${normalizeHint(frame?.to) || "?"}`,
                    `via=${airpadConnectionMeta.get(sourceSocket)?.routeHint || "?"}`
                );
            }
            return false;
        }
        if (!frame || typeof frame !== "object") return false;
        const meta = airpadConnectionMeta.get(sourceSocket);
        if (normalizeHint(meta?.routeHint) !== "tunnel") return false;
        const rawTarget = normalizeHint(frame.to);
        if (!rawTarget || isBroadcastTarget(rawTarget)) return false;
        const accepted = networkContext.sendToUpstream({
            ...frame,
            userId: normalizeHint(networkContext.upstreamUserId) || meta?.targetHost || meta?.hostHint,
            target: rawTarget,
            targetId: rawTarget,
            to: rawTarget
        });
        if (!accepted && isTunnelDebug) {
            console.log(`[Router] Tunnel upstream rejected`, `socket=${sourceSocket.id}`, `to=${rawTarget}`);
        }
        return accepted;
    };

    // Message history for inspection mode
    const clipHistory: ClipHistoryEntry[] = [];

    // Message hooks for translation/routing
    const messageHooks: SocketMessageHook[] = [];

    const routeMessage = (sourceSocket: Socket, msg: any): void => {
        const normalized = normalizeSocketFrame(msg, sourceSocket.id, {
            nodeId: (sourceSocket as any).userId,
            peerId: sourceSocket.id,
            via: "socketio",
            surface: "external"
        });
        const processed = mapHookPayload(messageHooks, normalized, sourceSocket) as any;
        if (processed === null) {
            console.log(`[Router] Message skipped by hook`);
            return;
        }

        const tunnelTargets = resolveTunnelTargets(sourceSocket, processed);
        if (tunnelTargets.length > 0) {
            if (isTunnelDebug) {
                console.log(
                    `[Router] Tunnel route attempt`,
                    `socket=${sourceSocket.id}`,
                    `from=${processed.from}`,
                    `to=${processed.to}`,
                    `targets=${tunnelTargets.join(",")}`,
                    `via=${airpadConnectionMeta.get(sourceSocket)?.routeHint || "?"}`
                );
            }
            if (forwardToAirpadTargets(sourceSocket, processed, processed)) {
                logMsg("OUT(tunnel)", processed);
                if (isTunnelDebug) {
                    console.log(`[Router] OUT(tunnel) forwarded`, sourceSocket.id, `target=${processed.to}`);
                }
                return;
            }
            if (forwardToUpstream(sourceSocket, processed)) {
                logMsg("OUT(tunnel-upstream)", processed);
                return;
            }
            const knownTunnelTargets = Array.from(airpadTargets.keys()).filter((key) => key);
            if (isTunnelDebug) {
                console.warn(
                    `[Router] Tunnel target not found for ${sourceSocket.id}`,
                    `requested=${tunnelTargets.join(",")}`,
                    `known=${knownTunnelTargets.join(",")}`
                );
            } else {
                console.warn(`[Router] Tunnel target not found for ${sourceSocket.id}`);
            }
        }

        if (isBroadcast(processed)) {
            sourceSocket.broadcast.emit("message", processed);
            logMsg("OUT(broadcast)", processed);
            return;
        }

        const targetSocket = clients.get(processed.to);
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
            const targetSocket = clients.get(deviceId);
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
        registerAirpadSocketHints(socket, connectionMeta);

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
            deviceId = normalizeHint((data?.id as string)) || handshakeClientId || socket.id;
            clients.set(deviceId, socket);
            if (deviceId) {
                const rawDeviceId = normalizeHint(deviceId);
                if (rawDeviceId) {
                    const existing = airpadTargets.get(rawDeviceId) || new Set<Socket>();
                    existing.add(socket);
                    airpadTargets.set(rawDeviceId, existing);
                }
            }
            console.log(`[Server] HELLO from ${deviceId}, socket.id=${socket.id}`);
            socket.emit("hello-ack", { id: deviceId, status: "connected" });
            socket.broadcast.emit("device-connected", { id: deviceId });
        });

        const onObjectMessage = createAirpadObjectMessageHandler(socket, {
            routeMessage,
            requiresAirpadMessageAuth,
            getSourceId: (targetSocket) => deviceId || targetSocket.id,
            clipHistory,
            maxHistory,
            logMsg,
            emitError: (targetSocket, message) => {
                targetSocket.emit("error", { message });
            }
        });

        registerAirpadSocketHandlers(socket, {
            logger: app.log,
            onObjectMessage,
            onBinaryMessage: async (raw: any, sourceSocket) => {
                if (!(raw instanceof Uint8Array) && !Buffer.isBuffer(raw)) {
                    if (isTunnelDebug) {
                        console.log(`[Router] Binary tunnel skipped: unsupported payload type`, `type=${typeof raw}`);
                    }
                    return false;
                }
                const tunnelTargets = resolveTunnelTargets(sourceSocket, { to: "broadcast" });
                if (!tunnelTargets.length) {
                    if (isTunnelDebug) {
                        console.log(
                            `[Router] Binary tunnel target unavailable`,
                            `socket=${sourceSocket.id}`,
                            `via=${airpadConnectionMeta.get(sourceSocket)?.routeHint || "?"}`
                        );
                    }
                    return false;
                }
                for (const target of tunnelTargets) {
                    const targetDelivered = forwardToAirpadTargets(sourceSocket, raw, { to: target, type: "binary" });
                    if (targetDelivered) {
                        if (isTunnelDebug) {
                            console.log(`[Router] OUT(tunnel-binary)`, `socket=${sourceSocket.id}`, `target=${target}`);
                        }
                        return true;
                    }
                    if (forwardBinaryToUpstream(sourceSocket, raw, target)) {
                        return true;
                    }
                }
                if (isTunnelDebug) {
                    const knownTunnelTargets = Array.from(airpadTargets.keys()).filter((key) => key);
                    console.log(
                        `[Router] Binary tunnel attempt`,
                        `socket=${sourceSocket.id}`,
                        `forwarded=false`,
                        `target=${tunnelTargets.join("|")}`,
                        `known=${knownTunnelTargets.join(",")}`
                    );
                }
                if (isTunnelDebug) {
                    console.warn(
                        `[Router] Binary tunnel target not found for ${sourceSocket.id}`,
                        `target=${tunnelTargets.join("|")}`,
                        `upstreamEnabled=${Boolean(networkContext?.sendToUpstream)}`
                    );
                }
                if (!isTunnelDebug) {
                    console.warn(`[Router] Binary tunnel target not found for ${sourceSocket.id}`);
                }
                return false;
            },
            onDisconnect: (reason) => {
                console.log(`[Server] Disconnected: ${deviceId || socket.id}, reason: ${reason}`);
                unregisterAirpadSocketHints(socket);
                if (deviceId) {
                    const rawDeviceId = normalizeHint(deviceId);
                    const byId = airpadTargets.get(rawDeviceId);
                    if (byId) {
                        byId.delete(socket);
                        if (byId.size === 0) {
                            airpadTargets.delete(rawDeviceId);
                        }
                    }
                }
                if (deviceId && clients.get(deviceId) === socket) {
                    clients.delete(deviceId);
                    socket.broadcast.emit("device-disconnected", { id: deviceId });
                }
            },
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
        const tunnelTargets = Array.from(airpadTargets.keys()).filter(Boolean);
        const devices = Array.from(clients.entries()).map(([deviceId, socket]) => {
            const meta = airpadConnectionMeta.get(socket);
            return {
                deviceId,
                socketId: socket.id,
                clientId: meta?.clientId,
                targetHost: meta?.targetHost,
                hostHint: meta?.hostHint,
                routeHint: meta?.routeHint,
                targetPort: meta?.targetPort,
                viaPort: meta?.viaPort,
                protocolHint: meta?.protocolHint
            };
        });
        return {
            ok: true,
            upstreamConnected: Boolean(networkContext?.sendToUpstream),
            upstreamUserId: networkContext?.upstreamUserId,
            connectedCount: devices.length,
            devices,
            tunnelTargets
        };
    });
    app.get("/core/bridge/history", async (req: any) => {
        const limit = Math.max(1, Math.min(500, Number(req?.query?.limit || maxHistory)));
        return { ok: true, limit, entries: clipHistory.slice(-limit) };
    });

    return {
        io,
        addMessageHook: (hook) => messageHooks.push(hook),
        getConnectedDevices: () => Array.from(clients.keys()),
        getClipboardHistory: (limit = maxHistory) => clipHistory.slice(-limit)
    };
};


