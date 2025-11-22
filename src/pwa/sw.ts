/// <reference lib="webworker" />
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ExpirationPlugin } from 'workbox-expiration'

//
import { makeShareTarget } from './routers/share-target';
import { makeShareTargetRecognize } from './routers/share-target-recognize';
import { makeTimeline } from './routers/make-timeline';

//
// @ts-ignore
const manifest = self.__WB_MANIFEST;
if (manifest) {
    cleanupOutdatedCaches();
    precacheAndRoute(manifest);
}

//
const routes = [
    makeShareTarget,
    makeShareTargetRecognize,
    makeTimeline
].map((makeRoute) => makeRoute());

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
