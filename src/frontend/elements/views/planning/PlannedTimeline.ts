import { H } from "fest/lure";
import "@rs-core/$test/Tasks";

//
import { TaskItem } from "../../display/items/TaskItem";
import { renderTabName, $ShowItemsByDay } from "@rs-frontend/utils/Formatted";
import { toastError, toastSuccess } from "@rs-frontend/elements/display/overlays/Toast";
import { idbGet } from "@rs-core/store/IDBStorage";

//
import { loadAllTimelines, requestNewTimeline, TIMELINE_DIR } from "@rs-core/service/planning/MakeTimeline";
import { SplitTimelinesByDays } from "@rs-core/utils/TimeUtils";
import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { startTracking } from "@rs-core/workers/GeoLocation";

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
// TODO! Upload timeline plans into service workers!
export const PlannedTimeline = async ($daysDesc?: any[] | null) => {

    //
    const daysTabs = new Map<string, HTMLElement | null | string | any>();
    let daysDesc: any[] | null = [];

    //
    let loadLocked = false;
    const reload = async () => {
        if (loadLocked) return;

        //
        daysTabs?.clear?.();
        loadLocked = true;

        //
        const timelines = await loadAllTimelines(TIMELINE_DIR)?.catch?.(console.warn.bind(console));
        daysDesc = [
            ...($daysDesc ?? []),
            ...(await SplitTimelinesByDays(timelines)?.catch?.(console.warn.bind(console)) ?? [])
        ];

        //
        for (const day of (daysDesc ?? [])) {
            const suc = $ShowItemsByDay(TIMELINE_DIR, day, TaskItem);
            if (suc && typeof day.id == "string") { daysTabs?.set?.(day.id, suc); };
        }

        //
        loadLocked = false;
        return daysTabs;
    }

    //
    const tabbed = H`<ui-tabbed-box
    prop:tabs=${await reload?.()}
    prop:renderTabName=${renderTabName}
    currentTab=${"pn"}
    style="background-color: transparent;"
    class="days"
></ui-tabbed-box>`;

    //
    if (!tabbed.currentTab) { tabbed.currentTab = daysDesc?.[0]?.id; }
    tabbed.renderTabName = (tabName: string) => { return (daysDesc)?.find((day: any) => day.id == tabName)?.title || tabName; };

    //
    const onMagicPlan = async () => {
        const settings = await idbGet("rs-settings");
        if (!settings) return { resultEntities: [], entityTypedDesc: [] };
        const gptResponses = new GPTResponses(settings.ai.apiKey, settings.ai.baseUrl, settings.ai.apiSecret, settings.ai.model);
        console.log(gptResponses);

        //
        if (settings?.ai?.mcp?.serverLabel && settings.ai.mcp.origin && settings.ai.mcp.clientKey && settings.ai.mcp.secretKey) {
            await gptResponses.useMCP(settings.ai.mcp.serverLabel, settings.ai.mcp.origin, settings.ai.mcp.clientKey, settings.ai.mcp.secretKey)?.catch?.(console.warn.bind(console));
        }

        //
        await startTracking?.()?.catch?.(console.warn.bind(console));

        //
        try {
            const source = await loadPlanSource();
            toastSuccess(source ? `Using ${source} for magic plan...` : "Using default preferences for plan...");
            console.info("Magic plan requested", source);

            //
            const requested = await requestNewTimeline(gptResponses, source);
            console.log(requested);

            //
            reload();
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
