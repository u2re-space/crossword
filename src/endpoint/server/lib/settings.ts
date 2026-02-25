import { readFile, writeFile } from "node:fs/promises";
import { SETTINGS_FILE, ensureDataDirs } from "./paths.ts";

export type CustomInstruction = {
    id: string;
    instruction: string;
};

export type Settings = {
    core: CoreSettings;
    ai: AiSettings;
    webdav: WebdavSettings;
    timeline: TimelineSettings;
    appearance: AppearanceSettings;
    speech: SpeechSettings;
    grid: GridSettings;
};

export type AppSettings = Omit<Settings, "core">;

export interface CoreSettings {
    // ...
}

export interface AiSettings {
    customInstructions?: CustomInstruction[];
    activeInstructionId?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    customModel?: string;
    mcp?: Array<{
        id?: string;
        serverLabel?: string;
        origin?: string;
    }>;
}

export interface WebdavSettings {
    url?: string;
    username?: string;
    password?: string;
}

export interface TimelineSettings {
    enabled?: boolean;
}

export interface AppearanceSettings {
    theme?: string;
    language?: string;
}

export interface SpeechSettings {
    voice?: string;
}

export interface GridSettings {
    columns?: number;
    rows?: number;
}

export const DEFAULT_SETTINGS: Settings = {
    core: {},
    ai: { customInstructions: [], activeInstructionId: "" },
    webdav: { url: "", username: undefined, password: undefined },
    timeline: { enabled: false },
    appearance: { theme: "", language: "" },
    speech: { voice: "" },
    grid: { columns: 0, rows: 0 }
};

export const mergeSettings = (current: Settings, patch: Partial<Settings>): Settings => ({
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

export const loadJson = async <T>(filePath: string, fallback: T): Promise<T> => {
    try {
        const raw = await readFile(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

export const readCoreSettings = async (): Promise<Settings> => {
    const parsed = await loadJson<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS);
    return mergeSettings(DEFAULT_SETTINGS, parsed);
};

export const writeCoreSettings = async (patch: Partial<Settings>): Promise<Settings> => {
    await ensureDataDirs();
    const current = await readCoreSettings();
    const next = mergeSettings(current, patch);
    await writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf-8");
    return next;
};
