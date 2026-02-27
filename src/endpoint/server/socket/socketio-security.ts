import type { IncomingMessage } from "node:http";
import type { ServerOptions } from "socket.io";
import config from "../config/config.ts";

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

const getAirPadTokens = () =>
    (process.env.AIRPAD_AUTH_TOKENS || process.env.AIRPAD_TOKENS || "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

const extractTokenFromQuery = (rawUrl: string | undefined): string => {
    if (!rawUrl) return "";
    if (!rawUrl.includes("?")) return "";
    const questionIndex = rawUrl.indexOf("?");
    const query = rawUrl.slice(questionIndex + 1);
    try {
        const params = new URLSearchParams(query);
        return (
            params.get("token")?.trim() ||
            params.get("airpadToken")?.trim() ||
            ""
        );
    } catch {
        return "";
    }
};

const isAuthorizedByQueryToken = (rawUrl: string | undefined): boolean => {
    const tokens = getAirPadTokens();
    if (!tokens.length) return true;
    const token = extractTokenFromQuery(rawUrl);
    return !!token && tokens.includes(token);
};

const parseOrigin = (value: string): { protocol: string; hostname: string; port: string } | null => {
    try {
        const parsed = new URL(value);
        return {
            protocol: parsed.protocol.replace(":", ""),
            hostname: parsed.hostname,
            port: parsed.port
        };
    } catch {
        return null;
    }
};

const hasDefaultOriginPort = (protocol: string, port: string): boolean => {
    if (protocol === "https") return port === "" || port === "443";
    if (protocol === "http") return port === "" || port === "80";
    return port === "";
};

const getDefaultAllowedOrigins = (): string[] => {
    const httpsPort = Number((config as any)?.listenPort ?? 8443);
    const httpPort = Number((config as any)?.httpPort ?? 8080);
    const hosts = ["localhost", "127.0.0.1", "u2re.space", "www.u2re.space"];
    const values = new Set<string>();
    for (const host of hosts) {
        values.add(`http://${host}`);
        values.add(`https://${host}`);
        values.add(`http://${host}:${httpPort}`);
        values.add(`https://${host}:${httpsPort}`);
    }
    return Array.from(values);
};

const matchesAllowedOrigin = (origin: string, allowed: string[]): boolean => {
    if (!allowed.length) return true;
    if (allowed.includes(origin)) return true;

    const parsedOrigin = parseOrigin(origin);
    if (!parsedOrigin) return false;
    if (parsedOrigin.hostname === "localhost" || parsedOrigin.hostname.startsWith("127.")) {
        return true;
    }

    for (const item of allowed) {
        if (!item) continue;
        const parsedAllowed = parseOrigin(item);
        if (!parsedAllowed) continue;
        if (parsedOrigin.protocol !== parsedAllowed.protocol) continue;
        if (parsedOrigin.hostname !== parsedAllowed.hostname) continue;

        if (parsedAllowed.port === parsedOrigin.port) return true;
        if (!parsedAllowed.port && parsedOrigin.port === "") return true;
        if (parsedOrigin.port === "" && hasDefaultOriginPort(parsedOrigin.protocol, parsedAllowed.port)) return true;
    }

    const allowPrivate192 = process.env.SOCKET_IO_ALLOW_PRIVATE_192 !== "false";
    if (!allowPrivate192) return false;

    if (parsedOrigin.hostname.startsWith("192.168.")) return true;

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
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 30000,
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
            if (getAirPadTokens().length > 0 && isAuthorizedByQueryToken(req.url)) {
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
