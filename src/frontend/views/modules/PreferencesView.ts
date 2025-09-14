/* Here is will be preferences view, which used Markdown notes in directory /user/preferences/ */
/* Used for making plans, goals, etc. by AI */

import { H, M } from "fest/lure";

//
const PLANS_DIR = "/docs/plans/";
const IDEAS_DIR = "/docs/ideas/";
const NOTES_DIR = "/docs/notes/";

//
const AllPreferences = () => {
    const preferences = M([], (preference) => {
        return H`<div class="preference-item"></div>`;
    });
    return H`<div data-name="all" class="content">${preferences}</div>`;
}

//
const PlansPreferences = () => {
    const preferences = M([], (preference) => {
        return H`<div class="preference-item"></div>`;
    });
    return H`<div data-name="plans" class="content">${preferences}</div>`;
}

//
const IdeasPreferences = () => {
    const preferences = M([], (preference) => {
        return H`<div class="preference-item"></div>`;
    });
    return H`<div data-name="ideas" class="content">${preferences}</div>`;
}

//
const NotesPreferences = () => {
    const preferences = M([], (preference) => {
        return H`<div class="preference-item"></div>`;
    });
    return H`<div data-name="notes" class="content">${preferences}</div>`;
}

//
const tabs = new Map<string, HTMLElement>([
    ["plans", PlansPreferences()],
    ["ideas", IdeasPreferences()],
    ["notes", NotesPreferences()],
    ["all", AllPreferences()]
]);

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const PreferencesView = () => {
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="preferences-view">${tabbed}</section>`;
}
