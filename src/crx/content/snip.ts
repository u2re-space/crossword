import { getBox, getHint, getOverlay, getSizeBadge, hideSelection, showSelection, showToast } from "@rs-frontend/main/overlay";

// Import CRX runtime channel module for inline coding style
import { createRuntimeChannelModule } from '../shared/runtime';
import { registerCrxHandler } from "../shared/CrxMessaging";

// Check if we're in CRX environment
const isInCrxEnvironment = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Create runtime module for inline usage
let crxModule: any = null;
const getCrxModule = async () => {
    if (!crxModule && isInCrxEnvironment) {
        crxModule = await createRuntimeChannelModule('crx-content-script');
    }
    return crxModule;
};

// crop area for screen capture
export interface cropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type SnipMode = "recognize" | "solve" | "code" | "css" | "custom";

let __snipInjected = false;
let __snipActive = false;
let __currentMode: SnipMode = "recognize";
let __customInstructionId: string | null = null;
let __customInstructionLabel: string | null = null;

// Map mode to message type
const getModeMessageType = (mode: SnipMode): string => {
    switch (mode) {
        case "solve": return "CAPTURE_SOLVE";
        case "code": return "CAPTURE_CODE";
        case "css": return "CAPTURE_CSS";
        case "custom": return "CAPTURE_CUSTOM";
        default: return "CAPTURE";
    }
};

// Get user-friendly mode name for messages
const getModeName = (mode: SnipMode): string => {
    if (mode === "custom" && __customInstructionLabel) {
        return __customInstructionLabel;
    }
    switch (mode) {
        case "solve": return "Solving/Answering";
        case "code": return "Code generation";
        case "css": return "CSS extraction";
        case "custom": return "Custom instruction";
        default: return "Recognition";
    }
};

// Get error message for mode
const getModeErrorMessage = (mode: SnipMode): string => {
    if (mode === "custom" && __customInstructionLabel) {
        return `${__customInstructionLabel} failed`;
    }
    switch (mode) {
        case "solve": return "Could not solve/answer";
        case "code": return "Could not generate code";
        case "css": return "Could not extract CSS";
        case "custom": return "Custom instruction failed";
        default: return "No data recognized";
    }
};

// use chrome API to capture tab visible area
// Note: Toast for successful copy is handled by clipboard-handler.ts
// We only show toasts here for errors/failures
const captureTab = async (rect?: cropArea, mode: SnipMode = "recognize") => {
    const messageType = getModeMessageType(mode);
    const payload: any = { type: messageType, rect };

    // Include custom instruction ID for custom mode
    if (mode === "custom" && __customInstructionId) {
        payload.instructionId = __customInstructionId;
    }

    // Use fest/uniform CRX messaging for reliability
    if (!isInCrxEnvironment) {
        console.warn('[Snip] Not in CRX environment');
        return Promise.reject(new Error('Chrome extension messaging not available'));
    }

    // Use CRX runtime module for inline coding style
    const module = await getCrxModule();
    if (!module) {
        throw new Error('CRX runtime module not available');
    }

    console.log(`[Snip] Starting capture with rect:`, rect, `mode:`, mode);

    // First try just capturing screenshot to test if capture works
    console.log(`[Snip] Testing screenshot capture...`);
    const screenshot = await module.captureScreenshot(rect);
    console.log(`[Snip] Screenshot result:`, {
        ok: screenshot?.ok,
        hasImageData: !!screenshot?.imageData,
        imageDataLength: screenshot?.imageData?.length
    });

    // Inline coding style: await module.capture(rect)
    const result = await module.capture(rect, mode);

    console.log(`[Snip] ${mode} result:`, result);

    // Show toast for errors
    if (!result?.ok) {
        if (result?.error) {
            const shortError = result.error.length > 50 ? result.error.slice(0, 50) + "..." : result.error;
            showToast(shortError);
            console.error(`[Snip] ${mode} error:`, result.error);
        } else {
            showToast(getModeErrorMessage(mode));
        }
    } else if (result?.ok && (!result?.data || result.data === '')) {
        // Success but no data - this indicates the AI didn't find text
        console.warn(`[Snip] ${mode} succeeded but no text found in image`);
        showToast(`No text found in selected area`);
    }

    return result;
};

// register message listener and export startSnip
const initSnip = () => {
    if (__snipInjected) return;
    __snipInjected = true;

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg?.type === "START_SNIP") {
            startSnip("recognize");
        }
        if (msg?.type === "SOLVE_AND_ANSWER" || msg?.type === "SOLVE_EQUATION" || msg?.type === "ANSWER_QUESTION") {
            startSnip("solve");
        }
        if (msg?.type === "WRITE_CODE") {
            startSnip("code");
        }
        if (msg?.type === "EXTRACT_CSS") {
            startSnip("css");
        }
        // Handle custom instruction from context menu
        if (msg?.type === "CUSTOM_INSTRUCTION" && msg?.instructionId) {
            startSnip("custom", msg.instructionId, msg.label);
        }
    });
};

export function startSnip(mode: SnipMode = "recognize", instructionId?: string, instructionLabel?: string) {
    if (__snipActive) return;

    __currentMode = mode;
    __customInstructionId = instructionId || null;
    __customInstructionLabel = instructionLabel || null;

    // get DOM elements
    const overlay = getOverlay();
    const box = getBox();
    const hint = getHint();
    const sizeBadge = getSizeBadge();

    if (!overlay || !box) {
        console.warn("Snip overlay not ready");
        return;
    }

    let startX = 0, startY = 0, currX = 0, currY = 0, dragging = false;

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
        }
    };

    const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0 || !__snipActive) return;
        e.preventDefault();
        e.stopPropagation();

        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currX = startX;
        currY = startY;
        updateBox();

        // hide hint when drawing starts
        if (hint) hint.textContent = "";
        if (sizeBadge) sizeBadge.textContent = "";
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        e.preventDefault();
        currX = e.clientX;
        currY = e.clientY;
        updateBox();
    };

    const onMouseUp = async (e: MouseEvent) => {
        if (!dragging) return;
        e.preventDefault();
        dragging = false;

        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const w = Math.abs(currX - startX);
        const h = Math.abs(currY - startY);

        cleanup();

        if (w < 2 || h < 2) {
            showToast("Selection is too small");
            return;
        }

        const actionTexts: Record<SnipMode, string> = {
            recognize: "Recognizing with AI...",
            solve: "Solving / Answering...",
            code: "Generating code...",
            css: "Extracting CSS styles...",
            custom: __customInstructionLabel ? `${__customInstructionLabel}...` : "Processing..."
        };
        showToast(actionTexts[__currentMode] || "Processing...");

        try {
            const result = await captureTab({ x, y, width: w, height: h }, __currentMode)?.catch?.(err => {
                console.warn(err);
                showToast(`${getModeName(__currentMode)} failed`);
                return null;
            });
            // captureTab already shows success/error toast
            if (!result?.success) {
                console.warn("Capture result:", typeof result == "string" ? result : JSON.stringify(result));
            }
        } catch (err) {
            console.warn(err);
            showToast(`${getModeName(__currentMode)} failed`);
        }
    };

    const onMouseCancel = () => {
        if (!dragging) return;
        dragging = false;
        cleanup();
    };

    function updateBox() {
        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const w = Math.abs(currX - startX);
        const h = Math.abs(currY - startY);

        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
        box.style.width = `${w}px`;
        box.style.height = `${h}px`;

        if (sizeBadge) {
            sizeBadge.textContent = `${Math.round(w)} × ${Math.round(h)}`;
            sizeBadge.style.left = `${w}px`;
            sizeBadge.style.top = `${h}px`;

            if (!sizeBadge.isConnected) {
                box.appendChild(sizeBadge);
            }
        }
    }

    function cleanup() {
        __snipActive = false;
        dragging = false;

        // remove all event listeners
        document.removeEventListener("keydown", onKeyDown, true);
        overlay.removeEventListener("mousedown", onMouseDown);
        overlay.removeEventListener("mousemove", onMouseMove);
        overlay.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousecancel", onMouseCancel, true);

        hideSelection();
    }

    // add event listeners to overlay (not document) for mouse events
    document.addEventListener("keydown", onKeyDown, true);
    overlay.addEventListener("mousedown", onMouseDown);
    overlay.addEventListener("mousemove", onMouseMove);
    overlay.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousecancel", onMouseCancel, true);

    // activate snip mode
    __snipActive = true;
    showSelection();

    const hintTexts: Record<SnipMode, string> = {
        recognize: "Select area. Esc — cancel",
        solve: "Select problem/question. Esc — cancel",
        code: "Select code request. Esc — cancel",
        css: "Select UI to extract CSS. Esc — cancel",
        custom: __customInstructionLabel ? `Select for "${__customInstructionLabel}". Esc — cancel` : "Select area. Esc — cancel"
    };
    if (hint) hint.textContent = hintTexts[__currentMode] || "Select area. Esc — cancel";
    if (sizeBadge) sizeBadge.textContent = "";
}

// ============================================================================
// CRX MESSAGING HANDLERS
// ============================================================================

// Only register CRX messaging handlers if in CRX environment
if (isInCrxEnvironment) {
    // Register handlers for async processing updates
    registerCrxHandler('processingStarted', (data) => {
        console.log('[Snip] Processing started:', data);
        // Update UI to show processing indicator
        showToast(`Starting ${getModeName(__currentMode)}...`, 'info');
    });

    registerCrxHandler('processingComplete', (data) => {
        console.log('[Snip] Processing completed:', data);
        // Processing completion is handled by the main response handler
    });

    registerCrxHandler('processingError', (data) => {
        console.error('[Snip] Processing error:', data);
        showToast(`Processing failed: ${data.error}`, 'error');
    });

    registerCrxHandler('processingProgress', (data) => {
        console.log('[Snip] Processing progress:', data);
        // Could update a progress bar here
        if (data.progress > 0 && data.progress < 100) {
            showToast(`${getModeName(__currentMode)}: ${data.progress}%`, 'info');
        }
    });
}

// initialize on module load
initSnip();
