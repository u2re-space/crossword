import { openDirectory, H, M, getDirectoryHandle, mountAsRoot } from "fest/lure";
import { dataCategories } from "@rs-core/service/Cache";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { toastError, toastSuccess } from "@rs-frontend/lure-beer/overlays/Toast";
import { currentWebDav } from "@rs-core/config/Settings";
import { downloadByPath, openPickerAndWrite } from "@rs-frontend/utils/FileOps";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";

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

    // make file manager - replace ui-file-manager with BeerCSS implementation
    const viewer = H`<div class="file-manager" data-path="/user/"></div>` as HTMLElement;
    (viewer as any).path = "/user/";
    (viewer as any).loadPath = (path: string) => {
        (viewer as any).path = path;
        viewer.setAttribute("data-path", path);
    };

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
    const toolbar = H`<div class="view-toolbar">
        <div class="button-set">
            <button id="mount-user-dir" on:click=${onMount}>
                <ui-phosphor-icon icon="screwdriver"></ui-phosphor-icon>
                <span>Mount User Directory</span>
            </button>
            <button type="button" on:click=${onUpload}>
                <ui-phosphor-icon icon="upload"></ui-phosphor-icon>
                <span>Upload</span>
            </button>
            <button type="button" on:click=${onDownload}>
                <ui-phosphor-icon icon="download"></ui-phosphor-icon>
                <span>Download</span>
            </button>
            <button type="button" on:click=${onMount}>
                <ui-phosphor-icon icon="screwdriver"></ui-phosphor-icon>
                <span>Mount</span>
            </button>
            <button type="button" on:click=${onRefresh}>
                <ui-phosphor-icon icon="arrows-clockwise"></ui-phosphor-icon>
                <span>Refresh</span>
            </button>
        </div>
    </div>`

    //
    const section = H`<section id="explorer" class="data-view c2-surface">${viewer}${toolbar}</section>`;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: viewer?.path?.split?.("/")?.at?.(-1) });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
};
