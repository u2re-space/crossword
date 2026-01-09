// =========================
// Утилиты и DOM элементы
// =========================

export const wsStatusEl = document.getElementById('wsStatus');
export const airStatusEl = document.getElementById('airStatus');
export const aiStatusEl = document.getElementById('aiStatus');
export const logEl = document.getElementById('log');
export const voiceTextEl = document.getElementById('voiceText');

export const btnConnect = document.getElementById('btnConnect');
export const airButton = document.getElementById('airButton');
export const aiButton = document.getElementById('aiButton');

export const btnCut = document.getElementById('btnCut') as HTMLButtonElement | null;
export const btnCopy = document.getElementById('btnCopy') as HTMLButtonElement | null;
export const btnPaste = document.getElementById('btnPaste') as HTMLButtonElement | null;
export const clipboardPreviewEl = document.getElementById('clipboardPreview');

export function log(msg: string) {
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (logEl) {
        logEl.prepend(line);
    }
    console.log('[LOG]', msg);
}

