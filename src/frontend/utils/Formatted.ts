import { makeReactive, observableByMap, observableBySet } from "fest/object";
import { getDirectoryHandle, H, M } from "fest/lure";
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
export const copyPhoneClick = (ev: Event) => {
    const element = (ev.currentTarget as any);
    const isPhoneElement = (element as HTMLElement)?.matches?.('.phone') ? element : element?.querySelector?.('.phone');

    if (isPhoneElement) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        const phone = isPhoneElement?.textContent?.trim?.() ?? '';
        if (phone) { navigator.clipboard.writeText(phone); }
    }
}

//
export const copyEmailClick = (ev: Event) => {
    const element = (ev.currentTarget as any);
    const isEmailElement = (element as HTMLElement)?.matches?.('.email') ? element : element?.querySelector?.('.email');

    if (isEmailElement) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        const email = isEmailElement?.textContent?.trim?.() ?? '';
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
export const listFormatter = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>, formatter: (frag: any) => any) => {
    if (Array.isArray(text)) {
        return wrapAsListItem(label, M(text, (frag: any) => formatter(frag)));
    }
    if (text instanceof Map) {
        return wrapAsListItem(label, M(observableByMap(text), (frag: any) => formatter(frag)));
    }
    if (text instanceof Set) {
        return wrapAsListItem(label, M(observableBySet(text), (frag: any) => formatter(frag)));
    }
    return wrapAsListItem(label, formatter(text));
}


//
export const formatTextList = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>) => {
    return listFormatter(label, text, formatText);
};

//
export const formatEmailList = (label: string | any, emails: string | string[] | Set<any> | any[] | Map<any, any>) => {
    return listFormatter(label, emails, formatEmail);
}

//
export const formatPhoneList = (label: string | any, phones: string | string[] | Set<any> | any[] | Map<any, any>) => {
    return listFormatter(label, phones, formatPhone);
}



//
export const formatByCondition = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>, key: string | null = null) => {
    if (typeof text == "object" && key && text?.[key] != null) { text = text?.[key] ?? text; }

    if (key == "begin_time") { return; }
    if (key == "end_time") {
        return;
    }

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
    return formatByCondition(label, basis, key);
}

//
export const $ShowItemsByType = (DIR: string, byKind: string | null = null, ItemRenderer: (item: any, byKind: string | null) => any) => {
    const dataRef: any = makeReactive([]);
    const load = async () => {
        dataRef.length = 0;

        //
        const dHandle = await getDirectoryHandle(null, DIR)?.catch?.(console.warn.bind(console));
        const entries = await Array.fromAsync(dHandle?.entries?.() ?? []);
        return Promise.all(entries?.map?.(async ([name, fileHandle]: any) => {
            const file = await fileHandle.getFile();
            const obj = JSON.parse(await file?.text?.() || "{}");
            (obj as any).__name = name;
            (obj as any).__path = `${DIR}${name}`;
            if (obj.kind === byKind || !byKind || byKind == "all" || !obj.kind) { dataRef.push(obj); }
            return obj;
        })?.filter?.((e: any) => e));
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
