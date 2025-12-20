/**
 * Standalone Toast System
 * Works independently in any context: PWA, Chrome Extension (content script, popup, service worker), vanilla JS
 * No dependencies on fest/lure or other framework libraries
 */

export type ToastKind = "info" | "success" | "warning" | "error";
export type ToastPosition = "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ToastOptions {
    message: string;
    kind?: ToastKind;
    duration?: number;
    persistent?: boolean;
    position?: ToastPosition;
    onClick?: () => void;
}

export interface ToastLayerConfig {
    containerId?: string;
    position?: ToastPosition;
    maxToasts?: number;
    zIndex?: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<ToastLayerConfig> = {
    containerId: "rs-toast-layer",
    position: "bottom",
    maxToasts: 5,
    zIndex: 2147483647
};

// Toast CSS styles (inlined for isolation)
const TOAST_STYLES = `
.rs-toast-layer {
    position: fixed;
    z-index: var(--rs-toast-z, 2147483647);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    gap: 0.5rem;
    max-block-size: 80dvb;
    overflow: hidden;
    box-sizing: border-box;
}

.rs-toast-layer[data-position="bottom"],
.rs-toast-layer:not([data-position]) {
    inset-block-end: 10dvb;
    inset-inline: 0;
    justify-content: flex-end;
}

.rs-toast-layer[data-position="top"] {
    inset-block-start: 10dvb;
    inset-inline: 0;
    justify-content: flex-start;
}

.rs-toast-layer[data-position="top-left"] {
    inset-block-start: 10dvb;
    inset-inline-start: 0;
    align-items: flex-start;
}

.rs-toast-layer[data-position="top-right"] {
    inset-block-start: 10dvb;
    inset-inline-end: 0;
    align-items: flex-end;
}

.rs-toast-layer[data-position="bottom-left"] {
    inset-block-end: 10dvb;
    inset-inline-start: 0;
    align-items: flex-start;
}

.rs-toast-layer[data-position="bottom-right"] {
    inset-block-end: 10dvb;
    inset-inline-end: 0;
    align-items: flex-end;
}

.rs-toast {
    --toast-bg: oklch(from var(--surface-color, #1a1a1a) l c h / 0.85);
    --toast-text: var(--on-surface-color, #ffffff);
    --toast-radius: 9999px;
    --toast-shadow: 0 2px 8px rgba(0,0,0,0.25);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    max-inline-size: min(90vw, 32rem);
    inline-size: fit-content;

    border-radius: var(--toast-radius);
    background: var(--toast-bg);
    box-shadow: var(--toast-shadow);
    backdrop-filter: blur(12px) saturate(140%);
    color: var(--toast-text);

    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1.4;
    white-space: nowrap;

    pointer-events: auto;
    user-select: none;
    cursor: default;

    opacity: 0;
    transform: translateY(100%) scale(0.9);
    transition:
        opacity 160ms ease-out,
        transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
        background-color 100ms ease;
}

.rs-toast[data-visible] {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.rs-toast:active {
    transform: scale(0.98);
}

.rs-toast[data-kind="success"] {
    --toast-bg: oklch(from var(--color-success, #22c55e) l c h / 0.9);
}

.rs-toast[data-kind="warning"] {
    --toast-bg: oklch(from var(--color-warning, #f59e0b) l c h / 0.9);
}

.rs-toast[data-kind="error"] {
    --toast-bg: oklch(from var(--color-error, #ef4444) l c h / 0.9);
}

@media (prefers-reduced-motion: reduce) {
    .rs-toast,
    .rs-toast[data-visible] {
        transition-duration: 0ms;
        transform: none;
    }
}
`;

// Track style injection per document
const injectedDocs = new WeakSet<Document>();

// Toast layer instances per config
const toastLayers = new Map<string, HTMLElement>();

/**
 * Ensure styles are injected into the document
 */
const ensureStyles = (doc: Document = document): void => {
    if (injectedDocs.has(doc)) return;

    const style = doc.createElement("style");
    style.id = "__rs-toast-styles__";
    style.textContent = TOAST_STYLES;
    (doc.head || doc.documentElement).appendChild(style);
    injectedDocs.add(doc);
};

/**
 * Get or create a toast layer container
 */
const getToastLayer = (config: Required<ToastLayerConfig>, doc: Document = document): HTMLElement => {
    const key = `${config.containerId}-${config.position}`;

    if (toastLayers.has(key)) {
        const existing = toastLayers.get(key)!;
        if (existing.isConnected) return existing;
        toastLayers.delete(key);
    }

    ensureStyles(doc);

    let layer = doc.getElementById(config.containerId);
    if (!layer) {
        layer = doc.createElement("div");
        layer.id = config.containerId;
        layer.className = "rs-toast-layer";
        doc.body.appendChild(layer);
    }

    layer.setAttribute("data-position", config.position);
    layer.style.setProperty("--rs-toast-z", String(config.zIndex));

    toastLayers.set(key, layer);
    return layer;
};

/**
 * Create and show a toast notification
 */
export const showToast = (options: ToastOptions | string): HTMLElement | null => {
    // Handle string shorthand
    const opts: ToastOptions = typeof options === "string" ? { message: options } : options;

    const {
        message,
        kind = "info",
        duration = 3000,
        persistent = false,
        position = "bottom",
        onClick
    } = opts;

    // Check for document availability (service worker context)
    if (typeof document === "undefined") {
        // In service worker context, try to broadcast to clients
        broadcastToast(opts);
        return null;
    }

    const config: Required<ToastLayerConfig> = {
        ...DEFAULT_CONFIG,
        position
    };

    const layer = getToastLayer(config);

    // Limit number of toasts
    while (layer.children.length >= config.maxToasts) {
        layer.firstChild?.remove();
    }

    const toast = document.createElement("div");
    toast.className = "rs-toast";
    toast.setAttribute("data-kind", kind);
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
    toast.textContent = message;

    layer.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
        toast.setAttribute("data-visible", "");
    });

    const removeToast = () => {
        toast.removeAttribute("data-visible");
        setTimeout(() => {
            toast.remove();
        }, 200);
    };

    // Auto-remove after duration
    if (!persistent) {
        setTimeout(removeToast, duration);
    }

    // Click handler
    toast.addEventListener("click", () => {
        onClick?.();
        removeToast();
    });

    return toast;
};

/**
 * Convenience methods for different toast kinds
 */
export const showSuccess = (message: string, duration?: number) =>
    showToast({ message, kind: "success", duration });

export const showError = (message: string, duration?: number) =>
    showToast({ message, kind: "error", duration });

export const showWarning = (message: string, duration?: number) =>
    showToast({ message, kind: "warning", duration });

export const showInfo = (message: string, duration?: number) =>
    showToast({ message, kind: "info", duration });

/**
 * Broadcast toast to all clients (for service worker context)
 */
const broadcastToast = (options: ToastOptions): void => {
    try {
        const channel = new BroadcastChannel("rs-toast");
        channel.postMessage({ type: "show-toast", options });
        channel.close();
    } catch (e) {
        console.warn("[Toast] Broadcast failed:", e);
    }
};

/**
 * Listen for toast broadcasts (call in main thread contexts)
 */
export const listenForToasts = (): () => void => {
    if (typeof BroadcastChannel === "undefined") return () => {};

    const channel = new BroadcastChannel("rs-toast");
    const handler = (event: MessageEvent) => {
        if (event.data?.type === "show-toast" && event.data?.options) {
            showToast(event.data.options);
        }
    };
    channel.addEventListener("message", handler);
    return () => {
        channel.removeEventListener("message", handler);
        channel.close();
    };
};

/**
 * Clear all toasts from a layer
 */
export const clearToasts = (position: ToastPosition = "bottom"): void => {
    const key = `${DEFAULT_CONFIG.containerId}-${position}`;
    const layer = toastLayers.get(key);
    if (layer) {
        layer.innerHTML = "";
    }
};

/**
 * Initialize toast listener for receiving broadcasts
 * Call this in main thread contexts (content scripts, popup, etc.)
 */
export const initToastReceiver = (): (() => void) => {
    return listenForToasts();
};

// Default export for convenience
export default {
    show: showToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    clear: clearToasts,
    listen: listenForToasts,
    init: initToastReceiver
};
