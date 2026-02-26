import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SETTINGS_FILE } from "../lib/paths.ts";

type EndpointConfig = {
    listenPort?: number;
    httpPort?: number;
    broadcastForceHttps?: boolean;
    peers?: string[];
    clipboardPeerTargets?: string[];
    pollInterval?: number;
    httpTimeoutMs?: number;
    secret?: string;
    roles?: string[];
    upstream?: {
        enabled?: boolean;
        endpointUrl?: string;
        endpoints?: string[];
        userId?: string;
        userKey?: string;
        upstreamMasterKey?: string;
        upstreamSigningPrivateKeyPem?: string;
        upstreamPeerPublicKeyPem?: string;
        deviceId?: string;
        namespace?: string;
        reconnectMs?: number;
    };
    ai?: Record<string, any>;
};

const defaultConfig = {
    // На каком порту слушаем входящие HTTP запросы
    listenPort: 8443,

    // На каком порту слушаем входящие НЕ-HTTPS (HTTP) запросы (эндпоинты, Socket.IO)
    // Нужно для совместимости/простых клиентов в локальной сети: http://host:8080/clipboard
    httpPort: 8080,
    // По умолчанию в broadcast пытаемся использовать HTTPS для портов 443/8443
    broadcastForceHttps: true,

    // Список получателей (URL/IP/host), куда рассылаем изменения клипборда.
    // Формат может быть URL или хост/IP; без схемы будут пробованы https и http варианты.
    peers: [
        '100.81.105.5',
        '100.90.155.65',
        '192.168.0.196',
        '192.168.0.200',
        '192.168.0.110',
        '45.147.121.152'
    ],
    // Список вариантов схема:порт, которые пробуются для peers без явного порта/схемы.
    // Формат: "https:443", "https:8443", "http:8080", "http:80"
    clipboardPeerTargets: ["https:443", "https:8443", "http:8080", "http:80"],

    // Интервал опроса системного буфера (мс)
    pollInterval: 100,

    // Таймаут для исходящих HTTP запросов к peers (мс)
    // 3000мс часто мало для мобильных устройств/спящих девайсов/первого пробуждения сети.
    httpTimeoutMs: 10000,

    // Простейшая защита: токен (по желанию, можно оставить пустым)
    secret: '',

    // Роли/режимы этого узла:
    // - endpoint: full endpoint behavior
    // - server: run local HTTP/HTTPS endpoints and WS/Socket.IO bridge
    // - client: connect as reverse client to another endpoint/hub
    // - peer: participate as a peer device (reverse dispatch target)
    // - hub: act as upstream relay participant
    // - node: generic aggregate role (server+client+peer)
    roles: ["endpoint", "server", "peer", "client", "node", "hub"],

    // Upstream tunnel-through / be-as-device settings.
    // Когда enabled=true, endpoint откроет reverse WS на другой точке.
    upstream: {
        enabled: false,
        // Основные адреса для hub/server/endpoint подключения:
        // 1) внешний endpoint hub (дефолт)
        // 2) локальный fallback для LAN
        endpoints: [
            "https://45.147.121.152:8443/",
            "https://192.168.0.200:8443/"
        ],
        endpointUrl: "https://45.147.121.152:8443/",
        userId: "",
        userKey: "",
        upstreamMasterKey: "",
        upstreamSigningPrivateKeyPem: "",
        upstreamPeerPublicKeyPem: "",
        deviceId: "",
        namespace: "default",
        reconnectMs: 5000
    },
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
        endpoints: normalizeUrlList(
            (coreSource.upstream?.endpoints || source.upstream?.endpoints)
        ) ?? normalizeUrlList(mergedUpstream.endpoints) ?? [],
    };
    if (!mergedUpstreamWithFallback.endpointUrl && mergedUpstreamWithFallback.endpoints?.length) {
        mergedUpstreamWithFallback.endpointUrl = mergedUpstreamWithFallback.endpoints[0];
    }

    return {
        ...(defaultConfig as Record<string, any>),
        ...source,
        ...coreSource,
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
