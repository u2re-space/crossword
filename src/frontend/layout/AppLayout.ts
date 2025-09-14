import { H, I } from "fest/lure";
import { ref } from "fest/object";
import { Sidebar } from "./Sidebar";

//
export const AppLayout = (views: Map<string, HTMLElement>) => {
    const TOOLBAR = H`<div class="toolbar" slot="bar">
        <button><ui-icon icon="clipboard"></ui-icon><span>Paste and Recognize</span></button>
        <button><ui-icon icon="crop"></ui-icon><span>Snip and Recognize</span></button>
    </div>`;

    //
    const currentView = ref([...views?.keys?.()]?.[0]);
    const $layout = H`<ui-box-with-sidebar>${[TOOLBAR, I({ mapped: views, current: currentView }), Sidebar(currentView)]}</ui-box-with-sidebar>`;
    return $layout;
}
