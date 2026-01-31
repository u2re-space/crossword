// =========================
// Clipboard toolbar (Cut / Copy / Paste)
// =========================

import { log, btnCut, btnCopy, btnPaste, clipboardPreviewEl } from '../utils/utils';
import {
    onServerClipboardUpdate,
    requestClipboardCopy,
    requestClipboardCut,
    requestClipboardPaste,
    requestClipboardGet,
} from '../network/websocket';

function setPreview(text: string, meta?: { source?: string }) {
    if (!clipboardPreviewEl) return;

    const source = meta?.source ? String(meta.source) : 'pc';
    const safeText = String(text ?? '');

    if (!safeText) {
        clipboardPreviewEl.classList.remove('visible');
        clipboardPreviewEl.innerHTML = '';
        return;
    }

    clipboardPreviewEl.innerHTML = `
        <div class="meta">Clipboard (${source})</div>
        <div class="text"></div>
    `;
    const textEl = clipboardPreviewEl.querySelector('.text') as HTMLElement | null;
    if (textEl) textEl.textContent = safeText;
    clipboardPreviewEl.classList.add('visible');
}

async function readPhoneClipboardText(): Promise<string> {
    // Requires HTTPS (or localhost) + user gesture in most browsers.
    const nav: any = navigator as any;
    if (nav?.clipboard?.readText) {
        return await nav.clipboard.readText();
    }
    // Fallback
    return window.prompt('Вставь текст из телефона (clipboard readText недоступен):', '') || '';
}

async function tryWritePhoneClipboardText(text: string): Promise<boolean> {
    const nav: any = navigator as any;
    if (nav?.clipboard?.writeText) {
        try {
            await nav.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

export function initClipboardToolbar() {
    // Keep preview in sync with backend clipboard events
    onServerClipboardUpdate((text, meta) => setPreview(text, meta));

    // Best-effort initial fetch (so UI isn't empty)
    requestClipboardGet().then((res) => {
        if (res?.ok && typeof res.text === 'string') setPreview(res.text, { source: 'pc' });
    });

    btnCopy?.addEventListener('click', async () => {
        const res = await requestClipboardCopy();
        if (!res?.ok) {
            log('Copy failed: ' + (res?.error || 'unknown'));
            return;
        }

        const text = String(res.text || '');
        setPreview(text, { source: 'pc' });

        // Best-effort: try to write to phone clipboard (may be blocked by browser policies).
        const ok = await tryWritePhoneClipboardText(text);
        if (!ok) {
            log('PC clipboard received. If phone clipboard write is blocked, copy from the preview line.');
        }
    });

    btnCut?.addEventListener('click', async () => {
        const res = await requestClipboardCut();
        if (!res?.ok) {
            log('Cut failed: ' + (res?.error || 'unknown'));
            return;
        }

        const text = String(res.text || '');
        setPreview(text, { source: 'pc' });

        const ok = await tryWritePhoneClipboardText(text);
        if (!ok) {
            log('PC clipboard received (after cut). If phone clipboard write is blocked, copy from the preview line.');
        }
    });

    btnPaste?.addEventListener('click', async () => {
        const text = await readPhoneClipboardText();
        if (!text) {
            log('Paste: phone clipboard is empty (or permission denied).');
            return;
        }

        const res = await requestClipboardPaste(text);
        if (!res?.ok) {
            log('Paste failed: ' + (res?.error || 'unknown'));
            return;
        }

        // Show what we just pasted (useful confirmation)
        setPreview(text, { source: 'phone' });
    });
}


