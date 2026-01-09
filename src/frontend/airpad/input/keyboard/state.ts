// =========================
// Keyboard State Management
// =========================

let keyboardVisible = false;
let keyboardElement: HTMLElement | null = null;
let toggleButton: HTMLElement | null = null;

export function setKeyboardVisible(visible: boolean) {
    keyboardVisible = visible;
}

export function isKeyboardVisible(): boolean {
    return keyboardVisible;
}

export function setKeyboardElement(element: HTMLElement | null) {
    keyboardElement = element;
}

export function getKeyboardElement(): HTMLElement | null {
    return keyboardElement;
}

export function setToggleButton(button: HTMLElement | null) {
    toggleButton = button;
}

export function getToggleButton(): HTMLElement | null {
    return toggleButton;
}

if ('visualViewport' in window) {
    const VIEWPORT_VS_CLIENT_HEIGHT_RATIO = 0.75;
    window.visualViewport.addEventListener('resize', function (event) {
        if (
            (event.target.height * event.target.scale) / window.screen.height <
            VIEWPORT_VS_CLIENT_HEIGHT_RATIO
        ) keyboardVisible = true;
        else keyboardVisible = false;
    });
}

if ('virtualKeyboard' in navigator) {
    // Tell the browser you are taking care of virtual keyboard occlusions yourself.
    navigator.virtualKeyboard.overlaysContent = true;
    navigator.virtualKeyboard.addEventListener('geometrychange', (event) => {
        const { x, y, width, height } = event.target.boundingRect;
        if (height > 0) keyboardVisible = true;
        else keyboardVisible = false;
    });
}
