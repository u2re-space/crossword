import { H, M } from "fest/lure";
import { implementDropEvent, implementPasteEvent } from "../../utils/HookEvent";
import { makeReactive, stringRef} from "fest/object";
import type { ChapterDescriptor, EntityDescriptor } from "@rs-core/utils/Types";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { renderTabName } from "../../utils/Utils";
import { sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { makeActions } from "./Actions";
import { CollectItemsForTabPage, MakeItemBy } from "./Items";

//
export const ViewPage = <
    T extends EntityDescriptor = EntityDescriptor,
    E extends EntityInterface<any, any> = EntityInterface<any, any>,
    C extends ChapterDescriptor = ChapterDescriptor
>(
    entityDesc: T,
    chapters: C[] | (() => C[]),
    filtered: (item: E, desc: C) => boolean,
    availableActions: string[],
    ItemMaker: (entityItem: E, entityDesc: T, options?: any) => any
) => {

    const viewPage: any = {
        $section: null,
        $refresh: () => { }
    };

    //
    const tabsRef = makeReactive(new Map()) as Map<string, HTMLElement | null | string | any>;
    const currentTabRef = stringRef("all");
    const reloadTabs = () => {
        // TODO: add reactive chapters support...
        (typeof chapters === "function" ? chapters() : chapters).map((chap: C) => {
            const key = (chap as any)?.id || (chap as any)?.title || String(chap);
            if (key) {
                if (tabsRef.has(key)) { /* currently, unknown action... */ } else {
                    tabsRef.set(key, () => CollectItemsForTabPage<T, E, C>(
                        entityDesc, chap, chap != null ? filtered : () => true,
                        (entityItem: E) => MakeItemBy<E, T>(entityItem, entityDesc, ItemMaker, {})
                    ))
                }
            }
        })
    }

    //
    viewPage.$refresh = () => { reloadTabs?.(); };
    viewPage.$refresh?.();

    //
    document.addEventListener("rs-fs-changed", (ev) => viewPage.$refresh?.());

    // Replace ui-tabbed-box with BeerCSS tabs
    const tabsContainer = H`<div class="tabs-container">
        <ul class="tabs">
            ${M(tabsRef, (tabEntry) => {
                const [key, tabFactory] = tabEntry;
                const tabName = renderTabName(key);
                return H`<li class="tab"><a href="#tab-${key}" data-tab="${key}" class="${currentTabRef.value === key ? 'active' : ''}">${tabName}</a></li>`;
            })}
        </ul>
        <div class="tabs-content">
            ${M(tabsRef, (tabEntry) => {
                const [key, tabFactory] = tabEntry;
                const tabContent = typeof tabFactory === "function" ? tabFactory() : tabFactory;
                return H`<div id="tab-${key}" class="tab-content ${currentTabRef.value === key ? 'active' : ''}" style="display: ${currentTabRef.value === key ? 'block' : 'none'};">
                    ${tabContent}
                </div>`;
            })}
        </div>
    </div>`;

    // Handle tab switching
    tabsContainer.addEventListener("click", (ev: any) => {
        const target = ev.target?.closest?.('a[data-tab]');
        if (!target) return;
        ev.preventDefault();
        const tabKey = target.getAttribute("data-tab");
        if (tabKey && tabsRef.has(tabKey)) {
            currentTabRef.value = tabKey;

            // Update active tab
            tabsContainer.querySelectorAll(".tab a").forEach((a: any) => {
                a.classList.toggle("active", a.getAttribute("data-tab") === tabKey);
            });

            // Update active content
            tabsContainer.querySelectorAll(".tab-content").forEach((content: any) => {
                const isActive = content.id === `tab-${tabKey}`;
                content.classList.toggle("active", isActive);
                content.style.display = isActive ? "block" : "none";
            });
        }
    });

    //
    const toolbar = H`<div class="view-toolbar">
    <div class="button-set">
        ${makeActions(availableActions, entityDesc, viewPage)}</div>
    </div>`
    const section = H`<section id="${entityDesc.type}" class="viewer-section">${tabsContainer}${toolbar}</section>` as HTMLElement;
    viewPage.$section = section;
    const intake = (payload) => sendToEntityPipeline(payload, { entityType: entityDesc.type }).catch(console.warn);
    implementDropEvent(section, intake);
    implementPasteEvent(section, intake);

    //
    section.addEventListener('contentvisibilityautostatechange', (e: any) => { viewPage.$refresh?.(); });
    section.addEventListener('visibilitychange', (e: any) => { viewPage.$refresh?.(); });
    section.addEventListener('focusin', (e: any) => { viewPage.$refresh?.(); });
    document.addEventListener("rs-fs-changed", () => { viewPage.$refresh?.(); });

    // after append and appear in pages, try to first signal
    requestAnimationFrame(() => {
        if (section?.checkVisibility?.()) {
            viewPage.$refresh?.();
        }
    });

    //
    return section;
}

