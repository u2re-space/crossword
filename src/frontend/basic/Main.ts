import "./Main.scss";

import { H } from "fest/lure";
import { recognizeByInstructions, solveAndAnswer, writeCode, extractCSS } from "@rs-core/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-core/config/Settings";
import type { AppSettings } from "@rs-core/config/SettingsTypes";
import { createSettingsView } from "./Settings";
import { writeText } from "@rs-frontend/shared/Clipboard";
import { UIPhosphorIcon } from "fest/icon";

// Import new modular components
import { WorkCenterManager } from "./modules/WorkCenter";
import { createFileHandler } from "./modules/FileHandling";
import { getSpeechPrompt } from "./modules/VoiceInput";
import { createTemplateManager } from "./modules/TemplateManager";
import { createHistoryManager } from "./modules/HistoryManager";
import { createMarkdownViewer } from "./modules/MarkdownViewer";
import { createMarkdownEditor } from "./modules/MarkdownEditor";
import { createQuillEditor } from "./modules/QuillEditor";

export type BasicView = "markdown-viewer" | "markdown-editor" | "rich-editor" | "settings" | "history" | "workcenter";

export type BasicAppOptions = {
  initialView?: BasicView;
  initialMarkdown?: string;
};

type HistoryEntry = {
  ts: number;
  prompt: string;
  before: string;
  after: string;
  ok: boolean;
  error?: string;
};

const HISTORY_KEY = "rs-basic-history";
const LAST_SRC_KEY = "rs-basic-last-src";
const DEFAULT_MD = "# CrossWord (Basic)\n\nOpen a markdown file or paste content here.\n";
const MARKDOWN_EXTENSION_PATTERN = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;

// BroadcastChannel names (matching service worker)
const CHANNELS = {
  SHARE_TARGET: 'rs-share-target',
  TOAST: 'rs-toast',
  CLIPBOARD: 'rs-clipboard'
} as const;

const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw) as T;
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const loadLastSrc = () => {
  try {
    return localStorage.getItem(LAST_SRC_KEY) || "";
  } catch {
    return "";
  }
};

const saveLastSrc = (src: string) => {
  try {
    localStorage.setItem(LAST_SRC_KEY, src);
  } catch {
    // ignore
  }
};

const isLikelyExtension = () => {
  try {
    return (
      typeof chrome !== "undefined" &&
      Boolean((chrome as any)?.runtime?.id) &&
      window.location.protocol === "chrome-extension:"
    );
  } catch {
    return false;
  }
};

const applyTheme = (root: HTMLElement, theme: AppSettings["appearance"] extends infer A ? (A extends { theme?: infer T } ? T : never) : never) => {
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const resolved = theme === "dark" ? "dark" : theme === "light" ? "light" : prefersDark ? "dark" : "light";
  root.dataset.theme = resolved;
  // Drive scheme-aware styling (used by the markdown-view styles).
  try {
    root.style.colorScheme = resolved;
  } catch {
    // ignore
  }
};


const readMdFromUrlIfPossible = async (candidate: string): Promise<string | null> => {
  const s = candidate.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!MARKDOWN_EXTENSION_PATTERN.test(u.pathname)) return null;
    const res = await fetch(u.href, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
};

const extractTextFromDataTransfer = async (dt: DataTransfer): Promise<string | null> => {
  try {
    const uriList = dt.getData("text/uri-list");
    if (uriList?.trim()) return uriList.trim();
  } catch {
    // ignore
  }
  try {
    const text = dt.getData("text/plain");
    if (text?.trim()) return text;
  } catch {
    // ignore
  }
  return null;
};

export const mountBasicApp = (mountElement: HTMLElement, options: BasicAppOptions = {}) => {
  const root = H`<div class="basic-app" />` as HTMLElement;
  mountElement.replaceChildren(root);

  const ext = isLikelyExtension();

  // Initialize broadcast listeners for share target and clipboard operations
  let initBroadcastListeners: () => void;

  // Initialize managers
  const workCenterManager = new WorkCenterManager({
    state: {} as any, // Will be set below
    history: [],
    getSpeechPrompt,
    showMessage: (message: string) => {
      state.message = message;
      renderStatus();
      setTimeout(() => {
        state.message = "";
        renderStatus();
      }, 3000);
    },
    render: () => render()
  });

  const fileHandler = createFileHandler({
    onFilesAdded: (files: File[]) => {
      if (state.view === 'workcenter') {
        workCenterManager.getState().files.push(...files);
        // Trigger re-render of work center
        render();
      }
    },
    onError: (error: string) => {
      state.message = error;
      renderStatus();
    }
  });

  const templateManager = createTemplateManager();
  const historyManager = createHistoryManager();

  const state = {
    view: (options.initialView || "markdown-viewer") as BasicView,
    markdown: /*safeJsonParse<string>*/(localStorage.getItem("rs-basic-markdown")/*, DEFAULT_MD*/) ?? options.initialMarkdown ?? DEFAULT_MD,
    editing: false,
    busy: false,
    message: "",
    history: historyManager.getAllEntries(),
    lastSavedTheme: "auto" as AppSettings["appearance"] extends { theme?: infer T } ? (T extends string ? T : "auto") : "auto",
    // Add managers to state for access
    workCenterManager,
    fileHandler,
    templateManager,
    historyManager
  };

  // Update work center manager with proper state reference
  workCenterManager['deps'].state = state;
  workCenterManager['deps'].history = state.history;

  const persistMarkdown = () => {
    try {
      if (state.markdown) localStorage.setItem("rs-basic-markdown", state.markdown);
    } catch {
      // ignore
    }
  };

  // Initialize broadcast listeners for share target and clipboard operations
  initBroadcastListeners = () => {
    if (typeof BroadcastChannel === "undefined") return;

    // Listen for share target operations
    const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
    shareChannel.addEventListener("message", (event) => {
      const { type, data } = event.data || {};
      if (type === "share-received" && data) {
        // Record share target reception in history
        state.history.push({
          ts: Date.now(),
          prompt: "Share Target",
          before: data.title || data.text || data.url || "Shared content",
          after: data.title || data.text || data.url || "Shared content",
          ok: true
        });
        persistHistory();
        // Re-render if currently viewing history
        if (state.view === "history") {
          render();
        }
      }
    });

    // Listen for clipboard copy operations from service worker
    const clipboardChannel = new BroadcastChannel(CHANNELS.CLIPBOARD);
    clipboardChannel.addEventListener("message", (event) => {
      const { type, data } = event.data || {};
      if (type === "copy" && data) {
        // Record clipboard copy operation in history
        state.history.push({
          ts: Date.now(),
          prompt: "Clipboard Copy",
          before: "",
          after: typeof data === "string" ? data : JSON.stringify(data),
          ok: true
        });
        persistHistory();
        // Re-render if currently viewing history
        if (state.view === "history") {
          render();
        }
      }
    });
  };

  const persistHistory = () => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(-50)));
    } catch {
      // ignore
    }
  };

  const renderToolbar = () => {
    const isMarkdownView = state.view === "markdown-viewer" || state.view === "markdown-editor";
    const isEditorView = state.view === "markdown-editor";
    const isWorkCenterView = state.view === "workcenter";

    return H`<div class="toolbar">
      <div class="left">
        <button class="btn ${state.view === 'markdown-viewer' ? 'active' : ''}" data-action="view-markdown-viewer" type="button" title="Markdown Viewer">📖 Viewer</button>
        <button class="btn ${state.view === 'markdown-editor' ? 'active' : ''}" data-action="view-markdown-editor" type="button" title="Markdown Editor">✏️ Editor</button>
        <button class="btn ${state.view === 'rich-editor' ? 'active' : ''}" data-action="view-rich-editor" type="button" title="Rich Text Editor">🖊️ Rich Editor</button>
        <button class="btn ${state.view === 'workcenter' ? 'active' : ''}" data-action="view-workcenter" type="button" title="AI Work Center">⚡ Work Center</button>
        <button class="btn ${state.view === 'settings' ? 'active' : ''}" data-action="view-settings" type="button" title="Settings">⚙️ Settings</button>
        <button class="btn ${state.view === 'history' ? 'active' : ''}" data-action="view-history" type="button" title="History">📚 History</button>
      </div>
      <div class="right">
        ${isEditorView ? H`<button class="btn btn-icon" data-action="open-md" type="button" title="Open Markdown File">
          <ui-icon icon="folder-open" size="18" icon-style="duotone"></ui-icon>
          <span class="btn-text">Open</span>
        </button>
        <button class="btn btn-icon" data-action="save-md" type="button" title="Save to File">
          <ui-icon icon="floppy-disk" size="18" icon-style="duotone"></ui-icon>
          <span class="btn-text">Save</span>
        </button>
        <button class="btn btn-icon" data-action="export-md" type="button" title="Export as Markdown">
          <ui-icon icon="download" size="18" icon-style="duotone"></ui-icon>
          <span class="btn-text">Export</span>
        </button>` : ''}
        ${isMarkdownView ? H`<button class="btn" data-action="voice" type="button" title="Voice Input">🎤 Voice</button>` : ''}
        ${isWorkCenterView ? H`<button class="btn" data-action="solve" type="button" title="Solve equations & answer questions">🧮 Solve</button>
        <button class="btn" data-action="code" type="button" title="Generate code">💻 Code</button>
        <button class="btn" data-action="css" type="button" title="Extract CSS">🎨 CSS</button>` : ''}
        ${ext ? H`<button class="btn" data-action="snip" type="button" title="Screen Capture">📸 Snip</button>` : ""}
      </div>
    </div>` as HTMLElement;
  };

  let toolbar = renderToolbar();

  const statusLine = H`<div class="status" aria-live="polite"></div>` as HTMLElement;
  const content = H`<div class="content"></div>` as HTMLElement;
  root.append(toolbar, statusLine, content);

  // Setup file input for markdown view
  const fileInput = H`<input class="file-input" type="file" accept=".md,text/markdown,text/plain" />` as HTMLInputElement;
  fileInput.style.display = "none";
  root.append(fileInput);

  // Setup file handling for work center
  state.fileHandler.setupCompleteFileHandling(
    root,
    H`<button style="display:none">File Select</button>` as HTMLElement,
    undefined, // No specific drop zone - handle globally
    "*" // Accept all files for work center
  );

  const renderStatus = () => {
    statusLine.textContent = state.message || (state.busy ? "Working…" : "");
    root.toggleAttribute("data-busy", state.busy);
  };

  const renderMarkdownViewer = () => {
    const viewer = createMarkdownViewer({
      content: state.markdown || DEFAULT_MD,
      title: "Markdown Viewer",
      onOpen: () => {
        // Trigger file input for opening markdown files
        fileInput.click();
      },
      onCopy: (content) => {
        state.message = "Content copied to clipboard";
        renderStatus();
        setTimeout(() => {
          state.message = "";
          renderStatus();
        }, 2000);
      },
      onDownload: (content) => {
        state.message = "Content downloaded as markdown file";
        renderStatus();
        setTimeout(() => {
          state.message = "";
          renderStatus();
        }, 2000);
      }
    });

    const viewerElement = viewer.render();

    // Setup file handling for markdown viewer (drag & drop, paste)
    const handleFiles = async (files: File[]) => {
      const markdownFiles = files.filter(f => fileHandler.isMarkdownFile(f));
      if (markdownFiles.length > 0) {
        const fileContents = await fileHandler.readFilesAsText(markdownFiles);
        if (fileContents.length > 0) {
          // Use the first markdown file's content
          const content = fileContents[0].content;
          state.markdown = content;
          state.message = `Loaded ${markdownFiles[0].name}`;
          persistMarkdown();
          renderStatus();
          setTimeout(() => {
            state.message = "";
            renderStatus();
          }, 3000);
          // Re-render the current view
          render();
        }
      }
    };

    // Set up drag and drop handling
    fileHandler.setupDragAndDrop(viewerElement);
    fileHandler.setupPasteHandling(viewerElement);

    // Listen for file events from the global file handler
    const originalOnFilesAdded = state.fileHandler.options.onFilesAdded;
    state.fileHandler.options.onFilesAdded = (files: File[]) => {
      // Only handle markdown files in viewer mode
      if (state.view === 'markdown-viewer') {
        handleFiles(files);
      } else {
        // Pass through to original handler for work center
        originalOnFilesAdded?.(files);
      }
    };

    return viewerElement;
  };

  const renderMarkdownEditor = async () => {
    const editor = createMarkdownEditor({
      initialContent: state.markdown || "",
      onContentChange: (content) => {
        state.markdown = content;
        persistMarkdown();
      },
      onSave: (content) => {
        state.markdown = content;
        persistMarkdown();
        state.message = "Content saved";
        renderStatus();
        setTimeout(() => {
          state.message = "";
          renderStatus();
        }, 2000);
      },
      placeholder: "Start writing your markdown here...",
      autoSave: true,
      autoSaveDelay: 2000
    });

    return editor.render();
  };

  const renderRichEditor = async () => {
    const editor = createQuillEditor({
      initialContent: state.markdown || "",
      onContentChange: (content) => {
        state.markdown = content;
        persistMarkdown();
      },
      onSave: (content) => {
        state.markdown = content;
        persistMarkdown();
        state.message = "Content saved";
        renderStatus();
        setTimeout(() => {
          state.message = "";
          renderStatus();
        }, 2000);
      },
      placeholder: "Start writing your rich text here...",
      autoSave: true,
      autoSaveDelay: 2000
    });

    return editor.render();
  };

  const renderHistoryView = () => {
    return state.historyManager.createHistoryView((entry) => {
      // Handle entry selection - restore prompt to work center
      if (state.view === 'workcenter') {
        state.workCenterManager.getState().currentPrompt = entry.prompt;
        // Trigger re-render
        render();
      }
    });
  };

  const exportMarkdown = () => {
    const blob = new Blob([state.markdown || ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crossword-${Date.now()}.md`;
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 250);
  };

  const saveToFile = async () => {
    const md = state.markdown;
    if (!md?.trim()) return;

    try {
      // Use File System Access API if available
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'document.md',
          types: [{
            description: 'Markdown Files',
            accept: {
              'text/markdown': ['.md']
            }
          }]
        });

        const writable = await handle.createWritable();
        await writable.write(md);
        await writable.close();

        state.message = "File saved successfully!";
        renderStatus();
        setTimeout(() => {
          state.message = "";
          renderStatus();
        }, 3000);
      } else {
        // Fallback: trigger download
        exportMarkdown();
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      // Fallback to download if user cancels or API fails
      if ((error as any).name !== 'AbortError') {
        exportMarkdown();
      }
    }
  };

  const runPrompt = async (promptText: string, customAIFunction?: Function) => {
    if (!promptText.trim()) return;
    state.busy = true;
    state.message = customAIFunction ? "Processing…" : "Generating markdown…";
    renderStatus();

    const before = state.markdown || "";
    const instructions =
      "Generate a NEW markdown document.\n" +
      "Requirements:\n" +
      "- Output ONLY markdown.\n" +
      "- Use the prompt and the current markdown as context.\n" +
      "- Keep it concise, structured with headings and lists.\n" +
      "- If you need to keep prior content, integrate it rather than repeating verbatim.\n";

    const input = [
      {
        role: "user",
        content: `Prompt:\n${promptText}\n\nCurrent markdown:\n${before}`,
      },
    ];

    try {
      const res = customAIFunction
        ? await customAIFunction(input, { useActiveInstruction: true })
        : await recognizeByInstructions(input, instructions);
      const after = res?.ok && res?.data ? String(res.data) : "";

      state.history.push({
        ts: Date.now(),
        prompt: promptText,
        before,
        after: after || before,
        ok: Boolean(res?.ok && after),
        error: res?.ok ? undefined : res?.error || "Failed",
      });
      persistHistory();

      if (after) {
        state.markdown = after;
        persistMarkdown();
        saveLastSrc("");
        state.message = "Done.";
      } else {
        state.message = res?.error || "No output.";
      }
    } catch (e) {
      state.history.push({
        ts: Date.now(),
        prompt: promptText,
        before,
        after: before,
        ok: false,
        error: String(e),
      });
      persistHistory();
      state.message = String(e);
    } finally {
      state.busy = false;
      renderStatus();
      void render();
      setTimeout(() => {
        if (state.message === "Done.") {
          state.message = "";
          renderStatus();
        }
      }, 1200);
    }
  };

  const render = async () => {
    // Update toolbar for current view
    const newToolbar = renderToolbar();
    toolbar.replaceWith(newToolbar);
    // Update reference
    toolbar = newToolbar;
    // Re-attach event listeners
    attachToolbarListeners();

    content.replaceChildren();

    if (state.view === "settings") {
      const settingsEl = createSettingsView({
        isExtension: isLikelyExtension(),
        onTheme: (t) => applyTheme(root, t),
      });
      content.append(settingsEl);
      renderStatus();
      return;
    }

    if (state.view === "history") {
      content.append(renderHistoryView());
      renderStatus();
      return;
    }

    if (state.view === "markdown-viewer") {
      content.append(renderMarkdownViewer());
      renderStatus();
      return;
    }

    if (state.view === "markdown-editor") {
      content.append(await renderMarkdownEditor());
      renderStatus();
      return;
    }

    if (state.view === "rich-editor") {
      content.append(await renderRichEditor());
      renderStatus();
      return;
    }

    if (state.view === "workcenter") {
      content.append(state.workCenterManager.renderWorkCenterView());
      renderStatus();
      return;
    }

    // Default fallback to markdown viewer
    content.append(renderMarkdownViewer());
    renderStatus();
  };

  const attachToolbarListeners = () => {
    toolbar.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.("button[data-action]") as HTMLButtonElement | null;
      const action = btn?.dataset?.action;
      if (!action) return;

      if (action === "view-markdown-viewer") state.view = "markdown-viewer";
      if (action === "view-markdown-editor") state.view = "markdown-editor";
      if (action === "view-rich-editor") state.view = "rich-editor";
      if (action === "view-workcenter") state.view = "workcenter";
      if (action === "view-settings") state.view = "settings";
      if (action === "view-history") state.view = "history";

      if (action === "open-md") fileInput.click();
      if (action === "save-md") saveToFile();
      if (action === "export-md") exportMarkdown();

      if (action === "toggle-edit") {
        if (state.view !== "markdown") return;
        state.editing = !state.editing;
      }

      if (action === "snip") {
        if (!ext) return;
        try {
          chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs: any[]) => {
            const tabId = tabs?.[0]?.id;
            if (tabId != null) {
              chrome.tabs.sendMessage(tabId, { type: "START_SNIP" })?.catch?.(() => void 0);
            }
            try {
              window.close?.();
            } catch {
              // ignore
            }
          });
        } catch {
          // ignore
        }
      }

      if (action === "solve") {
        await runPrompt("Solve equations and answer questions from the content above", solveAndAnswer);
      }

      if (action === "code") {
        await runPrompt("Generate code based on the description or requirements above", writeCode);
      }

      if (action === "css") {
        await runPrompt("Extract or generate CSS from the content or image above", extractCSS);
      }

      if (action === "voice") {
        void (async () => {
          const p = await getSpeechPrompt();
          if (!p) return;
          await runPrompt(p);
        })();
      }

      void render();
    });
  };

  // Attach initial toolbar listeners
  attachToolbarListeners();

  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    void f
      .text()
      .then((text) => {
        state.markdown = text || "";
        persistMarkdown();
        saveLastSrc("");

        // Don't change view if already in markdown-viewer mode
        if (state.view !== "markdown-viewer") {
          state.view = "markdown-viewer";
        }

        state.message = `Loaded ${f.name}`;
        renderStatus();
        void render();

        setTimeout(() => {
          state.message = "";
          renderStatus();
        }, 3000);
      })
      .catch(() => void 0)
      .finally(() => {
        fileInput.value = "";
      });
  });

  void loadSettings()
    .then((s) => {
      state.lastSavedTheme = (s?.appearance?.theme as any) || "auto";
      applyTheme(root, state.lastSavedTheme);
    })
    .catch(() => applyTheme(root, "auto" as any));

  // In PWA / regular web app: if the last opened markdown was a URL, try to refresh it.
  // If offline, cached `rs-basic-markdown` will remain.
  //if (!options.initialMarkdown) {
    const lastSrc = loadLastSrc();
    if (lastSrc) {
        void readMdFromUrlIfPossible(lastSrc).then((text) => {
            if (!text) return;
            state.markdown = text;
            persistMarkdown();
            void render();
        });
    }
    //}

  void render();
};


