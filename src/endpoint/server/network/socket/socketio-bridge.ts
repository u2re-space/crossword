import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer, type Socket } from "socket.io";

import { buildSocketIoOptions, describeHandshake } from "./socketio-security.ts";
import {
    applyMessageHooks,
    createAirpadObjectMessageHandler,
    isAirPadAuthorized,
    isBroadcast,
    normalizeSocketFrame,
    type AirpadClipHistoryEntry,
    type SocketMessageHook
} from "../routing/index.ts";
import { describeAirPadConnectionMeta,
requiresAirpadMessageAuth } from "../routing/airpad.ts";
import { registerAirpadSocketHandlers } from "../../routing/socket-airpad.ts";

type ClipHistoryEntry = AirpadClipHistoryEntry;

export type SocketIoBridge = {
    addMessageHook: (hook: SocketMessageHook) => void;
    getConnectedDevices: () => string[];
    getClipboardHistory: (limit?: number) => ClipHistoryEntry[];
    io: SocketIOServer;
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

const mapHookPayload = (hooks: SocketMessageHook[], msg: any, socket: Socket) =>
    applyMessageHooks(hooks, msg, socket);

export const createSocketIoBridge = (app: FastifyInstance, opts?: { maxHistory?: number }): SocketIoBridge => {
    const maxHistory = opts?.maxHistory ?? MAX_HISTORY_DEFAULT;
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
            deviceId = (data?.id as string) || socket.id;
            clients.set(deviceId, socket);
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
            onDisconnect: (reason) => {
                console.log(`[Server] Disconnected: ${deviceId || socket.id}, reason: ${reason}`);
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
    app.get("/core/bridge/devices", async () => ({ ok: true, devices: Array.from(clients.keys()) }));
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


