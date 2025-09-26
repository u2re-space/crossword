import { H } from "fest/lure";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { ServiceItem, SERVICES_DIR } from ".././../display/items/ServiceItem";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { sendToEntityPipeline } from "@rs-frontend/utils/EntityIntake";

//
export const ServicesView = () => {
    const kinds = ["digital", "consultation", "supporting", "medical", "education", "delivery", "other", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(SERVICES_DIR, kind, ServiceItem)]));

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        currentTab=${"all"}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    const section = H`<section id="services" class="all-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="headset"></ui-icon>
            <span>Add Service</span>
        </button>
        </div>
    </div>
    </section>` as HTMLElement;

    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "service" });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);

    return section;
}
