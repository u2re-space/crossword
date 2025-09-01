import { H } from "fest/lure";

// TODO: This is a legacy component, we should remove it and use the new one
export const TasksHeader = ()=>{
    return H`<div class="tasks-header">
        <div class="task-desc-block"></div>
        <div class="task-kind-block"></div>
        <div class="task-properties-block"></div>
    </div>`;
}
