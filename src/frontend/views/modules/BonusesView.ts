import { H, M, getDirectoryHandle } from "fest/lure";
import { makeReactive, ref } from "fest/object";

//
const BONUSES_DIR = "/data/bonus/";


//
const BonusItem = (bonus: any) => {
    return H`<div class="bonus-item"></div>`;
}


//
const $ShowBonusesByType = (DIR: string, TYPE: string, name?: string) => {
    name = name ?? TYPE;
    const dataRef: any = makeReactive([]);
    const data = getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const bonus = JSON.parse(await file.text());
            if (bonus.kind === TYPE) { dataRef.push(bonus); }
            return bonus;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);

    //
    const bonuses = M(dataRef, (bonus) => {
        return BonusItem(bonus);
    });
    return H`<div data-name="${name}" class="tab">${bonuses}</div>`;
};

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const BonusesView = (currentTab?: any | null) => {
    currentTab ??= ref("discount");
    if (currentTab != null) { currentTab.value = "discount"; }

    //
    const tabs = new Map<string, HTMLElement>([
        ["discount", $ShowBonusesByType(BONUSES_DIR, "discount")],
        ["cashback", $ShowBonusesByType(BONUSES_DIR, "cashback")],
        ["reward", $ShowBonusesByType(BONUSES_DIR, "reward")],
        ["all", $ShowBonusesByType(BONUSES_DIR, "all")]
    ]);

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="all-view">${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="user-plus"></ui-icon>
            <span>Add Bonus</span>
        </button>
    </div>
    </section>`;
}
