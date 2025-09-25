import { H } from "fest/lure";
import { ref } from "fest/object";

//
import "@rs-core/$test/Tasks";
import { TaskItem } from "../../display/items/TaskItem";
import { SplitTimelinesByDays } from "./Splitter";
import { TIMELINE_DIR } from "@rs-core/service/Cache";
import { loadAllTimelines } from "@rs-frontend/utils/Formatted";
import { $ShowItemsByDay } from "@rs-frontend/utils/Formatted";

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
