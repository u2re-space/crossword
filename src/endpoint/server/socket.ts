// =========================
// Socket.IO Setup and Handlers
// =========================

import { Server } from 'socket.io';
import { registerAirpadSocketHandlers, setupAirpadClipboardBroadcast } from './socket-airpad.ts';

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
    setupAirpadClipboardBroadcast(io as any);

    io.on('connection', (socket: any) => {
        logger?.info?.('Socket.IO client connected');
        registerAirpadSocketHandlers(socket, {
            logger,
            onDisconnect: () => {
            logger?.info?.('Socket.IO client disconnected');
            },
        });
    });

    return io;
}
