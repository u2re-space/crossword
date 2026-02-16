// =========================
// Socket.IO Setup and Handlers
// =========================

import { Server } from 'socket.io';
import { registerAirpadSocketHandlers, setupAirpadClipboardBroadcast } from './socket-airpad.ts';
import { buildSocketIoOptions, describeHandshake } from './socketio-security.ts';

export function setupSocketIO(server: any, logger?: any) {
    const io = new Server(server, buildSocketIoOptions(logger));
    const allowPrivateNetwork = process.env.CORS_ALLOW_PRIVATE_NETWORK !== 'false';
    const applyPrivateNetworkHeaders = (headers: Record<string, any>, req: any): void => {
        if (!allowPrivateNetwork) return;
        const pnaHeader = String(req?.headers?.['access-control-request-private-network'] || '').toLowerCase();
        if (pnaHeader !== 'true') return;

        headers['Access-Control-Allow-Private-Network'] = 'true';
        const existingVary = String(headers['Vary'] || headers['vary'] || '');
        const varyParts = existingVary
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);
        if (!varyParts.includes('Access-Control-Request-Private-Network')) {
            varyParts.push('Access-Control-Request-Private-Network');
        }
        if (varyParts.length > 0) {
            headers['Vary'] = varyParts.join(', ');
        }
    };
    io.engine.on('initial_headers', (headers, req) => {
        applyPrivateNetworkHeaders(headers as any, req);
    });
    io.engine.on('headers', (headers, req) => {
        applyPrivateNetworkHeaders(headers as any, req);
    });
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
            onDisconnect: (reason) => {
                logger?.info?.(
                    {
                        socketId: socket?.id,
                        reason,
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
