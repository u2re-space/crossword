import { H, I } from "fest/lure";
import { ref } from "fest/object";
import { Sidebar } from "./Sidebar";

//
export const AppLayout = (views: Map<string, HTMLElement>) => {
    const currentView = ref([...views?.keys?.()]?.[0]);
    const $layout = H`<ui-box-with-sidebar>${[H`<h3 slot="bar">RAS-klad</h3>`, I({ mapped: views, current: currentView }), Sidebar(currentView)]}</ui-box-with-sidebar>`;
    return $layout;
}
