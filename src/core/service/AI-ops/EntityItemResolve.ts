/*
 * Available on Service Workers.
 * Stage 3: Resolve entity items, by following schemes (according of entity types).
 * Also may be used MCP servers and WebSearch for more detailed information.
 */

//
import type { GPTResponses } from "../model/GPT-Responses.ts";

import { loadEntitiesSchemaMarkdown } from "../../template/EntitiesSchema.ts";
import { fixEntityId } from "../../template/EntityId.ts";
import { JSOX } from "jsox";

//
export const resolveEntity = async (gptResponses: GPTResponses | null = null) => {
    const askResolveStep = () => {
        return [
            "# Request: resolve best to match entities by their types and IDs (merge if possible).", "",
            "Search potential duplicates and merge them if possible (choice is best to match for entities).",
            "Also, search potentially related items (IDs), for discounts, promo-codes, etc. if exists.",
            "Resolve entity items, by following schemes, given above.",
            "IMPORTANT: Output in JSON format, according to given schema. No any additional text or comments."
        ]?.map?.((instruction) => instruction?.trim?.());
    }

    //
    const schema = await loadEntitiesSchemaMarkdown();
    if (schema) await gptResponses?.giveForRequest?.(schema);
    await gptResponses?.askToDoAction?.(askResolveStep()?.join?.("\n"));
    const parsed = JSOX.parse(await gptResponses?.sendRequest?.("low", "low") || "{}") as unknown as { entities: any[], keywords: string[], short_description: string };
    parsed?.entities?.forEach?.((entity: any) => fixEntityId(entity));
    console.log("Step 3 response - resolve entity response: ", parsed);
    return parsed;
}
