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

        // Retrieve share data from cache
        caches.open("share-target-data")
            .then(cache => cache.match("/share-target-data"))
            .then(response => response?.json())
            .then(data => {
                if (data) {
                    console.log("[ShareTarget] Received data:", data);
                    showToast({ message: "Content received!", kind: "success", duration: 2000 });
                }
            })
            .catch(e => console.warn("[ShareTarget] Failed to retrieve data:", e));
    }

    // Listen for real-time share target broadcasts
    if (typeof BroadcastChannel !== "undefined") {
        const shareChannel = new BroadcastChannel("rs-share-target");
        shareChannel.addEventListener("message", (event) => {
            if (event.data?.type === "share-received" && event.data?.data) {
                console.log("[ShareTarget] Broadcast received:", event.data.data);
                showToast({ message: "Content shared!", kind: "success", duration: 2000 });
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
  if (choice === "faint") {
    const mod = await import("./faint/layout/Views");
    return (mod as any).default as (mount: HTMLElement) => unknown;
  }

  const mod = await import("./basic");
  return (mod as any).default as (mount: HTMLElement) => unknown;
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
  // Initialize broadcast receivers for service worker communication
  initReceivers();

  // Handle share target data if coming from PWA share
  handleShareTarget();

  const defaultChoice: FrontendChoice = "basic";

  const hash = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
  if (hash === "basic") {
    const run = await loadSubApp("basic");
    run?.(mountElement);
    return;
  }
  if (hash === "faint") {
    const run = await loadSubApp("faint");
    run?.(mountElement);
    return;
  }

  if (isExtension()) {
    const run = await loadSubApp(defaultChoice);
    run?.(mountElement);
    return;
  }

  const pwa = isPwaDisplayMode();
  const remembered = loadRemember();
  const stored = loadChoice();

  if (pwa && remembered && stored) {
    const run = await loadSubApp(stored);
    run?.(mountElement);
    return;
  }

  if (!pwa) {
    const run = await loadSubApp(defaultChoice);
    run?.(mountElement);
    return;
  }

  mountElement.replaceChildren();

  let done = false;
  let seconds = 10;
  const { container, countdownEl } = ChoiceScreen({
    seconds,
    defaultChoice,
    initialRemember: remembered,
    onChoose: async (choice, remember) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      if (remember) saveChoice(choice, true);
      else saveChoice(choice, false);
      mountElement.replaceChildren();
      const run = await loadSubApp(choice);
      run?.(mountElement);
    },
  });

  const timer = window.setInterval(() => {
    if (done) return;
    seconds -= 1;
    const b = countdownEl.querySelector("b");
    if (b) b.textContent = String(Math.max(0, seconds));
    if (seconds <= 0) {
      done = true;
      clearInterval(timer);
      void (async () => {
        mountElement.replaceChildren();
        const run = await loadSubApp(defaultChoice);
        run?.(mountElement);
      })();
    }
  }, 1000);

  mountElement.append(container);
}

export { frontend };
