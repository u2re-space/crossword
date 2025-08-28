import { H } from "fest/lure";

//
export const AppLayout = (tabs: Map<string, HTMLElement>)=>{
    const $layout = H`<ui-box-with-sidebar>
        <ui-tabbed-box prop:tabs=${tabs}>
        </ui-tabbed-box>
    </ui-box-with-sidebar>`;

    //
    /*const $tabbedBox = $layout.querySelector("ui-tabbed-box");
    if ($tabbedBox) {
        $tabbedBox.setTabs(tabs);
    }*/

    //
    return $layout;
}
