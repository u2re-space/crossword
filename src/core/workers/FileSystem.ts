import { idbDelete, idbGetAll } from "@rs-core/store/IDBStorage";
import { safe } from "fest/object";
import { writeFile, getDir, getDirectoryHandle } from "fest/lure";

//
export const pushPendingToFS = async (entityType: string) => {
    const allEntries = await idbGetAll("pending-fs-write_" + entityType + "_");
    return Promise.all(allEntries.map(async (entry) => {
        try {
            const path = entry?.value?.path || entry?.key;
            const data = entry?.value?.data ?? entry?.value;
            await writeFile(null, path, safe(data));
            console.log("Written file: " + path);
        } finally {
            await new Promise((res) => setTimeout(res, 250));
            await idbDelete(entry?.key);
        }
    }));
}


//
export const getMarkDownFromFile = async (handle: any) => {
    const markdown = await handle.getFile();
    return await markdown.text();
}

//
export const getJSONFromFile = async (handle: any) => {
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
    return Promise.all(factors?.map?.((factor) => getJSONFromFile(factor?.[1])));
}

//
export const readJSONsFiltered = async (dir: any | null, filterFiles?: string[] | null) => {
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const factors = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return Promise.all(factors?.map?.((factor) => getJSONFromFile(factor?.[1])));
}

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
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const writeOne = async (obj: any, index = 0) => {
        let base = obj?.id || obj?.desc?.name || `${Date.now()}_${index}`;
        base = String(base).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-+#&]/g, '-');
        const fileName = base.endsWith('.json') ? base : `${base}.json`;
        const handle = await dirHandle.getFileHandle(fileName, { create: true });
        await handle.putFile(new Blob([JSON.stringify(obj)], { type: 'application/json' }));
    };
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) await writeOne(data[i], i);
        return;
    }
    await writeOne(data, 0);
}

//
export const writeMarkDown = async (dir: any | null, data: any) => {
    const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
    const handle = await dirHandle.getFileHandle(data?.id, { create: true });
    await handle.putFile(new Blob([data]));
}
