import { loadSettings } from './Settings.js';
import { createGPTInstance, getUsableData, detectDataKindFromContent, extractJSONFromAIResponse, toBase64 } from './GPT-Responses.js';
import { __vitePreload } from './index.js';
import { getRuntimeSettings } from './RuntimeSettings.js';
import { LANGUAGE_INSTRUCTIONS, TRANSLATE_INSTRUCTION, SVG_GRAPHICS_ADDON, CORE_IMAGE_INSTRUCTION, CORE_DATA_CONVERSION_INSTRUCTION, SOLVE_AND_ANSWER_INSTRUCTION, WRITE_CODE_INSTRUCTION, EXTRACT_CSS_INSTRUCTION, CORE_ENTITY_EXTRACTION_INSTRUCTION, DATA_MODIFICATION_INSTRUCTION, buildInstructionPrompt, getOutputFormatInstruction, getIntermediateRecognitionInstruction } from './BuiltInAI.js';

"use strict";
const DEFAULT_MODEL = "gpt-5.2";
const DEFAULT_API_URL = "https://api.proxyapi.ru/openai/v1";
const getGPTInstance = async (config) => {
  const settings = await loadSettings();
  const apiKey = config?.apiKey || settings?.ai?.apiKey;
  if (!apiKey) {
    return null;
  }
  const baseUrl = config?.baseUrl || settings?.ai?.baseUrl || DEFAULT_API_URL;
  const model = config?.model || settings?.ai?.model || DEFAULT_MODEL;
  return createGPTInstance(apiKey, baseUrl, model);
};
function unwrapUnwantedCodeBlocks(content) {
  if (!content) return content;
  const codeBlockRegex = /^```(?:katex|md|markdown|html|xml|json|text)?\n([\s\S]*?)\n```$/;
  const match = content.trim().match(codeBlockRegex);
  if (match) {
    const unwrapped = match[1].trim();
    const lines = unwrapped.split("\n");
    if (lines.length === 1 || unwrapped.includes("<math") || unwrapped.includes('<span class="katex') || unwrapped.includes("<content") || unwrapped.startsWith("<") && unwrapped.endsWith(">") || /^\s*<[^>]+>/.test(unwrapped)) {
      return unwrapped;
    }
    if (lines.length > 3 || lines.some((line) => line.match(/^\s{4,}/) || line.includes("function") || line.includes("const ") || line.includes("let "))) {
      return content;
    }
    return unwrapped;
  }
  return content;
}
function isImageData(data) {
  return data instanceof File && data.type.startsWith("image/") || data instanceof Blob && data.type?.startsWith("image/") || typeof data === "string" && (data.startsWith("data:image/") || data.startsWith("http") || data.startsWith("https://"));
}
function getResponseFormat(format) {
  const jsonFormats = ["json", "xml", "yaml"];
  return jsonFormats.includes(format) ? "json" : "text";
}
const pickFirstError = (raw) => {
  if (!raw) return void 0;
  if (typeof raw.error === "string" && raw.error.trim()) return raw.error;
  if (Array.isArray(raw.errors) && typeof raw.errors[0] === "string" && raw.errors[0].trim()) return raw.errors[0];
  return void 0;
};
const extractText = (raw) => {
  if (!raw) return void 0;
  if (typeof raw.data === "string") {
    const t = raw.data.trim();
    if (t) return t;
  }
  if (typeof raw.verbose_data === "string") {
    const t = raw.verbose_data.trim();
    if (t) return t;
  }
  const rd = raw.recognized_data;
  if (typeof rd === "string") {
    const t = rd.trim();
    if (t) return t;
  }
  if (Array.isArray(rd)) {
    const parts = [];
    for (const item of rd) {
      if (typeof item === "string") {
        if (item.trim()) parts.push(item.trim());
        continue;
      }
      const maybe = item?.output ?? item?.text ?? item?.content ?? item?.value;
      if (typeof maybe === "string" && maybe.trim()) parts.push(maybe.trim());
    }
    const joined = parts.join("\n").trim();
    if (joined) return joined;
  }
  return void 0;
};
const toCrxResult = (raw) => {
  const ok = !!raw?.ok;
  const data = extractText(raw);
  const error = pickFirstError(raw) ?? (ok && !data ? "No data recognized" : void 0);
  return {
    ok: ok && !!data,
    data,
    error,
    raw
  };
};

"use strict";
const createPwaAdapter = () => ({
  async copyToClipboard(data) {
    try {
      const { writeText } = await __vitePreload(async () => { const { writeText } = await import('./Clipboard.js');return { writeText }},true              ?[]:void 0,import.meta.url);
      return await writeText(data);
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  async readFromClipboard() {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        return { ok: true, data: text };
      }
      return { ok: false, error: "Clipboard access not available" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  async processImage(dataUrl) {
    return dataUrl;
  },
  showNotification(message, options) {
    try {
      __vitePreload(async () => { const {showToast} = await import('./Toast.js');return { showToast }},true              ?[]:void 0,import.meta.url).then(({ showToast }) => {
        showToast({
          message,
          kind: options?.type || "info",
          duration: options?.duration || 3e3
        });
      });
    } catch {
      console.log(message);
    }
  }
});
const createCrxAdapter = () => ({
  async copyToClipboard(data) {
    try {
      const { requestCopyViaCRX } = await __vitePreload(async () => { const { requestCopyViaCRX } = await import('./Clipboard.js');return { requestCopyViaCRX }},true              ?[]:void 0,import.meta.url);
      const result = await requestCopyViaCRX(data);
      return { ok: result.ok, data: result.data };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  async readFromClipboard() {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        return { ok: true, data: text };
      }
      return { ok: false, error: "Clipboard access not available" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  async processImage(dataUrl) {
    try {
      const isServiceWorker = typeof globalThis === "undefined" || !globalThis?.document;
      if (isServiceWorker) {
        console.warn("[RecognizeData] Image processing not available in service worker context");
        return dataUrl;
      }
      const { encodeWithJSquash, removeAnyPrefix } = await __vitePreload(async () => { const { encodeWithJSquash, removeAnyPrefix } = await import('./ImageProcess.js');return { encodeWithJSquash, removeAnyPrefix }},true              ?[]:void 0,import.meta.url);
      const SIZE_THRESHOLD = 2 * 1024 * 1024;
      if (dataUrl.length <= SIZE_THRESHOLD) return dataUrl;
      try {
        const binary = Uint8Array.fromBase64(removeAnyPrefix(dataUrl), { alphabet: "base64" });
        const blob = new Blob([binary], { type: "image/png" });
        const bitmap = await createImageBitmap(blob);
        const arrayBuffer = await encodeWithJSquash(bitmap);
        bitmap?.close?.();
        if (arrayBuffer) {
          const base64 = new Uint8Array(arrayBuffer).toBase64({ alphabet: "base64" });
          return `data:image/jpeg;base64,${base64}`;
        }
      } catch (processingError) {
        console.warn("[RecognizeData] Image compression failed:", processingError);
      }
      return dataUrl;
    } catch (e) {
      console.warn("[RecognizeData] Image processing failed:", e);
      return dataUrl;
    }
  },
  async captureScreenshot(rect) {
    try {
      if (typeof chrome !== "undefined" && chrome.tabs?.captureVisibleTab) {
        const captureOptions = { format: "png", scale: 1 };
        if (rect) {
          captureOptions.rect = rect;
        }
        return new Promise((resolve, reject) => {
          chrome.tabs.captureVisibleTab(captureOptions, (dataUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(dataUrl);
            }
          });
        });
      }
      throw new Error("Screenshot capture not available");
    } catch (e) {
      throw new Error(`Screenshot capture failed: ${e}`);
    }
  },
  showNotification(message, options) {
    console.log(`[${options?.type || "info"}] ${message}`);
  }
});
const createCoreAdapter = () => ({
  async copyToClipboard(data) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data);
        return { ok: true, data, method: "clipboard-api" };
      }
      const textArea = document.createElement("textarea");
      textArea.value = data;
      textArea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand("copy");
      textArea.remove();
      return success ? { ok: true, data, method: "legacy" } : { ok: false, error: "Copy failed" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  async readFromClipboard() {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        return { ok: true, data: text };
      }
      return { ok: false, error: "Clipboard access not available" };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  showNotification(message, options) {
    console.log(`[${options?.type || "info"}] ${message}`);
  }
});
const detectPlatform = () => {
  try {
    if (typeof chrome !== "undefined" && chrome?.runtime?.id) {
      return "crx";
    }
    if (typeof self !== "undefined" && "ServiceWorkerGlobalScope" in self) {
      return "pwa";
    }
    if (typeof navigator !== "undefined" && "standalone" in navigator) {
      return "pwa";
    }
    return "core";
  } catch {
    return "unknown";
  }
};
const getPlatformAdapter = () => {
  const platform = detectPlatform();
  switch (platform) {
    case "crx":
      return createCrxAdapter();
    case "pwa":
      return createPwaAdapter();
    case "core":
    default:
      return createCoreAdapter();
  }
};

"use strict";
const loadAISettings = async () => {
  const platform = detectPlatform();
  try {
    if (platform === "crx") {
      return await loadSettings();
    } else {
      return await getRuntimeSettings();
    }
  } catch (e) {
    console.error(`[AI-Service] Failed to load settings for platform ${platform}:`, e);
    return null;
  }
};
const getActiveCustomInstruction = async () => {
  try {
    const { getActiveInstructionText } = await __vitePreload(async () => { const { getActiveInstructionText } = await import('./CustomInstructions.js');return { getActiveInstructionText }},true              ?[]:void 0,import.meta.url);
    return await getActiveInstructionText();
  } catch {
    return "";
  }
};
const getLanguageInstruction = async () => {
  try {
    const settings = await loadAISettings();
    const lang = settings?.ai?.responseLanguage || "auto";
    const translate = settings?.ai?.translateResults || false;
    let instruction = LANGUAGE_INSTRUCTIONS[lang] || "";
    if (translate && lang !== "auto") {
      instruction += TRANSLATE_INSTRUCTION;
    }
    return instruction;
  } catch {
    return "";
  }
};
const getSvgGraphicsAddon = async () => {
  try {
    const settings = await loadAISettings();
    return settings?.ai?.generateSvgGraphics ? SVG_GRAPHICS_ADDON : "";
  } catch {
    return "";
  }
};

"use strict";
const recognizeImageData = async (input, sendResponse, config, options) => {
  const { recognizeByInstructions } = await __vitePreload(async () => { const { recognizeByInstructions } = await Promise.resolve().then(() => unified);return { recognizeByInstructions }},true              ?void 0:void 0,import.meta.url);
  return recognizeByInstructions(input, CORE_IMAGE_INSTRUCTION, sendResponse, config, options);
};
const convertTextualData = async (input, sendResponse, config, options) => {
  const { recognizeByInstructions } = await __vitePreload(async () => { const { recognizeByInstructions } = await Promise.resolve().then(() => unified);return { recognizeByInstructions }},true              ?void 0:void 0,import.meta.url);
  return recognizeByInstructions(input, CORE_DATA_CONVERSION_INSTRUCTION, sendResponse, config, options);
};
const analyzeRecognizeUnified = async (rawData, sendResponse, config, options) => {
  const content = await getUsableData({ dataSource: rawData });
  const input = [
    {
      type: "message",
      role: "user",
      content: [content]
    }
  ];
  return content?.[0]?.type === "input_image" || content?.type === "input_image" ? recognizeImageData(input, sendResponse, config, options) : convertTextualData(input, sendResponse, config, options);
};
const recognizeWithContext = async (data, context, mode = "auto", config) => {
  const startTime = performance.now();
  const result = {
    ok: false,
    recognized_data: [],
    keywords_and_tags: [],
    verbose_data: "",
    suggested_type: null,
    confidence: 0,
    source_kind: "input_text",
    processing_time_ms: 0,
    errors: [],
    warnings: []
  };
  try {
    const gpt = await getGPTInstance(config);
    if (!gpt) {
      result.errors.push("No GPT instance available");
      return result;
    }
    gpt.setContext(context || null);
    let dataKind = "input_text";
    if (data instanceof File || data instanceof Blob) {
      if (data.type.startsWith("image/")) {
        dataKind = "input_image";
      } else if (data.type.includes("json")) {
        dataKind = "json";
      }
    } else if (typeof data === "string") {
      dataKind = detectDataKindFromContent(data);
    }
    result.source_kind = dataKind;
    if (mode === "image") dataKind = "input_image";
    else if (mode === "text") dataKind = "input_text";
    else if (mode === "structured") dataKind = "json";
    if (Array.isArray(data) && (data?.[0]?.type === "message" || data?.[0]?.["role"])) {
      await gpt?.getPending?.()?.push?.(...data);
    } else {
      await gpt?.attachToRequest?.(data, dataKind);
    }
    const instruction = dataKind === "input_image" ? CORE_IMAGE_INSTRUCTION : CORE_DATA_CONVERSION_INSTRUCTION;
    const contextAddition = context?.entityType ? `

Expected entity type context: ${context?.entityType}` : "";
    const searchAddition = context?.searchTerms?.length ? `

Focus on finding: ${context?.searchTerms?.join?.(", ")}` : "";
    await gpt.askToDoAction(instruction + contextAddition + searchAddition);
    const raw = await gpt.sendRequest(context?.priority === "high" ? "high" : "medium", "medium", null, {
      responseFormat: "json",
      temperature: 0.3
    });
    if (!raw) {
      result.errors.push("No response from AI");
      return result;
    }
    const parseResult = extractJSONFromAIResponse(raw);
    if (!parseResult.ok) {
      result.errors.push(parseResult.error || "Failed to parse AI response");
      result.verbose_data = raw;
      return result;
    }
    const parsed = parseResult.data;
    result.ok = true;
    result.recognized_data = parsed?.recognized_data || [parsed?.verbose_data || raw];
    result.keywords_and_tags = parsed?.keywords_and_tags || parsed?.keywords || [];
    result.verbose_data = parsed?.verbose_data || "";
    result.suggested_type = parsed?.document_type || parsed?.source_format || null;
    result.confidence = parsed?.confidence || 0.7;
  } catch (e) {
    result.errors.push(String(e));
  }
  result.processing_time_ms = performance.now() - startTime;
  return result;
};
const batchRecognize = async (items, context, concurrency = 3, config) => {
  const startTime = performance.now();
  const result = {
    ok: true,
    results: [],
    total_processed: items.length,
    total_successful: 0,
    total_failed: 0,
    combined_keywords: [],
    processing_time_ms: 0
  };
  const keywordSet = /* @__PURE__ */ new Set();
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const promises = batch.map((item) => recognizeWithContext(item, context || {}, "auto", config));
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      result.results.push(r);
      if (r.ok) {
        result.total_successful++;
        r.keywords_and_tags.forEach((k) => keywordSet.add(k));
      } else {
        result.total_failed++;
      }
    }
  }
  result.ok = result.total_failed === 0;
  result.combined_keywords = Array.from(keywordSet);
  result.processing_time_ms = performance.now() - startTime;
  return result;
};

"use strict";
const smartRecognize = async (data, hints, config) => {
  const { extractEntities } = await __vitePreload(async () => { const { extractEntities } = await Promise.resolve().then(() => entities);return { extractEntities }},true              ?void 0:void 0,import.meta.url);
  const baseResult = await recognizeWithContext(
    data,
    {
      entityType: hints?.expectedType,
      searchTerms: hints?.domain ? [hints.domain] : void 0
    },
    "auto",
    config
  );
  if (!baseResult.ok) {
    return baseResult;
  }
  if (hints?.extractEntities) {
    const entityResult = await extractEntities(data, config);
    return {
      ...baseResult,
      entities: entityResult.ok ? entityResult.data : void 0
    };
  }
  return baseResult;
};
const recognizeAndNormalize = async (data, normalizations = {}) => {
  const baseResult = await recognizeWithContext(data, {});
  const normalized = {
    phones: [],
    emails: [],
    urls: [],
    dates: [],
    addresses: []
  };
  if (!baseResult.ok) {
    return { ...baseResult, normalized };
  }
  try {
    const gpt = await getGPTInstance();
    if (!gpt) {
      return { ...baseResult, normalized };
    }
    const enabledNormalizations = Object.entries(normalizations).filter(([_, v]) => v).map(([k]) => k);
    if (enabledNormalizations.length === 0) {
      return { ...baseResult, normalized };
    }
    await gpt.giveForRequest(`
Recognized data:
\`\`\`
${baseResult.verbose_data || baseResult.recognized_data.join("\n")}
\`\`\`
		`);
    await gpt.askToDoAction(`
Extract and normalize the following types: ${enabledNormalizations.join(", ")}

Normalization rules:
- phones: E.164 format or local format with country code
- emails: lowercase, trimmed
- urls: full URL with protocol
- dates: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- addresses: structured with street, city, country if detectable

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations.
Your response must start with { and end with }.

Expected output structure:
{
    "phones": ["..."],
    "emails": ["..."],
    "urls": ["..."],
    "dates": ["..."],
    "addresses": [{ "raw": "...", "structured": {...} }]
}
		`);
    const raw = await gpt.sendRequest("medium", "low", null, {
      responseFormat: "json",
      temperature: 0.1
    });
    if (raw) {
      const parseResult = extractJSONFromAIResponse(raw);
      if (parseResult.ok && parseResult.data) {
        Object.assign(normalized, parseResult.data);
      } else {
        baseResult.warnings.push("Normalization JSON parsing partially failed");
      }
    }
  } catch {
    baseResult.warnings.push("Normalization partially failed");
  }
  return { ...baseResult, normalized };
};
const recognizeFromClipboard = async () => {
  try {
    const clipboardItems = await navigator.clipboard.read().catch(() => null);
    if (clipboardItems) {
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            return recognizeWithContext(blob, {});
          }
        }
      }
    }
    const text = await navigator.clipboard.readText().catch(() => null);
    if (text) {
      return recognizeWithContext(text, {});
    }
    return null;
  } catch {
    return null;
  }
};

"use strict";
const emptyResult = (errors, processingTime) => ({
  ok: false,
  recognized_data: [],
  keywords_and_tags: [],
  verbose_data: "",
  suggested_type: null,
  confidence: 0,
  source_kind: "unknown",
  processing_time_ms: processingTime,
  errors,
  warnings: []
});
const runInstructionTask = async (input, instructionConst, resultTags, resultType, options) => {
  const gpt = await getGPTInstance();
  if (!gpt) return emptyResult(["AI service not available"], 0);
  const startTime = Date.now();
  try {
    const languageInstruction = await getLanguageInstruction();
    const svgAddon = await getSvgGraphicsAddon();
    const instruction = instructionConst + languageInstruction + svgAddon;
    let customInstruction = "";
    if (options?.customInstruction) {
      customInstruction = options.customInstruction;
    } else if (options?.useActiveInstruction) {
      customInstruction = await getActiveCustomInstruction();
    }
    if (customInstruction) {
      await gpt.askToDoAction(customInstruction);
    }
    await gpt.askToDoAction(instruction);
    await gpt.giveForRequest(input);
    const rawResponse = await gpt.sendRequest("high", "medium");
    const processingTime = Date.now() - startTime;
    if (rawResponse) {
      return {
        ok: true,
        recognized_data: [rawResponse],
        keywords_and_tags: resultTags,
        verbose_data: rawResponse,
        suggested_type: resultType,
        confidence: 0.9,
        source_kind: "text",
        processing_time_ms: processingTime,
        errors: [],
        warnings: []
      };
    } else {
      return emptyResult([`Failed to get ${resultType} response`], processingTime);
    }
  } catch (e) {
    return emptyResult([String(e)], Date.now() - startTime);
  }
};
const solveAndAnswer = async (input, options) => {
  return runInstructionTask(input, SOLVE_AND_ANSWER_INSTRUCTION, ["solution", "answer"], "solution", options);
};
const writeCode = async (input, options) => {
  return runInstructionTask(input, WRITE_CODE_INSTRUCTION, ["code", "programming"], "code", options);
};
const extractCSS = async (input, options) => {
  return runInstructionTask(input, EXTRACT_CSS_INSTRUCTION, ["css", "styles", "stylesheet"], "css", options);
};
const solveEquation = solveAndAnswer;
const answerQuestion = solveAndAnswer;

"use strict";
const extractEntities = async (data, config) => {
  try {
    const gpt = await getGPTInstance(config);
    if (!gpt) {
      return { ok: false, error: "No GPT instance" };
    }
    const dataKind = typeof data === "string" ? detectDataKindFromContent(data) : (data instanceof File || data instanceof Blob) && data.type.startsWith("image/") ? "input_image" : "input_text";
    if (Array.isArray(data) && (data?.[0]?.type === "message" || data?.[0]?.["role"])) {
      await gpt?.getPending?.()?.push?.(...data);
    } else {
      await gpt?.attachToRequest?.(data, dataKind);
    }
    await gpt.askToDoAction(CORE_ENTITY_EXTRACTION_INSTRUCTION);
    const raw = await gpt.sendRequest("high", "medium", null, {
      responseFormat: "json",
      temperature: 0.2
    });
    if (!raw) {
      return { ok: false, error: "No response" };
    }
    const parseResult = extractJSONFromAIResponse(raw);
    if (!parseResult.ok) {
      return { ok: false, error: parseResult.error || "Failed to parse AI response" };
    }
    return {
      ok: true,
      data: parseResult.data?.entities || [],
      responseId: gpt.getResponseId()
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
};
const modifyEntityData = async (existingEntity, modificationPrompt, sendResponse) => {
  const settings = (await loadSettings())?.ai;
  const token = settings?.apiKey;
  if (!token) {
    const result = { ok: false, error: "No API key" };
    sendResponse?.(result);
    return result;
  }
  const instructions = `
${DATA_MODIFICATION_INSTRUCTION}

Existing entity to modify:
\`\`\`json
${JSON.stringify(existingEntity, null, 2)}
\`\`\`

User modification request: ${modificationPrompt}
`;
  const input = [
    {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: instructions }]
    }
  ];
  const { recognizeByInstructions } = await __vitePreload(async () => { const { recognizeByInstructions } = await Promise.resolve().then(() => unified);return { recognizeByInstructions }},true              ?void 0:void 0,import.meta.url);
  return recognizeByInstructions(input, "", sendResponse);
};
const extractByRules = async (data, rules) => {
  const results = [];
  try {
    const gpt = await getGPTInstance();
    if (!gpt) {
      return results;
    }
    const rulesDescription = rules.map(
      (r) => `- ${r.name} (${r.type}): ${r.pattern ? `pattern: ${r.pattern}` : "auto-detect"}${r.format ? `, format as: ${r.format}` : ""}${r.required ? " [REQUIRED]" : ""}`
    ).join("\n");
    await gpt.giveForRequest(`
Input data:
\`\`\`
${data}
\`\`\`

Extraction rules:
${rulesDescription}
		`);
    await gpt.askToDoAction(`
Extract data according to the rules.
For each rule, find matching content and normalize it.

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations.
Your response must start with { and end with }.

Expected output structure:
{
    "extractions": [
        {
            "field": "rule name",
            "value": "normalized value",
            "confidence": 0.0-1.0,
            "raw": "original text",
            "normalized": "formatted value"
        }
    ],
    "missing_required": ["list of required fields not found"]
}
		`);
    const raw = await gpt.sendRequest("medium", "low", null, {
      responseFormat: "json",
      temperature: 0.1
    });
    if (!raw) return results;
    const parseResult = extractJSONFromAIResponse(raw);
    if (!parseResult.ok || !parseResult.data) {
      return results;
    }
    return parseResult.data?.extractions || [];
  } catch {
    return results;
  }
};

const entities = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	extractByRules,
	extractEntities,
	modifyEntityData
}, Symbol.toStringTag, { value: 'Module' }));

"use strict";
class RecognitionCache {
  cache = /* @__PURE__ */ new Map();
  maxEntries = 100;
  ttl = 24 * 60 * 60 * 1e3;
  generateDataHash(data) {
    if (data instanceof File) {
      return `${data.name}-${data.size}-${data.lastModified}`;
    }
    if (typeof data === "string") {
      return btoa(data).substring(0, 32);
    }
    return JSON.stringify(data).substring(0, 32);
  }
  get(data, format) {
    const hash = this.generateDataHash(data);
    const entry = this.cache.get(hash);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hash);
      return null;
    }
    if (format && entry.recognizedAs !== format) {
      return null;
    }
    return entry;
  }
  set(data, recognizedData, recognizedAs, responseId, metadata) {
    const hash = this.generateDataHash(data);
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    this.cache.set(hash, {
      dataHash: hash,
      recognizedData,
      recognizedAs,
      timestamp: Date.now(),
      responseId,
      metadata
    });
  }
  clear() {
    this.cache.clear();
  }
  getStats() {
    return {
      entries: this.cache.size,
      maxEntries: this.maxEntries,
      ttl: this.ttl
    };
  }
}

"use strict";
const recognitionCache = new RecognitionCache();
const processDataWithInstruction = async (input, options = {}, sendResponse) => {
  const settings = (await loadSettings())?.ai;
  const {
    instruction = "",
    outputFormat = "auto",
    outputLanguage = "auto",
    enableSVGImageGeneration = "auto",
    intermediateRecognition,
    processingEffort = "low",
    processingVerbosity = "low",
    customInstruction,
    useActiveInstruction = false,
    includeImageRecognition,
    dataType
  } = options;
  const token = settings?.apiKey;
  if (!token) {
    const result2 = { ok: false, error: "No API key available" };
    sendResponse?.(result2);
    return result2;
  }
  if (!input) {
    const result2 = { ok: false, error: "No input provided" };
    sendResponse?.(result2);
    return result2;
  }
  let finalInstruction = instruction;
  if (customInstruction) {
    finalInstruction = buildInstructionPrompt(finalInstruction, customInstruction);
  } else if (useActiveInstruction) {
    const activeInstruction = await getActiveCustomInstruction();
    if (activeInstruction) {
      finalInstruction = buildInstructionPrompt(finalInstruction, activeInstruction);
    }
  }
  const languageInstruction = await getLanguageInstruction();
  if (languageInstruction) {
    finalInstruction += languageInstruction;
  }
  const shouldEnableSVG = enableSVGImageGeneration === true || enableSVGImageGeneration === "auto" && outputFormat === "html";
  if (shouldEnableSVG) {
    const svgAddon = await getSvgGraphicsAddon();
    if (svgAddon) {
      finalInstruction += svgAddon;
    }
  }
  if (outputFormat !== "auto") {
    const formatInstruction = getOutputFormatInstruction(outputFormat);
    if (formatInstruction) {
      finalInstruction += formatInstruction;
    }
  }
  const gpt = createGPTInstance(token, settings?.baseUrl || DEFAULT_API_URL, settings?.model || DEFAULT_MODEL);
  gpt.clearPending();
  let processingStages = 1;
  let recognizedImages = false;
  const intermediateRecognizedData = [];
  if (Array.isArray(input) && (input?.[0]?.type === "message" || input?.[0]?.["role"])) {
    await gpt.getPending()?.push(...input);
  } else {
    const inputData = Array.isArray(input) ? input : [input];
    for (const item of inputData) {
      let processedItem = item;
      if (typeof item === "string" && dataType === "svg" || typeof item === "string" && item.trim().startsWith("<svg")) {
        processedItem = item;
      } else if (isImageData(item)) {
        recognizedImages = true;
        const useIntermediateRecognition = intermediateRecognition?.enabled !== false && (intermediateRecognition?.enabled || includeImageRecognition);
        if (useIntermediateRecognition) {
          processingStages = 2;
          const cachedResult = !intermediateRecognition?.forceRefresh ? recognitionCache.get(item, intermediateRecognition?.outputFormat) : null;
          let recognizedContent;
          let recognitionResponseId;
          if (cachedResult) {
            recognizedContent = cachedResult.recognizedData;
            recognitionResponseId = cachedResult.responseId;
          } else {
            const recognitionInstruction = intermediateRecognition?.dataPriorityInstruction || getIntermediateRecognitionInstruction(intermediateRecognition?.outputFormat || "markdown");
            const recognitionResult = await recognizeByInstructions(
              item,
              recognitionInstruction,
              void 0,
              { apiKey: token, baseUrl: settings?.baseUrl, model: settings?.model },
              { customInstruction: void 0, useActiveInstruction: false }
            );
            if (!recognitionResult.ok || !recognitionResult.data) {
              recognizedContent = "";
              recognitionResponseId = "";
            } else {
              recognizedContent = recognitionResult.data;
              recognitionResponseId = recognitionResult.responseId || "";
              if (intermediateRecognition?.cacheResults !== false) {
                const recognizedAs = intermediateRecognition?.outputFormat || "markdown";
                recognitionCache.set(item, recognizedContent, recognizedAs, recognitionResponseId);
              }
            }
          }
          intermediateRecognizedData.push({
            originalData: item,
            recognizedData: recognizedContent,
            recognizedAs: intermediateRecognition?.outputFormat || "markdown",
            responseId: recognitionResponseId
          });
          if (recognizedContent) {
            processedItem = recognizedContent;
          }
        }
      }
      if (processedItem !== null && processedItem !== void 0) {
        await gpt?.attachToRequest?.(processedItem);
      }
    }
  }
  await gpt.askToDoAction(finalInstruction);
  let response;
  let error;
  try {
    response = await gpt?.sendRequest?.(processingEffort, processingVerbosity, null, {
      responseFormat: getResponseFormat(outputFormat),
      temperature: 0.3
    });
  } catch (e) {
    error = String(e);
  }
  let parsedResponse = response;
  if (typeof response === "string") {
    try {
      parsedResponse = JSON.parse(response);
    } catch {
      parsedResponse = null;
    }
  }
  const responseContent = parsedResponse?.choices?.[0]?.message?.content;
  let cleanedResponse = responseContent ? unwrapUnwantedCodeBlocks(responseContent.trim()) : null;
  let finalData = cleanedResponse;
  if (cleanedResponse && instruction?.includes("Recognize data from image")) {
    try {
      const parsedJson = JSON.parse(cleanedResponse);
      if (parsedJson?.recognized_data) {
        if (Array.isArray(parsedJson.recognized_data)) {
          finalData = parsedJson.recognized_data.join("\n");
        } else if (typeof parsedJson.recognized_data === "string") {
          finalData = parsedJson.recognized_data;
        } else {
          finalData = JSON.stringify(parsedJson.recognized_data);
        }
      } else if (parsedJson?.ok === false) {
        finalData = null;
      } else {
        finalData = cleanedResponse;
      }
    } catch {
      finalData = cleanedResponse;
    }
  }
  const result = {
    ok: !!finalData && !error,
    data: finalData || void 0,
    error: error || (!finalData ? "No data recognized" : void 0),
    responseId: parsedResponse?.id || gpt?.getResponseId?.(),
    processingStages,
    recognizedImages,
    intermediateRecognizedData: intermediateRecognizedData.length > 0 ? intermediateRecognizedData : void 0
  };
  sendResponse?.(result);
  return result;
};
const recognizeByInstructions = async (input, instructions, sendResponse, config, options) => {
  const result = await processDataWithInstruction(input, {
    instruction: instructions,
    customInstruction: options?.customInstruction,
    useActiveInstruction: options?.useActiveInstruction,
    processingEffort: options?.recognitionEffort || "low",
    processingVerbosity: options?.recognitionVerbosity || "low",
    outputFormat: "auto",
    outputLanguage: "auto",
    enableSVGImageGeneration: "auto"
  });
  const legacyResult = {
    ok: result.ok,
    data: result.data,
    error: result.error,
    responseId: result.responseId
  };
  sendResponse?.(legacyResult);
  return legacyResult;
};
const processDataByInstruction = async (input, instructions, sendResponse, config, options) => {
  const result = await processDataWithInstruction(input, {
    instruction: instructions,
    ...options,
    outputFormat: options?.outputFormat || "auto",
    outputLanguage: options?.outputLanguage || "auto",
    enableSVGImageGeneration: options?.enableSVGImageGeneration || "auto"
  });
  const legacyResult = {
    ok: result.ok,
    data: result.data,
    error: result.error,
    responseId: result.responseId,
    processingStages: result.processingStages,
    recognizedImages: result.recognizedImages
  };
  sendResponse?.(legacyResult);
  return legacyResult;
};
const UnifiedAIService = {
  detectPlatform,
  getPlatformAdapter,
  loadAISettings,
  getLanguageInstruction,
  getSvgGraphicsAddon,
  getActiveCustomInstruction,
  processDataWithInstruction,
  clearRecognitionCache: () => recognitionCache.clear(),
  getRecognitionCacheStats: () => recognitionCache.getStats(),
  recognizeByInstructions,
  processDataByInstruction,
  solveAndAnswer,
  writeCode,
  extractCSS,
  extractEntities,
  smartRecognize
};

const unified = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	UnifiedAIService,
	default: UnifiedAIService,
	processDataByInstruction,
	processDataWithInstruction,
	recognizeByInstructions
}, Symbol.toStringTag, { value: 'Module' }));

"use strict";

"use strict";
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

"use strict";
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

export { actionHistory, executionCore, extractCSS, getGPTInstance, processDataWithInstruction, recognizeByInstructions, recognizeImageData, solveAndAnswer, writeCode };
//# sourceMappingURL=ExecutionCore.js.map
