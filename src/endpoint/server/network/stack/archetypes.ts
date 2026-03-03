export type WsConnectionArchetype = "client-reverse" | "client-forward" | "server-forward" | "server-reverse";

const LEGACY_ROLE_ALIASES = new Set(["endpoint", "server", "peer", "client", "node", "hub"]);
const CLIENT_CONNECTOR_ROLES = new Set([
    "client-reverse",
    "client-forward",
    "client-bridge",
    "client-downstream",
    "reverse-client",
    "forward-client",
    "client-upstream"
]);
const FORWARD_SERVER_ROLES = new Set(["server-forward", "server-bridge", "forward-server"]);
const REVERSE_SERVER_ROLES = new Set(["server-reverse", "server-downstream", "reverse-server"]);
const REVERSE_MODE = "server-reverse";
const DIRECT_MODE = "server-forward";

const resolveClientRole = (input: string): WsConnectionArchetype | undefined => {
    const value = (input || "").trim().toLowerCase();
    if (!value) return undefined;
    switch (value) {
        case "client-reverse":
        case "reverse-client":
        case "client-bridge":
        case "client-upstream":
        case "cr":
        case "c-up":
        case "cu":
            return "client-reverse";
        case "client-forward":
        case "forward-client":
        case "client-downstream":
        case "cd":
        case "c-down":
        case "fc":
            return "client-forward";
        case "server-forward":
        case "forward-server":
        case "server-bridge":
        case "fs":
        case "su":
        case "s-up":
            return "server-forward";
        case "server-reverse":
        case "reverse-server":
        case "server-downstream":
        case "rs":
        case "sd":
        case "s-down":
            return "server-reverse";
        default:
            return undefined;
    }
};

export const normalizeRoleSet = (roles: unknown): Set<string> => {
    if (!Array.isArray(roles)) return new Set<string>();
    const normalized = roles.map((value) => (typeof value === "string" ? value.trim().toLowerCase() : "")).filter((value) => value.length > 0);
    return new Set(normalized);
};

export const parseWsArchetype = (value: unknown): WsConnectionArchetype | undefined => {
    if (typeof value !== "string") return undefined;
    return resolveClientRole(value);
};

export const inferServerSideArchetype = (isReverse: boolean): WsConnectionArchetype => {
    return isReverse ? REVERSE_MODE : DIRECT_MODE;
};

export const inferExpectedRemoteArchetype = (isReverse: boolean): WsConnectionArchetype => {
    return isReverse ? "client-reverse" : "client-forward";
};

const hasLegacyRoleMarker = (roles: Set<string>): boolean => {
    for (const role of roles) {
        if (LEGACY_ROLE_ALIASES.has(role)) return true;
    }
    return false;
};

export const supportsConnectorRole = (rawRoles: unknown): boolean => {
    const roles = normalizeRoleSet(rawRoles);
    if (roles.size === 0) return true;
    if (hasLegacyRoleMarker(roles)) return true;
    for (const role of CLIENT_CONNECTOR_ROLES) {
        if (roles.has(role)) return true;
    }
    return false;
};

export const supportsForwardServerArchetype = (rawRoles: unknown): boolean => {
    const roles = normalizeRoleSet(rawRoles);
    if (roles.size === 0) return true;
    if (hasLegacyRoleMarker(roles)) return true;
    for (const role of FORWARD_SERVER_ROLES) {
        if (roles.has(role)) return true;
    }
    return false;
};

export const supportsReverseServerArchetype = (rawRoles: unknown): boolean => {
    const roles = normalizeRoleSet(rawRoles);
    if (roles.size === 0) return true;
    if (hasLegacyRoleMarker(roles)) return true;
    for (const role of REVERSE_SERVER_ROLES) {
        if (roles.has(role)) return true;
    }
    return false;
};

export const areArchetypesCompatible = (localArchetype: WsConnectionArchetype, remoteArchetype: WsConnectionArchetype | undefined): boolean => {
    if (remoteArchetype == null) return true;
    const compatibility: Record<WsConnectionArchetype, WsConnectionArchetype> = {
        "client-reverse": "server-reverse",
        "server-reverse": "client-reverse",
        "client-forward": "server-forward",
        "server-forward": "client-forward"
    };
    return compatibility[localArchetype] === remoteArchetype;
};

export const describeArchetype = (archetype: WsConnectionArchetype): string => archetype;
