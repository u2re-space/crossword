/**
 * Shell System - Main Entry Point
 *
 * Provides shell management, view registry, and initialization utilities.
 */

export * from "./types";
export * from "@rs-frontend/registry";
export * from "./minimal/ts/base-shell";

// Default exports for convenience
export { ShellRegistry, ViewRegistry, getDefaultBootConfig } from "@rs-frontend/registry";
export { BaseShell } from "./minimal/ts/base-shell";
