/**
 * Settings View
 *
 * Shell-agnostic settings component.
 * Provides application configuration UI.
 */

import { H } from "fest/lure";
import { ref, affected } from "fest/object";
import { loadAsAdopted } from "fest/dom";
import type { View, ViewOptions, ViewLifecycle, ShellContext } from "../../shells/types";
import type { BaseViewOptions } from "../types";
import { getItem, setItem, StorageKeys } from "../../../core/storage";

// @ts-ignore
import settingsStyles from "./Settings.scss?inline";

// ============================================================================
// SETTINGS TYPES
// ============================================================================

interface AppSettings {
    appearance: {
        theme: "auto" | "light" | "dark";
        fontSize: "small" | "medium" | "large";
    };
    ai: {
        apiKey?: string;
        model?: string;
        autoProcess?: boolean;
    };
    general: {
        autosave: boolean;
        notifications: boolean;
    };
}

const defaultSettings: AppSettings = {
    appearance: { theme: "auto", fontSize: "medium" },
    ai: { autoProcess: true },
    general: { autosave: true, notifications: true }
};

// ============================================================================
// SETTINGS OPTIONS
// ============================================================================

export interface SettingsOptions extends BaseViewOptions {
    onThemeChange?: (theme: "auto" | "light" | "dark") => void;
    onSettingsChange?: (settings: AppSettings) => void;
}

// ============================================================================
// SETTINGS VIEW
// ============================================================================

export class SettingsView implements View {
    id = "settings" as const;
    name = "Settings";
    icon = "gear";

    private options: SettingsOptions;
    private shellContext?: ShellContext;
    private element: HTMLElement | null = null;
    private settings = ref<AppSettings>(defaultSettings);

    lifecycle: ViewLifecycle = {
        onMount: () => this.loadSettings(),
        onUnmount: () => this.saveSettings()
    };

    constructor(options: SettingsOptions = {}) {
        this.options = options;
        this.shellContext = options.shellContext;
    }

    render(options?: ViewOptions): HTMLElement {
        if (options) {
            this.options = { ...this.options, ...options };
            this.shellContext = options.shellContext || this.shellContext;
        }

        loadAsAdopted(settingsStyles);
        this.loadSettings();

        this.element = H`
            <div class="view-settings">
                <div class="view-settings__content">
                    <h1 class="view-settings__title">Settings</h1>

                    <section class="view-settings__section">
                        <h2>Appearance</h2>
                        <div class="view-settings__group">
                            <label class="view-settings__label">
                                <span>Theme</span>
                                <select data-setting="appearance.theme" class="view-settings__select">
                                    <option value="auto" ${this.settings.value.appearance.theme === "auto" ? "selected" : ""}>Auto</option>
                                    <option value="light" ${this.settings.value.appearance.theme === "light" ? "selected" : ""}>Light</option>
                                    <option value="dark" ${this.settings.value.appearance.theme === "dark" ? "selected" : ""}>Dark</option>
                                </select>
                            </label>
                            <label class="view-settings__label">
                                <span>Font Size</span>
                                <select data-setting="appearance.fontSize" class="view-settings__select">
                                    <option value="small" ${this.settings.value.appearance.fontSize === "small" ? "selected" : ""}>Small</option>
                                    <option value="medium" ${this.settings.value.appearance.fontSize === "medium" ? "selected" : ""}>Medium</option>
                                    <option value="large" ${this.settings.value.appearance.fontSize === "large" ? "selected" : ""}>Large</option>
                                </select>
                            </label>
                        </div>
                    </section>

                    <section class="view-settings__section">
                        <h2>AI Configuration</h2>
                        <div class="view-settings__group">
                            <label class="view-settings__label">
                                <span>API Key</span>
                                <input
                                    type="password"
                                    data-setting="ai.apiKey"
                                    class="view-settings__input"
                                    placeholder="Enter your API key"
                                    value="${this.settings.value.ai.apiKey || ""}"
                                />
                            </label>
                            <label class="view-settings__label">
                                <span>Model</span>
                                <input
                                    type="text"
                                    data-setting="ai.model"
                                    class="view-settings__input"
                                    placeholder="e.g., gpt-4o-mini"
                                    value="${this.settings.value.ai.model || ""}"
                                />
                            </label>
                            <label class="view-settings__checkbox">
                                <input
                                    type="checkbox"
                                    data-setting="ai.autoProcess"
                                    ${this.settings.value.ai.autoProcess ? "checked" : ""}
                                />
                                <span>Auto-process shared content</span>
                            </label>
                        </div>
                    </section>

                    <section class="view-settings__section">
                        <h2>General</h2>
                        <div class="view-settings__group">
                            <label class="view-settings__checkbox">
                                <input
                                    type="checkbox"
                                    data-setting="general.autosave"
                                    ${this.settings.value.general.autosave ? "checked" : ""}
                                />
                                <span>Auto-save content</span>
                            </label>
                            <label class="view-settings__checkbox">
                                <input
                                    type="checkbox"
                                    data-setting="general.notifications"
                                    ${this.settings.value.general.notifications ? "checked" : ""}
                                />
                                <span>Enable notifications</span>
                            </label>
                        </div>
                    </section>

                    <div class="view-settings__actions">
                        <button class="view-settings__btn view-settings__btn--primary" data-action="save" type="button">
                            Save Settings
                        </button>
                        <button class="view-settings__btn" data-action="reset" type="button">
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        ` as HTMLElement;

        this.setupEventHandlers();
        return this.element;
    }

    getToolbar(): HTMLElement | null {
        return null;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private setupEventHandlers(): void {
        if (!this.element) return;

        // Handle input changes
        this.element.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement | HTMLSelectElement;
            const path = target.dataset.setting;
            if (!path) return;

            const [section, key] = path.split(".") as [keyof AppSettings, string];
            const value = target.type === "checkbox"
                ? (target as HTMLInputElement).checked
                : target.value;

            // Update settings
            (this.settings.value[section] as any)[key] = value;

            // Special handling for theme
            if (path === "appearance.theme") {
                this.options.onThemeChange?.(value as "auto" | "light" | "dark");
            }
        });

        // Handle actions
        this.element.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest("[data-action]") as HTMLButtonElement | null;
            if (!button) return;

            const action = button.dataset.action;
            if (action === "save") {
                this.saveSettings();
                this.showMessage("Settings saved");
            } else if (action === "reset") {
                this.resetSettings();
                this.showMessage("Settings reset to defaults");
            }
        });
    }

    private loadSettings(): void {
        const saved = getItem<AppSettings>(StorageKeys.SETTINGS, defaultSettings);
        this.settings.value = { ...defaultSettings, ...saved };
    }

    private saveSettings(): void {
        setItem(StorageKeys.SETTINGS, this.settings.value);
        this.options.onSettingsChange?.(this.settings.value);
    }

    private resetSettings(): void {
        this.settings.value = { ...defaultSettings };
        this.updateUI();
    }

    private updateUI(): void {
        if (!this.element) return;

        // Update all inputs to reflect current settings
        const inputs = this.element.querySelectorAll("[data-setting]");
        for (const input of inputs) {
            const path = (input as HTMLElement).dataset.setting!;
            const [section, key] = path.split(".") as [keyof AppSettings, string];
            const value = (this.settings.value[section] as any)[key];

            if ((input as HTMLInputElement).type === "checkbox") {
                (input as HTMLInputElement).checked = Boolean(value);
            } else {
                (input as HTMLInputElement | HTMLSelectElement).value = value || "";
            }
        }
    }

    private showMessage(message: string): void {
        this.shellContext?.showMessage(message);
    }

    canHandleMessage(messageType: string): boolean {
        return messageType === "settings-update";
    }

    async handleMessage(message: unknown): Promise<void> {
        const msg = message as { data?: Partial<AppSettings> };
        if (msg.data) {
            this.settings.value = { ...this.settings.value, ...msg.data };
            this.updateUI();
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createView(options?: SettingsOptions): SettingsView {
    return new SettingsView(options);
}

export default createView;
