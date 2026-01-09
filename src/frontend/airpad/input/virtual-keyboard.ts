// =========================
// Virtual Keyboard Component
// =========================

import { log } from '../utils/utils';
import { initVirtualKeyboardAPI, hasVirtualKeyboardAPI } from './keyboard/api';
import { setKeyboardElement, setToggleButton } from './keyboard/state';
import { createKeyboardHTML } from './keyboard/ui';
import {
    setupToggleButtonHandler,
    setupVirtualKeyboardAPIHandlers,
    setupKeyboardUIHandlers,
} from './keyboard/handlers';

export function initVirtualKeyboard() {
    // Initialize VirtualKeyboard API if available
    initVirtualKeyboardAPI();
    const hasAPI = hasVirtualKeyboardAPI();

    // Create keyboard element
    const container = document.querySelector('#app') ?? document.body;
    const keyboardHTML = createKeyboardHTML();
    container.insertAdjacentHTML('beforeend', keyboardHTML);
    const keyboardElement = document.querySelector('.virtual-keyboard-container') as HTMLElement;

    if (!keyboardElement) {
        log('Failed to create keyboard element');
        return;
    }

    // Ensure keyboard is hidden by default
    keyboardElement.classList.remove('visible');

    setKeyboardElement(keyboardElement);

    // Create toggle button in corner
    const toggleHTML = hasAPI
        ? '<button type="button" tabindex="-1" contenteditable="true" virtualkeyboardpolicy="manual" class="keyboard-toggle keyboard-toggle-editable" aria-label="Toggle keyboard">⌨️</button>'
        : '<button type="button" tabindex="-1" class="keyboard-toggle" aria-label="Toggle keyboard">⌨️</button>';
    container.insertAdjacentHTML('beforeend', toggleHTML);
    const toggleButton = document.querySelector('.keyboard-toggle') as HTMLElement;

    if (!toggleButton) {
        log('Failed to create toggle button');
        return;
    }

    toggleButton.autofocus = false;
    toggleButton.removeAttribute('autofocus');
    setToggleButton(toggleButton);

    // Setup event handlers
    setupToggleButtonHandler();
    setupVirtualKeyboardAPIHandlers();
    setupKeyboardUIHandlers();

    log('Virtual keyboard initialized');
}
