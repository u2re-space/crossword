import { H } from "fest/lure";
import "./frontend/choice.scss";

// PWA clipboard and service worker communication
import { initPWAClipboard } from "./frontend/shared/pwa-copy";
import { showToast } from "./frontend/shared/Toast";

// ============================================================================
// CSS INJECTION
// ============================================================================

const ensureAppCss = () => {
    // App is built as a JS module; make sure extracted CSS is loaded in production.
    // Skip extension pages: they have their own HTML entrypoints and CSS injection.
    const viteEnv = (import.meta as any)?.env;
    if (viteEnv?.DEV) return;
    if (typeof window === "undefined") return;
    if (window.location.protocol === "chrome-extension:") return;

    const id = "rs-crossword-css";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";

    // Resolve CSS relative to module location (handles /apps/cw/ mounting)
    // Module is at .../modules/index.js, CSS is at .../assets/crossword.css
    try {
        // Go up from modules/ to app root, then into assets/
        const cssUrl = new URL("../assets/crossword.css", import.meta.url);
        link.href = cssUrl.toString();
    } catch {
        // Fallback: try document-relative path
        link.href = "assets/crossword.css";
    }

    // Handle load errors by trying alternative paths
    let altIndex = 0;
    link.onerror = () => {
        const altPaths = [
            // Relative to app root (if main entry, not in modules/)
            new URL("./assets/crossword.css", import.meta.url).toString(),
            // Absolute from document root
            "/assets/crossword.css",
            // Common app mounting paths
            "/apps/cw/assets/crossword.css",
        ];

        if (altIndex < altPaths.length) {
            const nextPath = altPaths[altIndex++];
            if (link.href !== nextPath) {
                console.warn(`[CSS] Trying path: ${nextPath}`);
                link.href = nextPath;
                return;
            }
        }
        link.onerror = null;
    };

    document.head.append(link);
};

// ============================================================================
// SERVICE WORKER INITIALIZATION
// ============================================================================

let _swRegistration: ServiceWorkerRegistration | null = null;
let _swInitPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Initialize PWA service worker early in the page lifecycle
 * This ensures share target and other PWA features work correctly
 */
const initServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    // Return cached promise if already initializing
    if (_swInitPromise) return _swInitPromise;

    _swInitPromise = (async () => {
        // Skip in extension context
        if (typeof window === 'undefined') return null;
        if (window.location.protocol === 'chrome-extension:') return null;
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service workers not supported');
            return null;
        }

        try {
            // Determine SW path based on context
            const swPath = './apps/cw/sw.js';
            const swUrl = new URL(swPath, window.location.origin).href;

            console.log('[PWA] Registering service worker:', swUrl);

            const registration = await navigator.serviceWorker.register(swUrl, {
                scope: '/',
                type: 'module',
                updateViaCache: 'none'
            });

            _swRegistration = registration;

            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New service worker available');
                            showToast({ message: 'App update available', kind: 'info' });
                        }
                    });
                }
            });

            // Check for updates periodically (every 30 minutes)
            setInterval(() => {
                registration.update().catch(console.warn);
            }, 30 * 60 * 1000);

            console.log('[PWA] Service worker registered successfully');
            return registration;
        } catch (error) {
            console.error('[PWA] Service worker registration failed:', error);
            return null;
        }
    })();

    return _swInitPromise;
};

/**
 * Get current service worker registration
 */
export const getServiceWorkerRegistration = () => _swRegistration;

/**
 * Wait for service worker to be ready
 */
export const waitForServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (_swRegistration) return _swRegistration;
    return _swInitPromise || initServiceWorker();
};

// ============================================================================
// BROADCAST RECEIVERS
// ============================================================================

let _receiversCleanup: (() => void) | null = null;

const initReceivers = () => {
    if (_receiversCleanup) return;
    _receiversCleanup = initPWAClipboard();
};

// ============================================================================
// SHARE TARGET PROCESSING
// ============================================================================

interface ShareDataInput {
    title?: string;
    text?: string;
    url?: string;
    sharedUrl?: string;
    files?: File[] | any[];
    fileCount?: number;
    imageCount?: number;
    timestamp?: number;
    aiProcessed?: boolean;
    results?: any[];
}

/**
 * Extract processable content from share data
 * Handles various formats from SW, server, or direct input
 */
const extractShareContent = (shareData: ShareDataInput): { content: string | null; type: 'text' | 'url' | 'file' | null } => {
    // Check for text content first
    const text = shareData.text?.trim();
    if (text) {
        return { content: text, type: 'text' };
    }

    // Check for URL (handle both 'url' and 'sharedUrl' from server)
    const url = (shareData.url || shareData.sharedUrl)?.trim();
    if (url) {
        return { content: url, type: 'url' };
    }

    // Check for title as fallback
    const title = shareData.title?.trim();
    if (title) {
        return { content: title, type: 'text' };
    }

    // Check for actual file objects
    if (Array.isArray(shareData.files) && shareData.files.length > 0) {
        const firstFile = shareData.files[0];
        if (firstFile instanceof File || firstFile instanceof Blob) {
            return { content: null, type: 'file' };
        }
    }

    return { content: null, type: null };
};

/**
 * Process share target data with AI
 * This is called when SW didn't process (or failed), or for server-side fallback
 */
const processShareTargetData = async (shareData: ShareDataInput, skipIfEmpty = false): Promise<boolean> => {
    console.log("[ShareTarget] Processing shared data:", shareData);

    // If AI already processed in SW, just show result info
    if (shareData.aiProcessed && shareData.results?.length) {
        console.log("[ShareTarget] AI already processed in SW, showing result");
        showToast({ message: "Content processed by service worker", kind: "success" });
        return true;
    }

    const { content, type } = extractShareContent(shareData);

    if (!content && type !== 'file') {
        if (skipIfEmpty) {
            console.log("[ShareTarget] No content to process (skipping)");
            return false;
        }

        // Check if there's file metadata but no actual files
        if (shareData.fileCount && shareData.fileCount > 0) {
            // Files were processed in SW, this is just metadata notification
            console.log("[ShareTarget] Files processed in service worker");
            showToast({ message: "Files received and being processed", kind: "info" });
            return true;
        }

        console.warn("[ShareTarget] No content to process");
        showToast({ message: "No content received to process", kind: "warning" });
        return false;
    }

    try {
        showToast({ message: "Processing shared content...", kind: "info" });

        // Import AI functions dynamically
        const { recognizeByInstructions } = await import("@rs-core/service/AI-ops/RecognizeData");
        const { getUsableData } = await import("@rs-core/service/model/GPT-Responses");

        let inputData: string | File;

        if (type === 'file' && shareData.files?.[0]) {
            inputData = shareData.files[0] as File;
        } else if (content) {
            inputData = content;
        } else {
            throw new Error("No processable content");
        }

        // Convert to usable format
        const usableData = await getUsableData({ dataSource: inputData });

        const input = [{
            type: "message",
            role: "user",
            content: [usableData]
        }];

        // Process with AI
        const result = await recognizeByInstructions(input, "", undefined, undefined, { useActiveInstruction: true });

        if (result?.ok && result?.data) {
            // Copy result to clipboard using requestAnimationFrame for proper focus triggering
            const resultText = typeof result.data === 'string'
                ? result.data
                : JSON.stringify(result.data, null, 2);

            // Use requestAnimationFrame to ensure proper focus and timing for clipboard API
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    // Ensure document has focus for clipboard API
                    if (typeof document !== 'undefined' && document.hasFocus && !document.hasFocus()) {
                        window.focus();
                    }

                    // Use clipboard API with proper timing
                    navigator.clipboard?.writeText(resultText).then(() => {
                        showToast({ message: "Content processed and copied!", kind: "success" });
                        resolve();
                    }).catch((clipboardError) => {
                        console.warn("[ShareTarget] Clipboard write failed, trying fallback:", clipboardError);
                        // Fallback to legacy clipboard method
                        try {
                            const textarea = document.createElement('textarea');
                            textarea.value = resultText;
                            textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
                            document.body.appendChild(textarea);
                            textarea.select();
                            const success = document.execCommand('copy');
                            textarea.remove();
                            if (success) {
                                showToast({ message: "Content processed and copied!", kind: "success" });
                            } else {
                                showToast({ message: "Content processed but copy failed", kind: "warning" });
                            }
                        } catch (legacyError) {
                            console.error("[ShareTarget] All clipboard methods failed:", legacyError);
                            showToast({ message: "Content processed but copy failed", kind: "warning" });
                        }
                        resolve();
                    });
                });
            });

            return true;
        } else {
            const errorMsg = result?.error || "Processing returned no data";
            showToast({ message: `Processing issue: ${errorMsg}`, kind: "warning" });
            return false;
        }
    } catch (error: any) {
        console.error("[ShareTarget] Processing error:", error);

        // Try fallback to server-side AI processing
        const fallbackResult = await tryServerSideProcessing(shareData);
        if (fallbackResult) return true;

        showToast({ message: `Failed: ${error?.message || error}`, kind: "error" });
        return false;
    }
};

/**
 * Fallback to server-side AI processing when client-side fails
 */
const tryServerSideProcessing = async (shareData: ShareDataInput): Promise<boolean> => {
    try {
        const { content, type } = extractShareContent(shareData);
        if (!content) return false;

        console.log("[ShareTarget] Attempting server-side AI fallback");

        // Get API settings
        const { getRuntimeSettings } = await import("@rs-core/config/RuntimeSettings");
        const settings = await getRuntimeSettings().catch(() => null);
        const apiKey = settings?.ai?.apiKey;

        if (!apiKey) {
            console.log("[ShareTarget] No API key for server fallback");
            return false;
        }

        // Call server-side AI endpoint
        const response = await fetch('/api/share/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: type === 'text' ? content : undefined,
                url: type === 'url' ? content : undefined,
                title: shareData.title,
                apiKey,
                baseUrl: settings?.ai?.baseUrl,
                model: settings?.ai?.customModel || settings?.ai?.model
            })
        });

        if (!response.ok) {
            console.warn("[ShareTarget] Server fallback failed:", response.status);
            return false;
        }

        const result = await response.json();
        if (result?.ok && result?.data) {
            // Use the unified clipboard system with requestAnimationFrame
            const { copy } = await import("./frontend/shared/Clipboard");
            await copy(String(result.data), { showFeedback: true });
            return true;
        }

        return false;
    } catch (error) {
        console.warn("[ShareTarget] Server fallback error:", error);
        return false;
    }
};

/**
 * Handle share target data from various sources
 */
const handleShareTarget = () => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("shared");

    // Handle URL params from server-side share handler
    if (shared === "1" || shared === "true") {
        // Extract share data from URL params (server-side handler)
        const shareFromParams: ShareDataInput = {
            title: params.get("title") || undefined,
            text: params.get("text") || undefined,
            url: params.get("url") || undefined,
            sharedUrl: params.get("sharedUrl") || undefined,
            timestamp: Date.now()
        };

        // Clean up URL
        const cleanUrl = new URL(window.location.href);
        ['shared', 'action', 'title', 'text', 'url', 'sharedUrl'].forEach(p => cleanUrl.searchParams.delete(p));
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.hash);

        // Check if we have content from params
        const { content } = extractShareContent(shareFromParams);
        if (content) {
            console.log("[ShareTarget] Processing from URL params");
            processShareTargetData(shareFromParams, true);
            return; // Don't also check cache
        }

        // No content in params, try cache
        if ('caches' in window) {
            caches.open("share-target-data")
                .then(cache => cache.match("/share-target-data"))
                .then(response => response?.json?.())
                .then(async (data: ShareDataInput | undefined) => {
                    if (data) {
                        console.log("[ShareTarget] Retrieved cached data:", data);
                        await processShareTargetData(data, true);
                    } else {
                        console.log("[ShareTarget] No cached share data found");
                    }
                })
                .catch(e => console.warn("[ShareTarget] Cache retrieval failed:", e));
        }
    } else if (shared === "test") {
        // Test mode - just show confirmation
        showToast({ message: "Share target route working", kind: "info" });

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("shared");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.hash);
    }

    // Check for pending share data from sessionStorage (server-side handler fallback)
    try {
        const pendingData = sessionStorage.getItem("rs-pending-share");
        if (pendingData) {
            sessionStorage.removeItem("rs-pending-share");
            const shareData = JSON.parse(pendingData) as ShareDataInput;
            console.log("[ShareTarget] Found pending share in sessionStorage:", shareData);
            processShareTargetData(shareData, true);
        }
    } catch (e) {
        // Ignore sessionStorage errors
    }

    // Listen for real-time share target broadcasts from service worker
    if (typeof BroadcastChannel !== "undefined") {
        const shareChannel = new BroadcastChannel("rs-share-target");
        shareChannel.addEventListener("message", async (event) => {
            const msgType = event.data?.type;
            const msgData = event.data?.data;

            if (msgType === "share-received" && msgData) {
                console.log("[ShareTarget] Broadcast received:", msgData);

                // Check if this is just a notification (files processed in SW)
                // vs actual data we need to process
                if (msgData.fileCount > 0 && !msgData.files?.length) {
                    // This is a notification - files were handled in SW
                    showToast({ message: `Processing ${msgData.fileCount} file(s)...`, kind: "info" });
                } else if (msgData.text || msgData.url || msgData.title) {
                    // We have text content to potentially process
                    await processShareTargetData(msgData, true);
                }
            } else if (msgType === "ai-result" && msgData) {
                // AI processing result from SW
                console.log("[ShareTarget] AI result from SW:", msgData);
                if (msgData.success && msgData.data) {
                    // Copy to clipboard using unified system with requestAnimationFrame
                    const text = typeof msgData.data === 'string' ? msgData.data : JSON.stringify(msgData.data);
                    const { copy } = await import("./frontend/shared/Clipboard");
                    await copy(text, { showFeedback: true });
                } else {
                    showToast({ message: msgData.error || "Processing failed", kind: "error" });
                }
            }
        });
    }
};

// ============================================================================
// LAUNCH QUEUE TYPES AND HANDLING
// ============================================================================

// Type definitions for Launch Queue API
interface LaunchParams {
    files: FileSystemFileHandle[];
    targetURL?: string;
}

interface LaunchQueue {
    setConsumer(callback: (launchParams: LaunchParams) => void): void;
}

declare global {
    interface Window {
        launchQueue?: LaunchQueue;
    }
}

/**
 * Set up launchQueue consumer for PWA file launches and share-target
 * This handles direct file launches when the PWA is opened with files
 */
const setupLaunchQueueConsumer = async () => {
    if (!('launchQueue' in window)) {
        console.log('[LaunchQueue] launchQueue API not available');
        return;
    }

    try {
        // Set up the consumer for launch queue
        window.launchQueue!.setConsumer(async (launchParams: LaunchParams) => {
            console.log('[LaunchQueue] Launch params received:', launchParams);

            // Handle files from launch queue
            if (launchParams.files && launchParams.files.length > 0) {
                console.log(`[LaunchQueue] Processing ${launchParams.files.length} file(s)`);

                // Convert FileSystemHandle objects to actual File objects
                const files: File[] = [];
                for (const fileHandle of launchParams.files) {
                    try {
                        // For file handles, get the actual file
                        if (fileHandle.getFile) {
                            const file = await fileHandle.getFile();
                            files.push(file);
                        } else if (fileHandle instanceof File) {
                            // Already a File object
                            files.push(fileHandle);
                        }
                    } catch (error) {
                        console.warn('[LaunchQueue] Failed to get file from handle:', error);
                    }
                }

                if (files.length > 0) {
                    // Create share data object compatible with existing processing
                    const shareData = {
                        files,
                        fileCount: files.length,
                        timestamp: Date.now(),
                        // Determine if there are images for AI processing
                        imageCount: files.filter(f => f.type.startsWith('image/')).length
                    };

                    console.log('[LaunchQueue] Created share data:', shareData);

                    // Process through the existing share target flow
                    try {
                        await processShareTargetData(shareData, false);
                    } catch (error) {
                        console.warn('[LaunchQueue] Failed to process files:', error);
                        // Fallback: show notification
                        showToast({
                            message: `${files.length} file(s) received but processing failed`,
                            kind: 'warning'
                        });
                    }
                }
            }

            // Handle any target URL if present (for custom protocol launches)
            if (launchParams.targetURL) {
                console.log('[LaunchQueue] Target URL:', launchParams.targetURL);
                // Could handle URL-based launches here if needed
            }
        });

        console.log('[LaunchQueue] Consumer set up successfully');
    } catch (error) {
        console.error('[LaunchQueue] Failed to set up consumer:', error);
    }
};

// ============================================================================
// PENDING SHARE DATA HANDLING
// ============================================================================

/**
 * Check for pending share data from server-side share target handler
 * This handles cases where the service worker wasn't active during share
 */
const checkPendingShareData = async () => {
    try {
        const pendingData = sessionStorage.getItem("rs-pending-share");
        if (!pendingData) return null;

        // Clear immediately to prevent duplicate processing
        sessionStorage.removeItem("rs-pending-share");

        const shareData = JSON.parse(pendingData);
        console.log("[ShareTarget] Found pending share data:", shareData);

        // Store in cache for the normal share target flow to pick up
        if ('caches' in window) {
            const cache = await caches.open('share-target-data');
            await cache.put('/share-target-data', new Response(JSON.stringify({
                ...shareData,
                files: [],
                timestamp: shareData.timestamp || Date.now()
            }), {
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        return shareData;
    } catch (error) {
        console.warn("[ShareTarget] Failed to process pending share data:", error);
        return null;
    }
};

export type FrontendChoice = "basic" | "faint";

const CHOICE_KEY = "rs-frontend-choice";
const REMEMBER_KEY = "rs-frontend-choice-remember";

const isExtension = () => {
  try {
    return window.location.protocol === "chrome-extension:" || Boolean((chrome as any)?.runtime?.id);
  } catch {
    return false;
  }
};

const isPwaDisplayMode = () => {
    if (!isExtension()) return true;
    return false;
  /*try {
    const standalone = (navigator as any)?.standalone === true;
    const mm = window.matchMedia?.("(display-mode: standalone)")?.matches || window.matchMedia?.("(display-mode: fullscreen)")?.matches;
    return Boolean(standalone || mm);
  } catch {
    return false;
  }*/
};

const loadChoice = (): FrontendChoice | null => {
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    return v === "basic" || v === "faint" ? v : null;
  } catch {
    return null;
  }
};

const loadRemember = (): boolean => {
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
};

const saveChoice = (choice: FrontendChoice, remember: boolean) => {
  try {
    localStorage.setItem(CHOICE_KEY, choice);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  } catch {
    // ignore
  }
};

const loadSubApp = async (choice: FrontendChoice) => {
  if (choice === "faint") {
    const mod = await import("./frontend/faint/layout/Views");
    return (mod as any).default as (mount: HTMLElement) => unknown;
  }

  const mod = await import("./frontend/basic");
  return (mod as any).default as (mount: HTMLElement) => unknown;
};

export const ChoiceScreen = (opts: {
  seconds: number;
  defaultChoice: FrontendChoice;
  onChoose: (choice: FrontendChoice, remember: boolean) => void;
  initialRemember?: boolean;
}) => {
  const headerText = H`<header class="choice-header">Boot menu</header>` as HTMLElement;
  const reasonsText = H`<div class="choice-reasons">Currently, I'm not able to actively support the complex <b>Faint</b> project. The <b>Basic</b> version is the default.</div>` as HTMLElement;

  const countdown = H`<div class="choice-countdown">Auto-start in <b>${opts.seconds}</b>s…</div>` as HTMLElement;
  const hint = H`<div class="choice-hint">Use <b>↑</b>/<b>↓</b> to select, <b>Enter</b> to boot.</div>` as HTMLElement;
  const remember = H`<label class="choice-remember">
    <input type="checkbox" />
    <span>Remember my choice</span>
  </label>` as HTMLElement;
  const rememberInput = remember.querySelector("input") as HTMLInputElement | null;
  if (rememberInput) rememberInput.checked = Boolean(opts.initialRemember);

  const bigBasicButton = H`<button class="basic big recommended" type="button">Basic</button>` as HTMLButtonElement;
  const unstableFaint = H`<button class="unstable small faint" type="button">Faint OS (unstable)</button>` as HTMLButtonElement;

  bigBasicButton.addEventListener("click", () => opts.onChoose("basic", Boolean(rememberInput?.checked)));
  unstableFaint.addEventListener("click", () => opts.onChoose("faint", Boolean(rememberInput?.checked)));

  const container = H`<div class="choice container"></div>` as HTMLElement;

  const menu = H`<div class="choice-menu" role="menu"></div>` as HTMLElement;
  menu.append(bigBasicButton, unstableFaint);

  // Minimal boot-menu keyboard navigation (↑/↓ + Enter)
  const options = [bigBasicButton, unstableFaint];
  let idx = 0;
  const focusAt = (nextIdx: number) => {
    const len = options.length;
    if (!len) return;
    idx = ((nextIdx % len) + len) % len;
    options[idx]?.focus?.();
  };
  container.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusAt(idx + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusAt(idx - 1);
      return;
    }
    if (e.key === "Enter") {
      const el = document.activeElement as HTMLElement | null;
      const btn = el?.closest?.("button") as HTMLButtonElement | null;
      btn?.click?.();
    }
  });

  container.append(headerText, countdown, hint, menu, remember, reasonsText);

  queueMicrotask(() => focusAt(0));
  return { container, countdownEl: countdown };
};

// ============================================================================
// BOOTSTRAP
// ============================================================================

export default async function bootstrap(mountElement: HTMLElement) {
    // Ensure CSS is loaded
    ensureAppCss();

    // Set up launch queue consumer for PWA file launches (must be done early)
    setupLaunchQueueConsumer();

    // Check for pending share data from server-side handler
    // This handles shares that arrived before SW was controlling
    checkPendingShareData();

    // Initialize service worker EARLY (don't await - runs in parallel)
    // This ensures PWA features like share target are available immediately
    initServiceWorker();

    // Initialize broadcast receivers for service worker communication
    initReceivers();

    // Handle share target data if coming from PWA share
    handleShareTarget();

    const defaultChoice: FrontendChoice = "basic";

    const hash = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
    if (hash === "basic") {
        const run = await loadSubApp("basic");
        run?.(mountElement);
        return;
    }
    if (hash === "faint") {
        const run = await loadSubApp("faint");
        run?.(mountElement);
        return;
    }

    if (isExtension()) {
        const run = await loadSubApp(defaultChoice);
        run?.(mountElement);
        return;
    }

    const pwa = isPwaDisplayMode();
    const remembered = loadRemember();
    const stored = loadChoice();

    if (pwa && remembered && stored) {
        const run = await loadSubApp(stored);
        run?.(mountElement);
        return;
    }

    if (!pwa) {
        const run = await loadSubApp(defaultChoice);
        run?.(mountElement);
        return;
    }

    mountElement.replaceChildren();

    let done = false;
    let seconds = 10;
    const { container, countdownEl } = ChoiceScreen({
        seconds,
        defaultChoice,
        onChoose: async (choice, remember) => {
            if (done) return;
            done = true;
            clearInterval(timer);
            if (remember) saveChoice(choice, true);
            else saveChoice(choice, false);
            mountElement.replaceChildren();
            const run = await loadSubApp(choice);
            run?.(mountElement);
        },
    });

    const timer = window.setInterval(() => {
        if (done) return;
        seconds -= 1;
        const b = countdownEl.querySelector("b");
        if (b) b.textContent = String(Math.max(0, seconds));
        if (seconds <= 0) {
            done = true;
            clearInterval(timer);
            void (async () => {
                mountElement.replaceChildren();
                const run = await loadSubApp(defaultChoice);
                run?.(mountElement);
            })();
        }
    }, 1000);

    mountElement.append(container);
}

