import { getWorkCenterComm } from "../../shared/AppCommunicator";
import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";
import type { WorkCenterFileOps } from "./WorkCenterFileOps";

export class WorkCenterShareTarget {
    private deps: WorkCenterDependencies;
    private fileOps: WorkCenterFileOps;
    private workCenterComm = getWorkCenterComm();

    constructor(dependencies: WorkCenterDependencies, fileOps: WorkCenterFileOps) {
        this.deps = dependencies;
        this.fileOps = fileOps;
    }

    initShareTargetListener(state: WorkCenterState): void {
        // The WorkCenterCommunicator handles the BroadcastChannel setup
        // We just need to set up our message processing
        console.log('[WorkCenter] Share target result listener initialized via WorkCenterComm');
    }

    async processQueuedMessages(state: WorkCenterState): Promise<void> {
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
        }
    }

    private addShareTargetResult(state: WorkCenterState, resultData: any): void {
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
        const { addProcessedStep } = require('./WorkCenterState');
        addProcessedStep(state, processedEntry);

        // Save state
        const { saveState } = require('./WorkCenterState');
        saveState(state);

        // Show notification
        this.deps.showMessage?.(`Share target result added to work center`);
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
                    // Try to decode base64 data
                    const binaryString = atob(inputData.base64Data.split(',')[1] || inputData.base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    let mimeType = 'application/octet-stream';
                    let filename = 'shared-data.bin';

                    // Try to determine MIME type and filename from data URL
                    if (inputData.base64Data.startsWith('data:')) {
                        const dataUrlMatch = inputData.base64Data.match(/^data:([^;]+);base64,/);
                        if (dataUrlMatch) {
                            mimeType = dataUrlMatch[1];
                            // Generate filename based on MIME type
                            if (mimeType.startsWith('image/')) {
                                filename = `shared-image.${mimeType.split('/')[1]}`;
                            } else if (mimeType.startsWith('text/')) {
                                filename = `shared-text.${mimeType.split('/')[1]}`;
                            } else {
                                filename = `shared-data.${mimeType.split('/')[1] || 'bin'}`;
                            }
                        }
                    }

                    const base64Blob = new Blob([bytes], { type: mimeType });
                    const base64File = new File([base64Blob], filename, { type: mimeType });
                    state.files.push(base64File);
                    filesAdded++;
                } catch (error) {
                    console.warn('[WorkCenter] Failed to decode base64 data:', error);
                }
            }

            // Clear recognized data when new inputs are added
            const { clearRecognizedData } = require('./WorkCenterState');
            clearRecognizedData(state);

            // Save state
            const { saveState } = require('./WorkCenterState');
            saveState(state);

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
}