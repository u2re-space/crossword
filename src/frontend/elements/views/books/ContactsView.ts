import { ref } from "fest/object";
import { H } from "fest/lure";
import { ContactItem, PERSONS_DIR } from "../../display/items/ContactItem";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";

//
const tabs = new Map<string, HTMLElement | null | string | any>([
    ["specialist", $ShowItemsByType(PERSONS_DIR, "specialist", ContactItem)],
    ["delivery", $ShowItemsByType(PERSONS_DIR, "delivery", ContactItem)],
    ["other", $ShowItemsByType(PERSONS_DIR, "other", ContactItem)],
    ["all", $ShowItemsByType(PERSONS_DIR, "all", ContactItem)]
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
