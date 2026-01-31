/**
 * <md-view> Web Component
 * 
 * Re-exports from fest/fl-ui unified components.
 * This module is kept for backwards compatibility.
 * 
 * Usage:
 *   <md-view content="# Hello World"></md-view>
 *   <md-view src="/path/to/file.md"></md-view>
 * 
 * See fest/fl-ui/services/markdown-view for implementation.
 */

// Re-export MarkdownView component from fl.ui
export { MarkdownView as MdViewElement, MarkdownView as default } from "fest/fl-ui/services/markdown-view/Markdown";
