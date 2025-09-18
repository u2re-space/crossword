import { H, I, getDirectoryHandle } from "fest/lure";
import { pushPendingToFS } from "@rs-core/workers/FileSystem";

//
export const AppLayout = (views: Map<string, HTMLElement>, currentView: { value: string }, sidebar: HTMLElement) => {
    const TOOLBAR = H`<div class="toolbar" slot="bar">
        <div style="flex: 1;"></div>
        <button id="paste-and-recognize"><ui-icon icon="clipboard"></ui-icon><span>Paste and Recognize</span></button>
        <button id="snip-and-recognize"><ui-icon icon="crop"></ui-icon><span>Snip and Recognize</span></button>
        <button id="mount-user-dir"><ui-icon icon="screwdriver"></ui-icon><span>Mount User Directory</span></button>
    </div>`;

    //
    const $layout = H`<ui-box-with-sidebar>${[TOOLBAR, I({ mapped: views, current: currentView }), sidebar]}</ui-box-with-sidebar>`;

    // helpers
    const postShareTarget = async (payload: { text?: string, url?: string, file?: File | Blob }) => {
        const fd = new FormData();
        if (payload.text) fd.append('text', payload.text);
        if (payload.url) fd.append('url', payload.url);
        if (payload.file) fd.append('files', payload.file as any, (payload as any)?.file?.name || 'pasted');
        const resp = await fetch('/share-target', { method: 'POST', body: fd });
        const out = await resp.json().catch(() => ([]));
        // try flush queued writes for known entity type (current SW uses "bonus")
        await pushPendingToFS('bonus').catch(console.warn.bind(console));
        return out;
    };

    // wire: Paste and Recognize
    TOOLBAR.querySelector('#paste-and-recognize')?.addEventListener?.('click', async () => {
        try {
            // Attempt rich clipboard read
            if (navigator.clipboard && (navigator.clipboard as any).read) {
                const items = await (navigator.clipboard as any).read();
                for (const item of items) {
                    for (const type of item.types) {
                        if (type.startsWith('text/')) {
                            const text = await (await item.getType(type))?.text?.();
                            if (text?.startsWith?.("data:image/") && text?.includes?.(";base64,")) { // @ts-ignore
                                const arrayBuffer = Uint8Array.fromBase64(text.split(';base64,')[1]);
                                const type = text.split(';')[0].split(':')[1];
                                await postShareTarget({ file: new File([arrayBuffer], 'clipboard-image', { type }) });
                                return;
                            } else {
                                await postShareTarget({ text });
                                return;
                            }
                        }
                        if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            await postShareTarget({ file: new File([blob], 'clipboard-image', { type: type.startsWith('image/') ? type : 'image/png' }) });
                            return;
                        }
                    }
                }
            }
            // Fallback to text
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) { await postShareTarget({ text }); return; }
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
                if (file) await postShareTarget({ file });
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
