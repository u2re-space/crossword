import { H } from "fest/lure";
import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";

export class WorkCenterTemplates {
    private deps: WorkCenterDependencies;

    constructor(dependencies: WorkCenterDependencies) {
        this.deps = dependencies;
    }

    showTemplateEditor(state: WorkCenterState, container: HTMLElement): void {
        const modal = H`<div class="template-editor-modal">
      <div class="modal-content">
        <h3>Prompt Templates</h3>
        <div class="template-list">
          ${state.promptTemplates.map((template, index) =>
            H`<div class="template-item">
              <input type="text" class="template-name" value="${template.name}" data-index="${index}">
              <textarea class="template-prompt" data-index="${index}">${template.prompt}</textarea>
              <button class="btn small remove-template" data-index="${index}">Remove</button>
            </div>`
        )}
        </div>
        <div class="modal-actions">
          <button class="btn" data-action="add-template">Add Template</button>
          <button class="btn primary" data-action="save-templates">Save</button>
          <button class="btn" data-action="close-editor">Close</button>
        </div>
      </div>
    </div>` as HTMLElement;

        // Template editor events
        modal.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const action = target.getAttribute('data-action');
            const index = target.getAttribute('data-index');

            if (action === 'add-template') {
                this.addTemplate(state);
                modal.remove();
                this.showTemplateEditor(state, container);
            } else if (action === 'save-templates') {
                await this.saveTemplates(state, modal);
                modal.remove();
                this.deps.render?.();
            } else if (action === 'close-editor') {
                modal.remove();
            } else if (target.classList.contains('remove-template') && index) {
                this.removeTemplate(state, parseInt(index));
                modal.remove();
                this.showTemplateEditor(state, container);
            }
        });

        container.append(modal);
    }

    private addTemplate(state: WorkCenterState): void {
        state.promptTemplates.push({ name: 'New Template', prompt: 'Enter your prompt here...' });
    }

    private removeTemplate(state: WorkCenterState, index: number): void {
        if (index >= 0 && index < state.promptTemplates.length) {
            state.promptTemplates.splice(index, 1);
        }
    }

    private async saveTemplates(state: WorkCenterState, modal: HTMLElement): Promise<void> {
        // Update templates from inputs
        const nameInputs = modal.querySelectorAll('.template-name');
        const promptInputs = modal.querySelectorAll('.template-prompt');

        state.promptTemplates = Array.from(nameInputs).map((input, i) => ({
            name: (input as HTMLInputElement).value,
            prompt: (promptInputs[i] as HTMLTextAreaElement).value
        }));

        // Save to localStorage
        const { WorkCenterStateManager } = await import('./WorkCenterState');
        WorkCenterStateManager.savePromptTemplates(state.promptTemplates);

        this.deps.showMessage?.('Templates saved');
    }

    selectTemplate(state: WorkCenterState, prompt: string): void {
        state.selectedTemplate = prompt;
        // Always apply the selected template - templates are meant to provide structured prompts
        // Users can modify them after selection if needed
        if (prompt) {
            state.currentPrompt = prompt;
        }
    }

    getTemplateByPrompt(state: WorkCenterState, prompt: string): { name: string, prompt: string } | undefined {
        return state.promptTemplates.find(t => t.prompt === prompt);
    }

    hasTemplate(state: WorkCenterState, prompt: string): boolean {
        return state.promptTemplates.some(t => t.prompt === prompt);
    }
}