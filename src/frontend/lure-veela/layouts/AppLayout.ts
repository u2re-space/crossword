import { H, I } from "fest/lure";

//
export const AppLayout = (views: Map<string, HTMLElement>, actions: Map<string, HTMLElement>, currentView: { value: string }, sidebar: HTMLElement) => {
    const TOOLBAR = H`<div class="toolbar" slot="bar" style="background-color: transparent;">
        ${I({ mapped: actions, current: currentView })}
    </div>`;

    //
    const $layout = H`<ui-box-with-sidebar class="app-layout">
        ${TOOLBAR}
        ${I({ mapped: views, current: currentView })}
        ${sidebar}
    </ui-box-with-sidebar>`;
    return $layout;
}
