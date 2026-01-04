import { H } from "fest/lure";
import { loadAsAdopted } from "fest/dom";
//@ts-ignore
import style from "./boot-menu.scss?inline";

// ============================================================================
// Type Definitions
// ============================================================================

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

// ============================================================================
// Utility Functions
// ============================================================================

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

/**
 * Save user choice preference to localStorage
 */
const saveChoicePreference = (choice: FrontendChoice, remember: boolean): void => {
    if (!remember) return;

    try {
        localStorage.setItem("rs-frontend-choice", choice);
        localStorage.setItem("rs-frontend-choice-remember", "1");
    } catch {
        // Ignore localStorage errors
    }
};

// ============================================================================
// Main Choice Screen Component
// ============================================================================

export const ChoiceScreen = (opts: ChoiceScreenOptions): ChoiceScreenResult => {
    // Create UI elements
    const elements = createUIElements(opts);
    const container = createContainer(opts, elements);

    // Set up event handlers
    setupEventHandlers(opts, elements);

    // Initialize focus
    queueMicrotask(() => elements.keyboardNavigation.focusAt(0));

    return { container, countdownEl: elements.countdown };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create all UI elements for the choice screen
 */
const createUIElements = (opts: ChoiceScreenOptions) => {
    const headerText = H`<header class="choice-header">Boot menu</header>` as HTMLElement;
    const reasonsText = H`<div class="choice-reasons">Currently, I'm not able to actively support the complex <b>Faint</b> project. The <b>Basic</b> version is the default.</div>` as HTMLElement;

    const countdown = H`<div class="choice-countdown">Auto-starting in <b>${opts.seconds}</b> seconds…</div>` as HTMLElement;
    const hint = H`<div class="choice-hint">Use <b>↑</b>/<b>↓</b> to select, <b>Enter</b> to boot.</div>` as HTMLElement;

    // Remember checkbox
    const remember = H`<label class="choice-remember">
        <input type="checkbox" />
        <span>Remember my choice</span>
    </label>` as HTMLElement;
    const rememberInput = remember.querySelector("input") as HTMLInputElement | null;
    if (rememberInput) rememberInput.checked = Boolean(opts.initialRemember);

    // Menu buttons
    const bigBasicButton = H`<button class="basic big recommended" type="button">Basic</button>` as HTMLButtonElement;
    const unstableFaint = H`<button class="unstable small faint" type="button">Faint OS (unstable)</button>` as HTMLButtonElement;

    // Keyboard navigation setup
    const buttons = [bigBasicButton, unstableFaint];
    let currentIndex = 0;

    const focusAt = (nextIdx: number) => {
        const len = buttons.length;
        currentIndex = ((nextIdx % len) + len) % len;
        buttons[currentIndex]?.focus?.();
    };

    return {
        headerText,
        reasonsText,
        countdown,
        hint,
        remember,
        rememberInput,
        bigBasicButton,
        unstableFaint,
        buttons,
        keyboardNavigation: { focusAt, currentIndex }
    };
};

/**
 * Create and assemble the main container
 */
const createContainer = (opts: ChoiceScreenOptions, elements: ReturnType<typeof createUIElements>) => {
    const container = H`<div class="choice container"></div>` as HTMLElement;
    const menu = H`<div class="choice-menu" role="menu"></div>` as HTMLElement;

    menu.append(elements.bigBasicButton, elements.unstableFaint);
    container.append(
        elements.headerText,
        elements.countdown,
        elements.hint,
        menu,
        elements.remember,
        elements.reasonsText
    );

    return container;
};

/**
 * Set up event handlers for buttons and keyboard navigation
 */
const setupEventHandlers = (opts: ChoiceScreenOptions, elements: ReturnType<typeof createUIElements>) => {
    const { bigBasicButton, unstableFaint, buttons, keyboardNavigation, rememberInput } = elements;

    // Button click handlers
    const handleChoice = (choice: FrontendChoice) => {
        const remember = Boolean(rememberInput?.checked);

        // Try routed path first if enabled
        if (opts.tryRoutedPath && tryRoutedPath(choice)) {
            saveChoicePreference(choice, remember);
            return;
        }

        // Fall back to onChoose callback
        opts.onChoose(choice, remember);
    };

    bigBasicButton.addEventListener("click", () => handleChoice("basic"));
    unstableFaint.addEventListener("click", () => handleChoice("faint"));

    // Keyboard navigation
    const container = bigBasicButton.closest('.choice.container') as HTMLElement;
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            keyboardNavigation.focusAt(keyboardNavigation.currentIndex + 1);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            keyboardNavigation.focusAt(keyboardNavigation.currentIndex - 1);
            return;
        }
        if (e.key === "Enter") {
            const el = document.activeElement as HTMLElement | null;
            const btn = el?.closest?.("button") as HTMLButtonElement | null;
            btn?.click?.();
        }
    });
};

//
export default (mountingElement: HTMLElement) => {
    loadAsAdopted(style)
    mountingElement.append(ChoiceScreen({
        seconds: 10,
        defaultChoice: "basic",
        onChoose: (choice, remember) => {},
        initialRemember: false,
        tryRoutedPath: true
    })?.container);
};
