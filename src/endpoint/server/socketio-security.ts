import type { IncomingMessage } from "node:http";
import type { ServerOptions } from "socket.io";
import config from "../config.js";

type LoggerLike = {
    info?: (obj: any, msg?: string) => void;
    warn?: (obj: any, msg?: string) => void;
    error?: (obj: any, msg?: string) => void;
};

const parseAllowedOrigins = (): string[] => {
    const raw = (process.env.SOCKET_IO_ALLOWED_ORIGINS || "").trim();
    if (!raw) return [];
    return raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
};

const normalizePort = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const getDefaultAllowedOrigins = (): string[] => {
    const httpsPort = Number((config as any)?.listenPort ?? 8443);
    const httpPort = Number((config as any)?.httpPort ?? 8080);
    const hosts = ["localhost", "127.0.0.1", "u2re.space", "www.u2re.space"];
    const values = new Set<string>();
    for (const host of hosts) {
        values.add(`http://${host}:${httpPort}`);
        values.add(`https://${host}:${httpsPort}`);
    }
    return Array.from(values);
};

const matchesAllowedOrigin = (origin: string, allowed: string[]): boolean => {
    if (!allowed.length) return true;
    if (allowed.includes(origin)) return true;

    const allowPrivate192 = process.env.SOCKET_IO_ALLOW_PRIVATE_192 !== "false";
    if (!allowPrivate192) return false;

    try {
        const url = new URL(origin);
        const host = url.hostname;
        if (host.startsWith("192.168.")) return true;
    } catch {
        return false;
    }

    return false;
};

export const buildSocketIoOptions = (logger?: LoggerLike): Partial<ServerOptions> => {
    const allowedOrigins = parseAllowedOrigins();
    const defaults = getDefaultAllowedOrigins();
    const effectiveAllowedOrigins = allowedOrigins.length ? allowedOrigins : defaults;

    logger?.info?.(
        {
            allowedOrigins: effectiveAllowedOrigins,
            source: allowedOrigins.length ? "SOCKET_IO_ALLOWED_ORIGINS" : "default-local-origins",
            allowPrivate192: process.env.SOCKET_IO_ALLOW_PRIVATE_192 !== "false"
        },
        "[socket.io] CORS origin policy initialized"
    );

    return {
        transports: ["websocket", "polling"],
        cors: {
            methods: ["GET", "POST"],
            credentials: true,
            origin(origin, callback) {
                // Native/mobile clients often omit Origin. Allow them by default.
                if (!origin) {
                    callback(null, true);
                    return;
                }
                if (matchesAllowedOrigin(origin, effectiveAllowedOrigins)) {
                    callback(null, true);
                    return;
                }
                callback(new Error(`Origin is not allowed by policy: ${origin}`), false);
            }
        },
        allowRequest(req, callback) {
            const origin = String(req.headers.origin || "");
            if (!origin) {
                callback(null, true);
                return;
            }
            if (matchesAllowedOrigin(origin, effectiveAllowedOrigins)) {
                callback(null, true);
                return;
            }
            logger?.warn?.(
                {
                    origin,
                    host: req.headers.host,
                    url: req.url,
                    remoteAddress: req.socket?.remoteAddress
                },
                "[socket.io] Handshake rejected by allowRequest origin policy"
            );
            callback("Origin is not allowed", false);
        }
    };
};

export const describeHandshake = (req?: IncomingMessage): Record<string, unknown> => {
    const headers = req?.headers ?? {};
    const hostHeader = typeof headers.host === "string" ? headers.host : undefined;
    const originHeader = typeof headers.origin === "string" ? headers.origin : undefined;
    const forwardedProto = typeof headers["x-forwarded-proto"] === "string" ? headers["x-forwarded-proto"] : undefined;
    const encrypted = Boolean((req?.socket as any)?.encrypted);
    const protocol = forwardedProto || (encrypted ? "https" : "http");
    const host = hostHeader?.split(":")[0];
    const hostPort = hostHeader?.includes(":") ? normalizePort(hostHeader.split(":")[1]) : undefined;
    const localPort = (req?.socket as any)?.localPort;
    const port = hostPort ?? localPort;

    return {
        protocol,
        host,
        port,
        origin: originHeader || null,
        url: req?.url,
        remoteAddress: req?.socket?.remoteAddress,
        remotePort: req?.socket?.remotePort
    };
};
