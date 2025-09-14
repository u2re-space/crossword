import { H, M } from "fest/lure";


//
const BONUSES_DIR = "/data/bonus/";


//
const DiscountBonuses = () => {
    const bonuses = M([], (bonus) => {
        return H`<div class="discount-item"></div>`;
    });
    return H`<div data-name="discount" class="tab">${bonuses}</div>`;
}

//
const CashbackBonuses = () => {
    const bonuses = M([], (bonus) => {
        return H`<div class="cashback-item"></div>`;
    });
    return H`<div data-name="cashback" class="tab">${bonuses}</div>`;
}

//
const RewardBonuses = () => {
    const bonuses = M([], (bonus) => {
        return H`<div class="reward-item"></div>`;
    });
    return H`<div data-name="reward" class="tab">${bonuses}</div>`;
}

//
const AllBonuses = () => {
    const bonuses = M([], (bonuses) => {
        return H`<div class="bonus-item"></div>`;
    });
    return H`<div data-name="reward" class="tab">${bonuses}</div>`;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const BonusesView = () => {
    const tabs = new Map<string, HTMLElement>([
        ["discount", DiscountBonuses()],
        ["cashback", CashbackBonuses()],
        ["reward", RewardBonuses()],
        ["all", AllBonuses()]
    ]);

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="all-view">${tabbed}</section>`;
}
