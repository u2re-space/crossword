import { H } from "fest/lure";



//
export const sampleTasks = [
    { desc: { name: 't1', title: 'Plan morning', description: 'Make coffee, review emails', icon: 'coffee', variant: 'blur' }, properties: { begin_time: '12:00', end_time: '13:00' }, kind: 'personal' },
    { desc: { name: 't2', title: 'Design meeting', description: 'Sync with product team', icon: 'users', variant: 'purple' }, properties: { begin_time: '14:00', end_time: '15:00' }, kind: 'work' },
    { desc: { name: 't3', title: 'Grocery', description: 'Buy milk and bread', icon: 'shopping-cart', variant: 'green' }, properties: { begin_time: '16:00', end_time: '17:00' }, kind: 'errand' }
];

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
