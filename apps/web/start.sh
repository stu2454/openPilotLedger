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
  npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true
else
  echo "[start] ⚠️  Prisma schema missing at $PRISMA_SCHEMA_PATH (continuing without migrate)"
  ls -al /app/apps/web/prisma 2>/dev/null || true
fi

# Optional: one-off seed (toggle via RUN_SEED=1 in Railway Variables)
if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "[start] Seeding database (direct)…"
  if [ -f "/app/apps/web/prisma/seed.cjs" ]; then
    node /app/apps/web/prisma/seed.cjs || echo "[start] ⚠️  Seed script failed (continuing)"
  else
    echo "[start] ⚠️  Seed script not found at /app/apps/web/prisma/seed.cjs (skipping)"
    ls -al /app/apps/web/prisma 2>/dev/null || true
  fi
fi

# --- INTERNAL HEALTH SELF-CHECK (no wget/curl; use Node's fetch) ---
echo "[start] Booting Next.js temporarily to test health endpoints…"
node /app/server.js & 
TMP_PID=$!
# wait up to ~3s for the server to bind
for i in 1 2 3; do
  sleep 1
  # quick TCP check using Node; break early if port responds
  node -e "fetch('http://127.0.0.1:${PORT}/api/healthz').then(()=>process.exit(0)).catch(()=>process.exit(1))" && break || true
done

echo "[start] Health check inside container:"
node -e "
(async () => {
  for (const path of ['/api/healthz','/healthz.txt']) {
    const url = 'http://127.0.0.1:${PORT}' + path;
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log('>>> GET', path);
      console.log('STATUS', res.status);
      console.log(text);
    } catch (e) {
      console.log('>>> GET', path);
      console.log('ERROR', e?.message || e);
    }
    console.log('');
  }
})().then(()=>process.exit(0)).catch(()=>process.exit(0));
"
kill "$TMP_PID" 2>/dev/null || true
# ---------------------------------------------------------------

echo "[start] Starting Next.js (PID 1)…"
exec node /app/server.js
