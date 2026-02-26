import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer, type Socket } from "socket.io";

import { parsePayload, verifyWithoutDecrypt } from "./crypto-utils.ts";
import { registerAirpadSocketHandlers, setupAirpadClipboardBroadcast } from "./socket-airpad.ts";
import { buildSocketIoOptions, describeHandshake } from "./socketio-security.ts";

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
const requiresAirpadMessageAuth = process.env.AIRPAD_REQUIRE_SIGNED_MESSAGE === "true";
const getAirPadTokens = () =>
    (process.env.AIRPAD_AUTH_TOKENS || process.env.AIRPAD_TOKENS || "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

const getAirPadTokenFromSocket = (socket: Socket) => {
    const handshake: any = (socket as any).handshake || {};
    const auth = handshake.auth || {};
    const query = handshake.query || {};
    const pick = (value: unknown) => {
        if (typeof value === "string") return value;
        if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
        return "";
    };

    return (
        pick(auth.token) ||
        pick(auth.airpadToken) ||
        pick(query.token) ||
        pick(query.airpadToken)
    );
};

const isAirPadAuthorized = (socket: Socket) => {
    const allowed = getAirPadTokens();
    if (!allowed.length) return true;
    const provided = getAirPadTokenFromSocket(socket);
    return !!provided && allowed.includes(provided);
};

const hasSignedEnvelope = (payload: unknown): payload is { cipher: string; sig: string; from?: string } =>
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as any).cipher === "string" &&
    typeof (payload as any).sig === "string";

const extractPayload = (payload: unknown) => {
    if (!hasSignedEnvelope(payload)) return payload as unknown;
    if (!requiresAirpadMessageAuth) return payload;
    const parsed = parsePayload(payload);
    return parsed.inner;
};

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

const normalizeControlMessage = (msg: any, sourceId: string): any => {
    const source = msg?.from || msg?.sender || sourceId;
    const target = msg?.to || msg?.target || msg?.targetId || msg?.deviceId || msg?.target_id || "broadcast";
    const mode = msg?.mode || msg?.protocolMode || "blind";
    const type = msg?.type || msg?.action || "dispatch";
    const payload = msg?.payload ?? msg?.data ?? msg?.body ?? msg;
    return {
        ...msg,
        from: source,
        to: target,
        mode,
        type,
        payload
    };
};

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
    const messageHooks: MessageHook[] = [];

    setupAirpadClipboardBroadcast(io as any);

    const routeMessage = (sourceSocket: Socket, msg: any): void => {
        const normalized = normalizeControlMessage(msg, sourceSocket.id);
        const processed = processHooks(messageHooks, normalized, sourceSocket);
        if (processed === null) {
            console.log(`[Router] Message skipped by hook`);
            return;
        }

        if (processed.to === "broadcast" || processed.broadcast === true) {
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
                handshake: describeHandshake(socket.request)
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

        registerAirpadSocketHandlers(socket, {
            logger: app.log,
            onObjectMessage: async (msg) => {
                const normalized = normalizeControlMessage(msg, deviceId || socket.id);
                const signed = hasSignedEnvelope(normalized.payload);
                const envelopeRequired = requiresAirpadMessageAuth || normalized.mode === "secure";

                if (envelopeRequired) {
                    if (!signed) {
                        console.warn(`[Server] AirPad signed payload required for mode=${normalized.mode}, from=${normalized.from}`);
                        socket.emit("error", { message: "Signed payload required" });
                        return;
                    }
                    const ok = verifyWithoutDecrypt(normalized.payload);
                    if (!ok) {
                        console.warn(`[Server] Signed payload validation failed for from=${normalized.from}`);
                        socket.emit("error", { message: "Signed payload validation failed" });
                        return;
                    }
                }

                const parsed = hasSignedEnvelope(normalized.payload) ? parsePayload(normalized.payload) : null;
                if (parsed) {
                    normalized.from = normalized.from || parsed.from;
                    normalized.payload = extractPayload(normalized.payload);
                }

                logMsg("IN ", normalized);

                try {
                    if (normalized.mode === "blind") {
                        if (!requiresAirpadMessageAuth && !envelopeRequired) {
                            const ok = verifyWithoutDecrypt(normalized.payload);
                            if (!ok) {
                                console.warn(`[Server] Signature verification failed (blind mode) for from=${normalized.from}`);
                                socket.emit("error", { message: "Signature verification failed" });
                                return;
                            }
                        }
                        routeMessage(socket, normalized);
                        return;
                    }

                    if (normalized.mode === "inspect") {
                        const { from, inner } = parsePayload(normalized.payload);
                        console.log(
                            `[Server] INSPECT from=${from} to=${normalized.to} type=${normalized.type} action=${normalized.action} data=<hidden>`
                        );

                        if (normalized.type === "clip") {
                            clipHistory.push({
                                from,
                                to: normalized.to,
                                ts: inner?.ts || Date.now(),
                                data: inner?.data ?? null
                            });
                            if (clipHistory.length > maxHistory) clipHistory.shift();
                        }

                        routeMessage(socket, normalized);
                        return;
                    }

                    console.warn(`[Server] Unknown mode: ${normalized.mode}`);
                    socket.emit("error", { message: `Unknown mode: ${normalized.mode}` });
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


