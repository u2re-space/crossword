import { H } from "fest/lure";
import { ref } from "fest/object";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { ServiceItem, SERVICES_DIR } from ".././../display/items/ServiceItem";

//
const kinds = ["digital", "supporting", "medical", "education", "delivery", "other", "all"] as const;
const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(SERVICES_DIR, kind, ServiceItem)]));

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
