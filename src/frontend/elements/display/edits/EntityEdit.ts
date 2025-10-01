import { removeFile } from "fest/lure";
import { ModalForm, type FieldSpec } from "./Modal";
import {
    collectDescriptors,
    buildInitialValues,
    applyDescriptorValues,
    ensureSectionHost,
    cloneEntity,
    fieldDescriptorToSpec
} from "@rs-frontend/elements/display/edits/SchemaFields";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

export type EntityEditOptions = {
    allowLinks?: boolean;
    description?: string;
    submitLabel?: string;
    initialLinks?: string[] | string;
    onLinksChange?: (links: string[]) => void;
    entityType?: string;
};

export const makeEntityEdit = async (
    label: string,
    fields: (FieldSpec | null)[],
    basis: any = {},
    options: EntityEditOptions = {}
): Promise<Record<string, any> | null> => {
    const entityType = (options.entityType || basis?.type || label || "").toString().toLowerCase();
    const descriptors = collectDescriptors(entityType, fields, Boolean(options.allowLinks));
    const initialValues = buildInitialValues(basis, descriptors);

    return new Promise((resolve) => {
        const modal = ModalForm(`Edit ${label}`, async (out) => {
            if (!out) {
                resolve(null);
                return;
            }
            const applied = applyDescriptorValues(basis, descriptors, out as Record<string, any>);
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

export const makeEvents = (label: string, path: string, title: string, basis: any, kind: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete ${label} "${title}"?`)) return;

            try { await removeFile(null, path); } catch (e) { console.warn(e); }

            const fileId = basis?.id || basis?.name;
            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            card?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();

            const entityType = (basis?.type || label || "").toString().toLowerCase();
            const result = await makeEntityEdit(label, [], basis, {
                allowLinks: true,
                entityType
            });
            if (!result) return;

            const updated = cloneEntity(result);
            Object.assign(basis, updated);
            Object.assign(basis.properties, updated.properties || {});

            const fileId = basis?.id || basis?.name;

            try {
                const fileName = (path?.split?.('/')?.pop?.() || `${fileId}.json`).replace(/\s+/g, '-');
                const fileDir = path?.split?.('/')?.slice(0, -1)?.join?.('/') + (path?.endsWith?.('/') ? '' : '/');
                const file = new File([JSON.stringify(updated, null, 2)], fileName, { type: 'application/json' });
                await writeFileSmart(null, fileDir, file, { ensureJson: true });
            } catch (e) { console.warn(e); }

            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            if (basis?.title) {
                card?.querySelector?.('.card-title li')?.replaceChildren?.(document.createTextNode(basis.title));
            }
            if (basis?.description) {
                card?.querySelector?.('.card-desc li')?.replaceChildren?.(document.createTextNode(basis.description));
            }
            const beginStruct = basis?.properties?.begin_time;
            const endStruct = basis?.properties?.end_time;
            const beginTime = beginStruct?.iso_date || beginStruct?.date || beginStruct?.timestamp;
            const endTime = endStruct?.iso_date || endStruct?.date || endStruct?.timestamp;
            if (beginTime && endTime) {
                const timeText = `${beginTime} - ${endTime}`;
                card?.querySelector?.('.card-time li')?.replaceChildren?.(document.createTextNode(timeText));
            }
        }
    }
}
