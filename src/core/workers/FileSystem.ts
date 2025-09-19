import { idbDelete, idbGetAll } from "@rs-core/store/IDBStorage";
import { safe } from "fest/object";
import { writeFile, getDir, getDirectoryHandle } from "fest/lure";


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
