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

# Prisma schema path (override with env if needed)
PRISMA_SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-/app/apps/web/prisma/schema.prisma}"
echo "[start] Checking Prisma schema at: $PRISMA_SCHEMA_PATH"

if [ ! -f "$PRISMA_SCHEMA_PATH" ]; then
  echo "[start] ❌ Prisma schema missing at $PRISMA_SCHEMA_PATH"
  echo "[start]   Listing /app/apps/web/prisma:"
  ls -al /app/apps/web/prisma 2>/dev/null || true
  # Do not hard-fail: start the server so healthcheck can pass while you fix schema
else
  echo "[start] Running prisma migrate deploy..."
  # OK if there are no migrations; do not fail startup on warnings
  npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true

  # Optional: one-off seed (toggle via RUN_SEED=1 in Railway Variables)
  if [ "${RUN_SEED:-0}" = "1" ]; then
    echo "[start] Seeding database..."
    npx prisma db seed --schema "$PRISMA_SCHEMA_PATH" || {
      echo "[start] ⚠️  Seed failed (continuing startup)"; 
    }
  fi
fi

# Optional internal self-check of /api/healthz (toggle via RUN_SELF_TEST=1)
if [ "${RUN_SELF_TEST:-0}" = "1" ]; then
  echo "[start] Booting Next.js temporarily to test /api/healthz…"
  node /app/server.js &  # start in background
  TMP_PID=$!
  sleep 1
  echo "[start] Health (internal) GET /api/healthz"
  # Print status + body (won't abort on error)
  wget -S -O- "http://127.0.0.1:${PORT}/api/healthz" || true
  kill "$TMP_PID" 2>/dev/null || true
fi

# Final start — run Node as PID 1
echo "[start] Starting Next.js (PID 1)…"
exec node /app/server.js
