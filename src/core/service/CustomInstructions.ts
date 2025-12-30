/*
 * Custom Instructions Service
 * Manages user-defined instructions for AI recognition operations
 */

import { loadSettings, saveSettings } from "@rs-core/config/Settings";
import type { AppSettings } from "@rs-core/config/SettingsTypes";
import {
    generateInstructionId,
    buildInstructionPrompt,
    DEFAULT_INSTRUCTION_TEMPLATES,
    type CustomInstruction
} from "./InstructionUtils";

export type { CustomInstruction };
export { buildInstructionPrompt, DEFAULT_INSTRUCTION_TEMPLATES };

const generateId = generateInstructionId;

export const getCustomInstructions = async (): Promise<CustomInstruction[]> => {
    const settings = await loadSettings();
    return settings?.ai?.customInstructions || [];
};

export const getActiveInstruction = async (): Promise<CustomInstruction | null> => {
    try {
        const settings = await loadSettings();
        const instructions = settings?.ai?.customInstructions || [];
        const activeId = settings?.ai?.activeInstructionId;

        console.log("[CustomInstructions] getActiveInstruction - activeId:", activeId);
        console.log("[CustomInstructions] getActiveInstruction - instructions count:", instructions.length);

        if (!activeId) {
            console.log("[CustomInstructions] No activeInstructionId set");
            return null;
        }

        const active = instructions.find(i => i.id === activeId);
        if (active) {
            console.log("[CustomInstructions] Found active instruction:", active.label);
        } else {
            console.warn("[CustomInstructions] activeInstructionId not found in instructions:", activeId);
            console.log("[CustomInstructions] Available IDs:", instructions.map(i => i.id));
        }

        return active || null;
    } catch (e) {
        console.error("[CustomInstructions] Error in getActiveInstruction:", e);
        return null;
    }
};

export const getActiveInstructionText = async (): Promise<string> => {
    const instruction = await getActiveInstruction();
    const text = instruction?.instruction || "";
    console.log("[CustomInstructions] getActiveInstructionText:", text ? `"${text.substring(0, 50)}..."` : "(empty)");
    return text;
};

export const setActiveInstruction = async (id: string | null): Promise<void> => {
    const settings = await loadSettings();
    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            activeInstructionId: id || ""
        }
    };
    await saveSettings(updated);
};

export const addInstruction = async (label: string, instruction: string): Promise<CustomInstruction> => {
    const settings = await loadSettings();
    const instructions = settings?.ai?.customInstructions || [];

    const newInstruction: CustomInstruction = {
        id: generateId(),
        label: label.trim() || "Untitled",
        instruction: instruction.trim(),
        enabled: true,
        order: instructions.length
    };

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: [...instructions, newInstruction]
        }
    };

    await saveSettings(updated);
    return newInstruction;
};

/**
 * Add multiple instructions at once (avoids race conditions from parallel saves)
 */
export const addInstructions = async (
    items: { label: string; instruction: string; enabled?: boolean }[]
): Promise<CustomInstruction[]> => {
    if (!items.length) return [];

    const settings = await loadSettings();
    const instructions = settings?.ai?.customInstructions || [];

    const newInstructions: CustomInstruction[] = items.map((item, index) => ({
        id: generateId(),
        label: item.label.trim() || "Untitled",
        instruction: item.instruction.trim(),
        enabled: item.enabled ?? true,
        order: instructions.length + index
    }));

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: [...instructions, ...newInstructions]
        }
    };

    await saveSettings(updated);
    return newInstructions;
};

export const updateInstruction = async (id: string, updates: Partial<Omit<CustomInstruction, "id">>): Promise<boolean> => {
    const settings = await loadSettings();
    const instructions = settings?.ai?.customInstructions || [];
    const index = instructions.findIndex(i => i.id === id);

    if (index === -1) return false;

    instructions[index] = { ...instructions[index], ...updates };

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: instructions
        }
    };

    await saveSettings(updated);
    return true;
};

export const deleteInstruction = async (id: string): Promise<boolean> => {
    const settings = await loadSettings();
    const instructions = settings?.ai?.customInstructions || [];
    const filtered = instructions.filter(i => i.id !== id);

    if (filtered.length === instructions.length) return false;

    // If deleting the active instruction, clear activeInstructionId
    const newActiveId = settings.ai?.activeInstructionId === id ? "" : (settings.ai?.activeInstructionId || "");

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: filtered,
            activeInstructionId: newActiveId
        }
    };

    await saveSettings(updated);
    return true;
};

export const reorderInstructions = async (orderedIds: string[]): Promise<void> => {
    const settings = await loadSettings();
    const instructions = settings?.ai?.customInstructions || [];

    const reordered = orderedIds
        .map((id, index) => {
            const instr = instructions.find(i => i.id === id);
            return instr ? { ...instr, order: index } : null;
        })
        .filter((i): i is any => i !== null && i !== undefined) as CustomInstruction[];

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: reordered
        }
    };

    await saveSettings(updated);
};

export const addDefaultTemplates = async (): Promise<CustomInstruction[]> => {
    const settings = await loadSettings();
    const existing = settings?.ai?.customInstructions || [];

    if (existing.length > 0) return existing;

    const newInstructions: CustomInstruction[] = DEFAULT_INSTRUCTION_TEMPLATES.map((template, index) => ({
        ...template,
        id: generateId(),
        order: index
    }));

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: newInstructions
        }
    };

    await saveSettings(updated);
    return newInstructions;
};
