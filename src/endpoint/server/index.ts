// =========================
// Main Server Entry Point
// =========================

import fastify from 'fastify';
import formbody from '@fastify/formbody';
import cors from '@fastify/cors';
import { HTTP_PORT } from './src/constants.ts';
import config from '../config.js';
import { loadHttpsCredentials, createHttpClient } from './src/https.ts';
import { setApp as setClipboardApp, setHttpClient, startClipboardPolling } from './src/clipboard.ts';
import { startMouseFlushInterval } from './src/mouse.ts';
import { setApp as setPythonApp } from './src/python.ts';
import { registerRoutes } from './src/routes.ts';
import { setupSocketIO } from './src/socket.ts';
import { createWsServer } from './src/websocket.ts';
import { registerOpsRoutes } from './src/ops.ts';
import { startUpstreamPeerClient } from './src/upstream-peer-client.ts';

let httpsApp: any = null;
let httpApp: any = null;
const HTTPS_PORT = (config as any).listenPort || 8443;
const HTTP_LISTEN_PORT = (config as any).httpPort || HTTP_PORT;

function registerPlugins(app: any) {
    app.register(cors, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    app.register(formbody);

    // Ensure we can receive raw `text/plain` clipboard payloads.
    // Without this, Fastify may not parse text/plain into request.body as a string.
    app.addContentTypeParser('text/plain', { parseAs: 'string' }, async (_req: any, body: any) => {
        return body;
    });

    // PNA preflights for public -> private network requests
    app.addHook('onSend', async (req: any, reply: any, payload: any) => {
        const allowPrivateNetwork = process.env.CORS_ALLOW_PRIVATE_NETWORK !== 'false';
        if (!allowPrivateNetwork) return payload;

        const pnaHeader = String(req?.headers?.['access-control-request-private-network'] || '').toLowerCase();
        if (pnaHeader === 'true') {
            reply.header('Access-Control-Allow-Private-Network', 'true');
            const existingVary = String(reply.getHeader('Vary') || '');
            const varyParts = existingVary
                .split(',')
                .map((part: string) => part.trim())
                .filter(Boolean);
            if (!varyParts.includes('Access-Control-Request-Private-Network')) {
                varyParts.push('Access-Control-Request-Private-Network');
            }
            if (varyParts.length > 0) {
                reply.header('Vary', varyParts.join(', '));
            }
        }
        return payload;
    });

    app.options('/lna-probe', async (request: any, reply: any) => {
        const origin = String(request?.headers?.origin || '');
        if (origin) reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type');
        reply.header('Access-Control-Max-Age', '600');
        if (String(request?.headers?.['access-control-request-private-network'] || '').toLowerCase() === 'true') {
            reply.header('Access-Control-Allow-Private-Network', 'true');
            reply.header('Vary', 'Origin, Access-Control-Request-Private-Network');
        } else if (origin) {
            reply.header('Vary', 'Origin');
        }
        return reply.code(204).send();
    });

    app.get('/lna-probe', async (request: any, reply: any) => {
        const origin = String(request?.headers?.origin || '');
        if (origin) {
            reply.header('Access-Control-Allow-Origin', origin);
            reply.header('Vary', 'Origin');
        }
        reply.header('Cache-Control', 'no-store');
        return reply.code(204).send();
    });
}

const makeUnifiedWsHub = (hubs: Array<ReturnType<typeof createWsServer>>) => {
    return {
        broadcast: (userId: string, payload: any) => {
            hubs.forEach((hub) => hub.broadcast(userId, payload));
        },
        multicast: (userId: string, payload: any, namespace?: string, excludeId?: string) => {
            hubs.forEach((hub) => hub.multicast(userId, payload, namespace, excludeId));
        },
        notify: (userId: string, type: string, data?: any) => {
            hubs.forEach((hub) => hub.notify(userId, type, data));
        },
        sendTo: (clientId: string, payload: any) => {
            hubs.forEach((hub) => hub.sendTo(clientId, payload));
        },
        sendToDevice: (userId: string, deviceId: string, payload: any): boolean => {
            for (const hub of hubs) {
                const ok = hub.sendToDevice(userId, deviceId, payload);
                if (ok) return true;
            }
            return false;
        },
        getConnectedDevices: (userId?: string) => {
            const set = new Set<string>();
            for (const hub of hubs) {
                hub.getConnectedDevices(userId).forEach((id) => set.add(id));
            }
            return Array.from(set);
        },
        close: async () => {
            await Promise.all(hubs.map((hub) => hub.close()));
        }
    };
};

const buildNetworkContext = (upstreamClient: ReturnType<typeof startUpstreamPeerClient> | null) => {
    if (!upstreamClient) return undefined;
    return {
        getUpstreamStatus: () => upstreamClient.getStatus(),
        sendToUpstream: (payload: any) => upstreamClient.send(payload),
        getNodeId: () => String((config as any)?.upstream?.userId || "").trim() || null
    };
};

async function startServers() {
    const httpsOptions = await loadHttpsCredentials();
    httpsApp = fastify({ logger: true, https: httpsOptions });
    httpApp = fastify({ logger: true });
    const httpClient = createHttpClient(httpsOptions);

    // Initialize module dependencies
    // Note: some modules keep a singleton `app` for logging; we point them at HTTPS app.
    setClipboardApp(httpsApp);
    setHttpClient(httpClient);
    setPythonApp(httpsApp);

    registerPlugins(httpsApp);
    registerPlugins(httpApp);

    registerRoutes(httpsApp);
    registerRoutes(httpApp);
    // Initialize Socket.IO servers (both HTTP and HTTPS) before listen.
    // This ensures `/socket.io` handlers are already attached when ports open.
    setupSocketIO(httpsApp.server, httpsApp.log);
    setupSocketIO(httpApp.server, httpApp.log);
    const httpsWsHub = createWsServer(httpsApp);
    const httpWsHub = createWsServer(httpApp);
    const unifiedWsHub = makeUnifiedWsHub([httpsWsHub, httpWsHub]);
    const upstreamClient = startUpstreamPeerClient(config as any, {
        onMessage: (message: any) => {
            if (!message || typeof message !== "object") return;
            const msg = message as Record<string, unknown>;
            const target = msg.targetId || msg.deviceId || msg.target || msg.to || msg.target_id;
            const userId =
                typeof msg.userId === "string" && msg.userId.trim()
                    ? (msg.userId as string).trim()
                    : ((config as any)?.upstream?.userId || "");
            if (!userId) return;

            const payload = msg.payload ?? msg.data ?? msg.body ?? msg;
            const namespace = typeof msg.namespace === "string" && msg.namespace
                ? msg.namespace
                : typeof msg.ns === "string"
                    ? msg.ns
                    : undefined;
            const type = String(msg.type || msg.action || "dispatch");
            const routed = {
                type,
                data: payload,
                namespace,
                from: typeof msg.from === "string" ? msg.from : String((config as any)?.upstream?.userId || ""),
                ts: Number.isFinite(Number(msg.ts)) ? Number(msg.ts) : Date.now()
            };

            if (typeof target === "string" && target.trim()) {
                unifiedWsHub.sendToDevice(userId, target.trim(), routed);
                return;
            }
            unifiedWsHub.multicast(userId, routed, namespace);
        }
    });
    const networkContext = buildNetworkContext(upstreamClient);
    if (upstreamClient?.isRunning?.()) {
        httpsApp.log.info(`Upstream peer bridge started`);
    }
    if (upstreamClient) {
        const stopUpstream = () => upstreamClient.stop();
        httpApp.addHook("onClose", stopUpstream);
        httpsApp.addHook("onClose", stopUpstream);
    }
    await registerOpsRoutes(httpsApp, unifiedWsHub, networkContext);
    await registerOpsRoutes(httpApp, unifiedWsHub, networkContext);

    // Start HTTP/HTTPS in parallel to reduce startup latency.
    await Promise.all([
        httpsApp.listen({ port: HTTPS_PORT, host: '0.0.0.0' })
            .then(() => {
                httpsApp.log.info(`Listening on https://0.0.0.0:${HTTPS_PORT}`);
                httpsApp.log.info(`Socket.IO endpoint: https://0.0.0.0:${HTTPS_PORT}/socket.io`);
                httpsApp.log.info(`WebSocket endpoint: wss://0.0.0.0:${HTTPS_PORT}/ws`);
            }),
        httpApp.listen({ port: HTTP_LISTEN_PORT, host: '0.0.0.0' })
            .then(() => {
                httpApp.log.info(`Listening on http://0.0.0.0:${HTTP_LISTEN_PORT}`);
                httpApp.log.info(`Socket.IO endpoint: http://0.0.0.0:${HTTP_LISTEN_PORT}/socket.io`);
                httpApp.log.info(`WebSocket endpoint: ws://0.0.0.0:${HTTP_LISTEN_PORT}/ws`);
            }),
    ]);

    // Start background tasks
    startMouseFlushInterval();
    startClipboardPolling();
}

startServers().catch((err: Error) => {
    console.error(err);
    process.exit(1);
});
