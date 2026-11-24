# Fyura Productivity Refactor and Release Tracker

The [PRD](PRD.md) and [SRS](SRS.md) define the v2 baseline. This tracker records implementation, verification, and open follow-ups.

## V2 implementation history

| Batch        | Commit      | Delivered                                                                                                                                    |
| ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1            | `7456b08`   | OKLCH token foundation, solid card surfaces, scoped glass, per-request CSP nonces, timing-safe cron auth, and the AES-256-GCM column cipher. |
| 2            | `9418473`   | Collapsible sidebar and mobile shell, immediate theme switching, and the 0 ms command palette.                                               |
| 3            | `ff74152`   | Four tonal KPI cards, honest baselines, calibrated EWMA, execution log, project progress, interactive mini-month, and Pomodoro.              |
| 4            | `3a54e87`   | Mobile tracker control drawer, segmented day status, shared category filters, and the 20 px resize target.                                   |
| 5            | `1911b20`   | BoardDock and keyboard shortcuts, multiline card composer, persisted due-date sorting, confirmed list deletion, and secondary module polish. |
| 6            | `f2a5934`   | Shared TipTap editor, DOMPurify allowlist, legacy plaintext compatibility, and encrypted Private Space records.                              |
| Finalization | This change | Geometric brand mark and metadata icons, PRD triage, living documentation, and updated engineering guidance.                                 |

## Verification evidence

- Batches 1–6 passed TypeScript, lint, enabled Vitest tests, and the production build. Batches 1–4 recorded 228 enabled tests across 48 files. Batch 5 recorded 228 enabled tests. Batch 6 recorded 235 enabled tests across 50 files. The standard gate skips the opt-in database suites.
- Batch 1 production HTTP checks covered unique nonces, security headers, and the 401 and 501 cron responses. The theme tests cover all six palette and mode combinations.
- Batch 3 fixture checks covered KPI tone and layout, mini-month controls, chart keyboard navigation, and Pomodoro. Batch 4 fixtures exercised the drawer, focus return, rollback, filtering, resize target, and reduced motion. Batch 5 fixtures covered dock focus and shortcuts, board composer, theme cookies, and queued saves. Batch 6 fixtures covered editor formatting, HTTPS links, Escape, and the PIN countdown. These checks used local or mocked data.
- The owner applied migration `0009_typical_warpath.sql` and reported that all 79 database and RLS tests across 12 files passed.
- The final Windows gate on 2026-11-24 passed `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd vitest run`, and `pnpm.cmd build`. Vitest reported 235 passed tests in 50 files and skipped 75 opt-in tests in 11 files. The production build emitted both metadata icon routes.
- On 2026-11-24, Playwright MCP verified the sign-in wordmark and both PNG metadata icons on `http://localhost:3000` at 1280×800 and 390×844. Both icons returned HTTP 200 and decoded at 32×32 and 180×180 respectively. Both viewports had zero console and page errors.
- The Playwright session was redirected to sign-in for the dashboard. By release decision, authenticated checks remain pending. Future evidence should cover the sidebar brand, Light and Dark `data-mode`, the 0 ms Cmd+K palette, Dashboard KPIs, mobile Tracker drawer, BoardDock, Journal formatting persistence, and Private Space lockout and CRUD on a disposable account at both viewports.

## Requirements follow-ups

| Item | Status   | Outcome or completion condition                                                                                                                        |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U1   | Complete | Removed the unused `HABIT_ARCHIVED` code and HTTP mapping.                                                                                             |
| U2   | Complete | Tracker grid, mini-month, and mobile drawer use the `today` prop.                                                                                      |
| U3   | Complete | Board index uses cursor pagination with a load-more control.                                                                                           |
| U4   | Deferred | Preserve the lifetime best streak and late-day totals before bounding the history read. A 366-day cap changes both metrics.                            |
| U5   | Complete | Balance score stays out of the UI. Its pure function is unit-tested.                                                                                   |
| U6   | Complete | Journal renders the shared level-aware `Fire` component.                                                                                               |
| U7   | Complete | Review creation can select a subject and a paginated material or save a standalone card.                                                               |
| U8   | Pending  | Public browser checks passed. Run signed-in browser flows at both viewports and establish a repeatable E2E configuration before marking this complete. |
| U9   | Complete | Private column cipher authenticates the version and uses fresh IVs.                                                                                    |
| U10  | Complete | Both cron routes validate a timing-safe bearer secret. Scheduled processing is deferred.                                                               |
| U11  | Complete | Proxy emits request-specific CSP nonces and security headers.                                                                                          |
| U12  | Deferred | Account export and erasure are outside the single-owner v2 baseline.                                                                                   |
| U13  | Deferred | Notification settings depend on the future notification workflow.                                                                                      |
| U15  | Deferred | Legacy redirects stay temporary until their destinations stabilize.                                                                                    |

T1 and T2 shipped the career jobs endpoint and sign-out restoration. T3 and T4 established build and browser audit evidence. T5, T6, U14, and U16 were closed during the previous redesign merge at `1ab2bef`.
