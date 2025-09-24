import { AppLayout } from "./elements/layouts/AppLayout";
import { PlannedTimeline, DataExplorer, ContactsView, BonusesView, ServicesView, PreferencesView, QuestsView, Settings } from "./elements/Views";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";

//
import "fest/fl-ui";

// @ts-ignore
import style from "./index.scss?inline";
import { sampleDays } from "@rs-core/$test/Days";
import { sampleTasks, writeSampleTask } from "@rs-core/$test/Tasks";
import { Sidebar } from "./elements/layouts/Sidebar";
import { ref } from "fest/object";

//
import { dropFile } from "fest/lure";

//
const implementTestDrop = (mountElement: HTMLElement) => {
    //
    mountElement?.addEventListener?.("dragover", (event) => {
        const eventTarget = event?.target as HTMLElement;
        if (eventTarget?.matches?.("#app") || eventTarget?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });

    //
    mountElement?.addEventListener?.("drop", (event) => {
        const eventTarget = event?.target as HTMLElement;
        if (eventTarget?.matches?.("#app") || eventTarget?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer?.files[0];
            if (file && file.type.startsWith("image/")) { dropFile(file, "/images/")?.catch?.(console.warn.bind(console)); }
        }
    });
}

//
export default async function frontend(mountElement) {
    initDOM(document.body);
    loadInlineStyle(style);

    //
    await (async () => {
        //await clearAllInDirectory()?.catch?.(console.warn.bind(console));
        await Promise.all(sampleTasks.map((task) => writeSampleTask(task)?.catch?.(console.warn.bind(console))));
    })();

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
    implementTestDrop(mountElement);
}
