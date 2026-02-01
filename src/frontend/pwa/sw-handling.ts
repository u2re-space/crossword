// PWA clipboard and service worker communication
import { initPWAClipboard } from "./pwa-copy";
import { showToast } from "../items/Toast";
import { ensureServiceWorkerRegistered } from "./sw-url";

// ============================================================================
// CSS INJECTION
// ============================================================================

export const ensureAppCss = () => {
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
export const initServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
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
            const registration = await ensureServiceWorkerRegistered();
            if (!registration) {
                console.error('[PWA] Service worker registration failed: no valid sw.js found');
                return null;
            }

            _swRegistration = registration;
            const viteEnv = (import.meta as any)?.env;

            // In dev, aggressively activate updated SW to avoid stale Workbox routes breaking Vite module fetches.
            // This prevents "Failed to fetch dynamically imported module: /src/..." when an old SW is still controlling the page.
            try {
                if (viteEnv?.DEV && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            } catch (e) {
                console.warn('[PWA] Failed to auto-skip-waiting in dev:', e);
            }

            // Handle updates
            registration?.addEventListener?.('updatefound', () => {
                const newWorker = registration?.installing;
                if (newWorker) {
                    newWorker?.addEventListener?.('statechange', () => {
                        if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New service worker available');
                            showToast({ message: 'App update available', kind: 'info' });
                            try {
                                if (viteEnv?.DEV && registration.waiting) {
                                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                                }
                            } catch (e) {
                                console.warn('[PWA] Failed to auto-skip-waiting on updatefound:', e);
                            }
                        }
                    });
                }
            });

            // Check for updates periodically (every 30 minutes)
            setInterval(() => {
                registration?.update?.().catch?.(console.warn);
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

export const initReceivers = () => {
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
    source?: string;
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
export const processShareTargetData = async (shareData: ShareDataInput, skipIfEmpty = false): Promise<boolean> => {
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

        // Utility function to convert file to base64
        const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        // Use unified processing endpoint
        console.log("[ShareTarget] Using unified processing endpoint");

        let processingContent: any;
        let contentType: string;

        if (type === 'file' && shareData.files?.[0]) {
            const file = shareData.files[0] as File;
            console.log("[ShareTarget] Processing file:", { name: file.name, type: file.type, size: file.size });

            // Convert file to base64 for API transport
            const base64 = await fileToBase64(file);
            processingContent = base64;
            contentType = 'base64';
        } else if (content) {
            processingContent = content;
            contentType = 'text';
            console.log("[ShareTarget] Processing text content, length:", content.length);
        } else {
            throw new Error("No processable content found");
        }

        // Call unified processing endpoint
        console.log("[ShareTarget] Calling unified processing API");
        const response = await fetch('/api/processing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: processingContent,
                contentType,
                processingType: 'general-processing',
                metadata: {
                    source: 'share-target',
                    title: shareData.title || 'Shared Content',
                    timestamp: Date.now()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Processing API failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("[ShareTarget] Unified processing completed:", { success: result.success });

        if (result.success && result.data) {
            console.log("[ShareTarget] Processing result via unified messaging");

            // Send to clipboard if configured
            const clipboardChannel = new BroadcastChannel(CHANNELS.CLIPBOARD);
            clipboardChannel.postMessage({
                type: 'copy',
                data: result.data
            });
            clipboardChannel.close();

            // Send to workcenter for display (destination-aware)
            try {
                const { unifiedMessaging } = await import("@rs-com/core/UnifiedMessaging");
                await unifiedMessaging.sendMessage({
                    type: 'share-target-result',
                    source: 'share-target',
                    destination: 'basic-workcenter',
                    data: {
                        content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
                        rawData: result.data,
                        timestamp: Date.now(),
                        source: 'share-target',
                        action: 'Processing (/api/processing)',
                        metadata: result.metadata
                    },
                    metadata: { priority: 'high' }
                } as any);
            } catch (e) {
                // Fallback to legacy broadcast (best-effort)
                const workCenterChannel = new BroadcastChannel(BROADCAST_CHANNELS.WORK_CENTER);
                workCenterChannel.postMessage({
                    type: 'share-target-result',
                    data: {
                        content: result.data,
                        rawData: result.data,
                        timestamp: Date.now(),
                        source: 'share-target',
                        action: 'Processing (/api/processing)',
                        metadata: result.metadata
                    }
                });
                workCenterChannel.close();
            }

            return true;
        } else {
            const errorMsg = result?.error || "AI processing returned no data";
            console.warn("[ShareTarget] AI processing failed:", errorMsg);

            // Broadcast error to clipboard handlers
            const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
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
        const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
        shareChannel.postMessage({
            type: 'ai-result',
            data: { success: false, error: error?.message || String(error) }
        });
        shareChannel.close();

        showToast({ message: `Processing failed: ${error?.message || 'Unknown error'}`, kind: "error" });
        return false;
    }
};

import { BROADCAST_CHANNELS } from '@rs-com/config/Names';

// BroadcastChannel names (using centralized naming system)
export const CHANNELS = {
    SHARE_TARGET: BROADCAST_CHANNELS.SHARE_TARGET,
    TOAST: BROADCAST_CHANNELS.TOAST,
    CLIPBOARD: BROADCAST_CHANNELS.CLIPBOARD,
    BASIC_APP: BROADCAST_CHANNELS.BASIC_APP,
    MAIN_APP: BROADCAST_CHANNELS.MAIN_APP,
    FILE_EXPLORER: BROADCAST_CHANNELS.FILE_EXPLORER,
    PRINT_VIEWER: BROADCAST_CHANNELS.PRINT_VIEWER
} as const;

// ============================================================================
// SHARE TARGET CACHE CONSUMPTION (FILES)
// ============================================================================

const SHARE_CACHE_NAME = 'share-target-data';
const SHARE_CACHE_KEY = '/share-target-data';
const SHARE_FILES_MANIFEST_KEY = '/share-target-files';

type CachedShareFileMeta = {
    key: string;
    name: string;
    type: string;
    size: number;
    lastModified?: number;
};

export type CachedShareTargetPayload = {
    meta: any;
    files: File[];
    fileMeta: CachedShareFileMeta[];
};

const SHARE_FILE_PREFIX = '/share-target-file/';

export const storeShareTargetPayloadToCache = async (payload: { files: File[]; meta?: any }): Promise<boolean> => {
    if (typeof window === "undefined" || !('caches' in window)) return false;
    const files = Array.isArray(payload.files) ? payload.files : [];
    const meta = payload.meta ?? {};

    try {
        const cache = await caches.open(SHARE_CACHE_NAME);
        const timestamp = Number(meta?.timestamp) || Date.now();

        await cache.put(
            SHARE_CACHE_KEY,
            new Response(JSON.stringify({
                title: meta?.title,
                text: meta?.text,
                url: meta?.url,
                timestamp,
                fileCount: files.length,
                imageCount: files.filter(f => (f?.type || '').toLowerCase().startsWith('image/')).length,
            }), { headers: { 'Content-Type': 'application/json' } })
        );

        const fileManifest: CachedShareFileMeta[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const key = `${SHARE_FILE_PREFIX}${timestamp}-${i}`;

            const headers = new Headers();
            headers.set('Content-Type', file.type || 'application/octet-stream');
            headers.set('X-File-Name', encodeURIComponent(file.name || `file-${i}`));
            headers.set('X-File-Size', String(file.size || 0));
            headers.set('X-File-LastModified', String((file as any).lastModified ?? 0));

            await cache.put(key, new Response(file, { headers }));
            fileManifest.push({
                key,
                name: file.name || `file-${i}`,
                type: file.type || 'application/octet-stream',
                size: file.size || 0,
                lastModified: (file as any).lastModified ?? undefined
            });
        }

        await cache.put(
            SHARE_FILES_MANIFEST_KEY,
            new Response(JSON.stringify({ files: fileManifest, timestamp }), {
                headers: { 'Content-Type': 'application/json' }
            })
        );

        return true;
    } catch (e) {
        console.warn('[ShareTarget] Failed to store payload to cache:', e);
        return false;
    }
};

/**
 * Read and (optionally) clear share-target cached payload, including real files.
 * This is used by Basic edition to attach incoming files to WorkCenter or open markdown.
 */
export const consumeCachedShareTargetPayload = async (opts: { clear?: boolean } = {}): Promise<CachedShareTargetPayload | null> => {
    const clear = opts.clear !== false;
    if (typeof window === "undefined" || !('caches' in window)) return null;

    try {
        const cache = await caches.open(SHARE_CACHE_NAME);
        const metaResp = await cache?.match?.(SHARE_CACHE_KEY);
        const manifestResp = await cache?.match?.(SHARE_FILES_MANIFEST_KEY);

        if (!metaResp && !manifestResp) return null;

        const meta = metaResp ? await metaResp.json().catch(() => null) : null;
        const manifest = manifestResp ? await manifestResp.json().catch(() => null) : null;
        const fileMeta: CachedShareFileMeta[] = Array.isArray(manifest?.files) ? manifest.files : [];

        const files: File[] = [];
        for (const fm of fileMeta) {
            if (!fm?.key) continue;
            const r = await cache?.match?.(fm.key);
            if (!r) continue;
            const blob = await r.blob();
            const file = new File([blob], fm.name || 'shared-file', {
                type: fm.type || blob.type || 'application/octet-stream',
                lastModified: Number(fm.lastModified) || Date.now()
            });
            files.push(file);
        }

        if (clear) {
            await cache.delete(SHARE_CACHE_KEY).catch(() => { });
            await cache.delete(SHARE_FILES_MANIFEST_KEY).catch(() => { });
            for (const fm of fileMeta) {
                if (fm?.key) await cache.delete(fm.key).catch(() => { });
            }
        }

        return { meta, files, fileMeta };
    } catch (e) {
        console.warn('[ShareTarget] Failed to consume cached share payload:', e);
        return null;
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
        const { getRuntimeSettings } = await import("@rs-com/config/RuntimeSettings");
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
            const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
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
export const handleShareTarget = () => {
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
                .then(cache => cache?.match?.("/share-target-data"))
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
        const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
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
export const setupLaunchQueueConsumer = async () => {
    if (!('launchQueue' in window)) {
        console.log('[LaunchQueue] launchQueue API not available');
        return;
    }

    try {
        // Set up the consumer for launch queue
        window.launchQueue!.setConsumer((launchParams: LaunchParams) => {
            console.log('[LaunchQueue] Launch params received:', launchParams);
            const $files = [...launchParams.files];

            // Handle files from launch queue
            if (!$files || $files.length === 0) {
                console.log('[LaunchQueue] No files in launch params - this may indicate:');
                console.log('  - File opener was used but no files were selected');
                console.log('  - Launch queue consumer called with empty payload');
                console.log('  - Permission issues preventing file access');
                console.log('  - Browser compatibility issues');
                return;
            }

            //
            console.log(`[LaunchQueue] Processing ${$files.length} file handle(s)`);

            // Convert FileSystemHandle objects to actual File objects
            const files: File[] = [];
            const failedHandles: any[] = [];
            let hasMarkdownFile = false;

            //
            (async () => {
                for (const fileHandle of $files) {
                    try {
                        console.log('[LaunchQueue] Processing file handle:', {
                            name: fileHandle.name || 'unknown',
                            type: fileHandle.constructor.name,
                            hasGetFile: typeof fileHandle.getFile === 'function',
                            isFile: fileHandle instanceof File
                        });

                        // For file handles, get the actual file
                        if (fileHandle.getFile) {
                            try {
                                // Check if we have permission to access the file
                                if ('queryPermission' in fileHandle) {
                                    const permission = await (fileHandle as any).queryPermission();
                                    console.log('[LaunchQueue] File handle permission:', permission);
                                    if (permission !== 'granted') {
                                        console.warn('[LaunchQueue] No permission to access file:', fileHandle.name);
                                        failedHandles.push(fileHandle);
                                        continue;
                                    }
                                }

                                const file = await fileHandle.getFile();
                                console.log('[LaunchQueue] Got file from handle:', file.name, file.type, file.size);
                                files.push(file);
                                // Check if this is a markdown file
                                if (file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md')) {
                                    hasMarkdownFile = true;
                                }
                            } catch (permError) {
                                console.warn('[LaunchQueue] Permission or access error for file handle:', permError, fileHandle);
                                failedHandles.push(fileHandle);
                            }
                        } else if (fileHandle instanceof File) {
                            // Already a File object
                            console.log('[LaunchQueue] File handle is already a File object:', fileHandle.name, fileHandle.type);
                            files.push(fileHandle);
                            // Check if this is a markdown file
                            if (fileHandle.type === 'text/markdown' || fileHandle.name.toLowerCase().endsWith('.md')) {
                                hasMarkdownFile = true;
                            }
                        } else {
                            console.warn('[LaunchQueue] Unknown file handle type:', fileHandle.constructor.name);
                            failedHandles.push(fileHandle);
                        }
                    } catch (error) {
                        console.warn('[LaunchQueue] Failed to get file from handle:', error, fileHandle);
                        failedHandles.push(fileHandle);
                    }
                }

                console.log(`[LaunchQueue] Successfully processed ${files.length} files, ${failedHandles.length} failed`);

                // Check if we have any successfully processed files
                if (files.length === 0) {
                    if (failedHandles.length > 0) {
                        console.error('[LaunchQueue] All file handles failed to process');
                        showToast({
                            message: `Failed to process ${failedHandles.length} launched file(s)`,
                            kind: 'error'
                        });
                    } else {
                        console.log('[LaunchQueue] No files to process after filtering');
                    }
                    return;
                }

                if (files.length > 0) {
                    // Create share data object compatible with existing processing
                    const shareData = {
                        files,
                        fileCount: files.length,
                        timestamp: Date.now(),
                        // Determine if there are images for AI processing
                        imageCount: files?.filter?.(f => f.type.startsWith('image/')).length,
                        // Check for markdown files
                        markdownCount: files?.filter?.(f => f.type === 'text/markdown' || f.name.toLowerCase().endsWith('.md')).length,
                        // Mark as launch queue origin for debugging
                        source: 'launch-queue'
                    };

                    console.log('[LaunchQueue] Created share data:', {
                        fileCount: shareData.fileCount,
                        imageCount: shareData.imageCount,
                        fileTypes: files?.map?.(f => ({ name: f.name, type: f.type, size: f.size })),
                        source: shareData.source
                    });

                    // Handle markdown files specially - open them directly in viewer
                    if (hasMarkdownFile && files.length === 1) {
                        const markdownFile = files[0];
                        try {
                            const content = await markdownFile.text();
                            console.log('[LaunchQueue] Opening markdown file directly:', markdownFile.name);

                            // Navigate to the app with markdown content
                            // We'll use a special URL parameter to indicate this is a direct markdown view
                            const url = new URL(window.location.href);
                            // Ensure Basic is used for direct markdown opening (avoid boot menu / other routes)
                            url.pathname = '/basic';
                            url.searchParams.set('markdown-content', content);
                            url.searchParams.set('markdown-filename', markdownFile.name);
                            url.hash = ''; // Clear any hash to ensure we load the main app

                            // Navigate to the main app with markdown parameters
                            window.location.href = url.toString();
                            return;

                        } catch (error) {
                            console.warn('[LaunchQueue] Failed to read markdown file:', error);
                            showToast({
                                message: `Failed to open markdown file: ${markdownFile.name}`,
                                kind: 'error'
                            });
                            return;
                        }
                    }

                    // Show immediate feedback that files were received
                    showToast({
                        message: `Received ${files.length} file(s)`,
                        kind: 'info'
                    });

                    // For file opener: prefer attachment preview in Basic (WorkCenter) over auto AI processing.
                    const stored = await storeShareTargetPayloadToCache({
                        files,
                        meta: { timestamp: Date.now(), source: 'launch-queue' }
                    });
                    if (stored) {
                        const url = new URL(window.location.href);
                        url.pathname = '/share-target';
                        url.searchParams.set('shared', '1');
                        url.hash = '';
                        window.location.href = url.toString();
                        return;
                    }

                    // Fallback: keep old behavior if caching fails.
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

                // Handle any target URL if present (for custom protocol launches)
                if (launchParams.targetURL) {
                    console.log('[LaunchQueue] Target URL:', launchParams.targetURL);
                    // Could handle URL-based launches here if needed
                }
            })();
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
export const checkPendingShareData = async () => {
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