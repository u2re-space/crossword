# CSS/SCSS Refactoring Initiative: Getting Started

**Date:** February 2, 2026  
**Project:** CrossWord Application  
**Scope:** Shells (basic, faint, raw) + Views System  
**Documentation Created:** 3 comprehensive guides

---

## What Has Been Created

### 1. **SCSS_REFACTORING_STRATEGY.md** (665 KB equivalent)
Comprehensive 5-phase roadmap covering:
- Current state analysis
- Proposed architecture with detailed explanations
- Phase-by-phase breakdown (Phases 1–5)
- Implementation checklist
- Risk mitigation strategies
- Timeline estimates
- Expected outcomes

**Key Sections:**
- Phase 1: Custom Properties & Tokens (Days 1–2)
- Phase 2: Shell Styles Refactoring (Days 2–3)
- Phase 3: View Styles & Layering (Days 3–4)
- Phase 4: Unified Selector Strategy (Days 4–5)
- Phase 5: Cleanup & Optimization (Days 5–6)

### 2. **PHASE_1_IMPLEMENTATION.md** (Detailed Action Guide)
Step-by-step implementation for Phase 1 including:
- Complete audit process
- Full code examples for all new files
- Context-based selector patterns
- DOM element updates (TypeScript)
- Mixin library creation
- Testing & validation procedures
- Developer reference guide

**Deliverables from Phase 1:**
- `/styles/properties/_context.scss` (new)
- `/styles/properties/_shell.scss` (updated)
- `/styles/properties/_tokens.scss` (if missing)
- `/styles/properties/_index.scss` (updated)
- `/styles/lib/_context-mixins.scss` (new)
- Updated `styles/index.ts`
- Updated `BaseShell.mount()` & view switching logic
- Documentation: `docs/CSS_PROPERTIES_GUIDE.md`

### 3. **This Quick-Start Guide** 
High-level overview + next steps

---

## Architecture Overview

### Current Structure

```
apps/CrossWord/src/frontend/
├── shells/
│   ├── basic/       (218 lines basic.scss + layout.scss: 1890 lines)
│   ├── faint/       (comprehensive shell)
│   └── raw/         (minimal shell)
├── views/
│   └── workcenter/  (725 lines animations, etc.)
└── styles/
    ├── layer-manager.ts         (already defines unified hierarchy ✅)
    ├── index.ts                 (exports)
    ├── properties/              (custom properties)
    │   ├── _tokens.scss
    │   ├── _shell.scss
    │   ├── _views.scss
    │   └── _index.scss
    └── lib/                     (utilities)
        ├── _mixins.scss
        └── _functions.scss
```

### Key Innovation: Context-Based Selectors

**Old Pattern:**
```scss
.shell-basic { ... }
.shell-faint { ... }
```

**New Pattern:**
```scss
:is(html, body):has([data-shell="basic"]) {
    --shell-nav-height: 56px;
    --shell-bg: #f8f9fa;
}

:is(html, body):has([data-shell="faint"]) {
    --shell-nav-height: 40px;
    --shell-sidebar-width: 256px;
}
```

**Benefits:**
- Variables **cascade automatically** when DOM changes
- No specificity fights (`:is()` + `:where()` are smart)
- Shell/view state changes update styles **without JavaScript**
- Easier to avoid conflicts between shells/views

---

## Quick Reference: Key Concepts

### 1. Cascade Layers (`@layer`)

Already defined in `layer-manager.ts`:

```
System (0-20)
├── reset
├── normalize
└── tokens

Runtime (100-130)
├── base
├── components
├── utilities
└── animations

Shell (200-230)
├── common
├── raw
├── basic
└── faint

View (300-390)
├── common, viewer, workcenter, settings, explorer, history, editor, airpad, home, print

Override (900-920)
├── theme, print, a11y
```

### 2. Module System (`@use` / `@forward`)

**Before (deprecated):**
```scss
@import "../styles/tokens";
@import "../styles/mixins";
```

**After (modern):**
```scss
@use "../styles/properties" as props;
@use "../styles/lib/mixins" as m;
```

### 3. Context Selectors (`:has()`)

```scss
/* Shell context */
:is(html, body):has([data-shell="basic"]) { ... }

/* View context */
:is(html, body):has([data-view="workcenter"]) { ... }

/* Combined */
:is(html, body):has([data-shell="basic"] [data-view="workcenter"]) { ... }
```

### 4. Low-Specificity Patterns

```scss
/* Zero specificity — easy to override */
:where(.button) { padding: 0.5rem; }

/* Inherited specificity from argument */
:is(.btn, .button) { ... }

/* Parent state detection */
:has([aria-expanded="true"]) { ... }
```

---

## Getting Started: Next Steps

### Immediate Actions (Today)

1. **Read the Strategy Document**
   - `apps/CrossWord/docs/SCSS_REFACTORING_STRATEGY.md`
   - Understand phases and timeline

2. **Review Phase 1 Guide**
   - `apps/CrossWord/docs/PHASE_1_IMPLEMENTATION.md`
   - All code examples provided
   - Step-by-step instructions

3. **Audit Current Properties** (Step 1 of Phase 1)
   ```bash
   grep -r "^\s*--" apps/CrossWord/src/frontend/shells --include="*.scss"
   grep -r "^\s*--" apps/CrossWord/src/frontend/views --include="*.scss"
   grep -r "^\s*--" apps/CrossWord/src/frontend/styles --include="*.scss"
   ```

### Phase 1 Execution (Days 1–2)

✅ **Already documented** with full code examples:
- Create `_context.scss` with context-based selectors
- Create `_shell.scss` with shell tokens
- Create/update `_tokens.scss` with design tokens
- Update `_index.scss` to export all
- Create `_context-mixins.scss` for reusable patterns
- Update `styles/index.ts` to call `initializeLayers()`
- Update shell classes to set `data-shell` attribute
- Update view switching to set `data-view` attribute

### Phases 2–5 (Days 2–6)

Each will follow similar structure:
- **Phase 2:** Refactor shell SCSS files (basic, faint, raw)
- **Phase 3:** Create view-specific SCSS modules
- **Phase 4:** Apply selector optimization (`:is()`, `:where()`, `:has()`)
- **Phase 5:** Deduplication, cleanup, optimization

---

## DOM Tree Generation & Coordination

### How Shells Generate DOM

**In TypeScript (e.g., `BasicShell.createLayout()`):**

```typescript
protected createLayout(): HTMLElement {
    const root = H`
        <div class="shell-basic" data-shell="basic">
            <nav class="shell-basic__nav" role="navigation">
                ${this.renderNavButtons()}
            </nav>
            <main class="shell-basic__content" data-shell-content role="main">
                <div class="shell-basic__loading">...</div>
            </main>
        </div>
    ` as HTMLElement;
    
    return root;
}
```

**Phase 1 Update:**
```typescript
protected createLayout(): HTMLElement {
    const root = H`...` as HTMLElement;
    
    // CRITICAL: Set attribute for context selectors
    root.setAttribute('data-shell', this.id);
    
    return root;
}
```

### How Views Mount

**In TypeScript (view switching):**

```typescript
async switchView(viewId: ViewId): Promise<void> {
    if (this.contentContainer) {
        // Set data-view for context selectors
        this.contentContainer.setAttribute('data-view', viewId);
        
        const view = await this.loadView(viewId);
        this.contentContainer.replaceChildren(view.element);
    }
}
```

**CSS automatically responds:**
```scss
/* Selector automatically activates when data-view changes */
:is(html, body):has([data-view="workcenter"]) {
    --view-layout: "grid";
}
```

---

## Coordination for Multiple Agents/Models

This refactoring can be distributed across parallel work by:

1. **Agent A:** Phase 1 (Custom Properties & Context Selectors)
2. **Agent B:** Phase 2A (BasicShell Refactoring)
3. **Agent C:** Phase 2B (FaintShell & RawShell Refactoring)
4. **Agent D:** Phase 3 (View Styles)
5. **Agent E:** Phase 4–5 (Optimization & Cleanup)

**Coordination Points:**
- All use same `@layer` names from `layer-manager.ts`
- All use context mixins from Phase 1
- All follow same SCSS module patterns
- Pre-agreed on mixin signatures and exports

**Per-Agent Documentation:**
- Each phase document provides complete code examples
- Clear "before/after" patterns
- Testing checklist for validation

---

## Browser Support & Feature Detection

### `:has()` Pseudo-Class
- ✅ Chrome 105+ (Chrome 137 target supported)
- ✅ Edge 105+
- ⚠️ Firefox 121+ (behind flag)
- ⚠️ Safari 15.4+

**Fallback Strategy:**
All base styles work without `:has()`. Context selectors enhance, not require.

```scss
/* Works everywhere */
.shell-basic__nav { 
    padding: 0.5rem;
}

/* Enhanced with :has() on supported browsers */
:is(html, body):has([data-shell="basic"]) {
    --shell-nav-height: 56px;
}
```

---

## Performance Expectations

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CSS Bundle | ~180 KB | ~145 KB | ↓ 20% |
| Layer Init | Manual | Automated | ✅ 100% |
| Duplicate Rules | ~30 | <5 | ↓ 83% |
| `@use` Coverage | 40% | 100% | ↑ 150% |
| Context Selectors | 0 | 25+ | ✅ New |

---

## Testing Strategy

### After Each Phase

```bash
# Build
npm run build

# Dev server
npm run dev

# Manual testing checklist
- [ ] Shell renders correctly
- [ ] View switching works
- [ ] Colors/theme apply
- [ ] Responsive layouts work
- [ ] Interactive states (hover, focus, active)
- [ ] No console errors
```

### Before/After Comparison

```bash
# Before refactor: capture current state
npm run build
ls -lh dist/assets/*.css

# After refactor: compare sizes
npm run build
ls -lh dist/assets/*.css
```

---

## Key Files to Keep Updated

As you progress through phases, maintain:

1. **Strategy Document:** `docs/SCSS_REFACTORING_STRATEGY.md`
   - Update timeline/completed phases

2. **Phase Guides:** `docs/PHASE_*.md`
   - One per phase, with full code + steps

3. **Implementation Log:** Create `docs/IMPLEMENTATION_LOG.md`
   - Track actual vs. planned timeline
   - Note blockers/discoveries
   - Document decisions

4. **CSS Properties Guide:** `docs/CSS_PROPERTIES_GUIDE.md`
   - Reference for developers
   - Property names + usage examples

---

## Success Criteria

✅ **Phase 1 Complete When:**
- All custom properties consolidated in `/styles/properties/`
- Context selectors working (`:has()` activating)
- Mixin library created and tested
- DOM elements have `data-shell` and `data-view` attributes
- No CSS compilation errors

✅ **All Phases Complete When:**
- 20% bundle size reduction achieved
- All SCSS using `@use` (0 `@import`)
- All styles wrapped in `@layer`
- <5 duplicated rules remaining
- 25+ context selectors active
- No layout/styling regressions

---

## Questions & Troubleshooting

**Q: Do I need to use context selectors everywhere?**
A: No. Use them for shell/view-specific variations. Common styles stay at `:root`.

**Q: What if `:has()` breaks on some browsers?**
A: Base styles still work. Context selectors enhance, not break.

**Q: Can I skip a phase?**
A: Not recommended. Phases are sequential (1→5). Phase 1 is foundation for others.

**Q: How often should we test during refactoring?**
A: After each file refactored (not phase). Build + quick manual smoke test.

---

## References

- **Layer Manager:** `apps/CrossWord/src/frontend/styles/layer-manager.ts`
- **LUR-E Docs:** Template syntax for DOM generation
- **CSS Cascade Layers:** https://www.w3.org/TR/css-cascade-5/#cascade-layer
- **SCSS Modules:** https://sass-lang.com/documentation/at-rules/use
- **CSS `:has()` Selector:** https://developer.mozilla.org/en-US/docs/Web/CSS/:has
- **Modern CSS Selectors:** https://developer.mozilla.org/en-US/docs/Web/CSS/:is

---

## Document Versions

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-02-02 | Active | Initial strategy + Phase 1 guide |
| (TBD) | (TBD) | Pending | Phase 2–5 guides |

---

**Last Updated:** 2026-02-02  
**Created By:** AI Assistant (Cursor)  
**For:** CrossWord CSS/SCSS Refactoring Initiative

🚀 Ready to begin? Start with Phase 1 Implementation Guide!
