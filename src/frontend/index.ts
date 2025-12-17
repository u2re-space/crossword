import { H } from "fest/lure";
import "./choice.scss";

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
  const headerText = H`<header class="choice-header">I made two sub-projects…</header>` as HTMLElement;
  const reasonsText = H`<div class="choice-reasons">Currently, I'm not able to actively support the complex <b>Faint</b> project. The <b>Basic</b> version is the default.</div>` as HTMLElement;

  const countdown = H`<div class="choice-countdown">Auto-start in <b>${opts.seconds}</b>s…</div>` as HTMLElement;
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
  container.append(headerText, countdown, bigBasicButton, unstableFaint, remember, reasonsText);
  return { container, countdownEl: countdown };
};

export default async function frontend(mountElement: HTMLElement) {
  const defaultChoice: FrontendChoice = "basic";

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
