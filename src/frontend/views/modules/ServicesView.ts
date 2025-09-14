import { getDirectoryHandle, H, M } from "fest/lure";
import { makeReactive } from "fest/object";

//
const SERVICES_DIR = "/data/service/";

//
const ServiceItem = (service: any) => {
    return H`<div class="service-item"></div>`;
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
            if (service.kind === TYPE) { dataRef.push(service); }
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
export const ServicesView = (currentTab: any) => {
    if (currentTab != null) { currentTab.value = "digital"; }

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
            <ui-icon icon="headset"></ui-icon>
            <span>Add Service</span>
        </button>
        </div>
    </div>
    </section>`;
}
