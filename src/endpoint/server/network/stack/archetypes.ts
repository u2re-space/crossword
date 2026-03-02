export type WsConnectionArchetype = "reverse-client" | "forward-client" | "forward-server" | "reverse-server";

const LEGACY_ROLE_ALIASES = new Set(["endpoint", "server", "peer", "client", "node", "hub"]);
const CLIENT_CONNECTOR_ROLES = new Set(["reverse-client", "forward-client", "client-upstream", "client-downstream"]);
const FORWARD_SERVER_ROLES = new Set(["forward-server", "server-upstream"]);
const REVERSE_SERVER_ROLES = new Set(["reverse-server", "server-downstream"]);
const REVERSE_MODE = "reverse-server";
const DIRECT_MODE = "forward-server";

const resolveClientRole = (input: string): WsConnectionArchetype | undefined => {
    const value = (input || "").trim().toLowerCase();
    if (!value) return undefined;
    if (value === "reverse-client" || value === "rc" || value === "client-upstream" || value === "cu" || value === "c-up") return "reverse-client";
    if (value === "forward-client" || value === "fc" || value === "client-downstream" || value === "cd" || value === "c-down") return "forward-client";
    if (value === "forward-server" || value === "fs" || value === "server-upstream" || value === "su" || value === "s-up") return "forward-server";
    if (value === "reverse-server" || value === "rs" || value === "server-downstream" || value === "sd" || value === "s-down") return "reverse-server";
    return undefined;
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
    return isReverse ? "reverse-client" : "forward-client";
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
        "reverse-client": "reverse-server",
        "reverse-server": "reverse-client",
        "forward-client": "forward-server",
        "forward-server": "forward-client"
    };
    return compatibility[localArchetype] === remoteArchetype;
};

export const describeArchetype = (archetype: WsConnectionArchetype): string => archetype;
