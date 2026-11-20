## Project rules (Fyura Productivity)

- UI text, comments, and logs are in English. Use Lucide icons. Never use emoji or symbol characters in text.
- Layers: `domain/` is pure logic with no database or framework imports. `server/` is server-only. `client/` is client-only. `features/` holds UI and actions per module.
- Reads go through TanStack Query with a named cache policy from `client/query/policy.ts`. Writes go through server actions wrapped in `runAction`.
- Every query filters by `user_id`. Row Level Security is the second layer.
- Private data is never persisted to local storage and never appears in shared caches.
