/*
 * NOT Available on Service Workers.
 * Stage 4: Consolidate entity items, unify, deduplicate, reorganize, make links, etc.
 */

//
import type { EntityDesc } from "@rs-core/template/deprecated/EntitiesTyped";
import { readJSONs } from "@rs-core/workers/FileSystem";

//
export type LinkedEntity = {
    id: string;
    title: string;
    type: string;
    path: string;
};

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
export const getShortFormFromEntity = (entity: any) => {
    return [
        entity?.type?.toLowerCase?.()?.replace?.(" ", "-"),
        entity?.kind?.toLowerCase?.()?.replace?.(" ", "-"),
        entity?.name?.toLowerCase?.()?.replace?.(" ", "-")
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
        ...(item?.links ?? [])
    ]
        .flat()
        .filter(Boolean)
        .map(String);

    return collectLinksByRefs(refs);
};
