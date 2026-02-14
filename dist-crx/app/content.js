import { initClipboardReceiver } from '../modules/Clipboard.js';
import { initToastReceiver, showToast as showToast$1 } from '../modules/Toast.js';
import { copyAsTeX, copyAsMathML, copyAsMarkdown, copyAsHTML } from '../modules/Conversion.js';
import { initClipboardHandler } from '../modules/clipboard-handler.js';
import { createRuntimeChannelModule } from '../modules/runtime.js';
import { registerCrxHandler } from '../modules/CrxMessaging.js';
import '../modules/Runtime2.js';
import '../modules/index.js';
import '../modules/_commonjsHelpers.js';
import '../modules/ImageProcess.js';
import '../modules/Settings.js';

"use strict";
const DEFAULT_CONFIG = {
  prefix: "sel-dom",
  zIndex: 2147483647
};
const createOverlayStyles = (prefix, zIndex) => `
html > .${prefix}-overlay,
body > .${prefix}-overlay,
.${prefix}-overlay[popover] {
    position: fixed !important;
    inset: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    z-index: ${zIndex} !important;
    display: none;
    visibility: hidden;
    pointer-events: none;
    box-sizing: border-box !important;
    inline-size: 100vw !important;
    block-size: 100vh !important;
    max-inline-size: 100vw !important;
    max-block-size: 100vh !important;
    overflow: visible !important;
    cursor: crosshair !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -webkit-user-drag: none !important;
    outline: none !important;
}

html > .${prefix}-overlay:popover-open,
body > .${prefix}-overlay:popover-open,
.${prefix}-overlay[popover]:popover-open {
    display: block !important;
    visibility: visible !important;
    pointer-events: auto !important;
}

html > .${prefix}-overlay::backdrop,
body > .${prefix}-overlay::backdrop,
.${prefix}-overlay[popover]::backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.35) !important;
    pointer-events: auto !important;
    cursor: crosshair !important;
    z-index: ${zIndex - 1} !important;
}

.${prefix}-overlay .${prefix}-box,
.${prefix}-box {
    position: fixed !important;
    overflow: visible !important;
    border: 2px solid #4da3ff !important;
    background: rgba(77, 163, 255, 0.15) !important;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4) !important;
    pointer-events: none !important;
    -webkit-user-drag: none !important;
    box-sizing: border-box !important;
    z-index: 1 !important;
}

.${prefix}-overlay .${prefix}-hint,
.${prefix}-hint {
    position: fixed !important;
    inset-inline-start: 50% !important;
    inset-block-start: 50% !important;
    transform: translate(-50%, -50%) !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: #fff !important;
    font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
    padding: 10px 16px !important;
    border-radius: 8px !important;
    pointer-events: none !important;
    -webkit-user-drag: none !important;
    inline-size: max-content !important;
    block-size: max-content !important;
    z-index: 2 !important;
    white-space: nowrap !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.${prefix}-hint:empty {
    display: none !important;
    visibility: hidden !important;
}

.${prefix}-overlay .${prefix}-size-badge,
.${prefix}-box .${prefix}-size-badge,
.${prefix}-size-badge {
    position: absolute !important;
    transform: translate(6px, 6px) !important;
    background: #1e293b !important;
    color: #fff !important;
    font: 11px/1.3 ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    pointer-events: none !important;
    -webkit-user-drag: none !important;
    inline-size: max-content !important;
    block-size: max-content !important;
    z-index: 3 !important;
    white-space: nowrap !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
}

.${prefix}-size-badge:empty {
    display: none !important;
    visibility: hidden !important;
}

html > .${prefix}-toast,
body > .${prefix}-toast,
.${prefix}-toast {
    position: fixed !important;
    inset-inline-start: 50% !important;
    inset-block-end: 24px !important;
    inset-block-start: auto !important;
    inset-inline-end: auto !important;
    transform: translateX(-50%) !important;
    background: rgba(0, 0, 0, 0.9) !important;
    color: #fff !important;
    font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
    padding: 10px 16px !important;
    border-radius: 8px !important;
    pointer-events: none !important;
    -webkit-user-drag: none !important;
    inline-size: max-content !important;
    block-size: max-content !important;
    z-index: ${zIndex} !important;
    white-space: nowrap !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
    opacity: 0;
    visibility: hidden;
    transition: opacity 200ms ease-out, visibility 200ms ease-out !important;
    margin: 0 !important;
    border: none !important;
    box-sizing: border-box !important;
}

.${prefix}-toast.is-visible {
    opacity: 1 !important;
    visibility: visible !important;
}

.${prefix}-toast:empty {
    display: none !important;
}
`;
const injectedDocs = /* @__PURE__ */ new WeakSet();
const overlayInstances = /* @__PURE__ */ new Map();
let _receiversInitialized = false;
const initReceivers = () => {
  if (_receiversInitialized) return;
  _receiversInitialized = true;
  initToastReceiver();
  initClipboardReceiver();
};
const injectStyles = (config, doc = document) => {
  if (injectedDocs.has(doc)) return;
  const styleId = `__${config.prefix}-styles__`;
  if (doc.getElementById(styleId)) {
    injectedDocs.add(doc);
    return;
  }
  const style = doc.createElement("style");
  style.id = styleId;
  style.textContent = createOverlayStyles(config.prefix, config.zIndex);
  (doc.head || doc.documentElement).appendChild(style);
  injectedDocs.add(doc);
};
const createElements = (config, doc = document) => {
  const key = config.prefix;
  if (overlayInstances.has(key)) {
    const existing = overlayInstances.get(key);
    if (existing.overlay?.isConnected) return existing;
    overlayInstances.delete(key);
  }
  if (!doc?.documentElement) {
    return { overlay: null, box: null, hint: null, sizeBadge: null, toast: null };
  }
  injectStyles(config, doc);
  initReceivers();
  const overlay2 = doc.createElement("div");
  overlay2.className = `${config.prefix}-overlay`;
  overlay2.draggable = false;
  overlay2.tabIndex = -1;
  overlay2.popover = "manual";
  const box2 = doc.createElement("div");
  box2.className = `${config.prefix}-box`;
  box2.tabIndex = -1;
  const hint2 = doc.createElement("div");
  hint2.className = `${config.prefix}-hint`;
  hint2.textContent = "Select area. Esc — cancel";
  hint2.tabIndex = -1;
  const sizeBadge2 = doc.createElement("div");
  sizeBadge2.className = `${config.prefix}-size-badge`;
  sizeBadge2.textContent = "";
  sizeBadge2.tabIndex = -1;
  const toast = doc.createElement("div");
  toast.className = `${config.prefix}-toast`;
  toast.tabIndex = -1;
  box2.appendChild(sizeBadge2);
  overlay2.appendChild(box2);
  overlay2.appendChild(hint2);
  doc.documentElement.appendChild(toast);
  doc.documentElement.appendChild(overlay2);
  toast.addEventListener("transitionend", () => {
    if (!toast.classList.contains("is-visible")) {
      toast.textContent = "";
    }
  });
  const elements = { overlay: overlay2, box: box2, hint: hint2, sizeBadge: sizeBadge2, toast };
  overlayInstances.set(key, elements);
  return elements;
};
const getOverlayElements = (config) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  if (typeof document === "undefined") {
    return { overlay: null, box: null, hint: null, sizeBadge: null, toast: null };
  }
  return createElements(fullConfig);
};
const getOverlay = (config) => getOverlayElements(config).overlay;
const getBox = (config) => getOverlayElements(config).box;
const getHint = (config) => getOverlayElements(config).hint;
const getSizeBadge = (config) => getOverlayElements(config).sizeBadge;
const getToast = (config) => getOverlayElements(config).toast;
const showToast = (text, config) => {
  if (typeof text === "object") {
    showToast$1(text);
    return;
  }
  try {
    showToast$1({ message: text, kind: "info", duration: 1800 });
  } catch {
    const elements = getOverlayElements(config);
    const toast = elements.toast;
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
  }
};
const showSelection = (config) => {
  const elements = getOverlayElements(config);
  const { overlay: overlay2, box: box2, sizeBadge: sizeBadge2 } = elements;
  if (!overlay2 || !box2) return;
  try {
    overlay2.showPopover?.();
  } catch (e) {
    console.warn("[Overlay] showPopover failed:", e);
  }
  overlay2.style.setProperty("display", "block", "important");
  box2.style.left = "0px";
  box2.style.top = "0px";
  box2.style.width = "0px";
  box2.style.height = "0px";
  if (sizeBadge2) sizeBadge2.textContent = "";
};
const hideSelection = (config) => {
  const elements = getOverlayElements(config);
  const { overlay: overlay2, box: box2, sizeBadge: sizeBadge2 } = elements;
  if (!overlay2) return;
  overlay2.style.removeProperty("display");
  try {
    overlay2.hidePopover?.();
  } catch (e) {
    console.warn("[Overlay] hidePopover failed:", e);
  }
  if (box2) {
    box2.style.left = "0px";
    box2.style.top = "0px";
    box2.style.width = "0px";
    box2.style.height = "0px";
  }
  if (sizeBadge2) {
    sizeBadge2.textContent = "";
  }
};
const updateBox = (x, y, width, height, config) => {
  const elements = getOverlayElements(config);
  const { box: box2, sizeBadge: sizeBadge2 } = elements;
  if (!box2) return;
  box2.style.left = `${x}px`;
  box2.style.top = `${y}px`;
  box2.style.width = `${width}px`;
  box2.style.height = `${height}px`;
  if (sizeBadge2) {
    sizeBadge2.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    sizeBadge2.style.left = `${width}px`;
    sizeBadge2.style.top = `${height}px`;
  }
};
const setHint = (text, config) => {
  const elements = getOverlayElements(config);
  if (elements.hint) {
    elements.hint.textContent = text;
  }
};
const initOverlay = (config) => {
  if (typeof document === "undefined") {
    return { overlay: null, box: null, hint: null, sizeBadge: null, toast: null };
  }
  if (document.readyState === "loading") {
    let elements = { overlay: null, box: null, hint: null, sizeBadge: null, toast: null };
    document.addEventListener("DOMContentLoaded", () => {
      elements = getOverlayElements(config);
    }, { once: true });
    return elements;
  }
  return getOverlayElements(config);
};
const overlay = new Proxy({}, {
  get: (_, prop) => getOverlay()?.[prop],
  set: (_, prop, value) => {
    const o = getOverlay();
    if (o) o[prop] = value;
    return true;
  }
});
const box = new Proxy({}, {
  get: (_, prop) => getBox()?.[prop],
  set: (_, prop, value) => {
    const b = getBox();
    if (b) b[prop] = value;
    return true;
  }
});
const hint = new Proxy({}, {
  get: (_, prop) => getHint()?.[prop],
  set: (_, prop, value) => {
    const h = getHint();
    if (h) h[prop] = value;
    return true;
  }
});
const sizeBadge = new Proxy({}, {
  get: (_, prop) => getSizeBadge()?.[prop],
  set: (_, prop, value) => {
    const s = getSizeBadge();
    if (s) s[prop] = value;
    return true;
  }
});
const overlay_default = {
  getElements: getOverlayElements,
  showToast,
  showSelection,
  hideSelection,
  updateBox,
  setHint,
  init: initOverlay,
  getOverlay,
  getBox,
  getHint,
  getSizeBadge,
  getToast
};
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => getOverlayElements(), { once: true });
  } else {
    getOverlayElements();
  }
}

"use strict";
initClipboardHandler({
  showFeedback: true,
  toastFn: showToast
});

"use strict";
class RectSelector {
  overlay = null;
  selectionBox = null;
  startX = 0;
  startY = 0;
  isSelecting = false;
  onSelect = null;
  onCancel = null;
  constructor() {
    this.createOverlay();
  }
  createOverlay() {
    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      cursor: "crosshair",
      zIndex: "999999",
      userSelect: "none"
    });
    this.selectionBox = document.createElement("div");
    Object.assign(this.selectionBox.style, {
      position: "absolute",
      border: "2px solid #007bff",
      backgroundColor: "rgba(0, 123, 255, 0.1)",
      display: "none",
      pointerEvents: "none"
    });
    const instruction = document.createElement("div");
    Object.assign(instruction.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      zIndex: "1000000",
      pointerEvents: "none"
    });
    instruction.textContent = "Click and drag to select area. Press Escape to cancel.";
    this.overlay.appendChild(this.selectionBox);
    this.overlay.appendChild(instruction);
    document.body.appendChild(this.overlay);
    this.attachEventListeners();
  }
  attachEventListeners() {
    if (!this.overlay) return;
    this.overlay.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isSelecting = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      if (this.selectionBox) {
        Object.assign(this.selectionBox.style, {
          left: `${this.startX}px`,
          top: `${this.startY}px`,
          width: "0px",
          height: "0px",
          display: "block"
        });
      }
    });
    this.overlay.addEventListener("mousemove", (e) => {
      if (!this.isSelecting || !this.selectionBox) return;
      const currentX = e.clientX;
      const currentY = e.clientY;
      const left = Math.min(this.startX, currentX);
      const top = Math.min(this.startY, currentY);
      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);
      Object.assign(this.selectionBox.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      });
    });
    this.overlay.addEventListener("mouseup", (e) => {
      if (!this.isSelecting) return;
      const endX = e.clientX;
      const endY = e.clientY;
      const x = Math.min(this.startX, endX);
      const y = Math.min(this.startY, endY);
      const width = Math.abs(endX - this.startX);
      const height = Math.abs(endY - this.startY);
      if (width > 10 && height > 10) {
        const rect = { x, y, width, height };
        this.cleanup();
        this.onSelect?.(rect);
      } else {
        this.cancel();
      }
      this.isSelecting = false;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.cancel();
      }
    });
  }
  cancel() {
    this.cleanup();
    this.onCancel?.();
  }
  cleanup() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.selectionBox = null;
    this.isSelecting = false;
  }
  // Public API
  selectArea() {
    return new Promise((resolve, reject) => {
      this.onSelect = (rect) => resolve(rect);
      this.onCancel = () => resolve(null);
    });
  }
  destroy() {
    this.cleanup();
    this.onSelect = null;
    this.onCancel = null;
  }
}
globalThis.crxSnipSelectRect = async () => {
  const selector = new RectSelector();
  try {
    return await selector.selectArea();
  } finally {
    selector.destroy();
  }
};

"use strict";
const isInCrx = typeof chrome !== "undefined" && chrome.runtime?.id;
let crxModule = null;
const getCrxModule = async () => {
  if (!crxModule && isInCrx) crxModule = await createRuntimeChannelModule("crx-content-script");
  return crxModule;
};
const MODE_META = {
  recognize: { msgType: "CAPTURE", name: "Recognition", error: "No data recognized", hint: "Select area. Esc — cancel", action: "Recognizing with AI..." },
  solve: { msgType: "CAPTURE_SOLVE", name: "Solving/Answering", error: "Could not solve/answer", hint: "Select problem/question. Esc — cancel", action: "Solving / Answering..." },
  code: { msgType: "CAPTURE_CODE", name: "Code generation", error: "Could not generate code", hint: "Select code request. Esc — cancel", action: "Generating code..." },
  css: { msgType: "CAPTURE_CSS", name: "CSS extraction", error: "Could not extract CSS", hint: "Select UI to extract CSS. Esc — cancel", action: "Extracting CSS styles..." },
  custom: { msgType: "CAPTURE_CUSTOM", name: "Custom instruction", error: "Custom instruction failed", hint: "Select area. Esc — cancel", action: "Processing..." }
};
let injected = false;
let active = false;
let currentMode = "recognize";
let customInstructionId = null;
let customInstructionLabel = null;
const captureTab = async (rect, mode = "recognize") => {
  if (!isInCrx) return Promise.reject(new Error("Not in CRX environment"));
  const module = await getCrxModule();
  if (!module) throw new Error("CRX runtime module not available");
  const meta = MODE_META[mode];
  const payload = { type: meta.msgType, rect };
  if (mode === "custom" && customInstructionId) payload.instructionId = customInstructionId;
  const result = await module.capture(rect, mode);
  if (!result?.ok) {
    const rawError = (result?.error || meta.error || "").trim();
    const visibleError = rawError.length > 500 ? `${rawError.slice(0, 500)}
…` : rawError;
    showToast(visibleError || meta.error);
  } else if (!result.data) {
    showToast("No text found in selected area");
  }
  return result;
};
function startSnip(mode = "recognize", instructionId, instructionLabel) {
  if (active) return;
  currentMode = mode;
  customInstructionId = instructionId || null;
  customInstructionLabel = instructionLabel || null;
  const overlay = getOverlay();
  const box = getBox();
  const hint = getHint();
  const sizeBadge = getSizeBadge();
  if (!overlay || !box) {
    console.warn("[Snip] overlay not ready");
    return;
  }
  let startX = 0, startY = 0, currX = 0, currY = 0, dragging = false;
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
    }
  };
  const onMouseDown = (e) => {
    if (e.button !== 0 || !active) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    currX = startX;
    currY = startY;
    updateBox();
    if (hint) hint.textContent = "";
    if (sizeBadge) sizeBadge.textContent = "";
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    currX = e.clientX;
    currY = e.clientY;
    updateBox();
  };
  const onMouseUp = async (e) => {
    if (!dragging) return;
    e.preventDefault();
    dragging = false;
    const x = Math.min(startX, currX), y = Math.min(startY, currY);
    const w = Math.abs(currX - startX), h = Math.abs(currY - startY);
    cleanup();
    if (w < 2 || h < 2) {
      showToast("Selection is too small");
      return;
    }
    const meta = MODE_META[currentMode];
    const actionText = currentMode === "custom" && customInstructionLabel ? `${customInstructionLabel}...` : meta.action;
    showToast(actionText);
    try {
      const result = await captureTab({ x, y, width: w, height: h }, currentMode).catch(() => null);
      if (!result?.success) {
      }
    } catch {
      showToast(`${meta.name} failed`);
    }
  };
  const onCancel = () => {
    if (dragging) {
      dragging = false;
      cleanup();
    }
  };
  function updateBox() {
    const x = Math.min(startX, currX), y = Math.min(startY, currY);
    const w = Math.abs(currX - startX), h = Math.abs(currY - startY);
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
    if (sizeBadge) {
      sizeBadge.textContent = `${Math.round(w)} × ${Math.round(h)}`;
      sizeBadge.style.left = `${w}px`;
      sizeBadge.style.top = `${h}px`;
      if (!sizeBadge.isConnected) box.appendChild(sizeBadge);
    }
  }
  function cleanup() {
    active = false;
    dragging = false;
    document.removeEventListener("keydown", onKeyDown, true);
    overlay.removeEventListener("mousedown", onMouseDown);
    overlay.removeEventListener("mousemove", onMouseMove);
    overlay.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mousecancel", onCancel, true);
    hideSelection();
  }
  document.addEventListener("keydown", onKeyDown, true);
  overlay.addEventListener("mousedown", onMouseDown);
  overlay.addEventListener("mousemove", onMouseMove);
  overlay.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousecancel", onCancel, true);
  active = true;
  showSelection();
  const hintText = currentMode === "custom" && customInstructionLabel ? `Select for "${customInstructionLabel}". Esc — cancel` : MODE_META[currentMode].hint;
  if (hint) hint.textContent = hintText;
  if (sizeBadge) sizeBadge.textContent = "";
}
const initSnip = () => {
  if (injected) return;
  injected = true;
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "START_SNIP") startSnip("recognize");
    if (msg?.type === "SOLVE_AND_ANSWER" || msg?.type === "SOLVE_EQUATION" || msg?.type === "ANSWER_QUESTION") startSnip("solve");
    if (msg?.type === "WRITE_CODE") startSnip("code");
    if (msg?.type === "EXTRACT_CSS") startSnip("css");
    if (msg?.type === "CUSTOM_INSTRUCTION" && msg?.instructionId) startSnip("custom", msg.instructionId, msg.label);
  });
};
if (isInCrx) {
  registerCrxHandler("processingStarted", () => showToast(`Starting ${MODE_META[currentMode].name}...`));
  registerCrxHandler("processingError", (data) => showToast(`Processing failed: ${data.error}`, "error"));
  registerCrxHandler("processingProgress", (data) => {
    if (data.progress > 0 && data.progress < 100) showToast(`${MODE_META[currentMode].name}: ${data.progress}%`);
  });
  registerCrxHandler("processingComplete", () => {
  });
}
initSnip();

"use strict";
initOverlay();
const cleanupToast = initToastReceiver();
const cleanupClipboard = initClipboardReceiver();
if (typeof window !== "undefined") {
  globalThis?.addEventListener?.("pagehide", () => {
    cleanupToast?.();
    cleanupClipboard?.();
  }, { once: true });
}
const coordinate = [0, 0];
let lastElement = null;
const savePosition = (e) => {
  coordinate[0] = e.clientX;
  coordinate[1] = e.clientY;
  lastElement = e.target;
};
document.addEventListener("pointerdown", savePosition, { passive: true, capture: true });
document.addEventListener("pointerup", savePosition, { passive: true, capture: true });
document.addEventListener("click", savePosition, { passive: true, capture: true });
document.addEventListener("contextmenu", (e) => {
  savePosition(e);
  lastElement = e.target || lastElement;
}, { passive: true, capture: true });
const copyOps = /* @__PURE__ */ new Map([
  ["copy-as-latex", copyAsTeX],
  ["copy-as-mathml", copyAsMathML],
  ["copy-as-markdown", copyAsMarkdown],
  ["copy-as-html", copyAsHTML]
]);
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "highlight-selection") {
    sendResponse({ selection: (typeof window != "undefined" ? window : globalThis)?.getSelection()?.toString?.() ?? "" });
    return true;
  }
  if (typeof msg?.type === "string" && copyOps.has(msg.type)) {
    (async () => {
      const op = copyOps.get(msg.type);
      const target = lastElement || document.elementFromPoint(coordinate[0], coordinate[1]) || document.body;
      try {
        const mayTranslate = msg.type === "copy-as-markdown" || msg.type === "copy-as-html";
        if (mayTranslate) showToast("Processing...");
        await op(target);
        showToast("Copied");
        sendResponse({ ok: true });
      } catch (e) {
        console.warn("[Content] Copy operation failed:", e);
        showToast("Failed to copy");
        sendResponse({ ok: false });
      }
    })();
    return true;
  }
  return false;
});
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "crx-snip-select-rect") return false;
  (async () => {
    try {
      if (!(typeof window != "undefined" ? window : globalThis).crxSnipSelectRect) await new Promise((r) => setTimeout(r, 100));
      if (!(typeof window != "undefined" ? window : globalThis).crxSnipSelectRect) throw new Error("Rect selector not available");
      sendResponse({ rect: await (typeof window != "undefined" ? window : globalThis)?.crxSnipSelectRect?.() });
    } catch (e) {
      sendResponse({ rect: null, error: e instanceof Error ? e.message : String(e) });
    }
  })();
  return true;
});
const showPageNotification = (message, type = "info") => {
  try {
    document.querySelectorAll(".crossword-crx-notification").forEach((el2) => el2.remove());
    const colors = { success: "#10b981", error: "#ef4444", info: "#3b82f6" };
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    const el = document.createElement("div");
    el.className = "crossword-crx-notification";
    Object.assign(el.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: colors[type],
      color: "white",
      padding: "16px 20px",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "system-ui, sans-serif",
      fontWeight: "500",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      zIndex: "2147483647",
      maxWidth: "450px",
      wordWrap: "break-word",
      opacity: "0",
      transform: "translateY(-20px) scale(0.95)",
      transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      border: "1px solid rgba(255,255,255,0.2)",
      backdropFilter: "blur(10px)",
      cursor: "pointer"
    });
    el.innerHTML = `<div style="display:flex;align-items:center;gap:12px"><span style="font-size:18px">${icons[type]}</span><div style="flex:1;line-height:1.4">${message}</div></div>`;
    el.addEventListener("click", () => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-20px) scale(0.95)";
      setTimeout(() => el.remove(), 400);
    });
    (document.body || document.documentElement).appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0) scale(1)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-20px) scale(0.95)";
      setTimeout(() => el.remove(), 400);
    }, 5e3);
  } catch {
    if ("Notification" in (typeof window != "undefined" ? window : globalThis) && Notification.permission === "granted") {
      new Notification("CrossWord", { body: message, icon: chrome.runtime.getURL("icons/icon.png") });
    }
  }
};
const resultBC = new BroadcastChannel("rs-content-script");
resultBC.onmessage = ({ data }) => {
  if (data?.type === "crx-result-delivered" && data.result?.type === "processed" && typeof data.result.content === "string") {
    const preview = data.result.content.length > 60 ? data.result.content.slice(0, 60) + "..." : data.result.content;
    showPageNotification(`📋 Copied to clipboard!
${preview}`, "success");
  }
};
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "crx-result-delivered" && msg.result?.type === "processed" && typeof msg.result.content === "string") {
    const preview = msg.result.content.length > 60 ? msg.result.content.slice(0, 60) + "..." : msg.result.content;
    showPageNotification(`📋 Copied to clipboard!
${preview}`, "success");
  }
});
//# sourceMappingURL=content.js.map
