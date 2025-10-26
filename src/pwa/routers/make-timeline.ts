import { pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";
import { registerRoute } from "workbox-routing";
import { controlChannel } from "./shared";
import { createTimelineGenerator, requestNewTimeline } from "@rs-core/service/AI-ops/MakeTimeline";
import { queueEntityForWriting } from "@rs-core/service/AI-ops/ServiceHelper";

//
let timelineGenerator: any = null;

//
export const makeTimeline = ()=>{

    //
    return registerRoute(({ url }) => url?.pathname == "/make-timeline", async (e: any) => {
        const url = new URL(e.request.url);
        const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
        const inputs = {
            source: fd?.get?.('source')
        };

        //
        timelineGenerator ||= await createTimelineGenerator(inputs.source)?.catch?.(console.warn.bind(console));
        console.log(timelineGenerator);

        //
        const timelines = await requestNewTimeline(timelineGenerator)?.catch?.(console.warn.bind(console));
        console.log(timelines);

        //
        const results: any[] = [];
        timelines?.forEach?.((timeline) => {
            results.push(queueEntityForWriting(timeline, "task", "json"));
        });

        //
        await pushToIDBQueue(results)?.catch?.(console.warn.bind(console));
        try { controlChannel.postMessage({ type: 'pending-write' }); } catch (e) { console.warn(e); }

        // @ts-ignore
        const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
        if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results })?.catch?.(console.warn.bind(console));

        //
        return new Response(JSON.stringify({ ok: true, results }, null, 2), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } });
    }, "POST");
}