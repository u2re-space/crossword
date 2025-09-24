import { H } from "fest/lure";
import { makeEvents, makePropertyDesc } from "../../../utils/Formatted";

//
export const SERVICES_DIR = "/data/service/";

//
export const ServiceItem = (service: any, byKind: string | null = null) => {
    if (!service) return null;

    //
    const title = service?.desc?.title || service?.desc?.name || service?.name || "Service";
    const kind = service?.kind || "";
    if (!(byKind && byKind == kind || !byKind || byKind == "all" || !kind)) return;

    //
    const path = (service as any)?.__path || `${SERVICES_DIR}${(service?.desc?.name || title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
    if (!path) return null;

    //
    const events = makeEvents("Service", path, title, service, kind);
    const item = H`<div data-type="service" class="card" on:click=${(ev: any) => { (ev.target as HTMLElement).toggleAttribute?.('data-open'); }}>
    <div class="card-avatar">
        <div class="avatar-inner">${title?.[0] ?? "S"}</div>
    </div>
    <div class="card-props">
        <ul class="card-title"><li>${title}</li></ul>
        <ul class="card-kind">${makePropertyDesc("", service, "kind")}</ul>
    </div>
    <div class="card-actions">
        <button class="action" on:click=${events.doEdit}><ui-icon icon="pencil"></ui-icon><span>Edit</span></button>
        <button class="action" on:click=${events.doDelete}><ui-icon icon="trash"></ui-icon><span>Delete</span></button>
    </div>
    <div class="card-content">
        <span class="card-label">Properties:</span><ul>
            ${makePropertyDesc("Kind", kind || service?.properties, "kind")}
            ${makePropertyDesc("Price", service?.properties, "price")}
            ${makePropertyDesc("Quantity", service?.properties, "quantity")}
            ${makePropertyDesc("Location", service?.properties, "location")}
            ${makePropertyDesc("Persons", service?.properties, "persons")}
            ${makePropertyDesc("Actions", service?.properties, "actions")}
            ${makePropertyDesc("Tasks", service?.properties, "tasks")}
        </ul>
        <span class="card-label">Contacts:</span><ul>
            ${makePropertyDesc("Email", service?.properties?.contacts, "email")}
            ${makePropertyDesc("Phone", service?.properties?.contacts, "phone")}
        </ul>
    </div>
    <div class="card-description">
        <span class="card-label">Description:</span><ul class="card-desc">${makePropertyDesc("", service?.description, "")}</ul>
    </div>
</div>`;

    //
    return item;
}
