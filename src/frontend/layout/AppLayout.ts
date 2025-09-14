import { H, I } from "fest/lure";

//
export const AppLayout = (views: Map<string, HTMLElement>, currentView: { value: string }, sidebar: HTMLElement) => {
    const TOOLBAR = H`<div class="toolbar" slot="bar">
        <button><ui-icon icon="calendar"></ui-icon><span>Make Timeline Plan</span></button>
        <div style="flex: 1;"></div>
        <button><ui-icon icon="clipboard"></ui-icon><span>Paste and Recognize</span></button>
        <button><ui-icon icon="crop"></ui-icon><span>Snip and Recognize</span></button>
    </div>`;

    //
    const $layout = H`<ui-box-with-sidebar>${[TOOLBAR, I({ mapped: views, current: currentView }), sidebar]}</ui-box-with-sidebar>`;
    return $layout;
}
