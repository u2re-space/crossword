import { getDirectoryHandle, H } from "fest/lure";
import { bindDayWithElement, createDayElement, daysTabs } from "./items/DayTab";
import { makeReactive, ref } from "fest/object";

//
import "@rs-core/$test/Tasks";

//
const TIMELINE_DIR = "/timeline/";

//
const isDate = (date: any) => {
    const firstStep = date instanceof Date || typeof date == "string" && date.match(/^\d{4}-\d{2}-\d{2}$/);
    let secondStep = false;
    try {
        secondStep = new Date(date).getTime() > 0;
    } catch (e) {
        secondStep = false;
    }
    return firstStep && secondStep;
}

//
const updateDaysDesc = async (daysDesc: any[] | null = null) => {
    //
    daysDesc ??= makeReactive([] as any[]) as any[];

    //
    const timelineMap = getDirectoryHandle(null, TIMELINE_DIR)?.then?.(async (handle) => {
        const timeline = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(timeline?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const item = JSON.parse(await file?.text?.() || "{}");
            // attach file path metadata for actions
            (item as any).__name = name;
            (item as any).__path = `${TIMELINE_DIR}${name}`;
            return item;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);

    // get available days from timelines
    for (const timeline of (await timelineMap) ?? []) {
        if (timeline?.properties?.begin_time && timeline?.properties?.end_time) {
            const beginTime = new Date(timeline?.properties?.begin_time);
            const endTime = new Date(timeline?.properties?.end_time);

            //
            let day = daysDesc?.find?.(day => {
                return beginTime >= day?.properties?.begin_time && endTime <= day?.properties?.end_time;
            }) ?? null;

            //
            if (!day) {
                daysDesc?.push?.(day ??= {
                    id: isDate(beginTime) ? beginTime.toISOString()?.split?.("T")?.[0] : (beginTime || "unknown"),
                    title: isDate(beginTime) ? beginTime.toISOString()?.split?.("T")?.[0] : (beginTime || "unknown"),
                    properties: { begin_time: beginTime || "unknown", end_time: endTime || "unknown" }
                });
            }
        }
    }

    //
    daysDesc = daysDesc?.filter?.(day => {
        return new Date(day?.properties?.end_time || "") >= new Date() || !isDate(day?.properties?.end_time);
    });

    //
    await Promise.all((daysDesc).map(async (day, index) => {
        return bindDayWithElement(day, createDayElement(day, (await timelineMap) ?? []));
    }));

    //
    return daysDesc;
}



// Render the timeline
export const PlannedTimeline = async (currentTab?: any | null, daysDesc?: any[] | null) => {
    currentTab ??= ref("days");
    if (currentTab != null) { currentTab.value = "days"; }

    //
    daysDesc = await updateDaysDesc(daysDesc);

    //
    const tabbed = H`<ui-tabbed-box
    prop:tabs=${daysTabs}
    prop:currentTab=${currentTab}
    style="background-color: transparent;"
    class="days"
></ui-tabbed-box>`;

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
