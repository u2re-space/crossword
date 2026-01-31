/**
 * CrossWord Styles Module
 *
 * Provides style system integration for the CrossWord application.
 * Supports multiple style systems based on veela CSS variants.
 *
 * Style Systems:
 * - veela-advanced: Full-featured CSS framework (default)
 * - veela-basic: Lightweight minimal styling
 * - veela-beercss: Beer CSS compatible styling
 * - raw: No styling framework (browser defaults)
 */

import { loadAsAdopted } from "fest/dom";

// ============================================================================
// STYLE TYPES
// ============================================================================

export type StyleSystemId = "veela-advanced" | "veela-basic" | "veela-beercss" | "raw";

export interface StyleConfig {
    id: StyleSystemId;
    name: string;
    description: string;
    variant: "advanced" | "basic" | "beercss" | null;
    initFn?: () => Promise<void>;
}

// ============================================================================
// STYLE SYSTEM CONFIGURATIONS
// ============================================================================

export const STYLE_CONFIGS: Record<StyleSystemId, StyleConfig> = {
    "veela-advanced": {
        id: "veela-advanced",
        name: "Veela Advanced",
        description: "Full-featured CSS framework with design tokens and effects",
        variant: "advanced",
        initFn: async () => {
            try {
                const { loadAdvancedStyles } = await import("fest/veela/runtime/advanced/index");
                await loadAdvancedStyles();
                console.log("[Styles] Veela Advanced loaded");
            } catch (e) {
                console.warn("[Styles] Failed to load Veela Advanced:", e);
                // Fallback to direct import
                try {
                    const styles = await import("fest/veela/src/scss/runtime/advanced/_index.scss?inline");
                    if (styles.default) {
                        await loadAsAdopted(styles.default);
                    }
                } catch {
                    console.warn("[Styles] Fallback also failed");
                }
            }
        }
    },
    "veela-basic": {
        id: "veela-basic",
        name: "Veela Basic",
        description: "Lightweight minimal styling for basic functionality",
        variant: "basic",
        initFn: async () => {
            try {
                const { loadBasicStyles } = await import("fest/veela/runtime/basic/index");
                await loadBasicStyles();
                console.log("[Styles] Veela Basic loaded");
            } catch (e) {
                console.warn("[Styles] Failed to load Veela Basic:", e);
                // Fallback to local basic styles
                try {
                    const basicStyle = await import("./basic/index.scss?inline");
                    if (basicStyle.default) {
                        await loadAsAdopted(basicStyle.default);
                    }
                } catch {
                    console.warn("[Styles] Basic fallback also failed");
                }
            }
        }
    },
    "veela-beercss": {
        id: "veela-beercss",
        name: "Veela BeerCSS",
        description: "Beer CSS compatible styling with Material Design 3",
        variant: "beercss",
        initFn: async () => {
            try {
                const { loadBeerCssStyles } = await import("fest/veela/runtime/beercss/index");
                await loadBeerCssStyles();
                console.log("[Styles] Veela BeerCSS loaded");
            } catch (e) {
                console.warn("[Styles] Failed to load Veela BeerCSS:", e);
            }
        }
    },
    raw: {
        id: "raw",
        name: "Raw",
        description: "No styling framework, browser defaults",
        variant: null,
        initFn: async () => {
            console.log("[Styles] Raw mode - no styles loaded");
        }
    }
};

// ============================================================================
// LEGACY ALIASES (backwards compatibility)
// ============================================================================

/** @deprecated Use "veela-advanced" instead */
export const STYLE_ALIAS_VEELA = "veela-advanced" as const;

/** @deprecated Use "veela-basic" instead */
export const STYLE_ALIAS_BASIC = "veela-basic" as const;

// ============================================================================
// STYLE LOADER
// ============================================================================

let _currentStyle: StyleSystemId | null = null;

/**
 * Load a style system
 *
 * @param styleId - Style system identifier
 */
export async function loadStyleSystem(styleId: StyleSystemId): Promise<void> {
    const config = STYLE_CONFIGS[styleId];
    if (!config) {
        throw new Error(`Unknown style system: ${styleId}`);
    }

    if (_currentStyle === styleId) {
        console.log(`[Styles] Style system '${styleId}' already loaded`);
        return;
    }

    console.log(`[Styles] Loading style system: ${config.name}`);

    if (config.initFn) {
        await config.initFn();
    }

    _currentStyle = styleId;
    console.log(`[Styles] Style system ${config.name} loaded`);
}

/**
 * Get style system configuration
 */
export function getStyleConfig(styleId: StyleSystemId): StyleConfig {
    return STYLE_CONFIGS[styleId];
}

/**
 * List available style systems
 */
export function listStyleSystems(): StyleConfig[] {
    return Object.values(STYLE_CONFIGS);
}

/**
 * Get the currently loaded style system
 */
export function getCurrentStyleSystem(): StyleSystemId | null {
    return _currentStyle;
}

/**
 * Check if a style system is loaded
 */
export function isStyleSystemLoaded(styleId: StyleSystemId): boolean {
    return _currentStyle === styleId;
}

// ============================================================================
// RE-EXPORTS (for backwards compatibility)
// ============================================================================

export {
    loadSharedStyles,
    loadFormStyles,
    loadButtonStyles,
    loadAllStyles
} from "./scss";

export { loadSharedStyles as default } from "./scss";
