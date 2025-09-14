import { H, M } from "fest/lure";


//
const PERSONS_DIR = "/data/person/";
const SERVICES_DIR = "/data/service/";


//
const PersonsContacts = () => {
    const persons = M([], (person) => {
        return H`<div class="contact-item"></div>`;
    });
    return H`<div data-name="person" class="tab">${persons}</div>`;
}

//
const ServicesContacts = () => {
    const services = M([], (service) => {
        return H`<div class="contact-item"></div>`;
    });
    return H`<div data-name="service" class="tab">${services}</div>`;
}

//
const AllContacts = () => {
    const contacts = M([], (contacts) => {
        return H`<div class="contact-item"></div>`;
    });
    return H`<div data-name="all" class="tab">${contacts}</div>`;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
const tabs = new Map<string, HTMLElement>([
    ["person", PersonsContacts()],
    ["service", ServicesContacts()],
    ["all", AllContacts()]
]);

//
export const ContactsView = () => {
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="all-view">${tabbed}</section>`;
}
