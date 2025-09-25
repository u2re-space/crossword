import { getShortFormFromEntities } from "@rs-core/service/Cache";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';
import { safe } from "fest/object";
import { readJSONs } from "@rs-core/workers/FileSystem";

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

function deepMergeObj(target: any, source: any): any {
    const output = { ...target }; // Start with a shallow copy of the target
    if (target && typeof target === 'object' && source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                // If the source property is an object (and not an array), recurse
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] }); // Add new nested object if it doesn't exist in target
                } else {
                    output[key] = deepMergeObj(output[key], source[key]);
                }
            } else {
                // Otherwise, directly assign the value
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

// needs to deep merge desc, properties, contacts, phones, email...
const deepMergeExistsAndPotential = (exists: any, potential: any): any => {
    return deepMergeObj(exists, potential);
}

//
export const resolveEntity = async (entityTypes: any[], entityKinds: any[], gptResponses: GPTResponses, potentialNames?: string[]) => {
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
${JSON.stringify(await getShortFormFromEntities(entityTypes), null, 2)}
\`\`\``, "=== END:RESOLVE_STEP ===",
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    await gptResponses.askToDoAction(resolveStep?.join?.("\n"));
    const parsed = JSON.parse(await gptResponses.sendRequest() || "{}");
    console.log("resolve entity response", parsed);

    // additional phase - merge from duplicates
    let i = 0;
    for (const entityType of entityTypes) {
        const potentialName = potentialNames?.[i++];
        const exists = (await readJSONs(`/data/${entityType}/`))?.find?.((json: any) => (json?.desc?.name == potentialName));
        parsed[i] = deepMergeExistsAndPotential?.(parsed[i], exists) ?? parsed[i];
    }
    return parsed;
}
