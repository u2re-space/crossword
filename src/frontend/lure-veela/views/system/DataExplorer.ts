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
    const viewer = H`<ui-file-manager path="/user/" sidebar="auto" style="grid-column: 1 / -1;"></ui-file-manager>`;

    //
    const onUpload = () => {
        openPickerAndWrite(viewer?.path, 'text/markdown,text/plain,.md', true)?.then?.(() => {
            toastSuccess("Uploaded");
            currentWebDav?.sync?.upload?.();
        }).catch((e) => {
            toastError("Upload failed");
            console.warn(e);
        });
    }

    //
    const onDownload = () => {
        downloadByPath(viewer?.path)?.then?.(() => {
            toastSuccess("Downloaded");
        }).catch((e) => {
            toastError("Download failed");
            console.warn(e);
        });
    };

    //
    const onRefresh = () => {
        currentWebDav?.sync?.download?.(viewer?.path)?.then?.(() => {
            viewer?.loadPath?.(viewer?.path);
            toastSuccess("Refreshed");
        }).catch((e) => {
            toastError("Refresh failed");
            console.warn(e);
        });
    };

    //
    const onMount = async () => {
        /*try {
            const dirs = [
                '/user/',
                '/user/data/',
                '/user/docs/',
                '/timeline/',
                '/data/bonus/',
                '/data/service/',
                '/data/person/',
                '/data/contacts/',
                '/data/events/',
                '/data/factors/',
                '/docs/plans/',
                '/docs/ideas/',
                '/docs/notes/',
                '/docs/solutions/',
                '/docs/quests/',
                '/docs/questions/coding/',
                '/docs/questions/math/'
            ];
            for (const dir of dirs) await getDirectoryHandle(null, dir, { create: true } as any);
        } catch (e) { console.warn(e); }*/

        getDirectoryHandle(null, viewer?.path, { create: true })?.then?.(async () => {
            await mountAsRoot("user", true)?.catch?.(console.warn.bind(console));
            toastSuccess("Mounted");
        }).catch((e) => {
            toastError("Mount failed");
            console.warn(e);
        });
    }

    //
    const toolbar = H`<div slot="bar" class="view-toolbar" style="grid-column: 3 / -1;">
        <div class="button-set">
            <button id="mount-user-dir" on:click=${onMount}>
                <ui-icon icon="screwdriver"></ui-icon>
                <span>Mount User Directory</span>
            </button>
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
    const section = H`<section id="explorer" class="data-view c2-surface" style="grid-column: 2 / -1; grid-row: 2 / -1;" id="explorer">${viewer}</section>`;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: viewer?.path?.split?.("/")?.at?.(-1) });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);

    //
    const wrapper = H`<div style="display: grid; grid-template-columns: subgrid; grid-template-rows: subgrid; inline-size: stretch; block-size: stretch; grid-column: 1 / -1; grid-row: 1 / -1;">${toolbar}${section}</div>`;

    //
    return wrapper;
};
