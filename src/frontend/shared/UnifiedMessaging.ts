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
 * - Component initialization with catch-up messaging
 * - Centralized content association registry
 */

import { CHANNELS } from '../routing/sw-handling';
import { UNIFIED_PROCESSING_RULES, type AssociationOverrideFactor, type ContentType, type ContentContext, type ContentAction } from './UnifiedAIConfig';

// Additional custom channels for unified messaging
const CUSTOM_CHANNELS = {
    BASIC_APP: 'basic-app',
    MAIN_APP: 'main-app',
    FILE_EXPLORER: 'file-explorer',
    PRINT_VIEWER: 'print-viewer'
} as const;

// ============================================================================
// CENTRALIZED CONTENT ASSOCIATION SYSTEM
// ============================================================================

/**
 * Content Association Registry
 * Maps content types and contexts to appropriate destinations and actions
 */
export interface ContentAssociation {
    contentType: ContentType;
    context: ContentContext;
    destination: Destination;
    action: ContentAction;
    priority: number;
    conditions?: AssociationCondition[];
}

// Types are now imported from UnifiedAIConfig.ts

/**
 * Association conditions for more specific routing
 */
export interface AssociationCondition {
    type: 'file-extension' | 'mime-type' | 'size' | 'content-pattern';
    value: string | RegExp;
    match: 'equals' | 'contains' | 'regex' | 'gt' | 'lt';
}

/**
 * Centralized Content Association Registry
 * Defines how different content types should be handled in different contexts
 */
export const CONTENT_ASSOCIATION_REGISTRY: ContentAssociation[] = [
    // Share Target Associations
    { contentType: 'markdown', context: 'share-target', destination: 'basic-viewer', action: 'view', priority: 100 },
    { contentType: 'text', context: 'share-target', destination: 'basic-workcenter', action: 'attach', priority: 90 },
    { contentType: 'image', context: 'share-target', destination: 'basic-workcenter', action: 'attach', priority: 95 },
    { contentType: 'url', context: 'share-target', destination: 'basic-workcenter', action: 'attach', priority: 85 },

    // Launch Queue Associations
    { contentType: 'file', context: 'launch-queue', destination: 'basic-workcenter', action: 'attach', priority: 100 },
    { contentType: 'markdown', context: 'launch-queue', destination: 'basic-viewer', action: 'view', priority: 95 },
    { contentType: 'image', context: 'launch-queue', destination: 'basic-workcenter', action: 'attach', priority: 90 },

    // File Open Associations
    { contentType: 'file', context: 'file-open', destination: 'basic-workcenter', action: 'attach', priority: 100,
      conditions: [{ type: 'mime-type', value: 'text/markdown', match: 'equals' }] },
    { contentType: 'file', context: 'file-open', destination: 'basic-viewer', action: 'view', priority: 95,
      conditions: [{ type: 'file-extension', value: '.md', match: 'equals' }] },
    { contentType: 'file', context: 'file-open', destination: 'basic-workcenter', action: 'attach', priority: 90 },

    // CRX Snip Associations
    { contentType: 'text', context: 'crx-snip', destination: 'basic-workcenter', action: 'attach', priority: 100 },
    { contentType: 'image', context: 'crx-snip', destination: 'basic-workcenter', action: 'attach', priority: 100 },

    // Paste Associations
    { contentType: 'text', context: 'paste', destination: 'basic-workcenter', action: 'attach', priority: 100 },
    { contentType: 'markdown', context: 'paste', destination: 'basic-viewer', action: 'view', priority: 95 },

    // Default fallback associations
    { contentType: 'text', context: 'initial-load', destination: 'basic-viewer', action: 'view', priority: 50 },
    { contentType: 'markdown', context: 'initial-load', destination: 'basic-viewer', action: 'view', priority: 60 },
    { contentType: 'file', context: 'initial-load', destination: 'basic-workcenter', action: 'attach', priority: 55 },
    { contentType: 'image', context: 'initial-load', destination: 'basic-workcenter', action: 'attach', priority: 55 },
];

/**
 * Resolve content association based on content type, context, and conditions
 */
export function resolveContentAssociation(
    contentType: ContentType,
    context: ContentContext,
    content?: any,
    overrideFactors?: AssociationOverrideFactor[]
): { destination: Destination; action: ContentAction; priority: number } | null {

    // Check override factors first (highest priority)
    if (overrideFactors?.includes('explicit-workcenter')) {
        return { destination: 'basic-workcenter', action: 'attach', priority: 1000 };
    }
    if (overrideFactors?.includes('explicit-viewer')) {
        return { destination: 'basic-viewer', action: 'view', priority: 1000 };
    }
    if (overrideFactors?.includes('explicit-explorer')) {
        return { destination: 'basic-explorer', action: 'save', priority: 1000 };
    }

    // Find matching associations
    const matches = CONTENT_ASSOCIATION_REGISTRY
        .filter(assoc => assoc.contentType === contentType && assoc.context === context)
        .filter(assoc => !assoc.conditions || checkAssociationConditions(assoc.conditions, content))
        .sort((a, b) => b.priority - a.priority);

    return matches.length > 0 ? {
        destination: matches[0].destination,
        action: matches[0].action,
        priority: matches[0].priority
    } : null;
}

/**
 * Check if association conditions are met
 */
function checkAssociationConditions(conditions: AssociationCondition[], content: any): boolean {
    return conditions.every(condition => {
        let contentValue: any;

        switch (condition.type) {
            case 'file-extension':
                contentValue = content?.name ? content.name.split('.').pop()?.toLowerCase() : '';
                break;
            case 'mime-type':
                contentValue = content?.type || content?.mimeType || '';
                break;
            case 'size':
                contentValue = content?.size || content?.length || 0;
                break;
            case 'content-pattern':
                contentValue = typeof content === 'string' ? content :
                              content?.text || content?.content || '';
                break;
            default:
                return false;
        }

        switch (condition.match) {
            case 'equals':
                return contentValue === condition.value;
            case 'contains':
                return String(contentValue).includes(String(condition.value));
            case 'regex':
                return new RegExp(condition.value as string).test(String(contentValue));
            case 'gt':
                return Number(contentValue) > Number(condition.value);
            case 'lt':
                return Number(contentValue) < Number(condition.value);
            default:
                return false;
        }
    });
}

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

// Content types are now defined in UnifiedAIConfig.ts

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

// Content association map (default destinations)
export const CONTENT_ASSOCIATIONS: Record<ContentType, Destination> = {
  'file': 'file-explorer', // Will be processed based on file type
  'blob': 'basic-workcenter', // Attach as file input/attachment
  'text': 'basic-viewer', // Place/render in viewer
  'markdown': 'basic-viewer', // Place/render in viewer
  'image': 'basic-workcenter', // Attach for processing
  'url': 'basic-workcenter', // Attach for processing
  'base64': 'basic-workcenter' // Attach for processing
};

// Override association map (higher priority when override factors are present)
export const OVERRIDE_ASSOCIATIONS: Record<AssociationOverrideFactor, Destination> = {
  'explicit-workcenter': 'basic-workcenter',
  'explicit-viewer': 'basic-viewer',
  'explicit-explorer': 'basic-explorer',
  'force-attachment': 'basic-workcenter',
  'force-processing': 'basic-workcenter',
  'bypass-default': 'basic-workcenter', // Default override destination
  'user-action': 'basic-workcenter' // Default for user actions
};

// Smart association resolver that considers override factors and processing rules
export function resolveDestination(
  contentType: ContentType,
  overrideFactors?: AssociationOverrideFactor[],
  source?: MessageSource,
  processingType?: string
): Destination {

  // Check for override factors first (highest priority)
  if (overrideFactors && overrideFactors.length > 0) {
    // Check for explicit overrides
    for (const factor of overrideFactors) {
      if (factor.startsWith('explicit-')) {
        const destination = OVERRIDE_ASSOCIATIONS[factor];
        if (destination) {
          return destination;
        }
      }
    }

    // Check for force overrides
    if (overrideFactors.includes('force-attachment') || overrideFactors.includes('force-processing')) {
      return 'basic-workcenter';
    }

    // Check for bypass flag
    if (overrideFactors.includes('bypass-default')) {
      return 'basic-workcenter'; // Default override destination
    }

    // Check for user action (generic override)
    if (overrideFactors.includes('user-action')) {
      return 'basic-workcenter'; // User actions typically go to workcenter
    }
  }

  // Check processing rules for association overrides (second priority)
  if (source && UNIFIED_PROCESSING_RULES[source]) {
    const rule = UNIFIED_PROCESSING_RULES[source];
    if (rule.associationOverrides && rule.associationOverrides[contentType]) {
      const factors = rule.associationOverrides[contentType];
      if (factors.length > 0) {
        // Recursively resolve with the rule's override factors
        return resolveDestination(contentType, factors);
      }
    }
    if (rule.defaultOverrideFactors && rule.defaultOverrideFactors.length > 0) {
      return resolveDestination(contentType, rule.defaultOverrideFactors);
    }
  }

  // Check processing type specific rules
  if (processingType && UNIFIED_PROCESSING_RULES[processingType]) {
    const rule = UNIFIED_PROCESSING_RULES[processingType];
    if (rule.associationOverrides && rule.associationOverrides[contentType]) {
      const factors = rule.associationOverrides[contentType];
      if (factors.length > 0) {
        return resolveDestination(contentType, factors);
      }
    }
    if (rule.defaultOverrideFactors && rule.defaultOverrideFactors.length > 0) {
      return resolveDestination(contentType, rule.defaultOverrideFactors);
    }
  }

  // Fall back to default content associations (lowest priority)
  return CONTENT_ASSOCIATIONS[contentType] || 'basic-workcenter';
}

// Helper function to get override factors from processing rules
export function getOverrideFactorsForSource(
  source: MessageSource,
  processingType?: string
): AssociationOverrideFactor[] {
  // Check processing type first (higher priority)
  if (processingType && UNIFIED_PROCESSING_RULES[processingType]) {
    return UNIFIED_PROCESSING_RULES[processingType].defaultOverrideFactors || [];
  }

  // Check source
  if (UNIFIED_PROCESSING_RULES[source]) {
    return UNIFIED_PROCESSING_RULES[source].defaultOverrideFactors || [];
  }

  return [];
}

// Throttling cache for createMessageWithOverrides to prevent spam calls
const messageThrottleCache = new Map<string, number>();

// Helper function to create a message with proper override factors
export function createMessageWithOverrides(
  type: MessageType,
  source: MessageSource,
  contentType: ContentType,
  data: any,
  customOverrides?: AssociationOverrideFactor[],
  processingType?: string
): UnifiedMessage {
  // Throttle to prevent spam creation (100ms minimum between identical messages)
  const now = Date.now();
  const throttleKey = `${type}|${source}|${contentType}|${JSON.stringify(data).substring(0, 100)}`;

  const lastCreateTime = messageThrottleCache.get(throttleKey);
  if (lastCreateTime && (now - lastCreateTime) < 100) {
    throw new Error('Message creation throttled - too frequent');
  }

  messageThrottleCache.set(throttleKey, now);

  // Clean up old throttle entries
  if (messageThrottleCache.size > 500) {
    const cutoffTime = now - 10000; // Keep entries for 10 seconds
    for (const [key, time] of messageThrottleCache.entries()) {
      if (time < cutoffTime) {
        messageThrottleCache.delete(key);
      }
    }
  }

  const overrideFactors = customOverrides || getOverrideFactorsForSource(source, processingType);
  const destination = resolveDestination(contentType, overrideFactors, source, processingType);

  return {
    id: crypto.randomUUID(),
    type,
    source,
    destination,
    contentType,
    data,
    overrideFactors,
    processing: processingType ? {
      rules: UNIFIED_PROCESSING_RULES[processingType] || UNIFIED_PROCESSING_RULES[source]
    } : undefined
  };
}

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
  // Override factors for custom association logic
  overrideFactors?: AssociationOverrideFactor[];
}

// Message handler interface
export interface MessageHandler {
  canHandle(message: UnifiedMessage): boolean;
  handle(message: UnifiedMessage): Promise<void> | void;
}

// ============================================================================
// COMPONENT INITIALIZATION WITH CATCH-UP MESSAGING
// ============================================================================

/**
 * Component State Tracking for Catch-up Messaging
 */
interface ComponentState {
    id: string;
    destination: Destination;
    isInitialized: boolean;
    pendingMessages: UnifiedMessage[];
    lastActivity: number;
    initializationPromise?: Promise<UnifiedMessage[]>;
}

/**
 * Component Registry for Catch-up Messaging
 */
class ComponentRegistry {
    private components = new Map<string, ComponentState>();

    /**
     * Register a component for catch-up messaging
     */
    registerComponent(componentId: string, destination: Destination): void {
        if (!this.components.has(componentId)) {
            this.components.set(componentId, {
                id: componentId,
                destination,
                isInitialized: false,
                pendingMessages: [],
                lastActivity: Date.now()
            });
        }
    }

    /**
     * Mark component as initialized and return pending messages
     */
    initializeComponent(componentId: string): UnifiedMessage[] {
        const component = this.components.get(componentId);
        if (!component) {
            console.warn(`[ComponentRegistry] Component ${componentId} not registered`);
            return [];
        }

        component.isInitialized = true;
        component.lastActivity = Date.now();

        const pendingMessages = [...component.pendingMessages];
        component.pendingMessages = []; // Clear pending messages

        console.log(`[ComponentRegistry] Component ${componentId} initialized with ${pendingMessages.length} pending messages`);
        return pendingMessages;
    }

    /**
     * Add pending message for component
     */
    addPendingMessage(destination: Destination, message: UnifiedMessage): boolean {
        let componentFound = false;

        for (const [componentId, component] of this.components.entries()) {
            if (component.destination === destination) {
                if (!component.isInitialized) {
                    component.pendingMessages.push(message);
                    console.log(`[ComponentRegistry] Added pending message to ${componentId}:`, message.type);
                }
                component.lastActivity = Date.now();
                componentFound = true;
            }
        }

        return componentFound;
    }

    /**
     * Get pending message count for destination
     */
    getPendingCount(destination: Destination): number {
        let count = 0;
        for (const component of this.components.values()) {
            if (component.destination === destination && !component.isInitialized) {
                count += component.pendingMessages.length;
            }
        }
        return count;
    }

    /**
     * Check if any components for destination are initialized
     */
    hasInitializedComponents(destination: Destination): boolean {
        for (const component of this.components.values()) {
            if (component.destination === destination && component.isInitialized) {
                return true;
            }
        }
        return false;
    }

    /**
     * Clean up old component registrations
     */
    cleanup(maxAge: number = 5 * 60 * 1000): void { // 5 minutes default
        const now = Date.now();
        for (const [componentId, component] of this.components.entries()) {
            if (now - component.lastActivity > maxAge) {
                console.log(`[ComponentRegistry] Cleaning up old component: ${componentId}`);
                this.components.delete(componentId);
            }
        }
    }
}

// Global component registry instance
const componentRegistry = new ComponentRegistry();

// Periodic cleanup
setInterval(() => componentRegistry.cleanup(), 60 * 1000); // Clean up every minute

// ============================================================================
// MAIN/INDEX LEVEL CONTENT PROCESSING
// ============================================================================

/**
 * Initial Content Processing Options
 */
export interface InitialContentOptions {
    content: any;
    contentType: ContentType;
    context: ContentContext;
    source: MessageSource;
    overrideFactors?: AssociationOverrideFactor[];
    metadata?: Record<string, any>;
}

/**
 * Process initial content based on associations
 * This is used at the main/index/boot level to handle share targets, launch queue, etc.
 */
export async function processInitialContent(options: InitialContentOptions): Promise<void> {
    const { content, contentType, context, source, overrideFactors, metadata } = options;

    console.log(`[InitialContent] Processing ${contentType} from ${context} (${source})`);

    // Resolve content association
    const association = resolveContentAssociation(contentType, context, content, overrideFactors);

    if (!association) {
        console.warn(`[InitialContent] No association found for ${contentType} in ${context}`);
        return;
    }

    console.log(`[InitialContent] Resolved association:`, association);

    // Create unified message
    const message: UnifiedMessage = {
        id: crypto.randomUUID(),
        type: 'content-share',
        source,
        destination: association.destination,
        contentType,
        data: content,
        metadata: {
            timestamp: Date.now(),
            association: association,
            context,
            ...metadata
        },
        overrideFactors
    };

    // Send the message through unified messaging
    await unifiedMessaging.sendMessage(message);

    // Handle initial actions based on the association
    await executeInitialAction(message, association);
}

/**
 * Execute initial action for content processing
 */
async function executeInitialAction(message: UnifiedMessage, association: { destination: Destination; action: ContentAction; priority: number }): Promise<void> {
    console.log(`[InitialContent] Executing ${association.action} action for ${message.contentType}`);

    switch (association.action) {
        case 'view':
            // Ensure the view is set and hash is updated
            if (typeof window !== 'undefined' && window.location) {
                // This will be handled by the component handlers
                // The message routing will take care of setting the view
            }
            break;

        case 'attach':
            // For attach actions, we might need to wait for the work center to be ready
            // This is handled by the component initialization system
            break;

        case 'process':
            // Processing is handled by the destination component
            break;

        case 'save':
            // Saving is handled by the destination component
            break;

        case 'print':
            // Print is handled by the print destination handler
            break;

        default:
            console.warn(`[InitialContent] Unknown action: ${association.action}`);
    }
}

// ============================================================================
// COMPONENT INITIALIZATION API
// ============================================================================

/**
 * Register a component for catch-up messaging
 */
export function registerComponent(componentId: string, destination: Destination): void {
    componentRegistry.registerComponent(componentId, destination);
}

/**
 * Initialize component and get pending messages
 */
export function initializeComponent(componentId: string): UnifiedMessage[] {
    return componentRegistry.initializeComponent(componentId);
}

/**
 * Check if there are pending messages for a destination
 */
export function hasPendingMessages(destination: Destination): number {
    return componentRegistry.getPendingCount(destination);
}

/**
 * Check if any components are initialized for a destination
 */
export function hasInitializedComponents(destination: Destination): boolean {
    return componentRegistry.hasInitializedComponents(destination);
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

  // Throttling to prevent spam actions (minimum 100ms between same actions)
  private lastActionTimes: Map<string, number> = new Map();
  private throttleMs = 100; // Minimum time between same actions

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
    // Throttle to prevent spam actions (same type/source/content within 100ms)
    if (!this.shouldAllowMessage(message)) {
      console.log(`[UnifiedMessaging] Throttled duplicate message:`, message);
      return;
    }

    // Add to processing queue
    this.messageQueue.push(message);

    // Process queue if not already processing
    if (!this.processing) {
      await this.processMessageQueue();
    }
  }

  private shouldAllowMessage(message: UnifiedMessage): boolean {
    const now = Date.now();
    const actionKey = this.getActionKey(message);

    const lastTime = this.lastActionTimes.get(actionKey);
    if (lastTime && (now - lastTime) < this.throttleMs) {
      return false; // Too soon, throttle
    }

    // Update last action time
    this.lastActionTimes.set(actionKey, now);

    // Clean up old entries periodically (keep map from growing too large)
    if (this.lastActionTimes.size > 1000) {
      this.cleanupOldActionTimes(now);
    }

    return true;
  }

  private getActionKey(message: UnifiedMessage): string {
    // Create a unique key based on message type, source, content type, and key data
    const parts = [
      message.type,
      message.source,
      message.contentType || 'unknown'
    ];

    // Include some data fingerprint for content-specific throttling
    if (message.data?.text && typeof message.data.text === 'string') {
      // Use first 50 chars as fingerprint for text content
      parts.push(message.data.text.substring(0, 50));
    } else if (message.data?.filename) {
      parts.push(message.data.filename);
    } else if (message.data?.file && message.data.file instanceof File) {
      parts.push(message.data.file.name);
    }

    return parts.join('|');
  }

  private cleanupOldActionTimes(now: number): void {
    const cutoffTime = now - (this.throttleMs * 10); // Keep entries for 10x throttle time
    for (const [key, time] of this.lastActionTimes.entries()) {
      if (time < cutoffTime) {
        this.lastActionTimes.delete(key);
      }
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
      message.destination = resolveDestination(
        message.contentType,
        message.overrideFactors,
        message.source,
        message.processing?.rules ? undefined : undefined // processingType not directly available
      );
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
      // Also add to component registry for catch-up messaging
      componentRegistry.addPendingMessage(message.destination, message);
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
  getAssociatedDestination(contentType: ContentType, overrideFactors?: AssociationOverrideFactor[], source?: MessageSource): Destination {
    return resolveDestination(contentType, overrideFactors, source);
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
