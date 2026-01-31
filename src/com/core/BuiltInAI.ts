/**
 * Built-in AI Instructions, Templates, and Actions
 *
 * Unified collection of all built-in AI capabilities, templates, and processing rules
 * used across PWA, CRX, Basic App, WorkCenter, and other components.
 */

import type { PromptTemplate } from '../../core/modules/TemplateManager';

// ============================================================================
// AI INSTRUCTIONS - Core AI Capabilities
// ============================================================================

export const AI_INSTRUCTIONS = {
  SOLVE_AND_ANSWER: `
Solve equations, answer questions, and explain mathematical or logical problems from the provided content.

For equations and math problems:
- Show step-by-step solutions
- Provide final answers clearly marked
- Explain reasoning for each step

For general questions:
- Provide accurate, well-reasoned answers
- Include relevant context and explanations
- If multiple interpretations possible, address them

For quizzes and tests:
- Show the correct answer with explanation
- Explain why other options are incorrect

Always respond in the specified language and format results clearly.
`,

  WRITE_CODE: `
Write clean, efficient, and well-documented code based on the provided description, requirements, or image.

Code requirements:
- Use appropriate programming language for the task
- Follow language-specific best practices and conventions
- Include proper error handling
- Add meaningful comments and documentation
- Make code readable and maintainable

If generating from an image or visual description:
- Analyze the visual elements and requirements
- Implement the described functionality
- Ensure code compiles and runs correctly

Always respond in the specified language and provide complete, working code.
`,

  EXTRACT_CSS: `
Extract and generate clean, modern CSS from the provided content, image, or description.

CSS requirements:
- Use modern CSS features and best practices
- Generate semantic, maintainable stylesheets
- Include responsive design considerations
- Use appropriate selectors and specificity
- Follow CSS naming conventions
- Optimize for performance and maintainability

If extracting from an image:
- Analyze the visual design and layout
- Generate corresponding CSS rules
- Identify colors, fonts, spacing, and layout
- Create reusable CSS classes and components

Always respond in the specified language and provide complete, working CSS.
`,

  RECOGNIZE_CONTENT: `
Recognize and extract information from images, documents, or other visual content.

Recognition requirements:
- Identify text content accurately
- Extract structured information
- Recognize tables, forms, and structured data
- Preserve formatting where possible
- Handle different languages and scripts
- Provide confidence scores for extracted content

For document analysis:
- Extract key information and metadata
- Identify document type and structure
- Recognize important sections and headings

For image analysis:
- Describe visual content
- Extract text from images (OCR)
- Identify objects, scenes, and visual elements

Always respond in the specified language and format extracted information clearly.
`,

  CONVERT_DATA: `
Convert data between different formats while preserving structure and meaning.

Conversion requirements:
- Maintain data integrity and relationships
- Preserve formatting and structure where possible
- Handle different data types appropriately
- Provide clear mapping between source and target formats
- Validate conversion accuracy

Supported conversions:
- CSV ↔ JSON ↔ XML
- Markdown ↔ HTML
- Text ↔ Structured data
- Image data ↔ Text representations

Ensure accurate, lossless conversion where possible.
`,

  EXTRACT_ENTITIES: `
Extract named entities, keywords, and structured information from content.

Entity extraction requirements:
- Identify people, organizations, locations
- Extract dates, numbers, and measurements
- Find keywords and important terms
- Recognize relationships and connections
- Provide confidence scores and context

Output structured data with:
- Entity types and values
- Position and context information
- Confidence scores
- Relationship mappings

Focus on accuracy and comprehensive coverage.
`,

  TRANSLATE_TO_LANGUAGE: `
Translate content to the specified target language while preserving meaning, tone, and formatting.

Translation requirements:
- Maintain original meaning and intent
- Preserve formatting, structure, and markdown syntax
- Adapt cultural references appropriately
- Use natural, fluent language in the target language
- Handle technical terms, proper names, and brand names correctly
- Maintain appropriate formality and tone
- Preserve code blocks, mathematical expressions, and technical content

For content already in the target language:
- Provide natural rephrasing or improvement
- Enhance clarity and readability
- Maintain professional quality

Supported languages:
- English (en)
- Russian (ru)
- Other languages as requested

Ensure high-quality, natural translations that feel native to the target language.
`,

  GENERAL_PROCESSING: `
Process and analyze content using appropriate AI capabilities.

General processing requirements:
- Understand context and intent
- Provide relevant analysis or transformation
- Use appropriate tools and methods
- Maintain content quality and accuracy
- Adapt to different content types and requirements

Focus on providing useful, accurate results that meet user needs.
`,

  // CRX-specific optimized instructions (more concise for faster processing)
  CRX_SOLVE_AND_ANSWER: `
Solve the problem or answer the question presented in the content.

Auto-detect the type of content:
- Mathematical equation/expression → Solve step-by-step
- Quiz/test question → Provide correct answer
- Homework problem → Solve and explain
- General question → Answer with explanation

Format output as:

**Problem/Question:**
<recognized content - use $KaTeX$ for math>

**Solution/Answer:**
<step-by-step solution or direct answer>

**Explanation:**
<clear explanation of the reasoning>

---

For MATH problems:
- Use single $ for inline math: $x = 5$
- Use double $$ for display equations: $$\\int_0^1 f(x) dx$$
- Show all intermediate steps
- Simplify the final answer
- For systems: solve all variables
- For inequalities: use interval notation

For MULTIPLE CHOICE:
- Identify correct option (A, B, C, D)
- Explain why it's correct
- Note why others are wrong

For TRUE/FALSE:
- State True or False clearly
- Provide justification

For SHORT ANSWER/ESSAY:
- Provide concise, complete answer
- Include key facts and reasoning

For CODING problems:
- Write the solution code
- Explain the logic

If multiple problems/questions present, solve each separately.
If unsolvable or unclear, explain why.
`,

  CRX_WRITE_CODE: `
You are an expert software developer. Analyze the provided content and generate high-quality, working code.

Code Generation Requirements:
- Choose the best programming language for the task
- Write clean, efficient, and well-documented code
- Include proper error handling and input validation
- Add meaningful comments explaining complex logic
- Follow language-specific best practices and conventions
- Ensure code is readable, maintainable, and follows standard patterns

For each code generation task:
1. **Analyze Requirements**: Understand what the code needs to do
2. **Choose Language**: Select appropriate programming language
3. **Design Solution**: Plan the code structure and logic
4. **Write Code**: Provide complete, working code with comments
5. **Explain Logic**: Describe how the code works and key decisions

Provide complete, runnable code that solves the described problem.
`,

  CRX_EXTRACT_CSS: `
You are an expert CSS developer. Analyze the provided content and extract/generate the corresponding CSS styles.

CSS Extraction Requirements:
- Analyze visual elements, layout, and design patterns
- Generate modern, clean CSS using current standards
- Use semantic class names and proper CSS architecture
- Include responsive design considerations
- Optimize for performance and maintainability
- Follow CSS best practices and conventions

For CSS extraction:
1. **Analyze Design**: Identify colors, typography, spacing, layout
2. **Generate Rules**: Create appropriate CSS rules and selectors
3. **Organize Code**: Group related styles logically
4. **Add Comments**: Explain complex or important style decisions
5. **Ensure Compatibility**: Use widely supported CSS properties

Provide complete, well-organized CSS that recreates the described design.
`
};

// ============================================================================
// DEFAULT TEMPLATES - User-selectable prompt templates
// ============================================================================

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    name: "Recognize Content",
    prompt: "Recognize and extract information from the provided content",
    category: "Analysis",
    tags: ["recognition", "extraction", "analysis"]
  },
  {
    name: "Analyze Document",
    prompt: "Analyze this document and provide a summary with key insights",
    category: "Analysis",
    tags: ["analysis", "summary", "insights"]
  },
  {
    name: "Solve Problems",
    prompt: "Solve any equations, problems, or questions in the content",
    category: "Problem Solving",
    tags: ["math", "problems", "solutions"]
  },
  {
    name: "Generate Code",
    prompt: "Generate code based on the requirements or description provided",
    category: "Development",
    tags: ["code", "programming", "development"]
  },
  {
    name: "Extract CSS",
    prompt: "Extract or generate CSS from the content or images",
    category: "Design",
    tags: ["css", "styling", "design"]
  },
  {
    name: "Summarize Text",
    prompt: "Provide a concise summary of the following text",
    category: "Writing",
    tags: ["summary", "writing", "concise"]
  },
  {
    name: "Translate to Language",
    prompt: "Translate the following content to the selected language. Maintain the original formatting and structure where possible. If the content is already in the target language, provide a natural rephrasing or improvement instead.",
    category: "Translation",
    tags: ["translate", "language", "dynamic"]
  },
  {
    name: "Translate Content",
    prompt: "Translate the following content to English",
    category: "Translation",
    tags: ["translate", "language", "english"]
  },
  {
    name: "Generate Ideas",
    prompt: "Generate creative ideas based on the provided topic or content",
    category: "Creative",
    tags: ["ideas", "creative", "brainstorming"]
  }
];

// ============================================================================
// BUILT-IN AI ACTIONS - Available actions across all platforms
// ============================================================================

export interface BuiltInAIAction {
  id: string;
  title: string;
  description: string;
  category: 'processing' | 'analysis' | 'creation' | 'translation';
  platforms: ('pwa' | 'crx' | 'workcenter' | 'basic')[];
  instructionKey: keyof typeof AI_INSTRUCTIONS;
  supportedContentTypes: string[];
  priority: number;
}

export const BUILT_IN_AI_ACTIONS: BuiltInAIAction[] = [
  {
    id: "SOLVE_AND_ANSWER",
    title: "Solve / Answer (AI)",
    description: "Solve equations, answer questions, and explain mathematical or logical problems",
    category: "processing",
    platforms: ["pwa", "crx", "workcenter", "basic"],
    instructionKey: "SOLVE_AND_ANSWER",
    supportedContentTypes: ["text", "markdown", "image"],
    priority: 10
  },
  {
    id: "WRITE_CODE",
    title: "Write Code (AI)",
    description: "Generate code based on requirements or descriptions",
    category: "creation",
    platforms: ["pwa", "crx", "workcenter", "basic"],
    instructionKey: "WRITE_CODE",
    supportedContentTypes: ["text", "markdown", "image"],
    priority: 9
  },
  {
    id: "EXTRACT_CSS",
    title: "Extract CSS Styles (AI)",
    description: "Extract or generate CSS from content or images",
    category: "creation",
    platforms: ["pwa", "crx", "workcenter", "basic"],
    instructionKey: "EXTRACT_CSS",
    supportedContentTypes: ["text", "markdown", "image", "html"],
    priority: 8
  },
  {
    id: "RECOGNIZE_CONTENT",
    title: "Recognize Content (AI)",
    description: "Extract information from images and documents",
    category: "analysis",
    platforms: ["pwa", "crx", "workcenter", "basic"],
    instructionKey: "RECOGNIZE_CONTENT",
    supportedContentTypes: ["image", "pdf", "document"],
    priority: 7
  },
  {
    id: "TRANSLATE_TO_LANGUAGE",
    title: "Translate to Language (AI)",
    description: "Translate content to the selected language",
    category: "translation",
    platforms: ["workcenter", "basic"],
    instructionKey: "TRANSLATE_TO_LANGUAGE",
    supportedContentTypes: ["text", "markdown"],
    priority: 6
  },
  {
    id: "CONVERT_DATA",
    title: "Convert Data (AI)",
    description: "Convert between different data formats",
    category: "processing",
    platforms: ["workcenter", "basic"],
    instructionKey: "CONVERT_DATA",
    supportedContentTypes: ["csv", "json", "xml", "text"],
    priority: 5
  },
  {
    id: "EXTRACT_ENTITIES",
    title: "Extract Entities (AI)",
    description: "Extract named entities and structured information",
    category: "analysis",
    platforms: ["workcenter", "basic"],
    instructionKey: "EXTRACT_ENTITIES",
    supportedContentTypes: ["text", "markdown", "document"],
    priority: 4
  },
  {
    id: "GENERAL_PROCESSING",
    title: "Process Content (AI)",
    description: "General AI processing and analysis",
    category: "processing",
    platforms: ["pwa", "crx", "workcenter", "basic"],
    instructionKey: "GENERAL_PROCESSING",
    supportedContentTypes: ["*"], // Supports all content types
    priority: 1
  }
];

// ============================================================================
// LEGACY EXPORTS - For backward compatibility
// ============================================================================

// Keep these for backward compatibility with existing imports
export const SOLVE_AND_ANSWER_INSTRUCTION = AI_INSTRUCTIONS.SOLVE_AND_ANSWER;
export const WRITE_CODE_INSTRUCTION = AI_INSTRUCTIONS.WRITE_CODE;
export const EXTRACT_CSS_INSTRUCTION = AI_INSTRUCTIONS.EXTRACT_CSS;
export const RECOGNIZE_CONTENT_INSTRUCTION = AI_INSTRUCTIONS.RECOGNIZE_CONTENT;
export const CONVERT_DATA_INSTRUCTION = AI_INSTRUCTIONS.CONVERT_DATA;
export const EXTRACT_ENTITIES_INSTRUCTION = AI_INSTRUCTIONS.EXTRACT_ENTITIES;
export const TRANSLATE_TO_LANGUAGE_INSTRUCTION = AI_INSTRUCTIONS.TRANSLATE_TO_LANGUAGE;
export const GENERAL_PROCESSING_INSTRUCTION = AI_INSTRUCTIONS.GENERAL_PROCESSING;

// CRX-specific optimized versions
export const CRX_SOLVE_AND_ANSWER_INSTRUCTION = AI_INSTRUCTIONS.CRX_SOLVE_AND_ANSWER;
export const CRX_WRITE_CODE_INSTRUCTION = AI_INSTRUCTIONS.CRX_WRITE_CODE;
export const CRX_EXTRACT_CSS_INSTRUCTION = AI_INSTRUCTIONS.CRX_EXTRACT_CSS;

// Legacy aliases
export const EQUATION_SOLVE_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;
export const ANSWER_QUESTION_INSTRUCTION = SOLVE_AND_ANSWER_INSTRUCTION;