import { loadSettings, __vitePreload } from '../modules/Settings.js';
import { createTimelineGenerator, requestNewTimeline } from '../modules/MakeTimeline.js';
import { ableToShowImage, removeAnyPrefix, encodeWithJSquash } from '../modules/ImageProcess.js';
import { recognizeImageData, extractCSS, writeCode, solveAndAnswer, recognizeByInstructions, processDataWithInstruction, getGPTInstance } from '../modules/RecognizeData.js';
import { toText } from '../modules/Clipboard.js';
import { getCustomInstructions } from '../modules/CustomInstructions.js';
import { CRX_SOLVE_AND_ANSWER_INSTRUCTION, CRX_WRITE_CODE_INSTRUCTION, CRX_EXTRACT_CSS_INSTRUCTION } from '../modules/templates.js';
import { toBase64 } from '../modules/GPT-Responses.js';
import { crxMessaging, registerCrxHandler, broadcastToCrxTabs } from '../modules/CrxMessaging.js';
import '../modules/Env.js';
import '../modules/Toast.js';

const SIZE_THRESHOLD = 2 * 1024 * 1024;
const MARKDOWN_EXT_RE$1 = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;
const isProbablyUrl = (v) => {
  try {
    return Boolean(new URL(v));
  } catch {
    return false;
  }
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
          sendResponse({ ok: false, error: String(e) });
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
          sendResponse({ ok: false, error: String(e) });
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

class ActionHistoryStore {
  state;
  storageKey = "rs-action-history";
  constructor(maxEntries = 500, autoSave = true) {
    this.state = {
      entries: [],
      maxEntries,
      autoSave,
      filters: {}
    };
    this.loadHistory();
  }
  /**
   * Add a new action entry
   */
  addEntry(entry) {
    const fullEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now()
    };
    this.state.entries.unshift(fullEntry);
    if (this.state.entries.length > this.state.maxEntries) {
      this.state.entries = this.state.entries.slice(0, this.state.maxEntries);
    }
    return fullEntry;
  }
  /**
   * Update an existing entry
   */
  updateEntry(id, updates) {
    const index = this.state.entries.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    Object.assign(this.state.entries[index], updates);
    return true;
  }
  /**
   * Get entry by ID
   */
  getEntry(id) {
    return this.state.entries.find((entry) => entry.id === id);
  }
  /**
   * Get filtered entries
   */
  getEntries(filters) {
    let entries = [...this.state.entries];
    if (filters?.source) {
      entries = entries.filter((entry) => entry.context.source === filters.source);
    }
    if (filters?.action) {
      entries = entries.filter((entry) => entry.action === filters.action);
    }
    if (filters?.status) {
      entries = entries.filter((entry) => entry.status === filters.status);
    }
    if (filters?.dateRange) {
      entries = entries.filter(
        (entry) => entry.timestamp >= filters.dateRange.start && entry.timestamp <= filters.dateRange.end
      );
    }
    return entries;
  }
  /**
   * Get recent entries
   */
  getRecentEntries(limit = 50) {
    return this.state.entries.slice(0, limit);
  }
  /**
   * Remove entry
   */
  removeEntry(id) {
    const index = this.state.entries.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    this.state.entries.splice(index, 1);
    return true;
  }
  /**
   * Clear all entries
   */
  clearEntries() {
    this.state.entries = [];
  }
  /**
   * Set filters
   */
  setFilters(filters) {
    Object.assign(this.state.filters, filters);
  }
  /**
   * Get statistics
   */
  getStats() {
    const entries = this.state.entries;
    const total = entries.length;
    const completed = entries.filter((e) => e.status === "completed").length;
    const failed = entries.filter((e) => e.status === "failed").length;
    const pending = entries.filter((e) => e.status === "pending" || e.status === "processing").length;
    const bySource = entries.reduce((acc, entry) => {
      acc[entry.context.source] = (acc[entry.context.source] || 0) + 1;
      return acc;
    }, {});
    const byAction = entries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {});
    return {
      total,
      completed,
      failed,
      pending,
      successRate: total > 0 ? completed / total * 100 : 0,
      bySource,
      byAction
    };
  }
  /**
   * Export entries
   */
  exportEntries(format = "json", filters) {
    const entries = this.getEntries(filters);
    if (format === "csv") {
      const headers = ["ID", "Timestamp", "Source", "Action", "Status", "Input Type", "Result Type", "Processing Time"];
      const rows = entries.map((entry) => [
        entry.id,
        new Date(entry.timestamp).toISOString(),
        entry.context.source,
        entry.action,
        entry.status,
        entry.input.type,
        entry.result?.type || "",
        entry.result?.processingTime || ""
      ]);
      return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    }
    return JSON.stringify(entries, null, 2);
  }
  /**
   * Import entries
   */
  importEntries(data, format = "json") {
    let entries = [];
    if (format === "json") {
      try {
        entries = JSON.parse(data);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }
    } else {
      throw new Error("CSV import not implemented yet");
    }
    const validEntries = entries.filter(
      (entry) => entry.id && entry.timestamp && entry.context && entry.action
    );
    validEntries.forEach((entry) => {
      if (!this.getEntry(entry.id)) {
        this.state.entries.push(entry);
      }
    });
    this.state.entries.sort((a, b) => b.timestamp - a.timestamp);
    if (this.state.entries.length > this.state.maxEntries) {
      this.state.entries = this.state.entries.slice(0, this.state.maxEntries);
    }
    this.saveHistory();
    return validEntries.length;
  }
  generateId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  loadHistory() {
    try {
      if (typeof localStorage === "undefined") return;
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          this.state.entries = data.map((entry) => ({
            ...entry,
            // Ensure backward compatibility
            context: entry.context || { source: "unknown" },
            input: entry.input || { type: "unknown" },
            status: entry.status || "completed"
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to load action history:", e);
      this.state.entries = [];
    }
  }
  saveHistory() {
    if (!this.state.autoSave) return;
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.entries));
    } catch (e) {
      console.warn("Failed to save action history:", e);
    }
  }
}
const actionHistory = new ActionHistoryStore();

class ExecutionCore {
  rules = [];
  ruleSets = /* @__PURE__ */ new Map();
  constructor(rules) {
    this.initializeDefaultRules(rules ?? {
      recognitionFormat: "markdown",
      processingFormat: "markdown"
    });
  }
  /**
   * Register a new execution rule
   */
  registerRule(rule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  /**
   * Register a rule set
   */
  registerRuleSet(name, rules) {
    this.ruleSets.set(name, rules);
  }
  /**
   * Execute an action based on input and context
   */
  async execute(input, context, options = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry = {
      context,
      action: options.forceAction || "auto",
      input,
      status: "processing",
      ruleSet: options.ruleSet,
      executionId
    };
    const historyEntry = actionHistory.addEntry(entry);
    try {
      const rule = this.findMatchingRule(input, context, options);
      if (!rule) {
        throw new Error("No matching execution rule found");
      }
      actionHistory.updateEntry(historyEntry.id, { action: rule.action });
      const startTime = Date.now();
      const result = await rule.processor(input, context, options);
      const processingTime = Date.now() - startTime;
      const enhancedResult = {
        ...result,
        processingTime,
        autoCopied: rule.autoCopy
      };
      actionHistory.updateEntry(historyEntry.id, {
        result: enhancedResult,
        status: "completed",
        dataCategory: enhancedResult.dataCategory
      });
      if (rule.autoCopy && enhancedResult.type !== "error") {
        await this.autoCopyResult(enhancedResult, context);
      }
      return enhancedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      actionHistory.updateEntry(historyEntry.id, {
        status: "failed",
        error: errorMessage
      });
      return {
        type: "error",
        content: errorMessage
      };
    }
  }
  /**
   * Find the best matching rule for the given input and context
   */
  findMatchingRule(input, context, options) {
    if (options.forceAction) {
      const forcedRule = this.rules.find(
        (rule) => rule.action === options.forceAction && rule.source === context.source && rule.inputTypes.includes(input.type)
      );
      if (forcedRule) return forcedRule;
    }
    if (options.ruleSet) {
      const ruleSet = this.ruleSets.get(options.ruleSet);
      if (ruleSet) {
        const matchingRule = ruleSet.find(
          (rule) => rule.source === context.source && rule.inputTypes.includes(input.type) && rule.condition(input, context)
        );
        if (matchingRule) return matchingRule;
      }
    }
    return this.rules.find(
      (rule) => rule.source === context.source && rule.inputTypes.includes(input.type) && rule.condition(input, context)
    ) || null;
  }
  /**
   * Auto-copy result to clipboard
   */
  async autoCopyResult(result, context) {
    try {
      let textToCopy = "";
      switch (result.type) {
        case "markdown":
        case "text":
          textToCopy = result.content;
          break;
        case "json":
          try {
            const data = JSON.parse(result.content);
            if (typeof data === "string") {
              textToCopy = data;
            } else if (data.recognized_data) {
              textToCopy = Array.isArray(data.recognized_data) ? data.recognized_data.join("\n\n") : String(data.recognized_data);
            } else {
              textToCopy = result.content;
            }
          } catch {
            textToCopy = result.content;
          }
          break;
        case "html":
          textToCopy = result.content.replace(/<[^>]*>/g, "");
          break;
        default:
          return;
      }
      if (textToCopy.trim()) {
        if (context.source === "chrome-extension") {
          if (typeof chrome !== "undefined" && chrome.runtime) {
            return;
          }
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(textToCopy.trim());
        } else if (typeof document !== "undefined" && document.body) {
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy.trim();
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        } else {
          console.log("[ExecutionCore] Cannot auto-copy in service worker context - DOM not available");
          return;
        }
        this.notifyCopySuccess(context);
      }
    } catch (error) {
      console.warn("Failed to auto-copy result:", error);
    }
  }
  /**
   * Notify about successful copy
   */
  notifyCopySuccess(context) {
    const message = { type: "copy-success", context };
    if (context.source === "chrome-extension") {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(message);
      }
    } else {
      try {
        const bc = new BroadcastChannel("rs-clipboard");
        bc.postMessage(message);
        bc.close();
      } catch (e) {
        console.warn("Failed to broadcast copy success:", e);
      }
    }
  }
  /**
   * Initialize default execution rules
   */
  initializeDefaultRules(options) {
    this.registerRule({
      id: "workcenter-text-files-source",
      name: "Work Center Text File Source",
      description: "Process text/markdown files as source data",
      source: "workcenter",
      inputTypes: ["files"],
      action: "source",
      condition: (input) => {
        return input.files?.some(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        ) ?? false;
      },
      processor: async (input) => {
        const textFiles = input.files.filter(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        );
        let combinedContent = "";
        for (const file of textFiles) {
          try {
            const content = await file.text();
            combinedContent += content + "\n\n";
          } catch (error) {
            console.warn(`Failed to read text file ${file.name}:`, error);
          }
        }
        return {
          type: "markdown",
          content: combinedContent.trim(),
          dataCategory: "recognized",
          // Text files are already "recognized"
          responseId: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      },
      autoCopy: false,
      autoSave: true,
      priority: 11
      // Higher than recognition, lower than analysis
    });
    this.registerRule({
      id: "workcenter-files-recognize",
      name: "Work Center File Recognition",
      description: "Recognize content from uploaded files",
      source: "workcenter",
      inputTypes: ["files", "image"],
      action: "recognize",
      condition: (input) => Boolean((input?.files?.length ?? 0) > 0),
      processor: async (input, context, options2) => {
        let result;
        const formatInstruction = this.getRecognitionFormatInstruction(options2?.recognitionFormat);
        if (input.files.length > 1) {
          const messages = [
            {
              type: "message",
              role: "user",
              content: [
                { type: "input_text", text: `Analyze and recognize content from the following ${input.files.length} files. ${formatInstruction}` },
                ...(await Promise.all(input.files.map(async (file, index) => {
                  const FileCtor = globalThis.File;
                  const isFile = FileCtor && file instanceof FileCtor;
                  const header = { type: "input_text", text: `
--- File ${index + 1}: ${file.name} ---
` };
                  if (isFile && file.type.startsWith("image/")) {
                    try {
                      const arrayBuffer = await file.arrayBuffer();
                      const bytes = new Uint8Array(arrayBuffer);
                      const base64 = toBase64(bytes);
                      return [
                        header,
                        {
                          type: "input_image",
                          detail: "auto",
                          image_url: `data:${file.type};base64,${base64}`
                        }
                      ];
                    } catch (error) {
                      console.warn(`Failed to process image ${file.name}:`, error);
                      return [
                        header,
                        {
                          type: "input_text",
                          text: `[Failed to process image: ${file.name}]`
                        }
                      ];
                    }
                  } else {
                    try {
                      const text = await file.text();
                      return [
                        header,
                        {
                          type: "input_text",
                          text
                        }
                      ];
                    } catch (error) {
                      console.warn(`Failed to read file ${file.name}:`, error);
                      return [
                        header,
                        {
                          type: "input_text",
                          text: `[Failed to read file: ${file.name}]`
                        }
                      ];
                    }
                  }
                }))).flat()
              ].filter((item) => item !== null)
            }
          ];
          result = await processDataWithInstruction(
            messages,
            {
              instruction: `Analyze and recognize content from the provided files. ${formatInstruction}`,
              outputFormat: options2?.recognitionFormat || "auto",
              intermediateRecognition: { enabled: false }
              // Already processed
            }
          );
        } else {
          const file = input.files[0];
          const FileCtor = globalThis.File;
          const isFile = FileCtor && file instanceof FileCtor;
          if (isFile && file.type.startsWith("image/")) {
            try {
              const arrayBuffer = await file.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = toBase64(bytes);
              const dataUrl = `data:${file.type};base64,${base64}`;
              result = await processDataWithInstruction(
                dataUrl,
                {
                  instruction: `Analyze and recognize content from the provided image. ${formatInstruction}`,
                  outputFormat: options2?.recognitionFormat || "auto",
                  intermediateRecognition: { enabled: false }
                }
              );
            } catch (error) {
              console.warn(`Failed to process image ${file.name}:`, error);
              result = await processDataWithInstruction(
                file,
                {
                  instruction: `Analyze and recognize content from the provided file. ${formatInstruction}`,
                  outputFormat: options2?.recognitionFormat || "auto",
                  intermediateRecognition: { enabled: false }
                }
              );
            }
          } else {
            result = await processDataWithInstruction(
              file,
              {
                instruction: "Analyze and recognize content from the provided file",
                outputFormat: options2?.recognitionFormat || "auto",
                intermediateRecognition: { enabled: false }
              }
            );
          }
        }
        return {
          type: this.detectResultFormat(result),
          content: this.formatAIResult(result),
          rawData: result,
          responseId: result.responseId,
          dataCategory: "recognized"
        };
      },
      autoCopy: false,
      autoSave: true,
      priority: 10
    });
    this.registerRule({
      id: "workcenter-text-analyze",
      name: "Work Center Text Analysis",
      description: "Analyze provided text content",
      source: "workcenter",
      inputTypes: ["text", "markdown"],
      action: "analyze",
      condition: (input) => Boolean(input.text || input.recognizedContent),
      processor: async (input, context, options2) => {
        const content = input.recognizedContent || input.recognizedData?.content || input.text || "";
        const hasImages = input.files?.some((f) => f.type.startsWith("image/") || f.type === "image/svg+xml") || false;
        const hasSvgContent = typeof content === "string" && content.includes("<svg");
        const userInstruction = input.text && input.text.trim() && input.text.trim() !== "Analyze and process the provided content intelligently";
        const instructions = userInstruction ? input?.text?.trim?.() : `Analyze the provided content. ${this.getProcessingFormatInstruction(options2?.processingFormat)}`;
        const result = await processDataWithInstruction(
          hasImages || hasSvgContent ? [content, ...input.files || []] : content,
          {
            instruction: instructions,
            outputFormat: options2?.processingFormat || "auto",
            outputLanguage: "auto",
            enableSVGImageGeneration: "auto",
            intermediateRecognition: {
              enabled: hasImages,
              outputFormat: options2?.recognitionFormat || "markdown",
              dataPriorityInstruction: void 0,
              cacheResults: true
            },
            dataType: hasSvgContent ? "svg" : hasImages ? "image" : "text",
            processingEffort: "medium",
            processingVerbosity: "medium"
          }
        );
        return {
          type: this.detectResultFormat(result),
          content: this.formatAIResult(result),
          rawData: result,
          responseId: result.responseId,
          dataCategory: "processed"
        };
      },
      autoCopy: false,
      autoSave: true,
      priority: 9
    });
    this.registerRule({
      id: "share-target-text-files-source",
      name: "Share Target Text File Source",
      description: "Process shared text/markdown files as source data",
      source: "share-target",
      inputTypes: ["files"],
      action: "source",
      condition: (input) => {
        return input.files?.some(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        ) ?? false;
      },
      processor: async (input) => {
        const textFiles = input.files.filter(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        );
        let combinedContent = "";
        for (const file of textFiles) {
          try {
            const content = await file.text();
            combinedContent += content + "\n\n";
          } catch (error) {
            console.warn(`Failed to read text file ${file.name}:`, error);
          }
        }
        return {
          type: "markdown",
          content: combinedContent.trim(),
          dataCategory: "recognized",
          // Text files are already "recognized"
          responseId: `share_source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      },
      autoCopy: false,
      autoSave: true,
      priority: 16
      // Higher priority for share target
    });
    this.registerRule({
      id: "share-target-images-recognize",
      name: "Share Target Image Recognition",
      description: "Recognize content from shared images",
      source: "share-target",
      inputTypes: ["image", "files"],
      action: "recognize",
      condition: (input) => input.files?.some((f) => f.type.startsWith("image/")) || false,
      processor: async (input) => {
        const imageFiles = input.files.filter((f) => f.type.startsWith("image/"));
        let result;
        if (imageFiles.length > 1) {
          const messages = [
            {
              type: "message",
              role: "user",
              content: [
                { type: "input_text", text: `Recognize and extract text/content from the following ${imageFiles.length} shared images:` },
                ...(await Promise.all(imageFiles.map(async (file, index) => {
                  try {
                    const arrayBuffer = await file.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    const base64 = btoa(String.fromCharCode(...bytes));
                    return [
                      { type: "input_text", text: `
--- Image ${index + 1}: ${file.name} ---
` },
                      {
                        type: "input_image",
                        detail: "auto",
                        image_url: `data:${file.type};base64,${base64}`
                      }
                    ];
                  } catch (error) {
                    console.warn(`Failed to process image ${file.name}:`, error);
                    return [
                      { type: "input_text", text: `
--- Image ${index + 1}: ${file.name} ---
` },
                      {
                        type: "input_text",
                        text: `[Failed to process image: ${file.name}]`
                      }
                    ];
                  }
                }))).flat()
              ]
            }
          ];
          result = await processDataWithInstruction(
            messages,
            {
              instruction: "Recognize and extract text/content from the shared images",
              outputFormat: options?.recognitionFormat || "auto",
              intermediateRecognition: { enabled: false }
            }
          );
        } else {
          result = await processDataWithInstruction(
            imageFiles[0],
            {
              instruction: "Recognize and extract text/content from the shared image",
              outputFormat: options?.recognitionFormat || "auto",
              intermediateRecognition: { enabled: false }
            }
          );
        }
        return {
          type: this.detectResultFormat(result),
          content: this.formatAIResult(result),
          rawData: result,
          responseId: result.responseId,
          dataCategory: "recognized"
        };
      },
      autoCopy: true,
      autoSave: true,
      priority: 15
    });
    this.registerRule({
      id: "share-target-markdown-view",
      name: "Share Target Markdown View",
      description: "View shared markdown content",
      source: "share-target",
      inputTypes: ["text", "markdown"],
      action: "view",
      condition: (input) => this.isMarkdownContent(input.text || ""),
      processor: async (input) => {
        return {
          type: "markdown",
          content: input.text || ""
        };
      },
      autoCopy: false,
      autoSave: true,
      priority: 14
    });
    this.registerRule({
      id: "share-target-url-analyze",
      name: "Share Target URL Analysis",
      description: "Analyze shared URL content",
      source: "share-target",
      inputTypes: ["url"],
      action: "analyze",
      condition: () => true,
      processor: async (input, context, options2) => {
        const instructions = `Analyze the content from this URL and provide insights. ${this.getProcessingFormatInstruction(options2?.processingFormat)}`;
        const result = await processDataWithInstruction(
          input.url,
          {
            instruction: instructions,
            outputFormat: options2?.processingFormat || "auto",
            outputLanguage: "auto",
            enableSVGImageGeneration: "auto",
            intermediateRecognition: { enabled: false },
            dataType: "text"
          }
        );
        return {
          type: this.detectResultFormat(result),
          content: this.formatAIResult(result),
          rawData: result,
          responseId: result.responseId,
          dataCategory: "recognized"
        };
      },
      autoCopy: true,
      autoSave: true,
      priority: 13
    });
    this.registerRule({
      id: "chrome-extension-text-files-source",
      name: "Chrome Extension Text File Source",
      description: "Process Chrome extension text/markdown files as source data",
      source: "chrome-extension",
      inputTypes: ["files"],
      action: "source",
      condition: (input) => {
        return input.files?.some(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        ) ?? false;
      },
      processor: async (input) => {
        const textFiles = input.files.filter(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        );
        let combinedContent = "";
        for (const file of textFiles) {
          try {
            const content = await file.text();
            combinedContent += content + "\n\n";
          } catch (error) {
            console.warn(`Failed to read text file ${file.name}:`, error);
          }
        }
        return {
          type: "markdown",
          content: combinedContent.trim(),
          dataCategory: "recognized",
          // Text files are already "recognized"
          responseId: `crx_source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      },
      autoCopy: true,
      // Chrome extension often wants immediate results
      autoSave: true,
      priority: 26
      // Higher priority for Chrome extension
    });
    this.registerRule({
      id: "chrome-extension-screenshot-recognize",
      name: "Chrome Extension Screenshot Recognition",
      description: "Recognize content from screenshot",
      source: "chrome-extension",
      inputTypes: ["image"],
      action: "recognize",
      condition: () => true,
      processor: async (input) => {
        let result;
        if (input.files.length > 1) {
          const messages = [
            {
              type: "message",
              role: "user",
              content: [
                { type: "input_text", text: `Analyze the following ${input.files.length} screenshots and extract any visible text or content:` },
                ...(await Promise.all(input.files.map(async (file, index) => {
                  try {
                    const arrayBuffer = await file.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    const base64 = toBase64(bytes);
                    return [
                      { type: "input_text", text: `
--- Screenshot ${index + 1}: ${file.name} ---
` },
                      {
                        type: "input_image",
                        detail: "auto",
                        image_url: `data:${file.type};base64,${base64}`
                      }
                    ];
                  } catch (error) {
                    console.warn(`Failed to process screenshot ${file.name}:`, error);
                    return [
                      { type: "input_text", text: `
--- Screenshot ${index + 1}: ${file.name} ---
` },
                      {
                        type: "input_text",
                        text: `[Failed to process screenshot: ${file.name}]`
                      }
                    ];
                  }
                }))).flat()
              ]
            }
          ];
          result = await processDataWithInstruction(
            messages,
            {
              instruction: "Analyze the screenshots and extract any visible text or content",
              outputFormat: options?.recognitionFormat || "auto",
              intermediateRecognition: { enabled: false }
            }
          );
        } else {
          const file = input.files[0];
          const FileCtor = globalThis.File;
          const isFile = FileCtor && file instanceof FileCtor;
          if (isFile && file.type.startsWith("image/")) {
            try {
              const arrayBuffer = await file.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = toBase64(bytes);
              const dataUrl = `data:${file.type};base64,${base64}`;
              result = await processDataWithInstruction(
                dataUrl,
                {
                  instruction: "Analyze the screenshot and extract any visible text or content",
                  outputFormat: options?.recognitionFormat || "auto",
                  intermediateRecognition: { enabled: false }
                }
              );
            } catch (error) {
              console.warn(`Failed to process screenshot ${file.name}:`, error);
              result = await processDataWithInstruction(
                file,
                {
                  instruction: "Analyze the screenshot and extract any visible text or content",
                  outputFormat: options?.recognitionFormat || "auto",
                  intermediateRecognition: { enabled: false }
                }
              );
            }
          } else {
            result = await processDataWithInstruction(
              file,
              {
                instruction: "Analyze the screenshot and extract any visible text or content",
                outputFormat: options?.recognitionFormat || "auto",
                intermediateRecognition: { enabled: false }
              }
            );
          }
        }
        return {
          type: this.detectResultFormat(result),
          content: this.formatAIResult(result),
          rawData: result,
          responseId: result.responseId,
          dataCategory: "recognized"
        };
      },
      autoCopy: true,
      autoSave: true,
      priority: 20
    });
    this.registerRule({
      id: "launch-queue-text-files-source",
      name: "Launch Queue Text File Source",
      description: "Process launch queue text/markdown files as source data",
      source: "launch-queue",
      inputTypes: ["files"],
      action: "source",
      condition: (input) => {
        return input.files?.some(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        ) ?? false;
      },
      processor: async (input) => {
        const textFiles = input.files.filter(
          (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
        );
        let combinedContent = "";
        for (const file of textFiles) {
          try {
            const content = await file.text();
            combinedContent += content + "\n\n";
          } catch (error) {
            console.warn(`Failed to read text file ${file.name}:`, error);
          }
        }
        return {
          type: "markdown",
          content: combinedContent.trim(),
          dataCategory: "recognized",
          // Text files are already "recognized"
          responseId: `launch_source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      },
      autoCopy: true,
      // Launch queue often wants immediate results
      autoSave: true,
      priority: 21
      // Higher priority for launch queue
    });
    this.registerRule({
      id: "launch-queue-files-process",
      name: "Launch Queue File Processing",
      description: "Process files from launch queue",
      source: "launch-queue",
      inputTypes: ["files", "mixed"],
      action: "process",
      condition: () => true,
      processor: async (input) => {
        let result;
        if (input.files.length > 1) {
          const messages = [
            {
              type: "message",
              role: "user",
              content: [
                { type: "input_text", text: `Process the following ${input.files.length} files:` },
                ...(await Promise.all(input.files.map(async (file, index) => {
                  const FileCtor = globalThis.File;
                  const isFile = FileCtor && file instanceof FileCtor;
                  const header = { type: "input_text", text: `
--- File ${index + 1}: ${file.name} ---
` };
                  if (isFile && file.type.startsWith("image/")) {
                    try {
                      const arrayBuffer = await file.arrayBuffer();
                      const bytes = new Uint8Array(arrayBuffer);
                      const base64 = toBase64(bytes);
                      return [
                        header,
                        {
                          type: "input_image",
                          detail: "auto",
                          image_url: `data:${file.type};base64,${base64}`
                        }
                      ];
                    } catch (error) {
                      console.warn(`Failed to process file ${file.name}:`, error);
                      return [
                        header,
                        {
                          type: "input_text",
                          text: `[Failed to process file: ${file.name}]`
                        }
                      ];
                    }
                  } else {
                    try {
                      const text = await file.text();
                      return [
                        header,
                        {
                          type: "input_text",
                          text
                        }
                      ];
                    } catch (error) {
                      console.warn(`Failed to read file ${file.name}:`, error);
                      return [
                        header,
                        {
                          type: "input_text",
                          text: `[Failed to read file: ${file.name}]`
                        }
                      ];
                    }
                  }
                }))).flat()
              ]
            }
          ];
          result = await processDataWithInstruction(
            messages,
            {
              instruction: "Process the provided content",
              outputFormat: options?.processingFormat || "auto",
              intermediateRecognition: { enabled: false }
            }
          );
        } else {
          const file = input.files[0];
          const FileCtor = globalThis.File;
          const isFile = FileCtor && file instanceof FileCtor;
          if (isFile && file.type.startsWith("image/")) {
            try {
              const arrayBuffer = await file.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = toBase64(bytes);
              const dataUrl = `data:${file.type};base64,${base64}`;
              result = await processDataWithInstruction(
                dataUrl,
                {
                  instruction: "Process the provided image content",
                  outputFormat: options?.processingFormat || "auto",
                  intermediateRecognition: { enabled: false }
                }
              );
            } catch (error) {
              console.warn(`Failed to process image ${file.name}:`, error);
              result = await processDataWithInstruction(
                file,
                {
                  instruction: "Process the provided content",
                  outputFormat: options?.processingFormat || "auto",
                  intermediateRecognition: { enabled: false }
                }
              );
            }
          } else {
            result = await processDataWithInstruction(
              file,
              {
                instruction: "Process the provided content",
                outputFormat: options?.processingFormat || "auto",
                intermediateRecognition: { enabled: false }
              }
            );
          }
        }
        return {
          type: this.detectResultFormat(result),
          content: this.formatAIResult(result),
          rawData: result,
          responseId: result.responseId,
          dataCategory: "recognized"
        };
      },
      autoCopy: true,
      autoSave: true,
      priority: 12
    });
  }
  /**
   * Check if content is markdown
   */
  isMarkdownContent(text) {
    if (!text || typeof text !== "string") return false;
    const trimmed = text.trim();
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) return false;
    if (/<[a-zA-Z][^>]*>/.test(trimmed)) return false;
    const patterns = [
      /^---[\s\S]+?---/,
      // YAML frontmatter
      /^#{1,6}\s+.+$/m,
      // Headings
      /^\s*[-*+]\s+\S+/m,
      // Unordered lists
      /^\s*\d+\.\s+\S+/m,
      // Ordered lists
      /`{1,3}[^`]*`{1,3}/,
      // Code blocks/inline code
      /\[([^\]]+)\]\(([^)]+)\)/,
      // Links
      /!\[([^\]]+)\]\(([^)]+)\)/
      // Images
    ];
    return patterns.some((pattern) => pattern.test(text));
  }
  /**
   * Format AI result for display
   */
  detectResultFormat(result) {
    if (!result) return "text";
    try {
      const data = result.data || result;
      if (data && typeof data === "object") {
        const hasStructuredFields = [
          "recognized_data",
          "verbose_data",
          "keywords_and_tags",
          "confidence",
          "suggested_type",
          "using_ready"
        ].some((field) => field in data);
        if (hasStructuredFields) {
          return "json";
        }
        if (data.content || data.text || data.message) {
          return "markdown";
        }
        return "json";
      }
      if (typeof data === "string") {
        if (data.includes("\n") || data.includes("#") || data.includes("*") || data.includes("`")) {
          return "markdown";
        }
        return "text";
      }
      return "json";
    } catch (error) {
      console.warn("Failed to detect result format:", error);
      return "text";
    }
  }
  formatAIResult(result) {
    if (!result) return "No result";
    try {
      let content = "";
      if (result.data) {
        if (typeof result.data === "string") {
          content = result.data;
        } else if (result.data.recognized_data) {
          const recognized = result.data.recognized_data;
          content = Array.isArray(recognized) ? recognized.join("\n\n") : String(recognized);
        } else {
          content = JSON.stringify(result.data, null, 2);
        }
      } else if (typeof result === "string") {
        content = result;
      } else {
        content = JSON.stringify(result, null, 2);
      }
      content = this.unwrapUnwantedCodeBlocks(content);
      return content;
    } catch (error) {
      console.warn("Failed to format AI result:", error);
      return String(result);
    }
  }
  unwrapUnwantedCodeBlocks(content) {
    if (!content) return content;
    const codeBlockRegex = /^```(?:katex|md|markdown|html|xml|json|text)?\n([\s\S]*?)\n```$/;
    const match = content.trim().match(codeBlockRegex);
    if (match) {
      const unwrapped = match[1].trim();
      const lines = unwrapped.split("\n");
      if (lines.length === 1 || unwrapped.includes("<math") || unwrapped.includes('<span class="katex') || unwrapped.includes("<content") || unwrapped.startsWith("<") && unwrapped.endsWith(">") || /^\s*<[^>]+>/.test(unwrapped)) {
        console.log("[AI Response] Unwrapped unwanted code block formatting");
        return unwrapped;
      }
      if (lines.length > 3 || lines.some((line) => line.match(/^\s{4,}/) || line.includes("function") || line.includes("const ") || line.includes("let "))) {
        return content;
      }
      console.log("[AI Response] Unwrapped unwanted code block formatting");
      return unwrapped;
    }
    return content;
  }
  getRecognitionFormatInstruction(format) {
    if (!format || format === "auto") {
      return "Output the content in the most appropriate format (markdown is preferred for structured content).";
    }
    switch (format) {
      case "most-suitable":
        return "Analyze the content and output it in the most suitable format for its type and structure. Choose the format that best represents the content's nature and purpose.";
      case "most-optimized":
        return "Output the content in the most optimized format for storage and transmission efficiency. Prefer compact representations while maintaining essential information.";
      case "most-legibility":
        return "Output the content in the most human-readable and legible format. Prioritize clarity, readability, and ease of understanding over compactness.";
      case "markdown":
        return "Output the recognized content in Markdown format.";
      case "html":
        return "Output the recognized content in HTML format.";
      case "text":
        return "Output the recognized content as plain text.";
      case "json":
        return "Output the recognized content as structured JSON data.";
      default:
        return "Output the content in the most appropriate format (markdown is preferred for structured content).";
    }
  }
  getProcessingFormatInstruction(format) {
    if (!format || format === "markdown") {
      return "Output the processed result in Markdown format.";
    }
    switch (format) {
      case "html":
        return "Output the processed result in HTML format.";
      case "json":
        return "Output the processed result as structured JSON data.";
      case "text":
        return "Output the processed result as plain text.";
      case "typescript":
        return "Output the processed result as TypeScript code.";
      case "javascript":
        return "Output the processed result as JavaScript code.";
      case "python":
        return "Output the processed result as Python code.";
      case "java":
        return "Output the processed result as Java code.";
      case "cpp":
        return "Output the processed result as C++ code.";
      case "csharp":
        return "Output the processed result as C# code.";
      case "php":
        return "Output the processed result as PHP code.";
      case "ruby":
        return "Output the processed result as Ruby code.";
      case "go":
        return "Output the processed result as Go code.";
      case "rust":
        return "Output the processed result as Rust code.";
      case "xml":
        return "Output the processed result in XML format.";
      case "yaml":
        return "Output the processed result in YAML format.";
      case "css":
        return "Output the processed result as CSS code.";
      case "scss":
        return "Output the processed result as SCSS code.";
      default:
        return "Output the processed result in Markdown format.";
    }
  }
}
const executionCore = new ExecutionCore();

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
      const results = await chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: () => window.getSelection()?.toString() || "" });
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
