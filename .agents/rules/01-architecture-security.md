---
trigger: glob
globs: "server/**/*.ts, domain/**/*.ts, app/api/**/*.ts, features/**/actions.ts, proxy.ts, next.config.ts"
---

# Architecture and security

Use the software-architecture-lead and fullstack-web-playbook skills and the contracts in @docs/SRS.md.

- Keep domain functions pure. Services orchestrate use cases and raise stable `DomainError` codes. Authenticate actions and handlers, validate input with strict Zod v4 schemas, and apply the shared `consumeRateLimit()` budget. Return `ActionResult<T>` from feature actions.
- Scope user-owned Drizzle operations to `withUser()` and transaction-local `app.user_id`. Apply `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` to new user-owned tables. Keep owner-aware foreign keys, restricted runtime privileges, and `prepare: false` on the transaction pooler. Preserve the narrow sign-in bootstrap.
- Parameterize SQL, escape literal `LIKE` wildcards, and validate user-entered URLs as HTTPS. Preserve per-request CSP nonces, defensive headers, and the timing-safe cron authorization path.
- Use the shared TipTap editor with server-side `sanitizeHtml()`. Sanitize before storage and render, enforce the shared HTML whitelist, and preserve legacy text handling. Keep the editor compatible with the nonce policy.
- Use the existing AES-256-GCM column cipher for new sensitive columns requiring application-layer encryption. Plan backward-readable key changes. Keep Private Space behind its PIN session guard, exclude its contents from shared caches and logs, and mark sensitive responses `no-store`.
- Use append-only migrations. Test new constraints, transaction failures, RLS, and access boundaries with the database test helpers.
