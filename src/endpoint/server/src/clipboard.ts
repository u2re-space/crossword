// =========================
// Clipboard Management
// =========================

import clipboardy from 'clipboardy';
import axios from 'axios';
import config from '../../config.js';

const { peers, secret, pollInterval } = config;
const clipboardReadTimeoutMs = Math.max(200, Number((config as any)?.clipboardReadTimeoutMs ?? 2000));
const clipboardErrorLogIntervalMs = Math.max(1000, Number((config as any)?.clipboardErrorLogIntervalMs ?? 15000));
const clipboardUnsupportedRetryIntervalMs = Math.max(
    5000,
    Number((config as any)?.clipboardUnsupportedRetryIntervalMs ?? 60000)
);

let lastClipboard = '';
let lastNetworkClipboard = '';
let isBroadcasting = false;
let httpClient = axios;
let app: any = null;
let clipboardUnsupported = false;
let lastClipboardErrorLogAt = 0;
let pollingTimer: NodeJS.Timeout | null = null;

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

function isClipboardUnavailableError(err: unknown): boolean {
    const message = String((err as any)?.message || '');
    const fallbackMessage = String((err as any)?.fallbackError?.message || '');
    const stack = String((err as any)?.stack || '');
    const joined = `${message}\n${fallbackMessage}\n${stack}`;
    return (
        joined.includes('xsel') ||
        joined.includes('xclip') ||
        joined.includes("Can't open display") ||
        joined.includes('fallback didn\'t work')
    );
}

async function readClipboardWithTimeout(): Promise<string> {
    return await Promise.race<string>([
        clipboardy.read(),
        new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error(`Clipboard read timeout (${clipboardReadTimeoutMs}ms)`)), clipboardReadTimeoutMs);
        })
    ]);
}

function shouldLogClipboardErrorNow(): boolean {
    const now = Date.now();
    if (now - lastClipboardErrorLogAt < clipboardErrorLogIntervalMs) return false;
    lastClipboardErrorLogAt = now;
    return true;
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
    if (clipboardUnsupported) return;
    try {
        const current = normalizeText(await readClipboardWithTimeout());

        if (current === lastClipboard) {
            return;
        }

        app.log.info('[Local] Clipboard changed');
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
        if (isClipboardUnavailableError(err)) {
            clipboardUnsupported = true;
            app?.log?.warn?.(
                { err },
                '[Poll] Clipboard backend is unavailable. Polling is temporarily disabled and will retry later.'
            );
            return;
        }
        if (shouldLogClipboardErrorNow()) {
            app?.log?.error?.({ err }, '[Poll] Error reading clipboard');
        }
    }
}

export function startClipboardPolling() {
    if (pollingTimer) return;
    const intervalMs = Math.max(10, Number(pollInterval) || 100);
    const loop = () => {
        const delay = clipboardUnsupported ? clipboardUnsupportedRetryIntervalMs : intervalMs;
        pollingTimer = setTimeout(async () => {
            if (clipboardUnsupported) {
                try {
                    await readClipboardWithTimeout();
                    clipboardUnsupported = false;
                    app?.log?.info?.('[Poll] Clipboard backend became available again; polling resumed.');
                } catch (err) {
                    if (shouldLogClipboardErrorNow()) {
                        app?.log?.warn?.({ err }, '[Poll] Clipboard backend still unavailable.');
                    }
                    loop();
                    return;
                }
            }
            await pollClipboard();
            loop();
        }, delay);
    };
    loop();
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
