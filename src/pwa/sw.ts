import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { recognizeEntityType } from "@rs-core/service/recognize/entity/EntityTypeDetect";
import { recognizeKindOfEntity } from "@rs-core/service/recognize/entity/KindOfEntity";
import { resolveEntity } from "@rs-core/service/recognize/entity/EntityItemResolve";
import { idbStorage } from "./lib/IDBQueue";
import { dataCategories } from "@rs-core/service/Cache";
import { idbGet } from "@rs-core/store/IDBStorage";

//Import routing modules for registering routes and setting default and catch handlers
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import {
    NetworkFirst, //Cache the network response first and return it if it succeeds, otherwise return the cached response
    NetworkOnly, //Fetch the resource from the network and don't cache it
    Strategy, //Base class for caching strategies
    StrategyHandler, //Base class for caching strategy handlers
    StaleWhileRevalidate
} from 'workbox-strategies'


import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { detectEntityTypesByJSONs } from "@rs-core/template/TypeDetector";

// TODO! needs to debug completely and complex and make it more robust
const SW_VERSION = '1.0.0';
const controlChannel = new BroadcastChannel('rs-sw');
const fileSystemChannel = new BroadcastChannel('rs-fs');

//
const getKey = (resolvedType: string, idx: number | null = null) => {
    return `${resolvedType}_${idx || Date.now()}`;
}

//
const writeToFS = (resolvedType: string, resultEntity: any, outDir: any | null = null, name: string | null = null, idx: number | null = null) => {
    idx ||= Date.now();
    name ??= (resultEntity?.id || resultEntity?.name || resultEntity?.desc?.name || idx);
    name = name?.endsWith?.(".json") ? name : (name + ".json");
    outDir ||= ("/data/" + resolvedType + "/");
    const fullPath = outDir + name;
    const idKey = getKey(resolvedType, idx);
    idbStorage.put("pending-fs-write_" + idKey, { path: fullPath, data: resultEntity });
    fileSystemChannel.postMessage({ type: 'pending-write', results: [{ status: 'queued', entityType: resolvedType, data: resultEntity, name, path: fullPath, idKey, idx }] });
    return { path: fullPath, name };
}

//
const initiateConversionProcedure = async (dataSource: string|Blob|File|any)=>{
    const settings = await idbGet("rs-settings");

    //
    if (!settings) return { resultEntities: [], entityTypedDesc: [] };
    const gptResponses = new GPTResponses(settings.ai.apiKey, settings.ai.baseUrl, settings.ai.apiSecret, settings.ai.model);
    console.log(gptResponses);

    //
    if (settings?.ai?.mcp?.serverLabel && settings.ai.mcp.origin && settings.ai.mcp.clientKey && settings.ai.mcp.secretKey) {
        await gptResponses.useMCP(settings.ai.mcp.serverLabel, settings.ai.mcp.origin, settings.ai.mcp.clientKey, settings.ai.mcp.secretKey)?.catch?.(console.warn.bind(console));
    }

    // phase 0 - prepare data
    // upload dataset to GPT for recognize, and get response for analyze...
    await gptResponses.attachToRequest(dataSource)?.catch?.(console.warn.bind(console));
    const rawDataset = JSON.parse(await gptResponses.sendRequest() || "[]"); // for use in first step...

    // write to FS raw cache
    const cacheFileName = "recognized_cache_" + Date.now();
    writeToFS("rawDataset", rawDataset, "/cache/", cacheFileName, Date.now());

    // phase 1 - recognize entity type, make basic description
    let entityTypedDesc: any[] = (await (recognizeEntityType(gptResponses))?.catch?.(console.warn.bind(console))) || [{ entityType: "unknown" }];

    // phase 2 - recognize kind of entity, make relations
    let entityRelations: any[] = (await recognizeKindOfEntity(entityTypedDesc, gptResponses)?.catch?.(console.warn.bind(console))) || [{ kinds: ["unknown"] }];

    // phase 3 - convert data to target format, make final description
    const resultEntity = (await resolveEntity(entityTypedDesc, entityRelations, gptResponses)?.catch?.(console.warn.bind(console))) || [];
    resultEntity?.forEach((resultEntity: any, i: number) => {
        const resolvedType = entityTypedDesc?.[i]?.entityType || entityTypedDesc?.[0]?.entityType || 'unknown';

        //
        const timeStamp = Date.now();
        const fileName = (resultEntity?.id || resultEntity?.name || resultEntity?.desc?.name || timeStamp)
            ?.toString?.()
            ?.toLowerCase?.()
            ?.replace?.(/\s+/g, '-')
            ?.replace?.(/[^a-z0-9_\-+#&]/g, '-') || timeStamp;
        const outDir = "/data/" + resolvedType + "/";

        //
        console.log(resolvedType, resultEntity);

        // prepare for phase 4 - consolidate
        writeToFS(resolvedType, resultEntity, outDir, fileName, timeStamp);
    });

    //
    const resultEntities = Array.isArray(resultEntity) ? resultEntity : [resultEntity];
    return { resultEntities, entityTypedDesc };
}




const _LOG = (a) => {
    console.log(a);
    return a;
}

// @ts-ignore // lifecycle
self.addEventListener('install', (e) => { e.waitUntil(self.skipWaiting()); }); // @ts-ignore
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

//
setDefaultHandler(new NetworkFirst())

//
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({ cacheName: 'html-cache' })
)

//
const queueEntityForWriting = (resultEntity, entityDesc, idx: number = 0): any => {
    const resolvedType = (entityDesc.entityType || 'unknown')?.trim?.();

    //
    let name = (resultEntity?.id || resultEntity?.name || resultEntity?.desc?.name || `${Date.now()}_${idx}`)
        ?.trim?.()
        ?.toString?.()
        ?.toLowerCase?.()
        ?.replace?.(/\s+/g, '-')
        ?.replace?.(/[^a-z0-9_\-+#&]/g, '-')
        || `${Date.now()}_${idx}`;

    // prepare to writing into database (for phase 4 - consolidate)
    const path = `/data/${resolvedType}/`?.trim?.();
    writeToFS(resolvedType, resultEntity, path, name = name?.trim?.(), idx);

    // get preview versions of resolved entity to show in UI
    (dataCategories as any)?.find?.((category) => category?.id === resolvedType)?.items?.push?.(name);
    return { status: 'queued', entityDesc, data: resultEntity, name, path, idx: idx || Date.now() };
}

//
registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
    const url = new URL(e.request.url);
    const fd = await e.request.formData();
    const inputs = {
        title: fd.get('title'),
        text: fd.get('text'),
        url: fd.get('url'),
        files: fd.getAll('files') // File[]
    };

    //
    const files: any[] = (Array.isArray(inputs.files) && inputs.files.length) ? inputs.files : [inputs?.text || inputs?.url || null];
    const results: any[] = [];
    let idx = 0;

    //
    for (const file of files) {
        const source = file || inputs?.text || inputs?.url;
        if (!source) continue;

        //
        const text: string = (source instanceof File || source instanceof Blob) ? (file?.type?.startsWith?.("image/") ? "" : (await source?.text?.())) :
            (source == inputs?.text ? inputs.text :
                (await fetch(source)?.then?.((res) => res.text())?.catch?.(console.warn.bind(console)) || ""));

        // try avoid using AI when data structure is known
        if (text) {
            const json: any = text ? JSON.parse(text) : [];
            let entityTypes = json ? detectEntityTypesByJSONs(json) : [];
            if (entityTypes != null && entityTypes?.length && entityTypes?.filter?.((type) => (type && type != "unknown"))?.length) {
                json?.map?.((resultEntity, i) => {
                    const type = entityTypes[i];
                    if (type && type != "unknown") results.push(queueEntityForWriting(resultEntity, { entityType: type }, idx++));
                }); continue;
            }
        }

        //
        try {
            const { resultEntities, entityTypedDesc } = await initiateConversionProcedure(source);
            resultEntities.forEach((resultEntity, i) => {
                results.push(queueEntityForWriting(resultEntity, entityTypedDesc?.[i] ?? entityTypedDesc?.[0] ?? entityTypedDesc), idx++);
            });
        } catch (err) {
            results.push({ status: 'error', error: String(err) });
        }
    }

    //
    console.log(results);

    // @ts-ignore
    const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
    if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results });
    try { controlChannel.postMessage({ type: 'pending-write', results }); } catch { }

    //
    return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } });
}, "POST")

//
registerRoute(({ url }) => url?.pathname == "/share-target-json", async (e: any) => {
    const url = new URL(e.request.url);
    try {
        const body = await e.request.json().catch(() => ({}));
        const source = body?.file || body?.text || body?.url || JSON.stringify(body || {});
        const { resultEntities, entityTypedDesc } = await initiateConversionProcedure(source);
        const results: any[] = [];
        resultEntities.forEach((resultEntity, i) => {
            const resolvedType = (entityTypedDesc?.[i]?.entityType || entityTypedDesc?.[0]?.entityType || 'unknown')?.trim?.();
            let name = (resultEntity?.id || resultEntity?.desc?.name || `${Date.now()}_${i}`)?.trim?.()
                ?.toString?.()
                ?.toLowerCase?.()
                ?.replace?.(/\s+/g, '-')
                ?.replace?.(/[^a-z0-9_\-+#&]/g, '-') || `${Date.now()}_${i}`;
            name = name?.trim?.();
            const path = (`/data/${resolvedType}/`)?.trim?.();
            const fileName = name?.endsWith?.(".json") ? name : (name + ".json")?.trim?.();
            const fullPath = path + fileName;
            const key = getKey(resolvedType, i);
            idbStorage.put(key, { path: fullPath, data: resultEntity });
            (dataCategories as any)?.find?.((category) => category?.id === resolvedType)?.items?.push?.(name);
            results.push({ status: 'queued', entityType: resolvedType, name, path: fullPath, key, idx: i || Date.now() });
        });
        try { controlChannel.postMessage({ type: 'pending-write', results }); } catch { }
        return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: String(err) }, null, 2), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}, "POST")

// fallback to app-shell for document request
setCatchHandler(({ event }: any): Promise<Response> => {
    switch (event?.request?.destination) {
        case 'document':
            return caches.match("/").then((r: any) => {
                return r ? Promise.resolve(r) : Promise.resolve(Response.error());
            })
        default:
            return Promise.resolve(Response.error());
    }
})
