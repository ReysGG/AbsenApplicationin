import { defineConfig } from 'vitest/config'

/**
 * Integration test config — runs ONLY `*.itest.ts` files under
 * src/tests/integration against a REAL Postgres database (no Prisma mock).
 *
 * Kept separate from the default unit config (which mocks Prisma) so the
 * normal `npm test` run stays hermetic. Invoke with `npm run test:integration`
 * and a live DATABASE_URL (see .github/workflows/ci.yml → backend-integration).
 * The tests self-skip when DATABASE_URL is absent.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/integration/**/*.itest.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
