import { openFormModal } from "@rs-frontend/elements/overlays/Modal";
import { MOCElement } from "fest/dom";
import { makeReactive } from "fest/object";
import { getDirectoryHandle, H, M, remove, writeFile } from "fest/lure";
import { bindDropToDir } from "@rs-frontend/utils/FileOps";

//
export const beginDragAsText = (ev: DragEvent) => {
    //ev?.preventDefault?.();
    //ev?.stopPropagation?.();
    const text = (ev.currentTarget as HTMLElement)?.textContent?.trim?.();
    if (text) {
        ev.dataTransfer!.effectAllowed = "copy";
        ev.dataTransfer?.clearData?.();
        ev.dataTransfer?.setData?.("plain/text", text);
    }
}

//
export const copyPhoneClick = (ev) => {
    const isPhoneElement = (ev.currentTarget as HTMLElement)?.matches?.('.phone') ? ev.currentTarget : ev.currentTarget?.querySelector?.('.phone');

    if (isPhoneElement) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        const phone = isPhoneElement?.textContent?.trim?.();
        if (phone) { navigator.clipboard.writeText(phone); }
    }
}

//
export const copyEmailClick = (ev) => {
    const isEmailElement = (ev.currentTarget as HTMLElement)?.matches?.('.email') ? ev.currentTarget : ev.currentTarget?.querySelector?.('.email');

    if (isEmailElement) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        const email = isEmailElement?.textContent?.trim?.();
        if (email) { navigator.clipboard.writeText(email); }
    }
}

//
export const formatText = (text: string) => {
    return H`<span draggable="true" data-action="copy-text" class="text">${text?.trim?.()}</span>`;
}

//
export const formatEmail = (email: string) => {
    return H`<a on:dragstart=${beginDragAsText} draggable="true" data-action="copy-email" class="email" href="mailto:${email?.trim?.()}" on:click=${copyEmailClick}>${email?.trim?.()}</a>`;
}

//
export const formatPhone = (phone: string) => {
    // needs to replace +7 into 8, remove spaces and non-digits, remove parentheses
    let text = phone?.replace?.(/\+7/g, '8').replace?.(/\s+/g, '').replace?.(/[^0-9]/g, '');
    text = text?.replace?.(/\(/g, '').replace?.(/\)/g, '');
    text = text?.replace?.(/\s+/g, '').replace?.(/[^0-9]/g, '');
    return H`<a on:dragstart=${beginDragAsText} draggable="true" data-action="copy-phone" class="phone" href="tel:${text?.trim?.()}" on:click=${copyPhoneClick}>${text?.trim?.()}</a>`;
}

//
export const wrapAsListItem = (label: string | any, item: any) => {
    if (label) {
        return H`<li>${label}: ${item}</li>`;
    }
    return H`<li>${item}</li>`;
}



//
export const formatTextList = (label: string | any, text: string | string[] | any[]) => {
    if (typeof text == "string") {
        return wrapAsListItem(label, formatText(text));
    }
    return M(text, (frag: any) => wrapAsListItem(label, formatText(frag)));
};

//
export const formatEmailList = (label: string | any, emails: string | string[] | any[]) => {
    if (typeof emails == "string") {
        return wrapAsListItem(label, formatEmail(emails));
    }
    return M(emails, (email: string) => wrapAsListItem(label, formatEmail(email)));
}

//
export const formatPhoneList = (label: string | any, phones: string | string[] | any[]) => {
    if (typeof phones == "string") {
        return wrapAsListItem(label, formatPhone(phones));
    }
    return M(phones, (phone: string) => wrapAsListItem(label, formatPhone(phone)));
}



//
export const formatByCondition = (label: string | any, text: string | string[] | any[], key: string | null = null) => {
    if (typeof text == "object" && key && text?.[key] != null) { text = text?.[key] ?? text; }
    if (key == "phone") {
        return formatPhoneList(label, text);
    }
    if (key == "email") {
        return formatEmailList(label, text);
    }
    return formatTextList(label, text);
}

//
export const isNotEmpty = (frag: any) => {
    return !!(typeof frag == "string" ? frag?.trim?.() : frag);
}

//
export const makePropertyDesc = (label: string | any, property: any, key?: string | null) => {
    let basis = (key ? property?.[key] : property);
    if (!isNotEmpty(basis) && typeof property != "object") { basis = property; }
    if (!isNotEmpty(basis)) return;
    if (Array.isArray(basis)) {
        return M(basis, (frag) => {
            return isNotEmpty(frag) ? (formatByCondition(label, frag, key)) : null;
        });
    }
    if (basis instanceof Map) {
        return M([...basis?.entries?.()], ([prop, frag]) => {
            return isNotEmpty(frag) ? (formatByCondition(label || prop, frag, key)) : null;
        });
    }
    if (typeof basis == "object") {
        return M([...Object.entries(basis)], ([prop, frag]) => {
            return isNotEmpty(frag) ? (formatByCondition(label || prop, frag, key)) : null;
        });
    }
    return formatByCondition(label, basis, key);
}

//
export const makeEvents = (label: string, path: string, title: string, basis: any, kind: string) => {
    const properties = basis?.properties || {};

    //
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete ${label} "${title}"?`)) return;
            try { await remove(null, path); } catch (e) { console.warn(e); }
            const el = MOCElement(ev.target as HTMLElement, '.task-item, .card');
            el?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();
            const result = await openFormModal('Edit ' + label, [
                { name: 'title', label: 'Title' },
                { name: 'kind', label: 'Kind' },
                { name: 'price', label: 'Price' },
                { name: 'description', label: 'Description' },
                { name: 'begin_time', label: 'Begin time', placeholder: 'YYYY-MM-DD or HH:MM' },
                { name: 'end_time', label: 'End time', placeholder: 'YYYY-MM-DD or HH:MM' },
                properties?.contacts?.email ? { name: 'email', label: 'Email' } : null,
                properties?.contacts?.phone ? { name: 'phone', label: 'Phone' } : null
            ]?.map(f => f ? f : null)?.filter(f => f), {
                title, kind, price: properties?.price || 0,
                description: basis?.desc?.description || "",
                begin_time: properties?.begin_time || "",
                end_time: properties?.end_time || "",
                email: properties?.contacts?.email?.[0] || '',
                phone: properties?.contacts?.phone?.[0] || '',
            });
            if (!result) return;

            //
            const updated = Object.assign(basis, {
                kind: result.kind || kind,
                desc: {
                    ...(basis?.desc || {}),
                    title: result.title,
                    description: result.description
                },
                properties: {
                    ...(basis?.properties || {}),
                    price: result.price,
                    begin_time: result.begin_time,
                    end_time: result.end_time,
                    contacts: {
                        ...(basis?.properties?.contacts || {}),
                        email: result.email ? [result.email] : [],
                        phone: result.phone ? [result.phone] : []
                    }
                }
            });

            //
            try {
                const fileName = path?.split?.('/')?.pop?.() || `${label}.json`;
                const file = new File([JSON.stringify(updated)], fileName, { type: 'application/json' });
                await writeFile(null, path, file);
            } catch (e) { console.warn(e); }

            //
            MOCElement(ev.target as HTMLElement, '.task-item, .card')?.querySelector?.('.card-title')?.replaceChildren?.(document.createTextNode(result.title));
            MOCElement(ev.target as HTMLElement, '.task-item, .card')?.querySelector?.('.card-desc')?.replaceChildren?.(document.createTextNode(result.description));
            MOCElement(ev.target as HTMLElement, '.task-item, .card')?.querySelector?.('.card-time')?.replaceChildren?.(document.createTextNode(`${result.begin_time} - ${result.end_time}`));
        }
    }
}

//
export const $ShowItemsByType = (DIR: string, byKind: string | null = null, ItemRenderer: (item: any, byKind: string | null) => any) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const dHandle = await getDirectoryHandle(null, DIR)?.catch?.(console.warn.bind(console));
        const entries = await Array.fromAsync(dHandle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, handle]: any) => {
            const file = await handle.getFile();
            const obj = JSON.parse(await file?.text?.() || "{}");
            (obj as any).__name = name;
            (obj as any).__path = `${DIR}${name}`;
            if (obj.kind === byKind || !byKind || byKind == "all" || !obj.kind) { dataRef.push(obj); }
            return obj;
        })?.filter?.((e) => e));
    }

    //
    const items = M(dataRef, (item) => {
        const itemEl = ItemRenderer(item, byKind ?? null);
        return itemEl;
    });

    //
    const root = H`<div data-name="${byKind}" class="tab">${items}</div>`;
    items.boundParent = root;
    (root as any).reloadList = load;

    //
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    //
    return root;
}

//
export const isDate = (date: any) => {
    const firstStep = date instanceof Date || typeof date == "string" && date.match(/^\d{4}-\d{2}-\d{2}$/);
    let secondStep = false;
    try {
        secondStep = new Date(date).getTime() > 0;
    } catch (e) {
        secondStep = false;
    }
    return firstStep && secondStep;
}

//
export const renderTabName = (tabName: string) => {
    return tabName;
}
