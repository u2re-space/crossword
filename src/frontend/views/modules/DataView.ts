import { clearAllInDirectory, H, M } from "fest/lure";
import { FileManager } from "fest/fl-ui";
import { openDirectory } from "fest/lure";
import { dataCategories } from "@rs-core/api/dataset/Data";
import { sampleTasks, writeSampleTask } from "@rs-core/test-case/Tasks";

//
const rowFileMap = new WeakMap<HTMLElement, any>();
export const DataView = ()=>{

    // make folders of entity types
    const folders = M(dataCategories, (category) => {
        const folder = openDirectory(null, `/user/data/${category.id}/`, { create: true });
        const row = H`<div class="folder">${category.label}</div>`
        rowFileMap.set(row, folder);
        return row;
    });

    // make file manager
    const viewer = H`<ui-file-manager path="/user/" sidebar="auto"></ui-file-manager>`;

    // TODO: make JSON data editor and viewer for opened files...

    //
    return H`<section id="items" style="background-color: transparent;" class="data-view c2-surface">${viewer}</section>`;
};
