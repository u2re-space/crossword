import { H, M, getDirectoryHandle, writeFile, remove } from "fest/lure";
import { MOCElement } from "fest/dom";
import { openFormModal } from "@rs-frontend/elements/overlays/Modal";
import { makeReactive, ref } from "fest/object";

//
const BONUSES_DIR = "/data/bonus/";

//
const makeEvents = (path: string, title: string, bonus: any, kind: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete bonus "${title}"?`)) return;
            try { await remove(null, path); } catch (e) { console.warn(e); }
            MOCElement(ev.target as HTMLElement, '.card')?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();
            const result = await openFormModal('Edit Bonus', [
                { name: 'title', label: 'Title' },
                { name: 'kind', label: 'Kind' }
            ], { title, kind });
            if (!result) return;
            const updated = Object.assign(bonus, { desc: { ...(bonus?.desc || {}), title: result.title }, kind: result.kind || kind });
            try {
                const fileName = path?.split?.('/')?.pop?.() || 'bonus.json';
                const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
                await writeFile(null, path, file);
            } catch (e) { console.warn(e); }
            MOCElement(ev.target as HTMLElement, '.card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(result.title));
        }
    }
}

//
const BonusItem = (bonus: any, byKind: string | null = null) => {
    const title = bonus?.desc?.title || bonus?.desc?.name || bonus?.name || "Bonus";
    const kind = bonus?.kind || "";
    const path = (bonus as any)?.__path || `${BONUSES_DIR}${(bonus?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (byKind && byKind != kind) return;
    const events = makeEvents(path, title, bonus, kind);


    return H`<div data-type="bonus" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="card-avatar"><div class="avatar-inner">${title?.[0] ?? "B"}</div></div>
        <div class="card-props"><div class="card-title">${title}</div><div class="card-kind">${kind}</div></div>
        <div class="card-actions">
            <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
            <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
        <div class="card-description">
            <div class="card-description-text">${bonus?.properties?.description || ''}</div>
        </div>
        <div class="card-content">
            <div class="card-kind">${bonus?.properties?.kind || ''}</div>
            <div class="card-usableFor">${bonus?.properties?.usableFor || ''}</div>
            <div class="card-usableIn">${bonus?.properties?.usableIn || ''}</div>
            <div class="card-availability">${bonus?.properties?.availability || ''}</div>
            <div class="card-availabilityTime">${bonus?.properties?.availabilityTime || ''}</div>
            <div class="card-availabilityDays">${bonus?.properties?.availabilityDays || ''}</div>
            <div class="card-requirements">${bonus?.properties?.requirements || ''}</div>
            <div class="card-persons">${bonus?.properties?.persons || ''}</div>
            <div class="card-actions">${bonus?.properties?.actions || ''}</div>
            <div class="card-bonuses">${bonus?.properties?.bonuses || ''}</div>
            <div class="card-rewards">${bonus?.properties?.rewards || ''}</div>
            <div class="card-contacts">${bonus?.properties?.contacts || ''}</div>
        </div>
    </div>`;
}

//
const $ShowBonusesByType = (DIR: string, byKind: string | null = null) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const handle = await getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
            const entries = await Array.fromAsync(handle?.entries?.() ?? []);
            return Promise.all(entries?.map?.(async ([name, handle]: any) => {
                const file = await handle.getFile();
                const bonus = JSON.parse(await file?.text?.() || "{}");
                (bonus as any).__name = name;
                (bonus as any).__path = `${DIR}${name}`;
                if (name === 'all' || bonus.kind === name || !byKind) { dataRef.push(bonus); }
                return bonus;
            })?.filter?.((e) => e));
        })?.catch?.(console.warn.bind(console));
    }

    //
    const bonuses = M(dataRef, (bonus) => { return BonusItem(bonus, byKind ?? null); });
    const item = H`<div data-name="${byKind}" class="tab">${bonuses}</div>`;
    bonuses.boundParent = item;

    //
    load().catch(console.warn.bind(console));

    //
    return item;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const BonusesView = (currentTab?: any | null) => {
    currentTab ??= ref("discount");
    if (currentTab != null) { currentTab.value = "discount"; }

    //
    const tabs = new Map<string, HTMLElement | null | string | any>([
        ["discount", $ShowBonusesByType(BONUSES_DIR, "discount")],
        ["cashback", $ShowBonusesByType(BONUSES_DIR, "cashback")],
        ["reward", $ShowBonusesByType(BONUSES_DIR, "reward")],
        ["all", $ShowBonusesByType(BONUSES_DIR, "all")]
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
