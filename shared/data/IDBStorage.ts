import { Promised } from "fest/object";

//
const DB_NAME = 'geo-db';
const STORE = 'last';

//
export async function idbOpen(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
}

//
export async function idbPut(key: string, value: any) {
    const db = await idbOpen();
    const out = new Promise<void>((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ key, value });
        tx.oncomplete = () => res(void 0);
        tx.onerror = () => rej(tx.error);
    });
    out?.finally?.(() => db.close());
    return out;
}

//
export async function idbGet(key: string): Promise<any> {
    const db = await idbOpen();
    const out = new Promise<any>((res, rej) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => res(req.result?.value ?? null);
        req.onerror = () => rej(req.error);
    });
    out?.finally?.(() => db.close());
    return out;
}

//
export async function idbDelete(key: string): Promise<void> {
    const db = await idbOpen();
    const out = new Promise<void>((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).delete(key);
        req.onsuccess = () => res(void 0);
        req.onerror = () => rej(req.error);
    });
    out?.finally?.(() => db.close());
    return out;
}

//
export async function idbDeleteAll(prefix = 'response-'): Promise<void> {
    const db = await idbOpen();
    const out = new Promise<void>((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).openCursor();
        req.onsuccess = () => {
            const cur = req.result;
            if (!cur) { res(void 0); return; }
            if (prefix && !cur.value.key.startsWith(prefix)) { cur.continue(); return; }
            cur.delete();
            cur.continue();
        };
        req.onerror = () => rej(req.error);
    });
    out?.finally?.(() => db.close());
    return out;
}

//prefix + Date.now()
export async function idbGetAll(prefix = 'response-'): Promise<any[]> {
    const db = await idbOpen();
    const out = new Promise<any[]>((res, rej) => {
        const out: any[] = [];
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).openCursor();
        req.onsuccess = () => {
            const cur = req.result;
            if (!cur) { res(out); return; }
            if (prefix && !cur.value.key.startsWith(prefix)) { cur.continue(); return; }
            out.push(cur.value);
            cur.continue();
        };
        req.onerror = () => rej(req.error);
    })?.then?.(out => out.sort((a, b) => b.key - a.key));
    out?.finally?.(() => db.close());
    return out;
}

//
export class IDBStorage {
    private db: IDBDatabase | null = null;

    constructor() {
        this.db = Promised(idbOpen());
    }

    async put(key: string, value: any) {
        return idbPut(key, value);
    }

    async get(key: string): Promise<any> {
        return idbGet(key);
    }

    async delete(key: string): Promise<void> {
        return idbDelete(key);
    }

    async deleteAll(prefix = 'response-'): Promise<void> {
        return idbDeleteAll(prefix);
    }

    async getAll(prefix = 'response-'): Promise<any[]> {
        return idbGetAll(prefix);
    }
}
