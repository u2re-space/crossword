import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';
import { safe } from "fest/object";

//
const makeRelatedListPerEntity = (entityKind: any, entityType: any) => {
    const items: any[] = [];
    const itemsOfInEntities: any[] = [];
    const itemsOfForEntities: any[] = [];
    return `{
        existing: ${JSON.stringify(safe(items?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)},
        inEntities: ${JSON.stringify(safe(itemsOfInEntities?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)},
        forEntities: ${JSON.stringify(safe(itemsOfForEntities?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)}
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
Shortlist of existing items in ${entityTypes?.join?.(", ")} registry and related entities, for making compatible resolve:

\`\`\`json
[${entityTypes?.map((entityType, index) => makeRelatedListPerEntity(entityKinds?.[index] || "", entityType))?.join?.(",") || ""}]
\`\`\`
=== END:PREPARE_RELATED_ITEMS ===`];

    //
    const resolveStep = [
        ...shortlistOfItems,
        "", `${ABOUT_NAME_ID_GENERATION}`,
        "", "",
        "=== BEGIN:PREPARE_DATA ===",
        "Shared Defs Declared:",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "=== END:PREPARE_DATA ===",
        "", "",
        "=== BEGIN:RESOLVE_STEP ===",
        "Request: resolve entity items, by following schemes (according of entity types): ",
        `\`\`\`json
[...${JSON.stringify(safe(JSON_SCHEMES.$entities), null, 2)}]
\`\`\``,
        "Search potential duplicates for give possible merge decision.",
        "Also, search potentially related items (names, IDs)...",
        "=== END:RESOLVE_STEP ===",
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    const response = await gptResponses.askToDoAction(resolveStep?.join?.("\n"));
    return JSON.parse(response?.content);
}
