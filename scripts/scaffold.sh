#!/usr/bin/env bash
# scripts/scaffold.sh
# Membuat kerangka folder dan file Fyura Productivity.
# Aman dijalankan berulang: file yang sudah ada tidak ditimpa.
set -euo pipefail

# Membuat file kosong (dan folder induknya) jika belum ada.
touch_safe() {
  mkdir -p "$(dirname "$1")"
  [ -e "$1" ] || : > "$1"
}

# File TypeScript kosong diberi `export {};` agar dianggap modul.
ts_stub() {
  touch_safe "$1"
  [ -s "$1" ] || printf 'export {};\n' > "$1"
}

# Halaman kosong diberi komponen minimal agar build Next.js tidak gagal.
page_stub() {
  touch_safe "$1"
  if [ ! -s "$1" ]; then
    cat > "$1" <<'EOF'
export default function Page() {
  return null;
}
EOF
  fi
}

# Layout kosong meneruskan children.
layout_stub() {
  touch_safe "$1"
  if [ ! -s "$1" ]; then
    cat > "$1" <<'EOF'
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
EOF
  fi
}

# Folder yang belum berisi file diberi .gitkeep.
keep() {
  mkdir -p "$1"
  [ -e "$1/.gitkeep" ] || : > "$1/.gitkeep"
}

echo "==> Membuat struktur app/"
layout_stub app/layout.tsx
touch_safe app/globals.css
page_stub app/page.tsx

# Auth (batch B)
page_stub "app/(auth)/login/page.tsx"
page_stub "app/(auth)/private-unlock/page.tsx"

# Aplikasi (fase 1 sampai 7)
layout_stub "app/(app)/layout.tsx"
for route in dashboard today plan habits focus projects career learning \
             tadabur capture journal calendar review private notifications settings; do
  page_stub "app/(app)/${route}/page.tsx"
done

# API
ts_stub "app/api/auth/[...nextauth]/route.ts"
ts_stub app/api/cron/evaluate/route.ts
ts_stub app/api/cron/notifications/route.ts
keep app/api/webhooks

echo "==> Membuat struktur components/"
for d in ui shell dashboard timeline kanban private; do
  keep "components/${d}"
done

echo "==> Membuat struktur lib/"
ts_stub lib/config/env.ts

ts_stub lib/auth/auth.ts
ts_stub lib/auth/session.ts

ts_stub lib/db/client.ts
ts_stub lib/db/schema.ts
ts_stub lib/db/tx.ts

ts_stub lib/i18n/index.ts
touch_safe lib/i18n/messages/en.json
touch_safe lib/i18n/messages/id.json

ts_stub lib/theme/tokens.ts
ts_stub lib/theme/derive.ts
ts_stub lib/theme/validate.ts
touch_safe lib/theme/presets/ocean.json
touch_safe lib/theme/presets/fyura-midnight.json

for f in types daily ewma balance fire streak warmup; do
  ts_stub "lib/scoring/${f}.ts"
done
ts_stub lib/srs/sm2.ts

ts_stub lib/crypto/pin.ts
ts_stub lib/crypto/column-cipher.ts

ts_stub lib/time/logical-date.ts
ts_stub lib/time/timezone.ts

keep lib/services
keep lib/validation
keep lib/integrations

echo "==> Membuat struktur lainnya"
ts_stub middleware.ts
ts_stub drizzle.config.ts
ts_stub vitest.config.ts
touch_safe playwright.config.ts
touch_safe README.md
keep public

touch_safe drizzle/rls/0001_rls.sql

ts_stub tests/stubs/server-only.ts
for d in scoring srs theme i18n; do
  keep "tests/${d}"
done
keep tests/e2e

echo "==> Selesai. Periksa dengan: find . -path ./node_modules -prune -o -type f -print"