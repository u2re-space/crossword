
import { GPTResponses } from "@rs-core/service/model/GPT-Responses";
import { resolveEntity } from "@rs-core/service/AI-ops/EntityItemResolve";

//
import { analyzeRecognizeUnified } from "@rs-core/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-core/config/Settings";
import { getOrDefaultComputedOfDataSourceCache } from "../lib/DataSourceCache";

//
export const controlChannel = new BroadcastChannel('rs-sw');
export const tryToTimeout = (cb: (...args: any[]) => void, timeout = 100, ..._args: any[]) => {
    if (typeof requestIdleCallback != "undefined" ) {
        return requestIdleCallback(cb, { timeout });
    } else {
        return setTimeout(cb, timeout);
    }
}


//
export const DOC_DIR = "/docs/preferences/";
export const PLAIN_DIR = "/docs/plain/";

//
export const initiateAnalyzeAndRecognizeData = async (dataSource: string | Blob | File | any) => {
    return analyzeRecognizeUnified(dataSource, (response) => {
        console.log(response);
    });
}

//
export const initiateConversionProcedure = async (dataSource: string | Blob | File | any) => {
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return { entities: [] };

    //
    const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5.1");

    // phase 1 - prepare data
    // upload dataset to GPT for recognize, and get response for analyze... and load into context
    gptResponses?.beginFromResponseId?.(await getOrDefaultComputedOfDataSourceCache(dataSource, async (dataSource: string | Blob | File | any) => {
        await gptResponses?.attachToRequest?.(dataSource)?.catch?.(console.warn.bind(console));
        await gptResponses?.sendRequest?.("high", "high")?.catch?.(console.warn.bind(console));
        return gptResponses?.getResponseId?.() || "";
    }));

    //
    // Support multiple MCP configurations
    if (settings?.ai?.mcp && Array.isArray(settings.ai.mcp)) {
        for (const mcpConfig of settings.ai.mcp) {
            if (mcpConfig.serverLabel && mcpConfig.origin && mcpConfig.clientKey && mcpConfig.secretKey) {
                await gptResponses?.useMCP?.(mcpConfig.serverLabel, mcpConfig.origin, mcpConfig.clientKey, mcpConfig.secretKey)?.catch?.(console.warn.bind(console));
            }
        }
    }

    // phase 2 - convert data to target format, make final description
    const resultsRaw = (await resolveEntity?.(gptResponses)?.catch?.(console.warn.bind(console))) || [];
    const results = Array.isArray(resultsRaw) ? resultsRaw : [resultsRaw];
    return { entities: results?.flatMap?.((result) => (result?.entities || [])) };
}

/**
 * Detected input data type with confidence scoring.
 */
export type DetectedDataType =
    | "markdown"
    | "json"
    | "html"
    | "xml"
    | "code"
    | "url"
    | "image"
    | "plain_text"
    | "structured"
    | "unknown";

export type InputTypeDetection = {
    type: DetectedDataType;
    confidence: number; // 0.0 - 1.0
    extension?: string;
    mimeType?: string;
    needsAI: boolean;
    hints: string[];
};

/**
 * Detect input data type from source with comprehensive analysis.
 */
export const detectInputType = (
    text: string | null,
    source: string | File | Blob | null
): InputTypeDetection => {
    const hints: string[] = [];
    let type: DetectedDataType = "unknown";
    let confidence = 0;
    let extension: string | undefined;
    let mimeType: string | undefined;

    // Check file metadata first (highest priority)
    if (source instanceof File) {
        const fileName = source.name?.toLowerCase() || "";
        extension = fileName.split(".").pop();
        mimeType = source.type;

        // Extension-based detection
        if (fileName.endsWith(".md") || fileName.endsWith(".markdown")) {
            type = "markdown"; confidence = 0.95; hints.push("file extension: .md");
        } else if (fileName.endsWith(".json") || fileName.endsWith(".jsonl")) {
            type = "json"; confidence = 0.95; hints.push("file extension: .json");
        } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
            type = "html"; confidence = 0.95; hints.push("file extension: .html");
        } else if (fileName.endsWith(".xml") || fileName.endsWith(".svg")) {
            type = "xml"; confidence = 0.95; hints.push("file extension: .xml");
        } else if (/\.(ts|js|tsx|jsx|py|rb|go|rs|c|cpp|java|kt|swift)$/.test(fileName)) {
            type = "code"; confidence = 0.95; hints.push(`file extension: .${extension}`);
        } else if (/\.(png|jpg|jpeg|gif|webp|avif|bmp|ico|svg)$/.test(fileName)) {
            type = "image"; confidence = 0.99; hints.push("image file extension");
        } else if (fileName.endsWith(".txt")) {
            type = "plain_text"; confidence = 0.7; hints.push("file extension: .txt");
        }
    }

    // Check MIME type
    if (source instanceof File || source instanceof Blob) {
        mimeType = source.type;

        if (mimeType?.startsWith("image/")) {
            type = "image"; confidence = 0.99; hints.push(`MIME: ${mimeType}`);
            return { type, confidence, extension, mimeType, needsAI: true, hints };
        }
        if (mimeType?.includes("markdown")) {
            type = "markdown"; confidence = Math.max(confidence, 0.9); hints.push("MIME contains markdown");
        }
        if (mimeType?.includes("json")) {
            type = "json"; confidence = Math.max(confidence, 0.9); hints.push("MIME contains json");
        }
        if (mimeType?.includes("html")) {
            type = "html"; confidence = Math.max(confidence, 0.9); hints.push("MIME contains html");
        }
        if (mimeType?.includes("xml")) {
            type = "xml"; confidence = Math.max(confidence, 0.9); hints.push("MIME contains xml");
        }
    }

    // If already high confidence from metadata, return early
    if (confidence >= 0.9) {
        return { type, confidence, extension, mimeType, needsAI: type === "plain_text", hints };
    }

    // Content-based detection (text analysis)
    if (text && typeof text === "string") {
        const trimmed = text.trim();

        // JSON detection (high confidence if valid parse)
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                JSON.parse(trimmed);
                type = "json"; confidence = 0.98; hints.push("valid JSON structure");
                return { type, confidence, extension, mimeType, needsAI: false, hints };
            } catch {
                hints.push("JSON-like but invalid");
            }
        }

        // URL detection
        if (URL.canParse(trimmed?.trim?.() || "", typeof (typeof window != "undefined" ? window : globalThis)?.location == "undefined" ? undefined : ((typeof window != "undefined" ? window : globalThis)?.location?.origin || "")) && /^https?:\/\//.test(trimmed?.trim?.())) {
            type = "url"; confidence = 0.95; hints.push("valid URL");
            return { type, confidence, extension, mimeType, needsAI: true, hints };
        }

        // HTML detection
        if (/^<!DOCTYPE\s+html/i.test(trimmed?.trim?.()) || /^<html[\s>]/i.test(trimmed?.trim?.())) {
            type = "html"; confidence = 0.95; hints.push("HTML doctype/tag");
            return { type, confidence, extension, mimeType, needsAI: false, hints };
        }
        if (/<\/?(?:div|span|p|a|img|table|ul|ol|li|h[1-6]|head|body|script|style|form|input|button)[\s>]/i.test(trimmed?.trim?.())) {
            type = "html"; confidence = Math.max(confidence, 0.8); hints.push("contains HTML tags");
        }

        // XML detection
        if (/^<\?xml\s/i.test(trimmed?.trim?.())) {
            type = "xml"; confidence = 0.95; hints.push("XML declaration");
            return { type, confidence, extension, mimeType, needsAI: false, hints };
        }

        // Markdown detection (various patterns)
        const markdownPatterns = [
            { pattern: /^---[\s\S]+?---/, score: 0.9, hint: "YAML frontmatter" },
            { pattern: /^#{1,6}\s+.+$/m, score: 0.7, hint: "heading syntax" },
            { pattern: /^\s*[-*+]\s+.+$/m, score: 0.5, hint: "list syntax" },
            { pattern: /^\s*\d+\.\s+.+$/m, score: 0.4, hint: "numbered list" },
            { pattern: /\[.+?\]\(.+?\)/, score: 0.7, hint: "link syntax" },
            { pattern: /!\[.+?\]\(.+?\)/, score: 0.8, hint: "image syntax" },
            { pattern: /```[\s\S]+?```/, score: 0.8, hint: "code block" },
            { pattern: /`[^`]+`/, score: 0.4, hint: "inline code" },
            { pattern: /^\s*>\s+.+$/m, score: 0.5, hint: "blockquote" },
            { pattern: /\*\*[^*]+\*\*|\*[^*]+\*/, score: 0.5, hint: "bold/italic" },
            { pattern: /^\|.+\|$/m, score: 0.7, hint: "table syntax" },
        ];

        let markdownScore = 0;
        for (const { pattern, score, hint } of markdownPatterns) {
            if (pattern.test(trimmed)) {
                markdownScore += score;
                hints.push(`md: ${hint}`);
            }
        }

        // Normalize markdown score
        markdownScore = Math.min(markdownScore / 2, 1);
        if (markdownScore > confidence && markdownScore >= 0.5) {
            type = "markdown"; confidence = markdownScore;
        }

        // Code detection
        const codePatterns = [
            { pattern: /^(?:import|export|from)\s+.+/m, score: 0.8, hint: "ES module syntax" },
            { pattern: /^(?:function|const|let|var|class)\s+\w+/m, score: 0.7, hint: "JS declaration" },
            { pattern: /^(?:def|class|import)\s+\w+/m, score: 0.7, hint: "Python syntax" },
            { pattern: /^(?:pub\s+)?(?:fn|struct|impl|use)\s+/m, score: 0.7, hint: "Rust syntax" },
            { pattern: /^package\s+\w+/m, score: 0.6, hint: "Go/Java package" },
            { pattern: /^\s*(?:if|for|while|switch|try)\s*\(/m, score: 0.5, hint: "control flow" },
        ];

        let codeScore = 0;
        for (const { pattern, score, hint } of codePatterns) {
            if (pattern.test(trimmed)) {
                codeScore += score;
                hints.push(`code: ${hint}`);
            }
        }

        codeScore = Math.min(codeScore / 1.5, 1);
        if (codeScore > confidence && codeScore >= 0.6) {
            type = "code"; confidence = codeScore;
        }

        // Structured data detection (key-value like patterns)
        if (/^\w+\s*[:=]\s*.+$/m.test(trimmed?.trim?.()) && confidence < 0.5) {
            type = "structured"; confidence = 0.5; hints.push("key-value pattern");
        }

        // Plain text fallback
        if (type === "unknown" && trimmed?.trim?.()?.length > 0) {
            type = "plain_text"; confidence = 0.3; hints.push("fallback: plain text");
        }
    }

    // Determine if AI processing is needed
    // Note: "url" and "image" types return early with needsAI already set,
    // so they won't reach here. We use type cast to keep the logic explicit.
    const finalType = type as DetectedDataType;
    const needsAI = finalType === "unknown" ||
        finalType === "plain_text" ||
        finalType === "structured" ||
        finalType === "url" ||
        finalType === "image" ||
        confidence < 0.7;

    return { type: finalType, confidence, extension, mimeType, needsAI, hints };
};

/**
 * Legacy markdown detection (for compatibility).
 */
export const isMarkdown = (text: string, source: string | File | Blob) => {
    const detection = detectInputType(text, source);
    return detection.type === "markdown" && detection.confidence >= 0.5;
};

/**
 * Check if input can be processed without AI (high confidence structured data).
 */
export const canProcessWithoutAI = (text: string, source: string | File | Blob): boolean => {
    const detection = detectInputType(text, source);
    return !detection.needsAI && detection.confidence >= 0.8;
};

/**
 * Get appropriate file extension for detected type.
 */
export const getExtensionForType = (type: DetectedDataType): string => {
    const extensions: Record<DetectedDataType, string> = {
        markdown: ".md",
        json: ".json",
        html: ".html",
        xml: ".xml",
        code: ".txt",
        url: ".md",
        image: ".png",
        plain_text: ".txt",
        structured: ".txt",
        unknown: ".txt"
    };
    return extensions[type];
};

//
export const _LOG = <T>(a: T): T => {
    console.log(a);
    return a;
}
