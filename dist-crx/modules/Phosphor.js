const styles = "@property --icon-image{syntax:\"<image>\";inherits:true;initial-value:linear-gradient(#0000,#0000)}@property --icon-color{syntax:\"<color>\";inherits:true;initial-value:#fff}@layer ui-icon{:host(ui-icon){--icon-size:1.25rem;--icon-color:currentColor;--icon-padding:0.125rem}:host(ui-icon){background-color:initial!important;block-size:stretch;box-sizing:border-box;contain:none;content-visibility:visible;display:inline-grid!important;inline-size:max-content;mask-image:none;max-block-size:stretch;max-inline-size:stretch;min-block-size:min(var(--icon-size,1rem),100%);min-inline-size:min(var(--icon-size,1rem),100%);padding:var(--icon-padding,.125rem);place-content:center;place-items:center;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;aspect-ratio:1/1!important;backface-visibility:hidden;color:var(--icon-color,currentColor)!important;font-size:0;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);line-height:0;object-fit:contain;object-position:center;overflow:visible;transform:translateZ(0);transform-origin:50% 50%;interactivity:inert}:host(ui-icon):before{aspect-ratio:1/1!important;backdrop-filter:none!important;background-color:var(--icon-color,currentColor)!important;block-size:stretch;border:none;color:var(--icon-color,currentColor)!important;content:\"\";content-visibility:visible;display:flex;filter:none!important;font-size:0;inline-size:stretch;line-height:0;margin:0;mask-clip:content-box;mask-image:var(--icon-image,linear-gradient(#0000,#0000))!important;mask-origin:content-box;mask-position:center;mask-repeat:no-repeat;mask-size:contain;mask-type:alpha;object-fit:contain;object-position:center;opacity:1!important;outline:none;padding:0;pointer-events:none;user-select:none;interactivity:inert;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;backface-visibility:hidden;overflow:hidden;transform:translateZ(0);transform-origin:50% 50%}}";

const CACHE_VERSION = 2;
const ROOT_DIR_NAME = "icon-cache";
const VECTOR_DIR = "vector";
const RASTER_DIR = "raster";
const META_FILE = ".cache-meta.json";
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1e3;
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024;
let rootHandle = null;
let vectorDirHandle = null;
let rasterDirHandle = null;
let isSupported = null;
let initPromise = null;
const isOPFSSupported = () => {
  if (isSupported !== null) return isSupported;
  try {
    isSupported = !!(typeof navigator !== "undefined" && "storage" in navigator && typeof navigator.storage?.getDirectory === "function" && typeof FileSystemFileHandle !== "undefined" && typeof FileSystemDirectoryHandle !== "undefined");
  } catch {
    isSupported = false;
  }
  return isSupported;
};
const sanitizeKey = (key) => {
  if (!key || typeof key !== "string") return "_empty_";
  return key.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\.{2,}/g, "_").replace(/^\./, "_").slice(0, 200);
};
const initOPFSCache = async () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!isOPFSSupported()) return false;
    try {
      const storageRoot = await navigator.storage.getDirectory();
      rootHandle = await storageRoot.getDirectoryHandle(ROOT_DIR_NAME, { create: true });
      const meta = await readCacheMeta();
      const now = Date.now();
      if (meta && meta.version !== CACHE_VERSION) {
        if (typeof console !== "undefined") {
          console.log?.("[icon-cache] Cache version mismatch, clearing cache");
        }
        await clearAllCache();
      } else if (meta && now - meta.lastAccess > MAX_CACHE_AGE_MS) {
        if (typeof console !== "undefined") {
          console.log?.("[icon-cache] Cache expired, clearing cache");
        }
        await clearAllCache();
      } else {
        const stats = await getCacheStats();
        if (stats && stats.totalSize > MAX_CACHE_SIZE_BYTES) {
          if (typeof console !== "undefined") {
            console.log?.("[icon-cache] Cache size exceeded, clearing cache");
          }
          await clearAllCache();
        }
      }
      vectorDirHandle = await rootHandle.getDirectoryHandle(VECTOR_DIR, { create: true });
      rasterDirHandle = await rootHandle.getDirectoryHandle(RASTER_DIR, { create: true });
      await writeCacheMeta();
      return true;
    } catch (error) {
      if (typeof console !== "undefined") {
        console.warn?.("[icon-cache] OPFS init failed:", error);
      }
      rootHandle = null;
      vectorDirHandle = null;
      rasterDirHandle = null;
      return false;
    }
  })();
  return initPromise;
};
const readCacheMeta = async () => {
  if (!rootHandle) return null;
  try {
    const fileHandle = await rootHandle.getFileHandle(META_FILE);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
};
const writeCacheMeta = async () => {
  if (!rootHandle) return;
  try {
    const fileHandle = await rootHandle.getFileHandle(META_FILE, { create: true });
    const writable = await fileHandle.createWritable();
    const meta = {
      version: CACHE_VERSION,
      created: Date.now(),
      lastAccess: Date.now()
    };
    await writable.write(JSON.stringify(meta));
    await writable.close();
  } catch {
  }
};
const cacheVectorIcon = async (key, svgContent) => {
  if (!vectorDirHandle) {
    const ready = await initOPFSCache();
    if (!ready || !vectorDirHandle) return false;
  }
  try {
    const filename = sanitizeKey(key) + ".svg";
    const fileHandle = await vectorDirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    if (svgContent instanceof Blob) {
      await writable.write(svgContent);
    } else {
      await writable.write(new Blob([svgContent], { type: "image/svg+xml" }));
    }
    await writable.close();
    return true;
  } catch (error) {
    if (typeof console !== "undefined") {
      console.warn?.("[icon-cache] Failed to cache vector:", key, error);
    }
    return false;
  }
};
const getCachedVectorIcon = async (key) => {
  if (!vectorDirHandle) {
    const ready = await initOPFSCache();
    if (!ready || !vectorDirHandle) return null;
  }
  try {
    const filename = sanitizeKey(key) + ".svg";
    const fileHandle = await vectorDirHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
};
const clearAllCache = async () => {
  if (!rootHandle) {
    const ready = await initOPFSCache();
    if (!ready || !rootHandle) return;
  }
  try {
    for await (const [name] of rootHandle.entries()) {
      if (name !== META_FILE) {
        await rootHandle.removeEntry(name, { recursive: true });
      }
    }
    vectorDirHandle = null;
    rasterDirHandle = null;
    initPromise = null;
    await initOPFSCache();
  } catch (error) {
    if (typeof console !== "undefined") {
      console.warn?.("[icon-cache] Failed to clear cache:", error);
    }
  }
};
const getCacheStats = async () => {
  if (!vectorDirHandle || !rasterDirHandle) {
    const ready = await initOPFSCache();
    if (!ready) return null;
  }
  try {
    let vectorCount = 0;
    let rasterCount = 0;
    let totalSize = 0;
    for await (const [, handle] of vectorDirHandle.entries()) {
      if (handle.kind === "file") {
        vectorCount++;
        const file = await handle.getFile();
        totalSize += file.size;
      }
    }
    for await (const [, handle] of rasterDirHandle.entries()) {
      if (handle.kind === "file") {
        rasterCount++;
        const file = await handle.getFile();
        totalSize += file.size;
      }
    }
    return { vectorCount, rasterCount, totalSize };
  } catch {
    return null;
  }
};
const validateAndCleanCache = async () => {
  if (!vectorDirHandle || !rasterDirHandle) {
    const ready = await initOPFSCache();
    if (!ready) return;
  }
  const corruptedKeys = [];
  try {
    for await (const [name, handle] of vectorDirHandle.entries()) {
      if (handle.kind === "file" && name.endsWith(".svg")) {
        try {
          const file = await handle.getFile();
          if (file.size === 0) {
            corruptedKeys.push(`vector:${name}`);
            continue;
          }
          const text = await file.text();
          if (!text.trim().startsWith("<svg")) {
            corruptedKeys.push(`vector:${name}`);
          }
        } catch {
          corruptedKeys.push(`vector:${name}`);
        }
      }
    }
    for await (const [name, handle] of rasterDirHandle.entries()) {
      if (handle.kind === "file" && (name.endsWith(".png") || name.endsWith(".webp"))) {
        try {
          const file = await handle.getFile();
          if (file.size === 0) {
            corruptedKeys.push(`raster:${name}`);
          }
        } catch {
          corruptedKeys.push(`raster:${name}`);
        }
      }
    }
    for (const key of corruptedKeys) {
      try {
        const [type, filename] = key.split(":");
        if (type === "vector" && vectorDirHandle) {
          await vectorDirHandle.removeEntry(filename);
        } else if (type === "raster" && rasterDirHandle) {
          await rasterDirHandle.removeEntry(filename);
        }
      } catch {
      }
    }
    if (corruptedKeys.length > 0 && typeof console !== "undefined") {
      console.log?.(`[icon-cache] Cleaned up ${corruptedKeys.length} corrupted cache entries`);
    }
  } catch (error) {
    if (typeof console !== "undefined") {
      console.warn?.("[icon-cache] Cache validation failed:", error);
    }
  }
};
if (isOPFSSupported()) {
  initOPFSCache().then(() => {
    validateAndCleanCache().catch(() => {
    });
  }).catch(() => {
  });
}

const MIN_RASTER_SIZE$1 = 32;
let iconStyleSheet = null;
const registeredRules = /* @__PURE__ */ new Set();
const registeredRuleData = /* @__PURE__ */ new Map();
const PERSISTENT_REGISTRY_KEY = "ui-icon-registry-state.v2";
const LEGACY_PERSISTENT_KEYS = ["ui-icon-registry-state"];
const extractFirstCssUrl = (cssText) => {
  if (!cssText || typeof cssText !== "string") return null;
  const match = cssText.match(/url\(\s*(['"]?)([^'")\s]+)\1\s*\)/i);
  return match?.[2] ?? null;
};
const isPersistableRuleCssText = (cssText) => {
  const url = extractFirstCssUrl(cssText);
  if (!url) {
    return false;
  }
  if (/^blob:/i.test(url)) {
    return false;
  }
  if (/^data:/i.test(url)) {
    return true;
  }
  if (/^https?:/i.test(url)) {
    try {
      if (typeof location !== "undefined" && typeof URL === "function") {
        return new URL(url).origin === location.origin;
      }
    } catch {
      return false;
    }
    return false;
  }
  return true;
};
let pendingRules = [];
let flushScheduled = false;
const ICON_PROXY_PATH = "/api/icon-proxy";
const isChromeExtensionRuntime = () => {
  try {
    const chromeRuntime = globalThis?.chrome?.runtime;
    return !!chromeRuntime?.id;
  } catch {
    return false;
  }
};
const tryRewriteCrossOriginUrlToProxy = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
  if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) return trimmed;
  if (!/^https?:/i.test(trimmed)) return trimmed;
  if (isChromeExtensionRuntime()) return trimmed;
  try {
    if (typeof location === "undefined" || typeof URL !== "function") return trimmed;
    const u = new URL(trimmed);
    if (u.origin === location.origin) return trimmed;
    return `${ICON_PROXY_PATH}?url=${encodeURIComponent(trimmed)}`;
  } catch {
    return null;
  }
};
const rewriteCssUrlFunctionValue = (cssValue) => {
  if (!cssValue || typeof cssValue !== "string") return null;
  const match = cssValue.match(/url\(\s*(['"]?)([^'")\s]+)\1\s*\)/i);
  if (!match) return cssValue;
  const rewritten = tryRewriteCrossOriginUrlToProxy(match[2]);
  if (!rewritten) return null;
  return `url("${rewritten}")`;
};
const saveRegistryState = () => {
  if (typeof localStorage === "undefined") return;
  try {
    const ruleData = Array.from(registeredRuleData.entries()).filter(([, data]) => isPersistableRuleCssText(data.cssText)).map(([key, data]) => ({
      key,
      selector: data.selector,
      cssText: data.cssText
    }));
    const state = {
      rules: ruleData,
      timestamp: Date.now()
    };
    localStorage.setItem(PERSISTENT_REGISTRY_KEY, JSON.stringify(state));
  } catch {
  }
};
let pendingRuleRestorations = null;
const loadRegistryState = () => {
  if (typeof localStorage === "undefined") return;
  try {
    for (const legacyKey of LEGACY_PERSISTENT_KEYS) {
      if (legacyKey !== PERSISTENT_REGISTRY_KEY) {
        try {
          localStorage.removeItem(legacyKey);
        } catch {
        }
      }
    }
    const stored = localStorage.getItem(PERSISTENT_REGISTRY_KEY);
    if (!stored) return;
    const state = JSON.parse(stored);
    if (state.rules && Array.isArray(state.rules)) {
      const age = Date.now() - (state.timestamp || 0);
      if (age < 24 * 60 * 60 * 1e3) {
        pendingRuleRestorations = state.rules.filter((r) => isPersistableRuleCssText(r?.cssText));
        if (typeof console !== "undefined") {
          console.log?.(`[icon-registry] Prepared ${pendingRuleRestorations.length} rules for restoration from cache`);
        }
      } else {
        localStorage.removeItem(PERSISTENT_REGISTRY_KEY);
      }
    }
  } catch {
  }
};
const restorePendingRules = (sheet) => {
  if (!pendingRuleRestorations) return;
  let restoredCount = 0;
  let skippedCount = 0;
  pendingRuleRestorations.forEach((ruleData) => {
    if (ruleData.key && ruleData.selector && ruleData.cssText && !registeredRules.has(ruleData.key)) {
      if (!isPersistableRuleCssText(ruleData.cssText)) {
        skippedCount++;
        return;
      }
      try {
        const ruleText = `${ruleData.selector} { ${ruleData.cssText} }`;
        sheet.insertRule(ruleText, sheet.cssRules.length);
        registeredRules.add(ruleData.key);
        registeredRuleData.set(ruleData.key, {
          selector: ruleData.selector,
          cssText: ruleData.cssText
        });
        restoredCount++;
      } catch (e) {
        if (typeof console !== "undefined") {
          console.warn?.(`[icon-registry] Failed to restore rule ${ruleData.key}:`, e);
        }
      }
    }
  });
  if (typeof console !== "undefined" && (restoredCount > 0 || skippedCount > 0)) {
    console.log?.(`[icon-registry] Restored ${restoredCount} CSS rules to stylesheet (skipped ${skippedCount} unsafe/unstable rules)`);
  }
  pendingRuleRestorations = null;
};
const clearRegistryState = () => {
  registeredRules.clear();
  registeredRuleData.clear();
  pendingRules.length = 0;
  flushScheduled = false;
  if (iconStyleSheet && document.adoptedStyleSheets) {
    const index = document.adoptedStyleSheets.indexOf(iconStyleSheet);
    if (index !== -1) {
      document.adoptedStyleSheets.splice(index, 1);
    }
  }
  iconStyleSheet = null;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(PERSISTENT_REGISTRY_KEY);
  }
  if (typeof console !== "undefined") {
    console.log?.("[icon-registry] Registry state cleared");
  }
};
const reinitializeRegistry = () => {
  clearRegistryState();
  ensureStyleSheet();
  if (typeof console !== "undefined") {
    console.log?.("[icon-registry] Registry reinitialized");
  }
};
const ensureStyleSheet = () => {
  if (iconStyleSheet) return iconStyleSheet;
  if (typeof document === "undefined") return null;
  if (registeredRules.size === 0) {
    loadRegistryState();
  }
  iconStyleSheet = new CSSStyleSheet();
  document.adoptedStyleSheets?.push?.(iconStyleSheet);
  iconStyleSheet.insertRule(`@property --icon-image { syntax: "<image>"; inherits: true; initial-value: linear-gradient(#0000, #0000); }`, iconStyleSheet.cssRules.length);
  iconStyleSheet.insertRule(`:where(ui-icon), :host(ui-icon) { --icon-image: linear-gradient(#0000, #0000); }`, iconStyleSheet.cssRules.length);
  iconStyleSheet.insertRule(`:where(ui-icon:not([icon])), :where(ui-icon[icon=""]), :host(ui-icon:not([icon])), :host(ui-icon[icon=""]) { background-color: transparent; }`, iconStyleSheet.cssRules.length);
  restorePendingRules(iconStyleSheet);
  return iconStyleSheet;
};
const makeRuleKey = (iconName, iconStyle, bucket) => {
  return `${iconStyle}:${iconName}@${bucket}`;
};
const createImageSetCSS = (url, bucket) => {
  if (!url) return "linear-gradient(#0000, #0000)";
  if (url.startsWith("url(")) {
    return rewriteCssUrlFunctionValue(url) ?? "linear-gradient(#0000, #0000)";
  }
  const rewritten = tryRewriteCrossOriginUrlToProxy(url);
  return rewritten ? `url("${rewritten}")` : "linear-gradient(#0000, #0000)";
};
const makeSelector = (iconName, iconStyle) => {
  const safeName = (iconName || "").trim();
  const safeStyle = (iconStyle || "duotone").trim().toLowerCase();
  if (!safeName) {
    return "";
  }
  const escapedName = CSS.escape(safeName);
  const escapedStyle = CSS.escape(safeStyle);
  return `.ui-icon[icon="${escapedName}"][icon-style="${escapedStyle}"], :host(.ui-icon[icon="${escapedName}"][icon-style="${escapedStyle}"])`;
};
const flushPendingRules = () => {
  flushScheduled = false;
  if (pendingRules.length === 0) return;
  const sheet = ensureStyleSheet();
  if (!sheet) {
    pendingRules = [];
    return;
  }
  const rulesToInsert = pendingRules.slice();
  pendingRules = [];
  for (const { selector, cssText, key } of rulesToInsert) {
    if (registeredRules.has(key)) continue;
    try {
      const ruleText = `${selector} { ${cssText} }`;
      sheet.insertRule(ruleText, sheet.cssRules.length);
      registeredRules.add(key);
      registeredRuleData.set(key, { selector, cssText });
      saveRegistryState();
    } catch (e) {
      if (typeof console !== "undefined") {
        console.warn?.("[icon-registry] Failed to insert rule:", e);
      }
    }
  }
};
const scheduleFlush = () => {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(flushPendingRules);
};
const registerIconRule = (iconName, iconStyle, imageUrl, bucket = MIN_RASTER_SIZE$1) => {
  const key = makeRuleKey(iconName, iconStyle, bucket);
  if (registeredRules.has(key)) return;
  if (pendingRules.some((r) => r.key === key)) return;
  const selector = makeSelector(iconName, iconStyle);
  const imageSetValue = createImageSetCSS(imageUrl);
  pendingRules.push({
    selector,
    cssText: `--icon-image: ${imageSetValue};`,
    key
  });
  scheduleFlush();
};
const hasIconRule = (iconName, iconStyle, bucket = MIN_RASTER_SIZE$1) => {
  const key = makeRuleKey(iconName, iconStyle, bucket);
  return registeredRules.has(key) || pendingRules.some((r) => r.key === key);
};
if (typeof document !== "undefined" && typeof window !== "undefined") {
  loadRegistryState();
  queueMicrotask(() => {
    ensureStyleSheet();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !iconStyleSheet) {
        reinitializeRegistry();
      }
    });
    window.addEventListener("focus", () => {
      if (!iconStyleSheet) {
        reinitializeRegistry();
      }
    });
  });
}

const iconMap = /* @__PURE__ */ new Map();
const resolvedUrlCache = /* @__PURE__ */ new Map();
const MAX_RASTER_SIZE = 512;
const MIN_RASTER_SIZE = 32;
const FETCH_TIMEOUT_MS = 5e3;
const RETRY_DELAY_MS = 1e3;
const MAX_RETRIES = 5;
const isOnline = () => {
  try {
    return navigator.onLine !== false;
  } catch {
    return true;
  }
};
const isSlowConnection = () => {
  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return false;
    const slowTypes = ["slow-2g", "2g", "3g"];
    return slowTypes.includes(connection.effectiveType) || connection.saveData === true || connection.downlink < 1.5;
  } catch {
    return false;
  }
};
const retryQueue = [];
let retryScheduled = false;
const scheduleRetryQueue = () => {
  if (retryScheduled || retryQueue.length === 0) {
    return;
  }
  retryScheduled = true;
  setTimeout(processRetryQueue, RETRY_DELAY_MS);
};
const processRetryQueue = () => {
  retryScheduled = false;
  if (!isOnline()) {
    if (typeof console !== "undefined") {
      console.log?.("[icon-loader] Skipping retries - device is offline");
    }
    retryQueue.length = 0;
    return;
  }
  const batch = retryQueue.splice(0, Math.min(2, retryQueue.length));
  for (const item of batch) {
    const delay = RETRY_DELAY_MS * Math.pow(1.5, item.retries - 1);
    setTimeout(() => {
      loadAsImageInternal(item.name, item.creator, item.retries).then(item.resolve).catch((error) => {
        if (typeof console !== "undefined") {
          console.warn?.(`[icon-loader] Retry ${item.retries}/${MAX_RETRIES} failed for ${item.name}:`, error?.message || error);
        }
        item.reject(error);
      });
    }, delay);
  }
  if (retryQueue.length > 0) {
    const nextDelay = isSlowConnection() ? RETRY_DELAY_MS * 2 : RETRY_DELAY_MS;
    setTimeout(processRetryQueue, nextDelay);
  }
};
const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};
const globalScope = typeof globalThis !== "undefined" ? globalThis : {};
const hasChromeRuntime = () => {
  try {
    const chromeRuntime = globalThis?.chrome?.runtime;
    return !!chromeRuntime?.id;
  } catch {
    return false;
  }
};
const pickBaseUrl = () => {
  try {
    if (typeof document !== "undefined" && typeof document.baseURI === "string" && document.baseURI !== "about:blank") {
      return document.baseURI;
    }
  } catch {
  }
  try {
    const { location } = globalScope;
    if (location?.href && location.href !== "about:blank") {
      return location.href;
    }
    if (location?.origin) {
      return location.origin;
    }
  } catch {
  }
  return void 0;
};
const DEFAULT_BASE_URL = pickBaseUrl();
const fallbackMaskValue = (url) => !url ? "none" : `url("${url}")`;
const resolveAssetUrl = (input) => {
  if (!input || typeof input !== "string") {
    return "";
  }
  const cached = resolvedUrlCache.get(input);
  if (cached) {
    return cached;
  }
  let resolved = input;
  if (typeof URL === "function") {
    try {
      resolved = DEFAULT_BASE_URL ? new URL(input, DEFAULT_BASE_URL).href : new URL(input).href;
    } catch {
      try {
        resolved = new URL(input, globalScope.location?.origin ?? void 0).href;
      } catch {
        resolved = input;
      }
    }
  }
  resolvedUrlCache.set(input, resolved);
  if (!resolvedUrlCache.has(resolved)) {
    resolvedUrlCache.set(resolved, resolved);
  }
  return resolved;
};
const inflightPromises = /* @__PURE__ */ new Map();
const isSafeCssMaskUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return true;
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) return true;
  if (typeof URL === "function") {
    try {
      const base = globalScope.location?.origin ?? DEFAULT_BASE_URL;
      const parsed = new URL(trimmed, base);
      const origin = globalScope.location?.origin;
      if (origin && parsed.origin === origin) return true;
    } catch {
      return false;
    }
  }
  return false;
};
const makeCacheKey = (cacheKey, normalizedUrl, bucket) => {
  const sanitizedKey = (cacheKey ?? "").trim();
  return sanitizedKey ? `${sanitizedKey}@${bucket}` : `${normalizedUrl}@${bucket}`;
};
const quantizeToBucket = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    value = MIN_RASTER_SIZE;
  }
  const safe = Math.max(value, MIN_RASTER_SIZE);
  const bucket = 2 ** Math.ceil(Math.log2(safe));
  return Math.min(MAX_RASTER_SIZE, bucket);
};
const ensureMaskValue = (url, cacheKey, bucket) => {
  const safeUrl = typeof url === "string" ? url : "";
  const normalizedUrl = resolveAssetUrl(safeUrl);
  const effectiveUrl = normalizedUrl || safeUrl;
  const key = makeCacheKey(cacheKey, normalizedUrl, bucket);
  if (!effectiveUrl) {
    return Promise.resolve(fallbackMaskValue(""));
  }
  const inflight = inflightPromises.get(key);
  if (inflight) {
    return inflight;
  }
  const promise = loadAsImage(
    effectiveUrl
    /*bucket, cacheKey*/
  ).catch((error) => {
    if (effectiveUrl && typeof console !== "undefined") {
      console.warn?.("[ui-icon] Mask generation failed; refusing to use cross-origin CSS url() fallback", error);
    }
    return fallbackMaskValue(isSafeCssMaskUrl(effectiveUrl) ? effectiveUrl : "");
  }).finally(() => {
    inflightPromises.delete(key);
  });
  inflightPromises.set(key, promise);
  return promise;
};
const camelToKebab = (camel) => {
  if (typeof camel !== "string") {
    return "";
  }
  return camel.replace(/[_\s]+/g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
};
const isPathURL = (url) => {
  if (typeof url !== "string" || !url) {
    return false;
  }
  if (typeof URL === "undefined") {
    return /^([a-z]+:)?\/\//i.test(url) || url.startsWith("/") || url.startsWith("./") || url.startsWith("../");
  }
  if (typeof URL.canParse === "function") {
    try {
      if (URL.canParse(url, DEFAULT_BASE_URL)) {
        return true;
      }
      if (globalScope.location?.origin && URL.canParse(url, globalScope.location.origin)) {
        return true;
      }
    } catch {
    }
  }
  try {
    new URL(url, DEFAULT_BASE_URL ?? globalScope.location?.origin ?? void 0);
    return true;
  } catch {
    return false;
  }
};
const rasterizeSVG = (blob) => {
  return isPathURL(blob) ? resolveAssetUrl(blob) : URL.createObjectURL(blob);
};
const fetchSvgBlob = async (url, timeoutMs) => {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(url, {
      credentials: "omit",
      mode: "cors",
      signal: controller?.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Empty SVG response");
    }
    return blob;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Timeout");
    }
    throw e;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
const tryLoadFromVectorCache = async (canonicalUrl) => {
  if (!canonicalUrl) return null;
  if (!isOPFSSupported()) return null;
  try {
    const cached = await getCachedVectorIcon(canonicalUrl);
    if (!cached) return null;
    const blob = await fetchSvgBlob(cached, FETCH_TIMEOUT_MS);
    const svgText = await blob.text();
    if (!svgText || svgText.trim().length === 0) return null;
    return toSvgDataUrl(svgText);
  } catch {
    return null;
  }
};
const FALLBACK_SVG_TEXT = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" fill-rule="evenodd" d="M6 2a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4H6zm0 2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" clip-rule="evenodd"/>
  <path fill="currentColor" d="M11 7h2v7h-2z"/>
  <path fill="currentColor" d="M11 16h2v2h-2z"/>
</svg>`;
const toSvgDataUrl = (svgText) => {
  if (!svgText || typeof svgText !== "string") {
    throw new Error("Invalid SVG text: empty or not a string");
  }
  const trimmed = svgText.trim();
  if (!trimmed.includes("<svg") || !trimmed.includes("</svg>")) {
    throw new Error("Invalid SVG: missing svg tags");
  }
  if (trimmed.length < 50) {
    throw new Error("Invalid SVG: content too small");
  }
  if (trimmed.length > 1024 * 1024) {
    throw new Error("Invalid SVG: content too large");
  }
  const openTags = trimmed.match(/<[^/?][^>]*>/g) || [];
  const closeTags = trimmed.match(/<\/[^>]+>/g) || [];
  const selfClosingTags = trimmed.match(/<[^>]+\/>/g) || [];
  if (openTags.length + selfClosingTags.length < closeTags.length) {
    throw new Error("Invalid SVG: unbalanced tags");
  }
  try {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(svgText);
    const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join("");
    return `data:image/svg+xml;base64,${btoa(binaryString)}`;
  } catch {
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
    } catch {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    }
  }
};
const FALLBACK_SVG_DATA_URL = (() => {
  try {
    return toSvgDataUrl(FALLBACK_SVG_TEXT);
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG_TEXT)}`;
  }
})();
const FALLBACK_ICON_DATA_URL = FALLBACK_SVG_DATA_URL;
const rewritePhosphorUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  try {
    const isHttpOrigin = (() => {
      const proto = globalScope.location?.protocol || "";
      return proto === "http:" || proto === "https:";
    })();
    const isExtensionRuntime = hasChromeRuntime();
    const toNpmAssetUrl = (style, baseName) => {
      const iconFileName = style === "duotone" ? `${baseName}-duotone` : style !== "regular" ? `${baseName}-${style}` : baseName;
      return `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/${style}/${iconFileName}.svg`;
    };
    const urlObj = new URL(url);
    if ((isExtensionRuntime || !isHttpOrigin) && urlObj.pathname.startsWith("/assets/icons/phosphor/")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const style = parts[3] || "duotone";
      const fileName = parts[4] || "";
      const baseName = fileName.replace(/\.svg$/i, "");
      const validStyles = ["thin", "light", "regular", "bold", "fill", "duotone"];
      if (validStyles.includes(style) && baseName && /^[a-z0-9-]+$/.test(baseName)) {
        return toNpmAssetUrl(style, baseName);
      }
      return url;
    }
    if (urlObj.hostname === "cdn.jsdelivr.net" && urlObj.pathname.startsWith("/gh/phosphor-icons/phosphor-icons/")) {
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const srcIndex = pathParts.indexOf("src");
      if (srcIndex >= 0 && pathParts.length >= srcIndex + 3) {
        const style = pathParts[srcIndex + 1];
        const fileName = pathParts[srcIndex + 2];
        if (style && fileName && fileName.endsWith(".svg")) {
          let iconName = fileName.replace(/\.svg$/i, "");
          if (style === "duotone" && iconName.endsWith("-duotone")) {
            iconName = iconName.replace(/-duotone$/, "");
          } else if (style !== "regular" && iconName.endsWith(`-${style}`)) {
            iconName = iconName.replace(new RegExp(`-${style}$`), "");
          }
          const validStyles = ["thin", "light", "regular", "bold", "fill", "duotone"];
          if (validStyles.includes(style) && iconName && /^[a-z0-9-]+$/.test(iconName)) {
            return isHttpOrigin && !isExtensionRuntime ? `/assets/icons/phosphor/${style}/${iconName}.svg` : toNpmAssetUrl(style, iconName);
          }
        }
      }
    }
    if (urlObj.hostname === "cdn.jsdelivr.net" && urlObj.pathname.startsWith("/npm/@phosphor-icons/")) {
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const assetsIndex = pathParts.indexOf("assets");
      if (assetsIndex >= 0 && pathParts.length >= assetsIndex + 3) {
        const style = pathParts[assetsIndex + 1];
        const fileName = pathParts[assetsIndex + 2];
        if (style && fileName && fileName.endsWith(".svg")) {
          let iconName = fileName.replace(/\.svg$/i, "");
          if (style === "duotone" && iconName.endsWith("-duotone")) {
            iconName = iconName.replace(/-duotone$/, "");
          } else if (style !== "regular" && iconName.endsWith(`-${style}`)) {
            iconName = iconName.replace(new RegExp(`-${style}$`), "");
          }
          const validStyles = ["thin", "light", "regular", "bold", "fill", "duotone"];
          if (validStyles.includes(style) && iconName && /^[a-z0-9-]+$/.test(iconName)) {
            return isHttpOrigin && !isExtensionRuntime ? `/assets/icons/phosphor/${style}/${iconName}.svg` : toNpmAssetUrl(style, iconName);
          }
        }
      }
    }
  } catch (error) {
    console.warn("[ui-icon] Invalid URL for phosphor rewrite:", url, error);
  }
  return url;
};
const isClientErrorStatus = (error) => {
  if (!(error instanceof Error)) {
    return false;
  }
  if (/\bHTTP\s*4\d\d\b/.test(error.message) || /\b4\d\d\b/.test(error.message)) {
    return !/408/.test(error.message);
  }
  return /network|timeout|offline|connection|aborted/i.test(error.message) || error.name === "TypeError" && /fetch/i.test(error.message);
};
const loadAsImageInternal = async (name, creator, attempt = 0) => {
  if (isPathURL(name)) {
    const resolvedUrl = resolveAssetUrl(name);
    if (resolvedUrl.startsWith("data:")) {
      console.log(`[ui-icon] Already a data URL, returning as-is`);
      return resolvedUrl;
    }
    const effectiveUrl = rewritePhosphorUrl(resolvedUrl);
    if (effectiveUrl !== resolvedUrl) {
      console.log(`[ui-icon] Rewrote phosphor URL: ${resolvedUrl} -> ${effectiveUrl}`);
    }
    try {
      if (isOPFSSupported()) {
        try {
          const cached = await withTimeout(getCachedVectorIcon(effectiveUrl), 50);
          if (cached) {
            const blob = await fetchSvgBlob(cached, FETCH_TIMEOUT_MS);
            const svgText = await blob.text();
            return toSvgDataUrl(svgText);
          }
        } catch {
        }
      }
      const candidates = [effectiveUrl];
      if (effectiveUrl.startsWith("https://cdn.jsdelivr.net/npm/")) {
        const unpkg = effectiveUrl.replace("https://cdn.jsdelivr.net/npm/", "https://unpkg.com/");
        candidates.push(unpkg);
      }
      if (effectiveUrl.startsWith("https://") && effectiveUrl.includes("cdn.jsdelivr.net")) {
        const mirror = effectiveUrl.replace("cdn.jsdelivr.net", "unpkg.com").replace("/npm/", "/");
        if (!candidates.includes(mirror)) {
          candidates.push(mirror);
        }
      }
      const errors = [];
      for (const url of candidates) {
        try {
          const blob = await fetchSvgBlob(url, FETCH_TIMEOUT_MS);
          if (blob.size > 1024 * 1024) {
            throw new Error(`Blob too large (${blob.size} bytes)`);
          }
          const svgText = await blob.text();
          const dataUrl = toSvgDataUrl(svgText);
          if (isOPFSSupported()) {
            cacheVectorIcon(effectiveUrl, blob).catch(() => {
            });
          }
          return dataUrl;
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          errors.push(new Error(`${url}: ${err.message}`));
        }
      }
      throw new Error(`All icon sources failed: ${errors.map((e) => e.message).join("; ")}`);
    } catch (error) {
      console.warn(`[ui-icon] Failed to load icon: ${effectiveUrl}`, error);
      if (attempt < MAX_RETRIES && !isClientErrorStatus(error)) {
        console.log(`[ui-icon] Queueing retry ${attempt + 1} for ${effectiveUrl}`);
        return new Promise((resolve, reject) => {
          retryQueue.push({ name, creator, resolve, reject, retries: attempt + 1 });
          scheduleRetryQueue();
        });
      }
      const cachedDataUrl = await tryLoadFromVectorCache(effectiveUrl);
      if (cachedDataUrl) {
        console.warn(`[ui-icon] Using OPFS cached icon after failures: ${effectiveUrl}`);
        return cachedDataUrl;
      }
      console.warn(`[ui-icon] All loading methods failed, using fallback SVG for: ${effectiveUrl}`, error);
      return FALLBACK_SVG_DATA_URL;
    }
  }
  const doLoad = async () => {
    const element = await (creator ? creator?.(name) : name);
    if (isPathURL(element)) {
      return loadAsImageInternal(element, void 0, attempt);
    }
    let file = name;
    if (element instanceof Blob || element instanceof File) {
      file = element;
    } else {
      const text = typeof element == "string" ? element : element.outerHTML;
      file = new Blob([`<?xml version="1.0" encoding="UTF-8"?>`, text], { type: "image/svg+xml" });
    }
    return rasterizeSVG(file);
  };
  try {
    return await withTimeout(doLoad(), FETCH_TIMEOUT_MS);
  } catch (error) {
    if (attempt < MAX_RETRIES && error instanceof Error && error.message === "Timeout") {
      return new Promise((resolve, reject) => {
        retryQueue.push({ name, creator, resolve, reject, retries: attempt + 1 });
        scheduleRetryQueue();
      });
    }
    throw error;
  }
};
const loadAsImage = async (name, creator) => {
  if (isPathURL(name)) {
    name = resolveAssetUrl(name) || name;
  }
  return iconMap.getOrInsertComputed(name, () => loadAsImageInternal(name, creator, 0));
};

const preloadStyle = (srcCode) => {
  const content = srcCode?.trim?.() ;
  if (!content) {
    return () => null;
  }
  const styleURL = URL.createObjectURL(new Blob([content], { type: "text/css" }));
  if (typeof document === "undefined") {
    return null;
  }
  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-ui-phosphor-icon", "true");
  styleEl.innerHTML = `@import url("${styleURL}");`;
  return () => styleEl?.cloneNode?.(true);
};
const createStyle = preloadStyle(styles);
class UIPhosphorIcon extends HTMLElement {
  static get observedAttributes() {
    return ["icon", "icon-style", "size", "width", "icon-base"];
  }
  #options = {
    padding: 0,
    icon: "",
    iconStyle: "duotone"
  };
  #resizeObserver;
  #devicePixelSize = {
    inline: MIN_RASTER_SIZE,
    block: MIN_RASTER_SIZE
  };
  #queuedMaskUpdate = null;
  #currentIconUrl = "";
  #maskKeyBase = "";
  #maskRef = { value: "" };
  #styleAttached = false;
  #pendingIconName = null;
  #intersectionObserver;
  #isIntersecting = false;
  constructor(options = {}) {
    super();
    Object.assign(this.#options, options);
    if (typeof options.icon === "string" && options.icon.length > 0) {
      this.setAttribute("icon", options.icon);
    }
    if (typeof options.iconStyle === "string" && options.iconStyle.length > 0) {
      this.setAttribute("icon-style", options.iconStyle.toLowerCase());
    }
    this.#ensureShadowRoot();
  }
  get icon() {
    return this.getAttribute("icon") ?? "";
  }
  set icon(value) {
    if (value == null || value === "") {
      this.removeAttribute("icon");
      return;
    }
    const normalized = String(value);
    if (this.getAttribute("icon") !== normalized) {
      this.setAttribute("icon", normalized);
    }
  }
  get iconStyle() {
    return this.getAttribute("icon-style") ?? this.#options.iconStyle ?? "duotone";
  }
  set iconStyle(value) {
    const normalized = (value ?? "")?.trim?.()?.toLowerCase?.();
    if (!normalized) {
      this.removeAttribute("icon-style");
      return;
    }
    if (this.getAttribute("icon-style") !== normalized) {
      this.setAttribute("icon-style", normalized);
    }
  }
  get size() {
    return this.getAttribute("size");
  }
  set size(value) {
    if (value == null || value === "") {
      this.removeAttribute("size");
      return;
    }
    const normalized = String(value);
    if (this.getAttribute("size") !== normalized) {
      this.setAttribute("size", normalized);
    }
  }
  get width() {
    return this.getAttribute("width");
  }
  set width(value) {
    if (value == null || value === "") {
      this.removeAttribute("width");
      return;
    }
    const normalized = typeof value === "number" ? String(value) : value;
    if (this.getAttribute("width") !== normalized) {
      this.setAttribute("width", normalized);
    }
  }
  /**
   * Optional base URL for same-origin icon hosting.
   * Example: icon-base="/assets/phosphor"
   * Will be tried before CDNs.
   */
  get iconBase() {
    return this.getAttribute("icon-base") ?? "";
  }
  set iconBase(value) {
    const normalized = (value ?? "").trim();
    if (!normalized) {
      this.removeAttribute("icon-base");
      return;
    }
    if (this.getAttribute("icon-base") !== normalized) {
      this.setAttribute("icon-base", normalized);
    }
  }
  connectedCallback() {
    this.#applyHostDefaults();
    this.#setupResizeObserver(this);
    this.#setupVisibilityObserver();
    if (!this.#styleAttached) {
      const styleNode = createStyle?.() ?? null;
      if (styleNode) {
        this.shadowRoot.appendChild(styleNode);
      }
      this.#styleAttached = true;
    }
    if (!this.hasAttribute("icon") && this.#options.icon) {
      this.setAttribute("icon", this.#options.icon);
    }
    if (!this.hasAttribute("icon-style") && this.#options.iconStyle) {
      this.setAttribute("icon-style", this.#options.iconStyle);
    }
    const pendingIcon = this.#pendingIconName ?? this.icon;
    console.log(`[ui-icon] Element connected, pending icon: ${pendingIcon}, current icon: ${this.icon}`);
    if (pendingIcon) {
      console.log(`[ui-icon] Loading pending icon: ${pendingIcon}`);
      this.updateIcon(pendingIcon);
    } else if (this.icon) {
      console.log(`[ui-icon] Loading current icon: ${this.icon}`);
      this.updateIcon(this.icon);
    } else {
      console.log(`[ui-icon] No icon to load`);
    }
  }
  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = void 0;
    this.#teardownVisibilityObserver();
    this.#queuedMaskUpdate = null;
    this.#retryAttempt = 0;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case "icon": {
        if (!this.isConnected) {
          this.#pendingIconName = newValue ?? "";
          return;
        }
        this.updateIcon(newValue ?? "");
        break;
      }
      case "icon-style": {
        if (newValue) {
          const normalized = newValue?.trim?.()?.toLowerCase?.();
          if (normalized !== newValue) {
            this.setAttribute("icon-style", normalized);
            return;
          }
        }
        this.#maskKeyBase = "";
        if (!this.isConnected) {
          this.#pendingIconName = this.icon;
          return;
        }
        this.updateIcon();
        break;
      }
      case "size": {
        if (newValue) {
          this.style.setProperty("--icon-size", typeof newValue === "number" || /^\d+$/.test(newValue) ? `${newValue}px` : newValue);
        } else {
          this.style.removeProperty("--icon-size");
        }
        if (this.isConnected) {
          this.#queueMaskUpdate();
        }
        break;
      }
      case "width": {
        if (newValue == null || newValue === "") {
          this.style.removeProperty("width");
        } else {
          const value = typeof newValue === "number" || /^\d+$/.test(newValue) ? `${newValue}px` : newValue;
          this.style.width = value;
        }
        if (this.isConnected) {
          this.#queueMaskUpdate();
        }
        break;
      }
      case "icon-base": {
        this.#currentIconUrl = "";
        this.#maskKeyBase = "";
        if (this.isConnected) {
          this.updateIcon(this.icon);
        }
        break;
      }
    }
  }
  #retryAttempt = 0;
  static #MAX_ICON_RETRIES = 3;
  static #RETRY_DELAY_MS = 500;
  updateIcon(icon) {
    const candidate = typeof icon === "string" && icon.length > 0 ? icon : this.icon;
    const nextIcon = candidate?.trim?.() ?? "";
    if (!this.isConnected) {
      this.#pendingIconName = nextIcon;
      return this;
    }
    if (typeof IntersectionObserver !== "undefined" && !this.#isIntersecting) {
      this.#pendingIconName = nextIcon;
      return this;
    }
    this.#pendingIconName = null;
    if (!nextIcon) {
      return this;
    }
    let iconStyle = (this.iconStyle ?? "duotone")?.trim?.()?.toLowerCase?.();
    const ICON = camelToKebab(nextIcon);
    if (!ICON || !/^[a-z0-9-]+$/.test(ICON)) {
      console.warn(`[ui-icon] Invalid icon name: ${ICON}`);
      return this;
    }
    const validStyles = ["thin", "light", "regular", "bold", "fill", "duotone"];
    if (!validStyles.includes(iconStyle)) {
      console.warn(`[ui-icon] Invalid icon style: ${iconStyle}, defaulting to 'duotone'`);
      iconStyle = "duotone";
    }
    const iconFileName = iconStyle === "duotone" ? `${ICON}-duotone` : iconStyle !== "regular" ? `${ICON}-${iconStyle}` : ICON;
    const directCdnPath = `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/${iconStyle}/${iconFileName}.svg`;
    const proxyCdnPath = `/assets/icons/phosphor/${iconStyle}/${ICON}.svg`;
    const base = (this.iconBase ?? "").trim().replace(/\/+$/, "");
    const localPath = base ? `${base}/${iconStyle}/${iconFileName}.svg` : "";
    const requestKey = `${iconStyle}:${ICON}`;
    this.#maskKeyBase = requestKey;
    requestAnimationFrame(() => {
      const shouldLoad = !this.#currentIconUrl || this.#isIntersecting || (this?.checkVisibility?.({
        contentVisibilityAuto: true,
        opacityProperty: true,
        visibilityProperty: true
      }) ?? true);
      console.log(`[ui-icon] Checking load conditions for ${requestKey}:`, {
        hasCurrentUrl: !!this.#currentIconUrl,
        isIntersecting: this.#isIntersecting,
        shouldLoad
      });
      if (shouldLoad) {
        const sources = localPath ? [directCdnPath, proxyCdnPath, localPath] : [directCdnPath, proxyCdnPath];
        (async () => {
          let lastUrl = null;
          let lastError = null;
          for (const src of sources) {
            try {
              const url2 = await loadAsImage(src);
              lastUrl = url2;
              if (src === localPath && url2 === FALLBACK_ICON_DATA_URL) {
                continue;
              }
              break;
            } catch (e) {
              lastError = e;
            }
          }
          const url = lastUrl;
          console.log(`[ui-icon] Loaded icon ${requestKey} (${localPath ? "local+proxy+fallback" : "proxy+fallback"}):`, url);
          if (!url || typeof url !== "string") {
            console.warn(`[ui-icon] Invalid URL returned for ${requestKey}:`, url);
            return;
          }
          if (this.#maskKeyBase !== requestKey) {
            console.log(`[ui-icon] Ignoring outdated request for ${requestKey}`);
            return;
          }
          this.#currentIconUrl = url;
          this.#retryAttempt = 0;
          this.#queueMaskUpdate();
          if (url === FALLBACK_ICON_DATA_URL && lastError instanceof Error) {
            const isTimeout = lastError.message.includes("Timeout");
            if (isTimeout && this.#retryAttempt < UIPhosphorIcon.#MAX_ICON_RETRIES && this.isConnected) {
              this.#retryAttempt++;
              setTimeout(() => {
                if (this.isConnected && this.#maskKeyBase === requestKey) {
                  this.updateIcon(nextIcon);
                }
              }, UIPhosphorIcon.#RETRY_DELAY_MS * this.#retryAttempt);
            }
          }
        })().catch((error) => {
          if (typeof console !== "undefined") {
            console.error?.("[ui-icon] Failed to load icon sources", { directCdnPath, proxyCdnPath, localPath }, error);
          }
        });
      }
    });
    return this;
  }
  #setupVisibilityObserver() {
    console.log(`[ui-icon] Setting up visibility observer`);
    if (typeof IntersectionObserver === "undefined") {
      console.log(`[ui-icon] IntersectionObserver not available, setting intersecting to true`);
      this.#isIntersecting = true;
      return;
    }
    if (this.#intersectionObserver) {
      console.log(`[ui-icon] Visibility observer already exists`);
      return;
    }
    console.log(`[ui-icon] Creating new IntersectionObserver`);
    this.#intersectionObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries.some((entry) => entry.isIntersecting);
      console.log(`[ui-icon] IntersectionObserver callback: isIntersecting=${isIntersecting}, was=${this.#isIntersecting}`);
      if (isIntersecting !== this.#isIntersecting) {
        this.#isIntersecting = isIntersecting;
        if (isIntersecting) {
          console.log(`[ui-icon] Element became visible, updating icon`);
          this.updateIcon(this.#pendingIconName ?? this.icon);
        }
      }
    }, { rootMargin: "100px" });
    console.log(`[ui-icon] Starting observation`);
    this.#intersectionObserver.observe(this);
    this.addEventListener("contentvisibilityautostatechange", this.#handleContentVisibility);
    console.log(`[ui-icon] Setting initial intersecting state to true`);
    this.#isIntersecting = true;
  }
  #teardownVisibilityObserver() {
    this.#intersectionObserver?.disconnect();
    this.#intersectionObserver = void 0;
    this.removeEventListener("contentvisibilityautostatechange", this.#handleContentVisibility);
  }
  #handleContentVisibility = (e) => {
    if (e.skipped === false) {
      this.updateIcon(this.#pendingIconName ?? this.icon);
    }
  };
  #ensureShadowRoot() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }
  #applyHostDefaults() {
    this.classList.add("ui-icon", "u2-icon");
    try {
      this.inert = true;
    } catch {
      this.setAttribute("inert", "");
    }
    const paddingOption = this.#options.padding;
    if (!this.style.getPropertyValue("--icon-padding") && paddingOption !== void 0 && paddingOption !== null && paddingOption !== "") {
      const paddingValue = typeof paddingOption === "number" ? `${paddingOption}rem` : String(paddingOption);
      this.style.setProperty("--icon-padding", paddingValue);
    }
    const sizeAttr = this.getAttribute("size");
    if (sizeAttr) {
      this.style.setProperty("--icon-size", typeof sizeAttr === "number" || /^\d+$/.test(sizeAttr) ? `${sizeAttr}px` : sizeAttr);
    }
  }
  #setupResizeObserver(element) {
    if (typeof ResizeObserver === "undefined" || this.#resizeObserver) {
      return;
    }
    this.#resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== element) {
          continue;
        }
        const deviceSize = entry.devicePixelContentBoxSize?.[0];
        const contentSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
        const ratio = typeof devicePixelRatio === "number" && isFinite(devicePixelRatio) ? devicePixelRatio : 1;
        const inline = deviceSize?.inlineSize ?? (contentSize?.inlineSize ?? entry.contentRect?.width ?? element.clientWidth ?? MIN_RASTER_SIZE) * ratio;
        const block = deviceSize?.blockSize ?? (contentSize?.blockSize ?? entry.contentRect?.height ?? element.clientHeight ?? MIN_RASTER_SIZE) * ratio;
        this.#devicePixelSize = {
          inline: inline || MIN_RASTER_SIZE,
          block: block || MIN_RASTER_SIZE
        };
        this.#queueMaskUpdate();
      }
    });
    try {
      this.#resizeObserver.observe(element, { box: "device-pixel-content-box" });
    } catch {
      this.#resizeObserver.observe(element);
    }
  }
  #queueMaskUpdate() {
    if (!this.#currentIconUrl || !this.isConnected) {
      return;
    }
    if (this.#queuedMaskUpdate) {
      return;
    }
    const forResolve = Promise.withResolvers();
    this.#queuedMaskUpdate = forResolve?.promise;
    requestAnimationFrame(() => {
      this.#queuedMaskUpdate = null;
      forResolve?.resolve();
      const url = this.#currentIconUrl;
      if (!url || !this.isConnected) {
        return;
      }
      const bucket = this.#getRasterBucket();
      const iconName = camelToKebab(this.icon);
      const iconStyle = this.iconStyle;
      if (hasIconRule(iconName, iconStyle, bucket)) {
        return;
      }
      ensureMaskValue(url, this.#maskKeyBase, bucket).then((maskValue) => {
        console.log(`[ui-icon] Got mask value for ${iconName}:${iconStyle}:`, maskValue);
        registerIconRule(iconName, iconStyle, maskValue, bucket);
        console.log(`[ui-icon] Registered CSS rule for ${iconName}:${iconStyle}`);
        if (this.#maskRef.value !== maskValue) {
          this.#maskRef.value = maskValue;
        }
      }).catch((error) => {
        if (typeof console !== "undefined") {
          console.warn?.("[ui-icon] Mask update failed", error);
        }
      });
    });
  }
  #getRasterBucket() {
    const self = this;
    const inline = Math.ceil(this.#devicePixelSize?.inline || 0);
    const block = Math.ceil(this.#devicePixelSize?.block || 0);
    const candidate = Math.max(inline, block);
    if (candidate > 0) {
      return quantizeToBucket(candidate);
    }
    let fallback = MIN_RASTER_SIZE;
    const ratio = typeof devicePixelRatio === "number" && isFinite(devicePixelRatio) ? devicePixelRatio : 1;
    if (typeof self.getBoundingClientRect === "function") {
      const rect = self.getBoundingClientRect();
      const maximum = Math.max(rect.width, rect.height) * ratio;
      if (maximum > 0) {
        fallback = maximum;
      }
    }
    return quantizeToBucket(fallback);
  }
}
if (typeof window !== "undefined" && !customElements.get("ui-icon")) {
  console.log(UIPhosphorIcon);
  customElements.define("ui-icon", UIPhosphorIcon);
}

export { UIPhosphorIcon, ensureStyleSheet };
//# sourceMappingURL=Phosphor.js.map
