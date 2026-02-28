import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS } from "./settings.ts";
import { fileURLToPath } from "node:url";
import { SETTINGS_FILE } from "../lib/paths.ts";
import {
    DEFAULT_CORE_ROLES,
    DEFAULT_UPSTREAM_ENDPOINTS,
    DEFAULT_ENDPOINT_UPSTREAM,
    DEFAULT_ENDPOINT_RUNTIME,
    DEFAULT_ENDPOINT_TOPOLOGY
} from "./default-endpoint-config.ts";

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
    const explicit = process.env.ENDPOINT_CONFIG_JSON_PATH;
    const cwd = process.cwd();
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const npmPackageJson = process.env.npm_package_json;
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
        path.resolve(moduleDir, "../../../.endpoint.config.json"),
    ].filter(Boolean) as string[];
};

const loadJsonFile = (filePath: string): Record<string, any> | undefined => {
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
};

const normalizeUrlList = (raw: unknown): string[] | undefined => {
    if (!Array.isArray(raw)) return undefined;
    const items = raw.map((v) => String(v ?? "").trim()).filter(Boolean);
    return items.length ? items : undefined;
};

const normalizePeerTargets = (raw: unknown): string[] | undefined => {
    if (Array.isArray(raw)) {
        const list = raw
            .map((v) => String(v ?? "").trim())
            .filter(Boolean);
        return list.length ? list : undefined;
    }
    if (typeof raw !== "string") return undefined;
    const list = raw.split(/[;,]/).map((v) => v.trim()).filter(Boolean);
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
    if (typeof value === "string") return value.split(/[;,]/).map((entry) => entry.trim()).filter(Boolean);
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
            const parsed = JSON.parse(trimmed);
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

const normalizeTopologyConfig = (raw: unknown): {
    enabled: boolean;
    nodes: Array<Record<string, any>>;
    links: Array<Record<string, any>>;
} => {
    const topology = (raw && typeof raw === "object" ? raw as Record<string, any> : {}) as Record<string, any>;
    const enabledRaw = topology.enabled;
    const enabled = typeof enabledRaw === "boolean" ? enabledRaw : true;
    const nodes = Array.isArray(topology.nodes)
        ? topology.nodes.filter((item) => item && typeof item === "object" && !Array.isArray(item))
            .map((item) => item as Record<string, any>)
        : [];
    const links = Array.isArray(topology.links)
        ? topology.links.filter((item) => item && typeof item === "object" && !Array.isArray(item))
            .map((item) => item as Record<string, any>)
        : [];
    return {
        enabled,
        nodes,
        links
    };
};

const normalizeEndpointPolicyList = (raw: unknown, preserveEmpty = true): string[] => {
    const normalizeToken = (value: string): string => {
        const normalized = String(value || "").trim().toLowerCase();
        return normalized.startsWith("{") && normalized.endsWith("}") ? normalized.slice(1, -1).trim() : normalized;
    };
    if (raw === undefined) return preserveEmpty ? ["*"] : [];
    if (Array.isArray(raw)) {
        const list = raw
            .map((entry) => normalizeToken(String(entry || "")))
            .filter(Boolean);
        return list.length ? list : (preserveEmpty ? [] : ["*"]);
    }
    if (typeof raw === "string") {
        const list = raw
            .split(/[;,]/)
            .map((entry) => normalizeToken(entry))
            .filter(Boolean);
        return list.length ? list : (preserveEmpty ? [] : ["*"]);
    }
    if (raw == null) return preserveEmpty ? ["*"] : [];
    if (raw === true) return ["*"];
    if (raw === false) return [];
    return preserveEmpty ? ["*"] : [];
};

const normalizeEndpointIdPolicy = (policyId: string, source: unknown): EndpointIdPolicy => {
    const raw = source && typeof source === "object" ? source as Record<string, unknown> : {};
    const normalizedId = String(policyId || "").trim().toLowerCase();
    const flags = raw.flags && typeof raw.flags === "object" ? raw.flags as Record<string, unknown> : {};
    return {
        id: normalizedId,
        origins: normalizeEndpointPolicyList(raw.origins, true),
        tokens: normalizeEndpointPolicyList(raw.tokens, false),
        forward: typeof raw.forward === "string" && raw.forward.trim()
            ? raw.forward.trim().toLowerCase()
            : "self",
        flags: {
            mobile: typeof flags.mobile === "boolean" ? flags.mobile : undefined,
            gateway: typeof flags.gateway === "boolean" ? flags.gateway : undefined,
            direct: typeof flags.direct === "boolean" ? flags.direct : undefined
        },
        allowedIncoming: normalizeEndpointPolicyList(
            raw.allowedIncoming,
            true
        ),
        allowedOutcoming: normalizeEndpointPolicyList(
            raw.allowedOutcoming,
            true
        )
    };
};

const normalizeEndpointIds = (raw: unknown): Record<string, EndpointIdPolicy> => {
    const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const out: Record<string, EndpointIdPolicy> = {};
    for (const [policyId, policySource] of Object.entries(source)) {
        const normalizedId = String(policyId || "").trim().toLowerCase();
        if (!normalizedId) continue;
        out[normalizedId] = normalizeEndpointIdPolicy(normalizedId, policySource);
    }
    return out;
};

const sanitizeConfig = (value: Record<string, any>): EndpointConfig => {
    const source = (value && typeof value === "object") ? value : {};
    const coreSource = (source.core && typeof source.core === "object") ? (source.core as Record<string, any>) : {};
    const aiSource = (source.ai && typeof source.ai === "object") ? (source.ai as Record<string, any>) : {};
    const mergedUpstream = coreSource.upstream && typeof coreSource.upstream === "object"
        ? {
            ...defaultConfig.upstream,
            ...(coreSource.upstream as Record<string, any>)
        }
        : source.upstream && typeof source.upstream === "object"
            ? {
                ...defaultConfig.upstream,
                ...(source.upstream as Record<string, any>)
            }
            : defaultConfig.upstream;

    const mergedUpstreamWithFallback = {
        ...mergedUpstream,
        origin: normalizeOriginConfig((coreSource as Record<string, any>).upstream?.origin || source?.upstream?.origin),
        userId: normalizeTextField(
            mergedUpstream.userId,
            normalizeTextField((defaultConfig.upstream as Record<string, any>).userId, "")
        ),
        userKey: normalizeTextField(
            mergedUpstream.userKey,
            normalizeTextField((defaultConfig.upstream as Record<string, any>).userKey, "")
        ),
        endpoints: normalizeUrlList(
            (coreSource.upstream?.endpoints || source.upstream?.endpoints)
        ) ?? normalizeUrlList(mergedUpstream.endpoints) ?? [],
    };
    const mergedTopology = coreSource.topology && typeof coreSource.topology === "object"
        ? {
            ...DEFAULT_ENDPOINT_TOPOLOGY,
            ...(coreSource.topology as Record<string, any>)
        }
        : source.topology && typeof source.topology === "object"
            ? {
                ...DEFAULT_ENDPOINT_TOPOLOGY,
                ...(source.topology as Record<string, any>)
            }
            : DEFAULT_ENDPOINT_TOPOLOGY;

    if (!mergedUpstreamWithFallback.endpointUrl && mergedUpstreamWithFallback.endpoints?.length) {
        mergedUpstreamWithFallback.endpointUrl = mergedUpstreamWithFallback.endpoints[0];
    }

    return {
        ...(defaultConfig as Record<string, any>),
        ...source,
        ...coreSource,
        networkAliases: normalizeNetworkAliases(
            source.networkAliases ??
            source.networkAliasMap ??
            process.env.NETWORK_ALIAS_MAP ??
            process.env.NETWORK_ALIASES ??
            (coreSource as Record<string, any>).networkAliases ??
            (coreSource as Record<string, any>).networkAliasMap
        ),
        peers: normalizeUrlList(
            source.peers ?? coreSource.peers ?? normalizePeerSource(process.env.CLIPBOARD_PEERS)
        ) ?? defaultConfig.peers,
        clipboardPeerTargets: normalizePeerTargets(
            source.clipboardPeerTargets ??
            coreSource.clipboardPeerTargets ??
            process.env.CLIPBOARD_PEER_TARGETS
        ) ?? defaultConfig.clipboardPeerTargets,
        roles: Array.isArray(coreSource.roles) ? coreSource.roles : source.roles ?? defaultConfig.roles,
        upstream: mergedUpstreamWithFallback,
        topology: {
            ...mergedTopology,
            ...normalizeTopologyConfig(mergedTopology)
        },
        endpointIDs: normalizeEndpointIds(coreSource.endpointIDs ?? source.endpointIDs),
        ai: {
            ...(defaultConfig as Record<string, any>).ai,
            ...aiSource,
            ...(source.ai as Record<string, any>)
        },
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
