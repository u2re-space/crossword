/*
 *
 * Needs for direct uploading JSON files to IndexedDB and Cache.
 * Not always AI may be needed for sorting into database, so we need to detect type of data.
 * Detects by fields, such as 'kind', some 'properties', structure, keywords, etc.
 */

import * as Schemes from "./Entities";
import * as Types from "./EntitiesTyped";

// !IMPORTANT! Entity.KIND != Type of Entity (Category)
export const detectEntityTypeByJSON = (unknownJSON: any) => {
    let mostSuitableType = "unknown";

    //
    unknownJSON = typeof unknownJSON == "string" ? JSON.parse(unknownJSON) : unknownJSON;
    if (typeof unknownJSON != "object") { return mostSuitableType; }

    // attempt 1 - detect possible types by 'KIND_MAP' enums
    let types: Set<any> = new Set();
    for (const type in Schemes.KIND_MAP) {
        if (Schemes.KIND_MAP[type].includes(unknownJSON.kind)) {
            types.add(type);
        }
    }

    // filter all entities, which has no required kinds
    const allEntities = [...Object.entries(Schemes.JSON_SCHEMES.$entities), ["task", Schemes.JSON_SCHEMES.$task]]?.filter?.(([key, _]: any) => types.has(key))

    // attempt 2.1 - detect by specific fields and properties (events, time based)
    let timeTypes: Set<any> = new Set();
    if (unknownJSON?.properties?.begin_time != null || unknownJSON?.properties?.end_time != null) {
        allEntities?.forEach(([type, scheme]: any) => {
            if (scheme.properties?.begin_time != null && scheme.properties?.end_time != null) {
                timeTypes.add(type);
            }
        });
    }

    // attempt 2.2 - detect by specific fields and properties (location based)
    let locationTypes: Set<any> = new Set();
    if (unknownJSON?.properties?.location != null) {
        allEntities?.forEach(([type, scheme]: any) => {
            if (scheme.properties?.location != null) {
                locationTypes.add(type);
            }
        });
    }

    // attempt 2.3 - detect by specific fields and properties (prices factors)
    let pricesTypes: Set<any> = new Set();
    if (unknownJSON?.properties?.prices != null) {
        allEntities?.forEach(([type, scheme]: any) => {
            if (scheme.properties?.prices != null) {
                pricesTypes.add(type);
            }
        });
    }

    // attempt 2.4 - detect by specific fields and properties (contacts factors)
    let contactsTypes: Set<any> = new Set();
    if (unknownJSON?.properties?.contacts != null) {
        allEntities?.forEach(([type, scheme]: any) => {
            if (scheme.properties?.contacts != null) {
                contactsTypes.add(type);
            }
        });
    }

    //
    const countMap = new Map<any, number>();
    [...contactsTypes, ...locationTypes, ...pricesTypes, ...timeTypes].forEach((type) => {
        countMap.set(type, (countMap.get(type) || 0) + 1);
    });

    //
    mostSuitableType = countMap.size == 0 ? [...types]?.[0] : [...countMap.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return (mostSuitableType || "unknown");
}

// for multiple entities (array)
export const detectEntityTypesByJSONs = (unknownJSONs: any[] | any) => {
    unknownJSONs = typeof unknownJSONs == "string" ? JSON.parse(unknownJSONs) : unknownJSONs;
    return (Array.isArray(unknownJSONs) ? unknownJSONs?.map?.((unknownJSON) => detectEntityTypeByJSON(unknownJSON)) || [] : [detectEntityTypeByJSON(unknownJSONs)]);
}
