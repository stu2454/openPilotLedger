#!/usr/bin/env sh
set -eu

cd /app
echo "[start] PWD=$(pwd)"
ls -la /app || true

export HOST=0.0.0.0
export HOSTNAME=0.0.0.0
export PORT="${PORT:-3000}"
echo "[start] Using HOST=$HOST PORT=$PORT"

export PRISMA_SCHEMA_PATH="/app/apps/web/prisma/schema.prisma"
echo "[start] Checking Prisma schema at: $PRISMA_SCHEMA_PATH"
if [ ! -f "$PRISMA_SCHEMA_PATH" ]; then
  echo "[start] ❌ Prisma schema missing. Listing dirs:"
  ls -la /app/apps/web || true
  ls -la /app/apps/web/prisma || true
  exit 1
fi

node -e 'console.log("[start] server.js exists:", require("fs").existsSync("/app/server.js"))'

echo "[start] Running prisma migrate deploy..."
npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true

echo "[start] Starting server.js..."
exec node /app/server.js
