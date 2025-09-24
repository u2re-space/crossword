import { MakeCardByKind } from "../typed/Cards";

//
export const BONUSES_DIR = "/data/bonus/";
export const BonusItem = (bonus: any, byKind: string | null = null) => {
    if (!bonus) return null;
    return MakeCardByKind("Bonus", BONUSES_DIR, bonus, byKind);
}
