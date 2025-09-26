/* Here will be math, coding, etc. questions (and answers by AI) */
/* Used for solving problems and questions by AI */

import { makeReactive, ref } from "fest/object";
import { getDirectoryHandle, H, M, remove } from "fest/lure";
import { openPickerAndWrite, downloadByPath, pasteIntoDir, bindDropToDir } from "@rs-frontend/utils/FileOps";
import { watchFsDirectory } from "@rs-frontend/utils/FsWatch";
import { makeEntityEdit } from "../../display/edits/EntityEdit";
import { toastError, toastSuccess } from "@rs-frontend/utils/Toast";

const AI_PLACEHOLDER = "Awaiting AI answer...";

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
    if (byKind && byKind != item?.kind && byKind !== "all") return;

    const text = typeof item === 'string' ? item : (item?.text || '');
    const path = (item as any)?.__path || '';
    const name = (item as any)?.__name || '';
    const summary = text?.trim?.()?.split?.("\n")?.[0] || name || "Untitled";
    const blob = new Blob([text], { type: "text/plain" });
    const events = makeEvents(path, name);

    const aiResult = item?.aiAnswer ? H`<div class="ai-answer" data-kind="ai"><md-view src=${URL.createObjectURL(new Blob([item.aiAnswer], { type: "text/plain" }))}></md-view></div>` : null;

    return H`<details class="preference-accordion" data-accordion>
        <summary>
            <ui-icon icon="question"></ui-icon>
            <span>${summary}</span>
            <button class="plain" on:click=${(ev: Event) => { ev.preventDefault(); ev.stopPropagation(); events.doDownload(ev); }}>
                <ui-icon icon="download"></ui-icon>
            </button>
            <button class="plain" on:click=${(ev: Event) => { ev.preventDefault(); ev.stopPropagation(); events.doDelete(ev); }}>
                <ui-icon icon="trash"></ui-icon>
            </button>
        </summary>
        <div class="spoiler-content">
            <md-view src=${URL.createObjectURL(blob)}></md-view>
            ${aiResult ? H`<details class="ai-spoiler" open>
                <summary><ui-icon icon="sparkle"></ui-icon><span>AI Solution</span></summary>
                ${aiResult}
            </details>` : null}
        </div>
    </details>`;
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

const scrollToAccordion = (container: HTMLElement) => {
    const openEl = container.querySelector(`details[open]`);
    if (!openEl) return;
    const rect = openEl.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

//
const kinds = ["questions", "quests", "coding", "math", "solutions", "all"] as const;
const tabs = new Map<string, HTMLElement | null | string | any>(kinds?.map?.(kind => [kind, $ShowQuestsByType("/docs/" + kind, kind)]));

//
const renderTabName = (tabName: string) => {
    return tabName;
}

const getAIAnswer = async (question: any) => {
    // Placeholder for AI integration - currently returns null.
    console.info("AI helper not yet implemented", question);
    return null;
}

//
export const QuestsView = () => {
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        currentTab=${"all"}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="quests"
    ></ui-tabbed-box>`;

    const section = H`<section id="quests" class="quests-view quests">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button id="btn-upload"><ui-icon icon="upload"></ui-icon><span>Upload</span></button>
        <button id="btn-download"><ui-icon icon="download"></ui-icon><span>Download</span></button>
        <button id="btn-mount"><ui-icon icon="screwdriver"></ui-icon><span>Mount</span></button>
        <button id="btn-refresh"><ui-icon icon="arrows-clockwise"></ui-icon><span>Refresh</span></button>
        <button id="btn-ask"><ui-icon icon="magic-wand"></ui-icon><span>Ask AI</span></button>
        </div>
    </div>
    </section>` as HTMLElement;

    const tabDirOf = (name: string) => ("/docs/" + (kinds as any || "quests"));
    const getCurrentDir = () => tabDirOf((currentTab?.value || 'quests'));

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
    section.querySelector('#btn-refresh')?.addEventListener('click', async () => {
        toastSuccess("Refreshing");
        reloadTabs();
    });

    section.querySelector('#btn-ask')?.addEventListener('click', async () => {
        const currentTabPane = tabs.get(currentTab?.value || 'all') as HTMLElement;
        if (!currentTabPane) {
            toastError("Open a quest to request help");
            return;
        }
        const openDetails = currentTabPane.querySelector('details[open]');
        if (!openDetails) {
            toastError("Open a quest before asking AI");
            return;
        }
        toastSuccess("AI helper is thinking...");
        const question = openDetails.querySelector('md-view');
        const answer = await getAIAnswer(question);
        if (!answer) {
            toastError("AI helper not available yet");
            return;
        }
    });

    section.addEventListener('toggle', (ev: Event) => {
        const target = ev.target as HTMLDetailsElement;
        if (!target?.hasAttribute('data-accordion')) return;
        if (target.open) {
            scrollToAccordion(section);
        }
    });

    return section;
}
