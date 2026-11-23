# Fyura Productivity — Repository Context & Engineering Contract

Single-user personal productivity web app (`github.com/naufallariff/fyura-productivity`, branch `refactor/v2-ui-architecture`).
Stack: Next.js 16.4.5 (App Router, Cache Components, `proxy.ts`), React 19.3, TypeScript strict, Tailwind CSS v4, Drizzle ORM, Supabase PostgreSQL (`FORCE RLS`), Auth.js v5, TanStack Query v5, `dnd-kit`, Zod v4.

## ACTIVE EXECUTION MODE: STRICT READ-ONLY AUDIT & PLANNING

- **DO NOT** create, edit, refactor, or delete any source code files (`app/**`, `features/**`, `components/**`, `server/**`, `domain/**`, `client/**`, `lib/**`, `proxy.ts`, `next.config.ts`).
- **ONLY** write or update Markdown documentation inside `docs/**` (`docs/REFACTOR-STATE.md`, `docs/AUDIT-FINDINGS.md`, `docs/MASTER-REFACTOR-PLAN.md`).
- Terminal commands are restricted to non-mutating verification checks (`pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`) and starting the local dev server for browser UI inspection.

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
