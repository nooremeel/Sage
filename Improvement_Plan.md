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
