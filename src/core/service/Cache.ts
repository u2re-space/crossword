import { Promised, makeReactive, observe, safe } from "fest/object";
import { idbGet, idbPut } from "@rs-core/store/IDBStorage";

//
export const realtimeStates = makeReactive({
    time: new Date(),
    timestamp: Date.now(),
    coords: {},
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
const broadcastChannel = new BroadcastChannel('geolocation');
broadcastChannel.addEventListener('message', (e) => {
    console.log(e.data.coords);
    if (e.data.coords) {
        (realtimeStates as any).coords = (typeof e.data.coords == "string" ? JSON.parse(e.data.coords) : e.data.coords) || {};
        (realtimeStates as any).timestamp = e.data.timestamp || Date.now();
        (realtimeStates as any).time = new Date();
    }
});

//
setInterval(() => {
    (realtimeStates as any).time = new Date();
}, 1000);
