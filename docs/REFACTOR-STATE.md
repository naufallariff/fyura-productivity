# Fyura Productivity — Audit & Refactor State

- **Branch:** `refactor/v2-ui-architecture` (branched from `main` / `refactor/redesign` @ `1ab2bef`)
- **Current Phase:** Phase 0 — Strict Read-Only Codebase & Browser UI Audit (Antigravity Free Tier)
- **Execution Mode:** Documentation & Planning Only (No source code modifications allowed)

## Baseline Status (From Commit History up to `1ab2bef`)

- [x] `T1`: `GET /api/v1/career/jobs` route added (`eee3dae`).
- [x] `T2`: Sign-out action restored (`eee3dae`).
- [ ] `T3`: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build` and record baseline output.
- [ ] `T4`: Browser UI & responsiveness check (`1280px` & `390px`) across `/dashboard`, `/daily-tracker`, `/projects`, `/journal`, `/private`.
- [ ] `U9`: Implement AES-256-GCM column encryption in `server/crypto/column-cipher.ts` (currently 11-byte stub).
- [ ] `U10`: Harden `server/cron/auth.ts` with `crypto.timingSafeEqual` and verify cron stubs.
- [ ] `U11`: Add per-request CSP nonces and security headers (`X-Frame-Options`, `Permissions-Policy`, `Referrer-Policy`) in `proxy.ts` / `next.config.ts`.

## Module Audit Checklist (Populate into `docs/AUDIT-FINDINGS.md`)

- [ ] `shell` (Sidebar, Mobile Nav, Theme Toggle, Command Palette readiness)
- [ ] `dashboard` (Bento layout, KPI cards, EWMA chart, Pomodoro/Calendar widgets)
- [ ] `projects` (Trello-exact Kanban, DnD physics, inline card creation, floating dock)
- [ ] `daily-tracker` (Google Calendar-exact 15-min drag/resize grid, mini-month, category filters)
- [ ] `journal` (Notion-style rich-text toolbar readiness, TipTap + DOMPurify migration path)
- [ ] `private` & `security` (PIN gate, session ring, `column-cipher.ts`, CSP nonces, RLS edge cases)
- [ ] `career`, `learning`, `capture`, `weekly-plan`, `settings` (Secondary modules UI/UX & contract parity)

## Generated Planning Artifacts

- [ ] `docs/AUDIT-FINDINGS.md` (All bugs, UI/UX gaps, performance bottlenecks, security findings)
- [ ] `docs/MASTER-REFACTOR-PLAN.md` (Batch-by-batch execution roadmap & prompts for Claude Sonnet/Opus 4.6)
