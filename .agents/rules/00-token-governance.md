---
trigger: always_on
---

# Repository context and verification

- Read @AGENTS.md and the relevant sections of @docs/PRD.md, @docs/SRS.md, and @docs/REFACTOR-STATE.md. Start with codebase-memory for symbols and dependencies, then read owning source and focused tests.
- Never inspect or search any `.env*` file, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or `drizzle/meta/**`. Normal app and package commands can load their configuration internally. Use the server environment schema and package manifest for names and declared versions.
- Exclude `.next/**`, `.husky/**`, `.git/**`, and `node_modules/**` from source searches. Read the relevant installed Next.js guide under `node_modules/next/dist/docs/` as required by @AGENTS.md. Use Git commands for history and diffs.
- Read only targeted matches or ranges of at most 120 lines from the English and Indonesian catalogs and `server/db/schema.ts`. Open historical migration SQL only for a specific migration or policy investigation.
- On Windows run `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd vitest run`, and `pnpm.cmd build` in order. Use `pnpm` elsewhere. Run focused Playwright and database checks where applicable and record gaps.
- Follow the Conventional Commit and co-author trailer protocol in @AGENTS.md. Run codebase-memory `index_repository` immediately after each commit and verify success.
