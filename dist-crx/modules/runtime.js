import { detectExecutionContext } from './index.js';

"use strict";
const createChromeExtensionRuntimeChannel = (channelName) => {
  const context = detectExecutionContext();
  if (context != "chrome-extension") {
    console.warn("Chrome extension runtime channels requested but not in chrome extension context. Returning no-op channel.");
    return {
      async request(method, args = []) {
        console.warn(`CRX messaging not available: ${method}`, args);
        throw new Error("Chrome extension messaging is not available in this context");
      },
      close() {
      }
    };
  }
  return {
    async request(method, args = []) {
      const message = {
        id: `crx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: method,
        source: context,
        target: channelName,
        data: args.length === 1 ? args[0] : args,
        metadata: { timestamp: Date.now() }
      };
      return new Promise((resolve, reject) => {
        try {
          console.log("[Runtime Channel] Sending message:", message);
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              console.error("[Runtime Channel] Chrome runtime error:", chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            console.log("[Runtime Channel] Received response for", method, ":", response);
            resolve(response);
          });
        } catch (error) {
          console.error("[Runtime Channel] Failed to send message:", error);
          reject(error);
        }
      });
    },
    close() {
    }
  };
};
const createRuntimeChannelModule = async (channelName, options) => {
  const context = detectExecutionContext();
  if (context !== "chrome-extension") {
    throw new Error("Runtime channel modules can only be created in chrome extension context");
  }
  const messagingChannel = createChromeExtensionRuntimeChannel(channelName);
  console.log("messagingChannel", messagingChannel);
  const module = {
    // Screen capture functionality (capture + AI processing)
    async capture(rect, mode) {
      const result = await messagingChannel?.request?.("capture", [{
        rect,
        mode: mode || "recognize"
      }]);
      return result;
    },
    // Just capture screenshot, return image data
    async captureScreenshot(rect) {
      const result = await messagingChannel?.request?.("captureScreenshot", [{
        rect
      }]);
      return result;
    },
    // Process captured image data with AI
    async processImage(imageData, mode) {
      const result = await messagingChannel?.request?.("processImage", [{
        imageData,
        mode: mode || "recognize"
      }]);
      return result;
    },
    // Text processing functionality
    async processText(text, options2) {
      const result = await messagingChannel?.request?.("processText", [{
        content: text,
        contentType: options2?.type || "text"
      }]);
      return result;
    },
    // Copy to clipboard functionality
    async doCopy(data, options2) {
      const result = await messagingChannel?.request?.("doCopy", [{
        data,
        showToast: options2?.showToast !== false
      }]);
      if (options2?.showToast !== false && result?.success && typeof chrome !== "undefined" && chrome.notifications) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon.png",
          title: "CrossWord",
          message: "Copied to clipboard!"
        });
      }
      return result;
    },
    // Load markdown functionality
    async loadMarkdown(src) {
      const result = await messagingChannel?.request?.("loadMarkdown", [src]);
      return result;
    },
    // Custom screen capture with rectangle selection
    async captureWithRect(mode) {
      const result = await messagingChannel?.request?.("captureWithRect", [{
        mode: mode || "default"
      }]);
      return result;
    },
    // Get current tab information
    async getCurrentTab() {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        return tabs[0];
      }
      return null;
    },
    // Send custom message
    async sendMessage(type, data) {
      const result = await messagingChannel?.request?.(type, data ? [data] : []);
      return result;
    },
    // Close the module/channel
    close() {
      messagingChannel?.close?.();
    }
  };
  return module;
};

export { createRuntimeChannelModule };
//# sourceMappingURL=runtime.js.map
