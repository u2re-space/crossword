import type { EntityDesc } from "@rs-core/template/EntitiesTyped";
import { detectEntityTypeByJSON } from "@rs-core/template/TypeDetector";
import { BASE64_PREFIX, convertImageToJPEG, DEFAULT_ENTITY_TYPE, MAX_BASE64_SIZE } from "@rs-core/utils/ImageProcess";
import { getDirectoryHandle, writeFile } from "fest/lure";

//
export const sanitizeFileName = (name: string, fallbackExt = "") => {
    const parts = String(name || "").split("/").pop() || "";
    const base = parts.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_.\-+#&]/g, '-');
    if (fallbackExt && !base.includes('.')) return `${base || Date.now()}${fallbackExt.startsWith('.') ? '' : '.'}${fallbackExt}`;
    return base || `${Date.now()}`;
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

//
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

//
const splitPath = (path: string) => String(path || "").split('/').filter(Boolean);
const ensureDir = (p: string) => (p.endsWith('/') ? p : p + '/');
const joinPath = (parts: string[], absolute = true) => (absolute ? '/' : '') + parts.filter(Boolean).join('/') + '';

//
const sanitizePathSegments = (path: string) => {
    const parts = splitPath(path);
    return joinPath(parts.map((p) => toSlug(p)));
};

//
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

    //
    const promised = writeFile(root, fullPath, toWrite);
    if (typeof document !== "undefined")
        document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", { detail: await promised?.catch?.(console.warn.bind(console)), bubbles: true, composed: true, cancelable: true, }));
    return promised;
};

//
export const writeFilesToDir = async (dir: string, files: File[] | FileList) => {
    const items = Array.from(files as any as File[]);
    for (const file of items) {
        dir = dir?.trim?.();
        dir = dir?.endsWith?.('/') ? dir : (dir + '/');
        await writeFileSmart(null, dir, file);
    }
    return items.length;
}

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
export const readOneMarkDown = async (path: string) => {
    const handle = await getDirectoryHandle(null, path);
    const markdown = await handle?.getFile?.();
    if (!markdown) return null;
    return await markdown?.text?.();
}

//
export const suitableDirsByEntityTypes = (entityTypes: string[]) => {
    return entityTypes?.map?.((entityType) => {
        return (entityType != "timeline" && entityType != "task") ? `/data/${entityType}/` : "/timeline/";
    });
}

//
export const writeJSON = async (data: any | any[], entityDesc: EntityDesc[] | EntityDesc | null = null, dir: any | null = null) => {
    if (!data) return;
    const writeOne = async (obj: any, index = 0) => {
        if (!obj) return; obj = typeof obj === "string" ? JSON.parse(obj) : obj; if (!obj) return;

        // if entity type is not registered, trying to detect it
        const entityType = entityDesc?.[index]?.entityType ?? (entityDesc as EntityDesc)?.entityType ?? detectEntityTypeByJSON(obj);

        // if directory is not provided, using default directory
        if (!dir) dir = suitableDirsByEntityTypes([entityType])?.[0]; dir = dir?.trim?.();
        let base = (obj?.id || obj?.name || obj?.desc?.name || `${Date.now()}_${index}`)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-'); base = base?.trim?.();
        const fileName = base?.endsWith?.(".json") ? base : (base + ".json");
        return writeFileSmart(null, `${dir}${fileName}`, new File([JSON.stringify(obj)], fileName, { type: 'application/json' }));
    };

    //
    let promised: Promise<any[] | any> | null = null;
    if (Array.isArray(data)) promised = Promise.all(data.map((item, index) => writeOne(item, index))); else promised = writeOne(data, 0);
    if (typeof document !== "undefined")
        document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", { detail: await promised?.catch?.(console.warn.bind(console)), bubbles: true, composed: true, cancelable: true, }));
    return promised;
}

//
export const writeMarkDown = async (data: any, path: any | null = null) => {
    if (!data) return; path = path?.trim?.();
    if (!path) {
        path = "/docs/preferences/";
        path += (`${Date.now()}`?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-'))?.trim?.() + ".md"
    }

    //
    let promised: Promise<any[] | any> | null = writeFileSmart(null, path, data instanceof File ? data : new File([data], path?.split?.('/')?.pop?.() || `${Date.now()}.md`, { type: 'text/markdown' }));
    if (typeof document !== "undefined")
        document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", { detail: data, bubbles: true, composed: true, cancelable: true, }));
    return promised;
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
export const handleDataTransferFiles = async (files: (File | Blob)[] | FileList, handler: (payload: shareTargetFormData) => Promise<void>) => {
    // @ts-ignore
    for (const file of files) {
        handleDataByType(file, handler);
    }
}

//
export const handleDataTransferItemList = async (items: DataTransferItemList, handler: (payload: shareTargetFormData) => Promise<void>) => {
    // @ts-ignore
    for (const item of items) {
        handleDataByType(item, handler);
    }
}

//
export const handleClipboardItems = async (items: ClipboardItem[], handler: (payload: shareTargetFormData) => Promise<void>) => {
    for (const item of items) {
        for (const type of item?.types ?? []) {
            if (type.startsWith('text/')) {
                const text = await (await item?.getType?.(type))?.text?.();
                return handleDataByType(text, handler);
            }
            if (type.startsWith('image/')) {
                const blob = await item?.getType?.(type);
                return handleDataByType(blob, handler);
            }
        }
    }
}

//
export const handleDataTransferInputEvent = (dataTransfer: DataTransfer | null, handler: (payload: shareTargetFormData) => Promise<void>) => {
    const items = dataTransfer?.items;
    const files = dataTransfer?.files ?? [];

    if (items) {
        handleDataTransferItemList(items, handler);
    }

    if (files && (files?.length > 0)) {
        handleDataTransferFiles(files, handler);
    }
}



// one of handler
export const postShareTarget = async (payload: shareTargetFormData, API_ENDPOINT = '/share-target') => {
    const fd = new FormData();
    if (payload.text) fd.append('text', payload.text);
    if (payload.url) fd.append('url', payload.url);
    if (payload.file) fd.append('files', payload.file as any, (payload as any)?.file?.name || 'pasted');

    //
    const resp = await fetch(API_ENDPOINT, { method: 'POST', body: fd }).catch(console.warn.bind(console));
    return resp?.json?.()?.catch?.(console.warn.bind(console))?.then?.((json) => {
        return json?.results?.map?.((res) => res?.data)?.filter?.((data) => data != null);
    });
};

//
export const postShareTargetRecognize = (targetDir: string = "/docs/preferences/") => {
    return async (payload: shareTargetFormData, API_ENDPOINT = '/share-target-recognize') => {
        const fd = new FormData();
        if (payload.text) fd.append('text', payload.text);
        if (payload.url) fd.append('url', payload.url);
        if (payload.file) fd.append('files', payload.file as any, (payload as any)?.file?.name || 'pasted');
        fd.append('targetDir', targetDir);

        //
        const resp = await fetch(API_ENDPOINT, { method: 'POST', body: fd }).catch(console.warn.bind(console));
        return resp?.json?.()?.catch?.(console.warn.bind(console))?.then?.((json) => {
            return json?.results?.filter?.((data) => (!!data?.data?.trim?.()))?.map?.((res) => res?.data);
        });
    }
}


//
export type IntakeOptions = {
    entityType?: string;
    beforeSend?: (payload: shareTargetFormData) => Promise<shareTargetFormData> | shareTargetFormData;
};

//
export const normalizePayload = async (payload: shareTargetFormData): Promise<shareTargetFormData> => {
    if (payload.file instanceof File || payload.file instanceof Blob) {
        if (payload.file instanceof File && payload.file.size > MAX_BASE64_SIZE && payload.file.type.startsWith("image/")) {
            return { ...payload, file: await convertImageToJPEG(payload.file) };
        }
        return payload;
    }

    const text = payload.text || payload.url;
    if (typeof text === "string") {
        const match = text.match(BASE64_PREFIX);
        if (match && match.groups) {
            const { mime, data } = match.groups;
            const byteLen = Math.ceil((data.length * 3) / 4);
            if (byteLen > MAX_BASE64_SIZE) {
                const binary = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
                const blob = new Blob([binary], { type: mime });
                const converted = await convertImageToJPEG(blob);
                return { file: converted };
            }
        }
    }

    return payload;
};

//
export const sendToEntityPipeline = async (payload: shareTargetFormData, options: IntakeOptions = {}) => {
    const entityType = options.entityType || DEFAULT_ENTITY_TYPE;
    const normalized = await normalizePayload(payload);
    const next = options.beforeSend ? await options.beforeSend(normalized) : normalized;
    return postShareTarget(next);
};

//
export const loadTimelineSources = async (dir: string = "/docs/preferences") => {
    try {
        const root = await getDirectoryHandle(null, dir)?.catch(() => null);
        if (!root) return [] as string[];
        const entries = await Array.fromAsync(root.entries?.() ?? []);
        return entries
            .map((entry: any) => entry?.[0])
            .filter((name: string) => typeof name === "string" && name.trim().length)
            .map((name: string) => name.replace(/\.md$/i, ""));
    } catch (e) {
        console.warn(e);
        return [];
    }
};


//?.filter?.((result) => (!!result?.data?.trim?.() && result.status == 'queued'))?

//
const controlChannel = new BroadcastChannel('rs-sw');
controlChannel.addEventListener('message', (event) => {
    if (event.data.type === 'pending-write') {
        event.data.results?.forEach?.((result) => {
            const { entityDesc, data, name, path, key, idx, type, targetDir } = result;
            if (type === "json") {
                const jsonData = typeof data === "string" ? JSON.parse(data) : data;
                writeJSON(jsonData, entityDesc, path?.trim?.());
            } else {
                writeMarkDown(data, targetDir + name?.trim?.());
            }
        });
    }
});
