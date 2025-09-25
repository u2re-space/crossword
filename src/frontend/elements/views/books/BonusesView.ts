import { H } from "fest/lure";
import { ref } from "fest/object";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { BONUSES_DIR, BonusItem } from ".././../display/items/BonusItem";

//
export const BonusesView = (currentTab?: any | null) => {
    currentTab ??= ref("discount");
    if (currentTab != null) { currentTab.value = "discount"; }

    //
    const kinds = ["discount", "cashback", "reward", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(BONUSES_DIR, kind, BonusItem)]));

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        prop:currentTab=${currentTab}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section id="bonuses" class="all-view">${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="user-plus"></ui-icon>
            <span>Add Bonus</span>
        </button>
    </div>
    </section>`;
}
