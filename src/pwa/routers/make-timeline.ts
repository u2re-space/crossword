import { registerRoute } from "workbox-routing";
import { controlChannel } from "./shared";
import { handleMakeTimeline } from "@rs-core/service/AI-ops/Orchestrator";

export const makeTimeline = () => {
    return registerRoute(({ url }) => url?.pathname == "/make-timeline", async (e: any) => {
        const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
        const source = fd?.get?.('source') as string || null;

        const { ok, results, error } = await handleMakeTimeline(source);

        if (results.length > 0) {
             try { controlChannel.postMessage({ type: 'pending-write' }); } catch (e) { console.warn(e); }
             
             // @ts-ignore
            const clientsArr = await clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
            if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results })?.catch?.(console.warn.bind(console));
        }

        return new Response(JSON.stringify({ ok, results, error }, null, 2), { 
            status: ok ? 200 : 500, 
            statusText: ok ? 'OK' : 'Error', 
            headers: { 'Content-Type': 'application/json' } 
        });
    }, "POST");
}
