import { getDirectoryHandle, writeFile } from "fest/lure";

//
export const getMarkDownFromFile = async (handle: any) => {
    const markdown = await handle.getFile();
    return await markdown.text();
}

//
export const getJSONFromFile = async ([handle]: any) => {
    const json = await handle.getFile();
    return JSON.parse(await json.text());
}

//
export const hasCriteriaInText = async (text: string, criteria: string[]) => {
    return criteria?.some?.(async (criterion) => text?.includes?.(criterion));
}

//
export const readJSONs = async (dir: any | null) => {
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const factors = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return Promise.all(factors?.map?.((factor) => getJSONFromFile(factor)));
};

//
export const readJSONsFiltered = async (dir: any | null, filterFiles?: string[] | null) => {
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const factors = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return Promise.all(factors?.map?.((factor) => getJSONFromFile(factor)));
};

//
export const readMarkDownsFiltered = async (dir: any | null, filterFiles?: string[] | null) => {
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const preferences = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return Promise.all(preferences?.map?.(async (preferences) => (await getMarkDownFromFile(preferences)))
        ?.filter?.(async (fileData) => (!filterFiles || await hasCriteriaInText(await fileData, filterFiles))));
}

//
export const readMarkDowns = async (dir: any | null) => {
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const preferences = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return Promise.all(preferences?.map?.((preference) => getMarkDownFromFile(preference?.[1])));
}

//
export const writeJSON = async (dir: any | null, data: any) => {
    if (!data) return;
    dir = dir?.trim?.();
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir?.trim?.(), { create: true }) : dir;
    const writeOne = async (obj: any, index = 0) => {
        if (!obj) return;
        let base = (obj?.id || obj?.name || obj?.desc?.name || `${Date.now()}_${index}`)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-');
        base = base?.trim?.();
        const fileName = base?.endsWith?.(".json") ? base : (base + ".json");
        const handle = await dirHandle?.getFileHandle?.(fileName?.trim?.(), { create: true });
        const fileWriter = await handle?.createWritable?.();
        await fileWriter?.write?.(new Blob([JSON.stringify(obj)], { type: 'application/json' }));
        await fileWriter?.close?.();
    };
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) await writeOne(data[i], i);
        return;
    }
    await writeOne(data, 0);
}

//
export const writeMarkDown = async (dir: any | null, data: any) => {
    if (!data) return;
    dir = dir?.trim?.();
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir?.trim?.(), { create: true }) : dir;
    let fileName = (data?.name || data?.id || data?.desc?.name || `${Date.now()}`)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-');
    fileName = fileName?.trim?.();
    const handle = await dirHandle?.getFileHandle?.(fileName?.endsWith?.(".md") ? fileName : (fileName + ".md")?.trim?.(), { create: true });
    const fileWriter = await handle?.createWritable?.();
    await fileWriter?.write?.(new Blob([data], { type: 'text/markdown' }));
    await fileWriter?.close?.();
}

//
export interface shareTargetFormData {
    text?: string;
    url?: string;
    file?: File | Blob;
}

//
export const handleDataByType = async (item: File | string | Blob, handler: (payload: shareTargetFormData) => Promise<void>) => {
    if (typeof item === 'string') {
        if (item?.startsWith?.("data:image/") && item?.includes?.(";base64,")) { // @ts-ignore
            const arrayBuffer = Uint8Array.fromBase64(item.split(';base64,')[1]);
            const type = item.split(';')[0].split(':')[1];
            return handler({ url: item, file: new File([arrayBuffer], 'clipboard-image', { type }) } as any);
        } else
            if (URL.canParse(item)) { return handler({ url: item } as any); }
    } else
        if (item instanceof File || item instanceof Blob) {
            return handler({ file: item } as any);
        }
}

//
// Unified file/path helpers
//

// sanitize one path/token to safe slug
const toSlug = (input: string, toLower = true) => {
    let s = String(input || "").trim();
    if (toLower) s = s.toLowerCase();
    // replace whitespace with '-'
    s = s.replace(/\s+/g, '-');
    // keep only safe chars
    s = s.replace(/[^a-z0-9_.\-+#&]/g, '-');
    // collapse repeats
    s = s.replace(/-+/g, '-');
    return s;
};

const inferExtFromMime = (mime = "") => {
    if (!mime) return "";
    if (mime.includes("json")) return "json";
    if (mime.includes("markdown")) return "md";
    if (mime.includes("plain")) return "txt";
    if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
    if (mime === "image/png") return "png";
    if (mime.startsWith("image/")) return mime.split('/').pop() || "";
    if (mime.includes("html")) return "html";
    return "";
};

const splitPath = (path: string) => String(path || "").split('/').filter(Boolean);
const joinPath = (parts: string[], absolute = true) => (absolute ? '/' : '') + parts.filter(Boolean).join('/') + '';

const sanitizePathSegments = (path: string) => {
    const parts = splitPath(path);
    return joinPath(parts.map((p) => toSlug(p)));
};

const ensureDir = (p: string) => (p.endsWith('/') ? p : p + '/');

export type WriteSmartOptions = {
    forceExt?: string;        // e.g. 'json'
    ensureJson?: boolean;     // if true, enforce .json
    toLower?: boolean;        // default true
    sanitize?: boolean;       // default true
};

// Always writes by full sanitized path. Accepts a directory or a full path.
export const writeFileSmart = async (
    root: any | null,
    dirOrPath: string,
    file: File | Blob,
    options: WriteSmartOptions = {}
) => {
    const { forceExt, ensureJson, toLower = true, sanitize = true } = options;

    // Determine desired base name and directory
    let raw = String(dirOrPath || "").trim();
    const isDirHint = raw.endsWith('/');
    const hasFileToken = !isDirHint && splitPath(raw).length > 0 && raw.includes('.');

    let dirPath = isDirHint ? raw : (hasFileToken ? raw.split('/').slice(0, -1).join('/') : raw);
    let desiredName = hasFileToken ? raw.split('/').pop() || '' : (file as any)?.name || '';

    // Fallbacks
    dirPath = dirPath || '/';
    desiredName = desiredName || (Date.now() + '');

    // Extract name/ext
    const lastDot = desiredName.lastIndexOf('.');
    let base = lastDot > 0 ? desiredName.slice(0, lastDot) : desiredName;
    let ext = (forceExt || (ensureJson ? 'json' : (lastDot > 0 ? desiredName.slice(lastDot + 1) : inferExtFromMime((file as any)?.type || '')))) || '';

    if (sanitize) {
        dirPath = sanitizePathSegments(dirPath);
        base = toSlug(base, toLower);
    }

    const finalName = ext ? `${base}.${ext}` : base;
    const fullPath = ensureDir(dirPath) + finalName;

    // Ensure File object with correct name
    let toWrite: File;
    if (file instanceof File) {
        // If name matches and type present, keep; else recreate with corrected name
        if (file.name === finalName) {
            toWrite = file;
        } else {
            const type = (file as any).type || (ext ? `application/${ext}` : 'application/octet-stream');
            const buf = await file.arrayBuffer();
            toWrite = new File([buf], finalName, { type });
        }
    } else {
        const type = (file as any).type || (ext ? `application/${ext}` : 'application/octet-stream');
        const blob = file as Blob;
        toWrite = new File([await blob.arrayBuffer()], finalName, { type });
    }

    return writeFile(root, fullPath, toWrite);
};

// one of handler
export const postShareTarget = async (payload: shareTargetFormData) => {
    const fd = new FormData();
    if (payload.text) fd.append('text', payload.text);
    if (payload.url) fd.append('url', payload.url);
    if (payload.file) fd.append('files', payload.file as any, (payload as any)?.file?.name || 'pasted');
    const resp = await fetch('/share-target', { method: 'POST', body: fd });
    return resp.json().catch(() => console.warn.bind(console));;
};

//
const fileSystemChannel = new BroadcastChannel('rs-fs');
fileSystemChannel.addEventListener('message', (event) => {
    if (event.data.type === 'pending-write') {
        event.data.results?.forEach?.((result) => {
            const { entityType, data, name, path, key, idx } = result;
            const jsonData = typeof data === "string" ? JSON.parse(data) : data;
            console.log("Written file: " + path, jsonData);
            writeJSON(path?.trim?.(), jsonData);
        });
    }
});
