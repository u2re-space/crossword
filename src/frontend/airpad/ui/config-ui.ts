// =========================
// Configuration UI for Airpad
// =========================

import { H } from "fest/lure";
import { getRemoteHost, setRemoteHost, getRemotePort, setRemotePort } from '../config/config';
import { disconnectWS, connectWS, isWSConnected } from '../network/websocket';

// Create configuration overlay
export function createConfigUI(): HTMLElement {
    const overlay = H`<div class="config-overlay">
        <div class="config-panel">
            <h3>Airpad Configuration</h3>

            <div class="config-group">
                <label for="remoteHost">Remote Host/IP:</label>
                <input type="text" id="remoteHost" value="${getRemoteHost()}" />
            </div>

            <div class="config-group">
                <label for="remotePort">Remote Port:</label>
                <input type="text" id="remotePort" value="${getRemotePort()}" />
            </div>

            <div class="config-actions">
                <button id="saveConfig">Save & Reconnect</button>
                <button id="cancelConfig">Cancel</button>
            </div>
        </div>
    </div>` as HTMLElement;

    // Add event listeners
    const hostInput = overlay.querySelector('#remoteHost') as HTMLInputElement;
    const portInput = overlay.querySelector('#remotePort') as HTMLInputElement;
    const saveButton = overlay.querySelector('#saveConfig') as HTMLButtonElement;
    const cancelButton = overlay.querySelector('#cancelConfig') as HTMLButtonElement;

    saveButton.addEventListener('click', () => {
        setRemoteHost(hostInput.value);
        setRemotePort(portInput.value);

        // Disconnect and reconnect with new settings
        if (isWSConnected()) {
            disconnectWS();
        }
        setTimeout(() => connectWS(), 100);

        // Hide overlay
        overlay.style.display = 'none';
    });

    cancelButton.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
        }
    });

    return overlay;
}

// Show configuration overlay
export function showConfigUI(): void {
    let overlay = document.querySelector('.config-overlay') as HTMLElement;
    if (!overlay) {
        overlay = createConfigUI();
        (document.querySelector('#app') ?? document.body).appendChild(overlay);
    }
    overlay.style.display = 'flex';
}