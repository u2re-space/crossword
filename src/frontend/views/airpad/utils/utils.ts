// =========================
// Утилиты и DOM элементы
// =========================

// Lazy getters for DOM elements (since HTML is created dynamically)
export const getWsStatusEl = () => document.getElementById('wsStatus');
export const getAirStatusEl = () => document.getElementById('airStatus');
export const getAiStatusEl = () => document.getElementById('aiStatus');
export const getLogEl = () => document.getElementById('logContainer'); // Changed to logContainer
export const getVoiceTextEl = () => document.getElementById('voiceText');
export const getVkStatusEl = () => document.getElementById('vkStatus');

export const getBtnConnect = () => document.getElementById('btnConnect');
export const getAirButton = () => document.getElementById('airButton');
export const getAiButton = () => document.getElementById('aiButton');

export const getBtnCut = () => document.getElementById('btnCut') as HTMLButtonElement | null;
export const getBtnCopy = () => document.getElementById('btnCopy') as HTMLButtonElement | null;
export const getBtnPaste = () => document.getElementById('btnPaste') as HTMLButtonElement | null;
export const getClipboardPreviewEl = () => document.getElementById('clipboardPreview');

// Backward compatibility - return current values or null
export const wsStatusEl = null; // Will be accessed via getter
export const airStatusEl = null;
export const aiStatusEl = null;
export const logEl = null; // Will be accessed via getLogEl()
export const voiceTextEl = null;

export const btnConnect = null; // Will be accessed via getBtnConnect()
export const airButton = null;
export const aiButton = null;

export const btnCut = null;
export const btnCopy = null;
export const btnPaste = null;
export const clipboardPreviewEl = null;

export function log(msg: string) {
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    const logContainer = getLogEl();
    if (logContainer) {
        logContainer.appendChild(line);
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    console.log('[LOG]', msg);
}

