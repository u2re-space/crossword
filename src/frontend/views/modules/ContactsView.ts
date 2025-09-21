import { makeReactive, ref } from "fest/object";
import { H, M, getDirectoryHandle, writeFile, remove } from "fest/lure";
import { MOCElement } from "fest/dom";
import { openFormModal } from "@rs-frontend/elements/overlays/Modal";
import { bindDropToDir } from "@rs-frontend/utils/Drop";

//
const PERSONS_DIR = "/data/person/";

//
const makeEvents = (path: string, title: string, contact: any) => {
    const properties = contact?.properties || {};

    //
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete contact "${title}"?`)) return;

            //
            try { await remove(null, path); } catch (e) { console.warn(e); }
            MOCElement(ev.target as HTMLElement, '.card')?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();
            const result = await openFormModal('Edit Contact', [
                { name: 'title', label: 'Title' },
                { name: 'email', label: 'Email' },
                { name: 'phone', label: 'Phone' }
            ], { title: title, email: properties?.contacts?.email?.[0] || '', phone: properties?.contacts?.phone?.[0] || '' });
            if (!result) return;

            //
            const updated = Object.assign(contact, { desc: { ...(contact?.desc || {}), title: result.title }, properties: { ...(contact?.properties || {}), contacts: { ...(contact?.properties?.contacts || {}), email: result.email ? [result.email] : [], phone: result.phone ? [result.phone] : [] } } });
            try {

                //
                const fileName = path?.split?.('/')?.pop?.() || 'contact.json';
                const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
                await writeFile(null, path, file);
            } catch (e) { console.warn(e); }

            //
            MOCElement(ev.target as HTMLElement, '.card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(result.title));
        }
    }
}

//
const ContactItem = (contact: any, byKind: string) => {
    //
    const title = contact?.desc?.title || contact?.desc?.name || contact?.name || "Contact";
    const kind = contact?.kind || contact?.type || "";
    if (byKind && kind != byKind) return;

    //
    const path = (contact as any)?.__path || `${PERSONS_DIR}${(contact?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    const events = makeEvents(path, title, contact);
    const properties = contact?.properties || {};

    //
    const formatAtList = (text: string | string[] | any[]) => (text?.map?.((part: any) => {
        return H`<li>${part?.trim?.()}</li>`
    }) || []).flat();

    //
    const formatEmail = (email: string) => {
        return H`<li>${email?.trim?.()}</li>`;
    }

    //
    const formatEmailList = (emails: string[]) => {
        return emails?.map?.((email: string) => formatEmail(email)) || [];
    }

    //
    const formatPhone = (phone: string) => {
        const text = phone?.replace?.(/\s+/g, '').replace?.(/[^0-9]/g, '');
        return H`<li>${text?.trim?.()}</li>`;
    }

    //
    const formatPhoneList = (phones: string[]) => {
        return phones?.map?.((phone: string) => formatPhone(phone)) || [];
    }

    //
    const item = H`<div data-type="contact" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="card-avatar"><div class="avatar-inner">${title?.[0] ?? "C"}</div></div>
        <div class="card-props"><div class="card-title">${title}</div><div class="card-kind">${kind}</div></div>
        <div class="card-actions">
            <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
            <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
        <div class="card-content">
            <div class="card-kind">${"Contacts:"}</div>
            <ul class="card-email">${formatEmailList(properties?.contacts?.email || []) || ''}</ul>
            <ul class="card-phone">${formatPhoneList(properties?.contacts?.phone || []) || ''}</ul>
        </div>
        <div class="card-description">
            <div class="card-description-text">${"Description:"}</div>
            <ul>${formatAtList(contact?.description)}</ul>
        </div>
    </div>`;

    //
    return item;
}

//
const $ShowContactsByDir = (DIR: string, byKind: string) => {
    const dataRef: any = makeReactive([]);

    const load = async () => {
        dataRef.length = 0;

        //
        const handle = await getDirectoryHandle(null, DIR).catch(() => null as any);
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const obj = JSON.parse((await file?.text?.()) || "{}");
            (obj as any).__name = name;
            (obj as any).__path = `${DIR}${name}`;
            dataRef.push(obj);
            return obj;
        })?.filter?.((e) => e));
    }

    //
    const contacts = M(dataRef, (contact) => {
        const item = ContactItem(contact, byKind);
        return item;
    });

    //
    const root = H`<div data-name="${byKind}" class="tab">${contacts}</div>`;
    contacts.boundParent = root;
    (root as any).reloadList = load;

    //
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    //
    return root;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
const tabs = new Map<string, HTMLElement | null | string | any>([
    ["specialist", $ShowContactsByDir(PERSONS_DIR, "specialist")],
    ["delivery", $ShowContactsByDir(PERSONS_DIR, "delivery")],
    ["other", $ShowContactsByDir(PERSONS_DIR, "other")]
]);

//
export const ContactsView = (currentTab?: any | null) => {
    currentTab ??= ref("specialist");
    if (currentTab != null) { currentTab.value = "specialist"; }

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
