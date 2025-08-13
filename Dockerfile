# =========================
# Build stage
# =========================
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Prisma needs OpenSSL during "generate" in the build step
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 1) Copy only the web package manifests + prisma first (for better caching)
COPY apps/web/package*.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma

# (Optional but recommended) Ensure Prisma builds the correct engine
# You can also set binaryTargets in schema.prisma instead.
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# 2) Install web deps (postinstall will run `prisma generate` and now finds the schema)
WORKDIR /app/apps/web
RUN npm ci

# 3) Copy the rest of the web app and build Next (standalone)
COPY apps/web/ /app/apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Sanity: fail early if schema disappears for some reason
RUN test -f /app/apps/web/prisma/schema.prisma

# =========================
# Runtime stage
# =========================
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma needs OpenSSL at runtime too
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Copy build outputs ----
# 1) Standalone server (places /app/server.js and the compiled node_modules subset)
COPY --from=build /app/apps/web/.next/standalone ./

# 2) Static assets must live at /.next/static (NOT apps/web/.next/static)
COPY --from=build /app/apps/web/.next/static ./.next/static

# 3) Public assets must live at /public (NOT apps/web/public)
COPY --from=build /app/apps/web/public ./public

# 4) Prisma schema for migrate deploy on boot
COPY --from=build /app/apps/web/prisma ./apps/web/prisma

# 5) Startup script (runs migrate deploy with explicit schema and then node server)
COPY apps/web/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Railway injects PORT. We expose 3000 as a sensible local fallback.
EXPOSE 3000

# Use our start script (Railway should have Start Command empty)
CMD ["/app/start.sh"]
