import { MakeCardByKind } from "../typed/Cards";

//
export const PERSONS_DIR = "/data/person/";
export const ContactItem = (contact: any, byKind: string | null = null) => {
    if (!contact) return null;
    return MakeCardByKind("Contact", PERSONS_DIR, contact, byKind);
}
