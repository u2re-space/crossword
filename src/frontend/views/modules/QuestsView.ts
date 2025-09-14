/* Here will be math, coding, etc. questions (and answers by AI) */
/* Used for solving problems and questions by AI */

import { makeReactive } from "fest/object";
import { getDirectoryHandle, H, M } from "fest/lure";

//
const SOLUTIONS_DIR = "/docs/solutions/";
const QUEST_DIR = "/docs/quests/";
const CODING_DIR = "/docs/questions/coding/";
const MATH_DIR = "/docs/questions/math/";

//
const QuestItem = (quest: any) => {
    return H`<div class="quest-item"></div>`;
}

//
const $ShowQuestsByType = (DIR: string, TYPE: string, name?: string) => {
    name = name ?? DIR;
    const dataRef: any = makeReactive([]);
    const data = getDirectoryHandle(null, DIR)?.then?.(async (handle) => {
        const entries = await Array.fromAsync(handle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const quest = JSON.parse(await file.text());
            if (quest.type === TYPE) { dataRef.push(quest); }
            return quest;
        })?.filter?.((e) => e));
    })?.catch?.(console.error);
    const quests = M(dataRef, (quest) => {
        return QuestItem(quest);
    });
    return H`<div data-name="${name}" class="tab">${quests}</div>`;
}

//
const tabs = new Map<string, HTMLElement>([
    ["questions", $ShowQuestsByType(QUEST_DIR, "questions")],
    ["quests", $ShowQuestsByType(QUEST_DIR, "quests")],
    ["coding", $ShowQuestsByType(CODING_DIR, "coding")],
    ["math", $ShowQuestsByType(MATH_DIR, "math")],
    ["solutions", $ShowQuestsByType(SOLUTIONS_DIR, "solutions")],
]);

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const QuestsView = (currentTab: any) => {
    if (currentTab != null) { currentTab.value = "quests"; }

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="quests"
    ></ui-tabbed-box>`;

    //
    return H`<section class="quests-view quests">
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
