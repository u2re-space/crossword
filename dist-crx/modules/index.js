var WStatus = /* @__PURE__ */ ((WStatus2) => {
  WStatus2["SUCCESS"] = "success";
  WStatus2["ERROR"] = "error";
  return WStatus2;
})(WStatus || {});
var WType = /* @__PURE__ */ ((WType2) => {
  WType2["PRIMITIVE"] = "primitive";
  WType2["NUMBER"] = "number";
  WType2["STRING"] = "string";
  WType2["BOOLEAN"] = "boolean";
  WType2["BIGINT"] = "bigint";
  WType2["UNDEFINED"] = "undefined";
  WType2["NULL"] = "null";
  WType2["OBJECT"] = "object";
  WType2["FUNCTION"] = "function";
  WType2["ARRAY"] = "array";
  WType2["MAP"] = "map";
  WType2["SET"] = "set";
  WType2["SYMBOL"] = "symbol";
  WType2["WEAK_REF"] = "weakRef";
  WType2["PROMISE"] = "promise";
  WType2["UNKNOWN"] = "unknown";
  return WType2;
})(WType || {});
var WReflectAction = /* @__PURE__ */ ((WReflectAction2) => {
  WReflectAction2["GET"] = "get";
  WReflectAction2["SET"] = "set";
  WReflectAction2["CALL"] = "call";
  WReflectAction2["APPLY"] = "apply";
  WReflectAction2["CONSTRUCT"] = "construct";
  WReflectAction2["DELETE"] = "delete";
  WReflectAction2["DELETE_PROPERTY"] = "deleteProperty";
  WReflectAction2["HAS"] = "has";
  WReflectAction2["OWN_KEYS"] = "ownKeys";
  WReflectAction2["GET_OWN_PROPERTY_DESCRIPTOR"] = "getOwnPropertyDescriptor";
  WReflectAction2["GET_PROPERTY_DESCRIPTOR"] = "getPropertyDescriptor";
  WReflectAction2["GET_PROTOTYPE_OF"] = "getPrototypeOf";
  WReflectAction2["SET_PROTOTYPE_OF"] = "setPrototypeOf";
  WReflectAction2["IS_EXTENSIBLE"] = "isExtensible";
  WReflectAction2["PREVENT_EXTENSIONS"] = "preventExtensions";
  WReflectAction2["TRANSFER"] = "transfer";
  WReflectAction2["IMPORT"] = "import";
  WReflectAction2["DISPOSE"] = "dispose";
  return WReflectAction2;
})(WReflectAction || {});

function detectTransportType$1(transport) {
  if (transport instanceof Worker) return "worker";
  if (typeof SharedWorker !== "undefined" && transport instanceof SharedWorker) return "shared-worker";
  if (transport instanceof MessagePort) return "message-port";
  if (transport instanceof BroadcastChannel) return "broadcast";
  if (transport instanceof WebSocket) return "websocket";
  if (typeof chrome !== "undefined" && transport && typeof transport === "object" && typeof transport.postMessage === "function" && transport.onMessage?.addListener) {
    return "chrome-port";
  }
  if (transport === "chrome-runtime") return "chrome-runtime";
  if (transport === "chrome-tabs") return "chrome-tabs";
  if (transport === "chrome-port") return "chrome-port";
  if (transport === "chrome-external") return "chrome-external";
  if (transport === "socket-io") return "socket-io";
  if (transport === "service-worker-client") return "service-worker";
  if (transport === "service-worker-host") return "service-worker";
  if (transport === "shared-worker") return "shared-worker";
  if (transport === "rtc-data") return "rtc-data";
  if (transport === "atomics") return "atomics";
  if (transport === "self") return "self";
  return "internal";
}
function getTransportMeta(transport) {
  const type = detectTransportType$1(transport);
  const meta = {
    "worker": { transfer: true, binary: true, bidirectional: true, broadcast: false, persistent: true },
    "shared-worker": { transfer: true, binary: true, bidirectional: true, broadcast: true, persistent: true },
    "service-worker": { transfer: true, binary: true, bidirectional: true, broadcast: true, persistent: true },
    "broadcast": { transfer: false, binary: false, bidirectional: false, broadcast: true, persistent: false },
    "message-port": { transfer: true, binary: true, bidirectional: true, broadcast: false, persistent: false },
    "websocket": { transfer: false, binary: true, bidirectional: true, broadcast: false, persistent: true },
    "chrome-runtime": { transfer: false, binary: false, bidirectional: true, broadcast: true, persistent: false },
    "chrome-tabs": { transfer: false, binary: false, bidirectional: true, broadcast: false, persistent: false },
    "chrome-port": { transfer: false, binary: false, bidirectional: true, broadcast: false, persistent: true },
    "chrome-external": { transfer: false, binary: false, bidirectional: true, broadcast: false, persistent: false },
    "socket-io": { transfer: false, binary: true, bidirectional: true, broadcast: true, persistent: true },
    "rtc-data": { transfer: false, binary: true, bidirectional: true, broadcast: false, persistent: true },
    "atomics": { transfer: false, binary: true, bidirectional: true, broadcast: false, persistent: true },
    "self": { transfer: true, binary: true, bidirectional: true, broadcast: false, persistent: true },
    "internal": { transfer: false, binary: false, bidirectional: true, broadcast: false, persistent: false }
  };
  return { type, supports: meta[type] };
}
function createTransportSender(transport, options) {
  return (msg, transfer) => {
    const transferable = transfer ?? msg?.transferable ?? [];
    const { transferable: _, ...data } = msg;
    if (transport instanceof Worker) {
      transport.postMessage(data, { transfer: transferable });
      return;
    }
    if (typeof SharedWorker !== "undefined" && transport instanceof SharedWorker) {
      transport.port.postMessage(data, { transfer: transferable });
      return;
    }
    if (transport instanceof MessagePort) {
      transport.postMessage(data, { transfer: transferable });
      return;
    }
    if (transport instanceof BroadcastChannel) {
      transport.postMessage(data);
      return;
    }
    if (transport instanceof WebSocket) {
      if (transport.readyState === WebSocket.OPEN) {
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          transport.send(data);
        } else {
          transport.send(JSON.stringify(data));
        }
      }
      return;
    }
    if (transport === "chrome-runtime") {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(data);
      }
      return;
    }
    if (transport === "chrome-tabs") {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const tabId = options?.tabId ?? msg?._tabId;
        if (tabId != null) chrome.tabs.sendMessage(tabId, data);
      }
      return;
    }
    if (transport === "chrome-port") {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        const portName = options?.portName ?? msg?._portName;
        if (portName) {
          const tabId = options?.tabId ?? msg?._tabId;
          const port = tabId != null && chrome.tabs?.connect ? chrome.tabs.connect(tabId, { name: portName }) : chrome.runtime.connect({ name: portName });
          port.postMessage(data);
        }
      }
      return;
    }
    if (transport === "chrome-external") {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        const externalId = options?.externalId ?? msg?._externalId;
        if (externalId) chrome.runtime.sendMessage(externalId, data);
      }
      return;
    }
    if (transport === "service-worker-client") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage(data, transferable);
        });
      }
      return;
    }
    if (transport === "service-worker-host") {
      if (typeof clients !== "undefined") {
        const clientId = options?.clientId ?? msg?._clientId;
        if (clientId) {
          clients.get(clientId).then((c) => c?.postMessage(data, transferable));
        } else {
          clients.matchAll({ includeUncontrolled: true }).then((all) => {
            all.forEach((c) => c.postMessage(data, transferable));
          });
        }
      }
      return;
    }
    if (transport === "self") {
      if (typeof self !== "undefined" && "postMessage" in self) {
        self.postMessage(data, { transfer: transferable });
      }
      return;
    }
  };
}
function createTransportListener(transport, onMessage, onError, onClose, options) {
  const msgHandler = (e) => {
    if (transport instanceof WebSocket && typeof e.data === "string") {
      try {
        onMessage(JSON.parse(e.data));
      } catch (err) {
        onError?.(err);
      }
    } else if (transport instanceof WebSocket && e.data instanceof ArrayBuffer) {
      onMessage(e.data);
    } else {
      onMessage(e.data);
    }
  };
  const errHandler = (e) => {
    onError?.(new Error(e.message ?? "Transport error"));
  };
  const closeHandler = () => onClose?.();
  if (transport instanceof Worker) {
    transport.addEventListener("message", msgHandler);
    transport.addEventListener("error", errHandler);
    return () => {
      transport.removeEventListener("message", msgHandler);
      transport.removeEventListener("error", errHandler);
    };
  }
  if (typeof SharedWorker !== "undefined" && transport instanceof SharedWorker) {
    transport.port.addEventListener("message", msgHandler);
    transport.port.addEventListener("messageerror", errHandler);
    transport.port.start();
    return () => {
      transport.port.removeEventListener("message", msgHandler);
      transport.port.removeEventListener("messageerror", errHandler);
      transport.port.close();
    };
  }
  if (transport instanceof MessagePort) {
    transport.addEventListener("message", msgHandler);
    transport.start();
    return () => {
      transport.removeEventListener("message", msgHandler);
      transport.close();
    };
  }
  if (transport instanceof BroadcastChannel) {
    transport.addEventListener("message", msgHandler);
    return () => {
      transport.removeEventListener("message", msgHandler);
      transport.close();
    };
  }
  if (transport instanceof WebSocket) {
    transport.addEventListener("message", msgHandler);
    transport.addEventListener("error", errHandler);
    transport.addEventListener("close", closeHandler);
    return () => {
      transport.removeEventListener("message", msgHandler);
      transport.removeEventListener("error", errHandler);
      transport.removeEventListener("close", closeHandler);
      if (transport.readyState === WebSocket.OPEN) {
        transport.close();
      }
    };
  }
  if (transport === "chrome-runtime") {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      const listener = (msg) => {
        onMessage(msg);
        return false;
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }
  if (transport === "chrome-tabs") {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      const tabId = options?.tabId;
      if (tabId != null) {
        return createChromeTabsListener(tabId, (msg) => onMessage(msg));
      }
      const listener = (msg) => {
        onMessage(msg);
        return false;
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }
  if (transport === "chrome-port") {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      const portName = options?.portName;
      if (portName) {
        const port = chrome.runtime.connect({ name: portName });
        port.onMessage.addListener(onMessage);
        port.onDisconnect.addListener(closeHandler);
        return () => port.disconnect();
      }
    }
  }
  if (transport === "chrome-external") {
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
      const listener = (msg) => {
        onMessage(msg);
        return false;
      };
      chrome.runtime.onMessageExternal.addListener(listener);
      return () => chrome.runtime.onMessageExternal.removeListener(listener);
    }
  }
  if (transport === "service-worker-client") {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", msgHandler);
      return () => navigator.serviceWorker.removeEventListener("message", msgHandler);
    }
  }
  if (transport === "service-worker-host" || transport === "self") {
    const handler = (e) => {
      const clientId = transport === "service-worker-host" ? e.source?.id : void 0;
      onMessage(clientId ? { ...e.data, _clientId: clientId } : e.data);
    };
    self.addEventListener("message", handler);
    return () => self.removeEventListener("message", handler);
  }
  return () => {
  };
}
function createChromeListener(onMessage, options) {
  if (typeof chrome === "undefined" || !chrome.runtime) return () => {
  };
  const listener = (message, sender, sendResponse) => onMessage(message, sendResponse, sender);
  if (options?.external && chrome.runtime.onMessageExternal) {
    chrome.runtime.onMessageExternal.addListener(listener);
    return () => chrome.runtime.onMessageExternal.removeListener(listener);
  }
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
function createChromeTabsListener(tabId, onMessage) {
  if (typeof chrome === "undefined" || !chrome.runtime) return () => {
  };
  const listener = (msg, sender) => {
    if (sender.tab?.id === tabId) {
      onMessage(msg, sender);
    }
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
function createWebSocketTransport(url, options = {}) {
  let socket = new WebSocket(url, options.protocols);
  if (options.binaryType) socket.binaryType = options.binaryType;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  const send = (msg, transfer) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    if (msg instanceof ArrayBuffer || ArrayBuffer.isView(msg)) {
      socket.send(msg);
    } else {
      socket.send(JSON.stringify(msg));
    }
  };
  const reconnect = () => {
    if (reconnectAttempts >= (options.maxReconnectAttempts ?? 5)) return;
    reconnectAttempts++;
    socket = new WebSocket(url, options.protocols);
    if (options.binaryType) socket.binaryType = options.binaryType;
  };
  const close = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket.close();
  };
  if (options.reconnect) {
    socket.addEventListener("close", () => {
      reconnectTimer = setTimeout(reconnect, options.reconnectInterval ?? 3e3);
    });
  }
  return {
    socket,
    send,
    listen: (handler) => {
      const h = (e) => {
        if (typeof e.data === "string") {
          try {
            handler(JSON.parse(e.data));
          } catch {
          }
        } else {
          handler(e.data);
        }
      };
      socket.addEventListener("message", h);
      return () => socket.removeEventListener("message", h);
    },
    reconnect,
    close
  };
}
function createBroadcastTransport(channelName) {
  const channel = new BroadcastChannel(channelName);
  return {
    channel,
    send: (msg) => channel.postMessage(msg),
    listen: (handler) => {
      const h = (e) => handler(e.data);
      channel.addEventListener("message", h);
      return () => channel.removeEventListener("message", h);
    },
    close: () => channel.close()
  };
}
const TransportCoreFactory = {
  createSender: createTransportSender,
  createListener: createTransportListener,
  detectType: detectTransportType$1,
  getMeta: getTransportMeta,
  chrome: {
    createListener: createChromeListener,
    createTabsListener: createChromeTabsListener
  },
  websocket: createWebSocketTransport,
  broadcast: createBroadcastTransport
};

if (typeof Promise !== "undefined" && typeof Promise.try !== "function") {
  Promise.try = function(callbackOrValue, ...args) {
    try {
      if (typeof callbackOrValue === "function") {
        return Promise.resolve(callbackOrValue(...args));
      }
      return Promise.resolve(callbackOrValue);
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

function createDeferred() {
  let resolve;
  let reject;
  let isResolved = false;
  let isRejected = false;
  const promise = new Promise((res, rej) => {
    resolve = (value) => {
      if (!isResolved && !isRejected) {
        isResolved = true;
        res(value);
      }
    };
    reject = (error) => {
      if (!isResolved && !isRejected) {
        isRejected = true;
        rej(error);
      }
    };
  });
  return {
    promise,
    resolve,
    reject,
    get isResolved() {
      return isResolved;
    },
    get isRejected() {
      return isRejected;
    }
  };
}
class AsyncQueue {
  queue = [];
  processing = false;
  async add(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }
  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      await operation();
    }
    this.processing = false;
  }
  get length() {
    return this.queue.length;
  }
  get isProcessing() {
    return this.processing;
  }
}
function withTimeout(promise, timeoutMs, timeoutMessage = "Operation timed out") {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}
async function retry(operation, maxRetries = 3, initialDelay = 1e3, backoffMultiplier = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
async function concurrentLimit(operations, limit) {
  const results = [];
  const executing = [];
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    const promise = Promise.resolve().then(async () => {
      try {
        const result = await operation();
        results[i] = result;
      } catch (error) {
        throw error;
      }
    });
    results[i] = void 0;
    executing.push(promise);
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }
  }
  await Promise.all(executing);
  return results;
}

class ChannelRegistry {
  channels = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Map();
  /**
   * Register a channel
   */
  register(name, channel) {
    this.channels.set(name, channel);
    const listeners = this.listeners.get(name);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(channel);
        } catch (error) {
          console.error(`[ChannelRegistry] Listener error for ${name}:`, error);
        }
      }
    }
    return channel;
  }
  /**
   * Get a registered channel
   */
  get(name) {
    return this.channels.get(name);
  }
  /**
   * Check if a channel is registered
   */
  has(name) {
    return this.channels.has(name);
  }
  /**
   * Unregister a channel
   */
  unregister(name) {
    const existed = this.channels.delete(name);
    if (existed) {
      const listeners = this.listeners.get(name);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(null);
          } catch (error) {
            console.error(`[ChannelRegistry] Unregister listener error for ${name}:`, error);
          }
        }
      }
    }
    return existed;
  }
  /**
   * Listen for channel registration/unregistration
   */
  onChannelChange(name, listener) {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, /* @__PURE__ */ new Set());
    }
    const listeners = this.listeners.get(name);
    listeners.add(listener);
    if (this.channels.has(name)) {
      try {
        listener(this.channels.get(name));
      } catch (error) {
        console.error(`[ChannelRegistry] Initial listener error for ${name}:`, error);
      }
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(name);
      }
    };
  }
  /**
   * Get all registered channel names
   */
  getChannelNames() {
    return Array.from(this.channels.keys());
  }
  /**
   * Clear all channels and listeners
   */
  clear() {
    this.channels.clear();
    this.listeners.clear();
  }
}
const globalChannelRegistry = new ChannelRegistry();
function createChannelProxy(channel, methods) {
  const proxy = {};
  for (const method of methods) {
    proxy[method] = (...args) => {
      return channel.request(method, args);
    };
  }
  return proxy;
}
class ChannelHealthMonitor {
  healthChecks = /* @__PURE__ */ new Map();
  intervals = /* @__PURE__ */ new Map();
  healthStatus = /* @__PURE__ */ new Map();
  /**
   * Register a health check for a channel
   */
  registerHealthCheck(channelName, healthCheck, intervalMs = 3e4) {
    this.healthChecks.set(channelName, healthCheck);
    const existingInterval = this.intervals.get(channelName);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    const interval = setInterval(async () => {
      try {
        const isHealthy = await healthCheck();
        this.healthStatus.set(channelName, isHealthy);
        if (!isHealthy) {
          console.warn(`[ChannelHealth] Channel '${channelName}' is unhealthy`);
        }
      } catch (error) {
        console.error(`[ChannelHealth] Health check failed for '${channelName}':`, error);
        this.healthStatus.set(channelName, false);
      }
    }, intervalMs);
    this.intervals.set(channelName, interval);
    healthCheck().then((isHealthy) => {
      this.healthStatus.set(channelName, isHealthy);
    }).catch(() => {
      this.healthStatus.set(channelName, false);
    });
  }
  /**
   * Get health status of a channel
   */
  isHealthy(channelName) {
    return this.healthStatus.get(channelName) ?? false;
  }
  /**
   * Get all health statuses
   */
  getAllHealthStatuses() {
    const result = {};
    for (const [name, status] of this.healthStatus) {
      result[name] = status;
    }
    return result;
  }
  /**
   * Stop monitoring a channel
   */
  stopMonitoring(channelName) {
    const interval = this.intervals.get(channelName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(channelName);
    }
    this.healthChecks.delete(channelName);
    this.healthStatus.delete(channelName);
  }
  /**
   * Stop all monitoring
   */
  stopAllMonitoring() {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.healthChecks.clear();
    this.healthStatus.clear();
  }
}
const globalChannelHealthMonitor = new ChannelHealthMonitor();

WeakMap.prototype.getOrInsert ??= function(key, defaultValue) {
  if (!this.has(key)) {
    this.set(key, defaultValue);
  }
  return this.get(key);
};
WeakMap.prototype.getOrInsertComputed ??= function(key, callbackFunction) {
  if (!this.has(key)) {
    this.set(key, callbackFunction(key));
  }
  return this.get(key);
};
Map.prototype.getOrInsert ??= function(key, defaultValue) {
  if (!this.has(key)) {
    this.set(key, defaultValue);
  }
  return this.get(key);
};
Map.prototype.getOrInsertComputed ??= function(key, callbackFunction) {
  if (!this.has(key)) {
    this.set(key, callbackFunction(key));
  }
  return this.get(key);
};
const getOrInsert = (map, key, defaultValue = () => null) => {
  if (!map?.has?.(key)) {
    map?.set?.(key, defaultValue?.());
  }
  return map?.get?.(key);
};
const getOrInsertComputed = (map, key, callbackFunction = () => null) => {
  if (!map?.has?.(key)) {
    map?.set?.(key, callbackFunction?.(key));
  }
  return map?.get?.(key);
};

const $fxy = Symbol.for("@fix");
const isHasPrimitives = (observable) => {
  return observable?.some?.(isPrimitive);
};
const isObservable = (observable) => {
  return Array.isArray(observable) || observable instanceof Set || observable instanceof Map;
};
const isPrimitive = (obj) => {
  return typeof obj == "string" || typeof obj == "number" || typeof obj == "boolean" || typeof obj == "bigint" || typeof obj == "undefined" || obj == null;
};
const tryParseByHint = (value, hint) => {
  if (!isPrimitive(value)) return null;
  if (hint == "number") {
    return Number(value) || 0;
  }
  if (hint == "string") {
    return String(value) || "";
  }
  if (hint == "boolean") {
    return !!value;
  }
  return value;
};
const hasProperty = (v, prop = "value") => {
  return (typeof v == "object" || typeof v == "function") && v != null && (prop in v || v?.[prop] != null);
};
const hasValue = (v) => {
  return hasProperty(v, "value");
};
const $getValue = ($objOrPlain) => {
  if (isPrimitive($objOrPlain)) return $objOrPlain;
  return hasValue($objOrPlain) ? $objOrPlain?.value : $objOrPlain;
};
const unwrap = (obj, fallback) => {
  return obj?.[$fxy] ?? (fallback ?? obj);
};
const deref = (obj) => {
  if (obj != null && (typeof obj == "object" || typeof obj == "function") && (obj instanceof WeakRef || typeof obj?.deref == "function")) {
    return deref(obj?.deref?.());
  }
  ;
  return obj;
};
const fixFx = (obj) => {
  if (typeof obj == "function" || obj == null) return obj;
  const fx = function() {
  };
  fx[$fxy] = obj;
  return fx;
};
const $set = (rv, key, val) => {
  rv = deref(rv);
  if (rv != null && (typeof rv == "object" || typeof rv == "function")) {
    return rv[key] = $getValue(val = deref(val));
  }
  ;
  return rv;
};
const getRandomValues = (array) => {
  return crypto?.getRandomValues ? crypto?.getRandomValues?.(array) : (() => {
    const values = new Uint8Array(array.length);
    for (let i = 0; i < array.length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
    return values;
  })();
};
const clamp = (min, val, max) => Math.max(min, Math.min(val, max));
const withCtx = (target, got) => {
  if (typeof got == "function") {
    return got?.bind?.(target) ?? got;
  }
  ;
  return got;
};
const UUIDv4 = () => crypto?.randomUUID ? crypto?.randomUUID?.() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ getRandomValues?.(new Uint8Array(1))?.[0] & 15 >> +c / 4).toString(16));
const camelToKebab = (str) => {
  if (!str) return str;
  return str?.replace?.(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};
const kebabToCamel = (str) => {
  if (!str) return str;
  return str?.replace?.(/-([a-z])/g, (_, char) => char.toUpperCase());
};
const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const clampDimension = (value, max) => {
  if (!Number.isFinite(max) || max <= 0) {
    return 0;
  }
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), max);
};
const roundNearest = (number, N = 1) => Math.round(number * N) / N;
const floorNearest = (number, N = 1) => Math.floor(number * N) / N;
const ceilNearest = (number, N = 1) => Math.ceil(number * N) / N;
const isValueUnit = (val) => typeof CSSStyleValue !== "undefined" && val instanceof CSSStyleValue;
const isVal = (v) => v != null && (typeof v == "boolean" ? v !== false : true) && (typeof v != "object" && typeof v != "function");
const normalizePrimitive = (val) => {
  return typeof val == "boolean" ? val ? "" : null : typeof val == "number" ? String(val) : val;
};
const $triggerLock = Symbol.for("@trigger-lock");
const $avoidTrigger = (ref, cb, $prop = "value") => {
  if (hasProperty(ref, $prop)) ref[$triggerLock] = true;
  let result;
  try {
    result = cb?.();
  } finally {
    if (hasProperty(ref, $prop)) {
      delete ref[$triggerLock];
    }
  }
  return result;
};
const tryStringAsNumber = (val) => {
  if (typeof val != "string") return null;
  const matches = [...val?.matchAll?.(/^\d+(\.\d+)?$/g)];
  if (matches?.length != 1) return null;
  const triedToParse = parseFloat(matches[0][0]);
  if (!Number.isNaN(triedToParse) && Number.isFinite(triedToParse)) {
    return triedToParse;
  }
  ;
  return null;
};
const INTEGER_REGEXP = /^\d+$/g;
const tryStringAsInteger = (val) => {
  if (typeof val != "string") return null;
  val = val?.trim?.();
  if (val == "" || val == null) return null;
  const matches = [...val?.matchAll?.(INTEGER_REGEXP)];
  if (matches?.length != 1) return null;
  const triedToParse = parseInt(matches[0][0]);
  if (!Number.isNaN(triedToParse) && Number.isInteger(triedToParse)) {
    return triedToParse;
  }
  ;
  return null;
};
const isValidNumber = (val) => {
  return typeof val == "number" && !Number.isNaN(val);
};
const canBeInteger = (value) => {
  if (typeof value == "string") {
    return tryStringAsInteger(value) != null;
  } else
    return typeof value == "number" && Number.isInteger(value) && value >= 0;
};
const isArrayOrIterable = (obj) => Array.isArray(obj) || obj != null && typeof obj == "object" && typeof obj[Symbol.iterator] == "function";
const handleListeners = (root, fn, handlers) => {
  root = root instanceof WeakRef ? root.deref() : root;
  const usubs = [...Object.entries(handlers)]?.map?.(([name, cb]) => root?.[fn]?.call?.(root, name, cb));
  return () => {
    usubs?.forEach?.((unsub) => unsub?.());
  };
};
const isRef = (ref) => {
  return ref instanceof WeakRef || typeof ref?.deref == "function";
};
const unref = (ref) => {
  return isRef(ref) ? deref(ref) : ref;
};
const toRef = (ref) => {
  return ref != null ? isRef(ref) ? ref : typeof ref == "function" || typeof ref == "object" ? new WeakRef(ref) : ref : ref;
};
const isValueRef = (exists) => {
  return (typeof exists == "object" || typeof exists == "function") && (exists?.value != null || exists != null && "value" in exists);
};
const isObject$1 = (exists) => {
  return exists != null && (typeof exists == "object" || typeof exists == "function");
};
const getValue = (val) => {
  return hasValue(val) ? val?.value : val;
};
const potentiallyAsync = (promise, cb) => {
  if (promise instanceof Promise || typeof promise?.then == "function") {
    return promise?.then?.(cb);
  } else {
    return cb?.(promise);
  }
  return promise;
};
const potentiallyAsyncMap = (promise, cb) => {
  if (promise instanceof Promise || typeof promise?.then == "function") {
    return promise?.then?.(cb);
  } else {
    return cb?.(promise);
  }
  return promise;
};
const makeTriggerLess = function(self) {
  return (cb) => {
    self[$triggerLock] = true;
    let result;
    try {
      result = cb?.();
    } finally {
      self[$triggerLock] = false;
    }
    return result;
  };
};
const unwrapArray = (arr) => {
  if (Array.isArray(arr)) {
    return arr?.flatMap?.((el) => {
      if (Array.isArray(el)) return unwrapArray(el);
      return el;
    });
  } else {
    return arr;
  }
};
const isNotComplexArray = (arr) => {
  return unwrapArray(arr)?.every?.(isCanJustReturn);
};
const isCanJustReturn = (obj) => {
  return isPrimitive(obj) || typeof SharedArrayBuffer == "function" && obj instanceof SharedArrayBuffer || isTypedArray(obj) || Array.isArray(obj) && isNotComplexArray(obj);
};
const isTypedArray = (value) => {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
};
const isSymbol = (sym) => typeof sym === "symbol" || typeof sym == "object" && Object.prototype.toString.call(sym) == "[object Symbol]";
const isPromise = (target) => {
  return target instanceof Promise || typeof target?.then == "function";
};
const isCanTransfer = (obj) => {
  return isPrimitive(obj) || typeof ArrayBuffer == "function" && obj instanceof ArrayBuffer || typeof MessagePort == "function" && obj instanceof MessagePort || typeof ReadableStream == "function" && obj instanceof ReadableStream || typeof WritableStream == "function" && obj instanceof WritableStream || typeof TransformStream == "function" && obj instanceof TransformStream || typeof ImageBitmap == "function" && obj instanceof ImageBitmap || typeof VideoFrame == "function" && obj instanceof VideoFrame || typeof OffscreenCanvas == "function" && obj instanceof OffscreenCanvas || typeof RTCDataChannel == "function" && obj instanceof RTCDataChannel || // @ts-ignore
  typeof AudioData == "function" && obj instanceof AudioData || // @ts-ignore
  typeof WebTransportReceiveStream == "function" && obj instanceof WebTransportReceiveStream || // @ts-ignore
  typeof WebTransportSendStream == "function" && obj instanceof WebTransportSendStream || // @ts-ignore
  typeof WebTransportReceiveStream == "function" && obj instanceof WebTransportReceiveStream;
};
const defaultByType = (a) => {
  switch (typeof a) {
    case "number":
      return 0;
    case "string":
      return "";
    case "boolean":
      return false;
    case "object":
      return null;
    case "function":
      return null;
    case "symbol":
      return null;
    case "bigint":
      return 0n;
  }
  return void 0;
};

const isIterable = (obj) => typeof obj?.[Symbol.iterator] == "function";
const isKeyType = (prop) => ["symbol", "string", "number"].indexOf(typeof prop) >= 0;
const isValidObj = (obj) => {
  return obj != null && (typeof obj == "function" || typeof obj == "object") && !(obj instanceof WeakRef);
};
const mergeByKey = (items, key = "id") => {
  const entries = Array.from(items?.values?.()).map((I) => [I?.[key], I]);
  const map = new Map(entries);
  return Array.from(map?.values?.() || []);
};
const removeExtra = (target, value, name = null) => {
  const exists = name != null && (typeof target == "object" || typeof target == "function") ? target?.[name] ?? target : target;
  let entries = [];
  if (value instanceof Set || value instanceof Map || Array.isArray(value) || isIterable(value)) {
    entries = (exists instanceof Set || exists instanceof WeakSet ? value?.values?.() : value?.entries?.()) || (Array.isArray(value) || isIterable(value) ? value : []);
  } else if (typeof value == "object" || typeof value == "function") {
    entries = exists instanceof Set || exists instanceof WeakSet ? Object.values(value) : Object.entries(value);
  }
  let exEntries = [];
  if (Array.isArray(exists)) {
    exEntries = exists.entries();
  } else if (exists instanceof Map || exists instanceof WeakMap) {
    exEntries = exists?.entries?.();
  } else if (exists instanceof Set || exists instanceof WeakSet) {
    exEntries = exists?.values?.();
  } else if (typeof exists == "object" || typeof exists == "function") {
    exEntries = Object.entries(exists);
  }
  const keys = new Set(Array.from(entries).map((e) => e?.[0]));
  const exe = new Set(Array.from(exEntries).map((e) => e?.[0]));
  const exclude = keys?.difference?.(exe);
  if (Array.isArray(exists)) {
    const nw = exists.filter((_, I) => !exclude.has(I));
    exists.splice(0, exists.length);
    exists.push(...nw);
  } else if (exists instanceof Map || exists instanceof Set || (exists instanceof WeakMap || exists instanceof WeakSet)) {
    for (const k of exclude) {
      exists.delete(k);
    }
    ;
  } else if (typeof exists == "function" || typeof exists == "object") {
    for (const k of exclude) {
      delete exists[k];
    }
    ;
  }
  ;
  return exists;
};
const objectAssign = (target, value, name = null, removeNotExists = true, mergeKey = "id") => {
  const exists = name != null && (typeof target == "object" || typeof target == "function") ? target?.[name] ?? target : target;
  let entries = null;
  if (removeNotExists) {
    removeExtra(exists, value);
  }
  if (value instanceof Set || value instanceof Map || Array.isArray(value) || isIterable(value)) {
    entries = (exists instanceof Set || exists instanceof WeakSet ? value?.values?.() : value?.entries?.()) || (Array.isArray(value) || isIterable(value) ? value : []);
  } else if (typeof value == "object" || typeof value == "function") {
    entries = exists instanceof Set || exists instanceof WeakSet ? Object.values(value) : Object.entries(value);
  }
  if (exists && entries && (typeof entries == "object" || typeof entries == "function")) {
    if (exists instanceof Map || exists instanceof WeakMap) {
      for (const E of entries) {
        exists.set(...E);
      }
      ;
      return exists;
    }
    if (exists instanceof Set || exists instanceof WeakSet) {
      for (const E of entries) {
        const mergeObj = E?.[mergeKey] ? Array.from(exists?.values?.() || []).find((I) => !isNotEqual?.(I?.[mergeKey], E?.[mergeKey])) : null;
        if (mergeObj != null) {
          objectAssign(mergeObj, E, null, removeNotExists, mergeKey);
        } else {
          exists.add(E);
        }
      }
      return exists;
    }
    if (typeof exists == "object" || typeof exists == "function") {
      if (Array.isArray(exists) || isIterable(exists)) {
        let I = 0;
        for (const E of entries) {
          if (I < exists.length) {
            exists[I++] = E?.[1];
          } else {
            exists?.push?.(E?.[1]);
          }
          ;
        }
        return exists;
      }
      return Object.assign(exists, Object.fromEntries([...entries || []].filter((K) => typeof K != "symbol")));
    }
  }
  if (name != null) {
    Reflect.set(target, name, value);
    return target;
  } else if (typeof value == "object" || typeof value == "function") {
    return Object.assign(target, value);
  }
  ;
  return value;
};
const bindFx = (target, fx) => {
  const be = boundCtx.getOrInsert(target, /* @__PURE__ */ new WeakMap());
  return be.getOrInsert(fx, fx?.bind?.(target));
};
const bindCtx = (target, fx) => (typeof fx == "function" ? bindFx(target, fx) : fx) ?? fx;
const callByProp = (unwrap, prop, cb, ctx) => {
  if (prop == Symbol.iterator) {
    return callByAllProp(unwrap, cb, ctx);
  }
  ;
  if (prop == null || //(prop == $extractKey$ || prop == $originalKey$ || prop == $registryKey$) ||
  (typeof prop == "symbol" || typeof prop == "object" || typeof prop == "function")) return;
  const callIfNotNull = (v, ...args) => {
    if (v != null) {
      return cb?.(v, ...args);
    }
  };
  if (unwrap instanceof Map || unwrap instanceof WeakMap) {
    if (unwrap.has(prop)) {
      return callIfNotNull?.(unwrap.get(prop), prop, null, "@set");
    }
  } else if (unwrap instanceof Set || unwrap instanceof WeakSet) {
    if (unwrap.has(prop)) {
      return callIfNotNull?.(prop, prop, null, "@add");
    }
  } else if (Array.isArray(unwrap) && (typeof prop == "string" && [...prop?.matchAll?.(/^\d+$/g)]?.length == 1) && Number.isInteger(typeof prop == "string" ? parseInt(prop) : prop)) {
    const index = typeof prop == "string" ? parseInt(prop) : prop;
    return callIfNotNull?.(unwrap?.[index], index, null, "@add");
  } else if (typeof unwrap == "function" || typeof unwrap == "object") {
    return callIfNotNull?.(unwrap?.[prop], prop, null, "@set");
  }
};
const objectAssignNotEqual = (dst, src = {}) => {
  Object.entries(src)?.forEach?.(([k, v]) => {
    if (isNotEqual(v, dst[k])) {
      dst[k] = v;
    }
    ;
  });
  return dst;
};
const callByAllProp = (unwrap, cb, ctx) => {
  if (unwrap == null) return;
  let keys = [];
  if (unwrap instanceof Set || unwrap instanceof Map || typeof unwrap?.keys == "function") {
    return [...unwrap?.keys?.() || keys]?.forEach?.((prop) => callByProp(unwrap, prop, cb, ctx));
  }
  if (Array.isArray(unwrap) || isIterable(unwrap)) {
    return [...unwrap]?.forEach?.((v, I) => callByProp(unwrap, I, cb, ctx));
  }
  if (typeof unwrap == "object" || typeof unwrap == "function") {
    return [...Object.keys(unwrap) || keys]?.forEach?.((prop) => callByProp(unwrap, prop, cb, ctx));
  }
};
const isObjectNotEqual = (a, b) => {
  if (a == null && b == null) return false;
  if (a == null || b == null) return true;
  if (a instanceof Map || a instanceof WeakMap) {
    return a.size != b.size || Array.from(a.entries()).some(([k, v]) => !b.has(k) || !isNotEqual(v, b.get(k)));
  }
  if (a instanceof Set || a instanceof WeakSet) {
    return a.size != b.size || Array.from(a.values()).some((v) => !b.has(v));
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return a.length != b.length || a.some((v, i) => !isNotEqual(v, b[i]));
  }
  if (typeof a == "object" || typeof b == "object") {
    return JSON.stringify(a) != JSON.stringify(b);
  }
  return a != b;
};
const isNotEqual = (a, b) => {
  if (a == null && b == null) return false;
  if (a == null || b == null) return true;
  if (typeof a == "boolean" && typeof b == "boolean") {
    return a != b;
  }
  if (typeof a == "number" && typeof b == "number") {
    return !(a == b || Math.abs(a - b) < 1e-9);
  }
  if (typeof a == "string" && typeof b == "string") {
    return a != "" && b != "" && a != b || a !== b;
  }
  if (typeof a != typeof b) {
    return a !== b;
  }
  return a && b && a != b || a !== b;
};
const boundCtx = /* @__PURE__ */ new WeakMap();
const isArrayInvalidKey = (key, src) => {
  const invalidForArray = key == null || key < 0 || typeof key != "number" || key == Symbol.iterator || (src != null ? key >= (src?.length || 0) : false);
  return src != null ? Array.isArray(src) && invalidForArray : false;
};
const inProxy = /* @__PURE__ */ new WeakMap();
const contextify = (pc, name) => {
  return typeof pc?.[name] == "function" ? pc?.[name]?.bind?.(pc) : pc?.[name];
};
const deepOperateAndClone = (obj, operation, $prev) => {
  if (Array.isArray(obj)) {
    if (obj.every(isCanJustReturn)) return obj.map(operation);
    return obj.map((value, index) => deepOperateAndClone(value, operation, [obj, index]));
  }
  if (obj instanceof Map) {
    const entries = Array.from(obj.entries());
    const values = entries.map(([key, value]) => value);
    if (values.every(isCanJustReturn)) return new Map(entries.map(([key, value]) => [key, operation(value, key, obj)]));
    return new Map(entries.map(([key, value]) => [key, deepOperateAndClone(value, operation, [obj, key])]));
  }
  if (obj instanceof Set) {
    const entries = Array.from(obj.entries());
    const values = entries.map(([key, value]) => value);
    if (entries.every(isCanJustReturn)) return new Set(values.map(operation));
    return new Set(values.map((value) => deepOperateAndClone(value, operation, [obj, value])));
  }
  if (typeof obj == "object" && (obj?.constructor == Object && Object.prototype.toString.call(obj) == "[object Object]")) {
    const entries = Array.from(Object.entries(obj));
    const values = entries.map(([key, value]) => value);
    if (values.every(isCanJustReturn)) return Object.fromEntries(entries.map(([key, value]) => [key, operation(value, key, obj)]));
    return Object.fromEntries(entries.map(([key, value]) => [key, deepOperateAndClone(value, operation, [obj, key])]));
  }
  return operation(obj, $prev?.[1] ?? "", $prev?.[0] ?? null);
};
const bindEvent = (on, key, value) => {
  if (on?.[key] != null) {
    const exists = on[key];
    if (Array.isArray(value)) {
      exists.add(...value);
    } else if (typeof value == "function") {
      exists.add(value);
    }
    return on;
  }
  on[key] ??= Array.isArray(value) ? new Set(value) : typeof value == "function" ? /* @__PURE__ */ new Set([value]) : value;
  return on;
};

const resolvedMap = /* @__PURE__ */ new WeakMap(), handledMap = /* @__PURE__ */ new WeakMap();
const actWith = (promiseOrPlain, cb) => {
  if (promiseOrPlain instanceof Promise || typeof promiseOrPlain?.then == "function") {
    if (resolvedMap?.has?.(promiseOrPlain)) {
      return cb(resolvedMap?.get?.(promiseOrPlain));
    }
    return Promise.try?.(async () => {
      const item = await promiseOrPlain;
      resolvedMap?.set?.(promiseOrPlain, item);
      return item;
    })?.then?.(cb);
  }
  return cb(promiseOrPlain);
};
class PromiseHandler {
  #resolve;
  #reject;
  //
  constructor(resolve, reject) {
    this.#resolve = resolve;
    this.#reject = reject;
  }
  //
  defineProperty(target, prop, descriptor) {
    if (unwrap(target) instanceof Promise) return Reflect.defineProperty(target, prop, descriptor);
    return actWith(unwrap(target), (obj) => Reflect.defineProperty(obj, prop, descriptor));
  }
  //
  deleteProperty(target, prop) {
    if (unwrap(target) instanceof Promise) return Reflect.deleteProperty(target, prop);
    return actWith(unwrap(target), (obj) => Reflect.deleteProperty(obj, prop));
  }
  //
  getPrototypeOf(target) {
    if (unwrap(target) instanceof Promise) return Reflect.getPrototypeOf(target);
    return actWith(unwrap(target), (obj) => Reflect.getPrototypeOf(obj));
  }
  //
  setPrototypeOf(target, proto) {
    if (unwrap(target) instanceof Promise) return Reflect.setPrototypeOf(target, proto);
    return actWith(unwrap(target), (obj) => Reflect.setPrototypeOf(obj, proto));
  }
  //
  isExtensible(target) {
    if (unwrap(target) instanceof Promise) return Reflect.isExtensible(target);
    return actWith(unwrap(target), (obj) => Reflect.isExtensible(obj));
  }
  //
  preventExtensions(target) {
    if (unwrap(target) instanceof Promise) return Reflect.ownKeys(target);
    return actWith(unwrap(target), (obj) => Reflect.preventExtensions(obj));
  }
  //
  ownKeys(target) {
    const uwp = unwrap(target);
    if (uwp instanceof Promise) return Object.keys(uwp);
    const keys = actWith(uwp, (obj) => {
      return (typeof obj == "object" || typeof obj == "function") && obj != null ? Object.keys(obj) : [];
    });
    return keys ?? [];
  }
  //
  getOwnPropertyDescriptor(target, prop) {
    if (unwrap(target) instanceof Promise) return Reflect.getOwnPropertyDescriptor(target, prop);
    return actWith(unwrap(target), (obj) => Reflect.getOwnPropertyDescriptor(obj, prop));
  }
  //
  construct(target, args, newTarget) {
    return actWith(unwrap(target), (ct) => Reflect.construct(ct, args, newTarget));
  }
  //
  has(target, prop) {
    if (unwrap(target) instanceof Promise) return Reflect.has(target, prop);
    return actWith(unwrap(target), (obj) => Reflect.has(obj, prop));
  }
  //
  get(target, prop, receiver) {
    target = unwrap(target);
    if (prop == "promise") {
      return target;
    }
    if (prop == "resolve" && this.#resolve) {
      return (...args) => {
        const result2 = this.#resolve?.(...args);
        this.#resolve = null;
        return result2;
      };
    }
    if (prop == "reject" && this.#reject) {
      return (...args) => {
        const result2 = this.#reject?.(...args);
        this.#reject = null;
        return result2;
      };
    }
    if (prop == "then" || prop == "catch" || prop == "finally") {
      if (target instanceof Promise) {
        return target?.[prop]?.bind?.(target);
      } else {
        const $tmp = Promise.try(() => target);
        return $tmp?.[prop]?.bind?.($tmp);
      }
    }
    const result = Promised(actWith(target, async (obj) => {
      if (unwrap(obj) instanceof Promise) return Reflect.get(obj, prop, receiver);
      if (isPrimitive(obj)) {
        return prop == Symbol.toPrimitive || prop == Symbol.toStringTag ? obj : void 0;
      }
      let value = void 0;
      try {
        value = Reflect.get(obj, prop, receiver);
      } catch (e) {
        value = target?.[prop];
      }
      if (typeof value == "function") {
        return value?.bind?.(obj);
      }
      return value;
    }));
    if (prop == Symbol.toStringTag) {
      if (isPrimitive(result)) {
        return String(result ?? "") || "";
      }
      ;
      return result?.[Symbol.toStringTag]?.() || String(result ?? "") || "";
    }
    if (prop == Symbol.toPrimitive) {
      return (hint) => {
        if (isPrimitive(result)) {
          return tryParseByHint(result, hint);
        }
        ;
        return null;
      };
    }
    return result;
  }
  //
  set(target, prop, value) {
    return actWith(unwrap(target), (obj) => Reflect.set(obj, prop, value));
  }
  //
  apply(target, thisArg, args) {
    if (this.#resolve) {
      const result = this.#resolve?.(...args);
      this.#resolve = null;
      return result;
    }
    return actWith(unwrap(target, this.#resolve), (obj) => {
      if (typeof obj == "function") {
        if (unwrap(obj) instanceof Promise) return Reflect.apply(obj, thisArg, args);
        return Reflect.apply(obj, thisArg, args);
      }
    });
  }
}
function Promised(promise, resolve, reject) {
  if (!(promise instanceof Promise || typeof promise?.then == "function")) {
    return promise;
  }
  if (resolvedMap?.has?.(promise)) {
    return resolvedMap?.get?.(promise);
  }
  ;
  if (!handledMap?.has?.(promise)) {
    promise?.then?.((item) => resolvedMap?.set?.(promise, item));
  }
  return handledMap?.getOrInsertComputed?.(promise, () => new Proxy(fixFx(promise), new PromiseHandler(resolve, reject)));
}

const existsMap = /* @__PURE__ */ new WeakMap();
class WeakRefProxyHandler {
  _deref(target) {
    return target instanceof WeakRef || typeof target?.deref == "function" ? target?.deref?.() : target;
  }
  // @ts-ignore
  //
  get(tg, prop, _receiver) {
    const obj = this._deref(tg), value = obj?.[prop];
    if ((prop == "element" || prop == "value") && obj && (value == null || !(prop in obj))) {
      return obj;
    }
    if (prop == "deref") {
      return () => this._deref(tg);
    }
    ;
    if (typeof value == "function") {
      return (...args) => {
        const realObj = this._deref(tg);
        return realObj?.[prop]?.(...args);
      };
    }
    ;
    return value;
  }
  set(tg, prop, value, _receiver) {
    const obj = this._deref(tg);
    if (obj) return Reflect.set(obj, prop, value);
    return true;
  }
  has(tg, prop) {
    const obj = this._deref(tg);
    if (!obj) return false;
    return prop in obj;
  }
  ownKeys(tg) {
    const obj = this._deref(tg);
    if (!obj) return [];
    return Reflect.ownKeys(obj);
  }
  getOwnPropertyDescriptor(tg, prop) {
    const obj = this._deref(tg);
    if (!obj) return void 0;
    return Object.getOwnPropertyDescriptor(obj, prop);
  }
  deleteProperty(tg, prop) {
    const obj = this._deref(tg);
    if (!obj) return true;
    return Reflect.deleteProperty(obj, prop);
  }
  defineProperty(tg, prop, descriptor) {
    const obj = this._deref(tg);
    if (!obj) return true;
    return Reflect.defineProperty(obj, prop, descriptor);
  }
  getPrototypeOf(tg) {
    const obj = this._deref(tg);
    if (!obj) return null;
    return Object.getPrototypeOf(obj);
  }
  setPrototypeOf(tg, proto) {
    const obj = this._deref(tg);
    if (!obj) return true;
    return Reflect.setPrototypeOf(obj, proto);
  }
  isExtensible(tg) {
    const obj = this._deref(tg);
    if (!obj) return false;
    return Reflect.isExtensible(obj);
  }
  preventExtensions(tg) {
    const obj = this._deref(tg);
    if (!obj) return true;
    return Reflect.preventExtensions(obj);
  }
}
function WRef(target) {
  if (!(typeof target == "object" || typeof target == "function") || typeof target == "symbol") return target;
  const isWeakRef = target instanceof WeakRef || typeof target?.deref == "function";
  target = isWeakRef ? target?.deref?.() : target;
  if (target != null && existsMap.has(target)) {
    return existsMap.get(target);
  }
  const handler = new WeakRefProxyHandler();
  const pm = new Proxy(isWeakRef ? target : new WeakRef(target), handler);
  existsMap.set(target, pm);
  return pm;
}

const cvt_cs_to_os = (pos_in_cs, size_in_cs, or_i = 0) => {
  const size_in_os = [...size_in_cs];
  const pos_in_swap = [...pos_in_cs];
  if (or_i % 2) {
    pos_in_swap.reverse();
    size_in_os.reverse();
  }
  return [
    (or_i == 0 || or_i == 3 ? pos_in_swap[0] : size_in_os[0] - pos_in_swap[0]) || 0,
    (or_i == 0 || or_i == 1 ? pos_in_swap[1] : size_in_os[1] - pos_in_swap[1]) || 0
  ];
};
const cvt_os_to_cs = (pos_in_os, size_in_cs, or_i = 0) => {
  const size_in_os = [...size_in_cs];
  const pos_in_cp = [...pos_in_os];
  if (or_i % 2) {
    size_in_os.reverse();
  }
  const pos_in_cs = [
    (or_i == 0 || or_i == 3 ? pos_in_cp[0] : size_in_os[0] - pos_in_cp[0]) || 0,
    (or_i == 0 || or_i == 1 ? pos_in_cp[1] : size_in_os[1] - pos_in_cp[1]) || 0
  ];
  if (or_i % 2) {
    pos_in_cs.reverse();
  }
  return pos_in_cs;
};
const cvt_rel_cs_to_os = (rel_in_cs, or_i = 0) => {
  const rel_in_swap = [...rel_in_cs];
  if (or_i % 2) {
    rel_in_swap.reverse();
  }
  return [
    (or_i == 0 || or_i == 3 ? rel_in_swap[0] : -rel_in_swap[0]) || 0,
    (or_i == 0 || or_i == 1 ? rel_in_swap[1] : -rel_in_swap[1]) || 0
  ];
};
const cvt_rel_os_to_cs = (rel_in_os, or_i = 0) => {
  const rel_in_cp = [...rel_in_os];
  const pos_in_cs = [
    (or_i == 0 || or_i == 3 ? rel_in_cp[0] : -rel_in_cp[0]) || 0,
    (or_i == 0 || or_i == 1 ? rel_in_cp[1] : -rel_in_cp[1]) || 0
  ];
  if (or_i % 2) {
    pos_in_cs.reverse();
  }
  return pos_in_cs;
};

const get = (items, id) => {
  if (typeof items?.get == "function") {
    const item = items?.get?.(id);
    if (item) {
      return item;
    }
    ;
  }
  ;
  return Array.from(items?.values?.() || items || [])?.find?.((item) => item?.id == id || item == id);
};
const getSpan = (el, ax) => {
  const prop = el.style.getPropertyValue(["--ox-c-span", "--ox-r-span"][ax]), factor = (parseFloat(prop || "1") || 1) - 1;
  return Math.min(Math.max(factor - 1, 0), 1);
};
const redirectCell = ($preCell, gridArgs) => {
  const icons = gridArgs?.items || [];
  const item = gridArgs?.item || {};
  const checkBusy = (cell) => {
    return icons?.filter?.((e) => !(e == item || e?.id == item?.id))?.some?.((one) => (one?.cell?.[0] || 0) == (cell[0] || 0) && (one?.cell?.[1] || 0) == (cell[1] || 0));
  };
  const preCell = [...$preCell];
  if (!checkBusy(preCell)) {
    return [...preCell];
  }
  const layout = [...gridArgs?.layout];
  const columns = layout[0] || 4;
  const rows = layout[1] || 8;
  const variants = [
    [preCell[0] + 1, preCell[1]],
    [preCell[0] - 1, preCell[1]],
    [preCell[0], preCell[1] + 1],
    [preCell[0], preCell[1] - 1]
  ].filter((v) => {
    return v[0] >= 0 && v[0] < columns && v[1] >= 0 && v[1] < rows;
  }) || [];
  const suitable = variants.find((v) => !checkBusy(v));
  if (suitable) {
    return [...suitable];
  }
  let exceed = 0, busy = true, comp = [...preCell];
  while (busy && exceed++ < columns * rows) {
    if (!(busy = checkBusy(comp))) {
      return [...comp];
    }
    ;
    comp[0]++;
    if (comp[0] >= columns) {
      comp[0] = 0;
      comp[1]++;
      if (comp[1] >= rows) {
        comp[1] = 0;
      }
    }
  }
  return [...preCell];
};
const makeOrientInset = ($orientPx, gridArgs, orient = 0) => {
  const boxInPx = [...gridArgs.size];
  const orientPx = [...$orientPx];
  const layout = [...gridArgs.layout];
  if (orient % 2) {
    boxInPx.reverse();
  }
  ;
  return [
    roundNearest(orientPx[0], boxInPx[0] / layout[0]),
    roundNearest(orientPx[1], boxInPx[1] / layout[1])
  ];
};
const convertOrientPxToCX = ($orientPx, gridArgs, orient = 0) => {
  const boxInPx = [...gridArgs.size];
  const orientPx = [...$orientPx];
  const layout = [...gridArgs.layout];
  if (orient % 2) {
    boxInPx.reverse();
  }
  ;
  const gridPxToCX = [layout[0] / boxInPx[0], layout[1] / boxInPx[1]];
  return [orientPx[0] * gridPxToCX[0], orientPx[1] * gridPxToCX[1]];
};
const floorInOrientPx = ($orientPx, gridArgs, orient = 0) => {
  const orientPx = [...$orientPx];
  const boxInPx = [...gridArgs.size];
  const layout = [...gridArgs.layout];
  if (orient % 2) {
    boxInPx.reverse();
  }
  ;
  const inBox = [boxInPx[0] / layout[0], boxInPx[1] / layout[1]];
  return [roundNearest(orientPx[0], inBox[0]), roundNearest(orientPx[1], inBox[1])];
};
const floorInCX = ($CX, gridArgs) => {
  const layout = gridArgs.layout;
  return [
    Math.min(Math.max(roundNearest($CX[0]), 0), layout[0] - 1),
    Math.min(Math.max(roundNearest($CX[1]), 0), layout[1] - 1)
  ];
};
const clientSpaceInOrientCX = ($clientPx, gridArgs, orient = 0) => {
  const clientPx = [...$clientPx];
  const size = [...gridArgs.size];
  const orientPx = cvt_cs_to_os(clientPx, size, orient);
  return [
    Math.min(Math.max(roundNearest(orientPx[0] / size[0] * gridArgs.layout[0], 1), 0), gridArgs.layout[0] - 1),
    Math.min(Math.max(roundNearest(orientPx[1] / size[1] * gridArgs.layout[1], 1), 0), gridArgs.layout[1] - 1)
  ];
};

class BaseSubscription {
  constructor(_unsubscribe) {
    this._unsubscribe = _unsubscribe;
  }
  _closed = false;
  get closed() {
    return this._closed;
  }
  unsubscribe() {
    if (!this._closed) {
      this._closed = true;
      this._unsubscribe();
    }
  }
}
class Observable {
  constructor(_producer) {
    this._producer = _producer;
  }
  subscribe(observerOrNext, opts) {
    const observer = typeof observerOrNext === "function" ? { next: observerOrNext } : observerOrNext ?? {};
    const ctrl = new AbortController();
    opts?.signal?.addEventListener("abort", () => ctrl.abort());
    let active = true;
    let cleanup;
    const doCleanup = () => {
      active = false;
      ctrl.abort();
      cleanup?.();
    };
    const subscriber = {
      next: (v) => active && observer.next?.(v),
      error: (e) => {
        if (active) {
          observer.error?.(e);
          doCleanup();
        }
      },
      complete: () => {
        if (active) {
          observer.complete?.();
          doCleanup();
        }
      },
      signal: ctrl.signal,
      get active() {
        return active && !ctrl.signal.aborted;
      }
    };
    try {
      cleanup = this._producer(subscriber);
    } catch (e) {
      subscriber.error(e);
    }
    return new BaseSubscription(doCleanup);
  }
  pipe(...ops) {
    return ops.reduce((s, op) => op(s), this);
  }
}
class ChannelSubject {
  _subs = /* @__PURE__ */ new Set();
  _buffer = [];
  _maxBuffer;
  _replay;
  constructor(options = {}) {
    this._maxBuffer = options.bufferSize ?? 0;
    this._replay = options.replayOnSubscribe ?? false;
  }
  next(value) {
    if (this._maxBuffer > 0) {
      this._buffer.push(value);
      if (this._buffer.length > this._maxBuffer) this._buffer.shift();
    }
    for (const s of this._subs) {
      try {
        s.next?.(value);
      } catch (e) {
        s.error?.(e);
      }
    }
  }
  error(err) {
    for (const s of this._subs) s.error?.(err);
  }
  complete() {
    for (const s of this._subs) s.complete?.();
    this._subs.clear();
  }
  subscribe(observerOrNext) {
    const obs = typeof observerOrNext === "function" ? { next: observerOrNext } : observerOrNext;
    this._subs.add(obs);
    if (this._replay) {
      for (const v of this._buffer) {
        try {
          obs.next?.(v);
        } catch (e) {
          obs.error?.(e);
        }
      }
    }
    return new BaseSubscription(() => {
      this._subs.delete(obs);
    });
  }
  getValue() {
    return this._buffer.at(-1);
  }
  getBuffer() {
    return [...this._buffer];
  }
  get subscriberCount() {
    return this._subs.size;
  }
}
class ReplayChannelSubject extends ChannelSubject {
  constructor(bufferSize = 1) {
    super({ bufferSize, replayOnSubscribe: true });
  }
}
class ChannelObservable {
  constructor(_transport, _channelName) {
    this._transport = _transport;
    this._channelName = _channelName;
    this._send = createTransportSender(_transport);
  }
  _send;
  _pending = /* @__PURE__ */ new Map();
  _subs = /* @__PURE__ */ new Set();
  _cleanup = null;
  _listening = false;
  next(msg, transfer) {
    this._send(msg, transfer);
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    if (!this._listening) this._activate();
    return new BaseSubscription(() => {
      this._subs.delete(obs);
      if (this._subs.size === 0) this._deactivate();
    });
  }
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      this._pending.set(reqId, { resolve, reject, timestamp: Date.now() });
      this.next({ ...msg, reqId });
    });
  }
  _handle(data) {
    if (data.type === "response" && data.reqId) {
      const p = this._pending.get(data.reqId);
      if (p) {
        p.resolve(data.payload);
        this._pending.delete(data.reqId);
      }
    }
    for (const s of this._subs) {
      try {
        s.next?.(data);
      } catch (e) {
        s.error?.(e);
      }
    }
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener(
      this._transport,
      (d) => this._handle(d),
      (e) => this._subs.forEach((s) => s.error?.(e)),
      () => this._subs.forEach((s) => s.complete?.())
    );
    this._listening = true;
  }
  _deactivate() {
    this._cleanup?.();
    this._cleanup = null;
    this._listening = false;
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this._deactivate();
  }
  get channelName() {
    return this._channelName;
  }
  get isListening() {
    return this._listening;
  }
}
function createInvokerObservable(transport, channelName, handler) {
  const send = createTransportSender(transport);
  return new Observable((subscriber) => {
    const onMessage = (data) => {
      if (!subscriber.active) return;
      const respond = (result, transfer) => {
        send({ ...result, channel: data.sender, sender: channelName, type: "response", reqId: data.reqId }, transfer);
      };
      handler ? handler(data, respond, subscriber) : subscriber.next(data);
    };
    return createTransportListener(transport, onMessage, (e) => subscriber.error(e), () => subscriber.complete());
  });
}
function createReflectHandler(channelName) {
  return async (data, respond, subscriber) => {
    if (data.type !== "request") {
      subscriber.next(data);
      return;
    }
    const result = await handleRequest(data.payload, data.reqId, channelName);
    if (result) respond(result.response, result.transfer);
    subscriber.next(data);
  };
}
class MessageObservable extends ChannelSubject {
  constructor(source, messageType) {
    super();
    source.subscribe({
      next: (msg) => {
        if (!messageType || msg.type === messageType) this.next(msg);
      },
      error: (e) => this.error(e),
      complete: () => this.complete()
    });
  }
}
const filter = (pred) => (src) => new Observable((sub) => {
  const s = src.subscribe({ next: (v) => pred(v) && sub.next(v), error: (e) => sub.error(e), complete: () => sub.complete() });
  return () => s.unsubscribe();
});
const map = (fn) => (src) => new Observable((sub) => {
  const s = src.subscribe({ next: (v) => sub.next(fn(v)), error: (e) => sub.error(e), complete: () => sub.complete() });
  return () => s.unsubscribe();
});
const take = (n) => (src) => new Observable((sub) => {
  let c = 0;
  const s = src.subscribe({ next: (v) => {
    if (c++ < n) {
      sub.next(v);
      if (c >= n) sub.complete();
    }
  }, error: (e) => sub.error(e), complete: () => sub.complete() });
  return () => s.unsubscribe();
});
const takeUntil = (signal) => (src) => new Observable((sub) => {
  const ss = src.subscribe({ next: (v) => sub.next(v), error: (e) => sub.error(e), complete: () => sub.complete() });
  const sig = signal.subscribe({ next: () => sub.complete() });
  return () => {
    ss.unsubscribe();
    sig.unsubscribe();
  };
});
const debounce = (ms) => (src) => new Observable((sub) => {
  let t;
  const s = src.subscribe({ next: (v) => {
    clearTimeout(t);
    t = setTimeout(() => sub.next(v), ms);
  }, error: (e) => sub.error(e), complete: () => sub.complete() });
  return () => {
    clearTimeout(t);
    s.unsubscribe();
  };
});
const throttle = (ms) => (src) => new Observable((sub) => {
  let last = 0;
  const s = src.subscribe({ next: (v) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      sub.next(v);
    }
  }, error: (e) => sub.error(e), complete: () => sub.complete() });
  return () => s.unsubscribe();
});
const fromEvent = (target, event) => new Observable((sub) => {
  const h = (e) => sub.active && sub.next(e);
  target.addEventListener(event, h);
  return () => target.removeEventListener(event, h);
});
const fromPromise = (promise) => new Observable((sub) => {
  promise.then((v) => {
    sub.next(v);
    sub.complete();
  }).catch((e) => sub.error(e));
});
const delay = (value, ms) => new Observable((sub) => {
  const t = setTimeout(() => {
    sub.next(value);
    sub.complete();
  }, ms);
  return () => clearTimeout(t);
});
const interval = (ms) => new Observable((sub) => {
  let n = 0;
  const t = setInterval(() => sub.next(n++), ms);
  return () => clearInterval(t);
});
const merge = (...sources) => new Observable((sub) => {
  const subs = sources.map((s) => s.subscribe({ next: (v) => sub.next(v), error: (e) => sub.error(e) }));
  return () => subs.forEach((s) => s.unsubscribe());
});
const createMessageId = () => UUIDv4();
const makeInvoker = (transport, handler) => (subscriber) => {
  const send = createTransportSender(transport);
  const respond = (result, transfer) => send(result, transfer);
  return createTransportListener(
    transport,
    (data) => {
      if (!subscriber.active) return;
      handler ? handler(data, respond, subscriber) : subscriber.next(data);
    },
    (err) => subscriber.error(err),
    () => subscriber.complete()
  );
};
const makeWorkerInvoker = (worker, handler) => makeInvoker(worker, handler);
const makeMessagePortInvoker = (port, handler) => makeInvoker(port, handler);
const makeBroadcastInvoker = (name, handler) => makeInvoker(new BroadcastChannel(name), handler);
const makeWebSocketInvoker = (url, protocols, handler) => makeInvoker(new WebSocket(typeof url === "string" ? url : url.href, protocols), handler);
const makeChromeRuntimeInvoker = (handler) => makeInvoker("chrome-runtime", handler);
const makeServiceWorkerClientInvoker = (handler) => makeInvoker("service-worker-client", handler);
const makeServiceWorkerHostInvoker = (handler) => makeInvoker("service-worker-host", handler);
const makeSelfInvoker = (handler) => makeInvoker("self", handler);
function createBidirectionalChannel$1(transport, channelName, handler) {
  const send = createTransportSender(transport);
  const inbound = new Observable((sub) => makeInvoker(transport, handler)(sub));
  return {
    inbound,
    outbound: { next: send },
    subscribe: (obs) => inbound.subscribe(obs),
    send: (value, transfer) => send(value, transfer)
  };
}
function when(target, eventName) {
  return new Observable((sub) => {
    const h = (e) => sub.active && sub.next(e);
    target.addEventListener(eventName, h);
    return () => target.removeEventListener(eventName, h);
  });
}
const ObservableFactory = {
  channel: (transport, name) => new ChannelObservable(transport, name),
  invoker: (transport, name, handler) => createInvokerObservable(transport, name, handler),
  handler: (transport, name) => createInvokerObservable(transport, name, createReflectHandler(name)),
  bidirectional: createBidirectionalChannel$1,
  fromEvent,
  fromPromise,
  delay,
  interval,
  merge,
  when
};

function detectContextType() {
  if (typeof globalThis.Deno !== "undefined") return "deno";
  if (typeof globalThis.process !== "undefined" && globalThis.process?.versions?.node) return "node";
  if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) return "service-worker";
  if (typeof SharedWorkerGlobalScope !== "undefined" && self instanceof SharedWorkerGlobalScope) return "shared-worker";
  if (typeof DedicatedWorkerGlobalScope !== "undefined" && self instanceof DedicatedWorkerGlobalScope) return "worker";
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    if (typeof chrome.runtime.getBackgroundPage === "function" || chrome.runtime.getManifest?.()?.background?.service_worker) return "chrome-background";
    if (typeof chrome.devtools !== "undefined") return "chrome-devtools";
    if (typeof document !== "undefined" && globalThis?.location?.protocol === "chrome-extension:") {
      const views = chrome.extension?.getViews?.({ type: "popup" }) ?? [];
      if (views.includes(globalThis)) return "chrome-popup";
    }
    if (typeof document !== "undefined" && globalThis?.location?.protocol !== "chrome-extension:") return "chrome-content";
  }
  if (typeof globalThis !== "undefined" && typeof document !== "undefined") return "window";
  return "unknown";
}
function detectTransportType(source) {
  if (!source) return "internal";
  if (typeof Worker !== "undefined" && source instanceof Worker) return "worker";
  if (typeof SharedWorker !== "undefined" && source instanceof SharedWorker) return "shared-worker";
  if (typeof MessagePort !== "undefined" && source instanceof MessagePort) return "message-port";
  if (typeof BroadcastChannel !== "undefined" && source instanceof BroadcastChannel) return "broadcast";
  if (typeof WebSocket !== "undefined" && source instanceof WebSocket) return "websocket";
  if (typeof RTCDataChannel !== "undefined" && source instanceof RTCDataChannel) return "rtc-data";
  if (source === "chrome-runtime" || source === "chrome-tabs" || source === "chrome-port" || source === "chrome-external") {
    return source;
  }
  if (typeof chrome !== "undefined" && source && typeof source === "object" && typeof source.postMessage === "function" && source.onMessage?.addListener) {
    return "chrome-port";
  }
  if (source === self || source === globalThis || source === "self") return "self";
  return "internal";
}
function detectIncomingContextType(data) {
  if (!data) return "unknown";
  if (data.contextType) return data.contextType;
  const sender = data.sender ?? "";
  if (sender.includes("worker")) return "worker";
  if (sender.includes("sw") || sender.includes("service")) return "service-worker";
  if (sender.includes("chrome") || sender.includes("crx")) return "chrome-content";
  if (sender.includes("background")) return "chrome-background";
  return "unknown";
}
const DefaultReflect = {
  get: (target, prop) => Reflect.get(target, prop),
  set: (target, prop, value) => Reflect.set(target, prop, value),
  has: (target, prop) => Reflect.has(target, prop),
  apply: (target, thisArg, args) => Reflect.apply(target, thisArg, args),
  construct: (target, args) => Reflect.construct(target, args),
  deleteProperty: (target, prop) => Reflect.deleteProperty(target, prop),
  ownKeys: (target) => Reflect.ownKeys(target),
  getOwnPropertyDescriptor: (target, prop) => Reflect.getOwnPropertyDescriptor(target, prop),
  getPrototypeOf: (target) => Reflect.getPrototypeOf(target),
  setPrototypeOf: (target, proto) => Reflect.setPrototypeOf(target, proto),
  isExtensible: (target) => Reflect.isExtensible(target),
  preventExtensions: (target) => Reflect.preventExtensions(target)
};
class Requestor {
  _channel;
  _contextType;
  constructor(config) {
    this._contextType = config.autoDetect !== false ? detectContextType() : "unknown";
    this._channel = createUnifiedChannel({
      name: config.channel,
      timeout: config.timeout,
      autoListen: false
    });
  }
  connect(target, options) {
    this._channel.connect(target, options);
    return this;
  }
  invoke(targetChannel, action, path, args = []) {
    return this._channel.invoke(targetChannel, action, path, args);
  }
  get(targetChannel, path, prop) {
    return this._channel.get(targetChannel, path, prop);
  }
  set(targetChannel, path, prop, value) {
    return this._channel.set(targetChannel, path, prop, value);
  }
  call(targetChannel, path, args = []) {
    return this._channel.call(targetChannel, path, args);
  }
  construct(targetChannel, path, args = []) {
    return this._channel.construct(targetChannel, path, args);
  }
  importModule(targetChannel, url) {
    return this._channel.import(url, targetChannel);
  }
  createProxy(targetChannel, basePath = []) {
    return this._channel.proxy(targetChannel, basePath);
  }
  get onResponse() {
    return this._channel.onResponse;
  }
  get contextType() {
    return this._contextType;
  }
  close() {
    this._channel.close();
  }
}
class Responder {
  _channel;
  _contextType;
  constructor(config) {
    this._contextType = config.autoDetect !== false ? detectContextType() : "unknown";
    this._channel = createUnifiedChannel({
      name: config.channel,
      timeout: config.timeout,
      autoListen: false
    });
  }
  listen(source, options) {
    this._channel.listen(source, options);
    return this;
  }
  expose(name, obj) {
    this._channel.expose(name, obj);
    return this;
  }
  get onInvocation() {
    return this._channel.onInvocation;
  }
  subscribeInvocations(handler) {
    return this._channel.onInvocation.subscribe(handler);
  }
  get contextType() {
    return this._contextType;
  }
  close() {
    this._channel.close();
  }
}
class BidirectionalInvoker {
  requestor;
  responder;
  _contextType;
  constructor(config) {
    this._contextType = config.autoDetect !== false ? detectContextType() : "unknown";
    this.requestor = new Requestor(config);
    this.responder = new Responder(config);
  }
  connect(target) {
    this.requestor.connect(target);
    this.responder.listen(target);
    return this;
  }
  expose(name, obj) {
    this.responder.expose(name, obj);
    return this;
  }
  createProxy(targetChannel, basePath = []) {
    return this.requestor.createProxy(targetChannel, basePath);
  }
  importModule(targetChannel, url) {
    return this.requestor.importModule(targetChannel, url);
  }
  get contextType() {
    return this._contextType;
  }
  close() {
    this.requestor.close();
    this.responder.close();
  }
}
function createRequestor(channel, config) {
  return new Requestor({ channel, ...config });
}
function createResponder(channel, config) {
  return new Responder({ channel, ...config });
}
function createInvoker(channel, config) {
  return new BidirectionalInvoker({ channel, ...config });
}
function setupInvoker(channel, target, config) {
  return createInvoker(channel, config).connect(target);
}
function autoInvoker(channel, config) {
  const invoker = createInvoker(channel, { autoDetect: true, ...config });
  const contextType = detectContextType();
  switch (contextType) {
    case "worker":
    case "service-worker":
    case "shared-worker":
      invoker.connect(self);
      break;
    case "chrome-content":
    case "chrome-background":
    case "chrome-popup":
      invoker.connect("chrome-runtime");
      break;
  }
  return invoker;
}

const PROXY_MARKER = Symbol.for("uniform.proxy");
const PROXY_INTERNALS = Symbol.for("uniform.proxy.internals");
class RemoteProxyHandler {
  constructor(_invoker, config) {
    this._invoker = _invoker;
    this._config = {
      channel: config.channel,
      basePath: config.basePath ?? [],
      invoker: _invoker,
      cache: config.cache ?? true,
      timeout: config.timeout ?? 3e4
    };
  }
  _config;
  _childCache = /* @__PURE__ */ new Map();
  /** Get property - returns nested proxy or invokes GET */
  get(target, prop, receiver) {
    const propStr = String(prop);
    if (prop === PROXY_MARKER) return true;
    if (prop === PROXY_INTERNALS) return this._config;
    if (prop === $requestHandler) return true;
    if (prop === $descriptor) return this._getDescriptor();
    if (prop === "then" || prop === "catch" || prop === "finally") return void 0;
    if (typeof prop === "symbol") return void 0;
    if (prop === "$path") return this._config.basePath;
    if (prop === "$channel") return this._config.channel;
    if (prop === "$descriptor") return this._getDescriptor();
    if (prop === "$invoke") return this._invoker;
    const childPath = [...this._config.basePath, propStr];
    if (this._config.cache && this._childCache.has(propStr)) {
      return this._childCache.get(propStr);
    }
    const childProxy = createRemoteProxy(this._invoker, {
      ...this._config,
      basePath: childPath
    });
    if (this._config.cache) {
      this._childCache.set(propStr, childProxy);
    }
    return childProxy;
  }
  /** Set property */
  set(target, prop, value, receiver) {
    if (typeof prop === "symbol") return true;
    this._invoker(
      WReflectAction.SET,
      [...this._config.basePath, String(prop)],
      [value]
    );
    return true;
  }
  /** Apply function */
  apply(target, thisArg, args) {
    return this._invoker(
      WReflectAction.APPLY,
      this._config.basePath,
      [args]
    );
  }
  /** Construct new instance */
  construct(target, args, newTarget) {
    return this._invoker(
      WReflectAction.CONSTRUCT,
      this._config.basePath,
      [args]
    );
  }
  /** Check if property exists */
  has(target, prop) {
    if (typeof prop === "symbol") return false;
    return this._invoker(
      WReflectAction.HAS,
      this._config.basePath,
      [prop]
    );
  }
  /** Delete property */
  deleteProperty(target, prop) {
    if (typeof prop === "symbol") return true;
    return this._invoker(
      WReflectAction.DELETE_PROPERTY,
      [...this._config.basePath, String(prop)],
      []
    );
  }
  /** Get own keys */
  ownKeys(target) {
    return [];
  }
  /** Get property descriptor */
  getOwnPropertyDescriptor(target, prop) {
    return { configurable: true, enumerable: true, writable: true };
  }
  /** Get prototype */
  getPrototypeOf(target) {
    return Function.prototype;
  }
  /** Set prototype */
  setPrototypeOf(target, proto) {
    return this._invoker(
      WReflectAction.SET_PROTOTYPE_OF,
      this._config.basePath,
      [proto]
    );
  }
  /** Check if extensible */
  isExtensible(target) {
    return true;
  }
  /** Prevent extensions */
  preventExtensions(target) {
    return this._invoker(
      WReflectAction.PREVENT_EXTENSIONS,
      this._config.basePath,
      []
    );
  }
  /** Get descriptor for this proxy */
  _getDescriptor() {
    return {
      path: this._config.basePath,
      channel: this._config.channel,
      primitive: false
    };
  }
}
class DispatchProxyHandler {
  constructor(_dispatch) {
    this._dispatch = _dispatch;
  }
  get(...args) {
    return this._dispatch(WReflectAction.GET, args);
  }
  set(...args) {
    return this._dispatch(WReflectAction.SET, args);
  }
  has(...args) {
    return this._dispatch(WReflectAction.HAS, args);
  }
  deleteProperty(...args) {
    return this._dispatch(WReflectAction.DELETE_PROPERTY, args);
  }
  getOwnPropertyDescriptor(...args) {
    return this._dispatch(WReflectAction.GET_OWN_PROPERTY_DESCRIPTOR, args);
  }
  getPrototypeOf(...args) {
    return this._dispatch(WReflectAction.GET_PROTOTYPE_OF, args);
  }
  setPrototypeOf(...args) {
    return this._dispatch(WReflectAction.SET_PROTOTYPE_OF, args);
  }
  isExtensible(...args) {
    return this._dispatch(WReflectAction.IS_EXTENSIBLE, args);
  }
  preventExtensions(...args) {
    return this._dispatch(WReflectAction.PREVENT_EXTENSIONS, args);
  }
  ownKeys(...args) {
    return this._dispatch(WReflectAction.OWN_KEYS, args) ?? [];
  }
  apply(...args) {
    return this._dispatch(WReflectAction.APPLY, args);
  }
  construct(...args) {
    return this._dispatch(WReflectAction.CONSTRUCT, args);
  }
}
function createRemoteProxy(invoker, config) {
  const fn = function() {
  };
  const handler = new RemoteProxyHandler(invoker, config);
  return new Proxy(fn, handler);
}
function wrapDescriptor(descriptor, invoker, targetChannel) {
  if (!descriptor || typeof descriptor !== "object") return descriptor;
  if (descriptor.primitive) return descriptor;
  const cached = descMap.get(descriptor);
  if (cached) return cached;
  const proxy = createRemoteProxy(invoker, {
    channel: targetChannel ?? descriptor.channel ?? "unknown",
    basePath: descriptor.path ?? []
  });
  descMap.set(descriptor, proxy);
  wrapMap.set(proxy, descriptor);
  return proxy;
}
function isRemoteProxy(value) {
  if (!value) return false;
  if (typeof value !== "object" && typeof value !== "function") return false;
  try {
    return Reflect.get(value, PROXY_MARKER) === true;
  } catch {
    return false;
  }
}
function getProxyDescriptor(value) {
  if (!isRemoteProxy(value)) return null;
  return value.$descriptor ?? null;
}
function getProxyInternals(value) {
  if (!isRemoteProxy(value)) return null;
  try {
    const internals = Reflect.get(value, PROXY_INTERNALS);
    if (!internals || typeof internals !== "object") return null;
    return internals;
  } catch {
    return null;
  }
}
function createExposeHandler(target, reflect) {
  return createObjectHandler(target, reflect);
}
function createSenderProxy(sender, basePath = []) {
  const invoker = (action, path, args) => {
    return sender.request({
      id: UUIDv4(),
      channel: sender.channelName,
      sender: sender.senderId ?? "proxy",
      type: "request",
      payload: { action, path, args }
    });
  };
  return createRemoteProxy(invoker, {
    channel: sender.channelName,
    basePath
  });
}
class ProxyBuilder {
  _config = {};
  _invoker = null;
  /** Set target channel */
  channel(name) {
    this._config.channel = name;
    return this;
  }
  /** Set base path */
  path(basePath) {
    this._config.basePath = basePath;
    return this;
  }
  /** Set invoker function */
  invoker(fn) {
    this._invoker = fn;
    return this;
  }
  /** Set timeout */
  timeout(ms) {
    this._config.timeout = ms;
    return this;
  }
  /** Enable/disable caching */
  cache(enabled) {
    this._config.cache = enabled;
    return this;
  }
  /** Build the proxy */
  build() {
    if (!this._invoker) {
      throw new Error("Invoker is required. Call .invoker() before .build()");
    }
    if (!this._config.channel) {
      throw new Error("Channel is required. Call .channel() before .build()");
    }
    return createRemoteProxy(this._invoker, this._config);
  }
}
function proxyBuilder() {
  return new ProxyBuilder();
}
const makeProxy = createRemoteProxy;
const makeRequestProxy = wrapDescriptor;

function createConnectionKey(params) {
  return [
    params.localChannel,
    params.remoteChannel,
    params.sender,
    params.transportType,
    params.direction
  ].join("::");
}
function queryConnections(connections, query = {}) {
  const includeClosed = query.includeClosed ?? false;
  const desiredStatus = query.status ?? (includeClosed ? void 0 : "active");
  return [...connections].filter((connection) => {
    if (desiredStatus && connection.status !== desiredStatus) return false;
    if (query.channel && connection.localChannel !== query.channel && connection.remoteChannel !== query.channel) return false;
    if (query.localChannel && connection.localChannel !== query.localChannel) return false;
    if (query.remoteChannel && connection.remoteChannel !== query.remoteChannel) return false;
    if (query.sender && connection.sender !== query.sender) return false;
    if (query.transportType && connection.transportType !== query.transportType) return false;
    if (query.direction && connection.direction !== query.direction) return false;
    return true;
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}
class ConnectionRegistry {
  constructor(_createId, _emitEvent) {
    this._createId = _createId;
    this._emitEvent = _emitEvent;
  }
  _connections = /* @__PURE__ */ new Map();
  register(params) {
    const key = createConnectionKey(params);
    const now = Date.now();
    const existing = this._connections.get(key);
    if (existing) {
      existing.updatedAt = now;
      existing.status = "active";
      existing.metadata = { ...existing.metadata, ...params.metadata };
      return existing;
    }
    const connection = {
      id: this._createId(),
      localChannel: params.localChannel,
      remoteChannel: params.remoteChannel,
      sender: params.sender,
      transportType: params.transportType,
      direction: params.direction,
      status: "active",
      createdAt: now,
      updatedAt: now,
      metadata: params.metadata
    };
    this._connections.set(key, connection);
    this._emitEvent?.({
      type: "connected",
      connection,
      timestamp: now
    });
    return connection;
  }
  markNotified(connection, payload) {
    const now = Date.now();
    connection.lastNotifyAt = now;
    connection.updatedAt = now;
    this._emitEvent?.({
      type: "notified",
      connection,
      timestamp: now,
      payload
    });
  }
  closeByChannel(channel) {
    const now = Date.now();
    for (const connection of this._connections.values()) {
      if (connection.localChannel !== channel && connection.remoteChannel !== channel) continue;
      if (connection.status === "closed") continue;
      connection.status = "closed";
      connection.updatedAt = now;
      this._emitEvent?.({
        type: "disconnected",
        connection,
        timestamp: now
      });
    }
  }
  closeAll() {
    const now = Date.now();
    for (const connection of this._connections.values()) {
      if (connection.status === "closed") continue;
      connection.status = "closed";
      connection.updatedAt = now;
      this._emitEvent?.({
        type: "disconnected",
        connection,
        timestamp: now
      });
    }
  }
  query(query = {}) {
    return queryConnections(this._connections.values(), query);
  }
  values() {
    return [...this._connections.values()];
  }
  clear() {
    this._connections.clear();
  }
}

class UnifiedChannel {
  _name;
  _contextType;
  _config;
  // Transport management
  _transports = /* @__PURE__ */ new Map();
  _defaultTransport = null;
  _connectionEvents = new ChannelSubject({ bufferSize: 200 });
  _connectionRegistry = new ConnectionRegistry(
    () => UUIDv4(),
    (event) => this._connectionEvents.next(event)
  );
  // Request/Response tracking
  // @ts-ignore
  _pending = /* @__PURE__ */ new Map();
  _subscriptions = [];
  // Observable subjects
  _inbound = new ChannelSubject({ bufferSize: 100 });
  _outbound = new ChannelSubject({ bufferSize: 100 });
  _invocations = new ChannelSubject({ bufferSize: 100 });
  _responses = new ChannelSubject({ bufferSize: 100 });
  // Exposed objects
  _exposed = /* @__PURE__ */ new Map();
  // Proxy cache
  _proxyCache = /* @__PURE__ */ new WeakMap();
  __getPrivate(key) {
    return this[key];
  }
  __setPrivate(key, value) {
    this[key] = value;
  }
  constructor(config) {
    const cfg = typeof config === "string" ? { name: config } : config;
    this._name = cfg.name;
    this._contextType = cfg.autoDetect !== false ? detectContextType() : "unknown";
    this._config = {
      name: cfg.name,
      autoDetect: cfg.autoDetect ?? true,
      timeout: cfg.timeout ?? 3e4,
      reflect: cfg.reflect ?? DefaultReflect,
      bufferSize: cfg.bufferSize ?? 100,
      autoListen: cfg.autoListen ?? true
    };
    if (this._config.autoListen && this._isWorkerContext()) {
      this.listen(self);
    }
  }
  // ========================================================================
  // TRANSPORT CONNECTION
  // ========================================================================
  /**
   * Connect to a transport for sending requests
   *
   * @param target - Worker, MessagePort, BroadcastChannel, WebSocket, or string identifier
   * @param options - Connection options
   */
  connect(target, options = {}) {
    const transportType = detectTransportType(target);
    const targetChannel = options.targetChannel ?? this._inferTargetChannel(target, transportType);
    const binding = this._createTransportBinding(target, transportType, targetChannel, options);
    this._transports.set(targetChannel, binding);
    if (!this._defaultTransport) {
      this._defaultTransport = binding;
    }
    const connection = this._registerConnection({
      localChannel: this._name,
      remoteChannel: targetChannel,
      sender: this._name,
      transportType,
      direction: "outgoing",
      metadata: { phase: "connect" }
    });
    this._emitConnectionSignal(binding, "connect", {
      connectionId: connection.id,
      from: this._name,
      to: targetChannel
    });
    return this;
  }
  /**
   * Listen on a transport for incoming requests
   *
   * @param source - Transport source to listen on
   * @param options - Connection options
   */
  listen(source, options = {}) {
    const transportType = detectTransportType(source);
    const sourceChannel = options.targetChannel ?? this._inferTargetChannel(source, transportType);
    const handler = (data) => this._handleIncoming(data);
    const connection = this._registerConnection({
      localChannel: this._name,
      remoteChannel: sourceChannel,
      sender: sourceChannel,
      transportType,
      direction: "incoming",
      metadata: { phase: "listen" }
    });
    switch (transportType) {
      case "worker":
      case "message-port":
      case "broadcast":
        if (options.autoStart !== false && source.start) source.start();
        source.addEventListener?.("message", ((e) => handler(e.data)));
        break;
      case "websocket":
        source.addEventListener?.("message", ((e) => {
          try {
            handler(JSON.parse(e.data));
          } catch {
          }
        }));
        break;
      case "chrome-runtime":
        chrome.runtime.onMessage?.addListener?.((msg, sender, sendResponse) => {
          handler(msg);
          return true;
        });
        break;
      case "chrome-tabs":
        chrome.runtime.onMessage?.addListener?.((msg, sender) => {
          if (options.tabId != null && sender?.tab?.id !== options.tabId) return false;
          handler(msg);
          return true;
        });
        break;
      case "chrome-port":
        source?.onMessage?.addListener?.((msg) => {
          handler(msg);
        });
        break;
      case "chrome-external":
        chrome.runtime.onMessageExternal?.addListener?.((msg) => {
          handler(msg);
          return true;
        });
        break;
      case "self":
        addEventListener?.("message", ((e) => handler(e.data)));
        break;
      default:
        if (options.onMessage) {
          options.onMessage(handler);
        }
    }
    this._sendSignalToTarget(source, transportType, {
      connectionId: connection.id,
      from: this._name,
      to: sourceChannel,
      tabId: options.tabId,
      externalId: options.externalId
    }, "notify");
    return this;
  }
  /**
   * Connect and listen on the same transport (bidirectional)
   */
  attach(target, options = {}) {
    return this.connect(target, options);
  }
  // ========================================================================
  // EXPOSE / IMPORT
  // ========================================================================
  /**
   * Expose an object for remote invocation
   *
   * @param name - Path name for the exposed object
   * @param obj - Object to expose
   */
  expose(name, obj) {
    const path = [name];
    writeByPath(path, obj);
    this._exposed.set(name, { name, obj, path });
    return this;
  }
  /**
   * Expose multiple objects at once
   */
  exposeAll(entries) {
    for (const [name, obj] of Object.entries(entries)) {
      this.expose(name, obj);
    }
    return this;
  }
  /**
   * Import a module from a remote channel
   *
   * @param url - Module URL to import
   * @param targetChannel - Target channel (defaults to first connected)
   */
  async import(url, targetChannel) {
    return this.invoke(
      targetChannel ?? this._getDefaultTarget(),
      WReflectAction.IMPORT,
      [],
      [url]
    );
  }
  // ========================================================================
  // INVOKE / REQUEST
  // ========================================================================
  /**
   * Invoke a method on a remote object
   *
   * @param targetChannel - Target channel name
   * @param action - Reflect action
   * @param path - Object path
   * @param args - Arguments
   */
  invoke(targetChannel, action, path, args = []) {
    const id = UUIDv4();
    const resolvers = Promise.withResolvers();
    this._pending.set(id, resolvers);
    const timeout = setTimeout(() => {
      if (this._pending.has(id)) {
        this._pending.delete(id);
        resolvers.reject(new Error(`Request timeout: ${action} on ${path.join(".")}`));
      }
    }, this._config.timeout);
    const message = {
      id,
      channel: targetChannel,
      sender: this._name,
      type: "request",
      payload: {
        channel: targetChannel,
        sender: this._name,
        action,
        path,
        args
      },
      timestamp: Date.now()
    };
    this._send(targetChannel, message);
    this._outbound.next(message);
    return resolvers.promise.finally(() => clearTimeout(timeout));
  }
  /**
   * Get property from remote object
   */
  get(targetChannel, path, prop) {
    return this.invoke(targetChannel, WReflectAction.GET, path, [prop]);
  }
  /**
   * Set property on remote object
   */
  set(targetChannel, path, prop, value) {
    return this.invoke(targetChannel, WReflectAction.SET, path, [prop, value]);
  }
  /**
   * Call method on remote object
   */
  call(targetChannel, path, args = []) {
    return this.invoke(targetChannel, WReflectAction.APPLY, path, [args]);
  }
  /**
   * Construct new instance on remote
   */
  construct(targetChannel, path, args = []) {
    return this.invoke(targetChannel, WReflectAction.CONSTRUCT, path, [args]);
  }
  // ========================================================================
  // PROXY CREATION
  // ========================================================================
  /**
   * Create a transparent proxy to a remote channel
   *
   * All operations on the proxy are forwarded to the remote.
   *
   * @param targetChannel - Target channel name
   * @param basePath - Base path for the proxy
   */
  proxy(targetChannel, basePath = []) {
    const target = targetChannel ?? this._getDefaultTarget();
    return this._createProxy(target, basePath);
  }
  /**
   * Create proxy for a specific exposed module on remote
   *
   * @param moduleName - Name of the exposed module
   * @param targetChannel - Target channel
   */
  remote(moduleName, targetChannel) {
    return this.proxy(targetChannel, [moduleName]);
  }
  /**
   * Wrap a descriptor as a proxy
   */
  wrapDescriptor(descriptor, targetChannel) {
    const invoker = (action, path, args) => {
      const channel = targetChannel ?? descriptor?.channel ?? this._getDefaultTarget();
      return this.invoke(channel, action, path, args);
    };
    return wrapDescriptor(
      descriptor,
      invoker,
      targetChannel ?? descriptor?.channel ?? this._getDefaultTarget()
    );
  }
  // ========================================================================
  // OBSERVABLE API
  // ========================================================================
  /**
   * Subscribe to incoming messages
   */
  subscribe(handler) {
    return this._inbound.subscribe(handler);
  }
  /**
   * Send a message (fire-and-forget)
   */
  next(message) {
    this._send(message.channel, message);
    this._outbound.next(message);
  }
  /**
   * Emit an event to a channel
   */
  emit(targetChannel, eventType, data) {
    const message = {
      id: UUIDv4(),
      channel: targetChannel,
      sender: this._name,
      type: "event",
      payload: { type: eventType, data },
      timestamp: Date.now()
    };
    this.next(message);
  }
  /**
   * Emit connection-level signal to a specific connected channel.
   * This is the canonical notify/connect API for facade layers.
   */
  notify(targetChannel, payload = {}, type = "notify") {
    const binding = this._transports.get(targetChannel);
    if (!binding) return false;
    this._emitConnectionSignal(binding, type, {
      from: this._name,
      to: targetChannel,
      ...payload
    });
    return true;
  }
  /** Observable: Incoming messages */
  get onMessage() {
    return this._inbound;
  }
  /** Observable: Outgoing messages */
  get onOutbound() {
    return this._outbound;
  }
  /** Observable: Incoming invocations */
  get onInvocation() {
    return this._invocations;
  }
  /** Observable: Outgoing responses */
  get onResponse() {
    return this._responses;
  }
  /** Observable: Connection events (connected/notified/disconnected) */
  get onConnection() {
    return this._connectionEvents;
  }
  subscribeConnections(handler) {
    return this._connectionEvents.subscribe(handler);
  }
  queryConnections(query = {}) {
    return this._connectionRegistry.query(query);
  }
  notifyConnections(payload = {}, query = {}) {
    let sent = 0;
    const targets = this.queryConnections({ ...query, status: "active", includeClosed: false });
    for (const connection of targets) {
      const binding = this._transports.get(connection.remoteChannel);
      if (!binding) continue;
      this._emitConnectionSignal(binding, "notify", {
        connectionId: connection.id,
        from: this._name,
        to: connection.remoteChannel,
        ...payload
      });
      sent++;
    }
    return sent;
  }
  // ========================================================================
  // PROPERTIES
  // ========================================================================
  /** Channel name */
  get name() {
    return this._name;
  }
  /** Detected context type */
  get contextType() {
    return this._contextType;
  }
  /** Configuration */
  get config() {
    return this._config;
  }
  /** Connected transport names */
  get connectedChannels() {
    return [...this._transports.keys()];
  }
  /** Exposed module names */
  get exposedModules() {
    return [...this._exposed.keys()];
  }
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  /**
   * Close all connections and cleanup
   */
  close() {
    this._subscriptions.forEach((s) => s.unsubscribe());
    this._subscriptions = [];
    this._pending.clear();
    this._markAllConnectionsClosed();
    for (const binding of this._transports.values()) {
      try {
        binding.cleanup?.();
      } catch {
      }
      if (binding.transportType === "message-port" || binding.transportType === "broadcast") {
        try {
          binding.target?.close?.();
        } catch {
        }
      }
    }
    this._transports.clear();
    this._defaultTransport = null;
    this._connectionRegistry.clear();
    this._inbound.complete();
    this._outbound.complete();
    this._invocations.complete();
    this._responses.complete();
    this._connectionEvents.complete();
  }
  // ========================================================================
  // PRIVATE: Message Handling
  // ========================================================================
  _handleIncoming(data) {
    if (!data || typeof data !== "object") return;
    this._inbound.next(data);
    switch (data.type) {
      case "request":
        if (data.channel === this._name) {
          this._handleRequest(data);
        }
        break;
      case "response":
        this._handleResponse(data);
        break;
      case "event":
        break;
      case "signal":
        this._handleSignal(data);
        break;
    }
  }
  _handleResponse(data) {
    const id = data.reqId ?? data.id;
    const resolvers = this._pending.get(id);
    if (resolvers) {
      this._pending.delete(id);
      if (data.payload?.error) {
        resolvers.reject(new Error(data.payload.error));
      } else {
        const result = data.payload?.result;
        const descriptor = data.payload?.descriptor;
        if (result !== null && result !== void 0) {
          resolvers.resolve(result);
        } else if (descriptor) {
          resolvers.resolve(this.wrapDescriptor(descriptor, data.sender));
        } else {
          resolvers.resolve(void 0);
        }
      }
      this._responses.next({
        id,
        channel: data.channel,
        sender: data.sender,
        result: data.payload?.result,
        descriptor: data.payload?.descriptor,
        timestamp: Date.now()
      });
    }
  }
  async _handleRequest(data) {
    const payload = data.payload;
    if (!payload) return;
    const { action, path, args, sender } = payload;
    const reqId = data.reqId ?? data.id;
    this._invocations.next({
      id: reqId,
      channel: this._name,
      sender,
      action,
      path,
      args: args ?? [],
      timestamp: Date.now(),
      contextType: detectIncomingContextType(data)
    });
    const { result, toTransfer, newPath } = await this._executeAction(action, path, args ?? [], sender);
    await this._sendResponse(reqId, action, sender, newPath, result, toTransfer);
  }
  async _executeAction(action, path, args, sender) {
    const { result, toTransfer, path: newPath } = executeAction(
      action,
      path,
      args,
      {
        channel: this._name,
        sender,
        reflect: this._config.reflect
      }
    );
    return { result: await result, toTransfer, newPath };
  }
  async _sendResponse(reqId, action, sender, path, rawResult, toTransfer) {
    const { response: coreResponse, transfer } = await buildResponse(
      reqId,
      action,
      this._name,
      sender,
      path,
      rawResult,
      toTransfer
    );
    const response = {
      id: reqId,
      ...coreResponse,
      timestamp: Date.now(),
      transferable: transfer
    };
    this._send(sender, response, transfer);
  }
  // ========================================================================
  // PRIVATE: Transport Management
  // ========================================================================
  _handleSignal(data) {
    const payload = data?.payload ?? {};
    const remoteChannel = payload.from ?? data.sender ?? "unknown";
    const transportType = data.transportType ?? this._transports.get(data.channel)?.transportType ?? "internal";
    const connection = this._registerConnection({
      localChannel: this._name,
      remoteChannel,
      sender: data.sender ?? remoteChannel,
      transportType,
      direction: "incoming"
    });
    this._markConnectionNotified(connection, payload);
  }
  _registerConnection(params) {
    return this._connectionRegistry.register(params);
  }
  _markConnectionNotified(connection, payload) {
    this._connectionRegistry.markNotified(connection, payload);
  }
  _emitConnectionSignal(binding, signalType, payload = {}) {
    const message = {
      id: UUIDv4(),
      type: "signal",
      channel: binding.targetChannel,
      sender: this._name,
      transportType: binding.transportType,
      payload: {
        type: signalType,
        from: this._name,
        to: binding.targetChannel,
        ...payload
      },
      timestamp: Date.now()
    };
    (binding?.sender ?? binding?.postMessage)?.call(binding, message);
    const connection = this._registerConnection({
      localChannel: this._name,
      remoteChannel: binding.targetChannel,
      sender: this._name,
      transportType: binding.transportType,
      direction: "outgoing"
    });
    this._markConnectionNotified(connection, message.payload);
  }
  _sendSignalToTarget(target, transportType, payload, signalType) {
    const message = {
      id: UUIDv4(),
      type: "signal",
      channel: payload.to ?? this._name,
      sender: this._name,
      transportType,
      payload: {
        type: signalType,
        ...payload
      },
      timestamp: Date.now()
    };
    try {
      if (transportType === "websocket") {
        target?.send?.(JSON.stringify(message));
        return;
      }
      if (transportType === "chrome-runtime") {
        chrome.runtime?.sendMessage?.(message);
        return;
      }
      if (transportType === "chrome-tabs") {
        const tabId = payload.tabId;
        if (tabId != null) chrome.tabs?.sendMessage?.(tabId, message);
        return;
      }
      if (transportType === "chrome-port") {
        target?.postMessage?.(message);
        return;
      }
      if (transportType === "chrome-external") {
        if (payload.externalId) chrome.runtime?.sendMessage?.(payload.externalId, message);
        return;
      }
      target?.postMessage?.(message, { transfer: [] });
    } catch {
    }
  }
  _markAllConnectionsClosed() {
    this._connectionRegistry.closeAll();
  }
  _createTransportBinding(target, transportType, targetChannel, options) {
    let sender;
    let cleanup;
    switch (transportType) {
      case "worker":
      case "message-port":
      case "broadcast":
        if (options.autoStart !== false && target.start) target.start();
        sender = (msg, transfer) => target.postMessage(msg, { transfer });
        {
          const listener = ((e) => this._handleIncoming(e.data));
          target.addEventListener?.("message", listener);
          cleanup = () => target.removeEventListener?.("message", listener);
        }
        break;
      case "websocket":
        sender = (msg) => target.send(JSON.stringify(msg));
        {
          const listener = ((e) => {
            try {
              this._handleIncoming(JSON.parse(e.data));
            } catch {
            }
          });
          target.addEventListener?.("message", listener);
          cleanup = () => target.removeEventListener?.("message", listener);
        }
        break;
      case "chrome-runtime":
        sender = (msg) => chrome.runtime.sendMessage(msg);
        {
          const listener = (msg) => this._handleIncoming(msg);
          chrome.runtime.onMessage?.addListener?.(listener);
          cleanup = () => chrome.runtime.onMessage?.removeListener?.(listener);
        }
        break;
      case "chrome-tabs":
        sender = (msg) => {
          if (options.tabId != null) chrome.tabs?.sendMessage?.(options.tabId, msg);
        };
        {
          const listener = (msg, senderMeta) => {
            if (options.tabId != null && senderMeta?.tab?.id !== options.tabId) return false;
            this._handleIncoming(msg);
            return true;
          };
          chrome.runtime.onMessage?.addListener?.(listener);
          cleanup = () => chrome.runtime.onMessage?.removeListener?.(listener);
        }
        break;
      case "chrome-port":
        if (target?.postMessage && target?.onMessage?.addListener) {
          sender = (msg) => target.postMessage(msg);
          const listener = (msg) => this._handleIncoming(msg);
          target.onMessage.addListener(listener);
          cleanup = () => {
            try {
              target.onMessage.removeListener(listener);
            } catch {
            }
            try {
              target.disconnect?.();
            } catch {
            }
          };
        } else {
          const portName = options.portName ?? targetChannel;
          const port = options.tabId != null && chrome.tabs?.connect ? chrome.tabs.connect(options.tabId, { name: portName }) : chrome.runtime.connect({ name: portName });
          sender = (msg) => port.postMessage(msg);
          const listener = (msg) => this._handleIncoming(msg);
          port.onMessage.addListener(listener);
          cleanup = () => {
            try {
              port.onMessage.removeListener(listener);
            } catch {
            }
            try {
              port.disconnect();
            } catch {
            }
          };
        }
        break;
      case "chrome-external":
        sender = (msg) => {
          if (options.externalId) chrome.runtime.sendMessage(options.externalId, msg);
        };
        {
          const listener = (msg) => {
            this._handleIncoming(msg);
            return true;
          };
          chrome.runtime.onMessageExternal?.addListener?.(listener);
          cleanup = () => chrome.runtime.onMessageExternal?.removeListener?.(listener);
        }
        break;
      case "self":
        sender = (msg, transfer) => postMessage(msg, { transfer: transfer ?? [] });
        {
          const listener = ((e) => this._handleIncoming(e.data));
          addEventListener?.("message", listener);
          cleanup = () => removeEventListener?.("message", listener);
        }
        break;
      default:
        if (options.onMessage) {
          cleanup = options.onMessage((msg) => this._handleIncoming(msg));
        }
        sender = (msg) => target?.postMessage?.(msg);
    }
    return {
      target,
      targetChannel,
      transportType,
      sender,
      cleanup,
      postMessage: (message, options2) => sender?.(message, options2),
      start: () => target?.start?.(),
      close: () => target?.close?.()
    };
  }
  _send(targetChannel, message, transfer) {
    const binding = this._transports.get(targetChannel) ?? this._defaultTransport;
    (binding?.sender ?? binding?.postMessage)?.call(binding, message, transfer);
  }
  _getDefaultTarget() {
    if (this._defaultTransport) {
      return this._defaultTransport.targetChannel;
    }
    return "worker";
  }
  _inferTargetChannel(target, transportType) {
    if (transportType === "worker") return "worker";
    if (transportType === "broadcast" && target.name) return target.name;
    if (transportType === "self") return "self";
    return `${transportType}-${UUIDv4().slice(0, 8)}`;
  }
  // ========================================================================
  // PRIVATE: Proxy Creation
  // ========================================================================
  _createProxy(targetChannel, basePath) {
    const invoker = (action, path, args) => {
      return this.invoke(targetChannel, action, path, args);
    };
    return createRemoteProxy(invoker, {
      channel: targetChannel,
      basePath,
      cache: true,
      timeout: this._config.timeout
    });
  }
  // ========================================================================
  // PRIVATE: Utilities
  // ========================================================================
  _isWorkerContext() {
    return ["worker", "shared-worker", "service-worker"].includes(this._contextType);
  }
}
function createUnifiedChannel(config) {
  return new UnifiedChannel(config);
}
function setupUnifiedChannel(name, target, options) {
  return createUnifiedChannel({ name, ...options }).attach(target, options);
}
function createUnifiedChannelPair(name1, name2, options) {
  const mc = new MessageChannel();
  mc.port1.start();
  mc.port2.start();
  const channel1 = createUnifiedChannel({ name: name1, autoListen: false, ...options }).attach(mc.port1, { targetChannel: name2 });
  const channel2 = createUnifiedChannel({ name: name2, autoListen: false, ...options }).attach(mc.port2, { targetChannel: name1 });
  return { channel1, channel2, messageChannel: mc };
}
const CHANNEL_REGISTRY = /* @__PURE__ */ new Map();
function getUnifiedChannel(name, config) {
  if (!CHANNEL_REGISTRY.has(name)) {
    CHANNEL_REGISTRY.set(name, createUnifiedChannel({ name, ...config }));
  }
  return CHANNEL_REGISTRY.get(name);
}
function getUnifiedChannelNames() {
  return [...CHANNEL_REGISTRY.keys()];
}
function closeUnifiedChannel(name) {
  const channel = CHANNEL_REGISTRY.get(name);
  if (channel) {
    channel.close();
    return CHANNEL_REGISTRY.delete(name);
  }
  return false;
}
let WORKER_CHANNEL = null;
function getWorkerChannel$1() {
  if (!WORKER_CHANNEL) {
    const contextType = detectContextType();
    if (["worker", "shared-worker", "service-worker"].includes(contextType)) {
      WORKER_CHANNEL = createUnifiedChannel({ name: "worker", autoListen: true });
    } else {
      WORKER_CHANNEL = createUnifiedChannel({ name: "host", autoListen: false });
    }
  }
  return WORKER_CHANNEL;
}
function exposeFromUnified(name, obj) {
  getWorkerChannel$1().expose(name, obj);
}
function remoteFromUnified(moduleName, targetChannel) {
  return getWorkerChannel$1().remote(moduleName, targetChannel);
}

class RequestProxyHandlerV2 {
  constructor(hostChannelInstance = null, options = {}) {
    this.hostChannelInstance = hostChannelInstance;
    this.options = options;
    this._channel = getWorkerChannel$1();
  }
  _channel;
  dispatch(action, args) {
    const targetChannel = this.options?.connectChannel ?? "worker";
    const path = args?.[1] ?? [];
    return this._channel.invoke(targetChannel, action, path, args.slice(2) ?? []);
  }
}
class ObservableRequestProxyHandler extends RequestProxyHandlerV2 {
}
const wrapChannel = (connectChannel, host = null) => {
  const channel = getWorkerChannel$1();
  return channel.proxy(connectChannel);
};
const wrapObservableChannel = (channelObs, connectChannel, options = {}) => wrapChannel(connectChannel, null);
const makeObservableRequestProxy = (descriptor, channelObs, options = {}) => {
  const channel = getWorkerChannel$1();
  return channel.wrapDescriptor(descriptor, descriptor?.channel ?? options?.connectChannel);
};
function createObservableChannel(transport, channelName) {
  const channel = createUnifiedChannel({ name: channelName, autoListen: false });
  channel.connect(transport, { targetChannel: channelName });
  return {
    observable: channel,
    wrap: (connectChannel, opts) => channel.proxy(connectChannel),
    subscribe: (obs) => channel.subscribe(obs),
    send: (msg) => channel.next(msg),
    request: (msg) => channel.invoke(channelName, WReflectAction.CALL, [], [msg])
  };
}

const PMS = Promise;
const TS = {
  rjb: "rejectBy",
  rvb: "resolveBy",
  rj: "reject",
  rv: "resolve",
  cr: "create",
  cs: "createSync",
  a: "array",
  ta: "typedarray",
  udf: "undefined"
};

const Transferable = [
  /* @ts-ignore "" */
  typeof ArrayBuffer != TS.udf ? ArrayBuffer : null,
  /* @ts-ignore "" */
  typeof MessagePort != TS.udf ? MessagePort : null,
  /* @ts-ignore "" */
  typeof ReadableStream != TS.udf ? ReadableStream : null,
  /* @ts-ignore "" */
  typeof WritableStream != TS.udf ? WritableStream : null,
  /* @ts-ignore "" */
  typeof TransformStream != TS.udf ? TransformStream : null,
  /* @ts-ignore "" */
  typeof WebTransportReceiveStream != TS.udf ? WebTransportReceiveStream : null,
  /* @ts-ignore "" */
  typeof WebTransportSendStream != TS.udf ? WebTransportSendStream : null,
  /* @ts-ignore "" */
  typeof AudioData != TS.udf ? AudioData : null,
  /* @ts-ignore "" */
  typeof ImageBitmap != TS.udf ? ImageBitmap : null,
  /* @ts-ignore "" */
  typeof VideoFrame != TS.udf ? VideoFrame : null,
  /* @ts-ignore "" */
  typeof OffscreenCanvas != TS.udf ? OffscreenCanvas : null,
  /* @ts-ignore "" */
  typeof RTCDataChannel != TS.udf ? RTCDataChannel : null
].filter((E) => E != null);
const FORBIDDEN_KEYS = /* @__PURE__ */ new Set(["bind", "toString", "then", "catch", "finally"]);
const doOnlyAfterResolve = (meta, cb) => {
  if (isPromise(meta)) {
    const chain = meta?.then?.(cb)?.catch?.(console.trace.bind(console)) ?? cb(meta);
    return chain;
  }
  return cb(meta);
};

const RemoteChannels = /* @__PURE__ */ new Map();
const SELF_CHANNEL = {
  name: "unknown",
  instance: null
};
const CHANNEL_MAP = /* @__PURE__ */ new Map();
const isReflectAction$1 = (action) => [...Object.values(WReflectAction)].includes(action);
const loadWorker$1 = (WX) => {
  if (WX instanceof Worker) return WX;
  if (WX instanceof URL) return new Worker(WX.href, { type: "module" });
  if (typeof WX === "function") {
    try {
      return new WX({ type: "module" });
    } catch {
      return WX({ type: "module" });
    }
  }
  if (typeof WX === "string") {
    if (WX.startsWith("/")) return new Worker(new URL(WX.replace(/^\//, "./"), import.meta.url).href, { type: "module" });
    if (URL.canParse(WX) || WX.startsWith("./")) return new Worker(new URL(WX, import.meta.url).href, { type: "module" });
    return new Worker(URL.createObjectURL(new Blob([WX], { type: "application/javascript" })), { type: "module" });
  }
  if (WX instanceof Blob || WX instanceof File) return new Worker(URL.createObjectURL(WX), { type: "module" });
  return WX ?? (typeof self !== "undefined" ? self : null);
};
let RemoteChannelHelper$1 = class RemoteChannelHelper {
  constructor(channelName, options = {}) {
    this.channelName = channelName;
    this.options = options;
    this._channel = getWorkerChannel$1();
  }
  _channel;
  request(path, action, args, options = {}) {
    if (typeof path === "string") path = [path];
    if (Array.isArray(action) && isReflectAction$1(path)) {
      options = args;
      args = action;
      action = path;
      path = [];
    }
    return this._channel.invoke(this.channelName, action, path, args);
  }
  doImportModule(url, options) {
    return this._channel.import(url, this.channelName);
  }
};
let ChannelHandler$1 = class ChannelHandler {
  constructor(channel, options = {}) {
    this.channel = channel;
    this.options = options;
    this._unified = createUnifiedChannel({ name: channel, autoListen: false });
    SELF_CHANNEL.name = channel;
    SELF_CHANNEL.instance = this;
  }
  _unified;
  broadcasts = {};
  createRemoteChannel(channel, options = {}, broadcast) {
    if (broadcast) {
      this._unified.attach(broadcast, { targetChannel: channel });
      this.broadcasts[channel] = broadcast;
    }
    return Promise.resolve(new RemoteChannelHelper$1(channel, options));
  }
  getChannel() {
    return this.channel;
  }
  request(path, action, args, options = {}, toChannel = "worker") {
    if (typeof path === "string") path = [path];
    if (Array.isArray(action) && isReflectAction$1(path)) {
      toChannel = options;
      options = args;
      args = action;
      action = path;
      path = [];
    }
    return this._unified.invoke(toChannel, action, path, args);
  }
  resolveResponse(reqId, result) {
    return Promise.resolve(result);
  }
  async handleAndResponse(request, reqId, responseFn) {
    const result = await handleRequest(request, reqId, this.channel);
    if (!result) return;
    responseFn?.(result.response, result.transfer);
  }
  close() {
    this._unified.close();
  }
};
const initChannelHandler = (channel = "$host$") => {
  if (SELF_CHANNEL?.instance && channel === "$host$") return SELF_CHANNEL.instance;
  if (CHANNEL_MAP.has(channel)) return CHANNEL_MAP.get(channel) ?? null;
  const $channel = new ChannelHandler$1(channel);
  if (channel === "$host$") {
    SELF_CHANNEL.name = channel;
    SELF_CHANNEL.instance = $channel;
  }
  CHANNEL_MAP.set(channel, $channel);
  return $channel;
};
const createHostChannel = (channel = "$host$") => initChannelHandler(channel);
const createOrUseExistingChannel = (channel, options = {}, broadcast = typeof self !== "undefined" ? self : null) => {
  const $host = createHostChannel(channel ?? "$host$");
  return $host?.createRemoteChannel?.(channel, options, broadcast) ?? $host;
};
const $createOrUseExistingChannel = (channel, options = {}, broadcast) => {
  if (channel == null || broadcast) return;
  if (RemoteChannels.has(channel)) return RemoteChannels.get(channel);
  const result = { channel, instance: SELF_CHANNEL.instance, remote: Promise.resolve(new RemoteChannelHelper$1(channel, options)) };
  RemoteChannels.set(channel, result);
  return result;
};

const rg = "register";
class UUIDMap {
  #weakMap = /* @__PURE__ */ new WeakMap();
  #refMap = /* @__PURE__ */ new Map();
  #registry = new FinalizationRegistry((_) => {
  });
  #linked = /* @__PURE__ */ new Map();
  //
  constructor() {
    this.#linked = /* @__PURE__ */ new Map();
    this.#weakMap = /* @__PURE__ */ new WeakMap();
    this.#refMap = /* @__PURE__ */ new Map();
    this.#registry = new FinalizationRegistry((key) => {
      this.#refMap.delete(key);
    });
  }
  // when transfer out required
  delete(key) {
    if (typeof key == "object" || typeof key == "function") {
      return this.#weakMap.delete(key);
    }
    return this.#refMap.delete(key);
  }
  //
  add(obj, id = "", force = false) {
    obj = obj instanceof WeakRef ? obj?.deref?.() : obj;
    if (!(typeof obj == "object" || typeof obj == "function")) return obj;
    if (id && this.#refMap.has(id) && !force) {
      return id;
    }
    ;
    if (this.#weakMap.has(obj)) {
      return this.#weakMap.get(obj);
    }
    ;
    this.#weakMap.set(obj, id ||= UUIDv4());
    this.#refMap.set(id, new WeakRef(this.count(obj) ?? obj));
    this.#registry?.[rg]?.(obj, id);
    return id;
  }
  //
  discount(obj) {
    obj = obj instanceof WeakRef ? obj?.deref?.() : obj;
    obj = typeof obj == "object" || typeof obj == "function" ? obj : this.#refMap.get(obj);
    obj = obj instanceof WeakRef ? obj?.deref?.() : obj;
    if (!obj) return obj;
    const hold = this.#linked?.get?.(obj) || 0;
    if (hold <= 1) {
      this.#linked.delete(obj);
    } else {
      this.#linked.set(obj, hold - 1);
    }
    return obj;
  }
  //
  count(obj) {
    obj = obj instanceof WeakRef ? obj?.deref?.() : obj;
    if (!obj) return obj;
    const hold = this.#linked.get(obj);
    if (!hold) {
      this.#linked.set(obj, 1);
    } else {
      this.#linked.set(obj, hold + 1);
    }
    return obj;
  }
  //
  has(key) {
    if (typeof key == "object" || typeof key == "function") {
      return this.#weakMap.has(key);
    }
    return this.#refMap.has(key);
  }
  //
  get(key) {
    if (typeof key == "object" || typeof key == "function") {
      return this.#weakMap.get(this.count(key));
    }
    return deref(this.#refMap.get(key));
  }
}
const handMap = /* @__PURE__ */ new WeakMap();
const wrapMap = /* @__PURE__ */ new WeakMap();
const descMap = /* @__PURE__ */ new WeakMap();
const READ = (target, key) => {
  return handMap.get(target)?.[key];
};
const objectToRef = (obj, channel = SELF_CHANNEL?.name, toTransfer) => {
  if (typeof obj == "object" && obj != null || typeof obj == "function" && obj != null) {
    if (wrapMap.has(obj)) return wrapMap.get(obj);
    if (handMap.has(obj)) return handMap.get(obj);
    if (isNotComplexArray(obj)) return obj;
    if (toTransfer?.includes?.(obj)) return obj;
    if (channel == SELF_CHANNEL?.name) return obj;
    return {
      $isDescriptor: true,
      path: registeredInPath.get(obj) ?? (() => {
        const path = [UUIDv4()];
        writeByPath(path, obj);
        return path;
      })(),
      owner: SELF_CHANNEL?.name,
      channel,
      primitive: isPrimitive(obj),
      writable: true,
      enumerable: true,
      configurable: true,
      argumentCount: obj instanceof Function ? obj.length : -1
    };
  }
  return isCanJustReturn(obj) ? obj : null;
};
const $requestHandler = Symbol.for("@requestHandler");
const $descriptor = Symbol.for("@descriptor");
const normalizeRef = (v) => {
  if (isCanJustReturn(v)) return v;
  if (v?.[$descriptor]) return v;
  if (v?.$isDescriptor) return makeRequestProxy(v, {});
  if (isNotComplexArray(v)) return v;
  return null;
};
const unwrapDescriptorFromProxy = (target) => {
  if (typeof target != "function" && typeof target != "object" || target == null) {
    return target;
  }
  return wrapMap.get(target) ?? handMap.get(target) ?? target;
};
const unwrapDescriptorFromProxyRecursive = (target) => {
  if (typeof target != "object" && typeof target != "function" || target == null) {
    return target;
  }
  target = unwrapDescriptorFromProxy(target);
  if (typeof target != "object" && typeof target != "function" || target == null) {
    return target;
  }
  if (Array.isArray(target)) {
    return target.map(unwrapDescriptorFromProxyRecursive);
  }
  if (target instanceof Map) {
    return new Map(Array.from(target.entries()).map(([key, value]) => [key, unwrapDescriptorFromProxyRecursive(value)]));
  }
  if (target instanceof Set) {
    return new Set(Array.from(target.values()).map(unwrapDescriptorFromProxyRecursive));
  }
  if (typeof target == "object") {
    for (const key of Object.keys(target)) {
      target[key] = unwrapDescriptorFromProxyRecursive(target[key]);
    }
  }
  return target;
};
const storedData = /* @__PURE__ */ new Map();
const registeredInPath = /* @__PURE__ */ new WeakMap();
const traverseByPath = (obj, path) => {
  if (path != null && !Array.isArray(path)) {
    path = [path];
  }
  if (path == null || path?.length < 1) {
    return obj;
  }
  const $desc = obj?.[$descriptor] ?? (obj?.$isDescriptor ? obj : null);
  if ($desc && $desc?.owner == SELF_CHANNEL?.name) {
    obj = readByPath($desc?.path) ?? obj;
  }
  if (isPrimitive(obj)) {
    return obj;
  }
  for (const key of path) {
    obj = obj?.[key];
    if (obj == null) {
      return obj;
    }
  }
  return obj;
};
const readByPath = (path) => {
  if (path != null && !Array.isArray(path)) {
    path = [path];
  }
  if (path == null || path?.length < 1) {
    return null;
  }
  const root = storedData?.get?.(path?.[0]) ?? null;
  return root != null ? traverseByPath(root, path?.slice?.(1)) : null;
};
const writeByPath = (path, data) => {
  const $desc = data?.[$descriptor] ?? (data?.$isDescriptor ? data : null);
  if ($desc && $desc?.owner == SELF_CHANNEL?.name) {
    data = readByPath($desc?.path) ?? data;
  }
  if (path != null && !Array.isArray(path)) {
    path = [path];
  }
  if (path == null || path?.length < 1) {
    return null;
  }
  const root = storedData?.get?.(path?.[0]) ?? null;
  if (path?.length > 1) {
    traverseByPath(root, path?.slice?.(1, -1))[path?.[path?.length - 1]] = data;
  } else {
    storedData?.set?.(path?.[0], data);
  }
  if (typeof data == "object" || typeof data == "function") {
    registeredInPath?.set?.(data, path);
  }
  return data;
};
const removeByPath = (path) => {
  if (path != null && !Array.isArray(path)) {
    path = [path];
  }
  if (path == null || path?.length < 1) {
    return false;
  }
  const root = storedData?.get?.(path?.[0]) ?? null;
  if (!root && path?.length <= 1) {
    storedData?.delete?.(path?.[0]);
    return true;
  } else {
    return false;
  }
  delete traverseByPath(root, path?.slice?.(1, -1))[path?.[path?.length - 1]];
  if ((typeof root == "object" || typeof root == "function") && path?.length <= 1) {
    registeredInPath?.delete?.(root);
  }
  return true;
};
const removeByData = (data) => {
  const $desc = data?.[$descriptor] ?? (data?.$isDescriptor ? data : null);
  if ($desc && $desc?.owner == SELF_CHANNEL?.name) {
    data = readByPath($desc?.path) ?? data;
  }
  const path = registeredInPath?.get?.(data) ?? $desc?.path;
  if (path == null || path?.length < 1) {
    return false;
  }
  ;
  removeByPath(path);
  if (typeof data == "object" || typeof data == "function") {
    registeredInPath?.delete?.(data);
  }
  return true;
};
const hasNoPath = (data) => {
  const $desc = data?.[$descriptor] ?? (data?.$isDescriptor ? data : null);
  return (registeredInPath?.get?.(data) ?? $desc?.path) == null;
};

const isObject = (obj) => (typeof obj === "object" || typeof obj === "function") && obj != null;
const defaultReflect = {
  get: (t, p) => t?.[p],
  set: (t, p, v) => {
    t[p] = v;
    return true;
  },
  has: (t, p) => p in t,
  apply: (t, ctx, args) => t.apply(ctx, args),
  construct: (t, args) => new t(...args),
  deleteProperty: (t, p) => delete t[p],
  ownKeys: (t) => Object.keys(t),
  getOwnPropertyDescriptor: (t, p) => Object.getOwnPropertyDescriptor(t, p),
  getPrototypeOf: (t) => Object.getPrototypeOf(t),
  setPrototypeOf: (t, p) => Object.setPrototypeOf(t, p),
  isExtensible: (t) => Object.isExtensible(t),
  preventExtensions: (t) => Object.preventExtensions(t)
};
function executeAction(action, path, args, options = {}) {
  const { channel = "", sender = "", reflect = defaultReflect } = options;
  const obj = options.target ?? readByPath(path);
  const toTransfer = [];
  let result = null;
  let newPath = path;
  const act = String(action).toLowerCase();
  switch (act) {
    case "import":
    case WReflectAction.IMPORT:
      result = import(args?.[0]);
      break;
    case "transfer":
    case WReflectAction.TRANSFER:
      if (isCanTransfer(obj) && channel !== sender) {
        toTransfer.push(obj);
      }
      result = obj;
      break;
    case "get":
    case WReflectAction.GET: {
      const prop = args?.[0];
      const got = reflect.get?.(obj, prop) ?? obj?.[prop];
      result = typeof got === "function" && obj != null ? got.bind(obj) : got;
      newPath = [...path, String(prop)];
      break;
    }
    case "set":
    case WReflectAction.SET: {
      const [prop, value] = args;
      const normalizedValue = deepOperateAndClone(value, normalizeRef);
      if (options.target) {
        result = reflect.set?.(obj, prop, normalizedValue) ?? (obj[prop] = normalizedValue, true);
      } else {
        result = reflect.set?.(obj, prop, normalizedValue) ?? writeByPath([...path, String(prop)], normalizedValue);
      }
      break;
    }
    case "apply":
    case "call":
    case WReflectAction.APPLY:
    case WReflectAction.CALL: {
      if (typeof obj === "function") {
        const ctx = options.context ?? (options.target ? void 0 : readByPath(path.slice(0, -1)));
        const normalizedArgs = deepOperateAndClone(args?.[0] ?? args ?? [], normalizeRef);
        result = reflect.apply?.(obj, ctx, normalizedArgs) ?? obj.apply(ctx, normalizedArgs);
        if (isCanTransfer(result) && path?.at(-1) === "transfer" && channel !== sender) {
          toTransfer.push(result);
        }
      }
      break;
    }
    case "construct":
    case WReflectAction.CONSTRUCT: {
      if (typeof obj === "function") {
        const normalizedArgs = deepOperateAndClone(args?.[0] ?? args ?? [], normalizeRef);
        result = reflect.construct?.(obj, normalizedArgs) ?? new obj(...normalizedArgs);
      }
      break;
    }
    case "delete":
    case "deleteproperty":
    case "dispose":
    case WReflectAction.DELETE:
    case WReflectAction.DELETE_PROPERTY:
    case WReflectAction.DISPOSE:
      if (options.target) {
        const prop = path[path.length - 1];
        result = reflect.deleteProperty?.(obj, prop) ?? delete obj[prop];
      } else {
        result = path?.length > 0 ? removeByPath(path) : removeByData(obj);
        if (result) newPath = registeredInPath.get(obj) ?? [];
      }
      break;
    case "has":
    case WReflectAction.HAS:
      result = reflect.has?.(obj, args?.[0]) ?? (isObject(obj) ? args?.[0] in obj : false);
      break;
    case "ownkeys":
    case WReflectAction.OWN_KEYS:
      result = reflect.ownKeys?.(obj) ?? (isObject(obj) ? Object.keys(obj) : []);
      break;
    case "getownpropertydescriptor":
    case "getpropertydescriptor":
    case WReflectAction.GET_OWN_PROPERTY_DESCRIPTOR:
    case WReflectAction.GET_PROPERTY_DESCRIPTOR:
      result = reflect.getOwnPropertyDescriptor?.(obj, args?.[0] ?? path?.at(-1) ?? "") ?? (isObject(obj) ? Object.getOwnPropertyDescriptor(obj, args?.[0] ?? path?.at(-1) ?? "") : void 0);
      break;
    case "getprototypeof":
    case WReflectAction.GET_PROTOTYPE_OF:
      result = reflect.getPrototypeOf?.(obj) ?? (isObject(obj) ? Object.getPrototypeOf(obj) : null);
      break;
    case "setprototypeof":
    case WReflectAction.SET_PROTOTYPE_OF:
      result = reflect.setPrototypeOf?.(obj, args?.[0]) ?? (isObject(obj) ? Object.setPrototypeOf(obj, args?.[0]) : false);
      break;
    case "isextensible":
    case WReflectAction.IS_EXTENSIBLE:
      result = reflect.isExtensible?.(obj) ?? (isObject(obj) ? Object.isExtensible(obj) : true);
      break;
    case "preventextensions":
    case WReflectAction.PREVENT_EXTENSIONS:
      result = reflect.preventExtensions?.(obj) ?? (isObject(obj) ? Object.preventExtensions(obj) : false);
      break;
  }
  return { result, toTransfer, path: newPath };
}
async function executeActionAsync(action, path, args, options = {}) {
  const { result, toTransfer, path: newPath } = executeAction(action, path, args, options);
  return { result: await result, toTransfer, path: newPath };
}
async function buildResponse(reqId, action, channel, sender, path, rawResult, toTransfer) {
  const result = await rawResult;
  const canBeReturn = isCanTransfer(result) && toTransfer.includes(result) || isCanJustReturn(result);
  let finalPath = path;
  if (!canBeReturn && action !== "get" && action !== WReflectAction.GET && (typeof result === "object" || typeof result === "function")) {
    if (hasNoPath(result)) {
      finalPath = [UUIDv4()];
      writeByPath(finalPath, result);
    } else {
      finalPath = registeredInPath.get(result) ?? [];
    }
  }
  const ctx = readByPath(finalPath);
  const ctxKey = action === "get" || action === WReflectAction.GET ? finalPath?.at(-1) : void 0;
  const obj = readByPath(path);
  const payload = deepOperateAndClone(result, (el) => objectToRef(el, channel, toTransfer)) ?? result;
  return {
    response: {
      channel: sender,
      sender: channel,
      reqId,
      action,
      type: "response",
      payload: {
        result: canBeReturn ? payload : null,
        type: typeof result,
        channel: sender,
        sender: channel,
        descriptor: {
          $isDescriptor: true,
          path: finalPath,
          owner: channel,
          channel,
          primitive: isPrimitive(result),
          writable: true,
          enumerable: true,
          configurable: true,
          argumentCount: obj instanceof Function ? obj.length : -1,
          ...isObject(ctx) && ctxKey != null ? Object.getOwnPropertyDescriptor(ctx, ctxKey) : {}
        }
      }
    },
    transfer: toTransfer
  };
}
async function handleRequest(request, reqId, channelName, options) {
  const { channel, sender, path, action, args } = request;
  if (channel !== channelName) return null;
  const { result, toTransfer, path: newPath } = executeAction(
    action,
    path,
    args,
    { channel, sender, ...options }
  );
  return buildResponse(reqId, action, channelName, sender, newPath, result, toTransfer);
}
function createObjectHandler(target, reflect = defaultReflect) {
  return async (action, path, args) => {
    let parent = target;
    let current = target;
    for (let i = 0; i < path.length; i++) {
      parent = current;
      current = current?.[path[i]];
      if (current === void 0 && i < path.length - 1) {
        throw new Error(`Path segment '${path[i]}' not found`);
      }
    }
    const prop = path[path.length - 1];
    const act = String(action).toLowerCase();
    switch (act) {
      case "get":
      case WReflectAction.GET:
        return current;
      case "set":
      case WReflectAction.SET:
        parent[prop] = args[0];
        return true;
      case "call":
      case "apply":
      case WReflectAction.APPLY:
      case WReflectAction.CALL:
        if (typeof current === "function") {
          const callArgs = Array.isArray(args[0]) ? args[0] : args;
          return await current.apply(parent, callArgs);
        }
        throw new Error(`'${prop}' is not a function`);
      case "construct":
      case WReflectAction.CONSTRUCT:
        if (typeof current === "function") {
          const ctorArgs = Array.isArray(args[0]) ? args[0] : args;
          return new current(...ctorArgs);
        }
        throw new Error(`'${prop}' is not a constructor`);
      case "has":
      case WReflectAction.HAS:
        return prop in parent;
      case "delete":
      case "deleteproperty":
      case WReflectAction.DELETE_PROPERTY:
        return delete parent[prop];
      case "ownkeys":
      case WReflectAction.OWN_KEYS:
        return Object.keys(current ?? parent);
      default:
        return current;
    }
  };
}

class ChannelConnection {
  constructor(_name, _transportType = "internal", options = {}) {
    this._name = _name;
    this._transportType = _transportType;
    this._opts = {
      timeout: 3e4,
      autoReconnect: true,
      reconnectInterval: 1e3,
      maxReconnectAttempts: 5,
      bufferMessages: true,
      bufferSize: 1e3,
      metadata: {},
      ...options
    };
    this._setupSubscriptions();
  }
  _id = UUIDv4();
  _state = "disconnected";
  _inbound = new ChannelSubject({ bufferSize: 1e3 });
  _outbound = new ChannelSubject({ bufferSize: 1e3 });
  _stateChanges = new ChannelSubject();
  _connectedPeers = /* @__PURE__ */ new Map();
  _subs = [];
  _stats = { messagesSent: 0, messagesReceived: 0, bytesTransferred: 0, latencyMs: 0, uptime: 0, reconnectCount: 0 };
  _startTime = 0;
  // @ts-ignore
  _pending = /* @__PURE__ */ new Map();
  _buffer = [];
  _opts;
  // Observable API
  subscribe(observer, fromChannel) {
    const src = fromChannel ? filter((m) => m.sender === fromChannel)(this._inbound) : this._inbound;
    return src.subscribe(typeof observer === "function" ? { next: observer } : observer);
  }
  next(message) {
    if (this._state !== "connected") {
      if (this._opts.bufferMessages && this._buffer.length < this._opts.bufferSize) {
        this._buffer.push(message);
      }
      return;
    }
    this._outbound.next(message);
    this._stats.messagesSent++;
  }
  async request(toChannel, payload, opts = {}) {
    const reqId = UUIDv4();
    const resolvers = Promise.withResolvers();
    this._pending.set(reqId, resolvers);
    const timeout = setTimeout(() => {
      if (this._pending.has(reqId)) {
        this._pending.delete(reqId);
        resolvers.reject(new Error(`Request timeout`));
      }
    }, opts.timeout ?? this._opts.timeout);
    this.next({
      id: UUIDv4(),
      channel: toChannel,
      sender: this._name,
      type: "request",
      reqId,
      payload: { ...payload, action: opts.action, path: opts.path },
      timestamp: Date.now()
    });
    return resolvers.promise.finally(() => clearTimeout(timeout));
  }
  respond(original, payload) {
    this.next({ id: UUIDv4(), channel: original.sender, sender: this._name, type: "response", reqId: original.reqId, payload, timestamp: Date.now() });
  }
  emit(toChannel, eventType, data) {
    this.next({ id: UUIDv4(), channel: toChannel, sender: this._name, type: "event", payload: { type: eventType, data }, timestamp: Date.now() });
  }
  subscribeOutbound(observer) {
    return this._outbound.subscribe(typeof observer === "function" ? { next: observer } : observer);
  }
  pushInbound(message) {
    this._stats.messagesReceived++;
    if (message.type === "response" && message.reqId) {
      const r = this._pending.get(message.reqId);
      if (r) {
        this._pending.delete(message.reqId);
        r.resolve(message.payload);
        return;
      }
    }
    this._inbound.next(message);
  }
  // Connection lifecycle
  async connect() {
    if (this._state === "connected") return;
    this._setState("connecting");
    this._startTime = Date.now();
    this._setState("connected");
    this._flushBuffer();
  }
  disconnect() {
    if (this._state === "disconnected" || this._state === "closed") return;
    this._setState("disconnected");
    this._subs.forEach((s) => s.unsubscribe());
    this._subs = [];
  }
  close() {
    this.disconnect();
    this._setState("closed");
    this._inbound.complete();
    this._outbound.complete();
    this._stateChanges.complete();
  }
  markConnected() {
    this._setState("connected");
    this._flushBuffer();
  }
  markDisconnected() {
    this._setState("disconnected");
  }
  // State management
  _setState(state) {
    if (this._state !== state) {
      this._state = state;
      this._stateChanges.next(state);
    }
  }
  _flushBuffer() {
    for (const msg of this._buffer) this._outbound.next(msg);
    this._buffer = [];
  }
  _setupSubscriptions() {
    this._subs.push(this._inbound.subscribe({
      next: (msg) => {
        if (msg.type === "signal" && msg.payload?.type === "connect") {
          this._connectedPeers.set(msg.sender, { name: msg.sender, state: "connected", isHost: false });
        }
      }
    }));
  }
  // Getters
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get state() {
    return this._state;
  }
  get transportType() {
    return this._transportType;
  }
  get stats() {
    return { ...this._stats, uptime: this._startTime ? Date.now() - this._startTime : 0 };
  }
  get stateChanges() {
    return this._stateChanges;
  }
  get connectedPeers() {
    return [...this._connectedPeers.keys()];
  }
  get meta() {
    return { id: this._id, name: this._name, state: this._state, isHost: false, connectedChannels: new Set(this._connectedPeers.keys()) };
  }
}
class ConnectionPool {
  _connections = /* @__PURE__ */ new Map();
  static _instance = null;
  static getInstance() {
    if (!ConnectionPool._instance) ConnectionPool._instance = new ConnectionPool();
    return ConnectionPool._instance;
  }
  getOrCreate(name, transportType = "internal", options = {}) {
    if (!this._connections.has(name)) {
      this._connections.set(name, new ChannelConnection(name, transportType, options));
    }
    return this._connections.get(name);
  }
  get(name) {
    return this._connections.get(name);
  }
  has(name) {
    return this._connections.has(name);
  }
  delete(name) {
    this._connections.get(name)?.close();
    return this._connections.delete(name);
  }
  clear() {
    this._connections.forEach((c) => c.close());
    this._connections.clear();
  }
  get size() {
    return this._connections.size;
  }
  get names() {
    return [...this._connections.keys()];
  }
}
const getConnectionPool = () => ConnectionPool.getInstance();
const getConnection = (name, transportType, options) => getConnectionPool().getOrCreate(name, transportType, options);
const getHostConnection = (name = "$host$", options) => getConnection(name, "internal", { ...options, metadata: { ...options?.metadata, isHost: true } });

class TransportAdapter {
  constructor(_channelName, _transportType, _options = {}) {
    this._channelName = _channelName;
    this._transportType = _transportType;
    this._options = _options;
  }
  _subscriptions = [];
  _isAttached = false;
  _inbound = new ChannelSubject({ bufferSize: 100 });
  _outbound = new ChannelSubject({ bufferSize: 100 });
  // Incoming connection observability
  _incomingConnections = new ChannelSubject({ bufferSize: 50 });
  _acceptCallback = null;
  detach() {
    this._subscriptions.forEach((s) => s.unsubscribe());
    this._subscriptions = [];
    this._isAttached = false;
  }
  /** Subscribe to incoming messages */
  subscribe(observer) {
    return this._inbound.subscribe(observer);
  }
  /** Send message */
  send(msg, transfer) {
    this._outbound.next({ ...msg, transferable: transfer });
  }
  // ========================================================================
  // INCOMING CONNECTION OBSERVABILITY
  // ========================================================================
  /**
   * Observable: Incoming connection requests
   */
  get onIncomingConnection() {
    return this._incomingConnections;
  }
  /**
   * Subscribe to incoming connection requests
   */
  subscribeIncoming(handler) {
    return this._incomingConnections.subscribe(handler);
  }
  /**
   * Set callback to auto-accept/reject connections
   */
  setAcceptCallback(callback) {
    this._acceptCallback = callback;
  }
  /**
   * Emit incoming connection event
   * Called by subclasses when a new connection request is detected
   */
  _emitIncomingConnection(connection) {
    this._incomingConnections.next(connection);
  }
  /**
   * Check if connection should be accepted (via callback)
   */
  async _shouldAcceptConnection(connection) {
    if (!this._acceptCallback) return true;
    return this._acceptCallback(connection);
  }
  // ========================================================================
  // GETTERS
  // ========================================================================
  get channelName() {
    return this._channelName;
  }
  get isAttached() {
    return this._isAttached;
  }
  get inbound() {
    return this._inbound;
  }
  get outbound() {
    return this._outbound;
  }
}
class WorkerTransport extends TransportAdapter {
  constructor(channelName, _workerSource, options = {}) {
    super(channelName, "worker", options);
    this._workerSource = _workerSource;
  }
  _worker = null;
  _cleanup = null;
  _ownWorker = false;
  attach() {
    if (this._isAttached) return;
    this._worker = this._resolveWorker();
    const send = createTransportSender(this._worker);
    this._cleanup = createTransportListener(
      this._worker,
      (data) => this._handleIncoming(data),
      (err) => this._inbound.error(err)
    );
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg, msg.transferable)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    if (this._ownWorker && this._worker) this._worker.terminate();
    this._worker = null;
    super.detach();
  }
  /**
   * Request a new channel in the worker
   */
  requestChannel(channel, sender, options, port) {
    const transfer = port ? [port] : [];
    this._worker?.postMessage({
      type: "createChannel",
      channel,
      sender,
      options,
      messagePort: port,
      reqId: UUIDv4()
    }, { transfer });
  }
  /**
   * Connect to an existing channel in the worker
   */
  connectChannel(channel, sender, port, options) {
    const transfer = port ? [port] : [];
    this._worker?.postMessage({
      type: "connectChannel",
      channel,
      sender,
      port,
      options,
      reqId: UUIDv4()
    }, { transfer });
  }
  /**
   * List all channels in the worker
   */
  listChannels() {
    return new Promise((resolve) => {
      const reqId = UUIDv4();
      const handler = (msg) => {
        if (msg.type === "channelList" && msg.reqId === reqId) {
          sub.unsubscribe();
          resolve(msg.channels ?? []);
        }
      };
      const sub = this._inbound.subscribe(handler);
      this._worker?.postMessage({ type: "listChannels", reqId });
      setTimeout(() => {
        sub.unsubscribe();
        resolve([]);
      }, 5e3);
    });
  }
  _handleIncoming(data) {
    if (data?.type === "channelCreated" || data?.type === "channelConnected") {
      this._emitIncomingConnection({
        id: data.reqId ?? UUIDv4(),
        channel: data.channel,
        sender: data.sender ?? "worker",
        transportType: "worker",
        data,
        timestamp: Date.now()
      });
    }
    this._inbound.next(data);
  }
  _resolveWorker() {
    if (this._workerSource instanceof Worker) return this._workerSource;
    this._ownWorker = true;
    if (typeof this._workerSource === "function") return this._workerSource();
    if (this._workerSource instanceof URL) return new Worker(this._workerSource.href, { type: "module" });
    if (typeof this._workerSource === "string") {
      if (this._workerSource.startsWith("/"))
        return new Worker(new URL(this._workerSource.replace(/^\//, "./"), import.meta.url).href, { type: "module" });
      if (URL.canParse(this._workerSource) || this._workerSource.startsWith("./"))
        return new Worker(new URL(this._workerSource, import.meta.url).href, { type: "module" });
      return new Worker(URL.createObjectURL(new Blob([this._workerSource], { type: "application/javascript" })), { type: "module" });
    }
    throw new Error("Invalid worker source");
  }
  get worker() {
    return this._worker;
  }
}
class MessagePortTransport extends TransportAdapter {
  constructor(channelName, _port, options = {}) {
    super(channelName, "message-port", options);
    this._port = _port;
  }
  _cleanup = null;
  attach() {
    if (this._isAttached) return;
    const send = createTransportSender(this._port);
    this._cleanup = createTransportListener(this._port, (data) => this._inbound.next(data));
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg, msg.transferable)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    this._port.close();
    super.detach();
  }
  get port() {
    return this._port;
  }
}
class BroadcastChannelTransport extends TransportAdapter {
  constructor(channelName, _bcName, options = {}) {
    super(channelName, "broadcast", options);
    this._bcName = _bcName;
  }
  _channel = null;
  _cleanup = null;
  _connectedPeers = /* @__PURE__ */ new Set();
  attach() {
    if (this._isAttached) return;
    this._channel = new BroadcastChannel(this._bcName ?? this._channelName);
    const send = createTransportSender(this._channel);
    this._cleanup = createTransportListener(this._channel, (data) => {
      if (data?.sender !== this._channelName) {
        this._handleIncoming(data);
      }
    });
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg)));
    this._isAttached = true;
    this._announcePresence();
  }
  _handleIncoming(data) {
    if (data?.type === "announce" || data?.type === "connect") {
      const sender = data.sender ?? "unknown";
      const isNew = !this._connectedPeers.has(sender);
      this._connectedPeers.add(sender);
      if (isNew) {
        this._emitIncomingConnection({
          id: data.reqId ?? UUIDv4(),
          channel: data.channel ?? this._channelName,
          sender,
          transportType: "broadcast",
          data,
          timestamp: Date.now()
        });
        if (data.type === "announce") {
          this._channel?.postMessage({
            type: "announce-ack",
            channel: this._channelName,
            sender: this._channelName
          });
        }
      }
    }
    this._inbound.next(data);
  }
  _announcePresence() {
    this._channel?.postMessage({
      type: "announce",
      channel: this._channelName,
      sender: this._channelName,
      timestamp: Date.now()
    });
  }
  /**
   * Get connected peers
   */
  get connectedPeers() {
    return [...this._connectedPeers];
  }
  detach() {
    this._cleanup?.();
    this._channel?.close();
    this._channel = null;
    this._connectedPeers.clear();
    super.detach();
  }
}
class WebSocketTransport extends TransportAdapter {
  constructor(channelName, _url, _protocols, options = {}) {
    super(channelName, "websocket", options);
    this._url = _url;
    this._protocols = _protocols;
  }
  _ws = null;
  _cleanup = null;
  _pending = [];
  _state = new ChannelSubject();
  _connectedChannels = /* @__PURE__ */ new Set();
  attach() {
    if (this._isAttached) return;
    const url = typeof this._url === "string" ? this._url : this._url.href;
    this._ws = new WebSocket(url, this._protocols);
    this._state.next("connecting");
    const send = (msg) => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        const { transferable: _, ...data } = msg;
        this._ws.send(JSON.stringify(data));
      } else {
        this._pending.push(msg);
      }
    };
    this._ws.addEventListener("open", () => {
      this._state.next("open");
      this._pending.forEach((m) => send(m));
      this._pending = [];
      this._emitIncomingConnection({
        id: UUIDv4(),
        channel: this._channelName,
        sender: "server",
        transportType: "websocket",
        timestamp: Date.now()
      });
    });
    this._cleanup = createTransportListener(
      this._ws,
      (data) => this._handleIncoming(data),
      (err) => this._inbound.error(err),
      () => {
        this._state.next("closed");
        this._inbound.complete();
      }
    );
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg)));
    this._isAttached = true;
  }
  _handleIncoming(data) {
    if (data?.type === "channel-connect" || data?.type === "peer-connect" || data?.type === "join") {
      const channel = data.channel ?? data.room ?? this._channelName;
      const isNew = !this._connectedChannels.has(channel);
      if (isNew) {
        this._connectedChannels.add(channel);
        this._emitIncomingConnection({
          id: data.id ?? UUIDv4(),
          channel,
          sender: data.sender ?? data.peerId ?? "remote",
          transportType: "websocket",
          data,
          timestamp: Date.now()
        });
      }
    }
    this._inbound.next(data);
  }
  /**
   * Join/subscribe to a channel on the server
   */
  joinChannel(channel) {
    this.send({
      id: UUIDv4(),
      type: "join",
      channel,
      sender: this._channelName,
      timestamp: Date.now()
    });
  }
  /**
   * Leave/unsubscribe from a channel
   */
  leaveChannel(channel) {
    this._connectedChannels.delete(channel);
    this.send({
      id: UUIDv4(),
      type: "leave",
      channel,
      sender: this._channelName,
      timestamp: Date.now()
    });
  }
  /**
   * Get connected channels
   */
  get connectedChannels() {
    return [...this._connectedChannels];
  }
  detach() {
    this._cleanup?.();
    this._ws?.close();
    this._ws = null;
    this._connectedChannels.clear();
    super.detach();
  }
  get ws() {
    return this._ws;
  }
  get state() {
    return this._state;
  }
}
class ChromeRuntimeTransport extends TransportAdapter {
  _cleanup = null;
  constructor(channelName, options = {}) {
    super(channelName, "chrome-runtime", options);
  }
  attach() {
    if (this._isAttached) return;
    if (typeof chrome === "undefined" || !chrome.runtime) return;
    const send = createTransportSender("chrome-runtime");
    this._cleanup = createTransportListener(
      "chrome-tabs",
      (data) => this._inbound.next(data),
      void 0,
      void 0,
      { tabId: this._tabId }
    );
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    super.detach();
  }
}
class ChromeTabsTransport extends TransportAdapter {
  constructor(channelName, _tabId, options = {}) {
    super(channelName, "chrome-tabs", options);
    this._tabId = _tabId;
  }
  _cleanup = null;
  attach() {
    if (this._isAttached) return;
    if (typeof chrome === "undefined" || !chrome.tabs) return;
    const send = (msg) => {
      if (this._tabId != null) {
        const { transferable: _, ...data } = msg;
        chrome.tabs.sendMessage(this._tabId, data);
      }
    };
    this._cleanup = createTransportListener("chrome-runtime", (data) => this._inbound.next(data));
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    super.detach();
  }
  setTabId(tabId) {
    this._tabId = tabId;
  }
}
class ChromePortTransport extends TransportAdapter {
  constructor(channelName, _portName, _tabId, options = {}) {
    super(channelName, "chrome-port", options);
    this._portName = _portName;
    this._tabId = _tabId;
  }
  _cleanup = null;
  _port = null;
  attach() {
    if (this._isAttached) return;
    if (typeof chrome === "undefined" || !chrome.runtime) return;
    this._port = this._tabId != null && chrome.tabs?.connect ? chrome.tabs.connect(this._tabId, { name: this._portName }) : chrome.runtime.connect({ name: this._portName });
    const send = (msg) => this._port?.postMessage(msg);
    const onMessage = (msg) => this._inbound.next(msg);
    this._port.onMessage.addListener(onMessage);
    this._cleanup = () => {
      try {
        this._port?.onMessage.removeListener(onMessage);
      } catch {
      }
      try {
        this._port?.disconnect();
      } catch {
      }
      this._port = null;
    };
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    super.detach();
  }
}
class ChromeExternalTransport extends TransportAdapter {
  constructor(channelName, _externalId, options = {}) {
    super(channelName, "chrome-external", options);
    this._externalId = _externalId;
  }
  _cleanup = null;
  attach() {
    if (this._isAttached) return;
    if (typeof chrome === "undefined" || !chrome.runtime) return;
    const send = (msg) => chrome.runtime.sendMessage(this._externalId, msg);
    const listener = (msg) => {
      this._inbound.next(msg);
      return false;
    };
    chrome.runtime.onMessageExternal?.addListener?.(listener);
    this._cleanup = () => chrome.runtime.onMessageExternal?.removeListener?.(listener);
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    super.detach();
  }
}
class ServiceWorkerTransport extends TransportAdapter {
  constructor(channelName, _isHost = false, options = {}) {
    super(channelName, "service-worker", options);
    this._isHost = _isHost;
  }
  _cleanup = null;
  attach() {
    if (this._isAttached) return;
    const target = this._isHost ? "service-worker-host" : "service-worker-client";
    const send = createTransportSender(target);
    this._cleanup = createTransportListener(target, (data) => this._inbound.next(data));
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg, msg.transferable)));
    this._isAttached = true;
  }
  detach() {
    this._cleanup?.();
    super.detach();
  }
}
class SelfTransport extends TransportAdapter {
  _cleanup = null;
  constructor(channelName, options = {}) {
    super(channelName, "self", options);
  }
  attach() {
    if (this._isAttached) return;
    const send = createTransportSender("self");
    this._cleanup = createTransportListener("self", (data) => this._handleIncoming(data));
    this._subscriptions.push(this._outbound.subscribe((msg) => send(msg, msg.transferable)));
    this._isAttached = true;
  }
  _handleIncoming(data) {
    if (data?.type === "createChannel" || data?.type === "connectChannel") {
      this._emitIncomingConnection({
        id: data.reqId ?? UUIDv4(),
        channel: data.channel,
        sender: data.sender ?? "unknown",
        transportType: "self",
        port: data.messagePort ?? data.port,
        data,
        timestamp: Date.now()
      });
    }
    this._inbound.next(data);
  }
  /**
   * Notify sender that channel was created
   */
  notifyChannelCreated(channel, sender, reqId) {
    postMessage({
      type: "channelCreated",
      channel,
      sender,
      reqId,
      timestamp: Date.now()
    });
  }
  detach() {
    this._cleanup?.();
    super.detach();
  }
}
const TransportFactory = {
  worker: (name, source, opts) => new WorkerTransport(name, source, opts),
  messagePort: (name, port, opts) => new MessagePortTransport(name, port, opts),
  broadcast: (name, bcName, opts) => new BroadcastChannelTransport(name, bcName, opts),
  websocket: (name, url, protocols, opts) => new WebSocketTransport(name, url, protocols, opts),
  chromeRuntime: (name, opts) => new ChromeRuntimeTransport(name, opts),
  chromeTabs: (name, tabId, opts) => new ChromeTabsTransport(name, tabId, opts),
  chromePort: (name, portName, tabId, opts) => new ChromePortTransport(name, portName, tabId, opts),
  chromeExternal: (name, externalId, opts) => new ChromeExternalTransport(name, externalId, opts),
  serviceWorker: (name, isHost, opts) => new ServiceWorkerTransport(name, isHost, opts),
  self: (name, opts) => new SelfTransport(name, opts)
};
function createConnectionObserver(transports) {
  const connections = [];
  const subject = new ChannelSubject({ bufferSize: 100 });
  for (const transport of transports) {
    transport.subscribeIncoming((conn) => {
      connections.push(conn);
      subject.next(conn);
    });
  }
  return {
    subscribe: (handler) => subject.subscribe(handler),
    getConnections: () => [...connections]
  };
}

const DB_NAME = "uniform_channels";
const DB_VERSION = 1;
const STORES = {
  MESSAGES: "messages",
  MAILBOX: "mailbox",
  PENDING: "pending",
  EXCHANGE: "exchange",
  TRANSACTIONS: "transactions"
};
class ChannelStorage {
  _db = null;
  _isOpen = false;
  _openPromise = null;
  _channelName;
  // Observables for real-time updates
  _messageUpdates = new ChannelSubject();
  _exchangeUpdates = new ChannelSubject();
  constructor(channelName) {
    this._channelName = channelName;
  }
  // ========================================================================
  // DATABASE LIFECYCLE
  // ========================================================================
  /**
   * Open database connection
   */
  async open() {
    if (this._db && this._isOpen) return this._db;
    if (this._openPromise) return this._openPromise;
    this._openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        this._openPromise = null;
        reject(new Error("Failed to open IndexedDB"));
      };
      request.onsuccess = () => {
        this._db = request.result;
        this._isOpen = true;
        this._openPromise = null;
        resolve(this._db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this._createStores(db);
      };
    });
    return this._openPromise;
  }
  /**
   * Close database connection
   */
  close() {
    if (this._db) {
      this._db.close();
      this._db = null;
      this._isOpen = false;
    }
  }
  _createStores(db) {
    if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
      const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: "id" });
      messagesStore.createIndex("channel", "channel", { unique: false });
      messagesStore.createIndex("status", "status", { unique: false });
      messagesStore.createIndex("recipient", "recipient", { unique: false });
      messagesStore.createIndex("createdAt", "createdAt", { unique: false });
      messagesStore.createIndex("channel_status", ["channel", "status"], { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.MAILBOX)) {
      const mailboxStore = db.createObjectStore(STORES.MAILBOX, { keyPath: "id" });
      mailboxStore.createIndex("channel", "channel", { unique: false });
      mailboxStore.createIndex("priority", "priority", { unique: false });
      mailboxStore.createIndex("expiresAt", "expiresAt", { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.PENDING)) {
      const pendingStore = db.createObjectStore(STORES.PENDING, { keyPath: "id" });
      pendingStore.createIndex("channel", "channel", { unique: false });
      pendingStore.createIndex("createdAt", "createdAt", { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.EXCHANGE)) {
      const exchangeStore = db.createObjectStore(STORES.EXCHANGE, { keyPath: "id" });
      exchangeStore.createIndex("key", "key", { unique: true });
      exchangeStore.createIndex("owner", "owner", { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
      const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: "id" });
      txStore.createIndex("createdAt", "createdAt", { unique: false });
    }
  }
  // ========================================================================
  // DEFER: Queue messages for later delivery
  // ========================================================================
  /**
   * Defer a message for later delivery
   */
  async defer(message, options = {}) {
    const db = await this.open();
    const storedMessage = {
      id: UUIDv4(),
      channel: message.channel,
      sender: message.sender ?? this._channelName,
      recipient: message.channel,
      type: message.type,
      payload: message.payload,
      status: "pending",
      priority: options.priority ?? 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: options.expiresIn ? Date.now() + options.expiresIn : null,
      retryCount: 0,
      maxRetries: options.maxRetries ?? 3,
      metadata: options.metadata
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.MESSAGES, STORES.MAILBOX], "readwrite");
      const messagesStore = tx.objectStore(STORES.MESSAGES);
      const mailboxStore = tx.objectStore(STORES.MAILBOX);
      messagesStore.add(storedMessage);
      mailboxStore.add(storedMessage);
      tx.oncomplete = () => {
        this._messageUpdates.next(storedMessage);
        resolve(storedMessage.id);
      };
      tx.onerror = () => reject(new Error("Failed to defer message"));
    });
  }
  /**
   * Get deferred messages for a channel
   */
  async getDeferredMessages(channel, options = {}) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, "readonly");
      const store = tx.objectStore(STORES.MESSAGES);
      const index = options.status ? store.index("channel_status") : store.index("channel");
      const query = options.status ? IDBKeyRange.only([channel, options.status]) : IDBKeyRange.only(channel);
      const request = index.getAll(query, options.limit);
      request.onsuccess = () => {
        let results = request.result;
        if (options.offset) {
          results = results.slice(options.offset);
        }
        resolve(results);
      };
      request.onerror = () => reject(new Error("Failed to get deferred messages"));
    });
  }
  /**
   * Process next pending message
   */
  async processNextPending(channel) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, "readwrite");
      const store = tx.objectStore(STORES.MESSAGES);
      const index = store.index("channel_status");
      const request = index.openCursor(IDBKeyRange.only([channel, "pending"]));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const message = cursor.value;
          message.status = "processing";
          message.updatedAt = Date.now();
          cursor.update(message);
          this._messageUpdates.next(message);
          resolve(message);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error("Failed to process pending message"));
    });
  }
  /**
   * Mark message as delivered
   */
  async markDelivered(messageId) {
    await this._updateMessageStatus(messageId, "delivered");
  }
  /**
   * Mark message as failed and retry if possible
   */
  async markFailed(messageId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, "readwrite");
      const store = tx.objectStore(STORES.MESSAGES);
      const request = store.get(messageId);
      request.onsuccess = () => {
        const message = request.result;
        if (!message) {
          resolve(false);
          return;
        }
        message.retryCount++;
        message.updatedAt = Date.now();
        if (message.retryCount < message.maxRetries) {
          message.status = "pending";
        } else {
          message.status = "failed";
        }
        store.put(message);
        this._messageUpdates.next(message);
        resolve(message.status === "pending");
      };
      request.onerror = () => reject(new Error("Failed to mark message as failed"));
    });
  }
  async _updateMessageStatus(messageId, status) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, "readwrite");
      const store = tx.objectStore(STORES.MESSAGES);
      const request = store.get(messageId);
      request.onsuccess = () => {
        const message = request.result;
        if (message) {
          message.status = status;
          message.updatedAt = Date.now();
          store.put(message);
          this._messageUpdates.next(message);
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to update message status"));
    });
  }
  // ========================================================================
  // MAILBOX / INBOX: Per-channel message storage
  // ========================================================================
  /**
   * Get mailbox for a channel
   */
  async getMailbox(channel, options = {}) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MAILBOX, "readonly");
      const store = tx.objectStore(STORES.MAILBOX);
      const index = store.index("channel");
      const request = index.getAll(IDBKeyRange.only(channel), options.limit);
      request.onsuccess = () => {
        let results = request.result;
        if (options.sortBy === "priority") {
          results.sort((a, b) => b.priority - a.priority);
        } else {
          results.sort((a, b) => b.createdAt - a.createdAt);
        }
        resolve(results);
      };
      request.onerror = () => reject(new Error("Failed to get mailbox"));
    });
  }
  /**
   * Get mailbox statistics
   */
  async getMailboxStats(channel) {
    const messages = await this.getDeferredMessages(channel);
    const stats = {
      total: messages.length,
      pending: 0,
      processing: 0,
      delivered: 0,
      failed: 0,
      expired: 0
    };
    const now = Date.now();
    for (const msg of messages) {
      if (msg.expiresAt && msg.expiresAt < now) {
        stats.expired++;
      } else {
        stats[msg.status]++;
      }
    }
    return stats;
  }
  /**
   * Clear mailbox for a channel
   */
  async clearMailbox(channel) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MAILBOX, "readwrite");
      const store = tx.objectStore(STORES.MAILBOX);
      const index = store.index("channel");
      let deletedCount = 0;
      const request = index.openCursor(IDBKeyRange.only(channel));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(deletedCount);
      tx.onerror = () => reject(new Error("Failed to clear mailbox"));
    });
  }
  // ========================================================================
  // PENDING: Track pending operations
  // ========================================================================
  /**
   * Register a pending operation
   */
  async registerPending(operation) {
    const db = await this.open();
    const pending = {
      id: UUIDv4(),
      channel: this._channelName,
      type: operation.type,
      data: operation.data,
      metadata: operation.metadata,
      createdAt: Date.now(),
      status: "pending"
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING, "readwrite");
      const store = tx.objectStore(STORES.PENDING);
      store.add(pending);
      tx.oncomplete = () => resolve(pending.id);
      tx.onerror = () => reject(new Error("Failed to register pending operation"));
    });
  }
  /**
   * Get all pending operations for channel
   */
  async getPendingOperations() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING, "readonly");
      const store = tx.objectStore(STORES.PENDING);
      const index = store.index("channel");
      const request = index.getAll(IDBKeyRange.only(this._channelName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Failed to get pending operations"));
    });
  }
  /**
   * Complete a pending operation
   */
  async completePending(operationId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING, "readwrite");
      const store = tx.objectStore(STORES.PENDING);
      store.delete(operationId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("Failed to complete pending operation"));
    });
  }
  /**
   * Await a pending operation (poll until complete or timeout)
   */
  async awaitPending(operationId, options = {}) {
    const timeout = options.timeout ?? 3e4;
    const pollInterval = options.pollInterval ?? 100;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const pending = await this._getPendingById(operationId);
      if (!pending) {
        return null;
      }
      if (pending.status === "completed") {
        await this.completePending(operationId);
        return pending.result;
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`Pending operation ${operationId} timed out`);
  }
  async _getPendingById(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING, "readonly");
      const store = tx.objectStore(STORES.PENDING);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(new Error("Failed to get pending operation"));
    });
  }
  // ========================================================================
  // EXCHANGE: Shared data between contexts
  // ========================================================================
  /**
   * Put data in exchange (shared storage)
   */
  async exchangePut(key, value, options = {}) {
    const db = await this.open();
    const record = {
      id: UUIDv4(),
      key,
      value,
      owner: this._channelName,
      sharedWith: options.sharedWith ?? ["*"],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXCHANGE, "readwrite");
      const store = tx.objectStore(STORES.EXCHANGE);
      const index = store.index("key");
      const getRequest = index.get(key);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          record.id = existing.id;
          record.version = existing.version + 1;
          record.createdAt = existing.createdAt;
        }
        store.put(record);
      };
      tx.oncomplete = () => {
        this._exchangeUpdates.next(record);
        resolve(record.id);
      };
      tx.onerror = () => reject(new Error("Failed to put exchange data"));
    });
  }
  /**
   * Get data from exchange
   */
  async exchangeGet(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXCHANGE, "readonly");
      const store = tx.objectStore(STORES.EXCHANGE);
      const index = store.index("key");
      const request = index.get(key);
      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }
        if (!this._canAccessExchange(record)) {
          resolve(null);
          return;
        }
        resolve(record.value);
      };
      request.onerror = () => reject(new Error("Failed to get exchange data"));
    });
  }
  /**
   * Delete data from exchange
   */
  async exchangeDelete(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXCHANGE, "readwrite");
      const store = tx.objectStore(STORES.EXCHANGE);
      const index = store.index("key");
      const getRequest = index.get(key);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (!record) {
          resolve(false);
          return;
        }
        if (record.owner !== this._channelName) {
          resolve(false);
          return;
        }
        store.delete(record.id);
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(new Error("Failed to delete exchange data"));
    });
  }
  /**
   * Acquire lock on exchange key
   */
  async exchangeLock(key, options = {}) {
    const db = await this.open();
    const timeout = options.timeout ?? 3e4;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXCHANGE, "readwrite");
      const store = tx.objectStore(STORES.EXCHANGE);
      const index = store.index("key");
      const request = index.get(key);
      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          resolve(false);
          return;
        }
        if (record.lock && record.lock.holder !== this._channelName) {
          if (record.lock.expiresAt > Date.now()) {
            resolve(false);
            return;
          }
        }
        record.lock = {
          holder: this._channelName,
          acquiredAt: Date.now(),
          expiresAt: Date.now() + timeout
        };
        record.updatedAt = Date.now();
        store.put(record);
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(new Error("Failed to acquire lock"));
    });
  }
  /**
   * Release lock on exchange key
   */
  async exchangeUnlock(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXCHANGE, "readwrite");
      const store = tx.objectStore(STORES.EXCHANGE);
      const index = store.index("key");
      const request = index.get(key);
      request.onsuccess = () => {
        const record = request.result;
        if (record && record.lock?.holder === this._channelName) {
          delete record.lock;
          record.updatedAt = Date.now();
          store.put(record);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("Failed to release lock"));
    });
  }
  _canAccessExchange(record) {
    if (record.owner === this._channelName) return true;
    if (record.sharedWith.includes("*")) return true;
    return record.sharedWith.includes(this._channelName);
  }
  // ========================================================================
  // TRANSACTIONS: Batch operations with rollback
  // ========================================================================
  /**
   * Begin a transaction for batch operations
   */
  async beginTransaction() {
    return new ChannelTransaction(this);
  }
  /**
   * Execute operations in transaction
   */
  async executeTransaction(operations) {
    const db = await this.open();
    const storeNames = new Set(operations.map((op) => op.store));
    return new Promise((resolve, reject) => {
      const tx = db.transaction(Array.from(storeNames), "readwrite");
      for (const op of operations) {
        const store = tx.objectStore(op.store);
        switch (op.type) {
          case "put":
            if (op.value !== void 0) {
              store.put(op.value);
            }
            break;
          case "delete":
            if (op.key !== void 0) {
              store.delete(op.key);
            }
            break;
          case "update":
            if (op.key !== void 0) {
              const getReq = store.get(op.key);
              getReq.onsuccess = () => {
                if (getReq.result && op.value) {
                  store.put({ ...getReq.result, ...op.value });
                }
              };
            }
            break;
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("Transaction failed"));
    });
  }
  // ========================================================================
  // SUBSCRIPTIONS
  // ========================================================================
  /**
   * Subscribe to message updates
   */
  onMessageUpdate(handler) {
    return this._messageUpdates.subscribe({ next: handler });
  }
  /**
   * Subscribe to exchange updates
   */
  onExchangeUpdate(handler) {
    return this._exchangeUpdates.subscribe({ next: handler });
  }
  // ========================================================================
  // CLEANUP
  // ========================================================================
  /**
   * Clean up expired messages
   */
  async cleanupExpired() {
    const db = await this.open();
    const now = Date.now();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.MESSAGES, STORES.MAILBOX], "readwrite");
      const messagesStore = tx.objectStore(STORES.MESSAGES);
      const mailboxStore = tx.objectStore(STORES.MAILBOX);
      let deletedCount = 0;
      const msgRequest = messagesStore.openCursor();
      msgRequest.onsuccess = () => {
        const cursor = msgRequest.result;
        if (cursor) {
          const msg = cursor.value;
          if (msg.expiresAt && msg.expiresAt < now) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        }
      };
      const mailRequest = mailboxStore.openCursor();
      mailRequest.onsuccess = () => {
        const cursor = mailRequest.result;
        if (cursor) {
          const msg = cursor.value;
          if (msg.expiresAt && msg.expiresAt < now) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(deletedCount);
      tx.onerror = () => reject(new Error("Failed to cleanup expired"));
    });
  }
}
class ChannelTransaction {
  constructor(_storage) {
    this._storage = _storage;
  }
  _operations = [];
  _isCommitted = false;
  _isRolledBack = false;
  /**
   * Add put operation
   */
  put(store, value) {
    this._checkState();
    this._operations.push({
      id: UUIDv4(),
      type: "put",
      store,
      value,
      timestamp: Date.now()
    });
    return this;
  }
  /**
   * Add delete operation
   */
  delete(store, key) {
    this._checkState();
    this._operations.push({
      id: UUIDv4(),
      type: "delete",
      store,
      key,
      timestamp: Date.now()
    });
    return this;
  }
  /**
   * Add update operation
   */
  update(store, key, updates) {
    this._checkState();
    this._operations.push({
      id: UUIDv4(),
      type: "update",
      store,
      key,
      value: updates,
      timestamp: Date.now()
    });
    return this;
  }
  /**
   * Commit transaction
   */
  async commit() {
    this._checkState();
    if (this._operations.length === 0) {
      this._isCommitted = true;
      return;
    }
    await this._storage.executeTransaction(this._operations);
    this._isCommitted = true;
  }
  /**
   * Rollback transaction (just clear operations, don't execute)
   */
  rollback() {
    this._operations = [];
    this._isRolledBack = true;
  }
  /**
   * Get operation count
   */
  get operationCount() {
    return this._operations.length;
  }
  _checkState() {
    if (this._isCommitted) {
      throw new Error("Transaction already committed");
    }
    if (this._isRolledBack) {
      throw new Error("Transaction already rolled back");
    }
  }
}
const _storageInstances = /* @__PURE__ */ new Map();
function getChannelStorage(channelName) {
  if (!_storageInstances.has(channelName)) {
    _storageInstances.set(channelName, new ChannelStorage(channelName));
  }
  return _storageInstances.get(channelName);
}
function closeAllStorage() {
  for (const storage of _storageInstances.values()) {
    storage.close();
  }
  _storageInstances.clear();
}

const workerCode = new URL(""+new URL('../assets/Worker.ts', import.meta.url).href+"", import.meta.url);
class RemoteChannelHelper {
  constructor(_channel, _context, _options = {}) {
    this._channel = _channel;
    this._context = _context;
    this._options = _options;
    this._connection = getConnection(_channel);
    this._storage = getChannelStorage(_channel);
  }
  _connection;
  _storage;
  async request(path, action, args, options = {}) {
    let normalizedPath = typeof path === "string" ? [path] : path;
    let normalizedAction = action;
    let normalizedArgs = args;
    if (Array.isArray(action) && isReflectAction(path)) {
      options = args;
      normalizedArgs = action;
      normalizedAction = path;
      normalizedPath = [];
    }
    const handler = this._context.getHost();
    return handler?.request(
      normalizedPath,
      normalizedAction,
      normalizedArgs,
      options,
      this._channel
    );
  }
  async doImportModule(url, options = {}) {
    return this.request([], WReflectAction.IMPORT, [url], options);
  }
  async deferMessage(payload, options = {}) {
    return this._storage.defer({
      channel: this._channel,
      sender: this._context.hostName,
      type: "request",
      payload
    }, options);
  }
  async getPendingMessages() {
    return this._storage.getDeferredMessages(this._channel, { status: "pending" });
  }
  get connection() {
    return this._connection;
  }
  get channelName() {
    return this._channel;
  }
  get context() {
    return this._context;
  }
}
class ChannelHandler {
  constructor(_channel, _context, _options = {}) {
    this._channel = _channel;
    this._context = _context;
    this._options = _options;
    this._connection = getConnectionPool().getOrCreate(_channel, "internal", _options);
    this._unified = new UnifiedChannel({
      name: _channel,
      autoListen: false,
      timeout: _options?.timeout
    });
  }
  // @ts-ignore
  //private _forResolves = new Map<string, PromiseWithResolvers<any>>();
  //private _broadcasts: Record<string, TransportBinding<NativeChannelTransport>> = {};
  //private _subscriptions: Subscription[] = [];
  _connection;
  _unified;
  get _forResolves() {
    return this._unified.__getPrivate("_pending");
  }
  get _subscriptions() {
    return this._unified.__getPrivate("_subscriptions");
  }
  get _broadcasts() {
    return this._unified.__getPrivate("_transports");
  }
  createRemoteChannel(channel, options = {}, broadcast) {
    const transport = normalizeTransportBinding(broadcast ?? this._context.$createOrUseExistingRemote(channel, options, broadcast ?? null)?.messageChannel?.port1);
    const transportType = getDynamicTransportType(transport?.target ?? transport);
    this._unified.listen(transport?.target, { targetChannel: channel });
    if (transport) {
      this._broadcasts?.set?.(channel, transport);
      const canAttachUnified = !(transportType === "self" && typeof postMessage === "undefined");
      if (canAttachUnified) {
        this._unified.connect(transport, { targetChannel: channel });
      }
      this._context.$registerConnection({
        localChannel: this._channel,
        remoteChannel: channel,
        sender: this._channel,
        direction: "outgoing",
        transportType
      });
      this.notifyChannel(channel, {
        contextId: this._context.id,
        contextName: this._context.hostName
      }, "connect");
    }
    return new RemoteChannelHelper(channel, this._context, options);
  }
  getChannel() {
    return this._channel;
  }
  get connection() {
    return this._connection;
  }
  request(path, action, args, options = {}, toChannel = "worker") {
    let normalizedPath = typeof path === "string" ? [path] : path;
    let normalizedArgs = args;
    if (Array.isArray(action) && isReflectAction(path)) {
      toChannel = options;
      options = args;
      normalizedArgs = action;
      action = path;
      normalizedPath = [];
    }
    return this._unified.invoke(
      toChannel,
      action,
      normalizedPath ?? [],
      Array.isArray(normalizedArgs) ? normalizedArgs : [normalizedArgs]
    );
  }
  resolveResponse(reqId, result) {
    this._forResolves.get(reqId)?.resolve?.(result);
    const promise = this._forResolves.get(reqId)?.promise;
    this._forResolves.delete(reqId);
    return promise;
  }
  async handleAndResponse(request, reqId, responseFn) {
  }
  notifyChannel(targetChannel, payload = {}, type = "notify") {
    return this._unified.notify(targetChannel, {
      ...payload,
      from: this._channel,
      to: targetChannel
    }, type);
  }
  getConnectedChannels() {
    return this._unified.connectedChannels;
  }
  close() {
    this._subscriptions.forEach((s) => s.unsubscribe());
    this._forResolves.clear();
    this._broadcasts?.values?.()?.forEach((transport) => transport.close?.());
    this._broadcasts?.clear?.();
    this._unified.close();
  }
  get unified() {
    return this._unified;
  }
}
class ChannelContext {
  constructor(_options = {}) {
    this._options = _options;
    this._hostName = _options.name ?? `ctx-${this._id.slice(0, 8)}`;
    if (_options.useGlobalSelf !== false) {
      this._globalSelf = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : null;
    }
  }
  _id = UUIDv4();
  _hostName;
  _host = null;
  _endpoints = /* @__PURE__ */ new Map();
  _unifiedByChannel = /* @__PURE__ */ new Map();
  _unifiedConnectionSubs = /* @__PURE__ */ new Map();
  _remoteChannels = /* @__PURE__ */ new Map();
  _deferredChannels = /* @__PURE__ */ new Map();
  _connectionEvents = new ChannelSubject({ bufferSize: 200 });
  _connectionRegistry = new ConnectionRegistry(
    () => UUIDv4(),
    (event) => this._emitConnectionEvent(event)
  );
  _closed = false;
  _globalSelf = null;
  // ========================================================================
  // HOST MANAGEMENT
  // ========================================================================
  /**
   * Initialize/get the host channel for this context
   */
  initHost(name) {
    if (this._host && !name) return this._host;
    const hostName = name ?? this._hostName;
    this._hostName = hostName;
    if (this._endpoints.has(hostName)) {
      this._host = this._endpoints.get(hostName).handler;
      return this._host;
    }
    this._host = new ChannelHandler(hostName, this, this._options.defaultOptions);
    const endpoint = {
      name: hostName,
      handler: this._host,
      connection: this._host.connection,
      subscriptions: [],
      ready: Promise.resolve(null),
      unified: this._host.unified
    };
    this._endpoints.set(hostName, endpoint);
    this._registerUnifiedChannel(hostName, this._host.unified);
    return this._host;
  }
  /**
   * Get the host channel
   */
  getHost() {
    return this._host ?? this.initHost();
  }
  /**
   * Get host name
   */
  get hostName() {
    return this._hostName;
  }
  /**
   * Get context ID
   */
  get id() {
    return this._id;
  }
  /**
   * Observable: connection events in this context
   */
  get onConnection() {
    return this._connectionEvents;
  }
  /**
   * Subscribe to connection events
   */
  subscribeConnections(handler) {
    return this._connectionEvents.subscribe(handler);
  }
  /**
   * Notify all currently known active connections.
   * Useful for service worker / cross-tab handshakes.
   */
  notifyConnections(payload = {}, query = {}) {
    let sent = 0;
    for (const endpoint of this._endpoints.values()) {
      const connectedTargets = endpoint.handler.getConnectedChannels();
      for (const remoteChannel of connectedTargets) {
        if (query.localChannel && query.localChannel !== endpoint.name) continue;
        if (query.remoteChannel && query.remoteChannel !== remoteChannel) continue;
        const existing = this.queryConnections({
          localChannel: endpoint.name,
          remoteChannel,
          status: "active"
        })[0];
        if (query.sender && existing?.sender !== query.sender) continue;
        if (query.transportType && existing?.transportType !== query.transportType) continue;
        if (query.channel && query.channel !== endpoint.name && query.channel !== remoteChannel) continue;
        if (endpoint.handler.notifyChannel(remoteChannel, payload, "notify")) {
          sent++;
        }
      }
    }
    return sent;
  }
  /**
   * Query tracked connections with filters
   */
  queryConnections(query = {}) {
    return this._connectionRegistry.query(query).map((connection) => ({
      ...connection,
      contextId: this._id
    }));
  }
  // ========================================================================
  // MULTI-CHANNEL CREATION
  // ========================================================================
  /**
   * Create a new channel endpoint in this context
   *
   * @param name - Channel name
   * @param options - Connection options
   * @returns ChannelEndpoint with handler and connection
   */
  createChannel(name, options = {}) {
    if (this._endpoints.has(name)) {
      return this._endpoints.get(name);
    }
    const handler = new ChannelHandler(name, this, { ...this._options.defaultOptions, ...options });
    const endpoint = {
      name,
      handler,
      connection: handler.connection,
      subscriptions: [],
      ready: Promise.resolve(null),
      unified: handler.unified
    };
    this._endpoints.set(name, endpoint);
    this._registerUnifiedChannel(name, handler.unified);
    return endpoint;
  }
  /**
   * Create multiple channel endpoints at once
   *
   * @param names - Array of channel names
   * @param options - Shared connection options
   * @returns Map of channel names to endpoints
   */
  createChannels(names, options = {}) {
    const result = /* @__PURE__ */ new Map();
    for (const name of names) {
      result.set(name, this.createChannel(name, options));
    }
    return result;
  }
  /**
   * Get an existing channel endpoint
   */
  getChannel(name) {
    return this._endpoints.get(name);
  }
  /**
   * Get or create a channel endpoint
   */
  getOrCreateChannel(name, options = {}) {
    return this._endpoints.get(name) ?? this.createChannel(name, options);
  }
  /**
   * Check if channel exists in this context
   */
  hasChannel(name) {
    return this._endpoints.has(name);
  }
  /**
   * Get all channel names in this context
   */
  getChannelNames() {
    return [...this._endpoints.keys()];
  }
  /**
   * Get total number of channels
   */
  get size() {
    return this._endpoints.size;
  }
  // ========================================================================
  // DYNAMIC / DEFERRED CHANNEL CREATION
  // ========================================================================
  /**
   * Register a deferred channel that will be initialized on first use
   *
   * @param name - Channel name
   * @param initFn - Function to initialize the channel
   */
  defer(name, initFn) {
    this._deferredChannels.set(name, initFn);
  }
  /**
   * Initialize a previously deferred channel
   */
  async initDeferred(name) {
    const initFn = this._deferredChannels.get(name);
    if (!initFn) return null;
    const endpoint = await initFn();
    this._endpoints.set(name, endpoint);
    this._deferredChannels.delete(name);
    return endpoint;
  }
  /**
   * Check if channel is deferred (not yet initialized)
   */
  isDeferred(name) {
    return this._deferredChannels.has(name);
  }
  /**
   * Get channel, initializing deferred if needed
   */
  async getChannelAsync(name) {
    if (this._endpoints.has(name)) {
      return this._endpoints.get(name);
    }
    if (this._deferredChannels.has(name)) {
      return this.initDeferred(name);
    }
    return null;
  }
  /**
   * Add a Worker channel dynamically
   *
   * @param name - Channel name
   * @param worker - Worker instance, URL, or code string
   * @param options - Connection options
   */
  async addWorker(name, worker, options = {}) {
    const workerInstance = loadWorker(worker);
    if (!workerInstance) throw new Error(`Failed to create worker for channel: ${name}`);
    const handler = new ChannelHandler(name, this, { ...this._options.defaultOptions, ...options });
    const ready = handler.createRemoteChannel(name, options, workerInstance);
    const endpoint = {
      name,
      handler,
      connection: handler.connection,
      subscriptions: [],
      transportType: "worker",
      ready: Promise.resolve(ready),
      unified: handler.unified
    };
    this._endpoints.set(name, endpoint);
    this._registerUnifiedChannel(name, handler.unified);
    this._remoteChannels.set(name, {
      channel: name,
      context: this,
      remote: Promise.resolve(ready),
      transport: workerInstance,
      transportType: "worker"
    });
    return endpoint;
  }
  /**
   * Add a MessagePort channel dynamically
   *
   * @param name - Channel name
   * @param port - MessagePort instance
   * @param options - Connection options
   */
  async addPort(name, port, options = {}) {
    const handler = new ChannelHandler(name, this, { ...this._options.defaultOptions, ...options });
    port.start?.();
    const ready = handler.createRemoteChannel(name, options, port);
    const endpoint = {
      name,
      handler,
      connection: handler.connection,
      subscriptions: [],
      transportType: "message-port",
      ready: Promise.resolve(ready),
      unified: handler.unified
    };
    this._endpoints.set(name, endpoint);
    this._registerUnifiedChannel(name, handler.unified);
    this._remoteChannels.set(name, {
      channel: name,
      context: this,
      remote: Promise.resolve(ready),
      transport: port,
      transportType: "message-port"
    });
    return endpoint;
  }
  /**
   * Add a BroadcastChannel dynamically
   *
   * @param name - Channel name (also used as BroadcastChannel name if not provided)
   * @param broadcastName - Optional BroadcastChannel name (defaults to channel name)
   * @param options - Connection options
   */
  async addBroadcast(name, broadcastName, options = {}) {
    const bc = new BroadcastChannel(broadcastName ?? name);
    const handler = new ChannelHandler(name, this, { ...this._options.defaultOptions, ...options });
    const ready = handler.createRemoteChannel(name, options, bc);
    const endpoint = {
      name,
      handler,
      connection: handler.connection,
      subscriptions: [],
      transportType: "broadcast",
      ready: Promise.resolve(ready),
      unified: handler.unified
    };
    this._endpoints.set(name, endpoint);
    this._registerUnifiedChannel(name, handler.unified);
    this._remoteChannels.set(name, {
      channel: name,
      context: this,
      remote: Promise.resolve(ready),
      transport: bc,
      transportType: "broadcast"
    });
    return endpoint;
  }
  /**
   * Add a channel using self/globalThis (for same-context communication)
   *
   * @param name - Channel name
   * @param options - Connection options
   */
  addSelfChannel(name, options = {}) {
    const handler = new ChannelHandler(name, this, { ...this._options.defaultOptions, ...options });
    const selfTarget = this._globalSelf ?? (typeof self !== "undefined" ? self : null);
    const endpoint = {
      name,
      handler,
      connection: handler.connection,
      subscriptions: [],
      transportType: "self",
      ready: Promise.resolve(selfTarget ? handler.createRemoteChannel(name, options, selfTarget) : null),
      unified: handler.unified
    };
    this._endpoints.set(name, endpoint);
    this._registerUnifiedChannel(name, handler.unified);
    return endpoint;
  }
  /**
   * Add channel with dynamic transport configuration
   *
   * @param name - Channel name
   * @param config - Transport configuration
   */
  async addTransport(name, config) {
    const options = config.options ?? {};
    switch (config.type) {
      case "worker":
        if (!config.worker) throw new Error("Worker required for worker transport");
        return this.addWorker(name, config.worker, options);
      case "message-port":
        if (!config.port) throw new Error("Port required for message-port transport");
        return this.addPort(name, config.port, options);
      case "broadcast":
        const bcName = typeof config.broadcast === "string" ? config.broadcast : void 0;
        return this.addBroadcast(name, bcName, options);
      case "self":
        return this.addSelfChannel(name, options);
      default:
        return this.createChannel(name, options);
    }
  }
  /**
   * Create a MessageChannel pair for bidirectional communication
   *
   * @param name1 - First channel name
   * @param name2 - Second channel name
   * @returns Both endpoints connected via MessageChannel
   */
  createChannelPair(name1, name2, options = {}) {
    const mc = new MessageChannel();
    const handler1 = new ChannelHandler(name1, this, { ...this._options.defaultOptions, ...options });
    const handler2 = new ChannelHandler(name2, this, { ...this._options.defaultOptions, ...options });
    mc.port1.start();
    mc.port2.start();
    const ready1 = handler1.createRemoteChannel(name2, options, mc.port1);
    const ready2 = handler2.createRemoteChannel(name1, options, mc.port2);
    const channel1 = {
      name: name1,
      handler: handler1,
      connection: handler1.connection,
      subscriptions: [],
      transportType: "message-port",
      ready: ready1,
      unified: handler1.unified
    };
    const channel2 = {
      name: name2,
      handler: handler2,
      connection: handler2.connection,
      subscriptions: [],
      transportType: "message-port",
      ready: ready2,
      unified: handler2.unified
    };
    this._endpoints.set(name1, channel1);
    this._endpoints.set(name2, channel2);
    this._registerUnifiedChannel(name1, handler1.unified);
    this._registerUnifiedChannel(name2, handler2.unified);
    return { channel1, channel2, messageChannel: mc };
  }
  /**
   * Get the global self reference
   */
  get globalSelf() {
    return this._globalSelf;
  }
  // ========================================================================
  // REMOTE CHANNEL MANAGEMENT
  // ========================================================================
  /**
   * Connect to a remote channel (e.g., in a Worker)
   */
  async connectRemote(channelName, options = {}, broadcast) {
    this.initHost();
    return this._host.createRemoteChannel(channelName, options, broadcast);
  }
  /**
   * Import a module in a remote channel
   */
  async importModuleInChannel(channelName, url, options = {}, broadcast) {
    const remote = await this.connectRemote(channelName, options.channelOptions, broadcast);
    return remote?.doImportModule?.(url, options.importOptions);
  }
  /**
   * Internal: Create or use existing remote channel
   */
  $createOrUseExistingRemote(channel, options = {}, broadcast) {
    if (channel == null || broadcast) return null;
    if (this._remoteChannels.has(channel)) return this._remoteChannels.get(channel);
    const msgChannel = new MessageChannel();
    const promise = Promised(new Promise((resolve) => {
      const worker = loadWorker(workerCode);
      worker?.addEventListener?.("message", (event) => {
        if (event.data.type === "channelCreated") {
          msgChannel.port1?.start?.();
          resolve(new RemoteChannelHelper(event.data.channel, this, options));
        }
      });
      worker?.postMessage?.({
        type: "createChannel",
        channel,
        sender: this._hostName,
        options,
        messagePort: msgChannel.port2
      }, { transfer: [msgChannel.port2] });
    }));
    const info = {
      channel,
      context: this,
      messageChannel: msgChannel,
      remote: promise
    };
    this._remoteChannels.set(channel, info);
    return info;
  }
  $registerConnection(params) {
    return {
      ...this._connectionRegistry.register(params),
      contextId: this._id
    };
  }
  $markNotified(params) {
    const connection = this._connectionRegistry.register({
      localChannel: params.localChannel,
      remoteChannel: params.remoteChannel,
      sender: params.sender,
      direction: params.direction,
      transportType: params.transportType
    });
    this._connectionRegistry.markNotified(connection, params.payload);
  }
  $observeSignal(params) {
    const signalType = params.payload?.type ?? "notify";
    const direction = signalType === "connect" ? "incoming" : "incoming";
    this.$markNotified({
      localChannel: params.localChannel,
      remoteChannel: params.remoteChannel,
      sender: params.sender,
      direction,
      transportType: params.transportType,
      payload: params.payload
    });
  }
  $forwardUnifiedConnectionEvent(channel, event) {
    const mappedTransportType = event.connection.transportType ?? "internal";
    const connection = this._connectionRegistry.register({
      localChannel: event.connection.localChannel || channel,
      remoteChannel: event.connection.remoteChannel,
      sender: event.connection.sender,
      direction: event.connection.direction,
      transportType: mappedTransportType,
      metadata: event.connection.metadata
    });
    if (event.type === "notified") {
      this._connectionRegistry.markNotified(connection, event.payload);
    } else if (event.type === "disconnected") {
      this._connectionRegistry.closeByChannel(event.connection.localChannel);
    }
  }
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  /**
   * Close a specific channel
   */
  closeChannel(name) {
    const endpoint = this._endpoints.get(name);
    if (!endpoint) return false;
    endpoint.subscriptions.forEach((s) => s.unsubscribe());
    endpoint.handler.close();
    endpoint.transport?.detach();
    this._unifiedConnectionSubs.get(name)?.unsubscribe();
    this._unifiedConnectionSubs.delete(name);
    this._unifiedByChannel.delete(name);
    this._endpoints.delete(name);
    if (name === this._hostName) {
      this._host = null;
    }
    this._connectionRegistry.closeByChannel(name);
    return true;
  }
  /**
   * Close all channels and cleanup
   */
  close() {
    if (this._closed) return;
    this._closed = true;
    for (const [name] of this._endpoints) {
      this.closeChannel(name);
    }
    this._remoteChannels.clear();
    this._host = null;
    this._unifiedConnectionSubs.forEach((sub) => sub.unsubscribe());
    this._unifiedConnectionSubs.clear();
    this._unifiedByChannel.clear();
    this._connectionRegistry.clear();
    this._connectionEvents.complete();
  }
  /**
   * Check if context is closed
   */
  get closed() {
    return this._closed;
  }
  _registerUnifiedChannel(name, unified) {
    this._unifiedByChannel.set(name, unified);
    this._unifiedConnectionSubs.get(name)?.unsubscribe();
    const subscription = unified.subscribeConnections((event) => {
      this.$forwardUnifiedConnectionEvent(name, event);
    });
    this._unifiedConnectionSubs.set(name, subscription);
  }
  _emitConnectionEvent(event) {
    this._connectionEvents.next({
      ...event,
      connection: {
        ...event.connection,
        contextId: this._id
      }
    });
  }
}
function isReflectAction(action) {
  return [...Object.values(WReflectAction)].includes(action);
}
function normalizeTransportBinding(target) {
  if (!target) return null;
  if (isTransportBinding(target)) return target;
  const nativeTarget = target;
  return {
    target: nativeTarget,
    postMessage: (message, options) => {
      nativeTarget.postMessage?.(message, options);
    },
    addEventListener: nativeTarget.addEventListener?.bind(nativeTarget),
    removeEventListener: nativeTarget.removeEventListener?.bind(nativeTarget),
    start: nativeTarget.start?.bind(nativeTarget),
    close: nativeTarget.close?.bind(nativeTarget)
  };
}
function isTransportBinding(value) {
  return !!value && typeof value === "object" && "target" in value && typeof value.postMessage === "function";
}
function getDynamicTransportType(target) {
  const effectiveTarget = isTransportBinding(target) ? target.target : target;
  if (!effectiveTarget) return "internal";
  if (effectiveTarget === "chrome-runtime") return "chrome-runtime";
  if (effectiveTarget === "chrome-tabs") return "chrome-tabs";
  if (effectiveTarget === "chrome-port") return "chrome-port";
  if (effectiveTarget === "chrome-external") return "chrome-external";
  if (typeof MessagePort !== "undefined" && effectiveTarget instanceof MessagePort) return "message-port";
  if (typeof BroadcastChannel !== "undefined" && effectiveTarget instanceof BroadcastChannel) return "broadcast";
  if (typeof Worker !== "undefined" && effectiveTarget instanceof Worker) return "worker";
  if (typeof WebSocket !== "undefined" && effectiveTarget instanceof WebSocket) return "websocket";
  if (typeof chrome !== "undefined" && typeof effectiveTarget === "object" && effectiveTarget && typeof effectiveTarget.postMessage === "function" && effectiveTarget.onMessage?.addListener) return "chrome-port";
  if (typeof self !== "undefined" && effectiveTarget === self) return "self";
  return "internal";
}
function loadWorker(WX) {
  if (WX instanceof Worker) return WX;
  if (WX instanceof URL) return new Worker(WX.href, { type: "module" });
  if (typeof WX === "function") {
    try {
      return new WX({ type: "module" });
    } catch {
      return WX({ type: "module" });
    }
  }
  if (typeof WX === "string") {
    if (WX.startsWith("/")) return new Worker(new URL(WX.replace(/^\//, "./"), import.meta.url).href, { type: "module" });
    if (URL.canParse(WX) || WX.startsWith("./")) return new Worker(new URL(WX, import.meta.url).href, { type: "module" });
    return new Worker(URL.createObjectURL(new Blob([WX], { type: "application/javascript" })), { type: "module" });
  }
  if (WX instanceof Blob || WX instanceof File) return new Worker(URL.createObjectURL(WX), { type: "module" });
  return WX ?? (typeof self !== "undefined" ? self : null);
}
const CONTEXT_REGISTRY = /* @__PURE__ */ new Map();
let DEFAULT_CONTEXT = null;
function getDefaultContext() {
  if (!DEFAULT_CONTEXT) {
    DEFAULT_CONTEXT = new ChannelContext({
      name: "$default$",
      useGlobalSelf: true
    });
    CONTEXT_REGISTRY.set("$default$", DEFAULT_CONTEXT);
  }
  return DEFAULT_CONTEXT;
}
function createChannelContext(options = {}) {
  const ctx = new ChannelContext(options);
  if (options.name) {
    CONTEXT_REGISTRY.set(options.name, ctx);
  }
  return ctx;
}
function getOrCreateContext(name, options = {}) {
  if (CONTEXT_REGISTRY.has(name)) {
    return CONTEXT_REGISTRY.get(name);
  }
  return createChannelContext({ ...options, name });
}
function getContext(name) {
  return CONTEXT_REGISTRY.get(name);
}
function deleteContext(name) {
  const ctx = CONTEXT_REGISTRY.get(name);
  if (ctx) {
    ctx.close();
    return CONTEXT_REGISTRY.delete(name);
  }
  return false;
}
function getContextNames() {
  return [...CONTEXT_REGISTRY.keys()];
}
function createChannelsInContext(channelNames, contextOptions = {}) {
  const context = createChannelContext(contextOptions);
  const channels = context.createChannels(channelNames);
  return { context, channels };
}
async function importModuleInContext(channelName, url, options = {}) {
  const context = createChannelContext(options.contextOptions);
  const module = await context.importModuleInChannel(channelName, url, {
    channelOptions: options.channelOptions,
    importOptions: options.importOptions
  });
  return { context, module };
}
async function addWorkerChannel(name, worker, options = {}) {
  return getDefaultContext().addWorker(name, worker, options);
}
async function addPortChannel(name, port, options = {}) {
  return getDefaultContext().addPort(name, port, options);
}
async function addBroadcastChannel(name, broadcastName, options = {}) {
  return getDefaultContext().addBroadcast(name, broadcastName, options);
}
function addSelfChannelToDefault(name, options = {}) {
  return getDefaultContext().addSelfChannel(name, options);
}
function deferChannel(name, initFn) {
  getDefaultContext().defer(name, initFn);
}
async function initDeferredChannel(name) {
  return getDefaultContext().initDeferred(name);
}
async function getChannelFromDefault(name) {
  return getDefaultContext().getChannelAsync(name);
}
function createDefaultChannelPair(name1, name2, options = {}) {
  return getDefaultContext().createChannelPair(name1, name2, options);
}

class TransportObservable {
  _subs = /* @__PURE__ */ new Set();
  _listening = false;
  _cleanup = null;
  subscribe(observerOrNext) {
    const obs = typeof observerOrNext === "function" ? { next: observerOrNext } : observerOrNext;
    const first = this._subs.size === 0;
    this._subs.add(obs);
    if (first && !this._listening) this._activate();
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
        if (this._subs.size === 0 && this._listening) this._deactivate();
      }
    };
  }
  _deactivate() {
    this._cleanup?.();
    this._cleanup = null;
    this._listening = false;
  }
  _dispatch(value) {
    for (const s of this._subs) {
      try {
        s.next?.(value);
      } catch (e) {
        s.error?.(e);
      }
    }
  }
  _error(err) {
    for (const s of this._subs) s.error?.(err);
  }
  _complete() {
    for (const s of this._subs) s.complete?.();
    this._subs.clear();
    this._deactivate();
  }
  close() {
    this._complete();
  }
  get subscriberCount() {
    return this._subs.size;
  }
  get isListening() {
    return this._listening;
  }
}
class WorkerObservable extends TransportObservable {
  constructor(_worker) {
    super();
    this._worker = _worker;
    this._send = createTransportSender(this._worker);
  }
  _send;
  next(value, transfer) {
    this._send(value, transfer);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener(this._worker, (d) => this._dispatch(d), (e) => this._error(e));
    this._listening = true;
  }
  terminate() {
    this._worker.terminate();
    this._complete();
  }
  get worker() {
    return this._worker;
  }
}
class MessagePortObservable extends TransportObservable {
  constructor(_port) {
    super();
    this._port = _port;
    this._send = createTransportSender(this._port);
  }
  _send;
  next(value, transfer) {
    this._send(value, transfer);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener(this._port, (d) => this._dispatch(d));
    this._listening = true;
  }
  get port() {
    return this._port;
  }
}
class BroadcastChannelObservable extends TransportObservable {
  constructor(_name) {
    super();
    this._name = _name;
    this._channel = new BroadcastChannel(_name);
    this._send = createTransportSender(this._channel);
  }
  _channel;
  _send;
  next(value) {
    this._send(value);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener(this._channel, (d) => {
      if (d?.sender !== this._name) this._dispatch(d);
    });
    this._listening = true;
  }
  close() {
    this._channel.close();
    super.close();
  }
}
class WebSocketObservable extends TransportObservable {
  constructor(_url, _protocols) {
    super();
    this._url = _url;
    this._protocols = _protocols;
  }
  _ws = null;
  _pending = [];
  _state = new ChannelSubject();
  connect() {
    if (this._ws) return;
    const url = typeof this._url === "string" ? this._url : this._url.href;
    this._ws = new WebSocket(url, this._protocols);
    this._state.next("connecting");
    this._ws.addEventListener("open", () => {
      this._state.next("open");
      this._pending.forEach((m) => this.next(m));
      this._pending = [];
    });
    this._cleanup = createTransportListener(
      this._ws,
      (d) => this._dispatch(d),
      (e) => this._error(e),
      () => {
        this._state.next("closed");
        this._complete();
      }
    );
    this._listening = true;
  }
  next(value) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      this._pending.push(value);
      return;
    }
    const { transferable: _, ...data } = value;
    this._ws.send(JSON.stringify(data));
  }
  _activate() {
    if (!this._ws) this.connect();
  }
  close(code, reason) {
    this._state.next("closing");
    this._ws?.close(code, reason);
    this._ws = null;
    super.close();
  }
  get state() {
    return this._state;
  }
  get isOpen() {
    return this._ws?.readyState === WebSocket.OPEN;
  }
}
let ChromeRuntimeObservable$1 = class ChromeRuntimeObservable extends TransportObservable {
  _send = createTransportSender("chrome-runtime");
  next(value) {
    this._send(value);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener("chrome-runtime", (d) => this._dispatch(d));
    this._listening = true;
  }
};
let ChromeTabsObservable$1 = class ChromeTabsObservable extends TransportObservable {
  constructor(_tabId) {
    super();
    this._tabId = _tabId;
  }
  setTabId(id) {
    this._tabId = id;
  }
  next(value) {
    if (this._tabId == null || typeof chrome === "undefined" || !chrome.tabs) return;
    const { transferable: _, ...data } = value;
    chrome.tabs.sendMessage(this._tabId, data);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener(
      "chrome-tabs",
      (d) => this._dispatch(d),
      void 0,
      void 0,
      { tabId: this._tabId }
    );
    this._listening = true;
  }
};
let ChromePortObservable$1 = class ChromePortObservable extends TransportObservable {
  constructor(_portName, _tabId) {
    super();
    this._portName = _portName;
    this._tabId = _tabId;
    this._send = createTransportSender("chrome-port", { portName: _portName, tabId: _tabId });
  }
  _send;
  next(value) {
    this._send(value);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener(
      "chrome-port",
      (d) => this._dispatch(d),
      void 0,
      void 0,
      { portName: this._portName, tabId: this._tabId }
    );
    this._listening = true;
  }
};
class ServiceWorkerClientObservable extends TransportObservable {
  _send = createTransportSender("service-worker-client");
  next(value, transfer) {
    this._send(value, transfer);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener("service-worker-client", (d) => this._dispatch(d));
    this._listening = true;
  }
}
class ServiceWorkerHostObservable extends TransportObservable {
  _send = createTransportSender("service-worker-host");
  next(value, transfer) {
    this._send(value, transfer);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener("service-worker-host", (d) => this._dispatch(d));
    this._listening = true;
  }
}
class SelfObservable extends TransportObservable {
  _send = createTransportSender("self");
  next(value, transfer) {
    this._send(value, transfer);
  }
  _activate() {
    if (this._listening) return;
    this._cleanup = createTransportListener("self", (d) => this._dispatch(d));
    this._listening = true;
  }
}
const TransportObservableFactory = {
  worker: (w) => new WorkerObservable(w),
  workerFromUrl: (url, opts) => new WorkerObservable(new Worker(typeof url === "string" ? url : url.href, { type: "module", ...opts })),
  messagePort: (p) => new MessagePortObservable(p),
  messageChannel: () => {
    const ch = new MessageChannel();
    return { port1: new MessagePortObservable(ch.port1), port2: new MessagePortObservable(ch.port2) };
  },
  broadcast: (name) => new BroadcastChannelObservable(name),
  websocket: (url, protocols) => new WebSocketObservable(url, protocols),
  chromeRuntime: () => new ChromeRuntimeObservable$1(),
  chromeTabs: (tabId) => new ChromeTabsObservable$1(tabId),
  chromePort: (portName, tabId) => new ChromePortObservable$1(portName, tabId),
  serviceWorkerClient: () => new ServiceWorkerClientObservable(),
  serviceWorkerHost: () => new ServiceWorkerHostObservable(),
  self: () => new SelfObservable()
};
function createBidirectionalChannel(outbound, inbound) {
  return {
    send: (v, t) => outbound.next(v, t),
    subscribe: (h) => inbound.subscribe({ next: h }),
    close: () => {
      outbound.close();
      inbound.close();
    }
  };
}

class WorkerContext {
  _context;
  _config;
  _subscriptions = [];
  // Observable streams for incoming connections
  _incomingConnections = new ChannelSubject({ bufferSize: 100 });
  _channelCreated = new ChannelSubject({ bufferSize: 100 });
  _channelClosed = new ChannelSubject();
  constructor(config = {}) {
    this._config = {
      name: config.name ?? "worker",
      workerName: config.workerName ?? `worker-${UUIDv4().slice(0, 8)}`,
      autoAcceptChannels: config.autoAcceptChannels ?? true,
      allowedChannels: config.allowedChannels ?? [],
      maxChannels: config.maxChannels ?? 100,
      autoConnect: config.autoConnect ?? true,
      useGlobalSelf: true,
      defaultOptions: config.defaultOptions ?? {},
      isolatedStorage: config.isolatedStorage ?? false,
      ...config
    };
    this._context = createChannelContext({
      name: this._config.name,
      useGlobalSelf: true,
      defaultOptions: config.defaultOptions
    });
    this._setupMessageListener();
  }
  // ========================================================================
  // INCOMING CONNECTION OBSERVABLES
  // ========================================================================
  /**
   * Observable: New incoming connection requests
   */
  get onConnection() {
    return this._incomingConnections;
  }
  /**
   * Observable: Channel created events
   */
  get onChannelCreated() {
    return this._channelCreated;
  }
  /**
   * Observable: Channel closed events
   */
  get onChannelClosed() {
    return this._channelClosed;
  }
  /**
   * Subscribe to incoming connections
   */
  subscribeConnections(handler) {
    return this._incomingConnections.subscribe(handler);
  }
  /**
   * Subscribe to channel creation
   */
  subscribeChannelCreated(handler) {
    return this._channelCreated.subscribe(handler);
  }
  // ========================================================================
  // CHANNEL MANAGEMENT
  // ========================================================================
  /**
   * Accept an incoming connection and create the channel
   */
  acceptConnection(connection) {
    if (!this._canAcceptChannel(connection.channel)) {
      return null;
    }
    const endpoint = this._context.createChannel(connection.channel, connection.options);
    if (connection.port) {
      connection.port.start?.();
      endpoint.handler.createRemoteChannel(
        connection.sender,
        connection.options,
        connection.port
      );
    }
    this._channelCreated.next({
      channel: connection.channel,
      endpoint,
      sender: connection.sender,
      timestamp: Date.now()
    });
    this._postChannelCreated(connection.channel, connection.sender, connection.id);
    return endpoint;
  }
  /**
   * Create a new channel in this worker context
   */
  createChannel(name, options) {
    return this._context.createChannel(name, options);
  }
  /**
   * Get an existing channel
   */
  getChannel(name) {
    return this._context.getChannel(name);
  }
  /**
   * Check if channel exists
   */
  hasChannel(name) {
    return this._context.hasChannel(name);
  }
  /**
   * Get all channel names
   */
  getChannelNames() {
    return this._context.getChannelNames();
  }
  /**
   * Query currently tracked channel connections in this worker.
   */
  queryConnections(query = {}) {
    return this._context.queryConnections(query);
  }
  /**
   * Notify active connections (useful for worker<->host sync).
   */
  notifyConnections(payload = {}, query = {}) {
    return this._context.notifyConnections(payload, query);
  }
  /**
   * Close a specific channel
   */
  closeChannel(name) {
    const closed = this._context.closeChannel(name);
    if (closed) {
      this._channelClosed.next({ channel: name, timestamp: Date.now() });
    }
    return closed;
  }
  /**
   * Get the underlying context
   */
  get context() {
    return this._context;
  }
  /**
   * Get worker configuration
   */
  get config() {
    return this._config;
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  _setupMessageListener() {
    addEventListener("message", ((event) => {
      this._handleIncomingMessage(event);
    }));
  }
  _handleIncomingMessage(event) {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    switch (data.type) {
      case "createChannel":
        this._handleCreateChannel(data);
        break;
      case "connectChannel":
        this._handleConnectChannel(data);
        break;
      case "addPort":
        this._handleAddPort(data);
        break;
      case "listChannels":
        this._handleListChannels(data);
        break;
      case "closeChannel":
        this._handleCloseChannel(data);
        break;
      case "ping":
        postMessage({ type: "pong", id: data.id, timestamp: Date.now() });
        break;
      default:
        if (data.channel && this._context.hasChannel(data.channel)) {
          const endpoint = this._context.getChannel(data.channel);
          endpoint?.handler?.handleAndResponse?.(data.payload, data.reqId);
        }
    }
  }
  _handleCreateChannel(data) {
    const connection = {
      id: data.reqId ?? UUIDv4(),
      channel: data.channel,
      sender: data.sender ?? "unknown",
      type: "channel",
      port: data.messagePort,
      timestamp: Date.now(),
      options: data.options
    };
    this._incomingConnections.next(connection);
    if (this._config.autoAcceptChannels) {
      this.acceptConnection(connection);
    }
  }
  _handleConnectChannel(data) {
    const connection = {
      id: data.reqId ?? UUIDv4(),
      channel: data.channel,
      sender: data.sender ?? "unknown",
      type: data.portType ?? "channel",
      port: data.port,
      timestamp: Date.now(),
      options: data.options
    };
    this._incomingConnections.next(connection);
    if (this._config.autoAcceptChannels && this._canAcceptChannel(data.channel)) {
      const endpoint = this._context.getOrCreateChannel(data.channel, data.options);
      if (data.port) {
        data.port.start?.();
        endpoint.handler.createRemoteChannel(data.sender, data.options, data.port);
      }
      postMessage({
        type: "channelConnected",
        channel: data.channel,
        reqId: data.reqId
      });
    }
  }
  _handleAddPort(data) {
    if (!data.port || !data.channel) return;
    const connection = {
      id: data.reqId ?? UUIDv4(),
      channel: data.channel,
      sender: data.sender ?? "unknown",
      type: "port",
      port: data.port,
      timestamp: Date.now(),
      options: data.options
    };
    this._incomingConnections.next(connection);
    if (this._config.autoAcceptChannels) {
      this.acceptConnection(connection);
    }
  }
  _handleListChannels(data) {
    postMessage({
      type: "channelList",
      channels: this.getChannelNames(),
      reqId: data.reqId
    });
  }
  _handleCloseChannel(data) {
    if (data.channel) {
      this.closeChannel(data.channel);
      postMessage({
        type: "channelClosed",
        channel: data.channel,
        reqId: data.reqId
      });
    }
  }
  _canAcceptChannel(channel) {
    if (this._context.size >= this._config.maxChannels) {
      return false;
    }
    if (this._config.allowedChannels.length > 0) {
      return this._config.allowedChannels.includes(channel);
    }
    return true;
  }
  _postChannelCreated(channel, sender, reqId) {
    postMessage({
      type: "channelCreated",
      channel,
      sender,
      reqId,
      timestamp: Date.now()
    });
  }
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  close() {
    this._subscriptions.forEach((s) => s.unsubscribe());
    this._subscriptions = [];
    this._incomingConnections.complete();
    this._channelCreated.complete();
    this._channelClosed.complete();
    this._context.close();
  }
}
let WORKER_CONTEXT = null;
function getWorkerContext(config) {
  if (!WORKER_CONTEXT) {
    WORKER_CONTEXT = new WorkerContext(config);
  }
  return WORKER_CONTEXT;
}
function initWorkerContext(config) {
  WORKER_CONTEXT?.close();
  WORKER_CONTEXT = new WorkerContext(config);
  return WORKER_CONTEXT;
}
function onWorkerConnection(handler) {
  return getWorkerContext().subscribeConnections(handler);
}
function onWorkerChannelCreated(handler) {
  return getWorkerContext().subscribeChannelCreated(handler);
}
let WORKER_RESPONDER = null;
let WORKER_INVOKER = null;
function getWorkerResponder(channel) {
  if (!WORKER_RESPONDER) {
    WORKER_RESPONDER = createResponder(channel ?? "worker");
    WORKER_RESPONDER.listen(self);
  }
  return WORKER_RESPONDER;
}
function getWorkerInvoker(channel) {
  if (!WORKER_INVOKER) {
    WORKER_INVOKER = createInvoker(channel ?? "worker");
    WORKER_INVOKER.connect(self);
  }
  return WORKER_INVOKER;
}
function exposeFromWorker(name, obj) {
  getWorkerResponder().expose(name, obj);
}
function onWorkerInvocation(handler) {
  return getWorkerResponder().subscribeInvocations(handler);
}
function createHostProxy(hostChannel = "host", basePath = []) {
  return getWorkerInvoker().createProxy(hostChannel, basePath);
}
function importInHost(url, hostChannel = "host") {
  return getWorkerInvoker().importModule(hostChannel, url);
}
const ctx = getWorkerContext({ name: "worker" });

class BaseChromeObservable {
  _subs = /* @__PURE__ */ new Set();
  _listening = false;
  _cleanup = null;
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    const first = this._subs.size === 0;
    this._subs.add(obs);
    if (first && !this._listening) this._activate();
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
        if (this._subs.size === 0 && this._listening) this._deactivate();
      }
    };
  }
  _deactivate() {
    this._cleanup?.();
    this._cleanup = null;
    this._listening = false;
  }
  _dispatch(value) {
    for (const s of this._subs) {
      try {
        s.next?.(value);
      } catch (e) {
        s.error?.(e);
      }
    }
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this._deactivate();
  }
}
class ChromeRuntimeObservable extends BaseChromeObservable {
  constructor(_handler, _options = {}) {
    super();
    this._handler = _handler;
    this._options = _options;
  }
  _pending = /* @__PURE__ */ new Map();
  send(msg) {
    if (typeof chrome === "undefined" || !chrome.runtime) return;
    const { _sender, _tabId, _frameId, transferable, ...data } = msg;
    chrome.runtime.sendMessage(data);
  }
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      this._pending.set(reqId, { resolve, reject, timestamp: Date.now() });
      const { _sender, _tabId, _frameId, transferable, ...data } = { ...msg, reqId };
      chrome.runtime.sendMessage(data, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(response);
        this._pending.delete(reqId);
      });
    });
  }
  _activate() {
    if (this._listening || typeof chrome === "undefined" || !chrome.runtime) return;
    const listener = (message, sender, sendResponse) => {
      if (this._options.filterSender && !this._options.filterSender(sender)) return false;
      if (this._options.filterMessage && !this._options.filterMessage(message)) return false;
      const data = {
        ...message,
        id: message.id ?? UUIDv4(),
        _sender: sender,
        _tabId: sender.tab?.id,
        _frameId: sender.frameId
      };
      if (data.type === "response" && data.reqId) {
        const p = this._pending.get(data.reqId);
        if (p) {
          p.resolve(data.payload);
          this._pending.delete(data.reqId);
        }
      }
      if (this._handler) {
        const respond = (result2) => sendResponse(result2);
        const subscriber = {
          next: (v) => this._dispatch(v),
          error: () => {
          },
          complete: () => {
          },
          signal: new AbortController().signal,
          active: true
        };
        const result = this._handler(data, respond, subscriber);
        return result instanceof Promise ? true : this._options.asyncResponse;
      }
      this._dispatch(data);
      return false;
    };
    chrome.runtime.onMessage.addListener(listener);
    this._cleanup = () => chrome.runtime.onMessage.removeListener(listener);
    this._listening = true;
  }
}
class ChromeTabsObservable extends BaseChromeObservable {
  constructor(_tabId, _options = {}) {
    super();
    this._tabId = _tabId;
    this._options = _options;
  }
  setTabId(id) {
    this._tabId = id;
  }
  send(msg) {
    if (typeof chrome === "undefined" || !chrome.tabs || this._tabId == null) return;
    const { _sender, _tabId, _frameId, transferable, ...data } = msg;
    chrome.tabs.sendMessage(this._tabId, data);
  }
  _activate() {
    if (this._listening || typeof chrome === "undefined" || !chrome.runtime) return;
    const listener = (message, sender) => {
      if (this._tabId != null && sender.tab?.id !== this._tabId) return;
      if (this._options.filterSender && !this._options.filterSender(sender)) return;
      const data = {
        ...message,
        id: message.id ?? UUIDv4(),
        _sender: sender,
        _tabId: sender.tab?.id,
        _frameId: sender.frameId
      };
      this._dispatch(data);
    };
    chrome.runtime.onMessage.addListener(listener);
    this._cleanup = () => chrome.runtime.onMessage.removeListener(listener);
    this._listening = true;
  }
}
class ChromePortObservable extends BaseChromeObservable {
  constructor(_portName, _tabId) {
    super();
    this._portName = _portName;
    this._tabId = _tabId;
  }
  _port = null;
  _info = null;
  connect() {
    if (typeof chrome === "undefined" || !chrome.runtime) return;
    this._port = this._tabId != null ? chrome.tabs.connect(this._tabId, { name: this._portName }) : chrome.runtime.connect({ name: this._portName });
    this._info = { name: this._portName, tabId: this._tabId };
    this._setupListeners();
  }
  send(msg) {
    if (!this._port) return;
    const { _sender, _tabId, _frameId, transferable, ...data } = msg;
    this._port.postMessage(data);
  }
  _setupListeners() {
    if (!this._port) return;
    this._port.onMessage.addListener((msg) => this._dispatch({ ...msg, id: msg.id ?? UUIDv4() }));
    this._port.onDisconnect.addListener(() => {
      this._subs.forEach((s) => s.complete?.());
      this._port = null;
    });
  }
  _activate() {
    if (!this._port) this.connect();
    this._listening = true;
  }
  _deactivate() {
    this._port?.disconnect();
    this._port = null;
    super._deactivate();
  }
  get portInfo() {
    return this._info;
  }
  get isConnected() {
    return this._port != null;
  }
}
class ChromeExternalObservable extends BaseChromeObservable {
  constructor(_extensionId) {
    super();
    this._extensionId = _extensionId;
  }
  send(msg) {
    if (typeof chrome === "undefined" || !chrome.runtime) return;
    const { _sender, _tabId, _frameId, transferable, ...data } = msg;
    if (this._extensionId) chrome.runtime.sendMessage(this._extensionId, data);
    else chrome.runtime.sendMessage(data);
  }
  _activate() {
    if (this._listening || typeof chrome === "undefined" || !chrome.runtime?.onMessageExternal) return;
    const listener = (message, sender) => {
      this._dispatch({ ...message, id: message.id ?? UUIDv4(), _sender: sender });
    };
    chrome.runtime.onMessageExternal.addListener(listener);
    this._cleanup = () => chrome.runtime.onMessageExternal.removeListener(listener);
    this._listening = true;
  }
}
function createChromeRequestHandler(channelName, handlers) {
  return async (data, respond, subscriber) => {
    if (data.type !== "request") {
      subscriber.next(data);
      return;
    }
    const action = data.payload?.action;
    if (action && handlers[action]) {
      try {
        const result = await handlers[action](data.payload?.args ?? [], data);
        respond({ id: UUIDv4(), channel: data.sender, sender: channelName, reqId: data.reqId, type: "response", payload: { result }, timestamp: Date.now() });
      } catch (error) {
        respond({ id: UUIDv4(), channel: data.sender, sender: channelName, reqId: data.reqId, type: "response", payload: { error: error instanceof Error ? error.message : String(error) }, timestamp: Date.now() });
      }
    } else {
      subscriber.next(data);
    }
  };
}
const ChromeObservableFactory = {
  runtime: (handler, options) => new ChromeRuntimeObservable(handler, options),
  tabs: (tabId, options) => new ChromeTabsObservable(tabId, options),
  port: (name, tabId) => new ChromePortObservable(name, tabId),
  external: (extensionId) => new ChromeExternalObservable(extensionId)
};

class SocketIOObservable {
  constructor(_socket, _channelName, _options = {}) {
    this._socket = _socket;
    this._channelName = _channelName;
    this._options = _options;
    this._events = _options.events ?? ["message", "channel"];
    this._defaultEvent = _options.defaultEvent ?? "message";
    if (_options.autoConnect !== false) this._socket.connect?.();
  }
  _subs = /* @__PURE__ */ new Set();
  _pending = /* @__PURE__ */ new Map();
  _listening = false;
  _cleanups = [];
  _events;
  _defaultEvent;
  _state = new ChannelSubject();
  send(msg, event) {
    const { transferable, ack, ...data } = msg;
    this._socket.emit(event ?? msg.event ?? this._defaultEvent, data);
  }
  emit(event, data) {
    this._socket.emit(event, data);
  }
  request(msg, event) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      this._pending.set(reqId, { resolve, reject, timestamp: Date.now() });
      const timeout = setTimeout(() => {
        if (this._pending.has(reqId)) {
          this._pending.delete(reqId);
          reject(new Error("Request timeout"));
        }
      }, 3e4);
      const { transferable, ack, ...data } = { ...msg, reqId };
      this._socket.emit(event ?? this._defaultEvent, data, (response) => {
        clearTimeout(timeout);
        this._pending.delete(reqId);
        resolve(response);
      });
    });
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    const first = this._subs.size === 0;
    this._subs.add(obs);
    if (first && !this._listening) this._activate();
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
        if (this._subs.size === 0 && this._listening) this._deactivate();
      }
    };
  }
  _activate() {
    if (this._listening) return;
    for (const event of this._events) {
      const handler = (data, ack) => {
        const msg = {
          ...typeof data === "object" ? data : { payload: data },
          id: data?.id ?? UUIDv4(),
          event,
          ack
        };
        if (msg.type === "response" && msg.reqId) {
          const p = this._pending.get(msg.reqId);
          if (p) {
            p.resolve(msg.payload);
            this._pending.delete(msg.reqId);
          }
        }
        for (const s of this._subs) {
          try {
            s.next?.(msg);
          } catch (e) {
            s.error?.(e);
          }
        }
      };
      this._socket.on(event, handler);
      this._cleanups.push(() => this._socket.off(event, handler));
    }
    const onConnect = () => this._state.next("connected");
    const onDisconnect = () => this._state.next("disconnected");
    const onError = (err) => {
      this._state.next("error");
      for (const s of this._subs) s.error?.(err instanceof Error ? err : new Error(String(err)));
    };
    this._socket.on("connect", onConnect);
    this._socket.on("disconnect", onDisconnect);
    this._socket.on("error", onError);
    this._cleanups.push(
      () => this._socket.off("connect", onConnect),
      () => this._socket.off("disconnect", onDisconnect),
      () => this._socket.off("error", onError)
    );
    this._listening = true;
  }
  _deactivate() {
    this._cleanups.forEach((fn) => fn());
    this._cleanups = [];
    this._listening = false;
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this._deactivate();
    this._socket.disconnect?.();
  }
  get socket() {
    return this._socket;
  }
  get channelName() {
    return this._channelName;
  }
  get isConnected() {
    return this._socket.connected ?? false;
  }
  get state() {
    return this._state;
  }
}
class SocketIORoomObservable {
  constructor(_parent, _roomName) {
    this._parent = _parent;
    this._roomName = _roomName;
  }
  _subs = /* @__PURE__ */ new Set();
  _parentSub = null;
  send(msg) {
    this._parent.send({ ...msg, room: this._roomName });
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    const first = this._subs.size === 0;
    this._subs.add(obs);
    if (first && !this._parentSub) {
      this._parentSub = this._parent.subscribe({
        next: (msg) => {
          if (msg.room === this._roomName || msg.channel === this._roomName) {
            for (const s of this._subs) {
              try {
                s.next?.(msg);
              } catch (e) {
                s.error?.(e);
              }
            }
          }
        },
        error: (e) => {
          for (const s of this._subs) s.error?.(e);
        },
        complete: () => {
          for (const s of this._subs) s.complete?.();
        }
      });
    }
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
        if (this._subs.size === 0) {
          this._parentSub?.unsubscribe();
          this._parentSub = null;
        }
      }
    };
  }
  get roomName() {
    return this._roomName;
  }
}
function createSocketRequestHandler(channelName, handlers) {
  return async (data) => {
    if (data.type !== "request" || !data.ack) return;
    const action = data.payload?.action;
    if (action && handlers[action]) {
      try {
        const result = await handlers[action](data.payload?.args ?? [], data);
        data.ack({ id: UUIDv4(), channel: data.sender, sender: channelName, reqId: data.reqId, type: "response", payload: { result }, timestamp: Date.now() });
      } catch (error) {
        data.ack({ id: UUIDv4(), channel: data.sender, sender: channelName, reqId: data.reqId, type: "response", payload: { error: error instanceof Error ? error.message : String(error) }, timestamp: Date.now() });
      }
    }
  };
}
const SocketIOObservableFactory = {
  create: (socket, channelName, options) => new SocketIOObservable(socket, channelName, options),
  room: (parent, roomName) => new SocketIORoomObservable(parent, roomName)
};
function createSocketObservable(socket, channelName, options) {
  return new SocketIOObservable(socket, channelName, options);
}

class SharedWorkerClient {
  constructor(_scriptUrl, _channelName, _options = {}) {
    this._scriptUrl = _scriptUrl;
    this._channelName = _channelName;
    this._options = _options;
    if (_options.autoConnect !== false) this.connect();
  }
  _worker = null;
  _port = null;
  _subs = /* @__PURE__ */ new Set();
  _pending = /* @__PURE__ */ new Map();
  _listening = false;
  _cleanup = null;
  _portId = UUIDv4();
  _state = new ChannelSubject();
  connect() {
    if (this._worker) return;
    try {
      this._worker = new SharedWorker(this._scriptUrl, {
        name: this._options.name,
        credentials: this._options.credentials,
        type: this._options.type
      });
      this._port = this._worker.port;
      this._setupListeners();
      this._port.start();
      this._state.next("connecting");
      this.send({
        id: UUIDv4(),
        channel: this._channelName,
        sender: this._portId,
        type: "signal",
        payload: { action: "connect", portId: this._portId }
      });
    } catch (e) {
      this._state.next("error");
      throw e;
    }
  }
  send(msg, transfer) {
    if (!this._port) return;
    const { transferable, ...data } = msg;
    this._port.postMessage({ ...data, portId: this._portId }, transfer ?? []);
  }
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this._pending.has(reqId)) {
          this._pending.delete(reqId);
          reject(new Error("Request timeout"));
        }
      }, 3e4);
      this._pending.set(reqId, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
        timestamp: Date.now()
      });
      this.send({ ...msg, reqId, type: "request" });
    });
  }
  broadcast(msg, transfer) {
    this.send({ ...msg, broadcast: true }, transfer);
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    if (!this._listening) this._activate();
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
        if (this._subs.size === 0) this._deactivate();
      }
    };
  }
  _setupListeners() {
    if (!this._port) return;
    const msgHandler = (e) => {
      const data = e.data;
      if (data.type === "signal" && data.payload?.action === "connected") {
        this._state.next("connected");
      }
      if (data.type === "response" && data.reqId) {
        const p = this._pending.get(data.reqId);
        if (p) {
          this._pending.delete(data.reqId);
          if (data.payload?.error) p.reject(new Error(data.payload.error));
          else p.resolve(data.payload?.result ?? data.payload);
        }
      }
      for (const s of this._subs) {
        try {
          s.next?.(data);
        } catch (e2) {
          s.error?.(e2);
        }
      }
    };
    const errHandler = (e) => {
      this._state.next("error");
      const err = new Error("SharedWorker error");
      for (const s of this._subs) s.error?.(err);
    };
    this._port.addEventListener("message", msgHandler);
    this._port.addEventListener("messageerror", errHandler);
    this._cleanup = () => {
      this._port?.removeEventListener("message", msgHandler);
      this._port?.removeEventListener("messageerror", errHandler);
    };
  }
  _activate() {
    this._listening = true;
  }
  _deactivate() {
    this._cleanup?.();
    this._cleanup = null;
    this._listening = false;
  }
  disconnect() {
    this.send({
      id: UUIDv4(),
      channel: this._channelName,
      sender: this._portId,
      type: "signal",
      payload: { action: "disconnect", portId: this._portId }
    });
    this._deactivate();
    this._port?.close();
    this._port = null;
    this._worker = null;
    this._state.next("disconnected");
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this.disconnect();
  }
  get port() {
    return this._port;
  }
  get portId() {
    return this._portId;
  }
  get isConnected() {
    return this._state.getValue() === "connected";
  }
  get state() {
    return this._state;
  }
  get channelName() {
    return this._channelName;
  }
}
class SharedWorkerHost {
  constructor(_channelName) {
    this._channelName = _channelName;
    this._setupGlobalHandler();
  }
  _ports = /* @__PURE__ */ new Map();
  _subs = /* @__PURE__ */ new Set();
  _state = new ChannelSubject();
  _setupGlobalHandler() {
    if (typeof self !== "undefined" && "onconnect" in self) {
      self.onconnect = (e) => {
        const port = e.ports[0];
        const portId = UUIDv4();
        this._registerPort(portId, port);
      };
      this._state.next("ready");
    }
  }
  _registerPort(portId, port) {
    const info = {
      id: portId,
      connectedAt: Date.now(),
      lastSeen: Date.now()
    };
    port.onmessage = (e) => {
      const data = e.data;
      info.lastSeen = Date.now();
      if (data.type === "signal") {
        if (data.payload?.action === "connect") {
          const realPortId = data.payload.portId || portId;
          this._ports.delete(portId);
          info.id = realPortId;
          this._ports.set(realPortId, { port, info });
          port.postMessage({
            id: UUIDv4(),
            channel: this._channelName,
            sender: "host",
            type: "signal",
            payload: { action: "connected", portId: realPortId }
          });
          return;
        }
        if (data.payload?.action === "disconnect") {
          this._unregisterPort(data.portId ?? portId);
          return;
        }
      }
      if (data.broadcast) {
        this.broadcast(data, data.portId ?? portId);
      }
      for (const s of this._subs) {
        try {
          s.next?.({ ...data, portId: data.portId ?? portId });
        } catch (e2) {
          s.error?.(e2);
        }
      }
    };
    port.onmessageerror = (e) => {
      const err = new Error("Port message error");
      for (const s of this._subs) s.error?.(err);
    };
    port.start();
    this._ports.set(portId, { port, info });
  }
  _unregisterPort(portId) {
    const entry = this._ports.get(portId);
    if (entry) {
      entry.port.close();
      this._ports.delete(portId);
    }
  }
  send(portId, msg, transfer) {
    const entry = this._ports.get(portId);
    if (!entry) return;
    const { transferable, ...data } = msg;
    entry.port.postMessage(data, transfer ?? []);
  }
  broadcast(msg, excludePortId) {
    const { transferable, ...data } = msg;
    for (const [id, entry] of this._ports) {
      if (id !== excludePortId) {
        entry.port.postMessage({ ...data, broadcast: true });
      }
    }
  }
  respond(msg, result, transfer) {
    if (!msg.portId || !msg.reqId) return;
    this.send(msg.portId, {
      id: UUIDv4(),
      channel: msg.sender,
      sender: this._channelName,
      type: "response",
      reqId: msg.reqId,
      payload: { result }
    }, transfer);
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
      }
    };
  }
  getPorts() {
    const result = /* @__PURE__ */ new Map();
    for (const [id, entry] of this._ports) {
      result.set(id, { ...entry.info });
    }
    return result;
  }
  get portCount() {
    return this._ports.size;
  }
  get state() {
    return this._state;
  }
  get channelName() {
    return this._channelName;
  }
}
function createSharedWorkerObservable(scriptUrl, channelName, options) {
  return new SharedWorkerClient(scriptUrl, channelName, options);
}
function createSharedWorkerHostObservable(channelName) {
  return new SharedWorkerHost(channelName);
}
const SharedWorkerObservableFactory = {
  client: (url, name, opts) => new SharedWorkerClient(url, name, opts),
  host: (name) => new SharedWorkerHost(name)
};

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

let cborEncoder = null;
async function getCBOREncoder() {
  if (cborEncoder) return cborEncoder;
  try {
    const cborx = await __vitePreload(() => import('./index15.js'),true              ?[]:void 0,import.meta.url);
    cborEncoder = {
      encode: (v) => cborx.encode(v),
      decode: (d) => cborx.decode(d)
    };
  } catch {
    cborEncoder = {
      encode: (v) => new TextEncoder().encode(JSON.stringify(v, replacer)),
      decode: (d) => JSON.parse(new TextDecoder().decode(d), reviver)
    };
  }
  return cborEncoder;
}
function replacer(_key, value) {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return {
      __typedArray: true,
      type: value.constructor.name,
      data: Array.from(value)
    };
  }
  if (value instanceof ArrayBuffer) {
    return {
      __arrayBuffer: true,
      data: Array.from(new Uint8Array(value))
    };
  }
  return value;
}
function reviver(_key, value) {
  if (value?.__typedArray) {
    const TypedArrayCtor = globalThis[value.type];
    return TypedArrayCtor ? new TypedArrayCtor(value.data) : value.data;
  }
  if (value?.__arrayBuffer) {
    return new Uint8Array(value.data).buffer;
  }
  return value;
}
const HEADER_SIZE = 32;
const LOCK_OFFSET = 0;
const SEQ_OFFSET = 4;
const SIZE_OFFSET = 8;
const FLAGS_OFFSET = 12;
const READY_OFFSET = 16;
const ACK_OFFSET = 20;
const DATA_OFFSET = HEADER_SIZE;
const FLAG_HAS_TRANSFER = 1 << 0;
const FLAG_COMPRESSED = 1 << 1;
const FLAG_RESPONSE = 1 << 2;
class AtomicsBuffer {
  constructor(bufferOrSize = 65536, _config = {}) {
    this._config = _config;
    if (typeof bufferOrSize === "number") {
      this._sharedBuffer = new SharedArrayBuffer(bufferOrSize);
    } else {
      this._sharedBuffer = bufferOrSize;
    }
    this._int32View = new Int32Array(this._sharedBuffer);
    this._uint8View = new Uint8Array(this._sharedBuffer);
    this._maxDataSize = this._config.maxMessageSize ?? this._sharedBuffer.byteLength - HEADER_SIZE;
  }
  _sharedBuffer;
  _int32View;
  _uint8View;
  _maxDataSize;
  /**
   * Write message to shared buffer with lock
   */
  async write(data, flags = 0) {
    if (data.byteLength > this._maxDataSize) {
      throw new Error(`Message too large: ${data.byteLength} > ${this._maxDataSize}`);
    }
    while (Atomics.compareExchange(this._int32View, LOCK_OFFSET / 4, 0, 1) !== 0) {
      const result = this._config.useAsyncWait && "waitAsync" in Atomics ? await Atomics.waitAsync(this._int32View, LOCK_OFFSET / 4, 1, this._config.waitTimeout ?? 100).value : Atomics.wait(this._int32View, LOCK_OFFSET / 4, 1, this._config.waitTimeout ?? 100);
      if (result === "timed-out") continue;
    }
    try {
      Atomics.store(this._int32View, SIZE_OFFSET / 4, data.byteLength);
      Atomics.store(this._int32View, FLAGS_OFFSET / 4, flags);
      this._uint8View.set(data, DATA_OFFSET);
      Atomics.add(this._int32View, SEQ_OFFSET / 4, 1);
      Atomics.store(this._int32View, READY_OFFSET / 4, 1);
      Atomics.notify(this._int32View, READY_OFFSET / 4);
      return true;
    } finally {
      Atomics.store(this._int32View, LOCK_OFFSET / 4, 0);
      Atomics.notify(this._int32View, LOCK_OFFSET / 4);
    }
  }
  /**
   * Read message from shared buffer
   */
  async read() {
    const readyValue = Atomics.load(this._int32View, READY_OFFSET / 4);
    if (readyValue === 0) {
      const result = this._config.useAsyncWait && "waitAsync" in Atomics ? await Atomics.waitAsync(this._int32View, READY_OFFSET / 4, 0, this._config.waitTimeout ?? 1e3).value : Atomics.wait(this._int32View, READY_OFFSET / 4, 0, this._config.waitTimeout ?? 1e3);
      if (result === "timed-out") return null;
    }
    const size = Atomics.load(this._int32View, SIZE_OFFSET / 4);
    const flags = Atomics.load(this._int32View, FLAGS_OFFSET / 4);
    const seq = Atomics.load(this._int32View, SEQ_OFFSET / 4);
    if (size <= 0 || size > this._maxDataSize) return null;
    const data = new Uint8Array(size);
    data.set(this._uint8View.subarray(DATA_OFFSET, DATA_OFFSET + size));
    Atomics.store(this._int32View, READY_OFFSET / 4, 0);
    Atomics.add(this._int32View, ACK_OFFSET / 4, 1);
    Atomics.notify(this._int32View, ACK_OFFSET / 4);
    return { data, flags, seq };
  }
  /**
   * Wait for acknowledgment
   */
  async waitAck(expectedSeq) {
    const timeout = this._config.waitTimeout ?? 5e3;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const ack = Atomics.load(this._int32View, ACK_OFFSET / 4);
      if (ack >= expectedSeq) return true;
      if (this._config.useAsyncWait && "waitAsync" in Atomics) {
        await Atomics.waitAsync(this._int32View, ACK_OFFSET / 4, ack, 100).value;
      } else {
        await new Promise((r) => setTimeout(r, 10));
      }
    }
    return false;
  }
  get buffer() {
    return this._sharedBuffer;
  }
  get currentSeq() {
    return Atomics.load(this._int32View, SEQ_OFFSET / 4);
  }
}
class AtomicsTransport {
  constructor(_channelName, sendBuffer, recvBuffer, _config = {}) {
    this._channelName = _channelName;
    this._config = _config;
    this._sendBuffer = sendBuffer instanceof AtomicsBuffer ? sendBuffer : new AtomicsBuffer(sendBuffer, _config);
    this._recvBuffer = recvBuffer instanceof AtomicsBuffer ? recvBuffer : new AtomicsBuffer(recvBuffer, _config);
    this._init();
  }
  _sendBuffer;
  _recvBuffer;
  _encoder = null;
  _subs = /* @__PURE__ */ new Set();
  _pending = /* @__PURE__ */ new Map();
  _polling = false;
  _pollAbort = null;
  _workerId = UUIDv4();
  _lastSeq = 0;
  _state = new ChannelSubject();
  async _init() {
    this._encoder = await getCBOREncoder();
    this._state.next("ready");
  }
  async send(msg, transfer) {
    if (!this._encoder) await this._init();
    const { transferable, ...data } = msg;
    let flags = 0;
    if (transfer?.length) {
      flags |= FLAG_HAS_TRANSFER;
      data._transferMeta = transfer.map((t, i) => ({
        index: i,
        type: t.constructor.name,
        // Use ArrayBuffer.transfer() if available (ES2024+)
        // @ts-ignore - Modern API
        transferred: t instanceof ArrayBuffer && "transfer" in t
      }));
    }
    const encoded = this._encoder.encode(data);
    if (this._config.compression && encoded.length > 1024) {
      flags |= FLAG_COMPRESSED;
    }
    await this._sendBuffer.write(encoded, flags);
  }
  async request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pending.delete(reqId);
        reject(new Error("Request timeout"));
      }, this._config.waitTimeout ?? 3e4);
      this._pending.set(reqId, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
        timestamp: Date.now()
      });
      this.send({ ...msg, reqId, type: "request" });
    });
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    if (!this._polling) this._startPolling();
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
        if (this._subs.size === 0) this._stopPolling();
      }
    };
  }
  async _startPolling() {
    if (this._polling) return;
    this._polling = true;
    this._pollAbort = new AbortController();
    this._state.next("polling");
    while (this._polling && !this._pollAbort.signal.aborted) {
      try {
        const result = await this._recvBuffer.read();
        if (!result) continue;
        if (result.seq <= this._lastSeq) continue;
        this._lastSeq = result.seq;
        const data = this._encoder.decode(result.data);
        data.seq = result.seq;
        data.workerId = data.workerId ?? this._workerId;
        if (result.flags & FLAG_RESPONSE || data.type === "response") {
          if (data.reqId) {
            const p = this._pending.get(data.reqId);
            if (p) {
              this._pending.delete(data.reqId);
              if (data.payload?.error) p.reject(new Error(data.payload.error));
              else p.resolve(data.payload?.result ?? data.payload);
              continue;
            }
          }
        }
        for (const s of this._subs) {
          try {
            s.next?.(data);
          } catch (e) {
            s.error?.(e);
          }
        }
      } catch (e) {
        for (const s of this._subs) s.error?.(e);
      }
    }
  }
  _stopPolling() {
    this._polling = false;
    this._pollAbort?.abort();
    this._pollAbort = null;
    this._state.next("stopped");
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this._stopPolling();
  }
  get sendBuffer() {
    return this._sendBuffer.buffer;
  }
  get recvBuffer() {
    return this._recvBuffer.buffer;
  }
  get workerId() {
    return this._workerId;
  }
  get state() {
    return this._state;
  }
  get channelName() {
    return this._channelName;
  }
}
function createAtomicsChannelPair(channelName, config = {}) {
  const bufferSize = config.bufferSize ?? 65536;
  const bufferA = new SharedArrayBuffer(bufferSize);
  const bufferB = new SharedArrayBuffer(bufferSize);
  const main = new AtomicsTransport(channelName, bufferA, bufferB, config);
  return {
    main,
    worker: { sendBuffer: bufferB, recvBuffer: bufferA }
  };
}
function createWorkerAtomicsTransport(channelName, sendBuffer, recvBuffer, config = {}) {
  return new AtomicsTransport(channelName, sendBuffer, recvBuffer, config);
}
class AtomicsRingBuffer {
  _buffer;
  _meta;
  _data;
  _slotSize;
  _slotCount;
  _mask;
  // Meta layout: [writeIndex, readIndex, overflow]
  static META_SIZE = 16;
  static WRITE_IDX = 0;
  static READ_IDX = 4;
  static OVERFLOW = 8;
  constructor(bufferOrConfig = {}) {
    if (bufferOrConfig instanceof SharedArrayBuffer) {
      this._buffer = bufferOrConfig;
      this._slotCount = 64;
      this._slotSize = (this._buffer.byteLength - AtomicsRingBuffer.META_SIZE) / this._slotCount;
    } else {
      this._slotSize = bufferOrConfig.slotSize ?? 1024;
      this._slotCount = bufferOrConfig.slotCount ?? 64;
      this._slotCount = 1 << Math.ceil(Math.log2(this._slotCount));
      const totalSize = AtomicsRingBuffer.META_SIZE + this._slotSize * this._slotCount;
      this._buffer = new SharedArrayBuffer(totalSize);
    }
    this._meta = new Int32Array(this._buffer, 0, AtomicsRingBuffer.META_SIZE / 4);
    this._data = new Uint8Array(this._buffer, AtomicsRingBuffer.META_SIZE);
    this._mask = this._slotCount - 1;
  }
  /**
   * Write message to ring buffer (non-blocking)
   */
  write(data) {
    if (data.byteLength > this._slotSize - 4) return false;
    const writeIdx = Atomics.load(this._meta, AtomicsRingBuffer.WRITE_IDX);
    const readIdx = Atomics.load(this._meta, AtomicsRingBuffer.READ_IDX);
    if ((writeIdx + 1 & this._mask) === (readIdx & this._mask)) {
      Atomics.add(this._meta, AtomicsRingBuffer.OVERFLOW, 1);
      return false;
    }
    const slot = (writeIdx & this._mask) * this._slotSize;
    new DataView(this._buffer, AtomicsRingBuffer.META_SIZE + slot).setUint32(0, data.byteLength, true);
    this._data.set(data, slot + 4);
    Atomics.store(this._meta, AtomicsRingBuffer.WRITE_IDX, writeIdx + 1);
    Atomics.notify(this._meta, AtomicsRingBuffer.WRITE_IDX);
    return true;
  }
  /**
   * Read message from ring buffer (non-blocking)
   */
  read() {
    const writeIdx = Atomics.load(this._meta, AtomicsRingBuffer.WRITE_IDX);
    const readIdx = Atomics.load(this._meta, AtomicsRingBuffer.READ_IDX);
    if (readIdx === writeIdx) return null;
    const slot = (readIdx & this._mask) * this._slotSize;
    const size = new DataView(this._buffer, AtomicsRingBuffer.META_SIZE + slot).getUint32(0, true);
    if (size === 0 || size > this._slotSize - 4) return null;
    const data = new Uint8Array(size);
    data.set(this._data.subarray(slot + 4, slot + 4 + size));
    Atomics.store(this._meta, AtomicsRingBuffer.READ_IDX, readIdx + 1);
    return data;
  }
  /**
   * Wait for data to be available
   */
  async waitRead(timeout) {
    const writeIdx = Atomics.load(this._meta, AtomicsRingBuffer.WRITE_IDX);
    const readIdx = Atomics.load(this._meta, AtomicsRingBuffer.READ_IDX);
    if (readIdx < writeIdx) return this.read();
    if ("waitAsync" in Atomics) {
      const result = await Atomics.waitAsync(this._meta, AtomicsRingBuffer.WRITE_IDX, writeIdx, timeout ?? 1e3).value;
      if (result === "ok") return this.read();
    } else {
      await new Promise((r) => setTimeout(r, Math.min(timeout ?? 1e3, 100)));
      return this.read();
    }
    return null;
  }
  get buffer() {
    return this._buffer;
  }
  get available() {
    const w = Atomics.load(this._meta, AtomicsRingBuffer.WRITE_IDX);
    const r = Atomics.load(this._meta, AtomicsRingBuffer.READ_IDX);
    return w - r & this._mask;
  }
  get overflow() {
    return Atomics.load(this._meta, AtomicsRingBuffer.OVERFLOW);
  }
}
const AtomicsTransportFactory = {
  create: (name, send, recv, config) => new AtomicsTransport(name, send, recv, config),
  createPair: (name, config) => createAtomicsChannelPair(name, config),
  createBuffer: (sizeOrBuffer, config) => new AtomicsBuffer(sizeOrBuffer, config),
  createRingBuffer: (config) => new AtomicsRingBuffer(config),
  getCBOR: getCBOREncoder
};

const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" }
];
class RTCPeerTransport {
  constructor(_channelName, _config = {}) {
    this._channelName = _channelName;
    this._config = _config;
    this._pc = new RTCPeerConnection({
      iceServers: _config.iceServers ?? DEFAULT_ICE_SERVERS
    });
    this._setupPeerConnection();
  }
  _pc;
  _channel = null;
  _subs = /* @__PURE__ */ new Set();
  _pending = /* @__PURE__ */ new Map();
  _localId = UUIDv4();
  _remoteId = null;
  _state = new ChannelSubject();
  _channelState = new ChannelSubject();
  _iceCandidates = [];
  _iceGatheringComplete = false;
  _setupPeerConnection() {
    this._pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._iceCandidates.push(e.candidate.toJSON());
        if (this._remoteId && this._config.signaling) {
          this._config.signaling.send(this._remoteId, {
            type: "ice-candidate",
            fromPeerId: this._localId,
            toPeerId: this._remoteId,
            candidate: e.candidate.toJSON()
          });
        }
      }
    };
    this._pc.onicegatheringstatechange = () => {
      if (this._pc.iceGatheringState === "complete") {
        this._iceGatheringComplete = true;
      }
    };
    this._pc.onconnectionstatechange = () => {
      this._state.next(this._pc.connectionState);
      if (this._pc.connectionState === "failed" || this._pc.connectionState === "disconnected") {
        for (const s of this._subs) s.error?.(new Error(`Connection ${this._pc.connectionState}`));
      }
    };
    this._pc.ondatachannel = (e) => {
      this._setupDataChannel(e.channel);
    };
  }
  _setupDataChannel(channel) {
    this._channel = channel;
    channel.binaryType = "arraybuffer";
    channel.onopen = () => {
      this._channelState.next("open");
    };
    channel.onclose = () => {
      this._channelState.next("closed");
      for (const s of this._subs) s.complete?.();
    };
    channel.onerror = (e) => {
      const err = new Error("DataChannel error");
      for (const s of this._subs) s.error?.(err);
    };
    channel.onmessage = (e) => {
      let data;
      if (typeof e.data === "string") {
        data = JSON.parse(e.data);
      } else {
        data = this._decodeBinary(e.data);
      }
      data.peerId = this._remoteId ?? void 0;
      data.dataChannelLabel = channel.label;
      if (data.type === "response" && data.reqId) {
        const p = this._pending.get(data.reqId);
        if (p) {
          this._pending.delete(data.reqId);
          if (data.payload?.error) p.reject(new Error(data.payload.error));
          else p.resolve(data.payload?.result ?? data.payload);
          return;
        }
      }
      for (const s of this._subs) {
        try {
          s.next?.(data);
        } catch (e2) {
          s.error?.(e2);
        }
      }
    };
  }
  /**
   * Create offer to initiate connection
   */
  async createOffer(remoteId) {
    this._remoteId = remoteId;
    const channel = this._pc.createDataChannel(this._channelName, this._config.dataChannelOptions);
    this._setupDataChannel(channel);
    const offer = await this._pc.createOffer();
    await this._pc.setLocalDescription(offer);
    return {
      type: "offer",
      fromPeerId: this._localId,
      toPeerId: remoteId,
      sdp: offer.sdp
    };
  }
  /**
   * Handle incoming offer
   */
  async handleOffer(signal) {
    this._remoteId = signal.fromPeerId;
    await this._pc.setRemoteDescription({
      type: "offer",
      sdp: signal.sdp
    });
    const answer = await this._pc.createAnswer();
    await this._pc.setLocalDescription(answer);
    return {
      type: "answer",
      fromPeerId: this._localId,
      toPeerId: signal.fromPeerId,
      sdp: answer.sdp
    };
  }
  /**
   * Handle incoming answer
   */
  async handleAnswer(signal) {
    await this._pc.setRemoteDescription({
      type: "answer",
      sdp: signal.sdp
    });
  }
  /**
   * Handle incoming ICE candidate
   */
  async addIceCandidate(signal) {
    if (signal.candidate) {
      await this._pc.addIceCandidate(signal.candidate);
    }
  }
  /**
   * Send message to peer
   */
  send(msg, binary) {
    if (!this._channel || this._channel.readyState !== "open") return;
    const { transferable, peerId, dataChannelLabel, ...data } = msg;
    if (binary || msg.binary) {
      this._channel.send(this._encodeBinary(data));
    } else {
      this._channel.send(JSON.stringify(data));
    }
  }
  /**
   * Send request and wait for response
   */
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pending.delete(reqId);
        reject(new Error("Request timeout"));
      }, this._config.connectionTimeout ?? 3e4);
      this._pending.set(reqId, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
        timestamp: Date.now()
      });
      this.send({ ...msg, reqId, type: "request" });
    });
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
      }
    };
  }
  _encodeBinary(data) {
    const json = JSON.stringify(data);
    return new TextEncoder().encode(json).buffer;
  }
  _decodeBinary(buffer) {
    const json = new TextDecoder().decode(buffer);
    return JSON.parse(json);
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    if (this._remoteId && this._config.signaling) {
      this._config.signaling.send(this._remoteId, {
        type: "disconnect",
        fromPeerId: this._localId,
        toPeerId: this._remoteId
      });
    }
    this._channel?.close();
    this._pc.close();
  }
  get localId() {
    return this._localId;
  }
  get remoteId() {
    return this._remoteId;
  }
  get connectionState() {
    return this._pc.connectionState;
  }
  get channelState() {
    return this._channel?.readyState ?? null;
  }
  get state() {
    return this._state;
  }
  get channelStateObservable() {
    return this._channelState;
  }
  get iceCandidates() {
    return [...this._iceCandidates];
  }
  get channelName() {
    return this._channelName;
  }
}
class RTCPeerManager {
  constructor(_channelName, _config = {}) {
    this._channelName = _channelName;
    this._config = _config;
    this._setupSignaling();
  }
  _peers = /* @__PURE__ */ new Map();
  _localId = UUIDv4();
  _subs = /* @__PURE__ */ new Set();
  _signalingCleanup = null;
  _peerEvents = new ChannelSubject();
  _setupSignaling() {
    if (!this._config.signaling) return;
    const cleanup = this._config.signaling.onMessage(async (signal) => {
      if (signal.toPeerId !== this._localId) return;
      switch (signal.type) {
        case "offer": {
          const peer = this._getOrCreatePeer(signal.fromPeerId);
          const answer = await peer.handleOffer(signal);
          this._config.signaling.send(signal.fromPeerId, answer);
          break;
        }
        case "answer": {
          const peer = this._peers.get(signal.fromPeerId);
          if (peer) await peer.handleAnswer(signal);
          break;
        }
        case "ice-candidate": {
          const peer = this._peers.get(signal.fromPeerId);
          if (peer) await peer.addIceCandidate(signal);
          break;
        }
        case "disconnect": {
          this._removePeer(signal.fromPeerId);
          break;
        }
      }
    });
    if (typeof cleanup === "function") {
      this._signalingCleanup = cleanup;
    } else if (cleanup && "unsubscribe" in cleanup) {
      this._signalingCleanup = () => cleanup.unsubscribe();
    }
  }
  _getOrCreatePeer(peerId) {
    let peer = this._peers.get(peerId);
    if (!peer) {
      peer = new RTCPeerTransport(this._channelName, this._config);
      this._peers.set(peerId, peer);
      peer.state.subscribe({
        next: (state) => {
          if (state === "connected") {
            this._peerEvents.next({ type: "connected", peerId, peer });
          } else if (state === "disconnected" || state === "closed") {
            this._peerEvents.next({ type: "disconnected", peerId });
          } else if (state === "failed") {
            this._peerEvents.next({ type: "failed", peerId });
            this._removePeer(peerId);
          }
        }
      });
      peer.subscribe({
        next: (msg) => {
          for (const s of this._subs) {
            try {
              s.next?.(msg);
            } catch (e) {
              s.error?.(e);
            }
          }
        },
        error: (e) => {
          for (const s of this._subs) s.error?.(e);
        }
      });
    }
    return peer;
  }
  _removePeer(peerId) {
    const peer = this._peers.get(peerId);
    if (peer) {
      peer.close();
      this._peers.delete(peerId);
      this._peerEvents.next({ type: "disconnected", peerId });
    }
  }
  /**
   * Connect to a peer
   */
  async connect(peerId) {
    const peer = this._getOrCreatePeer(peerId);
    const offer = await peer.createOffer(peerId);
    if (this._config.signaling) {
      await this._config.signaling.send(peerId, offer);
    }
    return peer;
  }
  /**
   * Send to specific peer
   */
  send(peerId, msg) {
    this._peers.get(peerId)?.send(msg);
  }
  /**
   * Broadcast to all peers
   */
  broadcast(msg) {
    for (const peer of this._peers.values()) {
      peer.send(msg);
    }
  }
  /**
   * Request from specific peer
   */
  request(peerId, msg) {
    const peer = this._peers.get(peerId);
    if (!peer) return Promise.reject(new Error("Peer not found"));
    return peer.request(msg);
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
      }
    };
  }
  onPeerEvent(handler) {
    return this._peerEvents.subscribe({ next: handler });
  }
  getPeers() {
    const result = /* @__PURE__ */ new Map();
    for (const [id, peer] of this._peers) {
      result.set(id, {
        id,
        connectionState: peer.connectionState,
        iceConnectionState: "new",
        // simplified
        dataChannelState: peer.channelState ?? "closed"
      });
    }
    return result;
  }
  close() {
    this._signalingCleanup?.();
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    for (const peer of this._peers.values()) {
      peer.close();
    }
    this._peers.clear();
  }
  get localId() {
    return this._localId;
  }
  get peerCount() {
    return this._peers.size;
  }
  get channelName() {
    return this._channelName;
  }
}
function createBroadcastSignaling(channelName) {
  const bc = new BroadcastChannel(`rtc-signaling:${channelName}`);
  const handlers = /* @__PURE__ */ new Set();
  bc.onmessage = (e) => {
    for (const h of handlers) h(e.data);
  };
  return {
    send(peerId, message) {
      bc.postMessage(message);
    },
    onMessage(handler) {
      handlers.add(handler);
      return { unsubscribe: () => handlers.delete(handler), closed: false };
    },
    close() {
      bc.close();
      handlers.clear();
    }
  };
}
const RTCTransportFactory = {
  createPeer: (name, config) => new RTCPeerTransport(name, config),
  createManager: (name, config) => new RTCPeerManager(name, config),
  createSignaling: (name) => createBroadcastSignaling(name)
};

class PortTransport {
  constructor(port, _channelName, _config = {}) {
    this._channelName = _channelName;
    this._config = _config;
    this._port = port;
    this._setupPort();
    if (_config.autoStart !== false) this.start();
  }
  _port;
  _subs = /* @__PURE__ */ new Set();
  _pending = /* @__PURE__ */ new Map();
  _listening = false;
  _cleanup = null;
  _portId = UUIDv4();
  _state = new ChannelSubject();
  _keepAliveTimer = null;
  _setupPort() {
    const msgHandler = (e) => {
      const data = e.data;
      if (data.type === "response" && data.reqId) {
        const p = this._pending.get(data.reqId);
        if (p) {
          this._pending.delete(data.reqId);
          if (data.payload?.error) p.reject(new Error(data.payload.error));
          else p.resolve(data.payload?.result ?? data.payload);
          return;
        }
      }
      if (data.type === "signal" && data.payload?.action === "ping") {
        this.send({
          id: UUIDv4(),
          channel: this._channelName,
          sender: this._portId,
          type: "signal",
          payload: { action: "pong" }
        });
        return;
      }
      data.portId = data.portId ?? this._portId;
      for (const s of this._subs) {
        try {
          s.next?.(data);
        } catch (e2) {
          s.error?.(e2);
        }
      }
    };
    const errHandler = () => {
      this._state.next("error");
      const err = new Error("Port error");
      for (const s of this._subs) s.error?.(err);
    };
    this._port.addEventListener("message", msgHandler);
    this._port.addEventListener("messageerror", errHandler);
    this._cleanup = () => {
      this._port.removeEventListener("message", msgHandler);
      this._port.removeEventListener("messageerror", errHandler);
    };
  }
  start() {
    if (this._listening) return;
    this._port.start();
    this._listening = true;
    this._state.next("ready");
    if (this._config.keepAlive) {
      this._startKeepAlive();
    }
  }
  send(msg, transfer) {
    const { transferable, ...data } = msg;
    this._port.postMessage({ ...data, portId: this._portId }, transfer ?? []);
  }
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pending.delete(reqId);
        reject(new Error("Request timeout"));
      }, this._config.timeout ?? 3e4);
      this._pending.set(reqId, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
        timestamp: Date.now()
      });
      this.send({ ...msg, reqId, type: "request" });
    });
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
      }
    };
  }
  _startKeepAlive() {
    this._keepAliveTimer = setInterval(() => {
      this.send({
        id: UUIDv4(),
        channel: this._channelName,
        sender: this._portId,
        type: "signal",
        payload: { action: "ping" }
      });
    }, this._config.keepAliveInterval ?? 3e4);
  }
  close() {
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
    this._cleanup?.();
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this._port.close();
    this._state.next("closed");
  }
  get port() {
    return this._port;
  }
  get portId() {
    return this._portId;
  }
  get isListening() {
    return this._listening;
  }
  get state() {
    return this._state;
  }
  get channelName() {
    return this._channelName;
  }
}
function createChannelPair(channelName, config) {
  const channel = new MessageChannel();
  const local = new PortTransport(channel.port1, channelName, config);
  return {
    local,
    remote: channel.port2,
    transfer: () => {
      const port = channel.port2;
      return port;
    }
  };
}
function createFromPort(port, channelName, config) {
  return new PortTransport(port, channelName, config);
}
class PortPool {
  constructor(_defaultConfig = {}) {
    this._defaultConfig = _defaultConfig;
  }
  _channels = /* @__PURE__ */ new Map();
  _mainPort = null;
  _subs = /* @__PURE__ */ new Set();
  /**
   * Create new channel in pool
   */
  create(channelName, config) {
    const result = createChannelPair(channelName, { ...this._defaultConfig, ...config });
    result.local.subscribe({
      next: (msg) => {
        for (const s of this._subs) {
          try {
            s.next?.(msg);
          } catch (e) {
            s.error?.(e);
          }
        }
      }
    });
    this._channels.set(channelName, result.local);
    return result;
  }
  /**
   * Add existing port to pool
   */
  add(channelName, port, config) {
    const transport = new PortTransport(port, channelName, { ...this._defaultConfig, ...config });
    transport.subscribe({
      next: (msg) => {
        for (const s of this._subs) {
          try {
            s.next?.(msg);
          } catch (e) {
            s.error?.(e);
          }
        }
      }
    });
    this._channels.set(channelName, transport);
    return transport;
  }
  /**
   * Get channel by name
   */
  get(channelName) {
    return this._channels.get(channelName);
  }
  /**
   * Send to specific channel
   */
  send(channelName, msg, transfer) {
    this._channels.get(channelName)?.send(msg, transfer);
  }
  /**
   * Broadcast to all channels
   */
  broadcast(msg, transfer) {
    for (const transport of this._channels.values()) {
      transport.send(msg, transfer);
    }
  }
  /**
   * Request on specific channel
   */
  request(channelName, msg) {
    const channel = this._channels.get(channelName);
    if (!channel) return Promise.reject(new Error(`Channel ${channelName} not found`));
    return channel.request(msg);
  }
  /**
   * Subscribe to all channels
   */
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
      }
    };
  }
  /**
   * Remove channel
   */
  remove(channelName) {
    const channel = this._channels.get(channelName);
    if (channel) {
      channel.close();
      this._channels.delete(channelName);
    }
  }
  /**
   * Close all channels
   */
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    for (const channel of this._channels.values()) {
      channel.close();
    }
    this._channels.clear();
  }
  get channelNames() {
    return Array.from(this._channels.keys());
  }
  get size() {
    return this._channels.size;
  }
}
class WindowPortConnector {
  constructor(_target, _channelName, _config = {}) {
    this._target = _target;
    this._channelName = _channelName;
    this._config = _config;
  }
  _transport = null;
  _state = new ChannelSubject();
  _handshakeComplete = false;
  /**
   * Initiate connection to target window
   */
  async connect() {
    if (this._transport && this._handshakeComplete) {
      return this._transport;
    }
    this._state.next("connecting");
    const { local, remote } = createChannelPair(this._channelName, this._config);
    this._target.postMessage(
      {
        type: "port-connect",
        channelName: this._channelName,
        portId: local.portId
      },
      this._config.targetOrigin ?? "*",
      [remote]
    );
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Handshake timeout"));
        this._state.next("error");
      }, this._config.handshakeTimeout ?? 1e4);
      const sub = local.subscribe({
        next: (msg) => {
          if (msg.type === "signal" && msg.payload?.action === "handshake-ack") {
            clearTimeout(timeout);
            this._handshakeComplete = true;
            this._transport = local;
            this._state.next("connected");
            sub.unsubscribe();
            resolve(local);
          }
        }
      });
    });
  }
  /**
   * Listen for incoming connections (target side)
   */
  static listen(channelName, handler, config) {
    const msgHandler = (e) => {
      if (e.data?.type !== "port-connect" || e.data?.channelName !== channelName) return;
      if (!e.ports[0]) return;
      const transport = new PortTransport(e.ports[0], channelName, config);
      transport.send({
        id: UUIDv4(),
        channel: channelName,
        sender: transport.portId,
        type: "signal",
        payload: { action: "handshake-ack" }
      });
      handler(transport);
    };
    globalThis.addEventListener("message", msgHandler);
    return () => globalThis.removeEventListener("message", msgHandler);
  }
  disconnect() {
    this._transport?.close();
    this._transport = null;
    this._handshakeComplete = false;
    this._state.next("disconnected");
  }
  get isConnected() {
    return this._handshakeComplete;
  }
  get state() {
    return this._state;
  }
  get transport() {
    return this._transport;
  }
}
function createPortProxy(transport, targetPath = []) {
  return createSenderProxy({
    request: (msg) => transport.request(msg),
    channelName: transport.channelName,
    senderId: transport.portId
  }, targetPath);
}
function exposeOverPort(transport, target) {
  const handler = createExposeHandler(target);
  return transport.subscribe({
    next: async (msg) => {
      if (msg.type !== "request" || !msg.payload?.path) return;
      const { action, path, args } = msg.payload;
      let result;
      let error;
      try {
        result = await handler(action, path, args ?? []);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      transport.send({
        id: UUIDv4(),
        channel: msg.sender,
        sender: transport.portId,
        type: "response",
        reqId: msg.reqId,
        payload: error ? { error } : { result }
      });
    }
  });
}
const PortTransportFactory = {
  create: (port, name, config) => new PortTransport(port, name, config),
  createPair: (name, config) => createChannelPair(name, config),
  createPool: (config) => new PortPool(config),
  createWindowConnector: (target, name, config) => new WindowPortConnector(target, name, config),
  listen: WindowPortConnector.listen,
  createProxy: createPortProxy,
  expose: exposeOverPort
};

class TransferableStorage {
  _db = null;
  _config;
  _changes = new ChannelSubject();
  _state = new ChannelSubject();
  _cleanupTimer = null;
  constructor(config) {
    this._config = {
      storeName: "transferable",
      version: 1,
      indexes: [],
      enableChangeTracking: true,
      autoCleanupExpired: true,
      cleanupInterval: 6e4,
      ...config
    };
  }
  /**
   * Open database connection
   */
  async open() {
    if (this._db) return;
    this._state.next("opening");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._config.dbName, this._config.version);
      request.onerror = () => {
        this._state.next("error");
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };
      request.onsuccess = () => {
        this._db = request.result;
        this._state.next("open");
        if (this._config.autoCleanupExpired) {
          this._startCleanupTimer();
        }
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this._config.storeName)) {
          const store = db.createObjectStore(this._config.storeName, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("expiresAt", "expiresAt");
          for (const idx of this._config.indexes) {
            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
          }
        }
      };
    });
  }
  /**
   * Close database connection
   */
  close() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    this._db?.close();
    this._db = null;
    this._state.next("closed");
  }
  /**
   * Store data with optional ArrayBuffer transfer
   */
  async put(id, data, options = {}) {
    await this._ensureOpen();
    let buffers = options.buffers ?? [];
    if (options.transfer && buffers.length > 0) {
      buffers = buffers.map((buf) => {
        if ("transfer" in buf && typeof buf.transfer === "function") {
          return buf.transfer();
        }
        return buf;
      });
    }
    const now = Date.now();
    const existing = await this.get(id);
    const record = {
      id,
      data,
      buffers: buffers.length > 0 ? buffers : void 0,
      metadata: options.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      expiresAt: options.expiresIn ? now + options.expiresIn : void 0
    };
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readwrite");
      const store = tx.objectStore(this._config.storeName);
      const request = store.put(record);
      request.onsuccess = () => {
        if (this._config.enableChangeTracking) {
          this._changes.next({
            type: existing ? "put" : "add",
            key: id,
            record,
            previousRecord: existing ?? void 0,
            timestamp: now
          });
        }
        resolve(record);
      };
      request.onerror = () => reject(new Error(`Put failed: ${request.error?.message}`));
    });
  }
  /**
   * Store ArrayBuffer directly with zero-copy semantics
   */
  async putBuffer(id, buffer, options = {}) {
    return this.put(id, buffer, { buffers: [buffer], ...options });
  }
  /**
   * Store TypedArray
   */
  async putTypedArray(id, array, options = {}) {
    const data = {
      type: array.constructor.name,
      data: Array.from(array)
    };
    return this.put(id, data, {
      buffers: options.transfer ? [array.buffer] : void 0,
      ...options
    });
  }
  /**
   * Get record by ID
   */
  async get(id) {
    await this._ensureOpen();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readonly");
      const store = tx.objectStore(this._config.storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        const record = request.result;
        if (record?.expiresAt && record.expiresAt < Date.now()) {
          this.delete(id);
          resolve(null);
        } else {
          resolve(record ?? null);
        }
      };
      request.onerror = () => reject(new Error(`Get failed: ${request.error?.message}`));
    });
  }
  /**
   * Get ArrayBuffer and optionally transfer ownership
   */
  async getBuffer(id, transfer) {
    const record = await this.get(id);
    if (!record) return null;
    let buffer = record.buffers?.[0] ?? (record.data instanceof ArrayBuffer ? record.data : null);
    if (buffer && transfer) {
      if ("transfer" in buffer && typeof buffer.transfer === "function") {
        buffer = buffer.transfer();
      }
    }
    return buffer;
  }
  /**
   * Reconstruct TypedArray from stored data
   */
  async getTypedArray(id) {
    const record = await this.get(id);
    if (!record || !record.data || typeof record.data !== "object") return null;
    const { type, data } = record.data;
    const TypedArrayCtor = globalThis[type];
    if (!TypedArrayCtor) return null;
    return new TypedArrayCtor(data);
  }
  /**
   * Delete record
   */
  async delete(id) {
    await this._ensureOpen();
    const existing = this._config.enableChangeTracking ? await this.get(id) : null;
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readwrite");
      const store = tx.objectStore(this._config.storeName);
      const request = store.delete(id);
      request.onsuccess = () => {
        if (this._config.enableChangeTracking && existing) {
          this._changes.next({
            type: "delete",
            key: id,
            previousRecord: existing,
            timestamp: Date.now()
          });
        }
        resolve(true);
      };
      request.onerror = () => reject(new Error(`Delete failed: ${request.error?.message}`));
    });
  }
  /**
   * Query records with cursor
   */
  async query(query = {}) {
    await this._ensureOpen();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readonly");
      const store = tx.objectStore(this._config.storeName);
      const source = query.index ? store.index(query.index) : store;
      const results = [];
      let skipped = 0;
      const offset = query.offset ?? 0;
      const limit = query.limit ?? Infinity;
      const request = source.openCursor(query.range, query.direction);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || results.length >= limit) {
          resolve(results);
          return;
        }
        const record = cursor.value;
        if (record.expiresAt && record.expiresAt < Date.now()) {
          cursor.continue();
          return;
        }
        if (query.filter && !query.filter(record)) {
          cursor.continue();
          return;
        }
        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        results.push(record);
        cursor.continue();
      };
      request.onerror = () => reject(new Error(`Query failed: ${request.error?.message}`));
    });
  }
  /**
   * Batch operations in single transaction
   */
  async batch(operations) {
    await this._ensureOpen();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readwrite");
      const store = tx.objectStore(this._config.storeName);
      const now = Date.now();
      for (const op of operations) {
        if (op.type === "put") {
          const record = {
            id: op.id,
            data: op.data,
            metadata: op.options?.metadata,
            createdAt: now,
            updatedAt: now,
            expiresAt: op.options?.expiresIn ? now + op.options.expiresIn : void 0
          };
          store.put(record);
        } else if (op.type === "delete") {
          store.delete(op.id);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(`Batch failed: ${tx.error?.message}`));
    });
  }
  /**
   * Clear all records
   */
  async clear() {
    await this._ensureOpen();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readwrite");
      const store = tx.objectStore(this._config.storeName);
      const request = store.clear();
      request.onsuccess = () => {
        if (this._config.enableChangeTracking) {
          this._changes.next({
            type: "clear",
            key: "*",
            timestamp: Date.now()
          });
        }
        resolve();
      };
      request.onerror = () => reject(new Error(`Clear failed: ${request.error?.message}`));
    });
  }
  /**
   * Count records
   */
  async count(query) {
    await this._ensureOpen();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._config.storeName, "readonly");
      const store = tx.objectStore(this._config.storeName);
      const source = query?.index ? store.index(query.index) : store;
      const request = source.count(query?.range);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Count failed: ${request.error?.message}`));
    });
  }
  /**
   * Subscribe to changes
   */
  onChanges(handler) {
    return this._changes.subscribe({ next: handler });
  }
  /**
   * Subscribe to state changes
   */
  onState(handler) {
    return this._state.subscribe({ next: handler });
  }
  /**
   * Cleanup expired records
   */
  async cleanupExpired() {
    await this._ensureOpen();
    const now = Date.now();
    const expired = await this.query({
      index: "expiresAt",
      range: IDBKeyRange.upperBound(now)
    });
    for (const record of expired) {
      await this.delete(record.id);
    }
    return expired.length;
  }
  // ========================================================================
  // PRIVATE
  // ========================================================================
  async _ensureOpen() {
    if (!this._db) await this.open();
  }
  _startCleanupTimer() {
    this._cleanupTimer = setInterval(() => {
      this.cleanupExpired().catch(console.error);
    }, this._config.cleanupInterval);
  }
  get isOpen() {
    return this._db !== null;
  }
  get state() {
    return this._state;
  }
  get changes() {
    return this._changes;
  }
}
class MessageQueueStorage extends TransferableStorage {
  constructor(dbName = "uniform-message-queue") {
    super({
      dbName,
      storeName: "messages",
      indexes: [
        { name: "channel", keyPath: "channel" },
        { name: "status", keyPath: "status" },
        { name: "priority", keyPath: "priority" },
        { name: "scheduledFor", keyPath: "scheduledFor" },
        { name: "channel-status", keyPath: ["channel", "status"] }
      ]
    });
  }
  /**
   * Enqueue a message
   */
  async enqueue(message) {
    const now = Date.now();
    const id = UUIDv4();
    const queuedMessage = {
      id,
      channel: message.channel,
      sender: message.sender,
      type: message.type,
      payload: message.payload,
      priority: message.priority ?? 0,
      attempts: 0,
      maxAttempts: message.maxAttempts ?? 3,
      status: "pending",
      createdAt: now,
      scheduledFor: now + (message.delay ?? 0),
      expiresAt: message.expiresIn ? now + message.expiresIn : void 0
    };
    await this.put(id, queuedMessage);
    return queuedMessage;
  }
  /**
   * Dequeue next message for channel
   */
  async dequeue(channel) {
    const now = Date.now();
    const messages = await this.query({
      filter: (r) => r.data.channel === channel && r.data.status === "pending" && r.data.scheduledFor <= now && (!r.data.expiresAt || r.data.expiresAt > now),
      limit: 1
    });
    if (messages.length === 0) return null;
    const message = messages[0].data;
    message.status = "processing";
    message.attempts++;
    message.lastAttemptAt = now;
    await this.put(message.id, message);
    return message;
  }
  /**
   * Mark message as completed
   */
  async complete(id) {
    const record = await this.get(id);
    if (!record) return;
    record.data.status = "completed";
    await this.put(id, record.data);
  }
  /**
   * Mark message as failed
   */
  async fail(id, error) {
    const record = await this.get(id);
    if (!record) return;
    if (record.data.attempts >= record.data.maxAttempts) {
      record.data.status = "failed";
    } else {
      record.data.status = "pending";
    }
    record.data.error = error;
    await this.put(id, record.data);
  }
  /**
   * Get pending count for channel
   */
  async getPendingCount(channel) {
    const messages = await this.query({
      filter: (r) => r.data.channel === channel && r.data.status === "pending"
    });
    return messages.length;
  }
}
const TransferableStorageFactory = {
  create: (config) => new TransferableStorage(config),
  createMessageQueue: (dbName) => new MessageQueueStorage(dbName)
};

class ServiceWorkerHost {
  _connection;
  _storage;
  _clients = /* @__PURE__ */ new Map();
  _channelSubscribers = /* @__PURE__ */ new Map();
  // channel -> client IDs
  _subscriptions = [];
  _cleanupInterval = null;
  // Observable streams for events
  _clientEvents = new ChannelSubject();
  _config;
  constructor(config) {
    this._config = {
      enableOfflineQueue: true,
      maxOfflineQueueSize: 100,
      messageTTL: 24 * 60 * 60 * 1e3,
      // 24 hours
      autoCleanup: true,
      cleanupInterval: 60 * 1e3,
      // 1 minute
      ...config
    };
    this._connection = getConnectionPool().getOrCreate(
      this._config.channelName,
      "service-worker",
      { metadata: { isHost: true } }
    );
    this._storage = getChannelStorage(this._config.channelName);
    this._setupMessageHandlers();
    if (this._config.autoCleanup) {
      this._startCleanupInterval();
    }
  }
  // ========================================================================
  // CLIENT MANAGEMENT
  // ========================================================================
  /**
   * Register a client connection
   */
  async registerClient(clientId, clientInfo = {}) {
    const info = {
      id: clientId,
      type: clientInfo.type ?? "window",
      url: clientInfo.url ?? "",
      visibilityState: clientInfo.visibilityState ?? "visible",
      focused: clientInfo.focused ?? false,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      channels: new Set(clientInfo.channels ?? [])
    };
    this._clients.set(clientId, info);
    this._clientEvents.next({ type: "connected", client: info });
    await this._deliverQueuedMessages(clientId);
  }
  /**
   * Unregister a client
   */
  unregisterClient(clientId) {
    const client = this._clients.get(clientId);
    if (client) {
      for (const subscribers of this._channelSubscribers.values()) {
        subscribers.delete(clientId);
      }
      this._clients.delete(clientId);
      this._clientEvents.next({ type: "disconnected", client });
    }
  }
  /**
   * Update client info
   */
  updateClient(clientId, updates) {
    const client = this._clients.get(clientId);
    if (client) {
      Object.assign(client, updates, { lastSeen: Date.now() });
      this._clientEvents.next({ type: "updated", client });
    }
  }
  /**
   * Subscribe client to a channel
   */
  subscribeClientToChannel(clientId, channel) {
    const client = this._clients.get(clientId);
    if (client) {
      client.channels.add(channel);
    }
    if (!this._channelSubscribers.has(channel)) {
      this._channelSubscribers.set(channel, /* @__PURE__ */ new Set());
    }
    this._channelSubscribers.get(channel).add(clientId);
  }
  /**
   * Unsubscribe client from a channel
   */
  unsubscribeClientFromChannel(clientId, channel) {
    const client = this._clients.get(clientId);
    if (client) {
      client.channels.delete(channel);
    }
    this._channelSubscribers.get(channel)?.delete(clientId);
  }
  /**
   * Get all connected clients
   */
  getClients() {
    return new Map(this._clients);
  }
  /**
   * Get clients subscribed to a channel
   */
  getChannelSubscribers(channel) {
    return new Set(this._channelSubscribers.get(channel) ?? []);
  }
  // ========================================================================
  // MESSAGING
  // ========================================================================
  /**
   * Send message to specific client
   */
  async sendToClient(clientId, message) {
    const client = this._clients.get(clientId);
    if (!client) {
      if (this._config.enableOfflineQueue) {
        await this._queueMessage(clientId, message);
      }
      return false;
    }
    return this._postToClient(clientId, message);
  }
  /**
   * Broadcast message to all clients subscribed to a channel
   */
  async broadcastToChannel(channel, message) {
    const subscribers = this._channelSubscribers.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return 0;
    }
    let deliveredCount = 0;
    for (const clientId of subscribers) {
      const delivered = await this.sendToClient(clientId, message);
      if (delivered) deliveredCount++;
    }
    return deliveredCount;
  }
  /**
   * Broadcast to all connected clients
   */
  async broadcastToAll(message) {
    let deliveredCount = 0;
    for (const clientId of this._clients.keys()) {
      const delivered = await this.sendToClient(clientId, message);
      if (delivered) deliveredCount++;
    }
    return deliveredCount;
  }
  /**
   * Handle incoming message from client
   */
  async handleClientMessage(clientId, data) {
    this.updateClient(clientId, { lastSeen: Date.now() });
    if (!data || typeof data !== "object") return;
    const messageType = data.type;
    switch (messageType) {
      case "connect":
        await this.registerClient(clientId, data.payload);
        break;
      case "disconnect":
        this.unregisterClient(clientId);
        break;
      case "subscribe":
        this.subscribeClientToChannel(clientId, data.payload?.channel);
        break;
      case "unsubscribe":
        this.unsubscribeClientFromChannel(clientId, data.payload?.channel);
        break;
      case "request":
        const response = await this._handleRequest(data);
        if (response) {
          await this.sendToClient(clientId, response);
        }
        break;
      case "event":
        if (data.channel) {
          await this.broadcastToChannel(data.channel, data);
        }
        break;
      default:
        this._connection.pushInbound({
          ...data,
          _clientId: clientId
        });
    }
  }
  // ========================================================================
  // SUBSCRIPTIONS
  // ========================================================================
  /**
   * Subscribe to client events
   */
  onClientEvent(handler) {
    return this._clientEvents.subscribe({ next: handler });
  }
  /**
   * Subscribe to messages from clients
   */
  onMessage(handler) {
    return this._connection.subscribe(handler);
  }
  /**
   * Subscribe to messages of specific type
   */
  onMessageType(type, handler) {
    return this._connection.onMessageType(type, handler);
  }
  // ========================================================================
  // OFFLINE QUEUE
  // ========================================================================
  /**
   * Queue message for offline client
   */
  async _queueMessage(clientId, message) {
    await this._storage.defer(
      {
        channel: message.channel,
        sender: message.sender,
        type: message.type,
        payload: { ...message.payload, _targetClient: clientId }
      },
      {
        expiresIn: this._config.messageTTL,
        priority: 0,
        metadata: { targetClient: clientId }
      }
    );
  }
  /**
   * Deliver queued messages when client reconnects
   */
  async _deliverQueuedMessages(clientId) {
    if (!this._config.enableOfflineQueue) return;
    const messages = await this._storage.getDeferredMessages(clientId, { status: "pending" });
    for (const stored of messages) {
      const message = {
        id: stored.id,
        channel: stored.channel,
        sender: stored.sender,
        type: stored.type,
        payload: stored.payload,
        timestamp: stored.createdAt
      };
      const delivered = await this._postToClient(clientId, message);
      if (delivered) {
        await this._storage.markDelivered(stored.id);
      }
    }
  }
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  /**
   * Start the host (call in SW activate)
   */
  async start() {
    await this._storage.open();
    this._connection.markConnected();
    await this._storage.cleanupExpired();
  }
  /**
   * Stop the host
   */
  stop() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
    for (const sub of this._subscriptions) {
      sub.unsubscribe();
    }
    this._subscriptions = [];
    this._connection.close();
    this._storage.close();
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  _setupMessageHandlers() {
    const messageSub = this._connection.subscribe({
      next: (msg) => {
        if (msg.type === "request") {
          this._handleRequest(msg);
        }
      }
    });
    this._subscriptions.push(messageSub);
  }
  async _handleRequest(msg) {
    const response = {
      id: UUIDv4(),
      channel: msg.sender,
      sender: this._config.channelName,
      type: "response",
      reqId: msg.reqId,
      payload: {
        result: null,
        error: null
      },
      timestamp: Date.now()
    };
    try {
      const action = msg.payload?.action;
      switch (action) {
        case "getClients":
          response.payload.result = Array.from(this._clients.values()).map((c) => ({
            ...c,
            channels: Array.from(c.channels)
          }));
          break;
        case "getChannelInfo":
          const channel = msg.payload?.channel;
          response.payload.result = {
            channel,
            subscriberCount: this._channelSubscribers.get(channel)?.size ?? 0
          };
          break;
        case "ping":
          response.payload.result = "pong";
          break;
        default:
          this._connection.pushInbound(msg);
          return null;
      }
    } catch (error) {
      response.payload.error = error instanceof Error ? error.message : String(error);
    }
    return response;
  }
  async _postToClient(clientId, message) {
    if (typeof clients === "undefined") return false;
    try {
      const client = await clients.get(clientId);
      if (client) {
        client.postMessage(message);
        return true;
      }
    } catch (e) {
      console.error("[SWHost] Failed to post to client:", e);
    }
    return false;
  }
  _startCleanupInterval() {
    this._cleanupInterval = setInterval(() => {
      this._cleanupStaleClients();
      this._storage.cleanupExpired();
    }, this._config.cleanupInterval);
  }
  async _cleanupStaleClients() {
    if (typeof clients === "undefined") return;
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    const activeIds = new Set(allClients.map((c) => c.id));
    for (const clientId of this._clients.keys()) {
      if (!activeIds.has(clientId)) {
        this.unregisterClient(clientId);
      }
    }
  }
}
class ServiceWorkerClient {
  constructor(_channelName) {
    this._channelName = _channelName;
  }
  _registration = null;
  _messageHandler = null;
  _subject = new ChannelSubject();
  // @ts-ignore
  _pendingRequests = /* @__PURE__ */ new Map();
  _isConnected = false;
  /**
   * Connect to SW host
   */
  async connect() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }
    this._registration = await navigator.serviceWorker.ready;
    this._messageHandler = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "response" && data.reqId) {
        const resolvers = this._pendingRequests.get(data.reqId);
        if (resolvers) {
          this._pendingRequests.delete(data.reqId);
          if (data.payload?.error) {
            resolvers.reject(new Error(data.payload.error));
          } else {
            resolvers.resolve(data.payload?.result);
          }
          return;
        }
      }
      this._subject.next(data);
    };
    navigator.serviceWorker.addEventListener("message", this._messageHandler);
    this._sendToSW({
      type: "connect",
      channel: this._channelName,
      payload: {
        url: location.href,
        visibilityState: document.visibilityState,
        focused: document.hasFocus()
      }
    });
    this._isConnected = true;
    document.addEventListener("visibilitychange", this._onVisibilityChange);
  }
  /**
   * Disconnect from SW host
   */
  disconnect() {
    if (this._messageHandler) {
      navigator.serviceWorker.removeEventListener("message", this._messageHandler);
      this._messageHandler = null;
    }
    this._sendToSW({
      type: "disconnect",
      channel: this._channelName
    });
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    this._isConnected = false;
  }
  /**
   * Subscribe to a channel
   */
  subscribeToChannel(channel) {
    this._sendToSW({
      type: "subscribe",
      channel: this._channelName,
      payload: { channel }
    });
  }
  /**
   * Unsubscribe from a channel
   */
  unsubscribeFromChannel(channel) {
    this._sendToSW({
      type: "unsubscribe",
      channel: this._channelName,
      payload: { channel }
    });
  }
  /**
   * Send request to SW host
   */
  async request(action, payload = {}) {
    const reqId = UUIDv4();
    const resolvers = Promise.withResolvers();
    this._pendingRequests.set(reqId, resolvers);
    this._sendToSW({
      id: UUIDv4(),
      type: "request",
      channel: this._channelName,
      sender: "client",
      reqId,
      payload: { action, ...payload },
      timestamp: Date.now()
    });
    setTimeout(() => {
      if (this._pendingRequests.has(reqId)) {
        this._pendingRequests.delete(reqId);
        resolvers.reject(new Error("Request timeout"));
      }
    }, 3e4);
    return resolvers.promise;
  }
  /**
   * Send event to SW host
   */
  emit(eventType, data, targetChannel) {
    this._sendToSW({
      id: UUIDv4(),
      type: "event",
      channel: targetChannel ?? this._channelName,
      sender: "client",
      payload: { type: eventType, data },
      timestamp: Date.now()
    });
  }
  /**
   * Subscribe to messages from SW host
   */
  subscribe(handler) {
    return this._subject.subscribe({ next: handler });
  }
  /**
   * Subscribe to specific event type
   */
  on(eventType, handler) {
    return filter(
      this._subject,
      (m) => m.type === "event" && m.payload?.type === eventType
    ).subscribe({
      next: (msg) => handler(msg.payload?.data)
    });
  }
  /**
   * Check if connected
   */
  get isConnected() {
    return this._isConnected;
  }
  // ========================================================================
  // PRIVATE
  // ========================================================================
  _sendToSW(message) {
    if (!this._registration?.active) return;
    this._registration.active.postMessage(message);
  }
  _onVisibilityChange = () => {
    if (!this._isConnected) return;
    this._sendToSW({
      type: "event",
      channel: this._channelName,
      payload: {
        type: "visibilityChange",
        data: {
          visibilityState: document.visibilityState,
          focused: document.hasFocus()
        }
      }
    });
  };
}
function createServiceWorkerHost(config) {
  return new ServiceWorkerHost(config);
}
function createServiceWorkerClient(channelName) {
  return new ServiceWorkerClient(channelName);
}

class AbstractTransport {
  constructor(_type, _channelName, _config) {
    this._type = _type;
    this._channelName = _channelName;
    this._config = _config;
  }
  _subs = /* @__PURE__ */ new Set();
  _pending = /* @__PURE__ */ new Map();
  _state = new ChannelSubject();
  _ready = false;
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pending.delete(reqId);
        reject(new Error("Request timeout"));
      }, this._config.timeout ?? 3e4);
      this._pending.set(reqId, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
        timestamp: Date.now()
      });
      this.send({ ...msg, reqId, type: "request" });
    });
  }
  subscribe(observer) {
    const obs = typeof observer === "function" ? { next: observer } : observer;
    this._subs.add(obs);
    return {
      closed: false,
      unsubscribe: () => {
        this._subs.delete(obs);
      }
    };
  }
  _handleMessage(data) {
    if (data.type === "response" && data.reqId) {
      const p = this._pending.get(data.reqId);
      if (p) {
        this._pending.delete(data.reqId);
        if (data.payload?.error) p.reject(new Error(data.payload.error));
        else p.resolve(data.payload?.result ?? data.payload);
        return;
      }
    }
    for (const s of this._subs) {
      try {
        s.next?.(data);
      } catch (e) {
        s.error?.(e);
      }
    }
  }
  close() {
    this._subs.forEach((s) => s.complete?.());
    this._subs.clear();
    this._ready = false;
    this._state.next("disconnected");
  }
  get type() {
    return this._type;
  }
  get channelName() {
    return this._channelName;
  }
  get isReady() {
    return this._ready;
  }
  get state() {
    return this._state;
  }
}
class NativeTransport extends AbstractTransport {
  constructor(_target, config) {
    super(detectTransportType$1(_target), config.channelName, config);
    this._target = _target;
    this._sendFn = createTransportSender(_target);
    this._setupListener();
  }
  _sendFn;
  _cleanup = null;
  _setupListener() {
    this._cleanup = createTransportListener(
      this._target,
      (data) => this._handleMessage(data),
      (err) => this._subs.forEach((s) => s.error?.(err)),
      () => this._subs.forEach((s) => s.complete?.())
    );
    this._ready = true;
    this._state.next("connected");
  }
  send(msg, transfer) {
    this._sendFn(msg, transfer);
  }
  close() {
    this._cleanup?.();
    super.close();
  }
}
function createTransport(channelName, options = {}, config = {}) {
  const baseConfig = {
    channelName,
    timeout: 3e4,
    autoConnect: true,
    ...config
  };
  if (options.worker) {
    const worker = options.worker.existing ?? new Worker(options.worker.scriptUrl, options.worker.options);
    return new NativeTransport(worker, baseConfig);
  }
  if (options.sharedWorker) {
    const client = new SharedWorkerClient(
      options.sharedWorker.scriptUrl,
      channelName,
      options.sharedWorker.options
    );
    return {
      send: (msg, transfer) => client.send(msg, transfer),
      request: (msg) => client.request(msg),
      subscribe: (obs) => client.subscribe(obs),
      close: () => client.close(),
      type: "shared-worker",
      channelName,
      isReady: true
    };
  }
  if (options.websocket) {
    const ws = createWebSocketTransport(options.websocket.url, {
      protocols: options.websocket.protocols,
      reconnect: options.websocket.reconnect
    });
    const subs = /* @__PURE__ */ new Set();
    const pending = /* @__PURE__ */ new Map();
    ws.listen((data) => {
      if (data.type === "response" && data.reqId) {
        const p = pending.get(data.reqId);
        if (p) {
          pending.delete(data.reqId);
          if (data.payload?.error) p.reject(new Error(data.payload.error));
          else p.resolve(data.payload?.result ?? data.payload);
          return;
        }
      }
      for (const s of subs) {
        try {
          s.next?.(data);
        } catch {
        }
      }
    });
    return {
      send: (msg, transfer) => ws.send(msg, transfer),
      request: (msg) => new Promise((resolve, reject) => {
        const reqId = msg.reqId ?? UUIDv4();
        const timeout = setTimeout(() => {
          pending.delete(reqId);
          reject(new Error("Request timeout"));
        }, baseConfig.timeout);
        pending.set(reqId, {
          resolve: (v) => {
            clearTimeout(timeout);
            resolve(v);
          },
          reject: (e) => {
            clearTimeout(timeout);
            reject(e);
          },
          timestamp: Date.now()
        });
        ws.send({ ...msg, reqId, type: "request" });
      }),
      subscribe: (obs) => {
        const o = typeof obs === "function" ? { next: obs } : obs;
        subs.add(o);
        return { closed: false, unsubscribe: () => subs.delete(o) };
      },
      close: () => {
        subs.clear();
        ws.close();
      },
      type: "websocket",
      channelName,
      isReady: ws.socket.readyState === WebSocket.OPEN
    };
  }
  if (options.broadcast) {
    const bc = createBroadcastTransport(options.broadcast.name ?? channelName);
    return new NativeTransport(bc.channel, baseConfig);
  }
  if (options.port?.port) {
    const transport = new PortTransport(options.port.port, channelName, options.port.config);
    return {
      send: (msg, transfer) => transport.send(msg, transfer),
      request: (msg) => transport.request(msg),
      subscribe: (obs) => transport.subscribe(obs),
      close: () => transport.close(),
      type: "message-port",
      channelName,
      isReady: transport.isListening
    };
  }
  if (options.chrome) {
    if (options.chrome.mode === "runtime") {
      const obs = new ChromeRuntimeObservable(void 0, options.chrome.options);
      return {
        send: (msg) => obs.send(msg),
        request: (msg) => obs.request(msg),
        subscribe: (o) => obs.subscribe(o),
        close: () => obs.close(),
        type: "chrome-runtime",
        channelName,
        isReady: true
      };
    }
    if (options.chrome.mode === "tabs") {
      const obs = new ChromeTabsObservable(options.chrome.tabId, options.chrome.options);
      return {
        send: (msg) => obs.send(msg),
        request: () => Promise.reject("Not supported"),
        subscribe: (o) => obs.subscribe(o),
        close: () => obs.close(),
        type: "chrome-tabs",
        channelName,
        isReady: true
      };
    }
    if (options.chrome.mode === "port") {
      const obs = new ChromePortObservable(options.chrome.portName ?? channelName, options.chrome.tabId);
      return {
        send: (msg) => obs.send(msg),
        request: () => Promise.reject("Not supported"),
        subscribe: (o) => obs.subscribe(o),
        close: () => obs.close(),
        type: "chrome-port",
        channelName,
        isReady: obs.isConnected
      };
    }
    if (options.chrome.mode === "external") {
      const obs = new ChromeExternalObservable(options.chrome.options);
      return {
        send: (msg) => obs.send(msg),
        request: () => Promise.reject("Not supported"),
        subscribe: (o) => obs.subscribe(o),
        close: () => obs.close(),
        type: "chrome-external",
        channelName,
        isReady: true
      };
    }
  }
  if (options.socketio) {
    const obs = new SocketIOObservable(options.socketio.socket, channelName, options.socketio.options);
    return {
      send: (msg) => obs.send(msg),
      request: (msg) => obs.request(msg),
      subscribe: (o) => obs.subscribe(o),
      close: () => obs.close(),
      type: "socket-io",
      channelName,
      isReady: obs.isConnected
    };
  }
  if (options.serviceWorker) {
    if (options.serviceWorker.mode === "client") {
      const client = new ServiceWorkerClient(channelName);
      client.connect();
      return {
        send: (msg) => client.emit(msg.type, msg.payload, msg.channel),
        request: (msg) => client.request(msg.payload?.action ?? "unknown", msg.payload),
        subscribe: (o) => client.subscribe(typeof o === "function" ? o : (m) => o.next?.(m)),
        close: () => client.disconnect(),
        type: "service-worker",
        channelName,
        isReady: client.isConnected
      };
    }
  }
  if (options.atomics) {
    const transport = new AtomicsTransport(
      channelName,
      options.atomics.sendBuffer,
      options.atomics.recvBuffer,
      options.atomics.config
    );
    return {
      send: (msg, transfer) => transport.send(msg),
      request: (msg) => transport.request(msg),
      subscribe: (o) => transport.subscribe(o),
      close: () => transport.close(),
      type: "atomics",
      channelName,
      isReady: true
    };
  }
  if (options.rtc) {
    if (options.rtc.mode === "peer") {
      const peer = new RTCPeerTransport(channelName, options.rtc.config);
      return {
        send: (msg) => peer.send(msg),
        request: (msg) => peer.request(msg),
        subscribe: (o) => peer.subscribe(o),
        close: () => peer.close(),
        type: "rtc-data",
        channelName,
        isReady: peer.connectionState === "connected"
      };
    }
    if (options.rtc.mode === "manager") {
      const manager = new RTCPeerManager(channelName, options.rtc.config);
      return {
        send: (msg) => manager.broadcast(msg),
        request: () => Promise.reject("Use manager.request(peerId, msg) directly"),
        subscribe: (o) => manager.subscribe(o),
        close: () => manager.close(),
        type: "rtc-data",
        channelName,
        isReady: true
      };
    }
  }
  const subject = new ChannelSubject();
  return {
    send: (msg) => subject.next(msg),
    request: () => Promise.reject("Internal transport does not support request"),
    subscribe: (o) => subject.subscribe(o),
    close: () => subject.complete(),
    type: "internal",
    channelName,
    isReady: true
  };
}
class TransportRegistry {
  _transports = /* @__PURE__ */ new Map();
  register(name, transport) {
    this._transports.set(name, transport);
  }
  get(name) {
    return this._transports.get(name);
  }
  getOrCreate(name, options = {}, config = {}) {
    let transport = this._transports.get(name);
    if (!transport) {
      transport = createTransport(name, options, config);
      this._transports.set(name, transport);
    }
    return transport;
  }
  remove(name) {
    const transport = this._transports.get(name);
    if (transport) {
      transport.close();
      this._transports.delete(name);
    }
  }
  closeAll() {
    for (const transport of this._transports.values()) {
      transport.close();
    }
    this._transports.clear();
  }
  list() {
    return Array.from(this._transports.keys());
  }
  get size() {
    return this._transports.size;
  }
}
let _registry = null;
function getTransportRegistry() {
  if (!_registry) _registry = new TransportRegistry();
  return _registry;
}
const UnifiedTransportFactory = {
  // Main factory
  create: createTransport,
  registry: getTransportRegistry,
  // Native wrappers
  fromWorker: (worker, name, config) => createTransport(name, { worker: { existing: worker } }, config),
  fromPort: (port, name, config) => createTransport(name, { port: { port } }, config),
  fromWebSocket: (url, name, config) => createTransport(name, { websocket: { url } }, config),
  fromBroadcast: (name, config) => createTransport(name, { broadcast: {} }, config),
  // Specialized transports
  sharedWorker: {
    client: (url, name, opts) => new SharedWorkerClient(url, name, opts),
    host: (name) => new SharedWorkerHost(name)
  },
  atomics: {
    create: (name, send, recv, config) => new AtomicsTransport(name, send, recv, config),
    createPair: createAtomicsChannelPair,
    buffer: (size) => new AtomicsBuffer(size),
    ringBuffer: () => new AtomicsRingBuffer()
  },
  rtc: {
    peer: (name, config) => new RTCPeerTransport(name, config),
    manager: (name, config) => new RTCPeerManager(name, config),
    signaling: createBroadcastSignaling
  },
  port: {
    create: (port, name, config) => new PortTransport(port, name, config),
    createPair: createChannelPair,
    pool: (config) => new PortPool(config),
    windowConnector: (target, name) => new WindowPortConnector(target, name)
  },
  storage: {
    create: (config) => new TransferableStorage(config),
    messageQueue: (dbName) => new MessageQueueStorage(dbName)
  },
  serviceWorker: {
    host: (config) => new ServiceWorkerHost(config),
    client: (name) => new ServiceWorkerClient(name)
  },
  socketio: (socket, name, opts) => new SocketIOObservable(socket, name, opts),
  chrome: {
    runtime: (opts) => new ChromeRuntimeObservable(void 0, opts),
    tabs: (tabId, opts) => new ChromeTabsObservable(tabId, opts),
    port: (name, tabId) => new ChromePortObservable(name, tabId)
  },
  // Utilities
  detect: detectTransportType$1,
  meta: getTransportMeta
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
const getCurrentTabId = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    throw new Error("No active tab found");
  }
  if (!tabs[0].id) {
    throw new Error("Active tab has no ID");
  }
  return tabs[0].id;
};
const getVisibleTabId = async () => {
  try {
    return await getCurrentTabId();
  } catch {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const visibleTab = tabs.find((tab) => tab.active);
    if (!visibleTab?.id) {
      throw new Error("No visible tab found");
    }
    return visibleTab.id;
  }
};
const registerWorkerAPI = (api, channelName = "worker") => {
  const channelHandler = initChannelHandler(channelName ?? "worker");
  Object.keys(api).forEach((methodName) => {
    const method = api[methodName];
    if (typeof method === "function") {
    }
  });
  return channelHandler;
};
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

class MessageQueue {
  db = null;
  dbPromise = null;
  options;
  constructor(options = {}) {
    this.options = {
      dbName: options.dbName ?? "UniformMessageQueue",
      storeName: options.storeName ?? "messages",
      maxRetries: options.maxRetries ?? 3,
      defaultExpirationMs: options.defaultExpirationMs ?? 24 * 60 * 60 * 1e3,
      // 24 hours
      fallbackStorageKey: options.fallbackStorageKey ?? "uniform_message_queue"
    };
  }
  // ========================================================================
  // DATABASE INITIALIZATION
  // ========================================================================
  /**
   * Initialize IndexedDB database
   */
  async initDB() {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;
    if (!MessageQueue.isIndexedDBAvailable()) {
      console.warn("[MessageQueue] IndexedDB not available, using sessionStorage fallback");
      return null;
    }
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.options.dbName, 1);
      request.onerror = () => {
        console.warn("[MessageQueue] IndexedDB open failed, falling back to sessionStorage");
        reject(new Error("IndexedDB not available"));
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const store = db.createObjectStore(this.options.storeName, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("priority", "priority", { unique: false });
          store.createIndex("destination", "destination", { unique: false });
        }
      };
    });
    try {
      this.db = await this.dbPromise;
      return this.db;
    } catch {
      return null;
    }
  }
  // ========================================================================
  // QUEUE OPERATIONS
  // ========================================================================
  /**
   * Generate unique message ID
   */
  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  /**
   * Queue a message for later processing
   */
  async queueMessage(type, data, options = {}) {
    const message = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      priority: options.priority ?? "normal",
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.options.maxRetries,
      expiresAt: options.expiresAt ?? Date.now() + this.options.defaultExpirationMs,
      destination: options.destination,
      metadata: options.metadata
    };
    try {
      const db = await this.initDB();
      if (db) {
        await this.addToIndexedDB(db, message);
      } else {
        this.addToSessionStorage(message);
      }
      console.log(`[MessageQueue] Queued message: ${type}`, message.id);
      return message.id;
    } catch (error) {
      console.error("[MessageQueue] Failed to queue message:", error);
      throw error;
    }
  }
  /**
   * Get all queued messages
   */
  async getQueuedMessages(destination) {
    try {
      const db = await this.initDB();
      let messages;
      if (db) {
        messages = await this.getAllFromIndexedDB(db);
      } else {
        messages = this.getAllFromSessionStorage();
      }
      if (destination) {
        messages = messages.filter((msg) => msg.destination === destination);
      }
      const now = Date.now();
      return messages.filter((msg) => !msg.expiresAt || msg.expiresAt > now);
    } catch (error) {
      console.error("[MessageQueue] Failed to get queued messages:", error);
      return this.getAllFromSessionStorage();
    }
  }
  /**
   * Remove a message from the queue
   */
  async removeMessage(messageId) {
    try {
      const db = await this.initDB();
      if (db) {
        await this.deleteFromIndexedDB(db, messageId);
      } else {
        this.deleteFromSessionStorage(messageId);
      }
    } catch (error) {
      console.error("[MessageQueue] Failed to remove message:", error);
    }
  }
  /**
   * Update message retry count
   */
  async updateMessageRetry(messageId, retryCount) {
    try {
      const db = await this.initDB();
      if (db) {
        await this.updateInIndexedDB(db, messageId, { retryCount });
      } else {
        this.updateInSessionStorage(messageId, { retryCount });
      }
    } catch (error) {
      console.error("[MessageQueue] Failed to update message retry:", error);
    }
  }
  /**
   * Clear all expired messages
   */
  async clearExpiredMessages() {
    try {
      const messages = await this.getQueuedMessages();
      const now = Date.now();
      const expiredIds = messages.filter((msg) => msg.expiresAt && msg.expiresAt <= now).map((msg) => msg.id);
      for (const id of expiredIds) {
        await this.removeMessage(id);
      }
      if (expiredIds.length > 0) {
        console.log(`[MessageQueue] Cleared ${expiredIds.length} expired messages`);
      }
      return expiredIds.length;
    } catch (error) {
      console.error("[MessageQueue] Failed to clear expired messages:", error);
      return 0;
    }
  }
  /**
   * Clear all messages
   */
  async clearAll() {
    try {
      const db = await this.initDB();
      if (db) {
        await this.clearIndexedDB(db);
      } else {
        sessionStorage.removeItem(this.options.fallbackStorageKey);
      }
      console.log("[MessageQueue] Cleared all messages");
    } catch (error) {
      console.error("[MessageQueue] Failed to clear all messages:", error);
    }
  }
  /**
   * Get queue statistics
   */
  async getStats() {
    const messages = await this.getQueuedMessages();
    const now = Date.now();
    const byPriority = { low: 0, normal: 0, high: 0 };
    const byDestination = {};
    let expired = 0;
    for (const msg of messages) {
      byPriority[msg.priority]++;
      if (msg.destination) {
        byDestination[msg.destination] = (byDestination[msg.destination] || 0) + 1;
      }
      if (msg.expiresAt && msg.expiresAt <= now) {
        expired++;
      }
    }
    return {
      total: messages.length,
      byPriority,
      byDestination,
      expired
    };
  }
  // ========================================================================
  // INDEXEDDB OPERATIONS
  // ========================================================================
  async addToIndexedDB(db, message) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], "readwrite");
      const store = transaction.objectStore(this.options.storeName);
      const request = store.add(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async getAllFromIndexedDB(db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], "readonly");
      const store = transaction.objectStore(this.options.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async deleteFromIndexedDB(db, id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], "readwrite");
      const store = transaction.objectStore(this.options.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async updateInIndexedDB(db, id, updates) {
    const transaction = db.transaction([this.options.storeName], "readwrite");
    const store = transaction.objectStore(this.options.storeName);
    const message = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (message) {
      Object.assign(message, updates);
      await new Promise((resolve, reject) => {
        const request = store.put(message);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
  async clearIndexedDB(db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], "readwrite");
      const store = transaction.objectStore(this.options.storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  // ========================================================================
  // SESSION STORAGE FALLBACK
  // ========================================================================
  getAllFromSessionStorage() {
    try {
      const stored = sessionStorage.getItem(this.options.fallbackStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  addToSessionStorage(message) {
    const existing = this.getAllFromSessionStorage();
    existing.push(message);
    sessionStorage.setItem(this.options.fallbackStorageKey, JSON.stringify(existing));
  }
  deleteFromSessionStorage(id) {
    const existing = this.getAllFromSessionStorage();
    const filtered = existing.filter((msg) => msg.id !== id);
    sessionStorage.setItem(this.options.fallbackStorageKey, JSON.stringify(filtered));
  }
  updateInSessionStorage(id, updates) {
    const existing = this.getAllFromSessionStorage();
    const message = existing.find((msg) => msg.id === id);
    if (message) {
      Object.assign(message, updates);
      sessionStorage.setItem(this.options.fallbackStorageKey, JSON.stringify(existing));
    }
  }
  // ========================================================================
  // STATIC UTILITIES
  // ========================================================================
  /**
   * Check if IndexedDB is available
   */
  static isIndexedDBAvailable() {
    try {
      return typeof indexedDB !== "undefined" && typeof IDBTransaction !== "undefined" && typeof IDBKeyRange !== "undefined";
    } catch {
      return false;
    }
  }
}
const instances = /* @__PURE__ */ new Map();
function getMessageQueue(options) {
  const key = options?.dbName ?? "default";
  if (!instances.has(key)) {
    instances.set(key, new MessageQueue(options));
  }
  return instances.get(key);
}
function createMessageQueue(options) {
  return new MessageQueue(options);
}

const isServiceWorkerContext = () => {
  try {
    const SWGS = globalThis?.ServiceWorkerGlobalScope;
    return typeof SWGS !== "undefined" && globalThis instanceof SWGS;
  } catch {
    return false;
  }
};
const isChromeExtensionContext = () => {
  try {
    return typeof chrome !== "undefined" && !!chrome?.runtime?.id;
  } catch {
    return false;
  }
};
const detectExecutionContext = () => {
  if (isChromeExtensionContext()) return "chrome-extension";
  if (isServiceWorkerContext()) return "service-worker";
  try {
    if (typeof document !== "undefined") return "main";
  } catch {
  }
  return "unknown";
};
const supportsDedicatedWorkers = () => {
  if (isServiceWorkerContext()) return false;
  try {
    return typeof Worker !== "undefined";
  } catch {
    return false;
  }
};

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
class ChromeExtensionTabsChannel {
  wrappedByOriginal = /* @__PURE__ */ new Map();
  wrappedListeners = /* @__PURE__ */ new Set();
  channelName;
  mode = "broadcast";
  tabFilter;
  tabIdGetter;
  constructor(channelName, options) {
    this.channelName = channelName;
    this.mode = options?.mode || "broadcast";
    this.tabFilter = options?.tabFilter;
    this.tabIdGetter = options?.tabIdGetter || this.getCurrentTabId;
    this.startListening();
  }
  startListening() {
    ensureRuntimeListener();
  }
  addEventListener(type, listener) {
    if (type !== "message") return;
    const existing = this.wrappedByOriginal.get(listener);
    if (existing) return;
    const wrapped = async (event, sender, sendResponse) => {
      const message = event?.data;
      if (!sender?.tab) return;
      if (this.mode === "current-tab") {
        const targetTabId = await this.tabIdGetter?.();
        if (typeof targetTabId === "number" && sender.tab.id !== targetTabId) return;
      }
      if (this.mode === "broadcast" && this.tabFilter && !this.tabFilter(sender.tab)) return;
      const enhancedEvent = {
        ...event,
        origin: sender.url || "chrome-extension-tab",
        tab: sender.tab
      };
      return listener(enhancedEvent, sender, sendResponse);
    };
    this.wrappedByOriginal.set(listener, wrapped);
    this.wrappedListeners.add(wrapped);
    let set = runtimeListenerRegistry.get(this.channelName);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      runtimeListenerRegistry.set(this.channelName, set);
    }
    set.add(wrapped);
  }
  removeEventListener(type, listener) {
    if (type !== "message") return;
    const wrapped = this.wrappedByOriginal.get(listener);
    if (!wrapped) return;
    this.wrappedByOriginal.delete(listener);
    this.wrappedListeners.delete(wrapped);
    runtimeListenerRegistry.get(this.channelName)?.delete(wrapped);
  }
  /**
   * Send message to specific tab
   */
  sendToTab(tabId, message) {
    const messageWithChannel = {
      channelName: this.channelName,
      source: "tabs-channel",
      ...message
    };
    return new Promise((resolve, reject) => {
      chrome?.tabs?.sendMessage?.(tabId, messageWithChannel, (response) => {
        if (chrome?.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
  /**
   * Send message to active/current tab
   */
  async sendToActiveTab(message) {
    if (this.mode === "current-tab" && this.tabIdGetter) {
      const tabId = await this.tabIdGetter();
      return this.sendToTab(tabId, message);
    } else {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error("No active tab found");
      }
      return this.sendToTab(tabs[0].id, message);
    }
  }
  /**
   * Broadcast message to all matching tabs (only works in broadcast mode)
   */
  async broadcastToTabs(message, options) {
    if (this.mode === "current-tab") {
      try {
        const response = await this.sendToActiveTab(message);
        return [{ tabId: await this.tabIdGetter(), response }];
      } catch (error) {
        return [{ error }];
      }
    }
    const query = {
      status: "complete"
    };
    if (!options?.allWindows) {
      query.currentWindow = true;
    }
    const tabs = await chrome.tabs.query(query);
    const targetTabs = tabs.filter((tab) => {
      if (options?.tabFilter && !options.tabFilter(tab)) return false;
      if (this.tabFilter && !this.tabFilter(tab)) return false;
      return true;
    });
    const messageWithChannel = {
      channelName: this.channelName,
      source: "tabs-channel",
      ...message
    };
    const promises = targetTabs.map(
      (tab) => new Promise((resolve, reject) => {
        chrome?.tabs?.sendMessage?.(tab.id, messageWithChannel, (response) => {
          if (chrome?.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve({ tabId: tab.id, response });
          }
        });
      })
    );
    return Promise.allSettled(promises);
  }
  /**
   * Send message via chrome runtime (for service worker communication)
   */
  async postMessage(message) {
    const tabId = await this.tabIdGetter();
    const messageWithChannel = {
      channelName: this.channelName,
      source: "tabs-channel",
      ...message
    };
    return chrome?.tabs?.sendMessage?.(tabId, messageWithChannel, () => void 0);
  }
  /**
   * Get current tab ID (convenience method)
   */
  async getCurrentTabId() {
    if (this.tabIdGetter) {
      return await this.tabIdGetter();
    }
    return 0;
  }
  close() {
    for (const wrapped of this.wrappedListeners) {
      runtimeListenerRegistry.get(this.channelName)?.delete(wrapped);
    }
    this.wrappedListeners.clear();
    this.wrappedByOriginal.clear();
  }
}
class ChromeExtensionPortChannel {
  constructor(port, channelName) {
    this.port = port;
    this.channelName = channelName;
    this.port?.onMessage?.addListener?.((message) => {
      if ((message?.channelName ?? message?.target) !== this.channelName) return;
      const event = { data: message, origin: "chrome-extension-port", source: this.port };
      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error("[ChromeExtensionPortChannel] Listener error:", error);
        }
      }
    });
  }
  listeners = /* @__PURE__ */ new Set();
  addEventListener(type, listener) {
    if (type !== "message") return;
    this.listeners.add(listener);
  }
  removeEventListener(type, listener) {
    if (type !== "message") return;
    this.listeners.delete(listener);
  }
  postMessage(message) {
    this.port?.postMessage?.({
      ...message,
      channelName: this.channelName,
      source: "port-channel"
    });
  }
  close() {
    this.listeners.clear();
    this.port?.disconnect?.();
  }
}

const createChromeExtensionChannel = async (config) => {
  let worker;
  try {
    if (typeof config.script !== "string") {
      throw new Error("Chrome extension worker channel requires config.script to be a string path");
    }
    worker = new Worker(chrome.runtime.getURL(config.script), config.options);
  } catch (error) {
    if (typeof config.script === "string") {
      worker = new Worker(new URL(config.script, import.meta.url), config.options);
    } else if (typeof config.script === "function") {
      worker = config.script();
    } else {
      worker = config.script;
    }
  }
  const channel = await createOrUseExistingChannel(config.name, {}, worker);
  return channel?.remote ?? channel;
};
const createChromeExtensionBroadcast = (channelName) => {
  const worker = new ChromeExtensionBroadcastChannel(channelName);
  return worker;
};
const createChromeExtensionBroadcastChannel = (channelName) => {
  const worker = new ChromeExtensionBroadcastChannel(channelName);
  const channel = createOrUseExistingChannel(channelName, {}, worker);
  return channel?.remote ?? channel;
};
const createChromeExtensionTabsChannel = (channelName, options) => {
  const worker = new ChromeExtensionTabsChannel(channelName, options);
  const channel = createOrUseExistingChannel(channelName, {}, worker);
  return channel?.remote ?? channel;
};
const createChromeExtensionTabsMessagingChannel = (channelName, options) => {
  return createChromeExtensionTabsChannel(channelName, options);
};
const initMainChannel = (name = "$host$") => {
  return initChannelHandler(name ?? "$host$");
};
const createQueuedWorkerChannel = (config, onChannelReady) => {
  return new QueuedWorkerChannel(config, onChannelReady);
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
const createOptimizedWorkerChannel = async (config, options) => {
  const baseChannel = await createWorkerChannel(config);
  return new OptimizedWorkerChannel(baseChannel, options);
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

class PendingMessageStore {
  storageKey;
  maxMessages;
  defaultTTLMs;
  constructor(options) {
    this.storageKey = options?.storageKey ?? "uniform-messaging-pending";
    this.maxMessages = options?.maxMessages ?? 200;
    this.defaultTTLMs = options?.defaultTTLMs ?? 24 * 60 * 60 * 1e3;
  }
  read() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  write(entries) {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch {
    }
  }
  enqueue(destination, message) {
    if (!destination) return;
    const now = Date.now();
    const ttl = Number(message?.metadata?.expiresAt) ? Math.max(0, Number(message.metadata.expiresAt) - now) : this.defaultTTLMs;
    if (ttl <= 0) return;
    const entries = this.read().filter((e) => e && typeof e === "object").filter((e) => {
      const expiresAt = Number(e?.message?.metadata?.expiresAt) || Number(e?.storedAt) + this.defaultTTLMs;
      return expiresAt > now;
    });
    entries.push({ destination, message, storedAt: now });
    if (entries.length > this.maxMessages) {
      entries.splice(0, entries.length - this.maxMessages);
    }
    this.write(entries);
  }
  drain(destination) {
    if (!destination) return [];
    const now = Date.now();
    const entries = this.read();
    const keep = [];
    const out = [];
    for (const e of entries) {
      const expiresAt = Number(e?.message?.metadata?.expiresAt) || Number(e?.storedAt) + this.defaultTTLMs;
      if (expiresAt <= now) continue;
      if (e?.destination === destination && e?.message) {
        out.push(e.message);
      } else {
        keep.push(e);
      }
    }
    this.write(keep);
    return out;
  }
  has(destination) {
    if (!destination) return false;
    const now = Date.now();
    return this.read().some((e) => {
      if (!e || typeof e !== "object") return false;
      const expiresAt = Number(e?.message?.metadata?.expiresAt) || Number(e?.storedAt) + this.defaultTTLMs;
      return expiresAt > now && e?.destination === destination;
    });
  }
  clear() {
    this.write([]);
  }
}
class UnifiedMessagingManager {
  handlers = /* @__PURE__ */ new Map();
  channels = /* @__PURE__ */ new Map();
  workerChannels = /* @__PURE__ */ new Map();
  viewChannels = /* @__PURE__ */ new Map();
  pipelines = /* @__PURE__ */ new Map();
  messageQueue;
  pendingStore;
  initializedViews = /* @__PURE__ */ new Set();
  viewReadyPromises = /* @__PURE__ */ new Map();
  executionContext;
  channelMappings;
  componentRegistry = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.executionContext = detectExecutionContext();
    this.channelMappings = config.channelMappings ?? {};
    this.messageQueue = getMessageQueue(config.queueOptions);
    this.pendingStore = new PendingMessageStore(config.pendingStoreOptions);
    this.setupGlobalListeners();
  }
  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================
  /**
   * Register a message handler for a specific destination
   */
  registerHandler(destination, handler) {
    if (!this.handlers.has(destination)) {
      this.handlers.set(destination, []);
    }
    this.handlers.get(destination).push(handler);
  }
  /**
   * Unregister a message handler
   */
  unregisterHandler(destination, handler) {
    const handlers = this.handlers.get(destination);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  /**
   * Send a message to a destination
   */
  async sendMessage(message) {
    const fullMessage = {
      id: message.id ?? crypto.randomUUID(),
      type: message.type,
      source: message.source ?? "unified-messaging",
      destination: message.destination,
      contentType: message.contentType,
      data: message.data,
      metadata: { timestamp: Date.now(), ...message.metadata }
    };
    if (await this.tryDeliverMessage(fullMessage)) {
      return true;
    }
    if (fullMessage.destination) {
      this.pendingStore.enqueue(fullMessage.destination, fullMessage);
      await this.messageQueue.queueMessage(fullMessage.type, fullMessage, {
        priority: fullMessage.metadata?.priority ?? "normal",
        maxRetries: fullMessage.metadata?.maxRetries ?? 3,
        destination: fullMessage.destination
      });
    }
    return false;
  }
  /**
   * Process a message through registered handlers
   */
  async processMessage(message) {
    const destination = message.destination ?? "general";
    const handlers = this.handlers.get(destination) ?? [];
    for (const handler of handlers) {
      if (handler.canHandle(message)) {
        try {
          await handler.handle(message);
        } catch (error) {
          console.error(`[UnifiedMessaging] Handler error for ${destination}:`, error);
        }
      }
    }
  }
  /**
   * Try to deliver message immediately
   */
  async tryDeliverMessage(message) {
    if (message.destination && this.handlers.has(message.destination)) {
      await this.processMessage(message);
      return true;
    }
    const channelName = this.getChannelForDestination(message.destination);
    if (channelName && this.channels.has(channelName)) {
      const channel = this.channels.get(channelName);
      if (channel instanceof BroadcastChannel) {
        try {
          channel.postMessage(message);
          return true;
        } catch (error) {
          console.warn(`[UnifiedMessaging] Failed to post to broadcast channel ${channelName}:`, error);
        }
      } else if (channel && "request" in channel) {
        try {
          await channel.request(message.type, [message]);
          return true;
        } catch (error) {
          console.warn(`[UnifiedMessaging] Failed to post to worker channel ${channelName}:`, error);
        }
      }
    }
    return false;
  }
  // ========================================================================
  // WORKER CHANNEL MANAGEMENT
  // ========================================================================
  /**
   * Register worker channels for a specific view
   */
  registerViewChannels(viewHash, configs) {
    const channelNames = /* @__PURE__ */ new Set();
    for (const config of configs) {
      if (!this.isWorkerSupported(config)) {
        console.log(`[UnifiedMessaging] Skipping worker '${config.name}' in ${this.executionContext} context`);
        continue;
      }
      const channel = createQueuedOptimizedWorkerChannel({
        name: config.name,
        script: config.script,
        options: config.options,
        context: this.executionContext
      }, config.protocolOptions, () => {
        console.log(`[UnifiedMessaging] Channel '${config.name}' ready for view '${viewHash}'`);
      });
      const channelKey = `${viewHash}:${config.name}`;
      this.workerChannels.set(channelKey, channel);
      this.channels.set(channelKey, channel);
      channelNames.add(config.name);
    }
    this.viewChannels.set(viewHash, channelNames);
  }
  /**
   * Initialize channels when a view becomes active
   */
  async initializeViewChannels(viewHash) {
    if (this.initializedViews.has(viewHash)) return;
    const deferred = this.createDeferred();
    this.viewReadyPromises.set(viewHash, deferred);
    console.log(`[UnifiedMessaging] Initializing channels for view: ${viewHash}`);
    const channelNames = this.viewChannels.get(viewHash);
    if (!channelNames) {
      deferred.resolve();
      return;
    }
    const initPromises = [];
    for (const channelName of channelNames) {
      const channelKey = `${viewHash}:${channelName}`;
      const channel = this.workerChannels.get(channelKey);
      if (channel) {
        initPromises.push(
          channel.request("ping", {}).catch(() => {
            console.log(`[UnifiedMessaging] Channel '${channelName}' queued for view '${viewHash}'`);
          })
        );
      }
    }
    await Promise.allSettled(initPromises);
    this.initializedViews.add(viewHash);
    deferred.resolve();
  }
  /**
   * Get a worker channel for a specific view and worker
   */
  getWorkerChannel(viewHash, workerName) {
    return this.workerChannels.get(`${viewHash}:${workerName}`) ?? null;
  }
  // ========================================================================
  // BROADCAST CHANNEL MANAGEMENT
  // ========================================================================
  /**
   * Create or get a broadcast channel
   */
  getBroadcastChannel(channelName) {
    if (!this.channels.has(channelName)) {
      try {
        const channel = new BroadcastChannel(channelName);
        channel.addEventListener("message", (event) => {
          this.handleBroadcastMessage(event.data, channelName);
        });
        this.channels.set(channelName, channel);
      } catch (error) {
        console.warn(`[UnifiedMessaging] BroadcastChannel not available: ${channelName}`, error);
        const mockChannel = {
          postMessage: () => {
          },
          close: () => {
          },
          addEventListener: () => {
          },
          removeEventListener: () => {
          }
        };
        this.channels.set(channelName, mockChannel);
      }
    }
    return this.channels.get(channelName);
  }
  /**
   * Handle incoming broadcast messages
   */
  async handleBroadcastMessage(message, channelName) {
    try {
      const msgObj = message;
      const unifiedMessage = msgObj?.id ? message : {
        id: crypto.randomUUID(),
        type: String(msgObj?.type ?? "unknown"),
        source: channelName,
        data: message,
        metadata: { timestamp: Date.now() }
      };
      await this.processMessage(unifiedMessage);
    } catch (error) {
      console.error(`[UnifiedMessaging] Error handling broadcast message on ${channelName}:`, error);
    }
  }
  // ========================================================================
  // PIPELINE MANAGEMENT
  // ========================================================================
  /**
   * Register a message processing pipeline
   */
  registerPipeline(config) {
    this.pipelines.set(config.name, config);
  }
  /**
   * Process a message through a pipeline
   */
  async processThroughPipeline(pipelineName, message) {
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline '${pipelineName}' not found`);
    }
    let currentMessage = { ...message };
    const timeout = pipeline.timeout ?? 3e4;
    for (const stage of pipeline.stages) {
      const stageTimeout = stage.timeout ?? timeout;
      const retries = stage.retries ?? 0;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await Promise.race([
            stage.handler(currentMessage),
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error(`Stage '${stage.name}' timeout`)), stageTimeout)
            )
          ]);
          currentMessage = result;
          break;
        } catch (error) {
          if (attempt === retries) {
            if (pipeline.errorHandler) {
              pipeline.errorHandler(error, stage, currentMessage);
            }
            throw error;
          }
          console.warn(`[UnifiedMessaging] Pipeline '${pipelineName}' stage '${stage.name}' attempt ${attempt + 1} failed:`, error);
        }
      }
    }
    return currentMessage;
  }
  // ========================================================================
  // QUEUE MANAGEMENT
  // ========================================================================
  /**
   * Process queued messages for a destination
   */
  async processQueuedMessages(destination) {
    const queuedMessages = await this.messageQueue.getQueuedMessages(destination);
    for (const queuedMessage of queuedMessages) {
      const dataAsMessage = queuedMessage.data;
      const message = dataAsMessage && typeof dataAsMessage === "object" && typeof dataAsMessage.type === "string" && typeof dataAsMessage.id === "string" ? dataAsMessage : {
        id: queuedMessage.id,
        type: queuedMessage.type,
        source: "queue",
        destination: queuedMessage.destination,
        data: queuedMessage.data,
        metadata: {
          timestamp: queuedMessage.timestamp,
          retryCount: queuedMessage.retryCount,
          maxRetries: queuedMessage.maxRetries,
          ...queuedMessage.metadata
        }
      };
      if (await this.tryDeliverMessage(message)) {
        await this.messageQueue.removeMessage(queuedMessage.id);
      }
    }
  }
  // ========================================================================
  // COMPONENT REGISTRATION
  // ========================================================================
  /**
   * Register a component with a destination
   */
  registerComponent(componentId, destination) {
    this.componentRegistry.set(componentId, destination);
  }
  /**
   * Initialize a component and return any pending messages
   */
  initializeComponent(componentId) {
    const destination = this.componentRegistry.get(componentId);
    if (!destination) return [];
    return this.pendingStore.drain(destination);
  }
  /**
   * Check if there are pending messages for a destination
   */
  hasPendingMessages(destination) {
    return this.pendingStore.has(destination);
  }
  /**
   * Explicitly enqueue a pending message
   */
  enqueuePendingMessage(destination, message) {
    const dest = String(destination ?? "").trim();
    if (!dest || !message) return;
    this.pendingStore.enqueue(dest, message);
  }
  // ========================================================================
  // CHANNEL MAPPING
  // ========================================================================
  /**
   * Set channel mappings
   */
  setChannelMappings(mappings) {
    this.channelMappings = { ...this.channelMappings, ...mappings };
  }
  /**
   * Get channel name for a destination
   */
  getChannelForDestination(destination) {
    if (!destination) return null;
    return this.channelMappings[destination] ?? null;
  }
  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  /**
   * Check if a worker configuration is supported
   */
  isWorkerSupported(_config) {
    if (this.executionContext === "service-worker") {
      return true;
    }
    if (this.executionContext === "chrome-extension") {
      return supportsDedicatedWorkers();
    }
    return true;
  }
  /**
   * Set up global listeners for cross-component communication
   */
  setupGlobalListeners() {
    if (typeof window !== "undefined") {
      globalThis.addEventListener("message", (event) => {
        if (event.data && typeof event.data === "object" && event.data.type) {
          this.handleBroadcastMessage(event.data, "window-message");
        }
      });
    }
  }
  /**
   * Create a deferred promise
   */
  createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { resolve, reject, promise };
  }
  /**
   * Get execution context
   */
  getExecutionContext() {
    return this.executionContext;
  }
  /**
   * Clean up resources
   */
  destroy() {
    for (const channel of this.channels.values()) {
      if (channel instanceof BroadcastChannel) {
        channel.close();
      } else if (channel && "close" in channel) {
        channel.close();
      }
    }
    this.channels.clear();
    this.workerChannels.clear();
    this.handlers.clear();
    this.pipelines.clear();
  }
}
let defaultInstance = null;
function getUnifiedMessaging(config) {
  if (!defaultInstance) {
    defaultInstance = new UnifiedMessagingManager(config);
  }
  return defaultInstance;
}
function createUnifiedMessaging(config) {
  return new UnifiedMessagingManager(config);
}
function resetUnifiedMessaging() {
  if (defaultInstance) {
    defaultInstance.destroy();
    defaultInstance = null;
  }
}
function sendMessage(message) {
  return getUnifiedMessaging().sendMessage(message);
}
function registerHandler(destination, handler) {
  getUnifiedMessaging().registerHandler(destination, handler);
}
function getWorkerChannel(viewHash, workerName) {
  return getUnifiedMessaging().getWorkerChannel(viewHash, workerName);
}
function getBroadcastChannel(channelName) {
  return getUnifiedMessaging().getBroadcastChannel(channelName);
}

class ServiceChannelManager {
  channels = /* @__PURE__ */ new Map();
  readyPromises = /* @__PURE__ */ new Map();
  messageHandlers = /* @__PURE__ */ new Map();
  channelConfigs;
  executionContext;
  logPrefix;
  constructor(config = {}) {
    this.channelConfigs = config.channels ?? {};
    this.logPrefix = config.logPrefix ?? "[ServiceChannels]";
    this.executionContext = detectExecutionContext();
    console.log(`${this.logPrefix} Initialized in ${this.executionContext} context`);
  }
  // ========================================================================
  // CONFIGURATION
  // ========================================================================
  /**
   * Register channel configurations
   */
  registerConfigs(configs) {
    this.channelConfigs = { ...this.channelConfigs, ...configs };
  }
  /**
   * Get channel configuration
   */
  getConfig(channelId) {
    return this.channelConfigs[channelId];
  }
  /**
   * Get all channel configurations
   */
  getAllConfigs() {
    return { ...this.channelConfigs };
  }
  // ========================================================================
  // CHANNEL LIFECYCLE
  // ========================================================================
  /**
   * Initialize a service channel
   */
  async initChannel(channelId) {
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId);
    }
    const config = this.channelConfigs[channelId];
    if (!config) {
      throw new Error(`Unknown channel: ${channelId}. Register configuration first.`);
    }
    let resolveReady;
    const readyPromise = new Promise((resolve) => {
      resolveReady = resolve;
    });
    this.readyPromises.set(channelId, { promise: readyPromise, resolve: resolveReady });
    console.log(`${this.logPrefix} Initializing channel: ${channelId} -> ${config.broadcastName}`);
    const channel = new BroadcastChannel(config.broadcastName);
    channel.onmessage = (event) => {
      this.handleIncomingMessage(channelId, event.data);
    };
    channel.onmessageerror = (event) => {
      console.error(`${this.logPrefix} Message error on ${channelId}:`, event);
    };
    this.channels.set(channelId, channel);
    resolveReady();
    console.log(`${this.logPrefix} Channel ready: ${channelId}`);
    return channel;
  }
  /**
   * Close a service channel
   */
  closeChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.close();
      this.channels.delete(channelId);
      this.readyPromises.delete(channelId);
      this.messageHandlers.delete(channelId);
      console.log(`${this.logPrefix} Channel closed: ${channelId}`);
    }
  }
  /**
   * Close all channels
   */
  closeAll() {
    for (const channelId of this.channels.keys()) {
      this.closeChannel(channelId);
    }
  }
  /**
   * Wait for a channel to be ready
   */
  async waitForChannel(channelId) {
    const deferred = this.readyPromises.get(channelId);
    if (deferred) {
      await deferred.promise;
    } else {
      await this.initChannel(channelId);
    }
  }
  // ========================================================================
  // MESSAGING
  // ========================================================================
  /**
   * Send a message to a channel
   */
  async send(target, type, data, options = {}) {
    await this.waitForChannel(target);
    const channel = this.channels.get(target);
    if (!channel) {
      throw new Error(`Channel not ready: ${target}`);
    }
    const message = {
      type,
      source: options.source ?? this.executionContext,
      target,
      data,
      timestamp: Date.now(),
      correlationId: options.correlationId
    };
    channel.postMessage(message);
    console.log(`${this.logPrefix} Sent message to ${target}:`, type);
  }
  /**
   * Broadcast a message to all initialized channels
   */
  broadcast(type, data, source) {
    for (const [channelId, channel] of this.channels) {
      const message = {
        type,
        source: source ?? this.executionContext,
        target: channelId,
        data,
        timestamp: Date.now()
      };
      channel.postMessage(message);
    }
    console.log(`${this.logPrefix} Broadcast message:`, type);
  }
  /**
   * Subscribe to messages on a channel
   */
  subscribe(channelId, handler) {
    if (!this.messageHandlers.has(channelId)) {
      this.messageHandlers.set(channelId, /* @__PURE__ */ new Set());
    }
    this.messageHandlers.get(channelId).add(handler);
    this.initChannel(channelId).catch(console.error);
    return () => {
      this.messageHandlers.get(channelId)?.delete(handler);
    };
  }
  /**
   * Handle incoming message
   */
  handleIncomingMessage(channelId, data) {
    const handlers = this.messageHandlers.get(channelId);
    if (!handlers || handlers.size === 0) {
      console.log(`${this.logPrefix} No handlers for ${channelId}, message queued`);
      return;
    }
    const message = data;
    for (const handler of handlers) {
      try {
        handler(message);
      } catch (error) {
        console.error(`${this.logPrefix} Handler error on ${channelId}:`, error);
      }
    }
  }
  // ========================================================================
  // CHANNEL STATE
  // ========================================================================
  /**
   * Check if channel is initialized
   */
  isInitialized(channelId) {
    return this.channels.has(channelId);
  }
  /**
   * Get all initialized channel IDs
   */
  getInitializedChannels() {
    return Array.from(this.channels.keys());
  }
  /**
   * Get channel status
   */
  getStatus() {
    const status = {};
    for (const channelId of Object.keys(this.channelConfigs)) {
      status[channelId] = {
        connected: this.channels.has(channelId),
        lastActivity: Date.now(),
        pendingMessages: 0
      };
    }
    return status;
  }
  /**
   * Get execution context
   */
  getExecutionContext() {
    return this.executionContext;
  }
}
function createServiceChannelManager(config) {
  return new ServiceChannelManager(config);
}
let defaultManager = null;
function getServiceChannelManager(config) {
  if (!defaultManager) {
    defaultManager = new ServiceChannelManager(config);
  } else if (config?.channels) {
    defaultManager.registerConfigs(config.channels);
  }
  return defaultManager;
}
function resetServiceChannelManager() {
  if (defaultManager) {
    defaultManager.closeAll();
    defaultManager = null;
  }
}

function makeChannelMessageHandler(transport, channelName, handler) {
  const pending = /* @__PURE__ */ new Map();
  const send = createTransportSender(transport);
  return (subscriber) => {
    const respond = (data) => {
      if (data.type === "response" && data.reqId) {
        return (result) => {
          const p = pending.get(data.reqId);
          if (p) {
            p.resolve(result);
            pending.delete(data.reqId);
          }
        };
      }
      if (data.type === "request") {
        return (result, transfer) => send({ ...result, channel: data.sender, sender: channelName, type: "response", reqId: data.reqId }, transfer);
      }
      return send;
    };
    const onMessage = (data) => {
      if (!subscriber.active) return;
      if (data.type === "response" && data.reqId) {
        const p = pending.get(data.reqId);
        if (p) {
          p.resolve(data.payload);
          pending.delete(data.reqId);
        }
      }
      handler ? handler(data, respond(data)) : subscriber.next(data);
    };
    const cleanup = createTransportListener(transport, onMessage, (e) => subscriber.error(e), () => subscriber.complete());
    subscriber.request = (msg) => {
      const reqId = msg.reqId ?? UUIDv4();
      msg.reqId = reqId;
      return new Promise((resolve, reject) => {
        pending.set(reqId, { resolve, reject, timestamp: Date.now() });
        send(msg);
      });
    };
    return cleanup;
  };
}
class ChannelMessageObservable {
  constructor(_transport, _channelName) {
    this._transport = _transport;
    this._channelName = _channelName;
    this._send = createTransportSender(_transport);
  }
  _pending = /* @__PURE__ */ new Map();
  _subs = /* @__PURE__ */ new Set();
  _cleanup = null;
  _send;
  _active = false;
  subscribe(observer) {
    this._subs.add(observer);
    if (!this._active) this._activate();
    return {
      unsubscribe: () => {
        this._subs.delete(observer);
        if (this._subs.size === 0) this._deactivate();
      }
    };
  }
  next(msg, transfer) {
    this._send(msg, transfer);
  }
  request(msg) {
    const reqId = msg.reqId ?? UUIDv4();
    return new Promise((resolve, reject) => {
      this._pending.set(reqId, { resolve, reject, timestamp: Date.now() });
      this.next({ ...msg, reqId });
    });
  }
  _activate() {
    if (this._active) return;
    this._cleanup = createTransportListener(
      this._transport,
      (data) => {
        if (data.type === "response" && data.reqId) {
          const p = this._pending.get(data.reqId);
          if (p) {
            p.resolve(data.payload);
            this._pending.delete(data.reqId);
          }
        }
        for (const s of this._subs) {
          try {
            s.next?.(data);
          } catch (e) {
            s.error?.(e);
          }
        }
      },
      (e) => this._subs.forEach((s) => s.error?.(e)),
      () => this._subs.forEach((s) => s.complete?.())
    );
    this._active = true;
  }
  _deactivate() {
    this._cleanup?.();
    this._cleanup = null;
    this._active = false;
  }
}
function createChannelRequestHandler(channelName, options = {}) {
  return async (data, respond) => {
    if (data.type !== "request" || data.channel !== channelName) return;
    options.onRequest?.(data.payload);
    const result = await handleRequest(data.payload, data.reqId, channelName);
    if (result) {
      options.onResponse?.(result.response);
      respond({ ...result.response, id: UUIDv4(), timestamp: Date.now() }, result.transfer);
    }
  };
}
class ObservableRequestDispatcher {
  constructor(_channelName, _targetChannel) {
    this._channelName = _channelName;
    this._targetChannel = _targetChannel;
  }
  _pending = /* @__PURE__ */ new Map();
  _subscriber = null;
  connect(subscriber) {
    this._subscriber = subscriber;
  }
  disconnect() {
    for (const p of this._pending.values()) p.reject(new Error("Disconnected"));
    this._pending.clear();
    this._subscriber = null;
  }
  handleMessage(data) {
    if (data.type === "response" && data.reqId) {
      const p = this._pending.get(data.reqId);
      if (p) {
        p.resolve(data.payload);
        this._pending.delete(data.reqId);
      }
    }
  }
  dispatch(action, path, args) {
    if (!this._subscriber?.active) return Promise.reject(new Error("Not connected"));
    const reqId = UUIDv4();
    const msg = {
      id: UUIDv4(),
      channel: this._targetChannel,
      sender: this._channelName,
      type: "request",
      reqId,
      payload: { channel: this._targetChannel, sender: this._channelName, path, action, args },
      timestamp: Date.now()
    };
    const promise = new Promise((resolve, reject) => this._pending.set(reqId, { resolve, reject, timestamp: Date.now() }));
    this._subscriber.next(msg);
    return promise;
  }
}

const sync = async (channel, options = {}, broadcast = null) => createOrUseExistingChannel(channel, options, broadcast ?? (typeof self !== "undefined" ? self : null));
const importModuleInChannel = async (channel, url, options = {}, broadcast = typeof self !== "undefined" ? self : null) => {
  const remote = await createOrUseExistingChannel(channel, options?.channelOptions, broadcast);
  return remote?.doImportModule?.(url, options?.importOptions);
};
const createContext = createChannelContext;
const getSharedContext = getOrCreateContext;
const createMultiChannel = createChannelsInContext;
const importIsolatedModule = importModuleInContext;
const connectToChannelAsModule = async (channel, options = {}, broadcast = typeof self !== "undefined" ? self : null, hostChannel = "$host$") => {
  const host = createHostChannel(hostChannel ?? "$host$");
  await host?.createRemoteChannel(channel, options, broadcast);
  return wrapChannel(channel, host ?? SELF_CHANNEL?.instance);
};
const createChromeExtensionRuntimeChannel = (channelName, options = {}) => {
  const context = detectExecutionContext();
  if (context !== "chrome-extension") {
    return { async request(method) {
      throw new Error(`Chrome extension messaging not available in ${context}`);
    }, close() {
    } };
  }
  return {
    async request(method, args = []) {
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({
            id: `crx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: method,
            source: context,
            target: channelName,
            data: args?.length === 1 ? args[0] : args,
            metadata: { timestamp: Date.now(), ...options?.metadata ?? {} }
          }, (response) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(response);
          });
        } catch (error) {
          reject(error);
        }
      });
    },
    close() {
    }
  };
};

export { $avoidTrigger, $getValue, $set, $triggerLock, Promised, QueuedWorkerChannel, UUIDv4, WRef, __vitePreload, bindCtx, bindEvent, callByAllProp, callByProp, camelToKebab, canBeInteger, clamp, contextify, convertOrientPxToCX, createChromeExtensionBroadcast, createChromeExtensionRuntimeChannel, createQueuedOptimizedWorkerChannel, createServiceChannelManager, createWorkerChannel, cvt_cs_to_os, defaultByType, deref, detectExecutionContext, getUnifiedMessaging, getValue, handleListeners, hasValue, inProxy, isArrayInvalidKey, isArrayOrIterable, isKeyType, isNotEqual, isObject$1 as isObject, isObservable, isPrimitive, isVal, isValidObj, isValueRef, isValueUnit, kebabToCamel, makeTriggerLess, normalizePrimitive, objectAssign, objectAssignNotEqual, potentiallyAsync, potentiallyAsyncMap, redirectCell, toRef, tryParseByHint, tryStringAsNumber, unref, withCtx };
//# sourceMappingURL=index.js.map
