import { loadSettings, saveSettings } from './Settings.js';
import { generateInstructionId, DEFAULT_INSTRUCTION_TEMPLATES } from './BuiltInAI.js';
export { buildInstructionPrompt } from './BuiltInAI.js';
import './index.js';

"use strict";

"use strict";
const generateId = generateInstructionId;
const byOrderAndLabel = (a, b) => {
  const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
  const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  return (a.label || "").localeCompare(b.label || "");
};
const normalizeInstructions = (items) => [...items || []].sort(byOrderAndLabel);
const pickActiveInstruction = (instructions, activeId) => {
  if (!activeId) return null;
  return instructions.find((i) => i.id === activeId) || null;
};
const getInstructionRegistry = async () => {
  const settings = await loadSettings();
  const instructions = normalizeInstructions(settings?.ai?.customInstructions);
  const activeInstruction = pickActiveInstruction(instructions, settings?.ai?.activeInstructionId);
  return {
    instructions,
    activeId: activeInstruction?.id || "",
    activeInstruction
  };
};
const getCustomInstructions = async () => {
  const snapshot = await getInstructionRegistry();
  return snapshot.instructions;
};
const getActiveInstruction = async () => {
  try {
    const snapshot = await getInstructionRegistry();
    if (!snapshot.activeId) return null;
    if (!snapshot.activeInstruction) {
      console.warn("[CustomInstructions] activeInstructionId not found:", snapshot.activeId);
    }
    return snapshot.activeInstruction;
  } catch (e) {
    console.error("[CustomInstructions] Error in getActiveInstruction:", e);
    return null;
  }
};
const getActiveInstructionText = async () => {
  const instruction = await getActiveInstruction();
  return instruction?.instruction || "";
};
const setActiveInstruction = async (id) => {
  const settings = await loadSettings();
  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      activeInstructionId: id || ""
    }
  };
  await saveSettings(updated);
};
const addInstruction = async (label, instruction) => {
  const settings = await loadSettings();
  const instructions = settings?.ai?.customInstructions || [];
  const newInstruction = {
    id: generateId(),
    label: label.trim() || "Untitled",
    instruction: instruction.trim(),
    enabled: true,
    order: instructions.length
  };
  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      customInstructions: [...instructions, newInstruction]
    }
  };
  await saveSettings(updated);
  return newInstruction;
};
const addInstructions = async (items) => {
  if (!items.length) return [];
  const settings = await loadSettings();
  const instructions = settings?.ai?.customInstructions || [];
  const newInstructions = items.map((item, index) => ({
    id: generateId(),
    label: item.label.trim() || "Untitled",
    instruction: item.instruction.trim(),
    enabled: item.enabled ?? true,
    order: instructions.length + index
  }));
  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      customInstructions: [...instructions, ...newInstructions]
    }
  };
  await saveSettings(updated);
  return newInstructions;
};
const updateInstruction = async (id, updates) => {
  const settings = await loadSettings();
  const instructions = settings?.ai?.customInstructions || [];
  const index = instructions.findIndex((i) => i.id === id);
  if (index === -1) return false;
  instructions[index] = { ...instructions[index], ...updates };
  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      customInstructions: instructions
    }
  };
  await saveSettings(updated);
  return true;
};
const deleteInstruction = async (id) => {
  const settings = await loadSettings();
  const instructions = settings?.ai?.customInstructions || [];
  const filtered = instructions.filter((i) => i.id !== id);
  if (filtered.length === instructions.length) return false;
  const newActiveId = settings.ai?.activeInstructionId === id ? "" : settings.ai?.activeInstructionId || "";
  const updated = {
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
const reorderInstructions = async (orderedIds) => {
  const settings = await loadSettings();
  const instructions = settings?.ai?.customInstructions || [];
  const reordered = orderedIds.map((id, index) => {
    const instr = instructions.find((i) => i.id === id);
    return instr ? { ...instr, order: index } : null;
  }).filter((i) => i !== null && i !== void 0);
  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      customInstructions: reordered
    }
  };
  await saveSettings(updated);
};
const addDefaultTemplates = async () => {
  const settings = await loadSettings();
  const existing = settings?.ai?.customInstructions || [];
  if (existing.length > 0) return existing;
  const newInstructions = DEFAULT_INSTRUCTION_TEMPLATES.map((template, index) => ({
    ...template,
    id: generateId(),
    order: index
  }));
  const updated = {
    ...settings,
    ai: {
      ...settings.ai,
      customInstructions: newInstructions
    }
  };
  await saveSettings(updated);
  return newInstructions;
};

export { DEFAULT_INSTRUCTION_TEMPLATES, addDefaultTemplates, addInstruction, addInstructions, deleteInstruction, getActiveInstruction, getActiveInstructionText, getCustomInstructions, getInstructionRegistry, reorderInstructions, setActiveInstruction, updateInstruction };
//# sourceMappingURL=CustomInstructions.js.map
