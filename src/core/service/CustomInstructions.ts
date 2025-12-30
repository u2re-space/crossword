/*
 * Custom Instructions Service
 * Manages user-defined instructions for AI recognition operations
 */

import { loadSettings, saveSettings } from "@rs-core/config/Settings";
import type { CustomInstruction, AppSettings } from "@rs-core/config/SettingsTypes";

export type { CustomInstruction };

const generateId = (): string => {
    return `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const getCustomInstructions = async (): Promise<CustomInstruction[]> => {
    const settings = await loadSettings();
    return settings?.ai?.customInstructions || [];
};

export const getActiveInstruction = async (): Promise<CustomInstruction | null> => {
    const settings = await loadSettings();
    const instructions = settings?.ai?.customInstructions || [];
    const activeId = settings?.ai?.activeInstructionId;
    if (!activeId) return null;
    return instructions.find(i => i.id === activeId) || null;
};

export const getActiveInstructionText = async (): Promise<string> => {
    const instruction = await getActiveInstruction();
    return instruction?.instruction || "";
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

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: filtered,
            activeInstructionId: settings.ai?.activeInstructionId === id ? "" : settings.ai?.activeInstructionId
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
        .filter((i): i is CustomInstruction => i !== null);

    const updated: AppSettings = {
        ...settings,
        ai: {
            ...settings.ai,
            customInstructions: reordered
        }
    };

    await saveSettings(updated);
};

export const buildInstructionPrompt = (baseInstruction: string, customInstruction: string): string => {
    if (!customInstruction?.trim()) return baseInstruction;

    return `${baseInstruction}

---

USER CUSTOM INSTRUCTIONS:
${customInstruction.trim()}

---

Apply the user's custom instructions above when processing the data. Prioritize user instructions when they conflict with default behavior.
`;
};

export const DEFAULT_INSTRUCTION_TEMPLATES: Omit<CustomInstruction, "id">[] = [
    {
        label: "Markdown & KaTeX",
        instruction: `Format all recognized content as clean Markdown with proper KaTeX math notation.

Rules for math expressions:
- Inline math: use SINGLE dollar signs, e.g. $x^2 + y^2 = z^2$
- Block/display math: use DOUBLE dollar signs on separate lines:
  $$\\int_0^1 f(x) dx$$
- Do NOT add extra dollar signs - use exactly one $ for inline, exactly two $$ for block
- Preserve original mathematical notation accurately

Rules for text formatting:
- Use proper heading levels (# ## ###)
- Format lists with - or 1. 2. 3.
- Use **bold** and *italic* appropriately
- Format code as \`inline\` or \`\`\`block\`\`\`
- Format tables as | Markdown | tables |

Prioritize mathematical accuracy and proper Markdown structure.`,
        enabled: true,
        order: 0
    },
    {
        label: "Solve & Answer",
        instruction: `Solve problems or answer questions. Auto-detect the type:
• Math equations → Solve step-by-step with KaTeX
• Quiz/test questions → Provide correct answer with explanation
• Homework problems → Solve and explain reasoning

Format:
**Problem/Question:** <content, use $KaTeX$ for math>
**Solution/Answer:** <step-by-step or direct answer>
**Explanation:** <clear reasoning>

For multiple choice: identify correct option + explain why.
For math: use $ for inline, $$ for block equations.
Show all work and simplify the final answer.`,
        enabled: true,
        order: 1
    },
    {
        label: "Write code",
        instruction: `Generate code based on the recognized request/description.

Format:
**Request:** <what the code should do>
**Language:** <programming language>
**Code:**
\`\`\`<lang>
<code>
\`\`\`

Write clean, functional code with meaningful names and brief comments.`,
        enabled: true,
        order: 2
    },
    {
        label: "Extract CSS",
        instruction: `Generate CSS that matches the visual appearance of the content.

Extract:
- Colors (oklch, hex, rgb)
- Typography (font, size, weight)
- Spacing (padding, margin, gap)
- Layout (flex, grid)
- Effects (shadow, radius, gradients)

Use CSS custom properties and modern syntax.
Include responsive considerations.`,
        enabled: true,
        order: 3
    },
    {
        label: "Extract contacts",
        instruction: "Focus on extracting contact information: phone numbers, emails, addresses, and names. Format phone numbers in E.164 format.",
        enabled: true,
        order: 4
    },
    {
        label: "Summarize content",
        instruction: "Provide a brief summary of the recognized content. Include key points and main takeaways.",
        enabled: true,
        order: 5
    },
    {
        label: "Extract URLs and links",
        instruction: "Focus on extracting all URLs, links, and web addresses. Validate and normalize them.",
        enabled: true,
        order: 6
    },
    {
        label: "Code extraction",
        instruction: "Focus on extracting code snippets. Detect the programming language and format appropriately with syntax highlighting markers.",
        enabled: true,
        order: 7
    },
    {
        label: "Table extraction",
        instruction: "Focus on extracting tabular data. Format as proper Markdown tables with headers.",
        enabled: true,
        order: 8
    }
];

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
