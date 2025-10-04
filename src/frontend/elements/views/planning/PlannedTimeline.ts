import { H } from "fest/lure";

//
import { TaskItem } from "../../display/items/TaskItem";
import { toastError, toastSuccess } from "@rs-frontend/elements/display/overlays/Toast";

//
import { loadAllTimelines, requestNewTimeline, TIMELINE_DIR } from "@rs-core/service/AI-ops/MakeTimeline";
import { SplitTimelinesByDays, createDayDescriptor, parseDateCorrectly, insideOfDay } from "@rs-core/utils/TimeUtils";
import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { startTracking } from "@rs-core/workers/GeoLocation";

//
import { loadSettings } from "@rs-core/config/Settings";
import { watchFsDirectory } from "@rs-core/workers/FsWatch";
import { makeReactive } from "fest/object";
import { parseAndGetCorrectTime } from "@rs-core/utils/TimeUtils";

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

const buildEmptyState = (message = "No scheduled entries.") => H`<div class="timeline-empty">${message}</div>`;

const renderDaySection = (descriptor: any, items: any[]) => {
    const toggleOpen = (ev: Event) => {
        const section = (ev.currentTarget as HTMLElement)?.closest?.(".timeline-day");
        section?.toggleAttribute?.("data-open");
    };

    const header = H`<header class="timeline-day-header" on:click=${toggleOpen}>
        <div class="timeline-day-divider"><span>${descriptor?.separatorTitle ?? descriptor?.title ?? "Day"}</span></div>
        ${descriptor?.title ? H`<p class="timeline-day-meta">${descriptor?.title}</p>` : null}
    </header>`;

    const body = H`<div class="timeline-day-body"></div>` as HTMLElement;
    if (!items.length) {
        body.append(buildEmptyState());
    } else {
        for (const item of items) {
            const card = TaskItem(item, descriptor);
            if (card) body.append(card);
        }
    }

    return H`<section class="timeline-day" data-type="day" data-status=${descriptor?.filter ?? "all"} data-variant=${descriptor?.variant ?? "default"}>
        ${header}
        ${body}
    </section>`;
};

const normalizeTimelineContent = (descriptors: any[], timelines: any[]) => {
    const sections: HTMLElement[] = [];
    for (const descriptor of descriptors) {
        const matching = timelines.filter((timeline) => insideOfDay(timeline, descriptor));
        sections.push(renderDaySection(descriptor, matching));
    }
    if (!sections.length) sections.push(buildEmptyState());
    const container = H`<div class="timeline-tab"></div>` as HTMLElement;
    sections.forEach((section) => container.append(section));
    return container;
};

const loadAndNormalizeTimelines = async () => {
    const timelineList = await loadAllTimelines(TIMELINE_DIR)?.catch?.(console.warn.bind(console)) ?? [];
    timelineList.sort((a: any, b: any) => parseAndGetCorrectTime(a?.properties?.begin_time) - parseAndGetCorrectTime(b?.properties?.begin_time));
    return timelineList;
};

const buildDayDescriptors = async (timelines: any[], $daysDesc?: any[] | null) => {
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

    for (const timeline of timelines) {
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

    return normalizedTabs;
};

const buildTabSlot = (tabs: Map<string, HTMLElement>) => {
    const tabbed = H`<ui-tabbed-box class="timeline-tabs"></ui-tabbed-box>` as any;
    tabbed.tabs = tabs;
    tabbed.currentTab ||= [...tabs.keys()][0] ?? "";
    tabbed.renderTabName = (tabName: string) => tabs.get(tabName)?.dataset?.title ?? tabName;
    return tabbed;
};

const attachFsWatcher = (callback: () => void) => {
    let stop: (() => void) | null = null;
    queueMicrotask(() => {
        stop = watchFsDirectory(TIMELINE_DIR, () => callback()) ?? stop;
    });
    return () => stop?.();
};

const refreshTabs = async (tabsMap: Map<string, HTMLElement>, $daysDesc?: any[] | null) => {
    const timelines = await loadAndNormalizeTimelines();
    const descriptors = await buildDayDescriptors(timelines, $daysDesc);
    const groupedById = new Map<string, HTMLElement>();
    for (const desc of descriptors) {
        const filtered = desc?.filter ? timelines.filter((entry) => String(entry?.properties?.status ?? "").toLowerCase() === String(desc.filter).toLowerCase()) : timelines;
        const split = await SplitTimelinesByDays(filtered)?.catch?.(console.warn.bind(console)) ?? [];
        const dayDescriptors = split.map((day: any) => ({
            ...day,
            filter: desc?.filter ?? day?.filter ?? null,
            variant: desc?.variant ?? day?.variant,
            icon: desc?.icon ?? day?.icon
        }));

        let sections: HTMLElement;
        if (!dayDescriptors.length) {
            sections = normalizeTimelineContent([desc], []);
        } else {
            sections = normalizeTimelineContent(dayDescriptors, filtered);
        }
        sections.dataset.title = desc?.title ?? desc?.separatorTitle ?? desc.id;
        groupedById.set(desc.id, sections);
    }

    tabsMap.clear();
    groupedById.forEach((value, key) => tabsMap.set(key, value));
};

//
export const PlannedTimeline = async ($daysDesc?: any[] | null) => {
    const tabs = makeReactive(new Map<string, HTMLElement>());
    await refreshTabs(tabs, $daysDesc);
    const tabbed = buildTabSlot(tabs);

    const reload = async () => {
        const previous = tabbed.currentTab;
        await refreshTabs(tabs, $daysDesc);
        if (previous && tabs.has(previous)) {
            tabbed.currentTab = previous;
        } else {
            tabbed.currentTab = [...tabs.keys()][0] ?? "";
        }
        tabbed.openTab?.(tabbed.currentTab ?? "", null);
    };

    const cleanupFs = attachFsWatcher(() => reload());
    const onDispose = () => cleanupFs?.();

    tabbed.addEventListener("tabchange", (event: CustomEvent) => {
        const tabName = event.detail?.tabName;
        const target = tabs.get(tabName);
        if (!target) return;
    });

    document.addEventListener("rs-fs-changed", reload);

    const onMagicPlan = async () => {
        const settings = await loadSettings();
        if (!settings || !settings?.ai || !settings.ai?.apiKey) return;

        const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5-mini");
        if (settings?.ai?.mcp?.serverLabel && settings.ai.mcp.origin && settings.ai.mcp.clientKey && settings.ai.mcp.secretKey) {
            await gptResponses.useMCP(settings.ai.mcp.serverLabel, settings.ai.mcp.origin, settings.ai.mcp.clientKey, settings.ai.mcp.secretKey)?.catch?.(console.warn.bind(console));
        }

        await startTracking?.()?.catch?.(console.warn.bind(console));

        try {
            const source = await loadPlanSource();
            toastSuccess(source ? `Using ${source} for magic plan...` : [
                "Using default preferences for plan...",
            ]?.join?.("\n"));
            await requestNewTimeline(gptResponses, source);
            await reload();
        } catch (e) {
            console.warn(e);
            toastError("Failed to create plan");
        }
    };

    const destroy = () => {
        document.removeEventListener("rs-fs-changed", reload);
        onDispose?.();
    };

    const toolbar = H`<div class="view-toolbar">
        <div class="button-set">
            <button on:click=${onMagicPlan}><ui-icon icon="calendar"></ui-icon><span>Make Timeline Plan</span></button>
        </div>
    </div>`;

    const section = H`<section id="timeline" class="timeline c2-surface">${tabbed}${toolbar}</section>` as HTMLElement;
    (section as any).dispose = destroy;
    return section;
};
