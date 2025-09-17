import { H, writeFile, remove } from "fest/lure";
import { MOCElement } from "fest/dom";
import { openFormModal } from "@rs-frontend/elements/overlays/Modal";



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
    const path = (task as any)?.__path || `/timeline/${(task?.desc?.name || title).toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-+#&]/g, '-')}.json`;

    const doDelete = async (ev: Event) => {
        ev?.stopPropagation?.();
        if (!confirm(`Delete task "${title}"?`)) return;
        try { await remove(null, path); } catch (e) { console.warn(e); }
        const el = MOCElement(ev.target as HTMLElement, '.task-item');
        el?.remove?.();
    };

    const doEdit = async (ev: Event) => {
        ev?.stopPropagation?.();
        const result = await openFormModal('Edit Task', [
            { name: 'title', label: 'Title' },
            { name: 'description', label: 'Description' },
            { name: 'begin_time', label: 'Begin time', placeholder: 'YYYY-MM-DD or HH:MM' },
            { name: 'end_time', label: 'End time', placeholder: 'YYYY-MM-DD or HH:MM' }
        ], { title, description: desc, begin_time, end_time });
        if (!result) return;
        const updated = Object.assign(task, {
            desc: { ...(task?.desc || {}), title: result.title, description: result.description },
            properties: { ...(task?.properties || {}), begin_time: result.begin_time, end_time: result.end_time }
        });
        console.log(updated);
        try {
            const fileName = path.split('/').pop() || 'task.json';
            const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
            await writeFile(null, path, file);
        } catch (e) { console.warn(e); }
        // Reflect quick UI update
        MOCElement(ev.target as HTMLElement, '.task-item')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(result.title));
        MOCElement(ev.target as HTMLElement, '.task-item')?.querySelector?.('.card-desc')?.replaceChildren?.(document.createTextNode(result.description));
        MOCElement(ev.target as HTMLElement, '.task-item')?.querySelector?.('.card-time')?.replaceChildren?.(document.createTextNode(`${result.begin_time} - ${result.end_time}`));
    };

    //
    return H`<div data-type="task" class="task-item card" data-variant=${variant} on:click=${(ev: any) => {
        const el = ev.target as HTMLElement;
        el.toggleAttribute?.('data-open');
    }}>
    <div class="card-avatar">
        <div class="avatar-inner">${task?.desc?.icon ? H`<ui-icon icon=${task.desc.icon}></ui-icon>` : (title?.[0] ?? "T")}</div>
    </div>
    <div class="card-props">
        <div class="card-title">${title}</div>
        <div class="card-kind">${kind}</div>
    </div>
    <div class="card-actions">
        <button class="action" on:click=${doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-time">${begin_time} - ${end_time}</div>
    <div class="card-content"></div>
    <div class="card-desc">${desc}</div>
</div>`;
}
