import type { Server as SocketIOServer, Socket } from "socket.io";

import { parseBinaryMessage, buttonFromFlags } from "./message.ts";
import {
    MSG_TYPE_MOVE,
    MSG_TYPE_CLICK,
    MSG_TYPE_SCROLL,
    MSG_TYPE_MOUSE_DOWN,
    MSG_TYPE_MOUSE_UP,
    MSG_TYPE_KEYBOARD,
    FLAG_DOUBLE,
    SERVER_JITTER_EPS,
} from "./constants.ts";
import { addMouseDelta } from "./mouse.ts";
import {
    executeMouseClick,
    executeMouseToggle,
    executeScroll,
    executeKeyboardChar,
    executeCopyHotkey,
    executeCutHotkey,
    executePasteHotkey,
} from "./actions.ts";
import { sendVoiceToPython, removePythonSubscriber } from "./python.ts";
import { readClipboard, writeClipboard, onClipboardChange } from "./clipboard.ts";

type AirpadObjectMessageHandler = (msg: any, socket: Socket) => void | Promise<void>;
type AirpadDisconnectHandler = (reason: string, socket: Socket) => void | Promise<void>;

export interface AirpadSocketHandlerOptions {
    logger?: any;
    onObjectMessage?: AirpadObjectMessageHandler;
    onDisconnect?: AirpadDisconnectHandler;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function handleAirpadBinaryMessage(logger: any, buffer: Buffer | Uint8Array): void {
    const msg = parseBinaryMessage(buffer);
    if (!msg) {
        logger?.warn?.("Invalid binary message format");
        return;
    }

    switch (msg.type) {
        case MSG_TYPE_MOVE: {
            if (!("dx" in msg) || !("dy" in msg)) break;
            const { dx = 0, dy = 0 } = msg;
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
            if (!("dx" in msg) || !("dy" in msg)) break;
            executeScroll(msg.dx || 0, msg.dy || 0);
            break;
        }
        case MSG_TYPE_MOUSE_DOWN: {
            executeMouseToggle("down", buttonFromFlags(msg.flags));
            break;
        }
        case MSG_TYPE_MOUSE_UP: {
            executeMouseToggle("up", buttonFromFlags(msg.flags));
            break;
        }
        case MSG_TYPE_KEYBOARD: {
            if (!("codePoint" in msg)) break;
            executeKeyboardChar(msg.codePoint || 0, msg.flags || 0);
            break;
        }
        default:
            logger?.info?.({ type: msg.type }, "Unknown binary message type");
    }
}

export function setupAirpadClipboardBroadcast(io: SocketIOServer): void {
    onClipboardChange((text, meta) => {
        io.emit("clipboard:update", { text, source: meta.source });
    });
}

export function registerAirpadSocketHandlers(socket: Socket, options: AirpadSocketHandlerOptions = {}): void {
    const { logger, onObjectMessage, onDisconnect } = options;

    readClipboard()
        .then((text) => socket.emit("clipboard:update", { text, source: "local" }))
        .catch(() => { });

    socket.on("message", async (data: any) => {
        if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
            handleAirpadBinaryMessage(logger, data);
            return;
        }

        if (typeof data === "string") {
            try {
                const jsonData = JSON.parse(data);
                if (jsonData?.type === "voice_command") {
                    const text = jsonData.text || "";
                    logger?.info?.({ text }, "Voice command");
                    await sendVoiceToPython(socket as any, text).catch((err: any) => {
                        logger?.error?.({ err }, "Failed to send voice command to python");
                        socket.emit("voice_result", {
                            type: "voice_error",
                            error: err?.message || String(err),
                        });
                    });
                    return;
                }
            } catch {
                // keep compatibility: non-JSON payloads are ignored here
            }
            return;
        }

        if (data && typeof data === "object") {
            await onObjectMessage?.(data, socket);
        }
    });

    socket.on("clipboard:get", async (ack?: any) => {
        try {
            const text = await readClipboard();
            const payload = { ok: true, text };
            if (typeof ack === "function") ack(payload);
            socket.emit("clipboard:update", { text, source: "local" });
        } catch (err: any) {
            if (typeof ack === "function") ack({ ok: false, error: err?.message || String(err) });
        }
    });

    socket.on("clipboard:copy", async (ack?: any) => {
        try {
            executeCopyHotkey();
            await sleep(60);
            const text = await readClipboard();
            const payload = { ok: true, text };
            if (typeof ack === "function") ack(payload);
            socket.emit("clipboard:update", { text, source: "local" });
        } catch (err: any) {
            if (typeof ack === "function") ack({ ok: false, error: err?.message || String(err) });
        }
    });

    socket.on("clipboard:cut", async (ack?: any) => {
        try {
            executeCutHotkey();
            await sleep(60);
            const text = await readClipboard();
            const payload = { ok: true, text };
            if (typeof ack === "function") ack(payload);
            socket.emit("clipboard:update", { text, source: "local" });
        } catch (err: any) {
            if (typeof ack === "function") ack({ ok: false, error: err?.message || String(err) });
        }
    });

    socket.on("clipboard:paste", async (data: any, ack?: any) => {
        try {
            const text = typeof data?.text === "string" ? data.text : "";
            if (text) {
                await writeClipboard(text);
                await sleep(20);
            }
            executePasteHotkey();
            if (typeof ack === "function") ack({ ok: true });
        } catch (err: any) {
            if (typeof ack === "function") ack({ ok: false, error: err?.message || String(err) });
        }
    });

    socket.on("disconnect", async (reason: string) => {
        removePythonSubscriber(socket as any);
        await onDisconnect?.(reason, socket);
    });
}
