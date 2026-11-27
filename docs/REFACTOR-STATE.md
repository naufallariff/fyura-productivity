# Fyura Productivity Refactor and Release Tracker

## Stage 1 revision 2 — authorized to commit and proceed, 27 November 2026

Owner rejected revision 1's palette, flat background ribbons, restrained glass and letter-shaped logo. Revision 1's passing checks are historical engineering evidence, not design acceptance. Revision 2 follows explicitly selected FigCraft nodes `5913`, `5915`, `5916`, `12393`, `24822`, `9275`. Their relevant subtrees were inspected and rendered in the open recovery document at the owner's explicit request; this does not promote the entire recovery session. The owner subsequently authorized committing the completed foundation to GitHub and proceeding to Productivity (`14276` action sheets and `5917` main screens), starting with Daily. See the [current roadmap](REFACTOR-ROADMAP.md).

- Exact source primitives now live in [foundation tokens](../lib/theme/foundation.ts): aqua `#57F6DC`, violet `#B996FF`, blue `#6ACFFF`, pink `#FF8CD8`, lime `#E4FF88`, navy `#14213D`, muted `#52617D`, canvas `#F6F9FF`. Bright action fills are separate from accessible text/link colors. Existing `ocean`, `sage`, `dusk` IDs persist; their action tones map to aqua, lime and violet. The light semantic text/canvas values derive from the same source primitives through the existing OKLCH pipeline.
- Rebuilt the earlier shell/control presentation: floating expressive navigation glass, native five-tone glossy button family, bright/tinted/readable cards, fields, segmented controls, route tabs, dialog, tooltip and squircle avatars. The abstract three-lens symbol replaces the letter mark and visible wordmark. Daily/Weekly/Projects icons follow the selected clock/calendar/columns roles; existing routes and shortcuts remain.
- Sidebar membrane uses the exact path exported from node `27447`, with its leading-edge connection and 180 ms transition. Edge-light geometry uses the curve exported from `11836`/`11053`; flat strips are replaced by narrow cores, bloom, reflections and moving highlights. The navbar provides Pause/Resume. Reduced motion stops the animations; reduced transparency removes glass blur and decorative edges. The browser check caught and resolved a CSS-prefix/fallback ordering conflict. Bright selected controls and inputs retain readable text in dark mode.
- Final gate passed in order: `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd vitest run` (**237 passed / 50 files; 75 skipped / 11 opt-in database files**), `pnpm.cmd build`. Metadata icon routes generated; formatting and scoped whitespace checks passed.
- Edge isolated fixture passed **16 check groups**, including exact rendered aqua/navy, real neon advancement over time, Pause/Resume, membrane alignment, focus continuity, folded-group inertness, preference reload, tooltip/palette/dialog focus, mobile drawer navigation/geometry, overflow at 320/390/768/1280/1920 px, reduced settings, six theme combinations and bright-control dark-mode readability. Six screenshots were produced; desktop wide/collapsed, mobile/drawer and dark views were visually inspected. No browser exceptions or console errors. Local runner/report/previews remain under ignored `test-results/shell-foundation/`; router/actions are fixture boundaries, not authenticated/API/database proof.
- Pending: full composite-material contrast, screen-reader, browser-compatibility and animation performance/battery audits. Commit/push is now authorized; no account access, installs, migrations or deployment. Codebase-memory watched updates/coverage were observed with best-effort caveats. Daily's new UI is next; its existing logic and newly selected action sheets are being inspected before dependent work.

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
- Authenticated Playwright checks at 1280×800 and 390×844 covered Dashboard KPIs, MiniMonth and Pomodoro, the 0 ms Cmd+K palette, the immediate theme preview, Tracker controls, BoardDock, Journal formatting, and the empty Private Space keypad. The multiline composer used browser-only fixture columns on an otherwise empty board. Theme saves were intercepted, Journal drafts were unsaved, and the PIN check was render-only.
- On 2026-11-24, authenticated Playwright rechecked `/dashboard` and `/private` on `http://localhost:3000` at both viewports after the static viewport and development CSP fixes. Both returned HTTP 200 with the two media-specific theme colors and zero console or page errors. No PIN digits were entered or submitted.

## Requirements follow-ups

| Item | Status   | Outcome or completion condition                                                                                                                       |
| ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1   | Complete | Removed the unused `HABIT_ARCHIVED` code and HTTP mapping.                                                                                            |
| U2   | Complete | Tracker grid, mini-month, and mobile drawer use the `today` prop.                                                                                     |
| U3   | Complete | Board index uses cursor pagination with a load-more control.                                                                                          |
| U4   | Deferred | Preserve the lifetime best streak and late-day totals before bounding the history read. A 366-day cap changes both metrics.                           |
| U5   | Complete | Balance score stays out of the UI. Its pure function is unit-tested.                                                                                  |
| U6   | Complete | Journal renders the shared level-aware `Fire` component.                                                                                              |
| U7   | Complete | Review creation can select a subject and a paginated material or save a standalone card.                                                              |
| U8   | Complete | Public and read-only authenticated Playwright verification passed at desktop and mobile sizes. The two affected routes passed the zero-error recheck. |
| U9   | Complete | Private column cipher authenticates the version and uses fresh IVs.                                                                                   |
| U10  | Complete | Both cron routes validate a timing-safe bearer secret. Scheduled processing is deferred.                                                              |
| U11  | Complete | Proxy emits request-specific CSP nonces and security headers.                                                                                         |
| U12  | Deferred | Account export and erasure are outside the single-owner v2 baseline.                                                                                  |
| U13  | Deferred | Notification settings depend on the future notification workflow.                                                                                     |
| U15  | Deferred | Legacy redirects stay temporary until their destinations stabilize.                                                                                   |

T1 and T2 shipped the career jobs endpoint and sign-out restoration. T3 and T4 established build and browser audit evidence. T5, T6, U14, and U16 were closed during the previous redesign merge at `1ab2bef`.
