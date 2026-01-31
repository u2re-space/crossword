/**
 * Styles Module
 *
 * Provides style system integration for the CrossWord application.
 * Supports multiple style systems: Veela (full), Basic, Raw.
 *
 * Directory Structure:
 * - scss/     : Shared SCSS files (normalize, utilities, forms, buttons)
 * - lib/      : SCSS library (config, mixins, tokens, props)
 * - basic/    : Basic style system
 */

import { loadAsAdopted } from "fest/dom";

// ============================================================================
// STYLE TYPES
// ============================================================================

export type StyleSystemId = "veela" | "basic" | "raw";

export interface StyleConfig {
    id: StyleSystemId;
    name: string;
    description: string;
    stylesheets: string[];
    initFn?: () => Promise<void>;
}

// ============================================================================
// STYLE SYSTEM CONFIGURATIONS
// ============================================================================

export const STYLE_CONFIGS: Record<StyleSystemId, StyleConfig> = {
    veela: {
        id: "veela",
        name: "Veela CSS",
        description: "Full-featured CSS framework with design tokens",
        stylesheets: [],
        initFn: async () => {
            try {
                // Try multiple paths for Veela CSS
                const paths = [
                    () => import("fest/veela/index.scss?inline"),
                    () => import("fest/veela/src/index.scss?inline")
                ];

                for (const loadPath of paths) {
                    try {
                        const veelaStyle = await loadPath();
                        if (veelaStyle.default) {
                            await loadAsAdopted(veelaStyle.default);
                            console.log("[Styles] Veela CSS loaded");
                            return;
                        }
                    } catch {
                        continue;
                    }
                }

                console.warn("[Styles] Veela CSS not found, using fallback");
            } catch (e) {
                console.warn("[Styles] Failed to load Veela CSS:", e);
            }
        }
    },
    basic: {
        id: "basic",
        name: "Basic Styles",
        description: "Minimal styling for basic functionality",
        stylesheets: [],
        initFn: async () => {
            try {
                const basicStyle = await import("./basic/index.scss?inline");
                if (basicStyle.default) {
                    await loadAsAdopted(basicStyle.default);
                    console.log("[Styles] Basic styles loaded");
                }
            } catch (e) {
                console.warn("[Styles] Failed to load basic styles:", e);
            }
        }
    },
    raw: {
        id: "raw",
        name: "Raw",
        description: "No styling framework, browser defaults",
        stylesheets: [],
        initFn: async () => {
            // No styles to load for raw mode
            console.log("[Styles] Raw mode - no styles loaded");
        }
    }
};

// ============================================================================
// STYLE LOADER
// ============================================================================

/**
 * Load a style system
 */
export async function loadStyleSystem(styleId: StyleSystemId): Promise<void> {
    const config = STYLE_CONFIGS[styleId];
    if (!config) {
        throw new Error(`Unknown style system: ${styleId}`);
    }

    console.log(`[Styles] Loading style system: ${config.name}`);

    if (config.initFn) {
        await config.initFn();
    }

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

// ============================================================================
// RE-EXPORTS
// ============================================================================

// SCSS loaders
export {
    loadSharedStyles,
    loadFormStyles,
    loadButtonStyles,
    loadAllStyles
} from "./scss";

export { loadSharedStyles as default } from "./scss";
