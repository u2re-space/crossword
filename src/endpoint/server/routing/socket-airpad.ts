import type { Socket } from "socket.io";

import { parseBinaryMessage, buttonFromFlags } from "../io/message.ts";
import {
    MSG_TYPE_MOVE,
    MSG_TYPE_CLICK,
    MSG_TYPE_SCROLL,
    MSG_TYPE_MOUSE_DOWN,
    MSG_TYPE_MOUSE_UP,
    MSG_TYPE_KEYBOARD,
    FLAG_DOUBLE,
    SERVER_JITTER_EPS,
} from "../config/constants.ts";
import { addMouseDelta } from "../io/mouse.ts";
import {
    executeMouseClick,
    executeMouseToggle,
    executeScroll,
    executeKeyboardChar,
    executeCopyHotkey,
    executeCutHotkey,
    executePasteHotkey,
} from "../io/actions.ts";
import { sendVoiceToPython, removePythonSubscriber } from "../gpt/python.ts";
import clipboardy from "clipboardy";
import { pickEnvBoolLegacy } from "../lib/env.ts";
import { safeJsonParse } from "../lib/parsing.ts";

type AirpadObjectMessageHandler = (msg: any, socket: Socket) => void | Promise<void>;
type AirpadDisconnectHandler = (reason: string, socket: Socket) => void | Promise<void>;
type AirpadBinaryMessageHandler = (data: Buffer | Uint8Array, socket: Socket) => boolean | Promise<boolean>;
type AirpadClipboardSource = "local" | "network";
const airpadClipboardEnabled =
    pickEnvBoolLegacy("CWS_AIRPAD_CLIPBOARD_ENABLED", true) ??
    pickEnvBoolLegacy("CWS_CLIPBOARD_ENABLED", true) ??
    true;

export interface AirpadSocketHandlerOptions {
    logger?: any;
    onObjectMessage?: AirpadObjectMessageHandler;
    onBinaryMessage?: AirpadBinaryMessageHandler;
    onDisconnect?: AirpadDisconnectHandler;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

const airpadSockets = new Set<Socket>();

function emitClipboardUpdate(text: string, source: AirpadClipboardSource): void {
    const payload = { text, source };
    for (const client of airpadSockets) {
        if (!client || client.disconnected) continue;
        client.emit("clipboard:update", payload);
    }
}

async function readAirpadClipboard(): Promise<string> {
    if (!airpadClipboardEnabled) return "";
    try {
        const text = await clipboardy.read();
        return String(text ?? "");
    } catch (_err) {
        return "";
    }
}

async function writeAirpadClipboard(text: string): Promise<void> {
    if (!airpadClipboardEnabled) return;
    const value = String(text ?? "");
    if (!value) return;
    try {
        await clipboardy.write(value);
    } catch (_err) {
        return;
    }
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

export function registerAirpadSocketHandlers(socket: Socket, options: AirpadSocketHandlerOptions = {}): void {
    const { logger, onObjectMessage, onBinaryMessage, onDisconnect } = options;
    airpadSockets.add(socket);

    readAirpadClipboard()
        .then((text) => socket.emit("clipboard:update", { text, source: "local" }))
        .catch(() => { });

    socket.on("message", async (data: any) => {
        if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
            const handled = await onBinaryMessage?.(data as any, socket);
            if (handled) return;
            handleAirpadBinaryMessage(logger, data);
            return;
        }

        if (typeof data === "string") {
            const jsonData = safeJsonParse<Record<string, unknown>>(data);
            if (jsonData?.type === "voice_command") {
                const text = String(jsonData.text || "");
                logger?.info?.("Voice command");
                await sendVoiceToPython(socket as any, text).catch((err: any) => {
                    logger?.error?.({ err }, "Failed to send voice command to python");
                    socket.emit("voice_result", {
                        type: "voice_error",
                        error: err?.message || String(err),
                    });
                });
                return;
            }
            return;
        }

        if (data && typeof data === "object") {
            await onObjectMessage?.(data, socket);
        }
    });

    socket.on("clipboard:get", async (ack?: any) => {
        try {
            const text = await readAirpadClipboard();
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
            const text = await readAirpadClipboard();
            const payload = { ok: true, text };
            if (typeof ack === "function") ack(payload);
            emitClipboardUpdate(text, "local");
        } catch (err: any) {
            if (typeof ack === "function") ack({ ok: false, error: err?.message || String(err) });
        }
    });

    socket.on("clipboard:cut", async (ack?: any) => {
        try {
            executeCutHotkey();
            await sleep(60);
            const text = await readAirpadClipboard();
            const payload = { ok: true, text };
            if (typeof ack === "function") ack(payload);
            emitClipboardUpdate(text, "local");
        } catch (err: any) {
            if (typeof ack === "function") ack({ ok: false, error: err?.message || String(err) });
        }
    });

    socket.on("clipboard:paste", async (data: any, ack?: any) => {
        try {
            const text = typeof data?.text === "string" ? data.text : "";
            if (text) {
                await writeAirpadClipboard(text);
                emitClipboardUpdate(text, "local");
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
        airpadSockets.delete(socket);
        await onDisconnect?.(reason, socket);
    });
}
