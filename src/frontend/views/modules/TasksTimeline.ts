import { H, M } from "fest/lure";
import { makeReactive, observableByMap } from "fest/object";
import { TaskItem } from "../items/TaskItem";

//
const daysTabs = makeReactive(new Map<string, any[]>()) as Map<string, any[]>;
const addDayTab = (day: Date, tasks: any[])=>{
    console.log("addDayTab", day, tasks);
    daysTabs?.set?.(day.toISOString(), tasks);
}

// Render the timeline
export const TasksTimelineView = ()=>{
    return H`<section class="timeline c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <ui-tabbed-box prop:tabs=${daysTabs} class="days">
            ${M(observableByMap(daysTabs), ([day, tasks])=>H`
                <div class="day" data-day=${day}>${M(tasks, (task)=>TaskItem(task))}</div>`
            )}
        </ui-tabbed-box>
        <button on:click=${addDayTab}>New Day Plan</button>
    </section>`;
}
