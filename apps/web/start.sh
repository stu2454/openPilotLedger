#!/usr/bin/env sh
set -eu

# Always run from the app root (where server.js lives)
cd /app

echo "PWD=$(pwd)"
ls -la /app || true

# Make sure Next binds to all interfaces and to the expected port
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0
export PORT=8080

# Confirm the standalone server exists
node -e 'console.log("server.js exists:", require("fs").existsSync("/app/server.js"))'

# Run migrations (ok if there are none)
echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema /app/apps/web/prisma/schema.prisma || true

echo "Starting server.js on HOST=$HOST PORT=$PORT ..."
# IMPORTANT: run as PID 1 (no backgrounding; no 'tail -f')
exec node /app/server.js
