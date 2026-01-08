import { createTimelineGenerator, requestNewTimeline } from "@rs-com/service/AI-ops/MakeTimeline";
import { enableCapture } from "./service/api";
import type { GPTResponses } from "@rs-com/service/model/GPT-Responses";
import { recognizeImageData } from "./service/RecognizeData";
import { getGPTInstance } from "@rs-com/service/AI-ops/RecognizeData";
import { getCustomInstructions, type CustomInstruction } from "@rs-com/service/CustomInstructions";
import { loadSettings } from "@rs-com/config/Settings";
import { executionCore } from "@rs-com/service/ExecutionCore";
import { UnifiedAIService } from "@rs-com/service/AI-ops/RecognizeData";
import type { ActionContext, ActionInput } from "@rs-com/service/ActionHistory";

// Import built-in AI instructions
import { CRX_SOLVE_AND_ANSWER_INSTRUCTION, CRX_WRITE_CODE_INSTRUCTION, CRX_EXTRACT_CSS_INSTRUCTION } from '@rs-com/core/BuiltInAI';

// Safe wrapper for loading custom instructions
const loadCustomInstructions = async (): Promise<CustomInstruction[]> => {
    try {
        return await getCustomInstructions();
    } catch (e) {
        console.warn("Failed to load custom instructions:", e);
        return [];
    }
};

/**
 * Process Chrome extension action through execution core
 */
const processChromeExtensionAction = async (
    input: ActionInput,
    sessionId?: string
): Promise<{ success: boolean; result?: any; error?: string }> => {
    try {
        const context: ActionContext = {
            source: 'chrome-extension',
            sessionId: sessionId || `crx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        const result = await executionCore.execute(input, context);
        return {
            success: result.type !== 'error',
            result
        };
    } catch (error) {
        console.error('[CRX] Execution core processing failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

// BroadcastChannel for cross-context communication (share target-like behavior)
const TOAST_CHANNEL = "rs-toast";
const CLIPBOARD_CHANNEL = "rs-clipboard";
const AI_RECOGNITION_CHANNEL = "rs-ai-recognition";

// CRX Result Pipeline Channels
const RESULT_PIPELINE_CHANNEL = "rs-result-pipeline";
const CONTENT_SCRIPT_CHANNEL = "rs-content-script";
const POPUP_CHANNEL = "rs-popup";
const WORKCENTER_CHANNEL = "rs-workcenter";

// Broadcast helper for extension contexts
const broadcast = (channel: string, message: unknown): void => {
    try {
        const bc = new BroadcastChannel(channel);
        bc.postMessage(message);
        bc.close();
    } catch (e) {
        console.warn(`[CRX-SW] Broadcast to ${channel} failed:`, e);
    }
};

// Show toast across all contexts
const showExtensionToast = (message: string, kind: "info" | "success" | "warning" | "error" = "info"): void => {
    broadcast(TOAST_CHANNEL, {
        type: "show-toast",
        options: { message, kind, duration: 3000 }
    });
};

// Request clipboard copy across contexts
const requestClipboardCopy = (data: unknown, showFeedback = true): void => {
    broadcast(CLIPBOARD_CHANNEL, {
        type: "copy",
        data,
        options: { showFeedback }
    });
};

// ============================================================================
// CRX RESULT PIPELINE SYSTEM
//
// This system provides a structured way to handle results from CRX operations,
// routing them to appropriate destinations (clipboard, content scripts, popup, workcenter, notifications)
//
// USAGE EXAMPLES:
//
// 1. Send text result to clipboard and workcenter:
//    const resultId = await sendToClipboard("Processed text");
//    const resultId = await sendToWorkCenter("Processed text");
//
// 2. Send image result to multiple destinations:
//    const result: CrxResult = {
//        id: crypto.randomUUID(),
//        type: 'image',
//        content: imageData,
//        source: 'crx-snip',
//        timestamp: Date.now()
//    };
//    await crxResultPipeline.enqueueResult(result, [
//        { type: 'clipboard' },
//        { type: 'workcenter' },
//        { type: 'notification' }
//    ]);
//
// 3. Query pipeline status:
//    chrome.runtime.sendMessage({ type: 'crx-pipeline-status' }, response => {
//        console.log('Pipeline status:', response.status);
//    });
//
// 4. Get pending results:
//    chrome.runtime.sendMessage({ type: 'crx-pipeline-pending' }, response => {
//        console.log('Pending results:', response.pending);
//    });
//
// ============================================================================

// Result Pipeline Types
interface CrxResult {
    id: string;
    type: 'text' | 'image' | 'markdown' | 'processed';
    content: string | ArrayBuffer;
    source: 'crx-snip' | 'content-script' | 'ai-processing';
    timestamp: number;
    metadata?: Record<string, any>;
}

interface PendingResult {
    id: string;
    result: CrxResult;
    destinations: CrxDestination[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
    createdAt: number;
    completedAt?: number;
    error?: string;
}

interface CrxDestination {
    type: 'clipboard' | 'content-script' | 'popup' | 'workcenter' | 'notification';
    tabId?: number;
    frameId?: number;
    options?: Record<string, any>;
}

// Result Pipeline Manager
class CrxResultPipeline {
    private resultQueue: PendingResult[] = [];
    private maxQueueSize = 50;
    private maxRetries = 3;
    private processingInterval: number | null = null;

    constructor() {
        this.startProcessing();
    }

    // Add result to pipeline
    async enqueueResult(
        result: CrxResult,
        destinations: CrxDestination[]
    ): Promise<string> {
        const pendingResult: PendingResult = {
            id: crypto.randomUUID(),
            result,
            destinations,
            status: 'pending',
            attempts: 0,
            createdAt: Date.now()
        };

        this.resultQueue.push(pendingResult);

        // Keep queue size manageable
        if (this.resultQueue.length > this.maxQueueSize) {
            this.resultQueue.shift(); // Remove oldest
        }

        console.log(`[CRX-Pipeline] Enqueued result ${pendingResult.id} for ${destinations.length} destinations`);

        return pendingResult.id;
    }

    // Get pending results for a specific destination
    getPendingForDestination(destinationType: string): PendingResult[] {
        return this.resultQueue.filter(r =>
            r.status === 'pending' &&
            r.destinations.some(d => d.type === destinationType)
        );
    }

    // Process pending results
    private async processPendingResults(): Promise<void> {
        const pendingResults = this.resultQueue.filter(r => r.status === 'pending');

        for (const pending of pendingResults) {
            try {
                await this.processResult(pending);
            } catch (error) {
                console.warn(`[CRX-Pipeline] Failed to process result ${pending.id}:`, error);
                pending.status = 'failed';
                pending.error = error instanceof Error ? error.message : String(error);
            }
        }
    }

    // Process a single result to all its destinations
    private async processResult(pending: PendingResult): Promise<void> {
        pending.status = 'processing';
        pending.attempts++;

        const successDestinations: CrxDestination[] = [];

        for (const destination of pending.destinations) {
            try {
                await this.deliverToDestination(pending.result, destination);
                successDestinations.push(destination);
            } catch (error) {
                console.warn(`[CRX-Pipeline] Failed to deliver to ${destination.type}:`, error);
            }
        }

        if (successDestinations.length > 0) {
            pending.status = 'completed';
            pending.completedAt = Date.now();
            console.log(`[CRX-Pipeline] Result ${pending.id} delivered to ${successDestinations.length} destinations`);
        } else if (pending.attempts >= this.maxRetries) {
            pending.status = 'failed';
            pending.error = 'All destinations failed';
        } else {
            // Reset to pending for retry
            pending.status = 'pending';
        }
    }

    // Deliver result to specific destination
    private async deliverToDestination(result: CrxResult, destination: CrxDestination): Promise<void> {
        switch (destination.type) {
            case 'clipboard':
                await this.deliverToClipboard(result, destination);
                break;
            case 'content-script':
                await this.deliverToContentScript(result, destination);
                break;
            case 'popup':
                await this.deliverToPopup(result, destination);
                break;
            case 'workcenter':
                await this.deliverToWorkCenter(result, destination);
                break;
            case 'notification':
                await this.deliverToNotification(result, destination);
                break;
            default:
                throw new Error(`Unknown destination type: ${destination.type}`);
        }
    }

    // Clipboard delivery
    private async deliverToClipboard(result: CrxResult, destination: CrxDestination): Promise<void> {
        let contentToCopy = '';

        if (typeof result.content === 'string') {
            contentToCopy = result.content;
        } else if (result.content instanceof ArrayBuffer) {
            // For images, we might want to copy as data URL or just acknowledge
            contentToCopy = `[Image processed - ${result.content.byteLength} bytes]`;
        }

        if (contentToCopy) {
            // Use the existing clipboard system
            requestClipboardCopy(contentToCopy, destination.options?.showFeedback !== false);

            console.log(`[CRX-Pipeline] Copied ${result.type} result to clipboard`);
        }
    }

    // Content script delivery
    private async deliverToContentScript(result: CrxResult, destination: CrxDestination): Promise<void> {
        const message = {
            type: 'crx-result-delivered',
            result: result,
            destination: destination.type,
            timestamp: Date.now()
        };

        if (destination.tabId) {
            // Send to specific tab
            await chrome.tabs.sendMessage(destination.tabId, message, {
                frameId: destination.frameId
            });
        } else {
            // Broadcast to all content scripts
            broadcast(CONTENT_SCRIPT_CHANNEL, message);
        }

        console.log(`[CRX-Pipeline] Delivered result to content script (tab: ${destination.tabId || 'all'})`);
    }

    // Popup delivery
    private async deliverToPopup(result: CrxResult, destination: CrxDestination): Promise<void> {
        broadcast(POPUP_CHANNEL, {
            type: 'crx-result-delivered',
            result: result,
            destination: destination.type,
            timestamp: Date.now()
        });

        console.log(`[CRX-Pipeline] Delivered result to popup`);
    }

    // WorkCenter delivery (via unified messaging)
    private async deliverToWorkCenter(result: CrxResult, destination: CrxDestination): Promise<void> {
        try {
            // Import unified messaging dynamically
            const { unifiedMessaging } = await import('@rs-com/core/UnifiedMessaging');

            await unifiedMessaging.sendMessage({
                id: result.id,
                type: 'content-share',
                source: 'crx-snip',
                destination: 'basic-workcenter',
                contentType: result.type,
                data: {
                    text: typeof result.content === 'string' ? result.content : undefined,
                    processed: true,
                    source: result.source,
                    metadata: result.metadata
                },
                metadata: {
                    title: `CRX-Snip ${result.type} Result`,
                    timestamp: result.timestamp,
                    source: result.source
                }
            });

            console.log(`[CRX-Pipeline] Delivered result to WorkCenter via unified messaging`);
        } catch (error) {
            console.warn('[CRX-Pipeline] Failed to deliver to WorkCenter:', error);
            throw error;
        }
    }

    // Notification delivery
    private async deliverToNotification(result: CrxResult, destination: CrxDestination): Promise<void> {
        const title = `CrossWord ${result.source}`;
        let message = '';

        if (typeof result.content === 'string') {
            message = result.content.length > 100
                ? result.content.substring(0, 100) + '...'
                : result.content;
        } else {
            message = `${result.type} processed successfully`;
        }

        await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: title,
            message: message
        });

        console.log(`[CRX-Pipeline] Showed notification for result`);
    }

    // Start processing interval
    private startProcessing(): void {
        if (this.processingInterval) return;

        this.processingInterval = globalThis.setInterval(() => {
            this.processPendingResults();
        }, 1000); // Process every second
    }

    // Stop processing
    destroy(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.resultQueue = [];
    }

    // Get pipeline status
    getStatus(): {
        queueSize: number;
        pendingCount: number;
        processingCount: number;
        completedCount: number;
        failedCount: number;
    } {
        const counts = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };

        this.resultQueue.forEach(r => {
            counts[r.status]++;
        });

        return {
            queueSize: this.resultQueue.length,
            pendingCount: counts.pending,
            processingCount: counts.processing,
            completedCount: counts.completed,
            failedCount: counts.failed
        };
    }
}

// Global pipeline instance
const crxResultPipeline = new CrxResultPipeline();

// Debug function to log pipeline status periodically
const startPipelineDebugging = () => {
    globalThis.setInterval(() => {
        const status = crxResultPipeline.getStatus();
        if (status.queueSize > 0) {
            console.log('[CRX-Pipeline] Status:', status);
        }
    }, 10000); // Log every 10 seconds if queue has items
};

// Start debugging
startPipelineDebugging();

// Cleanup on service worker termination
self.addEventListener('beforeunload', () => {
    crxResultPipeline.destroy();
    console.log('[CRX-Pipeline] Service worker terminating, pipeline destroyed');
});

// Helper functions for common result operations
const sendToClipboard = (content: string, showFeedback = true): Promise<string> => {
    const result: CrxResult = {
        id: crypto.randomUUID(),
        type: 'text',
        content: content,
        source: 'crx-snip',
        timestamp: Date.now()
    };

    return crxResultPipeline.enqueueResult(result, [{
        type: 'clipboard',
        options: { showFeedback }
    }]);
};

const sendToWorkCenter = (content: string | CrxResult): Promise<string> => {
    const result: CrxResult = typeof content === 'string' ? {
        id: crypto.randomUUID(),
        type: 'text',
        content: content,
        source: 'crx-snip',
        timestamp: Date.now()
    } : content;

    return crxResultPipeline.enqueueResult(result, [{
        type: 'workcenter'
    }]);
};

const sendToContentScript = (result: CrxResult, tabId?: number): Promise<string> => {
    return crxResultPipeline.enqueueResult(result, [{
        type: 'content-script',
        tabId: tabId
    }]);
};

const showResultNotification = (result: CrxResult): Promise<string> => {
    return crxResultPipeline.enqueueResult(result, [{
        type: 'notification'
    }]);
};

// Pipeline management functions
const getPipelineStatus = () => {
    return crxResultPipeline.getStatus();
};

const getPendingResults = (destinationType?: string) => {
    if (destinationType) {
        return crxResultPipeline.getPendingForDestination(destinationType);
    }
    return crxResultPipeline.resultQueue.filter(r => r.status === 'pending');
};

const clearCompletedResults = () => {
    const completedResults = crxResultPipeline.resultQueue.filter(r => r.status === 'completed');
    crxResultPipeline.resultQueue = crxResultPipeline.resultQueue.filter(r => r.status !== 'completed');
    return completedResults.length;
};

// Process CRX-Snip with pipeline integration
const processCrxSnipWithPipeline = async (
    content: string | ArrayBuffer,
    contentType: string = 'text',
    additionalDestinations: CrxDestination[] = []
): Promise<{ success: boolean; resultId?: string; error?: string }> => {
    try {
        const isImage = contentType === 'image' || content instanceof ArrayBuffer;
        console.log('[CRX-SNIP] Processing', isImage ? 'image' : 'text', 'content with pipeline');

        let processedContent: string | ArrayBuffer = content;
        let finalContentType = contentType;

        // If it's image data, process it for recognition
        if (isImage && content instanceof ArrayBuffer) {
            try {
                console.log('[CRX-SNIP] Processing image for recognition...');
                const blob = new Blob([content], { type: 'image/png' });
                const recognitionResult = await recognizeImageData(blob);
                processedContent = recognitionResult.text || '';
                finalContentType = 'text';
                console.log('[CRX-SNIP] Image recognition result:', processedContent.substring(0, 100) + '...');
            } catch (recognitionError) {
                console.warn('[CRX-SNIP] Image recognition failed:', recognitionError);
                return { success: false, error: 'Image recognition failed' };
            }
        }

        // Create AI processing input
        const input: ActionInput = {
            type: 'process',
            content: processedContent,
            contentType: finalContentType as any,
            metadata: {
                source: 'crx-snip',
                timestamp: Date.now(),
                background: true,
                originalType: contentType
            }
        };

        // Process through execution core
        const result = await processChromeExtensionAction(input);

        if (result.success && result.result) {
            // Create result object
            const crxResult: CrxResult = {
                id: crypto.randomUUID(),
                type: 'processed',
                content: typeof result.result === 'string' ? result.result : String(result.result),
                source: 'crx-snip',
                timestamp: Date.now(),
                metadata: {
                    originalContentType: contentType,
                    processingTime: Date.now() - input.metadata.timestamp
                }
            };

            // Default destinations based on CRX-Snip rules
            const destinations: CrxDestination[] = [
                { type: 'clipboard', options: { showFeedback: true } },
                { type: 'content-script' }, // Show page-level toast notification
                { type: 'workcenter' },
                { type: 'notification' }
            ];

            // Add any additional destinations
            destinations.push(...additionalDestinations);

            // Enqueue for pipeline processing
            const resultId = await crxResultPipeline.enqueueResult(crxResult, destinations);

            return { success: true, resultId };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('[CRX-SNIP] Pipeline processing error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
};

// Note: Offscreen document management is handled in crx/service/api.ts
// via the COPY_HACK function with offscreenFallback option

//
enableCapture(chrome);

const VIEWER_PAGE = "markdown/viewer.html";
const VIEWER_ORIGIN = chrome.runtime.getURL("");
const VIEWER_URL = chrome.runtime.getURL(VIEWER_PAGE);
const MARKDOWN_EXTENSION_PATTERN = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;
const MD_VIEW_MENU_ID = "crossword:markdown-view";

const isMarkdownUrl = (candidate?: string | null): candidate is string => {
    if (!candidate || typeof candidate !== "string") return false;
    try {
        const url = new URL(candidate);
        if (url.protocol === "chrome-extension:") return false;
        if (!["http:", "https:", "file:", "ftp:"].includes(url.protocol)) return false;
        // extension-based detection (fast path)
        if (MARKDOWN_EXTENSION_PATTERN.test(url.pathname)) return true;
        // known raw markdown hosts often have stable paths but sometimes omit extension
        if (url.hostname === "raw.githubusercontent.com" || url.hostname === "gist.githubusercontent.com") return true;
        return false;
    } catch {
        return false;
    }
};

// Detect if text content is markdown format (when not HTML)
const isMarkdownContent = (text: string): boolean => {
    if (!text || typeof text !== "string") return false;

    // Skip if it looks like HTML
    const trimmed = text.trim();
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) return false;
    if (/<[a-zA-Z][^>]*>/.test(trimmed)) return false; // Contains HTML tags

    // Markdown detection patterns with confidence scores
    const patterns = [
        { pattern: /^---[\s\S]+?---/, score: 0.9 }, // YAML frontmatter
        { pattern: /^#{1,6}\s+.+$/m, score: 0.8 }, // Headings
        { pattern: /^\s*[-*+]\s+\S+/m, score: 0.7 }, // Unordered lists
        { pattern: /^\s*\d+\.\s+\S+/m, score: 0.7 }, // Ordered lists
        { pattern: /`{1,3}[^`]*`{1,3}/, score: 0.6 }, // Code blocks/inline code
        { pattern: /\[([^\]]+)\]\(([^)]+)\)/, score: 0.5 }, // Links
        { pattern: /!\[([^\]]+)\]\(([^)]+)\)/, score: 0.5 }, // Images
        { pattern: /\*\*[^*]+\*\*/, score: 0.4 }, // Bold text
        { pattern: /\*[^*]+\*/, score: 0.3 }, // Italic text
    ];

    let totalScore = 0;
    let patternCount = 0;

    for (const { pattern, score } of patterns) {
        if (pattern.test(text)) {
            totalScore += score;
            patternCount++;
        }
    }

    // Require at least 2 patterns and minimum confidence
    return patternCount >= 2 && totalScore >= 0.8;
};

const toViewerUrl = (source?: string | null, markdownKey?: string | null) => {
    if (!source) return VIEWER_URL;
    const params = new URLSearchParams();
    params.set("src", source);
    if (markdownKey) params.set("mdk", markdownKey);
    return `${VIEWER_URL}?${params.toString()}`;
};

const openViewer = (source?: string | null, destinationTabId?: number, markdownKey?: string | null) => {
    const url = toViewerUrl(source ?? undefined, markdownKey);
    if (typeof destinationTabId === "number") {
        chrome.tabs.update(destinationTabId, { url })?.catch?.(console.warn.bind(console));
    } else {
        chrome.tabs.create({ url })?.catch?.(console.warn.bind(console));
    }
};

const normalizeMarkdownSourceUrl = (candidate: string) => {
    try {
        const u = new URL(candidate);

        // GitHub: /{owner}/{repo}/blob/{ref}/{path} -> raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}
        if (u.hostname === "github.com") {
            const parts = u.pathname.split("/").filter(Boolean);
            const blobIdx = parts.indexOf("blob");
            if (parts.length >= 5 && blobIdx === 2) {
                const owner = parts[0];
                const repo = parts[1];
                const ref = parts[3];
                const rest = parts.slice(4).join("/");
                const raw = new URL(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest}`);
                raw.hash = "";
                raw.search = "";
                return raw.toString();
            }
        }

        // GitLab: /{group}/{repo}/-/blob/{ref}/{path} -> /{group}/{repo}/-/raw/{ref}/{path}
        if (u.hostname.endsWith("gitlab.com")) {
            const parts = u.pathname.split("/").filter(Boolean);
            const dashIdx = parts.indexOf("-");
            if (dashIdx >= 0 && parts[dashIdx + 1] === "blob") {
                const base = parts.slice(0, dashIdx).join("/");
                const ref = parts[dashIdx + 2] || "";
                const rest = parts.slice(dashIdx + 3).join("/");
                const raw = new URL(`https://${u.hostname}/${base}/-/raw/${ref}/${rest}`);
                raw.hash = "";
                raw.search = "";
                return raw.toString();
            }
        }

        // Bitbucket: `?raw=1` works for many src URLs
        if (u.hostname === "bitbucket.org") {
            if (!u.searchParams.has("raw")) u.searchParams.set("raw", "1");
            return u.toString();
        }

        return u.toString();
    } catch {
        return candidate;
    }
};

const fetchMarkdownText = async (candidate: string) => {
    const src = normalizeMarkdownSourceUrl(candidate);
    const res = await fetch(src, { credentials: "include", cache: "no-store" });
    const text = await res.text().catch(() => "");

    // Check if the content looks like markdown (when not HTML)
    if (text && !text.trim().startsWith("<") && isMarkdownContent(text)) {
        console.log(`[CRX] Detected markdown content from ${src}`);
    }

    return { ok: res.ok, status: res.status, src, text };
};

const openMarkdownInViewer = async (originalUrl: string, tabId: number) => {
    // file:// handled via tab text (see onCompleted)
    if (originalUrl.startsWith("file:")) {
        openViewer(originalUrl, tabId, null);
        return;
    }

    const fetched = await fetchMarkdownText(originalUrl).catch((e) => {
        console.warn("markdown fetch failed", e);
        return null;
    });

    if (!fetched) {
        openViewer(normalizeMarkdownSourceUrl(originalUrl), tabId, null);
        return;
    }

    const key = fetched.ok && fetched.text ? await putMarkdownToSession(fetched.text) : null;
    // pass the resolved src so reload works even for github blob urls
    openViewer(fetched.src, tabId, key);
};

const createSessionKey = () => {
    try {
        return `md:${crypto.randomUUID()}`;
    } catch {
        return `md:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    }
};

const putMarkdownToSession = async (text: string) => {
    const key = createSessionKey();
    try {
        await chrome.storage?.session?.set?.({ [key]: text });
        return key;
    } catch (e) {
        console.warn("Failed to store markdown in session", e);
        return null;
    }
};

const tryReadMarkdownFromTab = async (tabId: number, url?: string) => {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: (pageUrl: string) => {
                // Check if this is a GitHub page that renders markdown
                const isGitHub = pageUrl.includes("github.com");

                if (isGitHub) {
                    // Try to extract markdown from GitHub's rendered content
                    const selectors = [
                        // GitHub README and markdown files
                        ".markdown-body",
                        "[data-target='readme-toc.content']",
                        ".Box-body .markdown-body",
                        // GitHub issues/PRs
                        ".js-comment-body .markdown-body",
                        // GitHub wiki pages
                        ".wiki-wrapper .markdown-body",
                        // Fallback to any markdown body
                        ".markdown-body"
                    ];

                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            // Try to get the raw markdown if available (GitHub sometimes provides it)
                            const rawButton = document.querySelector("a[href*='raw']") as HTMLAnchorElement;
                            if (rawButton && rawButton.href) {
                                // Return a special marker to indicate we should fetch the raw version
                                return `__RAW_URL__${rawButton.href}`;
                            }

                            // Extract text from the rendered markdown
                            const text = element.textContent || "";
                            if (text.trim()) {
                                return text.trim();
                            }
                        }
                    }
                }

                // For non-GitHub pages or fallback, try to detect if content is markdown
                const bodyText = document?.body?.innerText || document?.documentElement?.innerText || "";
                if (typeof bodyText === "string" && bodyText.trim()) {
                    // Check if the content looks like markdown
                    const trimmed = bodyText.trim();
                    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
                        // Looks like HTML, try to extract text content
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = trimmed;
                        return tempDiv.textContent || tempDiv.innerText || trimmed;
                    }
                    return trimmed;
                }

                return "";
            },
            args: [url || ""]
        });

        const value = results?.[0]?.result;
        if (typeof value === "string") {
            // Check if we got a raw URL marker
            if (value.startsWith("__RAW_URL__")) {
                const rawUrl = value.replace("__RAW_URL__", "");
                try {
                    // Fetch the raw markdown content
                    const response = await fetch(rawUrl);
                    if (response.ok) {
                        return await response.text();
                    }
                } catch (e) {
                    console.warn("Failed to fetch raw markdown:", e);
                }
                // Fall back to the extracted text if raw fetch fails
                return "";
            }

            return value;
        }
        return "";
    } catch (e) {
        // Most common for file:// when user didn't enable "Allow access to file URLs".
        console.warn("Failed to read markdown from tab", tabId, e);
        return "";
    }
};

const CTX_CONTEXTS = [
    "all",
    "page",
    "frame",
    "selection",
    "link",
    "editable",
    "image",
    "video",
    "audio",
    "action",
] as const satisfies [`${chrome.contextMenus.ContextType}`, ...`${chrome.contextMenus.ContextType}`[]];

// Built-in context menu items
const CTX_ITEMS: Array<{ id: string; title: string }> = [
    { id: "copy-as-latex", title: "Copy as LaTeX" },
    { id: "copy-as-mathml", title: "Copy as MathML" },
    { id: "copy-as-markdown", title: "Copy as Markdown" },
    { id: "copy-as-html", title: "Copy as HTML" },
    { id: "START_SNIP", title: "Snip and Recognize (AI)" },
    { id: "SOLVE_AND_ANSWER", title: "Solve / Answer (AI)" },
    { id: "WRITE_CODE", title: "Write Code (AI)" },
    { id: "EXTRACT_CSS", title: "Extract CSS Styles (AI)" },
];

// Custom instruction prefix for context menu IDs
const CUSTOM_INSTRUCTION_PREFIX = "CUSTOM_INSTRUCTION:";

// Track custom instruction context menus
let customInstructionMenuIds: string[] = [];

// Update context menus with custom instructions
const updateCustomInstructionMenus = async () => {
    // Remove existing custom instruction menus
    for (const menuId of customInstructionMenuIds) {
        try {
            await chrome.contextMenus.remove(menuId);
        } catch { /* ignore */ }
    }
    customInstructionMenuIds = [];

    // Load custom instructions
    const instructions = await loadCustomInstructions().catch(() => []);
    const enabled = instructions.filter(i => i.enabled);

    if (enabled.length === 0) return;

    // Create separator before custom instructions
    const separatorId = "CUSTOM_SEP";
    try {
        chrome.contextMenus.create({
            id: separatorId,
            type: "separator",
            contexts: CTX_CONTEXTS,
        });
        customInstructionMenuIds.push(separatorId);
    } catch { /* ignore */ }

    // Create menu items for each custom instruction
    for (const instruction of enabled) {
        const menuId = `${CUSTOM_INSTRUCTION_PREFIX}${instruction.id}`;
        try {
            chrome.contextMenus.create({
                id: menuId,
                title: `🎯 ${instruction.label}`,
                contexts: CTX_CONTEXTS,
            });
            customInstructionMenuIds.push(menuId);
        } catch (e) {
            console.warn("[CRX-SW] Failed to create custom instruction menu:", e);
        }
    }
};

// Listen for settings changes to update menus
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes["rs-settings"]) {
        updateCustomInstructionMenus().catch(console.warn);
    }
});

// Handle messages from Extension UI or Content Scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'MAKE_TIMELINE') {
        const source = message.source || null;
        const speechPrompt = message.speechPrompt || null;
        createTimelineGenerator(source, speechPrompt).then(async (gptResponses) => {
            sendResponse(await (requestNewTimeline(gptResponses as unknown as GPTResponses) as unknown as Promise<any[]> || []));
        }).catch((error: Error) => {
            console.error("Timeline generation failed:", error);
            sendResponse({ error: error.message });
        });
        return true; // Indicates that the response is asynchronous
    }

    if (message?.type === "gpt:recognize") {
        const requestId = message?.requestId || `rec_${Date.now()}`;

        // Broadcast recognition start
        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "recognize",
            requestId,
            status: "processing"
        });

        recognizeImageData(message?.input, (result) => {
            // keep CrossHelp-compatible shape: res.data.output[...]
            const response = { ok: result?.ok, data: result?.raw, error: result?.error };

            // Broadcast result for cross-context handling
            broadcast(AI_RECOGNITION_CHANNEL, {
                type: "result",
                requestId,
                ...response
            });

            // Auto-copy to clipboard if successful and requested
            if (result?.ok && result?.raw && message?.autoCopy !== false) {
                const textResult = typeof result.raw === "string"
                    ? result.raw
                    : result.raw?.latex || result.raw?.text || JSON.stringify(result.raw);
                requestClipboardCopy(textResult, true);
            }

            sendResponse(response);
        })?.catch?.((e) => {
            const errorResponse = { ok: false, error: String(e) };
            broadcast(AI_RECOGNITION_CHANNEL, {
                type: "result",
                requestId,
                ...errorResponse
            });
            showExtensionToast(`Recognition failed: ${e}`, "error");
            sendResponse(errorResponse);
        });
        return true;
    }

    // Handle equation solving requests
    // Handle unified solve/answer requests (equations, questions, quizzes, homework)
    if (message?.type === "gpt:solve" || message?.type === "gpt:answer" || message?.type === "gpt:solve-answer") {
        const requestId = message?.requestId || `solve_${Date.now()}`;

        // Broadcast processing start
        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "solve-answer",
            requestId,
            status: "processing"
        });

        // Use GPT instance directly like CRX api.ts does
        (async () => {
            try {
                console.log("[CRX-SW] Processing solve/answer request");
                const gpt = await getGPTInstance();
                if (!gpt) {
                    const errorResponse = { ok: false, error: "AI service not available" };
                    broadcast(AI_RECOGNITION_CHANNEL, {
                        type: "result",
                        requestId,
                        mode: "solve-answer",
                        ...errorResponse
                    });
                    sendResponse(errorResponse);
                    return;
                }

                const SOLVE_AND_ANSWER_INSTRUCTION = CRX_SOLVE_AND_ANSWER_INSTRUCTION;

                console.log("[CRX-SW] Setting up GPT for solve/answer");
                // Create a simple message structure for solve/answer
                gpt?.getPending?.()?.push?.({
                    type: "message",
                    role: "user",
                    content: [
                        { type: "input_text", text: SOLVE_AND_ANSWER_INSTRUCTION },
                        { type: "input_text", text: message?.input || "" }
                    ]
                });
                console.log("[CRX-SW] Calling GPT sendRequest");
                const rawResponse = await gpt.sendRequest("high", "medium");
                console.log("[CRX-SW] GPT response:", rawResponse);

                const response = {
                    ok: !!rawResponse,
                    data: rawResponse || "",
                    error: rawResponse ? undefined : "Failed to get response"
                };

                // Broadcast result
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "solve-answer",
                    ...response
                });

                // Auto-copy solution to clipboard if successful
                if (response.ok && response.data && message?.autoCopy !== false) {
                    requestClipboardCopy(response.data, true);
                }

                sendResponse(response);
            } catch (e) {
                console.error("[CRX-SW] Solve/answer error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "solve-answer",
                    ...errorResponse
                });
                showExtensionToast(`Solve/Answer failed: ${e}`, "error");
                sendResponse(errorResponse);
            }
        })();
    }

    // Handle code writing requests
    if (message?.type === "gpt:code") {
        const requestId = message?.requestId || `code_${Date.now()}`;

        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "code",
            requestId,
            status: "processing"
        });

        // Use GPT instance directly for code generation
        (async () => {
            try {
                console.log("[CRX-SW] Processing code generation request");
                const gpt = await getGPTInstance();
                if (!gpt) {
                    const errorResponse = { ok: false, error: "AI service not available" };
                    broadcast(AI_RECOGNITION_CHANNEL, {
                        type: "result",
                        requestId,
                        mode: "code",
                        ...errorResponse
                    });
                    sendResponse(errorResponse);
                    return;
                }

                const WRITE_CODE_INSTRUCTION = CRX_WRITE_CODE_INSTRUCTION;

                console.log("[CRX-SW] Setting up GPT for code generation");
                // Create a simple message structure for code generation
                gpt?.getPending?.()?.push?.({
                    type: "message",
                    role: "user",
                    content: [
                        { type: "input_text", text: WRITE_CODE_INSTRUCTION },
                        { type: "input_text", text: message?.input || "" }
                    ]
                });
                console.log("[CRX-SW] Calling GPT sendRequest for code");
                const rawResponse = await gpt.sendRequest("high", "medium");
                console.log("[CRX-SW] GPT code response:", rawResponse);

                const response = {
                    ok: !!rawResponse,
                    data: rawResponse || "",
                    error: rawResponse ? undefined : "Failed to generate code"
                };

                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "code",
                    ...response
                });

                if (response.ok && response.data && message?.autoCopy !== false) {
                    requestClipboardCopy(response.data, true);
                }

                sendResponse(response);
            } catch (e) {
                console.error("[CRX-SW] Code generation error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "code",
                    ...errorResponse
                });
                showExtensionToast(`Code generation failed: ${e}`, "error");
                sendResponse(errorResponse);
            }
        })();
        return true;
    }

    // Handle CSS extraction requests
    if (message?.type === "gpt:css") {
        const requestId = message?.requestId || `css_${Date.now()}`;

        broadcast(AI_RECOGNITION_CHANNEL, {
            type: "css",
            requestId,
            status: "processing"
        });

        // Use GPT instance directly for CSS extraction
        (async () => {
            try {
                console.log("[CRX-SW] Processing CSS extraction request");
                const gpt = await getGPTInstance();
                if (!gpt) {
                    const errorResponse = { ok: false, error: "AI service not available" };
                    broadcast(AI_RECOGNITION_CHANNEL, {
                        type: "result",
                        requestId,
                        mode: "css",
                        ...errorResponse
                    });
                    sendResponse(errorResponse);
                    return;
                }

                const EXTRACT_CSS_INSTRUCTION = CRX_EXTRACT_CSS_INSTRUCTION;

                console.log("[CRX-SW] Setting up GPT for CSS extraction");
                // Create a simple message structure for CSS extraction
                gpt?.getPending?.()?.push?.({
                    type: "message",
                    role: "user",
                    content: [
                        { type: "input_text", text: EXTRACT_CSS_INSTRUCTION },
                        { type: "input_text", text: message?.input || "" }
                    ]
                });
                console.log("[CRX-SW] Calling GPT sendRequest for CSS");
                const rawResponse = await gpt.sendRequest("high", "medium");
                console.log("[CRX-SW] GPT CSS response:", rawResponse);

                const response = {
                    ok: !!rawResponse,
                    data: rawResponse || "",
                    error: rawResponse ? undefined : "Failed to extract CSS"
                };

                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "css",
                    ...response
                });

                if (response.ok && response.data && message?.autoCopy !== false) {
                    requestClipboardCopy(response.data, true);
                }

                sendResponse(response);
            } catch (e) {
                console.error("[CRX-SW] CSS extraction error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "css",
                    ...errorResponse
                });
                showExtensionToast(`CSS extraction failed: ${e}`, "error");
                sendResponse(errorResponse);
            }
        })();
        return true;
    }

    // Handle custom instruction requests (user-defined)
    if (message?.type === "gpt:custom") {
        const instructionId = message?.instructionId;
        const customInstruction = message?.instruction;
        const requestId = message?.requestId || `custom_${Date.now()}`;

        // Get instruction text from ID or use provided text
        (async () => {
            let instructionText = customInstruction;
            let instructionLabel = "Custom";

            if (!instructionText && instructionId) {
                const instructions = await loadCustomInstructions().catch(() => []);
                const found = instructions.find(i => i.id === instructionId);
                if (found) {
                    instructionText = found.instruction;
                    instructionLabel = found.label;
                }
            }

            if (!instructionText) {
                const errorResponse = { ok: false, error: "No instruction found" };
                sendResponse(errorResponse);
                return;
            }

            broadcast(AI_RECOGNITION_CHANNEL, {
                type: "custom",
                requestId,
                label: instructionLabel,
                status: "processing"
            });

            UnifiedAIService.processDataWithInstruction(message?.input, {
                instruction: instructionText,
                outputFormat: 'auto',
                intermediateRecognition: { enabled: false }
            }).then(result => {
                const response = { ok: result?.ok, data: result?.data, error: result?.error };

                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "custom",
                    label: instructionLabel,
                    ...response
                });

                if (result?.ok && result?.data && message?.autoCopy !== false) {
                    requestClipboardCopy(result.data, true);
                }

                sendResponse(response);
            }).catch((e: any) => {
                console.error("AI processing error:", e);
                const errorResponse = { ok: false, error: String(e) };
                broadcast(AI_RECOGNITION_CHANNEL, {
                    type: "result",
                    requestId,
                    mode: "custom",
                    label: instructionLabel,
                    ...errorResponse
                });
                showExtensionToast(`${instructionLabel} failed: ${e}`, "error");
                sendResponse(errorResponse);
            });
        })();
        return true;
    }

    // Handle translation requests
    if (message?.type === "gpt:translate") {
        const inputText = message?.input;
        const targetLanguage = message?.targetLanguage || "English";
        const requestId = message?.requestId || `translate_${Date.now()}`;

        if (!inputText?.trim()) {
            sendResponse({ ok: false, error: "No text to translate" });
            return true;
        }

        const translationInstruction = `Translate the following text to ${targetLanguage}.
Preserve formatting (Markdown, KaTeX math expressions, code blocks, etc.).
Only translate the natural language text, keep technical notation unchanged.
Return ONLY the translated text without explanations.`;

        (async () => {
            try {
                const settings = await loadSettings();
                const aiSettings = (await settings)?.ai;
                const token = aiSettings?.apiKey;

                if (!token) {
                    sendResponse({ ok: false, error: "No API key configured" });
                    return;
                }

                const baseUrl = aiSettings?.baseUrl || "https://api.proxyapi.ru/openai/v1";
                const model = aiSettings?.model || "gpt-5.2";

                const response = await fetch(`${baseUrl}/responses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        model,
                        input: inputText,
                        instructions: translationInstruction,
                        reasoning: { effort: "low" },
                        text: { verbosity: "low" }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Translation API error: ${response.status}`);
                }

                const data = await response.json();
                const translatedText = data?.output?.at?.(-1)?.content?.[0]?.text || inputText;

                sendResponse({ ok: true, data: translatedText });
            } catch (e) {
                console.error("Translation failed:", e);
                sendResponse({ ok: false, error: String(e), data: inputText });
            }
        })();
        return true;
    }

    // Handle share-target-like data from external sources (e.g., context menu shares)
    if (message?.type === "share-target") {
        const { title, text, url, files } = message.data || {};

        // Store for client retrieval
        chrome.storage?.local?.set?.({
            "rs-share-target-data": {
                title,
                text,
                url,
                files: files?.map?.((f: File) => f.name) || [],
                timestamp: Date.now()
            }
        }).catch(console.warn.bind(console));

        // Broadcast to clients
        broadcast("rs-share-target", {
            type: "share-received",
            data: { title, text, url, timestamp: Date.now() }
        });

        showExtensionToast("Content received", "info");
        sendResponse({ ok: true });
        return true;
    }
});

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
    for (const item of CTX_ITEMS) {
        try {
            chrome.contextMenus.create({
                id: item.id,
                title: item.title,
                visible: true,
                contexts: CTX_CONTEXTS,
            });
        } catch (e) {
            console.warn(e);
        }
    }

    try {
        chrome.contextMenus.create({
            id: MD_VIEW_MENU_ID,
            title: "Open in Markdown Viewer",
            contexts: ["link", "page"],
            targetUrlPatterns: [
                "*://*/*.md",
                "*://*/*.markdown",
                "file://*/*.md",
                "file://*/*.markdown",
            ],
        });
    } catch (e) {
        console.warn(e);
    }

    // Load and create custom instruction menus
    updateCustomInstructionMenus().catch(console.warn);
});

// helper to send message to tab with fallback to active tab
const sendToTabOrActive = async (tabId: number | undefined, message: unknown) => {
    if (tabId != null && tabId >= 0) {
        return chrome.tabs.sendMessage(tabId, message)?.catch?.(console.warn.bind(console));
    }
    // fallback: query active tab
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true })?.catch?.(() => []);
    for (const tab of tabs || []) {
        if (tab?.id != null && tab.id >= 0) {
            return chrome.tabs.sendMessage(tab.id, message)?.catch?.(console.warn.bind(console));
        }
    }
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
    const tabId = tab?.id;
    const menuId = String(info.menuItemId);

    if (menuId === "START_SNIP") {
        sendToTabOrActive(tabId, { type: "START_SNIP" });
        return;
    }

    if (menuId === "SOLVE_AND_ANSWER") {
        sendToTabOrActive(tabId, { type: "SOLVE_AND_ANSWER" });
        return;
    }

    if (menuId === "WRITE_CODE") {
        sendToTabOrActive(tabId, { type: "WRITE_CODE" });
        return;
    }

    if (menuId === "EXTRACT_CSS") {
        sendToTabOrActive(tabId, { type: "EXTRACT_CSS" });
        return;
    }

    // Handle custom instruction menu items
    if (menuId.startsWith(CUSTOM_INSTRUCTION_PREFIX)) {
        const instructionId = menuId.slice(CUSTOM_INSTRUCTION_PREFIX.length);
        sendToTabOrActive(tabId, { type: "CUSTOM_INSTRUCTION", instructionId });
        return;
    }

    if (menuId === MD_VIEW_MENU_ID) {
        const candidate = (info as any).linkUrl || (info as any).pageUrl;
        const url = typeof candidate === "string" ? candidate : null;
        if (url && isMarkdownUrl(url)) {
            void openMarkdownInViewer(url, tabId ?? 0);
            return;
        }
        openViewer(url, tabId);
        return;
    }

    sendToTabOrActive(tabId, { type: menuId });
});

chrome.webNavigation?.onCommitted?.addListener?.((details) => {
    // Auto-open markdown URLs. The service worker fetches & normalizes to get actual markdown bytes (not HTML).
    if (details.frameId !== 0) return;
    const { tabId, url } = details;
    if (!isMarkdownUrl(url)) return;
    if (url.startsWith(VIEWER_ORIGIN)) return;
    if (url.startsWith("file:")) return; // handled onCompleted (needs tab access)
    void openMarkdownInViewer(url, tabId);
});

chrome.webNavigation?.onCompleted?.addListener?.((details) => {
    // For file:// markdown files, fetching from an extension page is often blocked.
    // Read the tab text and pass it via storage.session.
    (async () => {
        if (details.frameId !== 0) return;
        const { tabId, url } = details;
        if (!isMarkdownUrl(url)) return;
        if (url.startsWith(VIEWER_ORIGIN)) return;
        if (!url.startsWith("file:")) return;

        const text = await tryReadMarkdownFromTab(tabId, url);
        const key = text ? await putMarkdownToSession(text) : null;
        openViewer(url, tabId, key);
    })().catch(console.warn.bind(console));
});

// Screen capture for CRX-SNIP image processing using chrome.tabCapture
const captureScreenArea = async (options?: {
    rect?: { x: number; y: number; width: number; height: number };
    scale?: number;
}): Promise<ArrayBuffer | null> => {
    try {
        console.log('[CRX-SNIP] Starting screen capture...', options);

        // Get the active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (!activeTab?.id) {
            throw new Error('No active tab found');
        }

        // Capture the visible tab area with optional rect and scale
        const captureOptions: chrome.tabs.CaptureVisibleTabOptions = {
            format: 'png',
            quality: 100
        };

        // Add rect if provided (for partial screen capture)
        if (options?.rect) {
            captureOptions.rect = options.rect;
        }

        // Add scale if provided (default to 1 to avoid scaling issues)
        if (options?.scale !== undefined) {
            captureOptions.scale = options.scale;
        } else {
            // Default to scale: 1 to prevent scaling problems
            captureOptions.scale = 1;
        }

        const screenshot = await chrome.tabs.captureVisibleTab(
            activeTab.windowId,
            captureOptions
        );

        // Convert base64 data URL to ArrayBuffer
        const base64Data = screenshot.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const arrayBuffer = bytes.buffer;

        console.log('[CRX-SNIP] Screen capture completed, size:', arrayBuffer.byteLength);
        return arrayBuffer;

    } catch (error) {
        console.error('[CRX-SNIP] Screen capture failed:', error);

        // If tab capture fails, try desktop capture as fallback
        try {
            console.log('[CRX-SNIP] Trying desktop capture as fallback...');

            const streamId = await new Promise<string>((resolve, reject) => {
                chrome.desktopCapture.chooseDesktopMedia(
                    ['screen', 'window'],
                    { frameRate: 1 }, // Lower frame rate for screenshot
                    (streamId, options) => {
                        if (streamId) {
                            resolve(streamId);
                        } else {
                            reject(new Error('Desktop capture cancelled'));
                        }
                    }
                );
            });

            // For desktop capture, we need an offscreen document to process the stream
            const offscreenUrl = chrome.runtime.getURL('offscreen/capture.html');

            // Create offscreen document if it doesn't exist
            const existingContexts = await chrome.runtime.getContexts({
                contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
            });

            if (existingContexts.length === 0) {
                await chrome.offscreen.createDocument({
                    url: offscreenUrl,
                    reasons: [chrome.offscreen.Reason.USER_MEDIA],
                    justification: 'Screen capture for CRX-Snip image processing'
                });
            }

            // Send message to offscreen document to capture
            const response = await chrome.runtime.sendMessage({
                type: 'capture-desktop',
                streamId: streamId
            });

            if (response?.success && response?.imageData) {
                return response.imageData;
            }

            throw new Error('Offscreen capture failed');

        } catch (fallbackError) {
            console.error('[CRX-SNIP] Desktop capture fallback failed:', fallbackError);
            return null;
        }
    }
};

// CRX-SNIP: Background processing without opening PWA
const processCrxSnip = async (content: string | ArrayBuffer, contentType: string = 'text') => {
    try {
        const isImage = contentType === 'image' || content instanceof ArrayBuffer;
        console.log('[CRX-SNIP] Processing', isImage ? 'image' : 'text', 'content in background');

        let processedContent: string | ArrayBuffer = content;
        let finalContentType = contentType;

        // If it's image data (ArrayBuffer), we need to process it for recognition
        if (isImage && content instanceof ArrayBuffer) {
            try {
                console.log('[CRX-SNIP] Processing image for recognition...');

                // Convert ArrayBuffer to blob for processing
                const blob = new Blob([content], { type: 'image/png' });

                // Use the image recognition functionality
                const recognitionResult = await recognizeImageData(blob);
                processedContent = recognitionResult.text || '';
                finalContentType = 'text'; // Recognition output is text

                console.log('[CRX-SNIP] Image recognition result:', processedContent.substring(0, 100) + '...');
            } catch (recognitionError) {
                console.warn('[CRX-SNIP] Image recognition failed:', recognitionError);
                return { success: false, error: 'Image recognition failed' };
            }
        }

        // Create the processing input
        const input: ActionInput = {
            type: 'process',
            content: processedContent,
            contentType: finalContentType as any,
            metadata: {
                source: 'crx-snip',
                timestamp: Date.now(),
                background: true,
                originalType: contentType // Keep track of original input type
            }
        };

        // Process through execution core
        const result = await processChromeExtensionAction(input);

        if (result.success && result.result) {
            // Write result to clipboard if enabled in settings
            const settings = await loadSettings();
            const writeToClipboard = settings?.processing?.writeToClipboard ?? true;

            if (writeToClipboard && typeof result.result === 'string') {
                try {
                    await navigator.clipboard.writeText(result.result);
                    console.log('[CRX-SNIP] Result written to clipboard');
                } catch (clipboardError) {
                    console.warn('[CRX-SNIP] Failed to write to clipboard:', clipboardError);
                }
            }

            // Send to associated destination (workcenter) without opening PWA
            // This uses the unified messaging system to attach content
            try {
                // Import the unified messaging system
                const { unifiedMessaging } = await import('@rs-com/core/UnifiedMessaging');

                await unifiedMessaging.sendMessage({
                    id: crypto.randomUUID(),
                    type: 'content-share',
                    source: 'crx-snip',
                    destination: 'basic-workcenter',
                    contentType: 'text',
                    data: {
                        text: result.result,
                        processed: true,
                        source: 'crx-snip'
                    },
                    metadata: {
                        title: 'CRX-Snip Result',
                        timestamp: Date.now(),
                        source: 'crx-snip'
                    }
                });

                console.log('[CRX-SNIP] Result sent to workcenter');
            } catch (messagingError) {
                console.warn('[CRX-SNIP] Failed to send to workcenter:', messagingError);
            }

            return { success: true, result: result.result };
        } else {
            console.warn('[CRX-SNIP] Processing failed:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('[CRX-SNIP] Background processing error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
};

// Context menu for CRX-SNIP processing
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "crx-snip-text",
        title: "Process Text with CrossWord (CRX-Snip)",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "crx-snip-screen",
        title: "Capture & Process Screen Area (CRX-Snip)",
        contexts: ["page", "frame", "editable"]
    });
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "crx-snip-text") {
        // Get the active tab and try to get selected text
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            try {
                // Execute script to get selected text
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => window.getSelection()?.toString() || ''
                });

                const selectedText = results[0]?.result || '';
                if (selectedText) {
                    console.log('[CRX-SNIP] Text keyboard shortcut triggered with selection:', selectedText.substring(0, 100) + '...');

                    const result = await processCrxSnipWithPipeline(selectedText, 'text');

                    // Show notification
                    if (result.success) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon.png',
                            title: 'CrossWord CRX-Snip',
                            message: 'Text processed and copied to clipboard!'
                        });
                    } else {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon.png',
                            title: 'CrossWord CRX-Snip',
                            message: `Text processing failed: ${result.error || 'Unknown error'}`
                        });
                    }
                } else {
                    // No selection, show instruction
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon.png',
                        title: 'CrossWord CRX-Snip',
                        message: 'Please select some text first, then use Ctrl+Shift+X'
                    });
                }
            } catch (error) {
                console.error('[CRX-SNIP] Failed to get selected text:', error);
            }
        }
    } else if (command === "crx-snip-screen") {
        console.log('[CRX-SNIP] Screen capture keyboard shortcut triggered');

        try {
            // Capture screen area
            const imageData = await captureScreenArea();

            if (imageData) {
                // Process the captured image with CRX-SNIP pipeline
                const result = await processCrxSnipWithPipeline(imageData, 'image');

                // Show notification
                if (result.success) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon.png',
                        title: 'CrossWord CRX-Snip',
                        message: 'Screen area processed and copied to clipboard!'
                    });
                } else {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon.png',
                        title: 'CrossWord CRX-Snip',
                        message: `Screen processing failed: ${result.error || 'Unknown error'}`
                    });
                }
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: 'Screen capture was cancelled'
                });
            }
        } catch (error) {
            console.error('[CRX-SNIP] Screen capture processing failed:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: 'Screen capture processing failed'
            });
        }
    }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "crx-snip-text" && info.selectionText) {
        console.log('[CRX-SNIP] Context menu triggered with text selection:', info.selectionText.substring(0, 100) + '...');

        // Process the selected text with CRX-SNIP
        const result = await processCrxSnipWithPipeline(info.selectionText, 'text');

        // Show notification of result
        if (result.success) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: 'Text processed and copied to clipboard!'
            });
        } else {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: `Text processing failed: ${result.error || 'Unknown error'}`
            });
        }
    } else if (info.menuItemId === "crx-snip-screen") {
        console.log('[CRX-SNIP] Context menu triggered for screen capture');

        try {
            // Capture screen area
            const imageData = await captureScreenArea();

            if (imageData) {
                // Process the captured image with CRX-SNIP
                const result = await processCrxSnipWithPipeline(imageData, 'image');

                // Show notification of result
                if (result.success) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon.png',
                        title: 'CrossWord CRX-Snip',
                        message: 'Screen area processed and copied to clipboard!'
                    });
                } else {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon.png',
                        title: 'CrossWord CRX-Snip',
                        message: `Screen processing failed: ${result.error || 'Unknown error'}`
                    });
                }
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'CrossWord CRX-Snip',
                    message: 'Screen capture was cancelled'
                });
            }
        } catch (error) {
            console.error('[CRX-SNIP] Screen capture processing failed:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'CrossWord CRX-Snip',
                message: 'Screen capture processing failed'
            });
        }
    }
});

// Viewer asks the service worker to fetch markdown with host permissions + URL normalization.
// Also handles CRX-SNIP processing requests.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
        // Handle CRX-SNIP processing
        if (message?.type === "crx-snip") {
            const content = message?.content;
            const contentType = typeof message?.contentType === "string" ? message.contentType : "text";

            if (!content) {
                sendResponse({ success: false, error: "missing content" });
                return;
            }

            const result = await processCrxSnipWithPipeline(content, contentType);
            sendResponse(result);
            return;
        }

        // Handle CRX-SNIP screen capture trigger from popup
        if (message?.type === "crx-snip-screen-capture") {
            try {
                console.log('[CRX-SNIP] Screen capture triggered from popup');

                // Check if rect coordinates were provided
                let captureOptions;
                if (message.rect) {
                    captureOptions = {
                        rect: message.rect,
                        scale: message.scale || 1
                    };
                }

                // Capture screen area (with optional rect)
                const imageData = await captureScreenArea(captureOptions);

                if (imageData) {
                    // Process the captured image with CRX-SNIP
                    const result = await processCrxSnipWithPipeline(imageData, 'image');

                    // Send response back (though popup is closed, notifications will show)
                    sendResponse({ success: result.success, error: result.error });
                } else {
                    sendResponse({ success: false, error: "Screen capture cancelled" });
                }
            } catch (error) {
                console.error('[CRX-SNIP] Screen capture from popup failed:', error);
                sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
            }
            return;
        }

        // Handle CRX pipeline management queries
        if (message?.type === "crx-pipeline-status") {
            const status = getPipelineStatus();
            sendResponse({ success: true, status });
            return;
        }

        if (message?.type === "crx-pipeline-pending") {
            const destinationType = message?.destinationType;
            const pending = getPendingResults(destinationType);
            sendResponse({ success: true, pending });
            return;
        }

        if (message?.type === "crx-pipeline-clear-completed") {
            const clearedCount = clearCompletedResults();
            sendResponse({ success: true, clearedCount });
            return;
        }

        if (message?.type === "crx-result-send-to-destination") {
            const { resultId, destination } = message;
            if (!resultId || !destination) {
                sendResponse({ success: false, error: "Missing resultId or destination" });
                return;
            }

            try {
                // Find the result in the queue
                const pendingResult = crxResultPipeline.resultQueue.find(r => r.id === resultId);
                if (!pendingResult) {
                    sendResponse({ success: false, error: "Result not found" });
                    return;
                }

                // Add the new destination
                pendingResult.destinations.push(destination);
                if (pendingResult.status === 'completed') {
                    pendingResult.status = 'pending'; // Re-queue for new destination
                }

                sendResponse({ success: true, resultId });
            } catch (error) {
                sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
            }
            return;
        }

        // Handle markdown loading (existing functionality)
        if (message?.type !== "md:load") return;
        const src = typeof message?.src === "string" ? message.src : "";
        if (!src) {
            sendResponse({ ok: false, error: "missing src" });
            return;
        }
        const fetched = await fetchMarkdownText(src);
        const key = fetched.ok && fetched.text ? await putMarkdownToSession(fetched.text) : null;
        sendResponse({ ok: fetched.ok, status: fetched.status, src: fetched.src, key });
    })().catch((e) => {
        console.warn(e);
        sendResponse({ ok: false, error: String(e) });
    });
    return true;
});
