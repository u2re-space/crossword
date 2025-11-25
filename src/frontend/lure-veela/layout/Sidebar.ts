import { H, M, replaceChildren } from "fest/lure";
import { NAVIGATION_SHORTCUTS } from "../../utils/StateStorage";

//
export const applyActive = (name?: string | null, oldView?: string | null, existsViews?: Map<string, any>, _makeView?: (key: string) => any, currentView?: { value: string }) => {
    name = name?.replace?.(/^#/, "") ?? name;
    oldView = oldView?.replace?.(/^#/, "") ?? oldView;

    //
    requestAnimationFrame(() => {
        if (name && (oldView ||= currentView?.value) != name) {
            if (oldView && existsViews?.has?.(oldView)) {
                const existView = existsViews?.get?.(oldView);
                if (existView) {
                    const view = _makeView?.(name) || null;
                    if (view) {
                        replaceChildren(existView?.[0]?.parentNode, view?.[0], null, -1, existView?.[0]);
                        replaceChildren(existView?.[1]?.parentNode, view?.[1], null, -1, existView?.[1]);
                    }
                }
            }
        }
    });
}

//
export const Sidebar: any = (currentView: { value: string }, entityViews, existsViews, _makeView: (key: string) => any) => {
    const fallbackLinks = NAVIGATION_SHORTCUTS.filter(({ view }) => !entityViews?.has?.(view));
    const sidebar = H`<nav slot="sidebar" class="sidebar c2-surface" aria-label="Primary" style="content-visibility: visible"><ul>
${M(entityViews, (frag, name) => H`<li><a target="_self" href="#${name}" data-name="${name}"><ui-icon icon="${frag?.icon}" style="pointer-events: none"></ui-icon><span>${frag?.label}</span></a></li>`)}
${M(fallbackLinks, (frag) => H`<li><a target="_self" href="#${frag.view}" data-name="${frag.view}"><ui-icon icon="${frag.icon}" style="pointer-events: none"></ui-icon><span>${frag.label}</span></a></li>`)}
</ul></nav>`;

    //
    const closeSidebar = () => {
        const host = sidebar.closest("ui-box-with-sidebar") as any;
        if (host?.sidebarOpened?.value) {
            host.sidebarOpened.value = false;
        }
    };

    // navigation wiring for ui-tabbed-box
    sidebar.addEventListener?.("click", (ev: any) => {
        ev?.preventDefault?.();
        const a = ev?.target?.matches?.('a[data-name]') ? ev?.target : ev?.target?.closest?.('a[data-name]');
        if (!a) return;
        const name = a?.getAttribute?.('data-name');

        // reactive INP side effect avoid
        requestAnimationFrame(() => {
            if (currentView && name && name != currentView?.value) { currentView.value = name; };
        });

        //
        closeSidebar();
    });

    //
    return sidebar;
}
