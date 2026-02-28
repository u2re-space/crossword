import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        if (value.trim() === "") return fallback;
        if (["true", "1", "yes"].includes(value.trim().toLowerCase())) return true;
        if (["false", "0", "no"].includes(value.trim().toLowerCase())) return false;
    }
    return fallback;
};

const loadPortableConfig = () => {
    const candidates = [
        process.env.PORTABLE_CONFIG_PATH,
        path.resolve(process.cwd(), "portable.config.json"),
        path.resolve(__dirname, "../../portable.config.json"),
        path.resolve(__dirname, "../portable.config.json")
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            const raw = fs.readFileSync(candidate, "utf-8");
            return JSON.parse(raw);
        } catch {
            // ignore and try next
        }
    }
    return {};
};

const portableConfig = loadPortableConfig();
const portableEndpointDefaults = (portableConfig && typeof portableConfig === "object" && "endpointDefaults" in portableConfig ? portableConfig.endpointDefaults : undefined) as
    | {
          roles?: unknown;
          upstream?: unknown;
      }
    | undefined;
const portableRuntimeDefaults = (portableConfig && typeof portableConfig === "object" && "endpointRuntimeDefaults" in portableConfig ? portableConfig.endpointRuntimeDefaults : undefined) as
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
      }
    | undefined;

const portableRoles = toStringArray(portableEndpointDefaults?.roles);
const portableUpstream = (portableEndpointDefaults && typeof portableEndpointDefaults === "object" ? (portableEndpointDefaults as Record<string, any>).upstream : undefined) || {};
const portableUpstreamEndpoints = toStringArray((portableUpstream as Record<string, any>)?.endpoints) || toStringArray(FALLBACK_UPSTREAM_ENDPOINTS);
const portablePeers = toStringArray(portableRuntimeDefaults?.peers);
const portableBroadcastTargets = toStringArray(portableRuntimeDefaults?.broadcastTargets);
const portableClipboardPeerTargets = toStringArray(portableRuntimeDefaults?.clipboardPeerTargets);
const portableTopology = (portableConfig && typeof portableConfig === "object" && "endpointTopology" in portableConfig
    ? (portableConfig as Record<string, any>).endpointTopology
    : undefined) as unknown;
const normalizeTopologyCollection = (value: unknown): unknown[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
};
const portableTopologyConfig = (portableTopology && typeof portableTopology === "object")
    ? {
        enabled: normalizeBoolean((portableTopology as Record<string, any>).enabled, true),
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
    listenPort: normalizeNumber(portableRuntimeDefaults?.listenPort, FALLBACK_RUNTIME_DEFAULTS.listenPort),
    httpPort: normalizeNumber(portableRuntimeDefaults?.httpPort, FALLBACK_RUNTIME_DEFAULTS.httpPort),
    broadcastForceHttps: normalizeBoolean(portableRuntimeDefaults?.broadcastForceHttps, FALLBACK_RUNTIME_DEFAULTS.broadcastForceHttps),
    peers: portablePeers || FALLBACK_RUNTIME_DEFAULTS.peers,
    broadcastTargets: portableBroadcastTargets || FALLBACK_RUNTIME_DEFAULTS.broadcastTargets,
    clipboardPeerTargets: portableClipboardPeerTargets || FALLBACK_RUNTIME_DEFAULTS.clipboardPeerTargets,
    pollInterval: normalizeNumber(portableRuntimeDefaults?.pollInterval, FALLBACK_RUNTIME_DEFAULTS.pollInterval),
    httpTimeoutMs: normalizeNumber(portableRuntimeDefaults?.httpTimeoutMs, FALLBACK_RUNTIME_DEFAULTS.httpTimeoutMs),
    secret: typeof portableRuntimeDefaults?.secret === "string" ? portableRuntimeDefaults.secret : FALLBACK_RUNTIME_DEFAULTS.secret
};

export const DEFAULT_ENDPOINT_TOPOLOGY = {
    ...FALLBACK_TOPOLOGY,
    ...(portableTopologyConfig || {})
};
