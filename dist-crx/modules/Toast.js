const DEFAULT_CONFIG = {
  containerId: "rs-toast-layer",
  position: "bottom",
  maxToasts: 5,
  zIndex: 2147483647
};
const DEFAULT_DURATION = 3e3;
const TRANSITION_DURATION = 200;
const TOAST_STYLES = `
.rs-toast-layer {
    position: fixed;
    z-index: var(--shell-toast-z, 2147483647);
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    max-inline-size: min(90vw, 32rem);
    inline-size: fit-content;

    border-radius: var(--toast-radius, 0.5rem);
    background-color: var(--toast-bg, light-dark(#fafbfc, #1e293b));
    box-shadow: var(--toast-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
    backdrop-filter: blur(12px) saturate(140%);
    color: var(--toast-text, light-dark(#000000, #ffffff));

    font-family: var(--toast-font-family, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: var(--toast-font-size, 0.875rem);
    font-weight: var(--toast-font-weight, 500);
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
    --toast-bg: var(--color-success, var(--color-success, #22c55e));
}

.rs-toast[data-kind="warning"] {
    --toast-bg: var(--color-warning, var(--color-warning, #f59e0b));
}

.rs-toast[data-kind="error"] {
    --toast-bg: var(--color-error, var(--color-error, #ef4444));
}

@media (prefers-reduced-motion: reduce) {
    .rs-toast,
    .rs-toast[data-visible] {
        transition-duration: 0ms;
        transform: none;
    }
}
`;
const injectedDocs = /* @__PURE__ */ new WeakSet();
const toastLayers = /* @__PURE__ */ new Map();
const ensureStyles = (doc = document) => {
  if (injectedDocs.has(doc)) return;
  const style = doc.createElement("style");
  style.id = "__rs-toast-styles__";
  style.textContent = TOAST_STYLES;
  (doc.head || doc.documentElement).appendChild(style);
  injectedDocs.add(doc);
};
const getToastLayer = (config, doc = document) => {
  const key = `${config.containerId}-${config.position}`;
  if (toastLayers.has(key)) {
    const existing = toastLayers.get(key);
    if (existing.isConnected) return existing;
    toastLayers.delete(key);
  }
  ensureStyles(doc);
  let layer = doc.getElementById(config.containerId);
  if (!layer) {
    layer = doc.createElement("div");
    layer.id = config.containerId;
    layer.className = "rs-toast-layer";
    layer.setAttribute("aria-live", "polite");
    layer.setAttribute("aria-atomic", "true");
    doc.body.appendChild(layer);
  }
  layer.setAttribute("data-position", config.position);
  layer.style.setProperty("--shell-toast-z", String(config.zIndex));
  toastLayers.set(key, layer);
  return layer;
};
const broadcastToast = (options) => {
  try {
    const channel = new BroadcastChannel("rs-toast");
    channel.postMessage({ type: "show-toast", options });
    channel.close();
  } catch (e) {
    console.warn("[Toast] Broadcast failed:", e);
  }
};
const showToast = (options) => {
  const opts = typeof options === "string" ? { message: options } : options;
  const {
    message,
    kind = "info",
    duration = DEFAULT_DURATION,
    persistent = false,
    position = DEFAULT_CONFIG.position,
    onClick
  } = opts;
  if (!message) return null;
  if (typeof document === "undefined") {
    broadcastToast(opts);
    return null;
  }
  if (typeof window === "undefined") return null;
  const config = {
    ...DEFAULT_CONFIG,
    position
  };
  const layer = getToastLayer(config);
  while (layer.children.length >= config.maxToasts) {
    layer.firstChild?.remove();
  }
  const toast = document.createElement("div");
  toast.className = "rs-toast";
  toast.setAttribute("data-kind", kind);
  toast.setAttribute("role", kind === "error" || kind === "warning" ? "alert" : "status");
  toast.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
  toast.textContent = message;
  layer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.setAttribute("data-visible", "");
  });
  let hideTimer = null;
  const removeToast = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    toast.removeAttribute("data-visible");
    setTimeout(() => {
      toast.remove();
      if (!layer.childElementCount) {
        const key = `${config.containerId}-${config.position}`;
        toastLayers.delete(key);
      }
    }, TRANSITION_DURATION);
  };
  if (!persistent) {
    hideTimer = window.setTimeout(removeToast, duration);
  }
  toast.addEventListener("click", () => {
    onClick?.();
    removeToast();
  });
  toast.addEventListener("pointerdown", () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    removeToast();
  }, { once: true });
  return toast;
};
const showSuccess = (message, duration) => showToast({ message, kind: "success", duration });
const showError = (message, duration) => showToast({ message, kind: "error", duration });
const listenForToasts = () => {
  if (typeof BroadcastChannel === "undefined") return () => {
  };
  const channel = new BroadcastChannel("rs-toast");
  const handler = (event) => {
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
const initToastReceiver = () => {
  return listenForToasts();
};

export { initToastReceiver, showError, showSuccess, showToast };
//# sourceMappingURL=Toast.js.map
