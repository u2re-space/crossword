/* Here is will be preferences view, which used Markdown notes in directory /user/preferences/ */
/* Used for making plans, goals, etc. by AI */

//
import { H, M, getDirectoryHandle } from "fest/lure";
import { makeReactive, ref } from "fest/object";

//
const PLANS_DIR = "/docs/plans/";
const IDEAS_DIR = "/docs/ideas/";
const NOTES_DIR = "/docs/notes/";
const PREFERENCES_DIR = "/docs/preferences/";

//
const PreferenceItem = (preferenceMarkdown: any) => {
    const blob = new Blob([preferenceMarkdown], { type: "text/plain" });

    //
    return H`<div class="preference-item">
    <div class="spoiler-handler">${preferenceMarkdown?.trim?.()?.split?.("\n")?.[0]}</div>
    <div class="spoiler-content"><md-view src=${URL.createObjectURL(blob)}></md-view></div>
    </div>`;
}

//
const $ShowPreferencesByDir = (DIR: string, name: string) => {
    const dataRef: any = makeReactive([]);
    const data = getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const preference = await file.text();
            dataRef.push(preference);
            return preference;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);

    //
    const preferences = M(dataRef, (preference) => {
        return PreferenceItem(preference);
    });
    return H`<div data-name="${name}" class="content">${preferences}</div>`;
}

//
const tabs = new Map<string, HTMLElement>([
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
export const PreferencesView = (currentView?: any | null) => {
    currentView ??= ref("plans");
    if (currentView != null) { currentView.value = "plans"; }

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="preferences-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="upload"></ui-icon>
            <span>Upload</span>
        </button>
        <button>
            <ui-icon icon="download"></ui-icon>
            <span>Download</span>
        </button>
        <button>
            <ui-icon icon="screwdriver"></ui-icon>
            <span>Mount</span>
        </button>
        <button>
            <ui-icon icon="arrows-clockwise"></ui-icon>
            <span>Refresh</span>
        </button>
        </div>
    </div>
    </section>`;
}
