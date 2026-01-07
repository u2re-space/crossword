/**
 * Unified Messaging System for CrossWord
 *
 * Provides a centralized, routable messaging system for communication between:
 * - PWA Service Worker
 * - Main Application
 * - WorkCenter Module
 * - Other app variants (CRX, etc.)
 * - Content processing pipeline
 *
 * Features:
 * - Message routing with destinations
 * - Content type associations
 * - Share target processing
 * - Launch queue handling
 * - CRX integration
 */

import { CHANNELS } from '../routing/sw-handling';

// Additional custom channels for unified messaging
const CUSTOM_CHANNELS = {
    BASIC_APP: 'basic-app',
    MAIN_APP: 'main-app',
    FILE_EXPLORER: 'file-explorer',
    PRINT_VIEWER: 'print-viewer'
} as const;

// Message types
export type MessageType =
  | 'content-share'
  | 'content-process'
  | 'content-result'
  | 'content-accept'
  | 'navigation'
  | 'settings-update'
  | 'clipboard-write'
  | 'file-open'
  | 'module-command';

// Content types
export type ContentType =
  | 'file'
  | 'blob'
  | 'text'
  | 'markdown'
  | 'image'
  | 'url'
  | 'base64';

// Destinations (inbox/mailbox concept)
export type Destination =
  | 'workcenter'
  | 'markdown-viewer'
  | 'markdown-editor'
  | 'rich-editor'
  | 'file-explorer'
  | 'settings'
  | 'history'
  | 'clipboard'
  | 'print'
  | 'basic-viewer'
  | 'basic-workcenter'
  | 'basic-explorer'
  | 'external';

// Source identifiers
export type MessageSource =
  | 'pwa'
  | 'service-worker'
  | 'main-app'
  | 'workcenter'
  | 'crx-background'
  | 'crx-content'
  | 'launch-queue'
  | 'share-target'
  | 'paste'
  | 'drop'
  | 'manual';

// Processing actions
export type ProcessingAction =
  | 'instantly'
  | 'manually'
  | 'background'
  | 'deferred';

// Result actions
export type ResultAction =
  | 'write-clipboard'
  | 'attach-to-associated'
  | 'open-associated-view'
  | 'download-file'
  | 'show-notification'
  | 'none';

// Content association map
export const CONTENT_ASSOCIATIONS: Record<ContentType, Destination> = {
  'file': 'file-explorer', // Will be processed based on file type
  'blob': 'basic-workcenter', // Attach as file input/attachment
  'text': 'basic-viewer', // Place/render in viewer
  'markdown': 'basic-viewer', // Place/render in viewer
  'image': 'basic-workcenter', // Attach for processing
  'url': 'basic-workcenter', // Attach for processing
  'base64': 'basic-workcenter' // Attach for processing
};

// Hash-based view associations for basic app
export const HASH_ASSOCIATIONS: Record<string, Destination> = {
  '#viewer': 'basic-viewer',
  '#workcenter': 'basic-workcenter',
  '#explorer': 'basic-explorer',
  '#print': 'print'
};

// Default actions for each destination
export const DESTINATION_ACTIONS = {
  'basic-viewer': {
    // Default: place/render content in view
    onReceive: 'render-content',
    // Additional actions available
    availableActions: [
      { name: 'send-to-workcenter', label: 'Work Center', destination: 'basic-workcenter' },
      { name: 'send-to-explorer', label: 'Save to Explorer', destination: 'basic-explorer' },
      { name: 'send-to-print', label: 'Print', destination: 'print' }
    ]
  },
  'basic-workcenter': {
    // Default: attach as file input/attachment
    onReceive: 'attach-file',
    // Additional actions available
    availableActions: [
      { name: 'save-to-explorer', label: 'Save to Explorer', destination: 'basic-explorer' }
      // Processing results will be shown in result field/block automatically
    ]
  },
  'basic-explorer': {
    // Default: save file to OPFS path
    onReceive: 'save-to-path',
    // Additional actions available
    availableActions: [
      { name: 'attach-to-workcenter', label: 'Attach to Work Center', destination: 'basic-workcenter' },
      { name: 'open-in-viewer', label: 'View', destination: 'basic-viewer' }
    ]
  },
  'print': {
    // Default: place/render markdown/data/text/content as printable
    onReceive: 'render-printable'
  }
};

// Processing rules for different entry points
export const PROCESSING_RULES = {
  'share-target': {
    processingUrl: '/api/processing',
    contentAction: {
      onResult: 'write-clipboard' as ResultAction,
      onAccept: 'attach-to-associated' as ResultAction,
      doProcess: 'instantly' as ProcessingAction,
      openApp: true
    }
  },
  'launch-queue': {
    processingUrl: '/api/processing',
    contentAction: {
      onResult: 'none' as ResultAction,
      onAccept: 'attach-to-associated' as ResultAction,
      doProcess: 'manually' as ProcessingAction,
      openApp: true
    }
  },
  'crx-snip': {
    processingUrl: '/api/processing',
    contentAction: {
      onResult: 'write-clipboard' as ResultAction,
      onAccept: 'attach-to-associated' as ResultAction,
      doProcess: 'instantly' as ProcessingAction,
      openApp: false // Don't open PWA/UI webapp page/view
    }
  },
  'paste': {
    processingUrl: '/api/processing',
    contentAction: {
      onResult: 'none' as ResultAction,
      onAccept: 'attach-to-associated' as ResultAction,
      doProcess: 'manually' as ProcessingAction,
      openApp: false
    }
  },
  'drop': {
    processingUrl: '/api/processing',
    contentAction: {
      onResult: 'none' as ResultAction,
      onAccept: 'attach-to-associated' as ResultAction,
      doProcess: 'manually' as ProcessingAction,
      openApp: false
    }
  }
};

// Message interface
export interface UnifiedMessage {
  id: string;
  type: MessageType;
  source: MessageSource;
  destination?: Destination;
  contentType?: ContentType;
  data: any;
  metadata?: {
    title?: string;
    filename?: string;
    mimeType?: string;
    timestamp?: number;
    priority?: 'normal' | 'high' | 'low';
    correlationId?: string;
  };
  processing?: {
    action?: ProcessingAction;
    rules?: typeof PROCESSING_RULES[keyof typeof PROCESSING_RULES];
  };
}

// Message handler interface
export interface MessageHandler {
  canHandle(message: UnifiedMessage): boolean;
  handle(message: UnifiedMessage): Promise<void> | void;
}

// Unified Messaging Manager
export class UnifiedMessagingManager {
  private static instance: UnifiedMessagingManager;
  private handlers: Map<Destination, MessageHandler[]> = new Map();
  private channels: Map<string, BroadcastChannel> = new Map();
  private messageQueue: UnifiedMessage[] = [];
  private processing = false;

  // Message persistence for component catch-up
  private persistentMessages: Map<Destination, UnifiedMessage[]> = new Map();
  private componentStates: Map<Destination, any> = new Map();
  private maxPersistentMessages = 10; // Keep last N messages per destination

  private constructor() {
    this.initializeChannels();
    this.setupMessageRouting();
  }

  static getInstance(): UnifiedMessagingManager {
    if (!UnifiedMessagingManager.instance) {
      UnifiedMessagingManager.instance = new UnifiedMessagingManager();
    }
    return UnifiedMessagingManager.instance;
  }

  private initializeChannels() {
    // Initialize all communication channels
    const allChannels = [
      ...Object.values(CHANNELS),
      ...Object.values(CUSTOM_CHANNELS)
    ];

    allChannels.forEach(channelName => {
      try {
        const channel = new BroadcastChannel(channelName);
        this.channels.set(channelName, channel);
        channel.onmessage = (event) => this.handleIncomingMessage(event.data);
      } catch (error) {
        console.warn(`[UnifiedMessaging] Failed to initialize channel ${channelName}:`, error);
      }
    });
  }

  private setupMessageRouting() {
    // Route messages based on type and destination
    this.registerHandler('workcenter', {
      canHandle: (msg) => msg.destination === 'workcenter' || msg.type === 'content-share',
      handle: async (msg) => {
        // Forward to workcenter module
        this.sendToChannel(CHANNELS.SHARE_TARGET, msg);
      }
    });

    this.registerHandler('basic-workcenter', {
      canHandle: (msg) => msg.destination === 'basic-workcenter',
      handle: async (msg) => {
        // Handle basic workcenter destination - attach as file input/attachment
        this.handleBasicWorkCenterMessage(msg);
      }
    });

    this.registerHandler('basic-viewer', {
      canHandle: (msg) => msg.destination === 'basic-viewer',
      handle: async (msg) => {
        // Handle basic viewer destination - place/render content in view
        this.handleBasicViewerMessage(msg);
      }
    });

    this.registerHandler('basic-explorer', {
      canHandle: (msg) => msg.destination === 'basic-explorer',
      handle: async (msg) => {
        // Handle basic explorer destination - save to OPFS or perform file operations
        this.handleBasicExplorerMessage(msg);
      }
    });

    this.registerHandler('settings', {
      canHandle: (msg) => msg.destination === 'settings',
      handle: async (msg) => {
        // Handle settings destination - navigate to settings view
        this.handleSettingsMessage(msg);
      }
    });

    this.registerHandler('history', {
      canHandle: (msg) => msg.destination === 'history',
      handle: async (msg) => {
        // Handle history destination - navigate to history view
        this.handleHistoryMessage(msg);
      }
    });

    this.registerHandler('print', {
      canHandle: (msg) => msg.destination === 'print',
      handle: async (msg) => {
        // Handle print destination - render as printable content
        this.handlePrintMessage(msg);
      }
    });

    this.registerHandler('clipboard', {
      canHandle: (msg) => msg.destination === 'clipboard' || msg.type === 'clipboard-write',
      handle: async (msg) => {
        // Handle clipboard operations
        if (msg.data?.text && navigator.clipboard) {
          await navigator.clipboard.writeText(msg.data.text);
        }
      }
    });

    this.registerHandler('markdown-viewer', {
      canHandle: (msg) => msg.destination === 'markdown-viewer' || msg.contentType === 'markdown',
      handle: async (msg) => {
        // Forward to markdown viewer
        this.sendToChannel('markdown-viewer', msg);
      }
    });
  }

  registerHandler(destination: Destination, handler: MessageHandler) {
    if (!this.handlers.has(destination)) {
      this.handlers.set(destination, []);
    }
    this.handlers.get(destination)!.push(handler);
  }

  async sendMessage(message: UnifiedMessage): Promise<void> {
    // Add to processing queue
    this.messageQueue.push(message);

    // Process queue if not already processing
    if (!this.processing) {
      await this.processMessageQueue();
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return;

    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.routeMessage(message);
    }

    this.processing = false;
  }

  private async routeMessage(message: UnifiedMessage): Promise<void> {
    console.log(`[UnifiedMessaging] Routing message:`, message);

    // Determine destination if not specified
    if (!message.destination && message.contentType) {
      message.destination = CONTENT_ASSOCIATIONS[message.contentType];
    }

    // Handle hash-based destinations (e.g., #viewer -> basic-viewer)
    if (message.destination && typeof message.destination === 'string' && message.destination.startsWith('#')) {
      const hashDestination = HASH_ASSOCIATIONS[message.destination];
      if (hashDestination) {
        message.destination = hashDestination;
      }
    }

    // Store message for persistence (for components that load later)
    if (message.destination) {
      this.storePersistentMessage(message.destination, message);
    }

    // Find and execute handlers
    const handlers = this.handlers.get(message.destination!) || [];
    const applicableHandlers = handlers.filter(h => h.canHandle(message));

    for (const handler of applicableHandlers) {
      try {
        await handler.handle(message);
      } catch (error) {
        console.error(`[UnifiedMessaging] Handler error:`, error);
      }
    }

    // Send to appropriate channel if no local handler
    if (applicableHandlers.length === 0) {
      const channelName = this.getChannelForDestination(message.destination);
      if (channelName) {
        this.sendToChannel(channelName, message);
      }
    }
  }

  private getChannelForDestination(destination?: Destination): string | null {
    switch (destination) {
      case 'workcenter':
      case 'basic-workcenter':
        return CHANNELS.SHARE_TARGET;
      case 'clipboard':
        return CHANNELS.CLIPBOARD;
      case 'markdown-viewer':
      case 'basic-viewer':
      case 'markdown-editor':
      case 'rich-editor':
        return 'markdown-viewer';
      case 'basic-explorer':
      case 'file-explorer':
        return 'file-explorer';
      case 'settings':
        return 'settings';
      case 'history':
        return 'history';
      case 'print':
        return 'print-viewer';
      default:
        return null;
    }
  }

  // Handler methods for new destinations
  private async handleBasicViewerMessage(msg: UnifiedMessage): Promise<void> {
    // Directly handle basic viewer content - place/render content in view
    // This will be processed by the basic app's channel listener
    const viewerMessage = {
      ...msg,
      type: 'content-view',
      destination: 'basic-viewer',
      data: {
        ...msg.data,
        actions: DESTINATION_ACTIONS['basic-viewer'].availableActions
      }
    };
    // Send directly to basic-app channel where Main.ts is listening
    this.sendToChannel(CUSTOM_CHANNELS.BASIC_APP, viewerMessage);
  }

  private async handleBasicWorkCenterMessage(msg: UnifiedMessage): Promise<void> {
    // Directly handle basic workcenter content - attach as file input/attachment
    const workCenterMessage = {
      ...msg,
      type: 'content-attach',
      destination: 'basic-workcenter',
      data: {
        ...msg.data,
        attachAsFile: true
      }
    };
    // Send directly to basic-app channel where Main.ts is listening
    this.sendToChannel(CUSTOM_CHANNELS.BASIC_APP, workCenterMessage);
  }

  private async handleBasicExplorerMessage(msg: UnifiedMessage): Promise<void> {
    // Directly handle basic explorer operations - save to OPFS or perform file operations
    const explorerMessage = {
      ...msg,
      type: 'content-explorer',
      destination: 'basic-explorer',
      data: {
        ...msg.data,
        action: msg.data?.action || 'save', // save, view, attach, etc.
        path: msg.data?.path || msg.data?.into || '/'
      }
    };
    // Send directly to file-explorer channel where Main.ts is listening
    this.sendToChannel(CUSTOM_CHANNELS.FILE_EXPLORER, explorerMessage);
  }

  private async handleSettingsMessage(msg: UnifiedMessage): Promise<void> {
    // Directly handle settings navigation - navigate to settings view
    const settingsMessage = {
      ...msg,
      type: 'navigation',
      destination: 'settings',
      data: {
        ...msg.data,
        navigate: true
      }
    };
    // Send directly to main-app channel where Main.ts is listening
    this.sendToChannel(CUSTOM_CHANNELS.MAIN_APP, settingsMessage);
  }

  private async handleHistoryMessage(msg: UnifiedMessage): Promise<void> {
    // Directly handle history navigation - navigate to history view
    const historyMessage = {
      ...msg,
      type: 'navigation',
      destination: 'history',
      data: {
        ...msg.data,
        navigate: true
      }
    };
    // Send directly to main-app channel where Main.ts is listening
    this.sendToChannel(CUSTOM_CHANNELS.MAIN_APP, historyMessage);
  }

  private async handlePrintMessage(msg: UnifiedMessage): Promise<void> {
    // Directly handle print operations - render as printable content
    const printMessage = {
      ...msg,
      type: 'content-print',
      destination: 'print',
      data: {
        ...msg.data,
        printable: true
      }
    };
    // Send directly to print-viewer channel where Main.ts is listening
    this.sendToChannel(CUSTOM_CHANNELS.PRINT_VIEWER, printMessage);
  }

  private sendToChannel(channelName: string, message: UnifiedMessage): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.postMessage(message);
    } else {
      console.warn(`[UnifiedMessaging] Channel not found: ${channelName}`);
    }
  }

  private handleIncomingMessage(data: any): void {
    // Convert incoming messages to UnifiedMessage format
    const message: UnifiedMessage = {
      id: data.id || crypto.randomUUID(),
      type: data.type || 'content-share',
      source: data.source || 'unknown',
      destination: data.destination,
      contentType: data.contentType,
      data: data.data || data,
      metadata: data.metadata,
      processing: data.processing
    };

    this.sendMessage(message);
  }

  // Utility methods for content processing
  async processContent(content: any, contentType: ContentType, source: MessageSource = 'manual'): Promise<void> {
    const message: UnifiedMessage = {
      id: crypto.randomUUID(),
      type: 'content-process',
      source,
      contentType,
      data: content,
      metadata: {
        timestamp: Date.now(),
        priority: 'normal'
      }
    };

    await this.sendMessage(message);
  }

  // Get associated destination for content type
  getAssociatedDestination(contentType: ContentType): Destination {
    return CONTENT_ASSOCIATIONS[contentType] || 'workcenter';
  }

  // Check if content should be processed automatically
  shouldProcessAutomatically(source: MessageSource): boolean {
    const rules = PROCESSING_RULES[source as keyof typeof PROCESSING_RULES];
    return rules?.contentAction.doProcess === 'instantly' || false;
  }

  // ============================================================================
  // COMPONENT INITIALIZATION & CATCH-UP MESSAGING
  // ============================================================================

  /**
   * Called when a component initializes - delivers any pending messages
   */
  async onComponentInit(destination: Destination): Promise<UnifiedMessage[]> {
    console.log(`[UnifiedMessaging] Component ${destination} initializing, checking for pending messages`);

    // Get pending messages for this destination
    const pendingMessages = this.getPersistentMessages(destination);

    // Clear pending messages after retrieval (they've been "delivered")
    this.clearPersistentMessages(destination);

    // Return messages for the component to process
    return pendingMessages;
  }

  /**
   * Register a component's current state for synchronization
   */
  setComponentState(destination: Destination, state: any): void {
    this.componentStates.set(destination, state);
  }

  /**
   * Get a component's current state
   */
  getComponentState(destination: Destination): any {
    return this.componentStates.get(destination);
  }

  /**
   * Store a message for later delivery to components that haven't loaded yet
   */
  private storePersistentMessage(destination: Destination, message: UnifiedMessage): void {
    if (!this.persistentMessages.has(destination)) {
      this.persistentMessages.set(destination, []);
    }

    const messages = this.persistentMessages.get(destination)!;
    messages.push(message);

    // Keep only the most recent messages
    if (messages.length > this.maxPersistentMessages) {
      messages.shift(); // Remove oldest
    }
  }

  /**
   * Get pending messages for a destination
   */
  private getPersistentMessages(destination: Destination): UnifiedMessage[] {
    return this.persistentMessages.get(destination) || [];
  }

  /**
   * Clear pending messages for a destination (after they've been delivered)
   */
  private clearPersistentMessages(destination: Destination): void {
    this.persistentMessages.delete(destination);
  }

  /**
   * Check if there are pending messages for a destination
   */
  hasPendingMessages(destination: Destination): boolean {
    const messages = this.persistentMessages.get(destination);
    return messages ? messages.length > 0 : false;
  }

  /**
   * Get count of pending messages for a destination
   */
  getPendingMessageCount(destination: Destination): number {
    const messages = this.persistentMessages.get(destination);
    return messages ? messages.length : 0;
  }
}

// Export singleton instance
export const unifiedMessaging = UnifiedMessagingManager.getInstance();

// Helper functions for common operations
export function sendToWorkCenter(content: any, contentType: ContentType, metadata?: any): Promise<void> {
  return unifiedMessaging.sendMessage({
    id: crypto.randomUUID(),
    type: 'content-share',
    source: 'manual',
    destination: 'workcenter',
    contentType,
    data: content,
    metadata: {
      timestamp: Date.now(),
      ...metadata
    }
  });
}

export function sendToClipboard(text: string): Promise<void> {
  return unifiedMessaging.sendMessage({
    id: crypto.randomUUID(),
    type: 'clipboard-write',
    source: 'manual',
    destination: 'clipboard',
    data: { text }
  });
}

export function navigateToView(destination: Destination): Promise<void> {
  return unifiedMessaging.sendMessage({
    id: crypto.randomUUID(),
    type: 'navigation',
    source: 'manual',
    destination,
    data: { view: destination }
  });
}

// ============================================================================
// COMPONENT INITIALIZATION HELPERS
// ============================================================================

/**
 * Initialize a component with catch-up messaging
 * Call this when a component/view mounts/initializes
 */
export async function initializeComponent(destination: Destination, componentState?: any): Promise<UnifiedMessage[]> {
  // Register component state if provided
  if (componentState !== undefined) {
    unifiedMessaging.setComponentState(destination, componentState);
  }

  // Get any pending messages for this component
  const pendingMessages = await unifiedMessaging.onComponentInit(destination);

  console.log(`[ComponentInit] ${destination} initialized with ${pendingMessages.length} pending messages`);

  return pendingMessages;
}

/**
 * Update component state for synchronization
 */
export function updateComponentState(destination: Destination, state: any): void {
  unifiedMessaging.setComponentState(destination, state);
}

/**
 * Get current component state
 */
export function getComponentState(destination: Destination): any {
  return unifiedMessaging.getComponentState(destination);
}

/**
 * Check if there are pending messages for a component
 */
export function hasPendingMessages(destination: Destination): boolean {
  return unifiedMessaging.hasPendingMessages(destination);
}

/**
 * Get count of pending messages
 */
export function getPendingMessageCount(destination: Destination): number {
  return unifiedMessaging.getPendingMessageCount(destination);
}