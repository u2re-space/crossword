// =========================
// Keyboard Message Sending
// =========================

import {
    isWSConnected,
    connectWS,
    sendKeyboardChar as wsSendKeyboardChar,
    createKeyboardMessage,
    sendBinaryMessage
} from '../../network/websocket';

// Re-export for backward compatibility and direct binary sending
export function sendKeyboardChar(char: string) {
    // Try to connect if not connected (non-blocking)
    if (!isWSConnected()) {
        connectWS();
    }

    // Use the websocket module's function
    wsSendKeyboardChar(char);
}

// For sending pre-built binary messages (optimization)
export function sendKeyboardBinary(codePoint: number, flags: number) {
    if (!isWSConnected()) {
        connectWS();
    }

    const buffer = createKeyboardMessage(codePoint, flags);
    sendBinaryMessage(buffer);
}
