import { H, provide } from "fest/lure";
import "fest/fl-ui";

//
const makeURL = (src: any)=>{
    if (URL.canParse(src?.trim?.() || "", typeof (typeof window != "undefined" ? window : globalThis)?.location == "undefined" ? undefined : ((typeof window != "undefined" ? window : globalThis)?.location?.origin || ""))) {
        return src;
    } else
    if (src instanceof Blob || src instanceof File) {
        return URL.createObjectURL(src);
    }
    return src;
}

// View
export const MakeMarkdownView = async (path: string, id: string) => {
    const view = H`<md-view src=${path} style="block-size: 100%; overflow: auto; display: block;" class="viewer-section"></md-view>`;
    const section = H`<section id=${id} class="data-view c2-surface" style="grid-column: 2 / -1; grid-row: 2 / -1;">${view}</section>`;
    return section;
}
