import path from "node:path";
import { mkdir } from "node:fs/promises";

const ROOT = import.meta.dirname;

export const DATA_DIR = path.resolve(ROOT, "../../.data");
export const SETTINGS_FILE = path.join(DATA_DIR, "core-settings.json");
export const USERS_FILE = path.join(DATA_DIR, "users.json");
export const USER_STORAGE_DIR = path.join(DATA_DIR, "users");
export const ADMIN_DIR = path.resolve(ROOT, "../admin");

export const ensureDataDirs = async () => {
    await mkdir(DATA_DIR, { recursive: true });
    await mkdir(USER_STORAGE_DIR, { recursive: true });
};

export const safeJoin = (base: string, target: string) => {
    const normalized = path.normalize(target).replace(/^(\.\.(\/|\\|$))+/g, "");
    return path.join(base, normalized);
};
