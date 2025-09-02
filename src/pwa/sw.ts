import { idbOpen } from "../core/data/IDBStorage";
import { IDBStorage } from "../core/data/IDBStorage";

//
const DB_NAME = 'req-queue';
const STORE = 'queue';

//
const boardcastChannel = new BroadcastChannel('geolocation');
const idbStorage = new IDBStorage();

//
export const startTrackingRemote = () => {
    boardcastChannel.postMessage({type: 'start'});
}

//
export const stopTrackingRemote = () => {
    boardcastChannel.postMessage({type: 'stop'});
}

//
boardcastChannel.onmessage = (e) => {
    idbStorage.put(e.data.key, e.data.value);
}

//
async function idbPushQueue(item) {
    const db = await idbOpen();
    if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        await new Promise((res) => {
            const req = indexedDB.open(DB_NAME, 2);
            req.onupgradeneeded = () => req.result.createObjectStore(STORE, { autoIncrement: true });
            req.onsuccess = () => { req.result.close(); res(void 0); };
        });
    } else db.close();

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
async function flushQueue() {
    const db = await idbOpen();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = async () => {
        const cur = req.result;
        if (!cur) { db.close(); return; }
        await fetch('/api/geo', {
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
async function removeOneFromQueue(item) {
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

//
const getKind = (payload) => {
    if (payload.files?.[0]) return 'image';
    if (payload.text) return 'text';
    return 'url';
}

//
self.addEventListener('message', (e) => {
    //if (e.data.type === 'start') startTrackingRemote();
    //if (e.data.type === 'stop') stopTrackingRemote();

    // for testing
    startTrackingRemote();
});

//
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // POST request
    if (e.request.method === 'POST') {
        /* // api/geo, handling beacons in service worker
        if (url.pathname.includes('/api/geo')) {
            e.respondWith(fetch(e.request));
            return;
        }*/

        // Shared target
        if (url.pathname === '/share-target') {
            e.respondWith((async () => {
                const fd = await e.request.formData();
                const inputs = {
                    title: fd.get('title'),
                    text: fd.get('text'),
                    url: fd.get('url'),
                    files: fd.getAll('files') // File[]
                };

                //
                const entityType = "bonus";

                // JSON coded
                const jsonCoded = JSON.stringify({
                    kind: "test",
                    desc: {
                        name: 'response',
                        description: 'Response from GPT'
                    }
                });

                // GPT response
                const response: any = {
                    output: [{
                        type: 'text_output',
                        content: jsonCoded
                    }]
                };

                // Pending fs write (OPFS)
                idbStorage.put("pending-fs-write-" + entityType + "_" + (JSON.parse(jsonCoded)?.desc?.name || Date.now().toString()), jsonCoded);

                // @ts-ignore
                const clientsArr = await clients.matchAll({type: 'window', includeUncontrolled:true});
                if (clientsArr.length) clientsArr[0].postMessage({entityType, jsonCoded});

                // TODO: correct status by GPT response
                return new Response(JSON.stringify(response), {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            })());
        }
    }

    // GET
    if (e.request.method === 'GET') {

    }

    // PUT
    if (e.request.method == 'PUT') {

    }

    // DELETE
    if (e.request.method == 'DELETE') {

    }

    //
    e.respondWith(fetch(e.request));
    return;
});
