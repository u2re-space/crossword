// =========================
// Main entry point
// =========================

//
import stylesheet from './main.scss?inline';
import { registerSW } from 'virtual:pwa-register';

//
import { log, getBtnConnect } from './utils/utils';
import { initWebSocket } from './network/websocket';
import { initSpeechRecognition, initAiButton } from './input/speech';
import { initAirButton } from './ui/air-button';
import { initRelativeOrientation } from './input/sensor/relative-orientation';
import { initVirtualKeyboard } from './input/virtual-keyboard';
import { initClipboardToolbar } from './ui/clipboard-toolbar';
import { showConfigUI } from './ui/config-ui';
import { loadAsAdopted } from 'fest/dom';
import { H } from 'fest/lure';

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

    // Set up complete HTML structure inside the #app container (based on need-to-port-into-ts.html)
    appContainer.append(H`
        <div class="container">
            <header class="hero">
                <h1>Air Trackpad + AI Assistant</h1>
                <div class="subtitle">
                    Подключись к серверу и используй: Air‑кнопку для курсора, AI‑кнопку для голосовых команд.
                </div>

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
                    </div>

                    <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="btnConnect"
                        class="primary-btn">
                        Подключить WS
                    </button>
                </div>
            </header>

            <div class="stage">
                <div class="ai-block">
                    <div contenteditable="false" virtualkeyboardpolicy="manual" id="aiButton" class="big-button ai">
                        AI
                    </div>
                    <div class="label">Голосовой ассистент (удерживай для записи)</div>
                </div>

                <div class="air-block">
                    <div class="air-row">
                    <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="airButton" class="big-button air">
                        Air
                    </button>
                    <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="airNeighborButton"
                        class="neighbor-button">Act</button>
                    </div>
                    <div class="label">Air‑трекбол/курсор и жесты</div>
                </div>
            </div>

            <div id="voiceText" class="voice-line"></div>

            <div class="hint">
                Жесты Air‑кнопки:
                <ul>
                    <li>Короткий тап — клик.</li>
                    <li>Удержание &gt; 100ms — режим air‑мыши (движение по наклону).</li>
                    <li>Свайп вверх/вниз по самой кнопке — скролл.</li>
                    <li>Свайп влево/вправо — жест (можно повесить действие на сервере).</li>
                </ul>
                AI‑кнопка:
                <ul>
                    <li>Нажми и держи — идёт распознавание речи.</li>
                    <li>Отпусти — команда отправится на сервер как <code>voice_command</code>.</li>
                </ul>
                Виртуальная клавиатура:
                <ul>
                    <li>Нажми кнопку ⌨️ в правом нижнем углу для открытия клавиатуры.</li>
                    <li>Поддерживает ввод текста, эмодзи и специальных символов.</li>
                    <li>Использует бинарный формат для быстрой передачи.</li>
                </ul>
            </div>
        </div>

        <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="logToggle" class="side-log-toggle"
            aria-controls="logOverlay" aria-expanded="false">
            Логи
        </button>

        <div id="logOverlay" class="log-overlay" aria-hidden="true">
            <div class="log-panel">
                <div class="log-overlay-header">
                    <span>Журнал соединения</span>
                    <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="logClose"
                        class="ghost-btn" aria-label="Закрыть логи">Закрыть</button>
                </div>
                <div id="logContainer" class="log-container"></div>
            </div>
        </div>

        <!-- Bottom clipboard toolbar (phone <-> PC) -->
        <div class="bottom-toolbar" id="clipboardToolbar" aria-label="Clipboard actions">
            <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="btnCut"
                class="toolbar-btn" aria-label="Cut (Ctrl+X)">✂️</button>
            <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="btnCopy"
                class="toolbar-btn" aria-label="Copy (Ctrl+C)">📋</button>
            <button contenteditable="false" virtualkeyboardpolicy="manual" type="button" id="btnPaste"
                class="toolbar-btn" aria-label="Paste (Ctrl+V)">📥</button>
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
    function initConfigButton() {
    const configButton = document.createElement('button');
    configButton.className = 'toolbar-btn';
    configButton.textContent = '⚙️';
    configButton.title = 'Configuration';
    configButton.addEventListener('click', showConfigUI);

    const bottomToolbar = document.querySelector('.bottom-toolbar');
    if (bottomToolbar) {
        bottomToolbar.appendChild(configButton);
    }
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

    requestIdleCallback(async () => {
    // PWA: register Service Worker (auto-update)
    try {
        registerSW({
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

    log('Готово. Нажми "Подключить WS", затем используй Air/AI кнопки.');
    log('Движение мыши основано только на Gyroscope API (повороты телефона).');

    initLogOverlay();
    initWebSocket(getBtnConnect());
    initSpeechRecognition();
    initAiButton();
    initAirButton();
    initVirtualKeyboard();
    initClipboardToolbar();
    initConfigButton();
    // Включаем RelativeOrientationSensor как основной источник
    initRelativeOrientation();
    // Остальные можно включить при необходимости
    //initGravitySensor();
    //initGyro();
    //initAccelerometer();
    });
}
