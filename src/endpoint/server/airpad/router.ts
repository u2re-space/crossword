import type { Socket } from "socket.io";

import type { AirpadConnectionMeta } from "./airpad.ts";

type NetworkContext = {
    sendToUpstream?: (payload: any) => boolean;
    upstreamUserId?: string;
};

type Logger = {
    debug?: (obj: any, msg: string) => void;
    warn?: (obj: any, msg: string) => void;
    error?: (obj: any, msg: string) => void;
};

export type AirpadRouterDebugDevice = {
    deviceId: string;
    socketId: string;
    clientId?: string;
    sourceId?: string;
    routeTarget?: string;
    routeHint?: string;
    targetHost?: string;
    hostHint?: string;
    targetPort?: string;
    viaPort?: string;
    protocolHint?: string;
};

type AirpadRouterOptions = {
    networkContext?: NetworkContext;
    isTunnelDebug?: boolean;
    logger?: Logger;
};

export interface AirpadSocketRouter {
    registerConnection: (socket: Socket, meta: AirpadConnectionMeta) => void;
    unregisterConnection: (socket: Socket) => void;
    registerAlias: (socket: Socket, value: unknown) => void;
    registerTunnelAlias: (socket: Socket, value: unknown) => void;
    getConnectionMeta: (socket: Socket) => AirpadConnectionMeta | undefined;
    getRouteHint: (socket: Socket) => string | undefined;
    isEndpoint: (socket: Socket) => boolean;
    resolveAirpadTarget: (sourceSocket: Socket, rawTarget: string, hasExplicitTarget: boolean) => string;
    resolveTunnelTargets: (sourceSocket: Socket, frame: any) => string[];
    forwardToAirpadTargets: (sourceSocket: Socket, payload: any, frame: any) => boolean;
    forwardBinaryToUpstream: (sourceSocket: Socket, raw: Buffer | Uint8Array | ArrayBuffer, target: string) => boolean;
    forwardToUpstream: (sourceSocket: Socket, frame: any) => boolean;
    getSocket: (deviceId: string) => Socket | undefined;
    sendToDevice: (userId: string, deviceId: string, payload: any) => boolean;
    getConnectedDevices: () => string[];
    getTunnelTargets: () => string[];
    getDebugDevices: () => AirpadRouterDebugDevice[];
    normalizeHint: (value: unknown) => string;
}

const isBroadcastTarget = (value: string): boolean => value === "broadcast" || value === "all" || value === "*";

export const createAirpadRouter = (options: AirpadRouterOptions = {}): AirpadSocketRouter => {
    const networkContext = options.networkContext;
    const isTunnelDebug = options.isTunnelDebug === true;
    const logger = options.logger;

    const clients = new Map<string, Socket>();
    const airpadConnectionMeta = new Map<Socket, AirpadConnectionMeta>();
    const airpadTargets = new Map<string, Set<Socket>>();
    const socketAliases = new Map<Socket, Set<string>>();

    const normalizeHint = (value: unknown): string => {
        if (typeof value !== "string") return "";
        const normalized = value.trim().toLowerCase();
        return normalized;
    };

    const encodeBinaryForTunnel = (raw: Buffer | Uint8Array | ArrayBuffer): string => {
        try {
            return Buffer.from(raw as any).toString("base64");
        } catch {
            return "";
        }
    };

    const addClientAlias = (socket: Socket, value: unknown): void => {
        const normalized = normalizeHint(value);
        if (!normalized) return;
        clients.set(normalized, socket);
        const aliases = socketAliases.get(socket) ?? new Set<string>();
        aliases.add(normalized);
        socketAliases.set(socket, aliases);
    };

    const addTunnelAlias = (socket: Socket, value: unknown): void => {
        const normalized = normalizeHint(value);
        if (!normalized) return;
        const existing = airpadTargets.get(normalized) || new Set<Socket>();
        existing.add(socket);
        airpadTargets.set(normalized, existing);
        const aliases = socketAliases.get(socket) ?? new Set<string>();
        aliases.add(normalized);
        socketAliases.set(socket, aliases);
    };

    const removeSocketAliases = (socket: Socket): void => {
        const aliases = socketAliases.get(socket);
        if (!aliases) return;
        aliases.forEach((alias) => {
            const direct = clients.get(alias);
            if (direct === socket) clients.delete(alias);
            const tunnelSet = airpadTargets.get(alias);
            if (tunnelSet) {
                tunnelSet.delete(socket);
                if (tunnelSet.size === 0) {
                    airpadTargets.delete(alias);
                }
            }
        });
        socketAliases.delete(socket);
    };

    const registerConnection = (socket: Socket, meta: AirpadConnectionMeta): void => {
        airpadConnectionMeta.set(socket, meta);
        if (meta.targetHost) addTunnelAlias(socket, meta.targetHost);
        if (meta.targetHost) addClientAlias(socket, meta.targetHost);
        if (meta.hostHint) addTunnelAlias(socket, meta.hostHint);
        if (meta.hostHint) addClientAlias(socket, meta.hostHint);
        if (meta.clientId) addTunnelAlias(socket, meta.clientId);
        if (meta.clientId) addClientAlias(socket, meta.clientId);
        if (meta.sourceId) addClientAlias(socket, meta.sourceId);
        if (meta.sourceId) addTunnelAlias(socket, meta.sourceId);
        if (meta.routeTarget) addClientAlias(socket, meta.routeTarget);
        if (meta.routeTarget) addTunnelAlias(socket, meta.routeTarget);
    };

    const unregisterConnection = (socket: Socket): void => {
        const meta = airpadConnectionMeta.get(socket);
        if (!meta) {
            removeSocketAliases(socket);
            return;
        }
        const removeAlias = (target: unknown): void => {
            const normalized = normalizeHint(target);
            if (!normalized) return;
            const existing = airpadTargets.get(normalized);
            if (!existing) return;
            existing.delete(socket);
            if (existing.size === 0) {
                airpadTargets.delete(normalized);
            }
        };
        removeAlias(meta.targetHost);
        removeAlias(meta.hostHint);
        removeAlias(meta.clientId);
        removeAlias(meta.sourceId);
        removeAlias(meta.routeTarget);
        removeSocketAliases(socket);
        airpadConnectionMeta.delete(socket);
    };

    const resolveTunnelTargets = (sourceSocket: Socket, frame: any): string[] => {
        const next = new Set<string>();
        const meta = airpadConnectionMeta.get(sourceSocket);
        const routeHint = normalizeHint(meta?.routeHint);
        if (routeHint !== "tunnel" && routeHint !== "remote") return [];

        const frameTarget = normalizeHint(frame?.to);
        if (frameTarget && !isBroadcastTarget(frameTarget)) {
            next.add(frameTarget);
            return Array.from(next).filter(Boolean);
        }
        if (!frameTarget || isBroadcastTarget(frameTarget)) {
            const routeTarget = normalizeHint(meta?.routeTarget);
            if (routeTarget) {
                next.add(routeTarget);
                return Array.from(next).filter(Boolean);
            }
            if (meta?.targetHost) {
                next.add(normalizeHint(meta.targetHost));
            }
            if (meta?.hostHint) {
                next.add(normalizeHint(meta.hostHint));
            }
            return Array.from(next).filter(Boolean);
        }
        return Array.from(next).filter(Boolean);
    };

    const isEndpointConnection = (socket: Socket): boolean => {
        const meta = airpadConnectionMeta.get(socket);
        if (typeof meta?.isEndpoint === "boolean") return meta.isEndpoint;
        const routeHint = normalizeHint(meta?.routeHint);
        if (routeHint === "tunnel" || routeHint === "remote") return false;
        const routeTarget = normalizeHint(meta?.routeTarget);
        const hostHint = normalizeHint(meta?.targetHost) || normalizeHint(meta?.hostHint);
        if (routeTarget && hostHint && routeTarget !== hostHint && routeTarget !== `l-${hostHint}`) {
            return false;
        }
        return true;
    };

    const resolveAirpadTarget = (sourceSocket: Socket, rawTarget: string, hasExplicitTarget: boolean): string => {
        const target = normalizeHint(rawTarget);
        const meta = airpadConnectionMeta.get(sourceSocket);
        const hasRouteTarget = normalizeHint(meta?.routeTarget) || normalizeHint(meta?.targetHost) || "";
        if (!target) return hasRouteTarget || target;
        if (isBroadcastTarget(target)) {
            return hasExplicitTarget ? target : hasRouteTarget || target;
        }
        const direct = clients.get(target);
        if (direct && direct.connected) return target;
        if (hasExplicitTarget) return target;
        return hasRouteTarget || target;
    };

    const forwardToAirpadTargets = (sourceSocket: Socket, payload: any, frame: any): boolean => {
        const targets = resolveTunnelTargets(sourceSocket, frame);
        if (!targets.length) return false;
        let delivered = false;
        for (const rawTarget of targets) {
            const targetSockets = airpadTargets.get(rawTarget);
            if (!targetSockets) continue;
            for (const targetSocket of targetSockets) {
                if (targetSocket === sourceSocket) continue;
                targetSocket.emit("message", payload);
                delivered = true;
            }
        }
        return delivered;
    };

    const forwardToUpstream = (sourceSocket: Socket, frame: any): boolean => {
        if (!networkContext?.sendToUpstream) {
            if (isTunnelDebug) {
                logger?.debug?.(
                    { socketId: sourceSocket.id, to: normalizeHint(frame?.to), via: airpadConnectionMeta.get(sourceSocket)?.routeHint },
                    `[Router] Tunnel upstream unavailable`
                );
            }
            return false;
        }
        if (!frame || typeof frame !== "object") return false;
        const meta = airpadConnectionMeta.get(sourceSocket);
        const routeHint = normalizeHint(meta?.routeHint);
        if (routeHint !== "tunnel" && routeHint !== "remote") return false;
        const rawTarget = normalizeHint(frame.to);
        if (!rawTarget || isBroadcastTarget(rawTarget)) return false;
        const upstreamUserId = normalizeHint(networkContext.upstreamUserId);
        const upstreamFrom = normalizeHint(meta?.sourceId) || upstreamUserId || normalizeHint((sourceSocket as any).userId) || sourceSocket.id;
        const upstreamUser = upstreamUserId || normalizeHint(meta?.targetHost) || normalizeHint(meta?.hostHint);
        const accepted = networkContext.sendToUpstream({
            ...frame,
            from: upstreamFrom,
            userId: upstreamUser,
            target: rawTarget,
            targetId: rawTarget,
            to: rawTarget,
            routeTarget: normalizeHint(meta?.routeTarget) || rawTarget
        });
        if (!accepted && isTunnelDebug) {
            logger?.warn?.(
                {
                    socketId: sourceSocket.id,
                    to: rawTarget,
                    via: airpadConnectionMeta.get(sourceSocket)?.routeHint || "?"
                },
                `[Router] Tunnel upstream rejected`
            );
        }
        return accepted;
    };

    const forwardBinaryToUpstream = (sourceSocket: Socket, raw: Buffer | Uint8Array | ArrayBuffer, target: string): boolean => {
        if (!networkContext?.sendToUpstream) {
            if (isTunnelDebug) {
                logger?.debug?.(
                    { socketId: sourceSocket.id, target, via: airpadConnectionMeta.get(sourceSocket)?.routeHint || "?" },
                    `[Router] Binary tunnel upstream unavailable`
                );
            }
            return false;
        }
        const meta = airpadConnectionMeta.get(sourceSocket);
        const upstreamTarget = normalizeHint(target);
        if (!upstreamTarget || isBroadcastTarget(upstreamTarget)) return false;

        const upstreamUserId = normalizeHint(networkContext.upstreamUserId);
        const upstreamFrom = normalizeHint(meta?.sourceId) || upstreamUserId || normalizeHint((sourceSocket as any).userId) || sourceSocket.id;
        const upstreamUser = upstreamUserId || normalizeHint(meta?.targetHost) || normalizeHint(meta?.hostHint);
        const upstreamPayload = {
            type: "dispatch",
            from: upstreamFrom,
            to: upstreamTarget,
            target: upstreamTarget,
            targetId: upstreamTarget,
            namespace: "default",
            mode: "blind",
            payload: {
                __airpadBinary: true,
                encoding: "base64",
                data: encodeBinaryForTunnel(raw)
            },
            userId: upstreamUser,
            routeTarget: normalizeHint(meta?.routeTarget) || upstreamTarget,
            via: normalizeHint(meta?.routeHint),
            surface: "socketio"
        };
        const accepted = networkContext.sendToUpstream(upstreamPayload);
        if (accepted && isTunnelDebug) {
            logger?.debug?.(
                { socketId: sourceSocket.id, target: upstreamTarget },
                `[Router] OUT(tunnel-upstream-binary)`
            );
        } else if (isTunnelDebug) {
            logger?.debug?.(
                { socketId: sourceSocket.id, target: upstreamTarget, via: airpadConnectionMeta.get(sourceSocket)?.routeHint || "?" },
                `[Router] Binary tunnel upstream rejected`
            );
        }
        return accepted;
    };

    const getSocket = (deviceId: string): Socket | undefined => clients.get(normalizeHint(deviceId));

    const sendToDevice = (_userId: string, deviceId: string, payload: any): boolean => {
        const target = getSocket(deviceId);
        if (!target?.connected) return false;
        try {
            target.emit("message", payload);
            return true;
        } catch {
            return false;
        }
    };

    const getDebugDevices = (): AirpadRouterDebugDevice[] => {
        return Array.from(clients.entries()).map(([deviceId, socket]) => {
            const meta = airpadConnectionMeta.get(socket);
            return {
                deviceId,
                socketId: socket.id,
                clientId: meta?.clientId,
                sourceId: meta?.sourceId,
                routeTarget: meta?.routeTarget,
                routeHint: meta?.routeHint,
                targetHost: meta?.targetHost,
                hostHint: meta?.hostHint,
                targetPort: meta?.targetPort,
                viaPort: meta?.viaPort,
                protocolHint: meta?.protocolHint
            };
        });
    };

    return {
        registerConnection,
        unregisterConnection,
        registerAlias: addClientAlias,
        registerTunnelAlias: addTunnelAlias,
        getConnectionMeta: (socket) => airpadConnectionMeta.get(socket),
        getRouteHint: (socket) => airpadConnectionMeta.get(socket)?.routeHint,
        isEndpoint: (socket) => isEndpointConnection(socket),
        resolveAirpadTarget,
        resolveTunnelTargets,
        forwardToAirpadTargets,
        forwardBinaryToUpstream,
        forwardToUpstream,
        getSocket,
        sendToDevice: (_userId, deviceId, payload) => sendToDevice("", deviceId, payload),
        getConnectedDevices: () => Array.from(clients.keys()),
        getTunnelTargets: () => Array.from(airpadTargets.keys()).filter(Boolean),
        getDebugDevices,
        normalizeHint
    };
};
