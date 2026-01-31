/**
 * Service Channels - Unified Channel Definitions
 * 
 * Provides channel definitions and factories for connecting views,
 * service workers, and components through fest/uniform.
 * 
 * Architecture:
 * - Each view/component has a dedicated channel for communication
 * - Service worker can broadcast to specific channels
 * - Channels support request/response and pub/sub patterns
 */

import {
    createUnifiedChannel,
    getUnifiedChannel,
    closeUnifiedChannel,
    type UnifiedChannelConfig,
    ChannelContext,
    createChannelContext,
    getOrCreateContext,
    addBroadcastChannel,
    deferChannel,
    initDeferredChannel,
    detectExecutionContext
} from "fest/uniform";
import { BROADCAST_CHANNELS, ROUTE_HASHES, COMPONENTS } from "@rs-com/config/Names";
import { createDeferred } from "fest/core";

// ============================================================================
// CHANNEL TYPES
// ============================================================================

/**
 * Service/view channel identifiers
 */
export type ServiceChannelId = 
    | "workcenter"
    | "settings"
    | "viewer"
    | "explorer"
    | "airpad"
    | "print"
    | "history"
    | "editor"
    | "home";

/**
 * Channel message types
 */
export interface ChannelMessage<T = unknown> {
    type: string;
    source: string;
    target: ServiceChannelId;
    data: T;
    timestamp: number;
    correlationId?: string;
}

/**
 * Channel state
 */
export interface ChannelState {
    connected: boolean;
    lastActivity: number;
    pendingMessages: number;
}

// ============================================================================
// CHANNEL CONFIGURATION
// ============================================================================

/**
 * Default channel configuration by view
 */
export const SERVICE_CHANNEL_CONFIG: Record<ServiceChannelId, {
    broadcastName: string;
    routeHash: string;
    component: string;
    description: string;
}> = {
    workcenter: {
        broadcastName: BROADCAST_CHANNELS.WORK_CENTER,
        routeHash: ROUTE_HASHES.WORKCENTER,
        component: COMPONENTS.WORK_CENTER,
        description: "AI work center for processing files and content"
    },
    settings: {
        broadcastName: BROADCAST_CHANNELS.SETTINGS,
        routeHash: ROUTE_HASHES.SETTINGS,
        component: COMPONENTS.SETTINGS,
        description: "Application settings and configuration"
    },
    viewer: {
        broadcastName: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
        routeHash: ROUTE_HASHES.MARKDOWN_VIEWER,
        component: COMPONENTS.MARKDOWN_VIEWER,
        description: "Content viewer for markdown and files"
    },
    explorer: {
        broadcastName: BROADCAST_CHANNELS.FILE_EXPLORER,
        routeHash: ROUTE_HASHES.FILE_EXPLORER,
        component: COMPONENTS.FILE_EXPLORER,
        description: "File explorer and browser"
    },
    airpad: {
        broadcastName: "rs-airpad",
        routeHash: "#airpad",
        component: "airpad",
        description: "Touch-friendly input pad"
    },
    print: {
        broadcastName: BROADCAST_CHANNELS.PRINT_CHANNEL,
        routeHash: ROUTE_HASHES.PRINT,
        component: COMPONENTS.BASIC_PRINT,
        description: "Print preview and export"
    },
    history: {
        broadcastName: BROADCAST_CHANNELS.HISTORY_CHANNEL,
        routeHash: ROUTE_HASHES.HISTORY,
        component: COMPONENTS.HISTORY,
        description: "Action history and undo/redo"
    },
    editor: {
        broadcastName: "rs-editor",
        routeHash: ROUTE_HASHES.MARKDOWN_EDITOR,
        component: COMPONENTS.MARKDOWN_EDITOR,
        description: "Content editor"
    },
    home: {
        broadcastName: "rs-home",
        routeHash: "#home",
        component: "home",
        description: "Home/landing view"
    }
};

// ============================================================================
// SERVICE CHANNEL MANAGER
// ============================================================================

/**
 * Service Channel Manager
 * 
 * Manages channels for all views and components, providing:
 * - Lazy initialization of channels
 * - Message routing between views
 * - Service worker communication
 */
export class ServiceChannelManager {
    private static instance: ServiceChannelManager;
    private channels = new Map<ServiceChannelId, BroadcastChannel>();
    private contexts = new Map<ServiceChannelId, ChannelContext>();
    private readyPromises = new Map<ServiceChannelId, ReturnType<typeof createDeferred<void>>>();
    private messageHandlers = new Map<ServiceChannelId, Set<(msg: ChannelMessage) => void>>();
    private executionContext: string;

    private constructor() {
        this.executionContext = detectExecutionContext();
        console.log(`[ServiceChannels] Initialized in ${this.executionContext} context`);
    }

    static getInstance(): ServiceChannelManager {
        if (!ServiceChannelManager.instance) {
            ServiceChannelManager.instance = new ServiceChannelManager();
        }
        return ServiceChannelManager.instance;
    }

    // ========================================================================
    // CHANNEL LIFECYCLE
    // ========================================================================

    /**
     * Initialize a service channel for a view
     */
    async initChannel(channelId: ServiceChannelId): Promise<BroadcastChannel> {
        // Return existing channel if already initialized
        if (this.channels.has(channelId)) {
            return this.channels.get(channelId)!;
        }

        const config = SERVICE_CHANNEL_CONFIG[channelId];
        if (!config) {
            throw new Error(`Unknown channel: ${channelId}`);
        }

        // Create deferred for ready state
        const deferred = createDeferred<void>();
        this.readyPromises.set(channelId, deferred);

        console.log(`[ServiceChannels] Initializing channel: ${channelId} -> ${config.broadcastName}`);

        // Create broadcast channel
        const channel = new BroadcastChannel(config.broadcastName);
        
        // Setup message handler
        channel.onmessage = (event) => {
            this.handleIncomingMessage(channelId, event.data);
        };

        channel.onmessageerror = (event) => {
            console.error(`[ServiceChannels] Message error on ${channelId}:`, event);
        };

        this.channels.set(channelId, channel);
        
        // Mark as ready
        deferred.resolve();
        
        console.log(`[ServiceChannels] Channel ready: ${channelId}`);
        return channel;
    }

    /**
     * Close a service channel
     */
    closeChannel(channelId: ServiceChannelId): void {
        const channel = this.channels.get(channelId);
        if (channel) {
            channel.close();
            this.channels.delete(channelId);
            this.readyPromises.delete(channelId);
            this.messageHandlers.delete(channelId);
            console.log(`[ServiceChannels] Channel closed: ${channelId}`);
        }
    }

    /**
     * Wait for a channel to be ready
     */
    async waitForChannel(channelId: ServiceChannelId): Promise<void> {
        const deferred = this.readyPromises.get(channelId);
        if (deferred) {
            await deferred.promise;
        } else {
            await this.initChannel(channelId);
        }
    }

    // ========================================================================
    // MESSAGING
    // ========================================================================

    /**
     * Send a message to a channel
     */
    async send<T>(
        target: ServiceChannelId,
        type: string,
        data: T,
        options: { correlationId?: string; source?: string } = {}
    ): Promise<void> {
        await this.waitForChannel(target);

        const channel = this.channels.get(target);
        if (!channel) {
            throw new Error(`Channel not ready: ${target}`);
        }

        const message: ChannelMessage<T> = {
            type,
            source: options.source || this.executionContext,
            target,
            data,
            timestamp: Date.now(),
            correlationId: options.correlationId
        };

        channel.postMessage(message);
        console.log(`[ServiceChannels] Sent message to ${target}:`, type);
    }

    /**
     * Broadcast a message to all initialized channels
     */
    broadcast<T>(type: string, data: T): void {
        for (const [channelId, channel] of this.channels) {
            const message: ChannelMessage<T> = {
                type,
                source: this.executionContext,
                target: channelId,
                data,
                timestamp: Date.now()
            };
            channel.postMessage(message);
        }
        console.log(`[ServiceChannels] Broadcast message:`, type);
    }

    /**
     * Subscribe to messages on a channel
     */
    subscribe(
        channelId: ServiceChannelId,
        handler: (msg: ChannelMessage) => void
    ): () => void {
        if (!this.messageHandlers.has(channelId)) {
            this.messageHandlers.set(channelId, new Set());
        }

        this.messageHandlers.get(channelId)!.add(handler);

        // Initialize channel if not already
        this.initChannel(channelId).catch(console.error);

        // Return unsubscribe function
        return () => {
            this.messageHandlers.get(channelId)?.delete(handler);
        };
    }

    /**
     * Handle incoming message
     */
    private handleIncomingMessage(channelId: ServiceChannelId, data: unknown): void {
        const handlers = this.messageHandlers.get(channelId);
        if (!handlers || handlers.size === 0) {
            console.log(`[ServiceChannels] No handlers for ${channelId}, message queued`);
            return;
        }

        const message = data as ChannelMessage;
        for (const handler of handlers) {
            try {
                handler(message);
            } catch (error) {
                console.error(`[ServiceChannels] Handler error on ${channelId}:`, error);
            }
        }
    }

    // ========================================================================
    // CHANNEL STATE
    // ========================================================================

    /**
     * Get channel configuration
     */
    getConfig(channelId: ServiceChannelId) {
        return SERVICE_CHANNEL_CONFIG[channelId];
    }

    /**
     * Check if channel is initialized
     */
    isInitialized(channelId: ServiceChannelId): boolean {
        return this.channels.has(channelId);
    }

    /**
     * Get all initialized channel IDs
     */
    getInitializedChannels(): ServiceChannelId[] {
        return Array.from(this.channels.keys());
    }

    /**
     * Get channel status
     */
    getStatus(): Record<ServiceChannelId, ChannelState> {
        const status: Partial<Record<ServiceChannelId, ChannelState>> = {};
        
        for (const channelId of Object.keys(SERVICE_CHANNEL_CONFIG) as ServiceChannelId[]) {
            status[channelId] = {
                connected: this.channels.has(channelId),
                lastActivity: Date.now(),
                pendingMessages: 0
            };
        }

        return status as Record<ServiceChannelId, ChannelState>;
    }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Get the singleton service channel manager
 */
export const serviceChannels = ServiceChannelManager.getInstance();

/**
 * Initialize a service channel
 */
export const initServiceChannel = (channelId: ServiceChannelId) => 
    serviceChannels.initChannel(channelId);

/**
 * Send a message to a channel
 */
export const sendToChannel = <T>(target: ServiceChannelId, type: string, data: T) =>
    serviceChannels.send(target, type, data);

/**
 * Subscribe to channel messages
 */
export const subscribeToChannel = (
    channelId: ServiceChannelId,
    handler: (msg: ChannelMessage) => void
) => serviceChannels.subscribe(channelId, handler);

/**
 * Broadcast to all channels
 */
export const broadcastToAll = <T>(type: string, data: T) =>
    serviceChannels.broadcast(type, data);
