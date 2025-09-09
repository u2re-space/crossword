import { H } from "fest/lure";

// Card-like task item with avatar, variant colors and tap-to-expand
export const TaskItem = (task: any) => {
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
};
