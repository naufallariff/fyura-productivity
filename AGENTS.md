# Fyura Productivity Engineering Guide

Fyura is a single-user productivity workspace built with Next.js 16 App Router, Cache Components, React 19, TypeScript strict mode, Tailwind CSS v4, Drizzle, Supabase PostgreSQL, Auth.js v5, TanStack Query v5, dnd-kit, and Zod v4.

## Living documentation

- Read @docs/PRD.md for product workflows, functional requirements, and acceptance criteria.
- Read @docs/SRS.md for architecture, security, design, motion, and performance contracts.
- Consult @docs/REFACTOR-STATE.md for verification evidence and outstanding work.
- Use @server/db/schema.ts as the database schema reference.

## Engineering boundaries

1. Keep `domain/` pure TypeScript with no framework, I/O, or higher-layer imports.
2. Scope user-owned queries in `server/db/` with `withUser()` and transaction-local `app.user_id`. Apply and force RLS on owned tables. Preserve the narrow sign-in identity bootstrap.
3. Use `server/services/` for use cases and stable `DomainError` codes.
4. In `features/`, authenticate, strictly validate with Zod v4, and enforce `consumeRateLimit()` for server actions. Return `ActionResult<T>`. Use the shared TipTap editor and server-side `sanitizeHtml()` for rich text. Use the AES-256-GCM column cipher for sensitive private fields.
5. In `app/`, use `connection()`, `requireUser()`, and Suspense for request-time work. Pass derived dates into render.

Use the three-layer OKLCH system with Light and Dark modes, a two-surface glass cap, a 4 px and 8 px spacing grid, and compositor-friendly motion. Keep the command palette and theme toggle immediate. Follow @.agents/rules/00-token-governance.md for file exclusions and scoped inspection.

## Verification and commits

- On Windows run `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd vitest run`, and `pnpm.cmd build` in that order. Use `pnpm` on other platforms. Run focused browser or database checks as applicable and log gaps in the tracker.
- Use Conventional Commits. Add a blank line followed by `Co-authored-by: OpenAI Codex <codex@openai.com>` to each commit message.
- Immediately after each commit, run `index_repository` on the codebase-memory MCP for this repository.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
