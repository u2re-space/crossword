import { H } from "fest/lure";
import "../../../../$test/Tasks";

//
import { TaskItem } from "../../display/items/TaskItem";
import { renderTabName, $ShowItemsByDay } from "@rs-frontend/utils/Formatted";
import { toastError, toastSuccess } from "@rs-frontend/elements/display/overlays/Toast";

//
import { loadAllTimelines, requestNewTimeline, TIMELINE_DIR } from "@rs-core/service/AI-ops/MakeTimeline";
import { SplitTimelinesByDays, createDayDescriptor, parseDateCorrectly } from "@rs-core/utils/TimeUtils";
import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { startTracking } from "@rs-core/workers/GeoLocation";

//
import { loadSettings } from "@rs-core/config/Settings";

//
const loadPlanSource = async (): Promise<string | null> => {
    try {
        const stored = await loadSettings();
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
    const tabDescriptors: any[] = [];

    //
    let loadLocked = false;
    const reload = async () => {
        if (loadLocked) return;

        //
        daysTabs?.clear?.();
        loadLocked = true;

        //
        const timelines = await loadAllTimelines(TIMELINE_DIR)?.catch?.(console.warn.bind(console));
        const timelineList = Array.isArray(timelines) ? timelines : [];

        const normalizedTabs: any[] = [];
        const seenIds = new Set<string>();
        const seenFilters = new Map<string, any>();

        for (const proto of ($daysDesc ?? [])) {
            if (!proto?.id) continue;
            const descriptor = proto?.separatorTitle ? proto : createDayDescriptor(parseDateCorrectly(proto?.begin_time ?? proto?.date ?? Date.now()), proto) ?? proto;
            normalizedTabs.push(descriptor);
            seenIds.add(proto.id);
            if (descriptor.filter) {
                seenFilters.set(String(descriptor.filter).toLowerCase(), descriptor);
            }
        }

        if (!normalizedTabs.length) {
            normalizedTabs.push(createDayDescriptor(new Date(), { id: "all", title: "All", filter: null, variant: "default", icon: "calendar" }));
        }

        for (const timeline of timelineList) {
            const statusRaw = timeline?.properties?.status;
            if (!statusRaw || typeof statusRaw !== "string") continue;
            const key = statusRaw.toLowerCase();
            if (seenFilters.has(key)) continue;
            const generatedId = `status-${key}`;
            if (seenIds.has(generatedId)) continue;
            const title = statusRaw.replace(/(^|\s)([a-z])/g, (_, s, ch) => `${s}${ch.toUpperCase()}`);
            const descriptor = createDayDescriptor(parseDateCorrectly(timeline?.properties?.begin_time ?? Date.now()), { id: generatedId, title, filter: statusRaw, variant: "default", icon: "calendar" }) ?? { id: generatedId, title, filter: statusRaw, variant: "default", icon: "calendar" };
            normalizedTabs.push(descriptor);
            seenIds.add(generatedId);
            seenFilters.set(key, descriptor);
        }

        const buildTabContent = async (prototype: any) => {
            const protoDescriptor = prototype?.separatorTitle ? prototype : createDayDescriptor(parseDateCorrectly(prototype?.begin_time ?? prototype?.date ?? Date.now()), prototype) ?? prototype;
            const filterRaw = protoDescriptor?.filter;
            const normalizedFilter = typeof filterRaw === "string" ? filterRaw.toLowerCase() : null;
            const filteredTimelines = normalizedFilter ? timelineList.filter((entry) => String(entry?.properties?.status ?? "").toLowerCase() === normalizedFilter) : timelineList;
            const baseDescriptors = await SplitTimelinesByDays(filteredTimelines)?.catch?.(console.warn.bind(console)) ?? [];
            const dayDescriptors = baseDescriptors.map((desc: any) => ({
                ...desc,
                filter: filterRaw ?? null,
                variant: protoDescriptor?.variant ?? desc?.variant,
                icon: protoDescriptor?.icon ?? desc?.icon
            }));

            dayDescriptors.sort((a: any, b: any) => {
                const aTime = parseDateCorrectly(a?.begin_time ?? a?.beginTime ?? Date.now())?.getTime?.() ?? 0;
                const bTime = parseDateCorrectly(b?.begin_time ?? b?.beginTime ?? Date.now())?.getTime?.() ?? 0;
                return aTime - bTime;
            });

            const container = H`<div class="timeline-tab"></div>` as HTMLElement;
            if (!dayDescriptors.length) {
                container.append(H`<div class="timeline-empty">No scheduled entries.</div>`);
                return container;
            }

            for (const descriptor of dayDescriptors) {
                const section = $ShowItemsByDay(TIMELINE_DIR, descriptor, TaskItem);
                if (section) {
                    container.append(section);
                }
            }

            if (!container.childElementCount) {
                container.append(H`<div class="timeline-empty">No scheduled entries.</div>`);
            }

            return container;
        };

        daysTabs?.clear?.();
        tabDescriptors.length = 0;
        for (const proto of normalizedTabs) {
            const tabContent = await buildTabContent(proto);
            if (tabContent && typeof proto?.id === "string") {
                daysTabs.set(proto.id, tabContent);
                tabDescriptors.push({
                    id: proto?.id,
                    title: proto?.title,
                    icon: proto?.icon,
                    filter: proto?.filter ?? null
                });
            }
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
    if (!tabbed.currentTab) { tabbed.currentTab = $daysDesc?.[0]?.id; }
    tabbed.renderTabName = (tabName: string) => { return ($daysDesc)?.find((day: any) => day.id == tabName)?.title || tabName; };

    //
    const onMagicPlan = async () => {
        const settings = await loadSettings();
        if (!settings || !settings?.ai || !settings.ai?.apiKey) return;

        //
        const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5-mini");
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
            toastSuccess(source ? `Using ${source} for magic plan...` : [
                "Using default preferences for plan...",
            ]?.join?.("\n"));
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
