import { makePropertyDesc } from "@rs-frontend/utils/Formatted";
import { makeEvents, objectExcludeNotExists } from "@rs-frontend/elements/display/edits/EntityEdit";
import { H, M } from "fest/lure";
import { marked } from "marked"
import markedKatex from "marked-katex-extension";
import { insideOfDay, notInPast, parseDateCorrectly } from "@rs-core/utils/TimeUtils";

//
const normalizeSchedule = (value: any): any => {
    if (!value) return null;
    if (typeof value === "object" && (value.date || value.iso_date || value.timestamp)) {
        return value;
    }
    return { iso_date: value };
};

const formatAsTime = (time: any) => {
    const normalized = normalizeSchedule(time);
    if (!normalized) return "";
    return parseDateCorrectly(normalized)?.toLocaleTimeString?.("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

//
marked.use(markedKatex({
    throwOnError: false,
    nonStandard: true
}) as any);

//
export const _LOG_ = (data: any) => {
    console.log("LOG_", data);
    return data;
}

//
export const MAKE_LABEL = (label: string) => {
    //return label?.replace?.(/_/g, " ");

    // by default, just capitalize first letter and replace `_` with ` `
    return label?.charAt?.(0)?.toUpperCase?.() + label?.slice?.(1)?.replace?.(/_/g, " ");
}

//
const makeObjectEntries = (object: any) => {
    if (!object) return [];
    if (typeof object == "object" || typeof object == "function") {
        return [...Object.entries(object)];
    }
    return [];
}

function countLines(text: string | any) {
    if (!text) {
        return 0; // Handle empty or null input
    }
    return Array.isArray(text) ? text?.length : text?.split?.(/\r\n|\r|\n/)?.length;
}

//
const wrapBySpan = (text: string | any) => {
    if (!text) return "";
    return `<span>${Array.isArray(text) ? text?.join?.(",") : text}</span>`;
}

//
export interface CardRenderOptions {
    order?: number | null | undefined;
}

//
const cropFirstLetter = (text: string | any) => {
    return text?.charAt?.(0)?.toUpperCase?.() /*+ text?.slice?.(1) ||*/ || "C";
}

//
export const MakeCardElement = (label: string, item: any, events: any, options: CardRenderOptions = {}) => {
    if (!item) return null;

    //
    const begin_time = formatAsTime(item?.properties?.begin_time) || "";
    const end_time = formatAsTime(item?.properties?.end_time) || "";
    const variant = item?.variant || "default";
    let description = item?.description || "";

    //
    if (countLines(description) <= 1) {
        description = description?.split?.(",");
    }

    let timeRangeElement = null;
    if (begin_time && end_time) {
        timeRangeElement = H`<div class="card-time">${begin_time} - ${end_time}</div>`;
    }

    const linksPlaceholder = H`<div class="card-links"></div>` as HTMLElement;
    const card = H`<div data-id=${item?.id || item?.name} data-variant="${variant}" data-type="${label}" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${item?.icon ? H`<ui-icon icon=${item?.icon}></ui-icon>` : cropFirstLetter(item?.title ?? label ?? "C")}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${item?.title || item?.name || label}</li></ul>
        <ul class="card-kind"><li>${item?.kind || item?.kind}</li></ul>
    </div>
    ${timeRangeElement}
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Properties: </span><ul>${M(makeObjectEntries(objectExcludeNotExists(item?.properties)), (frag: any) => makePropertyDesc(MAKE_LABEL(frag?.[0]), frag?.[1], frag?.[0]))}</ul>
    </div>
    ${linksPlaceholder}
    <div class="card-description">
        <span class="card-label">Description: </span>
        ${H(marked.parse((Array.isArray(description) ? description?.map?.((frag) => wrapBySpan(frag?.trim?.()))?.join("<br>") : wrapBySpan(description?.trim?.()))?.trim?.() || ""))}
    </div>
</div>`;
    const orderValue = options?.order;
    if (typeof orderValue === "number" && Number.isFinite(orderValue)) {
        try {
            card.style.order = Math.trunc(orderValue).toString();
            card.dataset.order = card.style.order;
            card.style.setProperty("--card-order", card.style.order);
        } catch (e) {
            console.warn("Failed to set card order", e);
        }
    }

    return card;
}

//
export const MakeCardByKind = (label: string, dir: string, item: any, byKind: any | null = null) => {
    if (!item) return null;

    //
    const title = item?.title || item?.name || item?.id || label;
    const kind = item?.kind || "";
    if (!kind || !byKind || byKind == kind || byKind == "all" || kind == "all") {
        const fileId = item?.id || item?.name;
        const path = (item as any)?.__path || `${dir}${(fileId || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
        if (!path) return null;

        //
        const events = makeEvents(label, path, title, item, kind);
        return MakeCardElement(label, item, events);
    }
}

//
const getComparableTimeValue = (value: any): number => {
    if (value == null) return Number.NaN;

    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    const date = parseDateCorrectly(value);
    if (date && !Number.isNaN(date?.getTime())) {
        return date?.getTime() ?? 0;
    }

    const match = String(value).match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?/);
    if (match) {
        const hours = Number(match[1]) || 0;
        const minutes = Number(match[2]) || 0;
        const seconds = Number(match[3]) || 0;
        return ((hours * 60 + minutes) * 60 + seconds) * 1000;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const computeTimelineOrder = (item: any, dayDesc: any | null = null): number | null => {
    const beginTime = getComparableTimeValue(item?.properties?.begin_time ?? null);
    const endTime = getComparableTimeValue(item?.properties?.end_time ?? null);
    const fallback = Number.isFinite(beginTime) ? beginTime : endTime;
    if (!Number.isFinite(fallback)) {
        return null;
    }

    const dayStart = getComparableTimeValue(dayDesc?.properties?.begin_time ?? null);
    const normalized = Number.isFinite(dayStart) ? fallback - dayStart : fallback;
    return Math.round(normalized / 60000); // normalize to minutes to keep values small
};

export const MakeCardByDayDesc = (label: string, dir: string, item: any, dayDesc: any | null = null) => {
    if (!item) return null;

    //
    const title = item?.title || item?.name || label;
    const kind = item?.kind || "";
    if (dayDesc && (!insideOfDay(item, dayDesc) || !notInPast(item, dayDesc))) return;

    //
    const fileId = item?.id || item?.name;
    const path = (item as any)?.__path || `${dir}${(fileId || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents(label, path, title, item, kind);
    const order = computeTimelineOrder(item, dayDesc);
    return MakeCardElement(label, item, events, { order });
}
