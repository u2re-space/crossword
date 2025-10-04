import { makeReactive, observableByMap, observableBySet } from "fest/object";
import { getDirectoryHandle, H, M } from "fest/lure";

//
import { bindDropToDir } from "@rs-frontend/utils/FileOps";
import { watchFsDirectory } from "@rs-core/workers/FsWatch";
import { insideOfDay, parseDateCorrectly, getISOWeekNumber } from "@rs-core/utils/TimeUtils";
import { loadAllTimelines } from "@rs-core/workers/FileSystem";
import { TIMELINE_DIR } from "@rs-core/service/AI-ops/MakeTimeline";

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
    const normalized = text?.trim?.();
    if (!normalized) return null;
    return H`<span draggable="true" data-action="copy-text" class="text">${normalized}</span>`;
}

//
export const formatEmail = (email: string) => {
    const normalized = email?.trim?.();
    if (!normalized) return null;
    return H`<a on:dragstart=${beginDragAsText} draggable="true" data-action="copy-email" class="email" href="mailto:${normalized}" on:click=${copyEmailClick}>${normalized}</a>`;
}

//
export const formatPhone = (phone: string) => {
    let text = phone ?? "";
    text = text.replace(/\+7/g, '8').replace(/\s+/g, '').replace(/[^0-9]/g, '');
    text = text.replace(/\(/g, '').replace(/\)/g, '');
    text = text.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const normalized = text.trim();
    if (!normalized) return null;
    return H`<a on:dragstart=${beginDragAsText} draggable="true" data-action="copy-phone" class="phone" href="tel:${normalized}" on:click=${copyPhoneClick}>${normalized}</a>`;
}

//
export const wrapAsListItem = (label: string | any, item: any) => {
    if (!item) return null;
    if (label) {
        return H`<li><span class="item-label">${label}</span>: ${item}</li>`;
    }
    return H`<li>${item}</li>`;
}

//
const ensureDate = (value: any): Date | null => {
    if (!value) return null;
    const parsed = parseDateCorrectly(value);
    if (!parsed) return null;
    const time = parsed.getTime?.();
    return Number.isFinite(time) ? parsed : null;
};

const resolveBeginDate = (dayDesc: any): Date | null => {
    return ensureDate(dayDesc?.begin_time ?? dayDesc?.properties?.begin_time ?? dayDesc?.start);
};

const buildPrimaryDayTitle = (dayDesc: any): string => {
    const preset = dayDesc?.separatorTitle;
    if (typeof preset === "string" && preset.trim()) {
        return preset;
    }

    const date = resolveBeginDate(dayDesc);
    if (!date) {
        return dayDesc?.title || dayDesc?.id || "Day";
    }

    const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const week = dayDesc?.weekNumber ?? getISOWeekNumber(date);
    if (week && formatted) {
        return `${formatted} · Week ${week}`;
    }
    return formatted;
};

const buildSecondaryDayTitle = (dayDesc: any, primary: string): string | null => {
    const label = dayDesc?.title;
    if (!label) return null;
    if (!primary) return label;
    return label.trim() === primary.trim() ? null : label;
};

const makeDayHeader = (dayDesc: any, onToggle: (ev: Event) => void) => {
    const primary = buildPrimaryDayTitle(dayDesc);
    const secondary = buildSecondaryDayTitle(dayDesc, primary);
    return H`<header class="timeline-day-header" on:click=${onToggle}>
        <div class="timeline-day-divider"><span>${primary}</span></div>
        ${secondary ? H`<p class="timeline-day-meta">${secondary}</p>` : null}
    </header>`;
};

//
export const listFormatter = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>, formatter: (frag: any) => any) => {
    if (Array.isArray(text)) {
        const collection = text.map?.((frag: any) => formatter(frag))?.filter(Boolean);
        return collection?.length ? wrapAsListItem(label, M(collection, (item: any) => item)) : null;
    }
    if (text instanceof Map) {
        const mapped = M(observableByMap(text), (frag: any) => formatter(frag));
        return wrapAsListItem(label, mapped);
    }
    if (text instanceof Set) {
        const mapped = M(observableBySet(text), (frag: any) => formatter(frag));
        return wrapAsListItem(label, mapped);
    }
    return wrapAsListItem(label, formatter(text));
}

//
export const renderAddress = (address: any) => {
    if (typeof address == "string") return H`<span class="address">${address}</span>`;

    //
    const parts: any[] = [];
    if (address?.street)
        parts.push(H`<span class="address street">${address.street}</span>`);
    if (address?.square)
        parts.push(H`<span class="address square">${address.square}</span>`);
    if (address?.house)
        parts.push(H`<span class="address house">${address.house}</span>`);
    if (address?.flat)
        parts.push(H`<span class="address flat">${address.flat}</span>`);
    if (address?.floor)
        parts.push(H`<span class="address floor">${address.floor}</span>`);
    if (address?.room)
        parts.push(H`<span class="address room">${address.room}</span>`);

    //
    return parts;
}

//
export const formatLocation = (location: any) => {
    if (location?.address)
        return H`<span class="location">${renderAddress(location.address)}</span>`;
}

//
export const formatBiography = (biography: any) => {
    return H`<span class="biography">${biography.firstName?.join?.(" ") || ((biography.firstName || "") + " ")} ${biography.lastName?.join?.(" ") || ((biography.lastName || "") + " ")} ${biography.nickName?.join?.(" ") || ((biography.nickName || "") + " ")}</span>`;
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
export const formatBiographyList = (label: string | any, biography: any | any[] | Map<any, any>) => {
    return listFormatter(label, biography, formatBiography);
}

//
export const formatLocationList = (label: string | any, location: any | any[] | Map<any, any>) => {
    return listFormatter(label, location, formatLocation);
}


//
export const formatByCondition = (label: string | any, text: string | string[] | Set<any> | any[] | Map<any, any>, key: string | null = null) => {
    if (!text) return null;
    if (key == "begin_time" || key == "end_time" || key == "status") { return; }
    if (key == "phone") { return formatPhoneList(label || "Phone", text); }
    if (key == "email") { return formatEmailList(label || "Email", text); }
    if (key == "biography") { return formatBiographyList(label || "Biography", text); }
    if (key == "location") { return formatLocationList(label || "Location", text); }

    //
    if (typeof text != "object") return formatTextList(label, text);
    if (typeof text == "object" && key && text?.[key] != null && typeof text?.[key] != "object") { return formatTextList(label, text?.[key]);; }

    //
    if (typeof text == "object") {
        return [...Object.entries(text)].map(([K, Sb]: any) => {
            return formatByCondition("", Sb, K || key);
        })?.filter?.((e: any) => e);
    }

    //
    return formatTextList(label, text);
}

//
export const isNotEmpty = (frag: any) => {
    return !!(typeof frag == "string" ? frag?.trim?.() : frag);
}

//
export const makePropertyDesc = (label: string | any, property: any, key?: string | null) => {
    let basis = property;
    if (!isNotEmpty(basis)) return null;

    // handle lists, maps, sets, etc.
    return formatByCondition(label, basis, key);
}

//
export const $ShowItemsByType = (DIR: string, byKind: string | null = null, ItemRenderer: (item: any, byKind: string | null) => any) => {
    const dataRef: any = makeReactive([]);
    let stopWatch: (() => void) | null = null;

    //
    let loadLocked = false;
    const load = async () => {
        //dataRef.length = 0; // TODO: fix in reactive library
        dataRef?.splice?.(0, dataRef?.length ?? 0);

        //
        if (loadLocked) return;
        loadLocked = true;

        //
        const dHandle = await getDirectoryHandle(null, DIR)?.catch?.(console.warn.bind(console));
        const entries = await Array.fromAsync(dHandle?.entries?.() ?? [])?.catch?.(console.warn.bind(console));
        const $tmp = (await Promise.all(entries || [])?.catch?.(console.warn.bind(console)))
            ?.map?.(async ([name, fileHandle]: any) => {
                if (name?.endsWith?.(".crswap")) return;
                if (!name?.trim?.()?.endsWith?.(".json")) return;
                const file = await fileHandle?.getFile?.()?.catch?.(console.warn.bind(console));
                if (!file) return;

                //
                const obj = JSON.parse(await file?.text?.()?.catch?.(console.warn.bind(console)) || "{}");
                (obj as any).__name = name;
                (obj as any).__path = `${DIR}${name}`;
                if (obj.kind === byKind || !byKind || byKind == "all" || !obj.kind) { dataRef.push(obj); }
                return obj;
            })?.filter?.((e: any) => e);

        //
        loadLocked = false;
        return $tmp;
    }

    //
    document.addEventListener("rs-fs-changed", (ev) => load().catch(console.warn.bind(console)));

    //
    const items = M(dataRef, (item) => {
        const itemEl = ItemRenderer(item, byKind ?? null);
        return itemEl;
    });

    //
    const root = H`<div data-name="${byKind}" class="tab">${items}</div>`;
    items.boundParent = root;
    (root as any).reloadList = load;

    const ensureWatcher = () => {
        if (stopWatch) return;
        stopWatch = watchFsDirectory(DIR, () => load().catch(console.warn));
    };

    const cancelWatcher = () => {
        stopWatch?.();
        stopWatch = null;
    };

    root.addEventListener('dir-dropped', () => load().catch(console.warn));

    let observer: MutationObserver | null = null;
    ensureWatcher();
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    if (!observer && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        observer = new MutationObserver(() => {
            if (root.isConnected) ensureWatcher();
            else {
                cancelWatcher();
                observer?.disconnect();
                observer = null;
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    (root as any).dispose = () => {
        cancelWatcher();
        observer?.disconnect();
        observer = null;
    };

    //
    return root;
}

//
export const $ShowItemsByDay = (DIR: string = TIMELINE_DIR, dayDesc: any | null = null, ItemRenderer: (item: any, dayDesc: any | null) => any) => {
    const dataRef: any = makeReactive([]);
    let stopWatch: (() => void) | null = null;

    //
    let loadLocked = false;
    const load = async () => {
        //dataRef.length = 0; // TODO: fix in reactive library
        dataRef?.splice?.(0, dataRef?.length ?? 0);

        //
        if (loadLocked) return;
        loadLocked = true;

        //
        const timelines = await loadAllTimelines(DIR)?.catch?.(console.warn.bind(console));
        for (const timeline of (timelines ?? [])) {
            if (insideOfDay(timeline, dayDesc) && timeline) { dataRef.push(timeline); }
        }

        //
        loadLocked = false;
    }

    //
    document.addEventListener("rs-fs-changed", (ev) => load().catch(console.warn.bind(console)));

    //
    const items = M(dataRef, (item) => {
        const itemEl = ItemRenderer(item, dayDesc ?? null);
        return itemEl;
    });

    //
    const toggleOpen = (ev: Event) => {
        const el = ev.currentTarget as HTMLElement | null;
        const section = el?.closest?.('.timeline-day');
        if (section) section.toggleAttribute?.('data-open');
    }

    //
    const header = makeDayHeader(dayDesc, toggleOpen);
    const root = H`<section class="timeline-day" data-type="day" data-status=${dayDesc?.filter ?? "all"} data-variant=${dayDesc?.variant}>
        ${header}
        <div class="timeline-day-body">${items}</div>
    </section>`;

    //
    items.boundParent = root;
    (root as any).reloadList = load;

    const ensureWatcher = () => {
        if (stopWatch) return;
        stopWatch = watchFsDirectory(DIR, () => load().catch(console.warn));
    };

    const cancelWatcher = () => {
        stopWatch?.();
        stopWatch = null;
    };

    root.addEventListener('dir-dropped', () => load().catch(console.warn));

    let observer: MutationObserver | null = null;
    ensureWatcher();
    load().catch(console.warn.bind(console));
    bindDropToDir(root as any, DIR);

    if (!observer && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        observer = new MutationObserver(() => {
            if (root.isConnected) ensureWatcher();
            else {
                cancelWatcher();
                observer?.disconnect();
                observer = null;
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    (root as any).dispose = () => {
        cancelWatcher();
        observer?.disconnect();
        observer = null;
    };

    //
    return root;
}

//
export const renderTabName = (tabName: string) => {
    return tabName;
}
