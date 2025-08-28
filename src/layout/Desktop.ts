import { H } from "fest/lure";

//
export const AppLayout = (content: HTMLElement)=>{
    const $layout = H`<ui-box-with-sidebar>
        <ui-tabbed-box>
            ${content}
        </ui-tabbed-box>
    </ui-box-with-sidebar>`;

    //
    return $layout;
}

