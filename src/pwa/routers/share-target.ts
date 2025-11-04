import { registerRoute } from "workbox-routing";
import { controlChannel, initiateConversionProcedure } from "./shared";
import { detectEntityTypeByJSON } from "@rs-core/template/EntityUtils";
import { queueEntityForWriting } from "@rs-core/service/AI-ops/ServiceHelper";
import { pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";

//
export const makeShareTarget = ()=>{

    //
    return registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
        const url = new URL(e.request.url);
        const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
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
                    (await fetch(source)
                        ?.then?.((res) => res.text())
                        ?.catch?.(console.warn.bind(console)) || ""));

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
        try { controlChannel.postMessage({ type: 'pending-write' }) } catch (e) { console.warn(e); }

        // @ts-ignore
        const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
        if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results })?.catch?.(console.warn.bind(console));

        //
        return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } });
    }, "POST")
}
