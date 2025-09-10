import { H, M } from "fest/lure";
import { makeReactive, observableByMap } from "fest/object";
import { sampleTasks } from "@rs-frontend/views/items/TaskItem";
import { bindDayWithElement, createDayElement, daysTabs, sampleDays } from "../items/DayTab";

//
// Render the timeline
export const TasksTimelineView = ()=>{
    // initialize a default tab
    if (!daysTabs.size) { bindDayWithElement(sampleDays[0], createDayElement(sampleDays[0], sampleTasks)); }

    const tabbed = H`<ui-tabbed-box
    prop:tabs=${daysTabs}
    style="background-color: transparent;"
    class="days"
></ui-tabbed-box>`;

    tabbed.renderTabName = (tabName: string) => { return sampleDays?.find((day: any) => day.id == tabName)?.title || tabName; };
    return H`<section style="background-color: transparent;" class="timeline c2-surface">${tabbed}</section>`;
}
