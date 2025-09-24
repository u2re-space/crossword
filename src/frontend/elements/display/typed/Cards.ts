import { isDate, makeEvents, makePropertyDesc } from "@rs-frontend/utils/Formatted";
import { H, M } from "fest/lure";

//
export const _LOG_ = (data: any) => {
    console.log("LOG_", data);
    return data;
}

//
export const insideOfDay = (item: any, dayDesc: any) => {
    return (
        new Date(item.properties?.begin_time) >= new Date(dayDesc.properties?.begin_time) &&
        new Date(item.properties?.end_time) <= new Date(dayDesc.properties?.end_time)
    ) || (!isDate(item.properties?.begin_time) || !isDate(item.properties?.end_time));
}

//
export const MakeCardElement = (label: string, item: any, events: any) => {
    if (!item) return null;

    //
    const begin_time = item?.properties?.begin_time || "";
    const end_time = item?.properties?.end_time || "";
    const variant = item?.desc?.variant || "default";
    const desc = item?.desc?.description || "";

    //
    const card = H`<div data-variant="${variant}" data-type="${label}" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${item?.desc?.icon ? H`<ui-icon icon=${item.desc.icon}></ui-icon>` : (item?.desc?.title?.[0] ?? label?.[0] ?? "C")}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${item?.desc?.title || item?.desc?.name || item?.name || label}</li></ul>
        <ul class="card-kind">${makePropertyDesc("", item, "kind")}</ul>
    </div>
    <div class="card-time">${begin_time} - ${end_time}</div>
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Properties:</span><ul>${M([...Object.entries(item?.properties)], (frag: any) => makePropertyDesc("", frag?.[1], frag?.[0]))}</ul>
    </div>
    <div class="card-description">
        <span class="card-label">Description: </span><ul class="card-desc">${makePropertyDesc("", desc, "")}</ul >
    </div>
</div>`;
    return card;
}

//
export const MakeCardByKind = (label: string, dir: string, item: any, byKind: any | null = null) => {
    if (!item) return null;

    //
    const title = item?.desc?.title || item?.desc?.name || item?.name || label;
    const kind = item?.kind || "";
    if (!(byKind && byKind == kind || !byKind || byKind == "all" || !kind)) return;

    //
    const path = (item as any)?.__path || `${dir}${(item?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents(label, path, title, item, kind);
    return MakeCardElement(label, item, events);
}

//
export const MakeCardByDayDesc = (label: string, dir: string, item: any, dayDesc: any | null = null) => {
    if (!item) return null;

    //
    const title = item?.desc?.title || item?.desc?.name || item?.name || label;
    const kind = item?.kind || "";
    if (dayDesc && !insideOfDay(item, dayDesc)) return;

    //
    const path = (item as any)?.__path || `${dir}${(item?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents(label, path, title, item, kind);
    return MakeCardElement(label, item, events);
}
