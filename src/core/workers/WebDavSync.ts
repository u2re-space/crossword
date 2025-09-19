import { idbGet } from "@rs-core/store/IDBStorage";
import { getDirectoryHandle, readFile, writeFile } from "fest/lure"
import { AuthType, createClient, type FileStat } from "webdav/web";

//
const downloadContentsToOPFS = async (webDavClient, path = "/") => {
    const files = await Array.fromAsync(await webDavClient.getDirectoryContents(path)?.catch?.((e) => { console.log(e); return []; }) as any);
    return Promise.all(files.map(async (file: FileStat) => {
        const fullPath = path + file.filename + (file?.type == "directory" ? "/" : "");
        if (file?.type == "directory") { return downloadContentsToOPFS(webDavClient, fullPath); };
        if (file?.type == "file") {
            if (new Date(file?.lastmod).getTime() > new Date((await readFile(null, fullPath))?.lastModified).getTime()) {
                return writeFile(null, fullPath, await webDavClient.getFileContents(fullPath));
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
            if (!(await webDavClient.exists(suffixLessPath))) {
                await webDavClient.createDirectory(suffixLessPath, { recursive: true });
            }
            await uploadOPFSToWebDav(webDavClient, fileOrDir, fullPath)
        }
        if (fileOrDir instanceof FileSystemFileHandle) {
            const fileContent = await (await fileOrDir)?.getFile?.();
            if (!(await webDavClient.exists(fullPath))) {
                await webDavClient.putFileContents(fullPath, await fileContent?.arrayBuffer(), { overwrite: true });
                return;
            }
            if (new Date(await fileContent?.lastModified).getTime() > new Date((await webDavClient.stat(fullPath) as FileStat)?.lastmod).getTime()) {
                await webDavClient.putFileContents(fullPath, await fileContent?.arrayBuffer(), { overwrite: true });
                return;
            }
        }
    }));
}

//
export const WebDavSync = (address, options: any = {}) => {
    const client = createClient(address, options);

    //
    return {
        client,
        download: async () => {
            return downloadContentsToOPFS(client)?.catch?.((e) => { console.warn(e); return []; });
        },
        upload: async () => {
            return uploadOPFSToWebDav(client)?.catch?.((e) => { console.warn(e); return []; });
        }
    }
}

//
const currentWebDav: { sync: any } = { sync: null };
(async () => {
    const settings = await idbGet("rs-settings");
    console.log(settings);
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
    settings ||= await idbGet("rs-settings");
    console.log(settings);
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
