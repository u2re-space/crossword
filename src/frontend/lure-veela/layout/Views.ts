import { AppLayout } from "./AppLayout";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";
import { makeReactive, $trigger } from "fest/object";

//
import "fest/fl-ui";

//
import { Sidebar } from "./Sidebar";
import { MakeCardElement } from "../items/Cards";
import { hashTargetRef } from "fest/lure";
import { $byKind, $insideOfDay } from "../../utils/Utils";
import { createCtxMenu, SpeedDial } from "../views/SpeedDial";
import { ViewPage } from "../views/Viewer";

// @ts-ignore
import style from "../scss/index.scss?inline";
import { makeToolbar } from "../items/Actions";
import { Settings } from "../views/Settings";
import { DataExplorer } from "../views/DataExplorer";
import { MakeMarkdownView } from "../views/Markdown";

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
            // Wallpaper drop moved to SpeedDial view
        }
    });
}



//
const generateId = (path: string)=>{
    const filename = path?.split("/")?.pop()?.replace?.(/[^a-zA-Z0-9-_]/g, "-") || "doc";
    const randHash = Math.random().toString(36).slice(2, 6);
    return `${filename}-${randHash}`;
}



//
export const CURRENT_VIEW = hashTargetRef(location.hash || "home", false);
import { startGeoTracking } from "@rs-core/service/GeoService";
import { startTimeTracking, requestNotificationPermission } from "@rs-core/service/TimeService";

export async function frontend(mountElement) {
    await initDOM(document.body);
    await loadInlineStyle(style);

    startGeoTracking();
    startTimeTracking();
    // Ideally this should be triggered by user interaction
    requestNotificationPermission();

    //
    const entityViews = new Map([
        ["task", { icon: "calendar-dots", label: "Plan", groupedBy: "days", tabs: ["pending", "in_progress", "completed", "failed", "delayed", "canceled", "other", "all"], availableActions: ["generate", "debug-gen", "upload", "paste-and-recognize"] }],
        ["event", { icon: "calendar", label: "Event", groupedBy: "days", tabs: ["education", "lecture", "conference", "meeting", "seminar", "workshop", "presentation", "celebration", "opening", "other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["action", { icon: "island", label: "Action", tabs: ["other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["service", { icon: "headset", label: "Service", tabs: ["medical", "education", "consultation", "advice", "mentoring", "training", "item", "thing", "other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["item", { icon: "calculator", label: "Item", groupedBy: "usability", tabs: ["other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["skill", { icon: "hand-palm", label: "Skill", tabs: ["other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["vendor", { icon: "trademark", label: "Vendor", tabs: ["other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["place", { icon: "buildings", label: "Place", groupedBy: "country", tabs: ["other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["factor", { icon: "umbrella", label: "Factor", tabs: ["weather", "health", "family", "relationships", "job", "traffic", "business", "economy", "politics", "news", "other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["person", { icon: "address-book", label: "Contact", tabs: ["dear", "specialist", "consultant", "coach", "mentor", "helper", "assistant", "friend", "family", "relative", "other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }],
        ["bonus", { icon: "ticket", label: "Bonus", groupedBy: "usability", tabs: ["loyalty", "discount", "cashback", "other", "all"], availableActions: ["add", "upload", "paste-and-recognize"] }]
    ])

    //
    const makeEntityView = (entityType: string, entityView?: any) => {
        entityView ??= entityViews.get(entityType);
        if (!entityView) return null;
        const tabOrganizer = entityType == "task" ? $insideOfDay : $byKind;//(item, tab) => true
        return ViewPage({
            label: entityView?.label || entityType,
            type: entityType,
            DIR: (entityType == "task" || entityType == "timeline") ? `/timeline/` : `/data/${entityType}/`
        }, entityView?.tabs || [], tabOrganizer as any, entityView?.availableActions || [], MakeCardElement);
    };



    //
    const existsViews: Map<string, any> = makeReactive(new Map<string, any>()) as Map<string, any>;
    const makeView = (registryKey, props?: any)=>{
        let actions: any = {};
        let element: any = null;

        //
        if (!registryKey) return null;

        //
        if (existsViews.has(registryKey)) {
            if (props?.focus == true || props?.focus == null) {
                CURRENT_VIEW.value = registryKey;
            }
            return existsViews.get(registryKey);
        }

        // exists views
        const entityView = entityViews.get(registryKey);
        if (entityView) {
            element = makeEntityView(registryKey, entityView);
            actions = makeToolbar(entityView?.availableActions || [], {
                label: entityView?.label || registryKey,
                type: registryKey,
                DIR: (registryKey == "task" || registryKey == "timeline") ? `/timeline/` : `/data/${registryKey}/`
            }, element);
        }


        //
        if (registryKey == "settings") {
            element = Settings();
            actions = makeToolbar(["apply-settings", "import-settings", "export-settings"], {
                label: "Settings",
                type: registryKey,
                DIR: `/`
            }, element);
        }

        //
        if (registryKey == "explorer") {
            element = DataExplorer();
            actions = makeToolbar(["file-refresh", "file-upload", "file-mount", "file-download"], {
                label: "File Explorer",
                type: registryKey,
                DIR: `/`
            }, element);
        }

        //
        if (registryKey?.startsWith?.("markdown:")) {
            const path = registryKey.replace("markdown:", "");
            registryKey = generateId(path);
            element = MakeMarkdownView(path, registryKey);
            actions = makeToolbar([], {
                label: path.split("/").pop() || "Markdown",
                type: registryKey,
                DIR: `/`
            }, element);
        }

        //
        if (registryKey == "home") {
            element = SpeedDial(makeView);
            actions = makeToolbar([], {
                label: "",
                type: registryKey,
                DIR: `/`
            }, element);
        }

        //
        if (!element) return;



        // TODO: custom views

        //
        if (element) {
            existsViews.set(registryKey, [actions, element]);
        }

        //
        if (element instanceof Promise) {
            element?.then?.((el)=>{ // provoke re-render of async element
                (existsViews?.get?.(registryKey))[1] = el;
                if (CURRENT_VIEW?.value == registryKey) { CURRENT_VIEW?.[$trigger]?.(); };
            });
        }

        //
        if (props?.focus == true || props?.focus == null) {
            CURRENT_VIEW.value = registryKey;
        }

        //
        return existsViews?.get?.(registryKey);
    }

    //
    const layout = AppLayout(CURRENT_VIEW, existsViews as any, makeView, Sidebar(CURRENT_VIEW, entityViews, makeView));
    mountElement?.append?.(layout);
    mountElement?.append?.(createCtxMenu());

    //
    mountElement?.addEventListener?.("open", (event: CustomEvent) => {
        const { path, item } = event.detail || {};
        const isMd = path?.endsWith?.(".md") || item?.type?.includes?.("markdown") || item?.name?.endsWith?.(".md");
        if (path && isMd) {
            event.preventDefault();
            event.stopPropagation();
            const key = `markdown:${path}`;
            makeView(key, { focus: true });
        }
    });

    //
    implementTestDrop(mountElement);
}

//
export * from "../views/DataExplorer";
export * from "../views/Settings";

//
export default frontend;
