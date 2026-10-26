# Sage (سايج) — Improvement Plan, Bug Log & Technical Debt

This document tracks all fixed bugs, root-cause investigations, and deliberate technical debt shortcuts.

---

## 1. Bug Log Discipline

_Format for recording bug fixes (mandatory per Global Developer Contract):_

```markdown
### [YYYY-MM-DD] Bug: <short title>

- **Symptom**: exact error message or behavior observed
- **Root cause**: what actually caused it
- **Fix**: what was changed and why
- **Files**: paths of modified files
- **Tags**: e.g., drizzle, postgres, neon, upstash, auth, i18n
```

### [2026-10-23] Initial Repository Setup

- **Status**: Clean baseline initialized.

### [2026-10-26] Bug: Radix Slot multiple children error in Button with asChild
- **Symptom**: `[Error: Slot failed to slot onto its children. Expected a single React element child or Slottable.]` during Next.js server render
- **Root cause**: `Button` rendered `<Comp>{isLoading && ...}{children}</Comp>`, which passed multiple children to Radix `Slot` when `asChild` was true
- **Fix**: Branched `if (asChild)` to render `<Slot>{children}</Slot>` directly with single child semantics
- **Files**: `apps/web/src/components/ui/button.tsx`
- **Tags**: radix-ui, components, react, slot, frontend

### [2026-10-26] Bug: Missing accessible name on ARIA progressbar
- **Symptom**: `@axe-core/playwright` audit failure on `aria-progressbar-name` (serious impact)
- **Root cause**: `role="progressbar"` was missing an explicit `aria-label` or accessible name attribute
- **Fix**: Added default `'aria-label'?: string` prop with sensible defaults ("Progress" / "Progress ring") to `ProgressBar` and `ProgressRing`
- **Files**: `apps/web/src/components/ui/progress.tsx`
- **Tags**: accessibility, a11y, aria, axe-core, wcag, frontend

---

## 2. Technical Debt Tracker

_Format for recording deliberate shortcuts:_

```markdown
### [YYYY-MM-DD] Debt: <what is suboptimal>

- **Section**: Architecture / Media / Auth / Database / Frontend
- **Current shortcut**: why it was taken
- **Planned fix**: concrete solution when time/budget allows
- **Trigger**: condition to prioritize refactoring
```
