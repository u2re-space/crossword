import { H } from "fest/lure";
import { makeEvents, makePropertyDesc } from "../format/Formatted";

//
export const BONUSES_DIR = "/data/bonus/";

//
export const BonusItem = (bonus: any, byKind: string | null = null) => {
    if (!bonus) return null;

    //
    const title = bonus?.desc?.title || bonus?.desc?.name || bonus?.name || "Bonus";
    const kind = bonus?.kind || "";
    if (!(byKind && byKind == kind || !byKind || byKind == "all" || !kind)) return;

    //
    const path = (bonus as any)?.__path || `${BONUSES_DIR}${(bonus?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents("Bonus", path, title, bonus, kind);

    //
    return H`<div data-type="bonus" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${title?.[0] ?? "B"}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${title}</li></ul>
        <ul class="card-kind">${makePropertyDesc("", bonus, "kind")}</ul>
    </div>
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Properties:</span><ul>
            ${makePropertyDesc("Kind", kind || bonus?.properties, "kind")}
            ${makePropertyDesc("Usable For", bonus?.properties, "usableFor")}
            ${makePropertyDesc("Usable In", bonus?.properties, "usableIn")}
            ${makePropertyDesc("Availability", bonus?.properties, "availability")}
            ${makePropertyDesc("Availability Time", bonus?.properties, "availabilityTime")}
            ${makePropertyDesc("Availability Days", bonus?.properties, "availabilityDays")}
            ${makePropertyDesc("Requirements", bonus?.properties, "requirements")}
            ${makePropertyDesc("Persons", bonus?.properties, "persons")}
            ${makePropertyDesc("Actions", bonus?.properties, "actions")}
            ${makePropertyDesc("Bonuses", bonus?.properties, "bonuses")}
            ${makePropertyDesc("Rewards", bonus?.properties, "rewards")}
            ${makePropertyDesc("Contacts", bonus?.properties, "contacts")}
        </ul>
    </div>
    <div class="card-description">
        <span class="card-label">Description:</span><ul class="card-desc">${makePropertyDesc("Description", bonus?.description, "text")}</ul>
    </div>
</div>`;
}
