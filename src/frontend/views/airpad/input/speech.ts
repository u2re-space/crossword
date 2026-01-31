// =========================
// SpeechRecognition (AI-кнопка)
// =========================

import { log, aiButton, aiStatusEl, voiceTextEl } from '../utils/utils';
import { sendWS, connectWS, isWSConnected } from '../network/websocket';

let recognition: any = null;
let aiListening = false;
export let aiModeActive = false;

export const checkIsAiModeActive = () => {
    return aiListening || aiModeActive;
}

function setAiStatus(text: string) {
    if (aiStatusEl) {
        aiStatusEl.textContent = text;
    }
}

function setupSpeechRecognition() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
        log('SpeechRecognition API не поддерживается.');
        return null;
    }
    const recog = new SR();
    recog.lang = 'ru-RU';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    return recog;
}

export function initSpeechRecognition() {
    recognition = setupSpeechRecognition();

    if (recognition) {
        recognition.onstart = () => {
            aiListening = true;
            aiModeActive = true;
            if (aiButton) {
                aiButton.classList.add('listening');
            }
            setAiStatus('listening');
            if (voiceTextEl) {
                voiceTextEl.textContent = 'Слушаю...';
            }
            log('Speech: start');
        };

        recognition.onend = () => {
            aiListening = false;
            aiModeActive = false;
            if (aiButton) {
                aiButton.classList.remove('listening');
            }
            setAiStatus('idle');
            log('Speech: end');
        };

        recognition.onerror = (event: any) => {
            if (voiceTextEl) {
                voiceTextEl.textContent = 'Ошибка распознавания: ' + event.error;
            }
            log('Speech error: ' + event.error);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            const normalized = (transcript || '').trim();
            const words = normalized.split(/\s+/).filter(Boolean);

            if (voiceTextEl) {
                voiceTextEl.textContent = normalized
                    ? 'Команда: ' + normalized
                    : 'Команда не распознана';
            }
            log('Speech result: ' + normalized);

            if (words.length < 2) {
                log('Speech: недостаточно слов (нужно >= 2) — не отправляем и не подключаем WS');
                return;
            }

            const payload = {
                type: 'voice_command',
                text: normalized,
            };

            const trySend = (deadline: number) => {
                if (isWSConnected()) {
                    sendWS(payload);
                    return;
                }
                if (Date.now() > deadline) {
                    log('Speech: не удалось дождаться WS, команда не отправлена');
                    return;
                }
                setTimeout(() => trySend(deadline), 120);
            };

            if (!isWSConnected()) {
                log('Speech: подключаем WS перед отправкой команды');
                connectWS();
                trySend(Date.now() + 2000);
            } else {
                sendWS(payload);
            }
        };
    }
}

// =========================
// AI-кнопка: pointer
// =========================
export function initAiButton() {
    if (!aiButton) return;

    let pointerActive = false;
    let pointerId: number | null = null;

    aiButton.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (pointerActive) return;
        pointerActive = true;
        pointerId = e.pointerId;
        aiButton.setPointerCapture(pointerId);

        if (!recognition) {
            log('SpeechRecognition недоступен');
            return;
        }
        try {
            recognition.start();
        } catch (err: any) {
            log('Recognition start error: ' + err.message);
        }
    });

    aiButton.addEventListener('pointerup', (e) => {
        if (!pointerActive || e.pointerId !== pointerId) return;
        e.preventDefault();
        pointerActive = false;
        aiButton.releasePointerCapture(pointerId);
        pointerId = null;

        if (!recognition) return;
        try {
            recognition.stop();
        } catch (err: any) {
            log('Recognition stop error: ' + err.message);
        }
    });

    aiButton.addEventListener('pointercancel', () => {
        if (!pointerActive) return;
        pointerActive = false;
        pointerId = null;
        if (recognition) {
            try { recognition.stop(); } catch { /* ignore */ }
        }
    });
}

