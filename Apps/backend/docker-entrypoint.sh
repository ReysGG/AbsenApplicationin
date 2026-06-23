#!/bin/sh
# Backend container entrypoint.
# Waits for the database, applies the Prisma schema, seeds on first boot,
# then starts the app.
set -e

echo "[entrypoint] Waiting for database connectivity..."
# Probe real TCP+auth connectivity using the pg driver already in node_modules.
# This separates "DB not up yet" from "schema command failed" (the latter must
# be loud, not retried forever).
until node -e "const{Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.end()).then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>/dev/null; do
  echo "[entrypoint] DB not ready yet, retrying in 3s..."
  sleep 3
done
echo "[entrypoint] Database is reachable."

# Apply the schema (this project uses db push, not migrations).
# Prisma 7 removed --skip-generate; the client is already generated at build.
echo "[entrypoint] Applying schema (prisma db push)..."
npx prisma db push --accept-data-loss
echo "[entrypoint] Schema applied."

# Idempotent seed of the demo workspace + accounts.
if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Running seed (idempotent)..."
  node dist/prisma/seed.js || echo "[entrypoint] Seed skipped/failed (non-fatal)."
fi

echo "[entrypoint] Starting backend: $*"
exec "$@"
