import { openDirectory, H, M, getDirectoryHandle } from "fest/lure";
import { dataCategories } from "@rs-core/service/Cache";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { downloadByPath, openPickerAndWrite } from "@rs-frontend/utils/FileOps";
import { toastError, toastSuccess } from "@rs-frontend/utils/Toast";
import { currentWebDav } from "@rs-core/config/Settings";

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
    const viewer = H`<ui-file-manager path="/user/" sidebar="auto"></ui-file-manager>`;

    //
    const onUpload = () => {
        openPickerAndWrite(viewer?.path, 'text/markdown,text/plain,.md', true)?.then(() => {
            toastSuccess("Uploaded");
            currentWebDav?.sync?.upload?.();
        }).catch((e) => {
            toastError("Upload failed");
            console.warn(e);
        });
    }

    //
    const onDownload = () => {
        downloadByPath(viewer?.path)?.then(() => {
            toastSuccess("Downloaded");
        }).catch((e) => {
            toastError("Download failed");
            console.warn(e);
        });
    };

    //
    const onMount = () => {
        getDirectoryHandle(null, viewer?.path, { create: true })?.then(() => {
            toastSuccess("Mounted");
        }).catch((e) => {
            toastError("Mount failed");
            console.warn(e);
        });
    };

    //
    const onRefresh = () => {
        currentWebDav?.sync?.download?.(viewer?.path).then(() => {
            viewer?.loadPath?.(viewer?.path);
            toastSuccess("Refreshed");
        }).catch((e) => {
            toastError("Refresh failed");
            console.warn(e);
        });
    };

    //
    const toolbar = H`<div class="view-toolbar">
        <div class="button-set">
            <button type="button" on:click=${onUpload}>
                <ui-icon icon="upload"></ui-icon>
                <span>Upload</span>
            </button>
            <button type="button" on:click=${onDownload}>
                <ui-icon icon="download"></ui-icon>
                <span>Download</span>
            </button>
            <button type="button" on:click=${onMount}>
                <ui-icon icon="screwdriver"></ui-icon>
                <span>Mount</span>
            </button>
            <button type="button" on:click=${onRefresh}>
                <ui-icon icon="arrows-clockwise"></ui-icon>
                <span>Refresh</span>
            </button>
        </div>
    </div>`

    //
    const section = H`<section id="items" class="data-view c2-surface">${viewer}${toolbar}</section>`;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: viewer?.path?.split?.("/")?.at?.(-1) });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
};
