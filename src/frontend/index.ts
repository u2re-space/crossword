import { AppLayout } from "./layout/AppLayout";
//import { AppLayout as DesktopLayout } from "./frontend/elements/layout/Mobile";
import { TasksTimelineView, DataView } from "./views/Views";
import { colorScheme } from "fest/fl-ui";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";
import { makeReactive } from "fest/object";
import { clearAllInDirectory, dropFile } from "fest/lure";

//
import "fest/fl-ui";

//
//const mount = document.getElementById("app");

// @ts-ignore
import style from "./index.scss?inline";
import { sampleTasks, writeSampleTask } from "@rs-core/test-case/Tasks";

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
    await (async () => {
        await clearAllInDirectory()?.catch?.(console.warn.bind(console));
        await Promise.all(sampleTasks.map((task) => writeSampleTask(task)?.catch?.(console.warn.bind(console))));
    })();

    //
    const views = new Map([
        ["timeline", await TasksTimelineView()],
        ["items", await DataView()]
    ]);

    //
    const layout = AppLayout(views);
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
            console.log(file);
            if (file) { dropFile(file, "/user/images/"); }
        }
    });
}
