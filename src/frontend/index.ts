import { AppLayout } from "./elements/layouts/AppLayout";
import { $byKind, $insideOfDay, DataExplorer, PreferencesView, QuestsView, Settings, ViewPage } from "./elements/Views";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";

//
import "fest/fl-ui";

// @ts-ignore
import style from "./index.scss?inline";
import { Sidebar } from "./elements/layouts/Sidebar";
import { MakeCardElement } from "./elements/entities/typed/Cards";

//
import { dropFile, H, hashTargetRef } from "fest/lure";
import { startDebugTaskGeneration } from "@rs-core/workers/DebugTaskGenerator";

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
export const CURRENT_VIEW = hashTargetRef(location.hash || "task", false);
export default async function frontend(mountElement) {
    initDOM(document.body);
    loadInlineStyle(style);

    //
    const entityViews = new Map([
        ["task", { icon: "calendar-dots", label: "Plan", groupedBy: "days", tabs: ["pending", "in_progress", "completed", "failed", "delayed", "canceled", "other", "all"], availableActions: ["generate", "debug-gen", "upload"] }],
        ["event", { icon: "calendar", label: "Event", groupedBy: "days", tabs: ["education", "lecture", "conference", "meeting", "seminar", "workshop", "presentation", "celebration", "opening", "other", "all"], availableActions: ["upload", "add"] }],
        ["action", { icon: "island", label: "Action", tabs: ["other", "all"], availableActions: ["add", "upload"] }],
        ["service", { icon: "headset", label: "Service", tabs: ["medical", "education", "consultation", "advice", "mentoring", "training", "item", "thing", "other", "all"], availableActions: ["add", "upload"] }],
        ["item", { icon: "calculator", label: "Item", groupedBy: "usability", tabs: ["other", "all"], availableActions: ["add", "upload"] }],
        ["skill", { icon: "hand-palm", label: "Skill", tabs: ["other", "all"], availableActions: ["add", "upload"] }],
        ["vendor", { icon: "trademark", label: "Vendor", tabs: ["other", "all"], availableActions: ["add", "upload"] }],
        ["place", { icon: "buildings", label: "Place", groupedBy: "country", tabs: ["other", "all"], availableActions: ["add", "upload"] }],
        ["factor", { icon: "umbrella", label: "Factor", tabs: ["weather", "health", "family", "relationships", "job", "traffic", "business", "economy", "politics", "news", "other", "all"], availableActions: ["add", "upload"] }],
        ["person", { icon: "address-book", label: "Contact", tabs: ["dear", "specialist", "consultant", "coach", "mentor", "helper", "assistant", "friend", "family", "relative", "other", "all"], availableActions: ["add", "upload"] }],
        ["bonus", { icon: "ticket", label: "Bonus", groupedBy: "usability", tabs: ["loyalty", "discount", "cashback", "other", "all"], availableActions: ["add", "upload"] }]
    ])

    //
    const makeEntityView = (entityType: string, entityView?: any) => {
        entityView ??= entityViews.get(entityType);
        if (!entityView) return null;
        const tabOrganizer = entityType == "task" ? $insideOfDay : $byKind;//(item, tab) => true
        return () => ViewPage({
            label: entityView?.label || entityType,
            type: entityType,
            DIR: (entityType == "task" || entityType == "timeline") ? `/timeline/` : `/data/${entityType}/`
        }, entityView?.tabs || [], tabOrganizer as any, entityView?.availableActions || [], MakeCardElement);
    };

    //
    const views = new Map<any, any>([
        ["preferences", () => PreferencesView()],
        ["quests", () => QuestsView()],
        ["explorer", () => DataExplorer()],
        ["settings", await Settings()],
        ...(await Promise.all(
            Array.from(entityViews.entries())
                .map(async ([entityType, entityView]) => [entityType, await makeEntityView(entityType, entityView)])
        ))?.filter(([entityType, entityView]) => entityView) as [string, HTMLElement | null | string | any][]
    ]);

    //
    const layout = AppLayout(views, CURRENT_VIEW, Sidebar(CURRENT_VIEW, entityViews));
    mountElement?.append?.(layout);
    implementTestDrop(mountElement);

    //
    //startDebugTaskGeneration();
}
