import { makeReactive, observe, safe } from "fest/object";

// suboptimal, later will merged into another location
import { idbGet, idbPut } from "../../data/IDBStorage";

//
export const realtimeStates = makeReactive({
    time: new Date(),
    location: null,
    coordinates: null,
    otherProps: new Map([]),

    // for payments, id is card id, value is card balance (if available), or additional info
    cards: new Map([])
});


// associated with IndexedDB for service workers
const observeCategory = async (category: any)=>{
    return observe(category.items = makeReactive(JSON.parse(await (idbGet(category?.id) ?? "[]"))), (item, index)=>{
        idbPut(category?.id, JSON.stringify(safe(category?.items)))
    });
}


// `items` is cached file maps... is directly associated with IndexedDB for service workers
// also, may be used as arrays with simpler data for sending to AI
export const categories = makeReactive([
    makeReactive({
        label: "Items",
        items: makeReactive([]),
        id: "item"
    }),
    makeReactive({
        label: "Bonuses",
        items: makeReactive([]),
        id: "bonus"
    }),
    makeReactive({
        label: "Services",
        items: makeReactive([]),
        id: "service"
    }),
    makeReactive({
        label: "Tasks",
        items: makeReactive([]),
        id: "task"
    }),
    makeReactive({
        label: "Locations",
        items: makeReactive([]),
        id: "location"
    }),
    makeReactive({
        label: "Events",
        items: makeReactive([]),
        id: "events"
    }),
    makeReactive({
        label: "Factors",
        items: makeReactive([]),
        id: "factor"
    }),
    makeReactive({
        label: "Entertainments",
        items: makeReactive([]),
        id: "entertainment"
    }),
    makeReactive({
        label: "Markets",
        items: makeReactive([]),
        id: "market"
    }),
    makeReactive({
        label: "Placements",
        items: makeReactive([]),
        id: "placement"
    }),
    makeReactive({
        label: "Vendors",
        items: makeReactive([]),
        id: "place"
    }),
    makeReactive({
        label: "Persons",
        items: makeReactive([]),
        id: "person"
    }),
    makeReactive({
        label: "Skills",
        items: makeReactive([]),
        id: "skill"
    }),
    makeReactive({
        label: "Entertainments",
        items: makeReactive([]),
        id: "entertainment"
    }),
    makeReactive({
        label: "Vehicles",
        items: makeReactive([]),
        id: "vehicle"
    }),
    makeReactive({
        label: "Rewards",
        items: makeReactive([]),
        id: "reward"
    }),
    makeReactive({
        label: "Fins",
        items: makeReactive([]),
        id: "fine"
    }),
    makeReactive({
        label: "Actions",
        items: makeReactive([]),
        id: "action"
    }),
    makeReactive({
        label: "Lotteries",
        items: makeReactive([]),
        id: "lottery"
    })
]);

//
(categories as any)?.forEach?.(observeCategory as any);
