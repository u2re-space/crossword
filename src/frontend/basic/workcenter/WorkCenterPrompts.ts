import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";
import type { WorkCenterTemplates } from "./WorkCenterTemplates";
import type { WorkCenterVoice } from "./WorkCenterVoice";

export class WorkCenterPrompts {
    private container: HTMLElement | null = null;
    private deps: WorkCenterDependencies;
    private templates: WorkCenterTemplates;
    private voice: WorkCenterVoice;

    constructor(dependencies: WorkCenterDependencies, templates: WorkCenterTemplates, voice: WorkCenterVoice) {
        this.deps = dependencies;
        this.templates = templates;
        this.voice = voice;
    }

    setContainer(container: HTMLElement | null): void {
        this.container = container;
    }

    // Main prompts section rendering
    renderPromptsSection(state: WorkCenterState): string {
        return `
            <div class="prompts-section">
              <div class="section-header">
                <h3>Input & Templates</h3>
                <div class="prompt-actions">
                  <button class="btn btn-icon" data-action="edit-templates" title="Edit Templates">
                    <ui-icon icon="gear" size="18" icon-style="duotone"></ui-icon>
                    <span class="btn-text">Templates</span>
                  </button>
                </div>
              </div>

              <div class="prompt-input-group">
                <div class="prompt-controls">
                  <select class="template-select">
                    <option value="">Select Template...</option>
                    ${state.promptTemplates.map(t => `<option value="${t.prompt.replace(/"/g, '&quot;')}" ${state.selectedTemplate === t.prompt ? 'selected' : ''}>${t.name}</option>`).join('')}
                  </select>
                </div>
                <textarea
                  class="prompt-input"
                  placeholder="Describe what you want to do with the attached content... (or use voice input)"
                  rows="4"
                >${state.currentPrompt}</textarea>
                <div class="prompt-actions">
                  <button class="btn voice-btn ${state.voiceRecording ? 'recording' : ''}" data-action="voice-input">
                    🎤 ${state.voiceRecording ? 'Recording...' : 'Hold for Voice'}
                  </button>
                  <button class="btn clear-btn" data-action="clear-prompt">Clear Prompt</button>
                </div>
              </div>

              <div class="action-controls">
                <div class="action-buttons">
                  <button class="btn primary action-btn" data-action="execute">
                    <ui-icon icon="brain" size="20" icon-style="duotone"></ui-icon>
                    <span class="btn-text">Process Content</span>
                  </button>
                </div>
                <label class="auto-action-label" title="Auto-action (use last successful)">
                  <input type="checkbox" class="auto-action-checkbox" ${state.autoAction ? 'checked' : ''}>
                  <ui-icon icon="lightning-a" size="20" icon-style="duotone"></ui-icon>
                </label>
              </div>
            </div>
        `;
    }

    // Update prompt input value
    updatePromptInput(state: WorkCenterState): void {
        if (!this.container) return;
        const promptInput = this.container.querySelector('.prompt-input') as HTMLTextAreaElement;
        if (promptInput) {
            promptInput.value = state.currentPrompt;
        }
    }

    // Update template select
    updateTemplateSelect(state: WorkCenterState): void {
        if (!this.container) return;
        const templateSelect = this.container.querySelector('.template-select') as HTMLSelectElement;
        if (templateSelect) {
            const currentValue = templateSelect.value;
            templateSelect.innerHTML = '<option value="">Select Template...</option>' +
                state.promptTemplates.map(t =>
                    `<option value="${t.prompt.replace(/"/g, '&quot;')}" ${state.selectedTemplate === t.prompt ? 'selected' : ''}>${t.name}</option>`
                ).join('');

            // Restore the selected value if it still exists, otherwise keep current
            if (state.selectedTemplate && state.promptTemplates.some(t => t.prompt === state.selectedTemplate)) {
                templateSelect.value = state.selectedTemplate;
            } else {
                templateSelect.value = currentValue;
            }
        }
    }

    // Update voice button state
    updateVoiceButton(state: WorkCenterState): void {
        if (!this.container) return;
        const voiceBtn = this.container.querySelector('[data-action="voice-input"]') as HTMLButtonElement;
        if (voiceBtn) {
            voiceBtn.textContent = state.voiceRecording ? '🎤 Recording...' : '🎤 Hold for Voice';
            voiceBtn.classList.toggle('recording', state.voiceRecording);
        }
    }

    // Clear prompt
    clearPrompt(state: WorkCenterState): void {
        state.currentPrompt = '';
        this.updatePromptInput(state);
    }

    // Handle template selection
    handleTemplateSelection(state: WorkCenterState, selectedPrompt: string): void {
        state.selectedTemplate = selectedPrompt;

        // Always apply the selected template - templates are meant to provide structured prompts
        // Users can modify them after selection if needed
        if (selectedPrompt) {
            state.currentPrompt = selectedPrompt;
            this.updatePromptInput(state);
        }
    }

    // Handle auto action toggle
    handleAutoActionToggle(state: WorkCenterState, checked: boolean): void {
        state.autoAction = checked;
    }
}