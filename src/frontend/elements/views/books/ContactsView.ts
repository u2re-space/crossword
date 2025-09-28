import { H } from "fest/lure";
import { ContactItem, PERSONS_DIR } from "../../display/items/ContactItem";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { makeEntityEdit } from "../../display/edits/EntityEdit";
import { toastSuccess, toastError } from "@rs-frontend/utils/Toast";
import { sendToEntityPipeline, writeFileSmart } from "@rs-core/workers/FileSystem";

//
export const ContactsView = () => {
    const kinds = ["specialist", "delivery", "other", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(PERSONS_DIR, kind, ContactItem)]));

    const reloadTabs = () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    };

    const openAddContact = async () => {
        try {
            const result = await makeEntityEdit("Contact", [], {}, {
                allowLinks: true,
                entityType: "person",
                description: "Provide basic contact information. You can link related entities using IDs."
            });
            if (!result) return;

            const fileName = (result?.desc?.title || `contact-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, PERSONS_DIR, file, { ensureJson: true, sanitize: true });
            toastSuccess("Contact saved");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to save contact");
        }
    };

    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        currentTab=${"all"}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    const section = H`<section id="contacts" class="all-view">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
        <button on:click=${openAddContact}>
            <ui-icon icon="user-plus"></ui-icon>
            <span>Add Contact</span>
        </button>
    </div>
    </section>` as HTMLElement;

    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "person" });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
}
