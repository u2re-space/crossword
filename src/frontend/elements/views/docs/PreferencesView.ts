/* Here is will be preferences view, which used Markdown notes in directory /user/preferences/ */
/* Used for making plans, goals, etc. by AI */

//
import { H, M, getDirectoryHandle, remove } from "fest/lure";
import { makeReactive, ref } from "fest/object";
import { bindDropToDir, pasteIntoDir, openPickerAndWrite, downloadByPath } from "@rs-frontend/utils/FileOps";
import { currentWebDav } from "@rs-core/workers/WebDavSync";
import { watchFsDirectory } from "@rs-frontend/utils/FsWatch";
import { closeToastLayer, toastError, toastSuccess } from "@rs-frontend/utils/Toast";

const SCROLL_TARGET_ATTR = "data-accordion";

//
const isDate = (date: any) => {
    return date instanceof Date || typeof date == "string" && date.match(/^(?:\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/);
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
    if (byKind && byKind != item?.kind && byKind !== "all") return;

    const text = typeof item === 'string' ? item : (item?.text || '');
    const path = (item as any)?.__path || '';
    const name = (item as any)?.__name || '';
    const summary = text?.trim?.()?.split?.("\n")?.[0] || name || "Untitled";
    const blob = new Blob([text], { type: "text/plain" });
    const events = makeEvents(path, name);

    return H`<details class="preference-accordion" ${SCROLL_TARGET_ATTR}>
        <summary>
            <ui-icon icon="note"></ui-icon>
            <span>${summary}</span>
            <button class="plain" on:click=${(ev: Event) => { ev.preventDefault(); ev.stopPropagation(); events.doDownload(ev); }}>
                <ui-icon icon="download"></ui-icon>
            </button>
            <button class="plain" on:click=${(ev: Event) => { ev.preventDefault(); ev.stopPropagation(); events.doDelete(ev); }}>
                <ui-icon icon="trash"></ui-icon>
            </button>
        </summary>
        <div class="spoiler-content"><md-view src=${URL.createObjectURL(blob)}></md-view></div>
    </details>`;
}

//
const $ShowPreferencesByDir = (DIR: string, byKind: string | null = null) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const dirHandle = await getDirectoryHandle(null, DIR).catch(() => null as any);
        const entries = dirHandle ? await Array.fromAsync(await dirHandle?.entries?.() ?? []) : [];
        await Promise.all(entries?.map?.(async ([fname, fileHandle]: any) => {
            try {
                const file = await fileHandle.getFile();
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
const kinds = ["plans", "ideas", "notes", "preferences", "all"] as const;
const tabs = new Map<string, HTMLElement | null | string | any>(kinds?.map?.(kind => [kind, $ShowPreferencesByDir("/docs/" + kind, kind)]));

//
const renderTabName = (tabName: string) => {
    return tabName;
}

const scrollToAccordion = (container: HTMLElement) => {
    const openEl = container.querySelector(`details[open]`);
    if (!openEl) return;
    const rect = openEl.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

//
export const PreferencesView = () => {
    const tabbed = H`<ui-tabbed-box
        currentTab=${"all"}
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

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

    const tabDirOf = (name: string) => ("/docs/" + (kinds as any || "plans"));
    const getCurrentDir = () => tabDirOf((currentTab?.value || 'plans'));

    const reloadTabs = () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    };

    section.addEventListener('paste', async (ev: ClipboardEvent) => {
        ev.stopPropagation();
        try {
            await pasteIntoDir(getCurrentDir());
            toastSuccess("Content pasted");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to paste content");
        }
    });
    section.addEventListener('dir-dropped', () => {
        toastSuccess("Directory imported");
        reloadTabs();
    });

    section.querySelector('#btn-upload')?.addEventListener('click', async () => {
        try {
            await openPickerAndWrite(getCurrentDir(), 'text/markdown,text/plain,.md', true);
            toastSuccess("Files uploaded");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Upload failed");
        }
    });
    section.querySelector('#btn-download')?.addEventListener('click', async () => {
        try {
            const dir = getCurrentDir();
            const handle = await getDirectoryHandle(null, dir);
            const entries = await Array.fromAsync(handle?.entries?.() ?? []);
            for (const it of (entries as any[])) { const name = it?.[0]; if (name) await downloadByPath(`${dir}${name}`, name); }
            toastSuccess("Archive downloaded");
        } catch (e) {
            console.warn(e);
            toastError("Download failed");
        }
    });
    section.querySelector('#btn-mount')?.addEventListener('click', async () => {
        try { for (const d of kinds.map(kind => "/docs/" + kind)) { await getDirectoryHandle(null, d, { create: true } as any); } toastSuccess("Directories mounted"); } catch (e) { console.warn(e); toastError("Mount failed"); }
    });
    section.querySelector('#btn-sync')?.addEventListener('click', async () => {
        try {
            await currentWebDav?.sync?.download?.();
            toastSuccess("Sync requested");
        } catch (e) {
            console.warn(e);
            toastError("Sync failed");
        }
    });
    section.querySelector('#btn-refresh')?.addEventListener('click', async () => {
        toastSuccess("Refreshing");
        reloadTabs();
    });

    section.addEventListener('toggle', (ev: Event) => {
        const target = ev.target as HTMLDetailsElement;
        if (!target?.hasAttribute(SCROLL_TARGET_ATTR)) return;
        if (target.open) {
            scrollToAccordion(section);
        }
    });

    return section;
}

