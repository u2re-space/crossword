import { MakeCardByKind } from "../typed/Cards";

//
export const SERVICES_DIR = "/data/service/";
export const ServiceItem = (service: any, byKind: string | null = null) => {
    if (!service) return null;
    return MakeCardByKind("Service", SERVICES_DIR, service, byKind);
}
