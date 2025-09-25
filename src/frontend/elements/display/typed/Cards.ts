import { insideOfDay, makePropertyDesc } from "@rs-frontend/utils/Formatted";
import { makeEvents, objectExcludeNotExists } from "@rs-frontend/elements/display/edits/EntityEdit";
import { getLinkedEntities } from "@rs-frontend/utils/Links";
import { H, M } from "fest/lure";

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

//
export const MakeCardElement = (label: string, item: any, events: any) => {
    if (!item) return null;

    const begin_time = item?.properties?.begin_time || "";
    const end_time = item?.properties?.end_time || "";
    const variant = item?.desc?.variant || "default";
    const desc = item?.desc?.description || "";

    let linkedList: any = null;
    const renderLinks = (links: any[]) => {
        if (!links?.length) return null;
        return H`<div class="card-links"><span class="card-label">Links:</span><ul>${M(links, (link) => H`<li><a href=${`#${link.type}-${link.id}`} data-link-type=${link.type}>${link.title || link.id}</a></li>`)}</ul></div>`;
    };

    (async () => {
        const links = await getLinkedEntities(item);
        linkedList?.replaceChildren?.(renderLinks(links) ?? "");
    })().catch(console.warn);

    let timeRangeElement = null;
    if (begin_time && end_time) {
        timeRangeElement = H`<div class="card-time">${begin_time} - ${end_time}</div>`;
    }

    const linksPlaceholder = H`<div class="card-links"></div>` as HTMLElement;
    linkedList = linksPlaceholder;

    const card = H`<div data-id=${item?.id || item?.name || item?.desc?.name} data-variant="${variant}" data-type="${label}" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${item?.desc?.icon ? H`<ui-icon icon=${item.desc.icon}></ui-icon>` : (item?.desc?.title?.[0] ?? label?.[0] ?? "C")}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${item?.desc?.title || item?.name || label}</li></ul>
        <ul class="card-kind"><li>${item?.desc?.kind || item?.kind}</li></ul>
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
        <span class="card-label">Description: </span><ul>${makePropertyDesc("", item?.desc, "description")}</ul>
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
    if (!(!byKind || byKind == "all" || !kind || byKind == kind)) return;

    //
    const fileId = item?.id || item?.name || item?.desc?.name;
    const path = (item as any)?.__path || `${dir}${(fileId || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
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
    const fileId = item?.id || item?.name || item?.desc?.name;
    const path = (item as any)?.__path || `${dir}${(fileId || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents(label, path, title, item, kind);
    return MakeCardElement(label, item, events);
}
