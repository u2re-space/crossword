import { H } from "fest/lure";
import { ContactItem, PERSONS_DIR } from "../../display/items/ContactItem";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { makeEntityEdit } from "../../display/edits/EntityEdit";
import { toastSuccess, toastError } from "@rs-frontend/elements/display/overlays/Toast";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { openPickerAndAnalyze } from "@rs-frontend/utils/FileOps";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

//
export const ContactsView = () => {
    const kinds = ["specialist", "delivery", "other", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(PERSONS_DIR, kind, ContactItem)]));

    //
    const reloadTabs = () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    };

    //
    const openAddContact = async () => {
        try {
            const result = await makeEntityEdit("Contact", [], {}, {
                allowLinks: true,
                entityType: "person",
                description: "Provide basic contact information. You can link related entities using IDs."
            });
            if (!result) return;

            //
            const fileName = (result?.title || `contact-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, PERSONS_DIR, file, { ensureJson: true, sanitize: true });
            toastSuccess("Contact saved");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to save contact");
        }
    };

    //
    const openUploadContact = async () => {
        try {
            await openPickerAndAnalyze(PERSONS_DIR, 'text/markdown,text/plain,.json,image/*', true);
            toastSuccess("Contact uploaded");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to upload contact");
        }
    }

    //
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        currentTab=${"all"}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    const toolbar = H`<div class="view-toolbar">
        <div class="button-set">
            <button type="button" on:click=${openAddContact}>
                <ui-icon icon="user-plus"></ui-icon>
                <span>Add Contact</span>
            </button>
            <button type="button" on:click=${openUploadContact}>
                <ui-icon icon="upload"></ui-icon>
                <span>Upload Contact</span>
            </button>
        </div></div>`

    //
    const section = H`<section id="contacts" class="all-view">${tabbed}${toolbar}</section>` as HTMLElement;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "person" });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
}
