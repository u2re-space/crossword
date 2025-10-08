import { observableByMap, observableBySet } from "fest/object";
import { H, M } from "fest/lure";
import { parseDateCorrectly, getISOWeekNumber } from "@rs-frontend/elements/entities/utils/TimeUtils";




/*
//
export const _LOG_ = (data: any) => {
    console.log("LOG_", data);
    return data;
}
*/




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
        if (phone) { navigator.clipboard.writeText(phone); }
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
        if (email) { navigator.clipboard.writeText(email); }
    }
}

//
export const formatTextElement = (text: string) => {
    const normalized = text?.trim?.();
    if (!normalized) return null;
    return H`<span draggable="true" data-action="copy-text" class="text">${normalized}</span>`;
}

//
export const formatEmailElement = (email: string) => {
    const normalized = email?.trim?.();
    if (!normalized) return null;
    return H`<a on:dragstart=${beginDragAsText} draggable="true" data-action="copy-email" class="email" href="mailto:${normalized}" on:click=${copyEmailClick}>${normalized}</a>`;
}


//
export const formatPhoneElement = (phone: string) => {
    let text = phone ?? "";
    text = text.replace(/\+7/g, '8').replace(/\s+/g, '').replace(/[^0-9]/g, '');
    text = text.replace(/\(/g, '').replace(/\)/g, '');
    text = text.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const normalized = text.trim();
    if (!normalized) return null;
    return H`<a on:dragstart=${beginDragAsText} draggable="true" data-action="copy-phone" class="phone" href="tel:${normalized}" on:click=${copyPhoneClick}>${normalized}</a>`;
}

//
export const wrapAsListItem = (label: string | any, item: any) => {
    if (!item) return null;
    if (label) {
        return H`<li><span class="item-label">${label}</span>: ${item}</li>`;
    }
    return H`<li>${item}</li>`;
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

export const makeDayHeader = (dayDesc: any, onToggle: (ev: Event) => void) => {
    const primary = buildPrimaryDayTitle(dayDesc);
    const secondary = buildSecondaryDayTitle(dayDesc, primary);
    return H`<header class="timeline-day-header" on:click=${onToggle}>
        <div class="timeline-day-divider"><span>${primary}</span></div>
        ${secondary ? H`<p class="timeline-day-meta">${secondary}</p>` : null}
    </header>`;
};

//
export const listFormatter = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>, formatter: (frag: any) => any) => {
    if (Array.isArray(text)) {
        const collection = text.map?.((frag: any) => formatter(frag))?.filter(Boolean);
        return collection?.length ? wrapAsListItem(label, M(collection, (item: any) => item)) : null;
    }
    if (text instanceof Map) {
        const mapped = M(observableByMap(text), (frag: any) => formatter(frag));
        return wrapAsListItem(label, mapped);
    }
    if (text instanceof Set) {
        const mapped = M(observableBySet(text), (frag: any) => formatter(frag));
        return wrapAsListItem(label, mapped);
    }
    return wrapAsListItem(label, formatter(text));
}

//
export const renderAddress = (address: any) => {
    if (typeof address == "string") return H`<span class="address">${address}</span>`;

    //
    const parts: any[] = [];
    if (address?.street)
        parts.push(H`<span class="address street">${address.street}</span>`);
    if (address?.square)
        parts.push(H`<span class="address square">${address.square}</span>`);
    if (address?.house)
        parts.push(H`<span class="address house">${address.house}</span>`);
    if (address?.flat)
        parts.push(H`<span class="address flat">${address.flat}</span>`);
    if (address?.floor)
        parts.push(H`<span class="address floor">${address.floor}</span>`);
    if (address?.room)
        parts.push(H`<span class="address room">${address.room}</span>`);

    //
    return parts;
}

//
export const formatLocation = (location: any) => {
    if (location?.address)
        return H`<span class="location">${renderAddress(location.address)}</span>`;
}

//
export const formatBiography = (biography: any) => {
    return H`<span class="biography">${biography.firstName?.join?.(" ") || ((biography.firstName || "") + " ")} ${biography.lastName?.join?.(" ") || ((biography.lastName || "") + " ")} ${biography.nickName?.join?.(" ") || ((biography.nickName || "") + " ")}</span>`;
}


//
export const formatTextList = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>) => {
    return listFormatter(label, text, formatTextElement);
};

//
export const formatEmailList = (label: string | any, emails: string | string[] | Set<any> | any[] | Map<any, any>) => {
    return listFormatter(label, emails, formatEmailElement);
}

//
export const formatPhoneList = (label: string | any, phones: string | string[] | Set<any> | any[] | Map<any, any>) => {
    return listFormatter(label, phones, formatPhoneElement);
}

//
export const formatBiographyList = (label: string | any, biography: any | any[] | Map<any, any>) => {
    return listFormatter(label, biography, formatBiography);
}

//
export const formatLocationList = (label: string | any, location: any | any[] | Map<any, any>) => {
    return listFormatter(label, location, formatLocation);
}


//
export const formatByCondition = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>, key: string | null = null) => {
    if (!text) return null;
    if (key == "begin_time" || key == "end_time" || key == "status") { return; }
    if (key == "phone") { return formatPhoneList(label || "Phone", text); }
    if (key == "email") { return formatEmailList(label || "Email", text); }
    if (key == "biography") { return formatBiographyList(label || "Biography", text); }
    if (key == "location") { return formatLocationList(label || "Location", text); }

    //
    if (typeof text != "object") return formatTextList(label, text);
    if (typeof text == "object" && key && text?.[key] != null && typeof text?.[key] != "object") { return formatTextList(label, text?.[key]);; }

    //
    if (typeof text == "object") {
        return [...Object.entries(text)].map(([K, Sb]: any) => {
            return formatByCondition("", Sb, K || key);
        })?.filter?.((e: any) => e);
    }

    //
    return formatTextList(label, text);
}

//
export const isNotEmpty = (frag: any) => {
    return !!(typeof frag == "string" ? frag?.trim?.() : frag);
}

//
export const makePropertyDesc = (label: string | any, property: any, key?: string | null) => {
    let basis = property;
    if (!isNotEmpty(basis)) return null;

    // handle lists, maps, sets, etc.
    return formatByCondition(label, basis, key);
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