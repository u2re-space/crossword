/*
import "@picocss/pico/css/pico.classless.min.css";
import "shared/fest/dom/index.scss";
import "shared/fest/fl-ui/scss/index.scss";
import "shared/ui/EntityCard/_EntityCard.scss";
*/

//
import { H, Q } from "fest/lure";

//
import { AppLayout as DesktopLayout } from "./frontend/elements/layout/Desktop";
import { TasksTimelineView } from "./frontend/views/Views";
import { colorScheme } from "fest/fl-ui";
import { loadInlineStyle, default as loadCSS, initialize as initDOM } from "fest/dom";
import { makeReactive } from "fest/object";

//
//const mount = document.getElementById("app");

//
import style from "./index.scss?inline";
export default async function bootstrap(mountElement) {
    await initDOM(document.body);
    await loadCSS();
    await loadInlineStyle(style);

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
    const tabs = new Map([
        ["timeline", TasksTimelineView()],
    ]);

    //
    const layout = DesktopLayout(tabs);

    //
    mountElement?.append?.(layout);

    //
    const tabbed = layout?.querySelector?.('ui-tabbed-box');
    tabbed?.openTab?.('timeline');

    //
    mountElement?.addEventListener?.("dragover", (event)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });

    //
    mountElement?.addEventListener?.("drop", (event)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            console.log(file);
            if (file) { dropFile(file, "/user/images/"); }
        }
    });
}
