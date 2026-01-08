/**
 * App Communication Utility - DEPRECATED
 * This file is now deprecated in favor of the unified messaging system.
 * Use UnifiedMessaging instead for all new code.
 *
 * @deprecated Use UnifiedMessaging from './UnifiedMessaging' instead
 */

import { unifiedMessaging } from './UnifiedMessaging';

// Define interfaces locally since the exports are having runtime issues
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
import { BROADCAST_CHANNELS } from '@rs-com/config/Names';

// Legacy interface for backward compatibility
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

/**
 * @deprecated Use UnifiedMessaging instead
 */
class AppCommunicator {
    private channelName: string;
    private destination: string;

    constructor(options: AppCommunicatorOptions) {
        this.channelName = options.channelName;
        // Map broadcast channel names to unified messaging destinations
        this.destination = this.mapChannelToDestination(options.channelName);
    }

    private mapChannelToDestination(channelName: string): string {
        const mapping: Record<string, string> = {
            [BROADCAST_CHANNELS.WORK_CENTER]: 'workcenter',
            [BROADCAST_CHANNELS.MARKDOWN_VIEWER]: 'markdown-viewer',
            [BROADCAST_CHANNELS.SETTINGS]: 'settings',
            [BROADCAST_CHANNELS.CLIPBOARD]: 'clipboard',
            [BROADCAST_CHANNELS.PRINT_VIEWER]: 'print-viewer'
        };
        return mapping[channelName] || 'general';
    }

    /**
     * @deprecated Use unifiedMessaging.sendMessage() instead
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
        console.warn('[AppCommunicator] Deprecated: Use unifiedMessaging.sendMessage() instead');

        const message: Omit<UnifiedMessage, 'id'> = {
            type,
            source: 'legacy-app-communicator',
            destination: this.destination,
            data,
            metadata: {
                priority: options.priority || 'normal',
                maxRetries: options.maxRetries || 3,
                legacy: true
            }
        };

        return unifiedMessaging.sendMessage(message);
    }

    /**
     * @deprecated Use unifiedMessaging.registerHandler() instead
     */
    respondToPing(pingId: string): void {
        console.warn('[AppCommunicator] Deprecated: Ping/pong handled automatically by unified messaging');

        // Send pong message through unified messaging
        unifiedMessaging.sendMessage({
            type: 'pong',
            source: this.destination,
            destination: 'ping-requester',
            data: { pingId },
            metadata: { legacy: true }
        });
    }

    /**
     * @deprecated Cleanup handled automatically by unified messaging
     */
    destroy(): void {
        console.warn('[AppCommunicator] Deprecated: Cleanup handled automatically by unified messaging');
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

/**
 * @deprecated Use unifiedMessaging directly instead
 */
export function getAppCommunicator(channelName: string = APP_CHANNELS.GENERAL, options?: Partial<AppCommunicatorOptions>): AppCommunicator {
    console.warn('[getAppCommunicator] Deprecated: Use unifiedMessaging directly instead');

    const key = channelName;
    if (!communicators.has(key)) {
        communicators.set(key, new AppCommunicator({
            channelName,
            ...options
        }));
    }
    return communicators.get(key)!;
}

/**
 * @deprecated Use unifiedMessaging.sendMessage() with destination 'workcenter' instead
 */
export function getWorkCenterComm(): AppCommunicator {
    console.warn('[getWorkCenterComm] Deprecated: Use unifiedMessaging.sendMessage() with destination "workcenter" instead');
    return getAppCommunicator(APP_CHANNELS.WORK_CENTER);
}

/**
 * @deprecated Use unifiedMessaging for markdown viewer messaging instead
 */
export function getMarkdownViewerComm(): AppCommunicator {
    console.warn('[getMarkdownViewerComm] Deprecated: Use unifiedMessaging for markdown viewer messaging instead');
    return getAppCommunicator(APP_CHANNELS.MARKDOWN_VIEWER, {
        availabilityCheckInterval: 3000,
        retryInterval: 15000
    });
}

/**
 * @deprecated Use unifiedMessaging for settings messaging instead
 */
export function getSettingsComm(): AppCommunicator {
    console.warn('[getSettingsComm] Deprecated: Use unifiedMessaging for settings messaging instead');
    return getAppCommunicator(APP_CHANNELS.SETTINGS, {
        availabilityCheckInterval: 5000,
        retryInterval: 60000
    });
}

export { AppCommunicator };

// Export unified messaging functions for easy migration
export { unifiedMessaging };
// UnifiedMessage and MessageHandler are now defined locally