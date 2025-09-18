import { writeFile, getDirectoryHandle } from "fest/lure";

//
export const sanitizeFileName = (name: string, fallbackExt = "") => {
    const parts = String(name || "").split("/").pop() || "";
    const base = parts.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_.\-+#&]/g, '-');
    if (fallbackExt && !base.includes('.')) return `${base || Date.now()}${fallbackExt.startsWith('.') ? '' : '.'}${fallbackExt}`;
    return base || `${Date.now()}`;
}

//
export const writeFilesToDir = async (dir: string, files: File[] | FileList) => {
    const items = Array.from(files as any as File[]);
    for (const file of items) {
        const fileName = sanitizeFileName(file.name || 'uploaded');
        const path = `${dir}${fileName}`;
        console.log("Writing file: " + path);
        await writeFile(null, path, file);
    }
    return items.length;
}

//
export const openPickerAndWrite = async (dir: string, accept = "*/*", multiple = true) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    (input as any).multiple = multiple;
    const result = await new Promise<number>((resolve) => {
        input.onchange = async () => {
            try { resolve(await writeFilesToDir(dir, input.files || ([] as any))); }
            catch { resolve(0); }
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


