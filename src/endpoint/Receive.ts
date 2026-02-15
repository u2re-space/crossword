// =========================
// Main Server Entry Point
// =========================

import fastify from 'fastify';
import formbody from '@fastify/formbody';
import { HTTP_PORT } from './server/constants.ts';
import config from './config.js';
import { loadHttpsCredentials, createHttpClient } from './server/https.ts';
import { setApp as setClipboardApp, setHttpClient, startClipboardPolling } from './server/clipboard.ts';
import { startMouseFlushInterval } from './server/mouse.ts';
import { setApp as setPythonApp } from './server/python.ts';
import { registerRoutes } from './server/routes.ts';
import { setupSocketIO } from './server/socket.ts';

let httpsApp: any = null;
let httpApp: any = null;
const HTTPS_PORT = (config as any).listenPort || 8443;
const HTTP_LISTEN_PORT = (config as any).httpPort || HTTP_PORT;

function registerPlugins(app: any) {
    app.register(formbody);

    // Ensure we can receive raw `text/plain` clipboard payloads.
    // Without this, Fastify may not parse text/plain into request.body as a string.
    app.addContentTypeParser('text/plain', { parseAs: 'string' }, async (_req: any, body: any) => {
        return body;
    });
}

async function startServers() {
    const httpsOptions = await loadHttpsCredentials();
    httpsApp = fastify({ logger: true, https: httpsOptions });
    httpApp = fastify({ logger: true });
    const httpClient = createHttpClient(httpsOptions);

    // Initialize module dependencies
    // Note: some modules keep a singleton `app` for logging; we point them at HTTPS app.
    setClipboardApp(httpsApp);
    setHttpClient(httpClient);
    setPythonApp(httpsApp);

    registerPlugins(httpsApp);
    registerPlugins(httpApp);

    registerRoutes(httpsApp);
    registerRoutes(httpApp);

    // Initialize Socket.IO servers (both HTTP and HTTPS) before listen.
    // This ensures `/socket.io` handlers are already attached when ports open.
    setupSocketIO(httpsApp.server, httpsApp.log);
    setupSocketIO(httpApp.server, httpApp.log);

    // Start HTTP/HTTPS in parallel to reduce startup latency.
    await Promise.all([
        httpsApp.listen({ port: HTTPS_PORT, host: '0.0.0.0' })
            .then(() => httpsApp.log.info(`Listening on https://0.0.0.0:${HTTPS_PORT}`)),
        httpApp.listen({ port: HTTP_LISTEN_PORT, host: '0.0.0.0' })
            .then(() => httpApp.log.info(`Listening on http://0.0.0.0:${HTTP_LISTEN_PORT}`)),
    ]);

    // Start background tasks
    startMouseFlushInterval();
    startClipboardPolling();
}

startServers().catch((err: Error) => {
    console.error(err);
    process.exit(1);
});
