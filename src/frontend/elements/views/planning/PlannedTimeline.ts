import { H } from "fest/lure";
import "@rs-core/$test/Tasks";

//
import { TaskItem } from "../../display/items/TaskItem";
import { renderTabName, $ShowItemsByDay } from "@rs-frontend/utils/Formatted";
import { toastError, toastSuccess } from "@rs-frontend/utils/Toast";
import { idbGet } from "@rs-core/store/IDBStorage";

//
import { loadAllTimelines, TIMELINE_DIR } from "@rs-core/service/planning/MakeTimeline";
import { SplitTimelinesByDays } from "@rs-core/utils/TimeUtils";

//
const SETTINGS_KEY = "rs-settings";
const loadPlanSource = async (): Promise<string | null> => {
    try {
        const stored = await idbGet(SETTINGS_KEY);
        return stored?.timeline?.source || null;
    } catch (e) {
        console.warn(e);
        return null;
    }
};

// Render the timeline
export const PlannedTimeline = async ($daysDesc?: any[] | null) => {
    const timelines = await loadAllTimelines(TIMELINE_DIR)?.catch?.(console.warn.bind(console));
    const daysDesc = $daysDesc ?? (await SplitTimelinesByDays(timelines));

    const daysTabs = new Map<string, HTMLElement | null | string | any>();
    for (const day of (daysDesc ?? [])) {
        daysTabs.set(day.id, $ShowItemsByDay(TIMELINE_DIR, day, TaskItem));
    }

    const tabbed = H`<ui-tabbed-box
    prop:tabs=${daysTabs}
    prop:renderTabName=${renderTabName}
    currentTab=${""}
    style="background-color: transparent;"
    class="days"
></ui-tabbed-box>`;

    if (!tabbed.currentTab) { tabbed.currentTab = daysDesc?.[0]?.id; }

    tabbed.renderTabName = (tabName: string) => { return (daysDesc)?.find((day: any) => day.id == tabName)?.title || tabName; };

    const onMagicPlan = async () => {
        try {
            const source = await loadPlanSource();
            toastSuccess(source ? `Using ${source} for magic plan...` : "Using default preferences for plan...");
            console.info("Magic plan requested", source);
        } catch (e) {
            console.warn(e);
            toastError("Failed to create plan");
        }
    };

    return H`<section id="timeline" style="background-color: transparent;" class="timeline c2-surface">
    ${tabbed}
    <div class="view-toolbar">
        <div class="button-set">
            <button on:click=${onMagicPlan}><ui-icon icon="calendar"></ui-icon><span>Make Timeline Plan</span></button>
        </div>
    </div>
    </section>`;
}
