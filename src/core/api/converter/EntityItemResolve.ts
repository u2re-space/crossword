import type { GPTConversion } from "../endpoints/GPT-Conversion";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from "../../model/Entities";
import { safe } from "fest/object";

//
export const resolveEntity = async (entityType: any, entityKind: any, gptConversion: GPTConversion)=>{
    // - get entity type items by criteria: `categoriesCache?.find?.((category)=> category?.id === entityType)`
    // - get related items by criteria: `categoriesCache?.find?.((category)=> category?.id === usabilityKind?.forEntity)`
    // - get related items by criteria: `categoriesCache?.find?.((category)=> category?.id === usabilityKind?.inEntity)`
    // from items caches...

    // temporary items
    const items: any[] = [];
    const itemsOfInEntities: any[] = [];
    const itemsOfForEntities: any[] = [];

    //
    const shortlistOfItems = [`=== BEGIN:PREPARE_RELATED_ITEMS ===
Shortlist of existing items in ${entityType} registry and related entities, for making compatible resolve:

\`\`\`json
{
    existing: ${JSON.stringify(safe(items?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)},
    inEntities: ${JSON.stringify(safe(itemsOfInEntities?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)},
    forEntities: ${JSON.stringify(safe(itemsOfForEntities?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)}
}
\`\`\`
=== END:PREPARE_RELATED_ITEMS ===`];

    //
    const resolveStep = [
        ...shortlistOfItems,
        "", `${ABOUT_NAME_ID_GENERATION}`, "",
        "",
        "=== BEGIN:PREPARE_DATA ===",
        "Shared Defs Declared:",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "=== END:PREPARE_DATA ===",
        "", "",
        "=== BEGIN:RESOLVE_STEP ===",
        "Request: resolve entity item, by following scheme: ",
        `\`\`\`json
${JSON.stringify(safe(JSON_SCHEMES.$entities?.[entityType]), null, 2)}
\`\`\``,
        "Search potential duplicates for give possible merge decision.",
        "Also, search potentially related items (names, IDs)...",
        "=== END:RESOLVE_STEP ===",
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    const response = await gptConversion.askToDoAction(resolveStep?.join?.("\n"));
    return JSON.parse(response?.content);
}
