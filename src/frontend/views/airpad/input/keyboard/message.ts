// =========================
// Keyboard Message Sending
// =========================

import {
    isWSConnected,
    sendKeyboardChar as wsSendKeyboardChar,
    createKeyboardMessage,
    sendBinaryMessage
} from '../../network/websocket';

// Re-export for backward compatibility and direct binary sending
export function sendKeyboardChar(char: string) {
    if (!isWSConnected()) return;

    // Use the websocket module's function
    wsSendKeyboardChar(char);
}

// For sending pre-built binary messages (optimization)
export function sendKeyboardBinary(codePoint: number, flags: number) {
    if (!isWSConnected()) return;

    const buffer = createKeyboardMessage(codePoint, flags);
    sendBinaryMessage(buffer);
}
