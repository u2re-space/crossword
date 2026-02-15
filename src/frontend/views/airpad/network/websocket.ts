// =========================
// Socket.IO with Binary Messages
// =========================

import { io, Socket } from 'socket.io-client';
import { log, getWsStatusEl, getVoiceTextEl } from '../utils/utils';
import {
    getRemoteHost,
    getRemotePort,
    getRemoteProtocol,
} from '../config/config';

let socket: Socket | null = null;
let wsConnected = false;
let isConnecting = false;
let btnEl: HTMLElement | null = null;
let connectAttemptId = 0;
type WSConnectionHandler = (connected: boolean) => void;
const wsConnectionHandlers = new Set<WSConnectionHandler>();

// Clipboard state + listeners (PC clipboard as seen by backend)
let lastServerClipboardText = '';
type ClipboardUpdateHandler = (text: string, meta?: { source?: string }) => void;
const clipboardHandlers = new Set<ClipboardUpdateHandler>();

// Binary message format constants
export const MSG_TYPE_MOVE = 0;
export const MSG_TYPE_CLICK = 1;
export const MSG_TYPE_SCROLL = 2;
export const MSG_TYPE_MOUSE_DOWN = 3;
export const MSG_TYPE_MOUSE_UP = 4;
export const MSG_TYPE_VOICE_COMMAND = 5;
export const MSG_TYPE_KEYBOARD = 6;

const BUTTON_LEFT = 0;
const BUTTON_RIGHT = 1;
const BUTTON_MIDDLE = 2;
const FLAG_DOUBLE = 0x80;

export function getWS(): Socket | null {
    return socket;
}

export function isWSConnected(): boolean {
    return wsConnected;
}

export function onWSConnectionChange(handler: WSConnectionHandler): () => void {
    wsConnectionHandlers.add(handler);
    try {
        handler(wsConnected);
    } catch {
        // ignore subscriber errors
    }
    return () => wsConnectionHandlers.delete(handler);
}

export function getLastServerClipboard(): string {
    return lastServerClipboardText;
}

export function onServerClipboardUpdate(handler: ClipboardUpdateHandler): () => void {
    clipboardHandlers.add(handler);
    return () => clipboardHandlers.delete(handler);
}

function notifyClipboardHandlers(text: string, meta?: { source?: string }) {
    for (const h of clipboardHandlers) {
        try {
            h(text, meta);
        } catch {
            // ignore UI handler errors
        }
    }
}

export function requestClipboardGet(): Promise<{ ok: boolean; text?: string; error?: string }> {
    return new Promise((resolve) => {
        if (!socket || !socket.connected) return resolve({ ok: false, error: 'WS not connected' });
        socket.emit('clipboard:get', (res: any) => resolve(res || { ok: false }));
    });
}

export function requestClipboardCopy(): Promise<{ ok: boolean; text?: string; error?: string }> {
    return new Promise((resolve) => {
        if (!socket || !socket.connected) return resolve({ ok: false, error: 'WS not connected' });
        socket.emit('clipboard:copy', (res: any) => resolve(res || { ok: false }));
    });
}

export function requestClipboardCut(): Promise<{ ok: boolean; text?: string; error?: string }> {
    return new Promise((resolve) => {
        if (!socket || !socket.connected) return resolve({ ok: false, error: 'WS not connected' });
        socket.emit('clipboard:cut', (res: any) => resolve(res || { ok: false }));
    });
}

export function requestClipboardPaste(text: string): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
        if (!socket || !socket.connected) return resolve({ ok: false, error: 'WS not connected' });
        socket.emit('clipboard:paste', { text }, (res: any) => resolve(res || { ok: false }));
    });
}

function updateButtonLabel() {
    if (!btnEl) return;
    if (isConnecting || (socket && socket.connected === false)) {
        btnEl.textContent = 'Подключение...';
        return;
    }
    if (wsConnected || (socket && socket.connected)) {
        btnEl.textContent = 'Отключить WS';
    } else {
        btnEl.textContent = 'Подключить WS';
    }
}

function setWsStatus(connected: boolean) {
    wsConnected = connected;
    const wsStatusEl = getWsStatusEl();
    if (wsStatusEl) {
        if (connected) {
            wsStatusEl.textContent = 'connected';
            wsStatusEl.classList.remove('ws-status-bad');
            wsStatusEl.classList.add('ws-status-ok');
        } else {
            wsStatusEl.textContent = 'disconnected';
            wsStatusEl.classList.remove('ws-status-ok');
            wsStatusEl.classList.add('ws-status-bad');
        }
    }
    updateButtonLabel();

    for (const handler of wsConnectionHandlers) {
        try {
            handler(connected);
        } catch {
            // ignore subscriber errors
        }
    }
}

// Create binary message buffer for mouse/scroll (8 bytes)
// Format: [dx: 2][dy: 2][type: 1][flags: 1][reserved: 2]
function createMouseMessage(type: number, dx: number = 0, dy: number = 0, flags: number = 0): ArrayBuffer {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    view.setInt16(0, Math.round(dx), true);   // dx (signed int16, little-endian)
    view.setInt16(2, Math.round(dy), true);   // dy (signed int16, little-endian)
    view.setUint8(4, type);                   // message type
    view.setUint8(5, flags);                  // flags/button
    view.setUint16(6, 0, true);               // reserved

    return buffer;
}

// Create binary message for keyboard (8 bytes)
// Format: [codePoint: 4][type: 1][flags: 1][reserved: 2]
export function createKeyboardMessage(codePoint: number, flags: number = 0): ArrayBuffer {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    view.setUint32(0, codePoint, true);       // Full Unicode codePoint (little-endian)
    view.setUint8(4, MSG_TYPE_KEYBOARD);      // message type
    view.setUint8(5, flags);                  // flags
    view.setUint16(6, 0, true);               // reserved

    return buffer;
}

// Helper to determine keyboard flags from character
function getKeyboardFlags(char: string): number {
    if (char === '\b' || char === '\u007F') return 1;  // backspace
    if (char === '\n' || char === '\r') return 2;       // enter
    if (char === ' ') return 3;                         // space
    if (char === '\t') return 4;                        // tab
    return 0;                                           // normal character
}

// Send keyboard character (exported for use by other modules)
export function sendKeyboardChar(char: string) {
    if (!socket || !socket.connected) return;

    const codePoint = char.codePointAt(0) || 0;
    const flags = getKeyboardFlags(char);
    const buffer = createKeyboardMessage(codePoint, flags);

    socket.emit('message', new Uint8Array(buffer));
}

// Send raw binary message (for direct use)
export function sendBinaryMessage(buffer: ArrayBuffer | Uint8Array) {
    if (!socket || !socket.connected) return;

    const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    socket.emit('message', data);
}

export function sendWS(obj: any) {
    if (!socket || !socket.connected) return;

    let buffer: ArrayBuffer;

    switch (obj.type) {
        case 'move': {
            const dx = obj.dx || 0;
            const dy = obj.dy || 0;
            buffer = createMouseMessage(MSG_TYPE_MOVE, dx, dy);
            socket.emit('message', new Uint8Array(buffer));
            break;
        }
        case 'click': {
            let flags = BUTTON_LEFT;
            if (obj.button === 'right') flags = BUTTON_RIGHT;
            else if (obj.button === 'middle') flags = BUTTON_MIDDLE;
            if (obj.double || obj.count === 2) flags |= FLAG_DOUBLE;
            buffer = createMouseMessage(MSG_TYPE_CLICK, 0, 0, flags);
            socket.emit('message', new Uint8Array(buffer));
            break;
        }
        case 'scroll': {
            const dx = obj.dx || 0;
            const dy = obj.dy || 0;
            buffer = createMouseMessage(MSG_TYPE_SCROLL, dx, dy);
            socket.emit('message', new Uint8Array(buffer));
            break;
        }
        case 'mouse_down': {
            let flags = BUTTON_LEFT;
            if (obj.button === 'right') flags = BUTTON_RIGHT;
            else if (obj.button === 'middle') flags = BUTTON_MIDDLE;
            buffer = createMouseMessage(MSG_TYPE_MOUSE_DOWN, 0, 0, flags);
            socket.emit('message', new Uint8Array(buffer));
            break;
        }
        case 'mouse_up': {
            let flags = BUTTON_LEFT;
            if (obj.button === 'right') flags = BUTTON_RIGHT;
            else if (obj.button === 'middle') flags = BUTTON_MIDDLE;
            buffer = createMouseMessage(MSG_TYPE_MOUSE_UP, 0, 0, flags);
            socket.emit('message', new Uint8Array(buffer));
            break;
        }
        case 'voice_command': {
            // Voice commands still need text, so send as JSON
            socket.emit('message', JSON.stringify(obj));
            break;
        }
        case 'keyboard': {
            // Use the proper keyboard message format with full Unicode support
            const char = obj.char || '';
            const codePoint = obj.codePoint || char.codePointAt(0) || 0;
            const flags = obj.flags ?? getKeyboardFlags(char);
            buffer = createKeyboardMessage(codePoint, flags);
            socket.emit('message', new Uint8Array(buffer));
            break;
        }
        default:
            // Fallback to JSON for unknown types
            socket.emit('message', JSON.stringify(obj));
    }
}

function handleServerMessage(msg: any) {
    if (msg.type === 'voice_result' || msg.type === 'voice_error') {
        const text =
            msg.error ||
            msg.message ||
            ('Actions: ' + JSON.stringify(msg.actions || []));
        const voiceTextEl = getVoiceTextEl();
        if (voiceTextEl) {
            voiceTextEl.textContent = text;
        }
        log('Voice result: ' + text);
    }
}

export function connectWS() {
    if (socket && (socket.connected || (socket as any).connecting)) return;
    connectAttemptId += 1;
    const attemptId = connectAttemptId;

    const remoteHost = getRemoteHost() || location.hostname;
    const remotePort = getRemotePort().trim();
    const remoteProtocol = getRemoteProtocol();

    const inferProtocol = (): 'http' | 'https' => {
        if (remoteProtocol === 'http' || remoteProtocol === 'https') return remoteProtocol;
        if (remotePort === '443' || remotePort === '8443') return 'https';
        if (remotePort === '80' || remotePort === '8080') return 'http';
        return location.protocol === 'https:' ? 'https' : 'http';
    };

    const primaryProtocol = inferProtocol();
    const fallbackProtocol = primaryProtocol === 'https' ? 'http' : 'https';
    const defaultPortByProtocol = {
        http: '8080',
        https: '8443',
    } as const;
    const locationPort = location.port?.trim?.() || '';

    const protocolOrder = remoteProtocol === 'http'
        ? (['http', 'https'] as const)
        : remoteProtocol === 'https'
            ? (['https', 'http'] as const)
            : ([primaryProtocol, fallbackProtocol] as const);

    const getPortsForProtocol = (protocol: 'http' | 'https') => {
        const ports = [
            remotePort,
            defaultPortByProtocol[protocol],
            locationPort,
        ].filter((port): port is string => Boolean(port));
        return ports.filter((port, idx) => ports.indexOf(port) === idx);
    };

    const candidates: string[] = [];
    for (const protocol of protocolOrder) {
        for (const port of getPortsForProtocol(protocol)) {
            candidates.push(`${protocol}://${remoteHost}:${port}`);
        }
    }
    const uniqueCandidates = candidates.filter((url, idx) => candidates.indexOf(url) === idx);

    isConnecting = true;
    updateButtonLabel();

    const maxRounds = 3;
    const retryDelayMs = 450;
    const tryConnect = (index: number, round: number) => {
        if (attemptId !== connectAttemptId) return;

        if (index >= uniqueCandidates.length) {
            if (round + 1 < maxRounds) {
                log(`Socket.IO retry ${round + 2}/${maxRounds}...`);
                globalThis.setTimeout(() => tryConnect(0, round + 1), retryDelayMs);
                return;
            }
            log('Socket.IO error: all protocol candidates failed');
            isConnecting = false;
            setWsStatus(false);
            updateButtonLabel();
            return;
        }

        const url = uniqueCandidates[index];
        log('Connecting Socket.IO: ' + url);

        const probeSocket = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: 3500,
        });

        probeSocket.on('connect', () => {
            if (attemptId !== connectAttemptId) {
                probeSocket.removeAllListeners();
                probeSocket.close();
                return;
            }
            socket = probeSocket;
            log('Socket.IO connected: ' + url);
            isConnecting = false;
            setWsStatus(true);

            socket.on('disconnect', () => {
                log('Socket.IO disconnected');
                isConnecting = false;
                setWsStatus(false);
                updateButtonLabel();
            });

            socket.on('connect_error', (error) => {
                log('Socket.IO error: ' + (error.message || ''));
                isConnecting = false;
                updateButtonLabel();
            });

            socket.on('voice_result', (msg) => {
                handleServerMessage(msg);
            });
            socket.on('voice_error', (msg) => {
                handleServerMessage(msg);
            });

            socket.on('clipboard:update', (msg: any) => {
                const text = typeof msg?.text === 'string' ? msg.text : '';
                lastServerClipboardText = text;
                notifyClipboardHandlers(text, { source: msg?.source });
            });

            // Expose socket for virtual keyboard
            (window as any).__socket = socket;
        });

        probeSocket.on('connect_error', (error) => {
            if (attemptId !== connectAttemptId) {
                probeSocket.removeAllListeners();
                probeSocket.close();
                return;
            }
            probeSocket.removeAllListeners();
            probeSocket.close();
            tryConnect(index + 1, round);
            log(`Socket.IO connect failed (${url}): ${error.message || error}`);
        });
    };

    tryConnect(0, 0);
}

export function disconnectWS() {
    connectAttemptId += 1;
    if (!socket) {
        setWsStatus(false);
        return;
    }
    log('Disconnecting Socket.IO...');
    socket.disconnect();
    socket = null;
    (window as any).__socket = null;
    setWsStatus(false);
}

export function initWebSocket(btnConnect: HTMLElement | null) {
    btnEl = btnConnect;
    updateButtonLabel();
    if (!btnConnect) return;

    btnConnect.addEventListener('click', () => {
        if (wsConnected || (socket && socket.connected) || (socket as any)?.connecting) {
            disconnectWS();
        } else {
            connectWS();
        }
    });
}
