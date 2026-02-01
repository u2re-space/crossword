/**
 * Shared Web Components
 *
 * Self-contained web components with encapsulated styles.
 * Each component uses Shadow DOM for style isolation.
 *
 * Note: Components are now unified in fest/fl-ui library.
 * This file re-exports them for backwards compatibility.
 */

// Re-export viewers from fl.ui
export { RsExplorerElement } from "fest/fl-ui";
export type { FileItem, ExplorerState } from "fest/fl-ui";

// Re-export file manager from fl.ui
export { FileManager, FileManagerContent } from "fest/fl-ui";
