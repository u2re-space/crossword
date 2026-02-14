const IMAGE_INSTRUCTION_JSON = `
Recognize data from image, also preferred to orient by fonts in image.

In recognition result, do not include image itself.

In recognized from image data (what you seen in image), do:
- If textual content, format as Markdown string (multiline).
- If math (expression, equation, formula):
  - For inline math, use SINGLE dollar signs: $x^2 + y^2 = z^2$
  - For block/display math, use DOUBLE dollar signs: $$\\int_0^1 f(x) dx$$
  - Do NOT add extra dollar signs - use exactly one $ for inline, exactly two $$ for block
- If table (or looks alike table), format as | table |
- If image reference, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as JSON string.
- If phone number, format as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as correct email (in normalized format).
- If URL, format as correct URL (in normalized format), decode unicode to readable.
- If date, format as correct date (ISO format preferred).
- If time, format as correct time (24h format preferred).
- If barcode/QR code, extract the encoded data.
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

Additional analysis:
- Detect document type (receipt, business card, screenshot, etc.)
- Extract structured data when possible (names, addresses, prices)
- Identify any logos or branding
- Note image quality issues that may affect recognition

If nothing found, return: {"ok": false, "error": "No data recognized"}

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "recognized_data": [...],
    "keywords_and_tags": [...],
    "verbose_data": "markdown description",
    "document_type": "...",
    "structured_extraction": {...},
    "confidence": 0.0-1.0,
    "quality_notes": [...]
}
`;
const CORE_IMAGE_INSTRUCTION = IMAGE_INSTRUCTION_JSON;
const AI_INSTRUCTIONS = {
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
const SOLVE_AND_ANSWER_INSTRUCTION = AI_INSTRUCTIONS.SOLVE_AND_ANSWER;
const WRITE_CODE_INSTRUCTION = AI_INSTRUCTIONS.WRITE_CODE;
const EXTRACT_CSS_INSTRUCTION = AI_INSTRUCTIONS.EXTRACT_CSS;
const CRX_SOLVE_AND_ANSWER_INSTRUCTION = AI_INSTRUCTIONS.CRX_SOLVE_AND_ANSWER;
const CRX_WRITE_CODE_INSTRUCTION = AI_INSTRUCTIONS.CRX_WRITE_CODE;
const CRX_EXTRACT_CSS_INSTRUCTION = AI_INSTRUCTIONS.CRX_EXTRACT_CSS;

const BUILT_IN_AI_ACTIONS = [
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
    supportedContentTypes: ["*"],
    priority: 1
  }
];
const DEFAULT_INSTRUCTION_TEMPLATES = [
  {
    label: "Markdown & KaTeX",
    instruction: `Format the output as GitHub-compatible Markdown with KaTeX.

Structure rules:
- Use headings for structure:
  - Main sections: start from ### (H3) minimum
  - Subsections: #### / ##### when needed
- Avoid long paragraphs: prefer lists and sub-lists.

KaTeX / math rules:
- Prefer inline formulas: $...$ (use this most of the time).
- Avoid $$...$$ blocks; only use block math if strictly necessary.
  - Prefer block math as \\[ ... \\] instead of $$...$$.
- Inside KaTeX, write a vertical bar as \\| (example: $A \\| B$).

Tables:
- Use strict GitHub Markdown table syntax.
- Inside table cells:
  - Use <br> for line breaks (no real newlines inside cells).
  - If source data uses ';' as a separator, replace ';' with <br>.

Colon / key-value formatting:
- For "key: value" style lines, make the part before ':' bold:
  - **Key**: value

General:
- Use bullet lists (-) or numbered steps (1., 2., 3.) where appropriate.
- Keep formatting consistent and readable in dark themes.
- Preserve meaning and math accuracy.`,
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
For math: prefer $inline$; avoid $$block$$ and prefer \\[block\\] only if strictly necessary.
Show all work and simplify the final answer.`,
    enabled: true,
    order: 1
  },
  {
    label: "Solve with Graphics",
    instruction: `Solve problems and generate visual representations when applicable.

For functions, graphs, diagrams, geometric shapes, or data visualizations:
Generate inline SVG code as a data URI: \`![Graph](data:image/svg+xml,<encoded_svg>)\`

SVG Generation Rules:
1. Use encodeURIComponent() encoding for the SVG content
2. Keep SVG minimal but accurate (viewBox, paths, text labels)
3. Use appropriate colors: #2563eb (blue) for main, #dc2626 (red) for secondary
4. Include axis labels, grid lines, and legends where helpful
5. Size: viewBox="0 0 400 300" for standard graphs

When to generate SVG:
• Function plots: y = f(x), parametric curves, polar plots
• Geometric diagrams: triangles, circles, angles, constructions
• Data charts: bar, line, pie charts
• Flowcharts and simple diagrams
• Number lines and coordinate systems

Format:
**Problem:** <description>
**Solution:** <step-by-step with $KaTeX$>
**Visualization:**
![<title>](data:image/svg+xml,<encodeURIComponent_svg>)

Always provide both the mathematical solution AND the visual when graphics are suitable.`,
    enabled: true,
    order: 2
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
    order: 3
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
    order: 4
  },
  {
    label: "Generate Diagram",
    instruction: `Generate SVG diagrams, charts, or visual representations from descriptions.

Output as inline data URI: ![<title>](data:image/svg+xml,<encoded_svg>)

Diagram Types:
• Flowcharts: processes, algorithms, decision trees
• Charts: bar, line, pie, scatter plots
• Diagrams: UML, ER, network, architecture
• Graphs: mathematical functions, data visualization
• Geometric: shapes, constructions, proofs

SVG Requirements:
1. Use encodeURIComponent() for the SVG string
2. viewBox="0 0 600 400" (adjust as needed)
3. Clean, minimal SVG with proper structure
4. Colors: #3b82f6 primary, #10b981 secondary, #f59e0b accent
5. Include labels, arrows, and legends
6. Use <text> for readable annotations

Example output format:
**Diagram:** <description>
![<title>](data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%3E...%3C%2Fsvg%3E)`,
    enabled: true,
    order: 5
  },
  {
    label: "Extract contacts",
    instruction: "Focus on extracting contact information: phone numbers, emails, addresses, and names. Format phone numbers in E.164 format.",
    enabled: true,
    order: 6
  },
  {
    label: "Summarize content",
    instruction: "Provide a brief summary of the recognized content. Include key points and main takeaways.",
    enabled: true,
    order: 7
  },
  {
    label: "Extract URLs and links",
    instruction: "Focus on extracting all URLs, links, and web addresses. Validate and normalize them.",
    enabled: true,
    order: 8
  },
  {
    label: "Code extraction",
    instruction: "Focus on extracting code snippets. Detect the programming language and format appropriately with syntax highlighting markers.",
    enabled: true,
    order: 9
  },
  {
    label: "Table extraction",
    instruction: "Focus on extracting tabular data. Format as proper Markdown tables with headers.",
    enabled: true,
    order: 10
  }
];

export { AI_INSTRUCTIONS, BUILT_IN_AI_ACTIONS, CORE_IMAGE_INSTRUCTION, CRX_EXTRACT_CSS_INSTRUCTION, CRX_SOLVE_AND_ANSWER_INSTRUCTION, CRX_WRITE_CODE_INSTRUCTION, DEFAULT_INSTRUCTION_TEMPLATES, EXTRACT_CSS_INSTRUCTION, SOLVE_AND_ANSWER_INSTRUCTION, WRITE_CODE_INSTRUCTION };
//# sourceMappingURL=templates.js.map
