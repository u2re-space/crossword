import { AppLayout, onClose } from "./AppLayout";
import { loadInlineStyle, initialize as initDOM } from "fest/dom";
import { makeReactive, $trigger } from "fest/object";

//
import "fest/fl-ui";

//
import { Sidebar } from "./Sidebar";
import { MakeCardElement } from "../items/Cards";
import { hashTargetRef, initBackNavigation, registerCloseable, registerTask, type ITask } from "fest/lure";
import { $byKind, $insideOfDay } from "../../utils/Utils";
import { createCtxMenu, SpeedDial } from "../views/SpeedDial";
import { ViewPage } from "../views/Viewer";

// @ts-ignore
import style from "../scss/index.scss?inline";
import { makeToolbar } from "../items/Actions";
import { Settings } from "../views/Settings";
import { DataExplorer } from "../views/DataExplorer";
import { MakeMarkdownView } from "../views/Markdown";
import { initGlobalClipboard } from "fest/lure";

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
export const CURRENT_VIEW = hashTargetRef(location.hash || "#home", false);
import { startGeoTracking } from "@rs-core/service/GeoService";
import { startTimeTracking, requestNotificationPermission } from "@rs-core/service/TimeService";
import { initTheme } from "@rs-frontend/utils/Theme";

//
export async function frontend(mountElement) {
    await initDOM(document.body); loadInlineStyle(style); initTheme();

    // Initialize back navigation for mobile back gesture/button support
    initBackNavigation({
        preventDefaultNavigation: false,
        pushInitialState: true
    });

    //
    initGlobalClipboard();
    startGeoTracking();
    startTimeTracking();
    requestNotificationPermission();

    //
    const entityViews = new Map([
        ["task", { icon: "calendar-dots", label: "Plan", groupedBy: "days", tabs: ["all", "pending", "in_progress", "completed", "failed", "delayed", "canceled", "other"], availableActions: ["generate", "debug-gen", "add", "paste-and-recognize", "share-clipboard"] }],
        ["event", { icon: "calendar", label: "Event", groupedBy: "days", tabs: ["all","education", "lecture", "conference", "meeting", "seminar", "workshop", "presentation", "celebration", "opening", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["action", { icon: "island", label: "Action", tabs: ["all", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["service", { icon: "headset", label: "Service", tabs: ["all", "medical", "education", "consultation", "advice", "mentoring", "training", "item", "thing", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["item", { icon: "calculator", label: "Item", groupedBy: "usability", tabs: ["all", "currency", "book", "electronics", "furniture", "medicine", "tools", "software", "consumables", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["skill", { icon: "hand-palm", label: "Skill", tabs: ["all", "skill", "knowledge", "ability", "trait", "experience", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["vendor", { icon: "trademark", label: "Vendor", tabs: ["all", "vendor", "company", "organization", "institution", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["place", { icon: "buildings", label: "Place", groupedBy: "country", tabs: ["all", "placement", "place", "school", "university", "service", "clinic", "pharmacy", "hospital", "library", "market", "location", "shop", "restaurant", "cafe", "bar", "hotel", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["factor", { icon: "umbrella", label: "Factor", tabs: ["all", "weather", "health", "family", "relationships", "job", "traffic", "business", "economy", "politics", "news", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["person", { icon: "address-book", label: "Contact", tabs: ["all", "dear", "specialist", "consultant", "coach", "mentor", "helper", "assistant", "friend", "family", "relative", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }],
        ["bonus", { icon: "ticket", label: "Bonus", groupedBy: "usability", tabs: ["all", "loyalty", "discount", "cashback", "other"], availableActions: ["upload", "paste-and-analyze", "add"] }]
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

    //registerElement
    const addElement = (registryKey: string, toolbarWithElement: [HTMLElement, HTMLElement], existsViews: Map<string, any>) => {
        registryKey = registryKey?.replace?.(/^#/, "") ?? registryKey;
        if (!registryKey || !toolbarWithElement?.[1]) return null;

        //
        if (existsViews.has(registryKey)) {
            return existsViews.get(registryKey);
        } else {
            existsViews.set(registryKey, toolbarWithElement);
        }

        //
        toolbarWithElement[0]?.setAttribute?.("data-view-id", registryKey);
        toolbarWithElement[1]?.setAttribute?.("data-view-id", registryKey);

        //
        const setupBackNav = (el: HTMLElement) => {
            const options: any = {
                id: registryKey,
                priority: registryKey != "home" ? 10 : 0,
                // Pass element as WeakRef for auto-cleanup when detached
                element: new WeakRef(el),
                close: () => {
                    onClose(registryKey, CURRENT_VIEW, existsViews);
                    unregister();
                    return (registryKey != "home" ? false : true);
                },
                isActive: () => (CURRENT_VIEW?.value == registryKey || location.hash == `#${registryKey}`),
                get hashId() { return registryKey; }
            };
            const unregister = registerCloseable(options);
        };

        // also, reassign in array is promise
        if ((toolbarWithElement[0] as any)?.then) {
            (toolbarWithElement[0] as any).then((e) => {
                toolbarWithElement[0] = e;
                e?.setAttribute?.("data-view-id", registryKey);
            });
        }

        // also, reassign in array is promise
        if ((toolbarWithElement[1] as any)?.then) {
            (toolbarWithElement[1] as any).then((e) => {
                toolbarWithElement[1] = e;
                e?.setAttribute?.("data-view-id", registryKey);

                setupBackNav(e);

                // Trigger update efficiently
                if (CURRENT_VIEW?.value == registryKey) {
                    CURRENT_VIEW?.[$trigger]?.();
                }
            });
        } else {
            setupBackNav(toolbarWithElement[1]);
        }

        //
        return existsViews.get(registryKey);
    }

    //
    const existsViews: Map<string, any> = makeReactive(new Map<string, any>()) as Map<string, any>;
    const makeView = (registryKey, props?: any)=>{
        if (!registryKey) return null; registryKey = registryKey?.replace?.(/^#/, "") ?? registryKey;
        if (!registryKey) return null;

        //
        let actions: any = {};
        let element: any = null;

        //
        if (existsViews.has(registryKey)) {
            return existsViews.get(registryKey);
        }

        // exists views
        const entityView = entityViews.get(registryKey);
        if (entityView) {
            // latest LUR.E supports promises for views
            const promised = Promise.withResolvers<any>();
            const toolbarPromise = Promise.withResolvers<any>();

            // Defer heavy view creation
            requestIdleCallback(async () => {
                promised.resolve(element = await makeEntityView(registryKey, entityView));
                toolbarPromise.resolve(actions = await makeToolbar(entityView?.availableActions || [], {
                    label: entityView?.label || registryKey,
                    type: registryKey,
                    DIR: (registryKey == "task" || registryKey == "timeline") ? `/timeline/` : `/data/${registryKey}/`
                }, element));

                //
                const cached = existsViews.get(registryKey);
                if (cached) {
                    cached[0] = actions;
                    cached[1] = element;
                }

                //
                element?.setAttribute?.("data-view-id", registryKey);
                actions?.setAttribute?.("data-view-id", registryKey);
            });

            // use by promise
            element = promised.promise;
            actions = toolbarPromise.promise;
            return addElement(registryKey, [actions, element], existsViews);
        }

        //
        if (registryKey == "settings") {
            element = Settings();
            actions = makeToolbar(["apply-settings", "import-settings", "export-settings", "paste-and-recognize", "share-clipboard"], {
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
            // TODO: handle props support
            element = SpeedDial((view, props) => { CURRENT_VIEW.value = view; });
            actions = makeToolbar([], {
                label: "",
                type: registryKey,
                DIR: `/`
            }, element);
        }

        //
        if (!element) return;

        //
        if (element && !existsViews.has(registryKey)) {
            return addElement(registryKey, [actions, element], existsViews);
        }

        //
        return;
    }

    //
    const $sidebar = Sidebar(CURRENT_VIEW, entityViews, existsViews, makeView);
    const layout = AppLayout(CURRENT_VIEW, existsViews as any, makeView, $sidebar);
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
