import { registerRoute } from "workbox-routing";
import { controlChannel } from "./shared";
import { createTimelineGenerator, requestNewTimeline } from "@rs-core/service/AI-ops/MakeTimeline";
import { queueEntityForWriting, pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";

//
export const makeTimeline = () => {
    return registerRoute(({ url }) => url?.pathname == "/make-timeline", async (e: any) => {
        const meantime = Promise.try(async () => {
            const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
            const source = fd?.get?.('source') as string || null;

            //
            const speechPrompt = fd?.get?.('text')?.toString?.()?.trim?.() || null;
            const gptResponses = await createTimelineGenerator(source, speechPrompt) as GPTResponses | null;
            const timelineResults = await requestNewTimeline(gptResponses as GPTResponses) as any[] || [];

            //
            if (timelineResults?.length > 0) {
                // Queue each timeline task for writing to OPFS
                const queuedResults = timelineResults?.map?.((task) => {
                    return queueEntityForWriting(task, task?.type || "task", "json");
                })?.filter?.(Boolean) || [];

                // Push to IDB queue for persistence
                await pushToIDBQueue(queuedResults)?.catch?.(console.warn.bind(console));

                // Notify to trigger flush
                try { controlChannel.postMessage({ type: 'commit-result', results: queuedResults }) } catch (e) { console.warn(e); }
            }

            //
            return timelineResults;
        })?.catch?.(console.warn.bind(console));

        //
        return new Response(JSON.stringify(await meantime?.catch?.(console.warn.bind(console))?.then?.(rs=>{ console.log('timeline results', rs); return rs; })), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }, "POST");
}
