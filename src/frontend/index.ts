import { AppLayout, CURRENT_VIEW } from "./elements/layouts/AppLayout";
import { DataExplorer, PreferencesView, QuestsView, Settings } from "./elements/Views";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";

//
import "fest/fl-ui";

// @ts-ignore
import style from "./index.scss?inline";
import { sampleDays } from "../$test/Days";
import { Sidebar } from "./elements/layouts/Sidebar";

//
import { dropFile } from "fest/lure";
import { sampleTasks, writeSampleTask } from "../$test/Tasks";

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
        ["preferences", await PreferencesView()],
        ["quests", await QuestsView()],
        ["explorer", await DataExplorer()],
        ["settings", await Settings()]
    ]);

    //
    CURRENT_VIEW.value = [...views?.keys?.()]?.[0] || CURRENT_VIEW.value;
    const layout = AppLayout(views, CURRENT_VIEW, Sidebar(CURRENT_VIEW));
    mountElement?.append?.(layout);
    implementTestDrop(mountElement);
}
