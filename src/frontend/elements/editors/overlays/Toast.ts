import { H } from "fest/lure";

//
export type ToastKind = "info" | "success" | "warning" | "error";

//
export interface ToastOptions {
    message: string;
    kind?: ToastKind;
    duration?: number;
    persistent?: boolean;
}

//
let toastLayer: HTMLElement | null = null;

//
const getToastLayer = () => {
    if (!toastLayer) {
        toastLayer = document.getElementById("rs-toast-layer");
        if (!toastLayer) {
            toastLayer = document.createElement("div");
            toastLayer.id = "rs-toast-layer";
            document.body.appendChild(toastLayer);
        }
    }
    return toastLayer;
};

//
export const showToast = (options: ToastOptions) => {
    const {
        message,
        kind = "info",
        duration = 3000,
        persistent = false
    } = options;

    const layer = getToastLayer();

    const toast = H`<div class="rs-toast" data-kind=${kind}>
        ${message}
    </div>`;

    layer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.setAttribute("data-visible", "");
    });

    // Auto-remove after duration
    if (!persistent) {
        setTimeout(() => {
            toast.removeAttribute("data-visible");
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, duration);
    }

    // Click to dismiss
    toast.addEventListener("click", () => {
        toast.removeAttribute("data-visible");
        setTimeout(() => {
            toast.remove();
        }, 200);
    });

    return toast;
};

//
export const showSuccess = (message: string, duration?: number) => {
    return showToast({ message, kind: "success", duration });
};

//
export const showError = (message: string, duration?: number) => {
    return showToast({ message, kind: "error", duration });
};

//
export const showWarning = (message: string, duration?: number) => {
    return showToast({ message, kind: "warning", duration });
};

//
export const showInfo = (message: string, duration?: number) => {
    return showToast({ message, kind: "info", duration });
};

//
export default {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
};

