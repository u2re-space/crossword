import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

//
import { makeShareTarget } from './routers/share-target';
import { makeShareTargetRecognize } from './routers/share-target-recognize';
import { makeTimeline } from './routers/make-timeline';

//
const routes = [
    makeShareTarget,
    makeShareTargetRecognize,
    makeTimeline
].map((makeRoute) => makeRoute());

//
setDefaultHandler(new NetworkFirst());
registerRoute(({ request }) => request.mode === 'navigate', new NetworkFirst({ cacheName: 'html-cache' }));

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

// @ts-ignore // lifecycle
self.addEventListener('install', (e) => { e.waitUntil(self.skipWaiting()); }); // @ts-ignore
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
