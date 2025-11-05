# SCSS Structure for Lure-Beer Frontend

This directory contains SCSS stylesheets for the BeerCSS-based frontend implementation, styled according to **Material Design 3** (M3) guidelines.

## Migration Status

The SCSS files have been migrated from VeelaCSS to work with BeerCSS and Material Design 3:

### Completed Updates:
- ✅ Replaced `ui-icon` selectors with `ui-phosphor-icon`
- ✅ Replaced `ui-tabbed-box` with `.tabs-container` and BeerCSS tabs structure
- ✅ Removed VeelaCSS `@use "veela-lib"` imports
- ✅ Created `m3-tokens.scss` with Material Design 3 design tokens (colors, typography, spacing, elevation, shapes, motion)
- ✅ Created `mixins.scss` with Material Design 3-aligned mixins
- ✅ Replaced all VeelaCSS mixin calls with M3-compliant implementations
- ✅ Replaced all custom color functions with Material Design 3 color tokens
- ✅ Updated all components to use M3 elevation, shapes, spacing, and typography

### Mixin Replacements:

All VeelaCSS mixins have been replaced with Material Design 3-compliant implementations in `mixins.scss`:

- `@include backdrop-blur()` → Material Design 3 backdrop filter with appropriate blur levels
- `@include flex-between()` → Standard flexbox with `justify-content: space-between`
- `@include surface()` → **Material Design 3 surface tokens** (container, container-high, container-highest, variant, dim, bright)
- `@include elevation()` → **Material Design 3 elevation levels** (0-5) with proper shadows
- `@include button-variant()` → **Material Design 3 button styles** (primary, secondary, outline)
- `@include toolbar-button()` → Material Design 3 button utilities with proper states
- `@include flex-center()` → Standard flexbox centering
- `@include breakpoint()` → Standard `@media` queries
- `@include container()` → Standard `@media` queries for container sizes
- `@include scrollable()` → Standard `overflow` properties with Material Design 3 scrollbar styling
- `@include nav-item()` → **Material Design 3 navigation styling** with proper states and colors
- `@include select-dropdown()` → **Material Design 3 select dropdown styling** with outline and focus states
- `@include solid-colorize()` → Material Design 3 color values
- `@include font-style()` → **Material Design 3 typescale** (display, headline, title, label, body)
- `@include text-wrap()` → Standard text wrapping
- `@include text-truncate()` → Standard text truncation
- `@include text-color()` → **Material Design 3 color tokens** (on-surface, primary, error, etc.)
- `@include grid-auto-fill()` → Standard CSS Grid auto-fill

## Material Design 3 Integration

The styling follows Material Design 3 guidelines from [m3.material.io](https://m3.material.io/):

### Design Tokens (`m3-tokens.scss`)

- **Color System**: Dynamic color system with surface, primary, secondary, tertiary, error, success, warning colors
- **Typography**: Complete M3 typescale (display, headline, title, label, body)
- **Spacing**: 4dp grid system (4px, 8px, 12px, 16px, etc.)
- **Elevation**: 5 levels of elevation shadows
- **Shapes**: Corner radius tokens (none, extra-small, small, medium, large, extra-large)
- **Motion**: Duration and easing tokens following M3 motion system

### Mixins (`mixins.scss`)

All mixins use Material Design 3 tokens:
- `@include surface()` - Uses M3 surface color tokens
- `@include elevation()` - Uses M3 elevation levels
- `@include button-variant()` - Uses M3 button styles
- `@include nav-item()` - Uses M3 navigation styling
- `@include text-color()` - Uses M3 color tokens
- `@include font-style()` - Uses M3 typescale
- `@include select-dropdown()` - Uses M3 select styling

### BeerCSS Integration

1. **Use BeerCSS utility classes** where possible (e.g., `.row`, `.col`, `.btn`, `.card`)
2. **Use Material Design 3 tokens** for colors, spacing, typography, elevation
3. **Leverage M3 components** with proper elevation and shape tokens
4. **Follow M3 motion** guidelines for transitions and animations

## Recommended Approach

1. Use Material Design 3 tokens for all styling
2. Apply M3 elevation and shapes to components
3. Use M3 typography scale for text
4. Follow M3 spacing system (4dp grid)
5. Implement M3 motion for interactions

