import { H } from "fest/lure";

export const ItemsView = () => {
    return H`<section class="c2-surface view view-items" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <h2>Items</h2>
        <div class="cards-grid"></div>
    </section>`;
};


