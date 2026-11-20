# Fyura Productivity

[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](#testing)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/license-Private-lightgrey)](#license)

## Tech Stack

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Cache Components, `proxy.ts`) |
| UI              | React 19, Tailwind CSS 4, Lucide icons                |
| Language        | TypeScript 5 (strict)                                 |
| Data fetching   | TanStack Query 5                                      |
| Drag and drop   | dnd-kit                                               |
| Database        | PostgreSQL on Supabase, Drizzle ORM, `postgres.js`    |
| Authentication  | Auth.js 5 (Google OAuth, email allowlist)             |
| Validation      | Zod 4                                                 |
| Private PIN     | Argon2id (`@node-rs/argon2`) with server-side pepper  |
| Testing         | Vitest 5, Playwright                                  |
| Quality         | ESLint 9, Prettier, Husky, lint-staged                |
| Observability   | Sentry (optional, enabled by DSN)                     |
| Package manager | pnpm 12                                               |

## Overview

Fyura Productivity is a personal, single-user productivity system. It combines a time-blocking daily tracker, a checklist derived from a weekly plan, a consistency dashboard that explains every number it shows, a Trello-style project board, a job application tracker, a spaced-repetition learning module, a journal with reflection entries, a quick idea capture, and a private space protected by a second PIN.

It is built around one principle: **record what actually happened, not what was planned.** A plan is a reference. The log is the source of truth.

## Screens

Dashboard, daily tracker, weekly plan, projects, career, learning, journal, capture, private space, and settings. Each module is described in [Features](#features).

<!-- Replace with real screenshots before publishing. Keep them free of personal data. -->

| Daily Tracker                        | Dashboard                        |
| ------------------------------------ | -------------------------------- |
| `docs/screenshots/daily-tracker.png` | `docs/screenshots/dashboard.png` |

## Features

### Daily Tracker

- Google Calendar-style timeline, 15-minute snapping, day and week views.
- Blocks that cross midnight are stored as two linked rows and edited as a pair.
- Day status: Normal, Sick, Flexible, or Off. Status changes how a day is scored.
- Daily checklist built from the weekly plan. The first check freezes the day, so later plan edits never rewrite history.
- Focus timer with free-form durations from 1 to 240 minutes. Completed deep-work sessions create a block automatically.
- Searchable history with cursor pagination, filters in the URL, and literal text search.

### Dashboard

- Weekly consistency over planned required items only.
- 30-day trend using an exponentially weighted moving average (alpha 0.25). Days without a plan are skipped.
- Calibration: comparisons stay hidden until seven days are recorded.
- Every figure has a sentence that explains it.

### Weekly Plan

- Seven day cards with reorderable items, required and optional markers, and an optional core flag for off days.

### Projects

- Boards, lists, cards, labels, checklists, and due dates.
- Drag cards and lists with a mouse, keyboard, or the move dialog on small screens.
- Positions are computed on the server from neighbours, so concurrent edits never collide.

### Career

- Application board and table with seven statuses. Every status change is recorded as an event.
- Follow-up flag for open applications unchanged for seven days.
- Daily activity counters per activity type.

### Learning

- Subjects with a soft work-in-progress limit of three active subjects. Going over the limit warns and never blocks.
- Materials with total units, progress logged per day (replacing that day's figure, never adding to it), and a total guard.
- Review queue using the SM-2 algorithm. Answers are graded 0 to 5, and concurrent answers for the same card are serialized by row locking.
- Two-step permanent deletion: archive first, then delete. Review cards are kept as standalone cards.

### Journal and Tadabur

- Daily entries with five types. Entries written more than a day after their date are marked late, never rejected.
- Learning streak: a day counts only when a Learning block and a Learning entry share the same date.
- Reflection entries by surah and verse range, with filters.

### Capture

- Quick ideas with Inbox, Active, and Archived states, tags, literal search, and a tag cloud.

### Private Space

- Six-digit PIN hashed with Argon2id and a server-side pepper.
- Progressive lockout after five failed attempts.
- Ten-minute session in an HMAC-signed cookie, extended while active, with an idle guard.
- Private data is excluded from the dashboard and from all shared views.

### Settings

- Colour bundles (Ocean, Sage, Dusk) in light or dark mode. Bundle changes the base palette only, so text and status colours stay fixed.
- Per-account time zone with a suggestion from the device. Every "today" in the app follows this zone.

## Architecture

```
Browser
  │
  ├── Server components ─────── render with requireUser() and connection()
  ├── Server actions ─────────── writes, wrapped in runAction, rate limited
  └── Route handlers (/api/v1) ─ reads for TanStack Query, validated responses
          │
          ▼
    Services (server/services)     use cases, DomainError with stable codes
          │
          ▼
    Repositories (server/db)       Drizzle queries, always inside withUser()
          │
          ▼
    PostgreSQL (Supabase)          RLS with FORCE on every user table
```

### Layers and dependency rules

| Folder        | Responsibility                                           | May import                                                        |
| ------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `domain/`     | Pure rules: scoring, time, SM-2, tags, status, positions | Nothing outside `domain/`                                         |
| `server/`     | Services, repositories, validation, auth, private gate   | `domain/`, `server/`                                              |
| `client/`     | Query client, cache policies, hooks, persistence         | `domain/`, `client/`                                              |
| `features/`   | Module UI and server actions                             | `domain/`, `client/`, `components/`, `lib/`, types from `server/` |
| `components/` | Shared UI primitives and shell                           | `lib/`, `components/`                                             |
| `lib/`        | i18n, theme, navigation, UI helpers                      | `lib/`, `domain/` types                                           |

Domain code has no framework dependency, so every scoring rule is unit-tested without a database.

### Request lifecycle

**Read during render.** `requireUser()` verifies the session. The service runs inside `withUser`, which sets `app.user_id` for the transaction. RLS filters rows at the database.

**Read from the client.** The route handler checks the session, applies a per-user read limit, runs the service, and returns JSON with `Cache-Control: private, no-cache`. The client validates the response with Zod before it enters the cache.

**Write.** A server action checks the session outside the error boundary (so redirects are never swallowed), applies the write limit, validates input in strict mode, writes in one transaction, and returns a result object with a stable error code. Optimistic updates roll back on failure.

## Data Model

27 tables in the `public` schema. Every user-owned table has a `user_id` column, row-level security enabled and forced, and one owner policy.

| Group                  | Tables                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Identity and settings  | `users`, `user_settings`, `private_pin`, `audit_log`                                                 |
| Daily                  | `day_logs`, `time_blocks`, `focus_sessions`, `journal_entries`                                       |
| Plan and checklist     | `weekly_plan_items`, `checklist_entries`                                                             |
| Projects               | `boards`, `board_lists`, `board_cards`, `board_labels`, `board_card_labels`, `board_checklist_items` |
| Capture and reflection | `ideas`, `idea_tags`, `tadabur_entries`                                                              |
| Career                 | `jobs`, `job_events`, `career_activities`                                                            |
| Learning               | `subjects`, `learning_items`, `reading_progress`, `review_cards`                                     |
| Infrastructure         | `rate_limits`                                                                                        |

### Integrity guarantees

- **Composite foreign keys** `(id, user_id)` ensure that a child row can only reference a parent owned by the same user.
- **Check constraints** enforce ranges such as minutes from 0 to 1440, surah from 1 to 114, and status enumerations.
- **Unique indexes** guarantee one row per day for daily logs, and one progress row per item per day.
- **Soft deletion** through `deleted_at` or `archived_at` for every user-facing entity. Permanent deletion is limited to archived learning items.
- **Time handling:** instants are stored as `timestamptz`, calendar days as `date`, and the user's zone is applied only at the presentation boundary.

### Security at the database

- `app_runtime` is the only role the application uses. It has no bypass privileges.
- `anon` and `authenticated` roles have all privileges revoked on the public schema, so the Supabase REST API cannot read application tables.
- `app_current_user_id()` reads the per-transaction setting. Policies compare `user_id` against it.
- `FORCE ROW LEVEL SECURITY` makes the policy apply to the table owner too. The only exception is `users`, which must accept inserts from the login function.

## Security

| Concern        | Control                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| Sign-in        | Google OAuth. Only verified emails on an allowlist are accepted                 |
| Sessions       | JWT with a 30-day maximum age                                                   |
| Authorization  | `requireUser()` on every page and action. `apiUserId()` on every route handler  |
| Data isolation | RLS with FORCE, plus `set_config` per transaction                               |
| Private space  | Argon2id PIN with pepper, lockout, HMAC-signed short-lived session cookie       |
| Input          | Zod strict schemas at every boundary                                            |
| Responses      | `no-store` for sensitive data, `private, no-cache` for reads                    |
| Rate limits    | Fixed window per user in PostgreSQL: 60 writes and 300 reads per minute         |
| Errors         | Stable codes to the client. Only the error name reaches the logs                |
| Secrets        | Validated at startup. The app refuses to start with missing or malformed values |

Report security issues privately to the repository owner. Do not open a public issue.

## Privacy

- Private space content never reaches the dashboard, notifications, exports, or shared caches.
- Persistent browser storage refuses any private scope.
- Logs contain request identifiers and error names, never user input.
- Deleting a learning item keeps its review cards as standalone cards, so spaced-repetition history is not lost by accident.
- Time zones are stored per account and used only to compute the user's own calendar days.

## Internationalization

- English is the source language. Indonesian is a complete second locale.
- Every message key exists in both catalogues. A test fails the build when a key is missing or a placeholder changes.
- Dates, numbers, and percentages use `Intl` with the active locale.
- Interface text uses words only. No emoji or decorative symbols.

## Accessibility and Motion

- Target conformance: WCAG 2.2 AA.
- Touch targets are at least 44 px.
- Animations use only `transform` and `opacity`, and respect `prefers-reduced-motion`.
- `prefers-reduced-transparency` replaces glass surfaces with solid ones.
- Keyboard alternatives exist for every drag interaction.

## Getting Started

### Prerequisites

- Node.js matching `.nvmrc`
- pnpm 12.18.0
- A Supabase project (PostgreSQL) and a Google OAuth client

### Installation

```bash
git clone https://github.com/naufallariff/fyura-productivity.git
cd fyura-productivity
pnpm install
cp .env.example .env.local
```

### Environment variables

| Variable                               | Purpose                                           |
| -------------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                         | Runtime connection through the pooler (port 6543) |
| `DATABASE_URL_MIGRATE`                 | Migration connection (port 5432)                  |
| `AUTH_SECRET`                          | Signs sessions and private-space tokens           |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth credentials                          |
| `ALLOWED_EMAILS`                       | Comma-separated list of permitted accounts        |
| `PRIVATE_PIN_PEPPER`                   | Server-side secret for PIN hashing                |
| `DEFAULT_TIMEZONE`                     | Default zone for new accounts (`Asia/Jakarta`)    |
| `SENTRY_DSN`                           | Optional error reporting                          |

Never commit `.env.local`.

### Database

```bash
pnpm db:generate   # generate a migration from src/schema, then sort its statements
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # inspect the database
```

Migrations are append-only. Never edit a migration that has already been applied.

### Run

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Development Workflow

Each change follows the same path, so every layer is verified before the next one depends on it:

1. Schema and migration
2. Pure domain rules with unit tests
3. Strict validation
4. Repository, always inside `withUser`
5. Service with stable error codes
6. Server action or route handler
7. Database tests, including RLS
8. UI with matching English and Indonesian messages
9. Verification and one commit per batch

## Testing

| Suite              | Tool                    | Command                               |
| ------------------ | ----------------------- | ------------------------------------- |
| Domain rules       | Vitest                  | `pnpm vitest run tests/domain`        |
| UI and copy        | Vitest                  | `pnpm vitest run tests/ui tests/i18n` |
| Client utilities   | Vitest                  | `pnpm vitest run tests/client`        |
| Theme contrast     | Vitest                  | `pnpm vitest run tests/theme`         |
| Database and RLS   | Vitest against Postgres | `pnpm test:db`                        |
| Message catalogues | Script                  | `pnpm tsx scripts/audit-i18n.ts`      |
| Types              | TypeScript              | `pnpm typecheck`                      |
| Lint               | ESLint                  | `pnpm lint`                           |
| End-to-end         | Playwright              | `pnpm exec playwright test`           |

Database tests require `RUN_DB_TESTS=1` and a migration-applied database. They run only through `pnpm test:db`.

## Quality Gates

Continuous integration runs lint, typecheck, unit tests, and a production build on every pull request. Branch protection requires these checks to pass before merge.

Pre-commit hooks format staged files with Prettier. Commit messages follow Conventional Commits.

## Deployment

- Target: Vercel for the Next.js application, Supabase for PostgreSQL.
- Set every variable from the table above in the hosting environment.
- Run `pnpm db:migrate` against the production database before the first deployment.
- Create the production database fresh. Development data is not migrated.

## Roadmap

| Phase                         | Scope                                                              | Status                                  |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| 0. Foundation                 | Repository, authentication, core schema, PIN gate, i18n, theme, CI | Done                                    |
| 1. Daily MVP                  | Daily tracker, checklist, focus timer, dashboard, journal          | Built, browser verification in progress |
| 2. Plan and career            | Weekly plan, projects, career                                      | Built                                   |
| 3. Learning and reflection    | Learning, SM-2, tadabur, capture                                   | Built                                   |
| 4. Private space              | Recovery log, reflection analytics                                 | Planned                                 |
| 5. Notifications and calendar | Outbox, email, in-app notices, Google Calendar                     | Planned                                 |
| 6. Review and calibration     | Weekly and monthly reviews, constant calibration                   | Planned                                 |
| 7. Expansion                  | Full Indonesian coverage, theme editor, multi-user                 | Considered                              |

## Project Structure

```
app/          routes, layouts, route handlers
features/     module UI and server actions
domain/       pure business rules
server/       services, repositories, validation, auth
client/       query client, cache, hooks
components/   shared UI primitives and shell
lib/          i18n, theme, navigation
drizzle/      migrations and snapshots
scripts/      migration sorting, message audit, migration runner
tests/        mirrors the source layout
```

## Contributing

This is a personal project and is not accepting external contributions at this time. Issues describing reproducible bugs are welcome.

## License

All rights reserved. This repository is private and not licensed for reuse.
