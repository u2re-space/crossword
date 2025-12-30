import { createClient, type FileStat } from "webdav/web"
import { getDirectoryHandle, readFile } from "fest/lure"
import { JSOX } from "jsox";

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

// Check if we're in a content script context (restricted storage access)
const isContentScriptContext = (): boolean => {
    try {
        // Content scripts have chrome.runtime but may have restricted storage access
        // Service workers and extension pages have chrome.runtime.getURL
        if (typeof chrome === "undefined") return false;

        // Check if we're in a web page context (content script)
        if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
            return true;
        }

        return false;
    } catch {
        return true; // Assume content script if we can't determine
    }
};

// Check if we're in a service worker or extension page (safe for storage)
const isExtensionContext = (): boolean => {
    try {
        if (typeof chrome === "undefined") return false;

        // Service worker context
        if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
            return true;
        }

        // Extension page context (popup, options, etc.)
        if (typeof window !== "undefined" && window.location?.protocol === "chrome-extension:") {
            return true;
        }

        return false;
    } catch {
        return false;
    }
};

//
const hasChromeStorage = () => typeof chrome !== "undefined" && chrome?.storage?.local;

//
async function idbOpen(): Promise<IDBDatabase> {
    // Check if indexedDB is available and accessible
    if (typeof indexedDB === "undefined") {
        throw new Error("IndexedDB not available");
    }

    // In content scripts on some pages, indexedDB access throws DOMException
    if (isContentScriptContext()) {
        throw new Error("IndexedDB not accessible in content script context");
    }

    return new Promise<IDBDatabase>((res, rej) => {
        try {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
            req.onsuccess = () => res(req.result);
            req.onerror = () => rej(req.error);
        } catch (e) {
            rej(e);
        }
    });
}

//
export const idbGetSettings = async (key: string = SETTINGS_KEY): Promise<any> => {
    try {
        if (hasChromeStorage()) {
            return new Promise((res) => {
                try {
                    chrome.storage.local.get([key], (result) => {
                        if (chrome.runtime.lastError) {
                            console.warn(chrome.runtime.lastError);
                            res(null);
                        } else {
                            res(result[key]);
                        }
                    });
                } catch (e) {
                    console.warn("chrome.storage access failed:", e);
                    res(null);
                }
            });
        }

        // Check if indexedDB is available
        if (typeof indexedDB === "undefined") {
            return null;
        }

        const db = await idbOpen();
        return new Promise((res, rej) => {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).get(key);
            req.onsuccess = () => { res(req.result?.value); db.close(); }
            req.onerror = () => { rej(req.error); db.close(); };
        });
    } catch (e) {
        console.warn("Settings storage access failed:", e);
        return null;
    }
}

//
export const idbPutSettings = async (value: any, key: string = SETTINGS_KEY): Promise<void> => {
    try {
        if (hasChromeStorage()) {
            return new Promise((res, rej) => {
                try {
                    chrome.storage.local.set({ [key]: value }, () => {
                        if (chrome.runtime.lastError) {
                            rej(chrome.runtime.lastError);
                        } else {
                            res();
                        }
                    });
                } catch (e) {
                    console.warn("chrome.storage write failed:", e);
                    rej(e);
                }
            });
        }

        // Check if indexedDB is available
        if (typeof indexedDB === "undefined") {
            console.warn("IndexedDB not available");
            return;
        }

        const db = await idbOpen();
        return new Promise((res, rej) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put({ key, value });
            tx.oncomplete = () => { res(void 0); db.close(); };
            tx.onerror = () => { rej(tx.error); db.close(); };
        });
    } catch (e) {
        console.warn("Settings storage write failed:", e);
    }
}

//
export const loadSettings = async (): Promise<AppSettings> => {
    try {
        const raw = await idbGetSettings();
        const stored = typeof raw === "string" ? JSOX.parse(raw) as any : raw;
        if (stored && typeof stored === "object") {
            return {
                core: {
                    ...DEFAULT_SETTINGS.core,
                    ...(stored as any)?.core
                },
                ai: {
                    ...DEFAULT_SETTINGS.ai, ...(stored as any)?.ai,
                    mcp: (stored as any)?.ai?.mcp || [],
                    customInstructions: (stored as any)?.ai?.customInstructions || [],
                    activeInstructionId: (stored as any)?.ai?.activeInstructionId || ""
                },
                webdav: { ...DEFAULT_SETTINGS.webdav, ...(stored as any)?.webdav },
                timeline: { ...DEFAULT_SETTINGS.timeline, ...(stored as any)?.timeline },
                appearance: { ...DEFAULT_SETTINGS.appearance, ...(stored as any)?.appearance },
                speech: { ...DEFAULT_SETTINGS.speech, ...(stored as any)?.speech },
                grid: { ...DEFAULT_SETTINGS.grid, ...(stored as any)?.grid }
            };
        }
    } catch (e) {
        console.warn(e);
    }
    return JSOX.parse(JSOX.stringify(DEFAULT_SETTINGS as any) as string) as unknown as AppSettings;
};

//
export const saveSettings = async (settings: AppSettings) => {
    const current = await loadSettings();
    const merged: AppSettings = {
        core: {
            ...(DEFAULT_SETTINGS.core || {}),
            ...(current.core || {}),
            ...(settings.core || {})
        },
        ai: {
            ...(DEFAULT_SETTINGS.ai || {}),
            ...(current.ai || {}),
            ...(settings.ai || {}),
            mcp: settings.ai?.mcp ?? current.ai?.mcp ?? [],
            customInstructions: settings.ai?.customInstructions ?? current.ai?.customInstructions ?? [],
            activeInstructionId: settings.ai?.activeInstructionId ?? current.ai?.activeInstructionId ?? ""
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
        },
        appearance: {
            ...(DEFAULT_SETTINGS.appearance || {}),
            ...(current.appearance || {}),
            ...(settings.appearance || {})
        },
        speech: {
            ...(DEFAULT_SETTINGS.speech || {}),
            ...(current.speech || {}),
            ...(settings.speech || {})
        },
        grid: {
            ...(DEFAULT_SETTINGS.grid || {}),
            ...(current.grid || {}),
            ...(settings.grid || {})
        }
    };
    await idbPutSettings(merged);
    updateWebDavSettings(merged)?.catch?.(console.warn.bind(console));
    return merged;
};

// Утилита для склейки путей без дублей слэшей
const joinPath = (base: string, name?: string, addTrailingSlash = false) => {
    const b = (base || "/").replace(/\/+$/g, "") || "/";
    const n = (name || "").replace(/^\/+/g, "");
    let out = b === "/" ? `/${n}` : `${b}/${n}`;
    if (addTrailingSlash) out = out.replace(/\/?$/g, "/");
    return out.replace(/\/{2,}/g, "/");
};

const isDirHandle = (h: any) => (h?.kind === 'directory');
const safeTime = (v: any) => {
    const t = new Date(v as any).getTime();
    return Number.isFinite(t) ? t : 0;
};

type SyncOptions = {
    // Для download: удалять локальные записи, которых нет на сервере
    pruneLocal?: boolean;
    // Для upload: удалять записи на сервере, которых нет локально
    pruneRemote?: boolean;
};

// DOWNLOAD: не прибавляем path к filename — берём filename как есть
const downloadContentsToOPFS = async (
    webDavClient,
    path = "/",
    opts: SyncOptions = {},
    rootHandle: FileSystemDirectoryHandle | null = null
) => {
    const files = await webDavClient
        ?.getDirectoryContents?.(path || "/")
        ?.catch?.((e) => { console.warn(e); return []; }) as FileStat[];

    // Если включено — удаляем локальные элементы, которых нет на сервере
    if (opts.pruneLocal && files?.length > 0) {
        try {
            const dirHandle = await getDirectoryHandle(rootHandle, path)?.catch?.(() => null);
            if (dirHandle?.entries) {
                const localEntries = await Array.fromAsync(dirHandle.entries());
                const remoteNames = new Set(files?.map?.((f) => f?.basename).filter(Boolean));
                await Promise.all(
                    (localEntries as [string, FileSystemDirectoryHandle | FileSystemFileHandle][])
                        .filter(([name]) => !remoteNames.has(name))
                        .map(([name]) =>
                            dirHandle.removeEntry(name, { recursive: true })?.catch?.(console.warn.bind(console))
                        )
                );
            }
        } catch (e) {
            console.warn(e);
        }
    }

    return Promise.all(
        files.map(async (file) => {
            const isDir = file?.type === "directory";
            // ВАЖНО: filename уже абсолютный путь на сервере относительно base-URL клиента
            const fullPath = isDir ? joinPath(file.filename, "", true) : file.filename;

            if (isDir) {
                return downloadContentsToOPFS(webDavClient, fullPath, opts, rootHandle);
            }

            if (file?.type === "file") {
                const localMeta = await readFile(rootHandle, fullPath).catch(() => null);
                const localMtime = safeTime(localMeta?.lastModified);
                const remoteMtime = safeTime(file?.lastmod);

                if (remoteMtime > localMtime) {
                    const contents = await webDavClient
                        .getFileContents(fullPath)
                        .catch((e) => { console.warn(e); return null; });

                    if (!contents || contents.byteLength === 0) return;

                    // mime может отсутствовать — ставим разумный дефолт
                    const mime = (file as any)?.mime || "application/octet-stream";
                    return writeFileSmart(rootHandle, fullPath, new File([contents], file.basename, { type: mime }));
                }
            }
        })
    );
};

// UPLOAD: аккуратно собираем пути; сравниваем даты безопасно
const uploadOPFSToWebDav = async (
    webDavClient,
    dirHandle: FileSystemDirectoryHandle | null = null,
    path = "/",
    opts: SyncOptions = {}
) => {
    const effectiveDirHandle = dirHandle ?? (await getDirectoryHandle(null, path, { create: true })?.catch?.(console.warn.bind(console)));
    const entries = await Array.fromAsync(effectiveDirHandle?.entries?.() ?? []);

    //
    if (path != "/") {
        // Небольшая правка: гарантированно получаем entries из handle
        // Если включено — удаляем на сервере всё, чего нет локально в текущем каталоге
        if (opts.pruneRemote && entries?.length >= 0) {
            const remoteItems = await webDavClient
                .getDirectoryContents(path || '/')
                .catch((e) => { console.warn(e); return []; }) as FileStat[];

            // Локальные имена (в текущем каталоге)
            const localSet = new Set(
                (entries as [string, FileSystemDirectoryHandle | FileSystemFileHandle][])
                    .map(([name]) => name.toLowerCase())
            );

            // Удаляем только то, чего точно нет локально по ИМЕНИ (без includes)
            const extra = remoteItems.filter((r) => {
                const base = (r?.basename || '').toLowerCase();
                return base && !localSet.has(base);
            });

            // Файлы сначала, директории потом
            const filesFirst = [
                ...extra.filter((x) => x.type !== 'directory'),
                //...extra.filter((x) => x.type === 'directory'),
            ];

            for (const r of filesFirst) {
                const remotePath = r.filename || joinPath(path, r.basename, r.type === 'directory');
                try {
                    await webDavClient.deleteFile(remotePath);
                } catch (e) {
                    console.warn('delete failed:', remotePath, e);
                }
            }
        }
    }

    //
    await Promise.all(
        (entries as [string, FileSystemDirectoryHandle | FileSystemFileHandle][])
            .map(async ([name, fileOrDir]) => {
                const isDir = isDirHandle(fileOrDir);
                const remotePath = joinPath(path, name, isDir);

                if (isDir) {
                    const dirPathNoSlash = joinPath(path, name, false);
                    const exists = await webDavClient.exists(dirPathNoSlash).catch((_e) => { return false; });
                    if (!exists) {
                        await webDavClient.createDirectory(dirPathNoSlash, { recursive: true }).catch(console.warn);
                    }
                    return uploadOPFSToWebDav(webDavClient, fileOrDir as FileSystemDirectoryHandle, remotePath, opts);
                }

                // File
                const fileHandle = fileOrDir as FileSystemFileHandle;
                const fileContent = await fileHandle.getFile();
                if (!fileContent || fileContent.size === 0) return;

                //
                const fullFilePath = joinPath(path, name, false);
                const remoteStat = await webDavClient.stat(fullFilePath).catch(() => null);
                const remoteMtime = safeTime(remoteStat?.lastmod);
                const localMtime = safeTime(fileContent.lastModified);

                //
                if (!remoteStat || localMtime > remoteMtime) {
                    await webDavClient.putFileContents(fullFilePath, await fileContent.arrayBuffer(), { overwrite: true })
                        .catch((_e) => { return null; });
                }
            })
    );

};

//
const getHostOnly = (address: string) => {
    const url = new URL(address);
    return url.protocol + url.hostname + ":" + url.port;
}

//
export const WebDavSync = (address: string, options: any = {}) => {
    const client = createClient(getHostOnly(address), options);
    const status = currentWebDav?.sync?.getDAVCompliance?.()?.catch?.(console.warn.bind(console)) ?? null;
    return {
        status,
        client,
        upload(withPrune = false) { if (this.status != null) { return uploadOPFSToWebDav(client, null, "/", { pruneRemote: withPrune })?.catch?.((e) => { console.warn(e); return []; }) } },
        download(withPrune = false) { if (this.status != null) { return downloadContentsToOPFS(client, "/", { pruneLocal: withPrune })?.catch?.((e) => { console.warn(e); return []; }) } },
    }
}

//
export const currentWebDav: { sync: any } = { sync: null };

// Only initialize WebDAV in extension contexts (not content scripts)
if (!isContentScriptContext()) {
    (async () => {
        try {
            const settings = await loadSettings();
            if (settings?.core?.mode === "endpoint" && settings?.core?.preferBackendSync) {
                return;
            }
            if (!settings?.webdav?.url) return;
            const client = WebDavSync(settings.webdav.url, {
                //authType: AuthType.Digest,
                withCredentials: true,
                username: settings.webdav.username,
                password: settings.webdav.password,
                token: settings.webdav.token
            });
            currentWebDav.sync = client ?? currentWebDav.sync;
            await currentWebDav?.sync?.upload?.(true);
            await currentWebDav?.sync?.download?.(true);
        } catch (e) {
            // Silently fail - storage may not be available in all contexts
        }
    })();
}

//
export const updateWebDavSettings = async (settings: any) => {
    settings ||= await loadSettings();
    if (settings?.core?.mode === "endpoint" && settings?.core?.preferBackendSync) {
        currentWebDav.sync = null;
        return;
    }
    if (!settings?.webdav?.url) return;
    currentWebDav.sync = WebDavSync(settings.webdav.url, {
        //authType: AuthType.Digest,
        withCredentials: true,
        username: settings.webdav.username,
        password: settings.webdav.password,
        token: settings.webdav.token
    }) ?? currentWebDav.sync;
    await currentWebDav?.sync?.upload?.();
    await currentWebDav?.sync?.download?.(true);
}

// WebDAV sync on page lifecycle events (only in extension context, not content scripts)
if (!isContentScriptContext()) {
    try {
        if (typeof window !== "undefined" && typeof addEventListener === "function") {
            addEventListener("pagehide", () => {
                currentWebDav?.sync?.upload?.()?.catch?.(() => {});
            });
            addEventListener("beforeunload", () => {
                currentWebDav?.sync?.upload?.()?.catch?.(() => {});
            });
        }
    } catch {
        // Ignore - may not be in appropriate context
    }

    // Periodic WebDAV sync (only when sync is configured)
    (async () => {
        try {
            while (true) {
                await currentWebDav?.sync?.upload?.()?.catch?.(() => {});
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        } catch {
            // Silently fail
        }
    })();
}

//
export default WebDavSync;
