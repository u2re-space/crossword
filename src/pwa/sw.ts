/// <reference lib="webworker" />
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { ExpirationPlugin } from 'workbox-expiration'
import { getRuntimeSettings } from '@rs-core/config/RuntimeSettings';
import { commitRecognize } from './routers/commit-recognize';
import { commitAnalyze } from './routers/commit-analyze';

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

// Share target handler with optional AI processing
// Note: Share targets only work when PWA is installed and service worker is active
registerRoute(({ url }) => url?.pathname == "/share-target", async (e: any) => {
    const request = e?.request ?? e?.event?.request ?? e;

    console.log('[ShareTarget] Handler called for:', request?.url);
    console.log('[ShareTarget] Service worker controlling clients:', !!(self as any).clients);

    try {
        let fd = await request?.formData?.().catch?.((error: any) => {
            console.error('[ShareTarget] Failed to parse FormData:', error);
            return null;
        });

        // Fallback: try to parse as JSON if FormData fails
        if (!fd) {
            try {
                const text = await request?.text?.().catch?.((error: any) => {
                    console.error('[ShareTarget] Failed to parse text:', error);
                    return null;
                });
                if (text?.trim?.()) {
                    const jsonData = tryParseJSON(text) as Record<string, unknown>;
                    console.log('[ShareTarget] Received JSON data:', jsonData);
                    // Create a mock FormData from JSON
                    fd = new FormData() as FormData;
                    if (jsonData?.title) fd?.append?.('title', jsonData?.title as unknown as string);
                    if (jsonData?.text) fd?.append?.('text', jsonData?.text as unknown as string);
                    if (jsonData?.url) fd?.append?.('url', jsonData?.url as unknown as string);
                    // Note: JSON can't contain actual File objects
                }
            } catch (e: any) {
                console.warn('[ShareTarget] Could not parse request as FormData or JSON:', e);
                return new Response(null, { status: 302, headers: { Location: '/' } });
            }
        }

        console.log('[ShareTarget] FormData received, content-type:', request?.headers?.get?.('content-type') ?? '');

        // Debug: Log all form data keys and values
        console.log('[ShareTarget] FormData keys:', Array.from(fd?.keys?.() || []));
        const allEntries = Array.from(fd?.entries?.() || []) as [string, FormDataEntryValue][];
        for (const [key, value] of allEntries) {
            if (value instanceof File) {
                console.log(`[ShareTarget] ${key}: File(${value?.name}, ${value?.size} bytes, ${value?.type})`);
            } else {
                console.log(`[ShareTarget] ${key}: ${value}`);
            }
        }

        // Collect all files from any field name (some browsers might use different names)
        const allFiles: File[] = [];
        const namedFiles = fd?.getAll?.('files') as File[] || [];
        for (const [, value] of allEntries) {
            if (value instanceof File && !(namedFiles || []).includes(value)) {
                allFiles.push(value);
            }
        }

        // Combine named files with any additional files
        const combinedFiles = [...(namedFiles || []), ...(allFiles || [])];

        // Extract text from text files if no text field provided
        let extractedText = fd?.get?.('text') || '';
        if (!extractedText && allFiles?.length > 0) {
            // Try to extract text from text files
            for (const file of allFiles || []) {
                if (file?.type?.startsWith?.('text/') || file?.type === 'application/json') {
                    try {
                        const textContent = await file?.text?.().catch?.((error: any) => {
                            console.error('[ShareTarget] Failed to read text file:', file?.name, error);
                            return '';
                        });
                        if (textContent?.trim?.()) {
                            extractedText = textContent?.trim?.() || '';
                            break; // Use first text file found
                        }
                    } catch (e: any) {
                        console.warn('[ShareTarget] Failed to read text file:', file?.name, e);
                    }
                }
            }
        }

        const shareData = {
            title: fd?.get?.('title') || '',
            text: extractedText,
            url: fd?.get?.('url') || '',
            files: combinedFiles || [],
            timestamp: Date.now()
        };

        console.log('[ShareTarget] Processed data:', {
            title: shareData?.title,
            text: shareData?.text?.substring?.(0, 50) + (shareData?.text?.length > 50 ? '...' : ''),
            url: shareData?.url,
            filesCount: shareData?.files?.length || 0,
            filesDetails: shareData?.files?.map?.((f: File) => ({ name: f?.name, size: f?.size, type: f?.type })) || []
        });

        // Store share data for client retrieval (simple key-value storage)
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
        } catch (e: any) {
            console.warn('[ShareTarget] Cache store failed:', e);
        }

        // Broadcast share data to clients (like CRX extension)
        notifyShareReceived?.(shareData) ?? console.log('[ShareTarget] Broadcast function not available');

        // Check if we should process with AI (using runtime settings)
        let aiProcessed = false;
        let hasApiKey = false;
        try {
            const settings = await getRuntimeSettings()?.catch?.((error: any) => {
                console.error('[ShareTarget] Failed to get runtime settings:', error);
                return null;
            });
            hasApiKey = !!settings?.ai?.apiKey;
            const mode = settings?.ai?.shareTargetMode || 'recognize';

            // Check if we have content to process
            const hasTextContent = shareData?.text?.trim?.();
            const hasUrlContent = shareData?.url?.trim?.();
            const hasFileContent = shareData?.files?.some?.((f: File) => f?.size > 0);

            if (hasApiKey && (hasTextContent || hasUrlContent || hasFileContent)) {
                console.log('[ShareTarget] AI processing enabled, mode:', mode);
                console.log('[ShareTarget] Content to process:', {
                    hasText: !!hasTextContent,
                    hasUrl: !!hasUrlContent,
                    hasFile: !!hasFileContent,
                    fileCount: shareData?.files?.length || 0,
                    files: shareData?.files?.map?.((f: File) => ({
                        name: f?.name,
                        type: f?.type,
                        size: f?.size
                    }))
                });

                // Get custom instruction
                const instructions = settings?.ai?.customInstructions?.map?.((i: any) => i.instruction?.trim?.()) || [];
                const activeId = settings?.ai?.activeInstructionId;
                const activeInstruction = activeId ? instructions?.find?.((i: string) => i === activeId) : null;
                const customInstruction = activeInstruction || "";
                console.log('[ShareTarget] Custom instruction:', customInstruction ? 'present' : 'none');

                // Prepare form data for commit routes
                const formData = new FormData();
                formData?.append?.('title', shareData?.title || '');
                formData?.append?.('text', shareData?.text || '');
                formData?.append?.('url', shareData?.url || '');
                formData?.append?.('customInstruction', customInstruction as string);

                // Only include files that aren't text files we already extracted from
                if (shareData?.files) {
                    shareData?.files?.forEach?.((file: File) => {
                        // Skip text files if we already extracted their content
                        const isTextFile = file?.type?.startsWith?.('text/') || file?.type === 'application/json';
                        const shouldInclude = !isTextFile || !shareData?.text?.trim?.();
                        if (shouldInclude) {
                            console.log('[ShareTarget] Including file for AI processing:', {
                                name: file?.name,
                                type: file?.type,
                                size: file?.size
                            });
                            formData?.append?.('files', file);
                        } else {
                            console.log('[ShareTarget] Skipping text file (content already extracted):', file?.name);
                        }
                    });
                }

                // Create synthetic event for commit routes
                const syntheticEvent = { request: { formData: () => Promise.resolve(formData) } };

                // Process with appropriate commit route
                if (mode === 'analyze') {
                    console.log('[ShareTarget] Processing with commitAnalyze...');
                    const results = await commitAnalyze?.(syntheticEvent)?.catch?.((err: any) => {
                        console.error('[ShareTarget] commitAnalyze error:', err);
                        console.error('[ShareTarget] Error details:', err?.message || err);
                        return [];
                    });
                    console.log('[ShareTarget] commitAnalyze results:', results);
                    if (results?.length) {
                        sendToast('Content analyzed and processed', 'success');
                        aiProcessed = true;
                    } else {
                        sendToast('Analysis completed but no results', 'warning');
                    }
                } else {
                    console.log('[ShareTarget] Processing with commitRecognize...');
                    const results = await commitRecognize?.(syntheticEvent)?.catch?.((err: any) => {
                        console.error('[ShareTarget] commitRecognize error:', err);
                        console.error('[ShareTarget] Error details:', err?.message || err);
                        return [];
                    });
                    console.log('[ShareTarget] commitRecognize results:', results);
                    if (results?.length) {
                        sendToast('Content recognized and copied', 'success');
                        aiProcessed = true;
                    } else {
                        sendToast('Recognition completed but no results', 'warning');
                    }
                }
            }
        } catch (aiError: any) {
            console.warn('[ShareTarget] AI processing failed:', aiError);
        }

        // Show appropriate notification
        if (!aiProcessed) {
            sendToast('Content received' + (hasApiKey ? ' (configure AI for auto-processing)' : ''), 'info');
        }

        // Redirect to app with shared flag
        return new Response(null, {
            status: 302,
            headers: { Location: '/?shared=1' }
        });
    } catch (err: any) {
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

// Fallback: Manual fetch event handler for share target (in case workbox routing fails)
self.addEventListener?.('fetch', (event: any) => {
    const request = event?.request ?? event?.event?.request ?? event;
    const requestUrl = new URL(request?.url || '');
    if (requestUrl.pathname === '/share-target' && request?.method === 'POST') {
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
