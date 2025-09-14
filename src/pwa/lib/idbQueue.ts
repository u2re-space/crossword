import { idbOpen, IDBStorage } from "../../core/store/IDBStorage";

//
const DB_NAME = 'req-queue';
const STORE = 'queue';

//
export const idbStorage = new IDBStorage();

//
export async function idbPushQueue(item) {
    await idbStorage.put(item?.key, item?.value);

    //
    const db = await idbOpen();
    if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        await new Promise((res) => {
            const req = indexedDB.open(DB_NAME, 2);
            req.onupgradeneeded = () => req.result.createObjectStore(STORE, { autoIncrement: true });
            req.onsuccess = () => { req.result.close(); res(void 0); };
        });
    } else db.close();

    //
    const db2 = await idbOpen();
    await new Promise((res, rej) => {
        const tx = db2.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).add(item);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
    });
    db2.close();
}

//
export async function flushQueue() {
    await idbStorage.getAll();

    //
    const db = await idbOpen();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = async () => {
        const cur = req.result;
        if (!cur) { db.close(); return; }
        await fetch('/api/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cur.value),
        });
        await removeOneFromQueue(cur.value);
        cur.continue();
    };
    req.onerror = () => { db.close(); }
}

//
export async function removeOneFromQueue(item) {
    await idbStorage.delete(item?.key);

    //
    const db = await idbOpen();
    const out = new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).openCursor();
        req.onsuccess = () => {
            const cur = req.result;
            if (!cur) { res(void 0); return; }
            if (JSON.stringify(cur.value) === JSON.stringify(item)) { cur.delete(); res(void 0); return; }
            cur.continue();
        };
        req.onerror = () => rej(req.error);
    });
    out?.finally?.(() => db.close());
    return out;
}
