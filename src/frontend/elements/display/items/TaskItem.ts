import { MakeCardByDayDesc } from "../typed/Cards";

//
export const TASKS_DIR = "/timeline/";
export const TaskItem = (task: any, dayDesc: any | null = null) => {
    if (!task) return null;
    return MakeCardByDayDesc("Task", TASKS_DIR, task, dayDesc);
}
