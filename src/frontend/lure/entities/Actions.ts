import type { EntityDescriptor } from "@rs-core/utils/Types";
import { H } from "fest/lure";
import { actionRegistry, iconsPerAction, labelsPerAction } from "@rs-frontend/utils/Actions";

//
const generateActionButton = (action: string, entityDesc: EntityDescriptor, viewPage?: any) => {
    return H`<button type="button" on:click=${(e: any) => actionRegistry.get(action)?.(e, entityDesc, viewPage)}>
        <ui-icon icon=${iconsPerAction.get(action)}></ui-icon>
        <span>${labelsPerAction.get(action)?.(entityDesc)}</span>
    </button>`;
}

//
export const makeActions = (actions: string[], entityDesc: EntityDescriptor, viewPage?: any) => {
    return actions.map((action) => generateActionButton(action, entityDesc, viewPage));
}
