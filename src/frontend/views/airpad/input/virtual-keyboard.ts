// =========================
// Virtual Keyboard Component
// =========================

import { log } from '../utils/utils';
import { initVirtualKeyboardAPI, hasVirtualKeyboardAPI } from './keyboard/api';
import {
    setKeyboardElement,
    setToggleButton,
    setRemoteKeyboardEnabled as setRemoteKeyboardEnabledState,
    getToggleButton,
} from './keyboard/state';
import { createKeyboardHTML } from './keyboard/ui';
import {
    hideKeyboard,
    setupToggleButtonHandler,
    setupVirtualKeyboardAPIHandlers,
    setupKeyboardUIHandlers,
} from './keyboard/handlers';

function updateToggleButtonEnabledState(enabled: boolean) {
    const toggleButton = getToggleButton();
    if (!(toggleButton instanceof HTMLButtonElement)) return;
    toggleButton.disabled = !enabled;
    toggleButton.setAttribute('aria-disabled', String(!enabled));
}

export function setRemoteKeyboardEnabled(enabled: boolean) {
    setRemoteKeyboardEnabledState(enabled);
    updateToggleButtonEnabledState(enabled);
    if (!enabled) {
        hideKeyboard();
    }
}

export function initVirtualKeyboard() {
    // Initialize VirtualKeyboard API if available
    initVirtualKeyboardAPI();
    const hasAPI = hasVirtualKeyboardAPI();

    // Mount keyboard inside airpad root so it inherits airpad styles/tokens.
    const container = document.querySelector('.view-airpad') ?? document.querySelector('#app') ?? document.body;

    // Reuse existing instance if already mounted.
    let keyboardElement = container.querySelector('.virtual-keyboard-container') as HTMLElement | null;
    if (!keyboardElement) {
        const keyboardHTML = createKeyboardHTML();
        container.insertAdjacentHTML('beforeend', keyboardHTML);
        keyboardElement = container.querySelector('.virtual-keyboard-container') as HTMLElement | null;
    }

    if (!keyboardElement) {
        log('Failed to create keyboard element');
        return;
    }

    // Ensure keyboard is hidden by default
    keyboardElement.classList.remove('visible');

    setKeyboardElement(keyboardElement);

    // Create toggle button in corner
    let toggleButton = container.querySelector('.keyboard-toggle') as HTMLElement | null;
    if (!toggleButton) {
        const toggleHTML = hasAPI
            ? '<button type="button" tabindex="-1" contenteditable="true" virtualkeyboardpolicy="manual" class="keyboard-toggle keyboard-toggle-editable" aria-label="Toggle keyboard">⌨️</button>'
            : '<button type="button" tabindex="-1" class="keyboard-toggle" aria-label="Toggle keyboard">⌨️</button>';
        container.insertAdjacentHTML('beforeend', toggleHTML);
        toggleButton = container.querySelector('.keyboard-toggle') as HTMLElement | null;
    }

    if (!toggleButton) {
        log('Failed to create toggle button');
        return;
    }

    toggleButton.autofocus = false;
    toggleButton.removeAttribute('autofocus');
    setToggleButton(toggleButton);
    setRemoteKeyboardEnabled(false);

    // Setup event handlers
    setupToggleButtonHandler();
    setupVirtualKeyboardAPIHandlers();
    setupKeyboardUIHandlers();

    log('Virtual keyboard initialized');
}
