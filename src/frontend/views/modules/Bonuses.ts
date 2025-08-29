import { H } from "fest/lure";

export const BonusesView = () => {
    return H`<section class="c2-surface view view-bonuses" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <h2>Bonuses</h2>
        <div class="cards-grid"></div>
    </section>`;
};
