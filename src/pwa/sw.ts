/// <reference lib="webworker" />
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ExpirationPlugin } from 'workbox-expiration'
import {
    parseFormDataFromRequest,
    buildShareData,
    cacheShareData,
    getAIProcessingConfig,
    logShareDataSummary,
    hasProcessableContent,
    processShareTargetWithExecutionCore,
    type ShareData
} from './lib/ShareTargetUtils';

// (Share target AI processing uses executionCore; no direct image conversion needed here.)

//
// @ts-ignore
const manifest = self.__WB_MANIFEST;
if (manifest) {
    cleanupOutdatedCaches();
    precacheAndRoute(manifest);
}

// Broadcast channel names (matching frontend/shared modules)
const CHANNELS = {
    SHARE_TARGET: 'rs-share-target',
    TOAST: 'rs-toast',
    CLIPBOARD: 'rs-clipboard'
} as const;

// Clipboard queue storage for persistent delivery using IDB
interface ClipboardOperation {
    id: string;
    data: unknown;
    options?: any;
    timestamp: number;
    type: 'ai-result' | 'direct-copy';
}

// IDB utilities for clipboard operations
const CLIPBOARD_DB_NAME = 'rs-clipboard-queue';
const CLIPBOARD_STORE_NAME = 'operations';

const openClipboardDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CLIPBOARD_DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(CLIPBOARD_STORE_NAME)) {
                const store = db.createObjectStore(CLIPBOARD_STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

// Broadcast helpers for cross-context communication
// These send messages to the frontend via BroadcastChannel
const broadcast = (channel: string, message: unknown): void => {
    try {
        const bc = new BroadcastChannel(channel);
        bc.postMessage(message);
        bc.close();
    } catch (e) { console.warn(`[SW] Broadcast to ${channel} failed:`, e); }
};

/**
 * Send toast notification to frontend for display
 * Frontend must have initToastReceiver() active to receive
 */
const sendToast = (message: string, kind: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000): void => {
    broadcast(CHANNELS.TOAST, { type: 'show-toast', options: { message, kind, duration } });
};


/**
 * Notify frontend about received share target data
 */
const notifyShareReceived = (data: unknown): void => {
    broadcast(CHANNELS.SHARE_TARGET, { type: 'share-received', data });
};

/**
 * Notify frontend about AI processing result
 */
const notifyAIResult = (result: { success: boolean; data?: unknown; error?: string }): void => {
    broadcast(CHANNELS.SHARE_TARGET, { type: 'ai-result', data: result });
};

/**
 * Store clipboard operation for persistent delivery using IDB
 */
const storeClipboardOperation = async (operation: ClipboardOperation): Promise<void> => {
    try {
        const db = await openClipboardDB();
        const transaction = db.transaction([CLIPBOARD_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CLIPBOARD_STORE_NAME);

        // Add new operation
        await new Promise<void>((resolve, reject) => {
            const request = store.put(operation);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Keep only last 10 operations to prevent bloat
        const countRequest = store.count();
        const count = await new Promise<number>((resolve, reject) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
        });

        if (count > 10) {
            // Get oldest operations and delete them
            const index = store.index('timestamp');
            const cursorRequest = index.openCursor(null, 'next'); // Ascending order (oldest first)

            await new Promise<void>((resolve, reject) => {
                let deletedCount = 0;
                cursorRequest.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;
                    if (cursor && deletedCount < (count - 10)) {
                        cursor.delete();
                        deletedCount++;
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                cursorRequest.onerror = () => reject(cursorRequest.error);
            });
        }

        db.close();
        console.log('[SW] Stored clipboard operation:', operation.id);
    } catch (error) {
        console.warn('[SW] Failed to store clipboard operation:', error);
    }
};

/**
 * Get stored clipboard operations from IDB
 */
const getStoredClipboardOperations = async (): Promise<ClipboardOperation[]> => {
    try {
        const db = await openClipboardDB();
        const transaction = db.transaction([CLIPBOARD_STORE_NAME], 'readonly');
        const store = transaction.objectStore(CLIPBOARD_STORE_NAME);

        const operations = await new Promise<ClipboardOperation[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result || [];
                // Sort by timestamp (newest first)
                results.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });

        db.close();
        return operations;
    } catch (error) {
        console.warn('[SW] Failed to get stored clipboard operations:', error);
        return [];
    }
};

/**
 * Clear stored clipboard operations from IDB
 */
const clearStoredClipboardOperations = async (): Promise<void> => {
    try {
        const db = await openClipboardDB();
        const transaction = db.transaction([CLIPBOARD_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CLIPBOARD_STORE_NAME);

        await new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
        console.log('[SW] Cleared clipboard operations');
    } catch (error) {
        console.warn('[SW] Failed to clear clipboard operations:', error);
    }
};

/**
 * Remove specific clipboard operation from IDB
 */
const removeClipboardOperation = async (operationId: string): Promise<void> => {
    try {
        const db = await openClipboardDB();
        const transaction = db.transaction([CLIPBOARD_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CLIPBOARD_STORE_NAME);

        await new Promise<void>((resolve, reject) => {
            const request = store.delete(operationId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
        console.log('[SW] Removed clipboard operation:', operationId);
    } catch (error) {
        console.warn('[SW] Failed to remove clipboard operation:', error);
    }
};

/**
 * Try to parse JSON and extract recognized content
 * AI returns JSON like {"recognized_data": [...], "verbose_data": "..."}
 * We want to extract just the actual content for clipboard
 */
const tryParseJSON = (data: unknown): unknown => {
    if (typeof data !== 'string') return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

export const extractRecognizedContent = (data: unknown): unknown => {
    // If it's already a string that's not JSON, return as-is
    if (typeof data === 'string') {
        const parsed = tryParseJSON(data);
        if (parsed && typeof parsed === 'object') {
            // Extract content from recognized_data field
            const obj = parsed as Record<string, unknown>;

            // Priority: recognized_data > verbose_data > data itself
            if (obj.recognized_data != null) {
                const rd = obj.recognized_data;
                // If it's an array, join the elements
                if (Array.isArray(rd)) {
                    return rd.map(item =>
                        typeof item === 'string' ? item : JSON.stringify(item)
                    ).join('\n');
                }
                return typeof rd === 'string' ? rd : JSON.stringify(rd);
            }

            if (typeof obj.verbose_data === 'string' && obj.verbose_data.trim()) {
                return obj.verbose_data;
            }

            // No recognized_data, return original data
            return data;
        }
        // Not JSON, return as-is
        return data;
    }

    // If it's an object, try to extract recognized_data
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (obj.recognized_data != null) {
            const rd = obj.recognized_data;
            if (Array.isArray(rd)) {
                return rd.map(item =>
                    typeof item === 'string' ? item : JSON.stringify(item)
                ).join('\n');
            }
            return typeof rd === 'string' ? rd : JSON.stringify(rd);
        }
        if (typeof obj.verbose_data === 'string' && obj.verbose_data.trim()) {
            return obj.verbose_data;
        }
    }

    return data;
};

// ============================================================================
// ASSET CACHE MANAGEMENT
// ============================================================================

// Track asset versions for cache busting
const ASSET_VERSIONS = new Map<string, string>();

/**
 * Enhanced fetch handler with cache busting and version tracking
 */
async function handleAssetRequest(arg: any): Promise<Response> {
    const request: Request = arg?.request ?? arg;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle critical app assets with special caching logic
    const isCriticalAsset = pathname.endsWith('.js') ||
                           pathname.endsWith('.css') ||
                           pathname.endsWith('.svg') ||
                           pathname.endsWith('.png') ||
                           pathname === '/sw.js';

    if (isCriticalAsset) {
        try {
            // Try to fetch fresh version first
            const response = await fetch(request, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (response.ok) {
                // Check if asset has changed
                const etag = response.headers.get('etag');
                const lastModified = response.headers.get('last-modified');
                const versionKey = `${etag || ''}-${lastModified || ''}`;

                const storedVersion = ASSET_VERSIONS.get(pathname);
                if (storedVersion && storedVersion !== versionKey) {
                    console.log(`[SW] Asset updated: ${pathname}`);

                    // Notify clients about asset update
                    notifyClients('asset-updated', {
                        url: pathname,
                        oldVersion: storedVersion,
                        newVersion: versionKey
                    });
                }

                ASSET_VERSIONS.set(pathname, versionKey);

                // Cache the fresh response
                const cache = await caches.open('crossword-assets-v1');
                cache.put(request, response.clone());

                return response;
            }
        } catch (error) {
            console.warn(`[SW] Failed to fetch fresh asset: ${pathname}`, error);
        }

        // Fallback to cache
        const cache = await caches.open('crossword-assets-v1');
        const cachedResponse = await cache?.match?.(request);
        if (cachedResponse) {
            console.log(`[SW] Serving cached asset: ${pathname}`);
            return cachedResponse;
        }
    }

    // Default handling for other requests
    return fetch(request);
}

// ============================================================================
// SHARE TARGET PROCESSING
// ============================================================================

/**
 * Process share data with AI directly (bypass FormData wrapping)
 */
const processShareWithAI = async (
    shareData: ShareData,
    config: { mode: 'recognize' | 'analyze'; customInstruction: string }
): Promise<{ success: boolean; results?: any[]; error?: string }> => {
    console.log('[ShareTarget] Processing with direct GPT calls, mode:', config.mode);

    try {
        // Use execution core for unified processing.
        // Mode and instruction are resolved from settings/context; SW still passes mode for logging and errors.
        const processingResult = await processShareTargetWithExecutionCore(shareData);

        if (processingResult.success && processingResult.result) {
            // Broadcast the result for immediate clipboard copy (frontend receiver handles actual clipboard)
            notifyAIResult({
                success: true,
                data: processingResult.result.content
            });

            // Store for persistent delivery if frontend wasn't ready
            await storeClipboardOperation({
                id: `${config.mode}-${Date.now()}`,
                data: processingResult.result.content,
                type: 'ai-result',
                timestamp: Date.now()
            });

            return { success: true, results: [processingResult.result] };
        }

        const errMsg = processingResult.error || `${config.mode} failed`;
        notifyAIResult({ success: false, error: errMsg });
        return { success: false, results: [], error: errMsg };

    } catch (error: any) {
        console.error('[ShareTarget] Direct AI processing error:', error);
        throw error;
    }
};

/**
 * Match share target URLs (handles both hyphen and underscore variants)
 */
const isShareTargetUrl = (pathname: string): boolean =>
    pathname === '/share-target' || pathname === '/share_target';

/**
 * Share target handler with optional AI processing
 * Note: Share targets only work when PWA is installed and service worker is active
 */
registerRoute(({ url, request }) => isShareTargetUrl(url?.pathname) && request?.method === 'POST', async (e: any) => {
    const request = e?.request ?? e?.event?.request ?? e;

    console.log('[ShareTarget] Handler called for:', request?.url);
    console.log('[ShareTarget] Content-Type:', request?.headers?.get?.('content-type') ?? 'none');

    try {
        // Step 1: Parse request data
        const { formData, error } = await parseFormDataFromRequest(request);
        console.log('[ShareTarget] FormData:', formData);
        console.log('[ShareTarget] Error:', error);

        if (!formData) {
            console.warn('[ShareTarget] No valid data received:', error);
            return new Response(null, { status: 302, headers: { Location: '/' } });
        }

        // Step 2: Build share data from form
        const shareData = await buildShareData(formData);
        console.log('[ShareTarget] Share data:', shareData);
        logShareDataSummary(shareData);

        // Step 3: Cache for client retrieval
        await cacheShareData(shareData);
        console.log('[ShareTarget] Cache share data:', shareData);

        const aiConfig = await getAIProcessingConfig();
        console.log('[ShareTarget] AI processing config:', aiConfig);

        // Step 4: Broadcast to clients (include text content for frontend fallback)
        notifyShareReceived?.({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url,
            timestamp: shareData.timestamp,
            fileCount: shareData.files.length,
            imageCount: shareData.imageFiles.length,
            // Mark whether AI will process this
            aiEnabled: aiConfig.enabled
        });

        // Step 5: AI Processing (async, non-blocking)
        console.log('[ShareTarget] AI processing config:', aiConfig);
        console.log('[ShareTarget] Share data:', shareData);
        console.log('[ShareTarget] Has processable content:', hasProcessableContent(shareData));

        if (aiConfig.enabled && hasProcessableContent(shareData)) {
            console.log('[ShareTarget] Starting async AI processing, mode:', aiConfig.mode);

            // Set up timeout for long-running AI requests in service worker
            const aiTimeout = setTimeout(() => {
                console.warn('[ShareTarget] AI processing timeout - service worker may terminate connection');
                // Don't cancel the request, just log the warning
                // The request will continue in the background if possible
            }, 4 * 60 * 1000); // 4 minutes warning

            // Start AI processing asynchronously without blocking the response
            processShareWithAI(shareData, {
                mode: aiConfig.mode,
                customInstruction: aiConfig.customInstruction
            }).then((result) => {
                clearTimeout(aiTimeout);
                console.log('[ShareTarget] Async AI processing completed:', result);

                if (result.success && result.results?.length) {
                    // Extract the actual data from results
                    const firstResult = result.results[0];
                    const extractedData = firstResult?.data?.data || firstResult?.data || firstResult;
                    console.log('[ShareTarget] Async AI processing extracted data:', extractedData);

                    // Broadcast success to frontend
                    notifyAIResult({
                        success: true,
                        data: extractedData
                    });

                    // Show success toast
                    const message = aiConfig.mode === 'analyze'
                        ? 'Content analyzed and processed'
                        : 'Content recognized and copied';
                    sendToast(message, 'success');
                } else {
                    // Broadcast failure to frontend
                    const errorMsg = result.error || 'No results returned';
                    notifyAIResult({ success: false, error: errorMsg });
                    console.log('[ShareTarget] Async AI processing failed:', errorMsg);
                }
            }).catch((aiError: any) => {
                const errorMsg = aiError?.message || 'Unknown error';
                console.error('[ShareTarget] Async AI processing error:', aiError);

                // Broadcast error to frontend
                notifyAIResult({ success: false, error: errorMsg });

                // Show error toast
                sendToast(`${aiConfig.mode === 'analyze' ? 'Analysis' : 'Recognition'} failed: ${errorMsg}`, 'error');
            });

            // Show initial processing toast immediately
            sendToast('Processing shared content...', 'info');
        } else {
            // No AI processing configured or no processable content
            const hasApiKey = aiConfig.apiKey !== null;
            const message = hasApiKey
                ? 'Content received'
                : 'Content received (configure AI for auto-processing)';
            sendToast(message, 'info');
        }

        // Step 7: Redirect to app
        return new Response(null, {
            status: 302,
            // Prefer share-target entry path (SPA), then app decides how to handle.
            headers: { Location: '/share-target?shared=1' }
        });
    } catch (err: any) {
        console.error('[ShareTarget] Handler error:', err);
        sendToast('Share handling failed', 'error');
        return new Response(null, { status: 302, headers: { Location: '/' } });
    }
}, "POST")

//
setDefaultHandler(new StaleWhileRevalidate({
    cacheName: 'default-cache',
    fetchOptions: {
        // Never force credentials=include for cross-origin requests (breaks many CDNs with ACAO="*").
        // same-origin keeps cookies for same-origin only.
        credentials: 'same-origin',
        priority: 'auto',
        cache: 'force-cache'
    },
    plugins: [
        new ExpirationPlugin({
            maxEntries: 120,
            maxAgeSeconds: 1800
        })
    ]
}));

// Assets (JS/CSS)
registerRoute(
    ({ request }) => (
        request?.destination === 'script' ||
        request?.destination === 'style' ||
        request?.destination === 'worker' ||
        request?.url?.trim?.().toLowerCase?.()?.match?.(/(\.m?js|\.css)$/)
    ),
    new NetworkFirst({
        cacheName: 'assets-cache',
        fetchOptions: {
            credentials: 'same-origin',
            priority: 'high',
            cache: 'default'
        },
        plugins: [
            new ExpirationPlugin({
                maxEntries: 120,
                maxAgeSeconds: 1800
            })
        ]
    })
);

// Images
registerRoute(
    ({ request }) => (request?.destination === 'image' || request?.url?.trim?.().toLowerCase?.()?.match?.(/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg)$/i)),
    new StaleWhileRevalidate({
        cacheName: 'image-cache',
        fetchOptions: {
            credentials: 'same-origin',
            priority: 'auto',
            cache: 'force-cache'
        },
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Phosphor Icons Proxy (for PWA offline support)
registerRoute(
    ({ url }) => url?.pathname?.startsWith?.('/api/phosphor-icons/'),
    async ({ url, request }) => {
        try {
            // Convert proxy path to actual CDN URL
            const pathParts = url.pathname.replace('/api/phosphor-icons/', '').split('/');
            const iconStyle = pathParts[0];
            const iconFile = pathParts.slice(1).join('/');

            // Build the actual CDN URL
            const cdnUrl = `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/${iconStyle}/${iconFile}`;

            console.log('[SW] Proxying Phosphor icon:', url.pathname, '->', cdnUrl);

            // Fetch from CDN with appropriate caching
            const response = await fetch(cdnUrl, {
                ...request,
                headers: {
                    ...Object.fromEntries(request.headers.entries()),
                    'Accept': 'image/svg+xml, image/*',
                }
            });

            if (response.ok) {
                // Cache the response for offline use
                const cache = await caches.open('phosphor-icons-cache');
                cache.put(url, response.clone());

                return response;
            } else {
                console.warn('[SW] Failed to fetch Phosphor icon:', cdnUrl, response.status);
                // Try to serve from cache if available
                const cache = await caches.open('phosphor-icons-cache');
                const cachedResponse = await cache.match(url);
                if (cachedResponse) {
                    console.log('[SW] Serving cached Phosphor icon:', url.pathname);
                    return cachedResponse;
                }
                return response;
            }
        } catch (error) {
            console.error('[SW] Error proxying Phosphor icon:', error);
            // Try to serve from cache if available
            try {
                const cache = await caches.open('phosphor-icons-cache');
                const cachedResponse = await cache.match(url);
                if (cachedResponse) {
                    console.log('[SW] Serving cached Phosphor icon (fallback):', url.pathname);
                    return cachedResponse;
                }
            } catch (cacheError) {
                console.error('[SW] Cache fallback failed:', cacheError);
            }
            return new Response('Icon not available', { status: 503 });
        }
    }
);

// fallback to app-shell for document request
setCatchHandler(({ event }: any): Promise<Response> => {
    switch (event?.request?.destination) {
        case 'document':
            return caches?.match?.("/")?.then?.((r: any) => {
                return r ? Promise.resolve(r) : Promise.resolve(Response.error());
            })
        default:
            return Promise.resolve(Response.error());
    }
})

// Notifications
self.addEventListener?.('notificationclick', (event: any) => {
    event?.notification?.close?.();
    event?.waitUntil?.(
        (self as any).clients?.matchAll?.({ type: 'window', includeUncontrolled: true })?.then?.((clientList: any) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if ((self as any).clients?.openWindow) {
                return (self as any).clients?.openWindow?.('/');
            }
        })
    );
});

// @ts-ignore // lifecycle - enable navigation preload for faster loads
// ============================================================================
// SERVICE WORKER UPDATE MANAGEMENT
// ============================================================================

// Handle service worker lifecycle events
self.addEventListener?.('install', (e: any) => {
    console.log('[SW] Installing new service worker...');
    e?.waitUntil?.((self as any)?.skipWaiting?.());
});

self.addEventListener?.('activate', (e: any) => {
    console.log('[SW] Activating service worker...');
    e?.waitUntil?.(
        Promise.all([
            (self as any).clients?.claim?.(),
            // Enable Navigation Preload if supported
            (self as any).registration?.navigationPreload?.enable?.() ?? Promise.resolve(),
            // Notify clients about activation
            notifyClients('sw-activated')
        ]) ?? Promise.resolve()
    );
});

// Handle messages from clients
self.addEventListener?.('message', (e: any) => {
    const { type } = e.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            console.log('[SW] Received skip waiting command');
            (self as any).skipWaiting?.();
            break;

        case 'CHECK_FOR_UPDATES':
            console.log('[SW] Checking for updates...');
            e.waitUntil?.(checkForUpdates());
            break;

        case 'GET_CACHE_STATUS':
            e.waitUntil?.(sendCacheStatus(e.source));
            break;

        default:
            console.log('[SW] Unknown message type:', type);
    }
});

// Notify all clients about events
async function notifyClients(type: string, data?: any): Promise<void> {
    const clients = await (self as any).clients?.matchAll?.() || [];
    clients.forEach((client: any) => {
        client.postMessage({ type, data });
    });
}

// Check for service worker updates
async function checkForUpdates(): Promise<void> {
    try {
        const registration = (self as any).registration;
        if (registration) {
            await registration.update();
            console.log('[SW] Update check completed');
        }
    } catch (error) {
        console.error('[SW] Update check failed:', error);
    }
}

// Send cache status to a specific client
async function sendCacheStatus(client: any): Promise<void> {
    try {
        const cacheNames = await caches.keys();
        const cacheStatus: any = {};

        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheStatus[cacheName] = {
                name: cacheName,
                size: keys.length,
                urls: keys.map(request => request.url)
            };
        }

        client.postMessage({
            type: 'cache-status',
            data: cacheStatus
        });
    } catch (error) {
        console.error('[SW] Failed to get cache status:', error);
    }
}

// Share target GET handler (for testing/debugging)
registerRoute(
    ({ url, request }) => isShareTargetUrl(url?.pathname) && request?.method === 'GET',
    async () => {
        console.log('[ShareTarget] GET request received - redirecting to app');
        return new Response(null, {
            status: 302,
            headers: { Location: '/?shared=test' }
        });
    },
    'GET'
);

// Fallback: Manual fetch event handler for share target (in case workbox routing fails)
self.addEventListener?.('fetch', (event: any) => {
    const request = event?.request ?? event?.event?.request ?? event;
    const requestUrl = new URL(request?.url || '');
    if (isShareTargetUrl(requestUrl.pathname) && request?.method === 'POST') {
        console.log('[ShareTarget] Manual fetch handler triggered');
        event?.respondWith?.(handleShareTargetRequest(request));
    }
});

// Share target request handler function
async function handleShareTargetRequest(event: any): Promise<Response> {
    const request = event?.request ?? event?.event?.request ?? event;
    const headers = request?.headers ?? event?.event?.request?.headers ?? event?.headers ?? {};
    const contentType = headers?.get?.('content-type') ?? '';

    console.log('[ShareTarget] Manual handler called for:', request.url);
    console.log('[ShareTarget] Service worker controlling clients:', !!(self as any).clients);

    try {
        // Clone request before reading - body can only be consumed once
        const fd = await request?.formData?.().catch?.((error: any) => {
            console.error('[ShareTarget] Failed to parse FormData:', error);
            return null;
        });

        if (!fd) {
            console.warn('[ShareTarget] No FormData received');
            return new Response(null, { status: 302, headers: { Location: '/' } });
        }

        console.log('[ShareTarget] FormData received, content-type:', contentType);
        console.log('[ShareTarget] FormData keys:', Array.from(fd?.keys?.() || []));

        // Extract share data
        const shareData = {
            title: fd?.get?.('title') || '',
            text: fd?.get?.('text') || '',
            url: fd?.get?.('url') || '',
            files: fd?.getAll?.('files') || [],
            timestamp: Date.now()
        };

        console.log('[ShareTarget] Processed data:', {
            title: shareData?.title,
            text: shareData?.text?.substring(0, 50),
            url: shareData?.url,
            filesCount: shareData?.files?.length || 0
        });

        // Store in cache
        try {
            const cache = await (self as any).caches?.open?.('share-target-data')?.catch?.((error: any) => {
                console.error('[ShareTarget] Failed to open cache:', error);
                return null;
            });
            if (cache) {
                await cache?.put?.('/share-target-data', new Response(JSON.stringify(shareData), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        } catch (e) {
            console.warn('[ShareTarget] Cache store failed:', e);
        }

        // Broadcast
        (self as any).notifyShareReceived?.(shareData) ?? console.log('[ShareTarget] Broadcast function not available');

        // Show notification
        (self as any).sendToast?.('Content received', 'info') || console.log('[ShareTarget] Toast function not available');

        return new Response(null, {
            status: 302,
            headers: { Location: '/?shared=1' }
        });
    } catch (err) {
        console.warn('[ShareTarget] Manual handler error:', err);
        return new Response(null, { status: 302, headers: { Location: '/' } });
    }
}

// Handle requests for pending clipboard operations
registerRoute(
    ({ url }) => url?.pathname === '/clipboard/pending',
    async () => {
        console.log('[SW] Received request for pending clipboard operations');
        const operations = await getStoredClipboardOperations();
        return new Response(JSON.stringify({ operations }), {
            headers: { 'Content-Type': 'application/json' }
        });
    },
    'GET'
);

// Clear clipboard operations queue
registerRoute(
    ({ url }) => url?.pathname === '/clipboard/clear',
    async () => {
        console.log('[SW] Clearing clipboard operations queue');
        await clearStoredClipboardOperations();
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    },
    'POST'
);

// Remove specific clipboard operation
registerRoute(
    ({ url }) => url?.pathname.startsWith('/clipboard/remove/'),
    async ({ url }) => {
        const operationId = url?.pathname.split('/clipboard/remove/')[1];
        if (!operationId) {
            return new Response(JSON.stringify({ error: 'Missing operation ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('[SW] Removing clipboard operation:', operationId);
        await removeClipboardOperation(operationId);
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    },
    'DELETE'
);

// Enhanced asset caching for critical resources
registerRoute(
    ({ url }) => {
        const pathname = url?.pathname;
        return pathname && (
            pathname.endsWith('.js') ||
            pathname.endsWith('.css') ||
            pathname.endsWith('.svg') ||
            pathname.endsWith('.png') ||
            pathname === '/sw.js'
        );
    },
    handleAssetRequest
);

// Use preload response for navigation when available
registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ event, request }: any) => {
        try {
            // Try to use the navigation preload response if available
            const preloadResponse = await event?.preloadResponse;
            if (preloadResponse) return preloadResponse;

            // Otherwise fall back to network
            const networkResponse = await fetch(request);
            return networkResponse;
        } catch {
            // Fall back to cache
            const cached = await caches?.match?.('/');
            return cached || Response.error();
        }
    }
);
