import { __vitePreload, $originalKey$, $originalObjects$, safe, JSOX, setIdleInterval, addEvent, addToCallChain, observe, stringRef, loadAsAdopted, loadSettings } from './Settings.js';
import { detectExecutionContext, objectAssign } from './Env.js';
import { COMPONENTS, ROUTE_HASHES, BROADCAST_CHANNELS, registerComponent, registerHandler, initializeComponent, unregisterHandler } from './UnifiedMessaging.js';

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

const SERVICE_CHANNEL_CONFIG = {
  workcenter: {
    broadcastName: BROADCAST_CHANNELS.WORK_CENTER,
    routeHash: ROUTE_HASHES.WORKCENTER,
    component: COMPONENTS.WORK_CENTER,
    description: "AI work center for processing files and content"
  },
  settings: {
    broadcastName: BROADCAST_CHANNELS.SETTINGS,
    routeHash: ROUTE_HASHES.SETTINGS,
    component: COMPONENTS.SETTINGS,
    description: "Application settings and configuration"
  },
  viewer: {
    broadcastName: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
    routeHash: ROUTE_HASHES.MARKDOWN_VIEWER,
    component: COMPONENTS.MARKDOWN_VIEWER,
    description: "Content viewer for markdown and files"
  },
  explorer: {
    broadcastName: BROADCAST_CHANNELS.FILE_EXPLORER,
    routeHash: ROUTE_HASHES.FILE_EXPLORER,
    component: COMPONENTS.FILE_EXPLORER,
    description: "File explorer and browser"
  },
  airpad: {
    broadcastName: "rs-airpad",
    routeHash: "#airpad",
    component: "airpad",
    description: "Touch-friendly input pad"
  },
  print: {
    broadcastName: BROADCAST_CHANNELS.PRINT_CHANNEL,
    routeHash: ROUTE_HASHES.PRINT,
    component: COMPONENTS.BASIC_PRINT,
    description: "Print preview and export"
  },
  history: {
    broadcastName: BROADCAST_CHANNELS.HISTORY_CHANNEL,
    routeHash: ROUTE_HASHES.HISTORY,
    component: COMPONENTS.HISTORY,
    description: "Action history and undo/redo"
  },
  editor: {
    broadcastName: "rs-editor",
    routeHash: ROUTE_HASHES.MARKDOWN_EDITOR,
    component: COMPONENTS.MARKDOWN_EDITOR,
    description: "Content editor"
  },
  home: {
    broadcastName: "rs-home",
    routeHash: "#home",
    component: "home",
    description: "Home/landing view"
  }
};
let appServiceChannelManager = null;
function getServiceChannels() {
  if (!appServiceChannelManager) {
    appServiceChannelManager = createServiceChannelManager({
      channels: SERVICE_CHANNEL_CONFIG,
      logPrefix: "[ServiceChannels]"
    });
  }
  return appServiceChannelManager;
}
const serviceChannels = getServiceChannels();

const VIEW_MESSAGE_FALLBACKS = {
  viewer: ["content-view", "content-load", "markdown-content"],
  workcenter: ["content-attach", "file-attach", "share-target-input", "content-share"],
  explorer: ["file-save", "navigate-path", "content-explorer"],
  editor: ["content-load", "content-edit"],
  settings: ["settings-update"],
  history: ["history-update"],
  home: ["home-update"],
  airpad: ["content-load"],
  print: ["content-view"]
};
const inferDestination = (viewId) => {
  if (viewId === "viewer") return "viewer";
  if (viewId === "workcenter") return "workcenter";
  if (viewId === "explorer") return "explorer";
  if (viewId === "editor") return "editor";
  if (viewId === "settings") return "settings";
  if (viewId === "history") return "history";
  if (viewId === "print") return "print";
  if (viewId === "airpad") return "airpad";
  return viewId || "viewer";
};
const selectMessageTypeForView = (view, incomingType) => {
  const checks = [incomingType, ...VIEW_MESSAGE_FALLBACKS[view.id] || []];
  for (const type of checks) {
    if (!type) continue;
    if (!view.canHandleMessage || view.canHandleMessage(type)) {
      return type;
    }
  }
  return null;
};
const toViewMessage = (view, message) => {
  const selectedType = selectMessageTypeForView(view, message.type);
  if (!selectedType) return null;
  return {
    type: selectedType,
    data: message.data,
    metadata: message.metadata
  };
};
function bindViewReceiveChannel(view, options = {}) {
  if (!view.handleMessage) {
    return () => {
    };
  }
  const destination = options.destination || inferDestination(String(view.id || ""));
  const componentId = options.componentId || `view:${view.id}`;
  const handler = {
    canHandle: (message) => message.destination === destination,
    handle: async (message) => {
      const mapped = toViewMessage(view, message);
      if (!mapped) return;
      await view.handleMessage?.(mapped);
    }
  };
  registerComponent(componentId, destination);
  registerHandler(destination, handler);
  const pending = initializeComponent(componentId);
  if (pending.length > 0) {
    for (const message of pending) {
      void handler.handle(message);
    }
  }
  return () => {
    unregisterHandler(destination, handler);
  };
}

class ShellRegistryClass {
  shells = /* @__PURE__ */ new Map();
  loadedShells = /* @__PURE__ */ new Map();
  /**
   * Register a shell
   */
  register(registration) {
    this.shells.set(registration.id, registration);
  }
  /**
   * Get a shell registration
   */
  get(id) {
    return this.shells.get(id);
  }
  /**
   * Get all registered shells
   */
  getAll() {
    return Array.from(this.shells.values());
  }
  /**
   * Load and instantiate a shell
   */
  async load(id, container) {
    const cached = this.loadedShells.get(id);
    if (cached) {
      return cached;
    }
    const registration = this.shells.get(id);
    if (!registration) {
      throw new Error(`Shell not found: ${id}`);
    }
    const module = await registration.loader();
    const factory = module.default || module.createShell;
    if (typeof factory !== "function") {
      throw new Error(`Invalid shell module: ${id}`);
    }
    const shell = factory(container);
    this.loadedShells.set(id, shell);
    return shell;
  }
  /**
   * Unload a shell
   */
  unload(id) {
    const shell = this.loadedShells.get(id);
    if (shell) {
      shell.unmount();
      this.loadedShells.delete(id);
    }
  }
  /**
   * Check if a shell is loaded
   */
  isLoaded(id) {
    return this.loadedShells.has(id);
  }
  /**
   * Get a loaded shell instance
   */
  getLoaded(id) {
    return this.loadedShells.get(id);
  }
}
const ShellRegistry = new ShellRegistryClass();
class ViewRegistryClass {
  views = /* @__PURE__ */ new Map();
  loadedViews = /* @__PURE__ */ new Map();
  viewReceiveCleanup = /* @__PURE__ */ new Map();
  /**
   * Register a view
   */
  register(registration) {
    this.views.set(registration.id, registration);
  }
  /**
   * Get a view registration
   */
  get(id) {
    return this.views.get(id);
  }
  /**
   * Get all registered views
   */
  getAll() {
    return Array.from(this.views.values());
  }
  /**
   * Load and instantiate a view
   */
  async load(id, options) {
    const cached = this.loadedViews.get(id);
    if (cached && !options) {
      return cached;
    }
    const registration = this.views.get(id);
    if (!registration) {
      throw new Error(`View not found: ${id}`);
    }
    const module = await registration.loader();
    const factory = module.default || module.createView;
    if (typeof factory !== "function") {
      throw new Error(`Invalid view module: ${id}`);
    }
    const view = await factory(options);
    const previousCleanup = this.viewReceiveCleanup.get(id);
    if (previousCleanup) {
      previousCleanup();
      this.viewReceiveCleanup.delete(id);
    }
    this.loadedViews.set(id, view);
    this.viewReceiveCleanup.set(id, bindViewReceiveChannel(view, {
      destination: String(id),
      componentId: `view:${id}`
    }));
    return view;
  }
  /**
   * Unload a view (clear cache)
   */
  unload(id) {
    const view = this.loadedViews.get(id);
    if (view?.lifecycle?.onUnmount) {
      view.lifecycle.onUnmount();
    }
    const receiveCleanup = this.viewReceiveCleanup.get(id);
    if (receiveCleanup) {
      receiveCleanup();
      this.viewReceiveCleanup.delete(id);
    }
    this.loadedViews.delete(id);
  }
  /**
   * Check if a view is loaded
   */
  isLoaded(id) {
    return this.loadedViews.has(id);
  }
  /**
   * Get a loaded view instance
   */
  getLoaded(id) {
    return this.loadedViews.get(id);
  }
}
const ViewRegistry = new ViewRegistryClass();
function registerDefaultShells() {
  ShellRegistry.register({
    id: "base",
    name: "Base",
    description: "Base shell with no frames or navigation",
    loader: () => __vitePreload(() => import('./index5.js'),true              ?[]:void 0,import.meta.url)
  });
  ShellRegistry.register({
    id: "minimal",
    name: "Minimal",
    description: "Minimal toolbar-based navigation",
    loader: () => __vitePreload(() => import('./index6.js'),true              ?[]:void 0,import.meta.url)
  });
  ShellRegistry.register({
    id: "faint",
    name: "Faint",
    description: "Experimental tabbed interface with sidebar",
    loader: () => __vitePreload(() => import('./index7.js'),true              ?[]:void 0,import.meta.url)
  });
}
function registerDefaultViews() {
  ViewRegistry.register({
    id: "viewer",
    name: "Viewer",
    icon: "eye",
    loader: () => __vitePreload(() => import('./index9.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "workcenter",
    name: "Work Center",
    icon: "lightning",
    loader: () => __vitePreload(() => import('./index15.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "settings",
    name: "Settings",
    icon: "gear",
    loader: () => __vitePreload(() => import('./index16.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "history",
    name: "History",
    icon: "clock-counter-clockwise",
    loader: () => __vitePreload(() => import('./index10.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "explorer",
    name: "Explorer",
    icon: "folder",
    loader: () => __vitePreload(() => import('./index11.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "airpad",
    name: "Airpad",
    icon: "hand-pointing",
    loader: () => __vitePreload(() => import('./index12.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "editor",
    name: "Editor",
    icon: "pencil",
    loader: () => __vitePreload(() => import('./index13.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "home",
    name: "Home",
    icon: "house",
    loader: () => __vitePreload(() => import('./index14.js'),true              ?[]:void 0,import.meta.url)
  });
  ViewRegistry.register({
    id: "print",
    name: "Print",
    icon: "printer",
    loader: () => __vitePreload(() => import('./index2.js'),true              ?[]:void 0,import.meta.url)
  });
}
const defaultTheme = {
  id: "auto",
  name: "Auto",
  colorScheme: "auto"
};
const lightTheme = {
  id: "light",
  name: "Light",
  colorScheme: "light"
};
const darkTheme = {
  id: "dark",
  name: "Dark",
  colorScheme: "dark"
};
function initializeRegistries() {
  registerDefaultShells();
  registerDefaultViews();
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

const mapEntriesFrom = (source) => {
  if (!source) return [];
  if (source instanceof Map) return Array.from(source.entries());
  if (Array.isArray(source)) {
    return source.map((value, index) => {
      if (Array.isArray(value) && value.length === 2) {
        return value;
      }
      return [index, value];
    });
  }
  if (source instanceof Set) {
    return Array.from(source.values()).map((value, index) => [index, value]);
  }
  if (typeof source === "object") {
    return Object.entries(source);
  }
  return [];
};
const ownProp = Object.prototype.hasOwnProperty;
const isPlainObject = (value) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  return !(value instanceof Map) && !(value instanceof Set);
};
const identityOf = (value, fallback) => {
  if (value && typeof value === "object") {
    if ("id" in value && value.id != null) return value.id;
    if ("key" in value && value.key != null) return value.key;
  }
  return fallback;
};
const resolveEntryKey = (entryKey, value, fallback) => {
  if (entryKey != null) return entryKey;
  const identity = identityOf(value);
  if (identity != null) return identity;
  return fallback;
};
const mergePlainObject = (target, source) => {
  for (const key of Object.keys(source)) {
    const nextValue = source[key];
    const currentValue = target[key];
    if (isPlainObject(currentValue) && isPlainObject(nextValue)) {
      mergePlainObject(currentValue, nextValue);
      continue;
    }
    if (currentValue !== nextValue) {
      target[key] = nextValue;
    }
  }
  return target;
};
const mergeValue = (target, source) => {
  if (target === source) return target;
  const sourceIsObject = source && typeof source === "object";
  if (target instanceof Map && sourceIsObject) {
    reloadInto(target, source);
    return target;
  }
  if (target instanceof Set && sourceIsObject) {
    reloadInto(target, source);
    return target;
  }
  if (Array.isArray(target) && sourceIsObject) {
    reloadInto(target, source);
    return target;
  }
  if (isPlainObject(target) && isPlainObject(source)) {
    mergePlainObject(target, source);
    return target;
  }
  return source;
};
const reloadInto = (items, map) => {
  if (!items || !map) return items;
  const entries = mapEntriesFrom(map);
  if (!entries.length) return items;
  if (items instanceof Set) {
    const existingByKey = /* @__PURE__ */ new Map();
    for (const value of items.values()) {
      const key = identityOf(value);
      if (key != null) existingByKey.set(key, value);
    }
    const usedKeys = /* @__PURE__ */ new Set();
    for (const [entryKey, incoming] of entries) {
      const key = resolveEntryKey(entryKey, incoming);
      if (key == null) {
        if (!items.has(incoming)) items.add(incoming);
        continue;
      }
      const hasCurrent = existingByKey.has(key);
      const current = hasCurrent ? existingByKey.get(key) : void 0;
      if (hasCurrent) {
        const merged = mergeValue(current, incoming);
        if (merged !== current) {
          items.delete(current);
          items.add(merged);
          existingByKey.set(key, merged);
        }
      } else {
        items.add(incoming);
        existingByKey.set(key, incoming);
      }
      usedKeys.add(key);
    }
    if (usedKeys.size) {
      for (const value of Array.from(items.values())) {
        const key = identityOf(value);
        if (key != null && !usedKeys.has(key)) {
          items.delete(value);
        }
      }
    }
    return items;
  }
  if (items instanceof Map) {
    const nextMap = new Map(entries);
    for (const key of Array.from(items.keys())) {
      if (!nextMap.has(key)) items.delete(key);
    }
    for (const [key, incoming] of nextMap.entries()) {
      if (items.has(key)) {
        const current = items.get(key);
        const merged = mergeValue(current, incoming);
        if (merged !== current) items.set(key, merged);
      } else {
        items.set(key, incoming);
      }
    }
    return items;
  }
  if (Array.isArray(items)) {
    const availableIndexes = /* @__PURE__ */ new Set();
    const existingByKey = /* @__PURE__ */ new Map();
    const existingByObject = /* @__PURE__ */ new WeakMap();
    items.forEach((value, index) => {
      availableIndexes.add(index);
      const key = identityOf(value, index);
      if (key != null && !existingByKey.has(key)) {
        existingByKey.set(key, index);
      }
      if (value && typeof value === "object") {
        existingByObject.set(value, index);
      }
    });
    const takeIndex = (index) => {
      if (index == null) return void 0;
      if (!availableIndexes.has(index)) return void 0;
      availableIndexes.delete(index);
      return index;
    };
    const takeNextAvailable = () => {
      const iterator = availableIndexes.values().next();
      if (iterator.done) return void 0;
      const index = iterator.value;
      availableIndexes.delete(index);
      return index;
    };
    let writeIndex = 0;
    let fallbackIndex = 0;
    for (const [entryKey, incoming] of entries) {
      const key = resolveEntryKey(entryKey, incoming, fallbackIndex++);
      let claimedIndex = takeIndex(key != null ? existingByKey.get(key) : void 0);
      if (claimedIndex == null && incoming && typeof incoming === "object") {
        claimedIndex = takeIndex(existingByObject.get(incoming));
      }
      if (claimedIndex == null) {
        claimedIndex = takeNextAvailable();
      }
      const current = claimedIndex != null ? items[claimedIndex] : void 0;
      const merged = current !== void 0 ? mergeValue(current, incoming) : incoming;
      if (writeIndex < items.length) {
        if (items[writeIndex] !== merged) items[writeIndex] = merged;
      } else {
        items.push(merged);
      }
      writeIndex++;
    }
    while (items.length > writeIndex) items.pop();
    return items;
  }
  if (typeof items === "object") {
    const nextKeys = new Set(entries.map(([key]) => String(key)));
    for (const prop of Object.keys(items)) {
      if (!nextKeys.has(prop)) delete items[prop];
    }
    for (const [entryKey, incoming] of entries) {
      const prop = String(entryKey);
      if (ownProp.call(items, prop)) {
        const current = items[prop];
        const merged = mergeValue(current, incoming);
        if (merged !== current) items[prop] = merged;
      } else {
        items[prop] = incoming;
      }
    }
    return items;
  }
  return items;
};
const mergeByKey = (items, key = "id") => {
  if (items && (items instanceof Set || Array.isArray(items))) {
    const entries = Array.from(items?.values?.() || []).map((I) => [I?.[key], I]).filter((I) => I?.[0] != null);
    return reloadInto(items, new Map(entries));
  }
  return items;
};
const hasChromeStorage = () => typeof chrome !== "undefined" && chrome?.storage?.local;
const makeUIState = (storageKey, initialCb, unpackCb, packCb = (items) => safe(items), key = "id", saveInterval = 6e3) => {
  let state = null;
  state = mergeByKey(initialCb?.() || {}, key);
  if (hasChromeStorage()) {
    chrome.storage.local.get([storageKey], (result) => {
      if (result[storageKey]) {
        const unpacked = unpackCb(JSOX.parse(result?.[storageKey] || "{}"));
        reloadInto(state, unpacked);
      }
    });
  } else if (typeof localStorage !== "undefined") {
    if (localStorage.getItem(storageKey)) {
      state = unpackCb(JSOX.parse(localStorage.getItem(storageKey) || "{}"));
      mergeByKey(state, key);
    } else {
      localStorage.setItem(storageKey, JSOX.stringify(packCb(state)));
    }
  }
  const saveInStorage = (ev) => {
    const packed = JSOX.stringify(packCb(mergeByKey(state, key)));
    if (hasChromeStorage()) {
      chrome.storage.local.set({ [storageKey]: packed });
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(storageKey, packed);
    }
  };
  setIdleInterval(saveInStorage, saveInterval);
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const listening = [
      addEvent(document, "visibilitychange", (ev) => {
        if (document.visibilityState === "hidden") {
          saveInStorage();
        }
      }),
      addEvent(window, "beforeunload", (ev) => saveInStorage()),
      addEvent(window, "pagehide", (ev) => saveInStorage()),
      // Standard storage event for localStorage
      addEvent(window, "storage", (ev) => {
        if (ev.storageArea == localStorage && ev.key == storageKey) {
          reloadInto(state, unpackCb(JSOX.parse(ev?.newValue || JSOX.stringify(packCb(mergeByKey(state, key))))));
        }
      })
    ];
    addToCallChain(state, Symbol.dispose, () => listening.forEach((ub) => ub?.()));
  }
  if (hasChromeStorage()) {
    const listener = (changes, area) => {
      if (area === "local" && changes[storageKey]) {
        const newValue = changes[storageKey].newValue;
        if (newValue) {
          reloadInto(state, unpackCb(JSOX.parse(newValue)));
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
  }
  if (state && typeof state === "object") {
    try {
      Object.defineProperty(state, "$save", {
        value: saveInStorage,
        configurable: true,
        enumerable: false,
        writable: true
      });
    } catch (e) {
      state.$save = saveInStorage;
    }
  }
  return state;
};

const STORAGE_KEY = "cw::workspace::speed-dial";
const META_STORAGE_KEY = `${STORAGE_KEY}::meta`;
const fallbackClone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(safe(value));
  }
  return JSOX.parse(JSOX.stringify(value));
};
const generateItemId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sd-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e3)}`;
};
const EXTERNAL_SHORTCUTS = [
  {
    id: "shortcut-docs",
    cell: observe([0, 1]),
    icon: "book-open-text",
    label: "Docs",
    action: "open-link",
    meta: { href: "https://github.com/fest-live", description: "Project documentation" }
  },
  {
    id: "shortcut-roadmap",
    cell: observe([1, 1]),
    icon: "signpost",
    label: "Roadmap",
    action: "open-link",
    meta: { href: "https://github.com/u2re-space/unite-2.man", description: "Manifest notes" }
  },
  {
    id: "shortcut-fest-live",
    cell: observe([2, 1]),
    icon: "github-logo",
    label: "Fest Live",
    action: "open-link",
    meta: { href: "https://github.com/fest-live", description: "Fest Live Organization" }
  },
  {
    id: "shortcut-l2ne-dev",
    cell: observe([3, 1]),
    icon: "user",
    label: "L2NE Dev",
    action: "open-link",
    meta: { href: "https://github.com/L2NE-dev", description: "L2NE Developer Profile" }
  },
  {
    id: "shortcut-u2re-space",
    cell: observe([0, 2]),
    icon: "planet",
    label: "U2RE Space",
    action: "open-link",
    meta: { href: "https://github.com/u2re-space/", description: "U2RE Space Organization" }
  },
  {
    id: "shortcut-telegram",
    cell: observe([1, 2]),
    icon: "telegram-logo",
    label: "Telegram",
    action: "open-link",
    meta: { href: "https://t.me/u2re_space", description: "U2RE Space Telegram" }
  }
];
const DEFAULT_SPEED_DIAL_DATA = [
  {
    id: "shortcut-explorer",
    cell: observe([2, 0]),
    icon: "books",
    label: "Explorer",
    action: "open-view",
    meta: { view: "explorer" }
  },
  {
    id: "shortcut-settings",
    cell: observe([3, 0]),
    icon: "gear-six",
    label: "Settings",
    action: "open-view",
    meta: { view: "settings" }
  },
  ...EXTERNAL_SHORTCUTS
];
const splitDefaultEntries = (entries) => {
  const records = [];
  const metaEntries = [];
  entries.forEach((entry) => {
    const { meta, ...record } = entry;
    records.push(record);
    const normalizedMeta = { action: entry.action, ...meta || {} };
    metaEntries.push([entry.id, normalizedMeta]);
  });
  return { records, metaEntries };
};
const { records: DEFAULT_SPEED_DIAL_RECORDS, metaEntries: DEFAULT_META_ENTRIES } = splitDefaultEntries(DEFAULT_SPEED_DIAL_DATA);
const legacyMetaBuffer = [];
const ensureCell = (cell) => {
  if (cell && Array.isArray(cell) && cell.length >= 2) {
    return observe([Number(cell[0]) || 0, Number(cell[1]) || 0]);
  }
  return observe([0, 0]);
};
const createMetaState = (meta = {}) => {
  return makeObjectAssignable(observe({
    action: meta.action || "open-view",
    view: meta.view || "",
    href: meta.href || "",
    description: meta.description || "",
    entityType: meta.entityType || "",
    tags: Array.isArray(meta.tags) ? [...meta.tags] : [],
    ...meta
  }));
};
const registryFromEntries = (entries) => {
  const registry = /* @__PURE__ */ new Map();
  for (const [id, meta] of entries) {
    registry.set(id, createMetaState(meta));
  }
  return registry;
};
const normalizeMetaEntries = (raw) => {
  if (!raw) return [];
  if (raw instanceof Map) {
    return Array.from(raw.entries());
  }
  if (Array.isArray(raw)) {
    return raw.map((entry) => {
      if (entry && typeof entry === "object" && "id" in entry) {
        return [entry.id, entry.meta || entry];
      }
      return null;
    }).filter(Boolean);
  }
  if (typeof raw === "object") {
    return Object.entries(raw);
  }
  return [];
};
const packMetaRegistry = (registry) => {
  const payload = {};
  registry?.forEach((meta, id) => {
    payload[id] = fallbackClone(meta ?? {});
  });
  return payload;
};
const createInitialMetaRegistry = () => registryFromEntries(DEFAULT_META_ENTRIES);
const unpackMetaRegistry = (raw) => {
  const entries = normalizeMetaEntries(raw);
  return registryFromEntries(entries.length ? entries : DEFAULT_META_ENTRIES);
};
const unwrapRef = (value, fallback) => {
  if (value && typeof value === "object" && "value" in value) {
    return value.value ?? fallback;
  }
  return value ?? fallback;
};
const serializeItemState = (item) => {
  return {
    id: item.id,
    cell: observe([item.cell?.[0] ?? 0, item.cell?.[1] ?? 0]),
    icon: unwrapRef(item.icon, "sparkle"),
    label: unwrapRef(item.label, "Shortcut"),
    action: item.action
  };
};
const createStatefulItem = (config) => {
  return observe({
    id: config.id || generateItemId(),
    cell: observe(ensureCell(config.cell)),
    icon: stringRef(config.icon || "sparkle"),
    label: stringRef(config.label || "Shortcut"),
    action: config.action || "open-view"
  });
};
const createInitialState = () => observe(DEFAULT_SPEED_DIAL_RECORDS.map(createStatefulItem));
const unpackState = (raw) => {
  const source = Array.isArray(raw) && raw.length ? raw : DEFAULT_SPEED_DIAL_DATA;
  const records = source.map((entry) => {
    const { meta, ...record } = entry;
    if (meta) {
      legacyMetaBuffer.push([entry.id, { action: entry.action, ...meta }]);
    } else {
      legacyMetaBuffer.push([entry.id, { action: entry.action }]);
    }
    return record;
  });
  return observe(records.map(createStatefulItem));
};
const packState = (collection) => collection.map(serializeItemState);
const speedDialMeta = makeUIState(META_STORAGE_KEY, createInitialMetaRegistry, unpackMetaRegistry, packMetaRegistry);
const speedDialItems = makeUIState(STORAGE_KEY, createInitialState, unpackState, packState);
const persistSpeedDialItems = () => speedDialItems?.$save?.();
const persistSpeedDialMeta = () => speedDialMeta?.$save?.();
const getSpeedDialMeta = (id) => {
  if (!id) return null;
  return speedDialMeta?.get?.(id) ?? null;
};
const ensureSpeedDialMeta = (id, defaults = {}) => {
  let meta = speedDialMeta?.get?.(id);
  if (!meta) {
    meta = createMetaState(defaults);
    speedDialMeta?.set?.(id, meta);
    persistSpeedDialMeta();
  }
  if (defaults?.action && meta.action !== defaults.action) {
    meta.action = defaults.action;
  }
  return meta;
};
const syncMetaActionFromItem = (item) => {
  if (!item) return false;
  const desiredAction = item.action || "open-view";
  const meta = ensureSpeedDialMeta(item.id, { action: desiredAction });
  if (meta.action !== desiredAction) {
    meta.action = desiredAction;
    return true;
  }
  return false;
};
const syncMetaActionsForAllItems = () => {
  let changed = false;
  speedDialItems?.forEach?.((item) => {
    if (syncMetaActionFromItem(item)) {
      changed = true;
    }
  });
  if (changed) {
    persistSpeedDialMeta();
  }
};
const flushLegacyMetaBuffer = () => {
  if (!legacyMetaBuffer.length) return;
  legacyMetaBuffer.forEach(([id, meta]) => {
    const target = ensureSpeedDialMeta(id, meta);
    Object.assign(target, meta);
  });
  legacyMetaBuffer.length = 0;
  persistSpeedDialMeta();
};
flushLegacyMetaBuffer();
syncMetaActionsForAllItems();
const ensureExternalShortcuts = () => {
  let changed = false;
  EXTERNAL_SHORTCUTS.forEach((shortcut) => {
    const exists = speedDialItems?.find?.((item) => item?.id === shortcut.id);
    if (!exists) {
      const item = createStatefulItem(shortcut);
      if (shortcut.label && item.label && typeof item.label === "object" && "value" in item.label) {
        item.label.value = shortcut.label;
      }
      if (shortcut.icon && item.icon && typeof item.icon === "object" && "value" in item.icon) {
        item.icon.value = shortcut.icon;
      }
      speedDialItems.push(observe(item));
      ensureSpeedDialMeta(item.id, shortcut.meta);
      changed = true;
    } else {
      const currentMeta = getSpeedDialMeta(shortcut.id);
      if (shortcut.meta && currentMeta) {
        if (shortcut.meta.href !== currentMeta.href) {
          currentMeta.href = shortcut.meta.href;
          changed = true;
        }
        if (shortcut.meta.description !== currentMeta.description) {
          currentMeta.description = shortcut.meta.description;
          changed = true;
        }
      } else if (shortcut.meta && !currentMeta) {
        ensureSpeedDialMeta(shortcut.id, shortcut.meta);
        changed = true;
      }
    }
  });
  if (changed) {
    persistSpeedDialItems();
    persistSpeedDialMeta();
  }
};
ensureExternalShortcuts();
const WALLPAPER_KEY = "cw::workspace::wallpaper";
makeUIState(WALLPAPER_KEY, () => observe({
  src: "./assets/imgs/test.webp",
  opacity: 1,
  blur: 0
}), (raw) => observe(raw || {
  src: "./assets/imgs/test.webp",
  opacity: 1,
  blur: 0
}), (state) => ({ ...state }));
const GRID_LAYOUT_KEY = "cw::workspace::grid-layout";
const gridLayoutState = makeUIState(GRID_LAYOUT_KEY, () => observe({
  columns: 4,
  rows: 8,
  shape: "square"
}), (raw) => observe(raw || {
  columns: 4,
  rows: 8,
  shape: "square"
}), (state) => ({ ...state }));
const persistGridLayout = () => gridLayoutState?.$save?.();
const applyGridSettings = (settings) => {
  const gridConfig = settings?.grid || gridLayoutState;
  const columns = gridConfig?.columns ?? 4;
  const rows = gridConfig?.rows ?? 8;
  const shape = gridConfig?.shape ?? "square";
  if (gridLayoutState) {
    gridLayoutState.columns = columns;
    gridLayoutState.rows = rows;
    gridLayoutState.shape = shape;
    persistGridLayout();
  }
  document.querySelectorAll(".speed-dial-grid").forEach((grid) => {
    const el = grid;
    el.dataset.gridColumns = String(columns);
    el.dataset.gridRows = String(rows);
    el.dataset.gridShape = shape;
  });
  document.documentElement.dataset.gridColumns = String(columns);
  document.documentElement.dataset.gridRows = String(rows);
  document.documentElement.dataset.gridShape = shape;
};
if (typeof window !== "undefined") {
  requestAnimationFrame(() => applyGridSettings());
}

const resolveColorScheme = (theme) => {
  if (theme === "dark" || theme === "light") return theme;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};
const resolveFontSize = (size) => {
  switch (size) {
    case "small":
      return "14px";
    case "large":
      return "18px";
    case "medium":
    default:
      return "16px";
  }
};
const applyTheme = (settings) => {
  const root = document.documentElement;
  const theme = settings.appearance?.theme || "auto";
  const resolvedScheme = resolveColorScheme(theme);
  root.setAttribute("data-scheme", theme);
  root.setAttribute("data-theme", resolvedScheme);
  root.style.colorScheme = resolvedScheme;
  root.style.fontSize = resolveFontSize(settings.appearance?.fontSize);
  if (settings.appearance?.color) {
    document.body.style.setProperty("--current", settings.appearance.color);
    document.body.style.setProperty("--primary", settings.appearance.color);
    root.style.setProperty("--current", settings.appearance.color);
    root.style.setProperty("--primary", settings.appearance.color);
  }
  if (settings.grid) {
    applyGridSettings(settings);
  }
};

const styles = "@layer ux-normalize,\n    ux-tokens,\n    ux-base,\n    ux-layout,\n    ux-components,\n    ux-utilities,\n    ux-theme,\n    ux-overrides;@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@function --get-oriented-size-num(--orient <number>: 0, --osx <number>: 0, --osy <number>: 0, --axis-to-return <number>: 0 ) returns <number>{--go-orient:round(nearest,var(--orient,0),1);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary:var(--osx,0);--go-secondary:var(--osy,0);--go-inline:calc(var(--go-primary) * var(--go-swap-inline) + var(--go-secondary) * var(--go-swap));--go-block:calc(var(--go-secondary) * var(--go-swap-inline) + var(--go-primary) * var(--go-swap));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-size(--orient <number>: 0, --osx <length-percentage>: 0px, --osy <length-percentage>: 0px, --axis-to-return <number>: 0 ) returns <length-percentage>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary:var(--osx,0px);--go-secondary:var(--osy,0px);--go-inline:calc(var(--go-primary) * var(--go-swap-inline) + var(--go-secondary) * var(--go-swap));--go-block:calc(var(--go-secondary) * var(--go-swap-inline) + var(--go-primary) * var(--go-swap));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-vector(--orient <number>: 0, --osx <length-percentage>: 0px, --osy <length-percentage>: 0px, --axis-to-return <number>: 0 ) returns <length-percentage>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary-direct:var(--ocx,0px);--go-secondary-direct:var(--ocy,0px);--go-inline-direct:calc(var(--go-primary-direct) * var(--go-swap-inline) + var(--go-secondary-direct) * var(--go-swap));--go-block-direct:calc(var(--go-secondary-direct) * var(--go-swap-inline) + var(--go-primary-direct) * var(--go-swap));--go-inline-inverted:calc(0px - var(--go-inline-direct));--go-block-inverted:calc(0px - var(--go-block-direct));--go-rev-inline:clamp(0,calc(var(--go-orient) - 1),1);--go-rev-block:clamp(0,calc((1 - abs(calc(var(--go-orient) - 1.5))) * 2),1);--go-inline:calc(var(--go-inline-direct) * (1 - var(--go-rev-inline)) + var(--go-inline-inverted) * var(--go-rev-inline));--go-block:calc(var(--go-block-direct) * (1 - var(--go-rev-block)) + var(--go-block-inverted) * var(--go-rev-block));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-coord-num(--orient <number>: 0, --ocx <number>: 0, --ocy <number>: 0, --osx <number>: 0, --osy <number>: 0, --axis-to-return <number>: 0 ) returns <number>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary-direct:var(--ocx,0);--go-secondary-direct:var(--ocy,0);--go-primary-size:var(--osx,0);--go-secondary-size:var(--osy,0);--go-inline-direct:calc(var(--go-primary-direct) * var(--go-swap-inline) + var(--go-secondary-direct) * var(--go-swap));--go-block-direct:calc(var(--go-secondary-direct) * var(--go-swap-inline) + var(--go-primary-direct) * var(--go-swap));--go-inline-size:calc(var(--go-primary-size) * var(--go-swap-inline) + var(--go-secondary-size) * var(--go-swap));--go-block-size:calc(var(--go-secondary-size) * var(--go-swap-inline) + var(--go-primary-size) * var(--go-swap));--go-inline-inverted:calc(var(--go-inline-size, calc(var(--go-inline-direct) + var(--go-inline-direct))) - var(--go-inline-direct));--go-block-inverted:calc(var(--go-block-size, calc(var(--go-block-direct) + var(--go-block-direct))) - var(--go-block-direct));--go-rev-inline:clamp(0,calc(var(--go-orient) - 1),1);--go-rev-block:clamp(0,calc((1 - abs(calc(var(--go-orient) - 1.5))) * 2),1);--go-inline:calc(var(--go-inline-direct) * (1 - var(--go-rev-inline)) + var(--go-inline-inverted) * var(--go-rev-inline));--go-block:calc(var(--go-block-direct) * (1 - var(--go-rev-block)) + var(--go-block-inverted) * var(--go-rev-block));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-coordinate(--orient <number>: 0, --ocx <length-percentage>: 0px, --ocy <length-percentage>: 0px, --osx <length-percentage>: 0px, --osy <length-percentage>: 0px, --axis-to-return <number>: 0 ) returns <length-percentage>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary-direct:var(--ocx,0px);--go-secondary-direct:var(--ocy,0px);--go-primary-size:var(--osx,0px);--go-secondary-size:var(--osy,0px);--go-inline-direct:calc(var(--go-primary-direct) * var(--go-swap-inline) + var(--go-secondary-direct) * var(--go-swap));--go-block-direct:calc(var(--go-secondary-direct) * var(--go-swap-inline) + var(--go-primary-direct) * var(--go-swap));--go-inline-size:calc(var(--go-primary-size) * var(--go-swap-inline) + var(--go-secondary-size) * var(--go-swap));--go-block-size:calc(var(--go-secondary-size) * var(--go-swap-inline) + var(--go-primary-size) * var(--go-swap));--go-inline-inverted:calc(var(--go-inline-size, calc(var(--go-inline-direct) + var(--go-inline-direct))) - var(--go-inline-direct));--go-block-inverted:calc(var(--go-block-size, calc(var(--go-block-direct) + var(--go-block-direct))) - var(--go-block-direct));--go-rev-inline:clamp(0,calc(var(--go-orient) - 1),1);--go-rev-block:clamp(0,calc((1 - abs(calc(var(--go-orient) - 1.5))) * 2),1);--go-inline:calc(var(--go-inline-direct) * (1 - var(--go-rev-inline)) + var(--go-inline-inverted) * var(--go-rev-inline));--go-block:calc(var(--go-block-direct) * (1 - var(--go-rev-block)) + var(--go-block-inverted) * var(--go-rev-block));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@property --value{syntax:\"<number>\";initial-value:0;inherits:true}@property --relate{syntax:\"<number>\";initial-value:0;inherits:true}@property --drag-x{syntax:\"<number>\";initial-value:0;inherits:false}@property --drag-y{syntax:\"<number>\";initial-value:0;inherits:false}@property --order{syntax:\"<integer>\";initial-value:1;inherits:true}@property --content-inline-size{syntax:\"<length-percentage>\";initial-value:100%;inherits:true}@property --content-block-size{syntax:\"<length-percentage>\";initial-value:100%;inherits:true}@property --icon-size{syntax:\"<length-percentage>\";initial-value:16px;inherits:true}@property --icon-color{syntax:\"<color>\";initial-value:#0000;inherits:true}@property --icon-padding{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@property --icon-image{syntax:\"<image>\";initial-value:linear-gradient(#0000,#0000);inherits:true}@function --wavy-step(--step <number>){--angle:calc((var(--step, 0) * 2) * 1rad * pi);--variant:calc(cos(var(--clip-freq, 8) * var(--angle, 0deg)) * 0.5 + 0.5);--adjust:calc(var(--variant, 0) * var(--clip-amplitude, 0));--x:calc(50% + (cos(var(--angle, 0deg)) * (0.5 - var(--adjust, 0))) * var(--icon-size, 100%));--y:calc(50% + (sin(var(--angle, 0deg)) * (0.5 - var(--adjust, 0))) * var(--icon-size, 100%));result:var(--x) var(--y)}@layer tokens, base, layout, utilities, shells, shell, views, view, viewer, components, markdown, essentials, overrides;@layer tokens{:where(:root,html){color-scheme:light dark;tab-size:4;text-size-adjust:100%;block-size:stretch;border:none;contain:strict;font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif);font-size:16px;inline-size:stretch;line-height:1.5;margin:0;max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi));min-block-size:0;min-inline-size:0;overflow:hidden;padding:0}}@layer base{@keyframes J{0%{opacity:0;transform:translateY(10%)}to{opacity:1;transform:translateY(0)}}@media screen{*,:after,:before{box-sizing:border-box}:where(html){-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-family:var(--font-sans);font-size:16px;line-height:1.5;text-rendering:optimizeLegibility}:where(body){background:var(--color-bg);block-size:fit-content;border:none;color:var(--color-text);inset:0;line-height:var(--line-height);margin:0;min-block-size:min(100dvb,100cqb);padding:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}:where(ul,ol){list-style:none;margin:0;padding:0}:where(blockquote,q){quotes:none}:where(blockquote,q):after,:where(blockquote,q):before{content:none}:where(table){border:1px solid var(--color-border);border-collapse:collapse;border-radius:var(--border-radius);border-spacing:0;display:block;inline-size:max-content;margin-block:1rem;max-inline-size:100%;overflow-x:auto}:where(table) :where(th,td){border-block-end:1px solid var(--color-border);padding:.5rem 1rem;text-align:start}:where(table) :where(th){background-color:var(--color-table);color:var(--color-text);font-weight:700}:where(table) :where(tr:last-child td){border-block-end:none}:where(table) :where(tr:nth-child(2n)){background-color:var(--color-bg-secondary)}:focus-visible{border-radius:var(--radius-sm,8px);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-primary,#06c) 35%,#0000);outline:none}:focus:not(:focus-visible){outline:none}:where(button,input,optgroup,select,textarea){border:none;color:inherit;font:inherit;letter-spacing:inherit;line-height:1.15;margin:0;outline:none}:where(button){appearance:none;background:#0000;border:none;cursor:pointer;gap:.25rem;min-block-size:fit-content;min-inline-size:fit-content;padding-block:.5rem;padding-inline:1rem;pointer-events:auto;text-transform:none;user-select:none}:where(button):has(>ui-icon:only-child){aspect-ratio:1/1;place-content:center;place-items:center}:where(button):disabled{cursor:not-allowed;pointer-events:none}:where(select){text-transform:none}:where(button,[type=button],[type=reset],[type=submit]){-webkit-appearance:button;cursor:pointer}:where(button,[type=button],[type=reset],[type=submit])::-moz-focus-inner{border-style:none;padding:0}:where(fieldset,dialog){border:none;margin:0;padding:0}:where(legend){padding:0}:where(progress){vertical-align:initial}:where(textarea){overflow:auto;resize:vertical}:where([type=search]){-webkit-appearance:textfield;outline-offset:-2px}:where([type=search])::-webkit-search-decoration{-webkit-appearance:none}:where([type=range]){-webkit-appearance:none}:where(details>summary),:where(summary){cursor:pointer}:where(mark){background-color:initial;color:inherit}:where(sub,sup){font-size:75%;line-height:0;position:relative;vertical-align:initial}:where(sup){top:-.5em}:where(sub){bottom:-.25em}:where(a){color:var(--color-link,inherit);cursor:pointer;pointer-events:auto;text-decoration:inherit;text-underline-offset:.2em;transition:color var(--transition-fast)}:where(a):hover{color:var(--color-primary-hover)}:where(img,canvas,svg,video,iframe,picture){height:auto;max-width:100%}:where(img,video,canvas,svg,picture){block-size:auto;display:block;max-inline-size:100%}:where(img,video){object-fit:contain;object-position:center}:where(picture){display:contents}:where(iframe){block-size:auto;max-inline-size:100%}:where(em,i){font-style:normal}:where(strong,b){font-weight:400}:where(code,kbd,samp,pre){font-family:var(--font-family-mono,\"SF Mono\",\"Monaco\",\"Inconsolata\",\"Roboto Mono\",monospace);font-size:1em}:where(code,pre){font-family:var(--font-mono);font-size:.875em}:where(code,samp,kbd){background-color:var(--bgColor-muted);border-radius:.3em;font-family:var(--font-family-mono,\"SF Mono\",\"Monaco\",\"Roboto Mono\",monospace);font-size:85%;padding:.2em .4em}:where(code){background:var(--color-bg-alt);border-radius:var(--radius-sm);padding:.125em .25em}:where(pre){background:var(--color-bg-alt);border-radius:var(--radius-md);overflow-x:auto;padding:var(--space-md)}:where(pre) :where(code){background:#0000;border-radius:0;padding:0}:where(input,textarea,select,button,option){accent-color:var(--color-link,currentColor);border:0 #0000;font-variant-emoji:text;outline:0 none #0000}:where(span){font-variant-emoji:text}:where(hr){border:none;border-block-start:1px solid var(--color-border);margin-block:var(--space-lg)}::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-track{background:#0000}::-webkit-scrollbar-thumb{background:var(--color-outline-variant,#d1d5db);border-radius:4px}::-webkit-scrollbar-thumb:hover{background:var(--color-outline,#9ca3af)}*{scrollbar-color:var(--color-outline-variant,#d1d5db) #0000;scrollbar-width:thin}:where(input,textarea,select){background-color:var(--color-bg-alt);border:1px solid var(--color-border);border-radius:var(--border-radius);color:var(--color-fg);display:block;font-size:var(--font-size-base);inline-size:100%;padding:.5rem}:where(input,textarea,select):focus{border-color:var(--color-primary);outline:none}:where(input,textarea,select)::placeholder{color:var(--color-text-secondary);opacity:.7}:where(input,textarea,select):disabled{background-color:var(--color-bg-secondary);cursor:not-allowed;opacity:.5}:where(input):-webkit-autofill:first-line,:where(input):autofill:first-line{font-size:1em;text-size-adjust:100%}:where(input):-internal-autofill-previewed{letter-spacing:calc(1em / 10)!important}:where(input):is([type=radio],[type=checkbox]){accent-color:var(--color-primary);aspect-ratio:1/1;block-size:1rem;inline-size:1rem}:where(label){display:block;font-weight:600;margin-block-end:.25rem;pointer-events:none;user-select:none}:where(h1,h2,h3,h4,h5,h6){font-weight:600;line-height:1.2;margin-block:.5em;text-wrap:balance}:where(h1){font-size:2rem}:where(h2){font-size:1.5rem}:where(h3){font-size:1.25rem}:where(h4){font-size:1.125rem}:where(h5){font-size:1rem}:where(h6){font-size:.875rem}:where(p){margin-block:1em;text-wrap:pretty}:where(article,.content) ol,:where(article,.content) ul{margin-block:var(--space-md);padding-inline-start:var(--space-lg)}:where(article,.content) ul{list-style:disc}:where(article,.content) ol{list-style:decimal}:where(blockquote){border-inline-start:.25rem solid var(--color-secondary);color:var(--color-text-secondary);font-style:italic;margin-inline:1rem;padding-inline:1rem}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable){scrollbar-color:var(--color-scrollbar,currentColor) #0000;scrollbar-width:thin}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar{block-size:var(--scrollbar-size,8px);inline-size:var(--scrollbar-size,8px)}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar-track{background:#0000}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar-thumb{background-color:var(--color-scrollbar,currentColor);border-radius:var(--border-radius,4px)}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar-thumb:hover{background:var(--color-outline,#9ca3af)}:not(:defined),:where(link,head,script,style,meta),[hidden]{display:none!important}:not(:defined){opacity:0;pointer-events:none;visibility:collapse}:where(link,head,script,style,meta){pointer-events:none!important}[aria-hidden=true]{opacity:0;pointer-events:none;visibility:collapse}[data-dragging]{cursor:grabbing;will-change:transform}:where(a,button,[role=button]){-webkit-tap-highlight-color:transparent}}@media screen and (prefers-reduced-motion:reduce){*,:after,:before{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}@media screen{[data-scheme=dark],[data-theme=dark]{color-scheme:dark only}[data-scheme=light],[data-theme=light]{color-scheme:light only}[data-scheme=system],[data-theme=system]{color-scheme:light dark}}}@layer layout{@media screen{:where(footer,header,main){margin-inline:auto;padding:0}:where(header){text-align:center}:where(nav){align-items:center;display:flex;flex-wrap:wrap;justify-content:space-between;margin-block-end:0}:where(nav) ul{display:flex;gap:1rem;list-style:none;margin:0;padding:0}:where(nav) ul li{position:relative}:where(nav) a{color:var(--color-link);font-weight:700;text-decoration:none}:where(section){display:flex;flex-wrap:wrap;gap:1rem;justify-content:var(--justify-important,center)}:where(section) :where(aside){border:1px solid var(--color-bg-secondary);border-radius:var(--border-radius);box-shadow:var(--box-shadow);flex:1 1 var(--width-card);inline-size:var(--width-card);padding:1.25rem}}}@layer components{@media screen{:where(dialog){background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--border-radius);box-shadow:var(--box-shadow);color:var(--color-text);margin:auto;max-block-size:85vh;max-inline-size:min(90vw,600px);padding:1rem}:where(dialog)::backdrop{background-color:#00000080}:where(dialog)[open]{animation:J .25s ease-out}:where(button,input[type=submit],input[type=button]){align-items:center;background-color:var(--color-link);border:1px solid #0000;border-radius:var(--border-radius);cursor:pointer;display:inline-flex;font-weight:600;justify-content:center;padding:.5rem 1rem;transition:filter .2s ease,transform .1s ease}:where(button,input[type=submit],input[type=button]):disabled{background-color:var(--color-secondary);cursor:not-allowed;filter:none;opacity:.6}:where(canvas):is([is=ui-canvas]){block-size:stretch;border:none;box-sizing:border-box!important;inline-size:stretch;inset:0;margin:0;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:0;min-inline-size:0;object-fit:cover;object-position:center;padding:0;pointer-events:none;position:absolute;z-index:0}}}@layer ux-agate{@media screen{:host,:root,:scope,:where(body){pointer-events:auto;transition-behavior:allow-discrete;interpolate-size:allow-keywords;content-visibility:auto;--keyboard-inset-bottom:calc(max(env(keyboard-inset-bottom, 0px), 0px) / max(var(--zoom, 1), 0.125));--keyboard-inset-height:calc(max(env(keyboard-inset-height, 0px), 0px) / max(var(--zoom, 1), 0.125))}:host,:root,:scope{--scale:1;--translate-x:0px;--translate-y:0px}:host,:host :where(*),:root,:root :where(*),:scope,:scope :where(*){--scale:1;--translate-x:0px;--translate-y:0px}:root,:where(html){background-color:initial;block-size:stretch;border:0 #0000;contain:none;container-name:html root;container-type:size;display:flex;flex-direction:column;inline-size:stretch;inset:0;inset-block-end:auto;line-height:normal;margin:0;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:min(100cqb,100dvb);min-inline-size:min(100cqi,100dvi);outline:0 none #0000;overflow:visible;padding:0;place-content:start;place-items:start;place-self:start;position:fixed;transform:none;translate:none}:where(body){background-color:initial;block-size:stretch;border:0 #0000;contain:strict;container-name:body;container-type:size;display:inline-flex;font-size:var(--text-base,.9rem);inline-size:stretch;inset:auto;margin:0;max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi));min-block-size:0;min-inline-size:0;outline:0 none #0000;overflow:visible;padding:0;place-content:start;place-items:start;place-self:start;pointer-events:auto;position:relative;transform:none;translate:none}:where(body)>:where(#app,#container,#root,.root){block-size:stretch;inline-size:stretch;max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi));min-block-size:0;min-inline-size:0}:where(body)>:where(*){max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi))}}}@layer ux-existence{[data-hidden]:not([data-hidden=false]):not([data-opacity-animation]),[data-hidden]:not([data-hidden=false]):not([data-opacity-animation]) *{display:none!important;opacity:0;pointer-events:none!important;touch-action:none!important;visibility:collapse}:host([data-hidden]:not([data-hidden=false]:not([data-opacity-animation]))),:host([data-hidden]:not([data-hidden=false]:not([data-opacity-animation]))) *,:host([data-hidden]:not([data-hidden=false]:not([data-opacity-animation]))) ::slotted(*){display:none!important;opacity:0;pointer-events:none!important;touch-action:none!important;visibility:collapse}:host([data-hidden]:not([data-hidden=false])),:host([data-hidden]:not([data-hidden=false])) *,:host([data-hidden]:not([data-hidden=false])) ::slotted(*){pointer-events:none!important;touch-action:none!important;user-select:none!important}[data-hidden]:not([data-hidden=false]),[data-hidden]:not([data-hidden=false]) *{pointer-events:none!important;touch-action:none!important;user-select:none!important}}@property --item-size{syntax:\"<length-percentage>\";inherits:true;initial-value:100%}@layer ux-gridbox{.ui-gridlayout{--os-layout-c:var(--layout-c,4);--os-layout-r:var(--layout-r,8);--cs-layout-c:--get-oriented-size-num(var(--orient,0),var(--os-layout-c,4),var(--os-layout-r,8),0);--cs-layout-r:--get-oriented-size-num(var(--orient,0),var(--os-layout-c,4),var(--os-layout-r,8),1);--c-gap:clamp(min(1rem,8cqmin),min(calc(8cqmin / min(var(--layout-c, 4), var(--layout-r, 8))),calc(6cqmax / max(var(--layout-c, 4), var(--layout-r, 8)))),min(4rem,16cqmin));--r-gap:clamp(min(1rem,8cqmin),min(calc(8cqmin / min(var(--layout-c, 4), var(--layout-r, 8))),calc(6cqmax / max(var(--layout-c, 4), var(--layout-r, 8)))),min(4rem,16cqmin));background-color:initial;block-size:stretch;box-sizing:border-box!important;contain:none!important;container-name:u2-grid;container-type:normal!important;direction:ltr;display:grid!important;gap:0!important;grid-column:1/-1;grid-row:1/-1;grid-template-columns:repeat(round(nearest,var(--cs-layout-c,4),1),minmax(0,1fr))!important;grid-template-rows:repeat(round(nearest,var(--cs-layout-r,8),1),minmax(0,1fr))!important;inline-size:stretch;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;overflow:visible!important;padding:0!important;place-content:center!important;place-items:center!important;pointer-events:none!important;position:relative!important;text-align:center!important;zoom:1}.ui-gridlayout>:where(*){--cs-sw-unit-x:calc(var(--cs-size-x, 100cqi) / var(--cs-layout-c, 1));--cs-sw-unit-y:calc(var(--cs-size-y, 100cqb) / var(--cs-layout-r, 1))}.ui-gridlayout>:where(*){--cs-transition-c:0px;--cs-transition-r:0px}.ui-gridlayout>:where(*)[data-dragging]{--cs-transition-c:calc((var(--rv-grid-c, 0) - var(--cs-grid-c, 0)) * var(--cs-sw-unit-x, 1px));--cs-transition-r:calc((var(--rv-grid-r, 0) - var(--cs-grid-r, 0)) * var(--cs-sw-unit-y, 1px))}.ui-gridlayout>:where(*){--p-cell-x:var(--cell-x);--p-cell-y:var(--cell-y);--f-col:clamp(4,var(--layout-c,4),6);--f-row:clamp(6,var(--layout-r,8),12);--grid-c:clamp(0,var(--cell-x),var(--f-col) - 1);--grid-r:clamp(0,var(--cell-y),var(--f-row) - 1);--p-grid-c:clamp(0,var(--p-cell-x),var(--f-col) - 1);--p-grid-r:clamp(0,var(--p-cell-y),var(--f-row) - 1);--fc-cell-x:clamp(0,var(--cs-grid-c,0),var(--f-col) - 1);--fc-cell-y:clamp(0,var(--cs-grid-r,0),var(--f-row) - 1);--fp-cell-x:clamp(0,var(--cs-p-grid-c,0),var(--f-col) - 1);--fp-cell-y:clamp(0,var(--cs-p-grid-r,0),var(--f-row) - 1);--dir-x:calc(var(--cs-grid-c, 0) - var(--cs-p-grid-c, 0));--dir-y:calc(var(--cs-grid-r, 0) - var(--cs-p-grid-r, 0))}.ui-gridlayout>:where(*){--rv-grid-c:var(--cs-grid-c,1);--rv-grid-r:var(--cs-grid-r,1)}.ui-gridlayout>:where(*)[data-dragging]{--rv-grid-c:var(--cs-p-grid-c,1);--rv-grid-r:var(--cs-p-grid-r,1)}.ui-gridlayout>:where(*){--os-grid-c:var(--grid-c,1);--os-grid-r:var(--grid-r,1);--cs-grid-c:--get-oriented-coord-num(var(--orient,0),var(--os-grid-c,1),var(--os-grid-r,1),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),0);--cs-grid-r:--get-oriented-coord-num(var(--orient,0),var(--os-grid-c,1),var(--os-grid-r,1),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),1)}.ui-gridlayout>:where(*){--os-p-grid-c:var(--p-cell-x,0);--os-p-grid-r:var(--p-cell-y,0);--cs-p-grid-c:--get-oriented-coord-num(var(--orient,0),var(--os-p-grid-c,0),var(--os-p-grid-r,0),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),0);--cs-p-grid-r:--get-oriented-coord-num(var(--orient,0),var(--os-p-grid-c,0),var(--os-p-grid-r,0),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),1)}.ui-gridlayout>:where(*){--ox-c-unit:calc(var(--os-size-x, 100cqi) / var(--os-layout-c, 1));--ox-r-unit:calc(var(--os-size-y, 100cqb) / var(--os-layout-r, 1));--os-inset-x:calc((var(--grid-c, 1) + 0.5) * var(--ox-c-unit, 1px));--os-inset-y:calc((var(--grid-r, 1) + 0.5) * var(--ox-r-unit, 1px))}.ui-gridlayout>:where(*){--item-size:clamp(4rem,calc(100cqmax / min(var(--cs-layout-c, 4), var(--cs-layout-r, 8))),5rem)}.ui-gridlayout>:where(*) :where(*){--drag-x:0;--drag-y:0}.ui-gridlayout>:where(*){--drag-x:0;--cs-drag-x:calc(var(--drag-x, 0) * 1px);--drag-y:0;--cs-drag-y:calc(var(--drag-y, 0) * 1px)}.ui-gridlayout>:where(*) :active,.ui-gridlayout>:where(*):active,.ui-gridlayout>:where(*):has(:active){will-change:transform}.ui-gridlayout>:where(*){block-size:var(--item-size,stretch);cursor:pointer;grid-column:clamp(1,1 + round(nearest,var(--cs-grid-c,0),1),var(--cs-layout-c,4))!important;grid-row:clamp(1,1 + round(nearest,var(--cs-grid-r,0),1),var(--cs-layout-r,8))!important;inline-size:var(--item-size,stretch);inset:auto!important;max-block-size:var(--item-size,stretch);max-inline-size:var(--item-size,stretch);min-block-size:fit-content;min-inline-size:fit-content;place-self:center!important;pointer-events:none;position:relative!important;touch-action:none;transform:translate3d(round(nearest,var(--cs-drag-x,0) + var(--cs-transition-c,0),1px/var(--pixel-ratio,1)),round(nearest,var(--cs-drag-y,0) + var(--cs-transition-r,0),1px/var(--pixel-ratio,1)),0) scale3d(var(--scale,1),var(--scale,1),var(--scale,1)) translate3d(round(nearest,var(--translate-x,0),1px/var(--pixel-ratio,1)),round(nearest,var(--translate-y,0),1px/var(--pixel-ratio,1)),0)!important;transform-origin:50% 50%!important;translate:0 0 0!important;visibility:visible;z-index:1;zoom:1;-webkit-user-drag:none;-moz-user-drag:none;border:0 #0000;contain:none;isolation:isolate;outline:0 none #0000;overflow:visible;user-select:none}.ui-gridlayout>:where(*),.ui-gridlayout>:where(*) span,.ui-gridlayout>:where(*)>*{--drag-distance:clamp(0,hypot(var(--dir-x,0),var(--dir-y,0)),6);--drag-duration:clamp(96ms,calc(var(--drag-distance, 0) * 110ms + 70ms),360ms);background-image:none;border:0 #0000;box-shadow:none;filter:none;outline:0 none #0000;pointer-events:none;touch-action:none;transition-behavior:allow-discrete;transition-delay:0s;transition-duration:var(--drag-duration);transition-property:opacity,background-color,color;transition-timing-function:cubic-bezier(.22,.8,.3,1);user-select:none}.ui-gridlayout>:where(*){pointer-events:auto}.ui-gridlayout>:where(*) label,.ui-gridlayout>:where(*) span,.ui-gridlayout>:where(*) ui-icon,.ui-gridlayout>:where(*).label,.ui-gridlayout>:where(*).span,.ui-gridlayout>:where(*).ui-icon{pointer-events:none}.ui-gridlayout>:where(*) ui-icon{pointer-events:none}@media (prefers-reduced-motion:reduce){.ui-gridlayout>:where(*){transition-duration:0s;transition-timing-function:linear}}.ui-gridlayout>:where(*)>:where(*){block-size:stretch;grid-column:1/-1;grid-row:1/-1;inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:1px;min-inline-size:1px}.ui-gridlayout.sd-grid--labels,.ui-gridlayout[data-layer=labels]{isolation:isolate;mix-blend-mode:normal;pointer-events:none!important}.ui-gridlayout.sd-grid--labels>:where(*),.ui-gridlayout[data-layer=labels]>:where(*){pointer-events:none}.ui-gridlayout.sd-grid--labels>:where(.ui-ws-item-label),.ui-gridlayout[data-layer=labels]>:where(.ui-ws-item-label){align-items:center;block-size:stretch;color:color-mix(in oklch,var(--on-surface-color) 78%,#0000 22%);display:flex;flex-direction:column;font-size:clamp(.65rem,1.35cqmin,1rem);font-weight:500;gap:clamp(.1rem,.35cqmin,.35rem);inline-size:100%;justify-content:flex-start;letter-spacing:.015em;padding-block-start:clamp(.25rem,.65cqmin,.65rem);text-align:center;text-shadow:0 1px 2px color-mix(in oklch,var(--surface-color) 35%,#0000),0 0 .35rem color-mix(in oklch,var(--surface-color) 15%,#0000);text-wrap:balance;translate:0 calc(clamp(.25rem, .65cqmin, .65rem) + var(--cs-sw-unit-y, 0px))}.ui-gridlayout.sd-grid--labels>:where(.ui-ws-item-label) span,.ui-gridlayout[data-layer=labels]>:where(.ui-ws-item-label) span{background-image:none;contain:layout paint;content-visibility:auto;max-inline-size:min(8ch,100%);opacity:.9;pointer-events:none;touch-action:none;user-select:none}}@layer ux-orientbox{.ui-orientbox{--in-orient-base:round(nearest,var(--orient,0),1);--in-rev-cond-x:clamp(0,calc(var(--in-orient-base, 0) - 1),1);--in-rev-cond-y:clamp(0,calc((1 - abs(calc(var(--in-orient-base, 0) - 1.5))) * 2),1);--in-swap-cond:css-rem(var(--orient,0),2);--in-rev-vx:calc(var(--in-rev-cond-x, 1) * -2 + 1);--in-rev-vy:calc(var(--in-rev-cond-y, 1) * -2 + 1);--os-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqi),var(--cs-size-y,100cqb),0);--os-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqb),var(--cs-size-y,100cqi),1);--os-self-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),0);--os-self-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),1);--cs-inset-x:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),0);--cs-inset-y:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),1);--cs-drag-x:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),0);--cs-drag-y:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),1);--cs-size-x:100cqi;--cs-size-y:100cqb;background-color:initial;block-size:stretch;border-radius:var(--radius-lg);contain:strict!important;container-type:size!important;direction:ltr!important;font-size:16px;grid-column:1/-1;grid-row:1/-1;inline-size:stretch;inset:0;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:0;min-inline-size:0;place-self:start;pointer-events:none;position:relative;writing-mode:horizontal-tb!important;zoom:max(var(--zoom,1),.125);--zoom:max(var(--scaling,1),0.125);--zpx:calc(1px / max(var(--zoom, 1), 0.125));--ppx:calc(1px / max(var(--pixel-ratio, 1), 0.125))}.ui-orientbox :where(ui-frame,.u2-grid-item,ui-modal,[is=ui-orientbox],[is=ui-gridbox],[is=ui-orientbox]>:where(*),[is=ui-gridbox]>:where(*),.ui-gridlayout,.ui-gridlayout>:where(*)),.ui-orientbox>:where(*){--in-orient-base:round(nearest,var(--orient,0),1);--in-rev-cond-x:clamp(0,calc(var(--in-orient-base, 0) - 1),1);--in-rev-cond-y:clamp(0,calc((1 - abs(calc(var(--in-orient-base, 0) - 1.5))) * 2),1);--in-swap-cond:css-rem(var(--orient,0),2);--in-rev-vx:calc(var(--in-rev-cond-x, 1) * -2 + 1);--in-rev-vy:calc(var(--in-rev-cond-y, 1) * -2 + 1)}.ui-orientbox :where(ui-frame,.u2-grid-item,ui-modal,[is=ui-orientbox],[is=ui-gridbox],[is=ui-orientbox]>:where(*),[is=ui-gridbox]>:where(*),.ui-gridlayout,.ui-gridlayout>:where(*)),.ui-orientbox>:where(*){--os-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqi),var(--cs-size-y,100cqb),0);--os-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqb),var(--cs-size-y,100cqi),1);--os-self-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),0);--os-self-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),1)}.ui-orientbox :where(ui-frame,.u2-grid-item,ui-modal,[is=ui-orientbox],[is=ui-gridbox],[is=ui-orientbox]>:where(*),[is=ui-gridbox]>:where(*),.ui-gridlayout,.ui-gridlayout>:where(*)),.ui-orientbox>:where(*){--cs-inset-x:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),0);--cs-inset-y:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),1);--cs-drag-x:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),0);--cs-drag-y:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),1)}.ui-orientbox .center-self{inset:var(--cs-inset-y,0) auto auto var(--cs-inset-x,0);place-self:center;transform:translate3d(round(nearest,var(--cs-drag-x,0),1px/var(--pixel-ratio,1)),round(nearest,var(--cs-drag-y,0),1px/var(--pixel-ratio,1)),0) scale3d(var(--scale,1),var(--scale,1),var(--scale,1)) translate3d(round(nearest,calc(var(--translate-x, 0px) - 50%),1px/var(--pixel-ratio,1)),round(nearest,calc(var(--translate-y, 0px) - 50%),1px/var(--pixel-ratio,1)),0);transform-origin:0 0}.ui-orientbox .fixed{position:fixed!important}.ui-orientbox .absolute,.ui-orientbox .fixed{inset:var(--cs-inset-y,0) auto auto var(--cs-inset-x,0)}.ui-orientbox .absolute{position:absolute!important}.native-portrait-optimized{--in-swap-cond:0}@media (orientation:portrait){.native-portrait-optimized{--in-swap-cond:0}}@media (orientation:landscape){.native-portrait-optimized{--in-swap-cond:1}}}";

async function loadCoreStyles() {
  try {
    await loadAsAdopted(styles);
    console.log("[Veela/Core] Core styles loaded");
  } catch (e) {
    console.warn("[Veela/Core] Failed to load core styles:", e);
  }
}

const basicStyles = "@layer animations{@keyframes h{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}}@layer base{@property --ui-gap{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-pad{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-pad-x{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-pad-y{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-radius{syntax:\"<length-percentage>\";inherits:true;initial-value:0px}@property --ui-border-w{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-min-h{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-font-size{syntax:\"<length>\";inherits:true;initial-value:0}@property --ui-opacity{syntax:\"<number>\";inherits:true;initial-value:1}@property --ui-bg{syntax:\"<color>\";inherits:true;initial-value:#0000}@property --ui-fg{syntax:\"<color>\";inherits:true;initial-value:currentColor}@property --ui-border{syntax:\"<color>\";inherits:true;initial-value:#0000}@property --ui-bg-hover{syntax:\"<color>\";inherits:true;initial-value:#0000}@property --ui-border-hover{syntax:\"<color>\";inherits:true;initial-value:#0000}@property --ui-ring{syntax:\"<color>\";inherits:true;initial-value:#0000}}@layer tokens, base, layout, utilities, shells, shell, views, view, viewer, components, markdown, essentials, overrides;@layer tokens{:host,:root,:scope{color-scheme:light dark;--color-primary:#5a7fff;--color-on-primary:#fff;--color-secondary:#6b7280;--color-on-secondary:#fff;--color-tertiary:#64748b;--color-on-tertiary:#fff;--color-error:#ef4444;--color-on-error:#fff;--color-success:#4caf50;--color-warning:#ff9800;--color-info:#2196f3;--color-background:#fafbfc;--color-on-background:#1e293b;--color-surface:#fafbfc;--color-on-surface:#1e293b;--color-surface-variant:#f1f5f9;--color-on-surface-variant:#64748b;--color-outline:#cbd5e1;--color-outline-variant:#94a3b8;--color-surface-container-low:color-mix(in oklab,var(--color-surface) 96%,var(--color-primary) 4%);--color-surface-container:color-mix(in oklab,var(--color-surface) 92%,var(--color-primary) 8%);--color-surface-container-high:color-mix(in oklab,var(--color-surface) 88%,var(--color-primary) 12%);--color-surface-container-highest:color-mix(in oklab,var(--color-surface) 84%,var(--color-primary) 16%);--color-border:color-mix(in oklab,var(--color-outline-variant) 75%,#0000);--space-xs:0.25rem;--space-sm:0.5rem;--space-md:0.75rem;--space-lg:1rem;--space-xl:1.25rem;--space-2xl:1.5rem;--padding-xs:var(--space-xs);--padding-sm:var(--space-sm);--padding-md:var(--space-md);--padding-lg:var(--space-lg);--padding-xl:var(--space-xl);--padding-2xl:var(--space-2xl);--padding-3xl:2rem;--padding-4xl:2.5rem;--padding-5xl:3rem;--padding-6xl:4rem;--padding-7xl:5rem;--padding-8xl:6rem;--padding-9xl:8rem;--gap-xs:var(--space-xs);--gap-sm:var(--space-sm);--gap-md:var(--space-md);--gap-lg:var(--space-lg);--gap-xl:var(--space-xl);--gap-2xl:var(--space-2xl);--radius-none:0;--radius-sm:0.25rem;--radius-default:0.25rem;--radius-md:0.375rem;--radius-lg:0.5rem;--radius-xl:0.75rem;--radius-2xl:1rem;--radius-3xl:1.5rem;--radius-full:9999px;--elev-0:none;--elev-1:0 1px 1px #0000000f,0 1px 3px #0000001a;--elev-2:0 2px 6px #0000001f,0 8px 24px #00000014;--elev-3:0 6px 16px #00000024,0 18px 48px #0000001a;--shadow-xs:0 1px 2px #0000000d;--shadow-sm:0 1px 3px #0000001a;--shadow-md:0 4px 6px #0000001a;--shadow-lg:0 10px 15px #0000001a;--shadow-xl:0 20px 25px #0000001a;--shadow-2xl:0 25px 50px #0000001a;--shadow-inset:inset 0 2px 4px #0000000f;--shadow-inset-strong:inset 0 4px 8px #0000001f;--shadow-none:0 0 #0000;--text-xs:0.8rem;--text-sm:0.9rem;--text-base:1rem;--text-lg:1.1rem;--text-xl:1.25rem;--text-2xl:1.6rem;--text-3xl:2rem;--font-size-xs:0.75rem;--font-size-sm:0.875rem;--font-size-base:1rem;--font-size-lg:1.125rem;--font-size-xl:1.25rem;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--font-family:\"Roboto\",ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;--font-family-mono:\"Roboto Mono\",\"SF Mono\",Monaco,Inconsolata,\"Fira Code\",monospace;--font-sans:var(--font-family);--font-mono:var(--font-family-mono);--leading-tight:1.2;--leading-normal:1.5;--leading-relaxed:1.8;--transition-fast:120ms cubic-bezier(0.2,0,0,1);--transition-normal:160ms cubic-bezier(0.2,0,0,1);--transition-slow:200ms cubic-bezier(0.2,0,0,1);--motion-fast:var(--transition-fast);--motion-normal:var(--transition-normal);--motion-slow:var(--transition-slow);--focus-ring:0 0 0 3px color-mix(in oklab,var(--color-primary) 35%,#0000);--z-base:0;--z-dropdown:100;--z-sticky:200;--z-fixed:300;--z-modal-backdrop:400;--z-modal:500;--z-popover:600;--z-tooltip:700;--z-toast:800;--z-max:9999;--view-bg:var(--color-surface);--view-fg:var(--color-on-surface);--view-border:var(--color-outline-variant);--view-input-bg:light-dark(#fff,var(--color-surface-container-high));--view-files-bg:light-dark(#00000005,var(--color-surface-container-low));--view-file-bg:light-dark(#00000008,var(--color-surface-container-lowest,var(--color-surface-container-low)));--view-results-bg:light-dark(#00000003,var(--color-surface-container-low));--view-result-bg:light-dark(#00000008,var(--color-surface-container-lowest,var(--color-surface-container-low)));--color-surface-elevated:var(--color-surface-container);--color-surface-hover:var(--color-surface-container-low);--color-surface-active:var(--color-surface-container-high);--color-on-surface-muted:var(--color-on-surface-variant);--color-background-alt:var(--color-surface-variant);--color-primary-hover:color-mix(in oklab,var(--color-primary) 80%,#000);--color-primary-active:color-mix(in oklab,var(--color-primary) 65%,#000);--color-accent:var(--color-secondary);--color-accent-hover:color-mix(in oklab,var(--color-secondary) 80%,#000);--color-on-accent:var(--color-on-secondary);--color-border-hover:var(--color-outline-variant);--color-border-strong:var(--color-outline);--color-border-focus:var(--color-primary);--color-text:var(--color-on-surface);--color-text-secondary:var(--color-on-surface-variant);--color-text-muted:color-mix(in oklab,var(--color-on-surface) 50%,var(--color-surface));--color-text-disabled:color-mix(in oklab,var(--color-on-surface) 38%,var(--color-surface));--color-text-inverse:var(--color-on-primary);--color-link:var(--color-primary);--color-link-hover:color-mix(in oklab,var(--color-primary) 80%,#000);--color-success-light:color-mix(in oklab,var(--color-success) 60%,#fff);--color-success-dark:color-mix(in oklab,var(--color-success) 70%,#000);--color-warning-light:color-mix(in oklab,var(--color-warning) 60%,#fff);--color-warning-dark:color-mix(in oklab,var(--color-warning) 70%,#000);--color-error-light:color-mix(in oklab,var(--color-error) 60%,#fff);--color-error-dark:color-mix(in oklab,var(--color-error) 70%,#000);--color-info-light:color-mix(in oklab,var(--color-info) 60%,#fff);--color-info-dark:color-mix(in oklab,var(--color-info) 70%,#000);--color-bg:var(--color-surface,var(--color-surface));--color-bg-alt:var(--color-surface-variant,var(--color-surface-variant));--color-fg:var(--color-on-surface,var(--color-on-surface));--color-fg-muted:var(--color-on-surface-variant,var(--color-on-surface-variant));--btn-height-sm:2rem;--btn-height-md:2.5rem;--btn-height-lg:3rem;--btn-padding-x-sm:var(--space-md);--btn-padding-x-md:var(--space-lg);--btn-padding-x-lg:1.5rem;--btn-radius:var(--radius-md);--btn-font-weight:var(--font-weight-medium);--input-height-sm:2rem;--input-height-md:2.5rem;--input-height-lg:3rem;--input-padding-x:var(--space-md);--input-radius:var(--radius-md);--input-border-color:var(--color-border,var(--color-border));--input-focus-ring-color:var(--color-primary);--input-focus-ring-width:2px;--card-padding:var(--space-lg);--card-radius:var(--radius-lg);--card-shadow:var(--shadow-sm);--card-border-color:var(--color-border,var(--color-border));--modal-backdrop-bg:light-dark(#00000080,#000000b3);--modal-bg:var(--color-surface,var(--color-surface));--modal-radius:var(--radius-xl);--modal-shadow:var(--shadow-xl);--modal-padding:1.5rem;--toast-font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif);--toast-font-size:var(--font-size-base,1rem);--toast-font-weight:var(--font-weight-medium,500);--toast-letter-spacing:0.01em;--toast-line-height:1.4;--toast-white-space:nowrap;--toast-pointer-events:auto;--toast-user-select:none;--toast-cursor:default;--toast-opacity:0;--toast-transform:translateY(100%) scale(0.9);--toast-transition:opacity 160ms ease-out,transform 160ms cubic-bezier(0.16,1,0.3,1),background-color 100ms ease;--toast-text:var(--color-on-surface,var(--color-on-surface,light-dark(#fff,#000)));--toast-bg:color-mix(in oklab,var(--color-surface-elevated,var(--color-surface-container-high,var(--color-surface,light-dark(#fafbfc,#1e293b)))) 90%,var(--color-on-surface,var(--color-on-surface,light-dark(#000,#fff))));--toast-radius:var(--radius-lg);--toast-shadow:var(--shadow-lg);--toast-padding:var(--space-lg);--sidebar-width:280px;--sidebar-collapsed-width:64px;--nav-height:56px;--nav-height-compact:48px;--status-height:24px;--status-bg:var(--color-surface-elevated,var(--color-surface-container-high));--status-font-size:var(--text-xs)}@media (prefers-color-scheme:dark){:host,:root,:scope{--color-primary:#7ca7ff;--color-on-primary:#0f172a;--color-secondary:#94a3b8;--color-on-secondary:#1e293b;--color-tertiary:#94a3b8;--color-on-tertiary:#0f172a;--color-error:#f87171;--color-on-error:#450a0a;--color-success:#66bb6a;--color-warning:#ffa726;--color-info:#42a5f5;--color-background:#0f1419;--color-on-background:#f1f5f9;--color-surface:#0f1419;--color-on-surface:#f1f5f9;--color-surface-variant:#1e293b;--color-on-surface-variant:#cbd5e1;--color-outline:#475569;--color-outline-variant:#334155;--color-surface-container-low:color-mix(in oklab,var(--color-surface) 92%,var(--color-primary) 8%);--color-surface-container:color-mix(in oklab,var(--color-surface) 88%,var(--color-primary) 12%);--color-surface-container-high:color-mix(in oklab,var(--color-surface) 84%,var(--color-primary) 16%);--color-surface-container-highest:color-mix(in oklab,var(--color-surface) 80%,var(--color-primary) 20%);--color-border:color-mix(in oklab,var(--color-outline-variant) 70%,#0000)}}[data-theme=light]{color-scheme:light;--color-primary:#5a7fff;--color-on-primary:#fff;--color-secondary:#6b7280;--color-on-secondary:#fff;--color-tertiary:#64748b;--color-on-tertiary:#fff;--color-error:#ef4444;--color-on-error:#fff;--color-success:#4caf50;--color-warning:#ff9800;--color-info:#2196f3;--color-background:#fafbfc;--color-on-background:#1e293b;--color-surface:#fafbfc;--color-on-surface:#1e293b;--color-surface-variant:#f1f5f9;--color-on-surface-variant:#64748b;--color-outline:#cbd5e1;--color-outline-variant:#94a3b8;--color-surface-container-low:color-mix(in oklab,var(--color-surface) 96%,var(--color-primary) 4%);--color-surface-container:color-mix(in oklab,var(--color-surface) 92%,var(--color-primary) 8%);--color-surface-container-high:color-mix(in oklab,var(--color-surface) 88%,var(--color-primary) 12%);--color-surface-container-highest:color-mix(in oklab,var(--color-surface) 84%,var(--color-primary) 16%);--color-border:color-mix(in oklab,var(--color-outline-variant) 75%,#0000)}[data-theme=dark]{color-scheme:dark;--color-primary:#7ca7ff;--color-on-primary:#0f172a;--color-secondary:#94a3b8;--color-on-secondary:#1e293b;--color-tertiary:#94a3b8;--color-on-tertiary:#0f172a;--color-error:#f87171;--color-on-error:#450a0a;--color-success:#66bb6a;--color-warning:#ffa726;--color-info:#42a5f5;--color-background:#0f1419;--color-on-background:#f1f5f9;--color-surface:#0f1419;--color-on-surface:#f1f5f9;--color-surface-variant:#1e293b;--color-on-surface-variant:#cbd5e1;--color-outline:#475569;--color-outline-variant:#334155;--color-surface-container-low:color-mix(in oklab,var(--color-surface) 92%,var(--color-primary) 8%);--color-surface-container:color-mix(in oklab,var(--color-surface) 88%,var(--color-primary) 12%);--color-surface-container-high:color-mix(in oklab,var(--color-surface) 84%,var(--color-primary) 16%);--color-surface-container-highest:color-mix(in oklab,var(--color-surface) 80%,var(--color-primary) 20%);--color-border:color-mix(in oklab,var(--color-outline-variant) 70%,#0000)}@media (prefers-reduced-motion:reduce){:root{--transition-fast:0ms;--transition-normal:0ms;--transition-slow:0ms;--motion-fast:0ms;--motion-normal:0ms;--motion-slow:0ms}}@media (prefers-contrast:high){:root{--color-border:var(--color-border,var(--color-outline));--color-border-hover:color-mix(in oklab,var(--color-border,var(--color-outline)) 80%,var(--color-on-surface,var(--color-on-surface)));--color-text-secondary:var(--color-on-surface,var(--color-on-surface));--color-text-muted:var(--color-on-surface-variant,var(--color-on-surface-variant))}}@media print{:root{--view-padding:0;--view-content-max-width:100%;--view-bg:#fff;--view-fg:#000;--view-heading-color:#000;--view-link-color:#000}:root:has([data-view=viewer]){--view-code-bg:#f5f5f5;--view-code-fg:#000;--view-blockquote-bg:#f5f5f5}}}@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@layer utilities{.m-0{margin:0}.mb-0{margin-block:0}.mi-0{margin-inline:0}.p-0{padding:0}.pb-0{padding-block:0}.pi-0{padding-inline:0}.gap-0{gap:0}.inset-0{inset:0}.m-xs{margin:.25rem}.mb-xs{margin-block:.25rem}.mi-xs{margin-inline:.25rem}.p-xs{padding:.25rem}.pb-xs{padding-block:.25rem}.pi-xs{padding-inline:.25rem}.gap-xs{gap:.25rem}.inset-xs{inset:.25rem}.m-sm{margin:.5rem}.mb-sm{margin-block:.5rem}.mi-sm{margin-inline:.5rem}.p-sm{padding:.5rem}.pb-sm{padding-block:.5rem}.pi-sm{padding-inline:.5rem}.gap-sm{gap:.5rem}.inset-sm{inset:.5rem}.m-md{margin:.75rem}.mb-md{margin-block:.75rem}.mi-md{margin-inline:.75rem}.p-md{padding:.75rem}.pb-md{padding-block:.75rem}.pi-md{padding-inline:.75rem}.gap-md{gap:.75rem}.inset-md{inset:.75rem}.m-lg{margin:1rem}.mb-lg{margin-block:1rem}.mi-lg{margin-inline:1rem}.p-lg{padding:1rem}.pb-lg{padding-block:1rem}.pi-lg{padding-inline:1rem}.gap-lg{gap:1rem}.inset-lg{inset:1rem}.m-xl{margin:1.25rem}.mb-xl{margin-block:1.25rem}.mi-xl{margin-inline:1.25rem}.p-xl{padding:1.25rem}.pb-xl{padding-block:1.25rem}.pi-xl{padding-inline:1.25rem}.gap-xl{gap:1.25rem}.inset-xl{inset:1.25rem}.m-2xl{margin:1.5rem}.mb-2xl{margin-block:1.5rem}.mi-2xl{margin-inline:1.5rem}.p-2xl{padding:1.5rem}.pb-2xl{padding-block:1.5rem}.pi-2xl{padding-inline:1.5rem}.gap-2xl{gap:1.5rem}.inset-2xl{inset:1.5rem}.m-3xl{margin:2rem}.mb-3xl{margin-block:2rem}.mi-3xl{margin-inline:2rem}.p-3xl{padding:2rem}.pb-3xl{padding-block:2rem}.pi-3xl{padding-inline:2rem}.gap-3xl{gap:2rem}.inset-3xl{inset:2rem}.text-xs{font-size:.75rem}.text-sm,.text-xs{font-weight:400;letter-spacing:0;line-height:1.5}.text-sm{font-size:.875rem}.text-base{font-size:1rem}.text-base,.text-lg{font-weight:400;letter-spacing:0;line-height:1.5}.text-lg{font-size:1.125rem}.text-xl{font-size:1.25rem}.text-2xl,.text-xl{font-weight:400;letter-spacing:0;line-height:1.5}.text-2xl{font-size:1.5rem}.font-thin{font-weight:100}.font-light{font-weight:300}.font-normal{font-weight:400}.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-bold{font-weight:700}.text-start{text-align:start}.text-center{text-align:center}.text-end{text-align:end}.text-primary{color:#1e293b,#f1f5f9}.text-secondary{color:#64748b,#94a3b8}.text-muted{color:#94a3b8,#64748b}.text-disabled{color:#cbd5e1,#475569}.block,.vu-block{display:block}.inline,.vu-inline{display:inline}.inline-block{display:inline-block}.flex,.vu-flex{display:flex}.inline-flex{display:inline-flex}.grid,.vu-grid{display:grid}.hidden,.vu-hidden{display:none}.flex-row{flex-direction:row}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.flex-nowrap{flex-wrap:nowrap}.items-start{align-items:flex-start}.items-center{align-items:center}.items-end{align-items:flex-end}.items-stretch{align-items:stretch}.justify-start{justify-content:flex-start}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.justify-between{justify-content:space-between}.justify-around{justify-content:space-around}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.block-size-auto,.h-auto{block-size:auto}.block-size-full,.h-full{block-size:100%}.h-screen{block-size:100vh}.inline-size-auto,.w-auto{inline-size:auto}.inline-size-full,.w-full{inline-size:100%}.w-screen{inline-size:100vw}.min-block-size-0,.min-h-0{min-block-size:0}.min-inline-size-0,.min-w-0{min-inline-size:0}.max-block-size-full,.max-h-full{max-block-size:100%}.max-inline-size-full,.max-w-full{max-inline-size:100%}.static{position:static}.relative{position:relative}.absolute{position:absolute}.fixed{position:fixed}.sticky{position:sticky}.bg-surface{background-color:#fafbfc,#0f1419}.bg-surface-container{background-color:#f1f5f9,#1e293b}.bg-surface-container-high{background-color:#e2e8f0,#334155}.bg-primary{background-color:#5a7fff,#7ca7ff}.bg-secondary{background-color:#6b7280,#94a3b8}.border{border:1px solid #475569}.border-2{border:2px solid #475569}.border-primary{border:1px solid #7ca7ff}.border-secondary{border:1px solid #94a3b8}.rounded-none{border-radius:0}.rounded-sm{border-radius:.25rem}.rounded-md{border-radius:.375rem}.rounded-lg{border-radius:.5rem}.rounded-full{border-radius:9999px}.shadow-xs{box-shadow:0 1px 2px 0 #0000000d}.shadow-sm{box-shadow:0 1px 3px 0 #0000001a}.shadow-md{box-shadow:0 4px 6px -1px #0000001a}.shadow-lg{box-shadow:0 10px 15px -3px #0000001a}.shadow-xl{box-shadow:0 20px 25px -5px #0000001a}.cursor-pointer{cursor:pointer}.cursor-default{cursor:default}.cursor-not-allowed{cursor:not-allowed}.select-none{user-select:none}.select-text{user-select:text}.select-all{user-select:all}.visible{visibility:visible}.invisible{visibility:hidden}.collapse,.vs-collapsed{visibility:collapse}.opacity-0{opacity:0}.opacity-25{opacity:.25}.opacity-50{opacity:.5}.opacity-75{opacity:.75}.opacity-100{opacity:1}@container (max-width: 320px){.hidden\\@xs{display:none}}@container (max-width: 640px){.hidden\\@sm{display:none}}@container (max-width: 768px){.hidden\\@md{display:none}}@container (max-width: 1024px){.hidden\\@lg{display:none}}@container (min-width: 320px){.block\\@xs{display:block}}@container (min-width: 640px){.block\\@sm{display:block}}@container (min-width: 768px){.block\\@md{display:block}}@container (min-width: 1024px){.block\\@lg{display:block}}@container (max-width: 320px){.text-sm\\@xs{font-size:.875rem;font-weight:400;letter-spacing:0;line-height:1.5}}@container (min-width: 640px){.text-base\\@sm{font-size:1rem;font-weight:400;letter-spacing:0;line-height:1.5}}.icon-xs{--icon-size:0.75rem}.icon-sm{--icon-size:0.875rem}.icon-md{--icon-size:1rem}.icon-lg{--icon-size:1.25rem}.icon-xl{--icon-size:1.5rem}.center-absolute{left:50%;position:absolute;top:50%;transform:translate(-50%,-50%)}.center-flex{align-items:center;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center}.interactive{cursor:pointer;touch-action:manipulation;user-select:none;-webkit-tap-highlight-color:transparent}.interactive:focus-visible{outline:2px solid #1e40af;outline-offset:2px}.interactive:disabled,.interactive[aria-disabled=true]{cursor:not-allowed;opacity:.6;pointer-events:none}.focus-ring:focus-visible{outline:2px solid #1e40af;outline-offset:2px}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.truncate-2{-webkit-line-clamp:2}.truncate-2,.truncate-3{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}.truncate-3{-webkit-line-clamp:3}.aspect-square{aspect-ratio:1}.aspect-video{aspect-ratio:16/9}.margin-block-0{margin-block:0}.margin-block-sm{margin-block:var(--space-sm)}.margin-block-md{margin-block:var(--space-md)}.margin-block-lg{margin-block:var(--space-lg)}.margin-inline-0{margin-inline:0}.margin-inline-sm{margin-inline:var(--space-sm)}.margin-inline-md{margin-inline:var(--space-md)}.margin-inline-lg{margin-inline:var(--space-lg)}.margin-inline-auto{margin-inline:auto}.padding-block-0{padding-block:0}.padding-block-sm{padding-block:var(--space-sm)}.padding-block-md{padding-block:var(--space-md)}.padding-block-lg{padding-block:var(--space-lg)}.padding-inline-0{padding-inline:0}.padding-inline-sm{padding-inline:var(--space-sm)}.padding-inline-md{padding-inline:var(--space-md)}.padding-inline-lg{padding-inline:var(--space-lg)}.pointer-events-none{pointer-events:none}.pointer-events-auto{pointer-events:auto}.line-clamp-1{-webkit-line-clamp:1}.line-clamp-1,.line-clamp-2{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}.line-clamp-2{-webkit-line-clamp:2}.line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.vs-active{--state-active:1}.vs-disabled{opacity:.5;pointer-events:none}.vs-loading{cursor:wait}.vs-error{color:var(--color-error,#dc3545)}.vs-success{color:var(--color-success,#28a745)}.vs-hidden{display:none!important}.container,.vl-container{inline-size:100%;margin-inline:auto;max-inline-size:var(--container-max,1200px)}.vl-container{padding-inline:var(--space-md)}.container{padding-inline:var(--space-lg)}.vl-grid{display:grid;gap:var(--gap-md)}.vl-stack{display:flex;flex-direction:column;gap:var(--gap-md)}.vl-cluster{flex-wrap:wrap;gap:var(--gap-sm)}.vl-center,.vl-cluster{align-items:center;display:flex}.vl-center{justify-content:center}.vu-sr-only{block-size:1px;inline-size:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;clip:rect(0,0,0,0);border:0;white-space:nowrap}.vc-surface{background-color:var(--color-surface);color:var(--color-on-surface)}.vc-surface-variant{background-color:var(--color-surface-variant);color:var(--color-on-surface-variant)}.vc-primary{background-color:var(--color-primary);color:var(--color-on-primary)}.vc-secondary{background-color:var(--color-secondary);color:var(--color-on-secondary)}.vc-elevated{box-shadow:var(--elev-1)}.vc-elevated-2{box-shadow:var(--elev-2)}.vc-elevated-3{box-shadow:var(--elev-3)}.vc-rounded{border-radius:var(--radius-md)}.vc-rounded-sm{border-radius:var(--radius-sm)}.vc-rounded-lg{border-radius:var(--radius-lg)}.vc-rounded-full{border-radius:var(--radius-full,9999px)}.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:var(--space-lg)}.stack>*+*{margin-block-start:var(--space-md)}.stack-sm>*+*{margin-block-start:var(--space-sm)}.stack-lg>*+*{margin-block-start:var(--space-lg)}@media print{.print-hidden{display:none!important}.print-visible{display:block!important}.print-break-before{page-break-before:always}.print-break-after{page-break-after:always}.print-break-inside-avoid{page-break-inside:avoid}}@media (prefers-reduced-motion:reduce){.transition-fast,.transition-normal,.transition-slow{transition:none}*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}@media (prefers-contrast:high){.text-primary{color:var(--color-on-surface)}.text-disabled,.text-muted,.text-secondary{color:var(--color-on-surface-variant)}.border{border-width:2px}.border-top{border-top-width:2px}.border-bottom{border-bottom-width:2px}.border-left{border-left-width:2px}.border-right{border-right-width:2px}}}@layer ux-shapes{.shaped{aspect-ratio:1/1;border-radius:1.5rem;clip-path:var(--clip-path,none);contain:strict;display:flex;overflow:hidden;padding:1.25rem;place-content:center;place-items:center;pointer-events:auto;transition:--background-tone-shift .2s ease-in-out,--icon-color .2s ease-in-out;transition-behavior:allow-discrete;user-select:none;z-index:1}.shaped,.shaped span,.shaped ui-icon{block-size:stretch;inline-size:stretch}[data-dragging]{z-index:calc(100 + var(--z-index, 0))!important}:not(.shaped) .shaped,:not(.shaped)>*,:not(:has(.shaped)){--border-radius:var(--radius-md);--clip-path:none}:not(.shaped) .shaped[data-shape],:not(.shaped)>[data-shape],:not(:has(.shaped))[data-shape]{aspect-ratio:1/1;border-radius:var(--border-radius,var(--radius-md));clip-path:var(--clip-path,none);contain:strict;overflow:hidden;pointer-events:auto;touch-action:none}:not(.shaped) .shaped[data-shape=square],:not(.shaped)>[data-shape=square],:not(:has(.shaped))[data-shape=square]{--border-radius:var(--radius-md);--clip-path:none}:not(.shaped) .shaped[data-shape=squircle],:not(.shaped)>[data-shape=squircle],:not(:has(.shaped))[data-shape=squircle]{--border-radius:28%;--clip-path:none}:not(.shaped) .shaped[data-shape=circle],:not(.shaped)>[data-shape=circle],:not(:has(.shaped))[data-shape=circle]{--border-radius:50%;--clip-path:none}:not(.shaped) .shaped[data-shape=rounded],:not(.shaped)>[data-shape=rounded],:not(:has(.shaped))[data-shape=rounded]{--border-radius:var(--radius-xl);--clip-path:none}:not(.shaped) .shaped[data-shape=blob],:not(.shaped)>[data-shape=blob],:not(:has(.shaped))[data-shape=blob]{--border-radius:60% 40% 30% 70%/60% 30% 70% 40%;--clip-path:none}:not(.shaped) .shaped[data-shape=hexagon],:not(.shaped)>[data-shape=hexagon],:not(:has(.shaped))[data-shape=hexagon]{--border-radius:0;--clip-path:polygon(round 0.375rem,50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)}:not(.shaped) .shaped[data-shape=diamond],:not(.shaped)>[data-shape=diamond],:not(:has(.shaped))[data-shape=diamond]{--border-radius:0;--clip-path:polygon(round 0.5rem,50% 0%,100% 50%,50% 100%,0% 50%)}:not(.shaped) .shaped[data-shape=star],:not(.shaped)>[data-shape=star],:not(:has(.shaped))[data-shape=star]{--border-radius:0;--clip-path:polygon(round 0.25rem,50% 0%,61% 35%,98% 38%,68% 59%,79% 95%,50% 75%,21% 95%,32% 59%,2% 38%,39% 35%)}:not(.shaped) .shaped[data-shape=badge],:not(.shaped)>[data-shape=badge],:not(:has(.shaped))[data-shape=badge]{--border-radius:0;--clip-path:polygon(round 0.375rem,0% 0%,100% 0%,100% 70%,50% 100%,0% 70%)}:not(.shaped) .shaped[data-shape=heart],:not(.shaped)>[data-shape=heart],:not(:has(.shaped))[data-shape=heart]{--border-radius:0;--clip-path:polygon(round 0.25rem,50% 100%,10% 65%,0% 45%,0% 30%,5% 15%,18% 3%,35% 0%,50% 12%,65% 0%,82% 3%,95% 15%,100% 30%,100% 45%,90% 65%)}:not(.shaped) .shaped[data-shape=clover],:not(.shaped)>[data-shape=clover],:not(:has(.shaped))[data-shape=clover]{--border-radius:0;--clip-path:polygon(round 0.375rem,50% 0%,60% 30%,70% 30%,100% 50%,70% 70%,60% 70%,50% 100%,40% 70%,30% 70%,0% 50%,30% 30%,40% 30%)}:not(.shaped) .shaped[data-shape=flower],:not(.shaped)>[data-shape=flower],:not(:has(.shaped))[data-shape=flower]{--border-radius:0;--clip-path:polygon(round 0.25rem,50% 0%,58% 25%,85% 15%,68% 40%,100% 50%,68% 60%,85% 85%,58% 75%,50% 100%,42% 75%,15% 85%,32% 60%,0% 50%,32% 40%,15% 15%,42% 25%)}:not(.shaped) .shaped[data-shape=triangle],:not(.shaped)>[data-shape=triangle],:not(:has(.shaped))[data-shape=triangle]{--border-radius:0;--clip-path:polygon(round 0.5rem,50% 0%,100% 87%,0% 87%)}:not(.shaped) .shaped[data-shape=pentagon],:not(.shaped)>[data-shape=pentagon],:not(:has(.shaped))[data-shape=pentagon]{--border-radius:0;--clip-path:polygon(round 0.375rem,50% 0%,97.5% 35%,79.5% 95%,20.5% 95%,2.5% 35%)}:not(.shaped) .shaped[data-shape=octagon],:not(.shaped)>[data-shape=octagon],:not(:has(.shaped))[data-shape=octagon]{--border-radius:0;--clip-path:polygon(round 0.25rem,30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)}:not(.shaped) .shaped[data-shape=cross],:not(.shaped)>[data-shape=cross],:not(:has(.shaped))[data-shape=cross]{--border-radius:0;--clip-path:polygon(round 0.375rem,35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%)}:not(.shaped) .shaped[data-shape=arrow],:not(.shaped)>[data-shape=arrow],:not(:has(.shaped))[data-shape=arrow]{--border-radius:0;--clip-path:polygon(round 0.375rem,0% 20%,60% 20%,60% 0%,100% 50%,60% 100%,60% 80%,0% 80%)}:not(.shaped) .shaped[data-shape=egg],:not(.shaped)>[data-shape=egg],:not(:has(.shaped))[data-shape=egg]{--border-radius:50% 50% 50% 50%/60% 60% 40% 40%;--clip-path:none}:not(.shaped) .shaped[data-shape=tear],:not(.shaped)>[data-shape=tear],:not(:has(.shaped))[data-shape=tear]{--border-radius:50cqmin 50cqmin 5rem 50cqmin;--clip-path:none;border-end-end-radius:5rem;border-end-start-radius:50cqmin;border-start-end-radius:50cqmin;border-start-start-radius:50cqmin}:not(.shaped) .shaped[data-shape=wavy],:not(.shaped)>[data-shape=wavy],:not(:has(.shaped))[data-shape=wavy]{--border-radius:calc(var(--icon-size, 100%) * 0.5)}}@layer tokens, base, layout, utilities, shells, shell, views, view, viewer, components, markdown, essentials, overrides;@layer components{.btn,button{align-items:center;background:var(--color-bg-alt);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-fg);cursor:pointer;display:inline-flex;font-size:var(--font-size-sm);font-weight:500;gap:var(--space-sm);justify-content:center;padding-block:var(--space-sm);padding-inline:var(--space-lg);transition:all var(--transition-fast)}.btn:hover:not(:disabled),button:hover:not(:disabled){background:var(--color-border)}.btn:focus-visible,button:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}.btn:disabled,button:disabled{cursor:not-allowed;opacity:.5}.btn{--ui-bg:var(--color-surface-container-high);--ui-fg:var(--color-on-surface);--ui-bg-hover:var(--color-surface-container-highest);--ui-ring:var(--color-primary);--ui-radius:var(--radius-lg);--ui-pad-y:var(--space-sm);--ui-pad-x:var(--space-lg);--ui-font-size:var(--text-sm);--ui-font-weight:var(--font-weight-semibold);--ui-min-h:40px;--ui-opacity:1;appearance:none;background:var(--ui-bg);block-size:calc-size(fit-content,max(var(--ui-min-h),size));border:none;border-radius:var(--ui-radius);box-shadow:var(--elev-0);color:var(--ui-fg);contain:none;container-type:normal;flex-direction:row;flex-wrap:nowrap;font-size:var(--ui-font-size);font-weight:var(--ui-font-weight);gap:var(--space-xs);letter-spacing:.01em;line-height:1.2;max-block-size:stretch;max-inline-size:none;min-block-size:fit-content;min-inline-size:calc-size(fit-content,size + .5rem + var(--icon-size,1rem));opacity:var(--ui-opacity);overflow:hidden;padding:max(var(--ui-pad-y,0px),0px) max(var(--ui-pad-x,0px),0px);place-content:center;align-content:safe center;justify-content:safe center;place-items:center;align-items:safe center;justify-items:safe center;pointer-events:auto;text-align:center;text-decoration:none;text-overflow:ellipsis;text-rendering:auto;text-shadow:none;text-transform:none;text-wrap:nowrap;touch-action:manipulation;transition:background-color var(--motion-fast),box-shadow var(--motion-fast),transform var(--motion-fast);user-select:none;white-space:nowrap}.btn:hover{background:var(--ui-bg-hover);box-shadow:var(--elev-1);transform:translateY(-1px)}.btn:active{box-shadow:var(--elev-0);transform:translateY(0)}.btn:focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--ui-ring) 35%,#0000);outline:none}.btn:disabled{cursor:not-allowed;opacity:.5;transform:none!important}.btn:disabled:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-0)}.btn.active,.btn.primary{--ui-bg:var(--color-primary);--ui-fg:var(--color-on-primary);--ui-ring:var(--color-primary)}.btn.primary{--ui-bg-hover:color-mix(in oklab,var(--color-primary) 90%,#000)}.btn.active{box-shadow:var(--elev-1)}.btn.small{--ui-pad-y:var(--space-xs);--ui-pad-x:var(--space-md);--ui-font-size:var(--text-xs);--ui-min-h:32px;--ui-radius:var(--radius-md)}.btn.icon-btn{block-size:40px;inline-size:40px;--ui-pad-y:0px;--ui-pad-x:0px;--ui-radius:9999px;--ui-font-size:var(--text-lg)}.btn[data-action=export-docx],.btn[data-action=export-md],.btn[data-action=open-md]{--ui-font-size:12px;--ui-pad-x:8px;--ui-pad-y:0px;--ui-min-h:28px}.btn:is([data-action=view-markdown-viewer],[data-action=view-markdown-editor],[data-action=view-rich-editor],[data-action=view-settings],[data-action=view-history],[data-action=view-workcenter]){--ui-font-size:13px;--ui-font-weight:500;--ui-pad-x:12px;--ui-pad-y:0px;--ui-min-h:32px;--ui-radius:16px;text-transform:capitalize}.btn:is([data-action=view-markdown-viewer],[data-action=view-markdown-editor],[data-action=view-rich-editor],[data-action=view-settings],[data-action=view-history],[data-action=view-workcenter][data-current],[data-action=view-workcenter].active){--ui-bg:var(--color-surface-container-highest);--ui-fg:var(--color-primary);--ui-ring:var(--color-primary)}.btn:is([data-action=toggle-edit],[data-action=snip],[data-action=solve],[data-action=code],[data-action=css],[data-action=voice],[data-action=edit-templates],[data-action=recognize],[data-action=analyze],[data-action=select-files],[data-action=clear-prompt],[data-action=view-full-history]){--ui-font-size:12px;--ui-pad-x:8px;--ui-pad-y:0px;--ui-min-h:28px;--ui-radius:14px}.btn-primary{background:var(--color-primary);border-color:var(--color-primary);color:#fff}.btn-primary:hover:not(:disabled){background:var(--color-primary-hover);border-color:var(--color-primary-hover)}@media (max-inline-size:768px){.btn{--ui-pad-y:var(--space-xs);--ui-pad-x:var(--space-md);--ui-font-size:var(--text-xs);--ui-min-h:36px}}@media (max-inline-size:480px){.btn{--ui-pad-y:var(--space-xs);--ui-pad-x:var(--space-xs);--ui-font-size:var(--text-xs);--ui-min-h:32px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}@media (prefers-reduced-motion:reduce){.btn{transition:none}.btn,.btn:active,.btn:hover{transform:none!important}}}@layer tokens, base, layout, utilities, shells, shell, views, view, viewer, components, markdown, essentials, overrides;@layer utilities{.round-decor{--background-tone-shift:0;border-radius:.25rem;overflow:hidden;padding-block:.25rem}.round-decor:empty{display:none;padding:0;pointer-events:none;visibility:collapse}.time-format{display:inline-flex;flex-direction:row;font:500 .9em InterVariable,Inter,Fira Mono,Menlo,Consolas,monospace;font-kerning:auto;font-optical-sizing:auto;font-stretch:condensed;font-variant-numeric:tabular-nums;padding:.125rem;place-content:center;place-items:center;place-self:center;font-width:condensed;letter-spacing:-.05em;text-align:center;text-overflow:ellipsis;text-wrap:nowrap;white-space:nowrap}.ui-ws-item{cursor:pointer;pointer-events:auto;user-select:none}.ui-ws-item span{aspect-ratio:1/1;block-size:fit-content;display:inline;inline-size:fit-content;pointer-events:none}.ui-ws-item:active,.ui-ws-item:has(:active){cursor:grabbing;will-change:inset,translate,transform,opacity,z-index}}@layer essentials{@media print{.component-error,.component-loading,.ctx-menu,.ux-anchor{block-size:0!important;border:none!important;display:none!important;inline-size:0!important;inset:0!important;margin:0!important;max-block-size:0!important;max-inline-size:0!important;min-block-size:0!important;min-inline-size:0!important;opacity:0!important;overflow:hidden!important;padding:0!important;pointer-events:none!important;position:absolute!important;visibility:hidden!important;z-index:-1!important}}@media screen{:host,:root,:scope{--font-family:\"InterVariable\",\"Inter\",\"Helvetica Neue\",\"Helvetica\",\"Calibri\",\"Roboto\",ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.ui-grid-item,ui-modal,ui-window-frame{--opacity:1;--scale:1;--rotate:0deg;--translate-x:0%;--translate-y:0%;content-visibility:auto;isolation:isolate;opacity:var(--opacity,1);rotate:0deg;scale:1;transform-box:fill-box;transform-origin:50% 50%;transform-style:flat;translate:0 0 0}.ctx-menu{--font-family:\"InterVariable\",\"Inter\",\"Helvetica Neue\",\"Helvetica\",\"Calibri\",\"Roboto\",ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.ctx-menu,.ctx-menu *{content-visibility:visible;inline-size:fit-content;max-inline-size:stretch;visibility:visible}.ctx-menu{background-color:var(--color-surface);block-size:fit-content;border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);box-shadow:var(--elev-3);color:var(--color-on-surface);font-family:var(--font-family,'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif')!important;font-size:.875rem;font-weight:400;max-inline-size:min(240px,100cqi);min-inline-size:160px;opacity:1;padding:.25rem 0;pointer-events:auto;position:fixed;transform:scale3d(var(--scale,1),var(--scale,1),1) translate3d(var(--translate-x,0),var(--translate-y,0),0);transition:opacity .15s ease-out,visibility .15s ease-out,transform .15s ease-out;z-index:99999}.ctx-menu[data-hidden]{opacity:0;pointer-events:none;visibility:hidden}.ctx-menu>*{align-items:center;background-color:initial;border:none;border-radius:var(--radius-sm);cursor:pointer;display:flex;font-family:var(--font-family,'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif')!important;gap:.5rem;inline-size:stretch;min-block-size:2rem;outline:none;overflow:hidden;padding:.375rem .75rem;pointer-events:auto;position:relative;text-overflow:ellipsis;text-wrap:nowrap;transition:background-color .15s ease,color .15s ease;white-space:nowrap}.ctx-menu>*,.ctx-menu>:hover{color:var(--color-on-surface)}.ctx-menu>:hover{background-color:var(--color-surface-container-high)}.ctx-menu>:active{background-color:var(--color-surface-container-highest);color:var(--color-on-surface)}.ctx-menu>:focus-visible{background-color:var(--color-surface-container-high);outline:var(--focus-ring)}.ctx-menu>:not(.ctx-menu-separator){gap:.5rem}.ctx-menu>*>*{pointer-events:none}.ctx-menu>*>span{color:inherit;flex:1;font-size:.875rem;font-weight:400;line-height:1.25;pointer-events:none;text-align:start;user-select:none}.ctx-menu>*>ui-icon{--icon-size:1rem;block-size:var(--icon-size);color:var(--color-on-surface-variant);flex-shrink:0;inline-size:var(--icon-size);pointer-events:none;user-select:none}.ctx-menu.ctx-menu-separator,.ctx-menu>.ctx-menu-separator{background-color:var(--color-outline-variant);height:1px;margin:.125rem .375rem;min-block-size:auto;opacity:.3;padding:0;pointer-events:none}.ux-anchor{--shift-x:var(--client-x,0);--shift-y:var(--client-y,0);--translate-x:round(nearest,min(0px,calc(100cqi - (100% + var(--shift-x, 0) * 1px))),calc(1px / var(--pixel-ratio, 1)))!important;--translate-y:round(nearest,min(0px,calc(100cqb - (100% + var(--shift-y, 0) * 1px))),calc(1px / var(--pixel-ratio, 1)))!important;direction:ltr;inset-block-end:auto;inset-block-start:max(var(--shift-y) * 1px,var(--status-bar-padding,0px));inset-inline-end:auto;inset-inline-start:max(var(--shift-x) * 1px,0px);transform:none;translate:0 0 0;writing-mode:horizontal-tb}.component-error,.component-loading{align-items:center;color:var(--text-secondary,light-dark(#666,#aaa));display:flex;flex-direction:column;gap:1rem;justify-content:center;padding:2rem}.component-loading .loading-spinner{animation:h 1s linear infinite;border-radius:50%;border-top:2px solid var(--border,light-dark(#ddd,#444));border:2px solid var(--border,light-dark(#ddd,#444));border-top-color:var(--primary,light-dark(#007bff,#5fa8ff));height:2rem;width:2rem}.component-error{text-align:center}.component-error h3{color:var(--error,light-dark(#dc3545,#ff6b6b));margin:0}.component-error p{margin:0}ui-icon{align-items:center;block-size:var(--icon-size,1.25rem);color:currentColor;display:inline-flex;fill:currentColor;flex-shrink:0;inline-size:var(--icon-size,1.25rem);justify-content:center;min-block-size:var(--icon-size,1.25rem);min-inline-size:var(--icon-size,1.25rem);opacity:1;vertical-align:middle;visibility:visible}ui-icon img,ui-icon svg{block-size:100%;color:inherit;fill:currentColor;inline-size:100%}.file-picker{align-items:center;display:flex;flex-direction:column;justify-content:center;min-height:300px;padding:2rem;text-align:center}.file-picker .file-picker-header{margin-bottom:2rem}.file-picker .file-picker-header h2{color:var(--color-on-surface);font-size:1.5rem;font-weight:600;margin:0 0 .5rem}.file-picker .file-picker-header p{color:var(--color-on-surface-variant);font-size:.9rem;margin:0}.file-picker .file-picker-actions{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;margin-bottom:2rem}.file-picker .file-picker-actions .btn{align-items:center;border:1px solid #0000;border-radius:var(--radius-md);display:flex;font-weight:500;gap:.5rem;padding:.75rem 1.5rem;transition:all .2s ease}.file-picker .file-picker-actions .btn:hover{box-shadow:0 4px 8px #0000001a;transform:translateY(-1px)}.file-picker .file-picker-actions .btn.btn-primary{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary)}.file-picker .file-picker-actions .btn:not(.btn-primary){background:var(--color-surface-container);border-color:var(--color-outline-variant);color:var(--color-on-surface)}.file-picker .file-picker-info{max-width:400px}.file-picker .file-picker-info p{color:var(--color-on-surface-variant);font-size:.85rem;margin:.25rem 0}.file-picker .file-picker-info p strong{color:var(--color-on-surface)}}}";

async function loadBasicStyles() {
  try {
    if (basicStyles) {
      await loadAsAdopted(basicStyles);
      console.log("[Veela/Basic] Basic styles loaded");
    }
  } catch (e) {
    console.warn("[Veela/Basic] Failed to load basic styles:", e);
  }
}

const advancedStyles = "@layer ux-normalize,\n    ux-tokens,\n    ux-base,\n    ux-layout,\n    ux-components,\n    ux-utilities,\n    ux-theme,\n    ux-overrides;@property --client-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --client-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-x{initial-value:0;syntax:\"<number>\";inherits:true}@property --page-y{initial-value:0;syntax:\"<number>\";inherits:true}@property --sp-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --sp-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ds-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rx{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --ry{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-x{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --rs-y{initial-value:0px;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-shift-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-x{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --limit-drag-y{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --bound-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-inline-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --initial-block-size{initial-value:100%;syntax:\"<length-percentage>\";inherits:true}@property --scroll-coef{syntax:\"<number>\";initial-value:1;inherits:true}@property --scroll-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --content-size{syntax:\"<number>\";initial-value:0;inherits:true}@property --max-size{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@function --hsv(--src-color <color>) returns <color>{result:hsl(from var(--src-color,black) h calc(calc((calc(l / 100) - calc(calc(l / 100) * (1 - calc(s / 100) / 2))) / clamp(.0001, min(calc(calc(l / 100) * (1 - calc(s / 100) / 2)), calc(1 - calc(calc(l / 100) * (1 - calc(s / 100) / 2)))), 1)) * 100) calc(calc(calc(l / 100) * (1 - calc(s / 100) / 2)) * 100)/alpha)}@layer components{ui-icon{--icon-color:currentColor;--icon-size:1rem;--icon-padding:0.125rem;aspect-ratio:1;color:var(--icon-color);display:inline-grid;margin-inline-end:.125rem;place-content:center;place-items:center;vertical-align:middle}ui-icon:last-child{margin-inline-end:0}}@function --get-oriented-size-num(--orient <number>: 0, --osx <number>: 0, --osy <number>: 0, --axis-to-return <number>: 0 ) returns <number>{--go-orient:round(nearest,var(--orient,0),1);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary:var(--osx,0);--go-secondary:var(--osy,0);--go-inline:calc(var(--go-primary) * var(--go-swap-inline) + var(--go-secondary) * var(--go-swap));--go-block:calc(var(--go-secondary) * var(--go-swap-inline) + var(--go-primary) * var(--go-swap));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-size(--orient <number>: 0, --osx <length-percentage>: 0px, --osy <length-percentage>: 0px, --axis-to-return <number>: 0 ) returns <length-percentage>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary:var(--osx,0px);--go-secondary:var(--osy,0px);--go-inline:calc(var(--go-primary) * var(--go-swap-inline) + var(--go-secondary) * var(--go-swap));--go-block:calc(var(--go-secondary) * var(--go-swap-inline) + var(--go-primary) * var(--go-swap));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-vector(--orient <number>: 0, --osx <length-percentage>: 0px, --osy <length-percentage>: 0px, --axis-to-return <number>: 0 ) returns <length-percentage>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary-direct:var(--ocx,0px);--go-secondary-direct:var(--ocy,0px);--go-inline-direct:calc(var(--go-primary-direct) * var(--go-swap-inline) + var(--go-secondary-direct) * var(--go-swap));--go-block-direct:calc(var(--go-secondary-direct) * var(--go-swap-inline) + var(--go-primary-direct) * var(--go-swap));--go-inline-inverted:calc(0px - var(--go-inline-direct));--go-block-inverted:calc(0px - var(--go-block-direct));--go-rev-inline:clamp(0,calc(var(--go-orient) - 1),1);--go-rev-block:clamp(0,calc((1 - abs(calc(var(--go-orient) - 1.5))) * 2),1);--go-inline:calc(var(--go-inline-direct) * (1 - var(--go-rev-inline)) + var(--go-inline-inverted) * var(--go-rev-inline));--go-block:calc(var(--go-block-direct) * (1 - var(--go-rev-block)) + var(--go-block-inverted) * var(--go-rev-block));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-coord-num(--orient <number>: 0, --ocx <number>: 0, --ocy <number>: 0, --osx <number>: 0, --osy <number>: 0, --axis-to-return <number>: 0 ) returns <number>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary-direct:var(--ocx,0);--go-secondary-direct:var(--ocy,0);--go-primary-size:var(--osx,0);--go-secondary-size:var(--osy,0);--go-inline-direct:calc(var(--go-primary-direct) * var(--go-swap-inline) + var(--go-secondary-direct) * var(--go-swap));--go-block-direct:calc(var(--go-secondary-direct) * var(--go-swap-inline) + var(--go-primary-direct) * var(--go-swap));--go-inline-size:calc(var(--go-primary-size) * var(--go-swap-inline) + var(--go-secondary-size) * var(--go-swap));--go-block-size:calc(var(--go-secondary-size) * var(--go-swap-inline) + var(--go-primary-size) * var(--go-swap));--go-inline-inverted:calc(var(--go-inline-size, calc(var(--go-inline-direct) + var(--go-inline-direct))) - var(--go-inline-direct));--go-block-inverted:calc(var(--go-block-size, calc(var(--go-block-direct) + var(--go-block-direct))) - var(--go-block-direct));--go-rev-inline:clamp(0,calc(var(--go-orient) - 1),1);--go-rev-block:clamp(0,calc((1 - abs(calc(var(--go-orient) - 1.5))) * 2),1);--go-inline:calc(var(--go-inline-direct) * (1 - var(--go-rev-inline)) + var(--go-inline-inverted) * var(--go-rev-inline));--go-block:calc(var(--go-block-direct) * (1 - var(--go-rev-block)) + var(--go-block-inverted) * var(--go-rev-block));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@function --get-oriented-coordinate(--orient <number>: 0, --ocx <length-percentage>: 0px, --ocy <length-percentage>: 0px, --osx <length-percentage>: 0px, --osy <length-percentage>: 0px, --axis-to-return <number>: 0 ) returns <length-percentage>{--go-orient:mod(round(nearest,var(--orient,0),1),4);--go-axis:clamp(0,round(nearest,var(--axis-to-return,0),1),1);--go-axis-inline:calc(1 - var(--go-axis, 0));--go-axis-block:var(--go-axis,0);--go-swap-raw:mod(var(--go-orient,0),2);--go-swap:clamp(0,round(nearest,var(--go-swap-raw,0),1),1);--go-swap-inline:calc(1 - var(--go-swap, 0));--go-primary-direct:var(--ocx,0px);--go-secondary-direct:var(--ocy,0px);--go-primary-size:var(--osx,0px);--go-secondary-size:var(--osy,0px);--go-inline-direct:calc(var(--go-primary-direct) * var(--go-swap-inline) + var(--go-secondary-direct) * var(--go-swap));--go-block-direct:calc(var(--go-secondary-direct) * var(--go-swap-inline) + var(--go-primary-direct) * var(--go-swap));--go-inline-size:calc(var(--go-primary-size) * var(--go-swap-inline) + var(--go-secondary-size) * var(--go-swap));--go-block-size:calc(var(--go-secondary-size) * var(--go-swap-inline) + var(--go-primary-size) * var(--go-swap));--go-inline-inverted:calc(var(--go-inline-size, calc(var(--go-inline-direct) + var(--go-inline-direct))) - var(--go-inline-direct));--go-block-inverted:calc(var(--go-block-size, calc(var(--go-block-direct) + var(--go-block-direct))) - var(--go-block-direct));--go-rev-inline:clamp(0,calc(var(--go-orient) - 1),1);--go-rev-block:clamp(0,calc((1 - abs(calc(var(--go-orient) - 1.5))) * 2),1);--go-inline:calc(var(--go-inline-direct) * (1 - var(--go-rev-inline)) + var(--go-inline-inverted) * var(--go-rev-inline));--go-block:calc(var(--go-block-direct) * (1 - var(--go-rev-block)) + var(--go-block-inverted) * var(--go-rev-block));result:calc(var(--go-inline) * var(--go-axis-inline) + var(--go-block) * var(--go-axis-block))}@property --value{syntax:\"<number>\";initial-value:0;inherits:true}@property --relate{syntax:\"<number>\";initial-value:0;inherits:true}@property --drag-x{syntax:\"<number>\";initial-value:0;inherits:false}@property --drag-y{syntax:\"<number>\";initial-value:0;inherits:false}@property --order{syntax:\"<integer>\";initial-value:1;inherits:true}@property --content-inline-size{syntax:\"<length-percentage>\";initial-value:100%;inherits:true}@property --content-block-size{syntax:\"<length-percentage>\";initial-value:100%;inherits:true}@property --icon-size{syntax:\"<length-percentage>\";initial-value:16px;inherits:true}@property --icon-color{syntax:\"<color>\";initial-value:#0000;inherits:true}@property --icon-padding{syntax:\"<length-percentage>\";initial-value:0px;inherits:true}@property --icon-image{syntax:\"<image>\";initial-value:linear-gradient(#0000,#0000);inherits:true}@function --wavy-step(--step <number>){--angle:calc((var(--step, 0) * 2) * 1rad * pi);--variant:calc(cos(var(--clip-freq, 8) * var(--angle, 0deg)) * 0.5 + 0.5);--adjust:calc(var(--variant, 0) * var(--clip-amplitude, 0));--x:calc(50% + (cos(var(--angle, 0deg)) * (0.5 - var(--adjust, 0))) * var(--icon-size, 100%));--y:calc(50% + (sin(var(--angle, 0deg)) * (0.5 - var(--adjust, 0))) * var(--icon-size, 100%));result:var(--x) var(--y)}@layer tokens, base, layout, utilities, shells, shell, views, view, viewer, components, markdown, essentials, overrides;@layer tokens{:where(:root,html){color-scheme:light dark;tab-size:4;text-size-adjust:100%;block-size:stretch;border:none;contain:strict;font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif);font-size:16px;inline-size:stretch;line-height:1.5;margin:0;max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi));min-block-size:0;min-inline-size:0;overflow:hidden;padding:0}}@layer base{@keyframes J{0%{opacity:0;transform:translateY(10%)}to{opacity:1;transform:translateY(0)}}@media screen{*,:after,:before{box-sizing:border-box}:where(html){-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-family:var(--font-sans);font-size:16px;line-height:1.5;text-rendering:optimizeLegibility}:where(body){background:var(--color-bg);block-size:fit-content;border:none;color:var(--color-text);inset:0;line-height:var(--line-height);margin:0;min-block-size:min(100dvb,100cqb);padding:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}:where(ul,ol){list-style:none;margin:0;padding:0}:where(blockquote,q){quotes:none}:where(blockquote,q):after,:where(blockquote,q):before{content:none}:where(table){border:1px solid var(--color-border);border-collapse:collapse;border-radius:var(--border-radius);border-spacing:0;display:block;inline-size:max-content;margin-block:1rem;max-inline-size:100%;overflow-x:auto}:where(table) :where(th,td){border-block-end:1px solid var(--color-border);padding:.5rem 1rem;text-align:start}:where(table) :where(th){background-color:var(--color-table);color:var(--color-text);font-weight:700}:where(table) :where(tr:last-child td){border-block-end:none}:where(table) :where(tr:nth-child(2n)){background-color:var(--color-bg-secondary)}:focus-visible{border-radius:var(--radius-sm,8px);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-primary,#06c) 35%,#0000);outline:none}:focus:not(:focus-visible){outline:none}:where(button,input,optgroup,select,textarea){border:none;color:inherit;font:inherit;letter-spacing:inherit;line-height:1.15;margin:0;outline:none}:where(button){appearance:none;background:#0000;border:none;cursor:pointer;gap:.25rem;min-block-size:fit-content;min-inline-size:fit-content;padding-block:.5rem;padding-inline:1rem;pointer-events:auto;text-transform:none;user-select:none}:where(button):has(>ui-icon:only-child){aspect-ratio:1/1;place-content:center;place-items:center}:where(button):disabled{cursor:not-allowed;pointer-events:none}:where(select){text-transform:none}:where(button,[type=button],[type=reset],[type=submit]){-webkit-appearance:button;cursor:pointer}:where(button,[type=button],[type=reset],[type=submit])::-moz-focus-inner{border-style:none;padding:0}:where(fieldset,dialog){border:none;margin:0;padding:0}:where(legend){padding:0}:where(progress){vertical-align:initial}:where(textarea){overflow:auto;resize:vertical}:where([type=search]){-webkit-appearance:textfield;outline-offset:-2px}:where([type=search])::-webkit-search-decoration{-webkit-appearance:none}:where([type=range]){-webkit-appearance:none}:where(details>summary),:where(summary){cursor:pointer}:where(mark){background-color:initial;color:inherit}:where(sub,sup){font-size:75%;line-height:0;position:relative;vertical-align:initial}:where(sup){top:-.5em}:where(sub){bottom:-.25em}:where(a){color:var(--color-link,inherit);cursor:pointer;pointer-events:auto;text-decoration:inherit;text-underline-offset:.2em;transition:color var(--transition-fast)}:where(a):hover{color:var(--color-primary-hover)}:where(img,canvas,svg,video,iframe,picture){height:auto;max-width:100%}:where(img,video,canvas,svg,picture){block-size:auto;display:block;max-inline-size:100%}:where(img,video){object-fit:contain;object-position:center}:where(picture){display:contents}:where(iframe){block-size:auto;max-inline-size:100%}:where(em,i){font-style:normal}:where(strong,b){font-weight:400}:where(code,kbd,samp,pre){font-family:var(--font-family-mono,\"SF Mono\",\"Monaco\",\"Inconsolata\",\"Roboto Mono\",monospace);font-size:1em}:where(code,pre){font-family:var(--font-mono);font-size:.875em}:where(code,samp,kbd){background-color:var(--bgColor-muted);border-radius:.3em;font-family:var(--font-family-mono,\"SF Mono\",\"Monaco\",\"Roboto Mono\",monospace);font-size:85%;padding:.2em .4em}:where(code){background:var(--color-bg-alt);border-radius:var(--radius-sm);padding:.125em .25em}:where(pre){background:var(--color-bg-alt);border-radius:var(--radius-md);overflow-x:auto;padding:var(--space-md)}:where(pre) :where(code){background:#0000;border-radius:0;padding:0}:where(input,textarea,select,button,option){accent-color:var(--color-link,currentColor);border:0 #0000;font-variant-emoji:text;outline:0 none #0000}:where(span){font-variant-emoji:text}:where(hr){border:none;border-block-start:1px solid var(--color-border);margin-block:var(--space-lg)}::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-track{background:#0000}::-webkit-scrollbar-thumb{background:var(--color-outline-variant,#d1d5db);border-radius:4px}::-webkit-scrollbar-thumb:hover{background:var(--color-outline,#9ca3af)}*{scrollbar-color:var(--color-outline-variant,#d1d5db) #0000;scrollbar-width:thin}:where(input,textarea,select){background-color:var(--color-bg-alt);border:1px solid var(--color-border);border-radius:var(--border-radius);color:var(--color-fg);display:block;font-size:var(--font-size-base);inline-size:100%;padding:.5rem}:where(input,textarea,select):focus{border-color:var(--color-primary);outline:none}:where(input,textarea,select)::placeholder{color:var(--color-text-secondary);opacity:.7}:where(input,textarea,select):disabled{background-color:var(--color-bg-secondary);cursor:not-allowed;opacity:.5}:where(input):-webkit-autofill:first-line,:where(input):autofill:first-line{font-size:1em;text-size-adjust:100%}:where(input):-internal-autofill-previewed{letter-spacing:calc(1em / 10)!important}:where(input):is([type=radio],[type=checkbox]){accent-color:var(--color-primary);aspect-ratio:1/1;block-size:1rem;inline-size:1rem}:where(label){display:block;font-weight:600;margin-block-end:.25rem;pointer-events:none;user-select:none}:where(h1,h2,h3,h4,h5,h6){font-weight:600;line-height:1.2;margin-block:.5em;text-wrap:balance}:where(h1){font-size:2rem}:where(h2){font-size:1.5rem}:where(h3){font-size:1.25rem}:where(h4){font-size:1.125rem}:where(h5){font-size:1rem}:where(h6){font-size:.875rem}:where(p){margin-block:1em;text-wrap:pretty}:where(article,.content) ol,:where(article,.content) ul{margin-block:var(--space-md);padding-inline-start:var(--space-lg)}:where(article,.content) ul{list-style:disc}:where(article,.content) ol{list-style:decimal}:where(blockquote){border-inline-start:.25rem solid var(--color-secondary);color:var(--color-text-secondary);font-style:italic;margin-inline:1rem;padding-inline:1rem}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable){scrollbar-color:var(--color-scrollbar,currentColor) #0000;scrollbar-width:thin}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar{block-size:var(--scrollbar-size,8px);inline-size:var(--scrollbar-size,8px)}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar-track{background:#0000}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar-thumb{background-color:var(--color-scrollbar,currentColor);border-radius:var(--border-radius,4px)}:where(body,main,aside,pre,code,textarea,[data-scrollable],.scrollable)::-webkit-scrollbar-thumb:hover{background:var(--color-outline,#9ca3af)}:not(:defined),:where(link,head,script,style,meta),[hidden]{display:none!important}:not(:defined){opacity:0;pointer-events:none;visibility:collapse}:where(link,head,script,style,meta){pointer-events:none!important}[aria-hidden=true]{opacity:0;pointer-events:none;visibility:collapse}[data-dragging]{cursor:grabbing;will-change:transform}:where(a,button,[role=button]){-webkit-tap-highlight-color:transparent}}@media screen and (prefers-reduced-motion:reduce){*,:after,:before{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}@media screen{[data-scheme=dark],[data-theme=dark]{color-scheme:dark only}[data-scheme=light],[data-theme=light]{color-scheme:light only}[data-scheme=system],[data-theme=system]{color-scheme:light dark}}}@layer layout{@media screen{:where(footer,header,main){margin-inline:auto;padding:0}:where(header){text-align:center}:where(nav){align-items:center;display:flex;flex-wrap:wrap;justify-content:space-between;margin-block-end:0}:where(nav) ul{display:flex;gap:1rem;list-style:none;margin:0;padding:0}:where(nav) ul li{position:relative}:where(nav) a{color:var(--color-link);font-weight:700;text-decoration:none}:where(section){display:flex;flex-wrap:wrap;gap:1rem;justify-content:var(--justify-important,center)}:where(section) :where(aside){border:1px solid var(--color-bg-secondary);border-radius:var(--border-radius);box-shadow:var(--box-shadow);flex:1 1 var(--width-card);inline-size:var(--width-card);padding:1.25rem}}}@layer components{@media screen{:where(dialog){background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--border-radius);box-shadow:var(--box-shadow);color:var(--color-text);margin:auto;max-block-size:85vh;max-inline-size:min(90vw,600px);padding:1rem}:where(dialog)::backdrop{background-color:#00000080}:where(dialog)[open]{animation:J .25s ease-out}:where(button,input[type=submit],input[type=button]){align-items:center;background-color:var(--color-link);border:1px solid #0000;border-radius:var(--border-radius);cursor:pointer;display:inline-flex;font-weight:600;justify-content:center;padding:.5rem 1rem;transition:filter .2s ease,transform .1s ease}:where(button,input[type=submit],input[type=button]):disabled{background-color:var(--color-secondary);cursor:not-allowed;filter:none;opacity:.6}:where(canvas):is([is=ui-canvas]){block-size:stretch;border:none;box-sizing:border-box!important;inline-size:stretch;inset:0;margin:0;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:0;min-inline-size:0;object-fit:cover;object-position:center;padding:0;pointer-events:none;position:absolute;z-index:0}}}@layer ux-agate{@media screen{:host,:root,:scope,:where(body){pointer-events:auto;transition-behavior:allow-discrete;interpolate-size:allow-keywords;content-visibility:auto;--keyboard-inset-bottom:calc(max(env(keyboard-inset-bottom, 0px), 0px) / max(var(--zoom, 1), 0.125));--keyboard-inset-height:calc(max(env(keyboard-inset-height, 0px), 0px) / max(var(--zoom, 1), 0.125))}:host,:root,:scope{--scale:1;--translate-x:0px;--translate-y:0px}:host,:host :where(*),:root,:root :where(*),:scope,:scope :where(*){--scale:1;--translate-x:0px;--translate-y:0px}:root,:where(html){background-color:initial;block-size:stretch;border:0 #0000;contain:none;container-name:html root;container-type:size;display:flex;flex-direction:column;inline-size:stretch;inset:0;inset-block-end:auto;line-height:normal;margin:0;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:min(100cqb,100dvb);min-inline-size:min(100cqi,100dvi);outline:0 none #0000;overflow:visible;padding:0;place-content:start;place-items:start;place-self:start;position:fixed;transform:none;translate:none}:where(body){background-color:initial;block-size:stretch;border:0 #0000;contain:strict;container-name:body;container-type:size;display:inline-flex;font-size:var(--text-base,.9rem);inline-size:stretch;inset:auto;margin:0;max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi));min-block-size:0;min-inline-size:0;outline:0 none #0000;overflow:visible;padding:0;place-content:start;place-items:start;place-self:start;pointer-events:auto;position:relative;transform:none;translate:none}:where(body)>:where(#app,#container,#root,.root){block-size:stretch;inline-size:stretch;max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi));min-block-size:0;min-inline-size:0}:where(body)>:where(*){max-block-size:min(100%,min(100cqb,100dvb));max-inline-size:min(100%,min(100cqi,100dvi))}}}@layer ux-existence{[data-hidden]:not([data-hidden=false]):not([data-opacity-animation]),[data-hidden]:not([data-hidden=false]):not([data-opacity-animation]) *{display:none!important;opacity:0;pointer-events:none!important;touch-action:none!important;visibility:collapse}:host([data-hidden]:not([data-hidden=false]:not([data-opacity-animation]))),:host([data-hidden]:not([data-hidden=false]:not([data-opacity-animation]))) *,:host([data-hidden]:not([data-hidden=false]:not([data-opacity-animation]))) ::slotted(*){display:none!important;opacity:0;pointer-events:none!important;touch-action:none!important;visibility:collapse}:host([data-hidden]:not([data-hidden=false])),:host([data-hidden]:not([data-hidden=false])) *,:host([data-hidden]:not([data-hidden=false])) ::slotted(*){pointer-events:none!important;touch-action:none!important;user-select:none!important}[data-hidden]:not([data-hidden=false]),[data-hidden]:not([data-hidden=false]) *{pointer-events:none!important;touch-action:none!important;user-select:none!important}}@property --item-size{syntax:\"<length-percentage>\";inherits:true;initial-value:100%}@layer ux-gridbox{.ui-gridlayout{--os-layout-c:var(--layout-c,4);--os-layout-r:var(--layout-r,8);--cs-layout-c:--get-oriented-size-num(var(--orient,0),var(--os-layout-c,4),var(--os-layout-r,8),0);--cs-layout-r:--get-oriented-size-num(var(--orient,0),var(--os-layout-c,4),var(--os-layout-r,8),1);--c-gap:clamp(min(1rem,8cqmin),min(calc(8cqmin / min(var(--layout-c, 4), var(--layout-r, 8))),calc(6cqmax / max(var(--layout-c, 4), var(--layout-r, 8)))),min(4rem,16cqmin));--r-gap:clamp(min(1rem,8cqmin),min(calc(8cqmin / min(var(--layout-c, 4), var(--layout-r, 8))),calc(6cqmax / max(var(--layout-c, 4), var(--layout-r, 8)))),min(4rem,16cqmin));background-color:initial;block-size:stretch;box-sizing:border-box!important;contain:none!important;container-name:u2-grid;container-type:normal!important;direction:ltr;display:grid!important;gap:0!important;grid-column:1/-1;grid-row:1/-1;grid-template-columns:repeat(round(nearest,var(--cs-layout-c,4),1),minmax(0,1fr))!important;grid-template-rows:repeat(round(nearest,var(--cs-layout-r,8),1),minmax(0,1fr))!important;inline-size:stretch;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;overflow:visible!important;padding:0!important;place-content:center!important;place-items:center!important;pointer-events:none!important;position:relative!important;text-align:center!important;zoom:1}.ui-gridlayout>:where(*){--cs-sw-unit-x:calc(var(--cs-size-x, 100cqi) / var(--cs-layout-c, 1));--cs-sw-unit-y:calc(var(--cs-size-y, 100cqb) / var(--cs-layout-r, 1))}.ui-gridlayout>:where(*){--cs-transition-c:0px;--cs-transition-r:0px}.ui-gridlayout>:where(*)[data-dragging]{--cs-transition-c:calc((var(--rv-grid-c, 0) - var(--cs-grid-c, 0)) * var(--cs-sw-unit-x, 1px));--cs-transition-r:calc((var(--rv-grid-r, 0) - var(--cs-grid-r, 0)) * var(--cs-sw-unit-y, 1px))}.ui-gridlayout>:where(*){--p-cell-x:var(--cell-x);--p-cell-y:var(--cell-y);--f-col:clamp(4,var(--layout-c,4),6);--f-row:clamp(6,var(--layout-r,8),12);--grid-c:clamp(0,var(--cell-x),var(--f-col) - 1);--grid-r:clamp(0,var(--cell-y),var(--f-row) - 1);--p-grid-c:clamp(0,var(--p-cell-x),var(--f-col) - 1);--p-grid-r:clamp(0,var(--p-cell-y),var(--f-row) - 1);--fc-cell-x:clamp(0,var(--cs-grid-c,0),var(--f-col) - 1);--fc-cell-y:clamp(0,var(--cs-grid-r,0),var(--f-row) - 1);--fp-cell-x:clamp(0,var(--cs-p-grid-c,0),var(--f-col) - 1);--fp-cell-y:clamp(0,var(--cs-p-grid-r,0),var(--f-row) - 1);--dir-x:calc(var(--cs-grid-c, 0) - var(--cs-p-grid-c, 0));--dir-y:calc(var(--cs-grid-r, 0) - var(--cs-p-grid-r, 0))}.ui-gridlayout>:where(*){--rv-grid-c:var(--cs-grid-c,1);--rv-grid-r:var(--cs-grid-r,1)}.ui-gridlayout>:where(*)[data-dragging]{--rv-grid-c:var(--cs-p-grid-c,1);--rv-grid-r:var(--cs-p-grid-r,1)}.ui-gridlayout>:where(*){--os-grid-c:var(--grid-c,1);--os-grid-r:var(--grid-r,1);--cs-grid-c:--get-oriented-coord-num(var(--orient,0),var(--os-grid-c,1),var(--os-grid-r,1),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),0);--cs-grid-r:--get-oriented-coord-num(var(--orient,0),var(--os-grid-c,1),var(--os-grid-r,1),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),1)}.ui-gridlayout>:where(*){--os-p-grid-c:var(--p-cell-x,0);--os-p-grid-r:var(--p-cell-y,0);--cs-p-grid-c:--get-oriented-coord-num(var(--orient,0),var(--os-p-grid-c,0),var(--os-p-grid-r,0),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),0);--cs-p-grid-r:--get-oriented-coord-num(var(--orient,0),var(--os-p-grid-c,0),var(--os-p-grid-r,0),calc(var(--f-col, 1) - 1),calc(var(--f-row, 1) - 1),1)}.ui-gridlayout>:where(*){--ox-c-unit:calc(var(--os-size-x, 100cqi) / var(--os-layout-c, 1));--ox-r-unit:calc(var(--os-size-y, 100cqb) / var(--os-layout-r, 1));--os-inset-x:calc((var(--grid-c, 1) + 0.5) * var(--ox-c-unit, 1px));--os-inset-y:calc((var(--grid-r, 1) + 0.5) * var(--ox-r-unit, 1px))}.ui-gridlayout>:where(*){--item-size:clamp(4rem,calc(100cqmax / min(var(--cs-layout-c, 4), var(--cs-layout-r, 8))),5rem)}.ui-gridlayout>:where(*) :where(*){--drag-x:0;--drag-y:0}.ui-gridlayout>:where(*){--drag-x:0;--cs-drag-x:calc(var(--drag-x, 0) * 1px);--drag-y:0;--cs-drag-y:calc(var(--drag-y, 0) * 1px)}.ui-gridlayout>:where(*) :active,.ui-gridlayout>:where(*):active,.ui-gridlayout>:where(*):has(:active){will-change:transform}.ui-gridlayout>:where(*){block-size:var(--item-size,stretch);cursor:pointer;grid-column:clamp(1,1 + round(nearest,var(--cs-grid-c,0),1),var(--cs-layout-c,4))!important;grid-row:clamp(1,1 + round(nearest,var(--cs-grid-r,0),1),var(--cs-layout-r,8))!important;inline-size:var(--item-size,stretch);inset:auto!important;max-block-size:var(--item-size,stretch);max-inline-size:var(--item-size,stretch);min-block-size:fit-content;min-inline-size:fit-content;place-self:center!important;pointer-events:none;position:relative!important;touch-action:none;transform:translate3d(round(nearest,var(--cs-drag-x,0) + var(--cs-transition-c,0),1px/var(--pixel-ratio,1)),round(nearest,var(--cs-drag-y,0) + var(--cs-transition-r,0),1px/var(--pixel-ratio,1)),0) scale3d(var(--scale,1),var(--scale,1),var(--scale,1)) translate3d(round(nearest,var(--translate-x,0),1px/var(--pixel-ratio,1)),round(nearest,var(--translate-y,0),1px/var(--pixel-ratio,1)),0)!important;transform-origin:50% 50%!important;translate:0 0 0!important;visibility:visible;z-index:1;zoom:1;-webkit-user-drag:none;-moz-user-drag:none;border:0 #0000;contain:none;isolation:isolate;outline:0 none #0000;overflow:visible;user-select:none}.ui-gridlayout>:where(*),.ui-gridlayout>:where(*) span,.ui-gridlayout>:where(*)>*{--drag-distance:clamp(0,hypot(var(--dir-x,0),var(--dir-y,0)),6);--drag-duration:clamp(96ms,calc(var(--drag-distance, 0) * 110ms + 70ms),360ms);background-image:none;border:0 #0000;box-shadow:none;filter:none;outline:0 none #0000;pointer-events:none;touch-action:none;transition-behavior:allow-discrete;transition-delay:0s;transition-duration:var(--drag-duration);transition-property:opacity,background-color,color;transition-timing-function:cubic-bezier(.22,.8,.3,1);user-select:none}.ui-gridlayout>:where(*){pointer-events:auto}.ui-gridlayout>:where(*) label,.ui-gridlayout>:where(*) span,.ui-gridlayout>:where(*) ui-icon,.ui-gridlayout>:where(*).label,.ui-gridlayout>:where(*).span,.ui-gridlayout>:where(*).ui-icon{pointer-events:none}.ui-gridlayout>:where(*) ui-icon{pointer-events:none}@media (prefers-reduced-motion:reduce){.ui-gridlayout>:where(*){transition-duration:0s;transition-timing-function:linear}}.ui-gridlayout>:where(*)>:where(*){block-size:stretch;grid-column:1/-1;grid-row:1/-1;inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:1px;min-inline-size:1px}.ui-gridlayout.sd-grid--labels,.ui-gridlayout[data-layer=labels]{isolation:isolate;mix-blend-mode:normal;pointer-events:none!important}.ui-gridlayout.sd-grid--labels>:where(*),.ui-gridlayout[data-layer=labels]>:where(*){pointer-events:none}.ui-gridlayout.sd-grid--labels>:where(.ui-ws-item-label),.ui-gridlayout[data-layer=labels]>:where(.ui-ws-item-label){align-items:center;block-size:stretch;color:color-mix(in oklch,var(--on-surface-color) 78%,#0000 22%);display:flex;flex-direction:column;font-size:clamp(.65rem,1.35cqmin,1rem);font-weight:500;gap:clamp(.1rem,.35cqmin,.35rem);inline-size:100%;justify-content:flex-start;letter-spacing:.015em;padding-block-start:clamp(.25rem,.65cqmin,.65rem);text-align:center;text-shadow:0 1px 2px color-mix(in oklch,var(--surface-color) 35%,#0000),0 0 .35rem color-mix(in oklch,var(--surface-color) 15%,#0000);text-wrap:balance;translate:0 calc(clamp(.25rem, .65cqmin, .65rem) + var(--cs-sw-unit-y, 0px))}.ui-gridlayout.sd-grid--labels>:where(.ui-ws-item-label) span,.ui-gridlayout[data-layer=labels]>:where(.ui-ws-item-label) span{background-image:none;contain:layout paint;content-visibility:auto;max-inline-size:min(8ch,100%);opacity:.9;pointer-events:none;touch-action:none;user-select:none}}@layer ux-orientbox{.ui-orientbox{--in-orient-base:round(nearest,var(--orient,0),1);--in-rev-cond-x:clamp(0,calc(var(--in-orient-base, 0) - 1),1);--in-rev-cond-y:clamp(0,calc((1 - abs(calc(var(--in-orient-base, 0) - 1.5))) * 2),1);--in-swap-cond:css-rem(var(--orient,0),2);--in-rev-vx:calc(var(--in-rev-cond-x, 1) * -2 + 1);--in-rev-vy:calc(var(--in-rev-cond-y, 1) * -2 + 1);--os-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqi),var(--cs-size-y,100cqb),0);--os-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqb),var(--cs-size-y,100cqi),1);--os-self-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),0);--os-self-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),1);--cs-inset-x:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),0);--cs-inset-y:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),1);--cs-drag-x:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),0);--cs-drag-y:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),1);--cs-size-x:100cqi;--cs-size-y:100cqb;background-color:initial;block-size:stretch;border-radius:var(--radius-lg);contain:strict!important;container-type:size!important;direction:ltr!important;font-size:16px;grid-column:1/-1;grid-row:1/-1;inline-size:stretch;inset:0;max-block-size:min(100%,min(100cqb,100dvb))!important;max-inline-size:min(100%,min(100cqi,100dvi))!important;min-block-size:0;min-inline-size:0;place-self:start;pointer-events:none;position:relative;writing-mode:horizontal-tb!important;zoom:max(var(--zoom,1),.125);--zoom:max(var(--scaling,1),0.125);--zpx:calc(1px / max(var(--zoom, 1), 0.125));--ppx:calc(1px / max(var(--pixel-ratio, 1), 0.125))}.ui-orientbox :where(ui-frame,.u2-grid-item,ui-modal,[is=ui-orientbox],[is=ui-gridbox],[is=ui-orientbox]>:where(*),[is=ui-gridbox]>:where(*),.ui-gridlayout,.ui-gridlayout>:where(*)),.ui-orientbox>:where(*){--in-orient-base:round(nearest,var(--orient,0),1);--in-rev-cond-x:clamp(0,calc(var(--in-orient-base, 0) - 1),1);--in-rev-cond-y:clamp(0,calc((1 - abs(calc(var(--in-orient-base, 0) - 1.5))) * 2),1);--in-swap-cond:css-rem(var(--orient,0),2);--in-rev-vx:calc(var(--in-rev-cond-x, 1) * -2 + 1);--in-rev-vy:calc(var(--in-rev-cond-y, 1) * -2 + 1)}.ui-orientbox :where(ui-frame,.u2-grid-item,ui-modal,[is=ui-orientbox],[is=ui-gridbox],[is=ui-orientbox]>:where(*),[is=ui-gridbox]>:where(*),.ui-gridlayout,.ui-gridlayout>:where(*)),.ui-orientbox>:where(*){--os-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqi),var(--cs-size-y,100cqb),0);--os-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-size-x,100cqb),var(--cs-size-y,100cqi),1);--os-self-size-x:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),0);--os-self-size-y:--get-oriented-size(mod(4 - var(--orient,0),4),var(--cs-self-size-x,100%),var(--cs-self-size-y,100%),1)}.ui-orientbox :where(ui-frame,.u2-grid-item,ui-modal,[is=ui-orientbox],[is=ui-gridbox],[is=ui-orientbox]>:where(*),[is=ui-gridbox]>:where(*),.ui-gridlayout,.ui-gridlayout>:where(*)),.ui-orientbox>:where(*){--cs-inset-x:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),0);--cs-inset-y:--get-oriented-coordinate(var(--orient,0),var(--os-inset-x,0px),var(--os-inset-y,0px),var(--os-size-x,100cqi),var(--os-size-y,100cqb),1);--cs-drag-x:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),0);--cs-drag-y:--get-oriented-vector(var(--orient,0),var(--os-drag-x,0px),var(--os-drag-y,0px),1)}.ui-orientbox .center-self{inset:var(--cs-inset-y,0) auto auto var(--cs-inset-x,0);place-self:center;transform:translate3d(round(nearest,var(--cs-drag-x,0),1px/var(--pixel-ratio,1)),round(nearest,var(--cs-drag-y,0),1px/var(--pixel-ratio,1)),0) scale3d(var(--scale,1),var(--scale,1),var(--scale,1)) translate3d(round(nearest,calc(var(--translate-x, 0px) - 50%),1px/var(--pixel-ratio,1)),round(nearest,calc(var(--translate-y, 0px) - 50%),1px/var(--pixel-ratio,1)),0);transform-origin:0 0}.ui-orientbox .fixed{position:fixed!important}.ui-orientbox .absolute,.ui-orientbox .fixed{inset:var(--cs-inset-y,0) auto auto var(--cs-inset-x,0)}.ui-orientbox .absolute{position:absolute!important}.native-portrait-optimized{--in-swap-cond:0}@media (orientation:portrait){.native-portrait-optimized{--in-swap-cond:0}}@media (orientation:landscape){.native-portrait-optimized{--in-swap-cond:1}}}@layer ux-animation{}";

async function loadAdvancedStyles() {
  try {
    if (advancedStyles) {
      await loadAsAdopted(advancedStyles);
      console.log("[Veela/Advanced] Advanced styles loaded");
    }
  } catch (e) {
    console.warn("[Veela/Advanced] Failed to load advanced styles:", e);
  }
}

async function loadBeerCssStyles() {
  try {
    const beerStyles = await __vitePreload(() => import('./_index.js'),true              ?[]:void 0,import.meta.url);
    if (beerStyles.default) {
      await loadAsAdopted(beerStyles.default);
      console.log("[Veela/BeerCSS] Beer CSS compatible styles loaded");
    }
  } catch (e) {
    console.warn("[Veela/BeerCSS] Failed to load Beer CSS styles:", e);
  }
}

let _loadedVariant = null;
async function loadVeelaVariant(variant) {
  if (_loadedVariant === variant) {
    console.log(`[Veela] Variant '${variant}' already loaded`);
    return;
  }
  console.log(`[Veela] Loading variant: ${variant}`);
  await loadCoreStyles();
  switch (variant) {
    case "core": {
      await loadCoreStyles();
      break;
    }
    case "basic": {
      await loadBasicStyles();
      break;
    }
    case "advanced": {
      await loadAdvancedStyles();
      break;
    }
    case "beercss": {
      await loadBeerCssStyles();
      break;
    }
    default:
      console.warn(`[Veela] Unknown variant: ${variant}, using basic`);
      await loadBasicStyles();
      break;
  }
  _loadedVariant = variant;
}

const STYLE_CONFIGS = {
  "raw": {
    name: "Raw (No Framework)",
    stylesheets: [],
    description: "No CSS framework, raw browser defaults",
    recommendedShells: ["base"]
  },
  "vl-core": {
    name: "Core (Shared Foundation)",
    stylesheets: [],
    description: "Shared foundation styles for all veela variants",
    recommendedShells: ["faint", "base"]
  },
  "vl-basic": {
    name: "Basic Veela Styles",
    stylesheets: [],
    description: "Minimal styling for basic functionality",
    recommendedShells: ["minimal", "base"]
  },
  "vl-advanced": {
    name: "Advanced (Full-Featured Styling)",
    stylesheets: [],
    description: "Full-featured styling with design tokens and effects",
    recommendedShells: ["faint", "minimal"]
  },
  "vl-beercss": {
    name: "BeerCSS (Beer CSS Compatible)",
    stylesheets: [],
    description: "Beer CSS compatible styling with Material Design 3",
    recommendedShells: ["faint"]
  }
};
class BootLoader {
  static instance;
  // State (use object for mutable state tracking)
  state = {
    phase: "idle",
    styleSystem: null,
    shell: null,
    view: null,
    error: null
  };
  // State change handlers
  stateChangeHandlers = /* @__PURE__ */ new Set();
  // Loaded shell instance
  shellInstance = null;
  // Phase handlers for customization
  phaseHandlers = /* @__PURE__ */ new Map();
  constructor() {
    initializeRegistries();
  }
  static getInstance() {
    if (!BootLoader.instance) {
      BootLoader.instance = new BootLoader();
    }
    return BootLoader.instance;
  }
  // ========================================================================
  // BOOT SEQUENCE
  // ========================================================================
  /**
   * Execute the boot sequence
   */
  async boot(container, config) {
    console.log("[BootLoader] Starting boot sequence:", config);
    try {
      const persistedSettings = await loadSettings().catch((error) => {
        console.warn("[BootLoader] Failed to load settings:", error);
        return null;
      });
      const persistedTheme = this.resolveThemeFromSettings(persistedSettings);
      await this.loadStyles(config.styleSystem);
      const shell = await this.loadShell(config.shell, container);
      shell.setTheme(config.theme || persistedTheme);
      await shell.mount(container);
      if (persistedSettings) {
        applyTheme(persistedSettings);
      }
      if (config.channels && config.channels.length > 0) {
        await this.initChannels(config.channels);
      }
      await shell.navigate(config.defaultView);
      this.setPhase("ready");
      if (config.rememberChoice) {
        this.savePreferences(config);
      }
      console.log("[BootLoader] Boot complete");
      return shell;
    } catch (error) {
      console.error("[BootLoader] Boot failed:", error);
      this.updateState({
        phase: "error",
        error
      });
      throw error;
    }
  }
  resolveThemeFromSettings(settings) {
    const theme = settings?.appearance?.theme || "auto";
    if (theme === "dark") return darkTheme;
    if (theme === "light") return lightTheme;
    return defaultTheme;
  }
  /**
   * Load style system
   */
  async loadStyles(styleSystem) {
    this.setPhase("styles");
    console.log(`[BootLoader] Loading style system: ${styleSystem}`);
    const config = STYLE_CONFIGS[styleSystem] || STYLE_CONFIGS["vl-basic"];
    try {
      const veelaVariant = styleSystem?.replace?.("veela-", "")?.replace?.("vl-", "") || "basic";
      console.log(`[BootLoader] Loading Veela variant: ${veelaVariant}`);
      await loadVeelaVariant(veelaVariant);
      console.log("[BootLoader] Veela CSS loaded");
    } catch (error) {
      console.warn("[BootLoader] Failed to load Veela CSS, using fallback:", error);
    }
    for (const sheet of config.stylesheets) {
      try {
        await loadAsAdopted(sheet);
      } catch (error) {
        console.warn(`[BootLoader] Failed to load stylesheet: ${sheet}`, error);
      }
    }
    this.updateState({ styleSystem });
    console.log(`[BootLoader] Style system ${styleSystem} loaded`);
  }
  /**
   * Load and initialize shell
   */
  async loadShell(shellId, container) {
    this.setPhase("shell");
    console.log(`[BootLoader] Loading shell: ${shellId}`);
    const shell = await ShellRegistry.load(shellId, container);
    this.shellInstance = shell;
    this.updateState({ shell: shellId });
    console.log(`[BootLoader] Shell ${shellId} loaded`);
    return shell;
  }
  /**
   * Initialize service channels
   */
  async initChannels(channelIds) {
    this.setPhase("channels");
    console.log(`[BootLoader] Initializing channels:`, channelIds);
    for (const channelId of channelIds) {
      try {
        await serviceChannels.initChannel(channelId);
      } catch (error) {
        console.warn(`[BootLoader] Failed to init channel ${channelId}:`, error);
      }
    }
    console.log(`[BootLoader] Channels initialized`);
  }
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  /**
   * Update state and notify handlers
   */
  updateState(partial) {
    Object.assign(this.state, partial);
    this.notifyStateChange();
  }
  /**
   * Set current phase and notify handlers
   */
  setPhase(phase) {
    this.updateState({ phase });
    const handlers = this.phaseHandlers.get(phase);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(this.state);
        } catch (error) {
          console.error(`[BootLoader] Phase handler error:`, error);
        }
      }
    }
  }
  /**
   * Notify all state change handlers
   */
  notifyStateChange() {
    for (const handler of this.stateChangeHandlers) {
      try {
        handler(this.state);
      } catch (error) {
        console.error(`[BootLoader] State handler error:`, error);
      }
    }
  }
  /**
   * Subscribe to state changes
   */
  onStateChange(handler) {
    this.stateChangeHandlers.add(handler);
    return () => {
      this.stateChangeHandlers.delete(handler);
    };
  }
  /**
   * Register a phase handler
   */
  onPhase(phase, handler) {
    if (!this.phaseHandlers.has(phase)) {
      this.phaseHandlers.set(phase, /* @__PURE__ */ new Set());
    }
    this.phaseHandlers.get(phase).add(handler);
    return () => {
      this.phaseHandlers.get(phase)?.delete(handler);
    };
  }
  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get current shell instance
   */
  getShell() {
    return this.shellInstance;
  }
  // ========================================================================
  // PREFERENCES
  // ========================================================================
  /**
   * Save boot preferences
   */
  savePreferences(config) {
    try {
      localStorage.setItem("rs-boot-style", config.styleSystem);
      localStorage.setItem("rs-boot-shell", config.shell);
      localStorage.setItem("rs-boot-view", config.defaultView);
      localStorage.setItem("rs-boot-remember", "1");
    } catch (error) {
      console.warn("[BootLoader] Failed to save preferences:", error);
    }
  }
  /**
   * Load boot preferences
   */
  loadPreferences() {
    try {
      const remember = localStorage.getItem("rs-boot-remember");
      if (remember !== "1") return null;
      return {
        styleSystem: localStorage.getItem("rs-boot-style") || void 0,
        shell: localStorage.getItem("rs-boot-shell") || void 0,
        defaultView: localStorage.getItem("rs-boot-view") || void 0
      };
    } catch {
      return null;
    }
  }
  /**
   * Clear preferences
   */
  clearPreferences() {
    try {
      localStorage.removeItem("rs-boot-style");
      localStorage.removeItem("rs-boot-shell");
      localStorage.removeItem("rs-boot-view");
      localStorage.removeItem("rs-boot-remember");
    } catch {
    }
  }
}
const bootLoader = BootLoader.getInstance();

const CRX_VIEW_MAP = {
  "markdown": "viewer",
  "markdown-viewer": "viewer"
};
const resolveViewId = (input) => (input && CRX_VIEW_MAP[input]) ?? input ?? "viewer";
async function crxFrontend(mountElement, options = {}) {
  const view = resolveViewId(options.initialView);
  const hasViewParams = Boolean(options.viewParams && Object.keys(options.viewParams).length > 0);
  const hasPayload = options.viewPayload !== void 0 && options.viewPayload !== null;
  const shell = await bootLoader.boot(mountElement, {
    styleSystem: "vl-basic",
    shell: "base",
    defaultView: view,
    channels: [],
    rememberChoice: false
  });
  if (hasViewParams) {
    await shell.navigate(view, options.viewParams);
  }
  if (hasPayload) {
    const loadedView = ViewRegistry.getLoaded(view);
    const asMessageCapable = loadedView;
    if (asMessageCapable?.canHandleMessage?.("content-load") && asMessageCapable.handleMessage) {
      await asMessageCapable.handleMessage({
        type: "content-load",
        data: options.viewPayload
      });
    } else if (asMessageCapable?.handleMessage) {
      await asMessageCapable.handleMessage({
        type: "launch",
        data: options.viewPayload
      });
    }
  }
  return shell;
}

export { ViewRegistry, applyTheme, crxFrontend, loadVeelaVariant };
//# sourceMappingURL=crx-entry.js.map
