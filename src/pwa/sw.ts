/// <reference lib="webworker" />
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ExpirationPlugin } from 'workbox-expiration'

//
import { makeCommitAnalyze } from './routers/commit-analyze';
import { commitRecognize, makeCommitRecognize } from './routers/commit-recognize';
import { makeTimeline } from './routers/make-timeline';
import { commitAnalyze } from './routers/commit-analyze';
import { loadSettings } from '@rs-core/config/Settings';

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

// Broadcast channel for cross-context communication
const shareTargetChannel = new BroadcastChannel('rs-share-target');
const toastChannel = new BroadcastChannel('rs-toast');
const clipboardChannel = new BroadcastChannel('rs-clipboard');

// Share target handler - works independently of mode/settings
registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
    const settings = await loadSettings().catch(() => null);

    try {
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
            await (self as any).caches?.open?.('share-target-data')?.then?.((cache: Cache) =>
                cache?.put?.('/share-target-data', new Response(JSON.stringify(shareData), {
                    headers: { 'Content-Type': 'application/json' }
                }))
            );
        } catch (e) { console.warn('[ShareTarget] Cache store failed:', e); }

        // Broadcast share data to clients
        try {
            shareTargetChannel.postMessage({ type: 'share-received', data: shareData });
        } catch (e) { console.warn('[ShareTarget] Broadcast failed:', e); }

        // If AI settings available, process in background
        if (settings?.ai?.apiKey) {
            const processPromise = (async () => {
                try {
                    const mode = settings?.ai?.shareTargetMode || 'recognize';
                    let results: any[];

                    if (mode === 'analyze') {
                        results = await commitAnalyze?.(e)?.catch?.(() => []) || [];
                        console.log('[ShareTarget] Analyze results:', results);
                    } else {
                        results = await commitRecognize?.(e)?.catch?.(() => []) || [];
                        console.log('[ShareTarget] Recognize results:', results);
                    }

                    // Broadcast results for clipboard copy
                    if (results?.length) {
                        clipboardChannel.postMessage({
                            type: 'copy',
                            data: results?.[0]?.data || results,
                            options: { showFeedback: true }
                        });

                        toastChannel.postMessage({
                            type: 'show-toast',
                            options: {
                                message: 'Content recognized and copied!',
                                kind: 'success',
                                duration: 3000
                            }
                        });
                    }

                    return results;
                } catch (err) {
                    console.warn('[ShareTarget] Processing failed:', err);
                    toastChannel.postMessage({
                        type: 'show-toast',
                        options: {
                            message: 'Recognition failed',
                            kind: 'error',
                            duration: 3000
                        }
                    });
                    return [];
                }
            })();

            // Don't await - process in background
            e.waitUntil?.(processPromise);
        } else {
            // No AI settings - just store for manual handling
            toastChannel.postMessage({
                type: 'show-toast',
                options: {
                    message: 'Content received. Configure AI settings to enable recognition.',
                    kind: 'info',
                    duration: 4000
                }
            });
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
