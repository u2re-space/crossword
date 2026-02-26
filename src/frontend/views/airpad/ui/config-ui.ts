// =========================
// Configuration UI for Airpad
// =========================

import {
    getRemoteHost,
    setRemoteHost,
    getRemotePort,
    setRemotePort,
    getRemoteProtocol,
    setRemoteProtocol,
    getAirPadTransportMode,
    setAirPadTransportMode,
    getAirPadAuthToken,
    setAirPadAuthToken,
    getAirPadClientId,
    setAirPadClientId,
    getAirPadTransportSecret,
    setAirPadTransportSecret,
    getAirPadSigningSecret,
    setAirPadSigningSecret,
} from '../config/config';
import { disconnectWS, connectWS, isWSConnected } from '../network/websocket';
import { hideKeyboard } from '../input/keyboard/handlers';

function getAirpadHostElement(): Element {
    return document.querySelector('.view-airpad') ?? document.querySelector('#app') ?? document.body;
}

// Create configuration overlay
export function createConfigUI(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'config-overlay';
    overlay.innerHTML = `
        <div class="config-panel">
            <h3>Airpad Configuration</h3>

            <div class="config-group">
                <label for="remoteHost">Remote Host/IP:</label>
                <input type="text" id="remoteHost" />
            </div>

            <div class="config-group">
                <label for="remotePort">Remote Port:</label>
                <input type="text" id="remotePort" />
            </div>

            <div class="config-group">
                <label for="remoteProtocol">Remote Protocol:</label>
                <select id="remoteProtocol">
                    <option value="auto">Auto (recommended)</option>
                    <option value="https">HTTPS / WSS</option>
                    <option value="http">HTTP / WS</option>
                </select>
            </div>
            <div class="config-group">
                <label for="airpadTransportMode">Transport:</label>
                <select id="airpadTransportMode">
                    <option value="plaintext">Plaintext</option>
                    <option value="secure">Secure (signed envelope)</option>
                </select>
            </div>
            <div class="config-group">
                <label for="airpadAuthToken">Airpad Auth Token:</label>
                <input type="text" id="airpadAuthToken" />
            </div>
            <div class="config-group">
                <label for="airpadClientId">Airpad Client ID:</label>
                <input type="text" id="airpadClientId" />
            </div>
            <div class="config-group">
                <label for="airpadTransportSecret">Secure Transport Secret:</label>
                <input type="text" id="airpadTransportSecret" />
            </div>
            <div class="config-group">
                <label for="airpadSigningSecret">Signing Secret (HMAC):</label>
                <input type="password" id="airpadSigningSecret" />
            </div>

            <div class="config-actions">
                <button id="saveConfig" type="button">Save & Reconnect</button>
                <button id="cancelConfig" type="button">Cancel</button>
            </div>
        </div>
    `;

    // Add event listeners
    const hostInput = overlay.querySelector('#remoteHost') as HTMLInputElement;
    const portInput = overlay.querySelector('#remotePort') as HTMLInputElement;
    const protocolInput = overlay.querySelector('#remoteProtocol') as HTMLSelectElement;
    const transportModeInput = overlay.querySelector('#airpadTransportMode') as HTMLSelectElement;
    const authTokenInput = overlay.querySelector('#airpadAuthToken') as HTMLInputElement;
    const clientIdInput = overlay.querySelector('#airpadClientId') as HTMLInputElement;
    const transportSecretInput = overlay.querySelector('#airpadTransportSecret') as HTMLInputElement;
    const signingSecretInput = overlay.querySelector('#airpadSigningSecret') as HTMLInputElement;
    const saveButton = overlay.querySelector('#saveConfig') as HTMLButtonElement;
    const cancelButton = overlay.querySelector('#cancelConfig') as HTMLButtonElement;

    hostInput.value = getRemoteHost();
    portInput.value = getRemotePort();
    protocolInput.value = getRemoteProtocol();
    transportModeInput.value = getAirPadTransportMode();
    authTokenInput.value = getAirPadAuthToken();
    clientIdInput.value = getAirPadClientId();
    transportSecretInput.value = getAirPadTransportSecret();
    signingSecretInput.value = getAirPadSigningSecret();

    saveButton.addEventListener('click', () => {
        setRemoteHost(hostInput.value);
        setRemotePort(portInput.value);
        setRemoteProtocol(protocolInput.value);
        setAirPadTransportMode(transportModeInput.value);
        setAirPadAuthToken(authTokenInput.value);
        setAirPadClientId(clientIdInput.value);
        setAirPadTransportSecret(transportSecretInput.value);
        setAirPadSigningSecret(signingSecretInput.value);

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
    // Hide virtual keyboard when opening config dialog
    hideKeyboard();

    const host = getAirpadHostElement();
    let overlay = document.querySelector('.config-overlay') as HTMLElement | null;
    if (overlay && overlay.parentElement !== host) {
        overlay.remove();
        overlay = null;
    }
    if (!overlay) {
        overlay = createConfigUI();
        host.appendChild(overlay);
    } else {
        const hostInput = overlay.querySelector('#remoteHost') as HTMLInputElement | null;
        const portInput = overlay.querySelector('#remotePort') as HTMLInputElement | null;
        const protocolInput = overlay.querySelector('#remoteProtocol') as HTMLSelectElement | null;
        const transportModeInput = overlay.querySelector('#airpadTransportMode') as HTMLSelectElement | null;
        const authTokenInput = overlay.querySelector('#airpadAuthToken') as HTMLInputElement | null;
        const clientIdInput = overlay.querySelector('#airpadClientId') as HTMLInputElement | null;
        const transportSecretInput = overlay.querySelector('#airpadTransportSecret') as HTMLInputElement | null;
        const signingSecretInput = overlay.querySelector('#airpadSigningSecret') as HTMLInputElement | null;
        if (hostInput) hostInput.value = getRemoteHost();
        if (portInput) portInput.value = getRemotePort();
        if (protocolInput) protocolInput.value = getRemoteProtocol();
        if (transportModeInput) transportModeInput.value = getAirPadTransportMode();
        if (authTokenInput) authTokenInput.value = getAirPadAuthToken();
        if (clientIdInput) clientIdInput.value = getAirPadClientId();
        if (transportSecretInput) transportSecretInput.value = getAirPadTransportSecret();
        if (signingSecretInput) signingSecretInput.value = getAirPadSigningSecret();
    }
    overlay.style.display = 'flex';
}