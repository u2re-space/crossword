//#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write --allow-ffi --unstable

/**
 * Host Server (Deno)
 *
 * This server provides:
 * - WebSocket communication for device synchronization
 * - File system access for data persistence
 * - Network access for multi-device communication
 * - Multi-cast messaging (broadcast to all devices except sender)
 * - Message routing, hooking, and translation
 * - Latest/next/nightly NodeJS compatibility
 *
 * Usage:
 *   deno run -A server.ts [--port=8080] [--host=0.0.0.0]
 */

import { Server, Socket } from "npm:socket.io@^4.7.5";
import { parsePayload, verifyWithoutDecrypt } from "./crypto-utils.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

// Configuration
interface ServerConfig {
    port: number;
    host: string;
}

// Device management: deviceId -> socket
const clients = new Map<string, Socket>();

// Message history for inspection mode
interface ClipHistoryEntry {
    from: string;
    to: string;
    ts: number;
    data: any;
}

const clipHistory: ClipHistoryEntry[] = [];
const MAX_HISTORY = 100;

// Message hooks for translation/routing
type MessageHook = (msg: any, socket: Socket) => any | null;
const messageHooks: MessageHook[] = [];

/**
 * Add a message hook for translation/routing
 *
 * @param hook - Function that processes messages (return null to skip, or modified message)
 */
export function addMessageHook(hook: MessageHook): void {
    messageHooks.push(hook);
}

/**
 * Process message through all hooks
 *
 * @param msg - Original message
 * @param socket - Source socket
 * @returns Processed message or null if should be skipped
 */
function processMessageHooks(msg: any, socket: Socket): any | null {
    let processedMsg = msg;
    for (const hook of messageHooks) {
        const result = hook(processedMsg, socket);
        if (result === null) {
            return null; // Skip this message
        }
        if (result !== undefined) {
            processedMsg = result; // Use modified message
        }
    }
    return processedMsg;
}

/**
 * Log message with metadata
 */
function logMsg(prefix: string, msg: any): void {
    const payloadLen = msg.payload ? (typeof msg.payload === "string" ? msg.payload.length : JSON.stringify(msg.payload).length) : 0;
    console.log(
        `[${new Date().toISOString()}] ${prefix} type=${msg.type} from=${msg.from} to=${msg.to} mode=${msg.mode || "blind"} action=${msg.action || "N/A"} payloadLen=${payloadLen}`
    );
}

/**
 * Route message to target device(s)
 *
 * @param sourceSocket - Source socket (sender)
 * @param msg - Message to route
 */
function routeMessage(sourceSocket: Socket, msg: any): void {
    // Process through hooks
    const processedMsg = processMessageHooks(msg, sourceSocket);
    if (processedMsg === null) {
        console.log(`[Router] Message skipped by hook`);
        return;
    }

    if (processedMsg.to === "broadcast") {
        // Broadcast to all devices except sender
        sourceSocket.broadcast.emit("message", processedMsg);
        logMsg("OUT(broadcast)", processedMsg);
    } else {
        // Send to specific device
        const targetSocket = clients.get(processedMsg.to);
        if (targetSocket) {
            targetSocket.emit("message", processedMsg);
            logMsg(`OUT(to=${processedMsg.to})`, processedMsg);
        } else {
            console.warn(`[Router] No target client for deviceId: ${processedMsg.to}`);
        }
    }
}

/**
 * Multi-cast message to multiple devices
 *
 * @param sourceSocket - Source socket (will be excluded)
 * @param msg - Message to send
 * @param deviceIds - Array of device IDs to send to (empty = broadcast to all)
 */
function multicastMessage(sourceSocket: Socket, msg: any, deviceIds?: string[]): void {
    const processedMsg = processMessageHooks(msg, sourceSocket);
    if (processedMsg === null) {
        return;
    }

    if (!deviceIds || deviceIds.length === 0) {
        // Broadcast to all except sender
        sourceSocket.broadcast.emit("message", processedMsg);
        logMsg("OUT(multicast-all)", processedMsg);
    } else {
        // Send to specific devices
        let sentCount = 0;
        for (const deviceId of deviceIds) {
            const targetSocket = clients.get(deviceId);
            if (targetSocket && targetSocket !== sourceSocket) {
                targetSocket.emit("message", processedMsg);
                sentCount++;
            }
        }
        logMsg(`OUT(multicast-${sentCount})`, processedMsg);
    }
}

/**
 * Initialize Socket.IO server
 */
function createServer(config: ServerConfig): Server {
    const io = new Server({
        cors: {
            origin: "*", // Configure as needed for production
            methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket: Socket) => {
        let deviceId: string | null = null;

        console.log(`[Server] New connection: ${socket.id}`);

        // Handle client hello/identification
        socket.on("hello", (data: any) => {
            deviceId = data.id || socket.id;
            clients.set(deviceId, socket);
            console.log(`[Server] HELLO from ${deviceId}, socket.id=${socket.id}`);

            // Send acknowledgment
            socket.emit("hello-ack", { id: deviceId, status: "connected" });

            // Notify other clients of new device (optional)
            socket.broadcast.emit("device-connected", { id: deviceId });
        });

        // Handle universal messages
        // Message format:
        // {
        //   type: "clip" | "command" | ...
        //   from: "deviceA",
        //   to: "broadcast" | "deviceB",
        //   mode: "blind" | "inspect" | ...
        //   action: "setClipboard" | "runScript" | ...
        //   payload: "BASE64(...)" // encrypted payload
        // }
        socket.on("message", async (msg: any) => {
            if (!msg || typeof msg !== "object") {
                return;
            }

            msg.mode = msg.mode || "blind";
            msg.from = msg.from || deviceId || socket.id;

            logMsg("IN ", msg);

            try {
                if (msg.mode === "blind") {
                    // Blind relay mode: verify signature without decryption
                    const ok = verifyWithoutDecrypt(msg.payload);
                    if (!ok) {
                        console.warn(`[Server] Signature verification failed (blind mode) for from=${msg.from}`);
                        socket.emit("error", { message: "Signature verification failed" });
                        return;
                    }

                    // Route message as-is
                    routeMessage(socket, msg);
                    return;
                }

                if (msg.mode === "inspect") {
                    // Inspect mode: server can decrypt and read content
                    const { from, inner } = parsePayload(msg.payload);

                    console.log(
                        `[Server] INSPECT from=${from} to=${msg.to} type=${msg.type} action=${msg.action} data=${JSON.stringify(inner)}`
                    );

                    // Save to history if it's a clipboard message
                    if (msg.type === "clip") {
                        clipHistory.push({
                            from,
                            to: msg.to,
                            ts: inner.ts || Date.now(),
                            data: inner.data || null,
                        });
                        if (clipHistory.length > MAX_HISTORY) {
                            clipHistory.shift();
                        }
                    }

                    // Additional processing can be done here
                    // (logging, automatic actions, etc.)

                    // Forward the original message (unchanged)
                    routeMessage(socket, msg);
                    return;
                }

                // Unknown mode
                console.warn(`[Server] Unknown mode: ${msg.mode}`);
                socket.emit("error", { message: `Unknown mode: ${msg.mode}` });
            } catch (error) {
                console.error(`[Server] Error handling message:`, error);
                socket.emit("error", { message: `Error processing message: ${error.message}` });
            }
        });

        // Handle multicast requests
        socket.on("multicast", (data: { message: any; deviceIds?: string[] }) => {
            if (!data.message) {
                socket.emit("error", { message: "Invalid multicast request" });
                return;
            }
            multicastMessage(socket, data.message, data.deviceIds);
        });

        // Handle disconnect
        socket.on("disconnect", (reason: string) => {
            console.log(`[Server] Disconnected: ${deviceId || socket.id}, reason: ${reason}`);
            if (deviceId && clients.get(deviceId) === socket) {
                clients.delete(deviceId);
                // Notify other clients
                socket.broadcast.emit("device-disconnected", { id: deviceId });
            }
        });

        // Handle errors
        socket.on("error", (error: Error) => {
            console.error(`[Server] Socket error for ${deviceId || socket.id}:`, error);
        });
    });

    return io;
}

/**
 * Get list of connected devices
 */
export function getConnectedDevices(): string[] {
    return Array.from(clients.keys());
}

/**
 * Get clipboard history
 */
export function getClipboardHistory(limit: number = MAX_HISTORY): ClipHistoryEntry[] {
    return clipHistory.slice(-limit);
}

/**
 * Main server function
 */
async function main() {
    const args = parseArgs(Deno.args, {
        string: ["port", "host"],
        default: {
            port: "8081",
            host: "0.0.0.0",
        },
    });

    const config: ServerConfig = {
        port: parseInt(args.port as string, 10),
        host: args.host as string,
    };

    console.log(`[Server] Starting Automata server...`);
    console.log(`[Server] Listening on ${config.host}:${config.port}`);

    const io = createServer(config);

    // Start server
    io.listen(config.port, {
        host: config.host,
    });

    console.log(`[Server] Socket.IO server listening on ws://${config.host}:${config.port}`);

    // Handle graceful shutdown
    Deno.addSignalListener("SIGINT", () => {
        console.log(`[Server] Shutting down...`);
        io.close();
        Deno.exit(0);
    });

    Deno.addSignalListener("SIGTERM", () => {
        console.log(`[Server] Shutting down...`);
        io.close();
        Deno.exit(0);
    });
}

if (import.meta.main) {
    await main();
}

export { createServer, routeMessage, multicastMessage };
