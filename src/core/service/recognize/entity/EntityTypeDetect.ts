/*
 * Available on Service Workers.
 * Stage 1: Recognize and analyze data source, prepare raw data for next steps.
 * Also may be used MCP servers and WebSearch for more detailed information.
 */

//
import type { GPTResponses } from '@rs-core/service/model/GPT-Responses';
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/template/Entities';

//
export const recognizeEntityType = async (gptResponses: GPTResponses) => {

    //
    const explainSchemes = ["=== BEGIN:EXPLAIN_SCHEMES ===",
        "You are given a data source and you need to recognize type of entity.",
        "Recognize all possible entities (if may be multiple entities in data source).",
        "Choice most suitable entity types from following list of schemes: ",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities, null, 2)}
\`\`\``, "=== END:EXPLAIN_SCHEMES ==="]?.map?.((instruction) => instruction?.trim?.());

    //
    const explainSharedTypes = [
        "=== BEGIN:EXPLAIN_SHARED_TYPES ===",
        "Shared Defs Declared:",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "=== END:EXPLAIN_SHARED_TYPES ==="
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    const askRequestMsg = [
        "=== BEGIN:ASK_REQUEST_MSG ===",
        "Request: Output in JSON format: \`[...{ entityType: string, potentialName: string }]\`.",
        "=== END:ASK_REQUEST_MSG ==="
    ]?.map?.((instruction) => instruction?.trim?.());

    // use same context for first step...
    await gptResponses.giveForRequest(ABOUT_NAME_ID_GENERATION);
    await gptResponses.giveForRequest(explainSchemes?.join?.("\n"));
    await gptResponses.giveForRequest(explainSharedTypes?.join?.("\n"));
    await gptResponses.askToDoAction(askRequestMsg?.join?.("\n"))
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
