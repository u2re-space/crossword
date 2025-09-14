import { makeReactive, ref } from "fest/object";
import { H, M, getDirectoryHandle } from "fest/lure";

//
const PERSONS_DIR = "/data/person/";
const SERVICES_DIR = "/data/service/";
const CONTACTS_DIR = "/data/contacts/";


//
const ContactItem = (contact: any) => {
    return H`<div class="contact-item"></div>`;
}

//
const $ShowContactsByDir = (DIR: string, name: string) => {
    const dataRef: any = makeReactive([]);
    const data = getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const task = JSON.parse(await file.text());
            dataRef.push(task);
            return task;
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
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="all-view">
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
