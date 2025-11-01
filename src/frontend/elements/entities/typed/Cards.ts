import { countLines, cropFirstLetter, MAKE_LABEL, makeObjectEntries, makePropertyDesc, wrapBySpan, type CardRenderOptions } from "../utils/Formatted";
import { H, M } from "fest/lure";
import { formatAsTime } from "@rs-core/utils/TimeUtils";
import type { EntityDescriptor } from "../../../../core/utils/Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";

//
import { marked } from "marked"
import markedKatex from "marked-katex-extension";
import { makeEvents, objectExcludeNotExists } from "@rs-frontend/elements/editors/EntityEdit";
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

    //<span class="card-label">Entity: </span><ul class="card-properties">${M(makeObjectEntries(objectExcludeNotExists(entityDesc)), (frag: any) => makePropertyDesc(MAKE_LABEL(frag?.[0]), frag?.[1], frag?.[0]))}</ul>

    //
    const events = makeEvents(entityItem, entityDesc);
    const linksPlaceholder = H`<div class="card-links"></div>` as HTMLElement;
    const card = H`<div data-id=${entityItem?.id || entityItem?.name} data-variant="${variant}" data-type="${entityDesc.type}" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${entityItem?.icon ? H`<ui-icon icon=${entityItem?.icon}></ui-icon>` : cropFirstLetter(entityItem?.title ?? entityDesc.label ?? "C")}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${entityItem?.title || entityItem?.name || entityDesc.label}</li></ul>
        <ul class="card-kind"><li>${entityItem?.kind}</li></ul>
    </div>
    ${timeRangeElement}
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-description">
        <span class="card-label">Description: </span>
        <div class="card-description-content">
            ${H(marked.parse((Array.isArray(description) ? description?.map?.((frag) => wrapBySpan(frag?.trim?.()))?.join("<br>") : wrapBySpan(description?.trim?.()))?.trim?.() || ""))}
        </div>
    </div>
    <div class="card-content">
        <span class="card-label">Properties: </span>
        <ul class="card-properties">${M(makeObjectEntries(objectExcludeNotExists(entityItem?.properties)), (frag: any) => makePropertyDesc(MAKE_LABEL(frag?.[0]), frag?.[1], frag?.[0]))}</ul>
    </div>
    ${linksPlaceholder}
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


    //
    const updateCardInfo = ($entityItem: E = entityItem) => {
        // Update card content
        const titleEl = card.querySelector('.card-title');
        if (titleEl && $entityItem.title) titleEl.textContent = $entityItem.title;

        const nameEl = card.querySelector('.card-name');
        if (nameEl && $entityItem.name) nameEl.textContent = $entityItem.name;

        const descEl = card.querySelector('.card-description');
        if (descEl && $entityItem.description) {
            const desc = Array.isArray($entityItem.description)
                ? $entityItem.description.join('\n')
                : $entityItem.description;
            descEl.textContent = desc;
        }

        const kindEl = card.querySelector('.card-kind');
        if (kindEl && $entityItem.kind) kindEl.textContent = $entityItem.kind;

        const timeRangeEl = card.querySelector('.card-time');
        if (timeRangeEl && $entityItem.properties?.begin_time && $entityItem.properties?.end_time) timeRangeEl.textContent = `${formatAsTime($entityItem.properties?.begin_time)} - ${formatAsTime($entityItem.properties?.end_time)}`;

        const linksEl = card.querySelector('.card-links');
        if (linksEl && $entityItem.properties?.links) {
            linksEl.textContent = $entityItem.properties?.links.join('\n');
        }

        const tagsEl = card.querySelector('.card-tags');
        if (tagsEl && $entityItem.tags) {
            tagsEl.textContent = $entityItem.tags.join('\n');
        }

        const imageEl = card.querySelector('.card-image');
        if (imageEl && $entityItem.image) {
            imageEl.src = $entityItem.image;
        }

        const variantEl = card.querySelector('.card-variant');
        if (variantEl && $entityItem.variant) {
            variantEl.textContent = $entityItem.variant;
        }
    }

    //
    card.$updateInfo = updateCardInfo;
    return card;
}
