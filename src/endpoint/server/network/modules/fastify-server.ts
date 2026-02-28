import { readFile } from "node:fs/promises";
import net from "node:net";

import Fastify, { type FastifyInstance } from "fastify";
import path from "node:path";

import { isMainModule, moduleDirname, runtimeArgs } from "../../lib/runtime.ts";
import { createWsServer } from "../socket/websocket.ts";
import type { WsHub } from "../socket/websocket.ts";
import { createSocketIoBridge } from "../socket/socketio-bridge.ts";
import { registerOpsRoutes } from "../../io/ops.ts";
import { startUpstreamPeerClient } from "../stack/upstream.ts";
import { resolveTunnelTarget } from "../stack/messages.ts";
import { normalizeNetworkAliasMap, resolveNetworkAlias } from "../stack/topology.ts";
import config from "../../config/config.ts";
import { registerRoutes } from "../../routing/routes.ts";
import { registerApiFallback, registerCoreApp } from "../../routing/core-app.ts";
import { createHttpClient } from "../stack/https.ts";
import { setApp as setClipboardApp, setHttpClient, startClipboardPolling } from "../../io/clipboard.ts";
import { startMouseFlushInterval } from "../../io/mouse.ts";
import { setApp as setPythonApp } from "../../gpt/python.ts";
import { resolvePeerIdentity } from "../stack/peer-identity.ts";
import {
    normalizeEndpointPolicies,
    resolveEndpointIdPolicyStrict,
    resolveEndpointPolicyRoute
} from "../stack/endpoint-policy.ts";

const KEY_FILE_NAME = "multi.key";
const CRT_FILE_NAME = "multi.crt";
const unique = (items: string[]) => [...new Set(items.map((item) => path.resolve(item)))];

const candidateHttpsFiles = () => {
    const moduleDir = moduleDirname(import.meta);
    const cwd = process.cwd();
    return {
        keys: unique([
            path.resolve(cwd, "./https/local/" + KEY_FILE_NAME),
            path.resolve(cwd, "./" + KEY_FILE_NAME),
            path.resolve(moduleDir, "./https/local/" + KEY_FILE_NAME),
            path.resolve(moduleDir, "../https/local/" + KEY_FILE_NAME),
            path.resolve(moduleDir, "../" + KEY_FILE_NAME),
            path.resolve(moduleDir, "../../https/local/" + KEY_FILE_NAME),
            path.resolve(moduleDir, "../../" + KEY_FILE_NAME),
            path.resolve(moduleDir, "../../../" + KEY_FILE_NAME)
        ]),
        certs: unique([
            path.resolve(cwd, "./https/local/" + CRT_FILE_NAME),
            path.resolve(cwd, "./" + CRT_FILE_NAME),
            path.resolve(moduleDir, "./https/local/" + CRT_FILE_NAME),
            path.resolve(moduleDir, "../https/local/" + CRT_FILE_NAME),
            path.resolve(moduleDir, "../" + CRT_FILE_NAME),
            path.resolve(moduleDir, "../../https/local/" + CRT_FILE_NAME),
            path.resolve(moduleDir, "../../" + CRT_FILE_NAME),
            path.resolve(moduleDir, "../../../" + CRT_FILE_NAME)
        ])
    };
};

const defaultHttpsPaths = () => {
    const candidates = candidateHttpsFiles();
    return {
        key: candidates.keys[0] || path.resolve(moduleDirname(import.meta), "./https/local/" + KEY_FILE_NAME),
        cert: candidates.certs[0] || path.resolve(moduleDirname(import.meta), "./https/local/" + CRT_FILE_NAME)
    };
};

const loadHttpsOptions = async () => {
    if (process.env.HTTPS_ENABLED === "false") return undefined;
    const { key: keyPath, cert: certPath } = defaultHttpsPaths();
    const envKey = process.env.HTTPS_KEY_FILE;
    const envCert = process.env.HTTPS_CERT_FILE;
    const keyCandidates = envKey ? [envKey] : candidateHttpsFiles().keys;
    const certCandidates = envCert ? [envCert] : candidateHttpsFiles().certs;
    try {
        const keyFile = keyCandidates[0] || keyPath;
        const certFile = certCandidates[0] || certPath;
        const [key, cert] = await Promise.all([
            readFile(keyFile),
            readFile(certFile)
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
    } catch (error) {
        const details = String((error as any)?.message || error || "unknown");
        console.warn(
            `[core-backend] HTTPS disabled: failed to load certificate files ` +
            `key=${envKey || keyPath}, cert=${envCert || certPath}. ${details}`
        );
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
        srv.once("listening", () => {
            srv.close(() => resolve(true));
        });
        srv.listen({ host, port });
    });
};

const pickHttpPort = async (host: string): Promise<number> => {
    const preferred = 8080;
    const fallback = 8081;
    return (await isPortAvailable(host, preferred)) ? preferred : fallback;
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
    } as any;
};

// Receives messages from upstream gateway/origin and dispatches them into local peer hub.
const buildUpstreamRouter = (app: FastifyInstance, hub: WsHub, fallbackUserId: string) => {
    const upstreamAliasMap = normalizeNetworkAliasMap((config as any)?.networkAliases || {});
    const endpointPolicyMap = normalizeEndpointPolicies((config as any)?.endpointIDs || {});
    const isTunnelDebug = String(process.env.CWS_TUNNEL_DEBUG || process.env.AIRPAD_TUNNEL_DEBUG || "").toLowerCase() === "true";
    const defaultUserId = fallbackUserId || "";
    const resolveSourceForPolicy = (msg: Record<string, unknown>, fallback: string): { sourceId: string; isKnown: boolean } => {
        const sourceHint = (typeof msg.from === "string" && msg.from.trim())
            ? msg.from
            : (typeof (msg as any).source === "string" && (msg as any).source.trim()
                ? (msg as any).source
                : (typeof (msg as any).sourceId === "string" && (msg as any).sourceId.trim()
                    ? (msg as any).sourceId
                    : (typeof (msg as any).src === "string" && (msg as any).src.trim()
                        ? (msg as any).src
                        : fallback)));
        const trimmed = typeof sourceHint === "string" ? sourceHint.trim() : "";
        const fallbackSource = fallback.trim();
        if (!trimmed) return { sourceId: fallbackSource, isKnown: true };
        const normalizedPolicyHint = resolvePolicyTarget(trimmed);
        const policyResolved = normalizedPolicyHint
            ? resolveEndpointPolicyRoute(normalizedPolicyHint, normalizedPolicyHint, endpointPolicyMap).targetPolicy
            : undefined;
        const strictPolicy = normalizedPolicyHint ? resolveEndpointIdPolicyStrict(endpointPolicyMap, normalizedPolicyHint) : undefined;
        const fallbackSourceId = fallback.trim();
        const sourceId = (policyResolved?.id && policyResolved.id !== "*" ? policyResolved.id : normalizedPolicyHint) || fallbackSource;
        const known = Boolean(strictPolicy) || sourceId === fallbackSourceId;
        return { sourceId, isKnown: known };
    };
    const stripPort = (value: string): string => {
        const trimmed = String(value || "").trim();
        const at = trimmed.lastIndexOf(":");
        if (at <= 0) return trimmed;
        const candidate = trimmed.slice(at + 1);
        if (/^\d+$/.test(candidate)) return trimmed.slice(0, at);
        return trimmed;
    };
    const resolvePolicyTarget = (rawTarget: string): string => {
        const normalized = stripPort(String(rawTarget || "").trim().toLowerCase());
        if (!normalized) return "";
        const directMatch = endpointPolicyMap[normalized];
        if (directMatch && directMatch.id) return directMatch.id;
        const policyCandidate = resolveEndpointPolicyRoute(normalized, normalized, endpointPolicyMap);
        return policyCandidate?.targetPolicy?.id && policyCandidate.targetPolicy.id !== "*" && policyCandidate.targetPolicy.id !== normalized
            ? policyCandidate.targetPolicy.id
            : rawTarget.trim();
    };
    const resolveTargetWithPeerIdentity = (resolvedUserId: string, rawTarget: string) => {
        const normalized = String(rawTarget || "").trim();
        if (!normalized) return "";
        const policyResolvedTarget = resolvePolicyTarget(normalized);
        const aliasInput = policyResolvedTarget !== normalized ? policyResolvedTarget : normalized;
        const aliasResolved = resolveNetworkAlias(upstreamAliasMap, aliasInput) || aliasInput;
        const topology = (config as any)?.topology;
        const topologyNodes = Array.isArray(topology?.nodes)
            ? topology.nodes.filter((node: any) => node && typeof node === "object" && !Array.isArray(node))
            : [];
        const peers = hub.getConnectedPeerProfiles(resolvedUserId).map((peer) => ({
            id: peer.id,
            label: peer.label,
            peerId: (peer as any).peerId || peer.id
        }));
        const resolution = resolvePeerIdentity(aliasResolved, {
            peers,
            aliases: upstreamAliasMap,
            topology: topologyNodes
        });
        return resolution?.peerId || aliasResolved;
    };
    return (message: any) => {
        if (!message || typeof message !== "object") return;
        const msg = message as Record<string, unknown>;
        const target = msg.targetId || msg.deviceId || msg.target || msg.to || msg.target_id;
        const resolvedUserId =
            typeof msg.userId === "string" && msg.userId.trim()
                ? (msg.userId as string).trim()
                : defaultUserId;
        if (!resolvedUserId) return;
        const normalizedRequestedTarget = String(target ?? "");
        const resolvedRequestedTarget = resolveTargetWithPeerIdentity(resolvedUserId, normalizedRequestedTarget.trim());
        const sourceForPolicy = resolveSourceForPolicy(msg, resolvedUserId);
        if (!sourceForPolicy.isKnown && sourceForPolicy.sourceId !== resolvedUserId) {
            app.log?.warn?.(
                {
                    source: sourceForPolicy.sourceId,
                    rawSource: msg.source || msg.sourceId || msg.from || msg.src || msg.suggestedSource || msg.routeSource || msg._routeSource,
                    target: resolvedRequestedTarget || "-",
                    userId: resolvedUserId
                },
                "[upstream] route denied by unknown source"
            );
            return;
        }
        if (normalizedRequestedTarget.trim()) {
            const policyDecision = resolveEndpointPolicyRoute(sourceForPolicy.sourceId, resolvedRequestedTarget, endpointPolicyMap);
            if (!policyDecision.allowed) {
                app.log?.warn?.(
                    {
                        source: sourceForPolicy.sourceId,
                        target: resolvedRequestedTarget,
                        reason: policyDecision.reason,
                        userId: resolvedUserId
                    },
                    "[upstream] route denied by endpoint policy"
                );
                return;
            }
        }

        const payload = msg.payload ?? msg.data ?? msg.body ?? msg;
        if (isTunnelDebug) {
            const payloadKeys = payload && typeof payload === "object"
                ? Object.keys(payload as Record<string, unknown>).join("|")
                : typeof payload;
            console.info(
                `[upstream] IN`,
                `userId=${resolvedUserId}`,
                    `from=${sourceForPolicy.sourceId}`,
                `target=${resolvedRequestedTarget ? resolvedRequestedTarget : "-"}`,
                `type=${String(msg.type || msg.action || "dispatch")}`,
                `kind=${payloadKeys}`
            );
        }
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

        if (typeof resolvedRequestedTarget === "string" && resolvedRequestedTarget.trim()) {
            const requestedTarget = resolvedRequestedTarget.trim();
            const resolvedTargetHint = resolveTunnelTarget(hub.getConnectedPeerProfiles(resolvedUserId), requestedTarget);
            const resolvedTarget = resolvedTargetHint?.profile.id || requestedTarget;
            const resolvedKind = resolvedTargetHint?.source;
            const delivered = hub.sendToDevice(resolvedUserId, resolvedTarget, routed);

            if (!delivered) {
                if (isTunnelDebug) {
                    console.warn(
                        `[upstream] target resolve failed`,
                        `userId=${resolvedUserId}`,
                        `requested=${requestedTarget}`,
                        `resolved=${resolvedTarget || "-"}`,
                        `kind=${resolvedKind || "-"}`,
                        `known=${hub.getConnectedPeerProfiles(resolvedUserId).map((entry) => `${entry.label}(${entry.id})`).join(",")}`
                    );
                }
                app.log?.warn?.(
                    {
                        userId: resolvedUserId,
                        target: resolvedRequestedTarget,
                        matchedLabel: resolvedTargetHint?.profile.label,
                        resolutionKind: resolvedKind,
                        resolvedTarget,
                        knownTargets: hub.getConnectedPeerProfiles(resolvedUserId).map((entry) => `${entry.label}(${entry.id})`),
                        payloadType: type
                    },
                    "[upstream] failed to route command to reverse target"
                );
            } else {
                app.log?.debug?.(
                    {
                        userId: resolvedUserId,
                        requestedTarget: requestedTarget,
                        resolvedTarget,
                        matchedLabel: resolvedTargetHint?.profile.label,
                        resolutionKind: resolvedKind,
                        payloadType: type,
                        knownTargets: hub.getConnectedPeerProfiles(resolvedUserId).map((entry) => `${entry.label}(${entry.id})`)
                    },
                    "[upstream] routed command to reverse target"
                );
                if (isTunnelDebug) {
                    console.info(
                        `[upstream] target resolved`,
                        `userId=${resolvedUserId}`,
                        `requested=${requestedTarget}`,
                        `resolved=${resolvedTarget}`,
                        `kind=${resolvedKind || "-"}`,
                        `delivered=${delivered}`
                    );
                }
            }
            app.log?.debug?.({
                delivered,
                target: resolvedRequestedTarget,
                userId: resolvedUserId,
                knownPeers: hub.getConnectedPeerProfiles(resolvedUserId).map((entry) => `${entry.label}(${entry.id})`)
            }, "[upstream] routed command to device");
            return;
        }

        hub.multicast(resolvedUserId, routed, namespace);
    };
};

const buildNetworkContext = (upstreamConnector: ReturnType<typeof startUpstreamPeerClient> | null) => {
    if (!upstreamConnector) return undefined;
    return {
        getUpstreamStatus: () => upstreamConnector.getStatus(),
        sendToUpstream: (payload: any) => upstreamConnector.send(payload),
        getNodeId: () => String(((config as any)?.upstream?.clientId || (config as any)?.upstream?.userId || "").trim() || ((config as any)?.upstream?.origin?.originId || ""))
            .trim() || null
    };
};

export const buildCoreServer = async (opts: { logger?: boolean; httpsOptions?: any } = {}): Promise<FastifyInstance> => {
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();

    const app = Fastify({
        logger: opts.logger ?? true,
        ...(httpsOptions ? { https: httpsOptions } : {})
    }) as unknown as FastifyInstance;

    const httpClient = createHttpClient(httpsOptions);
    setClipboardApp(app);
    setHttpClient(httpClient);
    setPythonApp(app);
    registerRoutes(app);
    await registerCoreApp(app);
    const wsHub = createWsServer(app);
    // Upstream connector: this node opens reverse sessions to an origin/gateway.
    const upstreamConnector = startUpstreamPeerClient(config as any, {
        onMessage: buildUpstreamRouter(app, wsHub, (config as any)?.upstream?.userId || "")
    });
    const networkContext = buildNetworkContext(upstreamConnector);
    if (upstreamConnector) {
        app.addHook("onClose", async () => {
            upstreamConnector.stop();
        });
        app.log?.info?.("Upstream peer bridge started");
    }

    const socketIoBridge = createSocketIoBridge(app, {
        networkContext: networkContext ? {
            sendToUpstream: networkContext.sendToUpstream,
            upstreamUserId: networkContext.getNodeId() || (config as any)?.upstream?.userId
        } : undefined
    });
    await registerOpsRoutes(app, wsHub, networkContext, socketIoBridge);
    registerApiFallback(app);

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

    const sharedHttpClient = createHttpClient(httpsOptions);
    setHttpClient(sharedHttpClient);
    registerRoutes(http);
    const primaryApp = httpsOptions ? https : http;
    setClipboardApp(primaryApp);
    setPythonApp(primaryApp);

    const fallbackUserId = String((config as any)?.upstream?.userId || "").trim();
    const httpWsHub = createWsServer(http);
    const httpWsHubs: WsHub[] = [httpWsHub];
    const unifiedHub = makeUnifiedWsHub(httpWsHubs);
    // Upstream connector: HTTP-side bootstrap also reuses outbound reverse transport.
    const upstreamConnector = startUpstreamPeerClient(config as any, {
        onMessage: buildUpstreamRouter(http, unifiedHub, fallbackUserId)
    });
    const networkContext = buildNetworkContext(upstreamConnector);

    await registerCoreApp(http);
    if (upstreamConnector) {
        http.addHook("onClose", async () => {
            upstreamConnector.stop();
        });
    }
    const httpSocketIoBridge = createSocketIoBridge(http, {
        networkContext: networkContext ? {
            sendToUpstream: networkContext.sendToUpstream,
            upstreamUserId: networkContext.getNodeId() || fallbackUserId
        } : undefined
    });
    await registerOpsRoutes(http, unifiedHub, networkContext, httpSocketIoBridge);
    registerApiFallback(http);

    if (!httpsOptions) return { http };
    const httpsWsHub = createWsServer(https);
    httpWsHubs.push(httpsWsHub);
    await registerCoreApp(https);
    registerRoutes(https);
    if (upstreamConnector) {
        https.addHook("onClose", async () => {
            upstreamConnector.stop();
        });
    }
    const httpsSocketIoBridge = createSocketIoBridge(https, {
        networkContext: networkContext ? {
            sendToUpstream: networkContext.sendToUpstream,
            upstreamUserId: networkContext.getNodeId() || fallbackUserId
        } : undefined
    });
    await registerOpsRoutes(https, unifiedHub, networkContext, httpsSocketIoBridge);
    registerApiFallback(https);

    return { http, https };
};

export const startCoreBackend = async (opts: { logger?: boolean; httpsOptions?: any } = {}): Promise<void> => {
    const args = parseCli(runtimeArgs());
    const httpsOptions = typeof opts.httpsOptions !== "undefined" ? opts.httpsOptions : await loadHttpsOptions();
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

    const { http, https } = await buildCoreServers({ logger: opts.logger ?? true, httpsOptions });

    if (httpEnabled) {
        const httpPort = typeof httpPortRaw === "undefined" ? await pickHttpPort(host) : Number(httpPortRaw);
        await http.listen({ port: httpPort, host });
        console.log(`[core-backend] listening on http://${host}:${httpPort}`);
    }
    if (!httpsEnabled) {
        console.log("[core-backend] HTTPS disabled: no valid certificates found or HTTPS disabled by env.");
    }
    if (httpsEnabled && https) {
        await https.listen({ port: httpsPort, host });
        console.log(`[core-backend] listening on https://${host}:${httpsPort}`);
    }

    startMouseFlushInterval();
    startClipboardPolling();
};

if (isMainModule(import.meta)) {
    startCoreBackend()
        .catch((err) => {
            console.error("[core-backend] failed to start", err);
            process.exit(1);
        });
}
