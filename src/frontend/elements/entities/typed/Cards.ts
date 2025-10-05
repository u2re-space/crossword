import { countLines, cropFirstLetter, MAKE_LABEL, makeObjectEntries, makePath, makePropertyDesc, wrapBySpan, type CardRenderOptions } from "../utils/Formatted";
import { makeEvents, objectExcludeNotExists } from "@rs-frontend/elements/entities/edits/EntityEdit";
import { H, M } from "fest/lure";
import { formatAsTime } from "@rs-frontend/elements/entities/utils/TimeUtils";
import type { EntityDescriptor } from "./Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";

//
import { marked } from "marked"
import markedKatex from "marked-katex-extension";
marked.use(markedKatex({
    throwOnError: false,
    nonStandard: true
}) as any);

//
export const MakeCardElement = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    T extends EntityDescriptor = EntityDescriptor
>(
    entityItem: E,
    entityDesc: T,
    options: CardRenderOptions = {}
) => {
    if (!entityItem) return null;

    //
    const begin_time = formatAsTime(entityItem?.properties?.begin_time) || "";
    const end_time = formatAsTime(entityItem?.properties?.end_time) || "";
    const variant = entityItem?.variant || "default";
    let description = entityItem?.description || "";

    //
    if (typeof description === "string" && countLines(description) <= 1) {
        description = description?.split?.(",") ?? [];
    }

    let timeRangeElement = null;
    if (begin_time && end_time) {
        timeRangeElement = H`<div class="card-time">${begin_time} - ${end_time}</div>`;
    }

    //
    const events = makeEvents(entityDesc, entityItem, makePath(entityItem, entityDesc));
    const linksPlaceholder = H`<div class="card-links"></div>` as HTMLElement;
    const card = H`<div data-id=${entityItem?.id || entityItem?.name} data-variant="${variant}" data-type="${entityDesc.type}" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${entityItem?.icon ? H`<ui-icon icon=${entityItem?.icon}></ui-icon>` : cropFirstLetter(entityItem?.title ?? entityDesc.label ?? "C")}</div> // @ts-ignore
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${entityItem?.title || entityItem?.name || entityDesc.label}</li></ul> // @ts-ignore
        <ul class="card-kind"><li>${entityItem?.kind || entityItem?.kind}</li></ul>
    </div>
    ${timeRangeElement}
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Properties: </span><ul class="card-properties">${M(makeObjectEntries(objectExcludeNotExists(entityItem?.properties)), (frag: any) => makePropertyDesc(MAKE_LABEL(frag?.[0]), frag?.[1], frag?.[0]))}</ul>
        <span class="card-label">Entity: </span><ul class="card-properties">${M(makeObjectEntries(objectExcludeNotExists(entityDesc)), (frag: any) => makePropertyDesc(MAKE_LABEL(frag?.[0]), frag?.[1], frag?.[0]))}</ul> // @ts-ignore
    </div>
    ${linksPlaceholder}
    <div class="card-description">
        <span class="card-label">Description: </span>
        <div class="card-description-content">
            ${H(marked.parse((Array.isArray(description) ? description?.map?.((frag) => wrapBySpan(frag?.trim?.()))?.join("<br>") : wrapBySpan(description?.trim?.()))?.trim?.() || ""))}
        </div>
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
