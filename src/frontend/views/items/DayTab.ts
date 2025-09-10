import { H, M } from "fest/lure";
import { makeReactive } from "fest/object";
import { createTaskElement } from "@rs-frontend/views/items/TaskItem";

//
export const daysTabs = makeReactive(new Map<string, HTMLElement>()) as Map<string, HTMLElement>;
export const sampleDays = [
    { id: 'd1', title: 'Monday', variant: 'purple', icon: 'calendar' },
    { id: 'd2', title: 'Tuesday', variant: 'green', icon: 'calendar' },
    { id: 'd3', title: 'Wednesday', variant: 'purple', icon: 'calendar' }
];

//
export const bindDayWithElement = (day: any, element: HTMLElement) => {
    console.log("bindDayWithElement", day, element);
    daysTabs?.set?.(day.id, element);
}

//
export const createDayElement = (day: any, sampleTasks: any[]) => {
    return H`<div style="display: flex; flex-direction: column; gap: 0.25rem; background-color: --c2-surface(0.0, var(--current, currentColor));" class="day-item" data-variant=${day.variant} on:click=${(ev: any) => {
        const el = ev.currentTarget as HTMLElement;
        el.toggleAttribute?.('data-open');
    }}>${M(sampleTasks, (task) => createTaskElement(task))}</div>`;
}
