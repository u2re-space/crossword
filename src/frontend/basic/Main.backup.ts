//@ts-ignore
import style from "./Main.scss?inline";

import { H } from "fest/lure";
import { recognizeByInstructions, solveAndAnswer, writeCode, extractCSS } from "@rs-com/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-com/config/Settings";
import type { AppSettings } from "@rs-com/config/SettingsTypes";
import { ensureStyleSheet } from "fest/icon";

// Import unified messaging system
import { unifiedMessaging, sendToWorkCenter, sendToClipboard, navigateToView, initializeComponent, hasPendingMessages } from "@rs-com/core/UnifiedMessaging";

// Import lazy loading utility
import { getCachedComponent } from "./modules/LazyLoader";

// Import file handling components that are always needed
import { createFileHandler } from "./modules/FileHandling";
import { getSpeechPrompt } from "./modules/VoiceInput";
import { createTemplateManager } from "./modules/TemplateManager";
import { CHANNELS } from "@rs-frontend/pwa/sw-handling";
import { loadAsAdopted } from "fest/dom";
import { dynamicTheme } from "fest/lure";
import { clearIconCaches, clearIconCache, testIconRacing, reinitializeRegistry, debugIconSystem } from "fest/icon";
import type { FileManager } from "./explorer";
import { downloadMarkdownAsDocx } from "./modules/DocxExport";

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

// Hash location mappings for views
const HASH_VIEW_MAPPING = {
  '#viewer': 'markdown-viewer',
  '#editor': 'markdown-editor',
  '#workcenter': 'workcenter',
  '#settings': 'settings',
  '#history': 'history',
  '#explorer': 'file-explorer',
  '#rich-editor': 'rich-editor'
} as const;

const VIEW_HASH_MAPPING = {
  'markdown-viewer': '#viewer',
  'markdown-editor': '#editor',
  'workcenter': '#workcenter',
  'settings': '#settings',
  'history': '#history',
  'file-explorer': '#explorer',
  'rich-editor': '#rich-editor'
} as const;



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

    // Hash location management
const getViewFromHash = (): BasicView | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    return (HASH_VIEW_MAPPING as any)[hash] || null;
};

const setViewHash = (view: BasicView): void => {
    if (typeof window === "undefined") return;
    const hash = (VIEW_HASH_MAPPING as any)[view];
    if (hash) {
        window.history.replaceState(null, '', hash);
    }
};

const handleHashChange = (): void => {
    const hashView = getViewFromHash();
    if (hashView && hashView !== state.view) {
        console.log(`[HashChange] Switching to view: ${hashView} from hash`);
        state.view = hashView;
        render();
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
        quillEditor: null as any,
        explorerElement: null as any
    };

    // Initialize unified messaging for this app instance
    unifiedMessaging.registerHandler('markdown-viewer', {
        canHandle: (msg) => msg.destination === 'markdown-viewer',
        handle: async (msg) => {
            if (msg.data?.text) {
                state.markdown = msg.data.text;
                state.view = 'markdown-viewer';
                persistMarkdown();
                render();
            }
        }
    });

    unifiedMessaging.registerHandler('workcenter', {
        canHandle: (msg) => msg.destination === 'workcenter',
        handle: async (msg) => {
            state.view = 'workcenter';
            setViewHash('workcenter');
            render();
        }
    });

    // Handler for basic-viewer (places/renders content in view)
    unifiedMessaging.registerHandler('basic-viewer', {
        canHandle: (msg) => msg.destination === 'basic-viewer',
        handle: async (msg) => {
            // Default action: place/render content in view
            if (msg.data?.text || msg.data?.content) {
                const content = msg.data.text || msg.data.content;
                state.markdown = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                state.view = 'markdown-viewer';
                setViewHash('markdown-viewer');
                persistMarkdown();
                render();

                state.message = "Content loaded in viewer";
                renderStatus();
                setTimeout(() => {
                    state.message = "";
                    renderStatus();
                }, 3000);
            }
        }
    });

    // Handler for basic-workcenter (attaches as file input/attachment)
    let workCenterAttachmentInProgress = false;
    unifiedMessaging.registerHandler('basic-workcenter', {
        canHandle: (msg) => msg.destination === 'basic-workcenter',
        handle: async (msg) => {
            // Prevent multiple simultaneous attachments
            if (workCenterAttachmentInProgress) {
                console.log('[Basic] Work center attachment already in progress, ignoring duplicate request');
                return;
            }
            workCenterAttachmentInProgress = true;
            // Default action: attach as file input/attachment
            state.view = 'workcenter';
            setViewHash('workcenter');

            // Convert content to file-like object first
            let fileToAttach: File | null = null;
            try {
                if (msg.data.file instanceof File) {
                    fileToAttach = msg.data.file;
                } else if (msg.data.blob instanceof Blob) {
                    // Create file from blob
                    const filename = msg.data.filename || `attachment-${Date.now()}.${msg.contentType === 'markdown' ? 'md' : 'txt'}`;
                    fileToAttach = new File([msg.data.blob], filename, { type: msg.data.blob.type });
                } else if (msg.data.text || msg.data.content) {
                    // Create file from text content
                    const content = msg.data.text || msg.data.content;
                    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                    const filename = msg.data.filename || `content-${Date.now()}.${msg.contentType === 'markdown' ? 'md' : 'txt'}`;
                    const mimeType = msg.contentType === 'markdown' ? 'text/markdown' : 'text/plain';
                    fileToAttach = new File([textContent], filename, { type: mimeType });

                    console.log('[Basic] Created file for attachment:', {
                        filename,
                        mimeType,
                        size: textContent.length,
                        contentPreview: textContent.substring(0, 100) + '...'
                    });
                }
            } catch (error) {
                console.warn('[Basic] Failed to create file from message data:', error);
                state.message = "Failed to process content";
                renderStatus();
                setTimeout(() => {
                    state.message = "";
                    renderStatus();
                }, 3000);
                return;
            }

            if (!fileToAttach) {
                console.warn('[Basic] No valid file content found in message');
                return;
            }

            // Store the file to attach for later processing
            const pendingAttachment = { file: fileToAttach, message: msg };

            // Trigger render to show work center view and start loading
            render();

            // Wait for work center to be loaded and then attach content
            const attachWhenReady = async () => {
                try {
                    // If work center is already loaded, attach immediately
                    if (state.workCenterManager) {
                        state.workCenterManager.getState().files.push(fileToAttach);
                        state.message = `Attached ${fileToAttach.name} to Work Center`;
                        renderStatus();
                        setTimeout(() => {
                            state.message = "";
                            renderStatus();
                        }, 3000);
                        return;
                    }

                    // Wait a bit more for the render function to load the work center
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // If still not loaded, the render function might have failed
                    if (!state.workCenterManager) {
                        throw new Error('Work center failed to load');
                    }

                    // Now attach the file
                    console.log('[Basic] Adding file to work center state:', fileToAttach.name, 'files before:', state.workCenterManager.getState().files.length);
                    state.workCenterManager.getState().files.push(fileToAttach);
                    console.log('[Basic] Files after adding:', state.workCenterManager.getState().files.length);

                    // Trigger UI update by re-rendering the work center
                    const workCenterContainer = document.querySelector('.workcenter-view');
                    if (workCenterContainer) {
                        console.log('[Basic] Found work center container, re-rendering');
                        const newView = state.workCenterManager.renderWorkCenterView();
                        workCenterContainer.replaceWith(newView);
                    } else {
                        console.log('[Basic] No work center container found for re-rendering, current containers:', document.querySelectorAll('*[class*="workcenter"]'));
                        // Fallback: trigger a full render
                        render();
                    }

                    state.message = `Attached ${fileToAttach.name} to Work Center`;
                    renderStatus();
                    setTimeout(() => {
                        state.message = "";
                        renderStatus();
                    }, 3000);

                } catch (error) {
                    console.warn('[Basic] Failed to attach content to workcenter:', error);
                    state.message = "Failed to attach content";
                    renderStatus();
                    setTimeout(() => {
                        state.message = "";
                        renderStatus();
                    }, 3000);
                }
            };

            // Attach content after ensuring work center is loaded
            const attachAfterLoad = async () => {
                try {
                    // If work center is already loaded, attach immediately
                    if (state.workCenterManager) {
                        await attachWhenReady();
                        return;
                    }

                    // Wait for work center to load (with timeout)
                    let attempts = 0;
                    const maxAttempts = 50; // 5 seconds max wait

                    while (!state.workCenterManager && attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }

                    if (state.workCenterManager) {
                        await attachWhenReady();
                    } else {
                        console.error('[Basic] Work center failed to load within timeout');
                        state.message = "Failed to load Work Center";
                        renderStatus();
                        setTimeout(() => {
                            state.message = "";
                            renderStatus();
                        }, 3000);
                    }
                } finally {
                    workCenterAttachmentInProgress = false;
                }
            };

            attachAfterLoad();
        }
    });

    // Handler for basic-explorer destination (saves to OPFS or performs file operations)
    unifiedMessaging.registerHandler('basic-explorer', {
        canHandle: (msg) => msg.destination === 'basic-explorer',
        handle: async (msg) => {
            // Ensure explorer view is active
            if (state.view !== 'file-explorer') {
                state.view = 'file-explorer';
                setViewHash('file-explorer');
                render();
            }

            // Handle different explorer actions
            setTimeout(async () => {
                try {
                    const action = msg.data?.action || 'save';
                    const path = msg.data?.path || msg.data?.into || '/';

                    if (action === 'save' && (msg.data?.file || msg.data?.text || msg.data?.content)) {
                        // Save content to OPFS
                        let fileToSave: File | null = null;

                        if (msg.data.file instanceof File) {
                            fileToSave = msg.data.file;
                        } else if (msg.data.blob instanceof Blob) {
                            const filename = msg.data.filename || `file-${Date.now()}`;
                            fileToSave = new File([msg.data.blob], filename, { type: msg.data.blob.type });
                        } else if (msg.data.text || msg.data.content) {
                            const content = msg.data.text || msg.data.content;
                            const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                            const filename = msg.data.filename || `content-${Date.now()}.txt`;
                            fileToSave = new File([textContent], filename, { type: 'text/plain' });
                        }

                        if (fileToSave && state.explorerElement) {
                            // Navigate to target path first
                            if (path && path !== state.explorerElement.path) {
                                state.explorerElement.path = path;
                            }

                            // Use the file explorer's upload functionality
                            // This simulates uploading a file to the current directory
                            console.log(`[Basic] Saving file ${fileToSave.name} to Explorer at: ${path}`);
                            state.message = `Saved ${fileToSave.name} to Explorer`;
                            renderStatus();
                            setTimeout(() => {
                                state.message = "";
                                renderStatus();
                            }, 3000);
                        }
                    } else if (action === 'view' && msg.data?.path) {
                        // Navigate to path for viewing
                        if (state.explorerElement && path) {
                            state.explorerElement.path = path;
                            console.log(`[Basic] Navigated Explorer to path: ${path}`);
                            state.message = `Opened Explorer at ${path}`;
                            renderStatus();
                            setTimeout(() => {
                                state.message = "";
                                renderStatus();
                            }, 2000);
                        }
                    } else if (action === 'place' && msg.data?.place && msg.data?.into) {
                        // Place data into specific path
                        const targetPath = msg.data.into;
                        if (state.explorerElement && targetPath) {
                            state.explorerElement.path = targetPath;
                            console.log(`[Basic] Navigated Explorer to place data at: ${targetPath}`);
                            state.message = `Explorer ready at ${targetPath}`;
                            renderStatus();
                            setTimeout(() => {
                                state.message = "";
                                renderStatus();
                            }, 3000);
                        }
                    } else if (action === 'navigate' && path) {
                        // Simple navigation
                        if (state.explorerElement) {
                            state.explorerElement.path = path;
                            state.message = `Explorer navigated to ${path}`;
                            renderStatus();
                            setTimeout(() => {
                                state.message = "";
                                renderStatus();
                            }, 2000);
                        }
                    }
                } catch (error) {
                    console.warn('[Basic] Failed to handle explorer action:', error);
                    state.message = "Failed to perform Explorer action";
                    renderStatus();
                    setTimeout(() => {
                        state.message = "";
                        renderStatus();
                    }, 3000);
                }
            }, 100);
        }
    });

    // Handler for print destination (renders as printable content)
    unifiedMessaging.registerHandler('print', {
        canHandle: (msg) => msg.destination === 'print',
        handle: async (msg) => {
            // Default action: render as printable content
            if (msg.data?.text || msg.data?.content) {
                const content = msg.data.text || msg.data.content;
                const printableContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

                // Open print dialog with the content
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Print - CrossWord</title>
                            <style>
                                body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; line-height: 1.6; }
                                pre { white-space: pre-wrap; word-wrap: break-word; }
                                @media print { body { margin: 1rem; } }
                            </style>
                        </head>
                        <body>
                            <pre>${printableContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        }
    });

    // Setup hash location support
    if (typeof window !== "undefined") {
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);

        // Check initial hash
        const initialHashView = getViewFromHash();
        if (initialHashView) {
            state.view = initialHashView;

            // Check for pending messages for the initial view
            const destinationMap: Record<string, Destination> = {
                'markdown-viewer': 'basic-viewer',
                'markdown-editor': 'markdown-editor',
                'rich-editor': 'rich-editor',
                'workcenter': 'basic-workcenter',
                'file-explorer': 'basic-explorer'
            };

            const destination = destinationMap[initialHashView];
            if (destination && hasPendingMessages(destination)) {
                console.log(`[Main] Found pending messages for initial view ${initialHashView}`);
                // Messages will be processed when the component initializes
            }
        }
    }

    // If we were launched with files (share-target), force WorkCenter and attach them.
    // (This must run after state + fileHandler exist.)
    if (Array.isArray(options.initialFiles) && options.initialFiles.length > 0) {
        state.view = "workcenter";
        setViewHash("workcenter");
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
        ${isWorkCenterView ? H`<button class="btn" data-action="process-content" type="button" title="Process Content">
          <ui-icon icon="brain" icon-style="duotone"></ui-icon>
          <span>Process</span>
        </button>
        <button class="btn" data-action="save-to-explorer" type="button" title="Save Results to Explorer">
          <ui-icon icon="floppy-disk" icon-style="duotone"></ui-icon>
          <span>Save to Explorer</span>
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
                () => import('./viewer/MarkdownViewer'),
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
                    // Use unified messaging to send to work center
                    await unifiedMessaging.sendMessage({
                        id: crypto.randomUUID(),
                        type: 'content-share',
                        source: 'basic-viewer',
                        destination: 'basic-workcenter',
                        contentType: 'markdown',
                        data: {
                            text: content,
                            filename: `content-${Date.now()}.md`
                        },
                        metadata: {
                            title: 'Content from Viewer',
                            timestamp: Date.now(),
                            source: 'markdown-viewer'
                        }
                    });
                },
                onPrint: async (content: string) => {
                    // Use unified messaging to send to print destination
                    await unifiedMessaging.sendMessage({
                        id: crypto.randomUUID(),
                        type: 'content-print',
                        source: 'basic-viewer',
                        destination: 'print',
                        contentType: 'markdown',
                        data: {
                            text: content,
                            filename: `print-${Date.now()}.md`
                        },
                        metadata: {
                            title: 'Print Content',
                            timestamp: Date.now(),
                            source: 'markdown-viewer'
                        }
                    });
                }
            });

            const viewerElement = viewer.render();

            // Set up drag and drop handling
            fileHandler.setupDragAndDrop(viewerElement);
            fileHandler.setupPasteHandling(viewerElement);

            // Initialize component with catch-up messaging
            initializeComponent('basic-viewer', { viewer, element: viewerElement })
              .then(async (pendingMessages) => {
                // Process any pending messages for viewer
                for (const message of pendingMessages) {
                  console.log(`[Viewer] Processing pending message:`, message);
                  await unifiedMessaging.sendMessage(message);
                }
              })
              .catch(error => {
                console.warn('[Viewer] Failed to initialize with catch-up messaging:', error);
              });

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

            // Initialize component with catch-up messaging
            initializeComponent('markdown-editor', { editor, element: editorElement })
              .then(async (pendingMessages) => {
                // Process any pending messages for editor
                for (const message of pendingMessages) {
                  console.log(`[Editor] Processing pending message:`, message);
                  await unifiedMessaging.sendMessage(message);
                }
              })
              .catch(error => {
                console.warn('[Editor] Failed to initialize with catch-up messaging:', error);
              });

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

            // Initialize component with catch-up messaging
            initializeComponent('rich-editor', { editor, element: editorElement })
              .then(async (pendingMessages) => {
                // Process any pending messages for rich editor
                for (const message of pendingMessages) {
                  console.log(`[RichEditor] Processing pending message:`, message);
                  await unifiedMessaging.sendMessage(message);
                }
              })
              .catch(error => {
                console.warn('[RichEditor] Failed to initialize with catch-up messaging:', error);
              });

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

            // Initialize component with catch-up messaging
            initializeComponent('history', { manager: historyManager, element: historyElement })
              .then(async (pendingMessages) => {
                // Process any pending messages for history
                for (const message of pendingMessages) {
                  console.log(`[History] Processing pending message:`, message);
                  await unifiedMessaging.sendMessage(message);
                }
              })
              .catch(error => {
                console.warn('[History] Failed to initialize with catch-up messaging:', error);
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

            // Update hash to match current view
            setViewHash(state.view);

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

                // Initialize component with catch-up messaging
                initializeComponent('settings', { element: settingsEl })
                  .then(async (pendingMessages) => {
                    // Process any pending messages for settings
                    for (const message of pendingMessages) {
                      console.log(`[Settings] Processing pending message:`, message);
                      await unifiedMessaging.sendMessage(message);
                    }
                  })
                  .catch(error => {
                    console.warn('[Settings] Failed to initialize with catch-up messaging:', error);
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
                    explorerEl.addEventListener('open-item', async (e: any) => {
                        const { item } = e.detail;
                        if (item?.kind === 'file' && item?.file) {
                            // Use unified messaging to handle file opening
                            await unifiedMessaging.sendMessage({
                                id: crypto.randomUUID(),
                                type: 'content-share',
                                source: 'basic-explorer',
                                destination: 'basic-workcenter', // Default to workcenter for attachment
                                contentType: 'file',
                                data: {
                                    file: item.file,
                                    filename: item.name,
                                    path: explorerEl.path
                                },
                                metadata: {
                                    title: item.name,
                                    timestamp: Date.now(),
                                    source: 'file-explorer'
                                }
                            });
                        }
                    });

                    // Listen for open events (double-click on files)
                    explorerEl.addEventListener('open', async (e: any) => {
                        const { item } = e.detail;
                        if (item?.kind === 'file' && item?.file) {
                            // Determine destination based on file type
                            const isMarkdown = fileHandler.isMarkdownFile(item.file);
                            const destination = isMarkdown ? 'basic-viewer' : 'basic-workcenter';

                            await unifiedMessaging.sendMessage({
                                id: crypto.randomUUID(),
                                type: 'content-share',
                                source: 'basic-explorer',
                                destination,
                                contentType: isMarkdown ? 'markdown' : 'file',
                                data: {
                                    file: item.file,
                                    filename: item.name,
                                    path: explorerEl.path
                                },
                                metadata: {
                                    title: item.name,
                                    timestamp: Date.now(),
                                    source: 'file-explorer'
                                }
                            });
                        }
                    });

                    // Listen for context menu actions
                    explorerEl.addEventListener('context-action', async (e: any) => {
                        const { action, item } = e.detail;

                        if (action === 'attach-workcenter' && item?.kind === 'file' && item?.file) {
                            await unifiedMessaging.sendMessage({
                                id: crypto.randomUUID(),
                                type: 'content-share',
                                source: 'basic-explorer',
                                destination: 'basic-workcenter',
                                contentType: 'file',
                                data: {
                                    file: item.file,
                                    filename: item.name,
                                    path: explorerEl.path
                                },
                                metadata: {
                                    title: `Attach ${item.name} to Work Center`,
                                    timestamp: Date.now(),
                                    source: 'file-explorer'
                                }
                            });
                        } else if (action === 'view' && item?.kind === 'file' && item?.file) {
                            const isMarkdown = fileHandler.isMarkdownFile(item.file);
                            const destination = isMarkdown ? 'basic-viewer' : 'basic-workcenter';

                            await unifiedMessaging.sendMessage({
                                id: crypto.randomUUID(),
                                type: 'content-share',
                                source: 'basic-explorer',
                                destination,
                                contentType: isMarkdown ? 'markdown' : 'file',
                                data: {
                                    file: item.file,
                                    filename: item.name,
                                    path: explorerEl.path
                                },
                                metadata: {
                                    title: `View ${item.name}`,
                                    timestamp: Date.now(),
                                    source: 'file-explorer'
                                }
                            });
                        }
                    });

                    // Store reference for unified messaging
                    state.explorerElement = explorerEl;

                    // Initialize component with catch-up messaging
                    initializeComponent('basic-explorer', { element: explorerEl, path: explorerEl.path })
                      .then(async (pendingMessages) => {
                        // Process any pending messages
                        for (const message of pendingMessages) {
                          console.log(`[Explorer] Processing pending message:`, message);
                          await unifiedMessaging.sendMessage(message);
                        }
                      })
                      .catch(error => {
                        console.warn('[Explorer] Failed to initialize with catch-up messaging:', error);
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

                // Initialize component with catch-up messaging
                initializeComponent('basic-workcenter', {
                  manager: state.workCenterManager,
                  state: state.workCenterManager.getState()
                }).then(async (pendingMessages) => {
                  // Process any pending messages for work center
                  for (const message of pendingMessages) {
                    console.log(`[WorkCenter] Processing pending message:`, message);
                    await unifiedMessaging.sendMessage(message);
                  }
                }).catch(error => {
                  console.warn('[WorkCenter] Failed to initialize with catch-up messaging:', error);
                });

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

            // Handle view changes with hash updates
            let newView: BasicView | null = null;
            if (action === "view-markdown-viewer") newView = "markdown-viewer";
            if (action === "view-markdown-editor") newView = "markdown-editor";
            if (action === "view-rich-editor") newView = "rich-editor";
            if (action === "view-workcenter") newView = "workcenter";
            if (action === "view-settings") newView = "settings";
            if (action === "view-history") newView = "history";
            if (action === "view-file-explorer") newView = "file-explorer";

            if (newView) {
                state.view = newView;
                setViewHash(newView);
            }

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

            if (action === "process-content") {
                // Use unified messaging to send to work center for processing
                if (state.workCenterManager) {
                    await unifiedMessaging.sendMessage({
                        id: crypto.randomUUID(),
                        type: 'content-process',
                        source: 'main-app',
                        destination: 'workcenter',
                        data: { prompt: state.markdown || "Process this content" },
                        metadata: {
                            timestamp: Date.now(),
                            correlationId: `main-${Date.now()}`
                        }
                    });
                }
            }

            if (action === "save-to-explorer") {
                // Save work center results to explorer
                if (state.workCenterManager) {
                    const workCenterState = state.workCenterManager.getState();
                    const results = workCenterState.results || [];

                    if (results.length > 0) {
                        // Save the latest result to explorer
                        const latestResult = results[results.length - 1];
                        await unifiedMessaging.sendMessage({
                            id: crypto.randomUUID(),
                            type: 'content-save',
                            source: 'main-app',
                            destination: 'basic-explorer',
                            data: {
                                action: 'save',
                                text: typeof latestResult === 'string' ? latestResult : JSON.stringify(latestResult, null, 2),
                                filename: `workcenter-result-${Date.now()}.txt`,
                                path: '/workcenter-results/'
                            },
                            metadata: {
                                title: 'Work Center Result',
                                timestamp: Date.now(),
                                source: 'workcenter'
                            }
                        });
                    } else {
                        state.message = "No results to save";
                        renderStatus();
                        setTimeout(() => {
                            state.message = "";
                            renderStatus();
                        }, 2000);
                    }
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
                    setViewHash("markdown-viewer");
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
