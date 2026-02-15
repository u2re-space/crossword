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
import { createSocketIoBridge } from "./socketio-bridge.ts";
import { registerAuthRoutes } from "./auth.ts";
import { registerCoreSettingsEndpoints, registerCoreSettingsRoutes } from "./userSettings.ts";
import { registerStorageRoutes } from "./storage.ts";
import { registerAiRoutes } from "./ai.ts";
import { registerOpsRoutes } from "./ops.ts";

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
    await app.register(cors, { origin: true });
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

    await registerCoreSettingsEndpoints(app);
    await registerAuthRoutes(app);
    await registerCoreSettingsRoutes(app);

    await registerStorageRoutes(app);
    await registerAiRoutes(app);
};

export const buildCoreServer = async (opts: { logger?: boolean; httpsOptions?: any } = {}): Promise<FastifyInstance> => {
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();

    const app = Fastify({
        logger: opts.logger ?? true,
        ...(httpsOptions ? { https: httpsOptions } : {})
    }) as unknown as FastifyInstance;

    await registerCoreApp(app);

    const wsHub = createWsServer(app);
    await registerOpsRoutes(app, wsHub);

    // Socket.IO bridge for legacy/native clients (merged from server-old.ts concepts)
    createSocketIoBridge(app);

    return app;
};

export const buildCoreServers = async (
    opts: { logger?: boolean; httpsOptions?: any } = {}
): Promise<{ http: FastifyInstance; https?: FastifyInstance }> => {
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();

    const http = Fastify({ logger: opts.logger ?? true }) as unknown as FastifyInstance;
    await registerCoreApp(http);
    const httpWsHub = createWsServer(http);
    await registerOpsRoutes(http, httpWsHub);
    createSocketIoBridge(http);

    if (!httpsOptions) return { http };

    const https = Fastify({
        logger: opts.logger ?? true,
        https: httpsOptions
    }) as unknown as FastifyInstance;
    await registerCoreApp(https);
    const httpsWsHub = createWsServer(https);
    await registerOpsRoutes(https, httpsWsHub);
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
