# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# AttendX backend (Express + Prisma) — multi-stage build.
# Build context: Apps/backend
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (incl. dev) for the TypeScript build + prisma generate.
# `--legacy-peer-deps` matches the local install behaviour: better-auth pulls a
# peer-optional zod@^4 while the project pins zod@3; npm 10's strict resolver
# rejects the optional peer that's fine in practice.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
# `prisma generate` resolves env via prisma.config.ts → needs DATABASE_URL even
# at build time (no actual DB query is made). Real value is injected at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate

COPY src ./src
# Type-check + emit JS to dist/.
RUN npm run build
# Keep only production dependencies for the runtime image. The seed is emitted
# to dist/prisma/seed.js, so tsx/typescript are not needed after build.
RUN npm prune --omit=dev --legacy-peer-deps

# ---------------------------------------------------------------------------
# Runtime image. Keeps production node_modules with the Prisma CLI so the
# container can apply schema on first boot via docker-entrypoint.sh.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
