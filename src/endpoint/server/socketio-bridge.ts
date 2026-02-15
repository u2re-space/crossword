import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer, type Socket } from "socket.io";

import { parsePayload, verifyWithoutDecrypt } from "./crypto-utils.ts";
import { registerAirpadSocketHandlers, setupAirpadClipboardBroadcast } from "./socket-airpad.ts";

type ClipHistoryEntry = {
    from: string;
    to: string;
    ts: number;
    data: any;
};

type MessageHook = (msg: any, socket: Socket) => any | null | undefined;

export type SocketIoBridge = {
    addMessageHook: (hook: MessageHook) => void;
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

const processHooks = (hooks: MessageHook[], msg: any, socket: Socket): any | null => {
    let processed = msg;
    for (const hook of hooks) {
        const result = hook(processed, socket);
        if (result === null) return null;
        if (result !== undefined) processed = result;
    }
    return processed;
};

export const createSocketIoBridge = (app: FastifyInstance, opts?: { maxHistory?: number }): SocketIoBridge => {
    const maxHistory = opts?.maxHistory ?? MAX_HISTORY_DEFAULT;
    const io = new SocketIOServer(app.server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
        transports: ["websocket", "polling"]
    });

    // Device management: deviceId -> socket
    const clients = new Map<string, Socket>();

    // Message history for inspection mode
    const clipHistory: ClipHistoryEntry[] = [];

    // Message hooks for translation/routing
    const messageHooks: MessageHook[] = [];

    setupAirpadClipboardBroadcast(io as any);

    const routeMessage = (sourceSocket: Socket, msg: any): void => {
        const processed = processHooks(messageHooks, msg, sourceSocket);
        if (processed === null) {
            console.log(`[Router] Message skipped by hook`);
            return;
        }

        if (processed.to === "broadcast") {
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
        const processed = processHooks(messageHooks, msg, sourceSocket);
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
        console.log(`[Server] New connection: ${socket.id}`);

        socket.on("hello", (data: any) => {
            deviceId = (data?.id as string) || socket.id;
            clients.set(deviceId, socket);
            console.log(`[Server] HELLO from ${deviceId}, socket.id=${socket.id}`);
            socket.emit("hello-ack", { id: deviceId, status: "connected" });
            socket.broadcast.emit("device-connected", { id: deviceId });
        });

        registerAirpadSocketHandlers(socket, {
            logger: app.log,
            onObjectMessage: async (msg) => {
                msg.mode = msg.mode || "blind";
                msg.from = msg.from || deviceId || socket.id;

                logMsg("IN ", msg);

                try {
                    if (msg.mode === "blind") {
                        const ok = verifyWithoutDecrypt(msg.payload);
                        if (!ok) {
                            console.warn(`[Server] Signature verification failed (blind mode) for from=${msg.from}`);
                            socket.emit("error", { message: "Signature verification failed" });
                            return;
                        }
                        routeMessage(socket, msg);
                        return;
                    }

                    if (msg.mode === "inspect") {
                        const { from, inner } = parsePayload(msg.payload);
                        console.log(
                            `[Server] INSPECT from=${from} to=${msg.to} type=${msg.type} action=${msg.action} data=${JSON.stringify(inner)}`
                        );

                        if (msg.type === "clip") {
                            clipHistory.push({
                                from,
                                to: msg.to,
                                ts: inner?.ts || Date.now(),
                                data: inner?.data ?? null
                            });
                            if (clipHistory.length > maxHistory) clipHistory.shift();
                        }

                        routeMessage(socket, msg);
                        return;
                    }

                    console.warn(`[Server] Unknown mode: ${msg.mode}`);
                    socket.emit("error", { message: `Unknown mode: ${msg.mode}` });
                } catch (error: any) {
                    console.error(`[Server] Error handling message:`, error);
                    socket.emit("error", { message: `Error processing message: ${error?.message || String(error)}` });
                }
            },
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
            console.error(`[Server] Socket error for ${deviceId || socket.id}:`, error);
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


