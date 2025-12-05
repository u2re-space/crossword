import { makeReactive, propRef, stringRef, subscribe } from "fest/object";
import { H, C, provide, orientRef } from "fest/lure";
import { navigate, historyState } from "fest/lure";
import { isPrimitive } from "fest-src/fest/core/index";
import { wallpaperState } from "@rs-frontend/utils/StateStorage";

//
let skipCreateNewView = false;
export const onClose = (tabName: string, currentView: any, existsViews: Map<string, any>, closingView?: string) => {
    let isClosed = false;
    if (tabName?.replace?.(/^#/, "") && (tabName?.replace?.(/^#/, "") == closingView?.replace?.(/^#/, "") || !closingView?.replace?.(/^#/, ""))) {
        tabName = tabName?.replace?.(/^#/, "") ?? tabName;
        if (!tabName || tabName == "home") return;

        //
        const curView = isPrimitive(currentView) ? (currentView?.replace?.(/^#/, "") ?? currentView) : ((currentView as { value: string })?.value?.replace?.(/^#/, "") ?? (currentView as { value: string })?.value);
        const oldView = (tabName || curView)?.replace?.(/^#/, "");
        const toReplace = [...existsViews?.keys?.()]?.filter?.(k => k != oldView && k != "home")?.[0] || "home";

        // We need to know if we are closing the ACTIVE view
        if (existsViews.has(oldView) && toReplace != oldView && oldView != "home") {
            existsViews.delete(oldView); isClosed = true;
        }

        //
        if ((curView == oldView || toReplace != curView) && isClosed) {
            // Use replaceState to avoid pushing this "close" action as a new navigation step
            navigate(`#${toReplace}`, existsViews.has(toReplace));
        }
    }
    return isClosed;
}

//
export function makeWallpaper() {
    const oRef = orientRef();
    const srcRef = stringRef("./assets/imgs/test.webp");
    subscribe([wallpaperState, "src"], (s) => provide("/user" + (s?.src || (typeof s == "string" ? s : null)))?.then?.(blob => (srcRef.value = URL.createObjectURL(blob)))?.catch?.(console.warn.bind(console)) || "./assets/imgs/test.webp");
    const CE = H`<canvas slot="underlay" style="pointer-events: none; min-inline-size: 0px; min-block-size: 0px; inline-size: stretch; block-size: stretch; max-block-size: stretch; max-inline-size: stretch; transform: none; scale: 1; inset: 0; pointer-events: none;" data-orient=${oRef} is="ui-canvas" data-src=${srcRef}></canvas>`;
    return CE;
}

//
//https://192.168.0.200/#home
const $defaultView = (location?.hash?.replace?.(/^#/, "") || "home");
export const AppLayout = (currentView: any, existsViews: Map<string, any>, makeView: (key: string) => any, sidebar: HTMLElement) => {
    const rPair = makeReactive([document.createComment(""), document.createComment("")])
    const setView = async (key: string, forceCreateNewView?: boolean) => {
        key = key?.replace?.(/^#/, "") ?? key;
        const $homeView = "home";

        // `skipCreateNewView` should depending on replace or push state happened
        if (!skipCreateNewView && !forceCreateNewView && (historyState as any)?.action != null) {
            skipCreateNewView ||= ["REPLACE", "POP", "BACK"]?.includes?.((historyState as any)?.action);
        }

        //
        if (forceCreateNewView || !key || key == $homeView) {
            skipCreateNewView = false;
        }

        //
        const ext = (existsViews?.get?.(key || $homeView) || existsViews?.get?.($homeView));
        const npr = (skipCreateNewView ? ext : (await makeView(key || $homeView) || await makeView($homeView))) || ext;
        skipCreateNewView = false;
        rPair[0] = await (npr?.[0] ?? rPair[0]);
        rPair[1] = await (npr?.[1] ?? rPair[1]);
    }

    //
    (sidebar as any).setView = setView;
    (sidebar as any).skipCreateNewView = (value: boolean = false) => { skipCreateNewView = value; };

    //
    // Initialize current view
    requestAnimationFrame(() => {
        if (currentView && !currentView?.value?.replace?.(/^#/, "")) {
            (currentView as { value: string }).value = $defaultView;
        }

        //
        setView(currentView?.value?.replace?.(/^#/, "") || "home", true);
        requestAnimationFrame(() => subscribe([currentView, "value"], (value: any) => {
            setView(value?.replace?.(/^#/, "") || "home", false);
        }));
    });

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const $layout = H`<ui-tabbed-with-sidebar on:tab-changed=${(ev) => {
        const $homeView = "home";//(location.hash?.replace?.(/^#/, "") || "home");
        const newTab = (ev?.newTab?.replace?.(/^#/, "") || $homeView)?.replace?.(/^#/, "");
        const curTab = ((isPrimitive(currentView) ? currentView : (currentView as { value: string }).value)?.replace?.(/^#/, "") || "home")?.replace?.(/^#/, "");
        if (newTab && curTab != newTab && ev?.target == $layout && existsViews.has(newTab)) {
            requestAnimationFrame(() => {
                skipCreateNewView = true;
                navigate(`#${newTab}`, existsViews.has(newTab));
            });
        };
    }} on:tab-close=${(ev: any) => {
        requestAnimationFrame(() => {
            skipCreateNewView = true;
            onClose(ev?.tabName, currentView, existsViews);
        });
    }} prop:currentTab=${currentView} prop:userContent=${true} prop:tabs=${existsViews} class="app-layout">
        ${sidebar}
        <div class="toolbar" style="will-change: contents; background-color: transparent;" slot="bar">
            ${C(propRef(rPair, 0))}
        </div>
        <div class="content" style="will-change: contents;">
            ${C(propRef(rPair, 1))}
        </div>
        ${makeWallpaper()}
    </ui-tabbed-with-sidebar>`;

    return $layout;
}
