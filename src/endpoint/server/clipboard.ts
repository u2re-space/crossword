// =========================
// Clipboard Management
// =========================

import clipboardy from 'clipboardy';
import axios from 'axios';
import config from '../config.js';

const { peers, secret, pollInterval } = config;

let lastClipboard = '';
let lastNetworkClipboard = '';
let isBroadcasting = false;
let httpClient = axios;
let app: any = null;

type ClipboardChangeSource = 'local' | 'network';
type ClipboardListener = (text: string, meta: { source: ClipboardChangeSource }) => void;
const clipboardListeners = new Set<ClipboardListener>();

export function setApp(application: any) {
    app = application;
}

export function setHttpClient(client: any) {
    httpClient = client;
}

export function isClipboardBroadcasting(): boolean {
    return isBroadcasting;
}

export function setBroadcasting(value: boolean) {
    isBroadcasting = value;
}

function normalizeText(text: string) {
    return String(text ?? '');
}

function emitClipboardChange(text: string, source: ClipboardChangeSource) {
    for (const listener of clipboardListeners) {
        try {
            listener(text, { source });
        } catch (err) {
            app?.log?.warn?.({ err }, '[Clipboard] listener error');
        }
    }
}

export function onClipboardChange(listener: ClipboardListener): () => void {
    clipboardListeners.add(listener);
    return () => clipboardListeners.delete(listener);
}

async function broadcastClipboard(text: string) {
    if (!text) return;
    if (!peers || peers.length === 0) return;

    const body = text;
    const headers: any = {
        'Content-Type': 'text/plain; charset=utf-8',
    };
    if (secret) {
        headers['x-auth-token'] = secret;
    }

    app.log.info({ peers }, '[Broadcast] Sending to peers');
    isBroadcasting = true;
    const client = httpClient || axios;

    await Promise.all(
        peers.map(async (url: string) => {
            try {
                await client.post(url, body, { headers });
                app.log.info(`[Broadcast] Sent to ${url}`);
            } catch (err: any) {
                const code = err?.code ? ` code=${err.code}` : '';
                const status = err?.response?.status ? ` status=${err.response.status}` : '';
                app.log.warn(`[Broadcast] Failed to send to ${url}:${code}${status} ${err?.message || err}`);
            }
        })
    );

    isBroadcasting = false;
}

async function pollClipboard() {
    try {
        const current = normalizeText(await clipboardy.read());

        if (current === lastClipboard) {
            return;
        }

        app.log.info({ current }, '[Local] Clipboard changed');
        lastClipboard = current;

        if (current === lastNetworkClipboard) {
            app.log.info('[Local] Change is from network, no broadcast.');
            emitClipboardChange(current, 'network');
            return;
        }

        if (isBroadcasting) {
            app.log.info('[Local] Currently broadcasting, skip this change.');
            emitClipboardChange(current, 'local');
            return;
        }

        emitClipboardChange(current, 'local');
        await broadcastClipboard(current);
    } catch (err) {
        app.log.error({ err }, '[Poll] Error reading clipboard');
    }
}

export function startClipboardPolling() {
    setInterval(pollClipboard, pollInterval);
}

export async function readClipboard(): Promise<string> {
    return await clipboardy.read();
}

export async function writeClipboard(text: string): Promise<void> {
    await clipboardy.write(text);
    lastNetworkClipboard = text;
    lastClipboard = text;
    emitClipboardChange(text, 'network');
}
