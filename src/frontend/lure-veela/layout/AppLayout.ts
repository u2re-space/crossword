import { $trigger, addToCallChain, computed, subscribe } from "fest/object";
import { H, C } from "fest/lure";
import { applyActive } from "./Sidebar";

//
export const onClose = (tabName: string, currentView: { value: string }, existsViews: Map<string, any>, makeView: (key: string)=>any)=>{
    if (tabName) {
        tabName = tabName?.replace?.(/^#/, "") ?? tabName;
        if (!tabName || tabName == "home") return;

        //
        const oldView = (tabName || currentView.value)?.replace?.(/^#/, "") ?? (tabName || currentView.value);
        if (currentView.value == oldView && existsViews.has(oldView)) {
            currentView.value = [...existsViews?.keys?.()]?.filter?.(k => k != oldView && k != "home")?.[0] || "home";
            //currentView?.[$trigger]?.();
        }

        //
        if (existsViews.has(oldView) && oldView != "home" && oldView != currentView.value) {
            applyActive(currentView.value, oldView, existsViews, makeView);
            existsViews.delete(oldView);

            // remove redundant elements if still remains
            requestIdleCallback(() => {
                requestAnimationFrame(() => {
                    if (!existsViews.has(oldView)) {
                        document.querySelectorAll(`[data-view-id="${oldView}"]`)?.forEach?.((el: any) => { el?.remove?.(); });
                    }
                });
            });
        }
    }
}


//https://192.168.0.200/#home
export const AppLayout = (currentView: { value: string }, existsViews: Map<string, any>, makeView: (key: string) => any, sidebar: HTMLElement) => {
    const unsubscribe = currentView
        ? subscribe([currentView, "value"], (nextValue, _, oldValue) => {
            nextValue = nextValue?.replace?.(/^#/, "") ?? nextValue;
            oldValue = (oldValue?.replace?.(/^#/, "") ?? oldValue) || currentView?.value;
            requestIdleCallback(() => {
                applyActive(nextValue, oldValue, existsViews, makeView, currentView);
            });
        })
        : null;

    //
    addToCallChain(sidebar, Symbol.dispose, () => {
        if (typeof unsubscribe == "function") {
            unsubscribe();
        } else if (unsubscribe?.[Symbol.dispose]) {
            unsubscribe[Symbol.dispose]();
        }
    });

    //
    if (currentView && !currentView.value) {
        currentView.value ||= [...existsViews?.keys?.()]?.filter?.(k => k != "home")?.[0] || "home";
    }

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const contentView = H`<div class="view-box">
        <div class="toolbar" style="will-change: contents; background-color: transparent;">
            ${C(computed(currentView, (key)=>{
                // Avoid layout thrashing
                return (makeView(key || "home")?.[0] || existsViews?.get?.(key || "home")?.[0] || (makeView("home")?.[0] || existsViews?.get?.("home")?.[0]));
            }))}
        </div>
        <div class="content" style="will-change: contents;">
            ${C(computed(currentView, (key)=>{
                return (makeView(key || "home")?.[1] || existsViews?.get?.(key || "home")?.[1] || (makeView("home")?.[1] || existsViews?.get?.("home")?.[1]));
            }))}
        </div>
    </div>`;

    //
    applyActive(currentView?.value?.replace?.(/^#/, "") || "home", null, existsViews, makeView, currentView);

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const $layout = H`<ui-tabbed-with-sidebar on:tab-changed=${(ev)=>{
        if (ev?.newTab && currentView.value != ev?.newTab && ev?.target == $layout) { currentView.value = ev.newTab ?? currentView.value; };
    }} on:tab-close=${(ev: any)=>{
        onClose(ev?.tabName, currentView, existsViews, makeView);
    }} prop:currentTab=${currentView} prop:userContent=${true} prop:tabs=${existsViews} class="app-layout">
        ${sidebar}
        ${contentView}
    </ui-tabbed-with-sidebar>`;

    return $layout;
}
