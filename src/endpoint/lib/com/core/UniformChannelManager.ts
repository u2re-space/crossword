/**
 * Uniform Channel Manager for the CrossWord app
 * Manages worker channels with view-specific initialization and queuing
 */

import {
    createQueuedOptimizedWorkerChannel,
    OptimizedWorkerChannel,
    detectExecutionContext,
    supportsDedicatedWorkers
} from 'fest/uniform';
import { BROADCAST_CHANNELS, ROUTE_HASHES, COMPONENTS } from '@rs-com/config/Names';
import { globalChannelRegistry, globalChannelHealthMonitor, createDeferred } from 'fest/core';

export interface ViewChannelConfig {
    viewHash: string;
    workerConfigs: WorkerConfig[];
    autoStart?: boolean;
}

export interface WorkerConfig {
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

export class UniformChannelManager {
    private static instance: UniformChannelManager;
    private channels = new Map<string, OptimizedWorkerChannel>();
    private viewChannels = new Map<string, Set<string>>();
    private initializedViews = new Set<string>();
    private viewReadyPromises = new Map<string, ReturnType<typeof createDeferred>>();
    private executionContext: 'main' | 'service-worker' | 'chrome-extension' | 'unknown';

    constructor() {
        this.executionContext = detectExecutionContext();
    }

    static getInstance(): UniformChannelManager {
        if (!UniformChannelManager.instance) {
            UniformChannelManager.instance = new UniformChannelManager();
        }
        return UniformChannelManager.instance;
    }

    /**
     * Register channels for a specific view
     */
    registerViewChannels(viewHash: string, configs: WorkerConfig[]): void {
        const channelNames = new Set<string>();

        for (const config of configs) {
            // Skip workers that are not supported in current context
            if (!this.isWorkerSupported(config)) {
                console.log(`[UniformChannelManager] Skipping worker '${config.name}' in ${this.executionContext} context`);
                continue;
            }

            // Create queued channel for this worker
            const channel = createQueuedOptimizedWorkerChannel({
                name: config.name,
                script: config.script,
                options: config.options,
                context: this.executionContext
            }, config.protocolOptions, (workerChannel) => {
                console.log(`[UniformChannelManager] Channel '${config.name}' ready for view '${viewHash}' in ${this.executionContext} context`);
            });

            this.channels.set(`${viewHash}:${config.name}`, channel);
            channelNames.add(config.name);
        }

        this.viewChannels.set(viewHash, channelNames);
    }

    /**
     * Check if a worker configuration is supported in the current execution context
     */
    private isWorkerSupported(config: WorkerConfig): boolean {
        // In service worker context, we can only use service worker compatible channels
        if (this.executionContext === 'service-worker') {
            // Service workers can handle their own operations and communicate via BroadcastChannel
            return true; // We'll handle the specifics in the channel creation
        }

        // In chrome extension context, check if dedicated workers are available
        if (this.executionContext === 'chrome-extension') {
            return supportsDedicatedWorkers();
        }

        // In main thread context, dedicated workers are generally available
        return true;
    }

    /**
     * Initialize channels when a view becomes active
     */
    async initializeViewChannels(viewHash: string): Promise<void> {
        if (this.initializedViews.has(viewHash)) return;

        // Create deferred promise for view readiness
        const deferred = createDeferred<void>();
        this.viewReadyPromises.set(viewHash, deferred);

        console.log(`[UniformChannelManager] Initializing channels for view: ${viewHash}`);

        const channelNames = this.viewChannels.get(viewHash);
        if (!channelNames) {
            deferred.resolve();
            return;
        }

        // Initialize all channels for this view
        const initPromises: Promise<void>[] = [];

        for (const channelName of channelNames) {
            const channelKey = `${viewHash}:${channelName}`;
            const channel = this.channels.get(channelKey);

            if (channel) {
                // Register channel in global registry
                globalChannelRegistry.register(channelKey, channel);

                // Register health check
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
                    30000 // Check every 30 seconds
                );

                // The channel will start connecting when first used
                // We can optionally trigger a ping to start the connection
                initPromises.push(
                    channel.request('ping', {}).catch(() => {
                        // Ping might fail if worker doesn't have ping handler, that's ok
                        console.log(`[UniformChannelManager] Channel '${channelName}' queued for view '${viewHash}'`);
                    })
                );
            }
        }

        // Wait for all channels to be ready (or queued)
        await Promise.allSettled(initPromises);
        this.initializedViews.add(viewHash);
        deferred.resolve();
    }

    /**
     * Get a channel for a specific view and worker
     */
    getChannel(viewHash: string, workerName: string): OptimizedWorkerChannel | null {
        return this.channels.get(`${viewHash}:${workerName}`) || null;
    }

    /**
     * Get all channels for a view
     */
    getViewChannels(viewHash: string): OptimizedWorkerChannel[] {
        const channelNames = this.viewChannels.get(viewHash);
        if (!channelNames) return [];

        return Array.from(channelNames)
            .map(name => this.channels.get(`${viewHash}:${name}`))
            .filter((channel): channel is OptimizedWorkerChannel => channel !== null);
    }

    /**
     * Close all channels for a view
     */
    closeViewChannels(viewHash: string): void {
        const channels = this.getViewChannels(viewHash);
        for (const channel of channels) {
            channel.close();
        }

        // Remove from maps
        const channelNames = this.viewChannels.get(viewHash);
        if (channelNames) {
            for (const name of channelNames) {
                this.channels.delete(`${viewHash}:${name}`);
            }
        }

        this.viewChannels.delete(viewHash);
        this.initializedViews.delete(viewHash);
    }

    /**
     * Wait for a view's channels to be ready
     */
    async waitForViewChannels(viewHash: string): Promise<void> {
        const deferred = this.viewReadyPromises.get(viewHash);
        if (deferred) {
            await deferred.promise;
        } else if (!this.initializedViews.has(viewHash)) {
            await this.initializeViewChannels(viewHash);
        }
    }

    /**
     * Check if a view's channels are ready
     */
    isViewReady(viewHash: string): boolean {
        return this.initializedViews.has(viewHash);
    }

    /**
     * Get channel status for debugging
     */
    getStatus() {
        const status: Record<string, any> = {};
        const healthStatuses = globalChannelHealthMonitor.getAllHealthStatuses();

        for (const [key, channel] of this.channels) {
            status[key] = {
                queueStatus: (channel as any).getQueueStatus?.() || 'unknown',
                healthy: healthStatuses[key] ?? 'unknown'
            };
        }

        return {
            totalChannels: this.channels.size,
            initializedViews: Array.from(this.initializedViews),
            registryChannels: globalChannelRegistry.getChannelNames(),
            healthStatuses,
            channels: status
        };
    }
}

// Pre-configured view channel registrations
export const initializeAppChannels = (): void => {
    const manager = UniformChannelManager.getInstance();

    // Note: OPFS worker is handled by the OPFS.ts module directly
    // We don't need to register it here as it's managed by the OPFS ensureWorker() function
    // The UniformChannelManager is for view-specific worker management beyond the core OPFS functionality

    // Register additional workers for other views as needed
    // Example: AI worker for editor views (commented out until AIWorker is created)
    /*
    manager.registerViewChannels(ROUTE_HASHES.EDITOR, [
        {
            name: 'ai-worker',
            script: './AIWorker.uniform.worker.ts', // Would need proper worker file
            protocolOptions: {
                timeout: 30000,
                retries: 3,
                batching: false, // AI operations might need immediate responses
                compression: true
            }
        }
    ]);
    */
};

// Export singleton instance
export const channelManager = UniformChannelManager.getInstance();
