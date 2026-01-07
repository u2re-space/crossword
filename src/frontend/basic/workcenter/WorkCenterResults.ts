import { H } from "fest/lure";
import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";
import type { WorkCenterDataProcessing } from "./WorkCenterDataProcessing";

export class WorkCenterResults {
    private container: HTMLElement | null = null;
    private deps: WorkCenterDependencies;
    private dataProcessing: WorkCenterDataProcessing;

    constructor(dependencies: WorkCenterDependencies, dataProcessing: WorkCenterDataProcessing) {
        this.deps = dependencies;
        this.dataProcessing = dataProcessing;
    }

    setContainer(container: HTMLElement | null): void {
        this.container = container;
    }

    // Counter management methods
    updateFileCounter(state: WorkCenterState): void {
        if (!this.container) return;
        const counter = this.container.querySelector('[data-file-count] .count') as HTMLElement;
        if (counter) {
            counter.textContent = state.files.length.toString();
        }
    }

    updateDataCounters(state: WorkCenterState): void {
        if (!this.container) return;

        // Update recognized data counter
        const recognizedCounter = this.container.querySelector('.data-counter.recognized') as HTMLElement;
        if (state.recognizedData) {
            if (!recognizedCounter) {
                // Add recognized counter if it doesn't exist
                const countersContainer = this.container.querySelector('.file-counters');
                if (countersContainer) {
                    const newCounter = H`<span class="data-counter recognized" title="Recognized data available">
                        <ui-icon icon="eye" size="14" icon-style="duotone"></ui-icon>
                    </span>` as HTMLElement;
                    countersContainer.appendChild(newCounter);
                }
            }
        } else if (recognizedCounter) {
            recognizedCounter.remove();
        }

        // Update processed data counter
        const processedCounter = this.container.querySelector('.data-counter.processed') as HTMLElement;
        if (state.processedData && state.processedData.length > 0) {
            if (processedCounter) {
                const countSpan = processedCounter.querySelector('.count') as HTMLElement;
                if (countSpan) {
                    countSpan.textContent = state.processedData.length.toString();
                }
                processedCounter.setAttribute('title', `${state.processedData.length} processing steps`);
            } else {
                // Add processed counter if it doesn't exist
                const countersContainer = this.container.querySelector('.file-counters');
                if (countersContainer) {
                    const newCounter = H`<span class="data-counter processed" title="${state.processedData.length} processing steps">
                        <ui-icon icon="cogs" size="14" icon-style="duotone"></ui-icon>
                        <span class="count">${state.processedData.length}</span>
                    </span>` as HTMLElement;
                    countersContainer.appendChild(newCounter);
                }
            }
        } else if (processedCounter) {
            processedCounter.remove();
        }
    }

    // Output display methods
    showProcessingMessage(message: string): void {
        if (!this.container) return;
        const outputContent = this.container.querySelector('[data-output]') as HTMLElement;
        if (outputContent) {
            outputContent.innerHTML = `<div class="processing">${message}</div>`;
        }
    }

    showResult(state: WorkCenterState): void {
        if (!this.container || !state.lastRawResult) return;

        const outputContent = this.container.querySelector('[data-output]') as HTMLElement;
        if (!outputContent) return;

        const formattedResult = this.dataProcessing.formatResult(state.lastRawResult, state.outputFormat);
        outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
    }

    showError(error: string): void {
        if (!this.container) return;
        const outputContent = this.container.querySelector('[data-output]') as HTMLElement;
        if (outputContent) {
            outputContent.innerHTML = `<div class="error">Error: ${error}</div>`;
        }
    }

    clearResults(): void {
        if (!this.container) return;
        const outputContent = this.container.querySelector('[data-output]') as HTMLElement;
        if (outputContent) {
            outputContent.innerHTML = '<div class="empty-results">Results cleared</div>';
        }
    }

    // Data pipeline management
    renderDataPipeline(state: WorkCenterState): HTMLElement | string {
        if (!state.recognizedData && (!state.processedData || state.processedData.length === 0)) {
            return '';
        }

        return H`<div class="data-pipeline-section">
            <div class="pipeline-header">
              <h3>Data Processing Pipeline</h3>
              <div class="pipeline-actions">
                <button class="btn btn-icon" data-action="clear-pipeline" title="Clear all data">
                  <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                </button>
              </div>
            </div>
            <div class="pipeline-steps">
              ${state.recognizedData ? H`<div class="pipeline-step recognized-step">
                <div class="step-header">
                  <ui-icon icon="eye" size="16" icon-style="duotone"></ui-icon>
                  <span class="step-title">Recognized Data</span>
                  <span class="step-time">${new Date(state.recognizedData.timestamp).toLocaleTimeString()}</span>
                  <span class="step-source">${state.recognizedData.source}</span>
                  <span class="step-format">${state.recognizedData.recognizedAs}</span>
                </div>
                <div class="step-content">
                  <div class="step-preview">${state.recognizedData.content.substring(0, 100)}${state.recognizedData.content.length > 100 ? '...' : ''}</div>
                </div>
              </div>` : ''}

              ${state.processedData ? state.processedData.map((step, index) => {
                const isShareTarget = step.metadata?.source === 'share-target';
                const icon = isShareTarget ? 'share' : 'cogs';
                const stepClass = isShareTarget ? 'pipeline-step share-target-step' : 'pipeline-step processed-step';
                return H`<div class="${stepClass}">
                <div class="step-header">
                  <ui-icon icon="${icon}" size="16" icon-style="duotone"></ui-icon>
                  <span class="step-title">Step ${index + 1}: ${step.action}</span>
                  <span class="step-time">${new Date(step.timestamp).toLocaleTimeString()}</span>
                  ${isShareTarget ? H`<span class="step-badge share-target-badge" title="Share Target Result">Share</span>` : ''}
                  <button class="btn small" data-restore-step="${index}">Use Result</button>
                </div>
                <div class="step-content">
                  <div class="step-preview">${step.content.substring(0, 100)}${step.content.length > 100 ? '...' : ''}</div>
                </div>
              </div>`;
              }) : ''}
            </div>
          </div>`;
    }

    updateDataPipeline(state: WorkCenterState): void {
        if (!this.container) return;

        const pipelineSection = this.container.querySelector('.data-pipeline-section');
        if (pipelineSection) {
            pipelineSection.remove();
        }

        if (state.recognizedData || (state.processedData && state.processedData.length > 0)) {
            const mainPanel = this.container.querySelector('.main-panel');
            if (mainPanel) {
                const pipelineHTML = this.renderDataPipeline(state);
                if (typeof pipelineHTML === 'string') {
                    mainPanel.insertAdjacentHTML('afterbegin', pipelineHTML);
                } else {
                    mainPanel.insertBefore(pipelineHTML, mainPanel.firstChild);
                }
            }
        }
    }

    // Status updates
    updateRecognizedStatus(state: WorkCenterState): void {
        if (!this.container) return;

        const statusElement = this.container.querySelector('.recognized-status') as HTMLElement;
        if (state.recognizedData) {
            if (!statusElement) {
                // Add recognized status if it doesn't exist
                const fileInputArea = this.container.querySelector('.file-input-area');
                if (fileInputArea) {
                    const newStatus = H`<div class="recognized-status">
                        <ui-icon icon="check-circle" size="16" icon-style="duotone" class="status-icon"></ui-icon>
                        <span>Content recognized - ready for actions</span>
                        <button class="btn small clear-recognized" data-action="clear-recognized">Clear</button>
                    </div>` as HTMLElement;
                    fileInputArea.appendChild(newStatus);
                }
            }
        } else if (statusElement) {
            statusElement.remove();
        }
    }

    // Output header rendering (counters and action buttons)
    renderOutputHeader(state: WorkCenterState): string {
        return `
            <div class="output-header">
              <h3>Results</h3>
              <div class="file-counters">
                <span class="file-counter" data-file-count>
                  <ui-icon icon="file" size="14" icon-style="duotone"></ui-icon>
                  <span class="count">${state.files.length}</span>
                </span>
                ${state.recognizedData ? `<span class="data-counter recognized" title="Recognized data available">
                  <ui-icon icon="eye" size="14" icon-style="duotone"></ui-icon>
                </span>` : ''}
                ${state.processedData && state.processedData.length > 0 ? `<span class="data-counter processed" title="${state.processedData.length} processing steps">
                  <ui-icon icon="cogs" size="14" icon-style="duotone"></ui-icon>
                  <span class="count">${state.processedData.length}</span>
                </span>` : ''}
              </div>
              <div class="output-actions">
                <button class="btn btn-icon" data-action="copy-results" title="Copy results">
                  <ui-icon icon="copy" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Copy</span>
                </button>
                <button class="btn btn-icon" data-action="clear-results" title="Clear results">
                  <ui-icon icon="trash" size="18" icon-style="duotone"></ui-icon>
                  <span class="btn-text">Clear</span>
                </button>
              </div>
            </div>
            <div class="output-content" data-output data-dropzone></div>
        `;
    }

    // Pipeline step restoration
    restorePipelineStep(state: WorkCenterState, stepIndex: number): void {
        if (!this.container) return;

        if (state.processedData && state.processedData[stepIndex]) {
            const step = state.processedData[stepIndex];
            // Restore this processing step result to the output
            const outputContent = this.container.querySelector('[data-output]') as HTMLElement;
            if (outputContent) {
                const formattedResult = this.dataProcessing.formatResult({ content: step.content }, state.outputFormat);
                outputContent.innerHTML = `<div class="result-content">${formattedResult}</div>`;
                state.lastRawResult = { data: step.content };
            }
        }
    }

    // Batch update method for efficiency
    updateAllResultsUI(state: WorkCenterState): void {
        this.updateFileCounter(state);
        this.updateDataCounters(state);
        this.updateDataPipeline(state);
        this.updateRecognizedStatus(state);
    }
}