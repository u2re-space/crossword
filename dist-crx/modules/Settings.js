import { isArrayOrIterable, cvt_cs_to_os, camelToKebab as camelToKebab$1, hasValue, tryStringAsNumber, normalizePrimitive, $avoidTrigger, kebabToCamel as kebabToCamel$1, isVal, isValueUnit, isPrimitive, objectAssign, bindCtx, isNotEqual, makeTriggerLess, tryParseByHint, potentiallyAsync, potentiallyAsyncMap, isArrayInvalidKey, $triggerLock as $triggerLock$1, defaultByType, callByProp, callByAllProp, isKeyType, objectAssignNotEqual, $getValue, toRef as toRef$1, deref as deref$1, handleListeners, $set as $set$1, isObservable as isObservable$1, canBeInteger, contextify, inProxy, bindEvent, unref, isValueRef, isObject, getValue, isValidObj, WRef, withCtx, clamp as clamp$1, createWorkerChannel, QueuedWorkerChannel, UUIDv4, __vitePreload, redirectCell, convertOrientPxToCX } from './index.js';

[
  // @ts-ignore
  { name: "--screen-width", syntax: "<length-percentage>", inherits: true, initialValue: "0px" },
  { name: "--screen-height", syntax: "<length-percentage>", inherits: true, initialValue: "0px" },
  { name: "--visual-width", syntax: "<length-percentage>", inherits: true, initialValue: "0px" },
  { name: "--visual-height", syntax: "<length-percentage>", inherits: true, initialValue: "0px" },
  { name: "--clip-ampl", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--clip-freq", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--avail-width", syntax: "<length-percentage>", inherits: true, initialValue: "0px" },
  { name: "--avail-height", syntax: "<length-percentage>", inherits: true, initialValue: "0px" },
  { name: "--pixel-ratio", syntax: "<number>", inherits: true, initialValue: "1" },
  { name: "--percent", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--percent-x", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--percent-y", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--scroll-left", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--scroll-top", syntax: "<number>", inherits: true, initialValue: "0" },
  { name: "--drag-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--drag-y", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--resize-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--resize-y", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--shift-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--shift-y", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-p-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-p-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--os-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--os-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--rv-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--rv-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cell-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cell-y", syntax: "<number>", inherits: false, initialValue: "0" }
].forEach((options) => {
  if (typeof CSS != "undefined") {
    try {
      CSS?.registerProperty?.(options);
    } catch (e) {
      console.warn(e);
    }
  }
});
const __exportProperties = () => {
};

const isMobile = () => {
  let check = navigator?.userAgentData?.mobile || false;
  ((a) => {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || globalThis.opera);
  return check;
  const f1 = matchMedia("(hover: none) and (pointer: coarse) and (display-mode: fullscreen)").matches;
  const f2 = "ontouchstart" in window || "onmsgesturechange" in window;
  return f1 && f2;
};
const detectMobile = () => {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];
  return toMatch.some(navigator.userAgent.match.bind(navigator.userAgent)) && (navigator.maxTouchPoints || "ontouchstart" in document.documentElement) && globalThis.matchMedia("(pointer: coarse)").matches;
};

const getOffsetParent = (element) => {
  return element?.offsetParent ?? element?.host;
};
const getOffsetParentChain = (element) => {
  const parents = [];
  let current = element;
  while (current) {
    const parent = getOffsetParent(current);
    if (parent && parent instanceof HTMLHtmlElement) {
      break;
    }
    if (current = parent) {
      parents.push(current);
    }
  }
  return parents;
};
const isNearlyIdentity = (matrix, epsilon = 1e-6) => {
  return Math.abs(matrix.a - 1) < epsilon && Math.abs(matrix.b) < epsilon && Math.abs(matrix.c) < epsilon && Math.abs(matrix.d - 1) < epsilon && Math.abs(matrix.e) < epsilon && Math.abs(matrix.f) < epsilon;
};
const makeRAFCycle = () => {
  const control = {
    canceled: false,
    rAFs: /* @__PURE__ */ new Set(),
    last: null,
    cancel() {
      this.canceled = true;
      cancelAnimationFrame(this.last);
      return this;
    },
    shedule(cb) {
      this.rAFs.add(cb);
      return this;
    }
  };
  (async () => {
    while (!control?.canceled) {
      await Promise.all((control?.rAFs?.values?.() ?? [])?.map?.((rAF) => Promise.try(rAF)?.catch?.(console.warn.bind(console))));
      control.rAFs?.clear?.();
      if (typeof requestAnimationFrame != "undefined") {
        await new Promise((res) => {
          control.last = requestAnimationFrame(res);
        });
      } else {
        await new Promise((res) => {
          setTimeout(res, 16);
        });
      }
    }
  })();
  return control;
};
const RAFBehavior = (shed = makeRAFCycle()) => {
  return (cb) => shed.shedule(cb);
};
;
const ROOT$2 = typeof document != "undefined" ? document?.documentElement : null;
const setAttributesIfNull = (element, attrs = {}) => {
  if (!attrs || typeof attrs != "object" || !element) return;
  return Array.from(Object.entries(attrs)).map(([name, value]) => {
    const old = element.getAttribute(name);
    if (value == null) {
      element.removeAttribute(name);
    } else if (value != old) {
      element.setAttribute(name, old == "" ? value ?? old : old ?? value);
    }
  });
};
const setAttributes = (element, attrs = {}) => {
  return Array.from(Object.entries(attrs)).map(([name, value]) => {
    if (value == null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value ?? element.getAttribute(name));
    }
  });
};
const throttleMap = /* @__PURE__ */ new Map();
const setIdleInterval$1 = (cb, timeout = 1e3, ...args) => {
  const status = { running: true, cancel: () => {
    status.running = false;
  } };
  requestIdleCallback(async () => {
    if (!cb || typeof cb != "function") return;
    while (status.running) {
      await Promise.all([
        // @ts-ignore
        Promise.try(cb, ...args),
        new Promise((r) => setTimeout(r, timeout))
      ]).catch?.(console.warn.bind(console));
      await Promise.any([
        new Promise((r) => requestIdleCallback(r, { timeout })),
        new Promise((r) => setTimeout(r, timeout))
        //new Promise((r)=>requestAnimationFrame(r))
      ]);
    }
    status.cancel = () => {
    };
  }, { timeout });
  return status?.cancel;
};
if (typeof requestAnimationFrame != "undefined") {
  requestAnimationFrame(async () => {
    while (true) {
      throttleMap.forEach((cb) => cb?.());
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
}
const borderBoxWidth = Symbol("@border-box-width"), borderBoxHeight = Symbol("@border-box-height");
const contentBoxWidth = Symbol("@content-box-width"), contentBoxHeight = Symbol("@content-box-height");
const onBorderObserve$1 = /* @__PURE__ */ new WeakMap();
const onContentObserve$1 = /* @__PURE__ */ new WeakMap();
const doContentObserve = (element, cb = () => {
}) => {
  if (!(element instanceof HTMLElement)) return;
  if (!onContentObserve$1.has(element)) {
    element[contentBoxWidth] = element.clientWidth;
    element[contentBoxHeight] = element.clientHeight;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0];
          if (contentBoxSize) {
            element[contentBoxWidth] = Math.min(contentBoxSize.inlineSize, element.clientWidth);
            element[contentBoxHeight] = Math.min(contentBoxSize.blockSize, element.clientHeight);
            cb?.(element);
          }
        }
      }
    });
    onContentObserve$1.set(element, observer);
    observer.observe(element?.element ?? element, { box: "content-box" });
  }
};
const doBorderObserve = (element, cb = () => {
}) => {
  if (!(element instanceof HTMLElement)) return;
  if (!onBorderObserve$1.has(element)) {
    element[borderBoxWidth] = element.offsetWidth;
    element[borderBoxHeight] = element.offsetHeight;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.borderBoxSize) {
          const borderBoxSize = entry.borderBoxSize[0];
          if (borderBoxSize) {
            element[borderBoxWidth] = Math.min(borderBoxSize.inlineSize, element.offsetWidth);
            element[borderBoxHeight] = Math.min(borderBoxSize.blockSize, element.offsetHeight);
            cb?.(element);
          }
        }
      }
    });
    onBorderObserve$1.set(element, observer);
    observer.observe(element?.element ?? element, { box: "border-box" });
  }
};
const url = (type, ...source) => {
  return URL.createObjectURL(new Blob(source, { type }));
};
const html$1 = (source, type = "text/html") => {
  const parsed = new DOMParser().parseFromString(source, type);
  return parsed.querySelector("template") ?? parsed.querySelector("*");
};
const setChecked = (input, value, ev) => {
  if (value != null && input.checked != value) {
    if (input?.["type"] == "checkbox" || input?.["type"] == "radio" && !input?.checked) {
      input?.click?.();
      ev?.preventDefault?.();
    } else {
      input.checked = !!value;
      input?.dispatchEvent?.(new Event("change", { bubbles: true, cancelable: true }));
    }
  }
};
const isValidParent$1 = (parent) => {
  return parent != null && parent instanceof HTMLElement && !(parent instanceof DocumentFragment || parent instanceof HTMLBodyElement) ? parent : null;
};
const indexOf = (element, node) => {
  if (element == null || node == null) return -1;
  return Array.from(element?.childNodes ?? [])?.indexOf?.(node) ?? -1;
};
const MATCH = "(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)", REGEX = "^(?:" + MATCH + ")|^#" + MATCH + "|^\\." + MATCH + "|^\\[" + MATCH + `(?:([*$|~^]?=)(["'])((?:(?=(\\\\?))\\8.)*?)\\6)?\\]`;
const createElementVanilla = (selector) => {
  if (selector == ":fragment:") return document.createDocumentFragment();
  const create = document.createElement.bind(document);
  for (var node = create("div"), match, className = ""; selector && (match = selector.match(REGEX)); ) {
    if (match[1]) node = create(match[1]);
    if (match[2]) node.id = match[2];
    if (match[3]) className += " " + match[3];
    if (match[4]) node.setAttribute(match[4], match[7] || "");
    selector = selector.slice(match[0].length);
  }
  if (className) node.className = className.slice(1);
  return node;
};
const isElement = (el) => {
  return el != null && (el instanceof Node || el instanceof Text || el instanceof Element || el instanceof Comment || el instanceof HTMLElement || el instanceof DocumentFragment) ? el : null;
};
const includeSelf = (target, selector) => {
  return target.querySelector(selector) ?? (target.matches(selector) ? target : null);
};
const hasParent = (current, parent) => {
  while (current) {
    if (!(current?.element ?? current)) {
      return false;
    }
    ;
    if ((current?.element ?? current) === (parent?.element ?? parent)) return true;
    current = current.parentElement ?? (current.parentNode == current?.getRootNode?.({ composed: true }) ? current?.getRootNode?.({ composed: true })?.host : current?.parentNode);
  }
};
const passiveOpts$1 = {};
function addEvent(target, type, cb, opts = passiveOpts$1) {
  target?.addEventListener?.(type, cb, opts);
  const wr = typeof target == "object" || typeof target == "function" && !target?.deref ? new WeakRef(target) : target;
  return () => wr?.deref?.()?.removeEventListener?.(type, cb, opts);
}
function removeEvent(target, type, cb, opts = passiveOpts$1) {
  target?.removeEventListener?.(type, cb, opts);
}
const addEvents = (root, handlers) => {
  root = root instanceof WeakRef ? root.deref() : root;
  return [...Object.entries(handlers)]?.map?.(([name, cb]) => Array.isArray(cb) ? addEvent(root, name, ...cb) : addEvent(root, name, cb));
};
const addEventsList = (el, events) => {
  if (events) {
    let entries = events;
    if (events instanceof Map) {
      entries = [...events.entries()];
    } else {
      entries = [...Object.entries(events)];
    }
    return entries.map(([name, list]) => ((isArrayOrIterable(list) ? [...list] : list) ?? [])?.map?.((cbs) => {
      return addEvent(el, name, cbs);
    }));
  }
};
const removeEvents = (root, handlers) => {
  root = root instanceof WeakRef ? root.deref() : root;
  return [...Object.entries(handlers)]?.map?.(([name, cb]) => Array.isArray(cb) ? removeEvent(root, name, ...cb) : removeEvent(root, name, cb));
};
const getEventTarget = (ev) => {
  if (!ev) return null;
  if (ev?.composedPath && typeof ev.composedPath === "function") {
    const path = ev.composedPath();
    for (const node of path) {
      if (node instanceof HTMLElement || node instanceof Element) {
        return node;
      }
    }
  }
  const target = ev?.target;
  if (target instanceof HTMLElement || target instanceof Element) {
    return target;
  }
  return null;
};
const containsOrSelf = (a, b, ev) => {
  if (b == null || !(b instanceof Node) && b?.element == null) return false;
  if (a == b || (a?.element ?? a) == (b?.element ?? b)) return true;
  if (ev?.composedPath && typeof ev.composedPath === "function") {
    const path = ev.composedPath();
    const aEl = a?.element ?? a;
    const bEl = b?.element ?? b;
    if (path.includes(aEl) && path.includes(bEl)) {
      const aIndex = path.indexOf(aEl);
      const bIndex = path.indexOf(bEl);
      if (bIndex >= 0 && aIndex >= 0 && bIndex < aIndex) return true;
    }
  }
  if (a?.contains?.(b?.element ?? b) || a?.getRootNode({ composed: true })?.host == (b?.element ?? b)) return true;
  return false;
};
const MOCElement = (element, selector, ev) => {
  if (ev?.composedPath && typeof ev.composedPath === "function") {
    const path = ev.composedPath();
    for (const node of path) {
      if (node instanceof HTMLElement || node instanceof Element) {
        if (node.matches?.(selector)) {
          return node;
        }
      }
    }
  }
  const self = element?.matches?.(selector) ? element : null;
  const host = (element?.getRootNode({ composed: true }) ?? element?.parentElement?.getRootNode({ composed: true }))?.host;
  const hostMatched = host?.matches?.(selector) ? host : null;
  const closest = element?.closest?.(selector) ?? self?.closest?.(selector) ?? hostMatched?.closest?.(selector) ?? null;
  return self ?? closest ?? hostMatched;
};
const MOC = (element, selector) => {
  return !!MOCElement(element, selector);
};
const isInFocus = (element, selectorOrElement, dir = "parent") => {
  if (!element) return false;
  if (element.checkVisibility && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
  if (!element.checkVisibility && element.offsetParent === null && element.style.position !== "fixed") return false;
  let active = document.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  const isFocused = active === element || hasParent(active, element);
  const isHovered = element.matches(":hover");
  if (!isFocused && !isHovered && !selectorOrElement) return false;
  if (selectorOrElement) {
    if (typeof selectorOrElement === "string") {
      if (dir === "parent") {
        return !!MOCElement(element, selectorOrElement);
      } else {
        const target = isFocused ? active : element.querySelector(":hover") || element;
        const altCnd = !!MOCElement(target, selectorOrElement);
        return element?.querySelector?.(selectorOrElement) != null || element?.matches?.(selectorOrElement) || altCnd;
      }
    } else if (selectorOrElement instanceof HTMLElement) {
      if (dir === "parent") {
        return hasParent(element, selectorOrElement) || false;
      } else {
        return hasParent(selectorOrElement, element) || false;
      }
    }
  }
  return true;
};

const getZoom = () => {
  const zoomSupport = "currentCSSZoom" in document.documentElement;
  if (zoomSupport) {
    return document.documentElement.currentCSSZoom || 1;
  }
  return parseFloat(document.documentElement.style.getPropertyValue("--scaling") || "1") || 1;
};
const zoomValues = /* @__PURE__ */ new WeakMap();
const zoomOf = (element = document.documentElement) => {
  return zoomValues.getOrInsertComputed(element, () => {
    const container = (element?.matches?.(".ui-orientbox") ? element : null) || element?.closest?.(".ui-orientbox") || document.body;
    if (container?.zoom) {
      return container?.zoom || 1;
    }
    if (element?.currentCSSZoom) {
      return element?.currentCSSZoom || 1;
    }
  });
};
const changeZoom = (scale = 1) => {
  document.documentElement.style.setProperty("--scaling", scale);
  document.documentElement.dispatchEvent(new CustomEvent("scaling", {
    detail: { zoom: scale },
    bubbles: true,
    cancelable: true
  }));
  return scale;
};
const fixedClientZoom = (element = document.documentElement) => {
  return (element?.currentCSSZoom != null ? 1 : zoomOf(element)) || 1;
};
const unfixedClientZoom = (element = document.documentElement) => {
  return (element?.currentCSSZoom == null ? 1 : element?.currentCSSZoom) || 1;
};
const orientOf = (element = document.documentElement) => {
  const container = (element?.matches?.('[orient], [data-mixin="ui-orientbox"]') ? element : null) || element?.closest?.('[orient], [data-mixin="ui-orientbox"]') || element;
  if (container?.hasAttribute?.("orient")) {
    return parseInt(container?.getAttribute?.("orient") || "0") || 0;
  }
  ;
  return container?.orient || 0;
};
const getBoundingOrientRect = (element, orient = null) => {
  const zoom = unfixedClientZoom(element) || 1;
  const box = element?.getBoundingClientRect?.();
  const nbx = {
    left: box?.left / zoom,
    right: box?.right / zoom,
    top: box?.top / zoom,
    bottom: box?.bottom / zoom,
    width: box?.width / zoom,
    height: box?.height / zoom
  };
  const or_i = orient ?? (orientOf(element) || 0);
  const size = [document.body.clientWidth / zoom, document.body.clientHeight / zoom];
  const [left_, top_] = cvt_cs_to_os([nbx.left, nbx.top], size, or_i);
  const [right_, bottom_] = cvt_cs_to_os([nbx.right, nbx.bottom], size, or_i);
  const [left, right] = or_i == 0 || or_i == 3 ? [left_, right_] : [right_, left_];
  const [top, bottom] = or_i == 0 || or_i == 1 ? [top_, bottom_] : [bottom_, top_];
  const [width, height] = or_i % 2 ? [nbx.height, nbx.width] : [nbx.width, nbx.height];
  return { left, top, right, bottom, width, height };
};
const bbw = (el, orient = null) => (orient ?? orientOf(el)) % 2 ? el[borderBoxHeight] ?? el?.clientHeight : el[borderBoxWidth] ?? el?.clientWidth;
const bbh = (el, orient = null) => (orient ?? orientOf(el)) % 2 ? el[borderBoxWidth] ?? el?.clientWidth : el[borderBoxHeight] ?? el?.clientHeight;
const cbw = (el, orient = null) => (orient ?? orientOf(el)) % 2 ? el[contentBoxHeight] ?? el?.clientHeight : el[contentBoxWidth] ?? el?.clientWidth;
const cbh = (el, orient = null) => (orient ?? orientOf(el)) % 2 ? el[contentBoxWidth] ?? el?.clientWidth : el[contentBoxHeight] ?? el?.clientHeight;

const getAvailSize = () => {
  const l = typeof matchMedia != "undefined" ? matchMedia("(orientation: landscape)")?.matches : false;
  if (typeof screen != "undefined") {
    const aw = screen?.availWidth + "px";
    const ah = screen?.availHeight + "px";
    return {
      "--screen-width": Math.min(screen?.width, screen?.availWidth) + "px",
      "--screen-height": Math.min(screen?.height, screen?.availHeight) + "px",
      "--avail-width": l ? ah : aw,
      "--avail-height": l ? aw : ah,
      "--view-height": Math.min(screen?.availHeight, window?.innerHeight) + "px",
      "--pixel-ratio": devicePixelRatio || 1
    };
  }
  ;
  return {
    "--screen-width": "0px",
    "--screen-height": "0px",
    "--avail-width": "0px",
    "--avail-height": "0px",
    "--view-height": "0px",
    "--pixel-ratio": 1
  };
};
const availSize = getAvailSize();
const classes = [[":root, :host, :scope", availSize]];
const orientationNumberMap = {
  "portrait-primary": 0,
  // as 0deg, aka. 360deg
  "landscape-primary": 1,
  // as -90deg, aka. 270deg
  "portrait-secondary": 2,
  // as -180deg, aka. 180deg
  "landscape-secondary": 3
  // as -270deg, aka. 90deg
};
const updateVP = (ev) => {
  const rule = document.documentElement;
  Object.assign(availSize, getAvailSize());
  Object.entries(availSize).forEach(([propName, propValue]) => {
    const exists = rule?.style?.getPropertyValue(propName);
    if (!exists || exists != propValue) {
      rule?.style?.setProperty?.(propName, propValue || "", "");
    }
  });
  document.documentElement.style.setProperty("--orientation-secondary", screen?.orientation?.type?.endsWith?.("secondary") ? "1" : "0");
};
const getCorrectOrientation = () => {
  let orientationType = screen.orientation.type;
  if (!globalThis.matchMedia("((display-mode: fullscreen) or (display-mode: standalone) or (display-mode: window-controls-overlay))").matches) {
    if (matchMedia("(orientation: portrait)").matches) {
      orientationType = orientationType.replace("landscape", "portrait");
    } else if (matchMedia("(orientation: landscape)").matches) {
      orientationType = orientationType.replace("portrait", "landscape");
    }
    ;
  }
  return orientationType;
};
const passiveOpts = { passive: true };
const whenAnyScreenChanges = (cb) => {
  let ticking = false;
  const update = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        cb();
        ticking = false;
      });
      ticking = true;
    }
  };
  const unsubscribers = [];
  unsubscribers.push(addEvent(navigator?.virtualKeyboard, "geometrychange", update, passiveOpts));
  unsubscribers.push(addEvent(window?.visualViewport, "scroll", update, passiveOpts));
  unsubscribers.push(addEvent(window?.visualViewport, "resize", update, passiveOpts));
  unsubscribers.push(addEvent(screen?.orientation, "change", update));
  unsubscribers.push(addEvent(window, "resize", update));
  unsubscribers.push(addEvent(document?.documentElement, "fullscreenchange", update));
  unsubscribers.push(addEvent(document, "DOMContentLoaded", update));
  unsubscribers.push(addEvent(matchMedia("(orientation: portrait)"), "change", update));
  update();
  requestIdleCallback(update, { timeout: 100 });
  return () => unsubscribers.forEach((unsub) => unsub());
};
const fixOrientToScreen = (element) => {
  if (!element?.classList?.contains?.("native-portrait-optimized")) {
    element?.classList?.add?.("native-portrait-optimized");
    return whenAnyScreenChanges(() => {
      element.orient = orientationNumberMap?.[getCorrectOrientation()] || 0;
    });
  }
};

const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext("2d");
const initTextStyle = (element, ctx2) => {
  const style = getComputedStyle(element, "");
  if (ctx2 && style) {
    const fontWeight = style.getPropertyValue("font-weight") || "normal";
    const fontSize = style.getPropertyValue("font-size") || "16px";
    const fontFamily = style.getPropertyValue("font-family") || "Times New Roman";
    const fontStretch = style.getPropertyValue("font-stretch") || "normal";
    try {
      ctx2.fontStretch = fontStretch.includes("%") ? "normal" : fontStretch;
    } catch (e) {
    }
    ;
    try {
      ctx2.letterSpacing = style.getPropertyValue("letter-spacing") || "normal";
    } catch (e) {
    }
    ;
    try {
      ctx2.fontKerning = style.getPropertyValue("font-kerning") || "auto";
    } catch (e) {
    }
    ;
    try {
      ctx2.fontVariantCaps = style.getPropertyValue("font-variant-caps") || "normal";
    } catch (e) {
    }
    ;
    try {
      ctx2.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    } catch (e) {
    }
    ;
  }
};
const measureText = (text, element) => {
  if (ctx) {
    initTextStyle(element, ctx);
    try {
      return ctx.measureText(text);
    } catch (e) {
    }
    ;
  }
  return { width: null };
};
const measureInputInFocus = (input) => {
  const text = input.value.slice(0, input.selectionEnd || 0);
  return measureText(text, input);
};
const computeCaretPosition = (input, point) => {
  const text = input?.value || "";
  if (ctx) {
    initTextStyle(input, ctx);
    let currentWidth = 0;
    for (let i = 0; i < text.length; i++) {
      currentWidth = ctx.measureText(text.slice(0, i))?.width;
      if (currentWidth == null) {
        return text.length;
      }
      ;
      if (currentWidth != null && currentWidth >= point[0]) {
        return Math.max(i - 1, 0);
      }
      ;
    }
  }
  return text.length;
};
const computeCaretPositionFromClient = (input, client) => {
  const box = input.getBoundingClientRect();
  const point = [client[0] - box.left / unfixedClientZoom(), client[1] - box.top / unfixedClientZoom()];
  return computeCaretPosition(input, point);
};

const animateShow = async (target) => {
  const animationDone = () => {
    if (!target?.hasAttribute?.("data-hidden")) {
      target?.removeAttribute?.("data-opacity-animation");
      target?.dispatchEvent?.(new CustomEvent("u2-appear", {
        detail: {},
        bubbles: true,
        cancelable: true
      }));
    }
  };
  if (!target?.hasAttribute?.("data-hidden") && target?.dispatchEvent?.(new CustomEvent("u2-before-show", {
    detail: {},
    bubbles: true,
    cancelable: true
  }))) {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !target.hasAttribute("data-opacity-animation") && !target.hasAttribute("data-instant") && target?.getAttribute?.("data-hidden") == null) {
      target.setAttribute("data-opacity-animation", "");
    }
    if (target.hasAttribute("data-opacity-animation") && target?.getAttribute?.("data-hidden") == null) {
      const animate = target.animate([
        {
          easing: "linear",
          offset: 0,
          //
          "--opacity": 0,
          "--scale": 0.8,
          display: "none",
          pointerEvents: "none"
        },
        {
          easing: "linear",
          offset: 0.01,
          //
          "--opacity": 0,
          "--scale": 0.8,
          display: "none",
          pointerEvents: "none"
        },
        {
          easing: "linear",
          offset: 1,
          //
          "--opacity": 1,
          "--scale": 1,
          display: "revert-layer",
          pointerEvents: "revert-layer"
        }
      ], {
        //fill: "forwards",
        duration: isMobile() ? 100 : 80,
        easing: "linear",
        delay: 0
        //rangeStart: "cover 0%",
        //rangeEnd: "cover 100%",
      });
      let done = false;
      const endAnimation = () => {
        if (done) {
          return;
        }
        ;
        done = true;
        events?.forEach?.((event) => event?.());
        animate.currentTime = 1;
        animate.finish();
        animationDone?.();
      };
      const abth = [endAnimation, { once: true, passive: true }];
      const abts = [endAnimation, { once: true, passive: true }];
      const events = addEvents(target, {
        "u2-before-hide": abth,
        "u2-before-show": abts
      });
      await animate.finished;
      endAnimation?.();
    } else {
      const { resolve, reject, promise } = Promise.withResolvers();
      const req = requestAnimationFrame(resolve);
      let done = false;
      const endAnimation = () => {
        if (done) {
          return;
        }
        ;
        done = true;
        events?.forEach?.((event) => event?.());
        cancelAnimationFrame(req);
        resolve(performance.now());
        animationDone?.();
      };
      const abth = [endAnimation, { once: true, passive: true }];
      const abts = [endAnimation, { once: true, passive: true }];
      const events = addEvents(target, {
        "u2-before-hide": abth,
        "u2-before-show": abts
      });
      await promise;
      endAnimation?.();
    }
  }
};
const animateHide = async (target) => {
  const animationDone = () => {
    if (target?.hasAttribute?.("data-hidden")) {
      target?.removeAttribute?.("data-opacity-animation");
      target?.dispatchEvent?.(new CustomEvent("u2-hidden", {
        detail: {},
        bubbles: true,
        cancelable: true
      }));
    }
  };
  if (target?.hasAttribute?.("data-hidden") && target?.dispatchEvent?.(new CustomEvent("u2-before-hide", {
    detail: {},
    bubbles: true,
    cancelable: true
  }))) {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !target.hasAttribute("data-opacity-animation") && !target.hasAttribute("data-instant")) {
      target.setAttribute("data-opacity-animation", "");
    }
    if (target.hasAttribute("data-opacity-animation")) {
      const animate = target.animate([
        {
          easing: "linear",
          offset: 0,
          //
          //"--opacity": 1,
          //"--scale": 1,
          //display: "revert-layer",
          pointerEvents: "none"
        },
        {
          easing: "linear",
          offset: 0.99,
          //
          "--opacity": 0,
          "--scale": 0.8,
          //display: "revert-layer",
          pointerEvents: "none"
        },
        {
          easing: "linear",
          offset: 1,
          //
          "--opacity": 0,
          "--scale": 0.8,
          display: "none",
          pointerEvents: "none"
        }
      ], {
        //fill: "forwards",
        duration: 120,
        easing: "linear",
        delay: 0
        //rangeStart: "cover 0%",
        //rangeEnd: "cover 100%",
      });
      let done = false;
      const endAnimation = () => {
        if (done) {
          return;
        }
        ;
        done = true;
        events?.forEach?.((event) => event?.());
        animate.currentTime = 1;
        animate.finish();
        animationDone?.();
      };
      const abth = [endAnimation, { once: true, passive: true }];
      const abts = [endAnimation, { once: true, passive: true }];
      const events = addEvents(target, {
        "u2-before-show": abts
        //"u2-before-hide": abth
      });
      await animate.finished;
      endAnimation?.();
    } else {
      const { resolve, reject, promise } = Promise.withResolvers();
      const req = requestAnimationFrame(resolve);
      let done = false;
      const endAnimation = () => {
        if (done) {
          return;
        }
        ;
        done = true;
        events?.forEach?.((event) => event?.());
        cancelAnimationFrame(req);
        resolve(performance.now());
        animationDone?.();
      };
      const abth = [endAnimation, { once: true, passive: true }];
      const abts = [endAnimation, { once: true, passive: true }];
      const events = addEvents(target, { "u2-before-hide": abth, "u2-before-show": abts });
      await promise;
      endAnimation?.();
    }
  }
};

const onBorderObserve = /* @__PURE__ */ new WeakMap(), onContentObserve = /* @__PURE__ */ new WeakMap();
const unwrapFromQuery = (element) => {
  if (typeof element?.current == "object") {
    element = element?.element ?? element?.current ?? (typeof element?.self == "object" ? element?.self : null) ?? element;
  }
  ;
  return element;
};
const observeContentBox$1 = (element, cb) => {
  if (!onContentObserve.has(element = unwrapFromQuery(element))) {
    const callbacks = [];
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0];
          if (contentBoxSize) {
            callbacks.forEach((cb2) => cb2?.(contentBoxSize, observer));
          }
        }
      }
    });
    cb?.({
      inlineSize: element.clientWidth,
      blockSize: element.clientHeight
    }, observer);
    onContentObserve.set(element, callbacks);
    if ((element?.element ?? element) instanceof Node) {
      observer.observe(element?.element ?? element, { box: "content-box" });
    }
  }
  onContentObserve.get(element)?.push?.(cb);
  return { disconnect: () => onContentObserve.get(element)?.splice?.(onContentObserve.get(element)?.indexOf(cb) || -1, 1) };
};
const observeBorderBox = (element, cb) => {
  if (!onBorderObserve.has(element = unwrapFromQuery(element))) {
    const callbacks = [];
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.borderBoxSize) {
          const borderBoxSize = entry.borderBoxSize[0];
          if (borderBoxSize) {
            callbacks.forEach((cb2) => cb2?.(borderBoxSize, observer));
          }
        }
      }
    });
    cb?.({
      inlineSize: element.offsetWidth,
      blockSize: element.offsetHeight
    }, observer);
    onBorderObserve.set(element, callbacks);
    if ((element?.element ?? element) instanceof Node) {
      observer.observe(element?.element ?? element, { box: "border-box" });
    }
  }
  onBorderObserve.get(element)?.push?.(cb);
  return { disconnect: () => onBorderObserve.get(element)?.splice?.(onBorderObserve.get(element)?.indexOf(cb) || -1, 1) };
};
const observeAttribute = (element, attribute, cb) => {
  if (typeof element?.selector == "string") {
    return observeAttributeBySelector(element, element?.selector, attribute, cb);
  }
  ;
  const attributeList = new Set((attribute.split(",") || [attribute]).map((s) => s.trim()));
  const observer = new MutationObserver((mutationList, observer2) => {
    for (const mutation of mutationList) {
      if (mutation.attributeName && attributeList.has(mutation.attributeName)) {
        cb(mutation, observer2);
      }
    }
  });
  if ((element?.element ?? element) instanceof Node) {
    observer.observe(element = unwrapFromQuery(element), { attributes: true, attributeOldValue: true, attributeFilter: [...attributeList] });
  }
  attributeList.forEach((attribute2) => cb({ target: element, type: "attributes", attributeName: attribute2, oldValue: element?.getAttribute?.(attribute2) }, observer));
  return observer;
};
const observeAttributeBySelector = (element, selector, attribute, cb) => {
  const attributeList = new Set([...attribute.split(",") || [attribute]].map((s) => s.trim()));
  const observer = new MutationObserver((mutationList, observer2) => {
    for (const mutation of mutationList) {
      if (mutation.type == "childList") {
        const addedNodes = Array.from(mutation.addedNodes) || [];
        const removedNodes = Array.from(mutation.removedNodes) || [];
        addedNodes.push(...Array.from(mutation.addedNodes || []).flatMap((el) => Array.from(el?.querySelectorAll?.(selector) || [])));
        removedNodes.push(...Array.from(mutation.removedNodes || []).flatMap((el) => Array.from(el?.querySelectorAll?.(selector) || [])));
        [...new Set(addedNodes)]?.filter((el) => el?.matches?.(selector))?.map?.((target) => {
          attributeList.forEach((attribute2) => {
            cb({ target, type: "attributes", attributeName: attribute2, oldValue: target?.getAttribute?.(attribute2) }, observer2);
          });
        });
      } else if (mutation.target?.matches?.(selector) && (mutation.attributeName && attributeList.has(mutation.attributeName))) {
        cb(mutation, observer2);
      }
    }
  });
  observer.observe(element = unwrapFromQuery(element), {
    attributeOldValue: true,
    attributes: true,
    attributeFilter: [...attributeList],
    childList: true,
    subtree: true,
    characterData: true
  });
  [...element.querySelectorAll(selector)].map((target) => attributeList.forEach((attribute2) => cb({ target, type: "attributes", attributeName: attribute2, oldValue: target?.getAttribute?.(attribute2) }, observer)));
  return observer;
};
const observeBySelector = (element, selector = "*", cb = (mut, obs) => {
}) => {
  const unwrapNodesBySelector = (nodes) => {
    const $nodes = Array.from(nodes || []) || [];
    $nodes.push(...Array.from(nodes || []).flatMap((el) => Array.from(el?.querySelectorAll?.(selector) || [])));
    return [...Array.from(new Set($nodes).values())].filter((el) => el?.matches?.(selector));
  };
  const handleMutation = (mutation) => {
    const observer2 = obRef?.deref?.();
    const addedNodes = unwrapNodesBySelector(mutation.addedNodes);
    const removedNodes = unwrapNodesBySelector(mutation.removedNodes);
    if (addedNodes.length > 0 || removedNodes.length > 0) {
      cb?.({
        type: mutation.type,
        target: mutation.target,
        attributeName: mutation.attributeName,
        attributeNamespace: mutation.attributeNamespace,
        nextSibling: mutation.nextSibling,
        oldValue: mutation.oldValue,
        previousSibling: mutation.previousSibling,
        addedNodes,
        removedNodes
      }, observer2);
    }
  };
  const handleCome = (ev) => {
    handleMutation({
      addedNodes: [ev?.target].filter((el) => !!el),
      removedNodes: [ev?.relatedTarget].filter((el) => !!el),
      type: "childList",
      target: ev?.currentTarget
    });
  };
  const handleOutCome = (ev) => {
    handleMutation({
      addedNodes: [ev?.relatedTarget].filter((el) => !!el),
      removedNodes: [ev?.target].filter((el) => !!el),
      type: "childList",
      target: ev?.currentTarget
    });
  };
  const handleFocusClick = (ev) => {
    handleMutation({
      addedNodes: [ev?.target].filter((el) => !!el),
      removedNodes: [ev?.relatedTarget || document?.activeElement].filter((el) => !!el),
      type: "childList",
      target: ev?.currentTarget
    });
  };
  const factors = {
    passive: true,
    capture: false
  };
  if (selector?.includes?.(":hover") && selector?.includes?.(":active")) {
    element.addEventListener("pointerover", handleCome, factors);
    element.addEventListener("pointerout", handleOutCome, factors);
    element.addEventListener("pointerdown", handleCome, factors);
    element.addEventListener("pointerup", handleOutCome, factors);
    element.addEventListener("pointercancel", handleOutCome, factors);
    return { disconnect: () => {
      element.removeEventListener("pointerover", handleCome, factors);
      element.removeEventListener("pointerout", handleOutCome, factors);
      element.removeEventListener("pointerdown", handleCome, factors);
      element.removeEventListener("pointerup", handleOutCome, factors);
      element.removeEventListener("pointercancel", handleOutCome, factors);
    } };
  }
  if (selector?.includes?.(":hover")) {
    element.addEventListener("pointerover", handleCome, factors);
    element.addEventListener("pointerout", handleOutCome, factors);
    return { disconnect: () => {
      element.removeEventListener("pointerover", handleCome, factors);
      element.removeEventListener("pointerout", handleOutCome, factors);
    } };
  }
  if (selector?.includes?.(":active")) {
    element.addEventListener("pointerdown", handleCome, factors);
    element.addEventListener("pointerup", handleOutCome, factors);
    element.addEventListener("pointercancel", handleOutCome, factors);
    return { disconnect: () => {
      element.removeEventListener("pointerdown", handleCome, factors);
      element.removeEventListener("pointerup", handleOutCome, factors);
      element.removeEventListener("pointercancel", handleOutCome, factors);
    } };
  }
  if (selector?.includes?.(":focus") && selector?.includes?.(":focus-within") && selector?.includes?.(":focus-visible")) {
    element.addEventListener("focusin", handleCome, factors);
    element.addEventListener("focusout", handleOutCome, factors);
    element.addEventListener("click", handleFocusClick, factors);
    return { disconnect: () => {
      element.removeEventListener("focusin", handleCome, factors);
      element.removeEventListener("focusout", handleOutCome, factors);
      element.removeEventListener("click", handleFocusClick, factors);
    } };
  }
  const observer = new MutationObserver((mutationList, observer2) => {
    for (const mutation of mutationList) {
      if (mutation.type == "childList") {
        handleMutation(mutation);
      }
    }
  });
  const obRef = new WeakRef(observer);
  if ((element?.element ?? element) instanceof Node) {
    observer.observe(element = unwrapFromQuery(element), { childList: true, subtree: true });
  }
  const selected = Array.from(element.querySelectorAll(selector));
  if (selected.length > 0) {
    cb?.({ addedNodes: selected }, observer);
  }
  ;
  return observer;
};

const initVisibility = async (ROOT = document.body) => {
  observeAttributeBySelector(ROOT, "*", "data-hidden", (mutation, observer) => {
    if (mutation.attributeName == "data-hidden") {
      const target = mutation.target;
      if (target.getAttribute("data-hidden") !== mutation.oldValue) {
        Promise?.try?.(target.getAttribute("data-hidden") != null ? animateHide : animateShow, target, observer)?.catch?.(console.warn.bind(console));
      }
    }
  });
};

const blobImageMap = /* @__PURE__ */ new WeakMap(), delayed = /* @__PURE__ */ new Map([]);
const sheduler = makeRAFCycle();
const getImgWidth = (img) => {
  return img?.naturalWidth || img?.width || 1;
};
const getImgHeight = (img) => {
  return img?.naturalHeight || img?.height || 1;
};
const callByFrame = (pointerId, cb) => {
  delayed.set(pointerId, cb);
};
const cover = (ctx, img, scale = 1, port, orient = 0) => {
  const canvas = ctx.canvas;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-orient || 0) * (Math.PI * 0.5));
  ctx.rotate((1 - port) * (Math.PI / 2));
  ctx.translate(-(getImgWidth(img) / 2) * scale, -(getImgHeight(img) / 2) * scale);
};
const createImageBitmapCache = (blob) => {
  if (!blobImageMap.has(blob) && (blob instanceof Blob || blob instanceof File || blob instanceof OffscreenCanvas || blob instanceof ImageBitmap || blob instanceof Image)) {
    blobImageMap.set(blob, createImageBitmap(blob));
  }
  return blobImageMap.get(blob);
};
const bindCache = /* @__PURE__ */ new WeakMap();
const bindCached = (cb, ctx) => {
  return bindCache?.getOrInsertComputed?.(cb, () => cb?.bind?.(ctx));
};
let UICanvas = null;
if (typeof HTMLCanvasElement != "undefined") {
  UICanvas = class UICanvas extends HTMLCanvasElement {
    static observedAttributes = ["data-src", "data-orient"];
    //
    ctx = null;
    image = null;
    #size = [1, 1];
    #loading = "";
    #ready = "";
    //
    get #orient() {
      return parseInt(this.getAttribute("data-orient") || "0") || 0;
    }
    set #orient(value) {
      this.setAttribute("data-orient", value.toString());
    }
    //
    attributeChangedCallback(name, _, newValue) {
      if (name == "data-src") {
        this.#preload(newValue);
      }
      ;
      if (name == "data-orient") {
        this.#render(this.#ready);
      }
      ;
    }
    //
    connectedCallback() {
      const parent = this.parentNode;
      this.style.setProperty("max-inline-size", "min(100%, min(100cqi, 100dvi))");
      this.style.setProperty("max-block-size", "min(100%, min(100cqb, 100dvb))");
      this.#size = [
        // @ts-ignore
        Math.min(Math.min(Math.max(this.clientWidth || parent?.clientWidth || 1, 1), parent?.clientWidth || 1) * (this.currentCSSZoom || 1), screen?.width || 1) * (devicePixelRatio || 1),
        // @ts-ignore
        Math.min(Math.min(Math.max(this.clientHeight || parent?.clientHeight || 1, 1), parent?.clientHeight || 1) * (this.currentCSSZoom || 1), screen?.height || 1) * (devicePixelRatio || 1)
      ];
      this.#preload(this.#loading = this.dataset.src || this.#loading);
    }
    //
    constructor() {
      super();
      const canvas = this;
      const parent = this.parentNode;
      const fixSize = () => {
        const old = this.#size;
        this.#size = [
          // @ts-ignore
          Math.min(Math.min(Math.max(this.clientWidth || parent?.clientWidth || 1, 1), parent?.clientWidth || 1) * (this.currentCSSZoom || 1), screen?.width || 1) * (devicePixelRatio || 1),
          // @ts-ignore
          Math.min(Math.min(Math.max(this.clientHeight || parent?.clientHeight || 1, 1), parent?.clientHeight || 1) * (this.currentCSSZoom || 1), screen?.height || 1) * (devicePixelRatio || 1)
        ];
        if (old?.[0] != this.#size[0] || old?.[1] != this.#size[1]) {
          this.#render(this.#ready);
        }
      };
      sheduler?.shedule?.(() => {
        this.ctx = canvas.getContext("2d", {
          alpha: true,
          desynchronized: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true
        });
        this.inert = true;
        this.style.objectFit = "cover";
        this.style.objectPosition = "center";
        this.classList.add("u-canvas");
        this.classList.add("u2-canvas");
        this.classList.add("ui-canvas");
        this.style.setProperty("max-inline-size", "min(100%, min(100cqi, 100dvi))");
        this.style.setProperty("max-block-size", "min(100%, min(100cqb, 100dvb))");
        fixSize();
        new ResizeObserver((entries) => {
          for (const entry of entries) {
            const box = entry?.devicePixelContentBoxSize?.[0];
            if (box) {
              const old = this.#size;
              this.#size = [
                // @ts-ignore
                Math.max(
                  /*contentBox.inlineSize * devicePixelRatio*/
                  box.inlineSize || this.width,
                  1
                ),
                Math.max(
                  /*contentBox.blockSize  * devicePixelRatio*/
                  box.blockSize || this.height,
                  1
                )
              ];
              if (old?.[0] != this.#size[0] || old?.[1] != this.#size[1]) {
                this.#render(this.#ready);
              }
            }
          }
        }).observe(this, { box: "device-pixel-content-box" });
        this.#preload(this.#loading = this.dataset.src || this.#loading);
      });
    }
    //
    async $useImageAsSource(blob, ready) {
      ready ||= this.#loading;
      const img = blob instanceof ImageBitmap ? blob : await createImageBitmapCache(blob).catch(console.warn.bind(console));
      if (img && ready == this.#loading) {
        this.image = img;
        this.#render(ready);
      }
      return blob;
    }
    //
    $renderPass(whatIsReady) {
      const canvas = this, ctx = this.ctx, img = this.image;
      if (img && ctx && (whatIsReady == this.#loading || !whatIsReady)) {
        if (whatIsReady) {
          this.#ready = whatIsReady;
        }
        ;
        if (this.width != this.#size[0]) {
          this.width = this.#size[0];
        }
        ;
        if (this.height != this.#size[1]) {
          this.height = this.#size[1];
        }
        ;
        this.style.aspectRatio = `${this.width || 1} / ${this.height || 1}`;
        const ox = this.#orient % 2 || 0;
        const port = getImgWidth(img) <= getImgHeight(img) ? 1 : 0;
        const scale = Math.max(
          canvas[["height", "width"][ox]] / (port ? getImgHeight(img) : getImgWidth(img)),
          canvas[["width", "height"][ox]] / (port ? getImgWidth(img) : getImgHeight(img))
        );
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cover(ctx, img, scale, port, this.#orient);
        ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
        ctx.restore();
      }
    }
    //
    #preload(src) {
      const ready = src || this.#loading;
      this.#loading = ready;
      return fetch(src, {
        cache: "force-cache",
        mode: "same-origin",
        priority: "high"
      })?.then?.(async (rsp) => this.$useImageAsSource(await rsp.blob(), ready)?.catch(console.warn.bind(console)))?.catch?.(console.warn.bind(console));
    }
    #render(whatIsReady) {
      const ctx = this.ctx, img = this.image;
      if (img && ctx && (whatIsReady == this.#loading || !whatIsReady)) {
        sheduler?.shedule?.(bindCached(this.$renderPass, this));
      }
    }
  };
} else {
  UICanvas = class UICanvas {
    constructor() {
    }
    $renderPass(whatIsReady) {
    }
    $useImageAsSource(blob, ready) {
      return blob;
    }
    #preload(src) {
      return Promise.resolve();
    }
    #render(whatIsReady) {
    }
    #orient = 0;
    #loading = "";
    #ready = "";
    #size = [1, 1];
    ctx = null;
    image = null;
  };
}
const UICanvas_default = UICanvas;
try {
  customElements.define("ui-canvas", UICanvas, { extends: "canvas" });
} catch (e) {
}
;

const WavyShapedCircle = (steps = 100, amplitude = 0.05, freq = 8) => {
  const points = [];
  for (let i = 0; i < steps; i++) {
    points.push(i / steps);
  }
  const angle = (step) => {
    return `calc(${step}rad * pi * 2)`;
  };
  const variant = (step) => {
    return `calc(calc(cos(calc(var(--clip-freq, 8) * ${angle(step)})) * 0.5 + 0.5) * var(--clip-amplitude, 0))`;
  };
  const func = (step) => [
    `calc(calc(0.5 + calc(cos(${angle(step)}) * calc(0.5 - ${variant(step)}))) * var(--icon-size. 100%))`,
    `calc(calc(0.5 + calc(sin(${angle(step)}) * calc(0.5 - ${variant(step)}))) * var(--icon-size. 100%))`
  ];
  const d = points.map((step) => {
    const stp = func(step).join(" ");
    return stp;
  }).join(", ");
  return { "--clip-amplitude": amplitude, "--clip-freq": freq, "--clip-path": `polygon(${d})` };
};

const OWNER = "DOM", styleElement = typeof document != "undefined" ? document.createElement("style") : null;
if (styleElement) {
  typeof document != "undefined" ? document.querySelector("head")?.appendChild?.(styleElement) : null;
  styleElement.dataset.owner = OWNER;
}
const setStyleURL = (base, url, layer = "") => {
  base[0][base[1]] = base[1] == "innerHTML" ? `@import url("${url}") ${layer && typeof layer == "string" ? `layer(${layer})` : ""};` : url;
};
const setStyleRules = (classes) => {
  return classes?.map?.((args) => setStyleRule(...args));
};
const getStyleLayer = (layerName, sheet) => {
  sheet ||= styleElement?.sheet;
  let layerRuleIndex = Array.from(sheet?.cssRules || []).findIndex((rule) => rule instanceof CSSLayerBlockRule && rule?.name === layerName);
  let layerRule;
  if (layerRuleIndex === -1 && sheet) {
    layerRule = sheet?.cssRules?.[layerRuleIndex = sheet.insertRule(`@layer ${layerName} {}`)];
  } else {
    layerRule = sheet?.cssRules?.[layerRuleIndex];
  }
  return layerRule;
};
const getStyleRule = (selector, sheet, layerName = "ux-query", basis = null) => {
  const root = basis instanceof ShadowRoot ? basis : basis?.getRootNode ? basis.getRootNode({ composed: true }) : typeof document != "undefined" ? document.documentElement : null;
  const uqid = root instanceof ShadowRoot || root instanceof HTMLDocument ? "" : basis?.getAttribute?.("data-style-id") || (typeof crypto != "undefined" ? crypto?.randomUUID?.() : "");
  const usel = root instanceof HTMLDocument ? ":root" : root instanceof ShadowRoot ? ":host" : `[data-style-id="${uqid}"]`;
  basis?.setAttribute?.("data-style-id", uqid);
  let $styleElement;
  if (root instanceof ShadowRoot) {
    if (!($styleElement = root.querySelector("style"))) {
      $styleElement = typeof document != "undefined" ? document.createElement("style[data-ux-query]") : null;
      $styleElement.setAttribute("data-ux-query", "");
      root.appendChild($styleElement);
    }
  } else {
    $styleElement = styleElement;
  }
  sheet ||= $styleElement?.sheet || sheet;
  if (!layerName) {
    let ruleId = Array.from(sheet?.cssRules || []).findIndex((rule) => rule instanceof CSSStyleRule && rule.selectorText?.trim?.()?.endsWith?.(selector?.trim?.() ?? ""));
    if (ruleId === -1 && sheet) {
      ruleId = sheet?.insertRule?.(`${usel || ""} ${selector}`?.trim?.() + " {}");
    }
    return sheet?.cssRules?.[ruleId];
  }
  return getStyleRule(selector, getStyleLayer(layerName, sheet), null, basis);
};
const hasTypedOM = typeof CSSStyleValue !== "undefined" && typeof CSSUnitValue !== "undefined";
const isStyleValue = (val) => hasTypedOM && val instanceof CSSStyleValue;
const isUnitValue = (val) => hasTypedOM && val instanceof CSSUnitValue;
const setPropertyIfNotEqual = (styleRef, kebab, value, importance = "") => {
  if (!styleRef || !kebab) return;
  if (value == null) {
    if (styleRef.getPropertyValue(kebab) !== "") {
      styleRef.removeProperty(kebab);
    }
    return;
  }
  const old = styleRef.getPropertyValue(kebab);
  if (old !== value) {
    styleRef.setProperty(kebab, value, importance);
  }
};
const setStylePropertyTyped = (element, name, value, importance = "") => {
  if (!element || !name) return element;
  const kebab = camelToKebab$1(name);
  const styleRef = element.style;
  const styleMapRef = element.attributeStyleMap ?? element.styleMap;
  if (!hasTypedOM || !styleMapRef) {
    return setStylePropertyFallback(element, name, value, importance);
  }
  let val = hasValue(value) && !(isStyleValue(value) || isUnitValue(value)) ? value?.value : value;
  if (val == null) {
    styleMapRef.delete?.(kebab);
    if (styleRef) {
      setPropertyIfNotEqual(styleRef, kebab, null, importance);
    }
    return element;
  }
  if (isStyleValue(val)) {
    const old = styleMapRef.get(kebab);
    if (isUnitValue(val) && isUnitValue(old)) {
      if (old.value === val.value && old.unit === val.unit) {
        return element;
      }
    } else if (old === val) {
      return element;
    }
    styleMapRef.set(kebab, val);
    return element;
  }
  if (typeof val === "number") {
    if (CSS?.number && !kebab.startsWith("--")) {
      const newVal = CSS.number(val);
      const old = styleMapRef.get(kebab);
      if (isUnitValue(old) && old.value === newVal.value && old.unit === newVal.unit) {
        return element;
      }
      styleMapRef.set(kebab, newVal);
      return element;
    } else {
      setPropertyIfNotEqual(styleRef, kebab, String(val), importance);
      return element;
    }
  }
  if (typeof val === "string" && !isStyleValue(val)) {
    const maybeNum = tryStringAsNumber(val);
    if (typeof maybeNum === "number" && CSS?.number && !kebab.startsWith("--")) {
      const newVal = CSS.number(maybeNum);
      const old = styleMapRef.get(kebab);
      if (isUnitValue(old) && old.value === newVal.value && old.unit === newVal.unit) {
        return element;
      }
      styleMapRef.set(kebab, newVal);
      return element;
    } else {
      setPropertyIfNotEqual(styleRef, kebab, val, importance);
      return element;
    }
  }
  setPropertyIfNotEqual(styleRef, kebab, String(val), importance);
  return element;
};
const setStylePropertyFallback = (element, name, value, importance = "") => {
  if (!element || !name) return element;
  const kebab = camelToKebab$1(name);
  const styleRef = element.style;
  if (!styleRef) return element;
  let val = hasValue(value) && !(isStyleValue(value) || isUnitValue(value)) ? value?.value : value;
  if (typeof val === "string" && !isStyleValue(val)) {
    val = tryStringAsNumber(val) ?? val;
  }
  if (val == null) {
    setPropertyIfNotEqual(styleRef, kebab, null, importance);
    return element;
  }
  if (isStyleValue(val)) {
    setPropertyIfNotEqual(styleRef, kebab, String(val), importance);
    return element;
  }
  if (typeof val === "number") {
    setPropertyIfNotEqual(styleRef, kebab, String(val), importance);
    return element;
  }
  setPropertyIfNotEqual(styleRef, kebab, String(val), importance);
  return element;
};
const promiseOrDirect = (promise, cb) => {
  if (typeof promise?.then == "function") {
    return promise?.then?.(cb);
  }
  return cb(promise);
};
const blobURLMap = /* @__PURE__ */ new WeakMap();
const cacheMap = /* @__PURE__ */ new Map();
const fetchAndCache = (url) => {
  if (!url) return null;
  if (cacheMap.has(url)) {
    return cacheMap.get(url);
  }
  if (url instanceof Blob || url instanceof File) {
    if (blobURLMap.has(url)) {
      return blobURLMap.get(url);
    }
    const burl = URL.createObjectURL(url);
    blobURLMap.set(url, burl);
    cacheMap.set(burl, burl);
    return burl;
  }
  if (URL.canParse(url) || url?.trim?.()?.startsWith?.("./")) {
    const promised = fetch(url?.replace?.("?url", "?raw"), {
      cache: "force-cache",
      mode: "same-origin",
      priority: "high"
    })?.then?.(async (res) => {
      const blob = await res.blob();
      const burl = URL.createObjectURL(blob);
      blobURLMap.set(blob, burl);
      cacheMap.set(url, burl);
      cacheMap.set(burl, burl);
      return burl;
    });
    cacheMap.set(url, promised);
    return promised;
  }
  if (typeof url == "string") {
    const blob = new Blob([url], { type: "text/css" });
    const burl = URL.createObjectURL(blob);
    blobURLMap.set(blob, burl);
    cacheMap.set(burl, burl);
    return burl;
  }
  return url;
};
const cacheContentMap = /* @__PURE__ */ new Map();
const cacheBlobContentMap = /* @__PURE__ */ new WeakMap();
const fetchAsInline = (url) => {
  if (!url) return "";
  if (cacheContentMap.has(url)) {
    return cacheContentMap.get(url) ?? "";
  }
  if (url instanceof Blob || url instanceof File) {
    if (cacheBlobContentMap.has(url)) {
      return cacheBlobContentMap.get(url) ?? "";
    }
    const promised = url?.text?.()?.then?.((text) => {
      cacheBlobContentMap.set(url, text);
      return text;
    });
    cacheBlobContentMap.set(url, promised);
    return promised;
  }
  if (URL.canParse(url) || url?.trim?.()?.startsWith?.("./")) {
    const promised = fetch(url?.replace?.("?url", "?raw"), {
      cache: "force-cache",
      mode: "same-origin",
      priority: "high"
    })?.then?.(async (res) => {
      const text = await res.text();
      cacheContentMap.set(url, text);
      return text;
    });
    cacheContentMap.set(url, promised);
    return promised;
  }
  if (typeof url == "string") {
    cacheContentMap.set(url, url);
    return url;
  }
  return url;
};
const adoptedSelectorMap = /* @__PURE__ */ new Map();
const adoptedShadowSelectorMap = /* @__PURE__ */ new WeakMap();
const adoptedLayerMap = /* @__PURE__ */ new Map();
const adoptedShadowLayerMap = /* @__PURE__ */ new WeakMap();
const getAdoptedStyleRule = (selector, layerName = "ux-query", basis = null) => {
  if (!selector) return null;
  const root = basis instanceof ShadowRoot ? basis : basis?.getRootNode ? basis.getRootNode({ composed: true }) : null;
  const isShadowRoot = root instanceof ShadowRoot;
  const targetAdoptedSheets = isShadowRoot ? root.adoptedStyleSheets : typeof document != "undefined" ? document.adoptedStyleSheets : null;
  if (!targetAdoptedSheets) return null;
  const selectorKey = `${layerName || ""}:${selector}`;
  let sheet;
  if (isShadowRoot) {
    let shadowMap = adoptedShadowSelectorMap.get(root);
    if (!shadowMap) {
      shadowMap = /* @__PURE__ */ new Map();
      adoptedShadowSelectorMap.set(root, shadowMap);
    }
    sheet = shadowMap.get(selectorKey);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      shadowMap.set(selectorKey, sheet);
      if (!targetAdoptedSheets.includes(sheet)) {
        targetAdoptedSheets.push(sheet);
      }
    }
  } else {
    sheet = adoptedSelectorMap.get(selectorKey);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      adoptedSelectorMap.set(selectorKey, sheet);
      if (!targetAdoptedSheets.includes(sheet)) {
        targetAdoptedSheets.push(sheet);
      }
    }
  }
  if (layerName) {
    let layerRule;
    if (isShadowRoot) {
      let shadowLayerMap = adoptedShadowLayerMap.get(root);
      if (!shadowLayerMap) {
        shadowLayerMap = /* @__PURE__ */ new Map();
        adoptedShadowLayerMap.set(root, shadowLayerMap);
      }
      layerRule = shadowLayerMap.get(layerName);
    } else {
      layerRule = adoptedLayerMap.get(layerName);
    }
    if (!layerRule) {
      const rules2 = Array.from(sheet.cssRules || []);
      const layerIndex = rules2.findIndex(
        (rule2) => rule2 instanceof CSSLayerBlockRule && rule2.name === layerName
      );
      if (layerIndex === -1) {
        try {
          sheet.insertRule(`@layer ${layerName} {}`, sheet.cssRules.length);
          const newRule = sheet.cssRules[sheet.cssRules.length - 1];
          if (newRule instanceof CSSLayerBlockRule) {
            layerRule = newRule;
          }
        } catch (e) {
          layerRule = void 0;
        }
      } else {
        layerRule = rules2[layerIndex];
      }
      if (layerRule) {
        if (isShadowRoot) {
          let shadowLayerMap = adoptedShadowLayerMap.get(root);
          if (!shadowLayerMap) {
            shadowLayerMap = /* @__PURE__ */ new Map();
            adoptedShadowLayerMap.set(root, shadowLayerMap);
          }
          shadowLayerMap.set(layerName, layerRule);
        } else {
          adoptedLayerMap.set(layerName, layerRule);
        }
      }
    }
    if (layerRule) {
      const layerRules = Array.from(layerRule.cssRules || []);
      let layerRuleIndex = layerRules.findIndex(
        (r) => r instanceof CSSStyleRule && r.selectorText?.trim?.() === selector?.trim?.()
      );
      if (layerRuleIndex === -1) {
        try {
          layerRuleIndex = layerRule.insertRule(`${selector} {}`, layerRule.cssRules.length);
        } catch (e) {
          return null;
        }
      }
      return layerRule.cssRules[layerRuleIndex];
    }
  }
  const rules = Array.from(sheet.cssRules || []);
  let ruleIndex = rules.findIndex(
    (rule2) => rule2 instanceof CSSStyleRule && rule2.selectorText?.trim?.() === selector?.trim?.()
  );
  if (ruleIndex === -1) {
    try {
      ruleIndex = sheet.insertRule(`${selector} {}`, sheet.cssRules.length);
    } catch (e) {
      return null;
    }
  }
  const rule = sheet.cssRules[ruleIndex];
  if (rule instanceof CSSStyleRule) {
    return rule;
  }
  return null;
};
const setStyleProperty = (element, name, value, importance = "") => {
  return hasTypedOM ? setStylePropertyTyped(element, name, value, importance) : setStylePropertyFallback(element, name, value, importance);
};
const setStyleInRule = (selector, name, value) => {
  return setStyleProperty(getStyleRule(selector), name, value);
};
const setStyleRule = (selector, sheet) => {
  const rule = getStyleRule(selector);
  Object.entries(sheet).forEach(([propName, propValue]) => setStyleProperty(rule, propName, propValue));
  return rule;
};
const hash = async (string) => {
  const hashBuffer = await crypto?.subtle?.digest("SHA-256", typeof string == "string" ? new TextEncoder().encode(string) : string instanceof ArrayBuffer ? string : await string?.arrayBuffer?.());
  return "sha256-" + btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)));
};
const loadStyleSheet = (inline, base, layer = "", integrity) => {
  const load = fetchAndCache(inline);
  const url = typeof inline == "string" ? URL.canParse(inline) ? inline : load : load;
  if (base?.[0]) base[0].fetchPriority = "high";
  if (base && url && typeof url == "string") {
    setStyleURL(base, url, layer);
  }
  ;
  if (base?.[0] && (!URL.canParse(inline) || integrity) && base?.[0] instanceof HTMLLinkElement) {
    const I = null;
  }
  return promiseOrDirect(load, (res) => {
    if (base?.[0] && res) {
      setStyleURL(base, res, layer);
      base?.[0].setAttribute("loaded", "");
    }
  })?.catch?.((error) => {
    console.warn("Failed to load style sheet:", error);
  });
  return base?.[0];
};
const loadBlobStyle = (inline) => {
  const style = typeof document != "undefined" ? document.createElement("link") : null;
  if (style) style.fetchPriority = "high";
  if (style) {
    Object.assign(style, { rel: "stylesheet", type: "text/css", crossOrigin: "same-origin" });
    style.dataset.owner = OWNER;
    loadStyleSheet(inline, [style, "href"]);
    typeof document != "undefined" ? document.head.append(style) : null;
    return style;
  }
  ;
  return null;
};
const loadInlineStyle = (inline, rootElement = typeof document != "undefined" ? document?.head : null, layer = "") => {
  const PLACE = rootElement?.querySelector?.("head") ?? rootElement;
  if (typeof HTMLHeadElement != "undefined" && PLACE instanceof HTMLHeadElement) {
    return loadBlobStyle(inline);
  }
  const style = typeof document != "undefined" ? document.createElement("style") : null;
  if (style) {
    style.dataset.owner = OWNER;
    loadStyleSheet(inline, [style, "innerHTML"], layer);
    PLACE?.prepend?.(style);
    return style;
  }
  return null;
};
const setProperty = (target, name, value, importance = "") => {
  return setStyleProperty(target, name, value, importance);
};
const preloadStyle = (styles) => {
  return loadAsAdopted(styles, "");
};
const adoptedMap = /* @__PURE__ */ new Map();
const adoptedBlobMap = /* @__PURE__ */ new WeakMap();
let layerCounter = 0;
const loadAsAdopted = (styles, layerName = null) => {
  if (typeof styles == "string" && adoptedMap?.has?.(styles)) {
    return adoptedMap.get(styles);
  }
  if ((styles instanceof Blob || styles instanceof File) && adoptedBlobMap?.has?.(styles)) {
    return adoptedBlobMap.get(styles);
  }
  if (!styles) return null;
  const sheet = typeof styles == "string" ? (
    //@ts-ignore
    adoptedMap.getOrInsertComputed(styles, (styles2) => new CSSStyleSheet())
  ) : (
    //@ts-ignore
    adoptedBlobMap.getOrInsertComputed(styles, (styles2) => new CSSStyleSheet())
  );
  if (typeof document != "undefined" && document.adoptedStyleSheets && !document.adoptedStyleSheets.includes(sheet)) {
    document.adoptedStyleSheets.push(sheet);
  }
  if (typeof styles == "string" && !URL.canParse(styles)) {
    const layerWrapped = layerName ? `@layer ${layerName} { ${styles} }` : styles;
    adoptedMap.set(styles, sheet);
    if (layerWrapped.length > 5e4 && typeof sheet.replace === "function") {
      sheet.replace(layerWrapped).catch?.(() => {
      });
    } else {
      sheet.replaceSync(layerWrapped);
    }
    return sheet;
  } else {
    promiseOrDirect(fetchAsInline(styles), (cached) => {
      adoptedMap.set(cached, sheet);
      if (cached) {
        const layerWrapped = layerName ? `@layer ${layerName} { ${cached} }` : cached;
        if (layerWrapped.length > 5e4 && typeof sheet.replace === "function") {
          sheet.replace(layerWrapped).catch?.(() => {
          });
        } else {
          sheet.replaceSync(layerWrapped);
        }
        return sheet;
      }
      ;
    });
  }
  return sheet;
};
const removeAdopted = (sheet) => {
  if (!sheet) return false;
  const target = typeof sheet === "string" ? adoptedMap.get(sheet) : sheet;
  if (!target || typeof document === "undefined") return false;
  const sheets = document.adoptedStyleSheets;
  const idx = sheets.indexOf(target);
  if (idx !== -1) {
    sheets.splice(idx, 1);
    return true;
  }
  return false;
};
const parseOrigin = (origin, element) => {
  const values = origin.split(" ");
  return new DOMPoint(parseLength(values[0], () => element.clientWidth), parseLength(values[1], () => element.clientHeight));
};
const parseLength = (value, size) => {
  if (value.endsWith("%")) {
    return parseFloat(value) / 100 * size();
  }
  ;
  return parseFloat(value);
};
const getTransform = (el) => {
  if (el?.computedStyleMap) {
    const styleMap = el.computedStyleMap(), transform = styleMap.get("transform"), matrix = transform?.toMatrix?.();
    if (matrix) return matrix;
  } else if (el) {
    const style = getComputedStyle(el);
    return new DOMMatrix(style?.getPropertyValue?.("transform"));
  }
  return new DOMMatrix();
};
const getTransformOrigin = (el) => {
  const style = getComputedStyle(el), cssOrigin = style?.getPropertyValue?.("transform-origin") || `50% 50%`;
  return parseOrigin(cssOrigin, el);
};
const getPropertyValue = (src, name) => {
  if ("computedStyleMap" in src) {
    const val = src?.computedStyleMap?.()?.get(name);
    return val instanceof CSSUnitValue ? val?.value || 0 : val?.toString?.();
  }
  if (src instanceof HTMLElement) {
    const cs = getComputedStyle?.(src, "");
    return parseFloat(cs?.getPropertyValue?.(name)?.replace?.("px", "")) || 0;
  }
  return parseFloat((src?.style ?? src).getPropertyValue?.(name)?.replace?.("px", "")) || 0 || 0;
};
const getElementZoom = (element) => {
  let zoom = 1, currentElement = element;
  while (currentElement) {
    if ("currentCSSZoom" in currentElement) {
      const currentCSSZoom = currentElement.currentCSSZoom;
      if (typeof currentCSSZoom === "number") {
        return zoom *= currentCSSZoom;
      }
    }
    const style = getComputedStyle(currentElement);
    if (style.zoom && style.zoom !== "normal") {
      return zoom *= parseFloat(style.zoom);
    }
    if (style.zoom && style.zoom !== "normal" || "currentCSSZoom" in currentElement) {
      return zoom;
    }
    currentElement = currentElement?.offsetParent ?? currentElement?.parentElement;
  }
  return zoom;
};
const getPxValue = (element, name) => {
  return getPropertyValue?.(element, name);
};
const getPadding = (src, axis) => {
  if (axis == "inline") {
    return getPropertyValue(src, "padding-inline-start") + getPropertyValue(src, "padding-inline-end");
  }
  ;
  return getPropertyValue(src, "padding-block-start") + getPropertyValue(src, "padding-block-end");
};

const boundBehaviors = /* @__PURE__ */ new WeakMap();
const bindBehavior = (element, behSet, behavior) => {
  const weak = new WeakRef(element);
  if (!behSet.has(behavior)) {
    behSet.add(behavior);
  }
  return element;
};
const reflectBehaviors = (element, behaviors) => {
  if (!element) return;
  if (behaviors) {
    const behSet = boundBehaviors.getOrInsert(element, /* @__PURE__ */ new Set());
    [...behaviors?.values?.() || []].map((e) => bindBehavior(element, behSet, e));
  }
  return element;
};

const namedStoreMaps = /* @__PURE__ */ new Map();
const getStoresOfElement = (map, element) => {
  const E = [...map.entries() || []];
  return new Map(E?.map?.(([n, m]) => [n, m?.get?.(element)])?.filter?.(([n, e]) => !!e) || []);
  ;
};
const bindStore = (element, name, obj) => {
  let weakMap = namedStoreMaps.get(name);
  if (!weakMap) {
    weakMap = /* @__PURE__ */ new WeakMap();
    namedStoreMaps.set(name, weakMap);
  }
  if (!weakMap.has(element)) {
    weakMap.set(element, obj);
  }
  return element;
};
const reflectStores = (element, stores) => {
  if (!element || !stores) return;
  for (const [name, obj] of stores.entries()) {
    bindStore(element, name, obj);
  }
  return element;
};

const reflectMixins = (element, mixins) => {
  if (!element) return;
  if (mixins) {
    const mixinSet = boundMixinSet?.get?.(element) ?? /* @__PURE__ */ new WeakSet();
    if (!boundMixinSet?.has?.(element)) {
      boundMixinSet?.set?.(element, mixinSet);
    }
    [...mixins?.values?.() || []].map((e) => bindMixins(element, e, mixinSet));
  }
  return element;
};
const getElementRelated = (element) => {
  return {
    storeSet: getStoresOfElement(namedStoreMaps, element),
    mixinSet: boundMixinSet?.get?.(element),
    behaviorSet: boundBehaviors?.get?.(element)
  };
};
const bindMixins = (element, mixin, mixSet) => {
  const wel = new WeakRef(element);
  mixSet ||= boundMixinSet?.get?.(element);
  if (!mixSet?.has?.(mixin)) {
    mixSet?.add?.(mixin);
    mixinElements?.get?.(mixin)?.add?.(element);
    if (mixin.name) {
      element?.setAttribute?.("data-mixin", [...element?.getAttribute?.("data-mixin")?.split?.(" ") || [], mixin.name].filter((n) => !!n).join(" "));
    }
    mixin?.connect?.(wel, mixin, getElementRelated(element));
  }
  return element;
};
const boundMixinSet = /* @__PURE__ */ new WeakMap();
const mixinElements = /* @__PURE__ */ new WeakMap();
const mixinRegistry = /* @__PURE__ */ new Map();
const mixinNamespace = /* @__PURE__ */ new WeakMap();
const updateMixinAttributes = (element, mixin) => {
  if (typeof mixin == "string") {
    mixin = mixinRegistry?.get?.(mixin);
  }
  const names = /* @__PURE__ */ new Set([...element?.getAttribute?.("data-mixin")?.split?.(" ") || []]);
  const mixins = new Set([...names].map((n) => mixinRegistry?.get?.(n)).filter((m) => !!m));
  const mixinSet = boundMixinSet?.get?.(element) ?? /* @__PURE__ */ new WeakSet();
  if (!mixinElements?.has?.(mixin)) {
    mixinElements?.set?.(mixin, /* @__PURE__ */ new WeakSet());
  }
  if (!boundMixinSet?.has?.(element)) {
    boundMixinSet?.set?.(element, mixinSet);
  }
  const wel = new WeakRef(element);
  if (!mixinSet?.has?.(mixin)) {
    if (!mixins.has(mixin)) {
      mixin?.disconnect?.(wel, mixin, getElementRelated(element));
    }
    if (mixins.has(mixin) || !mixinElements?.get?.(mixin)?.has?.(element)) {
      mixin?.connect?.(wel, mixin, getElementRelated(element));
      names.add(mixinNamespace?.get?.(mixin));
      mixinSet?.add?.(mixin);
      element?.setAttribute?.("data-mixin", [...names].filter((n) => !!n).join(" "));
    }
    mixinElements?.get?.(mixin)?.add?.(element);
  }
  if (mixinSet?.has?.(mixin)) {
    if (!mixins.has(mixin)) {
      mixinSet?.delete?.(mixin);
      mixin?.disconnect?.(wel, mixin, getElementRelated(element));
    }
  }
};
const roots = /* @__PURE__ */ new Set();
const addRoot = (root = typeof document != "undefined" ? document : null) => {
  if (!root) return;
  if (!roots?.has?.(root)) {
    roots?.add?.(root);
    observeAttributeBySelector(root, "*", "data-mixin", (mutation) => updateAllMixins(mutation.target));
    observeBySelector(root, "[data-mixin]", (mutation) => {
      for (const element of mutation.addedNodes) {
        if (element instanceof HTMLElement) {
          updateAllMixins(element);
        }
      }
    });
  }
  return root;
};
const updateAllMixins = (element) => {
  const names = /* @__PURE__ */ new Set([...element?.getAttribute?.("data-mixin")?.split?.(" ") || []]);
  const mixins = new Set([...names].map((n) => mixinRegistry?.get?.(n)).filter((m) => !!m));
  [...mixins]?.map?.((m) => updateMixinAttributes(element, m));
};
const updateMixinAttributesAll = (elements, mixin) => {
  elements.forEach((e) => mixin ? updateMixinAttributes(e, mixin) : updateAllMixins(e));
};
const updateMixinAttributesAllInRoots = (mixin) => {
  for (const root of roots) {
    updateMixinAttributesAll(root?.querySelectorAll?.("[data-mixin]"), mixin);
  }
};
const nameRegistryF = new FinalizationRegistry((key) => {
  mixinRegistry?.delete?.(key);
});
const registerMixin = (name, mixin) => {
  if (!mixinNamespace?.has?.(mixin)) {
    const key = name?.trim?.();
    if (key) {
      mixinNamespace?.set?.(mixin, key);
      mixinRegistry?.set?.(key, mixin);
      nameRegistryF?.register?.(mixin, key);
      updateMixinAttributesAllInRoots(mixin);
    }
  }
};
addRoot(typeof document != "undefined" ? document : null);
class DOMMixin {
  constructor(name = null) {
    if (name) {
      registerMixin(name, this);
    }
  }
  //
  connect(wElement, wSelf, related) {
    return this;
  }
  disconnect(wElement, wSelf, related) {
    return this;
  }
  //
  storeForElement(element) {
    return namedStoreMaps.get(this.name || "")?.get?.(element);
  }
  relatedForElement(element) {
    return getElementRelated(element);
  }
  //
  get elements() {
    return mixinElements?.get?.(this);
  }
  get storage() {
    return namedStoreMaps?.get?.(this.name || "");
  }
  get name() {
    return mixinNamespace?.get?.(this);
  }
}

const handleHidden = (element, _, visible) => {
  const $ref = visible;
  if (hasValue(visible)) {
    visible = visible.value;
  }
  ;
  const isVisible = (visible = normalizePrimitive(visible)) != null && visible !== false;
  $avoidTrigger($ref, () => {
    if (element instanceof HTMLInputElement) {
      element.hidden = !isVisible;
    } else {
      if (isVisible) {
        element?.removeAttribute?.("data-hidden");
      } else {
        element?.setAttribute?.("data-hidden", "");
      }
    }
  });
  return element;
};
const handleProperty = (el, prop, val) => {
  if (!(prop = typeof prop == "string" ? kebabToCamel$1(prop) : prop) || !el || ["style", "dataset", "attributeStyleMap", "styleMap", "computedStyleMap"].indexOf(prop || "") != -1) return el;
  const $ref = val;
  if (hasValue(val)) {
    val = val.value;
  }
  ;
  if (el?.[prop] === val) {
    return el;
  }
  ;
  if (el?.[prop] !== val) {
    $avoidTrigger($ref, () => {
      if (val != null) {
        el[prop] = val;
      } else {
        delete el[prop];
      }
      ;
    });
  }
  return el;
};
const handleDataset = (el, prop, val) => {
  const datasetRef = el?.dataset;
  if (!prop || !el || !datasetRef) return el;
  const $ref = val;
  if (hasValue(val)) val = val?.value;
  prop = kebabToCamel$1(prop);
  if (datasetRef?.[prop] === (val = normalizePrimitive(val))) return el;
  if (val == null || val === false) {
    delete datasetRef[prop];
  } else {
    $avoidTrigger($ref, () => {
      if (typeof val != "object" && typeof val != "function") {
        datasetRef[prop] = String(val);
      } else {
        delete datasetRef[prop];
      }
    });
  }
  return el;
};
const deleteStyleProperty = (el, name) => el.style.removeProperty(camelToKebab$1(name));
const handleStyleChange = (el, prop, val) => {
  const styleRef = el?.style;
  if (!prop || typeof prop != "string" || !el || !styleRef) return el;
  const $ref = val;
  $avoidTrigger($ref, () => {
    if (isVal(val) || hasValue(val) || isValueUnit(val)) {
      setStyleProperty(el, prop, val);
    } else if (val == null) {
      deleteStyleProperty(el, prop);
    }
  });
  return el;
};
const handleAttribute = (el, prop, val) => {
  if (!prop || !el) return el;
  const $ref = val;
  if (hasValue(val)) val = val.value;
  prop = camelToKebab$1(prop);
  if (el?.getAttribute?.(prop) === (val = normalizePrimitive(val))) {
    return el;
  }
  $avoidTrigger($ref, () => {
    if (typeof val != "object" && typeof val != "function" && val != null && (typeof val == "boolean" ? val == true : true)) {
      el?.setAttribute?.(prop, String(val));
    } else {
      el?.removeAttribute?.(prop);
    }
  });
  return el;
};

Symbol.observable ||= Symbol.for("observable");
Symbol.subscribe ||= Symbol.for("subscribe");
Symbol.unsubscribe ||= Symbol.for("unsubscribe");
const $fxy = Symbol.for("@fix");
const $value = Symbol.for("@value");
const $extractKey$ = Symbol.for("@extract");
const $originalKey$ = Symbol.for("@origin");
const $registryKey$ = Symbol.for("@registry");
const $target = Symbol.for("@target");
const $rootKey$ = Symbol.for("@root");
const $nodeKey$ = Symbol.for("@node");
const $behavior$1 = Symbol.for("@behavior");
const $promise = Symbol.for("@promise");
const $triggerLess = Symbol.for("@trigger-less");
const $triggerLock = Symbol.for("@trigger-lock");
const $trigger = Symbol.for("@trigger");
const $affected = Symbol.for("@subscribe");
const $isNotEqual = Symbol.for("@isNotEqual");

const $originalObjects$ = /* @__PURE__ */ new WeakMap();
const safe = (target) => {
  const unwrap2 = typeof target == "object" || typeof target == "function" ? target?.[$extractKey$] ?? target : target, mapped = (e) => safe(e);
  if (Array.isArray(unwrap2)) {
    return unwrap2?.map?.(mapped) || Array.from(unwrap2 || [])?.map?.(mapped) || [];
  } else if (unwrap2 instanceof Map || unwrap2 instanceof WeakMap) {
    return new Map(Array.from(unwrap2?.entries?.() || [])?.map?.(([K, V]) => [K, safe(V)]));
  } else if (unwrap2 instanceof Set || unwrap2 instanceof WeakSet) {
    return new Set(Array.from(unwrap2?.values?.() || [])?.map?.(mapped));
  } else if (unwrap2 != null && typeof unwrap2 == "function" || typeof unwrap2 == "object") {
    return Object.fromEntries(Array.from(Object.entries(unwrap2 || {}) || [])?.filter?.(([K]) => K != $extractKey$ && K != $originalKey$ && K != $registryKey$)?.map?.(([K, V]) => [K, safe(V)]));
  }
  return unwrap2;
};
const unwrap = (arr) => {
  return arr?.[$extractKey$] ?? arr?.["@target"] ?? arr;
};
const deref = (target, discountValue = false) => {
  const original = target;
  if (isPrimitive(target) || typeof target == "symbol") return target;
  if (target != null && (target instanceof WeakRef || "deref" in target && typeof target?.deref == "function")) {
    target = target?.deref?.();
  }
  ;
  if (target != null && (typeof target == "object" || typeof target == "function")) {
    target = unwrap(target);
    const $val = discountValue && hasValue(target) && target?.value;
    if ($val != null && (typeof $val == "object" || typeof $val == "function")) {
      target = $val;
    }
    if (original != target) {
      return deref(target, discountValue);
    }
  }
  return target;
};
const isThenable = (val) => val != null && typeof val.then === "function";
const withPromise = (target, cb) => {
  if (isPrimitive(target) || typeof target == "function") {
    return cb?.(target);
  }
  ;
  if (isThenable(target)) return target.then(cb);
  if (target?.promise && isThenable(target.promise)) return target.promise.then(cb);
  return cb?.(target);
};
const disposeMap = /* @__PURE__ */ new WeakMap();
const disposeRegistry = new FinalizationRegistry((callstack) => {
  callstack?.forEach?.((cb) => cb?.());
});
function addToCallChain(obj, methodKey, callback) {
  if (!callback || typeof callback != "function" || typeof obj != "object" && typeof obj != "function") return;
  if (methodKey == Symbol.dispose) {
    disposeMap?.getOrInsertComputed?.(obj, () => {
      const CallChain = /* @__PURE__ */ new Set();
      if (typeof obj == "object" || typeof obj == "function") {
        disposeRegistry.register(obj, CallChain);
        disposeMap.set(obj, CallChain);
        obj[Symbol.dispose] ??= () => CallChain.forEach((cb) => {
          cb?.();
        });
      }
      return CallChain;
    })?.add?.(callback);
  } else {
    obj[methodKey] = function(...args) {
      const original = obj?.[methodKey];
      if (typeof original == "function") {
        original.apply(this, args);
      }
      ;
      callback.apply(this, args);
    };
  }
}
const isArrayIndex = (prop) => {
  if (typeof prop !== "string") return false;
  if (prop === "") return false;
  const num = Number(prop);
  return Number.isInteger(num) && num >= 0 && String(num) === prop;
};
function wrapSetAsArray(source = [], options = {}) {
  let backingSet = /* @__PURE__ */ new Set();
  const notifyDuplicate = (value, via, index) => {
    options.onDuplicate?.({ value, via, index });
  };
  if (source instanceof Set) {
    backingSet = source;
  } else {
    for (const item of source) {
      if (backingSet.has(item)) {
        notifyDuplicate(item, "push");
        continue;
      }
      backingSet.add(item);
    }
  }
  const snapshot = () => Array.from(backingSet);
  const rebuildFrom = (arr) => {
    backingSet.clear();
    for (const item of arr) {
      backingSet.add(item);
    }
  };
  const methods = {
    push: (...items) => {
      let size = backingSet.size;
      for (const item of items) {
        if (backingSet.has(item)) {
          notifyDuplicate(item, "push");
          continue;
        }
        backingSet.add(item);
        size++;
      }
      return size;
    },
    pop: () => {
      const arr = snapshot();
      if (!arr.length) return void 0;
      const value = arr[arr.length - 1];
      backingSet.delete(value);
      return value;
    },
    shift: () => {
      const iterator = backingSet.values().next();
      if (iterator.done) return void 0;
      const value = iterator.value;
      backingSet.delete(value);
      return value;
    },
    unshift: (...items) => {
      if (!items.length) return backingSet.size;
      const current = snapshot();
      const toPrepend = [];
      for (const item of items) {
        if (current.includes(item) || toPrepend.includes(item)) {
          notifyDuplicate(item, "unshift", 0);
          continue;
        }
        toPrepend.push(item);
      }
      if (!toPrepend.length) return current.length;
      const next = [...toPrepend, ...current];
      rebuildFrom(next);
      return next.length;
    },
    splice: (start, deleteCount, ...items) => {
      const arr = snapshot();
      const normalizedStart = Math.min(Math.max(start, 0), arr.length);
      const actualDeleteCount = deleteCount === void 0 ? arr.length - normalizedStart : Math.max(0, Math.min(deleteCount, arr.length - normalizedStart));
      const removed = arr.splice(normalizedStart, actualDeleteCount);
      let insertPosition = normalizedStart;
      for (const item of items) {
        if (arr.includes(item)) {
          notifyDuplicate(item, "splice", insertPosition);
          continue;
        }
        arr.splice(insertPosition++, 0, item);
      }
      rebuildFrom(arr);
      return removed;
    },
    includes: (value) => backingSet.has(value),
    indexOf: (value) => snapshot().indexOf(value),
    clear: () => {
      backingSet.clear();
    },
    delete: (value) => backingSet.delete(value),
    toArray: () => snapshot(),
    toSet: () => new Set(backingSet),
    [Symbol.iterator]: () => backingSet[Symbol.iterator]()
  };
  const handler = {
    get: (_, prop) => {
      if (prop === "length") {
        return backingSet.size;
      }
      if (isArrayIndex(prop)) {
        const arr = snapshot();
        return arr[Number(prop)];
      }
      const value = methods[prop];
      if (typeof value === "function") {
        return value;
      }
      return value;
    },
    set: (_, prop, value) => {
      if (prop === "length") {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          throw new RangeError("length must be a finite non-negative number");
        }
        const nextLength = Math.floor(value);
        if (nextLength >= backingSet.size) {
          return true;
        }
        const arr = snapshot().slice(0, nextLength);
        rebuildFrom(arr);
        return true;
      }
      if (isArrayIndex(prop)) {
        const arr = snapshot();
        const index = Number(prop);
        if (index > arr.length) {
          return true;
        }
        const nextValue = value;
        if (index < arr.length) {
          const currentValue = arr[index];
          if (Object.is(currentValue, nextValue)) {
            return true;
          }
          const duplicateElsewhere = arr.some(
            (item, idx) => idx !== index && Object.is(item, nextValue)
          );
          if (duplicateElsewhere) {
            notifyDuplicate(nextValue, "set", index);
            return true;
          }
          arr[index] = nextValue;
        } else {
          if (arr.includes(nextValue)) {
            notifyDuplicate(nextValue, "set", index);
            return true;
          }
          arr.push(nextValue);
        }
        rebuildFrom(arr);
        return true;
      }
      return Reflect.set(methods, prop, value);
    },
    deleteProperty: (_, prop) => {
      if (prop === "length") {
        return false;
      }
      if (isArrayIndex(prop)) {
        const arr = snapshot();
        const index = Number(prop);
        if (index >= arr.length) {
          return true;
        }
        arr.splice(index, 1);
        rebuildFrom(arr);
        return true;
      }
      return Reflect.deleteProperty(methods, prop);
    },
    ownKeys: () => {
      const keys = [];
      let i = 0;
      for (const _ of backingSet) {
        keys.push(String(i++));
      }
      keys.push("length");
      return keys;
    },
    getOwnPropertyDescriptor: (_, prop) => {
      if (prop === "length") {
        return {
          configurable: false,
          enumerable: false,
          writable: true,
          value: backingSet.size
        };
      }
      if (isArrayIndex(prop)) {
        const arr = snapshot();
        const index = Number(prop);
        if (index >= arr.length) return void 0;
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: arr[index]
        };
      }
      return Reflect.getOwnPropertyDescriptor(methods, prop);
    },
    has: (_, prop) => {
      if (prop === "length") return true;
      if (isArrayIndex(prop)) {
        const index = Number(prop);
        return index >= 0 && index < backingSet.size;
      }
      return prop in methods;
    }
  };
  return new Proxy(methods, handler);
}

class AssignObjectHandler {
  constructor() {
  }
  deleteProperty(target, name) {
    const result = Reflect.deleteProperty(target, name);
    return result;
  }
  construct(target, args, newT) {
    return Reflect.construct(target, args, newT);
  }
  apply(target, ctx, args) {
    return Reflect.apply(target, ctx, args);
  }
  has(target, prop) {
    return Reflect.has(target, prop);
  }
  set(target, name, value) {
    objectAssign(target, value, name);
    return true;
  }
  get(target, name, ctx) {
    if (typeof name == "symbol") {
      return target?.[name] ?? target;
    }
    return Reflect.get(target, name, ctx);
  }
}
const makeObjectAssignable = (obj) => {
  if (obj?.[$originalKey$] || $originalObjects$.has(obj)) {
    return obj;
  }
  const px = new Proxy(obj, new AssignObjectHandler());
  $originalObjects$.set(px, obj);
  return px;
};

const withUnsub = /* @__PURE__ */ new WeakMap();
const completeWithUnsub = (subscriber, weak, handler) => {
  return withUnsub.getOrInsert(subscriber, () => {
    const registry = weak?.deref?.();
    registry?.affected?.(handler);
    const savComplete = subscriber?.complete?.bind?.(subscriber);
    const unaffected = () => {
      const r = savComplete?.();
      registry?.unaffected?.(handler);
      return r;
    };
    subscriber.complete = unaffected;
    return {
      unaffected,
      [Symbol.dispose]: unaffected,
      [Symbol.asyncDispose]: unaffected
    };
  });
};
const subscriptRegistry = /* @__PURE__ */ new WeakMap();
const wrapped = /* @__PURE__ */ new WeakMap();
const register = (what, handle) => {
  const unwrap = what?.[$extractKey$] ?? what;
  subscriptRegistry.getOrInsert(unwrap, new Subscript());
  return handle;
};
const wrapWith = (what, handle) => {
  what = deref(what?.[$extractKey$] ?? what);
  if (typeof what == "symbol" || !(typeof what == "object" || typeof what == "function") || what == null) return what;
  return wrapped.getOrInsertComputed(what, () => new Proxy(what, register(what, handle)));
};
const forAll = Symbol.for("@allProps");
class Subscript {
  compatible;
  #listeners;
  #flags = /* @__PURE__ */ new WeakSet();
  #native;
  #iterator;
  #inDispatch = /* @__PURE__ */ new Set();
  // было: #triggerLock = new Set<keyType>();
  #pending = /* @__PURE__ */ new Map();
  #pendingByProp = /* @__PURE__ */ new Map();
  #flushScheduled = false;
  // last run timestamp per callback
  #lastPerfNow = /* @__PURE__ */ new WeakMap();
  // получаем "now" максимально дёшево/безопасно
  #now() {
    return globalThis.performance?.now?.() ?? Date.now();
  }
  constructor() {
    this.#listeners = /* @__PURE__ */ new Map();
    this.#flags = /* @__PURE__ */ new WeakSet();
    this.#iterator = {
      next: (args) => {
        if (args) {
          Array.isArray(args) ? this.#dispatch(...args) : this.#dispatch(args);
        }
      }
    };
    const weak = new WeakRef(this);
    const controller = function(subscriber) {
      const handler = subscriber?.next?.bind?.(subscriber);
      return completeWithUnsub(subscriber, weak, handler);
    };
    this.#native = typeof Observable != "undefined" ? new Observable(controller) : null;
    this.compatible = () => this.#native;
  }
  $safeExec(cb, ...args) {
    if (!cb || this.#flags.has(cb)) return;
    this.#flags.add(cb);
    if (this.#lastPerfNow.get(cb) === this.#now()) return;
    this.#lastPerfNow.set(cb, this.#now());
    try {
      const res = cb(...args);
      if (res && typeof res.then === "function") return res.catch(console.warn);
      return res;
    } catch (e) {
      console.warn(e);
    } finally {
      this.#flags.delete(cb);
    }
  }
  #dispatch(name, value = null, oldValue, ...etc) {
    const listeners = this.#listeners;
    if (!listeners?.size) return;
    const promises = Array.from(listeners.entries()).map(([cb, prop]) => {
      if (prop === name || prop === forAll || prop === null) {
        return this.$safeExec(cb, value, name, oldValue, ...etc);
      }
      return void 0;
    }).filter((res) => res && typeof res.then === "function");
    return promises.length ? Promise.allSettled(promises) : void 0;
  }
  wrap(nw) {
    if (Array.isArray(nw)) return wrapWith(nw, this);
    return nw;
  }
  affected(cb, prop) {
    if (cb == null || typeof cb != "function") return;
    this.#listeners.set(cb, prop || forAll);
    return () => this.unaffected(cb, prop || forAll);
  }
  unaffected(cb, prop) {
    if (cb != null && typeof cb == "function") {
      const listeners = this.#listeners;
      if (listeners?.has(cb) && (listeners.get(cb) == prop || prop == null || prop == forAll)) {
        listeners.delete(cb);
        return () => this.affected(cb, prop || forAll);
      }
    }
    return this.#listeners.clear();
  }
  /**
   * Коалесит триггеры:
   * - один dispatch на name за микро-тик
   * - повторные trigger(name) до flush не вызывают повторно dispatch, а лишь обновляют аргументы
   * - другие name не блокируются
   */
  trigger(name, value, oldValue, operation = null, ...etc) {
    if (typeof name === "symbol") return;
    if (operation === void 0) operation = null;
    const opKey = operation ?? "__";
    let byOp = this.#pendingByProp.get(name);
    if (!byOp) {
      byOp = /* @__PURE__ */ new Map();
      this.#pendingByProp.set(name, byOp);
    }
    byOp.set(opKey, [name, value, oldValue, operation, etc]);
    if (this.#flushScheduled) return;
    this.#flushScheduled = true;
    queueMicrotask(() => {
      this.#flushScheduled = false;
      const batch = this.#pendingByProp;
      this.#pendingByProp = /* @__PURE__ */ new Map();
      for (const [prop, opMap] of batch) {
        if (prop != null && this.#inDispatch.has(prop)) continue;
        if (prop != null) this.#inDispatch.add(prop);
        try {
          for (const [, args] of opMap) {
            const [nm, v, ov, op, rest] = args;
            try {
              this.#dispatch(nm, v, ov, op, ...rest ?? []);
            } catch (e) {
              console.warn(e);
            }
          }
        } finally {
          if (prop != null) this.#inDispatch.delete(prop);
        }
      }
    });
  }
  get iterator() {
    return this.#iterator;
  }
}

const __systemSkip = /* @__PURE__ */ new Set([
  Symbol.toStringTag,
  Symbol.iterator,
  Symbol.asyncIterator,
  Symbol.toPrimitive,
  "toString",
  "valueOf",
  "inspect",
  // node
  "constructor",
  "__proto__",
  "prototype",
  "then",
  "catch",
  "finally",
  "next"
]);
const systemSkipGet = (target, name) => {
  if (!__systemSkip.has(name)) return null;
  const got = safeGet(target, name);
  return typeof got === "function" ? bindCtx(target, got) : got;
};
const __safeGetGuard = /* @__PURE__ */ new WeakMap();
function isGetter(obj, propName) {
  let got = true;
  try {
    __safeGetGuard?.getOrInsert?.(obj, /* @__PURE__ */ new Set())?.add?.(propName);
    if (__safeGetGuard?.get?.(obj)?.has?.(propName)) {
      got = true;
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(obj, propName);
    got = typeof descriptor?.get == "function";
  } catch (e) {
    got = true;
  } finally {
    __safeGetGuard?.get?.(obj)?.delete?.(propName);
  }
  return got;
}
const fallThrough = (obj, key) => {
  if (isPrimitive(obj)) return obj;
  const value = safeGet(obj, key);
  if (value == null && key != "value") {
    const tmp = safeGet(obj, "value");
    if (tmp != null && !isPrimitive(tmp)) {
      return fallThrough(tmp, key);
    } else {
      return value;
    }
    ;
  } else if (key == "value" && value != null && !isPrimitive(value) && typeof value != "function") {
    return fallThrough(value, key) ?? value ?? obj;
  }
  return value ?? obj;
};
const safeGet = (obj, key, rec) => {
  let result = void 0;
  if (obj == null) {
    return obj;
  }
  let active = __safeGetGuard.getOrInsert(obj, /* @__PURE__ */ new Set());
  if (active?.has?.(key)) {
    return null;
  }
  if (!isGetter(obj, key)) {
    result ??= Reflect.get(obj, key, rec != null ? rec : obj);
  } else {
    active?.add?.(key);
    try {
      result = Reflect.get(obj, key, rec != null ? rec : obj);
    } catch (_e) {
      result = void 0;
    } finally {
      active.delete(key);
      if (active?.size === 0) {
        __safeGetGuard?.delete?.(obj);
      }
    }
  }
  return typeof result == "function" ? bindCtx(obj, result) : result;
};
const systemGet = (target, name, registry) => {
  if (target == null || isPrimitive(target)) {
    return target;
  }
  const exists = ["deref", "bind", "@target", $originalKey$, $extractKey$, $registryKey$]?.indexOf(name) < 0 ? safeGet(target, name)?.bind?.(target) : null;
  if (exists != null) return null;
  const $extK = [$extractKey$, $originalKey$];
  if ($extK.indexOf(name) >= 0) {
    return safeGet(target, name) ?? target;
  }
  if (name == $value) {
    return safeGet(target, name) ?? safeGet(target, "value");
  }
  if (name == $registryKey$) {
    return registry;
  }
  if (name == Symbol.observable) {
    return registry?.compatible;
  }
  if (name == Symbol.subscribe) {
    return (cb, prop) => affected(prop != null ? [target, prop] : target, cb);
  }
  if (name == Symbol.iterator) {
    return safeGet(target, name);
  }
  if (name == Symbol.asyncIterator) {
    return safeGet(target, name);
  }
  if (name == Symbol.dispose) {
    return (prop) => {
      safeGet(target, Symbol.dispose)?.(prop);
      unaffected(prop != null ? [target, prop] : target);
    };
  }
  if (name == Symbol.asyncDispose) {
    return (prop) => {
      safeGet(target, Symbol.asyncDispose)?.(prop);
      unaffected(prop != null ? [target, prop] : target);
    };
  }
  if (name == Symbol.unsubscribe) {
    return (prop) => unaffected(prop != null ? [target, prop] : target);
  }
  if (typeof name == "symbol" && (name in target || safeGet(target, name) != null)) {
    return safeGet(target, name);
  }
};
const observableAPIMethods = (target, name, registry) => {
  if (name == "subscribe") {
    return registry?.compatible?.[name] ?? ((handler) => {
      if (typeof handler == "function") {
        return affected(target, handler);
      } else if ("next" in handler && handler?.next != null) {
        const usub = affected(target, handler?.next), comp = handler?.["complete"];
        handler["complete"] = (...args) => {
          usub?.();
          return comp?.(...args);
        };
        return handler["complete"];
      }
    });
  }
};
class ObserveArrayMethod {
  #name;
  #self;
  #handle;
  constructor(name, self, handle) {
    this.#name = name;
    this.#self = self;
    this.#handle = handle;
  }
  //
  get(target, name, rec) {
    const skip = systemSkipGet(target, name);
    if (skip !== null) {
      return skip;
    }
    return Reflect.get(target, name, rec);
  }
  //
  apply(target, ctx, args) {
    let added = [], removed = [];
    let setPairs = [];
    let oldState = [...this.#self];
    let idx = -1;
    const result = Reflect.apply(target, ctx || this.#self, args);
    if (this.#handle?.[$triggerLock]) {
      if (Array.isArray(result)) {
        return observeArray(result);
      }
      return result;
    }
    switch (this.#name) {
      case "push":
        idx = oldState?.length;
        added = args;
        break;
      case "unshift":
        idx = 0;
        added = args;
        break;
      case "pop":
        idx = oldState?.length - 1;
        if (oldState.length > 0) {
          removed = [[idx - 1, oldState[idx - 1], null]];
        }
        break;
      case "shift":
        idx = 0;
        if (oldState.length > 0) removed = [[idx, oldState[idx], null]];
        break;
      case "splice":
        const [start, deleteCount, ...items] = args;
        idx = start;
        added = deleteCount > 0 ? items.slice(deleteCount) : [];
        removed = deleteCount > 0 ? oldState?.slice?.(items?.length + start, start + (deleteCount - (items?.length || 0))) : [];
        idx += (deleteCount || 0) - (items?.length || 1);
        if (deleteCount > 0 && items?.length > 0) {
          for (let i = 0; i < Math.min(deleteCount, items?.length ?? 0); i++) {
            setPairs.push([start + i, items[i], oldState?.[start + i] ?? null]);
          }
        }
        break;
      case "sort":
      case "fill":
      case "reverse":
      case "copyWithin":
        idx = 0;
        for (let i = 0; i < oldState.length; i++) {
          if (isNotEqual(oldState[i], this.#self[i])) {
            setPairs.push([idx + i, this.#self[i], oldState[i]]);
          }
        }
        break;
      // index assignment, args: [value, index]
      case "set":
        idx = args[1];
        setPairs.push([idx, args[0], oldState?.[idx] ?? null]);
        break;
    }
    const reg = subscriptRegistry.get(this.#self);
    if (added?.length == 1) {
      reg?.trigger?.(idx, added[0], null, added[0] == null ? "@add" : "@set");
    } else if (added?.length > 1) {
      reg?.trigger?.(idx, added, null, "@addAll");
      added.forEach((item, I) => reg?.trigger?.(idx + I, item, null, item == null ? "@add" : "@set"));
    }
    if (setPairs?.length == 1) {
      reg?.trigger?.(setPairs[0]?.[0] ?? idx, setPairs[0]?.[1], setPairs[0]?.[2], setPairs[0]?.[2] == null ? "@add" : "@set");
    } else if (setPairs?.length > 1) {
      reg?.trigger?.(idx, setPairs, oldState, "@setAll");
      setPairs.forEach((pair, I) => reg?.trigger?.(pair?.[0] ?? idx + I, pair?.[1], pair?.[2], pair?.[2] == null ? "@add" : "@set"));
    }
    if (removed?.length == 1) {
      reg?.trigger?.(idx, null, removed[0], removed[0] == null ? "@add" : "@delete");
    } else if (removed?.length > 1) {
      reg?.trigger?.(idx, null, removed, "@clear");
      removed.forEach((item, I) => reg?.trigger?.(idx + I, null, item, item == null ? "@add" : "@delete"));
    }
    if (result == target) {
      return new Proxy(result, this.#handle);
    }
    ;
    if (Array.isArray(result)) {
      return observeArray(result);
    }
    return result;
  }
}
const triggerWhenLengthChange = (self, target, oldLen, newLen) => {
  const removedItems = Number.isInteger(oldLen) && Number.isInteger(newLen) && newLen < oldLen ? target.slice(newLen, oldLen) : [];
  if (!self[$triggerLock] && oldLen !== newLen) {
    const registry = subscriptRegistry.get(target);
    if (removedItems.length === 1) {
      registry?.trigger?.(newLen, null, removedItems[0], "@delete");
    } else if (removedItems.length > 1) {
      registry?.trigger?.(newLen, null, removedItems, "@clear");
      removedItems.forEach((item, I) => registry?.trigger?.(newLen + I, null, item, "@delete"));
    }
    const addedCount = Number.isInteger(oldLen) && Number.isInteger(newLen) && newLen > oldLen ? newLen - oldLen : 0;
    if (addedCount === 1) {
      registry?.trigger?.(oldLen, void 0, null, "@add");
    } else if (addedCount > 1) {
      const added = Array(addedCount).fill(void 0);
      registry?.trigger?.(oldLen, added, null, "@addAll");
      added.forEach((_, I) => registry?.trigger?.(oldLen + I, void 0, null, "@add"));
    }
  }
};
class ObserveArrayHandler {
  [$triggerLock];
  constructor() {
  }
  //
  has(target, name) {
    return Reflect.has(target, name);
  }
  // TODO: some target with target[n] may has also reactive target[n]?.value, which (sometimes) needs to observe too...
  // TODO: also, subscribe can't be too simply used more than once...
  get(target, name, rec) {
    const skip = systemSkipGet(target, name);
    if (skip !== null) {
      return skip;
    }
    if ([$extractKey$, $originalKey$, "@target", "deref"].indexOf(name) >= 0 && safeGet(target, name) != null && safeGet(target, name) != target) {
      return typeof safeGet(target, name) == "function" ? safeGet(target, name)?.bind?.(target) : safeGet(target, name);
    }
    ;
    const registry = subscriptRegistry?.get?.(target);
    const sys = systemGet(target, name, registry);
    if (sys != null) return sys;
    const obs = observableAPIMethods(target, name, registry);
    if (obs != null) return obs;
    if (name == $triggerLess) {
      return makeTriggerLess.call(this, this);
    }
    if (name == $trigger) {
      return (key = 0) => {
        const v = safeGet(target, key);
        return subscriptRegistry.get(target)?.trigger?.(key, v, void 0, "@invalidate");
      };
    }
    if (name == "@target" || name == $extractKey$) return target;
    if (name == "x") {
      return () => {
        return target?.x ?? target?.[0];
      };
    }
    ;
    if (name == "y") {
      return () => {
        return target?.y ?? target?.[1];
      };
    }
    ;
    if (name == "z") {
      return () => {
        return target?.z ?? target?.[2];
      };
    }
    ;
    if (name == "w") {
      return () => {
        return target?.w ?? target?.[3];
      };
    }
    ;
    if (name == "r") {
      return () => {
        return target?.r ?? target?.[0];
      };
    }
    ;
    if (name == "g") {
      return () => {
        return target?.g ?? target?.[1];
      };
    }
    ;
    if (name == "b") {
      return () => {
        return target?.b ?? target?.[2];
      };
    }
    ;
    if (name == "a") {
      return () => {
        return target?.a ?? target?.[3];
      };
    }
    ;
    const got = safeGet(target, name) ?? (name == "value" ? safeGet(target, $value) : null);
    if (typeof got == "function") {
      return new Proxy(typeof got == "function" ? got?.bind?.(target) : got, new ObserveArrayMethod(name, target, this));
    }
    ;
    return got;
  }
  //
  set(target, name, value) {
    if (typeof name != "symbol") {
      if (Number.isInteger(parseInt(name))) {
        name = parseInt(name) ?? name;
      }
      ;
    }
    if (name == $triggerLock && value) {
      this[$triggerLock] = !!value;
      return true;
    }
    if (name == $triggerLock && !value) {
      delete this[$triggerLock];
      return true;
    }
    const old = safeGet(target, name);
    const xyzw = ["x", "y", "z", "w"];
    const rgba = ["r", "g", "b", "a"];
    const xyzw_idx = xyzw.indexOf(name);
    const rgba_idx = rgba.indexOf(name);
    let got = false;
    if (xyzw_idx >= 0) {
      got = Reflect.set(target, xyzw_idx, value);
    } else if (rgba_idx >= 0) {
      got = Reflect.set(target, rgba_idx, value);
    } else {
      got = Reflect.set(target, name, value);
    }
    if (name == "length") {
      if (isNotEqual(old, value)) {
        triggerWhenLengthChange(this, target, old, value);
      }
    }
    if (!this[$triggerLock] && typeof name != "symbol" && isNotEqual(old, value)) {
      subscriptRegistry?.get?.(target)?.trigger?.(name, value, old, typeof name == "number" ? "@set" : null);
    }
    return got;
  }
  //
  deleteProperty(target, name) {
    if (typeof name != "symbol") {
      if (Number.isInteger(parseInt(name))) {
        name = parseInt(name) ?? name;
      }
      ;
    }
    if (name == $triggerLock) {
      delete this[$triggerLock];
      return true;
    }
    const old = safeGet(target, name);
    const got = Reflect.deleteProperty(target, name);
    if (!this[$triggerLock] && (name != "length" && name != $triggerLock && typeof name != "symbol")) {
      if (old != null) {
        subscriptRegistry.get(target)?.trigger?.(name, name, old, typeof name == "number" ? "@delete" : null);
      }
    }
    return got;
  }
}
class ObserveObjectHandler {
  [$triggerLock];
  constructor() {
  }
  // supports nested "value" objects and values
  get(target, name, ctx) {
    if ([$extractKey$, $originalKey$, "@target", "deref", "then", "catch", "finally"].indexOf(name) >= 0 && safeGet(target, name) != null && safeGet(target, name) != target) {
      return typeof safeGet(target, name) == "function" ? bindCtx(target, safeGet(target, name)) : safeGet(target, name);
    }
    ;
    const registry = subscriptRegistry.get(target) ?? subscriptRegistry.get(safeGet(target, "value") ?? target);
    const sys = systemGet(target, name, registry);
    if (sys != null) return sys;
    if (safeGet(target, name) == null && name != "value" && hasValue(target) && safeGet(target, "value") != null && (typeof safeGet(target, "value") == "object" || typeof safeGet(target, "value") == "function") && safeGet(safeGet(target, "value"), name) != null) {
      target = safeGet(target, "value") ?? target;
    }
    const obs = observableAPIMethods(target, name, registry);
    if (obs != null) return obs;
    if (name == $triggerLess) {
      return makeTriggerLess.call(this, this);
    }
    if (name == $trigger) {
      return (key = "value") => {
        const v = safeGet(target, key);
        const old = key == "value" ? safeGet(target, $value) : void 0;
        return subscriptRegistry.get(target)?.trigger?.(key, v, old, "@invalidate");
      };
    }
    if (name == Symbol.toPrimitive) {
      return (hint) => {
        const ft = fallThrough(target, name);
        if (safeGet(ft, name)) return safeGet(ft, name)?.(hint);
        if (isPrimitive(ft)) return tryParseByHint(ft, hint);
        if (isPrimitive(safeGet(ft, "value"))) return tryParseByHint(safeGet(ft, "value"), hint);
        return tryParseByHint(safeGet(ft, "value") ?? ft, hint);
      };
    }
    if (name == Symbol.toStringTag) {
      return () => {
        const ft = fallThrough(target, name);
        if (safeGet(ft, name)) return safeGet(ft, name)?.();
        if (isPrimitive(ft)) return String(ft ?? "") || "";
        if (isPrimitive(safeGet(ft, "value"))) return String(safeGet(ft, "value") ?? "") || "";
        return String(safeGet(ft, "value") ?? ft ?? "") || "";
      };
    }
    if (name == "toString") {
      return () => {
        const ft = fallThrough(target, name);
        if (safeGet(ft, name)) return safeGet(ft, name)?.();
        if (safeGet(ft, Symbol.toStringTag)) return safeGet(ft, Symbol.toStringTag)?.();
        if (isPrimitive(ft)) return String(ft ?? "") || "";
        if (isPrimitive(safeGet(ft, "value"))) return String(safeGet(ft, "value") ?? "") || "";
        return String(safeGet(ft, "value") ?? ft ?? "") || "";
      };
    }
    if (name == "valueOf") {
      return () => {
        const ft = fallThrough(target, name);
        if (safeGet(ft, name)) return safeGet(ft, name)?.();
        if (safeGet(ft, Symbol.toPrimitive)) return safeGet(ft, Symbol.toPrimitive)?.();
        if (isPrimitive(ft)) return ft;
        if (isPrimitive(safeGet(ft, "value"))) return safeGet(ft, "value");
        return safeGet(ft, "value") ?? ft;
      };
    }
    if (typeof name == "symbol" && (name in target || safeGet(target, name) != null)) {
      return safeGet(target, name);
    }
    return fallThrough(target, name);
  }
  //
  apply(target, ctx, args) {
    return Reflect.apply(target, ctx, args);
  }
  ownKeys(target) {
    return Reflect.ownKeys(target);
  }
  construct(target, args, newT) {
    return Reflect.construct(target, args, newT);
  }
  isExtensible(target) {
    return Reflect.isExtensible(target);
  }
  //
  getOwnPropertyDescriptor(target, key) {
    let got = void 0;
    try {
      __safeGetGuard?.getOrInsert?.(target, /* @__PURE__ */ new Set())?.add?.(key);
      if (__safeGetGuard?.get?.(target)?.has?.(key)) {
        got = void 0;
      }
      got = Reflect.getOwnPropertyDescriptor(target, key);
    } catch (e) {
      got = void 0;
    } finally {
      __safeGetGuard?.get?.(target)?.delete?.(key);
    }
    return got;
  }
  // supports nested "value" objects
  has(target, prop) {
    return prop in target;
  }
  set(target, name, value) {
    const skip = systemSkipGet(target, name);
    if (skip !== null) return skip;
    return potentiallyAsync(value, (v) => {
      const skip2 = systemSkipGet(v, name);
      if (skip2 !== null) return skip2;
      if (name == $triggerLock && value) {
        this[$triggerLock] = !!value;
        return true;
      }
      if (name == $triggerLock && !value) {
        delete this[$triggerLock];
        return true;
      }
      const $original = target;
      if (safeGet(target, name) == null && name != "value" && hasValue(target) && safeGet(target, "value") != null && (typeof safeGet(target, "value") == "object" || typeof safeGet(target, "value") == "function") && safeGet(safeGet(target, "value"), name) != null) {
        target = safeGet(target, "value") ?? target;
      }
      if (typeof name == "symbol" && !(safeGet(target, name) != null && name in target)) return;
      const oldValue = name == "value" ? safeGet(target, $value) ?? safeGet(target, name) : safeGet(target, name);
      target[name] = v;
      const newValue = safeGet(target, name) ?? v;
      if (!this[$triggerLock] && typeof name != "symbol" && (safeGet(target, $isNotEqual) ?? isNotEqual)?.(oldValue, newValue)) {
        const subscript = subscriptRegistry.get(target) ?? subscriptRegistry.get($original);
        subscript?.trigger?.(name, v, oldValue);
      }
      ;
      return true;
    });
  }
  //
  deleteProperty(target, name) {
    if (name == $triggerLock) {
      delete this[$triggerLock];
      return true;
    }
    if (safeGet(target, name) == null && name != "value" && hasValue(target) && safeGet(target, "value") != null && (typeof safeGet(target, "value") == "object" || typeof safeGet(target, "value") == "function") && safeGet(safeGet(target, "value"), name) != null) {
      target = safeGet(target, "value") ?? target;
    }
    const oldValue = safeGet(target, name);
    const result = Reflect.deleteProperty(target, name);
    if (!this[$triggerLock] && (name != $triggerLock && typeof name != "symbol")) {
      subscriptRegistry.get(target)?.trigger?.(name, null, oldValue);
    }
    return result;
  }
}
class ObserveMapHandler {
  [$triggerLock];
  constructor() {
  }
  //
  get(target, name, ctx) {
    if ([$extractKey$, $originalKey$, "@target", "deref"].indexOf(name) >= 0 && safeGet(target, name) != null && safeGet(target, name) != target) {
      return typeof safeGet(target, name) == "function" ? bindCtx(target, safeGet(target, name)) : safeGet(target, name);
    }
    ;
    const registry = subscriptRegistry.get(target);
    const sys = systemGet(target, name, registry);
    if (sys != null) return sys;
    const obs = observableAPIMethods(target, name, registry);
    if (obs != null) return obs;
    target = safeGet(target, $extractKey$) ?? safeGet(target, $originalKey$) ?? target;
    const valueOrFx = bindCtx(
      target,
      /*Reflect.get(, name, ctx)*/
      safeGet(target, name)
    );
    if (typeof name == "symbol" && (name in target || safeGet(target, name) != null)) {
      return valueOrFx;
    }
    if (name == $triggerLess) {
      return makeTriggerLess.call(this, this);
    }
    if (name == $trigger) {
      return (key) => {
        if (key == null) {
          return;
        }
        const v = target.get(key);
        if (v == null) {
          return;
        }
        return subscriptRegistry.get(target)?.trigger?.(key, v, void 0, "@set");
      };
    }
    if (name == "clear") {
      return () => {
        const oldValues = Array.from(target?.entries?.() || []), result = valueOrFx();
        oldValues.forEach(([prop, oldValue]) => {
          if (!this[$triggerLock] && oldValue) {
            subscriptRegistry.get(target)?.trigger?.(prop, null, oldValue, "@delete");
          }
        });
        return result;
      };
    }
    if (name == "delete") {
      return (prop, _ = null) => {
        const oldValue = target.get(prop), result = valueOrFx(prop);
        if (!this[$triggerLock] && oldValue) {
          subscriptRegistry.get(target)?.trigger?.(prop, null, oldValue, "@delete");
        }
        return result;
      };
    }
    if (name == "set") {
      return (prop, value) => potentiallyAsyncMap(value, (v) => {
        const oldValue = target.get(prop), result = valueOrFx(prop, value);
        if (isNotEqual(oldValue, result)) {
          if (!this[$triggerLock]) {
            subscriptRegistry.get(target)?.trigger?.(prop, result, oldValue, oldValue == null ? "@add" : "@set");
          }
        }
        ;
        return result;
      });
    }
    return valueOrFx;
  }
  //
  set(target, name, value) {
    if (name == $triggerLock) {
      this[$triggerLock] = !!value;
      return true;
    }
    if (name == $triggerLock && !value) {
      delete this[$triggerLock];
      return true;
    }
    ;
    return Reflect.set(target, name, value);
  }
  // redirect to value key
  has(target, prop) {
    return Reflect.has(target, prop);
  }
  apply(target, ctx, args) {
    return Reflect.apply(target, ctx, args);
  }
  construct(target, args, newT) {
    return Reflect.construct(target, args, newT);
  }
  ownKeys(target) {
    return Reflect.ownKeys(target);
  }
  isExtensible(target) {
    return Reflect.isExtensible(target);
  }
  //
  getOwnPropertyDescriptor(target, key) {
    let got = void 0;
    try {
      __safeGetGuard?.getOrInsert?.(target, /* @__PURE__ */ new Set())?.add?.(key);
      if (__safeGetGuard?.get?.(target)?.has?.(key)) {
        got = void 0;
      }
      got = Reflect.getOwnPropertyDescriptor(target, key);
    } catch (e) {
      got = void 0;
    } finally {
      __safeGetGuard?.get?.(target)?.delete?.(key);
    }
    return got;
  }
  //
  deleteProperty(target, name) {
    if (name == $triggerLock) {
      delete this[$triggerLock];
      return true;
    }
    const result = Reflect.deleteProperty(target, name);
    return result;
  }
}
class ObserveSetHandler {
  [$triggerLock] = false;
  constructor() {
  }
  //
  get(target, name, ctx) {
    if ([$extractKey$, $originalKey$, "@target", "deref"].indexOf(name) >= 0 && safeGet(target, name) != null && safeGet(target, name) != target) {
      return typeof safeGet(target, name) == "function" ? bindCtx(target, safeGet(target, name)) : safeGet(target, name);
    }
    ;
    const registry = subscriptRegistry.get(target);
    const sys = systemGet(target, name, registry);
    if (sys != null) return sys;
    const obs = observableAPIMethods(target, name, registry);
    if (obs != null) return obs;
    target = safeGet(target, $extractKey$) ?? safeGet(target, $originalKey$) ?? target;
    const valueOrFx = bindCtx(target, safeGet(target, name));
    if (typeof name == "symbol" && (name in target || safeGet(target, name) != null)) {
      return valueOrFx;
    }
    if (name == $triggerLess) {
      return makeTriggerLess.call(this, this);
    }
    if (name == $trigger) {
      return (key) => {
        if (key == null) return;
        const v = target.has(key);
        return subscriptRegistry.get(target)?.trigger?.(key, v, void 0, "@invalidate");
      };
    }
    if (name == "clear") {
      return () => {
        const oldValues = Array.from(target?.values?.() || []), result = valueOrFx();
        oldValues.forEach((oldValue) => {
          if (!this[$triggerLock] && oldValue) {
            subscriptRegistry.get(target)?.trigger?.(null, null, oldValue, "@delete");
          }
        });
        return result;
      };
    }
    if (name == "delete") {
      return (value) => {
        const oldValue = target.has(value) ? value : null, result = valueOrFx(value);
        if (!this[$triggerLock] && oldValue) {
          subscriptRegistry.get(target)?.trigger?.(value, null, oldValue, "@delete");
        }
        return result;
      };
    }
    if (name == "add") {
      return (value) => {
        const oldValue = target.has(value) ? value : null, result = valueOrFx(value);
        if (isNotEqual(oldValue, value)) {
          if (!this[$triggerLock] && !oldValue) {
            subscriptRegistry.get(target)?.trigger?.(value, value, oldValue, "@add");
          }
        }
        ;
        return result;
      };
    }
    return valueOrFx;
  }
  //
  set(target, name, value) {
    if (name == $triggerLock && value) {
      this[$triggerLock] = !!value;
      return true;
    }
    if (name == $triggerLock && !value) {
      delete this[$triggerLock];
      return true;
    }
    return Reflect.set(target, name, value);
  }
  // redirect to value key i
  has(target, prop) {
    return Reflect.has(target, prop);
  }
  apply(target, ctx, args) {
    return Reflect.apply(target, ctx, args);
  }
  construct(target, args, newT) {
    return Reflect.construct(target, args, newT);
  }
  ownKeys(target) {
    return Reflect.ownKeys(target);
  }
  isExtensible(target) {
    return Reflect.isExtensible(target);
  }
  //
  getOwnPropertyDescriptor(target, key) {
    let got = void 0;
    try {
      __safeGetGuard?.getOrInsert?.(target, /* @__PURE__ */ new Set())?.add?.(key);
      if (__safeGetGuard?.get?.(target)?.has?.(key)) {
        got = void 0;
      }
      got = Reflect.getOwnPropertyDescriptor(target, key);
    } catch (e) {
      got = void 0;
    } finally {
      __safeGetGuard?.get?.(target)?.delete?.(key);
    }
    return got;
  }
  //
  deleteProperty(target, name) {
    if (name == $triggerLock) {
      delete this[$triggerLock];
      return true;
    }
    const result = Reflect.deleteProperty(target, name);
    return result;
  }
}
const $isObservable = (target) => {
  return !!((typeof target == "object" || typeof target == "function") && target != null && (target?.[$extractKey$] || target?.[$affected]));
};
const observeArray = (arr) => {
  return $isObservable(arr) ? arr : wrapWith(arr, new ObserveArrayHandler());
};
const observeObject = (obj) => {
  return $isObservable(obj) ? obj : wrapWith(obj, new ObserveObjectHandler());
};
const observeMap = (map) => {
  return $isObservable(map) ? map : wrapWith(map, new ObserveMapHandler());
};
const observeSet = (set) => {
  return $isObservable(set) ? set : wrapWith(set, new ObserveSetHandler());
};

const numberRef = (initial, behavior) => {
  const isPromise = initial instanceof Promise || typeof initial?.then == "function";
  const obj = {
    [$promise]: isPromise ? initial : null,
    [$value]: isPromise ? 0 : Number(deref(initial) || 0) || 0,
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(this?.[$value] ?? "") || "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint((typeof this?.[$value] != "object" ? this?.[$value] : this?.[$value]?.value || 0) ?? 0, hint);
    },
    set value(v) {
      this[$value] = (v != null && !Number.isNaN(v) ? Number(v) : this[$value]) || 0;
    },
    get value() {
      return Number(this[$value] || 0) || 0;
    }
  };
  const $r = observe(obj);
  initial?.then?.((v) => $r.value = v);
  return $r;
};
const stringRef = (initial, behavior) => {
  const isPromise = initial instanceof Promise || typeof initial?.then == "function";
  const obj = {
    [$promise]: isPromise ? initial : null,
    [$value]: (isPromise ? "" : String(deref(typeof initial == "number" ? String(initial) : initial || ""))) ?? "",
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(this?.[$value] ?? "") ?? "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint(this?.[$value] ?? "", hint);
    },
    set value(v) {
      this[$value] = String(typeof v == "number" ? String(v) : v || "") ?? "";
    },
    get value() {
      return String(this[$value] ?? "") ?? "";
    }
  };
  const $r = observe(obj);
  initial?.then?.((v) => $r.value = v);
  return $r;
};
const booleanRef = (initial, behavior) => {
  const isPromise = initial instanceof Promise || typeof initial?.then == "function";
  const obj = {
    [$promise]: isPromise ? initial : null,
    [$value]: (isPromise ? false : (deref(initial) != null ? typeof deref(initial) == "string" ? true : !!deref(initial) : false) || false) || false,
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(this?.[$value] ?? "") || "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint(!!this?.[$value] || false, hint);
    },
    set value(v) {
      this[$value] = (v != null ? typeof v == "string" ? true : !!v : this[$value]) || false;
    },
    get value() {
      return this[$value] || false;
    }
  };
  const $r = observe(obj);
  initial?.then?.((v) => $r.value = v);
  return $r;
};
const wrapRef = (initial, behavior) => {
  const isPromise = initial instanceof Promise || typeof initial?.then == "function";
  const obj = {
    [$promise]: isPromise ? initial : null,
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(this.value ?? "") || "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint(this.value, hint);
    },
    value: isPromise ? null : deref(initial)
  };
  const $r = observe(obj);
  initial?.then?.((v) => $r.value = v);
  affected(initial, (v) => {
    $r?.[$trigger]?.();
  });
  return $r;
};
const propRef = (src, srcProp = "value", initial, behavior) => {
  if (isPrimitive(src) || !src) return src;
  if (Array.isArray(src) && !isArrayInvalidKey(src?.[1], src) && (Array.isArray(src?.[0]) || typeof src?.[0] == "object" || typeof src?.[0] == "function")) {
    src = src?.[0];
  }
  ;
  if ((srcProp ??= Array.isArray(src) ? null : "value") == null || isArrayInvalidKey(srcProp, src)) {
    return;
  }
  if (srcProp && hasValue(src?.[srcProp]) && isObservable(src?.[srcProp])) {
    return recoverReactive(src?.[srcProp]);
  }
  if (srcProp && typeof src?.getProperty == "function" && isObservable(src?.getProperty?.(srcProp))) {
    return src?.getProperty?.(srcProp);
  }
  const r = observe({
    [$value]: src[srcProp] ??= initial ?? src[srcProp],
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(src?.[srcProp] ?? this[$value] ?? "") || "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint(src?.[srcProp], hint);
    },
    set value(v) {
      r[$triggerLock$1] = true;
      src[srcProp] = this[$value] = v ?? defaultByType(src[srcProp]);
      r[$triggerLock$1] = false;
    },
    get value() {
      return this[$value] = src?.[srcProp] ?? this[$value];
    }
  });
  const usb = affected(src, (v) => {
    r?.[$trigger]?.();
  });
  addToCallChain(r, Symbol.dispose, usb);
  return r;
};
const $ref = (typed, behavior) => {
  switch (typeof typed) {
    case "boolean":
      return booleanRef(typed, behavior);
    case "number":
      return numberRef(typed, behavior);
    case "string":
      return stringRef(typed, behavior);
    case "object":
      if (typed != null) {
        return wrapRef(observe(typed), behavior);
      }
    default:
      return wrapRef(typed, behavior);
  }
};
const ref = (typed, prop = "value", behavior) => {
  const $r = isObservable(typed) ? typed : $ref(typed, behavior);
  if (prop != null) {
    return propRef(
      $r,
      prop,
      behavior
    );
  } else {
    return $r;
  }
};
const promised = (promise, behavior) => {
  return ref(promise, behavior);
};
const triggerWithDelay = (ref2, cb, delay = 100) => {
  if (ref2?.value ?? ref2) {
    return setTimeout(() => {
      if (ref2.value) cb?.();
    }, delay);
  }
};
const delayedBehavior = (delay = 100) => {
  return (cb, [val], [sig]) => {
    let tm = triggerWithDelay(val, cb, delay);
    sig?.addEventListener?.("abort", () => {
      if (tm) clearTimeout(tm);
    }, { once: true });
  };
};
const delayedOrInstantBehavior = (delay = 100) => {
  return (cb, [val], [sig]) => {
    let tm = triggerWithDelay(val, cb, delay);
    sig?.addEventListener?.("abort", () => {
      if (tm) clearTimeout(tm);
    }, { once: true });
    if (!tm) {
      cb?.();
    }
    ;
  };
};
const observe = (target, stateName) => {
  if (target == null || typeof target == "symbol" || !(typeof target == "object" || typeof target == "function") || $isObservable(target)) {
    return target;
  }
  if ((target = deref?.(target)) == null || target instanceof Promise || target instanceof WeakRef || $isObservable(target)) {
    return target;
  }
  const unwrap = target;
  if (unwrap == null || typeof unwrap == "symbol" || !(typeof unwrap == "object" || typeof unwrap == "function") || unwrap instanceof Promise || unwrap instanceof WeakRef) {
    return unwrap;
  }
  ;
  let reactive = unwrap;
  if (Array.isArray(unwrap)) {
    reactive = observeArray(unwrap);
    return reactive;
  } else if (unwrap instanceof Map) {
    reactive = observeMap(unwrap);
    return reactive;
  } else if (unwrap instanceof Set) {
    reactive = observeSet(unwrap);
    return reactive;
  } else if (typeof unwrap == "function" || typeof unwrap == "object") {
    reactive = observeObject(unwrap);
    return reactive;
  }
  return reactive;
};
const isObservable = (target) => {
  if (typeof HTMLInputElement != "undefined" && target instanceof HTMLInputElement) {
    return true;
  }
  return !!((typeof target == "object" || typeof target == "function") && target != null && (target?.[$extractKey$] || target?.[$affected] || subscriptRegistry?.has?.(target)));
};
const recoverReactive = (target) => {
  return isObservable(target) ? observe(target) : null;
};

const useObservable = (unwrap) => {
  if (unwrap == null || typeof unwrap != "object" && typeof unwrap != "function" || unwrap?.[Symbol.observable] != null) {
    return unwrap;
  }
  try {
    unwrap[Symbol.observable] = self?.compatible;
  } catch (e) {
    console.warn("Unable to assign <[Symbol.observable]>, object will not observable by other frameworks");
  }
  ;
  unwrap[$affected] = (cb) => {
    const observable = unwrap?.[Symbol?.observable];
    observable?.()?.affected?.(cb);
    return () => observable?.()?.unaffected?.(cb);
  };
  return unwrap;
};
const specializedSubscribe = /* @__PURE__ */ new WeakMap();
const checkValidObj = (obj) => {
  if (typeof obj == "symbol" || obj == null || !(typeof obj == "object" || typeof obj == "function")) return;
  return obj;
};
const subscribeDirectly = (target, prop, cb, ctx = null) => {
  if (!target) return;
  if (!checkValidObj(target)) return;
  const tProp = prop != Symbol.iterator ? prop : null;
  let registry = target?.[$registryKey$] ?? subscriptRegistry.get(target);
  target = target?.[$extractKey$] ?? target;
  queueMicrotask(() => {
    if (tProp != null && tProp != Symbol.iterator) {
      callByProp(target, tProp, cb, ctx);
    } else {
      callByAllProp(target, cb, ctx);
    }
  });
  let unSub = registry?.affected?.(cb, tProp);
  if (target?.[Symbol.dispose]) return unSub;
  addToCallChain(unSub, Symbol.dispose, unSub);
  addToCallChain(unSub, Symbol.asyncDispose, unSub);
  addToCallChain(target, Symbol.dispose, unSub);
  addToCallChain(target, Symbol.asyncDispose, unSub);
  return unSub;
};
const subscribeInput = (tg, _, cb, ctx = null) => {
  const $opt = {};
  let oldValue = tg?.value;
  const $cb = (ev) => {
    cb?.(ev?.target?.value, "value", oldValue);
    oldValue = ev?.target?.value;
  };
  tg?.addEventListener?.("change", $cb, $opt);
  return () => tg?.removeEventListener?.("change", $cb, $opt);
};
const checkIsPaired = (tg) => {
  return Array.isArray(tg) && tg?.length == 2 && checkValidObj(tg?.[0]) && (isKeyType(tg?.[1]) || tg?.[1] == Symbol.iterator);
};
const subscribePaired = (tg, _, cb, ctx = null) => {
  const prop = isKeyType(tg?.[1]) ? tg?.[1] : null;
  return affected(tg?.[0], prop, cb, ctx);
};
const subscribeThenable = (obj, prop, cb, ctx = null) => {
  return obj?.then?.((obj2) => affected?.(obj2, prop, cb, ctx))?.catch?.((e) => {
    console.warn(e);
    return null;
  });
};
const affected = (obj, prop, cb = () => {
}, ctx) => {
  if (typeof prop == "function") {
    cb = prop;
    prop = null;
  }
  if (isPrimitive(obj) || typeof obj == "symbol") {
    return queueMicrotask(() => {
      return cb?.(obj, null, null, null);
    });
  }
  if (typeof obj?.[$affected] == "function") {
    return obj?.[$affected]?.(cb, prop, ctx);
  } else if (checkValidObj(obj)) {
    const wrapped = obj;
    obj = obj?.[$extractKey$] ?? obj;
    if (specializedSubscribe?.has?.(obj)) {
      return specializedSubscribe?.get?.(obj)?.(wrapped, prop, cb, ctx);
    }
    if (isObservable(wrapped) || checkIsPaired(obj) && isObservable(obj?.[0])) {
      if (isThenable(obj)) {
        return specializedSubscribe?.getOrInsert?.(obj, subscribeThenable)?.(obj, prop, cb, ctx);
      } else if (checkIsPaired(obj)) {
        return specializedSubscribe?.getOrInsert?.(obj, subscribePaired)?.(obj, prop, cb, ctx);
      } else if (typeof HTMLInputElement != "undefined" && obj instanceof HTMLInputElement) {
        return specializedSubscribe?.getOrInsert?.(obj, subscribeInput)?.(obj, prop, cb, ctx);
      } else {
        return specializedSubscribe?.getOrInsert?.(obj, subscribeDirectly)?.(wrapped, prop, cb, ctx);
      }
    } else {
      return queueMicrotask(() => {
        if (checkIsPaired(obj)) {
          return callByProp?.(obj?.[0], obj?.[1], cb, ctx);
        }
        if (prop != null && prop != Symbol.iterator) {
          return callByProp?.(obj, prop, cb, ctx);
        }
        return callByAllProp?.(obj, cb, ctx);
      });
    }
  }
};
const makeArrayObservable = (tg) => {
  if (tg instanceof Set) return observableBySet(tg);
  if (tg instanceof Map) return observableByMap(tg);
  return tg;
};
class DoubleWeakMap {
  #top = /* @__PURE__ */ new WeakMap();
  // key1 -> WeakMap(key2 -> value)
  #ensureInner(key1) {
    let inner = this.#top.get(key1);
    if (!inner) {
      inner = /* @__PURE__ */ new WeakMap();
      this.#top.set(key1, inner);
    }
    return inner;
  }
  #splitPair(pair) {
    if (!Array.isArray(pair) || pair.length !== 2) {
      return [null, null];
    }
    return pair;
  }
  hasL1(key1) {
    return this.#top.has(key1);
  }
  set(pair, value) {
    const [key1, key2] = this.#splitPair(pair);
    this.#ensureInner(key1).set(key2, value);
    return this;
  }
  get(pair) {
    const [key1, key2] = this.#splitPair(pair);
    return this.#top.get(key1)?.get(key2);
  }
  has(pair) {
    const [key1, key2] = this.#splitPair(pair);
    return this.#top.get(key1)?.has(key2) ?? false;
  }
  delete(pair) {
    const [key1, key2] = this.#splitPair(pair);
    const inner = this.#top.get(key1);
    return inner ? inner.delete(key2) : false;
  }
  deleteTop(key1) {
    return this.#top.delete(key1);
  }
  // Уже было: универсальный get-or-create (синонимно логике "computed")
  getOrCreate(pair, factory) {
    const [key1, key2] = this.#splitPair(pair);
    const inner = this.#ensureInner(key1);
    if (inner.has(key2)) return inner.get(key2);
    const value = factory();
    inner.set(key2, value);
    return value;
  }
  // getOrInsert: если нет — вставить *переданное* значение (без вычисления)
  getOrInsert(pair, value) {
    const [key1, key2] = this.#splitPair(pair);
    const inner = this.#ensureInner(key1);
    if (inner.has(key2)) return inner.get(key2);
    inner.set(key2, value);
    return value;
  }
  // getOrInsertComputed: если нет — вычислить через fn(pair) и вставить
  // (удобно, когда надо использовать ключи в вычислении)
  getOrInsertComputed(pair, compute) {
    const [key1, key2] = this.#splitPair(pair);
    const inner = this.#ensureInner(key1);
    if (inner.has(key2)) return inner.get(key2);
    const value = compute([key1, key2]);
    inner.set(key2, value);
    return value;
  }
}
const registeredIterated = new DoubleWeakMap();
const iterated = (tg, cb, ctx = null) => {
  if (!tg) return;
  if (registeredIterated.has([tg, cb])) {
    return registeredIterated.get([tg, cb]);
  }
  const $sub = (value, name, old) => {
    if (name == "value") {
      const entries = (old?.value ?? old)?.entries?.();
      const basis = tg?.value ?? value?.value ?? value;
      if (entries) {
        for (const [idx, item] of entries) {
          const ofOld = item ?? ((old?.value ?? old)?.[idx] ?? null);
          const ofNew = basis?.[idx];
          if (ofOld == null && ofNew != null) {
            cb(ofNew, idx, null, "@add");
          } else if (ofOld != null && ofNew == null) {
            cb(null, idx, ofOld, "@delete");
          } else if (isNotEqual(ofOld, ofNew)) {
            cb(ofNew, idx, ofOld, "@set");
          }
        }
      }
      return iterated(value ?? tg?.value, (value2, prop, old2, operation) => {
        cb(value2, prop, old2, operation);
      });
    }
    return tg[name];
  };
  return registeredIterated.getOrInsertComputed([tg, cb], () => {
    if (tg instanceof Set) {
      return affected([observableBySet(tg), Symbol.iterator], cb, ctx);
    }
    if (tg instanceof Map) {
      return affected(tg, cb, ctx);
    }
    if (hasValue(tg)) {
      return affected(tg, $sub, ctx);
    }
    if (Array.isArray(tg) && !(tg?.length == 2 && isKeyType(tg?.[1]) && isObservable(tg?.[0]))) {
      return affected([tg, Symbol.iterator], cb, ctx);
    }
    return affected(tg, cb, ctx);
  });
};
const unaffected = (tg, cb, ctx = null) => {
  return withPromise(tg, (target) => {
    const isPair = Array.isArray(target) && target?.length == 2 && ["object", "function"].indexOf(typeof target?.[0]) >= 0 && isKeyType(target?.[1]);
    const prop = isPair ? target?.[1] : null;
    target = isPair && prop != null ? target?.[0] ?? target : target;
    const unwrap = typeof target == "object" || typeof target == "function" ? target?.[$extractKey$] ?? target : target;
    let self2 = target?.[$registryKey$] ?? subscriptRegistry.get(unwrap);
    self2?.unaffected?.(cb, prop);
  });
};
const bindBy = (target, reactive, watch) => {
  affected(reactive, null, (v, p) => {
    objectAssign(target, v, p, true);
  });
  watch?.(() => target, (N) => {
    for (const k in N) {
      objectAssign(reactive, N[k], k, true);
    }
  }, { deep: true });
  return target;
};
const derivate = (from, reactFn, watch) => bindBy(reactFn(safe(from)), from, watch);
const bindByKey = (target, reactive, key = () => "") => affected(reactive, null, (value, p) => {
  if (p == key()) {
    objectAssign(target, value, null, true);
  }
});

const conditionalIndex = (condList = []) => {
  return computed(condList, () => condList.findIndex((cb) => cb?.()), "value");
};
const conditionalRef = (cond, ifTrue, ifFalse, behavior) => {
  if (isPrimitive(cond)) return cond ? ifTrue : ifFalse;
  const getTrue = () => {
    return ifTrue;
  };
  const getFalse = () => {
    return ifFalse;
  };
  const valueOf = (n) => {
    if (n != null) {
      cond.value = hasValue(n) ? n?.value : n;
    }
    ;
    const cnd = hasValue(cond) ? cond?.value : cond;
    return cnd ? getTrue() : getFalse();
  };
  const r = observe({
    [$value]: valueOf(),
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(valueOf() ?? this[$value] ?? "") || "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint(valueOf() ?? this[$value], hint);
    },
    set value(v) {
      this[$value] = valueOf(v);
    },
    get value() {
      return this[$value] = valueOf() ?? this[$value];
    }
  });
  const usb = affected([cond, "value"], (val) => {
    r?.[$trigger]?.();
  });
  addToCallChain(r, Symbol.dispose, usb);
  return r;
};
const conditional = conditionalRef;
const remap = (sub, cb, dest) => {
  if (!dest) dest = observe({});
  const usb = affected(sub, (value, prop, old) => {
    const got = cb?.(value, prop, old);
    if (typeof got == "object") {
      objectAssignNotEqual(dest, got);
    } else if (isNotEqual(dest[prop], got)) dest[prop] = got;
  });
  if (dest) {
    addToCallChain(dest, Symbol.dispose, usb);
  }
  ;
  return dest;
};
const unified = (...subs) => {
  const dest = observe({});
  subs?.forEach?.((sub) => affected(sub, (value, prop, _) => {
    if (isNotEqual(dest[prop], value)) {
      dest[prop] = value;
    }
    ;
  }));
  return dest;
};
const observableBySet = (set) => {
  const obs = observe([]);
  obs.push(...Array.from(set?.values?.() || []));
  addToCallChain(obs, Symbol.dispose, affected(set, (value, _, old) => {
    if (isNotEqual(value, old)) {
      if (old == null && value != null) {
        obs.push(value);
      } else if (old != null && value == null) {
        const idx = obs.indexOf(old);
        if (idx >= 0) obs.splice(idx, 1);
      } else {
        const idx = obs.indexOf(old);
        if (idx >= 0 && isNotEqual(obs[idx], value)) obs[idx] = value;
      }
    }
  }));
  return obs;
};
const observableByMap = (map) => {
  const obs = observe([]);
  const initialEntries = Array.from(map.entries());
  obs.push(...initialEntries);
  addToCallChain(obs, Symbol.dispose, affected(map, (value, prop, old) => {
    if (isNotEqual(value, old) || old == null && value != null || old != null && value == null) {
      if (old != null && value == null) {
        let idx = obs.findIndex(([name, _]) => name == prop);
        if (idx < 0) idx = obs.findLastIndex(([_, val]) => old === val);
        if (idx >= 0) obs.splice(idx, 1);
      } else {
        let idx = obs.findIndex(([name, _]) => name == prop);
        if (idx >= 0 && idx < obs.length) {
          if (isNotEqual(obs[idx]?.[1], value)) {
            obs[idx] = [prop, value];
          }
        } else {
          obs.push([prop, value]);
        }
      }
    }
  }));
  return obs;
};
const assignMap = /* @__PURE__ */ new WeakMap();
const assign = (a, b, prop = "value") => {
  const isACompute = typeof a?.[1] == "function" && a?.length == 2, isBCompute = typeof b?.[1] == "function" && b?.length == 2, cmpBFnc = isBCompute ? b?.[1] : null;
  const isAProp = (isKeyType(a?.[1]) || a?.[1] == Symbol.iterator) && a?.length == 2;
  let a_prop = isAProp && !isACompute ? a?.[1] : Array.isArray(a) ? null : prop;
  if (!isAProp && !isACompute) {
    a = [a, a_prop];
  }
  ;
  if (isACompute) {
    a[1] = a_prop;
  }
  ;
  const isBProp = (isKeyType(b?.[1]) || b?.[1] == Symbol.iterator) && b?.length == 2;
  let b_prop = isBProp && !isBCompute ? b?.[1] : Array.isArray(b) ? null : prop;
  if (!isBProp && !isBCompute) {
    b = [b, b_prop];
  }
  ;
  if (isBCompute) {
    b[1] = b_prop;
  }
  ;
  if (a_prop == null || b_prop == null || isArrayInvalidKey(a_prop, a?.[0]) || isArrayInvalidKey(b_prop, b?.[0])) {
    return;
  }
  ;
  if (!((typeof b?.[0] == "object" || typeof b?.[0] == "function") && b?.[0] != null) && !Array.isArray(a[0])) {
    $avoidTrigger(b, () => {
      a[0][a_prop] = b?.[0];
    });
    return () => {
    };
  }
  ;
  const compute = (v, p) => {
    const a_tmp2 = aRef?.deref?.();
    const b_tmp2 = bRef?.deref?.();
    if (assignMap?.get?.(a_tmp2)?.get?.(a_prop)?.bound == b_tmp2) {
      let val = null;
      const cmpfx = assignMap?.get?.(a_tmp2)?.get?.(a_prop)?.cmpfx;
      $avoidTrigger(b_tmp2, () => {
        if (typeof cmpfx == "function") {
          val = cmpfx?.($getValue(b_tmp2) ?? v, p, null);
        } else {
          val = b_tmp2?.[p] ?? v;
        }
        ;
      });
      const nv = $getValue(val);
      if (isNotEqual(a_tmp2[a_prop], nv)) {
        $avoidTrigger(b_tmp2, () => {
          a_tmp2[a_prop] = nv;
        });
      }
      ;
    } else {
      const map = assignMap?.get?.(a_tmp2);
      const store2 = map?.get?.(a_prop);
      store2?.dispose?.();
    }
  };
  const dispose = () => {
    const a_tmp2 = aRef?.deref?.();
    const map = assignMap?.get?.(a_tmp2);
    const store2 = map?.get?.(a_prop);
    map?.delete?.(a_prop);
    store2?.unsub?.();
  };
  const bRef = b?.[0] != null && (typeof b?.[0] == "object" || typeof b?.[0] == "function") && !(b?.[0] instanceof WeakRef || typeof b?.[0]?.deref == "function") ? new WeakRef(b?.[0]) : b?.[0], aRef = a?.[0] != null && (typeof a?.[0] == "object" || typeof a?.[0] == "function") && !(a?.[0] instanceof WeakRef || typeof a?.[0]?.deref == "function") ? new WeakRef(a?.[0]) : a?.[0];
  let store = { compute, dispose, cmpfx: cmpBFnc };
  const a_tmp = aRef?.deref?.(), b_tmp = bRef?.deref?.();
  if (aRef instanceof WeakRef) {
    if (assignMap?.get?.(a_tmp)?.get?.(a_prop)?.bound != b_tmp) {
      assignMap?.get?.(a_tmp)?.delete?.(a_prop);
    }
    ;
    const map = assignMap?.getOrInsert?.(a_tmp, /* @__PURE__ */ new Map());
    store = map?.getOrInsertComputed?.(a_prop, () => ({
      bound: b_tmp,
      cmpfx: cmpBFnc,
      unsub: null,
      compute,
      dispose
    }));
    store.unsub = affected(b, compute);
    store.cmpfx = cmpBFnc;
    addToCallChain(a_tmp, Symbol.dispose, store?.dispose);
    addToCallChain(b_tmp, Symbol.dispose, store?.dispose);
  }
  if (b_tmp && !Array.isArray(b_tmp)) {
    $avoidTrigger(a_tmp, () => {
      b_tmp[b_prop] ??= a_tmp?.[a_prop] ?? b_tmp[b_prop];
    });
  }
  return store?.dispose;
};
const link = (a, b, prop = "value") => {
  const usub = [assign(a, b, prop), assign(b, a, prop)];
  return () => usub?.map?.((c) => c?.());
};
const computed = (src, cb, behavior, prop = "value") => {
  const isACompute = typeof src?.[1] == "function" && src?.length == 2;
  const isAProp = (isKeyType(src?.[1]) || src?.[1] == Symbol.iterator) && src?.length == 2;
  let a_prop = isAProp && !isACompute ? src?.[1] : Array.isArray(src) ? null : prop;
  if (!isAProp && !isACompute) {
    src = [isAProp ? src?.[0] : src, a_prop];
  }
  ;
  if (isACompute) {
    src[1] = a_prop;
  }
  ;
  if (a_prop == null || isArrayInvalidKey(a_prop, src?.[0])) {
    return void 0;
  }
  const cmp = (v) => {
    let oldValue = void 0;
    if (v != void 0) {
      oldValue = src[0][a_prop];
      src[0][a_prop] = v;
    }
    return cb?.(src?.[0]?.[a_prop], a_prop, oldValue);
  };
  const isPromise = false;
  const initial = cmp();
  const rf = observe({
    [$promise]: isPromise ? initial : void 0,
    [$value]: initial,
    [$behavior$1]: behavior,
    [Symbol?.toStringTag]() {
      return String(cmp() ?? this[$value] ?? "") || "";
    },
    [Symbol?.toPrimitive](hint) {
      return tryParseByHint(cmp() ?? this[$value], hint);
    },
    set value(v) {
      this[$value] = cmp(v);
    },
    get value() {
      return this[$value] = cmp() ?? this[$value];
    }
  });
  const usb = affected([src?.[0] ?? src, a_prop ?? "value"], () => (
    /*wr?.deref?.()*/
    rf?.[$trigger]?.()
  ));
  addToCallChain(rf, Symbol.dispose, usb);
  return rf;
};
const delayedSubscribe = (ref, cb, delay = 100) => {
  let tm;
  return affected([ref, "value"], (v) => {
    if (!v && tm) {
      clearTimeout(tm);
      tm = null;
    } else if (v && !tm) {
      tm = triggerWithDelay(ref, cb, delay) ?? tm;
    }
    ;
  });
};

const generateAnchorId = () => {
  const randLetters = Math.random().toString(36).substring(2, 15).replace(/[0-9]/g, "");
  return "--" + randLetters;
};
const getComputedZIndex = (element) => {
  if (element?.computedStyleMap) {
    return Number(element.computedStyleMap().get("z-index")?.toString() || 0) || 0;
  } else {
    return Number(getComputedStyle(element?.element ?? element).getPropertyValue("z-index") || 0) || 0;
  }
};
const getExistsZIndex = (element) => {
  if (!element) {
    return 0;
  }
  if (element?.attributeStyleMap && element.attributeStyleMap.get("z-index") != null) {
    return Number(element.attributeStyleMap.get("z-index")?.value ?? 0) || 0;
  }
  if (element?.style && "zIndex" in element.style && element.style.zIndex != null) {
    return Number(element.style.zIndex || 0) || 0;
  }
  return getComputedZIndex(element);
};
class ReactiveCSSValue {
  value;
  unit;
  constructor(initialValue, unit = "px") {
    const parsed = typeof initialValue === "string" ? CSSUnitConverter.parseValue(initialValue) : { value: initialValue, unit };
    this.value = numberRef(parsed.value);
    this.unit = parsed.unit;
  }
  // Get reactive CSS string
  get cssValue() {
    return CSSBinder.bindWithUnit({}, "", this.value, this.unit);
  }
  // Convert to different unit reactively
  toUnit(targetUnit) {
    return CSSCalc.multiply(this.value, numberRef(1));
  }
  // Bind to element property
  bindTo(element, property) {
    return CSSBinder.bindWithUnit(element, property, this.value, this.unit);
  }
}
class ReactiveTransform {
  transforms = [];
  translate(x, y) {
    const vector = typeof x === "number" && typeof y === "number" ? { x: numberRef(x), y: numberRef(y) } : {
      x: typeof x === "number" ? numberRef(x) : x,
      y: typeof y === "number" ? numberRef(y) : y
    };
    this.transforms.push(CSSTransform.translate2D(vector));
    return this;
  }
  scale(x, y) {
    const scaleX = typeof x === "number" ? numberRef(x) : x;
    const scaleY = y !== void 0 ? typeof y === "number" ? numberRef(y) : y : scaleX;
    this.transforms.push(CSSTransform.scale2D({ x: scaleX, y: scaleY }));
    return this;
  }
  rotate(angle) {
    const angleRef = typeof angle === "number" ? numberRef(angle) : angle;
    this.transforms.push(CSSTransform.rotate(angleRef));
    return this;
  }
  // Get combined transform string
  get value() {
    return CSSTransform.combine(this.transforms);
  }
  // Bind to element
  bindTo(element) {
    return CSSBinder.bindTransform(element, { x: numberRef(0), y: numberRef(0) });
  }
}
class ReactiveAnimation {
  element;
  properties;
  duration;
  easing;
  constructor(element, duration = 1e3, easing = "ease-out") {
    this.element = element;
    this.properties = /* @__PURE__ */ new Map();
    this.duration = duration;
    this.easing = easing;
  }
  // Animate CSS property
  animateProperty(property, from, to) {
    const value = numberRef(from);
    this.properties.set(property, value);
    CSSBinder.bindWithUnit(this.element, property, value);
    this.animateValue(value, from, to);
    return this;
  }
  animateValue(ref, from, to) {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      const easedProgress = this.applyEasing(progress);
      ref.value = from + (to - from) * easedProgress;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  applyEasing(t) {
    switch (this.easing) {
      case "ease-out":
        return 1 - Math.pow(1 - t, 3);
      case "ease-in":
        return t * t * t;
      case "ease-in-out":
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t;
    }
  }
}
class ReactiveMediaQuery {
  query;
  matches;
  constructor(query) {
    this.query = query;
    this.matches = numberRef(0);
    const mediaQuery = window?.matchMedia(query);
    this.matches.value = mediaQuery.matches ? 1 : 0;
    mediaQuery?.addEventListener("change", (e) => {
      this.matches.value = e.matches ? 1 : 0;
    });
  }
  get reactiveMatches() {
    return this.matches;
  }
  // Get reactive value based on media query
  valueIfMatches(ifTrue, ifFalse) {
    return this.matches.value ? ifTrue : ifFalse;
  }
}
class ReactiveViewport {
  static width = numberRef(typeof window != "undefined" ? window?.innerWidth : 0);
  static height = numberRef(typeof window != "undefined" ? window?.innerHeight : 0);
  static init() {
    const updateSize = () => {
      this.width.value = window?.innerWidth;
      this.height.value = window?.innerHeight;
    };
    if (typeof window != "undefined") {
      window?.addEventListener?.("resize", updateSize);
    }
  }
  // Get reactive viewport center
  static center() {
    return {
      x: CSSCalc.divide(this.width, numberRef(2)),
      y: CSSCalc.divide(this.height, numberRef(2))
    };
  }
}
ReactiveViewport.init();
class ReactiveElementSize {
  element;
  size;
  observer;
  constructor(element) {
    this.element = element;
    this.size = {
      width: numberRef(element.offsetWidth),
      height: numberRef(element.offsetHeight)
    };
    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) {
          this.size.width.value = entry.contentRect.width;
          this.size.height.value = entry.contentRect.height;
        }
      }
    });
    this.observer.observe(element);
  }
  get width() {
    return this.size.width;
  }
  get height() {
    return this.size.height;
  }
  // Get reactive center point
  center() {
    return {
      x: CSSCalc.divide(this.size.width, numberRef(2)),
      y: CSSCalc.divide(this.size.height, numberRef(2))
    };
  }
  destroy() {
    this.observer.disconnect();
  }
}
class ReactiveScroll {
  element;
  scrollLeft;
  scrollTop;
  constructor(element = document.documentElement) {
    this.element = element;
    this.scrollLeft = numberRef(element.scrollLeft);
    this.scrollTop = numberRef(element.scrollTop);
    element.addEventListener("scroll", () => {
      this.scrollLeft.value = element.scrollLeft;
      this.scrollTop.value = element.scrollTop;
    });
  }
  get left() {
    return this.scrollLeft;
  }
  get top() {
    return this.scrollTop;
  }
  // Get reactive scroll progress (0-1)
  progress(axis = "y") {
    const scrollSize = axis === "x" ? this.element.scrollWidth - this.element.clientWidth : this.element.scrollHeight - this.element.clientHeight;
    const scrollPos = axis === "x" ? this.scrollLeft : this.scrollTop;
    return CSSCalc.divide(scrollPos, numberRef(Math.max(scrollSize, 1)));
  }
}

const registeredAnchorIds = /* @__PURE__ */ new WeakMap();
const registeredAnchors = /* @__PURE__ */ new WeakMap();
class CSSAnchor {
  source;
  anchorId;
  //
  constructor(source) {
    this.source = source;
    registeredAnchors.set(source, this);
    this.anchorId = registeredAnchorIds.getOrInsert(source, generateAnchorId());
    this.source.style.setProperty("anchor-name", this.anchorId);
    this.source.style.setProperty("position-visibility", `always`);
  }
  //
  connectElement(connect, {
    placement = "fill",
    zIndexShift = 1,
    inset = 0,
    size = "100%",
    transformOrigin = "50% 50%"
  }) {
    if (placement == "fill") {
      connect.style.setProperty("inset-block-start", `anchor(start, ${inset}px)`);
      connect.style.setProperty("inset-inline-start", `anchor(start, ${inset}px)`);
      connect.style.setProperty("inset-block-end", `anchor(end, ${inset}px)`);
      connect.style.setProperty("inset-inline-end", `anchor(end, ${inset}px)`);
      connect.style.setProperty("inline-size", `anchor-size(inline, ${size})`);
      connect.style.setProperty("block-size", `anchor-size(block, ${size})`);
      connect.style.setProperty("transform-origin", transformOrigin);
    } else if (placement == "bottom") {
      connect.style.setProperty("inset-block-start", `anchor(end, ${inset}px)`);
      connect.style.setProperty("inset-inline-start", `anchor(start, ${inset}px)`);
      connect.style.setProperty("inline-size", `anchor-size(self-inline, ${size})`);
      connect.style.setProperty("transform-origin", transformOrigin);
    } else if (placement == "top") {
      connect.style.setProperty("inset-block-end", `anchor(start, ${inset}px)`);
      connect.style.setProperty("inset-inline-start", `anchor(start, ${inset}px)`);
      connect.style.setProperty("inline-size", `anchor-size(self-inline, ${size})`);
      connect.style.setProperty("transform-origin", transformOrigin);
    } else if (placement == "left") {
      connect.style.setProperty("inset-inline-start", `anchor(end, ${inset}px)`);
      connect.style.setProperty("inset-block-start", `anchor(start, ${inset}px)`);
      connect.style.setProperty("block-size", `anchor-size(self-block, ${size})`);
      connect.style.setProperty("transform-origin", transformOrigin);
    } else if (placement == "right") {
      connect.style.setProperty("inset-inline-end", `anchor(start, ${inset}px)`);
      connect.style.setProperty("inset-block-start", `anchor(start, ${inset}px)`);
      connect.style.setProperty("block-size", `anchor-size(self-block, ${size})`);
      connect.style.setProperty("transform-origin", transformOrigin);
    } else if (placement == "center") {
      connect.style.setProperty("inset-inline-start", `anchor(center, ${inset}px)`);
      connect.style.setProperty("inset-block-start", `anchor(center, ${inset}px)`);
      connect.style.setProperty("inline-size", `anchor-size(self-inline, ${size})`);
      connect.style.setProperty("block-size", `anchor-size(self-block, ${size})`);
      connect.style.setProperty("transform-origin", transformOrigin);
    }
    connect.style.setProperty("position-visibility", `always`);
    connect.style.setProperty("position-anchor", this.anchorId);
    connect.style.setProperty("position", `absolute`);
    connect.style.setProperty("position-area", `span-all`);
    connect.style.setProperty("z-index", String(getExistsZIndex(this.source ?? connect) + zIndexShift));
    return this;
  }
  // Enhanced anchor positioning with container query awareness
  connectWithContainerQuery(connect, {
    placement = "fill",
    containerQuery = "(min-width: 768px)",
    fallbackPlacement = "bottom",
    zIndexShift = 1,
    inset = 0,
    size = "100%"
  }) {
    const mediaQuery = globalThis.matchMedia ? globalThis.matchMedia(containerQuery) : null;
    const updatePosition = () => {
      const canUseAnchor = CSS.supports && CSS.supports("anchor-name", this.anchorId);
      const useModern = canUseAnchor && mediaQuery?.matches;
      if (useModern) {
        this.connectElement(connect, { placement, zIndexShift, inset, size });
      } else {
        connect.style.removeProperty("position-anchor");
        connect.style.removeProperty("anchor-name");
        connect.style.setProperty("position", "absolute");
        connect.style.setProperty("z-index", String(getExistsZIndex(this.source ?? connect) + zIndexShift));
        const sourceRect = this.source.getBoundingClientRect();
        if (fallbackPlacement === "bottom") {
          connect.style.setProperty("top", `${sourceRect.bottom + inset}px`);
          connect.style.setProperty("left", `${sourceRect.left + inset}px`);
          connect.style.setProperty("width", size);
        } else if (fallbackPlacement === "top") {
          connect.style.setProperty("bottom", `${globalThis.innerHeight - sourceRect.top + inset}px`);
          connect.style.setProperty("left", `${sourceRect.left + inset}px`);
          connect.style.setProperty("width", size);
        } else if (fallbackPlacement === "right") {
          connect.style.setProperty("top", `${sourceRect.top + inset}px`);
          connect.style.setProperty("left", `${sourceRect.right + inset}px`);
          connect.style.setProperty("height", size);
        } else if (fallbackPlacement === "left") {
          connect.style.setProperty("top", `${sourceRect.top + inset}px`);
          connect.style.setProperty("right", `${globalThis.innerWidth - sourceRect.left + inset}px`);
          connect.style.setProperty("height", size);
        }
      }
    };
    if (mediaQuery) {
      mediaQuery.addEventListener("change", updatePosition);
      updatePosition();
    }
    return () => mediaQuery?.removeEventListener("change", updatePosition);
  }
}
const makeAnchorElement = (anchorElement) => {
  return registeredAnchors.getOrInsert(anchorElement, new CSSAnchor(anchorElement));
};

const $extract = Symbol.for("__extract");
const $element = Symbol.for("__element");
const timelineHandler = {
  [Symbol.for("__extract")](target) {
    return target.source;
  },
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver ?? target);
    }
    if (prop == "value") {
      return (target?.currentTime ?? 0) / (target?.duration ?? 1);
    }
    if (prop == $affected && (target instanceof ScrollTimeline || target instanceof ViewTimeline)) {
      return (cb, prop2) => {
        const $cb = () => {
          queueMicrotask(() => cb((target?.currentTime ?? 0) / (target?.duration ?? 1), "value"));
        };
        if (target instanceof ScrollTimeline) {
          target?.source?.addEventListener?.("scroll", $cb);
          const $observer = new ResizeObserver((entries) => entries.forEach((entry) => $cb?.()));
          $observer.observe(target?.source, { box: "content-box" });
          target?.source?.addEventListener?.("scroll", $cb);
          return () => {
            $observer.disconnect();
            target?.source?.removeEventListener?.("scroll", $cb);
          };
        } else if (target instanceof ViewTimeline) {
          const $observer = new IntersectionObserver((entries) => entries.forEach((entry) => $cb?.()), target?.observerOptions ?? { root: target?.source?.offsetParent ?? document.documentElement, rootMargin: "0px", threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
          $observer.observe(target?.source);
          target?.source?.addEventListener?.("scroll", $cb);
          return () => {
            $observer.disconnect();
            target?.source?.removeEventListener?.("scroll", $cb);
          };
        }
      };
    }
    if (prop == $extract) {
      return target;
    }
    if (prop == $element || prop == "element") {
      return target.source?.element ?? target.source;
    }
    return Reflect.get(target.source, prop, receiver ?? target.source);
  },
  set(target, prop, value, receiver) {
    if (prop in target) {
      Reflect.set(target, prop, value, receiver ?? target);
    } else if (target.source) {
      Reflect.set(target.source, prop, value, receiver ?? target.source);
    }
    return true;
  },
  has(target, prop) {
    return Reflect.has(target, prop) || Reflect.has(target.source, prop);
  },
  deleteProperty(target, prop) {
    if (prop in target) {
      return Reflect.deleteProperty(target, prop);
    } else if (target.source) {
      return Reflect.deleteProperty(target.source, prop);
    }
    return true;
  },
  ownKeys(target) {
    return [...Reflect.ownKeys(target), ...Reflect.ownKeys(target.source)];
  },
  getOwnPropertyDescriptor(target, prop) {
    return { ...Reflect.getOwnPropertyDescriptor(target, prop), ...Reflect.getOwnPropertyDescriptor(target.source, prop) };
  },
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target);
  },
  setPrototypeOf(target, proto) {
    return Reflect.setPrototypeOf(target, proto);
  },
  isExtensible(target) {
    return Reflect.isExtensible(target);
  },
  preventExtensions(target) {
    return Reflect.preventExtensions(target);
  }
};
const $makeScrollTimeline = (source, axis) => {
  return new Proxy(new ScrollTimeline({ source: source?.element ?? source, axis }), timelineHandler);
};
const $makeViewTimeline = (source, axis) => {
  return new Proxy(new ViewTimeline({ source: source?.element ?? source, axis }), timelineHandler);
};
class EnhancedScrollTimeline {
  source;
  axis;
  timeline;
  anchor;
  //
  constructor(sourceOrOptions, $options) {
    let options = !(sourceOrOptions instanceof HTMLElement) ? sourceOrOptions : {};
    if (sourceOrOptions instanceof HTMLElement) {
      this.source = sourceOrOptions;
      this.axis = typeof $options == "string" ? $options : "inline";
    } else {
      this.source = options?.source;
      this.axis = options?.axis ?? "inline";
      this.anchor = options?.anchorElement;
    }
    this.timeline = $makeScrollTimeline(this.source, this.axis);
    if (!(typeof $options == "string") && $options?.useAnchor && !this.anchor) {
      this.anchor = makeAnchorElement(this.source);
    }
  }
  //
  get [$extract]() {
    return this.timeline?.source ?? this.source;
  }
  //
  get [$affected]() {
    return (cb, prop) => {
      const $cb = () => {
        queueMicrotask(() => cb((this.timeline?.currentTime ?? 0) / (this.timeline?.duration ?? 1), "value"));
      };
      this.timeline?.addEventListener?.("scroll", $cb);
      return () => this.timeline?.removeEventListener?.("scroll", $cb);
    };
  }
  //
  get element() {
    const $src = this.timeline?.source ?? this.source;
    return $src?.element ?? $src;
  }
  //
  get value() {
    return this.progress;
  }
  //
  get currentTime() {
    return this.timeline?.currentTime ?? 0;
  }
  //
  get duration() {
    return this.timeline?.duration ?? 1;
  }
  // Get current scroll progress as reactive value (0-1)
  get progress() {
    try {
      const maxScroll = this.source[["scrollWidth", "scrollHeight"][this.axis === "inline" ? 0 : 1]] - this.source[["clientWidth", "clientHeight"][this.axis === "inline" ? 0 : 1]];
      const currentScroll = this.source[["scrollLeft", "scrollTop"][this.axis === "inline" ? 0 : 1]];
      return maxScroll > 0 ? currentScroll / maxScroll : 0;
    } catch {
      return 0;
    }
  }
  // Scroll to specific progress (0-1)
  scrollTo(progress, smooth = true) {
    const maxScroll = this.source[["scrollWidth", "scrollHeight"][this.axis === "inline" ? 0 : 1]] - this.source[["clientWidth", "clientHeight"][this.axis === "inline" ? 0 : 1]];
    const scrollPos = Math.max(0, Math.min(1, progress)) * maxScroll;
    this.source.scrollTo({
      [["left", "top"][this.axis === "inline" ? 0 : 1]]: scrollPos,
      behavior: smooth ? "smooth" : "instant"
    });
  }
  // Scroll by relative amount
  scrollBy(delta, smooth = true) {
    this.source.scrollBy({
      [["left", "top"][this.axis === "inline" ? 0 : 1]]: delta,
      behavior: smooth ? "smooth" : "instant"
    });
  }
  // Get scrollable area info
  getScrollInfo() {
    const axisIdx = this.axis === "inline" ? 0 : 1;
    return {
      scrollSize: this.source[["scrollWidth", "scrollHeight"][axisIdx]],
      clientSize: this.source[["clientWidth", "clientHeight"][axisIdx]],
      scrollPos: this.source[["scrollLeft", "scrollTop"][axisIdx]],
      maxScroll: this.source[["scrollWidth", "scrollHeight"][axisIdx]] - this.source[["clientWidth", "clientHeight"][axisIdx]],
      progress: this.progress
    };
  }
}
class EnhancedViewTimeline {
  source;
  axis;
  timeline;
  intersectionObserver;
  threshold;
  root;
  rootMargin;
  observerOptions;
  //
  constructor(sourceOrOptions, $options) {
    let options = !(sourceOrOptions instanceof HTMLElement) ? sourceOrOptions : {};
    if (sourceOrOptions instanceof HTMLElement) {
      this.source = sourceOrOptions;
      this.axis = typeof $options == "string" ? $options : "inline";
    } else {
      this.source = options?.source;
      this.axis = options?.axis ?? "inline";
      this.threshold = options?.threshold || [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
      this.root = options?.root;
      this.rootMargin = options?.rootMargin || "0px";
      this.observerOptions = options ?? {
        root: this.root,
        rootMargin: this.rootMargin,
        threshold: this.threshold
      };
    }
    this.timeline = $makeViewTimeline(this.source, this.axis);
  }
  //
  get [$extract]() {
    return this.timeline?.source ?? this.source;
  }
  //
  get element() {
    const $src = this.timeline?.source ?? this.source;
    return $src?.element ?? $src;
  }
  //
  get value() {
    return (this.timeline?.currentTime ?? 0) / (this.timeline?.duration ?? 1);
  }
  //
  get currentTime() {
    return this.timeline?.currentTime ?? 0;
  }
  //
  get duration() {
    return this.timeline?.duration ?? 1;
  }
  //
  get [$affected]() {
    return (cb, prop) => {
      const $cb = () => {
        queueMicrotask(() => cb((this.timeline?.currentTime ?? 0) / (this.timeline?.duration ?? 1), "value"));
      };
      const $observer = new IntersectionObserver((entries) => entries.forEach((entry) => $cb?.()));
      $observer.observe(this.source);
      return () => $observer.disconnect();
    };
  }
  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => this.handleIntersection(entries));
    this.intersectionObserver.observe(this.source);
  }
  handleIntersection(entries) {
    for (const entry of entries) {
      const ratio = entry.intersectionRatio;
      const rect = entry.boundingClientRect;
      if (this.axis === "block") {
        const progress = rect.top < 0 ? Math.abs(rect.top) / (rect.height + globalThis.innerHeight) : 1 - rect.bottom / (rect.height + globalThis.innerHeight);
        this.updateProgress(Math.max(0, Math.min(1, progress)));
      } else {
        const progress = rect.left < 0 ? Math.abs(rect.left) / (rect.width + globalThis.innerWidth) : 1 - rect.right / (rect.width + globalThis.innerWidth);
        this.updateProgress(Math.max(0, Math.min(1, progress)));
      }
    }
  }
  updateProgress(progress) {
    if (this.timeline && "currentTime" in this.timeline) {
      try {
        this.timeline.currentTime = progress * 100;
      } catch (e) {
        console.warn("Timeline currentTime not supported:", e);
      }
    }
  }
  destroy() {
    this.timeline?.disconnect();
  }
}
const makeScrollTimeline = (source, axis) => {
  if (typeof ScrollTimeline != "undefined") {
    return new EnhancedScrollTimeline({ source: source?.element ?? source, axis });
  }
  const target = toRef$1(source);
  const scroll = scrollRef(source, ["inline", "block"][axis]);
  const content = computed(sizeRef(source, ["inline", "block"][axis], "content-box"), (v) => v + getPadding(source, ["inline", "block"][axis]));
  const percent = computed(scroll, (vl) => (vl || 0) / (deref(target)?.[["scrollWidth", "scrollHeight"][axis]] - content?.value || 1));
  affected(content, (vl) => (scroll?.value || 0) / (deref(target)?.[["scrollWidth", "scrollHeight"][axis]] - vl || 1));
  return percent;
};

class AnimationState {
  animations = /* @__PURE__ */ new Map();
  transitions = /* @__PURE__ */ new Map();
  setAnimation(property, animation) {
    this.animations.set(property, animation);
  }
  getAnimation(property) {
    return this.animations.get(property);
  }
  cancelAnimation(property) {
    const animation = this.animations.get(property);
    if (animation) {
      animation.cancel();
      this.animations.delete(property);
    }
  }
  setTransition(element, property, options) {
    const duration = options.duration || 200;
    const easing = options.easing || "ease";
    const delay = options.delay || 0;
    const transitionValue = `${property} ${duration}ms ${easing} ${delay}ms`;
    const existingTransition = this.transitions.get(property);
    if (existingTransition !== transitionValue) {
      this.transitions.set(property, transitionValue);
      this.updateElementTransitions(element);
    }
  }
  updateElementTransitions(element) {
    const transitions = Array.from(this.transitions.values()).join(", ");
    element.style.transition = transitions;
  }
  clearTransitions(element) {
    this.transitions.clear();
    element.style.transition = "";
  }
  cancelAll(element) {
    const animationValues = Array.from(this.animations.values());
    for (const animation of animationValues) {
      animation.cancel();
    }
    this.animations.clear();
    this.clearTransitions(element);
  }
  getAnimations() {
    return this.animations;
  }
}
const animationStates = /* @__PURE__ */ new WeakMap();
function getAnimationState(element) {
  let state = animationStates.get(element);
  if (!state) {
    state = new AnimationState();
    animationStates.set(element, state);
  }
  return state;
}
function handleAnimatedStyleChange(element, property, value, options = {}) {
  if (!element || !property) return;
  const state = getAnimationState(element);
  const currentValue = element.style.getPropertyValue(property) || getComputedStyle(element)[property];
  const targetValue = $getValue(value);
  if (currentValue === targetValue) return;
  state.cancelAnimation(property);
  const keyframes = [
    { [property]: currentValue },
    { [property]: targetValue }
  ];
  const animationOptions = {
    duration: options.duration || 200,
    easing: options.easing || "ease",
    delay: options.delay || 0,
    direction: options.direction || "normal",
    iterations: options.iterations || 1,
    fill: options.fill || "forwards"
  };
  const animation = element.animate(keyframes, animationOptions);
  state.setAnimation(property, animation);
  animation.addEventListener("finish", () => {
    state.cancelAnimation(property);
    element.style.setProperty(property, targetValue);
  });
}
function handleTransitionStyleChange(element, property, value, options = {}) {
  if (!element || !property) return;
  const state = getAnimationState(element);
  const targetValue = $getValue(value);
  state.setTransition(element, property, options);
  element.style.setProperty(property, targetValue);
}
function handleSpringStyleChange(element, property, value, options = {}) {
  if (!element || !property) return;
  const state = getAnimationState(element);
  const targetValue = $getValue(value);
  const currentValue = parseFloat(element.style.getPropertyValue(property)) || parseFloat(getComputedStyle(element)[property]) || 0;
  if (Math.abs(currentValue - targetValue) < 0.01) return;
  state.cancelAnimation(property);
  const stiffness = options.stiffness || 100;
  const damping = options.damping || 10;
  const mass = options.mass || 1;
  const initialVelocity = options.velocity || 0;
  let currentPosition = currentValue;
  let currentVelocity = initialVelocity;
  let animationId;
  const animate = () => {
    const springForce = -stiffness * (currentPosition - targetValue);
    const dampingForce = -damping * currentVelocity;
    const totalForce = springForce + dampingForce;
    const acceleration = totalForce / mass;
    currentVelocity += acceleration * 0.016;
    currentPosition += currentVelocity * 0.016;
    const cssValue = property.includes("scale") || property.includes("opacity") ? currentPosition.toString() : `${currentPosition}px`;
    element.style.setProperty(property, cssValue);
    if (Math.abs(currentPosition - targetValue) > 0.01 || Math.abs(currentVelocity) > 0.01) {
      animationId = requestAnimationFrame(animate);
    } else {
      element.style.setProperty(property, property.includes("scale") || property.includes("opacity") ? targetValue.toString() : `${targetValue}px`);
      state.cancelAnimation(property);
    }
  };
  const mockAnimation = {
    cancel: () => cancelAnimationFrame(animationId)
  };
  state.setAnimation(property, mockAnimation);
  animationId = requestAnimationFrame(animate);
}
function handleMorphStyleChange(element, properties, options = {}) {
  if (!element || !properties) return;
  const state = getAnimationState(element);
  const keyframes = [{}, {}];
  for (const [property, value] of Object.entries(properties)) {
    const currentValue = element.style.getPropertyValue(property) || getComputedStyle(element)[property];
    const targetValue = $getValue(value);
    keyframes[0][property] = currentValue;
    keyframes[1][property] = targetValue;
  }
  for (const property of Object.keys(properties)) {
    state.cancelAnimation(property);
  }
  const animationOptions = {
    duration: options.duration || 300,
    easing: options.easing || "ease-out",
    delay: options.delay || 0,
    direction: options.direction || "normal",
    iterations: options.iterations || 1,
    fill: options.fill || "forwards"
  };
  const animation = element.animate(keyframes, animationOptions);
  for (const property of Object.keys(properties)) {
    state.setAnimation(property, animation);
  }
  animation.addEventListener("finish", () => {
    for (const property of Object.keys(properties)) {
      state.cancelAnimation(property);
      const targetValue = $getValue(properties[property]);
      element.style.setProperty(property, targetValue);
    }
  });
}
function bindAnimatedStyle(element, propertyOrProperties, reactiveValue, animationType = "animate", options = {}) {
  const wel = toRef$1(element);
  const wv = toRef$1(reactiveValue);
  if (animationType === "morph") {
    const properties = propertyOrProperties;
    handleMorphStyleChange(deref$1(wel), properties, options);
    const unaffected = affected(reactiveValue, (newValue) => {
      handleMorphStyleChange(deref$1(wel), properties, options);
    });
    return unsubscribe;
  } else {
    const property = propertyOrProperties;
    const handler = animationType === "animate" ? handleAnimatedStyleChange : animationType === "transition" ? handleTransitionStyleChange : handleSpringStyleChange;
    handler(deref$1(wel), property, $getValue(deref$1(wv)), options);
    const unaffected = affected(reactiveValue, (newValue) => {
      handler(deref$1(wel), property, newValue, options);
    });
    return unsubscribe;
  }
}
class AnimationSequence {
  steps = [];
  addStep(properties, options = {}, delay = 0) {
    this.steps.push({ properties, options, delay });
    return this;
  }
  async play(element) {
    for (const step of this.steps) {
      if (step.delay) {
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }
      await new Promise((resolve) => {
        handleMorphStyleChange(element, step.properties, {
          ...step.options,
          fill: "forwards"
        });
        setTimeout(resolve, step.options.duration || 200);
      });
    }
  }
  static create() {
    return new AnimationSequence();
  }
}
const AnimationPresets = {
  // Smooth fade in/out
  fade: {
    duration: 200,
    easing: "ease-in-out"
  },
  // Bounce effect
  bounce: {
    duration: 400,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  },
  // Elastic effect
  elastic: {
    duration: 600,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  },
  // Slide in from direction
  slideIn: (direction) => ({
    duration: 300,
    easing: "ease-out",
    transform: `translate${direction === "left" || direction === "right" ? "X" : "Y"}(${direction === "left" || direction === "up" ? "-" : ""}100%)`
  }),
  // Scale effect
  scale: {
    duration: 200,
    easing: "ease-in-out"
  }
};
function cancelElementAnimations(element) {
  const state = animationStates.get(element);
  if (state) {
    state.cancelAll(element);
    animationStates.delete(element);
  }
}
function animatedRef(initialValue, animationType = "animate", options = {}) {
  const ref = typeof initialValue === "number" ? numberRef(initialValue) : stringRef(initialValue);
  ref.$animationType = animationType;
  ref.$animationOptions = options;
  return ref;
}
const effectProperty = { fill: "both", delay: 0, easing: "linear", rangeStart: "cover 0%", rangeEnd: "cover 100%", duration: 1 };
const animateByTimeline = async (source, properties = {}, timeline) => {
  if (!source || !timeline) return;
  if (timeline instanceof ScrollTimeline || timeline instanceof ViewTimeline) {
    return source?.animate?.(properties, { ...effectProperty, timeline: timeline?.[$extract] ?? timeline });
  }
  const target = toRef$1(source), wk = toRef$1(timeline);
  const renderCb = ([name, $v]) => {
    const tg = deref$1(target);
    if (tg) {
      const val = deref$1(wk)?.value || 0, values = $v;
      setProperty(tg, name, values[0] * (1 - val) + values[1] * val);
    }
  };
  const scheduler = makeRAFCycle();
  const everyCb = () => Object.entries(properties)?.forEach?.(renderCb);
  return affected(timeline, (val) => scheduler?.schedule?.(everyCb));
};

const elMap$1 = new DoubleWeakMap();
const alives = new FinalizationRegistry((unsub) => unsub?.());
const $mapped = Symbol.for("@mapped");
const $virtual = Symbol.for("@virtual");
const $behavior = Symbol.for("@behavior");
const bindBeh = (element, store, behavior) => {
  const weak = toRef$1(element);
  const name = store?.[0] ?? store?.name;
  const value = store?.[1] ?? store?.value;
  if (behavior) {
    const usub = affected?.(store, (value2, prop, old) => {
      const valMap = namedStoreMaps?.get?.(name);
      behavior?.([value2, prop, old], [weak, store, valMap?.get(deref$1(weak))]);
    });
    addToCallChain(store, Symbol.dispose, usub);
  }
  return element;
};
const bindCtrl = (element, ctrlCb) => {
  const hdl = { click: ctrlCb, input: ctrlCb, change: ctrlCb };
  ctrlCb?.({ target: element });
  const unsub = handleListeners?.(element, "addEventListener", hdl);
  addToCallChain(element, Symbol.dispose, unsub);
  return unsub;
};
const reflectControllers = (element, ctrls) => {
  if (ctrls) for (let ctrl of ctrls) bindCtrl(element, ctrl);
  return element;
};
const $observeInput = (element, ref, prop = "value") => {
  const wel = toRef$1(element);
  const rf = toRef$1(ref);
  const ctrlCb = (_ev) => {
    $set$1(rf, "value", deref$1(wel)?.[prop ?? "value"] ?? $getValue(deref$1(rf)));
  };
  const hdl = { click: ctrlCb, input: ctrlCb, change: ctrlCb };
  ctrlCb?.({ target: element });
  handleListeners?.(element, "addEventListener", hdl);
  $set$1(rf, "value", element?.[prop ?? "value"] ?? $getValue(deref$1(ref)));
  return () => handleListeners?.(element, "removeEventListener", hdl);
};
const $observeAttribute = (el, ref, prop = "") => {
  const wel = toRef$1(el);
  const wv = toRef$1(ref);
  const attrName = camelToKebab$1(prop);
  const cb = (mutation) => {
    if (mutation.type == "attributes" && mutation.attributeName == attrName) {
      const value = mutation?.target?.getAttribute?.(mutation.attributeName);
      const valRef = deref$1(wv), reVal = $getValue(valRef);
      if (isNotEqual(mutation.oldValue, value) && valRef != null && (typeof valRef == "object" || typeof valRef == "function")) {
        if (isNotEqual(reVal, value) || reVal == null) {
          $set$1(valRef, "value", value);
        }
      }
    }
  };
  return observeAttribute(el, attrName, cb);
};
const removeFromBank = (el, handler, prop) => {
  const bank = elMap$1.get([el, handler]);
  if (bank) {
    const old = bank[prop]?.[1];
    delete bank[prop];
    old?.();
  }
};
const addToBank = (el, handler, prop, forLink) => {
  const bank = elMap$1.getOrInsertComputed([el, handler], () => ({}));
  bank?.[prop]?.[1]?.();
  bank[prop] = forLink;
  return true;
};
const hasInBank = (el, handler) => {
  return elMap$1.has([el, handler]);
};
const bindHandler = (element, value, prop, handler, set, withObserver) => {
  const wel = toRef$1(element);
  element = deref$1(wel);
  if (!element || !(element instanceof Node || element?.element instanceof Node)) return;
  let controller = null;
  controller?.abort?.();
  controller = new AbortController();
  const wv = toRef$1(value);
  handler?.(element, prop, value);
  const un = affected?.([value, "value"], (curr, _p, old) => {
    const valueRef = deref$1(wv);
    const setRef = deref$1(set);
    const elementRef = deref$1(wel);
    const v = $getValue(valueRef) ?? $getValue(curr);
    if (!setRef || setRef?.[prop] == valueRef) {
      if (typeof valueRef?.[$behavior] == "function") {
        valueRef?.[$behavior]?.(
          (_val = curr) => handler(elementRef, prop, v),
          [curr, prop, old],
          [controller?.signal, prop, wel]
        );
      } else {
        handler(elementRef, prop, v);
      }
    }
  });
  let obs = null;
  if (typeof withObserver == "boolean" && withObserver) {
    if (handler == handleAttribute) obs = $observeAttribute(element, value, prop);
    if (handler == handleProperty) obs = $observeInput(element, value, prop);
  }
  if (typeof withObserver == "function") {
    obs = withObserver(element, prop, value);
  }
  const unsub = () => {
    obs?.disconnect?.();
    obs != null && typeof obs == "function" ? obs?.() : null;
    un?.();
    controller?.abort?.();
    removeFromBank?.(element, handler, prop);
  };
  addToCallChain(value, Symbol.dispose, unsub);
  alives.register(element, unsub);
  if (!addToBank(element, handler, prop, [value, unsub])) return unsub;
};
const updateInput = (target, state) => {
  const selector = 'input:where([type="text"], [type="number"], [type="range"])';
  const input = includeSelf(target, "input");
  const name = input?.name || target?.dataset?.name || "";
  if (state?.[name] != null || name in state) {
    if (state && input?.matches?.(selector)) {
      if (input.value != state[name]) {
        $avoidTrigger(state, () => {
          input.value = state[name];
          input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        }, name);
      }
    }
    if (state) {
      const radio = includeSelf(
        target,
        `input:where([type="radio"][name="${name}"][value="${state?.[name]}"])`
      );
      if (state && radio && state[name] == radio.value && !radio.checked) {
        $avoidTrigger(state, () => {
          setChecked(radio, state[name]);
        }, name);
      }
    }
    const checkbox = includeSelf(target, 'input:where([type="checkbox"])');
    if (state && checkbox) {
      if (state[name] != checkbox.checked) {
        $avoidTrigger(state, () => {
          setChecked(checkbox, state[name]);
        }, name);
      }
    }
  }
};
const bindWith = (el, prop, value, handler, set, withObserver) => {
  handler(el, prop, value);
  return bindHandler(el, value, prop, handler, set, withObserver);
};
const bindForms = (fields = document.documentElement, wrapper = ".u2-input", state = {}) => {
  state ??= observe({});
  const wst = new WeakRef(state);
  const onChange = (ev) => {
    const state2 = deref$1(wst);
    if (!state2) return;
    const eventTarget = getEventTarget(ev) ?? ev?.target;
    const input = eventTarget?.matches?.("input") ? eventTarget : eventTarget?.querySelector?.("input");
    const target = (eventTarget?.matches?.(wrapper) ? eventTarget : input?.closest?.(wrapper)) ?? input;
    const name = input?.name || target?.name || target?.dataset?.name;
    if (state2?.[name] != null || name in state2) {
      if (input?.matches?.('input:where([type="text"], [type="number"], [type="range"])')) {
        const value = input.valueAsNumber != null && !isNaN(input.valueAsNumber) ? input.valueAsNumber : input.value;
        if (state2[name] != value) state2[name] = value;
      }
      if (input?.matches?.('input[type="radio"]') && state2[name] != input?.value && input?.checked) {
        state2[name] = input.value;
      }
      if (input?.matches?.('input[type="checkbox"]') && state2[name] != input?.checked) {
        state2[name] = input.checked;
      }
    }
  };
  const appearHandler = () => requestIdleCallback(
    () => fields.querySelectorAll(wrapper).forEach((target) => updateInput(target, state)),
    { timeout: 100 }
  );
  const observer = observeBySelector(
    fields,
    wrapper,
    (mutations) => mutations.addedNodes.forEach(
      (target) => requestIdleCallback(() => updateInput(state, target), { timeout: 100 })
    )
  );
  const unsubscribe = affected?.(
    state,
    (_value, _property) => fields.querySelectorAll(wrapper).forEach((target) => updateInput(target, state))
  );
  requestIdleCallback(
    () => fields.querySelectorAll(wrapper).forEach((target) => updateInput(target, state)),
    { timeout: 100 }
  );
  fields.addEventListener("input", onChange);
  fields.addEventListener("change", onChange);
  fields.addEventListener("u2-appear", appearHandler);
  const wf = new WeakRef(fields);
  addToCallChain(state, Symbol.dispose, () => {
    const fields2 = deref$1(wf);
    fields2?.removeEventListener?.("input", onChange);
    fields2?.removeEventListener?.("change", onChange);
    fields2?.removeEventListener?.("u2-appear", appearHandler);
    observer?.disconnect?.();
    unsubscribe?.();
    unaffected(state);
  });
  return state;
};
const bindAnimated = (element, property, value, options = {}) => {
  return bindAnimatedStyle(element, property, value, "animate", options);
};
const bindTransition = (element, property, value, options = {}) => {
  return bindAnimatedStyle(element, property, value, "transition", options);
};
const bindSpring = (element, property, value, options = {}) => {
  return bindAnimatedStyle(element, property, value, "spring", options);
};
const bindMorph = (element, properties, options = {}) => {
  return bindAnimatedStyle(element, "", properties, "morph", options);
};
const createAnimatedRef = animatedRef;
const createAnimationSequence = () => AnimationSequence.create();
const cancelAnimations = cancelElementAnimations;
const bindWithAnimation = (el, prop, value, animationType = "instant", animationOptions = {}) => {
  if (animationType === "instant") {
    return bindWith(el, prop, value, handleStyleChange);
  }
  const binder = animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
  return binder(el, prop, value, animationOptions);
};
const bindAnimatedBatch = (element, bindings) => {
  const unbinders = [];
  bindings.forEach((binding, index) => {
    const delay = binding.delay || index * 50;
    const options = {
      ...binding.options,
      delay: (binding.options?.delay || 0) + delay
    };
    const unbinder = bindAnimatedStyle(
      element,
      binding.property,
      binding.value,
      binding.animationType || "animate",
      options
    );
    unbinders.push(unbinder);
  });
  return () => unbinders.forEach((unbind) => unbind?.());
};
const bindPreset = {
  fade: (element, value, duration = 200) => bindAnimated(element, "opacity", value, { duration, easing: "ease-in-out" }),
  slideX: (element, value, duration = 300) => bindAnimated(element, "transform", value, { duration, easing: "ease-out" }),
  slideY: (element, value, duration = 300) => bindAnimated(element, "transform", value, { duration, easing: "ease-out" }),
  scale: (element, value, duration = 200) => bindAnimated(element, "transform", value, { duration, easing: "ease-in-out" }),
  color: (element, value, duration = 300) => bindTransition(element, "color", value, { duration, easing: "ease-in-out" }),
  backgroundColor: (element, value, duration = 300) => bindTransition(element, "background-color", value, { duration, easing: "ease-in-out" }),
  bounce: (element, property, value) => bindSpring(element, property, value, { stiffness: 200, damping: 15 }),
  elastic: (element, property, value) => bindAnimated(element, property, value, AnimationPresets.elastic)
};
const bindConditionalAnimation = (element, condition, animations) => {
  const wel = toRef$1(element);
  const wcond = toRef$1(condition);
  let currentUnbinders = [];
  const applyAnimations = (isTrue) => {
    currentUnbinders.forEach((un) => un?.());
    currentUnbinders = [];
    const animationSet = isTrue ? animations.true : animations.false;
    if (animationSet) {
      animationSet.forEach((anim) => {
        const unbinder = bindAnimated(deref$1(wel), anim.property, anim.value, anim.options);
        currentUnbinders.push(unbinder);
      });
    }
  };
  applyAnimations($getValue(deref$1(wcond)));
  const unSub = affected(condition, (newValue) => {
    applyAnimations(!!newValue);
  });
  return () => {
    currentUnbinders.forEach((un) => un?.());
    unSub?.();
  };
};
const withInsetWithPointer = (exists, pRef) => {
  if (!exists) return () => {
  };
  const ubs = [
    bindWith(exists, "--client-x", pRef?.[0], handleStyleChange),
    bindWith(exists, "--client-y", pRef?.[1], handleStyleChange)
  ];
  if (pRef?.[2]) ubs.push(bindWith(exists, "--anchor-width", pRef?.[2], handleStyleChange));
  if (pRef?.[3]) ubs.push(bindWith(exists, "--anchor-height", pRef?.[3], handleStyleChange));
  return () => ubs?.forEach?.((ub) => ub?.());
};
const bindWhileConnected = (element, bind) => {
  if (!element) return () => {
  };
  let cleanup = null;
  let disposed = false;
  const ensureBound = () => {
    if (disposed) return;
    if (!element.isConnected) {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      return;
    }
    if (!cleanup) {
      const c = bind();
      cleanup = typeof c === "function" ? c : null;
    }
  };
  const root = typeof document !== "undefined" ? document.documentElement : null;
  const el = element?.element ?? element;
  const mo = typeof MutationObserver !== "undefined" && root ? new MutationObserver((records) => {
    for (const r of records) {
      if (r.target === el || r.target?.contains?.(el)) {
        ensureBound();
        return;
      }
      const nodes = [...Array.from(r?.addedNodes || []), ...Array.from(r?.removedNodes || [])];
      for (const n of nodes) {
        if (n === el || n.contains?.(el)) {
          ensureBound();
          return;
        }
      }
    }
  }) : null;
  if (mo && root) mo.observe(root, { childList: true, subtree: true });
  queueMicrotask(() => ensureBound());
  return () => {
    disposed = true;
    mo?.disconnect?.();
    cleanup?.();
    cleanup = null;
  };
};

const existsQueries = /* @__PURE__ */ new WeakMap();
const alreadyUsed = /* @__PURE__ */ new WeakMap();
const queryExtensions = {
  logAll(ctx) {
    return () => console.log("attributes:", [...ctx?.attributes].map((x) => ({ name: x.name, value: x.value })));
  },
  append(ctx) {
    return (...args) => ctx?.append?.(...[...args || []]?.map?.((e) => e?.element ?? e) || args);
  },
  current(ctx) {
    return ctx;
  }
  // direct getter
};
class UniversalElementHandler {
  direction = "children";
  selector;
  index = 0;
  //
  _eventMap = /* @__PURE__ */ new WeakMap();
  constructor(selector, index = 0, direction = "children") {
    this.index = index;
    this.selector = selector;
    this.direction = direction;
  }
  //
  _observeDOMChange(target, selector, cb) {
    return typeof selector == "string" ? observeBySelector(target, selector, cb) : null;
  }
  //
  _observeAttributes(target, attribute, cb) {
    return typeof this.selector == "string" ? observeAttributeBySelector(target, this.selector, attribute, cb) : observeAttribute(target ?? this.selector, attribute, cb);
  }
  //
  _getArray(target) {
    if (typeof target == "function") {
      target = this.selector || target?.(this.selector);
    }
    ;
    if (!this.selector) return [target];
    if (typeof this.selector == "string") {
      const inclusion = typeof target?.matches == "function" && target?.element != null && target?.matches?.(this.selector) ? [target] : [];
      if (this.direction == "children") {
        const list = typeof target?.querySelectorAll == "function" && target?.element != null ? [...target?.querySelectorAll?.(this.selector)] : [];
        return list?.length >= 1 ? [...list] : inclusion;
      } else if (this.direction == "parent") {
        const closest = target?.closest?.(this.selector);
        return closest ? [closest] : inclusion;
      }
      return inclusion;
    }
    return Array.isArray(this.selector) ? this.selector : [this.selector];
  }
  //
  _getSelected(target) {
    const tg = target?.self ?? target;
    const sel = this._selector(target);
    if (typeof sel == "string") {
      if (this.direction == "children") {
        return tg?.matches?.(sel) ? tg : tg?.querySelector?.(sel);
      }
      if (this.direction == "parent") {
        return tg?.matches?.(sel) ? tg : tg?.closest?.(sel);
      }
    }
    return tg == (sel?.element ?? sel) ? sel?.element ?? sel : null;
  }
  // if selector isn't string, can't be redirected
  _redirectToBubble(eventName) {
    const sel = this._selector();
    if (typeof sel == "string") {
      return {
        ["pointerenter"]: "pointerover",
        ["pointerleave"]: "pointerout",
        ["mouseenter"]: "mouseover",
        ["mouseleave"]: "mouseout",
        ["focus"]: "focusin",
        ["blur"]: "focusout"
      }?.[eventName] || eventName;
    }
    return eventName;
  }
  //
  _addEventListener(target, name, cb, option) {
    const selector = this._selector(target);
    if (typeof selector != "string") {
      selector?.addEventListener?.(name, cb, option);
      return cb;
    }
    const eventName = this._redirectToBubble(name);
    const parent = target?.self ?? target;
    const wrap = (ev) => {
      const sel = this._selector(target);
      const rot = ev?.currentTarget ?? parent;
      let tg = null;
      if (ev?.composedPath && typeof ev.composedPath === "function") {
        const path = ev.composedPath();
        for (const node of path) {
          if (node instanceof HTMLElement || node instanceof Element) {
            const nodeEl = node?.element ?? node;
            if (typeof sel == "string") {
              if (MOCElement(nodeEl, sel, ev)) {
                tg = nodeEl;
                break;
              }
            } else {
              if (containsOrSelf(sel, nodeEl, ev)) {
                tg = nodeEl;
                break;
              }
            }
          }
        }
      }
      if (!tg) {
        tg = ev?.target ?? this._getSelected(target) ?? rot;
        tg = tg?.element ?? tg;
      }
      if (typeof sel == "string") {
        if (containsOrSelf(rot, MOCElement(tg, sel, ev), ev)) {
          cb?.call?.(tg, ev);
        }
      } else {
        if (containsOrSelf(rot, sel, ev) && containsOrSelf(sel, tg, ev)) {
          cb?.call?.(tg, ev);
        }
      }
    };
    parent?.addEventListener?.(eventName, wrap, option);
    const eventMap = this._eventMap.getOrInsert(parent, /* @__PURE__ */ new Map());
    const cbMap = eventMap.getOrInsert(eventName, /* @__PURE__ */ new WeakMap());
    cbMap.set(cb, { wrap, option });
    return wrap;
  }
  //
  _removeEventListener(target, name, cb, option) {
    const selector = this._selector(target);
    if (typeof selector != "string") {
      selector?.removeEventListener?.(name, cb, option);
      return cb;
    }
    const parent = target?.self ?? target;
    const eventName = this._redirectToBubble(name), eventMap = this._eventMap.get(parent);
    if (!eventMap) return;
    const cbMap = eventMap.get(eventName), entry = cbMap?.get?.(cb);
    parent?.removeEventListener?.(eventName, entry?.wrap ?? cb, option ?? entry?.option ?? {});
    cbMap?.delete?.(cb);
    if (cbMap?.size == 0) eventMap?.delete?.(eventName);
    if (eventMap.size == 0) this._eventMap.delete(parent);
  }
  //
  _selector(tg) {
    if (typeof this.selector == "string" && typeof tg?.selector == "string") {
      return ((tg?.selector || "") + " " + this.selector)?.trim?.();
    }
    return this.selector;
  }
  //
  get(target, name, ctx) {
    const array = this._getArray(target);
    const selected = array.length > 0 ? array[this.index] : this._getSelected(target);
    if (name in queryExtensions) {
      return queryExtensions?.[name]?.(selected);
    }
    if (name == "length" && array?.length != null) {
      return array?.length;
    }
    if (name == "_updateSelector") return (sel) => this.selector = sel || this.selector;
    if (["style", "attributeStyleMap"].indexOf(name) >= 0) {
      const tg = target?.self ?? target;
      const selector = this._selector(target);
      const basis = typeof selector == "string" ? getAdoptedStyleRule(selector, "ux-query", tg) : selected;
      if (name == "attributeStyleMap") {
        return basis?.styleMap ?? basis?.attributeStyleMap;
      }
      return basis?.[name];
    }
    if (name == "self") return target?.self ?? target;
    if (name == "selector") return this._selector(target);
    if (name == "observeAttr") return (name2, cb) => this._observeAttributes(target, name2, cb);
    if (name == "DOMChange") return (cb) => this._observeDOMChange(target, this.selector, cb);
    if (name == "addEventListener") return (name2, cb, opt) => this._addEventListener(target, name2, cb, opt);
    if (name == "removeEventListener") return (name2, cb, opt) => this._removeEventListener(target, name2, cb, opt);
    if (name == "getAttribute") {
      return (key) => {
        const array2 = this._getArray(target);
        const selected2 = array2.length > 0 ? array2[this.index] : this._getSelected(target);
        const query = existsQueries?.get?.(target)?.get?.(this.selector) ?? selected2;
        if (elMap$1?.get?.(query)?.get?.(handleAttribute)?.has?.(key)) {
          return elMap$1?.get?.(query)?.get?.(handleAttribute)?.get?.(key)?.[0];
        }
        return selected2?.getAttribute?.(key);
      };
    }
    if (name == "setAttribute") {
      return (key, value) => {
        const array2 = this._getArray(target);
        const selected2 = array2.length > 0 ? array2[this.index] : this._getSelected(target);
        if (typeof value == "object" && (value?.value != null || "value" in value)) {
          return bindWith(selected2, key, value, handleAttribute, null, true);
        }
        return selected2?.setAttribute?.(key, value);
      };
    }
    if (name == "removeAttribute") {
      return (key) => {
        const array2 = this._getArray(target);
        const selected2 = array2.length > 0 ? array2[this.index] : this._getSelected(target);
        const query = existsQueries?.get?.(target)?.get?.(this.selector) ?? selected2;
        if (elMap$1?.get?.(query)?.get?.(handleAttribute)?.has?.(key)) {
          return elMap$1?.get?.(query)?.get?.(handleAttribute)?.get?.(key)?.[1]?.();
        }
        return selected2?.removeAttribute?.(key);
      };
    }
    if (name == "hasAttribute") {
      return (key) => {
        const array2 = this._getArray(target);
        const selected2 = array2.length > 0 ? array2[this.index] : this._getSelected(target);
        const query = existsQueries?.get?.(target)?.get?.(this.selector) ?? selected2;
        if (elMap$1?.get?.(query)?.get?.(handleAttribute)?.has?.(key)) {
          return true;
        }
        return selected2?.hasAttribute?.(key);
      };
    }
    if (name == "element") {
      if (array?.length <= 1) return selected?.element ?? selected;
      const fragment = document.createDocumentFragment();
      fragment.append(...array);
      return fragment;
    }
    if (name == Symbol.toPrimitive) {
      if (this.selector?.includes?.("input") || this.selector?.matches?.("input")) {
        return (hint) => {
          if (hint == "number") return (selected?.element ?? selected)?.valueAsNumber ?? parseFloat((selected?.element ?? selected)?.value);
          if (hint == "string") return String((selected?.element ?? selected)?.value ?? (selected?.element ?? selected));
          if (hint == "boolean") return (selected?.element ?? selected)?.checked;
          return (selected?.element ?? selected)?.checked ?? (selected?.element ?? selected)?.value ?? (selected?.element ?? selected);
        };
      }
    }
    if (name == "checked") {
      if (this.selector?.includes?.("input") || this.selector?.matches?.("input")) {
        return (selected?.element ?? selected)?.checked;
      }
    }
    if (name == "value") {
      if (this.selector?.includes?.("input") || this.selector?.matches?.("input")) {
        return (selected?.element ?? selected)?.valueAsNumber ?? (selected?.element ?? selected)?.valueAsDate ?? (selected?.element ?? selected)?.value ?? (selected?.element ?? selected)?.checked;
      }
    }
    if (name == $affected) {
      if (this.selector?.includes?.("input") || this.selector?.matches?.("input")) {
        return (cb) => {
          let oldValue = selected?.value;
          const evt = [
            (ev) => {
              const input = this._getSelected(ev?.target);
              cb?.(input?.value, "value", oldValue);
              oldValue = input?.value;
            },
            { passive: true }
          ];
          this._addEventListener(target, "change", ...evt);
          return () => this._removeEventListener(target, "change", ...evt);
        };
      }
    }
    if (name == "deref" && (typeof selected == "object" || typeof selected == "function") && selected != null) {
      const wk = new WeakRef(selected);
      return () => wk?.deref?.()?.element ?? wk?.deref?.();
    }
    if (typeof name == "string" && /^\d+$/.test(name)) {
      return array[parseInt(name)];
    }
    ;
    const origin = selected;
    if (origin?.[name] != null) {
      return typeof origin[name] == "function" ? origin[name].bind(origin) : origin[name];
    }
    if (array?.[name] != null) {
      return typeof array[name] == "function" ? array[name].bind(array) : array[name];
    }
    return typeof target?.[name] == "function" ? target?.[name].bind(origin) : target?.[name];
  }
  //
  set(target, name, value) {
    const array = this._getArray(target);
    const selected = array.length > 0 ? array[this.index] : this._getSelected(target);
    if (typeof name == "string" && /^\d+$/.test(name)) {
      return false;
    }
    if (array[name] != null) {
      return false;
    }
    if (selected) {
      selected[name] = value;
      return true;
    }
    return true;
  }
  //
  has(target, name) {
    const array = this._getArray(target);
    const selected = array.length > 0 ? array[this.index] : this._getSelected(target);
    return typeof name == "string" && /^\d+$/.test(name) && array[parseInt(name)] != null || array[name] != null || selected && name in selected;
  }
  //
  deleteProperty(target, name) {
    const array = this._getArray(target);
    const selected = array.length > 0 ? array[this.index] : this._getSelected(target);
    if (selected && name in selected) {
      delete selected[name];
      return true;
    }
    return false;
  }
  //
  ownKeys(target) {
    const array = this._getArray(target);
    const selected = array.length > 0 ? array[this.index] : this._getSelected(target);
    const keys = /* @__PURE__ */ new Set();
    array.forEach((el, i) => keys.add(i.toString()));
    Object.getOwnPropertyNames(array).forEach((k) => keys.add(k));
    if (selected) Object.getOwnPropertyNames(selected).forEach((k) => keys.add(k));
    return Array.from(keys);
  }
  //
  defineProperty(target, name, desc) {
    const array = this._getArray(target);
    const selected = array.length > 0 ? array[this.index] : this._getSelected(target);
    if (selected) {
      Object.defineProperty(selected, name, desc);
      return true;
    }
    return false;
  }
  //
  apply(target, self, args) {
    args[0] ||= this.selector;
    const result = target?.apply?.(self, args);
    this.selector = result || this.selector;
    return new Proxy(target, this);
  }
}
const Q = (selector, host = document.documentElement, index = 0, direction = "children") => {
  if ((selector?.element ?? selector) instanceof HTMLElement) {
    const el = selector?.element ?? selector;
    return alreadyUsed.getOrInsert(el, new Proxy(el, new UniversalElementHandler("", index, direction)));
  }
  if (typeof selector == "function") {
    const el = selector;
    return alreadyUsed.getOrInsert(el, new Proxy(el, new UniversalElementHandler("", index, direction)));
  }
  if (host == null || typeof host == "string" || typeof host == "number" || typeof host == "boolean" || typeof host == "symbol" || typeof host == "undefined") {
    return null;
  }
  if (existsQueries?.get?.(host)?.has?.(selector)) {
    return existsQueries?.get?.(host)?.get?.(selector);
  }
  return existsQueries?.getOrInsert?.(host, /* @__PURE__ */ new Map())?.getOrInsertComputed?.(selector, () => {
    return new Proxy(host, new UniversalElementHandler(selector, index, direction));
  });
};
const extendQueryPrototype = (extended = {}) => {
  return Object.assign(queryExtensions, extended);
};

const $entries = (obj) => {
  if (isPrimitive(obj)) {
    return [];
  }
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => [idx, item]);
  }
  if (obj instanceof Map) {
    return Array.from(obj.entries());
  }
  if (obj instanceof Set) {
    return Array.from(obj.values());
  }
  return Array.from(Object.entries(obj));
};
const reflectAttributes = (element, attributes) => {
  if (!attributes) return element;
  const weak = new WeakRef(attributes), wel = new WeakRef(element);
  if (typeof attributes == "object" || typeof attributes == "function") {
    $entries(attributes).forEach(([prop, value]) => {
      handleAttribute(wel?.deref?.(), prop, value);
    });
    const usub = affected(attributes, (value, prop) => {
      handleAttribute(wel?.deref?.(), prop, value);
      bindHandler(wel?.deref?.(), value, prop, handleAttribute, weak, true);
    });
    addToCallChain(attributes, Symbol.dispose, usub);
    addToCallChain(element, Symbol.dispose, usub);
  } else {
    console.warn("Invalid attributes object:", attributes);
  }
};
const reflectARIA = (element, aria) => {
  if (!aria) return element;
  const weak = new WeakRef(aria), wel = new WeakRef(element);
  if (typeof aria == "object" || typeof aria == "function") {
    $entries(aria).forEach(([prop, value]) => {
      handleAttribute(wel?.deref?.(), "aria-" + (prop?.toString?.() || prop || ""), value);
    });
    const usub = affected(aria, (value, prop) => {
      handleAttribute(wel?.deref?.(), "aria-" + (prop?.toString?.() || prop || ""), value, true);
      bindHandler(wel, value, prop, handleAttribute, weak, true);
    });
    addToCallChain(aria, Symbol.dispose, usub);
    addToCallChain(element, Symbol.dispose, usub);
  } else {
    console.warn("Invalid ARIA object:", aria);
  }
  ;
  return element;
};
const reflectDataset = (element, dataset) => {
  if (!dataset) return element;
  const weak = new WeakRef(dataset), wel = new WeakRef(element);
  if (typeof dataset == "object" || typeof dataset == "function") {
    $entries(dataset).forEach(([prop, value]) => {
      handleDataset(wel?.deref?.(), prop, value);
    });
    const usub = affected(dataset, (value, prop) => {
      handleDataset(wel?.deref?.(), prop, value);
      bindHandler(wel?.deref?.(), value, prop, handleDataset, weak);
    });
    addToCallChain(dataset, Symbol.dispose, usub);
    addToCallChain(element, Symbol.dispose, usub);
  } else {
    console.warn("Invalid dataset object:", dataset);
  }
  ;
  return element;
};
const reflectStyles = (element, styles) => {
  if (!styles) return element;
  if (typeof styles == "string") {
    element.style.cssText = styles;
  } else if (typeof styles?.value == "string") {
    affected([styles, "value"], (val) => {
      element.style.cssText = val;
    });
  } else if (typeof styles == "object" || typeof styles == "function") {
    const weak = new WeakRef(styles), wel = new WeakRef(element);
    $entries(styles).forEach(([prop, value]) => {
      handleStyleChange(wel?.deref?.(), prop, value);
    });
    const usub = affected(styles, (value, prop) => {
      handleStyleChange(wel?.deref?.(), prop, value);
      bindHandler(wel?.deref?.(), value, prop, handleStyleChange, weak?.deref?.());
    });
    addToCallChain(styles, Symbol.dispose, usub);
    addToCallChain(element, Symbol.dispose, usub);
  } else {
    console.warn("Invalid styles object:", styles);
  }
  return element;
};
const reflectWithStyleRules = async (element, rule) => {
  const styles = await rule?.(element);
  return reflectStyles(element, styles);
};
const reflectProperties = (element, properties) => {
  if (!properties) return element;
  const weak = new WeakRef(properties), wel = new WeakRef(element);
  const onChange = (ev) => {
    const input = Q("input", ev?.target);
    if (input?.value != null && isNotEqual(input?.value, properties?.value)) properties.value = input?.value;
    if (input?.valueAsNumber != null && isNotEqual(input?.valueAsNumber, properties?.valueAsNumber)) properties.valueAsNumber = input?.valueAsNumber;
    if (input?.checked != null && isNotEqual(input?.checked, properties?.checked)) properties.checked = input?.checked;
  };
  $entries(properties).forEach(([prop, value]) => {
    handleProperty(wel?.deref?.(), prop, value);
  });
  const usub = affected(properties, (value, prop) => {
    const el = wel.deref();
    if (el) {
      if (prop == "checked") {
        setChecked(el, value);
      } else {
        bindWith(el, prop, value, handleProperty, weak?.deref?.(), true);
      }
    }
  });
  addToCallChain(properties, Symbol.dispose, usub);
  addToCallChain(element, Symbol.dispose, usub);
  element.addEventListener("change", onChange);
  return element;
};
const reflectClassList = (element, classList) => {
  if (!classList) return element;
  const wel = new WeakRef(element);
  $entries(classList).forEach(([prop, value]) => {
    const el = element;
    if (typeof value == "undefined" || value == null) {
      if (el.classList.contains(value)) {
        el.classList.remove(value);
      }
    } else {
      if (!el.classList.contains(value)) {
        el.classList.add(value);
      }
    }
  });
  const usub = iterated(classList, (value) => {
    const el = wel?.deref?.();
    if (el) {
      if (typeof value == "undefined" || value == null) {
        if (el.classList.contains(value)) {
          el.classList.remove(value);
        }
      } else {
        if (!el.classList.contains(value)) {
          el.classList.add(value);
        }
      }
    }
  });
  addToCallChain(classList, Symbol.dispose, usub);
  addToCallChain(element, Symbol.dispose, usub);
  return element;
};

const makeUpdater = (defaultParent = null, mapper, isArray = true) => {
  const commandBuffer = [];
  const merge = () => {
    commandBuffer?.forEach?.(([fn, args]) => fn?.(...args));
    commandBuffer?.splice?.(0, commandBuffer?.length);
  };
  const updateChildList = (newEl, idx, oldEl, op, boundParent = null) => {
    const $requestor = isValidParent$1(boundParent) ?? isValidParent$1(defaultParent);
    const newNode = getNode(newEl, mapper, idx, $requestor);
    const oldNode = getNode(oldEl, mapper, idx, $requestor);
    let doubtfulParent = newNode?.parentElement ?? oldNode?.parentElement;
    let element = isValidParent$1(doubtfulParent) ?? $requestor;
    if (!element) return;
    if (defaultParent != element) {
      defaultParent = element;
    }
    const oldIdx = indexOf(element, oldNode);
    if (["@add", "@set", "@delete"].indexOf(op || "") >= 0 || !op) {
      if (newNode == null && oldNode != null || op == "@delete") {
        commandBuffer?.push?.([removeChild, [element, oldNode, null, oldIdx >= 0 ? oldIdx : idx]]);
      } else if (newNode != null && oldNode == null || op == "@add") {
        commandBuffer?.push?.([appendChild, [element, newNode, null, idx]]);
      } else if (newNode != null && oldNode != null || op == "@set") {
        commandBuffer?.push?.([replaceChildren, [element, newNode, null, oldIdx >= 0 ? oldIdx : idx, oldNode]]);
      }
      ;
    }
    if (op && op != "@get" && ["@add", "@set", "@delete"].indexOf(op) >= 0 || !op && !isArray) {
      merge?.();
    }
  };
  return updateChildList;
};
const asArray$2 = (children) => {
  if (children instanceof Map || children instanceof Set) {
    children = Array.from(children?.values?.());
  }
  return children;
};
const reflectChildren = (element, children = [], mapper) => {
  const $parent = getNode(Array.from(children?.values?.() || [])?.[0], mapper, 0)?.parentElement;
  if (!isValidParent$1(element)) {
    element = (isValidParent$1($parent) ? $parent : element) ?? element;
  }
  if (!children || hasInBank(element, children)) return element;
  mapper = (children?.[$mapped] ? children?.mapper : mapper) ?? mapper;
  children = (children?.[$mapped] ? children?.children : children) ?? children;
  removeNotExists(element, asArray$2(children)?.map?.((nd, index) => getNode(nd, mapper, index, element)));
  const updater = makeUpdater(element, mapper, true);
  const unsub = iterated(children, (...args) => {
    const firstOf = getNode(Array.from(children?.values?.() || [])?.[0], mapper, 0);
    const boundParent = firstOf?.parentElement;
    return updater(args?.[0], args?.[1], args?.[2], args?.[3], boundParent);
  });
  addToBank(element, reflectChildren, "childNodes", [children, unsub]);
  addToCallChain(children, Symbol.dispose, unsub);
  addToCallChain(element, Symbol.dispose, unsub);
  return element;
};
const reformChildren = (element, children = [], mapper) => {
  if (!children || !element) return element;
  mapper = (children?.[$mapped] ? children?.mapper : mapper) ?? mapper;
  children = (children?.[$mapped] ? children?.children : children) ?? children;
  const keys = Array.from(children?.keys?.() || []);
  const cvt = asArray$2(children)?.map?.((nd, index) => getNode(nd, mapper, keys?.[index] ?? index, element));
  removeNotExists(element, cvt);
  cvt?.forEach?.((nd) => appendChild(element, nd));
  return element;
};

class Ch {
  #stub = document.createComment("");
  #valueRef;
  #fragments;
  #updater = null;
  #internal = null;
  #updating = false;
  #options = {};
  #oldNode;
  // in case, if '.value' is primitive, and can't be reused by maps
  #mapCb = null;
  //#reMap: WeakMap<any, any>; // reuse same object from value
  //
  #boundParent = null;
  //
  makeUpdater(basisParent = null) {
    if (basisParent) {
      this.#internal?.();
      this.#internal = null;
      this.#updater = null;
      this.#updater ??= makeUpdater(basisParent, null, false);
      this.#internal ??= affected?.([this.#valueRef, "value"], this._onUpdate.bind(this));
    }
  }
  //
  get boundParent() {
    return this.#boundParent;
  }
  set boundParent(value) {
    if (value instanceof HTMLElement && isValidParent$1(value) && value != this.#boundParent) {
      this.#boundParent = value;
      this.makeUpdater(value);
      if (this.#oldNode) {
        this.#oldNode?.parentNode != null && this.#oldNode?.remove?.();
        this.#oldNode = null;
      }
      ;
      const element = this.element;
    }
  }
  //
  constructor(valueRef, mapCb = (el) => el, options = (
    /*{ removeNotExistsWhenHasPrimitives: true, uniquePrimitives: true, preMap: true } as MappedOptions*/
    null
  )) {
    this.#stub = document.createComment("");
    if (hasValue(mapCb) && ((typeof valueRef == "function" || typeof valueRef == "object") && !hasValue(valueRef))) {
      [valueRef, mapCb] = [mapCb, valueRef];
    }
    if (!options && (mapCb != null && typeof mapCb == "object") && !hasValue(mapCb)) {
      options = mapCb;
    }
    this.#mapCb = (mapCb != null ? typeof mapCb == "function" ? mapCb : typeof mapCb == "object" ? mapCb?.mapper : null : null) ?? ((el) => el);
    this.#oldNode = null;
    this.#valueRef = (!hasValue(valueRef) ? mapCb?.(valueRef, -1) : valueRef) ?? valueRef;
    this.#fragments = document.createDocumentFragment();
    const $baseOptions = { removeNotExistsWhenHasPrimitives: true, uniquePrimitives: true, preMap: true };
    const $newOptions = (isValidParent$1(options) ? null : options) || {};
    this.#options = Object.assign($baseOptions, $newOptions);
    this.boundParent = isValidParent$1(this.#options?.boundParent) ?? (isValidParent$1(options) ?? null);
  }
  //
  $getNodeBy(requestor, value) {
    const node = isPrimitive(hasValue(value) ? value?.value : value) ? T(value) : getNode(value, value == requestor ? null : this.#mapCb, -1, requestor);
    return node;
  }
  //
  $getNode(requestor, reassignOldNode = true) {
    const node = isPrimitive(this.#valueRef?.value) ? T(this.#valueRef) : getNode(this.#valueRef?.value, requestor == this.#valueRef?.value ? null : this.#mapCb, -1, requestor);
    if (node != null && reassignOldNode) {
      this.#oldNode = node;
    }
    ;
    return node;
  }
  //
  get [$mapped]() {
    return true;
  }
  //
  elementForPotentialParent(requestor) {
    Promise.try(() => {
      const element = this.$getNode(requestor);
      if (!element || !requestor || element?.contains?.(requestor) || requestor == element) {
        return;
      }
      if (requestor instanceof HTMLElement && isValidParent$1(requestor)) {
        if (Array.from(requestor?.children).find((node) => node === element)) {
          this.boundParent = requestor;
        } else {
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              if (record.type === "childList") {
                if (record.addedNodes.length > 0) {
                  const connectedNode = Array.from(record.addedNodes || []).find((node) => node === element);
                  if (connectedNode) {
                    this.boundParent = requestor;
                    observer.disconnect();
                  }
                }
              }
            }
          });
          observer.observe(requestor, { childList: true });
        }
      }
    })?.catch?.(console.warn.bind(console));
    return this.element;
  }
  //
  get self() {
    const existsNode = this.$getNode(this.boundParent) ?? this.#stub;
    const theirParent = isValidParent$1(existsNode?.parentElement) ? existsNode?.parentElement : this.boundParent;
    this.boundParent ??= isValidParent$1(theirParent) ?? this.boundParent;
    queueMicrotask(() => {
      const theirParent2 = isValidParent$1(existsNode?.parentElement) ? existsNode?.parentElement : this.boundParent;
      this.boundParent ??= isValidParent$1(theirParent2) ?? this.boundParent;
    });
    return theirParent ?? this.boundParent ?? existsNode;
  }
  //
  get element() {
    const children = this.$getNode(this.boundParent) ?? this.#stub;
    const theirParent = isValidParent$1(children?.parentElement) ? children?.parentElement : this.boundParent;
    this.boundParent ??= isValidParent$1(theirParent) ?? this.boundParent;
    queueMicrotask(() => {
      const theirParent2 = isValidParent$1(children?.parentElement) ? children?.parentElement : this.boundParent;
      this.boundParent ??= isValidParent$1(theirParent2) ?? this.boundParent;
    });
    return children;
  }
  //
  _onUpdate(newVal, idx, oldVal, op) {
    if (isPrimitive(oldVal) && isPrimitive(newVal)) {
      return;
    }
    let oldEl = isPrimitive(oldVal) ? this.#oldNode : this.$getNodeBy(this.boundParent, oldVal);
    let newEl = this.$getNode(this.boundParent, false) ?? this.#stub;
    if (oldEl && !oldEl?.parentNode || this.#oldNode?.parentNode) {
      oldEl = this.#oldNode ?? oldEl;
    }
    ;
    let updated = this.#updater?.(newEl, indexOf(this.boundParent, oldEl), oldEl, op, this.boundParent);
    if (newEl != null && newEl != this.#oldNode) {
      this.#oldNode = newEl;
    } else if (newEl == null && oldEl != this.#oldNode) {
      this.#oldNode = oldEl;
    }
    ;
    return updated;
  }
}
const isWeakCompatible$1 = (key) => {
  return (typeof key == "object" || typeof key == "function" || typeof key == "symbol") && key != null;
};
const C = (observable, mapCb, boundParent = null) => {
  if (observable instanceof HTMLElement) {
    return Q(observable);
  }
  if (observable == null) return document.createComment(":NULL:");
  const checkable = (typeof mapCb == "function" ? mapCb(observable, -1) : observable) ?? observable;
  if (isPrimitive(checkable)) {
    return T(checkable);
  }
  if (checkable != null && hasValue(checkable)) {
    if (isPrimitive(checkable?.value)) {
      return checkable?.value != null ? T(checkable) : document.createComment(":NULL:");
    } else if (typeof checkable == "object" || typeof checkable == "function") {
      return elMap.getOrInsertComputed(isWeakCompatible$1(observable) ? observable : checkable, () => {
        return new Ch(observable, mapCb, boundParent);
      });
    }
  }
  return getNode(checkable, null, -1, boundParent);
};

const KIDNAP_WITHOUT_HANG = (el, requestor) => {
  return (requestor && requestor != el && !el?.contains?.(requestor) && isValidParent$1(requestor) ? el?.elementForPotentialParent?.(requestor) : null) ?? el?.element;
};
const isElementValue = (el, requestor) => {
  return KIDNAP_WITHOUT_HANG(el, requestor) ?? (hasValue(el) && isElement(el?.value) ? el?.value : el);
};
const elMap = /* @__PURE__ */ new WeakMap();
const tmMap = /* @__PURE__ */ new WeakMap();
const getMapped = (obj) => {
  if (isPrimitive(obj)) return obj;
  if (hasValue(obj) && isPrimitive(obj?.value)) return tmMap?.get(obj);
  return elMap?.get?.(obj);
};
const $promiseResolvedMap = /* @__PURE__ */ new WeakMap();
const $makePromisePlaceholder = (promised, getNodeCb) => {
  if ($promiseResolvedMap?.has?.(promised)) {
    return $promiseResolvedMap?.get?.(promised);
  }
  const comment = document.createComment(":PROMISE:");
  promised?.then?.((elem) => {
    const element = typeof getNodeCb == "function" ? getNodeCb(elem) : elem;
    $promiseResolvedMap?.set?.(promised, element);
    queueMicrotask(() => {
      try {
        if (typeof comment?.replaceWith == "function") {
          if (!comment?.isConnected) return;
          if (isElement(element)) {
            comment?.replaceWith?.(element);
          }
        } else if (comment?.isConnected && isElement(element)) {
          comment?.parentNode?.replaceChild?.(comment, element);
        }
      } catch (error) {
        if (!comment?.isConnected) return;
        comment?.remove?.();
      }
    });
  });
  return comment;
};
const $getBase = (el, mapper, index = -1, requestor) => {
  if (mapper != null) {
    return el = $getBase(mapper?.(el, index), null, -1, requestor);
  }
  if (el instanceof WeakRef || typeof el?.deref == "function") {
    el = el.deref();
  }
  if (el instanceof Promise || typeof el?.then == "function") {
    return $makePromisePlaceholder(el, (nd) => $getBase(nd, mapper, index, requestor));
  }
  ;
  if (isElement(el) && !el?.element) {
    return el;
  } else if (isElement(el?.element)) {
    return el;
  } else if (hasValue(el)) {
    return (el instanceof HTMLElement ? Q : C)(el);
  } else if (typeof el == "object" && el != null) {
    return getMapped(el);
  } else if (typeof el == "function") {
    return $getBase(el?.(), mapper, index, requestor);
  }
  if (isPrimitive(el) && el != null) return T(el);
  return document.createComment(":NULL:");
};
const isValidElement = (el) => {
  return isValidParent$1(el) || el instanceof DocumentFragment || el instanceof Text ? el : null;
};
const $getLeaf = (el, requestor) => {
  return isElementValue(el, requestor) ?? isElement(el);
};
const $getNode = (el, mapper, index = -1, requestor) => {
  if (mapper != null) {
    return el = getNode(mapper?.(el, index), null, -1, requestor);
  }
  if (el instanceof WeakRef || typeof el?.deref == "function") {
    el = el.deref();
  }
  if (el instanceof Promise || typeof el?.then == "function") {
    return $makePromisePlaceholder(el, (nd) => getNode(nd, mapper, index, requestor));
  }
  ;
  if (isElement(el) && !el?.element) {
    return el;
  } else if (isElement(el?.element)) {
    return isElementValue(el, requestor);
  } else if (hasValue(el)) {
    return (el instanceof HTMLElement ? Q : C)(el)?.element;
  } else if (typeof el == "object" && el != null) {
    return getMapped(el);
  } else if (typeof el == "function") {
    return getNode(el?.(), mapper, index, requestor);
  } else if (isPrimitive(el) && el != null) return T(el);
  return document.createComment(":NULL:");
};
const isWeakCompatible = (el) => {
  return (typeof el == "object" || typeof el == "function" || typeof el == "symbol") && el != null;
};
const __nodeGuard = /* @__PURE__ */ new WeakSet();
const __getNode = (el, mapper, index = -1, requestor) => {
  if (el instanceof WeakRef || typeof el?.deref == "function") {
    el = el.deref();
  }
  if (el instanceof Promise || typeof el?.then == "function") {
    return $makePromisePlaceholder(el, (nd) => __getNode(nd, mapper, index, requestor));
  }
  ;
  if (isWeakCompatible(el) && !isElement(el)) {
    if (elMap.has(el)) {
      const obj = getMapped(el) ?? $getBase(el, mapper, index, requestor);
      return $getLeaf(obj instanceof WeakRef ? obj?.deref?.() : obj, requestor);
    }
    ;
    const $node = $getBase(el, mapper, index, requestor);
    if (!mapper && $node != null && $node != el && isWeakCompatible(el) && !isElement(el)) {
      elMap.set(el, $node);
    }
    return $getLeaf($node, requestor);
  }
  return $getNode(el, mapper, index, requestor);
};
const getNode = (el, mapper, index = -1, requestor) => {
  if (isWeakCompatible(el) && __nodeGuard.has(el)) {
    return getMapped(el) ?? isElement(el);
  }
  if (isWeakCompatible(el)) __nodeGuard.add(el);
  const result = __getNode(el, mapper, index, requestor);
  if (isWeakCompatible(el)) __nodeGuard.delete(el);
  return result;
};
const appendOrEmplaceByIndex = (parent, child, index = -1) => {
  if (isElement(child) && child != null && child?.parentNode != parent) {
    if (Number.isInteger(index) && index >= 0 && index < parent?.childNodes?.length) {
      parent?.insertBefore?.(child, parent?.childNodes?.[index]);
    } else {
      parent?.append?.(child);
    }
  }
};
const appendFix = (parent, child, index = -1) => {
  if (!isElement(child) || parent == child || child?.parentNode == parent) return;
  child = child?._onUpdate ? KIDNAP_WITHOUT_HANG(child, parent) : child;
  if (!child?.parentNode && isElement(child)) {
    appendOrEmplaceByIndex(parent, child, index);
    return;
  }
  ;
  if (parent?.parentNode == child?.parentNode) {
    return;
  }
  if (isElement(child)) {
    appendOrEmplaceByIndex(parent, child, index);
  }
  ;
};
const asArray$1 = (children) => {
  if (children instanceof Map || children instanceof Set) {
    children = Array.from(children?.values?.());
  }
  return children;
};
const appendArray = (parent, children, mapper, index = -1) => {
  const len = children?.length ?? 0;
  if (Array.isArray(unwrap(children)) || children instanceof Map || children instanceof Set) {
    const list = asArray$1(children)?.map?.((cl, I) => getNode(cl, mapper, I, parent))?.filter?.((el) => el != null);
    const frag = document.createDocumentFragment();
    list?.forEach?.((cl) => appendFix(frag, cl));
    appendFix(parent, frag, index);
  } else {
    const node = getNode(children, mapper, len, parent);
    if (node != null) {
      appendFix(parent, node, index);
    }
  }
};
const appendChild = (element, cp, mapper, index = -1) => {
  if (mapper != null) {
    cp = mapper?.(cp, index);
  }
  if (cp?.children && Array.isArray(unwrap(cp?.children)) && (cp?.[$virtual] || cp?.[$mapped])) {
    appendArray(element, cp?.children, null, index);
  } else {
    appendArray(element, cp, null, index);
  }
};
const dePhantomNode = (parent, node, index = -1) => {
  if (!parent) return node;
  if (node?.parentNode == parent && node?.parentNode != null) {
    return node;
  } else if (node?.parentNode != parent && !isValidParent$1(node?.parentNode)) {
    if (Number.isInteger(index) && index >= 0 && Array.from(parent?.childNodes || [])?.length > index) {
      return parent.childNodes?.[index];
    }
  }
  return node;
};
const replaceOrSwap = (parent, oldEl, newEl) => {
  if (oldEl?.parentNode) {
    if (oldEl?.parentNode == newEl?.parentNode) {
      parent = oldEl?.parentNode ?? parent;
      if (oldEl.nextSibling === newEl) {
        parent.insertBefore(newEl, oldEl);
      } else if (newEl.nextSibling === oldEl) {
        parent.insertBefore(oldEl, newEl);
      } else {
        const nextSiblingOfElement1 = oldEl.nextSibling;
        parent.replaceChild(newEl, oldEl);
        parent.insertBefore(oldEl, nextSiblingOfElement1);
      }
    } else {
      oldEl?.replaceWith?.(newEl);
    }
  }
};
const replaceChildren = (element, cp, mapper, index = -1, old) => {
  if (mapper != null) {
    cp = mapper?.(cp, index);
  }
  ;
  if (!element) element = old?.parentNode;
  const cn = dePhantomNode(element, getNode(old, mapper, index), index);
  if (cn instanceof Text && typeof cp == "string") {
    cn.textContent = cp;
  } else if (cp != null) {
    const node = getNode(cp);
    if (cn?.parentNode == element && cn != node && (cn instanceof Text && node instanceof Text)) {
      if (cn?.textContent != node?.textContent) {
        cn.textContent = node?.textContent?.trim?.() ?? "";
      }
    } else if (cn?.parentNode == element && cn != node && cn != null && cn?.parentNode != null) {
      replaceOrSwap(element, cn, node);
    } else if (cn?.parentNode != element || cn?.parentNode == null) {
      appendChild(element, node, null, index);
    }
  }
};
const removeChildDirectly = (element, node, _, index = -1) => {
  if (Array.from(element?.childNodes ?? [])?.length < 1) return;
  const whatToRemove = dePhantomNode(element, node, index);
  if (whatToRemove?.parentNode == element) whatToRemove?.remove?.();
  return element;
};
const removeChild = (element, cp, mapper, index = -1) => {
  const $node = getNode(cp, mapper);
  if (!element) element = $node?.parentNode;
  if (Array.from(element?.childNodes ?? [])?.length < 1) return;
  const whatToRemove = dePhantomNode(element, $node, index);
  if (whatToRemove?.parentNode == element) whatToRemove?.remove?.();
  return element;
};
const removeNotExists = (element, children, mapper) => {
  const list = Array.from(unwrap(children) || [])?.map?.((cp, index) => getNode(cp, mapper, index));
  Array.from(element.childNodes).forEach((nd) => {
    if (!list?.find?.((cp) => !isNotEqual?.(cp, nd))) nd?.remove?.();
  });
  return element;
};
const T = (ref) => {
  if (isPrimitive(ref) && ref != null) {
    return document.createTextNode(ref);
  }
  if (ref == null) return document.createComment(":NULL:");
  return tmMap.getOrInsertComputed(ref, () => {
    const element = document.createTextNode(((hasValue(ref) ? ref?.value : ref) ?? "")?.trim?.() ?? "");
    affected([ref, "value"], (val) => {
      const untrimmed = "" + (val?.innerText ?? val?.textContent ?? val?.value ?? val ?? "");
      element.textContent = untrimmed?.trim?.() ?? "";
    });
    return element;
  });
};

const asArray = (children) => {
  if (children instanceof Map || children instanceof Set) {
    children = Array.from(children?.values?.());
  }
  return children;
};
class Mp {
  #observable;
  #fragments;
  #mapCb;
  #reMap;
  #pmMap;
  #updater = null;
  #internal = null;
  #options = {};
  #stub = document.createComment("");
  //
  #indexMap = /* @__PURE__ */ new Map();
  //
  #boundParent = null;
  //
  makeUpdater(basisParent = null) {
    if (basisParent) {
      this.#internal?.();
      this.#internal = null;
      this.#updater = null;
      this.#updater ??= makeUpdater(basisParent, this.mapper.bind(this), Array.isArray(this.#observable));
      this.#internal ??= iterated?.(this.#observable, this._onUpdate.bind(this));
    }
  }
  //
  get boundParent() {
    return this.#boundParent;
  }
  //
  set boundParent(value) {
    if (value instanceof HTMLElement && isValidParent$1(value) && value != this.#boundParent) {
      this.#boundParent = value;
      this.makeUpdater(value);
      const element = this.element;
    }
  }
  //
  constructor(observable, mapCb = (el) => el, options = (
    /*{ removeNotExistsWhenHasPrimitives: true, uniquePrimitives: true, preMap: true } as MappedOptions*/
    null
  )) {
    if (isObservable$1(mapCb) && ((typeof observable == "function" || typeof observable == "object") && !isObservable$1(observable))) {
      [observable, mapCb] = [mapCb, observable];
    }
    if (!options && (mapCb != null && typeof mapCb == "object") && !isObservable$1(mapCb)) {
      options = mapCb;
    }
    this.#stub = document.createComment("");
    this.#reMap = /* @__PURE__ */ new WeakMap();
    this.#pmMap = /* @__PURE__ */ new Map();
    this.#mapCb = (mapCb != null ? typeof mapCb == "function" ? mapCb : typeof mapCb == "object" ? mapCb?.mapper : null : null) ?? ((el) => el);
    this.#observable = (isObservable$1(observable) ? observable : observable?.iterator ?? mapCb?.iterator ?? observable) ?? [];
    this.#fragments = document.createDocumentFragment();
    const $baseOptions = { removeNotExistsWhenHasPrimitives: true, uniquePrimitives: true, preMap: true };
    const $newOptions = (isValidParent$1(options) ? null : options) || {};
    this.#options = Object.assign($baseOptions, $newOptions);
    this.boundParent = isValidParent$1(this.#options?.boundParent) ?? (isValidParent$1(options) ?? null);
    if (!this.boundParent) {
      if (this.#options.preMap) {
        reformChildren(
          this.#fragments,
          this.#observable,
          this.mapper.bind(this)
        );
        if (this.#fragments.childNodes.length === 0) {
          this.#fragments.appendChild(this.#stub);
        }
      }
    }
  }
  //
  get [$mapped]() {
    return true;
  }
  //
  elementForPotentialParent(requestor) {
    Promise.try(() => {
      const element = getNode(this.#observable?.[0], this.mapper.bind(this), 0);
      if (!element || !requestor || element?.contains?.(requestor) || requestor == element) {
        return;
      }
      if (requestor instanceof HTMLElement && isValidParent$1(requestor)) {
        if (Array.from(requestor?.children).find((node) => node === element)) {
          this.boundParent = requestor;
        } else {
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              if (record.type === "childList") {
                if (record.addedNodes.length > 0) {
                  const connectedNode = Array.from(record.addedNodes || []).find((node) => node === element);
                  if (connectedNode) {
                    this.boundParent = requestor;
                    observer.disconnect();
                  }
                }
              }
            }
          });
          observer.observe(requestor, { childList: true });
        }
      }
    })?.catch?.(console.warn.bind(console));
    return this.element;
  }
  //
  get children() {
    return asArray(this.#observable);
  }
  //
  get self() {
    const existsNode = getNode(this.#observable?.[0], this.mapper.bind(this), 0);
    const theirParent = isValidParent$1(existsNode?.parentElement) ? existsNode?.parentElement : this.boundParent;
    this.boundParent ??= isValidParent$1(theirParent) ?? this.boundParent;
    queueMicrotask(() => {
      const theirParent2 = isValidParent$1(existsNode?.parentElement) ? existsNode?.parentElement : this.boundParent;
      this.boundParent ??= isValidParent$1(theirParent2) ?? this.boundParent;
    });
    return theirParent ?? this.boundParent ?? reformChildren(
      this.#fragments,
      this.#observable,
      this.mapper.bind(this)
    );
  }
  //
  get element() {
    const children = this.#fragments?.childNodes?.length > 0 ? this.#fragments : getNode(this.#observable?.[0], this.mapper.bind(this), 0);
    const theirParent = isValidParent$1(children?.parentElement) ? children?.parentElement : this.boundParent;
    this.boundParent ??= isValidParent$1(theirParent) ?? this.boundParent;
    queueMicrotask(() => {
      const theirParent2 = isValidParent$1(children?.parentElement) ? children?.parentElement : this.boundParent;
      this.boundParent ??= isValidParent$1(theirParent2) ?? this.boundParent;
    });
    return children;
  }
  //
  get mapper() {
    return (...args) => {
      if (args?.[0] == null) {
        return null;
      }
      if (args?.[0] instanceof Node) {
        return args?.[0];
      }
      ;
      if (args?.[0] instanceof Promise || typeof args?.[0]?.then == "function") {
        return null;
      }
      ;
      if ((args?.[1] == null || args?.[1] < 0 || (typeof args?.[1] != "number" || !canBeInteger(args?.[1]))) && (Array.isArray(this.#observable) || this.#observable instanceof Set)) {
        return;
      }
      if (args?.[0] != null && (typeof args?.[0] == "object" || typeof args?.[0] == "function" || typeof args?.[0] == "symbol")) {
        return this.#reMap.getOrInsert(args?.[0], this.#mapCb(...args));
      }
      if (args?.[0] != null && this.#observable instanceof Set) {
        return this.#pmMap.getOrInsert(args?.[0], this.#mapCb(...args));
      }
      if (args?.[0] != null && this.#observable instanceof Map) {
        if (typeof args?.[0] == "object" || typeof args?.[0] == "function" || typeof args?.[0] == "symbol") {
          return this.#reMap.getOrInsert(args?.[0], this.#mapCb(...args));
        } else if (typeof args?.[1] == "object" || typeof args?.[1] == "function" || typeof args?.[1] == "symbol") {
          return this.#reMap.getOrInsert(args?.[1], this.#mapCb(...args));
        } else {
          return this.#pmMap.getOrInsert(args?.[1], this.#mapCb(...args));
        }
      }
      if (args?.[0] != null) {
        if (this.#options?.uniquePrimitives && isPrimitive(args?.[0])) {
          return this.#pmMap.getOrInsert(args?.[0], this.#mapCb(...args));
        } else {
          return this.#mapCb(...args);
        }
      }
    };
  }
  //
  _onUpdate(newEl, idx, oldEl, op = "") {
    if (op == "@add" || newEl != null && oldEl == null) {
      if (this.#indexMap.has(idx)) {
        return;
      }
      const indexRef = ref(this.#observable, idx);
      const withElement = C(indexRef, (...args) => {
        if (args?.[1] == null || args?.[1] < 0) {
          args[1] = idx ?? args?.[1];
        }
        ;
        return this.mapper(...args);
      });
      this.#indexMap.set(idx, withElement);
      appendChild(this.boundParent, withElement, null, idx);
    }
    if (op == "@delete" || newEl == null && oldEl != null) {
      const withElement = this.#indexMap.get(idx);
      if (withElement) {
        removeChild(this.boundParent, withElement, null, idx);
      }
      this.#indexMap.delete(idx);
    }
  }
  // generator and iterator
  *[Symbol.iterator]() {
    let i = 0;
    if (this.#observable) {
      for (let el of this.#observable) {
        yield this.mapper(el, i++);
      }
    }
    return;
  }
}
const M = (observable, mapCb, boundParent = null) => {
  return new Mp(observable, mapCb, boundParent);
};

;
const Qp = (ref, host = document.documentElement) => {
  if (ref?.value == null) {
    return Q(ref, host);
  }
  const actual = Q(ref?.value, host);
  affected(ref, (value, prop) => actual?._updateSelector(value));
  return actual;
};
const $createElement = (selector) => {
  if (typeof selector == "string") {
    const nl = Qp(createElementVanilla(selector));
    return nl?.element ?? nl;
  } else if (selector instanceof HTMLElement || selector instanceof Element || selector instanceof DocumentFragment || selector instanceof Document || selector instanceof Node) {
    return selector;
  } else {
    return null;
  }
};
const E = (selector, params = {}, children) => {
  const element = getNode(typeof selector == "string" ? $createElement(selector) : selector, null, -1);
  if (element && children) {
    M(children, (el) => el, element);
  }
  if (element && params) {
    if (params.ctrls != null) reflectControllers(element, params.ctrls);
    if (params.attributes != null) reflectAttributes(element, params.attributes);
    if (params.properties != null) reflectProperties(element, params.properties);
    if (params.classList != null) reflectClassList(element, params.classList);
    if (params.behaviors != null) reflectBehaviors(element, params.behaviors);
    if (params.dataset != null) reflectDataset(element, params.dataset);
    if (params.stores != null) reflectStores(element, params.stores);
    if (params.mixins != null) reflectMixins(element, params.mixins);
    if (params.style != null) reflectStyles(element, params.style);
    if (params.aria != null) reflectARIA(element, params.aria);
    if (params.is != null) bindWith(element, "is", params.is, handleAttribute, params, true);
    if (params.role != null) bindWith(element, "role", params.role, handleProperty, params);
    if (params.slot != null) bindWith(element, "slot", params.slot, handleProperty, params);
    if (params.part != null) bindWith(element, "part", params.part, handleAttribute, params, true);
    if (params.name != null) bindWith(element, "name", params.name, handleAttribute, params, true);
    if (params.type != null) bindWith(element, "type", params.type, handleAttribute, params, true);
    if (params.icon != null) bindWith(element, "icon", params.icon, handleAttribute, params, true);
    if (params.inert != null) bindWith(element, "inert", params.inert, handleAttribute, params, true);
    if (params.hidden != null) bindWith(element, "hidden", params.visible ?? params.hidden, handleHidden, params);
    if (params.on != null) addEventsList(element, params.on);
    if (params.rules != null) params.rules.forEach?.((rule) => reflectWithStyleRules(element, rule));
  }
  ;
  return Q(element);
};

function getIndentColumns(line, tabWidth = 4) {
  let col = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === " ") col += 1;
    else if (ch === "	") col += tabWidth - col % tabWidth;
    else break;
  }
  return col;
}
function stripIndentColumns(line, columns, tabWidth = 4) {
  let col = 0, i = 0;
  while (i < line.length && col < columns) {
    const ch = line[i];
    if (ch === " ") {
      col += 1;
      i++;
    } else if (ch === "	") {
      col += tabWidth - col % tabWidth;
      i++;
    } else break;
  }
  return line.slice(i);
}
function pickEOL(s) {
  if (s.includes("\r\n")) return "\r\n";
  if (s.includes("\r")) return "\r";
  return "\n";
}
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
function detectIndentStep(text, { ignoreFirstLine = true, tabWidth = 4 } = {}) {
  const lines = text.split(/\r\n|\n|\r/);
  const start = ignoreFirstLine ? 1 : 0;
  const indents = [];
  for (let i = start; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.trim() === "") continue;
    indents.push(getIndentColumns(ln, tabWidth));
  }
  if (indents.length === 0) return { min: 0, step: 0, allEven: true, allDiv4: true };
  const min = Math.min(...indents);
  const shifted = indents.map((v) => v - min).filter((v) => v > 0);
  let step = 0;
  for (const v of shifted) step = step ? gcd(step, v) : v;
  const allEven = indents.every((v) => v % 2 === 0);
  const allDiv4 = indents.every((v) => v % 4 === 0);
  if (step === 0) {
    step = allDiv4 ? 4 : allEven ? 2 : 1;
  } else {
    if (step % 4 === 0) step = 4;
    else if (step % 2 === 0) step = 2;
    else step = 1;
  }
  return { min, step, allEven, allDiv4 };
}
function adjustIndentToGrid(line, step, mode = "floor", tabWidth = 4) {
  if (!step || step <= 1) return line;
  const cur = getIndentColumns(line, tabWidth);
  if (cur === 0) return line;
  let target;
  if (mode === "nearest") target = Math.round(cur / step) * step;
  else if (mode === "ceil") target = Math.ceil(cur / step) * step;
  else target = Math.floor(cur / step) * step;
  const delta = cur - target;
  if (delta > 0) {
    return stripIndentColumns(line, delta, tabWidth);
  } else if (delta < 0) {
    return " ".repeat(-delta) + line;
  }
  return line;
}
function normalizeStartTagWhitespace(html, { scope = "void-only" } = {}) {
  if (!html || typeof html !== "string") return html;
  const VOID = /* @__PURE__ */ new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]);
  let out = "";
  let i = 0;
  const n = html.length;
  while (i < n) {
    const ch = html[i];
    if (ch !== "<") {
      out += ch;
      i++;
      continue;
    }
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      if (end === -1) {
        out += html.slice(i);
        break;
      }
      out += html.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (html[i + 1] === "!" || html[i + 1] === "?") {
      const end = html.indexOf(">", i + 2);
      if (end === -1) {
        out += html.slice(i);
        break;
      }
      out += html.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (html[i + 1] === "/") {
      const end = html.indexOf(">", i + 2);
      if (end === -1) {
        out += html.slice(i);
        break;
      }
      out += html.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    let j = i + 1;
    while (j < n && /\s/.test(html[j])) j++;
    const nameStart = j;
    while (j < n && /[A-Za-z0-9:-]/.test(html[j])) j++;
    const tagName = html.slice(nameStart, j).toLowerCase();
    let k = j;
    let quote = null;
    while (k < n) {
      const c = html[k];
      if (quote) {
        if (c === quote) quote = null;
        k++;
      } else {
        if (c === '"' || c === "'") {
          quote = c;
          k++;
        } else if (c === ">") {
          break;
        } else {
          k++;
        }
      }
    }
    if (k >= n) {
      out += html.slice(i);
      break;
    }
    const rawTag = html.slice(i, k + 1);
    const shouldNormalize = scope === "all" || scope === "input-only" && tagName === "input" || scope === "void-only" && VOID.has(tagName);
    if (!shouldNormalize) {
      out += rawTag;
      i = k + 1;
      continue;
    }
    let res = "";
    let q = null;
    let ws = false;
    for (let p = 0; p < rawTag.length; p++) {
      const c = rawTag[p];
      if (q) {
        res += c;
        if (c === q) q = null;
        continue;
      }
      if (c === '"' || c === "'") {
        q = c;
        res += c;
        ws = false;
        continue;
      }
      if (c === "\n" || c === "\r" || c === "	" || c === " ") {
        if (!ws) {
          res += " ";
          ws = true;
        }
        continue;
      }
      res += c;
      ws = false;
    }
    res = res.replace(/\s*(\/?)\s*>$/, "$1>");
    out += res;
    i = k + 1;
  }
  return out;
}
function collapseInterTagWhitespaceSmart(html, { preserveCommentGaps = true } = {}) {
  if (!html || typeof html !== "string") return html;
  if (!preserveCommentGaps) {
    return html.replace(/>\s+</g, "><");
  }
  const SENT = "";
  let s = html;
  s = s.replace(/-->([^\S\r\n]+)<!--/g, `-->${SENT}<!--`).replace(/-->([^\S\r\n]+)</g, `-->${SENT}<`).replace(/>([^\S\r\n]+)<!--/g, `>${SENT}<!--`);
  s = s.replace(/>\s+</g, "><");
  s = s.replace(new RegExp(SENT, "g"), " ");
  return s;
}
function cleanupInterTagWhitespaceAndIndent(html, {
  normalizeIndent = true,
  // убрать общий минимальный отступ
  ignoreFirstLine = true,
  // первую строку не учитываем при детекте
  tabWidth = 4,
  // ширина таба в колонках
  alignStep = "auto",
  // сетка 2n/4n/1n
  quantize = "none"
  // квантизация к сетке
} = {}) {
  if (!html || typeof html !== "string" || html.indexOf("<") === -1) return html;
  html = html?.trim?.();
  const placeholders = [];
  const protectedHtml = html.replace(
    /<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi,
    (m) => {
      const i = placeholders.push(m) - 1;
      return `\0${i}\0`;
    }
  );
  const eol = pickEOL(protectedHtml);
  const lines = protectedHtml.split(/\r\n|\n|\r/);
  const start = ignoreFirstLine ? 1 : 0;
  const { min, step: autoStep } = detectIndentStep(protectedHtml, { ignoreFirstLine, tabWidth });
  if (normalizeIndent && min > 0) {
    for (let i = start; i < lines.length; i++) {
      const ln = lines[i];
      if (ln.trim() === "") continue;
      lines[i] = stripIndentColumns(ln, min, tabWidth);
    }
  }
  let step = alignStep === "auto" ? autoStep : alignStep;
  if (quantize !== "none" && step > 1) {
    for (let i = start; i < lines.length; i++) {
      const ln = lines[i];
      if (ln.trim() === "") continue;
      lines[i] = adjustIndentToGrid(ln, step, quantize, tabWidth);
    }
  }
  let working = lines.join(eol);
  working = normalizeStartTagWhitespace(working, { scope: "void-only" });
  working = collapseInterTagWhitespaceSmart(working);
  const cleaned = working.replace(/\u0000(\d+)\u0000/g, (_, i) => placeholders[+i]);
  return cleaned?.trim?.();
}
function checkInsideTagBlock(contextParts, ...str) {
  const current = str?.[0] ?? "";
  const idx = contextParts.indexOf(current);
  if (idx < 0) {
    const tail = str?.join?.("") ?? "";
    return /<([A-Za-z\/!?])[\w\W]*$/.test(tail) && !/>[\w\W]*$/.test(tail);
  }
  const prefix = contextParts.slice(0, idx + 1).join("");
  let inTag = false, inSingle = false, inDouble = false;
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];
    const next = prefix[i + 1] ?? "";
    if (!inTag) {
      if (ch === "<") {
        if (/[A-Za-z\/!?]/.test(next)) {
          inTag = true;
          inSingle = false;
          inDouble = false;
        }
      }
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === '"') {
        inDouble = true;
        continue;
      }
      if (ch === "'") {
        inSingle = true;
        continue;
      }
      if (ch === ">") {
        inTag = false;
        continue;
      }
    } else if (inDouble) {
      if (ch === '"') {
        inDouble = false;
        continue;
      }
    } else if (inSingle) {
      if (ch === "'") {
        inSingle = false;
        continue;
      }
    }
  }
  return inTag;
}

const EMap = /* @__PURE__ */ new WeakMap(), parseTag = (str) => {
  const match = str.match(/^([a-zA-Z0-9\-]+)?(?:#([a-zA-Z0-9\-_]+))?((?:\.[a-zA-Z0-9\-_]+)*)$/);
  if (!match) return { tag: str, id: null, className: null };
  const [, tag = "div", id, classStr] = match;
  const className = classStr ? classStr.replace(/\./g, " ").trim() : null;
  return { tag, id, className };
};
const preserveWhitespaceTags = /* @__PURE__ */ new Set(["PRE", "TEXTAREA", "SCRIPT", "STYLE"]);
const parseIndex = (value) => {
  if (typeof value != "string" || !value?.trim?.()) return -1;
  const match = value.match(/^#{(\d+)}$/);
  return match ? parseInt(match?.[1] ?? "-1") : -1;
};
const connectElement = (el, atb, psh, mapped) => {
  if (!el) return el;
  if (el != null) {
    const entriesIdc = [];
    const addEntryIfExists = (name) => {
      const attr = Array.from(el?.attributes || []).find((attr2) => attr2.name == name && attr2.value?.includes?.("#{"));
      if (attr) {
        const pair = [name, parseIndex(attr?.value) ?? -1];
        entriesIdc.push(pair);
        return pair;
      }
      return [name, -1];
    };
    const specialEntryNames = ["dataset", "style", "classList", "visible", "aria", "value", "ref"];
    specialEntryNames.forEach((name) => addEntryIfExists(name));
    const makeEntries = (startsWith, except) => {
      const entries = [];
      for (const attr of Array.from(el?.attributes || [])) {
        const allowedNoPrefix = Array.isArray(startsWith) ? startsWith?.some?.((str) => str == "") : startsWith == "";
        const prefix = (Array.isArray(startsWith) ? startsWith.find((start) => attr.name?.startsWith?.(start)) : startsWith = attr.name?.startsWith?.(startsWith) ? startsWith : "") ?? "";
        const trueAttributeName = attr.name.trim()?.replace?.(prefix, "");
        const isPlaceholder = attr.value?.includes?.("#{") && attr.value?.includes?.("}");
        const atbIndex = parseIndex(attr?.value);
        const excepted = Array.isArray(except) ? except?.some?.((str) => trueAttributeName?.startsWith?.(str)) : except == trueAttributeName;
        if (isPlaceholder && (prefix == "" && allowedNoPrefix || prefix != "") && atbIndex >= 0 && !excepted) {
          entries.push([trueAttributeName, atbIndex]);
        }
      }
      return entries;
    };
    const makeCumulativeEntries = (startsWith, except, specific = "") => {
      const entriesMap = /* @__PURE__ */ new Map();
      for (const attr of Array.from(el?.attributes || [])) {
        const allowedNoPrefix = Array.isArray(startsWith) ? startsWith?.some?.((str) => str == "") : startsWith == "";
        const prefix = (Array.isArray(startsWith) ? startsWith.find((start) => attr.name?.startsWith?.(start)) : startsWith = attr.name?.startsWith?.(startsWith) ? startsWith : "") ?? "";
        const trueAttributeName = attr.name.trim()?.replace?.(prefix, "");
        const isPlaceholder = attr.value?.includes?.("#{") && attr.value?.includes?.("}");
        const atbIndex = parseIndex(attr?.value) ?? -1;
        const excepted = Array.isArray(except) ? except?.some?.((str) => trueAttributeName?.startsWith?.(str)) : except == trueAttributeName;
        const isSpecific = (Array.isArray(specific) ? specific?.some?.((str) => attr.name === str) : attr.name === specific) && specific !== "";
        if (isPlaceholder && (prefix == "" && allowedNoPrefix || prefix != "" || isSpecific) && atbIndex >= 0 && !excepted) {
          const key = isSpecific ? attr.name : trueAttributeName;
          if (!entriesMap.has(key)) {
            entriesMap.set(key, []);
          }
          entriesMap.get(key)?.push(atbIndex);
        }
      }
      return Array.from(entriesMap.entries());
    };
    let attributesEntries = makeEntries(["attr:", ""], ["ref"]);
    let propertiesEntries = makeEntries(["prop:"], []);
    let onEntries = makeCumulativeEntries(["on:", "@"], [], "");
    let refEntries = makeCumulativeEntries(["ref:"], [], ["ref"]);
    const bindings = Object.fromEntries(entriesIdc?.filter?.((pair) => pair[1] >= 0)?.map?.((pair) => [pair[0], atb?.[pair[1]] ?? null]) ?? []);
    bindings.attributes = Object.fromEntries(attributesEntries?.filter?.((pair) => pair[1] >= 0)?.map?.((pair) => [pair[0], atb?.[pair[1]] ?? null]) ?? []);
    bindings.properties = Object.fromEntries(propertiesEntries?.filter?.((pair) => pair[1] >= 0)?.map?.((pair) => [pair[0], atb?.[pair[1]] ?? null]) ?? []);
    bindings.on = Object.fromEntries(onEntries?.filter?.((pair) => pair[1]?.some?.((idx) => idx >= 0))?.map?.((pair) => [pair[0], pair[1]?.map?.((idx) => atb?.[idx]).filter((v) => v != null)]) ?? []);
    const refIndex = entriesIdc?.find?.((pair) => pair[0] == "ref" && pair[1] >= 0)?.[1];
    if (refIndex != null && refIndex >= 0) {
      const ref = atb?.[refIndex];
      if (typeof ref == "function") {
        ref?.(el);
      } else if (ref != null && typeof ref == "object") {
        ref.value = el;
      }
    }
    refEntries?.forEach?.((pair) => {
      const handlers = pair?.[1]?.filter?.((idx) => idx != null && idx >= 0)?.map?.((idx) => atb?.[idx])?.filter?.((v) => v != null);
      handlers?.forEach?.((ref) => {
        if (typeof ref == "function") {
          ref?.(el);
        } else if (ref != null && typeof ref == "object") {
          ref.value = el;
        }
      });
    });
    const clearPlaceholdersFromAttributesOfElement = (el2) => {
      if (el2 == null) return;
      const attributeIsInRegistry = (name) => {
        return attributesEntries?.some?.((pair) => pair[0] == name) || name?.startsWith?.("ref:") || name == "ref";
      };
      for (const attr of Array.from(el2?.attributes || [])) {
        if (
          // relaxed syntax for placeholder, if in registry
          attr.value?.includes?.("#{") && attr.value?.includes?.("}") && attributeIsInRegistry(attr.name) || // stricter check of placeholder, if none in registry
          attr.value?.startsWith?.("#{") && attr.value?.endsWith?.("}") || // if attribute name contains colon, it is a property
          attr.name?.includes?.(":") || attr.name?.includes?.("ref:") || attr.name == "ref"
        ) {
          el2?.removeAttribute?.(attr.name);
        }
      }
      ;
    };
    clearPlaceholdersFromAttributesOfElement(el);
    if (!EMap?.has?.(el)) {
      EMap?.set?.(el, E(el, bindings));
    }
    ;
  }
  ;
  return EMap?.get?.(el) ?? el;
};
const linearBuilder = (strings, ...values) => {
  const nodes = [];
  for (let i = 0; i < strings?.length; i++) {
    const str = strings?.[i];
    const val = values?.[i];
    nodes.push(H(str));
    nodes.push(val);
  }
  if (nodes?.length <= 1) return getNode(nodes?.[0], null, 0);
  const fragment = document.createDocumentFragment();
  fragment.append(...nodes?.filter?.((nd) => nd != null)?.map?.((en, i) => getNode(en, null, i))?.filter?.((nd) => nd != null));
  return fragment;
};
function html(strings, ...values) {
  if (strings?.at?.(0)?.trim?.()?.startsWith?.("<") && strings?.at?.(-1)?.trim?.()?.endsWith?.(">")) {
    return htmlBuilder({ createElement: null })(strings, ...values);
  }
  return linearBuilder(strings, ...values);
}
;
const isValidParent = (parent) => {
  return parent != null && parent instanceof HTMLElement && !(parent instanceof DocumentFragment || parent instanceof HTMLBodyElement && parent != document.body);
};
const replaceNode = (parent, node, el) => {
  if (el != null) {
    el.boundParent = parent;
  }
  let newNode = getNode(el, null, -1, parent);
  if (isElement(newNode)) {
    if (newNode?.parentNode != parent && !newNode?.contains?.(parent) && newNode != null) {
      node?.replaceWith?.(hasValue(newNode) && (typeof newNode?.value == "object" || typeof newNode?.value == "function") && isElement(newNode?.value) ? newNode?.value : newNode);
    }
  } else {
    node?.remove?.();
  }
};
function htmlBuilder({ createElement = null } = {}) {
  return function(strings, ...values) {
    let parts = [];
    const psh = [], atb = [];
    for (let i = 0; i < strings.length; i++) {
      parts.push(strings?.[i] || "");
      if (i < values.length) {
        if (strings[i]?.trim()?.endsWith?.("<")) {
          const dat = parseTag(values?.[i]);
          parts.push(dat.tag || "div");
          if (dat.id) parts.push(` id="${dat.id}"`);
          if (dat.className) parts.push(` class="${dat.className}"`);
        } else {
          const $inTagOpen = checkInsideTagBlock(strings, strings?.[i] || "", strings?.[i + 1] || "");
          const $afterEquals = /[\w:\-\.\]]\s*=\s*$/.test(strings[i]?.trim?.() ?? "") || strings[i]?.trim?.()?.endsWith?.("=");
          const $isQuoteBegin = strings[i]?.trim?.()?.match?.(/['"]$/);
          const $isQuoteEnd = strings[i + 1]?.trim?.()?.match?.(/^['"]/) ?? $isQuoteBegin;
          const $betweenQuotes = $isQuoteBegin && $isQuoteEnd;
          const $attributePattern = $afterEquals;
          const isAttr = ($attributePattern || $betweenQuotes) && $inTagOpen;
          if (isAttr) {
            const $needsToQuoteWrap = $attributePattern && !$betweenQuotes;
            const ati = atb.length;
            parts.push((typeof values?.[i] == "string" ? values?.[i]?.trim?.() != "" : values?.[i] != null) ? $needsToQuoteWrap ? `"#{${ati}}"` : `#{${ati}}` : "");
            atb.push(values?.[i]);
          } else if (!$inTagOpen) {
            const psi = psh.length;
            parts.push((typeof values?.[i] == "string" ? values?.[i]?.trim?.() != "" : values?.[i] != null) ? isPrimitive(values?.[i]) ? String(values?.[i])?.trim?.() : `<!--o:${psi}-->` : "");
            psh.push(values?.[i]);
          }
        }
      }
    }
    const sourceCode = cleanupInterTagWhitespaceAndIndent(parts.join("").trim());
    const mapped = /* @__PURE__ */ new WeakMap(), parser = new DOMParser(), doc = parser.parseFromString(sourceCode, "text/html");
    const isTemplate = doc instanceof HTMLTemplateElement || doc?.matches?.("template");
    const sources = (isTemplate ? doc : doc.querySelector("template"))?.content ?? (doc.body ?? doc);
    const frag = document.createDocumentFragment();
    const bucket = Array.from(sources.childNodes)?.filter((e) => {
      return e instanceof Node;
    }).map((node) => {
      if (!isValidParent(node?.parentNode) && node?.parentNode != frag) {
        node?.remove?.();
        if (node != null) {
          frag?.append?.(node);
        }
        ;
      }
      return node;
    });
    let walkedNodes = [];
    bucket.forEach((nodeSet) => {
      const walker = nodeSet ? document.createTreeWalker(nodeSet, NodeFilter.SHOW_ALL, null) : null;
      do {
        const node = walker?.currentNode;
        walkedNodes.push(node);
      } while (walker?.nextNode?.());
    });
    walkedNodes?.filter?.((node) => node?.nodeType == Node.COMMENT_NODE)?.forEach?.((node) => {
      if (node?.nodeValue?.trim?.()?.includes?.("o:") && Number.isInteger(parseInt(node?.nodeValue?.trim?.()?.slice?.(2) ?? "-1"))) {
        let el = psh?.[parseInt(node?.nodeValue?.trim?.()?.slice?.(2) ?? "-1") ?? -1];
        if (el == null || el === void 0 || (typeof el == "string" ? el : null)?.trim?.() == "") {
          node?.remove?.();
        } else {
          const $parent = node?.parentNode;
          if (Array.isArray(el) || el instanceof Map || el instanceof Set) {
            replaceNode?.($parent, node, el = M(el, null, $parent));
          } else if (el != null) {
            replaceNode?.($parent, node, el);
          }
        }
      }
      if (node?.isConnected) {
        node?.remove?.();
      }
    });
    walkedNodes?.filter((node) => node.nodeType == Node.ELEMENT_NODE)?.map?.((node) => {
      connectElement(node, atb, psh, mapped);
    });
    return Array.from(frag?.childNodes)?.length > 1 ? frag : frag?.childNodes?.[0];
  };
}
const H = (str, ...values) => {
  if (typeof str == "string") {
    if (str?.trim?.()?.startsWith?.("<") && str?.trim?.()?.endsWith?.(">")) {
      const parser = new DOMParser(), doc = parser.parseFromString(cleanupInterTagWhitespaceAndIndent(str?.trim?.()), "text/html");
      const basis = doc.querySelector("template")?.content ?? doc.body;
      if (basis instanceof HTMLBodyElement) {
        const frag = document.createDocumentFragment();
        frag.append(...Array.from(basis.childNodes ?? []));
        return Array.from(frag.childNodes)?.length > 1 ? frag : frag?.childNodes?.[0];
      }
      if (basis instanceof DocumentFragment) {
        return basis;
      }
      if (basis?.childNodes?.length > 1) {
        const frag = document.createDocumentFragment();
        frag.append(...Array.from(basis?.childNodes ?? []));
        return frag;
      }
      return basis?.childNodes?.[0] ?? new Text(str);
    }
    return new Text(str);
  } else if (typeof str == "function") {
    return H(str?.());
  } else if (Array.isArray(str) && values) {
    return html(str, ...values);
  } else if (str instanceof Node) {
    return str;
  }
  ;
  return getNode(str);
};

const $getFromMapped = (mapped, value) => {
  if (typeof value == "number" && value < 0 || typeof value == "string" && !value || value == null) return { element: "" };
  if (mapped instanceof Map || typeof mapped?.get == "function") {
    return mapped.get(value);
  }
  if (mapped instanceof Set || typeof mapped?.has == "function") {
    return mapped.has(value) ? value : null;
  }
  return mapped?.[value] ?? { element: "" };
};
const getFromMapped = (mapped, value, requestor = null) => {
  return getNode($getFromMapped(mapped, value), null, -1, requestor);
};
class SwM {
  #stub = document.createComment("");
  current;
  mapped;
  boundParent = null;
  //
  constructor(params, mapped) {
    this.#stub = document.createComment("");
    this.current = params?.current ?? { value: -1 };
    this.mapped = params?.mapped ?? mapped ?? [];
    const us = affected([params?.current, "value"], (newVal, prop, oldVal) => this._onUpdate(newVal, prop, oldVal));
    if (us) addToCallChain(this, Symbol.dispose, us);
  }
  //
  get element() {
    const element = getFromMapped(this.mapped, this.current?.value ?? -1, this.boundParent) ?? this.#stub;
    const theirParent = isValidParent$1(element?.parentElement) ? element?.parentElement : this.boundParent;
    this.boundParent ??= isValidParent$1(theirParent) ?? this.boundParent;
    if (element != null && (element?.parentNode != this.boundParent || !element?.parentNode)) {
      if (this.boundParent) {
        appendFix(this.boundParent, element);
      }
      ;
    }
    queueMicrotask(() => {
      const theirParent2 = isValidParent$1(element?.parentElement) ? element?.parentElement : this.boundParent;
      this.boundParent ??= isValidParent$1(theirParent2) ?? this.boundParent;
    });
    return element;
  }
  //
  elementForPotentialParent(requestor) {
    if (isValidParent$1(requestor)) {
      this.boundParent = requestor;
    }
    this.current?.[$trigger]?.();
    return this.element;
  }
  //
  _onUpdate(newVal, prop, oldVal) {
    const idx = newVal ?? this.current?.value;
    if (oldVal ? isNotEqual(
      idx,
      oldVal
      /*this.current?.value*/
    ) : true) {
      const old = oldVal ?? this.current?.value;
      if (this.current) this.current.value = idx ?? -1;
      const parent = getFromMapped(this.mapped, old ?? idx ?? -1)?.parentNode ?? this.boundParent;
      this.boundParent = parent ?? this.boundParent;
      const newNode = getFromMapped(this.mapped, idx ?? -1, parent) ?? this.#stub;
      const oldNode = getFromMapped(this.mapped, old ?? -1, parent);
      if (isElement(parent)) {
        if (isElement(newNode)) {
          if (isElement(oldNode)) {
            try {
              replaceOrSwap(parent, oldNode, newNode);
            } catch (e) {
              console.warn(e);
            }
          } else {
            appendFix(parent, newNode);
          }
        } else if (oldNode && !newNode) {
          removeChild(parent, oldNode);
        }
      }
    }
  }
}
class SwHandler {
  constructor() {
  }
  //
  set(params, name, val) {
    return Reflect.set(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, name, val);
  }
  has(params, name) {
    return Reflect.has(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, name);
  }
  get(params, name, ctx) {
    if (name == "elementForPotentialParent" && (name in params || params?.[name] != null)) {
      return params?.elementForPotentialParent?.bind(params);
    }
    ;
    if (name == "element" && (name in params || params?.[name] != null)) {
      return params?.element;
    }
    ;
    if (name == "_onUpdate" && (name in params || params?.[name] != null)) {
      return params?._onUpdate?.bind(params);
    }
    ;
    return contextify(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, name);
  }
  //
  ownKeys(params) {
    return Reflect.ownKeys(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params);
  }
  apply(params, thisArg, args) {
    return Reflect.apply(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, thisArg, args);
  }
  deleteProperty(params, name) {
    return Reflect.deleteProperty(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, name);
  }
  setPrototypeOf(params, proto) {
    return Reflect.setPrototypeOf(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, proto);
  }
  getPrototypeOf(params) {
    return Reflect.getPrototypeOf(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params);
  }
  defineProperty(params, name, desc) {
    return Reflect.defineProperty(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, name, desc);
  }
  getOwnPropertyDescriptor(params, name) {
    return Reflect.getOwnPropertyDescriptor(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params, name);
  }
  preventExtensions(params) {
    return Reflect.preventExtensions(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params);
  }
  isExtensible(params) {
    return Reflect.isExtensible(getFromMapped(params?.mapped, params?.current?.value ?? -1) ?? params);
  }
}
const I = (params, mapped) => {
  return inProxy?.getOrInsertComputed?.(params, () => {
    const px = new Proxy(params instanceof SwM ? params : new SwM(params, mapped), new SwHandler());
    return px;
  });
};

const createElement = (type, props = {}, children, ...others) => {
  let normalized = {}, ref;
  let attributes = {}, properties = {}, classList = {}, style = {}, ctrls = {}, on = {};
  for (const i in props) {
    if (i == "ref") {
      if (typeof type != "function") {
        ref = typeof props[i] != "function" ? props[i] : Q(props[i]);
      }
    } else if (i == "classList") {
      classList = props[i];
    } else if (i == "style") {
      style = props[i];
    } else if (i?.startsWith?.("@")) {
      const name = i.replace("@", "").trim();
      if (name) {
        bindEvent(on, name, props[i]);
      } else {
        on = props[i];
      }
    } else if (i?.startsWith?.("on:")) {
      const name = i.replace("on:", "").trim();
      if (name) {
        bindEvent(on, name, props[i]);
      } else {
        on = props[i];
      }
    } else if (i?.startsWith?.("prop:")) {
      const name = i.replace("prop:", "").trim();
      if (name) {
        properties[name] = props[i];
      } else {
        properties = props[i];
      }
    } else if (i?.startsWith?.("attr:")) {
      const name = i.replace("attr:", "").trim();
      if (name) {
        attributes[name] = props[i];
      } else {
        attributes = props[i];
      }
    } else if (i?.startsWith?.("ctrl:")) {
      const name = i.replace("ctrl:", "").trim();
      if (name) {
        ctrls.set(name, props[i]);
      } else {
        ctrls = props[i];
      }
    } else {
      attributes[i.trim()] = props[i];
    }
  }
  ;
  Object.assign(normalized, {
    attributes,
    properties,
    classList,
    style,
    on
  });
  const $children = Array.isArray(children) ? children : others?.length > 0 ? [children, ...others] : (typeof children == "object" || typeof children == "function") && !(children instanceof Node) || children instanceof DocumentFragment ? children : [children];
  if (typeof type == "function") {
    return type(props, $children);
  }
  if (type == "For") {
    return M(props, $children);
  }
  if (type == "Switch") {
    return I(props, $children);
  }
  const element = E(type, normalized, $children);
  if (!element) return element;
  Promise.try(() => {
    if (ref) {
      if (typeof ref == "function") {
        ref?.(element);
      } else {
        ref.value = element;
      }
    }
  })?.catch?.(console.warn.bind(console));
  return element;
};

const checkboxCtrl = (ref) => {
  ref = toRef$1(ref);
  return (ev) => {
    const $ref = unref(ref);
    if ($ref != null) {
      $ref.value = Q(`input[type="radio"], input[type="checkbox"], input:checked`, ev?.target)?.checked ?? $ref?.value;
    }
  };
};
const numberCtrl = (ref) => {
  ref = toRef$1(ref);
  return (ev) => {
    const $ref = unref(ref);
    if ($ref != null && isNotEqual($ref?.value, ev?.target?.valueAsNumber)) {
      $ref.value = Number(Q("input", ev?.target)?.valueAsNumber || 0) ?? 0;
    }
  };
};
const valueCtrl = (ref) => {
  ref = toRef$1(ref);
  return (ev) => {
    const $ref = unref(ref);
    if ($ref != null && isNotEqual(ev?.target?.value, $ref?.value)) {
      $ref.value = (Q("input", ev?.target)?.value ?? $ref?.value) || "";
    }
  };
};
const radioCtrl = (ref, name) => {
  ref = toRef$1(ref);
  return (ev) => {
    let $ref = unref(ref);
    const selector = `input[name="${name}"]:checked`;
    if ($ref) {
      $ref.value = (ev?.target?.matches?.(selector) ? ev?.target : ev?.target?.querySelector?.(selector))?.value ?? $ref.value;
    }
  };
};
const controlVisible = (source, coef = null) => {
  if (!source) return;
  const target = toRef$1(source), wk = toRef$1(coef);
  const renderCb = () => {
    const tg = deref$1(target);
    if (tg) {
      const val = deref$1(wk)?.value || 0, hidden = val < 1e-3 || val > 0.999;
      setProperty(tg, "visibility", hidden ? "collapse" : "visible");
      setProperty(tg?.querySelector?.("*"), "pointer-events", hidden ? "none" : "auto");
    }
  };
  return affected(coef, (val) => makeRAFCycle()?.schedule(renderCb));
};

const STATE_KEY = "rs-nav-ctx";
const STACK_KEY = "rs-nav-stack";
const historyState = observe({
  index: 0,
  length: 0,
  action: "MANUAL",
  view: "",
  canBack: false,
  canForward: false,
  entries: []
});
const getCurrentState = () => {
  try {
    return history.state?.[STATE_KEY] || historyState?.entries?.[historyState?.index] || {};
  } catch (e) {
    return {};
  }
};
const saveStack = () => {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(historyState?.entries));
  } catch (e) {
  }
};
const loadStack = () => {
  try {
    const stored = sessionStorage.getItem(STACK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};
const mergeState = (newState, existingData) => {
  try {
    const current = existingData !== void 0 ? existingData : history?.state || {};
    if (isPrimitive(current) && current !== null) return { value: current, [STATE_KEY]: newState };
    if (current === null) return { [STATE_KEY]: newState };
    return { ...current, [STATE_KEY]: newState };
  } catch (e) {
    return { [STATE_KEY]: newState };
  }
};
let initialized$1 = false;
const originalPush = typeof history != "undefined" ? history.pushState.bind(history) : void 0;
const originalReplace = typeof history != "undefined" ? history.replaceState.bind(history) : void 0;
const originalGo = typeof history != "undefined" ? history.go.bind(history) : void 0;
const originalForward = typeof history != "undefined" ? history.forward.bind(history) : void 0;
const originalBack = typeof history != "undefined" ? history.back.bind(history) : void 0;
const initHistory = (initialView = "") => {
  if (initialized$1) return;
  initialized$1 = true;
  const current = getCurrentState();
  const view = initialView || location.hash || "#";
  let stack = loadStack();
  const idx = current.index || 0;
  if (stack && (stack?.length === 0 || idx >= stack?.length)) {
    if (stack.length <= idx) {
      stack[idx] = {
        index: idx,
        depth: history.length,
        action: current?.action || "REPLACE",
        view,
        timestamp: Date.now()
      };
    }
  }
  historyState.entries = stack;
  if (!current.timestamp) {
    const state = {
      index: idx,
      depth: history.length,
      action: "REPLACE",
      view,
      timestamp: Date.now()
    };
    history?.replaceState?.(mergeState(state), "", location.hash);
    if (historyState?.entries) {
      historyState.entries[idx] = state;
    }
    saveStack();
  } else {
    historyState.index = current.index || 0;
    historyState.view = current.view || view;
    if (!historyState?.entries?.[historyState?.index]) {
      historyState.entries[historyState.index] = current;
      saveStack();
    }
  }
  updateReactiveState(getCurrentState()?.action || "REPLACE", view);
  history.go = (delta = 0) => {
    const currentState = getCurrentState();
    currentState.index = Math.max(0, Math.min(historyState.length, (currentState.index || 0) + delta));
    const existsState = historyState.entries[currentState.index];
    Object.assign(currentState, existsState || {});
    setIgnoreNextPopState(true);
    const result = originalGo?.(delta);
    setTimeout(() => {
      setIgnoreNextPopState(false);
    }, 0);
    updateReactiveState(currentState?.action || "POP", currentState?.view);
    return result;
  };
  history.back = () => {
    return history.go(-1);
  };
  history.forward = () => {
    return history.go(1);
  };
  history.pushState = (data, unused, url) => {
    const currentState = getCurrentState();
    const nextIndex = (currentState.index || 0) + 1;
    const newState = {
      index: nextIndex,
      depth: history.length + 1,
      action: "PUSH",
      view: url ? String(url) : currentState.view || "",
      timestamp: Date.now()
    };
    const result = originalPush?.(mergeState(newState, data), unused, url);
    historyState.entries = historyState?.entries?.slice?.(0, nextIndex);
    historyState.entries?.push?.(newState);
    saveStack();
    updateReactiveState("PUSH", newState.view);
    return result;
  };
  history.replaceState = (data, unused, url) => {
    const currentState = getCurrentState();
    const index = currentState?.index || 0;
    const newState = {
      ...currentState,
      index,
      depth: history.length,
      action: "REPLACE",
      view: url ? String(url) : currentState?.view || "",
      timestamp: Date.now()
    };
    const result = originalReplace?.(mergeState(newState, data), unused, url);
    if (historyState?.entries) {
      historyState.entries[index] = newState;
      historyState.entries[historyState.index].view = url ? String(url) : currentState?.view || "";
    }
    saveStack();
    updateReactiveState("REPLACE", newState.view);
    return result;
  };
  addEvent(window, "popstate", (ev) => {
    const state = ev.state?.[STATE_KEY];
    const currentIndex = historyState.index ?? 0;
    if (!state) {
      const newState = {
        index: currentIndex + 1,
        depth: history.length,
        action: "PUSH",
        view: location.hash || "#",
        timestamp: Date.now()
      };
      history.replaceState(mergeState(newState, ev.state), "", location.hash);
      historyState.entries = historyState?.entries?.slice?.(0, newState.index);
      historyState?.entries?.push?.(newState);
      saveStack();
      updateReactiveState("PUSH", newState.view);
      return;
    } else {
      const newIndex = state?.index ?? 0;
      let action = "POP";
      if (newIndex < currentIndex) {
        action = "BACK";
      } else if (newIndex > currentIndex) {
        action = "FORWARD";
      }
      updateReactiveState(action, state?.view || location.hash);
    }
  });
  addEvent(window, "hashchange", (ev) => {
    if (getIgnoreNextPopState()) return;
    const currentHash = location.hash || "#";
    if (historyState.view !== currentHash) {
      updateReactiveState("PUSH", currentHash);
    }
  });
};
const updateReactiveState = (action, view) => {
  const current = getCurrentState();
  historyState.index = current.index || 0;
  historyState.length = history.length;
  historyState.action = action || "POP";
  historyState.view = view || current.view || location.hash;
  historyState.canBack = historyState.index > 0;
};
const navigate = (view, replace = false) => {
  const hash2 = view.startsWith("#") ? view : `#${view}`;
  if (replace && historyState?.index > 0) {
    const prev = historyState?.entries?.[historyState?.index - 1];
    if (prev && prev.view === hash2) {
      history.back();
      return;
    }
  }
  if (replace) {
    if (historyState?.entries?.[historyState.index]?.view !== hash2 || historyState?.entries?.[historyState.index]?.view) {
      history?.replaceState?.(null, "", hash2);
    }
  } else {
    history?.pushState?.(null, "", hash2);
  }
};
const historyViewRef = (initialValue = `#${location.hash?.replace?.(/^#/, "") || "home"}`, options = {}) => {
  const internal = observe({ value: initialValue });
  let isUpdatingFromHistory = false;
  let isUpdatingFromInternal = false;
  affected([historyState, "view"], (view) => {
    if (isUpdatingFromInternal) return;
    if (options.ignoreBack && historyState.action === "BACK") {
      return;
    }
    let nextValue = view;
    if (options.withoutHashPrefix) {
      nextValue = view.replace(/^#/, "");
    }
    if (internal.value !== nextValue) {
      isUpdatingFromHistory = true;
      internal.value = nextValue;
      isUpdatingFromHistory = false;
    }
  });
  affected([internal, "value"], (val) => {
    if (isUpdatingFromHistory) return;
    let viewToNavigate = val;
    if (options.withoutHashPrefix && !val.startsWith("#")) {
      viewToNavigate = `#${val}`;
    }
    if (historyState.view !== viewToNavigate) {
      isUpdatingFromInternal = true;
      navigate(viewToNavigate);
      isUpdatingFromInternal = false;
    }
  });
  return internal;
};

var ClosePriority = /* @__PURE__ */ ((ClosePriority2) => {
  ClosePriority2[ClosePriority2["CONTEXT_MENU"] = 100] = "CONTEXT_MENU";
  ClosePriority2[ClosePriority2["DROPDOWN"] = 90] = "DROPDOWN";
  ClosePriority2[ClosePriority2["MODAL"] = 80] = "MODAL";
  ClosePriority2[ClosePriority2["DIALOG"] = 70] = "DIALOG";
  ClosePriority2[ClosePriority2["SIDEBAR"] = 60] = "SIDEBAR";
  ClosePriority2[ClosePriority2["OVERLAY"] = 50] = "OVERLAY";
  ClosePriority2[ClosePriority2["PANEL"] = 40] = "PANEL";
  ClosePriority2[ClosePriority2["TOAST"] = 30] = "TOAST";
  ClosePriority2[ClosePriority2["TASK"] = 20] = "TASK";
  ClosePriority2[ClosePriority2["VIEW"] = 10] = "VIEW";
  ClosePriority2[ClosePriority2["DEFAULT"] = 0] = "DEFAULT";
  return ClosePriority2;
})(ClosePriority || {});
const registry = /* @__PURE__ */ new Map();
let navigationInitialized = false;
let processingBack = false;
let historyDepth = 0;
let options = {};
let ignoreNextPopState = false;
const setIgnoreNextPopState = (value) => {
  ignoreNextPopState = value;
};
const getIgnoreNextPopState = () => ignoreNextPopState;
const generateId = () => `closeable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const registerCloseable = (entry) => {
  const id = entry.id || generateId();
  const fullEntry = Object.assign(entry, { id });
  if (fullEntry?.hashId == null) {
    fullEntry.hashId = id;
  }
  registry.set(id, fullEntry);
  if (options.debug) {
    console.log("[BackNav] Registered:", id, "priority:", entry.priority);
  }
  return () => unregisterCloseable(id);
};
const unregisterCloseable = (id) => {
  const removed = registry.delete(id);
  if (options.debug && removed) {
    console.log("[BackNav] Unregistered:", id);
  }
  return removed;
};
const getActiveCloseables = (view) => {
  return Array.from(registry.values()).filter((entry) => {
    if (entry.element) {
      const el = entry.element.deref();
      if (!el) {
        registry.delete(entry.id);
        return false;
      }
    }
    return entry.isActive(view);
  }).sort((a, b) => b.priority - a.priority);
};
const getActiveCloseable = (view) => {
  const active = getActiveCloseables(view);
  return active[0] || null;
};
const closeHighestPriority = (view) => {
  const entry = getActiveCloseable(view);
  if (!entry) return null;
  if (options.debug) {
    console.log("[BackNav] Closing:", entry.id, "priority:", entry.priority);
  }
  const result = entry?.close?.(view);
  return result != false ? entry : null;
};
const closeByGroup = (group) => {
  let closedCount = 0;
  for (const entry of registry.values()) {
    if (entry.group === group && entry.isActive()) {
      registry?.delete?.(entry.id);
      const result = entry.close();
      if (result !== false) closedCount++;
    }
  }
  return closedCount;
};
const hasActiveCloseable = (view) => {
  return getActiveCloseable(view) != null;
};
const handleBackNavigation = (ev) => {
  if (processingBack) return false;
  if (ignoreNextPopState) {
    ignoreNextPopState = false;
    return false;
  }
  if (ev?.state?.action) return false;
  processingBack = true;
  try {
    ignoreNextPopState = true;
    let closingView;
    if (historyState.entries && (historyState.action === "BACK" || historyState.action === "POP")) {
      const prevEntry = historyState.entries[historyState.index + 1];
      if (prevEntry) {
        closingView = prevEntry.view;
      }
    }
    const closed = closeHighestPriority(closingView) ?? true;
    if (!closed) {
      ev.preventDefault?.();
      ignoreNextPopState = true;
      originalForward?.();
      setTimeout(() => {
        ignoreNextPopState = false;
      }, 0);
      processingBack = false;
      return true;
    }
    ignoreNextPopState = false;
    processingBack = false;
    return false;
  } finally {
    ignoreNextPopState = false;
    processingBack = false;
    return false;
  }
};
const initBackNavigation = (opts = {}) => {
  if (navigationInitialized) {
    console.warn("[BackNav] Already initialized");
    return () => {
    };
  }
  options = { ...opts };
  navigationInitialized = true;
  initHistory(location.hash);
  if (opts.pushInitialState !== false && !opts.skipPopstateHandler) {
    historyDepth = 0;
    setIgnoreNextPopState(true);
    const current = history.state || {};
    const newState = { ...current, backNav: true, depth: historyDepth };
    history.pushState(newState, "", location.hash || "#");
    setIgnoreNextPopState(false);
  }
  let unbind;
  if (!opts.skipPopstateHandler) {
    const popstateHandler = (ev) => {
      if (!ev?.state?.action) {
        const wasHandled = handleBackNavigation(ev);
        if (!wasHandled && !opts.preventDefaultNavigation) {
        }
      }
    };
    unbind = addEvent(window, "popstate", popstateHandler);
  }
  if (options.debug) {
    console.log("[BackNav] Initialized", opts.skipPopstateHandler ? "(external handler)" : "");
  }
  return () => {
    unbind?.();
    navigationInitialized = false;
    registry.clear();
    if (options.debug) {
      console.log("[BackNav] Destroyed");
    }
  };
};
const registerContextMenu = (element, visibleRef, onClose) => {
  return registerCloseable({
    id: `ctx-menu-${element.id || generateId()}`,
    priority: 100 /* CONTEXT_MENU */,
    element: new WeakRef(element),
    group: "context-menu",
    isActive: () => visibleRef.value === true,
    close: () => {
      visibleRef.value = false;
      onClose?.();
      return false;
    }
  });
};
const registerModal = (element, isActiveCheck, onClose) => {
  return registerCloseable({
    id: `modal-${element.id || generateId()}`,
    priority: 80 /* MODAL */,
    element: new WeakRef(element),
    group: "modal",
    isActive: isActiveCheck ?? (() => {
      const el = element;
      return el?.isConnected && !el?.hasAttribute?.("data-hidden") && el?.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false;
    }),
    close: () => {
      onClose?.();
      element?.remove?.();
      return false;
    }
  });
};
const registerSidebar = (element, openedRef, onClose) => {
  return registerCloseable({
    id: `sidebar-${element.id || generateId()}`,
    priority: 60 /* SIDEBAR */,
    element: new WeakRef(element),
    group: "sidebar",
    isActive: () => {
      const val = openedRef.value;
      return !!val && String(val) !== "false";
    },
    close: () => {
      openedRef.value = false;
      onClose?.();
      return false;
    }
  });
};
const registerOverlay = (element, isActiveCheck, onClose, priority = 50 /* OVERLAY */) => {
  return registerCloseable({
    id: `overlay-${element.id || generateId()}`,
    priority,
    element: new WeakRef(element),
    group: "overlay",
    isActive: isActiveCheck,
    close: () => {
      onClose();
      return false;
    }
  });
};
const createBackNavigableModal = (content, options2 = {}) => {
  const {
    backdropClass = "rs-modal-backdrop",
    closeOnBackdropClick = true,
    closeOnEscape = true,
    onClose
  } = options2;
  const backdrop = document.createElement("div");
  backdrop.className = backdropClass;
  backdrop.appendChild(content);
  const close = () => {
    onClose?.();
    backdrop.remove();
    document.removeEventListener("keydown", escHandler);
  };
  const escHandler = (ev) => {
    if (ev.key === "Escape" && closeOnEscape) {
      close();
    }
  };
  if (closeOnEscape) {
    document.addEventListener("keydown", escHandler);
  }
  if (closeOnBackdropClick) {
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        close();
      }
    });
  }
  const unregister = registerModal(backdrop, void 0, close);
  return { element: backdrop, close, unregister };
};
const BackNavigation = {
  register: registerCloseable,
  unregister: unregisterCloseable,
  init: initBackNavigation,
  close: closeHighestPriority,
  hasActive: hasActiveCloseable,
  getActive: getActiveCloseable,
  getAllActive: getActiveCloseables,
  closeByGroup,
  registerContextMenu,
  registerModal,
  registerSidebar,
  registerOverlay,
  createBackNavigableModal,
  ClosePriority
};

const localStorageLinkMap = /* @__PURE__ */ new Map();
const localStorageLink = (existsStorage, exists, key, initial) => {
  if (key == null) return;
  if (localStorageLinkMap.has(key)) {
    localStorageLinkMap.get(key)?.[0]?.();
    localStorageLinkMap.delete(key);
  }
  return localStorageLinkMap.getOrInsertComputed?.(key, () => {
    const def = (existsStorage ?? localStorage).getItem(key) ?? (initial?.value ?? initial);
    const ref2 = isValueRef(exists) ? exists : stringRef(def);
    ref2.value ??= def;
    const $val = new WeakRef(ref2);
    const unsb = affected([ref2, "value"], (val) => {
      $avoidTrigger($val?.deref?.(), () => {
        (existsStorage ?? localStorage).setItem(key, val);
      });
    });
    const list = (ev) => {
      if (ev.storageArea == (existsStorage ?? localStorage) && ev.key == key) {
        if (isNotEqual(ref2.value, ev.newValue)) {
          ref2.value = ev.newValue;
        }
        ;
      }
    };
    addEventListener("storage", list);
    return [() => {
      unsb?.();
      removeEventListener("storage", list);
    }, ref2];
  });
};
const normalizeHash = (hash, withHashCharacter = true) => {
  if (hash == null) return withHashCharacter ? "#" : "";
  if (!withHashCharacter && hash?.startsWith?.("#")) {
    return hash?.replace?.("#", "") || "";
  }
  ;
  if (withHashCharacter && !hash?.startsWith?.("#")) {
    return `#${hash || ""}`;
  }
  ;
  return (withHashCharacter ? hash?.startsWith?.("#") ? hash : `#${hash || ""}` : hash?.replace?.("#", "")) || "";
};
const hashTargetLink = (_, exists, initial, withHashCharacter = false) => {
  const locationHash = normalizeHash(normalizeHash(location?.hash || "", false) || normalizeHash(initial || "", false) || "", withHashCharacter) || "";
  const ref2 = isValueRef(exists) ? exists : stringRef(locationHash);
  if (isObject(ref2)) ref2.value ||= locationHash;
  let processingStateChange = false;
  let nanoThrottle = 0;
  const evf = (ev) => {
    if (getIgnoreNextPopState()) return;
    if (nanoThrottle <= 0) {
      nanoThrottle = 1;
      setTimeout(() => {
        const normalizedLocationHash = normalizeHash(location?.hash, false);
        const newValue = normalizeHash(normalizedLocationHash || normalizeHash(ref2.value || "", false), withHashCharacter) || "";
        if (normalizeHash(ref2.value, false) !== normalizeHash(newValue, false)) {
          if (!processingStateChange) {
            processingStateChange = true;
            ref2.value = newValue;
            setTimeout(() => processingStateChange = false, 0);
          }
        }
        nanoThrottle = 0;
      }, 0);
    }
  };
  const $val = new WeakRef(ref2);
  const usb = affected([ref2, "value"], (val) => {
    const newHash = normalizeHash(normalizeHash($getValue($val?.deref?.()) || val, false) || normalizeHash(location?.hash, false), true);
    if (newHash != location.hash) {
      $avoidTrigger($val?.deref?.(), () => {
        if (!processingStateChange) {
          setIgnoreNextPopState(true);
          history.pushState("", "", newHash || location.hash);
          setTimeout(() => setIgnoreNextPopState(false), 0);
        }
      });
    }
  });
  addEventListener("popstate", evf);
  addEventListener("hashchange", evf);
  return () => {
    usb?.();
    removeEventListener("popstate", evf);
    removeEventListener("hashchange", evf);
  };
};
const matchMediaLink = (existsMedia, exists, condition) => {
  if (condition == null) return;
  const med = existsMedia ?? matchMedia(condition), def = med?.matches || false;
  const ref2 = isValueRef(exists) ? exists : booleanRef(def);
  ref2.value ??= def;
  const evf = (ev) => ref2.value = ev.matches;
  med?.addEventListener?.("change", evf);
  return () => {
    med?.removeEventListener?.("change", evf);
  };
};
const visibleLink = (element, exists, initial) => {
  if (element == null) return;
  const def = initial?.value ?? (typeof initial != "object" ? initial : null) ?? element?.getAttribute?.("data-hidden") == null;
  const val = isValueRef(exists) ? exists : booleanRef(!!def);
  const usb = bindWith(element, "data-hidden", val, handleHidden);
  const evf = [(ev) => {
    val.value = ev?.type == "u2-hidden" ? false : true;
  }, { passive: true }], wel = new WeakRef(element);
  element?.addEventListener?.("u2-hidden", ...evf);
  element?.addEventListener?.("u2-appear", ...evf);
  return () => {
    const element2 = wel?.deref?.();
    usb?.();
    element2?.removeEventListener?.("u2-hidden", ...evf);
    element2?.removeEventListener?.("u2-appear", ...evf);
  };
};
const attrLink = (element, exists, attribute, initial) => {
  const def = element?.getAttribute?.(attribute) ?? (typeof initial == "boolean" ? initial ? "" : null : getValue(initial));
  if (!element) return;
  const val = isValueRef(exists) ? exists : stringRef(def);
  if (isObject(val) && !normalizePrimitive(val.value)) val.value = normalizePrimitive(def) ?? val.value ?? "";
  return bindWith(element, attribute, val, handleAttribute, null, true);
};
const sizeLink = (element, exists, axis, box) => {
  const def = box == "border-box" ? element?.[axis == "inline" ? "offsetWidth" : "offsetHeight"] : element?.[axis == "inline" ? "clientWidth" : "clientHeight"] - getPadding(element, axis);
  const val = isValueRef(exists) ? exists : numberRef(def);
  if (isObject(val)) val.value ||= (def ?? val.value) || 1;
  const obs = new ResizeObserver((entries) => {
    if (isObject(val)) {
      if (box == "border-box") {
        val.value = axis == "inline" ? entries[0].borderBoxSize[0].inlineSize : entries[0].borderBoxSize[0].blockSize;
      }
      ;
      if (box == "content-box") {
        val.value = axis == "inline" ? entries[0].contentBoxSize[0].inlineSize : entries[0].contentBoxSize[0].blockSize;
      }
      ;
      if (box == "device-pixel-content-box") {
        val.value = axis == "inline" ? entries[0].devicePixelContentBoxSize[0].inlineSize : entries[0].devicePixelContentBoxSize[0].blockSize;
      }
      ;
    }
  });
  if ((element?.element ?? element?.self ?? element) instanceof HTMLElement) {
    obs?.observe?.(element?.element ?? element?.self ?? element, { box });
  }
  ;
  return () => obs?.disconnect?.();
};
const scrollLink = (element, exists, axis, initial) => {
  const wel = element instanceof WeakRef ? element : new WeakRef(element);
  if (initial != null && typeof (initial?.value ?? initial) == "number") {
    element?.scrollTo?.({ [axis == "block" ? "top" : "left"]: initial?.value ?? initial });
  }
  ;
  const def = element?.[axis == "block" ? "scrollTop" : "scrollLeft"];
  const val = isValueRef(exists) ? exists : numberRef(def || 0);
  if (isObject(val)) val.value ||= (def ?? val.value) || 1;
  val.value ||= (def ?? val.value) || 0;
  const usb = affected([val, "value"], (v) => {
    if (Math.abs((axis == "block" ? element?.scrollTop : element?.scrollLeft) - (val?.value ?? val)) > 1e-3) element?.scrollTo?.({ [axis == "block" ? "top" : "left"]: val?.value ?? val });
  });
  const scb = [(ev) => {
    val.value = (axis == "block" ? wel?.deref?.()?.scrollTop : wel?.deref?.()?.scrollLeft) || 0;
  }, { passive: true }];
  element?.addEventListener?.("scroll", ...scb);
  return () => {
    wel?.deref?.()?.removeEventListener?.("scroll", ...scb);
    usb?.();
  };
};
const checkedLink = (element, exists) => {
  const def = !!element?.checked || false;
  const val = isValueRef(exists) ? exists : booleanRef(def);
  if (isObject(val)) val.value ??= def;
  const dbf = bindCtrl(element, checkboxCtrl(val));
  const usb = affected([val, "value"], (v) => {
    if (element && element?.checked != v) {
      setChecked(element, v);
    }
  });
  return () => {
    usb?.();
    dbf?.();
  };
};
const valueLink = (element, exists) => {
  if (isPrimitive(element)) return;
  if (!element || !(element instanceof Node || element?.element instanceof Node)) return;
  const def = element?.value ?? "";
  const val = isValueRef(exists) ? exists : stringRef(def);
  if (isObject(val)) val.value ??= def;
  const dbf = bindCtrl(element, valueCtrl(val));
  const $val = new WeakRef(val);
  const usb = affected([val, "value"], (v) => {
    if (element && isNotEqual(element?.value, v?.value ?? v)) {
      $avoidTrigger(deref$1($val), () => {
        element.value = $getValue(deref$1($val)) ?? $getValue(v);
        element?.dispatchEvent?.(new Event("change", { bubbles: true }));
      });
    }
  });
  return () => {
    usb?.();
    dbf?.();
  };
};
const valueAsNumberLink = (element, exists) => {
  if (isPrimitive(element)) return;
  if (!element || !(element instanceof Node || element?.element instanceof Node)) return;
  const def = Number(element?.valueAsNumber) || 0;
  const val = isValueRef(exists) ? exists : numberRef(def);
  if (isObject(val)) val.value ??= def;
  const dbf = bindCtrl(element, numberCtrl(val));
  const usb = affected([val, "value"], (v) => {
    if (element && (element.type == "range" || element.type == "number") && typeof element?.valueAsNumber == "number" && isNotEqual(element?.valueAsNumber, v)) {
      element.valueAsNumber = Number(v);
      element?.dispatchEvent?.(new Event("change", { bubbles: true }));
    }
  });
  return () => {
    usb?.();
    dbf?.();
  };
};
const observeSizeLink = (element, exists, box, styles) => {
  if (isPrimitive(element)) return;
  if (!element || !(element instanceof Node || element?.element instanceof Node)) return;
  if (!styles) styles = isValueRef(exists) ? exists : observe({});
  let obs = null;
  (obs = new ResizeObserver((mut) => {
    if (box == "border-box") {
      styles.inlineSize = `${mut[0].borderBoxSize[0].inlineSize}px`;
      styles.blockSize = `${mut[0].borderBoxSize[0].blockSize}px`;
    }
    if (box == "content-box") {
      styles.inlineSize = `${mut[0].contentBoxSize[0].inlineSize}px`;
      styles.blockSize = `${mut[0].contentBoxSize[0].blockSize}px`;
    }
    if (box == "device-pixel-content-box") {
      styles.inlineSize = `${mut[0].devicePixelContentBoxSize[0].inlineSize}px`;
      styles.blockSize = `${mut[0].devicePixelContentBoxSize[0].blockSize}px`;
    }
  })).observe(element?.element ?? element?.self ?? element, { box });
  return () => {
    obs?.disconnect?.();
  };
};
const refCtl = (value) => {
  if (isPrimitive(value)) return;
  let self = null, ctl = ref(value, self = ([val, prop, old], [weak, ctl2, valMap]) => boundBehaviors?.get?.(weak?.deref?.())?.values?.()?.forEach?.((beh) => {
    (beh != self ? beh : null)?.([val, prop, old], [weak, ctl2, valMap]);
  }));
  return ctl;
};
const orientLink = (host, exists) => {
  const orient = orientationNumberMap?.[getCorrectOrientation()] || 0;
  const def = Number(orient) || 0;
  const val = isValueRef(exists) ? exists : numberRef(def);
  if (hasValue(val)) val.value = def;
  return whenAnyScreenChanges(() => {
    val.value = orientationNumberMap?.[getCorrectOrientation()] || 0;
  });
};

const makeRef = (host, type, link, ...args) => {
  if (link == attrLink || link == handleAttribute) {
    const exists = elMap$1?.get?.(host)?.get?.(handleAttribute)?.get?.(args[0])?.[0];
    if (exists) {
      return exists;
    }
    ;
  }
  const rf = (type ?? ref)?.(null), usub = link?.(host, rf, ...args);
  if (usub && rf) addToCallChain(rf, Symbol.dispose, usub);
  return rf;
};
const orientRef = (host, ...args) => makeRef(host, numberRef, orientLink, ...args);
const attrRef = (host, ...args) => makeRef(host, stringRef, attrLink, ...args);
const valueRef = (host, ...args) => makeRef(host, stringRef, valueLink, ...args);
const valueAsNumberRef = (host, ...args) => makeRef(host, numberRef, valueAsNumberLink, ...args);
const localStorageRef = (...args) => {
  if (localStorageLinkMap.has(args[0])) return localStorageLinkMap.get(args[0])?.[1];
  const link = localStorageLink, type = stringRef;
  const rf = (type ?? ref)?.(null), pair = link?.(null, rf, ...args);
  const [usub, _] = pair;
  if (usub && rf) addToCallChain(rf, Symbol.dispose, usub);
  return rf;
};
const sizeRef = (host, ...args) => makeRef(host, numberRef, sizeLink, ...args);
const checkedRef = (host, ...args) => makeRef(host, booleanRef, checkedLink, ...args);
const scrollRef = (host, ...args) => makeRef(host, numberRef, scrollLink, ...args);
const visibleRef = (host, ...args) => makeRef(host, booleanRef, visibleLink, ...args);
const matchMediaRef = (...args) => makeRef(null, booleanRef, matchMediaLink, ...args);
const hashTargetRef = (...args) => makeRef(null, stringRef, hashTargetLink, ...args);
const makeWeakRef = (initial, behavior) => {
  const obj = deref(initial);
  return isValidObj(obj) ? observe(WRef(obj)) : ref(obj, behavior);
};
const scrollSize = (source, axis = 0, inputChange) => {
  const target = toRef(source);
  const compute = (vl) => deref(target)?.[["scrollWidth", "scrollHeight"][axis] || "scrollWidth"] - 1 || 1;
  const scroll = scrollRef(source, ["inline", "block"][axis]);
  const conRef = sizeRef(source, ["inline", "block"][axis], "content-box");
  const percent = computed(scroll, compute);
  const recompute = () => {
    scroll?.[$trigger]?.();
    percent?.[$trigger]?.();
  };
  affected(conRef, (vl) => {
    recompute?.();
  });
  addEvent(inputChange || source, "input", () => {
    recompute?.();
  });
  addEvent(inputChange || source, "change", () => {
    recompute?.();
  });
  queueMicrotask(() => {
    recompute?.();
  });
  return percent;
};
const reactiveScrollbarSize = (source, axis, contentSize) => {
  const containerSize = axis === 0 ? operated([], () => source.clientWidth) : operated([], () => source.clientHeight);
  return operated([containerSize, contentSize], () => {
    const ratio = containerSize.value / contentSize.value;
    const minSize = 20;
    return Math.max(minSize, ratio * containerSize.value);
  });
};
const paddingBoxSize = (source, axis, inputChange) => {
  const target = asWeak(source);
  const scroll = scrollRef(source, ["inline", "block"][axis]);
  const conRef = sizeRef(source, ["inline", "block"][axis], "content-box");
  const content = computed(conRef, (v) => v + (getPadding(source, ["inline", "block"][axis]) || 0));
  const recompute = () => {
    conRef?.[$trigger]?.();
    content?.[$trigger]?.();
  };
  affected(scroll, (vl) => {
    recompute?.();
  });
  addEvent(inputChange || source, "input", () => {
    recompute?.();
  });
  addEvent(inputChange || source, "change", () => {
    recompute?.();
  });
  queueMicrotask(() => {
    recompute?.();
  });
  return content;
};

const styleCache = /* @__PURE__ */ new Map();
const styleElementCache = /* @__PURE__ */ new WeakMap();
const propStore = /* @__PURE__ */ new WeakMap();
const CSM = /* @__PURE__ */ new WeakMap();
const camelToKebab = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const kebabToCamel = (str) => str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
const whenBoxValid = (name) => {
  const cb = camelToKebab(name);
  if (["border-box", "content-box", "device-pixel-content-box"].indexOf(cb) >= 0) return cb;
  return null;
};
const whenAxisValid = (name) => {
  const cb = camelToKebab(name);
  if (cb?.startsWith?.("inline")) return "inline";
  if (cb?.startsWith?.("block")) return "block";
  return null;
};
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const inRenderKey = Symbol.for("@render@");
const defKeys = Symbol.for("@defKeys@");
const defaultStyle = typeof document != "undefined" ? document?.createElement?.("style") : null;
const defineSource = (source, holder, name) => {
  if (source == "attr") return attrRef.bind(null, holder, name || "");
  if (source == "media") return matchMediaRef;
  if (source == "query") return (val) => Q?.(name || val || "", holder);
  if (source == "query-shadow") return (val) => Q?.(name || val || "", holder?.shadowRoot ?? holder);
  if (source == "localStorage") return localStorageRef;
  if (source == "inline-size") return sizeRef.bind(null, holder, "inline", whenBoxValid(name) || "border-box");
  if (source == "content-box") return sizeRef.bind(null, holder, whenAxisValid(name) || "inline", "content-box");
  if (source == "block-size") return sizeRef.bind(null, holder, "block", whenBoxValid(name) || "border-box");
  if (source == "border-box") return sizeRef.bind(null, holder, whenAxisValid(name) || "inline", "border-box");
  if (source == "scroll") return scrollRef.bind(null, holder, whenAxisValid(name) || "inline");
  if (source == "device-pixel-content-box") return sizeRef.bind(null, holder, whenAxisValid(name) || "inline", "device-pixel-content-box");
  if (source == "checked") return checkedRef.bind(null, holder);
  if (source == "value") return valueRef.bind(null, holder);
  if (source == "value-as-number") return valueAsNumberRef.bind(null, holder);
  return ref;
};
if (defaultStyle) {
  typeof document != "undefined" ? document.querySelector?.("head")?.appendChild?.(defaultStyle) : null;
}
const getDef = (source) => {
  if (source == "query") return "input";
  if (source == "query-shadow") return "input";
  if (source == "media") return false;
  if (source == "localStorage") return null;
  if (source == "attr") return null;
  if (source == "inline-size") return 0;
  if (source == "block-size") return 0;
  if (source == "border-box") return 0;
  if (source == "content-box") return 0;
  if (source == "scroll") return 0;
  if (source == "device-pixel-content-box") return 0;
  if (source == "checked") return false;
  if (source == "value") return "";
  if (source == "value-as-number") return 0;
  return null;
};
if (defaultStyle) {
  defaultStyle.innerHTML = `@layer ux-preload {
        :host { display: none; }
    }`;
}
function withProperties(ctr) {
  const proto = ctr.prototype ?? Object.getPrototypeOf(ctr) ?? ctr;
  const $prev = proto?.$init ?? ctr?.$init;
  proto.$init = function(...args) {
    $prev?.call?.(this, ...args);
    const allDefs = {};
    let p = Object.getPrototypeOf(this) ?? this;
    while (p) {
      if (Object.hasOwn(p, defKeys)) {
        const defs = Object.assign({}, Object.getOwnPropertyDescriptors(p), p[defKeys] ?? {});
        for (const k of Object.keys(defs)) {
          if (!(k in allDefs)) {
            allDefs[k] = defs[k];
          }
          ;
        }
      }
      p = Object.getPrototypeOf(p);
    }
    for (const [key, def] of Object.entries(allDefs)) {
      const exists = this[key];
      if (def != null) {
        Object.defineProperty(this, key, def);
      }
      try {
        this[key] = exists || this[key];
      } catch (e) {
      }
    }
    return this;
  };
  return ctr;
}
function generateName(length = 8) {
  let r = "";
  const l = characters.length;
  for (let i = 0; i < length; i++) {
    r += characters.charAt(Math.floor(Math.random() * l));
  }
  return r;
}
function defineElement(name, options) {
  return function(target, _key) {
    try {
      if (typeof customElements === "undefined" || !name) return target;
      const existing = customElements.get(name);
      if (existing) return existing;
      customElements.define(name, target, options);
    } catch (e) {
      if (e?.name === "NotSupportedError" || /has already been used|already been defined/i.test(e?.message || "")) {
        return customElements?.get?.(name) ?? target;
      }
      throw e;
    }
    return target;
  };
}
function property(options = {}) {
  const { attribute, source, name, from } = options;
  return function(target, key) {
    const attrName = typeof attribute == "string" ? attribute : name ?? key;
    if (attribute !== false && attrName != null) {
      const ctor = target.constructor;
      if (!ctor.observedAttributes) {
        ctor.observedAttributes = [];
      }
      if (ctor.observedAttributes.indexOf(attrName) < 0) {
        ctor.observedAttributes.push(attrName);
      }
    }
    if (!Object.hasOwn(target, defKeys)) target[defKeys] = {};
    target[defKeys][key] = {
      get() {
        const ROOT = this;
        const inRender = ROOT[inRenderKey];
        const sourceTarget = !from ? ROOT : from instanceof HTMLElement ? from : typeof from == "string" ? Q?.(from, ROOT) : ROOT;
        let store = propStore.get(ROOT);
        let stored = store?.get?.(key);
        if (stored == null && source != null) {
          if (!store) {
            propStore.set(ROOT, store = /* @__PURE__ */ new Map());
          }
          if (!store?.has?.(key)) {
            store?.set?.(key, stored = defineSource(source, sourceTarget, name || key)?.(getDef(source)));
          }
        }
        if (inRender) return stored;
        if (stored?.element instanceof HTMLElement) return stored?.element;
        return (typeof stored == "object" || typeof stored == "function") && (stored?.value != null || "value" in stored) ? stored?.value : stored;
      },
      set(newValue) {
        const ROOT = this;
        const sourceTarget = !from ? ROOT : from instanceof HTMLElement ? from : typeof from == "string" ? Q?.(from, ROOT) : ROOT;
        let store = propStore.get(ROOT);
        let stored = store?.get?.(key);
        if (stored == null && source != null) {
          if (!store) {
            propStore.set(ROOT, store = /* @__PURE__ */ new Map());
          }
          if (!store?.has?.(key)) {
            const initialValue = (typeof newValue == "object" || typeof newValue == "function" ? newValue?.value : null) ?? newValue ?? getDef(source);
            store?.set?.(key, stored = defineSource(source, sourceTarget, name || key)?.(initialValue));
          }
        } else if (typeof stored == "object" || typeof stored == "function") {
          try {
            if (typeof newValue == "object" && newValue != null && (newValue?.value == null && !("value" in newValue) || typeof newValue?.value == "object" || typeof newValue?.value == "function")) {
              Object.assign(stored, newValue?.value ?? newValue);
            } else {
              stored.value = (typeof newValue == "object" || typeof newValue == "function" ? newValue?.value : null) ?? newValue;
            }
          } catch (e) {
            console.warn("Error setting property value:", e);
          }
        }
      },
      enumerable: true,
      configurable: true
    };
  };
}
const adoptedStyleSheetsCache = /* @__PURE__ */ new WeakMap();
const addAdoptedSheetToElement = (bTo, sheet) => {
  let adoptedSheets = adoptedStyleSheetsCache.get(bTo);
  if (!adoptedSheets) {
    adoptedStyleSheetsCache.set(bTo, adoptedSheets = []);
  }
  if (sheet && adoptedSheets.indexOf(sheet) < 0) {
    adoptedSheets.push(sheet);
  }
  if (bTo.shadowRoot) {
    bTo.shadowRoot.adoptedStyleSheets = [
      ...bTo.shadowRoot.adoptedStyleSheets || [],
      ...adoptedSheets.filter((s) => !bTo.shadowRoot.adoptedStyleSheets?.includes(s))
    ];
  }
};
const loadCachedStyles = (bTo, src) => {
  if (!src) return null;
  let resolvedSrc = src;
  if (typeof src == "function") {
    try {
      const weak = new WeakRef(bTo);
      resolvedSrc = src.call(bTo, weak);
    } catch (e) {
      console.warn("Error calling styles function:", e);
      return null;
    }
  }
  if (resolvedSrc && typeof CSSStyleSheet != "undefined" && resolvedSrc instanceof CSSStyleSheet) {
    addAdoptedSheetToElement(bTo, resolvedSrc);
    return null;
  }
  if (resolvedSrc instanceof Promise) {
    resolvedSrc.then((result) => {
      if (result instanceof CSSStyleSheet) {
        addAdoptedSheetToElement(bTo, result);
      } else if (result != null) {
        loadCachedStyles(bTo, result);
      }
    }).catch((e) => {
      console.warn("Error loading adopted stylesheet:", e);
    });
    return null;
  }
  if (typeof resolvedSrc == "string" || resolvedSrc instanceof Blob || resolvedSrc instanceof File) {
    const adopted = loadAsAdopted(resolvedSrc, "");
    if (adopted) {
      let adoptedSheets = adoptedStyleSheetsCache.get(bTo);
      if (!adoptedSheets) {
        adoptedStyleSheetsCache.set(bTo, adoptedSheets = []);
      }
      const addAdoptedSheet = (sheet) => {
        if (sheet && adoptedSheets.indexOf(sheet) < 0) {
          adoptedSheets.push(sheet);
        }
        if (bTo.shadowRoot) {
          bTo.shadowRoot.adoptedStyleSheets = [
            ...bTo.shadowRoot.adoptedStyleSheets || [],
            ...adoptedSheets.filter((s) => !bTo.shadowRoot.adoptedStyleSheets?.includes(s))
          ];
        }
      };
      if (adopted instanceof Promise) {
        adopted.then(addAdoptedSheet).catch((e) => {
          console.warn("Error loading adopted stylesheet:", e);
        });
        return null;
      } else {
        addAdoptedSheet(adopted);
        return null;
      }
    }
  }
  const source = typeof src == "function" || typeof src == "object" ? styleElementCache : styleCache;
  const cached = source.get(src);
  let styleElement = cached?.styleElement;
  let vars = cached?.vars;
  if (!cached) {
    let styles = ``;
    let props = [];
    if (typeof resolvedSrc == "string") {
      styles = resolvedSrc || "";
    } else if (typeof resolvedSrc == "object" && resolvedSrc != null) {
      if (resolvedSrc instanceof HTMLStyleElement) {
        styleElement = resolvedSrc;
      } else {
        styles = typeof resolvedSrc.css == "string" ? resolvedSrc.css : typeof resolvedSrc == "string" ? resolvedSrc : String(resolvedSrc);
        props = resolvedSrc?.props ?? props;
        vars = resolvedSrc?.vars ?? vars;
      }
    }
    if (!styleElement && styles) {
      styleElement = loadInlineStyle(styles, bTo, "ux-layer");
    }
    source.set(src, { css: styles, props, vars, styleElement });
  }
  return styleElement;
};
const isNotExtended = (el) => {
  return !(el instanceof HTMLDivElement || el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement) && !(el?.hasAttribute?.("is") || el?.getAttribute?.("is") != null);
};
const customElement = defineElement;
function GLitElement(derivate) {
  const Base = derivate ?? HTMLElement;
  const cached = CSM.get(Base);
  if (cached) return cached;
  class GLitElementImpl extends Base {
    #shadowDOM;
    #styleElement;
    #defaultStyle;
    #initialized = false;
    styleLibs = [];
    adoptedStyleSheets = [];
    // Геттеры для переопределения в подклассах
    get styles() {
      return void 0;
    }
    get initialAttributes() {
      return void 0;
    }
    styleLayers() {
      return [];
    }
    render(_weak) {
      return document.createElement("slot");
    }
    constructor(...args) {
      super(...args);
      if (isNotExtended(this)) {
        const shadowRoot = addRoot(
          this.shadowRoot ?? this.createShadowRoot?.() ?? this.attachShadow({ mode: "open" })
        );
        const defStyle = this.#defaultStyle ??= defaultStyle?.cloneNode?.(true);
        const layersStyle = shadowRoot.querySelector(`style[data-type="ux-layer"]`);
        if (layersStyle) {
          layersStyle.after(defStyle);
        } else {
          shadowRoot.prepend(defStyle);
        }
      }
      this.styleLibs ??= [];
    }
    $makeLayers() {
      return `@layer ${["ux-preload", "ux-layer", ...this.styleLayers?.() ?? []].join?.(",") ?? ""};`;
    }
    onInitialize(_weak) {
      return this;
    }
    onRender(_weak) {
      return this;
    }
    getProperty(key) {
      const current = this[inRenderKey];
      this[inRenderKey] = true;
      const cp = this[key];
      this[inRenderKey] = current;
      if (!current) {
        delete this[inRenderKey];
      }
      return cp;
    }
    loadStyleLibrary($module) {
      const root = this.shadowRoot;
      const module = typeof $module == "function" ? $module?.(root) : $module;
      if (module instanceof HTMLStyleElement) {
        this.styleLibs?.push?.(module);
        if (this.#styleElement?.isConnected) {
          this.#styleElement?.before?.(module);
        } else {
          this.shadowRoot?.prepend?.(module);
        }
      } else if (module instanceof CSSStyleSheet) {
        let adoptedSheets = adoptedStyleSheetsCache.get(this);
        if (!adoptedSheets) {
          adoptedStyleSheetsCache.set(this, adoptedSheets = []);
        }
        if (adoptedSheets.indexOf(module) < 0) {
          adoptedSheets.push(module);
        }
        if (root) {
          root.adoptedStyleSheets = [
            ...root.adoptedStyleSheets || [],
            ...adoptedSheets.filter((s) => !root.adoptedStyleSheets?.includes(s))
          ];
        }
      } else {
        const adopted = loadAsAdopted(module, "ux-layer");
        let adoptedSheets = adoptedStyleSheetsCache.get(this);
        if (!adoptedSheets) {
          adoptedStyleSheetsCache.set(this, adoptedSheets = []);
        }
        const addAdoptedSheet = (sheet) => {
          if (sheet && adoptedSheets.indexOf(sheet) < 0) {
            adoptedSheets.push(sheet);
          }
          if (root) {
            root.adoptedStyleSheets = [
              ...root.adoptedStyleSheets || [],
              ...adoptedSheets.filter((s) => !root.adoptedStyleSheets?.includes(s))
            ];
          }
        };
        if (adopted instanceof Promise) {
          adopted.then(addAdoptedSheet).catch(() => {
          });
        } else if (adopted) {
          addAdoptedSheet(adopted);
        }
      }
      return this;
    }
    createShadowRoot() {
      return addRoot(this.shadowRoot ?? this.attachShadow({ mode: "open" }));
    }
    // ============================================
    // LIFECYCLE CALLBACKS
    // ============================================
    /**
     * Вызывается когда элемент добавлен в DOM
     */
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      const weak = new WeakRef(this);
      if (!this.#initialized) {
        this.#initialized = true;
        const shadowRoot = isNotExtended(this) ? this.createShadowRoot?.() ?? this.shadowRoot ?? this.attachShadow({ mode: "open" }) : this.shadowRoot;
        const ctor = this.constructor;
        const init = this.$init ?? ctor.prototype?.$init;
        if (typeof init === "function") init.call(this);
        const attrs = typeof this.initialAttributes == "function" ? this.initialAttributes() : this.initialAttributes;
        setAttributesIfNull(this, attrs);
        this.onInitialize?.call(this, weak);
        this[inRenderKey] = true;
        if (isNotExtended(this) && shadowRoot) {
          const rendered = this.render?.call?.(this, weak) ?? document.createElement("slot");
          const styleElement = loadCachedStyles(this, this.styles);
          if (styleElement instanceof HTMLStyleElement) {
            this.#styleElement = styleElement;
          }
          const elements = [
            H`<style data-type="ux-layer" prop:innerHTML=${this.$makeLayers()}></style>`,
            this.#defaultStyle,
            ...this.styleLibs.map((x) => x.cloneNode?.(true)) || [],
            styleElement,
            rendered
          ].filter((x) => x != null && isElement(x));
          shadowRoot.append(...elements);
          const adoptedSheets = adoptedStyleSheetsCache.get(this) || [];
          if (adoptedSheets.length > 0) {
            shadowRoot.adoptedStyleSheets = [
              ...adoptedSheets.filter((s) => !shadowRoot.adoptedStyleSheets?.includes(s)),
              .../* @__PURE__ */ new Set([...shadowRoot.adoptedStyleSheets || []])
            ];
          }
        }
        this.onRender?.call?.(this, weak);
        delete this[inRenderKey];
      }
    }
    /**
     * Вызывается когда элемент удалён из DOM
     */
    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
    }
    /**
     * Вызывается когда элемент перемещён в новый документ
     */
    adoptedCallback() {
      if (super.adoptedCallback) {
        super.adoptedCallback();
      }
    }
    /**
     * Вызывается когда наблюдаемый атрибут изменился
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }
    }
  }
  const result = withProperties(GLitElementImpl);
  CSM.set(Base, result);
  console.log("result", result);
  return result;
}

const S = (strings, ...values) => {
  let props = [], vars = /* @__PURE__ */ new Map();
  let index = 0, counter = 0;
  const parts = [];
  for (const string of strings) {
    parts.push(string);
    const $value = values?.[index], $isValid = strings[index + 1]?.trim?.()?.includes?.(";");
    if ($isValid) {
      if (typeof $value == "object" && ($value?.value != null || "value" in $value)) {
        const varName = `--ref-${counter}`;
        parts.push(`var(${varName})`);
        props.push(`@property ${varName} { syntax: "<number>"; initial-value: ${$value?.value ?? 0}; inherits: true; };`);
        vars.set(varName, $value);
        counter++;
      } else if (typeof $value != "object" && typeof $value != "function") {
        parts.push(`${$value}`);
      }
    }
    index++;
  }
  return [(element) => {
    element.style.cssText = parts?.join?.(";") ?? element.style.cssText;
    const subs = [];
    for (const [name, value] of vars) {
      subs.push(bindWith(element, name, value, handleStyleChange));
    }
    return () => {
      for (const sub of subs) {
        sub?.();
      }
    };
  }, props, vars];
};
const css = (strings, ...values) => {
  return S(strings, ...values);
};

const getBy = (tasks = [], taskId) => {
  return tasks.find((t) => taskId == t || typeof t.taskId == "string" && t.taskId?.replace?.(/^#/, "") == (typeof taskId == "string" ? taskId?.replace?.(/^#/, "") : null));
};
const historyBack = (tasks = []) => {
  setIgnoreNextPopState(true);
  history?.back?.();
  const lastFocus = getFocused(tasks, false)?.taskId || "";
  if (location?.hash?.trim?.()?.replace?.(/^#/, "")?.trim?.() != lastFocus?.trim?.()?.replace?.(/^#/, "")?.trim?.()) {
    setIgnoreNextPopState(true);
    history?.replaceState?.("", "", lastFocus);
  }
  return tasks;
};
const getFocused = (tasks = [], includeHash = true) => {
  return tasks.findLast((t) => t.active) ?? (includeHash ? tasks?.find?.((t) => t.taskId?.replace?.(/^#/, "") == location.hash?.replace?.(/^#/, "")) : null);
};
const registerTask = (task, onClose) => {
  return registerCloseable({
    id: `task-${task.taskId?.replace?.(/^#/, "") ?? task.taskId}`,
    priority: ClosePriority.TASK,
    group: "task",
    isActive: () => task.active === true,
    close: (view) => {
      task.active = false;
      return onClose?.() ?? false;
    }
  });
};
const navigationEnable = (tasks, taskEnvAction) => {
  let processingHashChange = false;
  initBackNavigation({
    preventDefaultNavigation: false,
    pushInitialState: false
  });
  if (taskEnvAction) {
    registerCloseable({
      id: "task-env-manager",
      priority: ClosePriority.VIEW,
      // Low priority
      isActive: () => !!getFocused(tasks, true),
      close: () => {
        const focused = getFocused(tasks, true);
        if (focused && taskEnvAction(focused)) {
          return true;
        }
        return false;
      }
    });
  }
  addEvent(window, "hashchange", (ev) => {
    if (processingHashChange || getIgnoreNextPopState()) return;
    processingHashChange = true;
    try {
      const fc = getBy(tasks, location.hash);
      if (fc) {
        fc.focus = true;
      } else {
        const hash = getFocused(tasks, false)?.taskId || location.hash || "";
        if (location.hash?.trim?.()?.replace?.(/^#/, "")?.trim?.() != hash?.trim?.()?.replace?.(/^#/, "")?.trim?.()) {
          setIgnoreNextPopState(true);
          const state = history.state || {};
          history?.replaceState?.(state, "", hash);
        }
        ;
      }
      ;
    } finally {
      processingHashChange = false;
    }
  });
  if (!history.state?.backNav) {
    setIgnoreNextPopState(true);
    const state = history.state || {};
    history?.replaceState?.({ ...state, backNav: true, depth: history.length }, "", location.hash || "#");
    setIgnoreNextPopState(false);
  }
  return tasks;
};

class Task {
  $active = false;
  $action;
  payload;
  taskId;
  list;
  _unregisterBack;
  //
  constructor(taskId, list, state = null, payload = {}, action) {
    this.taskId = taskId;
    this.list = list;
    this.payload = payload;
    Object.assign(this, state);
    this.$action = action ?? (() => {
      if (location.hash != this.taskId && this.taskId) {
        setIgnoreNextPopState(true);
        history.replaceState("", "", this.taskId || location.hash);
        setIgnoreNextPopState(false);
        return;
      }
    });
    this.addSelfToList(list, true);
  }
  //
  addSelfToList(list, doFocus = false) {
    if (list == null) return this;
    const has = getBy(list, this);
    if (has != this) {
      if (!has) {
        list?.push(makeTask(this));
      } else {
        Object.assign(has, this);
      }
    }
    this.list = list;
    if (doFocus) {
      this.focus = true;
    }
    setIgnoreNextPopState(true);
    history.pushState({ backNav: true }, "", getFocused(list, false)?.taskId || location.hash);
    setIgnoreNextPopState(false);
    document.dispatchEvent(new CustomEvent("task-focus", { detail: this, bubbles: true, composed: true, cancelable: true }));
    return this;
  }
  //
  get active() {
    return !!this.$active;
  }
  get order() {
    return this.list?.findIndex?.((t) => t == this || typeof t.taskId == "string" && t.taskId == this.taskId) ?? -1;
  }
  get focus() {
    if (!this.taskId) return false;
    const task = this.list?.findLast?.((t) => t.active) ?? null;
    if (!task) return false;
    if (task?.taskId && task?.taskId == this.taskId) {
      return true;
    }
    ;
    return false;
  }
  //
  set active(activeStatus) {
    if (this != null && this?.$active != activeStatus) {
      this.$active = activeStatus;
      if (activeStatus) {
        this._unregisterBack = registerTask(this);
      } else {
        this._unregisterBack?.();
        this._unregisterBack = void 0;
      }
      document.dispatchEvent(new CustomEvent("task-focus", { detail: getFocused(this.list ?? [], false), bubbles: true, composed: true, cancelable: true }));
    }
  }
  //
  set focus(activeStatus) {
    if (activeStatus && activeStatus != this.focus) {
      const index = this.order;
      if (!this.focus && index >= 0) {
        const last = this.list?.findLastIndex?.((t) => t.focus) ?? -1;
        if (index < last || last < 0) {
          if (this.list) for (const task of this.list) {
            if (task != this && task?.taskId != this.taskId) {
              task.focus = false;
            }
          }
          this.list?.[$triggerLess]?.(() => {
            this.list?.splice?.(index, 1);
            this.list?.push?.(makeTask(this));
          });
          document.dispatchEvent(new CustomEvent("task-focus", { detail: getFocused(this.list ?? [], false), bubbles: true, composed: true, cancelable: true }));
        }
        this.takeAction();
      }
    }
  }
  //
  takeAction() {
    return this.$action?.call?.(this);
  }
  //
  removeFromList() {
    if (!this.list) return this;
    const index = this.list.indexOf(getBy(this.list, this) ?? makeTask(this)) ?? -1;
    if (index >= 0) {
      this.list.splice(index, 1);
    }
    const list = this.list;
    this.list = null;
    document.dispatchEvent(new CustomEvent("task-focus", { detail: getFocused(list ?? [], false), bubbles: true, composed: true, cancelable: true }));
    return this;
  }
}
const makeTask = (taskId, list, state = null, payload = {}, action) => {
  if (taskId instanceof Task) return observe(taskId);
  const task = new Task(taskId, list, state, payload, action);
  return observe(task);
};
const makeTasks = (createCb) => {
  const tasks = observe([]);
  const result = createCb(tasks);
  return tasks;
};

const hubsByTarget = /* @__PURE__ */ new WeakMap();
const keyOf = (type, options) => {
  const capture = options?.capture ? "1" : "0";
  const passive = options?.passive ? "1" : "0";
  return `${type}|c:${capture}|p:${passive}`;
};
const lazyAddEventListener = (target, type, handler, options = {}) => {
  if (!target || typeof target.addEventListener !== "function") return () => {
  };
  const normalized = {
    capture: Boolean(options.capture),
    passive: Boolean(options.passive)
  };
  const key = keyOf(type, normalized);
  let hubs = hubsByTarget.get(target);
  if (!hubs) {
    hubs = /* @__PURE__ */ new Map();
    hubsByTarget.set(target, hubs);
  }
  let hub = hubs.get(key);
  if (!hub) {
    const handlers = /* @__PURE__ */ new Set();
    const listener = (ev) => {
      for (const cb of Array.from(handlers)) {
        try {
          cb(ev);
        } catch (e) {
          console.warn(e);
        }
      }
    };
    hubs.set(key, hub = { handlers, listener, options: normalized });
    target.addEventListener(type, listener, normalized);
  }
  hub.handlers.add(handler);
  return () => {
    const hubsNow = hubsByTarget.get(target);
    const hubNow = hubsNow?.get(key);
    if (!hubNow) return;
    hubNow.handlers.delete(handler);
    if (hubNow.handlers.size > 0) return;
    target.removeEventListener(type, hubNow.listener, hubNow.options);
    hubsNow?.delete(key);
    if (hubsNow && hubsNow.size === 0) hubsByTarget.delete(target);
  };
};
const proxiedByRoot = /* @__PURE__ */ new WeakMap();
const resolveHTMLElement = (el) => {
  const resolved = el?.element ?? el;
  return resolved instanceof HTMLElement ? resolved : null;
};
const shouldApply = (when, hadMatch, hadHandled) => {
  if (!when) return false;
  if (when === "handled") return hadHandled;
  return hadMatch;
};
const addProxiedEvent = (root, type, options = { capture: true, passive: false }, config = {}) => {
  const target = root;
  if (!target || typeof target.addEventListener !== "function") {
    return (_element, _handler) => () => {
    };
  }
  const normalized = {
    capture: Boolean(options.capture),
    passive: Boolean(options.passive)
  };
  const strategy = config.strategy ?? "closest";
  const key = `${type}|c:${normalized.capture ? "1" : "0"}|p:${normalized.passive ? "1" : "0"}|s:${strategy}|pd:${String(config.preventDefault ?? "")}|sp:${String(config.stopPropagation ?? "")}|sip:${String(config.stopImmediatePropagation ?? "")}`;
  let hubs = proxiedByRoot.get(target);
  if (!hubs) {
    hubs = /* @__PURE__ */ new Map();
    proxiedByRoot.set(target, hubs);
  }
  let hub = hubs.get(key);
  if (!hub) {
    const targets = /* @__PURE__ */ new Map();
    const dispatch = (ev) => {
      let hadMatch = false;
      let hadHandled = false;
      const callSet = (set) => {
        if (!set || set.size === 0) return;
        hadMatch = true;
        for (const cb of Array.from(set)) {
          const r = cb(ev);
          if (r) hadHandled = true;
        }
      };
      const path = ev?.composedPath?.();
      if (Array.isArray(path)) {
        if (strategy === "closest") {
          for (const n of path) {
            const el = resolveHTMLElement(n);
            if (!el) continue;
            const set = targets.get(el);
            if (!set) continue;
            callSet(set);
            break;
          }
        } else {
          for (const n of path) {
            const el = resolveHTMLElement(n);
            if (!el) continue;
            callSet(targets.get(el));
          }
        }
      } else {
        let cur = resolveHTMLElement(ev?.target);
        while (cur) {
          const set = targets.get(cur);
          if (set) {
            callSet(set);
            if (strategy === "closest") break;
          }
          const r = cur.getRootNode?.();
          cur = cur.parentElement || (r instanceof ShadowRoot ? r.host : null);
        }
      }
      if (shouldApply(config.preventDefault, hadMatch, hadHandled)) ev?.preventDefault?.();
      if (shouldApply(config.stopImmediatePropagation, hadMatch, hadHandled)) ev?.stopImmediatePropagation?.();
      if (shouldApply(config.stopPropagation, hadMatch, hadHandled)) ev?.stopPropagation?.();
    };
    hub = { targets, unbindGlobal: null, options: normalized, strategy, config, dispatch };
    hubs.set(key, hub);
  }
  return (element, handler) => {
    const el = resolveHTMLElement(element);
    if (!el) return () => {
    };
    if (hub.targets.size === 0 && !hub.unbindGlobal) {
      hub.unbindGlobal = lazyAddEventListener(target, type, hub.dispatch, hub.options);
    }
    let set = hub.targets.get(el);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      hub.targets.set(el, set);
    }
    set.add(handler);
    return () => {
      const hubsNow = proxiedByRoot.get(target);
      const h = hubsNow?.get(key);
      if (!h) return;
      const resolved = resolveHTMLElement(element);
      if (!resolved) return;
      const s = h.targets.get(resolved);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) h.targets.delete(resolved);
      if (h.targets.size === 0) {
        h.unbindGlobal?.();
        h.unbindGlobal = null;
        hubsNow?.delete(key);
        if (hubsNow && hubsNow.size === 0) proxiedByRoot.delete(target);
      }
    };
  };
};

const ROOT$1 = typeof document != "undefined" ? document?.documentElement : null;
const SELECTOR = 'ui-modal[type="contextmenu"], ui-button, ui-taskbar, ui-navbar, ui-statusbar, button, label, input, ui-longtext, ui-focustext, ui-row-select, ui-row-button, .u2-input, .ui-input';
const $set = (rv, key, val) => {
  if (rv?.deref?.() != null) {
    return rv.deref()[key] = val;
  }
  ;
};
function makeInterruptTrigger(except = null, ref = booleanRef(false), closeEvents = ["pointerdown", "click", "contextmenu", "scroll"], element = document?.documentElement) {
  if (!element) return () => {
  };
  const wr = new WeakRef(ref);
  const close = typeof ref === "function" ? ref : (ev) => {
    !(except?.contains?.(ev?.target) || ev?.target == (except?.element ?? except)) || !except ? $set(wr, "value", false) : false;
  };
  const listening = closeEvents.map(
    (event) => lazyAddEventListener(element, event, close, { capture: false, passive: false })
  );
  const dispose = () => listening.forEach((ub) => ub?.());
  addToCallChain(ref, Symbol.dispose, dispose);
  return dispose;
}
const doObserve = (holder, parent) => {
  if (!holder) {
    throw Error("Element is null...");
  }
  ;
  if (parent) {
    doContentObserve(parent);
  }
  ;
  doBorderObserve(holder);
};
const makeShiftTrigger = (callable, newItem) => ((evc) => {
  const ev = evc;
  newItem ??= ev?.target ?? newItem;
  if (!newItem.dataset.dragging) {
    const n_coord = [ev.clientX, ev.clientY];
    if (ev?.pointerId >= 0) {
      newItem?.setPointerCapture?.(ev?.pointerId);
    }
    ;
    const shifting = ((evc_l) => {
      const ev_l = evc_l;
      ev_l?.preventDefault?.();
      if (ev_l?.pointerId == ev?.pointerId) {
        const coord = [evc_l.clientX, evc_l.clientY];
        const shift = [coord[0] - n_coord[0], coord[1] - n_coord[1]];
        if (Math.hypot(...shift) > 2) {
          newItem?.style?.setProperty?.("will-change", "inset, transform, translate, z-index");
          unbind?.(ev_l);
          callable?.(ev);
        }
      }
    });
    const releasePointer = ((evc_l) => {
      const ev_l = evc_l;
      if (ev_l?.pointerId == ev?.pointerId) {
        newItem?.releasePointerCapture?.(ev?.pointerId);
        unbind?.(ev_l);
      }
    });
    const handler = {
      "pointermove": shifting,
      "pointercancel": releasePointer,
      "pointerup": releasePointer
    };
    const unbind = ((evc_l) => {
      const ev_l = evc_l;
      if (ev_l?.pointerId == ev?.pointerId) {
        bindings?.forEach((binding) => binding?.());
      }
    });
    const bindings = addEvents(ROOT$1, handler);
  }
});
function deepContains(container, target) {
  let node = target;
  while (node) {
    if (node === container) return true;
    const anyNode = node;
    if (anyNode.assignedSlot) {
      node = anyNode.assignedSlot;
      continue;
    }
    if (node.parentNode) {
      node = node.parentNode;
      continue;
    }
    const root = node.getRootNode?.();
    if (root && root.host) {
      node = root.host;
    } else {
      node = null;
    }
  }
  return false;
}
function isInside(target, container) {
  if ("composedPath" in target && typeof target.composedPath === "function") {
    return target.composedPath().includes(container);
  }
  const node = target.target ? target.target : target;
  return node ? deepContains(container, node) : false;
}
function makeClickOutsideTrigger(ref, except = null, element, options = {}) {
  const {
    root = typeof document != "undefined" ? document?.documentElement : null,
    closeEvents = ["scroll", "click", "pointerdown"],
    mouseLeaveDelay = 100
  } = options;
  let mouseLeaveTimer = null;
  const wr = new WeakRef(ref);
  function onMouseLeave() {
    mouseLeaveTimer = setTimeout(() => {
      $set(wr, "value", false);
    }, mouseLeaveDelay);
  }
  function onMouseEnter() {
    if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
  }
  function onDisposeEvent(ev) {
    if (!isInside(ev, element?.element ?? element) && !isInside(ev, except?.element ?? except)) $set(wr, "value", false);
  }
  function onPointerDown(ev) {
    const t = ev;
    if (!isInside(t, element?.element ?? element) && !isInside(t, except?.element ?? except)) $set(wr, "value", false);
  }
  const listening = [
    ...addEvents(root, Object.fromEntries(closeEvents.map((event) => [event, onDisposeEvent]))),
    addEvent(root, "pointerdown", onPointerDown)
  ];
  if (element) {
  }
  function destroy() {
    listening.forEach((ub) => ub?.());
  }
  addToCallChain(ref, Symbol.dispose, destroy);
  return ref;
}
const OOBTrigger = (element, ref, selector, root = typeof document != "undefined" ? document?.documentElement : null) => {
  ref = toRef$1(ref);
  const checker = (ev) => {
    let $ref = unref(ref);
    const target = selector ? ev?.target?.matches?.(selector) ? ev?.target : (ev?.target ?? root)?.querySelector?.(selector) : ev?.target;
    if (!target || element != target) {
      $ref.value = false;
    }
  };
  const cancel = () => {
    root?.removeEventListener?.("click", checker);
  };
  if (root) root.addEventListener?.("click", checker);
  return cancel;
};

class DecorWith {
  #addition;
  // needs prototype extends with Reflect
  constructor(addition) {
    this.#addition = addition;
  }
  get(target, name) {
    return withCtx(this.#addition, this.#addition?.[name]) ?? withCtx(target, target?.[name]);
  }
  set(target, name, val) {
    if (!Reflect.set(target, name, val)) {
      this.#addition[name] = val;
    }
    return true;
  }
  ownKeys(target) {
    return [...Reflect.ownKeys(target) ?? [], ...Reflect.ownKeys(this.#addition) ?? []];
  }
  getOwnPropertyDescriptor(target, name) {
    return Reflect.getOwnPropertyDescriptor(target, name) ?? Reflect.getOwnPropertyDescriptor(this.#addition, name);
  }
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target) ?? Reflect.getPrototypeOf(this.#addition);
  }
  setPrototypeOf(target, proto) {
    return Reflect.setPrototypeOf(target, proto) ?? Reflect.setPrototypeOf(this.#addition, proto);
  }
  isExtensible(target) {
    return Reflect.isExtensible(target) ?? Reflect.isExtensible(this.#addition);
  }
  preventExtensions(target) {
    return Reflect.preventExtensions(target) ?? Reflect.preventExtensions(this.#addition);
  }
  defineProperty(target, name, desc) {
    return Reflect.defineProperty(this.#addition, name, desc) ?? Reflect.defineProperty(target, name, desc);
  }
  deleteProperty(target, name) {
    return Reflect.deleteProperty(this.#addition, name) ?? Reflect.deleteProperty(target, name);
  }
  //construct(target, args, newTarget) { return Reflect.construct(this.#addition, args, newTarget) ?? Reflect.construct(target, args, newTarget); }
}
const elementPointerMap = /* @__PURE__ */ new WeakMap();
const agWrapEvent = (cb) => {
  const wpb = (ev) => {
    const el = (ev?.target?.matches?.(".ui-orientbox") ? ev?.target : null) || ev?.target?.closest?.(".ui-orientbox");
    if (!el) {
      return cb(ev);
    }
    ;
    let { pointerCache, pointerMap } = elementPointerMap?.getOrInsert?.(el, { pointerCache: /* @__PURE__ */ new Map(), pointerMap: /* @__PURE__ */ new Map() });
    const coord = [ev?.clientX || 0, ev?.clientY || 0];
    const cache = pointerCache?.getOrInsert?.(ev?.pointerId || 0, {
      client: coord,
      orient: null,
      boundingBox: null,
      movement: vector2Ref(0, 0)
    });
    cache.delta = [coord[0] - cache.client[0], coord[1] - cache.client[1]];
    cache.movement.x.value = cache.delta[0];
    cache.movement.y.value = cache.delta[1];
    cache.orient = null, cache.client = coord;
    const pointer = pointerMap?.getOrInsert?.(ev?.pointerId || 0, {
      type: ev?.type || "pointer",
      event: ev,
      target: ev?.target || el,
      cs_box: [el?.offsetWidth || 1, el?.offsetHeight || 1],
      cap_element: null,
      //
      get client() {
        return cache.client;
      },
      get orient() {
        return cache.orient ??= cvt_cs_to_os([...pointer.client || cache.client], [el?.offsetWidth || 1, el?.offsetHeight || 1], orientOf(ev.target || el) || 0);
      },
      get movement() {
        return [cache.movement.x.value, cache.movement.y.value];
      },
      get boundingBox() {
        return cache.boundingBox ??= getBoundingOrientRect(ev?.target || el, orientOf(ev.target || el) || 0);
      },
      //
      capture(element = ev?.target || el) {
        return pointer.cap_element = element?.setPointerCapture?.(ev?.pointerId || 0);
      },
      release(element = null) {
        (element || pointer.cap_element || ev?.target || el)?.releasePointerCapture?.(ev?.pointerId || 0);
        pointer.cap_element = null;
      }
    });
    Object.assign(pointer, {
      type: ev?.type || "pointer",
      event: ev,
      target: ev?.target || el,
      cs_box: [el?.offsetWidth || 1, el?.offsetHeight || 1],
      pointerId: ev?.pointerId || 0
    });
    if (ev?.type == "contextmenu" || ev?.type == "click" || ev?.type == "pointerup" || ev?.type == "pointercancel") {
      pointerMap?.delete?.(ev?.pointerId || 0);
      pointerCache?.delete?.(ev?.pointerId || 0);
      if (ev?.type == "pointercancel") {
        pointer?.release?.();
      }
    }
    ;
    if (pointer && ev) {
      return cb(new Proxy(ev, new DecorWith(pointer)));
    }
    ;
  };
  return wpb;
};
class PointerEdge {
  pointer = [0, 0];
  results;
  //
  constructor(pointer = [0, 0]) {
    this.pointer = pointer;
    this.results = { left: false, top: false, bottom: false, right: false };
  }
  //
  get left() {
    const current = Math.abs(this.pointer[0] - 0) < 10;
    return this.results.left = current;
  }
  get top() {
    const current = Math.abs(this.pointer[1] - 0) < 10;
    return this.results.top = current;
  }
  get right() {
    const current = Math.abs(this.pointer[0] - globalThis.innerWidth) < 10;
    return this.results.right = current;
  }
  get bottom() {
    const current = Math.abs(this.pointer[1] - globalThis.innerHeight) < 10;
    return this.results.bottom = current;
  }
}
;
const preventedPointers = /* @__PURE__ */ new Map();
const clickPrevention = (element, pointerId = 0) => {
  if (preventedPointers.has(pointerId)) {
    return;
  }
  const rmev = () => {
    preventedPointers.delete(pointerId);
    dce?.forEach?.((unbind) => unbind?.());
    ece?.forEach?.((unbind) => unbind?.());
  };
  const preventClick = (e) => {
    if (e?.pointerId == pointerId || e?.pointerId == null || pointerId == null || pointerId < 0) {
      e.preventDefault();
      preventedPointers.set(pointerId, true);
      rmev();
    } else {
      preventedPointers.delete(pointerId);
    }
  };
  const emt = [preventClick, { once: true }];
  const doc = [preventClick, { once: true, capture: true }];
  const dce = addEvents(document.documentElement, {
    "click": doc,
    "pointerdown": doc,
    "contextmenu": doc
  });
  const ece = addEvents(element, {
    "click": emt,
    "pointerdown": emt,
    "contextmenu": emt
  });
  setTimeout(rmev, 10);
};
let PointerEventDrag = null;
if (typeof PointerEvent != "undefined") {
  PointerEventDrag = class PointerEventDrag extends PointerEvent {
    #holding;
    constructor(type, eventInitDict) {
      super(type, eventInitDict);
      this.#holding = eventInitDict?.holding;
    }
    get holding() {
      return this.#holding;
    }
    get event() {
      return this.#holding?.event;
    }
    get result() {
      return this.#holding?.result;
    }
    get shifting() {
      return this.#holding?.shifting;
    }
    get modified() {
      return this.#holding?.modified;
    }
    get canceled() {
      return this.#holding?.canceled;
    }
    get duration() {
      return this.#holding?.duration;
    }
    get element() {
      return this.#holding?.element?.deref?.() ?? null;
    }
    get propertyName() {
      return this.#holding?.propertyName ?? "drag";
    }
  };
} else {
  PointerEventDrag = class PointerEventDrag {
    #holding;
    constructor(type, eventInitDict) {
      this.#holding = eventInitDict?.holding;
    }
    get holding() {
      return this.#holding;
    }
  };
}
const draggingPointerMap = /* @__PURE__ */ new WeakMap();
const grabForDrag = (em, ex = { pointerId: 0, pointerType: "mouse" }, {
  shifting = [0, 0],
  result = [{ value: 0 }, { value: 0 }]
} = {}) => {
  let last = ex;
  let frameTime = 0.01, lastLoop = performance.now(), thisLoop;
  const filterStrength = 100;
  const computeDuration = () => {
    var thisFrameTime = (thisLoop = performance.now()) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
    return frameTime;
  };
  const hm = {
    result,
    movement: [...ex?.movement || [0, 0]],
    shifting: [...shifting],
    modified: [...shifting],
    canceled: false,
    duration: frameTime,
    element: new WeakRef(em),
    client: null
    ///[0, 0]
  };
  const moveEvent = [
    /*agWrapEvent*/
    ((evc) => {
      if (ex?.pointerId == evc?.pointerId) {
        evc?.preventDefault?.();
        if (hasParent(evc?.target, em)) {
          const client = [...evc?.client || [evc?.clientX || 0, evc?.clientY || 0]];
          hm.duration = computeDuration();
          hm.movement = [...hm.client ? [client?.[0] - (hm.client?.[0] || 0), client?.[1] - (hm.client?.[1] || 0)] : [0, 0]];
          hm.client = client;
          hm.shifting[0] += hm.movement[0] || 0, hm.shifting[1] += hm.movement[1] || 0;
          hm.modified[0] = (hm.shifting[0] ?? hm.modified[0]) || 0, hm.modified[1] = (hm.shifting[1] ?? hm.modified[1]) | 0;
          em?.dispatchEvent?.(new PointerEventDrag("m-dragging", {
            ...evc,
            bubbles: true,
            holding: hm,
            event: evc
          }));
          if (hm?.result?.[0] != null) hm.result[0].value = hm.modified[0] || 0;
          if (hm?.result?.[1] != null) hm.result[1].value = hm.modified[1] || 0;
          if (hm?.result?.[2] != null) hm.result[2].value = 0;
        }
      }
    }),
    { capture: true }
  ];
  const promised = Promise.withResolvers();
  const releaseEvent = [
    /*agWrapEvent*/
    ((evc) => {
      if (ex?.pointerId == evc?.pointerId) {
        const elm = em?.element || em;
        if (hasParent(evc?.target, elm) || evc?.currentTarget?.contains?.(elm) || evc?.target == elm) {
          if (evc?.type == "pointerup") {
            clickPrevention(elm, evc?.pointerId);
          }
          ;
          queueMicrotask(() => promised?.resolve?.(result));
          bindings?.forEach?.((binding) => binding?.());
          elm?.releaseCapturePointer?.(evc?.pointerId);
          elm?.dispatchEvent?.(new PointerEventDrag("m-dragend", { ...evc, bubbles: true, holding: hm, event: evc }));
          hm.canceled = true;
          try {
            ex.pointerId = -1;
          } catch (_) {
          }
        }
      }
    }),
    { capture: true }
  ];
  let bindings = null;
  clickPrevention(em, ex?.pointerId);
  queueMicrotask(() => {
    if (em?.dispatchEvent?.(new PointerEventDrag("m-dragstart", { ...ex, bubbles: true, holding: hm, event: ex }))) {
      em?.setPointerCapture?.(ex?.pointerId);
      bindings = addEvents(em, {
        "pointermove": moveEvent,
        "pointercancel": releaseEvent,
        "pointerup": releaseEvent
      });
      bindings?.push?.(...addEvents(document.documentElement, {
        "pointercancel": releaseEvent,
        "pointerup": releaseEvent
      }));
    } else {
      hm.canceled = true;
    }
  });
  return promised?.promise ?? result;
};
const bindDraggable = (elementOrEventListener, onEnd = () => {
}, draggable = [{ value: 0 }, { value: 0 }], shifting = [0, 0]) => {
  if (!draggable) {
    return;
  }
  const process = (ev, el) => grabForDrag(el ?? elementOrEventListener, ev, { result: draggable, shifting: typeof shifting == "function" ? shifting?.(draggable) : shifting })?.then?.(onEnd);
  if (typeof elementOrEventListener?.addEventListener == "function") {
    addEvent(elementOrEventListener, "pointerdown", process);
  } else if (typeof elementOrEventListener == "function") {
    elementOrEventListener(process);
  } else {
    throw new Error("bindDraggable: elementOrEventListener is not a function or an object with addEventListener");
  }
  const dispose = () => {
    if (typeof elementOrEventListener?.removeEventListener == "function") {
      removeEvent(elementOrEventListener, "pointerdown", process);
    }
  };
  return { draggable, dispose, process };
};

const _LOG_ = (...args) => {
  console.log(...args);
  return args?.[0];
};
class DragHandler {
  #holder;
  #dragging;
  #raf = 0;
  #pending;
  #options;
  #subscriptions;
  // @ts-ignore
  get #parent() {
    return this.#holder.offsetParent ?? this.#holder?.host ?? ROOT$2;
  }
  //
  constructor(holder, options) {
    if (!holder) {
      throw Error("Element is null...");
    }
    doObserve(this.#holder = holder, this.#parent);
    this.#dragging = vector2Ref(0, 0);
    this.#pending = vector2Ref(0, 0);
    this.#options = options;
    setStyleProperty(this.#holder, "--drag-x", 0);
    setStyleProperty(this.#holder, "--drag-y", 0);
    this.#attachObservers();
    if (options) this.draggable(options);
  }
  //
  #queueFrame(x = 0, y = 0) {
    let constrainedX = x || 0;
    let constrainedY = y || 0;
    if (this.#options?.constraints?.bounds) {
      const bounds = this.#options.constraints.bounds;
      const centerOffset = this.#options.constraints.centerOffset || vector2Ref(0, 0);
      const elementSize = vector2Ref(this.#holder.offsetWidth, this.#holder.offsetHeight);
      const elementBounds = createRect2D(constrainedX, constrainedY, elementSize.x, elementSize.y);
      const constrainedPos = clampPointToRect(
        new Vector2D(constrainedX + centerOffset.x.value, constrainedY + centerOffset.y.value),
        bounds
      );
      constrainedX = constrainedPos.x.value - centerOffset.x.value;
      constrainedY = constrainedPos.y.value - centerOffset.y.value;
    }
    if (this.#options?.constraints?.snapToGrid) {
      const { size: gridSize, offset: gridOffset } = this.#options.constraints.snapToGrid;
      constrainedX = Math.round((constrainedX - gridOffset.x.value) / gridSize.x.value) * gridSize.x.value + gridOffset.x.value;
      constrainedY = Math.round((constrainedY - gridOffset.y.value) / gridSize.y.value) * gridSize.y.value + gridOffset.y.value;
    }
    this.#pending.x.value = constrainedX;
    this.#pending.y.value = constrainedY;
    if (this.#raf) {
      return;
    }
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0;
      const dx = this.#pending.x.value;
      const dy = this.#pending.y.value;
      setStyleProperty(this.#holder, "transform", `translate3d(
                clamp(calc(-1px * var(--shift-x, 0)), ${dx || 0}px, calc(100cqi - 100% - var(--shift-x, 0) * 1px)),
                clamp(calc(-1px * var(--shift-y, 0)), ${dy || 0}px, calc(100cqb - 100% - var(--shift-y, 0) * 1px)),
                0px)`?.trim?.()?.replaceAll?.(/\s+/g, " ")?.replaceAll?.(/\n+/g, " ")?.trim?.() ?? "");
    });
  }
  #attachObservers() {
    if (this.#subscriptions) {
      return;
    }
    const emit = () => {
      this.#queueFrame(
        this.#dragging.x.value,
        this.#dragging.y.value
      );
    };
    this.#subscriptions = [
      affected(this.#dragging.x, emit),
      affected(this.#dragging.y, emit)
    ];
    emit();
  }
  //
  draggable(options) {
    const handler = options.handler ?? this.#holder;
    const dragging = this.#dragging;
    this.#attachObservers();
    const weak = new WeakRef(this.#holder);
    const binding = (grabAction) => handler.addEventListener("pointerdown", makeShiftTrigger((ev) => grabAction(ev, this.#holder), this.#holder));
    const dragResolve = (dragging2) => {
      const holder = weak?.deref?.();
      holder?.style?.removeProperty?.("will-change");
      queueMicrotask(() => {
        holder?.removeAttribute?.("data-dragging");
        holder?.style?.removeProperty?.("transform");
      });
      const box = (
        /*getBoundingOrientRect(holder) ||*/
        holder?.getBoundingClientRect?.()
      );
      this.#dragging.x.value = 0;
      this.#dragging.y.value = 0;
      this.#queueFrame(0, 0);
      setStyleProperty(holder, "--shift-x", box?.left || 0);
      setStyleProperty(holder, "--shift-y", box?.top || 0);
    };
    const draggingArray = [this.#dragging.x, this.#dragging.y];
    return bindDraggable(binding, dragResolve, draggingArray, () => {
      const holder = weak?.deref?.();
      holder?.setAttribute?.("data-dragging", "");
      holder?.style?.setProperty("will-change", "inset, translate, transform, opacity, z-index");
      this.#queueFrame(this.#dragging.x.value, this.#dragging.y.value);
      return [0, 0];
    });
  }
}

class ResizeHandler {
  #holder;
  #resizing;
  // @ts-ignore
  get #parent() {
    return this.#holder.offsetParent ?? this.#holder?.host ?? ROOT$2;
  }
  //
  constructor(holder, options) {
    if (!holder) {
      throw Error("Element is null...");
    }
    doObserve(this.#holder = holder, this.#parent);
    this.#resizing = vector2Ref(0, 0);
    if (options) this.resizable(options);
  }
  //
  limitResize(real, virtual, holder, container) {
    const widthDiff = cbw(holder) - (bbw(holder) - (this.#resizing.x.value || 0));
    const heightDiff = cbh(holder) - (bbh(holder) - (this.#resizing.y.value || 0));
    real[0] = clamp$1(0, virtual?.[0] || 0, widthDiff) || 0;
    real[1] = clamp$1(0, virtual?.[1] || 0, heightDiff) || 0;
    return real;
  }
  // TODO! Resizing v2 (full reworking for performance)
  resizable(options) {
    const handler = options.handler ?? this.#holder, status = { pointerId: -1 };
    const resizing = this.#resizing, weak = new WeakRef(this.#holder), self_w = new WeakRef(this);
    const dragResolve = (dragging) => {
      const holder = weak?.deref?.();
      holder?.style?.removeProperty?.("will-change");
      queueMicrotask(() => {
        holder?.removeAttribute?.("data-resizing");
      });
    };
    const binding = (grabAction) => handler.addEventListener("pointerdown", makeShiftTrigger((ev) => grabAction(ev, this.#holder), this.#holder));
    const initDrag = () => {
      const starting = [this.#resizing.x.value || 0, this.#resizing.y.value || 0];
      const holder = weak?.deref?.();
      const parent = this.#parent;
      self_w?.deref?.()?.limitResize?.(starting, starting, holder, parent);
      holder?.setAttribute?.("data-resizing", "");
      return starting;
    };
    const resizingArray = [this.#resizing.x, this.#resizing.y];
    E(this.#holder, { style: {
      "--resize-x": this.#resizing.x,
      "--resize-y": this.#resizing.y
    } });
    return bindDraggable(binding, dragResolve, resizingArray, initDrag);
  }
}

class SelectionController {
  target;
  options;
  selectionRect;
  overlayElement;
  isActive = false;
  startPoint;
  currentPoint;
  dragStart;
  resizeHandle;
  // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  constructor(options = {}) {
    this.options = {
      target: document.body,
      minSize: vector2Ref(10, 10),
      maxSize: vector2Ref(globalThis.innerWidth, globalThis.innerHeight),
      showHandles: true,
      style: {
        border: "2px solid #007acc",
        background: "rgba(0, 122, 204, 0.1)",
        borderRadius: "0",
        zIndex: 9999
      },
      ...options
    };
    this.target = this.options.target;
  }
  /**
   * Start selection mode - attaches event listeners
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.createOverlay();
    this.attachEvents();
  }
  /**
   * Stop selection mode - removes event listeners and overlay
   */
  stop() {
    if (!this.isActive) return;
    this.isActive = false;
    this.removeOverlay();
    this.detachEvents();
    this.options.onCancel?.();
  }
  /**
   * Get current selection rectangle
   */
  getSelection() {
    return this.selectionRect || null;
  }
  /**
   * Set selection programmatically
   */
  setSelection(rect) {
    this.selectionRect = rect;
    this.updateOverlay();
    this.options.onChange?.(rect);
  }
  /**
   * Clear current selection
   */
  clearSelection() {
    this.selectionRect = void 0;
    this.updateOverlay();
    this.options.onCancel?.();
  }
  createOverlay() {
    if (this.overlayElement) return;
    this.overlayElement = document.createElement("div");
    Object.assign(this.overlayElement.style, {
      position: "fixed",
      pointerEvents: "none",
      boxSizing: "border-box",
      ...this.options.style
    });
    if (this.options.showHandles) {
      this.createResizeHandles();
    }
    this.target.appendChild(this.overlayElement);
  }
  createResizeHandles() {
    if (!this.overlayElement) return;
    const handles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
    const handleElements = [];
    handles.forEach((handle) => {
      const handleEl = document.createElement("div");
      handleEl.setAttribute("data-handle", handle);
      Object.assign(handleEl.style, {
        position: "absolute",
        width: handle.length === 1 ? "100%" : "8px",
        height: handle.length === 1 ? "8px" : "100%",
        background: this.options.style?.border || "#007acc",
        cursor: this.getCursorForHandle(handle),
        pointerEvents: "auto"
      });
      this.positionHandle(handleEl, handle);
      handleEl.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        this.startResize(handle, vector2Ref(e.clientX, e.clientY));
      });
      this.overlayElement.appendChild(handleEl);
      handleElements.push(handleEl);
    });
  }
  positionHandle(handleEl, handle) {
    const style = handleEl.style;
    switch (handle) {
      case "nw":
        style.top = style.left = "0";
        break;
      case "ne":
        style.top = "0";
        style.right = "0";
        break;
      case "sw":
        style.bottom = style.left = "0";
        break;
      case "se":
        style.bottom = style.right = "0";
        break;
      case "n":
        style.top = "0";
        style.left = "50%";
        style.transform = "translateX(-50%)";
        break;
      case "s":
        style.bottom = "0";
        style.left = "50%";
        style.transform = "translateX(-50%)";
        break;
      case "e":
        style.top = "50%";
        style.right = "0";
        style.transform = "translateY(-50%)";
        break;
      case "w":
        style.top = "50%";
        style.left = "0";
        style.transform = "translateY(-50%)";
        break;
    }
  }
  getCursorForHandle(handle) {
    const cursors = {
      "nw": "nw-resize",
      "ne": "ne-resize",
      "sw": "sw-resize",
      "se": "se-resize",
      "n": "n-resize",
      "s": "s-resize",
      "e": "e-resize",
      "w": "w-resize"
    };
    return cursors[handle] || "pointer";
  }
  attachEvents() {
    this.target.addEventListener("pointerdown", this.handlePointerDown);
    this.target.addEventListener("pointermove", this.handlePointerMove);
    this.target.addEventListener("pointerup", this.handlePointerUp);
    document.addEventListener("keydown", this.handleKeyDown);
  }
  detachEvents() {
    this.target.removeEventListener("pointerdown", this.handlePointerDown);
    this.target.removeEventListener("pointermove", this.handlePointerMove);
    this.target.removeEventListener("pointerup", this.handlePointerUp);
    document.removeEventListener("keydown", this.handleKeyDown);
  }
  handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const point = vector2Ref(e.clientX, e.clientY);
    const handle = this.getHandleAtPoint(point);
    if (handle) {
      this.startResize(handle, point);
      return;
    }
    if (this.selectionRect && rectContainsPoint(this.selectionRect, point).value) {
      this.startDrag(point);
      return;
    }
    this.startSelection(point);
  };
  handlePointerMove = (e) => {
    const point = vector2Ref(e.clientX, e.clientY);
    if (this.resizeHandle) {
      this.updateResize(point);
    } else if (this.dragStart) {
      this.updateDrag(point);
    } else if (this.startPoint) {
      this.updateSelection(point);
    }
  };
  handlePointerUp = (e) => {
    if (this.resizeHandle) {
      this.endResize();
    } else if (this.dragStart) {
      this.endDrag();
    } else if (this.startPoint) {
      this.endSelection();
    }
  };
  handleKeyDown = (e) => {
    if (e.key === "Escape") {
      this.clearSelection();
    } else if (e.key === "Enter" && this.selectionRect) {
      this.options.onSelect?.(this.selectionRect);
    }
  };
  startSelection(point) {
    this.startPoint = point;
    this.currentPoint = point;
    this.selectionRect = createRect2D(point.x, point.y, 0, 0);
    this.updateOverlay();
  }
  updateSelection(point) {
    if (!this.startPoint || !this.selectionRect) return;
    this.currentPoint = point;
    const minX = Math.min(this.startPoint.x.value, point.x.value);
    const minY = Math.min(this.startPoint.y.value, point.y.value);
    const maxX = Math.max(this.startPoint.x.value, point.x.value);
    const maxY = Math.max(this.startPoint.y.value, point.y.value);
    this.selectionRect.position.x.value = minX;
    this.selectionRect.position.y.value = minY;
    this.selectionRect.size.x.value = maxX - minX;
    this.selectionRect.size.y.value = maxY - minY;
    this.applyConstraints();
    this.updateOverlay();
    this.options.onChange?.(this.selectionRect);
  }
  endSelection() {
    if (!this.selectionRect) return;
    if (this.selectionRect.size.x.value < this.options.minSize.x.value || this.selectionRect.size.y.value < this.options.minSize.y.value) {
      this.clearSelection();
      return;
    }
    this.options.onSelect?.(this.selectionRect);
    this.startPoint = void 0;
    this.currentPoint = void 0;
  }
  startDrag(point) {
    if (!this.selectionRect) return;
    this.dragStart = point;
  }
  updateDrag(point) {
    if (!this.dragStart || !this.selectionRect) return;
    const delta = subtractVector2D(point, this.dragStart);
    this.selectionRect.position = addVector2D(this.selectionRect.position, delta);
    this.dragStart = point;
    if (this.options.bounds) {
      this.selectionRect.position = clampPointToRect(this.selectionRect.position, this.options.bounds);
    }
    this.updateOverlay();
    this.options.onChange?.(this.selectionRect);
  }
  endDrag() {
    this.dragStart = void 0;
  }
  startResize(handle, point) {
    this.resizeHandle = handle;
    this.dragStart = point;
  }
  updateResize(point) {
    if (!this.resizeHandle || !this.dragStart || !this.selectionRect) return;
    const delta = subtractVector2D(point, this.dragStart);
    this.resizeFromHandle(this.resizeHandle, delta);
    this.dragStart = point;
    this.applyConstraints();
    this.updateOverlay();
    this.options.onChange?.(this.selectionRect);
  }
  resizeFromHandle(handle, delta) {
    if (!this.selectionRect) return;
    const rect = this.selectionRect;
    let newX = rect.position.x.value;
    let newY = rect.position.y.value;
    let newWidth = rect.size.x.value;
    let newHeight = rect.size.y.value;
    switch (handle) {
      case "nw":
        newX += delta.x.value;
        newY += delta.y.value;
        newWidth -= delta.x.value;
        newHeight -= delta.y.value;
        break;
      case "ne":
        newY += delta.y.value;
        newWidth += delta.x.value;
        newHeight -= delta.y.value;
        break;
      case "sw":
        newX += delta.x.value;
        newWidth -= delta.x.value;
        newHeight += delta.y.value;
        break;
      case "se":
        newWidth += delta.x.value;
        newHeight += delta.y.value;
        break;
      case "n":
        newY += delta.y.value;
        newHeight -= delta.y.value;
        break;
      case "s":
        newHeight += delta.y.value;
        break;
      case "e":
        newWidth += delta.x.value;
        break;
      case "w":
        newX += delta.x.value;
        newWidth -= delta.x.value;
        break;
    }
    if (newWidth < 0) {
      newX += newWidth;
      newWidth = -newWidth;
    }
    if (newHeight < 0) {
      newY += newHeight;
      newHeight = -newHeight;
    }
    rect.position.x.value = newX;
    rect.position.y.value = newY;
    rect.size.x.value = newWidth;
    rect.size.y.value = newY;
  }
  endResize() {
    this.resizeHandle = void 0;
    this.dragStart = void 0;
  }
  applyConstraints() {
    if (!this.selectionRect) return;
    const rect = this.selectionRect;
    if (this.options.aspectRatio) {
      const currentRatio = rect.size.x.value / rect.size.y.value;
      const targetRatio = this.options.aspectRatio;
      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        if (currentRatio > targetRatio) {
          rect.size.y.value = rect.size.x.value / targetRatio;
        } else {
          rect.size.x.value = rect.size.y.value * targetRatio;
        }
      }
    }
    rect.size.x.value = Math.max(
      this.options.minSize.x.value,
      Math.min(this.options.maxSize.x.value, rect.size.x.value)
    );
    rect.size.y.value = Math.max(
      this.options.minSize.y.value,
      Math.min(this.options.maxSize.y.value, rect.size.y.value)
    );
    if (this.options.bounds) {
      rect.position.x.value = Math.max(
        this.options.bounds.position.x.value,
        Math.min(
          rect.position.x.value,
          this.options.bounds.position.x.value + this.options.bounds.size.x.value - rect.size.x.value
        )
      );
      rect.position.y.value = Math.max(
        this.options.bounds.position.y.value,
        Math.min(
          rect.position.y.value,
          this.options.bounds.position.y.value + this.options.bounds.size.y.value - rect.size.y.value
        )
      );
    }
    if (this.options.snapToGrid) {
      const { size: gridSize, offset: gridOffset } = this.options.snapToGrid;
      rect.position.x.value = Math.round((rect.position.x.value - gridOffset.x.value) / gridSize.x.value) * gridSize.x.value + gridOffset.x.value;
      rect.position.y.value = Math.round((rect.position.y.value - gridOffset.y.value) / gridSize.y.value) * gridSize.y.value + gridOffset.y.value;
    }
  }
  updateOverlay() {
    if (!this.overlayElement) return;
    if (!this.selectionRect) {
      this.overlayElement.style.display = "none";
      return;
    }
    const rect = this.selectionRect;
    Object.assign(this.overlayElement.style, {
      display: "block",
      left: `${rect.position.x.value}px`,
      top: `${rect.position.y.value}px`,
      width: `${rect.size.x.value}px`,
      height: `${rect.size.y.value}px`
    });
  }
  removeOverlay() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = void 0;
    }
  }
  getHandleAtPoint(point) {
    if (!this.overlayElement || !this.selectionRect) return null;
    const rect = this.selectionRect;
    const handles = this.overlayElement.querySelectorAll("[data-handle]");
    const handleSize = 8;
    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      const handleRect = handle.getBoundingClientRect();
      if (point.x.value >= handleRect.left && point.x.value <= handleRect.right && point.y.value >= handleRect.top && point.y.value <= handleRect.bottom) {
        return handle.getAttribute("data-handle");
      }
    }
    return null;
  }
  /**
   * Get selection as image data (for canvas/screen capture)
   */
  async getSelectionImage() {
    if (!this.selectionRect) return null;
    return null;
  }
  /**
   * Destroy the selection controller
   */
  destroy() {
    this.stop();
    this.clearSelection();
  }
}

class LongHoverHandler {
  #holder;
  //
  constructor(holder, options, fx = (ev) => {
    ev.target.dispatchEvent(new PointerEvent("long-hover", { ...ev, bubbles: true }));
  }) {
    this.#holder = holder;
    holder["@control"] = this;
    if (!holder) {
      throw Error("Element is null...");
    }
    ;
    if (options) {
      this.longHover(options, fx);
    }
    ;
  }
  //
  defaultHandler(ev, weakRef) {
    return weakRef?.deref()?.dispatchEvent?.(new PointerEvent("long-hover", { ...ev, bubbles: true }));
  }
  //
  longHover(options, fx = (ev) => {
    ev.target.dispatchEvent(new PointerEvent("long-hover", { ...ev, bubbles: true }));
  }) {
    const action = { pointerId: -1, timer: null };
    const initiate = ((evc) => {
      const ev = evc;
      if ((ev.target.matches(options.selector) || ev.target.closest(options.selector)) && action.pointerId < 0) {
        action.pointerId = ev.pointerId;
        action.timer = setTimeout(() => {
          fx?.(ev);
        }, options.holdTime ?? 300);
      }
    });
    const cancelEv = ((evc) => {
      const ev = evc;
      if ((ev.target.matches(options.selector) || ev.target.closest(options.selector)) && action.pointerId == ev.pointerId) {
        if (action.timer) {
          clearTimeout(action.timer);
        }
        ;
        action.timer = null;
        action.pointerId = -1;
      }
    });
    addEvents(ROOT$2, {
      "pointerover": initiate,
      "pointerdown": initiate,
      "pointerout": cancelEv,
      "pointerup": cancelEv,
      "pointercancel": cancelEv
    });
  }
}

const defaultOptions = {
  anyPointer: true,
  mouseImmediate: true,
  minHoldTime: 100,
  maxHoldTime: 2e3,
  maxOffsetRadius: 10
};
const preventor = [
  (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  },
  { once: true }
];
class LongPressHandler {
  #holder;
  #preventedPointers;
  //
  constructor(holder, options = { ...defaultOptions }, fx) {
    (this.#holder = holder)["@control"] = this;
    this.#preventedPointers = /* @__PURE__ */ new Set();
    if (!holder) {
      throw Error("Element is null...");
    }
    if (!options) {
      options = { ...defaultOptions };
    }
    const currentClone = { ...options };
    Object.assign(options, defaultOptions, currentClone);
    if (options) {
      this.longPress(options, fx);
    }
  }
  //
  defaultHandler(ev, weakRef) {
    return weakRef?.deref()?.dispatchEvent?.(new PointerEvent("long-press", { ...ev, bubbles: true }));
  }
  //
  longPress(options = { ...defaultOptions }, fx) {
    const ROOT = document.documentElement;
    const weakRef = new WeakRef(this.#holder);
    const actionState = this.initializeActionState();
    this.holding = {
      actionState,
      options,
      fx: fx || ((ev) => this.defaultHandler(ev, weakRef))
    };
    const pointerDownListener = (ev) => this.onPointerDown(this.holding, ev, weakRef);
    const pointerMoveListener = (ev) => this.onPointerMove(this.holding, ev);
    const pointerUpListener = (ev) => this.onPointerUp(this.holding, ev);
    addEvents(ROOT, {
      "pointerdown": pointerDownListener,
      "pointermove": pointerMoveListener,
      "pointerup": pointerUpListener,
      "pointercancel": pointerUpListener
    });
  }
  //
  initializeActionState() {
    return {
      timerId: null,
      immediateTimerId: null,
      pointerId: -1,
      startCoord: [0, 0],
      lastCoord: [0, 0],
      isReadyForLongPress: false,
      cancelCallback: () => {
      },
      cancelPromiseResolver: null,
      cancelPromiseRejector: null
    };
  }
  //
  preventFromClicking(self, ev) {
    if (!this.#preventedPointers.has(ev.pointerId)) {
      this.#preventedPointers.add(ev.pointerId);
      self?.addEventListener?.("click", ...preventor);
      self?.addEventListener?.("contextmenu", ...preventor);
    }
  }
  //
  releasePreventing(self, pointerId) {
    if (this.#preventedPointers.has(pointerId)) {
      this.#preventedPointers.delete(pointerId);
      self?.removeEventListener?.("click", ...preventor);
      self?.removeEventListener?.("contextmenu", ...preventor);
    }
  }
  //
  onPointerDown(self, ev, weakRef) {
    if (!this.isValidTarget(self, ev.target, weakRef) || !(self.options?.anyPointer || ev?.pointerType == "touch")) return;
    ev.preventDefault();
    this.resetAction(self, self.actionState);
    const { actionState } = self;
    actionState.pointerId = ev.pointerId;
    actionState.startCoord = [ev.clientX, ev.clientY];
    actionState.lastCoord = [...actionState.startCoord];
    const $withResolver = Promise.withResolvers();
    actionState.cancelPromiseResolver = $withResolver.resolve;
    actionState.cancelPromiseRejector = $withResolver.reject;
    actionState.cancelCallback = () => {
      clearTimeout(actionState.timerId);
      clearTimeout(actionState.immediateTimerId);
      actionState.isReadyForLongPress = false;
      $withResolver.resolve();
      this.resetAction(self, actionState);
    };
    if (self.options?.mouseImmediate && ev.pointerType === "mouse") {
      self.fx?.(ev);
      return actionState.cancelCallback();
    }
    actionState.timerId = setTimeout(() => {
      actionState.isReadyForLongPress = true;
    }, self.options?.minHoldTime);
    actionState.immediateTimerId = setTimeout(() => {
      if (this.isInPlace(self)) {
        this.preventFromClicking(self, ev);
        self.fx?.(ev);
        actionState.cancelCallback();
      }
    }, self.options?.maxHoldTime);
    Promise.race([
      $withResolver.promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3e3))
    ]).catch(console.warn);
  }
  //
  onPointerMove(self, ev) {
    const { actionState } = self;
    if (ev.pointerId !== actionState.pointerId) return;
    actionState.lastCoord = [ev.clientX, ev.clientY];
    if (!this.isInPlace(self)) {
      return actionState.cancelCallback();
    }
    this.preventFromClicking(self, ev);
    actionState.startCoord = [ev.clientX, ev.clientY];
  }
  //
  resetAction(self, actionState) {
    this.releasePreventing(self, actionState.pointerId);
    actionState.pointerId = -1;
    actionState.cancelPromiseResolver = null;
    actionState.cancelPromiseRejector = null;
    actionState.isReadyForLongPress = false;
    actionState.cancelCallback = null;
  }
  //
  onPointerUp(self, ev) {
    const { actionState } = self;
    if (ev.pointerId !== actionState.pointerId) return;
    actionState.lastCoord = [ev.clientX, ev.clientY];
    if (actionState.isReadyForLongPress && this.isInPlace(self)) {
      self.fx?.(ev);
      this.preventFromClicking(self, ev);
    }
    actionState.cancelCallback();
    this.resetAction(self, actionState);
  }
  //
  holding = { fx: null, options: {}, actionState: {} };
  hasParent(current, parent) {
    while (current) {
      if (current === parent) return true;
      current = current.parentElement;
    }
  }
  isInPlace(self) {
    const { actionState } = self;
    const [startX, startY] = actionState.startCoord;
    const [lastX, lastY] = actionState.lastCoord;
    const distance = Math.hypot(lastX - startX, lastY - startY);
    return distance <= self.options?.maxOffsetRadius;
  }
  //
  isValidTarget(self, target, weakRef) {
    const weakElement = weakRef?.deref?.();
    return weakElement && (this.hasParent(target, weakElement) || target === weakElement) && (!self.options?.handler || target.matches(self.options?.handler));
  }
}

class SwipeHandler {
  #holder;
  //
  constructor(holder, options) {
    (this.#holder = holder)["@control"] = this;
    if (!holder) {
      throw Error("Element is null...");
    }
    if (options) {
      this.swipe(options);
    }
  }
  //
  swipe(options) {
    if (options?.handler) {
      const swipes = /* @__PURE__ */ new Map([]);
      const swipes_w = new WeakRef(swipes);
      const registerMove = (evc) => {
        const ev = evc;
        if (swipes?.has?.(ev.pointerId)) {
          const swipe = swipes?.get?.(ev.pointerId);
          Object.assign(swipe || {}, {
            current: [...ev.client || [ev?.clientX, ev?.clientY]],
            pointerId: ev.pointerId,
            time: performance.now()
          });
        }
      };
      const compAngle = (a, c) => {
        return (a - c + 540) % 360 - 180;
      };
      const completeSwipe = (ev) => {
        const pointerId = ev.pointerId;
        if (swipes?.has?.(pointerId)) {
          const swipe = swipes_w?.deref()?.get?.(pointerId);
          const diffP = [
            swipe.start[0] - swipe.current[0],
            swipe.start[1] - swipe.current[1]
          ];
          const diffT = performance.now() - swipe.startTime;
          const speed = Math.hypot(...diffP) / diffT;
          if ((swipe.speed = speed) > (options.threshold || 0.5)) {
            swipe.direction = "name";
            swipe.swipeAngle = Math.atan2(
              swipe.current[1] - swipe.start[1],
              swipe.current[0] - swipe.start[0]
            );
            if (Math.abs(compAngle(swipe.swipeAngle * (180 / Math.PI), 0)) <= 20) {
              swipe.direction = "left";
            }
            ;
            if (Math.abs(compAngle(swipe.swipeAngle * (180 / Math.PI), 180)) <= 20) {
              swipe.direction = "right";
            }
            ;
            if (Math.abs(compAngle(swipe.swipeAngle * (180 / Math.PI), 270)) <= 20) {
              swipe.direction = "up";
            }
            ;
            if (Math.abs(compAngle(swipe.swipeAngle * (180 / Math.PI), 90)) <= 20) {
              swipe.direction = "down";
            }
            ;
            options?.trigger?.(swipe);
          }
          swipes_w?.deref()?.delete?.(pointerId);
        }
      };
      const takeAction = ((evc) => {
        const ev = evc;
        if (ev.target == options?.handler) {
          swipes?.set(ev.pointerId, {
            target: ev.target,
            start: [...ev.client || [ev?.clientX, ev?.clientY]],
            current: [...ev.client || [ev?.clientX, ev?.clientY]],
            pointerId: ev.pointerId,
            startTime: performance.now(),
            time: performance.now(),
            speed: 0
          });
          ev?.capture?.();
        }
      });
      addEvents(ROOT$2, {
        "pointerdown": takeAction,
        "pointermove": registerMove,
        "pointerup": completeSwipe,
        "pointercancel": completeSwipe
      });
    }
  }
}

const handleByPointer = (cb, root = typeof document != "undefined" ? document?.documentElement : null) => {
  if (!root) return () => {
  };
  let pointerId = -1;
  const rst = (ev) => {
    pointerId = -1;
  };
  const tgi = (ev) => {
    if (pointerId < 0) pointerId = ev.pointerId;
    if (pointerId == ev.pointerId) {
      cb?.(ev);
    }
  };
  const listening = [
    addEvent(root, "pointerup", rst),
    addEvent(root, "pointercancel", rst),
    addEvent(root, "pointermove", tgi)
  ];
  return () => {
    listening.forEach((ub) => ub?.());
  };
};
const handleForFixPosition = (container, cb, root = typeof document != "undefined" ? document?.documentElement : null) => {
  if (!root) return () => {
  };
  const ptu = (ev) => cb?.(ev);
  const listening = [
    addEvent(container, "scroll", ptu),
    addEvent(root, "resize", ptu)
  ];
  const obs = observeContentBox(container, ptu);
  return () => {
    listening.forEach((ub) => ub?.());
    obs?.disconnect?.();
  };
};

function boundingBoxAnchorRef(anchor, options) {
  if (!anchor) return () => {
  };
  const position = vector2Ref(0, 0);
  const size = vector2Ref(0, 0);
  const area = [
    position.x,
    position.y,
    // x, y
    size.x,
    size.y,
    // width, height
    numberRef(0),
    numberRef(0)
    // to right, to bottom (computed)
  ];
  const rect = { position, size };
  const center = rectCenter(rect);
  const reactiveArea = rectArea(rect);
  const { root = anchor?.offsetParent ?? document.documentElement, iterateResize = true, iterateMutations = false } = options || {};
  const elementSize = new ReactiveElementSize(anchor);
  function updateArea() {
    const rect2 = anchor?.getBoundingClientRect?.() ?? {};
    position.x.value = rect2?.left;
    position.y.value = rect2?.top;
    size.x.value = rect2?.right - rect2?.left;
    size.y.value = rect2?.bottom - rect2?.top;
    area[4].value = rect2?.right;
    area[5].value = rect2?.bottom;
  }
  const listening = [
    addEvent(root, "scroll", updateArea, { capture: true }),
    addEvent(window, "resize", updateArea),
    addEvent(window, "scroll", updateArea, { capture: true })
  ];
  let resizeObs;
  if (observeResize && "ResizeObserver" in window && typeof ResizeObserver != "undefined") {
    resizeObs = typeof ResizeObserver != "undefined" ? new ResizeObserver(updateArea) : void 0;
    resizeObs?.observe(anchor);
  }
  let mutationObs;
  if (observeMutations) {
    mutationObs = typeof MutationObserver != "undefined" ? new MutationObserver(updateArea) : void 0;
    mutationObs?.observe(anchor, { attributes: true, childList: true, subtree: true });
  }
  updateArea();
  function destroy() {
    listening.forEach((ub) => ub?.());
    resizeObs?.disconnect?.();
    mutationObs?.disconnect?.();
  }
  if (destroy) {
    area.forEach((ub) => addToCallChain(ub, Symbol.dispose, destroy));
  }
  const enhancedArea = Object.assign(area, {
    position,
    // Vector2D for x, y
    size,
    // Vector2D for width, height
    rect,
    // Rect2D interface
    center,
    // Reactive center point
    area: reactiveArea,
    // Reactive area calculation
    elementSize,
    // ReactiveElementSize instance
    // Rectangle operations
    containsPoint: (point) => rectContainsPoint(rect, point),
    intersects: (otherRect) => rectIntersects(rect, otherRect),
    clampPoint: (point) => clampPointToRect(point, rect),
    distanceToPoint: (point) => pointToRectDistance(point, rect),
    // CSS binding utilities
    bindPosition: (element) => CSSBinder.bindPosition(element, position),
    bindSize: (element) => CSSBinder.bindSize(element, size),
    bindCenter: (element) => CSSBinder.bindPosition(element, center),
    destroy: () => {
      elementSize.destroy();
      destroy();
    }
  });
  return enhancedArea;
}
const bindWithRect = (anchor, area, options) => {
  if (!anchor) return () => {
  };
  if (area?.connectElement) {
    return area?.connectElement?.(anchor, options || {});
  }
  const [left, top, width, height, right, bottom] = area;
  const usb = [];
  if (options?.placement == "fill") {
    usb.push(bindWith(anchor, "inset-block-start", CSSUnitUtils.asPx(left), handleStyleChange));
    usb.push(bindWith(anchor, "inset-inline-start", CSSUnitUtils.asPx(top), handleStyleChange));
    usb.push(bindWith(anchor, "inset-block-end", CSSUnitUtils.asPx(right), handleStyleChange));
    usb.push(bindWith(anchor, "inset-inline-end", CSSUnitUtils.asPx(bottom), handleStyleChange));
    usb.push(bindWith(anchor, "inline-size", CSSUnitUtils.asPx(width), handleStyleChange));
    usb.push(bindWith(anchor, "block-size", CSSUnitUtils.asPx(height), handleStyleChange));
  } else if (options?.placement == "bottom") {
    usb.push(bindWith(anchor, "inset-block-start", CSSUnitUtils.asPx(bottom), handleStyleChange));
    usb.push(bindWith(anchor, "inset-inline-start", CSSUnitUtils.asPx(left), handleStyleChange));
    usb.push(bindWith(anchor, "inline-size", CSSUnitUtils.asPx(width), handleStyleChange));
  } else if (options?.placement == "top") {
    usb.push(bindWith(anchor, "inset-block-end", CSSUnitUtils.asPx(top), handleStyleChange));
    usb.push(bindWith(anchor, "inset-inline-start", CSSUnitUtils.asPx(left), handleStyleChange));
    usb.push(bindWith(anchor, "inline-size", CSSUnitUtils.asPx(width), handleStyleChange));
  } else if (options?.placement == "left") {
    usb.push(bindWith(anchor, "inset-inline-end", CSSUnitUtils.asPx(right), handleStyleChange));
    usb.push(bindWith(anchor, "inset-block-start", CSSUnitUtils.asPx(top), handleStyleChange));
    usb.push(bindWith(anchor, "block-size", CSSUnitUtils.asPx(height), handleStyleChange));
  } else if (options?.placement == "right") {
    usb.push(bindWith(anchor, "inset-inline-start", CSSUnitUtils.asPx(left), handleStyleChange));
    usb.push(bindWith(anchor, "inset-block-start", CSSUnitUtils.asPx(top), handleStyleChange));
    usb.push(bindWith(anchor, "block-size", CSSUnitUtils.asPx(height), handleStyleChange));
  } else if (options?.placement == "center") {
    usb.push(bindWith(anchor, "inset-inline-start", CSSUnitUtils.asPx(left), handleStyleChange));
    usb.push(bindWith(anchor, "inset-block-start", CSSUnitUtils.asPx(top), handleStyleChange));
    usb.push(bindWith(anchor, "inline-size", CSSUnitUtils.asPx(width), handleStyleChange));
    usb.push(bindWith(anchor, "block-size", CSSUnitUtils.asPx(height), handleStyleChange));
  }
  return () => {
    usb?.forEach?.((ub) => ub?.());
  };
};
const bindScrollbarPosition = (scrollbar, anchorBox, axis, options) => {
  const { useIntersection = false, zIndexShift = 1 } = options || {};
  const usb = [];
  if (anchorBox?.connectElement) {
    return anchorBox?.connectElement?.(scrollbar, Object.assign(options || {}, {
      placement: axis == "horizontal" ? "bottom" : "right"
    }));
  }
  scrollbar.style.position = useIntersection ? "fixed" : "absolute";
  scrollbar.style.zIndex = `${zIndexShift}`;
  if (useIntersection) {
    if (axis === "horizontal") {
      usb.push(bindWith(scrollbar, "left", CSSUnitUtils.asPx(anchorBox[0]), handleStyleChange));
      usb.push(bindWith(scrollbar, "top", CSSUnitUtils.asPx(anchorBox[5]), handleStyleChange));
      usb.push(bindWith(scrollbar, "width", CSSUnitUtils.asPx(anchorBox[2]), handleStyleChange));
    } else {
      usb.push(bindWith(scrollbar, "left", CSSUnitUtils.asPx(anchorBox[4]), handleStyleChange));
      usb.push(bindWith(scrollbar, "top", CSSUnitUtils.asPx(anchorBox[1]), handleStyleChange));
      usb.push(bindWith(scrollbar, "height", CSSUnitUtils.asPx(anchorBox[3]), handleStyleChange));
    }
  } else {
    if (axis === "horizontal") {
      usb.push(bindWith(scrollbar, "left", CSSUnitUtils.asPx(anchorBox[0]), handleStyleChange));
      usb.push(bindWith(scrollbar, "top", CSSUnitUtils.asPx(anchorBox[5]), handleStyleChange));
      usb.push(bindWith(scrollbar, "width", CSSUnitUtils.asPx(anchorBox[2]), handleStyleChange));
    } else {
      usb.push(bindWith(scrollbar, "left", CSSUnitUtils.asPx(anchorBox[4]), handleStyleChange));
      usb.push(bindWith(scrollbar, "top", CSSUnitUtils.asPx(anchorBox[1]), handleStyleChange));
      usb.push(bindWith(scrollbar, "height", CSSUnitUtils.asPx(anchorBox[3]), handleStyleChange));
    }
  }
  return () => {
    usb?.forEach?.((ub) => ub?.());
  };
};

const computeIntersectionRect = (anchor, root = document.documentElement, includeExtendedInfo = false) => {
  const rootRect = getBoundingOrientRect(root) ?? root?.getBoundingClientRect?.();
  const anchorRect = getBoundingOrientRect(anchor) ?? anchor?.getBoundingClientRect?.();
  if (!anchorRect) {
    return includeExtendedInfo ? {
      intersection: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
      anchor: { left: 0, top: 0, width: 0, height: 0 },
      root: rootRect
    } : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  const intersectionLeft = Math.max(rootRect.left, anchorRect.left);
  const intersectionTop = Math.max(rootRect.top, anchorRect.top);
  const intersectionRight = Math.min(rootRect.right, anchorRect.right);
  const intersectionBottom = Math.min(rootRect.bottom, anchorRect.bottom);
  const hasIntersection = intersectionRight > intersectionLeft && intersectionBottom > intersectionTop;
  const intersection = hasIntersection ? {
    left: intersectionLeft,
    top: intersectionTop,
    right: intersectionRight,
    bottom: intersectionBottom,
    width: intersectionRight - intersectionLeft,
    height: intersectionBottom - intersectionTop
  } : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  if (includeExtendedInfo) {
    return {
      intersection,
      anchor: anchorRect,
      root: rootRect,
      // Additional properties for shadow/filter calculations
      anchorLeft: anchorRect.left,
      anchorTop: anchorRect.top,
      anchorRight: anchorRect.right,
      anchorBottom: anchorRect.bottom,
      anchorWidth: anchorRect.width,
      anchorHeight: anchorRect.height,
      rootLeft: rootRect.left,
      rootTop: rootRect.top,
      rootWidth: rootRect.width,
      rootHeight: rootRect.height
    };
  }
  return intersection;
};
function intersectionBoxAnchorRef(anchor, options) {
  if (!anchor) return () => {
  };
  const area = [
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0)
  ];
  const { root = anchor?.offsetParent ?? document.documentElement, iterateResize = true, iterateMutations = true, iterateIntersection = true } = options || {};
  function updateArea(intersectionRect) {
    const rect = intersectionRect ? {
      left: intersectionRect.left,
      top: intersectionRect.top,
      width: intersectionRect.width,
      height: intersectionRect.height,
      right: intersectionRect.right,
      bottom: intersectionRect.bottom
    } : computeIntersectionRect(anchor, root, false);
    area[0].value = rect?.left ?? 0;
    area[1].value = rect?.top ?? 0;
    area[2].value = rect?.width ?? 0;
    area[3].value = rect?.height ?? 0;
    area[4].value = rect?.right ?? 0;
    area[5].value = rect?.bottom ?? 0;
  }
  let resizeObs;
  if (observeResize && "ResizeObserver" in window && typeof ResizeObserver != "undefined") {
    resizeObs = typeof ResizeObserver != "undefined" ? new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateArea(entry.contentRect);
      }
    }) : void 0;
    resizeObs?.observe(anchor);
  }
  let mutationObs;
  if (observeMutations) {
    mutationObs = typeof MutationObserver != "undefined" ? new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        updateArea(computeIntersectionRect(anchor, root, false));
      }
    }) : void 0;
    mutationObs?.observe(anchor, { attributes: true, childList: true, subtree: true });
  }
  let intersectionObs;
  if (observeIntersection) {
    intersectionObs = typeof IntersectionObserver != "undefined" ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        updateArea(entry.intersectionRect);
      }
    }, {
      root: root instanceof HTMLElement ? root : null,
      threshold: [0],
      rootMargin: "0px"
    }) : void 0;
    intersectionObs?.observe(anchor);
  }
  const listening = [
    addEvent(root, "scroll", () => updateArea(computeIntersectionRect(anchor, root, false)), { capture: true }),
    addEvent(window, "resize", () => updateArea(computeIntersectionRect(anchor, root, false))),
    addEvent(window, "scroll", () => updateArea(computeIntersectionRect(anchor, root, false)), { capture: true })
  ];
  updateArea(computeIntersectionRect(anchor, root, false));
  function destroy() {
    listening.forEach((ub) => ub?.());
    resizeObs?.disconnect?.();
    mutationObs?.disconnect?.();
    intersectionObs?.disconnect?.();
  }
  if (destroy) {
    area.forEach((ub) => addToCallChain(ub, Symbol.dispose, destroy));
  }
  return area;
}
function enhancedIntersectionBoxAnchorRef(anchor, options) {
  if (!anchor) return () => {
  };
  const area = [
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0),
    // intersection: x, y, width, height, right, bottom
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0),
    // anchor: x, y, width, height
    numberRef(0),
    numberRef(0),
    numberRef(0),
    numberRef(0)
    // root: x, y, width, height
  ];
  const { root = anchor?.offsetParent ?? document.documentElement, iterateResize = true, iterateMutations = true, iterateIntersection = true } = options || {};
  function updateArea(intersectionRect) {
    const data = intersectionRect ? {
      intersection: {
        left: intersectionRect.left,
        top: intersectionRect.top,
        right: intersectionRect.right,
        bottom: intersectionRect.bottom,
        width: intersectionRect.width,
        height: intersectionRect.height
      },
      anchor: getBoundingOrientRect(anchor) ?? anchor?.getBoundingClientRect?.(),
      root: (root instanceof HTMLElement ? getBoundingOrientRect(root) ?? root?.getBoundingClientRect?.() : null) ?? {
        left: 0,
        top: 0,
        right: globalThis.innerWidth,
        bottom: globalThis.innerHeight,
        width: globalThis.innerWidth,
        height: globalThis.innerHeight
      }
    } : computeIntersectionRect(anchor, root, true);
    if (!data.anchor) return;
    area[0].value = data.intersection.left ?? 0;
    area[1].value = data.intersection.top ?? 0;
    area[2].value = data.intersection.width ?? 0;
    area[3].value = data.intersection.height ?? 0;
    area[4].value = data.intersection.right ?? 0;
    area[5].value = data.intersection.bottom ?? 0;
    area[6].value = data.anchor.left ?? 0;
    area[7].value = data.anchor.top ?? 0;
    area[8].value = data.anchor.width ?? 0;
    area[9].value = data.anchor.height ?? 0;
    area[10].value = data.root.left ?? 0;
    area[11].value = data.root.top ?? 0;
    area[12].value = data.root.width ?? 0;
    area[13].value = data.root.height ?? 0;
  }
  let resizeObs;
  if (observeResize && "ResizeObserver" in window && typeof ResizeObserver != "undefined") {
    resizeObs = typeof ResizeObserver != "undefined" ? new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateArea(entry.contentRect);
      }
    }) : void 0;
    resizeObs?.observe(anchor);
  }
  let mutationObs;
  if (observeMutations) {
    mutationObs = typeof MutationObserver != "undefined" ? new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        updateArea(computeIntersectionRect(anchor, root, true).intersection);
      }
    }) : void 0;
    mutationObs?.observe(anchor, { attributes: true, childList: true, subtree: true });
  }
  let intersectionObs;
  if (observeIntersection) {
    intersectionObs = typeof IntersectionObserver != "undefined" ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        updateArea(entry.intersectionRect);
      }
    }, {
      root: root instanceof HTMLElement ? root : null,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      rootMargin: "0px"
    }) : void 0;
    intersectionObs?.observe(anchor);
  }
  const listening = [
    addEvent(root, "scroll", () => updateArea(computeIntersectionRect(anchor, root, true).intersection), { capture: true }),
    addEvent(window, "resize", () => updateArea(computeIntersectionRect(anchor, root, true).intersection)),
    addEvent(window, "scroll", () => updateArea(computeIntersectionRect(anchor, root, true).intersection), { capture: true })
  ];
  updateArea(computeIntersectionRect(anchor, root, true).intersection);
  function destroy() {
    listening.forEach((ub) => ub?.());
    resizeObs?.disconnect?.();
    mutationObs?.disconnect?.();
    intersectionObs?.disconnect?.();
  }
  if (destroy) {
    area.forEach((ub) => addToCallChain(ub, Symbol.dispose, destroy));
  }
  return area;
}

const getParentOrShadowRoot = (element) => {
  if (element?.parentElement) {
    return !(element?.parentElement instanceof DocumentFragment) ? element?.parentElement : void 0;
  }
  return element?.host?.shadowRoot;
};
const observeDisconnect = (element, handleMutation) => {
  if (!element?.isConnected) {
    return handleMutation();
  }
  const observer = new MutationObserver((mutationList, observer2) => {
    for (const mutation of mutationList) {
      if (mutation.type == "childList") {
        if (Array.from(mutation?.removedNodes || []).some((node) => node === element || node?.contains?.(element))) {
          queueMicrotask(() => handleMutation(mutation));
          observer2?.disconnect?.();
        }
      }
    }
  });
  const parent = getParentOrShadowRoot(element) ?? document.documentElement;
  const observed = (parent instanceof HTMLElement ? parent : parent?.host) ?? parent;
  queueMicrotask(() => observer.observe(observed, {
    subtree: true,
    childList: true
  }));
};
const observeConnect = (element, handleMutation) => {
  if (element?.isConnected) {
    return handleMutation();
  }
  const observer = new MutationObserver((mutationList, observer2) => {
    for (const mutation of mutationList) {
      if (mutation.type == "childList") {
        if (Array.from(mutation?.addedNodes || []).some((node) => node === element || node?.contains?.(element))) {
          queueMicrotask(() => handleMutation(mutation));
          observer2?.disconnect?.();
        }
      }
    }
  });
  const parent = getParentOrShadowRoot(element) ?? document.documentElement;
  const observed = (parent instanceof HTMLElement ? parent : parent?.host) ?? parent;
  queueMicrotask(() => observer.observe(observed, {
    subtree: true,
    childList: true
  }));
};
const appendAsOverlay = (anchor, overlay, self, options) => {
  const {
    root = window,
    zIndexShift = 1,
    placement = "fill",
    inset = 0,
    size = "100%",
    transformOrigin = "50% 50%",
    useIntersection = false
  } = options || {};
  anchor ??= self?.children?.[0] ?? anchor;
  if (!anchor && (self?.children?.length ?? 0) < 1) {
    const fillAnchorBox = document.createElement("div");
    fillAnchorBox.classList.add("ui-window-frame-anchor-box");
    fillAnchorBox.style.position = "relative";
    fillAnchorBox.style.inlineSize = "stretch";
    fillAnchorBox.style.blockSize = "stretch";
    fillAnchorBox.style.zIndex = String(zIndexShift + 0);
    fillAnchorBox.style.pointerEvents = "none";
    fillAnchorBox.style.opacity = "1";
    fillAnchorBox.style.visibility = "visible";
    fillAnchorBox.style.backgroundColor = "transparent";
    self?.append?.(anchor = fillAnchorBox);
  }
  if (anchor == null || overlay == null) return;
  const anchorBinder = makeAnchorElement(anchor);
  if (placement === "scrollbar-x") {
    anchorBinder.connectElement(overlay, {
      placement: "bottom",
      zIndexShift,
      inset,
      size,
      transformOrigin
    });
  } else if (placement === "scrollbar-y") {
    anchorBinder.connectElement(overlay, {
      placement: "right",
      zIndexShift,
      inset,
      size,
      transformOrigin
    });
  } else {
    anchorBinder.connectElement(overlay, {
      placement,
      zIndexShift,
      inset,
      size,
      transformOrigin
    });
  }
  observeConnect(anchor, () => {
    const parent = getParentOrShadowRoot(anchor) ?? self;
    const styled = parent instanceof HTMLElement ? parent : parent?.host;
    styled?.style?.setProperty?.("anchor-scope", anchorBinder.anchorId);
    anchor?.after?.(overlay);
    observeDisconnect(parent, () => overlay?.remove?.());
  });
  return anchor;
};
const appendScrollbarOverlay = (content, scrollbar, axis, options) => {
  const { zIndexShift = 1, autoPosition = true, useIntersection = false, theme = "default" } = options || {};
  scrollbar.classList.add(`scrollbar-theme-${theme}`);
  scrollbar.setAttribute("data-axis", axis);
  let cleanupFunctions = [];
  if (autoPosition) {
    if (useIntersection) {
      const intersectionBox = enhancedIntersectionBoxAnchorRef(content, {
        root: window,
        observeResize: true,
        observeMutations: true,
        observeIntersection: true
      });
      cleanupFunctions.push(bindScrollbarPosition(scrollbar, intersectionBox, axis, {
        useIntersection: true,
        zIndexShift
      }));
    } else {
      const box = boundingBoxAnchorRef(content, {
        observeResize: true,
        observeMutations: true
      });
      cleanupFunctions.push(bindScrollbarPosition(scrollbar, box, axis, {
        useIntersection: false,
        zIndexShift
      }));
    }
  }
  if (!scrollbar.parentNode) {
    document.body.appendChild(scrollbar);
  }
  observeDisconnect(content, () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    scrollbar.remove();
  });
  return scrollbar;
};
const createReactiveScrollbarOverlay = (content, axis = "vertical") => {
  const scrollbar = document.createElement("div");
  scrollbar.className = `reactive-scrollbar reactive-scrollbar-${axis}`;
  scrollbar.style.background = "rgba(0,0,0,0.3)";
  scrollbar.style.borderRadius = "4px";
  scrollbar.style.position = "absolute";
  scrollbar.style.zIndex = "1000";
  if (axis === "horizontal") {
    scrollbar.style.height = "8px";
    scrollbar.style.width = "100px";
  } else {
    scrollbar.style.width = "8px";
    scrollbar.style.height = "100px";
  }
  return appendScrollbarOverlay(content, scrollbar, axis, {
    autoPosition: true,
    useIntersection: true,
    theme: "default"
  });
};

const registered = /* @__PURE__ */ new Map();
const registerOverlayElement = (name, construct) => {
  const withIt = /* @__PURE__ */ new WeakMap();
  const bindWith = (content, holder, inputChange) => {
    if (content?.style?.anchorName || withIt?.has?.(content)) return false;
    if (content) {
      const self = construct?.(content, holder, inputChange);
      withIt?.set?.(content, self);
      appendAsOverlay(content, self, holder);
    }
    return true;
  };
  class OverlayModifier extends DOMMixin {
    constructor(name2) {
      super(name2);
    }
    // @ts-ignore
    connect(ws) {
      const self = ws?.deref?.() ?? ws;
      if (withIt?.has?.(self)) return;
      bindWith(self);
    }
  }
  const pack = [withIt, bindWith, OverlayModifier];
  registered.set(name, pack);
  new OverlayModifier(name);
  return pack;
};

const itemClickHandle = (ev, ctxMenuDesc) => {
  const id = Q(`[data-id]`, ev?.target, 0, "parent")?.getAttribute?.("data-id");
  const item = ctxMenuDesc?.items?.find?.((I) => I?.some?.((I2) => I2?.id == id))?.find?.((I) => I?.id == id);
  (item?.action ?? ctxMenuDesc?.defaultAction)?.(
    ctxMenuDesc?.openedWith?.initiator,
    item,
    ctxMenuDesc?.openedWith?.event ?? ev
  );
  ctxMenuDesc?.openedWith?.close?.();
  const vr = getBoundVisibleRef(ctxMenuDesc?.openedWith?.element);
  if (vr != null) vr.value = false;
};
const visibleMap = /* @__PURE__ */ new WeakMap();
const registerCtxMenu = typeof document !== "undefined" && document?.documentElement ? addProxiedEvent(
  document.documentElement,
  "contextmenu",
  { capture: true, passive: false },
  { strategy: "closest", preventDefault: "handled", stopImmediatePropagation: "handled" }
) : (_el, _handler) => () => {
};
const getBoundVisibleRef = (menuElement) => {
  if (menuElement == null) return null;
  return visibleMap?.getOrInsertComputed?.(menuElement, () => visibleRef(menuElement, false));
};
const bindMenuItemClickHandler = (menuElement, menuDesc) => {
  const handler = (ev) => {
    itemClickHandle(ev, menuDesc);
  };
  const listening = addEvent(menuElement, "click", handler, { composed: true });
  return () => listening?.();
};
const getGlobalContextMenu = (parent = document) => {
  let menu = Q('ui-modal[type="contextmenu"]', parent);
  if (!menu) {
    menu = H`<ui-modal type="contextmenu"></ui-modal>`;
    (parent instanceof Document ? parent.body : parent).append(menu);
  }
  return menu;
};
const makeMenuHandler = (triggerElement, placement, ctxMenuDesc, menuElement) => {
  return (ev) => {
    let handled = false;
    const menu = menuElement || getGlobalContextMenu();
    const visibleRef2 = getBoundVisibleRef(menu);
    const initiator = ev?.target ?? triggerElement ?? document.elementFromPoint(ev?.clientX || 0, ev?.clientY || 0);
    const details = { event: ev, initiator, trigger: triggerElement, menu, ctxMenuDesc };
    ctxMenuDesc.context = details;
    if (ctxMenuDesc?.onBeforeOpen?.(details) === false) {
      return handled;
    }
    const builtItems = ctxMenuDesc?.buildItems?.(details);
    if (Array.isArray(builtItems) && builtItems.length) {
      ctxMenuDesc.items = builtItems;
    }
    if (visibleRef2?.value && ev?.type !== "contextmenu") {
      visibleRef2.value = false;
      ctxMenuDesc?.openedWith?.close?.();
      return handled;
    }
    if (initiator && visibleRef2) {
      handled = true;
      menu.innerHTML = "";
      visibleRef2.value = true;
      menu?.append?.(
        ...ctxMenuDesc?.items?.map?.((section, sIdx) => {
          const items = section?.map?.(
            (item) => H`<li data-id=${item?.id || ""}><ui-icon icon=${item?.icon || ""}></ui-icon><span>${item?.label || ""}</span></li>`
          );
          const separator = section?.length > 1 && sIdx !== (ctxMenuDesc?.items?.length || 0) - 1 ? H`<li class="ctx-menu-separator"></li>` : null;
          return [...items, separator];
        })?.flat?.()?.filter?.((E) => !!E) || []
      );
      const where = withInsetWithPointer?.(menu, placement?.(ev, initiator));
      const unbindClick = bindMenuItemClickHandler(menu, ctxMenuDesc);
      const untrigger = makeInterruptTrigger?.(
        menu,
        (e) => {
          const menuAny = menu;
          if (!(menu?.contains?.(e?.target ?? null) || e?.target == (menuAny?.element ?? menuAny)) || !e?.target) {
            ctxMenuDesc?.openedWith?.close?.();
            const vr = getBoundVisibleRef(menu);
            if (vr != null) vr.value = false;
          }
        },
        ["click", "pointerdown", "scroll"]
      );
      const unmenuCtx = registerCtxMenu(menu, () => true);
      ctxMenuDesc.openedWith = {
        initiator,
        element: menu,
        event: ev,
        context: ctxMenuDesc?.context,
        close() {
          visibleRef2.value = false;
          ctxMenuDesc.openedWith = null;
          unbindClick?.();
          where?.();
          untrigger?.();
          unmenuCtx?.();
          if (ctxMenuDesc._backUnreg) {
            ctxMenuDesc._backUnreg();
            ctxMenuDesc._backUnreg = null;
          }
        }
      };
      if (!ctxMenuDesc._backUnreg && visibleRef2) {
        ctxMenuDesc._backUnreg = registerContextMenu(menu, visibleRef2, () => {
          ctxMenuDesc?.openedWith?.close?.();
        });
      }
    }
    return handled;
  };
};
const ctxMenuTrigger = (triggerElement, ctxMenuDesc, menuElement) => {
  const evHandler = makeMenuHandler(triggerElement, (ev) => [ev?.clientX, ev?.clientY, 200], ctxMenuDesc, menuElement);
  const unbindConnected = bindWhileConnected(triggerElement, () => {
    return registerCtxMenu(triggerElement, evHandler);
  });
  return () => {
    unbindConnected?.();
  };
};
const dropMenuTrigger = (triggerElement, ctxMenuDesc, menuElement) => {
  const menu = menuElement || Q('ui-modal[type="menulist"]', document.body) || getGlobalContextMenu();
  const anchorElement = triggerElement;
  const evHandler = makeMenuHandler(triggerElement, (ev) => boundingBoxAnchorRef(anchorElement)?.slice?.(0, 3), ctxMenuDesc, menu);
  const untrigger = makeInterruptTrigger?.(
    menu,
    (ev) => {
      if (!(menu?.contains?.(ev?.target) || ev?.target == (triggerElement?.element ?? triggerElement)) || !ev?.target) {
        ctxMenuDesc?.openedWith?.close?.();
        const vr = getBoundVisibleRef(menu);
        if (vr != null) vr.value = false;
      }
    },
    ["click", "pointerdown", "scroll"]
  );
  const listening = addEvent(triggerElement, "click", evHandler, { composed: true });
  return () => {
    untrigger?.();
    listening?.();
  };
};

const boolDepIconRef = (cnd) => conditional(cnd, "badge-check", "badge");
const indicationRef = (ref) => computed(ref, (v) => (parseFloat(v) || 0)?.toLocaleString?.("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
}));
const reactiveInputPosition = (input, container) => {
  const elementSize = container ? new ReactiveElementSize(container) : null;
  const value = clampedValueRef(input);
  return operated([value, elementSize?.width || numberRef(100)], () => {
    const containerWidth = elementSize?.width.value || 100;
    const percentage = value.value;
    return percentage * containerWidth;
  });
};
const reactiveInputHandleTransform = (input, container) => {
  const position = reactiveInputPosition(input, container);
  const transform = new ReactiveTransform();
  return operated([position], () => `translateX(${position.value}px)`);
};
const convertValueToPointer = (input) => {
  const $cmp = getInputValues(input);
  const [value, min, max] = $cmp;
  if (input?.type == "number" || input?.type == "range") {
    return (value - min) / (max - min);
  } else if (input?.type == "checkbox") {
    return value ? 1 : 0;
  } else if (input?.type == "radio") {
    const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length, nth = all.indexOf(input);
    return nth / (len - 1);
  }
  return value;
};
const convertPointerToValueShift = (input, shift, container) => {
  const dec = (shift?.[0]?.value || 0) / (container?.offsetWidth || 1);
  const $cmp = getInputValues(input), [_, min, max] = $cmp;
  if (input?.type == "checkbox") {
    return Math.sign(shift?.[0]?.value);
  } else if (input?.type == "range" || input?.type == "number") {
    return dec * (max - min);
  } else if (input?.type == "radio") {
    return Math.round(dec * max);
  }
  return dec;
};
const correctValue = (input, val) => {
  if (input?.type == "number" || input?.type == "range") {
    return val;
  } else if (input?.type == "checkbox") {
    return val > 0.5 ? true : false;
  } else if (input?.type == "radio") {
    const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')], len = all?.length;
    return Math.max(Math.min(Math.round(val), len), 0);
  }
};
const convertPointerToValue = (input, relateFromCorner, container) => {
  const clamped = relateFromCorner / (container?.offsetWidth || 1);
  const $cmp = getInputValues(input), [_, min, max] = $cmp;
  const val = clamped * (max - min) + min;
  return correctValue(input, val);
};
const getValueWithShift = (input, valueShift) => {
  const $cmp = getInputValues(input);
  return correctValue(input, $cmp?.[0] + valueShift);
};
const setInputValue = (input, value) => {
  const $cmp = getInputValues(input), [_, min, max] = $cmp;
  if (input?.type == "number" || input?.type == "range") {
    if (value != input.valueAsNumber) {
      input.valueAsNumber = value;
      input?.dispatchEvent?.(new Event("change", { bubbles: true }));
    }
  } else if (input?.type == "checkbox") {
    setChecked(input, value > 0.5 ? true : false);
  } else if (input?.type == "radio") {
    const all = [...input?.parentNode?.querySelectorAll?.('input[type="radio"]')];
    if (value != 0) {
      setChecked(all[Math.max(Math.min(Math.round(value), max), min)], value);
    }
  }
};
const setValueByShift = (input, valueShift) => {
  return setInputValue(input, getValueWithShift(input, valueShift));
};
const setValueByPointer = (input, pointer, container) => {
  return setInputValue(input, convertPointerToValue(input, pointer, container));
};
const resolveDragging = (input, dragging, container) => {
  setValueByShift(input, convertPointerToValueShift(input, dragging, container));
  try {
    dragging[0].value = 0, dragging[1].value = 0;
  } catch (e) {
  }
  ;
  return [0, 0];
};
const getInputValues = (inp) => {
  if ((inp?.type == "number" || inp?.type == "range") && inp?.valueAsNumber != null) {
    return [inp?.valueAsNumber || 0, parseFloat(inp?.min || 0), parseFloat(inp?.max || 0)];
  } else if (inp?.type == "checkbox") {
    return [inp?.checked ? 1 : 0, 0, 1];
  } else if (inp?.type == "radio") {
    const all = [...inp?.parentNode?.querySelectorAll?.('input[type="radio"]')];
    const len = all?.length, nth = all?.indexOf?.(inp) ?? -1;
    return [nth, 0, len - 1];
  }
  return [0, 0, 0];
};
const progress = (value, min, max) => {
  return (value - min) / (max - min);
};
const getClampedValue = (inp) => {
  return progress(...getInputValues(inp));
};
const clampedValueRef = (inp) => {
  const rf = numberRef(getClampedValue(inp));
  const ctr = (ev) => {
    rf.value = getClampedValue(ev?.target ?? inp);
  };
  bindCtrl?.(inp, ctr);
  return rf;
};
const dragSlider = (thumb, handler, input) => {
  const usedPointer = { id: -1 };
  const correctOffset = () => {
    try {
      dragging[0].value = 0, dragging[1].value = 0;
    } catch (e) {
    }
    ;
    return [0, 0];
  };
  const customTrigger = (doGrab) => {
    const $handler = makeShiftTrigger((ev) => {
      thumb?.setPointerCapture?.(usedPointer.id = ev?.pointerId);
      thumb?.setAttribute?.("data-dragging", "true");
      correctOffset();
      doGrab?.(ev, thumb);
    }, thumb);
    const ub = addEvent(handler, "pointerdown", $handler);
    const ubt = addEvent(thumb, "pointerdown", $handler);
    listening.push(ub, ubt);
    return ub;
  };
  const listening = [
    addEvent(handler, "click", (ev) => {
      if (input?.type == "checkbox" || input?.type == "radio") {
        setChecked(input, input?.checked, ev);
      }
    }),
    addEvent(handler, "pointerdown", (ev) => {
      if (!(ev?.target?.matches?.(".ui-thumb") || ev?.target?.closest?.(".ui-thumb"))) {
        if (ev?.target == (handler?.element ?? handler) || handler.contains(ev?.target)) {
          setValueByPointer(input, ev?.layerX || 0, handler);
        }
      }
    })
  ];
  const dragging = [numberRef(0), numberRef(0)];
  const dragTransform = operated([dragging[0]], () => `translateX(${dragging[0].value}px)`);
  const valuePosition = reactiveInputPosition(input, handler);
  CSSBinder.bindTransform(thumb, dragTransform);
  CSSBinder.bindTransform(handler, dragTransform);
  const relativeValue = operated(
    [dragging[0]],
    (dx) => convertPointerToValueShift(input, dragging, handler)
  );
  const clampedValue = clampedValueRef(input);
  bindWith?.(handler, "--relate", relativeValue, handleStyleChange);
  bindWith?.(handler, "--value", clampedValue, handleStyleChange);
  const obj = bindDraggable(customTrigger, (dragging2) => {
    thumb?.removeAttribute?.("data-dragging");
    if (usedPointer.id >= 0) {
      thumb?.releasePointerCapture?.(usedPointer.id);
      usedPointer.id = -1;
    }
    resolveDragging(input, dragging2, handler);
  }, dragging, correctOffset);
  return () => {
    listening.forEach((ub) => ub?.());
    obj?.dispose?.();
  };
};

const collectProviders = (ev, action) => {
  const providers = /* @__PURE__ */ new Set();
  let el = ev?.target || document.activeElement || document.body;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable) {
    return [];
  }
  let current = el;
  while (current) {
    if (typeof current[action] === "function") {
      providers.add(current);
    }
    if (current.operativeInstance && typeof current.operativeInstance[action] === "function") {
      providers.add(current.operativeInstance);
    }
    if (current.shadowRoot && current.shadowRoot.host) {
      current = current.shadowRoot.host;
    } else {
      current = current.parentElement || current.getRootNode()?.host;
    }
  }
  if (ev.currentTarget instanceof Node || typeof document !== "undefined") {
    const root = ev.currentTarget instanceof Node ? ev.currentTarget instanceof Document ? ev.currentTarget.body : ev.currentTarget : document.body;
    if (root) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (typeof node[action] === "function" || node.operativeInstance && typeof node.operativeInstance[action] === "function") {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (typeof node[action] === "function") {
          providers.add(node);
        }
        if (node.operativeInstance && typeof node.operativeInstance[action] === "function") {
          providers.add(node.operativeInstance);
        }
      }
    }
  }
  return Array.from(providers);
};
const handleClipboardEvent = (ev, type) => {
  const providers = collectProviders(ev, type);
  for (const provider of providers) {
    provider[type]?.(ev);
  }
};
let initialized = false;
const initGlobalClipboard = () => {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  lazyAddEventListener(window, "copy", (ev) => handleClipboardEvent(ev, "onCopy"), { capture: false, passive: true });
  lazyAddEventListener(window, "cut", (ev) => handleClipboardEvent(ev, "onCut"), { capture: false, passive: true });
  lazyAddEventListener(window, "paste", (ev) => handleClipboardEvent(ev, "onPaste"), { capture: false, passive: false });
};

function WorkerWrapper(options) {
  return new Worker(
    ""+new URL('../assets/OPFS.uniform.worker-BtgoKCnH.js', import.meta.url).href+"",
    {
      type: "module",
      name: options?.name
    }
  );
}

let workerChannel = null;
const isServiceWorker = typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope;
const observers = /* @__PURE__ */ new Map();
let workerInitPromise = null;
const ensureWorker = () => {
  if (workerInitPromise) return workerInitPromise;
  workerInitPromise = new Promise(async (resolve) => {
    if (typeof Worker !== "undefined" && !isServiceWorker) {
      try {
        const baseChannel = await createWorkerChannel({
          name: "opfs-worker",
          script: WorkerWrapper
        });
        workerChannel = new QueuedWorkerChannel("opfs-worker", async () => baseChannel, {
          timeout: 3e4,
          // 30 second timeout for file operations (file ops can be slow)
          retries: 3,
          batching: true,
          // Enable message batching for better performance
          compression: false
          // File operations don't benefit from compression
        });
        resolve(workerChannel);
      } catch (e) {
        console.warn("OPFSUniformWorker instantiation failed, falling back to main thread...", e);
        workerChannel = null;
        resolve(null);
      }
    } else {
      workerChannel = null;
      resolve(null);
    }
  });
  return workerInitPromise;
};
const directHandlers = {
  readDirectory: async ({ rootId, path, create }) => {
    try {
      const root = await navigator.storage.getDirectory();
      const parts = (path || "").trim().replace(/\/+/g, "/").split("/").filter((p) => p);
      let current = root;
      for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create });
      }
      const entries = [];
      for await (const [name, entry] of current.entries()) {
        entries.push([name, entry]);
      }
      return entries;
    } catch (e) {
      console.warn("Direct readDirectory error:", e);
      return [];
    }
  },
  readFile: async ({ rootId, path, type }) => {
    try {
      const root = await navigator.storage.getDirectory();
      const parts = (path || "").trim().replace(/\/+/g, "/").split("/").filter((p) => p);
      const filename = parts.pop();
      let dir = root;
      for (const part of parts) {
        dir = await dir.getDirectoryHandle(part, { create: false });
      }
      const fileHandle = await dir.getFileHandle(filename, { create: false });
      const file = await fileHandle.getFile();
      if (type === "text") return await file.text();
      if (type === "arrayBuffer") return await file.arrayBuffer();
      return file;
    } catch (e) {
      console.warn("Direct readFile error:", e);
      return null;
    }
  },
  writeFile: async ({ rootId, path, data }) => {
    try {
      const root = await navigator.storage.getDirectory();
      const parts = (path || "").trim().replace(/\/+/g, "/").split("/").filter((p) => p);
      const filename = parts.pop();
      let dir = root;
      for (const part of parts) {
        dir = await dir.getDirectoryHandle(part, { create: true });
      }
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      return true;
    } catch (e) {
      console.warn("Direct writeFile error:", e);
      return false;
    }
  },
  remove: async ({ rootId, path, recursive }) => {
    try {
      const root = await navigator.storage.getDirectory();
      const parts = (path || "").trim().replace(/\/+/g, "/").split("/").filter((p) => p);
      const name = parts.pop();
      let dir = root;
      for (const part of parts) {
        dir = await dir.getDirectoryHandle(part, { create: false });
      }
      await dir.removeEntry(name, { recursive });
      return true;
    } catch {
      return false;
    }
  },
  copy: async ({ from, to }) => {
    try {
      const copyRecursive = async (source, dest) => {
        if (source.kind === "directory") {
          for await (const [name, entry] of source.entries()) {
            if (entry.kind === "directory") {
              const newDest = await dest.getDirectoryHandle(name, { create: true });
              await copyRecursive(entry, newDest);
            } else {
              const file = await entry.getFile();
              const newFile = await dest.getFileHandle(name, { create: true });
              const writable = await newFile.createWritable();
              await writable.write(file);
              await writable.close();
            }
          }
        } else {
          const file = await source.getFile();
          const writable = await dest.createWritable();
          await writable.write(file);
          await writable.close();
        }
      };
      await copyRecursive(from, to);
      return true;
    } catch (e) {
      console.warn("Direct copy error:", e);
      return false;
    }
  },
  // Placeholder for observe/unobserve (FileSystemObserver not available in all contexts)
  observe: async () => false,
  unobserve: async () => true,
  mount: async () => true,
  unmount: async () => true
};
const post = (type, payload = {}, transfer = []) => {
  if (isServiceWorker && directHandlers[type]) {
    return directHandlers[type](payload);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await ensureWorker();
      if (!channel) {
        if (directHandlers[type]) {
          return resolve(directHandlers[type](payload));
        }
        return reject(new Error("No worker channel available"));
      }
      const result = await channel.request(type, payload);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};
const getDir = (dest) => {
  if (typeof dest != "string") return dest;
  dest = dest?.trim?.() || dest;
  if (!dest?.endsWith?.("/")) {
    dest = dest?.trim?.()?.split?.("/")?.slice(0, -1)?.join?.("/")?.trim?.() || dest;
  }
  ;
  const p1 = !dest?.trim()?.endsWith("/") ? dest + "/" : dest;
  return !p1?.startsWith("/") ? "/" + p1 : p1;
};
const imageImportDesc = {
  startIn: "pictures",
  multiple: false,
  types: [{ description: "wallpaper", accept: { "image/*": [".png", ".gif", ".jpg", ".jpeg", ".webp", ".jxl"] } }]
};
const generalFileImportDesc = {
  startIn: "documents",
  multiple: false,
  types: [{ description: "files", accept: { "application/*": [".txt", ".md", ".html", ".htm", ".css", ".js", ".json", ".csv", ".xml", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".mp3", ".wav", ".mp4", ".webm", ".pdf", ".zip", ".rar", ".7z"] } }]
};
const mappedRoots = /* @__PURE__ */ new Map([
  ["/", async () => await navigator?.storage?.getDirectory?.()],
  ["/user/", async () => await navigator?.storage?.getDirectory?.()],
  ["/assets/", async () => {
    console.warn("Backend related API not implemented!");
    return null;
  }]
]);
const currentHandleMap = /* @__PURE__ */ new Map();
const mountAsRoot = async (forId, copyFromInternal) => {
  const cleanId = forId?.trim?.()?.replace?.(/^\//, "")?.trim?.()?.split?.("/")?.filter?.((p) => !!p?.trim?.())?.at?.(0);
  const rootHandle = currentHandleMap?.get(cleanId) ?? await showDirectoryPicker?.({
    mode: "readwrite",
    id: `${cleanId}`
  })?.catch?.(console.warn.bind(console));
  if (rootHandle && cleanId && typeof cleanId == "string") {
    currentHandleMap?.set?.(cleanId, rootHandle);
  }
  ;
  if (rootHandle && typeof localStorage != "undefined") {
    localStorage?.setItem?.("opfs.mounted", JSON.stringify([...JSON.parse(localStorage?.getItem?.("opfs.mounted") || "[]"), cleanId]));
  }
  ;
  if (rootHandle) {
    post("mount", { id: cleanId, handle: rootHandle });
  }
  if (copyFromInternal && rootHandle && cleanId == "user") {
    const internalRoot = await navigator?.storage?.getDirectory?.();
    await copyFromOneHandlerToAnother(internalRoot, rootHandle, {})?.catch?.(console.warn.bind(console));
  }
  ;
  return rootHandle;
};
const unmountAsRoot = async (forId) => {
  if (typeof localStorage != "undefined") {
    localStorage?.setItem?.("opfs.mounted", JSON.stringify(JSON.parse(localStorage?.getItem?.("opfs.mounted") || "[]").filter((id) => id != forId)));
  }
  post("unmount", { id: forId });
};
async function resolveRootHandle(rootHandle, relPath = "") {
  if (rootHandle == null || rootHandle == void 0 || rootHandle?.trim?.()?.length == 0) {
    rootHandle = "/user/";
  }
  const cleanId = typeof rootHandle == "string" ? rootHandle?.trim?.()?.replace?.(/^\//, "")?.trim?.()?.split?.("/")?.filter?.((p) => !!p?.trim?.())?.at?.(0) : null;
  if (cleanId) {
    if (typeof localStorage != "undefined" && JSON.parse(localStorage?.getItem?.("opfs.mounted") || "[]").includes(cleanId)) {
      rootHandle = currentHandleMap?.get(cleanId);
    }
    if (!rootHandle) {
      rootHandle = await mappedRoots?.get?.(`/${cleanId}/`)?.() ?? await navigator.storage.getDirectory();
    }
    ;
  }
  if (rootHandle instanceof FileSystemDirectoryHandle) {
    return rootHandle;
  }
  const normalizedPath = relPath?.trim?.() || "/";
  const pathForMatch = normalizedPath.startsWith("/") ? normalizedPath : "/" + normalizedPath;
  let bestMatch = null;
  let bestMatchLength = 0;
  for (const [rootPath, rootResolver] of mappedRoots.entries()) {
    if (pathForMatch.startsWith(rootPath) && rootPath.length > bestMatchLength) {
      bestMatch = rootResolver;
      bestMatchLength = rootPath.length;
    }
  }
  try {
    const resolvedRoot = bestMatch ? await bestMatch() : null;
    return resolvedRoot || await navigator?.storage?.getDirectory?.();
  } catch (error) {
    console.warn("Failed to resolve root handle, falling back to OPFS root:", error);
    return await navigator?.storage?.getDirectory?.();
  }
}
function normalizePath(basePath = "", relPath) {
  if (!relPath?.trim()) return basePath;
  const cleanRelPath = relPath.trim();
  if (cleanRelPath.startsWith("/")) {
    return cleanRelPath;
  }
  const baseParts = basePath.split("/").filter((p) => p?.trim());
  const relParts = cleanRelPath.split("/").filter((p) => p?.trim());
  for (const part of relParts) {
    if (part === ".") {
      continue;
    } else if (part === "..") {
      if (baseParts.length > 0) {
        baseParts.pop();
      }
    } else {
      baseParts.push(part);
    }
  }
  return "/" + baseParts.join("/");
}
async function resolvePath(rootHandle, relPath, basePath = "") {
  const normalizedRelPath = normalizePath(basePath, relPath);
  const resolvedRootHandle = await resolveRootHandle(rootHandle, normalizedRelPath);
  return {
    rootHandle: resolvedRootHandle,
    resolvedPath: normalizedRelPath
  };
}
function handleError(logger, status, message) {
  logger?.(status, message);
  return null;
}
function defaultLogger(status, message) {
  console.trace(`[${status}] ${message}`);
}
;
function getFileExtension(path) {
  return path?.trim?.()?.split?.(".")?.[1];
}
function detectTypeByRelPath(relPath) {
  if (relPath?.trim()?.endsWith?.("/")) return "directory";
  return "file";
}
function getMimeTypeByFilename(filename) {
  const ext = filename?.split?.(".")?.pop?.()?.toLowerCase?.();
  const mimeTypes = {
    "txt": "text/plain",
    "md": "text/markdown",
    "html": "text/html",
    "htm": "text/html",
    "css": "text/css",
    "js": "application/javascript",
    "json": "application/json",
    "csv": "text/csv",
    "xml": "application/xml",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
    "ico": "image/x-icon",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "mp4": "video/mp4",
    "webm": "video/webm",
    "pdf": "application/pdf",
    "zip": "application/zip",
    "rar": "application/vnd.rar",
    "7z": "application/x-7z-compressed"
    // ...
  };
  return mimeTypes[ext] || "application/octet-stream";
}
const hasFileExtension = (path) => {
  return path?.trim?.()?.split?.(".")?.[1]?.trim?.()?.length > 0;
};
async function getDirectoryHandle(rootHandle, relPath, { create = false, basePath = "" } = {}, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRoot, resolvedPath } = await resolvePath(rootHandle, relPath, basePath);
    const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
    const parts = cleanPath.split("/").filter((p) => !!p?.trim?.());
    if (parts.length > 0 && hasFileExtension(parts[parts.length - 1]?.trim?.())) {
      parts?.pop?.();
    }
    ;
    let dir = resolvedRoot;
    if (parts?.length > 0) {
      for (const part of parts) {
        dir = await dir?.getDirectoryHandle?.(part, { create });
        if (!dir) {
          break;
        }
        ;
      }
    }
    return dir;
  } catch (e) {
    return handleError(logger, "error", `getDirectoryHandle: ${e.message}`);
  }
}
async function getFileHandle(rootHandle, relPath, { create = false, basePath = "" } = {}, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRoot, resolvedPath } = await resolvePath(rootHandle, relPath, basePath);
    const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
    const parts = cleanPath.split("/").filter((d) => !!d?.trim?.());
    if (parts?.length == 0) return null;
    const filePath = parts.length > 0 ? parts[parts.length - 1]?.trim?.()?.replace?.(/\s+/g, "-") : "";
    const dirName = parts.length > 1 ? parts?.slice(0, -1)?.join?.("/")?.trim?.()?.replace?.(/\s+/g, "-") : "";
    if (cleanPath?.trim?.()?.endsWith?.("/")) {
      return null;
    }
    ;
    const dir = await getDirectoryHandle(resolvedRoot, dirName, { create, basePath }, logger);
    return dir?.getFileHandle?.(filePath, { create });
  } catch (e) {
    return handleError(logger, "error", `getFileHandle: ${e.message}`);
  }
}
async function getHandler(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRootHandle, resolvedPath } = await resolvePath(rootHandle, relPath, options?.basePath || "");
    const type = detectTypeByRelPath(resolvedPath);
    if (type == "directory") {
      const dir = await getDirectoryHandle(resolvedRootHandle, resolvedPath?.trim?.()?.replace?.(/\/$/, ""), options, logger);
      if (dir) return { type: "directory", handle: dir };
    } else {
      const file = await getFileHandle(resolvedRootHandle, resolvedPath, options, logger);
      if (file) return { type: "file", handle: file };
    }
    return null;
  } catch (e) {
    return handleError(logger, "error", `getHandler: ${e.message}`);
  }
}
async function createHandler(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRootHandle, resolvedPath } = await resolvePath(rootHandle, relPath, options?.basePath || "");
    const type = detectTypeByRelPath(resolvedPath);
    if (type == "directory") {
      return await getDirectoryHandle(resolvedRootHandle, resolvedPath?.trim?.()?.replace?.(/\/$/, ""), options, logger);
    } else {
      return await getFileHandle(resolvedRootHandle, resolvedPath, options, logger);
    }
  } catch (e) {
    return handleError(logger, "error", `createHandler: ${e.message}`);
  }
}
const directoryCacheMap = /* @__PURE__ */ new Map();
const mayNotPromise = (pms, cb, errCb = console.warn.bind(console)) => {
  if (typeof pms?.then == "function") {
    return pms?.then?.(cb)?.catch?.(errCb);
  } else {
    try {
      return cb(pms);
    } catch (e) {
      errCb(e);
      return null;
    }
  }
};
function openDirectory(rootHandle, relPath, options = { create: false }, logger = defaultLogger) {
  let cacheKey = "";
  let localMapCache = observe(/* @__PURE__ */ new Map());
  const pathPromise = (async () => {
    try {
      const { rootHandle: resolvedRootHandle, resolvedPath } = await resolvePath(
        rootHandle,
        relPath,
        options?.basePath || ""
      );
      cacheKey = `${resolvedRootHandle?.name || "root"}:${resolvedPath}`;
      return { rootHandle: resolvedRootHandle, resolvedPath };
    } catch {
      return { rootHandle: null, resolvedPath: "" };
    }
  })();
  const statePromise = pathPromise.then(async ({ rootHandle: rootHandle2, resolvedPath }) => {
    if (!resolvedPath) return null;
    const existing = directoryCacheMap.get(cacheKey);
    if (existing) {
      existing.refCount++;
      localMapCache = existing.mapCache;
      return existing;
    }
    const mapCache = observe(/* @__PURE__ */ new Map());
    localMapCache = mapCache;
    const observationId = UUIDv4();
    const dirHandlePromise = getDirectoryHandle(rootHandle2, resolvedPath, options, logger);
    const updateCache = async () => {
      const cleanPath2 = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
      const entries2 = await post(
        "readDirectory",
        {
          rootId: "",
          path: cleanPath2,
          create: options.create
        },
        rootHandle2 ? [rootHandle2] : []
      );
      if (!entries2) return mapCache;
      const entryMap = new Map(entries2);
      for (const key of mapCache.keys()) {
        if (!entryMap.has(key)) mapCache.delete(key);
      }
      for (const [key, handle] of entryMap) {
        if (!mapCache.has(key)) mapCache.set(key, handle);
      }
      return mapCache;
    };
    const cleanup = () => {
      post("unobserve", { id: observationId });
      observers.delete(observationId);
      directoryCacheMap.delete(cacheKey);
    };
    observers.set(observationId, (changes) => {
      for (const change of changes) {
        if (!change?.name) continue;
        if (change.type === "modified" || change.type === "created" || change.type === "appeared") {
          mapCache.set(change.name, change.handle);
        } else if (change.type === "deleted" || change.type === "disappeared") {
          mapCache.delete(change.name);
        }
      }
    });
    const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
    post(
      "observe",
      {
        rootId: "",
        path: cleanPath,
        id: observationId
      },
      rootHandle2 ? [rootHandle2] : []
    );
    updateCache();
    const newState = {
      mapCache,
      dirHandle: dirHandlePromise,
      resolvePath: resolvedPath,
      observationId,
      refCount: 1,
      cleanup,
      updateCache
    };
    directoryCacheMap.set(cacheKey, newState);
    const entries = await Promise.all(await Array.fromAsync((await dirHandlePromise)?.entries?.() ?? []));
    for (const [name, handle] of entries) {
      if (!mapCache.has(name)) mapCache.set(name, handle);
    }
    return { ...newState, mapCache };
  });
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    statePromise.then((s) => {
      if (!s) return;
      s.refCount--;
      if (s.refCount <= 0) s.cleanup();
    }).catch(console.warn);
  };
  const handler = {
    get(_target, prop) {
      if (prop === Symbol.toStringTag || prop === Symbol.iterator || prop === "toString" || prop === "valueOf" || prop === "inspect" || prop === "constructor" || prop === "__proto__" || prop === "prototype") {
        return void 0;
      }
      if (prop === "dispose") return dispose;
      if (prop === "getMap") return () => localMapCache;
      if (prop === "entries") return () => localMapCache.entries();
      if (prop === "keys") return () => localMapCache.keys();
      if (prop === "values") return () => localMapCache.values();
      if (prop === Symbol.iterator) return () => localMapCache[Symbol.iterator]();
      if (prop === "size") return localMapCache.size;
      if (prop === "has") return (k) => localMapCache.has(k);
      if (prop === "get") return (k) => localMapCache.get(k);
      if (prop === "entries") return () => localMapCache.entries();
      if (prop === "keys") return () => localMapCache.keys();
      if (prop === "values") return () => localMapCache.values();
      if (prop === "refresh") {
        return () => statePromise.then((s) => s?.updateCache?.()).then(() => pxy);
      }
      if (prop === "then" || prop === "catch" || prop === "finally") {
        const p = statePromise.then(() => true);
        return p[prop].bind(p);
      }
      return (...args) => statePromise.then(async (s) => {
        if (!s) return void 0;
        const dh = await s.dirHandle;
        const v = dh?.[prop];
        if (typeof v === "function") return v.apply(dh, args);
        return v;
      });
    },
    // ВАЖНО: ownKeys должен быть синхронным
    ownKeys() {
      return Array.from(localMapCache.keys());
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    }
  };
  const fx = function() {
  };
  const pxy = new Proxy(fx, handler);
  return pxy;
}
async function readFile(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRoot, resolvedPath } = await resolvePath(rootHandle, relPath, options?.basePath || "");
    const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
    const file = await post("readFile", { rootId: "", path: cleanPath, type: "blob" }, resolvedRoot ? [resolvedRoot] : []);
    return file;
  } catch (e) {
    return handleError(logger, "error", `readFile: ${e.message}`);
  }
}
async function readAsObjectURL(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    const file = await readFile(rootHandle, relPath, options, logger);
    return file ? URL.createObjectURL(file) : null;
  } catch (e) {
    return handleError(logger, "error", `readAsObjectURL: ${e.message}`);
  }
}
async function readFileUTF8(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    const file = await readFile(rootHandle, relPath, options, logger);
    if (!file) return "";
    return await file.text();
  } catch (e) {
    return handleError(logger, "error", `readFileUTF8: ${e.message}`);
  }
}
async function writeFile(rootHandle, relPath, data, logger = defaultLogger) {
  if (data instanceof FileSystemFileHandle) {
    data = await data.getFile();
  }
  if (data instanceof FileSystemDirectoryHandle) {
    const dstHandle = await getDirectoryHandle(await resolveRootHandle(rootHandle), relPath + (relPath?.trim?.()?.endsWith?.("/") ? "" : "/") + (data?.name || "")?.trim?.()?.replace?.(/\s+/g, "-"), { create: true });
    return await copyFromOneHandlerToAnother(data, dstHandle, {})?.catch?.(console.warn.bind(console));
  } else
    try {
      const { rootHandle: resolvedRoot, resolvedPath } = await resolvePath(rootHandle, relPath, "");
      const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
      await post("writeFile", { rootId: "", path: cleanPath, data }, resolvedRoot ? [resolvedRoot] : []);
      return true;
    } catch (e) {
      return handleError(logger, "error", `writeFile: ${e.message}`);
    }
}
async function getFileWriter(rootHandle, relPath, options = { create: true }, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRootHandle, resolvedPath } = await resolvePath(rootHandle, relPath, options?.basePath || "");
    return (await getFileHandle(resolvedRootHandle, resolvedPath, options, logger))?.createWritable?.();
  } catch (e) {
    return handleError(logger, "error", `getFileWriter: ${e.message}`);
  }
}
async function removeFile(rootHandle, relPath, options = { recursive: true }, logger = defaultLogger) {
  try {
    const { rootHandle: resolvedRoot, resolvedPath } = await resolvePath(rootHandle, relPath, options?.basePath || "");
    const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
    await post("remove", { rootId: "", path: cleanPath, recursive: options.recursive }, resolvedRoot ? [resolvedRoot] : []);
    return true;
  } catch (e) {
    return handleError(logger, "error", `removeFile: ${e.message}`);
  }
}
async function removeDirectory(rootHandle, relPath, options = { recursive: true }, logger = defaultLogger) {
  try {
    return removeFile(rootHandle, relPath, options, logger);
  } catch (e) {
    return handleError(logger, "error", `removeDirectory: ${e.message}`);
  }
}
async function remove(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    return removeFile(rootHandle, relPath, { recursive: true, ...options }, logger);
  } catch (e) {
    return handleError(logger, "error", `remove: ${e.message}`);
  }
}
const openImageFilePicker = async () => {
  const $e = "showOpenFilePicker";
  const showOpenFilePicker = window?.[$e]?.bind?.(window) ?? (await __vitePreload(() => import('./showOpenFilePicker.js'),true              ?[]:void 0,import.meta.url))?.[$e];
  return showOpenFilePicker(imageImportDesc);
};
const downloadFile = async (file) => {
  if (file instanceof FileSystemFileHandle) {
    file = await file.getFile();
  }
  if (typeof file == "string") {
    file = await provide(file);
  }
  ;
  const filename = file?.name;
  if (!filename) return;
  if ("msSaveOrOpenBlob" in self.navigator) {
    self.navigator.msSaveOrOpenBlob(file, filename);
  }
  ;
  if (file instanceof FileSystemDirectoryHandle) {
    let dstHandle = await showDirectoryPicker?.({
      mode: "readwrite"
    })?.catch?.(console.warn.bind(console));
    if (file && dstHandle) {
      dstHandle = await getDirectoryHandle(dstHandle, file?.name || "", { create: true })?.catch?.(console.warn.bind(console)) || dstHandle;
      return await copyFromOneHandlerToAnother(file, dstHandle, {})?.catch?.(console.warn.bind(console));
    }
    return;
  }
  const fx = await (self?.showOpenFilePicker ? new Promise((r) => r({
    // @ts-ignore
    showOpenFilePicker: self?.showOpenFilePicker?.bind?.(window),
    // @ts-ignore
    showSaveFilePicker: self?.showSaveFilePicker?.bind?.(window)
    // @ts-ignore
  })) : __vitePreload(() => import(
    /* @vite-ignore */
    './showOpenFilePicker.js'
  ),true              ?[]:void 0,import.meta.url));
  if (window?.showSaveFilePicker) {
    const fileHandle = await fx?.showSaveFilePicker?.({ suggestedName: filename })?.catch?.(console.warn.bind(console));
    const writableFileStream = await fileHandle?.createWritable?.({ keepExistingData: true })?.catch?.(console.warn.bind(console));
    await writableFileStream?.write?.(file)?.catch?.(console.warn.bind(console));
    await writableFileStream?.close?.()?.catch?.(console.warn.bind(console));
  } else {
    const a = document.createElement("a");
    try {
      a.href = URL.createObjectURL(file);
    } catch (e) {
      console.warn(e);
    }
    ;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      globalThis.URL.revokeObjectURL(a.href);
    }, 0);
  }
};
const provide = async (req = "", rw = false) => {
  const url = req?.url ?? req;
  const cleanUrl = url?.replace?.(location.origin, "")?.trim?.();
  if (cleanUrl?.startsWith?.("/user")) {
    const path = cleanUrl?.replace?.(/^\/user/g, "")?.trim?.();
    const root = await navigator?.storage?.getDirectory?.();
    const handle = await getFileHandle(root, path, { create: !!rw });
    if (rw) {
      return handle?.createWritable?.();
    }
    return handle?.getFile?.();
  } else {
    try {
      if (!req) return null;
      const r = await fetch(req);
      const blob = await r?.blob()?.catch?.(console.warn.bind(console));
      const lastModifiedHeader = r?.headers?.get?.("Last-Modified");
      const lastModified = lastModifiedHeader ? Date.parse(lastModifiedHeader) : 0;
      if (blob) {
        return new File([blob], url?.substring(url?.lastIndexOf("/") + 1), {
          type: blob?.type,
          lastModified: isNaN(lastModified) ? 0 : lastModified
        });
      }
    } catch (e) {
      return handleError(defaultLogger, "error", `provide: ${e.message}`);
    }
  }
};
const getLeast = (item) => {
  if (item?.types?.length > 0) {
    return item?.getType?.(Array.from(item?.types || [])?.at?.(-1));
  }
  return null;
};
const dropFile = async (file, dest = "/user/"?.trim?.()?.replace?.(/\s+/g, "-"), current) => {
  const fs = await resolveRootHandle(null);
  const path = getDir(dest?.trim?.()?.startsWith?.("/user/") ? dest?.replace?.(/^\/user/g, "")?.trim?.() : dest);
  const user = path?.replace?.("/user", "")?.trim?.();
  file = file instanceof File ? file : new File([file], UUIDv4() + "." + (file?.type?.split?.("/")?.[1] || "tmp"));
  const fp = user + (file?.name || "wallpaper")?.trim?.()?.replace?.(/\s+/g, "-");
  await writeFile(fs, fp, file);
  current?.set?.("/user" + fp?.trim?.()?.replace?.(/\s+/g, "-"), file);
  return "/user" + fp?.trim?.();
};
const uploadDirectory = async (dest = "/user/", id = null) => {
  dest = dest?.trim?.()?.startsWith?.("/user/") ? dest?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : dest;
  if (!globalThis.showDirectoryPicker) {
    return;
  }
  const srcHandle = await showDirectoryPicker?.({
    mode: "readonly",
    id
  })?.catch?.(console.warn.bind(console));
  if (!srcHandle) return;
  const dstHandle = await getDirectoryHandle(await resolveRootHandle(null), dest + (dest?.trim?.()?.endsWith?.("/") ? "" : "/") + srcHandle.name?.trim?.()?.replace?.(/\s+/g, "-"), { create: true });
  if (!dstHandle) return;
  return await copyFromOneHandlerToAnother(srcHandle, dstHandle, {})?.catch?.(console.warn.bind(console));
};
const uploadFile = async (dest = "/user/"?.trim?.()?.replace?.(/\s+/g, "-"), current) => {
  const $e = "showOpenFilePicker";
  dest = dest?.trim?.()?.startsWith?.("/user/") ? dest?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : dest;
  const showOpenFilePicker = window?.[$e]?.bind?.(window) ?? (await __vitePreload(() => import('./showOpenFilePicker.js'),true              ?[]:void 0,import.meta.url))?.[$e];
  return showOpenFilePicker({ ...generalFileImportDesc, multiple: true })?.then?.(async (handles = []) => {
    for (const handle of handles) {
      const file = handle instanceof File ? handle : await handle?.getFile?.();
      await dropFile(file, dest, current);
    }
  });
};
const ghostImage = typeof Image != "undefined" ? new Image() : null;
if (ghostImage) {
  ghostImage.decoding = "async";
  ghostImage.width = 24;
  ghostImage.height = 24;
  try {
    ghostImage.src = URL.createObjectURL(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 384 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z"/></svg>`], { type: "image/svg+xml" }));
  } catch (e) {
  }
}
const attachFile = (transfer, file, path = "") => {
  try {
    const url = URL.createObjectURL(file);
    if (file?.type && file?.type != "text/plain") {
      transfer?.items?.add?.(file, file?.type || "text/plain");
    } else {
      transfer?.add?.(file);
    }
    if (path) {
      transfer?.items?.add?.(path, "text/plain");
    }
    ;
    transfer?.setData?.("text/uri-list", url);
    transfer?.setData?.("DownloadURL", file?.type + ":" + file?.name + ":" + url);
  } catch (e) {
  }
};
const dropAsTempFile = async (data) => {
  const items = data?.items;
  const item = items?.[0];
  const isImage = item?.types?.find?.((n) => n?.startsWith?.("image/"));
  const blob = await (data?.files?.[0] ?? ((isImage ? item?.getType?.(isImage) : null) || getLeast(item)));
  return dropFile(blob, "/user/temp/"?.trim?.()?.replace?.(/\s+/g, "-"));
};
const clearAllInDirectory = async (rootHandle = null, relPath = "", options = {}, logger = defaultLogger) => {
  try {
    const { rootHandle: resolvedRoot, resolvedPath } = await resolvePath(rootHandle, relPath, options?.basePath || "");
    const cleanPath = resolvedPath?.trim?.()?.startsWith?.("/user/") ? resolvedPath?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : resolvedPath;
    await post("remove", { rootId: "", path: cleanPath, recursive: true }, resolvedRoot ? [resolvedRoot] : []);
  } catch (e) {
    return handleError(logger, "error", `clearAllInDirectory: ${e.message}`);
  }
};
const copyFromOneHandlerToAnother = async (fromHandle, toHandle, options = {}, logger = defaultLogger) => {
  return post("copy", { from: fromHandle, to: toHandle }, [fromHandle, toHandle]);
};
const handleIncomingEntries = (data, destPath = "/user/", rootHandle = null, onItemHandled) => {
  const tasks = [];
  const items = Array.from(data?.items ?? []);
  const files = Array.from(data?.files ?? []);
  const dataArray = Array.isArray(data) ? data : [...data?.[Symbol.iterator] ? data : [data]];
  return Promise.try(async () => {
    const resolvedRoot = await resolveRootHandle(rootHandle);
    const processItem = async (item) => {
      let handle;
      if (item.kind === "file" || item.kind === "directory") {
        try {
          handle = await item.getAsFileSystemHandle?.();
        } catch {
        }
      }
      if (handle) {
        if (handle.kind === "directory") {
          const nwd = await getDirectoryHandle(resolvedRoot, destPath + (handle.name || "").trim().replace(/\s+/g, "-"), { create: true });
          if (nwd) tasks.push(copyFromOneHandlerToAnother(handle, nwd, { create: true }));
        } else {
          const file = await handle.getFile();
          const path = destPath + (file.name || handle.name).trim().replace(/\s+/g, "-");
          tasks.push(writeFile(resolvedRoot, path, file).then(() => onItemHandled?.(file, path)));
        }
        return;
      }
      if (item.kind === "file" || item instanceof File) {
        const file = item instanceof File ? item : item.getAsFile();
        if (file) {
          const path = destPath + file.name.trim().replace(/\s+/g, "-");
          tasks.push(writeFile(resolvedRoot, path, file).then(() => onItemHandled?.(file, path)));
        }
        return;
      }
    };
    if (items?.length > 0) {
      for (const item of items) {
        await processItem(item);
      }
    }
    if (files?.length > 0) {
      for (const file of files) {
        await processItem(file);
      }
    }
    if (dataArray?.length > 0) {
      for (const item of dataArray) {
        await processItem(item);
      }
    }
    const uriList = data?.getData?.("text/uri-list") || data?.getData?.("text/plain");
    if (uriList && typeof uriList === "string") {
      const urls = uriList.split(/\r?\n/).filter(Boolean);
      for (const url of urls) {
        if (url.startsWith("file://")) continue;
        if (url.startsWith("/user/")) {
          const src = url.trim();
          tasks.push(Promise.try(async () => {
            const srcHandle = await getHandler(resolvedRoot, src);
            if (srcHandle?.handle) {
              const name = src.split("/").filter(Boolean).pop();
              if (srcHandle.type === "directory") {
                const nwd = await getDirectoryHandle(resolvedRoot, destPath + name, { create: true });
                await copyFromOneHandlerToAnother(srcHandle.handle, nwd, { create: true });
              } else {
                const file = await srcHandle.handle.getFile();
                const path = destPath + name;
                await writeFile(resolvedRoot, path, file);
                onItemHandled?.(file, path);
              }
            }
          }));
        } else {
          tasks.push(Promise.try(async () => {
            const file = await provide(url);
            if (file) {
              const path = destPath + file.name;
              await writeFile(resolvedRoot, path, file);
              onItemHandled?.(file, path);
            }
          }));
        }
      }
    }
    if (dataArray?.[0] instanceof ClipboardItem) {
      for (const item of dataArray) {
        for (const type of item.types) {
          if (type.startsWith("image/") || type.startsWith("text/")) {
            const blob = await item.getType(type);
            const ext = type.split("/")[1].split("+")[0] || "txt";
            const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type });
            const path = destPath + file.name;
            tasks.push(writeFile(resolvedRoot, path, file).then(() => onItemHandled?.(file, path)));
          }
        }
      }
    }
    await Promise.allSettled(tasks).catch(console.warn.bind(console));
  });
};

const batteryStatusRef = () => {
  const rv = ref("battery-charging");
  const batteryStatus = navigator.getBattery?.();
  const batteryIcons = /* @__PURE__ */ new Map([
    [0, "battery-warning"],
    [25, "battery"],
    [50, "battery-low"],
    [75, "battery-medium"],
    [100, "battery-full"]
  ]);
  const byLevel = (lv = 1) => batteryIcons.get(Math.max(Math.min(Math.round(lv * 4) * 25, 100), 0)) || "battery";
  const changeBatteryStatus = () => {
    let battery = "battery-charging";
    if (!batteryStatus) {
      rv.value = battery;
    } else {
      batteryStatus?.then?.((btr) => {
        if (btr.charging) {
          battery = "battery-charging";
        } else {
          battery = byLevel(btr.level) || "battery";
        }
        ;
        rv.value = battery;
      })?.catch?.(console.warn.bind(console));
    }
  };
  changeBatteryStatus();
  setIdleInterval$1(changeBatteryStatus, 1e3);
  batteryStatus?.then?.((btr) => {
    addEvent(btr, "chargingchange", changeBatteryStatus);
    addEvent(btr, "levelchange", changeBatteryStatus);
    changeBatteryStatus();
  });
  return rv;
};
const timeStatusRef = () => {
  const rv = ref("00:00:00");
  const updateTime = () => rv.value = (/* @__PURE__ */ new Date()).toLocaleTimeString(navigator.language, { hour12: false, timeStyle: "short" });
  setIdleInterval$1(updateTime, 15e3);
  document.addEventListener("DOMContentLoaded", updateTime, { once: true });
  return rv;
};
const signalStatusRef = () => {
  const rv = ref("wifi-off");
  const changeSignal = () => rv.value = signalIcons[navigator.onLine ? navigator?.connection?.effectiveType || "4g" : "offline"];
  const signalIcons = {
    "offline": "wifi-off",
    "4g": "wifi",
    "3g": "wifi-high",
    "2g": "wifi-low",
    "slow-2g": "wifi-zero"
  };
  addEvent(navigator.connection, "change", changeSignal);
  setIdleInterval$1(changeSignal, 1e3);
  changeSignal?.();
  return rv;
};

const makeRenderer = () => {
  const canvas = document.createElement("canvas");
  const fallback = document.createElement("div");
  canvas.width = 1;
  canvas.height = 1;
  canvas.classList.add("u2-renderer");
  canvas.classList.add("u2-implement");
  fallback.classList.add("u2-fallback");
  fallback.classList.add("u2-renderer");
  fallback.style.inlineSize = "stretch";
  fallback.style.blockSize = "stretch";
  fallback.style.contain = "layout paint";
  fallback.style.containIntrinsicInlineSize = "1px";
  fallback.style.containIntrinsicBlockSize = "1px";
  fallback.style.maxInlineSize = "min(100cqi, 100dvi)";
  fallback.style.maxBlockSize = "min(100cqb, 100dvb)";
  fallback.style.pointerEvents = "auto";
  canvas.style.inlineSize = "stretch";
  canvas.style.blockSize = "stretch";
  canvas.style.objectFit = "contain";
  canvas.style.objectPosition = "center";
  canvas.style.imageRendering = "auto";
  canvas.style.imageRendering = "optimizeQuality";
  canvas.style.imageRendering = "smooth";
  canvas.style.imageRendering = "high-quality";
  canvas.style.contain = "layout paint";
  canvas.style.containIntrinsicInlineSize = "1px";
  canvas.style.containIntrinsicBlockSize = "1px";
  canvas.style.maxInlineSize = "min(100cqi, 100dvi)";
  canvas.style.maxBlockSize = "min(100cqb, 100dvb)";
  canvas.style.pointerEvents = "auto";
  canvas.layoutsubtree = true;
  canvas.setAttribute("layoutsubtree", "true");
  const ctx = canvas?.getContext?.("2d");
  if (!ctx) {
    return fallback;
  }
  if (ctx?.drawElement == null && ctx?.drawElementImage == null) {
    return fallback;
  }
  const drawElementAct = ctx?.drawElementImage != null ? ctx?.drawElementImage?.bind?.(ctx) : ctx?.drawElement?.bind?.(ctx);
  if (drawElementAct == null) {
    return fallback;
  }
  const makeInteractive = (element) => {
    const drawElement = element ?? canvas.children?.[0];
    if (drawElement == null) return;
    try {
      ctx.setHitTestRegions([{
        element: drawElement,
        rect: {
          x: 0,
          y: 0,
          width: drawElement?.offsetWidth * devicePixelRatio,
          height: drawElement?.offsetHeight * devicePixelRatio
        }
      }]);
    } catch (e) {
      console.warn(e);
    }
  };
  const rafDebounce = RAFBehavior();
  const doRender = () => {
    const drawElement = canvas.children?.[0];
    if (drawElementAct == null || drawElement == null || !canvas.checkVisibility() || canvas.dataset.dragging != null || canvas.closest?.("[data-dragging]") != null) return;
    ctx.reset();
    ctx.save();
    ctx.scale(devicePixelRatio || 1, devicePixelRatio || 1);
    try {
      drawElementAct(drawElement, 0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
    } catch (e) {
      console.warn(e);
    }
    makeInteractive();
    ctx.restore();
  };
  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries.find((entry2) => entry2.target === canvas);
    const newWidth = Math.min(entry?.devicePixelContentBoxSize?.[0]?.inlineSize || canvas.width, (canvas?.offsetParent || document.documentElement)?.clientWidth * devicePixelRatio);
    const newHeight = Math.min(entry?.devicePixelContentBoxSize?.[0]?.blockSize || canvas.height, (canvas?.offsetParent || document.documentElement)?.clientHeight * devicePixelRatio);
    if (newWidth != canvas.width) {
      canvas.width = newWidth;
    }
    ;
    if (newHeight != canvas.height) {
      canvas.height = newHeight;
    }
    ;
    if (newWidth != canvas.width || newHeight != canvas.height) {
      rafDebounce(doRender);
    }
    ;
  });
  queueMicrotask(() => {
    resizeObserver.observe(canvas, { box: ["device-pixel-content-box"], fireOnEveryPaint: true });
  });
  (async () => {
    while (true) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (canvas.checkVisibility() && canvas.dataset.dragging == null && canvas.closest?.("[data-dragging]") == null) {
        doRender();
      }
    }
  })();
  return canvas;
};

const DEFAULT_MIME = "application/octet-stream";
const DATA_URL_RE = /^data:(?<mime>[^;,]+)?(?<params>(?:;[^,]*)*?),(?<data>[\s\S]*)$/i;
function canUseFromBase64() {
  return typeof Uint8Array.fromBase64 === "function";
}
function canUseToBase64(u8) {
  return typeof u8.toBase64 === "function";
}
function tryDecodeURIComponent(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function likelyUriComponent(s) {
  return /%[0-9A-Fa-f]{2}/.test(s) || s.includes("+");
}
function isTextMime(mimeType) {
  const t = (mimeType || "").toLowerCase();
  return t.startsWith("text/") || t.includes("json") || t.includes("xml") || t.includes("svg") || t.includes("javascript") || t.includes("ecmascript");
}
function bytesToArrayBuffer(bytes) {
  const buf = bytes.buffer;
  if (buf instanceof ArrayBuffer) {
    return buf.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}
function parseDataUrl(input) {
  const s = (input || "").trim();
  if (!s.toLowerCase().startsWith("data:")) return null;
  const m = s.match(DATA_URL_RE);
  if (!m?.groups) return null;
  const mimeType = (m.groups.mime || DEFAULT_MIME).trim() || DEFAULT_MIME;
  const params = (m.groups.params || "").toLowerCase();
  const isBase64 = params.includes(";base64");
  const data = m.groups.data ?? "";
  return { mimeType, isBase64, data };
}
function decodeBase64ToBytes(base64, options = {}) {
  const alphabet = options.alphabet || "base64";
  const lastChunkHandling = options.lastChunkHandling || "loose";
  const s = (base64 || "").trim();
  if (canUseFromBase64()) {
    return Uint8Array.fromBase64(s, { alphabet, lastChunkHandling });
  }
  const normalized = alphabet === "base64url" ? s.replace(/-/g, "+").replace(/_/g, "/") : s;
  const padLen = (4 - normalized.length % 4) % 4;
  const padded = normalized + "=".repeat(padLen);
  const binary = typeof atob === "function" ? atob(padded) : "";
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
function encodeBytesToBase64(bytes, options = {}) {
  const alphabet = options.alphabet || "base64";
  if (canUseToBase64(bytes)) {
    return bytes.toBase64({ alphabet });
  }
  const chunkSize = 32768;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const b64 = typeof btoa === "function" ? btoa(binary) : "";
  if (alphabet !== "base64url") return b64;
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function blobToBytes(blob) {
  const ab = await blob.arrayBuffer();
  return new Uint8Array(ab);
}
async function blobToText$1(blob, encoding = "utf-8") {
  if (typeof blob.text === "function") return await blob.text();
  const bytes = await blobToBytes(blob);
  const dec = new TextDecoder(encoding);
  return dec.decode(bytes);
}
async function blobToBase64(blob, options = {}) {
  const bytes = await blobToBytes(blob);
  return encodeBytesToBase64(bytes, options);
}
async function blobToDataUrl(blob, options = {}) {
  const mimeType = (options.mimeType || blob.type || DEFAULT_MIME).trim() || DEFAULT_MIME;
  const wantsBase64 = options.base64 ?? !isTextMime(mimeType);
  if (wantsBase64) {
    const b64 = await blobToBase64(blob, options.base64Options || {});
    return `data:${mimeType};base64,${b64}`;
  }
  const text = await blobToText$1(blob, options.textEncoding || "utf-8");
  const payload = options.uriComponent ? encodeURIComponent(text) : text;
  return `data:${mimeType},${payload}`;
}
async function fileToDataUrl(file, options = {}) {
  return await blobToDataUrl(file, options);
}
function looksLikeBase64(s) {
  const t = (s || "").trim();
  if (!t) return { isBase64: false, alphabet: "base64" };
  const hasUrlAlphabet = /[-_]/.test(t) && !/[+/]/.test(t);
  const alphabet = hasUrlAlphabet ? "base64url" : "base64";
  const normalized = alphabet === "base64url" ? t.replace(/-/g, "+").replace(/_/g, "/") : t;
  const cleaned = normalized.replace(/[\r\n\s]/g, "");
  const allowed = /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned);
  if (!allowed) return { isBase64: false, alphabet };
  if (cleaned.length < 8) return { isBase64: false, alphabet };
  return { isBase64: true, alphabet };
}
function canParseUrl(value) {
  try {
    if (typeof URL === "undefined") return false;
    if (typeof URL.canParse === "function") return URL.canParse(value);
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
function extensionByMimeType(mimeType) {
  const t = (mimeType || "").toLowerCase().split(";")[0].trim();
  if (!t) return "bin";
  const mapped = {
    "text/plain": "txt",
    "text/markdown": "md",
    "text/html": "html",
    "application/json": "json",
    "application/xml": "xml",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf"
  };
  if (mapped[t]) return mapped[t];
  const slashIdx = t.indexOf("/");
  if (slashIdx <= 0 || slashIdx >= t.length - 1) return "bin";
  let subtype = t.slice(slashIdx + 1);
  if (subtype.includes("+")) subtype = subtype.split("+")[0];
  if (subtype.includes(".")) subtype = subtype.split(".").pop() || subtype;
  return subtype || "bin";
}
function fallbackHashHex(bytes) {
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}
async function sha256Hex(bytes) {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return fallbackHashHex(bytes);
    const digest = await subtle.digest("SHA-256", bytes);
    const out = new Uint8Array(digest);
    return Array.from(out, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return fallbackHashHex(bytes);
  }
}
function isBase64Like(input) {
  return looksLikeBase64(input).isBase64;
}
async function normalizeDataAsset(input, options = {}) {
  const maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  const namePrefix = (options.namePrefix || "asset").trim() || "asset";
  const preserveFileName = options.preserveFileName ?? false;
  let source = "text";
  let blob;
  let incomingFile = null;
  if (input instanceof File) {
    source = "file";
    incomingFile = input;
    blob = options.mimeType && options.mimeType !== input.type ? new Blob([await input.arrayBuffer()], { type: options.mimeType }) : input;
  } else if (input instanceof Blob) {
    source = "blob";
    blob = options.mimeType && options.mimeType !== input.type ? new Blob([await input.arrayBuffer()], { type: options.mimeType }) : input;
  } else {
    const raw = (input instanceof URL ? input.toString() : String(input ?? "")).trim();
    const parsed = parseDataUrl(raw);
    const decodedUri = options.uriComponent ? tryDecodeURIComponent(raw) : likelyUriComponent(raw) ? tryDecodeURIComponent(raw) : raw;
    if (parsed) {
      source = "data-url";
    } else if (canParseUrl(raw)) {
      source = "url";
    } else if (isBase64Like(raw)) {
      source = "base64";
    } else if (decodedUri !== raw && (parseDataUrl(decodedUri) || isBase64Like(decodedUri) || canParseUrl(decodedUri))) {
      source = "uri";
    } else {
      source = "text";
    }
    const stringSource = source === "uri" ? decodedUri : raw;
    blob = await stringToBlob(stringSource, {
      mimeType: options.mimeType,
      uriComponent: options.uriComponent,
      isBase64: source === "base64" ? true : void 0,
      maxBytes
    });
  }
  const bytes = await blobToBytes(blob);
  if (bytes.byteLength > maxBytes) throw new Error(`Data too large: ${bytes.byteLength} bytes`);
  const hash = await sha256Hex(bytes);
  const mimeType = (options.mimeType || blob.type || DEFAULT_MIME).trim() || DEFAULT_MIME;
  const extension = extensionByMimeType(mimeType);
  const hashedName = options.filename || `${namePrefix}-${hash.slice(0, 16)}.${extension}`;
  const finalName = preserveFileName && incomingFile?.name ? incomingFile.name : hashedName;
  const file = incomingFile && preserveFileName && !options.mimeType ? incomingFile : new File([blob], finalName, { type: mimeType });
  return {
    hash,
    name: file.name,
    type: file.type || mimeType,
    size: file.size,
    source,
    file
  };
}
async function stringToBlobOrFile(input, options = {}) {
  const maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  const raw = (input ?? "").trim();
  const parsedDataUrl = parseDataUrl(raw);
  if (parsedDataUrl) {
    const mimeType2 = options.mimeType || parsedDataUrl.mimeType || DEFAULT_MIME;
    const payload = options.uriComponent ? tryDecodeURIComponent(parsedDataUrl.data) : likelyUriComponent(parsedDataUrl.data) ? tryDecodeURIComponent(parsedDataUrl.data) : parsedDataUrl.data;
    const isBase642 = options.isBase64 ?? parsedDataUrl.isBase64;
    if (isBase642) {
      const bytes = decodeBase64ToBytes(payload, {
        alphabet: options.base64?.alphabet || "base64",
        lastChunkHandling: options.base64?.lastChunkHandling || "loose"
      });
      if (bytes.byteLength > maxBytes) throw new Error(`Decoded data too large: ${bytes.byteLength} bytes`);
      const blob3 = new Blob([bytesToArrayBuffer(bytes)], { type: mimeType2 });
      if (!options.asFile) return blob3;
      return new File([blob3], options.filename || "file", { type: mimeType2 });
    }
    const blob2 = new Blob([payload], { type: mimeType2 });
    if (!options.asFile) return blob2;
    return new File([blob2], options.filename || "file", { type: mimeType2 });
  }
  try {
    if (typeof URL !== "undefined" && URL.canParse?.(raw)) {
      const res = await fetch(raw);
      const blob2 = await res.blob();
      const mimeType2 = options.mimeType || blob2.type || DEFAULT_MIME;
      const typed = blob2.type === mimeType2 ? blob2 : new Blob([await blob2.arrayBuffer()], { type: mimeType2 });
      if (!options.asFile) return typed;
      return new File([typed], options.filename || "file", { type: mimeType2 });
    }
  } catch {
  }
  const maybeDecoded = options.uriComponent ? tryDecodeURIComponent(raw) : likelyUriComponent(raw) ? tryDecodeURIComponent(raw) : raw;
  const base64Hint = looksLikeBase64(maybeDecoded);
  const isBase64 = options.isBase64 ?? base64Hint.isBase64;
  const mimeType = options.mimeType || (isBase64 ? DEFAULT_MIME : "text/plain;charset=utf-8");
  if (isBase64) {
    const bytes = decodeBase64ToBytes(maybeDecoded, {
      alphabet: options.base64?.alphabet || base64Hint.alphabet,
      lastChunkHandling: options.base64?.lastChunkHandling || "loose"
    });
    if (bytes.byteLength > maxBytes) throw new Error(`Decoded data too large: ${bytes.byteLength} bytes`);
    const blob2 = new Blob([bytesToArrayBuffer(bytes)], { type: mimeType });
    if (!options.asFile) return blob2;
    return new File([blob2], options.filename || "file", { type: mimeType });
  }
  const blob = new Blob([maybeDecoded], { type: mimeType });
  if (!options.asFile) return blob;
  return new File([blob], options.filename || "file", { type: mimeType });
}
async function stringToBlob(input, options = {}) {
  return await stringToBlobOrFile(input, { ...options, asFile: false });
}
async function stringToFile(input, filename, options = {}) {
  return await stringToBlobOrFile(input, { ...options, asFile: true, filename });
}

const registeredCSSProperties = /* @__PURE__ */ new Set();
[
  // @ts-ignore
  { name: "--drag-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--drag-y", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--resize-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--resize-y", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--shift-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--shift-y", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-transition-r", syntax: "<length-percentage>", inherits: false, initialValue: "0px" },
  { name: "--cs-transition-c", syntax: "<length-percentage>", inherits: false, initialValue: "0px" },
  { name: "--cs-p-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cs-p-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--os-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--os-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--rv-grid-r", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--rv-grid-c", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cell-x", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--cell-y", syntax: "<number>", inherits: false, initialValue: "0" }
].forEach((options) => {
  if (typeof CSS != "undefined" && !registeredCSSProperties.has(options.name)) {
    try {
      CSS?.registerProperty?.(options);
      registeredCSSProperties.add(options.name);
    } catch (e) {
    }
  }
});
const depAxis = (axis = "x") => {
  const m = (
    /*matchMedia("(orientation: portrait)").matches*/
    true
  );
  return { ["x"]: m ? "c" : "r", ["y"]: m ? "r" : "c" }[axis];
};
const swapped = (axis = "x") => {
  const m = matchMedia("(orientation: portrait)").matches;
  return { ["x"]: m ? "x" : "y", ["y"]: m ? "y" : "x" }[axis];
};
const animationSequence = (DragCoord = 0, axis = "x") => {
  const drag = "--drag-" + axis;
  const axisKey = depAxis(axis);
  const rvProp = `--rv-grid-${axisKey}`;
  const gridProp = `--cs-grid-${axisKey}`;
  const prevGridProp = `--cs-p-grid-${axisKey}`;
  return [
    { [rvProp]: `var(${prevGridProp})`, [drag]: DragCoord },
    // starting...
    { [rvProp]: `var(${gridProp})`, [drag]: 0 }
  ];
};
const doAnimate = async (newItem, axis = "x", animate = false, signal) => {
  const dragCoord = parseFloat(newItem?.style?.getPropertyValue?.("--drag-" + axis) || "0") || 0;
  if (!animate) {
    await new Promise((r) => requestAnimationFrame(r));
  }
  ;
  const animation = animate && !matchMedia("(prefers-reduced-motion: reduce)")?.matches ? newItem.animate(animationSequence(dragCoord, axis), {
    fill: "none",
    duration: 200,
    //duration: 150,
    easing: "linear"
  }) : null;
  let shifted = false;
  const onShift = [(ev) => {
    if (!shifted) {
      shifted = true;
      animation?.finish?.();
    }
    newItem?.removeEventListener?.("m-dragstart", ...onShift);
    signal?.removeEventListener?.("abort", ...onShift);
  }, { once: true }];
  signal?.addEventListener?.("abort", ...onShift);
  newItem?.addEventListener?.("m-dragstart", ...onShift);
  return animation?.finished?.catch?.(console.warn.bind(console));
};
const reflectCell = async (newItem, pArgs, withAnimate = false) => {
  const layout = [pArgs?.layout?.columns || pArgs?.layout?.[0] || 4, pArgs?.layout?.rows || pArgs?.layout?.[1] || 8];
  const { item, list, items } = pArgs;
  await new Promise((r) => queueMicrotask(() => r(true)));
  return affected?.(item, (state, property) => {
    const gridSystem = newItem?.parentElement;
    layout[0] = parseInt(gridSystem?.getAttribute?.("data-grid-columns") || "4") || layout[0];
    layout[1] = parseInt(gridSystem?.getAttribute?.("data-grid-rows") || "8") || layout[1];
    const args = { item, list, items, layout, size: [gridSystem?.clientWidth, gridSystem?.clientHeight] };
    if (item && !item?.cell) {
      item.cell = makeObjectAssignable(observe([0, 0]));
    }
    ;
    if (property == "cell") {
      const nc = redirectCell(item?.cell || [0, 0], args);
      if (nc[0] != item?.cell?.[0] && item?.cell) {
        item.cell[0] = nc?.[0];
      }
      if (nc[1] != item?.cell?.[1] && item?.cell) {
        item.cell[1] = nc?.[1];
      }
      setStyleProperty(newItem, "--p-cell-x", nc?.[0]);
      setStyleProperty(newItem, "--p-cell-y", nc?.[1]);
      setStyleProperty(newItem, "--cell-x", nc?.[0]);
      setStyleProperty(newItem, "--cell-y", nc?.[1]);
    }
  });
};
const makeDragEvents = async (newItem, { layout, dragging, currentCell, syncDragStyles }, { item, items, list }) => {
  const $updateLayout = (newItem2) => {
    const gridSystem = newItem2?.parentElement;
    if (!gridSystem) {
      return layout;
    }
    layout[0] = parseInt(gridSystem.getAttribute?.("data-grid-columns") || "4") || layout[0];
    layout[1] = parseInt(gridSystem.getAttribute?.("data-grid-rows") || "8") || layout[1];
    return layout;
  };
  const getSpanOffset = (bounds, layoutSnapshot, size, orient) => {
    if (!bounds || !layoutSnapshot || !size || orient == null) {
      return [0, 0];
    }
    const safeLayout = [
      Math.max(layoutSnapshot?.[0] || 0, 1),
      Math.max(layoutSnapshot?.[1] || 0, 1)
    ];
    const orientedSize = orient % 2 ? [size?.[1] || 1, size?.[0] || 1] : [size?.[0] || 1, size?.[1] || 1];
    const cellSize = [
      (orientedSize[0] || 1) / safeLayout[0],
      (orientedSize[1] || 1) / safeLayout[1]
    ];
    const spanX = Math.max((bounds?.width || cellSize[0]) / (cellSize[0] || 1), 1);
    const spanY = Math.max((bounds?.height || cellSize[1]) / (cellSize[1] || 1), 1);
    return [(spanX - 1) / 2, (spanY - 1) / 2];
  };
  const computeCellFromBounds = () => {
    const gridSystem = newItem?.parentElement;
    if (!gridSystem) {
      return null;
    }
    const orient = orientOf(gridSystem);
    const cbox = getBoundingOrientRect(newItem, orient) ?? newItem?.getBoundingClientRect?.();
    const pbox = getBoundingOrientRect(gridSystem, orient) ?? gridSystem?.getBoundingClientRect?.();
    if (!cbox || !pbox) {
      return null;
    }
    const layoutSnapshot = [...$updateLayout(newItem)];
    const parentRect = gridSystem.getBoundingClientRect?.();
    const gridSize = [
      gridSystem?.clientWidth || gridSystem?.offsetWidth || parentRect?.width || 1,
      gridSystem?.clientHeight || gridSystem?.offsetHeight || parentRect?.height || 1
    ];
    const inset = [
      //(cbox.left - pbox.left),
      //(cbox.top - pbox.top)
      (cbox.left + cbox.right) / 2 - pbox.left,
      (cbox.top + cbox.bottom) / 2 - pbox.top
    ];
    const args = { item, items, list, layout: layoutSnapshot, size: gridSize };
    const spanOffset = getSpanOffset(cbox, layoutSnapshot, gridSize, orient);
    const projected = convertOrientPxToCX(inset, args, orient);
    projected[0] -= spanOffset[0];
    projected[1] -= spanOffset[1];
    const flooredCell = floorCell(projected);
    const redirectedCell = redirectCell([flooredCell.x.value, flooredCell.y.value], args);
    const clampedCell = clampCell(redirectedCell, layoutSnapshot);
    return {
      inset: [inset[0] - dragging?.[0]?.value, inset[1] - dragging?.[1]?.value],
      cell: [clampedCell.x.value, clampedCell.y.value]
      // Convert Vector2D back to array
    };
  };
  const setCellAxis = (cell, axis = 0) => {
    if (!cell) {
      return;
    }
    if (currentCell?.[axis]?.value != cell?.[axis]) {
      try {
        currentCell[axis].value = cell[axis];
      } catch (e) {
      }
      ;
    }
    ;
  };
  const setCell = (cell) => {
    const args = { item, items, list, layout, size: [newItem?.clientWidth || 0, newItem?.clientHeight || 0] };
    const redirectedCell = redirectCell(cell, args);
    const clampedCell = clampCell(redirectedCell, layout);
    cell = [clampedCell.x.value, clampedCell.y.value];
    setCellAxis(cell, 0);
    setCellAxis(cell, 1);
  };
  const syncInsetVars = (inset) => {
    if (!inset) {
      return;
    }
    setStyleProperty(newItem, "--cs-inset-x", `${inset[0] || 0}px`);
    setStyleProperty(newItem, "--cs-inset-y", `${inset[1] || 0}px`);
  };
  const correctOffset = (dragging2) => {
    const ctx = computeCellFromBounds();
    const cell = ctx?.cell;
    if (cell) {
      syncInsetVars(ctx?.inset || [0, 0]);
      setCell(cell);
      setStyleProperty(newItem, "--p-cell-x", cell?.[0] ?? currentCell?.[0]?.value ?? item?.cell?.[0] ?? 0);
      setStyleProperty(newItem, "--p-cell-y", cell?.[1] ?? currentCell?.[1]?.value ?? item?.cell?.[1] ?? 0);
      setStyleProperty(newItem, "--cell-x", cell?.[0] ?? currentCell?.[0]?.value ?? item?.cell?.[0] ?? 0);
      setStyleProperty(newItem, "--cell-y", cell?.[1] ?? currentCell?.[1]?.value ?? item?.cell?.[1] ?? 0);
    }
    if (dragging2 && Array.isArray(dragging2)) {
      try {
        dragging2[0].value = 0, dragging2[1].value = 0;
      } catch (e) {
      }
      ;
    }
    syncDragStyles?.(true);
    newItem?.setAttribute?.("data-dragging", "");
    return [0, 0];
  };
  const resolveDragging = (dragging2) => {
    const ctx = computeCellFromBounds();
    const cell = ctx?.cell;
    setStyleProperty(newItem, "--p-cell-x", currentCell?.[0]?.value ?? item?.cell?.[0] ?? cell?.[0]);
    setStyleProperty(newItem, "--p-cell-y", currentCell?.[1]?.value ?? item?.cell?.[1] ?? cell?.[1]);
    syncDragStyles?.(true);
    if (cell) {
      setCell(cell);
      setStyleProperty(newItem, "--cell-x", cell?.[0] ?? currentCell?.[0]?.value ?? item?.cell?.[0] ?? 0);
      setStyleProperty(newItem, "--cell-y", cell?.[1] ?? currentCell?.[1]?.value ?? item?.cell?.[1] ?? 0);
    }
    const animations = [
      doAnimate(newItem, "x", true),
      doAnimate(newItem, "y", true)
    ];
    Promise.allSettled(animations).finally(() => {
      if (dragging2 && Array.isArray(dragging2)) {
        try {
          dragging2[0].value = 0, dragging2[1].value = 0;
        } catch (e) {
        }
        ;
      }
      syncDragStyles?.(true);
      if (cell) {
        setStyleProperty(newItem, "--p-cell-x", cell?.[0] ?? currentCell?.[0]?.value ?? item?.cell?.[0] ?? 0);
        setStyleProperty(newItem, "--p-cell-y", cell?.[1] ?? currentCell?.[1]?.value ?? item?.cell?.[1] ?? 0);
        setStyleProperty(newItem, "--cell-x", cell?.[0] ?? currentCell?.[0]?.value ?? item?.cell?.[0] ?? 0);
        setStyleProperty(newItem, "--cell-y", cell?.[1] ?? currentCell?.[1]?.value ?? item?.cell?.[1] ?? 0);
      }
      newItem?.removeAttribute?.("data-dragging");
      delete newItem?.dataset?.dragging;
    });
    return [0, 0];
  };
  const customTrigger = (doGrab) => new LongPressHandler(newItem, {
    handler: "*",
    anyPointer: true,
    mouseImmediate: true,
    minHoldTime: 60 * 3600,
    maxHoldTime: 100
  }, makeShiftTrigger((ev) => {
    correctOffset(dragging);
    doGrab?.(ev, newItem);
  }));
  return bindDraggable(customTrigger, resolveDragging, dragging);
};
const ROOT = typeof document != "undefined" ? document?.documentElement : null;
const bindInteraction = (newItem, pArgs) => {
  reflectCell(newItem, pArgs, true);
  const { item, items, list } = pArgs, layout = [pArgs?.layout?.columns || pArgs?.layout?.[0] || 4, pArgs?.layout?.rows || pArgs?.layout?.[1] || 8];
  const dragging = [numberRef(0, RAFBehavior()), numberRef(0, RAFBehavior())], currentCell = [numberRef(item?.cell?.[0] || 0), numberRef(item?.cell?.[1] || 0)];
  setStyleProperty(newItem, "--cell-x", currentCell?.[0]?.value || 0);
  setStyleProperty(newItem, "--cell-y", currentCell?.[1]?.value || 0);
  const applyDragStyles = () => {
    if (dragging?.[0]?.value != null) setStyleProperty(newItem, "--drag-x", dragging?.[0]?.value || 0);
    if (dragging?.[1]?.value != null) setStyleProperty(newItem, "--drag-y", dragging?.[1]?.value || 0);
  };
  let dragStyleRaf = 0, lastRaf = null;
  const syncDragStyles = (flush = false) => {
    if (flush) {
      applyDragStyles();
      dragStyleRaf = 0;
      if (lastRaf) {
        cancelAnimationFrame(lastRaf);
      }
      lastRaf = null;
    } else if (!dragStyleRaf) {
      dragStyleRaf = 1;
      lastRaf = requestAnimationFrame(() => {
        applyDragStyles();
        dragStyleRaf = 0;
        lastRaf = null;
      });
    }
  };
  affected([dragging?.[0], "value"], (val, prop) => {
    if (prop == "value") {
      syncDragStyles();
    }
  });
  affected([dragging?.[1], "value"], (val, prop) => {
    if (prop == "value") {
      syncDragStyles();
    }
  });
  syncDragStyles(true);
  affected([currentCell?.[0], "value"], (val, prop) => {
    if (prop == "value" && item.cell != null && val != null) {
      setStyleProperty(newItem, "--cell-x", (item.cell[0] = val) || 0);
    }
  });
  affected([currentCell?.[1], "value"], (val, prop) => {
    if (prop == "value" && item.cell != null && val != null) {
      setStyleProperty(newItem, "--cell-y", (item.cell[1] = val) || 0);
    }
  });
  makeDragEvents(newItem, { layout, currentCell, dragging, syncDragStyles }, { item, items, list });
  return currentCell;
};

class UIGridBox extends DOMMixin {
  constructor(name) {
    super(name);
  }
  // @ts-ignore
  connect(ws) {
    const self = ws?.deref?.();
    E(self, { classList: /* @__PURE__ */ new Set(["ui-gridlayout"]) });
    const size = [self.clientWidth, self.clientHeight];
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry?.contentBoxSize) {
          const contentBoxSize = entry?.contentBoxSize?.[0];
          size[0] = contentBoxSize?.inlineSize || size[0] || 0;
          size[1] = contentBoxSize?.blockSize || size[1] || 0;
        }
      }
    });
    Object.defineProperty(self, "size", { get: () => size });
    resizeObserver.observe(self, { box: "content-box" });
    elementPointerMap.set(self, {
      pointerMap: /* @__PURE__ */ new Map(),
      pointerCache: /* @__PURE__ */ new Map()
    });
  }
}
new UIGridBox("ui-gridbox");

class UIOrientBox extends DOMMixin {
  constructor(name) {
    super(name);
  }
  // @ts-ignore
  connect(ws) {
    const self = ws?.deref?.() ?? ws;
    self.classList.add("ui-orientbox");
    const zoom = numberRef(1), orient = numberRef(orientationNumberMap?.[getCorrectOrientation()] || 0);
    self.style.setProperty("--zoom", zoom.value);
    self.style.setProperty("--orient", orient.value);
    Object.defineProperty(self, "size", { get: () => size });
    Object.defineProperty(self, "zoom", {
      get: () => parseFloat(zoom.value) || 1,
      set: (value) => {
        zoom.value = value;
        self.style.setProperty("--zoom", value);
      }
    });
    Object.defineProperty(self, "orient", {
      get: () => parseInt(orient.value) || 0,
      set: (value) => {
        orient.value = value;
        self.style.setProperty("--orient", value);
      }
    });
    const size = vector2Ref(self.clientWidth, self.clientHeight);
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry?.contentBoxSize) {
          const contentBoxSize = entry?.contentBoxSize?.[0];
          size.x.value = contentBoxSize?.inlineSize || size.x.value || 0;
          size.y.value = contentBoxSize?.blockSize || size.y.value || 0;
        }
      }
    });
    resizeObserver.observe(self, { box: "content-box" });
    elementPointerMap.set(self, {
      pointerMap: /* @__PURE__ */ new Map(),
      pointerCache: /* @__PURE__ */ new Map()
    });
    return this;
  }
}
new UIOrientBox("ui-orientbox");

const electronAPI = "electronBridge";
function extractAlpha(input) {
  if (typeof input !== "string") return null;
  let color = input.trim().toLowerCase();
  if (color === "transparent") return 0;
  if (color.startsWith("#")) {
    const hex = color;
    if (hex.length === 4) return 1;
    if (hex.length === 7) return 1;
    if (hex.length === 5) {
      const a = hex[4];
      const aa = a + a;
      return clamp(parseInt(aa, 16) / 255, 0, 1);
    }
    if (hex.length === 9) {
      const aa = hex.slice(7, 9);
      return clamp(parseInt(aa, 16) / 255, 0, 1);
    }
    return null;
  }
  const fnMatch = color.match(/^([a-z-]+)\((.*)\)$/i);
  if (!fnMatch) {
    return null;
  }
  const name = fnMatch[1];
  const body = fnMatch[2].trim();
  {
    const slashIdx = body.lastIndexOf("/");
    if (slashIdx !== -1) {
      const aStr = body.slice(slashIdx + 1).trim();
      const a = parseAlphaComponent(aStr);
      if (a != null) return clamp(a, 0, 1);
      return null;
    }
  }
  if (body.includes(",")) {
    const parts = body.split(",").map((s) => s.trim());
    if (parts.length >= 4) {
      const a = parseAlphaComponent(parts[3]);
      if (a != null) return clamp(a, 0, 1);
      return null;
    }
    return 1;
  }
  return 1;
}
function parseAlphaComponent(str) {
  if (!str) return null;
  if (str.endsWith("%")) {
    const n2 = parseFloat(str);
    if (Number.isNaN(n2)) return null;
    return n2 / 100;
  }
  const n = parseFloat(str);
  if (Number.isNaN(n)) return null;
  return n;
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
const tacp = (color) => {
  if (!color || color == null) return 0;
  return (extractAlpha?.(color) || 0) > 0.1;
};
const setIdleInterval = (cb, timeout = 1e3, ...args) => {
  requestIdleCallback(async () => {
    if (!cb || typeof cb != "function") return;
    while (true) {
      await Promise.try(cb, ...args);
      await new Promise((r) => setTimeout(r, timeout));
      await new Promise((r) => requestIdleCallback(r, { timeout: 100 }));
      await new Promise((r) => requestAnimationFrame(r));
    }
  }, { timeout: 1e3 });
};
const pickBgColor = (x, y, holder = null) => {
  const opaque = Array.from(document.elementsFromPoint(x, y))?.filter?.((el) => el instanceof HTMLElement && el != holder && (el?.dataset?.alpha != null ? parseFloat(el?.dataset?.alpha) > 0.01 : true) && // @ts-ignore
  el?.checkVisibility?.({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true }) && el?.matches?.(":not([data-hidden])") && el?.style?.getPropertyValue("display") != "none").map((element) => {
    const computed = getComputedStyle?.(element);
    return {
      element,
      zIndex: parseInt(computed?.zIndex || "0", 10) || 0,
      color: computed?.backgroundColor || "transparent"
    };
  }).sort((a, b) => Math.sign(b.zIndex - a.zIndex)).filter(({ color }) => tacp(color));
  if (opaque?.[0]?.element instanceof HTMLElement) {
    return opaque?.[0]?.color || "transparent";
  }
  return "transparent";
};
const pickFromCenter = (holder) => {
  const box = holder?.getBoundingClientRect();
  if (box) {
    const Z = 0.5 * (fixedClientZoom?.() || 1);
    const xy = [(box.left + box.right) * Z, (box.top + box.bottom) * Z];
    return pickBgColor(...xy, holder);
  }
};
const dynamicNativeFrame = (root = document.documentElement) => {
  let media = root?.querySelector?.("meta[data-theme-color]") ?? root?.querySelector?.('meta[name="theme-color"]');
  if (!media && root == document.documentElement) {
    media = document.createElement("meta");
    media.setAttribute("name", "theme-color");
    media.setAttribute("data-theme-color", "");
    media.setAttribute("content", "transparent");
    document.head.appendChild(media);
  }
  const color = pickBgColor(globalThis.innerWidth - 64, 10);
  if ((media || window?.[electronAPI]) && root == document.documentElement) {
    media?.setAttribute?.("content", color);
  }
};
const dynamicBgColors = (root = document.documentElement) => {
  root.querySelectorAll("body, body > *, body > * > *").forEach((target) => {
    if (target) {
      pickFromCenter(target);
    }
  });
};
const dynamicTheme = (ROOT = document.documentElement) => {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ({}) => dynamicBgColors(ROOT));
  const updater = () => {
    dynamicNativeFrame(ROOT);
    dynamicBgColors(ROOT);
  };
  addEvent(ROOT, "u2-appear", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(ROOT, "u2-hidden", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(ROOT, "u2-theme-change", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(window, "load", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(document, "visibilitychange", () => requestIdleCallback(updater, { timeout: 100 }));
  setIdleInterval(updater, 500);
};
const currentColorFromPointRef = (x, y, ROOT = document.documentElement, timeout = 500) => {
  const color = pickBgColor(x, y, ROOT);
  const rfc = stringRef(color);
  const updater = () => {
    const color2 = pickBgColor(x, y, ROOT);
    rfc.value = color2;
  };
  addEvent(ROOT, "u2-appear", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(ROOT, "u2-hidden", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(ROOT, "u2-theme-change", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(window, "load", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(document, "visibilitychange", () => requestIdleCallback(updater, { timeout: 100 }));
  setIdleInterval(updater, timeout);
  return rfc;
};
const currentColorFromCenterRef = (element, ROOT = document.documentElement, timeout = 500) => {
  const color = pickFromCenter(element);
  const rfc = stringRef(color);
  const updater = () => {
    const color2 = pickFromCenter(element);
    rfc.value = color2;
  };
  addEvent(ROOT, "u2-appear", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(ROOT, "u2-hidden", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(ROOT, "u2-theme-change", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(window, "load", () => requestIdleCallback(updater, { timeout: 100 }));
  addEvent(document, "visibilitychange", () => requestIdleCallback(updater, { timeout: 100 }));
  setIdleInterval(updater, timeout);
  return rfc;
};

const updateThemeBase = async (originColor = null) => {
  const primaryRef = localStorageRef("--primary", originColor);
  if (originColor != null && primaryRef.value != originColor) primaryRef.value = originColor;
  E(document.documentElement, { style: { "--primary": primaryRef } });
  return [primaryRef];
};

const colorScheme = async () => {
  dynamicNativeFrame();
  dynamicBgColors();
};
if (typeof document != "undefined") {
  requestAnimationFrame(() => colorScheme?.());
  dynamicTheme?.();
}

const pointerAnchorRef = (root = typeof document != "undefined" ? document?.documentElement : null) => {
  if (!root) return () => {
  };
  const coordinate = [numberRef(0), numberRef(0)];
  coordinate.push(WRef(handleByPointer((ev) => {
    coordinate[0].value = ev.clientX;
    coordinate[1].value = ev.clientY;
  }, root)));
  if (coordinate[2]?.deref?.() ?? coordinate[2]) {
    addToCallChain(coordinate, Symbol.dispose, coordinate[2]?.deref?.() ?? coordinate[2]);
  }
  return coordinate;
};
const visibleBySelectorRef = (selector) => {
  const visRef = booleanRef(false), usub = handleByPointer((ev) => {
    const target = typeof document != "undefined" ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
    visRef.value = target?.matches?.(selector) ?? false;
  });
  if (usub) addToCallChain(visRef, Symbol.dispose, usub);
  return visRef;
};
const showAttributeRef = (attribute = "data-tooltip") => {
  const valRef = stringRef(""), usub = handleByPointer((ev) => {
    const target = typeof document != "undefined" ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
    valRef.value = target?.getAttribute?.(attribute)?.(`[${attribute}]`) ?? "";
  });
  if (usub) addToCallChain(valRef, Symbol.dispose, usub);
  return valRef;
};

class Vector2D {
  _x;
  _y;
  constructor(x = 0, y = 0) {
    this._x = typeof x === "number" ? numberRef(x) : x;
    this._y = typeof y === "number" ? numberRef(y) : y;
  }
  get x() {
    return this._x;
  }
  set x(value) {
    if (typeof value === "number") {
      this._x.value = value;
    } else {
      this._x = value;
    }
  }
  get y() {
    return this._y;
  }
  set y(value) {
    if (typeof value === "number") {
      this._y.value = value;
    } else {
      this._y = value;
    }
  }
  // Array-like access for compatibility
  get 0() {
    return this._x;
  }
  get 1() {
    return this._y;
  }
  // Convert to plain array for operations
  toArray() {
    return [this._x, this._y];
  }
  // Clone the vector
  clone() {
    return new Vector2D(this._x.value, this._y.value);
  }
  // Set values
  set(x, y) {
    this._x.value = x;
    this._y.value = y;
    return this;
  }
  // Copy from another vector
  copy(v) {
    this._x.value = v.x.value;
    this._y.value = v.y.value;
    return this;
  }
  // Vector operations
  add(v) {
    return new Vector2D(this._x.value + v.x.value, this._y.value + v.y.value);
  }
  subtract(v) {
    return new Vector2D(this._x.value - v.x.value, this._y.value - v.y.value);
  }
  multiply(scalar) {
    return new Vector2D(this._x.value * scalar, this._y.value * scalar);
  }
  divide(scalar) {
    if (scalar === 0) throw new Error("Division by zero");
    return new Vector2D(this._x.value / scalar, this._y.value / scalar);
  }
  // Dot product
  dot(v) {
    return this._x.value * v.x.value + this._y.value * v.y.value;
  }
  // Cross product (returns scalar in 2D)
  cross(v) {
    return this._x.value * v.y.value - this._y.value * v.x.value;
  }
  // Magnitude (length)
  magnitude() {
    return Math.sqrt(this._x.value * this._x.value + this._y.value * this._y.value);
  }
  // Squared magnitude (faster than magnitude for comparisons)
  magnitudeSquared() {
    return this._x.value * this._x.value + this._y.value * this._y.value;
  }
  // Distance to another vector
  distanceTo(v) {
    const dx = this._x.value - v.x.value;
    const dy = this._y.value - v.y.value;
    return Math.sqrt(dx * dx + dy * dy);
  }
  // Squared distance (faster for comparisons)
  distanceToSquared(v) {
    const dx = this._x.value - v.x.value;
    const dy = this._y.value - v.y.value;
    return dx * dx + dy * dy;
  }
  // Normalize (make unit length)
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return new Vector2D(this._x.value / mag, this._y.value / mag);
  }
  // Check if vectors are equal
  equals(v, tolerance = 1e-6) {
    return Math.abs(this._x.value - v.x.value) < tolerance && Math.abs(this._y.value - v.y.value) < tolerance;
  }
  // Linear interpolation
  lerp(v, t) {
    const clampedT = Math.max(0, Math.min(1, t));
    return new Vector2D(
      this._x.value + (v.x.value - this._x.value) * clampedT,
      this._y.value + (v.y.value - this._y.value) * clampedT
    );
  }
  // Angle with another vector (in radians)
  angleTo(v) {
    const dot = this.dot(v);
    const det = this.cross(v);
    return Math.atan2(det, dot);
  }
  // Rotate vector by angle (in radians)
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this._x.value * cos - this._y.value * sin,
      this._x.value * sin + this._y.value * cos
    );
  }
  // Project onto another vector
  projectOnto(v) {
    const scalar = this.dot(v) / v.magnitudeSquared();
    return v.multiply(scalar);
  }
  // Reflect across a normal vector
  reflect(normal) {
    const normalizedNormal = normal.normalize();
    const dotProduct = this.dot(normalizedNormal);
    return this.subtract(normalizedNormal.multiply(2 * dotProduct));
  }
  // Clamp vector components
  clamp(min, max) {
    return new Vector2D(
      Math.max(min.x.value, Math.min(max.x.value, this._x.value)),
      Math.max(min.y.value, Math.min(max.y.value, this._y.value))
    );
  }
  // Get the minimum component
  min() {
    return Math.min(this._x.value, this._y.value);
  }
  // Get the maximum component
  max() {
    return Math.max(this._x.value, this._y.value);
  }
  // Static utility methods
  static zero() {
    return new Vector2D(0, 0);
  }
  static one() {
    return new Vector2D(1, 1);
  }
  static unitX() {
    return new Vector2D(1, 0);
  }
  static unitY() {
    return new Vector2D(0, 1);
  }
  // Create vector from angle (in radians)
  static fromAngle(angle, length = 1) {
    return new Vector2D(
      Math.cos(angle) * length,
      Math.sin(angle) * length
    );
  }
  // Create vector from polar coordinates
  static fromPolar(angle, radius) {
    return Vector2D.fromAngle(angle, radius);
  }
}
const vector2Ref = (x = 0, y = 0) => {
  return new Vector2D(x, y);
};
class Matrix2D {
  _elements;
  constructor(a = 1, b = 0, c = 0, d = 1) {
    this._elements = [
      typeof a === "number" ? numberRef(a) : a,
      typeof b === "number" ? numberRef(b) : b,
      typeof c === "number" ? numberRef(c) : c,
      typeof d === "number" ? numberRef(d) : d
    ];
  }
  get elements() {
    return this._elements;
  }
  // Matrix elements access
  get m00() {
    return this._elements[0];
  }
  get m01() {
    return this._elements[1];
  }
  get m10() {
    return this._elements[2];
  }
  get m11() {
    return this._elements[3];
  }
  set m00(value) {
    if (typeof value === "number") this._elements[0].value = value;
    else this._elements[0] = value;
  }
  set m01(value) {
    if (typeof value === "number") this._elements[1].value = value;
    else this._elements[1] = value;
  }
  set m10(value) {
    if (typeof value === "number") this._elements[2].value = value;
    else this._elements[2] = value;
  }
  set m11(value) {
    if (typeof value === "number") this._elements[3].value = value;
    else this._elements[3] = value;
  }
  // Array-like access for compatibility
  get 0() {
    return this._elements[0];
  }
  get 1() {
    return this._elements[1];
  }
  get 2() {
    return this._elements[2];
  }
  get 3() {
    return this._elements[3];
  }
  // Convert to plain array for operations
  toArray() {
    return [...this._elements];
  }
  // Clone the matrix
  clone() {
    return new Matrix2D(
      this._elements[0].value,
      this._elements[1].value,
      this._elements[2].value,
      this._elements[3].value
    );
  }
  // Set values
  set(a, b, c, d) {
    this._elements[0].value = a;
    this._elements[1].value = b;
    this._elements[2].value = c;
    this._elements[3].value = d;
    return this;
  }
  // Identity matrix
  identity() {
    return this.set(1, 0, 0, 1);
  }
  // Copy from another matrix
  copy(m) {
    this._elements[0].value = m.elements[0].value;
    this._elements[1].value = m.elements[1].value;
    this._elements[2].value = m.elements[2].value;
    this._elements[3].value = m.elements[3].value;
    return this;
  }
  // Matrix operations
  multiply(m) {
    const a = this._elements[0].value, b = this._elements[1].value;
    const c = this._elements[2].value, d = this._elements[3].value;
    const e = m.elements[0].value, f = m.elements[1].value;
    const g = m.elements[2].value, h = m.elements[3].value;
    return new Matrix2D(
      a * e + b * g,
      a * f + b * h,
      c * e + d * g,
      c * f + d * h
    );
  }
  multiplyScalar(s) {
    return new Matrix2D(
      this._elements[0].value * s,
      this._elements[1].value * s,
      this._elements[2].value * s,
      this._elements[3].value * s
    );
  }
  // Transform a vector
  transformVector(v) {
    const x = this._elements[0].value * v.x.value + this._elements[1].value * v.y.value;
    const y = this._elements[2].value * v.x.value + this._elements[3].value * v.y.value;
    return new Vector2D(x, y);
  }
  // Determinant
  determinant() {
    return this._elements[0].value * this._elements[3].value - this._elements[1].value * this._elements[2].value;
  }
  // Inverse matrix
  inverse() {
    const det = this.determinant();
    if (det === 0) return null;
    const invDet = 1 / det;
    return new Matrix2D(
      this._elements[3].value * invDet,
      -this._elements[1].value * invDet,
      -this._elements[2].value * invDet,
      this._elements[0].value * invDet
    );
  }
  // Transpose
  transpose() {
    return new Matrix2D(
      this._elements[0].value,
      this._elements[2].value,
      this._elements[1].value,
      this._elements[3].value
    );
  }
  // Check if matrices are equal
  equals(m, tolerance = 1e-6) {
    for (let i = 0; i < 4; i++) {
      if (Math.abs(this._elements[i].value - m.elements[i].value) > tolerance) {
        return false;
      }
    }
    return true;
  }
  // Create rotation matrix
  static rotation(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix2D(cos, -sin, sin, cos);
  }
  // Create scale matrix
  static scale(sx, sy = sx) {
    return new Matrix2D(sx, 0, 0, sy);
  }
  // Create shear matrix
  static shear(sx, sy) {
    return new Matrix2D(1, sx, sy, 1);
  }
}
const matrix2x2Ref = (a = 1, b = 0, c = 0, d = 1) => {
  return new Matrix2D(a, b, c, d);
};

class Vector3D {
  _x;
  _y;
  _z;
  constructor(x = 0, y = 0, z = 0) {
    this._x = typeof x === "number" ? numberRef(x) : x;
    this._y = typeof y === "number" ? numberRef(y) : y;
    this._z = typeof z === "number" ? numberRef(z) : z;
  }
  get x() {
    return this._x;
  }
  set x(value) {
    if (typeof value === "number") {
      this._x.value = value;
    } else {
      this._x = value;
    }
  }
  get y() {
    return this._y;
  }
  set y(value) {
    if (typeof value === "number") {
      this._y.value = value;
    } else {
      this._y = value;
    }
  }
  get z() {
    return this._z;
  }
  set z(value) {
    if (typeof value === "number") {
      this._z.value = value;
    } else {
      this._z = value;
    }
  }
  // Array-like access for compatibility
  get 0() {
    return this._x;
  }
  get 1() {
    return this._y;
  }
  get 2() {
    return this._z;
  }
  // Convert to plain array for operations
  toArray() {
    return [this._x, this._y, this._z];
  }
  // Clone the vector
  clone() {
    return new Vector3D(this._x.value, this._y.value, this._z.value);
  }
  // Set values
  set(x, y, z) {
    this._x.value = x;
    this._y.value = y;
    this._z.value = z;
    return this;
  }
  // Copy from another vector
  copy(v) {
    this._x.value = v.x.value;
    this._y.value = v.y.value;
    this._z.value = v.z.value;
    return this;
  }
}
const vector3Ref = (x = 0, y = 0, z = 0) => {
  return new Vector3D(x, y, z);
};
class Matrix3D {
  _elements;
  constructor(a = 1, b = 0, c = 0, d = 0, e = 1, f = 0, g = 0, h = 0, i = 1) {
    this._elements = [
      typeof a === "number" ? numberRef(a) : a,
      typeof b === "number" ? numberRef(b) : b,
      typeof c === "number" ? numberRef(c) : c,
      typeof d === "number" ? numberRef(d) : d,
      typeof e === "number" ? numberRef(e) : e,
      typeof f === "number" ? numberRef(f) : f,
      typeof g === "number" ? numberRef(g) : g,
      typeof h === "number" ? numberRef(h) : h,
      typeof i === "number" ? numberRef(i) : i
    ];
  }
  get elements() {
    return this._elements;
  }
  // Matrix elements access
  get m00() {
    return this._elements[0];
  }
  get m01() {
    return this._elements[1];
  }
  get m02() {
    return this._elements[2];
  }
  get m10() {
    return this._elements[3];
  }
  get m11() {
    return this._elements[4];
  }
  get m12() {
    return this._elements[5];
  }
  get m20() {
    return this._elements[6];
  }
  get m21() {
    return this._elements[7];
  }
  get m22() {
    return this._elements[8];
  }
  set m00(value) {
    if (typeof value === "number") this._elements[0].value = value;
    else this._elements[0] = value;
  }
  set m01(value) {
    if (typeof value === "number") this._elements[1].value = value;
    else this._elements[1] = value;
  }
  set m02(value) {
    if (typeof value === "number") this._elements[2].value = value;
    else this._elements[2] = value;
  }
  set m10(value) {
    if (typeof value === "number") this._elements[3].value = value;
    else this._elements[3] = value;
  }
  set m11(value) {
    if (typeof value === "number") this._elements[4].value = value;
    else this._elements[4] = value;
  }
  set m12(value) {
    if (typeof value === "number") this._elements[5].value = value;
    else this._elements[5] = value;
  }
  set m20(value) {
    if (typeof value === "number") this._elements[6].value = value;
    else this._elements[6] = value;
  }
  set m21(value) {
    if (typeof value === "number") this._elements[7].value = value;
    else this._elements[7] = value;
  }
  set m22(value) {
    if (typeof value === "number") this._elements[8].value = value;
    else this._elements[8] = value;
  }
  // Array-like access for compatibility
  get 0() {
    return this._elements[0];
  }
  get 1() {
    return this._elements[1];
  }
  get 2() {
    return this._elements[2];
  }
  get 3() {
    return this._elements[3];
  }
  get 4() {
    return this._elements[4];
  }
  get 5() {
    return this._elements[5];
  }
  get 6() {
    return this._elements[6];
  }
  get 7() {
    return this._elements[7];
  }
  get 8() {
    return this._elements[8];
  }
  // Convert to plain array for operations
  toArray() {
    return [...this._elements];
  }
  // Clone the matrix
  clone() {
    return new Matrix3D(
      this._elements[0].value,
      this._elements[1].value,
      this._elements[2].value,
      this._elements[3].value,
      this._elements[4].value,
      this._elements[5].value,
      this._elements[6].value,
      this._elements[7].value,
      this._elements[8].value
    );
  }
  // Set values
  set(a, b, c, d, e, f, g, h, i) {
    this._elements[0].value = a;
    this._elements[1].value = b;
    this._elements[2].value = c;
    this._elements[3].value = d;
    this._elements[4].value = e;
    this._elements[5].value = f;
    this._elements[6].value = g;
    this._elements[7].value = h;
    this._elements[8].value = i;
    return this;
  }
  // Identity matrix
  identity() {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }
  // Copy from another matrix
  copy(m) {
    for (let i = 0; i < 9; i++) {
      this._elements[i].value = m.elements[i].value;
    }
    return this;
  }
}
const matrix3x3Ref = (a = 1, b = 0, c = 0, d = 0, e = 1, f = 0, g = 0, h = 0, i = 1) => {
  return new Matrix3D(a, b, c, d, e, f, g, h, i);
};

class Vector4D {
  _x;
  _y;
  _z;
  _w;
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this._x = typeof x === "number" ? numberRef(x) : x;
    this._y = typeof y === "number" ? numberRef(y) : y;
    this._z = typeof z === "number" ? numberRef(z) : z;
    this._w = typeof w === "number" ? numberRef(w) : w;
  }
  get x() {
    return this._x;
  }
  set x(value) {
    if (typeof value === "number") {
      this._x.value = value;
    } else {
      this._x = value;
    }
  }
  get y() {
    return this._y;
  }
  set y(value) {
    if (typeof value === "number") {
      this._y.value = value;
    } else {
      this._y = value;
    }
  }
  get z() {
    return this._z;
  }
  set z(value) {
    if (typeof value === "number") {
      this._z.value = value;
    } else {
      this._z = value;
    }
  }
  get w() {
    return this._w;
  }
  set w(value) {
    if (typeof value === "number") {
      this._w.value = value;
    } else {
      this._w = value;
    }
  }
  // Array-like access for compatibility
  get 0() {
    return this._x;
  }
  get 1() {
    return this._y;
  }
  get 2() {
    return this._z;
  }
  get 3() {
    return this._w;
  }
  // Convert to plain array for operations
  toArray() {
    return [this._x, this._y, this._z, this._w];
  }
  // Clone the vector
  clone() {
    return new Vector4D(this._x.value, this._y.value, this._z.value, this._w.value);
  }
  // Set values
  set(x, y, z, w = 1) {
    this._x.value = x;
    this._y.value = y;
    this._z.value = z;
    this._w.value = w;
    return this;
  }
  // Copy from another vector
  copy(v) {
    this._x.value = v.x.value;
    this._y.value = v.y.value;
    this._z.value = v.z.value;
    this._w.value = v.w.value;
    return this;
  }
}
const vector4Ref = (x = 0, y = 0, z = 0, w = 1) => {
  return new Vector4D(x, y, z, w);
};
class Matrix4D {
  _elements;
  constructor(a = 1, b = 0, c = 0, d = 0, e = 0, f = 1, g = 0, h = 0, i = 0, j = 0, k = 1, l = 0, m = 0, n = 0, o = 0, p = 1) {
    this._elements = [
      typeof a === "number" ? numberRef(a) : a,
      typeof b === "number" ? numberRef(b) : b,
      typeof c === "number" ? numberRef(c) : c,
      typeof d === "number" ? numberRef(d) : d,
      typeof e === "number" ? numberRef(e) : e,
      typeof f === "number" ? numberRef(f) : f,
      typeof g === "number" ? numberRef(g) : g,
      typeof h === "number" ? numberRef(h) : h,
      typeof i === "number" ? numberRef(i) : i,
      typeof j === "number" ? numberRef(j) : j,
      typeof k === "number" ? numberRef(k) : k,
      typeof l === "number" ? numberRef(l) : l,
      typeof m === "number" ? numberRef(m) : m,
      typeof n === "number" ? numberRef(n) : n,
      typeof o === "number" ? numberRef(o) : o,
      typeof p === "number" ? numberRef(p) : p
    ];
  }
  get elements() {
    return this._elements;
  }
  // Matrix elements access
  get m00() {
    return this._elements[0];
  }
  get m01() {
    return this._elements[1];
  }
  get m02() {
    return this._elements[2];
  }
  get m03() {
    return this._elements[3];
  }
  get m10() {
    return this._elements[4];
  }
  get m11() {
    return this._elements[5];
  }
  get m12() {
    return this._elements[6];
  }
  get m13() {
    return this._elements[7];
  }
  get m20() {
    return this._elements[8];
  }
  get m21() {
    return this._elements[9];
  }
  get m22() {
    return this._elements[10];
  }
  get m23() {
    return this._elements[11];
  }
  get m30() {
    return this._elements[12];
  }
  get m31() {
    return this._elements[13];
  }
  get m32() {
    return this._elements[14];
  }
  get m33() {
    return this._elements[15];
  }
  set m00(value) {
    if (typeof value === "number") this._elements[0].value = value;
    else this._elements[0] = value;
  }
  set m01(value) {
    if (typeof value === "number") this._elements[1].value = value;
    else this._elements[1] = value;
  }
  set m02(value) {
    if (typeof value === "number") this._elements[2].value = value;
    else this._elements[2] = value;
  }
  set m03(value) {
    if (typeof value === "number") this._elements[3].value = value;
    else this._elements[3] = value;
  }
  set m10(value) {
    if (typeof value === "number") this._elements[4].value = value;
    else this._elements[4] = value;
  }
  set m11(value) {
    if (typeof value === "number") this._elements[5].value = value;
    else this._elements[5] = value;
  }
  set m12(value) {
    if (typeof value === "number") this._elements[6].value = value;
    else this._elements[6] = value;
  }
  set m13(value) {
    if (typeof value === "number") this._elements[7].value = value;
    else this._elements[7] = value;
  }
  set m20(value) {
    if (typeof value === "number") this._elements[8].value = value;
    else this._elements[8] = value;
  }
  set m21(value) {
    if (typeof value === "number") this._elements[9].value = value;
    else this._elements[9] = value;
  }
  set m22(value) {
    if (typeof value === "number") this._elements[10].value = value;
    else this._elements[10] = value;
  }
  set m23(value) {
    if (typeof value === "number") this._elements[11].value = value;
    else this._elements[11] = value;
  }
  set m30(value) {
    if (typeof value === "number") this._elements[12].value = value;
    else this._elements[12] = value;
  }
  set m31(value) {
    if (typeof value === "number") this._elements[13].value = value;
    else this._elements[13] = value;
  }
  set m32(value) {
    if (typeof value === "number") this._elements[14].value = value;
    else this._elements[14] = value;
  }
  set m33(value) {
    if (typeof value === "number") this._elements[15].value = value;
    else this._elements[15] = value;
  }
  // Array-like access for compatibility
  get 0() {
    return this._elements[0];
  }
  get 1() {
    return this._elements[1];
  }
  get 2() {
    return this._elements[2];
  }
  get 3() {
    return this._elements[3];
  }
  get 4() {
    return this._elements[4];
  }
  get 5() {
    return this._elements[5];
  }
  get 6() {
    return this._elements[6];
  }
  get 7() {
    return this._elements[7];
  }
  get 8() {
    return this._elements[8];
  }
  get 9() {
    return this._elements[9];
  }
  get 10() {
    return this._elements[10];
  }
  get 11() {
    return this._elements[11];
  }
  get 12() {
    return this._elements[12];
  }
  get 13() {
    return this._elements[13];
  }
  get 14() {
    return this._elements[14];
  }
  get 15() {
    return this._elements[15];
  }
  // Convert to plain array for operations
  toArray() {
    return [...this._elements];
  }
  // Clone the matrix
  clone() {
    return new Matrix4D(
      this._elements[0].value,
      this._elements[1].value,
      this._elements[2].value,
      this._elements[3].value,
      this._elements[4].value,
      this._elements[5].value,
      this._elements[6].value,
      this._elements[7].value,
      this._elements[8].value,
      this._elements[9].value,
      this._elements[10].value,
      this._elements[11].value,
      this._elements[12].value,
      this._elements[13].value,
      this._elements[14].value,
      this._elements[15].value
    );
  }
  // Set values
  set(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    this._elements[0].value = a;
    this._elements[1].value = b;
    this._elements[2].value = c;
    this._elements[3].value = d;
    this._elements[4].value = e;
    this._elements[5].value = f;
    this._elements[6].value = g;
    this._elements[7].value = h;
    this._elements[8].value = i;
    this._elements[9].value = j;
    this._elements[10].value = k;
    this._elements[11].value = l;
    this._elements[12].value = m;
    this._elements[13].value = n;
    this._elements[14].value = o;
    this._elements[15].value = p;
    return this;
  }
  // Identity matrix
  identity() {
    return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
  // Copy from another matrix
  copy(m) {
    for (let i = 0; i < 16; i++) {
      this._elements[i].value = m.elements[i].value;
    }
    return this;
  }
}
const matrix4x4Ref = (a = 1, b = 0, c = 0, d = 0, e = 0, f = 1, g = 0, h = 0, i = 0, j = 0, k = 1, l = 0, m = 0, n = 0, o = 0, p = 1) => {
  return new Matrix4D(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
};

const vectorFromArray = (arr) => {
  switch (arr.length) {
    case 2:
      return new Vector2D(arr[0], arr[1]);
    case 3:
      return new Vector3D(arr[0], arr[1], arr[2]);
    case 4:
      return new Vector4D(arr[0], arr[1], arr[2], arr[3]);
    default:
      throw new Error(`Unsupported vector dimension: ${arr.length}`);
  }
};
const vectorToArray = (vec) => {
  if (vec instanceof Vector2D) return [vec.x, vec.y];
  if (vec instanceof Vector3D) return [vec.x, vec.y, vec.z];
  if (vec instanceof Vector4D) return [vec.x, vec.y, vec.z, vec.w];
  throw new Error("Unsupported vector type");
};
const translate2D = (vec, tx, ty) => {
  return addVector2D(vec, new Vector2D(tx, ty));
};
const scale2D = (vec, sx, sy = sx) => {
  return new Vector2D(
    operated([vec.x, sx], () => vec.x.value * sx.value),
    operated([vec.y, sy], () => vec.y.value * sy.value)
  );
};
const rotate2D = (vec, angle) => {
  const cos = operated([angle], () => Math.cos(angle.value));
  const sin = operated([angle], () => Math.sin(angle.value));
  return new Vector2D(
    operated([vec.x, vec.y, cos, sin], () => vec.x.value * cos.value - vec.y.value * sin.value),
    operated([vec.x, vec.y, cos, sin], () => vec.x.value * sin.value + vec.y.value * cos.value)
  );
};
const createRect2D = (x = 0, y = 0, width = 0, height = 0) => ({
  position: vector2Ref(x, y),
  size: vector2Ref(width, height)
});
const rectCenter = (rect) => {
  return addVector2D(rect.position, multiplyVector2D(rect.size, numberRef(0.5)));
};
const rectContainsPoint = (rect, point) => {
  return operated([rect.position.x, rect.position.y, rect.size.x, rect.size.y, point.x, point.y], () => {
    const inX = point.x.value >= rect.position.x.value && point.x.value <= rect.position.x.value + rect.size.x.value;
    const inY = point.y.value >= rect.position.y.value && point.y.value <= rect.position.y.value + rect.size.y.value;
    return inX && inY;
  });
};
const rectIntersects = (rectA, rectB) => {
  return operated([
    rectA.position.x,
    rectA.position.y,
    rectA.size.x,
    rectA.size.y,
    rectB.position.x,
    rectB.position.y,
    rectB.size.x,
    rectB.size.y
  ], () => {
    const aRight = rectA.position.x.value + rectA.size.x.value;
    const aBottom = rectA.position.y.value + rectA.size.y.value;
    const bRight = rectB.position.x.value + rectB.size.x.value;
    const bBottom = rectB.position.y.value + rectB.size.y.value;
    return !(rectA.position.x.value > bRight || aRight < rectB.position.x.value || rectA.position.y.value > bBottom || aBottom < rectB.position.y.value);
  });
};
const rectUnion = (rectA, rectB) => {
  const minX = operated([rectA.position.x, rectB.position.x], () => Math.min(rectA.position.x.value, rectB.position.x.value));
  const minY = operated([rectA.position.y, rectB.position.y], () => Math.min(rectA.position.y.value, rectB.position.y.value));
  const maxX = operated([rectA.position.x, rectA.size.x, rectB.position.x, rectB.size.x], () => Math.max(rectA.position.x.value + rectA.size.x.value, rectB.position.x.value + rectB.size.x.value));
  const maxY = operated([rectA.position.y, rectA.size.y, rectB.position.y, rectB.size.y], () => Math.max(rectA.position.y.value + rectA.size.y.value, rectB.position.y.value + rectB.size.y.value));
  return {
    position: new Vector2D(minX, minY),
    size: new Vector2D(
      operated([maxX, minX], () => maxX.value - minX.value),
      operated([maxY, minY], () => maxY.value - minY.value)
    )
  };
};
const clampPointToRect = (point, rect) => {
  return new Vector2D(
    operated([point.x, rect.position.x, rect.size.x], () => Math.max(rect.position.x.value, Math.min(point.x.value, rect.position.x.value + rect.size.x.value))),
    operated([point.y, rect.position.y, rect.size.y], () => Math.max(rect.position.y.value, Math.min(point.y.value, rect.position.y.value + rect.size.y.value)))
  );
};
const pointToRectDistance = (point, rect) => {
  const clamped = clampPointToRect(point, rect);
  return magnitude2D(subtractVector2D(point, clamped));
};
const rectArea = (rect) => {
  return operated([rect.size.x, rect.size.y], () => rect.size.x.value * rect.size.y.value);
};
const scaleRectAroundCenter = (rect, scale) => {
  const center = rectCenter(rect);
  const newSize = multiplyVector2D(rect.size, scale);
  const newPosition = subtractVector2D(center, multiplyVector2D(newSize, numberRef(0.5)));
  return {
    position: newPosition,
    size: newSize
  };
};
const transformRect2D = (rect, transform) => {
  const corners = [
    rect.position,
    // top-left
    addVector2D(rect.position, new Vector2D(rect.size.x, numberRef(0))),
    // top-right
    addVector2D(rect.position, rect.size),
    // bottom-right
    addVector2D(rect.position, new Vector2D(numberRef(0), rect.size.y))
    // bottom-left
  ];
  const transformedCorners = corners.map(transform);
  return rectUnion(
    { position: transformedCorners[0], size: vector2Ref(0, 0) },
    { position: transformedCorners[1], size: vector2Ref(0, 0) }
  );
};
const relativePosition = (child, parent) => {
  return new Vector2D(
    operated([child.x, parent.position.x], () => child.x.value - parent.position.x.value),
    operated([child.y, parent.position.y], () => child.y.value - parent.position.y.value)
  );
};
const absolutePosition = (relative, parent) => {
  return addVector2D(relative, parent.position);
};
const constrainRectAspectRatio = (rect, aspectRatio, mode = "fit") => {
  return operated([rect.size.x, rect.size.y, aspectRatio], () => {
    const currentRatio = rect.size.x.value / rect.size.y.value;
    const targetRatio = aspectRatio.value;
    let newWidth = rect.size.x.value;
    let newHeight = rect.size.y.value;
    if (mode === "fit") {
      if (currentRatio > targetRatio) {
        newHeight = newWidth / targetRatio;
      } else {
        newWidth = newHeight * targetRatio;
      }
    } else {
      if (currentRatio > targetRatio) {
        newWidth = newHeight * targetRatio;
      } else {
        newHeight = newWidth / targetRatio;
      }
    }
    return {
      position: rect.position,
      size: vector2Ref(newWidth, newHeight)
    };
  });
};
const smoothValueTransition = (current, target, smoothing = numberRef(0.1)) => {
  return operated([current, target, smoothing], () => {
    const diff = target.value - current.value;
    return current.value + diff * smoothing.value;
  });
};
const sliderThumbPosition = (value, min, max, trackSize) => {
  return operated([value, min, max, trackSize], () => {
    const normalizedValue = (value.value - min.value) / (max.value - min.value);
    return normalizedValue * trackSize.value;
  });
};
const scrollbarMetrics = (contentSize, containerSize, scrollPosition) => {
  const thumbSize = operated([contentSize, containerSize], () => {
    const ratio = containerSize.value / contentSize.value;
    return Math.max(20, ratio * containerSize.value);
  });
  const thumbPosition = operated([scrollPosition, contentSize, containerSize, thumbSize], () => {
    const maxScroll = contentSize.value - containerSize.value;
    const scrollRatio = maxScroll > 0 ? scrollPosition.value / maxScroll : 0;
    return scrollRatio * (containerSize.value - thumbSize.value);
  });
  return { thumbSize, thumbPosition };
};
const screenToControlValue = (screenPos, controlRect, axis = "x") => {
  const controlStart = axis === "x" ? controlRect.position.x : controlRect.position.y;
  const controlSize = axis === "x" ? controlRect.size.x : controlRect.size.y;
  return operated([screenPos, controlStart, controlSize], () => {
    const relativePos = screenPos.value - controlStart.value;
    return Math.max(0, Math.min(1, relativePos / controlSize.value));
  });
};
const easeInOutCubic = (t) => {
  return operated([t], () => {
    const x = t.value;
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  });
};
const easeOutBounce = (t) => {
  return operated([t], () => {
    let x = t.value;
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      x -= 1.5 / d1;
      return n1 * x * x + 0.75;
    } else if (x < 2.5 / d1) {
      x -= 2.25 / d1;
      return n1 * x * x + 0.9375;
    } else {
      x -= 2.625 / d1;
      return n1 * x * x + 0.984375;
    }
  });
};
const momentumScroll = (velocity, deceleration = numberRef(0.95), minVelocity = numberRef(0.01)) => {
  return operated([velocity, deceleration, minVelocity], () => {
    const newVelocity = velocity.value * deceleration.value;
    return Math.abs(newVelocity) < minVelocity.value ? 0 : newVelocity;
  });
};
const scrollBoundsWithBounce = (scrollPosition, contentSize, containerSize, bounceDistance = numberRef(50)) => {
  return operated([scrollPosition, contentSize, containerSize, bounceDistance], () => {
    const maxScroll = contentSize.value - containerSize.value;
    if (scrollPosition.value < 0) {
      const bounce = Math.min(bounceDistance.value, Math.abs(scrollPosition.value));
      return -bounce * 0.3;
    } else if (scrollPosition.value > maxScroll) {
      const overScroll = scrollPosition.value - maxScroll;
      const bounce = Math.min(bounceDistance.value, overScroll);
      return maxScroll + bounce * 0.3;
    }
    return scrollPosition.value;
  });
};
const flattenRefs = (input) => {
  const refs = [];
  const traverse = (item) => {
    if (item && typeof item === "object" && "value" in item) {
      refs.push(item);
    } else if (Array.isArray(item)) {
      item.forEach(traverse);
    } else if (item && typeof item === "object") {
      Object.values(item).forEach(traverse);
    }
  };
  traverse(input);
  return refs;
};
const operated = (args, fn) => {
  const getCurrentValues = () => args.map((arg) => {
    if (arg && typeof arg === "object" && "value" in arg) {
      return arg.value;
    }
    return arg;
  });
  const initialResult = fn(...getCurrentValues());
  if (typeof initialResult === "number") {
    const result = numberRef(initialResult);
    const updateResult2 = () => {
      result.value = fn(...getCurrentValues());
    };
    const allRefs2 = flattenRefs(args);
    allRefs2.forEach((ref) => affected(ref, updateResult2));
    return result;
  }
  let currentResult = initialResult;
  const updateResult = () => {
    currentResult = fn(...getCurrentValues());
  };
  const allRefs = flattenRefs(args);
  allRefs.forEach((ref) => affected(ref, updateResult));
  return currentResult;
};
const addRef = (a, b) => {
  return operated([a, b], () => a.value + b.value);
};
const subtractRef = (a, b) => {
  return operated([a, b], () => a.value - b.value);
};
const multiplyRef = (a, b) => {
  return operated([a, b], () => a.value * b.value);
};
const divideRef = (a, b) => {
  return operated([a, b], () => a.value / b.value);
};
const modulusRef = (a, b) => {
  return operated([a, b], () => a.value % b.value);
};
const powerRef = (a, b) => {
  return operated([a, b], () => Math.pow(a.value, b.value));
};
const sinRef = (a) => {
  return operated(a, () => Math.sin(a.value));
};
const cosRef = (a) => {
  return operated(a, () => Math.cos(a.value));
};
const tanRef = (a) => {
  return operated(a, () => Math.tan(a.value));
};
const asinRef = (a) => {
  return operated(a, () => Math.asin(a.value));
};
const acosRef = (a) => {
  return operated(a, () => Math.acos(a.value));
};
const atanRef = (a) => {
  return operated(a, () => Math.atan(a.value));
};
const atan2Ref = (a, b) => {
  return operated([a, b], () => Math.atan2(a.value, b.value));
};
const hypotRef = (a, b) => {
  return operated([a, b], () => Math.hypot(a.value, b.value));
};
const squareRootRef = (a) => {
  return operated(a, () => Math.sqrt(a.value));
};
const cubeRootRef = (a) => {
  return operated(a, () => Math.cbrt(a.value));
};
const absoluteRef = (a) => {
  return operated(a, () => Math.abs(a.value));
};
const signRef = (a) => {
  return operated(a, () => Math.sign(a.value));
};
const clampRef = (a, min, max) => {
  return operated([a, min, max], () => Math.min(Math.max(a.value, min.value), max.value));
};
const addVector2D = (a, b) => {
  return new Vector2D(
    operated([a.x, b.x], () => a.x.value + b.x.value),
    operated([a.y, b.y], () => a.y.value + b.y.value)
  );
};
const subtractVector2D = (a, b) => {
  return new Vector2D(
    operated([a.x, b.x], () => a.x.value - b.x.value),
    operated([a.y, b.y], () => a.y.value - b.y.value)
  );
};
const multiplyVector2D = (a, scalar) => {
  return new Vector2D(
    operated([a.x, scalar], () => a.x.value * scalar.value),
    operated([a.y, scalar], () => a.y.value * scalar.value)
  );
};
const divideVector2D = (a, scalar) => {
  return new Vector2D(
    operated([a.x, scalar], () => a.x.value / scalar.value),
    operated([a.y, scalar], () => a.y.value / scalar.value)
  );
};
const dotProduct2D = (a, b) => {
  return operated([a.x, a.y, b.x, b.y], () => a.x.value * b.x.value + a.y.value * b.y.value);
};
const magnitude2D = (a) => {
  return operated([a.x, a.y], () => Math.sqrt(a.x.value * a.x.value + a.y.value * a.y.value));
};
const normalize2D = (a) => {
  const mag = magnitude2D(a);
  return new Vector2D(
    operated([a.x, mag], () => a.x.value / mag.value),
    operated([a.y, mag], () => a.y.value / mag.value)
  );
};
const addVector3D = (a, b) => {
  return new Vector3D(
    operated([a.x, b.x], () => a.x.value + b.x.value),
    operated([a.y, b.y], () => a.y.value + b.y.value),
    operated([a.z, b.z], () => a.z.value + b.z.value)
  );
};
const subtractVector3D = (a, b) => {
  return new Vector3D(
    operated([a.x, b.x], () => a.x.value - b.x.value),
    operated([a.y, b.y], () => a.y.value - b.y.value),
    operated([a.z, b.z], () => a.z.value - b.z.value)
  );
};
const multiplyVector3D = (a, scalar) => {
  return new Vector3D(
    operated([a.x, scalar], () => a.x.value * scalar.value),
    operated([a.y, scalar], () => a.y.value * scalar.value),
    operated([a.z, scalar], () => a.z.value * scalar.value)
  );
};
const divideVector3D = (a, scalar) => {
  return new Vector3D(
    operated([a.x, scalar], () => a.x.value / scalar.value),
    operated([a.y, scalar], () => a.y.value / scalar.value),
    operated([a.z, scalar], () => a.z.value / scalar.value)
  );
};
const dotProduct3D = (a, b) => {
  return operated(
    [a.x, a.y, a.z, b.x, b.y, b.z],
    () => a.x.value * b.x.value + a.y.value * b.y.value + a.z.value * b.z.value
  );
};
const crossProduct3D = (a, b) => {
  return new Vector3D(
    operated([a.y, a.z, b.y, b.z], () => a.y.value * b.z.value - a.z.value * b.y.value),
    operated([a.z, a.x, b.z, b.x], () => a.z.value * b.x.value - a.x.value * b.z.value),
    operated([a.x, a.y, b.x, b.y], () => a.x.value * b.y.value - a.y.value * b.x.value)
  );
};
const magnitude3D = (a) => {
  return operated(
    [a.x, a.y, a.z],
    () => Math.sqrt(a.x.value * a.x.value + a.y.value * a.y.value + a.z.value * a.z.value)
  );
};
const normalize3D = (a) => {
  const mag = magnitude3D(a);
  return new Vector3D(
    operated([a.x, mag], () => a.x.value / mag.value),
    operated([a.y, mag], () => a.y.value / mag.value),
    operated([a.z, mag], () => a.z.value / mag.value)
  );
};
const addVector4D = (a, b) => {
  return new Vector4D(
    operated([a.x, b.x], () => a.x.value + b.x.value),
    operated([a.y, b.y], () => a.y.value + b.y.value),
    operated([a.z, b.z], () => a.z.value + b.z.value),
    operated([a.w, b.w], () => a.w.value + b.w.value)
  );
};
const subtractVector4D = (a, b) => {
  return new Vector4D(
    operated([a.x, b.x], () => a.x.value - b.x.value),
    operated([a.y, b.y], () => a.y.value - b.y.value),
    operated([a.z, b.z], () => a.z.value - b.z.value),
    operated([a.w, b.w], () => a.w.value - b.w.value)
  );
};
const multiplyVector4D = (a, scalar) => {
  return new Vector4D(
    operated([a.x, scalar], () => a.x.value * scalar.value),
    operated([a.y, scalar], () => a.y.value * scalar.value),
    operated([a.z, scalar], () => a.z.value * scalar.value),
    operated([a.w, scalar], () => a.w.value * scalar.value)
  );
};
const divideVector4D = (a, scalar) => {
  return new Vector4D(
    operated([a.x, scalar], () => a.x.value / scalar.value),
    operated([a.y, scalar], () => a.y.value / scalar.value),
    operated([a.z, scalar], () => a.z.value / scalar.value),
    operated([a.w, scalar], () => a.w.value / scalar.value)
  );
};
const dotProduct4D = (a, b) => {
  return operated(
    [a.x, a.y, a.z, a.w, b.x, b.y, b.z, b.w],
    () => a.x.value * b.x.value + a.y.value * b.y.value + a.z.value * b.z.value + a.w.value * b.w.value
  );
};
const magnitude4D = (a) => {
  return operated(
    [a.x, a.y, a.z, a.w],
    () => Math.sqrt(a.x.value * a.x.value + a.y.value * a.y.value + a.z.value * a.z.value + a.w.value * a.w.value)
  );
};
const normalize4D = (a) => {
  const mag = magnitude4D(a);
  return new Vector4D(
    operated([a.x, mag], () => a.x.value / mag.value),
    operated([a.y, mag], () => a.y.value / mag.value),
    operated([a.z, mag], () => a.z.value / mag.value),
    operated([a.w, mag], () => a.w.value / mag.value)
  );
};

class GridCoordUtils {
  // Create reactive grid coordinate
  static create(row = 0, col = 0) {
    return {
      row: numberRef(row),
      col: numberRef(col)
    };
  }
  // Convert grid coordinates to pixel position
  static toPixel(coord, config) {
    return operated([
      coord.row,
      coord.col,
      config.cellWidth,
      config.cellHeight,
      config.gap,
      config.padding.x,
      config.padding.y
    ], () => {
      const x = config.padding.x.value + coord.col.value * (config.cellWidth.value + config.gap.value);
      const y = config.padding.y.value + coord.row.value * (config.cellHeight.value + config.gap.value);
      return vector2Ref(x, y);
    });
  }
  // Convert pixel position to grid coordinates
  static fromPixel(pixel, config) {
    const coord = operated([
      pixel.x,
      pixel.y,
      config.cellWidth,
      config.cellHeight,
      config.gap,
      config.padding.x,
      config.padding.y
    ], () => {
      const col = Math.floor(
        (pixel.x.value - config.padding.x.value) / (config.cellWidth.value + config.gap.value)
      );
      const row = Math.floor(
        (pixel.y.value - config.padding.y.value) / (config.cellHeight.value + config.gap.value)
      );
      return GridCoordUtils.create(row, col);
    });
    return {
      row: operated([coord], () => coord.value.row.value),
      col: operated([coord], () => coord.value.col.value)
    };
  }
  // Snap pixel position to nearest grid intersection
  static snapToGrid(pixel, config) {
    const gridCoord = this.fromPixel(pixel, config);
    return this.toPixel(gridCoord, config);
  }
  // Snap pixel position to nearest grid cell center
  static snapToCellCenter(pixel, config) {
    const gridCoord = this.fromPixel(pixel, config);
    const cellTopLeft = this.toPixel(gridCoord, config);
    return operated([
      cellTopLeft.x,
      cellTopLeft.y,
      config.cellWidth,
      config.cellHeight
    ], () => {
      const centerX = cellTopLeft.x.value + config.cellWidth.value / 2;
      const centerY = cellTopLeft.y.value + config.cellHeight.value / 2;
      return vector2Ref(centerX, centerY);
    });
  }
  // Get adjacent coordinates
  static adjacent(coord, direction) {
    const deltas = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 }
    };
    const delta = deltas[direction];
    return {
      row: operated([coord.row], () => coord.row.value + delta.row),
      col: operated([coord.col], () => coord.col.value + delta.col)
    };
  }
  // Check if coordinate is within grid bounds
  static isValid(coord, config) {
    return operated(
      [coord.row, coord.col, config.rows, config.cols],
      () => coord.row.value >= 0 && coord.row.value < config.rows.value && coord.col.value >= 0 && coord.col.value < config.cols.value
    );
  }
  // Manhattan distance between grid coordinates
  static manhattanDistance(a, b) {
    return operated(
      [a.row, a.col, b.row, b.col],
      () => Math.abs(a.row.value - b.row.value) + Math.abs(a.col.value - b.col.value)
    );
  }
  // Euclidean distance between grid coordinates
  static euclideanDistance(a, b) {
    return operated(
      [a.row, a.col, b.row, b.col],
      () => Math.sqrt(
        Math.pow(a.row.value - b.row.value, 2) + Math.pow(a.col.value - b.col.value, 2)
      )
    );
  }
}
class GridCellUtils {
  // Create reactive grid cell
  static create(row = 0, col = 0, rowSpan = 1, colSpan = 1) {
    return {
      row: numberRef(row),
      col: numberRef(col),
      rowSpan: numberRef(rowSpan),
      colSpan: numberRef(colSpan)
    };
  }
  // Convert grid cell to pixel rectangle
  static toRect(cell, config) {
    const topLeft = GridCoordUtils.toPixel(cell, config);
    const width = operated(
      [
        cell.colSpan,
        config.cellWidth,
        config.gap
      ],
      () => cell.colSpan.value * config.cellWidth.value + (cell.colSpan.value - 1) * config.gap.value
    );
    const height = operated(
      [
        cell.rowSpan,
        config.cellHeight,
        config.gap
      ],
      () => cell.rowSpan.value * config.cellHeight.value + (cell.rowSpan.value - 1) * config.gap.value
    );
    return createRect2D(topLeft.x, topLeft.y, width, height);
  }
  // Get cell center point
  static getCenter(cell, config) {
    const rect = this.toRect(cell, config);
    return operated(
      [rect.position.x, rect.position.y, rect.size.x, rect.size.y],
      () => vector2Ref(
        rect.position.x.value + rect.size.x.value / 2,
        rect.position.y.value + rect.size.y.value / 2
      )
    );
  }
  // Check if cells overlap (considering spans)
  static overlaps(a, b) {
    return operated([
      a.row,
      a.col,
      a.rowSpan,
      a.colSpan,
      b.row,
      b.col,
      b.rowSpan,
      b.colSpan
    ], () => {
      const aRight = a.col.value + a.colSpan.value;
      const aBottom = a.row.value + a.rowSpan.value;
      const bRight = b.col.value + b.colSpan.value;
      const bBottom = b.row.value + b.rowSpan.value;
      return !(a.col.value >= bRight || aRight <= b.col.value || a.row.value >= bBottom || aBottom <= b.row.value);
    });
  }
  // Get cells that a spanning cell occupies
  static getOccupiedCells(cell) {
    const cells = [];
    for (let r = 0; r < cell.rowSpan.value; r++) {
      for (let c = 0; c < cell.colSpan.value; c++) {
        cells.push(GridCoordUtils.create(
          cell.row.value + r,
          cell.col.value + c
        ));
      }
    }
    return cells;
  }
}
class GridLayoutUtils {
  // Fit cells into grid without overlap (basic bin packing)
  static fitCells(cells, config) {
    const placed = [];
    const occupied = /* @__PURE__ */ new Set();
    cells.forEach((cell) => {
      let placedCell = { ...cell };
      for (let row = 0; row < config.rows.value; row++) {
        for (let col = 0; col < config.cols.value; col++) {
          placedCell.row = numberRef(row);
          placedCell.col = numberRef(col);
          if (this.canPlaceCell(placedCell, occupied, config)) {
            this.markOccupied(placedCell, occupied);
            placed.push(placedCell);
            return;
          }
        }
      }
      placed.push(placedCell);
    });
    return placed;
  }
  // Check if a cell can be placed at its current position
  static canPlaceCell(cell, occupied, config) {
    if (!GridCoordUtils.isValid(cell, config).value) return false;
    const occupiedCells = GridCellUtils.getOccupiedCells(cell);
    return !occupiedCells.some(
      (coord) => occupied.has(`${coord.row.value},${coord.col.value}`)
    );
  }
  // Mark cells as occupied
  static markOccupied(cell, occupied) {
    const occupiedCells = GridCellUtils.getOccupiedCells(cell);
    occupiedCells.forEach((coord) => {
      occupied.add(`${coord.row.value},${coord.col.value}`);
    });
  }
  // Calculate optimal grid size for given cells
  static calculateOptimalSize(cells) {
    let maxRow = 0, maxCol = 0;
    cells.forEach((cell) => {
      maxRow = Math.max(maxRow, cell.row.value + cell.rowSpan.value);
      maxCol = Math.max(maxCol, cell.col.value + cell.colSpan.value);
    });
    return { rows: maxRow, cols: maxCol };
  }
  // Redistribute cells using different algorithms
  static redistributeCells(cells, config, algorithm = "row-major") {
    const redistributed = [];
    let currentRow = 0, currentCol = 0;
    cells.forEach((cell, index) => {
      switch (algorithm) {
        case "row-major":
          if (currentCol + cell.colSpan.value > config.cols.value) {
            currentRow++;
            currentCol = 0;
          }
          cell.row = numberRef(currentRow);
          cell.col = numberRef(currentCol);
          currentCol += cell.colSpan.value;
          break;
        case "column-major":
          if (currentRow + cell.rowSpan.value > config.rows.value) {
            currentCol++;
            currentRow = 0;
          }
          cell.row = numberRef(currentRow);
          cell.col = numberRef(currentCol);
          currentRow += cell.rowSpan.value;
          break;
        case "diagonal":
          const diagonal = Math.floor(index / Math.sqrt(cells.length));
          cell.row = numberRef(diagonal);
          cell.col = numberRef(index % Math.ceil(Math.sqrt(cells.length)));
          break;
      }
      redistributed.push(cell);
    });
    return redistributed;
  }
}
class GridAnimationUtils {
  // Animate cell movement along grid
  static animateCellMovement(cell, targetCoord, config, duration = 300) {
    return new Promise((resolve) => {
      const startRow = cell.row.value;
      const startCol = cell.col.value;
      const endRow = targetCoord.row.value;
      const endCol = targetCoord.col.value;
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        cell.row.value = startRow + (endRow - startRow) * eased;
        cell.col.value = startCol + (endCol - startCol) * eased;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
  // Animate cell resizing
  static animateCellResize(cell, targetRowSpan, targetColSpan, duration = 300) {
    return new Promise((resolve) => {
      const startRowSpan = cell.rowSpan.value;
      const startColSpan = cell.colSpan.value;
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        cell.rowSpan.value = startRowSpan + (targetRowSpan - startRowSpan) * eased;
        cell.colSpan.value = startColSpan + (targetColSpan - startColSpan) * eased;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
  // Chain animations for complex transitions
  static createAnimationChain(cell, config) {
    return {
      moveTo: (targetCoord, duration) => GridAnimationUtils.animateCellMovement(cell, targetCoord, config, duration),
      resizeTo: (rowSpan, colSpan, duration) => GridAnimationUtils.animateCellResize(cell, rowSpan, colSpan, duration),
      then: function(callback) {
        return this;
      }
    };
  }
}
class GridInteractionUtils {
  // Find cell at pixel position
  static getCellAtPixel(pixel, config) {
    return GridCoordUtils.fromPixel(pixel, config);
  }
  // Get all cells in a pixel rectangle
  static getCellsInRect(rect, config) {
    const cells = [];
    const topLeft = GridCoordUtils.fromPixel(rect.position, config);
    const bottomRight = GridCoordUtils.fromPixel(
      addVector2D(rect.position, rect.size),
      config
    );
    for (let row = topLeft.row.value; row <= bottomRight.row.value; row++) {
      for (let col = topLeft.col.value; col <= bottomRight.col.value; col++) {
        if (row >= 0 && row < config.rows.value && col >= 0 && col < config.cols.value) {
          cells.push(GridCoordUtils.create(row, col));
        }
      }
    }
    return cells;
  }
  // Check if dragging a cell to a new position would cause overlaps
  static wouldOverlap(cell, newCoord, existingCells) {
    const testCell = GridCellUtils.create(
      newCoord.row.value,
      newCoord.col.value,
      cell.rowSpan.value,
      cell.colSpan.value
    );
    return existingCells.some(
      (otherCell) => otherCell !== cell && GridCellUtils.overlaps(testCell, otherCell).value
    );
  }
  // Find valid drop positions for a cell
  static findValidPositions(cell, config, existingCells) {
    const validPositions = [];
    for (let row = 0; row < config.rows.value - cell.rowSpan.value + 1; row++) {
      for (let col = 0; col < config.cols.value - cell.colSpan.value + 1; col++) {
        const testCoord = GridCoordUtils.create(row, col);
        if (!this.wouldOverlap(cell, testCoord, existingCells)) {
          validPositions.push(testCoord);
        }
      }
    }
    return validPositions;
  }
  // Calculate drag preview position (snapped to valid positions)
  static calculateDragPreview(cell, dragPosition, config, existingCells) {
    const snappedCoord = GridCoordUtils.fromPixel(dragPosition, config);
    const clampedRow = Math.max(0, Math.min(
      snappedCoord.row.value,
      config.rows.value - cell.rowSpan.value
    ));
    const clampedCol = Math.max(0, Math.min(
      snappedCoord.col.value,
      config.cols.value - cell.colSpan.value
    ));
    const clampedCoord = GridCoordUtils.create(clampedRow, clampedCol);
    if (this.wouldOverlap(cell, clampedCoord, existingCells)) {
      const validPositions = this.findValidPositions(cell, config, existingCells);
      if (validPositions.length > 0) {
        let closest = validPositions[0];
        let minDistance = GridCoordUtils.euclideanDistance(clampedCoord, closest).value;
        validPositions.forEach((pos) => {
          const distance = GridCoordUtils.euclideanDistance(clampedCoord, pos).value;
          if (distance < minDistance) {
            minDistance = distance;
            closest = pos;
          }
        });
        return closest;
      }
    }
    return clampedCoord;
  }
}
const clampCell = (cellPos, layout) => {
  let x, y;
  if (cellPos instanceof Vector2D) {
    x = cellPos.x?.value ?? 0;
    y = cellPos.y?.value ?? 0;
  } else if (Array.isArray(cellPos) && cellPos.length >= 2) {
    x = cellPos[0] ?? 0;
    y = cellPos[1] ?? 0;
  } else {
    return vector2Ref(0, 0);
  }
  if (!isFinite(x) || !isFinite(y)) {
    return vector2Ref(0, 0);
  }
  const cols = Math.max(1, layout[0] || 1);
  const rows = Math.max(1, layout[1] || 1);
  const clampedX = Math.max(0, Math.min(Math.floor(x), cols - 1));
  const clampedY = Math.max(0, Math.min(Math.floor(y), rows - 1));
  return vector2Ref(clampedX, clampedY);
};
const floorCell = (cellPos, N = 1) => {
  const x = cellPos instanceof Vector2D ? cellPos.x.value : cellPos[0];
  const y = cellPos instanceof Vector2D ? cellPos.y.value : cellPos[1];
  const flooredCol = Math.floor(x / N) * N;
  const flooredRow = Math.floor(y / N) * N;
  return vector2Ref(flooredCol, flooredRow);
};
const ceilCell = (cellPos, N = 1) => {
  const x = cellPos instanceof Vector2D ? cellPos.x.value : cellPos[0];
  const y = cellPos instanceof Vector2D ? cellPos.y.value : cellPos[1];
  const ceiledCol = Math.ceil(x / N) * N;
  const ceiledRow = Math.ceil(y / N) * N;
  return vector2Ref(ceiledCol, ceiledRow);
};
const roundCell = (cellPos, N = 1) => {
  const x = cellPos instanceof Vector2D ? cellPos.x.value : cellPos[0];
  const y = cellPos instanceof Vector2D ? cellPos.y.value : cellPos[1];
  const roundedCol = Math.round(x / N) * N;
  const roundedRow = Math.round(y / N) * N;
  return vector2Ref(roundedCol, roundedRow);
};
const snapToGridCell = (cellPos, layout) => {
  const coord = cellPos instanceof Vector2D ? GridCoordUtils.create(cellPos.y.value, cellPos.x.value) : GridCoordUtils.create(cellPos[1], cellPos[0]);
  const config = {
    rows: numberRef(layout[1]),
    cols: numberRef(layout[0]),
    cellWidth: numberRef(1),
    cellHeight: numberRef(1),
    gap: numberRef(0),
    padding: vector2Ref(0, 0)
  };
  const validCoord = GridCoordUtils.create(
    Math.max(0, Math.min(coord.row.value, config.rows.value - 1)),
    Math.max(0, Math.min(coord.col.value, config.cols.value - 1))
  );
  return vector2Ref(validCoord.col.value, validCoord.row.value);
};
const getCellDistance = (cellA, cellB) => {
  const coordA = cellA instanceof Vector2D ? GridCoordUtils.create(cellA.y.value, cellA.x.value) : GridCoordUtils.create(cellA[1], cellA[0]);
  const coordB = cellB instanceof Vector2D ? GridCoordUtils.create(cellB.y.value, cellB.x.value) : GridCoordUtils.create(cellB[1], cellB[0]);
  return GridCoordUtils.manhattanDistance(coordA, coordB).value;
};
const getAdjacentCells = (cellPos, layout) => {
  const centerCoord = cellPos instanceof Vector2D ? GridCoordUtils.create(cellPos.y.value, cellPos.x.value) : GridCoordUtils.create(cellPos[1], cellPos[0]);
  const config = {
    rows: numberRef(layout[1]),
    cols: numberRef(layout[0]),
    cellWidth: numberRef(1),
    cellHeight: numberRef(1),
    gap: numberRef(0),
    padding: vector2Ref(0, 0)
  };
  const adjacent = [];
  const directions = ["up", "down", "left", "right"];
  for (const direction of directions) {
    const adjacentCoord = GridCoordUtils.adjacent(centerCoord, direction);
    if (GridCoordUtils.isValid(adjacentCoord, config).value) {
      adjacent.push(vector2Ref(adjacentCoord.col.value, adjacentCoord.row.value));
    }
  }
  return adjacent;
};
const getCellsInRange = (centerCell, radius, layout) => {
  const centerCoord = centerCell instanceof Vector2D ? GridCoordUtils.create(centerCell.y.value, centerCell.x.value) : GridCoordUtils.create(centerCell[1], centerCell[0]);
  const config = {
    rows: numberRef(layout[1]),
    cols: numberRef(layout[0]),
    cellWidth: numberRef(1),
    cellHeight: numberRef(1),
    gap: numberRef(0),
    padding: vector2Ref(0, 0)
  };
  const cellsInRange = [];
  for (let row = Math.max(0, centerCoord.row.value - radius); row <= Math.min(layout[1] - 1, centerCoord.row.value + radius); row++) {
    for (let col = Math.max(0, centerCoord.col.value - radius); col <= Math.min(layout[0] - 1, centerCoord.col.value + radius); col++) {
      const testCoord = GridCoordUtils.create(row, col);
      const distance = GridCoordUtils.manhattanDistance(centerCoord, testCoord).value;
      if (distance <= radius) {
        cellsInRange.push(vector2Ref(col, row));
      }
    }
  }
  return cellsInRange;
};
const findPathBetweenCells = (startCell, endCell, layout, obstacles = []) => {
  const startCoord = startCell instanceof Vector2D ? GridCoordUtils.create(startCell.y.value, startCell.x.value) : GridCoordUtils.create(startCell[1], startCell[0]);
  const endCoord = endCell instanceof Vector2D ? GridCoordUtils.create(endCell.y.value, endCell.x.value) : GridCoordUtils.create(endCell[1], endCell[0]);
  const obstacleSet = new Set(
    obstacles.map((obs) => {
      const coord = obs instanceof Vector2D ? GridCoordUtils.create(obs.y.value, obs.x.value) : GridCoordUtils.create(obs[1], obs[0]);
      return `${coord.row.value},${coord.col.value}`;
    })
  );
  const config = {
    rows: numberRef(layout[1]),
    cols: numberRef(layout[0]),
    cellWidth: numberRef(1),
    cellHeight: numberRef(1),
    gap: numberRef(0),
    padding: vector2Ref(0, 0)
  };
  const openSet = /* @__PURE__ */ new Map();
  const closedSet = /* @__PURE__ */ new Set();
  const startKey = `${startCoord.row.value},${startCoord.col.value}`;
  openSet.set(startKey, {
    coord: startCoord,
    f: GridCoordUtils.manhattanDistance(startCoord, endCoord).value,
    g: 0,
    parent: null
  });
  while (openSet.size > 0) {
    let currentKey = "";
    let lowestF = Infinity;
    for (const [key, node] of openSet) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentKey = key;
      }
    }
    const current = openSet.get(currentKey);
    openSet.delete(currentKey);
    closedSet.add(currentKey);
    if (current.coord.row.value === endCoord.row.value && current.coord.col.value === endCoord.col.value) {
      const path = [];
      let node = current;
      while (node) {
        path.unshift(vector2Ref(node.coord.col.value, node.coord.row.value));
        if (!node.parent) break;
        const parentKey = `${node.parent.row.value},${node.parent.col.value}`;
        node = openSet.get(parentKey) || null;
      }
      return path;
    }
    const directions = ["up", "down", "left", "right"];
    for (const direction of directions) {
      const neighborCoord = GridCoordUtils.adjacent(current.coord, direction);
      const neighborKey = `${neighborCoord.row.value},${neighborCoord.col.value}`;
      if (!GridCoordUtils.isValid(neighborCoord, config).value || closedSet.has(neighborKey) || obstacleSet.has(neighborKey)) {
        continue;
      }
      const gScore = current.g + 1;
      const hScore = GridCoordUtils.manhattanDistance(neighborCoord, endCoord).value;
      const fScore = gScore + hScore;
      const existing = openSet.get(neighborKey);
      if (!existing || gScore < existing.g) {
        openSet.set(neighborKey, {
          coord: neighborCoord,
          f: fScore,
          g: gScore,
          parent: current.coord
        });
      }
    }
  }
  return [];
};
const checkCellCollision = (cellA, cellB, cellSizeA = [1, 1], cellSizeB = [1, 1]) => {
  const coordA = cellA instanceof Vector2D ? GridCoordUtils.create(cellA.y.value, cellA.x.value) : GridCoordUtils.create(cellA[1], cellA[0]);
  const coordB = cellB instanceof Vector2D ? GridCoordUtils.create(cellB.y.value, cellB.x.value) : GridCoordUtils.create(cellB[1], cellB[0]);
  const gridCellA = GridCellUtils.create(
    coordA.row.value,
    coordA.col.value,
    cellSizeA[1],
    cellSizeA[0]
    // Note: [width, height] -> [colSpan, rowSpan]
  );
  const gridCellB = GridCellUtils.create(
    coordB.row.value,
    coordB.col.value,
    cellSizeB[1],
    cellSizeB[0]
  );
  return GridCellUtils.overlaps(gridCellA, gridCellB).value;
};
const optimizeCellLayout = (cells, layout) => {
  const config = {
    rows: numberRef(layout[1]),
    cols: numberRef(layout[0]),
    cellWidth: numberRef(1),
    cellHeight: numberRef(1),
    gap: numberRef(0),
    padding: vector2Ref(0, 0)
  };
  const gridCells = cells.map((cell, index) => {
    const coord = cell.pos instanceof Vector2D ? GridCoordUtils.create(cell.pos.y.value, cell.pos.x.value) : GridCoordUtils.create(cell.pos[1], cell.pos[0]);
    return GridCellUtils.create(
      coord.row.value,
      coord.col.value,
      cell.size[1],
      cell.size[0]
      // [width, height] -> [colSpan, rowSpan]
    );
  });
  const fittedCells = GridLayoutUtils.fitCells(gridCells, config);
  return fittedCells.map((fittedCell, index) => ({
    pos: vector2Ref(fittedCell.col.value, fittedCell.row.value),
    size: [fittedCell.colSpan.value, fittedCell.rowSpan.value]
  }));
};

class CSSUnitConverter {
  static unitPatterns = {
    px: /(-?\d*\.?\d+)px/g,
    em: /(-?\d*\.?\d+)em/g,
    rem: /(-?\d*\.?\d+)rem/g,
    vh: /(-?\d*\.?\d+)vh/g,
    vw: /(-?\d*\.?\d+)vw/g,
    vmin: /(-?\d*\.?\d+)vmin/g,
    vmax: /(-?\d*\.?\d+)vmax/g,
    percent: /(-?\d*\.?\d+)%/g
  };
  // Convert CSS value to pixels
  static toPixels(value, element) {
    if (!value) return 0;
    const testElement = element || document.body;
    const testDiv = document.createElement("div");
    testDiv.style.position = "absolute";
    testDiv.style.visibility = "hidden";
    testDiv.style.width = value;
    testElement.appendChild(testDiv);
    const pixels = testDiv.offsetWidth;
    testElement.removeChild(testDiv);
    return pixels;
  }
  // Convert pixels to CSS unit
  static fromPixels(pixels, unit = "px") {
    switch (unit) {
      case "em":
        const fontSize = parseFloat(getComputedStyle(document.body).fontSize);
        return `${pixels / fontSize}em`;
      case "rem":
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return `${pixels / rootFontSize}rem`;
      case "%":
        return `${pixels / globalThis.innerWidth * 100}%`;
      default:
        return `${pixels}px`;
    }
  }
  // Parse CSS value with units
  static parseValue(cssValue) {
    const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]+)?$/);
    if (!match) return { value: 0, unit: "px" };
    return {
      value: parseFloat(match[1]),
      unit: match[2] || "px"
    };
  }
  // Convert between units
  static convertUnits(value, fromUnit, toUnit, element) {
    if (fromUnit === toUnit) return value;
    let pixels;
    switch (fromUnit) {
      case "px":
        pixels = value;
        break;
      case "em":
        const fontSize = parseFloat(getComputedStyle(element || document.body).fontSize);
        pixels = value * fontSize;
        break;
      case "rem":
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        pixels = value * rootFontSize;
        break;
      case "%":
        pixels = value / 100 * globalThis.innerWidth;
        break;
      case "vw":
        pixels = value / 100 * globalThis.innerWidth;
        break;
      case "vh":
        pixels = value / 100 * globalThis.innerHeight;
        break;
      default:
        pixels = value;
    }
    switch (toUnit) {
      case "px":
        return pixels;
      case "em":
        const fontSize = parseFloat(getComputedStyle(element || document.body).fontSize);
        return pixels / fontSize;
      case "rem":
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return pixels / rootFontSize;
      case "%":
        return pixels / globalThis.innerWidth * 100;
      case "vw":
        return pixels / globalThis.innerWidth * 100;
      case "vh":
        return pixels / globalThis.innerHeight * 100;
      default:
        return pixels;
    }
  }
}
class CSSTransform {
  // Convert reactive Vector2D to CSS translate
  static translate2D(vector) {
    return operated(
      [vector.x, vector.y],
      () => `translate(${vector.x.value}px, ${vector.y.value}px)`
    );
  }
  // Convert reactive Vector2D to CSS translate3d
  static translate3D(vector, z = numberRef(0)) {
    return operated(
      [vector.x, vector.y, z],
      () => `translate3d(${vector.x.value}px, ${vector.y.value}px, ${z.value}px)`
    );
  }
  // Convert reactive Vector2D to CSS scale
  static scale2D(vector) {
    return operated(
      [vector.x, vector.y],
      () => `scale(${vector.x.value}, ${vector.y.value})`
    );
  }
  // Convert reactive number to CSS rotate
  static rotate(angle) {
    return operated([angle], () => `rotate(${angle.value}deg)`);
  }
  // Combine transforms into single CSS transform string
  static combine(transforms) {
    return operated(transforms, () => transforms.map((t) => t.value).join(" "));
  }
  // Create matrix transform from reactive Matrix2D
  static matrix2D(matrix) {
    return operated(
      matrix.elements,
      () => `matrix(${matrix.elements.map((e) => e.value).join(", ")})`
    );
  }
  // Create matrix3d transform from reactive Matrix4D
  static matrix3D(matrix) {
    return operated(
      matrix.elements,
      () => `matrix3d(${matrix.elements.map((e) => e.value).join(", ")})`
    );
  }
}
class CSSPosition {
  // Convert reactive Vector2D to CSS position values
  static leftTop(vector) {
    return {
      left: operated([vector.x], () => `${vector.x.value}px`),
      top: operated([vector.y], () => `${vector.y.value}px`)
    };
  }
  // Convert reactive Vector2D to CSS inset values
  static inset(vector) {
    return {
      inset: operated([vector.x, vector.y], () => `${vector.y.value}px ${vector.x.value}px`)
    };
  }
  // Convert reactive Vector2D to CSS size values
  static size(vector) {
    return {
      width: operated([vector.x], () => `${vector.x.value}px`),
      height: operated([vector.y], () => `${vector.y.value}px`)
    };
  }
}
class CSSBinder {
  // Bind reactive Vector2D to CSS transform
  static bindTransform(element, vector, animationType = "instant", options) {
    const transformValue = CSSTransform.translate2D(vector);
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    return binder(element, "transform", transformValue, options) ?? (() => {
    });
  }
  // Bind reactive Vector2D to CSS position
  static bindPosition(element, vector, animationType = "instant", options) {
    const position = CSSPosition.leftTop(vector);
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    const unsubLeft = binder(element, "left", position.left, options) ?? (() => {
    });
    const unsubTop = binder(element, "top", position.top, options) ?? (() => {
    });
    return () => {
      unsubLeft?.();
      unsubTop?.();
    };
  }
  // Bind reactive Vector2D to CSS size
  static bindSize(element, vector, animationType = "instant", options) {
    const size = CSSPosition.size(vector);
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    const unsubWidth = binder(element, "width", size.width, options) ?? (() => {
    });
    const unsubHeight = binder(element, "height", size.height, options) ?? (() => {
    });
    return () => {
      unsubWidth?.();
      unsubHeight?.();
    };
  }
  // Bind reactive value with unit conversion
  static bindWithUnit(element, property, value, unit = "px", animationType = "instant", options) {
    const cssValue = operated([value], () => `${value.value}${unit}`);
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    return binder(element, property, cssValue, options) ?? (() => {
    });
  }
  // Bind reactive vector with unit conversion
  static bindVectorWithUnit(element, vector, unit = "px", animationType = "instant", options) {
    const cssValue = operated(
      [vector.x, vector.y],
      () => `${vector.x.value}${unit} ${vector.y.value}${unit}`
    );
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    return binder(element, "transform", cssValue, {
      ...options,
      handler: animationType === "instant" ? void 0 : (el, val) => {
        el.style.setProperty("transform", `translate(${val})`);
      }
    }) ?? (() => {
    });
  }
  // Enhanced animation methods with morphing support
  static bindTransformMorph(element, transformProps, options = {}) {
    const transforms = {};
    if (transformProps.translate) {
      transforms.transform = operated(
        [transformProps.translate.x, transformProps.translate.y],
        () => `translate(${transformProps.translate.x.value}px, ${transformProps.translate.y.value}px)`
      );
    }
    if (transformProps.scale) {
      const scaleStr = transformProps.scale instanceof Vector2D ? operated(
        [transformProps.scale.x, transformProps.scale.y],
        () => `scale(${transformProps.scale.x.value}, ${transformProps.scale.y.value})`
      ) : operated(
        [transformProps.scale],
        () => `scale(${transformProps.scale.value})`
      );
      transforms.transform = transforms.transform ? operated([transforms.transform, scaleStr], (t, s) => `${t} ${s}`) : scaleStr;
    }
    if (transformProps.rotate) {
      const rotateStr = operated(
        [transformProps.rotate],
        () => `rotate(${transformProps.rotate.value}deg)`
      );
      transforms.transform = transforms.transform ? operated([transforms.transform, rotateStr], (t, r) => `${t} ${r}`) : rotateStr;
    }
    if (transformProps.skew) {
      const skewStr = operated(
        [transformProps.skew.x, transformProps.skew.y],
        () => `skew(${transformProps.skew.x.value}deg, ${transformProps.skew.y.value}deg)`
      );
      transforms.transform = transforms.transform ? operated([transforms.transform, skewStr], (t, s) => `${t} ${s}`) : skewStr;
    }
    return bindMorph(element, transforms, options);
  }
  // Bind reactive color with smooth transitions
  static bindColor(element, property, color, animationType = "transition", options = { duration: 300, easing: "ease-in-out" }) {
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : bindTransition;
    const colorValue = typeof color === "string" ? color : operated([color], () => `hsl(${color.value}, 70%, 50%)`);
    return binder(element, property, colorValue, options) ?? (() => {
    });
  }
  // Bind reactive opacity with fade effects
  static bindOpacity(element, opacity, animationType = "transition", options = { duration: 200, easing: "ease-in-out" }) {
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    return binder(element, "opacity", opacity, options) ?? (() => {
    });
  }
  // Bind reactive border radius with morphing
  static bindBorderRadius(element, radius, animationType = "animate", options = { duration: 300, easing: "ease-out" }) {
    const binder = animationType === "instant" ? bindWith : animationType === "animate" ? bindAnimated : animationType === "transition" ? bindTransition : bindSpring;
    const radiusValue = radius instanceof Vector2D ? operated([radius.x, radius.y], () => `${radius.x.value}px ${radius.y.value}px`) : operated([radius], () => `${radius.value}px`);
    return binder(element, "border-radius", radiusValue, options) ?? (() => {
    });
  }
}
class CSSCalc {
  // Create CSS calc expression from reactive values
  static add(a, b, unit = "px") {
    return operated([a, b], () => `calc(${a.value}${unit} + ${b.value}${unit})`);
  }
  static subtract(a, b, unit = "px") {
    return operated([a, b], () => `calc(${a.value}${unit} - ${b.value}${unit})`);
  }
  static multiply(a, b) {
    return operated([a, b], () => `calc(${a.value} * ${b.value})`);
  }
  static divide(a, b) {
    return operated([a, b], () => `calc(${a.value} / ${b.value})`);
  }
  // Clamp reactive value between min and max
  static clamp(value, min, max, unit = "px") {
    return operated([value, min, max], () => `clamp(${min.value}${unit}, ${value.value}${unit}, ${max.value}${unit})`);
  }
  // Min/max operations
  static min(a, b, unit = "px") {
    return operated([a, b], () => `min(${a.value}${unit}, ${b.value}${unit})`);
  }
  static max(a, b, unit = "px") {
    return operated([a, b], () => `max(${a.value}${unit}, ${b.value}${unit})`);
  }
}
class DOMMatrixAdapter {
  // Convert reactive Matrix4D to DOMMatrix
  static toDOMMatrix(matrix) {
    return new DOMMatrix(matrix.elements.map((e) => e.value));
  }
  // Convert DOMMatrix to reactive Matrix4D
  static fromDOMMatrix(domMatrix) {
    const elements = Array.from(domMatrix.toFloat32Array()).map((v) => numberRef(v));
    return new Matrix4D(
      elements[0],
      elements[1],
      elements[2],
      elements[3],
      elements[4],
      elements[5],
      elements[6],
      elements[7],
      elements[8],
      elements[9],
      elements[10],
      elements[11],
      elements[12],
      elements[13],
      elements[14],
      elements[15]
    );
  }
  // Apply reactive transform to DOMMatrix
  static applyTransform(domMatrix, transform) {
    const reactiveMatrix = this.fromDOMMatrix(domMatrix);
    return domMatrix.multiplySelf(this.toDOMMatrix(transform));
  }
}
class CSSCustomProps {
  // Bind reactive value to CSS custom property
  static bindProperty(element, propName, value, unit = "") {
    return operated([value], () => {
      element.style.setProperty(propName, `${value.value}${unit}`);
      return () => {
      };
    });
  }
  // Bind reactive Vector2D to CSS custom properties
  static bindVectorProperties(element, baseName, vector, unit = "px") {
    const unsubX = this.bindProperty(element, `${baseName}-x`, vector.x, unit);
    const unsubY = this.bindProperty(element, `${baseName}-y`, vector.y, unit);
    return () => {
      unsubX();
      unsubY();
    };
  }
  // Get reactive value from CSS custom property
  static getReactiveProperty(element, propName) {
    const initialValue = parseFloat(getComputedStyle(element).getPropertyValue(propName)) || 0;
    const reactiveValue = numberRef(initialValue);
    const observer = new MutationObserver(() => {
      const newValue = parseFloat(getComputedStyle(element).getPropertyValue(propName)) || 0;
      reactiveValue.value = newValue;
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["style"]
    });
    return reactiveValue;
  }
}
class CSSUnitUtils {
  // Convert reactive values to CSS pixel units
  static asPx(value) {
    if (typeof value === "number") {
      return `${value || 0}px`;
    }
    if (typeof value === "string") {
      return value || "0px";
    }
    return operated([value], (v) => `${v || 0}px`);
  }
  // Convert reactive values to CSS percentage units
  static asPercent(value) {
    if (typeof value === "number") {
      return `${value || 0}%`;
    }
    if (typeof value === "string") {
      return value || "0%";
    }
    return operated([value], (v) => `${v || 0}%`);
  }
  // Convert reactive values to CSS em units
  static asEm(value) {
    if (typeof value === "number") {
      return `${value || 0}em`;
    }
    if (typeof value === "string") {
      return value || "0em";
    }
    return operated([value], (v) => `${v || 0}em`);
  }
  // Convert reactive values to CSS rem units
  static asRem(value) {
    if (typeof value === "number") {
      return `${value || 0}rem`;
    }
    if (typeof value === "string") {
      return value || "0rem";
    }
    return operated([value], (v) => `${v || 0}rem`);
  }
  // Convert reactive values to CSS viewport units
  static asVw(value) {
    if (typeof value === "number") {
      return `${value || 0}vw`;
    }
    if (typeof value === "string") {
      return value || "0vw";
    }
    return operated([value], (v) => `${v || 0}vw`);
  }
  static asVh(value) {
    if (typeof value === "number") {
      return `${value || 0}vh`;
    }
    if (typeof value === "string") {
      return value || "0vh";
    }
    return operated([value], (v) => `${v || 0}vh`);
  }
  // Generic unit converter with fallback
  static asUnit(value, unit, fallbackValue = 0) {
    if (typeof value === "number") {
      return `${value || fallbackValue}${unit}`;
    }
    if (typeof value === "string") {
      return value || `${fallbackValue}${unit}`;
    }
    return operated([value], (v) => `${v || fallbackValue}${unit}`);
  }
  // Reactive CSS calc() expressions
  static calc(expression) {
    return `calc(${expression})`;
  }
  // Create reactive calc expressions
  static reactiveCalc(operands, operator) {
    return operated(operands, (...values) => {
      const expression = values.join(` ${operator} `);
      return `calc(${expression})`;
    });
  }
  // Clamp reactive values with CSS clamp()
  static clamp(min, value, max) {
    const minStr = typeof min === "number" || typeof min === "string" ? min : operated([min], (v) => v);
    const valStr = typeof value === "number" || typeof value === "string" ? value : operated([value], (v) => v);
    const maxStr = typeof max === "number" || typeof max === "string" ? max : operated([max], (v) => v);
    return operated([minStr, valStr, maxStr].filter((v) => typeof v !== "string"), () => {
      const minVal = typeof min === "number" ? min : typeof min === "string" ? min : min.value;
      const val = typeof value === "number" ? value : typeof value === "string" ? value : value.value;
      const maxVal = typeof max === "number" ? max : typeof max === "string" ? max : max.value;
      return `clamp(${minVal}, ${val}, ${maxVal})`;
    });
  }
  // Reactive max/min functions
  static max(values) {
    return operated(values.filter((v) => typeof v !== "string"), (...nums) => {
      const cssValues = values.map(
        (v) => typeof v === "number" ? v : typeof v === "string" ? v : v.value
      );
      return `max(${cssValues.join(", ")})`;
    });
  }
  static min(values) {
    return operated(values.filter((v) => typeof v !== "string"), (...nums) => {
      const cssValues = values.map(
        (v) => typeof v === "number" ? v : typeof v === "string" ? v : v.value
      );
      return `min(${cssValues.join(", ")})`;
    });
  }
}
class CSSInputControls {
  // Bind slider thumb position reactively
  static bindSliderThumb(thumbElement, value, min, max, trackWidth) {
    const position = operated([value, min, max, trackWidth], () => {
      const percentage = (value.value - min.value) / (max.value - min.value) * 100;
      return `translateX(${percentage}%)`;
    });
    return CSSBinder.bindTransform(thumbElement, position);
  }
  // Bind progress bar fill reactively
  static bindProgressFill(fillElement, progress) {
    const width = operated([progress], () => `${progress.value * 100}%`);
    return bindWith(fillElement, "width", width, handleStyleChange) ?? (() => {
    });
  }
  // Bind checkbox/radio button state with animations
  static bindToggleState(element, checked) {
    const scale = operated([checked], () => checked.value ? "scale(1)" : "scale(0)");
    const opacity = operated([checked], () => checked.value ? "1" : "0");
    const unsubScale = CSSBinder.bindTransform(element, scale);
    const unsubOpacity = bindWith(element, "opacity", opacity, handleStyleChange) ?? (() => {
    });
    return () => {
      unsubScale?.();
      unsubOpacity?.();
    };
  }
}
class CSSScrollbarControls {
  // Bind scrollbar thumb position and size reactively
  static bindScrollbarThumb(thumbElement, scrollPosition, contentSize, containerSize, axis = "vertical") {
    const thumbSize = operated([contentSize, containerSize], () => {
      const ratio = containerSize.value / contentSize.value;
      return Math.max(20, ratio * containerSize.value);
    });
    const thumbPosition = operated([scrollPosition, contentSize, containerSize, thumbSize], () => {
      const maxScroll = Math.max(0, contentSize.value - containerSize.value);
      const scrollRatio = maxScroll > 0 ? scrollPosition.value / maxScroll : 0;
      return scrollRatio * (containerSize.value - thumbSize.value);
    });
    const transform = axis === "vertical" ? operated([thumbPosition], () => `translateY(${thumbPosition.value}px)`) : operated([thumbPosition], () => `translateX(${thumbPosition.value}px)`);
    const unsubSize = axis === "vertical" ? bindWith(thumbElement, "height", operated([thumbSize], (s) => `${s}px`), handleStyleChange) : bindWith(thumbElement, "width", operated([thumbSize], (s) => `${s}px`), handleStyleChange);
    const unsubTransform = CSSBinder.bindTransform(thumbElement, transform);
    return () => {
      unsubSize?.();
      unsubTransform?.();
    };
  }
  // Bind scrollbar visibility with smooth transitions
  static bindScrollbarVisibility(scrollbarElement, isVisible, transitionDuration = 300) {
    const opacity = operated([isVisible], () => isVisible.value);
    const visibility = operated([isVisible], () => isVisible.value > 0 ? "visible" : "hidden");
    const pointerEvents = operated([isVisible], () => isVisible.value > 0 ? "auto" : "none");
    const unsubOpacity = bindWith(scrollbarElement, "opacity", opacity, handleStyleChange);
    const unsubVisibility = bindWith(scrollbarElement, "visibility", visibility, handleStyleChange);
    const unsubPointerEvents = bindWith(scrollbarElement, "pointer-events", pointerEvents, handleStyleChange);
    scrollbarElement.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
    return () => {
      unsubOpacity?.();
      unsubVisibility?.();
      unsubPointerEvents?.();
    };
  }
  // Bind scrollbar theme properties reactively
  static bindScrollbarTheme(scrollbarElement, theme) {
    const unbinders = [];
    if (theme.trackColor) {
      unbinders.push(bindWith(
        scrollbarElement,
        "--scrollbar-track-color",
        operated([theme.trackColor], (c) => `rgba(${c.value}, ${c.value}, ${c.value}, 0.1)`),
        handleStyleChange
      ) ?? (() => {
      }));
    }
    if (theme.thumbColor) {
      unbinders.push(bindWith(
        scrollbarElement,
        "--scrollbar-thumb-color",
        operated([theme.thumbColor], (c) => `rgba(${c.value}, ${c.value}, ${c.value}, 0.5)`),
        handleStyleChange
      ) ?? (() => {
      }));
    }
    if (theme.borderRadius) {
      unbinders.push(bindWith(
        scrollbarElement,
        "--scrollbar-border-radius",
        operated([theme.borderRadius], (r) => `${r.value}px`),
        handleStyleChange
      ) ?? (() => {
      }));
    }
    if (theme.thickness) {
      unbinders.push(bindWith(
        scrollbarElement,
        "--scrollbar-thickness",
        operated([theme.thickness], (t) => `${t.value}px`),
        handleStyleChange
      ) ?? (() => {
      }));
    }
    return () => unbinders.forEach((unbind) => unbind?.());
  }
}
class CSSMomentumScrolling {
  // Create smooth scroll animation with momentum
  static createMomentumScroll(element, velocity, deceleration = 0.92) {
    return new Promise((resolve) => {
      let animationId;
      const animate = () => {
        velocity.value *= deceleration;
        if (Math.abs(velocity.value) < 0.1) {
          velocity.value = 0;
          cancelAnimationFrame(animationId);
          resolve();
          return;
        }
        element.scrollBy({
          top: velocity.value,
          behavior: "instant"
        });
        animationId = requestAnimationFrame(animate);
      };
      animate();
    });
  }
  // Create bounce-back animation for scroll boundaries
  static createBounceBack(element, overScroll, duration = 300) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const startValue = overScroll.value;
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        overScroll.value = startValue * (1 - eased);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          overScroll.value = 0;
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
}
class CSSInteractionStates {
  // Bind focus ring with reactive visibility
  static bindFocusRing(element, isFocused, ringColor = "rgba(59, 130, 246, 0.5)") {
    const boxShadow = operated(
      [isFocused],
      () => isFocused.value ? `0 0 0 2px ${ringColor}` : "none"
    );
    return bindWith(element, "box-shadow", boxShadow, handleStyleChange) ?? (() => {
    });
  }
  // Bind hover state with smooth transitions
  static bindHoverState(element, isHovered, hoverTransform = "scale(1.05)") {
    const transform = operated(
      [isHovered],
      () => isHovered.value ? hoverTransform : "none"
    );
    return CSSBinder.bindTransform(element, transform) ?? (() => {
    });
  }
  // Bind active/press state
  static bindActiveState(element, isActive, activeTransform = "scale(0.95)") {
    const transform = operated(
      [isActive],
      () => isActive.value ? activeTransform : "none"
    );
    return CSSBinder.bindTransform(element, transform) ?? (() => {
    });
  }
}

class ReactiveDraggable {
  position;
  velocity;
  acceleration;
  constructor(initialX = 0, initialY = 0) {
    this.position = vector2Ref(initialX, initialY);
    this.velocity = vector2Ref(0, 0);
    this.acceleration = vector2Ref(0, 0);
  }
  // Physics-based movement with reactive math
  update(deltaTime) {
    const deltaVel = multiplyVector2D(this.acceleration, numberRef(deltaTime));
    this.velocity = addVector2D(this.velocity, deltaVel);
    const deltaPos = multiplyVector2D(this.velocity, numberRef(deltaTime));
    this.position = addVector2D(this.position, deltaPos);
  }
  // Apply forces reactively
  applyForce(force) {
    this.acceleration = addVector2D(this.acceleration, force);
  }
  // Get current position as array (compatible with existing DOM APIs)
  getPosition() {
    return [this.position.x.value, this.position.y.value];
  }
}
class ReactiveBoundingBox {
  topLeft;
  size;
  center;
  corners;
  constructor(element) {
    this.topLeft = vector2Ref(0, 0);
    this.size = vector2Ref(0, 0);
    this.center = addVector2D(
      this.topLeft,
      multiplyVector2D(this.size, numberRef(0.5))
    );
    this.corners = [
      this.topLeft,
      // top-left
      addVector2D(this.topLeft, new Vector2D(this.size.x, numberRef(0))),
      // top-right
      addVector2D(this.topLeft, this.size),
      // bottom-right
      addVector2D(this.topLeft, new Vector2D(numberRef(0), this.size.y))
      // bottom-left
    ];
    this.updateBounds(element);
  }
  updateBounds(element) {
    const rect = element.getBoundingClientRect();
    this.topLeft.x.value = rect.left;
    this.topLeft.y.value = rect.top;
    this.size.x.value = rect.width;
    this.size.y.value = rect.height;
  }
  // Reactive collision detection
  contains(point) {
    const inX = operated(
      [point.x, this.topLeft.x, this.size.x],
      () => point.x.value >= this.topLeft.x.value && point.x.value <= this.topLeft.x.value + this.size.x.value
    );
    const inY = operated(
      [point.y, this.topLeft.y, this.size.y],
      () => point.y.value >= this.topLeft.y.value && point.y.value <= this.topLeft.y.value + this.size.y.value
    );
    return operated([inX, inY], () => inX.value && inY.value);
  }
  // Get bounds as array (compatible with existing APIs)
  getBounds() {
    return [
      this.topLeft.x.value,
      this.topLeft.y.value,
      // x, y
      this.size.x.value,
      this.size.y.value
      // width, height
    ];
  }
}
class ReactiveGridTransform {
  position;
  scale;
  rotation;
  constructor() {
    this.position = vector2Ref(0, 0);
    this.scale = vector2Ref(1, 1);
    this.rotation = numberRef(0);
  }
  // Apply transformation matrix to a point
  transformPoint(point) {
    let result = scale2D(point, this.scale.x, this.scale.y);
    result = rotate2D(result, this.rotation);
    result = translate2D(result, this.position.x, this.position.y);
    return result;
  }
  // Convert grid coordinates to screen coordinates
  gridToScreen(gridX, gridY, cellSize) {
    const gridPoint = vector2Ref(gridX * cellSize, gridY * cellSize);
    return this.transformPoint(gridPoint);
  }
  // Convert screen coordinates to grid coordinates
  screenToGrid(screenX, screenY, cellSize) {
    const screenPoint = vector2Ref(screenX, screenY);
    let result = translate2D(
      screenPoint,
      operated([this.position.x], () => -this.position.x.value),
      operated([this.position.y], () => -this.position.y.value)
    );
    result = rotate2D(result, operated([this.rotation], () => -this.rotation.value));
    result = scale2D(
      result,
      operated([this.scale.x], () => 1 / this.scale.x.value),
      operated([this.scale.y], () => 1 / this.scale.y.value)
    );
    return new Vector2D(
      operated([result.x], () => result.x.value / cellSize),
      operated([result.y], () => result.y.value / cellSize)
    );
  }
}
class ReactivePointer {
  position;
  delta;
  velocity;
  constructor() {
    this.position = vector2Ref(0, 0);
    this.delta = vector2Ref(0, 0);
    this.velocity = vector2Ref(0, 0);
  }
  updatePosition(clientX, clientY, deltaTime = 1) {
    const newPosition = vector2Ref(clientX, clientY);
    this.delta = subtractVector2D(newPosition, this.position);
    this.velocity = multiplyVector2D(this.delta, numberRef(1 / deltaTime));
    this.position = newPosition;
  }
  // Get distance from another point
  distanceTo(other) {
    const diff = subtractVector2D(this.position, other);
    return magnitude2D(diff);
  }
  // Check if pointer is within a reactive bounding box
  isWithin(bounds) {
    return bounds.contains(this.position);
  }
  // Get position as array for DOM APIs
  getPosition() {
    return [this.position.x.value, this.position.y.value];
  }
}
class ReactivePointerAPI {
  pointers = /* @__PURE__ */ new Map();
  // Enhanced coordinate conversion with reactive math
  static clientToOrient(clientX, clientY, element) {
    const rect = element.getBoundingClientRect();
    const elementSize = vector2Ref(rect.width, rect.height);
    const relativeX = operated([numberRef(clientX), numberRef(rect.left)], (cx, left) => cx.value - left.value);
    const relativeY = operated([numberRef(clientY), numberRef(rect.top)], (cy, top) => cy.value - top.value);
    const normalizedX = operated([relativeX, numberRef(rect.width)], (rx, w) => rx.value / w.value);
    const normalizedY = operated([relativeY, numberRef(rect.height)], (ry, h) => ry.value / h.value);
    return new Vector2D(normalizedX, normalizedY);
  }
  // Enhanced movement tracking
  trackPointer(pointerId, clientX, clientY) {
    let pointer = this.pointers.get(pointerId);
    if (!pointer) {
      pointer = new ReactivePointer();
      this.pointers.set(pointerId, pointer);
    }
    pointer.updatePosition(clientX, clientY, 1 / 60);
    return pointer;
  }
  // Reactive collision detection between pointers and elements
  isPointerOverElement(pointerId, element) {
    const pointer = this.pointers.get(pointerId);
    if (!pointer) return numberRef(0);
    const bbox = new ReactiveBoundingBox(element);
    const pointerPos = vector2Ref(...pointer.getPosition());
    return bbox.contains(pointerPos);
  }
  // Multi-pointer gesture recognition
  getPinchDistance(pointerId1, pointerId2) {
    const p1 = this.pointers.get(pointerId1);
    const p2 = this.pointers.get(pointerId2);
    if (!p1 || !p2) return numberRef(0);
    const pos1 = vector2Ref(...p1.getPosition());
    const pos2 = vector2Ref(...p2.getPosition());
    return magnitude2D(subtractVector2D(pos1, pos2));
  }
}
class ReactiveDraggableEnhanced {
  holder;
  reactivePosition;
  velocity;
  acceleration;
  friction;
  spring;
  dragHandler;
  // Would be DragHandler instance
  constructor(holder, options = {}) {
    this.holder = holder;
    this.reactivePosition = vector2Ref(0, 0);
    this.velocity = vector2Ref(0, 0);
    this.acceleration = vector2Ref(0, 0);
    this.friction = numberRef(options.friction || 0.95);
    this.spring = {
      stiffness: numberRef(options.spring?.stiffness || 0.1),
      damping: numberRef(options.spring?.damping || 0.8)
    };
  }
  // Physics-based updates
  updatePhysics(deltaTime = 1 / 60) {
    this.velocity = multiplyVector2D(this.velocity, this.friction);
    const deltaPos = multiplyVector2D(this.velocity, numberRef(deltaTime));
    this.reactivePosition = addVector2D(this.reactivePosition, deltaPos);
    this.applySpringForces();
  }
  applySpringForces() {
    const springForce = multiplyVector2D(this.reactivePosition, operated([this.spring.stiffness], (s) => -s.value));
    const dampingForce = multiplyVector2D(this.velocity, operated([this.spring.damping], (d) => -d.value));
    this.acceleration = addVector2D(springForce, dampingForce);
    this.velocity = addVector2D(this.velocity, multiplyVector2D(this.acceleration, numberRef(1 / 60)));
  }
  // Apply external forces (like mouse drag)
  applyForce(force) {
    this.velocity = addVector2D(this.velocity, force);
  }
  // Get current position for DOM updates
  getPositionForDOM() {
    return [this.reactivePosition.x.value, this.reactivePosition.y.value];
  }
  // Check if movement has settled
  isAtRest(threshold = 0.1) {
    const speed = magnitude2D(this.velocity).value;
    const distance = magnitude2D(this.reactivePosition).value;
    return speed < threshold && distance < threshold;
  }
  // Enhanced drag end with physics settling
  enhancedDragEnd() {
    const animate = () => {
      this.updatePhysics();
      const [x, y] = this.getPositionForDOM();
      this.holder.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
      if (!this.isAtRest()) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
}
class ReactiveResizableEnhanced {
  holder;
  reactiveSize;
  minSize;
  maxSize;
  aspectRatio;
  constructor(holder, options = {}) {
    this.holder = holder;
    this.reactiveSize = vector2Ref(
      holder.offsetWidth,
      holder.offsetHeight
    );
    this.minSize = vector2Ref(
      options.minSize?.[0] || 50,
      options.minSize?.[1] || 50
    );
    this.maxSize = vector2Ref(
      options.maxSize?.[0] || globalThis.innerWidth,
      options.maxSize?.[1] || globalThis.innerHeight
    );
    this.aspectRatio = options.aspectRatio ? numberRef(options.aspectRatio) : null;
  }
  // Set size with reactive constraints
  setSize(width, height) {
    let newWidth = operated(
      [numberRef(width), this.minSize.x, this.maxSize.x],
      (w, min, max) => Math.max(min.value, Math.min(max.value, w.value))
    );
    let newHeight = operated(
      [numberRef(height), this.minSize.y, this.maxSize.y],
      (h, min, max) => Math.max(min.value, Math.min(max.value, h.value))
    );
    if (this.aspectRatio) {
      const currentRatio = operated([newWidth, newHeight], (w, h) => w.value / h.value);
      const targetRatio = this.aspectRatio;
      operated([currentRatio, targetRatio], (current, target) => {
        if (Math.abs(current.value - target.value) > 0.01) {
          newHeight = operated([newWidth, targetRatio], (w, ratio) => w.value / ratio.value);
        }
      });
    }
    this.reactiveSize.x.value = newWidth.value;
    this.reactiveSize.y.value = newHeight.value;
    this.holder.style.width = `${newWidth.value}px`;
    this.holder.style.height = `${newHeight.value}px`;
  }
  // Resize with constraints applied
  resizeBy(deltaWidth, deltaHeight) {
    const newWidth = operated([this.reactiveSize.x, numberRef(deltaWidth)], (w, dw) => w.value + dw.value);
    const newHeight = operated([this.reactiveSize.y, numberRef(deltaHeight)], (h, dh) => h.value + dh.value);
    this.setSize(newWidth.value, newHeight.value);
  }
  // Get constrained size for DOM updates
  getConstrainedSize() {
    return [this.reactiveSize.x.value, this.reactiveSize.y.value];
  }
  // Check if size is at minimum/maximum bounds
  isAtMinSize() {
    return this.reactiveSize.x.value <= this.minSize.x.value || this.reactiveSize.y.value <= this.minSize.y.value;
  }
  isAtMaxSize() {
    return this.reactiveSize.x.value >= this.maxSize.x.value || this.reactiveSize.y.value >= this.maxSize.y.value;
  }
}
class ReactiveGridSystem {
  cellSize;
  gridOffset;
  zoom;
  pan;
  constructor(cellSize = [32, 32]) {
    this.cellSize = vector2Ref(cellSize[0], cellSize[1]);
    this.gridOffset = vector2Ref(0, 0);
    this.zoom = numberRef(1);
    this.pan = vector2Ref(0, 0);
  }
  // Convert grid coordinates to screen coordinates with zoom and pan
  gridToScreen(gridX, gridY) {
    const gridPos = vector2Ref(gridX, gridY);
    const scaled = multiplyVector2D(gridPos, this.cellSize);
    const zoomed = multiplyVector2D(scaled, this.zoom);
    const panned = addVector2D(zoomed, this.pan);
    return addVector2D(panned, this.gridOffset);
  }
  // Convert screen coordinates to grid coordinates
  screenToGrid(screenX, screenY) {
    const screenPos = vector2Ref(screenX, screenY);
    const unpanned = subtractVector2D(screenPos, this.pan);
    const unoffset = subtractVector2D(unpanned, this.gridOffset);
    const unzoomed = divideVector2D(unoffset, this.zoom);
    return divideVector2D(unzoomed, this.cellSize);
  }
  // Snap position to nearest grid point
  snapToGrid(position) {
    const gridCoords = this.screenToGrid(position.x.value, position.y.value);
    return this.gridToScreen(
      Math.round(gridCoords.x.value),
      Math.round(gridCoords.y.value)
    );
  }
  // Get grid line positions for rendering
  getGridLines(viewportSize) {
    const [width, height] = viewportSize;
    const topLeft = this.screenToGrid(-this.pan.x.value, -this.pan.y.value);
    const bottomRight = this.screenToGrid(width - this.pan.x.value, height - this.pan.y.value);
    const horizontal = [];
    const vertical = [];
    for (let y = Math.floor(topLeft.y.value); y <= Math.ceil(bottomRight.y.value); y++) {
      const screenY = this.gridToScreen(0, y).y.value;
      horizontal.push(screenY);
    }
    for (let x = Math.floor(topLeft.x.value); x <= Math.ceil(bottomRight.x.value); x++) {
      const screenX = this.gridToScreen(x, 0).x.value;
      vertical.push(screenX);
    }
    return { horizontal, vertical };
  }
  // Animate zoom with smooth interpolation
  animateZoom(targetZoom, duration = 300) {
    const startZoom = this.zoom.value;
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.zoom.value = startZoom + (targetZoom - startZoom) * eased;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  // Pan the grid smoothly
  panBy(deltaX, deltaY) {
    this.pan.x.value += deltaX;
    this.pan.y.value += deltaY;
  }
  // Center the grid on a specific point
  centerOn(point) {
    const centerX = globalThis.innerWidth / 2;
    const centerY = globalThis.innerHeight / 2;
    this.pan.x.value = centerX - point.x.value;
    this.pan.y.value = centerY - point.y.value;
  }
}
class ReactiveOrientSystem {
  position;
  scale;
  rotation;
  skew;
  constructor() {
    this.position = vector2Ref(0, 0);
    this.scale = vector2Ref(1, 1);
    this.rotation = numberRef(0);
    this.skew = vector2Ref(0, 0);
  }
  // Generate CSS transform string reactively
  getTransformString() {
    return operated(
      [this.position.x, this.position.y, this.scale.x, this.scale.y, this.rotation, this.skew.x, this.skew.y],
      (x, y, sx, sy, rot, skx, sky) => `translate3d(${x.value}px, ${y.value}px, 0px) scale(${sx.value}, ${sy.value}) rotate(${rot.value}deg) skew(${skx.value}deg, ${sky.value}deg)`
    );
  }
  // Apply transformation to a point
  transformPoint(point) {
    let result = multiplyVector2D(point, this.scale);
    result = rotate2D(result, this.rotation);
    result = addVector2D(result, this.position);
    return result;
  }
  // Get inverse transformation for converting screen to local coordinates
  inverseTransformPoint(point) {
    let result = subtractVector2D(point, this.position);
    result = rotate2D(result, operated([this.rotation], (r) => -r.value));
    result = divideVector2D(result, this.scale);
    return result;
  }
  // Interpolate between two transformation states
  interpolateTo(target, progress) {
    const newSystem = new ReactiveOrientSystem();
    newSystem.position = addVector2D(
      multiplyVector2D(this.position, operated([numberRef(1), numberRef(progress)], (a, p) => a.value - p.value)),
      multiplyVector2D(target.position, numberRef(progress))
    );
    newSystem.scale = addVector2D(
      multiplyVector2D(this.scale, operated([numberRef(1), numberRef(progress)], (a, p) => a.value - p.value)),
      multiplyVector2D(target.scale, numberRef(progress))
    );
    newSystem.rotation = operated(
      [this.rotation, target.rotation, numberRef(progress)],
      (current, target2, p) => current.value + (target2.value - current.value) * p.value
    );
    return newSystem;
  }
  // Check if transformation is identity (no transformation applied)
  isIdentity() {
    return this.position.x.value === 0 && this.position.y.value === 0 && this.scale.x.value === 1 && this.scale.y.value === 1 && this.rotation.value === 0 && this.skew.x.value === 0 && this.skew.y.value === 0;
  }
  // Reset to identity transformation
  reset() {
    this.position.x.value = 0;
    this.position.y.value = 0;
    this.scale.x.value = 1;
    this.scale.y.value = 1;
    this.rotation.value = 0;
    this.skew.x.value = 0;
    this.skew.y.value = 0;
  }
  // Apply transformation relative to current state
  transformBy(translation, scale, rotation) {
    if (translation) {
      this.position = addVector2D(this.position, vector2Ref(translation[0], translation[1]));
    }
    if (scale) {
      this.scale = multiplyVector2D(this.scale, vector2Ref(scale[0], scale[1]));
    }
    if (rotation !== void 0) {
      this.rotation.value += rotation;
    }
  }
}
class ReactiveSpatialManager {
  elements = /* @__PURE__ */ new Map();
  viewport;
  constructor() {
    this.viewport = createRect2D(0, 0, globalThis.innerWidth, globalThis.innerHeight);
    globalThis.addEventListener("resize", () => {
      this.viewport.size.x.value = globalThis.innerWidth;
      this.viewport.size.y.value = globalThis.innerHeight;
    });
  }
  // Register an element with reactive bounds
  registerElement(element) {
    const rect = createRect2D(0, 0, 0, 0);
    this.elements.set(element, rect);
    this.updateElementBounds(element);
    return rect;
  }
  // Update element bounds reactively
  updateElementBounds(element) {
    const rect = this.elements.get(element);
    if (!rect) return;
    const bounds = element.getBoundingClientRect();
    rect.position.x.value = bounds.left;
    rect.position.y.value = bounds.top;
    rect.size.x.value = bounds.width;
    rect.size.y.value = bounds.height;
  }
  // Find elements that intersect with a point
  getElementsAtPoint(point) {
    const result = [];
    for (const [element, rect] of this.elements) {
      if (rectContainsPoint(rect, point).value) {
        result.push(element);
      }
    }
    return result;
  }
  // Find elements that intersect with a rectangle
  getElementsIntersectingRect(queryRect) {
    const result = [];
    for (const [element, rect] of this.elements) {
      if (rectIntersects(rect, queryRect).value) {
        result.push(element);
      }
    }
    return result;
  }
  // Get elements within viewport
  getVisibleElements() {
    return this.getElementsIntersectingRect(this.viewport);
  }
  // Calculate distance from point to nearest element
  getDistanceToNearestElement(point) {
    let minDistance = Infinity;
    for (const [element, rect] of this.elements) {
      const distance = pointToRectDistance(point, rect).value;
      minDistance = Math.min(minDistance, distance);
    }
    return minDistance;
  }
  // Constrain element to viewport
  constrainToViewport(element) {
    const rect = this.elements.get(element);
    if (!rect) return;
    rect.position.x.value = Math.max(0, Math.min(
      rect.position.x.value,
      this.viewport.size.x.value - rect.size.x.value
    ));
    rect.position.y.value = Math.max(0, Math.min(
      rect.position.y.value,
      this.viewport.size.y.value - rect.size.y.value
    ));
  }
}
class AdvancedSelectionManager {
  selection;
  // Would be SelectionController
  spatialManager;
  selectedElements = /* @__PURE__ */ new Set();
  constructor() {
    this.spatialManager = new ReactiveSpatialManager();
  }
  // Select elements within selection rectangle
  selectElementsInRect(selectionRect) {
    const intersectingElements = this.spatialManager.getElementsIntersectingRect(selectionRect);
    this.selectedElements.forEach((el) => el.classList.remove("selected"));
    this.selectedElements.clear();
    intersectingElements.forEach((el) => {
      el.classList.add("selected");
      this.selectedElements.add(el);
    });
  }
  // Get bounding box of all selected elements
  getSelectionBounds() {
    if (this.selectedElements.size === 0) return null;
    let union = null;
    for (const element of this.selectedElements) {
      const elementRect = this.spatialManager.registerElement(element);
      union = union ? {
        position: vector2Ref(
          Math.min(union.position.x.value, elementRect.position.x.value),
          Math.min(union.position.y.value, elementRect.position.y.value)
        ),
        size: vector2Ref(
          Math.max(
            union.position.x.value + union.size.x.value,
            elementRect.position.x.value + elementRect.size.x.value
          ) - Math.min(union.position.x.value, elementRect.position.x.value),
          Math.max(
            union.position.y.value + union.size.y.value,
            elementRect.position.y.value + elementRect.size.y.value
          ) - Math.min(union.position.y.value, elementRect.position.y.value)
        )
      } : elementRect;
    }
    return union;
  }
  // Move all selected elements by offset
  moveSelection(offset) {
    for (const element of this.selectedElements) {
      const rect = this.spatialManager.registerElement(element);
      rect.position.x.value += offset.x.value;
      rect.position.y.value += offset.y.value;
      element.style.transform = `translate(${rect.position.x.value}px, ${rect.position.y.value}px)`;
    }
  }
  // Scale selection around center
  scaleSelection(scale) {
    const bounds = this.getSelectionBounds();
    if (!bounds) return;
    const center = rectCenter(bounds);
    for (const element of this.selectedElements) {
      const rect = this.spatialManager.registerElement(element);
      const toCenter = subtractVector2D(rectCenter(rect), center);
      const scaledToCenter = multiplyVector2D(toCenter, numberRef(scale));
      const newCenter = addVector2D(center, scaledToCenter);
      const newSize = multiplyVector2D(rect.size, numberRef(scale));
      rect.position.x.value = newCenter.x.value - newSize.x.value / 2;
      rect.position.y.value = newCenter.y.value - newSize.y.value / 2;
      rect.size.x.value = newSize.x.value;
      rect.size.y.value = newSize.y.value;
      element.style.transform = `translate(${rect.position.x.value}px, ${rect.position.y.value}px)`;
      element.style.width = `${rect.size.x.value}px`;
      element.style.height = `${rect.size.y.value}px`;
    }
  }
}
class ReactiveCSSAnimation {
  element;
  transform;
  // Would be ReactiveTransform
  position;
  scale;
  rotation;
  progress;
  duration;
  startTime;
  constructor(element, duration = 1e3) {
    this.element = element;
    this.duration = duration;
    this.position = vector2Ref(0, 0);
    this.scale = vector2Ref(1, 1);
    this.rotation = numberRef(0);
    this.progress = numberRef(0);
    this.startTime = 0;
    this.bindToCSS();
  }
  bindToCSS() {
  }
  animateTo(targetPos, targetScale = vector2Ref(1, 1), targetRotation = 0) {
    const startPos = { x: this.position.x.value, y: this.position.y.value };
    const startScale = { x: this.scale.x.value, y: this.scale.y.value };
    const startRotation = this.rotation.value;
    this.startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - this.startTime;
      this.progress.value = Math.min(elapsed / this.duration, 1);
      const t = 1 - Math.pow(1 - this.progress.value, 3);
      this.position.x.value = startPos.x + (targetPos.x.value - startPos.x) * t;
      this.position.y.value = startPos.y + (targetPos.y.value - startPos.y) * t;
      this.scale.x.value = startScale.x + (targetScale.x.value - startScale.x) * t;
      this.scale.y.value = startScale.y.value + (targetScale.y.value - startScale.y) * t;
      this.rotation.value = startRotation + (targetRotation - startRotation) * t;
      if (this.progress.value < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  // Chain animations
  then() {
    return new Promise((resolve) => {
      const checkComplete = () => {
        if (this.progress.value >= 1) {
          resolve();
        } else {
          requestAnimationFrame(checkComplete);
        }
      };
      checkComplete();
    });
  }
}
class ReactiveCSSLayout {
  container;
  items;
  layoutType;
  spacing;
  itemSize;
  constructor(container, layoutType = "grid") {
    this.container = container;
    this.layoutType = layoutType;
    this.items = Array.from(container.children);
    this.spacing = numberRef(10);
    this.itemSize = vector2Ref(100, 100);
    this.setupReactiveLayout();
  }
  setupReactiveLayout() {
    const containerSize = new ReactiveElementSize(this.container);
    operated([containerSize.width, containerSize.height, this.spacing], () => {
      this.updateLayout();
    });
  }
  updateLayout() {
    const containerRect = this.container.getBoundingClientRect();
    switch (this.layoutType) {
      case "grid":
        this.updateGridLayout(containerRect);
        break;
      case "flex":
        this.updateFlexLayout(containerRect);
        break;
      case "absolute":
        this.updateAbsoluteLayout(containerRect);
        break;
    }
  }
  updateGridLayout(containerRect) {
    const cols = Math.floor((containerRect.width + this.spacing.value) / (this.itemSize.x.value + this.spacing.value));
    const rows = Math.ceil(this.items.length / cols);
    this.items.forEach((item, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * (this.itemSize.x.value + this.spacing.value);
      const y = row * (this.itemSize.y.value + this.spacing.value);
      item.style.position = "absolute";
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.width = `${this.itemSize.x.value}px`;
      item.style.height = `${this.itemSize.y.value}px`;
    });
  }
  updateFlexLayout(containerRect) {
    const totalSpacing = (this.items.length - 1) * this.spacing.value;
    const availableWidth = containerRect.width - totalSpacing;
    const itemWidth = availableWidth / this.items.length;
    this.items.forEach((item, index) => {
      const x = index * (itemWidth + this.spacing.value);
      item.style.position = "absolute";
      item.style.left = `${x}px`;
      item.style.top = "0px";
      item.style.width = `${itemWidth}px`;
      item.style.height = `${this.itemSize.y.value}px`;
    });
  }
  updateAbsoluteLayout(containerRect) {
    this.items.forEach((item, index) => {
      const angle = index / this.items.length * Math.PI * 2;
      const radius = Math.min(containerRect.width, containerRect.height) * 0.3;
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;
      const x = centerX + Math.cos(angle) * radius - this.itemSize.x.value / 2;
      const y = centerY + Math.sin(angle) * radius - this.itemSize.y.value / 2;
      item.style.position = "absolute";
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.width = `${this.itemSize.x.value}px`;
      item.style.height = `${this.itemSize.y.value}px`;
    });
  }
  // Reactively update item size
  setItemSize(width, height) {
    this.itemSize.x.value = width;
    this.itemSize.y.value = height;
    this.updateLayout();
  }
  // Reactively update spacing
  setSpacing(spacing) {
    this.spacing.value = spacing;
  }
  // Add reactive item
  addItem(item) {
    this.items.push(item);
    this.container.appendChild(item);
    this.updateLayout();
  }
  // Remove item reactively
  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      item.remove();
      this.updateLayout();
    }
  }
}
class ReactiveScrollAnimation {
  element;
  scroll;
  // Would be ReactiveScroll
  startOffset;
  endOffset;
  transform;
  // Would be ReactiveTransform
  constructor(element, startOffset = 0, endOffset = 1e3) {
    this.element = element;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.setupScrollAnimation();
  }
  setupScrollAnimation() {
  }
  // Update scroll range
  setScrollRange(start, end) {
    this.startOffset = start;
    this.endOffset = end;
  }
  // Add keyframe at specific scroll progress
  addKeyframe(progress, transform) {
  }
}

//"use strict";
// jsox.js
// JSOX JavaScript Object eXchange. Inherits human features of comments
// and extended formatting from JSON6; adds macros, big number and date
// support.  See README.md for details.
//
// This file is based off of https://github.com/JSON6/  ./lib/json6.js
// which is based off of https://github.com/d3x0r/sack  ./src/netlib/html5.websocket/json6_parser.c
//

//const util = require('util'); // debug inspect.
//import util from 'util'; 

const _JSON=JSON; // in case someone does something like JSON=JSOX; we still need a primitive _JSON for internal stringification
//if( "undefined" === typeof exports )
//	var exports = {};

/**
 * JSOX container for all JSOX methods.
 * @namespace
 */
const JSOX = {};
//const JSOX = (function ( JSOX ) {
JSOX.JSOX = JSOX;
JSOX.version = "1.2.125";

//const _DEBUG_LL = false;
//const _DEBUG_PARSING = false;
//const _DEBUG_STRINGIFY = false;
//const _DEBUG_PARSING_STACK = false;
//const _DEBUG_PARSING_NUMBERS = false;
//const _DEBUG_PARSING_DETAILS = false;
//const _DEBUG_PARSING_CONTEXT = false;
//const _DEBUG_REFERENCES = false; // this tracks folling context stack when the components have not been completed.
//const _DEBUG_WHITESPACE = false; 
const hasBigInt = (typeof BigInt === "function");
const testNonIdentifierCharacters = false; // maybe an option to enable; references otherwise unused table.
const VALUE_UNDEFINED = -1;
const VALUE_UNSET = 0;
const VALUE_NULL = 1;
const VALUE_TRUE = 2;
const VALUE_FALSE = 3;
const VALUE_STRING = 4;
const VALUE_NUMBER = 5;
const VALUE_OBJECT = 6;
const VALUE_NEG_NAN = 7;
const VALUE_NAN = 8;
const VALUE_NEG_INFINITY = 9;
const VALUE_INFINITY = 10;
//const VALUE_DATE = 11  // unused yet; this is actuall a subType of VALUE_NUMBER
const VALUE_EMPTY = 12; // [,] makes an array with 'empty item'
const VALUE_ARRAY = 13; //
// internally arrayType = -1 is a normal array
// arrayType = -2 is a reference array, which, which closed is resolved to
//     the specified object.
// arrayType = -3 is a normal array, that has already had this element pushed.
const knownArrayTypeNames = ["ab","u8","cu8","s8","u16","s16","u32","s32","u64","s64","f32","f64"];
let arrayToJSOX = null;
let mapToJSOX = null;
const knownArrayTypes = [ArrayBuffer
                        ,Uint8Array,Uint8ClampedArray,Int8Array
                        ,Uint16Array,Int16Array
                        ,Uint32Array,Int32Array
                        ,null,null//,Uint64Array,Int64Array
                        ,Float32Array,Float64Array];
// somehow max isn't used... it would be the NEXT available VALUE_XXX value...
//const VALUE_ARRAY_MAX = VALUE_ARRAY + knownArrayTypes.length + 1; // 1 type is not typed; just an array.

const WORD_POS_RESET = 0;
const WORD_POS_TRUE_1 = 1;
const WORD_POS_TRUE_2 = 2;
const WORD_POS_TRUE_3 = 3;
const WORD_POS_FALSE_1 = 5;
const WORD_POS_FALSE_2 = 6;
const WORD_POS_FALSE_3 = 7;
const WORD_POS_FALSE_4 = 8;
const WORD_POS_NULL_1 = 9;
const WORD_POS_NULL_2 = 10;
const WORD_POS_NULL_3 = 11;
const WORD_POS_UNDEFINED_1 = 12;
const WORD_POS_UNDEFINED_2 = 13;
const WORD_POS_UNDEFINED_3 = 14;
const WORD_POS_UNDEFINED_4 = 15;
const WORD_POS_UNDEFINED_5 = 16;
const WORD_POS_UNDEFINED_6 = 17;
const WORD_POS_UNDEFINED_7 = 18;
const WORD_POS_UNDEFINED_8 = 19;
const WORD_POS_NAN_1 = 20;
const WORD_POS_NAN_2 = 21;
const WORD_POS_INFINITY_1 = 22;
const WORD_POS_INFINITY_2 = 23;
const WORD_POS_INFINITY_3 = 24;
const WORD_POS_INFINITY_4 = 25;
const WORD_POS_INFINITY_5 = 26;
const WORD_POS_INFINITY_6 = 27;
const WORD_POS_INFINITY_7 = 28;

const WORD_POS_FIELD = 29;
const WORD_POS_AFTER_FIELD = 30;
const WORD_POS_END = 31;
const WORD_POS_AFTER_FIELD_VALUE = 32;
//const WORD_POS_BINARY = 32;

const CONTEXT_UNKNOWN = 0;
const CONTEXT_IN_ARRAY = 1;
const CONTEXT_OBJECT_FIELD = 2;
const CONTEXT_OBJECT_FIELD_VALUE = 3;
const CONTEXT_CLASS_FIELD = 4;
const CONTEXT_CLASS_VALUE = 5;
const CONTEXT_CLASS_FIELD_VALUE = 6;
const keywords = {	["true"]:true,["false"]:false,["null"]:null,["NaN"]:NaN,["Infinity"]:Infinity,["undefined"]:undefined };

/**
 * Extend Date type with a nanosecond field.
 * @constructor
 * @param {Date} original_date
 * @param {Number} nanoseconds in milli-seconds of Date ( 0 to 1_000_000 )
 */
class DateNS extends Date {
	constructor(a,b ) {
		super(a);
		this.ns = b||0;
	}	
}

JSOX.DateNS = DateNS;

const contexts = [];
/**
 * get a context from stack (reuse contexts)
 * @internal
 */
function getContext() {
	let ctx = contexts.pop();
	if( !ctx )
		ctx = { context : CONTEXT_UNKNOWN
		      , current_proto : null
		      , current_class : null
		      , current_class_field : 0
		      , arrayType : -1
		      , valueType : VALUE_UNSET
		      , elements : null
		      };
	return ctx;
}
/**
 * return a context to the stack (reuse contexts)
 * @internal
 */
function dropContext(ctx) { 
	contexts.push( ctx ); 
}

/**
 * SACK jsox compatibility; hands maps to internal C++ code in other case.
 * @internal
 */
JSOX.updateContext = function() {
    //if( toProtoTypes.get( Map.prototype ) ) return;
    //console.log( "Do init protoypes for new context objects..." );
    //initPrototypes();
};

const buffers = [];
function getBuffer() { let buf = buffers.pop(); if( !buf ) buf = { buf:null, n:0 }; else buf.n = 0; return buf; }
function dropBuffer(buf) { buffers.push( buf ); }

/**
 * Provide minimal escapes for a string to be encapsulated as a JSOX string in quotes.
 *
 * @param {string} string 
 * @returns {string}
 */
JSOX.escape = function(string) {
	let n;
	let output = '';
	if( !string ) return string;
	for( n = 0; n < string.length; n++ ) {
		if( ( string[n] == '"' ) || ( string[n] == '\\' ) || ( string[n] == '`' )|| ( string[n] == '\'' )) {
			output += '\\';
		}
		output += string[n];
	}
	return output;
};


let toProtoTypes = new WeakMap();
let toObjectTypes = new Map();
let fromProtoTypes = new Map();
let commonClasses = [];

/**
 * reset JSOX parser entirely; clears all type mappings
 *
 * @returns {void}
 */
JSOX.reset = function() {
	toProtoTypes = new WeakMap();
	toObjectTypes = new Map();
	fromProtoTypes = new Map();
	commonClasses = [];	
};

/**
 * Create a streaming parser.  Add data with parser.write(data); values that
 * are found are dispatched to the callback.
 *
 * @param {(value:any) => void} [cb]
 * @param {(this: any, key: string, value: any) => any} [reviver] 
 * @returns {JSOXParser}
*/
JSOX.begin = function( cb, reviver ) {

	const val = { name : null,	  // name of this value (if it's contained in an object)
			value_type: VALUE_UNSET, // value from above indiciating the type of this value
			string : '',   // the string value of this value (strings and number types only)
			contains : null,
			className : null,
		};
	
	const pos = { line:1, col:1 };
	let	n = 0;
	let     str;
	let	localFromProtoTypes = new Map();
	let	word = WORD_POS_RESET,
		status = true,
		redefineClass = false,
		negative = false,
		result = null,
		rootObject = null,
		elements = undefined,
		context_stack = {
			first : null,
			last : null,
			saved : null,
			push(node) {
				//_DEBUG_PARSING_CONTEXT && console.log( "pushing context:", node );
				let recover = this.saved;
				if( recover ) { this.saved = recover.next; 
					recover.node = node; 
					recover.next = null; 
					recover.prior = this.last; }
				else { recover = { node : node, next : null, prior : this.last }; }
				if( !this.last ) this.first = recover;
				else this.last.next = recover;
				this.last = recover;
				this.length++;
			},
			pop() {
				let result = this.last;
				// through normal usage this line can never be used.
				//if( !result ) return null;
				if( !(this.last = result.prior ) ) this.first = null;
				result.next = this.saved;
				if( this.last ) this.last.next = null;
				if( !result.next ) result.first = null;
				this.saved = result;
				this.length--;
				//_DEBUG_PARSING_CONTEXT && console.log( "popping context:", result.node );
				return result.node;
			},
			length : 0,
			/*dump() {  // //_DEBUG_CONTEXT_STACK
				console.log( "STACK LENGTH:", this.length );
				let cur= this.first;
				let level = 0;
				while( cur ) {
					console.log( "Context:", level, cur.node );
					level++;
					cur = cur.next;
				}
			}*/
		},
		classes = [],  // class templates that have been defined.
		protoTypes = {},
		current_proto = null,  // the current class being defined or being referenced.
		current_class = null,  // the current class being defined or being referenced.
		current_class_field = 0,
		arrayType = -1,  // the current class being defined or being referenced.
		parse_context = CONTEXT_UNKNOWN,
		comment = 0,
		fromHex = false,
		decimal = false,
		exponent = false,
		exponent_sign = false,
		exponent_digit = false,
		inQueue = {
			first : null,
			last : null,
			saved : null,
			push(node) {
				let recover = this.saved;
				if( recover ) { this.saved = recover.next; recover.node = node; recover.next = null; recover.prior = this.last; }
				else { recover = { node : node, next : null, prior : this.last }; }
				if( !this.last ) this.first = recover;
				else this.last.next = recover;
				this.last = recover;
			},
			shift() {
				let result = this.first;
				if( !result ) return null;
				if( !(this.first = result.next ) ) this.last = null;
				result.next = this.saved; this.saved = result;
				return result.node;
			},
			unshift(node) {
				let recover = this.saved;
				// this is always true in this usage.
				//if( recover ) { 
					this.saved = recover.next; recover.node = node; recover.next = this.first; recover.prior = null; 
				//}
				//else { recover = { node : node, next : this.first, prior : null }; }
				if( !this.first ) this.last = recover;
				this.first = recover;
			}
		},
		gatheringStringFirstChar = null,
		gatheringString = false,
		gatheringNumber = false,
		stringEscape = false,
		cr_escaped = false,
		unicodeWide = false,
		stringUnicode = false,
		stringHex = false,
		hex_char = 0,
		hex_char_len = 0,
		completed = false,
		date_format = false,
		isBigInt = false
		;

	function throwEndError( leader ) {
		throw new Error( `${leader} at ${n} [${pos.line}:${pos.col}]`);
	}

	return {
		/**
		 * Define a class that can be used to deserialize objects of this type.
		 * @param {string} prototypeName 
		 * @param {new ():any} o 
		 * @param {(any)=>any} f 
		 */
		fromJSOX( prototypeName, o, f ) {
			if( localFromProtoTypes.get(prototypeName) ) throw new Error( "Existing fromJSOX has been registered for prototype" );
			function privateProto() { }
			if( !o ) o = privateProto;
			if( o && !("constructor" in o )){
				throw new Error( "Please pass a prototype like thing...");
			}
			localFromProtoTypes.set( prototypeName, { protoCon:o.prototype.constructor, cb:f } );
		},
		registerFromJSOX( prototypeName, o/*, f*/ ) {
			throw new Error( "registerFromJSOX is deprecated, please update to use fromJSOX instead:" + prototypeName + o.toString() );
		},
		finalError() {
			if( comment !== 0 ) { // most of the time everything's good.
				if( comment === 1 ) throwEndError( "Comment began at end of document" );
				if( comment === 2 ) /*console.log( "Warning: '//' comment without end of line ended document" )*/;
				if( comment === 3 ) throwEndError( "Open comment '/*' is missing close at end of document" );
				if( comment === 4 ) throwEndError( "Incomplete '/* *' close at end of document" );
			}
			if( gatheringString ) throwEndError( "Incomplete string" );
		},
		value() {
			this.finalError();
			let r = result;
			result = undefined;
			return r;
		},
		/**
		 * Reset the parser to a blank state.
		 */
		reset() {
			word = WORD_POS_RESET;
			status = true;
			if( inQueue.last ) inQueue.last.next = inQueue.save;
			inQueue.save = inQueue.first;
			inQueue.first = inQueue.last = null;
			if( context_stack.last ) context_stack.last.next = context_stack.save;
			context_stack.length = 0;
			context_stack.save = inQueue.first;
			context_stack.first = context_stack.last = null;//= [];
			elements = undefined;
			parse_context = CONTEXT_UNKNOWN;
			classes = [];
			protoTypes = {};
			current_proto = null;
			current_class = null;
			current_class_field = 0;
			val.value_type = VALUE_UNSET;
			val.name = null;
			val.string = '';
			val.className = null;
			pos.line = 1;
			pos.col = 1;
			negative = false;
			comment = 0;
			completed = false;
			gatheringString = false;
			stringEscape = false;  // string stringEscape intro
			cr_escaped = false;   // carraige return escaped
			date_format = false;
			//stringUnicode = false;  // reading \u
			//unicodeWide = false;  // reading \u{} in string
			//stringHex = false;  // reading \x in string
		},
		usePrototype(className,protoType ) { protoTypes[className] = protoType; },
		/**
		 * Add input to the parser to get parsed.
		 * @param {string} msg 
		 */
		write(msg) {
			let retcode;
			if (typeof msg !== "string" && typeof msg !== "undefined") msg = String(msg);
			if( !status ) throw new Error( "Parser is still in an error state, please reset before resuming" );
			for( retcode = this._write(msg,false); retcode > 0; retcode = this._write() ) {
				if( typeof reviver === 'function' ) (function walk(holder, key) {
					let k, v, value = holder[key];
					if (value && typeof value === 'object') {
						for (k in value) {
							if (Object.prototype.hasOwnProperty.call(value, k)) {
								v = walk(value, k);
								if (v !== undefined) {
									value[k] = v;
								} else {
									delete value[k];
								}
							}
						}
					}
					return reviver.call(holder, key, value);
				}({'': result}, ''));
				result = cb( result );

				if( retcode < 2 )
					break;
			}
		},
		/**
		 * Parse a string and return the result.
		 * @template T
		 * @param {string} msg
		 * @param {(key:string,value:any)=>any} [reviver]
		 * @returns {T}
		 */
		parse(msg,reviver) {
			if (typeof msg !== "string") msg = String(msg);
			this.reset();
			const writeResult = this._write( msg, true );
			if( writeResult > 0 ) {
				if( writeResult > 1 ){
					// probably a carriage return.
					//console.log( "Extra data at end of message");
				}
				let result = this.value();
				if( ( "undefined" === typeof result ) && writeResult > 1 ){
					throw new Error( "Pending value could not complete");
				}
	                
				result = typeof reviver === 'function' ? (function walk(holder, key) {
					let k, v, value = holder[key];
					if (value && typeof value === 'object') {
						for (k in value) {
							if (Object.prototype.hasOwnProperty.call(value, k)) {
								v = walk(value, k);
								if (v !== undefined) {
									value[k] = v;
								} else {
									delete value[k];
								}
							}
						}
					}
					return reviver.call(holder, key, value);
				}({'': result}, '')) : result;
				return result;
			}
			this.finalError();
			return undefined;

			
			return this.write(msg );
		},
		_write(msg,complete_at_end) {
			let cInt;
			let input;
			let buf;
			let retval = 0;
			function throwError( leader, c ) {
				throw new Error( `${leader} '${String.fromCodePoint( c )}' unexpected at ${n} (near '${buf.substr(n>4?(n-4):0,n>4?3:(n-1))}[${String.fromCodePoint( c )}]${buf.substr(n, 10)}') [${pos.line}:${pos.col}]`);
			}

			function RESET_VAL()  {
				val.value_type = VALUE_UNSET;
				val.string = '';
				val.contains = null;
				//val.className = null;
			}

			function convertValue() {
				let fp = null;
				//_DEBUG_PARSING && console.log( "CONVERT VAL:", val );
				switch( val.value_type ){
				case VALUE_NUMBER:
					//1502678337047
					if( ( ( val.string.length > 13 ) || ( val.string.length == 13 && val[0]>'2' ) )
					    && !date_format && !exponent_digit && !exponent_sign && !decimal ) {
						isBigInt = true;
					}
					if( isBigInt ) { if( hasBigInt ) return BigInt(val.string); else throw new Error( "no builtin BigInt()", 0 ) }
					if( date_format ) { 
						const r = val.string.match(/\.(\d\d\d\d*)/ );
						const frac = ( r )?( r )[1]:null;
						if( !frac || (frac.length < 4) ) {
							const r = new Date( val.string ); 
							if(isNaN(r.getTime())) throwError( "Bad Date format", cInt ); return r;  
						} else {
							let ns = frac.substr( 3 );
							while( ns.length < 6 ) ns = ns+'0';
							const r = new DateNS( val.string, Number(ns ) ); 
							if(isNaN(r.getTime())) throwError( "Bad DateNS format" + r+r.getTime(), cInt ); return r;  
						}
						//const r = new Date( val.string ); if(isNaN(r.getTime())) throwError( "Bad number format", cInt ); return r;  
					}
					return  (negative?-1:1) * Number( val.string );
				case VALUE_STRING:
					if( val.className ) {
						fp = localFromProtoTypes.get( val.className );
						if( !fp )
							fp = fromProtoTypes.get( val.className );
						if( fp && fp.cb ) {
							val.className = null;
							return fp.cb.call( val.string );
						} else {
							// '[object Object]' throws this error.
							throw new Error( "Double string error, no constructor for: new " + val.className + "("+val.string+")" )
						}	
					}
					return val.string;
				case VALUE_TRUE:
					return true;
				case VALUE_FALSE:
					return false;
				case VALUE_NEG_NAN:
					return -NaN;
				case VALUE_NAN:
					return NaN;
				case VALUE_NEG_INFINITY:
					return -Infinity;
				case VALUE_INFINITY:
					return Infinity;
				case VALUE_NULL:
					return null;
				case VALUE_UNDEFINED:
					return undefined;
				case VALUE_EMPTY:
					return undefined;
				case VALUE_OBJECT:
					if( val.className ) { 
						//_DEBUG_PARSING_DETAILS && console.log( "class reviver" );
						fp = localFromProtoTypes.get( val.className );
						if( !fp )
							fp = fromProtoTypes.get( val.className );
						val.className = null;
						if( fp && fp.cb ) return val.contains = fp.cb.call( val.contains ); 
					}
					return val.contains;
				case VALUE_ARRAY:
					//_DEBUG_PARSING_DETAILS && console.log( "Array conversion:", arrayType, val.contains );
					if( arrayType >= 0 ) {
						let ab;
						if( val.contains.length )
							ab = DecodeBase64( val.contains[0] );
						else ab = DecodeBase64( val.string );
						if( arrayType === 0 ) {
							arrayType = -1;
							return ab;
						} else {
							const newab = new knownArrayTypes[arrayType]( ab );
							arrayType = -1;
							return newab;
						}
					} else if( arrayType === -2 ) {
						let obj = rootObject;
						//let ctx = context_stack.first;
						let lvl;
						//console.log( "Resolving Reference...", context_stack.length );
						//console.log( "--elements and array", elements );
						
						const pathlen = val.contains.length;
						for( lvl = 0; lvl < pathlen; lvl++ ) {
							const idx = val.contains[lvl];
							//_DEBUG_REFERENCES && console.log( "Looking up idx:", idx, "of", val.contains, "in", obj );
							let nextObj = obj[idx];

							//_DEBUG_REFERENCES  && console.log( "Resolve path:", lvl, idx,"in", obj, context_stack.length, val.contains.toString() );
							//_DEBUG_REFERENCES && console.log( "NEXT OBJECT:", nextObj );
							if( !nextObj ) {
								{
									let ctx = context_stack.first;
									let p = 0;
									//_DEBUG_PARSING_CONTEXT && context_stack.dump();
									while( ctx && p < pathlen && p < context_stack.length ) {
										const thisKey = val.contains[p];
										if( !ctx.next || thisKey !== ctx.next.node.name ) {
											break;  // can't follow context stack any further.... 
										}
										//_DEBUG_REFERENCES && console.log( "Checking context:", obj, "p=",p, "key=",thisKey, "ctx(and .next)=",util.inspect(ctx));
										//console.dir(ctx, { depth: null })
										if( ctx.next ) {
											if( "number" === typeof thisKey ) {
												const actualObject = ctx.next.node.elements;
												//_DEBUG_REFERENCES && console.log( "Number in index... tracing stack...", obj, actualObject, ctx && ctx.next && ctx.next.next && ctx.next.next.node );

												if( actualObject && thisKey >= actualObject.length ) {
													//_DEBUG_REFERENCES && console.log( "AT ", p, actualObject.length, val.contains.length );
													if( p === (context_stack.length-1) ) {
														//_DEBUG_REFERENCES && 
																console.log( "This is actually at the current object so use that", p, val.contains, elements );
														nextObj = elements;
														p++;
														
														ctx = ctx.next;
														break;
													}
													else {
															//_DEBUG_REFERENCES && console.log( "is next... ", thisKey, actualObject.length )
														if( ctx.next.next && thisKey === actualObject.length ) {
															//_DEBUG_REFERENCES && console.log( "is next... ")
															nextObj = ctx.next.next.node.elements;
															ctx = ctx.next;
															p++;
															obj = nextObj;
															continue;
														}
														//_DEBUG_REFERENCES && console.log( "FAILING HERE", ctx.next, ctx.next.next, elements, obj );
														//_DEBUG_REFERENCES && console.log( "Nothing after, so this is just THIS?" );
														nextObj = elements;
														p++; // make sure to exit.

														break;
														//obj = next
													}
												}
											} else {
												//_DEBUG_REFERENCES && console.log( "field AT index", p,"of", val.contains.length );
												if( thisKey !== ctx.next.node.name ){
													//_DEBUG_REFERENCES && console.log( "Expect:", thisKey, ctx.next.node.name, ctx.next.node.elements );
													nextObj = ( ctx.next.node.elements[thisKey] );
													//throw new Error( "Unexpected path-context relationship" );													
													lvl = p;
													break;
												} else {
													//_DEBUG_REFERENCES && console.log( "Updating next object(NEW) to", ctx.next.node, elements, thisKey)
													if( ctx.next.next )
														nextObj = ctx.next.next.node.elements;
													else {
														//_DEBUG_REFERENCES && console.log( "Nothing after, so this is just THIS?" );
														nextObj = elements;
													}
													//_DEBUG_REFERENCES && console.log( "using named element from", ctx.next.node.elements, "=", nextObj )
												}
											}
											//if( //_DEBUG_REFERENCES )  {
											//	const a = ctx.next.node.elements;
											//	console.log( "Stack Dump:"
											//		, a?a.length:a
											//		, ctx.next.node.name
											//		, thisKey
											//		);
											//}
										} else {
											nextObj = nextObj[thisKey];
										}
										//_DEBUG_REFERENCES && console.log( "Doing next context??", p, context_stack.length, val.contains.length );
										ctx = ctx.next;
										p++;
									}
									//_DEBUG_REFERENCES && console.log( "Done with context stack...level", lvl, "p", p );
									if( p < pathlen )
										lvl = p-1;
									else lvl = p;
								}
								//_DEBUG_REFERENCES && console.log( "End of processing level:", lvl );
							}
							if( ("object" === typeof nextObj ) && !nextObj ) {
								throw new Error( "Path did not resolve properly:" +  val.contains + " at " + idx + '(' + lvl + ')' );
							}
							obj = nextObj;
						}
						//_DEBUG_PARSING && console.log( "Resulting resolved object:", obj );
						//_DEBUG_PARSING_DETAILS && console.log( "SETTING MODE TO -3 (resolved -2)" );
						arrayType = -3;
						return obj;
					}
					if( val.className ) { 
						fp = localFromProtoTypes.get( val.className );
						if( !fp )
							fp = fromProtoTypes.get( val.className );
						val.className = null; 
						if( fp && fp.cb ) return fp.cb.call( val.contains ); 
					}
					return val.contains;
				default:
					console.log( "Unhandled value conversion.", val );
					break;
				}
			}

			function arrayPush() {
				//_DEBUG_PARSING && console.log( "PUSH TO ARRAY:", val );
				if( arrayType == -3 )  {
					//_DEBUG_PARSING && console.log(" Array type -3?", val.value_type, elements );
					if( val.value_type === VALUE_OBJECT ) {
						elements.push( val.contains );
					}
					arrayType = -1; // next one should be allowed?
					return;
				} //else
				//	console.log( "Finally a push that's not already pushed!", );
				switch( val.value_type ){
				case VALUE_EMPTY:
					elements.push( undefined );
					delete elements[elements.length-1];
					break;
				default:
					elements.push( convertValue() );
					break;
				}
				RESET_VAL();
			}

			function objectPush() {
				if( arrayType === -3 && val.value_type === VALUE_ARRAY ) {
					//console.log( "Array has already been set in object." );
					//elements[val.name] = val.contains;
					RESET_VAL();
					arrayType = -1;
					return;
				}
				if( val.value_type === VALUE_EMPTY ) return;
				if( !val.name && current_class ) {
					//_DEBUG_PARSING_DETAILS && console.log( "A Stepping current class field:", current_class_field, val.name );
					val.name = current_class.fields[current_class_field++];
				}
				let value = convertValue();

				if( current_proto && current_proto.protoDef && current_proto.protoDef.cb ) {
					//_DEBUG_PARSING_DETAILS && console.log( "SOMETHING SHOULD AHVE BEEN REPLACED HERE??", current_proto );
					//_DEBUG_PARSING_DETAILS && console.log( "(need to do fromprototoypes here) object:", val, value );
					value = current_proto.protoDef.cb.call( elements, val.name, value );
					if( value ) elements[val.name] = value;
					//elements = new current_proto.protoCon( elements );
				}else {
				        //_DEBUG_PARSING_DETAILS && console.log( "Default no special class reviver", val.name, value );
					elements[val.name] = value;
				}
				//_DEBUG_PARSING_DETAILS && console.log( "Updated value:", current_class_field, val.name, elements[val.name] );
			
				//_DEBUG_PARSING && console.log( "+++ Added object field:", val.name, elements, elements[val.name], rootObject );
				RESET_VAL();
			}

			function recoverIdent(cInt) {
				//_DEBUG_PARSING&&console.log( "Recover Ident char:", cInt, val, String.fromCodePoint(cInt), "word:", word );
				if( word !== WORD_POS_RESET ) {
					if( negative ) { 
						//val.string += "-"; negative = false; 
						throwError( "Negative outside of quotes, being converted to a string (would lose count of leading '-' characters)", cInt );
					}
					switch( word ) {
					case WORD_POS_END:
						switch( val.value_type ) {
						case VALUE_TRUE:  val.string += "true"; break
						case VALUE_FALSE:  val.string += "false"; break
						case VALUE_NULL:  val.string += "null"; break
						case VALUE_INFINITY:  val.string += "Infinity"; break
						case VALUE_NEG_INFINITY:  val.string += "-Infinity"; throwError( "Negative outside of quotes, being converted to a string", cInt ); break
						case VALUE_NAN:  val.string += "NaN"; break
						case VALUE_NEG_NAN:  val.string += "-NaN"; throwError( "Negative outside of quotes, being converted to a string", cInt ); break
						case VALUE_UNDEFINED:  val.string += "undefined"; break
						case VALUE_STRING: break;
						case VALUE_UNSET: break;
						default:
							console.log( "Value of type " + val.value_type + " is not restored..." );
						}
						break;
					case WORD_POS_TRUE_1 :  val.string += "t"; break;
					case WORD_POS_TRUE_2 :  val.string += "tr"; break;
					case WORD_POS_TRUE_3 : val.string += "tru"; break;
					case WORD_POS_FALSE_1 : val.string += "f"; break;
					case WORD_POS_FALSE_2 : val.string += "fa"; break;
					case WORD_POS_FALSE_3 : val.string += "fal"; break;
					case WORD_POS_FALSE_4 : val.string += "fals"; break;
					case WORD_POS_NULL_1 : val.string += "n"; break;
					case WORD_POS_NULL_2 : val.string += "nu"; break;
					case WORD_POS_NULL_3 : val.string += "nul"; break;
					case WORD_POS_UNDEFINED_1 : val.string += "u"; break;
					case WORD_POS_UNDEFINED_2 : val.string += "un"; break;
					case WORD_POS_UNDEFINED_3 : val.string += "und"; break;
					case WORD_POS_UNDEFINED_4 : val.string += "unde"; break;
					case WORD_POS_UNDEFINED_5 : val.string += "undef"; break;
					case WORD_POS_UNDEFINED_6 : val.string += "undefi"; break;
					case WORD_POS_UNDEFINED_7 : val.string += "undefin"; break;
					case WORD_POS_UNDEFINED_8 : val.string += "undefine"; break;
					case WORD_POS_NAN_1 : val.string += "N"; break;
					case WORD_POS_NAN_2 : val.string += "Na"; break;
					case WORD_POS_INFINITY_1 : val.string += "I"; break;
					case WORD_POS_INFINITY_2 : val.string += "In"; break;
					case WORD_POS_INFINITY_3 : val.string += "Inf"; break;
					case WORD_POS_INFINITY_4 : val.string += "Infi"; break;
					case WORD_POS_INFINITY_5 : val.string += "Infin"; break;
					case WORD_POS_INFINITY_6 : val.string += "Infini"; break;
					case WORD_POS_INFINITY_7 : val.string += "Infinit"; break;
					case WORD_POS_RESET : break;
					case WORD_POS_FIELD : break;
					case WORD_POS_AFTER_FIELD:
					    //throwError( "String-keyword recovery fail (after whitespace)", cInt);
					    break;
					case WORD_POS_AFTER_FIELD_VALUE:
					    throwError( "String-keyword recovery fail (after whitespace)", cInt );
					    break;
					default:
						//console.log( "Word context: " + word + " unhandled" );
					}
					val.value_type = VALUE_STRING;									
					if( word < WORD_POS_FIELD)
					    word = WORD_POS_END;
				} else {
					word = WORD_POS_END;
					//if( val.value_type === VALUE_UNSET && val.string.length )
						val.value_type = VALUE_STRING;
				}
				if( cInt == 123/*'{'*/ )
					openObject();
				else if( cInt == 91/*'['*/ )
					openArray();
				else if( cInt == 44/*','*/ ) {
					// comma separates the string, it gets consumed.
				} else {
					// ignore white space.
					if( cInt == 32/*' '*/ || cInt == 13 || cInt == 10 || cInt == 9 || cInt == 0xFEFF || cInt == 0x2028 || cInt == 0x2029 ) {
						//_DEBUG_WHITESPACE && console.log( "IGNORE WHITESPACE" );
						return;
					}

					if( cInt == 44/*','*/ || cInt == 125/*'}'*/ || cInt == 93/*']'*/ || cInt == 58/*':'*/ )
						;// just don't add these, they are the next token that caused a revive to happen
					else //if( typeof cInt === "number")
						val.string += str;
				}
				//console.log( "VAL STRING IS:", val.string, str );
			}

			// gather a string from an input stream; start_c is the opening quote to find a related close quote.
			function gatherString( start_c ) {
				let retval = 0;
				while( retval == 0 && ( n < buf.length ) ) {
					str = buf.charAt(n);
					let cInt = buf.codePointAt(n++);
					if( cInt >= 0x10000 ) { str += buf.charAt(n); n++; }
					//console.log( "gathering....", stringEscape, str, cInt, unicodeWide, stringHex, stringUnicode, hex_char_len );
					pos.col++;
					if( cInt == start_c ) { //( cInt == 34/*'"'*/ ) || ( cInt == 39/*'\''*/ ) || ( cInt == 96/*'`'*/ ) )
						if( stringEscape ) { 
							if( stringHex )
								throwError( "Incomplete hexidecimal sequence", cInt );
							else if( stringUnicode )
								throwError( "Incomplete long unicode sequence", cInt );
							else if( unicodeWide )
								throwError( "Incomplete unicode sequence", cInt );
							if( cr_escaped ) {
								cr_escaped = false;
								retval = 1; // complete string, escaped \r
							} else val.string += str;
							stringEscape = false; }
						else {
							// quote matches, and is not processing an escape sequence.
							retval = 1;
						}
					}

					else if( stringEscape ) {
						if( unicodeWide ) {
							if( cInt == 125/*'}'*/ ) {
								val.string += String.fromCodePoint( hex_char );
								unicodeWide = false;
								stringUnicode = false;
								stringEscape = false;
								continue;
							}
							hex_char *= 16;
							if( cInt >= 48/*'0'*/ && cInt <= 57/*'9'*/ )      hex_char += cInt - 0x30;
							else if( cInt >= 65/*'A'*/ && cInt <= 70/*'F'*/ ) hex_char += ( cInt - 65 ) + 10;
							else if( cInt >= 97/*'a'*/ && cInt <= 102/*'f'*/ ) hex_char += ( cInt - 97 ) + 10;
							else {
								throwError( "(escaped character, parsing hex of \\u)", cInt );
								retval = -1;
								unicodeWide = false;
								stringEscape = false;
								continue;
							}
							continue;
						}
						else if( stringHex || stringUnicode ) {
							if( hex_char_len === 0 && cInt === 123/*'{'*/ ) {
								unicodeWide = true;
								continue;
							}
							if( hex_char_len < 2 || ( stringUnicode && hex_char_len < 4 ) ) {
								hex_char *= 16;
								if( cInt >= 48/*'0'*/ && cInt <= 57/*'9'*/ )      hex_char += cInt - 0x30;
								else if( cInt >= 65/*'A'*/ && cInt <= 70/*'F'*/ ) hex_char += ( cInt - 65 ) + 10;
								else if( cInt >= 97/*'a'*/ && cInt <= 102/*'f'*/ ) hex_char += ( cInt - 97 ) + 10;
								else {
									throwError( stringUnicode?"(escaped character, parsing hex of \\u)":"(escaped character, parsing hex of \\x)", cInt );
									retval = -1;
									stringHex = false;
									stringEscape = false;
									continue;
								}
								hex_char_len++;
								if( stringUnicode ) {
									if( hex_char_len == 4 ) {
										val.string += String.fromCodePoint( hex_char );
										stringUnicode = false;
										stringEscape = false;
									}
								}
								else if( hex_char_len == 2 ) {
									val.string += String.fromCodePoint( hex_char );
									stringHex = false;
									stringEscape = false;
								}
								continue;
							}
						}
						switch( cInt ) {
						case 13/*'\r'*/:
							cr_escaped = true;
							pos.col = 1;
							continue;
						case 0x2028: // LS (Line separator)
						case 0x2029: // PS (paragraph separate)
							pos.col = 1;
							// falls through
						case 10/*'\n'*/:
							if( !cr_escaped ) { // \\ \n
								pos.col = 1;
							} else { // \\ \r \n
								cr_escaped = false;
							}
							pos.line++;
							break;
						case 116/*'t'*/:
							val.string += '\t';
							break;
						case 98/*'b'*/:
							val.string += '\b';
							break;
						case 110/*'n'*/:
							val.string += '\n';
							break;
						case 114/*'r'*/:
							val.string += '\r';
							break;
						case 102/*'f'*/:
							val.string += '\f';
							break;
						case 118/*'v'*/:
							val.string += '\v';
							break;
						case 48/*'0'*/: 
							val.string += '\0';
							break;
						case 120/*'x'*/:
							stringHex = true;
							hex_char_len = 0;
							hex_char = 0;
							continue;
						case 117/*'u'*/:
							stringUnicode = true;
							hex_char_len = 0;
							hex_char = 0;
							continue;
						//case 47/*'/'*/:
						//case 92/*'\\'*/:
						//case 34/*'"'*/:
						//case 39/*"'"*/:
						//case 96/*'`'*/:
						default:
							val.string += str;
							break;
						}
						//console.log( "other..." );
						stringEscape = false;
					}
					else if( cInt === 92/*'\\'*/ ) {
						if( stringEscape ) {
							val.string += '\\';
							stringEscape = false;
						}
						else {
							stringEscape = true;
							hex_char = 0;
							hex_char_len = 0;
						}
					}
					else { /* any other character */
						if( cr_escaped ) {
							// \\ \r <any char>
							cr_escaped = false;
							pos.line++;
							pos.col = 2; // this character is pos 1; and increment to be after it.
						}
						val.string += str;
					}
				}
				return retval;
			}

			// gather a number from the input stream.
			function collectNumber() {
				let _n;
				while( (_n = n) < buf.length ) {
					str = buf.charAt(_n);
					let cInt = buf.codePointAt(n++);
					if( cInt >= 256 ) { 
							pos.col -= n - _n;
							n = _n; // put character back in queue to process.
							break;
					} else {
						//_DEBUG_PARSING_NUMBERS  && console.log( "in getting number:", n, cInt, String.fromCodePoint(cInt) );
						if( cInt == 95 /*_*/ )
							continue;
						pos.col++;
						// leading zeros should be forbidden.
						if( cInt >= 48/*'0'*/ && cInt <= 57/*'9'*/ ) {
							if( exponent ) {
								exponent_digit = true;
							}
							val.string += str;
						} else if( cInt == 45/*'-'*/ || cInt == 43/*'+'*/ ) {
							if( val.string.length == 0 || ( exponent && !exponent_sign && !exponent_digit ) ) {
								if( cInt == 45/*'-'*/ && !exponent ) negative = !negative;
								val.string += str;
								exponent_sign = true;
							} else {
								if( negative ) { val.string = '-' + val.string; negative = false; }
								val.string += str;
								date_format = true;
							}
						} else if( cInt == 78/*'N'*/ ) {
							if( word == WORD_POS_RESET ) {
								gatheringNumber = false;
								word = WORD_POS_NAN_1;
								return;
							}
							throwError( "fault while parsing number;", cInt );
							break;
						} else if( cInt == 73/*'I'*/ ) {
							if( word == WORD_POS_RESET ) {
								gatheringNumber = false;
								word = WORD_POS_INFINITY_1;
								return;
							}
							throwError( "fault while parsing number;", cInt );
							break;
						} else if( cInt == 58/*':'*/ && date_format ) {
							if( negative ) { val.string = '-' + val.string; negative = false; }
							val.string += str;
							date_format = true;
						} else if( cInt == 84/*'T'*/ && date_format ) {
							if( negative ) { val.string = '-' + val.string; negative = false; }
							val.string += str;
							date_format = true;
						} else if( cInt == 90/*'Z'*/ && date_format ) {
							if( negative ) { val.string = '-' + val.string; negative = false; }
							val.string += str;
							date_format = true;
						} else if( cInt == 46/*'.'*/ ) {
							if( !decimal && !fromHex && !exponent ) {
								val.string += str;
								decimal = true;
							} else {
								status = false;
								throwError( "fault while parsing number;", cInt );
								break;
							}
						} else if( cInt == 110/*'n'*/ ) {
							isBigInt = true;
							break;
						} else if( fromHex && ( ( ( cInt >= 95/*'a'*/ ) && ( cInt <= 102/*'f'*/ ) ) ||
						           ( ( cInt >= 65/*'A'*/ ) && ( cInt <= 70/*'F'*/ ) ) ) ) {
							val.string += str;
						} else if( cInt == 120/*'x'*/ || cInt == 98/*'b'*/ || cInt == 111/*'o'*/
								|| cInt == 88/*'X'*/ || cInt == 66/*'B'*/ || cInt == 79/*'O'*/ ) {
							// hex conversion.
							if( !fromHex && val.string == '0' ) {
								fromHex = true;
								val.string += str;
							}
							else {
								status = false;
								throwError( "fault while parsing number;", cInt );
								break;
							}
						} else if( ( cInt == 101/*'e'*/ ) || ( cInt == 69/*'E'*/ ) ) {
							if( !exponent ) {
								val.string += str;
								exponent = true;
							} else {
								status = false;
								throwError( "fault while parsing number;", cInt );
								break;
							}
						} else {
							if( cInt == 32/*' '*/ || cInt == 13 || cInt == 10 || cInt == 9 || cInt == 47/*'/'*/ || cInt ==  35/*'#'*/
							 || cInt == 44/*','*/ || cInt == 125/*'}'*/ || cInt == 93/*']'*/
							 || cInt == 123/*'{'*/ || cInt == 91/*'['*/ || cInt == 34/*'"'*/ || cInt == 39/*'''*/ || cInt == 96/*'`'*/
							 || cInt == 58/*':'*/ ) {
								pos.col -= n - _n;
								n = _n; // put character back in queue to process.
								break;
							}
							else {
								if( complete_at_end ) {
									status = false;
									throwError( "fault while parsing number;", cInt );
								}
								break;
							}
						}
					}
				}
				if( (!complete_at_end) && n == buf.length ) {
					gatheringNumber = true;
				}
				else {
					gatheringNumber = false;
					val.value_type = VALUE_NUMBER;
					if( parse_context == CONTEXT_UNKNOWN ) {
						completed = true;
					}
				}
			}

			// begin parsing an object type
			function openObject() {
				let nextMode = CONTEXT_OBJECT_FIELD;
				let cls = null;
				let tmpobj = {};
				//_DEBUG_PARSING && console.log( "opening object:", val.string, val.value_type, word, parse_context );
				if( word > WORD_POS_RESET && word < WORD_POS_FIELD )
					recoverIdent( 123 /* '{' */ );
				let protoDef;
				protoDef = getProto(); // lookup classname using val.string and get protodef(if any)
				if( parse_context == CONTEXT_UNKNOWN ) {
					if( word == WORD_POS_FIELD /*|| word == WORD_POS_AFTER_FIELD*/ 
					   || word == WORD_POS_END
					     && ( protoDef || val.string.length ) ) {
							if( protoDef && protoDef.protoDef && protoDef.protoDef.protoCon ) {
								tmpobj = new protoDef.protoDef.protoCon();
							}
						if( !protoDef || !protoDef.protoDef && val.string ) // class creation is redundant...
						{
							cls = classes.find( cls=>cls.name===val.string );
							//console.log( "Probably creating the Macro-Tag here?", cls )
							if( !cls ) {
								/* eslint-disable no-inner-declarations */
								function privateProto() {} 
								// this just uses the tmpobj {} container to store the values collected for this class...
								// this does not generate the instance of the class.
								// if this tag type is also a prototype, use that prototype, else create a unique proto
								// for this tagged class type.
								classes.push( cls = { name : val.string
								, protoCon: (protoDef && protoDef.protoDef && protoDef.protoDef.protoCon) || privateProto.constructor
								 , fields : [] } );
								 nextMode = CONTEXT_CLASS_FIELD;
							} else if( redefineClass ) {
								//_DEBUG_PARSING && console.log( "redefine class..." );
								// redefine this class
								cls.fields.length = 0;
								nextMode = CONTEXT_CLASS_FIELD;
							} else {
								//_DEBUG_PARSING && console.log( "found existing class, using it....");
								tmpobj = new cls.protoCon();
								//tmpobj = Object.assign( tmpobj, cls.protoObject );
								//Object.setPrototypeOf( tmpobj, Object.getPrototypeOf( cls.protoObject ) );
								nextMode = CONTEXT_CLASS_VALUE;
							}
							redefineClass = false;
						}
						current_class = cls;
						word = WORD_POS_RESET;
					} else {
						word = WORD_POS_FIELD;
					}
				} else if( word == WORD_POS_FIELD /*|| word == WORD_POS_AFTER_FIELD*/ 
						|| parse_context === CONTEXT_IN_ARRAY 
						|| parse_context === CONTEXT_OBJECT_FIELD_VALUE 
						|| parse_context == CONTEXT_CLASS_VALUE ) {
					if( word != WORD_POS_RESET || val.value_type == VALUE_STRING ) {
						if( protoDef && protoDef.protoDef ) {
							// need to collect the object,
							tmpobj = new protoDef.protoDef.protoCon();
						} else {
							// look for a class type (shorthand) to recover.
							cls = classes.find( cls=>cls.name === val.string );
							if( !cls )
							{
								/* eslint-disable no-inner-declarations */
							   function privateProto(){}
								//sconsole.log( "privateProto has no proto?", privateProto.prototype.constructor.name );
								localFromProtoTypes.set( val.string,
														{ protoCon:privateProto.prototype.constructor
														, cb: null }
													   );
								tmpobj = new privateProto();
							}
							else {
								nextMode = CONTEXT_CLASS_VALUE;
								tmpobj = {};
							}
						}
						//nextMode = CONTEXT_CLASS_VALUE;
						word = WORD_POS_RESET;
					} else {
						word = WORD_POS_RESET;
					}
				} else if( ( parse_context == CONTEXT_OBJECT_FIELD && word == WORD_POS_RESET ) ) {
					throwError( "fault while parsing; getting field name unexpected ", cInt );
					status = false;
					return false;
				}

				// common code to push into next context
				let old_context = getContext();
				//_DEBUG_PARSING && console.log( "Begin a new object; previously pushed into elements; but wait until trailing comma or close previously ", val.value_type, val.className );

				val.value_type = VALUE_OBJECT;
				if( parse_context === CONTEXT_UNKNOWN ){
					elements = tmpobj;
				} else if( parse_context == CONTEXT_IN_ARRAY ) {
					if( arrayType == -1 ) {
						// this is pushed later... 
						//console.log( "PUSHING OPEN OBJECT INTO EXISTING ARRAY - THIS SHOULD BE RE-SET?", JSOX.stringify(context_stack.first.node) );
						//elements.push( tmpobj );
					}
					val.name = elements.length;
					//else if( //_DEBUG_PARSING && arrayType !== -3 )
					//	console.log( "This is an invalid parsing state, typed array with sub-object elements" );
				} else if( parse_context == CONTEXT_OBJECT_FIELD_VALUE || parse_context == CONTEXT_CLASS_VALUE ) {
					if( !val.name && current_class ){
						val.name = current_class.fields[current_class_field++];
						//_DEBUG_PARSING_DETAILS && console.log( "B Stepping current class field:", val, current_class_field, val.name );
					}
					//_DEBUG_PARSING_DETAILS && console.log( "Setting element:", val.name, tmpobj );
					elements[val.name] = tmpobj;
				}

				old_context.context = parse_context;
				old_context.elements = elements;
				//old_context.element_array = element_array;
				old_context.name = val.name;
				//_DEBUG_PARSING_DETAILS && console.log( "pushing val.name:", val.name, arrayType );
				old_context.current_proto = current_proto;
				old_context.current_class = current_class;
				old_context.current_class_field = current_class_field;
				old_context.valueType = val.value_type;
				old_context.arrayType = arrayType; // pop that we don't want to have this value re-pushed.
				old_context.className = val.className;
				//arrayType = -3; // this doesn't matter, it's an object state, and a new array will reset to -1
				val.className = null;
				val.name = null;
				current_proto = protoDef;
				current_class = cls;
				//console.log( "Setting current class:", current_class.name );
				current_class_field = 0;
				elements = tmpobj;
				if( !rootObject ) rootObject = elements;
				//_DEBUG_PARSING_STACK && console.log( "push context (open object): ", context_stack.length, " new mode:", nextMode );
				context_stack.push( old_context );
				//_DEBUG_PARSING_DETAILS && console.log( "RESET OBJECT FIELD", old_context, context_stack );
				RESET_VAL();
				parse_context = nextMode;
				return true;
			}

			function openArray() {
				//_DEBUG_PARSING_DETAILS && console.log( "openArray()..." );
				if( word > WORD_POS_RESET && word < WORD_POS_FIELD )
					recoverIdent( 91 );

				if( word == WORD_POS_END && val.string.length ) {
					//_DEBUG_PARSING && console.log( "recover arrayType:", arrayType, val.string );
					let typeIndex = knownArrayTypeNames.findIndex( type=>(type === val.string) );
					word = WORD_POS_RESET;
					if( typeIndex >= 0 ) {
						arrayType = typeIndex;
						val.className = val.string;
						val.string = null;
					} else {
						if( val.string === "ref" ) {
							val.className = null;
							//_DEBUG_PARSING_DETAILS && console.log( "This will be a reference recovery for key:", val );
							arrayType = -2;
						} else {
							if( localFromProtoTypes.get( val.string ) ) {
								val.className = val.string;
							} 
							else if( fromProtoTypes.get( val.string ) ) {
								val.className = val.string;
							} else
								throwError( `Unknown type '${val.string}' specified for array`, cInt );
							//_DEBUG_PARSING_DETAILS && console.log( " !!!!!A Set Classname:", val.className );
						}
					}
				} else if( parse_context == CONTEXT_OBJECT_FIELD || word == WORD_POS_FIELD || word == WORD_POS_AFTER_FIELD ) {
					throwError( "Fault while parsing; while getting field name unexpected", cInt );
					status = false;
					return false;
				}
				{
					let old_context = getContext();
					//_DEBUG_PARSING && console.log( "Begin a new array; previously pushed into elements; but wait until trailing comma or close previously ", val.value_type );

					//_DEBUG_PARSING_DETAILS && console.log( "Opening array:", val, parse_context );
					val.value_type = VALUE_ARRAY;
					let tmparr = [];
					if( parse_context == CONTEXT_UNKNOWN )
						elements = tmparr;
					else if( parse_context == CONTEXT_IN_ARRAY ) {
						if( arrayType == -1 ){
							//console.log( "Pushing new opening array into existing array already RE-SET" );
							elements.push( tmparr );
						} //else if( //_DEBUG_PARSING && arrayType !== -3 )
						val.name = elements.length;
						//	console.log( "This is an invalid parsing state, typed array with sub-array elements" );
					} else if( parse_context == CONTEXT_OBJECT_FIELD_VALUE ) {
						if( !val.name ) {
							console.log( "This says it's resolved......." );
							arrayType = -3;
						}

						if( current_proto && current_proto.protoDef ) {
							//_DEBUG_PARSING_DETAILS && console.log( "SOMETHING SHOULD HAVE BEEN REPLACED HERE??", current_proto );
							//_DEBUG_PARSING_DETAILS && console.log( "(need to do fromprototoypes here) object:", val, value );
							if( current_proto.protoDef.cb ){
								const newarr = current_proto.protoDef.cb.call( elements, val.name, tmparr );
								if( newarr !== undefined ) tmparr = elements[val.name] = newarr;
								//else console.log( "Warning: Received undefined for an array; keeping original array, not setting field" );
							}else
								elements[val.name] = tmparr;
						}
						else
							elements[val.name] = tmparr;
					}
					old_context.context = parse_context;
					old_context.elements = elements;
					//old_context.element_array = element_array;
					old_context.name = val.name;
					old_context.current_proto = current_proto;
					old_context.current_class = current_class;
					old_context.current_class_field = current_class_field;
					// already pushed?
					old_context.valueType = val.value_type;
					old_context.arrayType = (arrayType==-1)?-3:arrayType; // pop that we don't want to have this value re-pushed.
					old_context.className = val.className;
					arrayType = -1;
					val.className = null;

					//_DEBUG_PARSING_DETAILS && console.log( " !!!!!B Clear Classname:", old_context, val.className, old_context.className, old_context.name );
					val.name = null;
					current_proto = null;
					current_class = null;
					current_class_field = 0;
					//element_array = tmparr;
					elements = tmparr;
					if( !rootObject ) rootObject = tmparr;
					//_DEBUG_PARSING_STACK && console.log( "push context (open array): ", context_stack.length );
					context_stack.push( old_context );
					//_DEBUG_PARSING_DETAILS && console.log( "RESET ARRAY FIELD", old_context, context_stack );

					RESET_VAL();
					parse_context = CONTEXT_IN_ARRAY;
				}
				return true;
			}

			function getProto() {
				const result = {protoDef:null,cls:null};
				if( ( result.protoDef = localFromProtoTypes.get( val.string ) ) ) {
					if( !val.className ){
						val.className = val.string;
						val.string = null;
					}
					// need to collect the object, 
				}
				else if( ( result.protoDef = fromProtoTypes.get( val.string ) ) ) {
					if( !val.className ){
						val.className = val.string;
						val.string = null;
					}
				} 
				if( val.string )
				{
					result.cls = classes.find( cls=>cls.name === val.string );
					if( !result.protoDef && !result.cls ) {
					    // this will creaet a class def with a new proto to cover when we don't KNOW.
					    //throwError( "Referenced class " + val.string + " has not been defined", cInt );
					}
				}
				return (result.protoDef||result.cls)?result:null;
			}

			if( !status )
				return -1;

			if( msg && msg.length ) {
				input = getBuffer();
				input.buf = msg;
				inQueue.push( input );
			} else {
				if( gatheringNumber ) {
					//console.log( "Force completed.")
					gatheringNumber = false;
					val.value_type = VALUE_NUMBER;
					if( parse_context == CONTEXT_UNKNOWN ) {
						completed = true;
					}
					retval = 1;  // if returning buffers, then obviously there's more in this one.
				}
				if( parse_context !== CONTEXT_UNKNOWN )
					throwError( "Unclosed object at end of stream.", cInt );
			}

			while( status && ( input = inQueue.shift() ) ) {
				n = input.n;
				buf = input.buf;
				if( gatheringString ) {
					let string_status = gatherString( gatheringStringFirstChar );
					if( string_status < 0 )
						status = false;
					else if( string_status > 0 ) {
						gatheringString = false;
						if( status ) val.value_type = VALUE_STRING;
					}
				}
				if( gatheringNumber ) {
					collectNumber();
				}

				while( !completed && status && ( n < buf.length ) ) {
					str = buf.charAt(n);
					cInt = buf.codePointAt(n++);
					if( cInt >= 0x10000 ) { str += buf.charAt(n); n++; }
					//_DEBUG_PARSING && console.log( "parsing at ", cInt, str );
					//_DEBUG_LL && console.log( "processing: ", cInt, n, str, pos, comment, parse_context, word );
					pos.col++;
					if( comment ) {
						if( comment == 1 ) {
							if( cInt == 42/*'*'*/ ) comment = 3;
							else if( cInt != 47/*'/'*/ ) return throwError( "fault while parsing;", cInt );
							else comment = 2;
						}
						else if( comment == 2 ) {
							if( cInt == 10/*'\n'*/ || cInt == 13/*'\r'*/  ) comment = 0;
						}
						else if( comment == 3 ) {
							if( cInt == 42/*'*'*/ ) comment = 4;
						}
						else {
							if( cInt == 47/*'/'*/ ) comment = 0;
							else comment = 3;
						}
						continue;
					}
					switch( cInt ) {
					case 35/*'#'*/:
						comment = 2; // pretend this is the second slash.
						break;
					case 47/*'/'*/:
						comment = 1;
						break;
					case 123/*'{'*/:
						openObject();
						break;
					case 91/*'['*/:
						openArray();
						break;

					case 58/*':'*/:
						//_DEBUG_PARSING && console.log( "colon received...")
						if( parse_context == CONTEXT_CLASS_VALUE ) {
							word = WORD_POS_RESET;
							val.name = val.string;
							val.string = '';
							val.value_type = VALUE_UNSET;
							
						} else if( parse_context == CONTEXT_OBJECT_FIELD
							|| parse_context == CONTEXT_CLASS_FIELD  ) {
							if( parse_context == CONTEXT_CLASS_FIELD ) {
								if( !Object.keys( elements).length ) {
									 console.log( "This is a full object, not a class def...", val.className );
								const privateProto = ()=>{}; 
								localFromProtoTypes.set( context_stack.last.node.current_class.name,
														{ protoCon:privateProto.prototype.constructor
														, cb: null }
													   );
								elements = new privateProto();
								parse_context = CONTEXT_OBJECT_FIELD_VALUE;
								val.name = val.string;
								word = WORD_POS_RESET;
								val.string = '';
								val.value_type = VALUE_UNSET;
								console.log( "don't do default;s do a revive..." );
								}
							} else {
								if( word != WORD_POS_RESET
								   && word != WORD_POS_END
								   && word != WORD_POS_FIELD
								   && word != WORD_POS_AFTER_FIELD ) {
									recoverIdent( 32 );
									// allow starting a new word
									//status = false;
									//throwError( `fault while parsing; unquoted keyword used as object field name (state:${word})`, cInt );
									//break;
								}
								word = WORD_POS_RESET;
								val.name = val.string;
								val.string = '';
								parse_context = (parse_context===CONTEXT_OBJECT_FIELD)?CONTEXT_OBJECT_FIELD_VALUE:CONTEXT_CLASS_FIELD_VALUE;
								val.value_type = VALUE_UNSET;
							}
						}
						else if( parse_context == CONTEXT_UNKNOWN ){
							console.log( "Override colon found, allow class redefinition", parse_context );
							redefineClass = true;
							break;
						} else {
							if( parse_context == CONTEXT_IN_ARRAY )
								throwError(  "(in array, got colon out of string):parsing fault;", cInt );
							else if( parse_context == CONTEXT_OBJECT_FIELD_VALUE ){
								throwError( "String unexpected", cInt );
							} else
								throwError( "(outside any object, got colon out of string):parsing fault;", cInt );
							status = false;
						}
						break;
					case 125/*'}'*/:
						//_DEBUG_PARSING && console.log( "close bracket context:", word, parse_context, val.value_type, val.string );
						if( word == WORD_POS_END ) {
							// allow starting a new word
							word = WORD_POS_RESET;
						}
						// coming back after pushing an array or sub-object will reset the contxt to FIELD, so an end with a field should still push value.
						if( parse_context == CONTEXT_CLASS_FIELD ) {
							if( current_class ) {
								// allow blank comma at end to not be a field
								if(val.string) { current_class.fields.push( val.string ); }

								RESET_VAL();
								let old_context = context_stack.pop();
								//_DEBUG_PARSING_DETAILS && console.log( "close object:", old_context, context_stack );
								//_DEBUG_PARSING_STACK && console.log( "object pop stack (close obj)", context_stack.length, old_context );
								parse_context = CONTEXT_UNKNOWN; // this will restore as IN_ARRAY or OBJECT_FIELD
								word = WORD_POS_RESET;
								val.name = old_context.name;
								elements = old_context.elements;
								//element_array = old_context.element_array;
								current_class = old_context.current_class;
								current_class_field = old_context.current_class_field;
								//_DEBUG_PARSING_DETAILS && console.log( "A Pop old class field counter:", current_class_field, val.name );
								arrayType = old_context.arrayType;
								val.value_type = old_context.valueType;
								val.className = old_context.className;
								//_DEBUG_PARSING_DETAILS && console.log( " !!!!!C Pop Classname:", val.className );
								rootObject = null;

								dropContext( old_context );
							} else {
								throwError( "State error; gathering class fields, and lost the class", cInt );
							}
						} else if( ( parse_context == CONTEXT_OBJECT_FIELD ) || ( parse_context == CONTEXT_CLASS_VALUE ) ) {
							if( val.value_type != VALUE_UNSET ) {
								if( current_class ) {
									//_DEBUG_PARSING_DETAILS && console.log( "C Stepping current class field:", current_class_field, val.name, arrayType );
									val.name = current_class.fields[current_class_field++];
								}
								//_DEBUG_PARSING && console.log( "Closing object; set value name, and push...", current_class_field, val );
								objectPush();
							}
							//_DEBUG_PARSING && console.log( "close object; empty object", val, elements );

								val.value_type = VALUE_OBJECT;
								if( current_proto && current_proto.protoDef ) {
									console.log( "SOMETHING SHOULD AHVE BEEN REPLACED HERE??", current_proto );
									console.log( "The other version only revives on init" );
									elements = new current_proto.protoDef.cb( elements, undefined, undefined );
									//elements = new current_proto.protoCon( elements );
								}
								val.contains = elements;
								val.string = "";

							let old_context = context_stack.pop();
							//_DEBUG_PARSING_STACK && console.log( "object pop stack (close obj)", context_stack.length, old_context );
							parse_context = old_context.context; // this will restore as IN_ARRAY or OBJECT_FIELD
							val.name = old_context.name;
							elements = old_context.elements;
							//element_array = old_context.element_array;
							current_class = old_context.current_class;
							current_proto = old_context.current_proto;
							current_class_field = old_context.current_class_field;
							//_DEBUG_PARSING_DETAILS && console.log( "B Pop old class field counter:", context_stack, current_class_field, val.name );
							arrayType = old_context.arrayType;
							val.value_type = old_context.valueType;
							val.className = old_context.className;
							//_DEBUG_PARSING_DETAILS && console.log( " !!!!!D Pop Classname:", val.className );
							dropContext( old_context );

							if( parse_context == CONTEXT_UNKNOWN ) {
								completed = true;
							}
						}
						else if( ( parse_context == CONTEXT_OBJECT_FIELD_VALUE ) ) {
							// first, add the last value
							//_DEBUG_PARSING && console.log( "close object; push item '%s' %d", val.name, val.value_type );
							if( val.value_type === VALUE_UNSET ) {
								if( word == WORD_POS_RESET )
									throwError( "Fault while parsing; unexpected", cInt );
								else {
									recoverIdent(cInt);									
								}
							}
							objectPush();
							val.value_type = VALUE_OBJECT;
							val.contains = elements;
							word = WORD_POS_RESET;

							//let old_context = context_stack.pop();
							let old_context = context_stack.pop();
							//_DEBUG_PARSING_STACK  && console.log( "object pop stack (close object)", context_stack.length, old_context );
							parse_context = old_context.context; // this will restore as IN_ARRAY or OBJECT_FIELD
							val.name = old_context.name;
							elements = old_context.elements;
							current_proto = old_context.current_proto;
							current_class = old_context.current_class;
							current_class_field = old_context.current_class_field;
							//_DEBUG_PARSING_DETAILS && console.log( "C Pop old class field counter:", context_stack, current_class_field, val.name );
							arrayType = old_context.arrayType;
							val.value_type = old_context.valueType;
							val.className = old_context.className;
							//_DEBUG_PARSING_DETAILS && console.log( " !!!!!E Pop Classname:", val.className );
							//element_array = old_context.element_array;
							dropContext( old_context );
							if( parse_context == CONTEXT_UNKNOWN ) {
								completed = true;
							}
						}
						else {
							throwError( "Fault while parsing; unexpected", cInt );
							status = false;
						}
						negative = false;
						break;
					case 93/*']'*/:
						if( word >= WORD_POS_AFTER_FIELD ) {
							word = WORD_POS_RESET;
						}
						if( parse_context == CONTEXT_IN_ARRAY ) {
							
							//_DEBUG_PARSING  && console.log( "close array, push last element: %d", val.value_type );
							if( val.value_type != VALUE_UNSET ) {
								// name is set when saving a context.
								// a better sanity check would be val.name === elements.length;
								//if( val.name ) if( val.name !== elements.length ) console.log( "Ya this should blow up" );
								arrayPush();
							} else {
								if( word !== WORD_POS_RESET ) {
									recoverIdent(cInt);
									arrayPush();
								}
							}
							val.contains = elements;
							{
								let old_context = context_stack.pop();
								//_DEBUG_PARSING_STACK  && console.log( "object pop stack (close array)", context_stack.length );
								val.name = old_context.name;
								val.className = old_context.className;
								parse_context = old_context.context;
								elements = old_context.elements;
								//element_array = old_context.element_array;
								current_proto = old_context.current_proto;
								current_class = old_context.current_class;
								current_class_field = old_context.current_class_field;
								arrayType = old_context.arrayType;
								val.value_type = old_context.valueType;
								//_DEBUG_PARSING_DETAILS && console.log( "close array:", old_context );
								//_DEBUG_PARSING_DETAILS && console.log( "D Pop old class field counter:", context_stack, current_class_field, val );
								dropContext( old_context );
							}
							val.value_type = VALUE_ARRAY;
							if( parse_context == CONTEXT_UNKNOWN ) {
								completed = true;
							}
						} else {
							throwError( `bad context ${parse_context}; fault while parsing`, cInt );// fault
							status = false;
						}
						negative = false;
						break;
					case 44/*','*/:
						if( word < WORD_POS_AFTER_FIELD && word != WORD_POS_RESET ) {
							recoverIdent(cInt);
						}
						if( word == WORD_POS_END || word == WORD_POS_FIELD ) word = WORD_POS_RESET;  // allow collect new keyword
						//if(//_DEBUG_PARSING) 
						//_DEBUG_PARSING_DETAILS && console.log( "comma context:", parse_context, val );
						if( parse_context == CONTEXT_CLASS_FIELD ) {
							if( current_class ) {
								//console.log( "Saving field name(set word to IS A FIELD):", val.string );
								current_class.fields.push( val.string );
								val.string = '';
								word = WORD_POS_FIELD;
							} else {
								throwError( "State error; gathering class fields, and lost the class", cInt );
							}
						} else if( parse_context == CONTEXT_OBJECT_FIELD ) {
							if( current_class ) {
								//_DEBUG_PARSING_DETAILS && console.log( "D Stepping current class field:", current_class_field, val.name );
								val.name = current_class.fields[current_class_field++];
								//_DEBUG_PARSING && console.log( "should have a completed value at a comma.:", current_class_field, val );
								if( val.value_type != VALUE_UNSET ) {
									//_DEBUG_PARSING  && console.log( "pushing object field:", val );
									objectPush();
									RESET_VAL();
								}
							} else {
								// this is an empty comma...
								if( val.string || val.value_type )
									throwError( "State error; comma in field name and/or lost the class", cInt );
							}
						} else if( parse_context == CONTEXT_CLASS_VALUE ) {
							if( current_class ) {
								//_DEBUG_PARSING_DETAILS && console.log( "reviving values in class...", arrayType, current_class.fields[current_class_field ], val );
								if( arrayType != -3 && !val.name ) {
									// this should have still had a name....
									//_DEBUG_PARSING_DETAILS && console.log( "E Stepping current class field:", current_class_field, val, arrayType );
									val.name = current_class.fields[current_class_field++];
									//else val.name = current_class.fields[current_class_field++];
								}
								//_DEBUG_PARSING && console.log( "should have a completed value at a comma.:", current_class_field, val );
								if( val.value_type != VALUE_UNSET ) {
									if( arrayType != -3 )
										objectPush();
									RESET_VAL();
								}
							} else {
								
								if( val.value_type != VALUE_UNSET ) {
									objectPush();
									RESET_VAL();
								}
								//throwError( "State error; gathering class values, and lost the class", cInt );
							}
							val.name = null;
						} else if( parse_context == CONTEXT_IN_ARRAY ) {
							if( val.value_type == VALUE_UNSET )
								val.value_type = VALUE_EMPTY; // in an array, elements after a comma should init as undefined...

							//_DEBUG_PARSING  && console.log( "back in array; push item %d", val.value_type );
							arrayPush();
							RESET_VAL();
							word = WORD_POS_RESET;
							// undefined allows [,,,] to be 4 values and [1,2,3,] to be 4 values with an undefined at end.
						} else if( parse_context == CONTEXT_OBJECT_FIELD_VALUE && val.value_type != VALUE_UNSET ) {
							// after an array value, it will have returned to OBJECT_FIELD anyway
							//_DEBUG_PARSING  && console.log( "comma after field value, push field to object: %s", val.name, val.value_type );
							parse_context = CONTEXT_OBJECT_FIELD;
							if( val.value_type != VALUE_UNSET ) {
								objectPush();
								RESET_VAL();
							}
							word = WORD_POS_RESET;
						} else {
							status = false;
							throwError( "bad context; excessive commas while parsing;", cInt );// fault
						}
						negative = false;
						break;

					default:
						switch( cInt ) {
						default:
						if( ( parse_context == CONTEXT_UNKNOWN )
						  || ( parse_context == CONTEXT_OBJECT_FIELD_VALUE && word == WORD_POS_FIELD )
						  || ( ( parse_context == CONTEXT_OBJECT_FIELD ) || word == WORD_POS_FIELD )
						  || ( parse_context == CONTEXT_CLASS_FIELD ) ) {
							switch( cInt ) {
							case 96://'`':
							case 34://'"':
							case 39://'\'':
								if( word == WORD_POS_RESET || word == WORD_POS_FIELD ) {
									if( val.string.length ) {
										console.log( "IN ARRAY AND FIXING?" );
										val.className = val.string;
										val.string = '';
									}
									let string_status = gatherString(cInt );
									//_DEBUG_PARSING && console.log( "string gather for object field name :", val.string, string_status );
									if( string_status ) {
										val.value_type = VALUE_STRING;
									} else {
										gatheringStringFirstChar = cInt;
										gatheringString = true;
									}
								} else {
									throwError( "fault while parsing; quote not at start of field name", cInt );
								}

								break;
							case 10://'\n':
								pos.line++;
								pos.col = 1;
								// fall through to normal space handling - just updated line/col position
							case 13://'\r':
							case 32://' ':
							case 0x2028://' ':
							case 0x2029://' ':
							case 9://'\t':
							case 0xFEFF: // ZWNBS is WS though
								 //_DEBUG_WHITESPACE  && console.log( "THIS SPACE", word, parse_context, val );
								if( parse_context === CONTEXT_UNKNOWN && word === WORD_POS_END ) { // allow collect new keyword
									word = WORD_POS_RESET;
									if( parse_context === CONTEXT_UNKNOWN ) {
										completed = true;
									}
									break;
								}
								if( word === WORD_POS_RESET || word === WORD_POS_AFTER_FIELD ) { // ignore leading and trailing whitepsace
									if( parse_context == CONTEXT_UNKNOWN && val.value_type ) {
										completed = true;
									}
									break;
								}
								else if( word === WORD_POS_FIELD ) {
									if( parse_context === CONTEXT_UNKNOWN ) {
										word = WORD_POS_RESET;
										completed = true;
										break;
									}
									if( val.string.length )
										console.log( "STEP TO NEXT TOKEN." );
										word = WORD_POS_AFTER_FIELD;
										//val.className = val.string; val.string = '';
								}
								else {
									status = false;
									throwError( "fault while parsing; whitepsace unexpected", cInt );
								}
								// skip whitespace
								break;
							default:
								//if( /((\n|\r|\t)|s|S|[ \{\}\(\)\<\>\!\+-\*\/\.\:\, ])/.
								if( testNonIdentifierCharacters ) {
								let identRow = nonIdent.find( row=>(row.firstChar >= cInt )&& (row.lastChar > cInt) );
								if( identRow && ( identRow.bits[(cInt - identRow.firstChar) / 24]
								    & (1 << ((cInt - identRow.firstChar) % 24)))) {
								//if( nonIdent[(cInt/(24*16))|0] && nonIdent[(cInt/(24*16))|0][(( cInt % (24*16) )/24)|0] & ( 1 << (cInt%24)) ) {
									// invalid start/continue
									status = false;
									throwError( `fault while parsing object field name; \\u${cInt}`, cInt );	// fault
									break;
								}
								}
								//console.log( "TICK" );
								if( word == WORD_POS_RESET && ( ( cInt >= 48/*'0'*/ && cInt <= 57/*'9'*/ ) || ( cInt == 43/*'+'*/ ) || ( cInt == 46/*'.'*/ ) || ( cInt == 45/*'-'*/ ) ) ) {
									fromHex = false;
									exponent = false;
									date_format = false;
									isBigInt = false;

									exponent_sign = false;
									exponent_digit = false;
									decimal = false;
									val.string = str;
									input.n = n;
									collectNumber();
									break;
								}

								if( word === WORD_POS_AFTER_FIELD ) {
									status = false;
									throwError( "fault while parsing; character unexpected", cInt );
								}
								if( word === WORD_POS_RESET ) {
									word = WORD_POS_FIELD;
									val.value_type = VALUE_STRING;
									val.string += str;
									//_DEBUG_PARSING  && console.log( "START/CONTINUE IDENTIFER" );
									break;

								}     
								if( val.value_type == VALUE_UNSET ) {
									if( word !== WORD_POS_RESET && word !== WORD_POS_END )
										recoverIdent( cInt );
								} else {
									if( word === WORD_POS_END || word === WORD_POS_FIELD ) {
										// final word of the line... 
										// whispace changes the 'word' state to not 'end'
										// until the next character, which may restore it to
										// 'end' and this will resume collecting the same string.
										val.string += str;
										break;
									}
									if( parse_context == CONTEXT_OBJECT_FIELD ) {
										if( word == WORD_POS_FIELD ) {
											val.string+=str;
											break;
										}
										throwError( "Multiple values found in field name", cInt );
									}
									if( parse_context == CONTEXT_OBJECT_FIELD_VALUE ) {
										throwError( "String unexpected", cInt );
									}
								}
								break; // default
							}
							
						}else {
							if( word == WORD_POS_RESET && ( ( cInt >= 48/*'0'*/ && cInt <= 57/*'9'*/ ) || ( cInt == 43/*'+'*/ ) || ( cInt == 46/*'.'*/ ) || ( cInt == 45/*'-'*/ ) ) ) {
								fromHex = false;
								exponent = false;
								date_format = false;
								isBigInt = false;

								exponent_sign = false;
								exponent_digit = false;
								decimal = false;
								val.string = str;
								input.n = n;
								collectNumber();
							} else {
								//console.log( "TICK")
								if( val.value_type == VALUE_UNSET ) {
									if( word != WORD_POS_RESET ) {
										recoverIdent( cInt );
									} else {
										word = WORD_POS_END;
										val.string += str;
										val.value_type = VALUE_STRING;
									}
								} else {
									if( parse_context == CONTEXT_OBJECT_FIELD ) {
										throwError( "Multiple values found in field name", cInt );
									}
									else if( parse_context == CONTEXT_OBJECT_FIELD_VALUE ) {

										if( val.value_type != VALUE_STRING ) {
											if( val.value_type == VALUE_OBJECT || val.value_type == VALUE_ARRAY ){
												throwError( "String unexpected", cInt );
											}
											recoverIdent(cInt);
										}
										if( word == WORD_POS_AFTER_FIELD ){
											const  protoDef = getProto();
											if( protoDef){
												word == WORD_POS_END; // last string.
												val.string = str;
											}
											else 
												throwError( "String unexpected", cInt );
										} else {
											if( word == WORD_POS_END ) {
												val.string += str;
											}else
												throwError( "String unexpected", cInt );
										}
									}
									else if( parse_context == CONTEXT_IN_ARRAY ) {
										if( word == WORD_POS_AFTER_FIELD ){
											if( !val.className ){
												//	getProto()
												val.className = val.string;
												val.string = '';
											}
											val.string += str;
											break;
										} else {
											if( word == WORD_POS_END )
												val.string += str;
										}

									}
								}
								
								//recoverIdent(cInt);
							}
							break; // default
						}
						break;
						case 96://'`':
						case 34://'"':
						case 39://'\'':
						{
							if( val.string ) val.className = val.string; val.string = '';
							let string_status = gatherString( cInt );
							//_DEBUG_PARSING && console.log( "string gather for object field value :", val.string, string_status, completed, input.n, buf.length );
							if( string_status ) {
								val.value_type = VALUE_STRING;
								word = WORD_POS_END;
							} else {
								gatheringStringFirstChar = cInt;
								gatheringString = true;
							}
							break;
						}
						case 10://'\n':
							pos.line++;
							pos.col = 1;
							//falls through
						case 32://' ':
						case 9://'\t':
						case 13://'\r':
						case 0x2028: // LS (Line separator)
						case 0x2029: // PS (paragraph separate)
						case 0xFEFF://'\uFEFF':
							//_DEBUG_WHITESPACE && console.log( "Whitespace...", word, parse_context );
							if( word == WORD_POS_END ) {
								if( parse_context == CONTEXT_UNKNOWN ) {
									word = WORD_POS_RESET;
									completed = true;
									break;
								} else if( parse_context == CONTEXT_OBJECT_FIELD_VALUE ) {
									word = WORD_POS_AFTER_FIELD_VALUE;
									break;
								} else if( parse_context == CONTEXT_OBJECT_FIELD ) {
									word = WORD_POS_AFTER_FIELD;
									break;
								} else if( parse_context == CONTEXT_IN_ARRAY ) {
									word = WORD_POS_AFTER_FIELD;
									break;
								}
							}
							if( word == WORD_POS_RESET || ( word == WORD_POS_AFTER_FIELD ))
								break;
							else if( word == WORD_POS_FIELD ) {
								if( val.string.length )
									word = WORD_POS_AFTER_FIELD;
							}
							else {
								if( word < WORD_POS_END ) 
									recoverIdent( cInt );
							}
							break;
					//----------------------------------------------------------
					//  catch characters for true/false/null/undefined which are values outside of quotes
						case 116://'t':
							if( word == WORD_POS_RESET ) word = WORD_POS_TRUE_1;
							else if( word == WORD_POS_INFINITY_6 ) word = WORD_POS_INFINITY_7;
							else { recoverIdent(cInt); }// fault
							break;
						case 114://'r':
							if( word == WORD_POS_TRUE_1 ) word = WORD_POS_TRUE_2;
							else { recoverIdent(cInt); }// fault
							break;
						case 117://'u':
							if( word == WORD_POS_TRUE_2 ) word = WORD_POS_TRUE_3;
							else if( word == WORD_POS_NULL_1 ) word = WORD_POS_NULL_2;
							else if( word == WORD_POS_RESET ) word = WORD_POS_UNDEFINED_1;
							else { recoverIdent(cInt); }// fault
							break;
						case 101://'e':
							if( word == WORD_POS_TRUE_3 ) {
								val.value_type = VALUE_TRUE;
								word = WORD_POS_END;
							} else if( word == WORD_POS_FALSE_4 ) {
								val.value_type = VALUE_FALSE;
								word = WORD_POS_END;
							} else if( word == WORD_POS_UNDEFINED_3 ) word = WORD_POS_UNDEFINED_4;
							else if( word == WORD_POS_UNDEFINED_7 ) word = WORD_POS_UNDEFINED_8;
							else { recoverIdent(cInt); }// fault
							break;
						case 110://'n':
							if( word == WORD_POS_RESET ) word = WORD_POS_NULL_1;
							else if( word == WORD_POS_UNDEFINED_1 ) word = WORD_POS_UNDEFINED_2;
							else if( word == WORD_POS_UNDEFINED_6 ) word = WORD_POS_UNDEFINED_7;
							else if( word == WORD_POS_INFINITY_1 ) word = WORD_POS_INFINITY_2;
							else if( word == WORD_POS_INFINITY_4 ) word = WORD_POS_INFINITY_5;
							else { recoverIdent(cInt); }// fault
							break;
						case 100://'d':
							if( word == WORD_POS_UNDEFINED_2 ) word = WORD_POS_UNDEFINED_3;
							else if( word == WORD_POS_UNDEFINED_8 ) { val.value_type=VALUE_UNDEFINED; word = WORD_POS_END; }
							else { recoverIdent(cInt); }// fault
							break;
						case 105://'i':
							if( word == WORD_POS_UNDEFINED_5 ) word = WORD_POS_UNDEFINED_6;
							else if( word == WORD_POS_INFINITY_3 ) word = WORD_POS_INFINITY_4;
							else if( word == WORD_POS_INFINITY_5 ) word = WORD_POS_INFINITY_6;
							else { recoverIdent(cInt); }// fault
							break;
						case 108://'l':
							if( word == WORD_POS_NULL_2 ) word = WORD_POS_NULL_3;
							else if( word == WORD_POS_NULL_3 ) {
								val.value_type = VALUE_NULL;
								word = WORD_POS_END;
							} else if( word == WORD_POS_FALSE_2 ) word = WORD_POS_FALSE_3;
							else { recoverIdent(cInt); }// fault
							break;
						case 102://'f':
							if( word == WORD_POS_RESET ) word = WORD_POS_FALSE_1;
							else if( word == WORD_POS_UNDEFINED_4 ) word = WORD_POS_UNDEFINED_5;
							else if( word == WORD_POS_INFINITY_2 ) word = WORD_POS_INFINITY_3;
							else { recoverIdent(cInt); }// fault
							break;
						case 97://'a':
							if( word == WORD_POS_FALSE_1 ) word = WORD_POS_FALSE_2;
							else if( word == WORD_POS_NAN_1 ) word = WORD_POS_NAN_2;
							else { recoverIdent(cInt); }// fault
							break;
						case 115://'s':
							if( word == WORD_POS_FALSE_3 ) word = WORD_POS_FALSE_4;
							else { recoverIdent(cInt); }// fault
							break;
						case 73://'I':
							if( word == WORD_POS_RESET ) word = WORD_POS_INFINITY_1;
							else { recoverIdent(cInt); }// fault
							break;
						case 78://'N':
							if( word == WORD_POS_RESET ) word = WORD_POS_NAN_1;
							else if( word == WORD_POS_NAN_2 ) { val.value_type = negative ? VALUE_NEG_NAN : VALUE_NAN; negative = false; word = WORD_POS_END; }
							else { recoverIdent(cInt); }// fault
							break;
						case 121://'y':
							if( word == WORD_POS_INFINITY_7 ) { val.value_type = negative ? VALUE_NEG_INFINITY : VALUE_INFINITY; negative = false; word = WORD_POS_END; }
							else { recoverIdent(cInt); }// fault
							break;
						case 45://'-':
							if( word == WORD_POS_RESET ) negative = !negative;
							else { recoverIdent(cInt); }// fault
							break;
						case 43://'+':
							if( word !== WORD_POS_RESET ) { recoverIdent(cInt); }
							break;
						}
						break; // default of high level switch
					//
					//----------------------------------------------------------
					}
					if( completed ) {
						if( word == WORD_POS_END ) {
							word = WORD_POS_RESET;
						}
						break;
					}
				}

				if( n == buf.length ) {
					dropBuffer( input );
					if( val.value_type == VALUE_UNSET && ( complete_at_end && word != WORD_POS_RESET ) ) {
						recoverIdent( 32 ); // whitespace isn't appended...
					}
					if( gatheringString || gatheringNumber || parse_context == CONTEXT_OBJECT_FIELD ) {
						retval = 0;
					}
					else {
						if( parse_context == CONTEXT_UNKNOWN && ( val.value_type != VALUE_UNSET || result ) ) {
							completed = true;
							retval = 1;
						}
					}
				}
				else {
					// put these back into the stack.
					input.n = n;
					inQueue.unshift( input );
					retval = 2;  // if returning buffers, then obviously there's more in this one.
				}
				if( completed ) {
					rootObject = null;
					break;
				}
			}

			if( !status ) return -1;
			if( completed && val.value_type != VALUE_UNSET ) {
				word = WORD_POS_RESET;
				result = convertValue();
				//_DEBUG_PARSING && console.log( "Result(3):", result );
				negative = false;
				val.string = '';
				val.value_type = VALUE_UNSET;
			}
			completed = false;
			return retval;
		}
	}
};



const _parser = [Object.freeze( JSOX.begin() )];
let _parse_level = 0;
/**
 * parse a string resulting with one value from it.
 *
 * @template T
 * @param {string} msg 
 * @param {(this: any, key: string, value: any) => any} [reviver] 
 * @returns {T}
 */
JSOX.parse = function( msg, reviver ) {
	let parse_level = _parse_level++;
	let parser;
	if( _parser.length <= parse_level )
		_parser.push( Object.freeze( JSOX.begin() ) );
	parser = _parser[parse_level];
	if (typeof msg !== "string") msg = String(msg);
	parser.reset();
	const writeResult = parser._write( msg, true );
	if( writeResult > 0 ) {
		if( writeResult > 1 ){
			// probably a carriage return.
			//console.log( "Extra data at end of message");
		}
		let result = parser.value();
		if( ( "undefined" === typeof result ) && writeResult > 1 ){
			throw new Error( "Pending value could not complete");
		}

		result = typeof reviver === 'function' ? (function walk(holder, key) {
			let k, v, value = holder[key];
			if (value && typeof value === 'object') {
				for (k in value) {
					if (Object.prototype.hasOwnProperty.call(value, k)) {
						v = walk(value, k);
						if (v !== undefined) {
							value[k] = v;
						} else {
							delete value[k];
						}
					}
				}
			}
			return reviver.call(holder, key, value);
		}({'': result}, '')) : result;
		_parse_level--;
		return result;
	}
	parser.finalError();
	return undefined;
};


function this_value() {/*//_DEBUG_STRINGIFY&&console.log( "this:", this, "valueof:", this&&this.valueOf() );*/ 
	return this&&this.valueOf();
}

/**
 * Define a class to be used for serialization; the class allows emitting the class fields ahead of time, and just provide values later.
 * @param {string} name 
 * @param {object} obj 
 */
JSOX.defineClass = function( name, obj ) {
	let cls;
	let denormKeys = Object.keys(obj);
	for( let i = 1; i < denormKeys.length; i++ ) {
		let a, b;
		if( ( a = denormKeys[i-1] ) > ( b = denormKeys[i] ) ) {
			denormKeys[i-1] = b;
			denormKeys[i] = a;
			if( i ) i-=2; // go back 2, this might need to go further pack.
			else i--; // only 1 to check.
		}
	}
	//console.log( "normalized:", denormKeys );
	commonClasses.push( cls = { name : name
		   , tag:denormKeys.toString()
		   , proto : Object.getPrototypeOf(obj)
		   , fields : Object.keys(obj) } );
	for(let n = 1; n < cls.fields.length; n++) {
		if( cls.fields[n] < cls.fields[n-1] ) {
			let tmp = cls.fields[n-1];
			cls.fields[n-1] = cls.fields[n];
			cls.fields[n] = tmp;
			if( n > 1 )
				n-=2;
		}
	}
	if( cls.proto === Object.getPrototypeOf( {} ) ) cls.proto = null;
};

/**
 * deprecated; define a class to be used for serialization
 *
 * @param {string} named
 * @param {class} ptype
 * @param {(any)=>any} f
 */
JSOX.registerToJSOX = function( name, ptype, f ) {
	throw new Error( "registerToJSOX deprecated; please use toJSOX:" + prototypeName + prototype.toString() );
};

/**
 * define a class with special serialization rules.
 *
 * @param {string} named
 * @param {class} ptype
 * @param {(any)=>any} f
 */
JSOX.toJSOX = function( name, ptype, f ) {
	//console.log( "SET OBJECT TYPE:", ptype, ptype.prototype, Object.prototype, ptype.constructor );
	if( !ptype.prototype || ptype.prototype !== Object.prototype ) {
		if( toProtoTypes.get(ptype.prototype) ) throw new Error( "Existing toJSOX has been registered for prototype" );
		//_DEBUG_PARSING && console.log( "PUSH PROTOTYPE" );
		toProtoTypes.set( ptype.prototype, { external:true, name:name||f.constructor.name, cb:f } );
	} else {
		let key = Object.keys( ptype ).toString();
		if( toObjectTypes.get(key) ) throw new Error( "Existing toJSOX has been registered for object type" );
		//console.log( "TEST SET OBJECT TYPE:", key );
		toObjectTypes.set( key, { external:true, name:name, cb:f } );
	}
};

/**
 * define a class to be used for deserialization
 * @param {string} prototypeName 
 * @param {class} o 
 * @param {(any)=>any} f 
 */
JSOX.fromJSOX = function( prototypeName, o, f ) {
	function privateProto() { }
		if( !o ) o = privateProto.prototype;
		if( fromProtoTypes.get(prototypeName) ) throw new Error( "Existing fromJSOX has been registered for prototype" );
		if( o && !("constructor" in o )){
			throw new Error( "Please pass a prototype like thing...");
	}
	fromProtoTypes.set( prototypeName, {protoCon: o.prototype.constructor, cb:f } );

};


/**
 * deprecated; use fromJSOX instead
 */
JSOX.registerFromJSOX = function( prototypeName, o /*, f*/ ) {
	throw new Error( "deprecated; please adjust code to use fromJSOX:" + prototypeName + o.toString() );
};

/**
 * Define serialization and deserialization methods for a class.
 * This is the same as registering separately with toJSOX and fromJSOX methods.
 * 
 * @param {string} name - Name used to prefix objects of this type encoded in JSOX
 * @param {class} prototype - prototype to match when serializing, and to create instaces of when deserializing.
 * @param {(stringifier:JSOXStringifier)=>{string}} to - `this` is the value to convert; function to call to encode JSOX from an object
 * @param {(field:string,val:any)=>{any}} from - handle storing revived value in class
 */
JSOX.addType = function( prototypeName, prototype, to, from ) {
	JSOX.toJSOX( prototypeName, prototype, to );
	JSOX.fromJSOX( prototypeName, prototype, from );
};

JSOX.registerToFrom = function( prototypeName, prototype/*, to, from*/ ) {
	throw new Error( "registerToFrom deprecated; please use addType:" + prototypeName + prototype.toString() );
};

/**
 * Create a stringifier to convert objects to JSOX text.  Allows defining custom serialization for objects.
 * @returns {JSOXStringifier}
 */
JSOX.stringifier = function() {
	let classes = [];
	let useQuote = '"';

	let fieldMap = new WeakMap();
	const path = [];
	let encoding = [];
	const localToProtoTypes = new WeakMap();
	const localToObjectTypes = new Map();
	let objectToJSOX = null;
	const stringifying = []; // things that have been stringified through external toJSOX; allows second pass to skip this toJSOX pass and encode 'normally'
	let ignoreNonEnumerable = false;
	function getIdentifier(s) {
	
		if( ( "string" === typeof s ) && s === '' ) return '""';
		if( ( "number" === typeof s ) && !isNaN( s ) ) {
			return ["'",s.toString(),"'"].join('');
		}
		// should check also for if any non ident in string...
		if( s.includes( "\u{FEFF}" ) ) return (useQuote + JSOX.escape(s) +useQuote);
		return ( ( s in keywords /* [ "true","false","null","NaN","Infinity","undefined"].find( keyword=>keyword===s )*/
			|| /[0-9\-]/.test(s[0])
			|| /[\n\r\t #\[\]{}()<>\~!+*/.:,\-"'`]/.test( s ) )?(useQuote + JSOX.escape(s) +useQuote):s )
	}


	/* init prototypes */
	if( !toProtoTypes.get( Object.prototype ) )
	{
		toProtoTypes.set( Object.prototype, { external:false, name:Object.prototype.constructor.name, cb:null } );
	   
		// function https://stackoverflow.com/a/17415677/4619267
		toProtoTypes.set( Date.prototype, { external:false,
			name : "Date",
			cb : function () {
					if( this.getTime()=== -62167219200000) 
					{
						return "0000-01-01T00:00:00.000Z";
					}
					let tzo = -this.getTimezoneOffset(),
					dif = tzo >= 0 ? '+' : '-',
					pad = function(num) {
						let norm = Math.floor(Math.abs(num));
						return (norm < 10 ? '0' : '') + norm;
					},
					pad3 = function(num) {
						let norm = Math.floor(Math.abs(num));
						return (norm < 100 ? '0' : '') + (norm < 10 ? '0' : '') + norm;
					};
				return [this.getFullYear() ,
					'-' , pad(this.getMonth() + 1) ,
					'-' , pad(this.getDate()) ,
					'T' , pad(this.getHours()) ,
					':' , pad(this.getMinutes()) ,
					':' , pad(this.getSeconds()) ,
					'.' + pad3(this.getMilliseconds()) +
					dif , pad(tzo / 60) ,
					':' , pad(tzo % 60)].join("");
			} 
		} );
		toProtoTypes.set( DateNS.prototype, { external:false,
			name : "DateNS",
			cb : function () {
				let tzo = -this.getTimezoneOffset(),
					dif = tzo >= 0 ? '+' : '-',
					pad = function(num) {
						let norm = Math.floor(Math.abs(num));
						return (norm < 10 ? '0' : '') + norm;
					},
					pad3 = function(num) {
						let norm = Math.floor(Math.abs(num));
						return (norm < 100 ? '0' : '') + (norm < 10 ? '0' : '') + norm;
					},
					pad6 = function(num) {
						let norm = Math.floor(Math.abs(num));
						return (norm < 100000 ? '0' : '') + (norm < 10000 ? '0' : '') + (norm < 1000 ? '0' : '') + (norm < 100 ? '0' : '') + (norm < 10 ? '0' : '') + norm;
					};
				return [this.getFullYear() ,
					'-' , pad(this.getMonth() + 1) ,
					'-' , pad(this.getDate()) ,
					'T' , pad(this.getHours()) ,
					':' , pad(this.getMinutes()) ,
					':' , pad(this.getSeconds()) ,
					'.' + pad3(this.getMilliseconds()) + pad6(this.ns) +
					dif , pad(tzo / 60) ,
					':' , pad(tzo % 60)].join("");
			} 
		} );
		toProtoTypes.set( Boolean.prototype, { external:false, name:"Boolean", cb:this_value  } );
		toProtoTypes.set( Number.prototype, { external:false, name:"Number"
		    , cb:function(){ 
				if( isNaN(this) )  return "NaN";
				return (isFinite(this))
					? String(this)
					: (this<0)?"-Infinity":"Infinity";
		    }
		} );
		toProtoTypes.set( String.prototype, { external:false
		    , name : "String"
		    , cb:function(){ return '"' + JSOX.escape(this_value.apply(this)) + '"' } } );
		if( typeof BigInt === "function" )
			toProtoTypes.set( BigInt.prototype
			     , { external:false, name:"BigInt", cb:function() { return this + 'n' } } );
	   
		toProtoTypes.set( ArrayBuffer.prototype, { external:true, name:"ab"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this))+"]" }
		} );
	   
		toProtoTypes.set( Uint8Array.prototype, { external:true, name:"u8"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Uint8ClampedArray.prototype, { external:true, name:"uc8"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Int8Array.prototype, { external:true, name:"s8"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Uint16Array.prototype, { external:true, name:"u16"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Int16Array.prototype, { external:true, name:"s16"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Uint32Array.prototype, { external:true, name:"u32"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Int32Array.prototype, { external:true, name:"s32"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		/*
		if( typeof Uint64Array != "undefined" )
			toProtoTypes.set( Uint64Array.prototype, { external:true, name:"u64"
			    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
			} );
		if( typeof Int64Array != "undefined" )
			toProtoTypes.set( Int64Array.prototype, { external:true, name:"s64"
			    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
			} );
		*/
		toProtoTypes.set( Float32Array.prototype, { external:true, name:"f32"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Float64Array.prototype, { external:true, name:"f64"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
		toProtoTypes.set( Float64Array.prototype, { external:true, name:"f64"
		    , cb:function() { return "["+getIdentifier(base64ArrayBuffer(this.buffer))+"]" }
		} );
	   
		toProtoTypes.set( RegExp.prototype, mapToJSOX = { external:true, name:"regex"
		    , cb:function(o,stringifier){
				return "'"+escape(this.source)+"'";
			}
		} );
		fromProtoTypes.set( "regex", { protoCon:RegExp, cb:function (field,val){
			return new RegExp( this );
		} } );

		toProtoTypes.set( Map.prototype, mapToJSOX = { external:true, name:"map"
		    , cb:null
		} );
		fromProtoTypes.set( "map", { protoCon:Map, cb:function (field,val){
			if( field ) {
				this.set( field, val );
				return undefined;
			}
			return this;
		} } );
	   
		toProtoTypes.set( Array.prototype, arrayToJSOX = { external:false, name:Array.prototype.constructor.name
		    , cb: null		    
		} );

	}

	const stringifier = {
		defineClass(name,obj) { 
			let cls; 
			let denormKeys = Object.keys(obj);
			for( let i = 1; i < denormKeys.length; i++ ) {
				// normalize class key order
				let a, b;
				if( ( a = denormKeys[i-1] ) > ( b = denormKeys[i] ) ) {
					denormKeys[i-1] = b;
					denormKeys[i] = a;
					if( i ) i-=2; // go back 2, this might need to go further pack.
					else i--; // only 1 to check.
				}
			}
			classes.push( cls = { name : name
			       , tag:denormKeys.toString()
			       , proto : Object.getPrototypeOf(obj)
			       , fields : Object.keys(obj) } );

			for(let n = 1; n < cls.fields.length; n++) {
				if( cls.fields[n] < cls.fields[n-1] ) {
					let tmp = cls.fields[n-1];
					cls.fields[n-1] = cls.fields[n];
					cls.fields[n] = tmp;
					if( n > 1 )
						n-=2;
				}
			}
			if( cls.proto === Object.getPrototypeOf( {} ) ) cls.proto = null;
		},
		setDefaultObjectToJSOX( cb ) { objectToJSOX = cb; },
		isEncoding(o) {
			//console.log( "is object encoding?", encoding.length, o, encoding );
			return !!encoding.find( (eo,i)=>eo===o && i < (encoding.length-1) )
		},
		encodeObject(o) {
			if( objectToJSOX ) 
				return objectToJSOX.apply(o, [this]);
			return o;
		},
		stringify(o,r,s) { return stringify(o,r,s) },
		setQuote(q) { useQuote = q; },
		registerToJSOX(n,p,f) { return this.toJSOX( n,p,f ) },
		toJSOX( name, ptype, f ) {
			if( ptype.prototype && ptype.prototype !== Object.prototype ) {
				if( localToProtoTypes.get(ptype.prototype) ) throw new Error( "Existing toJSOX has been registered for prototype" );
				localToProtoTypes.set( ptype.prototype, { external:true, name:name||f.constructor.name, cb:f } );
			} else {
				let key = Object.keys( ptype ).toString();
				if( localToObjectTypes.get(key) ) throw new Error( "Existing toJSOX has been registered for object type" );
				localToObjectTypes.set( key, { external:true, name:name, cb:f } );
			}
		},
		get ignoreNonEnumerable() { return ignoreNonEnumerable; },
		set ignoreNonEnumerable(val) { ignoreNonEnumerable = val; },
	};
	return stringifier;

	/**
	 * get a reference to a previously seen object
	 * @param {any} here 
	 * @returns reference to existing object, or undefined if not found.
	 */
	function getReference( here ) {
		if( here === null ) return undefined;
		let field = fieldMap.get( here );
		//_DEBUG_STRINGIFY && console.log( "path:", _JSON.stringify(path), field );
		if( !field ) {
			fieldMap.set( here, _JSON.stringify(path) );
			return undefined;
		}
		return "ref"+field;
	}


	/**
	 * find the prototype definition for a class
	 * @param {object} o 
	 * @param {map} useK 
	 * @returns object
	 */
	function matchObject(o,useK) {
		let k;
		let cls;
		let prt = Object.getPrototypeOf(o);
		cls = classes.find( cls=>{
			if( cls.proto && cls.proto === prt ) return true;
		} );
		if( cls ) return cls;

		if( classes.length || commonClasses.length ) {
			if( useK )  {
				useK = useK.map( v=>{ if( typeof v === "string" ) return v; else return undefined; } );
				k = useK.toString();
			} else {
				let denormKeys = Object.keys(o);
				for( let i = 1; i < denormKeys.length; i++ ) {
					let a, b;
					if( ( a = denormKeys[i-1] ) > ( b = denormKeys[i] ) ) {
						denormKeys[i-1] = b;
						denormKeys[i] = a;
						if( i ) i-=2; // go back 2, this might need to go further pack.
						else i--; // only 1 to check.
					}
				}
				k = denormKeys.toString();
			}
			cls = classes.find( cls=>{
				if( cls.tag === k ) return true;
			} );
			if( !cls )
				cls = commonClasses.find( cls=>{
					if( cls.tag === k ) return true;
				} );
		}
		return cls;
	}

	/**
	 * Serialize an object to JSOX text.
	 * @param {any} object 
	 * @param {(key:string,value:any)=>string} replacer 
	 * @param {string|number} space 
	 * @returns 
	 */
	function stringify( object, replacer, space ) {
		if( object === undefined ) return "undefined";
		if( object === null ) return;
		let gap;
		let indent;
		let rep;

		let i;
		const spaceType = typeof space;
		const repType = typeof replacer;
		gap = "";
		indent = "";

		// If the space parameter is a number, make an indent string containing that
		// many spaces.

		if (spaceType === "number") {
			for (i = 0; i < space; i += 1) {
				indent += " ";
			}

		// If the space parameter is a string, it will be used as the indent string.
		} else if (spaceType === "string") {
			indent = space;
		}

		// If there is a replacer, it must be a function or an array.
		// Otherwise, throw an error.

		rep = replacer;
		if( replacer && repType !== "function"
		    && ( repType !== "object"
		       || typeof replacer.length !== "number"
		   )) {
			throw new Error("JSOX.stringify");
		}

		path.length = 0;
		fieldMap = new WeakMap();

		const finalResult = str( "", {"":object} );
		commonClasses.length = 0;
		return finalResult;

		// from https://github.com/douglascrockford/JSON-js/blob/master/json2.js#L181
		function str(key, holder) {
			var mind = gap;
			const doArrayToJSOX_ = arrayToJSOX.cb;
			const mapToObject_ = mapToJSOX.cb;		 
			arrayToJSOX.cb = doArrayToJSOX;
			mapToJSOX.cb = mapToObject;
			const v = str_(key,holder);
			arrayToJSOX.cb = doArrayToJSOX_;
			mapToJSOX.cb = mapToObject_;
			return v;

			function doArrayToJSOX() {
				let v;
				let partial = [];
				let thisNodeNameIndex = path.length;

				// The value is an array. Stringify every element. Use null as a placeholder
				// for non-JSOX values.
			
				for (let i = 0; i < this.length; i += 1) {
					path[thisNodeNameIndex] = i;
					partial[i] = str(i, this) || "null";
				}
				path.length = thisNodeNameIndex;
				//console.log( "remove encoding item", thisNodeNameIndex, encoding.length);
				encoding.length = thisNodeNameIndex;
			
				// Join all of the elements together, separated with commas, and wrap them in
				// brackets.
				v = ( partial.length === 0
					? "[]"
					: gap
						? [
							"[\n"
							, gap
							, partial.join(",\n" + gap)
							, "\n"
							, mind
							, "]"
						].join("")
						: "[" + partial.join(",") + "]" );
				return v;
			} 
			function mapToObject(){
				//_DEBUG_PARSING_DETAILS && console.log( "---------- NEW MAP -------------" );
				let tmp = {tmp:null};
				let out = '{';
				let first = true;
				//console.log( "CONVERT:", map);
				for (let [key, value] of this) {
					//console.log( "er...", key, value )
					tmp.tmp = value;
					let thisNodeNameIndex = path.length;
					path[thisNodeNameIndex] = key;
							
					out += (first?"":",") + getIdentifier(key) +':' + str("tmp", tmp);
					path.length = thisNodeNameIndex;
					first = false;
				}
				out += '}';
				//console.log( "out is:", out );
				return out;
			}

		// Produce a string from holder[key].
		function str_(key, holder) {

			let i;          // The loop counter.
			let k;          // The member key.
			let v;          // The member value.
			let length;
			let partialClass;
			let partial;
			let thisNodeNameIndex = path.length;
			let isValue = true;
			let value = holder[key];
			let isObject = (typeof value === "object");
			let c;

			if( isObject && ( value !== null ) ) {
				if( objectToJSOX ){
					if( !stringifying.find( val=>val===value ) ) {
						stringifying.push( value );
						encoding[thisNodeNameIndex] = value;
						isValue = false;
						value = objectToJSOX.apply(value, [stringifier]);
						//console.log( "Converted by object lookup -it's now a different type"
						//	, protoConverter, objectConverter );
						isObject = ( typeof value === "object" );
						stringifying.pop();
						encoding.length = thisNodeNameIndex;
						isObject = (typeof value === "object");
					}
					//console.log( "Value convereted to:", key, value );
				}
			}
			const objType = (value !== undefined && value !== null) && Object.getPrototypeOf( value );
			
			let protoConverter = objType
				&& ( localToProtoTypes.get( objType ) 
				|| toProtoTypes.get( objType ) 
				|| null );
			let objectConverter = !protoConverter && (value !== undefined && value !== null) 
				&& ( localToObjectTypes.get( Object.keys( value ).toString() ) 
				|| toObjectTypes.get( Object.keys( value ).toString() ) 
				|| null );

			// If we were called with a replacer function, then call the replacer to
			// obtain a replacement value.

			if (typeof rep === "function") {
				isValue = false;
				value = rep.call(holder, key, value);
			}
				//console.log( "PROTOTYPE:", Object.getPrototypeOf( value ) )
				//console.log( "PROTOTYPE:", toProtoTypes.get(Object.getPrototypeOf( value )) )
				//if( protoConverter )
			//_DEBUG_STRINGIFY && console.log( "TEST()", value, protoConverter, objectConverter );

			let toJSOX = ( protoConverter && protoConverter.cb ) 
			          || ( objectConverter && objectConverter.cb );
			// If the value has a toJSOX method, call it to obtain a replacement value.
			//_DEBUG_STRINGIFY && console.log( "type:", typeof value, protoConverter, !!toJSOX, path );

			if( value !== undefined
			    && value !== null
				&& typeof value === "object"
			    && typeof toJSOX === "function"
			) {
				if( !stringifying.find( val=>val===value ) ) {
					if( typeof value === "object" ) {
						v = getReference( value );
						if( v )	return v;
					}

					stringifying.push( value );
					encoding[thisNodeNameIndex] = value;
					value = toJSOX.call(value, stringifier);
					isValue = false;
					stringifying.pop();
					if( protoConverter && protoConverter.name ) {
						// stringify may return a unquoted string
						// which needs an extra space betwen its tag and value.
						if( "string" === typeof value 
							&& value[0] !== '-'
							&& (value[0] < '0' || value[0] > '9' )
							&& value[0] !== '"'
							&& value[0] !== '\'' 
							&& value[0] !== '`' 
							&& value[0] !== '[' 
							&& value[0] !== '{' 
							){
							value = ' ' + value;
						}
					}
					//console.log( "Value converted:", value );
					encoding.length = thisNodeNameIndex;
				} else {
					v = getReference( value );
				}
		} else 
				if( typeof value === "object" ) {
					v = getReference( value );
					if( v ) return v;
				}

			// What happens next depends on the value's type.
			switch (typeof value) {
			case "bigint":
				return value + 'n';
			case "string":
				{
					//console.log( `Value was converted before?  [${value}]`);
					value = isValue?getIdentifier(value):value;
					let c = '';
					if( key==="" )
						c = classes.map( cls=> cls.name+"{"+cls.fields.join(",")+"}" ).join(gap?"\n":"")+
						    commonClasses.map( cls=> cls.name+"{"+cls.fields.join(",")+"}" ).join(gap?"\n":"")
								+(gap?"\n":"");
					if( protoConverter && protoConverter.external ) 
						return c + protoConverter.name + value;
					if( objectConverter && objectConverter.external ) 
						return c + objectConverter.name + value;
					return c + value;//useQuote+JSOX.escape( value )+useQuote;
				}
			case "number":
			case "boolean":
			case "null":

				// If the value is a boolean or null, convert it to a string. Note:
				// typeof null does not produce "null". The case is included here in
				// the remote chance that this gets fixed someday.

				return String(value);

				// If the type is "object", we might be dealing with an object or an array or
				// null.

			case "object":
				//_DEBUG_STRINGIFY && console.log( "ENTERINT OBJECT EMISSION WITH:", v );
				if( v ) return v;

				// Due to a specification blunder in ECMAScript, typeof null is "object",
				// so watch out for that case.
				if (!value) {
					return "null";
				}

				// Make an array to hold the partial results of stringifying this object value.
				gap += indent;
				partialClass = null;
				partial = [];

				// If the replacer is an array, use it to select the members to be stringified.
				if (rep && typeof rep === "object") {
					length = rep.length;
					partialClass = matchObject( value, rep );
					for (i = 0; i < length; i += 1) {
						if (typeof rep[i] === "string") {
							k = rep[i];
							path[thisNodeNameIndex] = k;
							v = str(k, value);

							if (v !== undefined ) {
								if( partialClass ) {
									partial.push(v);
								} else
									partial.push( getIdentifier(k) 
									+ (
										(gap)
											? ": "
											: ":"
									) + v);
							}
						}
					}
					path.splice( thisNodeNameIndex, 1 );
				} else {

					// Otherwise, iterate through all of the keys in the object.
					partialClass = matchObject( value );
					let keys = [];
					for (k in value) {
						if( ignoreNonEnumerable )
							if( !Object.prototype.propertyIsEnumerable.call( value, k ) ){
								//_DEBUG_STRINGIFY && console.log( "skipping non-enuerable?", k );
								continue;
							}
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							let n;
							for( n = 0; n < keys.length; n++ ) 
								if( keys[n] > k ) {	
									keys.splice(n,0,k );
									break;
								}
							if( n == keys.length )
								keys.push(k);
						}
					}
					for(let n = 0; n < keys.length; n++) {
						k = keys[n];
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							path[thisNodeNameIndex] = k;
							v = str(k, value);

							if (v !== undefined ) {
								if( partialClass ) {
									partial.push(v);
								} else
									partial.push(getIdentifier(k) + (
										(gap)
											? ": "
											: ":"
									) + v);
							}
						}
					}
					path.splice( thisNodeNameIndex, 1 );
				}

				// Join all of the member texts together, separated with commas,
				// and wrap them in braces.
				//_DEBUG_STRINGIFY && console.log( "partial:", partial )

				//let c;
				if( key==="" )
					c = ( classes.map( cls=> cls.name+"{"+cls.fields.join(",")+"}" ).join(gap?"\n":"")
						|| commonClasses.map( cls=> cls.name+"{"+cls.fields.join(",")+"}" ).join(gap?"\n":""))+(gap?"\n":"");
				else
					c = '';

				if( protoConverter && protoConverter.external ) 
					c = c + getIdentifier(protoConverter.name);

				//_DEBUG_STRINGIFY && console.log( "PREFIX FOR THIS FIELD:", c );
				let ident = null;
				if( partialClass )
					ident = getIdentifier( partialClass.name ) ;
				v = c +
					( partial.length === 0
					? "{}"
					: gap
							? (partialClass?ident:"")+"{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
							: (partialClass?ident:"")+"{" + partial.join(",") + "}"
					);

				gap = mind;
				return v;
			}
		}
	}

	}
};

	// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
	// use window.btoa' step. According to my tests, this appears to be a faster approach:
	// http://jsperf.com/encoding-xhr-image-data/5
	// doesn't have to be reversable....
	const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_';
	const decodings = { '~':-1
		,'=':-1
		,'$':62
		,'_':63
		,'+':62
		,'-':62
		,'.':62
		,'/':63
		,',':63
	};
	
	for( let x = 0; x < encodings.length; x++ ) {
		decodings[encodings[x]] = x;
	}
	Object.freeze( decodings );
	
	function base64ArrayBuffer(arrayBuffer) {
		let base64    = '';
	
		let bytes         = new Uint8Array(arrayBuffer);
		let byteLength    = bytes.byteLength;
		let byteRemainder = byteLength % 3;
		let mainLength    = byteLength - byteRemainder;
	
		let a, b, c, d;
		let chunk;
		//throw "who's using this?"
		//console.log( "buffer..", arrayBuffer )
		// Main loop deals with bytes in chunks of 3
		for (let i = 0; i < mainLength; i = i + 3) {
			// Combine the three bytes into a single integer
			chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

			// Use bitmasks to extract 6-bit segments from the triplet
			a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
			b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
			c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
			d = chunk & 63;               // 63       = 2^6 - 1
	
			// Convert the raw binary segments to the appropriate ASCII encoding
			base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
		}
	
	// Deal with the remaining bytes and padding
		if (byteRemainder == 1) {
			chunk = bytes[mainLength];
			a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
			// Set the 4 least significant bits to zero
			b = (chunk & 3)   << 4; // 3   = 2^2 - 1
			base64 += encodings[a] + encodings[b] + '==';
		} else if (byteRemainder == 2) {
			chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
			a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
			b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4
			// Set the 2 least significant bits to zero
			c = (chunk & 15)    <<  2; // 15    = 2^4 - 1
			base64 += encodings[a] + encodings[b] + encodings[c] + '=';
		}
		//console.log( "dup?", base64)
		return base64
	}
	
	
	function DecodeBase64( buf ) {	
		let outsize;
		if( buf.length % 4 == 1 )
			outsize = ((((buf.length + 3) / 4)|0) * 3) - 3;
		else if( buf.length % 4 == 2 )
			outsize = ((((buf.length + 3) / 4)|0) * 3) - 2;
		else if( buf.length % 4 == 3 )
			outsize = ((((buf.length + 3) / 4)|0) * 3) - 1;
		else if( decodings[buf[buf.length - 3]] == -1 )
			outsize = ((((buf.length + 3) / 4)|0) * 3) - 3;
		else if( decodings[buf[buf.length - 2]] == -1 ) 
			outsize = ((((buf.length + 3) / 4)|0) * 3) - 2;
		else if( decodings[buf[buf.length - 1]] == -1 ) 
			outsize = ((((buf.length + 3) / 4)|0) * 3) - 1;
		else
			outsize = ((((buf.length + 3) / 4)|0) * 3);
		let ab = new ArrayBuffer( outsize );
		let out = new Uint8Array(ab);

		let n;
		let l = (buf.length+3)>>2;
		for( n = 0; n < l; n++ ) {
			let index0 = decodings[buf[n*4]];
			let index1 = (n*4+1)<buf.length?decodings[buf[n*4+1]]:-1;
			let index2 = (index1>=0) && (n*4+2)<buf.length?decodings[buf[n*4+2]]:-1 || -1;
			let index3 = (index2>=0) && (n*4+3)<buf.length?decodings[buf[n*4+3]]:-1 || -1;
			if( index1 >= 0 )
				out[n*3+0] = (( index0 ) << 2 | ( index1 ) >> 4);
			if( index2 >= 0 )
				out[n*3+1] = (( index1 ) << 4 | ( ( ( index2 ) >> 2 ) & 0x0f ));
			if( index3 >= 0 )
				out[n*3+2] = (( index2 ) << 6 | ( ( index3 ) & 0x3F ));
		}

		return ab;
	}
	
/**
 * @param {unknown} object 
 * @param {(this: unknown, key: string, value: unknown)} [replacer] 
 * @param {string | number} [space] 
 * @returns {string}
 */	
JSOX.stringify = function( object, replacer, space ) {
	let stringifier = JSOX.stringifier();
	return stringifier.stringify( object, replacer, space );
};

const nonIdent = 
[ [ 0,256,[ 0xffd9ff,0xff6aff,0x1fc00,0x380000,0x0,0xfffff8,0xffffff,0x7fffff] ]
].map( row=>{ return { firstChar : row[0], lastChar: row[1], bits : row[2] }; } );

"use strict";
const DEFAULT_SETTINGS = {
  core: {
    mode: "native",
    endpointUrl: "http://localhost:6065",
    userId: "",
    userKey: "",
    encrypt: false,
    preferBackendSync: true,
    ntpEnabled: false,
    ops: {
      allowUnencrypted: false,
      httpTargets: [],
      wsTargets: [],
      syncTargets: []
    }
  },
  ai: {
    apiKey: "",
    baseUrl: "",
    model: "gpt-5.2",
    customModel: "",
    mcp: [],
    shareTargetMode: "recognize",
    autoProcessShared: true,
    customInstructions: [],
    activeInstructionId: "",
    responseLanguage: "auto",
    translateResults: false,
    generateSvgGraphics: false,
    requestTimeout: {
      low: 60,
      // 1 minute
      medium: 300,
      // 5 minutes
      high: 900
      // 15 minutes
    },
    maxRetries: 2
  },
  webdav: {
    url: "http://localhost:6065",
    username: "",
    password: "",
    token: ""
  },
  timeline: {
    source: ""
  },
  appearance: {
    theme: "auto",
    fontSize: "medium",
    color: ""
  },
  speech: {
    language: typeof navigator !== "undefined" ? navigator.language : "en-US"
  },
  grid: {
    columns: 4,
    rows: 8,
    shape: "square"
  }
};

"use strict";
const sanitizeFileName = (name, fallbackExt = "") => {
  const parts = String(name || "").split("/").pop() || "";
  const base = parts.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_.\-+#&]/g, "-");
  if (fallbackExt && !base.includes(".")) return `${base || Date.now()}${fallbackExt.startsWith(".") ? "" : "."}${fallbackExt}`;
  return base || `${Date.now()}`;
};
const toSlug = (input, toLower = true) => {
  let s = String(input || "").trim();
  if (toLower) s = s.toLowerCase();
  s = s.replace(/\s+/g, "-");
  s = s.replace(/[^a-z0-9_.\-+#&]/g, "-");
  s = s.replace(/-+/g, "-");
  return s;
};
const inferExtFromMime = (mime = "") => {
  if (!mime) return "";
  if (mime.includes("json")) return "json";
  if (mime.includes("markdown")) return "md";
  if (mime.includes("plain")) return "txt";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime.startsWith("image/")) return mime.split("/").pop() || "";
  if (mime.includes("html")) return "html";
  return "";
};
const splitPath$1 = (path) => String(path || "").split("/").filter(Boolean);
const ensureDir = (p) => p.endsWith("/") ? p : p + "/";
const joinPath$1 = (parts, absolute = true) => (absolute ? "/" : "") + parts.filter(Boolean).join("/");
const sanitizePathSegments = (path) => {
  const parts = splitPath$1(path);
  return joinPath$1(parts.map((p) => toSlug(p)));
};
const DEFAULT_ARRAY_KEYS = ["id", "_id", "key", "slug", "name"];
const isPlainObject = (v) => Object.prototype.toString.call(v) === "[object Object]";
function dedupeArray(items, opts) {
  const keys = Array.isArray(opts.arrayKey) ? opts.arrayKey : opts.arrayKey ? [opts.arrayKey] : DEFAULT_ARRAY_KEYS;
  const result = [];
  const primitiveSet = /* @__PURE__ */ new Set();
  const objMap = /* @__PURE__ */ new Map();
  const stringifiedSet = /* @__PURE__ */ new Set();
  for (const it of items) {
    if (it == null) continue;
    if (isPlainObject(it)) {
      let dedupeKey;
      for (const k of keys) {
        if (k in it && it[k] != null) {
          dedupeKey = String(it[k]);
          break;
        }
      }
      if (dedupeKey != null) {
        if (!objMap.has(dedupeKey)) {
          objMap.set(dedupeKey, it);
          result.push(it);
        }
      } else {
        const sig = safeStableStringify(it);
        if (!stringifiedSet.has(sig)) {
          stringifiedSet.add(sig);
          result.push(it);
        }
      }
    } else if (Array.isArray(it)) {
      const sig = safeStableStringify(it);
      if (!stringifiedSet.has(sig)) {
        stringifiedSet.add(sig);
        result.push(it);
      }
    } else {
      if (!primitiveSet.has(it)) {
        primitiveSet.add(it);
        result.push(it);
      }
    }
  }
  return result;
}
function mergeDeepUnique(a, b, opts) {
  if (Array.isArray(a) && Array.isArray(b)) {
    switch (opts.arrayStrategy) {
      case "replace":
        return b.slice();
      case "concat":
        return a.concat(b);
      case "union":
      default:
        return dedupeArray(a.concat(b), { arrayKey: opts.arrayKey });
    }
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const out = { ...a };
    for (const k of Object.keys(b)) {
      if (k in a) {
        out[k] = mergeDeepUnique(a[k], b[k], opts);
      } else {
        out[k] = b[k];
      }
    }
    return out;
  }
  return b;
}
function safeStableStringify(obj) {
  if (!isPlainObject(obj)) return JSON.stringify(obj);
  const keys = Object.keys(obj).sort();
  const o = {};
  for (const k of keys) o[k] = obj[k];
  return JSON.stringify(o);
}
async function blobToText(blob) {
  return await blob.text();
}
async function readFileAsJson(root, fullPath) {
  try {
    const existing = await readFile(root, fullPath)?.catch?.(console.warn.bind(console));
    if (!existing) return null;
    const text = await blobToText(existing);
    if (!text?.trim()) return null;
    return JSOX.parse(text);
  } catch {
    return null;
  }
}
const writeFileSmart = async (root, dirOrPath, file, options = {}) => {
  const {
    forceExt,
    ensureJson,
    toLower = true,
    sanitize = true,
    mergeJson,
    arrayStrategy = "union",
    arrayKey,
    jsonSpace = 2
  } = options;
  let raw = String(dirOrPath || "").trim();
  const isDirHint = raw.endsWith("/");
  const hasFileToken = !isDirHint && splitPath$1(raw).length > 0 && raw.includes(".");
  let dirPath = isDirHint ? raw : hasFileToken ? raw.split("/").slice(0, -1).join("/") : raw;
  let desiredName = hasFileToken ? raw.split("/").pop() || "" : file?.name || "";
  dirPath = dirPath || "/";
  desiredName = desiredName || Date.now() + "";
  const lastDot = desiredName.lastIndexOf(".");
  let base = lastDot > 0 ? desiredName.slice(0, lastDot) : desiredName;
  let ext = forceExt || (ensureJson ? "json" : lastDot > 0 ? desiredName.slice(lastDot + 1) : inferExtFromMime(file?.type || "")) || "";
  if (sanitize) {
    dirPath = sanitizePathSegments(dirPath);
    base = toSlug(base, toLower);
  }
  const finalName = ext ? `${base}.${ext}` : base;
  const fullPath = ensureDir(dirPath) + finalName;
  const shouldMergeJson = mergeJson !== false && (ensureJson || ext.toLowerCase() === "json" || file?.type === "application/json");
  if (shouldMergeJson) {
    try {
      let incomingJson;
      if (file instanceof File || file instanceof Blob) {
        const txt = await blobToText(file);
        incomingJson = txt?.trim() ? JSOX.parse(txt) : {};
      } else {
        incomingJson = file;
      }
      const existingJson = await readFileAsJson(root, fullPath)?.catch?.(console.warn.bind(console));
      let merged = existingJson != null ? mergeDeepUnique(existingJson, incomingJson, { arrayStrategy, arrayKey }) : incomingJson;
      const jsonString = JSON.stringify(merged, void 0, jsonSpace);
      const toWrite2 = new File([jsonString], finalName, { type: "application/json" });
      const rs2 = await writeFile(root, fullPath, toWrite2)?.catch?.(console.warn.bind(console));
      if (typeof document !== "undefined")
        document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", {
          detail: rs2,
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      return rs2;
    } catch (err) {
      console.warn("writeFileSmart JSON merge failed, falling back to raw write:", err);
    }
  }
  let toWrite;
  if (file instanceof File) {
    if (file.name === finalName) {
      toWrite = file;
    } else {
      const type = file.type || (ext ? `application/${ext}` : "application/octet-stream");
      const buf = await file.arrayBuffer();
      toWrite = new File([buf], finalName, { type });
    }
  } else {
    const type = file.type || (ext ? `application/${ext}` : "application/octet-stream");
    const blob = file;
    toWrite = new File([await blob.arrayBuffer()], finalName, { type });
  }
  const rs = await writeFile(root, fullPath, toWrite)?.catch?.(console.warn.bind(console));
  if (typeof document !== "undefined")
    document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", {
      detail: rs,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  return rs;
};

"use strict";
const SETTINGS_KEY = "rs-settings";
const splitPath = (path) => path.split(".");
const getByPath = (source, path) => splitPath(path).reduce((acc, key) => acc == null ? acc : acc[key], source);
const slugify = (value) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
const DB_NAME = "req-store";
const STORE = "settings";
let createWebDavClient = null;
const getWebDavCreateClient = async () => {
  if (createWebDavClient) return createWebDavClient;
  try {
    const mod = await __vitePreload(() => import('./index14.js'),true              ?[]:void 0,import.meta.url);
    if (typeof mod?.createClient === "function") {
      createWebDavClient = mod.createClient;
      return createWebDavClient;
    }
  } catch {
  }
  return null;
};
const isContentScriptContext = () => {
  try {
    if (typeof chrome === "undefined" || !chrome?.runtime) return false;
    if (typeof window !== "undefined" && globalThis?.location?.protocol?.startsWith("http")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
const hasChromeStorage = () => typeof chrome !== "undefined" && chrome?.storage?.local;
async function idbOpen() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB not available");
  }
  if (isContentScriptContext()) {
    throw new Error("IndexedDB not accessible in content script context");
  }
  return new Promise((res, rej) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "key" });
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    } catch (e) {
      rej(e);
    }
  });
}
const idbGetSettings = async (key = SETTINGS_KEY) => {
  try {
    if (hasChromeStorage()) {
      console.log("[Settings] Using chrome.storage.local for get");
      return new Promise((res) => {
        try {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
              console.warn("[Settings] chrome.storage.local.get error:", chrome.runtime.lastError);
              res(null);
            } else {
              console.log("[Settings] chrome.storage.local.get success, has data:", !!result[key]);
              res(result[key]);
            }
          });
        } catch (e) {
          console.warn("[Settings] chrome.storage access failed:", e);
          res(null);
        }
      });
    }
    if (typeof indexedDB === "undefined") {
      console.warn("[Settings] IndexedDB not available");
      return null;
    }
    console.log("[Settings] Using IndexedDB for get");
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        console.log("[Settings] IndexedDB get success, has data:", !!req.result?.value);
        res(req.result?.value);
        db.close();
      };
      req.onerror = () => {
        console.warn("[Settings] IndexedDB get error:", req.error);
        rej(req.error);
        db.close();
      };
    });
  } catch (e) {
    console.warn("[Settings] Settings storage access failed:", e);
    return null;
  }
};
const idbPutSettings = async (value, key = SETTINGS_KEY) => {
  try {
    if (hasChromeStorage()) {
      return new Promise((res, rej) => {
        try {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
              rej(chrome.runtime.lastError);
            } else {
              res();
            }
          });
        } catch (e) {
          console.warn("chrome.storage write failed:", e);
          rej(e);
        }
      });
    }
    if (typeof indexedDB === "undefined") {
      console.warn("IndexedDB not available");
      return;
    }
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ key, value });
      tx.oncomplete = () => {
        res(void 0);
        db.close();
      };
      tx.onerror = () => {
        rej(tx.error);
        db.close();
      };
    });
  } catch (e) {
    console.warn("Settings storage write failed:", e);
  }
};
const loadSettings = async () => {
  try {
    const raw = await idbGetSettings();
    const stored = typeof raw === "string" ? JSOX.parse(raw) : raw;
    console.log("[Settings] loadSettings - raw type:", typeof raw, "stored type:", typeof stored);
    if (stored && typeof stored === "object") {
      const result = {
        core: {
          ...DEFAULT_SETTINGS.core,
          ...stored?.core
        },
        ai: {
          ...DEFAULT_SETTINGS.ai,
          ...stored?.ai,
          mcp: stored?.ai?.mcp || [],
          customInstructions: stored?.ai?.customInstructions || [],
          activeInstructionId: stored?.ai?.activeInstructionId || ""
        },
        webdav: { ...DEFAULT_SETTINGS.webdav, ...stored?.webdav },
        timeline: { ...DEFAULT_SETTINGS.timeline, ...stored?.timeline },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...stored?.appearance },
        speech: { ...DEFAULT_SETTINGS.speech, ...stored?.speech },
        grid: { ...DEFAULT_SETTINGS.grid, ...stored?.grid }
      };
      console.log("[Settings] loadSettings result:", {
        hasApiKey: !!result.ai?.apiKey,
        instructionCount: result.ai?.customInstructions?.length || 0,
        activeInstructionId: result.ai?.activeInstructionId || "(none)"
      });
      return result;
    }
    console.log("[Settings] loadSettings - no stored data, returning defaults");
  } catch (e) {
    console.warn("[Settings] loadSettings error:", e);
  }
  return JSOX.parse(JSOX.stringify(DEFAULT_SETTINGS));
};
const saveSettings = async (settings) => {
  const current = await loadSettings();
  const getMcp = () => {
    if (settings.ai?.mcp !== void 0) return settings.ai.mcp;
    if (current.ai?.mcp !== void 0) return current.ai.mcp;
    return [];
  };
  const getCustomInstructions = () => {
    if (settings.ai?.customInstructions !== void 0) return settings.ai.customInstructions;
    if (current.ai?.customInstructions !== void 0) return current.ai.customInstructions;
    return [];
  };
  const getActiveInstructionId = () => {
    if (Object.prototype.hasOwnProperty.call(settings.ai || {}, "activeInstructionId")) {
      return settings.ai?.activeInstructionId ?? "";
    }
    if (current.ai?.activeInstructionId !== void 0) {
      return current.ai.activeInstructionId;
    }
    return "";
  };
  const merged = {
    core: {
      ...DEFAULT_SETTINGS.core || {},
      ...current.core || {},
      ...settings.core || {}
    },
    ai: {
      ...DEFAULT_SETTINGS.ai || {},
      ...current.ai || {},
      ...settings.ai || {},
      mcp: getMcp(),
      customInstructions: getCustomInstructions(),
      activeInstructionId: getActiveInstructionId()
    },
    webdav: {
      ...DEFAULT_SETTINGS.webdav || {},
      ...current.webdav || {},
      ...settings.webdav || {}
    },
    timeline: {
      ...DEFAULT_SETTINGS.timeline || {},
      ...current.timeline || {},
      ...settings.timeline || {}
    },
    appearance: {
      ...DEFAULT_SETTINGS.appearance || {},
      ...current.appearance || {},
      ...settings.appearance || {}
    },
    speech: {
      ...DEFAULT_SETTINGS.speech || {},
      ...current.speech || {},
      ...settings.speech || {}
    },
    grid: {
      ...DEFAULT_SETTINGS.grid || {},
      ...current.grid || {},
      ...settings.grid || {}
    }
  };
  await idbPutSettings(merged);
  updateWebDavSettings(merged)?.catch?.(console.warn.bind(console));
  return merged;
};
const joinPath = (base, name, addTrailingSlash = false) => {
  const b = (base || "/").replace(/\/+$/g, "") || "/";
  const n = (name || "").replace(/^\/+/g, "");
  let out = b === "/" ? `/${n}` : `${b}/${n}`;
  if (addTrailingSlash) out = out.replace(/\/?$/g, "/");
  return out.replace(/\/{2,}/g, "/");
};
const isDirHandle = (h) => h?.kind === "directory";
const safeTime = (v) => {
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};
const downloadContentsToOPFS = async (webDavClient, path = "/", opts = {}, rootHandle = null) => {
  const files = await webDavClient?.getDirectoryContents?.(path || "/")?.catch?.((e) => {
    console.warn(e);
    return [];
  });
  if (opts.pruneLocal && files?.length > 0) {
    try {
      const dirHandle = await getDirectoryHandle(rootHandle, path)?.catch?.(() => null);
      if (dirHandle?.entries) {
        const localEntries = await Array.fromAsync(dirHandle.entries());
        const remoteNames = new Set(files?.map?.((f) => f?.basename).filter(Boolean));
        await Promise.all(
          localEntries.filter(([name]) => !remoteNames.has(name)).map(
            ([name]) => dirHandle.removeEntry(name, { recursive: true })?.catch?.(console.warn.bind(console))
          )
        );
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return Promise.all(
    files.map(async (file) => {
      const isDir = file?.type === "directory";
      const fullPath = isDir ? joinPath(file.filename, "", true) : file.filename;
      if (isDir) {
        return downloadContentsToOPFS(webDavClient, fullPath, opts, rootHandle);
      }
      if (file?.type === "file") {
        const localMeta = await readFile(rootHandle, fullPath).catch(() => null);
        const localMtime = safeTime(localMeta?.lastModified);
        const remoteMtime = safeTime(file?.lastmod);
        if (remoteMtime > localMtime) {
          const contents = await webDavClient.getFileContents(fullPath).catch((e) => {
            console.warn(e);
            return null;
          });
          if (!contents || contents.byteLength === 0) return;
          const mime = file?.mime || "application/octet-stream";
          return writeFileSmart(rootHandle, fullPath, new File([contents], file.basename, { type: mime }));
        }
      }
    })
  );
};
const uploadOPFSToWebDav = async (webDavClient, dirHandle = null, path = "/", opts = {}) => {
  const effectiveDirHandle = dirHandle ?? await getDirectoryHandle(null, path, { create: true })?.catch?.(console.warn.bind(console));
  const entries = await Array.fromAsync(effectiveDirHandle?.entries?.() ?? []);
  if (path != "/") {
    if (opts.pruneRemote && entries?.length >= 0) {
      const remoteItems = await webDavClient.getDirectoryContents(path || "/").catch((e) => {
        console.warn(e);
        return [];
      });
      const localSet = new Set(
        entries.map(([name]) => name.toLowerCase())
      );
      const extra = remoteItems.filter((r) => {
        const base = (r?.basename || "").toLowerCase();
        return base && !localSet.has(base);
      });
      const filesFirst = [
        ...extra.filter((x) => x.type !== "directory")
        //...extra.filter((x) => x.type === 'directory'),
      ];
      for (const r of filesFirst) {
        const remotePath = r.filename || joinPath(path, r.basename, r.type === "directory");
        try {
          await webDavClient.deleteFile(remotePath);
        } catch (e) {
          console.warn("delete failed:", remotePath, e);
        }
      }
    }
  }
  await Promise.all(
    entries.map(async ([name, fileOrDir]) => {
      const isDir = isDirHandle(fileOrDir);
      const remotePath = joinPath(path, name, isDir);
      if (isDir) {
        const dirPathNoSlash = joinPath(path, name, false);
        const exists = await webDavClient.exists(dirPathNoSlash).catch((_e) => {
          return false;
        });
        if (!exists) {
          await webDavClient.createDirectory(dirPathNoSlash, { recursive: true }).catch(console.warn);
        }
        return uploadOPFSToWebDav(webDavClient, fileOrDir, remotePath, opts);
      }
      const fileHandle = fileOrDir;
      const fileContent = await fileHandle.getFile();
      if (!fileContent || fileContent.size === 0) return;
      const fullFilePath = joinPath(path, name, false);
      const remoteStat = await webDavClient.stat(fullFilePath).catch(() => null);
      const remoteMtime = safeTime(remoteStat?.lastmod);
      const localMtime = safeTime(fileContent.lastModified);
      if (!remoteStat || localMtime > remoteMtime) {
        await webDavClient.putFileContents(fullFilePath, await fileContent.arrayBuffer(), { overwrite: true }).catch((_e) => {
          return null;
        });
      }
    })
  );
};
const getHostOnly = (address) => {
  const url = new URL(address);
  return url.protocol + url.hostname + ":" + url.port;
};
const WebDavSync = async (address, options = {}) => {
  const createClient = await getWebDavCreateClient();
  if (!createClient) return null;
  const client = createClient(getHostOnly(address), options);
  const status = currentWebDav?.sync?.getDAVCompliance?.()?.catch?.(console.warn.bind(console)) ?? null;
  return {
    status,
    client,
    upload(withPrune = false) {
      if (this.status != null) {
        return uploadOPFSToWebDav(client, null, "/", { pruneRemote: withPrune })?.catch?.((e) => {
          console.warn(e);
          return [];
        });
      }
    },
    download(withPrune = false) {
      if (this.status != null) {
        return downloadContentsToOPFS(client, "/", { pruneLocal: withPrune })?.catch?.((e) => {
          console.warn(e);
          return [];
        });
      }
    }
  };
};
const currentWebDav = { sync: null };
if (!isContentScriptContext()) {
  (async () => {
    try {
      const settings = await loadSettings();
      if (settings?.core?.mode === "endpoint" && settings?.core?.preferBackendSync) {
        return;
      }
      if (!settings?.webdav?.url) return;
      const client = await WebDavSync(settings.webdav.url, {
        //authType: AuthType.Digest,
        withCredentials: true,
        username: settings.webdav.username,
        password: settings.webdav.password,
        token: settings.webdav.token
      });
      currentWebDav.sync = client ?? currentWebDav.sync;
      await currentWebDav?.sync?.upload?.(true);
      await currentWebDav?.sync?.download?.(true);
    } catch (e) {
    }
  })();
}
const updateWebDavSettings = async (settings) => {
  settings ||= await loadSettings();
  if (settings?.core?.mode === "endpoint" && settings?.core?.preferBackendSync) {
    currentWebDav.sync = null;
    return;
  }
  if (!settings?.webdav?.url) return;
  currentWebDav.sync = await WebDavSync(settings.webdav.url, {
    //authType: AuthType.Digest,
    withCredentials: true,
    username: settings.webdav.username,
    password: settings.webdav.password,
    token: settings.webdav.token
  }) ?? currentWebDav.sync;
  await currentWebDav?.sync?.upload?.();
  await currentWebDav?.sync?.download?.(true);
};
if (!isContentScriptContext()) {
  try {
    if (typeof window !== "undefined" && typeof addEventListener === "function") {
      addEventListener("pagehide", () => {
        currentWebDav?.sync?.upload?.()?.catch?.(() => {
        });
      });
      addEventListener("beforeunload", () => {
        currentWebDav?.sync?.upload?.()?.catch?.(() => {
        });
      });
    }
  } catch {
  }
  (async () => {
    try {
      while (true) {
        await currentWebDav?.sync?.upload?.()?.catch?.(() => {
        });
        await new Promise((resolve) => setTimeout(resolve, 3e3));
      }
    } catch {
    }
  })();
}

export { $trigger, DEFAULT_SETTINGS, DOMMixin, DragHandler, E, GLitElement, H, I, JSOX, M, MOCElement, Q, ResizeHandler, addEvent, addToCallChain, affected, assign, attrRef, bindWith, booleanRef, computed, conditional, ctxMenuTrigger, decodeBase64ToBytes, defineElement, downloadFile, dragSlider, getDir, getDirectoryHandle, getFileHandle, getInputValues, getMimeTypeByFilename, handleAttribute, handleHidden, handleIncomingEntries, handleProperty, handleStyleChange, initGlobalClipboard, isBase64Like, isInFocus, iterated, loadAsAdopted, loadInlineStyle, loadSettings, makeClickOutsideTrigger, makeObjectAssignable, normalizeDataAsset, observableByMap, observe, openDirectory, parseDataUrl, preloadStyle, propRef, property, provide, ref, registerSidebar, remove, removeAdopted, safe, saveSettings, setIdleInterval$1 as setIdleInterval, setStyleProperty, stringRef, stringToFile, uploadFile, valueAsNumberRef, valueRef, writeFile, writeFileSmart };
//# sourceMappingURL=Settings.js.map
