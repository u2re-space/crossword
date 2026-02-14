import { getUnifiedMessaging as getUnifiedMessaging$1 } from './index.js';
import { BUILT_IN_AI_ACTIONS, AI_INSTRUCTIONS } from './BuiltInAI.js';

"use strict";
const BROADCAST_CHANNELS = {
  // Service Worker Channels (matching SW implementation)
  SHARE_TARGET: "rs-share-target",
  TOAST: "rs-toast",
  CLIPBOARD: "rs-clipboard",
  // App Component Channels (for AppCommunicator)
  WORK_CENTER: "rs-workcenter",
  MARKDOWN_VIEWER: "rs-markdown-viewer",
  SETTINGS: "rs-settings",
  GENERAL: "rs-app-general",
  // Unified Messaging Channels
  MINIMAL_APP: "minimal-app",
  MAIN_APP: "main-app",
  FILE_EXPLORER: "file-explorer",
  PRINT_VIEWER: "print-viewer",
  SETTINGS_VIEWER: "settings-viewer",
  HISTORY_VIEWER: "history-viewer",
  // Additional channels used in routing
  MARKDOWN_VIEWER_CHANNEL: "markdown-viewer",
  FILE_EXPLORER_CHANNEL: "file-explorer",
  SETTINGS_CHANNEL: "settings",
  HISTORY_CHANNEL: "history",
  PRINT_CHANNEL: "print",
  // Service Channels (new architecture)
  SERVICE_WORKCENTER: "rs-service-workcenter",
  SERVICE_SETTINGS: "rs-service-settings",
  SERVICE_VIEWER: "rs-service-viewer",
  SERVICE_EXPLORER: "rs-service-explorer",
  SERVICE_AIRPAD: "rs-service-airpad",
  SERVICE_PRINT: "rs-service-print",
  SERVICE_HISTORY: "rs-service-history",
  SERVICE_EDITOR: "rs-service-editor",
  SERVICE_HOME: "rs-service-home"
};
const COMPONENTS = {
  // Core Components
  WORK_CENTER: "workcenter",
  MARKDOWN_VIEWER: "markdown-viewer",
  MARKDOWN_EDITOR: "markdown-editor",
  RICH_EDITOR: "rich-editor",
  SETTINGS: "settings",
  HISTORY: "history",
  FILE_PICKER: "file-picker",
  FILE_EXPLORER: "file-explorer",
  // Sub-components
  WORKCENTER_CORE: "workcenter-core",
  BASIC_WORKCENTER: "basic-workcenter",
  BASIC_VIEWER: "basic-viewer",
  BASIC_EXPLORER: "basic-explorer",
  BASIC_SETTINGS: "basic-settings",
  BASIC_HISTORY: "basic-history",
  BASIC_PRINT: "basic-print",
  // New architecture views
  AIRPAD: "airpad",
  HOME: "home",
  EDITOR: "editor",
  VIEWER: "viewer",
  EXPLORER: "explorer",
  PRINT: "print"
};
const SHELLS = {
  BASIC: "basic",
  FAINT: "faint",
  RAW: "raw"
};
const STYLE_SYSTEMS = {
  VEELA: "veela",
  BASIC: "basic",
  RAW: "raw"
};
const API_ENDPOINTS = {
  // Processing APIs
  PROCESSING: "/api/processing",
  ANALYZE: "/api/analyze",
  TEST: "/api/test",
  HEALTH: "/health",
  // Asset proxies
  PHOSPHOR_ICONS: "/assets/icons/phosphor",
  ICON_PROXY: "/api/icon-proxy",
  // Content APIs
  SHARE_TARGET: "/share-target",
  SHARE_TARGET_ALT: "/share_target",
  LAUNCH_QUEUE: "/launch-queue",
  // Internal SW APIs
  SW_CONTENT: "/sw-content",
  SW_CONTENT_AVAILABLE: "/sw-content/available",
  CLIPBOARD_PENDING: "/clipboard/pending",
  CLIPBOARD_CLEAR: "/clipboard/clear"
};
const ROUTE_HASHES = {
  // Basic app views
  MARKDOWN_VIEWER: "#markdown-viewer",
  MARKDOWN_EDITOR: "#markdown-editor",
  RICH_EDITOR: "#rich-editor",
  SETTINGS: "#settings",
  HISTORY: "#history",
  WORKCENTER: "#workcenter",
  FILE_PICKER: "#file-picker",
  FILE_EXPLORER: "#file-explorer",
  PRINT: "#print",
  // Work center specific hashes
  WORKCENTER_FILES: "#workcenter-files",
  WORKCENTER_TEXT: "#workcenter-text",
  WORKCENTER_IMAGES: "#workcenter-images",
  WORKCENTER_PROCESSING: "#workcenter-processing",
  // Share target specific hashes
  SHARE_TARGET_TEXT: "#share-target-text",
  SHARE_TARGET_FILES: "#share-target-files",
  SHARE_TARGET_URL: "#share-target-url",
  SHARE_TARGET_IMAGE: "#share-target-image"
};
const STORAGE_KEYS = {
  // Service Worker
  SW_CACHE_KEYS: "sw-cache-keys",
  SW_CONTENT_CACHE: "sw-content-cache",
  SHARE_TARGET_DATA: "share-target-data",
  SHARE_TARGET_FILES: "share-target-files",
  CLIPBOARD_OPERATIONS: "clipboard-operations",
  // Frontend
  WORKCENTER_STATE: "rs-workcenter-state",
  WORKCENTER_TEMPLATES: "rs-workcenter-templates",
  SETTINGS: "rs-settings",
  HISTORY: "rs-history",
  // Theme and UI
  THEME_PREFERENCES: "theme-preferences",
  UI_STATE: "ui-state"
};
const MESSAGE_TYPES = {
  // Service Worker Messages
  SHARE_RECEIVED: "share-received",
  SHARE_RESULT: "share-result",
  AI_RESULT: "ai-result",
  CONTENT_CACHED: "content-cached",
  CONTENT_RECEIVED: "content-received",
  // Clipboard Messages
  COPY: "copy",
  CLIPBOARD_READY: "clipboard-ready",
  // Work Center Messages
  SHARE_TARGET_INPUT: "share-target-input",
  SHARE_TARGET_RESULT: "share-target-result",
  FILES_CHANGED: "files-changed",
  // Toast Messages
  SHOW_TOAST: "show-toast",
  // Ping/Pong
  PING: "ping",
  PONG: "pong",
  // Content Sharing
  CONTENT_SHARE: "content-share",
  CONTENT_REQUEST: "content-request"
};
const CONTENT_TYPES = {
  TEXT: "text",
  URL: "url",
  FILE: "file",
  IMAGE: "image",
  MARKDOWN: "markdown",
  HTML: "html",
  JSON: "json",
  PDF: "pdf",
  AUDIO: "audio",
  VIDEO: "video",
  OTHER: "other"
};
const CONTENT_CONTEXTS = {
  SHARE_TARGET: "share-target",
  LAUNCH_QUEUE: "launch-queue",
  PUSH_MESSAGE: "push-message",
  BACKGROUND_SYNC: "background-sync",
  CLIPBOARD: "clipboard",
  DRAG_DROP: "drag-drop",
  PASTE: "paste"
};
const DESTINATIONS = {
  WORKCENTER: "workcenter",
  CLIPBOARD: "clipboard",
  MARKDOWN_VIEWER: "markdown-viewer",
  SETTINGS: "settings",
  HISTORY: "history",
  FILE_EXPLORER: "file-explorer",
  PRINT_VIEWER: "print-viewer",
  BASIC_APP: "basic-app",
  MAIN_APP: "main-app"
};
function getChannelForComponent(component) {
  const channelMap = {
    [COMPONENTS.WORK_CENTER]: BROADCAST_CHANNELS.WORK_CENTER,
    [COMPONENTS.MARKDOWN_VIEWER]: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
    [COMPONENTS.SETTINGS]: BROADCAST_CHANNELS.SETTINGS,
    [COMPONENTS.FILE_EXPLORER]: BROADCAST_CHANNELS.FILE_EXPLORER,
    [COMPONENTS.WORKCENTER_CORE]: BROADCAST_CHANNELS.SHARE_TARGET,
    [COMPONENTS.BASIC_WORKCENTER]: BROADCAST_CHANNELS.SHARE_TARGET,
    "minimal-app": BROADCAST_CHANNELS.MINIMAL_APP,
    "main-app": BROADCAST_CHANNELS.MAIN_APP
  };
  return channelMap[component] || BROADCAST_CHANNELS.GENERAL;
}
function getHashForComponent(component) {
  const hashMap = {
    [COMPONENTS.WORK_CENTER]: ROUTE_HASHES.WORKCENTER,
    [COMPONENTS.MARKDOWN_VIEWER]: ROUTE_HASHES.MARKDOWN_VIEWER,
    [COMPONENTS.MARKDOWN_EDITOR]: ROUTE_HASHES.MARKDOWN_EDITOR,
    [COMPONENTS.RICH_EDITOR]: ROUTE_HASHES.RICH_EDITOR,
    [COMPONENTS.SETTINGS]: ROUTE_HASHES.SETTINGS,
    [COMPONENTS.HISTORY]: ROUTE_HASHES.HISTORY,
    [COMPONENTS.FILE_PICKER]: ROUTE_HASHES.FILE_PICKER,
    [COMPONENTS.FILE_EXPLORER]: ROUTE_HASHES.FILE_EXPLORER
  };
  return hashMap[component] || "#";
}
function getStorageKeyForComponent(component, dataType) {
  const keyMap = {
    [COMPONENTS.WORK_CENTER]: {
      state: STORAGE_KEYS.WORKCENTER_STATE,
      templates: STORAGE_KEYS.WORKCENTER_TEMPLATES
    },
    [COMPONENTS.SETTINGS]: {
      data: STORAGE_KEYS.SETTINGS
    },
    [COMPONENTS.HISTORY]: {
      data: STORAGE_KEYS.HISTORY
    }
  };
  return keyMap[component]?.[dataType] || `${component}-${dataType}`;
}
const SERVICE_CHANNEL_MAP = {
  workcenter: BROADCAST_CHANNELS.SERVICE_WORKCENTER,
  settings: BROADCAST_CHANNELS.SERVICE_SETTINGS,
  viewer: BROADCAST_CHANNELS.SERVICE_VIEWER,
  explorer: BROADCAST_CHANNELS.SERVICE_EXPLORER,
  airpad: BROADCAST_CHANNELS.SERVICE_AIRPAD,
  print: BROADCAST_CHANNELS.SERVICE_PRINT,
  history: BROADCAST_CHANNELS.SERVICE_HISTORY,
  editor: BROADCAST_CHANNELS.SERVICE_EDITOR,
  home: BROADCAST_CHANNELS.SERVICE_HOME
};
const VIEW_ROUTE_MAP = {
  workcenter: ROUTE_HASHES.WORKCENTER,
  settings: ROUTE_HASHES.SETTINGS,
  viewer: ROUTE_HASHES.MARKDOWN_VIEWER,
  explorer: ROUTE_HASHES.FILE_EXPLORER,
  airpad: "#airpad",
  print: ROUTE_HASHES.PRINT,
  history: ROUTE_HASHES.HISTORY,
  editor: ROUTE_HASHES.MARKDOWN_EDITOR,
  home: "#home"
};

"use strict";
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
const processingRules = Object.fromEntries(
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
const PROCESSING_RULES = BUILT_IN_AI_ACTIONS.map((action) => {
  const type = toAIProcessingType(action.id);
  if (!type) return null;
  return {
    type,
    instruction: AI_INSTRUCTIONS[action.instructionKey],
    supportedContentTypes: action.supportedContentTypes,
    priority: action.priority
  };
}).filter((v) => Boolean(v));
const CONTENT_TYPE_MAPPINGS = {
  // File extensions to MIME types
  extensions: {
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".json": "application/json",
    ".xml": "application/xml",
    ".csv": "text/csv",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
  },
  // MIME type to processing type mapping
  mimeToProcessing: {
    "text/markdown": "general-processing",
    "text/plain": "general-processing",
    "text/html": "extract-css",
    "text/css": "extract-css",
    "application/javascript": "write-code",
    "application/typescript": "write-code",
    "application/json": "convert-data",
    "application/xml": "convert-data",
    "text/csv": "convert-data",
    "application/pdf": "recognize-content",
    "image/png": "recognize-content",
    "image/jpeg": "recognize-content",
    "image/gif": "recognize-content",
    "image/svg+xml": "extract-css",
    "image/webp": "recognize-content"
  }
};
const DEFAULT_PROCESSING_CONFIG = {
  maxRetries: 3,
  timeoutMs: 3e4,
  enableCaching: true,
  enableStreaming: false,
  defaultLanguage: "en",
  supportedLanguages: ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]
};
function getProcessingRule(contentType, requestedType) {
  if (requestedType) {
    const rule = PROCESSING_RULES.find((r) => r.type === requestedType);
    if (rule && (rule.supportedContentTypes.includes(contentType) || rule.supportedContentTypes.includes("*"))) {
      return rule;
    }
  }
  const matchingRules = PROCESSING_RULES.filter((rule) => rule.supportedContentTypes.includes(contentType) || rule.supportedContentTypes.includes("*")).sort((a, b) => b.priority - a.priority);
  return matchingRules[0] || null;
}
function getMimeTypeFromExtension(filename) {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return CONTENT_TYPE_MAPPINGS.extensions[extension] || "application/octet-stream";
}
function getProcessingTypeFromMime(mimeType) {
  return CONTENT_TYPE_MAPPINGS.mimeToProcessing[mimeType] || "general-processing";
}
function getProcessingTypeFromFile(file) {
  const mimeType = file.type || getMimeTypeFromExtension(file.name);
  return getProcessingTypeFromMime(mimeType);
}
function createProcessingOptions(overrides = {}) {
  return { ...overrides };
}
function validateContentForProcessing(content, contentType) {
  const errors = [];
  if (!content) {
    errors.push("Content is required");
  }
  if (!contentType) {
    errors.push("Content type is required");
  }
  switch (contentType) {
    case "text":
    case "markdown":
      if (typeof content !== "string" || content.trim().length === 0) {
        errors.push("Text content must be a non-empty string");
      }
      break;
    case "file":
      if (!(content instanceof File)) {
        errors.push("File content must be a File object");
      }
      break;
    case "blob":
      if (!(content instanceof Blob)) {
        errors.push("Blob content must be a Blob object");
      }
      break;
    case "base64":
      if (typeof content !== "string" || !content.match(/^data:[^;]+;base64,/)) {
        errors.push("Base64 content must be a valid data URL");
      }
      break;
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

"use strict";
const normalizeContentType = (t) => {
  const v = String(t || "").toLowerCase().trim();
  if (!v) return CONTENT_TYPES.OTHER;
  if (v === "md") return CONTENT_TYPES.MARKDOWN;
  if (v === "markdown") return CONTENT_TYPES.MARKDOWN;
  if (v === "txt") return CONTENT_TYPES.TEXT;
  if (v === "text") return CONTENT_TYPES.TEXT;
  if (v === "url") return CONTENT_TYPES.URL;
  if (v === "image") return CONTENT_TYPES.IMAGE;
  if (v === "file" || v === "blob") return CONTENT_TYPES.FILE;
  if (v === "pdf") return CONTENT_TYPES.PDF;
  if (v === "html") return CONTENT_TYPES.HTML;
  if (v === "json") return CONTENT_TYPES.JSON;
  if (v === "base64") return CONTENT_TYPES.FILE;
  const known = new Set(Object.values(CONTENT_TYPES));
  if (known.has(v)) return v;
  return CONTENT_TYPES.OTHER;
};
const coerceOverrideFactors = (factors) => {
  const out = [];
  const list = Array.isArray(factors) ? factors : [];
  for (const f of list) {
    const v = String(f || "").trim();
    if (!v) continue;
    out.push(v);
  }
  return out;
};
const pickExplicitDestination = (factors) => {
  if (factors.includes("explicit-explorer")) return "basic-explorer";
  if (factors.includes("explicit-workcenter")) return "basic-workcenter";
  if (factors.includes("explicit-viewer")) return "basic-viewer";
  return null;
};
const defaultDestinationForType = (normalizedContentType) => {
  switch (normalizedContentType) {
    case CONTENT_TYPES.TEXT:
    case CONTENT_TYPES.MARKDOWN:
    case CONTENT_TYPES.HTML:
    case CONTENT_TYPES.JSON:
      return "basic-viewer";
    case CONTENT_TYPES.URL:
      return "basic-workcenter";
    case CONTENT_TYPES.IMAGE:
    case CONTENT_TYPES.PDF:
    case CONTENT_TYPES.FILE:
    case CONTENT_TYPES.OTHER:
    default:
      return "basic-workcenter";
  }
};
const mergeRuleOverrideFactors = (intent, normalizedContentType) => {
  const base = coerceOverrideFactors(intent.overrideFactors);
  const src = String(intent.processingSource || "").trim();
  if (!src) return base;
  const rule = UNIFIED_PROCESSING_RULES[src];
  if (!rule) return base;
  const merged = [];
  merged.push(...rule.defaultOverrideFactors || []);
  const perType = rule.associationOverrides?.[normalizedContentType] || rule.associationOverrides?.[String(intent.contentType || "")] || [];
  merged.push(...perType);
  merged.push(...base);
  return merged;
};
function resolveAssociation(intent) {
  const normalizedContentType = normalizeContentType(intent.contentType);
  const mergedFactors = mergeRuleOverrideFactors(intent, normalizedContentType);
  const explicit = pickExplicitDestination(mergedFactors);
  if (explicit) {
    return { destination: explicit, normalizedContentType, overrideFactors: mergedFactors };
  }
  return {
    destination: defaultDestinationForType(normalizedContentType),
    normalizedContentType,
    overrideFactors: mergedFactors
  };
}
function resolveAssociationPipeline(intent) {
  const primary = resolveAssociation(intent);
  const factors = primary.overrideFactors;
  const pipeline = [];
  if (factors.includes("explicit-explorer")) pipeline.push("basic-explorer");
  if (factors.includes("explicit-workcenter")) pipeline.push("basic-workcenter");
  if (factors.includes("explicit-viewer")) pipeline.push("basic-viewer");
  if (pipeline.length === 0) {
    pipeline.push(primary.destination);
  }
  if ((factors.includes("force-attachment") || factors.includes("force-processing")) && !pipeline.includes("basic-workcenter")) {
    pipeline.push("basic-workcenter");
  }
  const unique = [];
  for (const d of pipeline) {
    if (!unique.includes(d)) unique.push(d);
  }
  return { ...primary, pipeline: unique };
}

"use strict";
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
function sendMessage(message) {
  return unifiedMessaging.sendMessage({
    ...message,
    source: message.source ?? "unified-messaging"
  });
}
function registerHandler(destination, handler) {
  unifiedMessaging.registerHandler(destination, handler);
}
function unregisterHandler(destination, handler) {
  unifiedMessaging.unregisterHandler(destination, handler);
}
function getWorkerChannel(viewHash, workerName) {
  return unifiedMessaging.getWorkerChannel(viewHash, workerName);
}
function getBroadcastChannel(channelName) {
  return unifiedMessaging.getBroadcastChannel(channelName);
}
function sendToWorkCenter(data, options) {
  return sendMessage({
    type: "content-share",
    source: "unified-messaging",
    destination: DESTINATIONS.WORKCENTER,
    data,
    metadata: options
  });
}
function sendToClipboard(data, options) {
  return sendMessage({
    type: "clipboard-copy",
    source: "unified-messaging",
    destination: DESTINATIONS.CLIPBOARD,
    data,
    metadata: options
  });
}
function navigateToView(view) {
  return sendMessage({
    type: "navigation",
    source: "unified-messaging",
    destination: "router",
    data: { view },
    metadata: { priority: "high" }
  });
}
function initializeComponent(componentId) {
  return unifiedMessaging.initializeComponent(componentId);
}
function hasPendingMessages(destination) {
  return unifiedMessaging.hasPendingMessages(destination);
}
function enqueuePendingMessage(destination, message) {
  const dest = String(destination ?? "").trim();
  if (!dest || !message) return;
  unifiedMessaging.enqueuePendingMessage(dest, message);
}
function registerComponent(componentId, destination) {
  unifiedMessaging.registerComponent(componentId, destination);
}
function processInitialContent(content) {
  const contentType = String(content?.contentType ?? content?.type ?? CONTENT_TYPES.OTHER);
  const resolved = resolveAssociationPipeline({
    contentType,
    context: content?.context,
    processingSource: content?.processingSource,
    overrideFactors: content?.overrideFactors ?? content?.metadata?.overrideFactors
  });
  const payload = content?.content ?? content?.data ?? content;
  const meta = content?.metadata ?? {};
  const source = String(content?.source ?? meta?.source ?? "content-association");
  const tasks = resolved.pipeline.map((dest) => {
    if (dest === "basic-viewer") {
      return sendMessage({
        type: "content-view",
        source,
        destination: "basic-viewer",
        contentType: resolved.normalizedContentType,
        data: {
          content: payload?.text ?? payload?.content ?? payload,
          text: payload?.text,
          filename: payload?.filename ?? meta?.filename
        },
        metadata: {
          ...meta,
          overrideFactors: resolved.overrideFactors,
          context: content?.context,
          processingSource: content?.processingSource
        }
      });
    }
    if (dest === "basic-explorer") {
      return sendMessage({
        type: "content-explorer",
        source,
        destination: "basic-explorer",
        contentType: resolved.normalizedContentType,
        data: {
          action: "save",
          ...payload
        },
        metadata: {
          ...meta,
          overrideFactors: resolved.overrideFactors,
          context: content?.context,
          processingSource: content?.processingSource
        }
      });
    }
    return sendMessage({
      type: "content-share",
      source,
      destination: "basic-workcenter",
      contentType: resolved.normalizedContentType,
      data: payload,
      metadata: {
        ...meta,
        overrideFactors: resolved.overrideFactors,
        context: content?.context,
        processingSource: content?.processingSource
      }
    });
  });
  return Promise.allSettled(tasks).then(() => {
  });
}
function createMessageWithOverrides(type, source, contentType, data, overrideFactors = [], processingSource) {
  const resolved = resolveAssociation({
    contentType,
    context: processingSource,
    processingSource,
    overrideFactors
  });
  return {
    id: crypto.randomUUID(),
    type,
    source,
    destination: resolved.destination === "basic-viewer" ? "basic-viewer" : resolved.destination === "basic-explorer" ? "basic-explorer" : "basic-workcenter",
    contentType,
    data,
    metadata: {
      timestamp: Date.now(),
      overrideFactors,
      processingSource,
      priority: "normal"
    }
  };
}

const UnifiedMessaging = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    createMessageWithOverrides,
    enqueuePendingMessage,
    getBroadcastChannel,
    getUnifiedMessaging,
    getWorkerChannel,
    hasPendingMessages,
    initializeComponent,
    navigateToView,
    processInitialContent,
    registerComponent,
    registerHandler,
    sendMessage,
    sendToClipboard,
    sendToWorkCenter,
    unifiedMessaging,
    unregisterHandler
}, Symbol.toStringTag, { value: 'Module' }));

export { API_ENDPOINTS, BROADCAST_CHANNELS, COMPONENTS, MESSAGE_TYPES, ROUTE_HASHES, UnifiedMessaging, initializeComponent, registerComponent, registerHandler, sendMessage, unifiedMessaging, unregisterHandler };
//# sourceMappingURL=UnifiedMessaging.js.map
