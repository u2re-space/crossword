import { idbDelete, idbGetAll } from "@rs-core/store/IDBStorage";
import { safe } from "fest/object";
import { writeFile, getDir } from "fest/lure";

//
export const pushPendingToFS = async (entityType: string) => {
    const allEntries = await idbGetAll("pending-fs-write_" + entityType + "_");
    return Promise.all(allEntries.map(async (entry) => {
        writeFile(null, entry.key, safe(entry.value));
        console.log("Written file: " + getDir(entry.key));
        await new Promise((res) => setTimeout(res, 1000));
        await idbDelete(getDir(entry.key));
    }));
}
