import { getDirectoryHandle } from "fest/lure";
import { handleDataTransferFiles, postShareTarget, postShareTargetRecognize, sanitizeFileName, writeFileSmart, writeFilesToDir } from "@rs-core/workers/FileSystem";

//
export const bindDropToDir = (host: HTMLElement, dir: string) => {
    const onDragOver = (ev: DragEvent) => {
        ev.preventDefault();
        (host as any).dataset.dragover = 'true';
    };
    const onDragLeave = () => { delete (host as any).dataset.dragover; };
    const onDrop = async (ev: DragEvent) => {
        ev.preventDefault();
        delete (host as any).dataset.dragover;
        try {
            const files: File[] = Array.from(ev.dataTransfer?.files ?? []);
            for (const file of files) {
                dir = dir?.trim?.();
                dir = dir?.endsWith?.('/') ? dir : (dir + '/');
                await writeFileSmart(null, dir, file);
            }
            host.dispatchEvent(new CustomEvent('dir-dropped', { detail: { count: files.length }, bubbles: true }));
        } catch (e) { console.warn(e); }
    };
    host.addEventListener('dragover', onDragOver);
    host.addEventListener('dragleave', onDragLeave);
    host.addEventListener('drop', onDrop);
    return () => {
        host.removeEventListener('dragover', onDragOver);
        host.removeEventListener('dragleave', onDragLeave);
        host.removeEventListener('drop', onDrop);
    };
}

//
export const openPickerAndWrite = async (dir: string, accept = "*/*", multiple = true) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    (input as any).multiple = multiple;
    const result = await new Promise<number>((resolve) => {
        input.onchange = async () => {
            dir = dir?.trim?.();
            dir = dir?.endsWith?.('/') ? dir : (dir + '/');
            try { resolve(await writeFilesToDir(dir, input.files || ([] as any))); }
            catch { resolve(0); }
        };
        input.click();
    });
    return result;
}

//
export const openPickerAndRecognize = async (dir: string, accept = "*/*", multiple = true) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    (input as any).multiple = multiple;
    const result = await new Promise<void>((resolve) => {
        input.onchange = async () => {
            dir = dir?.trim?.();
            dir = dir?.endsWith?.('/') ? dir : (dir + '/');
            try { resolve(await handleDataTransferFiles(input.files || ([] as any), postShareTargetRecognize)); }
            catch { resolve(); }
        };
        input.click();
    });
    return result;
}

//
export const openPickerAndAnalyze = async (dir: string, accept = "*/*", multiple = true) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    (input as any).multiple = multiple;
    const result = await new Promise<void>((resolve) => {
        input.onchange = async () => {
            dir = dir?.trim?.();
            dir = dir?.endsWith?.('/') ? dir : (dir + '/');
            try { resolve(await handleDataTransferFiles(input.files || ([] as any), postShareTarget)); }
            catch { resolve(); }
        };
        input.click();
    });
    return result;
}

//
export const downloadByPath = async (path: string, suggestedName?: string) => {
    const lastSlash = path.lastIndexOf('/');
    const dir = path.slice(0, Math.max(0, lastSlash + 1));
    const name = suggestedName || path.slice(lastSlash + 1);
    const dirHandle: any = await getDirectoryHandle(null, dir);
    const fileHandle: any = await dirHandle.getFileHandle(name, { create: false });
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

//
export const pasteIntoDir = async (dir: string) => {
    try {
        // Rich clipboard first
        if ((navigator.clipboard as any)?.read) {
            const items = await (navigator.clipboard as any).read();
            for (const item of items) {
                for (const type of item.types) {
                    const blob = await item.getType(type);
                    const ext = type.split('/').pop() || '';
                    const file = new File([blob], sanitizeFileName(`pasted-${Date.now()}.${ext}`), { type });
                    dir = dir?.trim?.();
                    dir = dir?.endsWith?.('/') ? dir : (dir + '/');
                    await writeFileSmart(null, dir, file);
                }
            }
            return true;
        }

        // Text fallback
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
            const file = new File([text], sanitizeFileName(`pasted-${Date.now()}.txt`), { type: 'text/plain' });
            dir = dir?.trim?.();
            dir = dir?.endsWith?.('/') ? dir : (dir + '/');
            await writeFileSmart(null, dir, file);
            return true;
        }
    } catch (e) { console.warn(e); }
    return false;
}
