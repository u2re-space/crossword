import { makeReactive, propRef, subscribe } from "fest/object";
import { H, C } from "fest/lure";

//
let skipCreateNewView = false;
export const onClose = (tabName: string, currentView: { value: string }, existsViews: Map<string, any>)=>{
    if (tabName) {
        tabName = tabName?.replace?.(/^#/, "") ?? tabName;
        if (!tabName || tabName == "home") return;

        //
        const oldView = (tabName || currentView.value)?.replace?.(/^#/, "") ?? (tabName || currentView.value);
        const toReplace = ([...existsViews?.keys?.()]?.filter?.(k => k != oldView && k != "home")?.[0] || "home")?.replace?.(/^#/, "") ?? "home";

        // We need to know if we are closing the ACTIVE view
        const isClosingActive = (currentView.value == oldView);

        if (existsViews.has(oldView)) existsViews.delete(oldView);

        if (isClosingActive) {
            // Use replaceState to avoid pushing this "close" action as a new navigation step
            const newHash = toReplace == "home" ? "" : toReplace;
            history.replaceState(null, "", "#" + newHash);

            // Update the view reference. hashTargetLink will see the URL matches and skip pushState
            currentView.value = toReplace;
        }
    }
}


//https://192.168.0.200/#home
export const AppLayout = (currentView: { value: string }, existsViews: Map<string, any>, makeView: (key: string) => any, sidebar: HTMLElement) => {
    //
    if (currentView && !currentView.value) {
        currentView.value ||= [...existsViews?.keys?.()]?.filter?.(k => k != "home")?.[0] || "home";
    }

    //
    /*const choice = computed(currentView, (key)=>{
        // Avoid layout thrashing
        return (makeView(key || "home") || makeView("home")) || (existsViews?.get?.(key || "home") || existsViews?.get?.("home"));
    })*/

    //
    const rPair = makeReactive([document.createComment(""), document.createComment("")])
    const setView = async (key) => {
        const ext = (existsViews?.get?.(key || "home") || existsViews?.get?.("home"));
        const npr = (skipCreateNewView ? ext : (await makeView(key || "home") || await makeView("home"))) || ext;
        skipCreateNewView = false;
        rPair[0] = await (npr?.[0] ?? rPair[0]);
        rPair[1] = await (npr?.[1] ?? rPair[1]);
    }

    //
    (sidebar as any).setView = setView;
    (sidebar as any).skipCreateNewView = (value: boolean = false) => { skipCreateNewView = value; };

    //
    subscribe([currentView, "value"], setView)
    setView(currentView.value || "home");

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
        if (ev?.newTab && currentView.value != ev?.newTab && ev?.target == $layout && existsViews.has(ev?.newTab)) {
            requestAnimationFrame(() => {
                skipCreateNewView = true;
                currentView.value = ev.newTab ?? currentView.value;
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
