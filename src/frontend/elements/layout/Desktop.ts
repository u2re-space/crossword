import { H, M, I } from "fest/lure";
import { Sidebar } from "./Sidebar";
import { ref } from "fest/object";

//
export const AppLayout = (views: Map<string, HTMLElement>)=>{
    const currentView = ref([...views?.keys?.()]?.[0]);
    const $layout = H`<ui-box-with-sidebar>${[H`<h3 slot="bar">RAS-klad</h3>`, I({mapped: views, current: currentView}), Sidebar]}</ui-box-with-sidebar>`;

    //
    // return layout
    //
    return $layout;
}
