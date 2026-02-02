import { H, M } from "fest/lure";
import { observe } from "fest/object";
import { loadSettings, saveSettings } from "@rs-com/config/Settings";
import type { CustomInstruction, AppSettings } from "@rs-com/config/SettingsTypes";
import {
    getCustomInstructions,
    addInstruction,
    addInstructions,
    updateInstruction,
    deleteInstruction,
    setActiveInstruction,
    DEFAULT_INSTRUCTION_TEMPLATES
} from "@rs-com/service/misc/CustomInstructions";
import { showSuccess, showError } from "./Toast";

export type CustomInstructionsPanelOptions = {
    onUpdate?: () => void;
};

type PanelState = {
    instructions: CustomInstruction[];
    activeId: string;
    editingId: string | null;
    isAdding: boolean;
};

export const createCustomInstructionsPanel = (opts: CustomInstructionsPanelOptions = {}): HTMLElement => {
    const state = observe<PanelState>({
        instructions: [],
        activeId: "",
        editingId: null,
        isAdding: false
    });

    const root = H`<div class="custom-instructions-panel">
        <div class="cip-select-row">
            <label class="field-label">Active instruction</label>
            <select class="field-control cip-select" data-action="select-active">
                <option value="">None (use default)</option>
            </select>
        </div>

        <div class="cip-list" data-list></div>

        <div class="cip-add-form" data-add-form hidden>
            <input type="text" class="field-control cip-input" data-field="label" placeholder="Instruction label..." />
            <textarea class="field-control cip-textarea" data-field="instruction" placeholder="Enter your custom instruction..." rows="4"></textarea>
            <div class="cip-form-actions">
                <button class="btn btn-primary btn-sm" type="button" data-action="save-new">Add</button>
                <button class="btn btn-sm" type="button" data-action="cancel-add">Cancel</button>
            </div>
        </div>

        <div class="cip-toolbar">
            <button class="btn btn-sm" type="button" data-action="add">
                <ui-icon icon="plus"></ui-icon>
                <span>Add Instruction</span>
            </button>
            <button class="btn btn-sm" type="button" data-action="add-templates">
                <ui-icon icon="file-text"></ui-icon>
                <span>Add Templates</span>
            </button>
        </div>
    </div>` as HTMLElement;

    const listEl = root.querySelector("[data-list]") as HTMLElement;
    const selectEl = root.querySelector("[data-action='select-active']") as HTMLSelectElement;
    const addFormEl = root.querySelector("[data-add-form]") as HTMLElement;
    const labelInput = root.querySelector("[data-field='label']") as HTMLInputElement;
    const instructionInput = root.querySelector("[data-field='instruction']") as HTMLTextAreaElement;

    const renderList = () => {
        listEl.replaceChildren();

        if (!state.instructions.length) {
            listEl.append(H`<div class="cip-empty">No custom instructions defined.</div>` as HTMLElement);
            return;
        }

        for (const instr of state.instructions) {
            const isEditing = state.editingId === instr.id;
            const isActive = state.activeId === instr.id;

            const item = H`<div class="cip-item ${isActive ? "is-active" : ""}" data-id="${instr.id}">
                <div class="cip-item-header">
                    <span class="cip-item-label">${instr.label}</span>
                    <div class="cip-item-actions">
                        ${isActive
                            ? H`<span class="cip-badge">Active</span>`
                            : H`<button class="btn btn-sm" type="button" data-action="activate">Use</button>`
                        }
                        <button class="btn btn-sm" type="button" data-action="edit">
                            <ui-icon icon="pencil-simple"></ui-icon>
                        </button>
                        <button class="btn btn-sm btn-danger" type="button" data-action="delete">
                            <ui-icon icon="trash"></ui-icon>
                        </button>
                    </div>
                </div>
                ${isEditing
                    ? H`<div class="cip-edit-form">
                        <input type="text" class="field-control" data-edit-field="label" value="${instr.label}" />
                        <textarea class="field-control" data-edit-field="instruction" rows="4">${instr.instruction}</textarea>
                        <div class="cip-form-actions">
                            <button class="btn btn-primary btn-sm" type="button" data-action="save-edit">Save</button>
                            <button class="btn btn-sm" type="button" data-action="cancel-edit">Cancel</button>
                        </div>
                    </div>`
                    : H`<div class="cip-item-preview">${truncate(instr.instruction, 150)}</div>`
                }
            </div>` as HTMLElement;

            item.addEventListener("click", (e) => {
                const target = e.target as HTMLElement;
                const action = target.closest("[data-action]")?.getAttribute("data-action");

                if (action === "activate") {
                    void setActiveInstruction(instr.id).then(() => {
                        state.activeId = instr.id;
                        renderList();
                        updateSelect();
                        showSuccess("Instruction activated");
                        opts.onUpdate?.();
                    });
                }

                if (action === "edit") {
                    state.editingId = instr.id;
                    renderList();
                }

                if (action === "delete") {
                    if (confirm(`Delete "${instr.label}"?`)) {
                        void deleteInstruction(instr.id).then(() => {
                            state.instructions = state.instructions.filter(i => i.id !== instr.id);
                            if (state.activeId === instr.id) state.activeId = "";
                            renderList();
                            updateSelect();
                            showSuccess("Instruction deleted");
                            opts.onUpdate?.();
                        });
                    }
                }

                if (action === "save-edit") {
                    const labelEl = item.querySelector("[data-edit-field='label']") as HTMLInputElement;
                    const instrEl = item.querySelector("[data-edit-field='instruction']") as HTMLTextAreaElement;

                    void updateInstruction(instr.id, {
                        label: labelEl.value.trim() || instr.label,
                        instruction: instrEl.value.trim()
                    }).then(() => {
                        instr.label = labelEl.value.trim() || instr.label;
                        instr.instruction = instrEl.value.trim();
                        state.editingId = null;
                        renderList();
                        updateSelect();
                        showSuccess("Instruction updated");
                        opts.onUpdate?.();
                    });
                }

                if (action === "cancel-edit") {
                    state.editingId = null;
                    renderList();
                }
            });

            listEl.append(item);
        }
    };

    const updateSelect = () => {
        selectEl.replaceChildren();
        selectEl.append(H`<option value="">None (use default)</option>` as HTMLOptionElement);

        for (const instr of state.instructions) {
            const opt = H`<option value="${instr.id}">${instr.label}</option>` as HTMLOptionElement;
            if (instr.id === state.activeId) opt.selected = true;
            selectEl.append(opt);
        }
    };

    const truncate = (text: string, maxLen: number): string => {
        if (!text || text.length <= maxLen) return text || "";
        return text.slice(0, maxLen).trim() + "…";
    };

    const loadData = async () => {
        const settings = await loadSettings();
        state.instructions = settings?.ai?.customInstructions || [];
        state.activeId = settings?.ai?.activeInstructionId || "";
        renderList();
        updateSelect();
    };

    root.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const action = target.closest("[data-action]")?.getAttribute("data-action");

        if (action === "add") {
            state.isAdding = true;
            addFormEl.hidden = false;
            labelInput.value = "";
            instructionInput.value = "";
            labelInput.focus();
        }

        if (action === "cancel-add") {
            state.isAdding = false;
            addFormEl.hidden = true;
        }

        if (action === "save-new") {
            const label = labelInput.value.trim();
            const instruction = instructionInput.value.trim();

            if (!instruction) {
                instructionInput.focus();
                showError("Instruction text is required");
                return;
            }

            void addInstruction(label || "Custom", instruction).then((newInstr) => {
                state.instructions.push(newInstr);
                state.isAdding = false;
                addFormEl.hidden = true;
                renderList();
                updateSelect();
                showSuccess("Instruction added");
                opts.onUpdate?.();
            });
        }

        if (action === "add-templates") {
            const existingLabels = new Set(state.instructions.map(i => i.label));
            const templatesToAdd = DEFAULT_INSTRUCTION_TEMPLATES.filter(t => !existingLabels.has(t.label));

            if (!templatesToAdd.length) {
                showError("All templates already added");
                return;
            }

            // Use bulk add to avoid race conditions
            addInstructions(templatesToAdd.map(t => ({
                label: t.label,
                instruction: t.instruction,
                enabled: t.enabled
            }))).then((newInstrs) => {
                state.instructions.push(...newInstrs);
                renderList();
                updateSelect();
                showSuccess(`Added ${newInstrs.length} templates`);
                opts.onUpdate?.();
            });
        }
    });

    selectEl.addEventListener("change", () => {
        const newActiveId = selectEl.value || "";
        void setActiveInstruction(newActiveId || null).then(() => {
            state.activeId = newActiveId;
            renderList();
            if (newActiveId) {
                showSuccess("Instruction activated");
            }
            opts.onUpdate?.();
        });
    });

    void loadData();

    return root;
};
