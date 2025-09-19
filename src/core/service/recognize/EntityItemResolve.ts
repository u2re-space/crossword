import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';
import { safe } from "fest/object";

//
const makeRelatedListPerEntity = (entityKind: any, entityType: any) => {
    const items: any[] = [];
    const itemsOfInEntities: any[] = [];
    const itemsOfForEntities: any[] = [];
    return `{
        existing: ${JSON.stringify(safe(items?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))))},
        inEntities: ${JSON.stringify(safe(itemsOfInEntities?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))))},
        forEntities: ${JSON.stringify(safe(itemsOfForEntities?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))))}
    }`;
}

//
export const resolveEntity = async (entityTypes: any[], entityKinds: any[], gptResponses: GPTResponses) => {
    // - get entity type items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === entityType)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.forEntity)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.inEntity)`
    // from items caches...

    //
    const shortlistOfItems = [`=== BEGIN:PREPARE_RELATED_ITEMS ===
Shortlist of existing items in ${JSON.stringify(entityTypes)} registry.

And related entities, for making compatible resolve:
\`\`\`json
${JSON.stringify(entityTypes?.map?.((entityType, index) => {
    const relatedList: any[] = [];
    for (const entityKind of entityKinds?.[index]?.kinds ?? []) {
        relatedList.push(makeRelatedListPerEntity(entityKind || "", entityType?.entityType ?? "unknown"))
    }
    return relatedList
}) ?? [])}
\`\`\`
=== END:PREPARE_RELATED_ITEMS ===`];

    //
    const resolveStep = [
        ...shortlistOfItems,
        "", `${ABOUT_NAME_ID_GENERATION}`,
        "", "",
        "=== BEGIN:EXPLAIN_TYPES ===",
        "Shared Defs Declared:",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "=== END:EXPLAIN_TYPES ===",
        "", "",
        "=== BEGIN:RESOLVE_STEP ===",
        "# Request: ",
        "Search potential duplicates for give possible merge decision.",
        "Also, search potentially related items (names, IDs)...",
        "Resolve entity items, by following schemes (according of entity types): ",
        `\`\`\`json
${JSON.stringify(
            entityTypes?.map?.((entityType) => {
                return Object.entries(JSON_SCHEMES.$entities)
                    ?.filter?.((entity) => (entityType?.entityType ?? "unknown") == (entity?.[0] ?? "unknown"))
                    ?.map?.((entity) => entity?.[1] ?? {}) ?? [];
            }) ?? [],
            null, 2)}
\`\`\``, "=== END:RESOLVE_STEP ===",
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    await gptResponses.askToDoAction(resolveStep?.join?.("\n"));
    const parsed = JSON.parse(await gptResponses.sendRequest() || "[]");
    console.log("resolve entity response", parsed);
    return parsed;
}
