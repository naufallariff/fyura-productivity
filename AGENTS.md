# Fyura Productivity — Repository Context & Engineering Contract

Single-user personal productivity web app (`github.com/naufallariff/fyura-productivity`, branch `refactor/v2-ui-architecture`).
Stack: Next.js 16.4.5 (App Router, Cache Components, `proxy.ts`), React 19.3, TypeScript strict, Tailwind CSS v4, Drizzle ORM, Supabase PostgreSQL (`FORCE RLS`), Auth.js v5, TanStack Query v5, `dnd-kit`, Zod v4.

## ACTIVE EXECUTION MODE: BATCH EXECUTION (v2 UI & Security Overhaul)

- Source code, tests, and documentation may be updated within the active batch on `refactor/v2-ui-architecture`. Follow the architectural boundaries below and keep the execution tracker current.
- This mode supersedes the phase-specific write lock in `.agents/rules/00-token-governance.md`. Its file exclusions and scoped exploration rules still apply.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, and `pnpm build` before marking a batch complete. Use `pnpm.cmd` on Windows. Use the local dev server for browser UI inspection as needed.

## Git Commit Protocol

- Use Conventional Commits for every batch commit with a `type(scope): summary` subject.
- Append a blank line and the following trailer at the bottom of every batch commit message.

  `Co-authored-by: OpenAI Codex <codex@openai.com>`

## Living Documentation (Read On-Demand Only)

- Full Specification & Formulas: @docs/PRD-SRS.md
- Target Visual, Spatial & Copywriting Brief: @docs/DESIGN-BRIEF.md
- Active Audit & Refactor Tracker: @docs/REFACTOR-STATE.md
- Database Source of Truth: @server/db/schema.ts

## Architectural Boundaries (Audit Benchmark)

1. `domain/`: Pure TypeScript business rules. Zero imports from `next`, `react`, `server/`, `client/`, or `features/`.
2. `server/db/`: Drizzle repositories. Every query MUST run inside `withUser()` transaction context (`app.user_id`).
3. `server/services/`: Business use cases throwing `DomainError`.
4. `features/`: Client/Server UI and Server Actions returning `ActionResult<T>` with Zod v4 strict validation and `consumeRateLimit()`.
5. `app/`: Routing, `connection()`, `requireUser()`, and `<Suspense>` boundaries. Never call `new Date()` during render.

## Target Visual & UX Direction

- **Aesthetic Fusion**: Apple HIG clarity & tactile motion + Notion modular workspace cleanliness.
- **Color Discipline (60-30-10 Anti-Slop)**: Dual-theme (`light` and `dark` via `data-mode`) using perceptual OKLCH tokens in `app/globals.css`. 60% tinted neutral canvas, 30% stepped elevation cards, 10% calibrated categorical accents—colorful yet calm, never garish rainbow AI slop.
- **Dashboard (`/dashboard`)**: Colorful Bento Command Center with `tabular-nums`, honest baselines, and embedded Pomodoro/mini-calendar.
- **Projects (`/projects/[boardId]`)**: Trello-exact Kanban (horizontal columns, inline `+ Add a card`, checklist badges, floating bottom dock).
- **Daily Tracker (`/daily-tracker`)**: Google Calendar-exact time-blocking grid (15-min snap drag-to-create, bottom resize handle, mini-month, category dim filter).
- **Workspace & Journal (`/journal`, shell)**: Notion-style collapsible shell, `0ms` `Cmd+K` palette, and rich-text formatting toolbar.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
