import { idbGet, idbPut } from "@rs-core/store/IDBStorage";
import { updateWebDavSettings } from "@rs-core/workers/WebDavSync";
import { getDirectoryHandle } from "fest/lure";

//
import type { AppSettings, SectionConfig } from "@rs-core/config/SettingsTypes";
import { DEFAULT_SETTINGS } from "@rs-core/config/SettingsTypes";

//
export const TIMELINE_SECTION: SectionConfig = {
    key: "timeline",
    title: "Timeline Planner",
    icon: "calendar-plus",
    description: "Choose which preference note should seed generated plans.",
    groups: [
        {
            key: "timeline-source",
            label: "Preference note",
            fields: [
                {
                    path: "timeline.source",
                    label: "Source file",
                    type: "select",
                    helper: "Files inside /docs/preferences appear in this list.",
                    options: [{ value: "", label: "(auto)" }]
                }
            ]
        }
    ]
};

//
export const SETTINGS_KEY = "rs-settings";

export const splitPath = (path: string) => path.split(".");
export const getByPath = (source: any, path: string) => splitPath(path).reduce<any>((acc, key) => (acc == null ? acc : acc[key]), source);
export const slugify = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

//
export const loadSettings = async (): Promise<AppSettings> => {
    try {
        const raw = await idbGet(SETTINGS_KEY);
        const stored = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (stored && typeof stored === "object") {
            return {
                ai: { ...DEFAULT_SETTINGS.ai, ...(stored as any)?.ai, mcp: { ...DEFAULT_SETTINGS.ai?.mcp, ...(stored as any)?.ai?.mcp } },
                webdav: { ...DEFAULT_SETTINGS.webdav, ...(stored as any)?.webdav },
                timeline: { ...DEFAULT_SETTINGS.timeline, ...(stored as any)?.timeline }
            };
        }
    } catch (e) {
        console.warn(e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
};

//
export const saveSettings = async (settings: AppSettings) => {
    const current = await loadSettings();
    const merged: AppSettings = {
        ai: {
            ...(DEFAULT_SETTINGS.ai || {}),
            ...(current.ai || {}),
            ...(settings.ai || {}),
            mcp: {
                ...(DEFAULT_SETTINGS.ai?.mcp || {}),
                ...(current.ai?.mcp || {}),
                ...(settings.ai?.mcp || {})
            }
        },
        webdav: {
            ...(DEFAULT_SETTINGS.webdav || {}),
            ...(current.webdav || {}),
            ...(settings.webdav || {})
        },
        timeline: {
            ...(DEFAULT_SETTINGS.timeline || {}),
            ...(current.timeline || {}),
            ...(settings.timeline || {})
        }
    };
    await idbPut(SETTINGS_KEY, merged);
    updateWebDavSettings(merged)?.catch(console.warn.bind(console));
    return merged;
};

//
export const loadTimelineSources = async () => {
    try {
        const root = await getDirectoryHandle(null, "/docs/preferences")?.catch(() => null);
        if (!root) return [] as string[];
        const entries = await Array.fromAsync(root.entries?.() ?? []);
        return entries
            .map((entry: any) => entry?.[0])
            .filter((name: string) => typeof name === "string" && name.trim().length)
            .map((name: string) => name.replace(/\.md$/i, ""));
    } catch (e) {
        console.warn(e);
        return [];
    }
};
