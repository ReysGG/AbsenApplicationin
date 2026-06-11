# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# AttendX website (Next.js, standalone output) — multi-stage build.
# Build context: Apps/website
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
# postinstall runs `prisma generate`; ensure the schema is present first.
COPY prisma ./prisma
COPY prisma.config.ts ./
# A dummy DATABASE_URL lets postinstall (`prisma generate`) and `next build`
# run without a live DB. Real values are injected at runtime via compose env.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
# `--legacy-peer-deps` mirrors the local install behaviour. better-auth pulls a
# peer-optional zod@^4 while the project pins zod@3; npm 10's strict resolver
# rejects this, but the optional peer is fine in practice.
RUN npm ci --legacy-peer-deps

COPY . .
# NEXT_PUBLIC_* vars must be present at build time to be embedded in client bundles.
ARG NEXT_PUBLIC_APP_URL=http://localhost:10000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime image — Next.js standalone server.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Standalone output bundles a minimal node_modules + server.js.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
