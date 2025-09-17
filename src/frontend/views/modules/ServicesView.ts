import { getDirectoryHandle, H, M, writeFile, remove } from "fest/lure";
import { makeReactive, ref } from "fest/object";

//
const SERVICES_DIR = "/data/service/";

//
const ServiceItem = (service: any) => {
    const title = service?.desc?.title || service?.desc?.name || service?.name || "Service";
    const kind = service?.kind || "";
    const path = (service as any)?.__path || `/data/service/${(service?.desc?.name || title).toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    const doDelete = async (ev: Event) => {
        ev?.stopPropagation?.();
        if (!confirm(`Delete service "${title}"?`)) return;
        try { await remove(null, path); } catch (e) { console.warn(e); }
        (ev.currentTarget as HTMLElement)?.closest?.('.card')?.remove?.();
    };
    const doEdit = async (ev: Event) => {
        ev?.stopPropagation?.();
        const newTitle = prompt('Title', title) ?? title;
        const updated = { ...service, desc: { ...(service?.desc || {}), title: newTitle } };
        try {
            const fileName = path.split('/').pop() || 'service.json';
            const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
            await writeFile(null, path, file);
        } catch (e) { console.warn(e); }
        (ev.currentTarget as HTMLElement)?.closest?.('.card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(newTitle));
    };
    return H`<div data-type="service" class="card" on:click=${(ev: any) => { (ev.currentTarget as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="card-avatar"><div class="avatar-inner">${title?.[0] ?? "S"}</div></div>
        <div class="card-props"><div class="card-title">${title}</div><div class="card-kind">${kind}</div></div>
        <div class="card-actions">
            <button class="action" on:click=${doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
            <button class="action" on:click=${doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
        <div class="card-content"></div>
    </div>`;
}

//
const $ShowServicesByType = (DIR: string, TYPE: string, name?: string) => {
    name = name ?? TYPE;
    const dataRef: any = makeReactive([]);
    const data = getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const service = JSON.parse(await file.text());
            (service as any).__name = name;
            (service as any).__path = `${DIR}${name}`;
            if (TYPE === 'all' || service.kind === TYPE) { dataRef.push(service); }
            return service;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);

    //
    const services = M(dataRef, (service) => {
        return ServiceItem(service);
    });
    return H`<div data-name="${name}" class="tab">${services}</div>`;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
const tabs = new Map<string, HTMLElement>([
    ["digital", $ShowServicesByType(SERVICES_DIR, "digital")],
    ["supporting", $ShowServicesByType(SERVICES_DIR, "supporting")],
    ["medical", $ShowServicesByType(SERVICES_DIR, "medical")],
    ["education", $ShowServicesByType(SERVICES_DIR, "education")],
    ["delivery", $ShowServicesByType(SERVICES_DIR, "delivery")],
    ["other", $ShowServicesByType(SERVICES_DIR, "other")],
    ["all", $ShowServicesByType(SERVICES_DIR, "all")],
]);

//
export const ServicesView = (currentTab?: any | null) => {
    currentTab ??= ref("digital");
    if (currentTab != null) { currentTab.value = "digital"; }

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section id="services" class="all-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="headset"></ui-icon>
            <span>Add Service</span>
        </button>
        </div>
    </div>
    </section>`;
}
