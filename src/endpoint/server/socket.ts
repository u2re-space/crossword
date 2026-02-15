// =========================
// Socket.IO Setup and Handlers
// =========================

import { Server } from 'socket.io';
import { registerAirpadSocketHandlers, setupAirpadClipboardBroadcast } from './socket-airpad.ts';
import { buildSocketIoOptions, describeHandshake } from './socketio-security.ts';

export function setupSocketIO(server: any, logger?: any) {
    const io = new Server(server, buildSocketIoOptions(logger));
    logger?.info?.('[socket.io] Bridge initialized');

    io.engine.on('connection_error', (err: any) => {
        logger?.warn?.(
            {
                code: err?.code,
                message: err?.message,
                context: err?.context
            },
            '[socket.io] Engine connection error'
        );
    });

    // Broadcast clipboard updates to all clients connected to this Socket.IO server instance.
    // (Receive.ts creates 2 Socket.IO instances: HTTP and HTTPS; clients connect to one of them.)
    setupAirpadClipboardBroadcast(io as any);

    io.on('connection', (socket: any) => {
        logger?.info?.(
            {
                socketId: socket?.id,
                transport: socket?.conn?.transport?.name,
                handshake: describeHandshake(socket?.request)
            },
            '[socket.io] Client connected'
        );
        registerAirpadSocketHandlers(socket, {
            logger,
            onDisconnect: () => {
                logger?.info?.(
                    {
                        socketId: socket?.id,
                        transport: socket?.conn?.transport?.name,
                        handshake: describeHandshake(socket?.request)
                    },
                    '[socket.io] Client disconnected'
                );
            },
        });
    });

    io.on('connect_error', (err: any) => {
        logger?.warn?.(
            { message: err?.message, data: err?.data },
            '[socket.io] connect_error'
        );
    });

    return io;
}
