---
description: Review a module against the v2 product, architecture, security, accessibility, and performance requirements.
---

# Module audit

Scope is `$ARGUMENTS`.

1. Read the module requirements in @docs/PRD.md, its contracts in @docs/SRS.md, and relevant evidence in @docs/REFACTOR-STATE.md.
2. Follow @.agents/rules/00-token-governance.md. Trace the relevant route, UI, action, service, repository, and validation with codebase-memory. Inspect the owning source and focused tests.
3. Check the UI in Playwright at 1280×800 and 390×844. Verify functional states, keyboard navigation, focus return, reduced-motion behavior, spacing, contrast, overflow, and console and page errors. Use a disposable account for authenticated mutations and PIN lockout.
4. Check three-layer tokens, the two-glass cap, the 4 px and 8 px rhythm, and composited motion. Verify validation, rate limits, RLS, and applicable rich-text and encryption boundaries.
5. Report findings with severity, file and line, user impact, and concrete fix. Record evidence and any gaps in the tracker when requested. An audit alone is read-only.
