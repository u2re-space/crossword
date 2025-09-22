import { getDirectoryHandle, H, M } from "fest/lure";
import { makeReactive, ref } from "fest/object";

//
import "@rs-core/$test/Tasks";
import { bindDropToDir } from "@rs-frontend/utils/Drop";
import { TaskItem, insideOfDay } from "../items/TaskItem";
import { SplitTimelinesByDays } from "./Splitter";

//
const TIMELINE_DIR = "/timeline/";

//
const loadAllTimelines = async (DIR: string) => {
    const dirHandle = await getDirectoryHandle(null, DIR)?.catch?.(console.warn.bind(console));
    const timelines = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return Promise.all(timelines?.map?.(async ([name, handle]: any) => {
        const file = await handle.getFile();
        const item = JSON.parse(await file?.text?.() || "{}");
        (item as any).__name = name;
        (item as any).__path = `${DIR}${name}`;
        return item;
    })?.filter?.((e) => e));
}

//
const $ShowItemsByDay = (DIR: string, dayDesc: any | null = null, ItemRenderer: (item: any, dayDesc: any | null) => any) => {
    const dataRef: any = makeReactive([]);

    //
    const load = async () => {
        dataRef.length = 0;

        //
        const timelines = await loadAllTimelines(DIR)?.catch?.(console.warn.bind(console));
        for (const timeline of (timelines ?? [])) {
            if (insideOfDay(timeline, dayDesc) && timeline) { dataRef.push(timeline); }
        }
    }

    //
    const items = M(dataRef, (item) => {
        const itemEl = ItemRenderer(item, dayDesc ?? null);
        return itemEl;
    });

    //
    const toggleOpen = (ev: any) => {
        const el = ev.currentTarget as HTMLElement;
        if (el?.matches?.('.day-item')) el.toggleAttribute?.('data-open');
    }

    //
    const root = H`<div data-type="day" style="gap: 0.25rem; background-color: --c2-surface(0.0, var(--current, currentColor));" class="day-item" data-variant=${dayDesc.variant} on:click=${toggleOpen}>${items}</div>`;

    //
    items.boundParent = root;
    (root as any).reloadList = load;

    //
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    //
    return root;
}

// Render the timeline
export const PlannedTimeline = async (currentTab?: any | null, daysDesc?: any[] | null) => {
    currentTab ??= ref("");

    //
    const timelines = await loadAllTimelines(TIMELINE_DIR)?.catch?.(console.warn.bind(console));
    daysDesc ??= await SplitTimelinesByDays(timelines, daysDesc);

    //
    const daysTabs = new Map<string, HTMLElement | null | string | any>();
    for (const day of (daysDesc ?? [])) {
        daysTabs.set(day.id, $ShowItemsByDay(TIMELINE_DIR, day, TaskItem));
    }

    //
    const tabbed = H`<ui-tabbed-box
    prop:tabs=${daysTabs}
    prop:currentTab=${currentTab}
    style="background-color: transparent;"
    class="days"
></ui-tabbed-box>`;

    //
    if (currentTab != null && !currentTab.value) { currentTab.value = daysDesc?.[0]?.id; }

    //
    tabbed.renderTabName = (tabName: string) => { return (daysDesc)?.find((day: any) => day.id == tabName)?.title || tabName; };
    return H`<section id="timeline" style="background-color: transparent;" class="timeline c2-surface">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
            <button><ui-icon icon="calendar"></ui-icon><span>Make Timeline Plan</span></button>
        </div>
    </div>
    </section>`;
}
