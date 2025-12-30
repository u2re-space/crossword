import { registerRoute } from "workbox-routing";
import { controlChannel, detectInputType, initiateConversionProcedure, tryToTimeout, callBackendIfAvailable, getActiveCustomInstruction } from "./shared";
import { detectEntityTypeByJSON } from "@rs-core/template/EntityUtils";
import { queueEntityForWriting } from "@rs-core/service/AI-ops/ServiceHelper";
import { pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";
import { JSOX } from "jsox";

//
export const commitAnalyze = (e: any) => {
    return Promise.try(async () => {
        //const url = new URL(e.request.url);
        const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
        const inputs = {
            title: fd.get('title'),
            text: fd.get('text'),
            url: fd.get('url'),
            files: fd.getAll('files'), // File[]
            customInstruction: fd.get('customInstruction') as string
        };

        // Use custom instruction from form data, or load from settings if not provided
        let customInstruction = inputs.customInstruction?.trim?.() || "";
        if (!customInstruction) {
            customInstruction = await getActiveCustomInstruction();
        }
        console.log("[commit-analyze] Custom instruction:", customInstruction ? `"${customInstruction.substring(0, 50)}..."` : "(none)", inputs.customInstruction ? "(from form)" : "(from settings)");

        // Endpoint mode shortcut - pass custom instruction to backend
        const backendResponse = await callBackendIfAvailable<{ ok?: boolean; results?: any[] }>("/core/ai/analyze", {
            title: inputs.title,
            text: inputs.text,
            url: inputs.url,
            customInstruction: customInstruction || undefined
        });
        if (backendResponse?.ok && Array.isArray(backendResponse.results)) {
            await pushToIDBQueue(backendResponse.results)?.catch?.(console.warn.bind(console));
            tryToTimeout(() => {
                try { controlChannel.postMessage({ type: 'commit-result', results: backendResponse.results as any[] }) } catch (e) { console.warn(e); }
            }, 100);
            return backendResponse.results;
        }

        //
        const files: any[] = (Array.isArray(inputs.files) && inputs.files.length) ? inputs.files : [inputs?.text || inputs?.url || null];
        const results: any[] = [];

        //
        for (const file of files) {
            const source = file || ((inputs?.text?.trim?.() || inputs?.url?.trim?.())?.trim?.() || null);
            if (!source) continue;

            // Extract text content based on source type
            let text: string = "";
            let isImage = false;

            //
            if (source instanceof File || source instanceof Blob) {
                // Check if it's an image first
                if (source.type?.startsWith?.("image/")) {
                    isImage = true;
                } else {
                    text = await source.text?.()?.catch?.(() => "") || "";
                }
            } else if (typeof source === "string") {
                if (source == (inputs?.text?.trim?.() || null)) {
                    text = source;
                } else if (URL.canParse(source?.trim?.() || "", typeof (typeof window != "undefined" ? window : globalThis)?.location == "undefined" ? undefined : ((typeof window != "undefined" ? window : globalThis)?.location?.origin || ""))) {
                    // It's a URL - try to fetch content
                    text = await fetch(source)
                        ?.then?.((res) => res.text())
                        ?.catch?.(() => "") || "";
                } else {
                    text = source;
                }
            }

            // Detect input type with comprehensive analysis
            const detection = detectInputType(text?.trim?.() || null, source);
            console.log("[commit-recognize] Detection result:", {
                type: detection.type,
                confidence: detection.confidence,
                needsAI: detection.needsAI,
                hints: detection.hints
            });

            //
            if (text?.trim?.() && detection.type === "json" && detection.confidence >= 0.7) {
                let json: any = text?.trim?.() && typeof text == "string" ? JSOX.parse(text?.trim?.() || "[]") as any : [];
                json = json?.entities || json;

                // detect entity types by JSON
                let types = json ? detectEntityTypeByJSON(json) : [];
                if (types != null && types?.length && types?.filter?.((type) => (type && type != "unknown"))?.length) {
                    json?.map?.((entity, i) => {
                        const type = types[i];
                        if (type && type != "unknown") results.push(queueEntityForWriting(entity, type, "json"));
                    });
                    continue;
                }
            }

            //
            try {
                // Pass custom instruction to conversion procedure
                const resultsRaw = await initiateConversionProcedure(text?.trim?.() || source, customInstruction || undefined);
                resultsRaw?.entities?.forEach((entity) => {
                    results.push(queueEntityForWriting(entity, entity?.type, "json"));
                });
            } catch (err) {
                results.push({ status: 'error', error: String(err) });
            }
        }

        //
        await pushToIDBQueue(results)?.catch?.(console.warn.bind(console));

        // needs to delay to make sure the results are pushed to the IDB queue
        tryToTimeout(() => {
            try { controlChannel.postMessage({ type: 'commit-result', results: results as any[] }) } catch (e) { console.warn(e); }
        }, 100);

        //
        return results;
    })?.catch?.(console.warn.bind(console));
}

//
export const makeCommitAnalyze = () => {
    return registerRoute(({ url }) => url?.pathname == "/commit-analyze", async (e: any) => {
        return new Response(JSON.stringify(await commitAnalyze?.(e)?.then?.(rs=>{ console.log('analyze results', rs); return rs; })?.catch?.(console.warn.bind(console))), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }, "POST")
}
