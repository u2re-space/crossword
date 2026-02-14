import { affected, addToCallChain, isValidParent, appendFix, $trigger, isElement, replaceOrSwap, removeChild, getNode, ROOT, doObserve, vector2Ref, setStyleProperty, createRect2D, clampPointToRect, Vector2D, bindDraggable, makeShiftTrigger, cbw, bbw, cbh, bbh, E, addEvent, setChecked, numberRef, operated, CSSBinder, bindWith, handleStyleChange, ReactiveElementSize, bindCtrl, lazyAddEventListener, preloadStyle, loadInlineStyle, GLitElement, H, property, defineElement, handleHidden, handleAttribute, propRef, M, observableByMap, booleanRef, makeClickOutsideTrigger, Q, conditional, registerSidebar, handleProperty, assign, computed, attrRef, valueAsNumberRef, valueRef, ref, openDirectory, observe, getMimeTypeByFilename, remove, downloadFile, getFileHandle, getDirectoryHandle, writeFile, uploadFile, handleIncomingEntries, ctxMenuTrigger, MOCElement, isInFocus, getDir } from './Settings.js';
import { inProxy, isNotEqual, contextify, clamp as clamp$2 } from './Env.js';
import { UIPhosphorIcon, ensureStyleSheet } from './Phosphor.js';
import { loadVeelaVariant } from './crx-entry.js';
import './Markdown.js';

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
    const theirParent = isValidParent(element?.parentElement) ? element?.parentElement : this.boundParent;
    this.boundParent ??= isValidParent(theirParent) ?? this.boundParent;
    if (element != null && (element?.parentNode != this.boundParent || !element?.parentNode)) {
      if (this.boundParent) {
        appendFix(this.boundParent, element);
      }
    }
    queueMicrotask(() => {
      const theirParent2 = isValidParent(element?.parentElement) ? element?.parentElement : this.boundParent;
      this.boundParent ??= isValidParent(theirParent2) ?? this.boundParent;
    });
    return element;
  }
  //
  elementForPotentialParent(requestor) {
    if (isValidParent(requestor)) {
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
    if (name == "element" && (name in params || params?.[name] != null)) {
      return params?.element;
    }
    if (name == "_onUpdate" && (name in params || params?.[name] != null)) {
      return params?._onUpdate?.bind(params);
    }
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

class DragHandler {
  #holder;
  #dragging;
  #raf = 0;
  #pending;
  #options;
  #subscriptions;
  // @ts-ignore
  get #parent() {
    return this.#holder.offsetParent ?? this.#holder?.host ?? ROOT;
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
      createRect2D(constrainedX, constrainedY, elementSize.x, elementSize.y);
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
    this.#dragging;
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
    return this.#holder.offsetParent ?? this.#holder?.host ?? ROOT;
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
    real[0] = clamp$2(0, virtual?.[0] || 0, widthDiff) || 0;
    real[1] = clamp$2(0, virtual?.[1] || 0, heightDiff) || 0;
    return real;
  }
  // TODO! Resizing v2 (full reworking for performance)
  resizable(options) {
    const handler = options.handler ?? this.#holder;
    this.#resizing; const weak = new WeakRef(this.#holder), self_w = new WeakRef(this);
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

const reactiveInputPosition = (input, container) => {
  const elementSize = container ? new ReactiveElementSize(container) : null;
  const value = clampedValueRef(input);
  return operated([value, elementSize?.width || numberRef(100)], () => {
    const containerWidth = elementSize?.width.value || 100;
    const percentage = value.value;
    return percentage * containerWidth;
  });
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
  reactiveInputPosition(input, handler);
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

const styles$b = "@layer ux-layer.u2-normalize, ux-layer.ux-agate, ux-ctm, ux-classes, ui-window-frame;@layer ux-file-manager{:host(ui-file-manager),:host(ui-file-manager) :where(*){border:0 #0000;box-sizing:border-box;line-height:0;margin:0;outline:0 none #0000;overflow:hidden;padding:0;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;user-select:none;-webkit-tap-highlight-color:transparent}:host(ui-file-manager){background-color:var(--color-surface);block-size:stretch;border-radius:0;color:var(--color-on-surface);container-type:inline-size;content-visibility:auto;display:grid;inline-size:stretch;margin:0;overflow:hidden;perspective:1000}:host(ui-file-manager) .fm-root{block-size:stretch;display:grid;gap:var(--gap-xs);grid-template-columns:[content-col] minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);inline-size:stretch;overflow:hidden}:host(ui-file-manager) .fm-toolbar{border-radius:.5rem;display:grid;gap:.5rem;grid-auto-flow:column;grid-column:1/-1;grid-template-columns:minmax(0,max-content) minmax(0,1fr) minmax(0,max-content);grid-template-rows:minmax(0,1fr);line-height:0;padding:.25rem;place-content:center;place-items:center}:host(ui-file-manager) .fm-toolbar button,:host(ui-file-manager) .fm-toolbar input{background-color:var(--color-surface-container);color:var(--color-on-surface)}:host(ui-file-manager) .fm-toolbar .btn{appearance:none;aspect-ratio:1/1;block-size:2.5rem;border:0;border-radius:0;cursor:pointer;inline-size:2.5rem;padding:.65rem;transition:background .1s ease-in-out}:host(ui-file-manager) .fm-toolbar>*{block-size:fit-content;border-radius:.5rem;display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;min-block-size:stretch;overflow:hidden;padding:0}:host(ui-file-manager) .fm-toolbar .fm-toolbar-left{grid-column:1}:host(ui-file-manager) .fm-toolbar .fm-toolbar-left,:host(ui-file-manager) .fm-toolbar .fm-toolbar-right{border-radius:var(--radius-lg,.25rem)}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center{block-size:fit-content;border-radius:.5rem;flex-grow:1;grid-column:2;inline-size:stretch;min-block-size:stretch;overflow:hidden;padding:0;place-content:center;justify-content:start;place-items:center}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center>*{block-size:stretch;inline-size:stretch}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center input{border:0 #0000;inline-size:stretch;outline:0 none #0000;padding-inline:.75rem}:host(ui-file-manager) .fm-toolbar .fm-toolbar-right{grid-column:3}:host(ui-file-manager) .fm-sidebar{align-content:start;border-radius:.5rem;display:none;gap:.5rem;grid-column:sidebar-col;grid-row:2;justify-content:start;justify-items:start;line-height:normal;padding:.5rem;text-align:start}:host(ui-file-manager) .fm-sidebar .sec{display:grid;gap:.25rem;place-content:start;justify-content:start;place-items:start;justify-items:start}:host(ui-file-manager) .fm-sidebar .sec-title{font-weight:600;opacity:.8;padding-block:.25rem;place-self:start}:host(ui-file-manager) .fm-sidebar .link{appearance:none;border:0;border-radius:.375rem;cursor:pointer;line-height:normal;padding:.25rem .375rem;text-align:start}:host(ui-file-manager) .fm-content{block-size:stretch;border-radius:.5rem;grid-column:content-col;grid-row:2;inline-size:stretch;overflow:auto;padding:.25rem;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none}:host(ui-file-manager) .status{opacity:.8;padding:.5rem}:host(ui-file-manager) .status.error{color:var(--error-color,crimson)}@container (inline-size < 520px){:host(ui-file-manager) .fm-content{grid-column:1/-1}:host(ui-file-manager) .fm-root{grid-column:1/-1}:host(ui-file-manager) .fm-grid{grid-column:1/-1}:host(ui-file-manager) .fm-root[data-with-sidebar=true]{grid-template-columns:[content-col] minmax(0,1fr)}:host(ui-file-manager) .fm-sidebar{display:none!important}}}@layer ux-file-manager-content{:host(ui-file-manager-content),:host(ui-file-manager-content) :where(*){overflow:hidden;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none}:host(ui-file-manager-content){background-color:var(--color-surface);block-size:stretch;border-radius:.5rem;color:var(--color-on-surface);contain:none;container-type:size;display:block;grid-column:1/-1;inline-size:stretch;isolation:isolate;margin:0;overflow:auto;perspective:1000;pointer-events:auto;position:relative;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;touch-action:manipulation;z-index:1}:host(ui-file-manager-content) .fm-grid{align-content:start;block-size:fit-content;display:grid;grid-template-rows:minmax(max-content,2rem) minmax(0,1fr);inline-size:stretch;min-block-size:stretch;overflow:visible;pointer-events:none;row-gap:var(--gap-xs);scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;touch-action:manipulation}@container (inline-size <= 600px){:host(ui-file-manager-content) .fm-grid{grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,0) [actions] minmax(8rem,max-content)}}:host(ui-file-manager-content) .fm-grid-rows{align-content:start;block-size:stretch;contain:strict;contain-intrinsic-size:1px 3rem;content-visibility:auto;display:grid;gap:var(--gap-xs);grid-auto-rows:3rem;grid-column:1/-1;grid-template-columns:subgrid;inline-size:stretch;overflow:auto;pointer-events:auto;scrollbar-color:var(--on-surface-color,currentColor) #0000;scrollbar-gutter:auto;scrollbar-width:thin;touch-action:manipulation;z-index:1}:host(ui-file-manager-content) .fm-grid-rows slot{display:contents!important}:host(ui-file-manager-content) :where(.row){block-size:3rem;border-radius:.375rem;color:var(--color-on-surface-variant);cursor:pointer;display:grid;grid-column:1/-1;grid-template-rows:2.5rem!important;inline-size:stretch;min-block-size:max-content;order:var(--order,1)!important;place-content:center;place-items:center;justify-items:start;padding:.25rem .375rem;place-self:center;pointer-events:auto;touch-action:manipulation;user-drag:none;-webkit-user-drag:none;background-color:var(--surface-color,#0000);flex-wrap:nowrap;gap:.25rem;letter-spacing:-.05em;overflow:hidden;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}@media (hover:hover) and (pointer:fine){:host(ui-file-manager-content) :where(.row){user-drag:element;-webkit-user-drag:element}}:host(ui-file-manager-content) :where(.row) ui-icon{block-size:1.25rem;inline-size:1.25rem;place-content:center;place-items:center}:host(ui-file-manager-content) :where(.row) a,:host(ui-file-manager-content) :where(.row) span{background-color:initial!important}:host(ui-file-manager-content) :where(.row)>*{background-color:initial!important;block-size:3rem;min-block-size:max-content}:host(ui-file-manager-content) .row:hover{background-color:var(--color-surface-container-high)}:host(ui-file-manager-content) .row:active{background-color:var(--color-surface-container-highest)}:host(ui-file-manager-content) .row:focus-visible{outline:var(--focus-ring)}:host(ui-file-manager-content) .c{block-size:3rem;color:var(--color-on-surface);display:flex;flex-direction:row;inline-size:auto;min-inline-size:0;overflow:hidden;place-content:center;justify-content:start;min-block-size:max-content;place-items:center;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}:host(ui-file-manager-content) .icon{grid-column:icon;place-content:center;place-items:center}:host(ui-file-manager-content) .name{grid-column:name;inline-size:stretch}:host(ui-file-manager-content) .size{grid-column:size}:host(ui-file-manager-content) .date{grid-column:date}:host(ui-file-manager-content) .actions{grid-column:actions}:host(ui-file-manager-content) .fm-grid,:host(ui-file-manager-content) .fm-grid-header,:host(ui-file-manager-content) .row,:host(ui-file-manager-content) ::slotted(.row){grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,8rem) [actions] minmax(8rem,max-content)}@container (inline-size <= 600px){:host(ui-file-manager-content) .fm-grid,:host(ui-file-manager-content) .fm-grid-header,:host(ui-file-manager-content) .row,:host(ui-file-manager-content) ::slotted(.row){grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,0) [actions] minmax(8rem,max-content)}:host(ui-file-manager-content) .date{display:none!important}}:host(ui-file-manager-content) .actions{background-color:var(--color-surface);block-size:stretch;border-radius:.5rem;box-shadow:0 .0625rem .125rem oklch(from #000 l c h/.1);color:var(--color-on-surface);display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;inline-size:fit-content;max-block-size:2rem;max-inline-size:stretch;overflow:hidden;padding:0;place-content:center;place-items:center;place-self:center;pointer-events:none}:host(ui-file-manager-content) .action-btn{appearance:none;aspect-ratio:1.25/1;background-color:var(--color-surface);block-size:stretch;border:none;border-radius:0;box-shadow:none;color:var(--color-on-surface);cursor:pointer;display:flex;inline-size:fit-content;max-block-size:stretch;max-inline-size:stretch;min-block-size:2rem;min-inline-size:2.5rem;overflow:visible;padding:.5rem;place-content:center;place-items:center;position:relative;transition:all .15s cubic-bezier(.4,0,.2,1)}:host(ui-file-manager-content) .action-btn ui-icon{block-size:stretch;inline-size:stretch;min-block-size:.875rem;min-inline-size:.875rem}:host(ui-file-manager-content) .fm-grid-header{border-radius:.375rem;display:grid;font-size:.875em;gap:.25rem;grid-column:1/-1;inset-block-start:0;opacity:1;padding:.25rem .375rem;place-content:center;justify-content:start;place-items:center;justify-items:start;pointer-events:auto;position:sticky!important;text-align:start;touch-action:manipulation;z-index:2}:host(ui-file-manager-content) .fm-grid-header>*{inline-size:auto}:host(ui-file-manager-content) .fm-grid-header .c{font-weight:600}:host(ui-file-manager-content) .fm-grid-header .icon{grid-column:icon}:host(ui-file-manager-content) .fm-grid-header .name{grid-column:name;inline-size:stretch}:host(ui-file-manager-content) .fm-grid-header .size{grid-column:size}:host(ui-file-manager-content) .fm-grid-header .date{grid-column:date}:host(ui-file-manager-content) .fm-grid-header .actions{block-size:fit-content;border-radius:0;box-shadow:none;display:flex;flex-direction:row;flex-wrap:nowrap;gap:.25rem;grid-column:actions;inline-size:stretch;max-inline-size:stretch;overflow:hidden;padding:0;place-content:center;justify-content:start;place-items:center;justify-items:start;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}}:root{--fl-surface:#fff;--fl-on-surface:#1a1a1a;--fl-surface-variant:#f5f5f5;--fl-on-surface-variant:#444;--fl-primary:#1a73e8;--fl-on-primary:#fff;--fl-primary-container:#d3e3fd;--fl-on-primary-container:#041e49;--fl-secondary:#5f6368;--fl-on-secondary:#fff;--fl-accent:#ea4335;--fl-on-accent:#fff;--fl-success:#34a853;--fl-warning:#fbbc04;--fl-error:#ea4335;--fl-info:#4285f4;--fl-font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;--fl-font-family-mono:\"Roboto Mono\",\"Fira Code\",monospace;--fl-text-xs:0.7rem;--fl-text-sm:0.8rem;--fl-text-base:0.9rem;--fl-text-lg:1rem;--fl-text-xl:1.25rem;--fl-text-2xl:1.6rem;--fl-text-3xl:2rem;--fl-text-4xl:2.5rem;--fl-font-weight-normal:400;--fl-font-weight-medium:500;--fl-font-weight-semibold:600;--fl-font-weight-bold:700;--fl-leading-tight:1.2;--fl-leading-normal:1.5;--fl-leading-relaxed:1.8;--fl-space-xs:0.25rem;--fl-space-sm:0.5rem;--fl-space-md:0.75rem;--fl-space-lg:1rem;--fl-space-xl:1.25rem;--fl-space-2xl:1.6rem;--fl-radius-xs:0.25rem;--fl-radius-sm:0.5rem;--fl-radius-md:0.75rem;--fl-radius-lg:0.85rem;--fl-radius-xl:1rem;--fl-radius-2xl:1.25rem;--fl-radius-full:9999px;--fl-shadow-sm:0 1px 2px #0000000d;--fl-shadow-md:0 4px 6px #0000001a;--fl-shadow-lg:0 10px 15px #0000001a;--fl-shadow-xl:0 20px 25px #0000001a;--fl-shadow-2xl:0 25px 50px #0000001a;--fl-transition-fast:140ms ease;--fl-transition-normal:160ms ease;--fl-transition-slow:200ms ease;--fl-z-dropdown:1000;--fl-z-sticky:1020;--fl-z-fixed:1030;--fl-z-modal-backdrop:1040;--fl-z-modal:1050;--fl-z-popover:1060;--fl-z-tooltip:1070}@media (prefers-color-scheme:dark){:root{--fl-surface:#1a1a1a;--fl-on-surface:#e8e8e8;--fl-surface-variant:#2d2d2d;--fl-on-surface-variant:#c4c4c4;--fl-primary:#8ab4f8;--fl-on-primary:#062e6f;--fl-primary-container:#0842a0;--fl-on-primary-container:#d3e3fd}}";

const coreStyles = "@layer ux-layer.u2-normalize, ux-layer.ux-agate, ux-ctm, ux-classes, ui-window-frame;@layer ux-file-manager{:host(ui-file-manager),:host(ui-file-manager) :where(*){border:0 #0000;box-sizing:border-box;line-height:0;margin:0;outline:0 none #0000;overflow:hidden;padding:0;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;user-select:none;-webkit-tap-highlight-color:transparent}:host(ui-file-manager){background-color:var(--color-surface);block-size:stretch;border-radius:0;color:var(--color-on-surface);container-type:inline-size;content-visibility:auto;display:grid;inline-size:stretch;margin:0;overflow:hidden;perspective:1000}:host(ui-file-manager) .fm-root{block-size:stretch;display:grid;gap:var(--gap-xs);grid-template-columns:[content-col] minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);inline-size:stretch;overflow:hidden}:host(ui-file-manager) .fm-toolbar{border-radius:.5rem;display:grid;gap:.5rem;grid-auto-flow:column;grid-column:1/-1;grid-template-columns:minmax(0,max-content) minmax(0,1fr) minmax(0,max-content);grid-template-rows:minmax(0,1fr);line-height:0;padding:.25rem;place-content:center;place-items:center}:host(ui-file-manager) .fm-toolbar button,:host(ui-file-manager) .fm-toolbar input{background-color:var(--color-surface-container);color:var(--color-on-surface)}:host(ui-file-manager) .fm-toolbar .btn{appearance:none;aspect-ratio:1/1;block-size:2.5rem;border:0;border-radius:0;cursor:pointer;inline-size:2.5rem;padding:.65rem;transition:background .1s ease-in-out}:host(ui-file-manager) .fm-toolbar>*{block-size:fit-content;border-radius:.5rem;display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;min-block-size:stretch;overflow:hidden;padding:0}:host(ui-file-manager) .fm-toolbar .fm-toolbar-left{grid-column:1}:host(ui-file-manager) .fm-toolbar .fm-toolbar-left,:host(ui-file-manager) .fm-toolbar .fm-toolbar-right{border-radius:var(--radius-lg,.25rem)}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center{block-size:fit-content;border-radius:.5rem;flex-grow:1;grid-column:2;inline-size:stretch;min-block-size:stretch;overflow:hidden;padding:0;place-content:center;justify-content:start;place-items:center}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center>*{block-size:stretch;inline-size:stretch}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center input{border:0 #0000;inline-size:stretch;outline:0 none #0000;padding-inline:.75rem}:host(ui-file-manager) .fm-toolbar .fm-toolbar-right{grid-column:3}:host(ui-file-manager) .fm-sidebar{align-content:start;border-radius:.5rem;display:none;gap:.5rem;grid-column:sidebar-col;grid-row:2;justify-content:start;justify-items:start;line-height:normal;padding:.5rem;text-align:start}:host(ui-file-manager) .fm-sidebar .sec{display:grid;gap:.25rem;place-content:start;justify-content:start;place-items:start;justify-items:start}:host(ui-file-manager) .fm-sidebar .sec-title{font-weight:600;opacity:.8;padding-block:.25rem;place-self:start}:host(ui-file-manager) .fm-sidebar .link{appearance:none;border:0;border-radius:.375rem;cursor:pointer;line-height:normal;padding:.25rem .375rem;text-align:start}:host(ui-file-manager) .fm-content{block-size:stretch;border-radius:.5rem;grid-column:content-col;grid-row:2;inline-size:stretch;overflow:auto;padding:.25rem;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none}:host(ui-file-manager) .status{opacity:.8;padding:.5rem}:host(ui-file-manager) .status.error{color:var(--error-color,crimson)}@container (inline-size < 520px){:host(ui-file-manager) .fm-content{grid-column:1/-1}:host(ui-file-manager) .fm-root{grid-column:1/-1}:host(ui-file-manager) .fm-grid{grid-column:1/-1}:host(ui-file-manager) .fm-root[data-with-sidebar=true]{grid-template-columns:[content-col] minmax(0,1fr)}:host(ui-file-manager) .fm-sidebar{display:none!important}}}@layer ux-file-manager-content{:host(ui-file-manager-content),:host(ui-file-manager-content) :where(*){overflow:hidden;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none}:host(ui-file-manager-content){background-color:var(--color-surface);block-size:stretch;border-radius:.5rem;color:var(--color-on-surface);contain:none;container-type:size;display:block;grid-column:1/-1;inline-size:stretch;isolation:isolate;margin:0;overflow:auto;perspective:1000;pointer-events:auto;position:relative;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;touch-action:manipulation;z-index:1}:host(ui-file-manager-content) .fm-grid{align-content:start;block-size:fit-content;display:grid;grid-template-rows:minmax(max-content,2rem) minmax(0,1fr);inline-size:stretch;min-block-size:stretch;overflow:visible;pointer-events:none;row-gap:var(--gap-xs);scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;touch-action:manipulation}@container (inline-size <= 600px){:host(ui-file-manager-content) .fm-grid{grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,0) [actions] minmax(8rem,max-content)}}:host(ui-file-manager-content) .fm-grid-rows{align-content:start;block-size:stretch;contain:strict;contain-intrinsic-size:1px 3rem;content-visibility:auto;display:grid;gap:var(--gap-xs);grid-auto-rows:3rem;grid-column:1/-1;grid-template-columns:subgrid;inline-size:stretch;overflow:auto;pointer-events:auto;scrollbar-color:var(--on-surface-color,currentColor) #0000;scrollbar-gutter:auto;scrollbar-width:thin;touch-action:manipulation;z-index:1}:host(ui-file-manager-content) .fm-grid-rows slot{display:contents!important}:host(ui-file-manager-content) :where(.row){block-size:3rem;border-radius:.375rem;color:var(--color-on-surface-variant);cursor:pointer;display:grid;grid-column:1/-1;grid-template-rows:2.5rem!important;inline-size:stretch;min-block-size:max-content;order:var(--order,1)!important;place-content:center;place-items:center;justify-items:start;padding:.25rem .375rem;place-self:center;pointer-events:auto;touch-action:manipulation;user-drag:none;-webkit-user-drag:none;background-color:var(--surface-color,#0000);flex-wrap:nowrap;gap:.25rem;letter-spacing:-.05em;overflow:hidden;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}@media (hover:hover) and (pointer:fine){:host(ui-file-manager-content) :where(.row){user-drag:element;-webkit-user-drag:element}}:host(ui-file-manager-content) :where(.row) ui-icon{block-size:1.25rem;inline-size:1.25rem;place-content:center;place-items:center}:host(ui-file-manager-content) :where(.row) a,:host(ui-file-manager-content) :where(.row) span{background-color:initial!important}:host(ui-file-manager-content) :where(.row)>*{background-color:initial!important;block-size:3rem;min-block-size:max-content}:host(ui-file-manager-content) .row:hover{background-color:var(--color-surface-container-high)}:host(ui-file-manager-content) .row:active{background-color:var(--color-surface-container-highest)}:host(ui-file-manager-content) .row:focus-visible{outline:var(--focus-ring)}:host(ui-file-manager-content) .c{block-size:3rem;color:var(--color-on-surface);display:flex;flex-direction:row;inline-size:auto;min-inline-size:0;overflow:hidden;place-content:center;justify-content:start;min-block-size:max-content;place-items:center;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}:host(ui-file-manager-content) .icon{grid-column:icon;place-content:center;place-items:center}:host(ui-file-manager-content) .name{grid-column:name;inline-size:stretch}:host(ui-file-manager-content) .size{grid-column:size}:host(ui-file-manager-content) .date{grid-column:date}:host(ui-file-manager-content) .actions{grid-column:actions}:host(ui-file-manager-content) .fm-grid,:host(ui-file-manager-content) .fm-grid-header,:host(ui-file-manager-content) .row,:host(ui-file-manager-content) ::slotted(.row){grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,8rem) [actions] minmax(8rem,max-content)}@container (inline-size <= 600px){:host(ui-file-manager-content) .fm-grid,:host(ui-file-manager-content) .fm-grid-header,:host(ui-file-manager-content) .row,:host(ui-file-manager-content) ::slotted(.row){grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,0) [actions] minmax(8rem,max-content)}:host(ui-file-manager-content) .date{display:none!important}}:host(ui-file-manager-content) .actions{background-color:var(--color-surface);block-size:stretch;border-radius:.5rem;box-shadow:0 .0625rem .125rem oklch(from #000 l c h/.1);color:var(--color-on-surface);display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;inline-size:fit-content;max-block-size:2rem;max-inline-size:stretch;overflow:hidden;padding:0;place-content:center;place-items:center;place-self:center;pointer-events:none}:host(ui-file-manager-content) .action-btn{appearance:none;aspect-ratio:1.25/1;background-color:var(--color-surface);block-size:stretch;border:none;border-radius:0;box-shadow:none;color:var(--color-on-surface);cursor:pointer;display:flex;inline-size:fit-content;max-block-size:stretch;max-inline-size:stretch;min-block-size:2rem;min-inline-size:2.5rem;overflow:visible;padding:.5rem;place-content:center;place-items:center;position:relative;transition:all .15s cubic-bezier(.4,0,.2,1)}:host(ui-file-manager-content) .action-btn ui-icon{block-size:stretch;inline-size:stretch;min-block-size:.875rem;min-inline-size:.875rem}:host(ui-file-manager-content) .fm-grid-header{border-radius:.375rem;display:grid;font-size:.875em;gap:.25rem;grid-column:1/-1;inset-block-start:0;opacity:1;padding:.25rem .375rem;place-content:center;justify-content:start;place-items:center;justify-items:start;pointer-events:auto;position:sticky!important;text-align:start;touch-action:manipulation;z-index:2}:host(ui-file-manager-content) .fm-grid-header>*{inline-size:auto}:host(ui-file-manager-content) .fm-grid-header .c{font-weight:600}:host(ui-file-manager-content) .fm-grid-header .icon{grid-column:icon}:host(ui-file-manager-content) .fm-grid-header .name{grid-column:name;inline-size:stretch}:host(ui-file-manager-content) .fm-grid-header .size{grid-column:size}:host(ui-file-manager-content) .fm-grid-header .date{grid-column:date}:host(ui-file-manager-content) .fm-grid-header .actions{block-size:fit-content;border-radius:0;box-shadow:none;display:flex;flex-direction:row;flex-wrap:nowrap;gap:.25rem;grid-column:actions;inline-size:stretch;max-inline-size:stretch;overflow:hidden;padding:0;place-content:center;justify-content:start;place-items:center;justify-items:start;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}}:root{--fl-surface:#fff;--fl-on-surface:#1a1a1a;--fl-surface-variant:#f5f5f5;--fl-on-surface-variant:#444;--fl-primary:#1a73e8;--fl-on-primary:#fff;--fl-primary-container:#d3e3fd;--fl-on-primary-container:#041e49;--fl-secondary:#5f6368;--fl-on-secondary:#fff;--fl-accent:#ea4335;--fl-on-accent:#fff;--fl-success:#34a853;--fl-warning:#fbbc04;--fl-error:#ea4335;--fl-info:#4285f4;--fl-font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;--fl-font-family-mono:\"Roboto Mono\",\"Fira Code\",monospace;--fl-text-xs:0.7rem;--fl-text-sm:0.8rem;--fl-text-base:0.9rem;--fl-text-lg:1rem;--fl-text-xl:1.25rem;--fl-text-2xl:1.6rem;--fl-text-3xl:2rem;--fl-text-4xl:2.5rem;--fl-font-weight-normal:400;--fl-font-weight-medium:500;--fl-font-weight-semibold:600;--fl-font-weight-bold:700;--fl-leading-tight:1.2;--fl-leading-normal:1.5;--fl-leading-relaxed:1.8;--fl-space-xs:0.25rem;--fl-space-sm:0.5rem;--fl-space-md:0.75rem;--fl-space-lg:1rem;--fl-space-xl:1.25rem;--fl-space-2xl:1.6rem;--fl-radius-xs:0.25rem;--fl-radius-sm:0.5rem;--fl-radius-md:0.75rem;--fl-radius-lg:0.85rem;--fl-radius-xl:1rem;--fl-radius-2xl:1.25rem;--fl-radius-full:9999px;--fl-shadow-sm:0 1px 2px #0000000d;--fl-shadow-md:0 4px 6px #0000001a;--fl-shadow-lg:0 10px 15px #0000001a;--fl-shadow-xl:0 20px 25px #0000001a;--fl-shadow-2xl:0 25px 50px #0000001a;--fl-transition-fast:140ms ease;--fl-transition-normal:160ms ease;--fl-transition-slow:200ms ease;--fl-z-dropdown:1000;--fl-z-sticky:1020;--fl-z-fixed:1030;--fl-z-modal-backdrop:1040;--fl-z-modal:1050;--fl-z-popover:1060;--fl-z-tooltip:1070}@media (prefers-color-scheme:dark){:root{--fl-surface:#1a1a1a;--fl-on-surface:#e8e8e8;--fl-surface-variant:#2d2d2d;--fl-on-surface-variant:#c4c4c4;--fl-primary:#8ab4f8;--fl-on-primary:#062e6f;--fl-primary-container:#0842a0;--fl-on-primary-container:#d3e3fd}}@layer fl-ui-base, fl-ui-components, fl-ui-utilities;";

console.log(UIPhosphorIcon);
const loader = async () => {
  await preloadStyle(coreStyles);
  await loadInlineStyle(coreStyles);
  try {
    await loadVeelaVariant("basic");
  } catch {
    console.warn("[FL.UI] Could not load veela-basic runtime");
  }
};

var __defProp$b = Object.defineProperty;
var __getOwnPropDesc$b = Object.getOwnPropertyDescriptor;
var __decorateClass$b = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$b(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$b(target, key, result);
  return result;
};
let UIElement = class extends GLitElement() {
  theme = "default";
  //
  render = function() {
    return H`<slot></slot>`;
  };
  //
  constructor() {
    super();
  }
  //
  onRender() {
    return super.onRender();
  }
  //
  connectedCallback() {
    const result = super.connectedCallback?.();
    const self = result ?? this;
    return self;
  }
  //
  onInitialize() {
    const result = super.onInitialize();
    const self = result ?? this;
    self.loadStyleLibrary(ensureStyleSheet());
    return self;
  }
};
__decorateClass$b([
  property({ source: "attr" })
], UIElement.prototype, "theme", 2);
UIElement = __decorateClass$b([
  defineElement("ui-element")
], UIElement);
const UIElement$1 = UIElement;

class TaskStateReflect {
  task;
  element;
  listeners;
  bindings;
  //
  constructor(element = null, task = null) {
    this.update(element, task);
  }
  //
  update(element = null, task = null) {
    if (this.task !== task) {
      this.task = task;
    }
    this.bind(element);
    return this;
  }
  //
  unbind() {
    if (this.bindings) {
      Object.values(this.bindings).forEach((binding) => {
        typeof binding == "function" ? binding() : binding?.unbind?.();
      });
      this.bindings?.orderSub?.();
      this.bindings = null;
    }
    if (this.listeners) {
      Object.values(this.listeners).forEach((listener) => {
        typeof listener == "function" ? listener() : listener?.remove?.();
      });
      this.listeners = null;
    }
    if (this.element) {
      handleHidden(this.element, this.task, false);
      handleAttribute(this.element, "data-focus", null);
      handleAttribute(this.element, "data-title", null);
      handleAttribute(this.element, "data-icon", null);
      handleStyleChange(this.element, "--order", null);
    }
  }
  //
  bind(element = null) {
    if (this.element !== element) {
      this.element = element;
    }
    if (this.bindings) {
      this.unbind();
    }
    if (this.element) {
      this.bindings ??= {};
      const visibleRef = propRef(this.task, "active");
      this.bindings.visible = bindWith(this.element, "data-hidden", visibleRef, handleHidden);
      const titleRef = propRef(this.task?.payload, "title");
      this.bindings.title = bindWith(this.element, "title", titleRef, handleAttribute);
      const iconRef = propRef(this.task?.payload, "icon");
      this.bindings.icon = bindWith(this.element, "icon", iconRef, handleAttribute);
      setStyleProperty(this.element, "--order", this.task?.order);
      document.addEventListener("task-focus", (e) => {
        setStyleProperty(this.element, "--order", this.task?.order);
      });
      this.listeners ??= {};
      this.listeners.click = addEvent(this.element, "pointerdown", () => {
        if (this.task) {
          this.task.focus = true;
        }
      });
      this.listeners.keydown = addEvent(this.element, "keydown", (e) => {
        if (e.key == "Enter" && this.task) {
          this.task.focus = true;
        }
      });
      this.listeners.focus = addEvent(this.element, "focus", (e) => {
        if (this.task) {
          this.task.focus = true;
        }
      });
      this.listeners.blur = addEvent(this.element, "blur", (e) => {
        if (this.task) {
          this.task.focus = false;
        }
      });
      this.listeners.close = addEvent(this.element, "close", (e) => {
        if (this.task) {
          this.element.addEventListener("u2-hidden", () => {
            this.task?.removeFromList();
          }, { once: true });
          this.element.setAttribute("data-hidden", "");
        }
      });
      this.listeners.minimize = addEvent(this.element, "minimize", (e) => {
        if (this.task) {
          this.task.focus = false;
          this.task.active = false;
        }
      });
      this.listeners.maximize = addEvent(this.element, "maximize", (e) => {
        if (this.task) ;
      });
    }
    return this;
  }
}

const styles$a = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer ui-window-frame{:host(ui-window-frame),:host(ui-window-frame) ::slotted(*),:host(ui-window-frame) :where(*){user-select:none;user-drag:none;-webkit-user-select:none;-webkit-user-drag:none;cursor:default;pointer-events:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}:host(ui-window-frame) slot{background-color:initial!important;border:0 #0000!important;box-shadow:none!important;color:inherit!important;display:contents!important;outline:none!important;pointer-events:auto!important}:host(ui-window-frame){contain:layout paint style;opacity:var(--opacity,1);transform:scale3d(var(--scale,1),var(--scale,1),var(--scale,1)) translate3d(calc(var(--drag-x, 0) * 1px),calc(var(--drag-y, 0) * 1px),0)}:host(ui-window-frame[data-maximized]){opacity:var(--opacity,1);transform:scale3d(var(--scale,1),var(--scale,1),1);transform-box:fill-box;transform-origin:50% 50%;transform-style:flat}:host(ui-window-frame[data-maximized]){block-size:stretch;inline-size:stretch}:host(ui-window-frame[data-maximized]){inset-block-end:0;inset-block-start:0;inset-inline-end:0;inset-inline-start:0}:host(ui-window-frame[data-maximized]){border:0 solid #0000;border-radius:0}:host(ui-window-frame[data-maximized]){box-shadow:none;outline:none}:host(ui-window-frame[data-maximized]) .ui-window-frame-resize-handle{display:none!important}:host(ui-window-frame[data-dragging]){content-visibility:auto;transform:translate3d(calc(var(--drag-x, 0) * 1px),calc(var(--drag-y, 0) * 1px),0)}:host(ui-window-frame[data-dragging]) ::slotted(*){content-visibility:auto}:host(ui-window-frame[data-resizing]){will-change:inline-size,block-size,transform,opacity}@media (width < 600px){:host(ui-window-frame){--ui-window-frame-border-radius:0px;--ui-window-frame-titlebar-height:48px}:host(ui-window-frame){opacity:var(--opacity,1);transform:scale3d(var(--scale,1),var(--scale,1),var(--scale,1));transform-box:fill-box;transform-origin:50% 50%;transform-style:flat}:host(ui-window-frame){block-size:stretch!important;inline-size:stretch!important;max-block-size:none!important;max-inline-size:none!important}:host(ui-window-frame){inset-block-end:auto!important;inset-block-start:0!important;inset-inline-end:auto!important;inset-inline-start:0!important}:host(ui-window-frame){border:0 solid #0000!important;border-radius:0!important}:host(ui-window-frame){box-shadow:none!important;outline:none!important}:host(ui-window-frame){--z-index-order:var(--order,sibling-index())!important;--z-index:var(--z-index-order,sibling-index())!important;z-index:calc(99 + var(--z-index, 0))!important}:host(ui-window-frame) .ui-window-frame-resize-handle{display:none!important}}}";

var __defProp$a = Object.defineProperty;
var __getOwnPropDesc$a = Object.getOwnPropertyDescriptor;
var __decorateClass$a = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$a(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$a(target, key, result);
  return result;
};
const styled$a = preloadStyle(styles$a);
let WindowFrame = class extends UIElement {
  name = "";
  icon = "app-window";
  title = "WINDOW_FRAME_TITLE";
  subtitle = "WINDOW_FRAME_SUBTITLE";
  closeIcon = "x";
  minimizeIcon = "minus";
  maximizeIcon = "corners-out";
  contentEl;
  titlebarEl;
  titlebarHandleEl;
  appIconEl;
  resizeHandleEl;
  titleTextEl;
  titleTextSubEl;
  closeEl;
  minimizeEl;
  maximizeEl;
  //
  task = null;
  reflect;
  //
  constructor() {
    super();
  }
  onInitialize() {
    super.onInitialize();
    new DragHandler(this, { handler: this.titlebarHandleEl });
    new ResizeHandler(this, { handler: this.resizeHandleEl });
    E(this, { classList: /* @__PURE__ */ new Set(["c2-surface"]) });
    const self = this;
    const weak = new WeakRef(self);
    const withDispatch = (name) => ((ev) => {
      ev.preventDefault();
      weak.deref?.().dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true }));
    });
    this.closeEl?.addEventListener("click", withDispatch("close"));
    this.minimizeEl?.addEventListener("click", withDispatch("minimize"));
    this.maximizeEl?.addEventListener("click", withDispatch("maximize"));
    self.addEventListener("maximize", () => {
      handleAttribute(self, "data-maximized", self.getAttribute("data-maximized") != null ? false : true);
    });
    self.setAttribute("data-dragging", "");
    this.bindWithTask();
  }
  //
  bindWithTask(task = null) {
    if (this.task != task) {
      if (this.task && task) {
        this.reflect?.unbind();
        this.reflect = null;
        this.task = null;
      }
      if (this.task = task ?? this.task) {
        this.reflect ??= new TaskStateReflect(this.task, this);
        this.reflect?.bind(this);
      }
    }
    return this;
  }
  //
  onRender() {
    super.onRender();
    queueMicrotask(() => {
      this.doCenter();
    });
  }
  //
  doCenter() {
    const holder = this;
    const box = holder.getBoundingClientRect();
    const parent = holder.parentElement;
    const parentBox = parent?.getBoundingClientRect();
    const cX = (parentBox?.width || 0) / 2 - (box?.width || 0) / 2;
    const cY = (parentBox?.height || 0) / 2 - (box?.height || 0) / 2;
    setStyleProperty(holder, "--shift-x", cX - (parentBox?.left || 0));
    setStyleProperty(holder, "--shift-y", cY - (parentBox?.top || 0));
    holder.removeAttribute("data-dragging");
  }
  //
  styles = function() {
    return styled$a;
  };
  render = function() {
    return H`
        <div class="ui-window-frame-titlebar" part="titlebar">
            <span class="ui-window-frame-titlebar-handle" part="handle">
                <span class="ui-window-frame-titlebar-app-icon" part="app-icon">
                    <ui-icon name="window-frame-app-icon" icon=${this.icon ?? "window-frame-app-icon"}></ui-icon>
                </span>
                <span class="ui-window-frame-titlebar-title-text" part="title-text">
                    ${this.title || H`<slot name="title"></slot>`}
                </span>
                <span class="ui-window-frame-titlebar-title-text-sub" part="title-text-sub">
                    ${this.subtitle || H`<slot name="subtitle"></slot>`}
                </span>
            </span>
            <span class="ui-window-frame-titlebar-controls" part="controls">
                <button class="ui-window-frame-titlebar-control-minimize" part="control-minimize">
                    <ui-icon name="window-frame-minimize" icon=${this.minimizeIcon ?? "minus"}></ui-icon>
                </button>
                <button class="ui-window-frame-titlebar-control-maximize" part="control-maximize">
                    <ui-icon name="window-frame-maximize" icon=${this.maximizeIcon ?? "corners-out"}></ui-icon>
                </button>
                <button class="ui-window-frame-titlebar-control-close" part="control-close">
                    <ui-icon name="window-frame-close" icon=${this.closeIcon ?? "x"}></ui-icon>
                </button>
            </span>
        </div>
        <div class="ui-window-frame-content ui-window-frame-anchor-box" part="content">
            <slot></slot>
        </div>
        <span class="ui-window-frame-resize-handle" part="resize-handle"></span>`;
  };
};
__decorateClass$a([
  property({ source: "attr", name: "name" })
], WindowFrame.prototype, "name", 2);
__decorateClass$a([
  property({ source: "attr", name: "icon" })
], WindowFrame.prototype, "icon", 2);
__decorateClass$a([
  property({ source: "attr", name: "title" })
], WindowFrame.prototype, "title", 2);
__decorateClass$a([
  property({ source: "attr", name: "subtitle" })
], WindowFrame.prototype, "subtitle", 2);
__decorateClass$a([
  property({ source: "attr", name: "close-icon" })
], WindowFrame.prototype, "closeIcon", 2);
__decorateClass$a([
  property({ source: "attr", name: "minimize-icon" })
], WindowFrame.prototype, "minimizeIcon", 2);
__decorateClass$a([
  property({ source: "attr", name: "maximize-icon" })
], WindowFrame.prototype, "maximizeIcon", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-content" })
], WindowFrame.prototype, "contentEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar" })
], WindowFrame.prototype, "titlebarEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-handle" })
], WindowFrame.prototype, "titlebarHandleEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-app-icon" })
], WindowFrame.prototype, "appIconEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-resize-handle" })
], WindowFrame.prototype, "resizeHandleEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-title-text" })
], WindowFrame.prototype, "titleTextEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-title-text-sub" })
], WindowFrame.prototype, "titleTextSubEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-control-close" })
], WindowFrame.prototype, "closeEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-control-minimize" })
], WindowFrame.prototype, "minimizeEl", 2);
__decorateClass$a([
  property({ source: "query-shadow", name: ".ui-window-frame-titlebar-control-maximize" })
], WindowFrame.prototype, "maximizeEl", 2);
WindowFrame = __decorateClass$a([
  defineElement("ui-window-frame")
], WindowFrame);

const styles$9 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer tabbed-box{:host{--tabbed-gap:var(--gap-sm,0.5rem);--tabbed-radius:var(--radius-lg,0.75rem);--tabbed-padding-inline:clamp(0.25rem,1cqi + 0.25rem,1rem);--tabbed-padding-block:clamp(0.25rem,1cqb + 0.25rem,0.75rem);--tabbed-tab-gap:var(--gap-xs,0.375rem);--tabbed-indicator-height:0.2rem;--tabbed-indicator-ease:var(--ease-emphasized,cubic-bezier(0.2,0,0,1));--tabbed-indicator-duration:var(--duration-normal,160ms);--tabbed-bar-block-size:clamp(3.5rem,1cqb + 2.5rem,4.25rem);--tabbed-grid-columns:minmax(0px,1fr);--tabbed-tabs-block-gap:var(--padding-sm,0.75rem);--tabbed-bar-column-size:clamp(4rem,2cqb + 2.5rem,4.5rem);--tabbed-grid-rows:minmax(0px,1fr) minmax(0px,var(--tabbed-bar-block-size))}:host,:host ::slotted(*),:host :where(*){background-color:initial;border:none;box-sizing:border-box;gap:0;margin:0;outline:none;padding:0;user-select:none;-webkit-tap-highlight-color:transparent;border-radius:0;isolation:auto;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0}:host{background-color:initial!important;block-size:stretch;border-radius:0!important;contain:strict!important;container-type:inline-size;display:grid!important;gap:0!important;grid-template-areas:\"content tabs\"!important;grid-template-columns:var(--tabbed-grid-columns)!important;grid-template-rows:var(--tabbed-grid-rows)!important;inline-size:stretch;margin:0!important;overflow:hidden!important;padding:0!important;perspective:1000;position:relative;writing-mode:horizontal-tb}:host([orient=\"1\"]){--tabbed-grid-columns:minmax(0px,var(--tabbed-bar-column-size)) minmax(0px,1fr);--tabbed-grid-rows:minmax(0px,1fr);grid-template-areas:\"tabs content\"!important}:host([orient=\"3\"]){--tabbed-grid-columns:minmax(0px,1fr) minmax(0px,var(--tabbed-bar-column-size));--tabbed-grid-rows:minmax(0px,1fr);grid-template-areas:\"content tabs\"!important}:host([orient=\"0\"]){--tabbed-grid-columns:minmax(0px,1fr);--tabbed-grid-rows:minmax(0px,1fr) minmax(0px,var(--tabbed-bar-block-size));grid-template-areas:\"content\" \"tabs\"!important}:host([orient=\"2\"]){--tabbed-grid-columns:minmax(0px,1fr);--tabbed-grid-rows:minmax(0px,var(--tabbed-bar-block-size)) minmax(0px,1fr);grid-template-areas:\"tabs\" \"content\"!important}:host :where(.ui-tabbed-box-tabs,.ui-tabbed-box-content){margin:0}:host .ui-tabbed-box-tabs-container{align-items:center;background-color:initial;background-image:none;block-size:stretch;border-radius:0;display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;grid-area:tabs;inline-size:stretch;isolation:auto;justify-content:center;margin-block:0;max-block-size:stretch;min-block-size:3rem;overflow:visible;padding:0;place-content:center;place-items:center;pointer-events:none;position:relative;scrollbar-width:none;text-align:center;transform:translateZ(0);z-index:1}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs{align-items:center;backdrop-filter:blur(16px);background-color:oklch(from var(--surface-color) l c h/.8);block-size:fit-content;border-radius:var(--tabbed-radius);contain:strict;display:flex;filter:drop-shadow(0 0 .5rem oklch(from #000 l c h/.2));flex-direction:row;gap:var(--tabbed-tab-gap);inline-size:fit-content;isolation:auto;margin-block:.25rem;margin-inline:.5rem;max-block-size:stretch;max-inline-size:stretch;min-block-size:var(--tabbed-bar-block-size);min-inline-size:stretch;overflow:visible;overflow-block:visible;overflow-inline:auto;overscroll-behavior-inline:contain;padding-block:calc(var(--tabbed-padding-block) * .65);padding-inline:calc(var(--tabbed-padding-inline) * .5);place-content:center;justify-content:safe center;place-items:center;justify-items:safe center;pointer-events:auto;position:relative;scroll-behavior:smooth;scrollbar-gutter:stable;scrollbar-width:none;touch-action:pan-x pan-y;transform:translateZ(0);z-index:2}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs,:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs *,:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs button{touch-action:pan-x pan-y}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab{border-radius:var(--radius-full);color:color-mix(in oklch,var(--md3-on-surface) 85%,#0000);cursor:pointer;display:flex;flex-direction:row;flex-shrink:0;flex-wrap:nowrap;grid-area:tab;letter-spacing:.01em;overflow:visible;padding-block:calc(var(--tabbed-padding-block) * .6);padding-inline:calc(var(--tabbed-padding-inline) * .6);place-content:center;place-items:center;position:relative;text-align:center;text-wrap:nowrap;touch-action:pan-x pan-y;transition:color var(--duration-normal) var(--ease-out),transform var(--duration-fast) var(--ease-emphasized);writing-mode:horizontal-tb}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab{background-color:initial;inline-size:fit-content;max-inline-size:stretch;min-block-size:3rem;min-inline-size:4rem}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:after{background:currentColor;block-size:var(--tabbed-indicator-height);border-radius:var(--tabbed-indicator-height);content:\"\";inset-block-end:calc(var(--tabbed-indicator-height) * -1);inset-inline:clamp(.75rem,3cqi,1.5rem);opacity:0;overflow:visible;place-content:center;place-items:center;position:absolute;text-align:center;transform:translate3d(0,50%,0) scaleX(.6);transition:transform var(--tabbed-indicator-duration) var(--tabbed-indicator-ease),opacity var(--tabbed-indicator-duration) var(--tabbed-indicator-ease)}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active){color:var(--md3-on-primary);place-content:center;place-items:center;text-align:center;transform:translateY(-2px)}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active):after{background:var(--md3-on-primary);opacity:1;transform:translateZ(0) scaleX(1)}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:disabled{opacity:var(--state-opacity-disabled,.38)}:host([orient=\"0\"]) :host .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:after{inset-block-end:auto;inset-block-start:calc(var(--tabbed-indicator-height) * -1);transform:translate3d(0,-50%,0) scaleX(.6)}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container{align-items:stretch;background-color:initial;background-image:none;block-size:var(--tabbed-bar-column-size);border-radius:0;flex-direction:row;gap:0;inline-size:stretch;isolation:auto;justify-content:flex-start;max-block-size:var(--tabbed-bar-column-size);max-inline-size:stretch;min-block-size:var(--tabbed-bar-column-size);min-inline-size:var(--tabbed-bar-block-size);padding:0;pointer-events:none;position:relative;scrollbar-width:none;transform:translateZ(0);writing-mode:vertical-rl;z-index:1}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs{align-items:center;block-size:fit-content;border-radius:var(--tabbed-radius);clip-path:inset(0 round var(--tabbed-radius));contain:strict;display:flex;flex-direction:row;gap:var(--tabbed-tab-gap);inline-size:fit-content;isolation:auto;justify-content:flex-start;margin-block:.25rem;margin-inline:.5rem;max-block-size:stretch;max-inline-size:stretch;min-block-size:var(--tabbed-bar-column-size);min-inline-size:stretch;overflow:hidden;overflow-block:hidden;overflow-inline:auto;padding-block:calc(var(--tabbed-padding-inline) * .5);padding-inline:calc(var(--tabbed-padding-block) * .65);pointer-events:auto;position:relative;scroll-behavior:smooth;scrollbar-width:none;touch-action:pan-x pan-y;transform:translateZ(0);z-index:2}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs,:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs *,:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs button,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs *,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tabs button{touch-action:pan-x pan-y}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab{align-items:center;background-color:initial;block-size:fit-content;border-radius:var(--radius-sm);display:flex;flex-direction:column;font-size:.5rem;gap:clamp(.25rem,.3cqb,.5rem);inline-size:stretch;max-block-size:3.5rem;max-inline-size:stretch;min-block-size:3.5rem;min-inline-size:stretch;overflow:hidden;overflow-wrap:normal;padding-block:calc(var(--tabbed-padding-inline) * .75);padding-inline:0;place-content:center;justify-content:safe center;place-items:center;justify-items:safe center;text-align:center;text-overflow:ellipsis;word-break:break-word;writing-mode:horizontal-tb}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab .ui-tabbed-box-tab-label,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab .ui-tabbed-box-tab-label{align-items:center;block-size:fit-content;display:block;flex-direction:column;inline-size:stretch;justify-content:center;line-height:var(--leading-tight,1.2);max-inline-size:stretch;min-inline-size:0;overflow:hidden;overflow-wrap:break-word;text-align:center;text-overflow:ellipsis;word-break:break-word}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab span,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab span{overflow:hidden;text-overflow:ellipsis;word-break:break-word}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab ui-icon,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab ui-icon{block-size:clamp(1.25rem,1.5cqb,1.75rem);flex-shrink:0;inline-size:clamp(1.25rem,1.5cqb,1.75rem)}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:after,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:after{block-size:auto;border-radius:calc(var(--tabbed-indicator-height) / 2);inline-size:var(--tabbed-indicator-height);inset-block:clamp(.5rem,2cqb,1rem);inset-inline-end:auto;inset-inline-start:calc(var(--tabbed-indicator-height) * -1);transform:translate3d(-50%,0,0) scaleY(.6)}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active),:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active){transform:translateX(-2px)}:host([orient=\"1\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active):after,:host([orient=\"3\"]) .ui-tabbed-box-tabs-container .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active):after{transform:translateZ(0) scaleY(1)}:host([orient=\"1\"]) .ui-tabbed-box-tabs .ui-tabbed-box-tab:after{inset-inline-end:auto;inset-inline-start:calc(var(--tabbed-indicator-height) * -1)}:host([orient=\"3\"]) .ui-tabbed-box-tabs .ui-tabbed-box-tab:after{inset-inline-end:calc(var(--tabbed-indicator-height) * -1);inset-inline-start:auto;transform:translate3d(50%,0,0) scaleY(.6)}:host([orient=\"3\"]) .ui-tabbed-box-tabs .ui-tabbed-box-tab:where([aria-selected=true],[data-active],.is-active,.active):after{transform:translateZ(0) scaleY(1)}:host .ui-tabbed-box-tabs-container .ui-tabbed-box-handle{block-size:0;inline-size:0;overflow:visible;place-content:center;place-items:center;pointer-events:none;touch-action:pan-x;visibility:hidden}:host .ui-tabbed-box-tabs-container ui-icon{pointer-events:none;touch-action:pan-x}:host .ui-tabbed-box-content{align-content:start;block-size:stretch;border-radius:0;contain:strict;content-visibility:auto;display:grid;grid-area:content;grid-column:1/-1;grid-row:1/-1;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;perspective:1000;position:relative;transform:translateZ(0);will-change:contents;writing-mode:horizontal-tb;z-index:0}:host .ui-tabbed-box-content{background-color:initial;background-image:none;max-block-size:none}:host .ui-tabbed-box-content::slotted(*){block-size:stretch;color:var(--md3-on-surface);grid-column:1/-1;grid-row:1/-1;inline-size:stretch;line-height:var(--leading-normal,1.5);overflow:auto;scrollbar-color:#0000004d #0000;scrollbar-gutter:stable both-edges;scrollbar-width:thin}:host .ui-tabbed-box-content::slotted(*)::-webkit-scrollbar{block-size:8px;inline-size:8px}:host .ui-tabbed-box-content::slotted(*)::-webkit-scrollbar-thumb{background-color:#0000004d;border-radius:9999px}:host .ui-tabbed-box-content::slotted(*)::-webkit-scrollbar-track{background-color:initial}:host .ui-tabbed-box-content::slotted([aria-hidden=true],[data-hidden],:not([data-active])){display:none!important}}";

var __defProp$9 = Object.defineProperty;
var __getOwnPropDesc$9 = Object.getOwnPropertyDescriptor;
var __decorateClass$9 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$9(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$9(target, key, result);
  return result;
};
const styled$9 = preloadStyle(styles$9);
const renderTabName$1 = (tabName) => {
  if (typeof tabName != "string") {
    return tabName;
  }
  if (tabName == null || tabName == "") {
    return "";
  }
  tabName = tabName?.replace?.(/_/g, " ") || tabName;
  tabName = tabName?.charAt?.(0)?.toUpperCase?.() + tabName?.slice?.(1) || tabName;
  return tabName;
};
const addPartProperty$1 = (element, name = "") => {
  if (typeof element == "string") {
    return element;
  }
  if (element instanceof HTMLElement) {
    element?.setAttribute?.(`tab`, name);
    element?.setAttribute?.(`part`, "tab");
  }
  return element;
};
const clamp$1 = (value, min, max) => Math.max(min, Math.min(max, value));
let TabChangedEvent$1 = class TabChangedEvent extends Event {
  newTab;
  constructor(name, options, newTab) {
    super(name, options);
    this.newTab = newTab;
  }
};
let TabbedBox = class extends UIElement {
  currentTab = "";
  orient = 1;
  //
  constructor() {
    super();
    const self = this;
    self.currentTab ??= "";
  }
  onInitialize() {
    const self = this;
    super.onInitialize?.();
    self.currentTab ||= [...self?.tabs?.keys?.() ?? []]?.[0] || "";
    E(self, {}, [I({ current: propRef(self, "currentTab"), mapped: self.tabs })]);
    affected(propRef(self, "currentTab"), (_newVal) => {
      self.dispatchEvent(new TabChangedEvent$1("tab-changed", { bubbles: true }, self.currentTab));
    });
    self.addEventListener("keydown", (e) => {
      const target = e?.composedPath?.()?.[0];
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isInput) {
        return;
      }
      if ((e?.key === "ArrowLeft" || e?.key === "ArrowRight") && self?.checkVisibility({
        contentVisibilityAuto: true,
        opacityProperty: true,
        visibilityProperty: true
      })) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        const tabs = Array.from(self?.tabs?.keys?.() ?? []);
        if (!tabs?.length) {
          return;
        }
        const currentIndex = tabs?.indexOf?.(self?.currentTab ?? "");
        let newIndex = currentIndex;
        if (e?.key === "ArrowLeft") {
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = tabs?.length - 1;
          }
        } else {
          newIndex = currentIndex + 1;
          if (newIndex >= tabs?.length) {
            newIndex = 0;
          }
        }
        const newTab = tabs?.[newIndex];
        self?.openTab?.(newTab);
      }
    });
  }
  //
  setTabs(tabs) {
    const self = this;
    self.tabs ??= tabs ?? self.tabs;
  }
  //
  onRender() {
    const self = this;
    if (!self.tabs || !self.currentTab) return;
    this.observeTabsOverflow?.();
  }
  //
  createTab(tabName, idx) {
    if (!tabName) return;
    const self = this;
    const tabLabel = H`<span part="tab-label" class="ui-tabbed-box-tab-label">${(self?.renderTabName?.bind?.(self) ?? renderTabName$1)?.(tabName) ?? tabName}</span>`;
    const tabButton = H`<button part="tab" slot="tabs" type="button" on:click=${(ev) => self.openTab(tabName, ev)} class="ui-tabbed-box-tab" role="tab" tab-name=${tabName} tab-index=${idx}>${tabLabel}</button>`;
    addPartProperty$1(tabButton, tabName);
    propRef(self, "currentTab")?.[$trigger]?.();
    return tabButton;
  }
  //
  openTab(tabName, ev) {
    if (!tabName) return;
    const self = this;
    if (tabName) {
      const btn = self.shadowRoot?.querySelector(`[tab-name="${tabName}"]`);
      if (btn instanceof HTMLElement) btn?.focus?.();
      self.currentTab = tabName ?? self.currentTab;
      self.dispatchEvent(new TabChangedEvent$1("tab-changed", { bubbles: true }, self.currentTab));
    }
  }
  //
  styles = () => styled$9;
  render = function() {
    const self = this;
    const root = H`
        <div class="ui-tabbed-box-tabs-container"><form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(self.tabs ?? /* @__PURE__ */ new Map()), ([key, _], idx) => this.createTab(key, idx))}</form></div>
        <div class="ui-tabbed-box-content" part="content"><slot></slot></div>`;
    return root;
  };
  //
  tabsBox;
  detachTabsOverflow;
  resizeObserver;
  observeTabsOverflow() {
    const self = this;
    this.tabsBox = self.shadowRoot?.querySelector?.(".ui-tabbed-box-tabs") ?? void 0;
    const tabsBox = this.tabsBox;
    if (!tabsBox) return;
    this.detachTabsOverflow?.();
    this.resizeObserver?.disconnect();
    const updateIndicators = () => {
      queueMicrotask(() => {
        if (tabsBox) {
          const maxScrollLeft = tabsBox.scrollWidth - tabsBox.clientWidth;
          const hasOverflow = maxScrollLeft > 1;
          const startOverflow = tabsBox.scrollLeft > 1;
          const endOverflow = tabsBox.scrollLeft < maxScrollLeft - 1;
          if (tabsBox.hasAttribute("scrollable") !== hasOverflow) {
            tabsBox.toggleAttribute("scrollable", hasOverflow);
          }
          if (tabsBox.hasAttribute("scrollable-start") !== startOverflow) {
            tabsBox.toggleAttribute("scrollable-start", startOverflow);
          }
          if (tabsBox.hasAttribute("scrollable-end") !== endOverflow) {
            tabsBox.toggleAttribute("scrollable-end", endOverflow);
          }
        }
      });
    };
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
        const delta = clamp$1(event.deltaY, -80, 80);
        tabsBox.scrollLeft += delta;
        event.preventDefault();
      }
    };
    const onPointerUp = () => updateIndicators();
    tabsBox.addEventListener("wheel", onWheel, { passive: false });
    tabsBox.addEventListener("scroll", updateIndicators, { passive: true });
    tabsBox.addEventListener("pointerup", onPointerUp, { passive: true });
    this.detachTabsOverflow = () => {
      tabsBox.removeEventListener("wheel", onWheel);
      tabsBox.removeEventListener("scroll", updateIndicators);
      tabsBox.removeEventListener("pointerup", onPointerUp);
    };
    updateIndicators();
    queueMicrotask(updateIndicators);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(updateIndicators);
      this.resizeObserver.observe(tabsBox);
    }
  }
};
__decorateClass$9([
  property({ source: "attr", name: "current-tab" })
], TabbedBox.prototype, "currentTab", 2);
__decorateClass$9([
  property({ source: "attr", name: "orient" })
], TabbedBox.prototype, "orient", 2);
TabbedBox = __decorateClass$9([
  defineElement("ui-tabbed-box")
], TabbedBox);

const styles$8 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer box-with-sidebar{:host,:host ::slotted(*),:host :where(*){background-color:initial;border:0 #0000;box-sizing:border-box;line-height:0;margin:0;outline:0 none #0000;overflow:hidden;padding:0;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;user-select:none;-webkit-tap-highlight-color:transparent;content-visibility:visible;gap:0}:host{--ui-shadow-soft:#0002}:host{--button-inline-size:4rem;--sidebar-inline-grid-size:max-content;background-color:initial;block-size:stretch;container-type:inline-size;display:grid!important;gap:0;grid-template-columns:[sidebar-col] minmax(0,var(--sidebar-inline-grid-size)) [button-col] minmax(0,var(--button-inline-size)) [content-col] minmax(0,1fr)!important;grid-template-rows:[bar-row] minmax(0,4rem) [content-row] minmax(0,1fr)!important;inline-size:stretch;padding:var(--padding-sm);perspective:1000;position:relative}@container (min-inline-size: 800px){:host{--button-inline-size:0px}}@container (max-inline-size: 800px){:host{padding:0;--sidebar-inline-grid-size:0px}}:host .bar{background-color:initial;block-size:fit-content;box-shadow:none;color:--c2-on-surface(0,var(--current,currentColor));display:grid;flex-direction:row;gap:0;grid-column:1/-1;grid-row:bar-row;grid-template-columns:subgrid;grid-template-rows:minmax(0,max-content);inline-size:stretch;max-block-size:stretch;min-block-size:2rem;overflow:hidden;padding:0;padding-inline:0;place-content:center;place-items:center;pointer-events:none;z-index:3}:host .bar ::slotted([slot=bar]){block-size:stretch;flex-grow:1;grid-column:3/-1;grid-row:1/span 1;inline-size:stretch;place-content:center;place-items:center}:host .bar button{aspect-ratio:1/1;background-color:initial;block-size:fit-content;border:0 #0000;border-radius:.5rem;box-sizing:border-box;color:--c2-on-surface(0,var(--current,currentColor));cursor:pointer;display:flex;flex-direction:row;gap:0;grid-column:1/span 2;grid-row:1/span 1;inline-size:fit-content;min-block-size:2.5rem;outline:0 none #0000;padding:.333rem;place-content:center;place-items:center;pointer-events:auto;transition:background-color .12s linear}@media (hover:hover){:host .bar button:hover{background-color:--c2-surface(.1,var(--current,currentColor))}}:host .bar button:active{background-color:--c2-surface(.1,var(--current,currentColor))}:host .bar button span{color:--c2-on-surface(0,var(--current,currentColor));display:block;font-size:.8rem;font-weight:400;padding-inline-end:.333rem}:host .bar ui-icon{color:--c2-on-surface(0,var(--current,currentColor));--icon-color:--c2-on-surface(0.0,var(--current,currentColor))}:host .content-box{background:none;background-color:initial;border-radius:.25rem;box-shadow:none;contain:none;display:grid!important;gap:0;grid-column:1/-1!important;grid-row:1/-1!important;grid-template-columns:subgrid;grid-template-rows:subgrid;overflow:hidden;z-index:1}:host .sidebar{border-radius:.5rem;box-shadow:none;display:flex;flex-direction:column;gap:0;grid-column:1/span 1;grid-row:2/-1;justify-content:start;overflow:hidden;padding:0!important;transform:translateX(0);z-index:2}:host .sidebar{min-inline-size:clamp(min(20rem,100%),max(16rem,10cqi),100cqi)}@container (min-inline-size: 800px){:host .sidebar{grid-row:1/-1}}:host .sidebar{min-block-size:0}:host .sidebar ::slotted([slot=sidebar]){block-size:stretch;flex-grow:1;inline-size:stretch;line-height:normal;place-content:center;align-content:start;box-shadow:none;gap:0;padding:0;place-items:center}@container (max-inline-size: 800px){:host .sidebar{pointer-events:none;transform:translate3d(-100%,0,0);transition:transform var(--transition-medium,.28s) ease,box-shadow var(--transition-medium,.28s) ease}:host .sidebar:is([data-visible],[data-visible=\"\"]){box-shadow:0 0 1rem var(--ui-shadow-soft);pointer-events:auto;transform:translateZ(0)}@starting-style{:host .sidebar:is([data-visible],[data-visible=\"\"]){box-shadow:none;transform:translate3d(-100%,0,0)}}:host .sidebar[data-visible=false]{pointer-events:none}}:host .content{background:none;background-color:initial;block-size:stretch;box-shadow:none;contain:none;container-type:inline-size;display:grid!important;flex-direction:column;gap:0;grid-column:1/-1;grid-row:1/-1;grid-template-columns:[sidebar-col] minmax(0,0) [button-col] minmax(0,var(--button-inline-size)) [content-col] minmax(0,1fr);grid-template-rows:[bar-row] minmax(0,4rem) [content-row] minmax(0,1fr);inline-size:stretch;max-block-size:none;max-inline-size:none;overflow:hidden;z-index:1}:host .content::slotted(*){block-size:stretch;box-shadow:none;display:grid;flex-grow:1;gap:0;grid-column:2/-1;grid-row:2/-1;inline-size:stretch;place-content:center;place-items:center;will-change:contents}:host .content::slotted([aria-hidden=true],[data-hidden],:not([data-active])){display:none!important}@container (min-inline-size: 800px){:host .content{grid-column:content-col!important}:host .sidebar{grid-column:sidebar-col!important;transform:translateX(0)}:host .bar button{display:none}}}";

var __defProp$8 = Object.defineProperty;
var __getOwnPropDesc$8 = Object.getOwnPropertyDescriptor;
var __decorateClass$8 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$8(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$8(target, key, result);
  return result;
};
const styled$8 = preloadStyle(styles$8);
let BoxWithSidebar = class extends UIElement {
  sidebarOpened = booleanRef(false);
  //@ts-ignore
  //
  constructor() {
    super();
  }
  onInitialize() {
    super.onInitialize?.();
  }
  onRender() {
    const self = this;
    makeClickOutsideTrigger(self.sidebarOpened, Q("button", self?.shadowRoot), Q(".sidebar", self?.shadowRoot));
    Q("a")?.addEventListener?.("click", () => {
      self.sidebarOpened.value = false;
    });
    self.sidebarOpened.value = false;
  }
  //
  styles = () => styled$8;
  render = function() {
    return H`<div part="bar" class="bar c2-surface"><button part="open-sidebar" class="open-sidebar c2-surface" on:click=${() => {
      this.sidebarOpened.value = !this.sidebarOpened.value;
    }}><ui-icon icon="${conditional(this.sidebarOpened, "text-outdent", "list")}"></ui-icon></button><slot name="bar"></slot></div>
    <div part="content-box" class="content-box"><div part="sidebar" class="sidebar" data-visible=${this.sidebarOpened}><slot name="sidebar"></slot></div><div part="content" class="content"><slot></slot></div></div>`;
  };
};
BoxWithSidebar = __decorateClass$8([
  defineElement("ui-box-with-sidebar")
], BoxWithSidebar);

const styles$7 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@property --sidebar-inline-grid-size{syntax:\"<length-percentage>\";inherits:true;initial-value:0px}@layer tabbed-with-sidebar{:host,:host ::slotted(*),:host :where(*){background-color:--c2-surface(.15,var(--current,currentColor));border:0 #0000;box-sizing:border-box;line-height:0;margin:0;outline:0 none #0000;overflow:hidden;padding:0;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;user-select:none;-webkit-tap-highlight-color:transparent;border-radius:0;content-visibility:visible;gap:0;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0}:host{--tabbed-min-bar-size:3.5rem;--tabbed-gap:var(--gap-sm,0.5rem);--tabbed-padding-inline:0.25rem;--tabbed-padding-block:0.25rem;--tabbed-tab-gap:var(--gap-md,0.375rem);--tabbed-indicator-height:0.2rem;--tabbed-indicator-ease:var(--ease-emphasized,cubic-bezier(0.2,0,0,1));--tabbed-indicator-duration:var(--duration-normal,160ms);--tabbed-button-size:var(--tabbed-min-bar-size,3rem);--tabbed-icon-size:clamp(1.25rem,1cqi,1.5rem);--tabbed-close-size:clamp(2rem,1cqi,3rem);--tabbed-close-color:color-mix(in oklch,var(--md3-on-surface) 65%,#0000);--tabbed-bar-block-size:3.5rem;--tabbed-tabs-block-gap:var(--padding-sm,0.5rem);--ui-shadow-soft:#0002;--button-inline-size:var(--tabbed-button-size,3rem);--sidebar-inline-grid-size:0px}:host{backdrop-filter:none;filter:none}:host>:where(*){backdrop-filter:none;filter:none;z-index:2}:host button{border:none;box-sizing:border-box;outline:none;user-select:none;-webkit-tap-highlight-color:transparent;pointer-events:auto}:host{--tabbed-grid-rows:[bar-row] minmax(0px,3.5rem) [content-row] minmax(0px,1fr)}:host([data-tab-position=bottom]){--tabbed-grid-rows:[content-row] minmax(0px,1fr) [bar-row] minmax(0px,3.5rem)}:host([data-tab-position=top]){--tabbed-grid-rows:[bar-row] minmax(0px,3.5rem) [content-row] minmax(0px,1fr)}:host{background:none;background-color:initial;block-size:stretch;border-radius:0!important;box-sizing:border-box!important;contain:strict!important;container-type:inline-size;display:grid!important;gap:0;grid-template-columns:[sidebar-col] minmax(0,var(--sidebar-inline-grid-size,0)) [button-col] minmax(0,var(--button-inline-size,3rem)) [content-col] minmax(0,1fr)!important;grid-template-rows:var(--tabbed-grid-rows)!important;inline-size:stretch;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:0;min-inline-size:0;overflow:hidden!important;padding:0;padding-block-start:0;perspective:1000;place-content:space-evenly!important;place-items:center!important;position:relative}:host .ui-backdrop{background-color:initial;block-size:stretch;grid-column:1/-1!important;grid-row:1/-1!important;inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;opacity:1;pointer-events:none;position:relative;transition:opacity var(--transition-medium,.28s) var(--ease-out);z-index:0}:host .ui-underlay{background-color:initial;block-size:stretch;grid-column:1/-1!important;grid-row:content-row!important;inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;opacity:1;pointer-events:none;position:relative;transition:opacity var(--transition-medium,.28s) var(--ease-out);z-index:1}:host .toggle-toolbar{align-items:center;aspect-ratio:1/1;block-size:fit-content;border:none;border-radius:50cqmin;color:color-mix(in oklch,var(--md3-on-surface) 85%,#0000);content-visibility:visible;cursor:pointer;display:flex;flex-direction:row;flex-shrink:0;float:end;gap:0;grid-column:content-col;grid-row:1;inline-size:fit-content;inset:auto;inset-inline-end:.125rem;justify-content:center;justify-self:end;margin:0;margin-inline-start:var(--tabbed-tab-gap);max-block-size:2.5rem;max-inline-size:2.5rem;min-block-size:2.5rem;min-inline-size:2.5rem;outline:none;overflow:visible;padding:.25rem;place-content:center;place-items:center;text-align:center;touch-action:pan-x;transition:color var(--duration-normal) var(--ease-out),transform var(--duration-fast) var(--ease-emphasized),background-color var(--duration-normal) var(--ease-out);z-index:7}:host .toggle-toolbar ui-icon{aspect-ratio:1/1;block-size:var(--tabbed-icon-size);color:inherit;flex-shrink:0;inline-size:var(--tabbed-icon-size);max-block-size:var(--tabbed-icon-size);max-inline-size:var(--tabbed-icon-size);min-block-size:var(--tabbed-icon-size);min-inline-size:var(--tabbed-icon-size);--icon-color:inherit}:host .toggle-toolbar:hover{color:color-mix(in oklch,var(--md3-on-surface) 92%,#0000)}:host .toggle-toolbar:active{transform:scale(.9)}:host .toggle-toolbar:focus-visible{outline:2px solid color-mix(in oklch,currentColor 35%,#0000);outline-offset:2px}:host .toggle-toolbar[aria-expanded=true]{color:var(--md3-on-primary)}:host ::slotted([slot=bar]),:host::slotted([slot=bar]){background-color:initial;block-size:stretch;flex-grow:1;grid-column:1/-1;grid-row:1/-1;inline-size:stretch;max-block-size:3rem;place-content:center;place-items:center}:host .bar{backdrop-filter:blur(1rem);background-color:oklch(from --c2-surface(.15,var(--current,currentColor)) l c h/.9);block-size:stretch;border-radius:0;box-shadow:none;box-sizing:border-box;display:grid;filter:none;gap:0;grid-auto-rows:0;grid-column:1/-1;grid-row:bar-row;grid-template-columns:[sidebar-col] minmax(0,0) [button-col] minmax(0,3.5rem) [content-col] minmax(0,1fr) [pinned-col] minmax(0,3.5rem);grid-template-rows:minmax(0,1fr);inline-size:stretch;max-block-size:3.5rem;min-block-size:stretch;overflow:hidden;padding-block:.25rem;padding-inline:.75rem;place-content:center;place-items:center;pointer-events:auto;z-index:3}:host .bar>:where(*){grid-row:1}:host :host .bar{margin-block-end:var(--space-md);margin-block-start:0}:host([tab-position=bottom]) :host .bar{margin-block-end:0;margin-block-start:var(--space-md)}:host([tab-position=top]) :host .bar{margin-block-end:var(--space-md);margin-block-start:0}:host .bar .toolbar-slot{block-size:stretch;grid-column:content-col;grid-row:1/span 1;inline-size:stretch;max-block-size:3rem;max-inline-size:stretch;min-block-size:3rem;min-inline-size:0;padding:0;place-content:center;justify-content:center;place-items:center;align-items:center;border-radius:50cqmin;gap:0;inset:0;margin:0;opacity:0;overflow:hidden;pointer-events:none;transition:opacity var(--duration-normal,.16s) var(--ease-out,ease),visibility var(--duration-normal,.16s) var(--ease-out,ease);visibility:hidden;z-index:7}:host .bar .toolbar-slot[toolbar-opened=true]{opacity:1;pointer-events:auto;visibility:visible}:host .bar button.open-sidebar{align-items:center;aspect-ratio:1/1;background-color:--c2-surface(var(--_color-shade),var(--current,currentColor));block-size:stretch;border:0 #0000;border-radius:50cqmin;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:row;gap:0;grid-column:button-col;grid-row:1;inline-size:fit-content;justify-content:center;margin-inline-end:var(--space-sm);max-inline-size:3rem;min-block-size:3rem;min-inline-size:3rem;outline:0 none #0000;padding:.25rem;place-content:center;place-items:center;pointer-events:auto;touch-action:pan-x;transition:background-color var(--duration-normal,.16s) var(--ease-out,ease)}:host .bar button.open-sidebar ui-icon{aspect-ratio:1/1;block-size:var(--tabbed-icon-size);flex-shrink:0;inline-size:var(--tabbed-icon-size);max-block-size:var(--tabbed-icon-size);max-inline-size:var(--tabbed-icon-size);min-block-size:var(--tabbed-icon-size);min-inline-size:var(--tabbed-icon-size)}:host .bar button.open-sidebar span{display:block;font-size:.8rem;font-weight:400;padding-inline-end:.333rem}:host .bar button.open-sidebar:focus-visible{outline:2px solid color-mix(in oklch,currentColor 35%,#0000);outline-offset:2px}:host .bar :where(.ui-tabbed-box-tab) button{padding:.5rem;touch-action:pan-x}:host .bar .ui-tabbed-box-handle{block-size:0;inline-size:0;overflow:visible;place-content:center;place-items:center;pointer-events:none;touch-action:pan-x;visibility:hidden}:host .bar ui-icon{color:--c2-on-surface(0,var(--current,currentColor));content-visibility:visible;pointer-events:none;--icon-color:--c2-on-surface(0.0,var(--current,currentColor));block-size:var(--tabbed-icon-size);inline-size:var(--tabbed-icon-size)}:host([tab-position=bottom]) .bar :host .bar{align-self:end}:host([sidebar-drop-menu]) :host .bar button.open-sidebar{display:flex!important}@container (min-inline-size: 800px){:host(:not([sidebar-drop-menu])) :host .bar{--button-inline-size:0px}:host(:not([sidebar-drop-menu])) :host .bar button.open-sidebar{display:none}}:host .sidebar{background:none;background-color:initial;border-radius:0;box-shadow:none;display:flex;filter:none;flex-direction:column;gap:0;grid-column:1/span 2;grid-row:2/-1;justify-content:start;margin:0!important;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;overflow:visible;padding:0!important;transform:translateX(0);transition-behavior:allow-discrete;z-index:2}:host .sidebar ::slotted([slot=sidebar]){block-size:stretch;flex-grow:1;gap:0;grid-row:1/-1;inline-size:stretch;margin:0;max-block-size:stretch;padding:0;place-content:center;align-content:start;box-shadow:none;line-height:normal;place-items:center}:host(:not([sidebar-drop-menu])){--sidebar-inline-grid-size:0px}:host(:not([sidebar-drop-menu])) .sidebar{block-size:stretch;grid-column:1/span 2;inline-size:clamp(min(20rem,100%),max(16rem,10cqi),100cqi);max-block-size:stretch;max-inline-size:none;min-inline-size:0;pointer-events:none;position:relative;transform:translate3d(-100%,0,0);transition:transform var(--transition-medium,.28s) ease,box-shadow var(--transition-medium,.28s) ease;will-change:inline-size}:host(:not([sidebar-drop-menu])) .sidebar:is([sidebar-opened=false],:not([sidebar-opened=true],[sidebar-opened=\"\"])){pointer-events:none;transform:translate3d(-100%,0,0)}:host(:not([sidebar-drop-menu])) .sidebar:is([sidebar-opened=true],[sidebar-opened=\"\"]){pointer-events:auto;transform:translateZ(0)}@starting-style{:host(:not([sidebar-drop-menu])) .sidebar:is([sidebar-opened=true],[sidebar-opened=\"\"]){box-shadow:none;transform:translate3d(-100%,0,0)}}:host([sidebar-drop-menu]){--sidebar-inline-grid-size:0px}:host([sidebar-drop-menu]) .sidebar{background-color:color-mix(in oklch,var(--surface-color) 96%,#0000);block-size:stretch;border:1px solid color-mix(in oklch,var(--md3-outline) 40%,#0000);border-radius:0;box-shadow:0 1.5rem 3rem color-mix(in oklch,#000 22%,#0000);grid-column:sidebar-col!important;grid-row:2/-1;inline-size:min(26rem,80cqi);max-block-size:min(48rem,100cqb);min-inline-size:clamp(16rem,32cqi,24rem);opacity:0;padding-block:clamp(.75rem,1cqb + .5rem,1.25rem);padding-inline:clamp(.75rem,1cqi + .75rem,1.5rem);pointer-events:none;transform:translate3d(0,-20%,0);transform-origin:top center;transition:visibility var(--transition-medium,.3s) steps(1,jump-both),transform var(--transition-medium,.3s) var(--ease-emphasized),opacity var(--transition-medium,.3s) var(--ease-out),box-shadow var(--transition-medium,.3s) var(--ease-emphasized);transition-behavior:allow-discrete;visibility:hidden;z-index:5}:host([sidebar-drop-menu]) .sidebar:is([sidebar-opened=\"\"],[sidebar-opened=true]){opacity:1;pointer-events:auto;transform:translateZ(0);visibility:visible}@starting-style{:host([sidebar-drop-menu]) .sidebar:is([sidebar-opened=\"\"],[sidebar-opened=true]){transform:translate3d(0,-20%,0)}}:host([sidebar-drop-menu]) .sidebar:has([sidebar-opened=true]) .content-box:after{opacity:.6;pointer-events:auto}:host([sidebar-drop-menu][tab-position=bottom]) .sidebar{inset-block-end:calc(var(--tabbed-bar-block-size) + var(--tabbed-padding-block));inset-block-start:auto;transform:translate3d(0,20%,0);transform-origin:bottom center}@starting-style{:host([sidebar-drop-menu][tab-position=bottom]) .sidebar:is([sidebar-opened=\"\"],[sidebar-opened=true]){transform:translate3d(0,20%,0)}}:host .content-box{background:none;background-color:initial!important;block-size:stretch;border-radius:0;box-shadow:none;contain:none;display:grid!important;gap:0;grid-column:1/-1!important;grid-row:1/-1!important;grid-template-columns:subgrid;grid-template-rows:subgrid;inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;overflow:hidden;pointer-events:none;position:relative;z-index:1}:host([sidebar-drop-menu]) :host .content-box{overflow:visible}:host .content-box :where(.ui-tabbed-box-content,.content){align-content:start;background:none;background-color:initial!important;block-size:stretch;border-radius:0;box-shadow:none;contain:strict;container-type:inline-size;content-visibility:auto;display:grid!important;flex-direction:column;gap:0;grid-column:1/-1;grid-row:1/-1;grid-template-columns:[content-col] minmax(0,1fr);grid-template-rows:var(--tabbed-grid-rows);inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;perspective:1000;pointer-events:none;transform:translateZ(0);will-change:contents}:host .content-box ::slotted(*){background-color:initial;block-size:stretch;box-shadow:none;color:var(--md3-on-surface);display:grid;flex-direction:column;flex-grow:1;gap:0;grid-column:1/-1;grid-row:content-row;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);inline-size:stretch;line-height:var(--leading-normal,1.5);max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;overflow:auto;place-content:center;place-items:center;scrollbar-gutter:stable both-edges}:host .content-box ::slotted([aria-hidden=true],[hidden],:not([active])){display:none!important}@container (min-inline-size: 800px){:host .content-box .content{grid-column:2/-1!important}}@container (min-inline-size: 800px){:host([sidebar-drop-menu]) .content-box .content{isolation:isolate}:host([sidebar-drop-menu]) .content-box .content:after{background:color-mix(in oklch,var(--md3-surface) 60%,#0000);border-radius:0;content:\"\";inset:clamp(0px,1cqi,.5rem);opacity:0;pointer-events:none;position:absolute;transition:opacity var(--transition-medium,.28s) var(--ease-out);z-index:4}}:host .ui-tabbed-box-tabs{align-items:center;block-size:fit-content;border-radius:50cqmin;contain:strict;display:flex;flex-direction:row;gap:.25rem;grid-column:content-col;grid-row:1;inline-size:stretch;max-block-size:3rem;max-inline-size:stretch;min-block-size:3rem;overflow:hidden;overscroll-behavior-inline:contain;padding-block:.25rem;padding-inline:.25rem;place-content:center flex-start;justify-content:safe flex-start;place-items:center flex-start;justify-items:safe flex-start;pointer-events:auto;position:relative;scroll-behavior:smooth;scrollbar-gutter:stable;text-align:start;touch-action:pan-x;z-index:6}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab){background-color:initial;block-size:fit-content;border-radius:50cqmin;color:color-mix(in oklch,var(--md3-on-surface) 85%,#0000);content-visibility:visible;cursor:pointer;display:flex;flex-direction:row;flex-shrink:0;gap:.25rem;inline-size:fit-content;isolation:isolate;letter-spacing:.01em;max-block-size:2.5rem;min-block-size:2.5rem;min-inline-size:3rem;overflow:visible;padding-block:.25rem;padding-inline:.125rem;place-content:center;place-items:center;pointer-events:auto;position:relative;text-align:center;touch-action:pan-x;transition:color var(--duration-normal) var(--ease-out),transform var(--duration-fast) var(--ease-emphasized)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):after{background:currentColor;block-size:var(--tabbed-indicator-height);border-radius:var(--tabbed-indicator-height);content:\"\";inset-block-end:calc(var(--tabbed-indicator-height) * -1);inset-inline:clamp(.5rem,4cqi,1rem);inset-inline-end:3rem;opacity:0;overflow:visible;place-content:center;place-items:center;position:absolute;text-align:center;transform:translate3d(0,50%,0) scaleX(.6);transition:transform var(--tabbed-indicator-duration) var(--tabbed-indicator-ease),opacity var(--tabbed-indicator-duration) var(--tabbed-indicator-ease)}:host([tab-position=bottom]) :host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):after{inset-block-end:auto;inset-block-start:calc(var(--tabbed-indicator-height) * -1);transform:translate3d(0,-50%,0) scaleX(.6)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):where([aria-selected=true],[active],.is-active,.active){color:var(--md3-on-primary);place-content:center;place-items:center;text-align:center;transform:translateY(-2px)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):where([aria-selected=true],[active],.is-active,.active):after{background:var(--md3-on-primary);opacity:1;transform:translateZ(0) scaleX(1)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):disabled{opacity:var(--state-opacity-disabled,.38)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) :where(.ui-tabbed-box-tab-label){align-items:center;block-size:fit-content;color:inherit;content-visibility:visible;display:inline-flex;gap:var(--gap-3xs,.2rem);inline-size:fit-content;justify-content:flex-start;line-height:var(--leading-tight,1.1);margin-inline:1rem;pointer-events:none;text-align:inherit}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) :where(.ui-tabbed-box-tab-close){align-items:center;aspect-ratio:1/1;background-color:initial;block-size:fit-content;border:none;border-radius:var(--radius-full);box-sizing:border-box;color:var(--tabbed-close-color);content-visibility:visible;cursor:pointer;display:inline-flex;flex-shrink:0;gap:0;inline-size:fit-content;justify-content:center;max-block-size:2.25rem;max-inline-size:2.25rem;min-block-size:2.25rem;min-inline-size:2.25rem;outline:none;padding:.25rem;transition:color var(--duration-normal) var(--ease-out),transform var(--duration-fast) var(--ease-emphasized)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) :where(.ui-tabbed-box-tab-close) ui-icon{color:--c2-on-surface(0,var(--current,currentColor));content-visibility:visible;--icon-color:--c2-on-surface(0.0,var(--current,currentColor));block-size:calc(var(--tabbed-close-size) * .5);inline-size:calc(var(--tabbed-close-size) * .5)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) :where(.ui-tabbed-box-tab-close):focus-visible{outline:2px solid color-mix(in oklch,currentColor 35%,#0000);outline-offset:2px}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) :where(.ui-tabbed-box-tab-close):hover{color:color-mix(in oklch,var(--md3-on-surface) 92%,#0000)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) :where(.ui-tabbed-box-tab-close):active{transform:scale(.9)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):where([aria-selected=true],[active],.is-active,.active) .ui-tabbed-box-tab-close{color:color-mix(in oklch,var(--surface-on-primary) 85%,#0000);--icon-color:color-mix(in oklch,var(--surface-on-primary) 85%,#0000)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) ui-icon{color:--c2-on-surface(0,var(--current,currentColor));--icon-color:--c2-on-surface(0.0,var(--current,currentColor));aspect-ratio:1/1;block-size:var(--tabbed-icon-size);content-visibility:visible;inline-size:var(--tabbed-icon-size);max-block-size:stretch;max-inline-size:stretch;padding:0;place-content:center;place-items:center;text-align:center}:host([tab-position=bottom]) .ui-tabbed-box-tabs :host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab){margin-block-end:0;margin-block-start:var(--tabbed-tabs-block-gap)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):after,:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):before{background:linear-gradient(90deg,color-mix(in oklch,var(--md3-surface) 70%,#0000) 0,#0000 100%);content:\"\";inline-size:min(1.75rem,8%);inset-block:0;opacity:clamp(0,(var(--scroll-gradient,0)),1);pointer-events:none;position:absolute;transition:opacity var(--duration-normal) var(--ease-out)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):before{inset-inline-start:0;transform:scaleX(-1);--scroll-gradient:attr(data-scrollable-start number,0)}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab):after{inset-inline-end:0;--scroll-gradient:attr(data-scrollable-end number,0)}@supports (mask-image:linear-gradient(rgba(0,0,0,0),#000)){:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab)[data-scrollable=true]{mask-image:linear-gradient(90deg,#0000,#000 min(2.5rem,18%),#000 calc(100% - min(2.5rem, 18%)),#0000)}}:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab),:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) *,:host .ui-tabbed-box-tabs :where(.ui-tabbed-box-tab) button{touch-action:pan-x}:host .ui-tabbed-box-tabs.pinned{background-color:initial;block-size:stretch;border-radius:0;contain:none;display:grid;font-size:0;gap:0;grid-column:pinned-col;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);inline-size:max-content;line-height:0;margin-inline:0;margin-inline-start:var(--space-sm);overflow:visible;padding:0;padding-inline:0;place-content:center!important;place-items:center!important;text-align:center!important}:host .ui-tabbed-box-tabs.pinned .ui-tabbed-box-tab{aspect-ratio:1/1;block-size:stretch!important;border-radius:50cqmin;display:grid;font-size:0;gap:0!important;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);inline-size:fit-content;inset:0;line-height:0;max-block-size:3rem;min-block-size:3rem;min-inline-size:3rem;overflow:hidden;padding-inline:0!important;place-content:center!important;place-items:center!important;pointer-events:auto;text-align:center!important}:host .ui-tabbed-box-tabs.pinned .ui-tabbed-box-tab>*{background-color:initial;grid-column:1/-1;grid-row:1/-1}:host .ui-tabbed-box-tabs.pinned .ui-tabbed-box-tab-close{display:none!important;margin-inline:0!important}:host .ui-tabbed-box-tabs.pinned:after{inset:0!important;margin:0!important}:host .ui-tabbed-box-tabs.pinned ui-icon{block-size:2rem;inline-size:2rem;padding:0}}";

var __defProp$7 = Object.defineProperty;
var __getOwnPropDesc$7 = Object.getOwnPropertyDescriptor;
var __decorateClass$7 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$7(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$7(target, key, result);
  return result;
};
const styled$7 = preloadStyle(styles$7);
const renderTabName = (tabName) => {
  if (tabName == "home") {
    return H`<ui-icon icon="house-line"></ui-icon>`;
  }
  if (typeof tabName != "string") {
    return tabName;
  }
  if (tabName == null || tabName == "") return "";
  tabName = tabName?.replace?.(/_/g, " ") || tabName;
  tabName = tabName?.charAt?.(0)?.toUpperCase?.() + tabName?.slice?.(1) || tabName;
  return tabName;
};
const addPartProperty = (element, name = "") => {
  if (typeof element == "string") {
    return element;
  }
  if (element instanceof HTMLElement) {
    element?.setAttribute?.(`data-tab`, name);
    element?.setAttribute?.(`part`, "tab");
  }
  return element;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
class TabChangedEvent extends Event {
  newTab;
  constructor(name, options, newTab) {
    super(name, options);
    this.newTab = newTab;
  }
}
class TabCloseEvent extends Event {
  tabName;
  constructor(name, options, tabName) {
    super(name, options);
    this.tabName = tabName;
  }
}
let TabbedSidebar = class extends UIElement {
  currentTab = "";
  tabPosition = "top";
  sidebarAsDropMenu = null;
  sidebarOpened = false;
  toolbarOpened = false;
  //@ts-ignore
  //
  setTabs(tabs) {
    const self = this;
    self.tabs ??= tabs ?? self.tabs;
  }
  //
  createTab(tabName, idx) {
    if (!tabName) return;
    if (typeof tabName === "string" && tabName.startsWith("_")) {
      return;
    }
    const self = this;
    if (self?.shadowRoot?.querySelector(`[data-tab-name="${tabName}"]`)) return;
    const renderLabel = self?.renderTabName?.bind?.(self) ?? renderTabName;
    const rawLabel = renderLabel?.(tabName) ?? tabName;
    const readableLabel = typeof rawLabel === "string" ? rawLabel : renderTabName?.(String(tabName ?? "")) ?? String(tabName ?? "");
    const tabLabel = H`<span class="ui-tabbed-box-tab-label">${rawLabel}</span>`;
    const closeButton = tabName != "home" ? H`<button type="button" on:click=${(ev) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      if (ev?.target == ev?.currentTarget) {
        self?.dispatchEvent?.(new TabCloseEvent("tab-close", { bubbles: true, composed: true }, tabName));
      }
    }} class="ui-tabbed-box-tab-close" aria-label=${`Close ${readableLabel}`} part="tab-close">
            <ui-icon icon="x"></ui-icon>
        </button>` : null;
    const tabButton = H`<div on:click=${(ev) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      if (ev?.target == ev?.currentTarget) {
        self?.openTab?.(tabName, ev);
      }
    }} class="ui-tabbed-box-tab" role="tab" data-tab-name=${tabName}>${tabLabel}${closeButton}</div>`;
    addPartProperty(tabButton, tabName);
    propRef(self, "currentTab")?.[$trigger]?.();
    return tabButton;
  }
  //
  // Prevent recursive tab operations
  isOpeningTab = false;
  openingTabName = "";
  openTab(tabName, ev) {
    if (!tabName) return;
    if (this.isOpeningTab && this.openingTabName === tabName) {
      return;
    }
    this.isOpeningTab = true;
    this.openingTabName = tabName;
    try {
      const self = this;
      if (tabName && tabName != self?.currentTab) {
        self.currentTab = tabName ?? self?.currentTab;
      }
      self?.dispatchEvent?.(new TabChangedEvent("tab-changed", { bubbles: true, composed: true }, self.currentTab));
    } finally {
      this.isOpeningTab = false;
    }
  }
  //
  constructor() {
    super();
  }
  onInitialize() {
    super.onInitialize?.();
    const self = this;
    self.removeAttribute("sidebar-opened");
    self.removeAttribute("toolbar-opened");
    self.removeAttribute("sidebar-drop-menu");
    requestAnimationFrame(() => {
      self.removeAttribute("sidebar-drop-menu");
      self.removeAttribute("sidebar-opened");
      self.removeAttribute("toolbar-opened");
    });
    self.addEventListener("keydown", (e) => {
      const target = e?.composedPath?.()?.[0];
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isInput) {
        return;
      }
      if (e?.ctrlKey && (e?.key === "ArrowLeft" || e?.key === "ArrowRight") && self?.checkVisibility({
        contentVisibilityAuto: true,
        opacityProperty: true,
        visibilityProperty: true
      })) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        const rawTabs = Array.from(self?.tabs?.keys?.() ?? []);
        const tabs = rawTabs?.filter?.((k) => k !== "home" && !(typeof k === "string" && k.startsWith("_")));
        const currentIndex = tabs?.indexOf?.(self?.currentTab ?? "");
        let newIndex = currentIndex;
        if (newIndex === -1) {
          newIndex = 0;
        }
        if (e?.key === "ArrowLeft") {
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = tabs?.length - 1;
          }
        } else {
          newIndex = currentIndex + 1;
          if (newIndex >= tabs?.length) {
            newIndex = 0;
          }
        }
        const newTab = tabs?.[newIndex];
        self?.openTab?.(newTab);
      }
    });
  }
  //
  onRender() {
    const self = this;
    const sidebarOpenedRef = propRef(self, "sidebarOpened") ?? self.sidebarOpened;
    makeClickOutsideTrigger(
      sidebarOpenedRef,
      Q("button.open-sidebar", self?.shadowRoot),
      Q(".sidebar", self?.shadowRoot)
    );
    Q("a")?.addEventListener?.("click", () => {
      self.sidebarOpened = false;
    });
    self.sidebarOpened = false;
    const sidebarEl = self?.shadowRoot?.querySelector?.(".sidebar");
    if (sidebarEl && sidebarOpenedRef) {
      sidebarEl._backUnreg = registerSidebar(sidebarEl, sidebarOpenedRef, () => {
        self.sidebarOpened = false;
      });
    }
    if (!self.tabs || !self.currentTab) return;
    this.observeTabsOverflow?.();
  }
  //
  sidebarUniqueId = `tabbed-sidebar-${Math.random().toString(36).slice(2)}`;
  tabsBox;
  detachTabsOverflow;
  resizeObserver;
  observeTabsOverflow() {
    const self = this;
    self.tabsBox = self.shadowRoot?.querySelector?.(".ui-tabbed-box-tabs") ?? "";
    if (!self.tabsBox) return;
    self.detachTabsOverflow?.();
    self.resizeObserver?.disconnect();
    const updateIndicators = () => {
      queueMicrotask(() => {
        if (self.tabsBox) {
          const maxScrollLeft = self.tabsBox.scrollWidth - self.tabsBox.clientWidth;
          const hasOverflow = maxScrollLeft > 1;
          const startOverflow = self.tabsBox.scrollLeft > 1;
          const endOverflow = self.tabsBox.scrollLeft < maxScrollLeft - 1;
          if (self.tabsBox.hasAttribute("data-scrollable") !== hasOverflow) {
            self.tabsBox.toggleAttribute("data-scrollable", hasOverflow);
          }
          if (self.tabsBox.hasAttribute("data-scrollable-start") !== startOverflow) {
            self.tabsBox.toggleAttribute("data-scrollable-start", startOverflow);
          }
          if (self.tabsBox.hasAttribute("data-scrollable-end") !== endOverflow) {
            self.tabsBox.toggleAttribute("data-scrollable-end", endOverflow);
          }
        }
      });
    };
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
        const delta = clamp(event.deltaY, -80, 80);
        self.tabsBox.scrollLeft += delta;
        event.preventDefault();
      }
    };
    const onPointerUp = () => updateIndicators();
    self.tabsBox.addEventListener("wheel", onWheel, { passive: false });
    self.tabsBox.addEventListener("scroll", updateIndicators, { passive: true });
    self.tabsBox.addEventListener("pointerup", onPointerUp, { passive: true });
    self.detachTabsOverflow = () => {
      self.tabsBox.removeEventListener("wheel", onWheel);
      self.tabsBox.removeEventListener("scroll", updateIndicators);
      self.tabsBox.removeEventListener("pointerup", onPointerUp);
    };
    updateIndicators();
    queueMicrotask(updateIndicators);
    if (typeof ResizeObserver !== "undefined") {
      self.resizeObserver = new ResizeObserver(updateIndicators);
      self.resizeObserver.observe(self.tabsBox);
    }
  }
  //
  styles = () => styled$7;
  render = function() {
    const openedProperty = propRef(this, "sidebarOpened") ?? this.sidebarOpened;
    const toolbarOpenedProperty = propRef(this, "toolbarOpened") ?? this.toolbarOpened;
    return H`<div part="bar" class="bar">
            <button
                part="open-sidebar"
                class="open-sidebar c2-surface"
                aria-haspopup="menu"
                aria-controls=${this.sidebarUniqueId}
                aria-expanded=${conditional(openedProperty, "true", "false")}
                on:click=${() => {
      this.sidebarOpened = !this.sidebarOpened;
    }}
            ><ui-icon icon="${conditional(openedProperty, "text-outdent", "list")}"></ui-icon></button>
            <form class="ui-tabbed-box-tabs pinned" part="pinned">${this.createTab("home")}</form>
            <div class="toolbar-slot" toolbar-opened=${conditional(toolbarOpenedProperty, "true", "false")}><slot name="bar"></slot></div>
            <form class="ui-tabbed-box-tabs" part="tabs">${M(observableByMap(this.tabs ?? /* @__PURE__ */ new Map()), ([key, _], idx) => key != "home" && typeof key == "string" && !key.startsWith("_") ? this.createTab(key) : null)}
            </form>

            <button
                type="button"
                part="toggle-toolbar"
                class="toggle-toolbar c2-surface"
                aria-label="Toggle toolbar"
                aria-expanded=${conditional(toolbarOpenedProperty, "true", "false")}
                on:click=${(ev) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      if (ev?.target == ev?.currentTarget) {
        this.toolbarOpened = !this.toolbarOpened;
      }
    }}
            ><ui-icon icon="${conditional(toolbarOpenedProperty, "caret-right", "caret-left")}"></ui-icon></button>
        </div>
        <div part="backdrop" class="ui-backdrop"><slot name="backdrop"></slot></div>
        <div part="underlay" class="ui-underlay"><slot name="underlay"></slot></div>
        <div part="content-box" class="content-box">
            <div part="sidebar" class="sidebar" id=${this.sidebarUniqueId} sidebar-opened=${conditional(openedProperty, "true", "false")}><slot name="sidebar"></slot></div>
            <div part="content" class="content"><slot></slot></div>
        </div>`;
  };
};
__decorateClass$7([
  property({ source: "attr", name: "current-tab" })
], TabbedSidebar.prototype, "currentTab", 2);
__decorateClass$7([
  property({ source: "attr", name: "tab-position" })
], TabbedSidebar.prototype, "tabPosition", 2);
__decorateClass$7([
  property({ source: "attr", name: "sidebar-drop-menu" })
], TabbedSidebar.prototype, "sidebarAsDropMenu", 2);
__decorateClass$7([
  property({ source: "attr", name: "sidebar-opened" })
], TabbedSidebar.prototype, "sidebarOpened", 2);
__decorateClass$7([
  property({ source: "attr", name: "toolbar-opened" })
], TabbedSidebar.prototype, "toolbarOpened", 2);
TabbedSidebar = __decorateClass$7([
  defineElement("ui-tabbed-with-sidebar")
], TabbedSidebar);

const styles$6 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@property --ui-slider-track-size{syntax:\"<percentage> | <length>\";inherits:true;initial-value:0}@property --ui-slider-thumb-size{syntax:\"<percentage> | <length>\";inherits:true;initial-value:0}@property --ui-slider-track-radius{syntax:\"<percentage> | <length>\";inherits:true;initial-value:0}@property --ui-slider-thumb-radius{syntax:\"<percentage> | <length>\";inherits:true;initial-value:0}@property --ui-slider-gap{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-slider-track-color{syntax:\"<color>\";inherits:true;initial-value:#0000}@property --ui-slider-thumb-color{syntax:\"<color>\";inherits:true;initial-value:#0000}@property --ui-slider-active-color{syntax:\"<color>\";inherits:true;initial-value:#0000}@layer ui-slider{:host(ui-slider),:host(ui-slider) .ui-box,:host(ui-slider) .ui-thumb,:host(ui-slider) .ui-track{box-sizing:border-box;transition-behavior:allow-discrete;interpolate-size:allow-keywords;pointer-events:none;user-select:none}:host(ui-slider){--ui-slider-track-size:0.125rem;--ui-slider-thumb-size:1rem;--ui-slider-track-radius:0.0625rem;--ui-slider-thumb-radius:0.5rem;--ui-slider-thumb-color:--c2-surface(0.0,var(--current));--ui-slider-track-color:--c2-surface(0.1,var(--current));--ui-slider-active-color:--c2-surface(1.0,var(--current))}:host(ui-slider){block-size:fit-content;inline-size:fit-content;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:2rem}:host(ui-slider) :where(.ui-box){cursor:pointer;pointer-events:auto}:host(ui-slider) :where(.ui-box) :where(.ui-track){background-image:linear-gradient(to right,var(--ui-slider-active-color) calc(100% * var(--value, 0)),var(--ui-slider-track-color) 0);cursor:pointer;inset-block-start:50%;inset-inline-start:50%;pointer-events:auto;transform:translate3d(-50%,-50%,0)}:host(ui-slider) :where(.ui-box) :where(.ui-thumb){--travel-x:calc(100cqi - var(--ui-slider-thumb-size, 0px) * 2 - var(--ui-slider-gap, 0px) * 2);--shift-x:calc(var(--value, 0) * var(--travel-x, 100cqi));background-color:--c2-surface(0,var(--current));border-radius:50%;box-shadow:0 1px 2px #00000026,0 1px 1px #00000014;cursor:grab;inset:auto;inset-block-start:50%;inset-inline-start:0;pointer-events:auto;transform:translate3d(calc(clamp(0px, var(--drag-x, 0) * 1px + var(--shift-x, 0px), var(--travel-x, 100cqi)) + var(--ui-slider-thumb-size, 0px) / 2 + var(--ui-slider-gap, 0px)),-50%,0);z-index:1}:host(ui-slider) :where(.ui-box) :where(.ui-thumb):not([data-dragging]){transform:translate3d(calc(clamp(0px, (var(--shift-x, 0px)), var(--travel-x, 100cqi)) + var(--ui-slider-thumb-size, 0px) / 2 + var(--ui-slider-gap, 0px)),-50%,0);transition:--translate-x .1s ease-in-out}:host(ui-slider) :where(.ui-box) :where(.ui-thumb)[data-dragging]{cursor:grabbing;transition:none}:host(ui-slider) :where(.ui-box) :where(.ui-thumb):active{cursor:grabbing}:host(ui-slider) ::slotted(input){display:none!important}:host(ui-slider[variant=switch]){--ui-slider-track-size:1.25rem;--ui-slider-thumb-size:1rem;--ui-slider-track-radius:calc(var(--ui-slider-track-size) / 2);--ui-slider-thumb-radius:50%;--ui-slider-track-color:--c2-on-surface(0.0,var(--current));--ui-slider-active-color:--c2-on-surface(-1.0,var(--current));--ui-slider-gap:calc((var(--ui-slider-track-size) - var(--ui-slider-thumb-size)) / 2)}:host(ui-slider[variant=switch]) .ui-box{background-color:color-mix(in oklch,var(--ui-slider-active-color) calc(100% * var(--value, 0)),var(--ui-slider-track-color));background-image:none;cursor:pointer;pointer-events:auto}:host(ui-slider[variant=switch]) .ui-box .ui-thumb{cursor:grab;pointer-events:auto}:host(ui-slider[variant=switch]) .ui-box .ui-track{background-color:initial;background-image:none}:host(ui-slider[variant=slider]){--ui-slider-track-size:0.0625rem;--ui-slider-thumb-size:0.75rem;--ui-slider-track-radius:9999px;--ui-slider-thumb-radius:50%;--ui-slider-track-color:--c2-on-surface(0.0,var(--current));--ui-slider-active-color:--c2-on-surface(-1.0,var(--current));--ui-slider-gap:calc((var(--ui-slider-track-size) - var(--ui-slider-thumb-size)) / 2)}:host(ui-slider[variant=slider]) .ui-box{cursor:pointer;pointer-events:auto}:host(ui-slider[variant=slider]) .ui-box .ui-thumb{cursor:grab;pointer-events:auto}}";

var __defProp$6 = Object.defineProperty;
var __getOwnPropDesc$6 = Object.getOwnPropertyDescriptor;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass$6 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$6(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$6(target, key, result);
  return result;
};
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
const styled$6 = preloadStyle(styles$6);
let SliderInput = class extends UIElement {
  get valueAsNumber() {
    return getInputValues(this.input)?.[0] || 0;
  }
  input;
  thumb;
  handle;
  name = "";
  value = null;
  min = "0";
  max = "100";
  step = "1";
  type;
  disabled = false;
  variant;
  //
  constructor() {
    super();
    this.internals_ = this.attachInternals();
  }
  //
  styles = () => styled$6;
  render = () => H`
<div class="ui-box c2-surface" part="box">
    <div class="ui-track c2-surface" part="track"></div>
    <div class="ui-thumb c2-surface" part="thumb" style="z-index: 99;"></div>
</div>
<slot></slot>
`;
  //
  onRender() {
    super.onRender();
    queueMicrotask(() => this.initializeInput());
  }
  initializeInput() {
    const self = this;
    if (!self?.querySelector?.("input")) {
      const newInput = document.createElement("input");
      self?.append?.(newInput);
    }
    {
      const newInput = Q("input", self);
      newInput.type = newInput?.type || self?.type || "range";
      newInput.value ||= self?.value || self?.min || "0";
      self.type = newInput.type || self?.type;
      bindWith(newInput, "value", propRef(self, "value"), handleProperty, null, true);
      bindWith(newInput, "name", propRef(self, "name"), handleProperty);
      bindWith(newInput, "min", propRef(self, "min"), handleProperty);
      bindWith(newInput, "max", propRef(self, "max"), handleProperty);
      bindWith(newInput, "step", propRef(self, "step"), handleProperty);
      bindWith(newInput, "type", propRef(self, "type"), handleProperty);
      bindWith(newInput, "disabled", propRef(self, "disabled"), handleProperty);
    }
  }
  //
  onInitialize() {
    super.onInitialize();
    const host = this;
    if (!host.getAttribute("variant")) {
      const inputType = this.type || "range";
      host.setAttribute("variant", inputType === "checkbox" ? "switch" : "slider");
    }
    queueMicrotask(() => {
      if (this.input && this.thumb && this.handle) {
        dragSlider(this.thumb, this.handle, this.input);
      }
    });
    assign([this.internals_, "ariaValueMax"], computed(attrRef(this.input, "max"), (v) => getInputValues(this.input)?.[2] ?? v));
    assign([this.internals_, "ariaValueMin"], computed(attrRef(this.input, "min"), (v) => getInputValues(this.input)?.[1] ?? v));
    assign([this.internals_, "ariaValueNow"], computed(valueAsNumberRef(this.input), (v) => getInputValues(this.input)?.[0] ?? v));
    assign([this.internals_, "ariaValueText"], valueRef(this.input));
    assign([this.internals_, "ariaOrientation"], "horizontal");
    assign([this.internals_, "ariaLive"], "polite");
    assign([this.internals_, "ariaRelevant"], "additions");
    assign([this.internals_, "ariaRole"], "slider");
  }
};
//
__publicField$1(SliderInput, "formAssociated", true);
__decorateClass$6([
  property({ source: "query", name: "input" })
], SliderInput.prototype, "input", 2);
__decorateClass$6([
  property({ source: "query-shadow", name: ".ui-thumb" })
], SliderInput.prototype, "thumb", 2);
__decorateClass$6([
  property({ source: "query-shadow", name: ".ui-box" })
], SliderInput.prototype, "handle", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "name", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "value", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "min", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "max", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "step", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "type", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "disabled", 2);
__decorateClass$6([
  property({ source: "attr" })
], SliderInput.prototype, "variant", 2);
SliderInput = __decorateClass$6([
  defineElement("ui-slider")
], SliderInput);

const styles$5 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer ui-text{:host(ui-longtext){--background-tone-shift:0.01;--ui-text-background-color:--c2-surface(var(--background-tone-shift,0.0),var(--current,#0000));--ui-text-color:--c2-on-surface(var(--ui-text-tone-shift,0.0),var(--current,currentColor));--ui-text-font-size:0.9rem;--ui-text-font-family:\"InterVariable\",\"Inter\",Helvetica,Calibri,Carlito;--ui-text-border-width:0.0625rem;--ui-text-radius:0.5rem;--ui-text-border-radius:0.5rem;--ui-text-border-color:--c2-on-surface(var(--ui-text-tone-shift,0.0),var(--current,currentColor))}:host(ui-longtext){background-color:initial!important;block-size:fit-content;border:0 #0000;contain:none;container-type:size;content-visibility:visible;display:grid!important;font-size:var(--ui-text-font-size,1rem);grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;inline-size:stretch;line-height:0;margin:0!important;max-block-size:stretch;max-inline-size:none;min-block-size:2rem;outline:0 none #0000;overflow:hidden;padding:0!important;place-content:stretch;place-items:stretch;pointer-events:none;position:relative;text-align:start;user-select:none}:host(ui-longtext),:host(ui-longtext) *,:host(ui-longtext) ::slotted(*){box-sizing:border-box;transition-behavior:allow-discrete;interpolate-size:allow-keywords;border:0 #0000;margin:0;outline:0 none #0000;padding:0;white-space:nowrap;text-spacing-trim:normal;text-wrap:nowrap;word-break:keep-all}:host(ui-longtext) slot{background-color:initial!important;border:0 #0000!important;box-shadow:none!important;color:inherit!important;contain:none!important;container-type:normal!important;display:contents!important;outline:none!important;pointer-events:none!important;white-space:nowrap!important;text-spacing-trim:normal!important;margin:0!important;padding:0!important;text-wrap:nowrap!important;word-break:keep-all!important}:host(ui-longtext),:host(ui-longtext) *{box-sizing:border-box;transition-behavior:allow-discrete;interpolate-size:allow-keywords;pointer-events:none;user-select:none}:host(ui-longtext){border-color:var(--ui-text-border-color,--c2-on-surface(var(--ui-text-tone-shift,0),var(--current,currentColor)));border-radius:var(--ui-text-border-radius,.5rem);border-style:solid;border-width:0}:host(ui-longtext)>*{background-color:initial;block-size:100%;border:0 #0000;font-family:var(--ui-text-font-family,inherit);font-size:var(--ui-text-font-size,1rem);grid-column:1/-1;grid-row:1/-1;inline-size:100%;justify-content:start;margin:0;max-block-size:none;max-inline-size:none;outline:0 none #0000;overflow:hidden;padding:0;pointer-events:none;text-align:start;user-select:none}:host(ui-longtext) .box-layer{block-size:stretch;content-visibility:visible;display:block;flex-direction:row;font-size:0;grid-column:1/-1;grid-row:1/-1;inline-size:stretch;line-height:0;max-block-size:stretch;max-inline-size:stretch;min-block-size:fit-content;place-content:stretch;align-content:center;justify-content:start;place-items:stretch;align-items:center;border:0 #0000!important;contain:none;font-family:var(--ui-text-font-family,inherit);justify-items:start;margin:0!important;outline:0 none #0000!important;overflow:visible;overflow-block:visible;overflow-inline:scroll;padding:0!important;position:relative;text-align:start;user-select:none;white-space:nowrap;text-spacing-trim:normal;background-color:var(--ui-text-background-color,#0000);clip-path:inset(0 .125rem round .125rem);mask-clip:padding-box;mask-image:linear-gradient(90deg,#0000,#0000 .125rem,#000 .5rem,#000 calc(100% - .5rem),#0000 calc(100% - .125rem),#0000);mask-mode:alpha;mask-origin:content-box;mask-position:center center;mask-repeat:no-repeat;mask-size:100% 100%;pointer-events:auto;scrollbar-color:#0000 #0000;scrollbar-width:none;text-wrap:nowrap;word-break:keep-all}:host(ui-longtext) ::slotted(*){block-size:stretch;inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;place-self:stretch}:host(ui-longtext) ::slotted(ui-scrollframe){block-size:stretch!important;inline-size:stretch!important;max-block-size:none;max-inline-size:none;min-block-size:2rem;place-self:stretch;z-index:1!important}:host(ui-longtext) ::slotted(input){block-size:stretch;cursor:text;display:inline-block;font-size:var(--ui-text-font-size,1rem);inline-size:max-content!important;max-block-size:stretch;max-inline-size:none!important;min-block-size:fit-content;min-inline-size:stretch;place-content:stretch;justify-content:start;place-items:stretch;place-self:stretch;justify-self:start;padding:.25rem .5rem .333rem;text-align:start;user-select:text;field-sizing:content;box-sizing:border-box;font-family:var(--ui-text-font-family,inherit);overflow:visible!important;text-overflow:ellipsis;white-space:nowrap;text-spacing-trim:normal;background-color:initial!important;border:0 #0000!important;margin:0!important;outline:0 none #0000!important;pointer-events:auto;text-wrap:nowrap;visibility:visible;word-break:keep-all}}";

var __defProp$5 = Object.defineProperty;
var __getOwnPropDesc$5 = Object.getOwnPropertyDescriptor;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass$5 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$5(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$5(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _connected;
const styled$5 = preloadStyle(styles$5);
let LongTextInput = class extends UIElement {
  //
  constructor() {
    super();
    __publicField(this, "input");
    __publicField(this, "box");
    __publicField(this, "name", "");
    __publicField(this, "value", null);
    __publicField(this, "placeholder", "");
    __publicField(this, "disabled", false);
    __publicField(this, "readOnly", false);
    __publicField(this, "required", false);
    __privateAdd(this, _connected, Promise.withResolvers());
    //
    __publicField(this, "styles", function() {
      return styled$5;
    });
    __publicField(this, "render", function() {
      return H`<div class="box-layer" part="box-layer"><slot></slot></div>`;
    });
    this.internals_ = this.attachInternals();
    __privateSet(this, _connected, Promise.withResolvers());
  }
  //
  onRender() {
    super.onRender();
    __privateGet(this, _connected).resolve(true);
    const self = this;
    self.style.display = "grid";
    const box = self?.shadowRoot?.querySelector?.(".box-layer");
    addEvent(box, "wheel", (ev) => {
      if (ev?.deltaY !== 0) {
        box?.scrollBy?.({
          left: (-ev?.deltaY || 0) - (ev?.deltaX || 0),
          behavior: "smooth"
        });
        ev?.preventDefault?.();
      }
    });
    queueMicrotask(() => {
      this.initializeInput();
      self?.shadowRoot?.querySelector?.(".box-layer");
    });
  }
  initializeInput() {
    const self = this;
    if (!self?.querySelector?.("input")) {
      const newInput = document.createElement("input");
      self?.append?.(newInput);
    }
    {
      const newInput = self?.querySelector?.("input");
      newInput.type = "text";
      newInput.value ||= self?.value;
      bindWith(newInput, "value", propRef(self, "value"), handleProperty, null, true);
      bindWith(newInput, "name", propRef(self, "name"), handleProperty);
      bindWith(newInput, "placeholder", propRef(self, "placeholder"), handleProperty);
      bindWith(newInput, "disabled", propRef(self, "disabled"), handleProperty);
      bindWith(newInput, "readOnly", propRef(self, "readOnly"), handleProperty);
      bindWith(newInput, "required", propRef(self, "required"), handleProperty);
    }
  }
  //
  onInitialize() {
    super.onInitialize();
    assign([this.internals_, "ariaValueText"], this.value);
    assign([this.internals_, "ariaOrientation"], "horizontal");
    assign([this.internals_, "ariaLive"], "polite");
    assign([this.internals_, "ariaRelevant"], "additions");
    assign([this.internals_, "ariaRole"], "textbox");
  }
};
_connected = new WeakMap();
//
__publicField(LongTextInput, "formAssociated", true);
__decorateClass$5([
  property({ source: "query", name: "input" })
], LongTextInput.prototype, "input", 2);
__decorateClass$5([
  property({ source: "query-shadow", name: ".box-layer" })
], LongTextInput.prototype, "box", 2);
__decorateClass$5([
  property({ source: "attr" })
], LongTextInput.prototype, "name", 2);
__decorateClass$5([
  property({ source: "property" })
], LongTextInput.prototype, "value", 2);
__decorateClass$5([
  property({ source: "attr" })
], LongTextInput.prototype, "placeholder", 2);
__decorateClass$5([
  property({ source: "attr" })
], LongTextInput.prototype, "disabled", 2);
__decorateClass$5([
  property({ source: "attr" })
], LongTextInput.prototype, "readOnly", 2);
__decorateClass$5([
  property({ source: "attr" })
], LongTextInput.prototype, "required", 2);
LongTextInput = __decorateClass$5([
  defineElement("ui-longtext")
], LongTextInput);

const styles$4 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}";

var __defProp$4 = Object.defineProperty;
var __getOwnPropDesc$4 = Object.getOwnPropertyDescriptor;
var __decorateClass$4 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$4(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$4(target, key, result);
  return result;
};
const styled$4 = preloadStyle(styles$4);
let StatusBar = class extends UIElement$1 {
  constructor() {
    super();
  }
  //
  styles = () => styled$4;
  render = () => {
    return H`
<div style="background-color: transparent;" part="left"   class="left"  ><slot name="left"  ></slot></div>
        <div style="background-color: transparent;" part="center" class="center"><slot name="center"></slot></div>
        <div style="background-color: transparent;" part="right"  class="right" ><slot name="right" ></slot></div>`;
  };
};
StatusBar = __decorateClass$4([
  defineElement("ui-statusbar")
], StatusBar);

const styles$3 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}";

var __defProp$3 = Object.defineProperty;
var __getOwnPropDesc$3 = Object.getOwnPropertyDescriptor;
var __decorateClass$3 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$3(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$3(target, key, result);
  return result;
};
const styled$3 = preloadStyle(styles$3);
let UITaskBar = class extends UIElement$1 {
  constructor() {
    super();
  }
  styles = () => styled$3;
  render = () => H`<div part="taskbar" class="taskbar"><slot></slot></div>`;
};
UITaskBar = __decorateClass$3([
  defineElement("ui-taskbar")
], UITaskBar);

const styles$2 = "@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}:host(ui-task),:host(ui-task) *{box-sizing:border-box;touch-action:manipulation;user-select:none;-webkit-user-drag:none;-webkit-tap-highlight-color:transparent;border:0 #0000;gap:0;margin:0;padding:0}:host(ui-task){box-shadow:none;filter:none;pointer-events:auto;user-select:none}:host(ui-task)>*{pointer-events:none}:host(ui-task:hover){--background-tone-shift:0.1;background-color:--c2-surface(var(--background-tone-shift,0),var(--current))}:host(ui-task[data-focus]){border-block-end-color:--c2-on-surface(0,var(--current))!important}:host(ui-task:not([data-active])){opacity:.6}";

var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$2(target, key, result);
  return result;
};
const styled$2 = preloadStyle(styles$2);
let UITask = class extends UIElement$1 {
  title = "Task";
  icon = "github";
  //
  constructor() {
    super();
  }
  styles = () => styled$2;
  render = function() {
    return H`
            <div part="icon" class="task-icon c2-contrast c2-transparent"><ui-icon class="c2-contrast c2-transparent" part="icon" icon="${this.icon}"></ui-icon></div>
            <div part="title" class="task-title c2-contrast c2-transparent">${this.title}</div>
        `;
  };
};
__decorateClass$2([
  property({ source: "attr" })
], UITask.prototype, "title", 2);
__decorateClass$2([
  property({ source: "attr" })
], UITask.prototype, "icon", 2);
UITask = __decorateClass$2([
  defineElement("ui-task")
], UITask);

const styles$1 = "ui-taskbar[data-type=desktop]>ui-task[data-focus]{background:--c2-surface(0,var(--current));color:--c2-on-surface(0,var(--current))}:host(ui-taskbar[data-type=desktop]) ::slotted(ui-task[data-focus]){background:--c2-surface(0,var(--current));color:--c2-on-surface(0,var(--current))}";

preloadStyle(styles$1);

const styles = "ui-taskbar[data-type=mobile]>ui-task[data-focus]{background:--c2-surface(0,var(--current));color:--c2-on-surface(0,var(--current))}:host(ui-taskbar[data-type=mobile]) ::slotted(ui-task[data-focus]){background:--c2-surface(0,var(--current));color:--c2-on-surface(0,var(--current))}";

preloadStyle(styles);

const fmCss$1 = "@layer ux-file-manager-content{:host(ui-file-manager-content),:host(ui-file-manager-content) :where(*){overflow:hidden;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none}:host(ui-file-manager-content){background-color:var(--color-surface);block-size:stretch;border-radius:.5rem;color:var(--color-on-surface);contain:none;container-type:size;display:block;grid-column:1/-1;inline-size:stretch;isolation:isolate;margin:0;overflow:auto;perspective:1000;pointer-events:auto;position:relative;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;touch-action:manipulation;z-index:1}:host(ui-file-manager-content) .fm-grid{align-content:start;block-size:fit-content;display:grid;grid-template-rows:minmax(max-content,2rem) minmax(0,1fr);inline-size:stretch;min-block-size:stretch;overflow:visible;pointer-events:none;row-gap:var(--gap-xs);scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;touch-action:manipulation}@container (inline-size <= 600px){:host(ui-file-manager-content) .fm-grid{grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,0) [actions] minmax(8rem,max-content)}}:host(ui-file-manager-content) .fm-grid-rows{align-content:start;block-size:stretch;contain:strict;contain-intrinsic-size:1px 3rem;content-visibility:auto;display:grid;gap:var(--gap-xs);grid-auto-rows:3rem;grid-column:1/-1;grid-template-columns:subgrid;inline-size:stretch;overflow:auto;pointer-events:auto;scrollbar-color:var(--on-surface-color,currentColor) #0000;scrollbar-gutter:auto;scrollbar-width:thin;touch-action:manipulation;z-index:1}:host(ui-file-manager-content) .fm-grid-rows slot{display:contents!important}:host(ui-file-manager-content) :where(.row){block-size:3rem;border-radius:.375rem;color:var(--color-on-surface-variant);cursor:pointer;display:grid;grid-column:1/-1;grid-template-rows:2.5rem!important;inline-size:stretch;min-block-size:max-content;order:var(--order,1)!important;place-content:center;place-items:center;justify-items:start;padding:.25rem .375rem;place-self:center;pointer-events:auto;touch-action:manipulation;user-drag:none;-webkit-user-drag:none;background-color:var(--surface-color,#0000);flex-wrap:nowrap;gap:.25rem;letter-spacing:-.05em;overflow:hidden;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}@media (hover:hover) and (pointer:fine){:host(ui-file-manager-content) :where(.row){user-drag:element;-webkit-user-drag:element}}:host(ui-file-manager-content) :where(.row) ui-icon{block-size:1.25rem;inline-size:1.25rem;place-content:center;place-items:center}:host(ui-file-manager-content) :where(.row) a,:host(ui-file-manager-content) :where(.row) span{background-color:initial!important}:host(ui-file-manager-content) :where(.row)>*{background-color:initial!important;block-size:3rem;min-block-size:max-content}:host(ui-file-manager-content) .row:hover{background-color:var(--color-surface-container-high)}:host(ui-file-manager-content) .row:active{background-color:var(--color-surface-container-highest)}:host(ui-file-manager-content) .row:focus-visible{outline:var(--focus-ring)}:host(ui-file-manager-content) .c{block-size:3rem;color:var(--color-on-surface);display:flex;flex-direction:row;inline-size:auto;min-inline-size:0;overflow:hidden;place-content:center;justify-content:start;min-block-size:max-content;place-items:center;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}:host(ui-file-manager-content) .icon{grid-column:icon;place-content:center;place-items:center}:host(ui-file-manager-content) .name{grid-column:name;inline-size:stretch}:host(ui-file-manager-content) .size{grid-column:size}:host(ui-file-manager-content) .date{grid-column:date}:host(ui-file-manager-content) .actions{grid-column:actions}:host(ui-file-manager-content) .fm-grid,:host(ui-file-manager-content) .fm-grid-header,:host(ui-file-manager-content) .row,:host(ui-file-manager-content) ::slotted(.row){grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,8rem) [actions] minmax(8rem,max-content)}@container (inline-size <= 600px){:host(ui-file-manager-content) .fm-grid,:host(ui-file-manager-content) .fm-grid-header,:host(ui-file-manager-content) .row,:host(ui-file-manager-content) ::slotted(.row){grid-template-columns:[icon] minmax(0,2.5rem) [name] minmax(0,1fr) [size] minmax(0,3rem) [date] minmax(0,0) [actions] minmax(8rem,max-content)}:host(ui-file-manager-content) .date{display:none!important}}:host(ui-file-manager-content) .actions{background-color:var(--color-surface);block-size:stretch;border-radius:.5rem;box-shadow:0 .0625rem .125rem oklch(from #000 l c h/.1);color:var(--color-on-surface);display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;inline-size:fit-content;max-block-size:2rem;max-inline-size:stretch;overflow:hidden;padding:0;place-content:center;place-items:center;place-self:center;pointer-events:none}:host(ui-file-manager-content) .action-btn{appearance:none;aspect-ratio:1.25/1;background-color:var(--color-surface);block-size:stretch;border:none;border-radius:0;box-shadow:none;color:var(--color-on-surface);cursor:pointer;display:flex;inline-size:fit-content;max-block-size:stretch;max-inline-size:stretch;min-block-size:2rem;min-inline-size:2.5rem;overflow:visible;padding:.5rem;place-content:center;place-items:center;position:relative;transition:all .15s cubic-bezier(.4,0,.2,1)}:host(ui-file-manager-content) .action-btn ui-icon{block-size:stretch;inline-size:stretch;min-block-size:.875rem;min-inline-size:.875rem}:host(ui-file-manager-content) .fm-grid-header{border-radius:.375rem;display:grid;font-size:.875em;gap:.25rem;grid-column:1/-1;inset-block-start:0;opacity:1;padding:.25rem .375rem;place-content:center;justify-content:start;place-items:center;justify-items:start;pointer-events:auto;position:sticky!important;text-align:start;touch-action:manipulation;z-index:2}:host(ui-file-manager-content) .fm-grid-header>*{inline-size:auto}:host(ui-file-manager-content) .fm-grid-header .c{font-weight:600}:host(ui-file-manager-content) .fm-grid-header .icon{grid-column:icon}:host(ui-file-manager-content) .fm-grid-header .name{grid-column:name;inline-size:stretch}:host(ui-file-manager-content) .fm-grid-header .size{grid-column:size}:host(ui-file-manager-content) .fm-grid-header .date{grid-column:date}:host(ui-file-manager-content) .fm-grid-header .actions{block-size:fit-content;border-radius:0;box-shadow:none;display:flex;flex-direction:row;flex-wrap:nowrap;gap:.25rem;grid-column:actions;inline-size:stretch;max-inline-size:stretch;overflow:hidden;padding:0;place-content:center;justify-content:start;place-items:center;justify-items:start;text-align:start;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}}";

const handleCache = /* @__PURE__ */ new WeakMap();
class FileOperative {
  // refs/state
  #entries = ref([]);
  #loading = ref(false);
  #error = ref("");
  #fsRoot = null;
  #dirProxy = null;
  #loadLock = false;
  #clipboard = null;
  #subscribed = null;
  #loaderDebounceTimer = null;
  //
  host = null;
  pathRef = ref("/user/");
  //
  get path() {
    return this.pathRef?.value || "/user/";
  }
  set path(value) {
    if (this.pathRef) this.pathRef.value = value || "/user/";
  }
  get entries() {
    return this.#entries;
  }
  //
  constructor() {
    this.#entries = ref([]);
    this.pathRef ??= ref("/user/");
    affected(this.pathRef, (path) => this.loadPath(path || "/user/"));
    navigator?.storage?.getDirectory?.()?.then?.((h) => this.#fsRoot = h);
  }
  //
  itemAction(item) {
    const self = this;
    const detail = { path: (self.path || "/user/") + item?.name, item, originalEvent: null };
    const event = new CustomEvent("open-item", { detail, bubbles: true, composed: true, cancelable: true });
    this.host?.dispatchEvent(event);
    if (event.defaultPrevented) return;
    if (item?.kind === "directory") {
      const next = (self.path?.endsWith?.("/") ? self.path : self.path + "/") + item?.name + "/";
      self.path = next;
    } else {
      const openEvent = new CustomEvent("open", { detail, bubbles: true, composed: true });
      this.host?.dispatchEvent(openEvent);
    }
  }
  //
  async requestUse() {
  }
  //
  async refreshList(path = this.path) {
    if (this.#loadLock) {
      return requestIdleCallback(() => this.refreshList(path), { timeout: 1e3 });
    }
    this.#loadLock = true;
    try {
      await this.loadPath(path);
    } catch (e) {
      this.#error.value = e?.message || String(e || "");
      console.warn(e);
    } finally {
      this.#loadLock = false;
    }
    return this;
  }
  //
  async loadPath(path = this.path) {
    if (this.#loadLock) {
      return requestIdleCallback(() => this.loadPath(path), { timeout: 1e3 });
    }
    this.#loadLock = true;
    try {
      this.#loading.value = true;
      this.#error.value = "";
      const rel = path?.value || path || this.path || "/user/";
      if (this.#dirProxy?.dispose) {
        this.#dirProxy.dispose();
      }
      this.#dirProxy = openDirectory(this.#fsRoot, rel, { create: false });
      await this.#dirProxy;
      console.log("rel", rel);
      const loader = async ($map) => {
        const $entries = $map instanceof Map ? $map?.entries?.() : null;
        const handleMap = await Promise.all($entries ? Array.from($entries) : await Array.fromAsync(await this.#dirProxy?.entries?.() ?? []));
        const entries = (await Promise.all(handleMap?.map?.(async ($pair, index) => {
          return Promise.try(async () => {
            const [name, handle] = $pair;
            return handleCache?.getOrInsertComputed?.(handle, async () => {
              const kind = handle?.kind || (name?.endsWith?.("/") ? "directory" : "file");
              const item = observe({ name, kind, handle });
              if (kind === "file") {
                item.type = getMimeTypeByFilename?.(name);
                Promise.try(async () => {
                  try {
                    const f = await handle?.getFile?.();
                    item.file = f;
                    item.size = f?.size;
                    item.lastModified = f?.lastModified;
                    item.type = f?.type || item.type;
                  } catch {
                  }
                }).catch?.(console.warn.bind(console));
              }
              return item;
            });
          })?.catch?.(console.warn.bind(console));
        }))?.catch?.(console.warn.bind(console)))?.filter?.(($item) => $item != null);
        if (entries?.length != null && entries?.length >= 0 && typeof entries?.length == "number") {
          this.#entries.value = entries;
        }
        ;
      };
      const debouncedLoader = ($map) => {
        if (this.#loaderDebounceTimer) {
          clearTimeout(this.#loaderDebounceTimer);
        }
        this.#loaderDebounceTimer = setTimeout(() => loader($map), 50);
      };
      if (typeof this.#subscribed == "function") {
        this.#subscribed?.();
        this.#subscribed = null;
      }
      await loader(await this.#dirProxy?.getMap?.() ?? [])?.catch?.(console.warn.bind(console));
      this.#subscribed = affected(await this.#dirProxy?.getMap?.() ?? [], debouncedLoader);
    } catch (e) {
      this.#error.value = e?.message || String(e || "");
      console.warn(e);
    } finally {
      this.#loading.value = false;
      this.#loadLock = false;
    }
    this.#loadLock = false;
    return this;
  }
  //
  onRowClick = (item, ev) => {
    ev.preventDefault();
    this.itemAction(item);
  };
  onRowDblClick = (item, ev) => {
    ev.preventDefault();
    this.itemAction(item);
  };
  onRowDragStart = (item, ev) => {
    if (!ev.dataTransfer) return;
    ev.dataTransfer.effectAllowed = "copyMove";
    const abs = (this.path || "/user/") + (item?.name || "");
    ev.dataTransfer.setData("text/plain", abs);
    ev.dataTransfer.setData("text/uri-list", abs);
    if (item?.file) {
      ev.dataTransfer.setData("DownloadURL", item?.file?.type + ":" + item?.file?.name + ":" + URL.createObjectURL(item?.file));
      ev.dataTransfer.items.add(item?.file);
    }
  };
  //
  async onMenuAction(item, actionId, ev) {
    try {
      const itemName = item?.name;
      if (!actionId) return;
      const abs = (this.path || "/user/") + (itemName || "");
      switch (actionId) {
        case "open":
          this.itemAction(item);
          break;
        case "view":
          this.dispatchEvent(new CustomEvent("context-action", {
            detail: { action: "view", item }
          }));
          break;
        case "attach-workcenter":
          this.dispatchEvent(new CustomEvent("context-action", {
            detail: { action: "attach-workcenter", item }
          }));
          break;
        case "download":
          Promise.try(async () => {
            if (item?.kind === "file") {
              await downloadFile(await getFileHandle(this.#fsRoot, abs, { create: false }));
            } else {
              await downloadFile(await getDirectoryHandle(this.#fsRoot, abs, { create: false }));
            }
          }).catch(console.warn);
          break;
        case "delete":
          await remove(this.#fsRoot, abs);
          break;
        case "rename":
          if (item?.kind === "file") {
            const next = prompt("Rename to:", itemName);
            if (next && next !== itemName) {
              await this.renameFile(abs ?? "", next ?? "");
            }
          }
          break;
        case "copyPath":
          this.#clipboard = { items: [abs], cut: false };
          try {
            await navigator.clipboard?.writeText?.(abs);
          } catch {
          }
          break;
        case "copy":
          this.#clipboard = { items: [abs], cut: false };
          try {
            await navigator.clipboard?.writeText?.(abs);
          } catch {
          }
          break;
      }
    } catch (e) {
      console.warn(e);
      this.#error.value = e?.message || String(e || "");
    }
  }
  //
  async renameFile(oldName, newName) {
    const fromHandle = await getFileHandle(this.#fsRoot, oldName, { create: false });
    const file = await fromHandle?.getFile?.();
    if (!file) return;
    const target = await getFileHandle(this.#fsRoot, newName, { create: true }).catch(() => null);
    if (!target) {
      await writeFile(this.#fsRoot, this.path + newName, file);
    } else {
      await writeFile(this.#fsRoot, this.path + newName, file);
    }
    await remove(this.#fsRoot, this.path + oldName);
  }
  //
  async requestUpload() {
    try {
      if (window?.showDirectoryPicker) {
      }
      await uploadFile(this.path, null);
    } catch (e) {
      console.warn(e);
    }
  }
  //
  async requestPaste() {
    try {
      try {
        const clipboardItems = await navigator.clipboard.read();
        if (clipboardItems && clipboardItems.length > 0) {
          await handleIncomingEntries(clipboardItems, this.path || "/user/");
          return;
        }
      } catch (e) {
      }
      let systemText = "";
      try {
        systemText = await navigator.clipboard?.readText?.();
      } catch {
      }
      const internalItems = this.#clipboard?.items || [];
      if (systemText) {
        await handleIncomingEntries({
          getData: (type) => type === "text/plain" ? systemText : ""
        }, this.path || "/user/");
        return;
      }
      if (internalItems.length > 0) {
        const txt = internalItems.join("\n");
        await handleIncomingEntries({
          getData: (type) => type === "text/plain" ? txt : ""
        }, this.path || "/user/");
        if (this.#clipboard?.cut) {
          for (const src of internalItems) {
            await remove(this.#fsRoot, src);
          }
          this.#clipboard = null;
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }
  //
  onPaste(ev) {
    ev.preventDefault();
    if (ev.clipboardData || ev.dataTransfer) {
      handleIncomingEntries(ev.clipboardData || ev.dataTransfer, this.path || "/user/");
      return;
    }
    this.requestPaste();
  }
  //
  onCopy(ev) {
  }
  //
  async onDrop(ev) {
    ev.preventDefault();
    if (ev.clipboardData || ev.dataTransfer) {
      handleIncomingEntries(ev.clipboardData || ev.dataTransfer, this.path || "/user/");
      return;
    }
  }
  //
  dispatchEvent(event) {
    this.host?.dispatchEvent(event);
  }
}

const disconnectRegistry = new FinalizationRegistry((ctxMenu) => {
});
const makeFileActionOps = () => {
  return [
    { id: "open", label: "Open", icon: "function" },
    { id: "view", label: "View", icon: "eye" },
    { id: "attach-workcenter", label: "Attach to Work Center", icon: "lightning" },
    { id: "download", label: "Download", icon: "download" }
  ];
};
const makeFileSystemOps = () => {
  return [
    { id: "delete", label: "Delete", icon: "trash" },
    { id: "rename", label: "Rename", icon: "pencil" },
    { id: "copyPath", label: "Copy Path", icon: "copy" },
    { id: "movePath", label: "Move Path", icon: "hand-withdraw" }
  ];
};
let hasContextMenu = null;
const makeContextMenu = () => {
  if (hasContextMenu) return hasContextMenu;
  const ctxMenu = H`<ul class="grid-rows round-decor ctx-menu ux-anchor" style="position: fixed; z-index: 99999;" data-hidden></ul>`;
  hasContextMenu = ctxMenu;
  const basicApp = document.querySelector(".basic-app");
  (basicApp || document.body).append(ctxMenu);
  return ctxMenu;
};
const createItemCtxMenu = async (fileManager, onMenuAction, entries) => {
  const ctxMenuDesc = {
    openedWith: null,
    items: [
      makeFileActionOps(),
      makeFileSystemOps()
    ],
    defaultAction: (initiator, menuItem, ev) => {
      const rowFromCompose = Array.from(ev?.composedPath?.() || []).find((element) => element?.classList?.contains?.(".row")) || MOCElement(initiator, ".row");
      requestAnimationFrame(() => onMenuAction?.((entries?.value ?? entries)?.find?.((item) => item?.name === rowFromCompose?.getAttribute?.("data-id")), menuItem?.id, ev));
    }
  };
  const initiatorElement = fileManager;
  const ctxMenu = makeContextMenu();
  ctxMenuTrigger(initiatorElement, ctxMenuDesc, ctxMenu);
  disconnectRegistry.register(initiatorElement, ctxMenu);
  return ctxMenu;
};

const iconByMime = (mime, def = "file") => {
  if (!mime) return def;
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "music";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "file-text";
  if (mime.includes("zip") || mime.includes("7z") || mime.includes("rar")) return "file-archive";
  if (mime.includes("json")) return "brackets-curly";
  if (mime.includes("csv")) return "file-spreadsheet";
  if (mime.includes("xml")) return "code";
  if (mime.startsWith("text/")) return "file-text";
  return def;
};
const EXTENSION_ICON_MAP = {
  // Documents
  md: "file-text",
  txt: "file-text",
  pdf: "file-pdf",
  doc: "file-doc",
  docx: "file-doc",
  // Images
  png: "file-image",
  jpg: "file-image",
  jpeg: "file-image",
  gif: "file-image",
  svg: "file-image",
  webp: "file-image",
  // Code
  js: "file-js",
  ts: "file-ts",
  jsx: "file-jsx",
  tsx: "file-tsx",
  html: "file-html",
  css: "file-css",
  scss: "file-css",
  json: "file-json",
  // Archives
  zip: "file-zip",
  tar: "file-zip",
  gz: "file-zip",
  rar: "file-zip",
  // Media
  mp3: "file-audio",
  wav: "file-audio",
  mp4: "file-video",
  mov: "file-video",
  webm: "file-video"
};
const getFileIcon = (filename) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return EXTENSION_ICON_MAP[ext] || "file";
};
const iconFor = (item, type) => {
  if (typeof item === "string") {
    return item === "directory" ? "folder" : iconByMime(item || "");
  }
  if (item?.kind === "directory") return "folder";
  return iconByMime(item?.type) || getFileIcon(item?.name || "");
};
const dateCache = /* @__PURE__ */ new Map();
const formatDate = (timestamp) => {
  if (timestamp === void 0 || timestamp === null) return "";
  const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  if (dateCache.has(ts)) {
    return dateCache.get(ts);
  }
  const formatted = new Date(ts).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short"
  });
  dateCache.set(ts, formatted);
  return formatted;
};

var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$1(target, key, result);
  return result;
};
initGlobalClipboard();
const styled$1 = preloadStyle(fmCss$1);
let FileManagerContent = class extends UIElement {
  gridRowsEl;
  gridEl;
  //
  operativeInstance = null;
  operativeInstanceRef = ref(null);
  //
  get entries() {
    return this.operativeInstance?.entries ?? [];
  }
  get path() {
    return this.operativeInstance?.path || "/user/";
  }
  set path(value) {
    if (this.operativeInstance) this.operativeInstance.path = value || "/user/";
  }
  get pathRef() {
    return this.operativeInstance?.pathRef;
  }
  //
  refreshList() {
    if (this.gridRowsEl) this.gridRowsEl.innerHTML = ``;
    if (this.gridEl) this.gridEl.innerHTML = ``;
    if (this.operativeInstance) this.operativeInstance.refreshList(this.path || "/user/");
  }
  //
  onInitialize() {
    const result = super.onInitialize();
    return result ?? this;
  }
  //
  bindDropHandlers() {
    const container = this;
    if (!container) return;
    addEvent(container, "dragover", (ev) => {
      if (isInFocus(ev?.target, "ui-file-manager-content, ui-file-manager")) {
        ev?.preventDefault?.();
        if (ev.dataTransfer) {
          ev.dataTransfer.dropEffect = "copy";
        }
      }
    });
    addEvent(container, "drop", (ev) => {
      if (isInFocus(ev?.target, "ui-file-manager-content, ui-file-manager")) {
        ev?.preventDefault?.();
        ev?.stopImmediatePropagation?.();
        this.operativeInstance?.onDrop?.(ev);
      }
    });
  }
  //
  onPaste(ev) {
    if (isInFocus(ev?.target, "ui-file-manager-content, ui-file-manager")) {
      if (this.operativeInstance) this.operativeInstance.onPaste(ev);
    }
  }
  //
  onCopy(ev) {
    if (isInFocus(ev?.target, "ui-file-manager-content, ui-file-manager")) {
      if (this.operativeInstance) this.operativeInstance.onCopy(ev);
    }
  }
  //
  byFirstTwoLetterOrName(name) {
    const firstTwoLetters = name?.substring?.(0, 2)?.toUpperCase?.();
    const index = (firstTwoLetters?.charCodeAt?.(0) || 65) - 65;
    return index;
  }
  //
  constructor() {
    super();
    this.operativeInstance ??= new FileOperative();
    this.operativeInstance.host = this;
    this.refreshList();
  }
  //
  styles = () => styled$1;
  render = function() {
    const self = this;
    const fileHeader = H`<div class="fm-grid-header">
            <div class="c icon">@</div>
            <div class="c name">Name</div>
            <div class="c size">Size</div>
            <div class="c date">Modified</div>
            <div class="c actions">Actions</div>
        </div>`;
    const operative = self.operativeInstance;
    if (!operative) return "";
    const makeListElement = (item) => {
      const isFile = item?.kind === "file" || item?.file;
      const itemEl = H`<div draggable="${isFile}" data-id=${propRef(item, "name")} class="row c2-surface"
                on:click=${(ev) => requestAnimationFrame(() => operative.onRowClick?.(item, ev))}
                on:dblclick=${(ev) => requestAnimationFrame(() => operative.onRowDblClick?.(item, ev))}
                on:dragstart=${(ev) => operative.onRowDragStart?.(item, ev)}
                data-id=${propRef(item, "name")}
            >
                <div style="pointer-events: none; background-color: transparent;" class="c icon"><ui-icon icon=${computed(item, () => {
        return iconFor(item);
      })} /></div>
                <div style="pointer-events: none; background-color: transparent;" class="c name" title=${propRef(item, "name")}>${propRef(item, "name")}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c size">${isFile ? propRef(item, "size") : ""}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c date">${isFile ? computed(propRef(item, "lastModified"), (val) => {
        return formatDate(val ?? 0);
      }) : ""}</div>
                <div style="pointer-events: none; background-color: transparent;" class="c actions">
                    <button class="action-btn" title="Copy Path" on:click=${(ev) => {
        ev.stopPropagation();
        requestAnimationFrame(() => operative.onMenuAction?.(item, "copyPath", ev));
      }}>
                        <ui-icon icon="copy" />
                    </button>
                    <button class="action-btn" title="Copy" on:click=${(ev) => {
        ev.stopPropagation();
        requestAnimationFrame(() => operative.onMenuAction?.(item, "copy", ev));
      }}>
                        <ui-icon icon="clipboard" />
                    </button>
                    <button class="action-btn" title="Delete" on:click=${(ev) => {
        ev.stopPropagation();
        requestAnimationFrame(() => operative.onMenuAction?.(item, "delete", ev));
      }}>
                        <ui-icon icon="trash" />
                    </button>
                </div>
            </div>`;
      bindWith(itemEl, "--order", computed(propRef(item, "name"), (val) => {
        return self.byFirstTwoLetterOrName(val ?? "");
      }), handleStyleChange);
      return itemEl;
    };
    let fileRows = null;
    const renderedEntries = M(self.entries, (file, idx) => {
      console.log(file, idx);
      if (typeof file == "object" && file != null && file?.name != null) {
        return makeListElement({ name: file.name, kind: file.kind, size: file.size, lastModified: file.lastModified });
      }
      return null;
    });
    fileRows = H`<div class="fm-grid-rows" style="will-change: contents;">${renderedEntries}</div>`;
    renderedEntries.boundParent = fileRows;
    createItemCtxMenu?.(fileRows, operative.onMenuAction.bind(operative), self.entries);
    queueMicrotask(() => self.bindDropHandlers());
    const rendered = H`<div class="fm-grid" part="grid">
            ${fileHeader}
            ${fileRows}
        </div>`;
    return rendered;
  };
};
__decorateClass$1([
  property({ source: "query-shadow", name: ".fm-grid-rows" })
], FileManagerContent.prototype, "gridRowsEl", 2);
__decorateClass$1([
  property({ source: "query-shadow", name: ".fm-grid" })
], FileManagerContent.prototype, "gridEl", 2);
FileManagerContent = __decorateClass$1([
  defineElement("ui-file-manager-content")
], FileManagerContent);

const fmCss = "@layer ux-file-manager{:host(ui-file-manager),:host(ui-file-manager) :where(*){border:0 #0000;box-sizing:border-box;line-height:0;margin:0;outline:0 none #0000;overflow:hidden;padding:0;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none;user-select:none;-webkit-tap-highlight-color:transparent}:host(ui-file-manager){background-color:var(--color-surface);block-size:stretch;border-radius:0;color:var(--color-on-surface);container-type:inline-size;content-visibility:auto;display:grid;inline-size:stretch;margin:0;overflow:hidden;perspective:1000}:host(ui-file-manager) .fm-root{block-size:stretch;display:grid;gap:var(--gap-xs);grid-template-columns:[content-col] minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);inline-size:stretch;overflow:hidden}:host(ui-file-manager) .fm-toolbar{border-radius:.5rem;display:grid;gap:.5rem;grid-auto-flow:column;grid-column:1/-1;grid-template-columns:minmax(0,max-content) minmax(0,1fr) minmax(0,max-content);grid-template-rows:minmax(0,1fr);line-height:0;padding:.25rem;place-content:center;place-items:center}:host(ui-file-manager) .fm-toolbar button,:host(ui-file-manager) .fm-toolbar input{background-color:var(--color-surface-container);color:var(--color-on-surface)}:host(ui-file-manager) .fm-toolbar input{block-size:stretch;border:0 #0000;inline-size:stretch;outline:0 none #0000;overflow:auto;padding:.25rem}:host(ui-file-manager) .fm-toolbar .btn{appearance:none;aspect-ratio:1/1;block-size:2.5rem;border:0;border-radius:0;cursor:pointer;inline-size:2.5rem;padding:.65rem;transition:background .1s ease-in-out}:host(ui-file-manager) .fm-toolbar>*{block-size:fit-content;border-radius:.5rem;display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;min-block-size:stretch;overflow:hidden;padding:0}:host(ui-file-manager) .fm-toolbar .fm-toolbar-left{grid-column:1}:host(ui-file-manager) .fm-toolbar .fm-toolbar-left,:host(ui-file-manager) .fm-toolbar .fm-toolbar-right{border-radius:var(--radius-lg,.25rem)}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center{block-size:fit-content;border-radius:.5rem;flex-grow:1;grid-column:2;inline-size:stretch;min-block-size:stretch;overflow:hidden;padding:0;place-content:center;justify-content:start;place-items:center}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center>*{block-size:stretch;inline-size:stretch}:host(ui-file-manager) .fm-toolbar .fm-toolbar-center input{border:0 #0000;inline-size:stretch;outline:0 none #0000;padding-inline:.75rem}:host(ui-file-manager) .fm-toolbar .fm-toolbar-right{grid-column:3}:host(ui-file-manager) .fm-sidebar{align-content:start;border-radius:.5rem;display:none;gap:.5rem;grid-column:sidebar-col;grid-row:2;justify-content:start;justify-items:start;line-height:normal;padding:.5rem;text-align:start}:host(ui-file-manager) .fm-sidebar .sec{display:grid;gap:.25rem;place-content:start;justify-content:start;place-items:start;justify-items:start}:host(ui-file-manager) .fm-sidebar .sec-title{font-weight:600;opacity:.8;padding-block:.25rem;place-self:start}:host(ui-file-manager) .fm-sidebar .link{appearance:none;border:0;border-radius:.375rem;cursor:pointer;line-height:normal;padding:.25rem .375rem;text-align:start}:host(ui-file-manager) .fm-content{block-size:stretch;border-radius:.5rem;grid-column:content-col;grid-row:2;inline-size:stretch;overflow:auto;padding:.25rem;scrollbar-color:#0000 #0000;scrollbar-gutter:auto;scrollbar-width:none}:host(ui-file-manager) .status{opacity:.8;padding:.5rem}:host(ui-file-manager) .status.error{color:var(--error-color,crimson)}@container (inline-size < 520px){:host(ui-file-manager) .fm-content{grid-column:1/-1}:host(ui-file-manager) .fm-root{grid-column:1/-1}:host(ui-file-manager) .fm-grid{grid-column:1/-1}:host(ui-file-manager) .fm-root[data-with-sidebar=true]{grid-template-columns:[content-col] minmax(0,1fr)}:host(ui-file-manager) .fm-sidebar{display:none!important}}}";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
const styled = preloadStyle(fmCss);
let FileManager = class extends UIElement {
  gridRowsEl;
  gridEl;
  sidebar = "auto";
  inlineSize;
  // refs/state
  styles = () => styled;
  constructor() {
    super();
  }
  //
  get content() {
    return this?.querySelector?.("ui-file-manager-content");
  }
  get operative() {
    return this.content?.operativeInstance;
  }
  get pathRef() {
    return this.operative?.pathRef;
  }
  get path() {
    return this.content?.path || this.operative?.path || "/user/";
  }
  set path(value) {
    if (this.content) this.content.path = value || "/user/";
    if (this.operative) this.operative.path = value || "/user/";
  }
  //
  get input() {
    return this?.shadowRoot?.querySelector?.('input[name="address"]');
  }
  get inputValue() {
    return this.input?.value || "/user/";
  }
  set inputValue(value) {
    if (this.input) this.input.value = value || "/user/";
  }
  //
  onInitialize() {
    const result = super.onInitialize();
    const self = result ?? this;
    const contents = document.createElement("ui-file-manager-content");
    self.append(contents);
    return self;
  }
  //
  onRender() {
    super.onRender();
    const weak = new WeakRef(this);
    const onEnter = (ev) => {
      if (ev.key === "Enter") {
        const self = weak.deref();
        const input = self?.querySelector?.('input[name="address"]');
        const val = input?.value?.trim?.() || "";
        if (val) self?.navigate(val);
      }
    };
    addEvent(this, "keydown", onEnter);
  }
  //
  get showSidebar() {
    const force = String(this.sidebar ?? "auto").toLowerCase();
    if (force === "true" || force === "1") return true;
    if (force === "false" || force === "0") return false;
    const width = propRef(this, "inlineSize")?.value ?? this.inlineSize ?? 0;
    return width >= 720;
  }
  //
  async navigate(toPath) {
    const clean = getDir(toPath);
    this.path = clean || this.path || "/user/";
    this.operative?.refreshList(this.path || "/user/");
    const input = this?.shadowRoot?.querySelector?.('input[name="address"]');
    if (input && input instanceof HTMLInputElement && input.value != this.path) {
      input.value = this.path || "/user/";
    }
  }
  //
  async goUp() {
    const parts = (this.path || this.content?.path || "/user/").replace(/\/+$/g, "").split("/").filter(Boolean);
    console.log("parts", parts, this.path, this.content?.path);
    if (parts.length <= 1) return;
    const up = "/" + parts.slice(0, -1).join("/") + "/";
    const clean = getDir(up);
    this.navigate(this.path = clean || "/user/");
  }
  //
  requestUpload() {
    this.operative?.requestUpload?.();
  }
  requestPaste() {
    this.operative?.requestPaste?.();
  }
  requestUse() {
    this.operative?.requestUse?.();
  }
  //
  render = function() {
    const self = this;
    const sidebarVisible = self.showSidebar;
    const content = H`<div part="content" class="fm-content"><slot></slot></div>`;
    const toolbar = H`<div part="toolbar" class="fm-toolbar">
            <div class="fm-toolbar-left">
                <button class="btn" title="Up" on:click=${() => requestAnimationFrame(() => self.goUp())}><ui-icon icon="arrow-up"/></button>
                <button class="btn" title="Refresh" on:click=${() => requestAnimationFrame(() => self.navigate(self.inputValue || self.path || "/user/"))}><ui-icon icon="arrow-clockwise"/></button>
            </div>
            <div class="fm-toolbar-center"><form style="display: contents;" onsubmit="return false;">
                <input class="address c2-surface" autocomplete="off" type="text" name="address" value=${self.path || "/user/"} />
            </form></div>
            <div class="fm-toolbar-right">
                <button class="btn" title="Add" on:click=${() => requestAnimationFrame(() => self.requestUpload?.())}><ui-icon icon="upload"/></button>
                <button class="btn" title="Paste" on:click=${() => requestAnimationFrame(() => self.requestPaste?.())}><ui-icon icon="clipboard"/></button>
                <button class="btn" title="Use" on:click=${() => requestAnimationFrame(() => self.requestUse?.())}><ui-icon icon="hand-withdraw"/></button>
            </div>
        </div>`;
    requestAnimationFrame(() => {
      affected(this.pathRef, (path) => {
        const input = this?.shadowRoot?.querySelector?.('input[name="address"]');
        if (input && input instanceof HTMLInputElement && input.value != path) {
          input.value = path || "/user/";
        }
      });
    });
    return H`<div part="root" class="fm-root" data-with-sidebar=${sidebarVisible}>${toolbar}${content}</div>`;
  };
};
__decorateClass([
  property({ source: "query-shadow", name: ".fm-grid-rows" })
], FileManager.prototype, "gridRowsEl", 2);
__decorateClass([
  property({ source: "query-shadow", name: ".fm-grid" })
], FileManager.prototype, "gridEl", 2);
__decorateClass([
  property({ source: "attr", name: "sidebar" })
], FileManager.prototype, "sidebar", 2);
__decorateClass([
  property({ source: "inline-size" })
], FileManager.prototype, "inlineSize", 2);
FileManager = __decorateClass([
  defineElement("ui-file-manager")
], FileManager);

console.log(UIPhosphorIcon);
(async () => {
  await preloadStyle(styles$b);
  await loadInlineStyle(styles$b);
  await loader();
})();

export { FileManager, FileManagerContent };
//# sourceMappingURL=index8.js.map
