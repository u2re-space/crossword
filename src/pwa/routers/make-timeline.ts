import { registerRoute } from "workbox-routing";
import { controlChannel } from "./shared";
import { handleMakeTimeline } from "@rs-core/service/AI-ops/Orchestrator";

//
export const makeTimeline = () => {
    return registerRoute(({ url }) => url?.pathname == "/make-timeline", async (e: any) => {
        const meantime = Promise.try(async () => {
            const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
            const source = fd?.get?.('source') as string || null;

            //
            const results: any = await handleMakeTimeline(source);

            //
            if (results?.length > 0) {
                try { controlChannel.postMessage({ type: 'pending-write' }); } catch (e) { console.warn(e); }

                // @ts-ignore
                const clientsArr = await (clients as any)?.matchAll?.({ type: 'window', includeUncontrolled: true })?.catch?.(console.warn.bind(console));
                if (clientsArr?.length) clientsArr[0]?.postMessage?.({ type: 'share-result', results })?.catch?.(console.warn.bind(console));
            }

            //
            return results;
        })?.catch?.(console.warn.bind(console))?.then?.((rs)=>{ console.log('timeline results', rs); return rs; });

        //
        return new Response(null, { status: 302, headers: { Location: '/' } });
    }, "POST");
}
