import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { recognizeEntityType } from "@rs-core/service/recognize/EntityTypeDetect";
import { recognizeKindOfEntity } from "@rs-core/service/recognize/KindOfEntity";
import { resolveEntity } from "@rs-core/service/recognize/EntityItemResolve";
import { idbStorage } from "./lib/idbQueue";
import { dataCategories } from "@rs-core/service/Cache";
import { idbGet } from "@rs-core/store/IDBStorage";

//Import routing modules for registering routes and setting default and catch handlers
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import {
    NetworkFirst, //Cache the network response first and return it if it succeeds, otherwise return the cached response
    NetworkOnly, //Fetch the resource from the network and don't cache it
    Strategy, //Base class for caching strategies
    StrategyHandler //Base class for caching strategy handlers
} from 'workbox-strategies'


// lifecycle
self.addEventListener('install', (e) => {
    // @ts-ignore
    e.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (e) => {
    // @ts-ignore
    e.waitUntil(self.clients.claim());
});


//
const initiateConversionProcedure = async (dataSource: string|Blob|File|any)=>{
    const settings = await idbGet("rs-settings");

    //
    if (!settings) return { resultEntities: [], entityTypes: [] };
    const gptResponses = new GPTResponses(settings.ai.apiKey, settings.ai.apiUrl, settings.ai.apiSecret, settings.ai.model);

    // phase 1 - recognize entity type
    let entityTypes: any[] = (await recognizeEntityType(dataSource, gptResponses)) || [{ entityType: "unknown" }];

    // phase 2 - recognize kind of entity
    let entityKinds: any[] = (await recognizeKindOfEntity(entityTypes, gptResponses)) || [{ kinds: ["unknown"] }];

    // phase 3 - convert data to target format
    const resultEntity = await resolveEntity(entityTypes, entityKinds, gptResponses);
    const resultEntities = Array.isArray(resultEntity) ? resultEntity : [resultEntity];
    return { resultEntities, entityTypes };
}


// TODO! needs to debug completely and complex and make it more robust
const SW_VERSION = '1.0.0';
const controlChannel = new BroadcastChannel('rs-sw');


const _LOG = (a) => {
    console.log(a);
    return a;
}


//
setDefaultHandler(new NetworkFirst())

//
registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
    const url = new URL(e.request.url);
    console.log(url);

    const fd = await e.request.formData();
    const inputs = {
        title: fd.get('title'),
        text: fd.get('text'),
        url: fd.get('url'),
        files: fd.getAll('files') // File[]
    };


    const files: any[] = (Array.isArray(inputs.files) && inputs.files.length) ? inputs.files : [null];
    const results: any[] = [];
    let idx = 0;

    for (const file of files) {
        const source = file || inputs?.text || inputs?.url;
        if (!source) continue;
        console.log(source);
        try {
            const { resultEntities, entityTypes } = await initiateConversionProcedure(source);
            console.log(resultEntities, entityTypes);
            resultEntities.forEach((resultEntity, i) => {
                const resolvedType = entityTypes?.[i]?.entityType || entityTypes?.[0]?.entityType || 'unknown';
                const name = (resultEntity?.id || resultEntity?.desc?.name || `${Date.now()}_${idx}`)
                    ?.toString?.()
                    ?.toLowerCase?.()
                    ?.replace?.(/\s+/g, '-')
                    ?.replace?.(/[^a-z0-9_\-+#&]/g, '-') || `${Date.now()}_${idx}`;
                const path = `/user/data/${resolvedType}/${name}.json`;
                const key = `pending-fs-write_${resolvedType}_${Date.now()}_${idx}`;
                idbStorage.put(key, { path, data: resultEntity });
                (dataCategories as any)?.find?.((category) => category?.id === resolvedType)?.items?.push?.(name);
                results.push({ status: 'queued', entityType: resolvedType, name, path, key });
                idx++;
            });
        } catch (err) {
            results.push({ status: 'error', error: String(err) });
        }
    }

    // @ts-ignore
    const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
    if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results });
    try { controlChannel.postMessage({ type: 'pending-write', results }); } catch { }

    return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
}, "POST")

//
registerRoute(({ url }) => url?.pathname == "/share-target-json", async (e: any) => {
    const url = new URL(e.request.url);
    console.log(url.pathname);
    try {
        const body = await e.request.json().catch(() => ({}));
        const source = body?.file || body?.text || body?.url || JSON.stringify(body || {});
        console.log(source);
        const { resultEntities, entityTypes } = await initiateConversionProcedure(source);
        console.log(resultEntities);
        const results: any[] = [];
        resultEntities.forEach((resultEntity, i) => {
            const resolvedType = entityTypes?.[i]?.entityType || entityTypes?.[0]?.entityType || 'unknown';
            const name = (resultEntity?.id || resultEntity?.desc?.name || `${Date.now()}_${i}`)
                ?.toString?.()
                ?.toLowerCase?.()
                ?.replace?.(/\s+/g, '-')
                ?.replace?.(/[^a-z0-9_\-+#&]/g, '-') || `${Date.now()}_${i}`;
            const path = `/user/data/${resolvedType}/${name}.json`;
            const key = `pending-fs-write_${resolvedType}_${Date.now()}_${i}`;
            idbStorage.put(key, { path, data: resultEntity });
            (dataCategories as any)?.find?.((category) => category?.id === resolvedType)?.items?.push?.(name);
            results.push({ status: 'queued', entityType: resolvedType, name, path, key });
        });
        try { controlChannel.postMessage({ type: 'pending-write', results }); } catch { }
        return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
