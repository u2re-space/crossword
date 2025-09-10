import { H } from "fest/lure";



// sample tasks for demo and mobile-first layout
export const sampleTasks = [
    { id: 't1', title: 'Plan morning', desc: 'Make coffee, review emails', kind: 'personal', variant: 'blur', icon: 'coffee' },
    { id: 't2', title: 'Design meeting', desc: 'Sync with product team', kind: 'work', variant: 'purple', icon: 'users' },
    { id: 't3', title: 'Grocery', desc: 'Buy milk and bread', kind: 'errand', variant: 'green', icon: 'shopping-cart' }
];

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
    const variant = task?.variant || "default";
    const title = task?.title || task?.desc || "Task";
    const desc = task?.desc || "";
    const kind = task?.kind || "";

    return H`<div class="task-item card" data-variant=${variant} on:click=${(ev: any) => {
        const el = ev.currentTarget as HTMLElement;
        el.toggleAttribute?.('data-open');
    }}>
        <div class="card-avatar">
            <div class="avatar-inner">${task?.icon ? H`<ui-icon icon=${task.icon}></ui-icon>` : (title?.[0] ?? "T")}</div>
        </div>
        <div class="card-content">
            <div class="card-title">${title}</div>
            <div class="card-desc">${desc}</div>
            <div class="card-meta">${kind}</div>
        </div>
    </div>`;
}
