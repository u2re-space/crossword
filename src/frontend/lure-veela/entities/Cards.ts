import { countLines, cropFirstLetter, MAKE_LABEL, makeObjectEntries, wrapBySpan, type CardRenderOptions } from "@rs-frontend/utils/Formatted";
import { H, M } from "fest/lure";
import { formatAsTime } from "@rs-core/utils/TimeUtils";
import type { EntityDescriptor } from "@rs-core/utils/Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { iconsPerAction, labelsPerAction } from "@rs-frontend/utils/Actions";

//
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import { makeEvents, objectExcludeNotExists } from "@rs-frontend/lure-veela/editors/EntityEdit";
import { makePropertyDesc } from "./Elements";
marked.use(markedKatex({
    throwOnError: false,
    nonStandard: true
}) as any);

type CardEventHandlers = ReturnType<typeof makeEvents>;
type HydratedCardElement = HTMLElement & {
    $updateInfo?: (entity?: EntityInterface<any, any>) => void;
};

const SWIPE_TRIGGER_PX = 72;
const SWIPE_MAX_DISTANCE = 144;
const SWIPE_BREAKPOINT = 720;
const SWIPE_MIN_DISTANCE = 8;

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
    const variant = entityItem?.variant || entityItem?.properties?.variant || "default";
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
    const editIcon = iconsPerAction.get("edit") ?? "pencil";
    const deleteIcon = iconsPerAction.get("delete") ?? "trash";
    const editLabel = labelsPerAction.get("edit")?.(entityDesc) ?? "Edit";
    const deleteLabel = labelsPerAction.get("delete")?.(entityDesc) ?? "Remove";
    const handleCardToggle = (ev: Event) => {
        const target = ev.currentTarget as HTMLElement | null;
        if (!target) return;
        if (target.dataset.swipeLock === "true") {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }

        target.toggleAttribute("data-open");
    };
    const card = H`<div data-id=${entityItem?.id || entityItem?.name} data-variant="${variant}" data-type="${entityDesc.type}" class="card" on:click=${handleCardToggle}>
    <div class="card-swipe-preview" aria-hidden="true">
        <div class="card-swipe-action is-edit">
            <ui-icon icon=${editIcon}></ui-icon>
            <span>${editLabel}</span>
        </div>
        <div class="card-swipe-action is-remove">
            <ui-icon icon=${deleteIcon}></ui-icon>
            <span>${deleteLabel}</span>
        </div>
    </div>
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
</div>` as HydratedCardElement;
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

    card.dataset.swipeLock = "false";
    setupSwipeGestures(card, events);

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

        const imageEl = card.querySelector<HTMLImageElement>('.card-image');
        if (imageEl && $entityItem.image) {
            imageEl.src = $entityItem.image;
        }

        const variantEl = card.querySelector('.card-variant');
        if (variantEl && $entityItem.variant) {
            variantEl.textContent = $entityItem.variant;
        }
    }

    //
    card.$updateInfo = updateCardInfo as HydratedCardElement["$updateInfo"];
    return card;
}

type SwipeAction = "edit" | "remove";

const shouldHandlePointer = (ev: PointerEvent) => ev.pointerType === "touch" || ev.pointerType === "pen";

const isSwipeEnvironment = () => {
    if (typeof window === "undefined") return false;
    const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const hoverNone = window.matchMedia?.("(hover: none)")?.matches ?? false;
    const viewportInlineSize =
        window.visualViewport?.width ??
        window.innerWidth ??
        (typeof document !== "undefined" ? document.documentElement?.clientWidth : undefined) ??
        SWIPE_BREAKPOINT;
    const narrowViewport = viewportInlineSize <= SWIPE_BREAKPOINT;
    const hasTouchPoints = typeof navigator !== "undefined" ? (navigator.maxTouchPoints ?? 0) > 0 : false;
    return (hasCoarsePointer || hoverNone || hasTouchPoints) && narrowViewport;
};

const setupSwipeGestures = (card: HTMLElement, events: CardEventHandlers) => {
    if (!isSwipeEnvironment() || card.dataset.swipeHandlersApplied === "true") {
        return;
    }

    card.dataset.swipeHandlersApplied = "true";

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let currentOffset = 0;
    let isSwiping = false;

    const applySwipeVisuals = (offset: number) => {
        card.style.setProperty("--card-swipe-offset", `${offset}px`);
        const progress = Math.min(Math.abs(offset) / SWIPE_TRIGGER_PX, 1);
        card.style.setProperty("--card-swipe-progress", progress.toString());
        if (progress >= 1) {
            card.dataset.swipeReady = "true";
        } else {
            card.removeAttribute("data-swipe-ready");
        }
    };

    const resetSwipeState = () => {
        if (pointerId !== null) {
            card.releasePointerCapture?.(pointerId);
            pointerId = null;
        }
        currentOffset = 0;
        isSwiping = false;
        card.dataset.swipeLock = "false";
        card.removeAttribute("data-swiping");
        card.removeAttribute("data-swipe-ready");
        card.removeAttribute("data-swipe-action");
        card.style.setProperty("--card-swipe-offset", "0px");
        card.style.setProperty("--card-swipe-progress", "0");
    };

    const showSuccess = (action: SwipeAction) => {
        card.dataset.swipeSuccess = action;
        window.setTimeout(() => {
            if (card.dataset.swipeSuccess === action) {
                card.removeAttribute("data-swipe-success");
            }
        }, 360);
    };

    const triggerSwipeAction = (action: SwipeAction) => {
        const handler = action === "edit" ? events?.doEdit : events?.doDelete;
        if (typeof handler === "function") {
            try {
                const syntheticEvent = new CustomEvent("card-swipe", {
                    detail: {
                        action,
                        direction: action === "edit" ? "right" : "left",
                        source: "mobile-swipe"
                    }
                });
                handler(syntheticEvent);
            } catch (error) {
                console.error("Card swipe action failed", error);
            }
        }
        showSuccess(action);
    };

    const handlePointerDown = (ev: PointerEvent) => {
        if (!shouldHandlePointer(ev)) return;
        pointerId = ev.pointerId;
        startX = ev.clientX;
        startY = ev.clientY;
        currentOffset = 0;
        isSwiping = false;
        card.setPointerCapture?.(pointerId);
    };

    const handlePointerMove = (ev: PointerEvent) => {
        if (pointerId === null || ev.pointerId !== pointerId) return;

        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        if (!isSwiping) {
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > SWIPE_MIN_DISTANCE) {
                resetSwipeState();
                return;
            }
            if (Math.abs(deltaX) >= SWIPE_MIN_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY)) {
                isSwiping = true;
                card.dataset.swiping = "true";
                card.dataset.swipeLock = "true";
            } else {
                return;
            }
        }

        ev.preventDefault();
        const constrained = Math.max(Math.min(deltaX, SWIPE_MAX_DISTANCE), -SWIPE_MAX_DISTANCE);
        currentOffset = constrained;
        const action: SwipeAction = constrained >= 0 ? "edit" : "remove";
        card.dataset.swipeAction = action;
        applySwipeVisuals(constrained);
    };

    const finalizeSwipe = () => {
        if (pointerId === null) return;
        const shouldTrigger = isSwiping && Math.abs(currentOffset) >= SWIPE_TRIGGER_PX;
        if (shouldTrigger) {
            const action: SwipeAction = currentOffset > 0 ? "edit" : "remove";
            triggerSwipeAction(action);
        }
        resetSwipeState();
    };

    card.addEventListener("pointerdown", handlePointerDown, { passive: true });
    card.addEventListener("pointermove", handlePointerMove, { passive: false });
    card.addEventListener("pointerup", finalizeSwipe, { passive: true });
    card.addEventListener("pointercancel", finalizeSwipe, { passive: true });
};
