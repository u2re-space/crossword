import path from "node:path";
import { mkdir } from "node:fs/promises";

import { moduleDirname } from "./runtime.ts";
import { pickEnvStringLegacy } from "./env.ts";

const ROOT = moduleDirname(import.meta);

export const DATA_DIR = pickEnvStringLegacy("CWS_DATA_DIR") ? path.resolve(pickEnvStringLegacy("CWS_DATA_DIR")!) : path.resolve(ROOT, "../../.data");
export const CONFIG_DIR = pickEnvStringLegacy("CWS_CONFIG_DIR") ? path.resolve(pickEnvStringLegacy("CWS_CONFIG_DIR")!) : path.resolve(ROOT, "../../config");

export const SETTINGS_FILE = path.join(DATA_DIR, "core-settings.json");
export const USERS_FILE = path.join(DATA_DIR, "users.json");
export const USER_STORAGE_DIR = path.join(DATA_DIR, "users");
export const ADMIN_PREFS_FILE = path.join(CONFIG_DIR, "admin-prefs.json");
export const ADMIN_DIR = path.resolve(ROOT, "../admin");

export const ensureDataDirs = async () => {
    await mkdir(DATA_DIR, { recursive: true });
    await mkdir(CONFIG_DIR, { recursive: true });
    await mkdir(USER_STORAGE_DIR, { recursive: true });
};

export const safeJoin = (base: string, target: string) => {
    const normalized = path.normalize(target).replace(/^(\.\.(\/|\\|$))+/g, "");
    return path.join(base, normalized);
};
