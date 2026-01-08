/**
 * App Communication Utility
 * Handles broadcasting to different app components with queuing fallback
 */

import { getMessageQueue } from './MessageQueue';
import { BROADCAST_CHANNELS } from '@rs-core/config/Names';

export interface AppMessage {
    type: string;
    data: any;
    metadata?: any;
}

export interface AppCommunicatorOptions {
    channelName: string;
    availabilityCheckInterval?: number;
    retryInterval?: number;
    pingTimeout?: number;
}

class AppCommunicator {
    private channel: BroadcastChannel | null = null;
    private messageQueue = getMessageQueue();
    private isTargetAvailable = false;
    private availabilityCheckInterval: number | null = null;
    private retryInterval: number | null = null;
    private options: Required<AppCommunicatorOptions>;

    constructor(options: AppCommunicatorOptions) {
        this.options = {
            channelName: 'rs-app-general',
            availabilityCheckInterval: 2000,
            retryInterval: 30000,
            pingTimeout: 500,
            ...options
        };

        this.initChannel();
        this.startAvailabilityCheck();
        this.startRetryMechanism();
    }

    private initChannel(): void {
        try {
            this.channel = new BroadcastChannel(this.options.channelName);
        } catch (error) {
            console.warn(`[AppCommunicator:${this.options.channelName}] BroadcastChannel not available:`, error);
        }
    }

    private startAvailabilityCheck(): void {
        // Check at configured interval if target becomes available
        this.availabilityCheckInterval = window.setInterval(() => {
            this.checkTargetAvailability();
        }, this.options.availabilityCheckInterval);

        // Initial check
        this.checkTargetAvailability();
    }

    private startRetryMechanism(): void {
        // Retry failed messages every 30 seconds
        this.retryInterval = window.setInterval(() => {
            this.retryFailedMessages();
        }, 30000);

        // Initial retry check
        this.retryFailedMessages();
    }

    private async retryFailedMessages(): Promise<void> {
        try {
            const queuedMessages = await this.messageQueue.getQueuedMessages();
            const failedMessages = queuedMessages.filter(msg =>
                msg.retryCount > 0 && msg.retryCount < msg.maxRetries
            );

            if (failedMessages.length === 0) return;

            console.log(`[AppCommunicator:${this.options.channelName}] Retrying ${failedMessages.length} failed messages`);

            for (const message of failedMessages) {
                if (this.isTargetAvailable) {
                    try {
                        if (this.channel) {
                            this.channel.postMessage({
                                type: message.type,
                                data: message.data,
                                timestamp: message.timestamp,
                                retry: true,
                                originalId: message.id
                            });

                            // Reset retry count on successful send
                            await this.messageQueue.updateMessageRetry(message.id, 0);
                            await this.messageQueue.removeMessage(message.id);
                            console.log(`[AppCommunicator:${this.options.channelName}] Successfully retried message: ${message.type} (${message.id})`);
                        }
                    } catch (error) {
                        console.error(`[AppCommunicator:${this.options.channelName}] Retry failed for message ${message.id}:`, error);
                        // Increment retry count
                        await this.messageQueue.updateMessageRetry(message.id, message.retryCount + 1);
                    }
                }
            }
        } catch (error) {
            console.error(`[AppCommunicator:${this.options.channelName}] Failed to retry messages:`, error);
        }
    }

    private async checkTargetAvailability(): Promise<void> {
        if (!this.channel) return;

        try {
            // Send a ping message to check if target is listening
            const pingId = `ping_${Date.now()}_${this.options.channelName}`;
            let responded = false;

            const handlePong = (event: MessageEvent) => {
                if (event.data?.type === 'pong' && event.data?.pingId === pingId) {
                    responded = true;
                    this.channel?.removeEventListener('message', handlePong);
                    this.setTargetAvailable(true);
                }
            };

            this.channel.addEventListener('message', handlePong);

            // Send ping
            this.channel.postMessage({
                type: 'ping',
                pingId,
                timestamp: Date.now()
            });

            // Wait for response
            setTimeout(() => {
                this.channel?.removeEventListener('message', handlePong);
                if (!responded) {
                    this.setTargetAvailable(false);
                }
            }, this.options.pingTimeout);

        } catch (error) {
            console.warn(`[AppCommunicator:${this.options.channelName}] Availability check failed:`, error);
        }
    }

    private setTargetAvailable(available: boolean): void {
        const wasAvailable = this.isTargetAvailable;
        this.isTargetAvailable = available;

        if (available && !wasAvailable) {
            console.log(`[AppCommunicator:${this.options.channelName}] Target became available, processing queued messages`);
            this.processQueuedMessages();
        } else if (!available && wasAvailable) {
            console.log(`[AppCommunicator:${this.options.channelName}] Target became unavailable`);
        }
    }

    /**
     * Send message to work center, queue if not available
     */
    async sendMessage(
        type: string,
        data: any,
        options: {
            priority?: 'low' | 'normal' | 'high';
            queueIfUnavailable?: boolean;
            maxRetries?: number;
        } = {}
    ): Promise<boolean> {
        const { priority = 'normal', queueIfUnavailable = true, maxRetries } = options;

        try {
            if (this.isTargetAvailable && this.channel) {
                // Try to send directly
                this.channel.postMessage({
                    type,
                    data,
                    timestamp: Date.now(),
                    ...options
                });
                console.log(`[AppCommunicator:${this.options.channelName}] Sent message directly: ${type}`);
                return true;
            } else if (queueIfUnavailable) {
                // Queue for later
                    await this.messageQueue.queueMessage(type, data, {
                        priority,
                        maxRetries: maxRetries || 3
                    });
                    console.log(`[AppCommunicator:${this.options.channelName}] Queued message: ${type}`);
                    return true;
            } else {
                console.warn(`[AppCommunicator:${this.options.channelName}] Target not available and queuing disabled: ${type}`);
                return false;
            }
        } catch (error) {
            console.error(`[AppCommunicator:${this.options.channelName}] Failed to send message ${type}:`, error);
            if (queueIfUnavailable) {
                try {
                    await this.messageQueue.queueMessage(type, data, {
                        priority,
                        maxRetries: maxRetries || 3
                    });
                    console.log(`[AppCommunicator:${this.options.channelName}] Queued message after send failure: ${type}`);
                    return true;
                } catch (queueError) {
                    console.error(`[AppCommunicator:${this.options.channelName}] Failed to queue message ${type}:`, queueError);
                }
            }
            return false;
        }
    }

    /**
     * Process all queued messages
     */
    private async processQueuedMessages(): Promise<void> {
        try {
            const queuedMessages = await this.messageQueue.getQueuedMessages();

            if (queuedMessages.length === 0) {
                return;
            }

            console.log(`[AppCommunicator:${this.options.channelName}] Processing ${queuedMessages.length} queued messages`);

            // Sort by priority and timestamp
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            queuedMessages.sort((a, b) => {
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
            });

            // Process messages in batches to avoid overwhelming the target
            const batchSize = 5;
            for (let i = 0; i < queuedMessages.length; i += batchSize) {
                const batch = queuedMessages.slice(i, i + batchSize);

                for (const message of batch) {
                    try {
                        if (this.channel && this.isTargetAvailable) {
                            this.channel.postMessage({
                                type: message.type,
                                data: message.data,
                                timestamp: message.timestamp,
                                queued: true,
                                originalId: message.id
                            });

                            // Remove from queue after successful send
                            await this.messageQueue.removeMessage(message.id);
                            console.log(`[AppCommunicator:${this.options.channelName}] Processed queued message: ${message.type} (${message.id})`);
                        } else {
                            // Target became unavailable during processing
                            console.warn(`[AppCommunicator:${this.options.channelName}] Target unavailable during processing of ${message.id}`);
                            break;
                        }
                    } catch (error) {
                        console.error(`[AppCommunicator:${this.options.channelName}] Failed to process queued message ${message.id}:`, error);

                        // Increment retry count
                        message.retryCount++;
                        if (message.retryCount < message.maxRetries) {
                            await this.messageQueue.updateMessageRetry(message.id, message.retryCount);
                            console.log(`[AppCommunicator:${this.options.channelName}] Will retry message ${message.id} (${message.retryCount}/${message.maxRetries})`);
                        } else {
                            console.warn(`[AppCommunicator:${this.options.channelName}] Giving up on message ${message.id} after ${message.maxRetries} retries`);
                            await this.messageQueue.removeMessage(message.id);
                        }
                    }
                }

                // Small delay between batches
                if (i + batchSize < queuedMessages.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Clean up expired messages
            await this.messageQueue.clearExpiredMessages();

        } catch (error) {
            console.error('[WorkCenterComm] Failed to process queued messages:', error);
        }
    }

    /**
     * Respond to ping messages (called by work center)
     */
    respondToPing(pingId: string): void {
        if (this.channel) {
            this.channel.postMessage({
                type: 'pong',
                pingId,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.availabilityCheckInterval) {
            clearInterval(this.availabilityCheckInterval);
            this.availabilityCheckInterval = null;
        }

        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }

        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
    }
}

// Predefined channel configurations for common app components
export const APP_CHANNELS = {
    WORK_CENTER: BROADCAST_CHANNELS.WORK_CENTER,
    MARKDOWN_VIEWER: BROADCAST_CHANNELS.MARKDOWN_VIEWER,
    SETTINGS: BROADCAST_CHANNELS.SETTINGS,
    GENERAL: BROADCAST_CHANNELS.GENERAL
} as const;

// Singleton instances for different channels
const communicators = new Map<string, AppCommunicator>();

export function getAppCommunicator(channelName: string = APP_CHANNELS.GENERAL, options?: Partial<AppCommunicatorOptions>): AppCommunicator {
    const key = channelName;
    if (!communicators.has(key)) {
        communicators.set(key, new AppCommunicator({
            channelName,
            ...options
        }));
    }
    return communicators.get(key)!;
}

// Backward compatibility - work center specific communicator
export function getWorkCenterComm(): AppCommunicator {
    return getAppCommunicator(APP_CHANNELS.WORK_CENTER);
}

// Convenience functions for common channels
export function getMarkdownViewerComm(): AppCommunicator {
    return getAppCommunicator(APP_CHANNELS.MARKDOWN_VIEWER, {
        availabilityCheckInterval: 3000, // Check more frequently for UI components
        retryInterval: 15000 // Retry more frequently
    });
}

export function getSettingsComm(): AppCommunicator {
    return getAppCommunicator(APP_CHANNELS.SETTINGS, {
        availabilityCheckInterval: 5000, // Less frequent for settings
        retryInterval: 60000 // Longer retry interval
    });
}

export { AppCommunicator };