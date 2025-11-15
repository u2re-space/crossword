import { computed } from "fest-src/fest/object/index";
import { H, C } from "fest/lure";

//
export const AppLayout = (currentView: { value: string }, existsViews: Map<string, any>, makeView: (key: string)=>any, sidebar: HTMLElement) => {
    // TODO: add support for async loading views (Object.TS, LUR.E)
    const contentView = H`<div class="view-box">
        <div class="toolbar" style="will-change: contents; background-color: transparent;">
            ${C(computed(currentView, (key)=>{
                const a = makeView(key)?.[0]

                return a;
            }))}
        </div>
        <div class="content" style="will-change: contents;">
            ${C(computed(currentView, (key)=>{
                const b = makeView(key)?.[1]

                return b;
            }))}
        </div>
    </div>`;

    // TODO: add support for async loading views (Object.TS, LUR.E)
    const $layout = H`<ui-tabbed-with-sidebar on:tab-changed=${(ev)=>{
        if (ev?.newTab && currentView.value != ev?.newTab && ev?.target == $layout) { currentView.value = ev.newTab ?? currentView.value; };
    }} prop:currentTab=${currentView} prop:userContent=${true} prop:tabs=${existsViews} class="app-layout">
        ${sidebar}
        ${contentView}
    </ui-tabbed-with-sidebar>`;
    return $layout;
}
