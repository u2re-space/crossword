import { H } from "fest/lure";

//
export const Sidebar: any = (currentView: any) => {
    const sidebar = H`<nav slot="sidebar" class="c2-surface" style="background-color: --c2-surface(0.02, var(--current, currentColor));"><ul>
    <li><a target="_self" href="#timeline" data-name="timeline"><ui-icon icon="clock"></ui-icon><span>Timeline</span></a></li>
    <li><a target="_self" href="#bonuses" data-name="bonuses"><ui-icon icon="ticket"></ui-icon><span>Bonuses</span></a></li>
    <li><a target="_self" href="#contacts" data-name="contacts"><ui-icon icon="user"></ui-icon><span>Contacts</span></a></li>
    <li><a target="_self" href="#services" data-name="services"><ui-icon icon="headset"></ui-icon><span>Services</span></a></li>
    <li><a target="_self" href="#quests" data-name="quests"><ui-icon icon="code"></ui-icon><span>Solutions</span></a></li>
    <li><a target="_self" href="#preferences" data-name="preferences"><ui-icon icon="user-gear"></ui-icon><span>Preferences</span></a></li>
    <li><a target="_self" href="#explorer" data-name="explorer"><ui-icon icon="books"></ui-icon><span>Explorer</span></a></li>
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
