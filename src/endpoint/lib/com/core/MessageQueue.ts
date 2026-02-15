/**
 * Message Queue Utility
 * Provides persistent queuing for work center communications using IndexedDB
 * Handles timing issues when work center isn't available yet
 */

interface QueuedMessage {
    id: string;
    type: string;
    data: any;
    timestamp: number;
    priority: 'low' | 'normal' | 'high';
    retryCount: number;
    maxRetries: number;
    expiresAt?: number; // Optional expiration timestamp
    destination?: string; // Destination for routing
    metadata?: any; // Additional metadata
}

interface MessageQueueOptions {
    dbName?: string;
    storeName?: string;
    maxRetries?: number;
    defaultExpirationMs?: number;
}

class MessageQueue {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<IDBDatabase> | null = null;
    private options: Required<MessageQueueOptions>;

    constructor(options: MessageQueueOptions = {}) {
        this.options = {
            dbName: 'CrossWordMessageQueue',
            storeName: 'messages',
            maxRetries: 3,
            defaultExpirationMs: 24 * 60 * 60 * 1000, // 24 hours
            ...options
        };
    }

    /**
     * Initialize IndexedDB database
     */
    private async initDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.options.dbName, 1);

            request.onerror = () => {
                console.warn('[MessageQueue] IndexedDB not available, falling back to sessionStorage');
                reject(new Error('IndexedDB not available'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.options.storeName)) {
                    const store = db.createObjectStore(this.options.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('priority', 'priority', { unique: false });
                }
            };
        });

        try {
            this.db = await this.dbPromise;
            return this.db;
        } catch (error) {
            // Fallback to sessionStorage if IndexedDB fails
            console.warn('[MessageQueue] Using sessionStorage fallback');
            return null as any; // Will use sessionStorage methods
        }
    }

    /**
     * Generate unique message ID
     */
    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Queue a message for later processing
     */
    async queueMessage(
        type: string,
        data: any,
        options: {
            priority?: 'low' | 'normal' | 'high';
            maxRetries?: number;
            expiresAt?: number;
            destination?: string;
            metadata?: any;
        } = {}
    ): Promise<string> {
        const message: QueuedMessage = {
            id: this.generateId(),
            type,
            data,
            timestamp: Date.now(),
            priority: options.priority || 'normal',
            retryCount: 0,
            maxRetries: options.maxRetries || this.options.maxRetries,
            expiresAt: options.expiresAt || (Date.now() + this.options.defaultExpirationMs),
            destination: options.destination,
            metadata: options.metadata
        };

        try {
            const db = await this.initDB();
            if (db) {
                // Use IndexedDB
                const transaction = db.transaction([this.options.storeName], 'readwrite');
                const store = transaction.objectStore(this.options.storeName);
                await new Promise<void>((resolve, reject) => {
                    const request = store.add(message);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            } else {
                // Fallback to sessionStorage
                const queueKey = 'workcenter_message_queue';
                const existing = this.getSessionStorageQueue();
                existing.push(message);
                sessionStorage.setItem(queueKey, JSON.stringify(existing));
            }

            console.log(`[MessageQueue] Queued message: ${type}`, message.id);
            return message.id;
        } catch (error) {
            console.error('[MessageQueue] Failed to queue message:', error);
            throw error;
        }
    }

    /**
     * Get all queued messages
     */
    async getQueuedMessages(): Promise<QueuedMessage[]> {
        try {
            const db = await this.initDB();
            if (db) {
                // Use IndexedDB
                const transaction = db.transaction([this.options.storeName], 'readonly');
                const store = transaction.objectStore(this.options.storeName);
                return new Promise<QueuedMessage[]>((resolve, reject) => {
                    const request = store.getAll();
                    request.onsuccess = () => {
                        const messages = request.result as QueuedMessage[];
                        // Filter out expired messages
                        const now = Date.now();
                        const validMessages = messages.filter(msg =>
                            !msg.expiresAt || msg.expiresAt > now
                        );
                        resolve(validMessages);
                    };
                    request.onerror = () => reject(request.error);
                });
            } else {
                // Fallback to sessionStorage
                return this.getSessionStorageQueue();
            }
        } catch (error) {
            console.error('[MessageQueue] Failed to get queued messages:', error);
            return this.getSessionStorageQueue();
        }
    }

    /**
     * Remove a message from the queue
     */
    async removeMessage(messageId: string): Promise<void> {
        try {
            const db = await this.initDB();
            if (db) {
                // Use IndexedDB
                const transaction = db.transaction([this.options.storeName], 'readwrite');
                const store = transaction.objectStore(this.options.storeName);
                await new Promise<void>((resolve, reject) => {
                    const request = store.delete(messageId);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            } else {
                // Fallback to sessionStorage
                const existing = this.getSessionStorageQueue();
                const filtered = existing.filter(msg => msg.id !== messageId);
                sessionStorage.setItem('workcenter_message_queue', JSON.stringify(filtered));
            }
        } catch (error) {
            console.error('[MessageQueue] Failed to remove message:', error);
        }
    }

    /**
     * Update message retry count
     */
    async updateMessageRetry(messageId: string, retryCount: number): Promise<void> {
        try {
            const db = await this.initDB();
            if (db) {
                // Use IndexedDB
                const transaction = db.transaction([this.options.storeName], 'readwrite');
                const store = transaction.objectStore(this.options.storeName);

                const message = await new Promise<QueuedMessage>((resolve, reject) => {
                    const request = store.get(messageId);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                if (message) {
                    message.retryCount = retryCount;
                    await new Promise<void>((resolve, reject) => {
                        const request = store.put(message);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            } else {
                // Fallback to sessionStorage
                const existing = this.getSessionStorageQueue();
                const message = existing.find(msg => msg.id === messageId);
                if (message) {
                    message.retryCount = retryCount;
                    sessionStorage.setItem('workcenter_message_queue', JSON.stringify(existing));
                }
            }
        } catch (error) {
            console.error('[MessageQueue] Failed to update message retry:', error);
        }
    }

    /**
     * Clear all expired messages
     */
    async clearExpiredMessages(): Promise<void> {
        try {
            const messages = await this.getQueuedMessages();
            const expiredIds = messages
                .filter(msg => msg.expiresAt && msg.expiresAt <= Date.now())
                .map(msg => msg.id);

            for (const id of expiredIds) {
                await this.removeMessage(id);
            }

            if (expiredIds.length > 0) {
                console.log(`[MessageQueue] Cleared ${expiredIds.length} expired messages`);
            }
        } catch (error) {
            console.error('[MessageQueue] Failed to clear expired messages:', error);
        }
    }

    /**
     * Get queue from sessionStorage (fallback)
     */
    private getSessionStorageQueue(): QueuedMessage[] {
        try {
            const stored = sessionStorage.getItem('workcenter_message_queue');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[MessageQueue] Failed to read sessionStorage queue:', error);
            return [];
        }
    }

    /**
     * Check if IndexedDB is available
     */
    static isIndexedDBAvailable(): boolean {
        try {
            return typeof indexedDB !== 'undefined' &&
                   typeof IDBTransaction !== 'undefined' &&
                   typeof IDBKeyRange !== 'undefined';
        } catch {
            return false;
        }
    }
}

// Singleton instance
let messageQueueInstance: MessageQueue | null = null;

export function getMessageQueue(): MessageQueue {
    if (!messageQueueInstance) {
        messageQueueInstance = new MessageQueue();
    }
    return messageQueueInstance;
}

export { MessageQueue };
export type { QueuedMessage, MessageQueueOptions };
