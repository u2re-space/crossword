import { readFile, writeFile } from "node:fs/promises";

import { DEFAULT_SETTINGS, type AppSettings } from "@rs-com/config/SettingsTypes.js";
import { SETTINGS_FILE, ensureDataDirs } from "./paths.ts";

export type SettingsPatch = Partial<AppSettings>;

export const mergeSettings = (current: AppSettings, patch: SettingsPatch): AppSettings => ({
    core: {
        ...(DEFAULT_SETTINGS.core || {}),
        ...(current.core || {}),
        ...(patch.core || {})
    },
    ai: {
        ...(DEFAULT_SETTINGS.ai || {}),
        ...(current.ai || {}),
        ...(patch.ai || {})
    },
    webdav: {
        ...(DEFAULT_SETTINGS.webdav || {}),
        ...(current.webdav || {}),
        ...(patch.webdav || {})
    },
    timeline: {
        ...(DEFAULT_SETTINGS.timeline || {}),
        ...(current.timeline || {}),
        ...(patch.timeline || {})
    },
    appearance: {
        ...(DEFAULT_SETTINGS.appearance || {}),
        ...(current.appearance || {}),
        ...(patch.appearance || {})
    },
    speech: {
        ...(DEFAULT_SETTINGS.speech || {}),
        ...(current.speech || {}),
        ...(patch.speech || {})
    },
    grid: {
        ...(DEFAULT_SETTINGS.grid || {}),
        ...(current.grid || {}),
        ...(patch.grid || {})
    }
});

const loadJson = async <T>(filePath: string, fallback: T): Promise<T> => {
    try {
        const raw = await readFile(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

export const readCoreSettings = async (): Promise<AppSettings> => {
    const parsed = await loadJson<AppSettings>(SETTINGS_FILE, DEFAULT_SETTINGS);
    return mergeSettings(DEFAULT_SETTINGS, parsed);
};

export const writeCoreSettings = async (patch: SettingsPatch): Promise<AppSettings> => {
    await ensureDataDirs();
    const current = await readCoreSettings();
    const next = mergeSettings(current, patch);
    await writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf-8");
    return next;
};
