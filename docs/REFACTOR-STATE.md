# Fyura Productivity — Audit & Refactor State

- **Branch:** `refactor/v2-ui-architecture` (branched from `main` / `refactor/redesign` @ `1ab2bef`)
- **Current Phase:** All six core implementation batches complete
- **ACTIVE EXECUTION MODE: BATCH EXECUTION (v2 UI & Security Overhaul)**
- **Session 1 Status:** Completed on 2026-11-24 (Quality Gates, Security & Isolation Audit, Design Token Readiness)
- **Session 2 Status:** Completed on 2026-11-24 (Shell, Dashboard Bento, Daily Tracker Audit & Dev Server Startup)
- **Session 3 Status:** Completed on 2026-11-24 (Projects Kanban, Journal Rich-Text, Private Space Security, Secondary Modules Sweep, Viewport & Responsiveness Evaluation)
- **Session 4 Status:** Completed on 2026-11-24 (Master Refactor Plan synthesized — 6-batch atomic execution roadmap with verified package compatibility)

## Architectural Overview (v2 Blueprint)

1. **OKLCH 60-30-10 Dual-Theme Token System**: 3-layer architecture (Primitive → Semantic → Component) replacing all sRGB hex tokens. Perceptual color space with WCAG AA contrast validation across 3 bundles × 2 modes.
2. **2-Layer Glassmorphism Ceiling**: `backdrop-filter: blur(16px)` strictly limited to navigation shell and floating overlays. All data cards use solid stepped surfaces (`--bg-surface` + `--border-subtle` + `--shadow-card`).
3. **Security Hardening First**: AES-256-GCM column encryption (`column-cipher.ts`), per-request CSP nonces in `proxy.ts`, and DOMPurify XSS sanitization for TipTap rich-text before any visual work.
4. **GPU-Only Motion Architecture**: Custom easing curves (`--ease-out-snappy: cubic-bezier(0.23, 1, 0.32, 1)`), 0ms Command Palette, 120ms press feedback, `transform`/`opacity`/`clip-path` only. `prefers-reduced-motion` and `prefers-reduced-transparency` honoured.
5. **6-Batch Sequential Execution**: Security & Tokens → Shell & Palette → Dashboard Bento → Daily Tracker → Projects & Secondary → Journal Rich-Text & Private Encryption. Each batch is self-contained with explicit file paths, acceptance criteria, and a copy-paste execution prompt.

## Baseline and Security Milestones

- [x] `T1`: `GET /api/v1/career/jobs` route added (`eee3dae`).
- [x] `T2`: Sign-out action restored (`eee3dae`).
- [x] `T3`: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build` and record baseline output (all passed, recorded in `docs/AUDIT-FINDINGS.md`).
- [x] `T4`: Browser UI & responsiveness check (`1280px` & `390px`) across `/dashboard`, `/daily-tracker`, `/projects`, `/journal`, `/private` (Completed in Session 3).
- [x] `U9` — AES-256-GCM column cipher with an authenticated version prefix, fresh IVs, and key validation when the cipher is used.
- [x] `U10` — Module-load validation of `CRON_SECRET` and timing-safe checks on both cron routes.
- [x] `U11` — Per-request CSP nonces and security headers, with Partial Prefetching enabled in Next.js.

| PRD item | Status   | Evidence                                                                                        |
| :------- | :------- | :---------------------------------------------------------------------------------------------- |
| `U1`     | Open     | `HABIT_ARCHIVED` remains in the service error codes and HTTP status map.                        |
| `U2`     | Open     | Daily tracker calendar components still use `todayIso`.                                         |
| `U3`     | Complete | The boards index uses cursor pagination and provides a load-more control.                       |
| `U4`     | Open     | The learning streak query still reads the full history.                                         |
| `U5`     | Complete | The balance score function is covered by unit tests and has zero production callers.            |
| `U6`     | Open     | The journal streak card uses a static flame icon.                                               |
| `U7`     | Open     | Review card creation submits `itemId: null`.                                                    |
| `U8`     | Open     | The Playwright configuration is empty. The master plan tracks end-to-end test setup separately. |

## Module Audit Checklist (Populate into `docs/AUDIT-FINDINGS.md`)

- [x] `security` & `private` (PIN gate, session ring, `column-cipher.ts`, CSP nonces, RLS edge cases - Audited in Session 1 & 3)
- [x] `design-system` & `tokens` (OKLCH readiness, 60-30-10, 2-layer glass blur cap, radius/spacing scale - Audited in Session 1)
- [x] `shell` (Sidebar, Mobile Nav, Theme Toggle, Command Palette readiness - Audited in Session 2)
- [x] `dashboard` (Bento layout, KPI cards, EWMA chart, Pomodoro/Calendar widgets - Audited in Session 2)
- [x] `projects` (Trello-exact Kanban, DnD physics, inline card creation, floating dock - Audited in Session 3)
- [x] `daily-tracker` (Google Calendar-exact 15-min drag/resize grid, mini-month, category filters - Audited in Session 2)
- [x] `journal` (Notion-style rich-text toolbar readiness, TipTap + DOMPurify migration path - Audited in Session 3)
- [x] `career`, `learning`, `capture`, `weekly-plan`, `settings` (Secondary modules UI/UX & contract parity - Audited in Session 3)

## Generated Planning Artifacts

- [x] `docs/AUDIT-FINDINGS.md` (Sessions 1, 2, and 3 findings fully documented across all 8 modules and security/isolation layers)
- [x] `docs/MASTER-REFACTOR-PLAN.md` (6-batch atomic execution roadmap with verified package compatibility, OKLCH token specification, motion architecture, and self-contained execution prompts)

## Batch Execution Tracker

| Batch | Scope                                               | Status   | Verification Gate                                                              |
| :---- | :-------------------------------------------------- | :------- | :----------------------------------------------------------------------------- |
| **1** | Security Hardening & Design Token Foundation        | Complete | `pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build` |
| **2** | App Shell, Command Palette & Theme Infrastructure   | Complete | `pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build` |
| **3** | Dashboard Bento Command Center                      | Complete | `pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build` |
| **4** | Daily Tracker — Google Calendar Grid                | Complete | `pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build` |
| **5** | Projects Kanban & Secondary Module Polish           | Complete | `pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build` |
| **6** | Journal Rich-Text Editor & Private Space Encryption | Complete | `pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build` |

### Batch 1 Verification (2026-11-24)

- `pnpm.cmd typecheck` and `pnpm.cmd lint` passed with zero errors or warnings. The production build passed with Partial Prefetching enabled and zero Partial Prefetching warnings.
- `pnpm.cmd vitest run` passed all 228 enabled tests in 48 files, including cipher, cron, and WCAG 2.2 AA contrast coverage for all six bundle and mode combinations. The 73 opt-in database integration tests were skipped by the standard gate.
- Production HTTP checks confirmed unique request nonces on rendered script and style tags, all required headers on protected redirects, and both cron routes returning 401 without credentials and 501 with valid credentials. The compiled stylesheet includes solid cards, scoped glass, and a reduced-transparency fallback.
- The production script policy requires nonces and permits the configured Sentry ingest origin for connections. The style policy permits the inline style attributes used by calendar and drag interactions while requiring nonces on inline style tags.

### Batch 2 Verification (2026-11-24)

- `pnpm.cmd typecheck`, `pnpm.cmd lint`, and `pnpm.cmd build` passed. The production build used Next.js 16.4.5 with Cache Components and Partial Prefetching enabled.
- `pnpm.cmd vitest run` passed all 228 enabled tests in 48 files. The 73 opt-in database integration tests were skipped by the standard gate.
- The shell provides an animation-free command palette with ten views and four quick actions. The sidebar applies one layout update when changing between the expanded width and the 64px rail, then animates its panel using a transform. Theme mode applies immediately and saves in the background.
- Authenticated browser interactions were outside this verification run.

### Batch 3 Verification (2026-11-24)

- `pnpm.cmd typecheck`, `pnpm.cmd lint`, and `pnpm.cmd build` passed. The production build used Next.js 16.4.5 with Cache Components and Partial Prefetching enabled.
- `pnpm.cmd vitest run` passed all 228 enabled tests in 48 files, including cubic sparkline paths and KPI contrast in all six theme combinations. The standard gate skipped 73 opt-in database integration tests.
- Chrome fixture checks passed at 1280px and 390px. They covered the KPI tones, workspace layout, calendar history and controls, keyboard access to chart points, and Pomodoro mode selection and countdown. Authenticated writes were outside the fixture check.
- Calibration counts recorded days with a scored checklist. Focus targets use planned Work checklist minutes, and project progress measures checklist completion on active cards and lists.

### Batch 4 Verification (2026-11-24)

- `pnpm.cmd typecheck`, `pnpm.cmd lint`, and `pnpm.cmd build` passed. The production build used Cache Components and Partial Prefetching.
- `pnpm.cmd vitest run` passed all 228 enabled tests in 48 files. The standard gate skipped 73 opt-in database integration tests.
- Chrome fixtures at 390px and 1280px verified the mobile drawer, Escape and focus return, keyboard status selection and rollback, shared category filters, the 20px resize target, reduced motion, and the blur handoff from the sticky header to the block dialog. The fixture used mocked API responses and rejected writes.

### Batch 5 Verification (2026-11-24)

- `pnpm.cmd typecheck`, `pnpm.cmd lint`, and `pnpm.cmd build` passed. The production build used Cache Components and Partial Prefetching. It required permission to create Windows dependency junctions.
- `pnpm.cmd vitest run` passed all 228 enabled tests in 48 files. The standard gate skipped 75 opt-in database integration tests, including the new due-date sort and list deletion cases.
- Chrome fixtures at 390px and 1280px verified the dock shortcuts, popover focus and placement, 44px targets, multiline composer growth and submission, and instant theme changes with `SameSite=Lax` cookies. The fixture covered queued saves and rollback using mocked writes.
- Due-date sorting persists the order of the full active column and puts undated cards last. Confirmed list deletion removes the list and its cards.

### Batch 6 Verification (2026-11-24)

- `pnpm.cmd typecheck`, `pnpm.cmd lint`, and `pnpm.cmd build` passed. The production build used Cache Components and Partial Prefetching and required permission to create Windows dependency junctions.
- `pnpm.cmd vitest run` passed 235 tests in 50 files. The standard gate skipped 75 opt-in database tests. New tests cover HTML sanitization, private session enforcement, and encrypted record writes and reads.
- Chrome fixtures at 1280px and 390px verified slash commands, selection formatting, HTTPS links, Escape in the editor dialog, and the PIN countdown and reset. The fixtures used local component data.
- `pnpm.cmd db:generate` produced migration `0009_typical_warpath.sql`. It preserves the plaintext format of existing entries and adds `private_records` with forced row-level security. Migration application and live database verification were skipped because no local database connection was available.
