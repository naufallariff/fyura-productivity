---
description: Read-only audit of a specific module (or shell/security) against PRD-SRS, Apple+Notion UI/UX craft, performance, and security rules without modifying any source code.
---

# Module Audit Workflow (Strict Read-Only, Low-Token)

Target scope: `$ARGUMENTS`

1. **Read State**: Load `@docs/REFACTOR-STATE.md` and `@docs/DESIGN-BRIEF.md` to align with target criteria.
2. **Scoped Code Inspection** (respect `.agents/rules/00-token-governance.md`):
   - If `$ARGUMENTS` is `shell`: inspect `components/shell/*`, `components/ui/*`, and `app/(app)/layout.tsx`.
   - If `$ARGUMENTS` is `security`: inspect `proxy.ts`, `next.config.ts`, `server/crypto/*`, `server/cron/*`, and `server/private/*`.
   - Otherwise (feature module such as `dashboard`, `projects`, `daily-tracker`, `journal`, `private`, `career`, `learning`, `capture`, `weekly-plan`, `settings`): inspect ONLY `features/$ARGUMENTS/`, `server/services/$ARGUMENTS.ts`, `server/db/repositories/$ARGUMENTS.ts`, and `app/(app)/$ARGUMENTS/page.tsx`.
3. **Browser UI Inspection** (for UI modules):
   - Check the corresponding route on `http://localhost:3000` at both desktop (`1280x800`) and mobile (`390x844`) viewports. Inspect visual hierarchy, spacing rhythm, contrast, console errors, and responsiveness.
4. **Evaluate Across 5 Pillars**:
   - _Functional Completeness_: Check against `@docs/PRD-SRS.md` (Section 9 & Section 14).
   - _UI/UX & Aesthetic Craft_: Check against `@docs/DESIGN-BRIEF.md` & `.agents/rules/02-ui-design-motion.md` (Apple+Notion cleanliness, 60-30-10 color balance, 4pt/8pt spatial rhythm, `tabular-nums`, natural copywriting without em-dashes).
   - _Motion & Micro-Interactions_: Verify GPU-only transforms (`transform`, `opacity`, `clip-path`), tactile press feedback, and `0ms` keyboard shortcuts.
   - _Performance_: Identify unnecessary re-renders, heavy backdrop-blur stacking, missing `<Suspense>` boundaries, or large client bundles.
   - _Security & Data Integrity_: Check Zod `.strict()` validation, XSS risks, rate limiting, and `withUser()` RLS isolation.
5. **Document Findings (No Code Edits)**:
   - Append structured findings to `@docs/AUDIT-FINDINGS.md` under `## Module: $ARGUMENTS` using a Markdown table:
     `| Severity | File:Line | Category | Finding & Root Cause | Concrete Refactor & UI Engineering Spec |`
   - Mark `$ARGUMENTS` as audited in `@docs/REFACTOR-STATE.md` and summarize in max 5 concise bullet points.
   - **STRICT RULE**: Do NOT modify any application source code files.
