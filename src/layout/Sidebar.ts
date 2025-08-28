import { H } from "fest/lure";

//
export const Sidebar = H`<nav slot="sidebar" class="c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
    <ul>
    <li><a href="#timeline" data-name="timeline">Timeline</a></li>
    <li><a href="#items" data-name="items">Items</a></li>
    <li><a href="#services" data-name="services">Services</a></li>
    <li><a href="#bonuses" data-name="bonuses">Bonuses</a></li>
    </ul>
</nav>`;
