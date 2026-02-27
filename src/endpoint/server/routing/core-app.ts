import { readFile } from "node:fs/promises";
import path from "node:path";

import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import formbody from "@fastify/formbody";

import { ADMIN_DIR } from "../lib/paths.ts";
import { registerAuthRoutes } from "./auth.ts";
import { registerStorageRoutes } from "./storage.ts";
import { registerGptRoutes } from "../gpt/index.ts";
import { loadEndpointDotenv } from "../gpt/provider.ts";
import { registerCoreSettingsEndpoints, registerCoreSettingsRoutes } from "../config/userSettings.ts";

const PHOSPHOR_STYLES = ["thin", "light", "regular", "bold", "fill", "duotone"] as const;
type PhosphorStyle = (typeof PHOSPHOR_STYLES)[number];

const ADMIN_FALLBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2a2.6 2.6 0 0 1 2.6 2.6V7.4l4.1 2.1c.6.3 1 1 1 1.7v4.6c0 .7-.4 1.4-1 1.7l-4.1 2.1v1.6c0 1.4-1.2 2.6-2.6 2.6H6.6C5.2 21 4 19.8 4 18.4V13.2c0-.7.4-1.4 1-1.7l4.2-2.1V4.6A2.6 2.6 0 0 1 11.8 2H12Zm-1 12.1v4.8c0 .5.4.9.9.9h6.1c.5 0 .9-.4.9-.9V13l-.2-.1l-3.6-1.8V11h-4v3.1Zm-1-8.5V19c0 .4-.3.7-.7.7h-.6c-.4 0-.7-.3-.7-.7v-1.6L4.4 14.7A.6.6 0 0 1 4 14.1V8.9a.6.6 0 0 1 .4-.6L10 5.3V8h2V3.6c0-.4-.3-.8-.8-.8H11.7c-.4 0-.7.3-.7.7Z"/>
</svg>`;

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

const sendAdminIcon = (reply: FastifyReply) => {
    return reply
        .type("image/svg+xml; charset=utf-8")
        .header("Cache-Control", "public, max-age=604800")
        .send(ADMIN_FALLBACK_ICON);
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

export const registerCoreApp = async (app: FastifyInstance): Promise<void> => {
    loadEndpointDotenv();
    await registerDebugRequestLogging(app);
    await app.register(formbody);
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

    app.addContentTypeParser("text/plain", { parseAs: "string" }, async (_req: any, body: any) => {
        return body;
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

    app.get("/admin/icon.svg", async (_req, reply) => {
        return sendAdminIcon(reply);
    });

    app.get("/icon.svg", async (_req, reply) => {
        return sendAdminIcon(reply);
    });

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
    await registerGptRoutes(app);
};

export const registerApiFallback = (app: FastifyInstance) => {
    app.all("/api/*", async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.code(404).send({
            ok: false,
            error: "Unknown API endpoint",
            path: (request as any).url || null
        });
    });
};
