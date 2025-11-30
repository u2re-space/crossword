import { makeReactive, propRef, subscribe } from "fest/object";
import { H, C } from "fest/lure";
import { navigate, historyState } from "fest/lure";
import { isPrimitive } from "fest-src/fest/core/index";

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
const $defaultView = (location.hash?.replace?.(/^#/, "") || "home");
//https://192.168.0.200/#home
export const AppLayout = (currentView: any, existsViews: Map<string, any>, makeView: (key: string) => any, sidebar: HTMLElement) => {
    if (currentView && !isPrimitive(currentView) && !currentView.value) {
        (currentView as { value: string }).value ||= [...existsViews?.keys?.()]?.filter?.(k => k != $defaultView)?.[0] || $defaultView;
    }

    //
    const rPair = makeReactive([document.createComment(""), document.createComment("")])
    const setView = async (key) => {
        key = key?.replace?.(/^#/, "") ?? key;
        const $homeView = "home";

        // `skipCreateNewView` should depending on replace or push state happened
        if (!skipCreateNewView) {
            skipCreateNewView = ((historyState as any)?.action == "REPLACE" || (historyState as any)?.action == "POP" || (historyState as any)?.action == "BACK");
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
    subscribe([currentView, "value"], setView)
    setView((isPrimitive(currentView) ? currentView : (currentView as { value: string }).value)?.replace?.(/^#/, "") || "home");

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const contentView = H`<div class="view-box">
        <div class="toolbar" style="will-change: contents; background-color: transparent;">
            ${C(propRef(rPair, 0))}
        </div>
        <div class="content" style="will-change: contents;">
            ${C(propRef(rPair, 1))}
        </div>
    </div>`;

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
        ${contentView}
    </ui-tabbed-with-sidebar>`;

    return $layout;
}
