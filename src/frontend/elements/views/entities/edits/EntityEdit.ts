import { removeFile } from "fest/lure";
import { ModalForm, type FieldSpec } from "./Modal";
import {
    collectDescriptors,
    buildInitialValues,
    applyDescriptorValues,
    ensureSectionHost,
    cloneEntity,
    fieldDescriptorToSpec
} from "@rs-frontend/elements/views/entities/edits/SchemaFields";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

export type EntityEditOptions = {
    allowLinks?: boolean;
    description?: string;
    submitLabel?: string;
    initialLinks?: string[] | string;
    onLinksChange?: (links: string[]) => void;
    entityType?: string;
};

//fields: (FieldSpec | null)[]

export const makeEntityEdit = async (
    entityDesc: any,
    fieldDesc: any,
    options: EntityEditOptions = {}
): Promise<Record<string, any> | null> => {
    const entityType = (options.entityType || fieldDesc.basis?.type || entityDesc.type || "").toString().toLowerCase();
    const descriptors = collectDescriptors(entityType, fieldDesc.fields, Boolean(options.allowLinks));
    const initialValues = buildInitialValues(fieldDesc.basis, descriptors);

    return new Promise((resolve) => {
        const modal = ModalForm(`Edit ${entityDesc.label}`, async (out) => {
            if (!out) {
                resolve(null);
                return;
            }
            const applied = applyDescriptorValues(fieldDesc.basis, descriptors, out as Record<string, any>);
            resolve(applied);
        }, {
            description: options.description,
            submitLabel: options.submitLabel
        });

        const sectionHosts = new Map<string, HTMLElement>();
        descriptors.forEach((descriptor) => {
            const host = ensureSectionHost(modal, sectionHosts, descriptor.section);
            const field = modal.addField(fieldDescriptorToSpec(descriptor), initialValues[descriptor.name], host);
            if (descriptor.multi && field) field.dataset.multiline = "true";
            if (descriptor.numeric && field) field.dataset.numeric = "true";
            if (descriptor.json && field) field.dataset.json = "true";
        });

        if (options.allowLinks) {
            const linkField = modal.fieldsContainer.querySelector<HTMLTextAreaElement>('textarea[name="links"]');
            if (linkField) {
                const sync = () => {
                    const links = linkField.value
                        .split(/[\n,;,]+/)
                        .map((chunk) => chunk.trim())
                        .filter(Boolean);
                    options.onLinksChange?.(links);
                };
                linkField.addEventListener('input', sync);
                if (Array.isArray(options.initialLinks)) linkField.value = options.initialLinks.join("\n");
                else if (typeof options.initialLinks === "string") linkField.value = options.initialLinks;

                requestAnimationFrame(async () => {
                    const datalist = document.createElement('datalist');
                    datalist.id = 'links-suggestions';
                    linkField.setAttribute('list', datalist.id);
                    linkField.parentElement?.appendChild(datalist);
                });
            }
        }

        modal.focusFirst();
    });
};

export const objectExcludeNotExists = (object: any) => {
    if (!object) return object;
    if (typeof object == "object" || typeof object == "function") {
        return Object.fromEntries([...Object.entries(object)].filter(([key, value]) => value !== null && value !== undefined));
    }
    return object;
};

export const makeEvents = (
    entityDesc: any,
    fieldDesc: any,
    path: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            try { await removeFile(null, path); } catch (e) { console.warn(e); }

            const fileId = fieldDesc?.basis?.id || fieldDesc?.basis?.name;
            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            card?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();

            const entityType = (fieldDesc.basis?.type || entityDesc.type || "").toString().toLowerCase();
            const result = await makeEntityEdit(entityDesc, fieldDesc, {
                allowLinks: true,
                entityType
            });
            if (!result) return;

            const updated = cloneEntity(result);
            Object.assign(fieldDesc.basis, updated);
            Object.assign(fieldDesc.basis.properties, updated.properties || {});

            const fileId = fieldDesc?.basis?.id || fieldDesc?.basis?.name;

            try {
                const fileName = (path?.split?.('/')?.pop?.() || `${fileId}.json`).replace(/\s+/g, '-');
                const fileDir = path?.split?.('/')?.slice(0, -1)?.join?.('/') + (path?.endsWith?.('/') ? '' : '/');
                const file = new File([JSON.stringify(updated, null, 2)], fileName, { type: 'application/json' });
                await writeFileSmart(null, fileDir, file, { ensureJson: true });
            } catch (e) { console.warn(e); }

            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            if (fieldDesc?.basis?.title) {
                card?.querySelector?.('.card-title li')?.replaceChildren?.(document.createTextNode(fieldDesc.basis.title));
            }
            if (fieldDesc?.basis?.description) {
                card?.querySelector?.('.card-desc li')?.replaceChildren?.(document.createTextNode(fieldDesc.basis.description));
            }
            const beginStruct = fieldDesc?.basis?.properties?.begin_time;
            const endStruct = fieldDesc?.basis?.properties?.end_time;
            const beginTime = beginStruct?.iso_date || beginStruct?.date || beginStruct?.timestamp;
            const endTime = endStruct?.iso_date || endStruct?.date || endStruct?.timestamp;
            if (beginTime && endTime) {
                const timeText = `${beginTime} - ${endTime}`;
                card?.querySelector?.('.card-time li')?.replaceChildren?.(document.createTextNode(timeText));
            }
        }
    }
}
