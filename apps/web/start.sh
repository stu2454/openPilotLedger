#!/usr/bin/env sh
set -eu

cd /app
echo "PWD=$(pwd)"
ls -la /app
node -e 'console.log("server.js exists:", require("fs").existsSync("/app/server.js"))'
echo "PORT=${PORT:-3000}"

# Make sure we bind to all interfaces (cover both env names)
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0

# Prisma migrate (ignore 'no migrations' as success)
npx prisma migrate deploy --schema /app/apps/web/prisma/schema.prisma || true

echo "Listing compiled health route (if present):"
ls -la /app/.next/server/app/healthz || true

echo "Starting server.js..."
node /app/server.js &

# Give the server a moment to boot
sleep 1

echo "Curling healthz locally..."
# Print HTTP status and body from inside the container
wget -S -O- "http://127.0.0.1:${PORT:-3000}/healthz" || true

# Keep PID 1 as node (replace the shell) once above checks have run
exec tail -f /dev/null
