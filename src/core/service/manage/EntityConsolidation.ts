/*
 * NOT Available on Service Workers.
 * Stage 4: Consolidate entity items, unify, deduplicate, reorganize, make links, etc.
 */

//
import { safe } from "fest/object";

//
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import type { BonusEntity, EntityDesc } from "@rs-core/template/EntitiesTyped";
import { readJSONs, writeJSON } from "@rs-core/workers/FileSystem";
import { idbDelete, idbGetAll } from "@rs-core/store/IDBStorage";

//
export type LinkedEntity = {
    id: string;
    title: string;
    type: string;
    path: string;
};




//
export const pushPendingToFS = async (entityType: string = "") => {
    const allEntries = await idbGetAll("pending-fs-write_" + entityType + "_");
    return Promise.all(allEntries.map(async (entry) => {
        try {
            const path = entry?.value?.path || entry?.path || entry?.key;
            const data = entry?.value?.data ?? entry?.data ?? entry?.value;
            const jsonData = typeof data === "string" ? JSON.parse(data) : data;
            await writeJSON(jsonData, { entityType }, path?.trim?.());
            console.log("Written file: " + path, jsonData);
        } finally {
            await new Promise((res) => setTimeout(res, 250));
            await idbDelete(entry?.key);
        }
    }));
}

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
export const getShortFormFromEntity = (entity: any) => {
    return [
        entity?.type?.toLowerCase?.()?.replace?.(" ", "-"),
        entity?.kind?.toLowerCase?.()?.replace?.(" ", "-"),
        entity?.desc?.name?.toLowerCase?.()?.replace?.(" ", "-")
    ]?.filter?.((item) => (!!item))?.join?.(":");
}

//
export const getEntitiesByType = (types: string[]) => {
    return Promise.all(types?.flatMap?.((type) => {
        return readJSONs(`/data/${type}/`).then((entry) => {
            return [type, getShortFormFromEntity(entry ?? [])];
        });
    }) ?? []);
}

//
export const getEntitiesFromFS = (dir: string) => {
    return readJSONs(dir);
}

//
export const getShortFormFromEntities = async (entityTypes: { entityType?: string; }[] | EntityDesc[]) => {
    const entities = await Promise.all(entityTypes?.flatMap?.(async (type) => {
        return [type?.entityType, await getEntitiesFromFS(`/data/${type?.entityType}/`)];
    }) ?? []);

    //
    return entityTypes?.map?.(async ({ entityType }: { entityType?: string; } | EntityDesc) => {
        const neededEntityType = (entities)?.find?.(([eType, entity]) => (eType == entityType || (entityType ?? "unknown") == (eType ?? "unknown")))?.[0]
        return entities
            ?.filter?.(([eType, entity]) => (eType == neededEntityType))
            ?.map(async (item) => {
                const w: any = await item;
                return (w?.id || w?.name || w?.desc?.name)
            });
    }) ?? [];
}

//
export const suggestShortNames = async () => {
    const kinds = ["bonus", "person", "service", "timeline", "task", "event"];
    const entries = await Promise.all(
        kinds.map(async (kind) => {
            const dir = `/data/${kind}/`;
            const entities = await getEntitiesFromFS(dir).catch(() => []);
            return (entities as any[]).map((entity) => {
                const id = entity?.id || entity?.name || entity?.desc?.name || "";
                if (!id) return null;
                const name = id.toString().toLowerCase().replace(/\s+/g, '-');
                const ref = `${kind}:${entity?.kind || "unknown"}:${name}`;
                return ref;
            }).filter(Boolean);
        })
    );
    return entries.flat();
};

//
export const collectLinksByRefs = async (refs: string[] = []) => {
    const normalized = refs
        .map((ref) => ref.trim())
        .filter(Boolean);
    const grouped = new Map<string, string[]>();

    normalized.forEach((ref) => {
        const [type, ...rest] = ref.split(":");
        const key = type || "unknown";
        const value = rest.join(":") || key;
        const bucket = grouped.get(key) ?? [];
        bucket.push(value);
        grouped.set(key, bucket);
    });

    const results = await Promise.all(
        Array.from(grouped.entries(), async ([type, values]) => {
            const dir = `/data/${type}/`;
            const entities = await getEntitiesFromFS(dir).catch(() => []);
            return entities
                ?.filter((entity: any) => {
                    const id = entity?.id || entity?.name || entity?.desc?.name;
                    if (!id) return false;
                    return values.some((v) => id?.toLowerCase?.().includes?.((v || "").toLowerCase?.()));
                })
                .map((entity: any) => ({
                    id: entity?.id || entity?.name || entity?.desc?.name,
                    title: entity?.desc?.title || entity?.desc?.name || entity?.name,
                    type,
                    path: entity?.__path
                })) ?? [];
        })
    );

    return results.flat().filter(Boolean) as LinkedEntity[];
};

//
export const getLinkedEntities = async (item: any) => {
    const refs = [
        ...(item?.properties?.links ?? []),
        ...(item?.links ?? []),
        ...(item?.desc?.links ?? [])
    ]
        .flat()
        .filter(Boolean)
        .map(String);

    return collectLinksByRefs(refs);
};

//
pushPendingToFS();
