/*
 * NOT Available on Service Workers.
 * Stage 4: Consolidate entity items, unify, deduplicate, reorganize, make links, etc.
 */

//
import { getShortFormFromEntities } from "@rs-core/service/Cache";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { safe } from "fest/object";
import { readJSONs, writeJSON } from "@rs-core/workers/FileSystem";
import type { BonusEntity, EntityDesc } from "@rs-core/service/template/EntitiesTyped";
import { idbDelete, idbGetAll } from "@rs-core/store/IDBStorage";

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
export const entityConsolidate = async (preResolvedEntity: any[], shortEntityDesc: EntityDesc[], shortEntityKinds: BonusEntity[], gptResponses: GPTResponses) => {
    //
    const entityResolvedCodedIntoJSON = JSON.stringify(preResolvedEntity, null, 2);

    //
    const entityResolvedList = [`=== BEGIN:ENTITY_RESOLVED_CODED_INTO_JSON ===
${entityResolvedCodedIntoJSON}
=== END:ENTITY_RESOLVED_CODED_INTO_JSON ===`]

    //
    const shortlistOfItems = [`=== BEGIN:PREPARE_RELATED_ITEMS ===
Shortlist of existing items in registry.
\`\`\`json
${JSON.stringify(await getEntityShortFormList(shortEntityKinds, shortEntityDesc), null, 2)}
\`\`\`

And related entities, for making compatible resolve:
\`\`\`json
${JSON.stringify(await getRelatedShortFormList(shortEntityKinds, shortEntityDesc), null, 2)}
\`\`\`
=== END:PREPARE_RELATED_ITEMS ===`];

    //
    const consolidateRequest = [`
=== BEGIN:CONSOLIDATE_STEP ===
Consolidate entity items, unify, deduplicate, reorganize, make links, etc.
=== END:CONSOLIDATE_STEP ===
`]

    //
    const consolidateStep = [
        "", "", ...entityResolvedList,
        "", "", ...shortlistOfItems,
        "", "", ...consolidateRequest
    ]?.map?.((instruction) => instruction?.trim?.());

    //
    await gptResponses.askToDoAction(consolidateStep?.join?.("\n"));
    const consolidatedEntity = JSON.parse(await gptResponses.sendRequest() || "[]");
    console.log("Step 4 response - consolidate entity response: ", consolidatedEntity);

    // additional phase - merge from duplicates
    let i = 0; const entities: any[] = [];
    for (const desc of preResolvedEntity) {
        const potentialName = consolidatedEntity?.[i]?.desc?.name ?? shortEntityDesc?.[i]?.potentialName;
        const entityType = shortEntityDesc?.[i]?.entityType;
        const redirectedEntity = (await readJSONs(`/data/${entityType}/`))?.find?.((json: any) => (json?.desc?.name == potentialName)) ?? {};
        entities.push(deepMergeExistsAndPotential?.(redirectedEntity[i] ?? desc, consolidatedEntity[i])); i++;
    }

    //
    return entities;
}

//
export const pushPendingToFS = async (entityType: string = "") => {
    const allEntries = await idbGetAll("pending-fs-write_" + entityType + "_");
    return Promise.all(allEntries.map(async (entry) => {
        try {
            const path = entry?.value?.path || entry?.path || entry?.key;
            const data = entry?.value?.data ?? entry?.data ?? entry?.value;
            const jsonData = typeof data === "string" ? JSON.parse(data) : data;
            await writeJSON(path?.trim?.(), jsonData);
            console.log("Written file: " + path, jsonData);
        } finally {
            await new Promise((res) => setTimeout(res, 250));
            await idbDelete(entry?.key);
        }
    }));
}

//
pushPendingToFS();
