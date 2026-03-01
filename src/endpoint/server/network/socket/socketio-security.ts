import type { IncomingMessage } from "node:http";
import type { ServerOptions } from "socket.io";
import config from "../../config/config.ts";
import { pickEnvBoolLegacy, pickEnvListLegacy } from "../../lib/env.ts";
import { getAirPadTokens, isAirPadRequestAuthorized } from "../modules/airpad.ts";
import { parsePortableInteger } from "../../lib/parsing.ts";

type LoggerLike = {
    info?: (obj: any, msg?: string) => void;
    warn?: (obj: any, msg?: string) => void;
    error?: (obj: any, msg?: string) => void;
};

const parseAllowedOrigins = (): string[] => {
    const values = pickEnvListLegacy("CWS_SOCKET_IO_ALLOWED_ORIGINS") || [];
    const allowAll = values.some((value) => value === "*" || value.toLowerCase() === "all");
    return allowAll ? ["*"] : values;
};

const normalizePort = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    return parsePortableInteger(value);
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

const isPrivateNetworkHost = (hostname: string): boolean => {
    if (!hostname) return false;
    if (hostname === "localhost" || hostname.startsWith("127.")) return true;
    if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    return false;
};

const buildWildcardRegex = (value: string): RegExp => {
    const escaped = value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped.replace(/\*/g, ".*")}$`, "i");
};

const isAllowedOrigin = (parsedOrigin: ReturnType<typeof parseOrigin>, item: string): boolean => {
    if (!item) return false;
    const normalized = item.trim();
    if (!normalized) return false;
    if (normalized === "*" || normalized.toLowerCase() === "all") return true;

    const parsedAllowed = parseOrigin(normalized);
    const hasProtocol = normalized.includes("://");
    if (parsedAllowed) {
        if (parsedAllowed.protocol !== parsedOrigin.protocol) return false;
        if (parsedAllowed.hostname.includes("*")) {
            if (!buildWildcardRegex(parsedAllowed.hostname).test(parsedOrigin.hostname)) return false;
        } else if (parsedAllowed.hostname !== parsedOrigin.hostname) {
            return false;
        }
        if (parsedAllowed.port && parsedAllowed.port !== parsedOrigin.port && !(parsedOrigin.port === "" && hasDefaultOriginPort(parsedOrigin.protocol, parsedAllowed.port))) {
            return false;
        }
        return true;
    }

    const candidate = normalized.toLowerCase();
    if (!hasProtocol) {
        let hostPart = normalized;
        let port = "";
        const lastColon = normalized.lastIndexOf(":");
        if (lastColon > 0 && /^\d+$/.test(normalized.slice(lastColon + 1))) {
            hostPart = normalized.slice(0, lastColon);
            port = normalized.slice(lastColon + 1);
        }
        const host = hostPart.toLowerCase();
        if (host.includes("*")) {
            if (!buildWildcardRegex(host).test(parsedOrigin.hostname)) return false;
        } else if (host !== parsedOrigin.hostname) {
            return false;
        }
        if (port && port !== parsedOrigin.port && !(parsedOrigin.port === "" && hasDefaultOriginPort(parsedOrigin.protocol, port))) {
            return false;
        }
        return true;
    }
    return false;
};

export const isPrivateNetworkCorsEnabled = (): boolean =>
    pickEnvBoolLegacy("CWS_CORS_ALLOW_PRIVATE_NETWORK", true) !== false;

export const applySocketIoPrivateNetworkHeaders = (headers: Record<string, any>, req: any): void => {
    if (!isPrivateNetworkCorsEnabled()) return;
    const pnaHeader = String(req?.headers?.["access-control-request-private-network"] || "").toLowerCase();
    if (pnaHeader !== "true") return;

    headers["Access-Control-Allow-Private-Network"] = "true";
    const existingVary = String(headers["Vary"] || headers["vary"] || "");
    const varyParts = existingVary
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    if (!varyParts.includes("Access-Control-Request-Private-Network")) {
        varyParts.push("Access-Control-Request-Private-Network");
    }
    if (varyParts.length > 0) {
        headers["Vary"] = varyParts.join(", ");
    }
};

const getDefaultAllowedOrigins = (): string[] => {
    const httpsPort = parsePortableInteger((config as any)?.listenPort) ?? 8443;
    const httpPort = parsePortableInteger((config as any)?.httpPort) ?? 8080;
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
    if (allowed.includes("*")) return true;

    const parsedOrigin = parseOrigin(origin);
    if (!parsedOrigin) return false;
    if (parsedOrigin.hostname === "localhost" || parsedOrigin.hostname.startsWith("127.")) {
        return true;
    }

    for (const item of allowed) {
        if (isAllowedOrigin(parsedOrigin, item)) {
            return true;
        }
    }

    const allowPrivateRfc1918 = pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_PRIVATE_RFC1918", true) !== false
        && pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_PRIVATE_192", true) !== false;
    const allowPrivateNetworkOrigins = pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_PRIVATE_NETWORK_ORIGINS", false) === true;
    if (!allowPrivateRfc1918 && !allowPrivateNetworkOrigins) return false;

    const host = parsedOrigin.hostname;
    if (isPrivateNetworkHost(host)) return true;

    return false;
};

export const buildSocketIoOptions = (logger?: LoggerLike): Partial<ServerOptions> => {
    const allowedOrigins = parseAllowedOrigins();
    const defaults = getDefaultAllowedOrigins();
    const effectiveAllowedOrigins = allowedOrigins.length ? allowedOrigins : defaults;
    const allowAllOrigins = effectiveAllowedOrigins.includes("*");
    const allowPrivateRfc1918 = pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_PRIVATE_RFC1918", true) !== false
        && pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_PRIVATE_192", true) !== false;
    const allowPrivateNetworkOrigins = pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_PRIVATE_NETWORK_ORIGINS", false) === true;
        const hasAirPadAuthTokens = getAirPadTokens().length > 0;
    const allowUnknownOriginWithAirPadAuth = (
        pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_UNKNOWN_ORIGIN_WITH_AUTH", undefined) ??
        pickEnvBoolLegacy("CWS_SOCKET_IO_ALLOW_UNKNOWN_ORIGIN_WITH_AIRPAD_AUTH", true)
    ) !== false && hasAirPadAuthTokens;

    logger?.info?.(
        {
            allowedOrigins: effectiveAllowedOrigins,
            source: allowedOrigins.length ? "CWS_SOCKET_IO_ALLOWED_ORIGINS" : "default-local-origins",
            allowPrivateRfc1918: allowPrivateRfc1918,
            allowPrivateNetworkOrigins,
            allowUnknownOriginWithAirPadAuth
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
                if (allowAllOrigins) {
                    callback(null, true);
                    return;
                }
                if (allowUnknownOriginWithAirPadAuth) {
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
            if (allowAllOrigins) {
                callback(null, true);
                return;
            }
            if (isAirPadRequestAuthorized(req)) {
                callback(null, true);
                return;
            }
            if (allowPrivateNetworkOrigins) {
                const parsedOrigin = parseOrigin(origin);
                if (parsedOrigin && isPrivateNetworkHost(parsedOrigin.hostname)) {
                    callback(null, true);
                    return;
                }
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
    const encrypted = (req?.socket as any)?.encrypted === true;
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
