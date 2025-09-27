/*
 * Available on Service Workers.
 * Stage 1: Recognize and analyze data source, prepare raw data for next steps.
 * Also may be used MCP servers and WebSearch for more detailed information.
 */

//
import type { GPTResponses } from '@rs-core/service/model/GPT-Responses';
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';

// for optimize images before sending to GPT
import { decode } from '@jsquash/png';
import { encode } from '@jsquash/jpeg';

// for optimize images before sending to GPT
export const convertImageToJPEG = async (image: Blob | File | any): Promise<Blob> => {
    const decoded = await decode(await image.arrayBuffer());
    const encoded = await encode(decoded, { quality: 90, progressive: false, color_space: 2, optimize_coding: true, auto_subsample: true, arithmetic: true, baseline: true });
    return new Blob([encoded], { type: 'image/jpeg' });
}

//
export const ableToShowJPEG = async (data_url: string) => { // @ts-ignore
    const bitmap: any = await createImageBitmap(new Blob([Uint8Array.fromBase64(data_url?.replace?.('data:image/jpeg;base64,', ""), { alphabet: "base64" })], { type: "image/png" }))?.catch?.(e => { console.warn(e); return null; });
    return bitmap?.width > 0 && bitmap?.height > 0;
}

//
export const recognizeEntityType = async (gptResponses: GPTResponses) => {

    //
    const explainSchemes = ["=== BEGIN:EXPLAIN_SCHEMES ===",
        "You are given a data source and you need to recognize type of entity.",
        "Recognize all possible entities (if may be multiple entities in data source).",
        "Choice most suitable entity types from following list of schemes: ",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities, null, 2)}
\`\`\``, "=== END:EXPLAIN_SCHEMES ==="]

    //
    const explainSharedTypes = [
        "=== BEGIN:EXPLAIN_SHARED_TYPES ===",
        "Shared Defs Declared:",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "=== END:EXPLAIN_SHARED_TYPES ==="
    ]

    //
    const askRequestMsg = [
        "=== BEGIN:ASK_REQUEST_MSG ===",
        "Request: Output in JSON format: \`[...{ entityType: string, potentialName: string }]\`.",
        "=== END:ASK_REQUEST_MSG ==="
    ]

    //
    const firstStep = [
        `${ABOUT_NAME_ID_GENERATION}`,
        "", "", ...explainSchemes,
        "", "", ...explainSharedTypes,
        "", "", ...askRequestMsg
    ]?.map?.((instruction) => instruction?.trim?.());

    // use same context for first step...
    await gptResponses.askToDoAction(firstStep?.join?.("\n"))
    const parsed = JSON.parse(await gptResponses.sendRequest() || "[]");
    console.log("First step response: ", parsed);
    return Array.isArray(parsed) ? parsed : [{
        "entityType": parsed?.["entityType"] || "unknown",
        "potentialName": parsed?.["potentialName"] || "unknown"
    }];
}

//
export const getEntityTypesFromObjArray = (objArray: any[]) => {
    return objArray?.map?.((obj) => obj?.entityType) || [];
}
