import { getDirectoryHandle, H, M, openDirectory } from "fest/lure";
import { implementDropEvent, implementPasteEvent } from "../utils/HookEvent";
import { sendToEntityPipeline, writeTimelineTasks } from "@rs-core/workers/FileSystem";
import { bindDropToDir, openPickerAndAnalyze } from "../utils/FileOps";
import { toastSuccess, toastError } from "@rs-frontend/elements/overlays/Toast";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import { $trigger, makeReactive, numberRef, observableByMap, observe, subscribe } from "fest/object";
import { computeTimelineOrderInGeneral, computeTimelineOrderInsideOfDay, createDayDescriptor, formatAsDate, formatAsTime, getComparableTimeValue, insideOfDay, parseAndGetCorrectTime } from "@rs-frontend/elements/entities/utils/TimeUtils";
import { parseDateCorrectly } from "@rs-frontend/elements/entities/utils/TimeUtils";
import { MakeCardElement } from "./Cards";
import type { ChapterDescriptor, DayDescriptor, EntityDescriptor } from "./Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { generateNewPlan } from "@rs-core/workers/AskToPlan";
import { triggerDebugTaskGeneration } from "@rs-core/workers/DebugTaskGenerator";
import { makeEntityEdit } from "@rs-frontend/elements/editors/EntityEdit";

//
export const $unfiltered = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
    >(obj: E, desc: C): boolean => {
    return true;
}

//
export const $byKind = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
    >(obj: E, desc: C): boolean => {
    const kind = typeof desc == "string" ? desc : (desc as any)?.kind;
    return (obj.kind === kind || !kind || kind == "all" || !obj.kind);
}

//
export const $insideOfDay = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends DayDescriptor = DayDescriptor
    >(obj: E, desc: C): boolean => {
    const kind = typeof desc == "string" ? desc : (desc as any)?.kind;
    const status = typeof desc == "string" ? desc : desc?.status;
    const begin_time = (typeof desc == "string" ? desc : (desc?.begin_time ?? desc)) as any;
    const end_time = (typeof desc == "string" ? desc : (desc?.end_time ?? desc)) as any;
    return insideOfDay(obj, { begin_time, end_time, status }) ||
        (status == obj?.properties?.status || status == "all" || !status) ||
        (kind == obj?.kind || kind == "all" || !obj.kind);
}

//
export const renderTabName = (tabName: string) => {
    if (!tabName) return "";

    // split _ as spaces
    tabName = tabName?.replace?.(/_/g, " ") || tabName;

    // capitalize first word letter
    tabName = (tabName?.charAt?.(0)?.toUpperCase?.() + tabName?.slice?.(1)) || tabName;

    //
    return tabName;
}



// more smarter and stronger version of REMOVE_IF_HAS
const REMOVE_IF_HAS_SIMILAR = (array: any[], old: any, idx: number = -1, srcObj: any = null) => {
    if (array?.indexOf?.(old) >= 0) { array.splice(array.indexOf(old), 1); } else
        if (idx >= 0 && idx < array?.length) { array.splice(idx, 1); } else {
            // TODO: other mechanisms of finding index
        }
}



//
const REMOVE_IF_HAS = (array: any[], item: any) => {
    if (array?.indexOf?.(item) >= 0) { array.splice(array.indexOf(item), 1); };
};

//
const PUSH_ONCE = (array: any[], item: any) => {
    if (array?.indexOf?.(item) < 0) { array.push(item); };
};

//
const SPLICE_INTO_ONCE = (array: any[], item: any, index: number | string | symbol = -1) => {
    if (typeof index != "number" || index < 0 || index >= array?.length) { PUSH_ONCE(array, item); } else
        if (typeof index == "number" && array?.indexOf?.(item) < 0) { array.splice(index, 0, item); };
};

//
const cachedPerFile = new WeakMap<File | Blob, any>();
const cachedPerFileName = new Map<string, any>();

//
const GET_OR_CACHE = async (file: File | Blob | Promise<File | Blob> | null) => {
    try { file = await file; } catch (e) { file = null; console.warn(e); }; if (file == null) return null;
    if (cachedPerFile.has(file)) return cachedPerFile.get(file);
    if (file?.type != "application/json") { return cachedPerFile.get(file); };
    const obj = JSON.parse(await file?.text?.()?.catch?.(console.warn.bind(console)) || "{}");
    if (file) { cachedPerFile.set(file, obj); }
    return obj;
};

// if any other argument isn't working, such as File object (for example, while exclusion)
const GET_OR_CACHE_BY_NAME = async (fileName: string, file?: File | Blob | Promise<File | Blob> | null) => {
    try { file = await file; } catch (e) { file = null; console.warn(e); }; if (fileName == null) return null;
    if (cachedPerFileName.has(fileName)) return cachedPerFileName.get(fileName);;
    const obj = file != null ? await GET_OR_CACHE(file) : cachedPerFileName?.get(fileName);
    if (fileName) { cachedPerFileName.set(fileName, obj); }
    return obj;
};



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
const cleanToDay = (item: EntityInterface<any, any>) => {
    return createDayDescriptor(parseDateCorrectly(item?.properties?.begin_time));
};

//
const closestOfDay = (item: EntityInterface<any, any>, days: any[]) => {
    return days?.find((d) => insideOfDay(item, d));
};

//
const closestOfKind = (item: EntityInterface<any, any>, subgroups: any[]) => {
    return subgroups?.find((d) => d?.kind == item?.kind);
};




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



//
const iconsPerAction = new Map<string, string>([
    ["add", "user-plus"],
    ["upload", "upload"],
    ["generate", "magic-wand"],
    ["debug-gen", "bug"],
]);

//
const labelsPerAction = new Map<string, (entityDesc: EntityDescriptor) => string>([
    ["add", (entityDesc: EntityDescriptor) => `Add ${entityDesc.label}`],
    ["upload", (entityDesc: EntityDescriptor) => `Upload ${entityDesc.label}`],
    ["generate", (entityDesc: EntityDescriptor) => `Generate ${entityDesc.label}`],
    ["debug-gen", (entityDesc: EntityDescriptor) => `Generate debug tasks for ${entityDesc.label}`],
]);

//
const actionRegistry = new Map<string, (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => any>([
    ["debug-gen", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        try {
            // Use debug task generation for immediate testing
            const results = await triggerDebugTaskGeneration(3); // Generate 3 debug tasks
            //viewPage?.$refresh?.();
            if (results && results.length > 0) {
                toastSuccess(`Generated ${results.length} debug tasks for testing`);
            } else {
                toastError(`Failed to generate debug tasks`);
            }
        } catch (error) {
            console.warn("Debug task generation failed:", error);
            toastError(`Failed to generate debug tasks`);
        }
    }],

    //
    ["generate", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        const response = await generateNewPlan();
        //viewPage?.$refresh?.();
        if (!response) {
            toastError(`Failed to generate ${entityDesc.label}`);
            return;
        };
        toastSuccess(`Plan generated...`);
    }],

    //
    ["add", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        try {
            const result = await makeEntityEdit(entityItem, entityDesc, {
                allowLinks: true,
                entityType: entityDesc.type,
                description: `Describe the ${entityDesc.label} and link related entities (actions, bonuses, etc.).`
            });
            if (!result) return;

            //
            const fileName = (`${entityDesc.type}-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const path = `${entityDesc.DIR}${(fileName || entityDesc.type)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
            (result as any).__path = path;
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, entityDesc.DIR, file, { ensureJson: true, sanitize: true });
            toastSuccess(`${entityDesc.label} saved`);
        } catch (e) {
            console.warn(e);
            toastError(`Failed to save ${entityDesc.label}`);
        }
    }],

    //
    ["upload", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        try {
            await openPickerAndAnalyze(entityDesc.DIR, 'text/markdown,text/plain,.json,image/*', true);
            toastSuccess(`${entityDesc.label} uploaded`);
        } catch (e) {
            console.warn(e);
            toastError(`Failed to upload ${entityDesc.label}`);
        }
    }],
]);

//
const generateActionButton = (action: string, entityDesc: EntityDescriptor, viewPage?: any) => {
    return H`<button type="button" on:click=${(e: any) => actionRegistry.get(action)?.(e, entityDesc, viewPage)}>
        <ui-icon icon=${iconsPerAction.get(action)}></ui-icon>
        <span>${labelsPerAction.get(action)?.(entityDesc)}</span>
    </button>`;
}

//
const makeActions = (actions: string[], entityDesc: EntityDescriptor, viewPage?: any) => {
    return actions.map((action) => generateActionButton(action, entityDesc, viewPage));
}



//
export const ViewPage = <
    T extends EntityDescriptor = EntityDescriptor,
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(
    entityDesc: T,
    chapters: C[] | (() => C[]),
    filtered: (item: E, desc: C) => boolean,
    availableActions: string[],
    ItemMaker: (entityItem: E, entityDesc: T, options?: any) => any
) => {

    const viewPage: any = {
        $section: null,
        $refresh: () => { }
    };

    //
    const tabsRef = makeReactive(new Map()) as Map<string, HTMLElement | null | string | any>;
    const reloadTabs = () => {
        // TODO: add reactive chapters support...
        (typeof chapters === "function" ? chapters() : chapters).map((chap: C) => {
            const key = (chap as any)?.id || (chap as any)?.title || String(chap);
            if (key) {
                if (tabsRef.has(key)) { /* currently, unknown action... */ } else {
                    tabsRef.set(key, () => CollectItemsForTabPage<T, E, C>(
                        entityDesc, chap, chap != null ? filtered : () => true,
                        (entityItem: E) => MakeItemBy<E, T>(entityItem, entityDesc, ItemMaker, {})
                    ))
                }
            }
        })
    }

    //
    viewPage.$refresh = () => { reloadTabs?.(); };
    viewPage.$refresh?.();

    //
    document.addEventListener("rs-fs-changed", (ev) => viewPage.$refresh?.());

    // TODO: add support for reactive maps of tabs in `ui-tabbed-box`
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabsRef}
        prop:renderTabName=${renderTabName}
        currentTab=${"all"}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    const toolbar = H`<div class="view-toolbar"><div class="button-set">${makeActions(availableActions, entityDesc, viewPage)}</div></div>`
    const section = H`<section id="${entityDesc.type}" class="viewer-section">${tabbed}${toolbar}</section>` as HTMLElement; viewPage.$section = section;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: entityDesc.type }).catch(console.warn);
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);

    //
    section.addEventListener('contentvisibilityautostatechange', (e: any) => { viewPage.$refresh?.(); });
    section.addEventListener('visibilitychange', (e: any) => { viewPage.$refresh?.(); });
    section.addEventListener('focusin', (e: any) => { viewPage.$refresh?.(); });
    document.addEventListener("rs-fs-changed", () => { viewPage.$refresh?.(); });

    // after append and appear in pages, try to first signal
    requestAnimationFrame(() => {
        if (section?.checkVisibility?.()) {
            viewPage.$refresh?.();
        }
    });

    //
    return section;
}
