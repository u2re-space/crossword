# CSS/SCSS Refactoring: Execution Checklist

**Project:** CrossWord CSS/SCSS Refactoring Initiative  
**Created:** February 2, 2026  
**Duration:** 9–13 working days  
**Status:** Ready for Phase 1

---

## 📋 Pre-Launch Checklist

### Knowledge Transfer

- [ ] Read `SCSS_REFACTORING_STRATEGY.md` (full overview)
- [ ] Read `PHASE_1_IMPLEMENTATION.md` (detailed Phase 1 steps)
- [ ] Read `GETTING_STARTED.md` (quick reference)
- [ ] Review `layer-manager.ts` (understand layer hierarchy)
- [ ] Review existing shell SCSS files (current patterns)
- [ ] Understand DOM generation via `H` template (LUR-E)

### Git & Environment Setup

- [ ] Create git branch: `feature/scss-refactoring`
- [ ] Verify Node/npm versions match project
- [ ] Run `npm install` to ensure dependencies
- [ ] Run `npm run build` (baseline build)
- [ ] Run `npm run dev` (verify dev server works)
- [ ] Document baseline CSS bundle size

### Stakeholder Alignment

- [ ] Share strategy document with team
- [ ] Confirm parallel work can proceed (phases 2–5)
- [ ] Set review/approval gates per phase
- [ ] Schedule check-ins (daily/weekly)

---

## ✅ Phase 1: Custom Properties & Context Modules (Days 1–2)

### Subtask 1.1: Property Audit

- [ ] Identify all `--*` variables in shells
- [ ] Identify all `--*` variables in views
- [ ] Identify all `--*` variables in existing styles
- [ ] Create spreadsheet/list with:
  - Variable name
  - Current location
  - Used in (component/shell/view)
  - Description

**Timeline:** 2–3 hours

### Subtask 1.2: Create Core Files

- [ ] Create `/styles/properties/_context.scss` with:
  - [ ] `:root` base tokens (light mode)
  - [ ] Dark mode overrides
  - [ ] BasicShell context selector
  - [ ] FaintShell context selector
  - [ ] RawShell context selector
  - [ ] View-specific contexts (workcenter, viewer, settings, etc.)
  - [ ] Combined shell+view contexts
  - [ ] Theme overrides (high contrast, reduced motion)

- [ ] Create/update `/styles/properties/_shell.scss` with:
  - [ ] Shared shell dimensions
  - [ ] Navigation button styles
  - [ ] Status message styles

- [ ] Verify/create `/styles/properties/_tokens.scss` with:
  - [ ] Typography (font-family, sizes, weights, line-height)
  - [ ] Spacing (xs–2xl)
  - [ ] Sizing (radii, gaps)
  - [ ] Transitions (fast, normal, slow)
  - [ ] Z-index scale

- [ ] Update `/styles/properties/_index.scss` to export all modules

**Timeline:** 4–5 hours

**Code Examples:** Provided in `PHASE_1_IMPLEMENTATION.md`

### Subtask 1.3: Create Mixin Library

- [ ] Create `/styles/lib/_context-mixins.scss` with:
  - [ ] `@mixin for-shell($shell-id)` 
  - [ ] `@mixin for-view($view-id)`
  - [ ] `@mixin for-shell-view($shell-id, $view-id)`
  - [ ] `@mixin when-state($selector)`
  - [ ] `@mixin component-styles($selector)`
  - [ ] `@mixin respond-to($breakpoint)` (bonus)

- [ ] Update `/styles/lib/_index.scss` to export context mixins

**Timeline:** 1–2 hours

### Subtask 1.4: TypeScript/DOM Updates

- [ ] Update `BaseShell.mount()` to set `data-shell` attribute
- [ ] Update view switching to set `data-view` attribute
- [ ] Update `styles/index.ts` to call `initializeLayers()` first

**Code Examples:** Provided in `PHASE_1_IMPLEMENTATION.md`

**Timeline:** 1–2 hours

### Subtask 1.5: Layer Manager Verification

- [ ] Confirm `layer-manager.ts` is called during app bootstrap
- [ ] Verify layer order matches layer definitions
- [ ] Check dev console for layer initialization message

**Timeline:** 30 minutes

### Subtask 1.6: Testing & Documentation

- [ ] Build project: `npm run build`
  - [ ] Check for CSS compilation errors
  - [ ] Verify no undefined variable warnings
  
- [ ] Dev server: `npm run dev`
  - [ ] Inspect DevTools → Elements
  - [ ] Verify custom properties visible
  - [ ] Check `data-shell` attribute on root
  
- [ ] Create `docs/CSS_PROPERTIES_GUIDE.md`
  - [ ] Document all available properties
  - [ ] Provide usage examples
  - [ ] Explain context selector mechanism

**Timeline:** 2–3 hours

### Subtask 1.7: Code Review & Commit

- [ ] Request review of Phase 1 changes
- [ ] Address feedback
- [ ] Commit with message: "Phase 1: Custom properties & context modules"

**Timeline:** 1–2 hours

---

## ✅ Phase 2: Shell Styles Refactoring (Days 2–3)

### Subtask 2.1: BasicShell Refactoring

- [ ] Analyze `shells/basic/` current structure
- [ ] Create `shells/basic/modules/` directory with:
  - [ ] `_layout.scss` (flex, grid, sizing)
  - [ ] `_components.scss` (buttons, nav, content)
  - [ ] `_interactions.scss` (hover, focus, active)
  - [ ] `_animations.scss` (keyframes, transitions)
  - [ ] `_typography.scss` (optional, if text styles exist)
  - [ ] `_colorization.scss` (optional, if color rules exist)
  - [ ] `_responsive.scss` (media queries)

- [ ] Consolidate BasicShell styles into modules
- [ ] Update imports to use `@use` with namespaces
- [ ] Add unified `@layer layer.shell.basic` wrapping
- [ ] Apply context selectors with `:has([data-shell="basic"])`
- [ ] Build & test

**Timeline:** 4–5 hours

### Subtask 2.2: FaintShell Refactoring

- [ ] Repeat Subtask 2.1 for FaintShell
- [ ] Include sidebar-specific styles
- [ ] Include tab-specific styles
- [ ] Build & test

**Timeline:** 3–4 hours

### Subtask 2.3: RawShell Refactoring

- [ ] Minimal updates for RawShell
- [ ] Ensure layer compliance
- [ ] Build & test

**Timeline:** 1–2 hours

### Subtask 2.4: Phase 2 Validation

- [ ] Build: `npm run build`
- [ ] Dev server: `npm run dev`
- [ ] Test BasicShell rendering
- [ ] Test FaintShell rendering
- [ ] Test RawShell rendering
- [ ] Test shell switching
- [ ] Verify no layout regressions
- [ ] Compare CSS sizes before/after

**Timeline:** 2–3 hours

### Subtask 2.5: Code Review & Commit

- [ ] Request review of Phase 2 changes
- [ ] Address feedback
- [ ] Commit with message: "Phase 2: Refactor shell styles"

**Timeline:** 1–2 hours

---

## ✅ Phase 3: View Styles & Layering (Days 3–4)

### Subtask 3.1: View SCSS Structure

- [ ] Create `/views/_index.scss` (main entry point)
- [ ] For each view (workcenter, viewer, settings, explorer, history, editor, airpad, home, print):
  - [ ] Create `views/{view-name}/{view-name}.scss`
  - [ ] Create `views/{view-name}/modules/` with:
    - [ ] `_layout.scss`
    - [ ] `_components.scss`
    - [ ] `_interactions.scss`
  - [ ] Wrap in `@layer layer.view.{view-name}`
  - [ ] Add context selectors for view-specific styling

**Timeline:** 6–8 hours (depends on view count)

### Subtask 3.2: View Context Integration

- [ ] Add context selectors for single views
- [ ] Add context selectors for shell+view combinations
- [ ] Verify CSS variable cascading works

**Timeline:** 2–3 hours

### Subtask 3.3: Phase 3 Validation

- [ ] Build & test
- [ ] Switch through all views
- [ ] Verify view-specific styling applies
- [ ] Test view switching in different shells
- [ ] No console errors

**Timeline:** 2–3 hours

### Subtask 3.4: Code Review & Commit

- [ ] Request review of Phase 3 changes
- [ ] Commit: "Phase 3: View styles with context selectors"

**Timeline:** 1–2 hours

---

## ✅ Phase 4: Unified Selector Strategy (Days 4–5)

### Subtask 4.1: Selector Audit

- [ ] Audit all selectors for specificity
- [ ] Identify candidates for `:is()`, `:where()`, `:has()`
- [ ] Document refactoring targets

**Timeline:** 2–3 hours

### Subtask 4.2: Apply Selector Optimization

- [ ] Replace verbose selectors with `:is()`, `:where()`
- [ ] Apply `:has()` for state-based styling
- [ ] Use context mixins to reduce repetition

**Timeline:** 3–4 hours

### Subtask 4.3: Validation & Testing

- [ ] Build & test
- [ ] Verify specificity improvements
- [ ] Test interactive states (hover, focus, active)
- [ ] No console errors or warnings

**Timeline:** 2–3 hours

### Subtask 4.4: Code Review & Commit

- [ ] Request review of Phase 4 changes
- [ ] Commit: "Phase 4: Unified selector strategy with :is/:where/:has"

**Timeline:** 1–2 hours

---

## ✅ Phase 5: Cleanup, Deduplication & Optimization (Days 5–6)

### Subtask 5.1: Identify Duplicates

- [ ] Search for repeated rule patterns
- [ ] Extract common mixins where applicable
- [ ] Document deduplication targets

**Timeline:** 2–3 hours

### Subtask 5.2: Consolidate & Deduplicate

- [ ] Merge similar rules into mixins
- [ ] Move duplicate properties to shared tokens
- [ ] Update all references

**Timeline:** 3–4 hours

### Subtask 5.3: Remove Dead Code

- [ ] Find commented-out selectors
- [ ] Remove unused vendor prefixes
- [ ] Remove overridden properties
- [ ] Trim redundant whitespace

**Timeline:** 1–2 hours

### Subtask 5.4: Final Optimization

- [ ] Analyze bundle size reduction
- [ ] Check for any remaining inefficiencies
- [ ] Document optimizations achieved

**Timeline:** 1–2 hours

### Subtask 5.5: Final Validation

- [ ] Build & compare sizes (before vs. after)
- [ ] Full dev server test
- [ ] All views + shells functional
- [ ] No layout/styling regressions
- [ ] Performance metrics acceptable

**Timeline:** 2–3 hours

### Subtask 5.6: Code Review & Commit

- [ ] Request review of Phase 5 changes
- [ ] Commit: "Phase 5: Cleanup, deduplication, optimization"

**Timeline:** 1–2 hours

---

## 🧪 Comprehensive Testing Checklist (All Phases)

### Functional Testing

- [ ] BasicShell renders correctly
- [ ] FaintShell renders correctly
- [ ] RawShell renders correctly
- [ ] View switching works in each shell
- [ ] Navigation buttons respond to clicks
- [ ] Status messages display
- [ ] Toolbars show/hide correctly

### Visual Regression Testing

- [ ] No unexpected layout shifts
- [ ] Spacing/padding unchanged
- [ ] Colors accurate (light + dark modes)
- [ ] Responsive breakpoints working
- [ ] Animations smooth (where applicable)
- [ ] Scrollbars render correctly

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] ARIA attributes respected
- [ ] Color contrast acceptable (WCAG AA)
- [ ] Reduced motion media query respected

### Performance Testing

- [ ] CSS bundle size reduced ~20%
- [ ] Layer initialization complete (<50ms)
- [ ] No layout thrashing
- [ ] Smooth transitions/animations
- [ ] No memory leaks (check DevTools)

### Browser/Device Testing

- [ ] Chrome 137+ (primary target)
- [ ] Desktop (1920×1080)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)
- [ ] Dark mode
- [ ] High contrast mode
- [ ] Reduced motion mode

---

## 📊 Success Metrics

### Target Outcomes

| Metric | Target | Acceptance Criteria |
|--------|--------|-------------------|
| CSS Bundle | -20% | 180 KB → 144 KB |
| Layer Coverage | 100% | All styles in `@layer` |
| `@use` Migration | 100% | 0 `@import` statements |
| Duplicates | <5 | Reduced from ~30 |
| Context Selectors | 25+ | For shell/view isolation |
| Specificity | Low | Dominance of `:is/:where` |
| Build Time | Unchanged | No regression |
| Page Load | <50ms | Layer init overhead negligible |

### Regression Testing

- [ ] No layout shifts from current
- [ ] All interactive states (hover, focus) work
- [ ] Animations/transitions smooth
- [ ] Console clean (0 errors, 0 warnings)
- [ ] Accessibility audit: 0 critical issues

---

## 🚨 Rollback Plan

If significant issues arise:

1. **Minor issues** (styling, small bugs)
   - Fix on current branch
   - Re-test
   - Continue

2. **Major issues** (layout broken, multiple regressions)
   - Commit current state (for analysis)
   - `git checkout main`
   - `git branch -D feature/scss-refactoring`
   - Root cause analysis
   - Plan corrective approach
   - Create new branch with fixes

3. **Blocker** (fundamental architecture mismatch)
   - Review strategy with team
   - Adjust approach if needed
   - Document learnings
   - Restart from affected phase

---

## 📝 Daily Standup Template

```markdown
## [Date] Standup

### Completed
- [ ] Task 1
- [ ] Task 2

### In Progress
- [ ] Current task

### Blockers
- None / List blocker

### Next
- [ ] Tomorrow's first task

### Build Status
- Build: ✅ Pass / ❌ Fail
- Dev Server: ✅ Pass / ❌ Fail
- Bundle Size: [X] KB

### Notes
- Any discoveries/learnings
```

---

## 📞 Escalation Path

**Issues or questions?**

1. Check `PHASE_*_IMPLEMENTATION.md` for your current phase
2. Review code examples in documentation
3. Search `layer-manager.ts` for layer definitions
4. Test in dev browser with DevTools
5. If still stuck: Document blocker + ping team lead

---

## 🎯 Final Deliverables

Upon completion, provide:

- [ ] Refactored SCSS structure
- [ ] Updated shell classes (with `data-shell` attributes)
- [ ] All phases committed to git
- [ ] Bundle size comparison (before/after)
- [ ] Test results summary
- [ ] Performance metrics
- [ ] Documentation updated
- [ ] Code review approvals

---

## 📚 Reference Files

- **Main Strategy:** `docs/SCSS_REFACTORING_STRATEGY.md`
- **Phase 1 Guide:** `docs/PHASE_1_IMPLEMENTATION.md`
- **Quick Start:** `docs/GETTING_STARTED.md`
- **This Checklist:** `docs/EXECUTION_CHECKLIST.md`
- **Properties Guide:** `docs/CSS_PROPERTIES_GUIDE.md` (created in Phase 1)

---

## 📋 Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Developer | _____ | _____ | _____ |
| Tech Lead | _____ | _____ | _____ |
| QA Lead | _____ | _____ | _____ |

---

**Last Updated:** 2026-02-02  
**Status:** Ready for execution  
**Duration Estimate:** 9–13 days

🚀 **Begin Phase 1 when ready!**
