# ---------- deps & build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install OpenSSL in the BUILD STAGE so Prisma detects 3.0 at generate time
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests + prisma first (so postinstall can find the schema)
COPY apps/web/package*.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma

# Tell Prisma which binary to build (bookworm uses OpenSSL 3.0)
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# Install deps (runs prisma generate)
WORKDIR /app/apps/web
RUN npm ci

# Copy the rest and build Next (standalone)
COPY apps/web/ /app/apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# OpenSSL in RUNTIME too (Prisma needs it at run time)
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone server + assets + prisma schema
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/prisma ./apps/web/prisma

# Start script
COPY apps/web/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
