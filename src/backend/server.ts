import { readFile } from "node:fs/promises";
import path from "node:path";

import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";

import { ADMIN_DIR } from "./lib/paths.ts";
import { createWsServer } from "./websocket.ts";
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerCoreSettingsEndpoints, registerCoreSettingsRoutes } from "./routes/userSettings.ts";
import { registerStorageRoutes } from "./routes/storage.ts";
import { registerAiRoutes } from "./routes/ai.ts";
import { registerOpsRoutes } from "./routes/ops.ts";

const defaultHttpsPaths = () => ({
    key: path.resolve(import.meta.dirname, "./https/local/multi.key"),
    cert: path.resolve(import.meta.dirname, "./https/local/multi.crt")
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

export const buildCoreServer = async (opts: { logger?: boolean } = {}): Promise<FastifyInstance> => {
    const httpsOptions = await loadHttpsOptions();

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

    return app;
};

if (import.meta.main) {
    const httpsEnabled = process.env.HTTPS_ENABLED !== "false";
    const port = Number(process.env.PORT || (httpsEnabled ? 8443 : 6065));
    const host = process.env.HOST || "0.0.0.0";

    buildCoreServer({ logger: true })
        .then((app) => app.listen({ port, host }))
        .then(() => {
            const proto = httpsEnabled ? "https" : "http";
            console.log(`[core-backend] listening on ${proto}://${host}:${port}`);
        })
        .catch((err) => {
            console.error("[core-backend] failed to start", err);
            process.exit(1);
        });
}
