import { H } from "fest/lure";
import { ref } from "fest/object";
import { $ShowItemsByType, renderTabName } from "./format/Formatted";
import { ServiceItem, SERVICES_DIR } from "./items/ServiceItem";

//
const tabs = new Map<string, HTMLElement | null | string | any>([
    ["digital", $ShowItemsByType(SERVICES_DIR, "digital", ServiceItem)],
    ["supporting", $ShowItemsByType(SERVICES_DIR, "supporting", ServiceItem)],
    ["medical", $ShowItemsByType(SERVICES_DIR, "medical", ServiceItem)],
    ["education", $ShowItemsByType(SERVICES_DIR, "education", ServiceItem)],
    ["delivery", $ShowItemsByType(SERVICES_DIR, "delivery", ServiceItem)],
    ["other", $ShowItemsByType(SERVICES_DIR, "other", ServiceItem)],
    ["all", $ShowItemsByType(SERVICES_DIR, "all", ServiceItem)],
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
