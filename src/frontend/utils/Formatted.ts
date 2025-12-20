import { parseDateCorrectly, getISOWeekNumber } from "@rs-core/utils/TimeUtils";
import { writeText } from "@rs-frontend/shared/Clipboard";

//
export const beginDragAsText = (ev: DragEvent) => {
    const text = (ev.currentTarget as HTMLElement)?.textContent?.trim?.();
    if (text) {
        ev.dataTransfer!.effectAllowed = "copy";
        ev.dataTransfer?.clearData?.();
        ev.dataTransfer?.setData?.("plain/text", text);
    }
}

//
export const copyPhoneClick = (ev: Event) => {
    const element = (ev.currentTarget as any);
    const isPhoneElement = (element as HTMLElement)?.matches?.('.phone') ? element : element?.querySelector?.('.phone');

    if (isPhoneElement) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        const phone = isPhoneElement?.textContent?.trim?.() ?? '';
        if (phone) writeText(phone);
    }
}

//
export const copyEmailClick = (ev: Event) => {
    const element = (ev.currentTarget as any);
    const isEmailElement = (element as HTMLElement)?.matches?.('.email') ? element : element?.querySelector?.('.email');

    if (isEmailElement) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        const email = isEmailElement?.textContent?.trim?.() ?? '';
        if (email) writeText(email);
    }
}





//
export const ensureDate = (value: any): Date | null => {
    if (!value) return null;
    const parsed = parseDateCorrectly(value);
    if (!parsed) return null;
    const time = parsed.getTime?.();
    return Number.isFinite(time) ? parsed : null;
};

export const resolveBeginDate = (dayDesc: any): Date | null => {
    return ensureDate(dayDesc?.begin_time ?? dayDesc?.properties?.begin_time ?? dayDesc?.start);
};

//
const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const buildPrimaryDayTitle = (dayDesc: any): string => {
    const preset = dayDesc?.separatorTitle;
    if (typeof preset === "string" && preset.trim()) {
        return preset;
    }

    const date = resolveBeginDate(dayDesc);
    if (!date) {
        return dayDesc?.title || dayDesc?.id || "Day";
    }

    const formatted = date.toLocaleDateString("en-GB", {
        timeZone: getTimeZone(),
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const week = dayDesc?.weekNumber ?? getISOWeekNumber(date);
    if (week && formatted) {
        return `${formatted} · Week ${week}`;
    }
    return formatted;
};

export const buildSecondaryDayTitle = (dayDesc: any, primary: string): string | null => {
    const label = dayDesc?.title;
    if (!label) return null;
    if (!primary) return label;
    return label.trim() === primary.trim() ? null : label;
};





//
export const isNotEmpty = (frag: any) => {
    return !!(typeof frag == "string" ? frag?.trim?.() : frag);
}


//
export const MAKE_LABEL = (label: string) => {
    //return label?.replace?.(/_/g, " ");

    // by default, just capitalize first letter and replace `_` with ` `
    return label?.charAt?.(0)?.toUpperCase?.() + label?.slice?.(1)?.replace?.(/_/g, " ");
}

//
export const makeObjectEntries = (object: any) => {
    if (!object) return [];
    if (typeof object == "object" || typeof object == "function") {
        return [...Object.entries(object)];
    }
    return [];
}

//
export const countLines = (text: string | any) => {
    if (!text) {
        return 0; // Handle empty or null input
    }
    return Array.isArray(text) ? text?.length : text?.split?.(/\r\n|\r|\n/)?.length;
}

//
export const wrapBySpan = (text: string | any) => {
    if (!text) return "";
    return `<span>${Array.isArray(text) ? text?.join?.(",") : text}</span>`;
}

//
export interface CardRenderOptions {
    order?: number | null | undefined;
}

//
export const cropFirstLetter = (text: string | any) => {
    return text?.charAt?.(0)?.toUpperCase?.() /*+ text?.slice?.(1) ||*/ || "C";
}

//
export const startCase = (value: string) =>
    value.replace(/[_\-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^./, (char) => char.toUpperCase());

//
export const splitPath = (path: string) => path.split(".").filter(Boolean);
export const getByPath = (source: any, path: string) => splitPath(path).reduce((acc, key) => (acc == null ? acc : acc[key]), source);
export const setByPath = (target: any, path: string, value: any) => {
    const keys = splitPath(path);
    if (!keys.length) return;
    let current = target;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (typeof current[key] !== "object" || current[key] === null) current[key] = {};
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
};

//
export const unsetByPath = (target: any, path: string) => {
    const keys = splitPath(path);
    if (!keys.length) return;
    const parents: Array<[any, string]> = [];
    let current = target;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current?.[key] === undefined) return;
        parents.push([current, key]);
        current = current[key];
        if (typeof current !== "object" || current === null) return;
    }
    const lastKey = keys[keys.length - 1];
    if (current && Object.prototype.hasOwnProperty.call(current, lastKey)) {
        delete current[lastKey];
        for (let i = parents.length - 1; i >= 0; i--) {
            const [parent, key] = parents[i];
            const value = parent[key];
            if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) delete parent[key];
            else break;
        }
    }
};

//
export const toMultiline = (value: unknown): string => {
    if (!value) return "";
    if (Array.isArray(value)) return value.map((item) => (item ?? "").toString().trim()).filter(Boolean).join("\n");
    return String(value ?? "");
};

//
export const fromMultiline = (value: string): string[] => {
    if (!value) return [];
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

const toStringSafe = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const stripMarkdown = (value: unknown): string => {
    const input = toStringSafe(value);
    if (!input) return "";
    return input
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^\)]+\)/g, " ")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/(^|\n)\s{0,3}>\s?/g, "$1")
        .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, "$1")
        .replace(/(^|\n)\s{0,3}[-*+]\s+/g, "$1")
        .replace(/(^|\n)\s{0,3}\d+\.\s+/g, "$1")
        .replace(/(^|\n)---[\s\S]*?---(?=\n|$)/g, "$1")
        .replace(/[\\*_~]/g, "")
        .replace(/`/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/<\/?[^>]+>/g, " ");
};


export const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const sanitizeDocSnippet = (value: unknown): string => collapseWhitespace(stripMarkdown(value));

export const truncateDocSnippet = (value: string, limit = 260): string => {
    const trimmed = value.trim();
    if (!limit || trimmed.length <= limit) return trimmed;
    return `${trimmed.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
};
