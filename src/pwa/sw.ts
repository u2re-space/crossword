/// <reference lib="webworker" />
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ExpirationPlugin } from 'workbox-expiration'
import { commitRecognize } from './routers/commit-recognize';
import { commitAnalyze } from './routers/commit-analyze';
import {
    parseFormDataFromRequest,
    buildShareData,
    cacheShareData,
    getAIProcessingConfig,
    buildAIFormData,
    createSyntheticEvent,
    logShareDataSummary,
    hasProcessableContent,
    type ShareData
} from './lib/ShareTargetUtils';

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
// SHARE TARGET PROCESSING
// ============================================================================

/**
 * Process share data with AI (recognize or analyze mode)
 */
const processShareWithAI = async (
    shareData: ShareData,
    config: { mode: 'recognize' | 'analyze'; customInstruction: string }
): Promise<{ success: boolean; results?: any[] }> => {
    const aiFormData = buildAIFormData(shareData, config.customInstruction);
    const syntheticEvent = createSyntheticEvent(aiFormData);

    console.log('[ShareTarget] Processing with', config.mode === 'analyze' ? 'commitAnalyze' : 'commitRecognize');

    try {
        const processor = config.mode === 'analyze' ? commitAnalyze : commitRecognize;
        const results = await processor(syntheticEvent);

        console.log('[ShareTarget] Processing results:', results);

        const success = Array.isArray(results) && results.length > 0;
        return { success, results: results as any[] };
    } catch (error: any) {
        console.error('[ShareTarget] Processing error:', error);
        throw error;
    }
};

/**
 * Handle AI processing result and show appropriate toast
 */
const handleAIResult = (
    mode: 'recognize' | 'analyze',
    result: { success: boolean; results?: any[] }
): boolean => {
    if (result.success) {
        const message = mode === 'analyze'
            ? 'Content analyzed and processed'
            : 'Content recognized and copied';
        sendToast(message, 'success');
        return true;
    }

    sendToast(mode === 'analyze' ? 'Analysis completed' : 'Recognition completed', 'info');
    return false;
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

        if (!formData) {
            console.warn('[ShareTarget] No valid data received:', error);
            return new Response(null, { status: 302, headers: { Location: '/' } });
        }

        // Step 2: Build share data from form
        const shareData = await buildShareData(formData);
        logShareDataSummary(shareData);

        // Step 3: Cache for client retrieval
        await cacheShareData(shareData);

        // Step 4: Broadcast to clients
        notifyShareReceived?.({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url,
            timestamp: shareData.timestamp,
            fileCount: shareData.files.length
        });

        // Step 5: AI Processing (if configured)
        let aiProcessed = false;
        const aiConfig = await getAIProcessingConfig();

        if (aiConfig.enabled && hasProcessableContent(shareData)) {
            console.log('[ShareTarget] AI processing enabled, mode:', aiConfig.mode);

            try {
                const result = await processShareWithAI(shareData, {
                    mode: aiConfig.mode,
                    customInstruction: aiConfig.customInstruction
                });
                aiProcessed = handleAIResult(aiConfig.mode, result);
            } catch (aiError: any) {
                const errorMsg = aiError?.message || 'Unknown error';
                sendToast(`${aiConfig.mode === 'analyze' ? 'Analysis' : 'Recognition'} failed: ${errorMsg}`, 'error');
            }
        }

        // Step 6: Show fallback notification if AI didn't process
        if (!aiProcessed) {
            const message = aiConfig.enabled
                ? 'Content received'
                : 'Content received (configure AI for auto-processing)';
            sendToast(message, 'info');
        }

        // Step 7: Redirect to app
        return new Response(null, {
            status: 302,
            headers: { Location: '/?shared=1' }
        });
    } catch (err: any) {
        console.error('[ShareTarget] Handler error:', err);
        sendToast('Share handling failed', 'error');
        return new Response(null, { status: 302, headers: { Location: '/' } });
    }
}, "POST")

//
setDefaultHandler(new CacheFirst({
    cacheName: 'default-cache',
    fetchOptions: {
        credentials: 'include',
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
    ({ request }) => request?.destination === 'script' || request?.destination === 'style',
    new StaleWhileRevalidate({
        cacheName: 'assets-cache',
        fetchOptions: {
            credentials: 'include',
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
    ({ request }) => request?.destination === 'image',
    new CacheFirst({
        cacheName: 'image-cache',
        fetchOptions: {
            credentials: 'include',
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

// fallback to app-shell for document request
setCatchHandler(({ event }: any): Promise<Response> => {
    switch (event?.request?.destination) {
        case 'document':
            return caches.match("/").then((r: any) => {
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
self.addEventListener?.('install', (e: any) => { e?.waitUntil?.(self?.skipWaiting?.()); });
self.addEventListener?.('activate', (e: any) => {
    e?.waitUntil?.(
        Promise.all([
            (self as any).clients?.claim?.(),
            // Enable Navigation Preload if supported
            (self as any).registration?.navigationPreload?.enable?.() ?? Promise.resolve()
        ]) ?? Promise.resolve()
    );
});

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
            const cached = await caches.match('/');
            return cached || Response.error();
        }
    }
);
