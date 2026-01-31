/**
 * SCSS Module Loader
 *
 * Provides dynamic loading of shared SCSS modules.
 * Use for on-demand style loading in components.
 */

import { loadAsAdopted } from "fest/dom";

/**
 * Load shared styles (normalize + utilities)
 */
export const loadSharedStyles = async (): Promise<void> => {
    // Load normalize (reset/base styles)
    try {
        const normalize = await import("./normalize.scss?inline");
        if (normalize.default) {
            await loadAsAdopted(normalize.default);
        }
    } catch (e) {
        console.warn("[Styles] Failed to load normalize:", e);
    }

    // Load utilities
    try {
        const utilities = await import("./utilities.scss?inline");
        if (utilities.default) {
            await loadAsAdopted(utilities.default);
        }
    } catch (e) {
        console.warn("[Styles] Failed to load utilities:", e);
    }
};

/**
 * Load form styles
 */
export const loadFormStyles = async (): Promise<void> => {
    try {
        const forms = await import("./forms.scss?inline");
        if (forms.default) {
            await loadAsAdopted(forms.default);
        }
    } catch (e) {
        console.warn("[Styles] Failed to load forms:", e);
    }
};

/**
 * Load button styles
 */
export const loadButtonStyles = async (): Promise<void> => {
    try {
        const buttons = await import("./buttons.scss?inline");
        if (buttons.default) {
            await loadAsAdopted(buttons.default);
        }
    } catch (e) {
        console.warn("[Styles] Failed to load buttons:", e);
    }
};

/**
 * Load all component styles
 */
export const loadAllStyles = async (): Promise<void> => {
    await Promise.all([
        loadSharedStyles(),
        loadFormStyles(),
        loadButtonStyles()
    ]);
};

export default loadSharedStyles;
