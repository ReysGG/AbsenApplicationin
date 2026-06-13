# Database Migrations (Prisma)

This backend now ships a **baseline migration** so production schema changes are
versioned and auditable (instead of relying solely on `prisma db push`).

```
prisma/
  schema.prisma
  migrations/
    migration_lock.toml        # provider = "postgresql"
    0_init/
      migration.sql            # full baseline (every table/enum/index)
```

## Why

`prisma db push` is convenient for local development but has **no migration
history and no rollback path** — risky for production (audit §10/§14, P2). The
baseline `0_init` migration captures the entire current schema so that all
future changes are produced as ordered, reviewable SQL migrations.

## Workflows

### Local development (fast iteration) — unchanged
```bash
npm run db:push      # prisma db push — sync schema without creating a migration
npm run db:seed
```

### Creating a new migration (after editing schema.prisma)
```bash
npx prisma migrate dev --name <change_name>
# generates prisma/migrations/<timestamp>_<change_name>/migration.sql and applies it
```

### Production deploy
```bash
npx prisma migrate deploy   # applies any pending committed migrations, in order
```

### Adopting migrations on an EXISTING production database
A database previously provisioned with `prisma db push` already contains the
`0_init` schema. Mark the baseline as applied so `migrate deploy` does **not**
try to re-create existing tables:
```bash
npx prisma migrate resolve --applied 0_init
# subsequent `prisma migrate deploy` runs apply only NEW migrations
```

### Regenerating the baseline (only if starting over)
```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma \
  --script --output prisma/migrations/0_init/migration.sql
```

## Docker note

`docker-entrypoint.sh` currently runs `prisma db push` on boot for the demo.
For a production image, switch that to `prisma migrate deploy` (and run
`migrate resolve --applied 0_init` once against the existing volume).
