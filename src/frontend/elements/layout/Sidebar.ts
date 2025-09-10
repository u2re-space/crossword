import { H } from "fest/lure";

//
export const Sidebar = H`<nav slot="sidebar" class="c2-surface" style="background-color: --c2-surface(0.05, var(--current, currentColor));">
    <ul>
    <li><a href="#timeline" data-name="timeline"><ui-icon icon="clock"></ui-icon><span>Timeline</span></a></li>
    <li><a href="#items" data-name="items"><ui-icon icon="books"></ui-icon><span>Items</span></a></li>
    <li><a href="#services" data-name="services"><ui-icon icon="headset"></ui-icon><span>Services</span></a></li>
    <li><a href="#bonuses" data-name="bonuses"><ui-icon icon="ticket"></ui-icon><span>Bonuses</span></a></li>
    </ul>
</nav>`;

// navigation wiring for ui-tabbed-box
Sidebar.addEventListener?.("click", (ev: any)=>{
    const a = ev?.target?.closest?.('a[data-name]');
    if (!a) return;
    ev.preventDefault();
    const name = a.getAttribute('data-name');
    const owner = Sidebar.getRootNode?.()?.host || document;
    const tabbed: any = owner?.querySelector?.('ui-tabbed-box');
    tabbed?.openTab?.(name);
});
