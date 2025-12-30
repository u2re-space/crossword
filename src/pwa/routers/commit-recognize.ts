import { registerRoute } from "workbox-routing";
import {
    controlChannel,
    DOC_DIR,
    initiateAnalyzeAndRecognizeData,
    detectInputType,
    getExtensionForType,
    tryToTimeout,
    type DetectedDataType,
    callBackendIfAvailable,
    getActiveCustomInstruction
} from "./shared";
import { pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";

//
export const commitRecognize = (e: any) => {
    return Promise.try(async () => {
        const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
        const inputs = {
            title: fd.get('title'),
            text: fd.get('text'),
            url: fd.get('url'),
            files: fd.getAll('files'), // File[]
            targetDir: fd.get('targetDir'),
            customInstruction: fd.get('customInstruction') as string
        };

        // Use custom instruction from form data, or load from settings if not provided
        let customInstruction = inputs.customInstruction?.trim?.() || "";
        if (!customInstruction) {
            customInstruction = await getActiveCustomInstruction();
        }
        console.log("[commit-recognize] Custom instruction:", customInstruction ? `"${customInstruction.substring(0, 50)}..."` : "(none)", inputs.customInstruction ? "(from form)" : "(from settings)");

        // Endpoint mode shortcut - pass custom instruction to backend
        const backendResponse = await callBackendIfAvailable<{ ok?: boolean; results?: any[] }>("/core/ai/recognize", {
            title: inputs.title,
            text: inputs.text,
            url: inputs.url,
            targetDir: inputs.targetDir,
            customInstruction: customInstruction || undefined
        });
        if (backendResponse?.ok && Array.isArray(backendResponse.results)) {
            await pushToIDBQueue(backendResponse.results)?.catch?.(console.warn.bind(console));
            tryToTimeout(() => {
                try { controlChannel.postMessage({ type: 'commit-to-clipboard', results: backendResponse.results as any[] }) } catch (e) { console.warn(e); }
            }, 100);
            return backendResponse.results;
        }

        //
        const files: any[] = (Array.isArray(inputs.files) && inputs.files.length) ? inputs.files : [(inputs?.text?.trim?.() || inputs?.url?.trim?.())?.trim?.() || null];
        const results: any[] = [];

        //
        for (const file of files) {
            const source = file || ((inputs?.text?.trim?.() || inputs?.url?.trim?.())?.trim?.() || null);
            if (!source) continue;

            // Extract text content based on source type
            let text: string = "";
            let isImage = false;

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

            const subId = Date.now();
            const directory = inputs?.targetDir || DOC_DIR;

            // Process based on detected type and AI requirement
            if (!detection.needsAI && detection.confidence >= 0.7) {
                // High confidence detection - process without AI
                const ext = getExtensionForType(detection.type);
                const name = `pasted-${subId}${ext}`;
                const path = `${directory}${name}`;

                // Format data based on type
                let processedData = text;
                if (detection.type === "json") {
                    try {
                        // Pretty-print JSON for readability
                        processedData = JSON.stringify(JSON.parse(text?.trim?.() || "[]"), null, 2);
                    } catch { /* keep original */ }
                }

                results.push({
                    status: 'queued',
                    data: processedData,
                    path,
                    name,
                    subId,
                    directory,
                    dataType: detection.type,
                    detection: {
                        confidence: detection.confidence,
                        hints: detection.hints
                    }
                });
                continue;
            }

            // Needs AI processing (low confidence or complex type)
            try {
                // Pass custom instruction to AI recognition
                const $recognizedData = await initiateAnalyzeAndRecognizeData(
                    isImage ? source : (text?.trim?.() || source),
                    customInstruction || undefined
                );

                // Determine final data type from AI response or detection
                const finalType: DetectedDataType = $recognizedData?.ok
                    ? (detection.type !== "unknown" ? detection.type : "markdown")
                    : detection.type;

                const ext  = getExtensionForType(finalType);
                const name = `pasted-${subId}${ext}`;
                const path = `${directory}${name}`;

                results.push({
                    status: $recognizedData?.ok ? 'queued' : 'error',
                    error: $recognizedData?.error,
                    directory,
                    data: $recognizedData?.data,
                    path,
                    name,
                    subId,
                    dataType: finalType,
                    detection: {
                        originalType: detection.type,
                        confidence: detection.confidence,
                        hints: detection.hints,
                        aiProcessed: true
                    }
                });
            } catch (err) {
                results.push({
                    status: 'error',
                    error: String(err),
                    subId,
                    dataType: detection.type,
                    detection
                });
            }
        }

        //
        await pushToIDBQueue(results)?.catch?.(console.warn.bind(console));

        // needs to delay to make sure the results are pushed to the IDB queue
        tryToTimeout(() => {
            try { controlChannel.postMessage({ type: 'commit-to-clipboard', results: results as any[] }) } catch (e) { console.warn(e); }
        }, 100);

        //
        return results;
    })?.catch?.(console.warn.bind(console));
}

//
export const makeCommitRecognize = () => {
    return registerRoute(({ url }) => url?.pathname == "/commit-recognize", async (e: any) => {
        return new Response(JSON.stringify(await commitRecognize?.(e)?.then?.(rs=>{ console.log('recognize results', rs); return rs; })?.catch?.(console.warn.bind(console))), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }, "POST")
}
