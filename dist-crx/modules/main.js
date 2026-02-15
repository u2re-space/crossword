import { __vitePreload } from './index.js';
import './index18.js';
import { parseDateCorrectly, getTimeZone, getISOWeekNumber, formatDateTime, insideOfDay, createDayDescriptor, fixEntityId, writeTimelineTask } from './MakeTimeline.js';
import { writeText, initClipboardReceiver, requestCopy } from './Clipboard.js';
import { H, JSOX, loadAsAdopted } from './Settings.js';
import './DocxExport.js';
import './Conversion.js';
import './GPT-Responses.js';
import { DEFAULT_TEMPLATES } from './BuiltInAI.js';
import './Runtime2.js';
import { storeShareTargetPayloadToCache as storeShareTargetPayloadToCache$1, consumeCachedShareTargetPayload as consumeCachedShareTargetPayload$1 } from './crx-entry.js';
import { initToastReceiver, showToast } from './Toast.js';
import { unifiedMessaging, sendMessage, BROADCAST_CHANNELS } from './UnifiedMessaging.js';
import { aiStatusEl, log, aiButton, voiceTextEl, isWSConnected, sendWS, connectWS, MOTION_SEND_INTERVAL, MOTION_JITTER_EPS, GRAVITY_SMOOTH, GYRO_MAX_SAMPLE_COUNT, GRAVITY_CORRECTION_STRENGTH, GYRO_SMOOTH, gyroSrcForMouseX, gyroSrcForMouseY, gyroSrcForMouseZ, gyroDirZ, GYRO_GAIN, GYRO_ROTATION_GAIN, gyroDirY, gyroDirX, ANGLE_MAX_STEP, GYRO_DEADZONE, ACCELEROMETER_MAX_SAMPLE_COUNT, ACCELEROMETER_SMOOTH, accelDirZ, ACCELEROMETER_GAIN, accelDirY, accelDirX, ACCELEROMETER_DEADZONE, airStatusEl, airButton, HOLD_DELAY, TAP_THRESHOLD, MOVE_TAP_THRESHOLD, SWIPE_THRESHOLD, REL_ORIENT_MAX_STEP, relSrcForMouseX, relSrcForMouseY, relSrcForMouseZ, relDirZ, REL_ORIENT_GAIN, relDirY, relDirX, REL_ORIENT_MAX_STEP_MAX, REL_ORIENT_MAX_STEP_UP_RATE, REL_ORIENT_MAX_STEP_DOWN_RATE, REL_ORIENT_SMOOTH_RATE_LOW, REL_ORIENT_SMOOTH_RATE_HIGH, REL_ORIENT_SMOOTH, REL_ORIENT_DEADZONE, clipboardPreviewEl, onServerClipboardUpdate, requestClipboardGet, btnCopy, requestClipboardCopy, btnCut, requestClipboardCut, btnPaste, requestClipboardPaste, getRemoteHost, getRemotePort, getRemoteProtocol, setRemoteHost, setRemotePort, setRemoteProtocol, disconnectWS, hideKeyboard, initWebSocket, getBtnConnect, initVirtualKeyboard, onWSConnectionChange, setRemoteKeyboardEnabled } from './index10.js';
import './ImageProcess.js';
import './marked.esm.js';
import './index17.js';
import './auto-render.js';
import './_commonjsHelpers.js';

const stylesheet = "@layer view.airpad{.view-airpad :is(*,:before,:after){box-sizing:border-box;font-variant-emoji:text}.view-airpad{-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.5;touch-action:manipulation;user-select:none;-webkit-user-select:none;--view-layout:\"flex\";--view-content-max-width:none;--primary:#0061a4;--primary-container:#d1e4ff;--on-primary:#fff;--on-primary-container:#001d36;--secondary:#565f71;--secondary-container:#dae2f9;--on-secondary:#fff;--on-secondary-container:#131c2b;--tertiary:#705575;--tertiary-container:#fbd7fc;--on-tertiary:#fff;--on-tertiary-container:#28132e;--error:#ba1a1a;--error-container:#ffdad6;--on-error:#fff;--on-error-container:#410002;--surface:#0f1419;--surface-variant:#1e2124;--surface-container:#1a1d20;--surface-container-low:#16191c;--surface-container-high:#1f2225;--surface-container-highest:#2a2d30;--on-surface:#e0e2e8;--on-surface-variant:#bfc8cc;--outline:#40484c;--outline-variant:#2a3236;--elevation-0:none;--elevation-1:0 1px 2px 0 #0000004d,0 1px 3px 1px #00000026;--elevation-2:0 1px 2px 0 #0000004d,0 2px 6px 2px #00000026;--elevation-3:0 1px 3px 0 #0000004d,0 4px 8px 3px #00000026;--elevation-4:0 2px 3px 0 #0000004d,0 6px 10px 4px #00000026;--elevation-5:0 4px 4px 0 #0000004d,0 8px 12px 6px #00000026;--state-hover:#ffffff14;--state-focus:#ffffff1f;--state-pressed:#ffffff1a;--state-selected:#ffffff29;--state-dragged:#ffffff29;--space-0:0;--space-1:0.25rem;--space-2:0.5rem;--space-3:0.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--space-12:3rem;--space-16:4rem;--space-20:5rem;--space-24:6rem;--radius-none:0;--radius-xs:0.25rem;--radius-sm:0.5rem;--radius-md:0.75rem;--radius-lg:1rem;--radius-xl:1.5rem;--radius-2xl:2rem;--radius-3xl:3rem;--radius-full:9999px;--text-xs:0.75rem;--text-sm:0.875rem;--text-base:1rem;--text-lg:1.125rem;--text-xl:1.25rem;--text-2xl:1.5rem;--text-3xl:1.875rem;--text-4xl:2.25rem;--text-5xl:3rem;--line-height-tight:1.25;--line-height-normal:1.5;--line-height-relaxed:1.75;--font-weight-thin:100;--font-weight-light:300;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--font-weight-black:900;--transition-fast:150ms cubic-bezier(0.4,0,0.2,1);--transition-normal:250ms cubic-bezier(0.4,0,0.2,1);--transition-slow:400ms cubic-bezier(0.4,0,0.2,1);--transition-slow-in:400ms cubic-bezier(0.05,0.7,0.1,1);--transition-slow-out:400ms cubic-bezier(0.3,0,0.8,0.15);--motion-easing-standard:cubic-bezier(0.2,0,0,1);--motion-easing-decelerate:cubic-bezier(0,0,0,1);--motion-easing-accelerate:cubic-bezier(0.3,0,1,1)}.container{flex:1;flex-direction:column;gap:var(--space-4);inline-size:100%;justify-content:flex-start;margin:0 auto;padding:var(--space-4) var(--space-4) calc(var(--space-16) + var(--space-6));position:relative}.bottom-toolbar,.container{align-items:center;display:flex}.bottom-toolbar{gap:var(--space-3);inset-block-end:var(--space-4);inset-inline-start:var(--space-4);position:fixed;z-index:4}.primary-btn{align-items:center;background:var(--primary);border:none;border-radius:var(--radius-lg);box-shadow:var(--elevation-1);color:var(--on-primary);cursor:pointer;display:inline-flex;font-family:inherit;font-size:var(--text-base);font-weight:var(--font-weight-medium);gap:var(--space-2);justify-content:center;line-height:var(--line-height-tight);min-inline-size:calc-size(min-content,min(12rem,size));overflow:hidden;padding:var(--space-3) var(--space-6);position:relative;text-decoration:none;touch-action:manipulation;transition:all var(--transition-fast);user-select:none;-webkit-user-select:none}.primary-btn:before{background:var(--state-hover);content:\"\";inset:0;opacity:0;position:absolute;transition:opacity var(--transition-fast)}.primary-btn:hover{box-shadow:var(--elevation-2)}.primary-btn:hover:before{opacity:1}.primary-btn:active{box-shadow:var(--elevation-1);transform:scale(.98)}.primary-btn:active:before{background:var(--state-pressed);opacity:0}.primary-btn:focus-visible{box-shadow:var(--elevation-1),0 0 0 4px color-mix(in srgb,var(--primary),#0000 25%);outline:2px solid var(--primary);outline-offset:2px}.primary-btn:disabled{box-shadow:none;cursor:not-allowed;opacity:.38;pointer-events:none;transform:none}.primary-btn:disabled:before{display:none}.toolbar-btn{background:var(--surface-container-high);block-size:3.5rem;border:none;border-radius:var(--radius-2xl);box-shadow:var(--elevation-3);color:var(--on-surface-variant);font-size:var(--text-xl);inline-size:3.5rem;overflow:hidden;position:relative;transition:all var(--transition-fast)}.toolbar-btn:before{background:var(--state-hover);border-radius:inherit;content:\"\";inset:0;opacity:0;position:absolute;transition:opacity var(--transition-fast)}.toolbar-btn:hover{box-shadow:var(--elevation-4);transform:translateY(-1px)}.toolbar-btn:hover:before{opacity:1}.toolbar-btn:active{box-shadow:var(--elevation-2);transform:scale(.92) translateY(0)}.toolbar-btn:active:before{background:var(--state-pressed);opacity:0}.toolbar-btn:focus-visible{box-shadow:var(--elevation-3),0 0 0 4px color-mix(in srgb,var(--primary),#0000 25%);outline:2px solid var(--primary);outline-offset:2px}.ws-status{align-items:center;border:1px solid #0000;border-radius:var(--radius-2xl);box-shadow:var(--elevation-1);display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-2);letter-spacing:.05em;overflow:hidden;padding:var(--space-1) var(--space-4);position:relative;text-transform:uppercase}.ws-status:before{background:linear-gradient(135deg,var(--outline-variant),#0000);border-radius:inherit;content:\"\";inset:0;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;opacity:.5;padding:1px;position:absolute}.ws-status.ws-status-ok{background:color-mix(in srgb,var(--primary),#0000 12%);border-color:color-mix(in srgb,var(--primary),#0000 30%);color:var(--primary)}.ws-status.ws-status-bad{background:color-mix(in srgb,var(--error),#0000 12%);border-color:color-mix(in srgb,var(--error),#0000 30%);color:var(--error)}.clipboard-preview{background:var(--surface);border:1px solid var(--outline-variant);border-radius:var(--radius-lg);box-shadow:var(--elevation-3);color:var(--on-surface);display:none;font-size:var(--text-sm);inline-size:calc(100% - var(--space-8));inset-block-end:calc(var(--space-16) + var(--space-4));inset-inline:var(--space-4);inset-inline-start:50%;margin:0 auto;max-block-size:4rem;max-inline-size:47.5rem;overflow:hidden;padding:var(--space-3) var(--space-4);position:fixed;transform:translateX(-50%);z-index:3}.clipboard-preview.visible{display:block}.clipboard-preview .meta{color:var(--on-surface-variant);font-size:var(--text-xs);margin-block-end:var(--space-1)}.clipboard-preview .text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.config-overlay{align-items:center;backdrop-filter:blur(12px);background:color-mix(in srgb,var(--shadow),#0000 40%);display:none;inset:0;justify-content:center;padding:var(--space-4);position:fixed;z-index:10}.config-overlay.flex{display:flex}.config-panel{animation:scaleIn .2s cubic-bezier(.4,0,.2,1);background:var(--surface-container-high);border:1px solid var(--outline-variant);border-radius:var(--radius-2xl);box-shadow:var(--elevation-5);inline-size:calc(100vw - var(--space-8));max-inline-size:28rem;padding:var(--space-6)}.config-panel h3{color:var(--on-surface);font-size:var(--text-2xl);font-weight:var(--font-weight-semibold);line-height:var(--line-height-tight);margin:0 0 var(--space-6) 0}.config-group{margin-block-end:var(--space-5)}.config-group label{color:var(--on-surface);display:block;font-size:var(--text-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-normal);margin-block-end:var(--space-2)}.config-group input,.config-group select,.config-group textarea{background:var(--surface-container-highest);border:1px solid var(--outline-variant);border-radius:var(--radius-lg);box-sizing:border-box;color:var(--on-surface);font-family:inherit;font-size:var(--text-base);inline-size:100%;line-height:var(--line-height-normal);padding:var(--space-4) var(--space-4);pointer-events:auto;transition:all var(--transition-fast);user-select:text;-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text}.config-group input:hover,.config-group select:hover,.config-group textarea:hover{background:var(--surface-container);border-color:var(--outline)}.config-group input:focus,.config-group select:focus,.config-group textarea:focus{background:var(--surface-container-highest);border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary),#0000 20%);outline:none}.config-group input::placeholder,.config-group select::placeholder,.config-group textarea::placeholder{color:var(--on-surface-variant);opacity:.7}.config-group input:invalid,.config-group select:invalid,.config-group textarea:invalid{border-color:var(--error);box-shadow:0 0 0 3px color-mix(in srgb,var(--error),#0000 20%)}.config-actions{display:flex;gap:var(--space-3);justify-content:flex-end;margin-block-start:var(--space-6)}.config-actions button{border:none;border-radius:var(--radius-lg);cursor:pointer;font-family:inherit;font-size:var(--text-base);font-weight:var(--font-weight-medium);min-inline-size:6rem;padding:var(--space-3) var(--space-5);transition:all var(--transition-fast)}.config-actions button:first-child{background:var(--primary);color:var(--on-primary)}.config-actions button:first-child:hover{background:color-mix(in srgb,var(--primary),#000 8%)}.config-actions button:first-child:active{background:color-mix(in srgb,var(--primary),#000 12%);transform:scale(.98)}.config-actions button:last-child{background:var(--surface-container-high);border:1px solid var(--outline-variant);color:var(--on-surface-variant)}.config-actions button:last-child:hover{background:var(--surface-container-highest);border-color:var(--outline)}.config-actions button:last-child:active{background:color-mix(in srgb,var(--surface-container-high),var(--state-pressed));transform:scale(.98)}.config-actions button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.config-actions button:disabled{cursor:not-allowed;opacity:.38;pointer-events:none}.log-overlay{align-items:center;backdrop-filter:blur(12px);background:color-mix(in srgb,var(--shadow),#0000 35%);display:none;inset:0;justify-content:center;padding:var(--space-4);position:fixed;z-index:5}.log-overlay.open,.log-panel{display:flex}.log-panel{background:var(--surface);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);box-shadow:var(--elevation-5);flex-direction:column;inline-size:min(35rem,100vw - var(--space-8));max-block-size:calc(100vb - var(--space-8));overflow:hidden}.log-overlay-header{align-items:center;border-block-end:1px solid var(--outline-variant);display:flex;font-size:var(--text-sm);font-weight:var(--font-weight-semibold);justify-content:space-between;padding:var(--space-3) var(--space-4)}.ghost-btn{background:var(--surface-variant);border:1px solid var(--outline-variant);border-radius:var(--radius-lg);color:var(--on-surface-variant);cursor:pointer;font-size:var(--text-xs);padding:var(--space-2) var(--space-3)}.ghost-btn:active{filter:brightness(.92)}.log-container{color:var(--on-surface);flex:1;font-family:JetBrains Mono,Fira Code,Courier New,monospace;font-size:var(--text-xs);line-height:1.5;max-block-size:25rem;overflow-y:auto;padding:var(--space-4) var(--space-5)}.hero{align-items:center;display:flex;flex-direction:column;gap:var(--space-4);inline-size:100%;padding:var(--space-2) 0;text-align:center}.hero h1{color:var(--on-surface);font-size:var(--text-4xl);font-weight:var(--font-weight-bold);letter-spacing:-.025em;line-height:var(--line-height-tight);margin:0 0 var(--space-2) 0}.hero .subtitle{color:var(--on-surface-variant);font-size:var(--text-lg);line-height:var(--line-height-normal);max-inline-size:48rem;opacity:.87}.status-container{display:flex;flex-direction:row;flex-wrap:nowrap;gap:var(--space-2);place-content:center;place-items:center}.status-bar{align-items:center;background:var(--surface-container);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);color:var(--on-surface-variant);display:flex;flex-wrap:wrap;font-size:var(--text-sm);gap:var(--space-4);justify-content:center;padding:var(--space-2) var(--space-4)}.status-bar .status-item{align-items:center;background:var(--surface);border-radius:var(--radius-lg);display:flex;gap:var(--space-2);padding:var(--space-1) var(--space-2)}.status-bar .status-item span.value{font-variant-numeric:tabular-nums;font-weight:var(--font-weight-semibold);margin-inline-start:var(--space-1)}.big-button{align-items:center;background:var(--surface-container-high);block-size:10rem;border:none;border-radius:50%;box-shadow:var(--elevation-3);color:var(--on-surface);cursor:pointer;display:inline-flex;font-size:var(--text-xl);font-weight:var(--font-weight-semibold);inline-size:10rem;justify-content:center;overflow:hidden;position:relative;touch-action:none;transition:all var(--transition-normal);user-select:none;-webkit-user-select:none}.big-button:before{background:var(--state-hover);border-radius:inherit;content:\"\";inset:0;opacity:0;position:absolute;transition:opacity var(--transition-fast)}.big-button:hover{box-shadow:var(--elevation-4);transform:translateY(-2px)}.big-button:hover:before{opacity:1}.big-button:active{box-shadow:var(--elevation-2);transform:translateY(0) scale(.96)}.big-button:active:before{background:var(--state-pressed);opacity:0}.big-button.active{background:var(--primary-container);box-shadow:var(--elevation-4),0 0 0 6px color-mix(in srgb,var(--primary),#0000 15%);color:var(--on-primary-container)}.big-button.air{background:radial-gradient(ellipse 80% 60% at 50% 20%,var(--surface-container-high),color-mix(in srgb,var(--surface-container-high),var(--primary) 8%))}.big-button.air.active{background:radial-gradient(ellipse 80% 60% at 50% 20%,var(--primary-container),var(--primary));color:var(--on-primary-container)}.big-button.ai{background:radial-gradient(ellipse 80% 60% at 50% 20%,var(--surface-container-high),color-mix(in srgb,var(--surface-container-high),var(--secondary) 8%))}.big-button.ai.active{animation:pulse 2s infinite;background:radial-gradient(ellipse 80% 60% at 50% 20%,var(--secondary-container),var(--secondary));color:var(--on-secondary-container)}.big-button.air-move{background:radial-gradient(ellipse 80% 60% at 50% 20%,var(--primary),color-mix(in srgb,var(--primary),#000 10%));color:var(--on-primary)}.big-button.ai.listening{background:radial-gradient(ellipse 80% 60% at 50% 20%,var(--error),color-mix(in srgb,var(--error),#000 10%));box-shadow:var(--elevation-4),0 0 0 6px color-mix(in srgb,var(--error),#0000 15%);color:var(--on-error)}.ai-block,.air-block,.air-row{gap:.5rem;position:relative}.air-row{align-items:end;display:flex;flex-direction:row}.neighbor-button{inset-block-end:-1rem;inset-inline-end:-4.5rem;position:absolute;transform:translate(-50%)}.ai-block{margin-block-end:.75rem}.label{color:#bfc8cc;font-size:1rem;line-height:1.4}.voice-line{color:#e0e2e8;margin-block-start:.25rem;min-block-size:18px}.hint,.voice-line{font-size:1rem;max-inline-size:560px}.hint{color:#bfc8cc;display:flex;flex-direction:column;margin-block-start:.75rem}.hint ul{margin:.25rem 0 0;padding-inline-start:1.25rem}.hint li{margin-block-start:.25rem}.stage{block-size:max-content;flex:1;gap:var(--space-8);inline-size:100%;justify-content:flex-end;min-block-size:20rem}.ai-block,.air-block,.stage{align-items:center;display:flex;flex-direction:column}.ai-block,.air-block{gap:var(--space-2)}.ai-block{margin-block-end:var(--space-3)}.label{color:var(--on-surface-variant);font-size:var(--text-base);line-height:var(--line-height-normal);opacity:.87}.label,.voice-line{font-weight:var(--font-weight-medium);text-align:center}.voice-line{background:var(--surface-container);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);color:var(--on-surface);font-size:var(--text-xl);font-variant-numeric:tabular-nums;inline-size:100%;line-height:var(--line-height-tight);margin-block-start:var(--space-2);max-inline-size:40rem;min-block-size:1.5rem;padding:var(--space-3) var(--space-4);position:relative}.voice-line:before{background:var(--state-focus);border-radius:inherit;content:\"\";inset:0;opacity:0;position:absolute;transition:opacity var(--transition-fast)}.voice-line.listening{background:color-mix(in srgb,var(--secondary-container),#0000 20%);border-color:var(--secondary)}.voice-line.listening:before{background:var(--secondary);opacity:.3}.hint{color:var(--on-surface-variant);font-size:var(--text-sm);line-height:var(--line-height-relaxed);margin-block-start:var(--space-6);max-inline-size:48rem;opacity:.8;text-align:center}.hint ul{display:inline-block;margin:var(--space-3) 0 0;padding-inline-start:var(--space-6);text-align:left}.hint li{margin-block-start:var(--space-2);padding-inline-start:var(--space-3);position:relative}.hint li::marker{color:var(--primary);font-weight:var(--font-weight-semibold)}.hint li:before{background:var(--primary);block-size:4px;border-radius:var(--radius-full);content:\"\";inline-size:4px;inset-block-start:.5em;inset-inline-start:0;position:absolute}.side-log-toggle{background:#40484c;border:1px solid #40484c;border-radius:1rem;box-shadow:0 1px 3px 0 #0000004d,0 4px 8px 3px #00000026;color:#e0e2e8;cursor:pointer;font-size:.875rem;inset-block-start:50%;inset-inline-end:1rem;padding:.75rem 1rem;position:fixed;transform:translateY(-50%);transition:all .15s cubic-bezier(.4,0,.2,1);z-index:6}.side-log-toggle:active{transform:translateY(-50%) scale(.98)}.neighbor-button{align-items:center;background:#40484c;block-size:60px;border:1px solid #40484c;border-radius:9999px;box-shadow:0 1px 2px 0 #0000004d,0 2px 6px 2px #00000026;color:#e0e2e8;cursor:pointer;display:inline-flex;font-size:1rem;font-weight:600;inline-size:60px;justify-content:center;touch-action:manipulation;transition:all .15s cubic-bezier(.4,0,.2,1);user-select:none;-webkit-user-select:none}.neighbor-button:active{background:#353d41;transform:scale(.95)}.air-button-container{align-items:center;display:flex;gap:.75rem}.keyboard-toggle{align-items:center;background:linear-gradient(135deg,#0061a4,#004d7a);block-size:56px;border:none;border-radius:9999px;box-shadow:0 2px 3px 0 #0000004d,0 6px 10px 4px #00000026;color:#fff;cursor:pointer;display:flex;font-size:24px;inline-size:56px;inset-block-end:1.25rem;inset-inline-end:1.25rem;justify-content:center;position:fixed;touch-action:manipulation;transition:all .15s cubic-bezier(.4,0,.2,1);user-select:none;-webkit-user-select:none;z-index:4}.keyboard-toggle:active{box-shadow:0 1px 2px 0 #0000004d,0 1px 3px 1px #00000026;transform:scale(.95)}.keyboard-toggle-editable{caret-color:#0000;color:#0000!important;outline:none;overflow:hidden;text-shadow:none!important}.keyboard-toggle-editable:before{color:#fff;content:\"⌨️\";font-size:24px;inset-block-start:50%;inset-inline-start:50%;line-height:1;pointer-events:none;position:absolute;transform:translate(-50%,-50%);z-index:2}.keyboard-toggle-editable:focus{caret-color:#0000}.keyboard-toggle-editable:focus:after{border-radius:9999px;box-shadow:0 0 0 2px #ffffff4d;content:\"\";inset:0;pointer-events:none;position:absolute;z-index:1}.virtual-keyboard-container{background:#0000;display:none;flex-direction:column;inset:0;max-block-size:50vh;pointer-events:none;position:fixed;transform:translateY(100%);transition:transform .25s cubic-bezier(.4,0,.2,1);z-index:10}.virtual-keyboard-container.visible{transform:translateY(0)}.keyboard-header{align-items:center;border-block-end:1px solid #40484c;display:flex;justify-content:space-between;padding:.5rem .75rem}.keyboard-close{background:#0000;border:none;color:#bfc8cc;cursor:pointer;font-size:20px;line-height:1;padding:.25rem .5rem}.keyboard-close:active{color:#e0e2e8}.keyboard-tabs{display:flex;gap:.5rem}.keyboard-tab{background:#40484c;border:none;border-radius:.75rem;color:#bfc8cc;cursor:pointer;font-size:.875rem;padding:.5rem .75rem;transition:all .15s cubic-bezier(.4,0,.2,1)}.keyboard-tab.active{background:#0061a4;color:#fff}.keyboard-content{flex:1;overflow-y:auto;padding:.5rem}.keyboard-panel{display:none}.keyboard-panel.active{display:block}.keyboard-shift-container{margin-block-end:.5rem}.keyboard-shift{background:#40484c;border:1px solid #40484c;border-radius:.75rem;color:#bfc8cc;cursor:pointer;font-size:1rem;inline-size:100%;padding:.5rem 1rem;transition:all .15s cubic-bezier(.4,0,.2,1)}.keyboard-shift.active{background:#0061a4;color:#fff}.keyboard-rows{display:flex;flex-direction:column;gap:.5rem;margin-block-end:.5rem}.keyboard-row{display:flex;gap:.25rem;justify-content:center}.keyboard-key{background:#40484c;block-size:44px;border:1px solid #40484c;border-radius:.75rem;color:#e0e2e8;cursor:pointer;flex:1;font-size:1rem;font-weight:500;max-inline-size:48px;min-inline-size:32px;touch-action:manipulation;transition:all .15s cubic-bezier(.4,0,.2,1);user-select:none}.keyboard-key:active{background:#0061a4;color:#fff;transform:scale(.95)}.keyboard-key.special{flex:2;font-size:.875rem;max-inline-size:none}.keyboard-key.space{flex:4}.keyboard-special{display:flex;gap:.25rem;margin-block-start:.5rem}.emoji-categories{display:flex;flex-wrap:wrap;gap:.5rem;margin-block-end:.75rem}.emoji-category-btn{background:#40484c;border:none;border-radius:.75rem;color:#bfc8cc;cursor:pointer;font-size:.75rem;padding:.5rem .75rem;transition:all .15s cubic-bezier(.4,0,.2,1)}.emoji-category-btn.active{background:#0061a4;color:#fff}.emoji-grid{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));max-block-size:200px;overflow-y:auto}.emoji-key{align-items:center;background:#40484c;block-size:44px;border:1px solid #40484c;border-radius:.75rem;cursor:pointer;display:flex;font-size:24px;inline-size:44px;justify-content:center;touch-action:manipulation;transition:all .15s cubic-bezier(.4,0,.2,1)}.emoji-key:active{background:#0061a4;transform:scale(.95)}}@layer view.airpad{}@layer view.airpad{}@layer view.airpad{}@layer view.airpad{@media (max-width:520px){.big-button{block-size:140px;border-radius:9999px;inline-size:140px}.neighbor-button{block-size:50px;border-radius:9999px;font-size:.875rem;inline-size:50px}.air-button-container{gap:.75rem}.stage{gap:1.5rem}.side-log-toggle{inset-inline-end:.75rem}.bottom-toolbar{gap:.5rem;inset-block-end:1rem;inset-inline-start:1rem}.toolbar-btn{block-size:48px;border-radius:1rem;font-size:20px;inline-size:48px}.clipboard-preview{inset-block-end:5rem}.keyboard-toggle{block-size:48px;border-radius:9999px;font-size:20px;inline-size:48px;inset-block-end:1rem;inset-inline-end:1rem}.virtual-keyboard-container{max-block-size:calc(100vh - 4rem)}.keyboard-key{block-size:40px;font-size:.875rem;max-inline-size:40px;min-inline-size:28px}.emoji-key{block-size:40px;font-size:20px;inline-size:40px}}}@layer view.airpad{.view-airpad{background:var(--surface);color:var(--on-surface);min-block-size:100%;position:relative;--vk-toggle-size:56px;--vk-toggle-edge:1.25rem;--vk-log-gap:0.75rem}.view-airpad .container{margin-inline:auto;max-inline-size:min(980px,100%);min-block-size:100%;padding:clamp(.75rem,1.8vh,1.5rem) clamp(.75rem,1.8vw,1.25rem) calc(var(--space-16) + var(--space-2))}.view-airpad .hero h1{font-size:clamp(1.5rem,3.6vh,2.5rem);margin-block-end:clamp(.25rem,.8vh,.75rem)}.view-airpad .hero .subtitle{font-size:clamp(.875rem,1.6vh,1rem)}.view-airpad .status-container{gap:clamp(.35rem,.8vh,.75rem)}.view-airpad .status-bar{gap:clamp(.25rem,.6vh,.75rem);padding:clamp(.25rem,.8vh,.5rem) clamp(.5rem,1vw,.875rem)}.view-airpad .stage{gap:clamp(.6rem,1.6vh,1.25rem);justify-content:center;min-block-size:clamp(11.5rem,30vh,18rem)}.view-airpad .air-row{align-items:flex-end;position:relative}.view-airpad .big-button{block-size:clamp(5.5rem,14vh,8.75rem);font-size:clamp(1rem,2.3vh,1.4rem);inline-size:clamp(5.5rem,14vh,8.75rem)}.view-airpad .neighbor-button{block-size:clamp(2.4rem,5.5vh,3.2rem);inline-size:clamp(2.4rem,5.5vh,3.2rem);inset-block-end:.2rem;inset-inline-end:clamp(-2.2rem,-3.5vw,-1.6rem);transform:none}.view-airpad .voice-line{font-size:clamp(.85rem,1.8vh,1rem);inline-size:100%;margin-block-start:clamp(.15rem,.6vh,.5rem);max-inline-size:40rem;padding:clamp(.4rem,1vh,.65rem) clamp(.5rem,1.2vw,.9rem)}.view-airpad .hint{display:grid;font-size:clamp(.72rem,1.5vh,.86rem);gap:clamp(.35rem,1vh,.7rem);grid-template-columns:repeat(3,minmax(0,1fr));inline-size:100%;margin-block-start:clamp(.25rem,.8vh,.75rem);max-inline-size:min(980px,100%);text-align:initial}.view-airpad .hint-group{background:color-mix(in srgb,var(--surface-container),#0000 10%);border:1px solid color-mix(in srgb,var(--outline-variant),#0000 22%);border-radius:var(--radius-lg);line-height:1.35;margin:0;overflow:clip;padding:clamp(.35rem,.9vh,.65rem) clamp(.45rem,1vw,.8rem)}.view-airpad .hint-group summary{color:var(--on-surface);cursor:pointer;font-size:clamp(.76rem,1.65vh,.92rem);font-weight:var(--font-weight-semibold);list-style:none;padding:.05rem 0}.view-airpad .hint-group summary::-webkit-details-marker{display:none}.view-airpad .hint-group summary:after{content:\"▾\";float:inline-end;opacity:.75;transition:transform var(--transition-fast)}.view-airpad .hint-group:not([open]) summary:after{transform:rotate(-90deg)}.view-airpad .hint-group ul{margin:clamp(.25rem,.8vh,.45rem) 0 0;padding-inline-start:1rem}.view-airpad .hint-group li{margin-block:clamp(.15rem,.45vh,.3rem)}.view-airpad .hint-group code{background:color-mix(in srgb,var(--surface-container-high),#0000 8%);border:1px solid color-mix(in srgb,var(--outline-variant),#0000 30%);border-radius:.4rem;font-size:.9em;padding:.1rem .35rem}.view-airpad .side-log-toggle{block-size:auto;inline-size:auto;inset-block-end:calc(max(var(--vk-toggle-edge), env(safe-area-inset-bottom)) + var(--vk-toggle-size) + var(--vk-log-gap));inset-block-start:auto;inset-inline-end:var(--vk-toggle-edge);line-height:1;min-block-size:2.5rem;position:fixed;transform:none;white-space:nowrap;writing-mode:horizontal-tb;z-index:8}.view-airpad .keyboard-toggle{inset-block-end:max(var(--vk-toggle-edge),env(safe-area-inset-bottom));inset-inline-end:var(--vk-toggle-edge);z-index:9}.view-airpad .bottom-toolbar{align-items:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);background:color-mix(in srgb,var(--surface-container-high),#0000 12%);block-size:auto;border:1px solid color-mix(in srgb,var(--outline),#0000 35%);border-radius:var(--radius-2xl);box-shadow:var(--elevation-4);display:flex;gap:var(--space-2);inline-size:max-content;inset-block-end:max(var(--space-4),env(safe-area-inset-bottom));inset-inline-start:var(--space-4);padding:var(--space-2);position:fixed;z-index:7}.view-airpad .bottom-toolbar .toolbar-btn{background:color-mix(in srgb,var(--surface-container),#0000 8%);block-size:3.25rem;border:1px solid color-mix(in srgb,var(--outline-variant),#0000 20%);border-radius:var(--radius-xl);box-shadow:var(--elevation-2);font-size:1.125rem;inline-size:3.25rem}.view-airpad .bottom-toolbar .toolbar-btn:hover{box-shadow:var(--elevation-3);transform:translateY(-1px)}.view-airpad .bottom-toolbar .toolbar-btn:active{transform:scale(.94)}.view-airpad .bottom-toolbar #btnConfig{background:color-mix(in srgb,var(--primary),var(--surface-container-high) 65%);border-color:color-mix(in srgb,var(--primary),#0000 45%);color:var(--on-primary)}#btnConnect{display:block;inline-size:fit-content;max-inline-size:calc-size(fit-content,min(12rem,size));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@container (max-inline-size: 520px){#btnConnect{max-inline-size:calc-size(fit-content,min(3rem,size))}}@media (max-width:520px){.view-airpad{--vk-toggle-size:48px;--vk-toggle-edge:1rem;--vk-log-gap:0.6rem}.view-airpad .container{padding:.65rem .65rem calc(3.25rem + max(1rem, env(safe-area-inset-bottom)))}.view-airpad .hero h1{font-size:clamp(1.2rem,3vh,1.5rem)}.view-airpad .hero .subtitle{font-size:.82rem}.view-airpad .status-bar{font-size:.74rem}.view-airpad #btnConnect{font-size:var(--text-sm);min-inline-size:calc-size(min-content,min(3rem,size));padding-inline:var(--space-4)}.view-airpad .big-button{block-size:clamp(5rem,17vw,6.4rem);font-size:1rem;inline-size:clamp(5rem,17vw,6.4rem)}.view-airpad .neighbor-button{block-size:2.2rem;font-size:.82rem;inline-size:2.2rem;inset-inline-end:-1.35rem}.view-airpad .bottom-toolbar{gap:var(--space-1);inset-block-end:max(1rem,env(safe-area-inset-bottom));inset-inline-start:1rem;padding:var(--space-1)}.view-airpad .bottom-toolbar .toolbar-btn{block-size:2.8rem;border-radius:var(--radius-lg);font-size:1rem;inline-size:2.8rem}.view-airpad .side-log-toggle{inset-block-end:calc(max(var(--vk-toggle-edge), env(safe-area-inset-bottom)) + var(--vk-toggle-size) + var(--vk-log-gap));inset-inline-end:var(--vk-toggle-edge)}.view-airpad .hint{font-size:.76rem;gap:.4rem;grid-template-columns:1fr}.view-airpad .hint-group{padding:.45rem .55rem}}@media (max-height:860px),(max-width:980px){.view-airpad .hint{grid-template-columns:1fr;max-inline-size:min(620px,100%)}.view-airpad .stage{min-block-size:clamp(10.5rem,26vh,14rem)}}}";

"use strict";
const API_PATHS = {
  PROCESSING: "/api/processing",
  ANALYZE: "/api/analyze",
  HEALTH: "/api/health",
  TEST: "/api/test",
  PHOSPHOR_ICONS: "/assets/icons/phosphor"
};
const api = {
  /**
   * Send content for AI processing
   */
  async process(options) {
    try {
      const response = await fetch(API_PATHS.PROCESSING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options)
      });
      return response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
  /**
   * Analyze content (lighter processing)
   */
  async analyze(content, contentType = "text") {
    try {
      const response = await fetch(API_PATHS.ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, contentType })
      });
      return response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
  /**
   * Health check
   */
  async health() {
    try {
      const response = await fetch(API_PATHS.HEALTH);
      return response.json();
    } catch {
      return { ok: false };
    }
  },
  /**
   * Test API endpoint
   */
  async test() {
    try {
      const response = await fetch(API_PATHS.TEST);
      return response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
  /**
   * Generic GET request
   */
  async get(path) {
    try {
      const response = await fetch(path);
      return response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
  /**
   * Generic POST request
   */
  async post(path, data) {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
};
async function fetchWithTimeout(url, options = {}, timeoutMs = 3e4) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}
async function fetchWithRetry(url, options = {}, maxRetries = 3, baseDelayMs = 1e3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(
          (resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, i))
        );
      }
    }
  }
  throw lastError || new Error("Fetch failed");
}

"use strict";
const isNotEmpty = (frag) => {
  return !!(typeof frag == "string" ? frag?.trim?.() : frag);
};
const toStringSafe = (value) => {
  return typeof value === "string" ? value : value == null ? "" : String(value);
};
const collapseWhitespace = (value) => {
  return value.replace(/\s+/g, " ").trim();
};
const MAKE_LABEL = (label) => {
  return label?.charAt?.(0)?.toUpperCase?.() + label?.slice?.(1)?.replace?.(/_/g, " ");
};
const cropFirstLetter = (text) => {
  return text?.charAt?.(0)?.toUpperCase?.() || "C";
};
const startCase = (value) => {
  return value.replace(/[_\-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim().replace(/^./, (char) => char.toUpperCase());
};
const renderTabName$1 = (tabName) => {
  if (!tabName) return "";
  tabName = tabName?.replace?.(/_/g, " ") || tabName;
  tabName = tabName?.charAt?.(0)?.toUpperCase?.() + tabName?.slice?.(1) || tabName;
  return tabName;
};
const toMultiline = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((item) => (item ?? "").toString().trim()).filter(Boolean).join("\n");
  }
  return String(value ?? "");
};
const fromMultiline = (value) => {
  if (!value) return [];
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};
const countLines = (text) => {
  if (!text) return 0;
  return Array.isArray(text) ? text.length : text?.split?.(/\r\n|\r|\n/)?.length;
};
const wrapBySpan = (text) => {
  if (!text) return "";
  return `<span>${Array.isArray(text) ? text?.join?.(",") : text}</span>`;
};
const splitPath = (path) => path.split(".").filter(Boolean);
const getByPath = (source, path) => {
  return splitPath(path).reduce((acc, key) => acc == null ? acc : acc[key], source);
};
const setByPath = (target, path, value) => {
  const keys = splitPath(path);
  if (!keys.length) return;
  let current = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
};
const unsetByPath = (target, path) => {
  const keys = splitPath(path);
  if (!keys.length) return;
  const parents = [];
  let current = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current?.[key] === void 0) return;
    parents.push([current, key]);
    current = current[key];
    if (typeof current !== "object" || current === null) return;
  }
  const lastKey = keys[keys.length - 1];
  if (current && Object.prototype.hasOwnProperty.call(current, lastKey)) {
    delete current[lastKey];
    for (let i = parents.length - 1; i >= 0; i--) {
      const [parent, key] = parents[i];
      const value = parent[key];
      if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) {
        delete parent[key];
      } else {
        break;
      }
    }
  }
};
const makeObjectEntries = (object) => {
  if (!object) return [];
  if (typeof object == "object" || typeof object == "function") {
    return [...Object.entries(object)];
  }
  return [];
};
const stripMarkdown$1 = (value) => {
  const input = toStringSafe(value);
  if (!input) return "";
  return input.replace(/```[\s\S]*?```/g, " ").replace(/`([^`]+)`/g, "$1").replace(/!\[[^\]]*\]\([^\)]+\)/g, " ").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").replace(/(^|\n)\s{0,3}>\s?/g, "$1").replace(/(^|\n)\s{0,3}#{1,6}\s+/g, "$1").replace(/(^|\n)\s{0,3}[-*+]\s+/g, "$1").replace(/(^|\n)\s{0,3}\d+\.\s+/g, "$1").replace(/(^|\n)---[\s\S]*?---(?=\n|$)/g, "$1").replace(/[\\*_~]/g, "").replace(/`/g, "").replace(/&nbsp;/gi, " ").replace(/<\/?[^>]+>/g, " ");
};
const sanitizeDocSnippet = (value) => {
  return collapseWhitespace(stripMarkdown$1(value));
};
const truncateDocSnippet = (value, limit = 260) => {
  const trimmed = value.trim();
  if (!limit || trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
};
const ensureDate = (value) => {
  if (!value) return null;
  const parsed = parseDateCorrectly(value);
  if (!parsed) return null;
  const time = parsed.getTime?.();
  return Number.isFinite(time) ? parsed : null;
};
const resolveBeginDate = (dayDesc) => {
  return ensureDate(dayDesc?.begin_time ?? dayDesc?.properties?.begin_time ?? dayDesc?.start);
};
const buildPrimaryDayTitle = (dayDesc) => {
  const preset = dayDesc?.separatorTitle;
  if (typeof preset === "string" && preset.trim()) return preset;
  const date = resolveBeginDate(dayDesc);
  if (!date) return dayDesc?.title || dayDesc?.id || "Day";
  const formatted = date.toLocaleDateString("en-GB", {
    timeZone: getTimeZone(),
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const week = dayDesc?.weekNumber ?? getISOWeekNumber(date);
  if (week && formatted) return `${formatted} · Week ${week}`;
  return formatted;
};
const buildSecondaryDayTitle = (dayDesc, primary) => {
  const label = dayDesc?.title;
  if (!label) return null;
  if (!primary) return label;
  return label.trim() === primary.trim() ? null : label;
};
const beginDragAsText = (ev) => {
  const text = ev.currentTarget?.textContent?.trim?.();
  if (text) {
    ev.dataTransfer.effectAllowed = "copy";
    ev.dataTransfer?.clearData?.();
    ev.dataTransfer?.setData?.("plain/text", text);
  }
};
const copyPhoneClick = (ev) => {
  const element = ev.currentTarget;
  const isPhoneElement = element?.matches?.(".phone") ? element : element?.querySelector?.(".phone");
  if (isPhoneElement) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    const phone = isPhoneElement?.textContent?.trim?.() ?? "";
    if (phone) writeText(phone);
  }
};
const copyEmailClick = (ev) => {
  const element = ev.currentTarget;
  const isEmailElement = element?.matches?.(".email") ? element : element?.querySelector?.(".email");
  if (isEmailElement) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    const email = isEmailElement?.textContent?.trim?.() ?? "";
    if (email) writeText(email);
  }
};

"use strict";
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().\-]{4,}\d/g;
const EXT_CUT_RE = /(доб\.?|доп\.?|ext\.?|extension)\s*[:#\-x]*\s*\d+.*/i;
const DEFAULT_OPTIONS = {
  defaultTrunk: "8",
  countryCode: "7",
  cityCode: null,
  stripExtensions: true,
  minLocal: 5,
  maxLocal: 7
};
const normalizeOne = (input, options = {}) => {
  if (input == null) return null;
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let s = String(input).trim();
  if (!s) return null;
  if (opts.stripExtensions) {
    s = s.replace(EXT_CUT_RE, "");
  }
  const hasPlusInStart = /^\+/.test(s);
  let digits = s.replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlusInStart && digits.startsWith(opts.countryCode)) {
    digits = opts.defaultTrunk + digits.slice(opts.countryCode.length);
  } else if (digits.length === 11 && digits.startsWith(opts.countryCode)) {
    digits = opts.defaultTrunk + digits.slice(1);
  } else if (digits.length === 10) {
    digits = opts.defaultTrunk + digits;
  } else if (opts.cityCode && digits.length >= opts.minLocal && digits.length <= opts.maxLocal) {
    digits = opts.defaultTrunk + opts.cityCode + digits;
  } else if (digits.length === 11 && digits.startsWith(opts.defaultTrunk)) {
  } else if (opts.cityCode && digits.length === opts.cityCode.length + 7) {
    digits = opts.defaultTrunk + digits;
  } else {
    return null;
  }
  return /^\d{11}$/.test(digits) ? digits : null;
};
const splitCandidates = (value) => {
  if (value == null) return [];
  const s = String(value);
  const matches = s.match(PHONE_CANDIDATE_RE);
  if (matches?.length) return matches;
  return s.split(/[;,/|]+/).map((x) => x.trim()).filter(Boolean);
};
const normalizePhones = (value, options = {}) => {
  const out = /* @__PURE__ */ new Set();
  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === "string") {
        for (const cand of splitCandidates(v)) {
          const n = normalizeOne(cand, options);
          if (n) out.add(n);
        }
      } else {
        const n = normalizeOne(v, options);
        if (n) out.add(n);
      }
    }
  } else if (typeof value === "string") {
    for (const c of splitCandidates(value)) {
      const n = normalizeOne(c, options);
      if (n) out.add(n);
    }
  } else {
    const n = normalizeOne(value, options);
    if (n) out.add(n);
  }
  return [...out];
};
const getIndexForRow = (row, pos) => {
  if (Array.isArray(row) && typeof row[1] === "number") return row[1];
  if (row && typeof row === "object" && typeof row.index === "number") return row.index;
  return pos;
};
const getPhonesFromRow = (row) => {
  if (Array.isArray(row)) return row[0];
  if (row && typeof row === "object") {
    if ("phones" in row) return row.phones;
    if ("phone" in row) return row.phone;
  }
  return row;
};
function findDuplicatePhones(rows, userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const numberToIndices = /* @__PURE__ */ new Map();
  const indexToNumbersAll = /* @__PURE__ */ new Map();
  rows.forEach((row, pos) => {
    const idx = getIndexForRow(row, pos);
    const phonesRaw = getPhonesFromRow(row);
    const phones = normalizePhones(phonesRaw, options);
    if (!indexToNumbersAll.has(idx)) indexToNumbersAll.set(idx, /* @__PURE__ */ new Set());
    const setForIndex = indexToNumbersAll.get(idx);
    for (const p of phones) {
      setForIndex.add(p);
      if (!numberToIndices.has(p)) numberToIndices.set(p, /* @__PURE__ */ new Set());
      numberToIndices.get(p).add(idx);
    }
  });
  const duplicatesByNumber = {};
  for (const [num, set] of numberToIndices.entries()) {
    if (set.size > 1) {
      duplicatesByNumber[num] = [...set].sort((a, b) => a - b);
    }
  }
  const duplicatesByIndex = {};
  for (const [idx, set] of indexToNumbersAll.entries()) {
    const dups = [...set].filter((n) => duplicatesByNumber[n]);
    if (dups.length) duplicatesByIndex[idx] = dups.sort();
  }
  const pairs = Object.entries(duplicatesByIndex).map(([idx, nums]) => [Number(idx), nums]).sort((a, b) => a[0] - b[0]);
  return {
    duplicatesByNumber,
    pairs,
    duplicatesByIndex,
    normalize: (s) => normalizeOne(s, options)
  };
}

"use strict";
function parseMarkdown(markdown) {
  let html = markdown;
  const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = escapeHtml(code.trim());
    return `<pre><code class="language-${lang || "text"}">${escapedCode}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, "<hr>");
  html = html.replace(/^[\*\-]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  html = html.replace(/\n\n+/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p><br><\/p>/g, "");
  return html;
}
async function renderMarkdown(markdown, options = {}) {
  const { gfm = true } = options;
  try {
    const { marked } = await __vitePreload(async () => { const { marked } = await import('./marked.esm.js');return { marked }},true              ?[]:void 0,import.meta.url);
    return await marked.parse(markdown, { gfm, breaks: true });
  } catch {
    return parseMarkdown(markdown);
  }
}
async function renderMarkdownToElement(markdown, options = {}) {
  const html = await renderMarkdown(markdown, options);
  return H`<div class="markdown-body">${html}</div>`;
}
function renderMarkdownSync(markdown) {
  return parseMarkdown(markdown);
}
function stripMarkdown(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "").replace(/^#+\s+/gm, "").replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/^>\s+/gm, "").replace(/^[-_*]{3,}$/gm, "").trim();
}
function extractTitle(markdown) {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  const firstLine = markdown.split("\n")[0];
  return stripMarkdown(firstLine).slice(0, 100);
}
function isLikelyMarkdown(content) {
  const mdPatterns = [
    /^#+ /m,
    // Headers
    /\*\*[^*]+\*\*/,
    // Bold
    /\[[^\]]+\]\([^)]+\)/,
    // Links
    /```[\s\S]*?```/,
    // Code blocks
    /^[-*] /m,
    // Lists
    /^>\s/m
    // Blockquotes
  ];
  return mdPatterns.some((pattern) => pattern.test(content));
}

"use strict";
const parseMarkdownEntry = async ({ collection, file, filePath }) => {
  const text = await file.text();
  const rawTitleLine = text.trim().split(/\r?\n/).find((line) => line.trim().length) || "";
  const sanitizedTitle = sanitizeDocSnippet(rawTitleLine);
  const fallbackTitle = sanitizeDocSnippet(file.name.replace(/\.[^.]+$/, "")) || file.name;
  const title = sanitizedTitle || fallbackTitle;
  const summarySource = text.trim().split(/\r?\n/).slice(0, 6).join(" ");
  const summary = truncateDocSnippet(sanitizeDocSnippet(summarySource));
  const sanitizedBody = sanitizeDocSnippet(text);
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const $setter = (el) => {
    el?.renderMarkdown?.(text);
  };
  const entry = {
    id: `${collection.id}:${filePath}`,
    title,
    subtitle: formatDateTime(file.lastModified),
    summary: summary || void 0,
    path: filePath,
    fileName: file.name,
    collectionId: collection.id,
    modifiedAt: file.lastModified,
    wordCount,
    searchText: [title, summary, truncateDocSnippet(sanitizedBody, 2e4)].filter(Boolean).join(" \n").toLowerCase(),
    renderPreview: (container) => {
      container.replaceChildren(
        H`<div class="doc-preview-frame">
                    <header class="doc-preview-header">
                        <div>
                            <h2>${title || file.name}</h2>
                            <p class="doc-subtitle">Updated ${formatDateTime(file.lastModified)}</p>
                        </div>
                        ${wordCount ? H`<span class="doc-meta-tag">${wordCount} words</span>` : null}
                    </header>
                    <md-view ref=${$setter} src=${url}></md-view>
                </div>`
      );
    },
    //dispose: () => URL.revokeObjectURL(url),
    raw: text
  };
  return entry;
};
const unique = (values) => Array.from(new Set(values));
const normalizeCollections = (collections) => {
  return collections.map((collection) => {
    const dirs = collection.dirs?.length ? collection.dirs.slice() : collection.dir ? [collection.dir] : [];
    const normalized = { ...collection, dirs };
    if (!normalized.emptyState && collection.description) {
      normalized.emptyState = collection.description;
    }
    return normalized;
  });
};
const ensureCollections = async (COLLECTIONS) => {
  for (const collection of COLLECTIONS) {
    const dirs = collection.dirs ?? (collection.dir ? [collection.dir] : []);
    for (const dir of dirs) {
      try {
        await getDirectoryHandle(null, dir, { create: true });
      } catch (error) {
        console.warn("Failed to ensure directory", dir, error);
      }
    }
  }
};

"use strict";

"use strict";
function isMarkdownFile(file) {
  const name = typeof file === "string" ? file : file.name;
  const type = typeof file === "string" ? "" : file.type;
  const mdExtensions = /\.(md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)$/i;
  return mdExtensions.test(name) || type === "text/markdown";
}
function isTextFile(file) {
  const name = typeof file === "string" ? file : file.name;
  const type = typeof file === "string" ? "" : file.type;
  if (type.startsWith("text/")) return true;
  const textExtensions = /\.(txt|text|log|json|xml|yaml|yml|toml|ini|cfg|conf)$/i;
  return textExtensions.test(name);
}
function isImageFile(file) {
  const name = typeof file === "string" ? file : file.name;
  const type = typeof file === "string" ? "" : file.type;
  if (type.startsWith("image/")) return true;
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)$/i;
  return imageExtensions.test(name);
}
function isCodeFile(file) {
  const name = typeof file === "string" ? file : file.name;
  const codeExtensions = /\.(js|ts|jsx|tsx|py|rb|go|rs|c|cpp|h|hpp|java|kt|swift|php|cs|css|scss|sass|less|html|vue|svelte)$/i;
  return codeExtensions.test(name);
}
async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
function createTextFile(content, filename, mimeType = "text/plain") {
  return new File([content], filename, { type: mimeType });
}
function createMarkdownFile(content, filename = "document.md") {
  return new File([content], filename, { type: "text/markdown" });
}
function createJsonFile(data, filename = "data.json") {
  const content = JSON.stringify(data, null, 2);
  return new File([content], filename, { type: "application/json" });
}
function downloadFile(file, filename) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || (file instanceof File ? file.name : "download");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 250);
}
function downloadTextFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  downloadFile(blob, filename);
}
function downloadMarkdown(content, filename = "document.md") {
  downloadTextFile(content, filename, "text/markdown");
}
async function pickFile(accept = "*") {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      resolve(input.files?.[0] || null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
async function pickFiles(accept = "*") {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = () => {
      resolve(Array.from(input.files || []));
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}
async function pickMarkdownFile() {
  return pickFile(".md,.markdown,.txt,text/markdown,text/plain");
}
async function saveFile(content, suggestedName = "document.md", types = [{ description: "Markdown", accept: { "text/markdown": [".md"] } }]) {
  try {
    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return false;
    }
  }
  downloadTextFile(content, suggestedName);
  return true;
}
async function openFile(types = [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown"] } }]) {
  try {
    if ("showOpenFilePicker" in window) {
      const [handle] = await window.showOpenFilePicker({ types });
      const file2 = await handle.getFile();
      const content2 = await file2.text();
      return { content: content2, filename: file2.name };
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return null;
    }
  }
  const file = await pickFile();
  if (!file) return null;
  const content = await readFileAsText(file);
  return { content, filename: file.name };
}

"use strict";
async function lazyLoadComponent(importFn, options) {
  const { cssPath, componentName } = options;
  console.log(`[LazyLoader] Loading component: ${componentName}`);
  if (cssPath) {
    try {
      await loadCSS(cssPath);
    } catch (error) {
      console.warn(`[LazyLoader] Failed to load CSS for ${componentName}:`, error);
    }
  }
  try {
    const component = await importFn();
    console.log(`[LazyLoader] Successfully loaded component: ${componentName}`);
    return { component };
  } catch (error) {
    console.error(`[LazyLoader] Failed to load component ${componentName}:`, error);
    throw error;
  }
}
async function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const existingLinks = document.querySelectorAll(`link[href="${href}"]`);
    if (existingLinks.length > 0) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
}
const componentCache = /* @__PURE__ */ new Map();
async function getCachedComponent(cacheKey, importFn, options) {
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey);
  }
  const lazyComponent = await lazyLoadComponent(importFn, options);
  componentCache.set(cacheKey, lazyComponent);
  return lazyComponent;
}
function clearComponentCache() {
  componentCache.clear();
}
function disposeCachedComponents() {
  for (const [, lazyComponent] of componentCache) {
    if (lazyComponent.dispose) {
      lazyComponent.dispose();
    }
  }
  componentCache.clear();
}

"use strict";
class FileHandler {
  options;
  dragOverElements = /* @__PURE__ */ new Set();
  constructor(options) {
    this.options = { ...options };
  }
  /**
   * Programmatically add files into the same pipeline as UI selection / DnD / paste.
   * Used by PWA share-target and launchQueue ingestion.
   */
  addFiles(files) {
    if (!Array.isArray(files) || files.length === 0) return;
    return this.options.onFilesAdded(files);
  }
  /**
   * Set up file input element with file selection
   */
  setupFileInput(container, accept = "*") {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = accept;
    fileInput.style.display = "none";
    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        this.options.onFilesAdded(files);
      }
      fileInput.value = "";
    });
    container.append(fileInput);
    return fileInput;
  }
  /**
   * Set up drag and drop handling for an element
   */
  setupDragAndDrop(element) {
    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addDragOver(element);
    });
    element.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeDragOver(element);
    });
    element.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeDragOver(element);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        this.options.onFilesAdded(files);
      }
    });
  }
  /**
   * Set up paste handling for an element
   */
  setupPasteHandling(element) {
    element.addEventListener("paste", (e) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length > 0) {
        e.preventDefault();
        this.options.onFilesAdded(files);
      }
    });
  }
  /**
   * Set up all file handling for a container (file input button, drag & drop, paste)
   */
  setupCompleteFileHandling(container, fileSelectButton, dropZone, accept = "*") {
    const fileInput = this.setupFileInput(container, accept);
    fileSelectButton.addEventListener("click", () => {
      fileInput.click();
    });
    if (dropZone) {
      this.setupDragAndDrop(dropZone);
    }
    this.setupPasteHandling(container);
  }
  /**
   * Validate file types and sizes
   */
  validateFiles(files, options = {}) {
    const { maxSize, allowedTypes, maxFiles } = options;
    const valid = [];
    const invalid = [];
    if (maxFiles && files.length > maxFiles) {
      invalid.push(...files.slice(maxFiles).map((file) => ({
        file,
        reason: `Too many files. Maximum ${maxFiles} files allowed.`
      })));
      files = files.slice(0, maxFiles);
    }
    for (const file of files) {
      let isValid = true;
      let reason = "";
      if (maxSize && file.size > maxSize) {
        isValid = false;
        reason = `File too large. Maximum size is ${this.formatFileSize(maxSize)}.`;
      }
      if (allowedTypes && allowedTypes.length > 0) {
        const isAllowed = allowedTypes.some((type) => {
          if (type.includes("*")) {
            return file.type.startsWith(type.replace("/*", "/"));
          }
          return file.type === type;
        });
        if (!isAllowed) {
          isValid = false;
          reason = reason || `File type not allowed. Allowed types: ${allowedTypes.join(", ")}.`;
        }
      }
      if (isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, reason });
      }
    }
    return { valid, invalid };
  }
  /**
   * Read file content as text
   */
  async readFileAsText(file, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      if (onProgress) {
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(e.loaded, e.total);
          }
        };
      }
      reader.readAsText(file);
    });
  }
  /**
   * Read file content as ArrayBuffer
   */
  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsArrayBuffer(file);
    });
  }
  /**
   * Read file content as Data URL
   */
  async readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }
  /**
   * Read multiple files as text
   */
  async readFilesAsText(files, onProgress) {
    const results = [];
    for (const file of files) {
      try {
        const content = await this.readFileAsText(file, (loaded, total) => {
          onProgress?.(file, loaded, total);
        });
        results.push({ file, content });
      } catch (error) {
        console.warn(`Failed to read file ${file.name}:`, error);
      }
    }
    return results;
  }
  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType) {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("json")) return "📋";
    if (mimeType.includes("text") || mimeType.includes("markdown")) return "📝";
    if (mimeType.includes("javascript") || mimeType.includes("typescript")) return "📜";
    if (mimeType.includes("css")) return "🎨";
    if (mimeType.includes("html")) return "🌐";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📄";
  }
  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  /**
   * Check if a file is likely a markdown file
   */
  isMarkdownFile(file) {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".mdown") || name.endsWith(".mkd") || name.endsWith(".mkdn") || name.endsWith(".mdtxt") || name.endsWith(".mdtext") || type.includes("markdown") || type.includes("text");
  }
  /**
   * Check if a file is an image
   */
  isImageFile(file) {
    return file.type.startsWith("image/");
  }
  /**
   * Check if a file is a text file
   */
  isTextFile(file) {
    return file.type.startsWith("text/") || this.isMarkdownFile(file) || file.type.includes("javascript") || file.type.includes("typescript") || file.type.includes("css") || file.type.includes("html") || file.type.includes("json") || file.type.includes("xml");
  }
  /**
   * Check if a file is a binary file
   */
  isBinaryFile(file) {
    return !this.isTextFile(file) && !this.isImageFile(file);
  }
  /**
   * Get file metadata
   */
  getFileMetadata(file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const isText = this.isTextFile(file);
    const isImage = this.isImageFile(file);
    const isBinary = this.isBinaryFile(file);
    return {
      name: file.name,
      extension,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      isText,
      isImage,
      isBinary,
      formattedSize: this.formatFileSize(file.size),
      icon: this.getFileIcon(file.type)
    };
  }
  /**
   * Get files metadata for multiple files
   */
  getFilesMetadata(files) {
    return files.map((file) => this.getFileMetadata(file));
  }
  addDragOver(element) {
    if (!this.dragOverElements.has(element)) {
      this.dragOverElements.add(element);
      element.classList.add("drag-over");
    }
  }
  removeDragOver(element) {
    if (this.dragOverElements.has(element)) {
      this.dragOverElements.delete(element);
      element.classList.remove("drag-over");
    }
  }
  /**
   * Manually trigger file processing with the provided files
   */
  processFiles(files) {
    this.options.onFilesAdded(files);
  }
  /**
   * Create a downloadable file from content
   */
  createDownloadableFile(content, filename, mimeType) {
    let blob;
    if (content instanceof Blob) {
      blob = content;
    } else if (content instanceof ArrayBuffer) {
      blob = new Blob([content], { type: mimeType || "application/octet-stream" });
    } else {
      blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
  /**
   * Create a shareable file URL
   */
  createFileURL(file) {
    return URL.createObjectURL(file);
  }
  /**
   * Revoke a file URL to free memory
   */
  revokeFileURL(url) {
    URL.revokeObjectURL(url);
  }
  /**
   * Clean up event listeners and references
   */
  destroy() {
    this.dragOverElements.clear();
  }
}
function createFileHandler(options) {
  return new FileHandler(options);
}
async function readMarkdownFromUrl(url) {
  try {
    const response = await fetch(url, { credentials: "include", cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text") && !contentType.includes("markdown")) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}
async function extractTextFromDataTransfer(dt) {
  try {
    const uriList = dt.getData("text/uri-list");
    if (uriList?.trim()) return uriList.trim();
  } catch {
  }
  try {
    const text = dt.getData("text/plain");
    if (text?.trim()) return text;
  } catch {
  }
  return null;
}

"use strict";
class VoiceInputManager {
  recognition = null;
  isListening = false;
  options;
  constructor(options = {}) {
    this.options = {
      language: "en-US",
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      ...options
    };
    this.initializeRecognition();
  }
  /**
   * Initialize speech recognition if supported
   */
  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.options.language;
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.maxAlternatives = this.options.maxAlternatives;
  }
  /**
   * Check if speech recognition is supported
   */
  isSupported() {
    return this.recognition !== null;
  }
  /**
   * Start listening for speech input
   */
  startListening() {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not supported"));
        return;
      }
      if (this.isListening) {
        reject(new Error("Already listening"));
        return;
      }
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        this.isListening = false;
        try {
          this.recognition.stop();
        } catch {
        }
        if (value) {
          resolve(value);
        } else {
          reject(new Error("No speech detected"));
        }
      };
      this.recognition.onresult = (e) => {
        const text = String(e?.results?.[0]?.[0]?.transcript || "").trim();
        finish(text || null);
      };
      this.recognition.onerror = () => finish(null);
      this.recognition.onend = () => finish(null);
      try {
        this.isListening = true;
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }
  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
      }
      this.isListening = false;
    }
  }
  /**
   * Check if currently listening
   */
  getIsListening() {
    return this.isListening;
  }
  /**
   * Set recognition language
   */
  setLanguage(language) {
    this.options.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
  /**
   * Get available languages (limited support in browsers)
   */
  getAvailableLanguages() {
    return [
      "en-US",
      "en-GB",
      "en-AU",
      "en-CA",
      "en-IN",
      "en-IE",
      "es-ES",
      "es-US",
      "es-MX",
      "es-AR",
      "es-CO",
      "es-CL",
      "fr-FR",
      "fr-CA",
      "de-DE",
      "it-IT",
      "pt-BR",
      "pt-PT",
      "ru-RU",
      "ja-JP",
      "ko-KR",
      "zh-CN",
      "zh-TW",
      "ar-SA",
      "hi-IN",
      "nl-NL",
      "sv-SE",
      "no-NO",
      "da-DK",
      "fi-FI"
    ];
  }
  /**
   * Clean up resources
   */
  destroy() {
    this.stopListening();
    this.recognition = null;
  }
}
async function getSpeechPrompt(options = {}) {
  const { timeout = 1e4, ...voiceOptions } = options;
  const voiceManager = new VoiceInputManager(voiceOptions);
  if (!voiceManager.isSupported()) {
    console.warn("Speech recognition not supported");
    return null;
  }
  try {
    const speechPromise = voiceManager.startListening();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        voiceManager.stopListening();
        reject(new Error("Speech recognition timeout"));
      }, timeout);
    });
    return await Promise.race([speechPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Speech recognition failed:", error);
    return null;
  } finally {
    voiceManager.destroy();
  }
}
function isSpeechRecognitionAvailable() {
  return !!window.SpeechRecognition || !!window.webkitSpeechRecognition;
}
async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

"use strict";
class TemplateManager {
  storageKey;
  templates = [];
  defaultTemplates;
  constructor(options = {}) {
    this.storageKey = options.storageKey || "rs-prompt-templates";
    this.defaultTemplates = options.defaultTemplates || this.getDefaultTemplates();
    this.loadTemplates();
  }
  /**
   * Get all templates
   */
  getAllTemplates() {
    return [...this.templates];
  }
  /**
   * Get template by ID
   */
  getTemplateById(id) {
    return this.templates.find((t) => t.id === id);
  }
  /**
   * Add a new template
   */
  addTemplate(template) {
    const newTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0
    };
    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }
  /**
   * Update an existing template
   */
  updateTemplate(id, updates) {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveTemplates();
    return true;
  }
  /**
   * Remove a template
   */
  removeTemplate(id) {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.templates.splice(index, 1);
    this.saveTemplates();
    return true;
  }
  /**
   * Increment usage count for a template
   */
  incrementUsageCount(id) {
    const template = this.templates.find((t) => t.id === id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.saveTemplates();
    }
  }
  /**
   * Search templates by name or content
   */
  searchTemplates(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(
      (template) => template.name.toLowerCase().includes(lowercaseQuery) || template.prompt.toLowerCase().includes(lowercaseQuery) || template.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    return this.templates.filter((template) => template.category === category);
  }
  /**
   * Get most used templates
   */
  getMostUsedTemplates(limit = 5) {
    return this.templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit);
  }
  /**
   * Export templates as JSON
   */
  exportTemplates() {
    return JSON.stringify(this.templates, null, 2);
  }
  /**
   * Import templates from JSON
   */
  importTemplates(jsonData) {
    try {
      const importedTemplates = JSON.parse(jsonData);
      if (!Array.isArray(importedTemplates)) {
        throw new Error("Invalid template data: not an array");
      }
      for (const template of importedTemplates) {
        if (!template.name || !template.prompt) {
          throw new Error("Invalid template: missing name or prompt");
        }
      }
      const templatesWithIds = importedTemplates.map((template) => ({
        ...template,
        id: this.generateId(),
        createdAt: template.createdAt || Date.now(),
        updatedAt: Date.now()
      }));
      this.templates.push(...templatesWithIds);
      this.saveTemplates();
      return true;
    } catch (error) {
      console.error("Failed to import templates:", error);
      return false;
    }
  }
  /**
   * Reset to default templates
   */
  resetToDefaults() {
    this.templates = this.defaultTemplates.map((template) => ({
      ...template,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0
    }));
    this.saveTemplates();
  }
  /**
   * Create template editor modal
   */
  createTemplateEditor(container, onSave) {
    const modal = H`<div class="template-editor-modal">
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Prompt Templates</h3>
          </div>

          <div class="template-list">
            ${this.templates.map(
      (template, index) => H`<div class="template-item">
                <div class="template-header">
                  <input type="text" class="template-name" value="${template.name}" data-index="${index}" placeholder="Template name">
                  <button class="btn small remove-template" data-index="${index}" title="Remove template">✕</button>
                </div>
                <textarea class="template-prompt" data-index="${index}" placeholder="Enter your prompt template...">${template.prompt}</textarea>
                <div class="template-meta">
                  ${template.usageCount ? H`<span class="usage-count">Used ${template.usageCount} times</span>` : ""}
                  ${template.category ? H`<span class="category">${template.category}</span>` : ""}
                </div>
              </div>`
    )}
          </div>

          <div class="modal-actions">
            <button class="btn" data-action="add-template">Add Template</button>
            <button class="btn" data-action="reset-defaults">Reset to Defaults</button>
            <button class="btn primary" data-action="save-templates">Save Changes</button>
            <button class="btn" data-action="close-editor">Close</button>
          </div>
        </div>
      </div>
    </div>`;
    modal.addEventListener("click", (e) => {
      const target = e.target;
      const action = target.getAttribute("data-action");
      const index = target.getAttribute("data-index");
      if (action === "add-template") {
        this.addTemplate({
          name: "New Template",
          prompt: "Enter your prompt template here...",
          category: "Custom"
        });
        modal.remove();
        this.createTemplateEditor(container, onSave);
      } else if (action === "reset-defaults") {
        if (confirm("Are you sure you want to reset all templates to defaults? This will remove all custom templates.")) {
          this.resetToDefaults();
          modal.remove();
          this.createTemplateEditor(container, onSave);
        }
      } else if (action === "save-templates") {
        const nameInputs = modal.querySelectorAll(".template-name");
        const promptInputs = modal.querySelectorAll(".template-prompt");
        this.templates = Array.from(nameInputs).map((input, i) => {
          const index2 = parseInt(input.getAttribute("data-index") || "0");
          const originalTemplate = this.templates[index2];
          return {
            ...originalTemplate,
            name: input.value.trim() || "Untitled Template",
            prompt: promptInputs[i].value.trim() || "Enter your prompt...",
            updatedAt: Date.now()
          };
        });
        this.saveTemplates();
        modal.remove();
        onSave?.();
      } else if (action === "close-editor") {
        modal.remove();
      } else if (target.classList.contains("remove-template") && index !== null) {
        const templateIndex = parseInt(index);
        const template = this.templates[templateIndex];
        if (confirm(`Remove template "${template.name}"?`)) {
          this.removeTemplate(template.id);
          modal.remove();
          this.createTemplateEditor(container, onSave);
        }
      }
    });
    container.append(modal);
  }
  /**
   * Create template selector dropdown
   */
  createTemplateSelect(selectedPrompt) {
    const select = document.createElement("select");
    select.className = "template-select";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Template...";
    select.append(defaultOption);
    this.templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.prompt;
      option.textContent = template.name;
      if (template.category) {
        option.textContent += ` (${template.category})`;
      }
      select.append(option);
    });
    if (selectedPrompt) {
      select.value = selectedPrompt;
    }
    return select;
  }
  getDefaultTemplates() {
    return DEFAULT_TEMPLATES.map((template) => ({
      ...template,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0
    }));
  }
  generateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  loadTemplates() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedTemplates = JSON.parse(stored);
        this.templates = parsedTemplates.map((template) => ({
          ...template,
          id: template.id || this.generateId(),
          createdAt: template.createdAt || Date.now(),
          updatedAt: template.updatedAt || Date.now(),
          usageCount: template.usageCount || 0
        }));
      } else {
        this.resetToDefaults();
      }
    } catch (error) {
      console.warn("Failed to load templates from storage:", error);
      this.resetToDefaults();
    }
  }
  saveTemplates() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
    } catch (error) {
      console.warn("Failed to save templates to storage:", error);
    }
  }
}
function createTemplateManager(options) {
  return new TemplateManager(options);
}

"use strict";
class HistoryManager {
  storageKey;
  maxEntries;
  autoSave;
  entries = [];
  constructor(options = {}) {
    this.storageKey = options.storageKey || "rs-basic-history";
    this.maxEntries = options.maxEntries || 100;
    this.autoSave = options.autoSave !== false;
    this.loadHistory();
  }
  /**
   * Add a new history entry
   */
  addEntry(entry) {
    const fullEntry = {
      ...entry,
      id: this.generateId(),
      ts: Date.now()
    };
    this.entries.unshift(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
    if (this.autoSave) {
      this.saveHistory();
    }
    return fullEntry;
  }
  /**
   * Get all history entries
   */
  getAllEntries() {
    return [...this.entries];
  }
  /**
   * Get recent entries (last N)
   */
  getRecentEntries(limit = 10) {
    return this.entries.slice(0, limit);
  }
  /**
   * Get entry by ID
   */
  getEntryById(id) {
    return this.entries.find((entry) => entry.id === id);
  }
  /**
   * Remove entry by ID
   */
  removeEntry(id) {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    this.entries.splice(index, 1);
    if (this.autoSave) {
      this.saveHistory();
    }
    return true;
  }
  /**
   * Clear all history
   */
  clearHistory() {
    this.entries = [];
    if (this.autoSave) {
      this.saveHistory();
    }
  }
  /**
   * Search history entries
   */
  searchEntries(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.entries.filter(
      (entry) => entry.prompt.toLowerCase().includes(lowercaseQuery) || entry.before.toLowerCase().includes(lowercaseQuery) || entry.after.toLowerCase().includes(lowercaseQuery)
    );
  }
  /**
   * Get successful entries only
   */
  getSuccessfulEntries() {
    return this.entries.filter((entry) => entry.ok);
  }
  /**
   * Get failed entries only
   */
  getFailedEntries() {
    return this.entries.filter((entry) => !entry.ok);
  }
  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.entries.length;
    const successful = this.entries.filter((e) => e.ok).length;
    const failed = total - successful;
    const avgDuration = this.entries.filter((e) => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(1, this.entries.filter((e) => e.duration).length);
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total * 100 : 0,
      averageDuration: avgDuration || 0
    };
  }
  /**
   * Export history as JSON
   */
  exportHistory() {
    return JSON.stringify(this.entries, null, 2);
  }
  /**
   * Import history from JSON
   */
  importHistory(jsonData) {
    try {
      const importedEntries = JSON.parse(jsonData);
      if (!Array.isArray(importedEntries)) {
        throw new Error("Invalid history data: not an array");
      }
      for (const entry of importedEntries) {
        if (typeof entry.ts !== "number" || typeof entry.prompt !== "string") {
          throw new Error("Invalid history entry: missing required fields");
        }
      }
      const entriesWithIds = importedEntries.map((entry) => ({
        ...entry,
        id: entry.id || this.generateId()
      }));
      const existingIds = new Set(this.entries.map((e) => e.id));
      const newEntries = entriesWithIds.filter((e) => !existingIds.has(e.id));
      this.entries.unshift(...newEntries);
      if (this.entries.length > this.maxEntries) {
        this.entries = this.entries.slice(0, this.maxEntries);
      }
      if (this.autoSave) {
        this.saveHistory();
      }
      return true;
    } catch (error) {
      console.error("Failed to import history:", error);
      return false;
    }
  }
  /**
   * Create history view component
   */
  createHistoryView(onEntrySelect) {
    const container = H`<div class="history-view">
      <div class="history-header">
        <h3>Processing History</h3>
        <div class="history-actions">
          <button class="btn small" data-action="clear-history">Clear All</button>
          <button class="btn small" data-action="export-history">Export</button>
        </div>
      </div>

      <div class="history-stats">
        ${this.createStatsDisplay()}
      </div>

      <div class="history-list">
        ${this.entries.length === 0 ? H`<div class="empty-history">No history yet. Start processing some content!</div>` : this.entries.map((entry) => this.createHistoryItem(entry, onEntrySelect))}
      </div>
    </div>`;
    container.addEventListener("click", (e) => {
      const target = e.target;
      const action = target.getAttribute("data-action");
      const entryId = target.getAttribute("data-entry-id");
      if (action === "clear-history") {
        if (confirm("Are you sure you want to clear all history?")) {
          this.clearHistory();
          const newContainer = this.createHistoryView(onEntrySelect);
          container.replaceWith(newContainer);
        }
      } else if (action === "export-history") {
        this.exportHistoryToFile();
      } else if (action === "use-entry" && entryId) {
        const entry = this.getEntryById(entryId);
        if (entry) {
          onEntrySelect?.(entry);
        }
      }
    });
    return container;
  }
  /**
   * Create compact history display (for recent activity)
   */
  createRecentHistoryView(limit = 3, onEntrySelect) {
    const recentEntries = this.getRecentEntries(limit);
    const container = H`<div class="recent-history">
      <div class="recent-header">
        <h4>Recent Activity</h4>
        <button class="btn small" data-action="view-full-history">View All</button>
      </div>

      ${recentEntries.length === 0 ? H`<div class="no-recent">No recent activity</div>` : recentEntries.map((entry) => this.createCompactHistoryItem(entry, onEntrySelect))}
    </div>`;
    container.addEventListener("click", (e) => {
      const target = e.target;
      const action = target.getAttribute("data-action");
      const entryId = target.getAttribute("data-entry-id");
      if (action === "view-full-history") {
        console.log("View full history requested");
      } else if (action === "use-entry" && entryId) {
        const entry = this.getEntryById(entryId);
        if (entry) {
          onEntrySelect?.(entry);
        }
      }
    });
    return container;
  }
  createStatsDisplay() {
    const stats = this.getStatistics();
    return H`<div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">${stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-item">
        <span class="stat-value success">${stats.successful}</span>
        <span class="stat-label">Success</span>
      </div>
      <div class="stat-item">
        <span class="stat-value error">${stats.failed}</span>
        <span class="stat-label">Failed</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.successRate.toFixed(1)}%</span>
        <span class="stat-label">Success Rate</span>
      </div>
    </div>`;
  }
  createHistoryItem(entry, onEntrySelect) {
    const time = new Date(entry.ts).toLocaleString();
    const duration = entry.duration ? ` (${(entry.duration / 1e3).toFixed(1)}s)` : "";
    return H`<div class="history-item ${entry.ok ? "success" : "error"}">
      <div class="history-meta">
        <span class="history-status ${entry.ok ? "success" : "error"}">
          ${entry.ok ? "✓" : "✗"}
        </span>
        <span class="history-time">${time}${duration}</span>
        ${entry.model ? H`<span class="history-model">${entry.model}</span>` : ""}
      </div>

      <div class="history-content">
        <div class="history-prompt">${entry.prompt}</div>
        <div class="history-input">Input: ${entry.before}</div>
        ${entry.error ? H`<div class="history-error">Error: ${entry.error}</div>` : ""}
      </div>

      <div class="history-actions">
        <button class="btn small" data-action="use-entry" data-entry-id="${entry.id}">Use Prompt</button>
        ${entry.ok ? H`<button class="btn small" data-action="view-result" data-entry-id="${entry.id}">View Result</button>` : ""}
      </div>
    </div>`;
  }
  createCompactHistoryItem(entry, onEntrySelect) {
    const time = new Date(entry.ts).toLocaleString();
    const shortPrompt = entry.prompt.length > 40 ? entry.prompt.substring(0, 40) + "..." : entry.prompt;
    return H`<div class="history-item-compact ${entry.ok ? "success" : "error"}">
      <div class="history-meta">
        <span class="history-status ${entry.ok ? "success" : "error"}">${entry.ok ? "✓" : "✗"}</span>
        <span class="history-prompt">${shortPrompt}</span>
      </div>
      <div class="history-time">${time}</div>
      <button class="btn small" data-action="use-entry" data-entry-id="${entry.id}">Use</button>
    </div>`;
  }
  exportHistoryToFile() {
    const data = this.exportHistory();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-history-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  generateId() {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  loadHistory() {
    try {
      if (typeof localStorage === "undefined") return;
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedEntries = JSON.parse(stored);
        this.entries = parsedEntries.map((entry) => ({
          ...entry,
          id: entry.id || this.generateId()
        }));
      }
    } catch (error) {
      console.warn("Failed to load history from storage:", error);
      this.entries = [];
    }
  }
  saveHistory() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch (error) {
      console.warn("Failed to save history to storage:", error);
    }
  }
}
function createHistoryManager(options) {
  return new HistoryManager(options);
}

"use strict";

"use strict";
const $unfiltered = (obj, desc) => {
  return true;
};
const $byKind = (obj, desc) => {
  const kind = typeof desc == "string" ? desc : desc?.kind;
  return obj.kind === kind || !kind || kind == "all" || !obj.kind;
};
const $insideOfDay = (obj, desc) => {
  const kind = typeof desc == "string" ? desc : desc?.kind;
  const status = typeof desc == "string" ? desc : desc?.status;
  const begin_time = typeof desc == "string" ? desc : desc?.begin_time ?? desc;
  const end_time = typeof desc == "string" ? desc : desc?.end_time ?? desc;
  return insideOfDay(obj, { begin_time, end_time, status }) || (status == obj?.properties?.status || status == "all" || !status) || (kind == obj?.kind || kind == "all" || !obj.kind);
};
const renderTabName = (tabName) => {
  if (!tabName) return "";
  tabName = tabName?.replace?.(/_/g, " ") || tabName;
  tabName = tabName?.charAt?.(0)?.toUpperCase?.() + tabName?.slice?.(1) || tabName;
  return tabName;
};
const REMOVE_IF_HAS_SIMILAR = (array, old, idx = -1, srcObj = null) => {
  if (array?.indexOf?.(old) >= 0) {
    array.splice(array.indexOf(old), 1);
  } else if (idx >= 0 && idx < array?.length) {
    array.splice(idx, 1);
  } else {
  }
};
const REMOVE_IF_HAS = (array, item) => {
  if (array?.indexOf?.(item) >= 0) {
    array.splice(array.indexOf(item), 1);
  }
  ;
};
const PUSH_ONCE = (array, item) => {
  if (array?.indexOf?.(item) < 0) {
    array.push(item);
  }
  ;
};
const SPLICE_INTO_ONCE = (array, item, index = -1) => {
  if (typeof index != "number" || index < 0 || index >= array?.length) {
    PUSH_ONCE(array, item);
  } else if (typeof index == "number" && array?.indexOf?.(item) < 0) {
    array.splice(index, 0, item);
  }
  ;
};
const cachedPerFile = /* @__PURE__ */ new WeakMap();
const cachedPerFileName = /* @__PURE__ */ new Map();
const GET_OR_CACHE = async (file) => {
  try {
    file = await file;
  } catch (e) {
    file = null;
    console.warn(e);
  }
  ;
  if (file == null) return null;
  if (cachedPerFile.has(file)) return cachedPerFile.get(file);
  if (file?.type != "application/json") {
    return cachedPerFile.get(file);
  }
  ;
  const raw = await file?.text?.()?.catch?.(console.warn.bind(console)) || "{}";
  let obj = {};
  try {
    obj = JSOX.parse(raw);
  } catch (_) {
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
  }
  if (file) {
    cachedPerFile.set(file, obj);
  }
  return obj;
};
const GET_OR_CACHE_BY_NAME = async (fileName, file) => {
  try {
    file = await file;
  } catch (e) {
    file = null;
    console.warn(e);
  }
  ;
  if (fileName == null) return null;
  if (cachedPerFileName.has(fileName)) return cachedPerFileName.get(fileName);
  const obj = file != null ? await GET_OR_CACHE(file) : cachedPerFileName?.get(fileName);
  if (fileName) {
    cachedPerFileName.set(fileName, obj);
  }
  return obj;
};
const cleanToDay = (item) => {
  return createDayDescriptor(parseDateCorrectly(item?.properties?.begin_time));
};
const closestOfDay = (item, days) => {
  return days?.find((d) => insideOfDay(item, d));
};
const closestOfKind = (item, subgroups) => {
  return subgroups?.find((d) => d?.kind == item?.kind);
};
const mergeByExists = (dataRef, refs) => {
  const dataMap = /* @__PURE__ */ new Map();
  dataRef.forEach((item, index) => {
    if (item?.name) dataMap.set(item.name, { item, index });
  });
  const refsMap = /* @__PURE__ */ new Map();
  refs.forEach((ref) => {
    if (ref?.name) refsMap.set(ref.name, ref);
  });
  for (const [name, { index }] of dataMap) {
    const ref = refsMap.get(name);
    if (ref) {
      dataRef[index] = ref;
    }
  }
  for (const [name, ref] of refsMap) {
    if (!dataMap.has(name)) {
      dataRef.push(ref);
    }
  }
  for (let i = dataRef.length - 1; i >= 0; i--) {
    const item = dataRef[i];
    if (item?.name && !refsMap.has(item.name)) {
      dataRef.splice(i, 1);
    }
  }
  dataRef.sort((a, b) => a?.name?.localeCompare?.(b?.name ?? ""));
  return dataRef;
};

"use strict";
const DEBUG_IMMITATE = 10 * 1e3;
const DEBUG_ENABLED = true;
const TASK_TEMPLATES = [
  {
    kind: "job",
    name: "Debug Job Task",
    description: "This is a debug job task generated for testing purposes. It includes all necessary properties and follows the entity structure.",
    status: "pending",
    icon: "briefcase",
    variant: "blue"
  },
  {
    kind: "action",
    name: "Debug Action Task",
    description: "This is a debug action task generated for testing. It simulates a typical action that might be part of a daily routine.",
    status: "in_progress",
    icon: "play-circle",
    variant: "green"
  },
  {
    kind: "other",
    name: "Debug Other Task",
    description: "This is a debug task of 'other' kind. It represents miscellaneous tasks that don't fit into specific categories.",
    status: "under_consideration",
    icon: "play-circle",
    //"question-mark-circle",
    variant: "orange"
  }
];
const SAMPLE_LOCATIONS = [
  "Office",
  "Home",
  "Gym",
  "Coffee Shop",
  "Library",
  "Park",
  "Shopping Mall",
  "Restaurant"
];
const SAMPLE_CONTACTS = [
  {
    email: ["debug@example.com"],
    phone: ["+1234567890"],
    links: ["https://example.com"]
  },
  {
    email: ["test@example.com"],
    phone: ["+0987654321"]
  }
];
const generateDebugTask = () => {
  const now = /* @__PURE__ */ new Date();
  const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
  const daysOffset = Math.floor(Math.random() * 7);
  const hoursOffset = Math.floor(Math.random() * 24);
  const minutesOffset = Math.floor(Math.random() * 60);
  const beginTime = new Date(now);
  beginTime.setDate(beginTime.getDate() + daysOffset);
  beginTime.setHours(beginTime.getHours() + hoursOffset);
  beginTime.setMinutes(beginTime.getMinutes() + minutesOffset);
  const durationHours = 1 + Math.floor(Math.random() * 3);
  const endTime = new Date(beginTime);
  endTime.setHours(endTime.getHours() + durationHours);
  const location = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
  const contacts = SAMPLE_CONTACTS[Math.floor(Math.random() * SAMPLE_CONTACTS.length)];
  const task = {
    type: "task",
    kind: template.kind,
    name: `${template.name} ${Date.now()}`,
    title: template.name,
    description: template.description,
    icon: template.icon,
    variant: template.variant,
    properties: {
      status: template.status,
      begin_time: {
        timestamp: beginTime.getTime(),
        iso_date: beginTime.toISOString()
      },
      end_time: {
        timestamp: endTime.getTime(),
        iso_date: endTime.toISOString()
      },
      location,
      contacts,
      members: [],
      events: []
    }
  };
  fixEntityId(task, { mutate: true });
  return task;
};
const generateDebugTasks = (count = 3) => {
  const tasks = [];
  for (let i = 0; i < count; i++) {
    tasks.push(generateDebugTask());
  }
  return tasks;
};
const writeDebugTasks = async (taskCount = 1) => {
  if (!DEBUG_ENABLED) {
    console.log("Debug task generation is disabled");
    return [];
  }
  const tasks = generateDebugTasks(taskCount);
  const results = [];
  for (const task of tasks) {
    try {
      const result = await writeTimelineTask(task);
      results.push(result);
      console.log("Debug task written:", task.name, task.id);
    } catch (error) {
      console.warn("Failed to write debug task:", error);
    }
  }
  return results;
};
const startDebugTaskGeneration = () => {
  if (!DEBUG_ENABLED) {
    console.log("Debug task generation is disabled");
    return;
  }
  console.log("Starting debug task generation...");
  const generatePeriodically = () => {
    setTimeout(async () => {
      if (DEBUG_ENABLED) {
        await writeDebugTasks(1);
        generatePeriodically();
      }
    }, DEBUG_IMMITATE);
  };
};
const triggerDebugTaskGeneration = (count = 1) => {
  if (!DEBUG_ENABLED) {
    console.log("Debug task generation is disabled");
    return Promise.resolve([]);
  }
  return writeDebugTasks(count);
};
const setDebugMode = (enabled) => {
  globalThis.DEBUG_ENABLED = enabled;
  console.log(`Debug mode ${enabled ? "enabled" : "disabled"}`);
};
const isDebugModeEnabled = () => {
  return DEBUG_ENABLED;
};
if (typeof globalThis !== "undefined") {
  globalThis.debugTaskGenerator = {
    generate: triggerDebugTaskGeneration,
    setMode: setDebugMode,
    isEnabled: isDebugModeEnabled
  };
}

"use strict";

"use strict";
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function uniqueId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}
function isEmpty(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function isWorker() {
  return typeof self !== "undefined" && typeof window === "undefined";
}

"use strict";
let _pwaClipboardInitialized = false;
let _cleanupFns = [];
const sendShareTargetResultToWorkcenter = async (data, priority = "high") => {
  await unifiedMessaging.sendMessage({
    type: "share-target-result",
    destination: "workcenter",
    data,
    metadata: { priority }
  });
};
const tryParseJSON = (data) => {
  if (typeof data !== "string") return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};
const extractRecognizedContent = (data) => {
  if (typeof data === "string") {
    const parsed = tryParseJSON(data);
    if (parsed && typeof parsed === "object") {
      const obj = parsed;
      if (obj.recognized_data != null) {
        const rd = obj.recognized_data;
        if (Array.isArray(rd)) {
          return rd.map(
            (item) => typeof item === "string" ? item : JSON.stringify(item)
          ).join("\n");
        }
        return typeof rd === "string" ? rd : JSON.stringify(rd);
      }
      if (typeof obj.verbose_data === "string" && obj.verbose_data.trim()) {
        return obj.verbose_data;
      }
      if (typeof obj.content === "string" && obj.content.trim()) {
        return obj.content;
      }
      const choices = obj.choices;
      if (Array.isArray(choices) && choices.length > 0) {
        const first = choices[0];
        const msgContent = first?.message?.content;
        if (typeof msgContent === "string" && msgContent.trim()) return msgContent;
        const txt = first?.text;
        if (typeof txt === "string" && txt.trim()) return txt;
      }
      const outText = obj.output_text;
      if (typeof outText === "string" && outText.trim()) return outText;
      const output = obj.output;
      if (Array.isArray(output) && output.length > 0) {
        const firstOut = output[0];
        const text0 = firstOut?.content?.[0]?.text;
        if (typeof text0 === "string" && text0.trim()) return text0;
      }
      return data;
    }
    return data;
  }
  if (data && typeof data === "object") {
    const obj = data;
    if (obj.recognized_data != null) {
      const rd = obj.recognized_data;
      if (Array.isArray(rd)) {
        return rd.map(
          (item) => typeof item === "string" ? item : JSON.stringify(item)
        ).join("\n");
      }
      return typeof rd === "string" ? rd : JSON.stringify(rd);
    }
    if (typeof obj.verbose_data === "string" && obj.verbose_data.trim()) {
      return obj.verbose_data;
    }
    if (typeof obj.content === "string" && obj.content.trim()) {
      return obj.content;
    }
    const choices = obj.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      const msgContent = first?.message?.content;
      if (typeof msgContent === "string" && msgContent.trim()) return msgContent;
      const txt = first?.text;
      if (typeof txt === "string" && txt.trim()) return txt;
    }
    const outText = obj.output_text;
    if (typeof outText === "string" && outText.trim()) return outText;
    const output = obj.output;
    if (Array.isArray(output) && output.length > 0) {
      const firstOut = output[0];
      const text0 = firstOut?.content?.[0]?.text;
      if (typeof text0 === "string" && text0.trim()) return text0;
    }
  }
  return data;
};
const checkPendingClipboardOperations = async () => {
  try {
    if (!navigator.serviceWorker) {
      console.log("[PWA-Copy] Service workers not supported");
      return;
    }
    if (!navigator.serviceWorker.controller) {
      console.log("[PWA-Copy] Waiting for service worker to control page...");
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        console.log("[PWA-Copy] Service worker not active yet");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("[PWA-Copy] Checking for pending clipboard operations...");
    const response = await fetch("/clipboard/pending");
    const data = await response.json();
    if (data.operations && Array.isArray(data.operations) && data.operations.length > 0) {
      console.log("[PWA-Copy] Found", data.operations.length, "pending clipboard operations");
      for (const operation of data.operations) {
        if (operation.type === "ai-result" && operation.data) {
          console.log("[PWA-Copy] Processing pending AI result:", operation.id);
          const text = extractRecognizedContent(operation.data);
          const { copy } = await __vitePreload(async () => { const { copy } = await import('./Clipboard.js');return { copy }},true              ?[]:void 0,import.meta.url);
          await copy(text, { showFeedback: true });
          await sendShareTargetResultToWorkcenter({
            content: typeof text === "string" ? text : JSON.stringify(text),
            rawData: operation.data,
            timestamp: Date.now(),
            source: "share-target",
            action: "AI Processing (Pending)",
            metadata: {
              operationId: operation.id,
              fromPendingQueue: true
            }
          });
          console.log("[PWA-Copy] Delivered pending share target result to work center");
          try {
            await fetch(`/clipboard/remove/${operation.id}`, { method: "DELETE" });
          } catch (error) {
            console.warn("[PWA-Copy] Failed to remove processed operation:", error);
          }
        }
      }
    }
  } catch (error) {
    console.warn("[PWA-Copy] Failed to check pending operations:", error);
  }
};
const initPWAClipboard = () => {
  if (_pwaClipboardInitialized) {
    return () => cleanupPWAClipboard();
  }
  _pwaClipboardInitialized = true;
  console.log("[PWA-Copy] Initializing clipboard and toast receivers...");
  checkPendingClipboardOperations().catch(console.warn);
  _cleanupFns.push(initClipboardReceiver());
  _cleanupFns.push(initToastReceiver());
  if (typeof BroadcastChannel !== "undefined") {
    const clipboardChannel = new BroadcastChannel("rs-clipboard");
    const clipboardHandler = async (event) => {
      const { type, data, options, operations } = event.data || {};
      console.log("[PWA-Copy] Clipboard channel message:", type, data);
      if (type === "copy" && data !== void 0) {
        const { copy } = await __vitePreload(async () => { const { copy } = await import('./Clipboard.js');return { copy }},true              ?[]:void 0,import.meta.url);
        await copy(data, { showFeedback: true, ...options });
      }
      if (type === "pending-operations" && operations && Array.isArray(operations)) {
        console.log("[PWA-Copy] Received", operations.length, "pending operations via broadcast");
        for (const operation of operations) {
          if (operation.type === "ai-result" && operation.data) {
            console.log("[PWA-Copy] Processing broadcasted AI result:", operation.id);
            const text = typeof operation.data === "string" ? operation.data : JSON.stringify(operation.data);
            const { copy } = await __vitePreload(async () => { const { copy } = await import('./Clipboard.js');return { copy }},true              ?[]:void 0,import.meta.url);
            await copy(text, { showFeedback: true });
            await sendShareTargetResultToWorkcenter({
              content: text,
              rawData: operation.data,
              timestamp: Date.now(),
              source: "share-target",
              action: "AI Processing (Broadcasted)",
              metadata: {
                operationId: operation.id,
                fromBroadcast: true
              }
            });
            console.log("[PWA-Copy] Delivered broadcasted share target result to work center");
            try {
              await fetch(`/clipboard/remove/${operation.id}`, { method: "DELETE" });
            } catch (error) {
              console.warn("[PWA-Copy] Failed to remove processed operation:", error);
            }
          }
        }
      }
    };
    clipboardChannel.addEventListener("message", clipboardHandler);
    _cleanupFns.push(() => {
      clipboardChannel.removeEventListener("message", clipboardHandler);
      clipboardChannel.close();
    });
    const shareChannel = new BroadcastChannel("rs-share-target");
    const shareHandler = async (event) => {
      const { type, data } = event.data || {};
      console.log("[PWA-Copy] Share channel message:", type, data);
      if (type === "copy-shared" && data) {
        const { copy } = await __vitePreload(async () => { const { copy } = await import('./Clipboard.js');return { copy }},true              ?[]:void 0,import.meta.url);
        await copy(data, { showFeedback: true });
      }
      if (type === "share-received" && data) {
        console.log("[PWA-Copy] Share received from SW:", data);
      }
      if (type === "ai-result" && data) {
        console.log("[PWA-Copy] AI result from SW:", data);
        if (data.success && data.data) {
          const text = extractRecognizedContent(data.data);
          const { copy } = await __vitePreload(async () => { const { copy } = await import('./Clipboard.js');return { copy }},true              ?[]:void 0,import.meta.url);
          await copy(text, { showFeedback: true });
          await unifiedMessaging.sendMessage({
            type: "share-target-result",
            destination: "workcenter",
            data: {
              content: typeof text === "string" ? text : JSON.stringify(text),
              rawData: data.data,
              timestamp: Date.now(),
              source: "share-target",
              action: "AI Processing",
              metadata: {
                fromServiceWorker: true,
                shareTargetId: data.id || "unknown"
              }
            },
            metadata: { priority: "high" }
          });
        } else {
          const { showToast } = await __vitePreload(async () => { const { showToast } = await import('./Toast.js');return { showToast }},true              ?[]:void 0,import.meta.url);
          showToast({ message: data.error || "Processing failed", kind: "error" });
        }
      }
      if (type === "share-received" && data) {
        console.log("[PWA-Copy] Share received, broadcasting input to work center:", data);
        await unifiedMessaging.sendMessage({
          type: "share-target-input",
          destination: "workcenter",
          data: {
            ...data,
            timestamp: Date.now(),
            metadata: {
              fromServiceWorker: true,
              ...data.metadata
            }
          },
          metadata: { priority: "high" }
        });
      }
    };
    shareChannel.addEventListener("message", shareHandler);
    _cleanupFns.push(() => {
      shareChannel.removeEventListener("message", shareHandler);
      shareChannel.close();
    });
    const swChannel = new BroadcastChannel("rs-sw");
    const swHandler = async (event) => {
      const { type, results } = event.data || {};
      console.log("[PWA-Copy] SW channel message:", type, results);
      if (type === "commit-to-clipboard" && results && Array.isArray(results)) {
        for (const result of results) {
          if (result?.status === "queued" && result?.data) {
            console.log("[PWA-Copy] Copying result data:", result.data);
            const extractedContent = extractRecognizedContent(result.data);
            const { copy } = await __vitePreload(async () => { const { copy } = await import('./Clipboard.js');return { copy }},true              ?[]:void 0,import.meta.url);
            await copy(extractedContent, { showFeedback: true });
            await unifiedMessaging.sendMessage({
              type: "share-target-result",
              destination: "workcenter",
              data: {
                content: typeof extractedContent === "string" ? extractedContent : JSON.stringify(extractedContent),
                rawData: result.data,
                timestamp: Date.now(),
                source: "share-target",
                action: "Legacy AI Processing",
                metadata: {
                  legacyCommit: true,
                  resultStatus: result.status
                }
              },
              metadata: { priority: "normal" }
            });
            break;
          }
        }
      }
    };
    swChannel.addEventListener("message", swHandler);
    _cleanupFns.push(() => {
      swChannel.removeEventListener("message", swHandler);
      swChannel.close();
    });
  }
  console.log("[PWA-Copy] Receivers initialized");
  return () => cleanupPWAClipboard();
};
const cleanupPWAClipboard = () => {
  _cleanupFns.forEach((fn) => fn?.());
  _cleanupFns = [];
  _pwaClipboardInitialized = false;
};
const requestCopyViaServiceWorker = (data) => {
  requestCopy(data, { showFeedback: true });
};
const pwaCopy = {
  init: initPWAClipboard,
  cleanup: cleanupPWAClipboard,
  requestCopy: requestCopyViaServiceWorker
};

const __vite_import_meta_env__$1 = {"BASE_URL": "./", "DEV": false, "MODE": "crx", "PROD": true, "SSR": false};
"use strict";
const isLikelyJavaScriptContentType = (contentType) => {
  const ct = (contentType || "").toLowerCase();
  return ct.includes("javascript") || ct.includes("ecmascript") || ct.includes("module");
};
const probeScriptUrl = async (url) => {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin"
    });
    const contentType = res.headers.get("content-type");
    return { ok: res.ok && isLikelyJavaScriptContentType(contentType), url, contentType, status: res.status };
  } catch {
    return { ok: false, url };
  }
};
const getServiceWorkerCandidates = () => {
  const env = __vite_import_meta_env__$1;
  const isDev = Boolean(env?.DEV);
  if (isDev) return ["/sw.js"];
  return ["/sw.js", "/apps/cw/sw.js"];
};
const ensureServiceWorkerRegistered = async () => {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) return existing;
  } catch {
  }
  const candidates = getServiceWorkerCandidates();
  const scope = "/";
  for (const url of candidates) {
    const probe = await probeScriptUrl(url);
    if (!probe.ok) continue;
    try {
      return await navigator.serviceWorker.register(url, {
        scope,
        type: "module",
        updateViaCache: "none"
      });
    } catch (e) {
      console.warn("[SW] Registration attempt failed for", url, e);
    }
  }
  try {
    const probes = await Promise.all(candidates.map(probeScriptUrl));
    console.warn("[SW] No valid service worker script found. Probes:", probes);
  } catch {
  }
  return null;
};

"use strict";
const getContentType = (payload) => {
  if (payload.hint?.contentType) return String(payload.hint.contentType);
  const files = Array.isArray(payload.files) ? payload.files : [];
  const text = String(payload.text || "").trim();
  const url = String(payload.url || "").trim();
  if (files.length > 0) {
    const file = files[0];
    const name = String(file?.name || "").toLowerCase();
    const mime = String(file?.type || "").toLowerCase();
    if (mime.startsWith("image/")) return "image";
    if (mime === "text/markdown" || name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
    if (mime.startsWith("text/")) return "text";
    return "file";
  }
  if (url) return "url";
  if (text) return "text";
  return "other";
};
const pickDestination = (payload, contentType) => {
  if (payload.hint?.destination) return payload.hint.destination;
  if (payload.hint?.action === "save") return "explorer";
  if (payload.hint?.action === "process" || payload.hint?.action === "attach") return "workcenter";
  if (payload.hint?.action === "open") return "viewer";
  if (contentType === "markdown" || contentType === "text") return "viewer";
  if (contentType === "url") return "workcenter";
  if (contentType === "image" || contentType === "file") return "workcenter";
  return "workcenter";
};
const toMessageType = (destination, hint) => {
  if (destination === "viewer") return hint?.action === "open" ? "content-load" : "content-view";
  if (destination === "explorer") return "file-save";
  if (destination === "workcenter") return "content-attach";
  if (destination === "editor") return "content-load";
  return "content-share";
};
const resolveViewTransfer = (payload) => {
  const contentType = getContentType(payload);
  const destination = pickDestination(payload, contentType);
  const messageType = toMessageType(destination, payload.hint);
  const files = Array.isArray(payload.files) ? payload.files : [];
  const data = {
    title: payload.title,
    text: payload.text,
    content: payload.text,
    url: payload.url,
    files,
    filename: payload.hint?.filename || files[0]?.name,
    source: payload.source,
    route: payload.route,
    hint: payload.hint
  };
  return {
    destination,
    routePath: `/${destination}`,
    messageType,
    contentType,
    data,
    metadata: {
      source: payload.source,
      route: payload.route,
      pending: Boolean(payload.pending),
      hint: payload.hint,
      ...payload.metadata || {}
    }
  };
};
const dispatchViewTransfer = async (payload) => {
  const resolved = resolveViewTransfer(payload);
  const message = {
    type: resolved.messageType,
    destination: resolved.destination,
    contentType: resolved.contentType,
    data: resolved.data,
    metadata: resolved.metadata,
    source: `view-transfer:${payload.source}`
  };
  const delivered = await sendMessage(message);
  return { delivered, resolved };
};

const __vite_import_meta_env__ = {"BASE_URL": "./", "DEV": false, "MODE": "crx", "PROD": true, "SSR": false};
"use strict";
const ensureAppCss = () => {
  const viteEnv = __vite_import_meta_env__;
  if (viteEnv?.DEV) return;
  if (typeof window === "undefined") return;
  if (globalThis?.location?.protocol === "chrome-extension:") return;
  const id = "rs-crossword-css";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  try {
    const cssUrl = new URL("../assets/crossword.css", import.meta.url);
    link.href = cssUrl.toString();
  } catch {
    link.href = "assets/crossword.css";
  }
  let altIndex = 0;
  link.onerror = () => {
    const altPaths = [
      // Relative to app root (if main entry, not in modules/)
      new URL("./assets/crossword.css", import.meta.url).toString(),
      // Absolute from document root
      "/assets/crossword.css",
      // Common app mounting paths
      "/apps/cw/assets/crossword.css"
    ];
    if (altIndex < altPaths.length) {
      const nextPath = altPaths[altIndex++];
      if (link.href !== nextPath) {
        console.warn(`[CSS] Trying path: ${nextPath}`);
        link.href = nextPath;
        return;
      }
    }
    link.onerror = null;
  };
  document.head.append(link);
};
let _swRegistration = null;
let _swInitPromise = null;
let _swOptions = {
  immediate: false,
  onRegistered: () => {
    console.log("[PWA] Service worker registered successfully");
  },
  onRegisterError: (error) => {
    console.error("[PWA] Service worker registration failed:", error);
  }
};
const initServiceWorker = async (_options = _swOptions) => {
  if (_swInitPromise) return _swInitPromise;
  _swInitPromise = (async () => {
    if (typeof globalThis === "undefined") return null;
    if (globalThis?.location?.protocol === "chrome-extension:") return null;
    if (!("serviceWorker" in navigator)) {
      console.warn("[PWA] Service workers not supported");
      return null;
    }
    try {
      const registration = await ensureServiceWorkerRegistered();
      if (!registration) {
        console.error("[PWA] Service worker registration failed: no valid sw.js found");
        return null;
      }
      _swRegistration = registration;
      const viteEnv = __vite_import_meta_env__;
      try {
        if (viteEnv?.DEV && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch (e) {
        console.warn("[PWA] Failed to auto-skip-waiting in dev:", e);
      }
      registration?.addEventListener?.("updatefound", () => {
        const newWorker = registration?.installing;
        if (newWorker) {
          newWorker?.addEventListener?.("statechange", () => {
            if (newWorker?.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[PWA] New service worker available");
              showToast({ message: "App update available", kind: "info" });
              try {
                if (viteEnv?.DEV && registration.waiting) {
                  registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }
              } catch (e) {
                console.warn("[PWA] Failed to auto-skip-waiting on updatefound:", e);
              }
            }
          });
        }
      });
      setInterval(() => {
        registration?.update?.().catch?.(console.warn);
      }, 30 * 60 * 1e3);
      console.log("[PWA] Service worker registered successfully");
      return registration;
    } catch (error) {
      console.error("[PWA] Service worker registration failed:", error);
      return null;
    }
  })();
  return _swInitPromise;
};
const getServiceWorkerRegistration = () => _swRegistration;
const waitForServiceWorker = async () => {
  if (_swRegistration) return _swRegistration;
  return _swInitPromise || initServiceWorker();
};
let _receiversCleanup = null;
const initReceivers = () => {
  if (_receiversCleanup) return;
  _receiversCleanup = initPWAClipboard();
};
const routeToTransferView = async (shareData, source, hint, pending = false) => {
  const files = Array.isArray(shareData.files) ? shareData.files.filter((file) => file instanceof File) : [];
  const { delivered, resolved } = await dispatchViewTransfer({
    source,
    route: source === "launch-queue" ? "launch-queue" : "share-target",
    title: shareData.title,
    text: shareData.text,
    url: shareData.url || shareData.sharedUrl,
    files,
    hint,
    pending,
    metadata: {
      timestamp: shareData.timestamp || Date.now(),
      fileCount: shareData.fileCount ?? files.length,
      imageCount: shareData.imageCount ?? files.filter((f) => f.type.startsWith("image/")).length
    }
  });
  const currentPath = (globalThis?.location?.pathname || "").replace(/\/+$/, "") || "/";
  if (currentPath !== resolved.routePath) {
    const nextUrl = new URL(globalThis?.location?.href);
    nextUrl.pathname = resolved.routePath;
    nextUrl.search = "";
    nextUrl.hash = "";
    globalThis.location.href = nextUrl.toString();
  }
  return delivered;
};
const extractShareContent = (shareData) => {
  const text = shareData.text?.trim();
  if (text) {
    return { content: text, type: "text" };
  }
  const url = (shareData.url || shareData.sharedUrl)?.trim();
  if (url) {
    return { content: url, type: "url" };
  }
  const title = shareData.title?.trim();
  if (title) {
    return { content: title, type: "text" };
  }
  if (Array.isArray(shareData.files) && shareData.files.length > 0) {
    const firstFile = shareData.files[0];
    if (firstFile instanceof File || firstFile instanceof Blob) {
      return { content: null, type: "file" };
    }
  }
  return { content: null, type: null };
};
const processShareTargetData = async (shareData, skipIfEmpty = false) => {
  console.log("[ShareTarget] Processing shared data:", {
    hasText: !!shareData.text,
    hasUrl: !!shareData.url,
    fileCount: shareData.files?.length || shareData.fileCount || 0,
    imageCount: shareData.imageCount || 0,
    source: shareData.source || "unknown",
    aiProcessed: shareData.aiProcessed
  });
  if (shareData.aiProcessed && shareData.results?.length) {
    console.log("[ShareTarget] AI already processed in SW, showing result");
    showToast({ message: "Content processed by service worker", kind: "success" });
    return true;
  }
  const { content, type } = extractShareContent(shareData);
  console.log("[ShareTarget] Extracted content:", { content: content?.substring(0, 50), type });
  if (!content && type !== "file") {
    if (skipIfEmpty) {
      console.log("[ShareTarget] No content to process (skipping)");
      return false;
    }
    if (shareData.fileCount && shareData.fileCount > 0) {
      console.log("[ShareTarget] Files processed in service worker");
      showToast({ message: "Files received and being processed", kind: "info" });
      return true;
    }
    console.warn("[ShareTarget] No content to process");
    showToast({ message: "No content received to process", kind: "warning" });
    return false;
  }
  try {
    console.log("[ShareTarget] Starting AI processing for type:", type);
    showToast({ message: "Processing shared content...", kind: "info" });
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };
    console.log("[ShareTarget] Using unified processing endpoint");
    let processingContent;
    let contentType;
    if (type === "file" && shareData.files?.[0]) {
      const file = shareData.files[0];
      console.log("[ShareTarget] Processing file:", { name: file.name, type: file.type, size: file.size });
      const base64 = await fileToBase64(file);
      processingContent = base64;
      contentType = "base64";
    } else if (content) {
      processingContent = content;
      contentType = "text";
      console.log("[ShareTarget] Processing text content, length:", content.length);
    } else {
      throw new Error("No processable content found");
    }
    console.log("[ShareTarget] Calling unified processing API");
    const response = await fetch("/api/processing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: processingContent,
        contentType,
        processingType: "general-processing",
        metadata: {
          source: "share-target",
          title: shareData.title || "Shared Content",
          timestamp: Date.now()
        }
      })
    });
    if (!response.ok) {
      throw new Error(`Processing API failed: ${response.status}`);
    }
    const result = await response.json();
    console.log("[ShareTarget] Unified processing completed:", { success: result.success });
    if (result.success && result.data) {
      console.log("[ShareTarget] Processing result via unified messaging");
      const clipboardChannel = new BroadcastChannel(CHANNELS.CLIPBOARD);
      clipboardChannel.postMessage({
        type: "copy",
        data: result.data
      });
      clipboardChannel.close();
      try {
        const { unifiedMessaging } = await __vitePreload(async () => { const { unifiedMessaging } = await import('./UnifiedMessaging.js').then(n => n.UnifiedMessaging);return { unifiedMessaging }},true              ?[]:void 0,import.meta.url);
        await unifiedMessaging.sendMessage({
          type: "share-target-result",
          source: "share-target",
          destination: "workcenter",
          data: {
            content: typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2),
            rawData: result.data,
            timestamp: Date.now(),
            source: "share-target",
            action: "Processing (/api/processing)",
            metadata: result.metadata
          },
          metadata: { priority: "high" }
        });
      } catch (e) {
        const workCenterChannel = new BroadcastChannel(BROADCAST_CHANNELS.WORK_CENTER);
        workCenterChannel.postMessage({
          type: "share-target-result",
          data: {
            content: result.data,
            rawData: result.data,
            timestamp: Date.now(),
            source: "share-target",
            action: "Processing (/api/processing)",
            metadata: result.metadata
          }
        });
        workCenterChannel.close();
      }
      return true;
    } else {
      const errorMsg = result?.error || "AI processing returned no data";
      console.warn("[ShareTarget] AI processing failed:", errorMsg);
      const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
      shareChannel.postMessage({
        type: "ai-result",
        data: { success: false, error: errorMsg }
      });
      shareChannel.close();
      showToast({ message: `Processing failed: ${errorMsg}`, kind: "warning" });
      return false;
    }
  } catch (error) {
    console.error("[ShareTarget] Processing error:", error);
    console.log("[ShareTarget] Attempting server-side fallback");
    const fallbackResult = await tryServerSideProcessing(shareData);
    if (fallbackResult) {
      console.log("[ShareTarget] Server-side fallback succeeded");
      return true;
    }
    console.warn("[ShareTarget] All processing methods failed");
    const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
    shareChannel.postMessage({
      type: "ai-result",
      data: { success: false, error: error?.message || String(error) }
    });
    shareChannel.close();
    showToast({ message: `Processing failed: ${error?.message || "Unknown error"}`, kind: "error" });
    return false;
  }
};
const CHANNELS = {
  SHARE_TARGET: BROADCAST_CHANNELS.SHARE_TARGET,
  TOAST: BROADCAST_CHANNELS.TOAST,
  CLIPBOARD: BROADCAST_CHANNELS.CLIPBOARD,
  MINIMAL_APP: BROADCAST_CHANNELS.MINIMAL_APP,
  MAIN_APP: BROADCAST_CHANNELS.MAIN_APP,
  FILE_EXPLORER: BROADCAST_CHANNELS.FILE_EXPLORER,
  PRINT_VIEWER: BROADCAST_CHANNELS.PRINT_VIEWER
};
const storeShareTargetPayloadToCache = async (payload) => storeShareTargetPayloadToCache$1(payload);
const consumeCachedShareTargetPayload = async (opts = {}) => consumeCachedShareTargetPayload$1(opts);
const tryServerSideProcessing = async (shareData) => {
  try {
    const { content, type } = extractShareContent(shareData);
    if (!content) return false;
    console.log("[ShareTarget] Attempting server-side AI fallback");
    const { getRuntimeSettings } = await __vitePreload(async () => { const { getRuntimeSettings } = await import('./RuntimeSettings.js');return { getRuntimeSettings }},true              ?[]:void 0,import.meta.url);
    const settings = await getRuntimeSettings().catch(() => null);
    const apiKey = settings?.ai?.apiKey;
    if (!apiKey) {
      console.log("[ShareTarget] No API key for server fallback");
      return false;
    }
    const response = await fetch("/api/share/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: type === "text" ? content : void 0,
        url: type === "url" ? content : void 0,
        title: shareData.title,
        apiKey,
        baseUrl: settings?.ai?.baseUrl,
        model: settings?.ai?.customModel || settings?.ai?.model
      })
    });
    if (!response.ok) {
      console.warn("[ShareTarget] Server fallback failed:", response.status);
      return false;
    }
    const result = await response.json();
    if (result?.ok && result?.data) {
      console.log("[ShareTarget] Broadcasting server-side result to clipboard handlers");
      const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
      shareChannel.postMessage({
        type: "ai-result",
        data: { success: true, data: String(result.data) }
      });
      shareChannel.close();
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[ShareTarget] Server fallback error:", error);
    return false;
  }
};
const handleShareTarget = () => {
  const params = new URLSearchParams(globalThis?.location?.search);
  const shared = params.get("shared");
  if (shared === "1" || shared === "true") {
    console.log("[ShareTarget] Detected shared=1 URL param, processing server-side share");
    const shareFromParams = {
      title: params.get("title") || void 0,
      text: params.get("text") || void 0,
      url: params.get("url") || void 0,
      sharedUrl: params.get("sharedUrl") || void 0,
      timestamp: Date.now(),
      source: "url-params"
    };
    console.log("[ShareTarget] Share data from URL params:", {
      title: shareFromParams.title,
      text: shareFromParams.text,
      url: shareFromParams.url,
      sharedUrl: shareFromParams.sharedUrl
    });
    const cleanUrl = new URL(globalThis?.location?.href);
    ["shared", "action", "title", "text", "url", "sharedUrl"].forEach((p) => cleanUrl.searchParams.delete(p));
    globalThis?.history?.replaceState?.({}, "", cleanUrl.pathname + cleanUrl.hash);
    const { content, type } = extractShareContent(shareFromParams);
    console.log("[ShareTarget] Extracted from URL params:", { content: content?.substring(0, 50), type });
    if (content || type === "file") {
      console.log("[ShareTarget] Processing from URL params");
      routeToTransferView(shareFromParams, "share-target").catch((error) => {
        console.warn("[ShareTarget] Route transfer failed, falling back to processing:", error);
        processShareTargetData(shareFromParams, true);
      });
      return;
    } else {
      console.log("[ShareTarget] No processable content in URL params, checking cache");
    }
    if ("caches" in globalThis) {
      caches.open("share-target-data").then((cache) => cache?.match?.("/share-target-data")).then((response) => response?.json?.()).then(async (data) => {
        if (data) {
          console.log("[ShareTarget] Retrieved cached data:", data);
          const delivered = await routeToTransferView(data, "share-target", void 0, true);
          if (!delivered) {
            await processShareTargetData(data, true);
          }
        } else {
          console.log("[ShareTarget] No cached share data found");
        }
      }).catch((e) => console.warn("[ShareTarget] Cache retrieval failed:", e));
    }
  } else if (shared === "test") {
    showToast({ message: "Share target route working", kind: "info" });
    const cleanUrl = new URL(globalThis?.location?.href);
    cleanUrl.searchParams.delete("shared");
    globalThis?.history?.replaceState?.({}, "", cleanUrl.pathname + cleanUrl.hash);
  }
  try {
    const pendingData = sessionStorage.getItem("rs-pending-share");
    if (pendingData) {
      sessionStorage.removeItem("rs-pending-share");
      const shareData = JSON.parse(pendingData);
      console.log("[ShareTarget] Found pending share in sessionStorage:", shareData);
      routeToTransferView(shareData, "pending", void 0, true).catch((error) => {
        console.warn("[ShareTarget] Pending transfer routing failed:", error);
      });
    }
  } catch (e) {
  }
  if (typeof BroadcastChannel !== "undefined") {
    const shareChannel = new BroadcastChannel(CHANNELS.SHARE_TARGET);
    shareChannel.addEventListener("message", async (event) => {
      const msgType = event.data?.type;
      const msgData = event.data?.data;
      console.log("[ShareTarget] Broadcast received:", { type: msgType, hasData: !!msgData });
      if (msgType === "share-received" && msgData) {
        console.log("[ShareTarget] Share notification received:", {
          hasText: !!msgData.text,
          hasUrl: !!msgData.url,
          fileCount: msgData.fileCount || 0,
          aiEnabled: msgData.aiEnabled,
          source: msgData.source
        });
        if (msgData.fileCount > 0 && !msgData.files?.length) {
          showToast({ message: `Processing ${msgData.fileCount} file(s)...`, kind: "info" });
        } else if (msgData.text || msgData.url || msgData.title) {
          console.log("[ShareTarget] Processing broadcasted share data");
          const delivered = await routeToTransferView(msgData, "share-target", void 0, true);
          if (!delivered) {
            await processShareTargetData(msgData, true);
          }
        }
      } else if (msgType === "ai-result") {
        console.log("[ShareTarget] AI result broadcast received (handled by PWA clipboard)");
      }
    });
    console.log("[ShareTarget] Broadcast channel listener set up");
  } else {
    console.warn("[ShareTarget] BroadcastChannel not available");
  }
};
const setupLaunchQueueConsumer = async () => {
  if (!("launchQueue" in globalThis)) {
    console.log("[LaunchQueue] launchQueue API not available");
    return;
  }
  try {
    globalThis?.launchQueue?.setConsumer?.((launchParams) => {
      console.log("[LaunchQueue] Launch params received:", launchParams);
      const $files = [...launchParams.files];
      if (!$files || $files.length === 0) {
        console.log("[LaunchQueue] No files in launch params - this may indicate:");
        console.log("  - File opener was used but no files were selected");
        console.log("  - Launch queue consumer called with empty payload");
        console.log("  - Permission issues preventing file access");
        console.log("  - Browser compatibility issues");
        return;
      }
      console.log(`[LaunchQueue] Processing ${$files.length} file handle(s)`);
      const files = [];
      const failedHandles = [];
      let hasMarkdownFile = false;
      (async () => {
        for (const fileHandle of $files) {
          try {
            console.log("[LaunchQueue] Processing file handle:", {
              name: fileHandle.name || "unknown",
              type: fileHandle.constructor.name,
              hasGetFile: typeof fileHandle.getFile === "function",
              isFile: fileHandle instanceof File
            });
            if (fileHandle.getFile) {
              try {
                if ("queryPermission" in fileHandle) {
                  const permission = await fileHandle.queryPermission();
                  console.log("[LaunchQueue] File handle permission:", permission);
                  if (permission !== "granted") {
                    console.warn("[LaunchQueue] No permission to access file:", fileHandle.name);
                    failedHandles.push(fileHandle);
                    continue;
                  }
                }
                const file = await fileHandle.getFile();
                console.log("[LaunchQueue] Got file from handle:", file.name, file.type, file.size);
                files.push(file);
                if (file.type === "text/markdown" || file.name.toLowerCase().endsWith(".md")) {
                  hasMarkdownFile = true;
                }
              } catch (permError) {
                console.warn("[LaunchQueue] Permission or access error for file handle:", permError, fileHandle);
                failedHandles.push(fileHandle);
              }
            } else if (fileHandle instanceof File) {
              console.log("[LaunchQueue] File handle is already a File object:", fileHandle.name, fileHandle.type);
              files.push(fileHandle);
              if (fileHandle.type === "text/markdown" || fileHandle.name.toLowerCase().endsWith(".md")) {
                hasMarkdownFile = true;
              }
            } else {
              console.warn("[LaunchQueue] Unknown file handle type:", fileHandle.constructor.name);
              failedHandles.push(fileHandle);
            }
          } catch (error) {
            console.warn("[LaunchQueue] Failed to get file from handle:", error, fileHandle);
            failedHandles.push(fileHandle);
          }
        }
        console.log(`[LaunchQueue] Successfully processed ${files.length} files, ${failedHandles.length} failed`);
        if (files.length === 0) {
          if (failedHandles.length > 0) {
            console.error("[LaunchQueue] All file handles failed to process");
            showToast({
              message: `Failed to process ${failedHandles.length} launched file(s)`,
              kind: "error"
            });
          } else {
            console.log("[LaunchQueue] No files to process after filtering");
          }
          return;
        }
        if (files.length > 0) {
          const shareData = {
            files,
            fileCount: files.length,
            timestamp: Date.now(),
            // Determine if there are images for AI processing
            imageCount: files?.filter?.((f) => f.type.startsWith("image/")).length,
            // Check for markdown files
            markdownCount: files?.filter?.((f) => f.type === "text/markdown" || f.name.toLowerCase().endsWith(".md")).length,
            // Mark as launch queue origin for debugging
            source: "launch-queue"
          };
          console.log("[LaunchQueue] Created share data:", {
            fileCount: shareData.fileCount,
            imageCount: shareData.imageCount,
            fileTypes: files?.map?.((f) => ({ name: f.name, type: f.type, size: f.size })),
            source: shareData.source
          });
          const hint = hasMarkdownFile && files.length === 1 ? { destination: "viewer", action: "open", filename: files[0]?.name } : void 0;
          showToast({
            message: `Received ${files.length} file(s)`,
            kind: "info"
          });
          try {
            const delivered = await routeToTransferView(shareData, "launch-queue", hint, true);
            if (!delivered) {
              console.warn("[LaunchQueue] Share target processing returned false");
              showToast({
                message: `Received ${files.length} file(s); delivery is pending`,
                kind: "warning"
              });
            } else {
              console.log("[LaunchQueue] Transfer routed successfully");
            }
          } catch (error) {
            console.error("[LaunchQueue] Failed to route launch queue files:", error);
            const stored = await storeShareTargetPayloadToCache({
              files,
              meta: { timestamp: Date.now(), source: "launch-queue" }
            });
            if (stored) {
              const url = new URL(globalThis?.location?.href);
              url.pathname = "/share-target";
              url.searchParams.set("shared", "1");
              url.hash = "";
              globalThis.location.href = url.toString();
            } else {
              showToast({
                message: `Failed to process ${files.length} launched file(s)`,
                kind: "error"
              });
            }
          }
        }
        if (launchParams.targetURL) {
          console.log("[LaunchQueue] Target URL:", launchParams.targetURL);
        }
      })();
    });
    console.log("[LaunchQueue] Consumer set up successfully");
  } catch (error) {
    console.error("[LaunchQueue] Failed to set up consumer:", error);
  }
};
const checkPendingShareData = async () => {
  try {
    const pendingData = globalThis?.sessionStorage?.getItem?.("rs-pending-share");
    if (!pendingData) return null;
    globalThis?.sessionStorage?.removeItem?.("rs-pending-share");
    const shareData = JSON.parse(pendingData);
    console.log("[ShareTarget] Found pending share data:", shareData);
    if ("caches" in window) {
      const cache = await globalThis?.caches?.open?.("share-target-data");
      await cache?.put?.("/share-target-data", new Response(JSON.stringify({
        ...shareData,
        files: [],
        timestamp: shareData.timestamp || Date.now()
      }), {
        headers: { "Content-Type": "application/json" }
      }));
    }
    return shareData;
  } catch (error) {
    console.warn("[ShareTarget] Failed to process pending share data:", error);
    return null;
  }
};

"use strict";
let recognition = null;
let aiListening = false;
let aiModeActive = false;
const checkIsAiModeActive = () => {
  return aiListening || aiModeActive;
};
function setAiStatus(text) {
  if (aiStatusEl) {
    aiStatusEl.textContent = text;
  }
}
function setupSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    log("SpeechRecognition API не поддерживается.");
    return null;
  }
  const recog = new SR();
  recog.lang = "ru-RU";
  recog.interimResults = false;
  recog.maxAlternatives = 1;
  return recog;
}
function initSpeechRecognition() {
  recognition = setupSpeechRecognition();
  if (recognition) {
    recognition.onstart = () => {
      aiListening = true;
      aiModeActive = true;
      if (aiButton) {
        aiButton.classList.add("listening");
      }
      setAiStatus("listening");
      if (voiceTextEl) {
        voiceTextEl.textContent = "Слушаю...";
      }
      log("Speech: start");
    };
    recognition.onend = () => {
      aiListening = false;
      aiModeActive = false;
      if (aiButton) {
        aiButton.classList.remove("listening");
      }
      setAiStatus("idle");
      log("Speech: end");
    };
    recognition.onerror = (event) => {
      if (voiceTextEl) {
        voiceTextEl.textContent = "Ошибка распознавания: " + event.error;
      }
      log("Speech error: " + event.error);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const normalized = (transcript || "").trim();
      const words = normalized.split(/\s+/).filter(Boolean);
      if (voiceTextEl) {
        voiceTextEl.textContent = normalized ? "Команда: " + normalized : "Команда не распознана";
      }
      log("Speech result: " + normalized);
      if (words.length < 2) {
        log("Speech: недостаточно слов (нужно >= 2) — не отправляем и не подключаем WS");
        return;
      }
      const payload = {
        type: "voice_command",
        text: normalized
      };
      const trySend = (deadline) => {
        if (isWSConnected()) {
          sendWS(payload);
          return;
        }
        if (Date.now() > deadline) {
          log("Speech: не удалось дождаться WS, команда не отправлена");
          return;
        }
        setTimeout(() => trySend(deadline), 120);
      };
      if (!isWSConnected()) {
        log("Speech: подключаем WS перед отправкой команды");
        connectWS();
        trySend(Date.now() + 2e3);
      } else {
        sendWS(payload);
      }
    };
  }
}
function initAiButton() {
  if (!aiButton) return;
  let pointerActive = false;
  let pointerId = null;
  aiButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (pointerActive) return;
    pointerActive = true;
    pointerId = e.pointerId;
    aiButton.setPointerCapture(pointerId);
    if (!recognition) {
      log("SpeechRecognition недоступен");
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      log("Recognition start error: " + err.message);
    }
  });
  aiButton.addEventListener("pointerup", (e) => {
    if (!pointerActive || e.pointerId !== pointerId) return;
    e.preventDefault();
    pointerActive = false;
    aiButton.releasePointerCapture(pointerId);
    pointerId = null;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch (err) {
      log("Recognition stop error: " + err.message);
    }
  });
  aiButton.addEventListener("pointercancel", () => {
    if (!pointerActive) return;
    pointerActive = false;
    pointerId = null;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
      }
    }
  });
}

"use strict";
const accum = { dx: 0, dy: 0, dz: 0 };
let flushTimer = null;
function clearAccum() {
  accum.dx = 0;
  accum.dy = 0;
  accum.dz = 0;
}
function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = globalThis?.setTimeout?.(() => {
    flushTimer = null;
    if (accum.dx === 0 && accum.dy === 0 && accum.dz === 0) return;
    sendWS({
      type: "move",
      dx: accum.dx,
      dy: accum.dy,
      dz: accum.dz
    });
    clearAccum();
  }, MOTION_SEND_INTERVAL);
}
function enqueueMotion(dx, dy, dz = 0) {
  if (Math.abs(dx) < MOTION_JITTER_EPS) dx = 0;
  if (Math.abs(dy) < MOTION_JITTER_EPS) dy = 0;
  if (Math.abs(dz) < MOTION_JITTER_EPS) dz = 0;
  if (dx === 0 && dy === 0 && dz === 0) return;
  accum.dx += dx;
  accum.dy += dy;
  accum.dz += dz;
  scheduleFlush();
}
function resetMotionAccum() {
  clearAccum();
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

"use strict";
function n0(v) {
  return Number.isFinite(v) ? v : 0;
}
function clamp01(v) {
  const x = n0(v);
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function lerp(a, b, t) {
  return n0(a) + (n0(b) - n0(a)) * clamp01(t);
}
function expSmoothing(dtSeconds, ratePerSecond) {
  const dt = Math.max(0, n0(dtSeconds));
  const rate = Math.abs(n0(ratePerSecond));
  return 1 - Math.exp(-rate * dt);
}
function vec3(x, y, z) {
  return { x: n0(x), y: n0(y), z: n0(z) };
}
function vec3Zero() {
  return { x: 0, y: 0, z: 0 };
}
function vec3Mix(a, b, f = 0.5) {
  const ax = n0(a.x);
  const ay = n0(a.y);
  const az = n0(a.z);
  const bx = n0(b.x);
  const by = n0(b.y);
  const bz = n0(b.z);
  const ff = n0(f);
  return {
    x: ax + (bx - ax) * ff,
    y: ay + (by - ay) * ff,
    z: az + (bz - az) * ff
  };
}
function vec3IsNear(v, other, epsilon = 0.01) {
  const e = n0(epsilon) || 0.01;
  return Math.abs(n0(v.x) - n0(other.x)) < e && Math.abs(n0(v.y) - n0(other.y)) < e && Math.abs(n0(v.z) - n0(other.z)) < e;
}
function vec3IsFar(v, other, epsilon = 0.01) {
  const e = n0(epsilon) || 0.01;
  return Math.abs(n0(v.x) - n0(other.x)) > e && Math.abs(n0(v.y) - n0(other.y)) > e && Math.abs(n0(v.z) - n0(other.z)) > e;
}
function vec3FromSensor(sensor) {
  return {
    x: n0(sensor.x),
    y: n0(sensor.y),
    z: n0(sensor.z)
  };
}
function vec3Sub(a, b) {
  return {
    x: n0(a.x) - n0(b.x),
    y: n0(a.y) - n0(b.y),
    z: n0(a.z) - n0(b.z)
  };
}
function vec3Add(a, b) {
  return {
    x: n0(a.x) + n0(b.x),
    y: n0(a.y) + n0(b.y),
    z: n0(a.z) + n0(b.z)
  };
}
function vec3Scale(v, scalar) {
  const s = n0(scalar);
  return {
    x: n0(v.x) * s,
    y: n0(v.y) * s,
    z: n0(v.z) * s
  };
}
function vec3Mul(a, b) {
  return {
    x: n0(a.x) * n0(b.x),
    y: n0(a.y) * n0(b.y),
    z: n0(a.z) * n0(b.z)
  };
}
function vec3Clamp(v, max) {
  const m = Math.abs(n0(max));
  if (m === 0) return vec3Zero();
  const x = n0(v.x);
  const y = n0(v.y);
  const z = n0(v.z);
  const length = Math.hypot(x, y, z);
  if (length === 0 || length <= m) return { x, y, z };
  const s = m / length;
  return { x: x * s, y: y * s, z: z * s };
}
function vec3DeadZone(v, threshold) {
  const t = Math.abs(n0(threshold));
  return {
    x: Math.abs(n0(v.x)) < t ? 0 : n0(v.x),
    y: Math.abs(n0(v.y)) < t ? 0 : n0(v.y),
    z: Math.abs(n0(v.z)) < t ? 0 : n0(v.z)
  };
}
function vec3IsNearZero(v, epsilon = 0.01) {
  const e = Math.abs(n0(epsilon) || 0.01);
  return Math.abs(n0(v.x)) < e && Math.abs(n0(v.y)) < e && Math.abs(n0(v.z)) < e;
}
function vec3Smooth(current, target, factor = 0.25) {
  return vec3Mix(current, target, factor);
}
function vec3Normalize(v, dt = 0.1) {
  const denom = Math.max(1e-6, Math.abs(n0(dt)) || 1e-6);
  return { x: n0(v.x) / denom, y: n0(v.y) / denom, z: n0(v.z) / denom };
}
function vec3Select2D(v, axisX, axisY) {
  const componentMap = {
    ax: v.x || 0,
    ay: v.y || 0,
    az: v.z || 0
  };
  return {
    x: componentMap[axisX],
    y: componentMap[axisY]
  };
}
function vec3Select(v, axisX, axisY, axisZ) {
  const componentMap = {
    ax: n0(v.x),
    ay: n0(v.y),
    az: n0(v.z)
  };
  return {
    x: componentMap[axisX],
    y: componentMap[axisY],
    z: componentMap[axisZ]
  };
}
function vec2ApplyDirection(v, dirX = 1, dirY = 1) {
  return {
    x: n0(v.x) * (n0(dirX) || 1),
    y: n0(v.y) * (n0(dirY) || 1)
  };
}
function vec2Scale(v, scalar = 1) {
  const s = n0(scalar);
  return {
    x: n0(v.x) * s,
    y: n0(v.y) * s
  };
}
function vec3RotateXYByAngle(v, angleRad, zOverride) {
  const a = n0(angleRad);
  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  const x = n0(v.x);
  const y = n0(v.y);
  return {
    x: x * cosA - y * sinA,
    y: x * sinA + y * cosA,
    z: zOverride !== void 0 ? n0(zOverride) : n0(v.z)
  };
}
function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  angle = angle % twoPi;
  if (angle < -Math.PI) {
    angle += twoPi;
  } else if (angle > Math.PI) {
    angle -= twoPi;
  }
  return angle;
}
function angleDelta(a, b) {
  return normalizeAngle(a - b);
}
function vec3NormalizeAngles(v) {
  return {
    x: normalizeAngle(n0(v.x)),
    y: normalizeAngle(n0(v.y)),
    z: normalizeAngle(n0(v.z))
  };
}
function vec3AngleDelta(current, base) {
  return {
    x: angleDelta(n0(current.x), n0(base.x)),
    y: angleDelta(n0(current.y), n0(base.y)),
    z: angleDelta(n0(current.z), n0(base.z))
  };
}

"use strict";
let gravitySensor = null;
let gravityVector = vec3Zero();
let gravityMagnitude = 0;
function getGravityVector() {
  return gravityVector;
}
function getGravityMagnitude() {
  return gravityMagnitude;
}
function isGravityAvailable() {
  return gravitySensor !== null;
}
function resetGravitySensor() {
  gravityVector = vec3Zero();
  gravityMagnitude = 0;
}
function getOrientationCorrection() {
  if (gravityMagnitude < 0.1) {
    return vec3Zero();
  }
  const gx = gravityVector.x;
  const gy = gravityVector.y;
  const gz = gravityVector.z;
  const pitch = Math.atan2(-gx, Math.sqrt(gy * gy + gz * gz));
  const roll = Math.atan2(gy, gz);
  return {
    x: pitch,
    // pitch correction
    y: roll,
    // roll correction
    z: 0
    // yaw not determined from gravity alone
  };
}
function applyDimensionalCorrection(vector, useGravity = true) {
  if (!useGravity || !isGravityAvailable() || gravityMagnitude < 0.1) {
    return vector;
  }
  const correction = getOrientationCorrection();
  return {
    x: vector.x - correction.x * 0.1,
    // Subtle correction
    y: vector.y - correction.y * 0.1,
    z: vector.z
  };
}
function initGravitySensor() {
  if (!("GravitySensor" in window)) {
    log("GravitySensor API is not supported.");
    return;
  }
  try {
    gravitySensor = new window.GravitySensor({ frequency: 60 });
  } catch (err) {
    log("Cannot create GravitySensor: " + (err.message || err));
    return;
  }
  gravitySensor.addEventListener("reading", () => {
    const rawGravity = vec3FromSensor(gravitySensor);
    gravityVector = vec3Smooth(gravityVector, rawGravity, GRAVITY_SMOOTH);
    gravityMagnitude = Math.hypot(gravityVector.x, gravityVector.y, gravityVector.z);
    if (gravityMagnitude > 0.1) {
      const invMag = 1 / gravityMagnitude;
      gravityVector = {
        x: gravityVector.x * invMag,
        y: gravityVector.y * invMag,
        z: gravityVector.z * invMag
      };
    }
  });
  gravitySensor.addEventListener("error", (event) => {
    log("GravitySensor error: " + (event?.error?.message || event?.message || event));
  });
  gravitySensor.start();
  log("GravitySensor started (60 Hz)");
}

"use strict";
let gyroscope = null;
let filteredMovement = { x: 0, y: 0 };
let lastTimestamp$1 = performance.now();
let lastMotionSentAt$2 = 0;
function resetGyroState() {
  setMotionCalibrated(false);
  filteredMovement = { x: 0, y: 0 };
  lastTimestamp$1 = performance.now();
  lastMotionSentAt$2 = 0;
  resetMonteCarloSampling$1();
  gyroscopeSmoothed = vec3Zero();
  integratedAngles = vec3Zero();
  lastGyroMovement = vec3Zero();
}
function resetGyroscopeState() {
  resetGyroState();
  resetMotionBaseline();
}
function onEnterAirMove$1() {
  resetGyroState();
}
let gyroscopeSmoothed = vec3Zero();
let gyroscopeResolved = vec3Zero();
let integratedAngles = vec3Zero();
let gyroscopeSampleWindow = [];
let gyroscopeSampleWeights = [];
let gyroscopeTotalWeight = 0;
let gyroscopeWeightedSum = vec3Zero();
let averageRateSampleCount$1 = 0;
let averageRateSampled$1 = 0;
let averageRateResolved$1 = 0;
function resetMonteCarloSampling$1() {
  gyroscopeSampleWindow = [];
  gyroscopeSampleWeights = [];
  gyroscopeTotalWeight = 0;
  gyroscopeWeightedSum = vec3Zero();
  gyroscopeResolved = vec3Zero();
}
function getCalibrationConfidence$1() {
  return Math.pow(Math.min(1, gyroscopeSampleWindow.length / GYRO_MAX_SAMPLE_COUNT), 2);
}
function addMonteCarloSample$1(sample, weight = 1, smoothForDiff = vec3Zero()) {
  if (Math.abs(sample.x) + Math.abs(sample.y) + Math.abs(sample.z) < 1e-4) return;
  if (Math.hypot(smoothForDiff.x - gyroscopeResolved.x, smoothForDiff.y - gyroscopeResolved.y, smoothForDiff.z - gyroscopeResolved.z) > 1 - getCalibrationConfidence$1()) {
    return;
  }
  const normalizedSample = vec3NormalizeAngles(sample);
  const weightedSample = vec3Scale(normalizedSample, 1 / Math.max(1e-3, weight));
  let removedWeightedSample = null;
  if (gyroscopeSampleWindow.length >= GYRO_MAX_SAMPLE_COUNT) {
    const removedWeight = gyroscopeSampleWeights.shift();
    removedWeightedSample = vec3Scale(gyroscopeSampleWindow.shift(), removedWeight);
    gyroscopeTotalWeight -= removedWeight;
  }
  gyroscopeSampleWindow.push(weightedSample);
  gyroscopeSampleWeights.push(weight);
  gyroscopeTotalWeight += 1;
  if (removedWeightedSample) {
    gyroscopeWeightedSum = vec3Sub(gyroscopeWeightedSum, removedWeightedSample);
  }
  gyroscopeWeightedSum = vec3Add(gyroscopeWeightedSum, weightedSample);
  if (gyroscopeTotalWeight > 0) {
    gyroscopeResolved = vec3Scale(gyroscopeWeightedSum, 1 / gyroscopeTotalWeight);
  }
}
const gravityCorrection$1 = (gyro) => {
  if (isGravityAvailable()) {
    const orientationCorrection = getOrientationCorrection();
    return {
      x: gyro.x - orientationCorrection.x * GRAVITY_CORRECTION_STRENGTH,
      y: gyro.y - orientationCorrection.y * GRAVITY_CORRECTION_STRENGTH,
      z: gyro.z
    };
  }
  return gyro;
};
function gyroscopeSmooth(currentAngles, dt = 0.1, sampleFactor = 1) {
  const smoothFactor = Math.max(0.1, Math.min(dt * 10, GYRO_SMOOTH, 1));
  const normAngles = currentAngles;
  addMonteCarloSample$1(vec3NormalizeAngles(normAngles), sampleFactor, gyroscopeSmoothed);
  const unbiasedAngles = vec3Sub(normAngles, gyroscopeResolved);
  gyroscopeSmoothed = vec3Smooth(gyroscopeSmoothed, normAngles, smoothFactor);
  let smoothGyro = gyroscopeSmoothed;
  return vec3NormalizeAngles(smoothGyro);
}
const getRotatedGyro = (gyro) => {
  let selectedAxes = vec3Select(
    gyro,
    gyroSrcForMouseX,
    gyroSrcForMouseY,
    gyroSrcForMouseZ
  );
  const rotationZ = normalizeAngle(selectedAxes.z * gyroDirZ);
  return vec3RotateXYByAngle(selectedAxes, rotationZ, 1);
};
let lastGyroMovement = vec3Zero();
let forSendingGyroMovement = vec3Zero();
let lastSendingTime = 0;
let deltaGyroMovement = vec3Zero();
const calculateDeltaGyroMovement = (gyro) => {
  const result = vec3Sub(gyro, lastGyroMovement);
  lastGyroMovement = gyro;
  return deltaGyroMovement = result;
};
let sendWSGyroMovement = (movement) => {
  forSendingGyroMovement = vec3Add(forSendingGyroMovement, movement);
  const baseMovement = {
    x: forSendingGyroMovement.x * gyroDirX * GYRO_GAIN,
    y: forSendingGyroMovement.y * gyroDirY * GYRO_GAIN,
    z: forSendingGyroMovement.z * GYRO_GAIN * GYRO_ROTATION_GAIN
  };
  forSendingGyroMovement = vec3Zero();
  const clampedMovement = vec3Clamp(baseMovement, ANGLE_MAX_STEP);
  const jx = Math.abs(clampedMovement.x) < GYRO_DEADZONE ? 0 : clampedMovement.x;
  const jy = Math.abs(clampedMovement.y) < GYRO_DEADZONE ? 0 : clampedMovement.y;
  const jz = Math.abs(clampedMovement.z) < GYRO_DEADZONE ? 0 : clampedMovement.z;
  if (jx === 0 && jy === 0 && jz === 0) return;
  enqueueMotion(jx, jy, jz);
};
function initGyro() {
  if (!("Gyroscope" in window)) {
    log("Gyroscope API не поддерживается.");
    return;
  }
  try {
    gyroscope = new window.Gyroscope({ frequency: 60 });
  } catch (err) {
    log("Невозможно создать Gyroscope: " + (err.message || err));
    return;
  }
  gyroscope.addEventListener("reading", () => {
    const now = performance.now();
    const dtMs = now - (lastTimestamp$1 || now);
    const dt = dtMs / 1e3;
    lastTimestamp$1 = now;
    averageRateSampled$1 += dt;
    averageRateSampleCount$1++;
    averageRateResolved$1 = averageRateSampled$1 / averageRateSampleCount$1;
    const averageRateFactor = dt / averageRateResolved$1;
    const rawGyro = vec3FromSensor(gyroscope);
    integratedAngles = vec3NormalizeAngles(vec3Add(integratedAngles, vec3Scale(rawGyro, dt)));
    const filteredGyro = getRotatedGyro(gyroscopeSmooth(integratedAngles, dt, averageRateFactor));
    const delta = vec3DeadZone(calculateDeltaGyroMovement(filteredGyro), GYRO_DEADZONE);
    if (vec3IsNearZero(delta)) {
      return;
    }
    if (getAirState() !== "AIR_MOVE") {
      return;
    }
    if (!isWSConnected()) return;
    if (aiModeActive) return;
    sendWSGyroMovement(delta);
  });
  gyroscope.addEventListener("error", (event) => {
    log("Gyroscope error: " + (event.error && event.error.message || event.message || event));
  });
  gyroscope.start();
  log("Gyroscope started (60 Hz, angle integration)");
}

"use strict";
let accelerometer = null;
let lastTimestamp = performance.now();
let lastMotionSentAt$1 = 0;
function resetAccelState() {
  setMotionCalibrated(false);
  lastTimestamp = performance.now();
  lastMotionSentAt$1 = 0;
  resetMonteCarloSampling();
  accelerometerSmoothed = vec3Zero();
  accelerometerResolved = vec3Zero();
  forSendingMovement = vec3Zero();
}
function resetAccelerometerState() {
  resetAccelState();
}
function onEnterAirMove() {
  resetAccelState();
}
let accelerometerSmoothed = vec3Zero();
let accelerometerResolved = vec3Zero();
let accelerometerSampleWindow = [];
let accelerometerSampleWeights = [];
let accelerometerTotalWeight = 0;
let accelerometerWeightedSum = vec3Zero();
let averageRateSampleCount = 0;
let averageRateSampled = 0;
let averageRateResolved = 0;
function resetMonteCarloSampling() {
  accelerometerSampleWindow = [];
  accelerometerSampleWeights = [];
  accelerometerTotalWeight = 0;
  accelerometerWeightedSum = vec3Zero();
  accelerometerResolved = vec3Zero();
}
function addMonteCarloSample(sample, weight = 1, smoothForDiff = vec3Zero()) {
  if (Math.abs(sample.x) + Math.abs(sample.y) + Math.abs(sample.z) < 1e-4) return;
  if (Math.hypot(smoothForDiff.x - accelerometerResolved.x, smoothForDiff.y - accelerometerResolved.y, smoothForDiff.z - accelerometerResolved.z) > 2) {
    return;
  }
  const weightedSample = vec3Scale(sample, 1 / Math.max(1e-3, weight));
  let removedWeightedSample = null;
  if (accelerometerSampleWindow.length >= ACCELEROMETER_MAX_SAMPLE_COUNT) {
    const removedWeight = accelerometerSampleWeights.shift();
    removedWeightedSample = vec3Scale(accelerometerSampleWindow.shift(), removedWeight);
    accelerometerTotalWeight -= removedWeight;
  }
  accelerometerSampleWindow.push(weightedSample);
  accelerometerSampleWeights.push(weight);
  accelerometerTotalWeight += 1;
  if (removedWeightedSample) {
    accelerometerWeightedSum = vec3Sub(accelerometerWeightedSum, removedWeightedSample);
  }
  accelerometerWeightedSum = vec3Add(accelerometerWeightedSum, weightedSample);
  if (accelerometerTotalWeight > 0) {
    accelerometerResolved = vec3Scale(accelerometerWeightedSum, 1 / accelerometerTotalWeight);
  }
}
function getCalibrationConfidence() {
  return Math.min(1, accelerometerSampleWindow.length / ACCELEROMETER_MAX_SAMPLE_COUNT);
}
const gravityCorrection = (gyro) => {
  if (isGravityAvailable()) {
    const orientationCorrection = getOrientationCorrection();
    return {
      x: gyro.x - orientationCorrection.x * GRAVITY_CORRECTION_STRENGTH,
      y: gyro.y - orientationCorrection.y * GRAVITY_CORRECTION_STRENGTH,
      z: gyro.z
    };
  }
  return gyro;
};
function accelerometerSmooth(accel, dt = 0.1, sampleFactor = 1) {
  const smoothFactor = Math.max(0.05, Math.min(dt * 1, ACCELEROMETER_SMOOTH, 1));
  accelerometerSmoothed = vec3Smooth(accelerometerSmoothed, accel, smoothFactor);
  addMonteCarloSample(accel, sampleFactor, accelerometerSmoothed);
  let linearAccel = accelerometerSmoothed;
  return linearAccel;
}
let lastMovement = vec3Zero();
const computeMovementDelta = (movement) => {
  const result = vec3Sub(movement, lastMovement);
  lastMovement = movement;
  return result;
};
let forSendingMovement = vec3Zero();
let sendWSMovement = (movement) => {
  forSendingMovement = vec3Add(forSendingMovement, movement);
  const mappedMovement = {
    x: forSendingMovement.x * accelDirX * ACCELEROMETER_GAIN,
    y: forSendingMovement.y * accelDirY * ACCELEROMETER_GAIN,
    z: forSendingMovement.z * accelDirZ * ACCELEROMETER_GAIN
  };
  forSendingMovement = vec3Zero();
  if (Math.abs(mappedMovement.x) < ACCELEROMETER_DEADZONE) mappedMovement.x = 0;
  if (Math.abs(mappedMovement.y) < ACCELEROMETER_DEADZONE) mappedMovement.y = 0;
  if (Math.abs(mappedMovement.z) < ACCELEROMETER_DEADZONE) mappedMovement.z = 0;
  if (mappedMovement.x === 0 && mappedMovement.y === 0 && mappedMovement.z === 0) return;
  enqueueMotion(mappedMovement.x, mappedMovement.y, mappedMovement.z);
};
const gravityBasedCorrection = (accel) => {
  if (isGravityAvailable() && getGravityMagnitude() > 0.1) {
    const gravity = getGravityVector();
    const gravityMagnitude = getGravityMagnitude();
    return {
      x: accel.x - gravity.x * gravityMagnitude,
      y: accel.y - gravity.y * gravityMagnitude,
      z: accel.z - gravity.z * gravityMagnitude
    };
  }
  return accel;
};
function initAccelerometer() {
  if (!("Accelerometer" in window)) {
    log("Accelerometer API is not supported.");
    return;
  }
  try {
    accelerometer = new window.Accelerometer({ frequency: 60 });
  } catch (err) {
    log("Cannot create Accelerometer: " + (err.message || err));
    return;
  }
  accelerometer.addEventListener("reading", () => {
    const now = performance.now();
    const dtMs = now - (lastTimestamp || now);
    const dt = dtMs / 1e3;
    lastTimestamp = now;
    averageRateSampled += dt;
    averageRateSampleCount++;
    averageRateResolved = averageRateSampled / averageRateSampleCount;
    const averageRateFactor = dt / averageRateResolved;
    const filteredAccel = accelerometerSmooth(vec3FromSensor(accelerometer), dt, averageRateFactor);
    const corrected = gravityBasedCorrection(filteredAccel);
    const delta = vec3DeadZone(computeMovementDelta(corrected), ACCELEROMETER_DEADZONE);
    if (vec3IsNearZero(filteredAccel)) {
      return;
    }
    if (getAirState() !== "AIR_MOVE") {
      return;
    }
    if (!isWSConnected()) return;
    if (aiModeActive) return;
    sendWSMovement(delta);
  });
  accelerometer.addEventListener("error", (event) => {
    log("Accelerometer error: " + (event?.error?.message || event?.message || event));
  });
  accelerometer.start();
  log("Accelerometer started (60 Hz)");
}

"use strict";
let airState = "IDLE";
let airDownTime = 0;
let airDownPos = null;
let airMoveTimer = null;
let dragActive = false;
let lastSwipePos = null;
let swipeDirection = null;
let baseGx = 0, baseGy = 0, baseGz = 0;
let motionCalibrated = false;
let filteredDx = 0;
let filteredDy = 0;
let lastMotionSentAt = 0;
let lastTapEndTime = 0;
let lastTapWasClean = false;
let pendingDragOnHold = false;
const DOUBLE_TAP_WINDOW = 300;
const DRAG_HOLD_DELAY = 150;
function getAirState() {
  return airState;
}
function isDragActive() {
  return dragActive;
}
function isMotionCalibrated() {
  return motionCalibrated;
}
function setMotionCalibrated(value) {
  motionCalibrated = value;
}
function getMotionBaseline() {
  return { baseGx, baseGy, baseGz };
}
function setMotionBaseline(gx, gy, gz) {
  baseGx = gx;
  baseGy = gy;
  baseGz = gz;
  motionCalibrated = true;
}
function resetMotionBaseline() {
  baseGx = baseGy = baseGz = 0;
  motionCalibrated = false;
  filteredDx = filteredDy = 0;
  lastMotionSentAt = 0;
}
function getFilteredMotion() {
  return { filteredDx, filteredDy };
}
function setFilteredMotion(dx, dy) {
  filteredDx = dx;
  filteredDy = dy;
}
function getLastMotionSentAt() {
  return lastMotionSentAt;
}
function setLastMotionSentAt(time) {
  lastMotionSentAt = time;
}
function setAirStatus(state) {
  airState = state;
  if (airStatusEl) {
    airStatusEl.textContent = state + (dragActive ? " [DRAG]" : "");
  }
  if (airButton) {
    airButton.classList.toggle("air-move", state === "AIR_MOVE");
    airButton.classList.toggle("active", state !== "IDLE");
    airButton.classList.toggle("drag-active", dragActive);
  }
}
function resetAirState() {
  const wasDragging = dragActive;
  setAirStatus("IDLE");
  airDownPos = null;
  lastSwipePos = null;
  swipeDirection = null;
  pendingDragOnHold = false;
  if (airMoveTimer !== null) {
    clearTimeout(airMoveTimer);
    airMoveTimer = null;
  }
  resetMotionBaseline();
}
function enterAirMove(startDrag = false) {
  setAirStatus("AIR_MOVE");
  resetMotionBaseline();
  onEnterAirMove$1();
  onEnterAirMove();
  if (startDrag && !dragActive) {
    dragActive = true;
    sendWS({ type: "mouse_down", button: "left" });
    log("Air: AIR_MOVE + DRAG started (mouse down)");
    setAirStatus("AIR_MOVE");
  } else {
    log("Air: AIR_MOVE started (cursor control via sensors)");
  }
}
function exitAirMove() {
  if (airState !== "AIR_MOVE") return;
  if (dragActive) {
    sendWS({ type: "mouse_up", button: "left" });
    log("Air: DRAG ended (mouse up)");
    dragActive = false;
  } else {
    log("Air: AIR_MOVE ended");
  }
}
function airOnDown(e) {
  connectWS();
  if (checkIsAiModeActive()) return;
  const now = Date.now();
  const timeSinceLastTap = now - lastTapEndTime;
  const shouldPrepareForDrag = lastTapWasClean && timeSinceLastTap < DOUBLE_TAP_WINDOW;
  if (shouldPrepareForDrag) {
    pendingDragOnHold = true;
    log(`Air: double-tap detected (${timeSinceLastTap}ms since last tap), preparing for drag...`);
  } else {
    pendingDragOnHold = false;
  }
  lastTapWasClean = false;
  if (airMoveTimer !== null) {
    clearTimeout(airMoveTimer);
    airMoveTimer = null;
  }
  airDownTime = now;
  airDownPos = { x: e.clientX, y: e.clientY };
  setAirStatus("WAIT_TAP_OR_HOLD");
  const holdDelay = pendingDragOnHold ? DRAG_HOLD_DELAY : HOLD_DELAY;
  airMoveTimer = globalThis?.setTimeout?.(() => {
    if (airState === "WAIT_TAP_OR_HOLD") {
      enterAirMove(pendingDragOnHold);
    }
  }, holdDelay);
}
function airOnUp(e) {
  if (checkIsAiModeActive()) {
    resetAirState();
    return;
  }
  const now = Date.now();
  const dt = now - airDownTime;
  let wasCleanTap = false;
  if (airState === "AIR_MOVE") {
    exitAirMove();
  }
  if (airState === "GESTURE_SWIPE") {
    log("Air: swipe gesture ended");
  }
  if (airState === "WAIT_TAP_OR_HOLD") {
    if (airDownPos && dt < TAP_THRESHOLD) {
      const clientX = e ? e.clientX : airDownPos.x;
      const clientY = e ? e.clientY : airDownPos.y;
      const dx = clientX - airDownPos.x;
      const dy = clientY - airDownPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MOVE_TAP_THRESHOLD) {
        wasCleanTap = true;
        if (!pendingDragOnHold) {
          sendWS({ type: "click", button: "left" });
          log("Air: tap → click");
        } else {
          sendWS({ type: "click", button: "left", count: 2 });
          log("Air: tap-tap → double-click");
          wasCleanTap = false;
        }
      }
    }
  }
  lastTapEndTime = now;
  lastTapWasClean = wasCleanTap;
  if (wasCleanTap) {
    log(`Air: clean tap recorded, next tap+hold within ${DOUBLE_TAP_WINDOW}ms will start drag`);
  }
  dragActive = false;
  resetAirState();
}
function handleAirSurfaceMove(x, y) {
  if (!airDownPos) return;
  const dxSurf = x - airDownPos.x;
  const dySurf = y - airDownPos.y;
  if (airState === "WAIT_TAP_OR_HOLD") {
    const dist = Math.hypot(dxSurf, dySurf);
    if (dist > SWIPE_THRESHOLD) {
      if (airMoveTimer !== null) {
        clearTimeout(airMoveTimer);
        airMoveTimer = null;
      }
      pendingDragOnHold = false;
      lastTapWasClean = false;
      setAirStatus("GESTURE_SWIPE");
      startSwipeGesture(dxSurf, dySurf);
    }
  } else if (airState === "GESTURE_SWIPE") {
    continueSwipeGesture(x, y);
  }
}
function startSwipeGesture(dxSurf, dySurf) {
  const absX = Math.abs(dxSurf);
  const absY = Math.abs(dySurf);
  if (absY > absX) {
    swipeDirection = "vertical";
    lastSwipePos = { x: airDownPos.x, y: airDownPos.y };
    const initialDelta = Math.round(dySurf * 0.8);
    sendWS({ type: "scroll", dx: 0, dy: initialDelta });
    log(`Air: swipe ${dySurf > 0 ? "down" : "up"} → scroll`);
  } else {
    swipeDirection = "horizontal";
    const direction = dxSurf > 0 ? "right" : "left";
    log(`Air: swipe ${direction}`);
    sendWS({ type: "gesture_swipe", direction });
    resetAirState();
  }
}
function continueSwipeGesture(x, y) {
  if (!lastSwipePos || !airDownPos || swipeDirection !== "vertical") return;
  const dy = y - lastSwipePos.y;
  if (Math.abs(dy) > 2) {
    const delta = Math.round(dy * 0.8);
    sendWS({ type: "scroll", dx: 0, dy: delta });
    lastSwipePos = { x, y };
  }
}
let neighborState = "IDLE";
let neighborDownTime = 0;
let neighborDownPos = null;
let neighborHoldTimer = null;
let neighborPointerId = null;
const NEIGHBOR_HOLD_DELAY = 250;
const NEIGHBOR_TAP_THRESHOLD = 200;
const NEIGHBOR_MOVE_THRESHOLD = 15;
function enterMiddleScrollMode() {
  neighborState = "MIDDLE_SCROLL";
  resetAirState();
  sendWS({ type: "mouse_down", button: "middle" });
  log("Neighbor: MIDDLE_SCROLL started (sensors active)");
  const neighborButton = document.getElementById("airNeighborButton");
  neighborButton?.classList.add("middle-scroll-active", "active");
  enterAirMove();
}
function exitMiddleScrollMode() {
  if (neighborState !== "MIDDLE_SCROLL") return;
  sendWS({ type: "mouse_up", button: "middle" });
  log("Neighbor: MIDDLE_SCROLL ended");
  neighborState = "IDLE";
  resetAirState();
  const neighborButton = document.getElementById("airNeighborButton");
  neighborButton?.classList.remove("middle-scroll-active", "active");
}
function resetNeighborState() {
  if (neighborHoldTimer !== null) {
    clearTimeout(neighborHoldTimer);
    neighborHoldTimer = null;
  }
  neighborDownPos = null;
  neighborState = "IDLE";
  const neighborButton = document.getElementById("airNeighborButton");
  neighborButton?.classList.remove("middle-scroll-active", "active");
  resetAirState();
}
function initNeighborButton() {
  const neighborButton = document.getElementById("airNeighborButton");
  if (!neighborButton) return;
  neighborButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (neighborPointerId !== null && neighborPointerId !== e.pointerId) return;
    connectWS();
    if (checkIsAiModeActive()) return;
    neighborPointerId = e.pointerId;
    neighborButton.setPointerCapture(neighborPointerId);
    neighborDownTime = Date.now();
    neighborDownPos = { x: e.clientX, y: e.clientY };
    neighborState = "WAIT_TAP_OR_HOLD";
    neighborButton.classList.add("active");
    neighborHoldTimer = globalThis?.setTimeout?.(() => {
      neighborHoldTimer = null;
      if (neighborState === "WAIT_TAP_OR_HOLD") {
        enterMiddleScrollMode();
      }
    }, NEIGHBOR_HOLD_DELAY);
  });
  neighborButton.addEventListener("pointermove", (e) => {
    if (e.pointerId !== neighborPointerId || !neighborDownPos) return;
    e.preventDefault();
    if (neighborState === "WAIT_TAP_OR_HOLD") {
      const dx = e.clientX - neighborDownPos.x;
      const dy = e.clientY - neighborDownPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > NEIGHBOR_MOVE_THRESHOLD) {
        if (neighborHoldTimer !== null) {
          clearTimeout(neighborHoldTimer);
          neighborHoldTimer = null;
        }
      }
    }
  });
  neighborButton.addEventListener("pointerup", (e) => {
    if (e.pointerId !== neighborPointerId) return;
    e.preventDefault();
    const dt = Date.now() - neighborDownTime;
    if (neighborState === "MIDDLE_SCROLL") {
      exitMiddleScrollMode();
    } else if (neighborState === "WAIT_TAP_OR_HOLD" && dt < NEIGHBOR_TAP_THRESHOLD) {
      if (neighborDownPos) {
        const dx = e.clientX - neighborDownPos.x;
        const dy = e.clientY - neighborDownPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < NEIGHBOR_MOVE_THRESHOLD) {
          sendWS({ type: "click", button: "right" });
          log("Neighbor: tap → right-click (context menu)");
        }
      }
    }
    if (neighborPointerId !== null) {
      neighborButton.releasePointerCapture(neighborPointerId);
      neighborPointerId = null;
    }
    resetNeighborState();
  });
  neighborButton.addEventListener("pointercancel", (e) => {
    if (e?.pointerId === neighborPointerId || e?.pointerId == null) {
      if (neighborState === "MIDDLE_SCROLL") {
        sendWS({ type: "mouse_up", button: "middle" });
        log("Neighbor: middle-scroll cancelled");
      }
      if (neighborPointerId !== null) {
        neighborButton.releasePointerCapture(neighborPointerId);
        neighborPointerId = null;
      }
      resetNeighborState();
    }
  });
  neighborButton.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  log("Neighbor button initialized (tap: right-click, hold: middle-scroll via sensors)");
}
function isMiddleScrollActive() {
  return neighborState === "MIDDLE_SCROLL";
}
function initAirButton() {
  if (!airButton) return;
  initNeighborButton();
  let pointerId = null;
  airButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (pointerId !== null && pointerId !== e.pointerId) return;
    pointerId = e.pointerId;
    airButton?.setPointerCapture(pointerId);
    airOnDown(e);
  });
  document.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    e.preventDefault();
    if (!airDownPos) return;
    if (checkIsAiModeActive()) return;
    handleAirSurfaceMove(e.clientX, e.clientY);
  });
  document.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointerId) return;
    e.preventDefault();
    if (pointerId !== null) {
      airButton?.releasePointerCapture(pointerId);
    }
    pointerId = null;
    airOnUp(e);
  });
  document.addEventListener("pointercancel", (e) => {
    if (e?.pointerId === pointerId || e?.pointerId == null) {
      if (pointerId !== null) {
        airButton?.releasePointerCapture(pointerId);
      }
      pointerId = null;
      if (dragActive) {
        sendWS({ type: "mouse_up", button: "left" });
        dragActive = false;
        log("Air: drag cancelled (mouse up)");
      }
      resetAirState();
    }
  });
  log("Air button initialized");
}

"use strict";
let relSensor = null;
let lastQuat = null;
let smoothedDelta = vec3Zero();
let dynamicMaxStepPx = REL_ORIENT_MAX_STEP;
const quatNormalizeStable = (q, prev) => {
  const [x, y, z, w] = q;
  const len = Math.hypot(x, y, z, w) || 1;
  let nx = x / len, ny = y / len, nz = z / len, nw = w / len;
  if (prev) {
    const dot = nx * prev[0] + ny * prev[1] + nz * prev[2] + nw * prev[3];
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
      nw = -nw;
    }
  }
  return [nx, ny, nz, nw];
};
const quatConj = (q) => {
  const [x, y, z, w] = q;
  return [-x, -y, -z, w];
};
const quatMul = (a, b) => {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz
  ];
};
const quatDeltaToAxisAngle = (dq) => {
  const [x, y, z, w] = dq;
  const sinHalf = Math.hypot(x, y, z);
  const angle = 2 * Math.atan2(sinHalf, w || 1);
  if (sinHalf < 1e-6) {
    return { x: 0, y: 0, z: 0 };
  }
  const inv = 1 / sinHalf;
  return { x: x * inv * angle, y: y * inv * angle, z: z * inv * angle };
};
function mapToPixelsRaw(movement) {
  const selected = vec3Select(
    movement,
    relSrcForMouseX,
    relSrcForMouseY,
    relSrcForMouseZ
  );
  const rotationZ = selected.z * relDirZ;
  const projected = vec3RotateXYByAngle(selected, rotationZ, 1);
  return {
    x: projected.x * relDirX * REL_ORIENT_GAIN,
    y: projected.y * relDirY * REL_ORIENT_GAIN,
    z: projected.z * relDirZ * REL_ORIENT_GAIN
  };
}
function clampPxRadiusFromDeltaVec(deltaVec, dt) {
  const rawMapped = mapToPixelsRaw(deltaVec);
  const magPx = Math.hypot(rawMapped.x, rawMapped.y, rawMapped.z);
  const desired = Math.max(REL_ORIENT_MAX_STEP, Math.min(REL_ORIENT_MAX_STEP_MAX, magPx));
  const t = desired > dynamicMaxStepPx ? expSmoothing(dt, REL_ORIENT_MAX_STEP_UP_RATE) : expSmoothing(dt, REL_ORIENT_MAX_STEP_DOWN_RATE);
  dynamicMaxStepPx = lerp(dynamicMaxStepPx, desired, t);
  if (!Number.isFinite(dynamicMaxStepPx)) dynamicMaxStepPx = REL_ORIENT_MAX_STEP;
  dynamicMaxStepPx = Math.max(REL_ORIENT_MAX_STEP, Math.min(REL_ORIENT_MAX_STEP_MAX, dynamicMaxStepPx));
  return dynamicMaxStepPx;
}
function mapAndScale(movement, maxStepPx) {
  const mapped = mapToPixelsRaw(movement);
  return vec3Clamp(mapped, maxStepPx);
}
function handleReading(quat, dt) {
  if (!quat || quat.length < 4) return vec3Zero();
  const curQuat = quatNormalizeStable([quat[0], quat[1], quat[2], quat[3]], lastQuat);
  if (!lastQuat) {
    lastQuat = curQuat;
  }
  ;
  const deltaQuat = quatMul(curQuat, quatConj(lastQuat));
  lastQuat = curQuat;
  const deltaVec = quatDeltaToAxisAngle(deltaQuat);
  const maxStepPx = clampPxRadiusFromDeltaVec(deltaVec, dt);
  const deltaPx = mapToPixelsRaw(deltaVec);
  const deltaMagPx = Math.hypot(deltaPx.x, deltaPx.y, deltaPx.z);
  const magT = clamp01((deltaMagPx - REL_ORIENT_MAX_STEP) / Math.max(1, REL_ORIENT_MAX_STEP_MAX - REL_ORIENT_MAX_STEP));
  const smoothRate = lerp(REL_ORIENT_SMOOTH_RATE_LOW, REL_ORIENT_SMOOTH_RATE_HIGH, magT);
  const smoothFactor = clamp01(expSmoothing(dt, smoothRate) * clamp01(REL_ORIENT_SMOOTH));
  smoothedDelta = vec3Smooth(smoothedDelta, deltaVec, smoothFactor * 0.9);
  const maxStepRad = maxStepPx / Math.max(1e-6, Math.abs(REL_ORIENT_GAIN));
  smoothedDelta = vec3Clamp(smoothedDelta, Math.max(REL_ORIENT_DEADZONE, maxStepRad));
  const dz = {
    x: Math.abs(smoothedDelta.x) < REL_ORIENT_DEADZONE ? 0 : smoothedDelta.x,
    y: Math.abs(smoothedDelta.y) < REL_ORIENT_DEADZONE ? 0 : smoothedDelta.y,
    z: Math.abs(smoothedDelta.z) < REL_ORIENT_DEADZONE ? 0 : smoothedDelta.z
  };
  if (Math.abs(dz.x) < MOTION_JITTER_EPS && Math.abs(dz.y) < MOTION_JITTER_EPS && Math.abs(dz.z) < MOTION_JITTER_EPS) {
    return vec3Zero();
  }
  const mapped = mapAndScale(dz, maxStepPx);
  if (vec3IsNearZero(mapped, MOTION_JITTER_EPS)) return vec3Zero();
  return mapped;
}
function initRelativeOrientation() {
  if (!window.RelativeOrientationSensor) {
    log("RelativeOrientationSensor API is not supported.");
    return;
  }
  try {
    relSensor = new window.RelativeOrientationSensor({ frequency: 120, referenceFrame: "device" });
  } catch (err) {
    log("Cannot create RelativeOrientationSensor: " + (err?.message || err));
    relSensor = null;
    return;
  }
  let lastTs = performance.now();
  relSensor.addEventListener("reading", () => {
    const now = performance.now();
    const dt = Math.max(1e-5, (now - lastTs) / 1e3);
    lastTs = now;
    const mapped = handleReading(relSensor.quaternion, dt);
    if (getAirState && getAirState() !== "AIR_MOVE") return;
    if (!isWSConnected()) return;
    if (aiModeActive) return;
    enqueueMotion(mapped.x, mapped.y, mapped.z);
  });
  relSensor.addEventListener("error", (event) => {
    log("RelativeOrientationSensor error: " + (event?.error?.message || event?.message || event));
  });
  try {
    relSensor.start();
    log("RelativeOrientationSensor started (120 Hz)");
  } catch (err) {
    log("RelativeOrientationSensor start failed: " + (err?.message || err));
  }
}

"use strict";
function setPreview(text, meta) {
  if (!clipboardPreviewEl || typeof clipboardPreviewEl === "undefined") return;
  const source = meta?.source ? String(meta.source) : "pc";
  const safeText = String(text ?? "");
  if (!safeText) {
    clipboardPreviewEl.classList.remove("visible");
    clipboardPreviewEl.innerHTML = "";
    return;
  }
  clipboardPreviewEl.innerHTML = `
        <div class="meta">Clipboard (${source})</div>
        <div class="text"></div>
    `;
  const textEl = clipboardPreviewEl.querySelector(".text");
  if (textEl) textEl.textContent = safeText;
  clipboardPreviewEl.classList.add("visible");
}
async function readPhoneClipboardText() {
  const nav = navigator;
  if (nav?.clipboard?.readText) {
    return await nav.clipboard.readText();
  }
  return globalThis?.prompt?.("Вставь текст из телефона (clipboard readText недоступен):", "") || "";
}
async function tryWritePhoneClipboardText(text) {
  const nav = navigator;
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
function initClipboardToolbar() {
  onServerClipboardUpdate((text, meta) => setPreview(text, meta));
  requestClipboardGet().then((res) => {
    if (res?.ok && typeof res.text === "string") setPreview(res.text, { source: "pc" });
  });
  btnCopy?.addEventListener("click", async () => {
    const res = await requestClipboardCopy();
    if (!res?.ok) {
      log("Copy failed: " + (res?.error || "unknown"));
      return;
    }
    const text = String(res.text || "");
    setPreview(text, { source: "pc" });
    const ok = await tryWritePhoneClipboardText(text);
    if (!ok) {
      log("PC clipboard received. If phone clipboard write is blocked, copy from the preview line.");
    }
  });
  btnCut?.addEventListener("click", async () => {
    const res = await requestClipboardCut();
    if (!res?.ok) {
      log("Cut failed: " + (res?.error || "unknown"));
      return;
    }
    const text = String(res.text || "");
    setPreview(text, { source: "pc" });
    const ok = await tryWritePhoneClipboardText(text);
    if (!ok) {
      log("PC clipboard received (after cut). If phone clipboard write is blocked, copy from the preview line.");
    }
  });
  btnPaste?.addEventListener("click", async () => {
    const text = await readPhoneClipboardText();
    if (!text) {
      log("Paste: phone clipboard is empty (or permission denied).");
      return;
    }
    const res = await requestClipboardPaste(text);
    if (!res?.ok) {
      log("Paste failed: " + (res?.error || "unknown"));
      return;
    }
    setPreview(text, { source: "phone" });
  });
}

"use strict";
function getAirpadHostElement() {
  return document.querySelector(".view-airpad") ?? document.querySelector("#app") ?? document.body;
}
function createConfigUI() {
  const overlay = document.createElement("div");
  overlay.className = "config-overlay";
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

            <div class="config-actions">
                <button id="saveConfig" type="button">Save & Reconnect</button>
                <button id="cancelConfig" type="button">Cancel</button>
            </div>
        </div>
    `;
  const hostInput = overlay.querySelector("#remoteHost");
  const portInput = overlay.querySelector("#remotePort");
  const protocolInput = overlay.querySelector("#remoteProtocol");
  const saveButton = overlay.querySelector("#saveConfig");
  const cancelButton = overlay.querySelector("#cancelConfig");
  hostInput.value = getRemoteHost();
  portInput.value = getRemotePort();
  protocolInput.value = getRemoteProtocol();
  saveButton.addEventListener("click", () => {
    setRemoteHost(hostInput.value);
    setRemotePort(portInput.value);
    setRemoteProtocol(protocolInput.value);
    if (isWSConnected()) {
      disconnectWS();
    }
    setTimeout(() => connectWS(), 100);
    overlay.style.display = "none";
  });
  cancelButton.addEventListener("click", () => {
    overlay.style.display = "none";
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
    }
  });
  return overlay;
}
function showConfigUI() {
  hideKeyboard();
  const host = getAirpadHostElement();
  let overlay = document.querySelector(".config-overlay");
  if (overlay && overlay.parentElement !== host) {
    overlay.remove();
    overlay = null;
  }
  if (!overlay) {
    overlay = createConfigUI();
    host.appendChild(overlay);
  } else {
    const hostInput = overlay.querySelector("#remoteHost");
    const portInput = overlay.querySelector("#remotePort");
    const protocolInput = overlay.querySelector("#remoteProtocol");
    if (hostInput) hostInput.value = getRemoteHost();
    if (portInput) portInput.value = getRemotePort();
    if (protocolInput) protocolInput.value = getRemoteProtocol();
  }
  overlay.style.display = "flex";
}

"use strict";
let unsubscribeWsKeyboardSync = null;
async function mountAirpad(mountElement) {
  console.log("[Airpad] Mounting airpad app...");
  loadAsAdopted(stylesheet);
  let appContainer = mountElement ?? document.body.querySelector("#app") ?? document.body;
  if (!appContainer) {
    appContainer = document.createElement("div");
    appContainer.id = "app";
  }
  appContainer.replaceChildren(H`
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
                        WS Connect
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

            <section class="hint" id="hintPanel" aria-label="Airpad quick help">
                <details class="hint-group" data-hint-group open>
                    <summary>Жесты Air-кнопки</summary>
                    <ul>
                        <li>Короткий тап — клик.</li>
                        <li>Удержание &gt; 100ms — режим air-мыши.</li>
                        <li>Свайп вверх/вниз по кнопке — скролл.</li>
                        <li>Свайп влево/вправо — жест.</li>
                    </ul>
                </details>

                <details class="hint-group" data-hint-group open>
                    <summary>AI-кнопка</summary>
                    <ul>
                        <li>Нажми и держи — идёт распознавание речи.</li>
                        <li>Отпусти — команда уйдёт как <code>voice_command</code>.</li>
                    </ul>
                </details>

                <details class="hint-group" data-hint-group open>
                    <summary>Виртуальная клавиатура</summary>
                    <ul>
                        <li>Открой кнопкой ⌨️ справа внизу.</li>
                        <li>Поддерживает текст, эмодзи и спецсимволы.</li>
                        <li>Передаёт ввод в бинарном формате.</li>
                    </ul>
                </details>
            </section>
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
  await initAirpadApp();
}
async function initAirpadApp() {
  function initConfigButton() {
    const existingConfigButton = document.getElementById("btnConfig");
    if (existingConfigButton) {
      return;
    }
    const configButton = document.createElement("button");
    configButton.id = "btnConfig";
    configButton.type = "button";
    configButton.className = "toolbar-btn";
    configButton.textContent = "⚙️";
    configButton.title = "Configuration";
    configButton.setAttribute("aria-label", "Configuration");
    configButton.addEventListener("click", showConfigUI);
    const bottomToolbar = document.querySelector(".bottom-toolbar");
    if (bottomToolbar) {
      bottomToolbar.appendChild(configButton);
    }
  }
  function initLogOverlay() {
    const overlay = document.getElementById("logOverlay");
    const toggle = document.getElementById("logToggle");
    const close = document.getElementById("logClose");
    if (!overlay || !toggle) {
      return;
    }
    const openOverlay = () => {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
    };
    const closeOverlay = () => {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", openOverlay);
    close?.addEventListener("click", closeOverlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeOverlay();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        closeOverlay();
      }
    });
  }
  function initAdaptiveHintPanel() {
    const hintRoot = document.getElementById("hintPanel");
    if (!hintRoot) return;
    const groups = Array.from(hintRoot.querySelectorAll("[data-hint-group]"));
    if (groups.length === 0) return;
    const compactMedia = globalThis.matchMedia("(max-width: 980px), (max-height: 860px)");
    const applyHintDensity = () => {
      const compact = compactMedia.matches;
      groups.forEach((group, index) => {
        group.open = compact ? index === 0 : true;
      });
    };
    applyHintDensity();
    compactMedia.addEventListener?.("change", applyHintDensity);
  }
  const scheduleIdle = (cb) => {
    if (typeof globalThis.requestIdleCallback === "function") {
      globalThis.requestIdleCallback(() => cb());
      return;
    }
    globalThis.setTimeout(cb, 0);
  };
  scheduleIdle(async () => {
    try {
      initServiceWorker({
        immediate: true,
        onRegistered() {
          log("PWA: service worker registered");
        },
        onRegisterError(error) {
          log("PWA: service worker register error: " + (error?.message ?? String(error)));
        }
      });
    } catch (err) {
      log("PWA: service worker disabled: " + (err?.message || err));
    }
    log('Готово. Нажми "WS Connect", затем используй Air/AI кнопки.');
    log("Движение мыши основано только на Gyroscope API (повороты телефона).");
    initLogOverlay();
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
    initRelativeOrientation();
  });
}

export { mountAirpad as default };
//# sourceMappingURL=main.js.map
