# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# AttendX backend (Express + Prisma) — multi-stage build.
# Build context: Apps/backend
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (incl. dev) for the TypeScript build + prisma generate.
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
# Generate the Prisma client against the schema.
RUN npx prisma generate

COPY src ./src
# Type-check + emit JS to dist/.
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime image. Keeps node_modules (incl. prisma CLI + tsx) so the container
# can run migrations and the seed on first boot via docker-entrypoint.sh.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src/prisma/seed.ts ./src/prisma/seed.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
