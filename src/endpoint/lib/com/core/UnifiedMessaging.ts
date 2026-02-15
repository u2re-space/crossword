/**
 * Unified Messaging System for CrossWord
 * Consolidates all messaging, broadcasting, queuing, and pipeline functionality
 * using fest/uniform library for optimal performance and maintainability
 */

import {
    createQueuedOptimizedWorkerChannel,
    OptimizedWorkerChannel,
    detectExecutionContext,
    supportsDedicatedWorkers,
} from 'fest/uniform';

import { createDeferred, globalChannelRegistry, globalChannelHealthMonitor } from 'fest/core';

import {
    BROADCAST_CHANNELS,
    CONTENT_TYPES,
    DESTINATIONS,
} from '@rs-com/config/Names';

import { MessageQueue } from './MessageQueue';
import { resolveAssociation, resolveAssociationPipeline } from "./ContentAssociations";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface UnifiedMessage {
    id: string;
    type: string;
    source: string;
    destination?: string;
    contentType?: string;
    data: any;
    metadata?: {
        timestamp?: number;
        correlationId?: string;
        priority?: 'low' | 'normal' | 'high';
        expiresAt?: number;
        retryCount?: number;
        maxRetries?: number;
        [key: string]: any;
    };
}

export interface MessageHandler {
    canHandle: (message: UnifiedMessage) => boolean;
    handle: (message: UnifiedMessage) => Promise<void> | void;
}

export interface WorkerChannelConfig {
    name: string;
    script: string | (() => Worker) | Worker;
    options?: WorkerOptions;
    protocolOptions?: {
        timeout?: number;
        retries?: number;
        batching?: boolean;
        compression?: boolean;
    };
}

export interface ViewChannelConfig {
    viewHash: string;
    workerConfigs: WorkerChannelConfig[];
    autoStart?: boolean;
}

export interface PipelineConfig {
    name: string;
    stages: PipelineStage[];
    errorHandler?: (error: any, stage: PipelineStage, message: UnifiedMessage) => void;
    timeout?: number;
}

export interface PipelineStage {
    name: string;
    handler: (message: UnifiedMessage) => Promise<UnifiedMessage> | UnifiedMessage;
    timeout?: number;
    retries?: number;
}

// ============================================================================
// UNIFIED MESSAGING MANAGER
// ============================================================================

export class UnifiedMessagingManager {
    private static instance: UnifiedMessagingManager;
    private handlers = new Map<string, MessageHandler[]>();
    private channels = new Map<string, BroadcastChannel | OptimizedWorkerChannel>();
    private workerChannels = new Map<string, OptimizedWorkerChannel>();
    private viewChannels = new Map<string, Set<string>>();
    private pipelines = new Map<string, PipelineConfig>();
    private messageQueue = new MessageQueue();
    private initializedViews = new Set<string>();
    private viewReadyPromises = new Map<string, any>();
    private executionContext: 'service-worker' | 'main' | 'chrome-extension' | undefined;

    constructor() {
        this.executionContext = detectExecutionContext() as any;
        this.setupGlobalListeners();
    }

    static getInstance(): UnifiedMessagingManager {
        if (!UnifiedMessagingManager.instance) {
            UnifiedMessagingManager.instance = new UnifiedMessagingManager();
        }
        return UnifiedMessagingManager.instance;
}

// ============================================================================
    // MESSAGE HANDLING
// ============================================================================

/**
     * Register a message handler for a specific destination
     */
    registerHandler(destination: string, handler: MessageHandler): void {
        if (!this.handlers.has(destination)) {
            this.handlers.set(destination, []);
        }
        this.handlers.get(destination)!.push(handler);
    }

    /**
     * Unregister a message handler
     */
    unregisterHandler(destination: string, handler: MessageHandler): void {
        const handlers = this.handlers.get(destination);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Send a message to a destination
     */
    async sendMessage(message: UnifiedMessage): Promise<boolean> {
        // Ensure message has required fields
        const fullMessage: UnifiedMessage = {
            ...message,
            id: message.id || crypto.randomUUID(),
            metadata: { timestamp: Date.now(), ...message.metadata },
        };

        // Try to deliver immediately
        if (await this.tryDeliverMessage(fullMessage)) {
            return true;
        }

        // Queue for later delivery if destination not available
        if (fullMessage.destination) {
            // Also store a synchronous pending copy for view/component catch-up.
            // This is used by initializeComponent()/hasPendingMessages(), because IndexedDB-based queues
            // cannot be drained synchronously during view bootstrap.
            PendingMessageStore.enqueue(fullMessage.destination, fullMessage);

            await this.messageQueue.queueMessage(fullMessage.type, fullMessage, {
                priority: fullMessage.metadata?.priority || 'normal',
                maxRetries: fullMessage.metadata?.maxRetries || 3,
                destination: fullMessage.destination
            });
        }

        return false;
    }

    /**
     * Process a message through registered handlers
     */
    async processMessage(message: UnifiedMessage): Promise<void> {
        const destination = message.destination || 'general';
        const handlers = this.handlers.get(destination) || [];

        for (const handler of handlers) {
            if (handler.canHandle(message)) {
                try {
                    await handler.handle(message);
                } catch (error) {
                    console.error(`[UnifiedMessaging] Handler error for ${destination}:`, error);
                }
            }
        }
    }

    /**
     * Try to deliver message immediately
     */
    private async tryDeliverMessage(message: UnifiedMessage): Promise<boolean> {
        // Check if destination has handlers
        if (message.destination && this.handlers.has(message.destination)) {
            await this.processMessage(message);
            return true;
        }

        // Check if we have a broadcast channel for the destination
        const channelName = this.getChannelForDestination(message.destination);
        if (channelName && this.channels.has(channelName)) {
            const channel = this.channels.get(channelName);
            if (channel instanceof BroadcastChannel) {
                try {
                    channel.postMessage(message);
                return true;
                } catch (error) {
                    console.warn(`[UnifiedMessaging] Failed to post to broadcast channel ${channelName}:`, error);
                }
            } else if (channel instanceof OptimizedWorkerChannel) {
                try {
                    await channel.request(message.type, [message]);
                    return true;
                } catch (error) {
                    console.warn(`[UnifiedMessaging] Failed to post to worker channel ${channelName}:`, error);
                }
            }
        }

        return false;
}

// ============================================================================
    // WORKER CHANNEL MANAGEMENT
// ============================================================================

/**
     * Register worker channels for a specific view
     */
    registerViewChannels(viewHash: string, configs: WorkerChannelConfig[]): void {
        const channelNames = new Set<string>();

        for (const config of configs) {
            if (!this.isWorkerSupported(config)) {
                console.log(`[UnifiedMessaging] Skipping worker '${config.name}' in ${this.executionContext} context`);
                continue;
            }

            const channel = createQueuedOptimizedWorkerChannel({
                name: config.name,
                script: config.script,
                options: config.options,
                context: this.executionContext
            }, config.protocolOptions, (_workerChannel) => {
                console.log(`[UnifiedMessaging] Channel '${config.name}' ready for view '${viewHash}'`);
            });

            const channelKey = `${viewHash}:${config.name}`;
            this.workerChannels.set(channelKey, channel);
            this.channels.set(channelKey, channel);
            channelNames.add(config.name);

            // Register in global systems
            globalChannelRegistry.register(channelKey, channel);
            globalChannelHealthMonitor.registerHealthCheck(
                channelKey,
                async () => {
                    try {
                        await channel.request('ping', {});
                        return true;
                    } catch {
                        return false;
                    }
                },
                30000
            );
        }

        this.viewChannels.set(viewHash, channelNames);
    }

    /**
     * Initialize channels when a view becomes active
     */
    async initializeViewChannels(viewHash: string): Promise<void> {
        if (this.initializedViews.has(viewHash)) return;

        const deferred = createDeferred<void>();
        this.viewReadyPromises.set(viewHash, deferred);

        console.log(`[UnifiedMessaging] Initializing channels for view: ${viewHash}`);

        const channelNames = this.viewChannels.get(viewHash);
        if (!channelNames) {
            deferred.resolve();
            return;
        }

        const initPromises: Promise<void>[] = [];
        for (const channelName of channelNames) {
            const channelKey = `${viewHash}:${channelName}`;
            const channel = this.workerChannels.get(channelKey);

            if (channel) {
                initPromises.push(
                    channel.request('ping', {}).catch(() => {
                        console.log(`[UnifiedMessaging] Channel '${channelName}' queued for view '${viewHash}'`);
                    })
                );
            }
        }

        await Promise.allSettled(initPromises);
        this.initializedViews.add(viewHash);
        deferred.resolve();
    }

    /**
     * Get a worker channel for a specific view and worker
     */
    getWorkerChannel(viewHash: string, workerName: string): OptimizedWorkerChannel | null {
        return this.workerChannels.get(`${viewHash}:${workerName}`) || null;
    }

    // ============================================================================
    // BROADCAST CHANNEL MANAGEMENT
    // ============================================================================

    /**
     * Create or get a broadcast channel
     */
    getBroadcastChannel(channelName: string): BroadcastChannel {
        if (!this.channels.has(channelName)) {
      try {
        const channel = new BroadcastChannel(channelName);
                channel.addEventListener('message', (event) => {
                    this.handleBroadcastMessage(event.data, channelName);
                });
        this.channels.set(channelName, channel);
      } catch (error) {
                console.warn(`[UnifiedMessaging] BroadcastChannel not available: ${channelName}`, error);
                // Fallback to a mock channel that does nothing
                const mockChannel = {
                    postMessage: () => {},
                    close: () => {},
                    addEventListener: () => {},
                    removeEventListener: () => {}
                } as any;
                this.channels.set(channelName, mockChannel);
            }
        }
        return this.channels.get(channelName) as BroadcastChannel;
    }

    /**
     * Handle incoming broadcast messages
     */
    private async handleBroadcastMessage(message: any, channelName: string): Promise<void> {
        try {
            // Convert to unified message format if needed
            const unifiedMessage: UnifiedMessage = message.id ? message : {
        id: crypto.randomUUID(),
                type: message.type || 'unknown',
                source: channelName,
                data: message,
                metadata: { timestamp: Date.now() }
            };

            await this.processMessage(unifiedMessage);
        } catch (error) {
            console.error(`[UnifiedMessaging] Error handling broadcast message on ${channelName}:`, error);
        }
}

// ============================================================================
    // PIPELINE MANAGEMENT
// ============================================================================

/**
     * Register a message processing pipeline
     */
    registerPipeline(config: PipelineConfig): void {
        this.pipelines.set(config.name, config);
    }

    /**
     * Process a message through a pipeline
     */
    async processThroughPipeline(pipelineName: string, message: UnifiedMessage): Promise<UnifiedMessage> {
        const pipeline = this.pipelines.get(pipelineName);
        if (!pipeline) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }

        let currentMessage = { ...message };
        const timeout = pipeline.timeout || 30000;

        for (const stage of pipeline.stages) {
            const stageTimeout = stage.timeout || timeout;
            const retries = stage.retries || 0;

            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const result = await Promise.race([
                        stage.handler(currentMessage),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error(`Stage '${stage.name}' timeout`)), stageTimeout)
                        )
                    ]);

                    currentMessage = result;
                    break; // Success, move to next stage
      } catch (error) {
                    if (attempt === retries) {
                        if (pipeline.errorHandler) {
                            pipeline.errorHandler(error, stage, currentMessage);
                        }
                        throw error;
                    }
                    console.warn(`[UnifiedMessaging] Pipeline '${pipelineName}' stage '${stage.name}' attempt ${attempt + 1} failed:`, error);
                }
            }
        }

        return currentMessage;
    }

    // ============================================================================
    // QUEUE MANAGEMENT
    // ============================================================================

    /**
     * Process queued messages for a destination
     */
    async processQueuedMessages(destination?: string): Promise<void> {
        const queuedMessages = await this.messageQueue.getQueuedMessages();

        for (const queuedMessage of queuedMessages) {
            if (!destination || queuedMessage.destination === destination) {
                // If the queued payload is already a UnifiedMessage, replay it as-is.
                // Otherwise, wrap it.
                const dataAsMessage = queuedMessage.data as any;
                const message: UnifiedMessage = (dataAsMessage && typeof dataAsMessage === "object" && typeof dataAsMessage.type === "string" && typeof dataAsMessage.id === "string")
                    ? dataAsMessage
                    : {
                        id: queuedMessage.id,
                        type: queuedMessage.type,
                        source: 'queue',
                        destination: queuedMessage.destination,
                        data: queuedMessage.data,
                        metadata: {
                            timestamp: queuedMessage.timestamp,
                            retryCount: queuedMessage.retryCount,
                            maxRetries: queuedMessage.maxRetries,
                            ...queuedMessage.metadata
                        }
                    };

                if (await this.tryDeliverMessage(message)) {
                    await this.messageQueue.removeMessage(queuedMessage.id);
                }
            }
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Get channel name for a destination
     */
    private getChannelForDestination(destination?: string): string | null {
        if (!destination) return null;

        // Direct channel mapping
        const channelMap: Record<string, string> = {
            [DESTINATIONS.WORKCENTER]: BROADCAST_CHANNELS.WORK_CENTER,
            [DESTINATIONS.CLIPBOARD]: BROADCAST_CHANNELS.CLIPBOARD,
            [DESTINATIONS.MARKDOWN_VIEWER]: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
            [DESTINATIONS.SETTINGS]: BROADCAST_CHANNELS.SETTINGS,
            [DESTINATIONS.FILE_EXPLORER]: BROADCAST_CHANNELS.FILE_EXPLORER,
            [DESTINATIONS.PRINT_VIEWER]: BROADCAST_CHANNELS.PRINT_VIEWER
        };

        return channelMap[destination] || null;
    }

    /**
     * Check if a worker configuration is supported
     */
    private isWorkerSupported(_config: WorkerChannelConfig): boolean {
        if (this.executionContext === 'service-worker') {
            return true; // Service workers can handle their own operations
        }

        if (this.executionContext === 'chrome-extension') {
            return supportsDedicatedWorkers();
        }

        return true; // Main thread generally supports workers
    }

    /**
     * Set up global listeners for cross-component communication
     */
    private setupGlobalListeners(): void {
        // Listen for global messages and route them appropriately
        if (typeof window !== 'undefined') {
            window.addEventListener('message', (event) => {
                // Handle postMessage communications
                if (event.data && typeof event.data === 'object' && event.data.type) {
                    this.handleBroadcastMessage(event.data, 'window-message');
                }
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        // Close all channels
        for (const channel of this.channels.values()) {
            if (channel instanceof BroadcastChannel) {
                channel.close();
            } else if (channel instanceof OptimizedWorkerChannel) {
                channel.close();
            }
        }

        this.channels.clear();
        this.workerChannels.clear();
        this.handlers.clear();
        this.pipelines.clear();
    }
}

// ============================================================================
// PENDING MESSAGE STORE (SYNC CATCH-UP)
// ============================================================================

type PendingStoreEntry = {
    destination: string;
    message: UnifiedMessage;
    storedAt: number;
};

class PendingMessageStore {
    private static readonly KEY = "rs-unified-messaging-pending";
    private static readonly MAX = 200;
    private static readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

    private static read(): PendingStoreEntry[] {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(PendingMessageStore.KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private static write(entries: PendingStoreEntry[]): void {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(PendingMessageStore.KEY, JSON.stringify(entries));
        } catch {
            // ignore
        }
    }

    static enqueue(destination: string, message: UnifiedMessage): void {
        if (!destination) return;
        const now = Date.now();
        const ttl = Number(message?.metadata?.expiresAt)
            ? Math.max(0, Number(message.metadata!.expiresAt) - now)
            : PendingMessageStore.DEFAULT_TTL_MS;

        // Skip immediately-expired
        if (ttl <= 0) return;

        const entries = PendingMessageStore.read()
            .filter(e => e && typeof e === "object")
            .filter(e => {
                const expiresAt = Number(e?.message?.metadata?.expiresAt) || (Number(e?.storedAt) + PendingMessageStore.DEFAULT_TTL_MS);
                return expiresAt > now;
            });

        entries.push({ destination, message, storedAt: now });
        if (entries.length > PendingMessageStore.MAX) {
            entries.splice(0, entries.length - PendingMessageStore.MAX);
        }
        PendingMessageStore.write(entries);
    }

    static drain(destination: string): UnifiedMessage[] {
        if (!destination) return [];
        const now = Date.now();
        const entries = PendingMessageStore.read();

        const keep: PendingStoreEntry[] = [];
        const out: UnifiedMessage[] = [];

        for (const e of entries) {
            const expiresAt = Number(e?.message?.metadata?.expiresAt) || (Number(e?.storedAt) + PendingMessageStore.DEFAULT_TTL_MS);
            if (expiresAt <= now) continue;
            if (e?.destination === destination && e?.message) {
                out.push(e.message);
            } else {
                keep.push(e);
            }
        }

        PendingMessageStore.write(keep);
        return out;
    }

    static has(destination: string): boolean {
        if (!destination) return false;
        const now = Date.now();
        return PendingMessageStore.read().some((e) => {
            if (!e || typeof e !== "object") return false;
            const expiresAt = Number(e?.message?.metadata?.expiresAt) || (Number(e?.storedAt) + PendingMessageStore.DEFAULT_TTL_MS);
            return expiresAt > now && e?.destination === destination;
        });
    }
}

// ============================================================================
// CONVENIENCE FUNCTIONS AND EXPORTS
// ============================================================================

// Singleton instance
export const unifiedMessaging = UnifiedMessagingManager.getInstance();

// Convenience functions
export function sendMessage(message: Omit<UnifiedMessage, 'id' | 'source'> & { source?: string }): Promise<boolean> {
    return unifiedMessaging.sendMessage({
        ...message,
        source: message.source || 'unified-messaging'
    } as UnifiedMessage);
}

export function registerHandler(destination: string, handler: MessageHandler): void {
    unifiedMessaging.registerHandler(destination, handler);
}

export function getWorkerChannel(viewHash: string, workerName: string): OptimizedWorkerChannel | null {
    return unifiedMessaging.getWorkerChannel(viewHash, workerName);
}

export function getBroadcastChannel(channelName: string): BroadcastChannel {
    return unifiedMessaging.getBroadcastChannel(channelName);
}

// Backward compatibility functions
export function sendToWorkCenter(data: any, options?: any): Promise<boolean> {
    return sendMessage({
        type: 'content-share',
        source: 'unified-messaging',
        destination: DESTINATIONS.WORKCENTER,
        data,
        metadata: options
    });
}

export function sendToClipboard(data: any, options?: any): Promise<boolean> {
    return sendMessage({
        type: 'clipboard-copy',
        source: 'unified-messaging',
        destination: DESTINATIONS.CLIPBOARD,
        data,
        metadata: options
    });
}

export function navigateToView(view: string): Promise<boolean> {
    return sendMessage({
      type: 'navigation',
        source: 'unified-messaging',
        destination: 'router',
        data: { view },
        metadata: { priority: 'high' }
    });
}

export function initializeComponent(componentId: string): UnifiedMessage[] {
    // Return any queued messages for this component (sync catch-up).
    // Components register their destination via registerComponent(...).
    const destination = _componentRegistry.get(componentId);
    if (!destination) return [];
    return PendingMessageStore.drain(destination);
}

export function hasPendingMessages(destination: string): boolean {
    return PendingMessageStore.has(destination);
}

/**
 * Explicitly enqueue a message into the sync pending store.
 * Useful when a destination has a handler (so sendMessage would "deliver"),
 * but the real UI component isn't mounted yet and we want catch-up delivery.
 */
export function enqueuePendingMessage(destination: string, message: UnifiedMessage): void {
    const dest = String(destination || '').trim();
    if (!dest) return;
    if (!message) return;
    PendingMessageStore.enqueue(dest, message);
}

export function registerComponent(componentId: string, destination: string): void {
    _componentRegistry.set(componentId, destination);
}

const _componentRegistry = new Map<string, string>();

export function processInitialContent(content: any): Promise<void> {
    const contentType = String(content?.contentType || content?.type || CONTENT_TYPES.OTHER);
    const resolved = resolveAssociationPipeline({
        contentType,
        context: content?.context,
        processingSource: content?.processingSource,
        overrideFactors: content?.overrideFactors || content?.metadata?.overrideFactors
    });

    const payload = content?.content ?? content?.data ?? content;
    const meta = content?.metadata ?? {};

    const source = String(content?.source || meta?.source || 'content-association');
    const tasks = resolved.pipeline.map((dest) => {
        if (dest === "basic-viewer") {
            return sendMessage({
                type: 'content-view',
                source,
                destination: 'basic-viewer',
                contentType: resolved.normalizedContentType,
                data: {
                    content: payload?.text ?? payload?.content ?? payload,
                    text: payload?.text,
                    filename: payload?.filename ?? meta?.filename,
                },
                metadata: {
                    ...meta,
                    overrideFactors: resolved.overrideFactors,
                    context: content?.context,
                    processingSource: content?.processingSource
                }
            });
        }

        if (dest === "basic-explorer") {
            return sendMessage({
                type: 'content-explorer',
                source,
                destination: 'basic-explorer',
                contentType: resolved.normalizedContentType,
                data: {
                    action: 'save',
                    ...payload,
                },
                metadata: {
                    ...meta,
                    overrideFactors: resolved.overrideFactors,
                    context: content?.context,
                    processingSource: content?.processingSource
                }
            });
        }

        // Default: attach into workcenter.
        return sendMessage({
            type: 'content-share',
            source,
            destination: 'basic-workcenter',
            contentType: resolved.normalizedContentType,
            data: payload,
            metadata: {
                ...meta,
                overrideFactors: resolved.overrideFactors,
                context: content?.context,
                processingSource: content?.processingSource
            }
        });
    });

    return Promise.allSettled(tasks).then(() => {});
}

// ============================================================================
// MESSAGE CREATION HELPERS
// ============================================================================

export function createMessageWithOverrides(
    type: string,
    source: string,
    contentType: string,
    data: any,
    overrideFactors: string[] = [],
    processingSource?: string
): UnifiedMessage {
    const resolved = resolveAssociation({
        contentType,
        context: processingSource,
        processingSource,
        overrideFactors
    });

    return {
      id: crypto.randomUUID(),
        type,
      source,
        destination: resolved.destination === "basic-viewer"
            ? 'basic-viewer'
            : resolved.destination === "basic-explorer"
                ? 'basic-explorer'
                : 'basic-workcenter',
      contentType,
        data,
      metadata: {
        timestamp: Date.now(),
            overrideFactors,
            processingSource,
        priority: 'normal'
      }
    };
  }
