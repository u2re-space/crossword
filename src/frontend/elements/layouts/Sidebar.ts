import { observableByMap } from "fest/object";
import { H, M } from "fest/lure";

//
export const Sidebar: any = (currentView: any, entityViews: any) => {
    const sidebar = H`<nav slot="sidebar" class="sidebar c2-surface" style="background-color: --c2-surface(0.02, var(--current, currentColor));"><ul>
    ${M(observableByMap(entityViews), (frag) => H`<li><a target="_self" href="#${frag[0]}" data-name="${frag[0]}"><ui-icon icon="${frag[1].icon}"></ui-icon><span>${frag[1].label}</span></a></li>`)}
    <li><a target="_self" href="#quests" data-name="quests"><ui-icon icon="seal-question"></ui-icon><span>Quests</span></a></li>
    <li><a target="_self" href="#preferences" data-name="preferences"><ui-icon icon="user-gear"></ui-icon><span>Preferences</span></a></li>
    <li><a target="_self" href="#explorer" data-name="explorer"><ui-icon icon="books"></ui-icon><span>Explorer</span></a></li>
    <li><a target="_self" href="#settings" data-name="settings"><ui-icon icon="gear"></ui-icon><span>Settings</span></a></li>
</ul></nav>`;

    // navigation wiring for ui-tabbed-box
    sidebar.addEventListener?.("click", (ev: any) => {
        const a = ev?.target?.matches?.('a[data-name]') ? ev?.target : ev?.target?.closest?.('a[data-name]');
        if (!a) return; const name = a?.getAttribute?.('data-name');
        if (currentView) currentView.value = name || currentView.value;
    });

    //
    return sidebar;
}
