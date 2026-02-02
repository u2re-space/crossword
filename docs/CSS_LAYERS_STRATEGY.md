# CrossWord CSS Layers Strategy

## 📋 Layer Hierarchy & Ordering

The following layers define the CSS cascade priority. **Lower in the list = higher priority**:

```
@layer system, tokens, base, shell, view, components, utilities, overrides;
```

### Layer Definitions

#### 1. **system** (Lowest priority)
- Browser resets and normalize rules
- Fundamental HTML element defaults (`*, html, body`)
- Global box-sizing declarations
- No component-specific styles

#### 2. **tokens**
- CSS custom properties (`:root`, `html`, `body` with `:has(...)` selectors)
- Per-shell theme tokens (e.g., `:root:has(.shell-basic)`)
- Per-view context tokens (e.g., `:root:has(.view-viewer)`)
- Animation keyframes (`@keyframes`)
- Typed CSS properties (`@property`)
- **No visual/layout rules here**—only declarations

#### 3. **base**
- Core typography (font-family, line-height defaults)
- Link, button, input baseline styling
- Semantic HTML element defaults
- Accessible focus/interactive states
- **Global, non-component styles that apply everywhere**

#### 4. **shell**
- Shell container styles (`.shell-basic`, `.shell-faint`, `.shell-raw`)
- Shell-level layout (flexbox/grid containers)
- Shell navigation, headers, footers
- Shell-specific resets for contained views
- **All shell rules scoped to shell class or `:has(.shell-*)`**

#### 5. **view**
- View-specific styles (`.view-viewer`, `.view-editor`, etc.)
- View layout and composition
- View-specific component overrides
- **Scoped to view class or `:has(.view-*)`**

#### 6. **components** (Higher priority)
- Reusable component styles (buttons, cards, modals, etc.)
- Component states (hover, focus, disabled)
- **Should use low-specificity selectors; avoid ID selectors**

#### 7. **utilities** (Higher priority still)
- Utility/atomic classes (`.p-md`, `.gap-lg`, `.d-flex`, etc.)
- Single-purpose helper classes
- **Minimal, focused rules**

#### 8. **overrides** (Highest priority)
- Emergency overrides for special cases
- Accessibility fixes
- View/shell-specific component tweaks
- **Use sparingly; prefer fixing root cause in lower layers**

## 🎯 Loading Sequence (TypeScript/JavaScript)

Styles are loaded in this order to establish the cascade correctly:

1. **System reset** (at build-time or bundled)
2. **Shell tokens** (depends on shell selection)
3. **Base styles** (core typography, global defaults)
4. **Shell layout** (shell container and structure)
5. **View styles** (once view is mounted)
6. **Component library styles** (UI system)
7. **View-specific components** (view overrides)
8. **Utilities** (atomic helpers)

## 🔧 Selector Patterns

### Custom Properties Scoping

Use `:has(...)` to scope tokens without polluting global `:root`:

```scss
/* Good: Context-specific tokens */
:root:has(.shell-basic) {
    --shell-primary: #007acc;
    --shell-nav-height: 56px;
}

:root:has(.shell-faint) {
    --shell-primary: #5c6e7b;
    --shell-nav-height: 64px;
}

:root:has(.view-editor) {
    --view-max-width: 100%;
    --view-padding: 1rem;
}
```

### Rule Scoping

Keep rules localized:

```scss
@layer shell {
    .shell-basic {
        display: flex;
        flex-direction: column;
    }

    .shell-basic__header {
        background: var(--shell-header-bg);
        height: var(--shell-nav-height);
    }
}
```

## 📦 File Organization

### Per-Shell Structure

```
shells/
├── basic/
│   ├── _tokens.scss      → @layer tokens (custom props)
│   ├── _base.scss        → @layer base (shell resets)
│   ├── _layout.scss      → @layer shell (layout)
│   ├── _components.scss  → @layer components
│   └── index.scss        → Root index (declares @layer order)
├── faint/
│   ├── _tokens.scss
│   ├── _base.scss
│   ├── _layout.scss
│   └── index.scss
└── raw/
    └── index.scss
```

### Per-View Structure

```
views/
├── viewer/
│   ├── _tokens.scss      → @layer tokens (view-specific)
│   ├── _styles.scss      → @layer view (layout & specific rules)
│   └── viewer.scss       → Root index
├── editor/
│   ├── _tokens.scss
│   ├── _styles.scss
│   └── editor.scss
└── ...
```

## ✅ Best Practices

1. **Declare layer order once** at the entry point (e.g., `index.scss`):
   ```scss
   @layer system, tokens, base, shell, view, components, utilities, overrides;
   ```

2. **Never repeat `@layer` declaration**; use `@use` to import files already wrapped in `@layer`.

3. **Use low-specificity selectors** everywhere:
   - Prefer `.class-name` over `div.class-name`
   - Avoid `#id` unless truly necessary
   - Use `:where()` for zero-specificity wrapper scoping
   - Avoid `!important` (use layers instead)

4. **Scope custom properties correctly**:
   - `:root` → global tokens only
   - `:root:has(.shell-*)` → shell-specific tokens
   - `:root:has(.view-*)` → view-specific tokens
   - Never scope tokens inside component selectors

5. **Keep modules focused**:
   - One module = one responsibility (tokens, layout, components, etc.)
   - Use `@forward` to expose public APIs
   - Use explicit namespaces (`@use "..." as ns`) unless aliasing to `*`

## 🔀 Cascade & Conflict Resolution

### Example: Shell vs View Specificity

```scss
/* shell/_layout.scss */
@layer shell {
    .shell-basic {
        --view-padding: 0.5rem;
    }
}

/* view/editor/_tokens.scss */
@layer tokens {
    :root:has(.view-editor) {
        --view-padding: 1rem;  /* ← Overrides shell because layer is higher priority */
    }
}
```

### Example: `:has()` Pseudo-selector Avoids Conflicts

```scss
/* Avoid this (too broad): */
html, body {
    background: white;
}

/* Good (scoped): */
:root:has(.shell-basic) {
    background: white;
}

:root:has(.shell-faint) {
    background: #f5f5f5;
}
```

## 📋 Layer Priority Summary

Higher in list = **Lower priority** (overridable):

1. `system` — Browser + resets
2. `tokens` — Custom properties only
3. `base` — Global typography & defaults
4. `shell` — Shell structure & layout
5. `view` — View layout & context
6. `components` — Reusable components
7. `utilities` — Atomic helpers
8. `overrides` — Special cases (use sparingly)

---

## Related Files

- **Entry point initialization**: `apps/CrossWord/src/frontend/views/styles.ts`
- **Frontend loader**: `apps/CrossWord/src/frontend/main/frontend-entry.ts`
- **Main app entry**: `apps/CrossWord/src/index.ts`
- **Shell index**: `apps/CrossWord/src/frontend/shells/{shell}/index.scss`
- **View index**: `apps/CrossWord/src/frontend/views/{view}/{view}.scss`
