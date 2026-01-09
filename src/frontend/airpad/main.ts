// =========================
// Main entry point
// =========================

//
import './main.scss';

import { registerSW } from 'virtual:pwa-register';

//
import { log, btnConnect } from './utils/utils';
import { initWebSocket } from './network/websocket';
import { initSpeechRecognition, initAiButton } from './input/speech';
import { initAirButton } from './ui/air-button';
import { initRelativeOrientation } from './input/sensor/relative-orientation';
import { initVirtualKeyboard } from './input/virtual-keyboard';
import { initClipboardToolbar } from './ui/clipboard-toolbar';

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
    initWebSocket(btnConnect);
    initSpeechRecognition();
    initAiButton();
    initAirButton();
    initVirtualKeyboard();
    initClipboardToolbar();
    // Включаем RelativeOrientationSensor как основной источник
    initRelativeOrientation();
    // Остальные можно включить при необходимости
    //initGravitySensor();
    //initGyro();
    //initAccelerometer();
});
