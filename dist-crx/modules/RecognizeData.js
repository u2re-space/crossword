import { loadSettings, DEFAULT_SETTINGS, __vitePreload } from './Settings.js';
import { createGPTInstance } from './GPT-Responses.js';
import { LANGUAGE_INSTRUCTIONS, TRANSLATE_INSTRUCTION, SVG_GRAPHICS_ADDON, buildInstructionPrompt, getIntermediateRecognitionInstruction, getOutputFormatInstruction } from './CustomInstructions.js';
import { CORE_IMAGE_INSTRUCTION, SOLVE_AND_ANSWER_INSTRUCTION, WRITE_CODE_INSTRUCTION, EXTRACT_CSS_INSTRUCTION } from './templates.js';
import './Env.js';

const DEFAULT_MODEL = "gpt-5.2";
const DEFAULT_API_URL = "https://api.proxyapi.ru/openai/v1";
const getGPTInstance = async (config) => {
  const settings = await loadSettings();
  const apiKey = settings?.ai?.apiKey;
  if (!apiKey) {
    return null;
  }
  const baseUrl = settings?.ai?.baseUrl || DEFAULT_API_URL;
  const model = settings?.ai?.model || DEFAULT_MODEL;
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

let provider = loadSettings;
const getRuntimeSettings = async () => {
  try {
    const value = await provider();
    return value || DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

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
    const { getActiveInstructionText } = await __vitePreload(async () => { const { getActiveInstructionText } = await import('./CustomInstructions.js').then(n => n.CustomInstructions);return { getActiveInstructionText }},true              ?[]:void 0,import.meta.url);
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

const recognizeImageData = async (input, sendResponse, config, options) => {
  const { recognizeByInstructions } = await __vitePreload(async () => { const { recognizeByInstructions } = await Promise.resolve().then(() => unified);return { recognizeByInstructions }},true              ?void 0:void 0,import.meta.url);
  return recognizeByInstructions(input, CORE_IMAGE_INSTRUCTION, sendResponse, config, options);
};

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
              { baseUrl: settings?.baseUrl, model: settings?.model },
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

const unified = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	processDataWithInstruction,
	recognizeByInstructions
}, Symbol.toStringTag, { value: 'Module' }));

export { detectPlatform, extractCSS, getActiveCustomInstruction, getGPTInstance, getLanguageInstruction, getSvgGraphicsAddon, loadAISettings, processDataWithInstruction, recognizeByInstructions, recognizeImageData, solveAndAnswer, writeCode };
//# sourceMappingURL=RecognizeData.js.map
