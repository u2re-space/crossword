/**
 * Boot System
 * 
 * Application initialization and shell/view loading.
 * Handles:
 * - Shell selection (with user preference persistence)
 * - Initial view loading
 * - URL routing
 * - PWA integration
 */

import { ShellRegistry, ViewRegistry, initializeRegistries, defaultTheme } from "../shells/registry";
import type { ShellId, ViewId, Shell, BootConfig, ShellTheme } from "../shells/types";
import { getString, setString, getItem, setItem, StorageKeys } from "../shared/storage";
import { H } from "fest/lure";

// ============================================================================
// BOOT CONFIGURATION
// ============================================================================

const DEFAULT_SHELL: ShellId = "basic";
const DEFAULT_VIEW: ViewId = "viewer";

// ============================================================================
// URL PARSING
// ============================================================================

interface ParsedRoute {
    shell?: ShellId;
    view?: ViewId;
    params?: Record<string, string>;
}

/**
 * Parse current URL to extract shell and view
 */
function parseRoute(): ParsedRoute {
    const pathname = location.pathname;
    const hash = location.hash.replace(/^#/, "");
    const searchParams = new URLSearchParams(location.search);

    // Check for direct shell routes: /basic, /faint, /raw
    const shellMatch = pathname.match(/^\/(basic|faint|raw)(?:\/|$)/);
    const shell = shellMatch ? (shellMatch[1] as ShellId) : undefined;

    // View from hash or remaining pathname
    let view: ViewId | undefined;
    if (hash) {
        view = hash as ViewId;
    } else if (shell) {
        const remaining = pathname.replace(`/${shell}`, "").replace(/^\//, "");
        if (remaining) {
            view = remaining as ViewId;
        }
    }

    // Extract params
    const params: Record<string, string> = {};
    for (const [key, value] of searchParams) {
        params[key] = value;
    }

    return { shell, view, params };
}

/**
 * Get shell from user preference or URL
 */
function getPreferredShell(route: ParsedRoute): ShellId {
    // URL takes priority
    if (route.shell) return route.shell;

    // Check saved preference
    const remember = getString(StorageKeys.SHELL_REMEMBER, "") === "1";
    if (remember) {
        const saved = getString(StorageKeys.SHELL_CHOICE, "") as ShellId;
        if (saved && ["basic", "faint", "raw"].includes(saved)) {
            return saved;
        }
    }

    return DEFAULT_SHELL;
}

/**
 * Get initial view from URL or default
 */
function getInitialView(route: ParsedRoute): ViewId {
    if (route.view) return route.view;
    return DEFAULT_VIEW;
}

// ============================================================================
// SHELL CHOICE SCREEN
// ============================================================================

interface ChoiceScreenOptions {
    onChoose: (shell: ShellId, remember: boolean) => void;
    countdown?: number;
    defaultShell?: ShellId;
}

/**
 * Create shell choice screen
 */
function createChoiceScreen(options: ChoiceScreenOptions): HTMLElement {
    const countdown = options.countdown ?? 10;
    const defaultShell = options.defaultShell ?? DEFAULT_SHELL;

    const screen = H`
        <div class="boot-choice">
            <div class="boot-choice__content">
                <h1 class="boot-choice__title">CrossWord</h1>
                <p class="boot-choice__subtitle">Choose your preferred interface</p>
                
                <div class="boot-choice__options">
                    <button class="boot-choice__option" data-shell="basic" type="button">
                        <ui-icon icon="layout" icon-style="duotone" size="32"></ui-icon>
                        <span class="boot-choice__option-title">Basic</span>
                        <span class="boot-choice__option-desc">Clean toolbar navigation</span>
                    </button>
                    
                    <button class="boot-choice__option" data-shell="faint" type="button">
                        <ui-icon icon="sidebar" icon-style="duotone" size="32"></ui-icon>
                        <span class="boot-choice__option-title">Faint</span>
                        <span class="boot-choice__option-desc">Tabbed sidebar interface</span>
                    </button>
                    
                    <button class="boot-choice__option" data-shell="raw" type="button">
                        <ui-icon icon="square" icon-style="duotone" size="32"></ui-icon>
                        <span class="boot-choice__option-title">Raw</span>
                        <span class="boot-choice__option-desc">Minimal, no chrome</span>
                    </button>
                </div>
                
                <label class="boot-choice__remember">
                    <input type="checkbox" data-remember />
                    <span>Remember my choice</span>
                </label>
                
                <p class="boot-choice__countdown">
                    Auto-starting <b>${defaultShell}</b> in <b data-countdown>${countdown}</b>s...
                </p>
            </div>
        </div>
    ` as HTMLElement;

    // Style
    screen.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #1a1a1a;
    `;

    // Add inline styles for the rest
    const styleEl = document.createElement("style");
    styleEl.textContent = `
        .boot-choice__content { text-align: center; max-inline-size: 600px; padding: 2rem; }
        .boot-choice__title { margin: 0; font-size: 2.5rem; font-weight: 800; color: #007acc; }
        .boot-choice__subtitle { margin: 0.5rem 0 2rem; font-size: 1.125rem; opacity: 0.7; }
        .boot-choice__options { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .boot-choice__option {
            display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
            padding: 1.5rem 2rem; border: 2px solid rgba(0,0,0,0.1); border-radius: 12px;
            background: white; cursor: pointer; transition: all 0.2s ease;
            min-inline-size: 160px;
        }
        .boot-choice__option:hover { transform: translateY(-2px); border-color: #007acc; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .boot-choice__option-title { font-weight: 600; font-size: 1rem; }
        .boot-choice__option-desc { font-size: 0.75rem; opacity: 0.6; }
        .boot-choice__remember { display: flex; align-items: center; gap: 0.5rem; justify-content: center; margin-bottom: 1rem; cursor: pointer; }
        .boot-choice__remember input { accent-color: #007acc; }
        .boot-choice__countdown { font-size: 0.875rem; opacity: 0.6; }
    `;
    screen.appendChild(styleEl);

    // Event handlers
    let countdownValue = countdown;
    let timer: number | null = null;

    const handleChoice = (shell: ShellId) => {
        if (timer) clearInterval(timer);
        const remember = (screen.querySelector("[data-remember]") as HTMLInputElement)?.checked ?? false;
        options.onChoose(shell, remember);
    };

    screen.querySelectorAll("[data-shell]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const shell = (btn as HTMLElement).dataset.shell as ShellId;
            handleChoice(shell);
        });
    });

    // Countdown
    const countdownEl = screen.querySelector("[data-countdown]");
    timer = window.setInterval(() => {
        countdownValue--;
        if (countdownEl) countdownEl.textContent = String(countdownValue);
        if (countdownValue <= 0) {
            handleChoice(defaultShell);
        }
    }, 1000);

    return screen;
}

// ============================================================================
// LOADING SCREEN
// ============================================================================

function createLoadingScreen(message = "Loading..."): HTMLElement {
    const screen = document.createElement("div");
    screen.className = "boot-loading";
    screen.innerHTML = `
        <div class="boot-loading__spinner"></div>
        <span class="boot-loading__text">${message}</span>
    `;
    screen.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background: #ffffff;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #666;
    `;

    const style = document.createElement("style");
    style.textContent = `
        .boot-loading__spinner {
            width: 32px; height: 32px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007acc;
            border-radius: 50%;
            animation: boot-spin 1s linear infinite;
        }
        @keyframes boot-spin { to { transform: rotate(360deg); } }
    `;
    screen.appendChild(style);

    return screen;
}

// ============================================================================
// BOOT FUNCTION
// ============================================================================

export interface BootOptions {
    /** Mount container element */
    container: HTMLElement;
    /** Skip choice screen even for first-time users */
    skipChoiceScreen?: boolean;
    /** Force specific shell */
    forceShell?: ShellId;
    /** Force specific view */
    forceView?: ViewId;
    /** Custom theme */
    theme?: ShellTheme;
}

/**
 * Boot the application
 */
export async function boot(options: BootOptions): Promise<Shell> {
    const { container, skipChoiceScreen = false, forceShell, forceView, theme = defaultTheme } = options;

    console.log("[Boot] Starting application boot...");

    // Initialize registries
    initializeRegistries();
    console.log("[Boot] Registries initialized");

    // Parse route
    const route = parseRoute();
    console.log("[Boot] Route parsed:", route);

    // Determine shell
    let shellId: ShellId;
    
    if (forceShell) {
        shellId = forceShell;
    } else if (route.shell) {
        shellId = route.shell;
    } else if (skipChoiceScreen) {
        shellId = getPreferredShell(route);
    } else {
        // Check if user has a saved preference
        const hasPreference = getString(StorageKeys.SHELL_REMEMBER, "") === "1" && 
                              getString(StorageKeys.SHELL_CHOICE, "");
        
        if (hasPreference) {
            shellId = getPreferredShell(route);
        } else {
            // Show choice screen
            console.log("[Boot] Showing shell choice screen");
            
            return new Promise((resolve) => {
                const choiceScreen = createChoiceScreen({
                    onChoose: async (chosen, remember) => {
                        if (remember) {
                            setString(StorageKeys.SHELL_CHOICE, chosen);
                            setString(StorageKeys.SHELL_REMEMBER, "1");
                        }
                        
                        container.replaceChildren(createLoadingScreen(`Loading ${chosen}...`));
                        
                        const shell = await loadShell(container, chosen, forceView || getInitialView(route), theme);
                        resolve(shell);
                    }
                });
                
                container.replaceChildren(choiceScreen);
            });
        }
    }

    // Load shell directly
    console.log("[Boot] Loading shell:", shellId);
    container.replaceChildren(createLoadingScreen(`Loading ${shellId}...`));
    
    const shell = await loadShell(container, shellId, forceView || getInitialView(route), theme);
    return shell;
}

/**
 * Load and mount a shell
 */
async function loadShell(
    container: HTMLElement, 
    shellId: ShellId, 
    initialView: ViewId,
    theme: ShellTheme
): Promise<Shell> {
    try {
        // Load shell from registry
        const shell = await ShellRegistry.load(shellId, container);
        
        // Set theme
        shell.setTheme(theme);
        
        // Mount shell
        await shell.mount(container);
        console.log("[Boot] Shell mounted:", shellId);
        
        // Navigate to initial view
        await shell.navigate(initialView);
        console.log("[Boot] Initial view loaded:", initialView);
        
        return shell;
    } catch (error) {
        console.error("[Boot] Failed to load shell:", error);
        
        // Show error
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;text-align:center;font-family:system-ui,sans-serif;">
                <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
                <h2 style="margin:0 0 0.5rem 0;color:#d32f2f;">Failed to Load</h2>
                <p style="margin:0 0 1rem 0;color:#666;">${String(error)}</p>
                <button onclick="location.reload()" style="padding:0.5rem 1rem;background:#007acc;color:white;border:none;border-radius:6px;cursor:pointer;">
                    Reload
                </button>
            </div>
        `;
        
        throw error;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ShellRegistry, ViewRegistry };
export type { Shell, ShellId, ViewId, BootConfig };
