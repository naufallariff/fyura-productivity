---
description: Plan and verify a bounded change to the v2 baseline.
---

# Plan a change

1. Establish the user outcome, scope, and acceptance checks from @docs/PRD.md and @docs/SRS.md. Consult @docs/REFACTOR-STATE.md for known gaps.
2. Inspect the owning entry points and dependencies with codebase-memory and scoped reads. Follow @.agents/rules/00-token-governance.md and check the installed Next.js guide for framework changes.
3. Plan the smallest end-to-end change that preserves existing callers and data. Address applicable validation, authorization, migration compatibility, retries, and concurrency. Plan functional UI states, semantic tokens, and reduced motion for interface changes.
4. On Windows run `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd vitest run`, and `pnpm.cmd build` in order. Run focused Playwright checks and, for database changes, the opt-in suite against the migration-applied test database. Record gaps in the tracker.
5. Implement when asked. For an authorized commit, use Conventional Commits and the co-author trailer in @AGENTS.md, then immediately run codebase-memory `index_repository`.
