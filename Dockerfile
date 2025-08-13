# ---------- deps & build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# 1) Copy only the web app manifests + prisma first (better caching & prisma postinstall)
COPY apps/web/package*.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma

# 2) Install deps for the web app (postinstall runs prisma generate successfully now)
WORKDIR /app/apps/web
RUN npm ci

# 3) Copy the rest of the web app and build
COPY apps/web/ /app/apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone server and assets produced by Next
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

# Prisma schema handy for migrate deploy
COPY --from=build /app/apps/web/prisma ./apps/web/prisma

EXPOSE 3000

# JSON-form CMD to forward signals properly
CMD ["sh", "-lc", "npx prisma migrate deploy && node server.js"]
