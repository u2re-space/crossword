import { AppLayout } from "./layout/AppLayout";
import { PlannedTimeline, DataExplorer, ContactsView, BonusesView, ServicesView, PreferencesView, QuestsView, Settings } from "./views/Views";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";
import { clearAllInDirectory, dropFile } from "fest/lure";

//
import "fest/fl-ui";

// @ts-ignore
import style from "./index.scss?inline";
import { sampleDays } from "@rs-core/$test/Days";
import { sampleTasks, writeSampleTask } from "@rs-core/$test/Tasks";
import { Sidebar } from "./views/Sidebar";
import { ref } from "fest/object";

//
export default async function frontend(mountElement) {
    initDOM(document.body);
    loadInlineStyle(style);

    //
    /*const content = H`<div>
        <ui-tabbed-box>
            <div data-name="timeline" class="c2-surface">${TimelineView()}</div>
            <div data-name="items" class="c2-surface"><p>Items placeholder</p></div>
            <div data-name="services" class="c2-surface"><p>Services placeholder</p></div>
            <div data-name="bonuses" class="c2-surface"><p>Bonuses placeholder</p></div>
        </ui-tabbed-box>
    </div>`;*/

    //
    /*await (async () => {
        await clearAllInDirectory()?.catch?.(console.warn.bind(console));
        //await Promise.all(sampleTasks.map((task) => writeSampleTask(task)?.catch?.(console.warn.bind(console))));
    })();*/

    //
    const views = new Map([
        ["timeline", await PlannedTimeline(null, sampleDays)],
        ["contacts", await ContactsView()],
        ["bonuses", await BonusesView()],
        ["services", await ServicesView()],
        ["preferences", await PreferencesView()],
        ["quests", await QuestsView()],
        ["explorer", await DataExplorer()],
        ["settings", await Settings()]
    ]);

    //
    const currentView = ref([...views?.keys?.()]?.[0]);
    const layout = AppLayout(views, currentView, Sidebar(currentView));
    mountElement?.append?.(layout);

    //
    const tabbed = layout?.querySelector?.('ui-tabbed-box');
    tabbed?.openTab?.('timeline');

    //
    mountElement?.addEventListener?.("dragover", (event) => {
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });

    //
    mountElement?.addEventListener?.("drop", (event) => {
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) { dropFile(file, "/images/"); }
        }
    });
}
