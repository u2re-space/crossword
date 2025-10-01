import { H } from "fest/lure";
import { $ShowItemsByType, renderTabName } from "../../../utils/Formatted";
import { BONUSES_DIR, BonusItem } from ".././../display/items/BonusItem";
import { implementDropEvent, implementPasteEvent } from "@rs-frontend/utils/HookEvent";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { openPickerAndAnalyze } from "@rs-frontend/utils/FileOps";
import { toastSuccess, toastError } from "@rs-frontend/elements/display/overlays/Toast";
import { makeEntityEdit } from "@rs-frontend/elements/display/edits/EntityEdit";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

//
export const BonusesView = () => {
    const kinds = ["discount", "cashback", "reward", "all"] as const;
    const tabs = new Map<string, HTMLElement | null | string | any>(kinds.map((kind) => [kind, $ShowItemsByType(BONUSES_DIR, kind, BonusItem)]));

    //
    const reloadTabs = () => {
        for (const el of tabs.values()) (el as any)?.reloadList?.();
    };

    //
    const openAddBonus = async () => {
        try {
            const result = await makeEntityEdit("Bonus", [], {}, {
                allowLinks: true,
                entityType: "bonus",
                description: "Describe the bonus and link related entities (actions, bonuses, etc.)."
            });
            if (!result) return;

            //
            const fileName = (result?.title || `bonus-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, BONUSES_DIR, file, { ensureJson: true, sanitize: true });
            toastSuccess("Bonus saved");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to save bonus");
        }
    };

    //
    const openUploadBonus = async () => {
        try {
            await openPickerAndAnalyze(BONUSES_DIR, 'text/markdown,text/plain,.json,image/*', true);
            toastSuccess("Bonus uploaded");
            reloadTabs();
        } catch (e) {
            console.warn(e);
            toastError("Failed to upload bonus");
        }
    };

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
            <button type="button" on:click=${openAddBonus}>
                <ui-icon icon="user-plus"></ui-icon>
                <span>Add Bonus</span>
            </button>
            <button type="button" on:click=${openUploadBonus}>
                <ui-icon icon="upload"></ui-icon>
                <span>Upload Bonus</span>
            </button>
        </div></div>`

    //
    const section = H`<section id="bonuses" class="all-view">${tabbed}${toolbar}</section>` as HTMLElement;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: "bonus" }).catch(console.warn);
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);
    return section;
}
