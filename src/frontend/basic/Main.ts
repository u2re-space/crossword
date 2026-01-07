//@ts-ignore
import style from "./Main.scss?inline";

import { H } from "fest/lure";
import { recognizeByInstructions, solveAndAnswer, writeCode, extractCSS } from "@rs-core/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-core/config/Settings";
import type { AppSettings } from "@rs-core/config/SettingsTypes";
import { ensureStyleSheet } from "fest/icon";

// Import lazy loading utility
import { getCachedComponent } from "./modules/LazyLoader";

// Import file handling components that are always needed
import { createFileHandler } from "./modules/FileHandling";
import { getSpeechPrompt } from "./modules/VoiceInput";
import { createTemplateManager } from "./modules/TemplateManager";
import { CHANNELS } from "@rs-frontend/routing/sw-handling";
import { loadAsAdopted } from "fest/dom";
import { dynamicTheme } from "fest/lure";
import { clearIconCaches, clearIconCache, testIconRacing, reinitializeRegistry, debugIconSystem } from "fest/icon";
import type { FileManager } from "./explorer";
import { downloadMarkdownAsDocx } from "../shared/DocxExport";

export type BasicView = "markdown-viewer" | "markdown-editor" | "rich-editor" | "settings" | "history" | "workcenter" | "file-picker" | "file-explorer";

export type BasicAppOptions = {
    initialView?: BasicView;
    initialMarkdown?: string;
    /** PWA share-target / launchQueue can inject files to pre-attach in WorkCenter */
    initialFiles?: File[];
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

//
export const mountBasicApp = (mountElement: HTMLElement, options: BasicAppOptions = {}) => {
    loadAsAdopted(style)

    //
    const root = H`<div class="basic-app" />` as HTMLElement;
    mountElement.replaceChildren(root);

    // Initialize icon system
    try {
        const sheet = ensureStyleSheet();
        reinitializeRegistry(); // Ensure registry is properly restored
        console.log('[Icons] Initialized stylesheet:', sheet);
    } catch (error) {
        console.error('[Icons] Failed to initialize stylesheet:', error);
    }

    // Initialize dynamic status bar color theming
    try {
        dynamicTheme(root);
        console.log('[Theme] Dynamic status bar color theming initialized');
    } catch (error) {
        console.error('[Theme] Failed to initialize dynamic status bar color theming:', error);
    }

    // Add debug functions to window for troubleshooting icon issues
    if (typeof window !== "undefined") {
        (window as any).clearIconCaches = () => {
            clearIconCaches();
            clearIconCache().catch(console.error);
            console.log('[Debug] Icon caches cleared');
        };
        (window as any).invalidateIconCache = clearIconCaches; // Alias for easier access
        (window as any).testIconRacing = testIconRacing; // Test racing functionality
        (window as any).reinitializeIconRegistry = reinitializeRegistry; // Reinitialize registry
        (window as any).debugIconSystem = debugIconSystem; // Debug icon system status
    }

    const ext = isLikelyExtension();


    // Initialize managers that are always needed
    const fileHandler = createFileHandler({
        onFilesAdded: async (files: File[]): Promise<void> => {
            // Handle files based on current view - lazy load components if needed
            if (state.view === 'workcenter') {
                const workCenter = await getCachedComponent(
                    'workcenter',
                    () => import('./workcenter/WorkCenter').then(m => m.WorkCenterManager),
                    { componentName: 'WorkCenter' }
                );

                // Cleanup previous work center manager
                if (state.workCenterManager && typeof state.workCenterManager.destroy === 'function') {
                    state.workCenterManager.destroy();
                }

                const                 workCenterManager = new workCenter.component({
                    state: state,
                    history: state.history,
                    getSpeechPrompt,
                    showMessage: (message: string) => {
                        state.message = message;
                        renderStatus();
                        setTimeout(() => {
                            state.message = "";
                            renderStatus();
                        }, 3000);
                    },
                    render: () => render(),
                    onFilesChanged: () => {
                        // Re-render toolbar to update file count badge
                        renderToolbar();
                    }
                });

                workCenterManager.getState().files.push(...files);
                // Store reference for future use
                state.workCenterManager = workCenterManager;
                render();
            } else if (state.view === 'markdown-viewer') {
                // Handle markdown files for viewer
                const markdownFiles = files.filter(f => fileHandler.isMarkdownFile(f));
                if (markdownFiles.length > 0) {
                    const fileContents = await fileHandler.readFilesAsText(markdownFiles);
                    if (fileContents.length > 0) {
                        const content = fileContents[0].content;
                        state.markdown = content;
                        state.message = `Loaded ${markdownFiles[0].name}`;
                        persistMarkdown();
                        renderStatus();
                        setTimeout(() => {
                            state.message = "";
                            renderStatus();
                        }, 3000);
                        render();
                    }
                }
            }
        },
        onError: (error: string) => {
            state.message = error;
            renderStatus();
        }
    });

    const templateManager = createTemplateManager();

    // Determine initial view based on content availability
    const hasExistingContent = localStorage.getItem("rs-basic-markdown") || options.initialMarkdown;
    const defaultView = options.initialView || (hasExistingContent ? "markdown-viewer" : "file-picker");

    const state = {
        view: defaultView as BasicView,
        markdown: /*safeJsonParse<string>*/(localStorage.getItem("rs-basic-markdown")/*, DEFAULT_MD*/) ?? options.initialMarkdown ?? DEFAULT_MD,
        editing: false,
        busy: false,
        message: "",
        history: [] as HistoryEntry[],
        lastSavedTheme: "auto" as AppSettings["appearance"] extends { theme?: infer T } ? (T extends string ? T : "auto") : "auto",
        // Add managers to state for access (will be lazy loaded)
        fileHandler,
        templateManager,
        // Components will be cached here when lazy loaded
        workCenterManager: null as any,
        historyManager: null as any,
        settingsView: null as any,
        markdownViewer: null as any,
        markdownEditor: null as any,
        quillEditor: null as any
    };

    // If we were launched with files (share-target), force WorkCenter and attach them.
    // (This must run after state + fileHandler exist.)
    if (Array.isArray(options.initialFiles) && options.initialFiles.length > 0) {
        state.view = "workcenter";
        try {
            // Use the same pipeline as UI file selection.
            state.fileHandler?.addFiles?.(options.initialFiles);
            state.message = `Received ${options.initialFiles.length} file(s)`;
        } catch (e) {
            console.warn("[Basic] Failed to attach initial files:", e);
        }
    }

    const persistMarkdown = () => {
        try {
            if (state.markdown) localStorage.setItem("rs-basic-markdown", state.markdown);
        } catch {
            // ignore
        }
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
        <button class="btn ${state.view === 'markdown-viewer' ? 'active' : ''}" data-action="view-markdown-viewer" type="button" title="Markdown Viewer">
          <ui-icon icon="eye" icon-style="duotone"></ui-icon>
          <span>Viewer</span>
        </button>
        <button class="btn ${state.view === 'file-explorer' ? 'active' : ''}" data-action="view-file-explorer" type="button" title="File Explorer">
          <ui-icon icon="folder" icon-style="duotone"></ui-icon>
          <span>Explorer</span>
        </button>
        <button class="btn ${state.view === 'workcenter' ? 'active' : ''}" data-action="view-workcenter" type="button" title="AI Work Center">
          <ui-icon icon="lightning" icon-style="duotone"></ui-icon>
          <span>Work Center</span>
          ${state.workCenterManager && state.workCenterManager.getState().files.length > 0 ? H`<span class="workcenter-badge" title="${state.workCenterManager.getState().files.length} files ready for processing">${state.workCenterManager.getState().files.length}</span>` : ''}
        </button>
        <button class="btn ${state.view === 'settings' ? 'active' : ''}" data-action="view-settings" type="button" title="Settings">
          <ui-icon icon="gear" icon-style="duotone"></ui-icon>
          <span>Settings</span>
        </button>
        <button class="btn ${state.view === 'history' ? 'active' : ''}" data-action="view-history" type="button" title="History">
          <ui-icon icon="clock-counter-clockwise" icon-style="duotone"></ui-icon>
          <span>History</span>
        </button>
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
        </button>
        <button class="btn btn-icon" data-action="export-docx" type="button" title="Export as DOCX">
          <ui-icon icon="file-doc" size="18" icon-style="duotone"></ui-icon>
          <span class="btn-text">DOCX</span>
        </button>` : ''}
        ${isMarkdownView ? H`<button class="btn" data-action="voice" type="button" title="Voice Input">
          <ui-icon icon="microphone" icon-style="duotone"></ui-icon>
          <span>Voice</span>
        </button>` : ''}
        ${isWorkCenterView ? H`<button class="btn" data-action="solve" type="button" title="Solve equations & answer questions">
          <ui-icon icon="calculator" icon-style="duotone"></ui-icon>
          <span>Solve</span>
        </button>
        <button class="btn" data-action="code" type="button" title="Generate code">
          <ui-icon icon="code" icon-style="duotone"></ui-icon>
          <span>Code</span>
        </button>
        <button class="btn" data-action="css" type="button" title="Extract CSS">
          <ui-icon icon="palette" icon-style="duotone"></ui-icon>
          <span>CSS</span>
        </button>` : ''}
        ${ext ? H`<button class="btn" data-action="snip" type="button" title="Screen Capture">
          <ui-icon icon="camera" icon-style="duotone"></ui-icon>
          <span>Snip</span>
        </button>` : ""}
      </div>
    </div>` as HTMLElement;
    };

    let toolbar = renderToolbar();

    const statusLine = H`<div class="status" aria-live="polite"></div>` as HTMLElement;
    const content = H`<div class="content"></div>` as HTMLElement;
    root.append(toolbar, content);

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

    const renderMarkdownViewer = async () => {
        // Show loading state
        const loadingElement = H`<div class="component-loading">
      <div class="loading-spinner"></div>
      <span>Loading Markdown Viewer...</span>
    </div>` as HTMLElement;

        content.append(loadingElement);

        try {
            // Lazy load markdown viewer
            const viewerModule = await getCachedComponent(
                'markdown-viewer',
                () => import('./modules/MarkdownViewer'),
                { componentName: 'MarkdownViewer' }
            );

            const viewer = viewerModule.component.createMarkdownViewer({
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
                },
                onAttachToWorkCenter: async (content: string) => {
                    // Switch to work center view and attach content
                    state.view = "workcenter";
                    render();

                    // Attach content to work center after a short delay to ensure it's rendered
                    setTimeout(async () => {
                        if (state.workCenterManager) {
                            try {
                                const { getWorkCenterComm } = await import('../shared/AppCommunicator');
                                const workCenterComm = getWorkCenterComm();
                                await workCenterComm.sendMessage('share-target-input', {
                                    text: content,
                                    timestamp: Date.now(),
                                    metadata: {
                                        source: 'markdown-viewer',
                                        title: 'Markdown Content'
                                    }
                                }, { priority: 'normal' });
                                state.message = "Content attached to Work Center";
                                renderStatus();
                                setTimeout(() => {
                                    state.message = "";
                                    renderStatus();
                                }, 3000);
                            } catch (error) {
                                console.warn('[Main] Failed to attach markdown to work center:', error);
                                state.message = "Failed to attach to Work Center";
                                renderStatus();
                                setTimeout(() => {
                                    state.message = "";
                                    renderStatus();
                                }, 3000);
                            }
                        }
                    }, 100);
                }
            });

            const viewerElement = viewer.render();

            // Set up drag and drop handling
            fileHandler.setupDragAndDrop(viewerElement);
            fileHandler.setupPasteHandling(viewerElement);

            // Replace loading element with actual content
            loadingElement.replaceWith(viewerElement);
            return viewerElement;

        } catch (error) {
            console.error('Failed to load markdown viewer:', error);
            const errorElement = H`<div class="component-error">
        <h3>Failed to load Markdown Viewer</h3>
        <p>Please try refreshing the page.</p>
      </div>` as HTMLElement;
            loadingElement.replaceWith(errorElement);
            return errorElement;
        }
    };

    const renderMarkdownEditor = async () => {
        // Show loading state
        const loadingElement = H`<div class="component-loading">
      <div class="loading-spinner"></div>
      <span>Loading Markdown Editor...</span>
    </div>` as HTMLElement;

        content.append(loadingElement);

        try {
            // Lazy load markdown editor
            const editorModule = await getCachedComponent(
                'markdown-editor',
                () => import('./editors/MarkdownEditor'),
                { componentName: 'MarkdownEditor' }
            );

            const editor = editorModule.component.createMarkdownEditor({
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

            const editorElement = editor.render();

            // Replace loading element with actual content
            loadingElement.replaceWith(editorElement);
            return editorElement;

        } catch (error) {
            console.error('Failed to load markdown editor:', error);
            const errorElement = H`<div class="component-error">
        <h3>Failed to load Markdown Editor</h3>
        <p>Please try refreshing the page.</p>
      </div>` as HTMLElement;
            loadingElement.replaceWith(errorElement);
            return errorElement;
        }
    };

    const renderRichEditor = async () => {
        // Show loading state
        const loadingElement = H`<div class="component-loading">
      <div class="loading-spinner"></div>
      <span>Loading Rich Editor...</span>
    </div>` as HTMLElement;

        content.append(loadingElement);

        try {
            // Lazy load quill editor
            const editorModule = await getCachedComponent(
                'quill-editor',
                () => import('./editors/QuillEditor'),
                { componentName: 'QuillEditor' }
            );

            const editor = editorModule.component.createQuillEditor({
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

            const editorElement = editor.render();

            // Replace loading element with actual content
            loadingElement.replaceWith(editorElement);
            return editorElement;

        } catch (error) {
            console.error('Failed to load rich editor:', error);
            const errorElement = H`<div class="component-error">
        <h3>Failed to load Rich Editor</h3>
        <p>Please try refreshing the page.</p>
      </div>` as HTMLElement;
            loadingElement.replaceWith(errorElement);
            return errorElement;
        }
    };

    const renderHistoryView = async () => {
        // Show loading state
        const loadingElement = H`<div class="component-loading">
      <div class="loading-spinner"></div>
      <span>Loading History...</span>
    </div>` as HTMLElement;

        content.append(loadingElement);

        try {
            // Lazy load history manager
            const historyModule = await getCachedComponent(
                'history-manager',
                () => import('./modules/HistoryManager'),
                { componentName: 'HistoryManager' }
            );

            const historyManager = historyModule.component.createHistoryManager();

            // Load history if not already loaded
            if (state.history.length === 0) {
                state.history = historyManager.getAllEntries();
            }

            const historyElement = historyManager.createHistoryView((entry) => {
                // Handle entry selection - restore prompt to work center
                if (state.view === 'workcenter') {
                    // Lazy load work center if needed
                    getCachedComponent(
                        'workcenter',
                        () => import('./workcenter/WorkCenter').then(m => m.WorkCenterManager),
                        { componentName: 'WorkCenter' }
                    ).then(workCenterModule => {
                        if (state.workCenterManager) {
                            state.workCenterManager.getState().currentPrompt = entry.prompt;
                            render();
                        }
                    });
                }
            });

            // Replace loading element with actual content
            loadingElement.replaceWith(historyElement);
            return historyElement;

        } catch (error) {
            console.error('Failed to load history view:', error);
            const errorElement = H`<div class="component-error">
        <h3>Failed to load History View</h3>
        <p>Please try refreshing the page.</p>
      </div>` as HTMLElement;
            loadingElement.replaceWith(errorElement);
            return errorElement;
        }
    };


    //
    if (typeof BroadcastChannel !== "undefined") {
        try {
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

                    if (state.view === "history") {
                        render();
                    }
                }
            });
        } catch (error) {
            console.error('[Broadcast] Failed to initialize broadcast listeners:', error);
        }
    }

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

    const render = () => {
        // Update toolbar for current view
        const newToolbar = renderToolbar();
        toolbar.replaceWith(newToolbar);
        // Update reference
        toolbar = newToolbar;
        // Re-attach event listeners
        attachToolbarListeners();

        content.replaceChildren();

        if (state.view === "settings") {
            // Lazy load settings view
            content.innerHTML = '<div class="component-loading"><div class="loading-spinner"></div><span>Loading Settings...</span></div>';

            getCachedComponent(
                'settings',
                () => import('./settings/Settings'),
                { componentName: 'Settings', cssPath: './Settings.scss' }
            ).then(settingsModule => {
                const settingsEl = settingsModule.component.createSettingsView({
                    isExtension: isLikelyExtension(),
                    onTheme: (t) => applyTheme(root, t),
                });
                content.innerHTML = '';
                content.append(settingsEl);
                renderStatus();
            }).catch(error => {
                console.error('Failed to load settings:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load Settings</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        if (state.view === "history") {
            renderHistoryView().then(historyElement => {
                content.append(historyElement);
                renderStatus();
            }).catch(error => {
                console.error('Failed to load history view:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load History View</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        if (state.view === "markdown-viewer") {
            renderMarkdownViewer().then(viewerElement => {
                content.append(viewerElement);
                renderStatus();
            }).catch(error => {
                console.error('Failed to load markdown viewer:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load Markdown Viewer</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        if (state.view === "markdown-editor") {
            renderMarkdownEditor().then(editorElement => {
                content.append(editorElement);
                renderStatus();
            }).catch(error => {
                console.error('Failed to load markdown editor:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load Markdown Editor</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        if (state.view === "rich-editor") {
            renderRichEditor().then(editorElement => {
                content.append(editorElement);
                renderStatus();
            }).catch(error => {
                console.error('Failed to load rich editor:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load Rich Editor</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        if (state.view === "file-picker") {
            // Simple file picker view
            content.innerHTML = `
                <div class="file-picker">
                    <div class="file-picker-header">
                        <h2>Open File</h2>
                        <p>Select a file to open in the viewer or editor</p>
                    </div>
                    <div class="file-picker-actions">
                        <button class="btn btn-primary" data-action="open-markdown" type="button">
                            <ui-icon icon="file-text" size="18" icon-style="duotone"></ui-icon>
                            <span>Open Markdown</span>
                        </button>
                        <button class="btn" data-action="open-any" type="button">
                            <ui-icon icon="file" size="18" icon-style="duotone"></ui-icon>
                            <span>Open Any File</span>
                        </button>
                    </div>
                    <div class="file-picker-info">
                        <p><strong>Markdown files</strong> will open in the viewer/editor</p>
                        <p><strong>Other files</strong> will be processed by the work center</p>
                    </div>
                </div>
            `;

            // Add event listeners for the buttons
            const openMarkdownBtn = content.querySelector('[data-action="open-markdown"]') as HTMLButtonElement;
            const openAnyBtn = content.querySelector('[data-action="open-any"]') as HTMLButtonElement;

            if (openMarkdownBtn) {
                openMarkdownBtn.addEventListener('click', () => {
                    // Trigger file input for markdown files
                    fileInput.accept = ".md,.markdown,.txt,text/markdown";
                    fileInput.click();
                });
            }

            if (openAnyBtn) {
                openAnyBtn.addEventListener('click', () => {
                    // Trigger file input for any files
                    fileInput.accept = "*";
                    fileInput.click();
                });
            }

            renderStatus();
            return;
        }

        if (state.view === "file-explorer") {
            // Lazy load file explorer
            content.innerHTML = '<div class="component-loading"><div class="loading-spinner"></div><span>Loading File Explorer...</span></div>';

            getCachedComponent(
                'file-explorer',
                () => import('./explorer'),
                { componentName: 'FileManager' }
            ).then(() => {
                try {
                    const explorerEl = document.createElement('ui-file-manager') as FileManager & HTMLElement;

                    // Listen for file selection events from the explorer
                    explorerEl.addEventListener('open-item', (e: any) => {
                        const { item } = e.detail;
                        if (item?.kind === 'file' && item?.file) {
                            // Handle file selection - pass to file handler
                            fileHandler.processFiles([item.file]);
                        }
                    });

                    // Listen for open events (double-click on files)
                    explorerEl.addEventListener('open', (e: any) => {
                        const { item } = e.detail;
                        if (item?.kind === 'file' && item?.file) {
                            // Handle file opening - check file type and switch to appropriate view
                            if (fileHandler.isMarkdownFile(item.file)) {
                                // Switch to markdown viewer and load the file
                                state.view = 'markdown-viewer';
                                fileHandler.readFileAsText(item.file).then(content => {
                                    state.markdown = content;
                                    persistMarkdown();
                                    render();
                                }).catch(error => {
                                    console.error('Failed to read markdown file:', error);
                                    state.message = 'Failed to read file';
                                    renderStatus();
                                    setTimeout(() => {
                                        state.message = '';
                                        renderStatus();
                                    }, 3000);
                                });
                            } else {
                                // For other files, just add to file handler
                                fileHandler.processFiles([item.file]);
                            }
                        }
                    });

                    content.innerHTML = '';
                    content.append(explorerEl);
                    renderStatus();
                } catch (error) {
                    console.error('Failed to create file explorer:', error);
                    content.innerHTML = '<div class="component-error"><h3>Failed to create File Explorer</h3><p>Please try refreshing the page.</p></div>';
                    renderStatus();
                }
            }).catch(error => {
                console.error('Failed to load file explorer:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load File Explorer</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        if (state.view === "workcenter") {
            // Lazy load work center
            content.innerHTML = '<div class="component-loading"><div class="loading-spinner"></div><span>Loading Work Center...</span></div>';

            getCachedComponent(
                'workcenter',
                () => import('./workcenter/WorkCenter').then(m => m.WorkCenterManager),
                { componentName: 'WorkCenter' }
            ).then(workCenterModule => {
                // Create work center manager if not already created
                if (!state.workCenterManager) {
                    state.workCenterManager = new workCenterModule.component({
                        state: state,
                        history: state.history,
                        onFilesChanged: () => {
                            // Re-render toolbar to update file count badge
                            renderToolbar();
                        },
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
                }

                const workCenterElement = state.workCenterManager.renderWorkCenterView();
                content.innerHTML = '';
                content.append(workCenterElement);
                renderStatus();
            }).catch(error => {
                console.error('Failed to load work center:', error);
                content.innerHTML = '<div class="component-error"><h3>Failed to load Work Center</h3><p>Please try refreshing the page.</p></div>';
                renderStatus();
            });
            return;
        }

        // Default fallback to markdown viewer
        renderMarkdownViewer().then(viewerElement => {
            content.append(viewerElement);
            renderStatus();
        }).catch(error => {
            console.error('Failed to load default markdown viewer:', error);
            content.innerHTML = '<div class="component-error"><h3>Failed to load Markdown Viewer</h3><p>Please try refreshing the page.</p></div>';
            renderStatus();
        });
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
            if (action === "view-file-explorer") state.view = "file-explorer";

            if (action === "open-md") fileInput.click();
            if (action === "save-md") saveToFile();
            if (action === "export-md") exportMarkdown();
            if (action === "export-docx") {
                const md = state.markdown || "";
                if (md.trim()) {
                    await downloadMarkdownAsDocx(md, {
                        title: "CrossWord",
                        filename: `crossword-${Date.now()}.docx`,
                    });
                }
            }

            if (action === "toggle-edit") {
                if (state.view !== "markdown-viewer" && state.view !== "markdown-editor") return;
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
