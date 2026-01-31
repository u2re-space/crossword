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
export { MdViewElement, RsExplorerElement, RsExplorer } from "fest/fl-ui/ui/components/viewers";
export type { FileItem, ExplorerState } from "fest/fl-ui/ui/components/viewers";

// Re-export file manager from fl.ui
export { FileManager, FileManagerContent } from "fest/fl-ui/services/file-manager/FileManager";

// Provide default exports for backwards compatibility
export { RsExplorer as default } from "fest/fl-ui/ui/viewers";
