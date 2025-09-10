import { H, M } from "fest/lure";
import { makeReactive, observableByMap } from "fest/object";
import { TaskItem } from "@rs-frontend/views/items/TaskItem";

// sample tasks for demo and mobile-first layout
const sampleTasks = [
    { id: 't1', title: 'Plan morning', desc: 'Make coffee, review emails', kind: 'personal', variant: 'blur', icon: 'coffee' },
    { id: 't2', title: 'Design meeting', desc: 'Sync with product team', kind: 'work', variant: 'purple', icon: 'users' },
    { id: 't3', title: 'Grocery', desc: 'Buy milk and bread', kind: 'errand', variant: 'green', icon: 'shopping-cart' }
];

const _LOG_ = (data: any)=>{
    console.log("LOG_", data);
    return data;
}

//
const daysTabs = makeReactive(new Map<string, any[]>()) as Map<string, any[]>;
const addDayTab = (day: Date, tasks: any[])=>{
    console.log("addDayTab", day, tasks);
    daysTabs?.set?.(day.toISOString(), tasks || sampleTasks);
}

// Render the timeline
export const TasksTimelineView = ()=>{
    // initialize a default tab
    if (!daysTabs.size) { addDayTab(new Date(), sampleTasks); }

    return H`<section class="timeline c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <div class="days-list cards-grid">
            ${M(sampleTasks, (task) => TaskItem(task))}
        </div>
        <ui-tabbed-box prop:tabs=${daysTabs} class="days" style="display:none"></ui-tabbed-box>
        <button on:click=${() => addDayTab(new Date(), sampleTasks)}>New Day Plan</button>
    </section>`;
}
