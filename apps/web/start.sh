#!/usr/bin/env sh
set -eu

# Always run from the app root where server.js lives
cd /app

echo "[start] PWD=$(pwd)"
ls -al || true

# Bind to all interfaces; use platform-injected PORT (fallback 3000 locally)
export HOST="${HOST:-0.0.0.0}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
echo "[start] Using HOST=$HOST PORT=$PORT"

# Prisma schema path (absolute). Override via PRISMA_SCHEMA_PATH if needed.
PRISMA_SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-/app/apps/web/prisma/schema.prisma}"
echo "[start] Checking Prisma schema at: $PRISMA_SCHEMA_PATH"

if [ -f "$PRISMA_SCHEMA_PATH" ]; then
  echo "[start] Running prisma migrate deploy..."
  # OK if there are no migrations; do not fail startup on warnings
  npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true
else
  echo "[start] ⚠️  Prisma schema missing at $PRISMA_SCHEMA_PATH (continuing without migrate)"
  echo "[start]     Listing /app/apps/web/prisma:"
  ls -al /app/apps/web/prisma 2>/dev/null || true
fi

# Optional: one-off seed (toggle via RUN_SEED=1 in Railway Variables)
# Run the seed script *directly* from its real path in the container.
if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "[start] Seeding database (direct)…"
  if [ -f "/app/apps/web/prisma/seed.cjs" ]; then
    node /app/apps/web/prisma/seed.cjs || echo "[start] ⚠️  Seed script failed (continuing)"
  else
    echo "[start] ⚠️  Seed script not found at /app/apps/web/prisma/seed.cjs (skipping)"
    ls -al /app/apps/web/prisma 2>/dev/null || true
  fi
fi

# Final start — run Node as PID 1
echo "[start] Starting Next.js (PID 1)…"
exec node /app/server.js
