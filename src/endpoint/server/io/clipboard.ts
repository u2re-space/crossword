// =========================
// Clipboard Management
// =========================

import clipboardy from 'clipboardy';
import axios from 'axios';
import config from '../config/config.ts';

const { peers, secret, pollInterval } = config;
const clipboardReadTimeoutMs = Math.max(200, Number((config as any)?.clipboardReadTimeoutMs ?? 2000));
const clipboardErrorLogIntervalMs = Math.max(1000, Number((config as any)?.clipboardErrorLogIntervalMs ?? 15000));
const clipboardUnsupportedRetryIntervalMs = Math.max(
    5000,
    Number((config as any)?.clipboardUnsupportedRetryIntervalMs ?? 60000)
);

type ClipboardProtocol = "http" | "https";
type ClipboardPeerTarget = { protocol: ClipboardProtocol; port: number };

const DEFAULT_CLIPBOARD_PEER_TARGETS: ClipboardPeerTarget[] = [
    { protocol: "https", port: 443 },
    { protocol: "https", port: 8443 },
    { protocol: "http", port: 8080 },
    { protocol: "http", port: 80 },
];

const parseClipboardPeerTargets = (value: unknown): ClipboardPeerTarget[] => {
    const items = Array.isArray((config as any)?.clipboardPeerTargets)
        ? (config as any).clipboardPeerTargets
        : typeof value === "string"
            ? value.split(/[;,]/)
            : [];

    const parsed = items
        .map((entry: any) => String(entry ?? "").trim())
        .filter(Boolean)
        .map((entry: string) => {
            const [rawProtocol, rawPort] = entry.split(":").map((part) => part.trim());
            if (!rawProtocol || !rawPort) return null;
            const protocol = rawProtocol.toLowerCase() as ClipboardProtocol;
            const port = Number(rawPort);
            if ((protocol !== "http" && protocol !== "https") || !Number.isInteger(port) || port <= 0 || port > 65535) {
                return null;
            }
            return { protocol, port };
        })
        .filter((entry: ClipboardPeerTarget | null): entry is ClipboardPeerTarget => Boolean(entry));

    return parsed.length ? parsed : [];
};

const peerTargets = parseClipboardPeerTargets((config as any).clipboardPeerTargets ?? process.env.CLIPBOARD_PEER_TARGETS);
const fallbackPeerTargets = peerTargets.length ? peerTargets : DEFAULT_CLIPBOARD_PEER_TARGETS;

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

const buildClipboardPeerUrlCandidates = (raw: string): string[] => {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const normalized: string[] = [];

    const parseWithProtocol = (input: string): URL | undefined => {
        try {
            return new URL(input);
        } catch {
            return undefined;
        }
    };

    if (hasProtocol) {
        const parsed = parseWithProtocol(trimmed);
        if (!parsed) {
            app?.log?.warn?.(`[Clipboard] Invalid peer URL: ${trimmed}`);
            return [];
        }
        if (!parsed.pathname || parsed.pathname === "/") {
            parsed.pathname = "/clipboard";
        }
        normalized.push(parsed.toString());
        return normalized;
    }

    const baseUrl = parseWithProtocol(`https://${trimmed}`);
    if (!baseUrl) {
        app?.log?.warn?.(`[Clipboard] Invalid peer URL: ${trimmed}`);
        return [];
    }

    const targetVariants = baseUrl.port
        ? [
            { protocol: "https" as const, port: Number(baseUrl.port) },
            { protocol: "http" as const, port: Number(baseUrl.port) }
        ]
        : fallbackPeerTargets;

    for (const target of targetVariants) {
        try {
            const parsed = new URL(baseUrl.toString());
            parsed.protocol = `${target.protocol}:`;
            const shouldUseDefaultPort = (target.protocol === "https" && target.port === 443) ||
                (target.protocol === "http" && target.port === 80);
            parsed.port = shouldUseDefaultPort ? "" : String(target.port);
            if (!parsed.pathname || parsed.pathname === "/") {
                parsed.pathname = "/clipboard";
            }
            const normalizedUrl = parsed.toString();
            if (!normalized.includes(normalizedUrl)) {
                normalized.push(normalizedUrl);
            }
        } catch (_: unknown) {
            app?.log?.warn?.(`[Clipboard] Invalid peer URL: ${trimmed}`);
        }
    }

    return normalized;
};

async function sendClipboardToPeer(candidate: string, body: string, headers: Record<string, string>): Promise<void> {
    const client = httpClient || axios;
    await client.post(candidate, body, { headers });
    app.log.info(`[Broadcast] Sent to ${candidate}`);
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
    await Promise.all(
        peers.map(async (rawUrl: string) => {
            const candidates = buildClipboardPeerUrlCandidates(rawUrl);
            let ok = false;
            let lastError = "";

            for (const candidate of candidates) {
                try {
                    await sendClipboardToPeer(candidate, body, headers);
                    ok = true;
                    break;
                } catch (err: any) {
                    const code = err?.code ? ` code=${err.code}` : "";
                    const status = err?.response?.status ? ` status=${err.response.status}` : "";
                    lastError = `[Broadcast] Failed to send to ${candidate}:${code}${status} ${err?.message || err}`;
                }
            }

            if (!ok) {
                app.log.warn(lastError || `[Broadcast] No valid peer URL: ${rawUrl}`);
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
