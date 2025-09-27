/*
 * Available on Service Workers.
 * Stage 3: Resolve entity items, by following schemes (according of entity types).
 * Also may be used MCP servers and WebSearch for more detailed information.
 */

//
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';
import { safe } from "fest/object";
import type { BonusEntity, EntityDesc } from "@rs-core/service/template/EntitiesTyped";

//
export const resolveEntity = async (
    entityDesc: EntityDesc[],
    entityKinds: BonusEntity[],
    gptResponses: GPTResponses
) => {
    // - get entity type items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === entityType)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.forEntity)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.inEntity)`
    // from items caches...

    //
    const preloadShortNames = () => {
        return JSON.stringify(
            safe(
                (entityDesc || [])
                    ?.map?.(({ entityType }) => {
                        return [...Object.entries(JSON_SCHEMES.$entities)]
                            ?.filter?.((entity) => (entityType ?? "unknown") == (entity?.[0] ?? "unknown"))
                            ?.map?.((entity) => entity?.[1] ?? {}) ?? [];
                    }) ?? [])
            ?? [], null, 2)
    }

    //
    const explainTypes = () => {
        return [
            "=== BEGIN:EXPLAIN_TYPES ===",
            "Shared Defs Declared:",
            `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
            "=== END:EXPLAIN_TYPES ===",
        ]
    }

    //
    const askResolveStep = () => {
        return [
            "=== BEGIN:RESOLVE_STEP ===",
            "# Request: ",
            "Search potential duplicates for give possible merge decision.",
            "Also, search potentially related items (names, IDs)...",
            "Resolve entity items, by following schemes (according of entity types): ",
            `\`\`\`json
${preloadShortNames()}
\`\`\``, "=== END:RESOLVE_STEP ==="
        ]
    }

    //
    /*
        const howPackResolvedEntities = () => {
            return [
                "=== BEGIN:HOW_PACK_RESOLVED_ENTITIES ===",
                "Pack resolved entities into JSON format (per every entity desc, according to one of schemes, depending on entity type): ",
                `\`\`\`json
    [...(one of ${JSON.stringify(JSON_SCHEMES.$entities, null, 2)} schemes, depending on entity type)]
    \`\`\``,
                "=== END:HOW_PACK_RESOLVED_ENTITIES ==="
            ]
        }*/

    //
    const resolveStep = [
        "", "", `${ABOUT_NAME_ID_GENERATION}`,
        "", "", ...explainTypes(),
        "", "", ...askResolveStep(),
    //"", "", ...howPackResolvedEntities(),
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    await gptResponses.askToDoAction(resolveStep?.join?.("\n"));
    const parsed = JSON.parse(await gptResponses.sendRequest() || "{}");
    console.log("Step 3 response - resolve entity response: ", parsed);
    return parsed;
}
