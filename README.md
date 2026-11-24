# Fyura Productivity

Fyura is a private workspace for planning a week, recording how you spent your time, and reviewing what actually happened. It brings daily tracking, projects, career, learning, and journaling into one single-user app.

The v2 identity pairs the Fyura wordmark with a geometric F constructed on a 24×24 grid. The workspace and sign-in use adaptive theme colors, and the browser and Apple touch icons use the same mark.

## Features

| Workspace           | What you can do                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard           | Review weekly consistency, the 30-day trend, today's focus, project checklist progress, and career follow-ups. Open recent history from the mini-month or start a Pomodoro. |
| Daily Tracker       | Log time on a 15-minute grid, set day status, check off the frozen daily plan, and filter block history. On mobile, the drawer holds the calendar and filters.              |
| Weekly Plan         | Set weekday routines, required and core items, and planned work minutes.                                                                                                    |
| Projects            | Organize work on Kanban boards, compose cards inline, track checklists and due dates, and move between boards from BoardDock.                                               |
| Career              | Track applications, status changes, daily activities, and seven-day follow-ups.                                                                                             |
| Learning            | Manage subjects and materials, record progress, and grade standalone or material-linked review cards on an SM-2 schedule.                                                   |
| Journal and Tadabur | Write formatted entries and verse reflections with TipTap. Review the learning streak and lifetime best.                                                                    |
| Capture             | Save ideas, add tags, and filter or archive entries.                                                                                                                        |
| Private Space       | Unlock with a separate PIN to create, edit, and delete encrypted records. Lock manually or let the idle session expire.                                                     |
| Settings            | Choose Ocean, Sage, or Dusk with Light or Dark mode and set the time zone used for logical dates.                                                                           |

The desktop sidebar collapses to a 64 px rail. Mobile navigation puts the main views within reach. Open the command palette with Cmd+K or Ctrl+K for immediate navigation and quick actions.

## Architecture

Next.js 16 App Router and Cache Components, React 19, TypeScript strict mode, Tailwind CSS v4, TanStack Query, and dnd-kit power the interface. The semantic OKLCH theme uses tinted canvas, solid stepped surfaces, and limited categorical accents. Motion respects reduced-motion preferences.

| Layer                            | Responsibility                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                           | Route and metadata entry points, request-time rendering, and Suspense boundaries.                                                   |
| `features/`                      | Module UI, client queries, strict Zod schemas, and typed server actions.                                                            |
| `server/services/`               | Authenticated use cases, transaction boundaries, and stable domain errors.                                                          |
| `server/db/`                     | Drizzle schema and repositories over Supabase PostgreSQL, with transaction-local user identity and forced RLS on user-owned tables. |
| `domain/`                        | Pure rules for scoring, scheduling, local dates, and ordering.                                                                      |
| `components/`, `client/`, `lib/` | Shared UI and editor, browser query infrastructure, theme, and locale utilities.                                                    |

Google OAuth via Auth.js accepts verified allowlisted accounts. Production scripts use request-specific CSP nonces. Rich-text HTML passes through a DOMPurify allowlist. Private records use AES-256-GCM column encryption and are accessible only within an authorized PIN session.

## Getting started

Use the Node.js version in [.nvmrc](.nvmrc), pnpm 12.18.0, a Supabase database, and a Google OAuth client. The local OAuth callback is `http://localhost:3000/api/auth/callback/google`.

```powershell
pnpm.cmd install
if (-not (Test-Path -LiteralPath '.env.local')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
```

Configure local values, run `pnpm.cmd dev`, and open `http://localhost:3000`. On macOS and Linux use `pnpm` in place of `pnpm.cmd`.

| Configuration                                                           | Purpose                                                                                                           |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `APP_URL`, `DEFAULT_TIMEZONE`                                           | Application origin and fallback IANA time zone.                                                                   |
| `DATABASE_URL`, `DATABASE_URL_MIGRATE`                                  | Runtime connection as `app_runtime` through the transaction pooler, and separate migration connection.            |
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAILS` | Auth.js, Google OAuth, and permitted accounts.                                                                    |
| `PRIVATE_PIN_PEPPER`, `ENCRYPTION_KEY`, `ENCRYPTION_KEY_VERSION`        | Private PIN hashing and authenticated column encryption. Supply 64 hexadecimal characters for the encryption key. |
| `CRON_SECRET`, `SENTRY_DSN`                                             | Cron bearer authentication and optional server error reporting.                                                   |

Keep environment files and real credentials out of version control. Apply migrations to the intended database with `pnpm.cmd db:migrate`. Generate schema changes with `pnpm.cmd db:generate` and keep applied migrations immutable.

## Verification

```powershell
pnpm.cmd typecheck && pnpm.cmd lint && pnpm.cmd vitest run && pnpm.cmd build
```

Use PowerShell 7 or a Windows shell that supports `&&`. In Windows PowerShell 5, run the four commands in order and stop on failure. CI runs these checks on pushes and pull requests. Run the opt-in PostgreSQL and RLS suite with `pnpm.cmd test:db` against a migration-applied test database. Browser evidence and the remaining authenticated checks are tracked separately.

## Living documentation

- [Product Requirements](docs/PRD.md) covers workflows, functional requirements, and acceptance.
- [Software Requirements](docs/SRS.md) covers design, architecture, security, and verification contracts.
- [Refactor Tracker](docs/REFACTOR-STATE.md) records batch history, release evidence, and deferred work.
- [Changelog](CHANGELOG.md) summarizes releases.

The repository is private. Report security issues directly to the repository owner.
