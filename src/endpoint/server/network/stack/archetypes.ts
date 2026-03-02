export type WsConnectionArchetype = "client-upstream" | "client-downstream" | "server-upstream" | "server-downstream";

const LEGACY_ROLE_ALIASES = new Set(["endpoint", "server", "peer", "client", "node", "hub"]);
const CLIENT_CONNECTOR_ROLES = new Set(["client-upstream", "client-downstream"]);
const SERVER_UPSTREAM_ROLES = new Set(["server-upstream"]);
const SERVER_DOWNSTREAM_ROLES = new Set(["server-downstream"]);
const REVERSE_MODE = "server-downstream";
const DIRECT_MODE = "server-upstream";

const resolveClientRole = (input: string): WsConnectionArchetype | undefined => {
    const value = (input || "").trim().toLowerCase();
    if (!value) return undefined;
    if (value === "client-upstream" || value === "cu" || value === "c-up") return "client-upstream";
    if (value === "client-downstream" || value === "cd" || value === "c-down") return "client-downstream";
    if (value === "server-upstream" || value === "su" || value === "s-up") return "server-upstream";
    if (value === "server-downstream" || value === "sd" || value === "s-down") return "server-downstream";
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
    return isReverse ? "client-upstream" : "client-downstream";
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

export const supportsServerUpstreamArchetype = (rawRoles: unknown): boolean => {
    const roles = normalizeRoleSet(rawRoles);
    if (roles.size === 0) return true;
    if (hasLegacyRoleMarker(roles)) return true;
    for (const role of SERVER_UPSTREAM_ROLES) {
        if (roles.has(role)) return true;
    }
    return false;
};

export const supportsServerDownstreamArchetype = (rawRoles: unknown): boolean => {
    const roles = normalizeRoleSet(rawRoles);
    if (roles.size === 0) return true;
    if (hasLegacyRoleMarker(roles)) return true;
    for (const role of SERVER_DOWNSTREAM_ROLES) {
        if (roles.has(role)) return true;
    }
    return false;
};

export const areArchetypesCompatible = (localArchetype: WsConnectionArchetype, remoteArchetype: WsConnectionArchetype | undefined): boolean => {
    if (remoteArchetype == null) return true;
    const compatibility: Record<WsConnectionArchetype, WsConnectionArchetype> = {
        "client-upstream": "server-downstream",
        "server-downstream": "client-upstream",
        "client-downstream": "server-upstream",
        "server-upstream": "client-downstream"
    };
    return compatibility[localArchetype] === remoteArchetype;
};

export const describeArchetype = (archetype: WsConnectionArchetype): string => archetype;
