export type EndpointIdFlags = {
    mobile?: boolean;
    gateway?: boolean;
    direct?: boolean;
    [key: string]: boolean | undefined;
};

export type EndpointIdPolicy = {
    id: string;
    origins: string[];
    tokens: string[];
    forward: string;
    flags: EndpointIdFlags;
    allowedIncoming: string[];
    allowedOutcoming: string[];
};

export type EndpointIdPolicyMap = Record<string, EndpointIdPolicy>;
type NormalizedPolicyValue = Record<string, EndpointIdPolicy>;

type EndpointRouteDecision = {
    allowed: boolean;
    sourcePolicy?: EndpointIdPolicy;
    targetPolicy?: EndpointIdPolicy;
    source: string;
    target: string;
    reason?: string;
};

const normalizeEndpointToken = (value: string): string => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();
    if (!normalized) return "";
    return normalized.startsWith("{") && normalized.endsWith("}") ? normalized.slice(1, -1).trim() : normalized;
};

const normalizePolicyList = (raw: unknown, useWildcard = true): string[] => {
    if (raw === undefined) return useWildcard ? ["*"] : [];
    if (raw === null) return useWildcard ? ["*"] : [];
    if (Array.isArray(raw)) {
        const list = raw.map((entry) => normalizeEndpointToken(String(entry || ""))).filter(Boolean);
        if (list.length === 0) return [];
        return list;
    }
    if (typeof raw === "string") {
        const list = raw
            .split(/[;,]/)
            .map((entry) => normalizeEndpointToken(entry))
            .filter(Boolean);
        return list.length ? list : [];
    }
    return useWildcard ? ["*"] : [];
};

const normalizePolicyForward = (raw: unknown): string => {
    const normalized = normalizeEndpointToken(String(raw || ""));
    if (!normalized || normalized === "self") return "self";
    return normalized;
};

const normalizePolicyFlags = (raw: unknown): EndpointIdFlags => {
    const flags = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const out: EndpointIdPolicy["flags"] = {};
    if (typeof flags.mobile === "boolean") out.mobile = flags.mobile;
    if (typeof flags.gateway === "boolean") out.gateway = flags.gateway;
    if (typeof flags.direct === "boolean") out.direct = flags.direct;
    return out;
};

export const normalizeEndpointPolicy = (id: string, raw: unknown): EndpointIdPolicy => {
    const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const normalizedId = normalizeEndpointToken(id);
    return {
        id: normalizedId,
        origins: normalizePolicyList(source.origins),
        tokens: normalizePolicyList(source.tokens, false),
        forward: normalizePolicyForward(source.forward),
        flags: normalizePolicyFlags(source.flags),
        allowedIncoming: normalizePolicyList(source.allowedIncoming, true),
        allowedOutcoming: normalizePolicyList(source.allowedOutcoming, true)
    };
};

export const normalizeEndpointPolicies = (raw: unknown): EndpointIdPolicyMap => {
    const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const out: NormalizedPolicyValue = {};
    const entries = Object.entries(source);
    for (const [policyId, policySource] of entries) {
        const normalizedId = normalizeEndpointToken(policyId);
        if (!normalizedId) continue;
        if (normalizedId === "*") {
            out["*"] = normalizeEndpointPolicy("*", policySource);
            continue;
        }
        out[normalizedId] = normalizeEndpointPolicy(normalizedId, policySource);
    }
    if (!Object.prototype.hasOwnProperty.call(out, "*")) {
        out["*"] = normalizeEndpointPolicy("*", {
            forward: "self",
            allowedIncoming: ["*"],
            allowedOutcoming: ["*"]
        });
    }
    return out;
};

const hasRuleMatch = (ruleValue: string, candidate: string): boolean => {
    if (!ruleValue) return false;
    if (ruleValue === "*") return true;
    if (ruleValue === candidate) return true;
    if (ruleValue.includes(candidate) || candidate.includes(ruleValue)) return true;
    return false;
};

const isAllowedByRules = (rules: readonly string[], candidate: string): boolean => {
    if (!rules || rules.length === 0) return false;
    const normalized = normalizeEndpointToken(candidate);
    const denies = rules
        .filter((entry) => entry.startsWith("!"))
        .map((entry) => normalizeEndpointToken(entry.slice(1)))
        .filter(Boolean);
    if (denies.some((entry) => hasRuleMatch(entry, normalized))) return false;

    const allows = rules
        .filter((entry) => !entry.startsWith("!"))
        .map((entry) => normalizeEndpointToken(entry))
        .filter(Boolean);
    return allows.some((entry) => entry === "*" || hasRuleMatch(entry, normalized));
};

export const resolveEndpointIdPolicy = (policies: EndpointIdPolicyMap, raw: string): EndpointIdPolicy | undefined => {
    const normalized = normalizeEndpointToken(raw);
    if (!normalized) return undefined;
    if (policies[normalized]) return policies[normalized];

    for (const entry of Object.values(policies)) {
        const normalizedTokens = [...entry.tokens, ...entry.origins];
        for (const token of normalizedTokens) {
            if (!token) continue;
            if (hasRuleMatch(token, normalized) || hasRuleMatch(normalized, token)) {
                return entry;
            }
        }
    }
    return policies["*"];
};

export const resolveEndpointIdPolicyStrict = (policies: EndpointIdPolicyMap, raw: string): EndpointIdPolicy | undefined => {
    const normalized = normalizeEndpointToken(raw);
    if (!normalized) return undefined;
    if (policies[normalized] && normalized !== "*") return policies[normalized];

    const entries = Object.entries(policies).filter(([id]) => id !== "*" && id);
    for (const [, policy] of entries) {
        const normalizedTokens = [...(policy.tokens || []), ...(policy.origins || [])];
        for (const token of normalizedTokens) {
            if (!token) continue;
            if (hasRuleMatch(token, normalized) || hasRuleMatch(normalized, token)) {
                return policy;
            }
        }
    }

    return undefined;
};

const stripPort = (value: string): string => {
    const trimmed = normalizeEndpointToken(value);
    const at = trimmed.lastIndexOf(":");
    if (at <= 0) return trimmed;
    const host = trimmed.slice(0, at);
    const candidate = trimmed.slice(at + 1);
    if (/^\d+$/.test(candidate)) return host;
    return trimmed;
};

export const resolveEndpointForwardTarget = (raw: string, sourceId: string, policies: EndpointIdPolicyMap): string => {
    const requested = stripPort(normalizeEndpointToken(raw));
    if (requested) {
        const matched = resolveEndpointIdPolicy(policies, requested);
        return matched && matched.id !== "*" ? matched.id : requested;
    }
    let current = normalizeEndpointToken(sourceId);
    if (!current) return "";
    const visited = new Set<string>();
    for (let i = 0; i < 8; i++) {
        if (visited.has(current)) break;
        visited.add(current);
        const policy = resolveEndpointIdPolicy(policies, current);
        const forward = normalizePolicyForward(policy?.forward || "self");
        if (!forward || forward === "self") return current;
        current = forward === "self" ? sourceId : forward;
    }
    return current;
};

export const resolveEndpointPolicyRoute = (sourceRaw: string, targetRaw: string, policies: EndpointIdPolicyMap): EndpointRouteDecision => {
    const source = resolveEndpointIdPolicy(policies, sourceRaw) || policies["*"];
    const target = resolveEndpointIdPolicy(policies, targetRaw) || policies["*"];
    const sourceToken = normalizeEndpointToken(sourceRaw);
    const targetToken = normalizeEndpointToken(targetRaw);
    const outgoing = isAllowedByRules(source?.allowedOutcoming || ["*"], targetToken);
    const incoming = isAllowedByRules(target?.allowedIncoming || ["*"], sourceToken);
    const allowed = outgoing && incoming;
    const reason = allowed ? "routing allowed by endpoint policy" : sourceToken && targetToken && sourceRaw && targetRaw ? `routing denied by endpoint policy source=${sourceToken},target=${targetToken}` : "routing denied by endpoint policy";
    return {
        allowed,
        sourcePolicy: source,
        targetPolicy: target,
        source: sourceToken,
        target: targetToken,
        reason
    };
};
