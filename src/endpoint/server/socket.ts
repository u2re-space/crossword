// =========================
// Socket.IO Setup and Handlers
// =========================

import { Server } from 'socket.io';
import { parseBinaryMessage, buttonFromFlags } from './message.ts';
import {
    MSG_TYPE_MOVE,
    MSG_TYPE_CLICK,
    MSG_TYPE_SCROLL,
    MSG_TYPE_MOUSE_DOWN,
    MSG_TYPE_MOUSE_UP,
    MSG_TYPE_KEYBOARD,
    FLAG_DOUBLE,
    SERVER_JITTER_EPS,
    MSG_TYPE_VOICE_COMMAND
} from './constants.ts';
import { addMouseDelta } from './mouse.ts';
import {
    executeMouseClick,
    executeMouseToggle,
    executeScroll,
    executeKeyboardChar,
    executeCopyHotkey,
    executeCutHotkey,
    executePasteHotkey,
    //setBroadcastingFlag,
} from './actions.ts';
import { sendVoiceToPython, removePythonSubscriber } from './python.ts';
import { readClipboard, writeClipboard, onClipboardChange } from './clipboard.ts';

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function handleSocketMessage(logger: any, socket: any, buffer: Buffer | Uint8Array) {
    const msg = parseBinaryMessage(buffer);
    if (!msg) {
        logger?.warn?.('Invalid binary message format');
        return;
    }

    switch (msg.type) {
        case MSG_TYPE_MOVE: {
            if (!('dx' in msg) || !('dy' in msg)) break;
            const { dx = 0, dy = 0 } = msg;
            // Ignore jittery tiny deltas
            if (Math.abs(dx) < SERVER_JITTER_EPS && Math.abs(dy) < SERVER_JITTER_EPS) break;
            addMouseDelta(dx, dy);
            break;
        }
        case MSG_TYPE_CLICK: {
            const button = buttonFromFlags(msg.flags);
            const double = !!(msg.flags & FLAG_DOUBLE);
            executeMouseClick(button, double);
            break;
        }
        case MSG_TYPE_SCROLL: {
            if (!('dx' in msg) || !('dy' in msg)) break;
            const dx = msg.dx || 0;
            const dy = msg.dy || 0;
            executeScroll(dx, dy);
            break;
        }
        case MSG_TYPE_MOUSE_DOWN: {
            const button = buttonFromFlags(msg.flags);
            executeMouseToggle('down', button);
            break;
        }
        case MSG_TYPE_MOUSE_UP: {
            const button = buttonFromFlags(msg.flags);
            executeMouseToggle('up', button);
            break;
        }
        case MSG_TYPE_VOICE_COMMAND: {
            // Voice commands still need text, so we'll handle them separately
            // For now, we'll need to send voice commands as JSON or extend binary format
            logger?.warn?.('Voice command in binary format not yet supported');
            break;
        }
        case MSG_TYPE_KEYBOARD: {
            if (!('codePoint' in msg)) break;
            const { codePoint = 0, flags = 0 } = msg;
            //setBroadcastingFlag(isClipboardBroadcasting());
            executeKeyboardChar(codePoint, flags);
            break;
        }
        default:
            logger?.info?.({ type: msg.type }, 'Unknown binary message type');
    }
}

export function setupSocketIO(server: any, logger?: any) {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    });
    logger?.info?.('Socket.IO bridge initialized');

    // Broadcast clipboard updates to all clients connected to this Socket.IO server instance.
    // (Receive.ts creates 2 Socket.IO instances: HTTP and HTTPS; clients connect to one of them.)
    onClipboardChange((text, meta) => {
        io.emit('clipboard:update', { text, source: meta.source });
    });

    io.on('connection', (socket: any) => {
        logger?.info?.('Socket.IO client connected');

        // Send current clipboard immediately on connect (best-effort).
        readClipboard()
            .then((text) => socket.emit('clipboard:update', { text, source: 'local' }))
            .catch(() => { });

        socket.on('message', (data: any) => {
            // Handle binary messages (Buffer from Node.js or Uint8Array from browser)
            if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
                handleSocketMessage(logger, socket, data);
            } else if (typeof data === 'string') {
                // Fallback for JSON messages (e.g., voice commands)
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.type === 'voice_command') {
                        const text = jsonData.text || '';
                        logger?.info?.({ text }, 'Voice command');
                        sendVoiceToPython(socket, text).catch((err: any) => {
                            logger?.error?.({ err }, 'Failed to send voice command to python');
                            socket.emit('voice_result', {
                                type: 'voice_error',
                                error: err?.message || String(err),
                            });
                        });
                    }
                } catch (e) {
                    logger?.warn?.({ data }, 'Invalid JSON message');
                }
            }
        });

        // Clipboard commands (JSON events)
        socket.on('clipboard:get', async (ack?: any) => {
            try {
                const text = await readClipboard();
                const payload = { ok: true, text };
                if (typeof ack === 'function') ack(payload);
                socket.emit('clipboard:update', { text, source: 'local' });
            } catch (err: any) {
                if (typeof ack === 'function') ack({ ok: false, error: err?.message || String(err) });
            }
        });

        socket.on('clipboard:copy', async (ack?: any) => {
            try {
                executeCopyHotkey();
                await sleep(60);
                const text = await readClipboard();
                const payload = { ok: true, text };
                if (typeof ack === 'function') ack(payload);
                socket.emit('clipboard:update', { text, source: 'local' });
            } catch (err: any) {
                if (typeof ack === 'function') ack({ ok: false, error: err?.message || String(err) });
            }
        });

        socket.on('clipboard:cut', async (ack?: any) => {
            try {
                executeCutHotkey();
                await sleep(60);
                const text = await readClipboard();
                const payload = { ok: true, text };
                if (typeof ack === 'function') ack(payload);
                socket.emit('clipboard:update', { text, source: 'local' });
            } catch (err: any) {
                if (typeof ack === 'function') ack({ ok: false, error: err?.message || String(err) });
            }
        });

        socket.on('clipboard:paste', async (data: any, ack?: any) => {
            try {
                const text = typeof data?.text === 'string' ? data.text : '';
                if (text) {
                    await writeClipboard(text);
                    await sleep(20);
                }
                executePasteHotkey();
                if (typeof ack === 'function') ack({ ok: true });
            } catch (err: any) {
                if (typeof ack === 'function') ack({ ok: false, error: err?.message || String(err) });
            }
        });

        socket.on('disconnect', () => {
            logger?.info?.('Socket.IO client disconnected');
            removePythonSubscriber(socket);
        });
    });

    return io;
}
