import { H, M, openDirectory } from "fest/lure";
import { $trigger, isReactive, makeReactive, numberRef, observableByMap, observe, subscribe } from "fest/object";
import { computeTimelineOrderInGeneral, computeTimelineOrderInsideOfDay, createDayDescriptor, formatAsDate, getComparableTimeValue, insideOfDay } from "@rs-core/utils/TimeUtils";
import { parseDateCorrectly } from "@rs-core/utils/TimeUtils";
import { MakeCardElement } from "./Cards";
import type { ChapterDescriptor, EntityDescriptor } from "@rs-core/utils/Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { cleanToDay, GET_OR_CACHE_BY_NAME, mergeByExists, PUSH_ONCE, REMOVE_IF_HAS, REMOVE_IF_HAS_SIMILAR, SPLICE_INTO_ONCE } from "@rs-frontend/utils/Utils";
import { bindDropToDir } from "@rs-frontend/utils/FileOps";
import { registerEntity, unregisterEntity } from "@rs-core/service/EntityRegistry";

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
    let loaderDebounceTimer: any = null;
    const load = async () => {
        if (loadLocked) return { dataRef, load };
        loadLocked = true;

        //
        const dHandle = openDirectory(null, sourceRef.DIR, { create: true }); await dHandle;
        const loader = async () => {
            const handleMap = await Promise.all(await Array.fromAsync(await dHandle?.entries?.() ?? []));
            const refs = await Promise.all(handleMap?.map?.(async ($pair: any, index: number) => {
                try {
                    const forAddOrDelete = $pair != null;
                    const [name, fileHandle] = $pair as any;
                    const obj = await GET_OR_CACHE_BY_NAME(name, fileHandle?.getFile?.()?.catch?.(console.warn.bind(console)))?.catch?.(console.warn.bind(console));

                    //
                    if (!forAddOrDelete) {
                        if (typeof index == "number" && index >= 0) {
                            REMOVE_IF_HAS_SIMILAR(dataRef, obj as E, index);
                        } else {
                            REMOVE_IF_HAS(dataRef, obj as E);
                        }
                    }

                    //
                    if (obj) {
                        let processedObj = obj as E;
                        if (typeof obj == "object") {
                            processedObj = (isReactive(obj) ? obj : makeReactive(obj)) as E;
                            (processedObj as any).__name = name;
                            (processedObj as any).__path = `${sourceRef.DIR}${name}`;
                        }

                        // TODO? needs to replace push with splice adding with index saving order?
                        if (
                            !name?.trim?.()?.endsWith?.(".crswap") &&
                            name?.trim?.()?.endsWith?.(".json") &&
                            filtered(processedObj, chapterRef as C) &&
                            forAddOrDelete
                        ) { SPLICE_INTO_ONCE(dataRef, processedObj, index); };

                        //
                        return processedObj;
                    }

                    //
                    return obj;
                } catch {
                    console.warn("Error loading item");
                }
            }));

            //
            mergeByExists(dataRef, refs);

            //
            // Remove items that no longer match the filter (when filter changes, e.g., switching tabs)
            for (let i = dataRef.length - 1; i >= 0; i--) {
                const item = dataRef[i];
                if (item) {
                    const itemName = (item as any).__name || (item as any).name;
                    const shouldKeep = itemName &&
                        itemName.trim?.()?.endsWith?.(".json") &&
                        !itemName.trim?.()?.endsWith?.(".crswap") &&
                        filtered(item, chapterRef as C);
                    if (!shouldKeep) {
                        dataRef.splice(i, 1);
                    }
                }
            }
        }

        //
        const debouncedLoader = () => {
            if (loaderDebounceTimer) { clearTimeout(loaderDebounceTimer); }
            loaderDebounceTimer = setTimeout(() => loader(), 50);
        };

        //
        await loader()?.catch?.(console.warn.bind(console)); subscribe(dHandle?.getMap?.() ?? [], debouncedLoader);

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

        // Register/Unregister globally
        if (forAddOrDelete && newItem) {
            registerEntity(newItem);
        } else if (!forAddOrDelete && oldItem) {
            unregisterEntity(oldItem);
        }

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
