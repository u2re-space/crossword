# Phase 1: Custom Properties & Context Modules
**Duration:** Days 1–2  
**Objective:** Centralize CSS custom properties with layer support and context-aware selectors

---

## Overview

Phase 1 establishes the foundation for all subsequent SCSS work by:
1. Creating dedicated custom property modules organized by concern
2. Implementing context-based selectors (`:has()` pseudo-class)
3. Ensuring all properties are wrapped in proper `@layer` directives
4. Aligning with existing `layer-manager.ts` definitions

---

## Step-by-Step Implementation

### Step 1: Audit Current Custom Properties

**Goal:** Identify all `--*` variables currently in use.

**Action:**
```bash
grep -r "^\s*--" apps/CrossWord/src/frontend/shells --include="*.scss" | sort | uniq
grep -r "^\s*--" apps/CrossWord/src/frontend/views --include="*.scss" | sort | uniq
grep -r "^\s*--" apps/CrossWord/src/frontend/styles --include="*.scss" | sort | uniq
```

**Output:** Document in a spreadsheet or notes file:
- Variable name
- Current location
- Used in (shell/view/global)
- Description

**Example findings:**
```
--shell-nav-height          → shells/basic/basic.scss         → Basic shell
--shell-bg                  → shells/basic/basic.scss         → Basic shell
--shell-fg                  → shells/basic/basic.scss         → Basic shell
--shell-nav-bg              → shells/basic/basic.scss         → Basic shell
--shell-nav-border          → shells/basic/basic.scss         → Basic shell
--shell-btn-hover           → shells/basic/basic.scss         → Basic shell
--shell-btn-active-bg       → shells/basic/basic.scss         → Basic shell
--shell-btn-active-fg       → shells/basic/basic.scss         → Basic shell
--shell-status-bg           → shells/basic/basic.scss         → Basic shell
--shell-status-fg           → shells/basic/basic.scss         → Basic shell
(... similar for faint, raw ...)
```

### Step 2: Create Core Properties Structure

**Goal:** Set up the modular properties directory with base files.

**Action A: Create `_context.scss`**

```
/apps/CrossWord/src/frontend/styles/properties/
```

Create file: `_context.scss`

```scss
/**
 * Context-Based Custom Properties
 *
 * Defines CSS variables that change based on shell/view context.
 * Uses :has() pseudo-class to avoid specificity wars and enable
 * automatic cascading when DOM state changes.
 *
 * Wrapped in @layer to respect cascade layer order.
 */

@layer layer.shell.common {
    /**
     * Shell-agnostic tokens available in all shells
     * These are inherited by all child elements
     */
    :root {
        /* Layout dimensions */
        --shell-nav-height-base: 56px;
        --shell-content-gutter: 1rem;
        
        /* Color scheme defaults (light) */
        --shell-bg: #f8f9fa;
        --shell-fg: #1a1a1a;
        --shell-nav-bg: #ffffff;
        --shell-nav-border: #e0e0e0;
    }

    /**
     * Dark mode overrides
     */
    @media (prefers-color-scheme: dark) {
        :root {
            --shell-bg: #1e1e1e;
            --shell-fg: #e0e0e0;
            --shell-nav-bg: #252526;
            --shell-nav-border: #3c3c3c;
        }
    }

    /* ===================================================================== */
    /* SHELL-SPECIFIC CONTEXT SELECTORS                                     */
    /* ===================================================================== */

    /**
     * BasicShell Context
     * Applied when [data-shell="basic"] is present in DOM
     */
    :is(html, body):has([data-shell="basic"]) {
        /* Navigation */
        --shell-nav-height: var(--shell-nav-height-base);
        --shell-btn-hover: rgba(0, 0, 0, 0.05);
        --shell-btn-active-bg: rgba(0, 122, 204, 0.12);
        --shell-btn-active-fg: #007acc;

        /* Status */
        --shell-status-bg: rgba(0, 0, 0, 0.85);
        --shell-status-fg: #ffffff;
    }

    /* Dark mode for BasicShell */
    @media (prefers-color-scheme: dark) {
        :is(html, body):has([data-shell="basic"]) {
            --shell-btn-hover: rgba(255, 255, 255, 0.08);
            --shell-btn-active-bg: rgba(0, 122, 204, 0.25);
            --shell-btn-active-fg: #3794ff;
            --shell-status-bg: rgba(255, 255, 255, 0.15);
            --shell-status-fg: #ffffff;
        }
    }

    /**
     * FaintShell Context
     * Applied when [data-shell="faint"] is present in DOM
     */
    :is(html, body):has([data-shell="faint"]) {
        --shell-nav-height: 40px;
        --shell-sidebar-width: 256px;
        --shell-sidebar-collapsed: 48px;
        --shell-tab-height: 32px;

        /* Faint-specific colors */
        --faint-nav-bg: #f5f5f5;
        --faint-nav-border: #d0d0d0;
        --faint-sidebar-bg: #fafafa;
    }

    @media (prefers-color-scheme: dark) {
        :is(html, body):has([data-shell="faint"]) {
            --faint-nav-bg: #2d2d2d;
            --faint-nav-border: #3c3c3c;
            --faint-sidebar-bg: #252526;
        }
    }

    /**
     * RawShell Context
     * Applied when [data-shell="raw"] is present in DOM
     */
    :is(html, body):has([data-shell="raw"]) {
        --shell-nav-height: 0px; /* No navbar in raw */
        --shell-content-padding: 0;
    }

    /* ===================================================================== */
    /* VIEW-SPECIFIC CONTEXT SELECTORS                                      */
    /* ===================================================================== */

    /**
     * Workcenter View Context
     * Applied when [data-view="workcenter"] is detected
     */
    :is(html, body):has([data-view="workcenter"]) {
        --view-layout: "grid";
        --view-sidebar-visible: true;
        --view-toolbar-expanded: true;
        --view-content-max-width: none;
    }

    /**
     * Viewer View Context
     */
    :is(html, body):has([data-view="viewer"]) {
        --view-layout: "flex";
        --view-content-max-width: 900px;
        --view-font-size-base: 1rem;
        --view-line-height-base: 1.6;
    }

    /**
     * Settings View Context
     */
    :is(html, body):has([data-view="settings"]) {
        --view-layout: "flex";
        --view-sidebar-visible: true;
        --view-content-max-width: 1200px;
    }

    /* Additional views follow same pattern... */

    /* ===================================================================== */
    /* COMBINED SHELL+VIEW CONTEXT                                          */
    /* ===================================================================== */

    /**
     * Workcenter in BasicShell
     * Applies only when both shell=basic AND view=workcenter
     */
    :is(html, body):has([data-shell="basic"] [data-view="workcenter"]) {
        --view-sidebar-position: "right";
        --view-toolbar-alignment: "end";
    }

    /**
     * Viewer in FaintShell
     * Faint shell shows tabbed views, so viewer gets tab styling
     */
    :is(html, body):has([data-shell="faint"] [data-view="viewer"]) {
        --view-tab-active: true;
        --view-tab-height: var(--shell-tab-height);
    }
}

/* ========================================================================= */
/* THEME OVERRIDES                                                         */
/* ========================================================================= */

@layer layer.override.theme {
    /**
     * High contrast mode support
     */
    @media (prefers-contrast: more) {
        :root {
            --shell-nav-border: #000;
            --shell-fg: #000;
        }

        @media (prefers-color-scheme: dark) {
            --shell-nav-border: #fff;
            --shell-fg: #fff;
        }
    }

    /**
     * Reduced motion support
     */
    @media (prefers-reduced-motion: reduce) {
        :root {
            --transition-fast: 0s;
            --transition-normal: 0s;
            --transition-slow: 0s;
        }
    }
}
```

**Action B: Update existing `_shell.scss`**

Move shell-specific variables and consolidate:

```scss
/* apps/CrossWord/src/frontend/styles/properties/_shell.scss */

@layer layer.shell.common {
    :root {
        /* Shared shell dimensions */
        --shell-border-width: 1px;
        --shell-border-radius: 8px;
        --shell-padding-small: 0.5rem;
        --shell-padding-medium: 0.75rem;
        --shell-padding-large: 1rem;
        --shell-gap-small: 0.25rem;
        --shell-gap-medium: 0.5rem;
    }

    /* Navigation button styles */
    :root {
        --shell-btn-padding-y: 0.5rem;
        --shell-btn-padding-x: 0.75rem;
        --shell-btn-border-radius: 4px;
        --shell-btn-font-size: 0.875rem;
        --shell-btn-font-weight: 500;
    }

    /* Status message */
    :root {
        --shell-status-padding-y: 0.75rem;
        --shell-status-padding-x: 1.5rem;
        --shell-status-border-radius: 8px;
        --shell-status-font-size: 0.875rem;
        --shell-status-z-index: 9999;
    }
}
```

**Action C: Create `_tokens.scss`** (if not exists)

```scss
/* apps/CrossWord/src/frontend/styles/properties/_tokens.scss */

@layer layer.tokens {
    :root {
        /* Typography */
        --font-family-base: system-ui, -apple-system, sans-serif;
        --font-family-mono: 'Courier New', monospace;
        
        --font-size-xs: 0.7rem;
        --font-size-sm: 0.8rem;
        --font-size-base: 0.9rem;
        --font-size-lg: 1rem;
        --font-size-xl: 1.25rem;

        --font-weight-normal: 400;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;

        --line-height-tight: 1.2;
        --line-height-normal: 1.5;
        --line-height-relaxed: 1.8;

        /* Spacing */
        --space-xs: 0.25rem;
        --space-sm: 0.5rem;
        --space-md: 0.75rem;
        --space-lg: 1rem;
        --space-xl: 1.25rem;
        --space-2xl: 1.6rem;

        /* Sizing */
        --radius-xs: 0.25rem;
        --radius-sm: 4px;
        --radius-md: 8px;
        --radius-lg: 12px;
        --radius-full: 9999px;

        /* Transitions */
        --transition-fast: 0.15s ease;
        --transition-normal: 0.2s ease;
        --transition-slow: 0.3s ease;

        /* Z-index scale */
        --z-dropdown: 1000;
        --z-sticky: 1020;
        --z-fixed: 1030;
        --z-modal-backdrop: 1040;
        --z-modal: 1050;
        --z-popover: 1060;
        --z-tooltip: 1070;
    }
}
```

**Action D: Update `_index.scss`**

```scss
/* apps/CrossWord/src/frontend/styles/properties/_index.scss */

/**
 * Properties Index
 * 
 * Exports all custom property modules in cascade layer order
 */

@forward "tokens" as tokens-*;
@forward "shell" as shell-*;
@forward "views" as views-*;
@forward "context" as context-*;
```

### Step 3: Update DOM Elements for Context Detection

**Goal:** Ensure shell and view attributes are set on DOM.

**Action A: Update `BaseShell.createLayout()` in `shells/basic/base-shell.ts`**

```typescript
/**
 * Mount shell to container
 */
async mount(container: HTMLElement): Promise<void> {
    if (this.mounted) {
        console.warn(`[${this.id}] Shell already mounted`);
        return;
    }

    this.container = container;

    // Create layout
    this.rootElement = this.createLayout();

    // IMPORTANT: Set shell identifier for context selectors
    this.rootElement.setAttribute('data-shell', this.id);

    // ... rest of mount logic ...

    container.replaceChildren(this.rootElement);
    this.mounted = true;

    console.log(`[${this.id}] Shell mounted with data-shell="${this.id}"`);
}
```

**Action B: Update view switching to set `data-view`**

In `BaseShell.switchView()` or similar:

```typescript
async switchView(viewId: ViewId): Promise<void> {
    // Update content element
    if (this.contentContainer) {
        // Set data-view attribute for context selectors
        this.contentContainer.setAttribute('data-view', viewId);
        
        // Load and mount view
        const view = await this.loadView(viewId);
        this.contentContainer.replaceChildren(view.element);
    }

    this.currentViewElement = view.element;
    console.log(`[${this.id}] Switched to view: ${viewId}`);
}
```

### Step 4: Verify Layer Manager Integration

**Goal:** Ensure `layer-manager.ts` is called early in initialization.

**Action: Update `styles/index.ts`**

```typescript
/**
 * CrossWord Styles Module
 *
 * IMPORTANT: Layer initialization MUST happen before any styles are loaded
 */

import { initializeLayers } from './layer-manager';

// Step 1: Initialize cascade layers (MUST be first)
initializeLayers();

// Step 2: Export layer management utilities
export {
    initializeLayers,
    resetLayers,
    getShellLayer,
    getViewLayer,
    getLayerOrder,
    getLayersByCategory,
    areLayersInitialized,
    getLayerElement,
    LAYERS,
    LAYER_HIERARCHY,
    type LayerCategory,
    type LayerDefinition,
    type LayerName,
    type ShellId,
    type ViewId,
} from './layer-manager';

export { default as LayerManager } from './layer-manager';
```

**Action: Call from app entry point**

In your main app initialization (before rendering):

```typescript
// main.ts or boot.ts
import { initializeLayers } from '@app/styles';

async function bootstrap() {
    // Initialize layers FIRST
    initializeLayers();

    // Then load other styles and render
    await initializeApp();
}
```

### Step 5: Create Mixin Library for Context Selectors

**Goal:** Provide reusable mixins to simplify context-based styling.

**Action: Create `styles/lib/_context-mixins.scss`**

```scss
/**
 * Context-Based Selector Mixins
 *
 * Provides convenient mixins for generating :has() selectors
 * without repeating the selector syntax throughout SCSS files.
 */

/**
 * Apply styles when a shell is active
 * 
 * @param {String} $shell-id - Shell identifier (basic, faint, raw)
 * 
 * @example
 *   @include for-shell("basic") {
 *       .my-class { color: blue; }
 *   }
 */
@mixin for-shell($shell-id) {
    :is(html, body):has([data-shell="#{$shell-id}"]) {
        @content;
    }
}

/**
 * Apply styles when a view is active
 * 
 * @param {String} $view-id - View identifier
 * 
 * @example
 *   @include for-view("workcenter") {
 *       .toolbar { gap: 1rem; }
 *   }
 */
@mixin for-view($view-id) {
    :is(html, body):has([data-view="#{$view-id}"]) {
        @content;
    }
}

/**
 * Apply styles for specific shell + view combination
 * 
 * @param {String} $shell-id - Shell identifier
 * @param {String} $view-id - View identifier
 * 
 * @example
 *   @include for-shell-view("basic", "workcenter") {
 *       .content { display: grid; }
 *   }
 */
@mixin for-shell-view($shell-id, $view-id) {
    :is(html, body):has([data-shell="#{$shell-id}"] [data-view="#{$view-id}"]) {
        @content;
    }
}

/**
 * Apply styles when element has a specific state
 * Useful for ARIA attributes, data attributes, etc.
 * 
 * @param {String} $selector - Attribute selector or pseudo-class
 * 
 * @example
 *   @include when-state("[aria-expanded='true']") {
 *       .sidebar { inline-size: 300px; }
 *   }
 */
@mixin when-state($selector) {
    :is(html, body):has(#{$selector}) {
        @content;
    }
}

/**
 * Low-specificity wrapper for component classes
 * Ensures easy override by user or state-specific rules
 * 
 * @param {String} $selector - Component selector
 * 
 * @example
 *   @include component-styles(".button") {
 *       padding: 0.5rem;
 *   }
 */
@mixin component-styles($selector) {
    :where(#{$selector}) {
        @content;
    }
}

/**
 * Responsive breakpoint for mobile-first design
 * 
 * @param {String} $breakpoint - Media query size (sm, md, lg, xl)
 * 
 * @example
 *   @include respond-to("md") {
 *       .container { max-width: 768px; }
 *   }
 */
@mixin respond-to($breakpoint) {
    $breakpoints: (
        "sm": 640px,
        "md": 768px,
        "lg": 1024px,
        "xl": 1280px,
    );

    @if map-has-key($breakpoints, $breakpoint) {
        @media (min-width: map-get($breakpoints, $breakpoint)) {
            @content;
        }
    } @else {
        @warn "Breakpoint '#{$breakpoint}' not found";
    }
}
```

**Update `styles/lib/_index.scss`:**

```scss
/**
 * Styles Library Index
 * 
 * Exports all mixins and functions
 */

@forward "mixins" as m-*;
@forward "functions" as f-*;
@forward "context-mixins" as ctx-*;
```

### Step 6: Testing & Validation

**Goal:** Ensure all properties are accessible and layers are correct.

**Action A: Create test file**

```scss
/* styles/properties/_test.scss (optional, for dev verification) */

@layer test {
    /* Verify all variables are accessible */
    :root {
        /* Log that variables are loaded */
        --test-shell-bg: var(--shell-bg); /* Should resolve */
        --test-shell-nav-height: var(--shell-nav-height); /* Should resolve */
        --test-font-size-base: var(--font-size-base); /* Should resolve */
    }
}
```

**Action B: Run build**

```bash
npm run build
```

Check for:
- No CSS compilation errors
- Variables resolve correctly
- No warnings about undefined variables

**Action C: Dev server test**

```bash
npm run dev
```

Inspect browser:
1. Open DevTools → Elements
2. Select `<html>` element
3. Check Styles panel
4. Verify all `--*` variables are visible
5. Switch shells (if possible via UI) and verify context selectors update

### Step 7: Document Property Usage

**Goal:** Create reference guide for developers.

**Action: Create `docs/CSS_PROPERTIES_GUIDE.md`**

```markdown
# Custom Properties Reference

## How Context Selectors Work

When `[data-shell="basic"]` is added to the DOM, all CSS custom properties 
in the `:is(html, body):has([data-shell="basic"])` selector activate automatically.

This cascades to all child elements without needing additional CSS or JavaScript.

## Available Properties

### Shell Properties

- `--shell-nav-height` - Navigation bar height
- `--shell-bg` - Shell background color
- `--shell-fg` - Shell text color
- etc.

### View Properties

- `--view-layout` - Layout type (grid, flex)
- `--view-sidebar-visible` - Sidebar visibility
- etc.

## Usage in SCSS

```scss
@layer layer.shell.basic {
    .shell-basic__nav {
        block-size: var(--shell-nav-height);
        background-color: var(--shell-nav-bg);
    }
}
```

## Dynamic Updates

When the DOM changes:

```javascript
// Switching shells
rootElement.setAttribute('data-shell', 'faint');
// CSS variables automatically update via :has() selector

// Switching views
contentElement.setAttribute('data-view', 'workcenter');
// CSS variables automatically update
```

No JavaScript variable updates needed!
```

---

## Summary

Phase 1 establishes:
✅ Centralized custom property modules  
✅ Context-based selectors using `:has()`  
✅ Proper `@layer` wrapping  
✅ Mixin library for common patterns  
✅ DOM integration for automatic cascading  

**Next:** Phase 2 will refactor individual shell SCSS files to use these properties.
