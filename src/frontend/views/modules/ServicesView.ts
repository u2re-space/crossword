import { getDirectoryHandle, H, M, writeFile, remove } from "fest/lure";
import { openFormModal } from "@rs-frontend/elements/overlays/Modal";
import { makeReactive, ref } from "fest/object";
import { MOCElement } from "fest/dom";

//
const SERVICES_DIR = "/data/service/";

//
const makeEvents = (path: string, title: string, service: any, kind: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete service "${title}"?`)) return;
            try { await remove(null, path); } catch (e) { console.warn(e); }
            MOCElement(ev.target as HTMLElement, '.card')?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();
            const result = await openFormModal('Edit Service', [
                { name: 'title', label: 'Title' },
                { name: 'kind', label: 'Kind' },
                { name: 'price', label: 'Price' }
            ], { title, kind, price: service?.properties?.price ?? '' });
            if (!result) return;
            const updated = Object.assign(service, { desc: { ...(service?.desc || {}), title: result.title }, kind: result.kind || kind, properties: { ...(service?.properties || {}), price: result.price } });
            try {
                const fileName = path?.split?.('/')?.pop?.() || 'service.json';
                const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
                await writeFile(null, path, file);
            } catch (e) { console.warn(e); }
            MOCElement(ev.target as HTMLElement, '.card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(result.title));
        }
    }
}

//
const ServiceItem = (service: any, byKind: string | null = null) => {
    const title = service?.desc?.title || service?.desc?.name || service?.name || "Service";
    const kind = service?.kind || "";
    const path = (service as any)?.__path || `/data/service/${(service?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (byKind && byKind != kind) return;

    //
    const events = makeEvents(path, title, service, kind);
    return H`<div data-type="service" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="card-avatar"><div class="avatar-inner">${title?.[0] ?? "S"}</div></div>
        <div class="card-props">
            <div class="card-title">${title}</div>
            <div class="card-kind"><span>Kind: </span><span>${kind || service?.properties?.kind || ''}</span></div>
        </div>
        <div class="card-actions">
            <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
            <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
        <div class="card-description">
            <div class="card-description-text">${service?.properties?.description || ''}</div>
        </div>
        <div class="card-content">
            <div class="card-kind"></div>
            <div class="card-price"><span>Price: </span><span>${service?.properties?.price || ''}</span></div>
            <div class="card-quantity"><span>Quantity: </span><span>${service?.properties?.quantity || ''}</span></div>
            <div class="card-location"><span>Location: </span><span>${service?.properties?.location || ''}</span></div>
            <div class="card-persons"><span>Persons: </span><span>${service?.properties?.persons || ''}</span></div>
            <div class="card-contacts"><span>Contacts: </span><span>${service?.properties?.contacts || ''}</span></div>
            <div class="card-actions"><span>Actions: </span><span>${service?.properties?.actions || ''}</span></div>
            <div class="card-tasks"><span>Tasks: </span><span>${service?.properties?.tasks || ''}</span></div>
        </div>
    </div>`;
}

//
const $ShowServicesByType = (DIR: string, byKind: string | null = null) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const dirHandle = await getDirectoryHandle(null, DIR).catch(() => null as any);
        const entries = dirHandle ? await Array.fromAsync(await dirHandle?.entries?.() ?? []) : [];
        await Promise.all(entries?.map?.(async ([fname, handle]: any) => {
            try {
                const file = await handle.getFile();
                const service = JSON.parse(await file?.text?.() || "{}");
                (service as any).__name = fname;
                (service as any).__path = `${DIR}${fname}`;
                if (byKind === 'all' || service.kind === byKind || !byKind) { dataRef.push(service); }
            } catch { }
        }));
    };

    //
    const services = M(dataRef, (service) => { return ServiceItem(service, byKind); });
    const item = H`<div data-name="${byKind}" class="tab">${services}</div>`;
    services.boundParent = item;

    //
    load().catch(console.warn.bind(console));

    //
    return item;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
const tabs = new Map<string, HTMLElement | null | string | any>([
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
        prop:currentTab=${currentTab}
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
