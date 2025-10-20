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

// Утилита для склейки путей без дублей слэшей
const joinPath = (base: string, name?: string, addTrailingSlash = false) => {
  const b = (base || "/").replace(/\/+$/g, "") || "/";
  const n = (name || "").replace(/^\/+/g, "");
  let out = b === "/" ? `/${n}` : `${b}/${n}`;
  if (addTrailingSlash) out = out.replace(/\/?$/g, "/");
  return out.replace(/\/{2,}/g, "/");
};

const safeTime = (v: any) => {
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : 0;
};

// DOWNLOAD: не прибавляем path к filename — берём filename как есть
const downloadContentsToOPFS = async (webDavClient, path = "/") => {
  const files = await webDavClient
    .getDirectoryContents(path || "/")
    .catch((e) => { console.warn(e); return []; });

  return Promise.all(
    (files as FileStat[]).map(async (file) => {
      const isDir = file?.type === "directory";
      // ВАЖНО: filename уже абсолютный путь на сервере относительно base-URL клиента
      const fullPath = isDir ? joinPath(file.filename, "", true) : file.filename;

      if (isDir) {
        return downloadContentsToOPFS(webDavClient, fullPath);
      }

      if (file?.type === "file") {
        const localMeta = await readFile(null, fullPath).catch(() => null);
        const localMtime = safeTime(localMeta?.lastModified);
        const remoteMtime = safeTime(file?.lastmod);

        if (remoteMtime > localMtime) {
          const contents = await webDavClient
            .getFileContents(fullPath)
            .catch((e) => { console.warn(e); return null; });

          if (!contents || contents.byteLength === 0) return;

          // mime может отсутствовать — ставим разумный дефолт
          const mime = (file as any)?.mime || "application/octet-stream";
          return writeFileSmart(null, fullPath, new File([contents], file.basename, { type: mime }));
        }
      }
    })
  );
};

// UPLOAD: аккуратно собираем пути; сравниваем даты безопасно
const uploadOPFSToWebDav = async (webDavClient, dirHandle: FileSystemDirectoryHandle | null = null, path = "/") => {
  const entries = await Array.fromAsync(
    dirHandle ?? (await getDirectoryHandle(null, path))?.entries?.() ?? []
  );

  await Promise.all(
    (entries as [string, FileSystemDirectoryHandle | FileSystemFileHandle][])
      .map(async ([name, fileOrDir]) => {
        const isDir = (fileOrDir as any) instanceof FileSystemDirectoryHandle;
        const remotePath = joinPath(path, name, isDir);

        if (isDir) {
          const dirPathNoSlash = joinPath(path, name, false);
          const exists = await webDavClient.exists(dirPathNoSlash).catch((e) => { console.warn(e); return false; });
          if (!exists) {
            await webDavClient.createDirectory(dirPathNoSlash, { recursive: true }).catch(console.warn);
          }
          return uploadOPFSToWebDav(webDavClient, fileOrDir as FileSystemDirectoryHandle, remotePath);
        }

        // File
        const fileHandle = fileOrDir as FileSystemFileHandle;
        const fileContent = await fileHandle.getFile();
        if (!fileContent || fileContent.size === 0) return;

        const remoteStat = await webDavClient.stat(joinPath(path, name, false)).catch(() => null);
        const remoteMtime = safeTime(remoteStat?.lastmod);
        const localMtime = safeTime(fileContent.lastModified);

        if (!remoteStat || localMtime > remoteMtime) {
          await webDavClient
            .putFileContents(joinPath(path, name, false), await fileContent.arrayBuffer(), { overwrite: true })
            .catch((e) => { console.warn(e); return null; });
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
    await currentWebDav?.sync?.download?.();
    await currentWebDav?.sync?.upload?.();
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
    await currentWebDav?.sync?.download?.();
    await currentWebDav?.sync?.upload?.();
}

//
(async ()=>{
    addEventListener("pagehide", (ev)=>{
        currentWebDav?.sync?.upload?.();
    }),
    addEventListener("beforeunload", (event) => {
        currentWebDav?.sync?.upload?.();
    })
})();

//
export default WebDavSync;
