/*
 * Instruction Utilities
 * Pure functions for working with AI instructions (backend-compatible)
 */

import type { CustomInstruction } from "../config/SettingsTypes.ts";

export type { CustomInstruction };

/**
 * Builds a combined prompt from base instruction and custom instruction
 */
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

/**
 * Generates a unique ID for custom instructions
 */
export const generateInstructionId = (): string => {
    return `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

/**
 * Default instruction templates
 */
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
