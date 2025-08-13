#!/usr/bin/env sh
set -eu

# Always run from the app root (where server.js lives)
cd /app

echo "PWD=$(pwd)"
ls -la /app || true

# Bind to all interfaces; use injected PORT (fallback 3000 for local runs)
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0
export PORT="${PORT:-3000}"
echo "Using HOST=$HOST PORT=$PORT"

# Confirm the standalone server exists
node -e 'console.log("server.js exists:", require("fs").existsSync("/app/server.js"))'

# Run migrations with explicit schema path (ignore 'no migrations' as success)
echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema /app/apps/web/prisma/schema.prisma || true

echo "Starting server.js..."
# IMPORTANT: run Node as PID 1 (foreground)
exec node /app/server.js
