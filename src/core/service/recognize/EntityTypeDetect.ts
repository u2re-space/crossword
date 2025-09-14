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
export const recognizeEntityType = async (dataSource: string | Blob | File | any, gptResponses: GPTResponses) => {
    // upload dataset to GPT for recognize, and get response for analyze...
    await gptResponses.attachToRequest(dataSource);
    const rawDataset = JSON.parse(await gptResponses.sendRequest() || "[]"); // for use in first step...
    console.log("rawDataset", rawDataset);



    //
    const firstStep = [
        "", `${ABOUT_NAME_ID_GENERATION}`,
        "", "",
        "=== BEGIN:PREPARE_DATA ===",
        "Shared Defs Declared:",
        "",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "=== END:PREPARE_DATA ===",
        "", "",
        "=== BEGIN:FIRST_STEP ===",
        "You are given a data source and you need to recognize type of entity.",
        "Recognize all possible entities (if may be multiple entities in data source).",
        "Choice most suitable entity types from following list of schemes: ",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities, null, 2)}
\`\`\``,
        "",
        "Output in JSON format: \`[...{ entityType: string, potentialName: string }]\`.",
        "=== END:FIRST_STEP ===",
    ]?.map?.((instruction) => instruction?.trim?.());

    // use same context for first step...
    await gptResponses.askToDoAction(firstStep?.join?.("\n"))
    const response = JSON.parse(await gptResponses.sendRequest() || "[]");
    const $PRIMARY = response?.content;
    console.log("first step response", response);
    return $PRIMARY || [{ "entityType": "unknown" }];
}

//
export const getEntityTypesFromObjArray = (objArray: any[]) => {
    return objArray?.map?.((obj) => obj?.entityType) || [];
}
