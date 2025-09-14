import { H } from "fest/lure";
import { bindDayWithElement, createDayElement, daysTabs, sampleDays } from "../items/DayTab";
import { getDirectoryHandle } from "fest/lure";

//
import "@rs-core/workers/Tasks";

//
const TASKS_DIR = "/task/";

// Render the timeline
export const PlannedTimeline = async (currentTab: any) => {
    if (currentTab != null) { currentTab.value = "days"; }

    //
    const taskMap = getDirectoryHandle(null, TASKS_DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const task = JSON.parse(await file.text());
            return task;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);

    //
    if (!daysTabs.size) {
        await Promise.all(sampleDays.map(async (day) => {
            return bindDayWithElement(day, createDayElement(day, await taskMap ?? []));
        }));
    }

    //
    const tabbed = H`<ui-tabbed-box
    prop:tabs=${daysTabs}
    style="background-color: transparent;"
    class="days"
></ui-tabbed-box>`;

    //
    tabbed.renderTabName = (tabName: string) => { return sampleDays?.find((day: any) => day.id == tabName)?.title || tabName; };
    return H`<section id="timeline" style="background-color: transparent;" class="timeline c2-surface">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
            <button><ui-icon icon="calendar"></ui-icon><span>Make Timeline Plan</span></button>
        </div>
    </div>
    </section>`;
}
