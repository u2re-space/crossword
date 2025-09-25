import { getShortFormFromEntities } from "@rs-core/service/Cache";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from '@rs-core/service/template/Entities';
import { safe } from "fest/object";
import { readJSONs } from "@rs-core/workers/FileSystem";

//
const makeRelatedListPerEntity = async (entityKind: any, shortForm: any[]) => {
    const related = shortForm?.filter?.((item) => (item?.kind === entityKind || !entityKind || entityKind === "unknown" || entityKind === "all"))
    return JSON.stringify(safe(related));
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



const getRelated = async (entityKinds: {
    kinds: string[];
    usabilityKinds: {
        forEntity: string[];
        inEntity: string[];
    }[];
}[], entityDesc: {
    entityType: string;
    potentialName: string;
}[]) => {
    const shortForm = await getShortFormFromEntities(entityDesc);
    const relatedList: any[] = [];
    const forRelatedList: any[] = [];
    const inRelatedList: any[] = [];

    //
    {
        let mainIndex = 0;
        for (const entityKind of entityKinds) {
            let subIndex = 0;
            for (const subKind of entityKind?.kinds ?? []) {
                relatedList.push(await makeRelatedListPerEntity(subKind?.[0] ?? "unknown", shortForm))
                subIndex++;
            }
            mainIndex++;
        }
    }

    {
        let mainIndex = 0;
        for (const entityKind of entityKinds) {
            let subIndex = 0;
            for (const subKind of entityKind?.usabilityKinds?.[subIndex]?.forEntity ?? []) {
                forRelatedList.push(await makeRelatedListPerEntity(subKind?.[0] ?? "unknown", shortForm))
                subIndex++;
            }
            mainIndex++;
        }
    }

    {
        let mainIndex = 0;
        for (const entityKind of entityKinds) {
            let subIndex = 0;
            for (const subKind of entityKind?.usabilityKinds?.[subIndex]?.inEntity ?? []) {
                inRelatedList.push(await makeRelatedListPerEntity(subKind?.[0] ?? "unknown", shortForm))
                subIndex++;
            }
            mainIndex++;
        }
    }

    //
    return [relatedList, forRelatedList, inRelatedList]
}



//
export const resolveEntity = async (entityDesc: {
    entityType: string;
    potentialName: string;
}[], entityKinds: {
    kinds: string[];
    usabilityKinds: {
        forEntity: string[];
        inEntity: string[];
    }[];
}[], gptResponses: GPTResponses) => {
    // - get entity type items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === entityType)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.forEntity)`
    // - get related items by criteria: `gptResponses.categoriesCache?.find?.((category)=> category?.id === usabilityKind?.inEntity)`
    // from items caches...

    //
    const shortlistOfItems = [`=== BEGIN:PREPARE_RELATED_ITEMS ===
Shortlist of existing items in ${JSON.stringify(entityDesc)} registry.

And related entities, for making compatible resolve:
\`\`\`json
${JSON.stringify(await getRelated(entityKinds, entityDesc))}
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
${JSON.stringify(await getShortFormFromEntities(entityDesc), null, 2)}
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
        const exists = (await readJSONs(`/data/${entityType}/`))?.find?.((json: any) => (json?.desc?.name == potentialName));
        parsed[i] = deepMergeExistsAndPotential?.(parsed[i], exists) ?? parsed[i]; i++;
    }
    return parsed;
}
