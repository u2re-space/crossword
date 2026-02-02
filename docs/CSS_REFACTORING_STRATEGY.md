# CrossWord CSS/SCSS Refactoring Strategy

> **Status:** Planning Phase  
> **Created:** 2026-02-02  
> **Scope:** 47 SCSS files, 3 shells, 10+ views

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [DOM/Element Tree Organization](#2-domelement-tree-organization)
3. [Script-Based Layer Generation (TypeScript)](#3-script-based-layer-generation-typescript)
4. [SCSS Module Migration (@import → @use)](#4-scss-module-migration-import--use)
5. [Unified @layer Strategy](#5-unified-layer-strategy)
6. [Custom Properties Modules](#6-custom-properties-modules)
7. [Context-Based Selectors (:has, :is, :where)](#7-context-based-selectors-has-is-where)
8. [Loading Order Strategy](#8-loading-order-strategy)
9. [Layer Naming Conventions](#9-layer-naming-conventions)
10. [Style Cleanup & Optimization](#10-style-cleanup--optimization)
11. [SCSS Library Refactoring](#11-scss-library-refactoring)
12. [Broken SCSS Repair Strategy](#12-broken-scss-repair-strategy)
13. [Implementation Phases](#13-implementation-phases)
14. [Verification & Testing](#14-verification--testing)
15. [Code Examples & Templates](#15-code-examples--templates)

---

## 1. Overview & Goals

### 1.1 Current State Analysis

| Metric | Value |
|--------|-------|
| Total SCSS files | 47 |
| Files using @layer | 31 |
| Files using @import | 1 |
| Files using @use | ~20 |
| Shells | 3 (basic, faint, raw) |
| Views | 10+ |

### 1.2 Goals

1. **Multi-Agent Coordination** - Enable AI agents to work on different code regions independently
2. **Script-Based Layer Generation** - TypeScript managers for proper @layer initialization
3. **Modern SCSS** - Use `@use` instead of `@import` everywhere
4. **Consistent @layer Wrapping** - All styles wrapped in appropriate layers
5. **Custom Properties Isolation** - Dedicated modules for CSS variables
6. **Context-Based Isolation** - Use `:has()` for shell/view conflict prevention
7. **Correct Loading Order** - System → Runtime → Shell → View
8. **Better Layer Naming** - Semantic, hierarchical names
9. **Cleanup & Optimization** - Remove duplicates, reduce redundancy
10. **Modern Selectors** - Use `:where()`, `:is()` for specificity control

---

## 2. DOM/Element Tree Organization

### 2.1 Application Shell Hierarchy

```
document
├── html
│   ├── head
│   │   └── <style> (adopted stylesheets / injected CSS)
│   └── body
│       └── #app (mount point)
│           └── .shell-{basic|faint|raw}[data-shell][data-theme]
│               ├── nav/sidebar (shell-specific)
│               ├── main.shell-{id}__content[data-shell-content]
│               │   └── .view-{viewer|workcenter|...}[data-view]
│               │       └── (view-specific content)
│               └── status bar (shell-specific)
```

### 2.2 TypeScript Module → DOM Generation Map

| Module | Generates | Layer |
|--------|-----------|-------|
| `shells/basic/index.ts` | `.shell-basic` tree | `layer.shell.basic` |
| `shells/faint/index.ts` | `.shell-faint` tree | `layer.shell.faint` |
| `shells/raw/index.ts` | `.shell-raw` tree | `layer.shell.raw` |
| `views/viewer/index.ts` | `.view-viewer` tree | `layer.view.viewer` |
| `views/workcenter/index.ts` | `.view-workcenter` tree | `layer.view.workcenter` |
| `views/settings/index.ts` | `.view-settings` tree | `layer.view.settings` |
| `views/explorer/index.ts` | `.view-explorer` tree | `layer.view.explorer` |
| `views/history/index.ts` | `.view-history` tree | `layer.view.history` |
| `views/editor/index.ts` | `.view-editor` tree | `layer.view.editor` |
| `views/airpad/index.ts` | `.view-airpad` tree | `layer.view.airpad` |

### 2.3 Element Generation Patterns (LUR-E/DOM)

```typescript
// Shell creates root with data attributes for CSS scoping
const shell = H`
    <div class="shell-basic" 
         data-shell="basic" 
         data-theme="${theme}">
        <!-- shell content -->
    </div>
` as HTMLElement;

// View creates content with data attributes
const view = H`
    <div class="view-viewer" data-view="viewer">
        <!-- view content -->
    </div>
` as HTMLElement;
```

---

## 3. Script-Based Layer Generation (TypeScript)

### 3.1 Layer Manager Architecture

```
src/frontend/
├── styles/
│   ├── layer-manager.ts       # Core layer initialization
│   ├── runtime-layers.ts      # Runtime/system layers
│   ├── shell-layers.ts        # Shell-specific layers
│   └── view-layers.ts         # View-specific layers
```

### 3.2 Core Layer Manager Implementation

```typescript
// src/frontend/styles/layer-manager.ts

/**
 * CSS Layer Manager
 * 
 * Ensures correct @layer order by injecting layer declarations
 * before any other styles are loaded.
 */

export type LayerCategory = 'system' | 'runtime' | 'shell' | 'view' | 'override';

export interface LayerDefinition {
    name: string;
    category: LayerCategory;
    order: number;
}

// Unified layer hierarchy - ORDER MATTERS!
export const LAYER_HIERARCHY: LayerDefinition[] = [
    // === SYSTEM LAYERS (order 0-99) ===
    { name: 'layer.reset', category: 'system', order: 0 },
    { name: 'layer.normalize', category: 'system', order: 10 },
    { name: 'layer.tokens', category: 'system', order: 20 },
    
    // === RUNTIME LAYERS (order 100-199) ===
    { name: 'layer.runtime.base', category: 'runtime', order: 100 },
    { name: 'layer.runtime.components', category: 'runtime', order: 110 },
    { name: 'layer.runtime.utilities', category: 'runtime', order: 120 },
    { name: 'layer.runtime.animations', category: 'runtime', order: 130 },
    
    // === SHELL LAYERS (order 200-299) ===
    { name: 'layer.shell.common', category: 'shell', order: 200 },
    { name: 'layer.shell.raw', category: 'shell', order: 210 },
    { name: 'layer.shell.basic', category: 'shell', order: 220 },
    { name: 'layer.shell.faint', category: 'shell', order: 230 },
    
    // === VIEW LAYERS (order 300-399) ===
    { name: 'layer.view.common', category: 'view', order: 300 },
    { name: 'layer.view.viewer', category: 'view', order: 310 },
    { name: 'layer.view.workcenter', category: 'view', order: 320 },
    { name: 'layer.view.settings', category: 'view', order: 330 },
    { name: 'layer.view.explorer', category: 'view', order: 340 },
    { name: 'layer.view.history', category: 'view', order: 350 },
    { name: 'layer.view.editor', category: 'view', order: 360 },
    { name: 'layer.view.airpad', category: 'view', order: 370 },
    { name: 'layer.view.home', category: 'view', order: 380 },
    
    // === OVERRIDE LAYERS (order 900-999) ===
    { name: 'layer.override.theme', category: 'override', order: 900 },
    { name: 'layer.override.print', category: 'override', order: 910 },
    { name: 'layer.override.a11y', category: 'override', order: 920 },
];

let _initialized = false;

/**
 * Initialize CSS layer order
 * MUST be called before any other styles are loaded
 */
export function initializeLayers(): void {
    if (_initialized) {
        console.warn('[LayerManager] Already initialized');
        return;
    }

    const sortedLayers = [...LAYER_HIERARCHY].sort((a, b) => a.order - b.order);
    const layerNames = sortedLayers.map(l => l.name);
    
    // Create @layer declaration
    const layerRule = `@layer ${layerNames.join(', ')};`;
    
    // Inject as first stylesheet
    const style = document.createElement('style');
    style.id = 'css-layer-init';
    style.textContent = layerRule;
    
    // Insert at the beginning of <head>
    const head = document.head;
    head.insertBefore(style, head.firstChild);
    
    _initialized = true;
    console.log('[LayerManager] Layers initialized:', layerNames.length);
}

/**
 * Get layer name for a shell
 */
export function getShellLayer(shellId: 'basic' | 'faint' | 'raw'): string {
    return `layer.shell.${shellId}`;
}

/**
 * Get layer name for a view
 */
export function getViewLayer(viewId: string): string {
    return `layer.view.${viewId}`;
}

/**
 * Check if layers are initialized
 */
export function areLayersInitialized(): boolean {
    return _initialized;
}
```

### 3.3 Integration in Application Bootstrap

```typescript
// src/index.ts (application entry point)

import { initializeLayers } from './frontend/styles/layer-manager';

export default async function index(mountElement: HTMLElement) {
    // CRITICAL: Initialize layer order FIRST, before any styles
    initializeLayers();
    
    // ... rest of initialization
    await ensureAppCss();
    // ...
}
```

### 3.4 Shell-Specific Layer Loading

```typescript
// src/frontend/shells/basic/index.ts

import { getShellLayer } from '../../styles/layer-manager';

// Import style with inline modifier
import style from './basic.scss?inline';

export class BasicShell extends BaseShell {
    protected getStylesheet(): string | null {
        // Style is already wrapped in @layer layer.shell.basic
        return style;
    }
}
```

---

## 4. SCSS Module Migration (@import → @use)

### 4.1 Files Requiring Migration

| File | Current | Target |
|------|---------|--------|
| `workcenter/scss/_animations.scss` | `@import` | `@use` |

### 4.2 Migration Pattern

**Before:**
```scss
@import "keyframes";
@import "../../lib/mixins";
```

**After:**
```scss
@use "keyframes" as kf;
@use "../../lib/mixins" as mix;

// Usage changes:
// @include button-style → @include mix.button-style
// $spin-animation → kf.$spin-animation
```

### 4.3 @use Module Structure Template

```scss
// _module.scss

// === DEPENDENCIES ===
@use "sass:math";
@use "sass:color";
@use "sass:list";

// === INTERNAL IMPORTS ===
@use "../tokens" as t;
@use "../mixins" as mix;

// === FORWARD PUBLIC API (if needed by other modules) ===
// @forward "tokens" show $primary-color, $spacing-md;

// === PRIVATE VARIABLES ===
$_internal-var: 16px;

// === PUBLIC VARIABLES ===
$public-var: $_internal-var * 2 !default;

// === MIXINS ===
@mixin component-style {
    padding: t.$spacing-md;
    @include mix.focus-ring;
}
```

---

## 5. Unified @layer Strategy

### 5.1 Layer Hierarchy

```
@layer layer.reset,           /* Browser reset */
       layer.normalize,       /* Normalize defaults */
       layer.tokens,          /* CSS custom properties */
       layer.runtime.base,    /* Runtime base styles */
       layer.runtime.components,
       layer.runtime.utilities,
       layer.runtime.animations,
       layer.shell.common,    /* Shared shell styles */
       layer.shell.raw,
       layer.shell.basic,
       layer.shell.faint,
       layer.view.common,     /* Shared view styles */
       layer.view.viewer,
       layer.view.workcenter,
       layer.view.settings,
       layer.view.explorer,
       layer.view.history,
       layer.view.editor,
       layer.view.airpad,
       layer.view.home,
       layer.override.theme,  /* Theme overrides */
       layer.override.print,  /* Print styles */
       layer.override.a11y;   /* Accessibility overrides */
```

### 5.2 File-to-Layer Mapping

| File | Layer |
|------|-------|
| `shells/basic/basic.scss` | `@layer layer.shell.basic` |
| `shells/basic/layout.scss` | `@layer layer.shell.basic` |
| `shells/basic/_components.scss` | `@layer layer.shell.basic` |
| `shells/faint/faint.scss` | `@layer layer.shell.faint` |
| `shells/raw/raw.scss` | `@layer layer.shell.raw` |
| `views/viewer/viewer.scss` | `@layer layer.view.viewer` |
| `views/workcenter/scss/*.scss` | `@layer layer.view.workcenter` |
| `views/settings/Settings.scss` | `@layer layer.view.settings` |

### 5.3 Layer Wrapping Template

```scss
// Shell SCSS file template
@layer layer.shell.basic {
    // All styles inside layer
    .shell-basic {
        // ...
    }
}

// View SCSS file template  
@layer layer.view.viewer {
    // All styles inside layer
    .view-viewer {
        // ...
    }
}
```

---

## 6. Custom Properties Modules

### 6.1 Properties Module Structure

```
src/frontend/styles/
├── properties/
│   ├── _index.scss           # Main entry, forwards all
│   ├── _colors.scss          # Color tokens
│   ├── _spacing.scss         # Spacing tokens
│   ├── _typography.scss      # Typography tokens
│   ├── _layout.scss          # Layout tokens
│   ├── _animation.scss       # Animation tokens
│   ├── _z-index.scss         # Z-index tokens
│   └── _shell-tokens.scss    # Shell-specific tokens
```

### 6.2 Properties Module Template

```scss
// properties/_colors.scss
@layer layer.tokens {
    :root {
        // === PRIMARY PALETTE ===
        --color-primary: oklch(54% 0.22 250);
        --color-primary-light: oklch(70% 0.18 250);
        --color-primary-dark: oklch(40% 0.24 250);
        
        // === SURFACE COLORS ===
        --color-surface: #ffffff;
        --color-surface-elevated: #fafafa;
        --color-on-surface: #1a1a1a;
        
        // === SEMANTIC COLORS ===
        --color-success: oklch(65% 0.2 145);
        --color-warning: oklch(75% 0.18 85);
        --color-error: oklch(55% 0.25 25);
        
        // === BORDER COLORS ===
        --color-border: rgba(0, 0, 0, 0.1);
        --color-border-strong: rgba(0, 0, 0, 0.2);
    }
    
    // Dark theme via data attribute
    [data-theme="dark"]:root,
    :root:has([data-theme="dark"]) {
        --color-surface: #1e1e1e;
        --color-surface-elevated: #252526;
        --color-on-surface: #e0e0e0;
        --color-border: rgba(255, 255, 255, 0.1);
        --color-border-strong: rgba(255, 255, 255, 0.2);
    }
}
```

### 6.3 Shell-Specific Properties

```scss
// properties/_shell-tokens.scss
@layer layer.tokens {
    // Basic shell tokens
    :root:has(.shell-basic) {
        --shell-nav-height: 56px;
        --shell-nav-bg: var(--color-surface);
        --shell-nav-border: var(--color-border);
    }
    
    // Faint shell tokens
    :root:has(.shell-faint) {
        --shell-sidebar-width: 240px;
        --shell-sidebar-width-collapsed: 56px;
        --shell-tabs-height: 40px;
    }
    
    // Raw shell tokens (minimal)
    :root:has(.shell-raw) {
        --shell-content-padding: 0;
    }
}
```

---

## 7. Context-Based Selectors (:has, :is, :where)

### 7.1 Shell Isolation via :has()

```scss
// Prevent shell style conflicts
@layer layer.shell.basic {
    // Only apply when basic shell is active
    :root:has(.shell-basic) {
        // Shell-specific root styles
        --current-shell: 'basic';
    }
    
    // Shell body rules
    body:has(.shell-basic) {
        overflow: hidden;
        margin: 0;
    }
    
    // Shell HTML rules
    html:has(.shell-basic) {
        color-scheme: light dark;
    }
}

@layer layer.shell.faint {
    :root:has(.shell-faint) {
        --current-shell: 'faint';
    }
    
    body:has(.shell-faint) {
        overflow: hidden;
        margin: 0;
    }
}
```

### 7.2 View Isolation via :has()

```scss
// View-specific rules that don't leak
@layer layer.view.viewer {
    // Only when viewer is active
    :root:has(.view-viewer) {
        --view-current: 'viewer';
    }
}

@layer layer.view.workcenter {
    :root:has(.view-workcenter) {
        --view-current: 'workcenter';
    }
}
```

### 7.3 Using :where() for Low Specificity

```scss
@layer layer.view.viewer {
    // Zero specificity wrapper - easily overridable
    :where(.view-viewer) {
        display: flex;
        flex-direction: column;
        
        :where(.view-viewer__toolbar) {
            // Low specificity styles
        }
        
        :where(.view-viewer__content) {
            flex: 1;
        }
    }
}
```

### 7.4 Using :is() for Selector Grouping

```scss
@layer layer.runtime.components {
    // Group similar selectors
    :is(button, .btn, [role="button"]) {
        cursor: pointer;
        user-select: none;
        
        &:is(:disabled, [aria-disabled="true"]) {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
    
    // Form elements grouping
    :is(input, textarea, select):not([type="checkbox"]):not([type="radio"]) {
        padding: var(--input-padding);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
    }
}
```

---

## 8. Loading Order Strategy

### 8.1 CSS Loading Sequence

```
1. [LAYER INIT]      → layer-manager.ts injects @layer order
2. [SYSTEM]          → normalize, reset (optional)
3. [TOKENS]          → custom properties modules
4. [RUNTIME]         → veela runtime styles (advanced/basic)
5. [SHELL COMMON]    → shared shell styles
6. [ACTIVE SHELL]    → current shell styles (basic/faint/raw)
7. [VIEW COMMON]     → shared view styles
8. [ACTIVE VIEW]     → current view styles
9. [OVERRIDES]       → theme, print, a11y overrides
```

### 8.2 TypeScript Loading Implementation

```typescript
// src/frontend/main/routing.ts

import { initializeLayers } from '../styles/layer-manager';
import { loadStyleSystem } from '../views/styles';
import { loadShellStyles } from '../shells';

export async function loadSubAppWithShell(
    shellId: 'basic' | 'faint' | 'raw',
    viewId: ViewId
): Promise<AppLoaderResult> {
    
    // 1. Initialize layer order (idempotent)
    initializeLayers();
    
    // 2. Load runtime/system styles
    await loadStyleSystem('veela-advanced');
    
    // 3. Load shell styles
    await loadShellStyles(shellId);
    
    // 4. Load view styles (lazy)
    const shell = await ShellRegistry.load(shellId, container);
    const view = await ViewRegistry.load(viewId);
    
    return { shell, view };
}
```

### 8.3 Adopted Stylesheets Pattern

```typescript
// Use CSSStyleSheet API for proper layer ordering
async function loadStyles(css: string, layerName: string): Promise<void> {
    const sheet = new CSSStyleSheet();
    await sheet.replace(css);
    document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        sheet
    ];
}
```

---

## 9. Layer Naming Conventions

### 9.1 Naming Rules

| Pattern | Example | Purpose |
|---------|---------|---------|
| `layer.{category}` | `layer.reset` | Top-level system layers |
| `layer.{category}.{subcategory}` | `layer.runtime.base` | Categorized runtime layers |
| `layer.shell.{shellId}` | `layer.shell.basic` | Shell-specific layers |
| `layer.view.{viewId}` | `layer.view.viewer` | View-specific layers |
| `layer.override.{type}` | `layer.override.theme` | Override layers |

### 9.2 Reserved Layer Names

| Name | Purpose |
|------|---------|
| `layer.reset` | CSS reset rules |
| `layer.normalize` | Normalize browser defaults |
| `layer.tokens` | CSS custom properties only |
| `layer.runtime.base` | Framework base styles |
| `layer.runtime.components` | Reusable components |
| `layer.runtime.utilities` | Utility classes |
| `layer.runtime.animations` | Keyframes and animations |
| `layer.shell.common` | Shared shell styles |
| `layer.view.common` | Shared view styles |
| `layer.override.theme` | Theme customizations |
| `layer.override.print` | Print styles |
| `layer.override.a11y` | Accessibility enhancements |

---

## 10. Style Cleanup & Optimization

### 10.1 Duplicate Detection

**Files with known duplicates:**
- `workcenter/scss/_layout.scss` - duplicate `.workcenter-content` block
- `workcenter/scss/_header.scss` - duplicate header definitions
- `workcenter/scss/_prompts.scss` - duplicate keyframes
- `workcenter/scss/_results.scss` - duplicate sections
- `workcenter/scss/_animations.scss` - duplicate modal blocks

### 10.2 Cleanup Strategy

1. **Extract shared keyframes** → `_keyframes.scss`
2. **Remove exact duplicates** → Keep canonical definition
3. **Merge similar selectors** → Use `:is()` grouping
4. **Consolidate custom properties** → Move to properties modules
5. **Remove unused styles** → Verify via CSS coverage tools

### 10.3 Selector Regrouping Pattern

**Before:**
```scss
.btn-primary { color: blue; padding: 8px; }
.btn-secondary { color: gray; padding: 8px; }
.btn-danger { color: red; padding: 8px; }
```

**After:**
```scss
:is(.btn-primary, .btn-secondary, .btn-danger) {
    padding: 8px;
}
.btn-primary { color: blue; }
.btn-secondary { color: gray; }
.btn-danger { color: red; }
```

---

## 11. SCSS Library Refactoring

### 11.1 Mixins Organization

```scss
// _mixins.scss - using @use module pattern

@use "sass:math";

// === LAYOUT MIXINS ===
@mixin flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

@mixin flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

@mixin absolute-fill {
    position: absolute;
    inset: 0;
}

// === INTERACTION MIXINS ===
@mixin focus-ring($color: var(--color-primary)) {
    &:focus-visible {
        outline: 2px solid $color;
        outline-offset: 2px;
    }
}

@mixin hover-lift($amount: -2px) {
    transition: transform 0.15s ease;
    &:hover {
        transform: translateY($amount);
    }
}

// === TYPOGRAPHY MIXINS ===
@mixin text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@mixin text-clamp($lines: 2) {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

// === RESPONSIVE MIXINS ===
@mixin breakpoint($size) {
    @if $size == 'sm' {
        @media (max-width: 640px) { @content; }
    } @else if $size == 'md' {
        @media (max-width: 768px) { @content; }
    } @else if $size == 'lg' {
        @media (max-width: 1024px) { @content; }
    } @else if $size == 'xl' {
        @media (max-width: 1280px) { @content; }
    }
}
```

### 11.2 Functions Organization

```scss
// _functions.scss

@use "sass:math";
@use "sass:color";

// === SPACING FUNCTIONS ===
@function space($multiplier: 1) {
    @return calc(var(--space-unit, 0.25rem) * #{$multiplier});
}

// === COLOR FUNCTIONS ===
@function alpha($color, $opacity) {
    @return color.change($color, $alpha: $opacity);
}

// === SIZE FUNCTIONS ===
@function rem($px) {
    @return math.div($px, 16) * 1rem;
}
```

---

## 12. Broken SCSS Repair Strategy

### 12.1 Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Unclosed blocks | Compile error | Add missing `}` |
| Missing semicolons | Property not applied | Add `;` |
| Invalid nesting | Unexpected selector | Flatten or restructure |
| Circular imports | Stack overflow | Use @use with namespaces |
| Undefined variables | Compile error | Import proper module |

### 12.2 Repair Checklist

1. [ ] Verify all `{` have matching `}`
2. [ ] Ensure properties end with `;`
3. [ ] Check nesting depth (max 3 levels recommended)
4. [ ] Verify @use imports resolve correctly
5. [ ] Test compile with `sass --style=expanded`

---

## 13. Implementation Phases

### Phase 1: Foundation (Days 1-3)

- [ ] Create `layer-manager.ts` with layer initialization
- [ ] Define unified layer hierarchy
- [ ] Create properties modules structure
- [ ] Update entry point to initialize layers first

### Phase 2: Shell Migration (Days 4-6)

- [ ] Migrate basic shell to new layer structure
- [ ] Migrate faint shell to new layer structure
- [ ] Migrate raw shell to new layer structure
- [ ] Add :has() context selectors for shell isolation

### Phase 3: View Migration (Days 7-10)

- [ ] Migrate viewer to layer.view.viewer
- [ ] Migrate workcenter (cleanup duplicates first)
- [ ] Migrate settings, explorer, history
- [ ] Migrate editor, airpad, home

### Phase 4: Cleanup & Optimization (Days 11-13)

- [ ] Remove all @import, use @use everywhere
- [ ] Consolidate custom properties
- [ ] Remove duplicate styles
- [ ] Regroup selectors with :is()/:where()
- [ ] Final testing and validation

---

## 14. Verification & Testing

### 14.1 Build Verification

```bash
# Full build
npm run build

# Dev mode (watch for errors)
npm run dev

# Chrome extension build
npm run build:crx
```

### 14.2 Visual Regression Testing

1. Test all shells (basic, faint, raw)
2. Test all views in each shell
3. Test responsive breakpoints: 480px, 768px, 1024px, 1280px
4. Test dark/light theme switching
5. Test print preview

### 14.3 Layer Order Verification

```javascript
// In browser console
Array.from(document.styleSheets)
    .filter(s => s.cssRules)
    .flatMap(s => Array.from(s.cssRules))
    .filter(r => r instanceof CSSLayerStatementRule)
    .forEach(r => console.log(r.cssText));
```

---

## 15. Code Examples & Templates

### 15.1 Complete Shell SCSS Template

```scss
// shells/basic/basic.scss

@use "../shared/mixins" as mix;
@use "../shared/tokens" as t;

@layer layer.shell.basic {
    // Shell root styles
    .shell-basic {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        background-color: var(--shell-bg);
        color: var(--shell-fg);
        
        // Theme variants
        &[data-theme="dark"] {
            --shell-bg: #1e1e1e;
            --shell-fg: #e0e0e0;
        }
        
        &[data-theme="light"] {
            --shell-bg: #f8f9fa;
            --shell-fg: #1a1a1a;
        }
    }
    
    // Navigation
    .shell-basic__nav {
        @include mix.flex-between;
        block-size: var(--shell-nav-height);
        padding-inline: var(--space-md);
        background-color: var(--shell-nav-bg);
        border-block-end: 1px solid var(--shell-nav-border);
    }
    
    // Content area
    .shell-basic__content {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        
        > * {
            flex: 1;
            overflow: auto;
        }
    }
    
    // Status bar
    .shell-basic__status {
        // ...
    }
}
```

### 15.2 Complete View SCSS Template

```scss
// views/viewer/viewer.scss

@use "sass:color";
@use "../../shared/mixins" as mix;

@layer layer.view.viewer {
    .view-viewer {
        display: flex;
        flex-direction: column;
        block-size: 100%;
        background-color: var(--view-bg, var(--color-surface));
        color: var(--view-fg, var(--color-on-surface));
    }
    
    // Toolbar using :where for low specificity
    :where(.view-viewer__toolbar) {
        @include mix.flex-between;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background-color: var(--view-toolbar-bg);
        border-block-end: 1px solid var(--view-border);
    }
    
    // Buttons using :is() for grouping
    :is(.view-viewer__btn, .view-viewer__action) {
        @include mix.focus-ring;
        padding: var(--space-sm) var(--space-md);
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        cursor: pointer;
        
        &:hover {
            background-color: rgba(0, 0, 0, 0.06);
        }
    }
    
    // Content area
    .view-viewer__content {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-lg) var(--space-xl);
    }
    
    // Dark theme via parent attribute
    :where([data-theme="dark"]) .view-viewer {
        --view-bg: #1e1e1e;
        --view-fg: #e0e0e0;
        --view-border: rgba(255, 255, 255, 0.1);
    }
}
```

### 15.3 Properties Module Template

```scss
// styles/properties/_index.scss

@forward "colors";
@forward "spacing";
@forward "typography";
@forward "layout";
@forward "animation";
@forward "z-index";
@forward "shell-tokens";
```

```scss
// styles/properties/_spacing.scss

@layer layer.tokens {
    :root {
        // Base unit
        --space-unit: 0.25rem;
        
        // Scale
        --space-xs: calc(var(--space-unit) * 1);   // 4px
        --space-sm: calc(var(--space-unit) * 2);   // 8px
        --space-md: calc(var(--space-unit) * 3);   // 12px
        --space-lg: calc(var(--space-unit) * 4);   // 16px
        --space-xl: calc(var(--space-unit) * 6);   // 24px
        --space-2xl: calc(var(--space-unit) * 8);  // 32px
        
        // Padding
        --padding-sm: var(--space-sm);
        --padding-md: var(--space-md);
        --padding-lg: var(--space-lg);
        
        // Gap
        --gap-sm: var(--space-sm);
        --gap-md: var(--space-md);
        --gap-lg: var(--space-lg);
        
        // Radius
        --radius-xs: 4px;
        --radius-sm: 6px;
        --radius-md: 8px;
        --radius-lg: 12px;
        --radius-full: 9999px;
    }
}
```

---

## Appendix: Agent Coordination Guide

### A.1 Code Region Assignment

For multi-agent work distribution:

| Agent | Region | Files |
|-------|--------|-------|
| Agent A | System/Runtime | `layer-manager.ts`, `properties/*.scss` |
| Agent B | Shells | `shells/basic/*.scss`, `shells/faint/*.scss`, `shells/raw/*.scss` |
| Agent C | Views (Group 1) | `views/viewer/*.scss`, `views/workcenter/*.scss` |
| Agent D | Views (Group 2) | `views/settings/*.scss`, `views/explorer/*.scss`, `views/editor/*.scss` |

### A.2 Coordination Rules

1. **No cross-layer dependencies** - Each agent works on their layer only
2. **Properties shared via `layer.tokens`** - All agents use same custom properties
3. **Use namespaced @use** - Avoid import collisions
4. **Test in isolation** - Each region should build independently

---

*Document Version: 1.0.0*  
*Last Updated: 2026-02-02*
