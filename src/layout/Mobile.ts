import { H } from "fest/lure";

//
export const AppLayout = (content: HTMLElement)=>{
    const $layout = H`<ui-box-with-sidebar>
        <ui-tabbed-box class="c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
            ${content}
        </ui-tabbed-box>
    </ui-box-with-sidebar>`;

    //
    return $layout;
}
