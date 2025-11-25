import { addToCallChain, computed, subscribe } from "fest-src/fest/object/index";
import { H, C } from "fest/lure";
import { applyActive } from "./Sidebar";



//
export const AppLayout = (currentView: { value: string }, existsViews: Map<string, any>, makeView: (key: string)=>any, sidebar: HTMLElement) => {
    const unsubscribe = currentView
        ? subscribe([currentView, "value"], (nextValue, _, oldValue) => {
            nextValue = nextValue?.replace?.(/^#/, "") ?? nextValue;
            oldValue = oldValue?.replace?.(/^#/, "") ?? oldValue;
            if (nextValue && (oldValue ||= currentView?.value) != nextValue) {
                applyActive(nextValue, oldValue, existsViews, makeView, currentView);
            }
        })
        : null;

    //
    const evCb: [any, AddEventListenerOptions] = [(ev)=>{
        applyActive(ev?.newURL || window.location.hash, currentView?.value, existsViews, makeView, currentView);
    }, { passive: true }];
    window.addEventListener("hashchange", evCb[0], evCb[1]);

    //
    addToCallChain(sidebar, Symbol.dispose, () => {
        if (typeof unsubscribe == "function") {
            unsubscribe();
        } else if (unsubscribe?.[Symbol.dispose]) {
            unsubscribe[Symbol.dispose]();
        }
        window.removeEventListener("hashchange", evCb[0], evCb[1]);
    });

    //
    if (currentView && !currentView.value) {
        currentView.value ||= [...existsViews?.keys?.()]?.[0] || currentView.value || "home";
    }

    //
    applyActive(currentView?.value, [...existsViews?.keys?.()]?.[0] || "home", existsViews, makeView, currentView);

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const contentView = H`<div class="view-box">
        <div class="toolbar" style="will-change: contents; background-color: transparent;">
            ${C(computed(currentView, (key)=>{
                // Avoid layout thrashing
                return makeView(key || "home")?.[0] || null;
            }))}
        </div>
        <div class="content" style="will-change: contents;">
            ${C(computed(currentView, (key)=>{
                return makeView(key || "home")?.[1] || null;
            }))}
        </div>
    </div>`;

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const $layout = H`<ui-tabbed-with-sidebar on:tab-changed=${(ev)=>{
        if (ev?.newTab && currentView.value != ev?.newTab && ev?.target == $layout) { currentView.value = ev.newTab ?? currentView.value; };
    }} on:tab-close=${(ev: any)=>{
        const tabName = ev?.tabName;
        if (tabName) {
            if (currentView.value == tabName) {
                currentView.value = [...existsViews?.keys?.()]?.filter?.(k => k != tabName)?.[0] || "home";
            }

            //
            requestIdleCallback(() => {
                if (existsViews.has(tabName) && tabName != "home") {
                    existsViews.delete(tabName);

                    //
                    if (tabName != "home" && currentView.value != tabName) {
                        document.querySelectorAll?.(`[data-view-id="${tabName}"]`)?.forEach?.((el: any)=>{ el?.remove?.(); });
                    }
                }
            });
        }
    }} prop:currentTab=${currentView} prop:userContent=${true} prop:tabs=${existsViews} class="app-layout">
        ${sidebar}
        ${contentView}
    </ui-tabbed-with-sidebar>`;
    return $layout;
}
