/**
 * Unified AI Configuration and Instructions
 *
 * Centralizes all AI processing rules, instructions, and configurations
 * for consistent behavior across different entry points and modules.
 */

import type { RecognizeByInstructionsOptions } from '@rs-core/service/AI-ops/RecognizeData';

// AI Processing Types
export type AIProcessingType =
  | 'solve-and-answer'
  | 'write-code'
  | 'extract-css'
  | 'recognize-content'
  | 'convert-data'
  | 'extract-entities'
  | 'general-processing';

// Content Processing Rules
export interface ProcessingRule {
  type: AIProcessingType;
  instruction: string;
  options?: RecognizeByInstructionsOptions;
  supportedContentTypes: string[];
  priority: number;
}

// Unified AI Instructions
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
- Use appropriate data structures and algorithms

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
- Optimize for performance and maintainability
- Follow CSS naming conventions

If extracting from an image:
- Analyze layout, colors, typography, and spacing
- Generate corresponding CSS rules
- Include media queries for responsive design

Always provide well-structured, production-ready CSS.
`,

  RECOGNIZE_CONTENT: `
Analyze and recognize content from images, documents, or structured data.

Recognition requirements:
- Extract text content accurately
- Identify document structure and formatting
- Preserve important visual elements
- Maintain data integrity and relationships
- Provide confidence scores for recognition accuracy

For images:
- OCR text content
- Identify visual elements and layout
- Extract structured information

For documents:
- Preserve formatting and structure
- Extract metadata and headers
- Identify sections and subsections

Provide detailed, structured output with confidence metrics.
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

  GENERAL_PROCESSING: `
Process and analyze content using appropriate AI capabilities.

General processing requirements:
- Understand context and intent
- Provide relevant analysis or transformation
- Use appropriate tools and methods
- Maintain content quality and accuracy
- Adapt to different content types and requirements

Apply the most suitable processing approach based on content characteristics and user needs.
`
};

// Processing Rules for different entry points (as described in the requirements)
export const processingRules = {
  "share-target": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "write-clipboard",
      onAccept: "attach-to-associated",
      doProcess: "instantly"
    }
  },
  "launch-queue": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "",
      onAccept: "attach-to-associated",
      doProcess: "manually"
    }
  },
  "crx-snip": {
    processingUrl: "/api/processing",
    contentAction: {
      onResult: "write-clipboard",        // ✅ Write results to clipboard
      onAccept: "attach-to-associated",   // ✅ Send to workcenter
      doProcess: "instantly",             // ✅ Process immediately
      openApp: false                      // ✅ DON'T open PWA
    },
    supportedContentTypes: ["text", "image"] // Supports both text and image processing
  }
};

// Processing Rules Configuration
export const PROCESSING_RULES: ProcessingRule[] = [
  {
    type: 'solve-and-answer',
    instruction: AI_INSTRUCTIONS.SOLVE_AND_ANSWER,
    supportedContentTypes: ['text', 'markdown', 'image'],
    priority: 10
  },
  {
    type: 'write-code',
    instruction: AI_INSTRUCTIONS.WRITE_CODE,
    supportedContentTypes: ['text', 'markdown', 'image'],
    priority: 9
  },
  {
    type: 'extract-css',
    instruction: AI_INSTRUCTIONS.EXTRACT_CSS,
    supportedContentTypes: ['text', 'markdown', 'image', 'html'],
    priority: 8
  },
  {
    type: 'recognize-content',
    instruction: AI_INSTRUCTIONS.RECOGNIZE_CONTENT,
    supportedContentTypes: ['image', 'pdf', 'document'],
    priority: 7
  },
  {
    type: 'convert-data',
    instruction: AI_INSTRUCTIONS.CONVERT_DATA,
    supportedContentTypes: ['csv', 'json', 'xml', 'text'],
    priority: 6
  },
  {
    type: 'extract-entities',
    instruction: AI_INSTRUCTIONS.EXTRACT_ENTITIES,
    supportedContentTypes: ['text', 'markdown', 'document'],
    priority: 5
  },
  {
    type: 'general-processing',
    instruction: AI_INSTRUCTIONS.GENERAL_PROCESSING,
    supportedContentTypes: ['*'], // Supports all content types
    priority: 1
  }
];

// Content Type Mappings
export const CONTENT_TYPE_MAPPINGS = {
  // File extensions to MIME types
  extensions: {
    '.md': 'text/markdown',
    '.markdown': 'text/markdown',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  },

  // MIME type to processing type mapping
  mimeToProcessing: {
    'text/markdown': 'general-processing',
    'text/plain': 'general-processing',
    'text/html': 'extract-css',
    'text/css': 'extract-css',
    'application/javascript': 'write-code',
    'application/typescript': 'write-code',
    'application/json': 'convert-data',
    'application/xml': 'convert-data',
    'text/csv': 'convert-data',
    'application/pdf': 'recognize-content',
    'image/png': 'recognize-content',
    'image/jpeg': 'recognize-content',
    'image/gif': 'recognize-content',
    'image/svg+xml': 'extract-css',
    'image/webp': 'recognize-content'
  } as Record<string, AIProcessingType>
};

// Processing Configuration
export interface ProcessingConfig {
  maxRetries: number;
  timeoutMs: number;
  enableCaching: boolean;
  enableStreaming: boolean;
  defaultLanguage: string;
  supportedLanguages: string[];
}

// Default processing configuration
export const DEFAULT_PROCESSING_CONFIG: ProcessingConfig = {
  maxRetries: 3,
  timeoutMs: 30000,
  enableCaching: true,
  enableStreaming: false,
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
};

// Utility Functions

/**
 * Get the appropriate processing rule for content type and operation
 */
export function getProcessingRule(
  contentType: string,
  requestedType?: AIProcessingType
): ProcessingRule | null {
  // If specific type requested, try to find it
  if (requestedType) {
    const rule = PROCESSING_RULES.find(r => r.type === requestedType);
    if (rule && (rule.supportedContentTypes.includes(contentType) || rule.supportedContentTypes.includes('*'))) {
      return rule;
    }
  }

  // Otherwise, find best match based on content type and priority
  const matchingRules = PROCESSING_RULES
    .filter(rule => rule.supportedContentTypes.includes(contentType) || rule.supportedContentTypes.includes('*'))
    .sort((a, b) => b.priority - a.priority);

  return matchingRules[0] || null;
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return CONTENT_TYPE_MAPPINGS.extensions[extension] || 'application/octet-stream';
}

/**
 * Get processing type from MIME type
 */
export function getProcessingTypeFromMime(mimeType: string): AIProcessingType {
  return CONTENT_TYPE_MAPPINGS.mimeToProcessing[mimeType] || 'general-processing';
}

/**
 * Get processing type from file
 */
export function getProcessingTypeFromFile(file: File): AIProcessingType {
  const mimeType = file.type || getMimeTypeFromExtension(file.name);
  return getProcessingTypeFromMime(mimeType);
}

/**
 * Create processing options with defaults
 */
export function createProcessingOptions(
  overrides: Partial<RecognizeByInstructionsOptions> = {}
): RecognizeByInstructionsOptions {
  return {
    maxRetries: DEFAULT_PROCESSING_CONFIG.maxRetries,
    timeoutMs: DEFAULT_PROCESSING_CONFIG.timeoutMs,
    enableCaching: DEFAULT_PROCESSING_CONFIG.enableCaching,
    enableStreaming: DEFAULT_PROCESSING_CONFIG.enableStreaming,
    ...overrides
  };
}

/**
 * Validate content for processing
 */
export function validateContentForProcessing(
  content: any,
  contentType: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content) {
    errors.push('Content is required');
  }

  if (!contentType) {
    errors.push('Content type is required');
  }

  // Type-specific validation
  switch (contentType) {
    case 'text':
    case 'markdown':
      if (typeof content !== 'string' || content.trim().length === 0) {
        errors.push('Text content must be a non-empty string');
      }
      break;
    case 'file':
      if (!(content instanceof File)) {
        errors.push('File content must be a File object');
      }
      break;
    case 'blob':
      if (!(content instanceof Blob)) {
        errors.push('Blob content must be a Blob object');
      }
      break;
    case 'base64':
      if (typeof content !== 'string' || !content.match(/^data:[^;]+;base64,/)) {
        errors.push('Base64 content must be a valid data URL');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}