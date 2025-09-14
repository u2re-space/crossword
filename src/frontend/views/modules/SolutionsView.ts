/* Here will be math, coding, etc. questions (and answers by AI) */
/* Used for solving problems and questions by AI */

import { H, M } from "fest/lure";

//
const SOLUTIONS_DIR = "/docs/solutions/";

//
const AllSolutions = () => {
    const solutions = M([], (solution) => {
        return H`<div class="solution-item"></div>`;
    });
    return H`<div data-name="all" class="content">${solutions}</div>`;
}

//
const ProblemsSolutions = () => {
    const solutions = M([], (solution) => {
        return H`<div class="solution-item"></div>`;
    });
    return H`<div data-name="problems" class="content">${solutions}</div>`;
}

//
const CodingSolutions = () => {
    const solutions = M([], (solution) => {
        return H`<div class="solution-item"></div>`;
    });
    return H`<div data-name="coding" class="content">${solutions}</div>`;
}

//
const MathSolutions = () => {
    const solutions = M([], (solution) => {
        return H`<div class="solution-item"></div>`;
    });
    return H`<div data-name="math" class="content">${solutions}</div>`;
}

//
const tabs = new Map<string, HTMLElement>([
    ["problems", ProblemsSolutions()],
    ["coding", CodingSolutions()],
    ["math", MathSolutions()],
    ["all", AllSolutions()]
]);

//
const renderTabName = (tabName: string) => {
    return tabName;
}

//
export const SolutionsView = () => {
    const tabbed = H`<ui-tabbed-box
        prop:tabs=${tabs}
        prop:renderTabName=${renderTabName}
        style="background-color: transparent;"
        class="all"
    ></ui-tabbed-box>`;

    //
    return H`<section class="solutions-view">${tabbed}</section>`;
}
