import { H } from "fest/lure";



//
const _LOG_ = (data: any) => {
    console.log("LOG_", data);
    return data;
}

//
export const bindTaskWithElement = (task: any, element: HTMLElement) => {
    console.log("bindTaskWithElement", task, element);
}



// Card-like task item with avatar, variant colors and tap-to-expand
export const createTaskElement = (task: any) => {
    const variant = task?.desc?.variant || "default";
    const title = task?.desc?.title || "Task";
    const desc = task?.desc?.description || "";
    const kind = task?.kind || "";
    const begin_time = task?.properties?.begin_time || "";
    const end_time = task?.properties?.end_time || "";

    return H`<div class="task-item card" data-variant=${variant} on:click=${(ev: any) => {
        const el = ev.currentTarget as HTMLElement;
        el.toggleAttribute?.('data-open');
    }}>
    <div class="card-avatar">
        <div class="avatar-inner">${task?.desc?.icon ? H`<ui-icon icon=${task.desc.icon}></ui-icon>` : (title?.[0] ?? "T")}</div>
    </div>
    <div class="card-content">
        <div class="card-title">${title}</div>
        <div class="card-kind">${kind}</div>
    </div>
    <div class="card-time">${begin_time} - ${end_time}</div>
    <div class="card-props"></div>
    <div class="card-desc">${desc}</div>
</div>`;
}
