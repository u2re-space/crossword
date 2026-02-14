"use strict";
const CLIPBOARD_CHANNEL = "rs-clipboard";
const toText = (data) => {
  if (data == null) return "";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};
const writeText = async (text) => {
  const trimmed = toText(text).trim();
  if (!trimmed) return { ok: false, error: "Empty content" };
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (typeof document !== "undefined" && document.hasFocus && !document.hasFocus()) {
        globalThis?.focus?.();
      }
      const tryClipboardAPI = async () => {
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(trimmed);
            return resolve({ ok: true, data: trimmed, method: "clipboard-api" });
          }
        } catch (err) {
          console.warn("[Clipboard] Direct write failed:", err);
        }
        try {
          if (typeof navigator !== "undefined" && navigator.permissions) {
            const result = await navigator.permissions.query({ name: "clipboard-write" });
            if (result.state === "granted" || result.state === "prompt") {
              await navigator.clipboard.writeText(trimmed);
              return resolve({ ok: true, data: trimmed, method: "clipboard-api" });
            }
          }
        } catch (err) {
          console.warn("[Clipboard] Permission check failed:", err);
        }
        try {
          if (typeof document !== "undefined") {
            const textarea = document.createElement("textarea");
            textarea.value = trimmed;
            textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand("copy");
            textarea.remove();
            if (success) {
              return resolve({ ok: true, data: trimmed, method: "legacy" });
            }
          }
        } catch (err) {
          console.warn("[Clipboard] Legacy execCommand failed:", err);
        }
        resolve({ ok: false, error: "All clipboard methods failed" });
      };
      tryClipboardAPI();
    });
  });
};
const writeHTML = async (html, plainText) => {
  const htmlContent = html.trim();
  const textContent = (plainText ?? htmlContent).trim();
  if (!htmlContent) return { ok: false, error: "Empty content" };
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (typeof document !== "undefined" && document.hasFocus && !document.hasFocus()) {
        globalThis?.focus?.();
      }
      const tryHTMLClipboard = async () => {
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
            const htmlBlob = new Blob([htmlContent], { type: "text/html" });
            const textBlob = new Blob([textContent], { type: "text/plain" });
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": htmlBlob,
                "text/plain": textBlob
              })
            ]);
            return resolve({ ok: true, data: htmlContent, method: "clipboard-api" });
          }
        } catch (err) {
          console.warn("[Clipboard] HTML write failed:", err);
        }
        const textResult = await writeText(textContent);
        resolve(textResult);
      };
      tryHTMLClipboard();
    });
  });
};
const writeImage = async (blob) => {
  return new Promise((resolve) => {
    requestAnimationFrame(async () => {
      if (typeof document !== "undefined" && document.hasFocus && !document.hasFocus()) {
        globalThis?.focus?.();
      }
      try {
        let imageBlob;
        if (typeof blob === "string") {
          if (blob.startsWith("data:")) {
            const response = await fetch(blob);
            imageBlob = await response.blob();
          } else {
            const response = await fetch(blob);
            imageBlob = await response.blob();
          }
        } else {
          imageBlob = blob;
        }
        if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
          const pngBlob = imageBlob.type === "image/png" ? imageBlob : await convertToPng(imageBlob);
          await navigator.clipboard.write([
            new ClipboardItem({
              [pngBlob.type]: pngBlob
            })
          ]);
          resolve({ ok: true, method: "clipboard-api" });
          return;
        }
      } catch (err) {
        console.warn("[Clipboard] Image write failed:", err);
      }
      resolve({ ok: false, error: "Image clipboard not supported" });
    });
  });
};
const convertToPng = async (blob) => {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("No document context"));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas context failed"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error("PNG conversion failed"));
          }
        },
        "image/png"
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
};
const readText = async () => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const tryReadClipboard = async () => {
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
            const text = await navigator.clipboard.readText();
            resolve({ ok: true, data: text, method: "clipboard-api" });
            return;
          }
        } catch (err) {
          console.warn("[Clipboard] Read failed:", err);
        }
        resolve({ ok: false, error: "Clipboard read not available" });
      };
      tryReadClipboard();
    });
  });
};
const copy = async (data, options = {}) => {
  const { type, showFeedback = false, silentOnError = false } = options;
  return new Promise((resolve) => {
    requestAnimationFrame(async () => {
      let result;
      if (data instanceof Blob) {
        if (data.type.startsWith("image/")) {
          result = await writeImage(data);
        } else {
          const text = await data.text();
          result = await writeText(text);
        }
      } else if (type === "html" || typeof data === "string" && data.trim().startsWith("<")) {
        result = await writeHTML(String(data));
      } else if (type === "image") {
        result = await writeImage(data);
      } else {
        result = await writeText(toText(data));
      }
      if (showFeedback && (result.ok || !silentOnError)) {
        broadcastClipboardFeedback(result);
      }
      resolve(result);
    });
  });
};
const broadcastClipboardFeedback = (result) => {
  try {
    const channel = new BroadcastChannel("rs-toast");
    channel.postMessage({
      type: "show-toast",
      options: {
        message: result.ok ? "Copied to clipboard" : result.error || "Copy failed",
        kind: result.ok ? "success" : "error",
        duration: 2e3
      }
    });
    channel.close();
  } catch (e) {
    console.warn("[Clipboard] Feedback broadcast failed:", e);
  }
};
const requestCopy = (data, options) => {
  try {
    const channel = new BroadcastChannel(CLIPBOARD_CHANNEL);
    channel.postMessage({ type: "copy", data, options });
    channel.close();
  } catch (e) {
    console.warn("[Clipboard] Request broadcast failed:", e);
  }
};
const listenForClipboardRequests = () => {
  if (typeof BroadcastChannel === "undefined") return () => {
  };
  const channel = new BroadcastChannel(CLIPBOARD_CHANNEL);
  const handler = async (event) => {
    if (event.data?.type === "copy") {
      const opts = event.data.options || {};
      await copy(event.data.data, {
        ...opts,
        showFeedback: opts.showFeedback !== false,
        silentOnError: opts.silentOnError === true
      });
    }
  };
  channel.addEventListener("message", handler);
  return () => {
    channel.removeEventListener("message", handler);
    channel.close();
  };
};
const initClipboardReceiver = () => {
  return listenForClipboardRequests();
};
const isClipboardAvailable = () => {
  return typeof navigator !== "undefined" && !!navigator.clipboard;
};
const isClipboardWriteAvailable = () => {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
};
const isChromeExtension = () => {
  try {
    return typeof chrome !== "undefined" && !!chrome?.runtime?.id;
  } catch {
    return false;
  }
};
const requestCopyViaCRX = async (data, tabIdOrOptions) => {
  const options = typeof tabIdOrOptions === "number" ? { tabId: tabIdOrOptions } : tabIdOrOptions || {};
  const { tabId, offscreenFallback } = options;
  const text = toText(data).trim();
  if (!text) return { ok: false, error: "Empty content" };
  if (isChromeExtension() && typeof chrome?.tabs?.sendMessage === "function") {
    try {
      if (typeof tabId === "number" && tabId >= 0) {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: "COPY_HACK",
          data: text
        });
        if (response?.ok) {
          return {
            ok: true,
            data: response?.data,
            method: response?.method ?? "broadcast"
          };
        }
      } else {
        const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
        for (const tab of tabs || []) {
          if (tab?.id != null && tab.id >= 0) {
            try {
              const response = await chrome.tabs.sendMessage(tab.id, {
                type: "COPY_HACK",
                data: text
              });
              if (response?.ok) {
                return {
                  ok: true,
                  data: response?.data,
                  method: response?.method ?? "broadcast"
                };
              }
            } catch {
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Clipboard] CRX content script message failed:", err);
    }
    if (offscreenFallback) {
      try {
        const ok = await offscreenFallback(text);
        if (ok) {
          return { ok: true, data: text, method: "offscreen" };
        }
      } catch (err) {
        console.warn("[Clipboard] Offscreen fallback failed:", err);
      }
    }
  }
  requestCopy(data, { showFeedback: true });
  return { ok: false, error: "Broadcast sent, result pending", method: "broadcast" };
};
const COPY_HACK = async (data) => {
  const result = await writeText(toText(data));
  return result.ok;
};
const copyWithResult = async (data) => {
  return writeText(toText(data));
};
const Clipboard = {
  copy,
  writeText,
  writeHTML,
  writeImage,
  readText,
  toText,
  request: requestCopy,
  requestViaCRX: requestCopyViaCRX,
  listen: listenForClipboardRequests,
  init: initClipboardReceiver,
  isAvailable: isClipboardAvailable,
  isWriteAvailable: isClipboardWriteAvailable,
  isChromeExtension
};

export { COPY_HACK, copy, copyWithResult, Clipboard as default, initClipboardReceiver, isChromeExtension, isClipboardAvailable, isClipboardWriteAvailable, listenForClipboardRequests, readText, requestCopy, requestCopyViaCRX, toText, writeHTML, writeImage, writeText };
//# sourceMappingURL=Clipboard.js.map
