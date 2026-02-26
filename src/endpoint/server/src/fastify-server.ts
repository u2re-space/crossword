import { readFile } from "node:fs/promises";
import path from "node:path";
import net from "node:net";

import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";

import { ADMIN_DIR } from "../lib/paths.ts";
import { isMainModule, moduleDirname, runtimeArgs } from "../lib/runtime.ts";
import { createWsServer } from "./websocket.ts";
import type { WsHub } from "./websocket.ts";
import { createSocketIoBridge } from "./socketio-bridge.ts";
import { registerAuthRoutes } from "./auth.ts";
import { registerCoreSettingsEndpoints, registerCoreSettingsRoutes } from "./userSettings.ts";
import { registerStorageRoutes } from "./storage.ts";
import { registerAiRoutes } from "./ai.ts";
import { registerOpsRoutes } from "./ops.ts";
import { startUpstreamPeerClient } from "./upstream-peer-client.ts";
import config from "../../config.js";

const PHOSPHOR_STYLES = ["thin", "light", "regular", "bold", "fill", "duotone"] as const;
type PhosphorStyle = (typeof PHOSPHOR_STYLES)[number];

const isValidPhosphorStyle = (value: string): value is PhosphorStyle => {
    return (PHOSPHOR_STYLES as readonly string[]).includes(value);
};

const isValidPhosphorIconName = (value: string): boolean => /^[a-z0-9-]+$/i.test(value);

const withStyleSuffix = (style: PhosphorStyle, iconName: string): string => {
    if (style === "duotone") return `${iconName}-duotone`;
    if (style === "regular") return iconName;
    return `${iconName}-${style}`;
};

const phosphorCdnUrl = (style: PhosphorStyle, iconName: string): string => {
    const fileName = withStyleSuffix(style, iconName);
    return `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/${style}/${fileName}.svg`;
};

const proxyPhosphorIcon = async (reply: FastifyReply, style: string, iconRaw: string) => {
    const iconName = iconRaw.replace(/\.svg$/i, "").trim().toLowerCase();
    const normalizedStyle = style.trim().toLowerCase();

    if (!isValidPhosphorStyle(normalizedStyle)) {
        return reply.code(400).send({ ok: false, error: `Invalid phosphor style: ${style}` });
    }
    if (!isValidPhosphorIconName(iconName)) {
        return reply.code(400).send({ ok: false, error: `Invalid icon name: ${iconRaw}` });
    }

    const upstreamUrl = phosphorCdnUrl(normalizedStyle, iconName);
    try {
        const res = await fetch(upstreamUrl, {
            method: "GET",
            headers: { accept: "image/svg+xml,text/plain,*/*" }
        });

        if (!res.ok) {
            return reply.code(res.status).send({
                ok: false,
                error: `Icon not found in upstream source`,
                style: normalizedStyle,
                icon: iconName
            });
        }

        const svg = await res.text();
        reply.header("Content-Type", "image/svg+xml; charset=utf-8");
        reply.header("Cache-Control", "public, max-age=604800");
        return reply.send(svg);
    } catch (error) {
        return reply.code(502).send({
            ok: false,
            error: "Failed to fetch upstream icon",
            details: String(error)
        });
    }
};

const defaultHttpsPaths = () => ({
    key: path.resolve(moduleDirname(import.meta), "./https/local/multi.key"),
    cert: path.resolve(moduleDirname(import.meta), "./https/local/multi.crt")
});

const loadHttpsOptions = async () => {
    if (process.env.HTTPS_ENABLED === "false") return undefined;
    const { key: keyPath, cert: certPath } = defaultHttpsPaths();
    const envKey = process.env.HTTPS_KEY_FILE || keyPath;
    const envCert = process.env.HTTPS_CERT_FILE || certPath;
    try {
        const [key, cert] = await Promise.all([
            readFile(envKey),
            readFile(envCert)
        ]);
        const requestClientCerts = process.env.HTTPS_REQUEST_CLIENT_CERTS === "true";
        const allowUntrustedClientCerts = process.env.HTTPS_ALLOW_UNTRUSTED_CLIENT_CERTS !== "false";
        return {
            key,
            cert,
            allowHTTP1: true,
            ...(requestClientCerts
                ? (allowUntrustedClientCerts ? { requestCert: true, rejectUnauthorized: false } : { requestCert: true })
                : {})
        };
    } catch {
        return undefined;
    }
};

const parseCli = (args: string[]) => {
    const out: { port?: number; host?: string; httpPort?: number; httpsPort?: number } = {};
    const eat = (i: number) => args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "--port") {
            const v = eat(i);
            if (v) out.port = Number(v);
        } else if (a.startsWith("--port=")) {
            out.port = Number(a.split("=", 2)[1]);
        } else if (a === "--http-port") {
            const v = eat(i);
            if (v) out.httpPort = Number(v);
        } else if (a.startsWith("--http-port=")) {
            out.httpPort = Number(a.split("=", 2)[1]);
        } else if (a === "--https-port") {
            const v = eat(i);
            if (v) out.httpsPort = Number(v);
        } else if (a.startsWith("--https-port=")) {
            out.httpsPort = Number(a.split("=", 2)[1]);
        } else if (a === "--host" || a === "--address") {
            const v = eat(i);
            if (v) out.host = v;
        } else if (a.startsWith("--host=") || a.startsWith("--address=")) {
            out.host = a.split("=", 2)[1];
        }
    }
    return out;
};

const isPortAvailable = async (host: string, port: number): Promise<boolean> => {
    await new Promise<void>((resolve) => setImmediate(resolve));
    return await new Promise<boolean>((resolve) => {
        const srv = net.createServer();
        srv.unref();
        srv.once("error", () => resolve(false));
        srv.listen({ host, port }, () => {
            srv.close(() => resolve(true));
        });
    });
};

const pickHttpPort = async (host: string): Promise<number> => {
    const preferred = 8080;
    const fallback = 8081;
    return (await isPortAvailable(host, preferred)) ? preferred : fallback;
};

const debugRequestLoggingEnabled = (): boolean => process.env.REQUEST_DEBUG_LOGGING !== "false";

const safeBodyPreview = (body: unknown, maxChars: number): string | undefined => {
    if (typeof body === "undefined") return undefined;
    if (body === null) return "null";
    if (typeof body === "string") return body.length > maxChars ? `${body.slice(0, maxChars)}…(truncated)` : body;
    if (Buffer.isBuffer(body)) {
        const s = body.toString("utf8", 0, Math.min(body.length, maxChars));
        return body.length > maxChars ? `${s}…(truncated)` : s;
    }
    if (body instanceof ArrayBuffer) {
        const buf = Buffer.from(body);
        const s = buf.toString("utf8", 0, Math.min(buf.length, maxChars));
        return buf.length > maxChars ? `${s}…(truncated)` : s;
    }
    if (ArrayBuffer.isView(body)) {
        const buf = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        const s = buf.toString("utf8", 0, Math.min(buf.length, maxChars));
        return buf.length > maxChars ? `${s}…(truncated)` : s;
    }
    try {
        const s = JSON.stringify(body);
        return s.length > maxChars ? `${s.slice(0, maxChars)}…(truncated)` : s;
    } catch {
        const s = String(body);
        return s.length > maxChars ? `${s.slice(0, maxChars)}…(truncated)` : s;
    }
};

const registerDebugRequestLogging = async (app: FastifyInstance): Promise<void> => {
    if (!debugRequestLoggingEnabled()) return;
    const maxChars = Math.max(256, Math.min(1024 * 1024, Number(process.env.REQUEST_DEBUG_LOG_BODY_MAX_CHARS || 64 * 1024)));

    // Log after body parsing so we can safely include `req.body` without consuming the stream.
    app.addHook("preHandler", async (req: FastifyRequest, _reply) => {
        const socket: any = (req as any).socket;
        const proto = socket?.encrypted ? "https" : "http";
        const localPort = socket?.localPort;
        const remoteAddr = (req as any).ip || socket?.remoteAddress;
        const bodyPreview = safeBodyPreview((req as any).body, maxChars);

        const msg =
            bodyPreview !== undefined
                ? `[req] ${proto}:${localPort} ${req.method} ${(req as any).url} from=${remoteAddr} body=${bodyPreview}`
                : `[req] ${proto}:${localPort} ${req.method} ${(req as any).url} from=${remoteAddr}`;

        (app.log?.info ? app.log.info(msg) : console.log(msg));
    });
};

const registerCoreApp = async (app: FastifyInstance): Promise<void> => {
    await registerDebugRequestLogging(app);
    await app.register(cors, {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });
    app.addHook("onSend", async (req, reply, payload) => {
        const allowPrivateNetwork = process.env.CORS_ALLOW_PRIVATE_NETWORK !== "false";
        if (!allowPrivateNetwork) return payload;

        const pnaHeader = String(req.headers["access-control-request-private-network"] || "").toLowerCase();
        if (pnaHeader === "true") {
            reply.header("Access-Control-Allow-Private-Network", "true");
            const existingVary = String(reply.getHeader("Vary") || "");
            const varyParts = existingVary
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean);
            if (!varyParts.includes("Access-Control-Request-Private-Network")) {
                varyParts.push("Access-Control-Request-Private-Network");
            }
            if (varyParts.length > 0) {
                reply.header("Vary", varyParts.join(", "));
            }
        }
        return payload;
    });
    await app.register(compress, { global: true });
    await app.register(fastifyStatic, {
        list: true,
        root: ADMIN_DIR,
        prefix: "/admin/",
        decorateReply: true
    });

    app.get("/admin", async (_req, reply) => {
        reply.header("Content-Type", "text/html");
        reply.header("Cache-Control", "public, max-age=3600");
        reply.status(200);
        return reply?.send?.(await readFile(path.resolve(ADMIN_DIR, "index.html"), { encoding: "utf-8" })) as unknown as string;
    }) as unknown as FastifyReply;

    app.get("/assets/icons/phosphor", async () => ({
        ok: true,
        source: "@phosphor-icons/core@2",
        styles: PHOSPHOR_STYLES
    }));

    app.get("/assets/icons/phosphor/:style/:icon", async (request: FastifyRequest<{ Params: { style: string; icon: string } }>, reply) => {
        return proxyPhosphorIcon(reply, request.params.style, request.params.icon);
    });

    app.get("/assets/icons/duotone", async () => ({
        ok: true,
        aliasOf: "/assets/icons/phosphor/duotone/:icon",
        styles: ["duotone"]
    }));

    app.get("/assets/icons/duotone/:icon", async (request: FastifyRequest<{ Params: { icon: string } }>, reply) => {
        return proxyPhosphorIcon(reply, "duotone", request.params.icon);
    });

    app.get("/assets/icons", async () => ({
        ok: true,
        source: "@phosphor-icons/core@2",
        defaultStyle: "duotone",
        styles: PHOSPHOR_STYLES,
        aliases: {
            duotone: "/assets/icons/duotone/:icon",
            style: "/assets/icons/:style/:icon",
            default: "/assets/icons/:icon"
        }
    }));

    app.get("/assets/icons/:style/:icon", async (request: FastifyRequest<{ Params: { style: string; icon: string } }>, reply) => {
        return proxyPhosphorIcon(reply, request.params.style, request.params.icon);
    });

    app.get("/assets/icons/:icon", async (request: FastifyRequest<{ Params: { icon: string } }>, reply) => {
        return proxyPhosphorIcon(reply, "duotone", request.params.icon);
    });

    app.get("/api", async () => ({
        ok: true,
        endpoints: [
            "/api/processing",
            "/api/request",
            "/api/broadcast",
            "/api/action",
            "/api/storage",
            "/api/ws"
        ]
    }));

    // Explicit probe endpoint for Local Network Access / Private Network Access checks.
    // Browser may use this from secure public origins before local-network control traffic.
    app.options("/lna-probe", async (req, reply) => {
        const origin = String((req.headers as any)?.origin || "");
        if (origin) reply.header("Access-Control-Allow-Origin", origin);
        reply.header("Access-Control-Allow-Methods", "GET, OPTIONS");
        reply.header("Access-Control-Allow-Headers", "Content-Type");
        reply.header("Access-Control-Max-Age", "600");
        if (String((req.headers as any)?.["access-control-request-private-network"] || "").toLowerCase() === "true") {
            reply.header("Access-Control-Allow-Private-Network", "true");
            reply.header("Vary", "Origin, Access-Control-Request-Private-Network");
        } else if (origin) {
            reply.header("Vary", "Origin");
        }
        return reply.code(204).send();
    });

    app.get("/lna-probe", async (req, reply) => {
        const origin = String((req.headers as any)?.origin || "");
        if (origin) {
            reply.header("Access-Control-Allow-Origin", origin);
            reply.header("Vary", "Origin");
        }
        reply.header("Cache-Control", "no-store");
        return reply.code(204).send();
    });

    await registerCoreSettingsEndpoints(app);
    await registerAuthRoutes(app);
    await registerCoreSettingsRoutes(app);

    await registerStorageRoutes(app);
    await registerAiRoutes(app);
};

const registerApiFallback = (app: FastifyInstance) => {
    app.all("/api/*", async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.code(404).send({
            ok: false,
            error: "Unknown API endpoint",
            path: (request as any).url || null
        });
    });
};

const makeUnifiedWsHub = (hubs: WsHub[]): WsHub => {
    return {
        broadcast: (userId, payload) => {
            hubs.forEach((hub) => hub.broadcast(userId, payload));
        },
        multicast: (userId, payload, namespace, excludeId) => {
            hubs.forEach((hub) => hub.multicast(userId, payload, namespace, excludeId));
        },
        notify: (userId, type, data) => {
            hubs.forEach((hub) => hub.notify(userId, type, data));
        },
        sendTo: (clientId, payload) => {
            hubs.forEach((hub) => hub.sendTo(clientId, payload));
        },
        sendToDevice: (userId, deviceId, payload) => {
            for (const hub of hubs) {
                const ok = hub.sendToDevice(userId, deviceId, payload);
                if (ok) return true;
            }
            return false;
        },
        getConnectedDevices: (userId) => {
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

const buildUpstreamRouter = (app: FastifyInstance, hub: WsHub, fallbackUserId: string) => {
    const defaultUserId = fallbackUserId || "";
    return (message: any) => {
        if (!message || typeof message !== "object") return;
        const msg = message as Record<string, unknown>;
        const target = msg.targetId || msg.deviceId || msg.target || msg.to || msg.target_id;
        const userId =
            typeof msg.userId === "string" && msg.userId.trim()
                ? (msg.userId as string).trim()
                : defaultUserId;
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
            from: typeof msg.from === "string" ? msg.from : defaultUserId,
            ts: Number.isFinite(Number(msg.ts)) ? Number(msg.ts) : Date.now()
        };

        if (typeof target === "string" && target.trim()) {
            const delivered = hub.sendToDevice(userId, target.trim(), routed);
            app.log?.debug?.({
                delivered,
                target: target.trim(),
                userId
            }, "[upstream] routed command to device");
            return;
        }

        hub.multicast(userId, routed, namespace);
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

export const buildCoreServer = async (opts: { logger?: boolean; httpsOptions?: any } = {}): Promise<FastifyInstance> => {
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();

    const app = Fastify({
        logger: opts.logger ?? true,
        ...(httpsOptions ? { https: httpsOptions } : {})
    }) as unknown as FastifyInstance;

    await registerCoreApp(app);
    const wsHub = createWsServer(app);
    const upstreamClient = startUpstreamPeerClient(config as any, {
        onMessage: buildUpstreamRouter(app, wsHub, (config as any)?.upstream?.userId || "")
    });
    if (upstreamClient) {
        app.addHook("onClose", async () => {
            upstreamClient.stop();
        });
        app.log?.info?.("Upstream peer bridge started");
    }

    await registerOpsRoutes(app, wsHub, buildNetworkContext(upstreamClient));
    registerApiFallback(app);

    // Socket.IO bridge for legacy/native clients (merged from server-old.ts concepts)
    createSocketIoBridge(app);

    return app;
};

export const buildCoreServers = async (
    opts: { logger?: boolean; httpsOptions?: any } = {}
): Promise<{ http: FastifyInstance; https?: FastifyInstance }> => {
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();
    const http = Fastify({ logger: opts.logger ?? true }) as unknown as FastifyInstance;
    const https = Fastify({
        logger: opts.logger ?? true,
        https: httpsOptions
    }) as unknown as FastifyInstance;
    const fallbackUserId = String((config as any)?.upstream?.userId || "").trim();
    const httpWsHub = createWsServer(http);
    const httpWsHubs: WsHub[] = [httpWsHub];
    const unifiedHub = makeUnifiedWsHub(httpWsHubs);
    const upstreamClient = startUpstreamPeerClient(config as any, {
        onMessage: buildUpstreamRouter(http, unifiedHub, fallbackUserId)
    });
    const networkContext = buildNetworkContext(upstreamClient);

    await registerCoreApp(http);
    if (upstreamClient) {
        http.addHook("onClose", async () => {
            upstreamClient.stop();
        });
    }
    await registerOpsRoutes(http, unifiedHub, networkContext);
    registerApiFallback(http);
    createSocketIoBridge(http);

    if (!httpsOptions) return { http };
    const httpsWsHub = createWsServer(https);
    httpWsHubs.push(httpsWsHub);
    await registerCoreApp(https);
    if (upstreamClient) {
        https.addHook("onClose", async () => {
            upstreamClient.stop();
        });
    }
    await registerOpsRoutes(https, unifiedHub, networkContext);
    registerApiFallback(https);
    createSocketIoBridge(https);

    return { http, https };
};

if (isMainModule(import.meta)) {
    const args = parseCli(runtimeArgs());
    loadHttpsOptions()
        .then((httpsOptions) => {
            const httpsEnabled = Boolean(httpsOptions) && process.env.HTTPS_ENABLED !== "false";
            const httpEnabled = process.env.HTTP_ENABLED !== "false";

            const host = args.host ?? process.env.HOST ?? "0.0.0.0";

            const defaultHttpsPort = 8443;

            // Backwards-compatible behavior:
            // - if only --port/PORT is provided:
            //   - when HTTPS is available -> treat as HTTPS port
            //   - when HTTPS is unavailable -> treat as HTTP port
            const envPort = typeof process.env.PORT === "string" ? Number(process.env.PORT) : undefined;
            const legacyPort = Number(args.port ?? envPort ?? NaN);
            const hasLegacyPort = Number.isFinite(legacyPort);

            const httpPortRaw =
                args.httpPort ??
                process.env.HTTP_PORT ??
                process.env.PORT_HTTP ??
                (!httpsEnabled && hasLegacyPort ? legacyPort : undefined);

            const httpsPort = Number(
                args.httpsPort ??
                    process.env.HTTPS_PORT ??
                    process.env.PORT_HTTPS ??
                    (httpsEnabled && hasLegacyPort ? legacyPort : defaultHttpsPort)
            );

            return buildCoreServers({ logger: true, httpsOptions })
                .then(async ({ http, https }) => {
                    if (httpEnabled) {
                        const httpPort = typeof httpPortRaw === "undefined" ? await pickHttpPort(host) : Number(httpPortRaw);
                        await http.listen({ port: httpPort, host });
                        console.log(`[core-backend] listening on http://${host}:${httpPort}`);
                    }
                    if (httpsEnabled && https) {
                        await https.listen({ port: httpsPort, host });
                        console.log(`[core-backend] listening on https://${host}:${httpsPort}`);
                    }
                });
        })
        .catch((err) => {
            console.error("[core-backend] failed to start", err);
            process.exit(1);
        });
}
