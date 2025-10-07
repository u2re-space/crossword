import { getDirectoryHandle, H, M } from "fest/lure";
import { implementDropEvent, implementPasteEvent } from "../utils/HookEvent";
import { sendToEntityPipeline, writeTimelineTasks } from "@rs-core/workers/FileSystem";
import { bindDropToDir, openPickerAndAnalyze } from "../utils/FileOps";
import { toastSuccess, toastError } from "@rs-frontend/elements/overlays/Toast";
import { makeEntityEdit, makeEvents } from "@rs-frontend/elements/entities/edits/EntityEdit";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import { makeReactive, numberRef, observe, subscribe } from "fest/object";
import { computeTimelineOrder, computeTimelineOrderForDay, createDayDescriptor, formatAsTime, insideOfDay, parseAndGetCorrectTime } from "@rs-frontend/elements/entities/utils/TimeUtils";
import { parseDateCorrectly } from "@rs-frontend/elements/entities/utils/TimeUtils";
import { MakeCardElement } from "./Cards";
import type { ChapterDescriptor, DayDescriptor, EntityDescriptor } from "./Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { generateNewPlan } from "@rs-core/workers/AskToPlan";

//
export const $filtered = <
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
    return obj.kind === desc || !desc || desc == "all" || !obj.kind;
}

//
export const $insideOfDay = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends DayDescriptor = DayDescriptor
    >(obj: E, desc: C): boolean => {
    const status = typeof desc == "string" ? desc : desc?.status
    return insideOfDay(obj, desc) || (status == obj?.properties?.status || status == "all" || !status);
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
        dataRef?.splice?.(0, dataRef?.length ?? 0);
        dataRef.length = 0; // TODO: fix in reactive library

        //
        if (loadLocked) return;
        loadLocked = true;

        //
        const dHandle = await getDirectoryHandle(null, sourceRef.DIR)?.catch?.(console.warn.bind(console));
        const entries = await Array.fromAsync(dHandle?.entries?.() ?? [])?.catch?.(console.warn.bind(console));
        const $tmp = (await Promise.all(entries || [])?.catch?.(console.warn.bind(console)))
            ?.map?.(async ([name, fileHandle]: any) => {
                if (name?.endsWith?.(".crswap")) return;
                if (!name?.trim?.()?.endsWith?.(".json")) return;
                const file = await fileHandle?.getFile?.()?.catch?.(console.warn.bind(console));
                if (!file) return;

                //
                const obj = JSON.parse(await file?.text?.()?.catch?.(console.warn.bind(console)) || "{}");
                (obj as any).__name = name;
                (obj as any).__path = `${sourceRef.DIR}${name}`;
                if (filtered(obj as E, chapterRef as C) && obj) { PUSH_ONCE(dataRef, obj as E); }
                return obj;
            })?.filter?.((e: any) => e);

        // do sorting by days abd time before rendering
        dataRef?.sort?.((a: E, b: E) => (parseAndGetCorrectTime(b?.properties?.begin_time ?? 0) - parseAndGetCorrectTime(a?.properties?.begin_time ?? 0)));

        //
        loadLocked = false;
        return $tmp;
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
const PUSH_ONCE = (array: any[], item: any) => {
    if (array?.indexOf?.(item) < 0) { array.push(item); };
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
    document.addEventListener("rs-fs-changed", (ev) => loader.load().catch(console.warn.bind(console)));

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
        minTimestampRef.value = Math.min(...loader.dataRef.map((item) => parseAndGetCorrectTime(item?.properties?.begin_time ?? 0)));
        maxTimestampRef.value = Math.max(...loader.dataRef.map((item) => parseAndGetCorrectTime(item?.properties?.begin_time ?? 0)));
    })

    //
    const makeItemEl = (item) => {
        const itemEl = ItemRenderer(item as E, sourceRef as T);
        if (itemEl) { itemEl.style.order = computeTimelineOrder(item, chapterRef); };
        return itemEl;
    };

    //
    const daysRef = makeReactive([]) as any[];
    const kindsRef = makeReactive([]) as any[];

    //
    observe(loader.dataRef, (newItem, index, oldItem) => {
        const day = cleanToDay(newItem), kind = newItem?.kind;
        if (day && daysRef?.find((d) => d?.begin_time == day?.begin_time)) { PUSH_ONCE(daysRef, day); };
        if (kind && kindsRef?.find((d) => d?.kind == kind)) { PUSH_ONCE(kindsRef, kind); };
    });

    //
    const subgroups = makeReactive([]) as any[];

    //
    observe(loader.dataRef, (newItem, index, oldItem) => {
        if (newItem?.type == "task" || newItem?.type == "event") {
            const dayOf = createDayDescriptor(parseDateCorrectly(newItem?.properties?.begin_time));
            if (dayOf && insideOfDay(newItem, dayOf)) {
                let foundSubgroup = subgroups.find((d) => d?.day == dayOf?.begin_time)
                if (!foundSubgroup) {
                    PUSH_ONCE(subgroups, foundSubgroup ||= {
                        items: makeReactive([]),
                        day: dayOf?.begin_time,
                        kind: newItem?.kind
                    });
                }
                if (newItem) { PUSH_ONCE(foundSubgroup.items, newItem); };
            }
        } else
            if (newItem?.kind) {
                let foundSubgroup = subgroups.find((d) => d?.kind == newItem?.kind)
                if (!foundSubgroup) {
                    PUSH_ONCE(subgroups, foundSubgroup ||= {
                        items: makeReactive([]),
                        kind: newItem?.kind
                    });
                }
                if (newItem) { PUSH_ONCE(foundSubgroup.items, newItem); };
            }
    });

    //
    const subgroupsEl = M(subgroups, (subgroup) => {
        const itm = M(subgroup?.items ?? [], makeItemEl);
        const els = H`<div class="subgroup">
            <div class="subgroup-header">${subgroup?.day ? formatAsTime(subgroup?.day) : subgroup?.kind}</div>
            <div class="subgroup-items">${itm}</div>
        </div>`
        itm.boundParent = els;

        //
        if (subgroup && els) { els.style.order = computeTimelineOrderForDay(subgroup?.day as any); };
        return els;
    });

    //
    const root = H`<div class="tab" data-name="${sourceRef?.type}">${subgroupsEl}</div>`;
    root.addEventListener('dir-dropped', () => loader.load().catch(console.warn));
    (root as any).reloadList = loader.load;
    subgroupsEl.boundParent = root;

    //
    bindDropToDir(root as any, sourceRef.DIR);

    //
    (root as any).dispose = () => {
        loader.dataRef?.splice?.(0, loader.dataRef?.length ?? 0);
        loader.dataRef.length = 0; // TODO: fix in reactive library
    };

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
]);

//
const labelsPerAction = new Map<string, (entityDesc: EntityDescriptor) => string>([
    ["add", (entityDesc: EntityDescriptor) => `Add ${entityDesc.label}`],
    ["upload", (entityDesc: EntityDescriptor) => `Upload ${entityDesc.label}`],
    ["generate", (entityDesc: EntityDescriptor) => `Generate ${entityDesc.label}`],
]);

//
const actionRegistry = new Map<string, (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => any>([
    ["generate", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        const response = await generateNewPlan();
        viewPage?.$refresh?.();
        if (!response) {
            toastError(`Failed to generate ${entityDesc.label}`);
            return;
        };
        toastSuccess(`Plan generated...`);
    }],

    //
    ["add", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        try {
            const result = await makeEntityEdit(entityDesc, { basis: {}, fields: [] }, {
                allowLinks: true,
                entityType: entityDesc.type,
                description: `Describe the ${entityDesc.label} and link related entities (actions, bonuses, etc.).`
            });
            if (!result) return;

            //
            const fileName = (result?.title || `${entityDesc.type}-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
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
    // The original code attempted to use a Map<string, ...> with chapter objects as keys,
    // but chapters are not guaranteed to be strings, causing a type error.
    // To fix this, we need to use a string key for the Map, such as chap.id or chap.title.
    // We'll preserve the original mapping logic, but use a string property as the key.

    const chapterList: C[] = typeof chapters === "function" ? chapters() : chapters;

    // Use a string property of C as the key. We'll try chap.id, then chap.title, then fallback to String(chap).
    const tabs = new Map<string, HTMLElement | null | string | any>(
        chapterList.map((chap: C) => {
            // Try to get a unique string key for the chapter
            let key: string = "all";
            if (chap == null) { key = "all"; } else
            if (typeof chap == "object") {
                if ('id' in chap && typeof (chap as any).id === 'string') {
                    key = (chap as any)?.id;
                } else if ('title' in chap && typeof (chap as any).title === 'string') {
                    key = (chap as any)?.title;
                } else {
                    key = String(chap);
                }
            } else {
                key = chap as string;
            }
            return [key, CollectItemsForTabPage<T, E, C>(
                entityDesc,
                chap,
                chap != null ? filtered : () => true,
                (entityItem: E) => MakeItemBy<E, T>(entityItem, entityDesc, ItemMaker, {})
            )];
        })
    );

    //
    viewPage.$refresh = () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    };

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        currentTab=${"all"}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    const toolbar = H`<div class="view-toolbar"><div class="button-set">${makeActions(availableActions, entityDesc, viewPage)}</div></div>`
    const section = H`<section id="${entityDesc.type}" class="all-view">${tabbed}${toolbar}</section>` as HTMLElement; viewPage.$section = section;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: entityDesc.type }).catch(console.warn);
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
}
