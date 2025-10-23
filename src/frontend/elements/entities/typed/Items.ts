import { H, M, openDirectory } from "fest/lure";
import { $trigger, makeReactive, numberRef, observableByMap, observe, subscribe } from "fest/object";
import { computeTimelineOrderInGeneral, computeTimelineOrderInsideOfDay, createDayDescriptor, formatAsDate, getComparableTimeValue, insideOfDay } from "@rs-core/utils/TimeUtils";
import { parseDateCorrectly } from "@rs-core/utils/TimeUtils";
import { MakeCardElement } from "./Cards";
import type { ChapterDescriptor, EntityDescriptor } from "@rs-core/utils/Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { cleanToDay, GET_OR_CACHE_BY_NAME, PUSH_ONCE, REMOVE_IF_HAS, REMOVE_IF_HAS_SIMILAR, SPLICE_INTO_ONCE } from "./Utils";
import { bindDropToDir } from "../utils/FileOps";

//
const MakeItemsLoaderForTabPage = <
    T extends EntityDescriptor = EntityDescriptor,
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(
    sourceRef: T,
    chapterRef: C,
    filtered: (item: E, desc: C) => boolean
) => {
    const dataRef: E[] = makeReactive([]) as E[];

    //
    let loadLocked = false;
    const load = async () => {
        if (loadLocked) return { dataRef, load };
        loadLocked = true;

        //
        const dHandle = await openDirectory(null, sourceRef.DIR, { create: true })?.catch?.(console.warn.bind(console));
        const $remap = dHandle?.getMap?.();
        const $reactive = observableByMap($remap);

        // I don't know why, but new files isn't observable
        dataRef?.splice?.(0, dataRef?.length ?? 0); dataRef.length = 0; // TODO: fix in reactive library
        observe($reactive, (pair, index: number | string | symbol, old, $op?: string) => {
            const forAddOrDelete = pair != null;
            const [name, fileHandle] = (pair ?? old) != null ? (pair ?? old) : [null, null];

            //
            Promise.try(async () => {
                const obj = await GET_OR_CACHE_BY_NAME(name, fileHandle?.getFile?.()?.catch?.(console.warn.bind(console)))?.catch?.(console.warn.bind(console));

                //
                if (!forAddOrDelete) {
                    if (typeof index == "number" && index >= 0) {
                        REMOVE_IF_HAS_SIMILAR(dataRef, obj as E, index, old);
                    } else {
                        REMOVE_IF_HAS(dataRef, obj as E);
                    }
                }

                //
                if (obj) {
                    if (typeof obj == "object") {
                        (obj as any).__name = name;
                        (obj as any).__path = `${sourceRef.DIR}${name}`;
                    }

                    // TODO? needs to replace push with splice adding with index saving order?
                    if (
                        !name?.trim?.()?.endsWith?.(".crswap") &&
                        name?.trim?.()?.endsWith?.(".json") &&
                        filtered(obj as E, chapterRef as C) &&
                        forAddOrDelete
                    ) { SPLICE_INTO_ONCE(dataRef, obj as E, index); };
                }
            })
        })

        // do sorting by days abd time before rendering
        //dataRef?.sort?.((a: E, b: E) => (parseAndGetCorrectTime(b?.properties?.begin_time ?? 0) - parseAndGetCorrectTime(a?.properties?.begin_time ?? 0)));
        loadLocked = false;
        return { dataRef, load };
    }

    //
    return { dataRef, load };
}

//
export const CollectItemsForTabPage = <
    T extends EntityDescriptor = EntityDescriptor,
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(
    sourceRef: T,
    chapterRef: C,
    filtered: (item: E, desc: C) => boolean,
    ItemRenderer: (item: E, desc: T) => any
) => {
    //
    const loader = MakeItemsLoaderForTabPage(sourceRef, chapterRef, filtered);

    //
    let firstTimeLoaded = false;
    const firstTimeLoad = () => {
        if (firstTimeLoaded) return; firstTimeLoaded = true;
        loader.load().catch(console.warn.bind(console));
    }

    //
    const minTimestampRef = numberRef(0);
    const maxTimestampRef = numberRef(0);

    //
    subscribe([loader.dataRef, Symbol.iterator], (v, p, o) => {
        minTimestampRef.value = Math.min(...loader.dataRef.map((item) => Math.max(0, getComparableTimeValue(item?.properties?.begin_time ?? 0))));
        maxTimestampRef.value = Math.max(...loader.dataRef.map((item) => Math.max(0, getComparableTimeValue(item?.properties?.begin_time ?? 0))));
    })

    //
    const makeItemEl = (item) => {
        const itemEl = ItemRenderer(item as E, sourceRef as T);
        if (itemEl) { itemEl.style.order = (computeTimelineOrderInsideOfDay(item, chapterRef) || 0); };
        return itemEl;
    };

    //
    const daysRef = makeReactive([]) as any[];
    const kindsRef = makeReactive([]) as any[];
    const subgroups = makeReactive([]) as any[];

    //
    observe(loader.dataRef, (newItem, index, oldItem) => {
        const item = newItem ?? oldItem;
        const forAddOrDelete = newItem != null;

        //
        const day = cleanToDay(item), kind = item?.kind;
        if (day && daysRef?.find((d) => d?.begin_time == day?.begin_time)) { PUSH_ONCE(daysRef, day); };
        if (kind && kindsRef?.find((d) => d?.kind == kind)) { PUSH_ONCE(kindsRef, kind); };

        //
        if (!forAddOrDelete) {
            subgroups.forEach((d) => {
                REMOVE_IF_HAS(d.items, item);
            });
        }

        //
        if (item?.type == "task" || item?.type == "event") {
            const dayOf = createDayDescriptor(parseDateCorrectly(item?.properties?.begin_time));
            if (dayOf && insideOfDay(item, dayOf)) {
                let foundSubgroup = subgroups.find((d) => d?.day == dayOf?.begin_time)
                if (!foundSubgroup) {
                    PUSH_ONCE(subgroups, foundSubgroup ||= {
                        items: makeReactive([]),
                        day: dayOf?.begin_time,
                        kind: item?.kind
                    });
                }

                //
                if (forAddOrDelete) { PUSH_ONCE(foundSubgroup.items, item); } else { REMOVE_IF_HAS(foundSubgroup.items, item); }
                if (foundSubgroup?.items?.length <= 0) { REMOVE_IF_HAS(subgroups, foundSubgroup); }
            }
        } else
            if (item?.kind) {
                let foundSubgroup = subgroups.find((d) => d?.kind == item?.kind)
                if (!foundSubgroup) {
                    PUSH_ONCE(subgroups, foundSubgroup ||= {
                        items: makeReactive([]),
                        kind: item?.kind
                    });
                }

                //
                if (forAddOrDelete) { PUSH_ONCE(foundSubgroup.items, item); } else { REMOVE_IF_HAS(foundSubgroup.items, item); }
                if (foundSubgroup?.items?.length <= 0) { REMOVE_IF_HAS(subgroups, foundSubgroup); }
            }
    });

    //
    document.addEventListener("rs-fs-changed", () => {
        loader.dataRef?.[$trigger]?.();
        subgroups.forEach((d) => d.items?.[$trigger]?.());
    });

    //
    const subgroupsEl = M(subgroups, (subgroup) => {
        const itm = M(subgroup?.items ?? [], makeItemEl);
        const cnt = H`<div class="subgroup-items">${itm}</div>`;
        const els = H`<div class="subgroup">
            <div class="subgroup-header">${subgroup?.day ? formatAsDate(subgroup?.day) : subgroup?.kind}</div>
            ${cnt}
        </div>`
        itm.boundParent = cnt;

        // set order with small forming delay
        const we = new WeakRef(els);
        const usb = subscribe(minTimestampRef, (minVal) => {
            const els = we?.deref?.();
            if (els && subgroup?.day) { els.style.order = (computeTimelineOrderInGeneral(subgroup?.day as any, minVal) || 0); };
            if (!els) { usb?.(); }
        });
        return els;
    });

    //
    const subgroupBody = H`<div class="viewer-tab-content-body">${subgroupsEl}</div>`
    const root = H`<div class="viewer-tab-content tab-content" data-name="${sourceRef?.type}">
        <div class="viewer-tab-content-header">${sourceRef?.label || sourceRef?.type}</div>
        ${subgroupBody}
    </div>`;
    root.addEventListener('dir-dropped', () => firstTimeLoad?.());
    (root as any).reloadList = firstTimeLoad;
    subgroupsEl.boundParent = subgroupBody;

    //
    bindDropToDir(root as any, sourceRef.DIR);

    //
    /*(root as any).dispose = () => {
        loader.dataRef?.splice?.(0, loader.dataRef?.length ?? 0);
        loader.dataRef.length = 0; // TODO: fix in reactive library
    };*/

    //
    root.addEventListener('contentvisibilityautostatechange', (e: any) => { firstTimeLoad?.(); });
    root.addEventListener('visibilitychange', (e: any) => { firstTimeLoad?.(); });
    root.addEventListener('focusin', (e: any) => { firstTimeLoad?.(); });

    // after append and appear in pages, try to first signal
    requestAnimationFrame(() => {
        if (root?.checkVisibility?.()) {
            firstTimeLoad?.();
        }
    });

    //
    return root;
}

//
export const MakeItemBy = <E extends EntityInterface<any, any> = EntityInterface<any, any>, T extends EntityDescriptor = EntityDescriptor>(
    entityItem: E,
    entityDesc: T,
    ItemMaker: (entityItem: E, entityDesc: T, options?: any) => any = MakeCardElement,
    options: any = {}
) => {
    if (!entityItem) return null;
    return ItemMaker(entityItem, entityDesc, options);
}
