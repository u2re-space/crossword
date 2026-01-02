import { H } from "fest/lure";
import "./boot-menu.scss";

export type FrontendChoice = "basic" | "faint" | "print" | "" | "/";

export type ChoiceScreenOptions = {
    seconds: number;
    defaultChoice: FrontendChoice;
    onChoose: (choice: FrontendChoice, remember: boolean) => void;
    initialRemember?: boolean;
    tryRoutedPath?: boolean;
};

export type ChoiceScreenResult = {
    container: HTMLElement;
    countdownEl: HTMLElement;
};

/**
 * Try to navigate to a routed path instead of loading sub-app
 */
const tryRoutedPath = (choice: FrontendChoice): boolean => {
    const pathname = (location.pathname || "").replace(/^\//, "").trim().toLowerCase();

    // If we're already on the correct route, no need to navigate
    if (pathname === choice.toLowerCase()) {
        return false;
    }

    // Try to navigate to the routed path
    try {
        const newPath = `/${choice.toLowerCase()}`;
        console.log(`[BootMenu] Trying to navigate to routed path: ${newPath}`);
        window.history.pushState({}, "", newPath);

        // Dispatch a navigation event that the index can handle
        window.dispatchEvent(new CustomEvent('route-changed', {
            detail: { path: choice.toLowerCase(), source: 'boot-menu' }
        }));

        return true;
    } catch (error) {
        console.warn(`[BootMenu] Failed to navigate to routed path for ${choice}:`, error);
        return false;
    }
};

export const ChoiceScreen = (opts: ChoiceScreenOptions): ChoiceScreenResult => {
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

    const handleChoice = (choice: FrontendChoice) => {
        const remember = Boolean(rememberInput?.checked);

        // Try routed path first if enabled
        if (opts.tryRoutedPath && tryRoutedPath(choice)) {
            // Successfully navigated to route, save choice preference
            if (remember) {
                try {
                    localStorage.setItem("rs-frontend-choice", choice);
                    localStorage.setItem("rs-frontend-choice-remember", "1");
                } catch {
                    // ignore
                }
            }
            return;
        }

        // Fall back to onChoose callback
        opts.onChoose(choice, remember);
    };

    bigBasicButton.addEventListener("click", () => handleChoice("basic"));
    unstableFaint.addEventListener("click", () => handleChoice("faint"));

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

//
export default (mountingElement: HTMLElement) => {
    mountingElement.append(ChoiceScreen({
        seconds: 10,
        defaultChoice: "basic",
        onChoose: (choice, remember) => {},
        initialRemember: false,
        tryRoutedPath: true
    })?.container);
};
