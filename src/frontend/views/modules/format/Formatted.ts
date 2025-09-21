import { H, M } from "fest/lure";

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
const isNotEmpty = (frag: any) => {
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
