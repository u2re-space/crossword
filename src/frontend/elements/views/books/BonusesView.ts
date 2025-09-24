import { H } from "fest/lure";
import { ref } from "fest/object";
import { $ShowItemsByType, renderTabName } from "../../utils/Formatted";
import { BonusItem, BONUSES_DIR } from "../display/items/BonusItem";

//
export const BonusesView = (currentTab?: any | null) => {
    currentTab ??= ref("discount");
    if (currentTab != null) { currentTab.value = "discount"; }

    //
    const tabs = new Map<string, HTMLElement | null | string | any>([
        ["discount", $ShowItemsByType(BONUSES_DIR, "discount", BonusItem)],
        ["cashback", $ShowItemsByType(BONUSES_DIR, "cashback", BonusItem)],
        ["reward", $ShowItemsByType(BONUSES_DIR, "reward", BonusItem)],
        ["all", $ShowItemsByType(BONUSES_DIR, "all", BonusItem)]
    ]);

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
