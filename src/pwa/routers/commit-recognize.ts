import { registerRoute } from "workbox-routing";
import { controlChannel, DOC_DIR, initiateAnalyzeAndRecognizeData, isMarkdown } from "./shared";
import { pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";

//
export const makeCommitRecognize = () => {

    //
    return registerRoute(({ url }) => url?.pathname == "/commit-recognize", async (e: any) => {
        const meantime = Promise.try(async () => {
            //const url = new URL(e.request.url);
            const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
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
                        (await fetch(source)
                            ?.then?.((res) => res.text())
                            ?.catch?.(console.warn.bind(console)) || ""));

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
            try { controlChannel.postMessage({ type: 'commit-result', results: results as any[] }) } catch (e) { console.warn(e); }

            //
            return results;
        })?.catch?.(console.warn.bind(console));

        //
        return new Response(JSON.stringify(await meantime?.catch?.(console.warn.bind(console))?.then?.(rs=>{ console.log('recognize results', rs); return rs; })), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }, "POST")
}
