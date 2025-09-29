import { H } from "fest/lure";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { ServiceItem, SERVICES_DIR } from ".././../display/items/ServiceItem";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { makeEntityEdit } from "../../display/edits/EntityEdit";
import { toastSuccess, toastError } from "@rs-frontend/elements/display/overlays/Toast";
import { sendToEntityPipeline, writeFileSmart } from "@rs-core/workers/FileSystem";
import { openPickerAndAnalyze } from "@rs-frontend/utils/FileOps";

//
export const ServicesView = () => {
    const kinds = ["digital", "consultation", "supporting", "medical", "education", "delivery", "other", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(SERVICES_DIR, kind, ServiceItem)]));

    //
    const reloadTabs = () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    };

    //
    const openAddService = async () => {
        try {
            const result = await makeEntityEdit("Service", [], {}, {
                allowLinks: true,
                entityType: "service",
                description: "Describe the service and link related entities (actions, bonuses, etc.)."
            });
            if (!result) return;

            //
            const fileName = (result?.desc?.title || `service-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, SERVICES_DIR, file, { ensureJson: true, sanitize: true });
            toastSuccess("Service saved");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to save service");
        }
    };

    //
    const openUploadService = async () => {
        try {
            await openPickerAndAnalyze(SERVICES_DIR, 'text/markdown,text/plain,.json,image/*', true);
            toastSuccess("Service uploaded");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to upload service");
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
            <button type="button" on:click=${openAddService}>
                <ui-icon icon="headset"></ui-icon>
                <span>Add Service</span>
            </button>
            <button type="button" on:click=${openUploadService}>
                <ui-icon icon="upload"></ui-icon>
                <span>Upload Service</span>
            </button>
        </div></div>`

    //
    const section = H`<section id="services" class="all-view">${tabbed}${toolbar}</section>` as HTMLElement;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "service" });
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
}
