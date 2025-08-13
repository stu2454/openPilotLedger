#!/usr/bin/env sh
set -eu

# Always run from the app root (where server.js lives)
cd /app

echo "PWD=$(pwd)"
ls -la /app || true

# Bind to all interfaces; use the platform-injected PORT (fallback 3000 locally)
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0
export PORT="${PORT:-3000}"

# Prisma schema absolute path (so Prisma can always find it)
export PRISMA_SCHEMA_PATH="/app/apps/web/prisma/schema.prisma"

echo "Checking Prisma schema at: $PRISMA_SCHEMA_PATH"
if [ ! -f "$PRISMA_SCHEMA_PATH" ]; then
  echo "❌ Prisma schema missing. Listing /app/apps/web:"
  ls -la /app/apps/web || true
  echo "Listing /app/apps/web/prisma:"
  ls -la /app/apps/web/prisma || true
  # Don't proceed if schema truly isn't there
  exit 1
fi

# Confirm the standalone server exists
node -e 'console.log("server.js exists:", require("fs").existsSync("/app/server.js"))'

# Run migrations (explicit schema path)
echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true

echo "Starting server.js on HOST=$HOST PORT=$PORT ..."
# IMPORTANT: run Node as PID 1
exec node /app/server.js
