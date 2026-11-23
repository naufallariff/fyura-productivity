---
description: Audit a specific module against PRD-SRS, UI/UX craft, performance, and security rules without modifying files.
---

# Module Audit Workflow (Read-Only, Low-Token)

Target module: `$ARGUMENTS`

1. Read `@docs/REFACTOR-STATE.md` to check existing notes.
2. Inspect ONLY the files inside `features/$ARGUMENTS/` and its matching `server/services/$ARGUMENTS.ts` and `app/(app)/$ARGUMENTS/page.tsx`.
3. Evaluate the module against:
   - Functional completeness in `@docs/PRD-SRS.md` (Section 9 & Section 14.3).
   - UI/UX & Motion standards in `.agents/rules/02-ui-design-motion.md`.
   - Security & TypeScript standards in `.agents/rules/01-architecture-security.md`.
4. Append the findings to `@docs/REFACTOR-STATE.md` using a concise table (`Severity | File:Line | Finding | Refactor Action`) and summarize in max 5 bullet points. Do NOT rewrite component files yet.
