import { ref } from "fest/object";
import { H } from "fest/lure";
import { ContactItem, PERSONS_DIR } from "../../display/items/ContactItem";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { sendToEntityPipeline } from "@rs-frontend/utils/EntityIntake";

//
export const ContactsView = (currentTab?: any | null) => {
    currentTab ??= ref("all");
    if (currentTab != null) { currentTab.value = "all"; }

    //
    const kinds = ["specialist", "delivery", "other", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(PERSONS_DIR, kind, ContactItem)]));

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:currentTab=${currentTab}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    const section = H`<section id="contacts" class="all-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="user-plus"></ui-icon>
            <span>Add Contact</span>
        </button>
    </div>
    </section>` as HTMLElement;

    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "person" });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);

    return section;
}
