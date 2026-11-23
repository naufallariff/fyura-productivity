---
description: Read-only codebase & browser audit to produce AUDIT-FINDINGS.md and MASTER-REFACTOR-PLAN.md for Claude Sonnet/Opus 4.6 execution.
---

# Deep Codebase & UI Architecture Planner (Read-Only, Low-Token)

1. **Load Context**: Read `@AGENTS.md`, `@docs/DESIGN-BRIEF.md`, and `@docs/REFACTOR-STATE.md`.
2. **Strict Token Discipline**: Follow `.agents/rules/00-token-governance.md`. NEVER read `pnpm-lock.yaml`, `drizzle/meta/**`, `node_modules/**`, or full `en.json`/`id.json` files.
3. **Codebase & Technical Gap Audit**:
   - Inspect `app/globals.css`, `components/shell/*`, `components/ui/*`, and key modules (`dashboard`, `projects`, `daily-tracker`, `journal`, `private`).
   - Inspect security & runtime boundaries (`proxy.ts`, `next.config.ts`, `server/crypto/column-cipher.ts`, `server/cron/auth.ts`).
   - Run `pnpm typecheck` and `pnpm lint` in terminal to capture any existing static errors.
4. **Live Browser UI & Ergonomics Audit**:
   - Ensure local dev server is running (`pnpm dev`), then inspect `/dashboard`, `/projects`, `/daily-tracker`, `/journal`, and `/private` in Chrome at both desktop (`1280x800`) and mobile (`390x844`) viewports.
   - Capture console errors, layout clipping, contrast issues, animation jank, and interaction gaps against `@docs/DESIGN-BRIEF.md`.
5. **Generate Deliverable 1 — `@docs/AUDIT-FINDINGS.md`**:
   - Categorize all findings by severity (`CRITICAL / HIGH / MEDIUM / LOW`) across 4 pillars:
     1. _UI/UX & Aesthetic Gaps_ (Apple HIG cleanliness + Notion workspace modularity, 60-30-10 colorful balance without AI slop, spacing/ratio grid, natural non-cliché copywriting without em-dashes).
     2. _Functional Gaps_ (Trello-exact Kanban interactions, Google Calendar-exact 15-min drag/resize, Notion rich-text toolbar).
     3. _Performance & Responsiveness_ (INP < 200ms, GPU-only `transform`/`opacity` animations, bundle/render bottlenecks, 390px mobile ergonomics).
     4. _Cybersecurity & Data Integrity_ (AES-256-GCM column cipher, CSP nonces, TipTap HTML sanitization, Supabase RLS edge cases).
6. **Generate Deliverable 2 — `@docs/MASTER-REFACTOR-PLAN.md`**:
   - Write an atomic, batch-by-batch execution roadmap tailored for **Claude Sonnet 4.6 / Opus 4.6**.
   - For each batch, specify: exact target files, new packages needed (with React 19 / Next.js 16 compatibility notes), visual/CSS token rules, security checks, verification commands (`pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`), and a copy-pasteable **Batch Execution Prompt**.
7. **Guardrail**: Do NOT modify any application source code (`app/`, `features/`, `components/`, `server/`, `domain/`). Update `@docs/REFACTOR-STATE.md` when finished and summarize the results in 5 concise bullet points.
