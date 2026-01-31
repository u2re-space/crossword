/**
 * <rs-explorer> Web Component
 * 
 * Re-exports from fest/fl-ui unified components.
 * This module is kept for backwards compatibility.
 * 
 * Usage:
 *   <rs-explorer></rs-explorer>
 *   <rs-explorer path="/" show-hidden></rs-explorer>
 * 
 * See fest/fl-ui/ui/components/viewers/rs-explorer for implementation.
 */

// Re-export the unified RsExplorer component from fl.ui
export { RsExplorerElement, RsExplorer as default } from "fest/fl-ui/ui/components/viewers";
export type { FileItem, ExplorerState } from "fest/fl-ui/ui/components/viewers";

// Re-export FileManager components from fl.ui
export { FileManager, FileManagerContent } from "fest/fl-ui/services/file-manager/FileManager";
export type { FileOperative, FileEntryItem, EntryKind } from "fest/fl-ui/services/file-manager/Operative";
