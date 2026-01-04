/**
 * Share Target Utilities
 * Reusable functions for processing share target data with GPT integration
 */

import { getRuntimeSettings } from '@rs-core/config/RuntimeSettings';
import { loadSettings } from '@rs-core/config/Settings';
import type { AppSettings, CustomInstruction } from '@rs-core/config/SettingsTypes';
import { DEFAULT_SETTINGS } from '@rs-core/config/SettingsTypes';
import { executionCore } from '@rs-core/service/ExecutionCore';
import type { ActionContext, ActionInput } from '@rs-core/service/ActionHistory';

// ============================================================================
// TYPES
// ============================================================================

export interface ShareData {
    title: string;
    text: string;
    url: string;
    files: File[];
    imageFiles: File[];
    textFiles: File[];
    otherFiles: File[];
    timestamp: number;
}

export interface AIProcessingConfig {
    enabled: boolean;
    mode: 'recognize' | 'analyze';
    customInstruction: string;
    apiKey: string | null;
}

export interface ParsedFormData {
    formData: FormData | null;
    error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Known field names for file uploads */
const FILE_FIELD_NAMES = ['files', 'mapped_files', 'file', 'image', 'images', 'media'] as const;

/** MIME types considered as text/code */
const TEXT_MIME_TYPES = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript'
] as const;

/** MIME types that can be processed by AI but aren't images or text */
const PROCESSABLE_MIME_TYPES = ['application/pdf'] as const;

// ============================================================================
// FORM DATA PARSING
// ============================================================================

/**
 * Parse FormData from a request with JSON fallback
 */
export const parseFormDataFromRequest = async (request: Request): Promise<ParsedFormData> => {
    // Try FormData first
    try {
        const formData = await request.formData();
        return { formData };
    } catch (formError: any) {
        console.warn('[ShareTarget] FormData parsing failed:', formError?.message);
    }

    // Fallback to JSON
    try {
        const clonedRequest = request.clone();
        const text = await clonedRequest.text();

        if (text?.trim()) {
            const jsonData = safeParseJSON<Record<string, unknown>>(text);
            if (jsonData) {
                const formData = new FormData();
                if (jsonData.title) formData.append('title', String(jsonData.title));
                if (jsonData.text) formData.append('text', String(jsonData.text));
                if (jsonData.url) formData.append('url', String(jsonData.url));
                return { formData };
            }
        }
    } catch (jsonError: any) {
        console.warn('[ShareTarget] JSON fallback failed:', jsonError?.message);
    }

    return { formData: null, error: 'Failed to parse request data' };
};

/**
 * Safe JSON parse with type guard
 */
export const safeParseJSON = <T = unknown>(text: string): T | null => {
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
};

// ============================================================================
// FILE COLLECTION
// ============================================================================

/**
 * Generate a unique key for file deduplication
 */
const getFileKey = (file: File): string => `${file.name}-${file.size}-${file.type}`;

/**
 * Check if value is a non-empty File
 */
const isValidFile = (value: unknown): value is File =>
    value instanceof File && value.size > 0;

/**
 * Collect and deduplicate files from FormData
 */
export const collectFilesFromFormData = (formData: FormData): File[] => {
    const seenFiles = new Set<string>();
    const files: File[] = [];

    const addFile = (file: File): void => {
        const key = getFileKey(file);
        if (!seenFiles.has(key)) {
            seenFiles.add(key);
            files.push(file);
        }
    };

    // Check known field names
    for (const fieldName of FILE_FIELD_NAMES) {
        for (const value of formData.getAll(fieldName)) {
            if (isValidFile(value)) addFile(value);
        }
    }

    // Check all entries for files in unknown fields
    const entries = Array.from((formData as any).entries?.() || []) as [string, FormDataEntryValue][];
    for (const [, value] of entries) {
        if (isValidFile(value)) addFile(value);
    }

    return files;
};

// ============================================================================
// FILE CATEGORIZATION
// ============================================================================

/**
 * Check if MIME type is a text/code type
 */
const isTextMimeType = (mimeType: string): boolean =>
    TEXT_MIME_TYPES.some(prefix => mimeType.startsWith(prefix));

/**
 * Check if MIME type is processable by AI (non-image, non-text)
 */
export const isProcessableMimeType = (mimeType: string): boolean =>
    PROCESSABLE_MIME_TYPES.some(type => mimeType === type);

/**
 * Categorize files by MIME type
 */
export const categorizeFiles = (files: File[]): {
    imageFiles: File[];
    textFiles: File[];
    otherFiles: File[];
} => {
    const imageFiles: File[] = [];
    const textFiles: File[] = [];
    const otherFiles: File[] = [];

    for (const file of files) {
        const mimeType = file.type?.toLowerCase() || '';

        if (mimeType.startsWith('image/')) {
            imageFiles.push(file);
        } else if (isTextMimeType(mimeType)) {
            textFiles.push(file);
        } else {
            otherFiles.push(file);
        }
    }

    return { imageFiles, textFiles, otherFiles };
};

// ============================================================================
// TEXT EXTRACTION
// ============================================================================

/**
 * Extract text content from a file
 */
export const extractTextFromFile = async (file: File): Promise<string | null> => {
    try {
        const text = await file.text();
        return text?.trim() || null;
    } catch (error: any) {
        console.warn('[ShareTarget] Failed to read text file:', file.name, error?.message);
        return null;
    }
};

/**
 * Extract text content from FormData and text files
 */
export const extractTextContent = async (
    formData: FormData,
    textFiles: File[]
): Promise<{ title: string; text: string; url: string }> => {
    const title = String(formData.get('title') || '').trim();
    let text = String(formData.get('text') || '').trim();
    const url = String(formData.get('url') || '').trim();

    // Try to extract text from files if not provided
    if (!text && textFiles.length > 0) {
        for (const file of textFiles) {
            const fileText = await extractTextFromFile(file);
            if (fileText) {
                text = fileText;
                console.log('[ShareTarget] Extracted text from file:', file.name);
                break;
            }
        }
    }

    return { title, text, url };
};

// ============================================================================
// SHARE DATA BUILDING
// ============================================================================

/**
 * Build complete share data object
 */
export const buildShareData = async (formData: FormData): Promise<ShareData> => {
    const files = collectFilesFromFormData(formData);
    const { imageFiles, textFiles, otherFiles } = categorizeFiles(files);
    const { title, text, url } = await extractTextContent(formData, textFiles);

    return {
        title,
        text,
        url,
        files,
        imageFiles,
        textFiles,
        otherFiles,
        timestamp: Date.now()
    };
};

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

const SHARE_CACHE_NAME = 'share-target-data';
const SHARE_CACHE_KEY = '/share-target-data';

/**
 * Cache share data metadata for client retrieval
 */
export const cacheShareData = async (shareData: ShareData): Promise<boolean> => {
    try {
        const cache = await caches.open(SHARE_CACHE_NAME);
        const metadata = {
            title: shareData.title,
            text: shareData.text,
            url: shareData.url,
            timestamp: shareData.timestamp,
            fileCount: shareData.files.length,
            imageCount: shareData.imageFiles.length
        };

        await cache.put(
            SHARE_CACHE_KEY,
            new Response(JSON.stringify(metadata), {
                headers: { 'Content-Type': 'application/json' }
            })
        );
        return true;
    } catch (error: any) {
        console.warn('[ShareTarget] Cache storage failed:', error?.message);
        return false;
    }
};

// ============================================================================
// AI CONFIGURATION
// ============================================================================

/**
 * Get AI processing configuration from settings
 */
export const getAIProcessingConfig = async (): Promise<AIProcessingConfig> => {
    try {
        const settings = ((await getRuntimeSettings().catch(() => null)) as AppSettings | null) || (await loadSettings().catch(() => DEFAULT_SETTINGS)) || DEFAULT_SETTINGS;

        if (!settings?.ai?.apiKey) {
            return {
                enabled: false,
                mode: 'recognize',
                customInstruction: '',
                apiKey: null
            };
        }

        // Get active custom instruction
        let customInstruction = '';
        const instructions: CustomInstruction[] = settings.ai.customInstructions || [];
        const activeId = settings.ai.activeInstructionId;

        if (activeId) {
            const active = instructions.find(i => i.id === activeId);
            customInstruction = active?.instruction?.trim() || '';
        }

        return {
            enabled: true,
            mode: (settings.ai.shareTargetMode as 'recognize' | 'analyze') || 'recognize',
            customInstruction,
            apiKey: settings.ai.apiKey
        };
    } catch (error: any) {
        console.warn('[ShareTarget] Failed to load AI config:', error?.message);
        return {
            enabled: false,
            mode: 'recognize',
            customInstruction: '',
            apiKey: null
        };
    }
};

// ============================================================================
// AI FORM DATA BUILDING
// ============================================================================

/**
 * Build FormData for AI processing
 */
export const buildAIFormData = (
    shareData: ShareData,
    customInstruction: string
): FormData => {
    const formData = new FormData();

    // Add text fields
    formData.append('title', shareData.title);
    formData.append('text', shareData.text);
    formData.append('url', shareData.url);

    if (customInstruction) {
        formData.append('customInstruction', customInstruction);
    }

    // Add image files for GPT vision processing
    for (const file of shareData.imageFiles) {
        console.log('[ShareTarget] Adding image for AI:', formatFileInfo(file));
        formData.append('files', file);
    }

    // Add processable non-text files (PDFs, etc.)
    for (const file of shareData.otherFiles) {
        if (isProcessableMimeType(file.type)) {
            console.log('[ShareTarget] Adding processable file:', file.name);
            formData.append('files', file);
        }
    }

    // Add text files only if text wasn't already extracted
    if (!shareData.text) {
        for (const file of shareData.textFiles) {
            formData.append('files', file);
        }
    }

    return formData;
};

/**
 * Create synthetic event for commit routes
 */
export const createSyntheticEvent = (formData: FormData): { request: { formData: () => Promise<FormData> } } => ({
    request: {
        formData: () => Promise.resolve(formData)
    }
});

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Format file info for logging
 */
export const formatFileInfo = (file: File): { name: string; type: string; size: number } => ({
    name: file.name,
    type: file.type,
    size: file.size
});

/**
 * Log share data summary
 */
export const logShareDataSummary = (shareData: ShareData): void => {
    console.log('[ShareTarget] Processed share data:', {
        title: shareData.title || '(none)',
        text: shareData.text
            ? shareData.text.substring(0, 100) + (shareData.text.length > 100 ? '...' : '')
            : '(none)',
        url: shareData.url || '(none)',
        totalFiles: shareData.files.length,
        imageCount: shareData.imageFiles.length,
        textCount: shareData.textFiles.length,
        otherCount: shareData.otherFiles.length
    });
};

/**
 * Check if share data has processable content
 */
export const hasProcessableContent = (shareData: ShareData): boolean =>
    !!(shareData.text || shareData.url || shareData.files.length > 0 || shareData.imageFiles.length > 0 || shareData.textFiles.length > 0 || shareData.otherFiles.length > 0 || shareData.title);

/**
 * Process share target data using the execution core
 */
export const processShareTargetWithExecutionCore = async (
    shareData: ShareData,
    sessionId?: string
): Promise<{ success: boolean; result?: any; error?: string }> => {
    try {
        // Convert share data to action input
        const actionInput: ActionInput = {
            type: shareData.files.length > 0 ? 'files' : shareData.text ? 'text' : 'url',
            files: shareData.files.length > 0 ? shareData.files : undefined,
            text: shareData.text || undefined,
            url: shareData.url || undefined,
            metadata: {
                title: shareData.title,
                timestamp: shareData.timestamp
            }
        };

        // Create execution context
        const context: ActionContext = {
            source: 'share-target',
            sessionId: sessionId || `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Execute through execution core
        const result = await executionCore.execute(actionInput, context);

        return {
            success: result.type !== 'error',
            result: result
        };

    } catch (error) {
        console.error('[ShareTarget] Execution core processing failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
};
