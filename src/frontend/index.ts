import { AppLayout, CURRENT_VIEW } from "./elements/layouts/AppLayout";
import { DataExplorer, PreferencesView, QuestsView, Settings, ViewPage } from "./elements/Views";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";

//
import "fest/fl-ui";

// @ts-ignore
import style from "./index.scss?inline";
import { sampleDays } from "../$test/Days";
import { Sidebar } from "./elements/layouts/Sidebar";
import { MakeCardElement } from "./elements/entities/typed/Cards";

//
import { dropFile, H } from "fest/lure";
import { sampleTasks, writeSampleTask } from "../$test/Tasks";

//
const implementTestDrop = (mountElement: HTMLElement) => {
    //
    mountElement?.addEventListener?.("dragover", (event) => {
        const eventTarget = event?.target as HTMLElement;
        if (eventTarget?.matches?.("#app") || eventTarget?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });

    //
    mountElement?.addEventListener?.("drop", (event) => {
        const eventTarget = event?.target as HTMLElement;
        if (eventTarget?.matches?.("#app") || eventTarget?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer?.files[0];
            if (file && file.type.startsWith("image/")) { dropFile(file, "/images/")?.catch?.(console.warn.bind(console)); }
        }
    });
}

//
export default async function frontend(mountElement) {
    initDOM(document.body);
    loadInlineStyle(style);

    //
    await (async () => {
        //await clearAllInDirectory()?.catch?.(console.warn.bind(console));
        await Promise.all(sampleTasks.map((task) => writeSampleTask(task)?.catch?.(console.warn.bind(console))));
    })();

    //
    const entityViews = new Map([
        ["task", { icon: "task", label: "Task", groupedBy: "days", tabs: ["pending", "in_progress", "completed", "failed", "delayed", "canceled", "other", "all"] }],
        ["event", { icon: "event", label: "Event", groupedBy: "days", tabs: ["education", "lecture", "conference", "meeting", "seminar", "workshop", "presentation", "celebration", "opening", "other", "all"] }],
        ["action", { icon: "action", label: "Action", tabs: ["other", "all"] }],
        ["service", { icon: "service", label: "Service", tabs: ["medical", "education", "consultation", "advice", "mentoring", "training", "item", "thing", "other", "all"] }],
        ["item", { icon: "item", label: "Item", groupedBy: "usability", tabs: ["other", "all"] }],
        ["skill", { icon: "skill", label: "Skill", tabs: ["other", "all"] }],
        ["vendor", { icon: "vendor", label: "Vendor", tabs: ["other", "all"] }],
        ["place", { icon: "place", label: "Place", groupedBy: "country", tabs: ["other", "all"] }],
        ["factor", { icon: "factor", label: "Factor", tabs: ["weather", "health", "family", "relationships", "job", "traffic", "business", "economy", "politics", "news", "other", "all"] }],
        ["person", { icon: "person", label: "Person", tabs: ["dear", "specialist", "consultant", "coach", "mentor", "helper", "assistant", "friend", "family", "relative", "other", "all"] }],
        ["bonus", { icon: "bonus", label: "Bonus", groupedBy: "usability", tabs: ["loyalty", "discount", "cashback", "other", "all"] }]
    ])

    //
    const makeEntityView = async (entityType: string, entityView?: any) => {
        entityView ??= entityViews.get(entityType);
        if (!entityView) return null;
        // TODO: viable tab organizer
        const tabOrganizer = (item, tab) => true

        // TODO: adding `groupedBy` separators support
        return await ViewPage({
            label: entityView?.label || entityType,
            type: entityType,
            DIR: `/entities/${entityType}/`
        }, entityView?.tabs || [], tabOrganizer, MakeCardElement);
    }

    //
    const views = new Map<any, any>([
        ["preferences", await PreferencesView()],
        ["quests", await QuestsView()],
        ["explorer", await DataExplorer()],
        ["settings", await Settings()],
        ...(await Promise.all(
            Array.from(entityViews.entries())
                .map(async ([entityType, entityView]) => [entityType, await makeEntityView(entityType, entityView)])
        ))?.filter(([entityType, entityView]) => entityView) as [string, HTMLElement | null | string | any][],
    ]);

    //
    CURRENT_VIEW.value = [...views?.keys?.()]?.[0] || CURRENT_VIEW.value;
    const layout = AppLayout(views, CURRENT_VIEW, Sidebar(CURRENT_VIEW, entityViews));
    mountElement?.append?.(layout);
    implementTestDrop(mountElement);
}
