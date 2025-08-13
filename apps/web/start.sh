#!/bin/sh
set -e

echo "[start] PWD=$(pwd)"
ls -al

echo "[start] Using HOST=${HOST:-0.0.0.0} PORT=${PORT:-3000}"
echo "[start] Checking Prisma schema at: ${PRISMA_SCHEMA_PATH:-apps/web/prisma/schema.prisma}"

if [ ! -f "server.js" ]; then
  echo "[start] Error: server.js not found!"
  exit 1
fi

echo "[start] server.js exists: true"

echo "[start] Running prisma migrate deploy..."
npx prisma migrate deploy --schema "${PRISMA_SCHEMA_PATH:-apps/web/prisma/schema.prisma}"

# Optional seed step (only runs if RUN_SEED=1 in Railway variables)
if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "[start] Seeding database..."
  npx prisma db seed --schema "${PRISMA_SCHEMA_PATH:-apps/web/prisma/schema.prisma}" || {
    echo "[start] Warning: seeding failed but continuing startup..."
  }
fi

echo "[start] Starting server.js..."
node /app/server.js
