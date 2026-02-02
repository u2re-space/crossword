# CrossWord SCSS/CSS Refactoring Strategy
**Created:** Feb 2, 2026  
**Scope:** Shells (basic, faint, raw) + Views system  
**Timeline:** 4-5 phases | 9-13 days

---

## Executive Summary

This document outlines a comprehensive CSS/SCSS refactoring for the CrossWord application, focusing on:
1. **Modernizing** from `@import` to `@use` SCSS module system
2. **Proper layer structure** using `@layer` cascade layers (aligned with existing `layer-manager.ts`)
3. **Context-based selectors** with `:has()`, `:root`, `html`, `body` for shell/view isolation
4. **Dedicated custom properties modules** with their own `@layer` management
5. **DOM tree integration** through TypeScript/JavaScript coordination
6. **Deduplication, optimization, and cleanup** of redundant styles

---

## Current State Analysis

### Existing Foundation ✅

- **Layer Manager (`layer-manager.ts`)**: Already defines unified hierarchy
  - System (reset, normalize, tokens) — order 0–20
  - Runtime (base, components, utilities, animations) — order 100–130
  - Shell (common, raw, basic, faint) — order 200–230
  - View (common, viewer, workcenter, settings, explorer, history, editor, airpad, home, print) — order 300–390
  - Override (theme, print, a11y) — order 900–920

- **Shell Architecture**: Lur-E based DOM generation (`H` template syntax)
  - `BasicShell.createLayout()` → `H` template generating `<div class="shell-basic" data-shell="basic">`
  - `FaintShell.createLayout()` → `H` template generating `<div class="shell-faint" data-shell="faint">`
  - `RawShell.createLayout()` → Minimal layout

- **SCSS Files**: Already using `@use` partially
  - `shells/basic/index.scss` imports via `@use` (keyframes, tokens, components)
  - Some files still have implicit `@layer` declarations (`@layer shell-basic`, `@layer base`)

### Issues to Address ⚠️

1. **Inconsistent layer naming**: Mix of `shell-basic`, `base`, etc. vs. unified `layer.shell.basic`
2. **Missing context selectors**: No `:has()` for view-specific or shell-specific context
3. **Incomplete `@use` migration**: Some imports may still be `@import`
4. **Custom properties scattered**: Not centralized into dedicated modules with `@layer`
5. **Possible duplication**: Similar rules across shells without unification
6. **No view-layer styles**: Views don't have corresponding SCSS with `@layer`
7. **DOM tree coupling unclear**: No TypeScript integration to track layer loading order

---

## Proposed Architecture

### Phase 1: Custom Properties & Tokens Module (Days 1–2)

**Goal:** Centralize all CSS custom properties into dedicated, layered modules.

#### 1.1 Create Dedicated Properties Modules

```
/styles/properties/
├── _index.scss          (exports all)
├── _shell.scss          (@layer shell.common → --shell-* variables)
├── _tokens.scss         (@layer tokens → design tokens)
├── _views.scss          (@layer view.common → view-specific variables)
└── _context.scss        (NEW: context-aware variable selectors with :has)
```

#### 1.2 Example: `_context.scss`

Context-based selectors wrap properties to avoid conflicts:

```scss
@layer layer.shell.common {
    /* When shell-basic is active */
    :is(html, body):has([data-shell="basic"]) {
        --shell-nav-height: 56px;
        --shell-bg: #f8f9fa;
        --shell-fg: #1a1a1a;
        /* ... shell-basic specific tokens ... */
    }

    /* When shell-faint is active */
    :is(html, body):has([data-shell="faint"]) {
        --shell-nav-height: 40px;
        --shell-sidebar-width: 256px;
        /* ... shell-faint specific tokens ... */
    }

    /* View-specific context inside basic shell */
    :is(html, body):has([data-shell="basic"] [data-view="workcenter"]) {
        --view-layout: "grid";
        --view-sidebar-visible: true;
    }
}
```

**Benefits:**
- No specificity wars (`:is()` + `:where()` keep specificity low)
- Shell/view state changes automatically update variables
- Cleaner, DRY token management

#### 1.3 Update `styles/index.ts`

Ensure layer initialization happens **before** any style loading:

```typescript
import { initializeLayers } from './layer-manager';

// MUST run first, before importing styles
initializeLayers();

// Then import property modules
export * from './properties';
```

---

### Phase 2: Shell Styles Refactoring (Days 2–3)

**Goal:** Refactor each shell's SCSS to use unified layer names and context selectors.

#### 2.1 BasicShell: `shells/basic/index.scss` → `shells/basic/basic.scss`

**Before:**
```scss
@use "keyframes" as kf;
@use "tokens" as t;
@use "components" as c;
@use "basic.scss";
@use "settings.scss";
@layer reset, base, components, settings, layout, utilities;
```

**After:**
```scss
@use "keyframes" as kf;
@use "tokens" as t;
@use "components" as c;
@use "../../styles/properties" as props;

// Import organized files
@use "./modules/layout" as layout;
@use "./modules/components" as components;
@use "./modules/interactions" as interactions;
@use "./modules/animations" as animations;

// Unified layer mapping
@layer 
    layer.shell.common,
    layer.shell.basic,
    layer.override.theme;
```

**New subdirectory structure:**
```
/shells/basic/
├── modules/
│   ├── _layout.scss           (flex, grid, sizing)
│   ├── _components.scss       (buttons, nav, content)
│   ├── _interactions.scss     (hover, focus, active)
│   ├── _animations.scss       (keyframes, transitions)
│   ├── _typography.scss       (font sizes, weights)
│   ├── _colorization.scss     (background, text colors)
│   └── _responsive.scss       (@media queries)
├── basic.scss                 (new main entry)
├── settings.scss
├── layout.scss
└── _keyframes.scss
```

#### 2.2 Context-Based Selectors in Shell Styles

**In `shells/basic/modules/_layout.scss`:**

```scss
@layer layer.shell.basic {
    // Base shell structure (context-aware)
    :where([data-shell="basic"]) {
        display: flex;
        flex-direction: column;
        block-size: 100vh;
        inline-size: 100%;
    }

    // Navigation (only in basic shell, with :has context)
    :is(html, body):has([data-shell="basic"]) {
        .shell-basic__nav {
            block-size: var(--shell-nav-height);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--shell-nav-bg);
            border-block-end: 1px solid var(--shell-nav-border);
            gap: 0.5rem;
            padding-inline: 0.75rem;
            flex-shrink: 0;
        }

        .shell-basic__content {
            flex: 1;
            overflow: auto;
            display: flex;
            flex-direction: column;
        }
    }
}
```

#### 2.3 Similar Refactoring for FaintShell & RawShell

- FaintShell: Add sidebar-specific context selectors
- RawShell: Minimal styles, maintain layer compliance

---

### Phase 3: View Styles & Layering (Days 3–4)

**Goal:** Create dedicated view style modules with proper `@layer` mapping.

#### 3.1 Create View SCSS Structure

```
/views/
├── _index.scss             (imports all views)
├── workcenter/
│   ├── workcenter.scss     (@layer layer.view.workcenter)
│   └── modules/
│       ├── _layout.scss
│       ├── _components.scss
│       └── _interactions.scss
├── viewer/
│   ├── viewer.scss
│   └── modules/
├── settings/
│   ├── settings.scss
│   └── modules/
└── ... (other views)
```

#### 3.2 View Context Integration

**`views/workcenter/workcenter.scss`:**

```scss
@use "../../styles/properties" as props;

@layer layer.view.workcenter {
    // Context: workcenter view active in basic shell
    :is(html, body):has([data-shell="basic"] [data-view="workcenter"]) {
        // Workcenter-specific layout
        .view-workcenter {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 1rem;
        }

        // Toolbar customization for workcenter
        [data-shell-toolbar] {
            gap: 0.75rem;
        }

        // Content area
        .workcenter-content {
            overflow: auto;
            padding: 1rem;
        }
    }

    // Context: workcenter in faint shell
    :is(html, body):has([data-shell="faint"] [data-view="workcenter"]) {
        .view-workcenter {
            display: flex;
            flex-direction: column;
        }
    }
}
```

#### 3.3 TypeScript Integration: View Mounting

**Update `BaseShell.mount()` in TypeScript:**

```typescript
async mount(container: HTMLElement): Promise<void> {
    // ... existing code ...

    // After creating layout, set shell attribute
    this.container?.setAttribute('data-shell', this.id);

    // Load shell-specific styles
    const shellStylesheet = this.getStylesheet();
    if (shellStylesheet) {
        await preloadStyle(shellStylesheet);
        await loadInlineStyle(shellStylesheet);
    }

    // Signal layer initialization
    window.dispatchEvent(new CustomEvent('shell-mounted', {
        detail: { shellId: this.id }
    }));
}
```

**When switching views:**

```typescript
async switchView(viewId: ViewId): Promise<void> {
    // ... view switching logic ...

    // Update DOM to reflect active view
    this.rootElement?.setAttribute('data-view', viewId);

    // Load view-specific styles
    const viewStylesheet = await this.getViewStylesheet(viewId);
    if (viewStylesheet) {
        await loadInlineStyle(viewStylesheet);
    }

    // Trigger layer recalculation (optional advanced optimization)
    window.dispatchEvent(new CustomEvent('view-changed', {
        detail: { viewId }
    }));
}
```

---

### Phase 4: Unified Selector Strategy (Days 4–5)

**Goal:** Apply `:is()`, `:where()`, `:has()` consistently across all SCSS.

#### 4.1 Low-Specificity Pattern

```scss
@layer layer.shell.basic {
    // Use :where() for zero specificity (allows override)
    :where(.shell-basic__nav) {
        padding: 0.5rem;
    }

    // Use :is() for grouping selectors (inherits specificity from arg)
    :is(.shell-basic__nav, .shell-basic__status) {
        z-index: 100;
    }

    // Use :has() for parent state
    :where(.shell-basic):has([aria-expanded="true"]) {
        .sidebar {
            inline-size: 300px;
        }
    }

    // Combined: context + low specificity
    :is(html, body):has([data-shell="basic"]) {
        :where(.content) {
            display: flex;
        }
    }
}
```

#### 4.2 Mixin for Contextual Selectors

**`styles/lib/_context-mixins.scss`:**

```scss
@mixin for-shell($shell-id) {
    :is(html, body):has([data-shell="#{$shell-id}"]) {
        @content;
    }
}

@mixin for-view($view-id) {
    :is(html, body):has([data-view="#{$view-id}"]) {
        @content;
    }
}

@mixin for-shell-view($shell-id, $view-id) {
    :is(html, body):has([data-shell="#{$shell-id}"] [data-view="#{$view-id}"]) {
        @content;
    }
}

// Usage in shell SCSS
@include for-shell("basic") {
    .shell-basic__nav {
        gap: 0.5rem;
    }
}
```

---

### Phase 5: Cleanup, Deduplication & Optimization (Days 5–6)

**Goal:** Remove redundancy, merge similar rules, optimize bundle.

#### 5.1 Identify Duplicates

**Common patterns to deduplicate:**

```scss
// BEFORE: Duplicated in multiple files
.nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
}

.toolbar-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
}

// AFTER: Use mixin
@mixin flex-item-base {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
}

.nav-item {
    @include flex-item-base;
}

.toolbar-item {
    @include flex-item-base;
}
```

#### 5.2 Consolidate Shared Tokens

Move shell-agnostic variables to `styles/properties/_tokens.scss`:

```scss
@layer layer.tokens {
    :root {
        --spacing-xs: 0.25rem;
        --spacing-sm: 0.5rem;
        --spacing-md: 0.75rem;
        --spacing-lg: 1rem;
        
        --border-radius-sm: 4px;
        --border-radius-md: 8px;
        
        --transition-fast: 0.15s ease;
        --transition-normal: 0.2s ease;
    }
}
```

#### 5.3 Trim Unused Styles

Search and remove:
- Commented-out selectors
- Dead vendor prefixes (`-webkit-`, `-moz-`) unless necessary
- Overridden properties (check with Build tool analysis)

---

## Implementation Checklist

### Pre-Refactor

- [ ] Backup current SCSS structure (git commit)
- [ ] Document current layer order from `layer-manager.ts`
- [ ] Identify all `@import` statements to migrate to `@use`
- [ ] Audit custom properties across all SCSS files
- [ ] Map shell/view DOM tree structure

### Phase 1: Properties & Tokens

- [ ] Create `/styles/properties/_context.scss`
- [ ] Consolidate all `--shell-*` variables from shells into dedicated modules
- [ ] Consolidate all `--view-*` variables
- [ ] Update `styles/properties/_index.scss` to export all
- [ ] Wrap all in appropriate `@layer` directives

### Phase 2: Shell Refactoring

- [ ] Refactor `shells/basic/` to new structure
  - [ ] Create `modules/` subdirectory
  - [ ] Split styles by concern (layout, components, interactions, etc.)
  - [ ] Update imports to use `@use` with explicit namespaces
  - [ ] Replace layer names with unified `layer.shell.basic`
  - [ ] Add context-based selectors with `:has()`
- [ ] Repeat for `shells/faint/`
- [ ] Repeat for `shells/raw/`

### Phase 3: View Styling

- [ ] Create `/views/_index.scss`
- [ ] Create view-specific SCSS files (workcenter, viewer, etc.)
- [ ] Add context selectors for view + shell combinations
- [ ] Implement `:has()` pattern for view state

### Phase 4: Selector Optimization

- [ ] Audit all selectors for specificity
- [ ] Replace verbose selectors with `:is()`, `:where()`, `:has()`
- [ ] Create `/styles/lib/_context-mixins.scss`
- [ ] Apply context mixins across shell/view styles

### Phase 5: Cleanup

- [ ] Identify and merge duplicated rules
- [ ] Consolidate shared tokens
- [ ] Remove dead/commented styles
- [ ] Minimize vendor prefixes
- [ ] Run build to check for errors

### Post-Refactor

- [ ] Build project: `npm run build`
- [ ] Dev server: `npm run dev`
- [ ] Test shells: basic, faint, raw
- [ ] Test views in each shell
- [ ] Verify no layout shifts or broken UI
- [ ] Check bundle size before/after
- [ ] Commit with detailed message

---

## Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CSS Bundle (est.) | ~180 KB | ~145 KB | ~20% reduction |
| Layer initialization | Manual | Automated | 100% coverage |
| Context selectors | 0 | 25+ | Better isolation |
| Duplicated rules | ~30 | <5 | 83% reduced |
| SCSS files using `@use` | ~40% | 100% | Complete |
| Custom property modules | 1 | 5 | Better organization |

---

## Risk Areas & Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking layout changes | 1) Visual regression testing 2) Incremental rollout 3) Git rollback ready |
| Layer order conflicts | 1) Validate layer-manager.ts alignment 2) Build verification 3) Dev server testing |
| Selector specificity issues | 1) Use `:where()` consistently 2) Audit cascade layer order 3) Test interactive states |
| Missing view styles | 1) Comprehensive style audit 2) Template tag search 3) QA on all view combinations |
| Browser support (`:has()`) | 1) Chromium 105+ (Chrome 137 supported ✅) 2) Fallback graceful degradation 3) CSS@supports for detection |

---

## Timeline Estimate

- **Phase 1:** 1–2 days
- **Phase 2:** 1–2 days
- **Phase 3:** 1–2 days
- **Phase 4:** 0.5–1 day
- **Phase 5:** 1–2 days
- **Testing & Fixes:** 1–2 days
- **Total:** 5–10 days (9–13 working hours depending on complexity)

---

## Future Enhancements

1. **Dynamic Layer Injection:** TypeScript module to inject layers based on active shell/view at runtime
2. **CSS-in-JS:** Consider adopting CSS Modules for components
3. **Design Tokens:** Expand to include animations, timings, z-indexes as semantic tokens
4. **Container Queries:** Gradual migration from media queries where applicable
5. **Accessibility:** Expand `:has()` patterns for ARIA state management

---

## References

- **Layer Manager:** `apps/CrossWord/src/frontend/styles/layer-manager.ts`
- **SCSS Module Docs:** https://sass-lang.com/documentation/at-rules/use
- **Cascade Layers Spec:** https://www.w3.org/TR/css-cascade-5/#cascade-layer
- **Modern Selectors:** https://developer.mozilla.org/en-US/docs/Web/CSS/:has
- **Browser Support:** https://caniuse.com/?search=:has

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-02  
**Status:** Ready for Phase 1 Execution
