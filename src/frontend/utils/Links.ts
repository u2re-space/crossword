import { getEntitiesFromFS } from "@rs-core/service/Cache";

export type LinkedEntity = {
    id: string;
    title: string;
    type: string;
    path: string;
};

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

