/* Here is will be preferences view, which used Markdown notes in directory /user/preferences/ */
/* Used for making plans, goals, etc. by AI */

//
import { H, M, getDirectoryHandle, remove } from "fest/lure";
import { makeReactive, ref } from "fest/object";
import { openPickerAndWrite, downloadByPath } from "@rs-frontend/utils/Upload";
import { pasteIntoDir } from "@rs-frontend/utils/Paste";
import { bindDropToDir } from "@rs-frontend/utils/Drop";
import { currentWebDav } from "@rs-core/workers/WebDavSync";

//
const PLANS_DIR = "/docs/plans/";
const IDEAS_DIR = "/docs/ideas/";
const NOTES_DIR = "/docs/notes/";
const PREFERENCES_DIR = "/docs/preferences/";



//
const isDate = (date: any) => {
    return date instanceof Date || typeof date == "string" && date.match(/^\d{4}-\d{2}-\d{2}$/);
}

//
const makeEvents = (path: string, name: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.(); if (!path) return;
            if (!confirm(`Delete \"${name}\"?`)) return; if (isDate(name)) return; if (name === 'all') return;
            try { await remove(null, path); } catch (e) { console.warn(e); }
            (ev.target as HTMLElement)?.closest?.('.preference-item')?.remove?.();
        },
        doDownload: async (ev: Event) => {
            ev?.stopPropagation?.(); if (!path) return;
            if (isDate(name)) return; if (name === 'all') return;
            try { await downloadByPath(path); } catch (e) { console.warn(e); }
        }
    }
}

//
const PreferenceItem = (item: any, byKind: string | null = null) => {
    if (item == null) return;
    if (byKind && byKind != item?.kind) return;

    //
    const text = typeof item === 'string' ? item : (item?.text || '');
    const path = (item as any)?.__path || '';
    const name = (item as any)?.__name || '';
    const blob = new Blob([text], { type: "text/plain" });
    const events = makeEvents(path, name);

    //
    return H`<div data-type="preference" class="preference-item" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="spoiler-handler">${text?.trim?.()?.split?.("\n")?.[0]}</div>
        <div class="spoiler-content"><md-view src=${URL.createObjectURL(blob)}></md-view></div>
        <div class="card-actions" style="display:flex; gap:0.25rem; margin-top:0.25rem;">
            <button class="action" on:click=${events.doDownload}><ui-icon icon="download"></ui-icon><span>Download</span></button>
            <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
    </div>`;
}

//
const $ShowPreferencesByDir = (DIR: string, byKind: string | null = null) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const dirHandle = await getDirectoryHandle(null, DIR).catch(() => null as any);
        const entries = dirHandle ? await Array.fromAsync(await dirHandle?.entries?.() ?? []) : [];
        await Promise.all(entries?.map?.(async ([fname, handle]: any) => {
            try {
                const file = await handle.getFile();
                const text = await file.text();
                dataRef.push({ text, __name: fname, __path: `${DIR}${fname}` });
            } catch { }
        }));
    };

    //
    const preferences = M(dataRef, (preference) => PreferenceItem(preference, byKind));
    const root = H`<div data-name="${byKind}" data-type="preferences" class="content">${preferences}</div>`;
    preferences.boundParent = root;
    (root as any).reloadList = load;

    //
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    //
    return root;
}

//
const tabs = new Map<string, HTMLElement | null | string | any>([
    ["plans", $ShowPreferencesByDir(PLANS_DIR, "plans")],
    ["ideas", $ShowPreferencesByDir(IDEAS_DIR, "ideas")],
    ["notes", $ShowPreferencesByDir(NOTES_DIR, "notes")],
    ["all", $ShowPreferencesByDir(PREFERENCES_DIR, "all")]
]);

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const PreferencesView = (currentTab?: any | null) => {
    currentTab ??= ref("plans");
    if (currentTab != null) { currentTab.value = "plans"; }

    //
    const tabbed = H`<ui-tabbed-box
        prop:currentTab=${currentTab}
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    const section = H`<section id="preferences" class="preferences-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button id="btn-upload">
            <ui-icon icon="upload"></ui-icon>
            <span>Upload</span>
        </button>
        <button id="btn-download">
            <ui-icon icon="download"></ui-icon>
            <span>Download</span>
        </button>
        <button id="btn-mount">
            <ui-icon icon="screwdriver"></ui-icon>
            <span>Mount</span>
        </button>
        <button id="btn-sync">
            <ui-icon icon="arrows-clockwise"></ui-icon>
            <span>Sync</span>
        </button>
        <button id="btn-refresh">
            <ui-icon icon="arrows-clockwise"></ui-icon>
            <span>Refresh</span>
        </button>
        </div>
    </div>
    </section>` as HTMLElement;

    const tabDirOf = (name: string) => ({ plans: PLANS_DIR, ideas: IDEAS_DIR, notes: NOTES_DIR, all: PREFERENCES_DIR } as any)[name] || PREFERENCES_DIR;
    const getCurrentDir = () => tabDirOf((currentTab?.value || 'plans'));

    section.addEventListener('paste', async (ev: ClipboardEvent) => {
        ev.stopPropagation();
        await pasteIntoDir(getCurrentDir());
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    });

    section.querySelector('#btn-upload')?.addEventListener('click', async () => {
        await openPickerAndWrite(getCurrentDir(), 'text/markdown,text/plain,.md', true);
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    });
    section.querySelector('#btn-download')?.addEventListener('click', async () => {
        try {
            const dir = getCurrentDir();
            const handle = await getDirectoryHandle(null, dir);
            const entries = await Array.fromAsync(handle?.entries?.() ?? []);
            for (const it of (entries as any[])) { const name = it?.[0]; if (name) await downloadByPath(`${dir}${name}`, name); }
        } catch (e) { console.warn(e); }
    });
    section.querySelector('#btn-mount')?.addEventListener('click', async () => {
        try { for (const d of [PLANS_DIR, IDEAS_DIR, NOTES_DIR, PREFERENCES_DIR]) await getDirectoryHandle(null, d, { create: true } as any); } catch (e) { console.warn(e); }
    });
    section.querySelector('#btn-sync')?.addEventListener('click', async () => {
        try {
            currentWebDav?.sync?.download?.()?.catch?.(console.warn.bind(console));
        } catch (e) { console.warn(e); }
    });
    section.querySelector('#btn-refresh')?.addEventListener('click', async () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    });

    return section;
}
