import { makeObjectAssignable, makeReactive, stringRef, safe } from "fest/object";
import { makeUIState } from "fest/lure/extension/core/UIState";

export type GridCell = [number, number];

export interface SpeedDialItemMeta {
    action?: string;
    view?: string;
    href?: string;
    description?: string;
    entityType?: string;
    tags?: string[];
    [key: string]: any;
}

export interface SpeedDialPersistedItem {
    id: string;
    cell: GridCell;
    icon: string;
    label: string;
    action: string;
    meta?: SpeedDialItemMeta;
}

type SpeedDialRecord = Omit<SpeedDialPersistedItem, "meta">;

export interface SpeedDialItem {
    id: string;
    cell: ReturnType<typeof makeReactive>;
    icon: ReturnType<typeof stringRef>;
    label: ReturnType<typeof stringRef>;
    action: string;
}

export const NAVIGATION_SHORTCUTS = [
    { view: "task", label: "Plan", icon: "calendar-dots" },
    { view: "event", label: "Events", icon: "calendar-range" },
    { view: "bonus", label: "Bonuses", icon: "ticket" },
    { view: "person", label: "Contacts", icon: "address-book" },
    { view: "explorer", label: "Explorer", icon: "books" },
    { view: "settings", label: "Settings", icon: "gear-six" }
] as const;

const STORAGE_KEY = "cw::workspace::speed-dial";
const META_STORAGE_KEY = `${STORAGE_KEY}::meta`;

const fallbackClone = <T>(value: T): T => {
    if (typeof structuredClone === "function") {
        return structuredClone(safe(value));
    }
    return JSON.parse(JSON.stringify(value));
};

const generateItemId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `sd-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000)}`;
};

const EXTERNAL_SHORTCUTS: SpeedDialPersistedItem[] = [
    {
        id: "shortcut-docs",
        cell: [0, 1],
        icon: "book-open-text",
        label: "Docs",
        action: "open-link",
        meta: { href: "https://github.com/fest-live", description: "Project documentation" }
    },
    {
        id: "shortcut-roadmap",
        cell: [1, 1],
        icon: "signpost",
        label: "Roadmap",
        action: "open-link",
        meta: { href: "https://github.com/u2re-space/unite-2.man", description: "Manifest notes" }
    }
];

const DEFAULT_SPEED_DIAL_DATA: SpeedDialPersistedItem[] = [
    ...NAVIGATION_SHORTCUTS.slice(0, 4).map((target, index) => ({
        id: `shortcut-${target.view}`,
        cell: [index, 0] as GridCell,
        icon: target.icon,
        label: target.label,
        action: "open-view",
        meta: { view: target.view }
    })),
    {
        id: "shortcut-explorer",
        cell: [2, 0],
        icon: "books",
        label: "Explorer",
        action: "open-view",
        meta: { view: "explorer" }
    },
    {
        id: "shortcut-settings",
        cell: [3, 0],
        icon: "gear-six",
        label: "Settings",
        action: "open-view",
        meta: { view: "settings" }
    },
    ...EXTERNAL_SHORTCUTS
];

const splitDefaultEntries = (entries: SpeedDialPersistedItem[]) => {
    const records: SpeedDialRecord[] = [];
    const metaEntries: Array<[string, SpeedDialItemMeta]> = [];
    entries.forEach((entry) => {
        const { meta, ...record } = entry;
        records.push(record as SpeedDialRecord);
        const normalizedMeta: SpeedDialItemMeta = { action: entry.action, ...(meta || {}) };
        metaEntries.push([entry.id, normalizedMeta]);
    });
    return { records, metaEntries };
};

const { records: DEFAULT_SPEED_DIAL_RECORDS, metaEntries: DEFAULT_META_ENTRIES } = splitDefaultEntries(DEFAULT_SPEED_DIAL_DATA);
const legacyMetaBuffer: Array<[string, SpeedDialItemMeta]> = [];

const ensureCell = (cell?: GridCell): GridCell => {
    if (Array.isArray(cell) && cell.length >= 2) {
        return [Number(cell[0]) || 0, Number(cell[1]) || 0];
    }
    return [0, 0];
};

const createMetaState = (meta: SpeedDialItemMeta = {}) => {
    return makeObjectAssignable(makeReactive({
        action: meta.action || "open-view",
        view: meta.view || "",
        href: meta.href || "",
        description: meta.description || "",
        entityType: meta.entityType || "",
        tags: Array.isArray(meta.tags) ? [...meta.tags] : [],
        ...meta
    }));
};

export type SpeedDialMetaEntry = ReturnType<typeof createMetaState>;
export type SpeedDialMetaRegistry = Map<string, SpeedDialMetaEntry>;

const registryFromEntries = (entries: Iterable<[string, SpeedDialItemMeta]>) => {
    const registry = new Map<string, SpeedDialMetaEntry>();
    for (const [id, meta] of entries) {
        registry.set(id, createMetaState(meta));
    }
    return registry as SpeedDialMetaRegistry;
};

const normalizeMetaEntries = (raw?: any): Array<[string, SpeedDialItemMeta]> => {
    if (!raw) return [];
    if (raw instanceof Map) {
        return Array.from(raw.entries());
    }
    if (Array.isArray(raw)) {
        return raw
            .map((entry: any) => {
                if (entry && typeof entry === "object" && "id" in entry) {
                    return [entry.id, (entry.meta || entry) as SpeedDialItemMeta] as [string, SpeedDialItemMeta];
                }
                return null;
            })
            .filter(Boolean) as Array<[string, SpeedDialItemMeta]>;
    }
    if (typeof raw === "object") {
        return Object.entries(raw as Record<string, SpeedDialItemMeta>) as Array<[string, SpeedDialItemMeta]>;
    }
    return [];
};

const packMetaRegistry = (registry: SpeedDialMetaRegistry) => {
    const payload: Record<string, SpeedDialItemMeta> = {};
    registry?.forEach((meta, id) => {
        payload[id] = fallbackClone(meta ?? {});
    });
    return payload;
};

const createInitialMetaRegistry = () => registryFromEntries(DEFAULT_META_ENTRIES);
const unpackMetaRegistry = (raw?: any) => {
    const entries = normalizeMetaEntries(raw);
    return registryFromEntries(entries.length ? entries : DEFAULT_META_ENTRIES);
};

export const speedDialMeta = makeUIState(META_STORAGE_KEY, createInitialMetaRegistry, unpackMetaRegistry, packMetaRegistry) as unknown as SpeedDialMetaRegistry;

export const persistSpeedDialMeta = () => (speedDialMeta as any)?.$save?.();

export const getSpeedDialMeta = (id?: string | null) => {
    if (!id) return null;
    return speedDialMeta?.get?.(id) ?? null;
};

export const ensureSpeedDialMeta = (id: string, defaults: SpeedDialItemMeta = {}) => {
    let meta = speedDialMeta?.get?.(id);
    if (!meta) {
        meta = createMetaState(defaults);
        speedDialMeta?.set?.(id, meta);
        persistSpeedDialMeta();
    }
    if (defaults?.action && meta.action !== defaults.action) {
        meta.action = defaults.action;
    }
    return meta;
};

export const removeSpeedDialMeta = (id: string) => {
    const removed = speedDialMeta?.delete?.(id);
    if (removed) {
        persistSpeedDialMeta();
    }
    return removed;
};

const createStatefulItem = (config: SpeedDialRecord): SpeedDialItem => {
    return {
        id: config.id || generateItemId(),
        cell: makeReactive(ensureCell(config.cell)),
        icon: stringRef(config.icon || "sparkle"),
        label: stringRef(config.label || "Shortcut"),
        action: config.action || "open-view"
    };
};

const unwrapRef = (value: any, fallback?: string) => {
    if (value && typeof value === "object" && "value" in value) {
        return value.value ?? fallback;
    }
    return value ?? fallback;
};

const serializeItemState = (item: SpeedDialItem): SpeedDialRecord => {
    return {
        id: item.id,
        cell: [item.cell?.[0] ?? 0, item.cell?.[1] ?? 0] as GridCell,
        icon: unwrapRef(item.icon, "sparkle"),
        label: unwrapRef(item.label, "Shortcut"),
        action: item.action
    };
};

const createInitialState = () => makeReactive(DEFAULT_SPEED_DIAL_RECORDS.map(createStatefulItem));
const unpackState = (raw?: SpeedDialPersistedItem[]) => {
    const source = Array.isArray(raw) && raw.length ? raw : DEFAULT_SPEED_DIAL_DATA;
    const records = source.map((entry) => {
        const { meta, ...record } = entry;
        if (meta) {
            legacyMetaBuffer.push([entry.id, { action: entry.action, ...meta }]);
        } else {
            legacyMetaBuffer.push([entry.id, { action: entry.action }]);
        }
        return record as SpeedDialRecord;
    });
    return makeReactive(records.map(createStatefulItem));
};
const packState = (collection: SpeedDialItem[]) => collection.map(serializeItemState);

export const speedDialItems = makeUIState(STORAGE_KEY, createInitialState, unpackState, packState) as unknown as SpeedDialItem[];

const syncMetaActionFromItem = (item?: SpeedDialItem | null) => {
    if (!item) return false;
    const desiredAction = item.action || "open-view";
    const meta = ensureSpeedDialMeta(item.id, { action: desiredAction });
    if (meta.action !== desiredAction) {
        meta.action = desiredAction;
        return true;
    }
    return false;
};

const syncMetaActionsForAllItems = () => {
    let changed = false;
    speedDialItems?.forEach?.((item) => {
        if (syncMetaActionFromItem(item)) {
            changed = true;
        }
    });
    if (changed) {
        persistSpeedDialMeta();
    }
};

const flushLegacyMetaBuffer = () => {
    if (!legacyMetaBuffer.length) return;
    legacyMetaBuffer.forEach(([id, meta]) => {
        const target = ensureSpeedDialMeta(id, meta);
        Object.assign(target, meta);
    });
    legacyMetaBuffer.length = 0;
    persistSpeedDialMeta();
};

flushLegacyMetaBuffer();
syncMetaActionsForAllItems();

export const persistSpeedDialItems = () => (speedDialItems as any)?.$save?.();

export const findSpeedDialItem = (id?: string | null) => {
    if (!id) return null;
    return speedDialItems?.find?.((item) => item?.id === id) || null;
};

export const createEmptySpeedDialItem = (cell: GridCell = [0, 0]): SpeedDialItem => {
    const item = createStatefulItem({
        id: generateItemId(),
        cell,
        icon: "sparkle",
        label: "New shortcut",
        action: "open-link"
    });
    ensureSpeedDialMeta(item.id, { action: item.action, href: "", description: "" });
    return item;
};

export const addSpeedDialItem = (item: SpeedDialItem) => {
    speedDialItems?.push?.(item);
    const metaChanged = syncMetaActionFromItem(item);
    persistSpeedDialItems();
    if (metaChanged) {
        persistSpeedDialMeta();
    }
    return item;
};

export const upsertSpeedDialItem = (item: SpeedDialItem) => {
    const existingIndex = speedDialItems?.findIndex?.((entry) => entry?.id === item?.id) ?? -1;
    if (existingIndex === -1) {
        speedDialItems?.push?.(item);
    } else if (speedDialItems[existingIndex] !== item) {
        speedDialItems.splice(existingIndex, 1, item);
    }
    const metaChanged = syncMetaActionFromItem(item);
    persistSpeedDialItems();
    if (metaChanged) {
        persistSpeedDialMeta();
    }
    return item;
};

export const removeSpeedDialItem = (id: string) => {
    const index = speedDialItems?.findIndex?.((entry) => entry?.id === id) ?? -1;
    if (index === -1) return false;
    speedDialItems.splice(index, 1);
    removeSpeedDialMeta(id);
    persistSpeedDialItems();
    return true;
};

export const snapshotSpeedDialItem = (item: SpeedDialItem) => {
    const meta = getSpeedDialMeta(item.id);
    const resolvedAction = meta?.action || item.action;
    const metaSnapshot = fallbackClone(meta ?? {});
    if (!metaSnapshot.action) {
        metaSnapshot.action = resolvedAction;
    }
    return {
        state: {
            id: item.id,
            cell: [item.cell?.[0] ?? 0, item.cell?.[1] ?? 0] as GridCell,
            icon: unwrapRef(item.icon, ""),
            label: unwrapRef(item.label, "")
        },
        desc: {
            action: resolvedAction,
            meta: metaSnapshot
        }
    };
};

