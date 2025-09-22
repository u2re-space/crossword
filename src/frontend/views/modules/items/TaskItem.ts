import { H } from "fest/lure";
import { makeEvents, makePropertyDesc } from "../format/Formatted";



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
export const TaskItem = (task: any, byKind: string | null = null) => {
    if (!task) return null;

    //
    const title = task?.desc?.title || "Task";
    const kind = task?.kind || "";
    if (!(byKind && byKind == kind || !byKind || byKind == "all" || !kind)) return;

    //
    const path = (task as any)?.__path || `/timeline/${(task?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const variant = task?.desc?.variant || "default";
    const desc = task?.desc?.description || "";

    //
    const begin_time = task?.properties?.begin_time || "";
    const end_time = task?.properties?.end_time || "";

    //
    const events = makeEvents("Task", path, title, task, kind);
    const item = H`<div data-type="task" class="task-item card" data-variant=${variant} on:click=${(ev: any) => { (ev.currentTarget as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${task?.desc?.icon ? H`<ui-icon icon=${task.desc.icon}></ui-icon>` : (title?.[0] ?? "T")}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${title}</li></ul>
        <ul class="card-kind">${makePropertyDesc("", task, "kind")}</ul>
    </div>
    <div class="card-time">${begin_time} - ${end_time}</div>
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Description:</span><ul class="card-desc">${makePropertyDesc("", desc, "")}</ul>
    </div>
    <div class="card-description">
        <span class="card-label">Properties:</span><ul>
            ${makePropertyDesc("Kind", task?.properties || kind, "kind")}
            ${makePropertyDesc("Location", task?.properties, "location")}
            ${makePropertyDesc("Events", task?.properties, "events")}
            ${makePropertyDesc("Tasks", task?.properties, "tasks")}
            ${makePropertyDesc("Contacts", task?.properties, "contacts")}
            ${makePropertyDesc("Members", task?.properties, "members")}
            ${makePropertyDesc("Rewards", task?.properties, "rewards")}
        </ul>
    </div>
</div>`;

    //
    return item;
}
