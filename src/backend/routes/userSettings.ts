import type { FastifyInstance, FastifyRequest } from "fastify";

import { mergeSettings, readCoreSettings, type SettingsPatch } from "../lib/settings.ts";
import { verifyUser, readUserFile, writeUserFile, loadUserSettings } from "../lib/users.ts";
import { DEFAULT_SETTINGS, type AppSettings } from "@rs-com/config/SettingsTypes.js";

export const registerCoreSettingsRoutes = async (app: FastifyInstance) => {
    app.get("/core/user/settings", async (request: FastifyRequest<{ Querystring: { userId: string; userKey: string } }>) => {
        const { userId, userKey } = request.query || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        try {
            const buf = await readUserFile(userId, "settings.json", record.encrypt, userKey);
            const parsed = JSON.parse(buf.toString("utf-8")) as AppSettings;
            return { ok: true, settings: mergeSettings(DEFAULT_SETTINGS, parsed), encrypt: record.encrypt };
        } catch {
            return { ok: true, settings: DEFAULT_SETTINGS, encrypt: record.encrypt };
        }
    });

    app.post("/core/user/settings", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; settings: SettingsPatch } }>) => {
        const { userId, userKey, settings } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const merged = mergeSettings(DEFAULT_SETTINGS, settings || {});
        await writeUserFile(userId, "settings.json", Buffer.from(JSON.stringify(merged, null, 2)), record.encrypt, userKey);
        return { ok: true, settings: merged };
    });
};

export const registerCoreSettingsEndpoints = async (app: FastifyInstance) => {
    app.get("/health", async () => {
        const settings = await readCoreSettings();
        return { ok: true, mode: settings.core?.mode ?? "native" };
    });
};

export const registerOpsSettingsRoutes = async (app: FastifyInstance) => {
    app.post("/core/ops/http", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; targetId?: string; url?: string; method?: string; headers?: Record<string, string>; body?: string } }>) => {
        const { userId, userKey, targetId, url: overrideUrl, method, headers, body } = request.body || {};
        let settings: AppSettings;
        try {
            settings = await loadUserSettings(userId, userKey);
        } catch (e) {
            return { ok: false, error: (e as Error)?.message || "Invalid credentials" };
        }

        const ops = settings?.core?.ops || {};
        const httpTargets = ops.httpTargets || [];
        const target = httpTargets.find((t) => t.id === targetId);
        const resolvedUrl = overrideUrl || target?.url;
        if (!resolvedUrl) return { ok: false, error: "No URL" };

        const isHttps = resolvedUrl.startsWith("https://");
        if (!isHttps && !(ops.allowUnencrypted || target?.unencrypted)) {
            return { ok: false, error: "Unencrypted HTTP is not allowed" };
        }

        const finalHeaders = { ...(target?.headers || {}), ...(headers || {}) };
        const finalMethod = (method || target?.method || "POST").toUpperCase();

        try {
            const res = await fetch(resolvedUrl, {
                method: finalMethod,
                headers: finalHeaders,
                body: body ?? null
            });
            const text = await res.text();
            return { ok: true, status: res.status, data: text };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    });
};
