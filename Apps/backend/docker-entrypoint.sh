#!/bin/sh
# Backend container entrypoint.
# Applies pending Prisma migrations, seeds on first boot, then starts the app.
set -e

echo "[entrypoint] Waiting for database..."
# `prisma db push` applies the schema (this project uses db push, not migrations).
# It retries until Postgres accepts connections.
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; do
  echo "[entrypoint] DB not ready yet, retrying in 3s..."
  sleep 3
done
echo "[entrypoint] Schema applied (prisma db push)."

# Seed only when the workspace table is empty (idempotent seed is also safe).
if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Running seed (idempotent)..."
  npx tsx src/prisma/seed.ts || echo "[entrypoint] Seed skipped/failed (non-fatal)."
fi

echo "[entrypoint] Starting backend: $*"
exec "$@"
