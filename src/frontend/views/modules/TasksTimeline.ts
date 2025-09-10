import { H, M } from "fest/lure";
import { makeReactive, observableByMap } from "fest/object";
import { sampleTasks } from "@rs-frontend/views/items/TaskItem";
import { bindDayWithElement, createDayElement, daysTabs, sampleDays } from "../items/DayTab";

//
// Render the timeline
export const TasksTimelineView = ()=>{
    // initialize a default tab
    if (!daysTabs.size) { bindDayWithElement(sampleDays[0], createDayElement(sampleDays[0], sampleTasks)); }

    return H`<section style="background-color: transparent;" class="timeline c2-surface">
        <ui-tabbed-box style="background-color: transparent;" prop:tabs=${daysTabs} class="days"></ui-tabbed-box>
    </section>`;
}
