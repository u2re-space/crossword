import { openDirectory, H, M, getDirectoryHandle, mountAsRoot } from "fest/lure";
import { dataCategories } from "@rs-core/service/Cache";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { toastError, toastSuccess } from "@rs-frontend/lure-veela/overlays/Toast";
import { currentWebDav } from "@rs-core/config/Settings";
import { downloadByPath, openPickerAndWrite } from "@rs-frontend/utils/FileOps";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";

//
const makeFragment = (children: HTMLElement[]) => {
    const fragment = document.createDocumentFragment();
    children.forEach(child => fragment.appendChild(child));
    return fragment;
}

//
const rowFileMap = new WeakMap<HTMLElement, any>();
export const DataExplorer = () => {

    // make folders of entity types
    const folders = M(dataCategories, (category) => {
        const folder = openDirectory(null, `/data/${category.id}/`, { create: true });
        const row = H`<div class="folder">${category.label}</div>`
        rowFileMap.set(row, folder);
        return row;
    });

    // make file manager
    const viewer  = H`<ui-file-manager path="/user/" sidebar="auto" style="grid-column: 1 / -1; grid-row: 1 / -1;"></ui-file-manager>`;
    const section = H`<section id="explorer" class="data-view c2-surface" style="grid-column: 2 / -1; grid-row: 2 / -1;" id="explorer">${viewer}</section>`;
    const intake  = (payload) => sendToEntityPipeline(payload, { entityType: viewer?.path?.split?.("/")?.at?.(-1) });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return H`${section}`;;
};
