import { H } from "fest/lure";
import { Sidebar } from "./Sidebar";

//
export const AppLayout = (tabs: Map<string, HTMLElement>)=>{
    const $layout = H`<ui-box-with-sidebar>
        <h3 slot="bar">RAS-klad</h3>
        ${Sidebar}
        <ui-tabbed-box prop:tabs=${tabs}>
        </ui-tabbed-box>
    </ui-box-with-sidebar>`;

    //
    return $layout;
}
