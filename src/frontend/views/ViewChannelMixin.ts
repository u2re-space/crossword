/**
 * View Channel Mixin
 * 
 * Provides uniform channel connectivity for views.
 * Views can use this mixin to:
 * - Connect to service worker channels
 * - Send/receive messages through broadcast channels
 * - Handle share target and launch queue data
 */

import type { View, ViewLifecycle, ViewOptions, ShellContext } from "../shells/types";
import { 
    serviceChannels, 
    subscribeToChannel,
    sendToChannel,
    type ServiceChannelId,
    type ChannelMessage 
} from "@rs-com/core/ServiceChannels";
import { BROADCAST_CHANNELS, MESSAGE_TYPES } from "@rs-com/config/Names";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Message handler function type
 */
export type ViewMessageHandler<T = unknown> = (message: ChannelMessage<T>) => void | Promise<void>;

/**
 * Channel-connected view interface
 */
export interface ChannelConnectedView extends View {
    /** Channel ID for this view */
    channelId: ServiceChannelId;
    /** Connect to the service channel */
    connectChannel(): Promise<void>;
    /** Disconnect from the service channel */
    disconnectChannel(): void;
    /** Send a message through the channel */
    sendMessage<T>(type: string, data: T): Promise<void>;
    /** Check if connected */
    isChannelConnected(): boolean;
}

/**
 * Options for channel-connected views
 */
export interface ChannelViewOptions extends ViewOptions {
    /** Channel ID to connect to */
    channelId?: ServiceChannelId;
    /** Auto-connect on mount */
    autoConnect?: boolean;
    /** Message handlers */
    messageHandlers?: Map<string, ViewMessageHandler>;
}

// ============================================================================
// VIEW CHANNEL MIXIN
// ============================================================================

/**
 * Creates a channel-connected view by mixing channel functionality into an existing view.
 * 
 * Usage:
 * ```ts
 * class MyView implements View { ... }
 * const ConnectedView = withViewChannel(MyView, "workcenter");
 * ```
 */
export function withViewChannel<T extends new (...args: any[]) => View>(
    ViewClass: T,
    defaultChannelId: ServiceChannelId
) {
    return class extends ViewClass implements ChannelConnectedView {
        channelId: ServiceChannelId = defaultChannelId;
        private _channelUnsubscribe: (() => void) | null = null;
        private _channelConnected = false;
        private _messageHandlers = new Map<string, Set<ViewMessageHandler>>();

        constructor(...args: any[]) {
            super(...args);
            
            // Extract channel options if provided
            const options = args[0] as ChannelViewOptions | undefined;
            if (options?.channelId) {
                this.channelId = options.channelId;
            }
        }

        async connectChannel(): Promise<void> {
            if (this._channelConnected) return;

            console.log(`[ViewChannel] Connecting ${this.id} to channel ${this.channelId}`);

            // Initialize the service channel
            await serviceChannels.initChannel(this.channelId);

            // Subscribe to messages
            this._channelUnsubscribe = subscribeToChannel(
                this.channelId,
                (message) => this._handleChannelMessage(message)
            );

            this._channelConnected = true;
            console.log(`[ViewChannel] ${this.id} connected to ${this.channelId}`);
        }

        disconnectChannel(): void {
            if (this._channelUnsubscribe) {
                this._channelUnsubscribe();
                this._channelUnsubscribe = null;
            }
            this._channelConnected = false;
            console.log(`[ViewChannel] ${this.id} disconnected from ${this.channelId}`);
        }

        async sendMessage<D>(type: string, data: D): Promise<void> {
            if (!this._channelConnected) {
                await this.connectChannel();
            }
            await sendToChannel(this.channelId, type, data);
        }

        isChannelConnected(): boolean {
            return this._channelConnected;
        }

        /**
         * Register a message handler
         */
        onChannelMessage(type: string, handler: ViewMessageHandler): () => void {
            if (!this._messageHandlers.has(type)) {
                this._messageHandlers.set(type, new Set());
            }
            this._messageHandlers.get(type)!.add(handler);

            return () => {
                this._messageHandlers.get(type)?.delete(handler);
            };
        }

        /**
         * Handle incoming channel message
         */
        private _handleChannelMessage(message: ChannelMessage): void {
            // Call type-specific handlers
            const handlers = this._messageHandlers.get(message.type);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error(`[ViewChannel] Handler error:`, error);
                    }
                }
            }

            // Call the view's handleMessage if it exists
            if (typeof (this as any).handleMessage === "function") {
                (this as any).handleMessage(message).catch(console.error);
            }
        }

        // Override lifecycle to connect/disconnect channel
        get lifecycle(): ViewLifecycle {
            const parentLifecycle = super.lifecycle || {};
            
            return {
                ...parentLifecycle,
                onMount: async () => {
                    await this.connectChannel();
                    if (parentLifecycle.onMount) {
                        await parentLifecycle.onMount();
                    }
                },
                onUnmount: async () => {
                    this.disconnectChannel();
                    if (parentLifecycle.onUnmount) {
                        await parentLifecycle.onUnmount();
                    }
                }
            };
        }
    };
}

// ============================================================================
// SHARE TARGET HANDLER MIXIN
// ============================================================================

/**
 * Share target handler interface
 */
export interface ShareTargetHandler {
    /** Handle incoming share target data */
    handleShareTarget(data: ShareTargetData): Promise<void>;
    /** Check if view can handle share target */
    canHandleShareTarget(data: ShareTargetData): boolean;
}

/**
 * Share target data structure
 */
export interface ShareTargetData {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
    timestamp: number;
    source: "share-target" | "launch-queue" | "clipboard";
}

/**
 * Mixin for views that can handle share targets
 */
export function withShareTargetHandler<T extends new (...args: any[]) => View>(
    ViewClass: T
) {
    return class extends ViewClass implements ShareTargetHandler {
        private _shareTargetChannel: BroadcastChannel | null = null;

        constructor(...args: any[]) {
            super(...args);
        }

        async handleShareTarget(data: ShareTargetData): Promise<void> {
            console.log(`[ShareTarget] ${this.id} received:`, data);
            
            // Default implementation - override in subclass
            if (typeof (this as any).handleMessage === "function") {
                await (this as any).handleMessage({
                    type: MESSAGE_TYPES.SHARE_TARGET_INPUT,
                    data
                });
            }
        }

        canHandleShareTarget(data: ShareTargetData): boolean {
            // Default: can handle if view has handleMessage method
            return typeof (this as any).handleMessage === "function";
        }

        /**
         * Start listening for share target broadcasts
         */
        protected startShareTargetListener(): void {
            if (this._shareTargetChannel) return;

            this._shareTargetChannel = new BroadcastChannel(BROADCAST_CHANNELS.SHARE_TARGET);
            this._shareTargetChannel.onmessage = async (event) => {
                const { type, data } = event.data || {};
                
                if (type === MESSAGE_TYPES.SHARE_RECEIVED && this.canHandleShareTarget(data)) {
                    await this.handleShareTarget(data);
                }
            };
        }

        /**
         * Stop listening for share target broadcasts
         */
        protected stopShareTargetListener(): void {
            if (this._shareTargetChannel) {
                this._shareTargetChannel.close();
                this._shareTargetChannel = null;
            }
        }

        // Override lifecycle
        get lifecycle(): ViewLifecycle {
            const parentLifecycle = super.lifecycle || {};
            
            return {
                ...parentLifecycle,
                onMount: async () => {
                    this.startShareTargetListener();
                    if (parentLifecycle.onMount) {
                        await parentLifecycle.onMount();
                    }
                },
                onUnmount: async () => {
                    this.stopShareTargetListener();
                    if (parentLifecycle.onUnmount) {
                        await parentLifecycle.onUnmount();
                    }
                }
            };
        }
    };
}

// ============================================================================
// COMBINED MIXINS
// ============================================================================

/**
 * Creates a fully connected view with channel and share target support
 */
export function withFullChannelSupport<T extends new (...args: any[]) => View>(
    ViewClass: T,
    channelId: ServiceChannelId
) {
    return withShareTargetHandler(withViewChannel(ViewClass, channelId));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check for pending share target data and deliver to view
 */
export async function checkAndDeliverShareData(
    view: View & Partial<ShareTargetHandler>
): Promise<boolean> {
    if (!view.handleShareTarget || !view.canHandleShareTarget) {
        return false;
    }

    try {
        // Check for cached content from SW
        const response = await fetch("/sw-content/available");
        const { cacheKeys } = await response.json();
        
        if (cacheKeys && cacheKeys.length > 0) {
            const latest = cacheKeys[cacheKeys.length - 1];
            if (latest.context === "share-target") {
                // Fetch the cached content
                const contentResponse = await fetch(`/sw-content/${latest.key}`);
                const { content } = await contentResponse.json();
                
                const shareData: ShareTargetData = {
                    ...content,
                    timestamp: Date.now(),
                    source: "share-target"
                };

                if (view.canHandleShareTarget(shareData)) {
                    await view.handleShareTarget(shareData);
                    return true;
                }
            }
        }
    } catch (error) {
        console.warn("[ViewChannel] Failed to check share data:", error);
    }

    return false;
}

/**
 * Check URL params for cached content
 */
export function getContentFromUrlParams(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("cached") || params.get("markdown-content");
}
