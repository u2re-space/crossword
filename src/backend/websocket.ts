import { WebSocketServer, type WebSocket } from "ws";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

import { type AppSettings } from "../core/config/SettingsTypes.ts";
import { loadUserSettings } from "./lib/users.ts";

type ClientInfo = {
    userId: string;
    userKey: string;
    ws: WebSocket;
    id: string;
};

export type WsHub = {
    broadcast: (userId: string, payload: any) => void;
    notify: (userId: string, type: string, data?: any) => void;
    sendTo: (clientId: string, payload: any) => void;
    close: () => Promise<void>;
};

export const createWsServer = (app: FastifyInstance): WsHub => {
    const server = app.server;
    const wss = new WebSocketServer({ server, path: "/ws" });
    const clients = new Map<WebSocket, ClientInfo>();

    const verify = async (userId?: string, userKey?: string) => {
        if (!userId || !userKey) return null;
        try {
            const settings = await loadUserSettings(userId, userKey);
            return settings as AppSettings;
        } catch {
            return null;
        }
    };

    wss.on("connection", async (ws, req) => {
        const params = new URL(req.url || "", "http://localhost").searchParams;
        const userId = params.get("userId") || undefined;
        const userKey = params.get("userKey") || undefined;
        const settings = await verify(userId, userKey);
        if (!settings || !userId || !userKey) {
            ws.close(4001, "Invalid credentials");
            return;
        }
        const info: ClientInfo = { userId, userKey, ws, id: randomUUID() };
        clients.set(ws, info);

        ws.on("message", async (data) => {
            let parsed: any;
            try { parsed = JSON.parse(data.toString()); } catch { return; }
            const { type, payload, targetId } = parsed || {};
            // Simple forwarding: if targetId matches a client, relay
            if (targetId) {
                const target = [...clients.values()].find((c) => c.id === targetId || c.userId === targetId);
                target?.ws?.send?.(JSON.stringify({ type, payload, from: info.id }));
            } else {
                // broadcast to same userId
                broadcast(info.userId, { type, payload, from: info.id });
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
        });

        ws.send(JSON.stringify({ type: "welcome", id: info.id, userId }));
    });

    const broadcast = (userId: string, payload: any) => {
        [...clients.values()]
            .filter((c) => c.userId === userId)
            .forEach((c) => c.ws.send(JSON.stringify(payload)));
    };

    const notify = (userId: string, type: string, data?: any) => {
        broadcast(userId, { type, data });
    };

    const sendTo = (clientId: string, payload: any) => {
        const target = [...clients.values()].find((c) => c.id === clientId);
        target?.ws?.send?.(JSON.stringify(payload));
    };

    const close = async () => {
        clients.forEach((c) => c.ws.close());
        await new Promise<void>((resolve) => { wss.close(() => resolve()); });
    };

    return { broadcast, notify, sendTo, close };
};
