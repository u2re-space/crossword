import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";

export class WorkCenterFileOps {
    private deps: WorkCenterDependencies;

    constructor(dependencies: WorkCenterDependencies) {
        this.deps = dependencies;
    }

    async handleDroppedContent(state: WorkCenterState, content: string, sourceType: string): Promise<void> {
        return this.handlePastedContent(state, content, sourceType);
    }

    async handlePastedContent(state: WorkCenterState, content: string, sourceType: string): Promise<void> {
        try {
            // Check if content is a URL
            if (this.isValidUrl(content)) {
                const urlBlob = new Blob([content], { type: 'text/plain' });
                const urlFile = new File([urlBlob], 'pasted-url.txt', { type: 'text/plain' });
                state.files.push(urlFile);

                // Update UI if work center is currently rendered
                this.deps.showMessage?.('URL added to work center');
            }
            // Check if content is base64 encoded data
            else if (this.isBase64Data(content)) {
                await this.handleBase64Content(state, content);
            }
            // Regular text content
            else {
                const textBlob = new Blob([content], { type: 'text/plain' });
                const textFile = new File([textBlob], `pasted-${sourceType}.txt`, { type: 'text/plain' });
                state.files.push(textFile);

                // Update UI if work center is currently rendered
                this.deps.showMessage?.(`${sourceType === 'html' ? 'HTML' : 'Text'} content added to work center`);
            }
        } catch (error) {
            console.error('[WorkCenter] Failed to handle pasted content:', error);
            this.deps.showMessage?.('Failed to process pasted content');
        }
    }

    private isValidUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    private isBase64Data(content: string): boolean {
        // Check for data URL format: data:[<mime type>][;charset=<charset>][;base64],<encoded data>
        if (content.startsWith('data:')) {
            return true;
        }

        // Check for plain base64 (contains only base64 characters and is reasonably long)
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        return content.length > 20 && base64Regex.test(content.replace(/\s/g, ''));
    }

    private async handleBase64Content(state: WorkCenterState, content: string): Promise<void> {
        try {
            let mimeType = 'application/octet-stream';
            let filename = 'pasted-data.bin';
            let base64Data = content;

            // Handle data URLs
            if (content.startsWith('data:')) {
                const dataUrlMatch = content.match(/^data:([^;]+);base64,/);
                if (dataUrlMatch) {
                    mimeType = dataUrlMatch[1];
                    base64Data = content.split(',')[1];

                    // Generate appropriate filename based on MIME type
                    if (mimeType.startsWith('image/')) {
                        filename = `pasted-image.${mimeType.split('/')[1]}`;
                    } else if (mimeType.startsWith('text/')) {
                        filename = `pasted-text.${mimeType.split('/')[1]}`;
                    } else {
                        filename = `pasted-data.${mimeType.split('/')[1] || 'bin'}`;
                    }
                }
            }

            // Decode base64
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: mimeType });
            const file = new File([blob], filename, { type: mimeType });
            state.files.push(file);

            this.deps.showMessage?.('Base64 content decoded and added to work center');

        } catch (error) {
            console.error('[WorkCenter] Failed to decode base64 content:', error);
            // Fallback: treat as regular text
            const textBlob = new Blob([content], { type: 'text/plain' });
            const textFile = new File([textBlob], 'pasted-base64.txt', { type: 'text/plain' });
            state.files.push(textFile);

            this.deps.showMessage?.('Base64 content added as text to work center');
        }
    }

    addFilesFromInput(state: WorkCenterState, files: FileList): void {
        const fileArray = Array.from(files);
        state.files.push(...fileArray);
    }

    removeFile(state: WorkCenterState, index: number): File | null {
        if (index >= 0 && index < state.files.length) {
            return state.files.splice(index, 1)[0];
        }
        return null;
    }

    clearAllFiles(state: WorkCenterState): File[] {
        const files = [...state.files];
        state.files.length = 0;
        return files;
    }

    getFilesForProcessing(state: WorkCenterState): File[] {
        return [...state.files];
    }

    hasFiles(state: WorkCenterState): boolean {
        return state.files.length > 0;
    }

    hasTextFiles(state: WorkCenterState): boolean {
        return state.files.some(f =>
            f.type.startsWith('text/') ||
            f.type === 'application/markdown' ||
            f.name?.endsWith('.md') ||
            f.name?.endsWith('.txt')
        );
    }

    determineRecognizedFormat(state: WorkCenterState): 'markdown' | 'html' | 'text' | 'json' | 'xml' | 'other' {
        const hasTextFile = this.hasTextFiles(state);
        if (!hasTextFile) {
            // For images and other files, default to markdown
            return 'markdown';
        } else {
            // For text files, we could potentially detect format from content
            // For now, default to markdown (can contain markdown)
            return 'markdown';
        }
    }

    validateFileForUpload(file: File): { valid: boolean; reason?: string } {
        // Check file size (limit to 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return { valid: false, reason: 'File too large (max 50MB)' };
        }

        // Check file type
        const allowedTypes = [
            'image/', 'text/', 'application/pdf', 'application/json',
            'application/markdown', 'application/xml'
        ];
        const isAllowed = allowedTypes.some(type =>
            file.type.startsWith(type) || file.name.toLowerCase().endsWith(type.replace('application/', '.'))
        );

        if (!isAllowed) {
            return { valid: false, reason: 'File type not supported' };
        }

        return { valid: true };
    }
}