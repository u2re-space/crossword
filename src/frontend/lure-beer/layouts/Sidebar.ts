import { observableByMap } from "fest/object";
import { H, M } from "fest/lure";
import { UIPhosphorIcon } from "fest/icon";

//
export const Sidebar: any = (currentView: { value: string }, entityViews: any) => {
    const sidebar = H`<nav class="sidebar" style="background-color: var(--surface-variant, #f5f5f5);">
        <ul class="collection">
            ${M(observableByMap(entityViews), (frag) => {
                const icon = H`<ui-phosphor-icon icon="${frag[1].icon}" style="width: 1.25rem; height: 1.25rem;"></ui-phosphor-icon>` as HTMLElement;
                return H`<li class="collection-item"><a target="_self" href="#${frag[0]}" data-name="${frag[0]}" class="waves-effect">${icon}<span>${frag[1].label}</span></a></li>`;
            })}
            <li class="collection-item"><a target="_self" href="#quests" data-name="quests" class="waves-effect"><ui-phosphor-icon icon="seal-question" style="width: 1.25rem; height: 1.25rem;"></ui-phosphor-icon><span>Quests</span></a></li>
            <li class="collection-item"><a target="_self" href="#preferences" data-name="preferences" class="waves-effect"><ui-phosphor-icon icon="user-gear" style="width: 1.25rem; height: 1.25rem;"></ui-phosphor-icon><span>Preferences</span></a></li>
            <li class="collection-item"><a target="_self" href="#explorer" data-name="explorer" class="waves-effect"><ui-phosphor-icon icon="books" style="width: 1.25rem; height: 1.25rem;"></ui-phosphor-icon><span>Explorer</span></a></li>
            <li class="collection-item"><a target="_self" href="#settings" data-name="settings" class="waves-effect"><ui-phosphor-icon icon="gear" style="width: 1.25rem; height: 1.25rem;"></ui-phosphor-icon><span>Settings</span></a></li>
        </ul>
    </nav>`;

    if (currentView) {
        currentView.value ||= [...entityViews?.keys?.()]?.[0] || currentView.value;
    }

    // navigation wiring
    sidebar.addEventListener?.("click", (ev: any) => {
        ev?.preventDefault?.();
        const a = ev?.target?.matches?.('a[data-name]') ? ev?.target : ev?.target?.closest?.('a[data-name]');
        if (!a) return; 
        const name = a?.getAttribute?.('data-name');
        if (currentView) currentView.value = name || currentView.value;
    });

    //
    return sidebar;
}

