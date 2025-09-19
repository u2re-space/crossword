import { Promised, makeReactive, observe, safe } from "fest/object";
import { idbDelete, idbGet, idbGetAll, idbPut } from "@rs-core/store/IDBStorage";
import { readJSONs, writeJSON } from "@rs-core/workers/FileSystem";

//
export const TIMELINE_DIR = "/timeline/";
export const DATASET_DIR = "/data/";
export const DOCUMENTS_DIR = "/docs/";

//
export const realtimeStates = makeReactive({
    time: new Date(),
    location: null,
    coordinates: null,
    otherProps: new Map([]),

    // for payments, id is card id, value is card balance (if available), or additional info
    cards: new Map([])
});

//
const editableArray = (category: any, items: any[]) => {
    const wrapped = makeReactive(items);
    observe(wrapped, (item, index) => idbPut(category?.id, JSON.stringify(safe(wrapped))));
    return wrapped;
}

// associated with IndexedDB for service workers
const observeCategory = (category: any) => {
    Object.defineProperty(category, "items", {
        get: () => { // get will get new array from indexedDB, for prevent data corruption
            return Promised((async () => editableArray(category, JSON.parse(await idbGet(category?.id) ?? "[]")))());
        },
        set: (value: any) => {
            idbPut(category?.id, JSON.stringify(safe(value)));
        }
    });
    return category;
}

//
const $wrapCategory = (category: any): any => {
    return makeReactive(observeCategory(category));
}

//
export const tasksCategories = makeReactive([
    $wrapCategory({
        label: "Tasks",
        id: "task"
    })
]);

// `items` is cached file maps... is directly associated with IndexedDB for service workers
// also, may be used as arrays with simpler data for sending to AI
export const dataCategories = makeReactive([
    $wrapCategory({
        label: "Items",
        id: "item"
    }),
    $wrapCategory({
        label: "Bonuses",
        id: "bonus"
    }),
    $wrapCategory({
        label: "Services",
        id: "service"
    }),
    $wrapCategory({
        label: "Locations",
        id: "location"
    }),
    $wrapCategory({
        label: "Events",
        id: "events"
    }),
    $wrapCategory({
        label: "Factors",
        id: "factor"
    }),
    $wrapCategory({
        label: "Entertainments",
        id: "entertainment"
    }),
    $wrapCategory({
        label: "Markets",
        id: "market"
    }),
    $wrapCategory({
        label: "Places",
        id: "place"
    }),
    $wrapCategory({
        label: "Vendors",
        id: "place"
    }),
    $wrapCategory({
        label: "Persons",
        id: "person"
    }),
    $wrapCategory({
        label: "Skills",
        id: "skill"
    }),
    $wrapCategory({
        label: "Entertainments",
        id: "entertainment"
    }),
    $wrapCategory({
        label: "Vehicles",
        id: "vehicle"
    }),
    $wrapCategory({
        label: "Rewards",
        id: "reward"
    }),
    $wrapCategory({
        label: "Fins",
        id: "fine"
    }),
    $wrapCategory({
        label: "Actions",
        id: "action"
    }),
    $wrapCategory({
        label: "Lotteries",
        id: "lottery"
    })
]);

//
export const getShortFormFromEntity = (entity: any) => {
    return [
        entity?.type?.toLowerCase?.()?.replace?.(" ", "-"),
        entity?.kind?.toLowerCase?.()?.replace?.(" ", "-"),
        entity?.desc?.name?.toLowerCase?.()?.replace?.(" ", "-")
    ]?.filter?.((item) => (!!item))?.join?.(":");
}

//
export const getShortFormFromEntities = (entities: any[]) => {
    return entities?.map?.((entity) => getShortFormFromEntity(entity));
}

//
export const getEntitiesFromFS = (dir: string) => {
    return readJSONs(dir);
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
const fileSystemChannel = new BroadcastChannel('rs-fs');
fileSystemChannel.addEventListener('message', (event) => {
    if (event.data.type === 'pending-write') {
        event.data.results?.forEach?.((result) => {
            const { entityType, data, name, path, key, idx } = result;
            const jsonData = typeof data === "string" ? JSON.parse(data) : data;
            console.log("Written file: " + path, jsonData);
            writeJSON(path?.trim?.(), jsonData);
        });
    }
});

//
pushPendingToFS();
