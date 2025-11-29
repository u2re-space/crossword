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

// for PWA compatibility
registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return new Response(null, { status: 302, headers: { Location: '/' } });

    //
    let results: any = [];
    if (settings?.ai?.shareTargetMode == "recognize") {
        results = await commitRecognize?.(e)?.then?.(rs => { console.log('recognize results', rs); return rs; })?.catch?.(console.warn.bind(console));
    } else {
        results = await commitAnalyze?.(e)?.then?.(rs => { console.log('analyze results', rs); return rs; })?.catch?.(console.warn.bind(console));
    }

    // needs to make redirect to index.html and handle to copy data to clipboard
    return new Response(null, { status: 302, headers: { Location: '/' } });
}, "POST")

//
setDefaultHandler(new NetworkFirst({
    cacheName: 'default-cache',
    plugins: [
        new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60 // 1 day
        })
    ]
}));

// Assets (JS/CSS)
registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new StaleWhileRevalidate({
        cacheName: 'assets-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            })
        ]
    })
);

// Images
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 24 * 60 * 60 // 60 days
            })
        ]
    })
);

// Navigation
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        cacheName: 'html-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
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

// @ts-ignore // lifecycle
self.addEventListener('install', (e) => { e.waitUntil(self.skipWaiting()); }); // @ts-ignore
self.addEventListener('activate', (e) => { e.waitUntil((self as any).clients.claim()); });
