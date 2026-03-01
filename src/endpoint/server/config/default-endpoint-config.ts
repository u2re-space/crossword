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

    const legacyFlatKeys = [
        "portableCorePath",
        "portableEndpointPath",
        "portableTopologyPath",
        "portableRuntimePath",
        "portableRolesPath",
        "portableUpstreamPath"
    ];
    for (const key of legacyFlatKeys) pushModule(portableConfig[key]);

    return out;
};

const loadPortableConfig = () => {
    const candidates = [
        pickEnvStringLegacy("CWS_PORTABLE_CONFIG_PATH"),
        pickEnvStringLegacy("ENDPOINT_CONFIG_JSON_PATH"),
        pickEnvStringLegacy("PORTABLE_CONFIG_PATH"),
        path.resolve(process.cwd(), "portable.config.json"),
        path.resolve(__dirname, "../../portable.config.json"),
        path.resolve(__dirname, "../portable.config.json")
    ].filter(Boolean);

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
const portableEndpointDefaults = asRecord(
    portableConfig && typeof portableConfig === "object" &&
        "endpointDefaults" in portableConfig
        ? (portableConfig as Record<string, any>).endpointDefaults
        : undefined
) as
    | {
          roles?: unknown;
          upstream?: unknown;
      }
    | undefined;
const portableRuntimeDefaults = asRecord(
    portableConfig && typeof portableConfig === "object"
        ? ((portableConfig as Record<string, any>).endpointRuntimeDefaults ??
            (portableConfig as Record<string, any>).endpointRuntime ??
            (portableEndpointSection as Record<string, any>).runtime ??
            (portableCoreSection as Record<string, any>).runtime)
        : undefined
) as
    | {
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

const portableTopology = (portableConfig && typeof portableConfig === "object" && "endpointTopology" in portableConfig
    ? (portableConfig as Record<string, any>).endpointTopology
    : (portableConfig && typeof portableConfig === "object" && "topology" in portableConfig
        ? (portableConfig as Record<string, any>).topology
        : undefined) ) ||
    (portableEndpointSection as Record<string, any>).topology ||
    (portableCoreSection as Record<string, any>).topology;
const portableRoles = toStringArray(portableEndpointDefaults?.roles) ||
    toStringArray(portableCoreSection.roles) ||
    toStringArray(portableEndpointSection.roles);
const portableUpstream =
    (portableEndpointSection as Record<string, any>).upstream ||
    (portableCoreSection as Record<string, any>).upstream ||
    (portableEndpointDefaults as Record<string, any>).upstream ||
    {};
const portableUpstreamEndpoints = toStringArray((portableUpstream as Record<string, any>)?.endpoints) || toStringArray(FALLBACK_UPSTREAM_ENDPOINTS);
const portablePeers = toStringArray((portableRuntimeDefaults as Record<string, any>).peers) || toStringArray((portableEndpointSection as Record<string, any>).peers);
const portableBroadcastTargets = toStringArray((portableRuntimeDefaults as Record<string, any>).broadcastTargets) ||
    toStringArray((portableEndpointSection as Record<string, any>).broadcastTargets);
const portableClipboardPeerTargets = toStringArray((portableRuntimeDefaults as Record<string, any>).clipboardPeerTargets) ||
    toStringArray((portableEndpointSection as Record<string, any>).clipboardPeerTargets);
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
const portableTopologyConfig = (portableTopology && typeof portableTopology === "object")
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
    endpointUrl:
        typeof (portableUpstream as Record<string, any>)?.endpointUrl === "string" && (portableUpstream as Record<string, any>).endpointUrl.trim()
            ? (portableUpstream as Record<string, any>).endpointUrl
            : DEFAULT_UPSTREAM_ENDPOINTS[0],
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
