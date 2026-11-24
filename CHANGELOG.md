# Changelog

## [2.0.0] · 2026-11-24

### Added

- A geometric Fyura mark shared by the sidebar, sign-in wordmark, browser icon, and Apple touch icon.
- A collapsible desktop shell, mobile navigation, and instant Cmd+K and Ctrl+K command palette for views and quick actions.
- A Bento dashboard with four tonal KPIs, an EWMA sparkline, checklist and active project progress, a mini-month, and an embedded Pomodoro.
- A mobile Daily Tracker drawer with mini-month, category controls, and segmented day status. The grid has a 20 px resize hit area.
- BoardDock actions and shortcuts, multiline inline card creation, persisted due-date sorting, and confirmed list deletion.
- TipTap formatting, HTTPS links, and slash commands for Journal and Tadabur. Existing plain-text entries retain their format.
- PIN-gated encrypted record CRUD in Private Space and a visible idle-session countdown.
- Subject and material selection for review cards, with standalone cards still available. The journal now displays the shared level-aware learning flame.

### Changed

- The interface uses OKLCH primitive, semantic, and component tokens across three palettes and Light and Dark modes. Theme switching applies immediately. Solid surfaces, scoped glass, and composited motion support readability and reduced preferences.
- Dashboard values explain their baseline. Calibration uses seven recorded days with scored items. Focus targets use planned Work minutes.
- Secondary workspace views use consistent spacing, controls, and empty states. The tracker uses a consistent `today` prop and the obsolete archived-habit error code was removed.
- The [PRD](docs/PRD.md), [SRS](docs/SRS.md), and [refactor tracker](docs/REFACTOR-STATE.md) are the living documentation. Engineering rules and workflows follow the v2 architecture.

### Security and data

- Proxy adds per-request CSP nonces and defensive headers. Cron routes validate bearer credentials with a timing-safe comparison.
- DOMPurify enforces a shared HTML whitelist on both the write and render paths.
- The AES-256-GCM column cipher authenticates its version prefix and uses fresh IVs. Migration `0009_typical_warpath.sql` creates the forced-RLS private records table and adds format flags for existing journal and reflection content.

### Verification

- The owner applied migration `0009` and reported 79 passing database and RLS tests across 12 files.
- Public and read-only authenticated Playwright checks passed at 1280×800 and 390×844. The static viewport and development CSP fixes closed [U8](docs/REFACTOR-STATE.md#requirements-follow-ups).
