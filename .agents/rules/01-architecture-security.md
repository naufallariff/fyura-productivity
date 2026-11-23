---
trigger: glob
globs: "server/**/*.ts, domain/**/*.ts, app/api/**/*.ts, proxy.ts, next.config.ts"
---

# Backend, Database & Cybersecurity Guardrails

- Follow `@.agents/skills/software-architecture-lead/SKILL.md` and `@.agents/skills/fullstack-web-playbook/SKILL.md`.
- **Database & RLS:** Every user-owned table requires `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` (`user_id = app_current_user_id()`). Keep `prepare: false` on the Supabase pooler client.
- **Input & Query Safety:** Validate every boundary with Zod v4 `.strict()`. Escape `%` and `_` in `LIKE` queries. Enforce `https://` on user-submitted URLs.
- **Private Space:** PIN uses Argon2id + `PRIVATE_PIN_PEPPER`. Sensitive columns in `private` tables must use AES-256-GCM authenticated encryption (`server/crypto/column-cipher.ts`). Responses carry `Cache-Control: no-store`.
- **HTTP Hardening:** Enforce per-request CSP nonces in `proxy.ts`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and constant-time comparison (`crypto.timingSafeEqual`) for cron secrets.
