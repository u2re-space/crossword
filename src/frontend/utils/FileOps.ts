import { getDirectoryHandle, handleIncomingEntries } from "fest/lure";
import { handleDataTransferFiles, postCommitAnalyze, postCommitRecognize, writeFilesToDir } from "@rs-core/workers/FileSystem";
import { analyzeRecognizeUnified } from "@rs-core/service/AI-ops/RecognizeData";
import { sanitizeFileName, writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

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
            await handleIncomingEntries(ev.dataTransfer, dir);
            const count = (ev.dataTransfer?.items?.length || ev.dataTransfer?.files?.length || 0);
            host.dispatchEvent(new CustomEvent('dir-dropped', { detail: { count }, bubbles: true }));
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
            try { resolve(await handleDataTransferFiles(input.files || ([] as any), postCommitRecognize(dir))); }
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
            try { resolve(await handleDataTransferFiles(input.files || ([] as any), postCommitAnalyze)); }
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
export const writeWithTryRecognize = async (dir: string, file: File) => {
    if (file?.name?.endsWith?.(".md") || file?.type?.includes?.("markdown")) {
        return writeFileSmart(null, dir, file, { sanitize: true });
    }

    //
    const recognized = (await analyzeRecognizeUnified(file)?.catch?.(console.warn.bind(console)))?.data;
    if (recognized) {
        return writeFileSmart(null, dir, new File([recognized], file.name));
    }
}

//
export const pasteIntoClipboardWithRecognize = async () => {
    try {
        // clipboard first
        if ((navigator.clipboard as any)?.read) {
            const items = await (navigator.clipboard as any).read();
            for (const item of items) {
                for (const type of item.types) {
                    const blob = await item.getType(type);
                    if (blob) {
                        const data = await analyzeRecognizeUnified(blob)?.then?.((res) => res?.data)?.catch?.(console.warn.bind(console));
                        if (data) { return navigator.clipboard.writeText(data)?.then?.(() => true)?.catch?.(console.warn.bind(console)); }
                    }
                }
            }
        }

        // text fallback
        const text = await navigator.clipboard.readText()?.then?.((text) => text?.trim?.())?.catch?.(console.warn.bind(console));
        if (text && text.trim()) {
            const data = await analyzeRecognizeUnified(text)?.then?.((res) => res?.data)?.catch?.(console.warn.bind(console));
            if (data) { return navigator.clipboard.writeText(data)?.then?.(() => true)?.catch?.(console.warn.bind(console)); }
        }
    } catch (e) { console.warn(e); return false; }
}

//
export const pasteAndAnalyze = async () => {
    try {
        // clipboard first
        if ((navigator.clipboard as any)?.read) {
            const items = await (navigator.clipboard as any).read();
            for (const item of items) {
                for (const type of item.types) {
                    const blob = await item.getType(type);
                    if (blob) {
                        const data = await postCommitAnalyze({file: blob as any})?.then?.((res) => res?.data)?.catch?.(console.warn.bind(console));
                        if (data) { return true; }
                    }
                }
            }
        }

        // text fallback
        const text = await navigator.clipboard.readText()?.then?.((text) => text?.trim?.())?.catch?.(console.warn.bind(console));
        if (text && text.trim()) {
            const data = await postCommitAnalyze({text: text})?.then?.((res) => res?.data)?.catch?.(console.warn.bind(console));
            if (data) { return true; }
        }
    } catch (e) { console.warn(e); return false; }
    return false;
}

//
export const pasteIntoDir = async (dir: string) => {
    try {
        // Use unified handler for paste
        // We need to get data from clipboard first
        let success = false;
        try {
            // @ts-ignore
            const clipboardItems = await navigator.clipboard.read();
            if (clipboardItems && clipboardItems.length > 0) {
                 await handleIncomingEntries(clipboardItems, dir);
                 success = true;
            }
        } catch {}

        if (!success) {
             const text = await navigator.clipboard.readText();
             if (text) {
                 // Create a simple object that handleIncomingEntries understands for text
                 // or just use handleIncomingEntries with text if I adapted it?
                 // handleIncomingEntries handles text/uri-list or text/plain via getData interface
                 // Let's construct a mock DataTransfer-like object or just use internal logic
                 // Actually, handleIncomingEntries handles 'getData' check.
                 await handleIncomingEntries({
                     getData: (type: string) => type === "text/plain" ? text : ""
                 }, dir);
                 success = true;
             }
        }
        return success;
    } catch (e) { console.warn(e); }
    return false;
}
