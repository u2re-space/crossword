# Veela-Basic Integration in CrossWord Basic Shell

## Overview

The CrossWord basic shell now uses the veela-basic design system for consistent styling, custom properties, and theming. This integration provides a unified design language across the application.

## Changes Made

### 1. Import Veela-Basic Module

**Files Updated:**
- `index.scss` - Added `@use "fest/veela/basic" as veela-basic;`
- `_tokens.scss` - Replaced all custom token definitions with veela-basic import
- `basic.scss` - Added veela-basic import and updated to use veela tokens

### 2. Custom Properties Migration

All shell-specific custom properties now reference veela-basic tokens:

#### Color Properties
```scss
--shell-bg: var(--basic-surface);
--shell-fg: var(--basic-on-surface);
--shell-nav-bg: var(--basic-surface-container-high);
--shell-nav-border: var(--basic-outline-variant);
```

#### Interactive States
```scss
--shell-btn-hover: var(--basic-surface-container-highest);
--shell-btn-active-bg: color-mix(in oklab, var(--basic-primary) 12%, transparent);
--shell-btn-active-fg: var(--basic-primary);
```

#### Spacing & Layout
- Uses `--space-*` tokens (xs, sm, md, lg, xl, 2xl)
- Uses `--gap-*` tokens for element spacing
- Uses `--padding-*` tokens for component padding

#### Typography
- Uses `--text-*` tokens (xs, sm, base, lg, xl, 2xl, 3xl)
- Uses `--font-weight-*` tokens (normal, medium, semibold, bold)
- Uses `--font-family` and `--font-family-mono`

#### Shape & Elevation
- Uses `--basic-radius-*` tokens (sm, md, lg, xl, 2xl, full)
- Uses `--basic-elev-*` tokens (0, 1, 2, 3)

#### Motion & Transitions
- Uses `--basic-motion-*` tokens (fast, normal, slow)
- Uses `--basic-focus-ring` for focus states

### 3. Theme Support

The shell now supports automatic light/dark theming via:
- `color-scheme: light dark;` declaration
- Veela-basic's built-in theme tokens
- Automatic color adaptation based on system preferences

### 4. Removed Duplicates

- Removed duplicate theme definitions (light/dark variants)
- Removed hardcoded token values
- Simplified CSS by leveraging veela-basic's comprehensive token system

## Benefits

1. **Consistency**: Unified design tokens across the entire application
2. **Maintainability**: Single source of truth for design values
3. **Theming**: Automatic light/dark mode support
4. **Accessibility**: Built-in focus states and contrast ratios
5. **Performance**: Optimized CSS with proper cascade layers
6. **Modern CSS**: Uses color-mix(), logical properties, and container queries

## Veela-Basic Features Used

### Design Tokens
- **Colors**: Surface, primary, secondary, error, outline variants
- **Spacing**: xs, sm, md, lg, xl, 2xl scale
- **Typography**: Font sizes, weights, families
- **Shape**: Border radius scale
- **Elevation**: Shadow system (0-3 levels)
- **Motion**: Timing functions (fast, normal, slow)

### Components
- Button styles with hover/active/focus states
- Form elements (inputs, textareas, selects, checkboxes, radios)
- Focus ring system
- Loading spinners
- Status notifications

### Utilities
- Responsive breakpoints
- Container queries
- Media query helpers
- Color mixing functions
- Logical properties

## Usage

The shell automatically applies veela-basic styles. No additional configuration needed.

### Custom Overrides

To override veela-basic tokens for shell-specific needs:

```scss
.app-shell {
    --shell-custom-property: value;
    
    // Override veela token if needed
    --basic-radius-lg: 20px;
}
```

### Adding New Components

New components should use veela-basic tokens:

```scss
.my-component {
    padding: var(--space-md);
    border-radius: var(--basic-radius-lg);
    background: var(--basic-surface-container);
    color: var(--basic-on-surface);
    transition: background var(--basic-motion-normal);
    
    &:hover {
        background: var(--basic-surface-container-high);
    }
    
    &:focus-visible {
        box-shadow: var(--basic-focus-ring);
    }
}
```

## Migration Notes

### Before
```scss
--shell-bg: #f8f9fa;
--shell-fg: #1a1a1a;
padding: 0.75rem;
border-radius: 8px;
```

### After
```scss
--shell-bg: var(--basic-surface);
--shell-fg: var(--basic-on-surface);
padding: var(--space-md);
border-radius: var(--basic-radius-lg);
```

## References

- Veela-Basic Documentation: `modules/projects/veela.css/src/scss/runtime/basic/`
- Design Config: `modules/projects/veela.css/src/scss/runtime/basic/misc/_config.scss`
- Properties: `modules/projects/veela.css/src/scss/runtime/basic/misc/_properties.scss`
- Components: `modules/projects/veela.css/src/scss/runtime/basic/design/`

## Future Enhancements

1. Leverage more veela-basic components (buttons, forms)
2. Use veela-basic utility classes
3. Implement veela-basic responsive patterns
4. Add veela-basic animation utilities
5. Explore veela-basic color functions for advanced theming
