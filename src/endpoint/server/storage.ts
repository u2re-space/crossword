import path from "node:path";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { readdir, stat, rm } from "node:fs/promises";

import { ensureUserDir, readUserFile, verifyUser, writeUserFile } from "../../lib/users.ts";
import { safeJoin } from "../../lib/paths.ts";

export const registerStorageRoutes = async (app: FastifyInstance) => {
    app.post("/core/storage/list", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; dir?: string } }>) => {
        const { userId, userKey, dir = "." } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const base = await ensureUserDir(userId);
        const target = safeJoin(base, dir);
        const entries = await readdir(target, { withFileTypes: true }).catch(() => []);
        const files = await Promise.all(entries.map(async (entry) => {
            const full = path.join(target, entry.name);
            const st = await stat(full).catch(() => null);
            return {
                name: entry.name,
                type: entry.isDirectory() ? "dir" : "file",
                size: st?.size ?? 0,
                mtime: st?.mtimeMs ?? 0
            };
        }));
        return { ok: true, dir, files };
    });

    app.post("/core/storage/get", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; path: string; encoding?: "base64" | "utf8" } }>) => {
        const { userId, userKey, path: filePath, encoding = "base64" } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const buffer = await readUserFile(userId, filePath, record.encrypt, userKey).catch(() => null);
        if (!buffer) return { ok: false, error: "Not found" };
        const payload = encoding === "utf8" ? buffer.toString("utf8") : buffer.toString("base64");
        return { ok: true, path: filePath, encoding, data: payload, encrypt: record.encrypt };
    });

    app.post("/core/storage/put", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; path: string; data: string; encoding?: "base64" | "utf8" } }>) => {
        const { userId, userKey, path: filePath, data, encoding = "base64" } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        if (!filePath) return { ok: false, error: "Missing path" };
        const buffer = encoding === "utf8" ? Buffer.from(data ?? "", "utf8") : Buffer.from(data ?? "", "base64");
        await writeUserFile(userId, filePath, buffer, record.encrypt, userKey);
        return { ok: true, path: filePath };
    });

    app.post("/core/storage/delete", async (request: FastifyRequest<{ Body: { userId: string; userKey: string; path: string } }>) => {
        const { userId, userKey, path: filePath } = request.body || {};
        const record = await verifyUser(userId, userKey);
        if (!record) return { ok: false, error: "Invalid credentials" };
        const base = await ensureUserDir(userId);
        const target = safeJoin(base, filePath);
        await rm(target, { recursive: true, force: true });
        return { ok: true, path: filePath };
    });
};
