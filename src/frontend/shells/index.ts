/**
 * Shell System - Main Entry Point
 *
 * Provides shell management, view registry, and initialization utilities.
 */

export * from "./types";
export * from "../registry";
export * from "./basic/ts/base-shell";

// Default exports for convenience
export { ShellRegistry, ViewRegistry, getDefaultBootConfig } from "../registry";
export { BaseShell } from "./basic/ts/base-shell";
