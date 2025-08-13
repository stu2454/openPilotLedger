#!/usr/bin/env sh
set -eu

cd /app
echo "PWD=$(pwd)"
ls -la /app
node -e 'console.log("server.js exists:", require("fs").existsSync("/app/server.js"))'
echo "PORT=${PORT:-3000}"

# Run migrations (don’t fail the boot if none found)
npx prisma migrate deploy --schema /app/apps/web/prisma/schema.prisma || true

echo "Starting server.js..."
exec node /app/server.js
