import { H } from "fest/lure";
import { makeEvents, makePropertyDesc } from "../../../utils/Formatted";

//
export const PERSONS_DIR = "/data/person/";

//
export const ContactItem = (contact: any, byKind: string | null = null) => {
    if (!contact) return null;

    //
    const title = contact?.desc?.title || contact?.desc?.name || contact?.name || "Contact";
    const kind = contact?.kind || contact?.type || "";
    if (!(byKind && byKind == kind || !byKind || byKind == "all" || !kind)) return;

    //
    const path = (contact as any)?.__path || `${PERSONS_DIR}${(contact?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents("Contact", path, title, contact, kind);
    const properties = contact?.properties || {};

    //
    const item = H`<div data-type="contact" class="card" on:click=${(ev: any) => { (ev.currentTarget as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${title?.[0] ?? "C"}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${title}</li></ul>
        <ul class="card-kind">${makePropertyDesc("", contact, "kind")}</ul>
    </div>
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Contacts:</span><ul>
            ${makePropertyDesc("Kind", contact?.properties || kind, "kind")}
            ${makePropertyDesc("Email", properties?.contacts, "email")}
            ${makePropertyDesc("Phone", properties?.contacts, "phone")}
        </ul>
    </div>
    <div class="card-description">
        <span class="card-label">Description:</span>
        <ul>${makePropertyDesc("", contact?.description, "")}</ul>
    </div>
</div>`;

    //
    return item;
}
