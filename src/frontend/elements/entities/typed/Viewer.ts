import { getDirectoryHandle, H, M } from "fest/lure";
import { implementDropEvent, implementPasteEvent } from "../utils/HookEvent";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { bindDropToDir, openPickerAndAnalyze } from "../utils/FileOps";
import { toastSuccess, toastError } from "@rs-frontend/elements/overlays/Toast";
import { makeEntityEdit, makeEvents } from "@rs-frontend/elements/entities/edits/EntityEdit";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import { makeReactive } from "fest/object";
import { insideOfDay } from "@rs-frontend/elements/entities/utils/TimeUtils";
import { watchFsDirectory } from "@rs-core/workers/FsWatch";
import { MakeCardElement } from "./Cards";
import type { ChapterDescriptor, DayDescriptor, EntityDescriptor } from "./Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";

//
export const $filtered = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(obj: E, desc: C) => {
    return true;
}

//
export const $byKind = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(obj: E, desc: C) => {
    return obj.kind === desc || !desc || desc == "all" || !obj.kind;
}

//
export const $insideOfDay = <
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends DayDescriptor = DayDescriptor
>(obj: E, dayDesc: C | null = null) => {
    return insideOfDay(obj, dayDesc as C)
}

//
export const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const ItemsByType = <
    T extends EntityDescriptor = EntityDescriptor,
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(
    sourceRef: T,
    chapterRef: C, filtered: (item: E, desc: C) => boolean,
    ItemRenderer: (item: E, desc: T) => any
) => {
    const dataRef: any = makeReactive([]);
    let stopWatch: (() => void) | null = null;

    //
    let loadLocked = false;
    const load = async () => {
        //dataRef.length = 0; // TODO: fix in reactive library
        dataRef?.splice?.(0, dataRef?.length ?? 0);

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
                if (filtered(obj as E, chapterRef as C) && obj) { dataRef.push(obj as E); }
                return obj;
            })?.filter?.((e: any) => e);

        //
        loadLocked = false;
        return $tmp;
    }

    //
    document.addEventListener("rs-fs-changed", (ev) => load().catch(console.warn.bind(console)));

    //
    const items = M(dataRef, (item) => {
        const itemEl = ItemRenderer(item as E, sourceRef as T);
        return itemEl;
    });

    //
    const root = H`<div data-name="${sourceRef}" class="tab">${items}</div>`;
    items.boundParent = root;
    (root as any).reloadList = load;

    const ensureWatcher = () => {
        if (stopWatch) return;
        stopWatch = watchFsDirectory(sourceRef.DIR, () => load().catch(console.warn));
    };

    const cancelWatcher = () => {
        stopWatch?.();
        stopWatch = null;
    };

    root.addEventListener('dir-dropped', () => load().catch(console.warn));

    let observer: MutationObserver | null = null;
    ensureWatcher();
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, sourceRef.DIR);

    if (!observer && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        observer = new MutationObserver(() => {
            if (root.isConnected) ensureWatcher();
            else {
                cancelWatcher();
                observer?.disconnect();
                observer = null;
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    (root as any).dispose = () => {
        cancelWatcher();
        observer?.disconnect();
        observer = null;
    };

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
export const ViewPage = <
    T extends EntityDescriptor = EntityDescriptor,
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(
    entityDesc: T,
    chapters: C[] | (() => C[]),
    filtered: (item: E, desc: C) => boolean,
    ItemMaker: (entityItem: E, entityDesc: T, options?: any) => any
) => {
    //
    const tabs = new Map<string, HTMLElement | null | string | any>(
        (typeof chapters == "function" ? chapters() : chapters)
            .map((chap: C) => ItemsByType<T, E, C>(entityDesc, chap, filtered,
                (entityItem: E) => MakeItemBy<E, T>(entityItem, entityDesc, ItemMaker, {})
            ))
    );

    //
    const forAdd = async () => {
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
    };

    //
    const forUpload = async () => {
        try {
            await openPickerAndAnalyze(entityDesc.DIR, 'text/markdown,text/plain,.json,image/*', true);
            toastSuccess(`${entityDesc.label} uploaded`);
        } catch (e) {
            console.warn(e);
            toastError(`Failed to upload ${entityDesc.label}`);
        }
    };

    //
    const reloadTabs = () => {
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
    const toolbar = H`<div class="view-toolbar">
        <div class="button-set">
            <button type="button" on:click=${forAdd}>
                <ui-icon icon="user-plus"></ui-icon>
                <span>Add Item</span>
            </button>
            <button type="button" on:click=${forUpload}>
                <ui-icon icon="upload"></ui-icon>
                <span>Upload Item</span>
            </button>
        </div></div>`

    //
    const section = H`<section id="${entityDesc.type}" class="all-view">${tabbed}${toolbar}</section>` as HTMLElement;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: entityDesc.type }).catch(console.warn);
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
}
