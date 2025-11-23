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
            const speechPrompt = fd?.get?.('text')?.toString?.()?.trim?.() || null;
            const results: any = await handleMakeTimeline(source, speechPrompt);

            //
            if (results?.length > 0) {
                try { controlChannel.postMessage({ type: 'commit-result', results: [results] as any[] }) } catch (e) { console.warn(e); }
            }

            //
            return results;
        })?.catch?.(console.warn.bind(console));

        //
        return new Response(JSON.stringify(await meantime?.catch?.(console.warn.bind(console))?.then?.(rs=>{ console.log('timeline results', rs); return rs; })), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }, "POST");
}
