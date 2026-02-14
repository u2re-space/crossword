import { detectExecutionContext, supportsDedicatedWorkers } from './Env.js';
import { createQueuedOptimizedWorkerChannel } from './Settings.js';
import { BUILT_IN_AI_ACTIONS, AI_INSTRUCTIONS } from './templates.js';

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
      window.addEventListener("message", (event) => {
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
function getUnifiedMessaging$1(config) {
  if (!defaultInstance) {
    defaultInstance = new UnifiedMessagingManager(config);
  }
  return defaultInstance;
}

const BROADCAST_CHANNELS = {
  CLIPBOARD: "rs-clipboard",
  // App Component Channels (for AppCommunicator)
  WORK_CENTER: "rs-workcenter",
  MARKDOWN_VIEWER: "rs-markdown-viewer",
  SETTINGS: "rs-settings",
  FILE_EXPLORER: "file-explorer",
  PRINT_VIEWER: "print-viewer",
  HISTORY_CHANNEL: "history",
  PRINT_CHANNEL: "print"};
const COMPONENTS = {
  // Core Components
  WORK_CENTER: "workcenter",
  MARKDOWN_VIEWER: "markdown-viewer",
  MARKDOWN_EDITOR: "markdown-editor",
  SETTINGS: "settings",
  HISTORY: "history",
  FILE_EXPLORER: "file-explorer",
  BASIC_PRINT: "basic-print"};
const ROUTE_HASHES = {
  // Basic app views
  MARKDOWN_VIEWER: "#markdown-viewer",
  MARKDOWN_EDITOR: "#markdown-editor",
  SETTINGS: "#settings",
  HISTORY: "#history",
  WORKCENTER: "#workcenter",
  FILE_EXPLORER: "#file-explorer",
  PRINT: "#print"};
const DESTINATIONS = {
  WORKCENTER: "workcenter",
  CLIPBOARD: "clipboard",
  MARKDOWN_VIEWER: "markdown-viewer",
  SETTINGS: "settings",
  FILE_EXPLORER: "file-explorer",
  PRINT_VIEWER: "print-viewer"};

const UNIFIED_PROCESSING_RULES = {
  "share-target": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "write-clipboard",
      onAccept: "attach-to-associated",
      doProcess: "instantly",
      openApp: true
    },
    supportedContentTypes: ["text", "markdown", "image", "url"],
    defaultOverrideFactors: []
    // Use default associations
  },
  "launch-queue": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "none",
      onAccept: "attach-to-associated",
      doProcess: "manually",
      openApp: true
    },
    supportedContentTypes: ["file", "blob", "text", "markdown", "image"],
    defaultOverrideFactors: []
    // Use default associations
  },
  "crx-snip": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "write-clipboard",
      onAccept: "attach-to-associated",
      doProcess: "instantly",
      openApp: false
      // Don't open PWA for background processing
    },
    supportedContentTypes: ["text", "image"],
    defaultOverrideFactors: ["force-processing"]
    // Force processing for CRX snips
  },
  "paste": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "none",
      onAccept: "attach-to-associated",
      doProcess: "manually",
      openApp: false
    },
    supportedContentTypes: ["text", "markdown", "image"],
    defaultOverrideFactors: [],
    associationOverrides: {
      // When user explicitly pastes and wants to process, override defaults
      "text": ["user-action"],
      "markdown": ["user-action"]
    }
  },
  "drop": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "none",
      onAccept: "attach-to-associated",
      doProcess: "manually",
      openApp: false
    },
    supportedContentTypes: ["file", "blob", "text", "markdown", "image"],
    defaultOverrideFactors: [],
    associationOverrides: {
      // When user drops files explicitly, treat as user action
      "file": ["user-action"],
      "blob": ["user-action"]
    }
  },
  "button-attach-workcenter": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "none",
      onAccept: "attach-to-workcenter",
      doProcess: "manually",
      openApp: false
    },
    supportedContentTypes: ["text", "markdown", "image", "file"],
    defaultOverrideFactors: ["explicit-workcenter"],
    // Always override to workcenter
    associationOverrides: {
      // Explicit button clicks always go to workcenter
      "markdown": ["explicit-workcenter"],
      // Override default viewer association
      "text": ["explicit-workcenter"],
      // Override default viewer association
      "image": ["explicit-workcenter"],
      // Already goes to workcenter, but explicit
      "file": ["explicit-workcenter"]
      // Override file-explorer association
    }
  }
};
Object.fromEntries(
  Object.entries(UNIFIED_PROCESSING_RULES).map(([key, config]) => [
    key,
    {
      processingUrl: config.processingUrl,
      contentAction: config.contentAction,
      ...config.supportedContentTypes && { supportedContentTypes: config.supportedContentTypes }
    }
  ])
);
const AI_PROCESSING_TYPES = [
  "solve-and-answer",
  "write-code",
  "extract-css",
  "recognize-content",
  "convert-data",
  "extract-entities",
  "general-processing"
];
const toAIProcessingType = (id) => {
  const normalized = String(id || "").toLowerCase().replace(/_/g, "-");
  return AI_PROCESSING_TYPES.includes(normalized) ? normalized : null;
};
BUILT_IN_AI_ACTIONS.map((action) => {
  const type = toAIProcessingType(action.id);
  if (!type) return null;
  return {
    type,
    instruction: AI_INSTRUCTIONS[action.instructionKey],
    supportedContentTypes: action.supportedContentTypes,
    priority: action.priority
  };
}).filter((v) => Boolean(v));

const APP_CHANNEL_MAPPINGS = {
  [DESTINATIONS.WORKCENTER]: BROADCAST_CHANNELS.WORK_CENTER,
  [DESTINATIONS.CLIPBOARD]: BROADCAST_CHANNELS.CLIPBOARD,
  [DESTINATIONS.MARKDOWN_VIEWER]: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
  [DESTINATIONS.SETTINGS]: BROADCAST_CHANNELS.SETTINGS,
  [DESTINATIONS.FILE_EXPLORER]: BROADCAST_CHANNELS.FILE_EXPLORER,
  [DESTINATIONS.PRINT_VIEWER]: BROADCAST_CHANNELS.PRINT_VIEWER
};
let appMessagingInstance = null;
function getUnifiedMessaging() {
  if (!appMessagingInstance) {
    appMessagingInstance = getUnifiedMessaging$1({
      channelMappings: APP_CHANNEL_MAPPINGS,
      queueOptions: {
        dbName: "CrossWordMessageQueue",
        storeName: "messages",
        maxRetries: 3,
        defaultExpirationMs: 24 * 60 * 60 * 1e3
        // 24 hours
      },
      pendingStoreOptions: {
        storageKey: "rs-unified-messaging-pending",
        maxMessages: 200,
        defaultTTLMs: 24 * 60 * 60 * 1e3
        // 24 hours
      }
    });
  }
  return appMessagingInstance;
}
const unifiedMessaging = getUnifiedMessaging();
function registerHandler(destination, handler) {
  unifiedMessaging.registerHandler(destination, handler);
}
function unregisterHandler(destination, handler) {
  unifiedMessaging.unregisterHandler(destination, handler);
}
function initializeComponent(componentId) {
  return unifiedMessaging.initializeComponent(componentId);
}
function registerComponent(componentId, destination) {
  unifiedMessaging.registerComponent(componentId, destination);
}

const UnifiedMessaging = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    getUnifiedMessaging,
    initializeComponent,
    registerComponent,
    registerHandler,
    unifiedMessaging,
    unregisterHandler
}, Symbol.toStringTag, { value: 'Module' }));

export { BROADCAST_CHANNELS, COMPONENTS, ROUTE_HASHES, UnifiedMessaging, initializeComponent, registerComponent, registerHandler, unregisterHandler };
//# sourceMappingURL=UnifiedMessaging.js.map
