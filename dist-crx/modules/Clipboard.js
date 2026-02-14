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
        window.focus();
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
        window.focus();
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
        window.focus();
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

export { initClipboardReceiver, toText, writeHTML, writeText };
//# sourceMappingURL=Clipboard.js.map
