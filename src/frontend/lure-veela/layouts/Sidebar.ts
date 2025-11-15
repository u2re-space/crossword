import { observableByMap, subscribe, addToCallChain } from "fest/object";
import { H, M } from "fest/lure";

//
export const Sidebar: any = (currentView: { value: string }, entityViews, makeView: (key: string)=>any) => {

    //
    const sidebar = H`<nav slot="sidebar" class="sidebar c2-surface" aria-label="Primary"><ul>
    ${M(entityViews, (frag, name) => H`<li><a target="_self" href="#${name}" data-name="${name}"><ui-icon icon="${frag?.icon}"></ui-icon><span>${frag?.label}</span></a></li>`)}
    <li><a target="_self" href="#explorer" data-name="explorer"><ui-icon icon="books"></ui-icon><span>Explorer</span></a></li>
    <li><a target="_self" href="#settings" data-name="settings"><ui-icon icon="gear"></ui-icon><span>Settings</span></a></li>
</ul></nav>`;

    if (currentView) {
        currentView.value ||= [...entityViews?.keys?.()]?.[0] || currentView.value;
    }

    const normalize = (name?: string | null) => (name ?? "").replace(/^#/, "");
    let lastActiveName: string | null = null;

    const applyActive = (name?: string | null) => {
        const activeName = normalize(name) || normalize(currentView?.value);
        if (!activeName || activeName === lastActiveName) {
            return;
        }

        const links = sidebar.querySelectorAll('a[data-name]') as NodeListOf<HTMLAnchorElement>;
        let nextActive: HTMLAnchorElement | undefined = undefined;

        //
        links.forEach((link: HTMLAnchorElement) => {
            const isActive = normalize(link.dataset.name) === activeName;
            if (isActive) {
                link.setAttribute("data-active", "true");
                link.setAttribute("aria-current", "page");
                link.parentElement?.setAttribute?.("data-active", "true");
                nextActive = link;
            } else {
                link.removeAttribute("data-active");
                link.removeAttribute("aria-current");
                link.parentElement?.removeAttribute?.("data-active");
            }
        });

        //
        lastActiveName = nextActive ? (normalize((nextActive as any)?.name || (nextActive as any)?.dataset?.name) || activeName) : null;
    };

    applyActive(currentView?.value);

    const unsubscribe = currentView
        ? subscribe([currentView, "value"], (nextValue) => applyActive(nextValue as string))
        : null;

    const hashListener = () => applyActive(window.location.hash);

    window.addEventListener("hashchange", hashListener, { passive: true });

    const closeSidebar = () => {
        const host = sidebar.closest("ui-box-with-sidebar") as any;
        if (host?.sidebarOpened?.value) {
            host.sidebarOpened.value = false;
        }
    };

    addToCallChain(sidebar, Symbol.dispose, () => {
        if (typeof unsubscribe == "function") {
            unsubscribe();
        } else if (unsubscribe?.[Symbol.dispose]) {
            unsubscribe[Symbol.dispose]();
        }
        window.removeEventListener("hashchange", hashListener);
    });

    // navigation wiring for ui-tabbed-box
    sidebar.addEventListener?.("click", (ev: any) => {
        ev?.preventDefault?.();
        const a = ev?.target?.matches?.('a[data-name]') ? ev?.target : ev?.target?.closest?.('a[data-name]');
        if (!a) return;
        const name = a?.getAttribute?.('data-name');
        applyActive(name);
        if (currentView) currentView.value = name || currentView.value;
        closeSidebar();
    });

    //
    return sidebar;
}
