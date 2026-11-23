# Fyura Productivity — Audit & Refactor State

- **Branch:** `refactor/redesign`
- **Current Phase:** Phase 0 — Read-Only Codebase Audit (Free Tier)
- **Last Verified Checks:** Pending terminal & browser audit

## Known Open Items from Initial Inspection

- [ ] `T1`: Verify `app/api/v1/career/jobs/route.ts` and check for any lingering references to `/api/v1/jobs`.
- [ ] `T2`: Verify `SignOutButton` import path (`features/auth/actions.ts` is missing; only `features/auth/auth.ts` exists).
- [ ] `T3`: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`.
- [ ] `T4`: Browser check on `/dashboard`, `/daily-tracker`, `/projects`, `/journal`, `/private` at desktop & `390px` width.
- [ ] `U9/U10/U11`: Implement `server/crypto/column-cipher.ts`, constant-time cron auth, and CSP nonces in `proxy.ts`.

## Module Audit Findings

_(Will be populated incrementally via `/audit-module <name>`)_
