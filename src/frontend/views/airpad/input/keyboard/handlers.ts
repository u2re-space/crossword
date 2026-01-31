// =========================
// Keyboard Event Handlers
// =========================

import { log } from '../../utils/utils';
import { sendKeyboardChar } from './message';
import { getVirtualKeyboardAPI, hasVirtualKeyboardAPI } from './api';
import {
    isKeyboardVisible,
    setKeyboardVisible,
    getKeyboardElement,
    getToggleButton
} from './state';
import { renderKeyboard, renderEmoji, restoreButtonIcon } from './ui';

const DEBUG_KEYBOARD_INPUT = false;

// Show keyboard
export function showKeyboard() {
    // Don't show keyboard if config dialog is open
    const configOverlay = document.querySelector('.config-overlay');
    if (configOverlay && configOverlay.classList.contains('flex')) {
        return;
    }

    const keyboardElement = getKeyboardElement();
    //if (!keyboardElement) return;

    const virtualKeyboardAPI = getVirtualKeyboardAPI();
    const toggleButton = getToggleButton();

    if (virtualKeyboardAPI) {
        toggleButton!.contentEditable = 'true';
        restoreButtonIcon();
        toggleButton?.focus();
        virtualKeyboardAPI.show();
    } else {
        setKeyboardVisible(true);
        keyboardElement?.classList?.add?.('visible');
    }

    renderKeyboard(false);
    renderEmoji('smileys');
}

// Flag to prevent recursive hideKeyboard calls
let isHidingKeyboard = false;

// Hide keyboard
export function hideKeyboard() {
    // Prevent recursive calls
    if (isHidingKeyboard) return;
    isHidingKeyboard = true;

    try {
        const keyboardElement = getKeyboardElement();
        //if (!keyboardElement) return;

        const virtualKeyboardAPI = getVirtualKeyboardAPI();
        const toggleButton = getToggleButton();
        //toggleButton?.focus?.();

        setKeyboardVisible(false);
        keyboardElement?.classList?.remove?.('visible');

        if (virtualKeyboardAPI) {
            restoreButtonIcon();
            virtualKeyboardAPI.hide();
            toggleButton?.blur();
        }

        (document.activeElement as HTMLElement)?.blur?.();
    } finally {
        isHidingKeyboard = false;
    }
}

// Toggle keyboard visibility
export function toggleKeyboard() {
    if (isKeyboardVisible()) {
        hideKeyboard();
    } else {
        showKeyboard();
    }
}

// Setup toggle button click handler
export function setupToggleButtonHandler() {
    const toggleButton = getToggleButton();
    const virtualKeyboardAPI = getVirtualKeyboardAPI();

    if (!toggleButton) return;

    toggleButton.addEventListener('click', (e) => {
        // Don't allow keyboard toggle if config dialog is open
        const configOverlay = document.querySelector('.config-overlay');
        if (configOverlay && configOverlay.classList.contains('flex')) {
            return;
        }

        if (virtualKeyboardAPI) {
            e.preventDefault();
        }
        toggleKeyboard();
    });
}

// Setup VirtualKeyboard API input handlers
export function setupVirtualKeyboardAPIHandlers() {
    const virtualKeyboardAPI = getVirtualKeyboardAPI();
    const toggleButton = getToggleButton();

    if (!virtualKeyboardAPI || !toggleButton) return;

    const ICON = '⌨️';
    let pendingRestore: number | null = null;

    // Track what was handled to prevent duplicates
    let lastHandledKey: string | null = null;
    let lastHandledTime: number = 0;
    const DEDUP_WINDOW_MS = 80;

    // Track if we're waiting for input event after Unidentified keydown
    let waitingForInput = false;

    // Track last known content for diff-based input detection
    let lastKnownContent = ICON;

    // Track if beforeinput fired (to know if input is fallback)
    let beforeInputFired = false;

    // ==================
    // COMPOSITION STATE - Track incremental composition
    // ==================
    let isComposing = false;
    let lastCompositionText = ''; // Track what we've already sent during composition
    let compositionTimeout: number | null = null;
    const COMPOSITION_TIMEOUT_MS = 600;

    // Reset composition state
    const resetCompositionState = (immediate: boolean = false) => {
        if (compositionTimeout !== null) {
            clearTimeout(compositionTimeout);
            compositionTimeout = null;
        }

        if (immediate) {
            isComposing = false;
            lastCompositionText = '';
        } else {
            compositionTimeout = window.setTimeout(() => {
                isComposing = false;
                lastCompositionText = '';
                compositionTimeout = null;
            }, COMPOSITION_TIMEOUT_MS);
        }
    };

    // Helper to check if we should skip (already handled recently)
    const shouldSkipDuplicate = (key: string): boolean => {
        const now = Date.now();
        if (lastHandledKey === key && (now - lastHandledTime) < DEDUP_WINDOW_MS) {
            return true;
        }
        lastHandledKey = key;
        lastHandledTime = now;
        return false;
    };

    // Helper to schedule icon restore with debounce
    const scheduleRestore = () => {
        queueMicrotask(() => {
            pendingRestore = null;
            restoreButtonIcon();
            lastKnownContent = ICON;
        /*if (pendingRestore !== null) {
            clearTimeout(pendingRestore);
        }
        pendingRestore = window.setTimeout(() => {
            pendingRestore = null;
            restoreButtonIcon();
            lastKnownContent = ICON;
        }, 1);*/
        });
    };

    // Helper to send char and restore
    const sendAndRestore = (char: string) => {
        sendKeyboardChar(char);
        scheduleRestore();
    };

    // Helper to extract clean text (without icon)
    const getCleanText = (text: string): string => {
        return text
            .replace(/⌨️/g, '')
            .replace(/⌨\uFE0F?/g, '')
            .replace(/\uFE0F/g, '');
    };

    // Helper to find new characters by comparing strings
    const findNewCharacters = (currentText: string, previousText: string): string => {
        const cleanCurrent = getCleanText(currentText);
        const cleanPrevious = getCleanText(previousText);

        // If current starts with previous, return the new part
        if (cleanCurrent.startsWith(cleanPrevious)) {
            return cleanCurrent.slice(cleanPrevious.length);
        }

        // If previous starts with current, characters were deleted
        if (cleanPrevious.startsWith(cleanCurrent)) {
            return ''; // Deletion, not addition
        }

        // Complete change - return all new text
        return cleanCurrent;
    };

    // ==================
    // KEYDOWN - Special keys + detect Unidentified for mobile
    // ==================
    toggleButton.addEventListener('keydown', (e) => {
        // Check native isComposing flag
        if (e.isComposing) {
            if (compositionTimeout !== null) {
                clearTimeout(compositionTimeout);
                compositionTimeout = null;
            }
            return;
        }

        // Trust event's isComposing over our flag
        if (isComposing && !e.isComposing) {
            resetCompositionState(true);
        }

        beforeInputFired = false;

        // Backspace / Delete
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            e.stopPropagation();
            waitingForInput = false;
            if (!shouldSkipDuplicate('backspace')) {
                sendAndRestore('\b');
            }
            return;
        }

        // Enter
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            waitingForInput = false;
            resetCompositionState(true);
            if (!shouldSkipDuplicate('enter')) {
                sendAndRestore('\n');
            }
            return;
        }

        // Tab
        if (e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            waitingForInput = false;
            if (!shouldSkipDuplicate('tab')) {
                sendAndRestore('\t');
            }
            return;
        }

        // Unidentified / Process - mobile virtual keyboards
        if (e.key === 'Unidentified' || e.key === 'Process' || e.key === '') {
            waitingForInput = true;
            lastKnownContent = toggleButton.textContent || ICON;
            return;
        }

        // Space
        if (e.key === ' ') {
            e.preventDefault();
            waitingForInput = false;
            resetCompositionState(true);
            return;
        }

        // Printable characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            waitingForInput = false;
            return;
        }

        waitingForInput = false;
    });

    // ==================
    // BEFOREINPUT - Main handler for text input
    // ==================
    toggleButton.addEventListener('beforeinput', (e) => {
        const inputEvent = e as InputEvent;
        lastKnownContent = toggleButton.textContent || ICON;
        beforeInputFired = true;

        // Let composition input through - we handle it in compositionupdate
        if (inputEvent.inputType === 'insertCompositionText') {
            if (compositionTimeout !== null) {
                clearTimeout(compositionTimeout);
                compositionTimeout = null;
            }
            return;
        }

        // insertText while composing means composition ended naturally
        if (inputEvent.inputType === 'insertText' && isComposing) {
            resetCompositionState(true);
        }

        // Handle Unidentified key
        if (waitingForInput && inputEvent.inputType === 'insertText' && inputEvent.data) {
            e.preventDefault();
            waitingForInput = false;

            if (!shouldSkipDuplicate(`text:${inputEvent.data}`)) {
                for (const char of inputEvent.data) {
                    sendKeyboardChar(char);
                }
                scheduleRestore();
            }
            return;
        }

        // insertText - regular character input
        if (inputEvent.inputType === 'insertText') {
            e.preventDefault();
            const data = inputEvent.data;
            if (data && !shouldSkipDuplicate(`text:${data}`)) {
                for (const char of data) {
                    sendKeyboardChar(char);
                }
                scheduleRestore();
            }
            return;
        }

        // insertReplacementText - autocomplete/suggestions
        if (inputEvent.inputType === 'insertReplacementText') {
            e.preventDefault();
            resetCompositionState(true);
            const data = inputEvent.data || (inputEvent as any).dataTransfer?.getData('text');
            if (data && !shouldSkipDuplicate(`replace:${data}`)) {
                for (const char of data) {
                    sendKeyboardChar(char);
                }
                scheduleRestore();
            }
            return;
        }

        // insertLineBreak / insertParagraph
        if (inputEvent.inputType === 'insertLineBreak' || inputEvent.inputType === 'insertParagraph') {
            e.preventDefault();
            resetCompositionState(true);
            if (!shouldSkipDuplicate('linebreak')) {
                sendAndRestore('\n');
            }
            return;
        }

        // deleteContentBackward / deleteContentForward
        if (inputEvent.inputType === 'deleteContentBackward' || inputEvent.inputType === 'deleteContentForward') {
            e.preventDefault();
            if (!shouldSkipDuplicate('deleteback')) {
                sendAndRestore('\b');
            }
            return;
        }

        // insertFromPaste
        if (inputEvent.inputType === 'insertFromPaste') {
            e.preventDefault();
            resetCompositionState(true);
            const data = inputEvent.data || (inputEvent as any).dataTransfer?.getData('text/plain');
            if (data) {
                for (const char of data) {
                    sendKeyboardChar(char);
                }
                scheduleRestore();
            }
            return;
        }
    });

    // ==================
    // COMPOSITION - Send characters incrementally during compositionupdate
    // ==================
    toggleButton.addEventListener('compositionstart', () => {
        if (compositionTimeout !== null) {
            clearTimeout(compositionTimeout);
            compositionTimeout = null;
        }
        isComposing = true;
        lastCompositionText = '';
        waitingForInput = false;
        if (DEBUG_KEYBOARD_INPUT) console.log('[Composition] start');
    });

    toggleButton.addEventListener('compositionupdate', (e) => {
        if (compositionTimeout !== null) {
            clearTimeout(compositionTimeout);
            compositionTimeout = null;
        }

        const currentText = e.data || '';
        if (DEBUG_KEYBOARD_INPUT) console.log('[Composition] update:', currentText, 'last:', lastCompositionText);

        // Find what's new since last update
        if (currentText.startsWith(lastCompositionText)) {
            // Characters were added
            const newChars = currentText.slice(lastCompositionText.length);
            if (newChars.length > 0) {
                if (DEBUG_KEYBOARD_INPUT) console.log('[Composition] sending new chars:', newChars);
                for (const char of newChars) {
                    sendKeyboardChar(char);
                }
            }
        } else if (lastCompositionText.startsWith(currentText)) {
            // Characters were deleted (backspace during composition)
            const deletedCount = lastCompositionText.length - currentText.length;
            if (DEBUG_KEYBOARD_INPUT) console.log('[Composition] deleted chars:', deletedCount);
            for (let i = 0; i < deletedCount; i++) {
                sendKeyboardChar('\b');
            }
        } else {
            // Complete replacement (autocorrect, word selection)
            // Delete old text and send new
            if (DEBUG_KEYBOARD_INPUT) console.log('[Composition] replacement detected');
            for (let i = 0; i < lastCompositionText.length; i++) {
                sendKeyboardChar('\b');
            }
            for (const char of currentText) {
                sendKeyboardChar(char);
            }
        }

        // Update tracking
        lastCompositionText = currentText;
        scheduleRestore();
    });

    toggleButton.addEventListener('compositionend', (e) => {
        if (DEBUG_KEYBOARD_INPUT) console.log('[Composition] end:', e.data, 'lastSent:', lastCompositionText);

        if (compositionTimeout !== null) {
            clearTimeout(compositionTimeout);
            compositionTimeout = null;
        }

        const finalText = e.data || '';

        // Check if compositionend brings new data not sent via update
        // This happens when user selects from autocomplete suggestions
        if (finalText !== lastCompositionText) {
            // Delete what we sent during composition
            for (let i = 0; i < lastCompositionText.length; i++) {
                sendKeyboardChar('\b');
            }
            // Send the final text
            for (const char of finalText) {
                sendKeyboardChar(char);
            }
        }

        // Reset composition state
        isComposing = false;
        lastCompositionText = '';
        scheduleRestore();
    });

    // ==================
    // INPUT - Fallback handler
    // ==================
    toggleButton.addEventListener('input', (e) => {
        const inputEvent = e as InputEvent;

        // Skip composition-related input - handled by composition events
        if (inputEvent.inputType === 'insertCompositionText' ||
            inputEvent.inputType?.includes('Composition')) {
            return;
        }

        // If we're composing, let composition events handle it
        if (isComposing) {
            return;
        }

        const target = e.target as HTMLElement;
        const currentText = target.textContent || '';

        // Case 1: Waiting for input after Unidentified keydown
        if (waitingForInput) {
            waitingForInput = false;

            const newChars = findNewCharacters(currentText, lastKnownContent);
            if (DEBUG_KEYBOARD_INPUT) console.log('[Input] Unidentified key chars:', newChars);

            if (newChars.length > 0 && !shouldSkipDuplicate(`unidentified:${newChars}`)) {
                for (const char of newChars) {
                    sendKeyboardChar(char);
                }
            }

            scheduleRestore();
            return;
        }

        // Case 2: beforeinput didn't fire
        if (!beforeInputFired) {
            const newChars = findNewCharacters(currentText, lastKnownContent);

            if (newChars.length > 0 && !shouldSkipDuplicate(`input:${newChars}`)) {
                for (const char of newChars) {
                    sendKeyboardChar(char);
                }
            }

            scheduleRestore();
            return;
        }

        // Case 3: Normal case - just restore
        scheduleRestore();
        beforeInputFired = false;
    });

    // ==================
    // PASTE
    // ==================
    toggleButton.addEventListener('paste', (e) => {
        e.preventDefault();
        e.stopPropagation();
        waitingForInput = false;
        resetCompositionState(true);

        const pastedText = e.clipboardData?.getData('text') || '';
        if (pastedText) {
            for (const char of pastedText) {
                sendKeyboardChar(char);
            }
            scheduleRestore();
        }
    });

    // ==================
    // DROP
    // ==================
    toggleButton.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        waitingForInput = false;
        resetCompositionState(true);

        const droppedText = e.dataTransfer?.getData('text') || '';
        if (droppedText) {
            for (const char of droppedText) {
                sendKeyboardChar(char);
            }
        }
        scheduleRestore();
    });

    // ==================
    // FOCUS/BLUR
    // ==================
    toggleButton.addEventListener('blur', () => {
        if (pendingRestore !== null) {
            clearTimeout(pendingRestore);
            pendingRestore = null;
        }
        if (compositionTimeout !== null) {
            clearTimeout(compositionTimeout);
            compositionTimeout = null;
        }
        isComposing = false;
        lastCompositionText = '';
        waitingForInput = false;
        lastHandledKey = null;
        beforeInputFired = false;
        lastKnownContent = ICON;
        restoreButtonIcon();
    });

    toggleButton.addEventListener('focus', () => {
        lastHandledKey = null;
        lastHandledTime = 0;
        waitingForInput = false;
        beforeInputFired = false;
        isComposing = false;
        lastCompositionText = '';
        if (compositionTimeout !== null) {
            clearTimeout(compositionTimeout);
            compositionTimeout = null;
        }
        lastKnownContent = ICON;
        restoreButtonIcon();
    });
}

// Setup keyboard UI event handlers
export function setupKeyboardUIHandlers() {
    const keyboardElement = getKeyboardElement();
    if (!keyboardElement) return;

    const closeBtn = keyboardElement.querySelector('.keyboard-close');
    closeBtn?.addEventListener('click', hideKeyboard);

    const tabs = keyboardElement.querySelectorAll('.keyboard-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const panels = keyboardElement?.querySelectorAll('.keyboard-panel');
            panels?.forEach(panel => {
                panel.classList.remove('active');
                if (panel.getAttribute('data-panel') === targetTab) {
                    panel.classList.add('active');
                }
            });
        });
    });

    const shiftBtn = keyboardElement.querySelector('.keyboard-shift');
    let isUpper = false;
    shiftBtn?.addEventListener('click', () => {
        isUpper = !isUpper;
        renderKeyboard(isUpper);
        shiftBtn.classList.toggle('active', isUpper);
    });

    const categoryBtns = keyboardElement.querySelectorAll('.emoji-category-btn');
    if (categoryBtns.length > 0) {
        const firstBtn = categoryBtns[0] as HTMLElement;
        firstBtn.classList.add('active');
        const firstCategory = firstBtn.getAttribute('data-category');
        if (firstCategory) {
            renderEmoji(firstCategory);
        }

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                if (category) {
                    categoryBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderEmoji(category);
                }
            });
        });
    }

    keyboardElement.addEventListener('click', (e) => {
        if (e.target === keyboardElement) {
            hideKeyboard();
        }
    });

    document.addEventListener('focusout', (e) => {
        const target = e?.target as HTMLElement;
        const relatedTarget = e?.relatedTarget as HTMLElement;

        // Don't hide keyboard if focus is moving within config overlay
        if (!(target?.closest?.('.config-overlay') || relatedTarget?.closest?.('.config-overlay'))) {
            hideKeyboard();
        }
    });

    document.addEventListener('click', (e) => {
        const target = e?.target as HTMLElement;
        if (!(target?.matches?.("input,textarea,select,button,[contenteditable=\"true\"]") ||
              target?.closest?.('.config-overlay'))) {
            hideKeyboard();
        }
    });

    document.addEventListener('pointerdown', (e) => {
        const target = e?.target as HTMLElement;
        if (!(target?.matches?.("input,textarea,select,button,[contenteditable=\"true\"]") ||
              target?.closest?.('.config-overlay'))) {
            hideKeyboard();
        }
    });
}
