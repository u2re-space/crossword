import { removeFile } from "fest/lure";
import { ModalForm } from "./Modal";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import {
    collectDescriptors,
    buildInitialValues,
    applyDescriptorValues,
    ensureSectionHost,
    cloneEntity,
    fieldDescriptorToSpec
} from "@rs-frontend/elements/entities/deprecated/EntityFields";

//
import { generateEntityId, fixEntityId, type EntityLike } from "@rs-core/template/EntityId";
import { detectEntityTypeByJSON } from "@rs-core/template/EntityUtils";
import { EntityInterface } from "@rs-core/template/EntityInterface";
import type { EntityDescriptor } from "../typed/Types";

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

//
export const makeEntityEdit = async (
    entityItem: EntityInterface<any, any>,
    entityDesc: EntityDescriptor,
    options: EntityEditOptions = {}
): Promise<Record<string, any> | null> => {
    // Auto-detect entity type if not provided
    let entityType = entityItem.type || entityDesc.type || options.entityType || "";
    if (!entityType && entityItem) {
        entityType = detectEntityTypeByJSON(entityItem);
    }
    entityType = entityType.toString().toLowerCase();

    const descriptors = collectDescriptors(entityType, [],/*[{
        name: "entity",
        label: entityDesc.label
    }],*/ Boolean(options.allowLinks));
    const initialValues = buildInitialValues(entityItem, descriptors);

    return new Promise((resolve) => {
        const modal = ModalForm(`Edit ${entityDesc.label}`, async (out) => {
            if (!out) {
                resolve(null);
                return;
            }

            // Validate all fields before submission
            const allValid = Array.from(fieldValidation.values()).every(valid => valid);
            if (!allValid) {
                // Find first invalid field and focus it
                const firstInvalidField = modal.fieldsContainer.querySelector('.modal-field.invalid');
                if (firstInvalidField) {
                    const input = firstInvalidField.querySelector('input, textarea, select') as HTMLElement;
                    input?.focus();
                }
                return; // Don't submit if validation fails
            }

            const applied = applyDescriptorValues(entityItem, descriptors, out as Record<string, any>);

            // Auto-generate ID if requested and not present
            if (options.autoGenerateId !== false && (!applied.id || applied.id.trim() === '')) {
                const entityLike: EntityLike = {
                    id: applied.id,
                    type: entityType,
                    kind: applied.kind,
                    name: applied.name,
                    title: applied.title,
                    properties: applied.properties
                };
                applied.id = generateEntityId(entityLike);
            }

            // Validate entity structure if requested
            if (options.validateEntity !== false) {
                applied.type = entityType;
                if (!applied.properties) applied.properties = {};
            }

            resolve(applied);
        }, {
            description: options.description,
            submitLabel: options.submitLabel
        });

        const sectionHosts = new Map<string, HTMLElement>();
        const fieldValidation = new Map<string, boolean>();

        descriptors.forEach((descriptor) => {
            const host = ensureSectionHost(modal, sectionHosts, descriptor.section);
            const field = modal.addField(fieldDescriptorToSpec(descriptor), initialValues[descriptor.name], host);

            if (field) {
                // Set data attributes for styling
                if (descriptor.multi) field.dataset.multiline = "true";
                if (descriptor.numeric) field.dataset.numeric = "true";
                if (descriptor.json) field.dataset.json = "true";
                if (descriptor.datetime) field.dataset.datetime = "true";

                // Add real-time validation for fields with validators
                if (descriptor.validator && entityItem) {
                    const input = field.querySelector('input, textarea, select') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                    if (input) {
                        const validateField = () => {
                            const value = modal.getValue(descriptor.name);
                            const result = descriptor.validator!(value);
                            const isValid = result === true;
                            fieldValidation.set(descriptor.name, isValid);

                            // Update field styling
                            field.classList.toggle('invalid', !isValid);
                            field.classList.toggle('valid', isValid);

                            // Show error message
                            let errorElement = field.querySelector('.field-error') as HTMLElement;
                            if (!isValid && typeof result === 'string') {
                                if (!errorElement) {
                                    errorElement = document.createElement('div');
                                    errorElement.className = 'field-error';
                                    errorElement.style.color = 'red';
                                    errorElement.style.fontSize = '0.8em';
                                    errorElement.style.marginTop = '4px';
                                    field.appendChild(errorElement);
                                }
                                errorElement.textContent = result;
                            } else if (errorElement) {
                                errorElement.remove();
                            }
                        };

                        input.addEventListener('input', validateField);
                        input.addEventListener('change', validateField);
                        input.addEventListener('blur', validateField);

                        // Initial validation
                        validateField();
                    }
                }
            }
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

//
export const makePath = (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor) => {
    const fileId = entityItem?.id || entityItem?.name;
    return (entityItem as any)?.__path || `${entityDesc.DIR}${(fileId || entityItem?.title)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
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
            const entityType = (entityItem?.type || entityDesc.type || "").toString().toLowerCase();
            const result = await makeEntityEdit(entityItem, entityDesc, { allowLinks: true, entityType });
            if (!result) return;
            try { await writeFileSmart(null, path, new File([JSON.stringify(result, null, 2)], `${entityItem?.id || entityItem?.name}.json`, { type: 'application/json' }), { ensureJson: true }); } catch (e) { console.warn(e); }
            const card = document.querySelector(`.card[data-id="${entityItem?.id || entityItem?.name}"]`);
            if (entityItem?.title) card?.querySelector?.('.card-title li')?.replaceChildren?.(document.createTextNode(entityItem.title));
            if (entityItem?.description) card?.querySelector?.('.card-desc li')?.replaceChildren?.(document.createTextNode(entityItem?.description as string));
            const beginStruct = entityItem?.properties?.begin_time;
            const endStruct = entityItem?.properties?.end_time;
            const beginTime = beginStruct?.iso_date || beginStruct?.date || beginStruct?.timestamp;
            const endTime = endStruct?.iso_date || endStruct?.date || endStruct?.timestamp;
            if (beginTime && endTime) card?.querySelector?.('.card-time li')?.replaceChildren?.(document.createTextNode(`${beginTime} - ${endTime}`));
        }
    }
}
