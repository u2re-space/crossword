import { makeReactive, propRef, subscribe } from "fest/object";
import { H, C } from "fest/lure";
import { navigate, historyState } from "fest/lure";
import { isPrimitive } from "fest-src/fest/core/index";

//
let skipCreateNewView = false;
export const onClose = (tabName: string, currentView: any, existsViews: Map<string, any>, closingView?: string) => {
    if (tabName) {
        tabName = tabName?.replace?.(/^#/, "") ?? tabName;
        if (!tabName || tabName == "home") return;

        //
        const curView = isPrimitive(currentView) ? (currentView?.replace?.(/^#/, "") ?? currentView) : ((currentView as { value: string })?.value?.replace?.(/^#/, "") ?? (currentView as { value: string })?.value);
        const oldView = (tabName || curView)?.replace?.(/^#/, "");
        const toReplace = ([...existsViews?.keys?.()]?.filter?.(k => k != oldView && k != "home")?.[0] || "home")?.replace?.(/^#/, "");

        // We need to know if we are closing the ACTIVE view
        if (existsViews.has(oldView) && oldView != "home" && (closingView != (toReplace || currentView?.value) || !closingView)) existsViews.delete(oldView);
        if (curView == oldView) {
            // Use replaceState to avoid pushing this "close" action as a new navigation step
            navigate(`#${toReplace || "home"}`, existsViews.has(toReplace || "home"));

            // Update the view reference. hashTargetLink will see the URL matches and skip pushState
            //currentView.value = toReplace;
        }
    }
}


//https://192.168.0.200/#home
export const AppLayout = (currentView: any, existsViews: Map<string, any>, makeView: (key: string) => any, sidebar: HTMLElement) => {
    //
    if (currentView && !isPrimitive(currentView) && !currentView.value) {
        (currentView as { value: string }).value ||= [...existsViews?.keys?.()]?.filter?.(k => k != "home")?.[0] || (location.hash?.replace?.(/^#/, "") || "home");
    }

    //
    const rPair = makeReactive([document.createComment(""), document.createComment("")])
    const setView = async (key) => {
        key = key?.replace?.(/^#/, "") ?? key;

        // `skipCreateNewView` should depending on replace or push state happened
        if (!skipCreateNewView) {
            skipCreateNewView = ((historyState as any)?.action == "REPLACE" || (historyState as any)?.action == "POP" || (historyState as any)?.action == "BACK");
        }

        //
        const ext = (existsViews?.get?.(key || (location.hash?.replace?.(/^#/, "") || "home")) || existsViews?.get?.(location.hash?.replace?.(/^#/, "") || "home"));
        const npr = (skipCreateNewView ? ext : (await makeView(key || (location.hash?.replace?.(/^#/, "") || "home")) || await makeView(location.hash?.replace?.(/^#/, "") || "home"))) || ext;
        skipCreateNewView = false;
        rPair[0] = await (npr?.[0] ?? rPair[0]);
        rPair[1] = await (npr?.[1] ?? rPair[1]);
    }

    //
    (sidebar as any).setView = setView;
    (sidebar as any).skipCreateNewView = (value: boolean = false) => { skipCreateNewView = value; };

    //
    subscribe([currentView, "value"], setView)
    setView((isPrimitive(currentView) ? currentView : (currentView as { value: string }).value)?.replace?.(/^#/, "") || (location.hash?.replace?.(/^#/, "") || "home"));

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
    const $layout = H`<ui-tabbed-with-sidebar on:tab-changed=${(ev)=>{
        if (ev?.newTab && (isPrimitive(currentView) ? currentView : (currentView as { value: string }).value)?.replace?.(/^#/, "") != ev?.newTab && ev?.target == $layout && existsViews.has(ev?.newTab || (location.hash?.replace?.(/^#/, "") || "home"))) {
            requestAnimationFrame(() => {
                skipCreateNewView = true;
                navigate(`#${ev.newTab ?? (isPrimitive(currentView) ? currentView : (currentView as { value: string }).value)?.replace?.(/^#/, "")}`, existsViews.has(ev?.newTab || (location.hash?.replace?.(/^#/, "") || "home")));
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
