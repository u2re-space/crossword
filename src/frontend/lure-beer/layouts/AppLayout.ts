import { H, I } from "fest/lure";

//
export const AppLayout = (views: Map<string, HTMLElement>, currentView: { value: string }, sidebar: HTMLElement) => {
    const TOOLBAR = H`<div class="toolbar" slot="bar" style="background-color: transparent;">
        <div style="flex: 1; background-color: transparent;"></div>
    </div>`;

    //
    // Replace ui-box-with-sidebar with BeerCSS layout
    const $layout = H`<div class="row no-wrap app-layout">
        <div class="col s12 m3 l2 sidebar-container">
            ${sidebar}
        </div>
        <div class="col s12 m9 l10 content-container">
            ${TOOLBAR}
            ${I({ mapped: views, current: currentView })}
        </div>
    </div>`;
    return $layout;
}

