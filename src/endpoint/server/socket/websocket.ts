import { WebSocketServer, type WebSocket } from "ws";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

import { type Settings } from "../lib/settings.ts";
import { loadUserSettings } from "../lib/users.ts";

type ClientInfo = {
    userId: string;
    userKey: string;
    ws: WebSocket;
    id: string;
    namespace: string;
    reverse: boolean;
    deviceId?: string;
};

export type WsHub = {
    broadcast: (userId: string, payload: any) => void;
    multicast: (userId: string, payload: any, namespace?: string, excludeId?: string) => void;
    notify: (userId: string, type: string, data?: any) => void;
    sendTo: (clientId: string, payload: any) => void;
    sendToDevice: (userId: string, deviceId: string, payload: any) => boolean;
    getConnectedDevices: (userId?: string) => string[];
    close: () => Promise<void>;
};

export const createWsServer = (app: FastifyInstance): WsHub => {
    const server = app.server;
    const wss = new WebSocketServer({ noServer: true });
    const clients = new Map<WebSocket, ClientInfo>();
    const namespaces = new Map<string, Map<string, ClientInfo>>();
    const reverseClients = new Map<string, ClientInfo>();
    const reverseClientKey = (userId: string, deviceId: string) => `${userId}:${deviceId}`;

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

    wss.on("connection", async (ws, req) => {
        const params = new URL(req.url || "", "http://localhost").searchParams;
        const userId = params.get("userId") || undefined;
        const userKey = params.get("userKey") || undefined;
        const namespace = params.get("ns") || params.get("namespace") || userId;
        const mode = params.get("mode") || "push";
        const deviceId = params.get("deviceId") || "";
        const isReverse = mode === "reverse";
        const settings = await verify(userId, userKey);
        if (!settings || !userId || !userKey) {
            ws.close(4001, "Invalid credentials");
            return;
        }
        if (isReverse && !deviceId) {
            ws.close(4002, "Missing deviceId");
            return;
        }
        const info: ClientInfo = {
            userId,
            userKey,
            ws,
            id: randomUUID(),
            namespace: namespace || userId,
            reverse: isReverse,
            deviceId: isReverse ? deviceId : undefined,
        };
        clients.set(ws, info);
        if (!namespaces.has(info.userId)) namespaces.set(info.userId, new Map());
        namespaces.get(info.userId)!.set(info.id, info);
        if (isReverse && deviceId) {
            reverseClients.set(reverseClientKey(info.userId, deviceId), info);
            ws.send(JSON.stringify({ type: "welcome", id: info.id, userId, deviceId }));
        } else {
            ws.send(JSON.stringify({ type: "welcome", id: info.id, userId }));
        }

        ws.on("message", async (data) => {
            let parsed: any;
            try { parsed = JSON.parse(data.toString()); } catch { return; }
            const msg = parsed || {};
            if (info.reverse) {
                if (msg.type === "pong" || msg.type === "hello") {
                    return;
                }
                return;
            }
            const type = msg.type || msg.action || "dispatch";
            const payload = msg.payload ?? msg.data ?? msg.body ?? msg.message ?? msg;
            const targetId = msg.targetId || msg.target || msg.to || msg.deviceId || msg.target_id;
            const msgNamespace = msg.namespace || msg.ns;
            const shouldBroadcast = msg.broadcast === true || targetId === "broadcast";
            // Simple forwarding: if targetId matches a client, relay
            if (targetId && !shouldBroadcast) {
                const target = [...clients.values()].find((c) =>
                    c.id === targetId ||
                    c.deviceId === targetId ||
                    c.userId === targetId
                );
                target?.ws?.send?.(JSON.stringify({ type, payload, from: info.id }));
            } else {
                // broadcast to same userId
                multicast(info.userId, { type, payload, from: info.id }, msgNamespace || info.namespace, info.id);
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
            namespaces.get(info.userId)?.delete(info.id);
            if (namespaces.get(info.userId)?.size === 0) namespaces.delete(info.userId);
            if (info.reverse && info.deviceId) {
                reverseClients.delete(reverseClientKey(info.userId, info.deviceId));
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
        const target = reverseClients.get(reverseClientKey(userId, deviceId));
        if (!target?.ws) return false;
        try {
            target.ws.send(JSON.stringify(payload));
            return true;
        } catch {
            return false;
        }
    };

    const getConnectedDevices = (userId?: string): string[] => {
        const keys = Array.from(reverseClients.keys());
        if (!userId) return keys.map((key) => key.split(":")[1]);
        const prefix = `${userId}:`;
        return keys
            .filter((key) => key.startsWith(prefix))
            .map((key) => key.slice(prefix.length));
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
        getConnectedDevices,
        close
    };
};
