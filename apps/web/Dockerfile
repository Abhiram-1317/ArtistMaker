# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis Web — Docker image (Next.js standalone)
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Install dependencies ─────────────────────────────────────────────────────

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/database/package.json packages/database/
COPY packages/database/prisma/ packages/database/prisma/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/

RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# ── Build ─────────────────────────────────────────────────────────────────────

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/ ./packages/
COPY apps/web/ apps/web/

# Build args for Next.js (baked at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

WORKDIR /app/apps/web
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
