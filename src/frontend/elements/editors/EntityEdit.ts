import type { EntityInterface } from "@rs-core/template/EntityInterface";
import type { EntityDescriptor } from "../entities/typed/Types";
import { removeFile } from "fest/lure";

// helpful imports (all from `@rs-core/template/*`, such as `EntityUtils`, `EntityId`, etc.)
import { detectEntityTypeByJSON } from "@rs-core/template/EntityUtils";
import { generateEntityId, fixEntityId, type EntityLike } from "@rs-core/template/EntityId";

//
export const makePath = (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor) => {
    const fileId = entityItem?.id || entityItem?.name;
    return (entityItem as any)?.__path || `${entityDesc.DIR}${(fileId || entityItem?.title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
}

//
export type EntityEditOptions = {
    allowLinks?: boolean;
    description?: string;
    submitLabel?: string;
    initialLinks?: string[] | string;
    onLinksChange?: (links: string[]) => void;
    entityType?: string;
    autoGenerateId?: boolean;
    validateEntity?: boolean;
};

// TODO! Needs to be implemented
export const makeEntityEdit = async (
    entityItem: EntityInterface<any, any>,
    entityDesc: EntityDescriptor,
    options: EntityEditOptions = {}
) => {
    /**
     * TODO: Implement entity edit
     */
    return null;
}

//
export const makeEvents = (
    entityItem: EntityInterface<any, any>,
    entityDesc: EntityDescriptor) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            const path = makePath(entityItem, entityDesc);
            try { await removeFile(null, path); } catch (e) { console.warn(e); }
            const card = document.querySelector(`.card[data-id="${entityItem?.id || entityItem?.name}"]`);
            card?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();
            const path = makePath(entityItem, entityDesc);

            /**
             * TODO: Implement edit event
             */
        }
    }
}
