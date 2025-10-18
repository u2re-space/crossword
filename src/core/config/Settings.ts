import { createClient, type FileStat } from "webdav/web"
import { getDirectoryHandle, readFile } from "fest/lure"

//
import type { AppSettings } from "@rs-core/config/SettingsTypes";
import { DEFAULT_SETTINGS } from "@rs-core/config/SettingsTypes";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

//
export const SETTINGS_KEY = "rs-settings";

//
export const splitPath = (path: string) => path.split(".");
export const getByPath = (source: any, path: string) => splitPath(path).reduce<any>((acc, key) => (acc == null ? acc : acc[key]), source);
export const slugify = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();


//
export const DB_NAME = 'req-store';
export const STORE = 'settings';

//
async function idbOpen(): Promise<IDBDatabase> {
    console.log("idbOpen");
    return new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
}

//
export const idbGetSettings = async (key: string = SETTINGS_KEY): Promise<any> => {
    const db = await idbOpen();
    return new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => { res(req.result?.value); db.close(); }
        req.onerror = () => { rej(req.error); db.close(); };
    });
}

//
export const idbPutSettings = async (value: any, key: string = SETTINGS_KEY): Promise<void> => {
    const db = await idbOpen();
    return new Promise((res, rej) => {
        console.log("idbPutSettings", key, value);
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ key, value });
        tx.oncomplete = () => { res(void 0); db.close(); };
        tx.onerror = () => { rej(tx.error); db.close(); };
    });
}

//
export const loadSettings = async (): Promise<AppSettings> => {
    try {
        const raw = await idbGetSettings();
        const stored = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (stored && typeof stored === "object") {
            return {
                ai: {
                    ...DEFAULT_SETTINGS.ai, ...(stored as any)?.ai,
                    mcp: (stored as any)?.ai?.mcp || []
                },
                webdav: { ...DEFAULT_SETTINGS.webdav, ...(stored as any)?.webdav },
                timeline: { ...DEFAULT_SETTINGS.timeline, ...(stored as any)?.timeline }
            };
        }
    } catch (e) {
        console.warn(e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
};

//
export const saveSettings = async (settings: AppSettings) => {
    const current = await loadSettings();
    const merged: AppSettings = {
        ai: {
            ...(DEFAULT_SETTINGS.ai || {}),
            ...(current.ai || {}),
            ...(settings.ai || {}),
            mcp: settings.ai?.mcp || []
        },
        webdav: {
            ...(DEFAULT_SETTINGS.webdav || {}),
            ...(current.webdav || {}),
            ...(settings.webdav || {})
        },
        timeline: {
            ...(DEFAULT_SETTINGS.timeline || {}),
            ...(current.timeline || {}),
            ...(settings.timeline || {})
        }
    };
    await idbPutSettings(merged);
    updateWebDavSettings(merged)?.catch(console.warn.bind(console));
    return merged;
};

//
const downloadContentsToOPFS = async (webDavClient, path = "/") => {
    const files = await Array.fromAsync(await webDavClient.getDirectoryContents(path)?.catch?.((e) => { console.log(e); return []; }) as any);
    return Promise.all(files.map(async (file: FileStat) => {
        const fullPath = path + file.filename + (file?.type == "directory" ? "/" : "");
        if (file?.type == "directory") { return downloadContentsToOPFS(webDavClient, fullPath); };
        if (file?.type == "file") {
            if (new Date(file?.lastmod).getTime() > new Date((await readFile(null, fullPath))?.lastModified).getTime()) {
                const contents = await webDavClient.getFileContents(fullPath)?.catch?.((e) => { console.warn(e); return null; });
                if (!contents || contents?.byteLength == 0) return;
                return writeFileSmart(null, fullPath, new File([contents], file.filename, { type: file.type }));
            }
        };
    }));
}

//
const uploadOPFSToWebDav = async (webDavClient, dirHandle: FileSystemDirectoryHandle | null = null, path = "/") => {
    const files = await Array.fromAsync(dirHandle ?? (await getDirectoryHandle(null, path))?.entries?.() ?? []);
    await Promise.all((files as [string, FileSystemDirectoryHandle | FileSystemFileHandle][])?.map(async ([name, fileOrDir]) => {
        const fullPath = path + fileOrDir.name + (fileOrDir instanceof FileSystemDirectoryHandle ? "/" : "");
        if (fileOrDir instanceof FileSystemDirectoryHandle) {
            let suffixLessPath = path + fileOrDir.name;
            if (!(await webDavClient.exists(suffixLessPath)?.catch?.((e) => { console.warn(e); return false; }))) {
                await webDavClient.createDirectory(suffixLessPath, { recursive: true });
            }
            await uploadOPFSToWebDav(webDavClient, fileOrDir, fullPath)
        }
        if (fileOrDir instanceof FileSystemFileHandle) {
            const fileContent = await (await fileOrDir)?.getFile?.();
            if (!fileContent || fileContent?.size == 0) return;

            //
            if (!(await webDavClient.exists(fullPath)?.catch?.((e) => { console.warn(e); return false; }))) {
                await webDavClient.putFileContents(fullPath, await fileContent?.arrayBuffer(), { overwrite: true })?.catch?.((e) => { console.warn(e); return null; });
                return;
            }
            if (new Date(await fileContent?.lastModified).getTime() > new Date((await webDavClient.stat(fullPath)?.catch?.((e) => { console.warn(e); return null; }) as FileStat)?.lastmod).getTime()) {
                await webDavClient.putFileContents(fullPath, await fileContent?.arrayBuffer(), { overwrite: true })?.catch?.((e) => { console.warn(e); return null; });
                return;
            }
        }
    }));
}

//
export const WebDavSync = (address, options: any = {}) => {
    const client = createClient(address, options);
    return {
        client,
        upload() { return uploadOPFSToWebDav(client)?.catch?.((e) => { console.warn(e); return []; }) },
        download() { return downloadContentsToOPFS(client)?.catch?.((e) => { console.warn(e); return []; }) },
    }
}

//
export const currentWebDav: { sync: any } = { sync: null };
(async () => {
    const settings = await loadSettings();
    if (!settings?.webdav?.url) return;
    const client = WebDavSync(settings.webdav.url, {
        //authType: AuthType.Digest,
        withCredentials: true,
        username: settings.webdav.username,
        password: settings.webdav.password,
        token: settings.webdav.token
    });
    currentWebDav.sync = client ?? currentWebDav.sync;
    currentWebDav?.sync?.upload?.();
})();

//
export const updateWebDavSettings = async (settings: any) => {
    settings ||= await loadSettings();
    if (!settings?.webdav?.url) return;
    currentWebDav.sync = WebDavSync(settings.webdav.url, {
        //authType: AuthType.Digest,
        withCredentials: true,
        username: settings.webdav.username,
        password: settings.webdav.password,
        token: settings.webdav.token
    }) ?? currentWebDav.sync;
    currentWebDav?.sync?.upload?.();
}

//
export default WebDavSync;
