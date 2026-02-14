// =========================
// Keyboard UI Rendering
// =========================

import { H } from 'fest/lure';
import { EMOJI_CATEGORIES, KEYBOARD_LAYOUT, KEYBOARD_LAYOUT_UPPER } from './constants';
import { sendKeyboardChar } from './message';
import { getToggleButton } from './state';

// Create keyboard HTML structure - hidden by default
export function createKeyboardHTML(): string {
    return H`
        <div class="virtual-keyboard-container" data-hidden="true" aria-hidden="true" style="display: none;"></div>
            <div class="keyboard-header">
                <button class="keyboard-close" aria-label="Close keyboard">✕</button>
                <div class="keyboard-tabs">
                    <button class="keyboard-tab active" data-tab="letters">ABC</button>
                    <button class="keyboard-tab" data-tab="emoji">😀</button>
                </div>
            </div>
            <div class="keyboard-content">
                <div class="keyboard-panel active" data-panel="letters">
                    <div class="keyboard-shift-container">
                        <button class="keyboard-shift" data-shift="lower">⇧</button>
                    </div>
                    <div class="keyboard-rows" id="keyboardRows"></div>
                    <div class="keyboard-special">
                        <button class="keyboard-key special space" data-key=" ">Space</button>
                        <button class="keyboard-key special backspace" data-key="backspace">⌫</button>
                        <button class="keyboard-key special enter" data-key="enter">↵</button>
                    </div>
                </div>
                <div class="keyboard-panel" data-panel="emoji">
                    <div class="emoji-categories">
                        ${Object.keys(EMOJI_CATEGORIES).map(cat =>
                            `<button class="emoji-category-btn" data-category="${cat}">${cat}</button>`
                        ).join('')}
                    </div>
                    <div class="emoji-grid" id="emojiGrid"></div>
                </div>
            </div>
        </div>
    `;
}

// Render keyboard layout
export function renderKeyboard(isUpper: boolean = false) {
    const rowsEl = document.getElementById('keyboardRows');
    if (!rowsEl) return;

    rowsEl.innerHTML = '';
    const layout = isUpper ? KEYBOARD_LAYOUT_UPPER : KEYBOARD_LAYOUT;

    layout.forEach((row) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'keyboard-row';
        row.forEach(key => {
            const keyEl = document.createElement('button');
            keyEl.className = 'keyboard-key';
            keyEl.textContent = key;
            keyEl.setAttribute('data-key', key);
            keyEl.addEventListener('click', () => handleKeyPress(key));
            rowEl.appendChild(keyEl);
        });
        rowsEl.appendChild(rowEl);
    });
}

// Render emoji grid
export function renderEmoji(category: string) {
    const gridEl = document.getElementById('emojiGrid');
    if (!gridEl) return;

    const emojis = EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES] || [];
    gridEl.innerHTML = '';

    emojis.forEach(emoji => {
        const emojiEl = document.createElement('button');
        emojiEl.className = 'emoji-key';
        emojiEl.textContent = emoji;
        emojiEl.setAttribute('data-emoji', emoji);
        emojiEl.addEventListener('click', () => handleKeyPress(emoji));
        gridEl.appendChild(emojiEl);
    });
}

// Handle key press
function handleKeyPress(key: string) {
    if (key === 'backspace') {
        sendKeyboardChar('\b');
    } else if (key === 'enter') {
        sendKeyboardChar('\n');
    } else {
        sendKeyboardChar(key);
    }
    // Reduced logging for better performance
    // log(`Keyboard: ${key === ' ' ? 'Space' : key === '\b' ? 'Backspace' : key === '\n' ? 'Enter' : key}`);
}

// Restore button icon
export function restoreButtonIcon() {
    const toggleButton = getToggleButton();
    if (!toggleButton) return;
    // Clear any text content and restore icon immediately (no delay)
    toggleButton.textContent = '⌨️';
    // Move cursor to end to prevent visible selection
    const range = document.createRange();
    const sel = globalThis?.getSelection?.();
    if (sel && toggleButton.firstChild) {
        try {
            range.setStart(toggleButton.firstChild, Math.min(1, toggleButton.textContent.length));
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) {
            // Ignore selection errors
        }
    }
}

