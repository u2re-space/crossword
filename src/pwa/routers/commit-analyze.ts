import { registerRoute } from "workbox-routing";
import { controlChannel, detectInputType, initiateConversionProcedure, tryToTimeout, callBackendIfAvailable, getActiveCustomInstruction } from "./shared";
import { detectEntityTypeByJSON } from "@rs-core/template/EntityUtils";
import { queueEntityForWriting, pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";
import { tryParseJSON } from "@rs-core/utils/AIResponseParser";
import { fileToDataUrl, isProcessableImage, isImageDataUrl } from "../lib/ImageUtils";

//
export const commitAnalyze = (e: any): Promise<any[] | void> => {
    return Promise.try(async () => {
        const fd = await e.request.formData()?.catch?.(console.warn.bind(console));
        if (!fd) {
            console.warn("[commit-analyze] Failed to parse FormData");
            return [];
        }

        const inputs = {
            title: String(fd.get('title') || '').trim(),
            text: String(fd.get('text') || '').trim(),
            url: String(fd.get('url') || '').trim(),
            files: fd.getAll('files') as File[],
            customInstruction: String(fd.get('customInstruction') || '').trim()
        };

        console.log("[commit-analyze] Inputs received:", {
            title: inputs.title || '(none)',
            text: inputs.text?.substring(0, 50) || '(none)',
            url: inputs.url || '(none)',
            filesCount: inputs.files?.length || 0,
            files: inputs.files?.map(f => ({ name: f?.name, type: f?.type, size: f?.size }))
        });

        // Use custom instruction from form data, or load from settings if not provided
        const customInstruction: string = inputs.customInstruction || (await getActiveCustomInstruction()) || "";
        console.log("[commit-analyze] Custom instruction:", customInstruction ? `"${customInstruction.substring(0, 50)}..."` : "(none)");

        // Endpoint mode shortcut - pass custom instruction to backend
        const backendResponse = await callBackendIfAvailable<{ ok?: boolean; results?: any[] }>("/core/ai/analyze", {
            title: inputs.title,
            text: inputs.text,
            url: inputs.url,
            customInstruction
        });

        if (backendResponse?.ok && Array.isArray(backendResponse.results)) {
            await pushToIDBQueue(backendResponse.results)?.catch?.(console.warn.bind(console));
            tryToTimeout(() => {
                try { controlChannel.postMessage({ type: 'commit-result', results: backendResponse.results as any[] }) } catch (e) { console.warn(e); }
            }, 100);
            return backendResponse.results;
        }

        // Build list of sources to process
        const sources: Array<{ source: File | string; isImage: boolean; fileName?: string }> = [];

        // Add files first
        if (inputs.files?.length > 0) {
            for (const file of inputs.files) {
                if (file instanceof File && file.size > 0) {
                    sources.push({
                        source: file,
                        isImage: isProcessableImage(file),
                        fileName: file.name
                    });
                }
            }
        }

        // Add text/url as fallback if no files
        if (sources.length === 0) {
            const textOrUrl = inputs.text || inputs.url;
            if (textOrUrl) {
                sources.push({
                    source: textOrUrl,
                    isImage: false
                });
            }
        }

        if (sources.length === 0) {
            console.log("[commit-analyze] No sources to process");
            return [];
        }

        const results: any[] = [];

        for (const { source, isImage, fileName } of sources) {
            try {
                let dataToProcess: string | File | Blob;
                let text = '';

                if (source instanceof File || source instanceof Blob) {
                    if (isImage) {
                        // For images, convert to data URL for GPT vision API
                        console.log("[commit-analyze] Processing image:", fileName);
                        dataToProcess = await fileToDataUrl(source);
                    } else {
                        // For non-image files, extract text content
                        text = await source.text?.()?.catch?.(() => "") || "";
                        dataToProcess = text;
                    }
                } else if (typeof source === 'string') {
                    // Check if it's a data URL (image)
                    if (isImageDataUrl(source)) {
                        dataToProcess = source;
                    } else if (URL.canParse(source, globalThis?.location?.origin || undefined)) {
                        // It's a URL - fetch content
                        text = await fetch(source).then(res => res.text()).catch(() => "");
                        dataToProcess = text || source;
                    } else {
                        text = source;
                        dataToProcess = source;
                    }
                } else {
                    continue;
                }

                // Detect input type for non-image content
                const detection = isImage
                    ? { type: 'image' as const, confidence: 0.99, needsAI: true, hints: ['image file'] }
                    : detectInputType(text || null, source instanceof File ? source : null);

                console.log("[commit-analyze] Detection result:", {
                    type: detection.type,
                    confidence: detection.confidence,
                    needsAI: detection.needsAI,
                    isImage
                });

                // Try to process JSON directly without AI
                if (text?.trim() && detection.type === "json" && detection.confidence >= 0.7) {
                    let json: any = tryParseJSON<any>(text.trim());
                    json = json?.entities || json?.data || json?.result || json;

                    if (Array.isArray(json)) {
                        const types = detectEntityTypeByJSON(json);
                        const validTypes = types?.filter((type: string) => type && type !== "unknown");

                        if (validTypes?.length > 0) {
                            json.forEach((entity: any, i: number) => {
                                const type = types[i];
                                if (type && type !== "unknown") {
                                    results.push(queueEntityForWriting(entity, type, "json"));
                                }
                            });
                            continue;
                        }
                    }
                }

                // Pass to conversion procedure (handles images via AI)
                console.log("[commit-analyze] Sending to AI for entity extraction...");
                const resultsRaw = await initiateConversionProcedure(
                    isImage ? (dataToProcess as string) : (text?.trim() || dataToProcess),
                    customInstruction
                );

                if (resultsRaw?.entities?.length > 0) {
                    resultsRaw.entities.forEach((entity: any) => {
                        results.push(queueEntityForWriting(entity, entity?.type || 'unknown', "json"));
                    });
                } else {
                    console.log("[commit-analyze] No entities extracted from source:", fileName || '(text)');
                }
            } catch (err) {
                console.error("[commit-analyze] Processing error:", err);
                results.push({ status: 'error', error: String(err) });
            }
        }

        // Persist and broadcast results
        await pushToIDBQueue(results)?.catch?.(console.warn.bind(console));

        tryToTimeout(() => {
            try {
                controlChannel.postMessage({ type: 'commit-result', results });
            } catch (e) { console.warn(e); }
        }, 100);

        return results;
    })?.catch?.((error) => {
        console.error("[commit-analyze] Fatal error:", error);
        return [];
    });
}

//
export const makeCommitAnalyze = () => {
    return registerRoute(({ url }) => url?.pathname == "/commit-analyze", async (e: any) => {
        return new Response(JSON.stringify(await commitAnalyze?.(e)?.then?.(rs=>{ console.log('analyze results', rs); return rs; })?.catch?.(console.warn.bind(console))), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }, "POST")
}
