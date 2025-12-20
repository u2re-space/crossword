/**
 * Core Utilities Index
 * Standalone utilities with no framework dependencies
 */

// Toast system (re-exported from frontend/shared)
export * from "@rs-frontend/shared/Toast";
export { default as Toast } from "@rs-frontend/shared/Toast";

// Clipboard API (re-exported from frontend/shared)
export * from "@rs-frontend/shared/Clipboard";
export { default as Clipboard } from "@rs-frontend/shared/Clipboard";

// Overlay system (re-exported from frontend/shared)
export * from "@rs-frontend/shared/overlay";

// BroadcastChannel utilities
export * from "./Broadcast";

// Existing utilities
export * from "./AIResponseParser";
export * from "./ImageProcess";
export * from "./PhoneDub";
export * from "./PhoneUtils";
export * from "./TimeUtils";
export * from "./Types";
