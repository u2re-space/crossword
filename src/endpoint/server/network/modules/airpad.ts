import type { Socket } from "socket.io";

import { parsePayload, verifyWithoutDecrypt } from "../stack/crypto-utils.ts";
import { normalizeSocketFrame } from "../stack/messages.ts";

export type AirpadClipHistoryEntry = {
    from: string;
    to: string;
    ts: number;
    data: any;
};

type AirpadSignedEnvelope = { cipher: string; sig: string; from?: string };

type HasSignedEnvelope = (payload: unknown) => payload is AirpadSignedEnvelope;

const hasSignedEnvelope: HasSignedEnvelope = (payload: unknown): payload is AirpadSignedEnvelope =>
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as any).cipher === "string" &&
    typeof (payload as any).sig === "string";

const extractPayload = (payload: unknown, requiresSecureEnvelope: boolean): unknown => {
    if (!hasSignedEnvelope(payload)) return payload as unknown;
    if (!requiresSecureEnvelope) return payload;
    const parsed = parsePayload(payload);
    return parsed.inner;
};

export const getAirPadTokens = () =>
    (process.env.AIRPAD_AUTH_TOKENS || process.env.AIRPAD_TOKENS || "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

export const getAirPadTokenFromSocket = (socket: Socket) => {
    const handshake: any = (socket as any).handshake || {};
    const auth = handshake.auth || {};
    const query = handshake.query || {};
    const pick = (value: unknown) => {
        if (typeof value === "string") return value;
        if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
        return "";
    };

    return (
        pick(auth.token) ||
        pick(auth.airpadToken) ||
        pick(query.token) ||
        pick(query.airpadToken)
    );
};

export const isAirPadAuthorized = (socket: Socket) => {
    const allowed = getAirPadTokens();
    if (!allowed.length) return true;
    const provided = getAirPadTokenFromSocket(socket);
    return !!provided && allowed.includes(provided);
};

export type AirpadConnectionMeta = {
    clientId?: string;
    sourceId?: string;
    remoteAddress?: string;
    remotePort?: number;
    hopHint?: string;
    hostHint?: string;
    routeTarget?: string;
    targetHost?: string;
    targetPort?: string;
    routeHint?: string;
    viaPort?: string;
    protocolHint?: string;
    xForwardedFor?: unknown;
    xForwardedHost?: unknown;
    xForwardedProto?: unknown;
    xRealIp?: unknown;
    xRealHost?: unknown;
};

const pickString = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        const normalized = value.trim();
        return normalized.length ? normalized : undefined;
    }
    if (Array.isArray(value)) {
        return typeof value[0] === "string" ? value[0].trim() || undefined : undefined;
    }
    return undefined;
};

export const describeAirPadConnectionMeta = (socket: Socket): AirpadConnectionMeta => {
    const auth: Record<string, unknown> = (socket as any).handshake?.auth || {};
    const headers: Record<string, unknown> = (socket as any).handshake?.headers || {};
    const query: Record<string, unknown> = (socket as any).handshake?.query || {};
    const remoteAddress =
        (socket.handshake as any)?.address ||
        (socket as any)?.request?.socket?.remoteAddress;
    const remotePort = (socket as any)?.request?.socket?.remotePort;

    return {
        remoteAddress: pickString(remoteAddress),
        remotePort: typeof remotePort === "number" ? remotePort : undefined,
        clientId: pickString(auth.clientId) || pickString(query.clientId),
        sourceId: (
            pickString(query.__airpad_src) ||
            pickString(query.__airpad_source) ||
            pickString(query.sourceId) ||
            pickString(query.source) ||
            pickString(query.peerId) ||
            pickString(auth.clientId) ||
            pickString(query.clientId)
        ),
        hopHint: pickString(query.__airpad_hop),
        hostHint: pickString(query.__airpad_host),
        targetHost: pickString(query.__airpad_target),
        targetPort: pickString(query.__airpad_target_port),
        routeHint: pickString(query.__airpad_via),
        routeTarget: (
            pickString(query.__airpad_route) ||
            pickString(query.__airpad_route_target) ||
            pickString(query.routeTarget) ||
            pickString(query.__airpad_peer) ||
            pickString(query.__airpad_device) ||
            pickString(query.__airpad_client) ||
            pickString(query.to) ||
            pickString(query.target) ||
            pickString(query.targetId) ||
            pickString(query.deviceId) ||
            pickString(query.peerId)
        ),
        viaPort: pickString(query.__airpad_via_port),
        protocolHint: pickString(query.__airpad_protocol),
        xForwardedFor: (headers["x-forwarded-for"] || headers["X-Forwarded-For"]),
        xForwardedHost: (headers["x-forwarded-host"] || headers["X-Forwarded-Host"]),
        xForwardedProto: (headers["x-forwarded-proto"] || headers["X-Forwarded-Proto"]),
        xRealIp: (headers["x-real-ip"] || headers["X-Real-IP"]),
        xRealHost: (headers["x-real-host"] || headers["X-Real-Host"])
    };
};

export const isAirPadMessageAuthRequired = () => process.env.AIRPAD_REQUIRE_SIGNED_MESSAGE === "true";

export type AirpadObjectMessageDeps = {
    routeMessage: (sourceSocket: Socket, msg: any) => void;
    requiresAirpadMessageAuth: boolean;
    getSourceId: (socket: Socket) => string;
    clipHistory: AirpadClipHistoryEntry[];
    maxHistory: number;
    logMsg: (prefix: string, msg: any) => void;
    emitError: (socket: Socket, message: string) => void;
};

export const createAirpadObjectMessageHandler = (
    socket: Socket,
    deps: AirpadObjectMessageDeps
) => {
    return async (msg: any): Promise<void> => {
        const normalized = normalizeSocketFrame(msg, deps.getSourceId(socket));
        const signed = hasSignedEnvelope(normalized.payload);
        const envelopeRequired = deps.requiresAirpadMessageAuth || normalized.mode === "secure";

        if (envelopeRequired) {
            if (!signed) {
                console.warn(`[Server] AirPad signed payload required for mode=${normalized.mode}, from=${normalized.from}`);
                deps.emitError(socket, "Signed payload required");
                return;
            }
            const ok = verifyWithoutDecrypt(normalized.payload);
            if (!ok) {
                console.warn(`[Server] Signed payload validation failed for from=${normalized.from}`);
                deps.emitError(socket, "Signed payload validation failed");
                return;
            }
        }

        const parsed = hasSignedEnvelope(normalized.payload) ? parsePayload(normalized.payload) : null;
        if (parsed) {
            normalized.from = normalized.from || parsed.from;
            normalized.payload = extractPayload(normalized.payload, deps.requiresAirpadMessageAuth);
        }

        deps.logMsg("IN ", normalized);

        try {
            if (normalized.mode === "blind") {
                if (!deps.requiresAirpadMessageAuth && !envelopeRequired) {
                    const ok = verifyWithoutDecrypt(normalized.payload);
                    if (!ok) {
                        console.warn(`[Server] Signature verification failed (blind mode) for from=${normalized.from}`);
                        deps.emitError(socket, "Signature verification failed");
                        return;
                    }
                }

                deps.routeMessage(socket, normalized);
                return;
            }

            if (normalized.mode === "inspect") {
                const { from, inner } = parsePayload(normalized.payload);
                console.log(
                    `[Server] INSPECT from=${from} to=${normalized.to} type=${normalized.type} action=${normalized.action} data=<hidden>`
                );

                if (normalized.type === "clip") {
                    deps.clipHistory.push({
                        from,
                        to: normalized.to,
                        ts: inner?.ts || Date.now(),
                        data: inner?.data ?? null
                    });
                    if (deps.clipHistory.length > deps.maxHistory) deps.clipHistory.shift();
                }

                deps.routeMessage(socket, normalized);
                return;
            }

            console.warn(`[Server] Unknown mode: ${normalized.mode}`);
            deps.emitError(socket, `Unknown mode: ${normalized.mode}`);
        } catch (error: any) {
            console.error(`[Server] Error handling message:`, error);
            deps.emitError(socket, `Error processing message: ${error?.message || String(error)}`);
        }
    };
};

export const requiresAirpadMessageAuth = isAirPadMessageAuthRequired();
