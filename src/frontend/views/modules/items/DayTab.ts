import { H, M } from "fest/lure";
import { makeReactive } from "fest/object";
import { createTaskElement } from "./TaskItem";

//
export const daysTabs = makeReactive(new Map<string, HTMLElement>()) as Map<string, HTMLElement>;

//
export const bindDayWithElement = (day: any, element: HTMLElement) => {
    console.log("bindDayWithElement", day, element);
    daysTabs?.set?.(day.id, element);
}

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
export const createDayElement = (day: any, sampleTasks: any[]) => {
    return H`<div data-type="day" style="display: flex; flex-direction: column; gap: 0.25rem; background-color: --c2-surface(0.0, var(--current, currentColor));" class="day-item" data-variant=${day.variant} on:click=${(ev: any) => {
        const el = ev.target as HTMLElement; el.toggleAttribute?.('data-open');
    }}>${M(sampleTasks, (task) => {
        if (day.properties?.begin_time <= day.properties?.end_time || !day.properties?.begin_time) {
            const dayBeginTime = new Date(day.properties?.begin_time);
            const dayEndTime = new Date(day.properties?.end_time);
            if (task.properties?.begin_time && task.properties?.end_time) {
                const taskBeginTime = new Date(task.properties?.begin_time);
                const taskEndTime = new Date(task.properties?.end_time);
                if (taskBeginTime >= dayBeginTime && taskEndTime <= dayEndTime || !isDate(task.properties?.begin_time) || !isDate(task.properties?.end_time)) {
                    console.log("createTaskElement", task);
                    return createTaskElement(task);
                }
            }
        }
        return null
    })}</div>`;
}
