import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS } from "./config.ts";
import { fileURLToPath } from "node:url";
import { SETTINGS_FILE } from "../lib/paths.ts";
import { DEFAULT_CORE_ROLES, DEFAULT_UPSTREAM_ENDPOINTS, DEFAULT_ENDPOINT_UPSTREAM, DEFAULT_ENDPOINT_RUNTIME, DEFAULT_ENDPOINT_TOPOLOGY } from "./default-endpoint-config.ts";
import { parsePortableBoolean, parsePortableInteger, safeJsonParse, resolvePortablePayload, resolvePortableTextValue } from "../lib/parsing.ts";
import { pickEnvBoolLegacy, pickEnvNumberLegacy, pickEnvStringLegacy } from "../lib/env.ts";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePortableBoolean, parsePortableInteger, safeJsonParse } from "../lib/parsing.ts";
import { pickEnvStringLegacy } from "../lib/env.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_ROLES = ["endpoint", "server", "peer", "client", "node", "hub"] as const;
const FALLBACK_UPSTREAM_ENDPOINTS = ["https://45.147.121.152:8443/", "https://192.168.0.200:8443/"] as const;
const FALLBACK_UPSTREAM = {
    enabled: true,
    endpointUrl: FALLBACK_UPSTREAM_ENDPOINTS[0],
    userId: "",
    userKey: "",
    upstreamMasterKey: "",
    upstreamSigningPrivateKeyPem: "",
    upstreamPeerPublicKeyPem: "",
    deviceId: "L-192.168.0.200",
    namespace: "default",
    reconnectMs: 5000
} as const;

const FALLBACK_RUNTIME_DEFAULTS = {
    listenPort: 8443,
    httpPort: 8080,
    broadcastForceHttps: true,
    peers: ["100.81.105.5", "100.90.155.65", "192.168.0.196", "192.168.0.200", "192.168.0.110", "45.147.121.152"],
    broadcastTargets: [],
    clipboardPeerTargets: ["https:443", "https:8443", "http:8080", "http:80"],
    pollInterval: 100,
    httpTimeoutMs: 10000,
    secret: ""
};

const FALLBACK_TOPOLOGY = {
    enabled: true,
    nodes: [],
    links: []
} as const;

const toStringArray = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const list = value.map((item) => String(item ?? "").trim()).filter(Boolean);
    return list.length ? list : undefined;
};

const normalizeNumber = (value: unknown, fallback: number): number => {
    return parsePortableInteger(value) ?? fallback;
};

const asRecord = (value: unknown): Record<string, any> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, any>;
};

const readJson = (candidate: string): Record<string, any> | undefined => {
    try {
        const raw = fs.readFileSync(candidate, "utf-8");
        const parsed = safeJsonParse<Record<string, any>>(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, any>) : {};
    } catch {
        return undefined;
    }
};

const mergePortableConfigPayload = (base: Record<string, any>, patch?: Record<string, any>): Record<string, any> => {
    if (!patch) return { ...base };
    const result = { ...base };
    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
            result[key] = [...value];
            continue;
        }
        if (value && typeof value === "object" && typeof base?.[key] === "object" && !Array.isArray(base[key])) {
            result[key] = mergePortableConfigPayload(base[key], value as Record<string, any>);
            continue;
        }
        result[key] = value;
    }
    return result;
};

const collectPortableModules = (portableConfig: Record<string, any>, baseDir: string): string[] => {
    const out: string[] = [];
    const modulesValue = portableConfig.portableModules ?? portableConfig.configModules;
    const pushModule = (value: unknown) => {
        if (typeof value === "string" && value.trim()) {
            out.push(path.resolve(baseDir, value.trim()));
        }
        if (Array.isArray(value)) {
            for (const entry of value) {
                if (typeof entry === "string" && entry.trim()) {
                    out.push(path.resolve(baseDir, entry.trim()));
                }
            }
        }
    };

    if (Array.isArray(modulesValue)) {
        pushModule(modulesValue);
    } else if (typeof modulesValue === "string") {
        pushModule(modulesValue);
    } else if (modulesValue && typeof modulesValue === "object") {
        for (const rawPath of Object.values(modulesValue)) {
            pushModule(rawPath);
        }
    }

    const legacyModuleMap = asRecord(portableConfig.portableModulePaths);
    for (const rawPath of Object.values(legacyModuleMap)) {
        pushModule(rawPath);
    }

    const legacyFlatKeys = ["portableCorePath", "portableEndpointPath", "portableTopologyPath", "portableRuntimePath", "portableRolesPath", "portableUpstreamPath"];
    for (const key of legacyFlatKeys) pushModule(portableConfig[key]);

    return out;
};

const loadPortableConfig = () => {
    const candidates = [pickEnvStringLegacy("CWS_PORTABLE_CONFIG_PATH"), pickEnvStringLegacy("ENDPOINT_CONFIG_JSON_PATH"), pickEnvStringLegacy("PORTABLE_CONFIG_PATH"), path.resolve(process.cwd(), "portable.config.json"), path.resolve(__dirname, "../../portable.config.json"), path.resolve(__dirname, "../portable.config.json")].filter(Boolean);

    for (const candidate of candidates) {
        const baseDir = path.dirname(candidate);
        const base = readJson(candidate);
        if (!base || Object.keys(base).length === 0) continue;
        const merged = collectPortableModules(base, baseDir).reduce((seed, modulePath) => {
            const modulePayload = readJson(modulePath);
            return modulePayload ? mergePortableConfigPayload(seed, modulePayload) : seed;
        }, base);
        return merged;
    }

    return {};
};

const portableConfig = loadPortableConfig();
const portableCoreSection = asRecord(portableConfig && typeof portableConfig === "object" ? (portableConfig as Record<string, any>).core : undefined);
const portableEndpointSection = asRecord(portableConfig && typeof portableConfig === "object" ? (portableConfig as Record<string, any>).endpoint : undefined);
const portableEndpointDefaults = asRecord(portableConfig && typeof portableConfig === "object" && "endpointDefaults" in portableConfig ? (portableConfig as Record<string, any>).endpointDefaults : undefined) as
    | {
        roles?: unknown;
        upstream?: unknown;
    }
    | undefined;
const portableRuntimeDefaults = asRecord(portableConfig && typeof portableConfig === "object" ? ((portableConfig as Record<string, any>).endpointRuntimeDefaults ?? (portableConfig as Record<string, any>).endpointRuntime ?? (portableEndpointSection as Record<string, any>).runtime ?? (portableCoreSection as Record<string, any>).runtime) : undefined) as {
    listenPort?: unknown;
    httpPort?: unknown;
    broadcastForceHttps?: unknown;
    peers?: unknown;
    broadcastTargets?: unknown;
    clipboardPeerTargets?: unknown;
    pollInterval?: unknown;
    httpTimeoutMs?: unknown;
    secret?: unknown;
};

const portableTopology = (portableConfig && typeof portableConfig === "object" && "endpointTopology" in portableConfig ? (portableConfig as Record<string, any>).endpointTopology : portableConfig && typeof portableConfig === "object" && "topology" in portableConfig ? (portableConfig as Record<string, any>).topology : undefined) || (portableEndpointSection as Record<string, any>).topology || (portableCoreSection as Record<string, any>).topology;
const portableRoles = toStringArray(portableEndpointDefaults?.roles) || toStringArray(portableCoreSection.roles) || toStringArray(portableEndpointSection.roles);
const portableUpstream = (portableEndpointSection as Record<string, any>).upstream || (portableCoreSection as Record<string, any>).upstream || (portableEndpointDefaults as Record<string, any>).upstream || {};
const portableUpstreamEndpoints = toStringArray((portableUpstream as Record<string, any>)?.endpoints) || toStringArray(FALLBACK_UPSTREAM_ENDPOINTS);
const portablePeers = toStringArray((portableRuntimeDefaults as Record<string, any>).peers) || toStringArray((portableEndpointSection as Record<string, any>).peers);
const portableBroadcastTargets = toStringArray((portableRuntimeDefaults as Record<string, any>).broadcastTargets) || toStringArray((portableEndpointSection as Record<string, any>).broadcastTargets);
const portableClipboardPeerTargets = toStringArray((portableRuntimeDefaults as Record<string, any>).clipboardPeerTargets) || toStringArray((portableEndpointSection as Record<string, any>).clipboardPeerTargets);
const portableListenPort = (portableRuntimeDefaults as Record<string, any>)?.listenPort;
const portableHttpPort = (portableRuntimeDefaults as Record<string, any>)?.httpPort;
const portableBroadcastForceHttps = (portableRuntimeDefaults as Record<string, any>)?.broadcastForceHttps;
const portablePollInterval = (portableRuntimeDefaults as Record<string, any>)?.pollInterval;
const portableHttpTimeoutMs = (portableRuntimeDefaults as Record<string, any>)?.httpTimeoutMs;
const portableSecret = (portableRuntimeDefaults as Record<string, any>)?.secret;
const normalizeTopologyCollection = (value: unknown): unknown[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
};
const portableTopologyConfig =
    portableTopology && typeof portableTopology === "object"
        ? {
            enabled: parsePortableBoolean((portableTopology as Record<string, any>).enabled) ?? true,
            nodes: normalizeTopologyCollection((portableTopology as Record<string, any>).nodes),
            links: normalizeTopologyCollection((portableTopology as Record<string, any>).links)
        }
        : undefined;

export const DEFAULT_CORE_ROLES = [...(portableRoles || FALLBACK_ROLES)] as const;

export const DEFAULT_UPSTREAM_ENDPOINTS = [...(portableUpstreamEndpoints || FALLBACK_UPSTREAM_ENDPOINTS)] as const;

export const DEFAULT_ENDPOINT_UPSTREAM = {
    ...FALLBACK_UPSTREAM,
    ...(typeof portableUpstream === "object" && portableUpstream ? portableUpstream : {}),
    endpointUrl: typeof (portableUpstream as Record<string, any>)?.endpointUrl === "string" && (portableUpstream as Record<string, any>).endpointUrl.trim() ? (portableUpstream as Record<string, any>).endpointUrl : DEFAULT_UPSTREAM_ENDPOINTS[0],
    endpoints: DEFAULT_UPSTREAM_ENDPOINTS
};

export const DEFAULT_ENDPOINT_RUNTIME = {
    ...FALLBACK_RUNTIME_DEFAULTS,
    listenPort: normalizeNumber(portableListenPort, FALLBACK_RUNTIME_DEFAULTS.listenPort),
    httpPort: normalizeNumber(portableHttpPort, FALLBACK_RUNTIME_DEFAULTS.httpPort),
    broadcastForceHttps: parsePortableBoolean(portableBroadcastForceHttps) ?? FALLBACK_RUNTIME_DEFAULTS.broadcastForceHttps,
    peers: portablePeers || FALLBACK_RUNTIME_DEFAULTS.peers,
    broadcastTargets: portableBroadcastTargets || FALLBACK_RUNTIME_DEFAULTS.broadcastTargets,
    clipboardPeerTargets: portableClipboardPeerTargets || FALLBACK_RUNTIME_DEFAULTS.clipboardPeerTargets,
    pollInterval: normalizeNumber(portablePollInterval, FALLBACK_RUNTIME_DEFAULTS.pollInterval),
    httpTimeoutMs: normalizeNumber(portableHttpTimeoutMs, FALLBACK_RUNTIME_DEFAULTS.httpTimeoutMs),
    secret: typeof portableSecret === "string" ? portableSecret : FALLBACK_RUNTIME_DEFAULTS.secret
};

export const DEFAULT_ENDPOINT_TOPOLOGY = {
    ...FALLBACK_TOPOLOGY,
    ...(portableTopologyConfig || {})
};

type EndpointIdPolicy = {
    id: string;
    origins: string[];
    tokens: string[];
    forward: string;
    flags: {
        mobile?: boolean;
        gateway?: boolean;
        direct?: boolean;
    };
    allowedIncoming: string[];
    allowedOutcoming: string[];
};

type EndpointConfig = {
    listenPort?: number;
    httpPort?: number;
    broadcastForceHttps?: boolean;
    peers?: string[];
    broadcastTargets?: string[];
    https?: {
        enabled?: boolean;
        key?: string;
        cert?: string;
        ca?: string;
        keyFile?: string;
        keyPath?: string;
        certFile?: string;
        certPath?: string;
        caFile?: string;
        caPath?: string;
        requestClientCerts?: boolean;
        allowUntrustedClientCerts?: boolean;
    };
    networkAliases?: Record<string, string>;
    clipboardPeerTargets?: string[];
    topology?: {
        enabled?: boolean;
        nodes?: Array<Record<string, any>>;
        links?: Array<Record<string, any>>;
    };
    endpointIDs?: Record<string, EndpointIdPolicy>;
    pollInterval?: number;
    httpTimeoutMs?: number;
    secret?: string;
    roles?: string[];
    upstream?: {
        enabled?: boolean;
        mode?: "active" | "passive";
        origin?: {
            originId?: string;
            originHosts?: string[];
            originDomains?: string[];
            originMasks?: string[];
            surface?: string;
        };
        endpointUrl?: string;
        endpoints?: string[];
        userId?: string;
        userKey?: string;
        upstreamMasterKey?: string;
        upstreamSigningPrivateKeyPem?: string;
        upstreamPeerPublicKeyPem?: string;
        deviceId?: string;
        clientId?: string;
        namespace?: string;
        reconnectMs?: number;
    };
    ai?: Record<string, any>;
};

type PortableConfigSeed = {
    endpoint?: Record<string, any>;
    core?: Record<string, any>;
    network?: Record<string, any>;
    runtime?: Record<string, any>;
    endpointDefaults?: Record<string, any>;
    endpointRuntimeDefaults?: Record<string, any>;
    endpointTopology?: unknown;
    networkAliases?: unknown;
    networkAliasMap?: unknown;
    topology?: unknown;
    upstream?: unknown;
    roles?: unknown;
    peers?: unknown;
    broadcastTargets?: unknown;
    https?: unknown;
    clipboardPeerTargets?: unknown;
    listenPort?: unknown;
    httpPort?: unknown;
    broadcastForceHttps?: unknown;
    pollInterval?: unknown;
    httpTimeoutMs?: unknown;
    secret?: unknown;
    endpointIDs?: Record<string, any>;
};

const asRecord = (value: unknown): Record<string, any> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, any>;
};

const readJsonFile = (filePath: string): Record<string, any> | undefined => {
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = safeJsonParse<Record<string, any>>(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, any>) : undefined;
    } catch {
        return undefined;
    }
};

const resolvePortablePayloadWithBase = (value: unknown, baseDir: string, seen: Set<string> = new Set()): unknown => {
    return resolvePortablePayload(value, baseDir, seen);
};

const mergePortableConfigPayload = (base: Record<string, any>, patch?: Record<string, any>): Record<string, any> => {
    if (!patch) return { ...base };
    const result = { ...base };
    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
            result[key] = [...value];
            continue;
        }
        if (value && typeof value === "object" && typeof base?.[key] === "object" && !Array.isArray(base[key])) {
            result[key] = mergePortableConfigPayload(base[key], value as Record<string, any>);
            continue;
        }
        result[key] = value;
    }
    return result;
};

const collectPortableModules = (portableConfig: Record<string, any>, baseDir: string): string[] => {
    const out: string[] = [];
    const modulesValue = portableConfig.portableModules ?? portableConfig.configModules;
    const pushModule = (value: unknown) => {
        if (typeof value === "string" && value.trim()) out.push(path.resolve(baseDir, value.trim()));
        if (Array.isArray(value)) {
            for (const entry of value) {
                if (typeof entry === "string" && entry.trim()) out.push(path.resolve(baseDir, entry.trim()));
            }
        }
    };

    if (Array.isArray(modulesValue)) {
        pushModule(modulesValue);
    } else if (typeof modulesValue === "string") {
        pushModule(modulesValue);
    } else if (modulesValue && typeof modulesValue === "object") {
        for (const value of Object.values(modulesValue)) pushModule(value);
    }

    const legacyModuleMap = asRecord(portableConfig.portableModulePaths);
    for (const value of Object.values(legacyModuleMap)) pushModule(value);

    for (const key of ["portableCorePath", "portableEndpointPath", "portableTopologyPath", "portableRuntimePath", "portableRolesPath", "portableUpstreamPath"]) {
        pushModule((portableConfig as Record<string, any>)[key]);
    }

    return out;
};

const legacyPolicyForward = (value: unknown): string => {
    if (typeof value === "string") {
        const normalized = resolvePortableTextValue(value).trim();
        return normalized || "self";
    }
    if (Array.isArray(value)) {
        for (const entry of value) {
            if (typeof entry === "string") {
                const normalized = entry.trim();
                if (normalized) return normalized;
            }
            if (entry && typeof entry === "object") {
                const candidate = String((entry as Record<string, any>).id || (entry as Record<string, any>).target || "").trim();
                if (candidate) return candidate;
            }
        }
    }
    return "self";
};

const parseLegacyAllowedForwardList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((entry) => resolvePortableTextValue(String(entry || "")).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(/[;,]/)
            .map((entry) => resolvePortableTextValue(entry).trim())
            .filter(Boolean);
    }
    return [];
};

const normalizeLegacyEndpointIds = (value: unknown): Record<string, EndpointIdPolicy> => {
    const source = asRecord(value);
    const out: Record<string, EndpointIdPolicy> = {};
    for (const [rawPolicyId, rawPolicySource] of Object.entries(source)) {
        if (!rawPolicySource || typeof rawPolicySource !== "object") continue;
        const policyId = String(rawPolicyId || "")
            .trim()
            .toLowerCase();
        if (!policyId) continue;
        const policy = rawPolicySource as Record<string, unknown>;
        const legacyOutgoing = parseLegacyAllowedForwardList(policy.allowedOutgoing);
        const legacyForwards = parseLegacyAllowedForwardList(policy.allowedForwards);
        const allowedOutgoing = legacyOutgoing.length ? legacyOutgoing : legacyForwards.length ? legacyForwards : ["*"];
        const allowedIncoming = parseLegacyAllowedForwardList(policy.allowedIncoming);
        out[policyId] = normalizeEndpointIdPolicy(policyId, {
            origins: policy.origins,
            tokens: policy.tokens,
            forward: legacyPolicyForward(policy.forward),
            flags: policy.flags,
            allowedIncoming: allowedIncoming.length ? allowedIncoming : ["*"],
            allowedOutcoming: allowedOutgoing
        });
    }
    return out;
};

const loadLegacyEndpointIds = (): Record<string, any> => {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const cwd = process.cwd();
    const candidates = [
        pickEnvStringLegacy("CWS_CLIENTS_JSON_PATH"),
        pickEnvStringLegacy("ENDPOINT_CLIENTS_JSON_PATH"),
        pickEnvStringLegacy("CLIENTS_JSON_PATH"),
        pickEnvStringLegacy("CWS_GATEWAYS_JSON_PATH"),
        pickEnvStringLegacy("ENDPOINT_GATEWAYS_JSON_PATH"),
        pickEnvStringLegacy("GATEWAYS_JSON_PATH"),
        path.resolve(cwd, "./config/clients.json"),
        path.resolve(cwd, "./config/gateways.json"),
        path.resolve(moduleDir, "../config/clients.json"),
        path.resolve(moduleDir, "../config/gateways.json"),
        path.resolve(moduleDir, "../../config/clients.json"),
        path.resolve(moduleDir, "../../config/gateways.json")
    ].filter(Boolean) as string[];

    const merged: Record<string, EndpointIdPolicy> = {};
    for (const candidate of candidates) {
        const parsed = readJsonFile(candidate);
        if (!parsed) continue;
        const normalized = normalizeLegacyEndpointIds(parsed);
        Object.assign(merged, normalized);
    }
    return merged;
};

const legacyEndpointIDs = loadLegacyEndpointIds();

const collectPortableConfigSources = (): string[] => {
    const explicit = pickEnvStringLegacy("CWS_PORTABLE_CONFIG_PATH") || pickEnvStringLegacy("ENDPOINT_CONFIG_JSON_PATH") || pickEnvStringLegacy("PORTABLE_CONFIG_PATH");
    const cwd = process.cwd();
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));

    return [explicit, path.resolve(cwd, "portable.config.json"), path.resolve(moduleDir, "../../portable.config.json"), path.resolve(moduleDir, "../portable.config.json")].filter(Boolean) as string[];
};

const loadPortableEndpointSeed = (): PortableConfigSeed => {
    for (const candidate of collectPortableConfigSources()) {
        const base = readJsonFile(candidate);
        if (!base) continue;
        const merged = collectPortableModules(resolvePortablePayloadWithBase(base, path.dirname(candidate)) as Record<string, any>, path.dirname(candidate)).reduce(
            (seed, modulePath) => {
                const modulePayload = readJsonFile(modulePath);
                const resolvedPayload = modulePayload ? resolvePortablePayloadWithBase(modulePayload, path.dirname(modulePath)) : undefined;
                return resolvedPayload ? mergePortableConfigPayload(seed, resolvedPayload as Record<string, any>) : seed;
            },
            resolvePortablePayloadWithBase(base, path.dirname(candidate)) as Record<string, any>
        ) as Record<string, any>;
        const normalized = resolvePortablePayloadWithBase(merged, path.dirname(candidate)) as Record<string, any>;
        if (!normalized || !Object.keys(normalized).length) continue;
        const normalizedCore = asRecord(normalized.core);
        const normalizedNetwork = asRecord(normalized.network || normalizedCore.network);
        const endpointIDsFromCore = {
            ...asRecord(normalizedCore.endpointIDs),
            ...asRecord(normalizedCore.gateways),
            ...asRecord(normalized.endpointIDs)
        };
        return {
            endpoint: asRecord(normalized.endpoint),
            core: asRecord(normalized.core),
            network: normalizedNetwork,
            runtime: asRecord(normalized.runtime || normalized.endpointRuntimeDefaults || {}),
            endpointDefaults: asRecord(normalized.endpointDefaults),
            endpointRuntimeDefaults: asRecord(normalized.endpointRuntimeDefaults),
            endpointTopology: normalized.endpointTopology,
            networkAliases: normalized.networkAliases,
            networkAliasMap: normalized.networkAliasMap,
            topology: normalized.topology,
            upstream: normalized.upstream,
            roles: normalized.roles,
            peers: normalized.peers,
            broadcastTargets: normalized.broadcastTargets,
            clipboardPeerTargets: normalized.clipboardPeerTargets,
            listenPort: normalized.listenPort,
            httpPort: normalized.httpPort,
            broadcastForceHttps: normalized.broadcastForceHttps,
            pollInterval: normalized.pollInterval,
            httpTimeoutMs: normalized.httpTimeoutMs,
            secret: normalized.secret,
            endpointIDs: endpointIDsFromCore
        } as PortableConfigSeed;
    }
    return {};
};

const portableSeed: PortableConfigSeed = loadPortableEndpointSeed();

const defaultConfig = {
    // На каком порту слушаем входящие HTTP запросы
    listenPort: DEFAULT_ENDPOINT_RUNTIME.listenPort,

    // На каком порту слушаем входящие НЕ-HTTPS (HTTP) запросы (эндпоинты, Socket.IO)
    // Нужно для совместимости/простых клиентов в локальной сети: http://host:8080/clipboard
    httpPort: DEFAULT_ENDPOINT_RUNTIME.httpPort,
    // По умолчанию в broadcast пытаемся использовать HTTPS для портов 443/8443
    broadcastForceHttps: DEFAULT_ENDPOINT_RUNTIME.broadcastForceHttps,

    // Список получателей (URL/IP/host), куда рассылаем изменения клипборда.
    // Формат может быть URL или хост/IP; без схемы будут пробованы https и http варианты.
    peers: DEFAULT_ENDPOINT_RUNTIME.peers,
    // Список маршрутов/идентификаторов получателей для /api/network/dispatch.
    // Формат: id, deviceId, label или любой дополнительный токен цели.
    // Будет использован как implicit список при broadcast=true.
    broadcastTargets: [...DEFAULT_ENDPOINT_RUNTIME.broadcastTargets],
    // Список вариантов схема:порт, которые пробуются для peers без явного порта/схемы.
    // Формат: "https:443", "https:8443", "http:8080", "http:80"
    clipboardPeerTargets: [...DEFAULT_ENDPOINT_RUNTIME.clipboardPeerTargets],

    // Интервал опроса системного буфера (мс)
    pollInterval: DEFAULT_ENDPOINT_RUNTIME.pollInterval,

    // Таймаут для исходящих HTTP запросов к peers (мс)
    // 3000мс часто мало для мобильных устройств/спящих девайсов/первого пробуждения сети.
    httpTimeoutMs: DEFAULT_ENDPOINT_RUNTIME.httpTimeoutMs,

    // Простейшая защита: токен (по желанию, можно оставить пустым)
    secret: DEFAULT_ENDPOINT_RUNTIME.secret,

    // Роли/режимы этого узла:
    // - endpoint: full endpoint behavior
    // - server: run local HTTP/HTTPS endpoints and WS/Socket.IO bridge
    // - client: connect as upstream connector (reverse initiator) to an upstream GATEWAY/ORIGIN
    // - peer: participate as a peer device (reverse dispatch target)
    // - hub: act as upstream relay participant and/or origin/gateway role
    // - node: generic aggregate role (server+client+peer)
    roles: [...DEFAULT_CORE_ROLES],

    // Upstream tunnel-through / be-as-device settings.
    // Connector/Client roles:
    // - active|keepalive (default): opens outbound reverse WS и держит keepalive (CWS_UPSTREAM_ENABLED + CWS_UPSTREAM_MODE=active)
    // - passive: no outbound WS, endpoint only consumes direct private/local/gateway traffic
    // Gateway/Origin (куда подключается) на своей стороне выступает как reverse receiver и проксирует между peer-клиентами.
    // Когда active: endpoint откроет reverse WS на gateway-узел.
    upstream: {
        ...(DEFAULT_SETTINGS.core?.upstream || {}),
        ...DEFAULT_ENDPOINT_UPSTREAM,
        // Основные адреса для hub/server/endpoint подключения:
        // 1) внешний endpoint hub (дефолт)
        // 2) локальный fallback для LAN
        endpoints: [...DEFAULT_UPSTREAM_ENDPOINTS],
        endpointUrl: DEFAULT_ENDPOINT_UPSTREAM.endpointUrl
    },
    topology: {
        ...DEFAULT_ENDPOINT_TOPOLOGY
    },
    endpointIDs: {}
};

const getConfigSources = (): string[] => {
    const explicit = pickEnvStringLegacy("CWS_CONFIG_JSON_PATH") || pickEnvStringLegacy("ENDPOINT_CONFIG_JSON_PATH");
    const cwd = process.cwd();
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const npmPackageJson = pickEnvStringLegacy("npm_package_json");
    const npmPackageRoot = npmPackageJson ? path.dirname(npmPackageJson) : undefined;

    return [
        explicit,
        path.resolve(cwd, ".endpoint.config.json"),
        path.resolve(cwd, ".config.endpoint.json"),
        path.resolve(cwd, "data", "config.json"),
        path.resolve(cwd, ".data", "config.json"),
        path.resolve(moduleDir, "admin-config.json"),
        npmPackageRoot ? path.resolve(npmPackageRoot, "data", "config.json") : undefined,
        npmPackageRoot ? path.resolve(npmPackageRoot, ".data", "config.json") : undefined,
        path.resolve(SETTINGS_FILE),
        path.resolve(moduleDir, "./runtime.json"),
        path.resolve(moduleDir, "../.endpoint.config.json"),
        path.resolve(moduleDir, "../..", ".endpoint.config.json"),
        path.resolve(moduleDir, "../../.endpoint.config.json"),
        path.resolve(moduleDir, "../../../.endpoint.config.json")
    ].filter(Boolean) as string[];
};

const loadJsonFile = (filePath: string): Record<string, any> | undefined => {
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return safeJsonParse<Record<string, any>>(raw);
    } catch {
        return undefined;
    }
};

const normalizeUrlList = (raw: unknown): string[] | undefined => {
    if (!Array.isArray(raw)) return undefined;
    const items = raw.map((v) => String(v ?? "").trim()).filter(Boolean);
    return items.length ? items : undefined;
};

const normalizeOptionalUrlList = (raw: unknown): string[] | undefined => {
    if (Array.isArray(raw)) return normalizeUrlList(raw);
    if (typeof raw === "string") {
        const items = raw
            .split(/[;,]/)
            .map((entry) => entry.trim())
            .filter(Boolean);
        return items.length ? items : undefined;
    }
    return undefined;
};

const normalizePeerTargets = (raw: unknown): string[] | undefined => {
    if (Array.isArray(raw)) {
        const list = raw.map((v) => String(v ?? "").trim()).filter(Boolean);
        return list.length ? list : undefined;
    }
    if (typeof raw !== "string") return undefined;
    const list = raw
        .split(/[;,]/)
        .map((v) => v.trim())
        .filter(Boolean);
    return list.length ? list : undefined;
};

const normalizePeerSource = (value: unknown): string[] | undefined => {
    if (typeof value !== "string") return undefined;
    const split = value
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    return split.length ? split : undefined;
};

const normalizeOriginCollection = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    if (typeof value === "string")
        return value
            .split(/[;,]/)
            .map((entry) => entry.trim())
            .filter(Boolean);
    return [];
};

const normalizeOriginConfig = (value: unknown): Record<string, any> | undefined => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const source = value as Record<string, any>;
    const normalized: Record<string, any> = {
        originId: typeof source.originId === "string" ? source.originId.trim() : "",
        surface: typeof source.surface === "string" ? source.surface.trim().toLowerCase() : "external",
        originHosts: normalizeOriginCollection(source.originHosts || source.hosts || source.host),
        originDomains: normalizeOriginCollection(source.originDomains || source.domains || source.domain),
        originMasks: normalizeOriginCollection(source.originMasks || source.masks || source.mask)
    };
    if (!normalized.originId) delete normalized.originId;
    if (!normalized.surface) normalized.surface = "external";
    return normalized;
};

const normalizeTextField = (value: unknown, fallback: string): string => {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const normalizeAliasKey = (value: string): string => value.trim().toLowerCase();
const normalizeAliasTarget = (value: string): string => value.trim();

const normalizeAliasEntries = (raw: unknown): Array<[string, string]> => {
    const out: Array<[string, string]> = [];
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return out;
        try {
            const parsed = safeJsonParse<Record<string, any>>(trimmed);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                for (const [rawAlias, rawTarget] of Object.entries(parsed as Record<string, unknown>)) {
                    const alias = normalizeAliasKey(String(rawAlias || ""));
                    const target = normalizeAliasTarget(String(rawTarget || ""));
                    if (alias && target) out.push([alias, target]);
                }
                return out;
            }
        } catch {
            // fallthrough to text parser
        }
        const parts = trimmed.split(/[;,]/);
        for (const part of parts) {
            const idxEq = part.indexOf("=");
            const idxColon = part.indexOf(":");
            const idx = idxEq >= 0 && (idxColon < 0 || idxEq < idxColon) ? idxEq : idxColon;
            if (idx <= 0) continue;
            const alias = normalizeAliasKey(part.slice(0, idx));
            const target = normalizeAliasTarget(part.slice(idx + 1));
            if (alias && target) out.push([alias, target]);
        }
        return out;
    }

    if (Array.isArray(raw)) {
        for (const row of raw) {
            if (typeof row === "string") {
                const idxEq = row.indexOf("=");
                const idxColon = row.indexOf(":");
                const idx = idxEq >= 0 && (idxColon < 0 || idxEq < idxColon) ? idxEq : idxColon;
                if (idx <= 0) continue;
                const alias = normalizeAliasKey(row.slice(0, idx));
                const target = normalizeAliasTarget(row.slice(idx + 1));
                if (alias && target) out.push([alias, target]);
                continue;
            }
            if (row && typeof row === "object") {
                const entry = row as Record<string, unknown>;
                const alias = normalizeAliasKey(String(entry.alias || entry.id || ""));
                const target = normalizeAliasTarget(String(entry.target || ""));
                if (alias && target) out.push([alias, target]);
            }
        }
        return out;
    }

    if (raw && typeof raw === "object") {
        for (const [aliasKey, rawTarget] of Object.entries(raw as Record<string, unknown>)) {
            const alias = normalizeAliasKey(aliasKey);
            const target = normalizeAliasTarget(String(rawTarget || ""));
            if (alias && target) out.push([alias, target]);
        }
    }

    return out;
};

const normalizeNetworkAliases = (raw: unknown): Record<string, string> => {
    const entries = normalizeAliasEntries(raw);
    const out: Record<string, string> = {};
    for (const [alias, target] of entries) out[alias] = target;
    return out;
};

const normalizeTopologyConfig = (
    raw: unknown
): {
    enabled: boolean;
    nodes: Array<Record<string, any>>;
    links: Array<Record<string, any>>;
} => {
    const topology = (raw && typeof raw === "object" ? (raw as Record<string, any>) : {}) as Record<string, any>;
    const enabledRaw = topology.enabled;
    const enabled = typeof enabledRaw === "boolean" ? enabledRaw : true;
    const nodes = Array.isArray(topology.nodes) ? topology.nodes.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => item as Record<string, any>) : [];
    const links = Array.isArray(topology.links) ? topology.links.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => item as Record<string, any>) : [];
    return {
        enabled,
        nodes,
        links
    };
};

function normalizeEndpointPolicyList(raw: unknown, preserveEmpty = true): string[] {
    const normalizeToken = (value: string): string => {
        const normalized = resolvePortableTextValue(String(value || ""))
            .trim()
            .toLowerCase();
        return normalized.startsWith("{") && normalized.endsWith("}") ? normalized.slice(1, -1).trim() : normalized;
    };
    if (raw === undefined) return preserveEmpty ? ["*"] : [];
    if (Array.isArray(raw)) {
        const list = raw.map((entry) => normalizeToken(String(entry || ""))).filter(Boolean);
        return list.length ? list : preserveEmpty ? [] : ["*"];
    }
    if (typeof raw === "string") {
        const list = raw
            .split(/[;,]/)
            .map((entry) => normalizeToken(entry))
            .filter(Boolean);
        return list.length ? list : preserveEmpty ? [] : ["*"];
    }
    if (raw == null) return preserveEmpty ? ["*"] : [];
    if (raw === true) return ["*"];
    if (raw === false) return [];
    return preserveEmpty ? ["*"] : [];
}

function normalizeEndpointIdPolicy(policyId: string, source: unknown): EndpointIdPolicy {
    const raw = source && typeof source === "object" ? (source as Record<string, unknown>) : {};
    const normalizedId = String(policyId || "")
        .trim()
        .toLowerCase();
    const flags = raw.flags && typeof raw.flags === "object" ? (raw.flags as Record<string, unknown>) : {};
    const forwardRaw = raw.forward;
    const allowedOutgoingRaw = (raw as Record<string, unknown>).allowedOutcoming ?? (raw as Record<string, unknown>).allowedOutgoing ?? (raw as Record<string, unknown>).allowedForwards;
    return {
        id: normalizedId,
        origins: normalizeEndpointPolicyList(raw.origins, true),
        tokens: normalizeEndpointPolicyList(raw.tokens, false),
        forward: legacyPolicyForward(forwardRaw),
        flags: {
            mobile: typeof flags.mobile === "boolean" ? flags.mobile : undefined,
            gateway: typeof flags.gateway === "boolean" ? flags.gateway : undefined,
            direct: typeof flags.direct === "boolean" ? flags.direct : undefined
        },
        allowedIncoming: normalizeEndpointPolicyList(raw.allowedIncoming, true),
        allowedOutcoming: normalizeEndpointPolicyList(allowedOutgoingRaw, true)
    };
}

const normalizeEndpointIds = (raw: unknown): Record<string, EndpointIdPolicy> => {
    const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const out: Record<string, EndpointIdPolicy> = {};
    for (const [policyId, policySource] of Object.entries(source)) {
        const normalizedId = String(policyId || "")
            .trim()
            .toLowerCase();
        if (!normalizedId) continue;
        out[normalizedId] = normalizeEndpointIdPolicy(normalizedId, policySource);
    }
    return out;
};

const mergeEndpointPolicies = (...sources: Array<Record<string, any> | undefined>): Record<string, EndpointIdPolicy> => {
    const merged: Record<string, EndpointIdPolicy> = {};
    for (const source of sources) {
        if (!source) continue;
        const normalized = normalizeEndpointIds(source);
        Object.assign(merged, normalized);
    }
    return merged;
};

const sanitizeConfig = (value: Record<string, any>): EndpointConfig => {
    const source = value && typeof value === "object" ? value : {};
    const coreSource = source.core && typeof source.core === "object" ? (source.core as Record<string, any>) : {};
    const aiSource = source.ai && typeof source.ai === "object" ? (source.ai as Record<string, any>) : {};
    const seedCore = asRecord(portableSeed.core);
    const seedEndpoint = asRecord(portableSeed.endpoint);
    const seedRuntime = asRecord(portableSeed.runtime);
    const seedEndpointDefaults = asRecord(portableSeed.endpointDefaults);
    const seedTopology = asRecord(portableSeed.topology);
    const seedEndpointTopology = asRecord(portableSeed.endpointTopology as unknown as Record<string, any>);
    const seedEndpointIDs = asRecord(portableSeed.endpointIDs || seedCore.endpointIDs || {});
    const seedNetwork = asRecord(portableSeed.network);
    const coreNetwork = asRecord(coreSource.network);
    const sourceNetwork = asRecord((source as Record<string, any>).network);
    const seedNetworkEndpoints = normalizeOptionalUrlList(sourceNetwork.endpoints || coreNetwork.endpoints || seedNetwork.endpoints);
    const seedUpstream = asRecord(seedCore.upstream || seedEndpoint.upstream || seedEndpointDefaults.upstream || {});
    const seedUpstreamWithNetwork = {
        ...seedUpstream,
        ...(seedNetworkEndpoints && !Array.isArray(seedUpstream.endpoints) ? { endpoints: seedNetworkEndpoints } : {})
    };

    const seedEndpointConfig = {
        ...seedEndpointDefaults,
        ...seedRuntime,
        ...seedEndpoint
    };

    const mergedUpstream = {
        ...defaultConfig.upstream,
        ...seedUpstreamWithNetwork,
        ...(coreSource.upstream as Record<string, any>),
        ...(source.core?.upstream as Record<string, any>),
        ...(source.upstream as Record<string, any>)
    };

    const mergedUpstreamWithFallback = {
        ...mergedUpstream,
        origin: normalizeOriginConfig((coreSource as Record<string, any>).upstream?.origin || (source as Record<string, any>).upstream?.origin || (source.core?.upstream as Record<string, any>)?.origin),
        userId: normalizeTextField(mergedUpstream.userId, normalizeTextField((defaultConfig.upstream as Record<string, any>).userId, "")),
        userKey: normalizeTextField(mergedUpstream.userKey, normalizeTextField((defaultConfig.upstream as Record<string, any>).userKey, "")),
        endpoints: normalizeUrlList(coreSource.upstream?.endpoints || source.core?.upstream?.endpoints || source.upstream?.endpoints) ?? normalizeUrlList(mergedUpstream.endpoints) ?? []
    };

    const mergedTopologySource = {
        ...seedTopology,
        ...seedEndpointTopology,
        ...(coreSource.topology as Record<string, any>),
        ...(source.core?.topology as Record<string, any>),
        ...(source.topology as Record<string, any>)
    };
    const mergedTopology = normalizeTopologyConfig(mergedTopologySource);

    if (!mergedUpstreamWithFallback.endpointUrl && mergedUpstreamWithFallback.endpoints?.length) {
        mergedUpstreamWithFallback.endpointUrl = mergedUpstreamWithFallback.endpoints[0];
    }

    const envPeers = normalizePeerSource(pickEnvStringLegacy("CWS_PEERS") || pickEnvStringLegacy("CLIPBOARD_PEERS") || "");
    const envRoles = (() => {
        const raw = pickEnvStringLegacy("CWS_ROLES");
        if (!raw) return undefined;
        if (typeof raw === "string") {
            const list = raw
                .split(/[;,]/)
                .map((entry) => entry.trim())
                .filter(Boolean);
            return list.length ? list : undefined;
        }
        return undefined;
    })();
    const envBroadcastForceHttps = pickEnvBoolLegacy("CWS_BROADCAST_FORCE_HTTPS");
    const envHttpsEnabled = parsePortableBoolean(pickEnvStringLegacy("CWS_HTTPS_ENABLED") ?? pickEnvStringLegacy("HTTPS_ENABLED"));
    const envHttpsKey = pickEnvStringLegacy("CWS_HTTPS_KEY") || pickEnvStringLegacy("CWS_HTTPS_KEY_FILE") || pickEnvStringLegacy("HTTPS_KEY") || pickEnvStringLegacy("HTTPS_KEY_FILE");
    const envHttpsCert = pickEnvStringLegacy("CWS_HTTPS_CERT") || pickEnvStringLegacy("CWS_HTTPS_CERT_FILE") || pickEnvStringLegacy("HTTPS_CERT") || pickEnvStringLegacy("HTTPS_CERT_FILE");
    const envHttpsCa = pickEnvStringLegacy("CWS_HTTPS_CA") || pickEnvStringLegacy("CWS_HTTPS_CA_FILE") || pickEnvStringLegacy("HTTPS_CA") || pickEnvStringLegacy("HTTPS_CA_FILE");
    const envRequestClientCerts = pickEnvBoolLegacy("CWS_HTTPS_REQUEST_CLIENT_CERTS");
    const envAllowUntrusted = pickEnvBoolLegacy("CWS_HTTPS_ALLOW_UNTRUSTED_CLIENT_CERTS");
    const envNetworkAliases = pickEnvStringLegacy("CWS_NETWORK_ALIAS_MAP") || pickEnvStringLegacy("CWS_NETWORK_ALIASES") || pickEnvStringLegacy("NETWORK_ALIAS_MAP") || pickEnvStringLegacy("NETWORK_ALIASES");
    const envBroadcastTargets = pickEnvStringLegacy("CWS_BROADCAST_TARGETS");
    const envClipboardPeerTargets = pickEnvStringLegacy("CWS_CLIPBOARD_PEER_TARGETS") || pickEnvStringLegacy("CLIPBOARD_PEER_TARGETS");
    const envListenPort = pickEnvNumberLegacy("CWS_LISTEN_PORT");
    const envHttpPort = pickEnvNumberLegacy("CWS_HTTP_PORT");
    const envPollInterval = pickEnvNumberLegacy("CWS_POLL_INTERVAL");
    const envHttpTimeoutMs = pickEnvNumberLegacy("CWS_HTTP_TIMEOUT_MS");
    const envSecret = pickEnvStringLegacy("CWS_SECRET");
    const sourceHttps = asRecord(source.https);
    const networkSourceHttps = asRecord(sourceNetwork.https);
    const coreSourceHttps = asRecord(coreSource.https);
    const seedHttps = asRecord(seedEndpointConfig.https || seedEndpointDefaults.https || (source as Record<string, any>).https || coreSource.https || sourceNetwork.https || seedNetwork.https || seedCore.https);

    return {
        ...(defaultConfig as Record<string, any>),
        ...source,
        ...coreSource,
        networkAliases: normalizeNetworkAliases(source.networkAliases ?? source.networkAliasMap ?? envNetworkAliases ?? seedEndpointConfig.networkAliases ?? seedEndpointConfig.networkAliasMap ?? (coreSource as Record<string, any>).networkAliases ?? (coreSource as Record<string, any>).networkAliasMap),
        peers: normalizeUrlList(source.peers ?? coreSource.peers ?? sourceNetwork.peers ?? coreNetwork.peers ?? seedNetwork.peers ?? seedEndpointConfig.peers ?? envPeers) ?? defaultConfig.peers,
        broadcastTargets: normalizeUrlList(source.broadcastTargets ?? coreSource.broadcastTargets ?? sourceNetwork.broadcastTargets ?? coreNetwork.broadcastTargets ?? seedNetwork.broadcastTargets ?? seedEndpointConfig.broadcastTargets ?? envBroadcastTargets) ?? defaultConfig.broadcastTargets,
        clipboardPeerTargets: normalizePeerTargets(source.clipboardPeerTargets ?? coreSource.clipboardPeerTargets ?? sourceNetwork.clipboardPeerTargets ?? coreNetwork.clipboardPeerTargets ?? seedNetwork.clipboardPeerTargets ?? seedEndpointConfig.clipboardPeerTargets ?? (seedEndpointDefaults as Record<string, any>).clipboardPeerTargets ?? envClipboardPeerTargets) ?? defaultConfig.clipboardPeerTargets,
        listenPort: parsePortableInteger(envListenPort) ?? source.listenPort ?? coreSource.listenPort ?? sourceNetwork.listenPort ?? coreNetwork.listenPort ?? seedEndpointConfig.listenPort ?? defaultConfig.listenPort,
        httpPort: parsePortableInteger(envHttpPort) ?? source.httpPort ?? coreSource.httpPort ?? sourceNetwork.httpPort ?? coreNetwork.httpPort ?? seedEndpointConfig.httpPort ?? defaultConfig.httpPort,
        broadcastForceHttps: envBroadcastForceHttps ?? source.broadcastForceHttps ?? coreSource.broadcastForceHttps ?? sourceNetwork.broadcastForceHttps ?? coreNetwork.broadcastForceHttps ?? seedEndpointConfig.broadcastForceHttps ?? defaultConfig.broadcastForceHttps,
        https: {
            ...(seedHttps ?? {}),
            ...(sourceHttps ?? {}),
            ...(coreSourceHttps ?? {}),
            ...(networkSourceHttps ?? {}),
            ...(envHttpsEnabled !== undefined ? { enabled: envHttpsEnabled } : {}),
            ...(envHttpsKey ? { key: envHttpsKey } : {}),
            ...(envHttpsCert ? { cert: envHttpsCert } : {}),
            ...(envHttpsCa ? { ca: envHttpsCa } : {}),
            ...(envRequestClientCerts !== undefined ? { requestClientCerts: envRequestClientCerts } : {}),
            ...(envAllowUntrusted !== undefined ? { allowUntrustedClientCerts: envAllowUntrusted } : {})
        },
        pollInterval: parsePortableInteger(envPollInterval) ?? source.pollInterval ?? sourceNetwork.pollInterval ?? coreNetwork.pollInterval ?? seedEndpointConfig.pollInterval ?? defaultConfig.pollInterval,
        httpTimeoutMs: parsePortableInteger(envHttpTimeoutMs) ?? source.httpTimeoutMs ?? sourceNetwork.httpTimeoutMs ?? coreNetwork.httpTimeoutMs ?? seedEndpointConfig.httpTimeoutMs ?? defaultConfig.httpTimeoutMs,
        secret: envSecret || (source.secret ?? sourceNetwork.secret ?? coreNetwork.secret ?? seedEndpointConfig.secret ?? defaultConfig.secret),
        roles: Array.isArray(coreSource.roles) ? coreSource.roles : Array.isArray(source.roles) ? source.roles : Array.isArray(seedEndpointConfig.roles) ? seedEndpointConfig.roles : Array.isArray(seedEndpoint.roles) ? seedEndpoint.roles : envRoles ? envRoles : defaultConfig.roles,
        upstream: mergedUpstreamWithFallback,
        topology: {
            ...mergedTopology,
            ...normalizeTopologyConfig(mergedTopology)
        },
        endpointIDs: mergeEndpointPolicies(seedEndpointIDs, legacyEndpointIDs, coreSource.endpointIDs as Record<string, any>, source.core?.endpointIDs as Record<string, any>, source.endpointIDs as Record<string, any>),
        ai: {
            ...(defaultConfig as Record<string, any>).ai,
            ...aiSource,
            ...(source.ai as Record<string, any>)
        }
    };
};

const discoverConfig = (): EndpointConfig => {
    for (const candidate of getConfigSources()) {
        const loaded = loadJsonFile(candidate);
        if (loaded && typeof loaded === "object" && !Array.isArray(loaded)) {
            return sanitizeConfig(loaded);
        }
    }
    return sanitizeConfig(defaultConfig);
};

export default discoverConfig() as Record<string, any>;

import { readFile, writeFile } from "node:fs/promises";
import { SETTINGS_FILE, ensureDataDirs } from "../lib/paths.ts";
import { DEFAULT_CORE_ROLES, DEFAULT_ENDPOINT_TOPOLOGY, DEFAULT_ENDPOINT_UPSTREAM } from "./default-endpoint-config.ts";
import { safeJsonParse } from "../lib/parsing.ts";

export type CustomInstruction = {
    id: string;
    instruction: string;
};

export type Settings = {
    core: CoreSettings;
    ai: AiSettings;
    webdav: WebdavSettings;
    timeline: TimelineSettings;
    appearance: AppearanceSettings;
    speech: SpeechSettings;
    grid: GridSettings;
};

export type AppSettings = Omit<Settings, "core">;

export interface CoreSettings {
    mode?: "native" | "web" | "desktop" | "mobile" | "server" | "daemon" | "client" | "daemon-client" | "endpoint";
    roles?: string[];
    upstream?: {
        enabled?: boolean;
        mode?: "active" | "passive";
        origin?: {
            originId?: string;
            originHosts?: string[];
            originDomains?: string[];
            originMasks?: string[];
            surface?: string;
        };
        endpointUrl?: string;
        userId?: string;
        userKey?: string;
        upstreamMasterKey?: string;
        upstreamSigningPrivateKeyPem?: string;
        upstreamPeerPublicKeyPem?: string;
        deviceId?: string;
        clientId?: string;
        namespace?: string;
        reconnectMs?: number;
    };
    topology?: {
        enabled?: boolean;
        nodes?: Array<Record<string, any>>;
        links?: Array<Record<string, any>>;
    };
    endpointIDs?: Record<string, Record<string, any>>;
}

export interface AiSettings {
    customInstructions?: CustomInstruction[];
    activeInstructionId?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    customModel?: string;
    mcp?: Array<{
        id?: string;
        serverLabel?: string;
        origin?: string;
    }>;
}

export interface WebdavSettings {
    url?: string;
    username?: string;
    password?: string;
    token?: string;
}

export interface TimelineSettings {
    enabled?: boolean;
}

export interface AppearanceSettings {
    theme?: string;
    language?: string;
}

export interface SpeechSettings {
    voice?: string;
}

export interface GridSettings {
    columns?: number;
    rows?: number;
}

export const DEFAULT_SETTINGS: Settings = {
    core: {
        roles: [...DEFAULT_CORE_ROLES],
        topology: {
            ...DEFAULT_ENDPOINT_TOPOLOGY
        },
        upstream: {
            ...DEFAULT_ENDPOINT_UPSTREAM
        }
    },
    ai: { customInstructions: [], activeInstructionId: "" },
    webdav: { url: "", username: undefined, password: undefined },
    timeline: { enabled: false },
    appearance: { theme: "", language: "" },
    speech: { voice: "" },
    grid: { columns: 0, rows: 0 }
};

export const mergeSettings = (current: Settings, patch: Partial<Settings>): Settings => ({
    core: {
        ...(DEFAULT_SETTINGS.core || {}),
        ...(current.core || {}),
        ...(patch.core || {})
    },
    ai: {
        ...(DEFAULT_SETTINGS.ai || {}),
        ...(current.ai || {}),
        ...(patch.ai || {})
    },
    webdav: {
        ...(DEFAULT_SETTINGS.webdav || {}),
        ...(current.webdav || {}),
        ...(patch.webdav || {})
    },
    timeline: {
        ...(DEFAULT_SETTINGS.timeline || {}),
        ...(current.timeline || {}),
        ...(patch.timeline || {})
    },
    appearance: {
        ...(DEFAULT_SETTINGS.appearance || {}),
        ...(current.appearance || {}),
        ...(patch.appearance || {})
    },
    speech: {
        ...(DEFAULT_SETTINGS.speech || {}),
        ...(current.speech || {}),
        ...(patch.speech || {})
    },
    grid: {
        ...(DEFAULT_SETTINGS.grid || {}),
        ...(current.grid || {}),
        ...(patch.grid || {})
    }
});

export const loadJson = async <T>(filePath: string, fallback: T): Promise<T> => {
    try {
        const raw = await readFile(filePath, "utf-8");
        return safeJsonParse<T>(raw, fallback);
    } catch {
        return fallback;
    }
};

export const readCoreSettings = async (): Promise<Settings> => {
    const parsed = await loadJson<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS);
    return mergeSettings(DEFAULT_SETTINGS, parsed);
};

export const writeCoreSettings = async (patch: Partial<Settings>): Promise<Settings> => {
    await ensureDataDirs();
    const current = await readCoreSettings();
    const next = mergeSettings(current, patch);
    await writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf-8");
    return next;
};
