/// <reference lib="webworker" />
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ExpirationPlugin } from 'workbox-expiration'

//
import { makeCommitAnalyze } from './routers/commit-analyze';
import { commitRecognize, makeCommitRecognize } from './routers/commit-recognize';
import { makeTimeline } from './routers/make-timeline';
import { commitAnalyze } from './routers/commit-analyze';
import { loadSettings } from '@rs-core/config/Settings';
import { setRuntimeSettingsProvider } from '@rs-core/config/RuntimeSettings';

// CRITICAL: Set runtime settings provider to use loadSettings
// Without this, AI recognition gets DEFAULT_SETTINGS (no API key)
setRuntimeSettingsProvider(loadSettings);

//
// @ts-ignore
const manifest = self.__WB_MANIFEST;
if (manifest) {
    cleanupOutdatedCaches();
    precacheAndRoute(manifest);
}

//
const routes = [
    makeCommitAnalyze,
    makeCommitRecognize,
    makeTimeline
].map((makeRoute) => makeRoute());

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
 * Request clipboard copy operation in frontend
 * Frontend must have initClipboardReceiver() active to receive
 * @param silentOnError - if true, don't show error toast on failure (for background operations)
 */
const sendCopyRequest = (data: unknown, showFeedback = true, silentOnError = false): void => {
    broadcast(CHANNELS.CLIPBOARD, { type: 'copy', data, options: { showFeedback, silentOnError } });
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

const extractRecognizedContent = (data: unknown): unknown => {
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

// Share target handler - works independently of mode/settings
registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
    const settings = await loadSettings().catch(() => null);

    try {
        // Clone request before reading - body can only be consumed once
        const clonedRequest = e.request.clone();
        const fd = await e.request.formData().catch(() => null);
        if (!fd) {
            return new Response(null, { status: 302, headers: { Location: '/' } });
        }

        const shareData = {
            title: fd.get('title') || '',
            text: fd.get('text') || '',
            url: fd.get('url') || '',
            files: fd.getAll('files') || [],
            timestamp: Date.now()
        };

        // Store share data for client retrieval
        try {
            const cache = await (self as any).caches?.open?.('share-target-data');
            await cache?.put?.('/share-target-data', new Response(JSON.stringify(shareData), {
                headers: { 'Content-Type': 'application/json' }
            }));
        } catch (e) { console.warn('[ShareTarget] Cache store failed:', e); }

        // Broadcast share data to clients
        notifyShareReceived(shareData);

        // If AI settings available, process in background
        if (settings?.ai?.apiKey) {
            console.log('[ShareTarget] API key found, starting AI processing...');
            sendToast('Processing with AI...', 'info', 2000);

            const processPromise = (async () => {
                try {
                    const mode = settings?.ai?.shareTargetMode || 'recognize';
                    let results: any[];

                    // Create a synthetic event with the cloned request for AI processing
                    const syntheticEvent = { ...e, request: clonedRequest };

                    console.log(`[ShareTarget] Mode: ${mode}, processing...`);

                    if (mode === 'analyze') {
                        results = await commitAnalyze?.(syntheticEvent)?.catch?.((err) => {
                            console.error('[ShareTarget] commitAnalyze error:', err);
                            return [];
                        }) || [];
                        console.log('[ShareTarget] Analyze results:', results);
                    } else {
                        results = await commitRecognize?.(syntheticEvent)?.catch?.((err) => {
                            console.error('[ShareTarget] commitRecognize error:', err);
                            return [];
                        }) || [];
                        console.log('[ShareTarget] Recognize results:', results);
                    }

                    // Broadcast results for clipboard copy
                    if (results?.length) {
                        const rawData = results?.[0]?.data || results;
                        // Extract actual content from AI JSON response
                        const extractedContent = extractRecognizedContent(rawData);
                        console.log('[ShareTarget] Sending to clipboard:', typeof extractedContent, (extractedContent as any)?.length || 'N/A');
                        // Use silentOnError=true because clipboard may fail without user gesture/focus
                        sendCopyRequest(extractedContent, true, true);
                        sendToast('Content recognized - tap to copy', 'success');
                    } else {
                        console.warn('[ShareTarget] No results from AI processing');
                        sendToast('Recognition completed but no data extracted', 'warning');
                    }

                    return results;
                } catch (err) {
                    console.error('[ShareTarget] Processing failed:', err);
                    sendToast(`Recognition failed: ${err}`, 'error');
                    return [];
                }
            })();

            // Don't await - process in background
            e.waitUntil?.(processPromise);
        } else {
            // No AI settings - just store for manual handling
            console.log('[ShareTarget] No API key configured');
            sendToast('Content received. Configure AI settings to enable recognition.', 'info', 4000);
        }

        // Redirect to index with action parameter
        const action = settings?.ai?.shareTargetMode || 'recognize';
        return new Response(null, {
            status: 302,
            headers: { Location: `/?action=${action}&shared=1` }
        });
    } catch (err) {
        console.warn('[ShareTarget] Handler error:', err);
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
    ({ request }) => request.destination === 'script' || request.destination === 'style',
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
    ({ request }) => request.destination === 'image',
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
self.addEventListener('notificationclick', (event: any) => {
    event.notification.close();
    event.waitUntil(
        (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if ((self as any).clients.openWindow) {
                return (self as any).clients.openWindow('/');
            }
        })
    );
});

// @ts-ignore // lifecycle - enable navigation preload for faster loads
self.addEventListener('install', (e) => { e.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            (self as any).clients.claim(),
            // Enable Navigation Preload if supported
            (self as any).registration?.navigationPreload?.enable?.()
        ])
    );
});

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
