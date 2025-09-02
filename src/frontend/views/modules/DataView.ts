import { H, M } from "fest/lure";
import { FileManager } from "fest/fl-ui";
import { openDirectory } from "fest/lure";
import { categories } from "../../../core/dataset/Data";

//
const rowFileMap = new WeakMap<HTMLElement, any>();
export const DataView = ()=>{
    // make folders of entity types
    const folders = M(categories, (category)=>{
        const folder = openDirectory(null, `/user/${category.id}/`, {create: true});
        const row = H`<div class="folder">${category.label}</div>`
        rowFileMap.set(row, folder);
        return row;
    });

    // make file manager
    const viewer = H`<ui-file-manager path="/user/" sidebar="auto"></ui-file-manager>`;

    // TODO: make JSON data editor and viewer for opened files...

    //
    return H`<section class="data-view">${viewer}</section>`;
};
