import { getShortFormFromEntities } from "@rs-core/service/Cache";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';
import { safe } from "fest/object";
import { readJSONs } from "@rs-core/workers/FileSystem";
import type { BonusEntity, EntityDesc } from "@rs-core/service/template/EntitiesTyped";

//
const makeRelatedListPerEntity = async (entityKind: any, shortForm: any[]) => {
    const related = shortForm?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown" || entityKind === "all"))
    return JSON.stringify(safe(related));
}

//
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
const getEntityShortFormList = async (entityKinds: BonusEntity[], entityDesc: EntityDesc[]) => {
    const shortForm = await getShortFormFromEntities(entityDesc);
    const relatedList: any[] = [];
    for (const entityKind of entityKinds) {

        // multiple
        if (Array.isArray(entityKind?.kind)) {
            relatedList.push(...(await entityKind?.kind?.map?.(async (kind) => (await makeRelatedListPerEntity(kind ?? "unknown", shortForm)))))
        } else { // single
            relatedList.push(await makeRelatedListPerEntity(entityKind?.kind ?? "unknown", shortForm))
        }
    }

    //
    return relatedList;
}

//
const getRelatedShortFormList = async (entityKinds: BonusEntity[], entityDesc: EntityDesc[]) => {
    const forEntity: any[] = [];
    const inEntity: any[] = [];

    //
    const shortForm = await getShortFormFromEntities(entityDesc);
    const handleUsabilityKind = async (usabilityKind: any, forEntity: any[], inEntity: any[]) => {
        forEntity.push(...(usabilityKind?.forEntity ?? [])?.map?.(async (kind) => (await makeRelatedListPerEntity(kind ?? "unknown", shortForm))))
        inEntity.push(...(usabilityKind?.inEntity ?? [])?.map?.(async (kind) => (await makeRelatedListPerEntity(kind ?? "unknown", shortForm))))
    }

    //
    for (const entityKind of entityKinds) {
        if (Array.isArray(entityKind?.usabilityKind)) {
            // multiple
            for (const usabilityKind of entityKind?.usabilityKind ?? []) {
                await handleUsabilityKind(usabilityKind, forEntity, inEntity)
            }
        } else {
            // single
            await handleUsabilityKind(entityKind?.usabilityKind, forEntity, inEntity)
        }
    }

    //
    return Promise.all([forEntity, inEntity])
}



//
export const resolveEntity = async (entityDesc: EntityDesc[], entityKinds: BonusEntity[], gptResponses: GPTResponses) => {
    // - get entity type items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === entityType)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.forEntity)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.inEntity)`
    // from items caches...

    //
    const shortlistOfItems = [`=== BEGIN:PREPARE_RELATED_ITEMS ===
Shortlist of existing items in registry.
\`\`\`json
${JSON.stringify(await getEntityShortFormList(entityKinds, entityDesc), null, 2)}
\`\`\`

And related entities, for making compatible resolve:
\`\`\`json
${JSON.stringify(await getRelatedShortFormList(entityKinds, entityDesc), null, 2)}
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
${JSON.stringify(safe(entityDesc?.map?.(({ entityType }) => {
    return Object.entries(JSON_SCHEMES.$entities)
        ?.filter?.((entity) => (entityType ?? "unknown") == (entity?.[0] ?? "unknown"))
        ?.map?.((entity) => entity?.[1] ?? {}) ?? [];
}) ?? []), null, 2)}
\`\`\``, "=== END:RESOLVE_STEP ===",
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    await gptResponses.askToDoAction(resolveStep?.join?.("\n"));
    const parsed = JSON.parse(await gptResponses.sendRequest() || "{}");
    console.log("Step 3 response - resolve entity response: ", parsed);

    // additional phase - merge from duplicates
    let i = 0;
    for (const desc of entityDesc) {
        const potentialName = parsed?.[i]?.desc?.name ?? desc?.potentialName;
        const entityType = desc?.entityType;
        const exists = (await readJSONs(`/data/${entityType}/`))?.find?.((json: any) => (json?.desc?.name == potentialName)) ?? {};
        parsed[i] = deepMergeExistsAndPotential?.(parsed[i], exists) ?? parsed[i]; i++;
    }
    return parsed;
}
