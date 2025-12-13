import { readFile } from "node:fs/promises";
import path from "node:path";

import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";

import { ADMIN_DIR } from "./lib/paths.ts";
import { isMainModule, moduleDirname, runtimeArgs } from "./lib/runtime.ts";
import { createWsServer } from "./websocket.ts";
import { createSocketIoBridge } from "./socketio-bridge.ts";
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerCoreSettingsEndpoints, registerCoreSettingsRoutes } from "./routes/userSettings.ts";
import { registerStorageRoutes } from "./routes/storage.ts";
import { registerAiRoutes } from "./routes/ai.ts";
import { registerOpsRoutes } from "./routes/ops.ts";

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
        return { key, cert, allowHTTP1: true };
    } catch {
        return undefined;
    }
};

const parseCli = (args: string[]) => {
    const out: { port?: number; host?: string } = {};
    const eat = (i: number) => args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "--port") {
            const v = eat(i);
            if (v) out.port = Number(v);
        } else if (a.startsWith("--port=")) {
            out.port = Number(a.split("=", 2)[1]);
        } else if (a === "--host" || a === "--address") {
            const v = eat(i);
            if (v) out.host = v;
        } else if (a.startsWith("--host=") || a.startsWith("--address=")) {
            out.host = a.split("=", 2)[1];
        }
    }
    return out;
};

export const buildCoreServer = async (opts: { logger?: boolean; httpsOptions?: any } = {}): Promise<FastifyInstance> => {
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();

    const app = Fastify({
        logger: opts.logger ?? true,
        ...(httpsOptions ? { https: httpsOptions } : {})
    }) as unknown as FastifyInstance;

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

    const wsHub = createWsServer(app);
    await registerOpsRoutes(app, wsHub);

    // Socket.IO bridge for legacy/native clients (merged from server-old.ts concepts)
    createSocketIoBridge(app);

    return app;
};

if (isMainModule(import.meta)) {
    const args = parseCli(runtimeArgs());
    loadHttpsOptions()
        .then((httpsOptions) => {
            const httpsEnabled = Boolean(httpsOptions);
            // Default ports:
            // - 8443 for HTTPS (admin/core HTTP API)
            // - 8081 for HTTP (legacy Automata socket.io defaults)
            const defaultPort = httpsEnabled ? 8443 : 8081;
            const port = Number(args.port ?? process.env.PORT ?? defaultPort);
            const host = args.host ?? process.env.HOST ?? "0.0.0.0";
            return buildCoreServer({ logger: true, httpsOptions })
                .then((app) => app.listen({ port, host }))
                .then(() => {
                    const proto = httpsEnabled ? "https" : "http";
                    console.log(`[core-backend] listening on ${proto}://${host}:${port}`);
                });
        })
        .catch((err) => {
            console.error("[core-backend] failed to start", err);
            process.exit(1);
        });
}
