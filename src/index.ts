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
 * Process share target data with AI - broadcasts results to PWA clipboard handlers
 * This is called when SW didn't process (or failed), or for server-side fallback
 */
const processShareTargetData = async (shareData: ShareDataInput, skipIfEmpty = false): Promise<boolean> => {
    console.log("[ShareTarget] Processing shared data:", {
        hasText: !!shareData.text,
        hasUrl: !!shareData.url,
        fileCount: shareData.files?.length || shareData.fileCount || 0,
        imageCount: shareData.imageCount || 0,
        source: shareData.source || 'unknown',
        aiProcessed: shareData.aiProcessed
    });

    // If AI already processed in SW, just show result info
    if (shareData.aiProcessed && shareData.results?.length) {
        console.log("[ShareTarget] AI already processed in SW, showing result");
        showToast({ message: "Content processed by service worker", kind: "success" });
        return true;
    }

    const { content, type } = extractShareContent(shareData);

    console.log("[ShareTarget] Extracted content:", { content: content?.substring(0, 50), type });

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
        console.log("[ShareTarget] Starting AI processing for type:", type);
        showToast({ message: "Processing shared content...", kind: "info" });

        // Import AI functions dynamically
        const { recognizeByInstructions } = await import("@rs-core/service/AI-ops/RecognizeData");
        const { getUsableData } = await import("@rs-core/service/model/GPT-Responses");

        let inputData: string | File;

        if (type === 'file' && shareData.files?.[0]) {
            inputData = shareData.files[0] as File;
            console.log("[ShareTarget] Processing file:", { name: inputData.name, type: inputData.type, size: inputData.size });
        } else if (content) {
            inputData = content;
            console.log("[ShareTarget] Processing text content, length:", content.length);
        } else {
            throw new Error("No processable content found");
        }

        // Convert to usable format
        console.log("[ShareTarget] Converting to usable data format");
        const usableData = await getUsableData({ dataSource: inputData });

        const input = [{
            type: "message",
            role: "user",
            content: [usableData]
        }];

        console.log("[ShareTarget] Calling AI recognition");
        // Process with AI
        const result = await recognizeByInstructions(input, "", undefined, undefined, { useActiveInstruction: true });

        console.log("[ShareTarget] AI recognition completed:", { ok: result?.ok, hasData: !!result?.data, dataLength: result?.data?.length });

        if (result?.ok && result?.data) {
            // Broadcast result to PWA clipboard handlers
            console.log("[ShareTarget] Broadcasting successful AI result to clipboard handlers");
            const shareChannel = new BroadcastChannel("rs-share-target");
            shareChannel.postMessage({
                type: 'ai-result',
                data: { success: true, data: result.data }
            });
            shareChannel.close();

            return true;
        } else {
            const errorMsg = result?.error || "AI processing returned no data";
            console.warn("[ShareTarget] AI processing failed:", errorMsg);

            // Broadcast error to clipboard handlers
            const shareChannel = new BroadcastChannel("rs-share-target");
            shareChannel.postMessage({
                type: 'ai-result',
                data: { success: false, error: errorMsg }
            });
            shareChannel.close();

            showToast({ message: `Processing failed: ${errorMsg}`, kind: "warning" });
            return false;
        }
    } catch (error: any) {
        console.error("[ShareTarget] Processing error:", error);

        // Try fallback to server-side AI processing
        console.log("[ShareTarget] Attempting server-side fallback");
        const fallbackResult = await tryServerSideProcessing(shareData);
        if (fallbackResult) {
            console.log("[ShareTarget] Server-side fallback succeeded");
            return true;
        }

        console.warn("[ShareTarget] All processing methods failed");

        // Broadcast error to clipboard handlers
        const shareChannel = new BroadcastChannel("rs-share-target");
        shareChannel.postMessage({
            type: 'ai-result',
            data: { success: false, error: error?.message || String(error) }
        });
        shareChannel.close();

        showToast({ message: `Processing failed: ${error?.message || 'Unknown error'}`, kind: "error" });
        return false;
    }
};

/**
 * Fallback to server-side AI processing when client-side fails
 * Broadcasts results to PWA clipboard handlers instead of copying directly
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
            // Broadcast result to PWA clipboard handlers
            console.log("[ShareTarget] Broadcasting server-side result to clipboard handlers");
            const shareChannel = new BroadcastChannel("rs-share-target");
            shareChannel.postMessage({
                type: 'ai-result',
                data: { success: true, data: String(result.data) }
            });
            shareChannel.close();
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
        console.log("[ShareTarget] Detected shared=1 URL param, processing server-side share");

        // Extract share data from URL params (server-side handler)
        const shareFromParams: ShareDataInput = {
            title: params.get("title") || undefined,
            text: params.get("text") || undefined,
            url: params.get("url") || undefined,
            sharedUrl: params.get("sharedUrl") || undefined,
            timestamp: Date.now(),
            source: 'url-params'
        };

        console.log("[ShareTarget] Share data from URL params:", {
            title: shareFromParams.title,
            text: shareFromParams.text,
            url: shareFromParams.url,
            sharedUrl: shareFromParams.sharedUrl
        });

        // Clean up URL
        const cleanUrl = new URL(window.location.href);
        ['shared', 'action', 'title', 'text', 'url', 'sharedUrl'].forEach(p => cleanUrl.searchParams.delete(p));
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.hash);

        // Check if we have content from params
        const { content, type } = extractShareContent(shareFromParams);
        console.log("[ShareTarget] Extracted from URL params:", { content: content?.substring(0, 50), type });

        if (content || type === 'file') {
            console.log("[ShareTarget] Processing from URL params");
            processShareTargetData(shareFromParams, true);
            return; // Don't also check cache
        } else {
            console.log("[ShareTarget] No processable content in URL params, checking cache");
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
    // Note: AI results are handled by PWA clipboard receivers, this handles share notifications
    if (typeof BroadcastChannel !== "undefined") {
        const shareChannel = new BroadcastChannel("rs-share-target");
        shareChannel.addEventListener("message", async (event) => {
            const msgType = event.data?.type;
            const msgData = event.data?.data;

            console.log("[ShareTarget] Broadcast received:", { type: msgType, hasData: !!msgData });

            if (msgType === "share-received" && msgData) {
                console.log("[ShareTarget] Share notification received:", {
                    hasText: !!msgData.text,
                    hasUrl: !!msgData.url,
                    fileCount: msgData.fileCount || 0,
                    aiEnabled: msgData.aiEnabled,
                    source: msgData.source
                });

                // Check if this is just a notification (files processed in SW)
                // vs actual data we need to process
                if (msgData.fileCount > 0 && !msgData.files?.length) {
                    // This is a notification - files were handled in SW
                    showToast({ message: `Processing ${msgData.fileCount} file(s)...`, kind: "info" });
                } else if (msgData.text || msgData.url || msgData.title) {
                    // We have text content to potentially process
                    console.log("[ShareTarget] Processing broadcasted share data");
                    await processShareTargetData(msgData, true);
                }
            } else if (msgType === "ai-result") {
                console.log("[ShareTarget] AI result broadcast received (handled by PWA clipboard)");
            }
        });

        console.log("[ShareTarget] Broadcast channel listener set up");
    } else {
        console.warn("[ShareTarget] BroadcastChannel not available");
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
                        imageCount: files?.filter?.(f => f.type.startsWith('image/')).length,
                        // Mark as launch queue origin for debugging
                        source: 'launch-queue'
                    };

                    console.log('[LaunchQueue] Created share data:', {
                        fileCount: shareData.fileCount,
                        imageCount: shareData.imageCount,
                        fileTypes: files?.map?.(f => ({ name: f.name, type: f.type, size: f.size })),
                        source: shareData.source
                    });

                    // Show immediate feedback that files were received
                    showToast({
                        message: `Processing ${files.length} launched file(s)...`,
                        kind: 'info'
                    });

                    // Process through the existing share target flow
                    try {
                        const success = await processShareTargetData(shareData, false);
                        if (!success) {
                            console.warn('[LaunchQueue] Share target processing returned false');
                            showToast({
                                message: `Received ${files.length} file(s) but processing failed`,
                                kind: 'warning'
                            });
                        } else {
                            console.log('[LaunchQueue] Share target processing completed successfully');
                        }
                    } catch (error) {
                        console.error('[LaunchQueue] Failed to process files:', error);
                        showToast({
                            message: `Failed to process ${files.length} launched file(s)`,
                            kind: 'error'
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



// Import the frontend loader from choice.ts
import { frontend } from "./frontend/choice";

// ============================================================================
// BOOTSTRAP
// ============================================================================

export default async function bootstrap(mountElement: HTMLElement) {
    console.log('[PWA] Starting CrossWord PWA bootstrap');

    try {
        // Ensure CSS is loaded (only for PWA, not extensions)
        console.log('[PWA] Ensuring CSS is loaded...');
    ensureAppCss();
        console.log('[PWA] CSS ready');

        // Set up launch queue consumer for PWA file launches (must be done early)
        console.log('[PWA] Setting up launch queue consumer...');
        setupLaunchQueueConsumer();
        console.log('[PWA] Launch queue consumer ready');

        // Check for pending share data from server-side handler
        console.log('[PWA] Checking for pending share data...');
        try {
            await checkPendingShareData();
        } catch (error) {
            console.warn('[PWA] Pending share data check failed:', error);
        }
        console.log('[PWA] Pending share data check complete');

        // Initialize service worker EARLY (don't await - runs in parallel)
        console.log('[PWA] Initializing service worker...');
        try {
            await initServiceWorker();
        } catch (error) {
            console.warn('[PWA] Service worker initialization failed:', error);
        }
        console.log('[PWA] Service worker ready');

        // Initialize broadcast receivers for service worker communication
        console.log('[PWA] Initializing broadcast receivers...');
        initReceivers();
        console.log('[PWA] Broadcast receivers ready');

        // Handle share target data if coming from PWA share
        console.log('[PWA] Setting up share target handling...');
        handleShareTarget();
        console.log('[PWA] Share target handling ready');

        // Delegate to frontend loader for UI mounting
        console.log('[PWA] Delegating to frontend loader...');
        await frontend(mountElement);
        console.log('[PWA] Frontend loaded successfully');

    } catch (error) {
        console.error('[PWA] Bootstrap failed:', error);

        // Last resort: show error message
        mountElement.innerHTML = `
            <div style="padding: 20px; text-align: center; font-family: monospace;">
                <h2>🚫 PWA Bootstrap Failed</h2>
                <p>Check console for details</p>
                <details>
                    <summary>Error Details</summary>
                    <pre>${error}</pre>
                </details>
            </div>
        `;
    }
}

