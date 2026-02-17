// =========================
// Main entry point
// =========================

//
import stylesheet from './main.scss?inline';
import { initServiceWorker } from '@rs-frontend/pwa/sw-handling';

//
import { log, getBtnConnect } from './utils/utils';
import { initWebSocket, onWSConnectionChange } from './network/websocket';
import { initSpeechRecognition, initAiButton } from './input/speech';
import { initAirButton } from './ui/air-button';
import { initRelativeOrientation } from './input/sensor/relative-orientation';
import { initVirtualKeyboard, setRemoteKeyboardEnabled } from './input/virtual-keyboard';
import { initClipboardToolbar } from './ui/clipboard-toolbar';
import { showConfigUI } from './ui/config-ui';
import { loadAsAdopted } from 'fest/dom';
import { H } from 'fest/lure';
import { resetMotionAccum } from './config/motion-state';
import { resetMotionBaseline } from './ui/air-button';
import { resetRelativeOrientationRuntimeState } from './input/sensor/relative-orientation';

let unsubscribeWsKeyboardSync: (() => void) | null = null;

// =========================
// Mount function for routing system
// =========================

export default async function mountAirpad(mountElement: HTMLElement): Promise<void> {
    console.log('[Airpad] Mounting airpad app...');

    loadAsAdopted(stylesheet);

    // Find or create #app container
    let appContainer = mountElement ?? document.body.querySelector('#app') ?? document.body as HTMLElement;
    if (!appContainer) {
        appContainer = document.createElement('div');
        appContainer.id = 'app';
    }

    // Replace previous airpad markup to avoid duplicate UI when remounting.
    appContainer.replaceChildren(H`
        <div class="container">
            <header class="hero">
                <div class="status-container">
                    <div class="status-bar">
                        <div class="status-item">
                            WS:
                            <span id="wsStatus" class="value ws-status-bad">disconnected</span>
                        </div>
                        <div class="status-item">
                            Air:
                            <span id="airStatus" class="value">IDLE</span>
                        </div>
                        <div class="status-item">
                            AI:
                            <span id="aiStatus" class="value">idle</span>
                        </div>
                        <div class="status-item">
                            VK:
                            <span id="vkStatus" class="value">overlay:off</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="stage">
                <div class="ai-block">
                    <div id="aiButton" class="big-button ai" data-no-virtual-keyboard="true">
                        AI
                    </div>
                    <div class="label">Голосовой ассистент (удерживай для записи)</div>
                </div>

                <div class="air-block">
                    <div class="air-row">
                    <button type="button" id="airButton" class="big-button air" data-no-virtual-keyboard="true">
                        Air
                    </button>
                    <button type="button" id="airNeighborButton" data-no-virtual-keyboard="true"
                        class="neighbor-button">Act</button>
                    </div>
                    <div class="label">Air‑трекбол/курсор и жесты</div>
                </div>
            </div>
            <div id="voiceText" class="voice-line"></div>
        </div>

        <div class="side-actions-row" role="group" aria-label="Panels">
            <button type="button" id="hintToggle" class="side-log-toggle side-hint-toggle"
                aria-controls="hintOverlay" aria-expanded="false">
                Hints
            </button>
            <button type="button" id="logToggle" class="side-log-toggle"
                aria-controls="logOverlay" aria-expanded="false">
                Логи
            </button>
            <button type="button" id="btnMotionReset" class="side-log-toggle side-fix-toggle"
                aria-label="Reset motion calibration">
                Fix
            </button>
        </div>

        <div id="logOverlay" class="log-overlay" aria-hidden="true">
            <div class="log-panel">
                <div class="log-overlay-header">
                    <span>Журнал соединения</span>
                    <button type="button" id="logClose" class="ghost-btn" aria-label="Закрыть логи">Закрыть</button>
                </div>
                <div id="logContainer" class="log-container"></div>
            </div>
        </div>

        <div id="hintOverlay" class="log-overlay hint-overlay" aria-hidden="true">
            <div class="log-panel hint-panel">
                <div class="log-overlay-header">
                    <span>Подсказки AirPad</span>
                    <button type="button" id="hintClose" class="ghost-btn" aria-label="Закрыть подсказки">Закрыть</button>
                </div>
                <section class="hint hint-modal-content" id="hintPanel" aria-label="Airpad quick help">
                    <details class="hint-group" data-hint-group>
                        <summary>Жесты Air-кнопки</summary>
                        <ul>
                            <li>Короткий тап — клик.</li>
                            <li>Удержание &gt; 100ms — режим air-мыши.</li>
                            <li>Свайп вверх/вниз по кнопке — скролл.</li>
                            <li>Свайп влево/вправо — жест.</li>
                        </ul>
                    </details>

                    <details class="hint-group" data-hint-group>
                        <summary>AI-кнопка</summary>
                        <ul>
                            <li>Нажми и держи — идёт распознавание речи.</li>
                            <li>Отпусти — команда уйдёт как <code>voice_command</code>.</li>
                        </ul>
                    </details>

                    <details class="hint-group" data-hint-group>
                        <summary>Виртуальная клавиатура</summary>
                        <ul>
                            <li>Открой кнопкой ⌨️ на нижней панели.</li>
                            <li>Поддерживает текст, эмодзи и спецсимволы.</li>
                            <li>Передаёт ввод в бинарном формате.</li>
                        </ul>
                    </details>
                </section>
            </div>
        </div>

        <!-- Bottom clipboard toolbar (phone <-> PC) -->
        <div class="bottom-toolbar" id="clipboardToolbar" aria-label="Clipboard actions">
            <button type="button" id="btnCut" class="toolbar-btn" aria-label="Cut (Ctrl+X)">✂️</button>
            <button type="button" id="btnCopy" class="toolbar-btn" aria-label="Copy (Ctrl+C)">📋</button>
            <button type="button" id="btnPaste" class="toolbar-btn" aria-label="Paste (Ctrl+V)">📥</button>
            <button type="button" id="btnConnect" class="toolbar-btn connect-fab connect-fab--ws">WS ↔</button>
        </div>
        <div id="clipboardPreview" class="clipboard-preview" aria-live="polite"></div>
    `);

    // Initialize the airpad functionality
    await initAirpadApp();
}

// =========================
// Internal initialization
// =========================

async function initAirpadApp(): Promise<void> {
    function resetMotionRuntime() {
        resetMotionAccum();
        resetMotionBaseline();
        resetRelativeOrientationRuntimeState();
        log('Motion runtime state reset (recalibrated).');
    }

    function initConfigButton() {
    const existingConfigButton = document.getElementById('btnConfig');
    if (existingConfigButton) {
        return;
    }

    const configButton = document.createElement('button');
    configButton.id = 'btnConfig';
    configButton.type = 'button';
    configButton.className = 'toolbar-btn';
    configButton.textContent = '⚙️';
    configButton.title = 'Configuration';
    configButton.setAttribute('aria-label', 'Configuration');
    configButton.addEventListener('click', showConfigUI);

    const bottomToolbar = document.querySelector('.bottom-toolbar');
    if (bottomToolbar) {
        bottomToolbar.appendChild(configButton);
    }
}

    function initMotionResetButton() {
    const resetButton = document.getElementById('btnMotionReset') as HTMLButtonElement | null;
    if (!resetButton) return;
    resetButton.title = 'Reset motion calibration';
    resetButton.onclick = () => resetMotionRuntime();
}

// =========================
// Init
// =========================
function initLogOverlay() {
    const overlay = document.getElementById('logOverlay');
    const toggle = document.getElementById('logToggle');
    const close = document.getElementById('logClose');

    if (!overlay || !toggle) {
        return;
    }

    const openOverlay = () => {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
    };

    const closeOverlay = () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', openOverlay);
    close?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            closeOverlay();
        }
    });
    }

function initHintOverlay() {
    const overlay = document.getElementById('hintOverlay');
    const toggle = document.getElementById('hintToggle');
    const close = document.getElementById('hintClose');

    if (!overlay || !toggle) {
        return;
    }

    const openOverlay = () => {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
    };

    const closeOverlay = () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', openOverlay);
    close?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            closeOverlay();
        }
    });
}

    function initAdaptiveHintPanel() {
        const hintRoot = document.getElementById('hintPanel');
        if (!hintRoot) return;

        const groups = Array.from(hintRoot.querySelectorAll('[data-hint-group]')) as HTMLDetailsElement[];
        if (groups.length === 0) return;

        const compactMedia = globalThis.matchMedia('(max-width: 980px), (max-height: 860px)');
        const applyHintDensity = () => {
            const compact = compactMedia.matches;
            groups.forEach((group) => {
                if (compact) { group.open = false; }
            });
        };

        applyHintDensity();
        compactMedia.addEventListener?.('change', applyHintDensity);
    }

    const scheduleIdle = (cb: () => void) => {
        if (typeof globalThis.requestIdleCallback === 'function') {
            globalThis.requestIdleCallback(() => cb());
            return;
        }
        globalThis.setTimeout(cb, 0);
    };

    scheduleIdle(async () => {
    // PWA: register Service Worker (auto-update)
    try {
        initServiceWorker({
            immediate: true,
            onRegistered() {
                log('PWA: service worker registered');
            },
            onRegisterError(error) {
                log('PWA: service worker register error: ' + ((error as any)?.message ?? String(error)));
            },
        });
    } catch (err: any) {
        log('PWA: service worker disabled: ' + (err?.message || err));
    }

    log('Готово. Нажми "WS Connect", затем используй Air/AI кнопки.');
    log('Движение мыши основано только на Gyroscope API (повороты телефона).');

    initLogOverlay();
    initHintOverlay();
    initWebSocket(getBtnConnect());
    initSpeechRecognition();
    initAiButton();
    initAirButton();
    initVirtualKeyboard();
    unsubscribeWsKeyboardSync?.();
    unsubscribeWsKeyboardSync = onWSConnectionChange((connected) => {
        setRemoteKeyboardEnabled(connected);
    });
    initClipboardToolbar();
    initConfigButton();
    initAdaptiveHintPanel();
    // Включаем RelativeOrientationSensor как основной источник
    initRelativeOrientation();
    initMotionResetButton();
    // Остальные можно включить при необходимости
    //initGravitySensor();
    //initGyro();
    //initAccelerometer();
    });
}
