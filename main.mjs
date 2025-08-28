/*
import "@picocss/pico/css/pico.classless.min.css";
import "shared/fest/dom/index.scss";
import "shared/fest/fl-ui/scss/index.scss";
import "shared/ui/EntityCard/_EntityCard.scss";
*/

//
import { H, Q } from "fest/lure";

//
import { AppLayout as MobileLayout } from "./src/layout/Mobile.ts";
import { TimelineView } from "./src/views/Timeline.ts";
import { AppLayout } from "./src/layout/Mobile.ts";
import { colorScheme } from "fest/fl-ui";
import { loadInlineStyle, default as loadCSS, initialize as initDOM } from "fest/dom";
import { makeReactive } from "fest/object";

//
const mount = document.getElementById("app");

//
function Sidebar() {
    return H`<nav class="c2-surface">
        <ul>
            <li><a href="#timeline" data-name="timeline">Timeline</a></li>
            <li><a href="#items" data-name="items">Items</a></li>
            <li><a href="#services" data-name="services">Services</a></li>
            <li><a href="#bonuses" data-name="bonuses">Bonuses</a></li>
        </ul>
    </nav>`;
}

//
async function bootstrap() {
    await initDOM(document.body);
    await loadCSS();

    //
    const content = H`<div>
        <ui-tabbed-box>
            <div data-name="timeline" class="c2-surface">${TimelineView()}</div>
            <div data-name="items" class="c2-surface"><p>Items placeholder</p></div>
            <div data-name="services" class="c2-surface"><p>Services placeholder</p></div>
            <div data-name="bonuses" class="c2-surface"><p>Bonuses placeholder</p></div>
        </ui-tabbed-box>
    </div>`;

    //
    const layout = MobileLayout(content);
    const sidebarEl = Sidebar();

    //
    if (sidebarEl) sidebarEl.slot = "sidebar";
    const barEl = H`<div><strong>RAS-klad</strong></div>`;
    if (barEl) barEl.slot = "bar";
    layout?.append?.(barEl, sidebarEl);
    mount?.append?.(layout);

    //
    const tabbed = layout?.querySelector?.('ui-tabbed-box');
    tabbed?.openTab?.('timeline');

    //
    if ('serviceWorker' in navigator) {
        try { await navigator.serviceWorker.register('/src/pwa/sw.mjs'); } catch(e) { console.warn(e); }
    }








    //
    Q("#app", document.documentElement)?.addEventListener?.("dragover", (event)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });

    //
    Q("#app", document.documentElement)?.addEventListener?.("drop", (event)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            console.log(file);
            if (file) { dropFile(file, "/user/images/"); }
        }
    });
}

bootstrap();
