import { H, M, getDirectoryHandle, writeFile, remove } from "fest/lure";
import { makeReactive, ref } from "fest/object";

//
const BONUSES_DIR = "/data/bonus/";

//
const BonusItem = (bonus: any) => {
    const title = bonus?.desc?.title || bonus?.desc?.name || bonus?.name || "Bonus";
    const kind = bonus?.kind || "";
    const path = (bonus as any)?.__path || `/data/bonus/${(bonus?.desc?.name || title).toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    const doDelete = async (ev: Event) => {
        ev?.stopPropagation?.();
        if (!confirm(`Delete bonus "${title}"?`)) return;
        try { await remove(null, path); } catch (e) { console.warn(e); }
        (ev.currentTarget as HTMLElement)?.closest?.('.card')?.remove?.();
    };
    const doEdit = async (ev: Event) => {
        ev?.stopPropagation?.();
        const newTitle = prompt('Title', title) ?? title;
        const updated = { ...bonus, desc: { ...(bonus?.desc || {}), title: newTitle } };
        try {
            const fileName = path.split('/').pop() || 'bonus.json';
            const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
            await writeFile(null, path, file);
        } catch (e) { console.warn(e); }
        (ev.currentTarget as HTMLElement)?.closest?.('.card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(newTitle));
    };
    return H`<div data-type="bonus" class="card" on:click=${(ev: any) => { (ev.currentTarget as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="card-avatar"><div class="avatar-inner">${title?.[0] ?? "B"}</div></div>
        <div class="card-props"><div class="card-title">${title}</div><div class="card-kind">${kind}</div></div>
        <div class="card-actions">
            <button class="action" on:click=${doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
            <button class="action" on:click=${doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
        <div class="card-content"></div>
    </div>`;
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
            (bonus as any).__name = name;
            (bonus as any).__path = `${DIR}${name}`;
            if (TYPE === 'all' || bonus.kind === TYPE) { dataRef.push(bonus); }
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
