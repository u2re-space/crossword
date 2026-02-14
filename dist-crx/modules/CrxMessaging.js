import { detectExecutionContext } from './Env.js';
import { createQueuedOptimizedWorkerChannel, createChromeExtensionBroadcast } from './Settings.js';

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

const getCrxContext = () => {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    if (typeof document !== "undefined" && document.contentType) {
      return "content-script";
    }
    if (typeof chrome.runtime.getBackgroundPage !== "undefined") {
      return "background";
    }
    if (typeof chrome.offscreen !== "undefined") {
      return "offscreen";
    }
    if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
      return "service-worker";
    }
    return "popup";
  }
  return "content-script";
};
const isCrxEnvironment = () => {
  return typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
};
class CrxRuntimeChannel {
  constructor(target) {
    this.target = target;
    this.context = getCrxContext();
    this.isCrxEnv = isCrxEnvironment();
    if (this.isCrxEnv) {
      this.broadcastChannel = createChromeExtensionBroadcast(target || "background");
    }
    this.festUniformChannel = createChromeExtensionRuntimeChannel(target || "background");
    this.setupMessageForwarding();
  }
  festUniformChannel;
  broadcastChannel;
  listeners = /* @__PURE__ */ new Map();
  pendingRequests = /* @__PURE__ */ new Map();
  context;
  isCrxEnv;
  setupMessageForwarding() {
    if (this.isCrxEnv && this.broadcastChannel) {
      this.broadcastChannel.addEventListener("message", (event) => {
        const message = event.data;
        const sender = event.source || {};
        const sendResponse = (response) => {
          this.broadcastChannel?.postMessage({
            id: message.id,
            type: "response",
            result: response,
            source: this.context
          });
        };
        this.handleIncomingMessage(message, sender, sendResponse);
        return true;
      });
    } else if (!this.isCrxEnv && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleIncomingMessage(message, sender, sendResponse);
        return true;
      });
    }
  }
  handleIncomingMessage(message, sender, sendResponse) {
    if (!this.isCrxEnv) {
      console.log("[CrxRuntimeChannel] Not in CRX environment, rejecting message");
      sendResponse({
        success: false,
        error: "Not in Chrome extension environment",
        source: this.context
      });
      return;
    }
    try {
      if (message && typeof message === "object" && message.id && message.type) {
        const unifiedMessage = message;
        if (!unifiedMessage.target || unifiedMessage.target === this.context) {
          if (unifiedMessage.type.startsWith("request:")) {
            const actualType = unifiedMessage.type.replace("request:", "");
            const listener = this.listeners.get(actualType);
            if (listener) {
              listener(unifiedMessage.data)?.then((result) => {
                sendResponse({
                  id: unifiedMessage.id,
                  type: `response:${actualType}`,
                  success: true,
                  result,
                  source: this.context
                });
              })?.catch((error) => {
                sendResponse({
                  id: unifiedMessage.id,
                  type: `response:${actualType}`,
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                  source: this.context
                });
              });
            } else {
              sendResponse({
                id: unifiedMessage.id,
                type: `response:${unifiedMessage.type}`,
                success: false,
                error: `No handler for type: ${actualType}`,
                source: this.context
              });
            }
          }
        } else {
          sendResponse({
            id: unifiedMessage.id,
            type: "response:not-targeted",
            success: false,
            error: "Message not targeted at this context",
            source: this.context
          });
        }
      } else {
        sendResponse({
          success: false,
          error: "Invalid message format",
          source: this.context
        });
      }
    } catch (error) {
      console.error("[CrxRuntimeChannel] Error handling message:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        source: this.context
      });
    }
  }
  async request(method, args = [], options) {
    if (!this.isCrxEnv) {
      throw new Error("CrxRuntimeChannel: Chrome extension messaging is only available in Chrome extension context. Current context: " + this.context);
    }
    const timeout = options?.timeout || 3e4;
    const messageId = `crx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout: ${method}`));
      }, timeout);
      this.pendingRequests.set(messageId, { resolve, reject, timeout: timeoutHandle });
      const message = {
        id: messageId,
        type: `request:${method}`,
        source: this.context,
        target: this.target,
        data: args.length === 1 ? args[0] : args,
        metadata: { timestamp: Date.now() }
      };
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          clearTimeout(timeoutHandle);
          this.pendingRequests.delete(messageId);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.id === messageId) {
          clearTimeout(timeoutHandle);
          this.pendingRequests.delete(messageId);
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(response.error || "Request failed"));
          }
        } else {
          console.warn("[CrxRuntimeChannel] Unexpected response format:", response);
        }
      });
    });
  }
  registerHandler(type, handler) {
    this.listeners.set(type, handler);
  }
  unregisterHandler(type) {
    this.listeners.delete(type);
  }
  close() {
    this.listeners.clear();
    this.festUniformChannel?.close();
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Channel closed"));
    }
    this.pendingRequests.clear();
  }
  getQueueStatus() {
    return {
      registeredHandlers: this.listeners.size,
      pendingRequests: this.pendingRequests.size,
      festUniformStatus: this.festUniformChannel ? "active" : "inactive"
    };
  }
}
class CrxUnifiedMessaging {
  static instance;
  runtimeChannel;
  workerChannels = /* @__PURE__ */ new Map();
  context;
  isCrxEnv;
  constructor() {
    this.context = getCrxContext();
    this.isCrxEnv = isCrxEnvironment();
    this.runtimeChannel = new CrxRuntimeChannel();
  }
  static getInstance() {
    if (!CrxUnifiedMessaging.instance) {
      CrxUnifiedMessaging.instance = new CrxUnifiedMessaging();
    }
    return CrxUnifiedMessaging.instance;
  }
  /**
   * Send message via Chrome runtime
   */
  async sendRuntimeMessage(message) {
    const fullMessage = {
      id: `crx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: this.context,
      ...message
    };
    return this.runtimeChannel?.request?.("sendMessage", [fullMessage]);
  }
  /**
   * Register handler for runtime messages
   */
  registerRuntimeHandler(type, handler) {
    this.runtimeChannel?.registerHandler(type, handler);
  }
  /**
   * Create worker channel for background processing
   */
  createWorkerChannel(name, workerScript) {
    if (this.workerChannels.has(name)) {
      return this.workerChannels.get(name);
    }
    const channel = createQueuedOptimizedWorkerChannel({
      name,
      script: workerScript,
      context: "chrome-extension"
    }, {
      timeout: 3e4,
      retries: 2,
      batching: true,
      compression: false
    });
    this.workerChannels.set(name, channel);
    return channel;
  }
  /**
   * Get worker channel
   */
  getWorkerChannel(name) {
    return this.workerChannels.get(name) || null;
  }
  /**
   * Send message to specific tab
   */
  async sendToTab(tabId, message) {
    if (!this.isCrxEnv) {
      console.warn("CrxUnifiedMessaging: Tab messaging not available - not in Chrome extension context");
      return Promise.reject(new Error("Tab messaging is not available in this context"));
    }
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, {
        ...message,
        id: `crx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: this.context,
        tabId
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
  /**
   * Broadcast message to all tabs
   */
  async broadcastToTabs(message) {
    if (!this.isCrxEnv) {
      console.warn("CrxUnifiedMessaging: Tab broadcasting not available - not in Chrome extension context");
      return Promise.resolve([]);
    }
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        const promises = tabs.map((tab) => {
          if (tab.id) {
            return this.sendToTab(tab.id, message).catch(() => null);
          }
          return Promise.resolve(null);
        });
        Promise.all(promises).then(resolve);
      });
    });
  }
  /**
   * Get current context
   */
  getContext() {
    return this.context;
  }
  /**
   * Check if running in CRX environment
   */
  isCrxEnvironment() {
    return this.isCrxEnv;
  }
}
const crxMessaging = CrxUnifiedMessaging.getInstance();
function registerCrxHandler(type, handler) {
  crxMessaging.registerRuntimeHandler(type, handler);
}
function broadcastToCrxTabs(message) {
  return crxMessaging.broadcastToTabs(message);
}

export { broadcastToCrxTabs, crxMessaging, registerCrxHandler };
//# sourceMappingURL=CrxMessaging.js.map
