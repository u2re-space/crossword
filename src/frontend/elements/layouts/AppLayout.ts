import { getDirectoryHandle, H, I } from "fest/lure";
import { handleClipboardItems, sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { ref } from "fest/object";

//
export const CURRENT_VIEW = ref("timeline");
export const AppLayout = (views: Map<string, HTMLElement>, currentView: { value: string }, sidebar: HTMLElement) => {
    const TOOLBAR = H`<div class="toolbar" slot="bar">
        <div style="flex: 1;"></div>
        <button id="paste-and-recognize"><ui-icon icon="clipboard"></ui-icon><span>Paste and Recognize</span></button>
        <button id="snip-and-recognize"><ui-icon icon="crop"></ui-icon><span>Snip and Recognize</span></button>
        <button id="mount-user-dir"><ui-icon icon="screwdriver"></ui-icon><span>Mount User Directory</span></button>
    </div>`;

    //
    const $layout = H`<ui-box-with-sidebar class="app-layout">${TOOLBAR}${I({ mapped: views, current: currentView })}${sidebar}</ui-box-with-sidebar>`;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "bonus" }).catch(console.warn);

    // wire: Paste and Recognize
    TOOLBAR.querySelector('#paste-and-recognize')?.addEventListener?.('click', async () => {
        try {
            if (navigator.clipboard && (navigator.clipboard as any).read) {
                const items = await (navigator.clipboard as any).read();
                await handleClipboardItems(items, (payload) => intake(payload));
                return;
            }
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) { await intake({ text }); }
        } catch (e) { console.warn(e); }
    });

    // wire: Snip and Recognize (fallback to image picker)
    TOOLBAR.querySelector('#snip-and-recognize')?.addEventListener?.('click', async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = false;
            input.onchange = async () => {
                const file = input.files?.[0];
                if (file) await intake({ file });
            };
            input.click();
        } catch (e) { console.warn(e); }
    });

    // wire: Mount User Directory (ensure structure exists)
    TOOLBAR.querySelector('#mount-user-dir')?.addEventListener?.('click', async () => {
        try {
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
        } catch (e) { console.warn(e); }
    });
    return $layout;
}
