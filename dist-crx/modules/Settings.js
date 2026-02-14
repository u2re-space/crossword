import { UUIDv4, createOrUseExistingChannel, isArrayOrIterable, camelToKebab as camelToKebab$1, hasValue, tryStringAsNumber, normalizePrimitive, $avoidTrigger, kebabToCamel, isVal, isValueUnit, isPrimitive, makeTriggerLess, isNotEqual, bindCtx, tryParseByHint, potentiallyAsync, potentiallyAsyncMap, isArrayInvalidKey, $triggerLock as $triggerLock$1, defaultByType, callByProp, callByAllProp, isKeyType, $getValue, toRef, deref as deref$1, handleListeners, $set as $set$1, isObservable as isObservable$1, canBeInteger, unref, getValue, isValueRef, isObject } from './Env.js';

const scriptRel = /* @__PURE__ */ (function detectScriptRel() {
	const relList = typeof document !== "undefined" && document.createElement("link").relList;
	return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
})();const assetsURL = function(dep, importerUrl) { return new URL(dep, importerUrl).href };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (true               && deps && deps.length > 0) {
		const links = document.getElementsByTagName("link");
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises$2) {
			return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
				status: "fulfilled",
				value: value$1
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		promise = allSettled(deps.map((dep) => {
			dep = assetsURL(dep, importerUrl);
			if (dep in seen) return;
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			const cssSelector = isCss ? "[rel=\"stylesheet\"]" : "";
			if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
				const link$1 = links[i$1];
				if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
			}
			else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
			const link = document.createElement("link");
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) link.as = "script";
			link.crossOrigin = "";
			link.href = dep;
			if (cspNonce) link.setAttribute("nonce", cspNonce);
			document.head.appendChild(link);
			if (isCss) return new Promise((res, rej) => {
				link.addEventListener("load", res);
				link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
			});
		}));
	}
	function handlePreloadError(err$2) {
		const e$1 = new Event("vite:preloadError", { cancelable: true });
		e$1.payload = err$2;
		window.dispatchEvent(e$1);
		if (!e$1.defaultPrevented) throw err$2;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};

class QueuedWorkerChannel {
  constructor(config, onChannelReady) {
    this.config = config;
    this.onChannelReady = onChannelReady;
    this.context = config.context ?? "unknown";
  }
  underlyingChannel = null;
  isConnected = false;
  requestQueue = [];
  connectionPromise = null;
  connectionResolver = null;
  context;
  /**
   * Initialize the underlying channel
   */
  async connect(underlyingChannel = null) {
    this.underlyingChannel = underlyingChannel;
  }
  /**
   * Queue a request if channel isn't ready, otherwise send immediately
   */
  async request(method, args = []) {
    if (this.isConnected && this.underlyingChannel) {
      return this.underlyingChannel.request(method, args);
    }
    return new Promise((resolve, reject) => {
      const queuedRequest = {
        id: UUIDv4(),
        method,
        args,
        resolve,
        reject,
        timestamp: Date.now()
      };
      this.requestQueue.push(queuedRequest);
      if (!this.connectionPromise) {
        this.connect().catch((error) => {
          this.rejectAllQueued(error);
        });
      }
    });
  }
  /**
   * Process all queued requests
   */
  async flushQueue() {
    if (!this.underlyingChannel) return;
    const queueCopy = [...this.requestQueue];
    this.requestQueue = [];
    for (const queuedRequest of queueCopy) {
      try {
        const result = await this.underlyingChannel.request(queuedRequest.method, queuedRequest.args);
        queuedRequest.resolve(result);
      } catch (error) {
        queuedRequest.reject(error);
      }
    }
  }
  /**
   * Reject all queued requests with an error
   */
  rejectAllQueued(error) {
    const queueCopy = [...this.requestQueue];
    this.requestQueue = [];
    for (const queuedRequest of queueCopy) {
      queuedRequest.reject(error);
    }
  }
  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      isConnected: this.isConnected,
      queuedRequests: this.requestQueue.length,
      isConnecting: !!this.connectionPromise && !this.isConnected
    };
  }
  close() {
    this.rejectAllQueued(new Error("Channel closed"));
    this.underlyingChannel?.close();
    this.underlyingChannel = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }
}
class OptimizedWorkerChannel {
  channel = null;
  isChannelReady = false;
  pendingRequests = /* @__PURE__ */ new Map();
  messageQueue = [];
  queuedRequests = [];
  batchTimer;
  options;
  onChannelReady;
  constructor(channel = null, options = {}, onChannelReady) {
    this.channel = channel;
    this.isChannelReady = !!channel;
    this.onChannelReady = onChannelReady;
    this.options = {
      timeout: 3e4,
      retries: 3,
      compression: false,
      batching: true,
      ...options
    };
  }
  /**
   * Set the underlying channel when it becomes available
   */
  setChannel(channel) {
    this.channel = channel;
    this.isChannelReady = true;
    this.onChannelReady?.(channel);
    this.flushQueuedRequests();
  }
  /**
   * Send a request and wait for response
   */
  async request(type, payload, options) {
    if (!this.isChannelReady || !this.channel) {
      return new Promise((resolve, reject) => {
        const queuedRequest = {
          id: UUIDv4(),
          method: type,
          args: [payload],
          resolve,
          reject,
          timestamp: Date.now()
        };
        this.queuedRequests.push(queuedRequest);
      });
    }
    const opts = { ...this.options, ...options };
    const messageId = UUIDv4();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout: ${type}`));
      }, opts.timeout);
      this.pendingRequests.set(messageId, { resolve, reject, timeout });
      const envelope = {
        id: messageId,
        type,
        payload,
        timestamp: Date.now()
      };
      if (opts.batching) {
        this.queueMessage(envelope);
      } else {
        this.sendMessage(envelope);
      }
    });
  }
  /**
   * Process queued requests when channel becomes available
   */
  async flushQueuedRequests() {
    if (!this.channel || this.queuedRequests.length === 0) return;
    const queueCopy = [...this.queuedRequests];
    this.queuedRequests = [];
    for (const queuedRequest of queueCopy) {
      try {
        const result = await this.request(queuedRequest.method, ...queuedRequest?.args ?? []);
        queuedRequest.resolve(result);
      } catch (error) {
        queuedRequest.reject(error);
      }
    }
  }
  /**
   * Send a one-way message (fire and forget)
   */
  notify(type, payload) {
    const envelope = {
      id: UUIDv4(),
      type,
      payload,
      timestamp: Date.now()
    };
    if (this.options.batching) {
      this.queueMessage(envelope);
    } else {
      this.sendMessage(envelope);
    }
  }
  /**
   * Stream data with backpressure handling
   */
  async *stream(type, data) {
    for (const chunk of data) {
      const result = await this.request(`${type}:chunk`, chunk);
      yield result;
    }
  }
  /**
   * Queue message for batching
   */
  queueMessage(envelope) {
    this.messageQueue.push(envelope);
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, 16);
    }
  }
  /**
   * Send batched messages
   */
  flushBatch() {
    if (this.messageQueue.length === 0) return;
    const batchEnvelope = {
      id: UUIDv4(),
      type: "batch",
      payload: this.messageQueue,
      timestamp: Date.now()
    };
    this.sendMessage(batchEnvelope);
    this.messageQueue = [];
    this.batchTimer = void 0;
  }
  /**
   * Send single message through channel
   */
  async sendMessage(envelope) {
    try {
      const result = await this.channel?.request?.("processMessage", [envelope]);
      if (envelope.replyTo && this.pendingRequests.has(envelope.replyTo)) {
        const { resolve, timeout } = this.pendingRequests.get(envelope.replyTo);
        clearTimeout(timeout);
        this.pendingRequests.delete(envelope.replyTo);
        resolve(result);
      }
    } catch (error) {
      if (this.pendingRequests.has(envelope.id)) {
        const { reject, timeout } = this.pendingRequests.get(envelope.id);
        clearTimeout(timeout);
        this.pendingRequests.delete(envelope.id);
        reject(error);
      }
    }
  }
  /**
   * Close the channel
   */
  close() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    for (const [id, { reject, timeout }] of this.pendingRequests) {
      clearTimeout(timeout);
      reject(new Error("Channel closed"));
    }
    this.pendingRequests.clear();
    this.channel?.close?.();
  }
}

const runtimeListenerRegistry = /* @__PURE__ */ new Map();
let runtimeListenerInstalled = false;
const ensureRuntimeListener = () => {
  if (runtimeListenerInstalled) return;
  runtimeListenerInstalled = true;
  chrome?.runtime?.onMessage?.addListener?.((message, sender, sendResponse) => {
    const channelName = message?.channelName ?? message?.target;
    if (!channelName) return;
    const listeners = runtimeListenerRegistry.get(channelName);
    if (!listeners || listeners.size === 0) return;
    const event = {
      data: message,
      origin: sender?.url || "chrome-extension",
      source: sender
    };
    for (const listener of listeners) {
      try {
        const out = listener(event, sender, sendResponse);
        if (out && typeof out?.catch === "function") {
          out.catch((error) => console.error("[ChromeExtensionBroadcastChannel] Listener error:", error));
        }
      } catch (error) {
        console.error("[ChromeExtensionBroadcastChannel] Listener error:", error);
      }
    }
    return true;
  });
};
class ChromeExtensionBroadcastChannel {
  constructor(channelName) {
    this.channelName = channelName;
    ensureRuntimeListener();
  }
  listeners = /* @__PURE__ */ new Set();
  addEventListener(type, listener) {
    if (type !== "message") return;
    this.listeners.add(listener);
    let set = runtimeListenerRegistry.get(this.channelName);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      runtimeListenerRegistry.set(this.channelName, set);
    }
    set.add(listener);
  }
  removeEventListener(type, listener) {
    if (type !== "message") return;
    this.listeners.delete(listener);
    runtimeListenerRegistry.get(this.channelName)?.delete(listener);
  }
  postMessage(message) {
    const messageWithChannel = {
      ...message,
      channelName: this.channelName,
      source: "broadcast-channel"
    };
    chrome?.runtime?.sendMessage?.(messageWithChannel, () => void 0);
  }
  close() {
    for (const listener of this.listeners) {
      runtimeListenerRegistry.get(this.channelName)?.delete(listener);
    }
    this.listeners.clear();
  }
}

const createChromeExtensionBroadcast = (channelName) => {
  const worker = new ChromeExtensionBroadcastChannel(channelName);
  return worker;
};
const createServiceWorkerChannel = async (config) => {
  return {
    async request(method, args = []) {
      return new Promise((resolve, reject) => {
        const channel = new BroadcastChannel(`${config.name}-sw-channel`);
        const messageId = UUIDv4();
        const timeout = setTimeout(() => {
          channel.close();
          reject(new Error(`Service worker request timeout: ${method}`));
        }, 1e4);
        channel.onmessage = (event) => {
          const { id, result, error } = event.data;
          if (id === messageId) {
            clearTimeout(timeout);
            channel.close();
            if (error) {
              reject(new Error(error));
            } else {
              resolve(result);
            }
          }
        };
        channel.postMessage({
          id: messageId,
          type: "request",
          method,
          args
        });
      });
    },
    close() {
    }
  };
};
const createWorkerChannel = async (config) => {
  const context = config.context;
  if (context === "service-worker") {
    return createServiceWorkerChannel(config);
  }
  let worker;
  if (typeof config.script === "function") {
    worker = config.script();
  } else if (config.script instanceof Worker) {
    worker = config.script;
  } else {
    if (context === "chrome-extension") {
      try {
        worker = new Worker(chrome.runtime.getURL(config.script), config.options);
      } catch (error) {
        worker = new Worker(new URL(config.script, import.meta.url), config.options);
      }
    } else {
      worker = new Worker(new URL(config.script, import.meta.url), config.options);
    }
  }
  const channel = await createOrUseExistingChannel(config.name, {}, worker);
  return channel;
};
const createQueuedOptimizedWorkerChannel = (config, options, onChannelReady) => {
  const optimizedChannel = new OptimizedWorkerChannel(null, options, onChannelReady);
  createWorkerChannel(config).then((baseChannel) => {
    optimizedChannel.setChannel(baseChannel);
  }).catch((error) => {
    console.error("[createQueuedOptimizedWorkerChannel] Failed to create base channel:", error);
    optimizedChannel.close();
  });
  return optimizedChannel;
};

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
    while (true) {
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
const ROOT$1 = typeof document != "undefined" ? document?.documentElement : null;
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
const onBorderObserve = /* @__PURE__ */ new WeakMap();
const onContentObserve = /* @__PURE__ */ new WeakMap();
const doContentObserve = (element, cb = () => {
}) => {
  if (!(element instanceof HTMLElement)) return;
  if (!onContentObserve.has(element)) {
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
    onContentObserve.set(element, observer);
    observer.observe(element?.element ?? element, { box: "content-box" });
  }
};
const doBorderObserve = (element, cb = () => {
}) => {
  if (!(element instanceof HTMLElement)) return;
  if (!onBorderObserve.has(element)) {
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
    onBorderObserve.set(element, observer);
    observer.observe(element?.element ?? element, { box: "border-box" });
  }
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
const hasParent = (current, parent) => {
  while (current) {
    if (!(current?.element ?? current)) {
      return false;
    }
    if ((current?.element ?? current) === (parent?.element ?? parent)) return true;
    current = current.parentElement ?? (current.parentNode == current?.getRootNode?.({ composed: true }) ? current?.getRootNode?.({ composed: true })?.host : current?.parentNode);
  }
};
const passiveOpts = {};
function addEvent(target, type, cb, opts = passiveOpts) {
  target?.addEventListener?.(type, cb, opts);
  const wr = typeof target == "object" || typeof target == "function" && !target?.deref ? new WeakRef(target) : target;
  return () => wr?.deref?.()?.removeEventListener?.(type, cb, opts);
}
function removeEvent(target, type, cb, opts = passiveOpts) {
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
const isInFocus = (element, selectorOrElement, dir = "parent") => {
  if (!element) return false;
  if (element.checkVisibility && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
  if (!element.checkVisibility && element.offsetParent === null && element.style.position !== "fixed") return false;
  let active = document.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  const isFocused = active === element || hasParent(active, element);
  element.matches(":hover");
  {
    {
      if (dir === "parent") {
        return !!MOCElement(element, selectorOrElement);
      } else {
        const target = isFocused ? active : element.querySelector(":hover") || element;
        const altCnd = !!MOCElement(target, selectorOrElement);
        return element?.querySelector?.(selectorOrElement) != null || element?.matches?.(selectorOrElement) || altCnd;
      }
    }
  }
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
const fixedClientZoom = (element = document.documentElement) => {
  return (element?.currentCSSZoom != null ? 1 : zoomOf(element)) || 1;
};
const orientOf = (element = document.documentElement) => {
  const container = (element?.matches?.('[orient], [data-mixin="ui-orientbox"]') ? element : null) || element?.closest?.('[orient], [data-mixin="ui-orientbox"]') || element;
  if (container?.hasAttribute?.("orient")) {
    return parseInt(container?.getAttribute?.("orient") || "0") || 0;
  }
  return container?.orient || 0;
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
  return {
    "--screen-width": "0px",
    "--screen-height": "0px",
    "--avail-width": "0px",
    "--avail-height": "0px",
    "--view-height": "0px",
    "--pixel-ratio": 1
  };
};
getAvailSize();
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
const getCorrectOrientation = () => {
  let orientationType = screen.orientation.type;
  if (!window.matchMedia("((display-mode: fullscreen) or (display-mode: standalone) or (display-mode: window-controls-overlay))").matches) {
    if (matchMedia("(orientation: portrait)").matches) {
      orientationType = orientationType.replace("landscape", "portrait");
    } else if (matchMedia("(orientation: landscape)").matches) {
      orientationType = orientationType.replace("portrait", "landscape");
    }
  }
  return orientationType;
};

const canvas = new OffscreenCanvas(1, 1);
canvas.getContext("2d");

const unwrapFromQuery = (element) => {
  if (typeof element?.current == "object") {
    element = element?.element ?? element?.current ?? (typeof element?.self == "object" ? element?.self : null) ?? element;
  }
  return element;
};
const observeAttribute = (element, attribute, cb) => {
  if (typeof element?.selector == "string") {
    return observeAttributeBySelector(element, element?.selector, attribute, cb);
  }
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
  return observer;
};

const blobImageMap = /* @__PURE__ */ new WeakMap();
const sheduler = makeRAFCycle();
const getImgWidth = (img) => {
  return img?.naturalWidth || img?.width || 1;
};
const getImgHeight = (img) => {
  return img?.naturalHeight || img?.height || 1;
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
      if (name == "data-orient") {
        this.#render(this.#ready);
      }
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
        if (this.width != this.#size[0]) {
          this.width = this.#size[0];
        }
        if (this.height != this.#size[1]) {
          this.height = this.#size[1];
        }
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
try {
  customElements.define("ui-canvas", UICanvas, { extends: "canvas" });
} catch (e) {
}

const OWNER = "DOM", styleElement = typeof document != "undefined" ? document.createElement("style") : null;
if (styleElement) {
  typeof document != "undefined" ? document.querySelector("head")?.appendChild?.(styleElement) : null;
  styleElement.dataset.owner = OWNER;
}
const setStyleURL = (base, url, layer = "") => {
  base[0][base[1]] = base[1] == "innerHTML" ? `@import url("${url}") ${layer && typeof layer == "string" ? `layer(${layer})` : ""};` : url;
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
const loadStyleSheet = (inline, base, layer = "", integrity) => {
  const load = fetchAndCache(inline);
  const url = typeof inline == "string" ? URL.canParse(inline) ? inline : load : load;
  if (base?.[0]) base[0].fetchPriority = "high";
  if (base && url && typeof url == "string") {
    setStyleURL(base, url, layer);
  }
  if (base?.[0] && (!URL.canParse(inline) || integrity) && base?.[0] instanceof HTMLLinkElement) ;
  return promiseOrDirect(load, (res) => {
    if (base?.[0] && res) {
      setStyleURL(base, res, layer);
      base?.[0].setAttribute("loaded", "");
    }
  })?.catch?.((error) => {
    console.warn("Failed to load style sheet:", error);
  });
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
const preloadStyle = (styles) => {
  return loadAsAdopted(styles, "ux-layer");
};
const adoptedMap = /* @__PURE__ */ new Map();
const adoptedBlobMap = /* @__PURE__ */ new WeakMap();
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
const getPadding = (src, axis) => {
  if (axis == "inline") {
    return getPropertyValue(src, "padding-inline-start") + getPropertyValue(src, "padding-inline-end");
  }
  return getPropertyValue(src, "padding-block-start") + getPropertyValue(src, "padding-block-end");
};

const boundBehaviors = /* @__PURE__ */ new WeakMap();
const bindBehavior = (element, behSet, behavior) => {
  new WeakRef(element);
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
  if (!(prop = typeof prop == "string" ? kebabToCamel(prop) : prop) || !el || ["style", "dataset", "attributeStyleMap", "styleMap", "computedStyleMap"].indexOf(prop || "") != -1) return el;
  const $ref = val;
  if (hasValue(val)) {
    val = val.value;
  }
  if (el?.[prop] === val) {
    return el;
  }
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
  prop = kebabToCamel(prop);
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

var define_process_env_default = {};
/*! For license information please see index.js.LICENSE.txt */
var t = { 2: (t2) => {
  function e2(t3, e3, o2) {
    t3 instanceof RegExp && (t3 = n2(t3, o2)), e3 instanceof RegExp && (e3 = n2(e3, o2));
    var i2 = r2(t3, e3, o2);
    return i2 && { start: i2[0], end: i2[1], pre: o2.slice(0, i2[0]), body: o2.slice(i2[0] + t3.length, i2[1]), post: o2.slice(i2[1] + e3.length) };
  }
  function n2(t3, e3) {
    var n3 = e3.match(t3);
    return n3 ? n3[0] : null;
  }
  function r2(t3, e3, n3) {
    var r3, o2, i2, s2, a2, u2 = n3.indexOf(t3), c2 = n3.indexOf(e3, u2 + 1), l2 = u2;
    if (u2 >= 0 && c2 > 0) {
      for (r3 = [], i2 = n3.length; l2 >= 0 && !a2; ) l2 == u2 ? (r3.push(l2), u2 = n3.indexOf(t3, l2 + 1)) : 1 == r3.length ? a2 = [r3.pop(), c2] : ((o2 = r3.pop()) < i2 && (i2 = o2, s2 = c2), c2 = n3.indexOf(e3, l2 + 1)), l2 = u2 < c2 && u2 >= 0 ? u2 : c2;
      r3.length && (a2 = [i2, s2]);
    }
    return a2;
  }
  t2.exports = e2, e2.range = r2;
}, 101: function(t2, e2, n2) {
  var r2;
  t2 = n2.nmd(t2), (function(o2) {
    var i2 = (t2 && t2.exports, "object" == typeof global && global);
    i2.global !== i2 && i2.window;
    var s2 = function(t3) {
      this.message = t3;
    };
    (s2.prototype = new Error()).name = "InvalidCharacterError";
    var a2 = function(t3) {
      throw new s2(t3);
    }, u2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", c2 = /[\t\n\f\r ]/g, l2 = { encode: function(t3) {
      t3 = String(t3), /[^\0-\xFF]/.test(t3) && a2("The string to be encoded contains characters outside of the Latin1 range.");
      for (var e3, n3, r3, o3, i3 = t3.length % 3, s3 = "", c3 = -1, l3 = t3.length - i3; ++c3 < l3; ) e3 = t3.charCodeAt(c3) << 16, n3 = t3.charCodeAt(++c3) << 8, r3 = t3.charCodeAt(++c3), s3 += u2.charAt((o3 = e3 + n3 + r3) >> 18 & 63) + u2.charAt(o3 >> 12 & 63) + u2.charAt(o3 >> 6 & 63) + u2.charAt(63 & o3);
      return 2 == i3 ? (e3 = t3.charCodeAt(c3) << 8, n3 = t3.charCodeAt(++c3), s3 += u2.charAt((o3 = e3 + n3) >> 10) + u2.charAt(o3 >> 4 & 63) + u2.charAt(o3 << 2 & 63) + "=") : 1 == i3 && (o3 = t3.charCodeAt(c3), s3 += u2.charAt(o3 >> 2) + u2.charAt(o3 << 4 & 63) + "=="), s3;
    }, decode: function(t3) {
      var e3 = (t3 = String(t3).replace(c2, "")).length;
      e3 % 4 == 0 && (e3 = (t3 = t3.replace(/==?$/, "")).length), (e3 % 4 == 1 || /[^+a-zA-Z0-9/]/.test(t3)) && a2("Invalid character: the string to be decoded is not correctly encoded.");
      for (var n3, r3, o3 = 0, i3 = "", s3 = -1; ++s3 < e3; ) r3 = u2.indexOf(t3.charAt(s3)), n3 = o3 % 4 ? 64 * n3 + r3 : r3, o3++ % 4 && (i3 += String.fromCharCode(255 & n3 >> (-2 * o3 & 6)));
      return i3;
    }, version: "1.0.0" };
    void 0 === (r2 = function() {
      return l2;
    }.call(e2, n2, e2, t2)) || (t2.exports = r2);
  })();
}, 172: (t2, e2) => {
  e2.d = function(t3) {
    if (!t3) return 0;
    for (var e3 = (t3 = t3.toString()).length, n2 = t3.length; n2--; ) {
      var r2 = t3.charCodeAt(n2);
      56320 <= r2 && r2 <= 57343 && n2--, 127 < r2 && r2 <= 2047 ? e3++ : 2047 < r2 && r2 <= 65535 && (e3 += 2);
    }
    return e3;
  };
}, 526: (t2) => {
  var e2 = { utf8: { stringToBytes: function(t3) {
    return e2.bin.stringToBytes(unescape(encodeURIComponent(t3)));
  }, bytesToString: function(t3) {
    return decodeURIComponent(escape(e2.bin.bytesToString(t3)));
  } }, bin: { stringToBytes: function(t3) {
    for (var e3 = [], n2 = 0; n2 < t3.length; n2++) e3.push(255 & t3.charCodeAt(n2));
    return e3;
  }, bytesToString: function(t3) {
    for (var e3 = [], n2 = 0; n2 < t3.length; n2++) e3.push(String.fromCharCode(t3[n2]));
    return e3.join("");
  } } };
  t2.exports = e2;
}, 298: (t2) => {
  var e2, n2;
  e2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", n2 = { rotl: function(t3, e3) {
    return t3 << e3 | t3 >>> 32 - e3;
  }, rotr: function(t3, e3) {
    return t3 << 32 - e3 | t3 >>> e3;
  }, endian: function(t3) {
    if (t3.constructor == Number) return 16711935 & n2.rotl(t3, 8) | 4278255360 & n2.rotl(t3, 24);
    for (var e3 = 0; e3 < t3.length; e3++) t3[e3] = n2.endian(t3[e3]);
    return t3;
  }, randomBytes: function(t3) {
    for (var e3 = []; t3 > 0; t3--) e3.push(Math.floor(256 * Math.random()));
    return e3;
  }, bytesToWords: function(t3) {
    for (var e3 = [], n3 = 0, r2 = 0; n3 < t3.length; n3++, r2 += 8) e3[r2 >>> 5] |= t3[n3] << 24 - r2 % 32;
    return e3;
  }, wordsToBytes: function(t3) {
    for (var e3 = [], n3 = 0; n3 < 32 * t3.length; n3 += 8) e3.push(t3[n3 >>> 5] >>> 24 - n3 % 32 & 255);
    return e3;
  }, bytesToHex: function(t3) {
    for (var e3 = [], n3 = 0; n3 < t3.length; n3++) e3.push((t3[n3] >>> 4).toString(16)), e3.push((15 & t3[n3]).toString(16));
    return e3.join("");
  }, hexToBytes: function(t3) {
    for (var e3 = [], n3 = 0; n3 < t3.length; n3 += 2) e3.push(parseInt(t3.substr(n3, 2), 16));
    return e3;
  }, bytesToBase64: function(t3) {
    for (var n3 = [], r2 = 0; r2 < t3.length; r2 += 3) for (var o2 = t3[r2] << 16 | t3[r2 + 1] << 8 | t3[r2 + 2], i2 = 0; i2 < 4; i2++) 8 * r2 + 6 * i2 <= 8 * t3.length ? n3.push(e2.charAt(o2 >>> 6 * (3 - i2) & 63)) : n3.push("=");
    return n3.join("");
  }, base64ToBytes: function(t3) {
    t3 = t3.replace(/[^A-Z0-9+\/]/gi, "");
    for (var n3 = [], r2 = 0, o2 = 0; r2 < t3.length; o2 = ++r2 % 4) 0 != o2 && n3.push((e2.indexOf(t3.charAt(r2 - 1)) & Math.pow(2, -2 * o2 + 8) - 1) << 2 * o2 | e2.indexOf(t3.charAt(r2)) >>> 6 - 2 * o2);
    return n3;
  } }, t2.exports = n2;
}, 635: (t2, e2, n2) => {
  const r2 = n2(31), o2 = n2(338), i2 = n2(221);
  t2.exports = { XMLParser: o2, XMLValidator: r2, XMLBuilder: i2 };
}, 118: (t2) => {
  t2.exports = function(t3) {
    return "function" == typeof t3 ? t3 : Array.isArray(t3) ? (e2) => {
      for (const n2 of t3) {
        if ("string" == typeof n2 && e2 === n2) return true;
        if (n2 instanceof RegExp && n2.test(e2)) return true;
      }
    } : () => false;
  };
}, 705: (t2, e2) => {
  const n2 = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", r2 = "[" + n2 + "][" + n2 + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*", o2 = new RegExp("^" + r2 + "$");
  e2.isExist = function(t3) {
    return void 0 !== t3;
  }, e2.isEmptyObject = function(t3) {
    return 0 === Object.keys(t3).length;
  }, e2.merge = function(t3, e3, n3) {
    if (e3) {
      const r3 = Object.keys(e3), o3 = r3.length;
      for (let i2 = 0; i2 < o3; i2++) t3[r3[i2]] = "strict" === n3 ? [e3[r3[i2]]] : e3[r3[i2]];
    }
  }, e2.getValue = function(t3) {
    return e2.isExist(t3) ? t3 : "";
  }, e2.isName = function(t3) {
    return !(null == o2.exec(t3));
  }, e2.getAllMatches = function(t3, e3) {
    const n3 = [];
    let r3 = e3.exec(t3);
    for (; r3; ) {
      const o3 = [];
      o3.startIndex = e3.lastIndex - r3[0].length;
      const i2 = r3.length;
      for (let t4 = 0; t4 < i2; t4++) o3.push(r3[t4]);
      n3.push(o3), r3 = e3.exec(t3);
    }
    return n3;
  }, e2.nameRegexp = r2;
}, 31: (t2, e2, n2) => {
  const r2 = n2(705), o2 = { allowBooleanAttributes: false, unpairedTags: [] };
  function i2(t3) {
    return " " === t3 || "	" === t3 || "\n" === t3 || "\r" === t3;
  }
  function s2(t3, e3) {
    const n3 = e3;
    for (; e3 < t3.length; e3++) if ("?" != t3[e3] && " " != t3[e3]) ;
    else {
      const r3 = t3.substr(n3, e3 - n3);
      if (e3 > 5 && "xml" === r3) return d2("InvalidXml", "XML declaration allowed only at the start of the document.", m2(t3, e3));
      if ("?" == t3[e3] && ">" == t3[e3 + 1]) {
        e3++;
        break;
      }
    }
    return e3;
  }
  function a2(t3, e3) {
    if (t3.length > e3 + 5 && "-" === t3[e3 + 1] && "-" === t3[e3 + 2]) {
      for (e3 += 3; e3 < t3.length; e3++) if ("-" === t3[e3] && "-" === t3[e3 + 1] && ">" === t3[e3 + 2]) {
        e3 += 2;
        break;
      }
    } else if (t3.length > e3 + 8 && "D" === t3[e3 + 1] && "O" === t3[e3 + 2] && "C" === t3[e3 + 3] && "T" === t3[e3 + 4] && "Y" === t3[e3 + 5] && "P" === t3[e3 + 6] && "E" === t3[e3 + 7]) {
      let n3 = 1;
      for (e3 += 8; e3 < t3.length; e3++) if ("<" === t3[e3]) n3++;
      else if (">" === t3[e3] && (n3--, 0 === n3)) break;
    } else if (t3.length > e3 + 9 && "[" === t3[e3 + 1] && "C" === t3[e3 + 2] && "D" === t3[e3 + 3] && "A" === t3[e3 + 4] && "T" === t3[e3 + 5] && "A" === t3[e3 + 6] && "[" === t3[e3 + 7]) {
      for (e3 += 8; e3 < t3.length; e3++) if ("]" === t3[e3] && "]" === t3[e3 + 1] && ">" === t3[e3 + 2]) {
        e3 += 2;
        break;
      }
    }
    return e3;
  }
  e2.validate = function(t3, e3) {
    e3 = Object.assign({}, o2, e3);
    const n3 = [];
    let u3 = false, c3 = false;
    "\uFEFF" === t3[0] && (t3 = t3.substr(1));
    for (let o3 = 0; o3 < t3.length; o3++) if ("<" === t3[o3] && "?" === t3[o3 + 1]) {
      if (o3 += 2, o3 = s2(t3, o3), o3.err) return o3;
    } else {
      if ("<" !== t3[o3]) {
        if (i2(t3[o3])) continue;
        return d2("InvalidChar", "char '" + t3[o3] + "' is not expected.", m2(t3, o3));
      }
      {
        let g3 = o3;
        if (o3++, "!" === t3[o3]) {
          o3 = a2(t3, o3);
          continue;
        }
        {
          let y3 = false;
          "/" === t3[o3] && (y3 = true, o3++);
          let v2 = "";
          for (; o3 < t3.length && ">" !== t3[o3] && " " !== t3[o3] && "	" !== t3[o3] && "\n" !== t3[o3] && "\r" !== t3[o3]; o3++) v2 += t3[o3];
          if (v2 = v2.trim(), "/" === v2[v2.length - 1] && (v2 = v2.substring(0, v2.length - 1), o3--), h3 = v2, !r2.isName(h3)) {
            let e4;
            return e4 = 0 === v2.trim().length ? "Invalid space after '<'." : "Tag '" + v2 + "' is an invalid name.", d2("InvalidTag", e4, m2(t3, o3));
          }
          const b2 = l2(t3, o3);
          if (false === b2) return d2("InvalidAttr", "Attributes for '" + v2 + "' have open quote.", m2(t3, o3));
          let w2 = b2.value;
          if (o3 = b2.index, "/" === w2[w2.length - 1]) {
            const n4 = o3 - w2.length;
            w2 = w2.substring(0, w2.length - 1);
            const r3 = p2(w2, e3);
            if (true !== r3) return d2(r3.err.code, r3.err.msg, m2(t3, n4 + r3.err.line));
            u3 = true;
          } else if (y3) {
            if (!b2.tagClosed) return d2("InvalidTag", "Closing tag '" + v2 + "' doesn't have proper closing.", m2(t3, o3));
            if (w2.trim().length > 0) return d2("InvalidTag", "Closing tag '" + v2 + "' can't have attributes or invalid starting.", m2(t3, g3));
            if (0 === n3.length) return d2("InvalidTag", "Closing tag '" + v2 + "' has not been opened.", m2(t3, g3));
            {
              const e4 = n3.pop();
              if (v2 !== e4.tagName) {
                let n4 = m2(t3, e4.tagStartPos);
                return d2("InvalidTag", "Expected closing tag '" + e4.tagName + "' (opened in line " + n4.line + ", col " + n4.col + ") instead of closing tag '" + v2 + "'.", m2(t3, g3));
              }
              0 == n3.length && (c3 = true);
            }
          } else {
            const r3 = p2(w2, e3);
            if (true !== r3) return d2(r3.err.code, r3.err.msg, m2(t3, o3 - w2.length + r3.err.line));
            if (true === c3) return d2("InvalidXml", "Multiple possible root nodes found.", m2(t3, o3));
            -1 !== e3.unpairedTags.indexOf(v2) || n3.push({ tagName: v2, tagStartPos: g3 }), u3 = true;
          }
          for (o3++; o3 < t3.length; o3++) if ("<" === t3[o3]) {
            if ("!" === t3[o3 + 1]) {
              o3++, o3 = a2(t3, o3);
              continue;
            }
            if ("?" !== t3[o3 + 1]) break;
            if (o3 = s2(t3, ++o3), o3.err) return o3;
          } else if ("&" === t3[o3]) {
            const e4 = f2(t3, o3);
            if (-1 == e4) return d2("InvalidChar", "char '&' is not expected.", m2(t3, o3));
            o3 = e4;
          } else if (true === c3 && !i2(t3[o3])) return d2("InvalidXml", "Extra text at the end", m2(t3, o3));
          "<" === t3[o3] && o3--;
        }
      }
    }
    var h3;
    return u3 ? 1 == n3.length ? d2("InvalidTag", "Unclosed tag '" + n3[0].tagName + "'.", m2(t3, n3[0].tagStartPos)) : !(n3.length > 0) || d2("InvalidXml", "Invalid '" + JSON.stringify(n3.map(((t4) => t4.tagName)), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 }) : d2("InvalidXml", "Start tag expected.", 1);
  };
  const u2 = '"', c2 = "'";
  function l2(t3, e3) {
    let n3 = "", r3 = "", o3 = false;
    for (; e3 < t3.length; e3++) {
      if (t3[e3] === u2 || t3[e3] === c2) "" === r3 ? r3 = t3[e3] : r3 !== t3[e3] || (r3 = "");
      else if (">" === t3[e3] && "" === r3) {
        o3 = true;
        break;
      }
      n3 += t3[e3];
    }
    return "" === r3 && { value: n3, index: e3, tagClosed: o3 };
  }
  const h2 = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
  function p2(t3, e3) {
    const n3 = r2.getAllMatches(t3, h2), o3 = {};
    for (let t4 = 0; t4 < n3.length; t4++) {
      if (0 === n3[t4][1].length) return d2("InvalidAttr", "Attribute '" + n3[t4][2] + "' has no space in starting.", y2(n3[t4]));
      if (void 0 !== n3[t4][3] && void 0 === n3[t4][4]) return d2("InvalidAttr", "Attribute '" + n3[t4][2] + "' is without value.", y2(n3[t4]));
      if (void 0 === n3[t4][3] && !e3.allowBooleanAttributes) return d2("InvalidAttr", "boolean attribute '" + n3[t4][2] + "' is not allowed.", y2(n3[t4]));
      const r3 = n3[t4][2];
      if (!g2(r3)) return d2("InvalidAttr", "Attribute '" + r3 + "' is an invalid name.", y2(n3[t4]));
      if (o3.hasOwnProperty(r3)) return d2("InvalidAttr", "Attribute '" + r3 + "' is repeated.", y2(n3[t4]));
      o3[r3] = 1;
    }
    return true;
  }
  function f2(t3, e3) {
    if (";" === t3[++e3]) return -1;
    if ("#" === t3[e3]) return (function(t4, e4) {
      let n4 = /\d/;
      for ("x" === t4[e4] && (e4++, n4 = /[\da-fA-F]/); e4 < t4.length; e4++) {
        if (";" === t4[e4]) return e4;
        if (!t4[e4].match(n4)) break;
      }
      return -1;
    })(t3, ++e3);
    let n3 = 0;
    for (; e3 < t3.length; e3++, n3++) if (!(t3[e3].match(/\w/) && n3 < 20)) {
      if (";" === t3[e3]) break;
      return -1;
    }
    return e3;
  }
  function d2(t3, e3, n3) {
    return { err: { code: t3, msg: e3, line: n3.line || n3, col: n3.col } };
  }
  function g2(t3) {
    return r2.isName(t3);
  }
  function m2(t3, e3) {
    const n3 = t3.substring(0, e3).split(/\r?\n/);
    return { line: n3.length, col: n3[n3.length - 1].length + 1 };
  }
  function y2(t3) {
    return t3.startIndex + t3[1].length;
  }
}, 221: (t2, e2, n2) => {
  const r2 = n2(87), o2 = n2(118), i2 = { attributeNamePrefix: "@_", attributesGroupName: false, textNodeName: "#text", ignoreAttributes: true, cdataPropName: false, format: false, indentBy: "  ", suppressEmptyNode: false, suppressUnpairedNode: true, suppressBooleanAttributes: true, tagValueProcessor: function(t3, e3) {
    return e3;
  }, attributeValueProcessor: function(t3, e3) {
    return e3;
  }, preserveOrder: false, commentPropName: false, unpairedTags: [], entities: [{ regex: new RegExp("&", "g"), val: "&amp;" }, { regex: new RegExp(">", "g"), val: "&gt;" }, { regex: new RegExp("<", "g"), val: "&lt;" }, { regex: new RegExp("'", "g"), val: "&apos;" }, { regex: new RegExp('"', "g"), val: "&quot;" }], processEntities: true, stopNodes: [], oneListGroup: false };
  function s2(t3) {
    this.options = Object.assign({}, i2, t3), true === this.options.ignoreAttributes || this.options.attributesGroupName ? this.isAttribute = function() {
      return false;
    } : (this.ignoreAttributesFn = o2(this.options.ignoreAttributes), this.attrPrefixLen = this.options.attributeNamePrefix.length, this.isAttribute = c2), this.processTextOrObjNode = a2, this.options.format ? (this.indentate = u2, this.tagEndChar = ">\n", this.newLine = "\n") : (this.indentate = function() {
      return "";
    }, this.tagEndChar = ">", this.newLine = "");
  }
  function a2(t3, e3, n3, r3) {
    const o3 = this.j2x(t3, n3 + 1, r3.concat(e3));
    return void 0 !== t3[this.options.textNodeName] && 1 === Object.keys(t3).length ? this.buildTextValNode(t3[this.options.textNodeName], e3, o3.attrStr, n3) : this.buildObjectNode(o3.val, e3, o3.attrStr, n3);
  }
  function u2(t3) {
    return this.options.indentBy.repeat(t3);
  }
  function c2(t3) {
    return !(!t3.startsWith(this.options.attributeNamePrefix) || t3 === this.options.textNodeName) && t3.substr(this.attrPrefixLen);
  }
  s2.prototype.build = function(t3) {
    return this.options.preserveOrder ? r2(t3, this.options) : (Array.isArray(t3) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1 && (t3 = { [this.options.arrayNodeName]: t3 }), this.j2x(t3, 0, []).val);
  }, s2.prototype.j2x = function(t3, e3, n3) {
    let r3 = "", o3 = "";
    const i3 = n3.join(".");
    for (let s3 in t3) if (Object.prototype.hasOwnProperty.call(t3, s3)) if (void 0 === t3[s3]) this.isAttribute(s3) && (o3 += "");
    else if (null === t3[s3]) this.isAttribute(s3) ? o3 += "" : "?" === s3[0] ? o3 += this.indentate(e3) + "<" + s3 + "?" + this.tagEndChar : o3 += this.indentate(e3) + "<" + s3 + "/" + this.tagEndChar;
    else if (t3[s3] instanceof Date) o3 += this.buildTextValNode(t3[s3], s3, "", e3);
    else if ("object" != typeof t3[s3]) {
      const n4 = this.isAttribute(s3);
      if (n4 && !this.ignoreAttributesFn(n4, i3)) r3 += this.buildAttrPairStr(n4, "" + t3[s3]);
      else if (!n4) if (s3 === this.options.textNodeName) {
        let e4 = this.options.tagValueProcessor(s3, "" + t3[s3]);
        o3 += this.replaceEntitiesValue(e4);
      } else o3 += this.buildTextValNode(t3[s3], s3, "", e3);
    } else if (Array.isArray(t3[s3])) {
      const r4 = t3[s3].length;
      let i4 = "", a3 = "";
      for (let u3 = 0; u3 < r4; u3++) {
        const r5 = t3[s3][u3];
        if (void 0 === r5) ;
        else if (null === r5) "?" === s3[0] ? o3 += this.indentate(e3) + "<" + s3 + "?" + this.tagEndChar : o3 += this.indentate(e3) + "<" + s3 + "/" + this.tagEndChar;
        else if ("object" == typeof r5) if (this.options.oneListGroup) {
          const t4 = this.j2x(r5, e3 + 1, n3.concat(s3));
          i4 += t4.val, this.options.attributesGroupName && r5.hasOwnProperty(this.options.attributesGroupName) && (a3 += t4.attrStr);
        } else i4 += this.processTextOrObjNode(r5, s3, e3, n3);
        else if (this.options.oneListGroup) {
          let t4 = this.options.tagValueProcessor(s3, r5);
          t4 = this.replaceEntitiesValue(t4), i4 += t4;
        } else i4 += this.buildTextValNode(r5, s3, "", e3);
      }
      this.options.oneListGroup && (i4 = this.buildObjectNode(i4, s3, a3, e3)), o3 += i4;
    } else if (this.options.attributesGroupName && s3 === this.options.attributesGroupName) {
      const e4 = Object.keys(t3[s3]), n4 = e4.length;
      for (let o4 = 0; o4 < n4; o4++) r3 += this.buildAttrPairStr(e4[o4], "" + t3[s3][e4[o4]]);
    } else o3 += this.processTextOrObjNode(t3[s3], s3, e3, n3);
    return { attrStr: r3, val: o3 };
  }, s2.prototype.buildAttrPairStr = function(t3, e3) {
    return e3 = this.options.attributeValueProcessor(t3, "" + e3), e3 = this.replaceEntitiesValue(e3), this.options.suppressBooleanAttributes && "true" === e3 ? " " + t3 : " " + t3 + '="' + e3 + '"';
  }, s2.prototype.buildObjectNode = function(t3, e3, n3, r3) {
    if ("" === t3) return "?" === e3[0] ? this.indentate(r3) + "<" + e3 + n3 + "?" + this.tagEndChar : this.indentate(r3) + "<" + e3 + n3 + this.closeTag(e3) + this.tagEndChar;
    {
      let o3 = "</" + e3 + this.tagEndChar, i3 = "";
      return "?" === e3[0] && (i3 = "?", o3 = ""), !n3 && "" !== n3 || -1 !== t3.indexOf("<") ? false !== this.options.commentPropName && e3 === this.options.commentPropName && 0 === i3.length ? this.indentate(r3) + `<!--${t3}-->` + this.newLine : this.indentate(r3) + "<" + e3 + n3 + i3 + this.tagEndChar + t3 + this.indentate(r3) + o3 : this.indentate(r3) + "<" + e3 + n3 + i3 + ">" + t3 + o3;
    }
  }, s2.prototype.closeTag = function(t3) {
    let e3 = "";
    return -1 !== this.options.unpairedTags.indexOf(t3) ? this.options.suppressUnpairedNode || (e3 = "/") : e3 = this.options.suppressEmptyNode ? "/" : `></${t3}`, e3;
  }, s2.prototype.buildTextValNode = function(t3, e3, n3, r3) {
    if (false !== this.options.cdataPropName && e3 === this.options.cdataPropName) return this.indentate(r3) + `<![CDATA[${t3}]]>` + this.newLine;
    if (false !== this.options.commentPropName && e3 === this.options.commentPropName) return this.indentate(r3) + `<!--${t3}-->` + this.newLine;
    if ("?" === e3[0]) return this.indentate(r3) + "<" + e3 + n3 + "?" + this.tagEndChar;
    {
      let o3 = this.options.tagValueProcessor(e3, t3);
      return o3 = this.replaceEntitiesValue(o3), "" === o3 ? this.indentate(r3) + "<" + e3 + n3 + this.closeTag(e3) + this.tagEndChar : this.indentate(r3) + "<" + e3 + n3 + ">" + o3 + "</" + e3 + this.tagEndChar;
    }
  }, s2.prototype.replaceEntitiesValue = function(t3) {
    if (t3 && t3.length > 0 && this.options.processEntities) for (let e3 = 0; e3 < this.options.entities.length; e3++) {
      const n3 = this.options.entities[e3];
      t3 = t3.replace(n3.regex, n3.val);
    }
    return t3;
  }, t2.exports = s2;
}, 87: (t2) => {
  function e2(t3, s2, a2, u2) {
    let c2 = "", l2 = false;
    for (let h2 = 0; h2 < t3.length; h2++) {
      const p2 = t3[h2], f2 = n2(p2);
      if (void 0 === f2) continue;
      let d2 = "";
      if (d2 = 0 === a2.length ? f2 : `${a2}.${f2}`, f2 === s2.textNodeName) {
        let t4 = p2[f2];
        o2(d2, s2) || (t4 = s2.tagValueProcessor(f2, t4), t4 = i2(t4, s2)), l2 && (c2 += u2), c2 += t4, l2 = false;
        continue;
      }
      if (f2 === s2.cdataPropName) {
        l2 && (c2 += u2), c2 += `<![CDATA[${p2[f2][0][s2.textNodeName]}]]>`, l2 = false;
        continue;
      }
      if (f2 === s2.commentPropName) {
        c2 += u2 + `<!--${p2[f2][0][s2.textNodeName]}-->`, l2 = true;
        continue;
      }
      if ("?" === f2[0]) {
        const t4 = r2(p2[":@"], s2), e3 = "?xml" === f2 ? "" : u2;
        let n3 = p2[f2][0][s2.textNodeName];
        n3 = 0 !== n3.length ? " " + n3 : "", c2 += e3 + `<${f2}${n3}${t4}?>`, l2 = true;
        continue;
      }
      let g2 = u2;
      "" !== g2 && (g2 += s2.indentBy);
      const m2 = u2 + `<${f2}${r2(p2[":@"], s2)}`, y2 = e2(p2[f2], s2, d2, g2);
      -1 !== s2.unpairedTags.indexOf(f2) ? s2.suppressUnpairedNode ? c2 += m2 + ">" : c2 += m2 + "/>" : y2 && 0 !== y2.length || !s2.suppressEmptyNode ? y2 && y2.endsWith(">") ? c2 += m2 + `>${y2}${u2}</${f2}>` : (c2 += m2 + ">", y2 && "" !== u2 && (y2.includes("/>") || y2.includes("</")) ? c2 += u2 + s2.indentBy + y2 + u2 : c2 += y2, c2 += `</${f2}>`) : c2 += m2 + "/>", l2 = true;
    }
    return c2;
  }
  function n2(t3) {
    const e3 = Object.keys(t3);
    for (let n3 = 0; n3 < e3.length; n3++) {
      const r3 = e3[n3];
      if (t3.hasOwnProperty(r3) && ":@" !== r3) return r3;
    }
  }
  function r2(t3, e3) {
    let n3 = "";
    if (t3 && !e3.ignoreAttributes) for (let r3 in t3) {
      if (!t3.hasOwnProperty(r3)) continue;
      let o3 = e3.attributeValueProcessor(r3, t3[r3]);
      o3 = i2(o3, e3), true === o3 && e3.suppressBooleanAttributes ? n3 += ` ${r3.substr(e3.attributeNamePrefix.length)}` : n3 += ` ${r3.substr(e3.attributeNamePrefix.length)}="${o3}"`;
    }
    return n3;
  }
  function o2(t3, e3) {
    let n3 = (t3 = t3.substr(0, t3.length - e3.textNodeName.length - 1)).substr(t3.lastIndexOf(".") + 1);
    for (let r3 in e3.stopNodes) if (e3.stopNodes[r3] === t3 || e3.stopNodes[r3] === "*." + n3) return true;
    return false;
  }
  function i2(t3, e3) {
    if (t3 && t3.length > 0 && e3.processEntities) for (let n3 = 0; n3 < e3.entities.length; n3++) {
      const r3 = e3.entities[n3];
      t3 = t3.replace(r3.regex, r3.val);
    }
    return t3;
  }
  t2.exports = function(t3, n3) {
    let r3 = "";
    return n3.format && n3.indentBy.length > 0 && (r3 = "\n"), e2(t3, n3, "", r3);
  };
}, 193: (t2, e2, n2) => {
  const r2 = n2(705);
  function o2(t3, e3) {
    let n3 = "";
    for (; e3 < t3.length && "'" !== t3[e3] && '"' !== t3[e3]; e3++) n3 += t3[e3];
    if (n3 = n3.trim(), -1 !== n3.indexOf(" ")) throw new Error("External entites are not supported");
    const r3 = t3[e3++];
    let o3 = "";
    for (; e3 < t3.length && t3[e3] !== r3; e3++) o3 += t3[e3];
    return [n3, o3, e3];
  }
  function i2(t3, e3) {
    return "!" === t3[e3 + 1] && "-" === t3[e3 + 2] && "-" === t3[e3 + 3];
  }
  function s2(t3, e3) {
    return "!" === t3[e3 + 1] && "E" === t3[e3 + 2] && "N" === t3[e3 + 3] && "T" === t3[e3 + 4] && "I" === t3[e3 + 5] && "T" === t3[e3 + 6] && "Y" === t3[e3 + 7];
  }
  function a2(t3, e3) {
    return "!" === t3[e3 + 1] && "E" === t3[e3 + 2] && "L" === t3[e3 + 3] && "E" === t3[e3 + 4] && "M" === t3[e3 + 5] && "E" === t3[e3 + 6] && "N" === t3[e3 + 7] && "T" === t3[e3 + 8];
  }
  function u2(t3, e3) {
    return "!" === t3[e3 + 1] && "A" === t3[e3 + 2] && "T" === t3[e3 + 3] && "T" === t3[e3 + 4] && "L" === t3[e3 + 5] && "I" === t3[e3 + 6] && "S" === t3[e3 + 7] && "T" === t3[e3 + 8];
  }
  function c2(t3, e3) {
    return "!" === t3[e3 + 1] && "N" === t3[e3 + 2] && "O" === t3[e3 + 3] && "T" === t3[e3 + 4] && "A" === t3[e3 + 5] && "T" === t3[e3 + 6] && "I" === t3[e3 + 7] && "O" === t3[e3 + 8] && "N" === t3[e3 + 9];
  }
  function l2(t3) {
    if (r2.isName(t3)) return t3;
    throw new Error(`Invalid entity name ${t3}`);
  }
  t2.exports = function(t3, e3) {
    const n3 = {};
    if ("O" !== t3[e3 + 3] || "C" !== t3[e3 + 4] || "T" !== t3[e3 + 5] || "Y" !== t3[e3 + 6] || "P" !== t3[e3 + 7] || "E" !== t3[e3 + 8]) throw new Error("Invalid Tag instead of DOCTYPE");
    {
      e3 += 9;
      let r3 = 1, h2 = false, p2 = false, f2 = "";
      for (; e3 < t3.length; e3++) if ("<" !== t3[e3] || p2) if (">" === t3[e3]) {
        if (p2 ? "-" === t3[e3 - 1] && "-" === t3[e3 - 2] && (p2 = false, r3--) : r3--, 0 === r3) break;
      } else "[" === t3[e3] ? h2 = true : f2 += t3[e3];
      else {
        if (h2 && s2(t3, e3)) {
          let r4, i3;
          e3 += 7, [r4, i3, e3] = o2(t3, e3 + 1), -1 === i3.indexOf("&") && (n3[l2(r4)] = { regx: RegExp(`&${r4};`, "g"), val: i3 });
        } else if (h2 && a2(t3, e3)) e3 += 8;
        else if (h2 && u2(t3, e3)) e3 += 8;
        else if (h2 && c2(t3, e3)) e3 += 9;
        else {
          if (!i2) throw new Error("Invalid DOCTYPE");
          p2 = true;
        }
        r3++, f2 = "";
      }
      if (0 !== r3) throw new Error("Unclosed DOCTYPE");
    }
    return { entities: n3, i: e3 };
  };
}, 63: (t2, e2) => {
  const n2 = { preserveOrder: false, attributeNamePrefix: "@_", attributesGroupName: false, textNodeName: "#text", ignoreAttributes: true, removeNSPrefix: false, allowBooleanAttributes: false, parseTagValue: true, parseAttributeValue: false, trimValues: true, cdataPropName: false, numberParseOptions: { hex: true, leadingZeros: true, eNotation: true }, tagValueProcessor: function(t3, e3) {
    return e3;
  }, attributeValueProcessor: function(t3, e3) {
    return e3;
  }, stopNodes: [], alwaysCreateTextNode: false, isArray: () => false, commentPropName: false, unpairedTags: [], processEntities: true, htmlEntities: false, ignoreDeclaration: false, ignorePiTags: false, transformTagName: false, transformAttributeName: false, updateTag: function(t3, e3, n3) {
    return t3;
  } };
  e2.buildOptions = function(t3) {
    return Object.assign({}, n2, t3);
  }, e2.defaultOptions = n2;
}, 299: (t2, e2, n2) => {
  const r2 = n2(705), o2 = n2(365), i2 = n2(193), s2 = n2(494), a2 = n2(118);
  function u2(t3) {
    const e3 = Object.keys(t3);
    for (let n3 = 0; n3 < e3.length; n3++) {
      const r3 = e3[n3];
      this.lastEntities[r3] = { regex: new RegExp("&" + r3 + ";", "g"), val: t3[r3] };
    }
  }
  function c2(t3, e3, n3, r3, o3, i3, s3) {
    if (void 0 !== t3 && (this.options.trimValues && !r3 && (t3 = t3.trim()), t3.length > 0)) {
      s3 || (t3 = this.replaceEntitiesValue(t3));
      const r4 = this.options.tagValueProcessor(e3, t3, n3, o3, i3);
      return null == r4 ? t3 : typeof r4 != typeof t3 || r4 !== t3 ? r4 : this.options.trimValues || t3.trim() === t3 ? x2(t3, this.options.parseTagValue, this.options.numberParseOptions) : t3;
    }
  }
  function l2(t3) {
    if (this.options.removeNSPrefix) {
      const e3 = t3.split(":"), n3 = "/" === t3.charAt(0) ? "/" : "";
      if ("xmlns" === e3[0]) return "";
      2 === e3.length && (t3 = n3 + e3[1]);
    }
    return t3;
  }
  const h2 = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
  function p2(t3, e3, n3) {
    if (true !== this.options.ignoreAttributes && "string" == typeof t3) {
      const n4 = r2.getAllMatches(t3, h2), o3 = n4.length, i3 = {};
      for (let t4 = 0; t4 < o3; t4++) {
        const r3 = this.resolveNameSpace(n4[t4][1]);
        if (this.ignoreAttributesFn(r3, e3)) continue;
        let o4 = n4[t4][4], s3 = this.options.attributeNamePrefix + r3;
        if (r3.length) if (this.options.transformAttributeName && (s3 = this.options.transformAttributeName(s3)), "__proto__" === s3 && (s3 = "#__proto__"), void 0 !== o4) {
          this.options.trimValues && (o4 = o4.trim()), o4 = this.replaceEntitiesValue(o4);
          const t5 = this.options.attributeValueProcessor(r3, o4, e3);
          i3[s3] = null == t5 ? o4 : typeof t5 != typeof o4 || t5 !== o4 ? t5 : x2(o4, this.options.parseAttributeValue, this.options.numberParseOptions);
        } else this.options.allowBooleanAttributes && (i3[s3] = true);
      }
      if (!Object.keys(i3).length) return;
      if (this.options.attributesGroupName) {
        const t4 = {};
        return t4[this.options.attributesGroupName] = i3, t4;
      }
      return i3;
    }
  }
  const f2 = function(t3) {
    t3 = t3.replace(/\r\n?/g, "\n");
    const e3 = new o2("!xml");
    let n3 = e3, r3 = "", s3 = "";
    for (let a3 = 0; a3 < t3.length; a3++) if ("<" === t3[a3]) if ("/" === t3[a3 + 1]) {
      const e4 = v2(t3, ">", a3, "Closing Tag is not closed.");
      let o3 = t3.substring(a3 + 2, e4).trim();
      if (this.options.removeNSPrefix) {
        const t4 = o3.indexOf(":");
        -1 !== t4 && (o3 = o3.substr(t4 + 1));
      }
      this.options.transformTagName && (o3 = this.options.transformTagName(o3)), n3 && (r3 = this.saveTextToParentTag(r3, n3, s3));
      const i3 = s3.substring(s3.lastIndexOf(".") + 1);
      if (o3 && -1 !== this.options.unpairedTags.indexOf(o3)) throw new Error(`Unpaired tag can not be used as closing tag: </${o3}>`);
      let u3 = 0;
      i3 && -1 !== this.options.unpairedTags.indexOf(i3) ? (u3 = s3.lastIndexOf(".", s3.lastIndexOf(".") - 1), this.tagsNodeStack.pop()) : u3 = s3.lastIndexOf("."), s3 = s3.substring(0, u3), n3 = this.tagsNodeStack.pop(), r3 = "", a3 = e4;
    } else if ("?" === t3[a3 + 1]) {
      let e4 = b2(t3, a3, false, "?>");
      if (!e4) throw new Error("Pi Tag is not closed.");
      if (r3 = this.saveTextToParentTag(r3, n3, s3), this.options.ignoreDeclaration && "?xml" === e4.tagName || this.options.ignorePiTags) ;
      else {
        const t4 = new o2(e4.tagName);
        t4.add(this.options.textNodeName, ""), e4.tagName !== e4.tagExp && e4.attrExpPresent && (t4[":@"] = this.buildAttributesMap(e4.tagExp, s3, e4.tagName)), this.addChild(n3, t4, s3);
      }
      a3 = e4.closeIndex + 1;
    } else if ("!--" === t3.substr(a3 + 1, 3)) {
      const e4 = v2(t3, "-->", a3 + 4, "Comment is not closed.");
      if (this.options.commentPropName) {
        const o3 = t3.substring(a3 + 4, e4 - 2);
        r3 = this.saveTextToParentTag(r3, n3, s3), n3.add(this.options.commentPropName, [{ [this.options.textNodeName]: o3 }]);
      }
      a3 = e4;
    } else if ("!D" === t3.substr(a3 + 1, 2)) {
      const e4 = i2(t3, a3);
      this.docTypeEntities = e4.entities, a3 = e4.i;
    } else if ("![" === t3.substr(a3 + 1, 2)) {
      const e4 = v2(t3, "]]>", a3, "CDATA is not closed.") - 2, o3 = t3.substring(a3 + 9, e4);
      r3 = this.saveTextToParentTag(r3, n3, s3);
      let i3 = this.parseTextData(o3, n3.tagname, s3, true, false, true, true);
      null == i3 && (i3 = ""), this.options.cdataPropName ? n3.add(this.options.cdataPropName, [{ [this.options.textNodeName]: o3 }]) : n3.add(this.options.textNodeName, i3), a3 = e4 + 2;
    } else {
      let i3 = b2(t3, a3, this.options.removeNSPrefix), u3 = i3.tagName;
      const c3 = i3.rawTagName;
      let l3 = i3.tagExp, h3 = i3.attrExpPresent, p3 = i3.closeIndex;
      this.options.transformTagName && (u3 = this.options.transformTagName(u3)), n3 && r3 && "!xml" !== n3.tagname && (r3 = this.saveTextToParentTag(r3, n3, s3, false));
      const f3 = n3;
      if (f3 && -1 !== this.options.unpairedTags.indexOf(f3.tagname) && (n3 = this.tagsNodeStack.pop(), s3 = s3.substring(0, s3.lastIndexOf("."))), u3 !== e3.tagname && (s3 += s3 ? "." + u3 : u3), this.isItStopNode(this.options.stopNodes, s3, u3)) {
        let e4 = "";
        if (l3.length > 0 && l3.lastIndexOf("/") === l3.length - 1) "/" === u3[u3.length - 1] ? (u3 = u3.substr(0, u3.length - 1), s3 = s3.substr(0, s3.length - 1), l3 = u3) : l3 = l3.substr(0, l3.length - 1), a3 = i3.closeIndex;
        else if (-1 !== this.options.unpairedTags.indexOf(u3)) a3 = i3.closeIndex;
        else {
          const n4 = this.readStopNodeData(t3, c3, p3 + 1);
          if (!n4) throw new Error(`Unexpected end of ${c3}`);
          a3 = n4.i, e4 = n4.tagContent;
        }
        const r4 = new o2(u3);
        u3 !== l3 && h3 && (r4[":@"] = this.buildAttributesMap(l3, s3, u3)), e4 && (e4 = this.parseTextData(e4, u3, s3, true, h3, true, true)), s3 = s3.substr(0, s3.lastIndexOf(".")), r4.add(this.options.textNodeName, e4), this.addChild(n3, r4, s3);
      } else {
        if (l3.length > 0 && l3.lastIndexOf("/") === l3.length - 1) {
          "/" === u3[u3.length - 1] ? (u3 = u3.substr(0, u3.length - 1), s3 = s3.substr(0, s3.length - 1), l3 = u3) : l3 = l3.substr(0, l3.length - 1), this.options.transformTagName && (u3 = this.options.transformTagName(u3));
          const t4 = new o2(u3);
          u3 !== l3 && h3 && (t4[":@"] = this.buildAttributesMap(l3, s3, u3)), this.addChild(n3, t4, s3), s3 = s3.substr(0, s3.lastIndexOf("."));
        } else {
          const t4 = new o2(u3);
          this.tagsNodeStack.push(n3), u3 !== l3 && h3 && (t4[":@"] = this.buildAttributesMap(l3, s3, u3)), this.addChild(n3, t4, s3), n3 = t4;
        }
        r3 = "", a3 = p3;
      }
    }
    else r3 += t3[a3];
    return e3.child;
  };
  function d2(t3, e3, n3) {
    const r3 = this.options.updateTag(e3.tagname, n3, e3[":@"]);
    false === r3 || ("string" == typeof r3 ? (e3.tagname = r3, t3.addChild(e3)) : t3.addChild(e3));
  }
  const g2 = function(t3) {
    if (this.options.processEntities) {
      for (let e3 in this.docTypeEntities) {
        const n3 = this.docTypeEntities[e3];
        t3 = t3.replace(n3.regx, n3.val);
      }
      for (let e3 in this.lastEntities) {
        const n3 = this.lastEntities[e3];
        t3 = t3.replace(n3.regex, n3.val);
      }
      if (this.options.htmlEntities) for (let e3 in this.htmlEntities) {
        const n3 = this.htmlEntities[e3];
        t3 = t3.replace(n3.regex, n3.val);
      }
      t3 = t3.replace(this.ampEntity.regex, this.ampEntity.val);
    }
    return t3;
  };
  function m2(t3, e3, n3, r3) {
    return t3 && (void 0 === r3 && (r3 = 0 === Object.keys(e3.child).length), void 0 !== (t3 = this.parseTextData(t3, e3.tagname, n3, false, !!e3[":@"] && 0 !== Object.keys(e3[":@"]).length, r3)) && "" !== t3 && e3.add(this.options.textNodeName, t3), t3 = ""), t3;
  }
  function y2(t3, e3, n3) {
    const r3 = "*." + n3;
    for (const n4 in t3) {
      const o3 = t3[n4];
      if (r3 === o3 || e3 === o3) return true;
    }
    return false;
  }
  function v2(t3, e3, n3, r3) {
    const o3 = t3.indexOf(e3, n3);
    if (-1 === o3) throw new Error(r3);
    return o3 + e3.length - 1;
  }
  function b2(t3, e3, n3) {
    const r3 = (function(t4, e4) {
      let n4, r4 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : ">", o4 = "";
      for (let i4 = e4; i4 < t4.length; i4++) {
        let e5 = t4[i4];
        if (n4) e5 === n4 && (n4 = "");
        else if ('"' === e5 || "'" === e5) n4 = e5;
        else if (e5 === r4[0]) {
          if (!r4[1]) return { data: o4, index: i4 };
          if (t4[i4 + 1] === r4[1]) return { data: o4, index: i4 };
        } else "	" === e5 && (e5 = " ");
        o4 += e5;
      }
    })(t3, e3 + 1, arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : ">");
    if (!r3) return;
    let o3 = r3.data;
    const i3 = r3.index, s3 = o3.search(/\s/);
    let a3 = o3, u3 = true;
    -1 !== s3 && (a3 = o3.substring(0, s3), o3 = o3.substring(s3 + 1).trimStart());
    const c3 = a3;
    if (n3) {
      const t4 = a3.indexOf(":");
      -1 !== t4 && (a3 = a3.substr(t4 + 1), u3 = a3 !== r3.data.substr(t4 + 1));
    }
    return { tagName: a3, tagExp: o3, closeIndex: i3, attrExpPresent: u3, rawTagName: c3 };
  }
  function w2(t3, e3, n3) {
    const r3 = n3;
    let o3 = 1;
    for (; n3 < t3.length; n3++) if ("<" === t3[n3]) if ("/" === t3[n3 + 1]) {
      const i3 = v2(t3, ">", n3, `${e3} is not closed`);
      if (t3.substring(n3 + 2, i3).trim() === e3 && (o3--, 0 === o3)) return { tagContent: t3.substring(r3, n3), i: i3 };
      n3 = i3;
    } else if ("?" === t3[n3 + 1]) n3 = v2(t3, "?>", n3 + 1, "StopNode is not closed.");
    else if ("!--" === t3.substr(n3 + 1, 3)) n3 = v2(t3, "-->", n3 + 3, "StopNode is not closed.");
    else if ("![" === t3.substr(n3 + 1, 2)) n3 = v2(t3, "]]>", n3, "StopNode is not closed.") - 2;
    else {
      const r4 = b2(t3, n3, ">");
      r4 && ((r4 && r4.tagName) === e3 && "/" !== r4.tagExp[r4.tagExp.length - 1] && o3++, n3 = r4.closeIndex);
    }
  }
  function x2(t3, e3, n3) {
    if (e3 && "string" == typeof t3) {
      const e4 = t3.trim();
      return "true" === e4 || "false" !== e4 && s2(t3, n3);
    }
    return r2.isExist(t3) ? t3 : "";
  }
  t2.exports = class {
    constructor(t3) {
      this.options = t3, this.currentNode = null, this.tagsNodeStack = [], this.docTypeEntities = {}, this.lastEntities = { apos: { regex: /&(apos|#39|#x27);/g, val: "'" }, gt: { regex: /&(gt|#62|#x3E);/g, val: ">" }, lt: { regex: /&(lt|#60|#x3C);/g, val: "<" }, quot: { regex: /&(quot|#34|#x22);/g, val: '"' } }, this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" }, this.htmlEntities = { space: { regex: /&(nbsp|#160);/g, val: " " }, cent: { regex: /&(cent|#162);/g, val: "¢" }, pound: { regex: /&(pound|#163);/g, val: "£" }, yen: { regex: /&(yen|#165);/g, val: "¥" }, euro: { regex: /&(euro|#8364);/g, val: "€" }, copyright: { regex: /&(copy|#169);/g, val: "©" }, reg: { regex: /&(reg|#174);/g, val: "®" }, inr: { regex: /&(inr|#8377);/g, val: "₹" }, num_dec: { regex: /&#([0-9]{1,7});/g, val: (t4, e3) => String.fromCharCode(Number.parseInt(e3, 10)) }, num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (t4, e3) => String.fromCharCode(Number.parseInt(e3, 16)) } }, this.addExternalEntities = u2, this.parseXml = f2, this.parseTextData = c2, this.resolveNameSpace = l2, this.buildAttributesMap = p2, this.isItStopNode = y2, this.replaceEntitiesValue = g2, this.readStopNodeData = w2, this.saveTextToParentTag = m2, this.addChild = d2, this.ignoreAttributesFn = a2(this.options.ignoreAttributes);
    }
  };
}, 338: (t2, e2, n2) => {
  const { buildOptions: r2 } = n2(63), o2 = n2(299), { prettify: i2 } = n2(728), s2 = n2(31);
  t2.exports = class {
    constructor(t3) {
      this.externalEntities = {}, this.options = r2(t3);
    }
    parse(t3, e3) {
      if ("string" == typeof t3) ;
      else {
        if (!t3.toString) throw new Error("XML data is accepted in String or Bytes[] form.");
        t3 = t3.toString();
      }
      if (e3) {
        true === e3 && (e3 = {});
        const n4 = s2.validate(t3, e3);
        if (true !== n4) throw Error(`${n4.err.msg}:${n4.err.line}:${n4.err.col}`);
      }
      const n3 = new o2(this.options);
      n3.addExternalEntities(this.externalEntities);
      const r3 = n3.parseXml(t3);
      return this.options.preserveOrder || void 0 === r3 ? r3 : i2(r3, this.options);
    }
    addEntity(t3, e3) {
      if (-1 !== e3.indexOf("&")) throw new Error("Entity value can't have '&'");
      if (-1 !== t3.indexOf("&") || -1 !== t3.indexOf(";")) throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
      if ("&" === e3) throw new Error("An entity with value '&' is not permitted");
      this.externalEntities[t3] = e3;
    }
  };
}, 728: (t2, e2) => {
  function n2(t3, e3, s2) {
    let a2;
    const u2 = {};
    for (let c2 = 0; c2 < t3.length; c2++) {
      const l2 = t3[c2], h2 = r2(l2);
      let p2 = "";
      if (p2 = void 0 === s2 ? h2 : s2 + "." + h2, h2 === e3.textNodeName) void 0 === a2 ? a2 = l2[h2] : a2 += "" + l2[h2];
      else {
        if (void 0 === h2) continue;
        if (l2[h2]) {
          let t4 = n2(l2[h2], e3, p2);
          const r3 = i2(t4, e3);
          l2[":@"] ? o2(t4, l2[":@"], p2, e3) : 1 !== Object.keys(t4).length || void 0 === t4[e3.textNodeName] || e3.alwaysCreateTextNode ? 0 === Object.keys(t4).length && (e3.alwaysCreateTextNode ? t4[e3.textNodeName] = "" : t4 = "") : t4 = t4[e3.textNodeName], void 0 !== u2[h2] && u2.hasOwnProperty(h2) ? (Array.isArray(u2[h2]) || (u2[h2] = [u2[h2]]), u2[h2].push(t4)) : e3.isArray(h2, p2, r3) ? u2[h2] = [t4] : u2[h2] = t4;
        }
      }
    }
    return "string" == typeof a2 ? a2.length > 0 && (u2[e3.textNodeName] = a2) : void 0 !== a2 && (u2[e3.textNodeName] = a2), u2;
  }
  function r2(t3) {
    const e3 = Object.keys(t3);
    for (let t4 = 0; t4 < e3.length; t4++) {
      const n3 = e3[t4];
      if (":@" !== n3) return n3;
    }
  }
  function o2(t3, e3, n3, r3) {
    if (e3) {
      const o3 = Object.keys(e3), i3 = o3.length;
      for (let s2 = 0; s2 < i3; s2++) {
        const i4 = o3[s2];
        r3.isArray(i4, n3 + "." + i4, true, true) ? t3[i4] = [e3[i4]] : t3[i4] = e3[i4];
      }
    }
  }
  function i2(t3, e3) {
    const { textNodeName: n3 } = e3, r3 = Object.keys(t3).length;
    return 0 === r3 || !(1 !== r3 || !t3[n3] && "boolean" != typeof t3[n3] && 0 !== t3[n3]);
  }
  e2.prettify = function(t3, e3) {
    return n2(t3, e3);
  };
}, 365: (t2) => {
  t2.exports = class {
    constructor(t3) {
      this.tagname = t3, this.child = [], this[":@"] = {};
    }
    add(t3, e2) {
      "__proto__" === t3 && (t3 = "#__proto__"), this.child.push({ [t3]: e2 });
    }
    addChild(t3) {
      "__proto__" === t3.tagname && (t3.tagname = "#__proto__"), t3[":@"] && Object.keys(t3[":@"]).length > 0 ? this.child.push({ [t3.tagname]: t3.child, ":@": t3[":@"] }) : this.child.push({ [t3.tagname]: t3.child });
    }
  };
}, 135: (t2) => {
  function e2(t3) {
    return !!t3.constructor && "function" == typeof t3.constructor.isBuffer && t3.constructor.isBuffer(t3);
  }
  t2.exports = function(t3) {
    return null != t3 && (e2(t3) || (function(t4) {
      return "function" == typeof t4.readFloatLE && "function" == typeof t4.slice && e2(t4.slice(0, 0));
    })(t3) || !!t3._isBuffer);
  };
}, 542: (t2, e2, n2) => {
  !(function() {
    var e3 = n2(298), r2 = n2(526).utf8, o2 = n2(135), i2 = n2(526).bin, s2 = function(t3, n3) {
      t3.constructor == String ? t3 = n3 && "binary" === n3.encoding ? i2.stringToBytes(t3) : r2.stringToBytes(t3) : o2(t3) ? t3 = Array.prototype.slice.call(t3, 0) : Array.isArray(t3) || t3.constructor === Uint8Array || (t3 = t3.toString());
      for (var a2 = e3.bytesToWords(t3), u2 = 8 * t3.length, c2 = 1732584193, l2 = -271733879, h2 = -1732584194, p2 = 271733878, f2 = 0; f2 < a2.length; f2++) a2[f2] = 16711935 & (a2[f2] << 8 | a2[f2] >>> 24) | 4278255360 & (a2[f2] << 24 | a2[f2] >>> 8);
      a2[u2 >>> 5] |= 128 << u2 % 32, a2[14 + (u2 + 64 >>> 9 << 4)] = u2;
      var d2 = s2._ff, g2 = s2._gg, m2 = s2._hh, y2 = s2._ii;
      for (f2 = 0; f2 < a2.length; f2 += 16) {
        var v2 = c2, b2 = l2, w2 = h2, x2 = p2;
        c2 = d2(c2, l2, h2, p2, a2[f2 + 0], 7, -680876936), p2 = d2(p2, c2, l2, h2, a2[f2 + 1], 12, -389564586), h2 = d2(h2, p2, c2, l2, a2[f2 + 2], 17, 606105819), l2 = d2(l2, h2, p2, c2, a2[f2 + 3], 22, -1044525330), c2 = d2(c2, l2, h2, p2, a2[f2 + 4], 7, -176418897), p2 = d2(p2, c2, l2, h2, a2[f2 + 5], 12, 1200080426), h2 = d2(h2, p2, c2, l2, a2[f2 + 6], 17, -1473231341), l2 = d2(l2, h2, p2, c2, a2[f2 + 7], 22, -45705983), c2 = d2(c2, l2, h2, p2, a2[f2 + 8], 7, 1770035416), p2 = d2(p2, c2, l2, h2, a2[f2 + 9], 12, -1958414417), h2 = d2(h2, p2, c2, l2, a2[f2 + 10], 17, -42063), l2 = d2(l2, h2, p2, c2, a2[f2 + 11], 22, -1990404162), c2 = d2(c2, l2, h2, p2, a2[f2 + 12], 7, 1804603682), p2 = d2(p2, c2, l2, h2, a2[f2 + 13], 12, -40341101), h2 = d2(h2, p2, c2, l2, a2[f2 + 14], 17, -1502002290), c2 = g2(c2, l2 = d2(l2, h2, p2, c2, a2[f2 + 15], 22, 1236535329), h2, p2, a2[f2 + 1], 5, -165796510), p2 = g2(p2, c2, l2, h2, a2[f2 + 6], 9, -1069501632), h2 = g2(h2, p2, c2, l2, a2[f2 + 11], 14, 643717713), l2 = g2(l2, h2, p2, c2, a2[f2 + 0], 20, -373897302), c2 = g2(c2, l2, h2, p2, a2[f2 + 5], 5, -701558691), p2 = g2(p2, c2, l2, h2, a2[f2 + 10], 9, 38016083), h2 = g2(h2, p2, c2, l2, a2[f2 + 15], 14, -660478335), l2 = g2(l2, h2, p2, c2, a2[f2 + 4], 20, -405537848), c2 = g2(c2, l2, h2, p2, a2[f2 + 9], 5, 568446438), p2 = g2(p2, c2, l2, h2, a2[f2 + 14], 9, -1019803690), h2 = g2(h2, p2, c2, l2, a2[f2 + 3], 14, -187363961), l2 = g2(l2, h2, p2, c2, a2[f2 + 8], 20, 1163531501), c2 = g2(c2, l2, h2, p2, a2[f2 + 13], 5, -1444681467), p2 = g2(p2, c2, l2, h2, a2[f2 + 2], 9, -51403784), h2 = g2(h2, p2, c2, l2, a2[f2 + 7], 14, 1735328473), c2 = m2(c2, l2 = g2(l2, h2, p2, c2, a2[f2 + 12], 20, -1926607734), h2, p2, a2[f2 + 5], 4, -378558), p2 = m2(p2, c2, l2, h2, a2[f2 + 8], 11, -2022574463), h2 = m2(h2, p2, c2, l2, a2[f2 + 11], 16, 1839030562), l2 = m2(l2, h2, p2, c2, a2[f2 + 14], 23, -35309556), c2 = m2(c2, l2, h2, p2, a2[f2 + 1], 4, -1530992060), p2 = m2(p2, c2, l2, h2, a2[f2 + 4], 11, 1272893353), h2 = m2(h2, p2, c2, l2, a2[f2 + 7], 16, -155497632), l2 = m2(l2, h2, p2, c2, a2[f2 + 10], 23, -1094730640), c2 = m2(c2, l2, h2, p2, a2[f2 + 13], 4, 681279174), p2 = m2(p2, c2, l2, h2, a2[f2 + 0], 11, -358537222), h2 = m2(h2, p2, c2, l2, a2[f2 + 3], 16, -722521979), l2 = m2(l2, h2, p2, c2, a2[f2 + 6], 23, 76029189), c2 = m2(c2, l2, h2, p2, a2[f2 + 9], 4, -640364487), p2 = m2(p2, c2, l2, h2, a2[f2 + 12], 11, -421815835), h2 = m2(h2, p2, c2, l2, a2[f2 + 15], 16, 530742520), c2 = y2(c2, l2 = m2(l2, h2, p2, c2, a2[f2 + 2], 23, -995338651), h2, p2, a2[f2 + 0], 6, -198630844), p2 = y2(p2, c2, l2, h2, a2[f2 + 7], 10, 1126891415), h2 = y2(h2, p2, c2, l2, a2[f2 + 14], 15, -1416354905), l2 = y2(l2, h2, p2, c2, a2[f2 + 5], 21, -57434055), c2 = y2(c2, l2, h2, p2, a2[f2 + 12], 6, 1700485571), p2 = y2(p2, c2, l2, h2, a2[f2 + 3], 10, -1894986606), h2 = y2(h2, p2, c2, l2, a2[f2 + 10], 15, -1051523), l2 = y2(l2, h2, p2, c2, a2[f2 + 1], 21, -2054922799), c2 = y2(c2, l2, h2, p2, a2[f2 + 8], 6, 1873313359), p2 = y2(p2, c2, l2, h2, a2[f2 + 15], 10, -30611744), h2 = y2(h2, p2, c2, l2, a2[f2 + 6], 15, -1560198380), l2 = y2(l2, h2, p2, c2, a2[f2 + 13], 21, 1309151649), c2 = y2(c2, l2, h2, p2, a2[f2 + 4], 6, -145523070), p2 = y2(p2, c2, l2, h2, a2[f2 + 11], 10, -1120210379), h2 = y2(h2, p2, c2, l2, a2[f2 + 2], 15, 718787259), l2 = y2(l2, h2, p2, c2, a2[f2 + 9], 21, -343485551), c2 = c2 + v2 >>> 0, l2 = l2 + b2 >>> 0, h2 = h2 + w2 >>> 0, p2 = p2 + x2 >>> 0;
      }
      return e3.endian([c2, l2, h2, p2]);
    };
    s2._ff = function(t3, e4, n3, r3, o3, i3, s3) {
      var a2 = t3 + (e4 & n3 | ~e4 & r3) + (o3 >>> 0) + s3;
      return (a2 << i3 | a2 >>> 32 - i3) + e4;
    }, s2._gg = function(t3, e4, n3, r3, o3, i3, s3) {
      var a2 = t3 + (e4 & r3 | n3 & ~r3) + (o3 >>> 0) + s3;
      return (a2 << i3 | a2 >>> 32 - i3) + e4;
    }, s2._hh = function(t3, e4, n3, r3, o3, i3, s3) {
      var a2 = t3 + (e4 ^ n3 ^ r3) + (o3 >>> 0) + s3;
      return (a2 << i3 | a2 >>> 32 - i3) + e4;
    }, s2._ii = function(t3, e4, n3, r3, o3, i3, s3) {
      var a2 = t3 + (n3 ^ (e4 | ~r3)) + (o3 >>> 0) + s3;
      return (a2 << i3 | a2 >>> 32 - i3) + e4;
    }, s2._blocksize = 16, s2._digestsize = 16, t2.exports = function(t3, n3) {
      if (null == t3) throw new Error("Illegal argument " + t3);
      var r3 = e3.wordsToBytes(s2(t3, n3));
      return n3 && n3.asBytes ? r3 : n3 && n3.asString ? i2.bytesToString(r3) : e3.bytesToHex(r3);
    };
  })();
}, 285: (t2, e2, n2) => {
  var r2 = n2(2);
  t2.exports = function(t3) {
    return t3 ? ("{}" === t3.substr(0, 2) && (t3 = "\\{\\}" + t3.substr(2)), m2((function(t4) {
      return t4.split("\\\\").join(o2).split("\\{").join(i2).split("\\}").join(s2).split("\\,").join(a2).split("\\.").join(u2);
    })(t3), true).map(l2)) : [];
  };
  var o2 = "\0SLASH" + Math.random() + "\0", i2 = "\0OPEN" + Math.random() + "\0", s2 = "\0CLOSE" + Math.random() + "\0", a2 = "\0COMMA" + Math.random() + "\0", u2 = "\0PERIOD" + Math.random() + "\0";
  function c2(t3) {
    return parseInt(t3, 10) == t3 ? parseInt(t3, 10) : t3.charCodeAt(0);
  }
  function l2(t3) {
    return t3.split(o2).join("\\").split(i2).join("{").split(s2).join("}").split(a2).join(",").split(u2).join(".");
  }
  function h2(t3) {
    if (!t3) return [""];
    var e3 = [], n3 = r2("{", "}", t3);
    if (!n3) return t3.split(",");
    var o3 = n3.pre, i3 = n3.body, s3 = n3.post, a3 = o3.split(",");
    a3[a3.length - 1] += "{" + i3 + "}";
    var u3 = h2(s3);
    return s3.length && (a3[a3.length - 1] += u3.shift(), a3.push.apply(a3, u3)), e3.push.apply(e3, a3), e3;
  }
  function p2(t3) {
    return "{" + t3 + "}";
  }
  function f2(t3) {
    return /^-?0\d/.test(t3);
  }
  function d2(t3, e3) {
    return t3 <= e3;
  }
  function g2(t3, e3) {
    return t3 >= e3;
  }
  function m2(t3, e3) {
    var n3 = [], o3 = r2("{", "}", t3);
    if (!o3) return [t3];
    var i3 = o3.pre, a3 = o3.post.length ? m2(o3.post, false) : [""];
    if (/\$$/.test(o3.pre)) for (var u3 = 0; u3 < a3.length; u3++) {
      var l3 = i3 + "{" + o3.body + "}" + a3[u3];
      n3.push(l3);
    }
    else {
      var y2, v2, b2 = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(o3.body), w2 = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(o3.body), x2 = b2 || w2, N2 = o3.body.indexOf(",") >= 0;
      if (!x2 && !N2) return o3.post.match(/,.*\}/) ? m2(t3 = o3.pre + "{" + o3.body + s2 + o3.post) : [t3];
      if (x2) y2 = o3.body.split(/\.\./);
      else if (1 === (y2 = h2(o3.body)).length && 1 === (y2 = m2(y2[0], false).map(p2)).length) return a3.map((function(t4) {
        return o3.pre + y2[0] + t4;
      }));
      if (x2) {
        var A2 = c2(y2[0]), P2 = c2(y2[1]), O2 = Math.max(y2[0].length, y2[1].length), E2 = 3 == y2.length ? Math.abs(c2(y2[2])) : 1, T2 = d2;
        P2 < A2 && (E2 *= -1, T2 = g2);
        var j2 = y2.some(f2);
        v2 = [];
        for (var S2 = A2; T2(S2, P2); S2 += E2) {
          var $2;
          if (w2) "\\" === ($2 = String.fromCharCode(S2)) && ($2 = "");
          else if ($2 = String(S2), j2) {
            var C2 = O2 - $2.length;
            if (C2 > 0) {
              var I2 = new Array(C2 + 1).join("0");
              $2 = S2 < 0 ? "-" + I2 + $2.slice(1) : I2 + $2;
            }
          }
          v2.push($2);
        }
      } else {
        v2 = [];
        for (var k2 = 0; k2 < y2.length; k2++) v2.push.apply(v2, m2(y2[k2], false));
      }
      for (k2 = 0; k2 < v2.length; k2++) for (u3 = 0; u3 < a3.length; u3++) l3 = i3 + v2[k2] + a3[u3], (!e3 || x2 || l3) && n3.push(l3);
    }
    return n3;
  }
}, 829: (t2) => {
  function e2(t3) {
    return e2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t4) {
      return typeof t4;
    } : function(t4) {
      return t4 && "function" == typeof Symbol && t4.constructor === Symbol && t4 !== Symbol.prototype ? "symbol" : typeof t4;
    }, e2(t3);
  }
  function n2(t3) {
    var e3 = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
    return n2 = function(t4) {
      if (null === t4 || (n3 = t4, -1 === Function.toString.call(n3).indexOf("[native code]"))) return t4;
      var n3;
      if ("function" != typeof t4) throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== e3) {
        if (e3.has(t4)) return e3.get(t4);
        e3.set(t4, s3);
      }
      function s3() {
        return r2(t4, arguments, i2(this).constructor);
      }
      return s3.prototype = Object.create(t4.prototype, { constructor: { value: s3, enumerable: false, writable: true, configurable: true } }), o2(s3, t4);
    }, n2(t3);
  }
  function r2(t3, e3, n3) {
    return r2 = (function() {
      if ("undefined" == typeof Reflect || !Reflect.construct) return false;
      if (Reflect.construct.sham) return false;
      if ("function" == typeof Proxy) return true;
      try {
        return Date.prototype.toString.call(Reflect.construct(Date, [], (function() {
        }))), true;
      } catch (t4) {
        return false;
      }
    })() ? Reflect.construct : function(t4, e4, n4) {
      var r3 = [null];
      r3.push.apply(r3, e4);
      var i3 = new (Function.bind.apply(t4, r3))();
      return n4 && o2(i3, n4.prototype), i3;
    }, r2.apply(null, arguments);
  }
  function o2(t3, e3) {
    return o2 = Object.setPrototypeOf || function(t4, e4) {
      return t4.__proto__ = e4, t4;
    }, o2(t3, e3);
  }
  function i2(t3) {
    return i2 = Object.setPrototypeOf ? Object.getPrototypeOf : function(t4) {
      return t4.__proto__ || Object.getPrototypeOf(t4);
    }, i2(t3);
  }
  var s2 = (function(t3) {
    function n3(t4) {
      var r3;
      return (function(t5, e3) {
        if (!(t5 instanceof e3)) throw new TypeError("Cannot call a class as a function");
      })(this, n3), (r3 = (function(t5, n4) {
        return !n4 || "object" !== e2(n4) && "function" != typeof n4 ? (function(t6) {
          if (void 0 === t6) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return t6;
        })(t5) : n4;
      })(this, i2(n3).call(this, t4))).name = "ObjectPrototypeMutationError", r3;
    }
    return (function(t4, e3) {
      if ("function" != typeof e3 && null !== e3) throw new TypeError("Super expression must either be null or a function");
      t4.prototype = Object.create(e3 && e3.prototype, { constructor: { value: t4, writable: true, configurable: true } }), e3 && o2(t4, e3);
    })(n3, t3), n3;
  })(n2(Error));
  function a2(t3, n3) {
    for (var r3 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : function() {
    }, o3 = n3.split("."), i3 = o3.length, s3 = function(e3) {
      var n4 = o3[e3];
      if (!t3) return { v: void 0 };
      if ("+" === n4) {
        if (Array.isArray(t3)) return { v: t3.map((function(n5, i5) {
          var s4 = o3.slice(e3 + 1);
          return s4.length > 0 ? a2(n5, s4.join("."), r3) : r3(t3, i5, o3, e3);
        })) };
        var i4 = o3.slice(0, e3).join(".");
        throw new Error("Object at wildcard (".concat(i4, ") is not an array"));
      }
      t3 = r3(t3, n4, o3, e3);
    }, u3 = 0; u3 < i3; u3++) {
      var c2 = s3(u3);
      if ("object" === e2(c2)) return c2.v;
    }
    return t3;
  }
  function u2(t3, e3) {
    return t3.length === e3 + 1;
  }
  t2.exports = { set: function(t3, n3, r3) {
    if ("object" != e2(t3) || null === t3) return t3;
    if (void 0 === n3) return t3;
    if ("number" == typeof n3) return t3[n3] = r3, t3[n3];
    try {
      return a2(t3, n3, (function(t4, e3, n4, o3) {
        if (t4 === Reflect.getPrototypeOf({})) throw new s2("Attempting to mutate Object.prototype");
        if (!t4[e3]) {
          var i3 = Number.isInteger(Number(n4[o3 + 1])), a3 = "+" === n4[o3 + 1];
          t4[e3] = i3 || a3 ? [] : {};
        }
        return u2(n4, o3) && (t4[e3] = r3), t4[e3];
      }));
    } catch (e3) {
      if (e3 instanceof s2) throw e3;
      return t3;
    }
  }, get: function(t3, n3) {
    if ("object" != e2(t3) || null === t3) return t3;
    if (void 0 === n3) return t3;
    if ("number" == typeof n3) return t3[n3];
    try {
      return a2(t3, n3, (function(t4, e3) {
        return t4[e3];
      }));
    } catch (e3) {
      return t3;
    }
  }, has: function(t3, n3) {
    var r3 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
    if ("object" != e2(t3) || null === t3) return false;
    if (void 0 === n3) return false;
    if ("number" == typeof n3) return n3 in t3;
    try {
      var o3 = false;
      return a2(t3, n3, (function(t4, e3, n4, i3) {
        if (!u2(n4, i3)) return t4 && t4[e3];
        o3 = r3.own ? t4.hasOwnProperty(e3) : e3 in t4;
      })), o3;
    } catch (t4) {
      return false;
    }
  }, hasOwn: function(t3, e3, n3) {
    return this.has(t3, e3, n3 || { own: true });
  }, isIn: function(t3, n3, r3) {
    var o3 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
    if ("object" != e2(t3) || null === t3) return false;
    if (void 0 === n3) return false;
    try {
      var i3 = false, s3 = false;
      return a2(t3, n3, (function(t4, n4, o4, a3) {
        return i3 = i3 || t4 === r3 || !!t4 && t4[n4] === r3, s3 = u2(o4, a3) && "object" === e2(t4) && n4 in t4, t4 && t4[n4];
      })), o3.validPath ? i3 && s3 : i3;
    } catch (t4) {
      return false;
    }
  }, ObjectPrototypeMutationError: s2 };
}, 47: (t2, e2, n2) => {
  var r2 = n2(410), o2 = function(t3) {
    return "string" == typeof t3;
  };
  function i2(t3, e3) {
    for (var n3 = [], r3 = 0; r3 < t3.length; r3++) {
      var o3 = t3[r3];
      o3 && "." !== o3 && (".." === o3 ? n3.length && ".." !== n3[n3.length - 1] ? n3.pop() : e3 && n3.push("..") : n3.push(o3));
    }
    return n3;
  }
  var s2 = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/, a2 = {};
  function u2(t3) {
    return s2.exec(t3).slice(1);
  }
  a2.resolve = function() {
    for (var t3 = "", e3 = false, n3 = arguments.length - 1; n3 >= -1 && !e3; n3--) {
      var r3 = n3 >= 0 ? arguments[n3] : process.cwd();
      if (!o2(r3)) throw new TypeError("Arguments to path.resolve must be strings");
      r3 && (t3 = r3 + "/" + t3, e3 = "/" === r3.charAt(0));
    }
    return (e3 ? "/" : "") + (t3 = i2(t3.split("/"), !e3).join("/")) || ".";
  }, a2.normalize = function(t3) {
    var e3 = a2.isAbsolute(t3), n3 = "/" === t3.substr(-1);
    return (t3 = i2(t3.split("/"), !e3).join("/")) || e3 || (t3 = "."), t3 && n3 && (t3 += "/"), (e3 ? "/" : "") + t3;
  }, a2.isAbsolute = function(t3) {
    return "/" === t3.charAt(0);
  }, a2.join = function() {
    for (var t3 = "", e3 = 0; e3 < arguments.length; e3++) {
      var n3 = arguments[e3];
      if (!o2(n3)) throw new TypeError("Arguments to path.join must be strings");
      n3 && (t3 += t3 ? "/" + n3 : n3);
    }
    return a2.normalize(t3);
  }, a2.relative = function(t3, e3) {
    function n3(t4) {
      for (var e4 = 0; e4 < t4.length && "" === t4[e4]; e4++) ;
      for (var n4 = t4.length - 1; n4 >= 0 && "" === t4[n4]; n4--) ;
      return e4 > n4 ? [] : t4.slice(e4, n4 + 1);
    }
    t3 = a2.resolve(t3).substr(1), e3 = a2.resolve(e3).substr(1);
    for (var r3 = n3(t3.split("/")), o3 = n3(e3.split("/")), i3 = Math.min(r3.length, o3.length), s3 = i3, u3 = 0; u3 < i3; u3++) if (r3[u3] !== o3[u3]) {
      s3 = u3;
      break;
    }
    var c2 = [];
    for (u3 = s3; u3 < r3.length; u3++) c2.push("..");
    return (c2 = c2.concat(o3.slice(s3))).join("/");
  }, a2._makeLong = function(t3) {
    return t3;
  }, a2.dirname = function(t3) {
    var e3 = u2(t3), n3 = e3[0], r3 = e3[1];
    return n3 || r3 ? (r3 && (r3 = r3.substr(0, r3.length - 1)), n3 + r3) : ".";
  }, a2.basename = function(t3, e3) {
    var n3 = u2(t3)[2];
    return e3 && n3.substr(-1 * e3.length) === e3 && (n3 = n3.substr(0, n3.length - e3.length)), n3;
  }, a2.extname = function(t3) {
    return u2(t3)[3];
  }, a2.format = function(t3) {
    if (!r2.isObject(t3)) throw new TypeError("Parameter 'pathObject' must be an object, not " + typeof t3);
    var e3 = t3.root || "";
    if (!o2(e3)) throw new TypeError("'pathObject.root' must be a string or undefined, not " + typeof t3.root);
    return (t3.dir ? t3.dir + a2.sep : "") + (t3.base || "");
  }, a2.parse = function(t3) {
    if (!o2(t3)) throw new TypeError("Parameter 'pathString' must be a string, not " + typeof t3);
    var e3 = u2(t3);
    if (!e3 || 4 !== e3.length) throw new TypeError("Invalid path '" + t3 + "'");
    return e3[1] = e3[1] || "", e3[2] = e3[2] || "", e3[3] = e3[3] || "", { root: e3[0], dir: e3[0] + e3[1].slice(0, e3[1].length - 1), base: e3[2], ext: e3[3], name: e3[2].slice(0, e3[2].length - e3[3].length) };
  }, a2.sep = "/", a2.delimiter = ":", t2.exports = a2;
}, 647: (t2, e2) => {
  var n2 = Object.prototype.hasOwnProperty;
  function r2(t3) {
    try {
      return decodeURIComponent(t3.replace(/\+/g, " "));
    } catch (t4) {
      return null;
    }
  }
  function o2(t3) {
    try {
      return encodeURIComponent(t3);
    } catch (t4) {
      return null;
    }
  }
  e2.stringify = function(t3, e3) {
    e3 = e3 || "";
    var r3, i2, s2 = [];
    for (i2 in "string" != typeof e3 && (e3 = "?"), t3) if (n2.call(t3, i2)) {
      if ((r3 = t3[i2]) || null != r3 && !isNaN(r3) || (r3 = ""), i2 = o2(i2), r3 = o2(r3), null === i2 || null === r3) continue;
      s2.push(i2 + "=" + r3);
    }
    return s2.length ? e3 + s2.join("&") : "";
  }, e2.parse = function(t3) {
    for (var e3, n3 = /([^=?#&]+)=?([^&]*)/g, o3 = {}; e3 = n3.exec(t3); ) {
      var i2 = r2(e3[1]), s2 = r2(e3[2]);
      null === i2 || null === s2 || i2 in o3 || (o3[i2] = s2);
    }
    return o3;
  };
}, 670: (t2) => {
  t2.exports = function(t3, e2) {
    if (e2 = e2.split(":")[0], !(t3 = +t3)) return false;
    switch (e2) {
      case "http":
      case "ws":
        return 80 !== t3;
      case "https":
      case "wss":
        return 443 !== t3;
      case "ftp":
        return 21 !== t3;
      case "gopher":
        return 70 !== t3;
      case "file":
        return false;
    }
    return 0 !== t3;
  };
}, 494: (t2) => {
  const e2 = /^[-+]?0x[a-fA-F0-9]+$/, n2 = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
  !Number.parseInt && window.parseInt && (Number.parseInt = window.parseInt), !Number.parseFloat && window.parseFloat && (Number.parseFloat = window.parseFloat);
  const r2 = { hex: true, leadingZeros: true, decimalPoint: ".", eNotation: true };
  t2.exports = function(t3) {
    let o2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (o2 = Object.assign({}, r2, o2), !t3 || "string" != typeof t3) return t3;
    let i2 = t3.trim();
    if (void 0 !== o2.skipLike && o2.skipLike.test(i2)) return t3;
    if (o2.hex && e2.test(i2)) return Number.parseInt(i2, 16);
    {
      const e3 = n2.exec(i2);
      if (e3) {
        const n3 = e3[1], r3 = e3[2];
        let a2 = (s2 = e3[3]) && -1 !== s2.indexOf(".") ? ("." === (s2 = s2.replace(/0+$/, "")) ? s2 = "0" : "." === s2[0] ? s2 = "0" + s2 : "." === s2[s2.length - 1] && (s2 = s2.substr(0, s2.length - 1)), s2) : s2;
        const u2 = e3[4] || e3[6];
        if (!o2.leadingZeros && r3.length > 0 && n3 && "." !== i2[2]) return t3;
        if (!o2.leadingZeros && r3.length > 0 && !n3 && "." !== i2[1]) return t3;
        {
          const e4 = Number(i2), s3 = "" + e4;
          return -1 !== s3.search(/[eE]/) || u2 ? o2.eNotation ? e4 : t3 : -1 !== i2.indexOf(".") ? "0" === s3 && "" === a2 || s3 === a2 || n3 && s3 === "-" + a2 ? e4 : t3 : r3 ? a2 === s3 || n3 + a2 === s3 ? e4 : t3 : i2 === s3 || i2 === n3 + s3 ? e4 : t3;
        }
      }
      return t3;
    }
    var s2;
  };
}, 737: (t2, e2, n2) => {
  var r2 = n2(670), o2 = n2(647), i2 = /^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/, s2 = /[\n\r\t]/g, a2 = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//, u2 = /:\d+$/, c2 = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i, l2 = /^[a-zA-Z]:/;
  function h2(t3) {
    return (t3 || "").toString().replace(i2, "");
  }
  var p2 = [["#", "hash"], ["?", "query"], function(t3, e3) {
    return g2(e3.protocol) ? t3.replace(/\\/g, "/") : t3;
  }, ["/", "pathname"], ["@", "auth", 1], [NaN, "host", void 0, 1, 1], [/:(\d*)$/, "port", void 0, 1], [NaN, "hostname", void 0, 1, 1]], f2 = { hash: 1, query: 1 };
  function d2(t3) {
    var e3, n3 = ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {}).location || {}, r3 = {}, o3 = typeof (t3 = t3 || n3);
    if ("blob:" === t3.protocol) r3 = new y2(unescape(t3.pathname), {});
    else if ("string" === o3) for (e3 in r3 = new y2(t3, {}), f2) delete r3[e3];
    else if ("object" === o3) {
      for (e3 in t3) e3 in f2 || (r3[e3] = t3[e3]);
      void 0 === r3.slashes && (r3.slashes = a2.test(t3.href));
    }
    return r3;
  }
  function g2(t3) {
    return "file:" === t3 || "ftp:" === t3 || "http:" === t3 || "https:" === t3 || "ws:" === t3 || "wss:" === t3;
  }
  function m2(t3, e3) {
    t3 = (t3 = h2(t3)).replace(s2, ""), e3 = e3 || {};
    var n3, r3 = c2.exec(t3), o3 = r3[1] ? r3[1].toLowerCase() : "", i3 = !!r3[2], a3 = !!r3[3], u3 = 0;
    return i3 ? a3 ? (n3 = r3[2] + r3[3] + r3[4], u3 = r3[2].length + r3[3].length) : (n3 = r3[2] + r3[4], u3 = r3[2].length) : a3 ? (n3 = r3[3] + r3[4], u3 = r3[3].length) : n3 = r3[4], "file:" === o3 ? u3 >= 2 && (n3 = n3.slice(2)) : g2(o3) ? n3 = r3[4] : o3 ? i3 && (n3 = n3.slice(2)) : u3 >= 2 && g2(e3.protocol) && (n3 = r3[4]), { protocol: o3, slashes: i3 || g2(o3), slashesCount: u3, rest: n3 };
  }
  function y2(t3, e3, n3) {
    if (t3 = (t3 = h2(t3)).replace(s2, ""), !(this instanceof y2)) return new y2(t3, e3, n3);
    var i3, a3, u3, c3, f3, v2, b2 = p2.slice(), w2 = typeof e3, x2 = this, N2 = 0;
    for ("object" !== w2 && "string" !== w2 && (n3 = e3, e3 = null), n3 && "function" != typeof n3 && (n3 = o2.parse), i3 = !(a3 = m2(t3 || "", e3 = d2(e3))).protocol && !a3.slashes, x2.slashes = a3.slashes || i3 && e3.slashes, x2.protocol = a3.protocol || e3.protocol || "", t3 = a3.rest, ("file:" === a3.protocol && (2 !== a3.slashesCount || l2.test(t3)) || !a3.slashes && (a3.protocol || a3.slashesCount < 2 || !g2(x2.protocol))) && (b2[3] = [/(.*)/, "pathname"]); N2 < b2.length; N2++) "function" != typeof (c3 = b2[N2]) ? (u3 = c3[0], v2 = c3[1], u3 != u3 ? x2[v2] = t3 : "string" == typeof u3 ? ~(f3 = "@" === u3 ? t3.lastIndexOf(u3) : t3.indexOf(u3)) && ("number" == typeof c3[2] ? (x2[v2] = t3.slice(0, f3), t3 = t3.slice(f3 + c3[2])) : (x2[v2] = t3.slice(f3), t3 = t3.slice(0, f3))) : (f3 = u3.exec(t3)) && (x2[v2] = f3[1], t3 = t3.slice(0, f3.index)), x2[v2] = x2[v2] || i3 && c3[3] && e3[v2] || "", c3[4] && (x2[v2] = x2[v2].toLowerCase())) : t3 = c3(t3, x2);
    n3 && (x2.query = n3(x2.query)), i3 && e3.slashes && "/" !== x2.pathname.charAt(0) && ("" !== x2.pathname || "" !== e3.pathname) && (x2.pathname = (function(t4, e4) {
      if ("" === t4) return e4;
      for (var n4 = (e4 || "/").split("/").slice(0, -1).concat(t4.split("/")), r3 = n4.length, o3 = n4[r3 - 1], i4 = false, s3 = 0; r3--; ) "." === n4[r3] ? n4.splice(r3, 1) : ".." === n4[r3] ? (n4.splice(r3, 1), s3++) : s3 && (0 === r3 && (i4 = true), n4.splice(r3, 1), s3--);
      return i4 && n4.unshift(""), "." !== o3 && ".." !== o3 || n4.push(""), n4.join("/");
    })(x2.pathname, e3.pathname)), "/" !== x2.pathname.charAt(0) && g2(x2.protocol) && (x2.pathname = "/" + x2.pathname), r2(x2.port, x2.protocol) || (x2.host = x2.hostname, x2.port = ""), x2.username = x2.password = "", x2.auth && (~(f3 = x2.auth.indexOf(":")) ? (x2.username = x2.auth.slice(0, f3), x2.username = encodeURIComponent(decodeURIComponent(x2.username)), x2.password = x2.auth.slice(f3 + 1), x2.password = encodeURIComponent(decodeURIComponent(x2.password))) : x2.username = encodeURIComponent(decodeURIComponent(x2.auth)), x2.auth = x2.password ? x2.username + ":" + x2.password : x2.username), x2.origin = "file:" !== x2.protocol && g2(x2.protocol) && x2.host ? x2.protocol + "//" + x2.host : "null", x2.href = x2.toString();
  }
  y2.prototype = { set: function(t3, e3, n3) {
    var i3 = this;
    switch (t3) {
      case "query":
        "string" == typeof e3 && e3.length && (e3 = (n3 || o2.parse)(e3)), i3[t3] = e3;
        break;
      case "port":
        i3[t3] = e3, r2(e3, i3.protocol) ? e3 && (i3.host = i3.hostname + ":" + e3) : (i3.host = i3.hostname, i3[t3] = "");
        break;
      case "hostname":
        i3[t3] = e3, i3.port && (e3 += ":" + i3.port), i3.host = e3;
        break;
      case "host":
        i3[t3] = e3, u2.test(e3) ? (e3 = e3.split(":"), i3.port = e3.pop(), i3.hostname = e3.join(":")) : (i3.hostname = e3, i3.port = "");
        break;
      case "protocol":
        i3.protocol = e3.toLowerCase(), i3.slashes = !n3;
        break;
      case "pathname":
      case "hash":
        if (e3) {
          var s3 = "pathname" === t3 ? "/" : "#";
          i3[t3] = e3.charAt(0) !== s3 ? s3 + e3 : e3;
        } else i3[t3] = e3;
        break;
      case "username":
      case "password":
        i3[t3] = encodeURIComponent(e3);
        break;
      case "auth":
        var a3 = e3.indexOf(":");
        ~a3 ? (i3.username = e3.slice(0, a3), i3.username = encodeURIComponent(decodeURIComponent(i3.username)), i3.password = e3.slice(a3 + 1), i3.password = encodeURIComponent(decodeURIComponent(i3.password))) : i3.username = encodeURIComponent(decodeURIComponent(e3));
    }
    for (var c3 = 0; c3 < p2.length; c3++) {
      var l3 = p2[c3];
      l3[4] && (i3[l3[1]] = i3[l3[1]].toLowerCase());
    }
    return i3.auth = i3.password ? i3.username + ":" + i3.password : i3.username, i3.origin = "file:" !== i3.protocol && g2(i3.protocol) && i3.host ? i3.protocol + "//" + i3.host : "null", i3.href = i3.toString(), i3;
  }, toString: function(t3) {
    t3 && "function" == typeof t3 || (t3 = o2.stringify);
    var e3, n3 = this, r3 = n3.host, i3 = n3.protocol;
    i3 && ":" !== i3.charAt(i3.length - 1) && (i3 += ":");
    var s3 = i3 + (n3.protocol && n3.slashes || g2(n3.protocol) ? "//" : "");
    return n3.username ? (s3 += n3.username, n3.password && (s3 += ":" + n3.password), s3 += "@") : n3.password ? (s3 += ":" + n3.password, s3 += "@") : "file:" !== n3.protocol && g2(n3.protocol) && !r3 && "/" !== n3.pathname && (s3 += "@"), (":" === r3[r3.length - 1] || u2.test(n3.hostname) && !n3.port) && (r3 += ":"), s3 += r3 + n3.pathname, (e3 = "object" == typeof n3.query ? t3(n3.query) : n3.query) && (s3 += "?" !== e3.charAt(0) ? "?" + e3 : e3), n3.hash && (s3 += n3.hash), s3;
  } }, y2.extractProtocol = m2, y2.location = d2, y2.trimLeft = h2, y2.qs = o2, t2.exports = y2;
}, 410: () => {
}, 388: () => {
}, 805: () => {
}, 345: () => {
}, 800: () => {
} }, e = {};
function n(r2) {
  var o2 = e[r2];
  if (void 0 !== o2) return o2.exports;
  var i2 = e[r2] = { id: r2, loaded: false, exports: {} };
  return t[r2].call(i2.exports, i2, i2.exports, n), i2.loaded = true, i2.exports;
}
n.n = (t2) => {
  var e2 = t2 && t2.__esModule ? () => t2.default : () => t2;
  return n.d(e2, { a: e2 }), e2;
}, n.d = (t2, e2) => {
  for (var r2 in e2) n.o(e2, r2) && !n.o(t2, r2) && Object.defineProperty(t2, r2, { enumerable: true, get: e2[r2] });
}, n.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), n.nmd = (t2) => (t2.paths = [], t2.children || (t2.children = []), t2);
var r = {};
n.d(r, { hT: () => C$1, O4: () => I, Kd: () => S, YK: () => $, UU: () => en, Gu: () => F, ky: () => oe, h4: () => ne, ch: () => re, hq: () => Xt, i5: () => ie });
var o = n(737), i = n.n(o);
function s(t2) {
  if (!a(t2)) throw new Error("Parameter was not an error");
}
function a(t2) {
  return !!t2 && "object" == typeof t2 && "[object Error]" === (e2 = t2, Object.prototype.toString.call(e2)) || t2 instanceof Error;
  var e2;
}
class u extends Error {
  constructor(t2, e2) {
    const n2 = [...arguments], { options: r2, shortMessage: o2 } = (function(t3) {
      let e3, n3 = "";
      if (0 === t3.length) e3 = {};
      else if (a(t3[0])) e3 = { cause: t3[0] }, n3 = t3.slice(1).join(" ") || "";
      else if (t3[0] && "object" == typeof t3[0]) e3 = Object.assign({}, t3[0]), n3 = t3.slice(1).join(" ") || "";
      else {
        if ("string" != typeof t3[0]) throw new Error("Invalid arguments passed to Layerr");
        e3 = {}, n3 = n3 = t3.join(" ") || "";
      }
      return { options: e3, shortMessage: n3 };
    })(n2);
    let i2 = o2;
    if (r2.cause && (i2 = `${i2}: ${r2.cause.message}`), super(i2), this.message = i2, r2.name && "string" == typeof r2.name ? this.name = r2.name : this.name = "Layerr", r2.cause && Object.defineProperty(this, "_cause", { value: r2.cause }), Object.defineProperty(this, "_info", { value: {} }), r2.info && "object" == typeof r2.info && Object.assign(this._info, r2.info), Error.captureStackTrace) {
      const t3 = r2.constructorOpt || this.constructor;
      Error.captureStackTrace(this, t3);
    }
  }
  static cause(t2) {
    return s(t2), t2._cause && a(t2._cause) ? t2._cause : null;
  }
  static fullStack(t2) {
    s(t2);
    const e2 = u.cause(t2);
    return e2 ? `${t2.stack}
caused by: ${u.fullStack(e2)}` : t2.stack ?? "";
  }
  static info(t2) {
    s(t2);
    const e2 = {}, n2 = u.cause(t2);
    return n2 && Object.assign(e2, u.info(n2)), t2._info && Object.assign(e2, t2._info), e2;
  }
  toString() {
    let t2 = this.name || this.constructor.name || this.constructor.prototype.name;
    return this.message && (t2 = `${t2}: ${this.message}`), t2;
  }
}
var c = n(47), l = n.n(c);
const h = "__PATH_SEPARATOR_POSIX__", p = "__PATH_SEPARATOR_WINDOWS__";
function f(t2) {
  try {
    const e2 = t2.replace(/\//g, h).replace(/\\\\/g, p);
    return encodeURIComponent(e2).split(p).join("\\\\").split(h).join("/");
  } catch (t3) {
    throw new u(t3, "Failed encoding path");
  }
}
function d(t2) {
  return t2.startsWith("/") ? t2 : "/" + t2;
}
function g(t2) {
  let e2 = t2;
  return "/" !== e2[0] && (e2 = "/" + e2), /^.+\/$/.test(e2) && (e2 = e2.substr(0, e2.length - 1)), e2;
}
function m(t2) {
  let e2 = new (i())(t2).pathname;
  return e2.length <= 0 && (e2 = "/"), g(e2);
}
function y() {
  for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++) e2[n2] = arguments[n2];
  return (function() {
    return (function(t3) {
      var e3 = [];
      if (0 === t3.length) return "";
      if ("string" != typeof t3[0]) throw new TypeError("Url must be a string. Received " + t3[0]);
      if (t3[0].match(/^[^/:]+:\/*$/) && t3.length > 1) {
        var n3 = t3.shift();
        t3[0] = n3 + t3[0];
      }
      t3[0].match(/^file:\/\/\//) ? t3[0] = t3[0].replace(/^([^/:]+):\/*/, "$1:///") : t3[0] = t3[0].replace(/^([^/:]+):\/*/, "$1://");
      for (var r2 = 0; r2 < t3.length; r2++) {
        var o2 = t3[r2];
        if ("string" != typeof o2) throw new TypeError("Url must be a string. Received " + o2);
        "" !== o2 && (r2 > 0 && (o2 = o2.replace(/^[\/]+/, "")), o2 = r2 < t3.length - 1 ? o2.replace(/[\/]+$/, "") : o2.replace(/[\/]+$/, "/"), e3.push(o2));
      }
      var i2 = e3.join("/"), s2 = (i2 = i2.replace(/\/(\?|&|#[^!])/g, "$1")).split("?");
      return s2.shift() + (s2.length > 0 ? "?" : "") + s2.join("&");
    })("object" == typeof arguments[0] ? arguments[0] : [].slice.call(arguments));
  })(e2.reduce(((t3, e3, n3) => ((0 === n3 || "/" !== e3 || "/" === e3 && "/" !== t3[t3.length - 1]) && t3.push(e3), t3)), []));
}
var v = n(542), b = n.n(v);
const w = "abcdef0123456789";
function x(t2, e2) {
  const n2 = t2.url.replace("//", ""), r2 = -1 == n2.indexOf("/") ? "/" : n2.slice(n2.indexOf("/")), o2 = t2.method ? t2.method.toUpperCase() : "GET", i2 = !!/(^|,)\s*auth\s*($|,)/.test(e2.qop) && "auth", s2 = `00000000${e2.nc}`.slice(-8), a2 = (function(t3, e3, n3, r3, o3, i3, s3) {
    const a3 = s3 || b()(`${e3}:${n3}:${r3}`);
    return t3 && "md5-sess" === t3.toLowerCase() ? b()(`${a3}:${o3}:${i3}`) : a3;
  })(e2.algorithm, e2.username, e2.realm, e2.password, e2.nonce, e2.cnonce, e2.ha1), u2 = b()(`${o2}:${r2}`), c2 = i2 ? b()(`${a2}:${e2.nonce}:${s2}:${e2.cnonce}:${i2}:${u2}`) : b()(`${a2}:${e2.nonce}:${u2}`), l2 = { username: e2.username, realm: e2.realm, nonce: e2.nonce, uri: r2, qop: i2, response: c2, nc: s2, cnonce: e2.cnonce, algorithm: e2.algorithm, opaque: e2.opaque }, h2 = [];
  for (const t3 in l2) l2[t3] && ("qop" === t3 || "nc" === t3 || "algorithm" === t3 ? h2.push(`${t3}=${l2[t3]}`) : h2.push(`${t3}="${l2[t3]}"`));
  return `Digest ${h2.join(", ")}`;
}
function N(t2) {
  return "digest" === (t2.headers && t2.headers.get("www-authenticate") || "").split(/\s/)[0].toLowerCase();
}
var A = n(101), P = n.n(A);
function O(t2) {
  return P().decode(t2);
}
function E$1(t2, e2) {
  var n2;
  return `Basic ${n2 = `${t2}:${e2}`, P().encode(n2)}`;
}
const T$1 = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : "undefined" != typeof window ? window : globalThis, j = T$1.fetch.bind(T$1), S = (T$1.Request), $ = T$1.Response;
let C$1 = (function(t2) {
  return t2.Auto = "auto", t2.Digest = "digest", t2.None = "none", t2.Password = "password", t2.Token = "token", t2;
})({}), I = (function(t2) {
  return t2.DataTypeNoLength = "data-type-no-length", t2.InvalidAuthType = "invalid-auth-type", t2.InvalidOutputFormat = "invalid-output-format", t2.LinkUnsupportedAuthType = "link-unsupported-auth", t2.InvalidUpdateRange = "invalid-update-range", t2.NotSupported = "not-supported", t2;
})({});
function k(t2, e2, n2, r2, o2) {
  switch (t2.authType) {
    case C$1.Auto:
      e2 && n2 && (t2.headers.Authorization = E$1(e2, n2));
      break;
    case C$1.Digest:
      t2.digest = /* @__PURE__ */ (function(t3, e3, n3) {
        return { username: t3, password: e3, ha1: n3, nc: 0, algorithm: "md5", hasDigestAuth: false };
      })(e2, n2, o2);
      break;
    case C$1.None:
      break;
    case C$1.Password:
      t2.headers.Authorization = E$1(e2, n2);
      break;
    case C$1.Token:
      t2.headers.Authorization = `${(i2 = r2).token_type} ${i2.access_token}`;
      break;
    default:
      throw new u({ info: { code: I.InvalidAuthType } }, `Invalid auth type: ${t2.authType}`);
  }
  var i2;
}
n(345), n(800);
const R = "@@HOTPATCHER", L = () => {
};
function _(t2) {
  return { original: t2, methods: [t2], final: false };
}
let M$1 = class M {
  constructor() {
    this._configuration = { registry: {}, getEmptyAction: "null" }, this.__type__ = R;
  }
  get configuration() {
    return this._configuration;
  }
  get getEmptyAction() {
    return this.configuration.getEmptyAction;
  }
  set getEmptyAction(t2) {
    this.configuration.getEmptyAction = t2;
  }
  control(t2) {
    let e2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    if (!t2 || t2.__type__ !== R) throw new Error("Failed taking control of target HotPatcher instance: Invalid type or object");
    return Object.keys(t2.configuration.registry).forEach(((n2) => {
      this.configuration.registry.hasOwnProperty(n2) ? e2 && (this.configuration.registry[n2] = Object.assign({}, t2.configuration.registry[n2])) : this.configuration.registry[n2] = Object.assign({}, t2.configuration.registry[n2]);
    })), t2._configuration = this.configuration, this;
  }
  execute(t2) {
    const e2 = this.get(t2) || L;
    for (var n2 = arguments.length, r2 = new Array(n2 > 1 ? n2 - 1 : 0), o2 = 1; o2 < n2; o2++) r2[o2 - 1] = arguments[o2];
    return e2(...r2);
  }
  get(t2) {
    const e2 = this.configuration.registry[t2];
    if (!e2) switch (this.getEmptyAction) {
      case "null":
        return null;
      case "throw":
        throw new Error(`Failed handling method request: No method provided for override: ${t2}`);
      default:
        throw new Error(`Failed handling request which resulted in an empty method: Invalid empty-action specified: ${this.getEmptyAction}`);
    }
    return (function() {
      for (var t3 = arguments.length, e3 = new Array(t3), n2 = 0; n2 < t3; n2++) e3[n2] = arguments[n2];
      if (0 === e3.length) throw new Error("Failed creating sequence: No functions provided");
      return function() {
        for (var t4 = arguments.length, n3 = new Array(t4), r2 = 0; r2 < t4; r2++) n3[r2] = arguments[r2];
        let o2 = n3;
        const i2 = this;
        for (; e3.length > 0; ) o2 = [e3.shift().apply(i2, o2)];
        return o2[0];
      };
    })(...e2.methods);
  }
  isPatched(t2) {
    return !!this.configuration.registry[t2];
  }
  patch(t2, e2) {
    let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
    const { chain: r2 = false } = n2;
    if (this.configuration.registry[t2] && this.configuration.registry[t2].final) throw new Error(`Failed patching '${t2}': Method marked as being final`);
    if ("function" != typeof e2) throw new Error(`Failed patching '${t2}': Provided method is not a function`);
    if (r2) this.configuration.registry[t2] ? this.configuration.registry[t2].methods.push(e2) : this.configuration.registry[t2] = _(e2);
    else if (this.isPatched(t2)) {
      const { original: n3 } = this.configuration.registry[t2];
      this.configuration.registry[t2] = Object.assign(_(e2), { original: n3 });
    } else this.configuration.registry[t2] = _(e2);
    return this;
  }
  patchInline(t2, e2) {
    this.isPatched(t2) || this.patch(t2, e2);
    for (var n2 = arguments.length, r2 = new Array(n2 > 2 ? n2 - 2 : 0), o2 = 2; o2 < n2; o2++) r2[o2 - 2] = arguments[o2];
    return this.execute(t2, ...r2);
  }
  plugin(t2) {
    for (var e2 = arguments.length, n2 = new Array(e2 > 1 ? e2 - 1 : 0), r2 = 1; r2 < e2; r2++) n2[r2 - 1] = arguments[r2];
    return n2.forEach(((e3) => {
      this.patch(t2, e3, { chain: true });
    })), this;
  }
  restore(t2) {
    if (!this.isPatched(t2)) throw new Error(`Failed restoring method: No method present for key: ${t2}`);
    if ("function" != typeof this.configuration.registry[t2].original) throw new Error(`Failed restoring method: Original method not found or of invalid type for key: ${t2}`);
    return this.configuration.registry[t2].methods = [this.configuration.registry[t2].original], this;
  }
  setFinal(t2) {
    if (!this.configuration.registry.hasOwnProperty(t2)) throw new Error(`Failed marking '${t2}' as final: No method found for key`);
    return this.configuration.registry[t2].final = true, this;
  }
};
let U = null;
function F() {
  return U || (U = new M$1()), U;
}
function D(t2) {
  return (function(t3) {
    if ("object" != typeof t3 || null === t3 || "[object Object]" != Object.prototype.toString.call(t3)) return false;
    if (null === Object.getPrototypeOf(t3)) return true;
    let e2 = t3;
    for (; null !== Object.getPrototypeOf(e2); ) e2 = Object.getPrototypeOf(e2);
    return Object.getPrototypeOf(t3) === e2;
  })(t2) ? Object.assign({}, t2) : Object.setPrototypeOf(Object.assign({}, t2), Object.getPrototypeOf(t2));
}
function B() {
  for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++) e2[n2] = arguments[n2];
  let r2 = null, o2 = [...e2];
  for (; o2.length > 0; ) {
    const t3 = o2.shift();
    r2 = r2 ? V(r2, t3) : D(t3);
  }
  return r2;
}
function V(t2, e2) {
  const n2 = D(t2);
  return Object.keys(e2).forEach(((t3) => {
    n2.hasOwnProperty(t3) ? Array.isArray(e2[t3]) ? n2[t3] = Array.isArray(n2[t3]) ? [...n2[t3], ...e2[t3]] : [...e2[t3]] : "object" == typeof e2[t3] && e2[t3] ? n2[t3] = "object" == typeof n2[t3] && n2[t3] ? V(n2[t3], e2[t3]) : D(e2[t3]) : n2[t3] = e2[t3] : n2[t3] = e2[t3];
  })), n2;
}
function W(t2) {
  const e2 = {};
  for (const n2 of t2.keys()) e2[n2] = t2.get(n2);
  return e2;
}
function z() {
  for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++) e2[n2] = arguments[n2];
  if (0 === e2.length) return {};
  const r2 = {};
  return e2.reduce(((t3, e3) => (Object.keys(e3).forEach(((n3) => {
    const o2 = n3.toLowerCase();
    r2.hasOwnProperty(o2) ? t3[r2[o2]] = e3[n3] : (r2[o2] = n3, t3[n3] = e3[n3]);
  })), t3)), {});
}
n(805);
const G = "function" == typeof ArrayBuffer, { toString: q } = Object.prototype;
function H$1(t2) {
  return G && (t2 instanceof ArrayBuffer || "[object ArrayBuffer]" === q.call(t2));
}
function X(t2) {
  return null != t2 && null != t2.constructor && "function" == typeof t2.constructor.isBuffer && t2.constructor.isBuffer(t2);
}
function Z(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
}
function Y(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const K = Z((function(t2) {
  const e2 = t2._digest;
  return delete t2._digest, e2.hasDigestAuth && (t2 = B(t2, { headers: { Authorization: x(t2, e2) } })), Y(et(t2), (function(n2) {
    let r2 = false;
    return o2 = function(t3) {
      return r2 ? t3 : n2;
    }, (i2 = (function() {
      if (401 == n2.status) return e2.hasDigestAuth = (function(t3, e3) {
        if (!N(t3)) return false;
        const n3 = /([a-z0-9_-]+)=(?:"([^"]+)"|([a-z0-9_-]+))/gi;
        for (; ; ) {
          const r3 = t3.headers && t3.headers.get("www-authenticate") || "", o3 = n3.exec(r3);
          if (!o3) break;
          e3[o3[1]] = o3[2] || o3[3];
        }
        return e3.nc += 1, e3.cnonce = (function() {
          let t4 = "";
          for (let e4 = 0; e4 < 32; ++e4) t4 = `${t4}${w[Math.floor(16 * Math.random())]}`;
          return t4;
        })(), true;
      })(n2, e2), (function() {
        if (e2.hasDigestAuth) return Y(et(t2 = B(t2, { headers: { Authorization: x(t2, e2) } })), (function(t3) {
          return 401 == t3.status ? e2.hasDigestAuth = false : e2.nc++, r2 = true, t3;
        }));
      })();
      e2.nc++;
    })()) && i2.then ? i2.then(o2) : o2(i2);
    var o2, i2;
  }));
})), J = Z((function(t2, e2) {
  return Y(et(t2), (function(n2) {
    return n2.ok ? (e2.authType = C$1.Password, n2) : 401 == n2.status && N(n2) ? (e2.authType = C$1.Digest, k(e2, e2.username, e2.password, void 0, void 0), t2._digest = e2.digest, K(t2)) : n2;
  }));
})), Q$1 = Z((function(t2, e2) {
  return e2.authType === C$1.Auto ? J(t2, e2) : t2._digest ? K(t2) : et(t2);
}));
function tt(t2, e2, n2) {
  const r2 = D(t2);
  return r2.headers = z(e2.headers, r2.headers || {}, n2.headers || {}), void 0 !== n2.data && (r2.data = n2.data), n2.signal && (r2.signal = n2.signal), e2.httpAgent && (r2.httpAgent = e2.httpAgent), e2.httpsAgent && (r2.httpsAgent = e2.httpsAgent), e2.digest && (r2._digest = e2.digest), "boolean" == typeof e2.withCredentials && (r2.withCredentials = e2.withCredentials), r2;
}
function et(t2) {
  const e2 = F();
  return e2.patchInline("request", ((t3) => e2.patchInline("fetch", j, t3.url, (function(t4) {
    let e3 = {};
    const n2 = { method: t4.method };
    if (t4.headers && (e3 = z(e3, t4.headers)), void 0 !== t4.data) {
      const [r2, o2] = (function(t5) {
        if ("string" == typeof t5) return [t5, {}];
        if (X(t5)) return [t5, {}];
        if (H$1(t5)) return [t5, {}];
        if (t5 && "object" == typeof t5) return [JSON.stringify(t5), { "content-type": "application/json" }];
        throw new Error("Unable to convert request body: Unexpected body type: " + typeof t5);
      })(t4.data);
      n2.body = r2, e3 = z(e3, o2);
    }
    return t4.signal && (n2.signal = t4.signal), t4.withCredentials && (n2.credentials = "include"), n2.headers = e3, n2;
  })(t3))), t2);
}
var nt = n(285);
const rt = (t2) => {
  if ("string" != typeof t2) throw new TypeError("invalid pattern");
  if (t2.length > 65536) throw new TypeError("pattern is too long");
}, ot = { "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true], "[:alpha:]": ["\\p{L}\\p{Nl}", true], "[:ascii:]": ["\\x00-\\x7f", false], "[:blank:]": ["\\p{Zs}\\t", true], "[:cntrl:]": ["\\p{Cc}", true], "[:digit:]": ["\\p{Nd}", true], "[:graph:]": ["\\p{Z}\\p{C}", true, true], "[:lower:]": ["\\p{Ll}", true], "[:print:]": ["\\p{C}", true], "[:punct:]": ["\\p{P}", true], "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true], "[:upper:]": ["\\p{Lu}", true], "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true], "[:xdigit:]": ["A-Fa-f0-9", false] }, it = (t2) => t2.replace(/[[\]\\-]/g, "\\$&"), st = (t2) => t2.join(""), at = (t2, e2) => {
  const n2 = e2;
  if ("[" !== t2.charAt(n2)) throw new Error("not in a brace expression");
  const r2 = [], o2 = [];
  let i2 = n2 + 1, s2 = false, a2 = false, u2 = false, c2 = false, l2 = n2, h2 = "";
  t: for (; i2 < t2.length; ) {
    const e3 = t2.charAt(i2);
    if ("!" !== e3 && "^" !== e3 || i2 !== n2 + 1) {
      if ("]" === e3 && s2 && !u2) {
        l2 = i2 + 1;
        break;
      }
      if (s2 = true, "\\" !== e3 || u2) {
        if ("[" === e3 && !u2) {
          for (const [e4, [s3, u3, c3]] of Object.entries(ot)) if (t2.startsWith(e4, i2)) {
            if (h2) return ["$.", false, t2.length - n2, true];
            i2 += e4.length, c3 ? o2.push(s3) : r2.push(s3), a2 = a2 || u3;
            continue t;
          }
        }
        u2 = false, h2 ? (e3 > h2 ? r2.push(it(h2) + "-" + it(e3)) : e3 === h2 && r2.push(it(e3)), h2 = "", i2++) : t2.startsWith("-]", i2 + 1) ? (r2.push(it(e3 + "-")), i2 += 2) : t2.startsWith("-", i2 + 1) ? (h2 = e3, i2 += 2) : (r2.push(it(e3)), i2++);
      } else u2 = true, i2++;
    } else c2 = true, i2++;
  }
  if (l2 < i2) return ["", false, 0, false];
  if (!r2.length && !o2.length) return ["$.", false, t2.length - n2, true];
  if (0 === o2.length && 1 === r2.length && /^\\?.$/.test(r2[0]) && !c2) {
    return [(p2 = 2 === r2[0].length ? r2[0].slice(-1) : r2[0], p2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")), false, l2 - n2, false];
  }
  var p2;
  const f2 = "[" + (c2 ? "^" : "") + st(r2) + "]", d2 = "[" + (c2 ? "" : "^") + st(o2) + "]";
  return [r2.length && o2.length ? "(" + f2 + "|" + d2 + ")" : r2.length ? f2 : d2, a2, l2 - n2, true];
}, ut = function(t2) {
  let { windowsPathsNoEscape: e2 = false } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return e2 ? t2.replace(/\[([^\/\\])\]/g, "$1") : t2.replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2").replace(/\\([^\/])/g, "$1");
}, ct = /* @__PURE__ */ new Set(["!", "?", "+", "*", "@"]), lt = (t2) => ct.has(t2), ht = "(?!\\.)", pt = /* @__PURE__ */ new Set(["[", "."]), ft = /* @__PURE__ */ new Set(["..", "."]), dt = new Set("().*{}+?[]^$\\!"), gt = "[^/]", mt = gt + "*?", yt = gt + "+?";
class vt {
  type;
  #t;
  #e;
  #n = false;
  #r = [];
  #o;
  #i;
  #s;
  #a = false;
  #u;
  #c;
  #l = false;
  constructor(t2, e2) {
    let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
    this.type = t2, t2 && (this.#e = true), this.#o = e2, this.#t = this.#o ? this.#o.#t : this, this.#u = this.#t === this ? n2 : this.#t.#u, this.#s = this.#t === this ? [] : this.#t.#s, "!" !== t2 || this.#t.#a || this.#s.push(this), this.#i = this.#o ? this.#o.#r.length : 0;
  }
  get hasMagic() {
    if (void 0 !== this.#e) return this.#e;
    for (const t2 of this.#r) if ("string" != typeof t2 && (t2.type || t2.hasMagic)) return this.#e = true;
    return this.#e;
  }
  toString() {
    return void 0 !== this.#c ? this.#c : this.type ? this.#c = this.type + "(" + this.#r.map(((t2) => String(t2))).join("|") + ")" : this.#c = this.#r.map(((t2) => String(t2))).join("");
  }
  #h() {
    if (this !== this.#t) throw new Error("should only call on root");
    if (this.#a) return this;
    let t2;
    for (this.toString(), this.#a = true; t2 = this.#s.pop(); ) {
      if ("!" !== t2.type) continue;
      let e2 = t2, n2 = e2.#o;
      for (; n2; ) {
        for (let r2 = e2.#i + 1; !n2.type && r2 < n2.#r.length; r2++) for (const e3 of t2.#r) {
          if ("string" == typeof e3) throw new Error("string part in extglob AST??");
          e3.copyIn(n2.#r[r2]);
        }
        e2 = n2, n2 = e2.#o;
      }
    }
    return this;
  }
  push() {
    for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++) e2[n2] = arguments[n2];
    for (const t3 of e2) if ("" !== t3) {
      if ("string" != typeof t3 && !(t3 instanceof vt && t3.#o === this)) throw new Error("invalid part: " + t3);
      this.#r.push(t3);
    }
  }
  toJSON() {
    const t2 = null === this.type ? this.#r.slice().map(((t3) => "string" == typeof t3 ? t3 : t3.toJSON())) : [this.type, ...this.#r.map(((t3) => t3.toJSON()))];
    return this.isStart() && !this.type && t2.unshift([]), this.isEnd() && (this === this.#t || this.#t.#a && "!" === this.#o?.type) && t2.push({}), t2;
  }
  isStart() {
    if (this.#t === this) return true;
    if (!this.#o?.isStart()) return false;
    if (0 === this.#i) return true;
    const t2 = this.#o;
    for (let e2 = 0; e2 < this.#i; e2++) {
      const n2 = t2.#r[e2];
      if (!(n2 instanceof vt && "!" === n2.type)) return false;
    }
    return true;
  }
  isEnd() {
    if (this.#t === this) return true;
    if ("!" === this.#o?.type) return true;
    if (!this.#o?.isEnd()) return false;
    if (!this.type) return this.#o?.isEnd();
    const t2 = this.#o ? this.#o.#r.length : 0;
    return this.#i === t2 - 1;
  }
  copyIn(t2) {
    "string" == typeof t2 ? this.push(t2) : this.push(t2.clone(this));
  }
  clone(t2) {
    const e2 = new vt(this.type, t2);
    for (const t3 of this.#r) e2.copyIn(t3);
    return e2;
  }
  static #p(t2, e2, n2, r2) {
    let o2 = false, i2 = false, s2 = -1, a2 = false;
    if (null === e2.type) {
      let u3 = n2, c3 = "";
      for (; u3 < t2.length; ) {
        const n3 = t2.charAt(u3++);
        if (o2 || "\\" === n3) o2 = !o2, c3 += n3;
        else if (i2) u3 === s2 + 1 ? "^" !== n3 && "!" !== n3 || (a2 = true) : "]" !== n3 || u3 === s2 + 2 && a2 || (i2 = false), c3 += n3;
        else if ("[" !== n3) if (r2.noext || !lt(n3) || "(" !== t2.charAt(u3)) c3 += n3;
        else {
          e2.push(c3), c3 = "";
          const o3 = new vt(n3, e2);
          u3 = vt.#p(t2, o3, u3, r2), e2.push(o3);
        }
        else i2 = true, s2 = u3, a2 = false, c3 += n3;
      }
      return e2.push(c3), u3;
    }
    let u2 = n2 + 1, c2 = new vt(null, e2);
    const l2 = [];
    let h2 = "";
    for (; u2 < t2.length; ) {
      const n3 = t2.charAt(u2++);
      if (o2 || "\\" === n3) o2 = !o2, h2 += n3;
      else if (i2) u2 === s2 + 1 ? "^" !== n3 && "!" !== n3 || (a2 = true) : "]" !== n3 || u2 === s2 + 2 && a2 || (i2 = false), h2 += n3;
      else if ("[" !== n3) if (lt(n3) && "(" === t2.charAt(u2)) {
        c2.push(h2), h2 = "";
        const e3 = new vt(n3, c2);
        c2.push(e3), u2 = vt.#p(t2, e3, u2, r2);
      } else if ("|" !== n3) {
        if (")" === n3) return "" === h2 && 0 === e2.#r.length && (e2.#l = true), c2.push(h2), h2 = "", e2.push(...l2, c2), u2;
        h2 += n3;
      } else c2.push(h2), h2 = "", l2.push(c2), c2 = new vt(null, e2);
      else i2 = true, s2 = u2, a2 = false, h2 += n3;
    }
    return e2.type = null, e2.#e = void 0, e2.#r = [t2.substring(n2 - 1)], u2;
  }
  static fromGlob(t2) {
    let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    const n2 = new vt(null, void 0, e2);
    return vt.#p(t2, n2, 0, e2), n2;
  }
  toMMPattern() {
    if (this !== this.#t) return this.#t.toMMPattern();
    const t2 = this.toString(), [e2, n2, r2, o2] = this.toRegExpSource();
    if (!(r2 || this.#e || this.#u.nocase && !this.#u.nocaseMagicOnly && t2.toUpperCase() !== t2.toLowerCase())) return n2;
    const i2 = (this.#u.nocase ? "i" : "") + (o2 ? "u" : "");
    return Object.assign(new RegExp(`^${e2}$`, i2), { _src: e2, _glob: t2 });
  }
  get options() {
    return this.#u;
  }
  toRegExpSource(t2) {
    const e2 = t2 ?? !!this.#u.dot;
    if (this.#t === this && this.#h(), !this.type) {
      const n3 = this.isStart() && this.isEnd(), r3 = this.#r.map(((e3) => {
        const [r4, o4, i4, s3] = "string" == typeof e3 ? vt.#f(e3, this.#e, n3) : e3.toRegExpSource(t2);
        return this.#e = this.#e || i4, this.#n = this.#n || s3, r4;
      })).join("");
      let o3 = "";
      if (this.isStart() && "string" == typeof this.#r[0] && (1 !== this.#r.length || !ft.has(this.#r[0]))) {
        const n4 = pt, i4 = e2 && n4.has(r3.charAt(0)) || r3.startsWith("\\.") && n4.has(r3.charAt(2)) || r3.startsWith("\\.\\.") && n4.has(r3.charAt(4)), s3 = !e2 && !t2 && n4.has(r3.charAt(0));
        o3 = i4 ? "(?!(?:^|/)\\.\\.?(?:$|/))" : s3 ? ht : "";
      }
      let i3 = "";
      return this.isEnd() && this.#t.#a && "!" === this.#o?.type && (i3 = "(?:$|\\/)"), [o3 + r3 + i3, ut(r3), this.#e = !!this.#e, this.#n];
    }
    const n2 = "*" === this.type || "+" === this.type, r2 = "!" === this.type ? "(?:(?!(?:" : "(?:";
    let o2 = this.#d(e2);
    if (this.isStart() && this.isEnd() && !o2 && "!" !== this.type) {
      const t3 = this.toString();
      return this.#r = [t3], this.type = null, this.#e = void 0, [t3, ut(this.toString()), false, false];
    }
    let i2 = !n2 || t2 || e2 ? "" : this.#d(true);
    i2 === o2 && (i2 = ""), i2 && (o2 = `(?:${o2})(?:${i2})*?`);
    let s2 = "";
    return s2 = "!" === this.type && this.#l ? (this.isStart() && !e2 ? ht : "") + yt : r2 + o2 + ("!" === this.type ? "))" + (!this.isStart() || e2 || t2 ? "" : ht) + mt + ")" : "@" === this.type ? ")" : "?" === this.type ? ")?" : "+" === this.type && i2 ? ")" : "*" === this.type && i2 ? ")?" : `)${this.type}`), [s2, ut(o2), this.#e = !!this.#e, this.#n];
  }
  #d(t2) {
    return this.#r.map(((e2) => {
      if ("string" == typeof e2) throw new Error("string type in extglob ast??");
      const [n2, r2, o2, i2] = e2.toRegExpSource(t2);
      return this.#n = this.#n || i2, n2;
    })).filter(((t3) => !(this.isStart() && this.isEnd() && !t3))).join("|");
  }
  static #f(t2, e2) {
    let n2 = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r2 = false, o2 = "", i2 = false;
    for (let s2 = 0; s2 < t2.length; s2++) {
      const a2 = t2.charAt(s2);
      if (r2) r2 = false, o2 += (dt.has(a2) ? "\\" : "") + a2;
      else if ("\\" !== a2) {
        if ("[" === a2) {
          const [n3, r3, a3, u2] = at(t2, s2);
          if (a3) {
            o2 += n3, i2 = i2 || r3, s2 += a3 - 1, e2 = e2 || u2;
            continue;
          }
        }
        "*" !== a2 ? "?" !== a2 ? o2 += a2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") : (o2 += gt, e2 = true) : (o2 += n2 && "*" === t2 ? yt : mt, e2 = true);
      } else s2 === t2.length - 1 ? o2 += "\\\\" : r2 = true;
    }
    return [o2, ut(t2), !!e2, i2];
  }
}
const bt = function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  return rt(e2), !(!n2.nocomment && "#" === e2.charAt(0)) && new Gt(e2, n2).match(t2);
}, wt = /^\*+([^+@!?\*\[\(]*)$/, xt = (t2) => (e2) => !e2.startsWith(".") && e2.endsWith(t2), Nt = (t2) => (e2) => e2.endsWith(t2), At = (t2) => (t2 = t2.toLowerCase(), (e2) => !e2.startsWith(".") && e2.toLowerCase().endsWith(t2)), Pt = (t2) => (t2 = t2.toLowerCase(), (e2) => e2.toLowerCase().endsWith(t2)), Ot = /^\*+\.\*+$/, Et = (t2) => !t2.startsWith(".") && t2.includes("."), Tt = (t2) => "." !== t2 && ".." !== t2 && t2.includes("."), jt = /^\.\*+$/, St = (t2) => "." !== t2 && ".." !== t2 && t2.startsWith("."), $t = /^\*+$/, Ct = (t2) => 0 !== t2.length && !t2.startsWith("."), It = (t2) => 0 !== t2.length && "." !== t2 && ".." !== t2, kt = /^\?+([^+@!?\*\[\(]*)?$/, Rt = (t2) => {
  let [e2, n2 = ""] = t2;
  const r2 = Ut([e2]);
  return n2 ? (n2 = n2.toLowerCase(), (t3) => r2(t3) && t3.toLowerCase().endsWith(n2)) : r2;
}, Lt = (t2) => {
  let [e2, n2 = ""] = t2;
  const r2 = Ft([e2]);
  return n2 ? (n2 = n2.toLowerCase(), (t3) => r2(t3) && t3.toLowerCase().endsWith(n2)) : r2;
}, _t = (t2) => {
  let [e2, n2 = ""] = t2;
  const r2 = Ft([e2]);
  return n2 ? (t3) => r2(t3) && t3.endsWith(n2) : r2;
}, Mt = (t2) => {
  let [e2, n2 = ""] = t2;
  const r2 = Ut([e2]);
  return n2 ? (t3) => r2(t3) && t3.endsWith(n2) : r2;
}, Ut = (t2) => {
  let [e2] = t2;
  const n2 = e2.length;
  return (t3) => t3.length === n2 && !t3.startsWith(".");
}, Ft = (t2) => {
  let [e2] = t2;
  const n2 = e2.length;
  return (t3) => t3.length === n2 && "." !== t3 && ".." !== t3;
}, Dt = "object" == typeof process && process ? "object" == typeof define_process_env_default && define_process_env_default && define_process_env_default.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
bt.sep = "win32" === Dt ? "\\" : "/";
const Bt = Symbol("globstar **");
bt.GLOBSTAR = Bt, bt.filter = function(t2) {
  let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return (n2) => bt(n2, t2, e2);
};
const Vt = function(t2) {
  let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return Object.assign({}, t2, e2);
};
bt.defaults = (t2) => {
  if (!t2 || "object" != typeof t2 || !Object.keys(t2).length) return bt;
  const e2 = bt;
  return Object.assign((function(n2, r2) {
    return e2(n2, r2, Vt(t2, arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}));
  }), { Minimatch: class extends e2.Minimatch {
    constructor(e3) {
      super(e3, Vt(t2, arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}));
    }
    static defaults(n2) {
      return e2.defaults(Vt(t2, n2)).Minimatch;
    }
  }, AST: class extends e2.AST {
    constructor(e3, n2) {
      super(e3, n2, Vt(t2, arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}));
    }
    static fromGlob(n2) {
      let r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      return e2.AST.fromGlob(n2, Vt(t2, r2));
    }
  }, unescape: function(n2) {
    let r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return e2.unescape(n2, Vt(t2, r2));
  }, escape: function(n2) {
    let r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return e2.escape(n2, Vt(t2, r2));
  }, filter: function(n2) {
    let r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return e2.filter(n2, Vt(t2, r2));
  }, defaults: (n2) => e2.defaults(Vt(t2, n2)), makeRe: function(n2) {
    let r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return e2.makeRe(n2, Vt(t2, r2));
  }, braceExpand: function(n2) {
    let r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return e2.braceExpand(n2, Vt(t2, r2));
  }, match: function(n2, r2) {
    let o2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
    return e2.match(n2, r2, Vt(t2, o2));
  }, sep: e2.sep, GLOBSTAR: Bt });
};
const Wt = function(t2) {
  let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return rt(t2), e2.nobrace || !/\{(?:(?!\{).)*\}/.test(t2) ? [t2] : nt(t2);
};
bt.braceExpand = Wt, bt.makeRe = function(t2) {
  return new Gt(t2, arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).makeRe();
}, bt.match = function(t2, e2) {
  const n2 = new Gt(e2, arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {});
  return t2 = t2.filter(((t3) => n2.match(t3))), n2.options.nonull && !t2.length && t2.push(e2), t2;
};
const zt = /[?*]|[+@!]\(.*?\)|\[|\]/;
class Gt {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  regexp;
  constructor(t2) {
    let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    rt(t2), e2 = e2 || {}, this.options = e2, this.pattern = t2, this.platform = e2.platform || Dt, this.isWindows = "win32" === this.platform, this.windowsPathsNoEscape = !!e2.windowsPathsNoEscape || false === e2.allowWindowsEscape, this.windowsPathsNoEscape && (this.pattern = this.pattern.replace(/\\/g, "/")), this.preserveMultipleSlashes = !!e2.preserveMultipleSlashes, this.regexp = null, this.negate = false, this.nonegate = !!e2.nonegate, this.comment = false, this.empty = false, this.partial = !!e2.partial, this.nocase = !!this.options.nocase, this.windowsNoMagicRoot = void 0 !== e2.windowsNoMagicRoot ? e2.windowsNoMagicRoot : !(!this.isWindows || !this.nocase), this.globSet = [], this.globParts = [], this.set = [], this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1) return true;
    for (const t2 of this.set) for (const e2 of t2) if ("string" != typeof e2) return true;
    return false;
  }
  debug() {
  }
  make() {
    const t2 = this.pattern, e2 = this.options;
    if (!e2.nocomment && "#" === t2.charAt(0)) return void (this.comment = true);
    if (!t2) return void (this.empty = true);
    this.parseNegate(), this.globSet = [...new Set(this.braceExpand())], e2.debug && (this.debug = function() {
      return console.error(...arguments);
    }), this.debug(this.pattern, this.globSet);
    const n2 = this.globSet.map(((t3) => this.slashSplit(t3)));
    this.globParts = this.preprocess(n2), this.debug(this.pattern, this.globParts);
    let r2 = this.globParts.map(((t3, e3, n3) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        const e4 = !("" !== t3[0] || "" !== t3[1] || "?" !== t3[2] && zt.test(t3[2]) || zt.test(t3[3])), n4 = /^[a-z]:/i.test(t3[0]);
        if (e4) return [...t3.slice(0, 4), ...t3.slice(4).map(((t4) => this.parse(t4)))];
        if (n4) return [t3[0], ...t3.slice(1).map(((t4) => this.parse(t4)))];
      }
      return t3.map(((t4) => this.parse(t4)));
    }));
    if (this.debug(this.pattern, r2), this.set = r2.filter(((t3) => -1 === t3.indexOf(false))), this.isWindows) for (let t3 = 0; t3 < this.set.length; t3++) {
      const e3 = this.set[t3];
      "" === e3[0] && "" === e3[1] && "?" === this.globParts[t3][2] && "string" == typeof e3[3] && /^[a-z]:$/i.test(e3[3]) && (e3[2] = "?");
    }
    this.debug(this.pattern, this.set);
  }
  preprocess(t2) {
    if (this.options.noglobstar) for (let e3 = 0; e3 < t2.length; e3++) for (let n2 = 0; n2 < t2[e3].length; n2++) "**" === t2[e3][n2] && (t2[e3][n2] = "*");
    const { optimizationLevel: e2 = 1 } = this.options;
    return e2 >= 2 ? (t2 = this.firstPhasePreProcess(t2), t2 = this.secondPhasePreProcess(t2)) : t2 = e2 >= 1 ? this.levelOneOptimize(t2) : this.adjascentGlobstarOptimize(t2), t2;
  }
  adjascentGlobstarOptimize(t2) {
    return t2.map(((t3) => {
      let e2 = -1;
      for (; -1 !== (e2 = t3.indexOf("**", e2 + 1)); ) {
        let n2 = e2;
        for (; "**" === t3[n2 + 1]; ) n2++;
        n2 !== e2 && t3.splice(e2, n2 - e2);
      }
      return t3;
    }));
  }
  levelOneOptimize(t2) {
    return t2.map(((t3) => 0 === (t3 = t3.reduce(((t4, e2) => {
      const n2 = t4[t4.length - 1];
      return "**" === e2 && "**" === n2 ? t4 : ".." === e2 && n2 && ".." !== n2 && "." !== n2 && "**" !== n2 ? (t4.pop(), t4) : (t4.push(e2), t4);
    }), [])).length ? [""] : t3));
  }
  levelTwoFileOptimize(t2) {
    Array.isArray(t2) || (t2 = this.slashSplit(t2));
    let e2 = false;
    do {
      if (e2 = false, !this.preserveMultipleSlashes) {
        for (let n3 = 1; n3 < t2.length - 1; n3++) {
          const r2 = t2[n3];
          1 === n3 && "" === r2 && "" === t2[0] || "." !== r2 && "" !== r2 || (e2 = true, t2.splice(n3, 1), n3--);
        }
        "." !== t2[0] || 2 !== t2.length || "." !== t2[1] && "" !== t2[1] || (e2 = true, t2.pop());
      }
      let n2 = 0;
      for (; -1 !== (n2 = t2.indexOf("..", n2 + 1)); ) {
        const r2 = t2[n2 - 1];
        r2 && "." !== r2 && ".." !== r2 && "**" !== r2 && (e2 = true, t2.splice(n2 - 1, 2), n2 -= 2);
      }
    } while (e2);
    return 0 === t2.length ? [""] : t2;
  }
  firstPhasePreProcess(t2) {
    let e2 = false;
    do {
      e2 = false;
      for (let n2 of t2) {
        let r2 = -1;
        for (; -1 !== (r2 = n2.indexOf("**", r2 + 1)); ) {
          let o3 = r2;
          for (; "**" === n2[o3 + 1]; ) o3++;
          o3 > r2 && n2.splice(r2 + 1, o3 - r2);
          let i2 = n2[r2 + 1];
          const s2 = n2[r2 + 2], a2 = n2[r2 + 3];
          if (".." !== i2) continue;
          if (!s2 || "." === s2 || ".." === s2 || !a2 || "." === a2 || ".." === a2) continue;
          e2 = true, n2.splice(r2, 1);
          const u2 = n2.slice(0);
          u2[r2] = "**", t2.push(u2), r2--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let t3 = 1; t3 < n2.length - 1; t3++) {
            const r3 = n2[t3];
            1 === t3 && "" === r3 && "" === n2[0] || "." !== r3 && "" !== r3 || (e2 = true, n2.splice(t3, 1), t3--);
          }
          "." !== n2[0] || 2 !== n2.length || "." !== n2[1] && "" !== n2[1] || (e2 = true, n2.pop());
        }
        let o2 = 0;
        for (; -1 !== (o2 = n2.indexOf("..", o2 + 1)); ) {
          const t3 = n2[o2 - 1];
          if (t3 && "." !== t3 && ".." !== t3 && "**" !== t3) {
            e2 = true;
            const t4 = 1 === o2 && "**" === n2[o2 + 1] ? ["."] : [];
            n2.splice(o2 - 1, 2, ...t4), 0 === n2.length && n2.push(""), o2 -= 2;
          }
        }
      }
    } while (e2);
    return t2;
  }
  secondPhasePreProcess(t2) {
    for (let e2 = 0; e2 < t2.length - 1; e2++) for (let n2 = e2 + 1; n2 < t2.length; n2++) {
      const r2 = this.partsMatch(t2[e2], t2[n2], !this.preserveMultipleSlashes);
      if (r2) {
        t2[e2] = [], t2[n2] = r2;
        break;
      }
    }
    return t2.filter(((t3) => t3.length));
  }
  partsMatch(t2, e2) {
    let n2 = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r2 = 0, o2 = 0, i2 = [], s2 = "";
    for (; r2 < t2.length && o2 < e2.length; ) if (t2[r2] === e2[o2]) i2.push("b" === s2 ? e2[o2] : t2[r2]), r2++, o2++;
    else if (n2 && "**" === t2[r2] && e2[o2] === t2[r2 + 1]) i2.push(t2[r2]), r2++;
    else if (n2 && "**" === e2[o2] && t2[r2] === e2[o2 + 1]) i2.push(e2[o2]), o2++;
    else if ("*" !== t2[r2] || !e2[o2] || !this.options.dot && e2[o2].startsWith(".") || "**" === e2[o2]) {
      if ("*" !== e2[o2] || !t2[r2] || !this.options.dot && t2[r2].startsWith(".") || "**" === t2[r2]) return false;
      if ("a" === s2) return false;
      s2 = "b", i2.push(e2[o2]), r2++, o2++;
    } else {
      if ("b" === s2) return false;
      s2 = "a", i2.push(t2[r2]), r2++, o2++;
    }
    return t2.length === e2.length && i2;
  }
  parseNegate() {
    if (this.nonegate) return;
    const t2 = this.pattern;
    let e2 = false, n2 = 0;
    for (let r2 = 0; r2 < t2.length && "!" === t2.charAt(r2); r2++) e2 = !e2, n2++;
    n2 && (this.pattern = t2.slice(n2)), this.negate = e2;
  }
  matchOne(t2, e2) {
    let n2 = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
    const r2 = this.options;
    if (this.isWindows) {
      const n3 = "string" == typeof t2[0] && /^[a-z]:$/i.test(t2[0]), r3 = !n3 && "" === t2[0] && "" === t2[1] && "?" === t2[2] && /^[a-z]:$/i.test(t2[3]), o3 = "string" == typeof e2[0] && /^[a-z]:$/i.test(e2[0]), i3 = r3 ? 3 : n3 ? 0 : void 0, s3 = !o3 && "" === e2[0] && "" === e2[1] && "?" === e2[2] && "string" == typeof e2[3] && /^[a-z]:$/i.test(e2[3]) ? 3 : o3 ? 0 : void 0;
      if ("number" == typeof i3 && "number" == typeof s3) {
        const [n4, r4] = [t2[i3], e2[s3]];
        n4.toLowerCase() === r4.toLowerCase() && (e2[s3] = n4, s3 > i3 ? e2 = e2.slice(s3) : i3 > s3 && (t2 = t2.slice(i3)));
      }
    }
    const { optimizationLevel: o2 = 1 } = this.options;
    o2 >= 2 && (t2 = this.levelTwoFileOptimize(t2)), this.debug("matchOne", this, { file: t2, pattern: e2 }), this.debug("matchOne", t2.length, e2.length);
    for (var i2 = 0, s2 = 0, a2 = t2.length, u2 = e2.length; i2 < a2 && s2 < u2; i2++, s2++) {
      this.debug("matchOne loop");
      var c2 = e2[s2], l2 = t2[i2];
      if (this.debug(e2, c2, l2), false === c2) return false;
      if (c2 === Bt) {
        this.debug("GLOBSTAR", [e2, c2, l2]);
        var h2 = i2, p2 = s2 + 1;
        if (p2 === u2) {
          for (this.debug("** at the end"); i2 < a2; i2++) if ("." === t2[i2] || ".." === t2[i2] || !r2.dot && "." === t2[i2].charAt(0)) return false;
          return true;
        }
        for (; h2 < a2; ) {
          var f2 = t2[h2];
          if (this.debug("\nglobstar while", t2, h2, e2, p2, f2), this.matchOne(t2.slice(h2), e2.slice(p2), n2)) return this.debug("globstar found match!", h2, a2, f2), true;
          if ("." === f2 || ".." === f2 || !r2.dot && "." === f2.charAt(0)) {
            this.debug("dot detected!", t2, h2, e2, p2);
            break;
          }
          this.debug("globstar swallow a segment, and continue"), h2++;
        }
        return !(!n2 || (this.debug("\n>>> no match, partial?", t2, h2, e2, p2), h2 !== a2));
      }
      let o3;
      if ("string" == typeof c2 ? (o3 = l2 === c2, this.debug("string match", c2, l2, o3)) : (o3 = c2.test(l2), this.debug("pattern match", c2, l2, o3)), !o3) return false;
    }
    if (i2 === a2 && s2 === u2) return true;
    if (i2 === a2) return n2;
    if (s2 === u2) return i2 === a2 - 1 && "" === t2[i2];
    throw new Error("wtf?");
  }
  braceExpand() {
    return Wt(this.pattern, this.options);
  }
  parse(t2) {
    rt(t2);
    const e2 = this.options;
    if ("**" === t2) return Bt;
    if ("" === t2) return "";
    let n2, r2 = null;
    (n2 = t2.match($t)) ? r2 = e2.dot ? It : Ct : (n2 = t2.match(wt)) ? r2 = (e2.nocase ? e2.dot ? Pt : At : e2.dot ? Nt : xt)(n2[1]) : (n2 = t2.match(kt)) ? r2 = (e2.nocase ? e2.dot ? Lt : Rt : e2.dot ? _t : Mt)(n2) : (n2 = t2.match(Ot)) ? r2 = e2.dot ? Tt : Et : (n2 = t2.match(jt)) && (r2 = St);
    const o2 = vt.fromGlob(t2, this.options).toMMPattern();
    return r2 && "object" == typeof o2 && Reflect.defineProperty(o2, "test", { value: r2 }), o2;
  }
  makeRe() {
    if (this.regexp || false === this.regexp) return this.regexp;
    const t2 = this.set;
    if (!t2.length) return this.regexp = false, this.regexp;
    const e2 = this.options, n2 = e2.noglobstar ? "[^/]*?" : e2.dot ? "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?" : "(?:(?!(?:\\/|^)\\.).)*?", r2 = new Set(e2.nocase ? ["i"] : []);
    let o2 = t2.map(((t3) => {
      const e3 = t3.map(((t4) => {
        if (t4 instanceof RegExp) for (const e4 of t4.flags.split("")) r2.add(e4);
        return "string" == typeof t4 ? t4.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") : t4 === Bt ? Bt : t4._src;
      }));
      return e3.forEach(((t4, r3) => {
        const o3 = e3[r3 + 1], i3 = e3[r3 - 1];
        t4 === Bt && i3 !== Bt && (void 0 === i3 ? void 0 !== o3 && o3 !== Bt ? e3[r3 + 1] = "(?:\\/|" + n2 + "\\/)?" + o3 : e3[r3] = n2 : void 0 === o3 ? e3[r3 - 1] = i3 + "(?:\\/|" + n2 + ")?" : o3 !== Bt && (e3[r3 - 1] = i3 + "(?:\\/|\\/" + n2 + "\\/)" + o3, e3[r3 + 1] = Bt));
      })), e3.filter(((t4) => t4 !== Bt)).join("/");
    })).join("|");
    const [i2, s2] = t2.length > 1 ? ["(?:", ")"] : ["", ""];
    o2 = "^" + i2 + o2 + s2 + "$", this.negate && (o2 = "^(?!" + o2 + ").+$");
    try {
      this.regexp = new RegExp(o2, [...r2].join(""));
    } catch (t3) {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(t2) {
    return this.preserveMultipleSlashes ? t2.split("/") : this.isWindows && /^\/\/[^\/]+/.test(t2) ? ["", ...t2.split(/\/+/)] : t2.split(/\/+/);
  }
  match(t2) {
    let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.partial;
    if (this.debug("match", t2, this.pattern), this.comment) return false;
    if (this.empty) return "" === t2;
    if ("/" === t2 && e2) return true;
    const n2 = this.options;
    this.isWindows && (t2 = t2.split("\\").join("/"));
    const r2 = this.slashSplit(t2);
    this.debug(this.pattern, "split", r2);
    const o2 = this.set;
    this.debug(this.pattern, "set", o2);
    let i2 = r2[r2.length - 1];
    if (!i2) for (let t3 = r2.length - 2; !i2 && t3 >= 0; t3--) i2 = r2[t3];
    for (let t3 = 0; t3 < o2.length; t3++) {
      const s2 = o2[t3];
      let a2 = r2;
      if (n2.matchBase && 1 === s2.length && (a2 = [i2]), this.matchOne(a2, s2, e2)) return !!n2.flipNegate || !this.negate;
    }
    return !n2.flipNegate && this.negate;
  }
  static defaults(t2) {
    return bt.defaults(t2).Minimatch;
  }
}
function qt(t2) {
  const e2 = new Error(`${arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : ""}Invalid response: ${t2.status} ${t2.statusText}`);
  return e2.status = t2.status, e2.response = t2, e2;
}
function Ht(t2, e2) {
  const { status: n2 } = e2;
  if (401 === n2 && t2.digest) return e2;
  if (n2 >= 400) throw qt(e2);
  return e2;
}
function Xt(t2, e2) {
  return arguments.length > 2 && void 0 !== arguments[2] && arguments[2] ? { data: e2, headers: t2.headers ? W(t2.headers) : {}, status: t2.status, statusText: t2.statusText } : e2;
}
bt.AST = vt, bt.Minimatch = Gt, bt.escape = function(t2) {
  let { windowsPathsNoEscape: e2 = false } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return e2 ? t2.replace(/[?*()[\]]/g, "[$&]") : t2.replace(/[?*()[\]\\]/g, "\\$&");
}, bt.unescape = ut;
const Zt = (Yt = function(t2, e2, n2) {
  let r2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
  const o2 = tt({ url: y(t2.remoteURL, f(e2)), method: "COPY", headers: { Destination: y(t2.remoteURL, f(n2)), Overwrite: false === r2.overwrite ? "F" : "T", Depth: r2.shallow ? "0" : "infinity" } }, t2, r2);
  return s2 = function(e3) {
    Ht(t2, e3);
  }, (i2 = Q$1(o2, t2)) && i2.then || (i2 = Promise.resolve(i2)), s2 ? i2.then(s2) : i2;
  var i2, s2;
}, function() {
  for (var t2 = [], e2 = 0; e2 < arguments.length; e2++) t2[e2] = arguments[e2];
  try {
    return Promise.resolve(Yt.apply(this, t2));
  } catch (t3) {
    return Promise.reject(t3);
  }
});
var Yt, Kt = n(635), Jt = n(829), Qt = n.n(Jt), te = (function(t2) {
  return t2.Array = "array", t2.Object = "object", t2.Original = "original", t2;
})(te || {});
function ee(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : te.Original;
  const r2 = Qt().get(t2, e2);
  return "array" === n2 && false === Array.isArray(r2) ? [r2] : "object" === n2 && Array.isArray(r2) ? r2[0] : r2;
}
function ne(t2) {
  return new Promise(((e2) => {
    e2((function(t3) {
      const { multistatus: e3 } = t3;
      if ("" === e3) return { multistatus: { response: [] } };
      if (!e3) throw new Error("Invalid response: No root multistatus found");
      const n2 = { multistatus: Array.isArray(e3) ? e3[0] : e3 };
      return Qt().set(n2, "multistatus.response", ee(n2, "multistatus.response", te.Array)), Qt().set(n2, "multistatus.response", Qt().get(n2, "multistatus.response").map(((t4) => (function(t5) {
        const e4 = Object.assign({}, t5);
        return e4.status ? Qt().set(e4, "status", ee(e4, "status", te.Object)) : (Qt().set(e4, "propstat", ee(e4, "propstat", te.Object)), Qt().set(e4, "propstat.prop", ee(e4, "propstat.prop", te.Object))), e4;
      })(t4)))), n2;
    })(new Kt.XMLParser({ allowBooleanAttributes: true, attributeNamePrefix: "", textNodeName: "text", ignoreAttributes: false, removeNSPrefix: true, numberParseOptions: { hex: true, leadingZeros: false }, attributeValueProcessor: (t3, e3, n2) => "true" === e3 || "false" === e3 ? "true" === e3 : e3, tagValueProcessor(t3, e3, n2) {
      if (!n2.endsWith("propstat.prop.displayname")) return e3;
    } }).parse(t2)));
  }));
}
function re(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
  const { getlastmodified: r2 = null, getcontentlength: o2 = "0", resourcetype: i2 = null, getcontenttype: s2 = null, getetag: a2 = null } = t2, u2 = i2 && "object" == typeof i2 && void 0 !== i2.collection ? "directory" : "file", c2 = { filename: e2, basename: l().basename(e2), lastmod: r2, size: parseInt(o2, 10), type: u2, etag: "string" == typeof a2 ? a2.replace(/"/g, "") : null };
  return "file" === u2 && (c2.mime = s2 && "string" == typeof s2 ? s2.split(";")[0] : ""), n2 && (void 0 !== t2.displayname && (t2.displayname = String(t2.displayname)), c2.props = t2), c2;
}
function oe(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], r2 = null;
  try {
    t2.multistatus.response[0].propstat && (r2 = t2.multistatus.response[0]);
  } catch (t3) {
  }
  if (!r2) throw new Error("Failed getting item stat: bad response");
  const { propstat: { prop: o2, status: i2 } } = r2, [s2, a2, u2] = i2.split(" ", 3), c2 = parseInt(a2, 10);
  if (c2 >= 400) {
    const t3 = new Error(`Invalid response: ${c2} ${u2}`);
    throw t3.status = c2, t3;
  }
  return re(o2, g(e2), n2);
}
function ie(t2) {
  switch (String(t2)) {
    case "-3":
      return "unlimited";
    case "-2":
    case "-1":
      return "unknown";
    default:
      return parseInt(String(t2), 10);
  }
}
function se(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const ae = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const { details: r2 = false } = n2, o2 = tt({ url: y(t2.remoteURL, f(e2)), method: "PROPFIND", headers: { Accept: "text/plain,application/xml", Depth: "0" } }, t2, n2);
  return se(Q$1(o2, t2), (function(n3) {
    return Ht(t2, n3), se(n3.text(), (function(t3) {
      return se(ne(t3), (function(t4) {
        const o3 = oe(t4, e2, r2);
        return Xt(n3, o3, r2);
      }));
    }));
  }));
}));
function ue(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const ce = le((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = (function(t3) {
    if (!t3 || "/" === t3) return [];
    let e3 = t3;
    const n3 = [];
    do {
      n3.push(e3), e3 = l().dirname(e3);
    } while (e3 && "/" !== e3);
    return n3;
  })(g(e2));
  r2.sort(((t3, e3) => t3.length > e3.length ? 1 : e3.length > t3.length ? -1 : 0));
  let o2 = false;
  return (function(t3, e3, n3) {
    if ("function" == typeof t3[fe]) {
      let l2 = function(t4) {
        try {
          for (; !(r3 = s2.next()).done; ) if ((t4 = e3(r3.value)) && t4.then) {
            if (!me(t4)) return void t4.then(l2, i2 || (i2 = de.bind(null, o3 = new ge(), 2)));
            t4 = t4.v;
          }
          o3 ? de(o3, 1, t4) : o3 = t4;
        } catch (t5) {
          de(o3 || (o3 = new ge()), 2, t5);
        }
      };
      var r3, o3, i2, s2 = t3[fe]();
      if (l2(), s2.return) {
        var a2 = function(t4) {
          try {
            r3.done || s2.return();
          } catch (t5) {
          }
          return t4;
        };
        if (o3 && o3.then) return o3.then(a2, (function(t4) {
          throw a2(t4);
        }));
        a2();
      }
      return o3;
    }
    if (!("length" in t3)) throw new TypeError("Object is not iterable");
    for (var u2 = [], c2 = 0; c2 < t3.length; c2++) u2.push(t3[c2]);
    return (function(t4, e4, n4) {
      var r4, o4, i3 = -1;
      return (function s3(a3) {
        try {
          for (; ++i3 < t4.length && (!n4 || !n4()); ) if ((a3 = e4(i3)) && a3.then) {
            if (!me(a3)) return void a3.then(s3, o4 || (o4 = de.bind(null, r4 = new ge(), 2)));
            a3 = a3.v;
          }
          r4 ? de(r4, 1, a3) : r4 = a3;
        } catch (t5) {
          de(r4 || (r4 = new ge()), 2, t5);
        }
      })(), r4;
    })(u2, (function(t4) {
      return e3(u2[t4]);
    }), n3);
  })(r2, (function(r3) {
    return i2 = function() {
      return (function(n3, o3) {
        try {
          var i3 = ue(ae(t2, r3), (function(t3) {
            if ("directory" !== t3.type) throw new Error(`Path includes a file: ${e2}`);
          }));
        } catch (t3) {
          return o3(t3);
        }
        return i3 && i3.then ? i3.then(void 0, o3) : i3;
      })(0, (function(e3) {
        const i3 = e3;
        return (function() {
          if (404 === i3.status) return o2 = true, pe(ye(t2, r3, { ...n2, recursive: false }));
          throw e3;
        })();
      }));
    }, (s2 = (function() {
      if (o2) return pe(ye(t2, r3, { ...n2, recursive: false }));
    })()) && s2.then ? s2.then(i2) : i2();
    var i2, s2;
  }), (function() {
    return false;
  }));
}));
function le(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
}
function he() {
}
function pe(t2, e2) {
  return t2 && t2.then ? t2.then(he) : Promise.resolve();
}
const fe = "undefined" != typeof Symbol ? Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator")) : "@@iterator";
function de(t2, e2, n2) {
  if (!t2.s) {
    if (n2 instanceof ge) {
      if (!n2.s) return void (n2.o = de.bind(null, t2, e2));
      1 & e2 && (e2 = n2.s), n2 = n2.v;
    }
    if (n2 && n2.then) return void n2.then(de.bind(null, t2, e2), de.bind(null, t2, 2));
    t2.s = e2, t2.v = n2;
    const r2 = t2.o;
    r2 && r2(t2);
  }
}
const ge = (function() {
  function t2() {
  }
  return t2.prototype.then = function(e2, n2) {
    const r2 = new t2(), o2 = this.s;
    if (o2) {
      const t3 = 1 & o2 ? e2 : n2;
      if (t3) {
        try {
          de(r2, 1, t3(this.v));
        } catch (t4) {
          de(r2, 2, t4);
        }
        return r2;
      }
      return this;
    }
    return this.o = function(t3) {
      try {
        const o3 = t3.v;
        1 & t3.s ? de(r2, 1, e2 ? e2(o3) : o3) : n2 ? de(r2, 1, n2(o3)) : de(r2, 2, o3);
      } catch (t4) {
        de(r2, 2, t4);
      }
    }, r2;
  }, t2;
})();
function me(t2) {
  return t2 instanceof ge && 1 & t2.s;
}
const ye = le((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  if (true === n2.recursive) return ce(t2, e2, n2);
  const r2 = tt({ url: y(t2.remoteURL, (o2 = f(e2), o2.endsWith("/") ? o2 : o2 + "/")), method: "MKCOL" }, t2, n2);
  var o2;
  return ue(Q$1(r2, t2), (function(e3) {
    Ht(t2, e3);
  }));
}));
var ve = n(388), be = n.n(ve);
const we = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = {};
  if ("object" == typeof n2.range && "number" == typeof n2.range.start) {
    let t3 = `bytes=${n2.range.start}-`;
    "number" == typeof n2.range.end && (t3 = `${t3}${n2.range.end}`), r2.Range = t3;
  }
  const o2 = tt({ url: y(t2.remoteURL, f(e2)), method: "GET", headers: r2 }, t2, n2);
  return s2 = function(e3) {
    if (Ht(t2, e3), r2.Range && 206 !== e3.status) {
      const t3 = new Error(`Invalid response code for partial request: ${e3.status}`);
      throw t3.status = e3.status, t3;
    }
    return n2.callback && setTimeout((() => {
      n2.callback(e3);
    }), 0), e3.body;
  }, (i2 = Q$1(o2, t2)) && i2.then || (i2 = Promise.resolve(i2)), s2 ? i2.then(s2) : i2;
  var i2, s2;
})), xe = () => {
}, Ne = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2, n2) {
  n2.url || (n2.url = y(t2.remoteURL, f(e2)));
  const r2 = tt(n2, t2, {});
  return i2 = function(e3) {
    return Ht(t2, e3), e3;
  }, (o2 = Q$1(r2, t2)) && o2.then || (o2 = Promise.resolve(o2)), i2 ? o2.then(i2) : o2;
  var o2, i2;
})), Ae = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = tt({ url: y(t2.remoteURL, f(e2)), method: "DELETE" }, t2, n2);
  return i2 = function(e3) {
    Ht(t2, e3);
  }, (o2 = Q$1(r2, t2)) && o2.then || (o2 = Promise.resolve(o2)), i2 ? o2.then(i2) : o2;
  var o2, i2;
})), Pe = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  return (function(r2, o2) {
    try {
      var i2 = (s2 = ae(t2, e2, n2), a2 = function() {
        return true;
      }, u2 ? a2 ? a2(s2) : s2 : (s2 && s2.then || (s2 = Promise.resolve(s2)), a2 ? s2.then(a2) : s2));
    } catch (t3) {
      return o2(t3);
    }
    var s2, a2, u2;
    return i2 && i2.then ? i2.then(void 0, o2) : i2;
  })(0, (function(t3) {
    if (404 === t3.status) return false;
    throw t3;
  }));
}));
function Oe(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const Ee = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = tt({ url: y(t2.remoteURL, f(e2), "/"), method: "PROPFIND", headers: { Accept: "text/plain,application/xml", Depth: n2.deep ? "infinity" : "1" } }, t2, n2);
  return Oe(Q$1(r2, t2), (function(r3) {
    return Ht(t2, r3), Oe(r3.text(), (function(o2) {
      if (!o2) throw new Error("Failed parsing directory contents: Empty response");
      return Oe(ne(o2), (function(o3) {
        const i2 = d(e2);
        let s2 = (function(t3, e3, n3) {
          let r4 = arguments.length > 3 && void 0 !== arguments[3] && arguments[3], o4 = arguments.length > 4 && void 0 !== arguments[4] && arguments[4];
          const i3 = l().join(e3, "/"), { multistatus: { response: s3 } } = t3, a2 = s3.map(((t4) => {
            const e4 = (function(t5) {
              try {
                return t5.replace(/^https?:\/\/[^\/]+/, "");
              } catch (t6) {
                throw new u(t6, "Failed normalising HREF");
              }
            })(t4.href), { propstat: { prop: n4 } } = t4;
            return re(n4, "/" === i3 ? decodeURIComponent(g(e4)) : g(l().relative(decodeURIComponent(i3), decodeURIComponent(e4))), r4);
          }));
          return o4 ? a2 : a2.filter(((t4) => t4.basename && ("file" === t4.type || t4.filename !== n3.replace(/\/$/, ""))));
        })(o3, d(t2.remoteBasePath || t2.remotePath), i2, n2.details, n2.includeSelf);
        return n2.glob && (s2 = (function(t3, e3) {
          return t3.filter(((t4) => bt(t4.filename, e3, { matchBase: true })));
        })(s2, n2.glob)), Xt(r3, s2, n2.details);
      }));
    }));
  }));
}));
function Te(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
}
const je = Te((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = tt({ url: y(t2.remoteURL, f(e2)), method: "GET", headers: { Accept: "text/plain" }, transformResponse: [Ie] }, t2, n2);
  return Se(Q$1(r2, t2), (function(e3) {
    return Ht(t2, e3), Se(e3.text(), (function(t3) {
      return Xt(e3, t3, n2.details);
    }));
  }));
}));
function Se(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const $e = Te((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = tt({ url: y(t2.remoteURL, f(e2)), method: "GET" }, t2, n2);
  return Se(Q$1(r2, t2), (function(e3) {
    let r3;
    return Ht(t2, e3), (function(t3, e4) {
      var n3 = t3();
      return n3 && n3.then ? n3.then(e4) : e4();
    })((function() {
      return Se(e3.arrayBuffer(), (function(t3) {
        r3 = t3;
      }));
    }), (function() {
      return Xt(e3, r3, n2.details);
    }));
  }));
})), Ce = Te((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const { format: r2 = "binary" } = n2;
  if ("binary" !== r2 && "text" !== r2) throw new u({ info: { code: I.InvalidOutputFormat } }, `Invalid output format: ${r2}`);
  return "text" === r2 ? je(t2, e2, n2) : $e(t2, e2, n2);
})), Ie = (t2) => t2;
function ke(t2) {
  return new Kt.XMLBuilder({ attributeNamePrefix: "@_", format: true, ignoreAttributes: false, suppressEmptyNode: true }).build(Re({ lockinfo: { "@_xmlns:d": "DAV:", lockscope: { exclusive: {} }, locktype: { write: {} }, owner: { href: t2 } } }, "d"));
}
function Re(t2, e2) {
  const n2 = { ...t2 };
  for (const t3 in n2) n2.hasOwnProperty(t3) && (n2[t3] && "object" == typeof n2[t3] && -1 === t3.indexOf(":") ? (n2[`${e2}:${t3}`] = Re(n2[t3], e2), delete n2[t3]) : false === /^@_/.test(t3) && (n2[`${e2}:${t3}`] = n2[t3], delete n2[t3]));
  return n2;
}
function Le(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
function _e(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
}
const Me = _e((function(t2, e2, n2) {
  let r2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
  const o2 = tt({ url: y(t2.remoteURL, f(e2)), method: "UNLOCK", headers: { "Lock-Token": n2 } }, t2, r2);
  return Le(Q$1(o2, t2), (function(e3) {
    if (Ht(t2, e3), 204 !== e3.status && 200 !== e3.status) throw qt(e3);
  }));
})), Ue = _e((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const { refreshToken: r2, timeout: o2 = Fe } = n2, i2 = { Accept: "text/plain,application/xml", Timeout: o2 };
  r2 && (i2.If = r2);
  const s2 = tt({ url: y(t2.remoteURL, f(e2)), method: "LOCK", headers: i2, data: ke(t2.contactHref) }, t2, n2);
  return Le(Q$1(s2, t2), (function(e3) {
    return Ht(t2, e3), Le(e3.text(), (function(t3) {
      const n3 = (i3 = t3, new Kt.XMLParser({ removeNSPrefix: true, parseAttributeValue: true, parseTagValue: true }).parse(i3)), r3 = Qt().get(n3, "prop.lockdiscovery.activelock.locktoken.href"), o3 = Qt().get(n3, "prop.lockdiscovery.activelock.timeout");
      var i3;
      if (!r3) throw qt(e3, "No lock token received: ");
      return { token: r3, serverTimeout: o3 };
    }));
  }));
})), Fe = "Infinite, Second-4100000000";
function De(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const Be = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2) {
  let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  const n2 = e2.path || "/", r2 = tt({ url: y(t2.remoteURL, n2), method: "PROPFIND", headers: { Accept: "text/plain,application/xml", Depth: "0" } }, t2, e2);
  return De(Q$1(r2, t2), (function(n3) {
    return Ht(t2, n3), De(n3.text(), (function(t3) {
      return De(ne(t3), (function(t4) {
        const r3 = (function(t5) {
          try {
            const [e3] = t5.multistatus.response, { propstat: { prop: { "quota-used-bytes": n4, "quota-available-bytes": r4 } } } = e3;
            return void 0 !== n4 && void 0 !== r4 ? { used: parseInt(String(n4), 10), available: ie(r4) } : null;
          } catch (t6) {
          }
          return null;
        })(t4);
        return Xt(n3, r3, e2.details);
      }));
    }));
  }));
}));
function Ve(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const We = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const { details: r2 = false } = n2, o2 = tt({ url: y(t2.remoteURL, f(e2)), method: "SEARCH", headers: { Accept: "text/plain,application/xml", "Content-Type": t2.headers["Content-Type"] || "application/xml; charset=utf-8" } }, t2, n2);
  return Ve(Q$1(o2, t2), (function(n3) {
    return Ht(t2, n3), Ve(n3.text(), (function(t3) {
      return Ve(ne(t3), (function(t4) {
        const o3 = (function(t5, e3, n4) {
          const r3 = { truncated: false, results: [] };
          return r3.truncated = t5.multistatus.response.some(((t6) => "507" === (t6.status || t6.propstat?.status).split(" ", 3)?.[1] && t6.href.replace(/\/$/, "").endsWith(f(e3).replace(/\/$/, "")))), t5.multistatus.response.forEach(((t6) => {
            if (void 0 === t6.propstat) return;
            const e4 = t6.href.split("/").map(decodeURIComponent).join("/");
            r3.results.push(re(t6.propstat.prop, e4, n4));
          })), r3;
        })(t4, e2, r2);
        return Xt(n3, o3, r2);
      }));
    }));
  }));
})), ze = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2, n2) {
  let r2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
  const o2 = tt({ url: y(t2.remoteURL, f(e2)), method: "MOVE", headers: { Destination: y(t2.remoteURL, f(n2)), Overwrite: false === r2.overwrite ? "F" : "T" } }, t2, r2);
  return s2 = function(e3) {
    Ht(t2, e3);
  }, (i2 = Q$1(o2, t2)) && i2.then || (i2 = Promise.resolve(i2)), s2 ? i2.then(s2) : i2;
  var i2, s2;
}));
var Ge = n(172);
const qe = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2, n2) {
  let r2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
  const { contentLength: o2 = true, overwrite: i2 = true } = r2, s2 = { "Content-Type": "application/octet-stream" };
  false === o2 || (s2["Content-Length"] = "number" == typeof o2 ? `${o2}` : `${(function(t3) {
    if (H$1(t3)) return t3.byteLength;
    if (X(t3)) return t3.length;
    if ("string" == typeof t3) return (0, Ge.d)(t3);
    throw new u({ info: { code: I.DataTypeNoLength } }, "Cannot calculate data length: Invalid type");
  })(n2)}`), i2 || (s2["If-None-Match"] = "*");
  const a2 = tt({ url: y(t2.remoteURL, f(e2)), method: "PUT", headers: s2, data: n2 }, t2, r2);
  return l2 = function(e3) {
    try {
      Ht(t2, e3);
    } catch (t3) {
      const e4 = t3;
      if (412 !== e4.status || i2) throw e4;
      return false;
    }
    return true;
  }, (c2 = Q$1(a2, t2)) && c2.then || (c2 = Promise.resolve(c2)), l2 ? c2.then(l2) : c2;
  var c2, l2;
})), He = /* @__PURE__ */ (function(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
})((function(t2, e2) {
  let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  const r2 = tt({ url: y(t2.remoteURL, f(e2)), method: "OPTIONS" }, t2, n2);
  return i2 = function(e3) {
    try {
      Ht(t2, e3);
    } catch (t3) {
      throw t3;
    }
    return { compliance: (e3.headers.get("DAV") ?? "").split(",").map(((t3) => t3.trim())), server: e3.headers.get("Server") ?? "" };
  }, (o2 = Q$1(r2, t2)) && o2.then || (o2 = Promise.resolve(o2)), i2 ? o2.then(i2) : o2;
  var o2, i2;
}));
function Xe(t2, e2, n2) {
  return n2 ? e2 ? e2(t2) : t2 : (t2 && t2.then || (t2 = Promise.resolve(t2)), e2 ? t2.then(e2) : t2);
}
const Ze = Je((function(t2, e2, n2, r2, o2) {
  let i2 = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : {};
  if (n2 > r2 || n2 < 0) throw new u({ info: { code: I.InvalidUpdateRange } }, `Invalid update range ${n2} for partial update`);
  const s2 = { "Content-Type": "application/octet-stream", "Content-Length": "" + (r2 - n2 + 1), "Content-Range": `bytes ${n2}-${r2}/*` }, a2 = tt({ url: y(t2.remoteURL, f(e2)), method: "PUT", headers: s2, data: o2 }, t2, i2);
  return Xe(Q$1(a2, t2), (function(e3) {
    Ht(t2, e3);
  }));
}));
function Ye(t2, e2) {
  var n2 = t2();
  return n2 && n2.then ? n2.then(e2) : e2(n2);
}
const Ke = Je((function(t2, e2, n2, r2, o2) {
  let i2 = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : {};
  if (n2 > r2 || n2 < 0) throw new u({ info: { code: I.InvalidUpdateRange } }, `Invalid update range ${n2} for partial update`);
  const s2 = { "Content-Type": "application/x-sabredav-partialupdate", "Content-Length": "" + (r2 - n2 + 1), "X-Update-Range": `bytes=${n2}-${r2}` }, a2 = tt({ url: y(t2.remoteURL, f(e2)), method: "PATCH", headers: s2, data: o2 }, t2, i2);
  return Xe(Q$1(a2, t2), (function(e3) {
    Ht(t2, e3);
  }));
}));
function Je(t2) {
  return function() {
    for (var e2 = [], n2 = 0; n2 < arguments.length; n2++) e2[n2] = arguments[n2];
    try {
      return Promise.resolve(t2.apply(this, e2));
    } catch (t3) {
      return Promise.reject(t3);
    }
  };
}
const Qe = Je((function(t2, e2, n2, r2, o2) {
  let i2 = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : {};
  return Xe(He(t2, e2, i2), (function(s2) {
    let a2 = false;
    return Ye((function() {
      if (s2.compliance.includes("sabredav-partialupdate")) return Xe(Ke(t2, e2, n2, r2, o2, i2), (function(t3) {
        return a2 = true, t3;
      }));
    }), (function(c2) {
      let l2 = false;
      return a2 ? c2 : Ye((function() {
        if (s2.server.includes("Apache") && s2.compliance.includes("<http://apache.org/dav/propset/fs/1>")) return Xe(Ze(t2, e2, n2, r2, o2, i2), (function(t3) {
          return l2 = true, t3;
        }));
      }), (function(t3) {
        if (l2) return t3;
        throw new u({ info: { code: I.NotSupported } }, "Not supported");
      }));
    }));
  }));
})), tn = "https://github.com/perry-mitchell/webdav-client/blob/master/LOCK_CONTACT.md";
function en(t2) {
  let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  const { authType: n2 = null, remoteBasePath: r2, contactHref: o2 = tn, ha1: i2, headers: s2 = {}, httpAgent: a2, httpsAgent: c2, password: l2, token: h2, username: p2, withCredentials: d2 } = e2;
  let g2 = n2;
  g2 || (g2 = p2 || l2 ? C$1.Password : C$1.None);
  const v2 = { authType: g2, remoteBasePath: r2, contactHref: o2, ha1: i2, headers: Object.assign({}, s2), httpAgent: a2, httpsAgent: c2, password: l2, remotePath: m(t2), remoteURL: t2, token: h2, username: p2, withCredentials: d2 };
  return k(v2, p2, l2, h2, i2), { copyFile: (t3, e3, n3) => Zt(v2, t3, e3, n3), createDirectory: (t3, e3) => ye(v2, t3, e3), createReadStream: (t3, e3) => (function(t4, e4) {
    let n3 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
    const r3 = new (be().PassThrough)();
    return we(t4, e4, n3).then(((t5) => {
      t5.pipe(r3);
    })).catch(((t5) => {
      r3.emit("error", t5);
    })), r3;
  })(v2, t3, e3), createWriteStream: (t3, e3, n3) => (function(t4, e4) {
    let n4 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}, r3 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : xe;
    const o3 = new (be().PassThrough)(), i3 = {};
    false === n4.overwrite && (i3["If-None-Match"] = "*");
    const s3 = tt({ url: y(t4.remoteURL, f(e4)), method: "PUT", headers: i3, data: o3, maxRedirects: 0 }, t4, n4);
    return Q$1(s3, t4).then(((e5) => Ht(t4, e5))).then(((t5) => {
      setTimeout((() => {
        r3(t5);
      }), 0);
    })).catch(((t5) => {
      o3.emit("error", t5);
    })), o3;
  })(v2, t3, e3, n3), customRequest: (t3, e3) => Ne(v2, t3, e3), deleteFile: (t3, e3) => Ae(v2, t3, e3), exists: (t3, e3) => Pe(v2, t3, e3), getDirectoryContents: (t3, e3) => Ee(v2, t3, e3), getFileContents: (t3, e3) => Ce(v2, t3, e3), getFileDownloadLink: (t3) => (function(t4, e3) {
    let n3 = y(t4.remoteURL, f(e3));
    const r3 = /^https:/i.test(n3) ? "https" : "http";
    switch (t4.authType) {
      case C$1.None:
        break;
      case C$1.Password: {
        const e4 = O(t4.headers.Authorization.replace(/^Basic /i, "").trim());
        n3 = n3.replace(/^https?:\/\//, `${r3}://${e4}@`);
        break;
      }
      default:
        throw new u({ info: { code: I.LinkUnsupportedAuthType } }, `Unsupported auth type for file link: ${t4.authType}`);
    }
    return n3;
  })(v2, t3), getFileUploadLink: (t3) => (function(t4, e3) {
    let n3 = `${y(t4.remoteURL, f(e3))}?Content-Type=application/octet-stream`;
    const r3 = /^https:/i.test(n3) ? "https" : "http";
    switch (t4.authType) {
      case C$1.None:
        break;
      case C$1.Password: {
        const e4 = O(t4.headers.Authorization.replace(/^Basic /i, "").trim());
        n3 = n3.replace(/^https?:\/\//, `${r3}://${e4}@`);
        break;
      }
      default:
        throw new u({ info: { code: I.LinkUnsupportedAuthType } }, `Unsupported auth type for file link: ${t4.authType}`);
    }
    return n3;
  })(v2, t3), getHeaders: () => Object.assign({}, v2.headers), getQuota: (t3) => Be(v2, t3), lock: (t3, e3) => Ue(v2, t3, e3), moveFile: (t3, e3, n3) => ze(v2, t3, e3, n3), putFileContents: (t3, e3, n3) => qe(v2, t3, e3, n3), partialUpdateFileContents: (t3, e3, n3, r3, o3) => Qe(v2, t3, e3, n3, r3, o3), getDAVCompliance: (t3) => He(v2, t3), search: (t3, e3) => We(v2, t3, e3), setHeaders: (t3) => {
    v2.headers = Object.assign({}, t3);
  }, stat: (t3, e3) => ae(v2, t3, e3), unlock: (t3, e3, n3) => Me(v2, t3, e3, n3) };
}
r.hT; r.O4; r.Kd; r.YK; var an = r.UU; r.Gu; r.ky; r.h4; r.ch; r.hq; r.i5;

Symbol.observable ||= Symbol.for("observable");
Symbol.subscribe ||= Symbol.for("subscribe");
Symbol.unsubscribe ||= Symbol.for("unsubscribe");
const $value = Symbol.for("@value");
const $extractKey$ = Symbol.for("@extract");
const $originalKey$ = Symbol.for("@origin");
const $registryKey$ = Symbol.for("@registry");
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
      callback.apply(this, args);
    };
  }
}

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
    result ??= Reflect.get(obj, key, obj);
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
    if (name == "y") {
      return () => {
        return target?.y ?? target?.[1];
      };
    }
    if (name == "z") {
      return () => {
        return target?.z ?? target?.[2];
      };
    }
    if (name == "w") {
      return () => {
        return target?.w ?? target?.[3];
      };
    }
    if (name == "r") {
      return () => {
        return target?.r ?? target?.[0];
      };
    }
    if (name == "g") {
      return () => {
        return target?.g ?? target?.[1];
      };
    }
    if (name == "b") {
      return () => {
        return target?.b ?? target?.[2];
      };
    }
    if (name == "a") {
      return () => {
        return target?.a ?? target?.[3];
      };
    }
    const got = safeGet(target, name) ?? (name == "value" ? safeGet(target, $value) : null);
    if (typeof got == "function") {
      return new Proxy(typeof got == "function" ? got?.bind?.(target) : got, new ObserveArrayMethod(name, target, this));
    }
    return got;
  }
  //
  set(target, name, value) {
    if (typeof name != "symbol") {
      if (Number.isInteger(parseInt(name))) {
        name = parseInt(name) ?? name;
      }
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
      callByProp(target, tProp, cb);
    } else {
      callByAllProp(target, cb);
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
          return callByProp?.(obj?.[0], obj?.[1], cb);
        }
        if (prop != null && prop != Symbol.iterator) {
          return callByProp?.(obj, prop, cb);
        }
        return callByAllProp?.(obj, cb);
      });
    }
  }
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
  if (isACompute) {
    a[1] = a_prop;
  }
  const isBProp = (isKeyType(b?.[1]) || b?.[1] == Symbol.iterator) && b?.length == 2;
  let b_prop = isBProp && !isBCompute ? b?.[1] : Array.isArray(b) ? null : prop;
  if (!isBProp && !isBCompute) {
    b = [b, b_prop];
  }
  if (isBCompute) {
    b[1] = b_prop;
  }
  if (a_prop == null || b_prop == null || isArrayInvalidKey(a_prop, a?.[0]) || isArrayInvalidKey(b_prop, b?.[0])) {
    return;
  }
  if (!((typeof b?.[0] == "object" || typeof b?.[0] == "function") && b?.[0] != null) && !Array.isArray(a[0])) {
    $avoidTrigger(b, () => {
      a[0][a_prop] = b?.[0];
    });
    return () => {
    };
  }
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
  let store = { dispose, cmpfx: cmpBFnc };
  const a_tmp = aRef?.deref?.(), b_tmp = bRef?.deref?.();
  if (aRef instanceof WeakRef) {
    if (assignMap?.get?.(a_tmp)?.get?.(a_prop)?.bound != b_tmp) {
      assignMap?.get?.(a_tmp)?.delete?.(a_prop);
    }
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
const computed = (src, cb, behavior, prop = "value") => {
  const isACompute = typeof src?.[1] == "function" && src?.length == 2;
  const isAProp = (isKeyType(src?.[1]) || src?.[1] == Symbol.iterator) && src?.length == 2;
  let a_prop = isAProp && !isACompute ? src?.[1] : Array.isArray(src) ? null : prop;
  if (!isAProp && !isACompute) {
    src = [isAProp ? src?.[0] : src, a_prop];
  }
  if (isACompute) {
    src[1] = a_prop;
  }
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
  const initial = cmp();
  const rf = observe({
    [$promise]: void 0,
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
  const wel = toRef(element);
  const wv = toRef(reactiveValue);
  if (animationType === "morph") {
    const properties = propertyOrProperties;
    handleMorphStyleChange(deref$1(wel), properties, options);
    affected(reactiveValue, (newValue) => {
      handleMorphStyleChange(deref$1(wel), properties, options);
    });
    return unsubscribe;
  } else {
    const property = propertyOrProperties;
    const handler = animationType === "animate" ? handleAnimatedStyleChange : animationType === "transition" ? handleTransitionStyleChange : handleSpringStyleChange;
    handler(deref$1(wel), property, $getValue(deref$1(wv)), options);
    affected(reactiveValue, (newValue) => {
      handler(deref$1(wel), property, newValue, options);
    });
    return unsubscribe;
  }
}

const elMap$1 = new DoubleWeakMap();
const alives = new FinalizationRegistry((unsub) => unsub?.());
const $mapped = Symbol.for("@mapped");
const $virtual = Symbol.for("@virtual");
const $behavior = Symbol.for("@behavior");
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
  const wel = toRef(element);
  const rf = toRef(ref);
  const ctrlCb = (_ev) => {
    $set$1(rf, "value", deref$1(wel)?.[prop ?? "value"] ?? $getValue(deref$1(rf)));
  };
  const hdl = { click: ctrlCb, input: ctrlCb, change: ctrlCb };
  ctrlCb?.();
  handleListeners?.(element, "addEventListener", hdl);
  $set$1(rf, "value", element?.[prop ?? "value"] ?? $getValue(deref$1(ref)));
  return () => handleListeners?.(element, "removeEventListener", hdl);
};
const $observeAttribute = (el, ref, prop = "") => {
  toRef(el);
  const wv = toRef(ref);
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
const bindHandler = (element, value, prop, handler, set, withObserver) => {
  const wel = toRef(element);
  element = deref$1(wel);
  if (!element || !(element instanceof Node || element?.element instanceof Node)) return;
  let controller = null;
  controller?.abort?.();
  controller = new AbortController();
  const wv = toRef(value);
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
  if (!addToBank(element, handler, prop, [value, unsub])) ;
};
const bindWith = (el, prop, value, handler, set, withObserver) => {
  handler(el, prop, value);
  return bindHandler(el, value, prop, handler, set, withObserver);
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
      handleAttribute(wel?.deref?.(), "aria-" + (prop?.toString?.() || prop || ""), value);
      bindHandler(wel, value, prop, handleAttribute, weak, true);
    });
    addToCallChain(aria, Symbol.dispose, usub);
    addToCallChain(element, Symbol.dispose, usub);
  } else {
    console.warn("Invalid ARIA object:", aria);
  }
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
      this.element;
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
    let updated = this.#updater?.(newEl, indexOf(this.boundParent, oldEl), oldEl, op, this.boundParent);
    if (newEl != null && newEl != this.#oldNode) {
      this.#oldNode = newEl;
    } else if (newEl == null && oldEl != this.#oldNode) {
      this.#oldNode = oldEl;
    }
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
    return el = $getBase(mapper?.(el, index), null, -1);
  }
  if (el instanceof WeakRef || typeof el?.deref == "function") {
    el = el.deref();
  }
  if (el instanceof Promise || typeof el?.then == "function") {
    return $makePromisePlaceholder(el, (nd) => $getBase(nd, mapper, index));
  }
  if (isElement(el) && !el?.element) {
    return el;
  } else if (isElement(el?.element)) {
    return el;
  } else if (hasValue(el)) {
    return (el instanceof HTMLElement ? Q : C)(el);
  } else if (typeof el == "object" && el != null) {
    return getMapped(el);
  } else if (typeof el == "function") {
    return $getBase(el?.(), mapper, index);
  }
  if (isPrimitive(el) && el != null) return T(el);
  return document.createComment(":NULL:");
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
  if (isWeakCompatible(el) && !isElement(el)) {
    if (elMap.has(el)) {
      const obj = getMapped(el) ?? $getBase(el, mapper, index);
      return $getLeaf(obj instanceof WeakRef ? obj?.deref?.() : obj, requestor);
    }
    const $node = $getBase(el, mapper, index);
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
  if (parent?.parentNode == child?.parentNode) {
    return;
  }
  if (isElement(child)) {
    appendOrEmplaceByIndex(parent, child, index);
  }
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
      this.element;
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
      if (args?.[0] instanceof Promise || typeof args?.[0]?.then == "function") {
        return null;
      }
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
    };
    clearPlaceholdersFromAttributesOfElement(el);
    if (!EMap?.has?.(el)) {
      EMap?.set?.(el, E(el, bindings));
    }
  }
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
    const parser = new DOMParser(), doc = parser.parseFromString(sourceCode, "text/html");
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
      connectElement(node, atb);
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
  return getNode(str);
};

const checkboxCtrl = (ref) => {
  ref = toRef(ref);
  return (ev) => {
    const $ref = unref(ref);
    if ($ref != null) {
      $ref.value = Q(`input[type="radio"], input[type="checkbox"], input:checked`, ev?.target)?.checked ?? $ref?.value;
    }
  };
};
const numberCtrl = (ref) => {
  ref = toRef(ref);
  return (ev) => {
    const $ref = unref(ref);
    if ($ref != null && isNotEqual($ref?.value, ev?.target?.valueAsNumber)) {
      $ref.value = Number(Q("input", ev?.target)?.valueAsNumber || 0) ?? 0;
    }
  };
};
const valueCtrl = (ref) => {
  ref = toRef(ref);
  return (ev) => {
    const $ref = unref(ref);
    if ($ref != null && isNotEqual(ev?.target?.value, $ref?.value)) {
      $ref.value = (Q("input", ev?.target)?.value ?? $ref?.value) || "";
    }
  };
};

observe({
  index: 0,
  length: 0,
  action: "MANUAL",
  view: "",
  canBack: false,
  canForward: false,
  entries: []
});
typeof history != "undefined" ? history.pushState.bind(history) : void 0;
typeof history != "undefined" ? history.replaceState.bind(history) : void 0;
typeof history != "undefined" ? history.go.bind(history) : void 0;
typeof history != "undefined" ? history.forward.bind(history) : void 0;
typeof history != "undefined" ? history.back.bind(history) : void 0;

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
let options = {};
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
      }
    };
    addEventListener("storage", list);
    return [() => {
      unsb?.();
      removeEventListener("storage", list);
    }, ref2];
  });
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
      if (box == "content-box") {
        val.value = axis == "inline" ? entries[0].contentBoxSize[0].inlineSize : entries[0].contentBoxSize[0].blockSize;
      }
      if (box == "device-pixel-content-box") {
        val.value = axis == "inline" ? entries[0].devicePixelContentBoxSize[0].inlineSize : entries[0].devicePixelContentBoxSize[0].blockSize;
      }
    }
  });
  if ((element?.element ?? element?.self ?? element) instanceof HTMLElement) {
    obs?.observe?.(element?.element ?? element?.self ?? element, { box });
  }
  return () => obs?.disconnect?.();
};
const scrollLink = (element, exists, axis, initial) => {
  const wel = element instanceof WeakRef ? element : new WeakRef(element);
  if (initial != null && typeof (initial?.value ?? initial) == "number") {
    element?.scrollTo?.({ [axis == "block" ? "top" : "left"]: initial?.value ?? initial });
  }
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

const makeRef = (host, type, link, ...args) => {
  if (link == attrLink || link == handleAttribute) {
    const exists = elMap$1?.get?.(host)?.get?.(handleAttribute)?.get?.(args[0])?.[0];
    if (exists) {
      return exists;
    }
  }
  const rf = (type ?? ref)?.(null), usub = link?.(host, rf, ...args);
  if (usub && rf) addToCallChain(rf, Symbol.dispose, usub);
  return rf;
};
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

const styleCache = /* @__PURE__ */ new Map();
const styleElementCache = /* @__PURE__ */ new WeakMap();
const propStore = /* @__PURE__ */ new WeakMap();
const CSM = /* @__PURE__ */ new WeakMap();
const camelToKebab = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
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
    const adopted = loadAsAdopted(resolvedSrc, "ux-layer");
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
function GLitElement(derivate) {
  const Base = HTMLElement;
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

const ROOT = typeof document != "undefined" ? document?.documentElement : null;
const $set = (rv, key, val) => {
  if (rv?.deref?.() != null) {
    return rv.deref()[key] = val;
  }
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
  if (parent) {
    doContentObserve(parent);
  }
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
    const bindings = addEvents(ROOT, handler);
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
  const wr = new WeakRef(ref);
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
  function destroy() {
    listening.forEach((ub) => ub?.());
  }
  addToCallChain(ref, Symbol.dispose, destroy);
  return ref;
}

const elementPointerMap = /* @__PURE__ */ new WeakMap();
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
const grabForDrag = (em, ex = { pointerId: 0, pointerType: "mouse" }, {
  shifting = [0, 0],
  result = [{ value: 0 }, { value: 0 }]
} = {}) => {
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

function WorkerWrapper(options) {
  return new Worker(
    ""+new URL('../assets/OPFS.uniform.worker-SMXcClFZ.js', import.meta.url).href+"",
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
  const p1 = !dest?.trim()?.endsWith("/") ? dest + "/" : dest;
  return !p1?.startsWith("/") ? "/" + p1 : p1;
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
const directoryCacheMap = /* @__PURE__ */ new Map();
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
async function remove(rootHandle, relPath, options = {}, logger = defaultLogger) {
  try {
    return removeFile(rootHandle, relPath, { recursive: true, ...options }, logger);
  } catch (e) {
    return handleError(logger, "error", `remove: ${e.message}`);
  }
}
const downloadFile = async (file) => {
  if (file instanceof FileSystemFileHandle) {
    file = await file.getFile();
  }
  if (typeof file == "string") {
    file = await provide(file);
  }
  const filename = file?.name;
  if (!filename) return;
  if ("msSaveOrOpenBlob" in self.navigator) {
    self.navigator.msSaveOrOpenBlob(file, filename);
  }
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
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href);
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
const dropFile = async (file, dest = "/user/"?.trim?.()?.replace?.(/\s+/g, "-"), current) => {
  const fs = await resolveRootHandle(null);
  const path = getDir(dest?.trim?.()?.startsWith?.("/user/") ? dest?.replace?.(/^\/user/g, "")?.trim?.() : dest);
  const user = path?.replace?.("/user", "")?.trim?.();
  file = file instanceof File ? file : new File([file], UUIDv4() + "." + (file?.type?.split?.("/")?.[1] || "tmp"));
  const fp = user + (file?.name || "wallpaper")?.trim?.()?.replace?.(/\s+/g, "-");
  await writeFile(fs, fp, file);
  return "/user" + fp?.trim?.();
};
const uploadFile = async (dest = "/user/"?.trim?.()?.replace?.(/\s+/g, "-"), current) => {
  const $e = "showOpenFilePicker";
  dest = dest?.trim?.()?.startsWith?.("/user/") ? dest?.trim?.()?.replace?.(/^\/user/g, "")?.trim?.() : dest;
  const showOpenFilePicker = window?.[$e]?.bind?.(window) ?? (await __vitePreload(() => import('./showOpenFilePicker.js'),true              ?[]:void 0,import.meta.url))?.[$e];
  return showOpenFilePicker({ ...generalFileImportDesc, multiple: true })?.then?.(async (handles = []) => {
    for (const handle of handles) {
      const file = handle instanceof File ? handle : await handle?.getFile?.();
      await dropFile(file, dest);
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
          if (nwd) tasks.push(copyFromOneHandlerToAnother(handle, nwd, { }));
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
                await copyFromOneHandlerToAnother(srcHandle.handle, nwd, { });
              } else {
                const file = await srcHandle.handle.getFile();
                const path = destPath + name;
                await writeFile(resolvedRoot, path, file);
              }
            }
          }));
        } else {
          tasks.push(Promise.try(async () => {
            const file = await provide(url);
            if (file) {
              const path = destPath + file.name;
              await writeFile(resolvedRoot, path, file);
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
  fnMatch[1];
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
    const Z = 0.5 * (fixedClientZoom?.());
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
  const color = pickBgColor(window.innerWidth - 64, 10);
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

const colorScheme = async () => {
  dynamicNativeFrame();
  dynamicBgColors();
};
if (typeof document != "undefined") {
  requestAnimationFrame(() => colorScheme?.());
  dynamicTheme?.();
}

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

const createRect2D = (x = 0, y = 0, width = 0, height = 0) => ({
  position: vector2Ref(x, y),
  size: vector2Ref(width, height)
});
const clampPointToRect = (point, rect) => {
  return new Vector2D(
    operated([point.x, rect.position.x, rect.size.x], () => Math.max(rect.position.x.value, Math.min(point.x.value, rect.position.x.value + rect.size.x.value))),
    operated([point.y, rect.position.y, rect.size.y], () => Math.max(rect.position.y.value, Math.min(point.y.value, rect.position.y.value + rect.size.y.value)))
  );
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
				else if( cInt == 44/*','*/ ) ; else {
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
					if( !result.protoDef && !result.cls ) ;
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
					if( this.getTime()=== -621672192e5) 
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
			let index2 = (index1>=0) && (n*4+2)<buf.length?decodings[buf[n*4+2]]:-1;
			let index3 = (index2>=0) && (n*4+3)<buf.length?decodings[buf[n*4+3]]:-1;
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

[ [ 0,256,[ 0xffd9ff,0xff6aff,0x1fc00,0x380000,0x0,0xfffff8,0xffffff,0x7fffff] ]
].map( row=>{ return { firstChar : row[0], lastChar: row[1], bits : row[2] }; } );

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
const splitPath = (path) => String(path || "").split("/").filter(Boolean);
const ensureDir = (p) => p.endsWith("/") ? p : p + "/";
const joinPath$1 = (parts, absolute = true) => (absolute ? "/" : "") + parts.filter(Boolean).join("/");
const sanitizePathSegments = (path) => {
  const parts = splitPath(path);
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
  const hasFileToken = !isDirHint && splitPath(raw).length > 0 && raw.includes(".");
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

const SETTINGS_KEY = "rs-settings";
const DB_NAME = "req-store";
const STORE = "settings";
const isContentScriptContext = () => {
  try {
    if (typeof chrome === "undefined" || !chrome?.runtime) return false;
    if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
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
const WebDavSync = (address, options = {}) => {
  const client = an(getHostOnly(address), options);
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
      const client = WebDavSync(settings.webdav.url, {
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
  currentWebDav.sync = WebDavSync(settings.webdav.url, {
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

export { $originalKey$, $originalObjects$, $trigger, CSSBinder, DEFAULT_SETTINGS, E, GLitElement, H, JSOX, M, MOCElement, Q, ROOT$1 as ROOT, ReactiveElementSize, Vector2D, __vitePreload, addEvent, addToCallChain, affected, appendFix, assign, attrRef, bbh, bbw, bindCtrl, bindDraggable, bindWith, booleanRef, cbh, cbw, clampPointToRect, computed, conditional, createChromeExtensionBroadcast, createQueuedOptimizedWorkerChannel, createRect2D, ctxMenuTrigger, defineElement, doObserve, downloadFile, getDir, getDirectoryHandle, getFileHandle, getMimeTypeByFilename, getNode, handleAttribute, handleHidden, handleIncomingEntries, handleProperty, handleStyleChange, isElement, isInFocus, isValidParent$1 as isValidParent, iterated, lazyAddEventListener, loadAsAdopted, loadInlineStyle, loadSettings, makeClickOutsideTrigger, makeShiftTrigger, numberRef, observableByMap, observe, openDirectory, operated, preloadStyle, propRef, property, provide, ref, registerSidebar, remove, removeAdopted, removeChild, replaceOrSwap, safe, saveSettings, setChecked, setIdleInterval$1 as setIdleInterval, setStyleProperty, stringRef, uploadFile, valueAsNumberRef, valueRef, vector2Ref, writeFile, writeFileSmart };
//# sourceMappingURL=Settings.js.map
