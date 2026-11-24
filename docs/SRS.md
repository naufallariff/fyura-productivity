# Fyura Productivity Software Requirements Specification

**Baseline** v2.0.0 · **Updated** 2026-11-24

This specification defines the implementation and verification contracts for the [product requirements](PRD.md). The [refactor tracker](REFACTOR-STATE.md) records observed results and deferred work.

## 1. System context and architecture

The browser uses a Next.js 16 App Router application with Cache Components and Partial Prefetching, React 19, TypeScript strict mode, and Tailwind CSS v4. Auth.js v5 integrates Google OAuth. Supabase PostgreSQL stores durable application state through Drizzle and postgres.js. TanStack Query manages validated client reads and optimistic writes. `dnd-kit` handles board reordering, and TipTap is the rich-text editor.

| Layer                            | Contract                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                           | Owns routing, metadata, authenticated layouts, request-time rendering, and Suspense boundaries. Use `connection()` ahead of request-specific work and `requireUser()` for protected pages. Read the clock outside render and pass a server-derived local date or instant. |
| `features/`                      | Owns module UI, DTO schemas, query hooks, and server actions. Validate at the boundary with Zod v4 strict schemas. Authenticate and call `consumeRateLimit()` for actions with the applicable budget.                                                                     |
| `server/services/`               | Orchestrates use cases, scopes database work, enforces domain and authorization rules, and maps expected failures to stable `DomainError` codes.                                                                                                                          |
| `server/db/`                     | Owns Drizzle schema, repositories, and transactions. Repositories accept a transaction obtained through `withUser()`. The dedicated sign-in upsert is the narrow cross-account bootstrap.                                                                                 |
| `domain/`                        | Pure TypeScript for scoring, dates, interval geometry, ordering, and review scheduling. Framework, I/O, and higher-layer imports are prohibited.                                                                                                                          |
| `components/`, `client/`, `lib/` | Shared UI, client query and persistence infrastructure, and reusable theme, navigation, and locale helpers. Keep server-only modules out of client bundles.                                                                                                               |

### Request and cache boundaries

1. The proxy stamps a fresh request ID and CSP nonce. A session-cookie presence check short-circuits anonymous workspace requests. The server verifies the session independently.
2. Protected server components get the current user and call services. Authenticate and read request state within the owning route's dynamic boundary. Cache Components may render a static shell where it is compatible with the page's nonce and user-data requirements.
3. JSON read handlers under `/api/v1` authenticate, validate URL and query inputs, apply the read budget, and serialize DTOs. Clients validate those DTOs before caching.
4. Server actions authenticate outside error-catching helpers so redirects can propagate. Actions return `{ ok: true, data }` or `{ ok: false, code }`. Domain failures map to stable client messages and statuses. Unexpected failures return a generic error and a redacted diagnostic.
5. Affected client caches are scoped by user ID and invalidated or reconciled after writes. Optimistic mutations restore the prior state on rejection. Sign-out clears client query and persisted user state.

### Read interfaces

Paths below are relative to `/api/v1`. Bracketed segments indicate validated IDs. Write interfaces live in the relevant feature's server actions.

| Module   | GET paths                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Plan     | `/weekly-plan`                                                                                                 |
| Tracker  | `/daily-tracker/blocks`, `/daily-tracker/checklist`, `/daily-tracker/scores`, `/daily-tracker/history`         |
| Projects | `/projects/boards`, `/projects/boards/[boardId]`, `/projects/lists/[listId]/cards`, `/projects/cards/[cardId]` |
| Career   | `/career/jobs`, `/career/jobs/[jobId]`, `/career/board`, `/career/summary`, `/career/activities`               |
| Learning | `/learning/subjects`, `/learning/items`, `/learning/reviews/due`                                               |
| Tadabur  | `/tadabur/entries`                                                                                             |
| Capture  | `/capture/ideas`, `/capture/tags`                                                                              |

Page responses use `items` and a nullable `nextCursor`. Treat the cursor as opaque and preserve a stable sort with an ID tie breaker. Common page size is 25 and the standard upper bound is 50. Date-only values use ISO `YYYY-MM-DD` strings in the user's time zone. Serialize instants with an explicit offset. Errors carry a stable `error` code and a fixed `message`.

## 2. Data architecture and integrity

[The Drizzle schema](../server/db/schema.ts) defines columns, constraints, indexes, and relationships. SQL migrations apply database policies and privileges. [The database suite](../tests/server/db) verifies the applied state.

| Area                       | Tables                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Identity and settings      | `users`, `user_settings`, `audit_log`                                                                |
| Private Space              | `private_pin`, `private_records`                                                                     |
| Daily timeline and journal | `day_logs`, `time_blocks`, `focus_sessions`, `journal_entries`                                       |
| Plan and checklist         | `weekly_plan_items`, `checklist_entries`                                                             |
| Projects                   | `boards`, `board_lists`, `board_cards`, `board_labels`, `board_card_labels`, `board_checklist_items` |
| Learning                   | `subjects`, `learning_items`, `reading_progress`, `review_cards`                                     |
| Capture and reflection     | `ideas`, `idea_tags`, `tadabur_entries`                                                              |
| Career                     | `jobs`, `job_events`, `career_activities`                                                            |
| Infrastructure             | `rate_limits`                                                                                        |

- Run the application as `app_runtime` with no RLS bypass. Use a separate migration role and disable prepared statements on the transaction pooler.
- Enable and force RLS on user-owned tables. `withUser()` validates the user UUID and sets transaction-local `app.user_id`. Policies compare ownership with `app_current_user_id()` for reads and writes. The `users` table retains RLS with a narrow exception to FORCE for the login upsert.
- Revoke application access from Supabase `anon` and `authenticated` roles. Composite owner-aware foreign keys prevent references across users even on direct repository writes.
- Store logical dates as `date` and instants as `timestamptz`. Preserve unique identities for day logs, checklist source rows, and per-material daily progress. Enforce range, status, and foreign-key constraints in PostgreSQL as well as application validation.
- Group linked writes into transactions. Use row locks, database constraints, or an explicit stale-write check where concurrent updates could violate ordering, time-block exclusions, checklist snapshots, or review grading.
- Follow each entity's archive, soft-delete, or explicit purge contract. A material purge detaches review cards, and confirmed list deletion cascades cards. Private record deletion sets `deleted_at`.
- Applied migrations are append-only. Migration `0009_typical_warpath.sql` added private records with FORCE RLS and format flags for Journal and Tadabur. Existing text continues to render as escaped text. New rich text follows the HTML contract in §3.

### Computation rules

| Area            | Rule and owning code                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checklist       | Normal plans all required entries. Flexible and Off plan required core entries. Sick plans none. Daily ratio is completed planned slots divided by planned slots, or null for zero planned slots. Weekly ratio divides aggregate completed slots by aggregate planned slots. See [checklist scoring](../domain/scoring/checklist.ts).                      |
| Dashboard trend | Use seven recorded days with a non-null score to calibrate. Seed the EWMA with the first observed ratio. Each later sample is `0.25 × daily ratio + 0.75 × previous EWMA`. Skip unscored days. See [calibration](../domain/scoring/warmup.ts) and [EWMA](../domain/scoring/ewma.ts).                                                                       |
| Dashboard focus | Compare completed deep focus with today's planned Work checklist minutes. Present an unset target explicitly. See [dashboard computation](../domain/dashboard/compute.ts).                                                                                                                                                                                 |
| Learning streak | Count consecutive dates with both a Learning block and a Learning journal entry. Start current count at today when complete, otherwise at yesterday. Best is the lifetime maximum. A late entry was created more than one logical day after its entry date. Fire thresholds are 0, 1, 7, 30, and 90 days. See [streak rules](../domain/scoring/streak.ts). |
| Reviews         | Grade 0–5 using SM-2 and store the next logical due date, ease factor, interval, and repetitions. See [SM-2](../domain/learning/sm2.ts).                                                                                                                                                                                                                   |
| Time blocks     | Centralize local-date arithmetic and 15-minute snapping in [domain time utilities](../domain/time). Preserve linked midnight rows and check conflicts atomically.                                                                                                                                                                                          |

## 3. Security and privacy requirements

| ID     | Boundary         | Requirement                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01 | Sign-in          | Accept verified Google emails on the configured allowlist. Resolve the user ID on sign-in and authorize all protected entry points using that ID. Auth.js session maximum age is 30 days.                                                                                                                                                                                                    |
| SEC-02 | Database         | Enforce transaction-local RLS as specified in §2. Parameterize SQL and escape literal wildcard characters where search uses `LIKE`.                                                                                                                                                                                                                                                          |
| SEC-03 | Input            | Apply strict Zod schemas to untrusted input and reject unknown fields at mutation boundaries. Use validated response DTOs and stable error codes.                                                                                                                                                                                                                                            |
| SEC-04 | CSP              | Issue a fresh nonce per request in [the proxy](../proxy.ts) and forward it on the request and in the response policy. Production scripts use nonce and `strict-dynamic`. Block inline script attributes and plugin objects. Require a nonce for inline style elements. Style attributes are allowed for calendar/drag geometry. Development adds `unsafe-eval` to script policy for tooling. |
| SEC-05 | Headers          | Set `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a permissions policy denying camera, microphone, and geolocation. The proxy marks Private Space as `no-store`.                                                                                                                                                       |
| SEC-06 | HTML             | Use TipTap and server-side [`sanitizeHtml()`](../server/validation/sanitize.ts) with DOMPurify before storage and again before rendering HTML. Legacy plain text stays escaped. Reject content that becomes empty after sanitization.                                                                                                                                                        |
| SEC-07 | Encryption       | Use [the column cipher](../server/crypto/column-cipher.ts) for sensitive Private Space columns. Encrypt and decrypt within the authorized server use case. Private columns fail closed when key validation or ciphertext authentication fails.                                                                                                                                               |
| SEC-08 | PIN and session  | Store six-digit PINs as Argon2id hashes with a server-side pepper. Count failures and progressively lock the gate. Recheck a user-bound private session before every record read or write. The HMAC-signed cookie has a ten-minute TTL, is HTTP-only and SameSite Strict, and is Secure in production.                                                                                       |
| SEC-09 | Cron             | Both cron handlers verify a bearer secret with `timingSafeEqual` after an equal-length check. Reject unauthorized requests. Both authorized handlers are reserved stubs returning 501 in v2.                                                                                                                                                                                                 |
| SEC-10 | Rate limits      | Use PostgreSQL fixed-window counters through [`consumeRateLimit()`](../server/api/rate-limit.ts) with 60 writes and 300 reads per minute per user. Atomically increment the relevant bucket. Return a stable rate-limit error when exhausted.                                                                                                                                                |
| SEC-11 | Caching and logs | Keep Private Space out of shared responses, query caches, persistent browser storage, and ordinary modules. Sensitive HTTP responses use `no-store`. Other authenticated JSON reads use `private, no-cache`. Logs and optional Sentry diagnostics must redact user content and secrets.                                                                                                      |
| SEC-12 | Configuration    | Validate required environment variables in [the server schema](../server/config/env.ts). Validate the 32-byte encryption key when using private columns. Store secrets in environment configuration and provision distinct values per deployment.                                                                                                                                            |

### HTML whitelist

Allowed elements are `p`, `h1`–`h3`, `strong`, `em`, `s`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `hr`, and `a`. Input attributes are limited to `href`, and retained links must parse as HTTPS. The sanitizer applies `rel="noopener noreferrer nofollow"`. It strips event handlers, inline styling, application data attributes, and unapproved elements and protocols.

### Private record encryption

`private_records` stores independent ciphertext for title and body. AES-256-GCM uses a fresh random 96-bit IV for each column encryption, a 128-bit authentication tag, and an authenticated key-version prefix. The envelope is `vN:base64(iv || ciphertext || tag)`. `ENCRYPTION_KEY` supplies the key and `ENCRYPTION_KEY_VERSION` sets the supported version. Changing the active key or version requires a migration plan that keeps existing records readable. Sanitize rich-text bodies before encryption and after authenticated decryption. A successful PIN unlock resets the failure count. An expired session or a manual lock returns the owner to the gate.

## 4. Design and motion architecture

### Token roles and layout

The OKLCH system is defined in [`lib/theme/`](../lib/theme) and applied through [`app/globals.css`](../app/globals.css). The document's `data-theme` selects Ocean, Sage, or Dusk, and `data-mode` selects Light or Dark. CSS consumes three layers in order.

1. **Primitive.** Palette seeds, neutrals, and categorical hues.
2. **Semantic.** Canvas, surface, elevated surface, ink, muted ink, accent, on-accent, borders, status, shadow, and focus roles.
3. **Component.** Contextual roles such as dashboard KPI foreground/background pairs, glass shell styles, and calendar category tints. Components consume tokens through Tailwind v4 utilities or CSS custom properties.

Use approximately 60% tinted canvas, 30% stepped solid surfaces, and 10% purposeful accents. Color supports meaning alongside text or another visible cue. Numerals in metrics and times use `tabular-nums`. Apply a 4 px grid for compact alignment and multiples of 8 px for layout rhythm. Limit glass to two visible navigation or overlay surfaces at any moment. Use solid data cards and a solid fallback when reduced transparency is requested or backdrop blur is unavailable.

Use the shared Fyura SVG in the sidebar and sign-in. Next.js metadata routes rasterize that geometry into a 32 px browser icon and 180 px Apple touch icon. The interface uses adaptive accent and on-accent roles, and metadata images carry fixed colors for independent rendering. Check the mark at the browser's 16 px display size.

### Interaction and motion

- Keep palette activation and mode changes immediate. Sidebar width may change once for layout, with any panel motion driven by transform.
- Use compositor-friendly transform and opacity for motion. Allow clip-path only when the effect is verified to remain composited. Avoid animating layout, blur, shadow, or paint-heavy properties. Drag feedback should update transform and commit structural changes at the end of the gesture.
- Use brief press feedback and shared easing tokens. Respect reduced motion by removing nonessential movement and honor reduced transparency with solid surfaces.
- Provide visible focus, semantic controls, keyboard alternatives, and focus return after dismissing dialogs or drawers. Aim for 44 px touch targets for primary controls with intentional spacing. Content fits 390 px without page-level horizontal scrolling. Wide grids and Kanban columns can scroll in their own regions.
- Render readable line lengths for long-form content. Use concise, neutral labels and give sensitive confirmations explicit action names. Maintain matching English and Indonesian catalog keys and placeholders.

## 5. Non-functional requirements and verification

| ID     | Requirement                                                                                                                                                     | Evidence                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| NFR-01 | At the 75th percentile, target LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1 for desktop and mobile individually.                                                       | Use representative authenticated journeys and collect field data where available. Track lab traces separately. |
| NFR-02 | Avoid blocking routine interactions on animations or network acknowledgments. Paginate large collections. Reserve space for streamed and loading content.       | Browser checks, performance traces, and query/service tests.                                                   |
| NFR-03 | Meet WCAG 2.2 AA. Text contrast is at least 4.5:1 for normal text and 3:1 for large text. Essential UI boundaries and icons target 3:1 against adjacent colors. | Test all three bundles in both modes. Verify keyboard access, focus, and reduced preferences in browser.       |
| NFR-04 | Check desktop at 1280×800 and mobile at 390×844. Support current Chrome, Edge, Firefox, Safari, and common mobile browsers as a compatibility target.           | Record the actual browser and viewport coverage in the tracker.                                                |
| NFR-05 | Preserve per-user data isolation, transaction atomicity, and privacy defaults through schema and feature changes.                                               | Run migration-applied database tests and review private read/write paths.                                      |
| NFR-06 | Validate locale keys and types. Keep scoring and date logic independently testable.                                                                             | Run i18n, unit, type, and domain dependency checks.                                                            |
| NFR-07 | Trace a request through a generated ID and report sanitized diagnostics only.                                                                                   | Exercise headers and log redaction tests.                                                                      |
| NFR-08 | Run typecheck, lint with zero warnings, enabled tests, and the production build before accepting code changes.                                                  | CI on push and pull request, plus the Windows-safe local gate.                                                 |

[Google Core Web Vitals](https://web.dev/articles/vitals) · [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

### Release, operations, and recovery

- On Windows use `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd vitest run`, and `pnpm.cmd build`. Use `pnpm.cmd test:db` with the intended migration-applied database and runtime role for the opt-in database and RLS suite.
- Verify the public and disposable-account user journeys with Playwright. Use actual server responses for release evidence and record fixture-only checks and gaps in the tracker.
- Keep local, preview, and production configuration separate. The deployment target is a Next.js host with Supabase PostgreSQL. Apply pending migrations through the migration connection before deploying dependent code.
- Back up database data before schema changes and keep the encryption key recoverable through protected deployment secret storage. A database backup alone cannot restore encrypted columns without the matching key version. Confirm recovery procedures before depending on them.
