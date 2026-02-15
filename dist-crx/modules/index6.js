import { H, isBase64Like, parseDataUrl, normalizeDataAsset, loadAsAdopted, removeAdopted } from './Settings.js';
import { marked } from './marked.esm.js';
import { markedKatex } from './index17.js';
import { renderMathInElement } from './auto-render.js';
import { ROUTE_HASHES, BROADCAST_CHANNELS, unifiedMessaging, registerComponent, initializeComponent } from './UnifiedMessaging.js';
import { __vitePreload } from './index.js';
import { fetchCachedShareFiles } from './crx-entry.js';
import { getInstructionRegistry, setActiveInstruction, getCustomInstructions } from './CustomInstructions.js';
import { buildInstructionPrompt, DEFAULT_INSTRUCTION_TEMPLATES } from './BuiltInAI.js';
import { executionCore, actionHistory } from './ExecutionCore.js';
import { extractJSONFromAIResponse } from './GPT-Responses.js';
import { DOMPurify } from './browser.js';
import './Clipboard.js';
import './RuntimeSettings.js';
import './Runtime2.js';
import './_commonjsHelpers.js';

"use strict";
class WorkCenterStateManager {
  static STORAGE_KEY = "rs-workcenter-state";
  static TEMPLATES_STORAGE_KEY = "rs-workcenter-templates";
  static createDefaultState() {
    return {
      files: [],
      selectedFiles: [],
      currentPrompt: "",
      autoAction: false,
      selectedInstruction: "",
      outputFormat: "auto",
      activeInputTab: "prompt",
      activeResultsTab: "output",
      selectedLanguage: "auto",
      selectedTemplate: "",
      recognitionFormat: "auto",
      processingFormat: "markdown",
      voiceRecording: false,
      promptTemplates: this.loadPromptTemplates(),
      lastRawResult: null,
      recognizedData: null,
      processedData: null,
      currentProcessingStep: 0,
      ...this.loadWorkCenterState()
      // Load persisted state
    };
  }
  static saveState(state) {
    try {
      const stateToSave = {
        currentPrompt: state.currentPrompt,
        autoAction: state.autoAction,
        selectedInstruction: state.selectedInstruction,
        outputFormat: state.outputFormat,
        activeInputTab: state.activeInputTab,
        activeResultsTab: state.activeResultsTab,
        selectedLanguage: state.selectedLanguage,
        selectedTemplate: state.selectedTemplate,
        recognitionFormat: state.recognitionFormat,
        processingFormat: state.processingFormat,
        currentProcessingStep: state.currentProcessingStep,
        // Save metadata about recognized/processed data, not the full content
        recognizedData: state.recognizedData ? {
          timestamp: state.recognizedData.timestamp,
          source: state.recognizedData.source,
          contentLength: state.recognizedData.content.length,
          metadata: state.recognizedData.metadata
        } : null,
        processedData: state.processedData ? state.processedData.map((p) => ({
          timestamp: p.timestamp,
          action: p.action,
          contentLength: p.content.length,
          metadata: p.metadata
        })) : null
        // Don't save files, voiceRecording, or full content
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to save workcenter state:", e);
    }
  }
  static loadWorkCenterState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentPrompt: parsed.currentPrompt || "",
          autoAction: parsed.autoAction || false,
          selectedInstruction: parsed.selectedInstruction || "",
          outputFormat: parsed.outputFormat || "auto",
          activeInputTab: parsed.activeInputTab || "prompt",
          activeResultsTab: parsed.activeResultsTab || "output",
          selectedLanguage: parsed.selectedLanguage || "auto",
          selectedTemplate: parsed.selectedTemplate || "",
          recognitionFormat: parsed.recognitionFormat || "auto",
          processingFormat: parsed.processingFormat || "markdown",
          currentProcessingStep: parsed.currentProcessingStep || 0
          // Don't restore full content, just metadata
        };
      }
    } catch (e) {
      console.warn("Failed to load workcenter state:", e);
    }
    return {};
  }
  static loadPromptTemplates() {
    const safeJsonParse = (raw, fallback) => {
      if (!raw) return fallback;
      try {
        const v = JSON.parse(raw);
        return v ?? fallback;
      } catch {
        return fallback;
      }
    };
    return safeJsonParse(localStorage.getItem(this.TEMPLATES_STORAGE_KEY), [
      { name: "Analyze & Extract", prompt: "Analyze the provided content and extract key information, formulas, data, and insights. Identify the main topics, recognize any mathematical expressions or equations, and provide a structured summary." },
      { name: "Solve Equations", prompt: "Find and solve any mathematical equations, problems, or calculations in the content. Show your work step-by-step and provide the final answers." },
      { name: "Generate Code", prompt: "Based on the description or requirements in the content, generate appropriate code. Include comments and explain the implementation." },
      { name: "Extract Styles", prompt: "Analyze the visual content or design description and extract/generate CSS styles, color schemes, and layout information." },
      { name: "Document Analysis", prompt: "Perform a comprehensive analysis of the document, including structure, key points, relationships, and actionable insights." },
      { name: "Data Processing", prompt: "Process and transform the provided data. Extract structured information, identify patterns, and present results in a clear format." }
    ]);
  }
  static savePromptTemplates(templates) {
    try {
      localStorage.setItem(this.TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.warn("Failed to save prompt templates:", e);
    }
  }
  static clearRecognizedData(state) {
    state.recognizedData = null;
    state.processedData = null;
    state.currentProcessingStep = 0;
  }
  static addProcessedStep(state, step) {
    if (!state.processedData) {
      state.processedData = [];
    }
    state.processedData.push(step);
    state.currentProcessingStep++;
  }
}

const WorkCenterState = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    WorkCenterStateManager
}, Symbol.toStringTag, { value: 'Module' }));

"use strict";
class WorkCenterUI {
  container = null;
  deps;
  attachments;
  prompts;
  results;
  history;
  constructor(dependencies, attachments, prompts, results, history) {
    this.deps = dependencies;
    this.attachments = attachments;
    this.prompts = prompts;
    this.results = results;
    this.history = history;
  }
  setContainer(container) {
    this.container = container;
    this.attachments.setContainer(container);
    this.prompts.setContainer(container);
    this.results.setContainer(container);
    this.history.setContainer(container);
  }
  getContainer() {
    return this.container;
  }
  renderWorkCenterView(state) {
    const container = H`<div class="workcenter-view">
      <div class="workcenter-header">
        <h2>AI Work Center</h2>
        <details class="header-controls-disclosure">
          <summary class="header-controls-summary">
            <span>AI Work Center</span>
          </summary>
          <div class="control-selectors">
          <div class="format-selector">
            <label>Output Format:</label>
            <select class="format-select">
              <option value="auto" ${state.outputFormat === "auto" ? "selected" : ""}>Auto</option>
              <option value="markdown" ${state.outputFormat === "markdown" ? "selected" : ""}>Markdown</option>
              <option value="json" ${state.outputFormat === "json" ? "selected" : ""}>JSON</option>
              <option value="code" ${state.outputFormat === "code" ? "selected" : ""}>Code</option>
              <option value="raw" ${state.outputFormat === "raw" ? "selected" : ""}>Raw Text</option>
              <option value="text" ${state.outputFormat === "text" ? "selected" : ""}>Plain Text</option>
              <option value="html" ${state.outputFormat === "html" ? "selected" : ""}>HTML</option>
            </select>
          </div>
          <div class="language-selector">
            <label>Language:</label>
            <select class="language-select">
              <option value="auto" ${state.selectedLanguage === "auto" ? "selected" : ""}>Auto</option>
              <option value="en" ${state.selectedLanguage === "en" ? "selected" : ""}>English</option>
              <option value="ru" ${state.selectedLanguage === "ru" ? "selected" : ""}>Русский</option>
            </select>
          </div>
          <div class="recognition-selector">
            <label>Recognize as:</label>
            <select class="recognition-select">
              <option value="auto" ${state.recognitionFormat === "auto" ? "selected" : ""}>Auto</option>
              <option value="most-suitable" ${state.recognitionFormat === "most-suitable" ? "selected" : ""}>Most Suitable</option>
              <option value="most-optimized" ${state.recognitionFormat === "most-optimized" ? "selected" : ""}>Most Optimized</option>
              <option value="most-legibility" ${state.recognitionFormat === "most-legibility" ? "selected" : ""}>Most Legible</option>
              <option value="markdown" ${state.recognitionFormat === "markdown" ? "selected" : ""}>Markdown</option>
              <option value="html" ${state.recognitionFormat === "html" ? "selected" : ""}>HTML</option>
              <option value="text" ${state.recognitionFormat === "text" ? "selected" : ""}>Plain Text</option>
              <option value="json" ${state.recognitionFormat === "json" ? "selected" : ""}>JSON</option>
            </select>
          </div>
          <div class="processing-selector">
            <label>Process as:</label>
            <select class="processing-select">
              <option value="markdown" ${state.processingFormat === "markdown" ? "selected" : ""}>Markdown</option>
              <option value="html" ${state.processingFormat === "html" ? "selected" : ""}>HTML</option>
              <option value="json" ${state.processingFormat === "json" ? "selected" : ""}>JSON</option>
              <option value="text" ${state.processingFormat === "text" ? "selected" : ""}>Plain Text</option>
              <option value="typescript" ${state.processingFormat === "typescript" ? "selected" : ""}>TypeScript</option>
              <option value="javascript" ${state.processingFormat === "javascript" ? "selected" : ""}>JavaScript</option>
              <option value="python" ${state.processingFormat === "python" ? "selected" : ""}>Python</option>
              <option value="java" ${state.processingFormat === "java" ? "selected" : ""}>Java</option>
              <option value="cpp" ${state.processingFormat === "cpp" ? "selected" : ""}>C++</option>
              <option value="csharp" ${state.processingFormat === "csharp" ? "selected" : ""}>C#</option>
              <option value="php" ${state.processingFormat === "php" ? "selected" : ""}>PHP</option>
              <option value="ruby" ${state.processingFormat === "ruby" ? "selected" : ""}>Ruby</option>
              <option value="go" ${state.processingFormat === "go" ? "selected" : ""}>Go</option>
              <option value="rust" ${state.processingFormat === "rust" ? "selected" : ""}>Rust</option>
              <option value="xml" ${state.processingFormat === "xml" ? "selected" : ""}>XML</option>
              <option value="yaml" ${state.processingFormat === "yaml" ? "selected" : ""}>YAML</option>
              <option value="css" ${state.processingFormat === "css" ? "selected" : ""}>CSS</option>
              <option value="scss" ${state.processingFormat === "scss" ? "selected" : ""}>SCSS</option>
            </select>
          </div>
          </div>
        </details>
      </div>

      <div class="workcenter-content">
        <div class="workcenter-layout">

          <!-- Results & Processing Section -->
          <div class="workcenter-block results-block">
            <div class="results-section">
              ${this.renderResultsTabs(state)}
            </div>
          </div>

          <!-- Input Prompts Section -->
          <div class="workcenter-block prompts-block">
            ${this.renderInputTabs(state)}
          </div>
        </div>
      </div>
    </div>`;
    this.container = container;
    this.attachments.setContainer(container);
    this.prompts.setContainer(container);
    this.results.setContainer(container);
    this.initializeUI(state);
    return container;
  }
  initializeUI(state) {
    this.attachments.setupDropZone(state);
    this.attachments.updateFileList(state);
    this.attachments.updateFileCounter(state);
    this.prompts.updatePromptFileCount(state);
    this.updateInputTabFileCount(state);
    this.updateResultsPipelineTabState(state);
    this.history.updateRecentHistory(state);
  }
  updateFileCounter(state) {
    this.attachments.updateFileCounter(state);
    this.prompts.updatePromptFileCount(state);
    this.updateInputTabFileCount(state);
  }
  updateFileList(state) {
    this.attachments.updateFileList(state);
    this.prompts.updatePromptFileCount(state);
    this.updateInputTabFileCount(state);
  }
  updatePromptInput(state) {
    this.prompts.updatePromptInput(state);
  }
  updateTemplateSelect(state) {
    this.prompts.updateTemplateSelect(state);
  }
  updateVoiceButton(state) {
    this.prompts.updateVoiceButton(state);
  }
  updateDataPipeline(state) {
    this.results.updateDataPipeline(state);
    this.updateResultsPipelineTabState(state);
  }
  updateDataCounters(state) {
    this.attachments.updateDataCounters(state);
  }
  showProcessingMessage(message) {
    this.results.showProcessingMessage(message);
  }
  showResult(state) {
    this.results.showResult(state);
  }
  showError(error) {
    this.results.showError(error);
  }
  clearResults() {
    this.results.clearResults();
  }
  revokeAllPreviewUrls(state) {
    this.attachments.revokeAllPreviewUrls(state);
  }
  renderInputTabs(state) {
    const activeTab = state.activeInputTab || "prompt";
    return `
            <div class="input-tabs-section" data-input-tabs data-active-tab="${activeTab}">
                <div class="wc-block-header">
                    <div class="input-tab-actions">
                        <button class="tab-btn ${activeTab === "prompt" ? "is-active" : ""}" data-action="switch-input-tab" data-tab="prompt" aria-selected="${activeTab === "prompt"}">Prompt</button>
                        <button class="tab-btn ${activeTab === "attachments" ? "is-active" : ""}" data-action="switch-input-tab" data-tab="attachments" aria-selected="${activeTab === "attachments"}">Files (${state.files.length})</button>
                    </div>
                    <h3>Work Inputs</h3>
                    <div></div>
                </div>
                <div class="input-tab-panels">
                    <section class="tab-panel ${activeTab === "prompt" ? "is-active" : ""}" data-tab-panel="prompt">
                        ${this.prompts.renderPromptPanel(state)}
                    </section>
                    <section class="tab-panel ${activeTab === "attachments" ? "is-active" : ""}" data-tab-panel="attachments">
                        ${this.attachments.renderAttachmentsSection(state)}
                    </section>
                </div>
            </div>
        `;
  }
  renderResultsTabs(state) {
    const hasPipelineData = Boolean(state.recognizedData || state.processedData && state.processedData.length > 0);
    const pipelineCount = (state.recognizedData ? 1 : 0) + (state.processedData?.length || 0);
    const activeTab = state.activeResultsTab === "pipeline" && !hasPipelineData ? "output" : state.activeResultsTab;
    return `
            <div class="results-tabs-section" data-results-tabs data-active-tab="${activeTab}">
                <div class="wc-block-header results-tabs-header">
                    <div class="results-tab-actions">
                        <button class="tab-btn ${activeTab === "output" ? "is-active" : ""}" data-action="switch-results-tab" data-tab="output" aria-selected="${activeTab === "output"}">Output</button>
                        <button class="tab-btn ${activeTab === "pipeline" ? "is-active" : ""}" data-action="switch-results-tab" data-tab="pipeline" aria-selected="${activeTab === "pipeline"}"${hasPipelineData ? "" : " disabled"}>Pipeline (${pipelineCount})</button>
                        <button class="tab-btn ${activeTab === "history" ? "is-active" : ""}" data-action="switch-results-tab" data-tab="history" aria-selected="${activeTab === "history"}">History</button>
                    </div>
                    <h3>Results & Processing</h3>
                    ${this.results.renderOutputHeader()}
                </div>
                <div class="results-tab-panels">
                    <section class="results-tab-panel ${activeTab === "output" ? "is-active" : ""}" data-results-tab-panel="output">
                        <div class="wc-output-section">
                            ${this.results.renderOutputContent()}
                        </div>
                    </section>
                    <section class="results-tab-panel ${activeTab === "pipeline" ? "is-active" : ""}" data-results-tab-panel="pipeline">
                        ${hasPipelineData ? this.results.renderDataPipeline(state) : '<div class="wc-results-empty">No data pipeline yet</div>'}
                    </section>
                    <section class="results-tab-panel ${activeTab === "history" ? "is-active" : ""}" data-results-tab-panel="history">
                        <div class="history-section">
                            <div class="history-header">
                                <h4>Recent Activity</h4>
                                <div class="result-actions">
                                    <button class="btn btn-icon" data-action="view-action-history" title="View Action History">
                                        <ui-icon icon="history" size="18" icon-style="duotone"></ui-icon>
                                        <span class="btn-text">History</span>
                                    </button>
                                    <button class="btn" data-action="view-full-history">View All History</button>
                                </div>
                            </div>
                            <div class="recent-history" data-recent-history></div>
                            <div class="action-stats" data-action-stats style="display: none;"></div>
                        </div>
                    </section>
                </div>
            </div>
        `;
  }
  updateInputTabFileCount(state) {
    if (!this.container) return;
    const filesTabBtn = this.container.querySelector('[data-action="switch-input-tab"][data-tab="attachments"]');
    if (filesTabBtn) {
      filesTabBtn.textContent = `Files (${state.files.length})`;
    }
  }
  updateResultsPipelineTabState(state) {
    if (!this.container) return;
    const hasPipelineData = Boolean(state.recognizedData || state.processedData && state.processedData.length > 0);
    const pipelineCount = (state.recognizedData ? 1 : 0) + (state.processedData?.length || 0);
    const tabsRoot = this.container.querySelector("[data-results-tabs]");
    const pipelineTabBtn = this.container.querySelector('[data-action="switch-results-tab"][data-tab="pipeline"]');
    if (!tabsRoot || !pipelineTabBtn) return;
    pipelineTabBtn.textContent = `Pipeline (${pipelineCount})`;
    pipelineTabBtn.disabled = !hasPipelineData;
    const activeTab = tabsRoot.getAttribute("data-active-tab") || "output";
    if (!hasPipelineData && activeTab === "pipeline") {
      tabsRoot.setAttribute("data-active-tab", "output");
      state.activeResultsTab = "output";
      const outputBtn = this.container.querySelector('[data-action="switch-results-tab"][data-tab="output"]');
      if (outputBtn) {
        outputBtn.classList.add("is-active");
        outputBtn.setAttribute("aria-selected", "true");
      }
      pipelineTabBtn.classList.remove("is-active");
      pipelineTabBtn.setAttribute("aria-selected", "false");
      const outputPanel = this.container.querySelector('[data-results-tab-panel="output"]');
      const pipelinePanel = this.container.querySelector('[data-results-tab-panel="pipeline"]');
      outputPanel?.classList.add("is-active");
      pipelinePanel?.classList.remove("is-active");
    }
  }
}

"use strict";
class WorkCenterFileOps {
  deps;
  constructor(dependencies) {
    this.deps = dependencies;
  }
  async handleDroppedContent(state, content, sourceType) {
    const currentHash = this.getCurrentHash();
    switch (currentHash) {
      case ROUTE_HASHES.SHARE_TARGET_TEXT:
        if (sourceType === "text" || sourceType === "html") {
          return this.handlePastedContent(state, content, sourceType);
        } else {
          this.deps.showMessage?.("This route only accepts text content. Please paste text or use the files route for file drops.");
          return;
        }
      case ROUTE_HASHES.SHARE_TARGET_IMAGE:
        if (this.isImageContent(content) || sourceType === "image") {
          return this.handleImageContent(state, content, sourceType);
        } else {
          this.deps.showMessage?.("This route only accepts image content. Please drop images or use other routes for different content types.");
          return;
        }
      case ROUTE_HASHES.SHARE_TARGET_FILES:
        return this.handlePastedContent(state, content, sourceType);
      case ROUTE_HASHES.SHARE_TARGET_URL:
        if (this.isValidUrl(content)) {
          return this.handlePastedContent(state, content, sourceType);
        } else {
          this.deps.showMessage?.("This route only accepts URLs. Please paste a valid URL.");
          return;
        }
      default:
        return this.handlePastedContent(state, content, sourceType);
    }
  }
  async handlePastedContent(state, content, sourceType) {
    const currentHash = this.getCurrentHash();
    try {
      switch (currentHash) {
        case ROUTE_HASHES.SHARE_TARGET_TEXT:
          if (sourceType === "text" || sourceType === "html") {
            await this.handleTextContent(state, content, sourceType);
          } else {
            this.deps.showMessage?.("This route only accepts text content");
          }
          break;
        case ROUTE_HASHES.SHARE_TARGET_URL:
          if (this.isValidUrl(content)) {
            await this.handleUrlContent(state, content);
          } else {
            this.deps.showMessage?.("This route only accepts valid URLs");
          }
          break;
        case ROUTE_HASHES.SHARE_TARGET_IMAGE:
          if (this.isImageContent(content) || this.isBase64Data(content)) {
            await this.handleImageContent(state, content, sourceType);
          } else {
            this.deps.showMessage?.("This route only accepts image content");
          }
          break;
        default:
          await this.handleDefaultPaste(state, content, sourceType);
          break;
      }
    } catch (error) {
      console.error("[WorkCenter] Failed to handle pasted content:", error);
      this.deps.showMessage?.("Failed to process pasted content");
    }
  }
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
  isBase64Data(content) {
    const raw = (content || "").trim();
    return !!parseDataUrl(raw) || isBase64Like(raw);
  }
  async handleBase64Content(state, content) {
    try {
      const asset = await normalizeDataAsset(content, {
        namePrefix: "pasted-data",
        uriComponent: true
      });
      state.files.push(asset.file);
      this.deps.showMessage?.("Encoded content decoded and added to work center");
    } catch (error) {
      console.error("[WorkCenter] Failed to decode base64 content:", error);
      const fallbackAsset = await normalizeDataAsset(content, {
        namePrefix: "pasted-text",
        mimeType: "text/plain;charset=utf-8"
      });
      state.files.push(fallbackAsset.file);
      this.deps.showMessage?.("Base64 content added as text to work center");
    }
  }
  addFilesFromInput(state, files) {
    const fileArray = Array.from(files);
    const currentHash = this.getCurrentHash();
    let filteredFiles = fileArray;
    switch (currentHash) {
      case ROUTE_HASHES.SHARE_TARGET_IMAGE:
        filteredFiles = fileArray.filter((file) => file.type.startsWith("image/"));
        if (filteredFiles.length === 0) {
          this.deps.showMessage?.("This route only accepts image files. Please drop images or use other routes for different file types.");
          return;
        }
        break;
      case ROUTE_HASHES.SHARE_TARGET_TEXT:
        filteredFiles = fileArray.filter(
          (file) => file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml" || file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".json") || file.name.toLowerCase().endsWith(".xml")
        );
        if (filteredFiles.length === 0) {
          this.deps.showMessage?.("This route only accepts text files. Please drop text files or use the files route for other file types.");
          return;
        }
        break;
      case ROUTE_HASHES.SHARE_TARGET_FILES:
        filteredFiles = fileArray;
        break;
      case ROUTE_HASHES.SHARE_TARGET_URL:
        this.deps.showMessage?.("This route only accepts URLs. Please paste a URL instead of dropping files.");
        return;
      default:
        filteredFiles = fileArray;
        break;
    }
    state.files.push(...filteredFiles);
    if (filteredFiles.length > 0) {
      const fileCount = filteredFiles.length;
      const fileWord = fileCount === 1 ? "file" : "files";
      this.deps.showMessage?.(`${fileCount} ${fileWord} added to work center`);
    }
  }
  removeFile(state, index) {
    if (index >= 0 && index < state.files.length) {
      return state.files.splice(index, 1)[0];
    }
    return null;
  }
  clearAllFiles(state) {
    const files = [...state.files];
    state.files.length = 0;
    return files;
  }
  getFilesForProcessing(state) {
    return [...state.files];
  }
  hasFiles(state) {
    return state.files.length > 0;
  }
  hasTextFiles(state) {
    return state.files.some(
      (f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt")
    );
  }
  determineRecognizedFormat(state) {
    const hasTextFile = this.hasTextFiles(state);
    if (!hasTextFile) {
      return "markdown";
    } else {
      return "markdown";
    }
  }
  validateFileForUpload(file) {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, reason: "File too large (max 50MB)" };
    }
    const allowedTypes = [
      "image/",
      "text/",
      "application/pdf",
      "application/json",
      "application/markdown",
      "application/xml"
    ];
    const isAllowed = allowedTypes.some(
      (type) => file.type.startsWith(type) || file.name.toLowerCase().endsWith(type.replace("application/", "."))
    );
    if (!isAllowed) {
      return { valid: false, reason: "File type not supported" };
    }
    return { valid: true };
  }
  // ============================================================================
  // HASH-AWARE CONTENT HANDLING METHODS
  // ============================================================================
  getCurrentHash() {
    return typeof globalThis !== "undefined" ? globalThis?.location?.hash : "";
  }
  async handleTextContent(state, content, sourceType) {
    const asset = await normalizeDataAsset(content, {
      namePrefix: sourceType === "html" ? "shared-html" : "shared-text",
      mimeType: sourceType === "html" ? "text/html" : "text/plain;charset=utf-8"
    });
    state.files.push(asset.file);
    this.deps.showMessage?.("Text content added to work center");
  }
  async handleUrlContent(state, content) {
    const asset = await normalizeDataAsset(content, {
      namePrefix: "shared-url",
      uriComponent: true
    });
    state.files.push(asset.file);
    this.deps.showMessage?.("URL added to work center");
  }
  async handleImageContent(state, content, sourceType) {
    if (this.isBase64Data(content)) {
      await this.handleBase64Content(state, content);
    } else {
      const asset = await normalizeDataAsset(content, {
        namePrefix: "shared-image",
        mimeType: sourceType === "image" ? "image/png" : "text/plain;charset=utf-8",
        uriComponent: true
      });
      state.files.push(asset.file);
      this.deps.showMessage?.("Image content added to work center");
    }
  }
  async handleDefaultPaste(state, content, sourceType) {
    if (this.isValidUrl(content)) {
      const asset = await normalizeDataAsset(content, {
        namePrefix: "pasted-url",
        uriComponent: true
      });
      state.files.push(asset.file);
      this.deps.showMessage?.("URL added to work center");
    } else if (this.isBase64Data(content)) {
      await this.handleBase64Content(state, content);
    } else {
      const asset = await normalizeDataAsset(content, {
        namePrefix: `pasted-${sourceType || "text"}`,
        mimeType: sourceType === "html" ? "text/html" : "text/plain;charset=utf-8"
      });
      state.files.push(asset.file);
      this.deps.showMessage?.(`${sourceType === "html" ? "HTML" : "Text"} content added to work center`);
    }
  }
  isImageContent(content) {
    return content.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(content);
  }
}

"use strict";
class AppCommunicator {
  destination;
  constructor(options) {
    this.destination = this.mapChannelToDestination(options.channelName);
  }
  mapChannelToDestination(channelName) {
    const mapping = {
      [BROADCAST_CHANNELS.WORK_CENTER]: "workcenter",
      [BROADCAST_CHANNELS.MARKDOWN_VIEWER]: "markdown-viewer",
      [BROADCAST_CHANNELS.SETTINGS]: "settings",
      [BROADCAST_CHANNELS.CLIPBOARD]: "clipboard",
      [BROADCAST_CHANNELS.PRINT_VIEWER]: "print-viewer"
    };
    return mapping[channelName] ?? "general";
  }
  /**
   * @deprecated Use unifiedMessaging.sendMessage() instead
   */
  async sendMessage(type, data, options = {}) {
    console.warn("[AppCommunicator] Deprecated: Use unifiedMessaging.sendMessage() instead");
    const message = {
      type,
      source: "legacy-app-communicator",
      destination: this.destination,
      data,
      metadata: {
        priority: options.priority ?? "normal",
        maxRetries: options.maxRetries ?? 3,
        legacy: true
      }
    };
    return unifiedMessaging.sendMessage(message);
  }
  /**
   * @deprecated Use unifiedMessaging.registerHandler() instead
   */
  respondToPing(pingId) {
    console.warn("[AppCommunicator] Deprecated: Ping/pong handled automatically by unified messaging");
    unifiedMessaging.sendMessage({
      type: "pong",
      source: this.destination,
      destination: "ping-requester",
      data: { pingId },
      metadata: { legacy: true }
    });
  }
  /**
   * @deprecated Cleanup handled automatically by unified messaging
   */
  destroy() {
    console.warn("[AppCommunicator] Deprecated: Cleanup handled automatically by unified messaging");
  }
}
const APP_CHANNELS = {
  WORK_CENTER: BROADCAST_CHANNELS.WORK_CENTER,
  MARKDOWN_VIEWER: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
  SETTINGS: BROADCAST_CHANNELS.SETTINGS,
  GENERAL: BROADCAST_CHANNELS.GENERAL
};
const communicators = /* @__PURE__ */ new Map();
function getAppCommunicator(channelName = APP_CHANNELS.GENERAL, options) {
  console.warn("[getAppCommunicator] Deprecated: Use unifiedMessaging directly instead");
  const key = channelName;
  if (!communicators.has(key)) {
    communicators.set(key, new AppCommunicator({
      channelName,
      ...options
    }));
  }
  return communicators.get(key);
}
function getWorkCenterComm() {
  console.warn('[getWorkCenterComm] Deprecated: Use unifiedMessaging.sendMessage() with destination "workcenter" instead');
  return getAppCommunicator(APP_CHANNELS.WORK_CENTER);
}
function getMarkdownViewerComm() {
  console.warn("[getMarkdownViewerComm] Deprecated: Use unifiedMessaging for markdown viewer messaging instead");
  return getAppCommunicator(APP_CHANNELS.MARKDOWN_VIEWER, {
    availabilityCheckInterval: 3e3,
    retryInterval: 15e3
  });
}
function getSettingsComm() {
  console.warn("[getSettingsComm] Deprecated: Use unifiedMessaging for settings messaging instead");
  return getAppCommunicator(APP_CHANNELS.SETTINGS, {
    availabilityCheckInterval: 5e3,
    retryInterval: 6e4
  });
}

"use strict";
class WorkCenterShareTarget {
  deps;
  _fileOps;
  workCenterComm = getWorkCenterComm();
  constructor(dependencies, fileOps) {
    this.deps = dependencies;
    this._fileOps = fileOps;
    void this._fileOps;
  }
  initShareTargetListener(_state) {
    console.log("[WorkCenter] Share target result listener initialized via WorkCenterComm");
  }
  async processQueuedMessages(_state) {
    try {
      console.log("[WorkCenter] Queued message processing handled by WorkCenterComm");
    } catch (error) {
      console.error("[WorkCenter] Failed to process queued messages:", error);
    }
  }
  handleShareTargetMessage(state, event) {
    const { type, data, pingId } = event.data || {};
    if (type === "ping" && pingId) {
      this.workCenterComm.respondToPing(pingId);
    } else if (type === "share-target-result" && data) {
      console.log("[WorkCenter] Received share target result:", data);
      this.addShareTargetResult(state, data);
    } else if (type === "share-target-input" && data) {
      console.log("[WorkCenter] Received share target input:", data);
      this.addShareTargetInput(state, data);
    } else if (type === "ai-result" && data) {
      console.log("[WorkCenter] Received AI processing result:", data);
      this.handleAIResult(state, data);
    } else if (type === "content-cached" && data) {
      console.log("[WorkCenter] Received cached content from SW:", data);
      this.handleCachedContent(state, data);
    } else if (type === "content-received" && data) {
      console.log("[WorkCenter] Received content from SW:", data);
      this.handleReceivedContent(state, data);
    }
  }
  async addShareTargetResult(state, resultData) {
    const processedEntry = {
      content: resultData.content || "",
      timestamp: resultData.timestamp || Date.now(),
      action: resultData.action || "Share Target Processing",
      sourceData: resultData.rawData,
      metadata: {
        source: resultData.source || "share-target",
        ...resultData.metadata
      }
    };
    const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
    WorkCenterStateManager.addProcessedStep(state, processedEntry);
    state.lastRawResult = resultData.rawData ?? resultData.content ?? null;
    WorkCenterStateManager.saveState(state);
    this.deps.showMessage?.(`Share target result added to work center`);
    this.deps.render?.();
  }
  async addShareTargetInput(state, inputData) {
    console.log("[WorkCenter] Adding share target input:", inputData);
    try {
      let filesAdded = 0;
      let textAdded = false;
      if (inputData.files && Array.isArray(inputData.files)) {
        for (const file of inputData.files) {
          if (file instanceof File) {
            state.files.push(file);
            filesAdded++;
          }
        }
      }
      if (inputData.text && typeof inputData.text === "string" && inputData.text.trim()) {
        const textBlob = new Blob([inputData.text], { type: "text/plain" });
        const textFile = new File([textBlob], "shared-text.txt", { type: "text/plain" });
        state.files.push(textFile);
        filesAdded++;
        textAdded = true;
      }
      if (inputData.url && typeof inputData.url === "string") {
        const urlBlob = new Blob([inputData.url], { type: "text/plain" });
        const urlFile = new File([urlBlob], "shared-url.txt", { type: "text/plain" });
        state.files.push(urlFile);
        filesAdded++;
      }
      if (inputData.base64Data && typeof inputData.base64Data === "string") {
        try {
          const asset = await normalizeDataAsset(inputData.base64Data, {
            namePrefix: "shared",
            uriComponent: true
          });
          state.files.push(asset.file);
          filesAdded++;
        } catch (error) {
          console.warn("[WorkCenter] Failed to decode base64 data:", error);
        }
      }
      const { WorkCenterStateManager: StateManager } = await __vitePreload(async () => { const { WorkCenterStateManager: StateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager: StateManager }},true              ?void 0:void 0,import.meta.url);
      StateManager.clearRecognizedData(state);
      StateManager.saveState(state);
      if (filesAdded > 0 || textAdded) {
        this.deps.onFilesChanged?.();
      }
      let message = "";
      if (filesAdded > 0) {
        message += `${filesAdded} file(s) added to work center`;
      }
      if (textAdded) {
        message += (message ? " and " : "") + "text content added";
      }
      if (message) {
        this.deps.showMessage?.(message);
      }
      if (filesAdded > 0 || textAdded) {
        this.deps.render?.();
      }
    } catch (error) {
      console.error("[WorkCenter] Failed to add share target input:", error);
      this.deps.showMessage?.("Failed to add share target input");
    }
  }
  sendShareTargetResult(resultData) {
    try {
      this.workCenterComm.sendMessage("share-target-result", resultData, { priority: "high" });
    } catch (error) {
      console.error("[WorkCenter] Failed to send share target result:", error);
    }
  }
  sendShareTargetInput(inputData) {
    try {
      this.workCenterComm.sendMessage("share-target-input", inputData, { priority: "high" });
    } catch (error) {
      console.error("[WorkCenter] Failed to send share target input:", error);
    }
  }
  async handleCachedContent(state, data) {
    const { cacheKey, context, content } = data;
    if (context === "share-target" && content) {
      console.log("[WorkCenter] Processing cached share-target content:", content);
      await this.addShareTargetInput(state, content);
      await this.retrieveCachedFiles(state, cacheKey);
    }
  }
  async handleReceivedContent(state, data) {
    const { content, context } = data;
    if (context === "share-target" && content) {
      console.log("[WorkCenter] Processing received share-target content:", content);
      await this.addShareTargetInput(state, content);
    }
  }
  async handleAIResult(state, resultData) {
    const { success, data, error } = resultData;
    if (!success) {
      console.warn("[WorkCenter] AI processing failed:", error);
      this.deps.showMessage?.("AI processing failed: " + (error || "Unknown error"));
      return;
    }
    if (!data) {
      console.warn("[WorkCenter] No data in AI result");
      return;
    }
    console.log("[WorkCenter] Adding AI processing result to work center");
    try {
      const processedEntry = {
        content: typeof data === "string" ? data : JSON.stringify(data, null, 2),
        timestamp: Date.now(),
        action: "AI Processing (Share Target)",
        sourceData: { aiResult: data, source: "share-target" },
        metadata: {
          source: "share-target-ai",
          processingType: "ai",
          resultType: typeof data
        }
      };
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.addProcessedStep(state, processedEntry);
      state.lastRawResult = data;
      WorkCenterStateManager.saveState(state);
      this.deps.render?.();
      this.deps.showMessage?.("AI processing result added to work center");
      if (this.deps.render) {
        this.deps.render();
      }
    } catch (error2) {
      console.error("[WorkCenter] Failed to add AI result:", error2);
      this.deps.showMessage?.("Failed to add AI processing result");
    }
  }
  async retrieveCachedFiles(state, cacheKey) {
    try {
      const files = await fetchCachedShareFiles(cacheKey || "latest");
      if (files.length > 0) {
        for (const file of files) {
          console.log("[WorkCenter] Adding cached file:", file.name);
          state.files.push(file);
        }
        this.deps.onFilesChanged?.();
        this.deps.showMessage?.(`Added ${files.length} cached file(s) from share-target`);
      }
    } catch (error) {
      console.warn("[WorkCenter] Failed to retrieve cached files:", error);
    }
  }
}

"use strict";
class WorkCenterTemplates {
  deps;
  /** Cached custom instructions from settings */
  cachedInstructions = [];
  cachedActiveInstructionId = "";
  constructor(dependencies) {
    this.deps = dependencies;
  }
  // ────────────────────────────────────────
  // Custom Instructions (from settings)
  // ────────────────────────────────────────
  /** Load custom instructions from app settings */
  async loadInstructions() {
    try {
      const snapshot = await getInstructionRegistry();
      this.cachedInstructions = snapshot.instructions;
      this.cachedActiveInstructionId = snapshot.activeId;
      return this.cachedInstructions;
    } catch (e) {
      console.warn("[WorkCenterTemplates] Failed to load custom instructions:", e);
      return [];
    }
  }
  /** Get cached instructions (sync, call loadInstructions first) */
  getInstructions() {
    return this.cachedInstructions;
  }
  /** Get cached active instruction id from settings */
  getActiveInstructionId() {
    return this.cachedActiveInstructionId;
  }
  /** Get the currently active instruction from settings */
  async getActiveInstruction() {
    if (this.cachedActiveInstructionId) {
      const cached = this.getInstructionById(this.cachedActiveInstructionId);
      if (cached) return cached;
    }
    const snapshot = await getInstructionRegistry();
    this.cachedInstructions = snapshot.instructions;
    this.cachedActiveInstructionId = snapshot.activeId;
    return snapshot.activeInstruction;
  }
  /** Set a specific instruction as active in settings */
  async setActiveInstruction(id) {
    await setActiveInstruction(id);
    this.cachedActiveInstructionId = id || "";
  }
  /** Build a combined prompt with the selected custom instruction */
  buildPromptWithInstruction(basePrompt, instruction) {
    if (!instruction?.instruction) return basePrompt;
    return buildInstructionPrompt(basePrompt, instruction.instruction);
  }
  /** Get a specific instruction by ID */
  getInstructionById(id) {
    return this.cachedInstructions.find((i) => i.id === id);
  }
  /** Resolve selected instruction, fallback to active settings instruction */
  resolveInstruction(selectedId) {
    if (selectedId) {
      const selected = this.getInstructionById(selectedId);
      if (selected) return selected;
    }
    if (!this.cachedActiveInstructionId) return null;
    return this.getInstructionById(this.cachedActiveInstructionId) || null;
  }
  /** Get default instruction templates (for seeding) */
  getDefaultTemplates() {
    return DEFAULT_INSTRUCTION_TEMPLATES;
  }
  renderInstructionPanel(state) {
    return `
            <div class="instruction-panel">
              <div class="instruction-selector-row wide">
                <label class="instruction-label">
                  <ui-icon icon="clipboard-text" size="16" icon-style="duotone"></ui-icon>
                  <span>Instruction:</span>
                </label>
                <select class="instruction-select" data-action="select-instruction">
                  <option value="">None (default)</option>
                </select>
                <button class="btn btn-icon btn-sm" data-action="refresh-instructions" title="Refresh from Settings">
                  <ui-icon icon="arrows-clockwise" size="14" icon-style="duotone"></ui-icon>
                </button>
              </div>
              <div class="instruction-help">
                Active instruction from Settings is appended to your prompt.
              </div>
            </div>
        `;
  }
  // ────────────────────────────────────────
  // Prompt Templates (WorkCenter-local)
  // ────────────────────────────────────────
  showTemplateEditor(state, container) {
    const modal = H`<div class="template-editor-modal">
      <div class="modal-content">
        <div class="modal-header">
            <h3>Prompt Templates</h3>
            <p class="modal-desc">Manage prompt templates used in Work Center. These define what action to perform on the content.</p>
        </div>
        ${this.renderInstructionPanel(state)}
        <div class="template-list">
          ${state.promptTemplates.map(
      (template, index) => H`<div class="template-item" data-index="${index}">
              <div class="template-item-header">
                <input type="text" class="template-name" value="${template.name}" data-index="${index}" placeholder="Template name...">
                <button class="btn small btn-danger remove-template" data-index="${index}" title="Remove template">
                  <ui-icon icon="trash" size="14"></ui-icon>
                </button>
              </div>
              <textarea class="template-prompt" data-index="${index}" rows="3" placeholder="Enter prompt template...">${template.prompt}</textarea>
            </div>`
    )}
        </div>
        <div class="modal-actions">
          <div class="modal-actions-group modal-actions-group-start">
            <button class="btn" data-action="add-template">
              <ui-icon icon="plus" size="14"></ui-icon>
              <span>Add Template</span>
            </button>
            <button class="btn" data-action="import-instructions" title="Import from Custom Instructions (Settings)">
              <ui-icon icon="download" size="14"></ui-icon>
              <span>Import from Settings</span>
            </button>
          </div>
          <div class="modal-actions-group modal-actions-group-end">
            <button class="btn primary" data-action="save-templates">Save</button>
            <button class="btn" data-action="close-editor">Close</button>
          </div>
        </div>
      </div>
    </div>`;
    modal.addEventListener("click", async (e) => {
      const target = e.target;
      const action = target.closest("[data-action]")?.getAttribute("data-action");
      const index = target.closest("[data-index]")?.getAttribute("data-index");
      if (action === "add-template") {
        this.addTemplate(state);
        modal.remove();
        this.showTemplateEditor(state, container);
      } else if (action === "save-templates") {
        await this.saveTemplates(state, modal);
        modal.remove();
        this.deps.render?.();
      } else if (action === "close-editor") {
        modal.remove();
      } else if (action === "import-instructions") {
        await this.importFromCustomInstructions(state);
        modal.remove();
        this.showTemplateEditor(state, container);
      } else if (target.classList.contains("remove-template") && index) {
        this.removeTemplate(state, parseInt(index));
        modal.remove();
        this.showTemplateEditor(state, container);
      }
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    container.append(modal);
  }
  addTemplate(state) {
    state.promptTemplates.push({ name: "New Template", prompt: "Enter your prompt here..." });
  }
  removeTemplate(state, index) {
    if (index >= 0 && index < state.promptTemplates.length) {
      state.promptTemplates.splice(index, 1);
    }
  }
  async saveTemplates(state, modal) {
    const nameInputs = modal.querySelectorAll(".template-name");
    const promptInputs = modal.querySelectorAll(".template-prompt");
    state.promptTemplates = Array.from(nameInputs).map((input, i) => ({
      name: input.value,
      prompt: promptInputs[i].value
    }));
    const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
    WorkCenterStateManager.savePromptTemplates(state.promptTemplates);
    this.deps.showMessage?.("Templates saved");
  }
  /**
   * Import custom instructions from app settings as prompt templates.
   * Maps each CustomInstruction into the WorkCenter template format.
   */
  async importFromCustomInstructions(state) {
    try {
      const instructions = await getCustomInstructions();
      if (!instructions.length) {
        this.deps.showMessage?.("No custom instructions found in Settings");
        return;
      }
      const existingNames = new Set(state.promptTemplates.map((t) => t.name));
      let added = 0;
      for (const instr of instructions) {
        if (!existingNames.has(instr.label)) {
          state.promptTemplates.push({
            name: instr.label,
            prompt: instr.instruction
          });
          added++;
        }
      }
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.savePromptTemplates(state.promptTemplates);
      if (added > 0) {
        this.deps.showMessage?.(`Imported ${added} instruction${added > 1 ? "s" : ""} as templates`);
      } else {
        this.deps.showMessage?.("All instructions already exist as templates");
      }
    } catch (e) {
      console.warn("[WorkCenterTemplates] Failed to import instructions:", e);
      this.deps.showMessage?.("Failed to import instructions");
    }
  }
  selectTemplate(state, prompt) {
    state.selectedTemplate = prompt;
    if (prompt) {
      state.currentPrompt = prompt;
    }
  }
  getTemplateByPrompt(state, prompt) {
    return state.promptTemplates.find((t) => t.prompt === prompt);
  }
  hasTemplate(state, prompt) {
    return state.promptTemplates.some((t) => t.prompt === prompt);
  }
}

"use strict";
class WorkCenterVoice {
  deps;
  voiceTimeout = null;
  constructor(dependencies) {
    this.deps = dependencies;
  }
  async startVoiceRecording(state) {
    if (state.voiceRecording) return;
    state.voiceRecording = true;
    try {
      const prompt = await this.deps.getSpeechPrompt();
      if (prompt) {
        state.currentPrompt = prompt;
      }
    } catch (e) {
      console.warn("Voice recording failed:", e);
      this.deps.showMessage?.("Voice recording failed");
    } finally {
      state.voiceRecording = false;
    }
  }
  stopVoiceRecording(state) {
    state.voiceRecording = false;
    if (this.voiceTimeout) {
      globalThis?.clearTimeout?.(this.voiceTimeout);
      this.voiceTimeout = null;
    }
  }
  isRecording(state) {
    return state.voiceRecording;
  }
  setVoiceTimeout(callback, delay = 3e4) {
    if (this.voiceTimeout) {
      globalThis?.clearTimeout?.(this.voiceTimeout);
    }
    this.voiceTimeout = globalThis?.setTimeout?.(() => {
      callback();
      this.voiceTimeout = null;
    }, delay);
  }
  clearVoiceTimeout() {
    if (this.voiceTimeout) {
      globalThis?.clearTimeout?.(this.voiceTimeout);
      this.voiceTimeout = null;
    }
  }
}

"use strict";
class WorkCenterActions {
  deps;
  ui;
  fileOps;
  dataProcessing;
  results;
  history;
  templates;
  constructor(dependencies, ui, fileOps, dataProcessing, results, history, templates) {
    this.deps = dependencies;
    this.ui = ui;
    this.fileOps = fileOps;
    this.dataProcessing = dataProcessing;
    this.results = results;
    this.history = history;
    this.templates = templates;
  }
  async executeUnifiedAction(state) {
    if (this.fileOps.getFilesForProcessing(state).length === 0 && !state.currentPrompt.trim() && !state.recognizedData) {
      this.deps.showMessage("Please select files or enter a prompt first");
      return;
    }
    let processingMessage = "Processing...";
    if (state.recognizedData) {
      processingMessage = `Processing ${state.recognizedData.source} content...`;
    } else if (this.fileOps.hasFiles(state)) {
      processingMessage = `Processing ${state.files.length} file${state.files.length > 1 ? "s" : ""}...`;
    }
    this.results.showProcessingMessage(processingMessage);
    try {
      let basePrompt = state.currentPrompt.trim() || (state.autoAction ? this.getLastSuccessfulPrompt() : "Analyze and process the provided content intelligently");
      if (this.templates) {
        let instruction = this.templates.resolveInstruction(state.selectedInstruction);
        if (!instruction && !state.selectedInstruction) {
          instruction = await this.templates.getActiveInstruction();
        }
        if (instruction?.instruction) {
          if (!state.selectedInstruction) {
            state.selectedInstruction = instruction.id;
          }
          basePrompt = this.templates.buildPromptWithInstruction(basePrompt, instruction);
        }
      }
      const actionInput = {
        type: state.recognizedData ? "text" : this.fileOps.hasFiles(state) ? "files" : "text",
        files: this.fileOps.hasFiles(state) ? [...state.files] : void 0,
        text: basePrompt,
        recognizedData: state.recognizedData || void 0,
        // Keep legacy field for backward compatibility
        recognizedContent: state.recognizedData?.content || void 0
      };
      const isTranslateTemplate = state.selectedTemplate && state.selectedTemplate.includes("Translate the following content to the selected language");
      if (isTranslateTemplate && state.selectedLanguage !== "auto") {
        const targetLanguage = state.selectedLanguage === "ru" ? "Russian" : "English";
        actionInput.text = `Translate the following content to ${targetLanguage}. Maintain the original formatting and structure where possible. If the content is already in ${targetLanguage}, provide a natural rephrasing or improvement instead.`;
      } else {
        if (state.selectedLanguage !== "auto") {
          const languageInstruction = state.selectedLanguage === "ru" ? "Please respond in Russian language." : "Please respond in English language.";
          actionInput.text = `${languageInstruction} ${actionInput.text}`;
        }
      }
      const context = {
        source: "workcenter",
        sessionId: this.generateSessionId()
      };
      let forceAction;
      const hasUserInstruction = state.currentPrompt.trim() && state.currentPrompt.trim() !== "Analyze and process the provided content intelligently";
      if (hasUserInstruction) {
        forceAction = void 0;
      } else if (state.recognizedData) {
        forceAction = "analyze";
      } else if (this.fileOps.hasFiles(state)) {
        const hasTextFiles = this.fileOps.hasTextFiles(state);
        if (hasTextFiles) {
          forceAction = "source";
        } else {
          forceAction = "recognize";
        }
      } else {
        forceAction = "analyze";
      }
      const result = await executionCore.execute(actionInput, context, {
        forceAction,
        recognitionFormat: state.recognitionFormat,
        processingFormat: state.processingFormat
      });
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(state);
      state.lastRawResult = result.rawData;
      const formattedResult = this.dataProcessing.formatResult(result.rawData || result, state.outputFormat);
      const outputContent = this.ui.getContainer()?.querySelector("[data-output]");
      if (outputContent) {
        outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
      }
      if (this.fileOps.hasFiles(state) && result.rawData?.ok && !state.recognizedData) {
        const isTextFile = this.fileOps.hasTextFiles(state);
        state.recognizedData = {
          content: result.content,
          timestamp: Date.now(),
          source: isTextFile ? "text" : "files",
          recognizedAs: this.fileOps.determineRecognizedFormat(state),
          metadata: {
            fileCount: state.files.length
          },
          responseId: result.responseId || "unknown"
        };
        this.results.updateDataPipeline(state);
        this.ui.updateDataCounters(state);
        if (state.selectedTemplate && state.selectedTemplate.trim()) {
          console.log("[WorkCenter] Auto-processing with template:", state.selectedTemplate);
          setTimeout(async () => {
            await this.executeUnifiedAction(state);
          }, 100);
        }
      } else if (state.recognizedData && result.rawData?.ok) {
        const processedEntry = {
          content: result.content,
          timestamp: Date.now(),
          action: state.currentPrompt.trim() || "additional processing",
          sourceData: state.recognizedData,
          metadata: { step: state.currentProcessingStep + 1 }
        };
        const { WorkCenterStateManager: StateManager } = await __vitePreload(async () => { const { WorkCenterStateManager: StateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager: StateManager }},true              ?void 0:void 0,import.meta.url);
        StateManager.addProcessedStep(state, processedEntry);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.showError(errorMsg);
    }
    this.history.updateRecentHistory(state);
    this.ui.updateDataPipeline(state);
    this.ui.updateDataCounters(state);
  }
  getLastSuccessfulPrompt() {
    return this.history.getLastSuccessfulPrompt();
  }
  generateSessionId() {
    return `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async copyResults(state) {
    if (!state.lastRawResult) return;
    try {
      await this.dataProcessing.copyResultsToClipboard(state.lastRawResult, state.outputFormat);
      this.deps.showMessage("Results copied to clipboard");
    } catch (error) {
      console.error("Failed to copy results:", error);
      this.deps.showMessage("Failed to copy results");
    }
  }
  async viewResultsInViewer(state) {
    if (!state.lastRawResult) {
      this.deps.showMessage("No results to view");
      return;
    }
    try {
      const { unifiedMessaging } = await __vitePreload(async () => { const { unifiedMessaging } = await import('./UnifiedMessaging.js').then(n => n.UnifiedMessaging);return { unifiedMessaging }},true              ?[]:void 0,import.meta.url);
      let resultContent = typeof state.lastRawResult === "string" ? state.lastRawResult : JSON.stringify(state.lastRawResult, null, 2);
      try {
        resultContent = JSON.parse(resultContent)?.data || resultContent;
      } catch (error) {
      }
      await unifiedMessaging.sendMessage({
        id: crypto.randomUUID(),
        type: "content-view",
        source: "workcenter",
        destination: "viewer",
        contentType: state.outputFormat === "markdown" ? "markdown" : "text",
        data: {
          text: resultContent,
          filename: `workcenter-output-${Date.now()}.${state.outputFormat === "markdown" ? "md" : state.outputFormat === "json" ? "json" : state.outputFormat === "html" ? "html" : state.outputFormat === "code" ? "ts" : "txt"}`
        },
        metadata: {
          title: "Work Center Output",
          timestamp: Date.now(),
          source: "workcenter",
          format: state.outputFormat
        }
      });
    } catch (error) {
      console.error("Failed to open output in viewer:", error);
      this.deps.showMessage("Failed to open output in viewer");
    }
  }
  clearResults(state) {
    state.lastRawResult = null;
    this.results.clearResults();
  }
  async saveResultsToExplorer(state) {
    if (!state.lastRawResult) {
      this.deps.showMessage("No results to save");
      return;
    }
    try {
      const { unifiedMessaging } = await __vitePreload(async () => { const { unifiedMessaging } = await import('./UnifiedMessaging.js').then(n => n.UnifiedMessaging);return { unifiedMessaging }},true              ?[]:void 0,import.meta.url);
      const resultContent = typeof state.lastRawResult === "string" ? state.lastRawResult : JSON.stringify(state.lastRawResult, null, 2);
      await unifiedMessaging.sendMessage({
        id: crypto.randomUUID(),
        type: "content-save",
        source: "workcenter",
        destination: "explorer",
        data: {
          action: "save",
          text: resultContent,
          filename: `workcenter-result-${Date.now()}.${state.outputFormat === "json" ? "json" : state.outputFormat === "html" ? "html" : state.outputFormat === "code" ? "ts" : "txt"}`,
          path: "/workcenter-results/"
        },
        metadata: {
          title: "Work Center Result",
          timestamp: Date.now(),
          source: "workcenter",
          format: state.outputFormat
        }
      });
      this.deps.showMessage("Results saved to Explorer");
    } catch (error) {
      console.error("Failed to save results to explorer:", error);
      this.deps.showMessage("Failed to save results to Explorer");
    }
  }
}

"use strict";
class WorkCenterDataProcessing {
  formatResult(result, format, outputFormat) {
    if (format === "auto") {
      const rawData = result?.rawData || result;
      let data = extractJSONFromAIResponse(rawData)?.data || rawData;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object") {
            data = parsed;
          }
        } catch {
        }
      }
      if (data && typeof data === "object" && (data.recognized_data || data.verbose_data || data.keywords_and_tags || data.suggested_type)) {
        const content = [];
        if (data.recognized_data) {
          const recognized = Array.isArray(data.recognized_data) ? data.recognized_data : [data.recognized_data];
          content.push(...recognized.map((item) => String(item)));
        }
        if (data.verbose_data) {
          content.push(String(data.verbose_data));
        }
        if (data.keywords_and_tags && Array.isArray(data.keywords_and_tags) && data.keywords_and_tags.length > 0) {
          content.push(`
**Keywords:** ${data.keywords_and_tags.join(", ")}`);
        }
        if (data.confidence || data.suggested_type) {
          const info = [];
          if (data.confidence) info.push(`Confidence: ${Math.round(data.confidence * 100)}%`);
          if (data.suggested_type) info.push(`Type: ${data.suggested_type}`);
          if (info.length > 0) {
            content.push(`
*${info.join(" • ")}*`);
          }
        }
        if (content.length > 0) {
          const htmlContent = content.join("\n\n");
          return `<div class="markdown-result structured-content">${htmlContent}</div>`;
        }
      }
      if (data && typeof data === "object") {
        return this.formatResult(result, "json");
      }
      return this.formatResult(result, "markdown");
    }
    if (format === "json") {
      const rawData = result?.rawData || result;
      let data = extractJSONFromAIResponse(rawData)?.data || rawData;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object") {
            data = parsed;
          }
        } catch {
        }
      }
      return this.renderAsJSON(data);
    }
    if (format === "markdown") {
      const rawData = result?.rawData || result;
      let data = extractJSONFromAIResponse(rawData)?.data || rawData;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object") {
            data = parsed;
          }
        } catch {
        }
      }
      if (data && typeof data === "object" && (data.recognized_data || data.verbose_data || data.keywords_and_tags || data.suggested_type)) {
        const content = [];
        if (data.recognized_data) {
          const recognized = Array.isArray(data.recognized_data) ? data.recognized_data : [data.recognized_data];
          content.push(...recognized.map((item) => String(item)));
        }
        if (data.verbose_data) {
          content.push(String(data.verbose_data));
        }
        if (data.keywords_and_tags && Array.isArray(data.keywords_and_tags) && data.keywords_and_tags.length > 0) {
          content.push(`
**Keywords:** ${data.keywords_and_tags.join(", ")}`);
        }
        if (data.confidence || data.suggested_type) {
          const info = [];
          if (data.confidence) info.push(`Confidence: ${Math.round(data.confidence * 100)}%`);
          if (data.suggested_type) info.push(`Type: ${data.suggested_type}`);
          if (info.length > 0) {
            content.push(`
*${info.join(" • ")}*`);
          }
        }
        if (content.length > 0) {
          const htmlContent = content.join("\n\n");
          return `<div class="markdown-result structured-content">${htmlContent}</div>`;
        }
      }
    }
    const normalizedData = this.normalizeResultData(result);
    if (!normalizedData) return '<div class="no-result">No result</div>';
    switch (format) {
      case "code":
        return this.renderAsCode(normalizedData);
      case "raw":
        return this.renderAsRaw(result?.rawData || result);
      case "html":
        return this.renderAsHTML(normalizedData);
      case "text":
        return this.renderAsText(normalizedData);
      case "markdown":
      default:
        return this.renderAsMarkdown(normalizedData);
    }
  }
  normalizeResultData(result) {
    if (!result) return null;
    let data = extractJSONFromAIResponse(result)?.data || result;
    if (data && typeof data === "object") {
      if (data.data !== void 0) {
        data = data.data;
      }
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object") {
            data = parsed;
          }
        } catch {
        }
      }
    }
    if (typeof data !== "object" || data === null) {
      data = { recognized_data: [String(data)] };
    }
    return data;
  }
  renderAsJSON(data) {
    try {
      const createFormattedJSON = (obj, indent = 0) => {
        const spaces = "  ".repeat(indent);
        if (obj === null) return "null";
        if (typeof obj === "boolean") return obj ? "true" : "false";
        if (typeof obj === "number") return String(obj);
        if (typeof obj === "string") {
          if (obj.includes("<math") || obj.includes('class="katex"') || obj.includes("<span>")) {
            const placeholder = `__HTML_CONTENT_${Math.random().toString(36).substr(2, 9)}__`;
            htmlPlaceholders[placeholder] = obj;
            return `"${placeholder}"`;
          }
          return JSON.stringify(obj);
        }
        if (Array.isArray(obj)) {
          if (obj.length === 0) return "[]";
          const items = obj.map((item) => createFormattedJSON(item, indent + 1));
          return `[
${"  ".repeat(indent + 1)}${items.join(`,
${"  ".repeat(indent + 1)}`)}
${spaces}]`;
        }
        if (typeof obj === "object") {
          const keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          const items = keys.map((key) => {
            const formattedValue = createFormattedJSON(obj[key], indent + 1);
            return `${JSON.stringify(key)}: ${formattedValue}`;
          });
          return `{
${"  ".repeat(indent + 1)}${items.join(`,
${"  ".repeat(indent + 1)}`)}
${spaces}}`;
        }
        return String(obj);
      };
      const htmlPlaceholders = {};
      const jsonString = createFormattedJSON(data);
      let finalHTML = `<div class="json-result"><pre>${jsonString}</pre></div>`;
      for (const [placeholder, htmlContent] of Object.entries(htmlPlaceholders)) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const renderedHTML = tempDiv.innerHTML;
        finalHTML = finalHTML.replace(`"${placeholder}"`, `<span class="json-html-content">${renderedHTML}</span>`);
      }
      return finalHTML;
    } catch (error) {
      return `<div class="error">Failed to format JSON: ${error}</div>`;
    }
  }
  renderAsHTML(data) {
    const content = this.extractContentItems(data);
    const renderedContent = content.map((item) => this.renderContentItem(item, "html")).join("");
    if (!renderedContent) {
      return `<div class="html-result">${this.renderMathAsHTML(this.extractTextContent(data))}</div>`;
    }
    return `<div class="html-result">${renderedContent}</div>`;
  }
  renderAsText(data) {
    const content = this.extractContentItems(data);
    const renderedContent = content.map((item) => this.renderContentItem(item, "text")).join("\n\n");
    if (!renderedContent.trim()) {
      return `<pre class="text-result">${this.escapeHtml(this.extractTextContent(data))}</pre>`;
    }
    return `<pre class="text-result">${this.escapeHtml(renderedContent)}</pre>`;
  }
  renderAsRaw(data) {
    let rawText = "";
    if (typeof data === "string") {
      rawText = data;
    } else {
      try {
        rawText = JSON.stringify(data, null, 2);
      } catch {
        rawText = String(data ?? "");
      }
    }
    return `<pre class="raw-result">${this.escapeHtml(rawText)}</pre>`;
  }
  renderAsCode(data) {
    const content = this.extractContentItems(data).join("\n\n").trim() || this.extractTextContent(data);
    const code = this.extractLikelyCode(content);
    const language = this.detectCodeLanguage(content);
    return `<pre class="code-result"><code data-lang="${this.escapeHtml(language)}">${this.escapeHtml(code)}</code></pre>`;
  }
  renderAsMarkdown(data) {
    const content = this.extractContentItems(data);
    const renderedContent = content.map((item) => this.renderContentItem(item, "markdown")).join("\n\n");
    if (!renderedContent.trim()) {
      try {
        const textContent = this.extractTextContent(data);
        const html = marked.parse(textContent);
        return DOMPurify.sanitize(html);
      } catch (error) {
        console.warn("Markdown parsing failed, falling back to simple rendering:", error);
        return this.renderMathAsHTML(renderedContent);
      }
    }
    try {
      const html = marked.parse(renderedContent);
      return DOMPurify.sanitize(html);
    } catch (error) {
      console.warn("Markdown parsing failed, falling back to simple rendering:", error);
      return this.renderMathAsHTML(renderedContent);
    }
  }
  extractContentItems(data) {
    const items = [];
    if (data.recognized_data) {
      const recognized = Array.isArray(data.recognized_data) ? data.recognized_data : [data.recognized_data];
      items.push(...recognized.map((item) => String(item)));
    }
    if (data.verbose_data) {
      items.push(String(data.verbose_data));
    }
    if (items.length === 0) {
      const textFields = ["content", "text", "message", "result", "response", "description"];
      for (const field of textFields) {
        if (data[field]) {
          const content = Array.isArray(data[field]) ? data[field] : [data[field]];
          items.push(...content.map((item) => String(item)));
          break;
        }
      }
    }
    if (items.length === 0) {
      const textContent = this.extractTextContent(data);
      if (textContent) {
        items.push(textContent);
      }
    }
    return items;
  }
  renderContentItem(item, format) {
    switch (format) {
      case "html":
        return `<div class="recognized-item">${this.renderMathAsHTML(item)}</div>`;
      case "text":
        return this.stripMarkdown(item);
      case "markdown":
        return item;
      // Keep markdown as-is for processing
      default:
        return item;
    }
  }
  renderMathAsHTML(content) {
    let result = content;
    result = result.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      try {
        const mathHtml = marked.parse(`$$${math}$$`);
        return mathHtml.replace(/<p>|<\/p>/g, "").trim();
      } catch {
        return `<span class="math-display">${this.escapeHtml(`$$${math}$$`)}</span>`;
      }
    });
    result = result.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        const mathHtml = marked.parse(`$${math}$`);
        return mathHtml.replace(/<p>|<\/p>/g, "").trim();
      } catch {
        return `<span class="math-inline">${this.escapeHtml(`$${math}$`)}</span>`;
      }
    });
    result = result.replace(/\n/g, "<br>");
    return result;
  }
  stripMarkdown(content) {
    return content.replace(/#{1,6}\s*/g, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").replace(/^\s*[-*+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").replace(/!\[([^\]]+)\]\([^\)]+\)/g, "$1").trim();
  }
  extractLikelyCode(content) {
    const fenced = content.match(/```[\t ]*([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    if (fenced?.[2]) {
      return fenced[2].trim();
    }
    return content;
  }
  detectCodeLanguage(content) {
    const fencedLanguage = content.match(/```[\t ]*([a-zA-Z0-9_-]+)?\n/)?.[1];
    if (fencedLanguage) return fencedLanguage.toLowerCase();
    if (/\b(interface|type|const|let|=>|import\s+type)\b/.test(content)) return "typescript";
    if (/\b(function|const|let|var|import|export)\b/.test(content)) return "javascript";
    if (/\b(def |import |from |class )/.test(content)) return "python";
    if (/\b<[^>]+>/.test(content)) return "html";
    return "text";
  }
  extractTextContent(data) {
    if (data == null) return "";
    if (typeof data === "string") return data;
    if (typeof data === "number" || typeof data === "boolean") return String(data);
    if (Array.isArray(data)) {
      return data.map((item) => this.extractTextContent(item)).join("\n");
    }
    if (typeof data === "object") {
      const textFields = ["verbose_data", "recognized_data", "content", "text", "message", "result", "response", "data"];
      for (const field of textFields) {
        if (data[field] != null) {
          const content = this.extractTextContent(data[field]);
          if (content) return content;
        }
      }
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return "[Complex Object]";
      }
    }
    return String(data);
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  copyResultsToClipboard(result, format) {
    let textToCopy = "";
    if (format === "auto" && result) {
      const rawData = result?.rawData || result;
      let data = extractJSONFromAIResponse(rawData)?.data || rawData;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object") {
            data = parsed;
          }
        } catch {
        }
      }
      if (data && typeof data === "object" && (data.recognized_data || data.verbose_data)) {
        const contentItems = [];
        if (data.recognized_data) {
          const recognized = Array.isArray(data.recognized_data) ? data.recognized_data : [data.recognized_data];
          contentItems.push(...recognized.map((item) => String(item)));
        }
        if (data.verbose_data) {
          contentItems.push(String(data.verbose_data));
        }
        textToCopy = contentItems.join("\n\n");
      } else {
        const normalizedData = this.normalizeResultData(result);
        const contentItems = this.extractContentItems(normalizedData);
        textToCopy = contentItems.join("\n\n");
      }
    } else if ((format === "markdown" || format === "html") && result) {
      const normalizedData = this.normalizeResultData(result);
      const contentItems = this.extractContentItems(normalizedData);
      textToCopy = contentItems.join("\n\n");
    } else if (format === "json" && result) {
      const normalizedData = this.normalizeResultData(result);
      const contentItems = this.extractContentItems(normalizedData);
      textToCopy = contentItems.join("\n\n");
    } else if ((format === "raw" || format === "code") && result) {
      const rawData = result?.rawData || result;
      textToCopy = typeof rawData === "string" ? rawData : JSON.stringify(rawData, null, 2);
    } else {
      textToCopy = result?.textContent || "";
    }
    return navigator.clipboard.writeText(textToCopy);
  }
}

const WorkCenterDataProcessing$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    WorkCenterDataProcessing
}, Symbol.toStringTag, { value: 'Module' }));

"use strict";
class WorkCenterEvents {
  deps;
  ui;
  fileOps;
  actions;
  templates;
  voice;
  shareTarget;
  history;
  attachments;
  prompts;
  state;
  container = null;
  constructor(dependencies, ui, fileOps, actions, templates, voice, shareTarget, history, attachments, prompts, state) {
    this.deps = dependencies;
    this.ui = ui;
    this.fileOps = fileOps;
    this.actions = actions;
    this.templates = templates;
    this.voice = voice;
    this.shareTarget = shareTarget;
    this.history = history;
    this.attachments = attachments;
    this.prompts = prompts;
    this.state = state;
  }
  setContainer(container) {
    this.container = container;
  }
  setupWorkCenterEvents() {
    if (!this.container) return;
    this.setupFileSelection();
    this.setupPasteSupport();
    this.setupTemplateSelection();
    this.setupInstructionSelection();
    this.setupPromptInput();
    this.setupPromptDropzone();
    this.setupVoiceInput();
    this.setupInputTabs();
    this.setupResultsTabs();
    this.setupHeaderControlsOverlay();
    this.setupFormatSelectors();
    this.setupAutoActionCheckbox();
    this.setupActionButtons();
    this.setupPipelineRestoration();
  }
  setupFileSelection() {
    if (!this.container) return;
    const fileSelectBtns = Array.from(this.container.querySelectorAll('[data-action="select-files"]'));
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*,.pdf,.txt,.md,.json,.html,.css,.js,.ts";
    fileInput.style.display = "none";
    this.container.append(fileInput);
    for (const btn of fileSelectBtns) {
      btn.addEventListener("click", () => fileInput.click());
    }
    fileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      this.fileOps.addFilesFromInput(this.state, files);
      this.ui.updateFileList(this.state);
      this.ui.updateFileCounter(this.state);
      this.deps.onFilesChanged?.();
      const textFiles = files.filter((f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name.endsWith(".md") || f.name.endsWith(".txt"));
      if (textFiles.length > 0 && this.state.selectedTemplate && this.state.selectedTemplate.trim()) {
        console.log("[WorkCenter] Auto-processing text/markdown files with template:", this.state.selectedTemplate);
        setTimeout(async () => {
          await this.actions.executeUnifiedAction(this.state);
        }, 100);
      }
    });
  }
  setupPasteSupport() {
    if (!this.container) return;
    this.container.addEventListener("paste", async (e) => {
      if (!e.clipboardData) return;
      const target = e.target;
      const isEditableTarget = this.isEditableTarget(target);
      const hasClipboardFiles = this.hasClipboardFiles(e.clipboardData);
      if (isEditableTarget && !hasClipboardFiles) {
        return;
      }
      let contentAdded = false;
      const itemFiles = [];
      for (const item of Array.from(e.clipboardData.items || [])) {
        if (item.kind !== "file" || !item.getAsFile) continue;
        const file = item.getAsFile();
        if (file) itemFiles.push(file);
      }
      if (itemFiles.length > 0) {
        e.preventDefault();
        this.fileOps.addFilesFromInput(this.state, itemFiles);
        this.ui.updateFileList(this.state);
        this.ui.updateFileCounter(this.state);
        this.deps.onFilesChanged?.();
        contentAdded = true;
      }
      if (!contentAdded) {
        const files = Array.from(e.clipboardData.files || []);
        if (files.length > 0) {
          e.preventDefault();
          this.fileOps.addFilesFromInput(this.state, files);
          this.ui.updateFileList(this.state);
          this.ui.updateFileCounter(this.state);
          this.deps.onFilesChanged?.();
          contentAdded = true;
        }
      }
      if (!contentAdded) {
        const textContent = e.clipboardData.getData("text/plain")?.trim();
        if (textContent) {
          e.preventDefault();
          await this.fileOps.handlePastedContent(this.state, textContent, "text");
          contentAdded = true;
        }
      }
      if (!contentAdded) {
        const htmlContent = e.clipboardData.getData("text/html");
        if (htmlContent) {
          e.preventDefault();
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = htmlContent;
          const extractedText = tempDiv.textContent || tempDiv.innerText || "";
          if (extractedText.trim()) {
            await this.fileOps.handlePastedContent(this.state, extractedText.trim(), "html");
            contentAdded = true;
          }
        }
      }
      if (!contentAdded) {
        e.preventDefault();
        this.deps.showMessage?.("Clipboard content detected but no supported payload was extracted");
      }
    });
  }
  isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    if (target.closest('[contenteditable="true"]')) return true;
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  }
  hasClipboardFiles(clipboardData) {
    if ((clipboardData.files || []).length > 0) return true;
    return Array.from(clipboardData.items || []).some((item) => item.kind === "file");
  }
  setupTemplateSelection() {
    if (!this.container) return;
    const templateSelect = this.container.querySelector(".template-select");
    templateSelect?.addEventListener("change", async () => {
      const selectedPrompt = templateSelect.value;
      this.templates.selectTemplate(this.state, selectedPrompt);
      if (selectedPrompt) {
        this.prompts.updatePromptInput(this.state);
        if (this.state.recognizedData || this.fileOps.hasFiles(this.state)) {
          console.log("[WorkCenter] Auto-processing with selected template:", selectedPrompt);
          await this.actions.executeUnifiedAction(this.state);
        }
      }
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
  }
  setupInstructionSelection() {
    if (!this.container) return;
    void this.prompts.populateInstructionSelect(this.state).then(async () => {
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
    const instructionSelect = this.container.querySelector(".instruction-select");
    instructionSelect?.addEventListener("change", async () => {
      const selectedId = instructionSelect.value;
      this.prompts.handleInstructionSelection(this.state, selectedId);
      await this.templates.setActiveInstruction(selectedId || null);
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
  }
  setupPromptInput() {
    if (!this.container) return;
    const promptInput = this.container.querySelector(".prompt-input");
    promptInput.addEventListener("input", async () => {
      this.state.currentPrompt = promptInput.value;
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
      if (this.state.recognizedData && promptInput.value.trim()) {
        console.log("[WorkCenter] Auto-processing recognized data with manual prompt");
        clearTimeout(this.container._autoProcessTimeout);
        this.container._autoProcessTimeout = setTimeout(async () => {
          await this.actions.executeUnifiedAction(this.state);
        }, 1e3);
      }
    });
  }
  setupVoiceInput() {
    if (!this.container) return;
    const voiceBtn = this.container.querySelector('[data-action="voice-input"]');
    voiceBtn.addEventListener("mousedown", () => this.voice.startVoiceRecording(this.state));
    voiceBtn.addEventListener("mouseup", () => {
      this.voice.stopVoiceRecording(this.state);
      this.ui.updateVoiceButton(this.state);
    });
    voiceBtn.addEventListener("mouseleave", () => {
      this.voice.stopVoiceRecording(this.state);
      this.ui.updateVoiceButton(this.state);
    });
  }
  setupFormatSelectors() {
    if (!this.container) return;
    const formatSelect = this.container.querySelector(".format-select");
    formatSelect.addEventListener("change", async () => {
      const newFormat = formatSelect.value;
      this.state.outputFormat = newFormat;
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
      if (this.state.lastRawResult) {
        const outputContent = this.container?.querySelector("[data-output]");
        const { WorkCenterDataProcessing } = await __vitePreload(async () => { const { WorkCenterDataProcessing } = await Promise.resolve().then(() => WorkCenterDataProcessing$1);return { WorkCenterDataProcessing }},true              ?void 0:void 0,import.meta.url);
        const dataProcessing = new WorkCenterDataProcessing();
        const formattedResult = dataProcessing.formatResult(this.state.lastRawResult, newFormat);
        outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
      }
    });
    const languageSelect = this.container.querySelector(".language-select");
    languageSelect.addEventListener("change", async () => {
      this.state.selectedLanguage = languageSelect.value;
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
    const recognitionSelect = this.container.querySelector(".recognition-select");
    recognitionSelect.addEventListener("change", async () => {
      this.state.recognitionFormat = recognitionSelect.value;
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
    const processingSelect = this.container.querySelector(".processing-select");
    processingSelect.addEventListener("change", async () => {
      this.state.processingFormat = processingSelect.value;
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
  }
  setupAutoActionCheckbox() {
    if (!this.container) return;
    const autoCheckbox = this.container.querySelector(".auto-action-checkbox");
    autoCheckbox.addEventListener("change", async () => {
      this.state.autoAction = autoCheckbox.checked;
      const { WorkCenterStateManager } = await __vitePreload(async () => { const { WorkCenterStateManager } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url);
      WorkCenterStateManager.saveState(this.state);
    });
  }
  setupActionButtons() {
    if (!this.container) return;
    this.container.addEventListener("click", async (e) => {
      const target = e.target;
      const action = target.closest("[data-action]")?.getAttribute("data-action");
      if (!action) return;
      switch (action) {
        case "edit-templates":
          this.templates.showTemplateEditor(this.state, this.container);
          break;
        case "refresh-instructions":
          await this.prompts.populateInstructionSelect(this.state);
          this.prompts.updateInstructionSelect(this.state);
          break;
        case "clear-prompt":
          this.prompts.clearPrompt(this.state);
          break;
        case "copy-results":
          await this.actions.copyResults(this.state);
          break;
        case "view-output":
          await this.actions.viewResultsInViewer(this.state);
          break;
        case "save-to-explorer":
          await this.actions.saveResultsToExplorer(this.state);
          break;
        case "clear-results":
          this.actions.clearResults(this.state);
          break;
        case "clear-all-files":
          this.attachments.clearAllFiles(this.state);
          break;
        case "view-full-history":
          this.deps.state.view = "history";
          this.deps.render();
          break;
        case "view-action-history":
          this.showActionHistory();
          break;
        case "execute":
          await this.actions.executeUnifiedAction(this.state);
          break;
        case "switch-input-tab":
          this.switchInputTab(String(target.closest("[data-tab]")?.getAttribute("data-tab") || "prompt"));
          break;
        case "switch-results-tab":
          this.switchResultsTab(String(target.closest("[data-tab]")?.getAttribute("data-tab") || "output"));
          break;
        case "clear-recognized":
          const { WorkCenterStateManager: StateManager1 } = await __vitePreload(async () => { const { WorkCenterStateManager: StateManager1 } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager: StateManager1 }},true              ?void 0:void 0,import.meta.url);
          StateManager1.clearRecognizedData(this.state);
          const statusElement = this.container?.querySelector(".wc-recognized-status");
          if (statusElement) {
            statusElement.remove();
          }
          this.ui.updateDataPipeline(this.state);
          break;
        case "clear-pipeline":
          const { WorkCenterStateManager: StateManager2 } = await __vitePreload(async () => { const { WorkCenterStateManager: StateManager2 } = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager: StateManager2 }},true              ?void 0:void 0,import.meta.url);
          StateManager2.clearRecognizedData(this.state);
          this.ui.revokeAllPreviewUrls(this.state);
          this.state.files = [];
          this.ui.updateFileList(this.state);
          this.ui.updateFileCounter(this.state);
          this.deps.onFilesChanged?.();
          const statusEl = this.container?.querySelector(".wc-recognized-status");
          if (statusEl) {
            statusEl.remove();
          }
          this.ui.updateDataPipeline(this.state);
          break;
      }
    });
  }
  setupPipelineRestoration() {
    if (!this.container) return;
    this.container.addEventListener("click", async (e) => {
      const target = e.target;
      const stepIndex = target.getAttribute("data-restore-step");
      if (stepIndex !== null) {
        const index = parseInt(stepIndex);
        if (this.state.processedData && this.state.processedData[index]) {
          const step = this.state.processedData[index];
          const outputContent = this.container?.querySelector("[data-output]");
          const { WorkCenterDataProcessing } = await __vitePreload(async () => { const { WorkCenterDataProcessing } = await Promise.resolve().then(() => WorkCenterDataProcessing$1);return { WorkCenterDataProcessing }},true              ?void 0:void 0,import.meta.url);
          const dataProcessing = new WorkCenterDataProcessing();
          const formattedResult = dataProcessing.formatResult({ content: step.content }, this.state.outputFormat);
          outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
          this.state.lastRawResult = { data: step.content };
        }
      }
    });
  }
  setupInputTabs() {
    if (!this.container) return;
    this.switchInputTab(this.state.activeInputTab || "prompt");
  }
  setupResultsTabs() {
    if (!this.container) return;
    this.switchResultsTab(this.state.activeResultsTab || "output");
  }
  setupHeaderControlsOverlay() {
    if (!this.container) return;
    const disclosure = this.container.querySelector(".header-controls-disclosure");
    if (!disclosure) return;
    document.addEventListener("click", (event) => {
      if (!disclosure.open) return;
      const target = event.target;
      if (target && !disclosure.contains(target)) {
        disclosure.open = false;
      }
    });
    this.container.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && disclosure.open) {
        disclosure.open = false;
      }
    });
  }
  switchInputTab(tab) {
    if (!this.container) return;
    if (!["instruction", "prompt", "attachments"].includes(tab)) return;
    this.state.activeInputTab = tab;
    this.container.querySelector("[data-input-tabs]")?.setAttribute("data-active-tab", tab);
    const tabButtons = this.container.querySelectorAll('[data-action="switch-input-tab"][data-tab]');
    for (const tabButton of Array.from(tabButtons)) {
      const btn = tabButton;
      const isActive = btn.getAttribute("data-tab") === tab;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    }
    const tabPanels = this.container.querySelectorAll("[data-tab-panel]");
    for (const panel of Array.from(tabPanels)) {
      const el = panel;
      const isActive = el.getAttribute("data-tab-panel") === tab;
      el.classList.toggle("is-active", isActive);
    }
    void __vitePreload(async () => { const {WorkCenterStateManager} = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url).then(({ WorkCenterStateManager }) => WorkCenterStateManager.saveState(this.state)).catch(() => {
    });
  }
  switchResultsTab(tab) {
    if (!this.container) return;
    if (!["output", "pipeline", "history"].includes(tab)) return;
    const hasPipelineData = Boolean(this.state.recognizedData || this.state.processedData && this.state.processedData.length > 0);
    const nextTab = tab === "pipeline" && !hasPipelineData ? "output" : tab;
    this.state.activeResultsTab = nextTab;
    this.container.querySelector("[data-results-tabs]")?.setAttribute("data-active-tab", nextTab);
    const tabButtons = this.container.querySelectorAll('[data-action="switch-results-tab"][data-tab]');
    for (const tabButton of Array.from(tabButtons)) {
      const btn = tabButton;
      const isActive = btn.getAttribute("data-tab") === nextTab;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    }
    const tabPanels = this.container.querySelectorAll("[data-results-tab-panel]");
    for (const panel of Array.from(tabPanels)) {
      const el = panel;
      const isActive = el.getAttribute("data-results-tab-panel") === nextTab;
      el.classList.toggle("is-active", isActive);
    }
    void __vitePreload(async () => { const {WorkCenterStateManager} = await Promise.resolve().then(() => WorkCenterState);return { WorkCenterStateManager }},true              ?void 0:void 0,import.meta.url).then(({ WorkCenterStateManager }) => WorkCenterStateManager.saveState(this.state)).catch(() => {
    });
  }
  setupPromptDropzone() {
    if (!this.container) return;
    const promptDropzone = this.container.querySelector("[data-prompt-dropzone]");
    if (!promptDropzone) return;
    const overlay = this.container.querySelector("[data-prompt-drop-hint]");
    promptDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      promptDropzone.classList.add("drag-over");
      overlay?.classList.add("visible");
    });
    promptDropzone.addEventListener("dragleave", (e) => {
      const rect = promptDropzone.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        promptDropzone.classList.remove("drag-over");
        overlay?.classList.remove("visible");
      }
    });
    promptDropzone.addEventListener("drop", async (e) => {
      e.preventDefault();
      promptDropzone.classList.remove("drag-over");
      overlay?.classList.remove("visible");
      const dt = e.dataTransfer;
      if (!dt) return;
      const files = Array.from(dt.files || []);
      if (files.length > 0) {
        this.fileOps.addFilesFromInput(this.state, files);
        this.ui.updateFileList(this.state);
        this.ui.updateFileCounter(this.state);
        this.deps.onFilesChanged?.();
        return;
      }
      if (dt.types.includes("text/plain")) {
        const text = dt.getData("text/plain")?.trim();
        if (text) {
          await this.fileOps.handleDroppedContent(this.state, text, "text");
          this.ui.updateFileList(this.state);
          this.ui.updateFileCounter(this.state);
          this.deps.onFilesChanged?.();
          return;
        }
      }
      if (dt.types.includes("text/uri-list")) {
        const uriList = dt.getData("text/uri-list");
        const urls = uriList.split("\n").filter((url) => url.trim() && !url.startsWith("#"));
        const firstUrl = urls[0]?.trim();
        if (firstUrl) {
          await this.fileOps.handleDroppedContent(this.state, firstUrl, "url");
          this.ui.updateFileList(this.state);
          this.ui.updateFileCounter(this.state);
          this.deps.onFilesChanged?.();
          return;
        }
      }
      if (dt.types.includes("text/html")) {
        const html = dt.getData("text/html");
        if (html) {
          const temp = document.createElement("div");
          temp.innerHTML = html;
          const extracted = (temp.textContent || temp.innerText || "").trim();
          if (extracted) {
            await this.fileOps.handleDroppedContent(this.state, extracted, "html");
            this.ui.updateFileList(this.state);
            this.ui.updateFileCounter(this.state);
            this.deps.onFilesChanged?.();
            return;
          }
        }
      }
    });
  }
  showActionHistory() {
    this.history.showActionHistory();
  }
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
}

"use strict";
class WorkCenterResults {
  container = null;
  deps;
  dataProcessing;
  constructor(dependencies, dataProcessing) {
    this.deps = dependencies;
    this.dataProcessing = dataProcessing;
  }
  setContainer(container) {
    this.container = container;
  }
  // Output display methods
  showProcessingMessage(message) {
    if (!this.container) return;
    const outputContent = this.container.querySelector("[data-output]");
    if (outputContent) {
      outputContent.innerHTML = `<div class="wc-loading">${message}</div>`;
    }
  }
  showResult(state) {
    if (!this.container || !state.lastRawResult) return;
    const outputContent = this.container.querySelector("[data-output]");
    if (!outputContent) return;
    const formattedResult = this.dataProcessing.formatResult(state.lastRawResult, state.outputFormat);
    outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
  }
  showError(error) {
    if (!this.container) return;
    const outputContent = this.container.querySelector("[data-output]");
    if (outputContent) {
      outputContent.innerHTML = `<div class="error">Error: ${error}</div>`;
    }
  }
  clearResults() {
    if (!this.container) return;
    const outputContent = this.container.querySelector("[data-output]");
    if (outputContent) {
      outputContent.innerHTML = '<div class="wc-results-empty">Results cleared</div>';
    }
  }
  // Data pipeline management
  renderDataPipeline(state) {
    if (!state.recognizedData && (!state.processedData || state.processedData.length === 0)) {
      return "";
    }
    return H`<div class="data-pipeline-section">
            <div class="pipeline-content">
              <div class="pipeline-header">
                <h3>Data Processing Pipeline</h3>
                <div class="pipeline-actions">
                  <button class="btn btn-icon" data-action="clear-pipeline" title="Clear all data">
                    <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                  </button>
                </div>
              </div>
              <div class="pipeline-steps">
              ${state.recognizedData ? H`<div class="pipeline-step recognized-step">
                <div class="step-header">
                  <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                  <span class="step-title">Recognized Data</span>
                  <span class="step-time">${new Date(state.recognizedData.timestamp).toLocaleTimeString()}</span>
                  <span class="step-source">${state.recognizedData.source}</span>
                  <span class="step-format">${state.recognizedData.recognizedAs}</span>
                </div>
                <div class="step-content">
                  <div class="step-preview">${state.recognizedData.content.substring(0, 100)}${state.recognizedData.content.length > 100 ? "..." : ""}</div>
                </div>
              </div>` : ""}

              ${state.processedData ? state.processedData.map((step, index) => {
      const isShareTarget = step.metadata?.source === "share-target";
      const icon = isShareTarget ? "share" : "cogs";
      const stepClass = isShareTarget ? "pipeline-step share-target-step" : "pipeline-step processed-step";
      return H`<div class="${stepClass}">
                <div class="step-header">
                  <ui-icon icon="${icon}" size="16" icon-style="duotone"></ui-icon>
                  <span class="step-title">Step ${index + 1}: ${step.action}</span>
                  <span class="step-time">${new Date(step.timestamp).toLocaleTimeString()}</span>
                  ${isShareTarget ? H`<span class="step-badge share-target-badge" title="Share Target Result">Share</span>` : ""}
                  <button class="btn small" data-restore-step="${index}">Use Result</button>
                </div>
                <div class="step-content">
                  <div class="step-preview">${step.content.substring(0, 100)}${step.content.length > 100 ? "..." : ""}</div>
                </div>
              </div>`;
    }) : ""}
              </div>
            </div>
          </div>`;
  }
  updateDataPipeline(state) {
    if (!this.container) return;
    const pipelinePanel = this.container.querySelector('[data-results-tab-panel="pipeline"]');
    if (!pipelinePanel) return;
    const pipelineHTML = this.renderDataPipeline(state);
    if (typeof pipelineHTML === "string") {
      pipelinePanel.innerHTML = `<div class="wc-results-empty">No data pipeline yet</div>`;
    } else {
      pipelinePanel.innerHTML = "";
      pipelinePanel.appendChild(pipelineHTML);
    }
  }
  // Status updates
  updateRecognizedStatus(state) {
    if (!this.container) return;
    const statusElement = this.container.querySelector(".wc-recognized-status");
    if (state.recognizedData) {
      if (!statusElement) {
        const fileInputArea = this.container.querySelector(".wc-file-drop-overlay");
        if (fileInputArea) {
          const newStatus = H`<div class="wc-recognized-status">
                        <ui-icon icon="check-circle" size="16" icon-style="duotone" class="status-icon"></ui-icon>
                        <span>Content recognized - ready for actions</span>
                        <button class="btn small clear-recognized" data-action="clear-recognized">Clear</button>
                    </div>`;
          fileInputArea.appendChild(newStatus);
        }
      }
    } else if (statusElement) {
      statusElement.remove();
    }
  }
  // Output actions/header rendering
  renderOutputHeader() {
    return `
            <div class="wc-output-header">
                <div class="wc-output-actions">
                    <button class="btn btn-icon" data-action="view-output" title="View output in Viewer">
                        <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                        <span class="btn-text">View</span>
                    </button>
                    <button class="btn btn-icon" data-action="copy-results" title="Copy results">
                        <ui-icon icon="copy" size="16" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Copy</span>
                    </button>
                    <button class="btn btn-icon" data-action="save-to-explorer" title="Save to Explorer">
                        <ui-icon icon="floppy-disk" size="16" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Save</span>
                    </button>
                    <button class="btn btn-icon" data-action="clear-results" title="Clear results">
                        <ui-icon icon="trash" size="16" icon-style="duotone"></ui-icon>
                        <span class="btn-text">Clear</span>
                    </button>
                </div>
            </div>
        `;
  }
  // Output content rendering
  renderOutputContent() {
    return `
            <div class="wc-output-content" data-output> No results yet </div>
        `;
  }
  // Pipeline step restoration
  restorePipelineStep(state, stepIndex) {
    if (!this.container) return;
    if (state.processedData && state.processedData[stepIndex]) {
      const step = state.processedData[stepIndex];
      const outputContent = this.container.querySelector("[data-output]");
      if (outputContent) {
        const formattedResult = this.dataProcessing.formatResult({ content: step.content }, state.outputFormat);
        outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
        state.lastRawResult = { data: step.content };
      }
    }
  }
  // Batch update method for efficiency
  updateAllResultsUI(state) {
    this.updateDataPipeline(state);
    this.updateRecognizedStatus(state);
  }
}

"use strict";
class WorkCenterAttachments {
  container = null;
  deps;
  fileOps;
  previewUrlCache = /* @__PURE__ */ new WeakMap();
  constructor(dependencies, fileOps) {
    this.deps = dependencies;
    this.fileOps = fileOps;
  }
  setContainer(container) {
    this.container = container;
  }
  // Main attachments section rendering
  renderAttachmentsSection(state) {
    return `
            <div class="wc-attachments-section">
              <div class="file-attachment-area" data-file-drop-zone="" data-dropzone="">
                <div class="file-drop-zone" >
                  <div class="drop-zone-content">
                    <ui-icon icon="folder" size="4rem" icon-style="duotone" class="drop-icon"></ui-icon>
                    <div class="drop-text">Drop files here or click to select files</div>
                    <div class="drop-hint" data-drop-hint>Supports: Images, Documents, Text files, PDFs, URLs, Base64 data</div>
                  </div>
                </div>
                <div class="file-list" data-file-list></div>
                ${this.renderRecognizedStatus(state)}
              </div>
              <div class="wc-block-header wc-attachments-toolbar">
                <div class="file-actions">
                  <button class="btn btn-icon" data-action="select-files" title="Choose Files">
                    <ui-icon icon="folder-open" size="18" icon-style="duotone"></ui-icon>
                    <span class="btn-text">Add Files</span>
                  </button>
                  <button class="btn btn-icon" data-action="clear-all-files" title="Clear All Files">
                    <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                    <span class="btn-text">Clear All</span>
                  </button>
                </div>
                <div class="file-stats">
                  <div class="file-counter" data-file-count>
                    <ui-icon icon="file" size="16" icon-style="duotone"></ui-icon>
                    <span class="count">${state.files.length}</span>
                    <span class="label">files attached</span>
                  </div>
                  ${state.recognizedData ? `
                    <div class="data-counter recognized">
                      <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                      <span>Content recognized</span>
                    </div>
                  ` : ""}
                  ${state.processedData && state.processedData.length > 0 ? `
                    <div class="data-counter processed">
                      <ui-icon icon="cogs" size="16" icon-style="duotone"></ui-icon>
                      <span>${state.processedData.length} processing steps</span>
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
        `;
  }
  renderRecognizedStatus(state) {
    if (!state.recognizedData) return "";
    return `
            <div class="wc-recognized-status">
              <ui-icon icon="check-circle" size="16" icon-style="duotone" class="status-icon"></ui-icon>
              <span>Content recognized - ready for processing</span>
              <button class="btn small clear-recognized" data-action="clear-recognized">Clear</button>
            </div>
        `;
  }
  // File list management
  updateFileList(state) {
    if (!this.container) return;
    const fileList = this.container.querySelector("[data-file-list]");
    if (!fileList) return;
    fileList.innerHTML = "";
    if (state.files.length === 0) {
      fileList.innerHTML = '<div class="wc-attachments-empty">No files attached</div>';
      return;
    }
    state.files.forEach((file, index) => {
      const fileItem = this.createFileItem(file, index, state);
      fileList.append(fileItem);
    });
  }
  createFileItem(file, index, state) {
    const isImage = this.isImageFile(file);
    const isMarkdown = this.isMarkdownFile(file);
    const previewUrl = isImage ? this.getOrCreatePreviewUrl(file) : null;
    const fileSize = this.formatFileSize(file.size);
    const fileItem = H`<div class="file-item" data-file-index="${index}">
      <div class="file-info">
        <span class="file-icon">${this.createFileIconElement(file.type)}</span>
        ${previewUrl ? H`<img class="file-preview" alt=${file.name || "image"} src=${previewUrl} loading="lazy" decoding="async" />` : ""}
        <div class="file-details">
          <span class="file-name">${file.name || "Unnamed file"}</span>
          <span class="file-size">(${fileSize})</span>
          <span class="file-type">${this.getReadableFileType(file.type)}</span>
        </div>
        ${isMarkdown ? H`<button class="btn small" data-open-md="${index}" title="Open in Markdown Viewer">Open</button>` : ""}
      </div>
      <button class="btn small remove-btn" data-remove="${index}" title="Remove file">✕</button>
    </div>`;
    const openBtn = fileItem.querySelector(`[data-open-md="${index}"]`);
    if (openBtn) {
      openBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.openMarkdownInViewer(file);
      });
    }
    const removeBtn = fileItem.querySelector(".remove-btn");
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeFile(state, index);
    });
    return fileItem;
  }
  removeFile(state, index) {
    const removedFile = state.files[index];
    if (removedFile) {
      this.revokePreviewUrl(removedFile);
      state.files.splice(index, 1);
      this.updateFileList(state);
      this.updateFileCounter(state);
      this.deps.onFilesChanged?.();
    }
  }
  // Drop zone functionality
  setupDropZone(state) {
    if (!this.container) return;
    const dropZone = this.container.querySelector("[data-file-drop-zone]");
    if (!dropZone) return;
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*,.pdf,.txt,.md,.json,.html,.css,.js,.ts";
    fileInput.style.display = "none";
    this.container.append(fileInput);
    this.updateDropHint();
    dropZone.addEventListener("click", (e) => {
      const target = e.target;
      if (target?.closest("button, a, input, select, textarea, label, [data-remove], [data-open-md]")) {
        return;
      }
      fileInput.click();
    });
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", (e) => {
      const rect = dropZone.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        dropZone.classList.remove("drag-over");
      }
    });
    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;
      let contentAdded = false;
      const files = Array.from(dataTransfer.files || []);
      if (files.length > 0) {
        this.fileOps.addFilesFromInput(state, files);
        this.updateFileList(state);
        this.updateFileCounter(state);
        this.deps.onFilesChanged?.();
        contentAdded = true;
      }
      if (!contentAdded && dataTransfer.types.includes("text/plain")) {
        try {
          const textContent = dataTransfer.getData("text/plain");
          if (textContent?.trim()) {
            await this.fileOps.handleDroppedContent(state, textContent.trim(), "text");
            contentAdded = true;
          }
        } catch (error) {
          console.warn("[WorkCenter] Failed to get dragged text:", error);
        }
      }
      if (!contentAdded && dataTransfer.types.includes("text/uri-list")) {
        try {
          const uriList = dataTransfer.getData("text/uri-list");
          const urls = uriList.split("\n").filter((url) => url.trim() && !url.startsWith("#"));
          if (urls.length > 0) {
            for (const url of urls) {
              if (this.isValidUrl(url.trim())) {
                await this.fileOps.handleDroppedContent(state, url.trim(), "url");
                break;
              }
            }
            contentAdded = true;
          }
        } catch (error) {
          console.warn("[WorkCenter] Failed to get dragged URLs:", error);
        }
      }
      if (!contentAdded && dataTransfer.types.includes("text/html")) {
        try {
          const htmlContent = dataTransfer.getData("text/html");
          if (htmlContent) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = htmlContent;
            const extractedText = tempDiv.textContent || tempDiv.innerText || "";
            if (extractedText.trim()) {
              await this.fileOps.handleDroppedContent(state, extractedText.trim(), "html");
              contentAdded = true;
            }
          }
        } catch (error) {
          console.warn("[WorkCenter] Failed to get dragged HTML:", error);
        }
      }
    });
    fileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      this.fileOps.addFilesFromInput(state, files);
      this.updateFileList(state);
      this.updateFileCounter(state);
      this.deps.onFilesChanged?.();
      const textFiles = files.filter((f) => f.type.startsWith("text/") || f.type === "application/markdown" || f.name?.endsWith(".md") || f.name?.endsWith(".txt"));
      if (textFiles.length > 0 && state.selectedTemplate && state.selectedTemplate.trim()) {
        console.log("[WorkCenter] Auto-processing text/markdown files with template:", state.selectedTemplate);
        setTimeout(async () => {
          this.deps.showMessage?.("Files attached and ready for processing");
        }, 100);
      }
    });
  }
  // Update file counter
  updateFileCounter(state) {
    if (!this.container) return;
    const counter = this.container.querySelector("[data-file-count] .count");
    if (counter) {
      counter.textContent = state.files.length.toString();
    }
  }
  // Update data counters (recognized and processed)
  updateDataCounters(state) {
    if (!this.container) return;
    const recognizedCounter = this.container.querySelector(".data-counter.recognized");
    if (state.recognizedData) {
      if (!recognizedCounter) {
        const statsContainer = this.container.querySelector(".file-stats");
        if (statsContainer) {
          const newCounter = H`<div class="data-counter recognized">
                        <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                        <span>Content recognized</span>
                    </div>`;
          statsContainer.appendChild(newCounter);
        }
      }
    } else if (recognizedCounter) {
      recognizedCounter.remove();
    }
    const processedCounter = this.container.querySelector(".data-counter.processed");
    if (state.processedData && state.processedData.length > 0) {
      if (processedCounter) {
        const span = processedCounter.querySelector("span");
        if (span) {
          span.textContent = `${state.processedData.length} processing steps`;
        }
      } else {
        const statsContainer = this.container.querySelector(".file-stats");
        if (statsContainer) {
          const newCounter = H`<div class="data-counter processed">
                        <ui-icon icon="cogs" size="16" icon-style="duotone"></ui-icon>
                        <span>${state.processedData.length} processing steps</span>
                    </div>`;
          statsContainer.appendChild(newCounter);
        }
      }
    } else if (processedCounter) {
      processedCounter.remove();
    }
  }
  // Clear all files
  clearAllFiles(state) {
    this.revokeAllPreviewUrls(state);
    state.files.length = 0;
    this.updateFileList(state);
    this.updateFileCounter(state);
    this.updateDataCounters(state);
    this.deps.onFilesChanged?.();
  }
  // Helper methods
  isImageFile(file) {
    const type = (file?.type || "").toLowerCase();
    return type.startsWith("image/");
  }
  isMarkdownFile(file) {
    const name = (file?.name || "").toLowerCase();
    const type = (file?.type || "").toLowerCase();
    return type === "text/markdown" || name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".mdown") || name.endsWith(".mkd") || name.endsWith(".mkdn");
  }
  getOrCreatePreviewUrl(file) {
    if (!file) return null;
    if (!this.isImageFile(file)) return null;
    const cached = this.previewUrlCache.get(file);
    if (cached) return cached;
    try {
      const url = URL.createObjectURL(file);
      this.previewUrlCache.set(file, url);
      return url;
    } catch {
      return null;
    }
  }
  revokePreviewUrl(file) {
    const url = this.previewUrlCache.get(file);
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
      }
    }
    this.previewUrlCache.delete(file);
  }
  async openMarkdownInViewer(file) {
    try {
      const md = await file.text();
      try {
        localStorage.setItem("rs-markdown", md);
      } catch {
      }
      try {
        if (this.deps?.state) {
          this.deps.state.markdown = md;
          this.deps.state.view = "markdown-viewer";
        }
      } catch {
      }
      this.deps.showMessage?.(`Opened ${file.name || "file"} in Markdown Viewer`);
      this.deps.render?.();
    } catch (e) {
      this.deps.showMessage?.(`Failed to open ${file.name || "file"}`);
      console.warn("[WorkCenter] Failed to open markdown file:", e);
    }
  }
  createFileIconElement(mimeType) {
    const iconName = this.getFileIconName(mimeType);
    return H`<ui-icon icon="${iconName}" size="20" icon-style="duotone" class="file-type-icon"></ui-icon>`;
  }
  getFileIconName(mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "file-pdf";
    if (mimeType.includes("json")) return "file-text";
    if (mimeType.includes("text") || mimeType.includes("markdown")) return "file-text";
    return "file";
  }
  getReadableFileType(mimeType) {
    if (!mimeType) return "Unknown";
    const typeMap = {
      "image/jpeg": "JPEG Image",
      "image/png": "PNG Image",
      "image/gif": "GIF Image",
      "image/webp": "WebP Image",
      "image/svg+xml": "SVG Image",
      "application/pdf": "PDF Document",
      "text/plain": "Text File",
      "text/markdown": "Markdown",
      "application/json": "JSON",
      "text/html": "HTML",
      "text/css": "CSS",
      "application/javascript": "JavaScript",
      "application/typescript": "TypeScript"
    };
    if (typeMap[mimeType]) return typeMap[mimeType];
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("text/")) return "Text File";
    if (mimeType.startsWith("application/")) return "Document";
    return mimeType.split("/")[1]?.toUpperCase() || "File";
  }
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  revokeAllPreviewUrls(state) {
    try {
      for (const f of state.files) {
        this.revokePreviewUrl(f);
      }
    } catch {
    }
  }
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
  updateDropHint() {
    if (!this.container) return;
    const hintElement = this.container.querySelector("[data-drop-hint]");
    if (!hintElement) return;
    const currentHash = globalThis?.location?.hash;
    switch (currentHash) {
      case ROUTE_HASHES.SHARE_TARGET_TEXT:
        hintElement.textContent = "Drop text files or paste text content here";
        break;
      case ROUTE_HASHES.SHARE_TARGET_IMAGE:
        hintElement.textContent = "Drop image files here (PNG, JPG, GIF, WebP, etc.)";
        break;
      case ROUTE_HASHES.SHARE_TARGET_FILES:
        hintElement.textContent = "Drop any files here (images, documents, text files, PDFs, etc.)";
        break;
      case ROUTE_HASHES.SHARE_TARGET_URL:
        hintElement.textContent = "Paste URLs here (file drops not accepted on this route)";
        break;
      default:
        hintElement.textContent = "Supports: Images, Documents, Text files, PDFs, URLs, Base64 data";
        break;
    }
  }
}

"use strict";
class WorkCenterPrompts {
  container = null;
  deps;
  templates;
  voice;
  constructor(dependencies, templates, voice) {
    this.deps = dependencies;
    this.templates = templates;
    this.voice = voice;
  }
  setContainer(container) {
    this.container = container;
  }
  renderPromptPanel(state) {
    return `
            <div class="prompt-panel">
              <div class="prompt-controls">
                <select class="template-select">
                  <option value="">Select Template...</option>
                  ${state.promptTemplates.map((t) => `<option value="${t.prompt.replace(/"/g, "&quot;")}" ${state.selectedTemplate === t.prompt ? "selected" : ""}>${t.name}</option>`).join("")}
                </select>
                <button class="btn btn-icon" data-action="edit-templates" title="Edit Templates">
                  <ui-icon icon="gear" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Templates</span>
                </button>
                <button class="btn btn-icon prompt-attach-btn" data-action="select-files" title="Attach files">
                  <ui-icon icon="paperclip" size="18" icon-style="duotone"></ui-icon>
                  <span class="attach-count" data-prompt-file-count>${state.files.length}</span>
                </button>
              </div>

              <div class="prompt-input-group" data-prompt-dropzone data-dropzone="">
                <div class="prompt-input-overlay" data-prompt-drop-hint>
                  <ui-icon icon="paperclip" size="16" icon-style="duotone"></ui-icon>
                  <span>Drop files, links or text to attach</span>
                </div>
                <textarea
                  class="prompt-input"
                  placeholder="Describe what you want to do with the attached content... (or use voice input)"
                  rows="4"
                >${state.currentPrompt}</textarea>
              </div>

              <div class="prompt-actions">
                
                <button class="btn voice-btn ${state.voiceRecording ? "recording" : ""}" data-action="voice-input">
                  <ui-icon icon="microphone" size="20" icon-style="duotone"></ui-icon>
                  ${state.voiceRecording ? "Recording..." : "Hold for Voice"}
                </button>
                <label class="auto-action-label" title="Auto-action (use last successful)">
                  <input type="checkbox" class="auto-action-checkbox" ${state.autoAction ? "checked" : ""}>
                  <ui-icon icon="lightning-a" size="20" icon-style="duotone"></ui-icon>
                </label>
                <button class="btn primary action-btn" data-action="execute">
                  <ui-icon icon="brain" size="20" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Process Content</span>
                </button>
                <button class="btn btn-icon clear-btn" data-action="clear-prompt" title="Clear Prompt">
                  <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                </button>
              </div>
            </div>
        `;
  }
  // Backward-compatible section render (unused in tabbed UI)
  renderPromptsSection(state) {
    return `
            <div class="prompts-section">
              ${this.renderPromptPanel(state)}
            </div>
        `;
  }
  /** Populate the instruction selector with custom instructions from settings */
  async populateInstructionSelect(state) {
    if (!this.container) return;
    const select = this.container.querySelector(".instruction-select");
    if (!select) return;
    const instructions = await this.templates.loadInstructions();
    const hasStoredSelection = Boolean(state.selectedInstruction) && instructions.some((i) => i.id === state.selectedInstruction);
    const selectedId = hasStoredSelection ? state.selectedInstruction : this.templates.getActiveInstructionId();
    select.innerHTML = '<option value="">None (default)</option>';
    for (const instr of instructions) {
      const opt = document.createElement("option");
      opt.value = instr.id;
      opt.textContent = instr.label;
      if (instr.id === selectedId) opt.selected = true;
      select.append(opt);
    }
    if ((!state.selectedInstruction || !hasStoredSelection) && selectedId) {
      state.selectedInstruction = selectedId;
    }
  }
  /** Update the instruction selector options (sync, after loadInstructions) */
  updateInstructionSelect(state) {
    if (!this.container) return;
    const select = this.container.querySelector(".instruction-select");
    if (!select) return;
    const instructions = this.templates.getInstructions();
    const hasStoredSelection = Boolean(state.selectedInstruction) && instructions.some((i) => i.id === state.selectedInstruction);
    const selectedId = hasStoredSelection ? state.selectedInstruction : this.templates.getActiveInstructionId();
    select.innerHTML = '<option value="">None (default)</option>';
    for (const instr of instructions) {
      const opt = document.createElement("option");
      opt.value = instr.id;
      opt.textContent = instr.label;
      if (instr.id === selectedId) opt.selected = true;
      select.append(opt);
    }
  }
  /** Get the currently selected instruction object */
  getSelectedInstruction(state) {
    if (!state.selectedInstruction) return null;
    return this.templates.getInstructionById(state.selectedInstruction) || null;
  }
  // Update prompt input value
  updatePromptInput(state) {
    if (!this.container) return;
    const promptInput = this.container.querySelector(".prompt-input");
    if (promptInput) {
      promptInput.value = state.currentPrompt;
    }
  }
  // Update template select
  updateTemplateSelect(state) {
    if (!this.container) return;
    const templateSelect = this.container.querySelector(".template-select");
    if (templateSelect) {
      const currentValue = templateSelect.value;
      templateSelect.innerHTML = '<option value="">Select Template...</option>' + state.promptTemplates.map(
        (t) => `<option value="${t.prompt.replace(/"/g, "&quot;")}" ${state.selectedTemplate === t.prompt ? "selected" : ""}>${t.name}</option>`
      ).join("");
      if (state.selectedTemplate && state.promptTemplates.some((t) => t.prompt === state.selectedTemplate)) {
        templateSelect.value = state.selectedTemplate;
      } else {
        templateSelect.value = currentValue;
      }
    }
  }
  // Update voice button state
  updateVoiceButton(state) {
    if (!this.container) return;
    const voiceBtn = this.container.querySelector('[data-action="voice-input"]');
    if (voiceBtn) {
      voiceBtn.innerHTML = state.voiceRecording ? '<ui-icon icon="microphone" size="20" icon-style="duotone"></ui-icon> Recording...' : '<ui-icon icon="microphone" size="20" icon-style="duotone"></ui-icon> Hold for Voice';
      voiceBtn.classList.toggle("recording", state.voiceRecording);
    }
  }
  updatePromptFileCount(state) {
    if (!this.container) return;
    const count = this.container.querySelector("[data-prompt-file-count]");
    if (count) {
      count.textContent = String(state.files.length);
    }
  }
  // Clear prompt
  clearPrompt(state) {
    state.currentPrompt = "";
    this.updatePromptInput(state);
  }
  // Handle template selection
  handleTemplateSelection(state, selectedPrompt) {
    state.selectedTemplate = selectedPrompt;
    if (selectedPrompt) {
      state.currentPrompt = selectedPrompt;
      this.updatePromptInput(state);
    }
  }
  // Handle instruction selection
  handleInstructionSelection(state, instructionId) {
    state.selectedInstruction = instructionId;
  }
  // Handle auto action toggle
  handleAutoActionToggle(state, checked) {
    state.autoAction = checked;
  }
}

"use strict";
class WorkCenterHistory {
  container = null;
  deps;
  constructor(dependencies) {
    this.deps = dependencies;
  }
  setContainer(container) {
    this.container = container;
  }
  // Update recent history display
  updateRecentHistory(state) {
    if (!this.container) return;
    const historyContainer = this.container.querySelector("[data-recent-history]");
    if (!historyContainer) return;
    historyContainer.innerHTML = "";
    const recentItems = actionHistory.getRecentEntries(10).filter(
      (entry) => entry.context.source === "workcenter" && entry.status === "completed"
    );
    if (recentItems.length === 0) {
      historyContainer.innerHTML = '<div class="wc-history-empty">No recent activity</div>';
      return;
    }
    recentItems.slice(0, 3).forEach((item) => {
      const historyItem = H`<div class="history-item-compact">
        <div class="history-meta">
          <span class="history-status ${item.result?.type !== "error" ? "success" : "error"}">${item.result?.type !== "error" ? "✓" : "✗"}</span>
          <span class="history-prompt">${item.input.text?.substring(0, 50) || item.action}${item.input.text && item.input.text.length > 50 ? "..." : ""}</span>
          ${item.result?.processingTime ? H`<span class="history-time">${Math.round(item.result.processingTime / 1e3)}s</span>` : ""}
        </div>
        <button class="btn small" data-restore="${item.id}">Use</button>
      </div>`;
      historyItem.querySelector("button")?.addEventListener("click", () => {
        if (item.input.text) {
          state.currentPrompt = item.input.text;
          this.deps.showMessage?.("Restored prompt from history");
        }
      });
      historyContainer.append(historyItem);
    });
  }
  // Update action history stats
  updateActionHistory() {
    if (!this.container) return;
    const statsContainer = this.container.querySelector("[data-action-stats]");
    if (statsContainer) {
      const stats = actionHistory.getStats();
      statsContainer.innerHTML = `
                <div class="stats-item">Total: ${stats.total}</div>
                <div class="stats-item">Success: ${stats.completed}</div>
                <div class="stats-item">Failed: ${stats.failed}</div>
            `;
    }
  }
  // Show full action history modal
  showActionHistory() {
    if (!this.container) return;
    const actionEntries = actionHistory.getRecentEntries(50).filter(
      (entry) => entry.context.source === "workcenter"
    );
    const modal = H`<div class="action-history-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Action History</h3>
          <div class="modal-actions">
            <button class="btn btn-icon" data-action="export-history" title="Export History">
              <ui-icon icon="download" size="18" icon-style="duotone"></ui-icon>
            </button>
            <button class="btn btn-icon" data-action="clear-history" title="Clear History">
              <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
            </button>
            <button class="btn" data-action="close-modal">Close</button>
          </div>
        </div>

        <div class="history-stats">
          ${(() => {
      const stats = actionHistory.getStats();
      return H`
              <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Actions</div>
              </div>
              <div class="stat-card">
                <div class="stat-value success">${stats.completed}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value error">${stats.failed}</div>
                <div class="stat-label">Failed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.byAction["recognize"] || 0}</div>
                <div class="stat-label">Recognitions</div>
              </div>
            `;
    })()}
        </div>

        <div class="history-filters">
          <select class="filter-select" data-filter="status">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
          <select class="filter-select" data-filter="action">
            <option value="">All Actions</option>
            <option value="recognize">Recognize</option>
            <option value="analyze">Analyze</option>
            <option value="process">Process</option>
          </select>
        </div>

        <div class="action-history-list">
          ${actionEntries.length === 0 ? H`<div class="wc-history-empty">No actions found</div>` : actionEntries.map((entry) => H`<div class="action-history-item ${entry.status}">
              <div class="action-header">
                <div class="action-meta">
                  <span class="action-status ${entry.status}">${this.getStatusIcon(entry.status)}</span>
                  <span class="action-type">${entry.action}</span>
                  <span class="action-time">${this.formatTimeAgo(entry.timestamp)}</span>
                  ${entry.result?.processingTime ? H`<span class="action-duration">${Math.round(entry.result.processingTime / 1e3)}s</span>` : ""}
                </div>
                <div class="action-actions">
                  ${entry.result ? H`<button class="btn small" data-restore-action="${entry.id}">Use Result</button>` : ""}
                  <button class="btn small" data-view-details="${entry.id}">Details</button>
                </div>
              </div>

              <div class="action-content">
                <div class="input-preview">
                  <strong>Input:</strong>
                  ${entry.input.files?.length ? `${entry.input.files.length} file(s): ${entry.input.files.map((f) => f.name).join(", ")}` : entry.input.text?.substring(0, 100) || "No input"}
                  ${entry.input.text && entry.input.text.length > 100 ? "..." : ""}
                </div>

                ${entry.result ? H`<div class="result-preview">
                  <strong>Result:</strong>
                  <div class="result-content">${entry.result.content.substring(0, 200)}${entry.result.content.length > 200 ? "..." : ""}</div>
                </div>` : ""}

                ${entry.error ? H`<div class="error-preview">
                  <strong>Error:</strong> ${entry.error}
                </div>` : ""}
              </div>
            </div>`)}
        </div>
      </div>
    </div>`;
    modal.addEventListener("click", (e) => {
      const target = e.target;
      const action = target.getAttribute("data-action") || target.closest("[data-action]")?.getAttribute("data-action");
      const entryId = target.getAttribute("data-restore-action") || target.getAttribute("data-view-details");
      if (action === "close-modal") {
        modal.remove();
      } else if (action === "export-history") {
        this.exportActionHistory();
      } else if (action === "clear-history") {
        if (confirm("Are you sure you want to clear all action history?")) {
          actionHistory.clearEntries();
          modal.remove();
          this.updateRecentHistory({});
        }
      } else if (entryId) {
        const entry = actionHistory.getEntry(entryId);
        if (entry) {
          if (target.hasAttribute("data-restore-action") && entry.result) {
            this.deps.showMessage?.("Result restored from history");
            modal.remove();
          } else if (target.hasAttribute("data-view-details")) {
            this.showActionDetails(entry);
          }
        }
      }
    });
    modal.querySelectorAll(".filter-select").forEach((select) => {
      select.addEventListener("change", () => this.applyHistoryFilters(modal));
    });
    this.container.append(modal);
  }
  // Show action details modal
  showActionDetails(entry) {
    const modal = H`<div class="action-details-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Action Details</h3>
          <button class="btn" data-action="close-modal">Close</button>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <label>ID:</label>
            <span>${entry.id}</span>
          </div>
          <div class="detail-item">
            <label>Timestamp:</label>
            <span>${new Date(entry.timestamp).toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Source:</label>
            <span>${entry.context.source}</span>
          </div>
          <div class="detail-item">
            <label>Action:</label>
            <span>${entry.action}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-${entry.status}">${entry.status}</span>
          </div>
          ${entry.result?.processingTime ? H`<div class="detail-item">
            <label>Processing Time:</label>
            <span>${Math.round(entry.result.processingTime / 1e3)}s</span>
          </div>` : ""}
        </div>

        <div class="details-section">
          <h4>Input</h4>
          <div class="input-details">
            <div>Type: ${entry.input.type}</div>
            ${entry.input.files ? H`<div>Files: ${entry.input.files.map((f) => f.name).join(", ")}</div>` : ""}
            ${entry.input.text ? H`<div>Text: <pre>${entry.input.text}</pre></div>` : ""}
          </div>
        </div>

        ${entry.result ? H`<div class="details-section">
          <h4>Result</h4>
          <div class="result-details">
            <div>Type: ${entry.result.type}</div>
            <div>Auto Copied: ${entry.result.autoCopied ? "Yes" : "No"}</div>
            <div>Content: <pre>${entry.result.content}</pre></div>
          </div>
        </div>` : ""}

        ${entry.error ? H`<div class="details-section">
          <h4>Error</h4>
          <div class="error-details">${entry.error}</div>
        </div>` : ""}
      </div>
    </div>`;
    modal.addEventListener("click", (e) => {
      if (e.target.getAttribute("data-action") === "close-modal") {
        modal.remove();
      }
    });
    document.body.append(modal);
  }
  // Apply filters to history modal
  applyHistoryFilters(modal) {
    const statusFilter = modal.querySelector('[data-filter="status"]').value;
    const actionFilter = modal.querySelector('[data-filter="action"]').value;
    const items = modal.querySelectorAll(".action-history-item");
    items.forEach((item) => {
      const status = item.classList[1];
      const action = item.querySelector(".action-type")?.textContent || "";
      const statusMatch = !statusFilter || status === statusFilter;
      const actionMatch = !actionFilter || action === actionFilter;
      item.style.display = statusMatch && actionMatch ? "block" : "none";
    });
  }
  // Export action history
  exportActionHistory() {
    const data = actionHistory.exportEntries("json");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `action-history-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.deps.showMessage?.("History exported successfully");
  }
  // Helper methods
  getStatusIcon(status) {
    switch (status) {
      case "completed":
        return "✓";
      case "failed":
        return "✗";
      case "processing":
        return "⟳";
      case "pending":
        return "⏳";
      case "cancelled":
        return "⊗";
      default:
        return "?";
    }
  }
  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 6e4);
    const hours = Math.floor(diff / 36e5);
    const days = Math.floor(diff / 864e5);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  }
  // Get last successful prompt from history
  getLastSuccessfulPrompt() {
    const lastSuccessful = this.deps.history.find((h) => h.ok);
    return lastSuccessful?.prompt || "Process the provided content";
  }
}

"use strict";
marked?.use?.(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
    output: "mathml",
    strict: false
  }),
  {
    hooks: {
      preprocess: (markdown) => {
        if (/\\(.*\\)|\\[.*\\]/.test(markdown)) {
          const katexNode = document.createElement("div");
          katexNode.innerHTML = markdown;
          renderMathInElement(katexNode, {
            throwOnError: false,
            nonStandard: true,
            output: "mathml",
            strict: false,
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "\\[", right: "\\]", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\(", right: "\\)", display: false }
            ]
          });
          return katexNode.innerHTML;
        }
        return markdown;
      }
    }
  }
);
class WorkCenterManager {
  state;
  deps;
  // Sub-modules
  ui;
  fileOps;
  shareTarget;
  templates;
  voice;
  actions;
  dataProcessing;
  attachments;
  prompts;
  results;
  history;
  events;
  constructor(dependencies) {
    this.deps = dependencies;
    this.state = WorkCenterStateManager.createDefaultState();
    this.dataProcessing = new WorkCenterDataProcessing();
    this.templates = new WorkCenterTemplates(dependencies);
    this.voice = new WorkCenterVoice(dependencies);
    this.fileOps = new WorkCenterFileOps(dependencies);
    this.history = new WorkCenterHistory(dependencies);
    this.attachments = new WorkCenterAttachments(dependencies, this.fileOps);
    this.prompts = new WorkCenterPrompts(dependencies, this.templates, this.voice);
    this.results = new WorkCenterResults(dependencies, this.dataProcessing);
    this.ui = new WorkCenterUI(dependencies, this.attachments, this.prompts, this.results, this.history);
    this.shareTarget = new WorkCenterShareTarget(dependencies, this.fileOps);
    this.actions = new WorkCenterActions(dependencies, this.ui, this.fileOps, this.dataProcessing, this.results, this.history, this.templates);
    this.events = new WorkCenterEvents(
      dependencies,
      this.ui,
      this.fileOps,
      this.actions,
      this.templates,
      this.voice,
      this.shareTarget,
      this.history,
      this.attachments,
      this.prompts,
      this.state
    );
    this.shareTarget.initShareTargetListener(this.state);
    registerComponent("workcenter-core", "workcenter");
    this.shareTarget.processQueuedMessages(this.state);
    const pendingMessages = initializeComponent("workcenter-core");
    for (const message of pendingMessages) {
      console.log(`[WorkCenter] Processing pending message:`, message);
      this.handleExternalMessage(message);
    }
    if (typeof globalThis !== "undefined") {
      globalThis?.addEventListener?.("hashchange", () => {
        this.attachments.updateDropHint?.();
      });
    }
  }
  // File handling methods - delegate to fileOps module
  async handleDroppedContent(content, sourceType) {
    return this.fileOps.handleDroppedContent(this.state, content, sourceType);
  }
  async handlePastedContent(content, sourceType) {
    return this.fileOps.handlePastedContent(this.state, content, sourceType);
  }
  // Handle incoming content from unified messaging system
  async handleIncomingContent(data, contentType) {
    try {
      let fileToAttach = null;
      if (data.file instanceof File) {
        fileToAttach = data.file;
      } else if (data.blob instanceof Blob) {
        const filename = data.filename || `attachment-${Date.now()}.${contentType === "markdown" ? "md" : "txt"}`;
        fileToAttach = new File([data.blob], filename, { type: data.blob.type });
      } else if (data.text || data.content) {
        const content = data.text || data.content;
        const textContent = typeof content === "string" ? content : JSON.stringify(content, null, 2);
        const filename = data.filename || `content-${Date.now()}.${contentType === "markdown" ? "md" : "txt"}`;
        const mimeType = contentType === "markdown" ? "text/markdown" : "text/plain";
        fileToAttach = new File([textContent], filename, { type: mimeType });
      }
      if (fileToAttach) {
        this.state.files.push(fileToAttach);
        this.ui.updateFileList(this.state);
        this.ui.updateFileCounter(this.state);
        this.deps.showMessage(`Attached ${fileToAttach.name} to Work Center`);
      }
    } catch (error) {
      console.warn("[WorkCenter] Failed to handle incoming content:", error);
      this.deps.showMessage("Failed to attach content");
    }
  }
  /**
   * Public entry for Basic/Main unified-messaging handler and pending inbox replay.
   * Handles share-target inputs/results and general content-share attachment.
   */
  async handleExternalMessage(message) {
    if (!message) return;
    if (message.type === "share-target-input" && message.data) {
      await this.shareTarget.addShareTargetInput(this.state, message.data);
      this.ui.updateFileList(this.state);
      this.ui.updateFileCounter(this.state);
      this.ui.updateDataPipeline(this.state);
      return;
    }
    if (message.type === "share-target-result" && message.data) {
      await this.shareTarget.addShareTargetResult(this.state, message.data);
      this.ui.updateDataPipeline(this.state);
      return;
    }
    if (message.type === "ai-result" && message.data) {
      await this.shareTarget.handleAIResult(this.state, message.data);
      this.ui.updateDataPipeline(this.state);
      return;
    }
    if (message.type === "content-share" && message.data) {
      await this.handleIncomingContent(message.data, message.contentType || "text");
    }
  }
  getState() {
    return this.state;
  }
  destroy() {
    this.ui.setContainer(null);
    this.attachments.setContainer(null);
    this.prompts.setContainer(null);
    this.results.setContainer(null);
    this.history.setContainer(null);
    console.log("[WorkCenter] WorkCenterManager destroyed");
  }
  renderWorkCenterView() {
    const container = this.ui.renderWorkCenterView(this.state);
    this.events.setContainer(container);
    this.events.setupWorkCenterEvents();
    this.ui.updateFileList(this.state);
    this.ui.updateFileCounter(this.state);
    this.history.updateRecentHistory(this.state);
    return container;
  }
}

const workcenterStyles = "@layer view.workcenter.utilities{@keyframes B{to{transform:rotate(1turn)}}@keyframes C{0%{opacity:0}to{opacity:1}}@keyframes D{0%{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes E{0%,to{opacity:1;transform:scale(1)}50%{opacity:.82;transform:scale(.98)}}@keyframes F{0%,49%{opacity:1}50%,to{opacity:.25}}}@layer view.workcenter.tokens{:is(html,body):has([data-view=workcenter]){--view-layout:\"grid\";--view-sidebar-visible:true;--view-toolbar-expanded:true;--view-content-max-width:none}}@layer view.workcenter.base{.workcenter-view{animation:D .3s ease-out;background:var(--color-background);block-size:stretch;color:var(--color-on-background);contain:strict;container-type:size;display:flex;flex-direction:column;gap:var(--space-md);inline-size:stretch;max-block-size:stretch;max-inline-size:stretch;min-block-size:0;min-inline-size:0;overflow-x:hidden;overflow-y:auto;padding:var(--space-md);scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.workcenter-view button,.workcenter-view input,.workcenter-view select,.workcenter-view textarea{box-sizing:border-box;max-inline-size:100%}.workcenter-view button{flex-wrap:nowrap;overflow:hidden;text-align:center;text-decoration:none;text-overflow:ellipsis;text-rendering:auto;text-shadow:none;text-transform:none;text-wrap:nowrap;white-space:nowrap}.workcenter-view h3{padding:var(--space-sm)}@container (max-inline-size: 1024px){.workcenter-view{gap:var(--space-sm);padding:var(--space-sm)}}@container (max-inline-size: 768px){.workcenter-view{gap:var(--space-xs);padding:var(--space-xs)}}.workcenter-view::-webkit-scrollbar{inline-size:4px}.workcenter-view::-webkit-scrollbar-track{background:#0000}.workcenter-view::-webkit-scrollbar-thumb{background:var(--color-outline-variant);border-radius:2px}.workcenter-view::-webkit-scrollbar-thumb:hover{background:var(--color-outline)}.workcenter-view:focus-visible{outline:2px solid var(--color-primary);outline-offset:-2px}}@layer view.workcenter.layout{.workcenter-content{block-size:stretch;contain:strict;flex:1;max-block-size:stretch;min-block-size:0}.workcenter-layout{block-size:stretch;display:grid;flex-direction:column;gap:var(--space-md);grid-auto-flow:row;grid-auto-rows:minmax(min(8rem,100%),1fr);grid-template-columns:minmax(0,1fr);min-block-size:0}.workcenter-layout,.workcenter-layout>*{inline-size:stretch}.workcenter-block{block-size:stretch;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:1;gap:var(--space-md);max-block-size:stretch;min-block-size:fit-content}.input-tabs-section,.prompts-block{grid-row:2;order:2}.results-block,.results-section{block-size:stretch;flex-basis:fit-content;flex-grow:1;flex-shrink:1;grid-row:1;max-block-size:stretch;order:1;overflow:hidden}.results-block{min-block-size:calc-size(fit-content,max(size,min(100%,16rem)))}.input-tabs-section,.results-section{align-items:stretch;display:flex;flex-direction:column;gap:var(--space-md);justify-content:stretch;max-block-size:stretch;min-block-size:0;place-content:stretch;place-items:stretch}.input-tabs-section,.results-tabs-section{block-size:stretch;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:0;gap:var(--space-xs);max-block-size:stretch}.input-tab-actions,.results-tab-actions{display:flex;flex-wrap:wrap;gap:var(--space-xs)}.tab-btn{background:var(--color-surface-container-low);border:0 solid var(--color-outline-variant);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);cursor:pointer;font-size:var(--text-sm);padding:var(--space-sm) var(--space-md)}.tab-btn.is-active{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary)}.input-tab-panels,.results-tab-panels{block-size:stretch;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:1;inline-size:stretch;max-block-size:stretch;min-block-size:min(12rem,100%);place-content:center;align-content:stretch;justify-content:stretch;place-items:center}.results-tab-panels{min-block-size:fit-content}.results-tab-panel,.tab-panel{block-size:fit-content;display:none;flex-basis:fit-content;flex-grow:1;flex-shrink:1;inline-size:stretch;max-block-size:stretch;min-block-size:fit-content;min-inline-size:0;place-content:center;align-content:stretch;justify-content:stretch;place-items:center}.results-tab-panel.is-active,.tab-panel.is-active{display:flex;flex-direction:column}.results-tab-panel>*,.tab-panel>*{flex-basis:fit-content;flex-grow:1;flex-shrink:1;inline-size:stretch}@container (min-inline-size: 1120px){.workcenter-layout{align-items:start;grid-auto-flow:row;grid-template-columns:minmax(0,1fr)}.results-block{order:1}.prompts-block{order:2}}}@layer view.workcenter.components{.workcenter-header{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg);display:grid;gap:var(--space-sm);grid-template-columns:[logo] minmax(0,max-content) [controls] minmax(0,1fr);inset-block-start:0;padding:var(--space-xs) var(--space-md);place-content:center;justify-content:space-between;place-items:center;position:sticky;z-index:2}.workcenter-header h2{color:var(--color-on-surface);font-size:var(--text-base);font-weight:var(--font-weight-bold);grid-column:logo;letter-spacing:-.01em;margin:0;white-space:nowrap}@container (max-inline-size: 768px){.workcenter-header{gap:var(--space-sm);grid-template-columns:[controls] minmax(0,1fr);padding:var(--space-sm)}.workcenter-header h2{display:none}}@container (max-inline-size: 480px){.workcenter-header{gap:var(--space-xs);padding:var(--space-xs)}}.header-controls-disclosure{border:0;display:block;grid-column:controls;inline-size:stretch;margin:0;max-inline-size:stretch;padding:0}.header-controls-summary{align-items:center;background-color:initial;border:0 #0000;border-radius:var(--radius-sm);color:var(--color-on-surface);cursor:pointer;display:none;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-sm);inline-size:stretch;justify-content:space-between;padding:var(--space-xs) var(--space-sm);user-select:none}.header-controls-summary::-webkit-details-marker{display:none}.header-controls-summary::marker{content:\"\"}.header-controls-summary:after{content:\"▾\";font-size:var(--text-xs);opacity:.8;transition:transform .18s ease}@container (max-inline-size: 768px){.header-controls-summary{display:inline-flex}.header-controls-disclosure{inline-size:100%;justify-self:stretch;position:relative}}.header-controls-disclosure[open]>.header-controls-summary:after{transform:rotate(180deg)}@container (min-inline-size: 769px){.header-controls-disclosure{display:contents}.header-controls-disclosure::details-content{display:contents;inline-size:stretch}.header-controls-summary{display:none}.header-controls-disclosure>.control-selectors{background:var(--color-surface-container-low);border:0;border-radius:var(--radius-sm);box-shadow:none;display:grid;inline-size:stretch;inset:auto;justify-self:end;max-block-size:none;max-inline-size:min(min(100%,64rem),round(up,100%,32rem));min-inline-size:0;overflow:visible;padding:0;position:static}}@container (max-inline-size: 768px){.header-controls-disclosure:not([open])>.control-selectors{display:none}}@media (max-width:768px){.header-controls-disclosure{inline-size:100%;justify-self:stretch;position:relative}.header-controls-summary{display:inline-flex}.header-controls-disclosure:not([open])>.control-selectors{display:none}}.control-selectors{align-items:start;background:var(--color-surface-container-low);border-radius:var(--radius-sm);display:grid;gap:var(--space-md);grid-template-columns:repeat(4,minmax(0,1fr));inline-size:stretch;justify-self:end;max-inline-size:min(min(100%,64rem),round(up,100%,32rem));padding:0}@container (max-inline-size: 1024px){.control-selectors{gap:var(--space-sm);grid-template-columns:repeat(2,minmax(0,1fr));padding:var(--space-sm)}}@container (max-inline-size: 900px){.control-selectors{gap:var(--space-sm);grid-template-columns:repeat(2,minmax(0,1fr));inline-size:stretch}}@container (max-inline-size: 768px){.control-selectors{background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);box-shadow:var(--shadow-lg,0 10px 30px #0000002e);gap:var(--space-xs);grid-template-columns:minmax(0,1fr);inset-block-start:calc(100% + var(--space-xs));inset-inline-end:0;max-block-size:min(70vh,42rem);max-inline-size:min(32rem,100vw - 1rem);min-inline-size:min(32rem,100vw - 1rem);overflow:auto;padding:var(--space-md);position:absolute;z-index:5}}@container (max-inline-size: 480px){.control-selectors{gap:var(--space-xs);grid-template-columns:minmax(0,1fr);inset-inline-end:calc(var(--space-xs) * -1);padding:var(--space-xs)}}.format-selector,.language-selector,.processing-selector,.recognition-selector{background:var(--color-surface);border-radius:var(--radius-sm);color:var(--color-on-surface);display:grid;font-family:var(--font-family);font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-sm);grid-template-columns:minmax(0,1fr) minmax(0,8rem);inline-size:stretch;max-inline-size:stretch;min-inline-size:fit-content;overflow:hidden;padding:var(--space-xs) var(--space-sm);place-content:center;place-items:center}.format-selector select,.language-selector select,.processing-selector select,.recognition-selector select{inline-size:100%;min-block-size:2.25rem;overflow:hidden;padding:var(--space-sm);place-content:center;place-items:center;text-align:start;text-overflow:ellipsis;white-space:nowrap}.format-selector label,.language-selector label,.processing-selector label,.recognition-selector label{color:var(--color-on-surface-variant);flex-wrap:nowrap;font-size:var(--text-xs);justify-self:end;max-inline-size:stretch;overflow:hidden;padding-inline:var(--space-md);place-content:center;place-items:center;text-align:end;text-overflow:ellipsis;white-space:nowrap}@container (max-inline-size: 768px){.format-selector label,.language-selector label,.processing-selector label,.recognition-selector label{justify-self:start;text-align:start}}@container (max-inline-size: 900px){.format-selector,.language-selector,.processing-selector,.recognition-selector{font-size:var(--text-xs);gap:var(--space-xs);padding:var(--space-xs)}}@container (max-inline-size: 768px){.format-selector,.language-selector,.processing-selector,.recognition-selector{gap:var(--space-sm)}}@container (max-inline-size: 640px){.format-selector,.language-selector,.processing-selector,.recognition-selector{gap:var(--space-xs)}}}@layer view.workcenter.components{.prompt-panel{block-size:stretch;flex-basis:fit-content;flex-grow:1;flex-shrink:1;max-block-size:stretch;min-block-size:fit-content}.prompt-panel,.prompt-section{border:none;border-radius:var(--radius-md);padding:0;position:relative}.prompt-panel>:where(.wc-file-drop-overlay),.prompt-section>:where(.wc-file-drop-overlay){inset:0;opacity:0;pointer-events:none;position:absolute;transition:all var(--motion-normal);visibility:hidden}.prompt-panel .prompt-controls,.prompt-section .prompt-controls{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-md);place-content:center;place-items:center}@container (max-inline-size: 480px){.prompt-panel .prompt-controls .btn-icon span,.prompt-section .prompt-controls .btn-icon span{display:none}}.prompt-panel .prompt-controls .icon-btn,.prompt-section .prompt-controls .icon-btn{align-items:center;background:var(--color-surface-container);block-size:40px;border:none;border-radius:var(--radius-sm);color:var(--color-on-surface);cursor:pointer;display:flex;inline-size:40px;justify-content:center;transition:all var(--motion-fast)}.prompt-panel .prompt-controls .icon-btn ui-icon,.prompt-section .prompt-controls .icon-btn ui-icon{transition:color var(--motion-fast)}.prompt-panel .prompt-controls .icon-btn:hover,.prompt-section .prompt-controls .icon-btn:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.prompt-panel .prompt-controls .icon-btn:hover ui-icon,.prompt-section .prompt-controls .icon-btn:hover ui-icon{color:var(--color-primary)}.prompt-panel .prompt-controls .icon-btn:focus-visible,.prompt-section .prompt-controls .icon-btn:focus-visible{box-shadow:var(--focus-ring);outline:none}@container (max-inline-size: 768px){.prompt-panel .prompt-controls .icon-btn,.prompt-section .prompt-controls .icon-btn{block-size:36px;inline-size:36px}}@container (max-inline-size: 480px){.prompt-panel .prompt-controls .icon-btn,.prompt-section .prompt-controls .icon-btn{block-size:32px;inline-size:32px}}@container (max-inline-size: 768px){.prompt-panel .prompt-controls,.prompt-section .prompt-controls{gap:var(--space-sm)}}@container (max-inline-size: 480px){.prompt-panel .prompt-controls,.prompt-section .prompt-controls{align-items:stretch;gap:var(--space-sm)}}.template-select{background:var(--color-surface);border-radius:var(--radius-sm);color:var(--color-on-surface);cursor:pointer;flex:1;font-family:var(--font-family);font-size:var(--text-sm);font-weight:var(--font-weight-medium);min-block-size:36px;padding:var(--space-sm) var(--space-md)}.template-select:hover{background:var(--color-surface-container-high);border-color:var(--color-primary)}.template-select:focus{border-color:var(--color-primary);outline:none}@container (max-inline-size: 768px){.template-select{min-block-size:40px}}.instruction-selector-row{align-items:center;display:flex;gap:var(--space-sm);padding:var(--space-sm) 0}.instruction-selector-row .instruction-label{align-items:center;color:var(--color-on-surface-variant);display:flex;flex-shrink:0;font-size:var(--text-xs);font-weight:var(--font-weight-medium);gap:var(--space-xs);white-space:nowrap}.instruction-selector-row .instruction-label ui-icon{color:var(--color-primary);opacity:.8}.instruction-selector-row .instruction-select{background:var(--color-surface);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);color:var(--color-on-surface);cursor:pointer;flex:1;font-family:var(--font-family);font-size:var(--text-xs);min-block-size:30px;padding:var(--space-xs) var(--space-sm);transition:border-color var(--motion-fast)}.instruction-selector-row .instruction-select:hover{background:var(--color-surface-container-high);border-color:var(--color-primary)}.instruction-selector-row .instruction-select:focus{border-color:var(--color-primary);box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 15%,#0000);outline:none}.instruction-selector-row .btn-sm{align-items:center;background:#0000;border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);cursor:pointer;display:flex;flex-shrink:0;justify-content:center;min-block-size:28px;min-inline-size:28px;padding:var(--space-xs);transition:all var(--motion-fast)}.instruction-selector-row .btn-sm:hover{background:var(--color-surface-container-high);border-color:var(--color-primary);color:var(--color-primary)}@container (max-inline-size: 480px){.instruction-selector-row{flex-wrap:wrap}.instruction-selector-row .instruction-label{flex-basis:100%}}.prompt-input{background:var(--color-surface);block-size:stretch;border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);color:var(--color-on-surface);flex-basis:min-content;flex-grow:1;flex-shrink:1;font-family:var(--font-family-system);font-size:var(--text-sm);inline-size:stretch;line-height:var(--leading-relaxed);max-block-size:stretch;min-block-size:calc-size(min-content,min(size,100%));padding:var(--space-sm) var(--space-md);resize:vertical;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.prompt-input::placeholder{color:var(--color-on-surface-variant);opacity:.8}.prompt-input::-webkit-scrollbar{block-size:4px;inline-size:4px}.prompt-input::-webkit-scrollbar-thumb{background:var(--color-outline-variant)}.prompt-input:hover{background:var(--color-surface-container-low);box-shadow:var(--elev-1)}.prompt-input:focus{background:var(--color-surface-container-high);box-shadow:var(--focus-ring);outline:none}@container (max-inline-size: 1024px){.prompt-input{padding:var(--space-sm)}}@container (max-inline-size: 768px){.prompt-input{padding:var(--space-xs) var(--space-sm)}}.wc-file-drop-overlay{background:var(--color-surface-container-low);border:none;border-radius:var(--radius-md);box-shadow:var(--elev-1);inset:0;opacity:0;padding-block:var(--space-lg);padding-inline:var(--space-lg);pointer-events:none;position:absolute;transition:all var(--motion-normal);visibility:hidden;z-index:4}.wc-file-drop-overlay.drag-over{background:color-mix(in oklab,var(--color-primary) 10%,var(--color-surface-container-low));box-shadow:var(--focus-ring),var(--elev-2);opacity:1;visibility:visible}.wc-file-drop-overlay.drag-over .drop-zone-content{opacity:1;visibility:visible}@container (max-inline-size: 1024px){.wc-file-drop-overlay{padding-block:var(--space-md);padding-inline:var(--space-md)}}@container (max-inline-size: 768px){.wc-file-drop-overlay{padding-block:var(--space-sm);padding-inline:var(--space-sm)}}.prompt-input-group{block-size:stretch;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;gap:var(--space-xl);inset:0;max-block-size:stretch;min-block-size:calc-size(min-content,min(size,100%));place-content:center;place-items:center;position:relative}.prompt-input-group[data-dropzone]{position:relative;transition:all var(--motion-normal)}.prompt-input-group .file-drop-zone{align-items:center;display:flex;flex-direction:column;gap:var(--space-lg);pointer-events:none;position:relative;text-align:center}.prompt-input-group .file-drop-zone .drop-zone-content{align-items:center;display:flex;flex-direction:column;gap:var(--space-lg);justify-content:center;opacity:0;transition:all var(--motion-normal);visibility:hidden}.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon{color:var(--color-primary);filter:drop-shadow(0 2px 8px rgba(0,0,0,.15));opacity:.8;transition:all var(--motion-normal)}@container (max-inline-size: 1024px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon[size=\"4rem\"]{--icon-size:3.5rem;block-size:4rem;inline-size:4rem}}@container (max-inline-size: 768px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon[size=\"4rem\"]{--icon-size:3rem;block-size:4rem;inline-size:4rem}}@container (max-inline-size: 480px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon[size=\"4rem\"]{--icon-size:2.5rem;block-size:4rem;inline-size:4rem}}.prompt-input-group .file-drop-zone .drop-zone-content .drop-text{color:var(--color-on-surface);font-size:var(--text-xl);font-variant-emoji:text;font-weight:var(--font-weight-bold);letter-spacing:-.01em;line-height:var(--leading-tight);text-align:center}@container (max-inline-size: 1024px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-text{font-size:var(--text-lg)}}@container (max-inline-size: 768px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-text{font-size:var(--text-base)}}.prompt-input-group .file-drop-zone .drop-zone-content .drop-hint{color:var(--color-on-surface-variant);font-size:var(--text-sm);font-weight:var(--font-weight-medium);line-height:var(--leading-normal);max-inline-size:280px;opacity:.9;text-align:center}@container (max-inline-size: 768px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-hint{font-size:var(--text-xs);max-inline-size:240px}}@container (max-inline-size: 1024px){.prompt-input-group .file-drop-zone .drop-zone-content{gap:var(--space-md)}}@container (max-inline-size: 768px){.prompt-input-group .file-drop-zone .drop-zone-content{gap:var(--space-sm)}}.prompt-input-group .wc-recognized-status{align-items:center;background:color-mix(in oklab,var(--color-success) 5%,#0000);border:none;border-radius:var(--radius-lg);box-shadow:var(--elev-1);color:var(--color-on-surface);display:flex;font-size:var(--text-sm);gap:var(--space-sm);margin-block-start:var(--space-md);padding:var(--space-sm) var(--space-md)}.prompt-input-group .wc-recognized-status .status-icon{color:var(--color-success);flex-shrink:0}.prompt-input-group .wc-recognized-status .clear-recognized{background:#0000;border:none;border-radius:var(--radius-full);box-shadow:none;color:var(--color-on-surface-variant);font-size:var(--text-xs);margin-inline-start:auto;min-block-size:28px;padding:var(--space-xs) var(--space-sm)}.prompt-input-group .wc-recognized-status .clear-recognized:hover{background:color-mix(in oklab,var(--color-error) 5%,#0000);color:var(--color-error)}.prompt-input-group .file-list{box-sizing:border-box;inline-size:stretch;margin-block-start:var(--space-md);max-inline-size:stretch;min-inline-size:0}.prompt-input-group .file-item{background:var(--color-surface-container);border:none;box-shadow:var(--elev-0);padding:var(--space-sm) var(--space-md)}.prompt-input-group .file-item:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.prompt-input-group .file-info{gap:var(--space-md)}.prompt-input-group .file-icon{align-items:center;background:var(--color-surface-container-high);block-size:32px;border-radius:var(--radius-sm);display:flex;inline-size:32px;justify-content:center}.prompt-input-group .file-icon ui-icon{color:var(--color-primary)}@container (max-inline-size: 768px){.prompt-input-group .file-icon{block-size:28px;inline-size:28px}}.prompt-input-group .remove-btn{background:#0000;block-size:24px;border:none;color:var(--color-error);inline-size:24px;padding:0}.prompt-input-group .remove-btn:hover{background:color-mix(in oklab,var(--color-error) 20%,#0000);color:var(--color-error)}@container (max-inline-size: 1024px){.prompt-input-group{gap:var(--space-lg)}}@container (max-inline-size: 768px){.prompt-input-group{gap:var(--space-md)}}.action-section,.prompt-panel,.prompt-section,.prompts-section{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg);padding:var(--space-lg);place-content:center;place-items:center;align-items:stretch}.action-section .prompt-actions,.prompt-panel .prompt-actions,.prompt-section .prompt-actions,.prompts-section .prompt-actions{display:grid;gap:var(--space-md);grid-template-columns:minmax(0,1fr) minmax(0,max-content);grid-template-rows:minmax(max-content,1fr) minmax(max-content,1fr);inline-size:max(60cqi,min(24rem,100%));max-inline-size:stretch;min-inline-size:max-content;place-content:stretch;place-items:center;place-self:center}.action-section .prompt-actions .voice-btn,.prompt-panel .prompt-actions .voice-btn,.prompt-section .prompt-actions .voice-btn,.prompts-section .prompt-actions .voice-btn{align-items:center;background:var(--color-surface-container-high);border:none;border-radius:var(--radius-xl);box-shadow:var(--elev-0);color:var(--color-on-surface);cursor:pointer;display:flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);grid-column:1;grid-row:1;inline-size:stretch;justify-content:center;min-block-size:44px;padding:var(--space-lg);transition:all var(--motion-normal)}.action-section .prompt-actions .voice-btn:hover,.prompt-panel .prompt-actions .voice-btn:hover,.prompt-section .prompt-actions .voice-btn:hover,.prompts-section .prompt-actions .voice-btn:hover{background:var(--color-surface-container-highest);box-shadow:var(--elev-1)}.action-section .prompt-actions .voice-btn:focus,.prompt-panel .prompt-actions .voice-btn:focus,.prompt-section .prompt-actions .voice-btn:focus,.prompts-section .prompt-actions .voice-btn:focus{box-shadow:var(--focus-ring);outline:none}.action-section .prompt-actions .voice-btn.recording,.prompt-panel .prompt-actions .voice-btn.recording,.prompt-section .prompt-actions .voice-btn.recording,.prompts-section .prompt-actions .voice-btn.recording{animation:E 1.5s infinite;background:var(--color-error);color:var(--color-on-error)}.action-section .prompt-actions .voice-btn.recording:before,.prompt-panel .prompt-actions .voice-btn.recording:before,.prompt-section .prompt-actions .voice-btn.recording:before,.prompts-section .prompt-actions .voice-btn.recording:before{animation:F 1s infinite;color:var(--color-on-error);content:\"●\";margin-inline-end:var(--space-sm)}@container (max-inline-size: 768px){.action-section .prompt-actions .voice-btn,.prompt-panel .prompt-actions .voice-btn,.prompt-section .prompt-actions .voice-btn,.prompts-section .prompt-actions .voice-btn{font-size:var(--text-xs);min-block-size:40px}}@container (max-inline-size: 480px){.action-section .prompt-actions .voice-btn,.prompt-panel .prompt-actions .voice-btn,.prompt-section .prompt-actions .voice-btn,.prompts-section .prompt-actions .voice-btn{min-block-size:36px;padding:var(--space-sm)}}.action-section .prompt-actions .auto-action-label,.prompt-panel .prompt-actions .auto-action-label,.prompt-section .prompt-actions .auto-action-label,.prompts-section .prompt-actions .auto-action-label{background:var(--color-surface-container);block-size:44px;border:none;border-radius:var(--radius-lg);box-shadow:var(--elev-0);cursor:pointer;display:flex;grid-column:2;grid-row:1;inline-size:44px;place-content:center;justify-content:center;padding:.5rem;place-items:center;transition:all var(--motion-fast)}.action-section .prompt-actions .auto-action-label>:not(ui-icon),.prompt-panel .prompt-actions .auto-action-label>:not(ui-icon),.prompt-section .prompt-actions .auto-action-label>:not(ui-icon),.prompts-section .prompt-actions .auto-action-label>:not(ui-icon){display:none}.action-section .prompt-actions .auto-action-label ui-icon,.prompt-panel .prompt-actions .auto-action-label ui-icon,.prompt-section .prompt-actions .auto-action-label ui-icon,.prompts-section .prompt-actions .auto-action-label ui-icon{color:var(--color-on-surface-variant);transition:all var(--motion-fast)}.action-section .prompt-actions .auto-action-label input[type=checkbox],.prompt-panel .prompt-actions .auto-action-label input[type=checkbox],.prompt-section .prompt-actions .auto-action-label input[type=checkbox],.prompts-section .prompt-actions .auto-action-label input[type=checkbox]{block-size:1px;inline-size:1px;margin:-1px;opacity:0;overflow:hidden;padding:0;position:absolute;clip:rect(0,0,0,0);border:0;white-space:nowrap}.action-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked),.prompt-panel .prompt-actions .auto-action-label:has(input[type=checkbox]:checked),.prompt-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked),.prompts-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked),input[type=checkbox]:checked~.action-section .prompt-actions .auto-action-label,input[type=checkbox]:checked~.prompt-panel .prompt-actions .auto-action-label,input[type=checkbox]:checked~.prompt-section .prompt-actions .auto-action-label,input[type=checkbox]:checked~.prompts-section .prompt-actions .auto-action-label{background:var(--color-primary);box-shadow:var(--elev-1)}.action-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked) ui-icon,.prompt-panel .prompt-actions .auto-action-label:has(input[type=checkbox]:checked) ui-icon,.prompt-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked) ui-icon,.prompts-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked) ui-icon,input[type=checkbox]:checked~.action-section .prompt-actions .auto-action-label ui-icon,input[type=checkbox]:checked~.prompt-panel .prompt-actions .auto-action-label ui-icon,input[type=checkbox]:checked~.prompt-section .prompt-actions .auto-action-label ui-icon,input[type=checkbox]:checked~.prompts-section .prompt-actions .auto-action-label ui-icon{color:var(--color-on-primary)}.action-section .prompt-actions .auto-action-label:hover,.prompt-panel .prompt-actions .auto-action-label:hover,.prompt-section .prompt-actions .auto-action-label:hover,.prompts-section .prompt-actions .auto-action-label:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.action-section .prompt-actions .auto-action-label:hover:has(input[type=checkbox]:checked),.prompt-panel .prompt-actions .auto-action-label:hover:has(input[type=checkbox]:checked),.prompt-section .prompt-actions .auto-action-label:hover:has(input[type=checkbox]:checked),.prompts-section .prompt-actions .auto-action-label:hover:has(input[type=checkbox]:checked),input[type=checkbox]:checked~.action-section .prompt-actions .auto-action-label:hover,input[type=checkbox]:checked~.prompt-panel .prompt-actions .auto-action-label:hover,input[type=checkbox]:checked~.prompt-section .prompt-actions .auto-action-label:hover,input[type=checkbox]:checked~.prompts-section .prompt-actions .auto-action-label:hover{background:color-mix(in oklab,var(--color-primary) 90%,#000)}.action-section .prompt-actions .auto-action-label:focus-within,.prompt-panel .prompt-actions .auto-action-label:focus-within,.prompt-section .prompt-actions .auto-action-label:focus-within,.prompts-section .prompt-actions .auto-action-label:focus-within{box-shadow:var(--focus-ring);outline:none}@container (max-inline-size: 768px){.action-section .prompt-actions .auto-action-label,.prompt-panel .prompt-actions .auto-action-label,.prompt-section .prompt-actions .auto-action-label,.prompts-section .prompt-actions .auto-action-label{block-size:40px;inline-size:40px}.action-section .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompt-panel .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompt-section .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompts-section .prompt-actions .auto-action-label ui-icon[size=\"20\"]{--size:18px}}@container (max-inline-size: 480px){.action-section .prompt-actions .auto-action-label,.prompt-panel .prompt-actions .auto-action-label,.prompt-section .prompt-actions .auto-action-label,.prompts-section .prompt-actions .auto-action-label{block-size:36px;inline-size:36px}.action-section .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompt-panel .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompt-section .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompts-section .prompt-actions .auto-action-label ui-icon[size=\"20\"]{--size:16px}}.action-section .prompt-actions .action-btn,.prompt-panel .prompt-actions .action-btn,.prompt-section .prompt-actions .action-btn,.prompts-section .prompt-actions .action-btn{align-items:center;background:var(--color-primary);border:none;border-radius:var(--radius-md);color:var(--color-on-primary);cursor:pointer;display:flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs);grid-column:1;grid-row:2;inline-size:stretch;justify-content:center;max-inline-size:stretch;min-block-size:44px;padding:var(--space-md) var(--space-lg);transition:all var(--motion-normal)}.action-section .prompt-actions .action-btn:hover,.prompt-panel .prompt-actions .action-btn:hover,.prompt-section .prompt-actions .action-btn:hover,.prompts-section .prompt-actions .action-btn:hover{background:color-mix(in oklab,var(--color-primary) 85%,#000);box-shadow:var(--elev-1);transform:translateY(-1px)}.action-section .prompt-actions .action-btn:focus,.prompt-panel .prompt-actions .action-btn:focus,.prompt-section .prompt-actions .action-btn:focus,.prompts-section .prompt-actions .action-btn:focus{box-shadow:var(--focus-ring);outline:none}.action-section .prompt-actions .action-btn:disabled,.prompt-panel .prompt-actions .action-btn:disabled,.prompt-section .prompt-actions .action-btn:disabled,.prompts-section .prompt-actions .action-btn:disabled{background:var(--color-surface-container-high);box-shadow:var(--elev-0);color:var(--color-on-surface-variant);cursor:not-allowed;transform:none}@container (max-inline-size: 768px){.action-section .prompt-actions .action-btn ui-icon[size=\"20\"],.prompt-panel .prompt-actions .action-btn ui-icon[size=\"20\"],.prompt-section .prompt-actions .action-btn ui-icon[size=\"20\"],.prompts-section .prompt-actions .action-btn ui-icon[size=\"20\"]{--icon-size:16px}}@container (max-inline-size: 640px){.action-section .prompt-actions .action-btn .btn-text,.prompt-panel .prompt-actions .action-btn .btn-text,.prompt-section .prompt-actions .action-btn .btn-text,.prompts-section .prompt-actions .action-btn .btn-text{display:none}}@container (max-inline-size: 768px){.action-section .prompt-actions .action-btn,.prompt-panel .prompt-actions .action-btn,.prompt-section .prompt-actions .action-btn,.prompts-section .prompt-actions .action-btn{min-block-size:40px;padding:var(--space-sm) var(--space-md)}}@container (max-inline-size: 480px){.action-section .prompt-actions .action-btn,.prompt-panel .prompt-actions .action-btn,.prompt-section .prompt-actions .action-btn,.prompts-section .prompt-actions .action-btn{font-size:var(--text-xs);min-block-size:36px;padding:var(--space-xs) var(--space-sm)}}.action-section .prompt-actions .clear-btn,.prompt-panel .prompt-actions .clear-btn,.prompt-section .prompt-actions .clear-btn,.prompts-section .prompt-actions .clear-btn{align-items:center;aspect-ratio:auto;background:var(--color-surface-container);block-size:max-content;border:none;border-radius:var(--radius-md);color:var(--color-on-surface);cursor:pointer;display:flex;grid-column:2;grid-row:2;inline-size:stretch;justify-content:center;max-block-size:fit-content;max-inline-size:stretch;min-block-size:2.5rem;min-inline-size:44px;transition:all var(--motion-fast)}.action-section .prompt-actions .clear-btn:hover,.prompt-panel .prompt-actions .clear-btn:hover,.prompt-section .prompt-actions .clear-btn:hover,.prompts-section .prompt-actions .clear-btn:hover{background:var(--color-error-container);color:var(--color-on-error-container)}.action-section .prompt-actions .clear-btn:focus,.prompt-panel .prompt-actions .clear-btn:focus,.prompt-section .prompt-actions .clear-btn:focus,.prompts-section .prompt-actions .clear-btn:focus{box-shadow:var(--focus-ring);outline:none}@container (max-inline-size: 768px){.action-section .prompt-actions .clear-btn,.prompt-panel .prompt-actions .clear-btn,.prompt-section .prompt-actions .clear-btn,.prompts-section .prompt-actions .clear-btn{min-block-size:40px;min-inline-size:40px}}@container (max-inline-size: 480px){.action-section .prompt-actions .clear-btn,.prompt-panel .prompt-actions .clear-btn,.prompt-section .prompt-actions .clear-btn,.prompts-section .prompt-actions .clear-btn{min-block-size:36px;min-inline-size:36px}}@container (max-inline-size: 1024px){.action-section,.prompt-panel,.prompt-section,.prompts-section{padding:var(--space-md)}}@container (max-inline-size: 768px){.action-section,.prompt-panel,.prompt-section,.prompts-section{padding:var(--space-sm)}}.wc-block-header{align-items:center;display:flex;flex-direction:row;flex-wrap:wrap;gap:var(--space-md);inline-size:stretch;justify-content:space-between;max-inline-size:stretch}.wc-block-header h3{color:var(--color-on-surface);flex-basis:fit-content;flex-grow:1;flex-shrink:1;font-size:var(--text-lg);font-weight:var(--font-weight-medium);margin:0}.wc-block-header .prompt-actions{align-items:center;flex-wrap:wrap;gap:var(--space-xs)}.instruction-panel,.prompt-panel{display:flex;flex-direction:column;gap:var(--space-md)}.instruction-panel .instruction-help{background:var(--color-surface-container-high);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);font-size:var(--text-xs);padding:var(--space-sm)}.prompt-panel .prompt-actions{align-items:center;flex-wrap:wrap;gap:var(--space-sm)}.prompt-panel .auto-action-label,.prompt-panel .clear-btn,.prompt-panel .prompt-attach-btn{flex:0 0 auto}.prompt-panel .voice-btn{flex:1 1 14rem;inline-size:auto;justify-content:center;max-inline-size:100%;min-inline-size:12rem}.prompt-panel .action-btn{flex:0 0 auto;min-inline-size:10.5rem}@container (max-inline-size: 760px){.prompt-panel .voice-btn{flex-basis:100%;min-inline-size:0}.prompt-panel .action-btn{flex:1 1 auto;min-inline-size:0}}.prompt-attach-btn{align-items:center;background:var(--color-surface-container);border:1px solid var(--color-outline-variant);display:inline-flex;gap:var(--space-xs);justify-content:center;min-block-size:44px;min-inline-size:44px}.prompt-attach-btn .attach-count{background:var(--color-primary-container);border-radius:var(--radius-full);color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-weight-semibold);min-inline-size:1.35rem;padding:0 .35rem;text-align:center}.prompt-input-group[data-prompt-dropzone]{border:2px dashed #0000;border-radius:var(--radius-md);position:relative;transition:border-color var(--motion-fast),background-color var(--motion-fast)}.prompt-input-group[data-prompt-dropzone].drag-over{background:color-mix(in oklab,var(--color-primary) 7%,#0000);border-color:var(--color-primary)}.prompt-input-overlay{align-items:center;background:color-mix(in oklab,var(--color-primary) 12%,var(--color-surface-container-high));block-size:stretch;border-radius:var(--radius-sm);color:var(--color-on-surface);display:flex;gap:var(--space-xs);inline-size:stretch;inset:0;justify-content:center;opacity:0;pointer-events:none;position:absolute!important;transition:opacity var(--motion-fast),visibility var(--motion-fast);visibility:hidden;z-index:3}.prompt-input-overlay.visible{opacity:1;visibility:visible}.prompt-actions .btn,.prompt-actions .clear-btn,.prompt-actions .icon-btn,.prompt-panel .btn,.prompt-panel .clear-btn,.prompt-panel .icon-btn{block-size:max-content;max-inline-size:fit-content;min-block-size:fit-content;min-inline-size:0;padding:var(--space-sm) var(--space-md)}.prompt-actions .clear-btn,.prompt-actions .voice-btn,.prompt-panel .clear-btn,.prompt-panel .voice-btn{aspect-ratio:auto;inline-size:auto;max-inline-size:stretch}.wc-attachments-section{block-size:fit-content;display:flex;flex-basis:fit-content;flex-grow:1;flex-shrink:1;max-block-size:stretch}.file-attachment-area,.wc-attachments-section{flex-direction:column;gap:var(--space-md);min-block-size:fit-content}.file-attachment-area{block-size:stretch;display:grid;flex:1;flex-basis:fit-content;flex-grow:1;flex-shrink:1;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);inline-size:stretch;max-inline-size:stretch;min-inline-size:0;overflow-x:hidden;pointer-events:auto}.file-attachment-area>*{grid-area:1/1;grid-column:1/-1;grid-row:1/-1}.file-attachment-area .file-list{block-size:stretch;box-sizing:border-box;flex-basis:fit-content;flex-grow:1;flex-shrink:1;inline-size:stretch;max-inline-size:stretch;min-inline-size:0;pointer-events:none;z-index:2}.file-attachment-area .file-item{pointer-events:none}.file-attachment-area button{pointer-events:auto}.file-attachment-area .file-list:empty,.file-attachment-area .file-list:has(.wc-attachments-empty),.file-attachment-area:has(.file-list .file-item) .file-drop-zone{display:none!important;pointer-events:none!important;visibility:hidden!important}.file-drop-zone{align-items:center;block-size:stretch;border-radius:var(--radius-lg);cursor:pointer;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:1;gap:var(--space-md);justify-content:center;min-block-size:8rem;overflow:auto;pointer-events:none;position:relative;transition:all var(--motion-normal)}[data-dropzone]{background:var(--color-surface-container-low);border:2px dashed color-mix(in oklab,var(--color-outline-variant) 40%,#0000);border-radius:var(--radius-sm)}[data-dropzone]:hover{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container-low));border-color:color-mix(in oklab,var(--color-primary) 40%,#0000)}[data-dropzone].drag-over{background:color-mix(in oklab,var(--color-primary) 10%,var(--color-surface-container-low));border-color:var(--color-primary);box-shadow:var(--focus-ring)}[data-dropzone].drag-over:before{background:linear-gradient(45deg,color-mix(in oklab,var(--color-primary) 5%,#0000) 25%,#0000 25%,#0000 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 75%,#0000 75%);background-size:20px 20px;border-radius:inherit;content:\"\";inset:0;pointer-events:none;position:absolute;z-index:1}[data-dropzone].drag-over>*{position:relative;z-index:2}.drop-zone-content{align-items:center;block-size:max-content;display:flex;flex-direction:column;gap:var(--space-md);text-align:center}.drop-icon{color:var(--color-primary);opacity:.7}.drop-text{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:500}.drop-hint{color:var(--color-on-surface-variant);font-size:var(--text-sm);opacity:.8}.file-list{block-size:max-content;box-sizing:border-box;flex:1;max-block-size:stretch;min-block-size:0;overflow-x:hidden;overflow-y:auto}.file-item,.file-list{inline-size:stretch;max-inline-size:stretch;min-inline-size:0}.file-item{align-items:center;align-self:safe center;background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);display:grid;gap:var(--space-sm);grid-template-columns:[info] minmax(0,1fr) [button] minmax(0,2rem);grid-template-rows:minmax(0,1fr);margin-block-end:var(--space-xs);overflow:hidden;padding:var(--space-sm);place-content:center;align-content:safe center;justify-content:safe center;place-items:center;justify-items:safe center}.file-item .file-info{grid-column:info;grid-row:1/-1}.file-item .remove-btn{aspect-ratio:auto;block-size:stretch;box-sizing:border-box;grid-column:button;grid-row:1/-1;inline-size:stretch;max-block-size:min(2rem,100%)!important;max-inline-size:min(2rem,100%)!important;padding:0}.file-item:hover{background:var(--color-surface-container-highest)}.file-info{align-self:safe center;display:grid;flex:1;gap:var(--space-sm);grid-template-columns:[icon] minmax(0,2rem) [details] minmax(0,1fr);grid-template-rows:minmax(0,1fr);inline-size:stretch;max-inline-size:stretch;min-inline-size:0;overflow:hidden;place-content:center;align-content:safe center;justify-content:safe center;place-items:center;justify-items:safe center;text-align:start;text-overflow:ellipsis;white-space:nowrap}.file-info .file-icon,.file-info .file-preview{grid-column:icon;grid-row:1/-1}.file-info .file-details{grid-column:details;grid-row:1/-1}.file-info:has(.file-preview) .file-icon{display:none!important}.file-icon,.file-preview{flex-shrink:0}.file-preview{aspect-ratio:1/1;block-size:2rem;border-radius:var(--radius-sm);inline-size:2rem;object-fit:cover;object-position:center}.file-details{display:grid;gap:var(--space-xs);grid-template-columns:[name] minmax(0,1fr) [size] minmax(0,max-content) [type] minmax(0,max-content);grid-template-rows:minmax(0,1fr);inline-size:stretch;justify-self:start;max-inline-size:stretch;min-inline-size:fit-content;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-details .file-name{grid-column:name;grid-row:1/-1}.file-details .file-size{grid-column:size;grid-row:1/-1}.file-details .file-type{grid-column:type;grid-row:1/-1}.file-name{color:var(--color-on-surface);font-size:var(--text-sm);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-size,.file-type{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.remove-btn{background:var(--color-error-container);border:none;border-radius:var(--radius-sm);color:var(--color-on-error-container);cursor:pointer;flex-shrink:0;font-size:var(--text-sm);line-height:1;padding:var(--space-xs)}.remove-btn:hover{background:var(--color-error);color:var(--color-on-error)}.wc-attachments-toolbar{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-sm) var(--space-md);justify-content:space-between}.file-actions{align-items:center;display:flex;gap:var(--space-md);inline-size:auto;justify-content:flex-start;max-inline-size:100%;min-inline-size:max-content;place-self:center}.file-stats{align-items:center;background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);display:flex;flex-direction:row;flex-grow:1;flex-wrap:wrap;gap:var(--space-sm);padding:var(--space-sm)}.file-stats .data-counter,.file-stats .file-counter{align-items:center;border-radius:var(--radius-md);display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs);inline-size:max-content;padding:var(--space-xs) var(--space-sm)}.file-stats .data-counter .count,.file-stats .file-counter .count{min-inline-size:1ch;text-align:center}.file-stats .file-counter{background:var(--color-surface-container-high);border:1px solid color-mix(in oklab,var(--color-outline-variant) 30%,#0000);color:var(--color-on-surface-variant);min-inline-size:calc-size(fit-content,max(size,25px) + .5rem + var(--icon-size,1rem))}.file-stats .file-counter ui-icon{color:var(--color-primary);opacity:.8}.file-stats .file-counter .count{color:var(--color-primary);font-weight:600}.file-stats .file-counter .label{font-size:var(--text-xs)}}@layer view.workcenter.components{.file-stats .file-counter:has(.count:empty),.file-stats .file-counter:has(.count:not([data-count]):not(:has-text):not([data-count=\"0\"]):not(:has(.count:empty))){display:none}.file-stats .data-counter{min-inline-size:1.5rem}.file-stats .data-counter ui-icon{font-size:var(--text-sm)}.file-stats .data-counter.recognized{background:var(--color-secondary-container);border:1px solid var(--color-secondary)}.file-stats .data-counter.recognized,.file-stats .data-counter.recognized ui-icon{color:var(--color-on-secondary-container)}.file-stats .data-counter.processed{background:var(--color-tertiary-container);border:1px solid var(--color-tertiary)}.file-stats .data-counter.processed,.file-stats .data-counter.processed ui-icon{color:var(--color-on-tertiary-container)}.wc-recognized-status{align-items:center;background:color-mix(in oklab,var(--color-tertiary) 10%,var(--color-surface-container-high));border:1px solid color-mix(in oklab,var(--color-tertiary) 30%,#0000);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);display:flex;font-size:var(--text-sm);gap:var(--space-sm);padding:var(--space-sm)}.wc-recognized-status .status-icon{color:var(--color-tertiary);flex-shrink:0}.wc-recognized-status .clear-recognized{background:var(--color-tertiary-container);border:none;border-radius:var(--radius-sm);color:var(--color-on-tertiary-container);cursor:pointer;font-size:var(--text-xs);margin-inline-start:auto;padding:var(--space-xs) var(--space-sm)}.wc-recognized-status .clear-recognized:hover{background:var(--color-tertiary);color:var(--color-on-tertiary)}.wc-output-section{block-size:fit-content;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:1;gap:var(--space-md);max-block-size:stretch;min-block-size:fit-content;overflow:hidden;place-content:center;align-content:stretch;justify-content:stretch;place-items:center}.wc-output-section>*{inline-size:stretch}.wc-output-content{background:var(--color-surface-container-low);block-size:fit-content;border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);color:var(--color-on-surface);contain:strict;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:1;font-family:var(--font-family);gap:var(--space-md);line-height:1.6;max-block-size:stretch;min-block-size:fit-content;overflow:auto;padding:var(--space-md);position:relative;text-wrap:pretty;transition:all var(--motion-normal)}.wc-output-content:has(.result-content){min-block-size:10rem}.wc-output-content[data-dropzone]{background:var(--color-surface-container-low);border:2px dashed color-mix(in oklab,var(--color-outline-variant) 30%,#0000);min-block-size:6rem;padding:var(--space-md)}.wc-output-content[data-dropzone]:has(.result-content){border-color:var(--color-outline-variant);border-style:solid;min-block-size:10rem}.wc-output-content[data-dropzone]:hover{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container-low));border-color:color-mix(in oklab,var(--color-primary) 40%,#0000)}.wc-output-content[data-dropzone].drag-over{background:color-mix(in oklab,var(--color-primary) 10%,var(--color-surface-container-low));border-color:var(--color-primary);box-shadow:var(--focus-ring)}.wc-output-content[data-dropzone].drag-over:before{background:linear-gradient(45deg,color-mix(in oklab,var(--color-primary) 5%,#0000) 25%,#0000 25%,#0000 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 75%,#0000 75%);background-size:20px 20px;border-radius:inherit;content:\"\";inset:0;pointer-events:none;position:absolute;z-index:1}.wc-output-content[data-dropzone].drag-over>*{position:relative;z-index:2}.history-section .result-actions,.pipeline-actions,.step-actions,.wc-output-actions{align-items:center;display:flex;gap:var(--space-xs)}.pipeline-actions .btn,.wc-output-actions .btn{font-size:var(--text-sm);min-inline-size:auto;padding:var(--space-xs) var(--space-sm)}.results-tabs-header{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-sm);justify-content:flex-start}.results-tabs-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:600;margin:0;white-space:nowrap}.results-tab-actions{margin-inline-start:var(--space-sm)}.wc-output-header{display:flex;justify-content:flex-end;margin-inline-start:auto}.step-actions{margin-block-start:var(--space-xs)}.step-actions .btn{font-size:var(--text-xs);min-inline-size:auto;padding:var(--space-xs) var(--space-sm)}.history-section{block-size:fit-content;display:flex;flex-basis:fit-content;flex-direction:column;flex-grow:1;flex-shrink:1;gap:var(--space-sm);max-block-size:stretch}.history-section .result-actions .btn{font-size:var(--text-xs);min-inline-size:auto;padding:var(--space-xs) var(--space-sm)}.result-content{background:var(--color-surface-container-high);border-radius:var(--radius-md);color:var(--color-on-surface);font-family:var(--font-family);line-height:1.6;overflow-wrap:break-word;padding:var(--space-md);word-wrap:break-word}.result-content pre{background:var(--color-surface-container-low);border:1px solid var(--color-outline);border-radius:var(--radius-sm);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:1.4;margin:var(--space-sm) 0;overflow-x:auto;padding:var(--space-sm)}.result-content pre code{background:#0000;border:none;border-radius:0;font-size:inherit;padding:0}.result-content code{background:var(--color-surface-container-low);border:1px solid var(--color-outline);border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:.875em;padding:.125em .25em}.result-content .katex{font-size:1em}.result-content .katex-display{margin:var(--space-md) 0;text-align:center}.result-content table{background:var(--color-surface-container-high);border:1px solid var(--color-outline);border-collapse:collapse;border-radius:var(--radius-md);inline-size:100%;margin:var(--space-md) 0;overflow:hidden}.result-content table td,.result-content table th{border-block-end:1px solid var(--color-outline);border-inline-end:1px solid var(--color-outline);padding:var(--space-sm);text-align:start}.result-content table td:last-child,.result-content table th:last-child{border-inline-end:none}.result-content table th{background:var(--color-surface-container-low);color:var(--color-on-surface);font-weight:600}.result-content table tr:last-child td{border-block-end:none}.result-content ol,.result-content ul{margin:var(--space-sm) 0;padding-inline-start:var(--space-lg)}.result-content ol li,.result-content ul li{line-height:1.6;margin:var(--space-xs) 0}.result-content blockquote{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container-low));border-inline-start:4px solid var(--color-primary);border-radius:0 var(--radius-sm) var(--radius-sm) 0;color:var(--color-on-surface-variant);font-style:italic;margin:var(--space-md) 0;padding:var(--space-sm) var(--space-md)}.result-content a{color:var(--color-primary);text-decoration:underline}.result-content a:hover{background:color-mix(in oklab,var(--color-primary) 10%,#0000);color:var(--color-primary-container)}.result-content a:focus{outline:2px solid var(--color-primary);outline-offset:2px}.result-content img{block-size:auto;border-radius:var(--radius-sm);margin:var(--space-sm) 0;max-inline-size:100%}.result-content h1,.result-content h2,.result-content h3,.result-content h4,.result-content h5,.result-content h6{color:var(--color-on-surface);line-height:1.3;margin:var(--space-lg) 0 var(--space-sm)}.result-content h1:first-child,.result-content h2:first-child,.result-content h3:first-child,.result-content h4:first-child,.result-content h5:first-child,.result-content h6:first-child{margin-block-start:0}.result-content h1{font-size:var(--text-3xl);font-weight:700}.result-content h2{font-size:var(--text-2xl);font-weight:600}.result-content h3{font-size:var(--text-xl);font-weight:600}.result-content h4{font-size:var(--text-lg);font-weight:600}.result-content h5{font-size:var(--text-base);font-weight:600}.result-content h6{font-size:var(--text-sm);font-weight:600}.result-content p{margin:var(--space-sm) 0}.result-content p:first-child{margin-block-start:0}.result-content p:last-child{margin-block-end:0}.result-content hr{border:none;border-block-start:1px solid var(--color-outline);margin:var(--space-lg) 0}.code-result,.raw-result{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:1.5;margin:0;overflow:auto;padding:var(--space-md);white-space:pre}.data-pipeline-section{block-size:stretch;min-block-size:0}.pipeline-header{align-items:center;display:flex;gap:var(--space-sm);justify-content:space-between;margin-block-end:var(--space-sm)}.pipeline-header h3{color:var(--color-on-surface);font-size:var(--text-base);font-weight:600;margin:0}.pipeline-content{display:flex;flex-direction:column;gap:var(--space-sm)}.pipeline-actions{justify-content:flex-end}.pipeline-steps{max-block-size:stretch;overflow-x:hidden;overflow-y:auto;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.pipeline-step,.pipeline-steps{display:flex;flex-direction:column;gap:var(--space-sm)}.pipeline-step{background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-sm);transition:all var(--motion-fast)}.pipeline-step:hover{background:var(--color-surface-container-highest);border-color:var(--color-primary)}.pipeline-step.recognized-step{background:color-mix(in oklab,var(--color-secondary) 5%,var(--color-surface-container-high));border-color:var(--color-secondary)}.pipeline-step.processed-step{background:color-mix(in oklab,var(--color-tertiary) 5%,var(--color-surface-container-high));border-color:var(--color-tertiary)}.step-header{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-sm)}.step-icon{color:var(--color-primary);flex-shrink:0}.step-title{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);font-weight:600}.step-format,.step-source,.step-time{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.step-content{border-inline-start:2px solid var(--color-outline);padding-inline-start:var(--space-lg)}.step-preview{color:var(--color-on-surface-variant);display:-webkit-box;font-size:var(--text-sm);-webkit-line-clamp:3;line-height:1.4;-webkit-box-orient:vertical;overflow:hidden}.history-header{align-items:center;background:var(--color-surface-container-high);border-radius:var(--radius-md);display:grid;gap:var(--space-md);grid-template-columns:1fr max-content;padding:var(--space-sm) var(--space-md)}.history-header h4{color:var(--color-on-surface);font-size:var(--text-base);font-weight:var(--font-weight-semibold);letter-spacing:-.01em;margin:0}.recent-history{display:flex;flex-direction:column;gap:var(--space-xs);max-block-size:300px;overflow-y:auto}.history-item-compact{align-items:center;background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);display:flex;gap:var(--space-sm);justify-content:space-between;padding:var(--space-sm);transition:all var(--motion-fast)}.history-item-compact:hover{background:var(--color-surface-container-highest);border-color:var(--color-primary)}.history-meta{align-items:center;display:flex;flex:1;gap:var(--space-sm);min-inline-size:0}.history-status{flex-shrink:0;font-size:var(--text-sm);font-weight:600}.history-status.success{color:var(--color-tertiary)}.history-status.error{color:var(--color-error)}.history-prompt{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history-time{flex-shrink:0;font-size:var(--text-xs)}.history-time,.wc-loading{color:var(--color-on-surface-variant)}.wc-loading{align-items:center;display:flex;font-size:var(--text-base);gap:var(--space-sm);justify-content:center;padding:var(--space-xl)}.wc-loading:before{animation:B 1s linear infinite;block-size:20px;border:2px solid var(--color-primary);border-block-start-color:#0000;border-radius:50%;content:\"\";inline-size:20px}.error{background:color-mix(in oklab,var(--color-error) 10%,var(--color-surface-container-high));border:1px solid var(--color-error);border-radius:var(--radius-md);color:var(--color-error);font-size:var(--text-sm);padding:var(--space-md)}.wc-attachments-empty,.wc-history-empty,.wc-results-empty{align-items:center;color:var(--color-on-surface-variant);display:flex;font-size:var(--text-sm);font-style:italic;justify-content:center;padding:var(--space-lg)}.wc-results-empty{font-size:var(--text-base);padding:var(--space-xl)}}@layer view.workcenter.components{@container (max-inline-size: 768px){.results-tabs-header h3{display:none}.results-tab-actions{inline-size:auto;margin-inline-start:0}.results-tab-actions .tab-btn{flex:initial}.result-content{padding:var(--space-sm)}.step-header{align-items:flex-start;flex-direction:column;gap:var(--space-xs)}.history-header h4{font-size:var(--text-sm)}}}@layer view.workcenter.components{.action-details-modal,.action-history-modal,.template-editor-modal{align-items:center;display:flex;inset:0;justify-content:center;padding:var(--space-md);position:fixed;z-index:6}.action-details-modal,.action-history-modal{background:#00000080}.template-editor-modal{animation:C var(--motion-fast) ease;backdrop-filter:blur(4px);background:color-mix(in oklab,#000 40%,#0000)}.action-details-modal .modal-content,.action-history-modal .modal-content,.template-editor-modal .modal-content{background:var(--color-surface-container-high);border-radius:var(--radius-lg);box-shadow:var(--elev-4);display:flex;flex-direction:column;inline-size:100%;max-block-size:80vh;overflow:hidden}.action-details-modal .modal-content,.action-history-modal .modal-content{max-inline-size:90vw}.action-details-modal .modal-header,.action-history-modal .modal-header{align-items:center;background:var(--color-surface-container-low);border-block-end:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;padding:var(--space-lg)}.action-details-modal .modal-header h3,.action-history-modal .modal-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.action-details-modal .modal-header .modal-actions,.action-history-modal .modal-header .modal-actions{align-items:center;display:flex;gap:var(--space-sm)}.action-details-modal .modal-body,.action-history-modal .modal-body{flex:1;overflow-y:auto;padding:var(--space-lg)}@container (max-inline-size: 768px){.action-details-modal .modal-content,.action-history-modal .modal-content{max-block-size:90vh;max-inline-size:95vw}}.template-editor-modal .modal-content{animation:D var(--motion-normal) ease;max-inline-size:640px;padding:var(--space-xl)}@container (max-inline-size: 768px){.template-editor-modal .modal-content{max-block-size:90vh;max-inline-size:95vw;padding:var(--space-lg)}}.template-editor-modal .modal-content .modal-header{display:grid;gap:var(--space-xs);margin-block-end:var(--space-lg)}.template-editor-modal .modal-content .modal-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.template-editor-modal .modal-content .modal-header .modal-desc{color:var(--color-on-surface-variant);font-size:var(--text-xs);line-height:1.5;margin:0;opacity:.85}.template-editor-modal .modal-content>h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-lg) 0}.template-editor-modal .modal-content .template-list{display:flex;flex:1;flex-direction:column;gap:var(--space-md);overflow-y:auto;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.template-editor-modal .modal-content .template-list .template-item{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);transition:border-color var(--motion-fast)}.template-editor-modal .modal-content .template-list .template-item:hover{border-color:var(--color-primary)}.template-editor-modal .modal-content .template-list .template-item .template-item-header{align-items:center;display:flex;gap:var(--space-sm)}.template-editor-modal .modal-content .template-list .template-item input,.template-editor-modal .modal-content .template-list .template-item textarea{background:var(--color-surface);border:1px solid var(--color-outline);border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:inherit;font-size:var(--text-sm);padding:var(--space-sm);transition:border-color var(--motion-fast)}.template-editor-modal .modal-content .template-list .template-item input:focus,.template-editor-modal .modal-content .template-list .template-item textarea:focus{border-color:var(--color-primary);box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 20%,#0000);outline:none}.template-editor-modal .modal-content .template-list .template-item input::placeholder,.template-editor-modal .modal-content .template-list .template-item textarea::placeholder{color:var(--color-on-surface-variant);opacity:.6}.template-editor-modal .modal-content .template-list .template-item input{flex:1;font-weight:var(--font-weight-medium)}.template-editor-modal .modal-content .template-list .template-item textarea{font-family:var(--font-family-mono);line-height:1.5;min-block-size:80px;resize:vertical}.template-editor-modal .modal-content .template-list .template-item .remove-template{align-items:center;background:#0000;border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);cursor:pointer;display:flex;flex-shrink:0;font-size:var(--text-sm);justify-content:center;min-block-size:28px;min-inline-size:28px;padding:var(--space-xs);transition:all var(--motion-fast)}.template-editor-modal .modal-content .template-list .template-item .remove-template:hover{background:color-mix(in oklab,var(--color-error) 12%,#0000);border-color:var(--color-error);color:var(--color-error)}.template-editor-modal .modal-content .modal-actions{align-items:center;block-size:max-content;border-block-start:1px solid var(--color-outline-variant);display:flex;gap:var(--space-sm);justify-content:space-between;max-block-size:stretch;padding-block-start:var(--space-lg)}.template-editor-modal .modal-content .modal-actions .modal-actions-group{align-items:center;block-size:max-content;display:flex;flex-wrap:wrap;gap:var(--space-sm);max-block-size:stretch}.template-editor-modal .modal-content .modal-actions .modal-actions-group-start{block-size:max-content;flex:1 1 320px;max-block-size:max-content}.template-editor-modal .modal-content .modal-actions .modal-actions-group-end{justify-content:flex-end}.template-editor-modal .modal-content .modal-actions .btn{align-items:center;border-radius:var(--radius-md);cursor:pointer;display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs);justify-content:center;line-height:1;min-block-size:2.25rem;padding:var(--space-sm) var(--space-lg);transition:all var(--motion-fast);white-space:nowrap}.template-editor-modal .modal-content .modal-actions .btn.primary{background:var(--color-primary);border:1px solid var(--color-primary);color:var(--color-on-primary)}.template-editor-modal .modal-content .modal-actions .btn.primary:hover{background:color-mix(in oklab,var(--color-primary) 90%,#000)}.template-editor-modal .modal-content .modal-actions .btn:not(.primary){background:var(--color-surface-container);border:1px solid var(--color-outline);color:var(--color-on-surface)}.template-editor-modal .modal-content .modal-actions .btn:not(.primary):hover{background:var(--color-surface-container-high)}@container (max-inline-size: 560px){.template-editor-modal .modal-content .modal-actions{align-items:stretch;flex-direction:column}.template-editor-modal .modal-content .modal-actions .modal-actions-group{inline-size:100%}.template-editor-modal .modal-content .modal-actions .btn{flex:1 1 calc(50% - var(--space-sm))}}.action-history-modal .history-stats{display:flex;gap:var(--space-md);margin-block-end:var(--space-lg)}@container (max-inline-size: 768px){.action-history-modal .history-stats{flex-direction:column;gap:var(--space-sm)}}.action-history-modal .history-stats .stat-card{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);flex:1;padding:var(--space-md);text-align:center}.action-history-modal .history-stats .stat-card .stat-value{color:var(--color-on-surface);display:block;font-size:var(--text-2xl);font-weight:var(--font-weight-bold);margin-block-end:var(--space-xs)}.action-history-modal .history-stats .stat-card .stat-value.success{color:var(--color-success)}.action-history-modal .history-stats .stat-card .stat-value.error{color:var(--color-error)}.action-history-modal .history-stats .stat-card .stat-label{color:var(--color-on-surface-variant);font-size:var(--text-sm);font-weight:var(--font-weight-medium)}.action-history-modal .history-filters{display:flex;gap:var(--space-md);margin-block-end:var(--space-lg)}@container (max-inline-size: 768px){.action-history-modal .history-filters{flex-direction:column;gap:var(--space-sm)}}.action-history-modal .history-filters .filter-select{background:var(--color-surface-container);border:1px solid var(--color-outline);border-radius:var(--radius-md);color:var(--color-on-surface);cursor:pointer;font-size:var(--text-sm);padding:var(--space-sm)}.action-history-modal .history-filters .filter-select:focus{border-color:var(--color-primary);outline:none}.action-history-modal .action-history-list{display:flex;flex:1;flex-direction:column;gap:var(--space-sm);overflow-y:auto}.action-history-modal .action-history-list .wc-history-empty{color:var(--color-on-surface-variant);font-style:italic;padding:var(--space-xl);text-align:center}.action-history-modal .action-history-list .action-history-item{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-md);transition:all var(--motion-fast)}.action-history-modal .action-history-list .action-history-item:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.action-history-modal .action-history-list .action-history-item.completed{border-color:var(--color-success)}.action-history-modal .action-history-list .action-history-item.failed{border-color:var(--color-error)}.action-history-modal .action-history-list .action-history-item.processing{animation:E 2s infinite;border-color:var(--color-primary)}.action-history-modal .action-history-list .action-history-item .action-header{align-items:flex-start;display:flex;gap:var(--space-sm);justify-content:space-between;margin-block-end:var(--space-sm)}@container (max-inline-size: 768px){.action-history-modal .action-history-list .action-history-item .action-header{align-items:stretch;flex-direction:column}}.action-history-modal .action-history-list .action-history-item .action-header .action-meta{display:flex;flex:1;flex-direction:column;gap:var(--space-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status{align-items:center;display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{block-size:8px;border-radius:50%;content:\"\";inline-size:8px}.completed .action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{background:var(--color-success)}.failed .action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{background:var(--color-error)}.processing .action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{animation:F 1s infinite;background:var(--color-primary)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-type{color:var(--color-on-surface);font-size:var(--text-sm);font-weight:var(--font-weight-semibold)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-time{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-duration{color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}.action-history-modal .action-history-list .action-history-item .action-header .action-actions{display:flex;flex-shrink:0;gap:var(--space-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-actions .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content{display:flex;flex-direction:column;gap:var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content .input-preview,.action-history-modal .action-history-list .action-history-item .action-content .result-preview{font-size:var(--text-sm)}.action-history-modal .action-history-list .action-history-item .action-content .input-preview strong,.action-history-modal .action-history-list .action-history-item .action-content .result-preview strong{color:var(--color-on-surface);font-weight:var(--font-weight-semibold)}.action-history-modal .action-history-list .action-history-item .action-content .input-preview .result-content,.action-history-modal .action-history-list .action-history-item .action-content .result-preview .result-content{background:var(--color-surface);border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-xs);margin-block-start:var(--space-xs);max-block-size:200px;overflow-y:auto;padding:var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content .error-preview{background:color-mix(in oklab,var(--color-error) 10%,#0000);border:1px solid color-mix(in oklab,var(--color-error) 30%,#0000);border-radius:var(--radius-sm);color:var(--color-error);font-size:var(--text-sm);padding:var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content .error-preview strong{color:var(--color-error)}.action-details-modal .details-grid{display:grid;gap:var(--space-md);grid-template-columns:1fr 1fr;margin-block-end:var(--space-lg)}@container (max-inline-size: 768px){.action-details-modal .details-grid{gap:var(--space-sm);grid-template-columns:1fr}}.action-details-modal .details-grid .detail-item{display:flex;flex-direction:column;gap:var(--space-xs)}.action-details-modal .details-grid .detail-item label{color:var(--color-on-surface);font-size:var(--text-sm);font-weight:var(--font-weight-semibold)}.action-details-modal .details-grid .detail-item span{color:var(--color-on-surface-variant);font-family:var(--font-family-mono);font-size:var(--text-sm)}.action-details-modal .details-grid .detail-item span.status-completed{color:var(--color-success)}.action-details-modal .details-grid .detail-item span.status-failed{color:var(--color-error)}.action-details-modal .details-grid .detail-item span.status-processing{color:var(--color-primary)}.action-details-modal .details-section{margin-block-end:var(--space-lg)}.action-details-modal .details-section:last-child{margin-block-end:0}.action-details-modal .details-section h4{color:var(--color-on-surface);font-size:var(--text-base);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-md) 0}.action-details-modal .details-section .input-details,.action-details-modal .details-section .result-details{color:var(--color-on-surface-variant);font-size:var(--text-sm);line-height:1.5}.action-details-modal .details-section .error-details{background:color-mix(in oklab,var(--color-error) 10%,#0000);border:1px solid color-mix(in oklab,var(--color-error) 30%,#0000);border-radius:var(--radius-md);color:var(--color-error);font-family:var(--font-family-mono);font-size:var(--text-sm);padding:var(--space-md)}.history-section .history-header{align-items:center;display:flex;justify-content:space-between;margin-block-end:var(--space-md)}.history-section .history-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.history-section .history-header .history-actions{align-items:center;display:flex;gap:var(--space-sm)}.history-section .recent-history{display:flex;flex-direction:column;gap:var(--space-sm);margin-block-end:var(--space-md)}.history-section .recent-history .wc-history-empty{color:var(--color-on-surface-variant);font-style:italic;padding:var(--space-lg);text-align:center}.history-section .recent-history .history-item-compact{align-items:center;background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);display:flex;justify-content:space-between;padding:var(--space-sm) var(--space-md);transition:all var(--motion-fast)}.history-section .recent-history .history-item-compact:hover{background:var(--color-surface-container-high)}.history-section .recent-history .history-item-compact .history-meta{align-items:center;display:flex;flex:1;gap:var(--space-sm)}.history-section .recent-history .history-item-compact .history-meta .history-status{color:var(--color-success);font-size:var(--text-sm);font-weight:var(--font-weight-medium)}.history-section .recent-history .history-item-compact .history-meta .history-prompt{color:var(--color-on-surface);flex:1;font-size:var(--text-sm)}.history-section .recent-history .history-item-compact .history-meta .history-time{color:var(--color-on-surface-variant);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}.history-section .recent-history .history-item-compact .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.history-section .action-stats{display:grid;gap:var(--space-sm);grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}.history-section .action-stats .stats-item{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-sm);text-align:center}.history-section .action-stats .stats-item:first-child{background:var(--color-primary-container);border-color:var(--color-primary);color:var(--color-on-primary-container)}.data-pipeline-section{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg);margin-block-start:var(--space-lg);padding:var(--space-lg)}.data-pipeline-section .pipeline-header{align-items:center;display:flex;justify-content:space-between;margin-block-end:var(--space-lg)}.data-pipeline-section .pipeline-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.data-pipeline-section .pipeline-header .pipeline-actions{align-items:center;display:flex;gap:var(--space-sm)}.data-pipeline-section .pipeline-steps{display:flex;flex-direction:column;gap:var(--space-md);max-block-size:stretch;overflow-x:hidden;overflow-y:auto;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.data-pipeline-section .pipeline-steps .pipeline-step{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-md)}.data-pipeline-section .pipeline-steps .pipeline-step.recognized-step{background:var(--color-secondary-container);border-color:var(--color-secondary)}.data-pipeline-section .pipeline-steps .pipeline-step.processed-step{background:var(--color-tertiary-container);border-color:var(--color-tertiary)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header{align-items:center;display:flex;gap:var(--space-sm);margin-block-end:var(--space-sm)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header ui-icon{color:var(--color-on-surface-variant);flex-shrink:0}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-title{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);font-weight:var(--font-weight-semibold)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-time{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-source{color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-format{color:var(--color-on-surface-variant);font-family:var(--font-family-mono);font-size:var(--text-xs)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.data-pipeline-section .pipeline-steps .pipeline-step .step-content .step-preview{color:var(--color-on-surface);font-size:var(--text-sm);line-height:1.5;max-block-size:100px;overflow:hidden;text-overflow:ellipsis}}@layer view.workcenter.tokens, view.workcenter.base, view.workcenter.layout, view.workcenter.components, view.workcenter.utilities, view.workcenter.overrides;";

"use strict";
class WorkCenterView {
  id = "workcenter";
  name = "Work Center";
  icon = "lightning";
  options;
  shellContext;
  element = null;
  manager = null;
  deps;
  initializedFromOptions = false;
  lastOutputText = "";
  resultObserver = null;
  _sheet = null;
  lifecycle = {
    onMount: () => this.onMount(),
    onUnmount: () => this.onUnmount(),
    onShow: () => this.onShow(),
    onHide: () => this.onHide()
  };
  constructor(options = {}) {
    this.options = options;
    this.shellContext = options.shellContext;
    this.deps = {
      state: {},
      history: [],
      getSpeechPrompt: async () => null,
      showMessage: (message) => this.showMessage(message),
      render: () => this.requestRender(),
      onFilesChanged: () => this.emitFilesChanged()
    };
  }
  render(options) {
    if (options) {
      this.options = { ...this.options, ...options };
      this.shellContext = options.shellContext || this.shellContext;
    }
    this._sheet = loadAsAdopted(workcenterStyles);
    this.manager ??= new WorkCenterManager(this.deps);
    if (!this.initializedFromOptions) {
      this.applyInitialOptions();
      this.initializedFromOptions = true;
    }
    this.element = this.manager.renderWorkCenterView();
    this.syncPromptInputFromState();
    this.setupProcessResultObserver();
    this.emitFilesChanged();
    return this.element;
  }
  getToolbar() {
    return null;
  }
  addFiles(files) {
    const state = this.manager?.getState();
    if (!state || files.length === 0) return;
    state.files.push(...files);
    this.requestRender();
    this.emitFilesChanged();
  }
  setPrompt(prompt) {
    const state = this.manager?.getState();
    if (!state) return;
    state.currentPrompt = prompt;
    this.syncPromptInputFromState();
  }
  getFiles() {
    return [...this.manager?.getState().files || []];
  }
  canHandleMessage(messageType) {
    return [
      "content-attach",
      "content-process",
      "file-attach",
      "share-target-input",
      "share-target-result",
      "ai-result",
      "content-share"
    ].includes(messageType);
  }
  async handleMessage(message) {
    const msg = message;
    if (!this.manager) return;
    if (msg.type === "share-target-input" || msg.type === "share-target-result" || msg.type === "ai-result" || msg.type === "content-share") {
      await this.manager.handleExternalMessage(msg);
      this.emitFilesChanged();
      return;
    }
    if (msg.data?.file) {
      this.addFiles([msg.data.file]);
    }
    if (msg.data?.files?.length) {
      this.addFiles(msg.data.files);
    }
    const prompt = msg.data?.text || msg.data?.content || msg.data?.url || "";
    if (prompt.trim()) {
      this.setPrompt(prompt);
    }
    if (msg.type === "content-process") {
      const executeBtn = this.element?.querySelector('[data-action="execute"]');
      executeBtn?.click();
    }
  }
  applyInitialOptions() {
    const state = this.manager?.getState();
    if (!state) return;
    if (Array.isArray(this.options.initialFiles) && this.options.initialFiles.length > 0) {
      state.files.push(...this.options.initialFiles);
    }
    if (typeof this.options.initialPrompt === "string" && this.options.initialPrompt.trim()) {
      state.currentPrompt = this.options.initialPrompt;
    }
  }
  syncPromptInputFromState() {
    const state = this.manager?.getState();
    if (!state || !this.element) return;
    const promptInput = this.element.querySelector(".prompt-input");
    if (promptInput) {
      promptInput.value = state.currentPrompt || "";
    }
  }
  setupProcessResultObserver() {
    this.resultObserver?.disconnect();
    if (!this.element || !this.options.onProcessComplete) return;
    const output = this.element.querySelector("[data-output]");
    if (!output) return;
    this.resultObserver = new MutationObserver(() => {
      const resultNode = output.querySelector(".result-content");
      const text = resultNode?.textContent?.trim() || "";
      if (!text || text === this.lastOutputText) return;
      this.lastOutputText = text;
      this.options.onProcessComplete?.(text);
    });
    this.resultObserver.observe(output, { childList: true, subtree: true, characterData: true });
  }
  emitFilesChanged() {
    const files = this.manager?.getState().files || [];
    this.options.onFilesChange?.([...files]);
  }
  requestRender() {
    if (!this.manager || !this.element) return;
    const parent = this.element.parentElement;
    const next = this.manager.renderWorkCenterView();
    if (parent) {
      parent.replaceChild(next, this.element);
    }
    this.element = next;
    this.syncPromptInputFromState();
    this.setupProcessResultObserver();
  }
  showMessage(message) {
    this.shellContext?.showMessage(message);
  }
  onMount() {
    this._sheet ??= loadAsAdopted(workcenterStyles);
  }
  onUnmount() {
    this.resultObserver?.disconnect();
    this.resultObserver = null;
    this.manager?.destroy();
    this.manager = null;
    if (this._sheet) {
      removeAdopted(this._sheet);
    }
    this._sheet = null;
  }
  onShow() {
    this._sheet ??= loadAsAdopted(workcenterStyles);
  }
  onHide() {
  }
}
function createView(options) {
  return new WorkCenterView(options);
}
const createWorkCenterView = createView;

export { WorkCenterView, createView, createWorkCenterView, createView as default };
//# sourceMappingURL=index6.js.map
