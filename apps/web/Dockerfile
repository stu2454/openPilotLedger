# apps/web/Dockerfile
FROM node:20-bookworm

WORKDIR /app

# 1) Copy manifests only
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# 2) Install deps with scripts disabled (avoids prisma on half-built image)
RUN --mount=type=cache,target=/root/.npm \
    ( [ -f pnpm-lock.yaml ] && npm i -g pnpm && pnpm i --frozen-lockfile --ignore-scripts ) || \
    ( [ -f yarn.lock ] && corepack enable && yarn install --frozen-lockfile --ignore-scripts ) || \
    ( [ -f package-lock.json ] && npm ci --ignore-scripts ) || \
    npm install --ignore-scripts

# 3) Copy the rest (now prisma/ is included)
COPY . .

# 4) Now run prisma generate explicitly
RUN npx prisma generate

EXPOSE 3000
