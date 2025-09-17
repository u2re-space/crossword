import { H, writeFile, remove } from "fest/lure";



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
        const el = (ev.currentTarget as HTMLElement)?.closest?.('.task-item');
        el?.remove?.();
    };

    const doEdit = async (ev: Event) => {
        ev?.stopPropagation?.();
        const newTitle = prompt('Title', title) ?? title;
        const newDesc = prompt('Description', desc) ?? desc;
        const newBegin = prompt('Begin time', begin_time) ?? begin_time;
        const newEnd = prompt('End time', end_time) ?? end_time;
        const updated = {
            ...task,
            desc: { ...(task?.desc || {}), title: newTitle, description: newDesc },
            properties: { ...(task?.properties || {}), begin_time: newBegin, end_time: newEnd }
        };
        try {
            const fileName = path.split('/').pop() || 'task.json';
            const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
            await writeFile(null, path, file);
        } catch (e) { console.warn(e); }
        // Reflect quick UI update
        (ev.currentTarget as HTMLElement)?.closest?.('.task-item')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(newTitle));
        (ev.currentTarget as HTMLElement)?.closest?.('.task-item')?.querySelector?.('.card-desc')?.replaceChildren?.(document.createTextNode(newDesc));
        (ev.currentTarget as HTMLElement)?.closest?.('.task-item')?.querySelector?.('.card-time')?.replaceChildren?.(document.createTextNode(`${newBegin} - ${newEnd}`));
    };

    //
    return H`<div data-type="task" class="task-item card" data-variant=${variant} on:click=${(ev: any) => {
        const el = ev.currentTarget as HTMLElement;
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
