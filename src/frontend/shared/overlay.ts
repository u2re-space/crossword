/**
 * Overlay System for Content Scripts and Selection
 * Integrates with core Toast and Clipboard for cross-context communication
 */

// Import styles (CRXJS injects via injectCss: true)
import overlayStyles from "./overlay.scss?inline";
import { showToast as coreShowToast, initToastReceiver } from "@rs-core/utils/Toast";
import { initClipboardReceiver } from "@rs-core/utils/Clipboard";

// Inject styles programmatically as fallback
const injectStyles = () => {
    if (document.getElementById("__sel-dom-styles__")) return;
    const style = document.createElement("style");
    style.id = "__sel-dom-styles__";
    style.textContent = overlayStyles;
    (document.head || document.documentElement).appendChild(style);
};

// Initialize broadcast receivers for cross-context communication
let _receiversInitialized = false;
const initReceivers = () => {
    if (_receiversInitialized) return;
    _receiversInitialized = true;

    // Listen for toast messages from service worker
    initToastReceiver();

    // Listen for clipboard requests from service worker
    initClipboardReceiver();
};

// create overlay elements lazily to avoid issues with document_start timing
let _overlay: HTMLDivElement | null = null;
let _box: HTMLDivElement | null = null;
let _hint: HTMLDivElement | null = null;
let _sizeBadge: HTMLDivElement | null = null;
let _toast: HTMLDivElement | null = null;
let _initialized = false;

const ensureInitialized = () => {
    if (_initialized && _overlay?.isConnected) return;

    // wait for document to be ready
    if (!document?.documentElement) return;

    // inject styles first
    injectStyles();

    // initialize broadcast receivers for cross-context communication
    initReceivers();

    _overlay = document.createElement("div");
    _overlay.className = "sel-dom-overlay";
    _overlay.draggable = false;
    _overlay.tabIndex = -1;
    _overlay.popover = "manual";

    _box = document.createElement("div");
    _box.className = "sel-dom-box";
    _box.tabIndex = -1;

    _hint = document.createElement("div");
    _hint.className = "sel-dom-hint";
    _hint.textContent = "Select area. Esc — cancel";
    _hint.tabIndex = -1;

    _sizeBadge = document.createElement("div");
    _sizeBadge.className = "sel-dom-size-badge";
    _sizeBadge.textContent = "";
    _sizeBadge.tabIndex = -1;

    _toast = document.createElement("div");
    _toast.className = "sel-dom-toast";
    _toast.tabIndex = -1;

    _box.appendChild(_sizeBadge);
    _overlay.appendChild(_box);
    _overlay.appendChild(_hint);

    // append to DOM
    document.documentElement.appendChild(_toast);
    document.documentElement.appendChild(_overlay);

    // toast transition cleanup
    _toast.addEventListener("transitionend", () => {
        if (!_toast?.classList.contains("is-visible")) {
            if (_toast) _toast.textContent = "";
        }
    });

    _initialized = true;
};

// getters for lazy initialization
export const getOverlay = (): HTMLDivElement => {
    ensureInitialized();
    return _overlay!;
};

export const getBox = (): HTMLDivElement => {
    ensureInitialized();
    return _box!;
};

export const getHint = (): HTMLDivElement => {
    ensureInitialized();
    return _hint!;
};

export const getSizeBadge = (): HTMLDivElement => {
    ensureInitialized();
    return _sizeBadge!;
};

export const getToast = (): HTMLDivElement => {
    ensureInitialized();
    return _toast!;
};

// legacy exports (proxies to lazy getters)
export const overlay = new Proxy({} as HTMLDivElement, {
    get: (_, prop) => (getOverlay() as any)[prop],
    set: (_, prop, value) => { (getOverlay() as any)[prop] = value; return true; }
});

export const box = new Proxy({} as HTMLDivElement, {
    get: (_, prop) => (getBox() as any)[prop],
    set: (_, prop, value) => { (getBox() as any)[prop] = value; return true; }
});

export const hint = new Proxy({} as HTMLDivElement, {
    get: (_, prop) => (getHint() as any)[prop],
    set: (_, prop, value) => { (getHint() as any)[prop] = value; return true; }
});

export const sizeBadge = new Proxy({} as HTMLDivElement, {
    get: (_, prop) => (getSizeBadge() as any)[prop],
    set: (_, prop, value) => { (getSizeBadge() as any)[prop] = value; return true; }
});

/**
 * Show toast in overlay context
 * Uses core toast system when available, falls back to overlay toast element
 */
export const showToast = (text: string) => {
    // Try core toast system first (provides better cross-context support)
    try {
        coreShowToast({ message: text, kind: "info", duration: 1800 });
        return;
    } catch (e) {
        // Fallback to overlay toast element
    }

    ensureInitialized();
    const toast = _toast;
    if (!toast) return;

    if (!toast.classList.contains("is-visible")) {
        toast.classList.add("is-visible");
    }

    if (toast.textContent === text) return;
    toast.textContent = text;

    setTimeout(() => {
        if (toast.textContent !== text) return;
        toast.classList.remove("is-visible");
    }, 1800);
};

export const showSelection = () => {
    ensureInitialized();
    const overlay = _overlay;
    const box = _box;
    const sizeBadge = _sizeBadge;
    if (!overlay || !box || !sizeBadge) return;

    try {
        overlay.showPopover?.();
    } catch (e) {
        console.warn("showPopover failed:", e);
    }

    overlay.style.setProperty("display", "block", "important");

    // reset box position and size
    box.style.left = "0px";
    box.style.top = "0px";
    box.style.width = "0px";
    box.style.height = "0px";

    sizeBadge.textContent = "";
};

export const hideSelection = () => {
    const overlay = _overlay;
    const box = _box;
    const sizeBadge = _sizeBadge;
    if (!overlay) return;

    overlay.style.removeProperty("display");

    try {
        overlay.hidePopover?.();
    } catch (e) {
        console.warn("hidePopover failed:", e);
    }

    if (box) {
        box.style.left = "0px";
        box.style.top = "0px";
        box.style.width = "0px";
        box.style.height = "0px";
    }

    if (sizeBadge) {
        sizeBadge.textContent = "";
    }
};

// auto-initialize when DOM is ready
if (document?.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureInitialized, { once: true });
} else {
    ensureInitialized();
}
