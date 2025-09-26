/* Here will be math, coding, etc. questions (and answers by AI) */
/* Used for solving problems and questions by AI */

import { makeReactive, ref } from "fest/object";
import { getDirectoryHandle, H, M, remove } from "fest/lure";
import { openPickerAndWrite, downloadByPath, pasteIntoDir, bindDropToDir } from "@rs-frontend/utils/FileOps";
import { watchFsDirectory } from "@rs-frontend/utils/FsWatch";

//
const makeEvents = (path: string, name: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!path) return;
            if (!confirm(`Delete \"${name}\"?`)) return;
            try { await remove(null, path); } catch (e) { console.warn(e); }
            (ev.target as HTMLElement)?.closest?.('.preference-item')?.remove?.();
        },
        doDownload: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!path) return;
            try { await downloadByPath(path); } catch (e) { console.warn(e); }
        }
    }
}

//
const QuestItem = (item: any, byKind: string | null = null) => {
    if (byKind && byKind != item?.kind) return;

    //
    const text = typeof item === 'string' ? item : (item?.text || '');
    const path = (item as any)?.__path || '';
    const name = (item as any)?.__name || '';
    const blob = new Blob([text], { type: "text/plain" });
    const events = makeEvents(path, name);

    //
    return H`<div data-type="quest" class="preference-item" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
        <div class="spoiler-handler">${text?.trim?.()?.split?.("\n")?.[0]}</div>
        <div class="spoiler-content"><md-view src=${URL.createObjectURL(blob)}></md-view></div>
        <div class="card-actions" style="display:flex; gap:0.25rem; margin-top:0.25rem;">
            <button class="action" on:click=${events.doDownload}><ui-icon icon="download"></ui-icon><span>Download</span></button>
            <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
        </div>
    </div>`;
}

//
const $ShowQuestsByType = (DIR: string, byKind: string | null = null) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const dirHandle = await getDirectoryHandle(null, DIR).catch(() => null as any);
        const entries = dirHandle ? await Array.fromAsync(dirHandle?.entries?.() ?? []) : [];
        await Promise.all(entries?.map?.(async ([fname, fileHandle]: any) => {
            try {
                const file = await fileHandle.getFile();
                const text = await file?.text?.();
                const quest = JSON.parse(text || "{}");
                (quest as any).__name = fname;
                (quest as any).__path = `${DIR}${fname}`;
                if (byKind === 'all' || quest.kind === byKind || !byKind) { dataRef.push(quest); }
                return quest;
            } catch { }
        }));
    };

    //
    const quests = M(dataRef, (quests) => QuestItem(quests, byKind));
    const root = H`<div data-name="${byKind}" data-type="quests" class="tab">${quests}</div>`;
    quests.boundParent = root; (root as any).reloadList = load;

    let stopWatch: (() => void) | null = null;
    const ensureWatcher = () => {
        if (stopWatch) return;
        stopWatch = watchFsDirectory(DIR, () => load().catch(console.warn));
    };
    const cancelWatcher = () => {
        stopWatch?.();
        stopWatch = null;
    };

    const observer = typeof MutationObserver !== 'undefined' && typeof document !== 'undefined'
        ? new MutationObserver(() => {
            if (root.isConnected) ensureWatcher();
            else {
                cancelWatcher();
                observer.disconnect();
            }
        })
        : null;
    observer?.observe(document.documentElement, { childList: true, subtree: true });

    ensureWatcher();

    //
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    //
    return root;
}

//
const kinds = ["questions", "quests", "coding", "math", "solutions", "all"] as const;
const tabs = new Map<string, HTMLElement | null | string | any>(kinds?.map?.(kind => [kind, $ShowQuestsByType("/docs/" + kind, kind)]));

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const QuestsView = () => {
    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        currentTab=${"all"}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="quests"
    ></ui-tabbed-box>`;

    //
    const section = H`<section id="quests" class="quests-view quests">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button id="btn-upload"><ui-icon icon="upload"></ui-icon><span>Upload</span></button>
        <button id="btn-download"><ui-icon icon="download"></ui-icon><span>Download</span></button>
        <button id="btn-mount"><ui-icon icon="screwdriver"></ui-icon><span>Mount</span></button>
        <button id="btn-refresh"><ui-icon icon="arrows-clockwise"></ui-icon><span>Refresh</span></button>
        <button id="btn-ask"><ui-icon icon="magic-wand"></ui-icon><span>Ask to Suggest Solutions</span></button>
        </div>
    </div>
    </section>` as HTMLElement;

    const tabDirOf = (name: string) => ("/docs/" + (kinds as any || "quests"));
    const getCurrentDir = () => tabDirOf((currentTab?.value || 'quests'));

    section.addEventListener('paste', async (ev: ClipboardEvent) => {
        ev.stopPropagation();
        await pasteIntoDir(getCurrentDir());
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    });
    section.addEventListener('dir-dropped', () => {
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
        try { for (const d of kinds.map(kind => "/docs/" + kind)) { await getDirectoryHandle(null, d, { create: true } as any); } } catch (e) { console.warn(e); }
    });
    section.querySelector('#btn-refresh')?.addEventListener('click', async () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    });

    return section;
}
