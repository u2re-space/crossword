import { idbOpen } from "../core/data/IDBStorage";
import { IDBStorage } from "../core/data/IDBStorage";
import { GPTConversion } from "../core/api/endpoints/GPT-Conversion";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from "../core/model/Entities";
import { categories } from "../core/api/dataset/Data";
import { safe } from "fest/object";

//
import { decode } from '@jsquash/png';
import { encode } from '@jsquash/jpeg';

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
self.addEventListener('message', (e) => {
    //if (e.data.type === 'start') startTrackingRemote();
    //if (e.data.type === 'stop') stopTrackingRemote();

    // for testing
    startTrackingRemote();
});

//
const convertImageToJPEG = async (image: Blob|File|any): Promise<Blob>=>{
    const decoded = await decode(await image.arrayBuffer());
    const encoded = await encode(decoded, { quality: 0.9 });
    return new Blob([encoded], { type: 'image/jpeg' });
}



//
const ASK_WRITE_JSON_FORMAT = `
Don't write anything else, just the JSON format, do not write comments, do not write anything else.
`?.trim?.();



//
const ASK_ABOUT_KIND_OF_ENTITY = (entityType: string) => `
You are a helpful assistant that can recognize kind of entity. You are given a data source and you need to recognize kind of entity.

This is the kind scheme of ${entityType} entity (enums values):
\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities[entityType].kind.enum, null, 2)}
\`\`\`

Give in JSON format '{ kind: string }'.

${ASK_WRITE_JSON_FORMAT}
`?.trim?.();




//
const ASK_ABOUT_USABILITY_KIND_OF_BONUS = `
You are a helpful assistant that can recognize usability kind of bonus entity. You are given a data source and you need to recognize usability kind of bonus entity.

This is the kind scheme of ${"bonus"} entity (enums values):
\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities["bonus"].kind.enum, null, 2)}
\`\`\`

This is the usability kind scheme of bonus entity.
\`\`\`
{
    forEntity: enum [
        "item",
        "service",
        "entertainment",
        "action"
    ],
    inEntity: enum [
        "location",
        "market",
        "placement",
        "event",
        "action",
        "person"
    ]
}
\`\`\`

Give in JSON format '{ kind: string, usabilityKind: { forEntity: string, inEntity: string } }'.

${ASK_WRITE_JSON_FORMAT}
`?.trim?.();



//
const recognizeEntityType = async (dataSource: string|Blob|File|any, gptConversion: GPTConversion)=>{
    const instructions = [
        "You are a helpful assistant that can recognize type of entity. You are given a data source and you need to recognize type of entity. Give in JSON format '{ entityType: string }'. " + ASK_WRITE_JSON_FORMAT,
        "Select only from these entity types: " + JSON.stringify(Object.keys(JSON_SCHEMES.$entities), null, 2) + ", otherwise 'unknown'."
    ]?.map?.((instruction)=> instruction?.trim?.());

    //
    gptConversion.addInstruction(instructions?.join?.("\n"));
    gptConversion.addToRequest(dataSource?.type?.startsWith?.("image/") ? await convertImageToJPEG(dataSource) : dataSource);
    const response = await gptConversion.sendRequest();
    const $PRIMARY = JSON.parse(response?.content || "{}");
    return $PRIMARY?.entityType || "unknown";
}

//
const recognizeKindOfEntity = async (entityType: any, gptConversion: GPTConversion)=>{
    gptConversion.addInstruction(entityType == "bonus" ? ASK_ABOUT_USABILITY_KIND_OF_BONUS : ASK_ABOUT_KIND_OF_ENTITY(entityType));
    gptConversion.addToRequest(JSON_SCHEMES.$entities[entityType]);
    const response = await gptConversion.sendRequest();
    return JSON.parse(response?.content)?.kind;
}



//
const resolveEntity = async (entityType: any, entityKind: any, gptConversion: GPTConversion)=>{
    const instructions = [
        "You are a helpful assistant that can convert data from one format to another. You are given a data source and you need to convert it to the target format. Give in following JSON format: " + ASK_WRITE_JSON_FORMAT + " + " + ABOUT_NAME_ID_GENERATION,
        "JSON Data partially complains with: `https://json-schema.org/draft/2020-12/schema`",
        `Shared Defs Declared:
\`\`\`json\n
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}\n
\`\`\``,

// For AI generation, this field 'desc.name' may be omitted or optionally generated by AI.
// We planned to generate name by runtime schema, not by GPT response.
ABOUT_NAME_ID_GENERATION
    ]?.map?.((instruction)=> instruction?.trim?.());

    //
    gptConversion.addInstruction(instructions?.join?.("\n"));
    gptConversion.addToRequest(`
Shortlist of related entities of ${entityType} entity, for making compatible conversion:
\`\`\`json
${JSON.stringify(safe((categories as any)?.find?.((category)=> category?.id === entityType)?.items?.filter?.((item)=> (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)}
\`\`\`
    `);

    //
    const response = await gptConversion.sendRequest();
    return JSON.parse(response?.content);
}


// TODO! needs to debug completely and complex and make it more robust
const initiateConversionProcedure = async (dataSource: string|Blob|File|any)=>{
    const gptConversion = new GPTConversion();

    // phase 1 - recognize entity type
    let entityType: any = (await recognizeEntityType(dataSource, gptConversion)) || "unknown";

    // phase 2 - recognize kind of entity
    let entityKind: any = (await recognizeKindOfEntity(entityType, gptConversion)) || "unknown";

    // phase 3 - convert data to target format
    const resultEntity = await resolveEntity(entityType, entityKind, gptConversion);
    return resultEntity;
}

//
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // POST request
    if (e.request.method === 'POST') {

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
                const resultEntity = await initiateConversionProcedure(inputs?.files?.[0] || inputs?.text || inputs?.url);

                // pending fs write (OPFS)
                idbStorage.put("pending-fs-write_" + entityType + "_" + (JSON.parse(resultEntity)?.desc?.name || Date.now().toString()), resultEntity);

                // update categories with new item
                (categories as any)?.find?.((category)=> category?.id === entityType)?.items?.push(resultEntity?.desc?.name);

                // @ts-ignore
                const clientsArr = await clients.matchAll({type: 'window', includeUncontrolled:true});
                if (clientsArr.length) clientsArr[0].postMessage({entityType, resultEntity});

                // TODO: correct status by GPT response
                return new Response(JSON.stringify(resultEntity, null, 2), {
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
