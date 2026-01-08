type ProbeResult = {
    ok: boolean;
    url: string;
    contentType?: string | null;
    status?: number;
};

const isLikelyJavaScriptContentType = (contentType: string | null | undefined): boolean => {
    const ct = (contentType || "").toLowerCase();
    return ct.includes("javascript") || ct.includes("ecmascript") || ct.includes("module");
};

const probeScriptUrl = async (url: string): Promise<ProbeResult> => {
    try {
        const res = await fetch(url, {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
        });
        const contentType = res.headers.get("content-type");
        return { ok: res.ok && isLikelyJavaScriptContentType(contentType), url, contentType, status: res.status };
    } catch {
        return { ok: false, url };
    }
};

export const getServiceWorkerCandidates = (): string[] => {
    const env = (import.meta as any)?.env;
    const isDev = Boolean(env?.DEV);

    // Dev: VitePWA injectManifest serves /sw.js.
    if (isDev) return ["/sw.js"];

    // Prod: support both root and /apps/cw/ (Fastify may expose one or both).
    return ["/sw.js", "/apps/cw/sw.js"];
};

export const ensureServiceWorkerRegistered = async (): Promise<ServiceWorkerRegistration | null> => {
    if (typeof window === "undefined") return null;
    if (!("serviceWorker" in navigator)) return null;

    // Prefer existing registration.
    try {
        const existing = await navigator.serviceWorker.getRegistration("/");
        if (existing) return existing;
    } catch {
        // ignore
    }

    const candidates = getServiceWorkerCandidates();
    const scope = "/";

    for (const url of candidates) {
        const probe = await probeScriptUrl(url);
        if (!probe.ok) continue;

        try {
            return await navigator.serviceWorker.register(url, {
                scope,
                type: "module",
                updateViaCache: "none",
            });
        } catch (e) {
            // Try next candidate.
            console.warn("[SW] Registration attempt failed for", url, e);
        }
    }

    // Best-effort diagnostics.
    try {
        const probes = await Promise.all(candidates.map(probeScriptUrl));
        console.warn("[SW] No valid service worker script found. Probes:", probes);
    } catch {
        // ignore
    }

    return null;
};

