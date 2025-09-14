import { H, M } from "fest/lure";

//
const SERVICES_DIR = "/data/service/";

//
const DigitalServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="digital" class="tab">${services}</div>`;
}

//
const SupportingServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="supporting" class="tab">${services}</div>`;
}

//
const MedicalServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="medical" class="tab">${services}</div>`;
}

//
const EducationServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="education" class="tab">${services}</div>`;
}

//
const DeliveryServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="delivery" class="tab">${services}</div>`;
}

//
const OtherServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="other" class="tab">${services}</div>`;
}

//
const AllServices = () => {
    const services = M([], (services) => {
        return H`<div class="service-item"></div>`;
    });
    return H`<div data-name="all" class="tab">${services}</div>`;
}

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
const tabs = new Map<string, HTMLElement>([
    ["digital", DigitalServices()],
    ["supporting", SupportingServices()],
    ["medical", MedicalServices()],
    ["education", EducationServices()],
    ["delivery", DeliveryServices()],
    ["other", OtherServices()],
    ["all", AllServices()],
]);

//
export const ServicesView = () => {
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="all-view">${tabbed}</section>`;
}
