import { H, M } from "fest/lure";
import { makeReactive } from "fest/object";

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
export const categories = makeReactive([
    {
        label: "Items",
        items: makeReactive([]),
        id: "item"
    },
    {
        label: "Bonuses",
        items: makeReactive([]),
        id: "bonus"
    },
    {
        label: "Services",
        items: makeReactive([]),
        id: "service"
    },
    {
        label: "Tasks",
        items: makeReactive([]),
        id: "task"
    },
    {
        label: "Locations",
        items: makeReactive([]),
        id: "location"
    },
    {
        label: "Events",
        items: makeReactive([]),
        id: "events"
    },
    {
        label: "Factors",
        items: makeReactive([]),
        id: "factor"
    },
    {
        label: "Entertainments",
        items: makeReactive([]),
        id: "entertainment"
    },
    {
        label: "Markets",
        items: makeReactive([]),
        id: "market"
    },
    {
        label: "Placements",
        items: makeReactive([]),
        id: "placement"
    },
    {
        label: "Vendors",
        items: makeReactive([]),
        id: "place"
    },
    {
        label: "Persons",
        items: makeReactive([]),
        id: "person"
    },
    {
        label: "Skills",
        items: makeReactive([]),
        id: "skill"
    },
    {
        label: "Entertainments",
        items: makeReactive([]),
        id: "entertainment"
    },
    {
        label: "Vehicles",
        items: makeReactive([]),
        id: "vehicle"
    },
    {
        label: "Rewards",
        items: makeReactive([]),
        id: "reward"
    },
    {
        label: "Fins",
        items: makeReactive([]),
        id: "fine"
    },
    {
        label: "Actions",
        items: makeReactive([]),
        id: "action"
    },
    {
        label: "Lotteries",
        items: makeReactive([]),
        id: "lottery"
    }
]);

//
export const DataView = ()=>{
    return H`<section class="data-view">

    </section>`;
};
