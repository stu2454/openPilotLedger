#!/usr/bin/env sh
set -eu

cd /app

echo "[start] PWD=$(pwd)"
ls -al || true

# Prefer IPv4 resolution for localhost to avoid ::1 when server is IPv4-bound
export NODE_OPTIONS="--dns-result-order=ipv4first"

# Bind to all interfaces; use platform-injected PORT (fallback 3000 locally)
export HOST="${HOST:-0.0.0.0}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
echo "[start] Using HOST=$HOST PORT=$PORT"

PRISMA_SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-/app/apps/web/prisma/schema.prisma}"
echo "[start] Checking Prisma schema at: $PRISMA_SCHEMA_PATH"

if [ -f "$PRISMA_SCHEMA_PATH" ]; then
  echo "[start] Running prisma migrate deploy..."
  npx prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true
else
  echo "[start] ⚠️  Prisma schema missing at $PRISMA_SCHEMA_PATH (continuing without migrate)"
  ls -al /app/apps/web/prisma 2>/dev/null || true
fi

# Optional one-off seed (toggle via RUN_SEED=1)
if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "[start] Seeding database (direct)…"
  if [ -f "/app/apps/web/prisma/seed.cjs" ]; then
    node /app/apps/web/prisma/seed.cjs || echo "[start] ⚠️  Seed script failed (continuing)"
  else
    echo "[start] ⚠️  Seed script not found at /app/apps/web/prisma/seed.cjs (skipping)"
    ls -al /app/apps/web/prisma 2>/dev/null || true
  fi
fi

# --- INTERNAL HEALTH SELF-CHECK (now IPv4-first for localhost) ---
echo "[start] Booting Next.js temporarily to test health endpoints…"
node /app/server.js & 
TMP_PID=$!

# wait up to ~6s for the server to bind
for i in 1 2 3 4 5 6; do
  sleep 1
  node -e "fetch('http://localhost:${PORT}/api/healthz').then(()=>process.exit(0)).catch(()=>process.exit(1))" \
    && break || true
done

CTR_HOST="$(hostname)"
echo "[start] Health check inside container:"
node -e "
(async () => {
  const hosts = ['localhost', '$CTR_HOST'];
  const paths = ['/api/healthz', '/healthz.txt'];
  for (const h of hosts) {
    for (const p of paths) {
      const url = \`http://\${h}:${PORT}\${p}\`;
      try {
        const r = await fetch(url);
        const t = await r.text();
        console.log('>>>', h, p, 'STATUS', r.status);
        console.log(t);
      } catch (e) {
        console.log('>>>', h, p, 'ERROR', (e && e.message) || e);
      }
      console.log('');
    }
  }
})().then(()=>process.exit(0)).catch(()=>process.exit(0));
"
kill "$TMP_PID" 2>/dev/null || true
# ---------------------------------------------------------------

echo "[start] Starting Next.js (PID 1)…"
exec node /app/server.js
