import { makeReactive, propRef, stringRef, subscribe, computed } from "fest/object";
import { ctxMenuTrigger, E, H, orientRef, M, Q, provide, registerModal, handleIncomingEntries } from "fest/lure";
import { bindInteraction } from "fest/fl-ui";
import { actionRegistry, iconsPerAction, labelsPerAction } from "@rs-frontend/utils/Actions";
import { toastSuccess, toastError } from "@rs-frontend/lure-veela/items/Toast";
import {
    speedDialMeta,
    speedDialItems,
    createEmptySpeedDialItem,
    addSpeedDialItem,
    upsertSpeedDialItem,
    removeSpeedDialItem,
    persistSpeedDialItems,
    persistSpeedDialMeta,
    findSpeedDialItem,
    getSpeedDialMeta,
    ensureSpeedDialMeta,
    NAVIGATION_SHORTCUTS,
    wallpaperState,
    persistWallpaper,
    gridLayoutState,
    type SpeedDialItem,
    type GridCell
} from "@rs-frontend/utils/StateStorage";
import { isInFocus, MOCElement } from "fest/dom";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

let viewMaker: any = null;
const layout = makeReactive([gridLayoutState.columns ?? 4, gridLayoutState.rows ?? 8]);
const items = speedDialItems;
const meta = speedDialMeta;

// Subscribe to grid layout changes
subscribe(gridLayoutState, () => {
    layout[0] = gridLayoutState.columns ?? 4;
    layout[1] = gridLayoutState.rows ?? 8;
});
const resolveItemAction = (item: SpeedDialItem, override?: string) => {
    if (override) return override;
    const entry = getSpeedDialMeta(item.id);
    return entry?.action || item?.action || "open-view";
};

const ACTION_OPTIONS = [
    { value: "open-view", label: "Open view" },
    { value: "open-link", label: "Open link" },
    { value: "copy-link", label: "Copy link" },
    { value: "copy-state-desc", label: "Copy state + desc" }
];

const getRefValue = (ref: any, fallback = "") => {
    if (ref && typeof ref === "object" && "value" in ref) return ref.value ?? fallback;
    return ref ?? fallback;
};

const buildDescriptor = (item: SpeedDialItem) => {
    const meta = getSpeedDialMeta(item.id);
    return {
        label: getRefValue(item?.label),
        type: meta?.view || "speed-dial",
        DIR: "/",
        href: meta?.href,
        view: meta?.view,
        action: resolveItemAction(item)
    };
};

//
const bindCell = (el: HTMLElement, args: any) => {
    const { item } = args;
    const cell = item?.cell ?? [0, 0];
    E(el, {
        style: {
            "--cell-x": propRef(cell, 0),
            "--cell-y": propRef(cell, 1),
            "--p-cell-x": propRef(cell, 0),
            "--p-cell-y": propRef(cell, 1)
        }
    });
};

//
const runItemAction = (item: SpeedDialItem, actionId?: string, extras: { event?: Event; initiator?: HTMLElement } = {}) => {
    const resolvedAction = resolveItemAction(item, actionId);
    const action = actionRegistry.get(resolvedAction);
    if (!action) { toastError("Action is unavailable"); return; }
    //const $meta = getSpeedDialMeta(item.id);
    const context = {
        id: item.id,
        items,
        meta,
        action: resolvedAction,
        viewMaker
    };
    try {
        action(context as any, item, extras?.initiator);
    } catch (error) {
        console.warn(error);
        toastError("Failed to run action");
    }
};

const attachItemNode = (item: SpeedDialItem, el?: HTMLElement | null, interactive = true) => {
    if (!el) return;
    const args = { layout, items, item, meta };
    el.dataset.id = item.id;
    el.dataset.speedDialItem = "true";
    el.addEventListener("dragstart", (ev)=>ev.preventDefault());
    if (interactive) {
        el.addEventListener("click", (ev)=>{
            ev?.preventDefault?.();
            if (!MOCElement(ev?.target as any, "[data-dragging]")) {
                runItemAction(item, undefined, { event: ev, initiator: el });
            }
        });
        el.addEventListener("dblclick", (ev)=>{
            ev?.preventDefault?.();
            openItemEditor(item);
        });
    }

    if (el.dataset.layer === "labels") {
        el.style.pointerEvents = "none";
        // needs to bind cell
        bindCell(el, args);
    }
    if (el.dataset.layer === "icons") {
        bindInteraction(el, args);
    }
};

const deriveCellFromEvent = (ev?: MouseEvent): GridCell =>{
    const grid = document.querySelector<HTMLElement>("#home .speed-dial-grid");
    if (!grid || !ev) return [0, 0];
    const rect = grid.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return [0, 0];
    const relX = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
    const relY = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height);
    const cols = Number(layout?.[0] ?? 4) || 4;
    const rows = Number(layout?.[1] ?? 8) || 8;
    const col = Math.min(cols - 1, Math.max(0, Math.round((relX / rect.width) * (cols - 1))));
    const row = Math.min(rows - 1, Math.max(0, Math.round((relY / rect.height) * (rows - 1))));
    return [col, row];
};

const createMenuEntryForAction = (actionId: string, item: SpeedDialItem, fallbackLabel: string = "") => {
    const descriptor = buildDescriptor(item) as any;
    return {
        id: actionId,
        label: labelsPerAction.get(actionId)?.(descriptor) || fallbackLabel,
        icon: iconsPerAction.get(actionId) || "command",
        action: (initiator: HTMLElement, _menuItem: any, ev: MouseEvent)=>runItemAction(item, actionId, { event: ev, initiator })
    };
};

//
const pickWallpaper = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
            const dir = "/images/wallpaper/";
            await writeFileSmart(null, dir, file);
            const path = `${dir}${file.name}`;
            wallpaperState.src = path;
            persistWallpaper();
            toastSuccess("Wallpaper updated");
        } catch (e) {
            console.warn(e);
            toastError("Failed to set wallpaper");
        }
    };
    input.click();
};

//
function makeWallpaper() {
    const oRef = orientRef();
    console.log(wallpaperState);
    const srcRef = stringRef("./assets/imgs/test.jpg");
    subscribe([wallpaperState, "src"], (s) => provide("/user" + (s?.src || (typeof s == "string" ? s : null)))?.then?.(blob => (srcRef.value = URL.createObjectURL(blob)))?.catch?.(console.warn.bind(console)) || "./assets/imgs/test.jpg");
    const CE = H`<canvas style="min-inline-size: 0px; min-block-size: 0px; inline-size: stretch; block-size: stretch; max-block-size: stretch; max-inline-size: stretch; transform: none; scale: 1; inset: 0; position: fixed; pointer-events: none;" data-orient=${oRef} is="ui-canvas" data-src=${srcRef}></canvas>`;
    return CE;
}

//
const handleWallpaperDropOrPaste = (event: DragEvent | ClipboardEvent) => {
    if (isInFocus(event?.target as HTMLElement, "#home") ||
        isInFocus(event?.target as HTMLElement, "#home:is(:hover, :focus, :focus-visible), #home:has(:hover, :focus, :focus-visible)", "child")
    ) {
        event.preventDefault();
        event.stopPropagation();
        handleIncomingEntries(((event as any).clipboardData || (event as any).dataTransfer), "/images/wallpaper/", null, (file, path) => {
            if (file.type.startsWith("image/")) {
                wallpaperState.src = path;
                persistWallpaper();
                toastSuccess("Wallpaper updated");
            }
        });
    }
};


export function SpeedDial(makeView: any) {
    viewMaker = makeView;

    const columnsRef = propRef(gridLayoutState, "columns", 4);
    const rowsRef = propRef(gridLayoutState, "rows", 8);
    const shapeRef = propRef(gridLayoutState, "shape", "square");

    const renderIconItem = (item: SpeedDialItem)=>{
        return H`<div class="ui-ws-item" data-speed-dial-item data-layer="icons" ref=${(el) => attachItemNode(item, el as HTMLElement, true)}>
            <div data-shape=${shapeRef} class="ui-ws-item-icon shaped">
                <ui-icon icon=${item.icon}></ui-icon>
            </div>
        </div>`;
    };

    const renderLabelItem = (item: SpeedDialItem)=>{
        return H`<div style="background-color: transparent;" class="ui-ws-item" data-speed-dial-item data-layer="labels" ref=${(el) => attachItemNode(item, el as HTMLElement, true)}>
            <div class="ui-ws-item-label" style="background-color: transparent;">
                <span style="background-color: transparent;">${getRefValue(item.label)}</span>
            </div>
        </div>`;
    };

    //
    const oRef = orientRef();
    const box = H`<div id="home" data-mixin="ui-orientbox" class="speed-dial-root" prop:orient=${oRef} on:dragover=${(ev: DragEvent) => ev.preventDefault()} on:drop=${(ev: DragEvent) => handleWallpaperDropOrPaste(ev)} prop:onPaste=${(ev: ClipboardEvent) => handleWallpaperDropOrPaste(ev)}>
        ${makeWallpaper()}
        <div style="background-color: transparent; color-scheme: dark;" class="speed-dial-grid" data-layer="items" data-mixin="ui-gridbox" data-grid-columns=${columnsRef} data-grid-rows=${rowsRef} data-grid-shape=${shapeRef}>
            ${M(items, renderLabelItem)}
        </div>
        <div style="background-color: transparent;" class="speed-dial-grid" data-layer="items" data-mixin="ui-gridbox" data-grid-columns=${columnsRef} data-grid-rows=${rowsRef} data-grid-shape=${shapeRef}>
            ${M(items, renderIconItem)}
        </div>
    </div>`;

    //
    box.onPaste = (ev: ClipboardEvent) => handleWallpaperDropOrPaste(ev);

    //
    return box;
}

//
const openItemEditor = (item?: SpeedDialItem, opts: { suggestedCell?: GridCell } = {})=>{
    const workingItem = item ?? createEmptySpeedDialItem(opts?.suggestedCell ?? [0, 0]);
    const isNew = !item;
    const workingMeta = ensureSpeedDialMeta(workingItem.id);
    const draft = {
        label: getRefValue(workingItem.label, "New shortcut"),
        icon: getRefValue(workingItem.icon, "sparkle"),
        action: resolveItemAction(workingItem),
        href: workingMeta?.href || "",
        view: workingMeta?.view || "",
        description: workingMeta?.description || ""
    };

    const modal = H`<div class="rs-modal-backdrop speed-dial-editor">
        <form class="modal-form speed-dial-editor__form">
            <header class="modal-header">
                <h2 class="modal-title">${isNew ? "Create shortcut" : "Edit shortcut"}</h2>
                <p class="modal-description">Configure quick access tiles for frequently used views or links.</p>
            </header>
            <div class="modal-fields">
                <label class="modal-field">
                    <span>Label</span>
                    <input name="label" type="text" minlength="1" required value="${draft.label}" />
                </label>
                <label class="modal-field">
                    <span>Icon</span>
                    <input name="icon" type="text" placeholder="phosphor icon name" value="${draft.icon}" />
                </label>
                <label class="modal-field">
                    <span>Action</span>
                    <select name="action">
                        ${ACTION_OPTIONS.map((option)=>H`<option selected="${option.value === draft.action}" value="${option.value}">${option.label}</option>`)}
                    </select>
                </label>
                <label class="modal-field" data-field="view">
                    <span>View</span>
                    <select name="view">
                        <option value="">Choose view</option>
                        ${NAVIGATION_SHORTCUTS.map((shortcut)=>H`<option selected="${shortcut.view === draft.view}" value="${shortcut.view}" >${shortcut.label}</option>`)}
                    </select>
                </label>
                <label class="modal-field" data-field="href">
                    <span>Link</span>
                    <input name="href" type="url" placeholder="https://example.com" value="${draft.href}"/>
                </label>
                <label class="modal-field">
                    <span>Description</span>
                    <textarea name="description" rows="2" placeholder="Optional description">${draft.description}</textarea>
                </label>
            </div>
            <footer class="modal-actions">
                <div class="modal-actions-left">
                    ${!isNew ? H`<button type="button" data-action="delete" class="btn danger">Delete</button>` : null}
                </div>
                <div class="modal-actions-right">
                    <button type="button" data-action="cancel" class="btn secondary">Cancel</button>
                    <button type="submit" class="btn save">Save</button>
                </div>
            </footer>
        </form>
    </div>`;

    const form = modal.querySelector("form") as HTMLFormElement;
    const actionSelect = form?.querySelector<HTMLSelectElement>('select[name="action"]');
    const viewField = form?.querySelector<HTMLElement>('[data-field="view"]');
    const hrefField = form?.querySelector<HTMLElement>('[data-field="href"]');

    const toggleFieldVisibility = ()=>{
        const value = actionSelect?.value;
        if (viewField) viewField.hidden = value !== "open-view";
        if (hrefField) hrefField.hidden = !(value === "open-link" || value === "copy-link");
    };

    actionSelect?.addEventListener("change", toggleFieldVisibility);
    toggleFieldVisibility();

    let unregisterBackNav: (() => void) | null = null;

    const closeModal = ()=>{
        unregisterBackNav?.();
        modal?.remove?.();
        document.removeEventListener("keydown", escHandler);
    };

    const escHandler = (ev: KeyboardEvent)=>{
        if (ev.key === "Escape") {
            closeModal();
        }
    };
    document.addEventListener("keydown", escHandler);

    modal.addEventListener("click", (ev: Event)=>{
        if (ev.target === modal) {
            closeModal();
        }
    });

    // Register modal with back navigation system for mobile back gesture support
    unregisterBackNav = registerModal(modal as HTMLElement, undefined, closeModal);

    form?.addEventListener("submit", (ev)=>{
        ev?.preventDefault?.();
        const formData = new FormData(form);
        workingItem.label.value = (formData.get("label") as string || "").trim();
        workingItem.icon.value = (formData.get("icon") as string || "").trim() || "sparkle";
        workingItem.action = (formData.get("action") as string) || "open-view";
        workingMeta.action = workingItem.action;
        workingMeta.view = (formData.get("view") as string || "").trim();
        workingMeta.href = (formData.get("href") as string || "").trim();
        workingMeta.description = (formData.get("description") as string || "").trim();
        if (isNew) {
            addSpeedDialItem(workingItem);
        } else {
            upsertSpeedDialItem(workingItem);
        }
        persistSpeedDialItems();
        persistSpeedDialMeta();
        toastSuccess(isNew ? "Shortcut created" : "Shortcut updated");
        closeModal();
    });

    form?.addEventListener("click", (ev: Event)=>{
        const target = ev.target as HTMLElement;
        const action = target?.dataset?.action;
        if (action === "cancel") {
            ev.preventDefault();
            closeModal();
        }
        if (action === "delete" && !isNew) {
            ev.preventDefault();
            removeSpeedDialItem(workingItem.id);
            persistSpeedDialItems();
            persistSpeedDialMeta();
            toastSuccess("Shortcut removed");
            closeModal();
        }
    });

    document.body.append(modal);
};

export function createCtxMenu() {
    const ctxMenuDesc = {
        openedWith: null,
        items: [],
        meta: {},
        context: null,
        buildItems(details){
            const targetEl = (details.event?.target as HTMLElement | null)?.closest?.("[data-speed-dial-item]");
            const itemId = targetEl?.getAttribute?.("data-id");
            const item = findSpeedDialItem(itemId);
            const context = {
                items,
                type: item ? "item" : "void",
                item,
                meta,
                event: details.event,
                guessedCell: deriveCellFromEvent(details.event),
                initiator: targetEl as HTMLElement
            };
            (ctxMenuDesc as any).context = context;

            if (item) {
                const currentAction = resolveItemAction(item);
                const sections: any[] = [];
                sections.push([
                    createMenuEntryForAction(currentAction || "open-view", item, "Run action")
                ]);
                const utilities: any[] = [];
                const $meta = getSpeedDialMeta(item.id);
                if ($meta?.href) {
                    utilities.push(createMenuEntryForAction("open-link", item, "Open link"));
                    utilities.push(createMenuEntryForAction("copy-link", item, "Copy link"));
                }
                utilities.push(createMenuEntryForAction("copy-state-desc", item, "Copy shortcut JSON"));
                sections.push(utilities);
                sections.push([
                    { id: "edit", label: "Edit shortcut", icon: "pencil-simple-line", action: ()=>openItemEditor(item) },
                    { id: "remove", label: "Remove", icon: "trash", action: ()=>{
                        removeSpeedDialItem(item.id);
                        persistSpeedDialItems();
                        persistSpeedDialMeta();
                        toastSuccess("Shortcut removed");
                    } }
                ]);
                sections.push(NAVIGATION_SHORTCUTS.map((shortcut)=>({
                    id: `open-${shortcut.view}`,
                    label: `Open ${shortcut.label}`,
                    icon: shortcut.icon,
                    action: ()=>actionRegistry.get(`open-view-${shortcut.view}`)?.({id: itemId || "", items, meta, shortcut, viewMaker}, item)
                })));
                return sections.filter((section)=>section?.length);
            }

            const emptySections = [
                [{
                    id: "create-shortcut",
                    label: "Create shortcut",
                    icon: "plus",
                    action: ()=>{
                        openItemEditor(undefined, { suggestedCell: context.guessedCell });
                    }
                }, {
                    id: "change-wallpaper",
                    label: "Change wallpaper",
                    icon: "image",
                    action: pickWallpaper
                }],
                NAVIGATION_SHORTCUTS.map((shortcut)=>({
                    id: `open-${shortcut.view}`,
                    label: `Open ${shortcut.label}`,
                    icon: shortcut.icon,
                    action: ()=>{
                        actionRegistry.get(`open-view-${shortcut.view}`)?.({ id: "", items, meta, shortcut, viewMaker }, {})
                    }
                }))
            ];
            return emptySections;
        }
    };

    const ctxMenu = H`<ul class="grid-rows c2-surface round-decor ctx-menu ux-anchor"></ul>`;
    ctxMenuTrigger(Q("#home") || document.body, ctxMenuDesc as any, ctxMenu);
    return ctxMenu;
}
