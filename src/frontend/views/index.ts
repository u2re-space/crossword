/**
 * Views Module
 * 
 * Central export point for all view components.
 * Views are shell-agnostic content components that can be
 * loaded into any shell.
 */

// ============================================================================
// VIEW TYPES
// ============================================================================

export * from "./types";

// ============================================================================
// VIEW UTILITIES
// ============================================================================

// Channel mixin for view connectivity
export * from "./ViewChannelMixin";

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

// WorkCenter - AI processing view
export { WorkCenterView, createWorkCenterView } from "./workcenter";
export type { WorkCenterOptions } from "./workcenter";

// Settings - Application configuration view
export { SettingsView, createSettingsView } from "./settings";
export type { SettingsViewOptions, AppSettings, ThemeSettings, AISettings, GeneralSettings } from "./settings";

// Viewer - Document viewer
export { ViewerView, createViewerView } from "./viewer";
export type { ViewerOptions, ViewerDocument } from "./viewer";

// Editor - Document editor
export { EditorView, createEditorView } from "./editor";
export type { EditorOptions, EditorDocument } from "./editor";

// Explorer - File browser
export { ExplorerView, createExplorerView } from "./explorer";
export type { ExplorerOptions, FileItem, FolderItem } from "./explorer";

// History - View history
export { HistoryView, createHistoryView } from "./history";
export type { HistoryViewOptions, HistoryEntry } from "./history";

// Home - Landing/dashboard view  
export { HomeView, createHomeView } from "./home";
export type { HomeViewOptions } from "./home";

// Print - Print-optimized view
export { PrintView, createPrintView } from "./print";
export type { PrintViewOptions } from "./print";

// Airpad - Quick note view
export { AirpadView, createAirpadView } from "./airpad";
export type { AirpadViewOptions } from "./airpad";

// ============================================================================
// VIEW REGISTRY HELPERS
// ============================================================================

/**
 * View factory function type
 */
export type ViewFactory<T = unknown> = (options?: T) => Promise<import("./types").BaseViewOptions>;

/**
 * Get all available view IDs
 */
export function getAvailableViews(): string[] {
    return [
        "workcenter",
        "settings", 
        "viewer",
        "editor",
        "explorer",
        "history",
        "home",
        "print",
        "airpad"
    ];
}
