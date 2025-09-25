import { H, remove, removeFile } from "fest/lure";
import { writeFileSmart } from "@rs-core/workers/FileSystem";
import { ModalForm, type FieldSpec } from "./Modal";
import { MOCElement } from "fest/dom";

//
export const makeEntityEdit = async (
    title: string,
    fields: (FieldSpec | null)[],
    initial: Record<string, any> = {}
): Promise<Record<string, any> | null> => {
    return new Promise((resolve) => {
        const inputs = new Map<string, HTMLInputElement>();
        const form = ModalForm(title, inputs, resolve);
        if (!form) return null;

        //
        const fieldsHolder = form.querySelector('.modal-fields') as HTMLElement;
        for (const f of fields) {
            if (!f) continue;
            const value = initial?.[f.name] ?? '';
            const input = H`<input name=${f.name} type=${f.type || 'text'} placeholder=${f.placeholder || ''} value=${String(value)} />` as HTMLInputElement;
            inputs.set(f.name, input);
            fieldsHolder.appendChild(H`<label class="modal-field"><span class="label">${f.label}</span>${input}</label>`);
        }

        // autofocus first input
        (form.querySelector('input') as HTMLInputElement | null)?.focus?.();
    });
}

//
export const objectExcludeNotExists = (object: any) => {
    return Object.fromEntries([...Object.entries(object)].filter(([key, value]) => value !== null && value !== undefined));
}

//
export const makeEvents = (label: string, path: string, title: string, basis: any, kind: string) => {
    const properties = basis?.properties || {};

    //
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete ${label} "${title}"?`)) return;

            //
            try { await removeFile(null, path); } catch (e) { console.warn(e); }

            //
            const fileId = basis?.id || basis?.name || basis?.desc?.name;
            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            card?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();

            const fields = [
                { name: 'title', label: 'Title' },
                { name: 'kind', label: 'Kind' },
                { name: 'price', label: 'Price' },
                { name: 'description', label: 'Description' },
                { name: 'begin_time', label: 'Begin time', placeholder: 'YYYY-MM-DD or HH:MM' },
                { name: 'end_time', label: 'End time', placeholder: 'YYYY-MM-DD or HH:MM' },
                properties?.contacts?.email ? { name: 'email', label: 'Email' } : null,
                properties?.contacts?.phone ? { name: 'phone', label: 'Phone' } : null
            ]?.map(f => f ? f : null)?.filter(f => f);

            //
            const initials = objectExcludeNotExists({
                title, kind, price: properties?.price || 0,
                description: basis?.desc?.description || "",
                begin_time: properties?.begin_time || "",
                end_time: properties?.end_time || "",
                email: properties?.contacts?.email?.[0] || '',
                phone: properties?.contacts?.phone?.[0] || '',
            });

            //
            let result = await makeEntityEdit('Edit ' + label, fields, initials);
            if (!result) return; result = objectExcludeNotExists(result);

            //
            const updated = Object.assign(basis, objectExcludeNotExists({
                kind: result?.kind || kind,
                desc: Object.assign(basis?.desc || {}, objectExcludeNotExists({
                    title: result?.title,
                    description: result?.description
                })),
                properties: Object.assign(basis?.properties || {}, objectExcludeNotExists({
                    price: result?.price,
                    begin_time: result?.begin_time,
                    end_time: result?.end_time,
                    contacts: Object.assign(basis?.properties?.contacts || {}, objectExcludeNotExists({
                        email: result?.email ? [result?.email] : null,
                        phone: result?.phone ? [result?.phone] : null
                    }))
                }))
            }));

            //
            const fileId = basis?.id || basis?.name || basis?.desc?.name;

            //
            try {
                const fileName = (path?.split?.('/')?.pop?.() || `${fileId}.json`).replace(/\s+/g, '-');
                const fileDir = path?.split?.('/')?.slice(0, -1)?.join?.('/') + (path?.endsWith?.('/') ? '' : '/');
                const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
                await writeFileSmart(null, fileDir, file, { ensureJson: true });
            } catch (e) { console.warn(e); }

            //
            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            if (updated?.desc?.title) {
                card?.querySelector?.('.card-title li')?.replaceChildren?.(document.createTextNode(updated?.desc?.title));
            }
            if (updated?.desc?.description) {
                card?.querySelector?.('.card-desc li')?.replaceChildren?.(document.createTextNode(updated?.desc?.description));
            }
            if (updated?.properties?.begin_time && updated?.properties?.end_time) {
                card?.querySelector?.('.card-time li')?.replaceChildren?.(document.createTextNode(`${updated?.properties?.begin_time} - ${updated?.properties?.end_time}`));
            }
        }
    }
}
