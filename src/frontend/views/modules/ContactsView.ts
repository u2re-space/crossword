import { makeReactive, ref } from "fest/object";
import { H, M, getDirectoryHandle, writeFile, remove } from "fest/lure";
import { MOCElement } from "fest/dom";
import { openFormModal } from "@rs-frontend/elements/overlays/Modal";

//
const PERSONS_DIR = "/data/person/";
const SERVICES_DIR = "/data/service/";
const CONTACTS_DIR = "/data/contacts/";


//
const ContactItem = (contact: any) => {
    const title = contact?.desc?.title || contact?.desc?.name || contact?.name || "Contact";
    const kind = contact?.kind || contact?.type || "";
    const path = (contact as any)?.__path || `/data/contacts/${(contact?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    const doDelete = async (ev: Event) => {
        ev?.stopPropagation?.();
        if (!confirm(`Delete contact "${title}"?`)) return;
        try { await remove(null, path); } catch (e) { console.warn(e); }
        MOCElement(ev.target as HTMLElement, '.card')?.remove?.();
    };
    const doEdit = async (ev: Event) => {
        ev?.stopPropagation?.();
        const result = await openFormModal('Edit Contact', [
            { name: 'title', label: 'Title' },
            { name: 'email', label: 'Email' },
            { name: 'phone', label: 'Phone' }
        ], { title: title, email: contact?.contacts?.email?.[0] || '', phone: contact?.contacts?.phone?.[0] || '' });
        if (!result) return;
        const updated = Object.assign(contact, { desc: { ...(contact?.desc || {}), title: result.title }, contacts: { ...(contact?.contacts || {}), email: result.email ? [result.email] : [], phone: result.phone ? [result.phone] : [] } });
        try {
            const fileName = path?.split?.('/')?.pop?.() || 'contact.json';
            const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
            await writeFile(null, path, file);
        } catch (e) { console.warn(e); }
        MOCElement(ev.target as HTMLElement, '.card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(result.title));
    };
    return H`<div data-type="contact" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="card-avatar"><div class="avatar-inner">${title?.[0] ?? "C"}</div></div>
        <div class="card-props"><div class="card-title">${title}</div><div class="card-kind">${kind}</div></div>
        <div class="card-actions">
            <button class="action" on:click=${doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
            <button class="action" on:click=${doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
        <div class="card-content"></div>
    </div>`;
}

//
const $ShowContactsByDir = (DIR: string, name: string) => {
    const dataRef: any = makeReactive([]);
    const data = getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const obj = JSON.parse(await file?.text?.() || "{}");
            (obj as any).__name = name;
            (obj as any).__path = `${DIR}${name}`;
            dataRef.push(obj);
            return obj;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);

    //
    const contacts = M(dataRef, (contact) => {
        return ContactItem(contact);
    });
    return H`<div data-name="${name}" class="tab">${contacts}</div>`;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
const tabs = new Map<string, HTMLElement>([
    ["person", $ShowContactsByDir(PERSONS_DIR, "person")],
    ["service", $ShowContactsByDir(SERVICES_DIR, "service")],
    ["all", $ShowContactsByDir(CONTACTS_DIR, "all")]
]);

//
export const ContactsView = (currentTab?: any | null) => {
    currentTab ??= ref("person");
    if (currentTab != null) { currentTab.value = "person"; }

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:currentTab=${currentTab}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section id="contacts" class="all-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="user-plus"></ui-icon>
            <span>Add Contact</span>
        </button>
    </div>
    </section>`;
}
