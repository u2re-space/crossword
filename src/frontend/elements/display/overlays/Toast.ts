import { H } from "fest/lure";

//
type ToastKind = "info" | "success" | "warning" | "error";

const TOAST_LAYER_ID = "rs-toast-layer";
const HIDE_TIMEOUT = 3200;

const ensureLayer = () => {
    let layer = document.getElementById(TOAST_LAYER_ID);
    if (layer) return layer;
    layer = H`<div id=${TOAST_LAYER_ID} class="rs-toast-layer" aria-live="polite" aria-atomic="true"></div>` as HTMLElement;
    document.body.appendChild(layer);
    return layer;
};

export const closeToastLayer = () => {
    const layer = document.getElementById(TOAST_LAYER_ID);
    if (!layer) return;
    layer.remove();
};

export const showToast = (message: string, kind: ToastKind = "info") => {
    if (!message) return;
    const layer = ensureLayer();
    const toast = H`<div class="rs-toast" data-kind=${kind}>${message}</div>` as HTMLElement;
    layer.appendChild(toast);

    requestAnimationFrame(() => toast.setAttribute("data-visible", "true"));

    const removeToast = () => {
        toast.removeEventListener("transitionend", removeToast);
        toast.remove();
        if (!layer.childElementCount) layer.remove();
        if (!document.body.querySelector('.rs-toast-layer')) document.body.removeAttribute('data-toast-open');
    };

    const hideTimer = window.setTimeout(() => {
        toast.removeAttribute("data-visible");
        toast.addEventListener("transitionend", removeToast, { once: true });
    }, HIDE_TIMEOUT);

    toast.addEventListener("pointerdown", () => {
        window.clearTimeout(hideTimer);
        toast.removeAttribute("data-visible");
        toast.addEventListener("transitionend", removeToast, { once: true });
    }, { once: true });
};

export const toastSuccess = (message: string) => showToast(message, "success");
export const toastError = (message: string) => showToast(message, "error");
export const toastWarning = (message: string) => showToast(message, "warning");

