import { __vitePreload } from '../modules/index.js';
import { createTimelineGenerator, requestNewTimeline } from '../modules/MakeTimeline.js';
import { removeAnyPrefix, encodeWithJSquash, ableToShowImage } from '../modules/ImageProcess.js';
import { extractCSS, writeCode, solveAndAnswer, recognizeImageData, recognizeByInstructions, executionCore, getGPTInstance, processDataWithInstruction } from '../modules/ExecutionCore.js';
import { toText } from '../modules/Clipboard.js';
import { getCustomInstructions } from '../modules/CustomInstructions.js';
import { loadSettings } from '../modules/Settings.js';
import { crxMessaging, registerCrxHandler, broadcastToCrxTabs } from '../modules/CrxMessaging.js';
import { CRX_SOLVE_AND_ANSWER_INSTRUCTION, CRX_WRITE_CODE_INSTRUCTION, CRX_EXTRACT_CSS_INSTRUCTION } from '../modules/BuiltInAI.js';
import '../modules/GPT-Responses.js';
import '../modules/Runtime2.js';
import '../modules/Toast.js';
import '../modules/RuntimeSettings.js';

"use strict";
const SIZE_THRESHOLD = 2 * 1024 * 1024;
const MARKDOWN_EXT_RE$1 = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;
const isProbablyUrl = (v) => {
  try {
    return Boolean(new URL(v));
  } catch {
    return false;
  }
};
const formatRuntimeError = (e) => {
  if (e instanceof Error) {
    const firstStackLine = e.stack?.split?.("\n")?.[1]?.trim?.();
    return firstStackLine ? `${e.name}: ${e.message} @ ${firstStackLine}` : `${e.name}: ${e.message}`;
  }
  return String(e);
};
const dataUrlToFile = async (dataUrl, name = "snip.png") => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    try {
      return new File([blob], name, { type: blob.type || "image/png", lastModified: Date.now() });
    } catch {
      return blob;
    }
  } catch {
    return new Blob([dataUrl], { type: "text/plain" });
  }
};
const compressIfNeeded = async (dataUrl) => {
  if (dataUrl.length <= SIZE_THRESHOLD) return dataUrl;
  try {
    const binary = Uint8Array.fromBase64(removeAnyPrefix(dataUrl), { alphabet: "base64" });
    const blob = new Blob([binary], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    const ab = await encodeWithJSquash(bitmap);
    bitmap?.close?.();
    if (ab) {
      return `data:image/jpeg;base64,${new Uint8Array(ab).toBase64({ alphabet: "base64" })}`;
    }
  } catch (e) {
    console.warn("[api] compression failed:", e);
  }
  return dataUrl;
};
const schedule = (() => {
  if (typeof requestAnimationFrame !== "undefined") return requestAnimationFrame;
  if (typeof setTimeout !== "undefined") return (cb) => setTimeout(cb, 0);
  return (cb) => cb();
})();
const extractRecognizedText = (result) => {
  if (typeof result === "string") return result;
  if (!result?.ok) return "";
  let text = result.data;
  if (text && typeof text !== "string") {
    try {
      text = JSON.stringify(text);
    } catch {
      text = String(text);
    }
  }
  if (!text) return "";
  if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      const p = JSON.parse(text);
      const candidate = p?.recognized_data ?? p?.data ?? p?.text;
      if (typeof candidate === "string") return candidate.trim();
      if (candidate != null) return JSON.stringify(candidate);
    } catch {
    }
  }
  return (typeof text === "string" ? text : String(text)).trim();
};
const captureVisibleTab = async (options) => {
  const captureOpts = {
    format: "png",
    scale: options?.scale ?? 1
  };
  if (options?.rect && options.rect.width > 0 && options.rect.height > 0) {
    captureOpts.rect = options.rect;
  }
  const dataUrl = await new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(captureOpts, (url) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(url);
    });
  });
  let finalUrl = await compressIfNeeded(dataUrl);
  if (!finalUrl || !await ableToShowImage(finalUrl)) finalUrl = dataUrl;
  return finalUrl;
};
const AI_DISPATCH = {
  recognize: recognizeImageData,
  solve: solveAndAnswer,
  code: writeCode,
  css: extractCSS
};
const captureAndProcess = async (ext, rect, mode = "recognize", extra) => {
  const imageUrl = await captureVisibleTab({ rect });
  const file = await dataUrlToFile(imageUrl, "snip.png");
  let result;
  if (mode === "custom" && extra?.instructionId) {
    const instructions = await getCustomInstructions().catch(() => []);
    const instruction = instructions.find((i) => i.id === extra.instructionId);
    if (!instruction) return { ok: false, error: "Custom instruction not found" };
    const input = [{
      type: "message",
      role: "user",
      content: [{ type: "input_image", image_url: imageUrl }]
    }];
    const raw = await recognizeByInstructions(input, instruction.instruction);
    const text = extractRecognizedText(raw);
    result = {
      ok: raw?.ok ?? !!text,
      data: text,
      error: raw?.error || (!text ? `${instruction.label} failed` : void 0)
    };
  } else {
    const fn = AI_DISPATCH[mode] ?? AI_DISPATCH.recognize;
    result = await fn(file);
  }
  if (result.ok && result.data) {
    await COPY_HACK(ext, result, extra?.sender?.tab?.id).catch(console.warn);
  }
  return result;
};
const handleCapture = (ext, data, sender) => captureAndProcess(ext, data.rect, data.mode || "recognize", { sender });
const handleCaptureScreenshot = async (_ext, data) => {
  const imageUrl = await captureVisibleTab({ rect: data.rect });
  return { ok: true, data: imageUrl, imageData: imageUrl };
};
const handleProcessImage = async (ext, data, sender) => {
  const imageData = data.imageData;
  const mode = data.mode || "recognize";
  const file = typeof imageData === "string" ? await dataUrlToFile(imageData) : imageData;
  const fn = AI_DISPATCH[mode] ?? AI_DISPATCH.recognize;
  const result = await fn(file);
  if (result.ok && result.data) {
    await COPY_HACK(ext, result, sender?.tab?.id).catch(console.warn);
  }
  return result;
};
const handleProcessText = async (_ext, data) => recognizeImageData(new Blob([data.content], { type: "text/plain" }));
const handleDoCopy = async (ext, data) => {
  const result = await COPY_HACK(ext, data.data, data.tabId);
  return { success: result?.ok || false };
};
const handleCaptureWithRect = async (data) => ({ status: "rect_selection_required", mode: data.mode });
const normalizeSourceUrl = (candidate) => {
  try {
    const u = new URL(candidate);
    if (u.hostname === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("blob") === 2 ? 2 : parts.indexOf("raw") === 2 ? 2 : -1;
      if (parts.length >= 5 && idx === 2) {
        return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join("/")}`;
      }
    }
    if (u.hostname.endsWith("gitlab.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const di = parts.indexOf("-");
      if (di >= 0 && parts[di + 1] === "blob") {
        return `https://${u.hostname}/${parts.slice(0, di).join("/")}/-/raw/${parts[di + 2] || ""}/${parts.slice(di + 3).join("/")}`;
      }
    }
    if (u.hostname === "bitbucket.org") {
      if (!u.searchParams.has("raw")) u.searchParams.set("raw", "1");
      return u.toString();
    }
    return u.toString();
  } catch {
    return candidate;
  }
};
const looksLikeHtmlDocument = (text) => {
  const t = (text || "").trimStart().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html") || t.startsWith("<head") || t.startsWith("<body");
};
const looksLikeMarkdown = (text) => {
  const t = (text || "").trim();
  if (!t || looksLikeHtmlDocument(t)) return false;
  let hits = 0;
  if (/^#{1,6}\s+.+$/m.test(t)) hits++;
  if (/^\s*[-*+]\s+\S+/m.test(t)) hits++;
  if (/^\s*\d+\.\s+\S+/m.test(t)) hits++;
  if (/```[\s\S]*?```/.test(t)) hits++;
  if (/\[([^\]]+)\]\(([^)]+)\)/.test(t)) hits++;
  return hits >= 2;
};
const guessLanguage = (url) => {
  const ext = ((url.pathname.split("/").pop() || "").split(".").pop() || "").toLowerCase();
  const map = {
    ts: "ts",
    tsx: "tsx",
    js: "js",
    jsx: "jsx",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    htm: "html",
    xml: "xml",
    yml: "yaml",
    yaml: "yaml",
    py: "py",
    sh: "sh",
    go: "go",
    rs: "rs",
    java: "java"
  };
  return map[ext] || "";
};
const handleLoadMarkdown = async (src) => {
  let text = "";
  let normalizedSrc;
  try {
    normalizedSrc = normalizeSourceUrl(src);
    const u = new URL(normalizedSrc);
    const res = await fetch(u.href, { credentials: "include", cache: "no-store", headers: { accept: "text/markdown,text/plain,*/*" } });
    if (!res.ok) return { error: `Failed to load: ${res.status}` };
    text = await res.text();
    if (!looksLikeHtmlDocument(text)) {
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const isMd = MARKDOWN_EXT_RE$1.test(u.pathname) || ct.includes("text/markdown") || looksLikeMarkdown(text);
      if (!isMd) {
        const lang = guessLanguage(u);
        text = `\`\`\`${lang}
${text.replace(/\r\n/g, "\n")}
\`\`\`
`;
      }
    }
  } catch {
    text = src;
  }
  const key = `md_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  await chrome.storage.session.set({ [key]: text });
  return { key, src: isProbablyUrl(normalizedSrc || src) ? normalizedSrc || src : void 0 };
};
const COPY_HACK = async (ext, data, tabId) => {
  const text = toText(data?.data).trim();
  if (!text) return { ok: false, error: "Empty content" };
  return new Promise((resolve) => {
    schedule(async () => {
      if (tabId && tabId > 0) {
        try {
          const tab = await ext.tabs.get(tabId).catch(() => null);
          if (tab) {
            await ext.scripting.executeScript({ target: { tabId }, files: ["content/main.ts"] }).catch(() => {
            });
            const r = await ext.tabs.sendMessage(tabId, { type: "COPY_HACK", data: text });
            if (r?.ok) return resolve({ ok: true });
          }
        } catch {
        }
      }
      try {
        const offscreenUrl = "offscreen/copy.html";
        const existing = await ext.runtime.getContexts?.({
          contextTypes: [ext.runtime.ContextType.OFFSCREEN_DOCUMENT],
          documentUrls: [ext.runtime.getURL(offscreenUrl)]
        })?.catch?.(() => []);
        if (!existing?.length) {
          await ext.offscreen.createDocument({
            url: offscreenUrl,
            reasons: [ext.offscreen.Reason.CLIPBOARD],
            justification: "Clipboard access for copied text"
          });
          await new Promise((r2) => setTimeout(r2, 500));
        }
        const r = await ext.runtime.sendMessage({ target: "offscreen", type: "COPY_HACK", data: text });
        if (r?.ok) return resolve({ ok: true });
      } catch {
      }
      try {
        const tabs = await ext.tabs.query({}).catch(() => []);
        for (const tab of tabs || []) {
          if (tab?.id && tab.id !== tabId) {
            try {
              await ext.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/main.ts"] }).catch(() => {
              });
              const r = await ext.tabs.sendMessage(tab.id, { type: "COPY_HACK", data: text });
              if (r?.ok) return resolve({ ok: true });
            } catch {
            }
          }
        }
      } catch {
      }
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return resolve({ ok: true });
        }
      } catch {
      }
      resolve({ ok: false, error: "All clipboard methods failed" });
    });
  });
};
const enableCapture = (ext) => {
  ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.id?.startsWith("crx_") && msg?.type && msg?.data) {
      (async () => {
        try {
          const route = {
            capture: () => handleCapture(ext, msg.data, sender),
            captureScreenshot: () => handleCaptureScreenshot(ext, msg.data),
            processImage: () => handleProcessImage(ext, msg.data, sender),
            processText: () => handleProcessText(ext, msg.data),
            doCopy: () => handleDoCopy(ext, msg.data),
            loadMarkdown: () => handleLoadMarkdown(msg.data),
            captureWithRect: () => handleCaptureWithRect(msg.data)
          };
          const handler = route[msg.type];
          sendResponse(handler ? await handler() : { ok: false, error: `Unknown method: ${msg.type}` });
        } catch (e) {
          sendResponse({ ok: false, error: formatRuntimeError(e) });
        }
      })();
      return true;
    }
    const CAPTURE_MODES = {
      CAPTURE: "recognize",
      CAPTURE_SOLVE: "solve",
      CAPTURE_ANSWER: "solve",
      CAPTURE_CODE: "code",
      CAPTURE_CSS: "css",
      CAPTURE_CUSTOM: "custom"
    };
    if (msg?.type && msg.type in CAPTURE_MODES) {
      const mode = CAPTURE_MODES[msg.type];
      (async () => {
        try {
          const result = await captureAndProcess(ext, msg.rect, mode, {
            instructionId: msg.instructionId,
            sender
          });
          sendResponse(result);
        } catch (e) {
          sendResponse({ ok: false, error: formatRuntimeError(e) });
        }
      })();
      return true;
    }
    if (msg?.type === "DOWNLOAD" && msg.dataUrl) {
      chrome.downloads.download(
        { url: msg.dataUrl, filename: "snip.png", saveAs: true },
        (id) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message, dataUrl: msg.dataUrl });
          } else {
            sendResponse({ ok: true, id });
          }
        }
      );
      return true;
    }
    return false;
  });
};

"use strict";
const isInCrxEnvironment = crxMessaging.isCrxEnvironment();
const TOAST_CHANNEL = "rs-toast";
const AI_RECOGNITION_CHANNEL = "rs-ai-recognition";
const POPUP_CHANNEL = "rs-popup";
const broadcast = (channel, message) => {
  try {
    const bc = new BroadcastChannel(channel);
    bc.postMessage(message);
    bc.close();
  } catch {
  }
};
const showExtensionToast = (message, kind = "info") => broadcast(TOAST_CHANNEL, { type: "show-toast", options: { message, kind, duration: 3e3 } });
const requestClipboardCopy = async (data, showFeedback = true, tabId) => {
  try {
    let resolvedTabId = tabId;
    if ((!resolvedTabId || resolvedTabId <= 0) && showFeedback) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      resolvedTabId = tabs?.[0]?.id;
    }
    await COPY_HACK(chrome, { ok: true, data }, resolvedTabId);
  } catch (e) {
    console.warn("[SW] clipboard copy failed:", e);
  }
};
const loadCustomInstructions = async () => {
  try {
    return await getCustomInstructions();
  } catch {
    return [];
  }
};
const processChromeExtensionAction = async (input, sessionId) => {
  try {
    const context = {
      source: "chrome-extension",
      sessionId: sessionId || `crx_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    };
    const result = await executionCore.execute(input, context);
    if (result.type === "error") {
      return { success: false, error: result.content || result.error || "Processing failed", result };
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
if (isInCrxEnvironment && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.type) return false;
    if (message.type === "processCapture") {
      (async () => {
        try {
          const rect = message.data?.rect;
          const opts = { format: "png", scale: 1 };
          if (rect?.width > 0 && rect?.height > 0) opts.rect = rect;
          const dataUrl = await new Promise((resolve, reject) => {
            chrome.tabs.captureVisibleTab(opts, (url) => {
              chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(url);
            });
          });
          const blob = await (await fetch(dataUrl)).blob();
          const result = await recognizeImageData(blob);
          sendResponse({ success: true, result });
        } catch (error) {
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
      })();
      return true;
    }
    if (message.type === "processText") {
      sendResponse({ success: true, result: { type: "text", content: message.data?.content, processed: true } });
      return false;
    }
    return false;
  });
}
if (isInCrxEnvironment) {
  registerCrxHandler("processImage", async (data) => {
    const result = await processChromeExtensionAction({ type: "recognize", data: data.imageData, mode: data.mode, customInstructionId: data.customInstructionId });
    crxMessaging.sendRuntimeMessage({ type: "processingComplete", data: { result }, metadata: { progress: 100 } }).catch(() => {
    });
    return result;
  });
  registerCrxHandler(
    "processCapture",
    async (data) => processChromeExtensionAction({ type: "capture", data, mode: data.type?.toLowerCase().replace("capture_", "") || "recognize" })
  );
  registerCrxHandler(
    "processText",
    async (data) => processChromeExtensionAction({ type: "process", data: data.content, contentType: data.contentType })
  );
  registerCrxHandler(
    "getProcessingStatus",
    async (data) => ({ status: "completed", operationId: data.operationId })
  );
  registerCrxHandler(
    "cancelProcessing",
    async (data) => ({ cancelled: true, operationId: data.operationId })
  );
}
registerCrxHandler("getSettings", async () => {
  try {
    return await loadSettings();
  } catch (e) {
    throw e;
  }
});
registerCrxHandler("updateSettings", async (updates) => ({ success: true }));
registerCrxHandler("ping", async () => ({ status: "ok", context: "service-worker", timestamp: Date.now() }));
registerCrxHandler("broadcastResult", async (data) => {
  await broadcastToCrxTabs({ type: "ai-result", data: data.result, metadata: { source: "service-worker" } });
  broadcast(AI_RECOGNITION_CHANNEL, { type: data.type, result: data.result, timestamp: Date.now(), source: "crx-service-worker" });
  return { broadcasted: true };
});
class CrxResultPipeline {
  resultQueue = [];
  maxQueueSize = 50;
  maxRetries = 3;
  interval = null;
  constructor() {
    this.interval = globalThis.setInterval(() => this.processQueue(), 1e3);
  }
  async enqueue(result, destinations) {
    const pr = { id: crypto.randomUUID(), result, destinations, status: "pending", attempts: 0, createdAt: Date.now() };
    this.resultQueue.push(pr);
    if (this.resultQueue.length > this.maxQueueSize) this.resultQueue.shift();
    return pr.id;
  }
  getStatus() {
    const c = { pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const r of this.resultQueue) c[r.status]++;
    return { queueSize: this.resultQueue.length, ...c };
  }
  getPending(dest) {
    return this.resultQueue.filter((r) => r.status === "pending" && (!dest || r.destinations.some((d) => d.type === dest)));
  }
  clearCompleted() {
    const n = this.resultQueue.filter((r) => r.status === "completed").length;
    this.resultQueue = this.resultQueue.filter((r) => r.status !== "completed");
    return n;
  }
  destroy() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.resultQueue = [];
  }
  // --- internal ---
  async processQueue() {
    for (const pr of this.resultQueue.filter((r) => r.status === "pending")) {
      pr.status = "processing";
      pr.attempts++;
      let anyOk = false;
      for (const dest of pr.destinations) {
        try {
          await this.deliver(pr.result, dest);
          anyOk = true;
        } catch {
        }
      }
      if (anyOk) {
        pr.status = "completed";
        pr.completedAt = Date.now();
      } else if (pr.attempts >= this.maxRetries) {
        pr.status = "failed";
        pr.error = "All destinations failed";
      } else pr.status = "pending";
    }
  }
  async deliver(result, dest) {
    const textContent = typeof result.content === "string" ? result.content : `[Binary ${result.content.byteLength} bytes]`;
    switch (dest.type) {
      case "clipboard":
        await requestClipboardCopy(textContent, dest.options?.showFeedback !== false, dest.tabId);
        break;
      case "content-script": {
        const msg = { type: "crx-result-delivered", result, destination: dest.type, timestamp: Date.now() };
        if (dest.tabId) await chrome.tabs.sendMessage(dest.tabId, msg, { frameId: dest.frameId });
        else await broadcastToCrxTabs(msg);
        break;
      }
      case "popup":
        broadcast(POPUP_CHANNEL, { type: "crx-result-delivered", result, destination: dest.type, timestamp: Date.now() });
        break;
      case "workcenter":
        try {
          const { unifiedMessaging } = await __vitePreload(async () => { const { unifiedMessaging } = await import('../modules/UnifiedMessaging.js').then(n => n.UnifiedMessaging);return { unifiedMessaging }},true              ?[]:void 0,import.meta.url);
          await unifiedMessaging.sendMessage({
            id: result.id,
            type: "content-share",
            source: "crx-snip",
            destination: "workcenter",
            contentType: result.type,
            data: { text: textContent, processed: true, source: result.source, metadata: result.metadata },
            metadata: { title: `CRX-Snip ${result.type} Result`, timestamp: result.timestamp, source: result.source }
          });
        } catch {
          throw new Error("WorkCenter delivery failed");
        }
        break;
      case "notification":
        await chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: `CrossWord ${result.source}`, message: textContent.length > 100 ? textContent.slice(0, 100) + "..." : textContent });
        break;
    }
  }
}
const pipeline = new CrxResultPipeline();
self.addEventListener("beforeunload", () => pipeline.destroy());
const enqueueText = (content, destinations) => pipeline.enqueue({ id: crypto.randomUUID(), type: "text", content, source: "crx-snip", timestamp: Date.now() }, destinations);
const processCrxSnipWithPipeline = async (content, contentType = "text", extraDest = []) => {
  try {
    let processedContent = content;
    let finalType = contentType;
    if ((contentType === "image" || content instanceof ArrayBuffer) && content instanceof ArrayBuffer) {
      const blob = new Blob([content], { type: "image/png" });
      const rec = await recognizeImageData(blob);
      processedContent = rec.text || "";
      finalType = "text";
    }
    const input = {
      type: "process",
      content: processedContent,
      contentType: finalType,
      metadata: { source: "crx-snip", timestamp: Date.now(), background: true, originalType: contentType }
    };
    const result = await processChromeExtensionAction(input);
    if (result.success && result.result) {
      const crxResult = {
        id: crypto.randomUUID(),
        type: "processed",
        content: typeof result.result === "string" ? result.result : String(result.result),
        source: "crx-snip",
        timestamp: Date.now()
      };
      const destinations = [
        { type: "clipboard", options: { showFeedback: true } },
        { type: "content-script" },
        { type: "workcenter" },
        { type: "notification" },
        ...extraDest
      ];
      const resultId = await pipeline.enqueue(crxResult, destinations);
      return { success: true, resultId };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
const VIEWER_PAGE = "markdown/viewer.html";
const VIEWER_ORIGIN = chrome.runtime.getURL("");
const VIEWER_URL = chrome.runtime.getURL(VIEWER_PAGE);
const MARKDOWN_EXT_RE = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;
const MD_VIEW_MENU_ID = "crossword:markdown-view";
const isMarkdownUrl = (candidate) => {
  if (!candidate || typeof candidate !== "string") return false;
  try {
    const url = new URL(candidate);
    if (url.protocol === "chrome-extension:") return false;
    if (!["http:", "https:", "file:", "ftp:"].includes(url.protocol)) return false;
    if (MARKDOWN_EXT_RE.test(url.pathname)) return true;
    if (url.hostname === "raw.githubusercontent.com" || url.hostname === "gist.githubusercontent.com") {
      if (MARKDOWN_EXT_RE.test(url.pathname)) return true;
      if (/(^|\/)readme(\.md)?($|[?#])/i.test(url.pathname)) return true;
    }
    return false;
  } catch {
    return false;
  }
};
const isMarkdownContent = (text) => {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) return false;
  if (/<[a-zA-Z][^>]*>/.test(trimmed)) return false;
  let score = 0, hits = 0;
  const patterns = [
    [/^---[\s\S]+?---/, 0.9],
    [/^#{1,6}\s+.+$/m, 0.8],
    [/^\s*[-*+]\s+\S+/m, 0.7],
    [/^\s*\d+\.\s+\S+/m, 0.7],
    [/`{1,3}[^`]*`{1,3}/, 0.6],
    [/\[([^\]]+)\]\(([^)]+)\)/, 0.5],
    [/!\[([^\]]+)\]\(([^)]+)\)/, 0.5],
    [/\*\*[^*]+\*\*/, 0.4],
    [/\*[^*]+\*/, 0.3]
  ];
  for (const [re, s] of patterns) {
    if (re.test(text)) {
      score += s;
      hits++;
    }
  }
  return hits >= 2 && score >= 0.8;
};
const normalizeMarkdownSourceUrl = (candidate) => {
  try {
    const u = new URL(candidate);
    if (u.hostname === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 5 && parts[2] === "blob") {
        return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join("/")}`;
      }
    }
    if (u.hostname.endsWith("gitlab.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const di = parts.indexOf("-");
      if (di >= 0 && parts[di + 1] === "blob") {
        return `https://${u.hostname}/${parts.slice(0, di).join("/")}/-/raw/${parts[di + 2] || ""}/${parts.slice(di + 3).join("/")}`;
      }
    }
    if (u.hostname === "bitbucket.org") {
      if (!u.searchParams.has("raw")) u.searchParams.set("raw", "1");
      return u.toString();
    }
    return u.toString();
  } catch {
    return candidate;
  }
};
const toViewerUrl = (source, markdownKey) => {
  if (!source) return VIEWER_URL;
  const p = new URLSearchParams();
  p.set("src", source);
  if (markdownKey) p.set("mdk", markdownKey);
  return `${VIEWER_URL}?${p}`;
};
const openViewer = (source, tabId, markdownKey) => {
  const url = toViewerUrl(source ?? void 0, markdownKey);
  if (typeof tabId === "number") chrome.tabs.update(tabId, { url })?.catch?.(console.warn);
  else chrome.tabs.create({ url })?.catch?.(console.warn);
};
const createSessionKey = () => {
  try {
    return `md:${crypto.randomUUID()}`;
  } catch {
    return `md:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  }
};
const putMarkdownToSession = async (text) => {
  const key = createSessionKey();
  try {
    await chrome.storage?.session?.set?.({ [key]: text });
    return key;
  } catch {
    return null;
  }
};
const fetchMarkdownText = async (candidate) => {
  const src = normalizeMarkdownSourceUrl(candidate);
  const res = await fetch(src, { credentials: "include", cache: "no-store" });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, src, text };
};
const openMarkdownInViewer = async (originalUrl, tabId) => {
  if (originalUrl.startsWith("file:")) {
    openViewer(originalUrl, tabId, null);
    return;
  }
  const fetched = await fetchMarkdownText(originalUrl).catch(() => null);
  if (!fetched) {
    openViewer(normalizeMarkdownSourceUrl(originalUrl), tabId, null);
    return;
  }
  const key = fetched.ok && fetched.text ? await putMarkdownToSession(fetched.text) : null;
  openViewer(fetched.src, tabId, key);
};
const tryReadMarkdownFromTab = async (tabId, url) => {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (pageUrl) => {
        if (pageUrl.includes("github.com")) {
          const rawBtn = document.querySelector("a[href*='raw']");
          if (rawBtn?.href) return `__RAW_URL__${rawBtn.href}`;
          const md = document.querySelector(".markdown-body");
          if (md?.textContent?.trim()) return md.textContent.trim();
        }
        return document?.body?.innerText?.trim() || "";
      },
      args: [url || ""]
    });
    const val = results?.[0]?.result;
    if (typeof val === "string" && val.startsWith("__RAW_URL__")) {
      try {
        const r = await fetch(val.replace("__RAW_URL__", ""));
        if (r.ok) return await r.text();
      } catch {
      }
    }
    return typeof val === "string" ? val : "";
  } catch {
    return "";
  }
};
const CTX_CONTEXTS = ["all", "page", "frame", "selection", "link", "editable", "image", "video", "audio", "action"];
const CTX_ITEMS = [
  { id: "copy-as-latex", title: "Copy as LaTeX" },
  { id: "copy-as-mathml", title: "Copy as MathML" },
  { id: "copy-as-markdown", title: "Copy as Markdown" },
  { id: "copy-as-html", title: "Copy as HTML" },
  { id: "START_SNIP", title: "Snip and Recognize (AI)" },
  { id: "SOLVE_AND_ANSWER", title: "Solve / Answer (AI)" },
  { id: "WRITE_CODE", title: "Write Code (AI)" },
  { id: "EXTRACT_CSS", title: "Extract CSS Styles (AI)" }
];
const CUSTOM_PREFIX = "CUSTOM_INSTRUCTION:";
let customMenuIds = [];
const updateCustomInstructionMenus = async () => {
  for (const id of customMenuIds) {
    try {
      await chrome.contextMenus.remove(id);
    } catch {
    }
  }
  customMenuIds = [];
  const enabled = (await loadCustomInstructions().catch(() => [])).filter((i) => i.enabled);
  if (!enabled.length) return;
  const sepId = "CUSTOM_SEP";
  try {
    chrome.contextMenus.create({ id: sepId, type: "separator", contexts: CTX_CONTEXTS });
    customMenuIds.push(sepId);
  } catch {
  }
  for (const inst of enabled) {
    const id = `${CUSTOM_PREFIX}${inst.id}`;
    try {
      chrome.contextMenus.create({ id, title: `🎯 ${inst.label}`, contexts: CTX_CONTEXTS });
      customMenuIds.push(id);
    } catch {
    }
  }
};
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes["rs-settings"]) updateCustomInstructionMenus().catch(() => {
  });
});
chrome.runtime.onInstalled.addListener(() => {
  for (const item of CTX_ITEMS) {
    try {
      chrome.contextMenus.create({ id: item.id, title: item.title, visible: true, contexts: CTX_CONTEXTS });
    } catch {
    }
  }
  try {
    chrome.contextMenus.create({
      id: MD_VIEW_MENU_ID,
      title: "Open in Markdown Viewer",
      contexts: ["link", "page"],
      targetUrlPatterns: ["*://*/*.md", "*://*/*.markdown", "file://*/*.md", "file://*/*.markdown"]
    });
  } catch {
  }
  try {
    chrome.contextMenus.create({ id: "crx-snip-text", title: "Process Text with CrossWord (CRX-Snip)", contexts: ["selection"] });
  } catch {
  }
  try {
    chrome.contextMenus.create({ id: "crx-snip-screen", title: "Capture & Process Screen Area (CRX-Snip)", contexts: ["page", "frame", "editable"] });
  } catch {
  }
  updateCustomInstructionMenus().catch(() => {
  });
});
const sendToTabOrActive = async (tabId, message) => {
  if (tabId != null && tabId >= 0) return chrome.tabs.sendMessage(tabId, message)?.catch?.(console.warn);
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true })?.catch?.(() => []);
  for (const tab of tabs || []) {
    if (tab?.id != null && tab.id >= 0) return chrome.tabs.sendMessage(tab.id, message)?.catch?.(console.warn);
  }
};
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const tabId = tab?.id;
  const menuId = String(info.menuItemId);
  const snipMap = {
    START_SNIP: "START_SNIP",
    SOLVE_AND_ANSWER: "SOLVE_AND_ANSWER",
    WRITE_CODE: "WRITE_CODE",
    EXTRACT_CSS: "EXTRACT_CSS"
  };
  if (menuId in snipMap) {
    sendToTabOrActive(tabId, { type: snipMap[menuId] });
    return;
  }
  if (menuId.startsWith(CUSTOM_PREFIX)) {
    sendToTabOrActive(tabId, { type: "CUSTOM_INSTRUCTION", instructionId: menuId.slice(CUSTOM_PREFIX.length) });
    return;
  }
  if (menuId === MD_VIEW_MENU_ID) {
    const candidate = info.linkUrl || info.pageUrl;
    if (candidate && isMarkdownUrl(candidate)) {
      void openMarkdownInViewer(candidate, tabId ?? 0);
      return;
    }
    openViewer(candidate, tabId);
    return;
  }
  if (menuId === "crx-snip-text" && info.selectionText) {
    processCrxSnipWithPipeline(info.selectionText, "text").then((r) => {
      chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: r.success ? "Text processed and copied!" : `Failed: ${r.error || "Unknown"}` });
    });
    return;
  }
  if (menuId === "crx-snip-screen") {
    (async () => {
      try {
        const imageData = await captureScreenArea();
        if (!imageData) {
          chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: "Capture cancelled" });
          return;
        }
        const r = await processCrxSnipWithPipeline(imageData, "image");
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: r.success ? "Captured and processed!" : `Failed: ${r.error || "Unknown"}` });
      } catch {
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: "Capture failed" });
      }
    })();
    return;
  }
  sendToTabOrActive(tabId, { type: menuId });
});
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "crx-snip-text") {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) return;
    try {
      const results = await chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: () => (typeof window != "undefined" ? window : globalThis)?.getSelection()?.toString() || "" });
      const text = results[0]?.result || "";
      if (text) {
        const r = await processCrxSnipWithPipeline(text, "text");
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: r.success ? "Text processed!" : `Failed: ${r.error}` });
      } else {
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: "Select text first, then Ctrl+Shift+X" });
      }
    } catch {
    }
  } else if (command === "crx-snip-screen") {
    try {
      const imageData = await captureScreenArea();
      if (imageData) {
        const r = await processCrxSnipWithPipeline(imageData, "image");
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: r.success ? "Captured and processed!" : `Failed: ${r.error}` });
      } else {
        chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: "Capture cancelled" });
      }
    } catch {
      chrome.notifications.create({ type: "basic", iconUrl: "icons/icon.png", title: "CrossWord CRX-Snip", message: "Capture failed" });
    }
  }
});
const captureScreenArea = async (options) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) throw new Error("No active tab");
    const opts = { format: "png", quality: 100, scale: options?.scale ?? 1 };
    if (options?.rect) opts.rect = options.rect;
    const screenshot = await chrome.tabs.captureVisibleTab(tabs[0].windowId, opts);
    const b64 = screenshot.split(",")[1];
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  } catch {
    try {
      const streamId = await new Promise((resolve, reject) => {
        chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], { frameRate: 1 }, (id) => id ? resolve(id) : reject(new Error("Cancelled")));
      });
      const offscreenUrl = chrome.runtime.getURL("offscreen/capture.html");
      const existing = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT] });
      if (!existing.length) {
        await chrome.offscreen.createDocument({ url: offscreenUrl, reasons: [chrome.offscreen.Reason.USER_MEDIA], justification: "Screen capture" });
      }
      const response = await chrome.runtime.sendMessage({ type: "capture-desktop", streamId });
      return response?.success && response?.imageData ? response.imageData : null;
    } catch {
      return null;
    }
  }
};
const processWithBuiltInInstruction = async (instruction, input, sender, mode, sendResponse) => {
  const requestId = `${mode}_${Date.now()}`;
  broadcast(AI_RECOGNITION_CHANNEL, { type: mode, requestId, status: "processing" });
  try {
    const gpt = await getGPTInstance();
    if (!gpt) {
      const err = { ok: false, error: "AI service not available" };
      broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, mode, ...err });
      sendResponse(err);
      return;
    }
    gpt.getPending?.()?.push?.({ type: "message", role: "user", content: [{ type: "input_text", text: instruction }, { type: "input_text", text: input || "" }] });
    const rawResponse = await gpt.sendRequest("high", "medium");
    const response = { ok: !!rawResponse, data: rawResponse || "", error: rawResponse ? void 0 : "Failed" };
    broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, mode, ...response });
    if (response.ok && response.data) await requestClipboardCopy(response.data, true, sender?.tab?.id);
    sendResponse(response);
  } catch (e) {
    const err = { ok: false, error: String(e) };
    broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, mode, ...err });
    showExtensionToast(`${mode} failed: ${e}`, "error");
    sendResponse(err);
  }
};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type) return false;
  if (message.type === "MAKE_TIMELINE") {
    createTimelineGenerator(message.source || null, message.speechPrompt || null).then(async (gptRes) => {
      sendResponse(await (requestNewTimeline(gptRes) || []));
    }).catch((e) => sendResponse({ error: e.message }));
    return true;
  }
  if (message.type === "gpt:recognize") {
    const requestId = message.requestId || `rec_${Date.now()}`;
    broadcast(AI_RECOGNITION_CHANNEL, { type: "recognize", requestId, status: "processing" });
    recognizeImageData(message.input, async (result) => {
      const response = { ok: result?.ok, data: result?.raw, error: result?.error };
      broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, ...response });
      if (result?.ok && result?.raw && message.autoCopy !== false) {
        const text = typeof result.raw === "string" ? result.raw : result.raw?.latex || result.raw?.text || JSON.stringify(result.raw);
        await requestClipboardCopy(text, true);
      }
      sendResponse(response);
    })?.catch?.((e) => {
      const err = { ok: false, error: String(e) };
      broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, ...err });
      showExtensionToast(`Recognition failed: ${e}`, "error");
      sendResponse(err);
    });
    return true;
  }
  if (message.type === "gpt:solve" || message.type === "gpt:answer" || message.type === "gpt:solve-answer") {
    processWithBuiltInInstruction(CRX_SOLVE_AND_ANSWER_INSTRUCTION, message.input, sender, "solve-answer", sendResponse);
    return true;
  }
  if (message.type === "gpt:code") {
    processWithBuiltInInstruction(CRX_WRITE_CODE_INSTRUCTION, message.input, sender, "code", sendResponse);
    return true;
  }
  if (message.type === "gpt:css") {
    processWithBuiltInInstruction(CRX_EXTRACT_CSS_INSTRUCTION, message.input, sender, "css", sendResponse);
    return true;
  }
  if (message.type === "gpt:custom") {
    (async () => {
      let instructionText = message.instruction;
      let instructionLabel = "Custom";
      if (!instructionText && message.instructionId) {
        const found = (await loadCustomInstructions().catch(() => [])).find((i) => i.id === message.instructionId);
        if (found) {
          instructionText = found.instruction;
          instructionLabel = found.label;
        }
      }
      if (!instructionText) {
        sendResponse({ ok: false, error: "No instruction found" });
        return;
      }
      const requestId = message.requestId || `custom_${Date.now()}`;
      broadcast(AI_RECOGNITION_CHANNEL, { type: "custom", requestId, label: instructionLabel, status: "processing" });
      processDataWithInstruction(message.input, { instruction: instructionText, outputFormat: "auto", intermediateRecognition: { enabled: false } }).then(async (result) => {
        const response = { ok: result?.ok, data: result?.data, error: result?.error };
        broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, mode: "custom", label: instructionLabel, ...response });
        if (result?.ok && result?.data && message.autoCopy !== false) await requestClipboardCopy(result.data, true, sender?.tab?.id);
        sendResponse(response);
      }).catch((e) => {
        const err = { ok: false, error: String(e) };
        broadcast(AI_RECOGNITION_CHANNEL, { type: "result", requestId, mode: "custom", label: instructionLabel, ...err });
        showExtensionToast(`${instructionLabel} failed: ${e}`, "error");
        sendResponse(err);
      });
    })();
    return true;
  }
  if (message.type === "gpt:translate") {
    (async () => {
      const inputText = message.input;
      const targetLang = message.targetLanguage || "English";
      if (!inputText?.trim()) {
        sendResponse({ ok: false, error: "No text" });
        return;
      }
      const instruction = `Translate the following text to ${targetLang}.
Preserve formatting (Markdown, KaTeX, code blocks, etc.).
Only translate natural language, keep technical notation unchanged.
Return ONLY the translated text.`;
      try {
        const settings = await loadSettings();
        const ai = (await settings)?.ai;
        if (!ai?.apiKey) {
          sendResponse({ ok: false, error: "No API key configured" });
          return;
        }
        const baseUrl = ai.baseUrl || "https://api.proxyapi.ru/openai/v1";
        const model = ai.model || "gpt-5.2";
        const res = await fetch(`${baseUrl}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.apiKey}` },
          body: JSON.stringify({ model, input: inputText, instructions: instruction, reasoning: { effort: "low" }, text: { verbosity: "low" } })
        });
        if (!res.ok) throw new Error(`Translation API: ${res.status}`);
        const data = await res.json();
        sendResponse({ ok: true, data: data?.output?.at?.(-1)?.content?.[0]?.text || inputText });
      } catch (e) {
        sendResponse({ ok: false, error: String(e), data: inputText });
      }
    })();
    return true;
  }
  if (message.type === "share-target") {
    const { title, text, url, files } = message.data || {};
    chrome.storage?.local?.set?.({ "rs-share-target-data": { title, text, url, files: files?.map?.((f) => f.name) || [], timestamp: Date.now() } }).catch(() => {
    });
    broadcast("rs-share-target", { type: "share-received", data: { title, text, url, timestamp: Date.now() } });
    showExtensionToast("Content received", "info");
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
chrome.webNavigation?.onCommitted?.addListener?.((details) => {
  if (details.frameId !== 0) return;
  const { tabId, url } = details;
  if (!isMarkdownUrl(url) || url.startsWith(VIEWER_ORIGIN) || url.startsWith("file:")) return;
  void openMarkdownInViewer(url, tabId);
});
chrome.webNavigation?.onCompleted?.addListener?.((details) => {
  (async () => {
    if (details.frameId !== 0) return;
    const { tabId, url } = details;
    if (!isMarkdownUrl(url) || url.startsWith(VIEWER_ORIGIN) || !url.startsWith("file:")) return;
    const text = await tryReadMarkdownFromTab(tabId, url);
    const key = text ? await putMarkdownToSession(text) : null;
    openViewer(url, tabId, key);
  })().catch(console.warn);
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "crx-snip") {
      if (!message.content) {
        sendResponse({ success: false, error: "missing content" });
        return;
      }
      sendResponse(await processCrxSnipWithPipeline(message.content, message.contentType || "text"));
      return;
    }
    if (message?.type === "crx-snip-screen-capture") {
      try {
        const imageData = await captureScreenArea(message.rect ? { rect: message.rect, scale: message.scale || 1 } : void 0);
        if (imageData) {
          sendResponse(await processCrxSnipWithPipeline(imageData, "image"));
        } else sendResponse({ success: false, error: "Capture cancelled" });
      } catch (e) {
        sendResponse({ success: false, error: e instanceof Error ? e.message : String(e) });
      }
      return;
    }
    if (message?.type === "crx-pipeline-status") {
      sendResponse({ success: true, status: pipeline.getStatus() });
      return;
    }
    if (message?.type === "crx-pipeline-pending") {
      sendResponse({ success: true, pending: pipeline.getPending(message.destinationType) });
      return;
    }
    if (message?.type === "crx-pipeline-clear-completed") {
      sendResponse({ success: true, clearedCount: pipeline.clearCompleted() });
      return;
    }
    if (message?.type === "crx-result-send-to-destination") {
      const pr = pipeline.resultQueue.find((r) => r.id === message.resultId);
      if (!pr || !message.destination) {
        sendResponse({ success: false, error: "Not found" });
        return;
      }
      pr.destinations.push(message.destination);
      if (pr.status === "completed") pr.status = "pending";
      sendResponse({ success: true, resultId: message.resultId });
      return;
    }
    if (message?.type !== "md:load") return;
    const src = typeof message.src === "string" ? message.src : "";
    if (!src) {
      sendResponse({ ok: false, error: "missing src" });
      return;
    }
    const fetched = await fetchMarkdownText(src);
    const key = fetched.ok && fetched.text ? await putMarkdownToSession(fetched.text) : null;
    sendResponse({ ok: fetched.ok, status: fetched.status, src: fetched.src, key });
  })().catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true;
});
enableCapture(chrome);
//# sourceMappingURL=background.js.map
