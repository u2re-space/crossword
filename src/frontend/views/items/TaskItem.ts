import { H } from "fest/lure";

//
export const TaskItem = (task: any) => {
    return H`<div class="task-item">
        <div class="task-desc-block">${task.desc}</div>
        <div class="task-kind-block">${task.kind}</div>
        <div class="task-properties-block">${task.properties}</div>
    </div>`;
};
