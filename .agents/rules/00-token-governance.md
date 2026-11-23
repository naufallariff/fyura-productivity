---
trigger: always_on
---

# Token & Context Governance (Mandatory)

1. **Hard Blacklist (NEVER read, search, or open these files/directories):**
   - `node_modules/**`, `.next/**`, `.husky/**`, `.git/**`
   - `pnpm-lock.yaml`, `pnpm-workspace.yaml`
   - `drizzle/meta/**` (Massive JSON snapshots; read `server/db/schema.ts` instead)
   - `drizzle/000*.sql` (Historical migrations; never read unless auditing a specific RLS policy)
   - `README.md` (19.5 KB marketing/setup doc; rely on `AGENTS.md` and `docs/PRD-SRS.md`)
2. **Large File Slicing (`lib/i18n/messages/*.json` & `server/db/schema.ts`):**
   - `en.json` and `id.json` are >26 KB each. NEVER read the full file. Use `grep_search` or read specific line ranges (max 120 lines per tool call).
3. **Scoped Exploration Only:**
   - When reviewing or editing a module (e.g., `projects`), inspect ONLY `features/<module>/`, `server/services/<module>.ts`, `server/db/repositories/<module>.ts`, and `server/validation/<module>.ts`. Do not scan unrelated modules.
4. **Output Efficiency:**
   - During audit/review tasks, report findings in a compact Markdown table (`Severity | File:Line | Issue | Concrete Fix`).
   - During code generation, output complete runnable code without `// ...` placeholders, and keep explanations under 5 bullet points.
