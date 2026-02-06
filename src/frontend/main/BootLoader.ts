/**
 * Boot Loader - Shell/Style Initialization System
 * 
 * Manages the boot sequence for the CrossWord application:
 * 1. Load style system (Veela CSS or Basic)
 * 2. Initialize shell (frame/layout/environment)
 * 3. Load view/component/module
 * 4. Connect uniform channels
 * 
 * Shell/Style Matrix:
 * | Shells/Styles: | Faint | Basic | Raw |
 * |----------------|-------|-------|-----|
 * | Veela          |  [r]  |  [o]  | [o] |
 * | Basic          |  [o]  |  [r]  | [r] |
 * 
 * [r] - recommended, [o] - optional
 */

import { loadAsAdopted } from "fest/dom";
import { ShellRegistry, initializeRegistries } from "../registry";
import type { ShellId, ViewId, Shell, ShellTheme } from "../shells/types";
import { serviceChannels, type ServiceChannelId } from "@rs-com/core/ServiceChannels";

import { loadVeelaVariant } from "fest/veela";

// ============================================================================
// BOOT TYPES
// ============================================================================

/**
 * Style system identifiers
 */
export type StyleSystem = "veela" | "basic" | "raw";

/**
 * Boot configuration
 */
export interface BootConfig {
    /** Style system to use */
    styleSystem: StyleSystem;
    /** Shell to initialize */
    shell: ShellId;
    /** Initial view to load */
    defaultView: ViewId;
    /** Initial theme */
    theme?: ShellTheme;
    /** Service channels to initialize */
    channels?: ServiceChannelId[];
    /** Remember preferences */
    rememberChoice?: boolean;
}

/**
 * Boot state
 */
export interface BootState {
    phase: "idle" | "styles" | "shell" | "view" | "channels" | "ready" | "error";
    styleSystem: StyleSystem | null;
    shell: ShellId | null;
    view: ViewId | null;
    error: Error | null;
}

/**
 * Boot phase handler
 */
export type BootPhaseHandler = (state: BootState) => void | Promise<void>;

// ============================================================================
// STYLE SYSTEM CONFIGURATION
// ============================================================================

/**
 * Style system configurations
 */
const STYLE_CONFIGS: Record<StyleSystem, {
    name: string;
    stylesheets: string[];
    description: string;
    recommendedShells: ShellId[];
}> = {
    veela: {
        name: "Veela CSS",
        stylesheets: [],  // Will load from fest/veela
        description: "Full-featured CSS framework with design tokens",
        recommendedShells: ["faint"]
    },
    basic: {
        name: "Basic Styles",
        stylesheets: [],  // Minimal styles
        description: "Minimal styling for basic functionality",
        recommendedShells: ["basic", "raw"]
    },
    raw: {
        name: "Raw (No Framework)",
        stylesheets: [],
        description: "No CSS framework, raw browser defaults",
        recommendedShells: ["raw"]
    }
};

/**
 * Get recommended style system for a shell
 */
export function getRecommendedStyle(shell: ShellId): StyleSystem {
    switch (shell) {
        case "faint":
            return "veela";
        case "basic":
        case "raw":
        default:
            return "basic";
    }
}

// ============================================================================
// BOOT LOADER CLASS
// ============================================================================

/**
 * Boot Loader
 * 
 * Manages the application boot sequence with proper ordering:
 * Styles → Shell → View → Channels
 */
export class BootLoader {
    private static instance: BootLoader;
    
    // State (use object for mutable state tracking)
    private state: BootState = {
        phase: "idle",
        styleSystem: null,
        shell: null,
        view: null,
        error: null
    };
    
    // State change handlers
    private stateChangeHandlers = new Set<(state: BootState) => void>();
    
    // Loaded shell instance
    private shellInstance: Shell | null = null;
    
    
    // Phase handlers for customization
    private phaseHandlers = new Map<BootState["phase"], Set<BootPhaseHandler>>();

    private constructor() {
        // Initialize registries
        initializeRegistries();
    }

    static getInstance(): BootLoader {
        if (!BootLoader.instance) {
            BootLoader.instance = new BootLoader();
        }
        return BootLoader.instance;
    }

    // ========================================================================
    // BOOT SEQUENCE
    // ========================================================================

    /**
     * Execute the boot sequence
     */
    async boot(container: HTMLElement, config: BootConfig): Promise<Shell> {
        console.log("[BootLoader] Starting boot sequence:", config);
        
        try {
            // Phase 1: Load Style System
            await this.loadStyles(config.styleSystem);
            
            // Phase 2: Initialize Shell
            const shell = await this.loadShell(config.shell, container);
            
            // Phase 3: Apply Theme
            if (config.theme) {
                shell.setTheme(config.theme);
            }
            
            // Phase 4: Mount Shell
            await shell.mount(container);
            
            // Phase 5: Initialize Channels
            if (config.channels && config.channels.length > 0) {
                await this.initChannels(config.channels);
            }
            
            // Phase 6: Navigate to Default View
            await shell.navigate(config.defaultView);
            
            // Mark as ready
            this.setPhase("ready");
            
            // Save preferences
            if (config.rememberChoice) {
                this.savePreferences(config);
            }
            
            console.log("[BootLoader] Boot complete");
            return shell;
            
        } catch (error) {
            console.error("[BootLoader] Boot failed:", error);
            this.updateState({
                phase: "error",
                error: error as Error
            });
            throw error;
        }
    }

    /**
     * Load style system
     */
    private async loadStyles(styleSystem: StyleSystem): Promise<void> {
        this.setPhase("styles");
        console.log(`[BootLoader] Loading style system: ${styleSystem}`);
        
        const config = STYLE_CONFIGS[styleSystem];
        
        // Load Veela CSS framework if selected
        if (styleSystem === "veela") {
            try {
                // Load the main stylesheet using loadCss helper
                try {
                    // Try loading via fest/veela's loadCss which handles paths correctly
                    await loadVeelaVariant("core");
                } catch {
                    console.warn("[BootLoader] Veela stylesheet not found, using fallback");
                }
                
                console.log("[BootLoader] Veela CSS loaded");
            } catch (error) {
                console.warn("[BootLoader] Failed to load Veela CSS, using fallback:", error);
            }
        }
        
        // Load any additional stylesheets
        for (const sheet of config.stylesheets) {
            try {
                await loadAsAdopted(sheet);
            } catch (error) {
                console.warn(`[BootLoader] Failed to load stylesheet: ${sheet}`, error);
            }
        }
        
        this.updateState({ styleSystem });
        console.log(`[BootLoader] Style system ${styleSystem} loaded`);
    }

    /**
     * Load and initialize shell
     */
    private async loadShell(shellId: ShellId, container: HTMLElement): Promise<Shell> {
        this.setPhase("shell");
        console.log(`[BootLoader] Loading shell: ${shellId}`);
        
        const shell = await ShellRegistry.load(shellId, container);
        
        this.shellInstance = shell;
        this.updateState({ shell: shellId });
        
        console.log(`[BootLoader] Shell ${shellId} loaded`);
        return shell;
    }

    /**
     * Initialize service channels
     */
    private async initChannels(channelIds: ServiceChannelId[]): Promise<void> {
        this.setPhase("channels");
        console.log(`[BootLoader] Initializing channels:`, channelIds);
        
        for (const channelId of channelIds) {
            try {
                await serviceChannels.initChannel(channelId);
            } catch (error) {
                console.warn(`[BootLoader] Failed to init channel ${channelId}:`, error);
            }
        }
        
        console.log(`[BootLoader] Channels initialized`);
    }

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    /**
     * Update state and notify handlers
     */
    private updateState(partial: Partial<BootState>): void {
        Object.assign(this.state, partial);
        this.notifyStateChange();
    }

    /**
     * Set current phase and notify handlers
     */
    private setPhase(phase: BootState["phase"]): void {
        this.updateState({ phase });
        
        const handlers = this.phaseHandlers.get(phase);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(this.state);
                } catch (error) {
                    console.error(`[BootLoader] Phase handler error:`, error);
                }
            }
        }
    }

    /**
     * Notify all state change handlers
     */
    private notifyStateChange(): void {
        for (const handler of this.stateChangeHandlers) {
            try {
                handler(this.state);
            } catch (error) {
                console.error(`[BootLoader] State handler error:`, error);
            }
        }
    }

    /**
     * Subscribe to state changes
     */
    onStateChange(handler: (state: BootState) => void): () => void {
        this.stateChangeHandlers.add(handler);
        return () => {
            this.stateChangeHandlers.delete(handler);
        };
    }

    /**
     * Register a phase handler
     */
    onPhase(phase: BootState["phase"], handler: BootPhaseHandler): () => void {
        if (!this.phaseHandlers.has(phase)) {
            this.phaseHandlers.set(phase, new Set());
        }
        this.phaseHandlers.get(phase)!.add(handler);
        
        return () => {
            this.phaseHandlers.get(phase)?.delete(handler);
        };
    }

    /**
     * Get current state
     */
    getState(): BootState {
        return { ...this.state };
    }

    /**
     * Get current shell instance
     */
    getShell(): Shell | null {
        return this.shellInstance;
    }

    // ========================================================================
    // PREFERENCES
    // ========================================================================

    /**
     * Save boot preferences
     */
    private savePreferences(config: BootConfig): void {
        try {
            localStorage.setItem("rs-boot-style", config.styleSystem);
            localStorage.setItem("rs-boot-shell", config.shell);
            localStorage.setItem("rs-boot-view", config.defaultView);
            localStorage.setItem("rs-boot-remember", "1");
        } catch (error) {
            console.warn("[BootLoader] Failed to save preferences:", error);
        }
    }

    /**
     * Load boot preferences
     */
    loadPreferences(): Partial<BootConfig> | null {
        try {
            const remember = localStorage.getItem("rs-boot-remember");
            if (remember !== "1") return null;
            
            return {
                styleSystem: (localStorage.getItem("rs-boot-style") as StyleSystem) || undefined,
                shell: (localStorage.getItem("rs-boot-shell") as ShellId) || undefined,
                defaultView: (localStorage.getItem("rs-boot-view") as ViewId) || undefined
            };
        } catch {
            return null;
        }
    }

    /**
     * Clear preferences
     */
    clearPreferences(): void {
        try {
            localStorage.removeItem("rs-boot-style");
            localStorage.removeItem("rs-boot-shell");
            localStorage.removeItem("rs-boot-view");
            localStorage.removeItem("rs-boot-remember");
        } catch {
            // Ignore
        }
    }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Get the singleton boot loader
 */
export const bootLoader = BootLoader.getInstance();

/**
 * Quick boot with default configuration
 */
export async function quickBoot(
    container: HTMLElement,
    shell: ShellId = "basic",
    view: ViewId = "viewer"
): Promise<Shell> {
    return bootLoader.boot(container, {
        styleSystem: getRecommendedStyle(shell),
        shell,
        defaultView: view,
        channels: [view as ServiceChannelId],
        rememberChoice: false
    });
}

/**
 * Boot with Veela + Faint shell
 */
export async function bootFaint(
    container: HTMLElement,
    view: ViewId = "viewer"
): Promise<Shell> {
    return bootLoader.boot(container, {
        styleSystem: "veela",
        shell: "faint",
        defaultView: view,
        channels: ["workcenter", "settings", "viewer", "explorer"],
        rememberChoice: true
    });
}

/**
 * Boot with Basic shell
 */
export async function bootBasic(
    container: HTMLElement,
    view: ViewId = "viewer"
): Promise<Shell> {
    return bootLoader.boot(container, {
        styleSystem: "basic",
        shell: "basic",
        defaultView: view,
        channels: ["workcenter", "settings", "viewer"],
        rememberChoice: true
    });
}

/**
 * Boot with Raw shell (minimal)
 */
export async function bootRaw(
    container: HTMLElement,
    view: ViewId = "viewer"
): Promise<Shell> {
    return bootLoader.boot(container, {
        styleSystem: "raw",
        shell: "raw",
        defaultView: view,
        channels: [],
        rememberChoice: false
    });
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default bootLoader;
