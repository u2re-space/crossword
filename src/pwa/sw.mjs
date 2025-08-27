import { GPT_API } from "shared/api/GPT-API";
import { IDBStorage } from "shared/data/IDBStorage.js";

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
            req.onsuccess = () => { req.result.close(); res(); };
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
    req.onerror = () => { db.close(); rej(req.error); };
}

//
async function removeOneFromQueue(item) {
    const db = await idbOpen();
    const out = new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).openCursor();
        req.onsuccess = () => {
            const cur = req.result;
            if (!cur) { res(); return; }
            if (JSON.stringify(cur.value) === JSON.stringify(item)) { cur.delete(); res(); return; }
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

    // POST
    if (e.request.method === 'POST') {
        /* // api/geo, handling beacons in service worker
        if (url.pathname.includes('/api/geo')) {
            e.respondWith(fetch(e.request));
            return;
        }*/

        // share-target
        if (url.pathname === '/share-target') {
            e.respondWith((async () => {
                const fd = await e.request.formData();
                const payload = {
                    title: fd.get('title'),
                    text: fd.get('text'),
                    url: fd.get('url'),
                    files: fd.getAll('files') // File[]
                };

                // GPT
                const response = await GPT_API.getResponse(payload.files?.[0] ?? payload.text, getKind(payload));
                idbStorage.put("response-" + Date.now(), JSON.stringify(response));

                // shared-target
                const clientsArr = await self.clients.matchAll({type: 'window', includeUncontrolled:true});
                if (clientsArr.length) clientsArr[0].postMessage({type: 'shared', payload});
                return Response.redirect('/shared', 303);
            })());
        }
    }

    // GET
    if (e.request.method === 'GET') {
        // shared
        if (url.pathname === '/shared') {
            e.respondWith((async () => {
                const payload = await idbStorage.get("response-" + Date.now());
                return Response.json(payload);
            })());
        }
    }

    // PUT
    if (e.request.method === 'PUT') {
        // shared
        if (url.pathname === '/shared') {
            e.respondWith((async () => {
                const fd = await e.request.formData();
                const payload = {
                    title: fd.get('title'),
                    text: fd.get('text'),
                    url: fd.get('url'),
                    files: fd.getAll('files') // File[]
                };
                idbStorage.put("response-" + Date.now(), JSON.stringify(payload));
                return Response.json(payload);
            })());
        }
    }

    // DELETE
    if (e.request.method === 'DELETE') {
        // shared
        if (url.pathname === '/shared') {
            e.respondWith((async () => {
                await idbStorage.delete("response-" + Date.now());
                return Response.json({});
            })());
        }
    }

    //
    e.respondWith(fetch(e.request));
    return;
});
