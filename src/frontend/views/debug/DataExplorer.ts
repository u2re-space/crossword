import { openDirectory, H, M } from "fest/lure";
import { dataCategories } from "@rs-core/service/Cache";

//
const rowFileMap = new WeakMap<HTMLElement, any>();
export const DataExplorer = () => {

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
    return H`<section id="items" class="data-view c2-surface">
    ${viewer}
    <div class="view-toolbar">
        <div class="button-set">
        <button>
            <ui-icon icon="upload"></ui-icon>
            <span>Upload</span>
        </button>
        <button>
            <ui-icon icon="download"></ui-icon>
            <span>Download</span>
        </button>
        <button>
            <ui-icon icon="screwdriver"></ui-icon>
            <span>Mount</span>
        </button>
        <button>
            <ui-icon icon="arrows-clockwise"></ui-icon>
            <span>Refresh</span>
        </button>
        </div>
    </div>
    </section>`;
};
