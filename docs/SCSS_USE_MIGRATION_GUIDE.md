# SCSS @import to @use Migration Guide

## Overview

This guide documents the migration from deprecated `@import` to modern `@use`/`@forward` module system in CrossWord application SCSS files.

## Why Migrate?

1. **Deprecation**: SCSS `@import` is deprecated and will be removed in Dart Sass 2.0
2. **Namespace isolation**: `@use` provides namespaced imports preventing conflicts
3. **Better performance**: Files are only loaded once with `@use`
4. **Explicit dependencies**: Clear visibility of what's imported from where

---

## Migration Patterns

### Pattern 1: Simple Import to Use

**Before (deprecated):**
```scss
@import 'variables';
@import 'mixins';

.component {
    color: $primary-color;
    @include flex-center;
}
```

**After (modern):**
```scss
@use 'variables' as vars;
@use 'mixins' as mix;

.component {
    color: vars.$primary-color;
    @include mix.flex-center;
}
```

### Pattern 2: Using Default Namespace

When importing with default namespace (module filename):

```scss
@use 'variables';

.component {
    color: variables.$primary-color;
}
```

### Pattern 3: Using Wildcard (Not Recommended)

Only use when refactoring gradually:

```scss
@use 'variables' as *;

.component {
    color: $primary-color; // No namespace needed
}
```

### Pattern 4: Forward for Re-exports

Create index files that forward multiple modules:

```scss
// _index.scss
@forward 'variables';
@forward 'mixins';
@forward 'functions';
```

Then import the index:

```scss
@use 'lib' as lib; // Imports _index.scss automatically
```

---

## Layer Integration

### Combining @use with @layer

```scss
// _tokens.scss
@layer properties.tokens {
    :root {
        --color-primary: #007acc;
    }
}

// _component.scss
@use 'tokens'; // Dependency relationship

@layer components.button {
    .button {
        background: var(--color-primary);
    }
}
```

### Keyframes with Layers

Keyframes should be in their own layer for proper ordering:

```scss
// _keyframes.scss
@layer animations.keyframes {
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
}

// Mixins for using keyframes
@mixin fade-in($duration: 0.3s) {
    animation: fadeIn $duration ease-out;
}
```

```scss
// component.scss
@use 'keyframes' as anim;

@layer components {
    .modal {
        @include anim.fade-in(0.2s);
    }
}
```

---

## Directory Structure

### Recommended Module Organization

```
styles/
├── lib/                    # Shared SCSS utilities
│   ├── _index.scss         # @forwards all lib modules
│   ├── _mixins.scss        # Reusable mixins
│   ├── _functions.scss     # Utility functions
│   └── _variables.scss     # SCSS variables (not CSS custom props)
│
├── properties/             # CSS Custom Properties
│   ├── _index.scss         # @forwards all property modules
│   ├── _tokens.scss        # Design tokens (colors, spacing, etc.)
│   ├── _shell.scss         # Shell-specific properties
│   └── _views.scss         # View-specific properties
│
└── components/             # Component styles
    ├── _index.scss
    ├── _buttons.scss
    └── _forms.scss
```

### Using the Structure

```scss
// In any component file:
@use '../lib' as lib;
@use '../properties' as props;

@layer components.card {
    .card {
        @include lib.flex-column;
        padding: var(--space-md);
    }
}
```

---

## Migration Checklist

### For Each SCSS File:

- [ ] Replace `@import 'file'` with `@use 'file' as namespace`
- [ ] Add namespace prefix to all variables: `$var` → `namespace.$var`
- [ ] Add namespace prefix to all mixins: `@include mixin` → `@include namespace.mixin`
- [ ] Add namespace prefix to all functions: `fn()` → `namespace.fn()`
- [ ] Ensure file has appropriate `@layer` wrapper
- [ ] Update any CSS custom property references

### For Index Files:

- [ ] Use `@forward` instead of `@import` for re-exports
- [ ] Consider using `@forward 'file' with ($var: value)` for configuration
- [ ] Document the module's public API

---

## Common Pitfalls

### 1. Keyframes Not Appearing

**Problem**: Keyframes in `@use`'d files don't appear in output.

**Solution**: Keyframes are CSS output, not SCSS members. Ensure the file with keyframes is included in the build chain, or use `@use` at the top-level entry point.

```scss
// entry.scss
@use 'keyframes'; // This will emit the keyframes
@use 'components';
```

### 2. Order-Dependent Imports

**Problem**: Variables used before they're defined.

**Solution**: Always `@use` dependencies at the top of the file:

```scss
// Good
@use 'variables' as vars;
@use 'mixins' as mix;

.component {
    color: vars.$color;
}
```

### 3. Circular Dependencies

**Problem**: File A uses File B, and File B uses File A.

**Solution**: Extract shared dependencies to a third file:

```scss
// _shared.scss (no dependencies)
$base-unit: 4px;

// _spacing.scss
@use 'shared' as s;
$gap: s.$base-unit * 4;

// _layout.scss
@use 'shared' as s;
@use 'spacing' as sp;
```

### 4. Built-in Modules

**Problem**: Using deprecated global functions.

**Solution**: Use SCSS built-in modules:

```scss
// Before
$lighter: lighten($color, 10%);
$value: map-get($map, 'key');

// After
@use 'sass:color';
@use 'sass:map';

$lighter: color.scale($color, $lightness: 10%);
$value: map.get($map, 'key');
```

---

## CrossWord Specific Migrations

### Workcenter View

**File**: `src/frontend/views/workcenter/scss/_animations.scss`

**Before:**
```scss
@import 'keyframes';
```

**After:**
```scss
@use 'keyframes';
```

### Using Project Libraries

```scss
// Import from project lib
@use '../../../styles/lib' as lib;
@use '../../../styles/properties' as props;

@layer view.workcenter {
    .workcenter-view {
        @include lib.flex-column;
        padding: var(--space-md);
    }
}
```

---

## Testing Migration

### 1. Visual Regression

After migration, verify:
- All styles render correctly
- No missing styles in output CSS
- Layer order is preserved

### 2. Build Verification

```bash
# Check for @import deprecation warnings
npm run build 2>&1 | grep -i "import"

# Verify CSS output size hasn't changed significantly
ls -la dist/*.css
```

### 3. Browser DevTools

- Check `document.styleSheets` for all expected rules
- Verify CSS custom properties are defined
- Confirm keyframes are present

---

## Resources

- [Sass @use Documentation](https://sass-lang.com/documentation/at-rules/use)
- [Sass @forward Documentation](https://sass-lang.com/documentation/at-rules/forward)
- [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Migration Tool](https://sass-lang.com/documentation/breaking-changes/import)
