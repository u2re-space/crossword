import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { resolveEntity } from "@rs-core/service/AI-ops/EntityItemResolve";
import { pushMany } from "@rs-core/store/IDBQueue";
import { dataCategories } from "@rs-core/service/Cache";

//
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import {
    NetworkFirst
} from 'workbox-strategies'

//
import { analyzeRecognizeUnified } from "@rs-core/service/AI-ops/RecognizeData";
import { detectEntityTypeByJSON } from "@rs-core/template/TypeDetector-v2";
import { loadSettings } from "@rs-core/config/Settings";
import { fixEntityId } from "@rs-core/template/EntityId";

// TODO! needs to debug completely and complex and make it more robust
const SW_VERSION = '1.0.0';
const DOC_DIR = "/docs/preferences/";
const PLAIN_DIR = "/docs/plain/";

//
const controlChannel = new BroadcastChannel('rs-sw');

// for caches
const initiateAnalyzeAndRecognizeData = async (dataSource: string | Blob | File | any) => {
    return analyzeRecognizeUnified(dataSource, (response) => {
        console.log(response);
    });
}

// needs to implement DataSourceCache by IndexedDB
const dataSourceCacheBinary = new WeakMap<File | Blob | ArrayBuffer, string>();
const dataSourceCacheString = new Map<string, string>();

//
const hasInDataSourceCache = (dataSource: string | Blob | File | any) => {
    if (dataSource instanceof File || dataSource instanceof Blob || dataSource instanceof ArrayBuffer) {
        return dataSourceCacheBinary?.has(dataSource) && dataSourceCacheBinary?.get?.(dataSource);
    } else {
        return dataSourceCacheString?.has(dataSource) && dataSourceCacheString?.get?.(dataSource);
    }
}

//
const getFromDataSourceCache = (dataSource: string | Blob | File | any) => {
    if (dataSource instanceof File || dataSource instanceof Blob || dataSource instanceof ArrayBuffer) {
        return dataSourceCacheBinary?.get?.(dataSource);
    } else {
        return dataSourceCacheString?.get?.(dataSource);
    }
}

//
const setToDataSourceCache = (dataSource: string | Blob | File | any, responseId: string) => {
    if (dataSource instanceof File || dataSource instanceof Blob || dataSource instanceof ArrayBuffer) {
        dataSourceCacheBinary?.set?.(dataSource, responseId);
    } else {
        dataSourceCacheString?.set?.(dataSource, responseId);
    }
}

//
const getOrDefaultComputedOfDataSourceCache = (dataSource: string | Blob | File | any, defaultValueCb: (dataSource: string | Blob | File | any) => string | null | Promise<string | null> = () => null) => {
    if (hasInDataSourceCache(dataSource)) {
        return getFromDataSourceCache(dataSource);
    } else {
        const value = defaultValueCb?.(dataSource);
        if (value instanceof Promise) {
            value?.then?.((v) => setToDataSourceCache(dataSource, v || ""));
        } else {
            setToDataSourceCache(dataSource, value || "");
        }
        return value;
    }
}

//
const initiateConversionProcedure = async (dataSource: string|Blob|File|any)=>{
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return { entities: [] };

    //
    const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5-mini");

    // phase 1 - prepare data
    // upload dataset to GPT for recognize, and get response for analyze... and load into context
    gptResponses.beginFromResponseId(await getOrDefaultComputedOfDataSourceCache(dataSource, async (dataSource) => {
        await gptResponses?.attachToRequest?.(dataSource)?.catch?.(console.warn.bind(console));
        await gptResponses?.sendRequest("high", "high")?.catch?.(console.warn.bind(console));
        return gptResponses.getResponseId() || "";
    }));

    //
    if (settings?.ai?.mcp?.serverLabel && settings.ai?.mcp.origin && settings.ai?.mcp.clientKey && settings.ai?.mcp.secretKey) {
        await gptResponses.useMCP(settings.ai?.mcp.serverLabel, settings.ai?.mcp.origin, settings.ai?.mcp.clientKey, settings.ai?.mcp.secretKey)?.catch?.(console.warn.bind(console));
    }

    // phase 2 - convert data to target format, make final description
    const resultsRaw = (await resolveEntity(gptResponses)?.catch?.(console.warn.bind(console))) || [];
    const results = Array.isArray(resultsRaw) ? resultsRaw : [resultsRaw];
    return { entities: results?.flatMap?.((result) => (result?.entities || [])) };
}

//
const queueEntityForWriting = (entity, entityType, dataType: string | null = "json"): any => {
    const resolvedType = (entityType || 'unknown')?.trim?.();

    //
    let subId = `${Date.now()}`;
    let name = (fixEntityId(entity) || subId)
        ?.trim?.()
        ?.toString?.()
        ?.toLowerCase?.()
        ?.replace?.(/\s+/g, '-')
        ?.replace?.(/[^a-z0-9_\-+#&]/g, '-')
        || subId;

    // prepare to writing into database (for phase 4 - consolidate)
    const directory = `/data/${resolvedType}/`?.trim?.();

    // get preview versions of resolved entity to show in UI
    (dataCategories as any)?.find?.((category) => category?.id === resolvedType)?.items?.push?.(name);
    return { status: 'queued', entityType, data: entity, name, directory, subId, dataType };
}

//
const isMarkdown = (text: string, source: string | File | Blob) => {
    if (source instanceof File && source?.name?.endsWith?.(".md")) return true;
    if (source instanceof File || source instanceof Blob) if (source?.type?.includes?.("markdown")) return true;
    if (text?.startsWith?.("---") && text?.endsWith?.("---")) return true;
    return false;
}

//
const pushToIDBQueue = (results: any[]) => {
    return pushMany(results)?.catch?.(console.warn.bind(console));
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
registerRoute(({ request }) => request.mode === 'navigate', new NetworkFirst({ cacheName: 'html-cache' }))
registerRoute(({ url }) => url?.pathname == "/share-target-recognize", async (e: any) => {
    const url = new URL(e.request.url);
    const fd = await e.request.formData();
    const inputs = {
        title: fd.get('title'),
        text: fd.get('text'),
        url: fd.get('url'),
        files: fd.getAll('files'), // File[]
        targetDir: fd.get('targetDir')
    };

    //
    const files: any[] = (Array.isArray(inputs.files) && inputs.files.length) ? inputs.files : [inputs?.text || inputs?.url || null];
    const results: any[] = [];

    //
    for (const file of files) {
        const source = file || inputs?.text || inputs?.url;
        if (!source) continue;

        //
        const text: string = (source instanceof File || source instanceof Blob) ? (source?.type?.startsWith?.("image/") ? "" : (await source?.text?.())) :
            (source == inputs?.text ? inputs.text :
                (await fetch(source)?.then?.((res) => res.text())?.catch?.(console.warn.bind(console)) || ""));

        // try avoid using AI when data structure is known
        if (text && isMarkdown(text, source)) {
            const subId = Date.now();
            const directory = inputs?.targetDir || DOC_DIR;
            const name = `pasted-${subId}.md`;//source instanceof File ? source?.name : `pasted-${subId}.md`;
            const path = `${directory}${name}`;
            results.push({ status: 'queued', data: text, path, name, subId, directory, dataType: "markdown" });
            continue;
        }

        //
        try {
            const subId = Date.now();
            const { data, ok, error } = await initiateAnalyzeAndRecognizeData(source);
            const directory = inputs?.targetDir || DOC_DIR;
            const name = `pasted-${subId}.md`;
            const path = `${directory}${name}`;
            results.push({ status: ok ? 'queued' : 'error', error, directory, data, path, name, subId, dataType: "markdown" });
        } catch (err) {
            results.push({ status: 'error', error: String(err) });
        }
    }

    //
    await pushToIDBQueue(results)?.catch?.(console.warn.bind(console));
    try { controlChannel.postMessage({ type: 'pending-write' }); } catch (e) { console.warn(e); }

    // @ts-ignore
    const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
    if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results });

    //
    return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } });
}, "POST")

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

    //
    for (const file of files) {
        const source = file || inputs?.text || inputs?.url;
        if (!source) continue;

        //
        const text: string = (source instanceof File || source instanceof Blob) ? (source?.type?.startsWith?.("image/") ? "" : (await source?.text?.())) :
            (source == inputs?.text ? inputs.text :
                (await fetch(source)?.then?.((res) => res.text())?.catch?.(console.warn.bind(console)) || ""));

        // try avoid using AI when data structure is known
        if (text) {
            let json: any = text ? JSON.parse(text) : [];
            json = json?.entities || json;
            let types = json ? detectEntityTypeByJSON(json) : [];
            if (types != null && types?.length && types?.filter?.((type) => (type && type != "unknown"))?.length) {
                json?.map?.((entity, i) => {
                    const type = types[i];
                    if (type && type != "unknown") results.push(queueEntityForWriting(entity, type, "json"));
                }); continue;
            }
        }

        //
        try {
            const resultsRaw = await initiateConversionProcedure(source);
            resultsRaw?.entities?.forEach((entity) => {
                results.push(queueEntityForWriting(entity, entity?.type, "json"));
            });
        } catch (err) {
            results.push({ status: 'error', error: String(err) });
        }
    }

    //
    await pushToIDBQueue(results)?.catch?.(console.warn.bind(console));
    try { controlChannel.postMessage({ type: 'pending-write' }); } catch (e) { console.warn(e); }

    // @ts-ignore
    const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
    if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results });

    //
    return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } });
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
