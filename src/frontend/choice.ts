import { H } from "fest/lure";
import "./choice.scss";

// PWA clipboard and service worker communication
import { initPWAClipboard } from "./shared/pwa-copy";
import { showToast } from "./shared/Toast";

let _receiversCleanup: (() => void) | null = null;

const initReceivers = () => {
    if (_receiversCleanup) return;
    _receiversCleanup = initPWAClipboard();
};

// Simple share target processing (like CRX extension)
const processShareTargetData = async (shareData: any) => {
    console.log("[ShareTarget] Processing shared data:", shareData);

    try {
        showToast({ message: "Processing shared content...", kind: "info" });

        // Import AI functions dynamically to avoid loading them on every page
        const { recognizeByInstructions } = await import("@rs-core/service/AI-ops/RecognizeData");
        const { getUsableData } = await import("@rs-core/service/model/GPT-Responses");

        // Prepare input data (similar to CRX content script processing)
        let inputData;
        if (shareData.files?.length > 0) {
            // Handle files (images, documents)
            inputData = shareData.files[0]; // Process first file
        } else if (shareData.url) {
            // Handle URLs
            inputData = shareData.url;
        } else if (shareData.text) {
            // Handle text
            inputData = shareData.text;
        } else {
            throw new Error("No content to process");
        }

        // Convert to usable format
        const usableData = await getUsableData({ dataSource: inputData });

        const input = [{
            type: "message",
            role: "user",
            content: [usableData]
        }];

        // Process with AI (using default image/text recognition instructions)
        const result = await recognizeByInstructions(input, "", undefined, undefined, { useActiveInstruction: true });

        if (result?.ok && result?.data) {
            // Copy result to clipboard (like CRX extension does)
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(String(result.data));
                showToast({ message: "Content processed and copied to clipboard!", kind: "success" });
            } else {
                showToast({ message: "Content processed successfully!", kind: "success" });
            }
        } else {
            showToast({ message: `Processing failed: ${result?.error || "Unknown error"}`, kind: "error" });
        }
    } catch (error) {
        console.error("[ShareTarget] Processing error:", error);
        showToast({ message: `Failed to process content: ${error}`, kind: "error" });
    }
};

// Handle share target data from service worker
const handleShareTarget = () => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("shared");

    if (shared === "1") {
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete("shared");
        url.searchParams.delete("action");
        window.history.replaceState({}, "", url.pathname + url.hash);

        // Retrieve share data from cache and process it
        caches.open("share-target-data")
            .then(cache => cache.match("/share-target-data"))
            .then(response => response?.json())
            .then(async (data) => {
                if (data) {
                    console.log("[ShareTarget] Retrieved cached data:", data);
                    await processShareTargetData(data);
                }
            })
            .catch(e => console.warn("[ShareTarget] Failed to retrieve data:", e));
    }

    // Listen for real-time share target broadcasts (like CRX extension)
    if (typeof BroadcastChannel !== "undefined") {
        const shareChannel = new BroadcastChannel("rs-share-target");
        shareChannel.addEventListener("message", async (event) => {
            if (event.data?.type === "share-received" && event.data?.data) {
                console.log("[ShareTarget] Broadcast received:", event.data.data);
                await processShareTargetData(event.data.data);
            }
        });
    }
};

export type FrontendChoice = "basic" | "faint";

const CHOICE_KEY = "rs-frontend-choice";
const REMEMBER_KEY = "rs-frontend-choice-remember";

const isExtension = () => {
    try {
        return window.location.protocol === "chrome-extension:" || Boolean((chrome as any)?.runtime?.id);
    } catch {
        return false;
    }
};

const isPwaDisplayMode = () => {
    if (!isExtension()) return true;
    return false;
    /*try {
      const standalone = (navigator as any)?.standalone === true;
      const mm = window.matchMedia?.("(display-mode: standalone)")?.matches || window.matchMedia?.("(display-mode: fullscreen)")?.matches;
      return Boolean(standalone || mm);
    } catch {
      return false;
    }*/
};

const loadChoice = (): FrontendChoice | null => {
    try {
        const v = localStorage.getItem(CHOICE_KEY);
        return v === "basic" || v === "faint" ? v : null;
    } catch {
        return null;
    }
};

const loadRemember = (): boolean => {
    try {
        return localStorage.getItem(REMEMBER_KEY) === "1";
    } catch {
        return false;
    }
};

const saveChoice = (choice: FrontendChoice, remember: boolean) => {
    try {
        localStorage.setItem(CHOICE_KEY, choice);
        localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    } catch {
        // ignore
    }
};

const loadSubApp = async (choice: FrontendChoice) => {
    console.log('[Frontend] Loading sub-app:', choice);
    try {
        if (choice === "faint") {
            console.log('[Frontend] Importing faint app...');
            const mod = await import("./faint/layout/Views");
            console.log('[Frontend] Faint app imported successfully');
            return (mod as any).default as (mount: HTMLElement) => unknown;
        }

        console.log('[Frontend] Importing basic app...');
        const mod = await import("./basic");
        console.log('[Frontend] Basic app imported successfully');
        return (mod as any).default as (mount: HTMLElement) => unknown;
    } catch (error) {
        console.error('[Frontend] Failed to load sub-app:', choice, error);
        throw error;
    }
};

export const ChoiceScreen = (opts: {
    seconds: number;
    defaultChoice: FrontendChoice;
    onChoose: (choice: FrontendChoice, remember: boolean) => void;
    initialRemember?: boolean;
}) => {
    const headerText = H`<header class="choice-header">Boot menu</header>` as HTMLElement;
    const reasonsText = H`<div class="choice-reasons">Currently, I'm not able to actively support the complex <b>Faint</b> project. The <b>Basic</b> version is the default.</div>` as HTMLElement;

    const countdown = H`<div class="choice-countdown">Auto-start in <b>${opts.seconds}</b>s…</div>` as HTMLElement;
    const hint = H`<div class="choice-hint">Use <b>↑</b>/<b>↓</b> to select, <b>Enter</b> to boot.</div>` as HTMLElement;
    const remember = H`<label class="choice-remember">
    <input type="checkbox" />
    <span>Remember my choice</span>
  </label>` as HTMLElement;
    const rememberInput = remember.querySelector("input") as HTMLInputElement | null;
    if (rememberInput) rememberInput.checked = Boolean(opts.initialRemember);

    const bigBasicButton = H`<button class="basic big recommended" type="button">Basic</button>` as HTMLButtonElement;
    const unstableFaint = H`<button class="unstable small faint" type="button">Faint OS (unstable)</button>` as HTMLButtonElement;

    bigBasicButton.addEventListener("click", () => opts.onChoose("basic", Boolean(rememberInput?.checked)));
    unstableFaint.addEventListener("click", () => opts.onChoose("faint", Boolean(rememberInput?.checked)));

    const container = H`<div class="choice container"></div>` as HTMLElement;

    const menu = H`<div class="choice-menu" role="menu"></div>` as HTMLElement;
    menu.append(bigBasicButton, unstableFaint);

    // Minimal boot-menu keyboard navigation (↑/↓ + Enter)
    const options = [bigBasicButton, unstableFaint];
    let idx = 0;
    const focusAt = (nextIdx: number) => {
        const len = options.length;
        if (!len) return;
        idx = ((nextIdx % len) + len) % len;
        options[idx]?.focus?.();
    };
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            focusAt(idx + 1);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            focusAt(idx - 1);
            return;
        }
        if (e.key === "Enter") {
            const el = document.activeElement as HTMLElement | null;
            const btn = el?.closest?.("button") as HTMLButtonElement | null;
            btn?.click?.();
        }
    });

    container.append(headerText, countdown, hint, menu, remember, reasonsText);

    queueMicrotask(() => focusAt(0));
    return { container, countdownEl: countdown };
};

export default async function frontend(mountElement: HTMLElement) {
    console.log('[Frontend] Starting CrossWord frontend loader');

    // Ensure CSS is loaded for frontend (only if not extension)
    if (!isExtension()) {
        console.log('[Frontend] Loading CSS...');
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = new URL("../assets/crossword.css", import.meta.url).toString();
        document.head.append(link);
        console.log('[Frontend] CSS loaded');
    }

    // Initialize broadcast receivers for service worker communication
    console.log('[Frontend] Initializing broadcast receivers...');
    initReceivers();
    console.log('[Frontend] Broadcast receivers ready');

    // Handle share target data if coming from PWA share
    console.log('[Frontend] Setting up share target handling...');
    handleShareTarget();
    console.log('[Frontend] Share target handling ready');

    const defaultChoice: FrontendChoice = "basic";

    try {
        const hash = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
        console.log('[Frontend] URL hash:', hash);

        if (hash === "basic") {
            console.log('[Frontend] Loading basic app from hash');
            const run = await loadSubApp("basic");
            run?.(mountElement);
            console.log('[Frontend] Basic app loaded');
            return;
        }
        if (hash === "faint") {
            console.log('[Frontend] Loading faint app from hash');
            const run = await loadSubApp("faint");
            run?.(mountElement);
            console.log('[Frontend] Faint app loaded');
            return;
        }

        const isExt = isExtension();
        console.log('[Frontend] Is extension:', isExt);

        if (isExt) {
            console.log('[Frontend] Loading default app for extension');
            const run = await loadSubApp(defaultChoice);
            run?.(mountElement);
            console.log('[Frontend] Extension app loaded');
            return;
        }

        const pwa = isPwaDisplayMode();
        const remembered = loadRemember();
        const stored = loadChoice();

        console.log('[Frontend] PWA mode:', pwa, 'Remembered:', remembered, 'Stored choice:', stored);

        if (pwa && remembered && stored) {
            console.log('[Frontend] Loading remembered app:', stored);
            const run = await loadSubApp(stored);
            run?.(mountElement);
            console.log('[Frontend] Remembered app loaded');
            return;
        }

        if (!pwa) {
            console.log('[Frontend] Loading default app (non-PWA)');
            const run = await loadSubApp(defaultChoice);
            run?.(mountElement);
            console.log('[Frontend] Default app loaded');
            return;
        }

        console.log('[Frontend] Showing choice screen');
        mountElement.replaceChildren();

        let done = false;
        let seconds = 10;
        const { container, countdownEl } = ChoiceScreen({
            seconds,
            defaultChoice,
            initialRemember: remembered,
            onChoose: async (choice, remember) => {
                if (done) return;
                console.log('[Frontend] User chose:', choice, 'remember:', remember);
                done = true;
                clearInterval(timer);
                if (remember) saveChoice(choice, true);
                else saveChoice(choice, false);
                mountElement.replaceChildren();
                try {
                    const run = await loadSubApp(choice);
                    run?.(mountElement);
                    console.log('[Frontend] Chosen app loaded');
                } catch (error) {
                    console.error('[Frontend] Failed to load chosen app:', error);
                }
            },
        });

        const timer = window.setInterval(() => {
            if (done) return;
            seconds -= 1;
            const b = countdownEl.querySelector("b");
            if (b) b.textContent = String(Math.max(0, seconds));
            if (seconds <= 0) {
                console.log('[Frontend] Auto-starting default app');
                done = true;
                clearInterval(timer);
                void (async () => {
                    mountElement.replaceChildren();
                    try {
                        const run = await loadSubApp(defaultChoice);
                        run?.(mountElement);
                        console.log('[Frontend] Default app auto-loaded');
                    } catch (error) {
                        console.error('[Frontend] Failed to auto-load default app:', error);
                    }
                })();
            }
        }, 1000);

        mountElement.append(container);
        console.log('[Frontend] Choice screen displayed');

    } catch (error) {
        console.error('[Frontend] Frontend loader failed:', error);

        // Fallback: try to load basic app
        try {
            console.log('[Frontend] Attempting fallback to basic app');
            const run = await loadSubApp("basic");
            run?.(mountElement);
            console.log('[Frontend] Fallback app loaded');
        } catch (fallbackError) {
            console.error('[Frontend] Fallback also failed:', fallbackError);
            // Last resort: show error message
            mountElement.innerHTML = `
                <div style="padding: 20px; text-align: center; font-family: monospace;">
                    <h2>🚫 Frontend Failed</h2>
                    <p>Check console for details</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error}\n\n${fallbackError}</pre>
                    </details>
                </div>
            `;
        }
    }
}

export { frontend };
