# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis API — Docker image
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl curl \
    && rm -rf /var/lib/apt/lists/*

# ── Install dependencies ─────────────────────────────────────────────────────

FROM base AS deps
WORKDIR /app

# Copy workspace root for npm workspaces resolution
COPY package.json package-lock.json turbo.json ./
COPY packages/database/package.json packages/database/
COPY packages/database/prisma/ packages/database/prisma/
COPY apps/api/package.json apps/api/

RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# ── Build ─────────────────────────────────────────────────────────────────────

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY packages/database/ packages/database/
COPY apps/api/ apps/api/

WORKDIR /app/apps/api
RUN npx tsc

# ── Runtime ───────────────────────────────────────────────────────────────────

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/ ./packages/database/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
