import { GPTConversion } from "@rs-core/service/model/GPT-Responses";
import { recognizeEntityType } from "@rs-core/service/recognize/EntityTypeDetect";
import { recognizeKindOfEntity } from "@rs-core/service/recognize/KindOfEntity";
import { resolveEntity } from "@rs-core/service/recognize/EntityItemResolve";
import { idbStorage } from "./lib/idbQueue";
import { dataCategories } from "@rs-core/service/Cache";

// TODO! needs to debug completely and complex and make it more robust
const initiateConversionProcedure = async (dataSource: string|Blob|File|any)=>{
    const gptConversion = new GPTConversion();

    // phase 1 - recognize entity type
    let entityTypes: any[] = (await recognizeEntityType(dataSource, gptConversion)) || "unknown";

    // phase 2 - recognize kind of entity
    let entityKinds: any[] = (await recognizeKindOfEntity(entityTypes, gptConversion)) || "unknown";

    // phase 3 - convert data to target format
    const resultEntity = await resolveEntity(entityTypes, entityKinds, gptConversion);
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
                const resultEntities = await initiateConversionProcedure(inputs?.files?.[0] || inputs?.text || inputs?.url);
                resultEntities.forEach((resultEntity) => {

                    // pending fs write (OPFS)
                    idbStorage.put("pending-fs-write_" + entityType + "_" + (JSON.parse(resultEntity)?.desc?.name || Date.now().toString()), resultEntity);

                    // update categories with new item
                    (dataCategories as any)?.find?.((category) => category?.id === entityType)?.items?.push(resultEntity?.desc?.name);
                });

                // @ts-ignore
                const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
                if (clientsArr?.length) clientsArr[0]?.postMessage?.({ entityType, resultEntities });

                // TODO: correct status by GPT response
                return new Response(JSON.stringify(resultEntities, null, 2), {
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
