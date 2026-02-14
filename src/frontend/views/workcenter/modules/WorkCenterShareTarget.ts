import { getWorkCenterComm } from "@rs-com/core/AppCommunicator";
import { fetchCachedShareFiles } from "@rs-com/core/ShareTargetGateway";
import { normalizeDataAsset } from "fest/lure";
import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";
import type { WorkCenterFileOps } from "./WorkCenterFileOps";

export class WorkCenterShareTarget {
    private deps: WorkCenterDependencies;
    private _fileOps: WorkCenterFileOps;
    private workCenterComm = getWorkCenterComm();

    constructor(dependencies: WorkCenterDependencies, fileOps: WorkCenterFileOps) {
        this.deps = dependencies;
        this._fileOps = fileOps;
        // Keep a stable constructor contract while migration is in progress.
        void this._fileOps;
    }

    initShareTargetListener(_state: WorkCenterState): void {
        // The WorkCenterCommunicator handles the BroadcastChannel setup
        // We just need to set up our message processing
        console.log('[WorkCenter] Share target result listener initialized via WorkCenterComm');
    }

    async processQueuedMessages(_state: WorkCenterState): Promise<void> {
        try {
            // The WorkCenterCommunicator will automatically process queued messages
            // when it detects the work center is available
            console.log('[WorkCenter] Queued message processing handled by WorkCenterComm');
        } catch (error) {
            console.error('[WorkCenter] Failed to process queued messages:', error);
        }
    }

    handleShareTargetMessage(state: WorkCenterState, event: MessageEvent): void {
        const { type, data, pingId } = event.data || {};

        if (type === 'ping' && pingId) {
            // Respond to ping to indicate work center is available
            this.workCenterComm.respondToPing(pingId);
        } else if (type === 'share-target-result' && data) {
            console.log('[WorkCenter] Received share target result:', data);
            this.addShareTargetResult(state, data);
        } else if (type === 'share-target-input' && data) {
            console.log('[WorkCenter] Received share target input:', data);
            this.addShareTargetInput(state, data);
        } else if (type === 'ai-result' && data) {
            console.log('[WorkCenter] Received AI processing result:', data);
            this.handleAIResult(state, data);
        } else if (type === 'content-cached' && data) {
            console.log('[WorkCenter] Received cached content from SW:', data);
            this.handleCachedContent(state, data);
        } else if (type === 'content-received' && data) {
            console.log('[WorkCenter] Received content from SW:', data);
            this.handleReceivedContent(state, data);
        }
    }

    async addShareTargetResult(state: WorkCenterState, resultData: any): Promise<void> {
        // Add to processedData pipeline
        const processedEntry = {
            content: resultData.content || '',
            timestamp: resultData.timestamp || Date.now(),
            action: resultData.action || 'Share Target Processing',
            sourceData: resultData.rawData,
            metadata: {
                source: resultData.source || 'share-target',
                ...resultData.metadata
            }
        };

        // Import the state manager function
        const { WorkCenterStateManager } = await import('./WorkCenterState');
        WorkCenterStateManager.addProcessedStep(state, processedEntry);

        // Also set lastRawResult so output area can render/copy/view it.
        state.lastRawResult = resultData.rawData ?? resultData.content ?? null;

        // Save state
        WorkCenterStateManager.saveState(state);

        // Show notification
        this.deps.showMessage?.(`Share target result added to work center`);

        // Re-render to update output + pipeline
        this.deps.render?.();
    }

    async addShareTargetInput(state: WorkCenterState, inputData: any): Promise<void> {
        console.log('[WorkCenter] Adding share target input:', inputData);

        try {
            let filesAdded = 0;
            let textAdded = false;

            // Handle files/images from share target
            if (inputData.files && Array.isArray(inputData.files)) {
                for (const file of inputData.files) {
                    if (file instanceof File) {
                        state.files.push(file);
                        filesAdded++;
                    }
                }
            }

            // Handle text content
            if (inputData.text && typeof inputData.text === 'string' && inputData.text.trim()) {
                // Create a text file from the shared text
                const textBlob = new Blob([inputData.text], { type: 'text/plain' });
                const textFile = new File([textBlob], 'shared-text.txt', { type: 'text/plain' });
                state.files.push(textFile);
                filesAdded++;
                textAdded = true;
            }

            // Handle URLs
            if (inputData.url && typeof inputData.url === 'string') {
                // Create a text file containing the URL
                const urlBlob = new Blob([inputData.url], { type: 'text/plain' });
                const urlFile = new File([urlBlob], 'shared-url.txt', { type: 'text/plain' });
                state.files.push(urlFile);
                filesAdded++;
            }

            // Handle base64 encoded data
            if (inputData.base64Data && typeof inputData.base64Data === 'string') {
                try {
                    const asset = await normalizeDataAsset(inputData.base64Data, {
                        namePrefix: "shared",
                        uriComponent: true
                    });
                    state.files.push(asset.file);
                    filesAdded++;
                } catch (error) {
                    console.warn('[WorkCenter] Failed to decode base64 data:', error);
                }
            }

            // Clear recognized data when new inputs are added
            const { WorkCenterStateManager: StateManager } = await import('./WorkCenterState');
            StateManager.clearRecognizedData(state);

            // Save state
            StateManager.saveState(state);

            // Notify about file changes for toolbar updates
            if (filesAdded > 0 || textAdded) {
                this.deps.onFilesChanged?.();
            }

            // Show notification
            let message = '';
            if (filesAdded > 0) {
                message += `${filesAdded} file(s) added to work center`;
            }
            if (textAdded) {
                message += (message ? ' and ' : '') + 'text content added';
            }
            if (message) {
                this.deps.showMessage?.(message);
            }

            // Re-render so attachment list/count reflects new inputs.
            if (filesAdded > 0 || textAdded) {
                this.deps.render?.();
            }

        } catch (error) {
            console.error('[WorkCenter] Failed to add share target input:', error);
            this.deps.showMessage?.('Failed to add share target input');
        }
    }

    sendShareTargetResult(resultData: any): void {
        try {
            this.workCenterComm.sendMessage('share-target-result', resultData, { priority: 'high' });
        } catch (error) {
            console.error('[WorkCenter] Failed to send share target result:', error);
        }
    }

    sendShareTargetInput(inputData: any): void {
        try {
            this.workCenterComm.sendMessage('share-target-input', inputData, { priority: 'high' });
        } catch (error) {
            console.error('[WorkCenter] Failed to send share target input:', error);
        }
    }

    private async handleCachedContent(state: WorkCenterState, data: any): Promise<void> {
        const { cacheKey, context, content } = data;

        if (context === 'share-target' && content) {
            console.log('[WorkCenter] Processing cached share-target content:', content);

            // Add the content to work center
            await this.addShareTargetInput(state, content);

            // Try to retrieve additional cached files if any
            await this.retrieveCachedFiles(state, cacheKey);
        }
    }

    private async handleReceivedContent(state: WorkCenterState, data: any): Promise<void> {
        const { content, context } = data;

        if (context === 'share-target' && content) {
            console.log('[WorkCenter] Processing received share-target content:', content);

            // Add the content to work center
            await this.addShareTargetInput(state, content);
        }
    }

    async handleAIResult(state: WorkCenterState, resultData: any): Promise<void> {
        const { success, data, error } = resultData;

        if (!success) {
            console.warn('[WorkCenter] AI processing failed:', error);
            this.deps.showMessage?.('AI processing failed: ' + (error || 'Unknown error'));
            return;
        }

        if (!data) {
            console.warn('[WorkCenter] No data in AI result');
            return;
        }

        console.log('[WorkCenter] Adding AI processing result to work center');

        try {
            // Add to processedData pipeline as an AI processing result
            const processedEntry = {
                content: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
                timestamp: Date.now(),
                action: 'AI Processing (Share Target)',
                sourceData: { aiResult: data, source: 'share-target' },
                metadata: {
                    source: 'share-target-ai',
                    processingType: 'ai',
                    resultType: typeof data
                }
            };

            // Import the state manager function
            const { WorkCenterStateManager } = await import('./WorkCenterState');
            WorkCenterStateManager.addProcessedStep(state, processedEntry);

            // Set last result for output actions
            state.lastRawResult = data;

            // Save state
            WorkCenterStateManager.saveState(state);

            // Re-render to show output/pipeline updates
            this.deps.render?.();

            // Show notification
            this.deps.showMessage?.('AI processing result added to work center');

            // Trigger UI update if needed
            if (this.deps.render) {
                this.deps.render();
            }

        } catch (error) {
            console.error('[WorkCenter] Failed to add AI result:', error);
            this.deps.showMessage?.('Failed to add AI processing result');
        }
    }

    private async retrieveCachedFiles(state: WorkCenterState, cacheKey: string): Promise<void> {
        try {
            const files = await fetchCachedShareFiles(cacheKey || "latest");
            if (files.length > 0) {
                for (const file of files) {
                    console.log("[WorkCenter] Adding cached file:", file.name);
                    state.files.push(file);
                }
                this.deps.onFilesChanged?.();
                this.deps.showMessage?.(`Added ${files.length} cached file(s) from share-target`);
            }
        } catch (error) {
            console.warn('[WorkCenter] Failed to retrieve cached files:', error);
        }
    }
}