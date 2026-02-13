/**
 * CRX Frontend Entry Point
 *
 * Entry point for Chrome extension pages (settings, newtab, viewer, etc.).
 * Uses the Raw shell (no toolbar / tabs / navigation chrome).
 * Loads basic styles and lets each view manage its own styling.
 *
 * Usage:
 *   import crxFrontend from "./crx-entry";
 *   crxFrontend(document.getElementById("app")!, { initialView: "settings" });
 */

import { bootLoader } from "./BootLoader";
import type { ViewId, Shell } from "../shells/types";

// ============================================================================
// TYPES
// ============================================================================

export type CrxAppOptions = {
    /** View to display - accepts both shell ViewId and legacy BasicView names */
    initialView?: ViewId | "markdown" | "markdown-viewer";
};

// ============================================================================
// VIEW NAME MAPPING
// ============================================================================

/**
 * Map legacy / CRX-specific view names → canonical ViewId
 */
const CRX_VIEW_MAP: Record<string, ViewId> = {
    "markdown":         "viewer",
    "markdown-viewer":  "viewer",
};

const resolveViewId = (input?: string): ViewId =>
    (input && CRX_VIEW_MAP[input]) ?? (input as ViewId) ?? "viewer";

// ============================================================================
// ENTRY POINT
// ============================================================================

/**
 * Mount the frontend for a Chrome extension page.
 *
 * - Uses the **raw** shell (no toolbar, no tabs).
 * - Loads "basic" style system (shell + view own styles handle the rest).
 * - No channels or preference persistence (CRX pages are single-purpose).
 *
 * @param mountElement - DOM element to mount into
 * @param options      - Optional view configuration
 * @returns The mounted shell instance
 */
export default async function crxFrontend(
    mountElement: HTMLElement,
    options: CrxAppOptions = {},
): Promise<Shell> {
    const view = resolveViewId(options.initialView);

    return bootLoader.boot(mountElement, {
        styleSystem: "basic",
        shell:       "raw",
        defaultView: view,
        channels:    [],
        rememberChoice: false,
    });
}

export { crxFrontend };
