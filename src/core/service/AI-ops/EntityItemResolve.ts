/*
 * Available on Service Workers.
 * Stage 3: Resolve entity items, by following schemes (according of entity types).
 * Also may be used MCP servers and WebSearch for more detailed information.
 */

//
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";

// @ts-ignore
import AI_OUTPUT_SCHEMA from "@rs-core/template/Entities-v2.md?raw";
import { fixEntityId } from "@rs-core/template/EntityId";

//
export const resolveEntity = async (gptResponses: GPTResponses) => {

    //
    const askResolveStep = () => {
        return [
            "# Request: ",
            "Search potential duplicates for give possible merge decision.",
            "Also, search potentially related items (names, IDs)...",
            "Resolve entity items, by following schemes, given above.",
            "IMPORTANT: Output in JSON format, according to given schema. No any additional text or comments."
        ]?.map?.((instruction) => instruction?.trim?.());
    }

    //
    await gptResponses.giveForRequest(AI_OUTPUT_SCHEMA);
    await gptResponses.askToDoAction(askResolveStep()?.join?.("\n"));
    const parsed = JSON.parse(await gptResponses.sendRequest() || "{}");
    parsed?.entities?.forEach?.((entity: any) => fixEntityId(entity));
    console.log("Step 3 response - resolve entity response: ", parsed);
    return parsed;
}
