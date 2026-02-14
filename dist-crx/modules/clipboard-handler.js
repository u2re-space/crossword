import { toText } from './Clipboard.js';

"use strict";
const tryParseJson = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};
const extractLLMContent = (data) => {
  if (data == null) return "";
  if (typeof data === "string") {
    const parsed = tryParseJson(data);
    if (parsed != null) {
      const extracted = extractLLMContent(parsed);
      if (extracted) return extracted;
    }
    return data;
  }
  if (typeof data === "object") {
    const anyData = data;
    const choice0 = anyData?.choices?.[0];
    const chatContent = choice0?.message?.content ?? choice0?.delta?.content ?? choice0?.text;
    if (typeof chatContent === "string" && chatContent.trim()) return chatContent;
    const outputText = anyData?.output_text;
    if (typeof outputText === "string" && outputText.trim()) return outputText;
    const output0 = anyData?.output?.[0];
    const outText = output0?.content?.find?.((c) => typeof c?.text === "string")?.text ?? output0?.content?.[0]?.text ?? output0?.content?.[0]?.content ?? output0?.text;
    if (typeof outText === "string" && outText.trim()) return outText;
    const directMessage = anyData?.message?.content;
    if (typeof directMessage === "string" && directMessage.trim()) return directMessage;
    if (typeof anyData?.content === "string" && anyData.content.trim()) return anyData.content;
    if (anyData?.result != null) {
      const nested = extractLLMContent(anyData.result);
      if (nested) return nested;
    }
  }
  return "";
};
const getTimingFunction = () => {
  if (typeof requestAnimationFrame !== "undefined") {
    return requestAnimationFrame;
  }
  if (typeof setTimeout !== "undefined") {
    return (cb) => setTimeout(cb, 0);
  }
  return (cb) => cb();
};
const detectContext = () => {
  try {
    if (typeof location !== "undefined" && location.href.includes("offscreen")) {
      return "offscreen";
    }
    if (typeof document !== "undefined" && document.body) {
      return "content";
    }
  } catch {
  }
  return "unknown";
};
const showFeedback = (message, toastFn) => {
  if (toastFn) {
    toastFn(message);
  } else {
    console.log("[Clipboard]", message);
  }
};
const writeTextWithRAF = async (text, maxRetries = 3) => {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Empty content" };
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await new Promise((resolve) => {
        const timerFn = getTimingFunction();
        timerFn(() => {
          if (detectContext() === "content" && typeof document !== "undefined" && document.hasFocus && !document.hasFocus()) {
            try {
              globalThis?.focus?.();
            } catch {
            }
          }
          const tryClipboardAPI = async () => {
            try {
              if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(trimmed);
                return resolve({ ok: true, method: "clipboard-api" });
              }
            } catch (err) {
              console.warn(`[Clipboard] Direct write failed (attempt ${attempt + 1}):`, err);
            }
            try {
              if (typeof navigator !== "undefined" && navigator.permissions) {
                const result2 = await navigator.permissions.query({ name: "clipboard-write" });
                if (result2.state === "granted" || result2.state === "prompt") {
                  await navigator.clipboard.writeText(trimmed);
                  return resolve({ ok: true, method: "clipboard-api-permission" });
                }
              }
            } catch (err) {
              console.warn(`[Clipboard] Permission check failed (attempt ${attempt + 1}):`, err);
            }
            try {
              if (detectContext() === "content" && typeof document !== "undefined") {
                const textarea = document.createElement("textarea");
                textarea.value = trimmed;
                textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;z-index:-1;";
                document.body.appendChild(textarea);
                textarea.select();
                textarea.focus();
                const success = document.execCommand("copy");
                textarea.remove();
                if (success) {
                  return resolve({ ok: true, method: "legacy-execCommand" });
                }
              }
            } catch (err) {
              console.warn(`[Clipboard] Legacy execCommand failed (attempt ${attempt + 1}):`, err);
            }
            if (attempt < maxRetries - 1) {
              setTimeout(() => tryClipboardAPI(), 100);
              return;
            }
            resolve({ ok: false, error: "All clipboard methods failed" });
          };
          tryClipboardAPI();
        });
      });
      if (result.ok) {
        return result;
      }
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    } catch (error) {
      console.warn(`[Clipboard] Attempt ${attempt + 1} completely failed:`, error);
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }
  return { ok: false, error: `Failed after ${maxRetries} attempts` };
};
const handleCopyRequest = async (data, options = {}) => {
  const extracted = extractLLMContent(data);
  const text = (extracted || toText(data)).trim();
  const { maxRetries = 3 } = options;
  if (!text) {
    return { ok: false, error: "Empty content" };
  }
  console.log(`[Clipboard] Attempting to copy ${text.length} characters (${detectContext()})`);
  const result = await writeTextWithRAF(text, maxRetries);
  console.log(`[Clipboard] Copy result:`, result);
  if (options.showFeedback && detectContext() === "content") {
    if (result.ok) {
      showFeedback("Copied to clipboard", options.toastFn);
    } else {
      showFeedback(options.errorMessage || result.error || "Failed to copy", options.toastFn);
    }
  }
  return {
    ok: result.ok,
    data: text,
    method: result.method || detectContext(),
    error: result.error
  };
};
let _handlerRegistered = false;
const initClipboardHandler = (options = {}) => {
  if (_handlerRegistered) return;
  _handlerRegistered = true;
  const context = detectContext();
  const { targetFilter, showFeedback: feedback = context === "content", toastFn } = options;
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`[Clipboard] Received message:`, message, `from:`, sender);
    if (targetFilter && message?.target !== targetFilter) {
      console.log(`[Clipboard] Message filtered out by target:`, message?.target, `expected:`, targetFilter);
      return false;
    }
    if (message?.type === "COPY_HACK") {
      console.log(`[Clipboard] Processing COPY_HACK message with data:`, message?.data?.substring?.(0, 50) + "...");
      handleCopyRequest(message?.data, {
        showFeedback: feedback,
        errorMessage: message?.error,
        toastFn
      }).then((response) => {
        console.log(`[Clipboard] COPY_HACK response:`, response);
        sendResponse(response);
      }).catch((error) => {
        console.error(`[Clipboard] COPY_HACK error:`, error);
        sendResponse({ ok: false, error: String(error) });
      });
      return true;
    }
    return false;
  });
  console.log(`[Clipboard] Handler initialized (${context})`);
};

export { initClipboardHandler };
//# sourceMappingURL=clipboard-handler.js.map
